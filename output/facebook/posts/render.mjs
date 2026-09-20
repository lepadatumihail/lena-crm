import { readFileSync, writeFileSync } from "node:fs";
const ROOT = "/Users/lepadatumihail/Documents/work/personal/lena";
const { default: sharp } = await import(`${ROOT}/node_modules/sharp/lib/index.js`);
const src = readFileSync(`${ROOT}/src/lib/brand-mark.ts`, "utf8");
const wingBlock = src.slice(src.indexOf("WING_PATHS"), src.indexOf("WORDMARK_VIEWBOX"));
const WING = [...wingBlock.matchAll(/"([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`).join("");
const F = { bold: `${ROOT}/assets/fonts/Geist-Bold.ttf`, medium: `${ROOT}/assets/fonts/Geist-Medium.ttf`, regular: `${ROOT}/assets/fonts/Geist-Regular.ttf` };
const ORANGE = "#c0603f", IVORY = "#faf8f3", INK = "#2b2926", MUTED = "#7b7469", SAND = "#f1e7d8";
const W = 1080, H = 1350, M = 96;

async function text(markup, weight, size, width, opts = {}) {
  const { data, info } = await sharp({ text: { text: markup, font: `Geist ${weight === "bold" ? "Bold" : weight === "medium" ? "Medium" : ""} ${size}`.replace("  ", " "), fontfile: F[weight], width, rgba: true, align: "left", spacing: opts.spacing ?? 0 } }).png().toBuffer({ resolveWithObject: true });
  return { input: data, w: info.width, h: info.height };
}
const wing = (w, color) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.round(w * 190 / 240)}" viewBox="0 0 240 190" fill="${color}">${WING}</svg>`);
const rect = (w, h, fill, r = 0) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="${fill}"/></svg>`);

async function card({ file, bg, fg, accent, eyebrow, headline, sub, pill, footer }) {
  const layers = [];
  layers.push({ input: wing(168, accent), left: M, top: M });
  const eb = await text(`<span foreground="${fg}" letter_spacing="3072">${eyebrow.toUpperCase()}</span>`, "medium", 30, W - 2 * M);
  const hl = await text(headline(fg, accent), "bold", 86, W - 2 * M, { spacing: -6 });
  const sb = sub ? await text(`<span foreground="${fg === IVORY ? "#f6dccd" : MUTED}">${sub}</span>`, "regular", 40, W - 2 * M - 80, { spacing: 6 }) : null;
  const block = eb.h + 34 + hl.h + (sb ? 44 + sb.h : 0);
  let y = Math.round(300 + (H - M - 64 - 60 - 300 - block) / 2);
  layers.push({ input: eb.input, left: M, top: y }); y += eb.h + 34;
  layers.push({ input: hl.input, left: M - 4, top: y }); y += hl.h + 44;
  if (sb) { layers.push({ input: sb.input, left: M, top: y }); y += sb.h; }
  // footer: pill + url on the baseline
  const fy = H - M - 64;
  if (pill) {
    const pt = await text(`<span foreground="${pill.fg}">${pill.text}</span>`, "medium", 32, 800);
    const pw = pt.w + 64, ph = 72;
    layers.push({ input: rect(pw, ph, pill.bg, 36), left: M, top: fy - 4 });
    layers.push({ input: pt.input, left: M + 32, top: fy - 4 + Math.round((ph - pt.h) / 2) });
  }
  const ft = await text(`<span foreground="${fg}">${footer}</span>`, "medium", 34, 600);
  layers.push({ input: ft.input, left: W - M - ft.w, top: fy + Math.round((72 - ft.h) / 2) - 4 });
  await sharp({ create: { width: W, height: H, channels: 4, background: bg } }).composite(layers).png().toFile(file);
  console.log("wrote", file);
}

const out = process.argv[2] || ".";
await card({ file: `${out}/01-one-card.png`, bg: ORANGE, fg: IVORY, accent: IVORY,
  eyebrow: "Built in Marbella for Costa del Sol agents",
  headline: (fg) => `<span foreground="${fg}">Every buyer, seller, viewing, offer and document.\nOne client card.</span>`,
  sub: "Open the card and the next follow-up is already drafted.",
  pill: { text: "Free for your first 10 clients", bg: IVORY, fg: ORANGE }, footer: "leadwing.app" });
await card({ file: `${out}/02-follow-up.png`, bg: IVORY, fg: INK, accent: ORANGE,
  eyebrow: "Before a lead goes cold",
  headline: (fg, ac) => `<span foreground="${fg}">Most leads\ndon’t say no.\n</span><span foreground="${ac}">They go quiet.</span>`,
  sub: "Every buyer card shows what comes next, with the follow-up message already written. Send it as it is, or tweak it in ten seconds.",
  pill: { text: "Try it free, no card", bg: INK, fg: IVORY }, footer: "leadwing.app" });
await card({ file: `${out}/03-founding.png`, bg: INK, fg: IVORY, accent: ORANGE,
  eyebrow: "Founding Agents · first 20 paying agents",
  headline: (fg, ac) => `<span foreground="${ac}">€19</span><span foreground="${fg}"> a month\ninstead of €29.\nLocked for life.</span>`,
  sub: "Unlimited clients, every feature, cancel any time and nothing is deleted. Free still covers 10 clients forever.",
  pill: { text: "Cancel any time, nothing deleted", bg: ORANGE, fg: IVORY }, footer: "leadwing.app/pricing" });
