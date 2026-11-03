// Checks the Upstash-Signature header QStash puts on every call, with Web Crypto only (no SDK, so
// the worker stays light). The header is an HS256 JWT signed with the current or next signing
// key; its claims name the issuer, a validity window and a SHA-256 hash of the exact body.
// Same rules as @upstash/qstash's Receiver.verify.

const encoder = new TextEncoder();

function fromBase64url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function toBase64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const decodeJson = (part: string) => JSON.parse(new TextDecoder().decode(fromBase64url(part)));

async function signedWith(
  key: string,
  unsigned: string,
  signature: Uint8Array<ArrayBuffer>,
): Promise<boolean> {
  const hmac = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify('HMAC', hmac, signature, encoder.encode(unsigned));
}

/** True when `signature` is a valid QStash signature for exactly this `body`. */
export async function verifyQStashSignature(
  signature: string,
  body: string,
  keys: string[],
  now = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  try {
    const [header, payload, sig] = signature.split('.');
    if (!header || !payload || !sig || signature.split('.').length !== 3) return false;
    if (decodeJson(header).alg !== 'HS256') return false;

    const unsigned = `${header}.${payload}`;
    const sigBytes = fromBase64url(sig);
    let valid = false;
    for (const key of keys.filter(Boolean)) {
      if (await signedWith(key, unsigned, sigBytes)) {
        valid = true;
        break;
      }
    }
    if (!valid) return false;

    const claims = decodeJson(payload);
    if (claims.iss !== 'Upstash') return false;
    if (typeof claims.exp === 'number' && now >= claims.exp) return false;
    if (typeof claims.nbf === 'number' && now < claims.nbf) return false;

    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(body));
    const padding = /=+$/;
    return String(claims.body).replace(padding, '') === toBase64url(new Uint8Array(digest));
  } catch {
    return false;
  }
}
