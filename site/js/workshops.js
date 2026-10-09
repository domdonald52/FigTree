// Lists upcoming workshops from data/workshops.json.
//
// Each workshop: { "date": "2026-10-24", "time": "1:30–4pm", "name": "…", "venue": "…",
//                  "price": "$95", "blurb": "…", "register": "https://…", "details": "https://…",
//                  "draft": false }
// Workshops whose date has passed, or marked "draft": true, are not shown. When none are
// left, the "New dates coming soon" message appears instead.
// Rows come from the Workshops tab of Cate's Google Sheet when it's connected (see sheet.js),
// otherwise from data/workshops.json. "soldOut": true shows "Sold out" instead of the booking button.
// A Humanitix (or Eventbrite/Eventfinda) booking link gets "Book a place" plus "Tickets through Humanitix".

import { sheetRows, isYes } from './sheet.js';

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

// Where a booking link goes, so the button can say so ("Book on Humanitix").
const PROVIDERS = [['humanitix.com', 'Humanitix'], ['eventbrite.', 'Eventbrite'], ['eventfinda.', 'Eventfinda'], ['buy.stripe.com', 'Stripe']];
export function providerOf(url) {
  try {
    const host = new URL(url).hostname;
    return PROVIDERS.find(([d]) => host.includes(d))?.[1] || '';
  } catch {
    return '';
  }
}

function dayLabel(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'long' });
}

function row(w) {
  const actions = el('div', { className: 'session-actions' });
  if (w.soldOut) actions.append(el('span', { className: 'button', textContent: 'Sold out', style: 'background: var(--muted); cursor: default' }));
  else if (w.register) {
    const provider = providerOf(w.register);
    actions.append(el('a', { className: 'button', href: w.register, textContent: provider === 'Stripe' ? 'Book and pay' : 'Book a place' }));
    if (provider && provider !== 'Stripe') actions.append(el('span', { className: 'piece-meta', textContent: `Tickets through ${provider}` }));
  }
  if (w.details) actions.append(el('a', { href: w.details, textContent: 'Event details', style: 'padding: 8px 0; font-size: 15px' }));

  const where = [w.venue, w.price].filter(Boolean).join(' · ');
  return el(
    'article',
    { className: 'session' },
    el(
      'div',
      { className: 'session-when' },
      el('span', { className: 'session-day', textContent: dayLabel(w.date) }),
      el('span', { className: 'piece-meta', textContent: w.time || '' }),
    ),
    el(
      'div',
      { className: 'session-body' },
      el('h3', { className: 'h3', textContent: w.name }),
      w.blurb ? el('p', { textContent: w.blurb }) : '',
      where ? el('span', { className: 'piece-meta', textContent: where }) : '',
    ),
    actions,
  );
}

async function init() {
  const list = document.querySelector('[data-workshops]');
  if (!list) return;
  const empty = document.querySelector('[data-workshops-empty]');

  let workshops = [];
  const rows = await sheetRows('Workshops');
  if (rows) {
    workshops = rows.map((r) => ({
      date: r.date, time: r.time, name: r.workshop, venue: r.venue, price: r.price, blurb: r.description,
      register: r.booking_link, details: r.more_info_link, soldOut: isYes(r.sold_out), draft: !isYes(r.show),
    }));
  } else {
    try {
      workshops = await (await fetch('/data/workshops.json')).json();
    } catch {
      // show the empty message
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = workshops
    .filter((w) => !w.draft && w.name && /^\d{4}-\d{2}-\d{2}$/.test(w.date || '') && w.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  list.replaceChildren(...upcoming.map(row));
  list.hidden = upcoming.length === 0;
  if (empty) empty.hidden = upcoming.length > 0;
}

init();
