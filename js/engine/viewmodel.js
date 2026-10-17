// First-person view: your sleeve, hand and flashlight in the bottom-right corner.
// It bobs while you walk and trails a little behind when you turn, like the flashlight beam.
import * as THREE from 'three';
import { camera, flash } from './renderer.js';
import { mat } from './materials.js';

const hoodieM = mat({ color: 0x2c3240, fog: false });
const cuffM = mat({ color: 0x232733, fog: false });
const skinM = mat({ color: 0x9c6a48, fog: false });
const bodyM = mat({ color: 0x1b1c20, specular: 0x555555, shininess: 40, fog: false });
const rimM = mat({ color: 0x8c8f96, specular: 0xaaaaaa, shininess: 70, fog: false });
const lensM = new THREE.MeshBasicMaterial({ color: 0xfff2cf, fog: false });

const rig = new THREE.Group(); // follows the camera
const arm = new THREE.Group(); // bobs and sways
rig.add(arm);
camera.add(rig);

function part(geo, m, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  arm.add(mesh);
  return mesh;
}
// a fist wrapped around the middle of the torch, with the sleeve running off the bottom-right corner
const ball = new THREE.SphereGeometry(1, 10, 8);
const sleeve = part(
  new THREE.CylinderGeometry(0.044, 0.056, 0.42, 8),
  hoodieM,
  0.052,
  -0.07,
  0.15,
  Math.PI / 2 - 0.42,
  0,
  0.35,
);
sleeve.scale.set(1, 1, 0.9);
part(new THREE.CylinderGeometry(0.041, 0.043, 0.03, 8), cuffM, 0.025, -0.03, -0.012, Math.PI / 2 - 0.42, 0, 0.35);
part(ball, skinM, 0.008, 0.002, -0.058).scale.set(0.034, 0.031, 0.048); // fist
for (let i = 0; i < 4; i++) part(ball, skinM, 0.02, 0.024, -0.03 - i * 0.019).scale.setScalar(0.0125); // knuckles
part(new THREE.CylinderGeometry(0.0095, 0.0085, 0.05, 6), skinM, -0.017, 0.02, -0.07, Math.PI / 2 - 0.1, 0, 0.25); // thumb
// flashlight: body, grip rings, flared head, bezel and lens
part(new THREE.CylinderGeometry(0.017, 0.017, 0.19, 10), bodyM, 0, 0.004, -0.1, Math.PI / 2, 0, 0);
[0.0, 0.016].forEach((dz) =>
  part(new THREE.CylinderGeometry(0.018, 0.018, 0.005, 10), rimM, 0, 0.004, -0.15 - dz, Math.PI / 2, 0, 0),
);
part(new THREE.CylinderGeometry(0.029, 0.018, 0.05, 10), rimM, 0, 0.004, -0.215, Math.PI / 2, 0, 0);
part(new THREE.CylinderGeometry(0.0295, 0.0295, 0.01, 10), bodyM, 0, 0.004, -0.244, Math.PI / 2, 0, 0);
const lens = part(new THREE.CircleGeometry(0.025, 12), lensM, 0, 0.004, -0.25);
lens.rotation.y = Math.PI;

const BASE = new THREE.Vector3(0.19, -0.19, -0.38);
rig.position.copy(BASE);
rig.rotation.set(0.14, 0.24, -0.08);
rig.visible = false;
// the beam now starts at the lens instead of behind the hand
flash.position.set(BASE.x - 0.05, BASE.y + 0.03, BASE.z - 0.25);
rig.traverse((o) => {
  o.renderOrder = 10;
  o.frustumCulled = false;
});

let bobT = 0,
  swayX = 0,
  swayY = 0;
// moving: 0..1 walking amount · turn: how far the view has turned this frame (yaw, pitch)
export function updateViewmodel(dt, moving, turnYaw, turnPitch, power) {
  bobT += dt * (5 + moving * 6) * (moving > 0.05 ? 1 : 0.25);
  const amp = moving > 0.05 ? 0.012 * moving : 0.003;
  swayX += (Math.max(-0.08, Math.min(0.08, turnYaw * 0.6)) - swayX) * Math.min(1, dt * 8);
  swayY += (Math.max(-0.06, Math.min(0.06, turnPitch * 0.6)) - swayY) * Math.min(1, dt * 8);
  arm.position.set(Math.cos(bobT) * amp - swayX * 0.6, -Math.abs(Math.sin(bobT)) * amp * 1.4 + swayY * 0.4, 0);
  arm.rotation.set(swayY, swayX, Math.cos(bobT) * amp * 2);
  lensM.color.setScalar(0.25 + 0.75 * Math.min(1, power));
}
export function showViewmodel(on) {
  rig.visible = on;
}
