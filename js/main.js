// Entry point: wires input to the game, applies settings, then runs the frame loop.
import * as THREE from 'three';
import { camera, render } from './engine/renderer.js';
import { applyQuality } from './engine/quality.js';
import { initInput } from './input.js';
import { tickUI } from './ui/screens.js';
import './ui/menus.js';
import { atmos } from './world/atmosphere.js';
import { getState, update, grab, pauseGame, resumeGame, toMenu } from './game.js';

initInput({
  isPlaying: () => getState() === 'play',
  isPaused: () => getState() === 'paused',
  grab, pause: pauseGame, resume: resumeGame,
});

applyQuality();
toMenu();

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, state = getState();
  if (state === 'play') update(dt, t);
  else if (state === 'shelter') { camera.position.set(0.2, 1.75, -1.4); camera.lookAt(-3.4, 0.5, 3.0); }
  else if (state === 'menu' || state === 'result') {
    const z = -2 - (t * 0.6) % 40;
    camera.position.set(Math.sin(t * 0.1) * 1.5, 1.7, z);
    camera.rotation.set(-0.04, Math.sin(t * 0.12) * 0.35 - 0.15, 0, 'YXZ');
  }
  atmos(dt, t);
  tickUI(dt, state === 'play');
  render();
}
loop();
