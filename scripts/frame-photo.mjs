// Shared by the gallery fetch scripts: crops a product photo to a consistent 4:5 frame
// with the piece standing near the bottom, so captions sit right under it.

import sharp from 'sharp';

// Output frame: 4:5, piece fills up to 76% of the width / 80% of the height,
// with its base 10% above the bottom edge.
const FRAME_W = 900;
const FRAME_H = 1125;
const MAX_W = 0.76;
const MAX_H = 0.8;
const BASE = 0.9;

export async function framePhoto(src, outFile) {
  const res = await fetch(src, { headers: { 'User-Agent': 'figtree-studio-site' } });
  if (!res.ok) throw new Error(`image ${src} → HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  const { width: imgW, height: imgH } = await sharp(input).metadata();

  // Find where the piece is: trim away the plain background (ORA shoots on white or grey).
  // A soft threshold ignores faint shading and shadows.
  const { info } = await sharp(input).trim({ threshold: 24 }).toBuffer({ resolveWithObject: true });
  const piece = {
    left: -(info.trimOffsetLeft ?? 0),
    top: -(info.trimOffsetTop ?? 0),
    width: info.width,
    height: info.height,
  };

  // Choose a 4:5 window of the original photo around the piece: the piece fills up to
  // MAX_W × MAX_H of it and stands with its base at BASE. Cropping (rather than pasting
  // onto a flat colour) keeps the photo's own background continuous, with no visible box.
  let winH = Math.max(piece.height / MAX_H, (piece.width / MAX_W) * (FRAME_H / FRAME_W));
  let winW = winH * (FRAME_W / FRAME_H);
  const fit = Math.min(1, imgW / winW, imgH / winH);
  winW *= fit;
  winH *= fit;

  const clamp = (v, max) => Math.min(Math.max(0, v), max);
  const left = Math.round(clamp(piece.left + piece.width / 2 - winW / 2, imgW - winW));
  const top = Math.round(clamp(piece.top + piece.height - BASE * winH, imgH - winH));

  await sharp(input)
    .extract({ left, top, width: Math.floor(winW), height: Math.floor(winH) })
    .resize(FRAME_W, FRAME_H, { fit: 'cover' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outFile);
}
