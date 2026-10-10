// The type filter on the Gallery page: All · Houses · Vessels · Creatures (· Prints).
// Each piece card carries data-type (see piece-type.js). Pieces arrive at different times
// (sheet, ORA, The Vault), so the filter re-applies whenever a grid changes. A button only
// appears once there is at least one piece of that type, so Prints shows up by itself when
// Cate lists her first print. The choice is kept in the address (?type=vessel) so it can
// be linked to.
//
// Markup:
//   <div class="filter" data-filter hidden></div>
//   <div data-filter-block><div class="grid" data-filter-grid>…cards…</div></div>   (a gallery)
//   <p data-filter-for-sale-none hidden></p>   (shown when no gallery has the chosen type)

import { TYPES, typeOf } from './piece-type.js';

const bar = document.querySelector('[data-filter]');
const grids = [...document.querySelectorAll('[data-filter-grid]')];
let current = new URLSearchParams(location.search).get('type') || 'all';

function cards(grid) {
  return [...grid.children].filter((c) => c.classList.contains('piece'));
}

function typeOfCard(card) {
  if (!card.dataset.type) card.dataset.type = typeOf(card.querySelector('.piece-title')?.textContent || '');
  return card.dataset.type;
}

// A line shown where a choice leaves nothing to see.
function note(after, cls = 'filter-none') {
  let n = after.nextElementSibling;
  if (!n?.matches('[data-filter-none]')) {
    n = Object.assign(document.createElement('p'), { className: cls });
    n.dataset.filterNone = '';
    after.after(n);
  }
  return n;
}

function apply() {
  const counts = Object.fromEntries(TYPES.map((t) => [t.key, 0]));
  for (const grid of grids) for (const c of cards(grid)) {
    const t = typeOfCard(c);
    if (t in counts) counts[t] += 1;
  }
  // The chosen type may not have loaded yet, or may have sold out: show All meanwhile,
  // but remember the choice in case its pieces arrive.
  const active = current !== 'all' && counts[current] ? current : 'all';
  const label = TYPES.find((t) => t.key === active)?.label.toLowerCase();
  let forSale = 0;
  for (const grid of grids) {
    let shown = 0;
    for (const c of cards(grid)) {
      c.hidden = !(active === 'all' || c.dataset.type === active);
      if (!c.hidden) shown += 1;
    }
    // A gallery (studio, ORA, The Vault) with nothing of this type steps aside;
    // past work keeps its heading and says so.
    const block = grid.closest('[data-filter-block]');
    if (block) {
      block.classList.toggle('is-filtered-out', active !== 'all' && shown === 0);
      if (!block.hidden) forSale += shown;
    } else {
      const n = note(grid);
      n.hidden = active === 'all' || shown > 0 || !cards(grid).length;
      n.textContent = `None of the past pieces shown here are ${label}.`;
    }
  }
  const none = document.querySelector('[data-filter-for-sale-none]');
  if (none) {
    none.hidden = active === 'all' || forSale > 0;
    none.textContent = `No ${label} for sale right now. New pieces arrive as they come out of the kiln.`;
  }
  draw(counts, active);
}

function draw(counts, active) {
  const options = [{ key: 'all', label: 'All' }, ...TYPES.filter((t) => counts[t.key] > 0)];
  bar.hidden = options.length < 3; // nothing to choose between
  bar.replaceChildren(...options.map((o) => {
    const b = Object.assign(document.createElement('button'), { type: 'button', textContent: o.label });
    b.setAttribute('aria-pressed', String(o.key === active));
    b.addEventListener('click', () => choose(o.key));
    return b;
  }));
}

function choose(key) {
  current = key;
  const url = new URL(location.href);
  if (key === 'all') url.searchParams.delete('type');
  else url.searchParams.set('type', key);
  history.replaceState(null, '', url);
  apply();
}

if (bar && grids.length) {
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Show pieces by type');
  const watch = new MutationObserver(() => apply());
  grids.forEach((g) => watch.observe(g, { childList: true }));
  apply();
}
