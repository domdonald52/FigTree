// Lists upcoming workshops from data/workshops.json.
//
// Each workshop: { "date": "2026-10-24", "time": "1:30–4pm", "name": "…", "venue": "…",
//                  "price": "$95", "blurb": "…", "register": "https://…", "details": "https://…",
//                  "draft": false }
// Workshops whose date has passed, or marked "draft": true, are not shown. When none are
// left, the "New dates coming soon" message appears instead.
// (Later this can read Cate's Google Sheet instead of the JSON file.)

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function dayLabel(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'long' });
}

function row(w) {
  const actions = el('div', { className: 'session-actions' });
  if (w.register) actions.append(el('a', { className: 'button', href: w.register, textContent: 'Register' }));
  if (w.details) actions.append(el('a', { href: w.details, textContent: 'Event details', style: 'padding: 8px 0; font-size: 15px' }));

  const where = [w.venue, w.price].filter(Boolean).join(' · ');
  return el(
    'article',
    { className: 'session' },
    el(
      'div',
      { className: 'session-when' },
      el('span', { className: 'session-day', textContent: dayLabel(w.date) }),
      el('span', { className: 'piece-meta', textContent: [w.time, '2½ hours'].filter(Boolean).join(' · ') }),
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
  try {
    workshops = await (await fetch('/data/workshops.json')).json();
  } catch {
    // show the empty message
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = workshops
    .filter((w) => !w.draft && w.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  list.replaceChildren(...upcoming.map(row));
  list.hidden = upcoming.length === 0;
  if (empty) empty.hidden = upcoming.length > 0;
}

init();
