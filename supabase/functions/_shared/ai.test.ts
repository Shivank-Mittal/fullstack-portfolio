import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@1';
import { completeJson } from './ai.ts';

const request = { system: 's', user: 'u', schemaName: 'n', schema: {} };

function withModels(models: string, responses: Response[], run: () => Promise<void>) {
  return async () => {
    Deno.env.set('AI_PROVIDER', 'gemini');
    Deno.env.set('AI_MODEL', models);
    Deno.env.set('AI_API_KEY', 'test-key');
    const realFetch = globalThis.fetch;
    let call = 0;
    globalThis.fetch = () => Promise.resolve(responses[call++]);
    try {
      await run();
    } finally {
      globalThis.fetch = realFetch;
    }
  };
}

const gemini = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));

Deno.test(
  'falls through busy and missing models to one that answers',
  withModels(
    'a,b,c',
    [
      new Response('busy', { status: 503 }),
      new Response('gone', { status: 404 }),
      gemini('{"ok":1}'),
    ],
    async () => {
      assertEquals(await completeJson(request), { ok: 1 });
    },
  ),
);

Deno.test(
  'when every model fails, the error names each model and why',
  withModels(
    'gemini-3.5-flash,gemini-2.5-flash',
    [new Response('busy', { status: 503 }), new Response('retired', { status: 404 })],
    async () => {
      const err = await assertRejects(() => completeJson(request));
      const message = (err as Error).message;
      assertStringIncludes(message, 'gemini-3.5-flash: Gemini 503: busy');
      assertStringIncludes(message, 'gemini-2.5-flash: Gemini 404: retired');
    },
  ),
);
