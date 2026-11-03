import { assertEquals } from 'jsr:@std/assert@1';
import { z } from 'npm:zod@4.1.12';
import { AllModelsFailedError, describeFailure, providerDetail, statusLabel } from './errors.ts';

Deno.test('labels the HTTP statuses models fail with', () => {
  assertEquals(statusLabel(503), 'busy');
  assertEquals(statusLabel(500), 'busy');
  assertEquals(statusLabel(429), 'over its rate limit');
  assertEquals(statusLabel(404), 'not available');
  assertEquals(statusLabel(401), 'rejecting the API key');
  assertEquals(statusLabel(400), 'error 400');
});

Deno.test('pulls the message out of a provider error body', () => {
  const body = JSON.stringify({
    error: { code: 503, message: 'This model is currently experiencing high demand.' },
  });
  assertEquals(providerDetail(body), 'This model is currently experiencing high demand.');
  assertEquals(providerDetail('plain text failure'), 'plain text failure');
});

Deno.test('groups failed models by reason in one short sentence', () => {
  const err = new AllModelsFailedError([
    { model: 'gemini-3.8-flash', status: 503, detail: 'high demand' },
    { model: 'gemini-3.5-flash', status: 503, detail: 'high demand' },
    { model: 'gemini-3.1-flash', status: 404, detail: 'not found' },
  ]);
  assertEquals(
    describeFailure(err),
    'gemini-3.8-flash and gemini-3.5-flash are busy; gemini-3.1-flash is not available',
  );
});

Deno.test('explains an answer that does not fit the plan format', () => {
  const zodError = (() => {
    try {
      z.object({ days: z.array(z.string()) }).parse({ days: 1 });
    } catch (e) {
      return e;
    }
  })();
  assertEquals(describeFailure(zodError), "the AI's answer didn't match the plan format");
  assertEquals(
    describeFailure(new SyntaxError('Unexpected token')),
    "the AI's answer wasn't valid JSON",
  );
});

Deno.test('keeps other errors short', () => {
  assertEquals(describeFailure(new Error('x'.repeat(500))).length, 200);
  assertEquals(describeFailure('plain'), 'plain');
});
