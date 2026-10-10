// Lists articles, podcasts, radio and video features from data/media.json, newest first.
//
// Each item: { "date": "2026-09" (or "2026-09-14"), "type": "Podcast", "title": "…",
//              "outlet": "…", "blurb": "…", "link": "https://…", "draft": false }
// Items marked "draft": true are not shown. When nothing is left, the empty message appears.
// Rows come from the Media tab of Cate's Google Sheet when it's connected (see sheet.js),
// otherwise from data/media.json.
//
// A link to a file in Google Drive (an interview recording Cate keeps in Drive) plays right
// here: "Listen" opens Drive's own small player under the entry instead of leaving the site.
// The file must be shared "Anyone with the link". Other links open as usual.

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

// "https://drive.google.com/file/d/<id>/view?…" → <id>
function driveId(link) {
  return String(link || '').match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/)?.[1];
}

// A Listen/Watch button that opens Drive's player inside the entry.
function playerToggle(item, verb, article) {
  const isVideo = (item.type || '').toLowerCase() === 'video';
  const button = el('button', { type: 'button', className: 'text-link media-play', textContent: `${verb} ▸` });
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    let player = article.querySelector('.media-player');
    if (!player) {
      player = el('div', { className: `media-player${isVideo ? ' is-video' : ''}` },
        el('iframe', {
          src: `https://drive.google.com/file/d/${driveId(item.link)}/preview`,
          title: `${verb}: ${item.title}`,
          allow: 'autoplay',
          loading: 'lazy',
        }));
      article.querySelector('.session-body').append(player);
    } else {
      player.hidden = !player.hidden;
    }
    const open = !player.hidden;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Close player' : `${verb} ▸`;
  });
  return button;
}

function row(item) {
  const verb = ACTION[(item.type || '').toLowerCase()] || 'Read';
  const article = el(
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
  );
  if (item.link && driveId(item.link)) article.append(playerToggle(item, verb === 'Read' ? 'Open' : verb, article));
  else if (item.link) article.append(el('a', { className: 'text-link', style: 'padding-top: 4px', href: item.link, textContent: `${verb} →` }));
  return article;
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
