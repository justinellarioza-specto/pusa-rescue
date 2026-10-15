// Shortcuts for placing meshes, plus the list of solid boxes the player collides with.
import * as THREE from 'three';
import { scene } from '../engine/renderer.js';

const colliders = [];
function shade(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function box(w, h, d, m, x, y, z, solid) {
  const mesh = shade(
    new THREE.Mesh(new THREE.BoxGeometry(w, h, d, Math.ceil(w * 1.5), Math.ceil(h * 1.5), Math.ceil(d * 1.5)), m),
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);
  if (solid) colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  return mesh;
}
function plane(w, h, m, x, y, z, ry = 0, rx = 0, segW = 1, segH = 1) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h, segW, segH), m);
  p.receiveShadow = true;
  p.position.set(x, y, z);
  p.rotation.set(rx, ry, 0);
  scene.add(p);
  return p;
}
function cyl(rt, rb, h, seg, m, x, y, z, solid) {
  const c = shade(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m));
  c.position.set(x, y, z);
  scene.add(c);
  if (solid) colliders.push({ x0: x - rb, x1: x + rb, z0: z - rb, z1: z + rb });
  return c;
}

export { colliders, shade, box, plane, cyl };
