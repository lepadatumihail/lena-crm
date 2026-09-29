// Synthesizes the film's soundtrack from scratch: no samples, no libraries. Every sound is a few
// lines of maths (sines, filtered noise, FM bells, polyBLEP saws) placed on the film's cue list
// at 120 BPM, then run through a Freeverb-style reverb and a soft limiter into a 48 kHz WAV.
//
//   node output/video/soundtrack.mjs [out.wav]      default: output/video/leadwing-film.wav
//
// The cue times mirror the scene timings in leadwing-film.html; retime one, retime the other.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "leadwing-film.wav");
const SR = 48000, DUR = 30, N = SR * DUR, TAU = Math.PI * 2;
const dryL = new Float32Array(N), dryR = new Float32Array(N), sendL = new Float32Array(N), sendR = new Float32Array(N);
const duck = new Float32Array(N); // kick sidechain envelope, 0..1

let seed = 20260924;
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const midi = n => 440 * 2 ** ((n - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => clamp((t - a) / (b - a));
const ioX = p => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2);
const ioC = p => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const outC = p => 1 - (1 - p) ** 3;

/** Topology-preserving state-variable filter; returns { lp, bp, hp } per sample. */
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

/** Mix a generator into the buses. gen(t) returns a mono sample or [l, r]. */
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

/* ---------- instruments ---------- */
function kick(t0, { gain = 1, tone = 1 } = {}) {
  const i0 = Math.round(t0 * SR);
  for (let i = 0; i < SR * 0.4; i++) { const k = i0 + i; if (k >= N) break; if (k >= 0) duck[k] = Math.max(duck[k], Math.exp((-i / SR) * 8)); }
  let ph = 0;
  place(t0, 0.55, t => {
    const f = 46 + 130 * tone * Math.exp(-t * 34) + 22 * Math.exp(-t * 7);
    ph += (TAU * f) / SR;
    const amp = Math.min(1, t * 500) * Math.exp(-t * 6.2);
    const click = t < 0.005 ? noise() * (1 - t / 0.005) * 0.3 : 0;
    return Math.tanh(1.8 * Math.sin(ph) * amp) + click;
  }, { gain, send: 0.02 });
}
function clap(t0, { gain = 1, pan = 0 } = {}) {
  const bp = svf(1400, 1.1), hp = svf(600, 0.7);
  place(t0, 0.5, t => {
    let env = 0;
    for (const o of [0, 0.009, 0.019]) if (t >= o) env = Math.max(env, Math.exp(-(t - o) * (o === 0.019 ? 13 : 140)));
    return hp(bp(noise() * env).bp * 2.2).hp;
  }, { gain, pan, send: 0.4 });
}
function snare(t0, { gain = 1 } = {}) {
  const hp = svf(1800, 0.8);
  let ph = 0;
  place(t0, 0.25, t => {
    ph += (TAU * (190 + 60 * Math.exp(-t * 40))) / SR;
    return Math.sin(ph) * Math.exp(-t * 30) * 0.6 + hp(noise()).hp * Math.exp(-t * 22) * 0.8;
  }, { gain, send: 0.3 });
}
function hat(t0, { gain = 1, open = false, pan = 0.2 } = {}) {
  const hp = svf(8200, 0.9);
  place(t0, open ? 0.4 : 0.07, t => hp(noise()).hp * Math.exp(-t * (open ? 10 : 60)), { gain, pan, send: 0.1 });
}
function tom(t0, { gain = 1, f0 = 150, f1 = 85, pan = 0 } = {}) {
  let ph = 0;
  place(t0, 0.4, t => {
    ph += (TAU * (f1 + (f0 - f1) * Math.exp(-t * 18))) / SR;
    const click = t < 0.003 ? noise() * 0.4 : 0;
    return Math.tanh(1.5 * Math.sin(ph)) * Math.exp(-t * 9) * Math.min(1, t * 900) + click;
  }, { gain, pan, send: 0.25 });
}
function bass(t0, note, dur, { gain = 1, cutoff = 900 } = {}) {
  const f = midi(note), lp = svf(typeof cutoff === "number" ? cutoff : cutoff(t0), 0.9);
  let ph = 0;
  place(t0, dur + 0.1, t => {
    ph += (TAU * f) / SR;
    const env = Math.min(1, t * 300) * (t < dur ? Math.exp(-t * 2.5) : Math.exp(-dur * 2.5) * Math.exp(-(t - dur) * 50));
    const x = Math.sin(ph) + 0.45 * Math.sin(2 * ph) + 0.2 * Math.sin(3 * ph) + 0.08 * Math.sin(4 * ph);
    return lp(Math.tanh(1.3 * x)).lp * env;
  }, { gain, send: 0.04, duckAmt: 0.5 });
}
function saw(ph, dt) {
  let v = 2 * ph - 1;
  if (ph < dt) { const x = ph / dt; v -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; v -= x * x + x + x + 1; }
  return v;
}
/** Detuned saw pad through a low-pass; cutoff may be a function of absolute time. */
function pad(t0, dur, notes, { gain = 1, cutoff = 1500, attack = 0.5, release = 0.8, duckAmt = 0.45, send = 0.45 } = {}) {
  const vs = notes.flatMap(n => [-9, -3, 4, 10].map((c, j) => ({ f: midi(n) * 2 ** (c / 1200), ph: rnd(), side: j % 2 ? 1 : -1 })));
  const lpL = svf(1000, 0.75), lpR = svf(1000, 0.75), norm = 1.1 / vs.length;
  place(t0, dur + release, t => {
    if (Math.round(t * SR) % 64 === 0) { const c = typeof cutoff === "number" ? cutoff : cutoff(t0 + t); lpL.set(c, 0.75); lpR.set(c * 1.02, 0.75); }
    let l = 0, r = 0;
    for (const v of vs) { const dt = v.f / SR; v.ph += dt; if (v.ph >= 1) v.ph -= 1; const s = saw(v.ph, dt); if (v.side < 0) l += s * 0.8, r += s * 0.2; else r += s * 0.8, l += s * 0.2; }
    const env = Math.min(1, t / attack) * (t > dur ? Math.exp((-(t - dur) / release) * 4) : 1);
    return [lpL(l * norm).lp * env, lpR(r * norm).lp * env];
  }, { gain, send, duckAmt });
}
function bell(t0, note, { gain = 1, dur = 1.2, ratio = 3.5, index = 1.6, decay = 4.5, pan = 0, send = 0.4 } = {}) {
  const f = midi(note);
  let pc = 0, pm = 0;
  place(t0, dur, t => {
    pm += (TAU * f * ratio) / SR; pc += (TAU * f) / SR;
    const env = Math.min(1, t * 700) * Math.exp(-t * decay);
    return (Math.sin(pc + index * Math.exp(-t * 7) * Math.sin(pm)) * 0.8 + Math.sin(2 * pc) * 0.12 * Math.exp(-t * 9)) * env;
  }, { gain, pan, send });
}
function pop(t0, { gain = 1, f0 = 520, f1 = 980, dur = 0.08, pan = 0 } = {}) {
  let ph = 0;
  place(t0, dur + 0.08, t => {
    ph += (TAU * (f0 + (f1 - f0) * Math.min(1, t / dur))) / SR;
    return Math.sin(ph) * Math.min(1, t * 900) * Math.exp(-t * 26);
  }, { gain, pan, send: 0.22 });
}
function click(t0, { gain = 1, f = 2600, pan = 0 } = {}) {
  let ph = 0;
  place(t0, 0.03, t => { ph += (TAU * f) / SR; return (Math.sin(ph) * 0.6 + noise() * 0.4) * Math.exp(-t * 240); }, { gain, pan, send: 0.05 });
}
function knock(t0, { gain = 1, f = 210, pan = 0 } = {}) {
  let ph = 0;
  place(t0, 0.2, t => { ph += (TAU * f * (1 + 0.5 * Math.exp(-t * 60))) / SR; return Math.sin(ph) * Math.exp(-t * 26) * Math.min(1, t * 1200); }, { gain, pan, send: 0.15 });
}
/** Filtered-noise sweep. shape: "swell" builds to the end, "pass" rises and falls, "fall" decays. */
function whoosh(t0, dur, { gain = 1, f0 = 300, f1 = 6000, q = 1.3, shape = "swell", pan0 = -0.4, pan1 = 0.4, send = 0.3 } = {}) {
  const a = svf(f0, q), b = svf(f0, q);
  place(t0, dur, t => {
    const p = t / dur, f = f0 * (f1 / f0) ** p;
    a.set(f, q); b.set(f * 1.04, q);
    const env = shape === "swell" ? p ** 2.4 * (p > 0.96 ? (1 - p) / 0.04 : 1) : shape === "pass" ? Math.sin(Math.PI * p) ** 1.6 : (1 - p) ** 2.5 * Math.min(1, t * 200);
    const pan = pan0 + (pan1 - pan0) * p, n = noise();
    return [a(n).bp * env * (1 - pan * 0.8), b(n * 0.6 + noise() * 0.4).bp * env * (1 + pan * 0.8)];
  }, { gain, send });
}
function impact(t0, { gain = 1, sub = 1, crash = 0.5, low = 42 } = {}) {
  let ph = 0;
  place(t0, 1.8, t => { ph += (TAU * (low + 50 * Math.exp(-t * 9))) / SR; return Math.tanh(1.4 * Math.sin(ph)) * Math.exp(-t * 2.4) * Math.min(1, t * 400); }, { gain: gain * sub * 0.8, send: 0.1 });
  const hp = svf(3500, 0.6);
  place(t0, 2.4, t => hp(noise()).hp * Math.exp(-t * 2.0) * Math.min(1, t * 600), { gain: gain * crash * 0.45, send: 0.7 });
  kick(t0, { gain: gain * 0.85 });
}
function glitter(t0, dur, count, { gain = 1, lo = 84, hi = 100 } = {}) {
  const scale = [0, 2, 4, 7, 9];
  for (let i = 0; i < count; i++) {
    const n = lo + Math.floor(rnd() * ((hi - lo) / 12) + 0) * 12 + scale[Math.floor(rnd() * 5)];
    bell(t0 + rnd() * dur, Math.min(n, hi), { gain: gain * (0.5 + 0.5 * rnd()), decay: 9, dur: 0.5, pan: rnd() * 1.6 - 0.8, send: 0.5, index: 0.8 });
  }
}

/* ---------- harmony ---------- */
const CH = {
  Dm9: [50, 53, 57, 60, 64], Bbmaj9: [46, 50, 53, 57, 60], Fmaj7A: [45, 53, 57, 60, 64],
  Cadd9: [48, 52, 55, 62, 64], Dm7: [50, 53, 57, 60], Fmaj9: [41, 48, 52, 55, 57, 64],
};
const BASS = { Dm9: 38, Dm7: 38, Bbmaj9: 34, Fmaj7A: 33, Cadd9: 36, Fmaj9: 41 };
function groove(a, b, { kickG = 0.8, clapG = 0.5, hatG = 0.16, ghost = true, openHats = false } = {}) {
  for (let t = a; t < b - 1e-6; t += 0.5) {
    kick(t, { gain: kickG });
    const beat = Math.round(t / 0.5) % 4;
    if (clapG && (beat === 1 || beat === 3)) clap(t, { gain: clapG });
    hat(t + 0.25, { gain: hatG * (openHats ? 1.1 : 1), open: openHats, pan: 0.25 });
    if (ghost) { hat(t + 0.125, { gain: hatG * 0.4, pan: -0.2 }); hat(t + 0.375, { gain: hatG * 0.45, pan: 0.3 }); }
  }
}
function bassline(a, b, chord, { gain = 0.5, cutoff = 1100 } = {}) {
  for (let t = a; t < b - 1e-6; t += 0.5) bass(t + 0.25, BASS[chord], 0.18, { gain, cutoff });
}

/* ---------- arrangement (mirrors leadwing-film.html) ---------- */
// 01 The lead: a room, a clock, two messages, then days rolling by.
pad(0, 3.0, CH.Dm9, { gain: 0.62, cutoff: 1300, attack: 1.1, release: 0.04, duckAmt: 0 });
kick(0, { gain: 0.35, tone: 0.6 }); bass(0, 38, 2.9, { gain: 0.3, cutoff: 500 });
for (let t = 0; t < 2.9; t += 0.5) click(t, { gain: 0.17, f: Math.round(t * 2) % 2 ? 2300 : 3100, pan: Math.round(t * 2) % 2 ? 0.3 : -0.3 });
pop(0.42, { gain: 0.75, f0: 560, f1: 900, pan: -0.25 });
pop(0.98, { gain: 0.7, f0: 740, f1: 1180, pan: 0.25 }); whoosh(0.9, 0.2, { gain: 0.16, f0: 1500, f1: 5000, shape: "pass" });
click(1.48, { gain: 0.24, f: 4200, pan: 0.3 }); click(1.53, { gain: 0.2, f: 4200, pan: 0.3 });
for (const t of [1.7, 1.83, 1.96, 2.09]) knock(t, { gain: 0.14, f: 900, pan: -0.2 });
{
  const TOTAL = 14 * 1440 + 6 * 60 + 12;
  let lastDay = 0;
  for (let t = 1.42; t <= 2.8; t += 1 / SR * 16) {
    const day = Math.floor((TOTAL * ioX(P(t, 1.42, 2.78))) / 1440);
    if (day > lastDay) { click(t, { gain: 0.32, f: 1800 + day * 60, pan: -0.1 }); lastDay = day; }
  }
  const bp = svf(2200, 2);
  let prev = 0;
  place(1.42, 1.4, t => {
    const m = ioX(P(1.42 + t, 1.42, 2.78)), speed = (m - prev) * SR / 3; prev = m;
    return bp(noise()).bp * clamp(speed) * 0.9;
  }, { gain: 0.6, send: 0.1 });
  knock(2.78, { gain: 0.6, f: 160 });
}
whoosh(2.45, 0.55, { gain: 0.45, f0: 200, f1: 3000, shape: "swell" });

// 02 The quiet: cut to dark on a low boom; "quiet." falls away note by note.
impact(3.0, { gain: 0.85, crash: 0.15, low: 38 });
pad(3.0, 1.9, [38, 45, 50], { gain: 0.5, cutoff: t => 380 + 400 * P(t, 3, 3.6), attack: 0.25, release: 0.3, duckAmt: 0, send: 0.5 });
{
  const lp = svf(900, 0.8);
  place(3.05, 1.8, t => { const T = 3.05 + t, level = P(T, 3.05, 3.55) * (1 - ioC(P(T, 3.95, 4.75))); return lp(noise()).lp * level; }, { gain: 0.32, send: 0.3 });
}
impact(3.5, { gain: 0.55, sub: 0.8, crash: 0.1, low: 46 }); bell(3.5, 50, { gain: 0.25, decay: 2, dur: 2 });
[74, 72, 69, 67, 65, 62].forEach((n, i) => bell(4.02 + i * 0.085, n, { gain: 0.3 * (1 - i * 0.14), decay: 3, send: 0.7, pan: -0.5 + i * 0.2 }));
whoosh(4.5, 0.5, { gain: 0.45, f0: 250, f1: 7000, shape: "swell", pan0: -0.6, pan1: 0.6 });

// 03 The book: the build, then the drop on "Not anymore."
impact(5.0, { gain: 0.6, crash: 0.3 });
groove(5.0, 8.0, { kickG: 0.7, clapG: 0, hatG: 0.14, ghost: false });
for (let t = 6.0; t < 8.0; t += 0.25) hat(t + 0.125, { gain: 0.05, pan: -0.3 });
bassline(5.0, 8.0, "Dm9", { gain: 0.45, cutoff: t => 260 + 1400 * P(t, 5, 8) ** 1.5 });
pad(5.0, 3.0, CH.Dm9, { gain: 0.26, cutoff: t => 500 + 1900 * P(t, 5, 8) ** 1.6, attack: 0.3, release: 0.05 });
for (let i = 0; i < 14; i++) bell(5.05 + i * 0.03, [62, 64, 65, 67, 69, 72, 74, 76, 77, 79, 81, 84, 86, 88][i], { gain: 0.07, decay: 8, dur: 0.6, pan: -0.7 + i * 0.1 });
pop(6.66, { gain: 0.2, f0: 800, f1: 1200, pan: 0.1 }); pop(7.0, { gain: 0.2, f0: 850, f1: 1300, pan: 0.5 }); pop(7.36, { gain: 0.22, f0: 760, f1: 1150, pan: -0.4 });
for (let t = 7.0; t < 7.5; t += 0.125) snare(t, { gain: 0.1 + 0.15 * P(t, 7, 7.5) });
for (let t = 7.5; t < 7.97; t += 0.0625) snare(t, { gain: 0.25 + 0.3 * P(t, 7.5, 8) });
whoosh(6.4, 1.6, { gain: 0.5, f0: 300, f1: 9000, shape: "swell", pan0: -0.3, pan1: 0.3 });

impact(8.0, { gain: 1.0, crash: 0.75 });
groove(8.0, 9.5, { kickG: 0.85, clapG: 0.55, hatG: 0.17, openHats: true });
bassline(8.0, 9.5, "Bbmaj9", { gain: 0.55 });
pad(8.0, 1.9, CH.Bbmaj9, { gain: 0.3, cutoff: 2600, attack: 0.02, release: 0.4 });
{
  // One bell per grid column, at the moment the sweep line crosses it.
  const notes = [58, 62, 65, 69, 70, 74, 77, 81, 82, 86, 89, 93, 94, 93, 89, 94];
  for (let c = 0; c < 16; c++) {
    const cx = c * 74 + 31;
    let lo = 8.12, hi = 9.12;
    for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; (-60 + 1292 * ioC(P(mid, 8.12, 9.12)) < cx ? (lo = mid) : (hi = mid)); }
    bell(lo, notes[c], { gain: 0.16 * (1 - c * 0.025), decay: 6, dur: 0.8, pan: -0.8 + c * 0.106, send: 0.45 });
  }
}
whoosh(9.28, 0.7, { gain: 0.65, f0: 180, f1: 10000, q: 1.1, shape: "swell", pan0: 0, pan1: 0 });

// 04 The follow-up: out of the terracotta flash into the app.
impact(10.0, { gain: 0.95, crash: 0.55 });
groove(10.0, 12.0, { kickG: 0.8, clapG: 0.5, hatG: 0.15 });
bassline(10.0, 12.0, "Fmaj7A", { gain: 0.5 });
pad(10.0, 2.0, CH.Fmaj7A, { gain: 0.26, cutoff: 2200, attack: 0.05 });
click(11.08, { gain: 0.55, f: 2000 }); click(11.1, { gain: 0.3, f: 1200 });
whoosh(11.16, 0.45, { gain: 0.25, f0: 800, f1: 3500, shape: "pass", pan0: 0.6, pan1: -0.1 });
for (let t = 11.62; t < 12.24; t += 1 / 42) click(t, { gain: 0.035 + 0.02 * rnd(), f: 3000 + rnd() * 2400, pan: rnd() * 0.6 - 0.3 });
groove(12.0, 12.25, { kickG: 0.75, clapG: 0, hatG: 0.12, ghost: false });
bass(12.25, 36, 0.18, { gain: 0.45 });
whoosh(12.18, 0.32, { gain: 0.6, f0: 400, f1: 11000, shape: "swell" });

// 04b In their language: one bell per language, on the eighth notes.
impact(12.5, { gain: 0.75, sub: 0.6, crash: 0.45 });
groove(12.5, 14.0, { kickG: 0.8, clapG: 0.5, hatG: 0.16 });
bassline(12.5, 14.0, "Cadd9", { gain: 0.5 });
pad(12.5, 1.5, CH.Cadd9, { gain: 0.25, cutoff: 2400, attack: 0.03, release: 0.3 });
groove(14.0, 15.5, { kickG: 0.8, clapG: 0.5, hatG: 0.16 });
bassline(14.0, 15.5, "Dm7", { gain: 0.5 });
pad(14.0, 1.5, CH.Dm7, { gain: 0.25, cutoff: 2400, attack: 0.03, release: 0.3 });
glitter(12.56, 0.75, 18, { gain: 0.05 });
[[13.0, 76], [13.25, 79], [13.5, 81], [13.75, 84], [14.0, 86], [14.25, 84], [14.5, 81], [14.75, 86]].forEach(([t, n], i) => bell(t, n, { gain: 0.2, decay: 5, pan: i % 2 ? 0.35 : -0.35 }));
click(14.94, { gain: 0.5, f: 2100 });
bell(15.0, 74, { gain: 0.25, decay: 4 }); bell(15.09, 81, { gain: 0.25, decay: 3.5 });

// 05 The card: five apps fly in and land.
impact(15.5, { gain: 0.7, sub: 0.6, crash: 0.35 });
groove(15.5, 16.0, { kickG: 0.8, clapG: 0.5, hatG: 0.16 });
bassline(15.5, 16.0, "Dm7", { gain: 0.5 });
groove(16.0, 18.5, { kickG: 0.8, clapG: 0.5, hatG: 0.16, openHats: true });
bassline(16.0, 18.0, "Bbmaj9", { gain: 0.5 });
pad(16.0, 2.0, CH.Bbmaj9, { gain: 0.26, cutoff: 2300, attack: 0.05, release: 0.3 });
pad(18.0, 0.5, CH.Fmaj9, { gain: 0.24, cutoff: 2300, attack: 0.03, release: 0.1 });
bass(18.25, 41, 0.18, { gain: 0.45 });
[-0.8, 0.8, -0.7, 0.7, 0].forEach((pan, i) => pop(15.5 + i * 0.07, { gain: 0.24, f0: 480 + i * 70, f1: 820 + i * 90, pan }));
whoosh(16.52, 0.5, { gain: 0.35, f0: 600, f1: 4000, shape: "pass", pan0: -0.5, pan1: 0.5 });
for (let i = 0; i < 5; i++) knock(16.88 + i * 0.07, { gain: 0.22, f: 260 + i * 25, pan: -0.3 + i * 0.15 });
whoosh(16.78, 0.24, { gain: 0.3, f0: 2500, f1: 9000, shape: "pass", pan0: -0.7, pan1: 0.7 });
[65, 69, 72, 77].forEach((n, i) => bell(17.18 + i * 0.02, n, { gain: 0.14, decay: 3 }));

// 06 The wing: breakdown, air, a warm chord when the wing fills in.
pad(18.5, 1.5, CH.Fmaj9, { gain: 0.3, cutoff: 3000, attack: 0.1, release: 0.4, duckAmt: 0.2, send: 0.6 });
pad(20.0, 1.5, CH.Bbmaj9, { gain: 0.3, cutoff: 3000, attack: 0.2, release: 0.2, duckAmt: 0.2, send: 0.6 });
for (const t of [19.0, 20.0, 21.0]) kick(t, { gain: 0.45 });
bass(18.5, 41, 1.3, { gain: 0.4, cutoff: 600 }); bass(20.0, 34, 1.4, { gain: 0.4, cutoff: 600 });
whoosh(18.6, 1.2, { gain: 0.28, f0: 500, f1: 3200, q: 0.9, shape: "pass", pan0: -0.6, pan1: 0.6, send: 0.5 });
[65, 69, 72, 76, 81].forEach((n, i) => bell(19.45 + i * 0.05, n, { gain: 0.13, decay: 2.5, dur: 2, pan: -0.4 + i * 0.2 }));
bell(19.2, 81, { gain: 0.12, decay: 4 }); bell(20.0, 84, { gain: 0.14, decay: 4 });
whoosh(20.9, 0.6, { gain: 0.3, f0: 300, f1: 5000, shape: "swell" });

// 07 The promise: one hit per word.
pad(21.5, 1.92, CH.Dm9, { gain: 0.26, cutoff: t => 900 + 2500 * P(t, 21.5, 23.4), attack: 0.1, release: 0.03, duckAmt: 0.3 });
bass(21.5, 38, 1.9, { gain: 0.38, cutoff: 700 });
[21.5, 21.625, 21.75, 21.875, 22.0].forEach((t, i) => tom(t, { gain: 0.5, f0: 170 - i * 8, f1: 90, pan: -0.3 + i * 0.15 }));
clap(22.0, { gain: 0.35 });
[22.25, 22.375, 22.5, 22.625].forEach((t, i) => tom(t, { gain: 0.55, f0: 190 + i * 12, f1: 100, pan: 0.3 - i * 0.2 }));
clap(22.625, { gain: 0.4 }); bell(22.625, 81, { gain: 0.15, decay: 3 });
whoosh(22.7, 0.72, { gain: 0.6, f0: 250, f1: 10000, shape: "swell" });
for (let t = 23.0; t < 23.38; t += 0.0625) snare(t, { gain: 0.15 + 0.35 * P(t, 23, 23.4) });

// 08 LeadWing: the logo lands, then the offer.
impact(23.5, { gain: 1.1, crash: 0.85, low: 40 });
pad(23.5, 2.5, CH.Fmaj9, { gain: 0.36, cutoff: 3200, attack: 0.02, release: 0.4, send: 0.55 });
[53, 57, 60, 64, 67, 72].forEach((n, i) => bell(23.5 + i * 0.03, n + 12, { gain: 0.1, decay: 2, dur: 2.2 }));
whoosh(23.46, 0.35, { gain: 0.25, f0: 700, f1: 4000, shape: "pass", pan0: 0.7, pan1: 0 });
whoosh(23.58, 0.35, { gain: 0.22, f0: 600, f1: 3500, shape: "pass", pan0: -0.7, pan1: 0 });
glitter(23.84, 0.5, 10, { gain: 0.05, lo: 88, hi: 103 });
groove(24.0, 26.0, { kickG: 0.7, clapG: 0.35, hatG: 0.13 });
bassline(24.0, 26.0, "Fmaj9", { gain: 0.45 });
whoosh(25.85, 0.5, { gain: 0.22, f0: 900, f1: 5000, shape: "pass" });
groove(26.0, 29.0, { kickG: 0.62, clapG: 0.3, hatG: 0.12 });
bassline(26.0, 28.0, "Bbmaj9", { gain: 0.42 }); bassline(28.0, 29.0, "Fmaj9", { gain: 0.42 });
pad(26.0, 2.0, CH.Bbmaj9, { gain: 0.24, cutoff: 2600, attack: 0.1, release: 0.2 });
{
  let last = 0;
  for (let t = 26.55; t <= 27.12; t += 0.001) { const v = Math.round(10 * outC(P(t, 26.55, 27.1))); if (v > last) { click(t, { gain: 0.1, f: 1500 + v * 120 }); last = v; } }
}
pop(27.35, { gain: 0.35, f0: 520, f1: 1040, dur: 0.1 }); bell(27.4, 77, { gain: 0.15, decay: 4 });
[84, 88, 91, 96, 100].forEach((n, i) => bell(28.05 + i * 0.1, n, { gain: 0.07, decay: 7, pan: -0.6 + i * 0.3 }));
click(28.9, { gain: 0.5, f: 2100 });
pad(28.0, 2.0, CH.Fmaj9, { gain: 0.3, cutoff: 2800, attack: 0.1, release: 1.2, send: 0.6 });
[53, 57, 60, 64, 69, 72].forEach((n, i) => bell(29.0 + i * 0.06, n + 12, { gain: 0.12, decay: 1.6, dur: 1 }));
impact(29.0, { gain: 0.45, sub: 0.5, crash: 0.25 });

/* ---------- reverb, master, WAV ---------- */
function freeverb(inL, inR, { room = 0.84, damp = 0.3 } = {}) {
  const s = SR / 44100, spread = 23, pre = Math.round(0.018 * SR);
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
const wetGain = (0.32 * (rms(dryL) + rms(dryR))) / (rms(wL) + rms(wR) || 1);
const mL = new Float32Array(N), mR = new Float32Array(N);
let hpL = 0, hpR = 0, xL = 0, xR = 0;
const aHP = Math.exp((-TAU * 28) / SR);
for (let n = 0; n < N; n++) {
  let l = dryL[n] + wL[n] * wetGain, r = dryR[n] + wR[n] * wetGain;
  hpL = aHP * (hpL + l - xL); xL = l; hpR = aHP * (hpR + r - xR); xR = r; // DC / sub-rumble high-pass
  mL[n] = hpL; mR[n] = hpR;
}
let peak = 0;
for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(mL[n]), Math.abs(mR[n]));
const drive = 1.2 / (peak || 1); // the loudest peak lands at tanh(1.2): gentle saturation, no hard clipping
const buf = Buffer.alloc(44 + N * 4);
let outPeak = 0;
const fade = n => Math.min(1, n / (0.01 * SR)) * Math.min(1, (N - n) / (0.9 * SR));
const shaped = [mL, mR].map(ch => ch.map((v, n) => Math.tanh(v * drive) * fade(n)));
for (let n = 0; n < N; n++) outPeak = Math.max(outPeak, Math.abs(shaped[0][n]), Math.abs(shaped[1][n]));
const norm = 0.891 / outPeak; // -1 dBFS
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  buf.writeInt16LE(Math.round(clamp(shaped[0][n] * norm, -1, 1) * 32767), 44 + n * 4);
  buf.writeInt16LE(Math.round(clamp(shaped[1][n] * norm, -1, 1) * 32767), 46 + n * 4);
}
writeFileSync(OUT, buf);
console.log(`wrote ${OUT}  (${DUR}s, ${SR} Hz, drive ${drive.toFixed(2)})`);
