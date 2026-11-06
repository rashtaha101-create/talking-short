// Pure functions of the frame number. No DOM, no three.js.
export const FPS = 30, N = 300; // 10 s
export const BAKER = { x: -0.35, z: 2.2 };

// Script (for the later voiceover). a/b = start/end frame of each phrase.
export const PHRASES = [
  { a: 9,   b: 78,  text: "Forty years I've baked bread in this town." },
  { a: 90,  b: 147, text: "Never once has a loaf complained." },
  { a: 158, b: 195, text: "Until this morning." },
  { a: 206, b: 290, text: "It stood up, tipped its crust, and left without paying." },
];

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const lerp = (a, b, t) => a + (b - a) * t;
const lerpV = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// keys: [[frame, v1, v2, ...], ...] -> smooth interpolation, returns array of values
function track(keys, f) {
  if (f <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, ...v0] = keys[i], [f1, ...v1] = keys[i + 1];
    if (f <= f1) return lerpV(v0, v1, smooth((f - f0) / (f1 - f0)));
  }
  return keys[keys.length - 1].slice(1);
}

// ---------- talking: syllable timeline -> mouth ----------
const OVERRIDE = { paying: { n: 2, vowels: ['a', 'i'] } };
function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (OVERRIDE[w]) return OVERRIDE[w];
  const groups = w.match(/[aeiouy]+/g) || ['a'];
  let n = groups.length;
  if (n > 1 && /e$/.test(w) && !/le$/.test(w)) n--;
  if (n > 1 && /ed$/.test(w) && !/[td]ed$/.test(w)) n--;
  return { n, vowels: groups.slice(0, n) };
}
const OPEN = { a: 1, e: 0.7, i: 0.55, o: 0.85, u: 0.6, y: 0.6 };
const SYL = [];
for (const ph of PHRASES) {
  const items = ph.text.split(/\s+/).map((w) => ({ w, ...syllables(w) }));
  const gaps = items.map((it, i) => (i === items.length - 1 ? 0 : 0.35 + (/,$/.test(it.w) ? 0.6 : 0)));
  const total = items.reduce((s, it) => s + it.n, 0) + gaps.reduce((s, g) => s + g, 0);
  const unit = (ph.b - ph.a) / total;
  let t = ph.a;
  items.forEach((it, wi) => {
    for (let k = 0; k < it.n; k++) {
      const v = it.vowels[k] || 'a';
      SYL.push({ s: t, e: t + unit * 0.9, v: v[0], round: /o|u/.test(v), first: k === 0 });
      t += unit;
    }
    t += unit * gaps[wi];
  });
}
export function mouthAt(f) {
  for (const y of SYL) {
    if (f >= y.s && f < y.e) {
      const u = (f - y.s) / (y.e - y.s);
      return { open: Math.pow(Math.sin(Math.PI * u), 0.8) * (OPEN[y.v] ?? 0.8), round: y.round };
    }
  }
  return { open: 0, round: false };
}
function stressAt(f) {
  let m = 0;
  for (const y of SYL) if (y.first) m = Math.max(m, Math.exp(-(((f - (y.s + 1)) / 3.5) ** 2)));
  return m;
}
const BLINKS = [34, 121, 176, 262];
function blinkAt(f) {
  for (const b of BLINKS) if (f >= b && f < b + 6) return 1 - Math.abs(f - (b + 3)) / 3;
  return 0;
}

// ---------- baker ----------
export function bakerAt(f) {
  const m = mouthAt(f);
  let open = m.open, round = m.round;
  const shock = smooth((f - 291) / 4); // silent gasp after the last word
  if (shock > 0) { open = Math.max(open, 0.55 * shock); round = true; }
  const [brow] = track([[0, 0.1], [85, 0.15], [100, 0.35], [148, 0.3], [158, 0.9], [198, 0.85], [212, 0.5], [285, 0.55], [292, 1.0], [299, 1.0]], f);
  const [armL, armR] = track([
    [0, 0.08, 0.08], [60, 0.1, 0.1], [92, 0.1, 0.2], [105, 0.1, 1.1], [125, 0.1, 0.9], [140, 0.1, 1.2],
    [152, 0.1, 0.15], [162, 1.2, 1.2], [190, 1.1, 1.0], [205, 0.15, 0.4], [222, 0.15, 1.55], [285, 0.15, 1.5], [299, 0.4, 0.4],
  ], f);
  const [lookX] = track([[0, -0.05], [205, -0.05], [222, 0.8], [250, 0.6], [262, 0.85], [299, 1]], f);
  const st = stressAt(f);
  return {
    bob: 3 * Math.sin(f * 0.12) + 5 * st,
    tilt: 0.03 * Math.sin(f * 0.07) + 0.025 * st,
    mouth: open, round, blink: blinkAt(f), brow, lookX, lookY: 0,
    armL: armL + 0.04 * Math.sin(f * 0.1), armR: armR + 0.04 * Math.sin(f * 0.13 + 1),
  };
}

// ---------- door + loaf ----------
export const doorAt = (f) => -1.75 * smooth((f - 196) / 20);

export function loafAt(f) {
  const t = (f - 206) / 18;
  const legK = f < 206 ? 0.1 : 0.1 + 0.9 * (1 - Math.pow(1 - clamp(t), 3) + 0.06 * Math.sin(Math.PI * clamp(t)));
  const out = smooth((f - 222) / 20);
  const z = lerp(-0.5, 1.25, out);
  const s = Math.max(0, f - 260);
  const x = 0.9 + 0.03 * (s < 6 ? (s * s) / 12 : s - 3);
  const heading = (Math.PI / 2) * smooth((f - 250) / 10);
  const pitch = 0.5 * Math.sin(Math.PI * smooth((f - 238) / 14));
  const dist = (z + 0.5) + (x - 0.9);
  const moving = (f > 222 && f < 242) || f > 259;
  const stride = dist * 14;
  return {
    x, z, heading, pitch, legK,
    hop: moving ? 0.03 * Math.abs(Math.sin(stride)) : 0,
    swing: moving ? 0.5 * Math.sin(stride) : 0,
  };
}

// ---------- camera ----------
const KEYS = [
  [0,   [-0.30, 1.45, 4.9], [-0.35, 1.40, 2.2]],
  [88,  [-0.30, 1.50, 4.5], [-0.35, 1.42, 2.2]],
  [150, [0.15, 1.85, 8.7],  [0.20, 1.2, 1.2]],
  [200, [0.20, 1.80, 8.5],  [0.25, 1.2, 1.2]],
  [299, [0.25, 1.55, 7.6],  [0.40, 1.05, 1.0]],
];
export function camAt(f) {
  let pos = KEYS[KEYS.length - 1][1], look = KEYS[KEYS.length - 1][2];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [f0, p0, l0] = KEYS[i], [f1, p1, l1] = KEYS[i + 1];
    if (f <= f1) { const u = smooth((f - f0) / (f1 - f0)); pos = lerpV(p0, p1, u); look = lerpV(l0, l1, u); break; }
  }
  pos = [pos[0] + 0.02 * Math.sin(f * 0.04), pos[1] + 0.012 * Math.sin(f * 0.05 + 1), pos[2]];
  const bump = smooth((f - 150) / 8) * (1 - smooth((f - 198) / 10));
  return { pos, look, roll: 0.012 * Math.sin(f * 0.03) + 0.05 * bump };
}
