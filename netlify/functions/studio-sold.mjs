// Lists the studio pieces Stripe has reported as sold (written by stripe-webhook.mjs),
// so the Gallery page can mark them without a rebuild. "counts" says how many of each
// have sold online, for prints sold in editions.

import { getStore } from '@netlify/blobs';

// Keys are "<code>/<checkout session>"; older entries are just "<code>".
export function salesCount(keys) {
  const counts = {};
  for (const key of keys) {
    const code = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : key;
    counts[code] = (counts[code] || 0) + 1;
  }
  return counts;
}

export default async () => {
  const { blobs } = await getStore('studio-sold').list();
  const counts = salesCount(blobs.map((b) => b.key));
  return Response.json(
    { sold: Object.keys(counts), counts },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
};

export const config = { path: '/api/studio-sold' };
