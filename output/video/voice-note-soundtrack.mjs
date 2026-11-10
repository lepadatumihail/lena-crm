// Synthesizes the soundtrack of film 03, "Voice note": no samples, no libraries. The same
// instruments as film 02 (felt piano, plucked strings, warm pads, a soft kit, FM bells), placed
// at 96 BPM on this film's cues, then a Freeverb-style reverb and a soft limiter into a 48 kHz
// WAV. The + goes down on a chime, every spoken word gets a soft tick in the film's own rhythm,
// each phrase that lands in a card rings a step higher (D E F# A B D), Save resolves, and the
// three results ring once each before the end card lands home on D.
//
//   node output/video/voice-note-soundtrack.mjs [out.wav] [--lang es]
//   default: output/video/voice-note.wav (voice-note-es.wav with --lang es)
//
// The cue times mirror T in voice-note.html, and the word ticks re-run its word rhythm: retime
// one, retime the other. The Spanish note has its own words, so it gets its own WAV.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const LANG = argv.includes("--lang") ? argv[argv.indexOf("--lang") + 1] : "en";
const outArg = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--lang");
const OUT = outArg || join(dirname(fileURLToPath(import.meta.url)), LANG === "es" ? "voice-note-es.wav" : "voice-note.wav");
const SR = 48000, DUR = 30, N = SR * DUR, TAU = Math.PI * 2;
const dryL = new Float32Array(N), dryR = new Float32Array(N), sendL = new Float32Array(N), sendR = new Float32Array(N);
const duck = new Float32Array(N);

let seed = 20261110;
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const midi = n => 440 * 2 ** ((n - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => clamp((t - a) / (b - a));

function svf(fc, q = 0.707) {
  let ic1 = 0, ic2 = 0, g = 0, k = 1 / q;
  const set = (f, qq = q) => { g = Math.tan((Math.PI * Math.min(f, SR * 0.45)) / SR); k = 1 / qq; };
  set(fc);
  const run = x => {
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    return { lp: v2, bp: v1, hp: x - k * v1 - v2 };
  };
  run.set = set;
  return run;
}
function place(t0, dur, gen, { gain = 1, pan = 0, send = 0.15, duckAmt = 0 } = {}) {
  const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2, gr = Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  for (let i = 0; i < n; i++) {
    const k = i0 + i;
    if (k < 0) continue;
    if (k >= N) break;
    const v = gen(i / SR);
    let l, r;
    if (typeof v === "number") { l = v * gl; r = v * gr; } else { l = v[0]; r = v[1]; }
    const d = duckAmt ? 1 - duckAmt * duck[k] : 1;
    l *= gain * d; r *= gain * d;
    dryL[k] += l; dryR[k] += r; sendL[k] += l * send; sendR[k] += r * send;
  }
}

/* ---------- instruments (as in film 02) ---------- */
function kick(t0, { gain = 1, tone = 1 } = {}) {
  const i0 = Math.round(t0 * SR);
  for (let i = 0; i < SR * 0.4; i++) { const k = i0 + i; if (k >= N) break; if (k >= 0) duck[k] = Math.max(duck[k], Math.exp((-i / SR) * 8)); }
  let ph = 0;
  place(t0, 0.5, t => {
    const f = 44 + 110 * tone * Math.exp(-t * 30) + 18 * Math.exp(-t * 7);
    ph += (TAU * f) / SR;
    return Math.tanh(1.5 * Math.sin(ph) * Math.min(1, t * 500) * Math.exp(-t * 7));
  }, { gain, send: 0.02 });
}
function snap(t0, { gain = 1, pan = 0 } = {}) {
  const bp = svf(2300, 1.5), hp = svf(900, 0.7);
  place(t0, 0.3, t => {
    let env = 0;
    for (const o of [0, 0.006]) if (t >= o) env = Math.max(env, Math.exp(-(t - o) * (o ? 30 : 160)));
    return hp(bp(noise() * env).bp * 2.4).hp;
  }, { gain, pan, send: 0.5 });
}
function snare(t0, { gain = 1 } = {}) {
  const hp = svf(1800, 0.8);
  let ph = 0;
  place(t0, 0.22, t => {
    ph += (TAU * (200 + 60 * Math.exp(-t * 40))) / SR;
    return Math.sin(ph) * Math.exp(-t * 30) * 0.5 + hp(noise()).hp * Math.exp(-t * 24) * 0.8;
  }, { gain, send: 0.3 });
}
function shaker(t0, { gain = 1, pan = 0.3 } = {}) {
  const bp = svf(7200, 1.1);
  place(t0, 0.1, t => bp(noise()).bp * Math.min(1, t * 260) * Math.exp(-t * 42), { gain, pan, send: 0.12 });
}
function hat(t0, { gain = 1, open = false, pan = 0.2 } = {}) {
  const hp = svf(8200, 0.9);
  place(t0, open ? 0.4 : 0.07, t => hp(noise()).hp * Math.exp(-t * (open ? 9 : 60)), { gain, pan, send: 0.15 });
}
function sub(t0, note, dur, { gain = 1 } = {}) {
  const f = midi(note);
  let ph = 0;
  place(t0, dur + 0.08, t => {
    ph += (TAU * f) / SR;
    return Math.sin(ph) * Math.min(1, t * 40) * (t < dur ? 1 : Math.exp(-(t - dur) * 40));
  }, { gain, send: 0, duckAmt: 0.55 });
}
function piano(t0, note, { gain = 1, dur = 3, pan = 0, send = 0.4, bright = 1 } = {}) {
  const f = midi(note), B = 0.0003;
  const parts = [[1, 1, 1.6], [2, 0.45, 2.6], [3, 0.2, 3.8], [4, 0.11, 5.2], [5, 0.05, 6.5], [6, 0.03, 8]];
  const ph = parts.map(() => rnd() * TAU), lp = svf(Math.min(8500, f * 5 * bright), 0.6), k = 0.55 + note / 140;
  place(t0, dur, t => {
    let v = 0;
    for (let i = 0; i < parts.length; i++) {
      const [h, a, d] = parts[i];
      v += a * Math.sin(TAU * f * h * Math.sqrt(1 + B * h * h) * t + ph[i]) * Math.exp(-t * d * k);
    }
    const hammer = t < 0.015 ? noise() * (1 - t / 0.015) * 0.06 : 0;
    const rel = t > dur - 0.3 ? (dur - t) / 0.3 : 1;
    return lp(v * Math.min(1, t * 160) * rel + hammer).lp;
  }, { gain, pan, send });
}
function pluck(t0, note, { gain = 1, dur = 1.1, pan = 0, send = 0.3, decay = 0.996 } = {}) {
  const f = midi(note), len = Math.max(2, Math.round(SR / f)), buf = new Float32Array(len), pre = svf(f * 6, 0.7);
  for (let i = 0; i < len; i++) buf[i] = pre(noise()).lp * 2;
  let i = 0;
  const lp = svf(Math.min(7000, f * 7), 0.7);
  place(t0, dur, t => {
    const y = buf[i], nx = buf[(i + 1) % len];
    buf[i] = (y + nx) * 0.5 * decay; i = (i + 1) % len;
    return lp(y).lp * Math.min(1, t * 500) * (t > dur - 0.12 ? (dur - t) / 0.12 : 1);
  }, { gain, pan, send });
}
function saw(ph, dt) {
  let v = 2 * ph - 1;
  if (ph < dt) { const x = ph / dt; v -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; v -= x * x + x + x + 1; }
  return v;
}
function pad(t0, dur, notes, { gain = 1, cutoff = 1500, attack = 0.6, release = 0.8, duckAmt = 0.3, send = 0.5 } = {}) {
  const vs = notes.flatMap(n => [-8, -3, 3, 8].map((c, j) => ({ f: midi(n) * 2 ** (c / 1200), ph: rnd(), side: j % 2 ? 1 : -1 })));
  const lpL = svf(1000, 0.7), lpR = svf(1000, 0.7), norm = 1.1 / vs.length;
  place(t0, dur + release, t => {
    if (Math.round(t * SR) % 64 === 0) { const c = typeof cutoff === "number" ? cutoff : cutoff(t0 + t); lpL.set(c, 0.7); lpR.set(c * 1.02, 0.7); }
    let l = 0, r = 0;
    for (const v of vs) { const dt = v.f / SR; v.ph += dt; if (v.ph >= 1) v.ph -= 1; const s = saw(v.ph, dt); if (v.side < 0) { l += s * 0.8; r += s * 0.2; } else { r += s * 0.8; l += s * 0.2; } }
    const env = Math.min(1, t / attack) * (t > dur ? Math.exp((-(t - dur) / release) * 4) : 1);
    return [lpL(l * norm).lp * env, lpR(r * norm).lp * env];
  }, { gain, send, duckAmt });
}
function bell(t0, note, { gain = 1, dur = 1.6, ratio = 3.5, index = 1.4, decay = 3.6, pan = 0, send = 0.45 } = {}) {
  const f = midi(note);
  let pc = 0, pm = 0;
  place(t0, dur, t => {
    pm += (TAU * f * ratio) / SR; pc += (TAU * f) / SR;
    const env = Math.min(1, t * 700) * Math.exp(-t * decay);
    return (Math.sin(pc + index * Math.exp(-t * 7) * Math.sin(pm)) * 0.8 + Math.sin(2 * pc) * 0.1 * Math.exp(-t * 9)) * env;
  }, { gain, pan, send });
}
function pop(t0, { gain = 1, f0 = 520, f1 = 980, dur = 0.08, pan = 0 } = {}) {
  let ph = 0;
  place(t0, dur + 0.08, t => {
    ph += (TAU * (f0 + (f1 - f0) * Math.min(1, t / dur))) / SR;
    return Math.sin(ph) * Math.min(1, t * 900) * Math.exp(-t * 26);
  }, { gain, pan, send: 0.25 });
}
function click(t0, { gain = 1, f = 2600, pan = 0 } = {}) {
  let ph = 0;
  place(t0, 0.03, t => { ph += (TAU * f) / SR; return (Math.sin(ph) * 0.6 + noise() * 0.4) * Math.exp(-t * 240); }, { gain, pan, send: 0.06 });
}
function knock(t0, { gain = 1, f = 200, pan = 0 } = {}) {
  let ph = 0;
  place(t0, 0.25, t => { ph += (TAU * f * (1 + 0.5 * Math.exp(-t * 60))) / SR; return Math.sin(ph) * Math.exp(-t * 22) * Math.min(1, t * 1200); }, { gain, pan, send: 0.2 });
}
/** A syllable: a short formant-ish blip, so the word ticks feel spoken rather than typed. */
function syll(t0, { gain = 1, f = 300, len = 0.09, pan = 0 } = {}) {
  const bp = svf(f * 3.2, 2.2);
  let ph = 0;
  place(t0, len + 0.06, t => {
    ph += (TAU * f * (1 + 0.06 * Math.exp(-t * 30))) / SR;
    const env = Math.min(1, t * 400) * (t < len ? 1 : Math.exp(-(t - len) * 60)) * Math.exp(-t * 6);
    return bp(saw(ph / TAU % 1, f / SR) * 0.7 + noise() * 0.15).bp * env * 2.2;
  }, { gain, pan, send: 0.18 });
}
function whoosh(t0, dur, { gain = 1, f0 = 300, f1 = 6000, q = 1.2, shape = "pass", pan0 = -0.4, pan1 = 0.4, send = 0.35 } = {}) {
  const a = svf(f0, q), b = svf(f0, q);
  place(t0, dur, t => {
    const p = t / dur, f = f0 * (f1 / f0) ** p;
    a.set(f, q); b.set(f * 1.04, q);
    const env = shape === "swell" ? p ** 2.4 * (p > 0.96 ? (1 - p) / 0.04 : 1) : shape === "pass" ? Math.sin(Math.PI * p) ** 1.6 : (1 - p) ** 2.5 * Math.min(1, t * 200);
    const pan = pan0 + (pan1 - pan0) * p, n = noise();
    return [a(n).bp * env * (1 - pan * 0.8), b(n * 0.6 + noise() * 0.4).bp * env * (1 + pan * 0.8)];
  }, { gain, send });
}
function impact(t0, { gain = 1, sub: subG = 1, crash = 0.4, low = 40 } = {}) {
  let ph = 0;
  place(t0, 1.8, t => { ph += (TAU * (low + 45 * Math.exp(-t * 9))) / SR; return Math.tanh(1.3 * Math.sin(ph)) * Math.exp(-t * 2.6) * Math.min(1, t * 400); }, { gain: gain * subG * 0.75, send: 0.1 });
  const hp = svf(4200, 0.6);
  place(t0, 2.4, t => hp(noise()).hp * Math.exp(-t * 2.2) * Math.min(1, t * 600), { gain: gain * crash * 0.4, send: 0.7 });
  kick(t0, { gain: gain * 0.7 });
}
function glitter(t0, dur, count, { gain = 1, lo = 86, hi = 100 } = {}) {
  const scale = [0, 2, 4, 7, 9];
  for (let i = 0; i < count; i++) {
    const oct = lo + 12 * Math.floor(rnd() * ((hi - lo) / 12 + 1)), n = Math.min(hi, oct + scale[Math.floor(rnd() * 5)]);
    bell(t0 + rnd() * dur, n, { gain: gain * (0.5 + 0.5 * rnd()), decay: 9, dur: 0.5, pan: rnd() * 1.6 - 0.8, send: 0.55, index: 0.7 });
  }
}
function riser(t0, dur, { gain = 1 } = {}) {
  whoosh(t0, dur, { gain, f0: 250, f1: 9000, shape: "swell", pan0: -0.3, pan1: 0.3 });
  let ph = 0;
  place(t0, dur, t => { const p = t / dur; ph += (TAU * (180 + 1200 * p * p)) / SR; return Math.sin(ph) * p ** 2.6 * 0.22; }, { gain, send: 0.5 });
}

/* ---------- the film's cues (voice-note.html, T) ---------- */
const T = {
  press: 0.625, rec: 0.72, w0: 1.3, w1: 9.5, rel: 10.0, sort: 10.625, recOut: 11.05, revIn: 11.3,
  F: [11.875, 12.5, 13.125, 13.75, 14.375, 15.0], FLY: 0.62,
  tap: 16.875, saved: 17.25, boardIn: 18.05, lars: 18.75, cal: 20.0, anna: 21.25, out: 24.3, end: 24.95,
};
// The words, in the same rhythm as the film's (its rng, its seed, its pauses).
const SAID = {
  en: ["Lars Nielsen loved the villa in Nueva Andalucía.", "Second viewing Thursday at 11.", "Budget’s now up to 1.4 million,", "move him to Viewing.", "And a new buyer, Anna Berg:", "two-bed in Marbella, up to 600k."],
  es: ["Lars Nielsen, encantado con la villa de Nueva Andalucía.", "Segunda visita el jueves a las 11.", "Presupuesto hasta 1,4 millones,", "pásalo a Visita.", "Compradora nueva, Anna Berg:", "dos dormitorios en Marbella, hasta 600 mil."],
}[LANG === "es" ? "es" : "en"];
const WORDS = [];
{
  let s = 26;
  const r = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let acc = 0;
  for (const text of SAID.flatMap(p => p.split(" "))) {
    const w = { text, at: acc }, d = 0.16 + 0.035 * text.length + 0.05 * r();
    w.dur = d; WORDS.push(w);
    acc += d + (/[.:]$/.test(text) ? 0.32 : /,$/.test(text) ? 0.14 : 0.02);
  }
  const k = (T.w1 - T.w0) / acc;
  for (const w of WORDS) { w.at = T.w0 + w.at * k; w.dur *= k; }
}

/* ---------- harmony, 96 BPM ---------- */
const BEAT = 0.625, BAR = 2.5;
const CH = {
  Dmaj9: [50, 57, 61, 64, 66], Bm9: [47, 54, 57, 61, 62], Gmaj9: [43, 50, 54, 57, 59],
  A69: [45, 52, 54, 59, 61], Dbig: [50, 57, 62, 64, 66, 69, 73],
};
const ROOT = { Dmaj9: 38, Bm9: 35, Gmaj9: 31, A69: 33, Dbig: 38 };
const ARP = {
  Dmaj9: [62, 66, 69, 73, 76, 73, 69, 66], Bm9: [59, 62, 66, 69, 73, 69, 66, 62], Gmaj9: [55, 59, 62, 66, 69, 66, 62, 59],
  A69: [57, 61, 64, 66, 71, 66, 64, 61], Dbig: [62, 66, 69, 74, 78, 74, 69, 66],
};
// One chord a bar: the note is said over D–Bm–G–A, sorted over Bm–G, saved on A, and the
// results and the end card sit on D.
const BARS = ["Dmaj9", "Bm9", "Gmaj9", "A69", "Bm9", "Gmaj9", "A69", "Dmaj9", "Bm9", "Gmaj9", "Dbig", "Dmaj9"];

/* ---------- arrangement ---------- */
BARS.forEach((c, i) => {
  const t0 = i * BAR, open = [700, 1100, 1300, 1500, 900, 1500, 1700, 2000, 2100, 2300, 3200, 2400][i];
  pad(t0, BAR, CH[c].slice(1), {
    gain: i === 0 ? 0.32 : i === 4 ? 0.3 : i === 10 ? 0.34 : 0.23,
    cutoff: i === 9 ? t => 1800 + 2200 * P(t, 23.4, 24.95) ** 2 : open,
    attack: i === 0 ? 1.2 : 0.25, release: i === 11 ? 1.4 : 0.3, send: 0.55,
  });
});
// Bass, plucked bass and arpeggios: out for the cold open and the sorting bar, back for the split.
BARS.forEach((c, i) => {
  if (i === 0) return;
  const t0 = i * BAR, bassEnd = i === 9 ? 24.3 : i === 11 ? 29.4 : t0 + BAR;
  if (i !== 4) sub(t0, ROOT[c], Math.min(BAR, bassEnd - t0) - 0.05, { gain: i === 10 ? 0.3 : 0.22 });
  for (let b = 0; b < 4; b += 2) { const t = t0 + b * BEAT; if (i >= 2 && i !== 4 && t < bassEnd) pluck(t, ROOT[c] + 12, { gain: 0.15, dur: 1.1, decay: 0.997 }); }
  if (i === 4) return; // "Listening… Sorting…": just the pad, the glitter and the riser
  const notes = ARP[c], g = i === 11 ? 0.09 : 0.075 + 0.012 * Math.min(i, 8);
  for (let k = 0; k < 8; k++) {
    const t = t0 + k * BAR / 8;
    if (i === 9 && t >= 24.3) break;
    if (i === 11 && t >= 29.4) break;
    pluck(t, notes[k] + (k % 4 === 3 ? 12 : 0), { gain: g * (k % 2 ? 0.8 : 1), pan: k % 2 ? 0.35 : -0.35, dur: 0.9 });
  }
});
// The kit: a soft heartbeat while the agent talks, out while it sorts, fuller for the split and the results.
for (let t = 2.5; t < 24.3; t += BEAT) {
  const bar = Math.floor(t / BAR), beat = Math.round((t % BAR) / BEAT);
  if (bar === 4) continue;
  kick(t, { gain: bar < 4 ? 0.36 : bar >= 7 ? 0.5 : 0.46, tone: 0.8 });
  if (bar >= 2 && (beat === 1 || beat === 3)) snap(t, { gain: bar >= 7 ? 0.3 : 0.24, pan: beat === 1 ? -0.15 : 0.15 });
  for (let s = 0; s < 4; s++) shaker(t + s * BEAT / 4, { gain: (s === 2 ? 0.065 : 0.038) * (bar >= 5 ? 1.2 : 1), pan: s % 2 ? 0.35 : 0.2 });
  if (bar >= 5 && beat === 3) hat(t + BEAT / 2, { gain: 0.065, open: true, pan: 0.3 });
}
for (let t = 27.5; t < 29.4; t += BEAT) { kick(t, { gain: 0.3, tone: 0.8 }); for (let s = 0; s < 4; s++) shaker(t + s * BEAT / 4, { gain: s === 2 ? 0.045 : 0.028 }); }

// 0–1.3 The + goes down and it starts recording: a knock, then a two-note "listening" chime.
piano(0.05, 62, { gain: 0.14, dur: 2.4 }); piano(0.05, 69, { gain: 0.1, dur: 2.4 });
knock(T.press, { gain: 0.3, f: 190 }); click(T.press, { gain: 0.25, f: 1600 });
bell(T.rec, 81, { gain: 0.2, decay: 3.4, pan: -0.1 }); bell(T.rec + 0.12, 86, { gain: 0.22, decay: 3, pan: 0.1 });
whoosh(0.0, 0.9, { gain: 0.14, f0: 200, f1: 2200, shape: "swell", pan0: 0.4, pan1: -0.2 });
// 1.3–9.5 The note: a soft syllable on every word, in the film's rhythm.
for (const w of WORDS) {
  const n = Math.max(1, Math.round(w.text.replace(/[^\p{L}\d]/gu, "").length / 3.2));
  for (let s = 0; s < n; s++) {
    syll(w.at + (s * w.dur * 0.82) / n, { gain: 0.05 + 0.025 * rnd(), f: 170 + 70 * rnd() + (s === 0 ? 25 : 0), len: Math.min(0.11, (w.dur * 0.7) / n), pan: rnd() * 0.3 - 0.15 });
  }
}
// 10.0 It lets go: the chime falls, then "Listening…" and "Sorting it into your clients…" glitter and rise.
bell(T.rel, 86, { gain: 0.18, decay: 3.4, pan: 0.1 }); bell(T.rel + 0.12, 81, { gain: 0.16, decay: 3, pan: -0.1 });
pop(T.rel + 0.02, { gain: 0.16, f0: 900, f1: 520 });
whoosh(T.rel + 0.05, 0.6, { gain: 0.14, f0: 2400, f1: 500, shape: "pass", pan0: 0.3, pan1: -0.3 });
glitter(T.rel + 0.3, 1.1, 14, { gain: 0.035 });
riser(T.sort - 0.2, 0.95, { gain: 0.24 });
whoosh(T.recOut, 0.5, { gain: 0.14, f0: 1600, f1: 300, shape: "pass", pan0: 0.4, pan1: 0 });
whoosh(T.revIn - 0.05, 0.6, { gain: 0.16, f0: 400, f1: 2600, shape: "pass" });
// 11.9–15.6 The split: each phrase lifts off with a whoosh and lands on a step up the scale.
const STEPS = [74, 76, 78, 81, 83, 86];
const panOf = i => (i % 2 ? [-0.5, 0.4] : [-0.4, 0.5]);
T.F.forEach((f, i) => {
  whoosh(f, T.FLY, { gain: 0.11, f0: 700, f1: 3800, shape: "pass", pan0: panOf(i)[0], pan1: panOf(i)[1] });
  const land = f + T.FLY;
  pluck(land, STEPS[i] - 12, { gain: 0.16, dur: 1.0, pan: 0.25 });
  bell(land, STEPS[i], { gain: i < 4 ? 0.16 : 0.18, decay: 4.2, pan: 0.3 });
  click(land + 0.02, { gain: 0.18, f: 2200, pan: 0.3 });
});
// 16.9 Save: a click, "Saving…", then Saved resolves on D.
click(T.tap, { gain: 0.45, f: 2000 }); click(T.tap + 0.02, { gain: 0.25, f: 1200 });
whoosh(T.tap + 0.05, 0.35, { gain: 0.1, f0: 1200, f1: 4200, shape: "swell", pan0: 0, pan1: 0 });
[74, 78, 81, 86].forEach((n, i) => bell(T.saved + i * 0.04, n, { gain: 0.15 - i * 0.015, decay: 2.6, dur: 2.2, pan: -0.3 + i * 0.2 }));
[62, 66, 69].forEach((n, i) => piano(T.saved + i * 0.02, n, { gain: 0.15, dur: 2.2 }));
// 18.0–24.3 The results: the board and the week arrive; each landing rings once.
whoosh(T.boardIn - 0.05, 0.6, { gain: 0.16, f0: 400, f1: 2800, shape: "pass" });
whoosh(T.lars - 0.18, 0.4, { gain: 0.12, f0: 900, f1: 3800, shape: "pass", pan0: -0.2, pan1: 0.6 });
impact(T.lars, { gain: 0.32, sub: 0.55, crash: 0.16 });
bell(T.lars, 86, { gain: 0.24, decay: 3 }); bell(T.lars, 74, { gain: 0.12, decay: 2.5 });
whoosh(T.cal - 0.25, 0.25, { gain: 0.12, f0: 3000, f1: 600, shape: "pass" }); knock(T.cal + 0.02, { gain: 0.3, f: 170 });
bell(T.cal + 0.02, 88, { gain: 0.22, decay: 3 }); bell(T.cal + 0.02, 76, { gain: 0.1, decay: 2.5 });
pop(T.anna, { gain: 0.18, f0: 600, f1: 1000, pan: -0.3 });
bell(T.anna, 90, { gain: 0.24, decay: 3, pan: -0.2 }); bell(T.anna, 78, { gain: 0.12, decay: 2.5, pan: -0.2 });
glitter(T.anna + 0.05, 0.8, 10, { gain: 0.035, lo: 86, hi: 98 });
// 23.4–24.95 Into white.
riser(23.45, 1.5, { gain: 0.32 });
for (let t = 23.75; t < 24.3; t += BEAT / 4) snare(t, { gain: 0.06 + 0.16 * P(t, 23.75, 24.25) });
whoosh(24.3, 0.65, { gain: 0.26, f0: 200, f1: 12000, shape: "swell", pan0: 0, pan1: 0 });
// 24.95 The end card lands home on D: impact, bells, piano; the URL pops; one last high D.
impact(T.end, { gain: 0.6, sub: 0.6, crash: 0.45, low: 42 });
[74, 81, 86, 90, 93].forEach((n, i) => bell(T.end + i * 0.05, n, { gain: 0.13, decay: 2.4, dur: 2.4, pan: -0.5 + i * 0.25 }));
[50, 57, 62, 66, 69, 74].forEach((n, i) => piano(T.end + 0.02 + i * 0.03, n, { gain: 0.17, dur: 3.4 }));
glitter(T.end + 0.05, 0.8, 12, { gain: 0.04, lo: 86, hi: 103 });
sub(T.end, 38, 1.2, { gain: 0.26 });
pop(T.end + 1.4, { gain: 0.2, f0: 520, f1: 1040, dur: 0.1 }); bell(T.end + 1.42, 90, { gain: 0.12, decay: 4 });
piano(27.5, 66, { gain: 0.12, dur: 2.3 }); piano(27.5, 74, { gain: 0.14, dur: 2.3 });
piano(28.75, 81, { gain: 0.16, dur: 1.25 }); piano(28.75, 86, { gain: 0.1, dur: 1.25 });

/* ---------- reverb, master, WAV ---------- */
function freeverb(inL, inR, { room = 0.86, damp = 0.28 } = {}) {
  const s = SR / 44100, spread = 23, pre = Math.round(0.02 * SR);
  const mk = len => ({ buf: new Float32Array(Math.round(len * s)), i: 0, store: 0 });
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  const cL = combs.map(mk), cR = combs.map(l => mk(l + spread)), aL = aps.map(mk), aR = aps.map(l => mk(l + spread));
  const oL = new Float32Array(N), oR = new Float32Array(N);
  const comb = (c, x) => { const y = c.buf[c.i]; c.store = y * (1 - damp) + c.store * damp; c.buf[c.i] = x + c.store * room; if (++c.i >= c.buf.length) c.i = 0; return y; };
  const ap = (a, x) => { const b = a.buf[a.i]; a.buf[a.i] = x + b * 0.5; if (++a.i >= a.buf.length) a.i = 0; return b - x; };
  for (let n = 0; n < N; n++) {
    const x = n >= pre ? (inL[n - pre] + inR[n - pre]) * 0.015 : 0;
    let l = 0, r = 0;
    for (const c of cL) l += comb(c, x);
    for (const c of cR) r += comb(c, x);
    for (const a of aL) l = ap(a, l);
    for (const a of aR) r = ap(a, r);
    oL[n] = l; oR[n] = r;
  }
  return [oL, oR];
}
const [wL, wR] = freeverb(sendL, sendR);
const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
const wetGain = (0.34 * (rms(dryL) + rms(dryR))) / (rms(wL) + rms(wR) || 1);
const mL = new Float32Array(N), mR = new Float32Array(N);
let hpL = 0, hpR = 0, xL = 0, xR = 0;
const aHP = Math.exp((-TAU * 28) / SR);
for (let n = 0; n < N; n++) {
  const l = dryL[n] + wL[n] * wetGain, r = dryR[n] + wR[n] * wetGain;
  hpL = aHP * (hpL + l - xL); xL = l; hpR = aHP * (hpR + r - xR); xR = r;
  mL[n] = hpL; mR[n] = hpR;
}
let peak = 0;
for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(mL[n]), Math.abs(mR[n]));
const drive = 1.0 / (peak || 1);
const fade = n => Math.min(1, n / (0.01 * SR)) * Math.min(1, (N - n) / (0.9 * SR));
const shaped = [mL, mR].map(ch => ch.map((v, n) => Math.tanh(v * drive) * fade(n)));
let outPeak = 0;
for (let n = 0; n < N; n++) outPeak = Math.max(outPeak, Math.abs(shaped[0][n]), Math.abs(shaped[1][n]));
const norm = 0.891 / outPeak; // -1 dBFS
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  buf.writeInt16LE(Math.round(clamp(shaped[0][n] * norm, -1, 1) * 32767), 44 + n * 4);
  buf.writeInt16LE(Math.round(clamp(shaped[1][n] * norm, -1, 1) * 32767), 46 + n * 4);
}
writeFileSync(OUT, buf);
console.log(`wrote ${OUT}  (${DUR}s, ${SR} Hz, ${WORDS.length} words, drive ${drive.toFixed(2)})`);
