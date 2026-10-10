// Stripe calls this after every checkout on one of Cate's payment links.
// When a payment has gone through it records the sale, so the Gallery page can show
// "Sold" straight away (see studio-sold.mjs and site/js/studio.js). Each sale is kept
// under "<piece code>/<checkout session>", so prints sold in editions can be counted;
// Stripe retrying the same event just rewrites the same entry.
//
// Needs one environment variable in Netlify (never in the code):
//   STRIPE_WEBHOOK_SECRET  the endpoint's signing secret (whsec_…) from the Stripe Dashboard
// No Stripe API key is needed: everything comes from the signed event itself.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const TOLERANCE_SECONDS = 300;

// Verifies the Stripe-Signature header: t=<timestamp>,v1=<hex HMAC-SHA256 of "t.body">.
// https://docs.stripe.com/webhooks.md#verify-events
export function verifySignature(body, header, secret, now = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  let t = 0;
  const signatures = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=');
    if (k === 't') t = Number(v);
    if (k === 'v1' && v) signatures.push(v);
  }
  if (!t || !signatures.length || Math.abs(now - t) > TOLERANCE_SECONDS) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${body}`).digest();
  return signatures.some((sig) => {
    const given = Buffer.from(sig, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

// Which piece sold, if this event means a payment went through. The site adds
// client_reference_id=<piece key> to each payment link, so the session carries it.
export function soldPiece(event) {
  const paidEvents = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];
  if (!paidEvents.includes(event?.type)) return null;
  const session = event.data?.object;
  // With slower payment methods "completed" can arrive before the money has; wait for
  // async_payment_succeeded in that case.
  if (!session || session.payment_status === 'unpaid') return null;
  return session.client_reference_id || session.payment_link || null;
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  if (!verifySignature(body, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);
  const key = soldPiece(event);
  if (key) {
    await getStore('studio-sold').setJSON(`${key}/${event.data.object.id}`, {
      soldAt: new Date(event.created * 1000).toISOString(),
      session: event.data.object.id,
    });
    console.log(`Studio sale: ${key}`);
  }
  return new Response('ok');
};

export const config = { path: '/api/stripe-webhook' };
