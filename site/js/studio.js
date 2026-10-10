// Pieces Cate sells herself, through Stripe payment links.
//
// Rows come from the Studio tab of Cate's Google Sheet when it's connected (see sheet.js),
// otherwise from data/studio.json:
//   { "key": "fox-house", "title": "…", "price": "$320", "size": "…", "photo": "/img/…" or "https://…",
//     "link": "https://buy.stripe.com/…", "sold": false, "draft": false }
// "key" is optional (made from the title) and must stay the same once a piece is listed.
// The Buy button adds client_reference_id=<key> to the payment link, so when Stripe reports
// the sale (netlify/functions/stripe-webhook.mjs) the piece is marked sold automatically.
// Cate can also type sold = yes in the sheet. A piece with no link shows "Enquire" instead.
//
// Edition (prints): blank = one of a kind, sold after one sale. "Open" = never sells out.
// A number, e.g. 25 = a limited edition of 25: sold out once online sales plus any number
// typed under Sold (copies sold in person) reach 25.

import { sheetRows, isYes, photoUrl } from './sheet.js';
import { typeOf } from './piece-type.js';

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

export function keyOf(piece) {
  return (piece.key || piece.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 190);
}

export function buyUrl(link, key) {
  const url = new URL(link);
  url.searchParams.set('client_reference_id', key);
  return url.toString();
}

// "", "Open", "25", "Edition of 25" or "1/25" → what kind of edition it is.
export function editionOf(value) {
  const v = String(value ?? '').trim();
  if (!v) return { kind: 'one' };
  if (/open|unlimited/i.test(v)) return { kind: 'open' };
  const n = Number(v.match(/(\d+)\s*$/)?.[1]);
  return n > 0 ? { kind: 'limited', size: n } : { kind: 'one' };
}

// Sold out? And how many are left of a limited edition. onlineSales comes from Stripe.
export function stockOf(p, onlineSales = 0) {
  const edition = editionOf(p.edition);
  if (p.sold === true || isYes(p.sold)) return { edition, sold: true };
  if (edition.kind === 'open') return { edition, sold: false };
  if (edition.kind === 'one') return { edition, sold: onlineSales > 0 };
  const inPerson = Number(String(p.sold ?? '').trim()) || 0;
  const left = Math.max(0, edition.size - onlineSales - inPerson);
  return { edition, sold: left === 0, left };
}

function editionText({ edition, sold, left }) {
  if (edition.kind === 'open') return 'Open edition';
  if (edition.kind !== 'limited') return '';
  return `Edition of ${edition.size}${!sold && left <= 5 ? ` · ${left} left` : ''}`;
}

function card(p, stock) {
  const isSold = stock.sold;
  const extra = editionText(stock);
  const meta = el('span', { className: 'piece-meta' }, el('strong', { textContent: p.price || '' }), p.size ? ` · ${p.size}` : '', extra ? ` · ${extra}` : '');
  const img = el('img', { src: p.photo, alt: `${p.title} by Cate Pates`, loading: 'lazy', width: 900, height: 1125 });
  const typed = (node) => {
    node.dataset.type = typeOf(p.title, [], p.type);
    return node;
  };
  if (isSold) {
    return typed(el('div', { className: 'piece is-sold' }, img, el('span', { className: 'piece-title', textContent: p.title }), meta,
      el('span', { className: 'piece-sold', textContent: stock.edition.kind === 'one' ? 'Sold' : 'Sold out' })));
  }
  let href = '/about.html#contact';
  let label = 'Enquire →';
  if (p.link) {
    try {
      href = buyUrl(p.link, keyOf(p));
      label = 'Buy now →';
    } catch {
      // not a valid link: fall back to enquiring
    }
  }
  return typed(el('a', { className: 'piece', href }, img, el('span', { className: 'piece-title', textContent: p.title }), meta,
    el('span', { className: 'piece-buy', textContent: label })));
}

// How many of each piece Stripe has reported sold: { "fox-01": 1, "pr-01": 3 }.
async function salesCounts() {
  try {
    const res = await fetch('/api/studio-sold');
    if (!res.ok) return {};
    const data = await res.json();
    return data.counts || Object.fromEntries((data.sold || []).map((k) => [k, 1]));
  } catch {
    return {};
  }
}

async function init() {
  if (!document.querySelector('[data-studio], [data-prints]')) return;
  let pieces = [];
  const rows = await sheetRows('Studio');
  if (rows) {
    pieces = rows.map((r) => ({
      key: r.code, title: r.title, price: r.price, size: r.size, photo: photoUrl(r.photo_link),
      link: r.payment_link, sold: r.sold, edition: r.edition, draft: !isYes(r.show), type: r.type,
    }));
  } else {
    try {
      pieces = await (await fetch('/data/studio.json')).json();
    } catch {
      // leave the section hidden
    }
  }
  pieces = pieces.filter((p) => p.title && p.photo && !p.draft);
  if (!pieces.length) return;

  const counts = await salesCounts();
  const stock = new Map(pieces.map((p) => [p, stockOf(p, counts[keyOf(p)] || 0)]));
  // Available pieces first, sold ones after.
  pieces.sort((a, b) => stock.get(a).sold - stock.get(b).sold);
  // Prints get their own section after all the ceramics; everything else is "From Cate's studio".
  const isPrint = (p) => typeOf(p.title, [], p.type) === 'print';
  const show = (sel, list) => {
    const block = document.querySelector(sel);
    if (!block) return;
    block.querySelector('.grid').replaceChildren(...list.map((p) => card(p, stock.get(p))));
    block.hidden = list.length === 0;
  };
  show('[data-studio]', pieces.filter((p) => !isPrint(p)));
  show('[data-prints]', pieces.filter(isPrint));
  jumpToHash();
}

// Sections above appear after loading, so re-do a jump to #studio, #ora, #vault or #past.
export function jumpToHash() {
  const id = location.hash.slice(1);
  const target = /^[a-z]+$/.test(id) && document.getElementById(id);
  if (target) target.scrollIntoView();
}

init();
