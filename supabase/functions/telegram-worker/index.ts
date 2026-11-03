import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Receiver } from 'npm:@upstash/qstash@2.12.0';
import { parsePlan } from '../_shared/plan.ts';
import { processJob } from '../_shared/process-job.ts';
import type { PlanJob } from '../_shared/queue.ts';
import { saveDay, summary } from '../_shared/save-day.ts';
import { editMessage, sendMessage } from '../_shared/telegram.ts';

// Called only by QStash, up to 3 plans at once (flow control). Answering 500 makes QStash retry
// the plan a minute later.

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const receiver = new Receiver({
  currentSigningKey: Deno.env.get('QSTASH_CURRENT_SIGNING_KEY')!,
  nextSigningKey: Deno.env.get('QSTASH_NEXT_SIGNING_KEY')!,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Only QStash may call this: it signs every request with our signing keys.
  const body = await req.text();
  const signature = req.headers.get('Upstash-Signature') ?? '';
  const valid = await receiver.verify({ signature, body }).catch(() => false);
  if (!valid) return json(401, { outcome: 'rejected', reason: 'invalid QStash signature' });

  const job = JSON.parse(body) as PlanJob;
  const retried = Number(req.headers.get('Upstash-Retried') ?? '0');
  console.log('job', job.messageId, 'attempt', retried + 1);

  const result = await processJob(job, retried, {
    parse: parsePlan,
    save: (day, rawText, messageId) => saveDay(db, day, rawText, messageId),
    summary: summary as never,
    send: (chatId, text) => sendMessage(chatId, text, job.messageId),
    edit: editMessage,
  });
  // The body is what QStash shows in its logs for this delivery.
  return json(result.status, result.body);
});
