// The hourly live check for The Vault: which of Cate's pieces are listed there right now.
// The Gallery page draws the list made at the last build (data/vault.json), then asks this
// to drop anything sold since, update prices and add new pieces.
//   GET /api/vault
//
// Netlify's CDN keeps the answer for an hour and shares it between all visitors, so The
// Vault is read about once an hour however many people visit.

import { ARTIST_PAGE, fetchText, listPieces } from '../../scripts/vault-parse.mjs';

export default async () => {
  try {
    const html = await fetchText(ARTIST_PAGE);
    const pieces = listPieces(html);
    return Response.json(
      // found: false means the page loaded but no pieces could be read: either nothing is
      // listed, or The Vault has changed its page layout (see scripts/vault-parse.mjs).
      { checked: new Date().toISOString(), found: pieces.length > 0, pieces },
      {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch (err) {
    console.warn(`The Vault: ${err.message}`);
    return Response.json({ error: 'The Vault could not be reached' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
};

export const config = { path: '/api/vault' };
