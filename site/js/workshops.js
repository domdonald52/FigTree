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

// What the booking button should do, from the Sold out and Booking link columns:
//   a ticketing site → "Book a place" + "Tickets through Humanitix"; a Stripe link → "Book and pay";
//   any other site → "Book a place" + "Booking through <site>"; empty → "Ask about booking"
//   (contact form, workshop pre-filled); "none" / "drop in" / "no booking" → no button.
export function bookingOf(w) {
  if (w.soldOut) return { kind: 'sold', label: 'Sold out' };
  const link = String(w.register || '').trim();
  if (/^(none|no booking( needed)?|drop[ -]?in|just turn up)$/i.test(link)) return { kind: 'none', note: 'Just turn up, no booking needed' };
  if (/^https?:\/\//i.test(link)) {
    const provider = providerOf(link);
    if (provider === 'Stripe') return { kind: 'link', href: link, label: 'Book and pay' };
    let site = provider;
    if (!site) { try { site = new URL(link).hostname.replace(/^www\./, ''); } catch { site = ''; } }
    return { kind: 'link', href: link, label: 'Book a place', note: site ? `${provider ? 'Tickets' : 'Booking'} through ${site}` : '' };
  }
  const about = [w.name, w.date ? dayLabel(w.date) : ''].filter(Boolean).join(', ');
  return { kind: 'ask', href: `/about.html?workshop=${encodeURIComponent(about)}#contact`, label: 'Ask about booking' };
}

export function dayLabel(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'long' });
}

function row(w) {
  const actions = el('div', { className: 'session-actions' });
  const b = bookingOf(w);
  if (b.kind === 'sold') actions.append(el('span', { className: 'button is-disabled', textContent: b.label }));
  else if (b.kind !== 'none') actions.append(el('a', { className: 'button', href: b.href, textContent: b.label }));
  if (b.note) actions.append(el('span', { className: 'piece-meta', textContent: b.note }));
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

// Upcoming, visible workshops (from the sheet, or data/workshops.json), soonest first.
export async function loadUpcoming() {
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
      // nothing to show
    }
  }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
  return workshops
    .filter((w) => !w.draft && w.name && /^\d{4}-\d{2}-\d{2}$/.test(w.date || '') && w.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function init() {
  const list = document.querySelector('[data-workshops]');
  if (!list) return;
  const empty = document.querySelector('[data-workshops-empty]');
  const upcoming = await loadUpcoming();
  list.replaceChildren(...upcoming.map(row));
  list.hidden = upcoming.length === 0;
  if (empty) empty.hidden = upcoming.length > 0;
}

init();
