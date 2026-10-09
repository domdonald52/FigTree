// Reads Cate's pieces off The Vault's artist page (thevaultnz.com has no product feed).
// Shared by scripts/fetch-vault.mjs (at build time) and netlify/functions/vault.mjs
// (the hourly live check). If The Vault changes its page layout, this is the file to fix.

export const SHOP = 'https://www.thevaultnz.com';
export const ARTIST_PAGE = `${SHOP}/category/cate-pates/474.aspx`;

export async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (figtree-studio-site)' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

export function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .trim();
}

export function textOf(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
}

export function priceText(raw) {
  const n = Number(raw.replace(/[^\d.]/g, ''));
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

// "Height: 140mm Width: 90mm Depth: 120mm" → "90 × 120 × 140 mm" (width × depth × height, like ORA)
export function sizeFrom(pageText) {
  const get = (k) => pageText.match(new RegExp(`${k}:\\s*([\\d.]+)\\s*mm`, 'i'))?.[1];
  const parts = [get('Width'), get('Depth'), get('Height')].filter(Boolean);
  return parts.length ? `${parts.join(' × ')} mm` : '';
}

// Product tiles on the artist page.
export function listPieces(html) {
  const tiles = html.match(/<div class="stylesummarybox"[\s\S]*?<\/li>/g) ?? [];
  return tiles
    .map((tile) => {
      const link = tile.match(/href="(https:\/\/www\.thevaultnz\.com\/product\/[^"]+)" title="([^"]*)"/);
      const img = tile.match(/src="(\/user\/images\/(\d+))_\d+_\d+\.jpg/);
      const price = tile.match(/class="spn_P1"[^>]*>([^<]+)</);
      if (!link || !img || !price) return null;
      const url = link[1];
      return {
        handle: url.split('/').pop().replace('.aspx', ''),
        title: decode(link[2]),
        price: priceText(price[1]),
        photo: `${SHOP}${img[1]}.jpg`, // full-size original
        url,
      };
    })
    .filter(Boolean);
}
