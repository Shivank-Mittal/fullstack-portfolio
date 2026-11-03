// Telegram plans go through an Upstash QStash queue: the webhook enqueues, QStash pushes each
// message to the telegram-worker function one at a time and retries it if the worker fails.

export const QUEUE_NAME = 'telegram-plans';
/** Retries after the first attempt, so a plan gets MAX_RETRIES + 1 tries in total. */
export const MAX_RETRIES = 3;

export interface PlanJob {
  chatId: number;
  text: string;
  messageId: number;
  /** Telegram's send time (unix seconds); dates without a year/day fall back to this day. */
  sentAt: number;
  /** The "Queued" status message the worker edits as it goes. */
  statusId?: number;
}

type Env = (name: string) => string | undefined;

let queueReady = false;

async function qstash(path: string, init: RequestInit, env: Env, fetchFn: typeof fetch) {
  const res = await fetchFn(`${env('QSTASH_URL')}${path}`, {
    ...init,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('QSTASH_TOKEN')}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`QStash ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

/**
 * Sends a plan to the queue. Telegram's update id is the deduplication id, so if Telegram
 * delivers the same message twice, QStash keeps only one.
 */
export async function enqueuePlan(
  job: PlanJob,
  updateId: number,
  env: Env = (name) => Deno.env.get(name),
  fetchFn: typeof fetch = fetch,
) {
  // Parallelism 1: several plans sent together are processed in order, one after another.
  if (!queueReady) {
    await qstash(
      '/v2/queues/',
      { body: JSON.stringify({ queueName: QUEUE_NAME, parallelism: 1 }) },
      env,
      fetchFn,
    );
    queueReady = true;
  }

  const workerUrl = `${env('SUPABASE_URL')}/functions/v1/telegram-worker`;
  await qstash(
    `/v2/enqueue/${QUEUE_NAME}/${workerUrl}`,
    {
      body: JSON.stringify(job),
      headers: {
        'Upstash-Deduplication-Id': `telegram-update-${updateId}`,
        'Upstash-Retries': String(MAX_RETRIES),
      },
    },
    env,
    fetchFn,
  );
}
