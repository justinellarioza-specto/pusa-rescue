// Things that move every frame in every mode: rain, moths, flickering lamps, wind on flags
// and laundry, rescued cats' tails, puddle ripples, lightning, thunder and the weather.
import * as THREE from 'three';
import { scene, camera, hemi, env, post, moon } from '../engine/renderer.js';
import { glowTex } from '../engine/textures.js';
import { settings } from '../core/storage.js';
import { QUALITY } from '../config.js';
import { rnd } from '../core/util.js';
import { thunder, setRainLevel } from '../audio.js';
import { WEATHER } from '../data/weather.js';
import {
  PUDDLES,
  posts,
  buntings,
  clothes,
  tarp,
  rainPos,
  rainGeo,
  drops,
  mothPos,
  mothGeo,
  mothSeed,
} from './street.js';
import { rosterMeshes } from './cats.js';

// ---------- weather ----------
let weather = WEATHER.ulan,
  weatherKey = 'ulan';
const moonDisc = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 20),
  new THREE.MeshBasicMaterial({ color: 0xf3ecd2, fog: false }),
);
const moonHalo = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xb9c4ff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    fog: false,
  }),
);
moonHalo.scale.set(26, 26, 1);
moonDisc.position.set(-28, 46, -95);
moonHalo.position.copy(moonDisc.position);
moonDisc.visible = moonHalo.visible = false;
scene.add(moonDisc, moonHalo);

export function setWeather(key) {
  weatherKey = key in WEATHER ? key : 'ulan';
  weather = WEATHER[weatherKey];
  moonDisc.visible = moonHalo.visible = weather.moon;
  moon.intensity = weather.moonLight;
  env.fogAdd = weather.fog;
  scene.fog.density = env.fogBase + env.fogAdd;
  setRainLevel(weather.rainVol);
  boltTimer = rnd(weather.bolt[0] * 0.5, weather.bolt[1]);
}
export const getWeather = () => weatherKey;

// ---------- puddle ripples ----------
const ripples = [];
const rippleGeo = new THREE.RingGeometry(0.8, 1, 16);
for (let i = 0; i < 14; i++) {
  const m = new THREE.Mesh(
    rippleGeo,
    new THREE.MeshBasicMaterial({ color: 0xaec0dc, transparent: true, opacity: 0, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.visible = false;
  scene.add(m);
  ripples.push({ m, life: 0, max: 1, size: 1 });
}
let nextRipple = 0;
export function spawnRipple(x, z, size = 0.35, max = 0.7) {
  const r = ripples[nextRipple++ % ripples.length];
  r.m.position.set(x, 0.03, z);
  r.life = max;
  r.max = max;
  r.size = size;
  r.m.visible = true;
}
function updateRipples(dt) {
  ripples.forEach((r) => {
    if (r.life <= 0) return;
    r.life -= dt;
    const k = 1 - Math.max(0, r.life) / r.max;
    r.m.scale.setScalar(0.05 + k * r.size);
    r.m.material.opacity = (1 - k) * 0.5;
    if (r.life <= 0) r.m.visible = false;
  });
}

// ---------- per frame ----------
let boltTimer = rnd(8, 16),
  boltT = 0,
  thunderIn = -1,
  rainRipple = 0;
export function atmos(dt, t) {
  const cp = camera.position,
    nRain = Math.floor(QUALITY[settings.quality].rain * weather.rain);
  rainGeo.setDrawRange(0, nRain * 2);
  for (let i = 0; i < nRain; i++) {
    const d = drops[i];
    d.y -= d.v * dt;
    if (d.y < 0) {
      d.y += 12;
      d.x = rnd(-14, 14);
      d.z = rnd(-14, 14);
    }
    const X = cp.x + d.x,
      Z = cp.z + d.z,
      j = i * 6;
    rainPos[j] = X;
    rainPos[j + 1] = d.y;
    rainPos[j + 2] = Z;
    rainPos[j + 3] = X + 0.04 * weather.wind;
    rainPos[j + 4] = d.y + 0.38;
    rainPos[j + 5] = Z + 0.02;
  }
  rainGeo.attributes.position.needsUpdate = true;

  // raindrops landing in puddles
  rainRipple -= dt * weather.rain * 9;
  if (rainRipple < 0) {
    rainRipple += 1;
    const [px, pz, sx, sz] = PUDDLES[Math.floor(Math.random() * PUDDLES.length)];
    const a = rnd(0, Math.PI * 2),
      r = Math.sqrt(Math.random()) * 0.8;
    spawnRipple(px + Math.cos(a) * sx * r, pz + Math.sin(a) * sz * r, rnd(0.12, 0.22), rnd(0.4, 0.7));
  }
  updateRipples(dt);

  posts.forEach((p, pi) => {
    for (let m = 0; m < 5; m++) {
      const s = mothSeed[pi * 5 + m],
        a = t * s.s + s.o,
        j = (pi * 5 + m) * 3;
      mothPos[j] = p.x + Math.cos(a) * s.r;
      mothPos[j + 1] = p.off ? -10 : 5.45 + s.h + Math.sin(a * 1.7) * 0.15;
      mothPos[j + 2] = p.z + Math.sin(a) * s.r;
    }
  });
  mothGeo.attributes.position.needsUpdate = true;
  posts.forEach((p, i) => {
    if (!p.flicker || p.off) return;
    const on = settings.calm || Math.sin(t * (11 + i)) + Math.sin(t * (3.7 + i * 0.4)) > -0.6;
    p.L.intensity = on ? 2.0 : 0.1;
    p.bulb.material.color.setHex(on ? 0xffc27a : 0x3a2a1a);
    p.cone.visible = on;
  });

  const w = weather.wind;
  buntings.forEach((flags, bi) =>
    flags.forEach((f, i) => {
      f.rotation.x = Math.sin(t * (2 + w) + i * 0.6 + bi) * 0.3 * w;
    }),
  );
  clothes.forEach((c, i) => {
    c.rotation.z = Math.sin(t * (1.6 + w * 0.7) + i) * 0.1 * w;
  });
  tarp.rotation.x = Math.sin(t * 1.4) * 0.04 * w;
  rosterMeshes.forEach((c, i) => {
    if (c.group.visible)
      c.tail.forEach((sg, k) => {
        sg.rotation.z = Math.sin(t * 1.6 + i + k * 0.7) * 0.22;
      });
  });

  // lightning: in "reduce flashing" mode it only brightens the sky a little
  boltTimer -= dt;
  if (boltTimer < 0) {
    boltTimer = rnd(weather.bolt[0], weather.bolt[1]);
    boltT = 0.42;
    thunderIn = rnd(0.7, 2.2);
  }
  if (boltT > 0) boltT -= dt;
  const on = boltT > 0 && (boltT > 0.3 || boltT < 0.14);
  hemi.intensity = env.hemiBase + (on ? (settings.calm ? 0.35 : 2.4) : 0);
  post.uniforms.bolt.value = on && !settings.calm ? 1 : 0;
  if (thunderIn > 0) {
    thunderIn -= dt;
    if (thunderIn <= 0) thunder();
  }
  post.uniforms.time.value = t;
}
