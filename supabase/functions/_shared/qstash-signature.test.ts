import { assertEquals } from 'jsr:@std/assert@1';
import { verifyQStashSignature } from './qstash-signature.ts';

const CURRENT = 'sig_current_key';
const NEXT = 'sig_next_key';
const NOW = 1_800_000_000;
const BODY = '{"chatId":7,"text":"plan"}';

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const encodeJson = (value: unknown) => b64url(new TextEncoder().encode(JSON.stringify(value)));

async function bodyHash(body: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  // QStash's claim may keep the base64 padding; the check must ignore it.
  return b64url(new Uint8Array(digest)) + '=';
}

async function sign(
  key: string,
  claims: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' },
) {
  const unsigned = `${encodeJson(header)}.${encodeJson(claims)}`;
  const hmac = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(unsigned));
  return `${unsigned}.${b64url(new Uint8Array(signature))}`;
}

async function claims(overrides: Record<string, unknown> = {}) {
  return {
    iss: 'Upstash',
    sub: 'https://proj.supabase.co/functions/v1/telegram-worker',
    iat: NOW - 5,
    nbf: NOW - 5,
    exp: NOW + 300,
    jti: 'msg_1',
    body: await bodyHash(BODY),
    ...overrides,
  };
}

const verify = (signature: string, body = BODY) =>
  verifyQStashSignature(signature, body, [CURRENT, NEXT], NOW);

Deno.test('accepts a request signed with the current key', async () => {
  assertEquals(await verify(await sign(CURRENT, await claims())), true);
});

Deno.test('accepts a request signed with the next key (after a key rotation)', async () => {
  assertEquals(await verify(await sign(NEXT, await claims())), true);
});

Deno.test('rejects a signature made with another key', async () => {
  assertEquals(await verify(await sign('someone_else', await claims())), false);
});

Deno.test('rejects a body that was changed after signing', async () => {
  assertEquals(await verify(await sign(CURRENT, await claims()), '{"chatId":8}'), false);
});

Deno.test('rejects an expired or not-yet-valid token', async () => {
  assertEquals(await verify(await sign(CURRENT, await claims({ exp: NOW - 1 }))), false);
  assertEquals(await verify(await sign(CURRENT, await claims({ nbf: NOW + 60 }))), false);
});

Deno.test('rejects a token from another issuer or another algorithm', async () => {
  assertEquals(await verify(await sign(CURRENT, await claims({ iss: 'Someone' }))), false);
  assertEquals(
    await verify(await sign(CURRENT, await claims(), { alg: 'none', typ: 'JWT' })),
    false,
  );
});

Deno.test('rejects a missing or malformed signature', async () => {
  assertEquals(await verify(''), false);
  assertEquals(await verify('not.a.jwt'), false);
  assertEquals(await verify('a.b'), false);
});
