// Screen switching, subtitles, toasts and fullscreen.
import { tick } from '../audio.js';

export const $ = (id) => document.getElementById(id);
export const isTouch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
export const nav = { backTo: 'menu' };   // where BUMALIK goes from Settings / How to play

const screens = ['menu', 'modes', 'how', 'settings', 'pause', 'result', 'shelter'];
export function show(id) {
  if (id) tick();
  screens.forEach(s => { $(s).hidden = s !== id; });
  const f = id && $(id).querySelector('button');
  if (f && !isTouch) f.focus({ preventScroll: true });
}

const subEl = $('sub'), toastEl = $('toast');
let subQueue = [], subTimer = 0, toastTimer = 0;
export function say(lines) { subQueue.push(...lines); if (subTimer <= 0) nextSub(); }
function nextSub() { const l = subQueue.shift(); if (l) { subEl.textContent = l; subTimer = Math.max(2.4, l.length * 0.06); } else { subEl.textContent = ''; subTimer = 0; } }
export function clearSubs() { subQueue = []; subTimer = 0; subEl.textContent = ''; }
export function toast(t) { toastEl.textContent = t; toastEl.hidden = false; toastTimer = 2; }

// Called every frame from the game loop.
export function tickUI(dt, playing) {
  if (playing) { subTimer -= dt; if (subTimer <= 0 && (subQueue.length || subEl.textContent)) nextSub(); }
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) toastEl.hidden = true; }
}

function canFull() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
export function toggleFull() {
  try {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    const r = $('app').requestFullscreen ? $('app').requestFullscreen() : null;
    if (r && r.catch) r.catch(() => toast('Hindi pinapayagan ang fullscreen dito'));
  } catch (e) { toast('Hindi pinapayagan ang fullscreen dito'); }
}
if (!canFull()) { $('mFull').hidden = true; $('pFull').hidden = true; }
