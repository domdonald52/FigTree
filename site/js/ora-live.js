// Keeps the "Available now" pieces honest between site rebuilds.
//
// The pieces and their trimmed photos are prepared when the site is built (see
// scripts/fetch-ora.mjs). When a visitor opens the page, this checks ORA's shop once
// more: anything sold since the last build is removed and any price change is shown.
// If ORA can't be reached, the page simply shows what was built.
//
// Markup it expects:
//   <section data-ora-section> … <div data-ora-grid> <a data-ora-handle="…"> … <span data-ora-price>$400</span> … </a> </div>
//   <div data-ora-empty hidden> …"Everything has found a home"… </div> </section>

const FEED = 'https://oragallery.co.nz/collections/cate-pates/products.json?limit=250';

function priceText(value) {
  const n = Number(value);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

async function refresh(section) {
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

  const cards = section.querySelectorAll('[data-ora-handle]');
  let shown = 0;
  for (const card of cards) {
    const price = live.get(card.dataset.oraHandle);
    if (!price) {
      card.remove();
      continue;
    }
    const priceEl = card.querySelector('[data-ora-price]');
    if (priceEl) priceEl.textContent = price;
    shown += 1;
  }

  const empty = section.querySelector('[data-ora-empty]');
  if (empty) empty.hidden = shown > 0;
  const grid = section.querySelector('[data-ora-grid]');
  if (grid) grid.hidden = shown === 0;
}

document.querySelectorAll('[data-ora-section]').forEach(refresh);
