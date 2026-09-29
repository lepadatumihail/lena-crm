// Synthesizes the soundtrack of film 02, "From hello to Reserved": no samples, no libraries.
// A felt piano, plucked strings, warm pads, a soft kit and bells, all a few lines of maths,
// placed at 96 BPM on the film's cues, then a Freeverb-style reverb and a soft limiter into a
// 48 kHz WAV. Every stage change rings a bell one step higher than the last (D, E, F#, A),
// and Reserved resolves home on D major.
//
//   node output/video/hello-to-reserved-soundtrack.mjs [out.wav]   default: output/video/hello-to-reserved.wav
//
// The cue times mirror the timeline in hello-to-reserved.html; retime one, retime the other.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "hello-to-reserved.wav");
const SR = 48000, DUR = 30, N = SR * DUR, TAU = Math.PI * 2;
const dryL = new Float32Array(N), dryR = new Float32Array(N), sendL = new Float32Array(N), sendR = new Float32Array(N);
const duck = new Float32Array(N); // kick sidechain envelope, 0..1

let seed = 20260926;
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const midi = n => 440 * 2 ** ((n - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => clamp((t - a) / (b - a));

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
/** A pure sine sub, ducked under the kick. */
function sub(t0, note, dur, { gain = 1 } = {}) {
  const f = midi(note);
  let ph = 0;
  place(t0, dur + 0.08, t => {
    ph += (TAU * f) / SR;
    return Math.sin(ph) * Math.min(1, t * 40) * (t < dur ? 1 : Math.exp(-(t - dur) * 40));
  }, { gain, send: 0, duckAmt: 0.55 });
}
/** Felt piano: a few inharmonic partials with their own decays, a soft hammer. */
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
/** Karplus-Strong pluck, softened. */
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
/** Detuned saw pad through a low-pass; cutoff may be a function of absolute time. */
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
/** Filtered-noise sweep. shape: "swell" builds to the end, "pass" rises and falls, "fall" decays. */
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
  const scale = [0, 2, 4, 7, 9]; // D major pentatonic from D
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

/* ---------- harmony, 96 BPM ---------- */
const BEAT = 0.625, BAR = 2.5;
const CH = {
  Dmaj9: [50, 57, 61, 64, 66], Bm9: [47, 54, 57, 61, 62], Gmaj9: [43, 50, 54, 57, 59],
  DF: [42, 50, 57, 61, 64], A69: [45, 52, 54, 59, 61], Dbig: [50, 57, 62, 64, 66, 69, 73],
};
const ROOT = { Dmaj9: 38, Bm9: 35, Gmaj9: 31, DF: 30, A69: 33, Dbig: 38 };
const ARP = {
  Dmaj9: [62, 66, 69, 73, 76, 73, 69, 66], Bm9: [59, 62, 66, 69, 73, 69, 66, 62], Gmaj9: [55, 59, 62, 66, 69, 66, 62, 59],
  DF: [54, 57, 62, 66, 69, 66, 62, 57], A69: [57, 61, 64, 66, 71, 66, 64, 61], Dbig: [62, 66, 69, 74, 78, 74, 69, 66],
};
// One chord a bar. The film's stages land on these bars: New in bar 3, Viewing on bar 8's downbeat, Reserved on bar 10's.
const BARS = ["Dmaj9", "Bm9", "Gmaj9", "DF", "A69", "Bm9", "Gmaj9", "A69", "Bm9", "Dbig", "Gmaj9", "Dmaj9"];

/* ---------- arrangement (mirrors hello-to-reserved.html) ---------- */
// Pads under everything, voiced above the bass: closed in the cold open, opening as Lars moves through the stages.
BARS.forEach((c, i) => {
  const t0 = i * BAR, open = [800, 1200, 1400, 1600, 1700, 1800, 1900, 2100, 2100, 3400, 2500, 2700][i];
  pad(t0, BAR, CH[c].slice(1), { gain: i === 0 ? 0.34 : i === 9 ? 0.34 : 0.24, cutoff: i === 8 ? t => 1500 + 1800 * P(t, 20, 22.5) ** 2 : open, attack: i === 0 ? 1.4 : 0.25, release: i === 11 ? 1.2 : 0.3, send: 0.55 });
});
// A true sub, a plucked bass on beats one and three, and plucked arpeggios: from the first stage to the title, then again for the end card.
BARS.forEach((c, i) => {
  if (i === 0 || i === 10) return;
  const t0 = i * BAR, bassEnd = i === 9 ? 23.74 : i === 11 ? 29.4 : t0 + BAR;
  sub(t0, ROOT[c], Math.min(BAR, bassEnd - t0) - 0.05, { gain: i === 9 ? 0.3 : 0.22 });
  for (let b = 0; b < 4; b += 2) { const t = t0 + b * BEAT; if (i >= 2 && t < bassEnd) pluck(t, ROOT[c] + 12, { gain: 0.16, dur: 1.1, decay: 0.997 }); }
  const notes = ARP[c], g = i === 11 ? 0.1 : 0.09 + 0.014 * Math.min(i, 8);
  for (let k = 0; k < 8; k++) {
    const t = t0 + k * BAR / 8;
    if (i === 9 && t >= 23.75) break; // the breakdown under the title
    if (i === 11 && t >= 29.4) break;
    pluck(t, notes[k] + (k % 4 === 3 ? 12 : 0), { gain: g * (k % 2 ? 0.8 : 1), pan: k % 2 ? 0.35 : -0.35, dur: 0.9 });
  }
});
// The kit: a heartbeat from New, snaps from bar 3, shaker sixteenths; out for the title.
for (let t = 2.5; t < 23.74; t += BEAT) {
  const bar = Math.floor(t / BAR), beat = Math.round((t % BAR) / BEAT);
  kick(t, { gain: bar < 3 ? 0.42 : bar === 9 ? 0.62 : 0.5, tone: 0.8 });
  if (bar >= 2 && (beat === 1 || beat === 3)) snap(t, { gain: bar >= 9 ? 0.34 : 0.26, pan: beat === 1 ? -0.15 : 0.15 });
  for (let s = 0; s < 4; s++) shaker(t + s * BEAT / 4, { gain: (s === 2 ? 0.07 : 0.04) * (bar >= 4 ? 1.2 : 1), pan: s % 2 ? 0.35 : 0.2 });
  if (bar >= 4 && bar !== 9 && beat === 3) hat(t + BEAT / 2, { gain: 0.07, open: true, pan: 0.3 });
}
for (let t = 27.5; t < 29.4; t += BEAT) { kick(t, { gain: 0.34, tone: 0.8 }); for (let s = 0; s < 4; s++) shaker(t + s * BEAT / 4, { gain: s === 2 ? 0.05 : 0.03 }); }

// 0–2.5 The enquiry: a message chime, the hook in piano, then the rig swings in.
bell(0.12, 81, { gain: 0.2, decay: 3.2, pan: -0.1 }); bell(0.2, 86, { gain: 0.22, decay: 2.8, pan: 0.1 });
pop(0.14, { gain: 0.2, f0: 600, f1: 950 });
[[0.625, 69], [0.9375, 74], [1.25, 78], [1.5625, 76], [1.875, 74]].forEach(([t, n], i) => piano(t, n, { gain: 0.3 - i * 0.02, dur: 2.4, pan: -0.2 + i * 0.1 }));
piano(0.625, 50, { gain: 0.2, dur: 2.3 }); piano(0.625, 57, { gain: 0.14, dur: 2.3 });
whoosh(1.95, 0.75, { gain: 0.32, f0: 250, f1: 5000, shape: "swell", pan0: -0.5, pan1: 0.5 });
whoosh(2.2, 0.8, { gain: 0.2, f0: 800, f1: 3000, shape: "pass", pan0: 0.6, pan1: 0 });
// 2.5–7.5 New: paste, AI extracts, save; the first stage lands on 5.625.
kick(2.5, { gain: 0.55 });
click(3.7, { gain: 0.45, f: 2000 }); click(3.72, { gain: 0.25, f: 1200 });
whoosh(3.72, 0.8, { gain: 0.12, f0: 2000, f1: 7000, shape: "pass", pan0: -0.6, pan1: 0.6 });
glitter(3.85, 0.9, 16, { gain: 0.045 });
for (let i = 0; i < 6; i++) bell(3.9 + i * 0.13, [74, 76, 78, 81, 83, 86][i], { gain: 0.07, decay: 6, dur: 0.7, pan: -0.5 + i * 0.2 });
pop(4.72, { gain: 0.12, f0: 700, f1: 1100 });
click(5.3, { gain: 0.45, f: 2000 }); click(5.32, { gain: 0.25, f: 1200 });
whoosh(5.25, 0.5, { gain: 0.14, f0: 500, f1: 2500, shape: "pass" });
bell(5.625, 86, { gain: 0.3, decay: 3 }); bell(5.625, 74, { gain: 0.14, decay: 2.5 }); pop(5.6, { gain: 0.18, f0: 500, f1: 900 });
whoosh(5.72, 0.55, { gain: 0.14, f0: 1200, f1: 300, shape: "pass", pan0: 0.2, pan1: -0.2 });
// 7.5–12.5 Contacted: the reply types itself in Danish, one tap, the stage turns on 11.25.
whoosh(7.6, 0.55, { gain: 0.16, f0: 400, f1: 2600, shape: "pass" });
{
  // Same rhythm as the film's caret (its rng, its seed): one tick per letter.
  const MSG = "Hej Lars! Tak for din besked. Jeg finder de bedste villaer til jer i Nueva Andalucía. Hvornår passer det at ringe?";
  let s = 7;
  const r = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const times = []; let acc = 0;
  for (const ch of MSG) { acc += (ch === " " ? 1.35 : 1) * (0.65 + 0.7 * r()) + (".!?".includes(ch) ? 3 : 0); times.push(acc); }
  [...MSG].forEach((ch, i) => { if (ch !== " ") click(8.25 + (times[i] / acc) * 1.6, { gain: 0.035 + 0.02 * rnd(), f: 2600 + rnd() * 2200, pan: rnd() * 0.6 - 0.3 }); });
}
click(10.55, { gain: 0.45, f: 2000 }); click(10.57, { gain: 0.25, f: 1200 });
whoosh(10.6, 0.45, { gain: 0.16, f0: 900, f1: 5000, shape: "pass", pan0: -0.1, pan1: 0.7 });
bell(11.25, 88, { gain: 0.28, decay: 3 }); bell(11.25, 76, { gain: 0.12, decay: 2.5 });
// 12.5–16.25 Qualified: criteria, two matching listings, a tick each; the stage turns on 14.375.
whoosh(12.66, 0.55, { gain: 0.16, f0: 400, f1: 2600, shape: "pass" });
for (let i = 0; i < 4; i++) pop(12.9 + i * 0.07, { gain: 0.12, f0: 620 + i * 90, f1: 900 + i * 120, pan: -0.3 + i * 0.2 });
whoosh(13.36, 0.4, { gain: 0.12, f0: 700, f1: 3500, shape: "pass", pan0: 0.6, pan1: 0 });
whoosh(13.51, 0.4, { gain: 0.1, f0: 700, f1: 3500, shape: "pass", pan0: 0.6, pan1: 0 });
bell(13.82, 81, { gain: 0.13, decay: 5 }); bell(13.97, 85, { gain: 0.13, decay: 5 });
bell(14.375, 90, { gain: 0.28, decay: 3 }); bell(14.375, 78, { gain: 0.12, decay: 2.5 });
// 16.25–20 Viewing: the week, Lars's viewing drops into Saturday, the stage turns on 17.5, one tap to confirm.
whoosh(16.4, 0.55, { gain: 0.16, f0: 400, f1: 2600, shape: "pass" });
whoosh(16.95, 0.25, { gain: 0.14, f0: 3000, f1: 600, shape: "pass" }); knock(17.12, { gain: 0.32, f: 170 });
impact(17.5, { gain: 0.35, sub: 0.6, crash: 0.2 });
bell(17.5, 93, { gain: 0.3, decay: 3 }); bell(17.5, 81, { gain: 0.14, decay: 2.5 });
pop(17.9, { gain: 0.12, f0: 500, f1: 800 });
click(18.88, { gain: 0.45, f: 2000 }); click(18.9, { gain: 0.25, f: 1200 });
bell(18.96, 86, { gain: 0.12, decay: 4 }); bell(19.04, 90, { gain: 0.12, decay: 4 });
// 20–22.5 Reserved: the follow-up is done, an offer comes back, everything builds to the downbeat.
whoosh(20.14, 0.55, { gain: 0.16, f0: 400, f1: 2600, shape: "pass" });
click(21.3, { gain: 0.5, f: 1800 }); bell(21.34, 81, { gain: 0.12, decay: 5 });
whoosh(21.4, 0.3, { gain: 0.1, f0: 3000, f1: 8000, shape: "pass", pan0: -0.4, pan1: 0.4 });
pop(21.97, { gain: 0.16, f0: 600, f1: 1000, pan: 0.4 }); bell(22.02, 88, { gain: 0.14, decay: 4, pan: 0.4 });
riser(21.1, 1.4, { gain: 0.34 });
for (let t = 21.875; t < 22.49; t += BEAT / 4) snare(t, { gain: 0.08 + 0.22 * P(t, 21.875, 22.45) });
sub(21.25, 49, 0.6, { gain: 0.25 }); sub(21.875, 50, 0.6, { gain: 0.3 });
impact(22.5, { gain: 0.95, crash: 0.6, low: 38 });
[86, 90, 93, 98].forEach((n, i) => bell(22.5 + i * 0.035, n, { gain: 0.2 - i * 0.02, decay: 2.2, dur: 2.4, pan: -0.45 + i * 0.3 }));
[62, 66, 69, 74].forEach((n, i) => piano(22.5 + i * 0.02, n, { gain: 0.18, dur: 2.2 }));
glitter(22.55, 0.9, 18, { gain: 0.05, lo: 86, hi: 103 });
// 23.75 The title: the kit drops out, the pill flies, a note per word, a warm landing.
whoosh(23.72, 0.7, { gain: 0.3, f0: 500, f1: 4500, shape: "pass", pan0: 0.5, pan1: -0.1 });
[[23.9, 74], [24.0, 78], [24.1, 81]].forEach(([t, n], i) => piano(t, n, { gain: 0.26, dur: 2.6, pan: -0.25 + i * 0.25 }));
impact(24.375, { gain: 0.45, sub: 0.8, crash: 0.12, low: 42 }); bell(24.4, 86, { gain: 0.2, decay: 2.2, dur: 2.2 });
sub(24.375, 38, 1.5, { gain: 0.3 });
piano(25.0, 55, { gain: 0.16, dur: 2 }); piano(25.0, 62, { gain: 0.14, dur: 2 }); piano(25.0, 71, { gain: 0.16, dur: 2 });
// 25.9–26.5 The pill opens into white: a swell, then light.
riser(25.55, 0.95, { gain: 0.34 });
whoosh(25.9, 0.6, { gain: 0.3, f0: 200, f1: 12000, shape: "swell", pan0: 0, pan1: 0 });
impact(26.5, { gain: 0.5, sub: 0.5, crash: 0.5, low: 44 });
[74, 81, 86, 90, 93].forEach((n, i) => bell(26.5 + i * 0.05, n, { gain: 0.13, decay: 2.4, dur: 2.4, pan: -0.5 + i * 0.25 }));
[62, 66, 69, 74].forEach((n, i) => piano(26.55 + i * 0.03, n, { gain: 0.2, dur: 3.2 }));
glitter(26.55, 0.8, 12, { gain: 0.04, lo: 86, hi: 103 });
sub(26.5, 38, 1.0, { gain: 0.25 });
// 27.5–30 The offer and leadwing.app: home on D, a last note, and out.
pop(27.5, { gain: 0.22, f0: 520, f1: 1040, dur: 0.1 }); bell(27.52, 90, { gain: 0.13, decay: 4 });
[50, 57, 62, 66, 69].forEach((n, i) => piano(27.5 + i * 0.025, n, { gain: 0.16, dur: 2.5 }));
piano(28.75, 74, { gain: 0.2, dur: 1.25 }); piano(28.75, 81, { gain: 0.14, dur: 1.25 });

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
  hpL = aHP * (hpL + l - xL); xL = l; hpR = aHP * (hpR + r - xR); xR = r; // DC / sub-rumble high-pass
  mL[n] = hpL; mR[n] = hpR;
}
let peak = 0;
for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(mL[n]), Math.abs(mR[n]));
const drive = 1.0 / (peak || 1); // the loudest peak lands at tanh(1.0): gentle saturation, no hard clipping
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
console.log(`wrote ${OUT}  (${DUR}s, ${SR} Hz, drive ${drive.toFixed(2)})`);
