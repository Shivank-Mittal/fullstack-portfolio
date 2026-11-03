import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import {
  enqueuePlan,
  FLOW_CONTROL_KEY,
  MAX_RETRIES,
  PARALLEL_PLANS,
  RETRY_DELAY_MS,
  type PlanJob,
} from './queue.ts';

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
const getEnv = (k: string) => env[k as keyof typeof env];

type Call = { url: string; init: RequestInit };

function recordingFetch(responses: Response[]) {
  const calls: Call[] = [];
  const fn = (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return Promise.resolve(responses[calls.length - 1] ?? new Response('{}'));
  };
  return { calls, fn: fn as typeof fetch };
}

Deno.test('publishes the plan to the worker in one call', async () => {
  const { calls, fn } = recordingFetch([new Response('{"messageId":"m1"}')]);

  await enqueuePlan(job, 123, getEnv, fn);

  assertEquals(calls.length, 1);
  assertEquals(
    calls[0].url,
    'https://qstash.example/v2/publish/https://proj.supabase.co/functions/v1/telegram-worker',
  );
  assertEquals(JSON.parse(String(calls[0].init.body)), job);
});

Deno.test('runs at most PARALLEL_PLANS at once and retries after a minute', async () => {
  const { calls, fn } = recordingFetch([new Response('{}')]);

  await enqueuePlan(job, 123, getEnv, fn);

  const headers = new Headers(calls[0].init.headers);
  assertEquals(PARALLEL_PLANS, 3);
  assertEquals(RETRY_DELAY_MS, 60_000);
  assertEquals(headers.get('Upstash-Flow-Control-Key'), FLOW_CONTROL_KEY);
  assertEquals(headers.get('Upstash-Flow-Control-Value'), 'parallelism=3');
  assertEquals(headers.get('Upstash-Retries'), String(MAX_RETRIES));
  assertEquals(headers.get('Upstash-Retry-Delay'), '60000');
});

Deno.test('drops a message Telegram delivers twice and authenticates', async () => {
  const { calls, fn } = recordingFetch([new Response('{}')]);

  await enqueuePlan(job, 123, getEnv, fn);

  const headers = new Headers(calls[0].init.headers);
  assertEquals(headers.get('Upstash-Deduplication-Id'), 'telegram-update-123');
  assertEquals(headers.get('Authorization'), 'Bearer secret-token');
});

Deno.test('fails loudly when QStash rejects the message', async () => {
  const { fn } = recordingFetch([new Response('quota exceeded', { status: 429 })]);
  await assertRejects(() => enqueuePlan(job, 126, getEnv, fn), Error, 'QStash 429');
});
