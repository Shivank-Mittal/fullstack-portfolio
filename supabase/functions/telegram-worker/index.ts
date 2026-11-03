import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Receiver } from 'npm:@upstash/qstash@2.12.0';
import { parsePlan } from '../_shared/plan.ts';
import { processJob } from '../_shared/process-job.ts';
import type { PlanJob } from '../_shared/queue.ts';
import { saveDay, summary } from '../_shared/save-day.ts';
import { editMessage, sendMessage } from '../_shared/telegram.ts';

// Called only by QStash, one queued plan at a time. Answering 500 makes QStash retry the plan.

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const receiver = new Receiver({
  currentSigningKey: Deno.env.get('QSTASH_CURRENT_SIGNING_KEY')!,
  nextSigningKey: Deno.env.get('QSTASH_NEXT_SIGNING_KEY')!,
});

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Only QStash may call this: it signs every request with our signing keys.
  const body = await req.text();
  const signature = req.headers.get('Upstash-Signature') ?? '';
  const valid = await receiver.verify({ signature, body }).catch(() => false);
  if (!valid) return new Response('Unauthorized', { status: 401 });

  const job = JSON.parse(body) as PlanJob;
  const retried = Number(req.headers.get('Upstash-Retried') ?? '0');
  console.log('job', job.messageId, 'attempt', retried + 1);

  const status = await processJob(job, retried, {
    parse: parsePlan,
    save: (day, rawText, messageId) => saveDay(db, day, rawText, messageId),
    summary: summary as never,
    send: sendMessage,
    edit: editMessage,
  });
  return new Response(status === 200 ? 'ok' : 'retry', { status });
});
