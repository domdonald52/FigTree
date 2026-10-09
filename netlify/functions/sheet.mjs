// Reads one tab of Cate's Google Sheet and returns its rows as JSON, for the pages that
// list workshops, studio pieces, galleries, exhibitions and media.
//
//   GET /api/sheet?tab=Workshops  →  { rows: [ { date: "2026-10-24", time: "1:30–4pm", … } ] }
//
// Column headings become keys: "Booking link" → "booking_link". Date cells come back as
// "YYYY-MM-DD"; "09/2026"-style text as "2026-09". Responses are cached by Netlify's CDN for
// a few minutes, so edits in the sheet show within about 5 minutes without a rebuild.
//
// The sheet must be shared as "Anyone with the link → Viewer". Its id comes from the
// SHEET_ID environment variable (Netlify → Environment variables), or the default below.
// Only the tabs listed here can be read through this endpoint.

const DEFAULT_SHEET_ID = '';
const TABS = ['Workshops', 'Studio', 'Galleries', 'Exhibitions', 'Media'];

export function keyOf(label) {
  return String(label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const pad = (n) => String(n).padStart(2, '0');

export function cellValue(cell) {
  if (!cell || cell.v === null || cell.v === undefined) return '';
  const v = cell.v;
  if (typeof v === 'string') {
    const d = v.match(/^Date\((\d+),(\d+),(\d+)/); // gviz date: month is 0-based
    if (d) return `${d[1]}-${pad(Number(d[2]) + 1)}-${pad(d[3])}`;
    const my = v.trim().match(/^(\d{1,2})\/(\d{4})$/); // "09/2026"
    if (my) return `${my[2]}-${pad(my[1])}`;
    return v.trim();
  }
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  // numbers: use the sheet's own formatting when there is one (e.g. "$95"), else the number
  return cell.f ?? String(v);
}

// The gviz endpoint wraps JSON in a JavaScript call: google.visualization.Query.setResponse({...});
export function parseGviz(text) {
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  if (json.status === 'error') throw new Error(json.errors?.[0]?.detailed_message || 'sheet error');
  const keys = json.table.cols.map((c) => keyOf(c.label || c.id));
  return json.table.rows
    .map((r) => Object.fromEntries(keys.map((k, i) => [k, cellValue(r.c?.[i])])))
    .filter((row) => Object.values(row).some((v) => v !== ''));
}

export default async (req) => {
  const tab = new URL(req.url).searchParams.get('tab');
  const sheetId = process.env.SHEET_ID || DEFAULT_SHEET_ID;
  if (!TABS.includes(tab)) return Response.json({ error: 'unknown tab' }, { status: 404 });
  if (!sheetId) return Response.json({ error: 'no sheet configured' }, { status: 503 });

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(tab)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = parseGviz(await res.text());
    return Response.json(
      { rows },
      {
        headers: {
          'Cache-Control': 'public, max-age=60',
          'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      },
    );
  } catch (err) {
    console.warn(`sheet ${tab}: ${err.message}`);
    return Response.json({ error: 'sheet unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
};

export const config = { path: '/api/sheet' };
