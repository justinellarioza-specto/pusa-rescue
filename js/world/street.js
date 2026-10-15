// Builds Brgy. Maligaya: sky, road, houses, sari-sari store, jeepney, props,
// street lamps, wires, banderitas, the shelter box, rain and moths.
import * as THREE from 'three';
import { scene } from '../engine/renderer.js';
import { mat } from '../engine/materials.js';
import { T, wallTex, signTex } from '../engine/textures.js';
import { rnd, pick } from '../core/util.js';
import { colliders, shade, box, plane, cyl } from './helpers.js';

// sky + far skyline silhouettes (unaffected by fog)
const sky = new THREE.Mesh(new THREE.SphereGeometry(110, 24, 12), new THREE.MeshBasicMaterial({ map: T.sky, side: THREE.BackSide, fog: false, depthWrite: false }));
sky.renderOrder = -1; scene.add(sky);
const silM = new THREE.MeshBasicMaterial({ color: 0x030308, fog: false, side: THREE.DoubleSide });
for (let side = -1; side <= 1; side += 2) {
  for (let z = 6; z > -66; z -= rnd(5, 8)) {
    const h = rnd(4, 7.5), b = new THREE.Mesh(new THREE.BoxGeometry(rnd(4, 7), h, rnd(4, 7)), silM);
    b.position.set(side * rnd(18, 26), h / 2, z); scene.add(b);
  }
  for (let z = 2; z > -62; z -= rnd(7, 12)) {
    const tree = new THREE.Group(), lean = rnd(-1.2, 1.2), H = rnd(7, 10);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.3, H * 0.5, 0), new THREE.Vector3(lean, H, 0)]);
    tree.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.16, 5), silM));
    for (let i = 0; i < 9; i++) {
      const fg = new THREE.PlaneGeometry(2.6, 0.42); fg.translate(1.3, 0, 0);
      const f = new THREE.Mesh(fg, silM); f.position.set(lean, H, 0);
      f.rotation.set(rnd(-0.2, 0.2), i * 0.7 + rnd(0, 0.3), -rnd(0.35, 0.8)); tree.add(f);
    }
    tree.position.set(side * rnd(15, 21), 0, z); scene.add(tree);
  }
}

// road, curbs, sidewalks, puddles
plane(14, 66, mat({ map: T.road, specular: 0x2a2c34, shininess: 28 }), 0, 0, -27, 0, -Math.PI / 2, 14, 66);
[-8.1, 8.1].forEach(x => plane(2.2, 66, mat({ map: T.side }), x, 0.02, -27, 0, -Math.PI / 2, 3, 66));
const curbM = mat({ color: 0x77756f });
[-6.95, 6.95].forEach(x => box(0.2, 0.12, 66, curbM, x, 0.06, -27, false));
const puddleM = mat({ color: 0x1b2131, specular: 0x9aa8c4, shininess: 110, transparent: true, opacity: 0.85 });
[[-2, -5, 1.4, 0.8], [3, -17, 1.0, 1.6], [-4, -28, 1.8, 1.0], [1.5, -40, 1.2, 0.7], [-1, -49, 2.0, 1.1], [4.5, -12, 0.7, 0.5]].forEach(([x, z, sx, sz]) => {
  const p = new THREE.Mesh(new THREE.CircleGeometry(1, 12), puddleM);
  p.rotation.x = -Math.PI / 2; p.scale.set(sx, sz, 1); p.position.set(x, 0.015, z); p.receiveShadow = true; scene.add(p);
});

// houses on both sides
const houseCols = ['#7c8a6f', '#8f7d6a', '#6c7c8a', '#8a6f72', '#9a9278', '#6f7f78', '#857a8e', '#7a6e5c', '#a08a6a', '#6a8a86'];
const winMats = { lit: T.winLit.map(t => mat({ map: t, emissive: 0x6a4a20, emissiveMap: t })), dark: T.winDark.map(t => mat({ map: t, specular: 0x334455, shininess: 60 })) };
const doorM = mat({ map: T.door });
const sillM = mat({ color: 0x8a857a });
const grillM = mat({ map: T.grill, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
const tankM = mat({ color: 0x2a5fa0, specular: 0x222222, shininess: 20 });
const metalM = mat({ color: 0x55575c });
function house(side, z, opts = {}) {
  const h = opts.h || rnd(3.2, 5.4), col = opts.col || pick(houseCols);
  const fx = side * 9, ry = side < 0 ? Math.PI / 2 : -Math.PI / 2, cz = z - 3.8;
  box(6, h, 7.6, mat({ map: wallTex(col) }), side * 12, h / 2, cz, true);
  const roof = box(6.8, 0.22, 8.2, mat({ map: T.yero }), side * 11.9, h + 0.1, cz, false);
  roof.rotation.z = side * 0.06;
  box(0.08, 0.3, 8.2, mat({ color: 0x3e3a34 }), side * 8.55, h - 0.02, cz, false);
  if (opts.noFront) return h;
  [z - 1.9, z - 5.7].forEach(wz => {
    plane(1.3, 1.1, pick(Math.random() < 0.45 ? winMats.lit : winMats.dark), fx - side * 0.02, 1.75, wz, ry);
    box(0.16, 0.08, 1.45, sillM, fx - side * 0.08, 1.16, wz, false);
  });
  plane(1.0, 2.0, doorM, fx - side * 0.02, 1.0, z - 3.8, ry);
  box(0.12, 0.3, 0.22, metalM, fx - side * 0.06, 1.95, z - 4.6, false);
  if (Math.random() < 0.55) { const aw = box(0.9, 0.05, 2.0, mat({ map: T.yero }), fx - side * 0.45, 2.35, z - 3.8, false); aw.rotation.z = -side * 0.18; }
  if (h > 4.4) {
    box(0.9, 0.12, 3.4, mat({ color: 0x7a766c }), fx - side * 0.45, 2.75, z - 3.8, false);
    plane(3.4, 0.9, grillM, fx - side * 0.88, 3.25, z - 3.8, ry);
    box(0.06, 0.06, 3.4, metalM, fx - side * 0.88, 3.72, z - 3.8, false);
    plane(1.3, 1.0, pick(Math.random() < 0.5 ? winMats.lit : winMats.dark), fx - side * 0.02, 3.4, z - 3.0, ry);
  }
  if (Math.random() < 0.4) cyl(0.5, 0.5, 0.9, 10, tankM, side * rnd(11, 13), h + 0.65, cz + rnd(-2, 2), false);
  if (Math.random() < 0.5) { const a = side * rnd(10.5, 13), az = cz + rnd(-3, 3); cyl(0.02, 0.02, 2.2, 4, metalM, a, h + 1.1, az, false); box(0.9, 0.03, 0.03, metalM, a, h + 1.9, az, false); box(0.6, 0.03, 0.03, metalM, a, h + 1.6, az, false); }
  return h;
}
for (let side = -1; side <= 1; side += 2) {
  for (let z = 2; z > -58; z -= 8) {
    if (side === -1 && z === -14) continue;
    house(side, z);
  }
}

// sari-sari store
house(-1, -14, { h: 3.7, col: '#b8a36a', noFront: true });
const shelfM = mat({ map: T.shelf, emissive: 0x3a2410, emissiveMap: T.shelf });
plane(3.6, 1.3, shelfM, -8.98, 1.45, -15, Math.PI / 2);
plane(3.6, 1.3, grillM, -8.9, 1.45, -15, Math.PI / 2);
box(0.25, 0.9, 3.6, mat({ color: 0x5a4632 }), -8.88, 0.45, -15, false);
plane(1.0, 2.0, doorM, -8.98, 1.0, -17.9, Math.PI / 2);
const storeGlow = new THREE.PointLight(0xffb25a, 1.1, 7, 2); storeGlow.position.set(-8.3, 1.7, -15); scene.add(storeGlow);
plane(3.8, 0.85, mat({ map: signTex('SARI-SARI STORE', "Aling Nena's · Load · Yelo · Softdrinks", '#d8b13a', '#8b1e1a', 192, 44) }), -8.95, 2.95, -15, Math.PI / 2);
box(1.8, 0.06, 4.2, mat({ map: T.yero }), -8.1, 2.45, -15, false);
box(0.08, 2.45, 0.08, mat({ color: 0x3a2f24 }), -7.25, 1.22, -13.0, true);
box(0.08, 2.45, 0.08, mat({ color: 0x3a2f24 }), -7.25, 1.22, -17.0, true);
cyl(0.18, 0.15, 0.45, 8, mat({ color: 0x2b6fb0 }), -7.7, 0.22, -16.4, false);
box(0.5, 0.4, 0.4, mat({ color: 0xc23a2a }), -7.6, 0.2, -13.6, false);

// parked jeepney
const jeep = new THREE.Group(); jeep.position.set(5.4, 0, -26); scene.add(jeep);
function jpart(geo, m, x, y, z) { const me = shade(new THREE.Mesh(geo, m)); me.position.set(x, y, z); jeep.add(me); return me; }
const chromeM = mat({ map: T.chrome, specular: 0x888888, shininess: 60 });
const jeepBodyM = mat({ map: T.jeep, specular: 0x444444, shininess: 30 });
jpart(new THREE.BoxGeometry(2.0, 1.25, 4.4, 3, 2, 6), jeepBodyM, 0, 1.12, 0.2);
jpart(new THREE.BoxGeometry(1.75, 0.55, 1.25, 2, 1, 2), mat({ color: 0xb9b8b1, specular: 0x666666, shininess: 50 }), 0, 0.85, -2.6);
jpart(new THREE.BoxGeometry(2.2, 0.1, 4.8), mat({ color: 0x8e8d87 }), 0, 1.8, 0.1);
jpart(new THREE.BoxGeometry(2.25, 0.06, 4.9), mat({ color: 0xc42f25 }), 0, 1.87, 0.1);
const grille = jpart(new THREE.PlaneGeometry(1.3, 0.42), chromeM, 0, 0.82, -3.23); grille.rotation.y = Math.PI;
[-0.62, 0.62].forEach(x => { const hl = jpart(new THREE.CircleGeometry(0.11, 8), new THREE.MeshBasicMaterial({ color: 0x2e2a20 }), x, 0.8, -3.235); hl.rotation.y = Math.PI; });
const ws = jpart(new THREE.PlaneGeometry(1.8, 0.55), mat({ color: 0x0a0d14, specular: 0x556677, shininess: 80 }), 0, 1.43, -2.01); ws.rotation.y = Math.PI;
const rs = jpart(new THREE.PlaneGeometry(1.6, 0.32), mat({ map: signTex('MALIGAYA', 'KANTO · TERMINAL · PALENGKE', '#ece6d4', '#b0261e', 128, 28) }), 0, 2.07, -2.0); rs.rotation.y = Math.PI;
jpart(new THREE.BoxGeometry(1.6, 0.34, 0.06), metalM, 0, 2.07, -1.96);
jpart(new THREE.ConeGeometry(0.06, 0.25, 4), chromeM, 0, 1.2, -3.0);
[-1.05, 1.05].forEach(x => jpart(new THREE.BoxGeometry(0.06, 0.18, 0.12), metalM, x, 1.55, -1.95));
jpart(new THREE.BoxGeometry(0.8, 0.06, 0.35), metalM, 0, 0.35, 2.55);
const wheelM = mat({ color: 0x141416 });
[[-0.95, 1.6], [0.95, 1.6], [-0.95, -1.6], [0.95, -1.6]].forEach(([x, z]) => {
  const w = jpart(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 10), wheelM, x, 0.38, z); w.rotation.z = Math.PI / 2;
  const hub = jpart(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 8), chromeM, x, 0.38, z); hub.rotation.z = Math.PI / 2;
});
colliders.push({ x0: 4.35, x1: 6.45, z0: -29.3, z1: -23.5 });

// tricycle
const trike = new THREE.Group(); trike.position.set(-6.2, 0, -44.5); trike.rotation.y = 0.15; scene.add(trike);
function tpart(geo, m, x, y, z) { const me = shade(new THREE.Mesh(geo, m)); me.position.set(x, y, z); trike.add(me); return me; }
tpart(new THREE.BoxGeometry(1.0, 1.0, 1.5), mat({ color: 0x1f4f8a }), -0.35, 0.85, 0);
tpart(new THREE.BoxGeometry(1.1, 0.06, 1.7), mat({ color: 0x15161a }), -0.2, 1.42, 0);
tpart(new THREE.BoxGeometry(0.25, 0.5, 1.3), mat({ color: 0x2a2b30 }), 0.45, 0.7, 0);
[[-0.35, 0.6], [0.45, -0.55], [0.45, 0.6]].forEach(([x, z]) => { const w = tpart(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 8), wheelM, x, 0.28, z); w.rotation.z = Math.PI / 2; });
colliders.push({ x0: -7.0, x1: -5.4, z0: -45.4, z1: -43.6 });

// blue drum + trash
cyl(0.36, 0.36, 0.95, 12, mat({ color: 0x1f4f8a, specular: 0x333333, shininess: 25 }), 7.4, 0.48, -8, true);
box(0.5, 0.35, 0.4, mat({ color: 0x1b1b1e, specular: 0x444444, shininess: 40 }), 7.6, 0.17, -9.4, false);

// hollow block stack
box(0.9, 0.6, 0.9, mat({ map: T.block }), -7.8, 0.3, -22, true);
box(0.6, 0.2, 0.4, mat({ map: T.block }), -7.4, 0.1, -23.0, false);

// cardboard boxes (one open)
box(0.7, 0.6, 0.7, mat({ map: T.cardboard }), -7.7, 0.3, -32, true);
box(0.6, 0.5, 0.6, mat({ map: T.cardboard }), -7.7, 0.85, -32, false);
const cbm = mat({ map: T.cardboard, side: THREE.DoubleSide });
box(0.8, 0.04, 0.8, cbm, -7.5, 0.02, -30.8, false);
box(0.8, 0.5, 0.04, cbm, -7.5, 0.25, -31.2, false);
box(0.8, 0.5, 0.04, cbm, -7.5, 0.25, -30.4, false);
box(0.04, 0.5, 0.8, cbm, -7.9, 0.25, -30.8, false);
box(0.04, 0.35, 0.8, cbm, -7.1, 0.18, -30.8, false);
const flap = box(0.04, 0.35, 0.8, cbm, -6.95, 0.42, -30.8, false); flap.rotation.z = -0.7;
colliders.push({ x0: -7.95, x1: -7.05, z0: -31.25, z1: -30.35 });

// basketball corner + bench + painted line
cyl(0.08, 0.08, 3.3, 8, metalM, 0, 1.65, -56.8, true);
box(1.5, 0.95, 0.06, mat({ map: signTex('', '', '#d4d1c6', '#000', 32, 24) }), 0, 3.15, -56.65, false);
const ring = shade(new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 4, 12), mat({ color: 0xc25a1f }))); ring.rotation.x = Math.PI / 2; ring.position.set(0, 2.8, -56.3); scene.add(ring);
const lineM = new THREE.MeshBasicMaterial({ color: 0x8a8a80, transparent: true, opacity: 0.35 });
const arc = new THREE.Mesh(new THREE.RingGeometry(3.9, 4.0, 24, 1, 0, Math.PI), lineM); arc.rotation.x = -Math.PI / 2; arc.position.set(0, 0.012, -56.8); scene.add(arc);
const wood = mat({ color: 0x5a4330 });
box(2.0, 0.08, 0.45, wood, -4, 0.48, -52, true);
box(2.0, 0.4, 0.06, wood, -4, 0.75, -52.22, false);
box(0.08, 0.45, 0.4, wood, -4.9, 0.22, -52, false); box(0.08, 0.45, 0.4, wood, -3.1, 0.22, -52, false);

// end wall with sign, Lola's gate
box(18, 2.0, 0.4, mat({ map: T.block }), 0, 1.0, -58.4, true);
plane(1.6, 0.6, mat({ map: signTex('BAWAL UMIHI DITO', 'Multa ₱500 · Brgy. Maligaya', '#e8e4da', '#b3221b', 128, 40) }), -3, 1.25, -58.19, 0);
box(18, 2.4, 0.4, mat({ map: T.block }), 0, 1.2, 5.6, true);
plane(2.4, 1.9, grillM, 0, 1.05, 5.38, 0);

// potted plants along the sidewalk
const potM = mat({ color: 0x8a4a2e }), leafM = mat({ color: 0x2f5a2a, side: THREE.DoubleSide });
[[-8.4, -3], [8.4, -1], [-8.4, -7.5], [8.4, -19], [-8.4, -26], [8.4, -33], [-8.4, -48], [8.4, -45]].forEach(([x, z]) => {
  cyl(0.24, 0.17, 0.38, 8, potM, x, 0.19, z, true);
  for (let i = 0; i < 6; i++) {
    const lg = new THREE.PlaneGeometry(0.16, 0.7); lg.translate(0, 0.35, 0);
    const l = shade(new THREE.Mesh(lg, leafM)); l.position.set(x, 0.36, z); l.rotation.set(rnd(-0.6, 0.6), i * 1.05, rnd(-0.6, 0.6)); scene.add(l);
  }
});

// electric posts with lamps, light cones, transformer
const posts = [];
const coneGeo = new THREE.ConeGeometry(2.0, 5.3, 14, 1, true);
[[-7.8, -12], [7.8, -24], [-7.8, -38], [7.8, -50]].forEach(([x, z], i) => {
  box(0.18, 6.2, 0.18, metalM, x, 3.1, z, true);
  box(1.3, 0.07, 0.07, metalM, x - Math.sign(x) * 0.65, 5.65, z, false);
  box(0.9, 0.06, 0.06, metalM, x, 5.95, z, false);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffc27a }));
  bulb.position.set(x - Math.sign(x) * 1.2, 5.52, z); scene.add(bulb);
  const L = new THREE.PointLight(0xff9f4a, 2.0, 16, 2); L.position.copy(bulb.position); L.position.y -= 0.2; scene.add(L);
  const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xffa860, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.set(bulb.position.x, 2.85, z); scene.add(cone);
  if (i === 1) cyl(0.32, 0.32, 0.8, 8, mat({ color: 0x6b6e72 }), x + 0.3, 4.6, z, false);
  posts.push({ L, bulb, cone, flicker: i === 2, x: bulb.position.x, z });
});
const wireMat = new THREE.LineBasicMaterial({ color: 0x0c0d10 });
function wire(a, b, sag = 0.6) { const m = new THREE.Vector3((a.x + b.x) / 2, Math.min(a.y, b.y) - sag, (a.z + b.z) / 2); const c = new THREE.QuadraticBezierCurve3(a, m, b); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(10)), wireMat)); }
const tops = [[-7.8, -12], [7.8, -24], [-7.8, -38], [7.8, -50]];
for (let k = 0; k < 3; k++) {
  for (let i = 0; i < tops.length - 1; i++) wire(new THREE.Vector3(tops[i][0], 5.95 - k * 0.12, tops[i][1]), new THREE.Vector3(tops[i + 1][0], 5.95 - k * 0.12, tops[i + 1][1]), 0.5 + k * 0.25);
}
tops.forEach(([x, z]) => { for (let k = 0; k < 4; k++) wire(new THREE.Vector3(x, 5.8, z), new THREE.Vector3(Math.sign(x) * 9, rnd(3.4, 4.6), z + rnd(-7, 7)), rnd(0.3, 0.9)); });
wire(new THREE.Vector3(-7.8, 5.8, -12), new THREE.Vector3(-7.8, 5.4, 5.4), 0.8);

// banderitas (fiesta buntings) + tarpaulin
const flagCols = [0xd23b2c, 0xe8c43a, 0x2f6fc0, 0xf0ece0, 0x3fa35a];
const flagGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.15, 0, 0), new THREE.Vector3(0.15, 0, 0), new THREE.Vector3(0, -0.36, 0)]);
flagGeo.computeVertexNormals();
const flagMats = flagCols.map(c => mat({ color: c, side: THREE.DoubleSide }));
const buntings = [];
[[-6, 4.6], [-20, 4.9], [-33, 4.5], [-46, 4.8]].forEach(([z, y]) => {
  wire(new THREE.Vector3(-8.9, y, z), new THREE.Vector3(8.9, y, z), 0.7);
  const flags = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, x = -8.9 + t * 17.8;
    const sagY = y - 1.4 * t * (1 - t);
    const f = new THREE.Mesh(flagGeo, flagMats[i % flagMats.length]); f.position.set(x, sagY, z); f.castShadow = true; scene.add(f); flags.push(f);
  }
  buntings.push(flags);
});
const tarp = plane(5.4, 1.0, mat({ map: signTex('MALIGAYANG PIYESTA!', 'Brgy. Maligaya · Libreng sayawan sa covered court', '#b3221b', '#f2d24a', 192, 40), side: THREE.DoubleSide }), 0, 4.2, -10.5, 0);
tarp.castShadow = true;
wire(new THREE.Vector3(-8.9, 4.9, -10.5), new THREE.Vector3(-2.7, 4.7, -10.5), 0.2);
wire(new THREE.Vector3(2.7, 4.7, -10.5), new THREE.Vector3(8.9, 4.9, -10.5), 0.2);

// laundry line (sampayan)
cyl(0.03, 0.03, 2.2, 4, metalM, -8.6, 1.1, -41.5, false);
cyl(0.03, 0.03, 2.2, 4, metalM, -8.6, 1.1, -36.6, false);
wire(new THREE.Vector3(-8.6, 2.15, -41.5), new THREE.Vector3(-8.6, 2.15, -36.6), 0.15);
const clothes = [];
[[0xb03a3a, 0.55, 0.65], [0xe9e4d6, 0.5, 0.8], [0x2f5a8a, 0.4, 0.5], [0xd6b23a, 0.6, 0.6], [0x3a7a4a, 0.45, 0.9], [0xe0dcd0, 0.3, 0.35]].forEach(([c, w, h], i) => {
  const g = new THREE.PlaneGeometry(w, h); g.translate(0, -h / 2, 0);
  const m = shade(new THREE.Mesh(g, mat({ color: c, side: THREE.DoubleSide }))); m.position.set(-8.6, 2.08, -41.0 + i * 0.75); m.rotation.y = Math.PI / 2; scene.add(m); clothes.push(m);
});

// shelter box ("kanlungan") at Lola's gate
const SHELTER = new THREE.Vector3(-3, 0, 3.8);
box(1.6, 0.9, 1.0, mat({ map: T.cardboard }), SHELTER.x, 0.45, SHELTER.z + 0.6, true);
plane(1.4, 0.36, mat({ map: signTex('KANLUNGAN', 'mga pusa dito', '#c8b48a', '#3a2412') }), SHELTER.x, 0.6, SHELTER.z + 0.09, 0);
box(0.5, 0.06, 0.3, mat({ color: 0xc9c4b6 }), SHELTER.x + 1.2, 0.03, SHELTER.z - 0.2, false);
const shelterLight = new THREE.PointLight(0xffc98a, 1.0, 5, 2); shelterLight.position.set(SHELTER.x, 1.6, SHELTER.z - 0.4); scene.add(shelterLight);
const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd79a })); lantern.position.copy(shelterLight.position); lantern.position.y += 0.1; scene.add(lantern);

// rain
const RAIN = 1600;
const rainPos = new Float32Array(RAIN * 6);
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fb3d6, transparent: true, opacity: 0.3 }));
rain.frustumCulled = false; scene.add(rain);
const drops = Array.from({ length: RAIN }, () => ({ x: rnd(-14, 14), y: rnd(0, 12), z: rnd(-14, 14), v: rnd(13, 18) }));

// moths around the lamps
const MOTHS = posts.length * 5;
const mothPos = new Float32Array(MOTHS * 3);
const mothGeo = new THREE.BufferGeometry(); mothGeo.setAttribute('position', new THREE.BufferAttribute(mothPos, 3));
const moths = new THREE.Points(mothGeo, new THREE.PointsMaterial({ color: 0xffe2b8, size: 2, sizeAttenuation: false }));
moths.frustumCulled = false; scene.add(moths);
const mothSeed = Array.from({ length: MOTHS }, () => ({ r: rnd(0.2, 0.6), s: rnd(2, 5), o: rnd(0, 6.28), h: rnd(-0.3, 0.2) }));


export { posts, storeGlow, buntings, clothes, tarp, SHELTER, wood, RAIN, rainPos, rainGeo, drops, mothPos, mothGeo, mothSeed };
