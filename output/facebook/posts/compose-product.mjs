// Product creative: real app screenshot on the brand background with a hook, sub line, audience line,
// floating chip, pill button and URL. Usage: node compose-product.mjs spec.json  (paths relative to repo root)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url)); const ROOT = resolve(HERE, "../../..");
const sharpDir = process.env.SHARP_DIR || ROOT;
const { default: sharp } = await import(resolve(sharpDir, "node_modules/sharp/lib/index.js"));
const spec = JSON.parse(readFileSync(resolve(ROOT, process.argv[2]), "utf8"));
const src = readFileSync(resolve(ROOT, "src/lib/brand-mark.ts"), "utf8");
const paths = (name, endName) => { const b = src.slice(src.indexOf(name), src.indexOf(endName)); return [...b.matchAll(/"([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`).join(""); };
const WING = paths("WING_PATHS", "WORDMARK_VIEWBOX");
const wordBlock = src.slice(src.indexOf("WORDMARK_PATHS")); const WORD = [...wordBlock.matchAll(/"([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`).join("");
const F = (w) => resolve(ROOT, `assets/fonts/Geist-${w}.ttf`);
const IVORY = "#faf8f3", ORANGE = "#c0603f", INK = "#2b2926";
const W = 1080, H = 1350;
async function text(markup, weight, size, width, align = "centre", spacing = 0) {
  const { data, info } = await sharp({ text: { text: markup, font: `Geist ${weight === "Regular" ? "" : weight} ${size}`.replace("  ", " "), fontfile: F(weight), width, rgba: true, align, spacing } }).png().toBuffer({ resolveWithObject: true });
  return { input: data, w: info.width, h: info.height };
}
const svg = (w, h, inner) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${inner}</svg>`);
const layers = [];
const centre = (l, y) => layers.push({ input: l.input, left: Math.round((W - l.w) / 2), top: y });
// background
const bg = await sharp(resolve(ROOT, spec.background)).resize(W, H, { fit: "cover" }).toBuffer();
// logo lockup, ivory, ~320 wide
const logoW = 320, wingW = Math.round(logoW * 0.235), wordW = logoW - wingW - 14;
const logo = svg(logoW, 80, `<svg x="0" y="${Math.round((80 - wingW * 190 / 240) / 2)}" width="${wingW}" height="${Math.round(wingW * 190 / 240)}" viewBox="0 0 240 190" fill="${IVORY}">${WING}</svg><svg x="${wingW + 14}" y="${Math.round((80 - wordW * 172 / 757) / 2)}" width="${wordW}" height="${Math.round(wordW * 172 / 757)}" viewBox="0 0 757 172" fill="${IVORY}">${WORD}</svg>`);
layers.push({ input: logo, left: Math.round((W - logoW) / 2), top: 64 });
let y = 168;
if (spec.pill) { const t = await text(`<span foreground="${IVORY}" letter_spacing="3072">${spec.pill.toUpperCase()}</span>`, "Medium", 24, 800); const pw = t.w + 56, ph = 52;
  layers.push({ input: svg(pw, ph, `<rect x="1" y="1" width="${pw - 2}" height="${ph - 2}" rx="26" fill="none" stroke="${IVORY}" stroke-opacity="0.85" stroke-width="2"/>`), left: Math.round((W - pw) / 2), top: y });
  layers.push({ input: t.input, left: Math.round((W - t.w) / 2), top: y + Math.round((ph - t.h) / 2) }); y += ph + 30; }
const hl = await text(`<span foreground="${IVORY}">${spec.headline}</span>`, "Bold", spec.headlineSize || 84, 960, "centre", -4); centre(hl, y); y += hl.h + 22;
if (spec.sub) { const t = await text(`<span foreground="${IVORY}">${spec.sub}</span>`, "Medium", 38, 900); centre(t, y); y += t.h + 14; }
if (spec.audience) { const t = await text(`<span foreground="#f6dccd">${spec.audience}</span>`, "Regular", 30, 900); centre(t, y); y += t.h; }
// screenshot: rounded, with shadow
const shotW = spec.shotWidth || 860; const shotTop = y + 40;
const srcMeta = await sharp(resolve(ROOT, spec.screenshot)).metadata();
const cropH = Math.round(srcMeta.height * (spec.cropRatio || 1));
const shotBuf = await sharp(resolve(ROOT, spec.screenshot)).extract({ left: 0, top: 0, width: srcMeta.width, height: cropH }).resize({ width: shotW }).png().toBuffer();
const meta = await sharp(shotBuf).metadata(); const shotH = meta.height; const r = 22;
const mask = svg(shotW, shotH, `<rect width="${shotW}" height="${shotH}" rx="${r}" fill="#fff"/>`);
const rounded = await sharp(shotBuf).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
const shadow = await sharp(svg(shotW + 120, shotH + 120, `<rect x="60" y="70" width="${shotW}" height="${shotH}" rx="${r}" fill="#3a1408" fill-opacity="0.55"/>`)).blur(28).png().toBuffer();
const shotLeft = Math.round((W - shotW) / 2);
layers.push({ input: shadow, left: shotLeft - 60, top: shotTop - 60 });
layers.push({ input: svg(shotW + 4, shotH + 4, `<rect x="1" y="1" width="${shotW + 2}" height="${shotH + 2}" rx="${r + 1}" fill="none" stroke="#f0a070" stroke-opacity="0.7" stroke-width="2"/>`), left: shotLeft - 2, top: shotTop - 2 });
layers.push({ input: rounded, left: shotLeft, top: shotTop });
// floating chip over the bottom-right of the screenshot
if (spec.chip) { const t1 = await text(`<span foreground="${IVORY}">${spec.chip.title}</span>`, "Bold", 30, 600, "left"); const t2 = await text(`<span foreground="#d9cfc4">${spec.chip.sub}</span>`, "Regular", 24, 600, "left");
  const cw = Math.max(t1.w, t2.w) + 64 + 56, ch = 108; const cx = shotLeft + shotW - cw + 24, cy = shotTop + shotH - 62;
  layers.push({ input: svg(cw, ch, `<rect width="${cw}" height="${ch}" rx="20" fill="#1c1a17" stroke="#f0a070" stroke-opacity="0.8" stroke-width="2"/><circle cx="40" cy="${ch / 2}" r="18" fill="${ORANGE}"/><path d="M31 ${ch / 2} l6 6 l12 -12" stroke="${IVORY}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`), left: cx, top: cy });
  layers.push({ input: t1.input, left: cx + 72, top: cy + 22 }); layers.push({ input: t2.input, left: cx + 72, top: cy + 22 + t1.h + 2 }); }
// button + url at the bottom
const bt = await text(`<span foreground="${ORANGE}">${spec.button}  →</span>`, "Bold", 34, 800); const bw = bt.w + 96, bh = 84; const by = H - 176;
layers.push({ input: svg(bw, bh, `<rect width="${bw}" height="${bh}" rx="42" fill="${IVORY}"/>`), left: Math.round((W - bw) / 2), top: by });
layers.push({ input: bt.input, left: Math.round((W - bt.w) / 2), top: by + Math.round((bh - bt.h) / 2) });
const url = await text(`<span foreground="${IVORY}">${spec.url}</span>`, "Medium", 30, 600); centre(url, by + bh + 22);
await sharp(bg).composite(layers).png().toFile(resolve(ROOT, spec.out));
console.log("wrote", spec.out, "| screenshot top", shotTop, "bottom", shotTop + shotH, "| button", by);
