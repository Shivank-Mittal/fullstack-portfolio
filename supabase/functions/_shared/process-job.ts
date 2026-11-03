import type { Progress } from './ai.ts';
import { AllModelsFailedError, describeFailure, type ModelFailure } from './errors.ts';
import type { ParsedDay } from './plan.ts';
import { MAX_RETRIES, RETRY_DELAY_MS, type PlanJob } from './queue.ts';

const TIME_ZONE = 'Asia/Kolkata';
const TOTAL_TRIES = MAX_RETRIES + 1;

export interface JobDeps {
  parse(text: string, today: string, onProgress: Progress): Promise<ParsedDay[]>;
  save(day: ParsedDay, rawText: string, messageId: number): Promise<unknown>;
  summary(day: ParsedDay, saved: never): string;
  send(chatId: number, text: string): Promise<number | undefined>;
  edit(chatId: number, messageId: number, text: string): Promise<void>;
}

/** What the worker answers QStash with; the body shows up in the QStash logs. */
export interface JobResult {
  status: number;
  body: {
    outcome: 'saved' | 'not_a_plan' | 'retrying' | 'gave_up';
    attempt: number;
    of: number;
    days?: string[];
    reason?: string;
    failures?: ModelFailure[];
  };
}

const plural = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
const retryIn = () => {
  const minutes = Math.round(RETRY_DELAY_MS / 60_000);
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
};

/**
 * Parses and saves one queued plan, reporting progress in the job's status message.
 * Status 200 tells QStash the job is done; 500 makes QStash retry it.
 * `retried` is how many times QStash has already retried this job.
 */
export async function processJob(job: PlanJob, retried: number, deps: JobDeps): Promise<JobResult> {
  const attempt = retried + 1;
  const status = async (text: string) => {
    if (job.statusId) await deps.edit(job.chatId, job.statusId, text);
    else await deps.send(job.chatId, text);
  };
  const progress: Progress = (text) =>
    status(retried > 0 ? `${text} (try ${attempt} of ${TOTAL_TRIES})` : text);

  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(
      new Date(job.sentAt * 1000),
    );
    const days = await deps.parse(job.text, today, progress);
    if (days.length === 0) {
      await status("That doesn't look like a meal plan, so nothing was saved.");
      return { status: 200, body: { outcome: 'not_a_plan', attempt, of: TOTAL_TRIES } };
    }
    await status(`Saving ${plural(days.length)}…`);
    for (const day of days) {
      const saved = await deps.save(day, job.text, job.messageId);
      await deps.send(job.chatId, deps.summary(day, saved as never));
    }
    await status(`Done, saved ${plural(days.length)}.`);
    return {
      status: 200,
      body: { outcome: 'saved', attempt, of: TOTAL_TRIES, days: days.map((d) => d.plan_date) },
    };
  } catch (err) {
    const reason = describeFailure(err);
    const gaveUp = retried >= MAX_RETRIES;
    console.error(`telegram-worker try ${attempt} of ${TOTAL_TRIES} failed:`, err);
    await status(
      gaveUp
        ? `Couldn't save this plan after ${TOTAL_TRIES} tries: ${reason}.\n` +
            'Send it again later, or resend it from the QStash DLQ.'
        : `Try ${attempt} of ${TOTAL_TRIES} didn't work: ${reason}.\nTrying again in ${retryIn()}.`,
    ).catch(() => {});
    return {
      status: 500,
      body: {
        outcome: gaveUp ? 'gave_up' : 'retrying',
        attempt,
        of: TOTAL_TRIES,
        reason,
        ...(err instanceof AllModelsFailedError ? { failures: err.failures } : {}),
      },
    };
  }
}
