// Graphics polish on top of the street: contact shadows where things meet the ground,
// low drifting mist, twinkling stars, a warm city glow on the horizon and lightning bolts.
// Like details.js, everything here is decoration and never blocks the player.
import * as THREE from 'three';
import { scene, camera } from '../engine/renderer.js';
import { tex, blobTex } from '../engine/textures.js';
import { settings } from '../core/storage.js';
import { QUALITY } from '../config.js';
import { rnd } from '../core/util.js';

// ---------- contact shadows ----------
// A dark fade along the foot of the house walls, and soft blobs under props.
const edgeTex = tex(4, 32, (g, w, h) => {
  for (let y = 0; y < h; y++) {
    g.fillStyle = `rgba(0,0,0,${(Math.pow(1 - y / (h - 1), 1.8) * 0.9).toFixed(3)})`;
    g.fillRect(0, y, w, 1);
  }
});
edgeTex.magFilter = THREE.LinearFilter;
edgeTex.wrapS = edgeTex.wrapT = THREE.ClampToEdgeWrapping;

const shadowMat = (map, opacity) =>
  new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    opacity,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

function groundStrip(x, width, side, opacity, y = 0.03) {
  // the dark edge of the texture faces the wall on that side
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, 64), shadowMat(edgeTex, opacity));
  m.rotation.set(-Math.PI / 2, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
  m.position.set(x, y, -27);
  scene.add(m);
}
groundStrip(8.55, 0.9, 1, 0.65); // foot of the right-hand houses
groundStrip(-8.55, 0.9, -1, 0.65); // foot of the left-hand houses
groundStrip(6.72, 0.45, 1, 0.4, 0.012); // road gutter beside the right curb
groundStrip(-6.72, 0.45, -1, 0.4, 0.012); // and the left curb

const blobGeo = new THREE.PlaneGeometry(1, 1);
const blobMat = shadowMat(blobTex, 0.75);
function blob(x, z, w, d, y = 0.025) {
  const m = new THREE.Mesh(blobGeo, blobMat);
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, d, 1);
  m.position.set(x, y, z);
  scene.add(m);
}
blob(5.4, -26.3, 3.0, 6.4); // jeepney
blob(-6.15, -44.5, 2.0, 2.4); // tricycle
blob(7.4, -8, 1.1, 1.1); // blue drum
blob(7.6, -9.4, 0.8, 0.7); // trash bag
blob(-7.8, -22, 1.4, 1.4); // hollow blocks
blob(-7.7, -32, 1.1, 1.1); // cardboard boxes
blob(-7.5, -30.8, 1.2, 1.2);
blob(-4, -52, 2.6, 0.9); // bench
blob(-3, 4.4, 2.2, 1.5); // Lola's shelter box
[
  [-7.8, -12],
  [7.8, -24],
  [-7.8, -38],
  [7.8, -50],
].forEach(([x, z]) => blob(x, z, 0.7, 0.7)); // electric posts
[
  [-8.4, -3],
  [8.4, -1],
  [-8.4, -7.5],
  [8.4, -19],
  [-8.4, -26],
  [8.4, -33],
  [-8.4, -48],
  [8.4, -45],
].forEach(([x, z]) => blob(x, z, 0.7, 0.7, 0.035)); // potted plants

// ---------- ground mist ----------
// Soft, lumpy puffs that drift low over the road. Recycled around the player.
const puffTex = tex(64, 64, (g, w, h) => {
  for (let i = 0; i < 26; i++) {
    const x = rnd(14, 50),
      y = rnd(20, 44),
      r = rnd(8, 18);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.22)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }
});
puffTex.magFilter = THREE.LinearFilter;
puffTex.wrapS = puffTex.wrapT = THREE.ClampToEdgeWrapping;

const MAX_MIST = Math.max(...Object.values(QUALITY).map((q) => q.mist));
const mist = [];
for (let i = 0; i < MAX_MIST; i++) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: puffTex, color: 0x9aa8c8, transparent: true, opacity: 0, depthWrite: false }),
  );
  const size = rnd(3.5, 6.5);
  s.scale.set(size, size * 0.45, 1);
  s.position.set(rnd(-8, 8), rnd(0.25, 0.85), rnd(-58, 5));
  s.userData = { drift: rnd(0.08, 0.25), phase: rnd(0, 6.28), base: rnd(0.55, 1) };
  scene.add(s);
  mist.push(s);
}
// How thick the mist is per weather: heaviest on a still night after rain.
const MIST = { ulan: 0.55, bagyo: 0.3, ambon: 0.85, aliwalas: 1 };

// ---------- stars (clear nights only) ----------
const starGroups = [];
for (let k = 0; k < 3; k++) {
  const pos = [];
  for (let i = 0; i < 90; i++) {
    const a = rnd(0, Math.PI * 2),
      e = rnd(0.28, 1.35); // elevation above the horizon
    pos.push(Math.cos(a) * Math.cos(e) * 98, Math.sin(e) * 98, Math.sin(a) * Math.cos(e) * 98);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xdfe4ff,
      size: k === 0 ? 2 : 1.4,
      sizeAttenuation: false,
      transparent: true,
      fog: false,
      depthWrite: false,
    }),
  );
  pts.visible = false;
  pts.renderOrder = -1;
  scene.add(pts);
  starGroups.push(pts);
}

// ---------- city glow on the horizon ----------
const horizonTex = tex(4, 64, (g, w, h) => {
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1); // 0 = top of the band, 1 = horizon
    g.fillStyle = `rgba(255,150,80,${(Math.pow(v, 2.4) * 0.8).toFixed(3)})`;
    g.fillRect(0, y, w, 1);
  }
});
horizonTex.magFilter = THREE.LinearFilter;
horizonTex.wrapT = THREE.ClampToEdgeWrapping;
const horizonMat = new THREE.MeshBasicMaterial({
  map: horizonTex,
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  fog: false,
  side: THREE.BackSide,
});
const horizon = new THREE.Mesh(new THREE.CylinderGeometry(95, 95, 22, 32, 1, true), horizonMat);
horizon.position.y = 8;
scene.add(horizon);
const HORIZON = { ulan: 0.42, bagyo: 0.3, ambon: 0.5, aliwalas: 0.22 };

// ---------- lightning bolts ----------
// Built as flat glowing ribbons facing the player: a plain line is only one pixel wide
// at the game's low resolution and disappears.
const MAX_SEG = 90;
const boltPos = new Float32Array(MAX_SEG * 6 * 3);
const boltGeo = new THREE.BufferGeometry();
boltGeo.setAttribute('position', new THREE.BufferAttribute(boltPos, 3));
const boltMat = new THREE.MeshBasicMaterial({
  color: 0xe6ecff,
  transparent: true,
  blending: THREE.AdditiveBlending,
  fog: false,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const boltMesh = new THREE.Mesh(boltGeo, boltMat);
boltMesh.frustumCulled = false;
boltMesh.visible = false;
scene.add(boltMesh);

// Builds a new jagged bolt with one or two branches, somewhere in front of the player.
export function newBolt() {
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  const a = Math.atan2(fwd.z, fwd.x) + rnd(-0.8, 0.8);
  const cp = camera.position;
  const toCam = new THREE.Vector3(),
    dir = new THREE.Vector3(),
    side = new THREE.Vector3();
  let n = 0;
  const seg = (x0, y0, z0, x1, y1, z1, width) => {
    if (n >= MAX_SEG) return;
    dir.set(x1 - x0, y1 - y0, z1 - z0);
    toCam.set(cp.x - x0, cp.y - y0, cp.z - z0);
    side
      .crossVectors(dir, toCam)
      .normalize()
      .multiplyScalar(width / 2);
    // two triangles: (a-, a+, b+) and (a-, b+, b-)
    boltPos.set(
      [
        x0 - side.x,
        y0 - side.y,
        z0 - side.z,
        x0 + side.x,
        y0 + side.y,
        z0 + side.z,
        x1 + side.x,
        y1 + side.y,
        z1 + side.z,
        x0 - side.x,
        y0 - side.y,
        z0 - side.z,
        x1 + side.x,
        y1 + side.y,
        z1 + side.z,
        x1 - side.x,
        y1 - side.y,
        z1 - side.z,
      ],
      n * 18,
    );
    n++;
  };
  let x = cp.x + Math.cos(a) * 85,
    z = cp.z + Math.sin(a) * 85,
    y = 64;
  const branches = [];
  while (y > 12 && n < 60) {
    const nx = x + rnd(-3.5, 3.5),
      ny = y - rnd(2.5, 5),
      nz = z + rnd(-3.5, 3.5);
    seg(x, y, z, nx, ny, nz, 0.75);
    if (Math.random() < 0.25) branches.push([nx, ny, nz]);
    x = nx;
    y = ny;
    z = nz;
  }
  branches.slice(0, 3).forEach(([bx, by, bz]) => {
    for (let i = 0; i < 6; i++) {
      const nx = bx + rnd(-4, 4),
        ny = by - rnd(2, 4),
        nz = bz + rnd(-4, 4);
      seg(bx, by, bz, nx, ny, nz, 0.4);
      bx = nx;
      by = ny;
      bz = nz;
    }
  });
  boltGeo.setDrawRange(0, n * 6);
  boltGeo.attributes.position.needsUpdate = true;
}

// ---------- per frame ----------
let mistLevel = 0.55,
  horizonLevel = 0.42;
export function updatePolish(dt, t, weatherKey, mode, boltOn) {
  const cp = camera.position;
  const q = QUALITY[settings.quality];

  // mist: thicker in horror mode, eases in when the weather changes
  const target = (MIST[weatherKey] ?? 0.5) * (mode === 'horror' ? 1.6 : 1);
  mistLevel += (target - mistLevel) * Math.min(1, dt * 0.8);
  mist.forEach((s, i) => {
    const on = i < q.mist;
    s.visible = on;
    if (!on) return;
    const u = s.userData;
    s.position.x += Math.sin(t * 0.07 + u.phase) * u.drift * dt;
    s.position.z += u.drift * 0.6 * dt;
    // keep the puffs around the player
    if (s.position.z > cp.z + 14) s.position.z -= 28;
    if (s.position.z < cp.z - 14) s.position.z += 28;
    s.position.z = Math.max(-58, Math.min(5, s.position.z));
    s.material.opacity = 0.11 * mistLevel * u.base;
  });

  // stars twinkle on clear nights
  const clear = weatherKey === 'aliwalas';
  starGroups.forEach((pts, k) => {
    pts.visible = clear;
    if (clear) pts.material.opacity = settings.calm ? 0.8 : 0.55 + 0.45 * Math.sin(t * (1.3 + k * 0.7) + k * 2.1);
  });

  // horizon glow, brighter under low clouds; lightning lights it up
  horizonLevel += ((HORIZON[weatherKey] ?? 0.4) - horizonLevel) * Math.min(1, dt * 0.8);
  horizonMat.opacity = horizonLevel + (boltOn ? 0.25 : 0);

  boltMesh.visible = boltOn;
}
