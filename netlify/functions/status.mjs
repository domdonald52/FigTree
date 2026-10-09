// A quick health check for Dom: is the Google Sheet connected, and is Stripe set up?
// Shows counts and yes/no only — never any secret values or buyers' details.
//   GET /api/status

import { getStore } from '@netlify/blobs';
import { parseGviz } from './sheet.mjs';
import { ARTIST_PAGE, fetchText, listPieces } from '../../scripts/vault-parse.mjs';

const TABS = ['Workshops', 'Studio', 'Galleries', 'Exhibitions', 'Media'];

export default async (req) => {
  const sheetId = process.env.SHEET_ID || '';
  const sheet = { configured: Boolean(sheetId), tabs: {} };
  if (sheetId) {
    await Promise.all(TABS.map(async (tab) => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(tab)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} (is the sheet shared as "Anyone with the link"?)`);
        const rows = parseGviz(await res.text());
        const info = { ok: true, rows: rows.length };
        if (tab === 'Workshops') {
          // Why each workshop is or isn't on the Workshops page (same rules as site/js/workshops.js).
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
          const yes = (v) => ['yes', 'y', 'true', '1'].includes(String(v || '').trim().toLowerCase());
          info.workshops = rows.filter((r) => r.workshop).map((r) => {
            let shown = 'shown';
            if (!yes(r.show)) shown = 'hidden: Show is not yes';
            else if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) shown = `hidden: can't read the date "${r.date}"`;
            else if (r.date < today) shown = 'hidden: date has passed';
            const link = String(r.booking_link || '').trim();
            const button = yes(r.sold_out) ? 'Sold out'
              : /^(none|no booking( needed)?|drop[ -]?in|just turn up)$/i.test(link) ? 'none (no booking needed)'
              : /^https?:\/\//i.test(link) ? `Book a place (${link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]})`
              : 'Ask about booking (contact form)';
            return { name: r.workshop, date: r.date, shown, button };
          });
        }
        if (tab === 'Studio') info.withPaymentLink = rows.filter((r) => /^https:\/\/buy\.stripe\.com\//.test(r.payment_link || '')).length;
        sheet.tabs[tab] = info;
      } catch (err) {
        sheet.tabs[tab] = { ok: false, error: err.message };
      }
    }));
  }

  let sold = null;
  try {
    sold = (await getStore('studio-sold').list()).blobs.map((b) => b.key);
  } catch (err) {
    sold = `unavailable (${err.message})`;
  }

  // The Vault: can its page still be read, and how does it compare with the last build?
  const vault = {};
  try {
    const live = listPieces(await fetchText(ARTIST_PAGE));
    vault.ok = true;
    vault.listed = live.length;
    try {
      const built = await (await fetch(new URL('/data/vault.json', req.url))).json();
      const builtHandles = new Set(built.pieces.map((p) => p.handle));
      const liveHandles = new Set(live.map((p) => p.handle));
      vault.builtAt = built.updated;
      vault.built = built.pieces.length;
      vault.goneSinceBuild = built.pieces.filter((p) => !liveHandles.has(p.handle)).map((p) => p.title);
      vault.newSinceBuild = live.filter((p) => !builtHandles.has(p.handle)).map((p) => p.title);
    } catch {
      // the built list is optional here
    }
  } catch (err) {
    vault.ok = false;
    vault.error = err.message;
  }

  return Response.json(
    { sheet, vault, stripe: { webhookSecretSet: Boolean(process.env.STRIPE_WEBHOOK_SECRET), soldPieces: sold } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const config = { path: '/api/status' };
