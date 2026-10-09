// A quick health check for Dom: is the Google Sheet connected, and is Stripe set up?
// Shows counts and yes/no only — never any secret values or buyers' details.
//   GET /api/status

import { getStore } from '@netlify/blobs';
import { parseGviz } from './sheet.mjs';

const TABS = ['Workshops', 'Studio', 'Galleries', 'Exhibitions', 'Media'];

export default async () => {
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

  return Response.json(
    { sheet, stripe: { webhookSecretSet: Boolean(process.env.STRIPE_WEBHOOK_SECRET), soldPieces: sold } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const config = { path: '/api/status' };
