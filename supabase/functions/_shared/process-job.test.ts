import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { processJob, type JobDeps } from './process-job.ts';
import { MAX_RETRIES, type PlanJob } from './queue.ts';
import type { ParsedDay } from './plan.ts';

const job: PlanJob = {
  chatId: 7,
  text: 'plan text',
  messageId: 11,
  sentAt: 1793232000,
  statusId: 99,
};
const day = { plan_date: '2026-10-30', day_number: 53, meals: [] } as unknown as ParsedDay;

function deps(parse: JobDeps['parse']) {
  const sent: string[] = [];
  const edits: string[] = [];
  const saved: string[] = [];
  const d: JobDeps = {
    parse,
    save: (dayToSave) => {
      saved.push(dayToSave.plan_date);
      return Promise.resolve({ meals: [], totals: {} });
    },
    summary: (dayToSay) => `Saved ${dayToSay.plan_date}`,
    send: (_chat, text) => {
      sent.push(text);
      return Promise.resolve(1);
    },
    edit: (_chat, _id, text) => {
      edits.push(text);
      return Promise.resolve();
    },
  };
  return { d, sent, edits, saved };
}

Deno.test('saves each day, sends its summary and finishes the status', async () => {
  const { d, sent, edits, saved } = deps(() => Promise.resolve([day]));
  assertEquals(await processJob(job, 0, d), 200);
  assertEquals(saved, ['2026-10-30']);
  assertEquals(sent, ['Saved 2026-10-30']);
  assertEquals(edits.at(-1), 'Done, saved 1 day.');
});

Deno.test('uses the day the message was sent, in India time, for undated plans', async () => {
  let today = '';
  const { d } = deps((_text, t) => {
    today = t;
    return Promise.resolve([]);
  });
  // 1793232000 = 2026-10-28 22:00 UTC = 2026-10-29 03:30 in India.
  await processJob(job, 0, d);
  assertEquals(today, '2026-10-29');
});

Deno.test('a message that is not a plan finishes without a retry', async () => {
  const { d, edits } = deps(() => Promise.resolve([]));
  assertEquals(await processJob(job, 0, d), 200);
  assertStringIncludes(edits.at(-1)!, "doesn't look like a meal plan");
});

Deno.test('a failure before the last attempt asks QStash to retry and says so', async () => {
  const { d, edits } = deps(() => Promise.reject(new Error('Gemini 503: busy')));
  assertEquals(await processJob(job, 0, d), 500);
  assertStringIncludes(edits.at(-1)!, 'Attempt 1 failed: Gemini 503: busy');
  assertStringIncludes(edits.at(-1)!, 'Retrying automatically');
});

Deno.test('the last failed attempt tells the user it gave up', async () => {
  const { d, edits } = deps(() => Promise.reject(new Error('Gemini 503: busy')));
  assertEquals(await processJob(job, MAX_RETRIES, d), 500);
  assertStringIncludes(edits.at(-1)!, `Couldn't save that plan after ${MAX_RETRIES + 1} tries`);
  assertStringIncludes(edits.at(-1)!, 'Gemini 503: busy');
});

Deno.test('without a status message it sends new messages instead of editing', async () => {
  const { d, sent, edits } = deps(() => Promise.resolve([]));
  await processJob({ ...job, statusId: undefined }, 0, d);
  assertEquals(edits.length, 0);
  assertStringIncludes(sent.at(-1)!, "doesn't look like a meal plan");
});
