// Keyboard, mouse (pointer lock or drag) and touch joystick / look pad.
// The game passes in callbacks, so this file doesn't need to know the game rules.
import { settings } from './core/storage.js';
import { $, isTouch } from './ui/screens.js';

export const player = { x: 0, z: 1.5, yaw: 0, pitch: 0, bob: 0 };
export const lag = { yaw: 0, pitch: 0 };   // the flashlight trails slightly behind your view
export const keys = {};
export const stick = { x: 0, y: 0 };       // touch joystick, -1..1 on each axis

const view = $('view');
let hooks = { isPlaying: () => false, isPaused: () => false, grab() {}, pause() {}, resume() {} };
let dragging = false, hadLock = false;

function look(dx, dy, sens) {
  const s = sens * settings.sens;
  player.yaw -= dx * s; player.pitch -= dy * s * (settings.invert ? -1 : 1);
  player.pitch = Math.max(-1.35, Math.min(1.2, player.pitch));
}
export function lockPointer() { if (isTouch) return; try { const r = view.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
export function unlockPointer() { hadLock = false; try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} }
export function releaseKeys() { for (const k in keys) keys[k] = false; }

export function initInput(h) {
  hooks = Object.assign(hooks, h);

  addEventListener('keydown', (e) => {
    if (hooks.isPlaying()) {
      keys[e.code] = true;
      if (e.code === 'KeyE') hooks.grab();
      if (e.code === 'KeyP' || e.code === 'Escape') hooks.pause();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    } else if (hooks.isPaused() && e.code === 'KeyP') hooks.resume();
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { releaseKeys(); if (hooks.isPlaying()) hooks.pause(); });

  view.addEventListener('mousedown', () => {
    if (!hooks.isPlaying() || isTouch) return;
    if (document.pointerLockElement === view) { hooks.grab(); return; }
    lockPointer(); dragging = true;
  });
  addEventListener('mouseup', () => { dragging = false; });
  addEventListener('mousemove', (e) => {
    if (!hooks.isPlaying()) return;
    if (document.pointerLockElement === view) look(e.movementX, e.movementY, 0.0024);
    else if (dragging) look(e.movementX, e.movementY, 0.005);
  });
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === view) hadLock = true;
    else if (hadLock && hooks.isPlaying()) { hadLock = false; hooks.pause(); }
  });

  // touch joystick (left)
  const pad = $('stick'), knob = $('knob'), lookpad = $('lookpad');
  let stickId = null, lookId = null, lastLook = null;
  const moveStick = (e) => {
    const r = pad.getBoundingClientRect(), R = r.width / 2;
    let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
    const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    stick.x = dx / R; stick.y = dy / R; knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  pad.addEventListener('pointerdown', (e) => { stickId = e.pointerId; pad.setPointerCapture(e.pointerId); moveStick(e); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) moveStick(e); });
  const endStick = (e) => { if (e.pointerId === stickId) { stickId = null; stick.x = 0; stick.y = 0; knob.style.transform = ''; } };
  pad.addEventListener('pointerup', endStick); pad.addEventListener('pointercancel', endStick);

  // touch look pad (right half)
  lookpad.addEventListener('pointerdown', (e) => { lookId = e.pointerId; lastLook = { x: e.clientX, y: e.clientY }; lookpad.setPointerCapture(e.pointerId); });
  lookpad.addEventListener('pointermove', (e) => { if (e.pointerId !== lookId) return; look(e.clientX - lastLook.x, e.clientY - lastLook.y, 0.006); lastLook = { x: e.clientX, y: e.clientY }; });
  const endLook = (e) => { if (e.pointerId === lookId) lookId = null; };
  lookpad.addEventListener('pointerup', endLook); lookpad.addEventListener('pointercancel', endLook);

  $('grab').addEventListener('click', () => hooks.grab());
  $('pauseBtn').addEventListener('click', () => hooks.pause());
}
