// Telegram plans go through Upstash QStash: the webhook publishes each plan, QStash pushes it to
// the telegram-worker function and retries it if the worker fails. Flow control keeps at most
// PARALLEL_PLANS plans in the worker at once; a plan waiting for its retry doesn't hold a slot.

export const FLOW_CONTROL_KEY = 'telegram-plans';
export const PARALLEL_PLANS = 3;
/** Retries after the first attempt, so a plan gets MAX_RETRIES + 1 tries in total. */
export const MAX_RETRIES = 3;
/** A failed plan is tried again a minute later (QStash's default backoff reaches 30 min). */
export const RETRY_DELAY_MS = 60_000;

export interface PlanJob {
  chatId: number;
  text: string;
  messageId: number;
  /** Telegram's send time (unix seconds); undated plans are saved for this day. */
  sentAt: number;
  /** The "Queued" status message the worker edits as it goes. */
  statusId?: number;
}

type Env = (name: string) => string | undefined;

/**
 * Sends a plan to the worker through QStash. Telegram's update id is the deduplication id, so if
 * Telegram delivers the same message twice, QStash keeps only one.
 */
export async function enqueuePlan(
  job: PlanJob,
  updateId: number,
  env: Env = (name) => Deno.env.get(name),
  fetchFn: typeof fetch = fetch,
) {
  const workerUrl = `${env('SUPABASE_URL')}/functions/v1/telegram-worker`;
  const res = await fetchFn(`${env('QSTASH_URL')}/v2/publish/${workerUrl}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('QSTASH_TOKEN')}`,
      'Content-Type': 'application/json',
      'Upstash-Deduplication-Id': `telegram-update-${updateId}`,
      'Upstash-Flow-Control-Key': FLOW_CONTROL_KEY,
      'Upstash-Flow-Control-Value': `parallelism=${PARALLEL_PLANS}`,
      'Upstash-Retries': String(MAX_RETRIES),
      'Upstash-Retry-Delay': String(RETRY_DELAY_MS),
    },
    body: JSON.stringify(job),
  });
  if (!res.ok) throw new Error(`QStash ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
