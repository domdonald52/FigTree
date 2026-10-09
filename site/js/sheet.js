// Rows from one tab of Cate's Google Sheet (via netlify/functions/sheet.mjs), or null if
// the sheet isn't connected or can't be reached — callers then fall back to data/*.json.
export async function sheetRows(tab) {
  try {
    const res = await fetch(`/api/sheet?tab=${encodeURIComponent(tab)}`);
    if (!res.ok) return null;
    const { rows } = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

export const isYes = (v) => ['yes', 'y', 'true', '1'].includes(String(v ?? '').trim().toLowerCase());

// A Google Drive share link → a direct image address; anything else is used as given.
export function photoUrl(link) {
  const id = String(link || '').match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/)?.[1];
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1200` : link;
}
