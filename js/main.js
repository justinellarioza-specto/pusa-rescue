// Entry point: wires input to the game, applies settings, then runs the frame loop.
import * as THREE from 'three';
import { camera, render, stats } from './engine/renderer.js';
import { applyQuality } from './engine/quality.js';
import { settings, saveSettings } from './core/storage.js';
import { initInput, pollGamepad, player, pad } from './input.js';
import { $, tickUI, applyA11y, visibleScreen } from './ui/screens.js';
import { goBack } from './ui/menus.js';
import { atmos, getWeather } from './world/atmosphere.js';
import {
  getState,
  getMode,
  update,
  grab,
  pauseGame,
  resumeGame,
  toMenu,
  updatePhoto,
  photoKey,
  takeShotIfRequested,
  showViewmodel,
} from './game.js';

initInput({
  isPlaying: () => getState() === 'play',
  canMove: () => getState() === 'play' || getState() === 'photo',
  isMenu: () => visibleScreen() !== null,
  grab,
  pause: pauseGame,
  resume: resumeGame,
  back: goBack,
  photoKey,
});

// F3 toggles the FPS / position overlay from anywhere.
addEventListener('keydown', (e) => {
  if (e.code !== 'F3') return;
  e.preventDefault();
  settings.fps = !settings.fps;
  saveSettings();
  applyA11y();
});

applyQuality();
applyA11y();
toMenu();

// ---------- debug overlay ----------
let frames = 0,
  fpsTime = 0,
  fps = 0;
function updateDebug(dt) {
  frames++;
  fpsTime += dt;
  if (fpsTime < 0.5) return;
  fps = Math.round(frames / fpsTime);
  frames = 0;
  fpsTime = 0;
  if (!settings.fps) return;
  const p = camera.position;
  $('debug').textContent =
    `FPS  ${fps}\nPOS  x ${p.x.toFixed(1)}  y ${p.y.toFixed(1)}  z ${p.z.toFixed(1)}\nYAW  ${((player.yaw * 57.3) % 360).toFixed(0)}°\n` +
    `MODE ${getMode()} · ${getState()}\nULAN ${getWeather()} · ${settings.quality}\nDRAW ${stats.calls} calls · ${stats.triangles} tris${pad.connected ? '\nPAD  connected' : ''}`;
}

// ---------- frame loop ----------
const clock = new THREE.Clock();
let first = true;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05),
    t = clock.elapsedTime,
    state = getState();
  pollGamepad(dt);
  showViewmodel(state === 'play' || state === 'paused');
  if (state === 'play') update(dt, t);
  else if (state === 'photo') updatePhoto(dt);
  else if (state === 'shelter') {
    camera.position.set(0.2, 1.75, -1.4);
    camera.lookAt(-3.4, 0.5, 3.0);
  } else if (state === 'menu' || state === 'result') {
    const z = -2 - ((t * 0.6) % 40);
    camera.position.set(Math.sin(t * 0.1) * 1.5, 1.7, z);
    camera.rotation.set(-0.04, Math.sin(t * 0.12) * 0.35 - 0.15, 0, 'YXZ');
  }
  atmos(dt, t);
  tickUI(dt, state === 'play');
  render();
  takeShotIfRequested();
  updateDebug(dt);
  if (first) {
    first = false;
    $('loading').hidden = true;
  }
}
loop();
