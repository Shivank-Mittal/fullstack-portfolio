import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { enqueuePlan, MAX_RETRIES, QUEUE_NAME, type PlanJob } from './queue.ts';

const job: PlanJob = {
  chatId: 7,
  text: 'Breakfast: oats',
  messageId: 11,
  sentAt: 1700000000,
  statusId: 99,
};
const env = {
  QSTASH_URL: 'https://qstash.example',
  QSTASH_TOKEN: 'secret-token',
  SUPABASE_URL: 'https://proj.supabase.co',
};

type Call = { url: string; init: RequestInit };

function recordingFetch(responses: Response[]) {
  const calls: Call[] = [];
  const fn = (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return Promise.resolve(responses[calls.length - 1] ?? new Response('{}'));
  };
  return { calls, fn: fn as typeof fetch };
}

Deno.test('makes the queue process one message at a time, then enqueues the job', async () => {
  const { calls, fn } = recordingFetch([new Response('{}'), new Response('{"messageId":"m1"}')]);

  await enqueuePlan(job, 123, (k) => env[k as keyof typeof env], fn);

  assertEquals(calls.length, 2);
  assertEquals(calls[0].url, 'https://qstash.example/v2/queues/');
  assertEquals(JSON.parse(String(calls[0].init.body)), { queueName: QUEUE_NAME, parallelism: 1 });

  assertEquals(
    calls[1].url,
    `https://qstash.example/v2/enqueue/${QUEUE_NAME}/https://proj.supabase.co/functions/v1/telegram-worker`,
  );
  const headers = new Headers(calls[1].init.headers);
  assertEquals(headers.get('Authorization'), 'Bearer secret-token');
  assertEquals(headers.get('Upstash-Deduplication-Id'), 'telegram-update-123');
  assertEquals(headers.get('Upstash-Retries'), String(MAX_RETRIES));
  assertEquals(JSON.parse(String(calls[1].init.body)), job);
});

Deno.test('only sets up the queue once per function instance', async () => {
  const { calls, fn } = recordingFetch([
    new Response('{}'),
    new Response('{}'),
    new Response('{}'),
  ]);
  await enqueuePlan(job, 124, (k) => env[k as keyof typeof env], fn);
  await enqueuePlan(job, 125, (k) => env[k as keyof typeof env], fn);
  assertEquals(calls.filter((c) => c.url.endsWith('/v2/queues/')).length, 0);
  assertEquals(calls.length, 2);
});

Deno.test('fails loudly when QStash rejects the message', async () => {
  const { fn } = recordingFetch([new Response('quota exceeded', { status: 429 })]);
  await assertRejects(
    () => enqueuePlan(job, 126, (k) => env[k as keyof typeof env], fn),
    Error,
    'QStash 429',
  );
});
