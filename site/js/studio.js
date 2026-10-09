// Pieces Cate sells herself, through Stripe payment links.
//
// Each piece in data/studio.json (later the Studio tab of the Google Sheet):
//   { "key": "fox-house", "title": "…", "price": "$320", "size": "…", "photo": "/img/…" or "https://…",
//     "link": "https://buy.stripe.com/…", "sold": false, "draft": false }
// "key" is optional (made from the title) and must stay the same once a piece is listed.
// The Buy button adds client_reference_id=<key> to the payment link, so when Stripe reports
// the sale (netlify/functions/stripe-webhook.mjs) the piece is marked sold automatically.
// Cate can also type sold = yes in the sheet. A piece with no link shows "Enquire" instead.

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

function card(p, isSold) {
  const meta = el('span', { className: 'piece-meta' }, el('strong', { textContent: p.price || '' }), p.size ? ` · ${p.size}` : '');
  const img = el('img', { src: p.photo, alt: `${p.title} by Cate Pates`, loading: 'lazy', width: 900, height: 1125 });
  if (isSold) {
    return el('div', { className: 'piece is-sold' }, img, el('span', { className: 'piece-title', textContent: p.title }), meta,
      el('span', { className: 'piece-sold', textContent: 'Sold' }));
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
  return el('a', { className: 'piece', href }, img, el('span', { className: 'piece-title', textContent: p.title }), meta,
    el('span', { className: 'piece-buy', textContent: label }));
}

async function soldKeys() {
  try {
    const res = await fetch('/api/studio-sold');
    if (!res.ok) return new Set();
    return new Set((await res.json()).sold);
  } catch {
    return new Set();
  }
}

async function init() {
  const section = document.querySelector('[data-studio]');
  if (!section) return;
  let pieces = [];
  try {
    pieces = await (await fetch('/data/studio.json')).json();
  } catch {
    // leave the section hidden
  }
  pieces = pieces.filter((p) => p.title && p.photo && !p.draft);
  if (!pieces.length) return;

  const sold = await soldKeys();
  const isSold = (p) => p.sold === true || String(p.sold).toLowerCase() === 'yes' || sold.has(keyOf(p));
  // Available pieces first, sold ones after.
  pieces.sort((a, b) => isSold(a) - isSold(b));
  section.querySelector('[data-studio-grid]').replaceChildren(...pieces.map((p) => card(p, isSold(p))));
  section.hidden = false;
}

init();
