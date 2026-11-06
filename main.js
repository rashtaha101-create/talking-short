import * as THREE from 'three';
import * as S from './story.js';
import * as P from './paint.js';
import { makeCanvas, drawBaker } from './baker.js';

const W = 1080, H = 1920;
const scale = parseFloat(new URLSearchParams(location.search).get('scale') || '1');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(Math.round(W * scale), Math.round(H * scale), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe9f2ee, 22, 70);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
scene.add(camera);

// ---------- look: toon + ink ----------
const INK = 0x351f22, T = 0.011;
const grad = new THREE.DataTexture(new Uint8Array([80, 160, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

function add(parent, geo, mat, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  const sc = o.scale || [1, 1, 1]; m.scale.set(...sc);
  if (o.rot) m.rotation.set(...o.rot);
  m.castShadow = o.cast !== false; m.receiveShadow = true;
  parent.add(m);
  if (o.ink !== false) {
    geo.computeBoundingBox();
    const b = geo.boundingBox, sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const k = (s, s2) => { const w = s * s2; return w > 1e-4 ? (w + 2 * T) / w : 1; };
    const kx = k(sz.x, sc[0]), ky = k(sz.y, sc[1]), kz = k(sz.z, sc[2]);
    const h = new THREE.Mesh(geo, inkMat);
    h.scale.set(kx, ky, kz); h.position.set(c.x * (1 - kx), c.y * (1 - ky), c.z * (1 - kz));
    m.add(h);
  }
  return m;
}
// box with constant texel density
function tbox(w, h, d, tile = 1.6) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  return g;
}
function tplane(w, h, tile) {
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile);
  return g;
}

// ---------- lights + sky ----------
const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
sun.position.set(-5, 9, 9); sun.target.position.set(0.5, 0, 1);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target, new THREE.HemisphereLight(0xbfe3ff, 0x8a7a6a, 1.3));
const sky = new THREE.Mesh(new THREE.SphereGeometry(95, 24, 16), new THREE.MeshBasicMaterial({ map: P.skyTex(), side: THREE.BackSide, fog: false }));
scene.add(sky);
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
[[-14, 11, -30], [8, 13, -34], [24, 9, -26], [-30, 8, -22]].forEach(([x, y, z]) => {
  const c = new THREE.Group(); c.position.set(x, y, z);
  [[0, 0, 0, 3], [2.6, -0.3, 0, 2.4], [-2.6, -0.3, 0, 2.2], [1, 1, 0, 2]].forEach(([a, b, d, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), cloudMat); m.position.set(a, b, d); m.scale.y = 0.65; c.add(m); });
  scene.add(c);
});

// ---------- ground ----------
const world = new THREE.Group(); scene.add(world);
const cobbleMat = toon({ map: P.cobble() });
const ground = new THREE.Mesh(tplane(60, 40, 3), cobbleMat); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 18); ground.receiveShadow = true; world.add(ground);
const grassTex = P.grass(); const grassG = new THREE.Mesh(tplane(120, 80, 4), toon({ map: grassTex })); grassG.rotation.x = -Math.PI / 2; grassG.position.set(0, -0.02, -40); grassG.receiveShadow = true; world.add(grassG);

// ---------- shop ----------
const wallMat = toon({ map: P.plaster() }), brickMat = toon({ map: P.brick() }), woodMat = toon({ map: P.wood() }), roofMat = toon({ map: P.roofTile() });
const wallBox = (x0, x1, y0, y1, mat = wallMat, z = -0.15, th = 0.3) => add(world, tbox(x1 - x0, y1 - y0, th, 1.8), mat, (x0 + x1) / 2, (y0 + y1) / 2, z);
wallBox(-7, 0.45, 0, 3.4); wallBox(1.35, 7, 0, 3.4); wallBox(0.45, 1.35, 2.15, 3.4);
wallBox(-7, 0.45, 0, 0.5, brickMat, -0.12, 0.36); wallBox(1.35, 7, 0, 0.5, brickMat, -0.12, 0.36);
add(world, tbox(0.9, 0.06, 0.5, 1.2), woodMat, 0.9, 0.03, 0.05); // threshold
add(world, tbox(14.2, 0.18, 0.5, 1.2), woodMat, 0, 3.45, -0.05); // cornice
// window
add(world, tbox(1.8, 1.3, 0.06, 1.2), woodMat, -1.8, 1.45, 0.03);
const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.05), new THREE.MeshBasicMaterial({ map: P.glass() })); glass.position.set(-1.8, 1.45, 0.065); world.add(glass);
add(world, tbox(0.06, 1.05, 0.04, 1.2), woodMat, -1.8, 1.45, 0.08); add(world, tbox(1.55, 0.06, 0.04, 1.2), woodMat, -1.8, 1.45, 0.08);
add(world, tbox(2.0, 0.08, 0.3, 1.2), woodMat, -1.8, 0.78, 0.14);
// awning
const awnA = toon({ color: 0xd9503f }), awnB = toon({ color: 0xfbf1dc });
for (let i = 0; i < 17; i++) add(world, new THREE.BoxGeometry(0.4, 0.05, 0.95), i % 2 ? awnB : awnA, -3.2 + i * 0.4, 2.3, 0.46, { rot: [0.38, 0, 0] });
// sign
const signMat = toon({ map: P.sign('BAKERY') });
add(world, new THREE.BoxGeometry(2.4, 0.62, 0.08), [woodMat, woodMat, woodMat, woodMat, signMat, woodMat], 0.9, 2.82, 0.1);
add(world, new THREE.BoxGeometry(0.04, 0.3, 0.04), woodMat, -0.2, 3.1, 0.1); add(world, new THREE.BoxGeometry(0.04, 0.3, 0.04), woodMat, 2.0, 3.1, 0.1);
// roof + chimney
const th = Math.atan2(1.3, 2.15), rl = Math.hypot(1.3, 2.15) + 0.3;
add(world, tbox(14.4, 0.14, rl, 1.6), roofMat, 0, 4.05, -0.725, { rot: [th, 0, 0] });
add(world, tbox(14.4, 0.14, rl, 1.6), roofMat, 0, 4.05, -2.875, { rot: [-th, 0, 0] });
add(world, tbox(0.55, 1.5, 0.55, 1.2), brickMat, 2.8, 4.7, -1.3);
// interior seen through the door
const inMat = toon({ color: 0x8a5a38, emissive: 0x3a2010 });
add(world, tbox(3.4, 0.1, 2.8, 1.2), woodMat, 0.9, -0.03, -1.4, { ink: false });
add(world, new THREE.BoxGeometry(3.4, 3.4, 0.2), inMat, 0.9, 1.7, -2.8, { ink: false });
add(world, new THREE.BoxGeometry(0.1, 3.4, 2.8), inMat, -0.7, 1.7, -1.4, { ink: false }); add(world, new THREE.BoxGeometry(0.1, 3.4, 2.8), inMat, 2.5, 1.7, -1.4, { ink: false });
const loafShelfMat = toon({ color: 0xd9923d, emissive: 0x3a1c06 });
[0.95, 1.55].forEach((y) => { add(world, new THREE.BoxGeometry(2.8, 0.06, 0.5), woodMat, 0.9, y, -2.5, { ink: false });
  for (let i = 0; i < 5; i++) add(world, new THREE.SphereGeometry(1, 14, 10), loafShelfMat, -0.2 + i * 0.5, y + 0.12, -2.5, { scale: [0.2, 0.11, 0.14], ink: false }); });
// door (hinged at its left edge, swings outward)
const door = new THREE.Group(); door.position.set(0.45, 0, 0.02); world.add(door);
add(door, tbox(0.9, 2.1, 0.07, 1.2), woodMat, 0.45, 1.05, 0.04);
const panelMat = toon({ color: 0x9a6232 });
add(door, new THREE.BoxGeometry(0.62, 0.8, 0.03), panelMat, 0.45, 0.6, 0.085, { ink: false }); add(door, new THREE.BoxGeometry(0.62, 0.7, 0.03), panelMat, 0.45, 1.55, 0.085, { ink: false });
add(door, new THREE.SphereGeometry(0.04, 12, 10), toon({ color: 0xe8b84a }), 0.76, 1.0, 0.11);
// props
const iron = toon({ color: 0x3b3a45 });
add(world, new THREE.CylinderGeometry(0.04, 0.05, 2.4, 10), iron, -1.25, 1.2, 1.0);
add(world, new THREE.BoxGeometry(0.26, 0.34, 0.26), toon({ color: 0xffe7a0, emissive: 0x6a5420 }), -1.25, 2.55, 1.0);
add(world, new THREE.ConeGeometry(0.22, 0.2, 4), iron, -1.25, 2.82, 1.0, { rot: [0, Math.PI / 4, 0] });
add(world, new THREE.CylinderGeometry(0.3, 0.3, 0.7, 18), woodMat, 1.85, 0.35, 0.5);
[0.18, 0.52].forEach((y) => add(world, new THREE.CylinderGeometry(0.315, 0.315, 0.05, 18), iron, 1.85, y, 0.5));
// chimney smoke
const puffMat = (i) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, fog: false });
const puffs = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), puffMat(i)); scene.add(m); return m; });

// ---------- baker card ----------
const bakerCanvas = makeCanvas(), bakerTex = new THREE.CanvasTexture(bakerCanvas);
bakerTex.colorSpace = THREE.SRGBColorSpace; bakerTex.anisotropy = 8;
const card = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2), new THREE.MeshBasicMaterial({ map: bakerTex, transparent: true, alphaTest: 0.4, toneMapped: false }));
card.position.set(S.BAKER.x, 0.95, S.BAKER.z); scene.add(card);
const blobM = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5), new THREE.MeshBasicMaterial({ map: P.blob(), transparent: true, depthWrite: false }));
blobM.rotation.x = -Math.PI / 2; blobM.position.set(S.BAKER.x, 0.012, S.BAKER.z); scene.add(blobM);

// ---------- the loaf ----------
const loaf = new THREE.Group(); world.add(loaf);
const body = new THREE.Group(); loaf.add(body);
add(body, new THREE.SphereGeometry(1, 32, 24), toon({ map: P.loafTex() }), 0, 0, 0, { scale: [0.19, 0.18, 0.31] });
const white = toon({ color: 0xffffff }), dark = new THREE.MeshBasicMaterial({ color: INK });
[-1, 1].forEach((s) => { add(body, new THREE.SphereGeometry(0.036, 14, 10), white, s * 0.065, 0.075, 0.272, { ink: true });
  add(body, new THREE.SphereGeometry(0.018, 10, 8), dark, s * 0.067, 0.075, 0.302, { ink: false, cast: false }); });
const legGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.2, 10); legGeo.translate(0, -0.1, 0);
const legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.x = s * 0.07; loaf.add(p);
  add(p, legGeo, toon({ color: 0xc88a3a }), 0, 0, 0); add(p, new THREE.SphereGeometry(0.045, 12, 8), toon({ color: 0x3a2a2a }), 0, -0.2, 0.025, { scale: [1, 0.6, 1.5] }); return p; });

// ---------- vignette ----------
const vig = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: P.vignette(), transparent: true, depthTest: false, depthWrite: false, fog: false }));
const vh = 2 * 0.3 * Math.tan(THREE.MathUtils.degToRad(20));
vig.scale.set(vh * (W / H) * 1.02, vh * 1.02, 1); vig.position.set(0, 0, -0.3); vig.renderOrder = 999; camera.add(vig);

// ---------- per-frame ----------
window.renderFrame = (f) => {
  const c = S.camAt(f);
  camera.position.set(...c.pos); camera.lookAt(...c.look); camera.rotateZ(c.roll);
  door.rotation.y = S.doorAt(f);
  const l = S.loafAt(f);
  loaf.position.set(l.x, l.hop, l.z); loaf.rotation.y = l.heading;
  body.position.y = 0.2 * l.legK + 0.13; body.rotation.x = l.pitch;
  legs.forEach((p, i) => { p.position.y = 0.2 * l.legK; p.scale.y = l.legK; p.rotation.x = (i ? -1 : 1) * l.swing; });
  drawBaker(bakerCanvas, S.bakerAt(f)); bakerTex.needsUpdate = true;
  card.rotation.y = Math.atan2(camera.position.x - card.position.x, camera.position.z - card.position.z);
  puffs.forEach((m, i) => { const ph = (f * 0.012 + i / 4) % 1; m.position.set(2.8 + 0.5 * ph, 5.6 + ph * 1.7, -1.3); m.scale.setScalar(0.18 + 0.3 * ph); m.material.opacity = (1 - ph) * 0.85; });
  renderer.render(scene, camera);
  return true;
};
window.ready = true;
