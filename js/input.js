// Keyboard, mouse (pointer lock or drag), touch joystick / look pad and game controllers.
// The game passes in callbacks, so this file doesn't need to know the game rules.
import { settings } from './core/storage.js';
import { $, isTouch } from './ui/screens.js';

export const player = { x: 0, z: 1.5, yaw: 0, pitch: 0, bob: 0 };
export const lag = { yaw: 0, pitch: 0 }; // the flashlight trails slightly behind your view
export const keys = {};
export const stick = { x: 0, y: 0 }; // touch joystick, -1..1 on each axis
export const pad = { x: 0, y: 0, run: false, up: 0, connected: false }; // game controller

const view = $('view');
let hooks = {
  isPlaying: () => false, // a round is running
  canMove: () => false, // walking or flying (round or photo mode)
  isMenu: () => true, // a menu screen is showing
  grab() {},
  pause() {},
  resume() {},
  back() {},
  photoKey: () => false,
};
let dragging = false,
  hadLock = false;

export function look(dx, dy, sens) {
  const s = sens * settings.sens;
  player.yaw -= dx * s;
  player.pitch -= dy * s * (settings.invert ? -1 : 1);
  player.pitch = Math.max(-1.35, Math.min(1.2, player.pitch));
}
export function lockPointer() {
  if (isTouch) return;
  try {
    const r = view.requestPointerLock();
    if (r && r.catch) r.catch(() => {});
  } catch (e) {}
}
export function unlockPointer() {
  hadLock = false;
  try {
    if (document.pointerLockElement) document.exitPointerLock();
  } catch (e) {}
}
export function releaseKeys() {
  for (const k in keys) keys[k] = false;
}

export function initInput(h) {
  hooks = Object.assign(hooks, h);

  addEventListener('keydown', (e) => {
    if (hooks.canMove()) {
      keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    }
    if (hooks.isPlaying()) {
      if (e.code === 'KeyE') hooks.grab();
      if (e.code === 'KeyP' || e.code === 'Escape') hooks.pause();
    } else if (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Enter' || e.code === 'KeyK') {
      const handled = hooks.photoKey(e.code); // true when photo mode used the key
      if (!handled && e.code === 'KeyP') hooks.resume();
    }
  });
  addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  addEventListener('blur', () => {
    releaseKeys();
    if (hooks.isPlaying()) hooks.pause();
  });

  view.addEventListener('mousedown', () => {
    if (!hooks.canMove() || isTouch) return;
    if (document.pointerLockElement === view) {
      if (hooks.isPlaying()) hooks.grab();
      return;
    }
    lockPointer();
    dragging = true;
  });
  addEventListener('mouseup', () => {
    dragging = false;
  });
  addEventListener('mousemove', (e) => {
    if (!hooks.canMove()) return;
    if (document.pointerLockElement === view) look(e.movementX, e.movementY, 0.0024);
    else if (dragging) look(e.movementX, e.movementY, 0.005);
  });
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === view) hadLock = true;
    else if (hadLock && hooks.isPlaying()) {
      hadLock = false;
      hooks.pause();
    }
  });

  // touch joystick (left)
  const padEl = $('stick'),
    knob = $('knob'),
    lookpad = $('lookpad');
  let stickId = null,
    lookId = null,
    lastLook = null;
  const moveStick = (e) => {
    const r = padEl.getBoundingClientRect(),
      R = r.width / 2;
    let dx = e.clientX - (r.left + R),
      dy = e.clientY - (r.top + R);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx *= R / d;
      dy *= R / d;
    }
    stick.x = dx / R;
    stick.y = dy / R;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  padEl.addEventListener('pointerdown', (e) => {
    stickId = e.pointerId;
    padEl.setPointerCapture(e.pointerId);
    moveStick(e);
  });
  padEl.addEventListener('pointermove', (e) => {
    if (e.pointerId === stickId) moveStick(e);
  });
  const endStick = (e) => {
    if (e.pointerId === stickId) {
      stickId = null;
      stick.x = 0;
      stick.y = 0;
      knob.style.transform = '';
    }
  };
  padEl.addEventListener('pointerup', endStick);
  padEl.addEventListener('pointercancel', endStick);

  // touch look pad (right half)
  lookpad.addEventListener('pointerdown', (e) => {
    lookId = e.pointerId;
    lastLook = { x: e.clientX, y: e.clientY };
    lookpad.setPointerCapture(e.pointerId);
  });
  lookpad.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return;
    look(e.clientX - lastLook.x, e.clientY - lastLook.y, 0.006);
    lastLook = { x: e.clientX, y: e.clientY };
  });
  const endLook = (e) => {
    if (e.pointerId === lookId) lookId = null;
  };
  lookpad.addEventListener('pointerup', endLook);
  lookpad.addEventListener('pointercancel', endLook);

  $('grab').addEventListener('click', () => hooks.grab());
  $('pauseBtn').addEventListener('click', () => hooks.pause());
}

// ---------- game controller (standard mapping: Xbox / PlayStation) ----------
// A / Cross = pick up · Start / Options = pause · B / Circle = back
// Left stick = walk (click it or hold RT to run) · Right stick = look · LB / RB = down / up in photo mode
const prev = [];
let navCool = 0;
const dead = (v) => (Math.abs(v) < 0.18 ? 0 : v);

function focusables() {
  const layer = [...document.querySelectorAll('.layer')].find((l) => !l.hidden);
  if (!layer) return [];
  return [...layer.querySelectorAll('button, select, input, [tabindex]')].filter(
    (el) => !el.hidden && !el.disabled && el.offsetParent !== null,
  );
}
function moveFocus(dir) {
  const els = focusables();
  if (!els.length) return;
  const i = els.indexOf(document.activeElement);
  els[(i + dir + els.length) % els.length].focus({ preventScroll: false });
}

export function pollGamepad(dt) {
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
  pad.connected = !!gp;
  if (!gp) {
    pad.x = pad.y = pad.up = 0;
    pad.run = false;
    return;
  }
  const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const pressed = (i) => b(i) && !prev[i];

  pad.x = dead(gp.axes[0] || 0);
  pad.y = dead(gp.axes[1] || 0);
  pad.run = b(10) || (gp.buttons[7] && gp.buttons[7].value > 0.5);
  pad.up = (b(5) ? 1 : 0) - (b(4) ? 1 : 0);
  if (hooks.canMove()) look(dead(gp.axes[2] || 0) * 900 * dt, dead(gp.axes[3] || 0) * 700 * dt, 0.004);

  if (hooks.isPlaying()) {
    if (pressed(0)) hooks.grab();
    if (pressed(9)) hooks.pause();
  } else if (hooks.isMenu()) {
    navCool -= dt;
    const vy = (b(13) ? 1 : 0) - (b(12) ? 1 : 0) || (Math.abs(pad.y) > 0.6 ? Math.sign(pad.y) : 0);
    if (vy && navCool <= 0) {
      moveFocus(vy);
      navCool = 0.22;
    }
    if (!vy) navCool = 0;
    if (pressed(0) && document.activeElement && document.activeElement.click) document.activeElement.click();
    if (pressed(1)) hooks.back();
    if (pressed(9)) hooks.resume();
  } else {
    if (pressed(0) || pressed(2)) hooks.photoKey('Enter');
    if (pressed(1) || pressed(9)) hooks.photoKey('Escape');
  }
  gp.buttons.forEach((btn, i) => {
    prev[i] = btn.pressed;
  });
}
