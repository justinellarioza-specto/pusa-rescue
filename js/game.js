// Game rules in motion: the three modes, one round of play, the LAGIM stalker AI,
// round results, the Kanlungan night cycle and photo mode.
import * as THREE from 'three';
import { scene, camera, flash, flashTarget, env, post } from './engine/renderer.js';
import { settings, save, best, writeSave, writeBest } from './core/storage.js';
import { REACH, WALK, RUN } from './config.js';
import { rnd, pick } from './core/util.js';
import {
  roundSetup,
  catReward,
  nightBonus,
  pickName,
  formatTime,
  clockLabel,
  rollWeather,
  inPuddle,
} from './core/rules.js';
import { CAT_NAMES } from './data/cats.js';
import { TXT } from './data/text.js';
import { audioOn, meow, chirp, chime, thud, heartbeat, rainSound, scream, footstep, splash } from './audio.js';
import { $, isTouch, nav, show, say, clearSubs, toast } from './ui/screens.js';
import { renderShop, closeCard } from './ui/shop.js';
import { player, lag, keys, stick, pad, lockPointer, unlockPointer, releaseKeys } from './input.js';
import { colliders } from './world/helpers.js';
import { PUDDLES, posts, storeGlow, SHELTER } from './world/street.js';
import { cats, hitboxes, refreshRoster } from './world/cats.js';
import { applyShelterLook } from './world/shelter.js';
import { figure, batteries } from './world/lagim.js';
import { setWeather, spawnRipple } from './world/atmosphere.js';

const touchUI = $('touch'),
  promptEl = $('prompt');
let state = 'menu',
  mode = 'classic';
let timeLeft = 300,
  timeLimit = 300,
  found = 0,
  saved = 0,
  total = 8;
let hintTimer = 6,
  chirpTimer = 1,
  aimed = -1,
  aimedBat = -1,
  stepDist = 0;
let speedMul = 1,
  hintEvery = 9,
  flashBase = 3.0,
  stalkerMul = 1,
  battery = 100,
  nightCoins = 0;

export const getState = () => state;
export const getMode = () => mode;

// ---------- look of the street per mode ----------
const posts0 = posts.map((p) => p.flicker);
function setLook(m) {
  const horror = m === 'horror';
  env.fogBase = horror ? 0.085 : 0.05;
  scene.fog.density = env.fogBase + env.fogAdd;
  env.hemiBase = horror ? 0.32 : 0.7;
  posts.forEach((p, i) => {
    p.off = horror && (i === 0 || i === 3);
    p.flicker = horror ? i !== 0 && i !== 3 : posts0[i];
    p.L.intensity = p.off ? 0 : 2.0;
    p.cone.visible = !p.off;
    p.bulb.material.color.setHex(p.off ? 0x2a2018 : 0xffc27a);
  });
  storeGlow.intensity = horror ? 0.25 : 1.1;
  post.uniforms.fear.value = horror ? 0.15 : 0;
}

const ent = { active: false, x: 0, z: -55, spawnIn: 30, litTime: 0, beat: 0 };
function placeCats(list) {
  cats.forEach((c) => {
    c.state = 'off';
    c.group.visible = false;
    c.path = [];
  });
  list.forEach((i) => {
    const c = cats[i];
    c.group.position.set(...c.spot.p);
    c.group.rotation.y = c.spot.face;
    c.state = 'hidden';
    c.slot = -1;
    c.group.visible = true;
  });
}
function chooseSpots(n) {
  const idx = cats.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n);
}

// ---------- round flow ----------
function startGame(m) {
  mode = m;
  audioOn();
  rainSound();
  const build = m === 'build';
  const r = roundSetup(m, save, settings.diff);
  total = r.total;
  timeLimit = r.timeLimit;
  hintEvery = r.hintEvery;
  speedMul = r.speedMul;
  stalkerMul = r.stalkerMul;
  flash.angle = r.flashAngle;
  flash.distance = r.flashDistance;
  flashBase = r.flashBase;
  const weather = rollWeather(m);
  setLook(m);
  setWeather(weather);
  applyShelterLook(build);
  refreshRoster(build);
  placeCats(m === 'classic' ? [0, 1, 2, 3, 4, 5, 6, 7] : chooseSpots(total));
  battery = 100;
  batteries.forEach((b) => {
    b.visible = m === 'horror';
  });
  ent.active = false;
  ent.spawnIn = rnd(25, 35);
  ent.litTime = 0;
  figure.visible = false;
  player.x = 0;
  player.z = 1.5;
  player.yaw = 0;
  player.pitch = 0;
  lag.yaw = 0;
  lag.pitch = 0;
  timeLeft = timeLimit;
  found = 0;
  saved = 0;
  nightCoins = 0;
  hintTimer = 9;
  stepDist = 0;
  clearSubs();
  $('count').innerHTML = TXT.count(0, total);
  $('coinsHud').hidden = !build;
  $('coinsHud').innerHTML = TXT.coins(save.coins);
  $('battery').hidden = m !== 'horror';
  state = 'play';
  show(null);
  closeCard();
  $('hud').hidden = false;
  touchUI.hidden = !isTouch;
  toast(TXT.weather[weather]);
  say(build ? TXT.intro.build(save.night, total) : TXT.intro[m]);
  lockPointer();
}

function pauseGame() {
  if (state !== 'play') return;
  state = 'paused';
  releaseKeys();
  unlockPointer();
  touchUI.hidden = true;
  nav.backTo = 'pause';
  show('pause');
}
function resumeGame() {
  if (state !== 'paused') return;
  state = 'play';
  show(null);
  touchUI.hidden = !isTouch;
  lockPointer();
}
function toMenu() {
  state = 'menu';
  $('hud').hidden = true;
  touchUI.hidden = true;
  figure.visible = false;
  $('photoBar').hidden = true;
  unlockPointer();
  setLook('classic');
  setWeather('ulan');
  applyShelterLook(false);
  refreshRoster(false);
  placeCats([0, 1, 2, 3, 4, 5, 6, 7]);
  nav.backTo = 'menu';
  show('menu');
}

// ---------- picking things up ----------
const ray = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
function grab() {
  if (state !== 'play') return;
  if (aimedBat >= 0) {
    batteries[aimedBat].visible = false;
    battery = Math.min(100, battery + 60);
    chime();
    toast(TXT.battery);
    aimedBat = -1;
    return;
  }
  if (aimed < 0) return;
  const c = cats[aimed];
  c.state = 'run';
  found++;
  c.slot = found - 1;
  c.path = [
    new THREE.Vector3(0, 0, c.group.position.z),
    new THREE.Vector3(SHELTER.x + (c.slot % 4) * 0.42 - 0.63, 0, SHELTER.z - 0.3 - Math.floor(c.slot / 4) * 0.45),
  ];
  c.group.position.y = 0;
  meow(0.35, 0, rnd(1.0, 1.2));
  $('count').innerHTML = TXT.count(found, total);
  if (mode === 'build') {
    const name = pickName(
        save.cats.map((k) => k.name),
        CAT_NAMES,
      ),
      coins = catReward(save);
    save.cats.push({ name, kind: c.spot.kind, night: save.night, where: c.spot.where });
    save.coins += coins;
    nightCoins += coins;
    writeSave();
    $('coinsHud').innerHTML = TXT.coins(save.coins);
    toast(TXT.reward(coins, name));
    say([TXT.named(name)]);
  } else {
    say([found === total ? TXT.lastOne : pick(TXT.grabbed)]);
  }
}

function collide(nx, nz) {
  const r = 0.3;
  if (nx < -8.6 || nx > 8.6 || nz < -57.9 || nz > 5.1) return true;
  return colliders.some((c) => nx > c.x0 - r && nx < c.x1 + r && nz > c.z0 - r && nz < c.z1 + r);
}

// ---------- one frame of play ----------
const fwd = new THREE.Vector3(),
  tmp = new THREE.Vector3();
function update(dt, t) {
  timeLeft -= dt;
  $('clock').textContent = clockLabel(timeLeft, timeLimit);
  if (timeLeft <= 0) return endRound('time');

  let mx = 0,
    mz = 0;
  if (keys.KeyW || keys.ArrowUp) mz -= 1;
  if (keys.KeyS || keys.ArrowDown) mz += 1;
  if (keys.KeyA || keys.ArrowLeft) mx -= 1;
  if (keys.KeyD || keys.ArrowRight) mx += 1;
  mx += stick.x + pad.x;
  mz += stick.y + pad.y;
  const len = Math.hypot(mx, mz);
  if (len > 0.05) {
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const running = keys.ShiftLeft || keys.ShiftRight || pad.run || Math.hypot(stick.x, stick.y) > 0.95;
    const sp = (running ? RUN : WALK) * speedMul * Math.min(1, len);
    const s = Math.sin(player.yaw),
      co = Math.cos(player.yaw);
    const dx = (mx * co + mz * s) * sp * dt,
      dz = (-mx * s + mz * co) * sp * dt;
    const ox = player.x,
      oz = player.z;
    if (!collide(player.x + dx, player.z)) player.x += dx;
    if (!collide(player.x, player.z + dz)) player.z += dz;
    player.bob += dt * sp * 2.6;
    stepDist += Math.hypot(player.x - ox, player.z - oz);
    if (stepDist > (running ? 0.85 : 0.65)) {
      stepDist = 0;
      if (inPuddle(player.x, player.z, PUDDLES)) {
        splash(running ? 0.12 : 0.08);
        spawnRipple(player.x, player.z, 0.6, 0.9);
      } else footstep(running ? 0.07 : 0.045);
    }
  }
  camera.position.set(player.x, 1.58 + Math.sin(player.bob) * 0.035, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');

  const k = Math.min(1, dt * 10);
  lag.yaw += (player.yaw - lag.yaw) * k;
  lag.pitch += (player.pitch - lag.pitch) * k;
  flashTarget.position.set(
    Math.max(-1.5, Math.min(1.5, (player.yaw - lag.yaw) * 5)),
    -0.2 - Math.max(-1.5, Math.min(1.5, (player.pitch - lag.pitch) * 5)),
    -5,
  );

  // flashlight power (the battery only drains in LAGIM)
  let power = 1;
  if (mode === 'horror') {
    battery = Math.max(0, battery - dt * 0.6);
    $('battery').style.setProperty('--lvl', `${Math.round(battery)}%`);
    $('battery').style.setProperty('--bat', battery < 25 ? 'var(--blood)' : 'var(--ok)');
    power = battery <= 0 ? 0.12 : battery < 20 ? (Math.random() < 0.15 ? 0.15 : 0.7) : 1;
  }
  flash.intensity = (Math.random() < 0.012 && !settings.calm ? 0.25 : 1) * flashBase * power;
  camera.getWorldDirection(fwd);

  // aim at a cat or a battery
  ray.setFromCamera(center, camera);
  aimed = -1;
  aimedBat = -1;
  const hits = ray.intersectObjects(hitboxes, false);
  for (const h of hits) {
    const c = cats[h.object.userData.cat];
    if (c.state === 'hidden' && h.distance < REACH) {
      aimed = h.object.userData.cat;
      break;
    }
  }
  if (mode === 'horror' && aimed < 0) {
    batteries.forEach((b, i) => {
      if (!b.visible) return;
      tmp.copy(b.position).sub(camera.position);
      const d = tmp.length();
      if (d < REACH && fwd.dot(tmp.normalize()) > 0.93) aimedBat = i;
    });
  }
  promptEl.hidden = aimed < 0 && aimedBat < 0;
  promptEl.textContent = aimedBat >= 0 ? TXT.promptBattery(isTouch) : TXT.promptCat(isTouch);

  // cats: eyeshine, blinking, running home
  const coneCos = Math.cos(flash.angle);
  cats.forEach((c) => {
    if (c.state === 'off') return;
    const pos = c.group.position;
    c.tail.forEach((sg, i) => {
      sg.rotation.z = Math.sin(t * 2.2 + pos.x + i * 0.7) * 0.22;
    });
    c.blink -= dt;
    const blinking = c.blink < 0.12;
    if (c.blink < 0) c.blink = rnd(2.5, 6);
    tmp.set(pos.x, pos.y + 0.35, pos.z).sub(camera.position);
    const d = tmp.length();
    tmp.normalize();
    const lit = fwd.dot(tmp) > coneCos && d < flash.distance * 0.8 && power > 0.3;
    const op = blinking || c.state === 'saved' ? 0 : lit ? 0.95 : 0.12;
    c.eyes.forEach((e) => {
      e.material.opacity += (op - e.material.opacity) * 0.3;
    });
    if (c.state === 'run') {
      const target = c.path[0];
      const dir = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
      const dist = dir.length();
      if (dist < 0.15) {
        c.path.shift();
        if (!c.path.length) {
          c.state = 'saved';
          saved++;
          c.group.rotation.y = 0;
        }
      } else {
        dir.normalize();
        pos.addScaledVector(dir, Math.min(dist, 5 * dt));
        pos.y = Math.abs(Math.sin(t * 18)) * 0.06;
        c.group.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  });
  if (saved === total) return endRound('won');

  if (mode === 'horror') stalker(dt, power);

  // ambience and meow hints
  hintTimer -= dt;
  chirpTimer -= dt;
  if (chirpTimer < 0) {
    chirp();
    chirpTimer = rnd(0.4, 1.6);
  }
  if (hintTimer < 0) {
    hintTimer = rnd(hintEvery - 2, hintEvery + 2);
    const hidden = cats.filter((c) => c.state === 'hidden');
    if (hidden.length) {
      hidden.sort(
        (a, b) => a.group.position.distanceTo(camera.position) - b.group.position.distanceTo(camera.position),
      );
      const c = hidden[0],
        d = c.group.position.distanceTo(camera.position);
      const rel = c.group.position.clone().sub(camera.position).normalize();
      const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      meow(Math.max(0.03, 0.45 * (1 - d / 30)), Math.max(-1, Math.min(1, rel.dot(right))), rnd(0.9, 1.15));
      if (d < 6 && Math.random() < 0.6) say([TXT.nearMeow]);
      else if (Math.random() < 0.2) say([TXT.hint(c.spot.where)]);
    }
    if (Math.random() < (mode === 'horror' ? 0.2 : 0.08)) {
      thud();
      say([TXT.noise]);
    }
  }
}

// ---------- LAGIM: the stalker moves only when your light is not on it ----------
function spawnStalker(near) {
  const back = new THREE.Vector3(-fwd.x, 0, -fwd.z).normalize();
  const dist = near ? rnd(12, 16) : rnd(18, 24);
  let x = player.x + back.x * dist + rnd(-3, 3),
    z = player.z + back.z * dist;
  if (z < -57 || z > 4.5) z = player.z + (player.z > -27 ? -dist : dist);
  ent.x = Math.max(-6.5, Math.min(6.5, x));
  ent.z = Math.max(-57, Math.min(4.5, z));
  ent.active = true;
  ent.litTime = 0;
  figure.visible = true;
}
function stalker(dt, power) {
  if (!ent.active) {
    ent.spawnIn -= dt;
    if (ent.spawnIn <= 0) {
      spawnStalker(false);
      say([TXT.stalkerAppears]);
    }
    post.uniforms.fear.value = 0.15;
    return;
  }
  const dx = player.x - ent.x,
    dz = player.z - ent.z,
    d = Math.hypot(dx, dz);
  tmp.set(ent.x - camera.position.x, 1.7 - camera.position.y, ent.z - camera.position.z);
  const dd = tmp.length();
  tmp.normalize();
  const lit = power > 0.3 && fwd.dot(tmp) > Math.cos(flash.angle * 0.95) && dd < flash.distance * 0.75;
  if (!lit) {
    const progress = 1 - timeLeft / timeLimit;
    const sp = (1.1 + progress * 1.8 + (battery <= 0 ? 0.8 : 0)) * stalkerMul;
    ent.x += (dx / d) * sp * dt;
    ent.z += (dz / d) * sp * dt;
    ent.litTime = 0;
  } else {
    ent.litTime += dt;
    if (ent.litTime > 2.2 && d < 9) {
      figure.visible = false;
      ent.active = false;
      ent.spawnIn = rnd(6, 12);
      thud();
      say([TXT.stalkerGone]);
      return;
    }
  }
  figure.position.set(ent.x, 0, ent.z);
  figure.rotation.y = Math.atan2(dx, dz);
  if (d > 34) spawnStalker(true);
  const fear = Math.max(0, Math.min(1, 1 - d / 14));
  post.uniforms.fear.value = 0.15 + fear * (settings.calm ? 0.35 : 0.85);
  ent.beat -= dt;
  if (fear > 0 && ent.beat <= 0) {
    heartbeat(0.15 + fear * 0.35);
    ent.beat = 1.3 - fear * 0.85;
  }
  if (d < 0.9) caught();
}
function caught() {
  state = 'scare';
  $('hud').hidden = true;
  touchUI.hidden = true;
  unlockPointer();
  $('scare').hidden = false;
  scream();
  setTimeout(() => {
    $('scare').hidden = true;
    figure.visible = false;
    showResult(TXT.result.caughtTitle, TXT.result.caught(saved, total));
  }, 1600);
}

// ---------- end of a round ----------
function endRound(how) {
  unlockPointer();
  $('hud').hidden = true;
  touchUI.hidden = true;
  promptEl.hidden = true;
  clearSubs();
  figure.visible = false;
  post.uniforms.fear.value = 0;
  if (mode === 'build') {
    let bonus = 0;
    if (how === 'won') {
      bonus = nightBonus(save.night);
      save.coins += bonus;
      nightCoins += bonus;
    }
    const n = save.night;
    save.night++;
    writeSave();
    openShelter(
      how === 'won' ? TXT.night.won(n, total, nightCoins, bonus) : TXT.night.partial(n, found, total, nightCoins),
    );
    return;
  }
  if (how === 'won') {
    const secs = Math.floor(timeLimit - timeLeft);
    if (mode === 'classic' && (!best.classic || secs < best.classic)) {
      best.classic = secs;
      writeBest();
    }
    showResult(
      TXT.result.wonTitle,
      mode === 'horror' ? TXT.result.wonHorror(total) : TXT.result.wonClassic(total, formatTime(secs)),
    );
  } else {
    showResult(TXT.result.timeTitle, TXT.result.time(saved, total));
    meow(0.12, 0, 0.8);
  }
}
function showResult(title, text) {
  state = 'result';
  $('rTitle').textContent = title;
  $('rText').textContent = text;
  show('result');
}

function openShelter(summary) {
  state = 'shelter';
  mode = 'build';
  setLook('build');
  applyShelterLook(true);
  refreshRoster(true);
  cats.forEach((c) => {
    c.state = 'off';
    c.group.visible = false;
  });
  $('shTitle').textContent = TXT.night.title(save.night);
  $('shSum').textContent = summary;
  $('shNext').textContent = TXT.night.start(save.night);
  closeCard();
  renderShop();
  show('shelter');
}

// ---------- photo mode: fly the camera freely and save a picture ----------
const cam = { x: 0, y: 1.6, z: 0 },
  saved0 = { yaw: 0, pitch: 0 };
let shotRequested = false;
function enterPhoto() {
  if (state !== 'paused') return;
  state = 'photo';
  show(null);
  $('hud').hidden = true;
  $('photoBar').hidden = false;
  touchUI.hidden = !isTouch;
  $('grab').hidden = true;
  $('pauseBtn').hidden = true;
  cam.x = camera.position.x;
  cam.y = camera.position.y;
  cam.z = camera.position.z;
  saved0.yaw = player.yaw;
  saved0.pitch = player.pitch;
  clearSubs();
}
function exitPhoto() {
  if (state !== 'photo') return;
  unlockPointer();
  releaseKeys();
  player.yaw = saved0.yaw;
  player.pitch = saved0.pitch;
  camera.position.set(player.x, 1.58, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  $('photoBar').hidden = true;
  $('hud').hidden = false;
  $('grab').hidden = false;
  $('pauseBtn').hidden = false;
  touchUI.hidden = true;
  state = 'paused';
  nav.backTo = 'pause';
  show('pause');
}
function updatePhoto(dt) {
  let mx = stick.x + pad.x,
    mz = stick.y + pad.y,
    my = pad.up;
  if (keys.KeyW || keys.ArrowUp) mz -= 1;
  if (keys.KeyS || keys.ArrowDown) mz += 1;
  if (keys.KeyA || keys.ArrowLeft) mx -= 1;
  if (keys.KeyD || keys.ArrowRight) mx += 1;
  if (keys.KeyR) my += 1;
  if (keys.KeyF) my -= 1;
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6 : 2.5) * dt;
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  camera.getWorldDirection(fwd);
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  cam.x += (fwd.x * -mz + right.x * mx) * sp;
  cam.z += (fwd.z * -mz + right.z * mx) * sp;
  cam.y += (fwd.y * -mz + my) * sp;
  cam.x = Math.max(-8.8, Math.min(8.8, cam.x));
  cam.z = Math.max(-58, Math.min(5.3, cam.z));
  cam.y = Math.max(0.15, Math.min(8, cam.y));
  camera.position.set(cam.x, cam.y, cam.z);
}
// Keys while not playing: Enter / K takes a picture, Esc / P leaves photo mode.
function photoKey(code) {
  if (state !== 'photo') return false;
  if (code === 'Enter' || code === 'KeyK') {
    shotRequested = true;
    return true;
  }
  if (code === 'Escape' || code === 'KeyP') {
    exitPhoto();
    return true;
  }
  return false;
}
// main.js calls this right after drawing a frame, while the picture is still in the canvas.
function takeShotIfRequested() {
  if (!shotRequested) return;
  shotRequested = false;
  const src = $('view'),
    scale = 3,
    out = document.createElement('canvas');
  out.width = src.width * scale;
  out.height = src.height * scale;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, out.width, out.height);
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pusa-rescue-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    chime();
    toast(TXT.photoSaved);
  }, 'image/png');
}
$('photoShot').addEventListener('click', () => {
  shotRequested = true;
});
$('photoExit').addEventListener('click', exitPhoto);

export {
  startGame,
  pauseGame,
  resumeGame,
  toMenu,
  grab,
  update,
  openShelter,
  enterPhoto,
  exitPhoto,
  updatePhoto,
  photoKey,
  takeShotIfRequested,
};
