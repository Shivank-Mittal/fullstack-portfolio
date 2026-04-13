import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

globalThis.require ??= createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));

// The root server.mjs handles ALL locales via AngularNodeAppEngine.
// It reads angular-app-engine-manifest.mjs and routes to en-US or fr-FR
// based on the request URL automatically.
let reqHandler = null;

async function getReqHandler() {
  if (reqHandler) return reqHandler;
  const serverPath = join(__dirname, '..', 'dist/porfolio/server/server.mjs');
  const mod = await import(serverPath);
  if (!mod.reqHandler) throw new Error('reqHandler not found in server.mjs');
  reqHandler = mod.reqHandler;
  return reqHandler;
}

export default async function handler(req, res) {
  try {
    const handler = await getReqHandler();

    // reqHandler is createNodeRequestHandler(expressApp) — it expects (req, res, next)
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

  } catch (err) {
    console.error('SSR ERROR:', err.message);
    console.error('STACK:', err?.stack);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('SSR Error: ' + err.message);
    }
  }
}
