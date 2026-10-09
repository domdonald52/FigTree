// Galleries and Exhibitions on the About page come from Cate's Google Sheet when it's
// connected (see sheet.js). Otherwise the lists written into about.html stay as they are.

import { sheetRows, isYes } from './sheet.js';

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function fill(list, items) {
  if (!list || !items.length) return;
  list.querySelectorAll('.list-item').forEach((n) => n.remove());
  list.append(...items);
}

async function galleries() {
  const rows = await sheetRows('Galleries');
  if (!rows) return;
  fill(document.querySelector('[data-galleries]'), rows.filter((r) => r.name && isYes(r.show)).map((r) =>
    el('div', { className: 'list-item' },
      r.website ? el('a', { href: r.website, style: 'font-weight: 600' }, r.name) : el('strong', { textContent: r.name }),
      r.place ? el('span', { className: 'muted', textContent: r.place }) : '')));
}

async function exhibitions() {
  const rows = await sheetRows('Exhibitions');
  if (!rows) return;
  const shown = rows.filter((r) => r.title && isYes(r.show)).sort((a, b) => String(b.year).localeCompare(String(a.year)));
  fill(document.querySelector('[data-exhibitions]'), shown.map((r) =>
    el('div', { className: 'list-item row' },
      el('span', { className: 'muted', style: 'flex: 0 0 48px', textContent: r.year || '' }),
      el('span', { textContent: [r.title, r.venue].filter(Boolean).join(' — ') }))));
}

galleries();
exhibitions();
