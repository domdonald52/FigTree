// Shows Cate's pieces that are for sale at ORA Gallery.
//
// The pieces and their trimmed photos are prepared when the site is built
// (scripts/fetch-ora.mjs → data/ora.json). On page load this draws them, then checks
// ORA's shop once more so anything sold since the last build disappears and price
// changes show. If ORA can't be reached, the built list is shown as it is.
//
// Markup:
//   <section data-ora>
//     <div class="grid" data-ora-grid data-ora-limit="6"></div>   (limit is optional)
//     <div data-ora-empty hidden>…Everything has found a home…</div>
//   </section>

const FEED = 'https://oragallery.co.nz/collections/cate-pates/products.json?limit=250';

function priceText(value) {
  const n = Number(value);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function card(p) {
  const price = el('strong', { textContent: p.price });
  price.dataset.oraPrice = '';
  const meta = el('span', { className: 'piece-meta' }, price, p.size ? ` · ${p.size}` : '');
  const link = el(
    'a',
    { className: 'piece', href: p.url },
    el('img', { src: p.image, alt: p.alt, loading: 'lazy', width: 900, height: 1125 }),
    el('span', { className: 'piece-title', textContent: p.title }),
    meta,
    el('span', { className: 'piece-buy', textContent: 'Buy at ORA →' }),
  );
  link.dataset.oraHandle = p.handle;
  return link;
}

function showEmpty(section, isEmpty) {
  const empty = section.querySelector('[data-ora-empty]');
  const grid = section.querySelector('[data-ora-grid]');
  if (empty) empty.hidden = !isEmpty;
  if (grid) grid.hidden = isEmpty;
}

async function liveCheck(sections) {
  let products;
  try {
    const res = await fetch(FEED);
    if (!res.ok) return;
    ({ products } = await res.json());
  } catch {
    return;
  }
  const live = new Map();
  for (const p of products) {
    const v = p.variants?.[0];
    if (v?.available) live.set(p.handle, priceText(v.price));
  }
  for (const section of sections) {
    let shown = 0;
    for (const c of section.querySelectorAll('[data-ora-handle]')) {
      const price = live.get(c.dataset.oraHandle);
      if (!price) {
        c.remove();
        continue;
      }
      c.querySelector('[data-ora-price]').textContent = price;
      shown += 1;
    }
    showEmpty(section, shown === 0);
  }
}

async function init() {
  const sections = [...document.querySelectorAll('[data-ora]')];
  if (!sections.length) return;

  let pieces = [];
  try {
    ({ pieces } = await (await fetch('/data/ora.json')).json());
  } catch {
    // fall through with no pieces
  }

  for (const section of sections) {
    const grid = section.querySelector('[data-ora-grid]');
    const limit = Number(grid.dataset.oraLimit) || pieces.length;
    grid.replaceChildren(...pieces.slice(0, limit).map(card));
    showEmpty(section, pieces.length === 0);
  }

  await liveCheck(sections);
}

init();
