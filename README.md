# Fig Tree Studio — Cate Pates

Website for ceramic artist Cate Pates (Fig Tree Studio, Lower Hutt, Wellington), hosted on Netlify.

The site uses the "Gallery" design (clean and white, Cormorant Garamond + Instrument Sans, fig tree mark). Pages live in `site/`:

| Page | File |
|---|---|
| Home | `site/index.html` |
| Work — available now at ORA + selected past work | `site/work.html` |
| Workshops | `site/workshops.html` |
| About + contact form | `site/about.html` (form handled by Netlify Forms; thank-you page `site/thanks.html`) |

Shared styles are in `site/css/style.css`. The site is kept out of search engines until launch (`site/robots.txt` and the header in `netlify.toml`) — remove both to go public.

## Workshops

Upcoming workshops come from `site/data/workshops.json` (see `site/js/workshops.js` for the fields). Workshops whose date has passed, or that have `"draft": true`, are hidden; when none are left the page shows "New dates coming soon". The two current entries are drafts until real dates, venues, prices and links are confirmed. This can later read from Cate's Google Sheet instead.

## Contact form

Uses Netlify Forms. In Netlify, open Forms → enable form detection, then add an email notification so messages reach Cate.

## How the ORA pieces stay up to date

Nobody needs to edit the site when a piece sells or a price changes.

1. **On every build** (`npm run build`, run by Netlify), `scripts/fetch-ora.mjs` reads Cate's collection from ORA Gallery's shop and, for each piece still for sale:
   - downloads the main photo,
   - **trims the empty background** around the piece and re-frames it at a consistent size, standing near the bottom of a 4:5 frame, so captions sit right under the piece,
   - saves the title, price, size and ORA link to `site/data/ora.json` (photos go in `site/ora/`).

   If ORA can't be reached, the last saved data is kept and the build carries on.
2. **When someone visits**, `site/js/ora.js` draws the pieces and checks ORA once more: pieces sold since the last build disappear and price changes show straight away.
3. **Once a day**, the GitHub Action in `.github/workflows/daily-refresh.yml` asks Netlify to rebuild, so new pieces appear with trimmed photos. It needs a Netlify build hook URL saved as the repository secret `NETLIFY_BUILD_HOOK`.

## Netlify setup

- Import this repository in Netlify ("Add new site → Import an existing project → GitHub").
- Build command and publish folder come from `netlify.toml` (`npm run build`, `site`).
- Create a build hook (Site configuration → Build & deploy → Build hooks) and save its URL in GitHub as the `NETLIFY_BUILD_HOOK` secret to switch on the daily refresh.

Please check with ORA Gallery that they're happy for their listings and photos to appear here.

## Local preview

```sh
npm install
npm run build
npx serve site
```
