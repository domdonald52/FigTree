// Daily check that Cate's pieces can still be read from The Vault's website.
// Used by .github/workflows/check-vault.yml. Exits 1 (and prints why) if the page can't be
// fetched or no pieces can be read from it, which usually means The Vault changed its pages
// and scripts/vault-parse.mjs needs updating.

import { ARTIST_PAGE, fetchText, listPieces } from '../../scripts/vault-parse.mjs';

try {
  const html = await fetchText(ARTIST_PAGE);
  const pieces = listPieces(html);
  if (!pieces.length) {
    console.log(`The Vault's page loaded but no pieces could be read from it (${ARTIST_PAGE}).`);
    console.log('Either nothing of Cate\'s is listed there right now, or The Vault has changed its page layout.');
    process.exit(1);
  }
  console.log(`OK: ${pieces.length} piece(s) read from The Vault: ${pieces.map((p) => p.title).join(', ')}`);
} catch (err) {
  console.log(`Couldn't reach The Vault's website: ${err.message}`);
  process.exit(1);
}
