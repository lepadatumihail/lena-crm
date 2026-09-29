// Render an HTML ad (an element #ad, 1080x1350) to PNG: captured at 2x, then downsampled to 1080x1350.
// Usage: PLAYWRIGHT_DIR=<dir> node output/facebook/posts/render-html-ad.mjs <file.html> [name=query ...]
//   e.g. node output/facebook/posts/render-html-ad.mjs output/facebook/posts/free10-mono.html \
//          12-ad-free10-mono= 12-ad-free10-mono-light=t=paper
// Writes <name>.png next to the HTML. playwright-core isn't a repo dependency (see output/video/record.mjs).
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pwCandidates = [process.env.PLAYWRIGHT_DIR && join(resolve(process.env.PLAYWRIGHT_DIR), "node_modules/playwright-core/index.mjs"), join(ROOT, "node_modules/playwright-core/index.mjs")].filter(Boolean);
const pwPath = pwCandidates.find(existsSync);
if (!pwPath) throw new Error(`playwright-core not found. Tried:\n  ${pwCandidates.join("\n  ")}\nnpm i --prefix <dir> playwright-core, then PLAYWRIGHT_DIR=<dir>.`);
const { chromium } = await import(pathToFileURL(pwPath).href);
const { default: sharp } = await import(pathToFileURL(join(process.env.SHARP_DIR || ROOT, "node_modules/sharp/lib/index.js")).href);

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  if (!existsSync(cache)) return undefined;
  const shells = readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const d of shells) for (const sub of readdirSync(join(cache, d))) {
    const exe = join(cache, d, sub, "chrome-headless-shell");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

const [file, ...jobs] = process.argv.slice(2);
if (!file) throw new Error("usage: render-html-ad.mjs <file.html> [name=query ...]");
const html = resolve(file);
const outDir = dirname(html);
const browser = await chromium.launch({ executablePath: findChrome() });
for (const job of jobs.length ? jobs : [`${html.split("/").pop().replace(/\.html$/, "")}=`]) {
  const [name, query = ""] = job.split(/=(.*)/s);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  await page.goto(`${pathToFileURL(html).href}?${query}`, { waitUntil: "load" });
  await page.evaluate(() => window.__ready);
  await page.waitForTimeout(400);
  const big = await page.locator("#ad").screenshot();
  const out = join(outDir, `${name}.png`);
  await sharp(big).resize(1080, 1350, { kernel: "lanczos3" }).png().toFile(out);
  console.log("wrote", out);
  await page.close();
}
await browser.close();
