import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { processJob, type JobDeps } from './process-job.ts';
import { MAX_RETRIES, type PlanJob } from './queue.ts';
import { AllModelsFailedError } from './errors.ts';
import type { ParsedDay } from './plan.ts';

const job: PlanJob = {
  chatId: 7,
  text: 'plan text',
  messageId: 11,
  sentAt: 1793232000,
  statusId: 99,
};
const day = { plan_date: '2026-10-30', day_number: 53, meals: [] } as unknown as ParsedDay;
const busy = new AllModelsFailedError([
  { model: 'gemini-3.8-flash', status: 503, detail: 'high demand' },
  { model: 'gemini-3.1-flash', status: 404, detail: 'not found' },
]);

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
  const result = await processJob(job, 0, d);
  assertEquals(result.status, 200);
  assertEquals(result.body, {
    outcome: 'saved',
    attempt: 1,
    of: MAX_RETRIES + 1,
    days: ['2026-10-30'],
  });
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
  const result = await processJob(job, 0, d);
  assertEquals(result.status, 200);
  assertEquals(result.body.outcome, 'not_a_plan');
  assertStringIncludes(edits.at(-1)!, "doesn't look like a meal plan");
});

Deno.test('a retry shows which try it is while reading', async () => {
  const { d, edits } = deps(async (_text, _today, onProgress) => {
    await onProgress('Reading your plan with gemini-3.8-flash…');
    return [];
  });
  await processJob(job, 1, d);
  assertEquals(edits[0], 'Reading your plan with gemini-3.8-flash… (try 2 of 4)');
});

Deno.test('a failed try says why in plain words and that it will try again', async () => {
  const { d, edits } = deps(() => Promise.reject(busy));
  const result = await processJob(job, 0, d);
  assertEquals(result.status, 500);
  assertEquals(
    edits.at(-1),
    "Try 1 of 4 didn't work: gemini-3.8-flash is busy; gemini-3.1-flash is not available.\n" +
      'Trying again in 1 minute.',
  );
});

Deno.test('the response body tells QStash exactly what failed', async () => {
  const { d } = deps(() => Promise.reject(busy));
  const result = await processJob(job, 0, d);
  assertEquals(result.body, {
    outcome: 'retrying',
    attempt: 1,
    of: 4,
    reason: 'gemini-3.8-flash is busy; gemini-3.1-flash is not available',
    failures: busy.failures,
  });
});

Deno.test('the last failed try says it gave up and how to resend', async () => {
  const { d, edits } = deps(() => Promise.reject(busy));
  const result = await processJob(job, MAX_RETRIES, d);
  assertEquals(result.status, 500);
  assertEquals(result.body.outcome, 'gave_up');
  assertEquals(
    edits.at(-1),
    "Couldn't save this plan after 4 tries: gemini-3.8-flash is busy; gemini-3.1-flash is not available.\n" +
      'Send it again later, or resend it from the QStash DLQ.',
  );
});

Deno.test('without a status message it sends new messages instead of editing', async () => {
  const { d, sent, edits } = deps(() => Promise.resolve([]));
  await processJob({ ...job, statusId: undefined }, 0, d);
  assertEquals(edits.length, 0);
  assertStringIncludes(sent.at(-1)!, "doesn't look like a meal plan");
});
