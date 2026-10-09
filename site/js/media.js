// Lists articles, podcasts, radio and video features from data/media.json, newest first.
//
// Each item: { "date": "2026-09" (or "2026-09-14"), "type": "Podcast", "title": "…",
//              "outlet": "…", "blurb": "…", "link": "https://…", "draft": false }
// Items marked "draft": true are not shown. When nothing is left, the empty message appears.
// Rows come from the Media tab of Cate's Google Sheet when it's connected (see sheet.js),
// otherwise from data/media.json.

import { sheetRows, isYes } from './sheet.js';

const ACTION = { podcast: 'Listen', radio: 'Listen', video: 'Watch' };

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function monthLabel(iso) {
  if (!/^\d{4}(-\d{2}){0,2}$/.test(iso || '')) return iso || '';
  const [y, m = '01', d = '15'] = iso.split('-');
  return new Date(`${y}-${m}-${d}T12:00:00`).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
}

function row(item) {
  const verb = ACTION[(item.type || '').toLowerCase()] || 'Read';
  return el(
    'article',
    { className: 'session', style: 'align-items: flex-start' },
    el(
      'div',
      { className: 'session-when' },
      el('span', { className: 'eyebrow', textContent: item.type || 'Feature' }),
      el('span', { className: 'piece-meta', textContent: monthLabel(item.date) }),
    ),
    el(
      'div',
      { className: 'session-body' },
      el('h3', { className: 'h3', textContent: item.title }),
      item.outlet ? el('span', { className: 'piece-meta', textContent: item.outlet }) : '',
      item.blurb ? el('p', { textContent: item.blurb }) : '',
    ),
    item.link ? el('a', { className: 'text-link', style: 'padding-top: 4px', href: item.link, textContent: `${verb} →` }) : '',
  );
}

async function init() {
  const list = document.querySelector('[data-media]');
  if (!list) return;
  const empty = document.querySelector('[data-media-empty]');

  let items = [];
  const rows = await sheetRows('Media');
  if (rows) {
    items = rows.map((r) => ({
      date: r.date, type: r.type, title: r.title, outlet: r.where, blurb: r.description, link: r.link, draft: !isYes(r.show),
    }));
  } else {
    try {
      items = await (await fetch('/data/media.json')).json();
    } catch {
      // show the empty message
    }
  }

  const shown = items.filter((i) => !i.draft && i.title).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  list.replaceChildren(...shown.map(row));
  list.hidden = shown.length === 0;
  if (empty) empty.hidden = shown.length > 0;
}

init();
