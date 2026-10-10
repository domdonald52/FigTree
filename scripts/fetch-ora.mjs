// Fetches Cate's available pieces from ORA Gallery's shop and prepares them for the site.
//
// For each piece that is still for sale it:
//   - downloads the main photo,
//   - trims the empty background around the piece,
//   - re-frames it at a consistent size, standing near the bottom of a 4:5 frame,
//     on the photo's own background colour, so captions sit snugly underneath,
//   - records title, price, size and the ORA link in site/data/ora.json.
//
// Runs on every Netlify build. If ORA can't be reached, the previous data is kept
// and the build carries on, so the site never breaks because of ORA.

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { framePhoto } from './frame-photo.mjs';
import { typeOf } from '../site/js/piece-type.js';

const SHOP = 'https://oragallery.co.nz';
const COLLECTION = `${SHOP}/collections/cate-pates/products.json?limit=250`;
const OUT_DIR = path.resolve('site');
const IMG_DIR = path.join(OUT_DIR, 'ora');
const DATA_FILE = path.join(OUT_DIR, 'data', 'ora.json');

function textOf(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function sizeFrom(bodyHtml) {
  // e.g. "200 x 80 x 120mm" or "110mm x 85mm x 70mm" → "200 × 80 × 120 mm"
  const m = textOf(bodyHtml).match(/Dimensions:\s*((?:[\d.]+\s*(?:mm)?\s*[x×]\s*)*[\d.]+\s*mm)/i);
  if (!m) return '';
  const parts = m[1].split(/\s*[x×]\s*/i).map((s) => s.replace(/mm/i, '').trim());
  return `${parts.join(' × ')} mm`;
}

function priceFrom(variant) {
  const n = Number(variant.price);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'figtree-studio-site' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function main() {
  let products;
  try {
    ({ products } = await fetchJson(COLLECTION));
  } catch (err) {
    console.warn(`ORA: could not fetch the collection (${err.message}). Keeping the previous data.`);
    return;
  }

  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  const pieces = [];
  for (const p of products) {
    const variant = p.variants?.[0];
    const image = p.images?.[0];
    if (!variant?.available || !image) continue;

    const file = `${p.handle}.jpg`;
    try {
      await framePhoto(`${image.src}${image.src.includes('?') ? '&' : '?'}width=1600`, path.join(IMG_DIR, file));
    } catch (err) {
      console.warn(`ORA: skipping "${p.title}" (${err.message}).`);
      continue;
    }

    pieces.push({
      handle: p.handle,
      title: p.title,
      type: typeOf(p.title, p.tags),
      price: priceFrom(variant),
      size: sizeFrom(p.body_html ?? ''),
      image: `ora/${file}`,
      alt: `${p.title} by Cate Pates`,
      url: `${SHOP}/products/${p.handle}`,
    });
  }

  // Remove photos of pieces that are no longer for sale.
  const keep = new Set(pieces.map((p) => `${p.handle}.jpg`));
  for (const f of await readdir(IMG_DIR)) {
    if (!keep.has(f)) await rm(path.join(IMG_DIR, f));
  }

  await writeFile(DATA_FILE, JSON.stringify({ updated: new Date().toISOString(), pieces }, null, 2) + '\n');
  console.log(`ORA: ${pieces.length} piece(s) available.`);
}

main().catch((err) => {
  // Never fail the whole site build because of ORA.
  console.warn(`ORA: ${err.message}. Keeping the previous data.`);
});
