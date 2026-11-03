import { z } from 'npm:zod@4.1.12';

// Turns AI and parsing failures into one short sentence for Telegram and the QStash logs.

export interface ModelFailure {
  model: string;
  status: number;
  /** The provider's own error message, shortened. */
  detail: string;
}

/** Every model in AI_MODEL failed with a busy/unavailable status. */
export class AllModelsFailedError extends Error {
  constructor(readonly failures: ModelFailure[]) {
    super(failures.map((f) => `${f.model}: ${f.status} ${f.detail}`).join('; '));
    this.name = 'AllModelsFailedError';
  }
}

export function statusLabel(status: number): string {
  if (status === 429) return 'over its rate limit';
  if (status === 404) return 'not available';
  if (status === 401 || status === 403) return 'rejecting the API key';
  if (status >= 500) return 'busy';
  return `error ${status}`;
}

/** The message inside a provider's JSON error body, or the body itself, shortened. */
export function providerDetail(body: string): string {
  try {
    const message = JSON.parse(body)?.error?.message;
    if (typeof message === 'string') return message.slice(0, 150);
  } catch {
    // Not JSON: use the text as it is.
  }
  return body.slice(0, 150);
}

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

export function describeFailure(err: unknown): string {
  if (err instanceof AllModelsFailedError) {
    const byLabel = new Map<string, string[]>();
    for (const f of err.failures) {
      const label = statusLabel(f.status);
      byLabel.set(label, [...(byLabel.get(label) ?? []), f.model]);
    }
    return [...byLabel]
      .map(([label, models]) => `${joinNames(models)} ${models.length > 1 ? 'are' : 'is'} ${label}`)
      .join('; ');
  }
  if (err instanceof z.ZodError) return "the AI's answer didn't match the plan format";
  if (err instanceof SyntaxError) return "the AI's answer wasn't valid JSON";
  const message = err instanceof Error ? err.message : String(err);
  return message.slice(0, 200);
}
