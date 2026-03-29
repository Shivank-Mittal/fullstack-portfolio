export default async function handler(req, res) {
  try {
    const url = req.url || '';

    let locale = 'en-US';
    if (url.startsWith('/fr')) {
      locale = 'fr-FR';
    }

    const serverModule = await import(
      `../dist/porfolio/server/${locale}/server.mjs`
    );

    // 🔥 Convert Node → Web Request
    const request = new Request(`https://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
    });

    // 🔥 Angular handler
    const response = await serverModule.default(request);

    // 🔥 Convert back to Node
    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.end(body);

  } catch (err) {
    console.error('SSR ERROR FULL:', err);
    console.error('STACK:', err?.stack);
    res.statusCode = 500;
    res.end('SSR Error');
  }
}