// Screen switching, subtitles, toasts, fullscreen and accessibility classes.
import { tick } from '../audio.js';
import { settings } from '../core/storage.js';
import { TXT } from '../data/text.js';

export const $ = (id) => document.getElementById(id);
export const isTouch = 'ontouchstart' in window || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
export const nav = { backTo: 'menu' }; // where BUMALIK goes from Settings / How to play

const screens = ['menu', 'modes', 'how', 'settings', 'pause', 'result', 'shelter'];
export function show(id) {
  if (id) tick();
  screens.forEach((s) => {
    $(s).hidden = s !== id;
  });
  const f = id && $(id).querySelector('button');
  if (f && !isTouch) f.focus({ preventScroll: true });
}
export const visibleScreen = () => screens.find((s) => !$(s).hidden) || null;

// ---------- subtitles ----------
const subEl = $('sub'),
  toastEl = $('toast');
let subQueue = [],
  subTimer = 0,
  toastTimer = 0;
export function say(lines) {
  if (!settings.subs) return;
  subQueue.push(...lines);
  if (subTimer <= 0) nextSub();
}
function nextSub() {
  const l = subQueue.shift();
  if (l) {
    subEl.textContent = l;
    subTimer = Math.max(2.4, l.length * 0.06);
  } else {
    subEl.textContent = '';
    subTimer = 0;
  }
}
export function clearSubs() {
  subQueue = [];
  subTimer = 0;
  subEl.textContent = '';
}
export function toast(t) {
  toastEl.textContent = t;
  toastEl.hidden = false;
  toastTimer = 2;
}

// Called every frame from the game loop.
export function tickUI(dt, playing) {
  if (playing) {
    subTimer -= dt;
    if (subTimer <= 0 && (subQueue.length || subEl.textContent)) nextSub();
  }
  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) toastEl.hidden = true;
  }
}

// ---------- accessibility ----------
export function applyA11y() {
  const app = $('app');
  app.classList.toggle('big-hud', !!settings.bigHud);
  app.classList.toggle('calm', !!settings.calm);
  $('debug').hidden = !settings.fps;
  if (!settings.subs) clearSubs();
}

// ---------- fullscreen ----------
function canFull() {
  return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
}
export function toggleFull() {
  try {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    const r = $('app').requestFullscreen ? $('app').requestFullscreen() : null;
    if (r && r.catch) r.catch(() => toast(TXT.noFullscreen));
  } catch (e) {
    toast(TXT.noFullscreen);
  }
}
if (!canFull()) {
  $('mFull').hidden = true;
  $('pFull').hidden = true;
}
