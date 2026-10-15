// Game rules: the three modes, one round of play, the LAGIM stalker AI,
// round results and the Kanlungan night cycle.
import * as THREE from 'three';
import { scene, camera, flash, flashTarget, env, post } from './engine/renderer.js';
import { save, best, writeSave, writeBest } from './core/storage.js';
import { REACH, WALK, RUN } from './config.js';
import { rnd, pick } from './core/util.js';
import { CAT_NAMES } from './data/cats.js';
import { audioOn, meow, chirp, chime, thud, heartbeat, rainSound, scream } from './audio.js';
import { $, isTouch, nav, show, say, clearSubs, toast } from './ui/screens.js';
import { renderShop } from './ui/shop.js';
import { player, lag, keys, stick, lockPointer, unlockPointer, releaseKeys } from './input.js';
import { colliders } from './world/helpers.js';
import { posts, storeGlow, SHELTER } from './world/street.js';
import { cats, hitboxes, refreshRoster } from './world/cats.js';
import { applyShelterLook } from './world/shelter.js';
import { figure, batteries } from './world/lagim.js';

const touchUI = $('touch'), promptEl = $('prompt');
let state = 'menu', mode = 'classic';
let timeLeft = 300, timeLimit = 300, found = 0, saved = 0, total = 8;
let hintTimer = 6, chirpTimer = 1, aimed = -1, aimedBat = -1;
let speedMul = 1, hintEvery = 9, flashBase = 3.0, battery = 100, nightCoins = 0, nightNames = [];

export const getState = () => state;
export const getMode = () => mode;

function newName() {
  const used = new Set(save.cats.map(c => c.name));
  const free = CAT_NAMES.filter(n => !used.has(n));
  return free.length ? pick(free) : pick(CAT_NAMES) + ' ' + (save.cats.length + 1);
}
const posts0 = posts.map(p => p.flicker);
function setLook(m) {
  const horror = m === 'horror';
  scene.fog.density = horror ? 0.085 : 0.05;
  env.hemiBase = horror ? 0.32 : 0.7;
  posts.forEach((p, i) => { p.off = horror && (i === 0 || i === 3); p.flicker = horror ? i !== 0 && i !== 3 : posts0[i]; if (p.off) { p.L.intensity = 0; p.cone.visible = false; p.bulb.material.color.setHex(0x2a2018); } else { p.L.intensity = 2.0; p.cone.visible = true; p.bulb.material.color.setHex(0xffc27a); } });
  storeGlow.intensity = horror ? 0.25 : 1.1;
  post.uniforms.fear.value = horror ? 0.15 : 0;
}

const ent = { active: false, x: 0, z: -55, spawnIn: 30, litTime: 0, beat: 0 };
function placeCats(list) {
  cats.forEach(c => { c.state = 'off'; c.group.visible = false; c.path = []; });
  list.forEach(i => {
    const c = cats[i];
    c.group.position.set(...c.spot.p); c.group.rotation.y = c.spot.face;
    c.state = 'hidden'; c.slot = -1; c.group.visible = true;
  });
}
function chooseSpots(n) { const idx = cats.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx.slice(0, n); }

function startGame(m) {
  mode = m;
  audioOn(); rainSound();
  setLook(m);
  const build = m === 'build';
  applyShelterLook(build); refreshRoster(build);
  if (m === 'classic') { total = 8; timeLimit = 300; placeCats([0, 1, 2, 3, 4, 5, 6, 7]); }
  if (m === 'horror') { total = 6; timeLimit = 300; placeCats(chooseSpots(6)); }
  if (build) { total = Math.min(8, 2 + save.night); timeLimit = 150 + save.up.time * 45; placeCats(chooseSpots(total)); }
  const u = build ? save.up : { flash: 0, shoes: 0, bowls: 0 };
  flash.angle = 0.42 + u.flash * 0.07; flash.distance = 24 + u.flash * 5; flashBase = 3.0 + u.flash * 0.4;
  speedMul = 1 + u.shoes * 0.18; hintEvery = 9 - u.bowls * 2;
  battery = 100;
  batteries.forEach(b => { b.visible = m === 'horror'; });
  ent.active = false; ent.spawnIn = rnd(25, 35); ent.litTime = 0; figure.visible = false;
  player.x = 0; player.z = 1.5; player.yaw = 0; player.pitch = 0; lag.yaw = 0; lag.pitch = 0;
  timeLeft = timeLimit; found = 0; saved = 0; nightCoins = 0; nightNames = []; hintTimer = 9; clearSubs();
  $('count').innerHTML = `PUSA <b>0</b>/${total}`;
  $('coinsHud').hidden = !build; $('coinsHud').innerHTML = `₱<b>${save.coins}</b>`;
  $('battery').hidden = m !== 'horror';
  state = 'play'; show(null); $('hud').hidden = false; touchUI.hidden = !isTouch;
  if (m === 'classic') say(['Lola: Apo, may bagyo bukas.', 'Lola: Hanapin mo yung walong pusang gala sa kalye.', 'Lola: Dalhin mo sila dito sa kahon, sa likod mo.', 'Lola: Bago maghatinggabi, ha?']);
  if (m === 'horror') say(['Lola: Apo... may kakaiba ngayong gabi.', 'Lola: Kapag may nakita kang nakatayo sa dilim...', 'Lola: Huwag mong aalisin ang ilaw sa kanya.']);
  if (build) say([`Gabi ${save.night}. ${total} pusa ang nasa labas.`, save.night === 1 ? 'Lola: Bawat pusang maiuuwi mo, may baon ka.' : 'Lola: Nandito lang ako sa kanlungan, apo.']);
  lockPointer();
}

function pauseGame() {
  if (state !== 'play') return;
  state = 'paused'; releaseKeys(); unlockPointer();
  touchUI.hidden = true; nav.backTo = 'pause'; show('pause');
}
function resumeGame() { if (state !== 'paused') return; state = 'play'; show(null); touchUI.hidden = !isTouch; lockPointer(); }
function toMenu() {
  state = 'menu'; $('hud').hidden = true; touchUI.hidden = true; figure.visible = false;
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  setLook('classic'); applyShelterLook(false); refreshRoster(false); placeCats([0, 1, 2, 3, 4, 5, 6, 7]);
  nav.backTo = 'menu'; show('menu');
}

// ====================== GAME LOGIC ======================
const ray = new THREE.Raycaster(); const center = new THREE.Vector2(0, 0);

function grab() {
  if (state !== 'play') return;
  if (aimedBat >= 0) {
    batteries[aimedBat].visible = false; battery = Math.min(100, battery + 60); chime(); toast('+ BATERYA'); aimedBat = -1; return;
  }
  if (aimed < 0) return;
  const c = cats[aimed];
  c.state = 'run'; found++;
  c.slot = found - 1;
  c.path = [new THREE.Vector3(0, 0, c.group.position.z), new THREE.Vector3(SHELTER.x + (c.slot % 4) * 0.42 - 0.63, 0, SHELTER.z - 0.3 - Math.floor(c.slot / 4) * 0.45)];
  c.group.position.y = 0;
  meow(0.35, 0, rnd(1.0, 1.2));
  $('count').innerHTML = `PUSA <b>${found}</b>/${total}`;
  if (mode === 'build') {
    const name = newName(), coins = 20 + save.up.home * 5;
    save.cats.push({ name, kind: c.spot.kind, night: save.night }); save.coins += coins; nightCoins += coins; nightNames.push(name);
    writeSave();
    $('coinsHud').innerHTML = `₱<b>${save.coins}</b>`;
    toast(`+₱${coins} · ${name}`);
    say([`Ikaw na si ${name}.`]);
  } else {
    const lines = ['Nakuha mo siya.', 'Sige, takbo sa kahon ni Lola.', 'Ayan, ligtas ka na.', 'Mrrp?'];
    say([found === total ? 'Ayan na lahat... balik na tayo kay Lola.' : pick(lines)]);
  }
}

function collide(nx, nz) {
  const r = 0.3;
  if (nx < -8.6 || nx > 8.6 || nz < -57.9 || nz > 5.1) return true;
  return colliders.some(c => nx > c.x0 - r && nx < c.x1 + r && nz > c.z0 - r && nz < c.z1 + r);
}

const fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
function update(dt, t) {
  timeLeft -= dt;
  const mins = Math.min(59, Math.floor((1 - timeLeft / timeLimit) * 60));
  $('clock').textContent = timeLeft > 0 ? `11:${String(mins).padStart(2, '0')} PM` : '12:00 AM';
  if (timeLeft <= 0) return endRound('time');

  let mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) mz -= 1; if (keys.KeyS || keys.ArrowDown) mz += 1;
  if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
  mx += stick.x; mz += stick.y;
  const len = Math.hypot(mx, mz);
  if (len > 0.05) {
    if (len > 1) { mx /= len; mz /= len; }
    const sp = ((keys.ShiftLeft || keys.ShiftRight || Math.hypot(stick.x, stick.y) > 0.95) ? RUN : WALK) * speedMul;
    const s = Math.sin(player.yaw), co = Math.cos(player.yaw);
    const dx = (mx * co + mz * s) * sp * dt, dz = (-mx * s + mz * co) * sp * dt;
    if (!collide(player.x + dx, player.z)) player.x += dx;
    if (!collide(player.x, player.z + dz)) player.z += dz;
    player.bob += dt * sp * 2.6;
  }
  camera.position.set(player.x, 1.58 + Math.sin(player.bob) * 0.035, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');

  const k = Math.min(1, dt * 10);
  lag.yaw += (player.yaw - lag.yaw) * k; lag.pitch += (player.pitch - lag.pitch) * k;
  flashTarget.position.set(Math.max(-1.5, Math.min(1.5, (player.yaw - lag.yaw) * 5)), -0.2 - Math.max(-1.5, Math.min(1.5, (player.pitch - lag.pitch) * 5)), -5);

  // flashlight power (battery only drains in LAGIM)
  let power = 1;
  if (mode === 'horror') {
    battery = Math.max(0, battery - dt * 0.6);
    $('battery').style.setProperty('--lvl', `${Math.round(battery)}%`);
    $('battery').style.setProperty('--bat', battery < 25 ? 'var(--blood)' : 'var(--ok)');
    power = battery <= 0 ? 0.12 : battery < 20 ? (Math.random() < 0.15 ? 0.15 : 0.7) : 1;
  }
  flash.intensity = (Math.random() < 0.012 ? 0.25 : 1) * flashBase * power;
  camera.getWorldDirection(fwd);

  // aim at a cat or battery
  ray.setFromCamera(center, camera);
  aimed = -1; aimedBat = -1;
  const hits = ray.intersectObjects(hitboxes, false);
  for (const h of hits) { const c = cats[h.object.userData.cat]; if (c.state === 'hidden' && h.distance < REACH) { aimed = h.object.userData.cat; break; } }
  if (mode === 'horror' && aimed < 0) {
    batteries.forEach((b, i) => { if (!b.visible) return; tmp.copy(b.position).sub(camera.position); const d = tmp.length(); if (d < REACH && fwd.dot(tmp.normalize()) > 0.93) aimedBat = i; });
  }
  promptEl.hidden = aimed < 0 && aimedBat < 0;
  promptEl.textContent = aimedBat >= 0 ? (isTouch ? 'KUNIN ang baterya' : '[E] Kunin ang baterya') : (isTouch ? 'KUNIN ang pusa' : '[E] Kunin ang pusa');

  // cats
  const coneCos = Math.cos(flash.angle);
  cats.forEach(c => {
    if (c.state === 'off') return;
    const pos = c.group.position;
    c.tail.forEach((sg, i) => { sg.rotation.z = Math.sin(t * 2.2 + pos.x + i * 0.7) * 0.22; });
    c.blink -= dt;
    const blinking = c.blink < 0.12;
    if (c.blink < 0) c.blink = rnd(2.5, 6);
    tmp.set(pos.x, pos.y + 0.35, pos.z).sub(camera.position);
    const d = tmp.length(); tmp.normalize();
    const lit = fwd.dot(tmp) > coneCos && d < flash.distance * 0.8 && power > 0.3;
    const op = blinking || c.state === 'saved' ? 0 : (lit ? 0.95 : 0.12);
    c.eyes.forEach(e => { e.material.opacity += (op - e.material.opacity) * 0.3; });
    if (c.state === 'run') {
      const target = c.path[0];
      const dir = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
      const dist = dir.length();
      if (dist < 0.15) { c.path.shift(); if (!c.path.length) { c.state = 'saved'; saved++; c.group.rotation.y = 0; } }
      else {
        dir.normalize(); pos.addScaledVector(dir, Math.min(dist, 5 * dt));
        pos.y = Math.abs(Math.sin(t * 18)) * 0.06;
        c.group.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  });
  if (saved === total) return endRound('won');

  if (mode === 'horror') stalker(dt, power);

  hintTimer -= dt; chirpTimer -= dt;
  if (chirpTimer < 0) { chirp(); chirpTimer = rnd(0.4, 1.6); }
  if (hintTimer < 0) {
    hintTimer = rnd(hintEvery - 2, hintEvery + 2);
    const hidden = cats.filter(c => c.state === 'hidden');
    if (hidden.length) {
      hidden.sort((a, b) => a.group.position.distanceTo(camera.position) - b.group.position.distanceTo(camera.position));
      const c = hidden[0], d = c.group.position.distanceTo(camera.position);
      const rel = c.group.position.clone().sub(camera.position).normalize();
      const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      meow(Math.max(0.03, 0.45 * (1 - d / 30)), Math.max(-1, Math.min(1, rel.dot(right))), rnd(0.9, 1.15));
      if (d < 6 && Math.random() < 0.6) say(['...meow?']);
      else if (Math.random() < 0.2) say([`Lola: Baka ${c.spot.where}...`]);
    }
    if (Math.random() < (mode === 'horror' ? 0.2 : 0.08)) { thud(); say(['...ano yun?']); }
  }

}

// the stalker: moves only when your light is not on it
function spawnStalker(near) {
  const back = new THREE.Vector3(-fwd.x, 0, -fwd.z).normalize();
  const dist = near ? rnd(12, 16) : rnd(18, 24);
  let x = player.x + back.x * dist + rnd(-3, 3), z = player.z + back.z * dist;
  if (z < -57 || z > 4.5) z = player.z + (player.z > -27 ? -dist : dist);
  ent.x = Math.max(-6.5, Math.min(6.5, x)); ent.z = Math.max(-57, Math.min(4.5, z));
  ent.active = true; ent.litTime = 0; figure.visible = true;
}
function stalker(dt, power) {
  if (!ent.active) { ent.spawnIn -= dt; if (ent.spawnIn <= 0) { spawnStalker(false); say(['...may tao ba diyan?']); } post.uniforms.fear.value = 0.15; return; }
  const dx = player.x - ent.x, dz = player.z - ent.z, d = Math.hypot(dx, dz);
  tmp.set(ent.x - camera.position.x, 1.7 - camera.position.y, ent.z - camera.position.z);
  const dd = tmp.length(); tmp.normalize();
  const lit = power > 0.3 && fwd.dot(tmp) > Math.cos(flash.angle * 0.95) && dd < flash.distance * 0.75;
  if (!lit) {
    const progress = 1 - timeLeft / timeLimit;
    const sp = 1.1 + progress * 1.8 + (battery <= 0 ? 0.8 : 0);
    ent.x += dx / d * sp * dt; ent.z += dz / d * sp * dt; ent.litTime = 0;
  } else {
    ent.litTime += dt;
    if (ent.litTime > 2.2 && d < 9) { figure.visible = false; ent.active = false; ent.spawnIn = rnd(6, 12); thud(); say(['...nawala siya.']); return; }
  }
  figure.position.set(ent.x, 0, ent.z); figure.rotation.y = Math.atan2(dx, dz);
  if (d > 34) spawnStalker(true);
  const fear = Math.max(0, Math.min(1, 1 - d / 14));
  post.uniforms.fear.value = 0.15 + fear * 0.85;
  ent.beat -= dt;
  if (fear > 0 && ent.beat <= 0) { heartbeat(0.15 + fear * 0.35); ent.beat = 1.3 - fear * 0.85; }
  if (d < 0.9) caught();
}
function caught() {
  state = 'scare'; $('hud').hidden = true; touchUI.hidden = true;
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  $('scare').hidden = false; scream();
  setTimeout(() => { $('scare').hidden = true; figure.visible = false; showResult('NAHULI KA', `Inabutan ka niya sa dilim. ${saved} sa ${total} pusa ang nakauwi bago nangyari iyon.`); }, 1600);
}

function endRound(how) {
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  $('hud').hidden = true; touchUI.hidden = true; promptEl.hidden = true; clearSubs();
  figure.visible = false; post.uniforms.fear.value = 0;
  if (mode === 'build') {
    let bonus = 0;
    if (how === 'won') { bonus = 30 + save.night * 5; save.coins += bonus; nightCoins += bonus; }
    const n = save.night; save.night++; writeSave();
    openShelter(how === 'won'
      ? `Gabi ${n}: nailigtas mo lahat ng ${total}. Kinita: ₱${nightCoins} (may bonus na ₱${bonus}).`
      : `Gabi ${n}: ${found} sa ${total} ang naiuwi bago maghatinggabi. Kinita: ₱${nightCoins}.`);
    return;
  }
  if (how === 'won') {
    const secs = Math.floor(timeLimit - timeLeft);
    if (mode === 'classic' && (!best.classic || secs < best.classic)) { best.classic = secs; writeBest(); }
    showResult('LIGTAS NA SILA', mode === 'horror'
      ? `Nakauwi ang lahat ng ${total} pusa. Hindi ka niya naabutan... ngayong gabi.`
      : `Salamat, apo. Lahat ng ${total} pusa ay nasa kahon na ni Lola. Oras: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}.`);
  } else {
    showResult('HATINGGABI NA', `${saved} sa ${total} pusa ang nakauwi. May ${total - saved} pang naiwan sa labas... naririnig mo pa sila.`);
    meow(0.12, 0, 0.8);
  }
}
function showResult(title, text) { state = 'result'; $('rTitle').textContent = title; $('rText').textContent = text; show('result'); }

function openShelter(summary) {
  state = 'shelter'; mode = 'build';
  setLook('build'); applyShelterLook(true); refreshRoster(true);
  cats.forEach(c => { c.state = 'off'; c.group.visible = false; });
  $('shTitle').textContent = `KANLUNGAN · GABI ${save.night}`;
  $('shSum').textContent = summary;
  $('shNext').textContent = `SIMULAN ANG GABI ${save.night}`;
  renderShop(); show('shelter');
}

export { startGame, pauseGame, resumeGame, toMenu, grab, update, openShelter };
