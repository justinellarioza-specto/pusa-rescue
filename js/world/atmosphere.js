// Things that move every frame in every mode: rain, moths, flickering lamps,
// wind on flags and laundry, rescued cats' tails, lightning and thunder.
import { camera, hemi, env, post } from '../engine/renderer.js';
import { settings } from '../core/storage.js';
import { QUALITY } from '../config.js';
import { rnd } from '../core/util.js';
import { thunder } from '../audio.js';
import { posts, buntings, clothes, tarp, rainPos, rainGeo, drops, mothPos, mothGeo, mothSeed } from './street.js';
import { rosterMeshes } from './cats.js';

let boltTimer = rnd(8, 16), boltT = 0, thunderIn = -1;
export function atmos(dt, t) {
  const cp = camera.position, nRain = QUALITY[settings.quality].rain;
  for (let i = 0; i < nRain; i++) {
    const d = drops[i];
    d.y -= d.v * dt;
    if (d.y < 0) { d.y += 12; d.x = rnd(-14, 14); d.z = rnd(-14, 14); }
    const X = cp.x + d.x, Z = cp.z + d.z, j = i * 6;
    rainPos[j] = X; rainPos[j + 1] = d.y; rainPos[j + 2] = Z;
    rainPos[j + 3] = X + 0.04; rainPos[j + 4] = d.y + 0.38; rainPos[j + 5] = Z + 0.02;
  }
  rainGeo.attributes.position.needsUpdate = true;
  posts.forEach((p, pi) => {
    for (let m = 0; m < 5; m++) {
      const s = mothSeed[pi * 5 + m], a = t * s.s + s.o, j = (pi * 5 + m) * 3;
      mothPos[j] = p.x + Math.cos(a) * s.r; mothPos[j + 1] = p.off ? -10 : 5.45 + s.h + Math.sin(a * 1.7) * 0.15; mothPos[j + 2] = p.z + Math.sin(a) * s.r;
    }
  });
  mothGeo.attributes.position.needsUpdate = true;
  posts.forEach((p, i) => {
    if (!p.flicker || p.off) return;
    const on = Math.sin(t * (11 + i)) + Math.sin(t * (3.7 + i * 0.4)) > -0.6;
    p.L.intensity = on ? 2.0 : 0.1; p.bulb.material.color.setHex(on ? 0xffc27a : 0x3a2a1a); p.cone.visible = on;
  });
  buntings.forEach((flags, bi) => flags.forEach((f, i) => { f.rotation.x = Math.sin(t * 3 + i * 0.6 + bi) * 0.35; }));
  clothes.forEach((c, i) => { c.rotation.z = Math.sin(t * 2.3 + i) * 0.12; });
  tarp.rotation.x = Math.sin(t * 1.4) * 0.05;
  rosterMeshes.forEach((c, i) => { if (c.group.visible) c.tail.forEach((sg, k) => { sg.rotation.z = Math.sin(t * 1.6 + i + k * 0.7) * 0.22; }); });

  boltTimer -= dt;
  if (boltTimer < 0) { boltTimer = rnd(14, 28); boltT = 0.42; thunderIn = rnd(0.7, 2.2); }
  if (boltT > 0) boltT -= dt;
  const on = boltT > 0 && (boltT > 0.3 || boltT < 0.14);
  hemi.intensity = env.hemiBase + (on ? 2.4 : 0);
  post.uniforms.bolt.value = on ? 1 : 0;
  if (thunderIn > 0) { thunderIn -= dt; if (thunderIn <= 0) thunder(); }
  post.uniforms.time.value = t;
}
