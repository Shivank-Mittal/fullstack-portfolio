import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Tries to read a pre-rendered HTML file for the given URL/locale.
 * Angular pre-renders every route to dist/porfolio/browser/{locale}/{path}/index.html.
 * Falls back to the SPA shell (root index.html) if the specific route wasn't pre-rendered.
 */
function getPrerenderedHtml(url, locale) {
  const cleanPath = locale === 'fr-FR'
    ? (url.replace(/^\/fr/, '').split('?')[0] || '/')
    : (url.split('?')[0] || '/');

  // Try the specific pre-rendered route first
  const routePath = join(__dirname, '..', 'dist/porfolio/browser', locale, cleanPath, 'index.html');
  if (existsSync(routePath)) return readFileSync(routePath, 'utf-8');

  // Fall back to the SPA shell (root index.html)
  const rootPath = join(__dirname, '..', 'dist/porfolio/browser', locale, 'index.html');
  if (existsSync(rootPath)) return readFileSync(rootPath, 'utf-8');

  return null;
}

export default async function handler(req, res) {
  try {
    const url = req.url || '/';
    const locale = (url === '/fr' || url.startsWith('/fr/')) ? 'fr-FR' : 'en-US';

    // ── 1. Serve pre-rendered HTML (fastest path, no Angular processing needed) ──
    const html = getPrerenderedHtml(url, locale);
    if (html) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.statusCode = 200;
      return res.end(html);
    }

    // ── 2. Fall back to live SSR for any route not yet pre-rendered ──
    const { reqHandler } = await import(
      `../dist/porfolio/server/${locale}/server.mjs`
    );
    return await reqHandler(req, res);

  } catch (err) {
    console.error('SSR ERROR:', err);
    console.error('STACK:', err?.stack);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('SSR Error: ' + err.message);
    }
  }
}
