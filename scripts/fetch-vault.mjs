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

const SHOP = 'https://www.thevaultnz.com';
const ARTIST_PAGE = `${SHOP}/category/cate-pates/474.aspx`;
const OUT_DIR = path.resolve('site');
const IMG_DIR = path.join(OUT_DIR, 'vault');
const DATA_FILE = path.join(OUT_DIR, 'data', 'vault.json');

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (figtree-studio-site)' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .trim();
}

function textOf(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
}

function priceText(raw) {
  const n = Number(raw.replace(/[^\d.]/g, ''));
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

// "Height: 140mm Width: 90mm Depth: 120mm" → "90 × 120 × 140 mm" (width × depth × height, like ORA)
function sizeFrom(pageText) {
  const get = (k) => pageText.match(new RegExp(`${k}:\\s*([\\d.]+)\\s*mm`, 'i'))?.[1];
  const parts = [get('Width'), get('Depth'), get('Height')].filter(Boolean);
  return parts.length ? `${parts.join(' × ')} mm` : '';
}

// Product tiles on the artist page.
function listPieces(html) {
  const tiles = html.match(/<div class="stylesummarybox"[\s\S]*?<\/li>/g) ?? [];
  return tiles
    .map((tile) => {
      const link = tile.match(/href="(https:\/\/www\.thevaultnz\.com\/product\/[^"]+)" title="([^"]*)"/);
      const img = tile.match(/src="(\/user\/images\/(\d+))_\d+_\d+\.jpg/);
      const price = tile.match(/class="spn_P1"[^>]*>([^<]+)</);
      if (!link || !img || !price) return null;
      const url = link[1];
      return {
        handle: url.split('/').pop().replace('.aspx', ''),
        title: decode(link[2]),
        price: priceText(price[1]),
        photo: `${SHOP}${img[1]}.jpg`, // full-size original
        url,
      };
    })
    .filter(Boolean);
}

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
