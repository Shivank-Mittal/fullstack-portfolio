export default async function handler(req, res) {
  try {
    const url = req.url || '';
    const locale = (url === '/fr' || url.startsWith('/fr/')) ? 'fr-FR' : 'en-US';

    const { reqHandler } = await import(
      `../dist/porfolio/server/${locale}/server.mjs`
    );

    await reqHandler(req, res);
  } catch (err) {
    console.error('SSR ERROR:', err);
    console.error('STACK:', err?.stack);
    res.statusCode = 500;
    res.end('SSR Error');
  }
}
