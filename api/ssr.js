import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

globalThis.require ??= createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));

let reqHandler = null;

export default async function handler(req, res) {
  try {
    if (!reqHandler) {
      const mod = await import(join(__dirname, '..', 'dist/porfolio/server/server.mjs'));
      reqHandler = mod.reqHandler; // Angular 21 confirmed export
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = `${protocol}://${host}${req.url}`;

    // Collect body for POST/PUT requests
    const bodyBuffer = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const webRequest = new Request(url, {
      method: req.method,
      headers: new Headers(
        Object.fromEntries(
          Object.entries(req.headers)
            .filter(([k]) => !['connection', 'keep-alive', 'transfer-encoding'].includes(k))
        )
      ),
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : bodyBuffer,
    });

    const webResponse = await reqHandler(webRequest);

    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));

    const body = await webResponse.arrayBuffer();
    res.end(Buffer.from(body));

  } catch (err) {
    console.error('SSR ERROR:', err.message);
    console.error('STACK:', err?.stack);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('SSR Error: ' + err.message);
    }
  }
}