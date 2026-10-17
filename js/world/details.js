// Extra visual detail layered on top of the street: light halos, wet-road reflections,
// light pools, parols and Christmas lights, drifting clouds, rain splashes, TV flicker,
// posters and ground clutter. Everything here is decoration: none of it blocks the player.
import * as THREE from 'three';
import { scene, camera } from '../engine/renderer.js';
import { mat } from '../engine/materials.js';
import { tex, signTex, glowTex } from '../engine/textures.js';
import { settings } from '../core/storage.js';
import { QUALITY } from '../config.js';
import { rnd, pick } from '../core/util.js';
import { shade, box, plane, cyl } from './helpers.js';
import { posts, storeGlow, litWindows, eaves, lantern, PUDDLES } from './street.js';

// ---------- shared textures ----------
// Soft vertical streak: how a light looks reflected on wet asphalt.
const streakTex = tex(16, 64, (g, w, h) => {
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const fade = Math.pow(1 - v, 1.6) * Math.min(1, v * 10 + 0.25);
    for (let x = 0; x < w; x++) {
      const u = Math.abs(x / (w - 1) - 0.5) * 2;
      const a = fade * Math.pow(1 - u, 2.2) * (0.75 + Math.random() * 0.25);
      g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      g.fillRect(x, y, 1, 1);
    }
  }
});
streakTex.magFilter = THREE.LinearFilter;
streakTex.wrapS = streakTex.wrapT = THREE.ClampToEdgeWrapping;

// Soft round pool of light on the ground.
const poolTex = tex(32, 32, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,0.9)');
  r.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, w, h);
});
poolTex.magFilter = THREE.LinearFilter;

const glowSprite = (color, size, opacity = 0.6) => {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  s.scale.set(size, size, 1);
  return s;
};
const additive = (map, color, opacity) =>
  new THREE.MeshBasicMaterial({
    map,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

// ---------- light halos, ground pools and wet-road reflections ----------
// Each light source gets: a halo in the air, a pool on the ground and a streak that points at the camera.
const lights = [];
function addLight({ x, y, z, color, halo, pool, streak, power = () => 1 }) {
  const item = { x, y, z, power, base: {} };
  if (halo) {
    item.halo = glowSprite(color, halo, 0.55);
    item.halo.position.set(x, y, z);
    scene.add(item.halo);
    item.base.halo = 0.55;
  }
  if (pool) {
    item.pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(poolTex, color, 0.22));
    item.pool.rotation.x = -Math.PI / 2;
    item.pool.scale.set(pool[0], pool[1], 1);
    item.pool.position.set(pool[2] ?? x, 0.025, pool[3] ?? z);
    scene.add(item.pool);
    item.base.pool = 0.22;
  }
  if (streak) {
    item.streak = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(streakTex, color, 0.5));
    item.streak.rotation.order = 'YXZ';
    item.streakW = streak[0];
    item.streakL = streak[1];
    item.streak.scale.set(streak[0], streak[1], 1);
    scene.add(item.streak);
    item.base.streak = 0.5;
  }
  lights.push(item);
  return item;
}

posts.forEach((p) =>
  addLight({
    x: p.x,
    y: 5.5,
    z: p.z,
    color: 0xffb070,
    halo: 2.2,
    pool: [6.5, 6.5, p.x, p.z],
    streak: [0.9, 7],
    power: () => (p.off ? 0 : Math.min(1, p.L.intensity / 2)),
  }),
);
addLight({
  x: -8.6,
  y: 1.6,
  z: -15,
  color: 0xffa65a,
  halo: 1.6,
  pool: [3.2, 4.4, -7.6, -15],
  streak: [1.6, 4],
  power: () => Math.min(1, storeGlow.intensity / 1.1),
});
addLight({
  x: lantern.position.x,
  y: lantern.position.y,
  z: lantern.position.z,
  color: 0xffd08a,
  halo: 1.1,
  pool: [2.6, 2.6, lantern.position.x, lantern.position.z],
  streak: [0.5, 2.2],
});
litWindows.forEach((w) =>
  addLight({
    x: w.x - w.side * 0.05,
    y: w.y,
    z: w.z,
    color: w.mat ? 0x8fb4ff : 0xffb46a,
    halo: w.upper ? 0.9 : 1.2,
    pool: w.upper ? null : [1.6, 1.8, w.x - w.side * 0.9, w.z],
    streak: w.upper ? null : [0.7, 2.6],
    power: () => (w.mat ? 0.55 + w.flick * 0.6 : 0.8),
  }),
);

// ---------- TV flicker in some windows ----------
const tvWindows = litWindows.filter((w) => w.mat);
tvWindows.forEach((w) => {
  w.flick = 0.5;
  w.next = 0;
  w.mat.emissive = new THREE.Color(0x4a6aa8);
});

// ---------- parols (Christmas star lanterns) ----------
function starShape(outer, inner) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer,
      a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
const starGeo = new THREE.ShapeGeometry(starShape(0.34, 0.15));
const ringGeo = new THREE.RingGeometry(0.36, 0.41, 20);
const tailGeo = new THREE.PlaneGeometry(0.035, 0.55);
tailGeo.translate(0, -0.275, 0);
const parols = [];
const parolSpots = eaves
  .filter((e) => e.h > 3.3)
  .sort(() => Math.random() - 0.5)
  .slice(0, 6);
parolSpots.forEach((e, i) => {
  const g = new THREE.Group();
  const hue = [0.0, 0.12, 0.58, 0.33, 0.83, 0.07][i % 6];
  const starM = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setHSL(hue, 0.9, 0.62),
    side: THREE.DoubleSide,
  });
  const rimM = new THREE.MeshBasicMaterial({ color: 0xfff1c8, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(starGeo, starM));
  const ring = new THREE.Mesh(ringGeo, rimM);
  ring.position.z = -0.01;
  g.add(ring);
  [-0.12, 0.12].forEach((tx) => {
    const t = new THREE.Mesh(tailGeo, starM);
    t.position.set(tx, -0.38, 0);
    g.add(t);
  });
  const halo = glowSprite(starM.color, 1.8, 0.6);
  g.add(halo);
  g.position.set(e.side * 8.75, Math.min(e.h - 0.75, 3.3), e.z - (i % 2 ? 1.0 : 6.6));
  g.rotation.y = e.side < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(g);
  parols.push({ g, starM, halo, hue, phase: rnd(0, 6) });
});

// ---------- Christmas string lights along some roof edges ----------
const LIGHT_COLS = [0xff3b30, 0x34c759, 0xffd60a, 0x0a84ff, 0xff9f0a, 0xbf5af2].map((c) => new THREE.Color(c));
const xmasRuns = eaves.filter(() => Math.random() < 0.55);
const xmasPos = [],
  xmasCol = [];
const xmasCount = [];
xmasRuns.forEach((e) => {
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      zz = e.z - 0.2 - t * 7.2;
    const sag = Math.sin(t * Math.PI * 3) ** 2 * 0.18;
    xmasPos.push(e.side * 8.42, e.h - 0.12 - sag, zz);
    xmasCol.push(1, 1, 1);
    xmasCount.push(i);
  }
});
const xmasGeo = new THREE.BufferGeometry();
xmasGeo.setAttribute('position', new THREE.Float32BufferAttribute(xmasPos, 3));
xmasGeo.setAttribute('color', new THREE.Float32BufferAttribute(xmasCol, 3));
const xmas = new THREE.Points(
  xmasGeo,
  new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true }),
);
scene.add(xmas);

// ---------- clouds drifting across the sky ----------
const cloudTex = tex(128, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    const x = rnd(0, w),
      y = rnd(h * 0.35, h * 0.62),
      r = rnd(4, 14);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(70,74,100,0.5)');
    gr.addColorStop(1, 'rgba(70,74,100,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    if (x < r) g.fillRect(x - r + w, y - r, r * 2, r * 2); // wrap seamlessly
    if (x > w - r) g.fillRect(x - r - w, y - r, r * 2, r * 2);
  }
});
cloudTex.magFilter = THREE.LinearFilter;
cloudTex.wrapT = THREE.ClampToEdgeWrapping;
cloudTex.repeat.set(3, 1);
const cloudM = new THREE.MeshBasicMaterial({
  map: cloudTex,
  transparent: true,
  opacity: 0.8,
  side: THREE.BackSide,
  fog: false,
  depthWrite: false,
});
const clouds = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), cloudM);
clouds.renderOrder = -1;
scene.add(clouds);

// ---------- rain splashes on the ground ----------
const MAX_SPLASH = QUALITY.high.splash;
const splashPos = new Float32Array(MAX_SPLASH * 3);
const splashLife = new Float32Array(MAX_SPLASH);
const splashGeo = new THREE.BufferGeometry();
splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
const splashes = new THREE.Points(
  splashGeo,
  new THREE.PointsMaterial({ color: 0xc8d6f0, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.55 }),
);
splashes.frustumCulled = false;
scene.add(splashes);
for (let i = 0; i < MAX_SPLASH; i++) splashPos[i * 3 + 1] = -50; // start hidden below the ground
let splashIdx = 0,
  splashAcc = 0;

// ---------- posters on walls and posts ----------
const posters = [
  ['NAWAWALANG PUSA', 'Si Muning · puti · pulang kwintas', '#f2eee4', '#1f1f1f'],
  ['FOR RENT', 'Room for rent · Inquire inside', '#e8d84a', '#1c1c1c'],
  ['BAWAL MAGTAPON', 'ng basura dito · Brgy. Maligaya', '#ffffff', '#b3221b'],
  ['PALUWAGAN', 'Sali na! Kay Aling Nena', '#ff8fb1', '#3a0f1f'],
  ['MAY TUTA', 'Libre · 3 natira · tanong sa loob', '#bfe3ff', '#0f2a44'],
];
const posterMats = posters.map(([a, b, bg, fg]) => mat({ map: signTex(a, b, bg, fg, 64, 80) }));
eaves.forEach((e, i) => {
  if (i % 2 || !e.front) return;
  const m = pick(posterMats);
  const z = e.z - (Math.random() < 0.5 ? 2.85 : 4.75);
  const p = plane(0.42, 0.52, m, e.side * 8.97, rnd(1.3, 1.7), z, e.side < 0 ? Math.PI / 2 : -Math.PI / 2);
  p.rotation.z = rnd(-0.06, 0.06);
});
posts.forEach((p, i) => {
  const px = p.x + Math.sign(p.x) * 1.2 - Math.sign(p.x) * 0.12; // road-facing side of the post
  const pl = plane(0.3, 0.38, posterMats[i % posterMats.length], px, 1.5, p.z, p.x < 0 ? Math.PI / 2 : -Math.PI / 2);
  pl.rotation.z = rnd(-0.08, 0.08);
});

// ---------- ground clutter ----------
const ironM = mat({ color: 0x2a2b2e, specular: 0x555555, shininess: 30 });
const manhole = cyl(0.55, 0.55, 0.03, 14, ironM, 1.2, 0.015, -22.5, false);
manhole.receiveShadow = true;
const grateTex = tex(16, 16, (g, w, h) => {
  g.fillStyle = '#121214';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#4a4b4f';
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  g.fillRect(0, 0, 1, h);
  g.fillRect(w - 1, 0, 1, h);
});
const grateM = mat({ map: grateTex });
[-31, -9, -44, 1].forEach((z, i) => plane(0.5, 0.9, grateM, (i % 2 ? -1 : 1) * 6.7, 0.02, z, 0, -Math.PI / 2));

const leafCols = [0x5b4a2a, 0x6e5a2e, 0x3f4a22, 0x7a3f22];
const leafGeo = new THREE.PlaneGeometry(0.12, 0.08);
const leafMats = leafCols.map((c) => mat({ color: c, side: THREE.DoubleSide }));
for (let i = 0; i < 70; i++) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const l = new THREE.Mesh(leafGeo, pick(leafMats));
  l.rotation.set(-Math.PI / 2, 0, rnd(0, Math.PI * 2));
  l.position.set(side * rnd(5.6, 8.8), 0.03, rnd(-57, 4));
  l.receiveShadow = true;
  scene.add(l);
}
// grass in the cracks along the curbs
const grassM = mat({ color: 0x3c5a2a, side: THREE.DoubleSide });
const bladeGeo = new THREE.PlaneGeometry(0.05, 0.22);
bladeGeo.translate(0, 0.11, 0);
for (let i = 0; i < 40; i++) {
  const side = Math.random() < 0.5 ? -1 : 1,
    z = rnd(-57, 4),
    x = side * rnd(6.8, 7.1);
  for (let k = 0; k < 4; k++) {
    const b = new THREE.Mesh(bladeGeo, grassM);
    b.position.set(x + rnd(-0.06, 0.06), 0, z + rnd(-0.06, 0.06));
    b.rotation.set(rnd(-0.4, 0.4), rnd(0, 3), rnd(-0.4, 0.4));
    scene.add(b);
  }
}
// tsinelas left by a door, a plastic bag, a crushed can
const slipM = mat({ color: 0x2f6fc0 });
box(0.11, 0.025, 0.27, slipM, 8.45, 0.013, -11.6, false).rotation.y = 0.3;
box(0.11, 0.025, 0.27, slipM, 8.32, 0.013, -11.85, false).rotation.y = -0.2;
const bag = shade(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), mat({ color: 0xe8e6de })));
bag.scale.set(1, 0.6, 1.2);
bag.position.set(-6.4, 0.07, -36);
scene.add(bag);
cyl(
  0.035,
  0.035,
  0.1,
  6,
  mat({ color: 0xc23a2a, specular: 0x666666, shininess: 50 }),
  3.6,
  0.035,
  -33.4,
  false,
).rotation.z = Math.PI / 2;
// cracks drawn on the road
const crackTex = tex(32, 32, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(8,8,10,0.85)';
  g.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    let x = rnd(4, 28),
      y = 0;
    g.moveTo(x, y);
    while (y < h) {
      x += rnd(-3, 3);
      y += rnd(2, 5);
      g.lineTo(x, y);
    }
    g.stroke();
  }
});
const crackM = mat({ map: crackTex, transparent: true, depthWrite: false });
for (let i = 0; i < 9; i++) {
  const c = plane(rnd(1, 2), rnd(1.4, 2.6), crackM, rnd(-5.5, 5.5), 0.012, rnd(-55, 2), 0, -Math.PI / 2);
  c.rotation.z = rnd(0, Math.PI * 2);
}
// a sagging old tire hanging on a wall, and a broom against a door
const tire = shade(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.11, 6, 12), mat({ color: 0x18181a })));
tire.position.set(8.9, 1.2, -36.3);
tire.rotation.y = Math.PI / 2;
scene.add(tire);
const broom = new THREE.Group();
broom.add(cyl(0.015, 0.015, 1.1, 5, mat({ color: 0x8a6a3a }), 0, 0.55, 0, false));
const head = cyl(0.03, 0.14, 0.3, 6, mat({ color: 0xb59a5a }), 0, 0.1, 0, false);
broom.add(head);
broom.position.set(-8.75, 0, -20.4);
broom.rotation.z = 0.18;
scene.add(broom);
// a puddle gets a faint sky reflection rim
PUDDLES.forEach(([x, z, sx, sz]) => {
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 18), additive(null, 0x4a5a82, 0.12));
  rim.rotation.x = -Math.PI / 2;
  rim.scale.set(sx, sz, 1);
  rim.position.set(x, 0.02, z);
  scene.add(rim);
});

// ---------- per frame ----------
const tmpDir = new THREE.Vector3();
export function updateDetails(dt, t, weather, boltOn) {
  const wet = weather.rain > 0 ? 0.55 + weather.rain * 0.45 : 0.22;
  const cp = camera.position;

  // TV flicker: a random brightness change every 60-200 ms
  tvWindows.forEach((w) => {
    w.next -= dt;
    if (w.next <= 0) {
      w.next = rnd(0.06, 0.2);
      w.flick = settings.calm ? 0.5 : Math.random();
      w.mat.emissive.setRGB(0.18 + w.flick * 0.25, 0.26 + w.flick * 0.32, 0.4 + w.flick * 0.45);
    }
  });

  // halos, pools and reflections follow each light's brightness
  lights.forEach((L) => {
    const pw = L.power();
    if (L.halo) L.halo.material.opacity = L.base.halo * pw;
    if (L.pool) L.pool.material.opacity = L.base.pool * pw * (0.7 + wet * 0.5);
    if (L.streak) {
      tmpDir.set(cp.x - L.x, 0, cp.z - L.z);
      const d = tmpDir.length();
      tmpDir.normalize();
      const len = L.streakL * (0.6 + Math.min(1, d / 12) * 0.6);
      L.streak.scale.set(L.streakW, len, 1);
      L.streak.rotation.set(-Math.PI / 2, Math.atan2(-tmpDir.x, -tmpDir.z), 0);
      // the streak starts under the light and runs toward the camera, a little in front of the wall
      const bx = L.x + (L.x > 0 ? -0.6 : 0.6) * (Math.abs(L.x) > 8 ? 1 : 0);
      L.streak.position.set(bx + tmpDir.x * len * 0.5, 0.022, L.z + tmpDir.z * len * 0.5);
      L.streak.material.opacity = L.base.streak * pw * wet;
    }
  });

  // parols slowly change color and sway in the wind
  parols.forEach((p) => {
    const h = (p.hue + (settings.calm ? 0 : Math.sin(t * 0.6 + p.phase) * 0.06) + 1) % 1;
    p.starM.color.setHSL(h, 0.9, 0.6 + Math.sin(t * 2 + p.phase) * 0.05);
    p.halo.material.color.copy(p.starM.color);
    p.g.rotation.z = Math.sin(t * (0.8 + weather.wind * 0.6) + p.phase) * 0.06 * weather.wind;
  });

  // Christmas lights chase pattern
  const step = settings.calm ? 0 : Math.floor(t * 3);
  const colAttr = xmasGeo.attributes.color;
  for (let i = 0; i < xmasCount.length; i++) {
    const c = LIGHT_COLS[(xmasCount[i] + step) % LIGHT_COLS.length];
    const on = settings.calm || (xmasCount[i] + step) % 3 !== 0 ? 1 : 0.25;
    colAttr.setXYZ(i, c.r * on, c.g * on, c.b * on);
  }
  colAttr.needsUpdate = true;

  // clouds drift, thicken with the weather and light up with lightning
  cloudTex.offset.x = (cloudTex.offset.x + dt * 0.004 * (0.5 + weather.wind)) % 1;
  cloudM.opacity = weather.moon ? 0.25 : 0.55 + weather.rain * 0.4;
  cloudM.color.setScalar(boltOn ? 2.6 : 1);

  // rain splashes near the camera
  const max = Math.floor(QUALITY[settings.quality].splash * weather.rain);
  splashAcc += dt * max * 6;
  while (splashAcc > 1 && max > 0) {
    splashAcc -= 1;
    const i = splashIdx++ % max;
    const a = rnd(0, Math.PI * 2),
      r = Math.sqrt(Math.random()) * 9;
    splashPos[i * 3] = Math.max(-8.8, Math.min(8.8, cp.x + Math.cos(a) * r));
    splashPos[i * 3 + 1] = 0.05;
    splashPos[i * 3 + 2] = cp.z + Math.sin(a) * r;
    splashLife[i] = 0.12;
  }
  for (let i = 0; i < MAX_SPLASH; i++) {
    if (splashLife[i] > 0) {
      splashLife[i] -= dt;
      splashPos[i * 3 + 1] += dt * 0.6;
      if (splashLife[i] <= 0 || i >= max) splashPos[i * 3 + 1] = -50;
    }
  }
  splashGeo.attributes.position.needsUpdate = true;
}
