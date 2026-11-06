// Flat 2D bean-head baker drawn on a 600x1000 design canvas (soles at y=975). Canvas is 1200x2000.
const INK = '#351f22', SKIN = '#f7d8c2', SHIRT = '#fbf6ec', APRON = '#e0b073', RED = '#c8453b';
const ell = (g, x, y, rx, ry, fill, lw = 8, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } };
const rr = (g, x, y, w, h, r, fill, lw = 8) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } };
const limb = (g, x0, y0, x1, y1, w, fill, lw = 7) => {
  g.lineCap = 'round';
  g.strokeStyle = INK; g.lineWidth = w + lw * 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = fill; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
};
const dir = (a, s) => [s * Math.sin(a), Math.cos(a)];

function eye(g, ex, ey, sc, open, lidFrac, lx, ly) {
  const rx = 30 * sc, ry = 34 * sc * Math.max(open, 0.06);
  g.save(); g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#fff'; g.fillRect(ex - rx, ey - ry, rx * 2, ry * 2);
  if (open > 0.15) {
    g.fillStyle = INK; g.beginPath(); g.ellipse(ex + lx * 11, ey + ly * 8 + 2, 12, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + lx * 11 + 4, ey + ly * 8 - 3, 4, 0, Math.PI * 2); g.fill();
  }
  const top = ey - ry, lidY = top + ry * 2 * lidFrac;
  g.fillStyle = SKIN; g.fillRect(ex - rx - 2, top - 2, rx * 2 + 4, lidY - top + 2);
  g.restore();
  g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  if (lidFrac > 0.02) {
    const k = Math.max(0, 1 - ((lidY - ey) / ry) ** 2), w = rx * Math.sqrt(k);
    g.lineWidth = 6; g.beginPath(); g.moveTo(ex - w, lidY); g.lineTo(ex + w, lidY); g.stroke();
  }
}

export function makeCanvas() { const c = document.createElement('canvas'); c.width = 1200; c.height = 2000; return c; }

export function drawBaker(c, p) {
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1200, 2000); g.scale(2, 2);
  g.lineJoin = 'round'; g.lineCap = 'round';

  // legs + shoes (fixed)
  limb(g, 268, 820, 266, 948, 18, '#5b6a8a'); limb(g, 332, 820, 334, 948, 18, '#5b6a8a');
  ell(g, 254, 962, 34, 16, '#3a2a2a', 7); ell(g, 346, 962, 34, 16, '#3a2a2a', 7);

  g.save(); g.translate(0, p.bob);
  // torso + apron
  ell(g, 300, 650, 118, 170, SHIRT, 8);
  rr(g, 222, 590, 156, 215, 40, APRON, 7);
  rr(g, 262, 700, 76, 56, 10, '#c88c52', 6);
  g.fillStyle = 'rgba(255,255,255,.55)'; [[250, 640, 10], [335, 770, 8], [290, 790, 6], [345, 625, 7]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  // neckerchief
  g.beginPath(); g.moveTo(246, 484); g.lineTo(354, 484); g.lineTo(300, 548); g.closePath(); g.fillStyle = RED; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();

  // head group (tilts about the neck)
  g.save(); g.translate(300, 470); g.rotate(p.tilt); g.translate(-300, -470);
  ell(g, 150, 312, 22, 32, SKIN, 7); ell(g, 450, 312, 22, 32, SKIN, 7);
  ell(g, 300, 300, 150, 165, SKIN, 9);
  // toque
  ell(g, 235, 98, 52, 50, '#fff', 8); ell(g, 300, 72, 64, 62, '#fff', 8); ell(g, 365, 98, 52, 50, '#fff', 8);
  rr(g, 190, 150, 220, 52, 14, '#fff', 8);
  // cheeks, nose
  ell(g, 212, 352, 24, 15, 'rgba(243,150,140,.7)', 0); ell(g, 388, 352, 24, 15, 'rgba(243,150,140,.7)', 0);
  ell(g, 300, 338, 16, 12, '#f1bfa6', 5);
  // eyes + brows
  const lid = Math.max(0.04, 0.38 - 0.34 * p.brow), sc = 1 + 0.12 * p.brow, open = 1 - p.blink;
  eye(g, 248, 298, sc, open, lid, p.lookX, p.lookY); eye(g, 352, 298, sc, open, lid, p.lookX, p.lookY);
  const by = 246 - p.brow * 24, tl = 4 + 8 * p.brow; g.lineWidth = 10; g.strokeStyle = INK;
  g.beginPath(); g.moveTo(218, by + tl); g.lineTo(278, by - tl); g.stroke();
  g.beginPath(); g.moveTo(322, by - tl); g.lineTo(382, by + tl); g.stroke();
  // mouth
  if (p.mouth < 0.06) {
    g.lineWidth = 7; g.beginPath(); g.moveTo(268, 388); g.quadraticCurveTo(300, 410, 332, 388); g.stroke();
  } else {
    const rx = p.round ? 16 + p.mouth * 8 : 28 + p.mouth * 12, ry = 4 + p.mouth * 30, cy = 392 + ry * 0.35;
    g.save(); g.beginPath(); g.ellipse(300, cy, rx, ry, 0, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#5a1f2b'; g.fillRect(300 - rx, cy - ry, rx * 2, ry * 2);
    if (!p.round && p.mouth > 0.2) { g.fillStyle = '#fff'; g.fillRect(300 - rx, cy - ry, rx * 2, 11); }
    if (ry > 14) { g.fillStyle = '#e8837f'; g.beginPath(); g.ellipse(300, cy + ry * 0.7, rx * 0.65, ry * 0.45, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    g.beginPath(); g.ellipse(300, cy, rx, ry, 0, 0, Math.PI * 2); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
  }
  g.restore(); // head

  // arms (in front)
  const arm = (sx, sgn, a) => {
    const d1 = dir(a * 0.8, sgn), mx = sx + d1[0] * 100, my = 565 + d1[1] * 100;
    const d2 = dir(a - 0.25, sgn), hx = mx + d2[0] * 95, hy = my + d2[1] * 95;
    limb(g, sx, 565, mx, my, 28, SHIRT); limb(g, mx, my, hx, hy, 19, SKIN); ell(g, hx, hy, 22, 22, SKIN, 7);
  };
  arm(205, -1, p.armL); arm(395, 1, p.armR);
  g.restore();
}
