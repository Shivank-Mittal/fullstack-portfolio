export interface JsonRequest {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}

type Provider = (req: JsonRequest, model: string, apiKey: string) => Promise<string>;

class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function post(url: string, init: RequestInit): Promise<Response> {
  const started = Date.now();
  const res = await fetch(url, { ...init, method: 'POST' });
  console.log(`AI call: ${res.status} in ${Date.now() - started}ms`);
  return res;
}

async function readJson(res: Response, provider: string) {
  if (!res.ok) {
    const body = await res.text();
    throw new ProviderError(`${provider} ${res.status}: ${body.slice(0, 500)}`, res.status);
  }
  return res.json();
}

const anthropic: Provider = async ({ system, user, schema }, model, apiKey) => {
  const res = await post('https://api.anthropic.com/v1/messages', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2026-10-21',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { format: { type: 'json_schema', schema } },
    }),
  });
  const data = await readJson(res, 'Anthropic');
  if (data.stop_reason !== 'end_turn')
    throw new Error(`Anthropic stopped early: ${data.stop_reason}`);
  return data.content
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('');
};

const openai: Provider = async ({ system, user, schema, schemaName }, model, apiKey) => {
  const res = await post('https://api.openai.com/v1/chat/completions', {
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, schema, strict: true },
      },
    }),
  });
  const data = await readJson(res, 'OpenAI');
  const message = data.choices[0].message;
  if (message.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
  return message.content;
};

// Gemini's schema support covers a narrower JSON Schema subset, so it gets JSON mode
// plus the schema in the prompt; the shared validator catches anything off-shape.
const gemini: Provider = async ({ system, user }, model, apiKey) => {
  const res = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );
  const data = await readJson(res, 'Gemini');
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error(`Gemini returned no content: ${JSON.stringify(data).slice(0, 300)}`);
  return parts.map((p: { text?: string }) => p.text ?? '').join('');
};

const providers: Record<string, Provider> = { anthropic, openai, gemini };

export type Progress = (text: string) => Promise<void>;

export async function completeJson(req: JsonRequest, onProgress?: Progress): Promise<unknown> {
  const name = Deno.env.get('AI_PROVIDER') ?? '';
  const provider = providers[name];
  if (!provider)
    throw new Error(`AI_PROVIDER must be one of: ${Object.keys(providers).join(', ')}`);

  // AI_MODEL is a comma-separated list tried in order, e.g. "gemini-3.5-flash,gemini-3.1-flash".
  const models = (Deno.env.get('AI_MODEL') ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const apiKey = Deno.env.get('AI_API_KEY');
  if (models.length === 0 || !apiKey) throw new Error('AI_MODEL and AI_API_KEY must be set');

  let lastError: unknown;
  const failures: string[] = [];
  for (const [i, model] of models.entries()) {
    await onProgress?.(
      i === 0
        ? `Reading your plan with ${model}…`
        : `${models[i - 1]} failed (${(lastError as ProviderError).status}), trying ${model}…`,
    );
    try {
      const text = await provider(req, model, apiKey);
      console.log(`AI model used: ${model}`);
      return JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
    } catch (err) {
      // Busy (429/5xx) or unavailable (404) moves on to the next model; anything else,
      // such as a bad key, would fail the same way on every model.
      const fallThrough =
        err instanceof ProviderError &&
        (err.status === 404 || err.status === 429 || err.status >= 500);
      if (!fallThrough) throw err;
      console.warn(`AI model ${model} failed, trying next:`, err.message);
      failures.push(`${model}: ${err.message.slice(0, 160)}`);
      lastError = err;
    }
  }
  // Name every model tried, so a busy model and a retired one can be told apart.
  throw new Error(`Every AI model failed:\n${failures.map((f) => `• ${f}`).join('\n')}`);
}
