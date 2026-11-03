import type { Progress } from './ai.ts';
import type { ParsedDay } from './plan.ts';
import { MAX_RETRIES, type PlanJob } from './queue.ts';

const TIME_ZONE = 'Asia/Kolkata';

export interface JobDeps {
  parse(text: string, today: string, onProgress: Progress): Promise<ParsedDay[]>;
  save(day: ParsedDay, rawText: string, messageId: number): Promise<unknown>;
  summary(day: ParsedDay, saved: never): string;
  send(chatId: number, text: string): Promise<number | undefined>;
  edit(chatId: number, messageId: number, text: string): Promise<void>;
}

const plural = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

/**
 * Parses and saves one queued plan, reporting progress in the job's status message.
 * Returns the HTTP status for QStash: 200 when done, 500 to have QStash retry the job.
 * `retried` is how many times QStash has already retried this job.
 */
export async function processJob(job: PlanJob, retried: number, deps: JobDeps): Promise<number> {
  const status = async (text: string) => {
    if (job.statusId) await deps.edit(job.chatId, job.statusId, text);
    else await deps.send(job.chatId, text);
  };

  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(
      new Date(job.sentAt * 1000),
    );
    const days = await deps.parse(job.text, today, status);
    if (days.length === 0) {
      await status("That doesn't look like a meal plan, so nothing was saved.");
      return 200;
    }
    await status(`Saving ${plural(days.length)}…`);
    for (const day of days) {
      const saved = await deps.save(day, job.text, job.messageId);
      await deps.send(job.chatId, deps.summary(day, saved as never));
    }
    await status(`Done, saved ${plural(days.length)}.`);
    return 200;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`telegram-worker attempt ${retried + 1} failed:`, reason);
    await status(
      retried >= MAX_RETRIES
        ? `Couldn't save that plan after ${MAX_RETRIES + 1} tries: ${reason}`
        : `Attempt ${retried + 1} failed: ${reason}\nRetrying automatically…`,
    ).catch(() => {});
    return 500;
  }
}
