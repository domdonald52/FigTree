# Fig Tree Studio — Cate Pates

Website for ceramic artist Cate Pates (Fig Tree Studio, Lower Hutt, Wellington), hosted on Netlify.

## Quick links

- **Netlify project:** https://app.netlify.com/projects/figtreestudionz/overview
- **Live site:** https://figtreestudionz.netlify.app
- **GitHub repository:** https://github.com/domdonald52/FigTree (live site publishes from `main`; work happens on `claude/cate-pates-portfolio-l2zfyj`)
- **Preview of work in progress (free):** https://claude-cate-pates-portfolio-l2zfyj--figtreestudionz.netlify.app
- **Design canvas (Nature vs Gallery designs, logo concepts):** https://claude.ai/artifact/QSTbKPhT6K89ykfqq2f36x
- **Cate's work at ORA Gallery:** https://oragallery.co.nz/collections/cate-pates
- **Cate's work at The Vault:** https://www.thevaultnz.com/category/cate-pates/474.aspx
- **Google Sheet (website content):** _to be added_ — template: `sheet-template/fig-tree-studio-website.xlsx` (Sales record kept separately: `sheet-template/fig-tree-studio-sales.xlsx`)

## Next steps

1. Create the Google Sheet (tabs **Workshops**, **Galleries**, **Exhibitions**, **Media**, **Studio**), share it with Cate as an editor and set *Anyone with the link → Viewer*; then connect the site to it.
2. Optional: create a Netlify build hook and save it in GitHub as `NETLIFY_BUILD_HOOK` so ORA photos can be refreshed by hand (see below).
3. Confirm with Cate: design choice, workshop details, Wellington Artspace listing, and ask ORA about using their photos.

The site uses the "Gallery" design (clean and white, Cormorant Garamond + Instrument Sans, fig tree mark). Pages live in `site/`:

| Page | File |
|---|---|
| Home | `site/index.html` |
| Gallery — from Cate's studio (Stripe), at ORA and The Vault + selected past work | `site/work.html` |
| Workshops | `site/workshops.html` |
| Media — articles, podcasts, radio, video | `site/media.html` |
| About + contact form | `site/about.html` (form handled by Netlify Forms; thank-you page `site/thanks.html`) |

Shared styles are in `site/css/style.css`. The site is kept out of search engines until launch (`site/robots.txt` and the header in `netlify.toml`) — remove both to go public.

## The Google Sheet

Workshops, studio pieces, galleries, exhibitions and media come from one Google Sheet with tabs **Workshops**, **Studio**, **Galleries**, **Exhibitions** and **Media**. The column layout (with sample rows) is in `sheet-template/fig-tree-studio-website.xlsx`, and explained for Cate in her user guide.

- The sheet must be shared as *Anyone with the link → Viewer*. Set its id (the long part of its address between `/d/` and `/edit`) as the `SHEET_ID` environment variable in Netlify (scope: Functions), then redeploy.
- `netlify/functions/sheet.mjs` serves each tab as JSON at `/api/sheet?tab=<Tab>`; Netlify's CDN caches it for 5 minutes, so edits show within about 5 minutes with no rebuild. Only those five tabs can be read.
- The pages (`site/js/sheet.js` and the page scripts) fall back to `site/data/*.json` and the lists written into the HTML if the sheet isn't set up or can't be reached.
- **Sales** (buyers' names and emails) must never go in this sheet, because it's readable by anyone with the link. Keep it in the separate private sales sheet.

## Workshops

Upcoming workshops come from `site/data/workshops.json` (see `site/js/workshops.js` for the fields). Workshops whose date has passed, or that have `"draft": true`, are hidden; when none are left the page shows "New dates coming soon". The two current entries are drafts until real dates, venues, prices and links are confirmed. This can later read from Cate's Google Sheet instead.

## Media

Articles, podcasts, radio and video features come from `site/data/media.json` (see `site/js/media.js` for the fields: date, type, title, outlet, blurb, link, draft), newest first. The link reads *Listen* for podcasts and radio, *Watch* for video and *Read* otherwise. **The four current entries are placeholders — replace them or mark them `"draft": true` before going live.** This can later read a **Media** tab in the Google Sheet (`date | type | title | outlet | description | link | show`).

## Contact form

Uses Netlify Forms. In Netlify, open Forms → enable form detection, then add an email notification so messages reach Cate.

## How the ORA pieces stay up to date

Nobody needs to edit the site when a piece sells or a price changes.

1. **On every build** (`npm run build`, run by Netlify), `scripts/fetch-ora.mjs` reads Cate's collection from ORA Gallery's shop and, for each piece still for sale:
   - downloads the main photo,
   - **trims the empty background** around the piece and re-frames it at a consistent size, standing near the bottom of a 4:5 frame, so captions sit right under the piece,
   - saves the title, price, size and ORA link to `site/data/ora.json` (photos go in `site/ora/`).

   If ORA can't be reached, the last saved data is kept and the build carries on.
2. **When someone visits**, `site/js/ora.js` draws the pieces and checks ORA once more: pieces sold since the last build disappear, price changes show, and pieces listed since the last build appear straight away with ORA's own photo.
3. **Optional, by hand:** the next build gives new pieces trimmed photos (and refreshes The Vault list). To force one, run the GitHub Action *Refresh ORA photos* (`.github/workflows/refresh-ora.yml`; Actions → Run workflow). It needs a Netlify build hook URL saved as the repository secret `NETLIFY_BUILD_HOOK`. Each run is a production deploy (15 credits).

## Saving Netlify credits

On the free plan each production deploy costs 15 of the 300 monthly credits; branch deploys and previews are free.

- Changes go to `claude/cate-pates-portfolio-l2zfyj` first and show on the free preview link above.
- When happy, merge them into `main` in one go (one pull request = one production deploy).
- Builds are skipped automatically when only files outside the site change (e.g. this README) — see `ignore` in `netlify.toml`.

## Pieces at The Vault

`scripts/fetch-vault.mjs` does the same job for The Vault (2 Plimmer Steps, Wellington) on every build: it reads Cate's artist page on thevaultnz.com and each product page, frames the photos the same way (shared code in `scripts/frame-photo.mjs`) and writes `site/data/vault.json` and `site/vault/`. The Vault's shop has no data feed and can't be checked from the browser, so unlike ORA the Vault list is as of the last build: sold pieces drop off, and new ones appear, at the next deploy. If the page can't be read, the previous list is kept.

## Selling from the studio (Stripe payment links)

Pieces Cate sells herself appear under **From Cate's studio** on the Gallery page. They come from `site/data/studio.json` (later the **Studio** tab of the Google Sheet: `key | title | price | size | photo | link | sold | show`). The two current entries are **placeholders** — remove them before going live. See `site/js/studio.js` for the fields.

How a sale works:

1. Each piece has its own Stripe **payment link** (pasted into `link`). The Buy button adds `client_reference_id=<key>` to it, so Stripe knows which piece it was.
2. The buyer pays on Stripe's checkout page and is sent to `/order-thanks.html`.
3. Stripe calls `/api/stripe-webhook` (`netlify/functions/stripe-webhook.mjs`). The function checks Stripe's signature and, once the payment has gone through, records the piece as sold (Netlify Blobs).
4. The Gallery page asks `/api/studio-sold` and shows the piece as **Sold** straight away — no rebuild, no deploy credits. Cate can also type `yes` in the `sold` column.

A piece with no link shows **Enquire →** (to the contact form) instead of Buy.

### Setting up each payment link (Stripe Dashboard → Payment links → New)

- Product: the piece's name, photo and NZD price, one-off.
- Quantity: fixed at 1. **Limit the number of payments: 1** (so it can never sell twice).
- Collect customers' addresses: shipping, New Zealand only; add shipping rates (e.g. "Courier, insured" and "Pick-up — arranged by email").
- After payment: *Don't show confirmation page* → redirect to `https://<site>/order-thanks.html`.
- Leave payment methods on automatic (Stripe shows cards, Apple Pay, Google Pay etc.).
- Tick **Require customers to accept your terms of service** (needs the terms URL `https://<site>/terms.html` set once under Stripe Settings → Business → Public details).
- Leave automatic tax **off** unless Cate is GST-registered.
- Keep the piece's `key` in the sheet the same once it's listed.

### Connecting the webhook (once per Stripe account, and again for live mode)

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**: `https://<site>/api/stripe-webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
2. Copy the endpoint's **signing secret** (`whsec_…`).
3. Netlify → Project configuration → Environment variables → add `STRIPE_WEBHOOK_SECRET` with that value (scope: Functions; mark it secret). Redeploy.

No Stripe API key is used anywhere. Never paste keys into the code, the sheet or a chat. Test first in a Stripe **sandbox** with test cards (e.g. 4242 4242 4242 4242), then repeat the webhook step in live mode.

## Terms & privacy

`site/terms.html` sets out the terms for buying from the site, commissions and workshops, plus a privacy statement, written to fit NZ consumer law (no blanket "no refunds": change-of-mind refunds can be refused, but faulty/damaged/not-as-described goods are covered by the Consumer Guarantees Act). It's linked from every footer, the studio section, the workshop FAQ and the contact form. Buyers accept it at Stripe checkout (terms checkbox) and in Humanitix (custom refund policy + a terms checkbox question). Not legal advice; have it checked before launch.

## Handing everything over to Cate

Everything is currently in Dom's accounts. A shared studio email on her domain (e.g. hello@catepates.co.nz, forwarding to both) makes the move easiest — use it for all the new accounts.

- [ ] **Stripe** — can't be transferred to another person (it's tied to the owner's identity and bank account). Cate creates her own account, verifies it and adds her bank account, then invites Dom as a team member. Recreate the products and payment links there, paste the new links into the sheet, and repeat *Connecting the webhook* with the new signing secret.
- [ ] **GitHub** — Settings → Danger zone → *Transfer ownership* to Cate's account. She adds Dom back as a collaborator and installs the Claude GitHub app on the repository so Claude sessions can keep working on it.
- [ ] **Netlify** — either *Transfer project* to a team Cate owns (needs you both on that team), or create a new project in her account from the repository (10 minutes). Then: add `STRIPE_WEBHOOK_SECRET`, set the production branch to `main` and branch deploys as now, move the custom domain, export old form submissions, turn on form notifications, and update the Stripe webhook URL if the site address changed.
- [ ] **Google Sheet** — Share → make Cate the owner; Dom stays an editor.
- [ ] **Domain** — check catepates.co.nz is registered in Cate's name at MyHost.
- [ ] **Instagram / Facebook / ORA / The Vault** — nothing to move; the site only links to them.

## Netlify setup

- Import this repository in Netlify ("Add new site → Import an existing project → GitHub").
- Build command and publish folder come from `netlify.toml` (`npm run build`, `site`).
- Production branch: `main`. Branch deploys: `claude/cate-pates-portfolio-l2zfyj` only.
- Optional: create a build hook for `main` (Project configuration → Build & deploy → Build hooks) and save its URL in GitHub as the `NETLIFY_BUILD_HOOK` secret for the manual ORA photo refresh.

Please check with ORA Gallery that they're happy for their listings and photos to appear here.

## Local preview

```sh
npm install
npm run build
npx serve site
```
