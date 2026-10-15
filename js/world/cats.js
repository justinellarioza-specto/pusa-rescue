// Low-poly cat model, the hiding cats, and the rescued cats living at the shelter.
import * as THREE from 'three';
import { scene } from '../engine/renderer.js';
import { mat } from '../engine/materials.js';
import { furTex, glowTex } from '../engine/textures.js';
import { rnd } from '../core/util.js';
import { save } from '../core/storage.js';
import { shade } from './helpers.js';
import { CAT_SPOTS } from '../data/cats.js';

const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const noseM = mat({ color: 0xc77b7b });

function makeCat(kind) {
  const gr = new THREE.Group();
  const fm = mat({ map: furTex(kind) });
  const add = (geo, x, y, z, sx = 1, sy = 1, sz = 1, m = fm) => {
    const me = shade(new THREE.Mesh(geo, m));
    me.position.set(x, y, z);
    me.scale.set(sx, sy, sz);
    gr.add(me);
    return me;
  };
  add(new THREE.SphereGeometry(0.15, 9, 6), 0, 0.21, -0.03, 0.95, 0.85, 1.55);
  add(new THREE.SphereGeometry(0.11, 8, 6), 0, 0.25, 0.15);
  const head = add(new THREE.SphereGeometry(0.105, 9, 7), 0, 0.37, 0.27, 1.12, 0.95, 1);
  add(new THREE.SphereGeometry(0.045, 6, 4), 0, 0.335, 0.365, 1.35, 0.8, 0.8);
  add(new THREE.BoxGeometry(0.025, 0.018, 0.02), 0, 0.352, 0.4, 1, 1, 1, noseM);
  const ear = new THREE.ConeGeometry(0.048, 0.11, 3);
  [-1, 1].forEach((s) => {
    const e = add(ear, s * 0.065, 0.47, 0.26);
    e.rotation.z = -s * 0.28;
  });
  const leg = new THREE.CylinderGeometry(0.03, 0.025, 0.18, 5);
  [
    [-0.07, 0.15],
    [0.07, 0.15],
    [-0.07, -0.17],
    [0.07, -0.17],
  ].forEach(([x, z]) => add(leg, x, 0.09, z));
  const tail = [];
  let parent = new THREE.Group();
  parent.position.set(0, 0.25, -0.26);
  parent.rotation.x = -0.9;
  gr.add(parent);
  const seg = new THREE.CylinderGeometry(0.022, 0.026, 0.09, 5);
  seg.translate(0, 0.045, 0);
  for (let i = 0; i < 5; i++) {
    const s = shade(new THREE.Mesh(seg, fm));
    if (i > 0) {
      s.position.y = 0.085;
      s.rotation.x = 0.22;
    }
    parent.add(s);
    tail.push(s);
    parent = s;
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe8e07a });
  const eyes = [];
  [-0.045, 0.045].forEach((x) => {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.03), eyeMat);
    e.position.set(x, 0.385, 0.367);
    gr.add(e);
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xf0e48a,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.2,
      }),
    );
    s.scale.set(0.16, 0.16, 1);
    s.position.set(x, 0.385, 0.39);
    gr.add(s);
    eyes.push(s);
  });
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.9), hitMat);
  hit.position.y = 0.3;
  gr.add(hit);
  return { group: gr, eyes, tail, hit, head };
}

const cats = CAT_SPOTS.map((s, i) => {
  const c = makeCat(s.kind);
  scene.add(c.group);
  c.hit.userData.cat = i;
  return Object.assign(c, { spot: s, state: 'off', path: [], blink: rnd(2, 6), slot: -1 });
});
const hitboxes = cats.map((c) => c.hit);

const rosterMeshes = [];
function refreshRoster(show) {
  const n = show ? Math.min(save.cats.length, 24) : 0;
  for (let i = 0; i < Math.max(n, rosterMeshes.length); i++) {
    if (i >= n) {
      if (rosterMeshes[i]) rosterMeshes[i].group.visible = false;
      continue;
    }
    const want = save.cats[i].kind;
    if (!rosterMeshes[i] || rosterMeshes[i].kind !== want) {
      if (rosterMeshes[i]) scene.remove(rosterMeshes[i].group);
      const c = makeCat(want);
      c.kind = want;
      c.hit.visible = false;
      scene.add(c.group);
      rosterMeshes[i] = c;
    }
    const c = rosterMeshes[i];
    c.group.visible = true;
    c.group.position.set(-6.3 + (i % 8) * 0.62 + (Math.floor(i / 8) % 2) * 0.3, 0.02, 2.5 - Math.floor(i / 8) * 0.6);
    c.group.rotation.y = Math.PI + Math.sin(i * 7.3) * 0.9;
  }
}

export { makeCat, cats, hitboxes, rosterMeshes, refreshRoster };
