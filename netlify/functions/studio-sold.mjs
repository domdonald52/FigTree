// Lists the studio pieces Stripe has reported as sold (written by stripe-webhook.mjs),
// so the Gallery page can mark them without a rebuild.

import { getStore } from '@netlify/blobs';

export default async () => {
  const { blobs } = await getStore('studio-sold').list();
  return Response.json(
    { sold: blobs.map((b) => b.key) },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
};

export const config = { path: '/api/studio-sold' };
