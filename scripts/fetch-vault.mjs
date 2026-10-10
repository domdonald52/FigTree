// Fetches Cate's pieces from The Vault (thevaultnz.com) and prepares them for the site,
// the same way fetch-ora.mjs does for ORA: framed photo, title, price, size and link,
// saved to site/data/vault.json (photos in site/vault/).
//
// The Vault's shop has no product feed, so this reads Cate's artist page and each
// product page. Runs on every Netlify build. If The Vault can't be reached, or its pages
// change and nothing can be read, the previous data is kept and the build carries on.

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { framePhoto } from './frame-photo.mjs';
import { typeOf } from '../site/js/piece-type.js';
import { ARTIST_PAGE, fetchText, listPieces, sizeFrom, textOf } from './vault-parse.mjs';

const OUT_DIR = path.resolve('site');
const IMG_DIR = path.join(OUT_DIR, 'vault');
const DATA_FILE = path.join(OUT_DIR, 'data', 'vault.json');

async function main() {
  let found;
  try {
    found = listPieces(await fetchText(ARTIST_PAGE));
  } catch (err) {
    console.warn(`The Vault: could not read Cate's page (${err.message}). Keeping the previous data.`);
    return;
  }
  if (!found.length) {
    // Most likely the page layout changed; don't wipe the list because of that.
    console.warn('The Vault: no pieces found on the page. Keeping the previous data.');
    return;
  }

  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  const pieces = [];
  for (const p of found) {
    let size = '';
    try {
      size = sizeFrom(textOf(await fetchText(p.url)));
    } catch {
      // size is optional
    }
    const file = `${p.handle}.jpg`;
    try {
      await framePhoto(p.photo, path.join(IMG_DIR, file));
    } catch (err) {
      console.warn(`The Vault: skipping "${p.title}" (${err.message}).`);
      continue;
    }
    pieces.push({
      handle: p.handle,
      title: p.title,
      type: typeOf(p.title),
      price: p.price,
      size,
      image: `vault/${file}`,
      alt: `${p.title} by Cate Pates`,
      url: p.url,
    });
  }

  const keep = new Set(pieces.map((p) => `${p.handle}.jpg`));
  for (const f of await readdir(IMG_DIR)) {
    if (!keep.has(f)) await rm(path.join(IMG_DIR, f));
  }

  await writeFile(DATA_FILE, JSON.stringify({ updated: new Date().toISOString(), pieces }, null, 2) + '\n');
  console.log(`The Vault: ${pieces.length} piece(s) available.`);
}

main().catch((err) => {
  console.warn(`The Vault: ${err.message}. Keeping the previous data.`);
});
