// Shows Cate's pieces that are for sale at ORA Gallery and The Vault.
//
// The pieces and their trimmed photos are prepared when the site is built
// (scripts/fetch-ora.mjs → data/ora.json). On page load this draws them, then checks
// ORA's shop once more: anything sold since the last build disappears, price changes
// show, and pieces listed since the last build are added straight away using ORA's own
// photo (they get a trimmed photo at the next build). If ORA can't be reached, the
// built list is shown as it is.
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

function textOf(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Same as sizeFrom in scripts/fetch-ora.mjs: "200 x 80 x 120mm" → "200 × 80 × 120 mm"
function sizeFrom(bodyHtml) {
  const m = textOf(bodyHtml).match(/Dimensions:\s*((?:[\d.]+\s*(?:mm)?\s*[x×]\s*)*[\d.]+\s*mm)/i);
  if (!m) return '';
  return `${m[1].split(/\s*[x×]\s*/i).map((x) => x.replace(/mm/i, '').trim()).join(' × ')} mm`;
}

// A piece listed on ORA since the last build, shown with ORA's own photo.
function fromFeed(p, price) {
  const src = p.images?.[0]?.src;
  return {
    handle: p.handle,
    title: p.title,
    price,
    size: sizeFrom(p.body_html),
    image: src ? `${src}${src.includes('?') ? '&' : '?'}width=900` : '',
    alt: `${p.title} by Cate Pates`,
    url: `https://oragallery.co.nz/products/${p.handle}`,
  };
}

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function card(p, buy = 'Buy at ORA →') {
  const price = el('strong', { textContent: p.price });
  price.dataset.oraPrice = '';
  const meta = el('span', { className: 'piece-meta' }, price, p.size ? ` · ${p.size}` : '');
  const link = el(
    'a',
    { className: 'piece', href: p.url },
    el('img', { src: p.image, alt: p.alt, loading: 'lazy', width: 900, height: 1125 }),
    el('span', { className: 'piece-title', textContent: p.title }),
    meta,
    el('span', { className: 'piece-buy', textContent: buy }),
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

async function liveCheck(sections, builtHandles) {
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
    if (v?.available) live.set(p.handle, { product: p, price: priceText(v.price) });
  }
  for (const section of sections) {
    const grid = section.querySelector('[data-ora-grid]');
    const known = new Set(builtHandles);
    for (const c of grid.querySelectorAll('[data-ora-handle]')) {
      const item = live.get(c.dataset.oraHandle);
      if (!item) {
        c.remove();
        continue;
      }
      c.querySelector('[data-ora-price]').textContent = item.price;
    }
    // New pieces go first, the way ORA lists them (newest first).
    const added = [...live.values()]
      .filter(({ product }) => !known.has(product.handle) && product.images?.length)
      .map(({ product, price }) => card(fromFeed(product, price)));
    grid.prepend(...added);
    const limit = Number(grid.dataset.oraLimit);
    if (limit) [...grid.children].slice(limit).forEach((c) => c.remove());
    showEmpty(section, grid.children.length === 0);
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
    grid.replaceChildren(...pieces.slice(0, limit).map((p) => card(p)));
    showEmpty(section, pieces.length === 0);
  }

  await liveCheck(sections, pieces.map((p) => p.handle));
}

// Pieces at The Vault, prepared at build time by scripts/fetch-vault.mjs. The Vault's shop
// can't be checked live from the browser, so this list is as of the last build.
async function initVault() {
  const section = document.querySelector('[data-vault]');
  if (!section) return;
  let pieces = [];
  try {
    ({ pieces } = await (await fetch('/data/vault.json')).json());
  } catch {
    // leave the section hidden
  }
  section.querySelector('[data-vault-grid]').replaceChildren(...pieces.map((p) => card(p, 'Buy at The Vault →')));
  section.hidden = pieces.length === 0;
}

init();
initVault();
