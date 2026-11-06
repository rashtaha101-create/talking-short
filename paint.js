import * as THREE from 'three';
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mk(w, h, fn, repeat = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const jit = (r, base, amt) => { const k = (r() - 0.5) * amt; return base.map((v) => Math.max(0, Math.min(255, Math.round(v + k)))); };
const rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`;

export const cobble = () => mk(512, 512, (g, w, h) => {
  const r = rng(11); g.fillStyle = '#4a423f'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) { let x = -((y / 64) % 2) * 40;
    while (x < w) { const sw = 70 + r() * 40; g.fillStyle = rgb(jit(r, [150, 140, 130], 40)); g.beginPath(); g.roundRect(x + 3, y + 3, sw - 6, 58, 14); g.fill(); x += sw; } }
});
export const brick = () => mk(512, 512, (g, w, h) => {
  const r = rng(5); g.fillStyle = '#e9dcc6'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) { let x = -((y / 32) % 2) * 32;
    for (; x < w; x += 64) { g.fillStyle = rgb(jit(r, [196, 106, 74], 36)); g.fillRect(x + 3, y + 3, 58, 26); } }
});
export const plaster = () => mk(512, 512, (g, w, h) => {
  const r = rng(3); g.fillStyle = '#f1dfbd'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${150 + r() * 40},${120 + r() * 30},80,${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 40, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(120,80,50,.35)'; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 6, 2 + r() * 3, 0, 0, 7); g.fill(); }
});
export const wood = () => mk(512, 512, (g, w, h) => {
  const r = rng(9);
  for (let x = 0; x < w; x += 64) { g.fillStyle = rgb(jit(r, [181, 121, 63], 30)); g.fillRect(x, 0, 64, h);
    g.strokeStyle = 'rgba(80,45,20,.35)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const gx = x + 8 + r() * 48; g.beginPath(); g.moveTo(gx, 0); g.bezierCurveTo(gx + 6, h * 0.3, gx - 6, h * 0.7, gx, h); g.stroke(); }
    g.fillStyle = '#4a2c18'; g.fillRect(x, 0, 4, h); }
});
export const roofTile = () => mk(512, 512, (g, w, h) => {
  const r = rng(21); g.fillStyle = '#6b2e22'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 40) for (let x = -((y / 40) % 2) * 32; x < w; x += 64) { g.fillStyle = rgb(jit(r, [184, 85, 58], 34)); g.beginPath(); g.roundRect(x + 2, y + 2, 60, 44, [4, 4, 26, 26]); g.fill(); }
});
export const grass = () => mk(256, 256, (g, w, h) => {
  const r = rng(2); g.fillStyle = '#7fb85a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) { g.fillStyle = rgb(jit(r, [96, 160, 70], 40)); g.fillRect(r() * w, r() * h, 3, 7); }
});
export const sign = (text) => mk(1024, 300, (g, w, h) => {
  g.fillStyle = '#8a5a2f'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(60,30,10,.3)'; g.lineWidth = 3; for (let y = 30; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 4); g.stroke(); }
  g.strokeStyle = '#f6e7c1'; g.lineWidth = 14; g.strokeRect(22, 22, w - 44, h - 44);
  g.font = 'bold 170px Georgia, "DejaVu Serif", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 16; g.strokeStyle = '#351f22'; g.lineJoin = 'round'; g.strokeText(text, w / 2, h / 2 + 8);
  g.fillStyle = '#ffd86b'; g.fillText(text, w / 2, h / 2 + 8);
}, false);
export const glass = () => mk(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd3ee'); gr.addColorStop(1, '#e8c98f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(30, h); g.lineTo(90, 0); g.lineTo(130, 0); g.lineTo(70, h); g.fill();
}, false);
export const loafTex = () => mk(256, 256, (g, w, h) => {
  const r = rng(8); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e9a74a'); gr.addColorStop(1, '#b8691f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,236,190,${0.15 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 3, 3); }
  g.strokeStyle = '#f7e1a6'; g.lineWidth = 9; g.lineCap = 'round';
  for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { const x = 20 + k * 64, y = 60 + j * 55; g.beginPath(); g.moveTo(x, y + 18); g.lineTo(x + 24, y - 8); g.stroke(); }
}, false);
export const skyTex = () => mk(16, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5aa9e6'); gr.addColorStop(0.55, '#cfe8f3'); gr.addColorStop(0.62, '#e9f2ee'); gr.addColorStop(1, '#e9f2ee'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, false);
export const vignette = () => mk(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.75); gr.addColorStop(0, 'rgba(40,20,30,0)'); gr.addColorStop(1, 'rgba(40,20,30,0.42)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, false);
export const blob = () => mk(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(30,15,20,.55)'); gr.addColorStop(1, 'rgba(30,15,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, false);
