// Kanlungan upgrades that appear around Lola's box: bowls, roof, walls, string lights.
import * as THREE from 'three';
import { scene } from '../engine/renderer.js';
import { mat } from '../engine/materials.js';
import { T } from '../engine/textures.js';
import { save } from '../core/storage.js';
import { box, plane, cyl } from './helpers.js';
import { SHELTER, wood } from './street.js';

const deco = { bowls: [], roof: [], walls: [], lights: [] };
const steelM = mat({ color: 0xa9adb3, specular: 0x666666, shininess: 50 });
for (let i = 0; i < 3; i++) { const b = cyl(0.13, 0.1, 0.07, 10, steelM, SHELTER.x - 0.6 + i * 0.6, 0.035, SHELTER.z - 0.25, false); b.visible = false; deco.bowls.push(b); }
const tarpM = mat({ color: 0x2b5fa8, side: THREE.DoubleSide, specular: 0x222222, shininess: 20 });
[[-1.2, 0.0], [1.2, 0.0], [-1.2, 1.3], [1.2, 1.3]].forEach(([dx, dz]) => { const p = cyl(0.04, 0.04, 1.9, 5, wood, SHELTER.x + dx, 0.95, SHELTER.z - 0.6 + dz, false); p.visible = false; deco.roof.push(p); });
const roofTarp = plane(2.7, 1.7, tarpM, SHELTER.x, 1.9, SHELTER.z + 0.05, 0, -Math.PI / 2 + 0.12); roofTarp.castShadow = true; roofTarp.visible = false; deco.roof.push(roofTarp);
const plankM = mat({ map: T.door });
[[-1.3, 0, 0.06, 1.5, 1.4], [1.3, 0, 0.06, 1.5, 1.4], [0, 0.65, 2.6, 1.0, 0.06]].forEach(([dx, dz, w, h, d]) => { const m = box(w, h, d, plankM, SHELTER.x + dx, h / 2, SHELTER.z + 0.05 + dz, false); m.visible = false; deco.walls.push(m); });
const bulbM = new THREE.MeshBasicMaterial({ color: 0xffd27a });
for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 3), bulbM); b.position.set(SHELTER.x - 1.25 + i * 0.31, 1.86 - Math.sin(i / 8 * Math.PI) * 0.12, SHELTER.z - 0.7); b.visible = false; scene.add(b); deco.lights.push(b); }
const decoLight = new THREE.PointLight(0xffc070, 0, 6, 2); decoLight.position.set(SHELTER.x, 1.5, SHELTER.z - 0.8); scene.add(decoLight);
function applyShelterLook(on) {
  const u = on ? save.up : { bowls: 0, home: 0 };
  deco.bowls.forEach((b, i) => { b.visible = i < u.bowls; });
  deco.roof.forEach(m => { m.visible = u.home >= 1; });
  deco.walls.forEach(m => { m.visible = u.home >= 2; });
  deco.lights.forEach(m => { m.visible = u.home >= 3; });
  decoLight.intensity = u.home >= 3 ? 1.2 : 0;
}


export { applyShelterLook };
