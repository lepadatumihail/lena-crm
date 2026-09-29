// Records leadwing-film.html into an MP4: Playwright steps the page's clock one frame at a
// time (window.__film.seek), captures each frame, and pipes the PNGs straight into ffmpeg.
// No screen recording, so every frame is exact and the result doesn't depend on machine speed.
//
//   node output/video/record.mjs                         full film → output/video/leadwing-film.mp4
//   node output/video/record.mjs --film hello-to-reserved  another film in this folder → hello-to-reserved.mp4
//   node output/video/record.mjs --format portrait       4:5 feed cut → leadwing-film-4x5.mp4 (story: 9:16 → -9x16)
//   node output/video/record.mjs --film hello-to-reserved --lang es   Spanish cut → hello-to-reserved-es.mp4
//   node output/video/record.mjs --blur 4 --audio x.wav  motion blur (4 subframes a frame) + soundtrack
//   node output/video/record.mjs --from 5 --to 10        just a range
//   node output/video/record.mjs --stills 1.5,8.2        PNG frames into --dir
//   node output/video/record.mjs --sheet 0:30:0.5        contact sheets (3 columns, 12 frames a sheet;
//                                                        a comma list of times works too)
//
// playwright-core isn't a repo dependency: install it anywhere and point PLAYWRIGHT_DIR at the
// folder that holds its node_modules (same pattern as SHARP_DIR in output/facebook/posts).
// CHROME_PATH overrides the browser; by default the newest cached Playwright headless shell is used.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
  return acc;
}, []));
const FPS = Number(args.fps || 60);
const BLUR = Number(args.blur || 1);       // subframes averaged into each frame
const SHUTTER = Number(args.shutter || 0.5); // fraction of the frame interval the subframes span
const DPR = Number(args.scale || 1);        // 2 = render at 3840×2160 and downscale
const CRF = Number(args.crf || 16);
const FORMAT = ["portrait", "story"].includes(args.format) ? args.format : "landscape";
const [VW, VH] = { landscape: [1920, 1080], portrait: [1080, 1350], story: [1080, 1920] }[FORMAT];
const FILM = String(args.film || "leadwing-film"); // the HTML file (without .html); outputs are named after it
const LANG = args.lang ? String(args.lang) : ""; // a film that reads ?lang= (film 02: es); outputs get -es
const OUT = resolve(args.out || join(HERE, FILM + (LANG ? "-" + LANG : "") + { landscape: ".mp4", portrait: "-4x5.mp4", story: "-9x16.mp4" }[FORMAT]));
const DIR = resolve(args.dir || join(HERE, "frames"));

const pwCandidates = [process.env.PLAYWRIGHT_DIR && join(resolve(process.env.PLAYWRIGHT_DIR), "node_modules/playwright-core/index.mjs"), join(ROOT, "node_modules/playwright-core/index.mjs")].filter(Boolean);
const pwPath = pwCandidates.find(existsSync);
if (!pwPath) throw new Error(`playwright-core not found. Tried:\n  ${pwCandidates.join("\n  ")}\nnpm i --prefix <dir> playwright-core, then PLAYWRIGHT_DIR=<dir>.`);
const { chromium } = await import(pathToFileURL(pwPath).href);

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  if (!existsSync(cache)) return undefined;
  const shells = readdirSync(cache).filter(d => d.startsWith("chromium_headless_shell-")).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const d of shells) {
    for (const sub of readdirSync(join(cache, d))) {
      const exe = join(cache, d, sub, "chrome-headless-shell");
      if (existsSync(exe)) return exe;
    }
  }
  return undefined;
}

const browser = await chromium.launch({ executablePath: findChrome(), args: ["--font-render-hinting=none", "--hide-scrollbars"] });
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
page.on("pageerror", e => console.error("page error:", e.message));
await page.goto(pathToFileURL(join(HERE, FILM + ".html")).href + `?record&format=${FORMAT}` + (LANG ? `&lang=${LANG}` : "") + (args.stills || args.sheet ? "&debug" : ""));
await page.evaluate(() => window.__film.ready);
const DUR = await page.evaluate(() => window.__film.duration);
const cdp = await page.context().newCDPSession(page);
async function frameAt(t) {
  await page.evaluate(x => window.__film.seek(x), t);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
  return Buffer.from(data, "base64");
}
const run = (cmd, argv, opts = {}) => new Promise((ok, fail) => {
  const p = spawn(cmd, argv, { stdio: ["pipe", "inherit", "inherit"], ...opts });
  p.on("error", fail); p.on("exit", code => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`))));
  return p;
});

if (args.stills || args.sheet) {
  mkdirSync(DIR, { recursive: true });
  let times;
  if (args.stills) times = String(args.stills).split(",").map(Number);
  else if (String(args.sheet).includes(",")) times = String(args.sheet).split(",").map(Number);
  else { const [a, b, s] = String(args.sheet).split(":").map(Number); times = []; for (let t = a; t <= b + 1e-9; t += s) times.push(Math.round(t * 1000) / 1000); }
  const files = [];
  for (const t of times) {
    const f = join(DIR, `t${t.toFixed(3).padStart(7, "0")}.png`);
    writeFileSync(f, await frameAt(t)); files.push(f);
  }
  if (args.sheet) {
    const per = 12, cols = FORMAT === "landscape" ? 3 : 4, tw = FORMAT === "landscape" ? 640 : 400, th = Math.round((tw * VH) / VW / 2) * 2;
    for (let i = 0; i < files.length; i += per) {
      const chunk = files.slice(i, i + per), list = join(DIR, `list-${i}.txt`);
      writeFileSync(list, chunk.map(f => `file '${f}'\nduration 1`).join("\n"));
      const rows = Math.ceil(chunk.length / cols);
      const out = join(DIR, `sheet-${String(times[i]).replace(".", "_")}-${String(times[Math.min(i + per, times.length) - 1]).replace(".", "_")}.png`);
      await run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", `scale=${tw}:${th}:flags=lanczos,pad=${tw + 8}:${th + 8}:4:4:white,tile=${cols}x${rows}`, "-frames:v", "1", out]);
      rmSync(list); console.log(out);
    }
  } else console.log(files.join("\n"));
  await browser.close();
  process.exit(0);
}

const from = Number(args.from || 0), to = Math.min(Number(args.to || DUR), DUR);
const frames = Math.round((to - from) * FPS);
const vf = [];
if (BLUR > 1) vf.push(`tmix=frames=${BLUR}`, `select='eq(mod(n\\,${BLUR})\\,${BLUR - 1})'`, `setpts=N/(${FPS}*TB)`);
if (DPR !== 1) vf.push(`scale=${VW}:${VH}:flags=lanczos`);
vf.push("scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int", "format=yuv420p");
const inputs = ["-f", "image2pipe", "-framerate", String(FPS * BLUR), "-c:v", "png", "-i", "-"];
if (args.audio) inputs.push("-ss", String(from), "-i", resolve(args.audio));
const ff = spawn("ffmpeg", ["-y", "-v", "error", ...inputs,
  "-vf", vf.join(","), "-r", String(FPS),
  // tune film + aq-mode 3 keep the grain that dithers soft gradients; tune animation flattens it into bands.
  "-c:v", "libx264", "-preset", "slow", "-tune", "film", "-x264-params", "aq-mode=3", "-crf", String(CRF), "-profile:v", "high",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
  ...(args.audio ? ["-c:a", "aac", "-b:a", "256k", "-shortest"] : []),
  "-movflags", "+faststart", OUT], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((ok, fail) => ff.on("exit", c => (c === 0 ? ok() : fail(new Error("ffmpeg exited " + c)))));
const started = Date.now();
for (let f = 0; f < frames; f++) {
  for (let s = 0; s < BLUR; s++) {
    const t = from + (f + (BLUR > 1 ? (s / BLUR) * SHUTTER - SHUTTER / 2 + SHUTTER / (2 * BLUR) : 0)) / FPS;
    const png = await frameAt(Math.max(0, Math.min(DUR, t)));
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
  }
  if (f % 60 === 0 || f === frames - 1) process.stdout.write(`\rframe ${f + 1}/${frames}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(`\nwrote ${OUT}`);
