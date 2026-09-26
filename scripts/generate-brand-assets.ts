/** Regenerate the approved 1A assets with Node 24: node scripts/generate-brand-assets.ts */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

import {
  WING_PATHS,
  WING_VIEWBOX,
  WORDMARK_PATHS,
  WORDMARK_VIEWBOX,
} from "../src/lib/brand-mark.ts";

// Match the site's mono foreground/background: ink on white, no warm tint.
const ink = "#171717";
const paper = "#ffffff";
const muted = "#737373";
const publicDir = resolve("public/brand");
const facebookDir = resolve("output/facebook");

const paths = (values: readonly string[]) => values.map((d) => `<path d="${d}"/>`).join("");
const wing = paths(WING_PATHS);
const wordmark = paths(WORDMARK_PATHS);
const logo = `<svg width="240" height="190" viewBox="${WING_VIEWBOX}">${wing}</svg>
  <svg x="256" y="38" width="757" height="172" viewBox="${WORDMARK_VIEWBOX}">${wordmark}</svg>`;

function svg(width: number, height: number, content: string, viewBox = `0 0 ${width} ${height}`) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="${ink}" role="img" aria-label="LeadWing">${content}</svg>`;
}

function square(size: number, background: string, foreground: string, inset: number) {
  const markWidth = size * (1 - inset * 2);
  const markHeight = markWidth * 190 / 240;
  return svg(size, size, `<rect width="${size}" height="${size}" fill="${background}"/>
    <svg x="${size * inset}" y="${(size - markHeight) / 2}" width="${markWidth}" height="${markHeight}" viewBox="${WING_VIEWBOX}" fill="${foreground}">${wing}</svg>`);
}

async function png(source: string, target: string) {
  await sharp(Buffer.from(source)).png().toFile(target);
}

// PNG-compressed entries are supported by the ICO format. Include small sizes
// explicitly, so browsers never have to shrink a single large icon themselves.
async function favicon() {
  const sizes = [16, 32, 48, 64];
  const images = await Promise.all(sizes.map((size) =>
    sharp(Buffer.from(square(size * 4, paper, ink, 0.05))).resize(size, size).png().toBuffer()
  ));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + i * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += images[i].length;
  });
  await writeFile("src/app/favicon.ico", Buffer.concat([header, ...images]));
}

async function coverText(text: string, size: number, color: string) {
  const { data, info } = await sharp({ text: {
    text: `<span foreground="${color}">${text}</span>`,
    font: `Geist ${size}`,
    fontfile: resolve("assets/fonts/Geist-Regular.ttf"),
    rgba: true,
  } }).png().toBuffer({ resolveWithObject: true });
  return { data, width: info.width };
}

await mkdir(publicDir, { recursive: true });
await mkdir(facebookDir, { recursive: true });

await writeFile(resolve(publicDir, "mark.svg"), svg(240, 190, wing));
await writeFile(resolve(publicDir, "wordmark.svg"), svg(757, 172, wordmark));
await writeFile(resolve(publicDir, "logo.svg"), svg(1024, 214, logo));

// A transparent, theme-aware favicon; installed-app PNGs have an opaque white
// background so system cropping never exposes a transparent black backdrop.
await writeFile("public/icon.svg", svg(512, 512, `<style>
  .wing { fill: ${ink}; }
  @media (prefers-color-scheme: dark) { .wing { fill: ${paper}; } }
  </style><svg x="20" y="69" width="472" height="374" viewBox="${WING_VIEWBOX}" class="wing">${wing}</svg>`));
await png(square(192, paper, ink, 0.12), "public/icon-192.png");
await png(square(512, paper, ink, 0.12), "public/icon-512.png");
await png(square(180, paper, ink, 0.12), "src/app/apple-icon.png");
await favicon();

// Room around the wing keeps both tips inside Facebook's circular profile crop.
await png(square(1024, ink, paper, 0.18), resolve(facebookDir, "leadwing-profile.png"));

// Twice 851 × 315. Keep the logo and copy central, away from the overlapping
// profile picture and the edges that Facebook crops on different displays.
const coverWidth = 1702;
const coverHeight = 630;
const cover = svg(coverWidth, coverHeight, `<rect width="1702" height="630" fill="${paper}"/>
  <svg x="407" y="145" width="888" height="186" viewBox="0 0 1024 214">${logo}</svg>`);
const tagline = await coverText("The CRM for independent real estate agents.", 36, ink);
const domain = await coverText("leadwing.app", 28, muted);
await sharp(Buffer.from(cover)).composite([
  { input: tagline.data, left: Math.round((coverWidth - tagline.width) / 2), top: 374 },
  { input: domain.data, left: Math.round((coverWidth - domain.width) / 2), top: 447 },
]).png().toFile(resolve(facebookDir, "leadwing-cover.png"));

console.log("Generated SVG brand assets, app icons, favicon, and two Facebook PNGs.");
