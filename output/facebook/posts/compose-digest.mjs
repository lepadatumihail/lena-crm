// Digest card, designed: brand background, logo lockup, eyebrow, big headline, the five items in a
// translucent panel, "Curated by LeadWing" pill and URL. Usage: node compose-digest.mjs spec.json
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
const MONO = spec.theme === "mono";
const IVORY = MONO ? "#111111" : "#faf8f3", ORANGE = MONO ? "#111111" : "#c0603f", INK = "#111111", PAPER = "#ffffff", MUTED = "#6b6b6b";
const W = 1080, H = 1350;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
async function text(markup, weight, size, width, align = "left", spacing = 0) {
  const { data, info } = await sharp({ text: { text: markup, font: `Geist ${weight === "Regular" ? "" : weight} ${size}`.replace("  ", " "), fontfile: F(weight), width, rgba: true, align, spacing } }).png().toBuffer({ resolveWithObject: true });
  return { input: data, w: info.width, h: info.height };
}
const svg = (w, h, inner) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${inner}</svg>`);
const layers = []; const M = 72;
const bg = MONO ? await sharp({ create: { width: W, height: H, channels: 4, background: PAPER } }).png().toBuffer() : await sharp(resolve(ROOT, spec.background)).resize(W, H, { fit: "cover" }).toBuffer();
// logo lockup, top left
const logoW = 260, wingW = Math.round(logoW * 0.235), wordW = logoW - wingW - 12;
layers.push({ input: svg(logoW, 64, `<svg x="0" y="${Math.round((64 - wingW * 190 / 240) / 2)}" width="${wingW}" height="${Math.round(wingW * 190 / 240)}" viewBox="0 0 240 190" fill="${IVORY}">${WING}</svg><svg x="${wingW + 12}" y="${Math.round((64 - wordW * 172 / 757) / 2)}" width="${wordW}" height="${Math.round(wordW * 172 / 757)}" viewBox="0 0 757 172" fill="${IVORY}">${WORD}</svg>`), left: M, top: 64 });
// eyebrow pill, top right
const eb = await text(`<span foreground="${MONO ? MUTED : IVORY}" letter_spacing="2048">${esc(spec.eyebrow.toUpperCase())}</span>`, "Medium", 22, 700);
const pw = eb.w + 44, ph = 46;
layers.push({ input: svg(pw, ph, `<rect x="1" y="1" width="${pw - 2}" height="${ph - 2}" rx="23" fill="none" stroke="${MONO ? "#111111" : IVORY}" stroke-opacity="${MONO ? 0.25 : 0.8}" stroke-width="2"/>`), left: W - M - pw, top: 73 });
layers.push({ input: eb.input, left: W - M - pw + 22, top: 73 + Math.round((ph - eb.h) / 2) });
let y = 190;
const hl = await text(`<span foreground="${IVORY}">${esc(spec.headline)}</span>`, "Bold", spec.headlineSize || 74, W - 2 * M, "left", -3);
layers.push({ input: hl.input, left: M, top: y }); y += hl.h + 18;
const sub = await text(`<span foreground="${MONO ? MUTED : "#f6dccd"}">${esc(spec.sub)}</span>`, "Medium", 32, W - 2 * M);
layers.push({ input: sub.input, left: M, top: y }); y += sub.h + 40;
// items panel
const items = []; let ih = 0; const IW = MONO ? W - 2 * M : W - 2 * M - 2 * 44;
for (const it of spec.items) { const n = await text(`<span foreground="${ORANGE}">${items.length + 1}</span>`, "Bold", 34, 60); const t = await text(`<span foreground="${INK}">${esc(it)}</span>`, "Medium", 29, IW - 64); items.push({ n, t }); ih += Math.max(t.h, n.h) + 26; }
const panelH = ih + 2 * 40 - 26;
if (!MONO) layers.push({ input: svg(W - 2 * M, panelH, `<rect width="${W - 2 * M}" height="${panelH}" rx="28" fill="${IVORY}" fill-opacity="0.94"/>`), left: M, top: y });
const ix = MONO ? M : M + 44; let iy = y + (MONO ? 0 : 40);
for (const { n, t } of items) {
  if (MONO) { layers.push({ input: svg(W - 2 * M, 2, `<rect width="${W - 2 * M}" height="2" fill="#111111" fill-opacity="0.15"/>`), left: M, top: iy }); iy += 22; }
  layers.push({ input: n.input, left: ix, top: iy - 4 }); layers.push({ input: t.input, left: ix + 64, top: iy }); iy += Math.max(t.h, n.h) + 26; }
y = MONO ? iy : y + panelH;
// footer: pill + url, pinned to bottom
const cb = await text(`<span foreground="${MONO ? PAPER : IVORY}">${esc(spec.pill || "Curated by LeadWing")}</span>`, "SemiBold", 30, 600);
const cw = cb.w + 64, ch = 68, fy = H - 84 - ch;
layers.push({ input: svg(cw, ch, `<rect width="${cw}" height="${ch}" rx="34" fill="${INK}"/>`), left: M, top: fy });
layers.push({ input: cb.input, left: M + 32, top: fy + Math.round((ch - cb.h) / 2) });
const url = await text(`<span foreground="${IVORY}">${esc(spec.url || "leadwing.app")}</span>`, "SemiBold", 34, 500, "right");
layers.push({ input: url.input, left: W - M - url.w, top: fy + Math.round((ch - url.h) / 2) });
if (spec.takeaway) { const tk = await text(`<span foreground="${IVORY}">${esc(spec.takeaway)}</span>`, "Medium", 31, W - 2 * M); const ty = y + Math.round((fy - y - tk.h) / 2); layers.push({ input: tk.input, left: M, top: ty }); }
if (y > fy - 30) console.warn(`WARNING: items panel ends at ${y}, footer starts at ${fy}`);
await sharp(bg).composite(layers).png().toFile(resolve(ROOT, spec.out));
console.log("wrote", spec.out, "| panel bottom", y, "| footer", fy);
