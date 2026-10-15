// LAGIM mode props: the stalker figure and the flashlight batteries.
import * as THREE from 'three';
import { scene } from '../engine/renderer.js';
import { mat } from '../engine/materials.js';
import { glowTex } from '../engine/textures.js';
import { shade, box } from './helpers.js';

// the stalker for LAGIM mode
const figM = mat({ color: 0x08080a });
const figure = new THREE.Group();
(() => {
  const add = (geo, x, y, z, rz = 0) => {
    const m = shade(new THREE.Mesh(geo, figM));
    m.position.set(x, y, z);
    m.rotation.z = rz;
    figure.add(m);
    return m;
  };
  add(new THREE.CylinderGeometry(0.14, 0.26, 1.9, 6), 0, 0.95, 0);
  const head = add(new THREE.SphereGeometry(0.16, 7, 5), 0, 2.06, 0.02);
  head.scale.y = 1.3;
  add(new THREE.CylinderGeometry(0.035, 0.025, 1.35, 4), -0.25, 1.18, 0.02, 0.07);
  add(new THREE.CylinderGeometry(0.035, 0.025, 1.35, 4), 0.25, 1.18, 0.02, -0.07);
  [-0.06, 0.06].forEach((x) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xff3020,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
        fog: false,
      }),
    );
    s.scale.set(0.09, 0.09, 1);
    s.position.set(x, 2.1, 0.15);
    figure.add(s);
  });
})();
figure.visible = false;
scene.add(figure);

// batteries for LAGIM mode
const batM = mat({ color: 0x3f8a3a, emissive: 0x16320f });
const batSpots = [
  [-6.4, -9],
  [6.4, -30.5],
  [-1.2, -47],
  [2.6, -15.5],
  [-6.2, -36.4],
  [6.3, -53],
];
const batteries = batSpots.map(([x, z]) => {
  const b = box(0.1, 0.24, 0.1, batM, x, 0.12, z, false);
  b.visible = false;
  b.userData.bat = true;
  return b;
});

export { figure, batteries };
