// Pixel-art textures drawn with the Canvas API at startup (no image files needed).
import * as THREE from 'three';
import { rnd, pick } from '../core/util.js';

function tex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  return t;
}
function speckle(g, w, h, n, cols, s = 1) {
  for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); g.fillRect(Math.floor(rnd(0, w)), Math.floor(rnd(0, h)), s, s); }
}
const T = {};
T.road = tex(64, 64, (g, w, h) => {
  g.fillStyle = '#2b2b2f'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 900, ['#34343a', '#232327', '#3d3c40', '#1d1d20', '#2f2e31']);
  g.fillStyle = '#25252a'; g.fillRect(8, 30, 22, 14); g.fillRect(40, 4, 14, 10);
  g.fillStyle = '#18181b';
  let x = 6, y = 20; for (let i = 0; i < 26; i++) { g.fillRect(x, y, 1, 1); x += Math.round(rnd(0, 2)); y += Math.round(rnd(-1, 1)); }
  x = 34; y = 50; for (let i = 0; i < 20; i++) { g.fillRect(x, y, 1, 1); x += Math.round(rnd(-1, 1)); y += Math.round(rnd(0, 1)); }
}, 3, 16);
T.side = tex(32, 32, (g, w, h) => {
  g.fillStyle = '#5a5852'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 220, ['#63615a', '#4e4c47', '#56544e']);
  g.fillStyle = '#3c3a36'; g.fillRect(0, 31, 32, 1); g.fillRect(31, 0, 1, 32); g.fillRect(0, 15, 32, 1);
  g.fillStyle = 'rgba(40,70,40,.5)'; speckle(g, w, h, 18, ['#2f4a2c', '#3b5a33']);
}, 1, 24);
function wallTex(base) {
  return tex(64, 64, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 900, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.05)', 'rgba(0,0,0,.14)']);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(rnd(0, w)), len = Math.floor(rnd(10, 42)), wd = Math.floor(rnd(1, 3));
      for (let k = 0; k < len; k++) { g.fillStyle = `rgba(20,16,10,${0.22 * (1 - k / len)})`; g.fillRect(x, k, wd, 1); }
    }
    const gr = g.createLinearGradient(0, h - 16, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,14,8,.55)');
    g.fillStyle = gr; g.fillRect(0, h - 16, w, 16);
    speckle(g, w, 8, 40, ['#2f4a2c', '#3e5a35', '#26381f'].map(c => c), 1);
    g.fillStyle = 'rgba(0,0,0,.35)';
    let x = Math.floor(rnd(10, 50)), y = Math.floor(rnd(10, 30));
    for (let i = 0; i < 18; i++) { g.fillRect(x, y, 1, 1); x += Math.round(rnd(-1, 1)); y += 1; }
  }, 2, 1);
}
T.yero = tex(32, 32, (g, w, h) => {
  for (let x = 0; x < w; x++) { g.fillStyle = x % 4 === 0 ? '#9a7458' : x % 4 === 1 ? '#7d5a3e' : x % 4 === 2 ? '#5b3f2a' : '#6b4a32'; g.fillRect(x, 0, 1, h); }
  for (let i = 0; i < 7; i++) { g.fillStyle = pick(['rgba(140,60,25,.55)', 'rgba(90,40,18,.5)']); g.fillRect(Math.floor(rnd(0, w)), Math.floor(rnd(0, h)), Math.floor(rnd(2, 7)), Math.floor(rnd(2, 6))); }
  speckle(g, w, h, 80, ['#8a4b2a', '#3e2a1c', '#a26a46']);
}, 4, 1);
T.block = tex(32, 32, (g, w, h) => {
  g.fillStyle = '#6e6c67'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 300, ['#62605b', '#7a7872', '#5a5853']);
  g.fillStyle = '#4a4844';
  for (let y = 0; y < 32; y += 8) { g.fillRect(0, y + 7, 32, 1); const off = (y / 8) % 2 ? 8 : 0; for (let x = off; x < 32; x += 16) g.fillRect(x + 15, y, 1, 7); }
}, 6, 1);
T.cardboard = tex(32, 32, (g, w, h) => {
  g.fillStyle = '#93693f'; g.fillRect(0, 0, w, h); speckle(g, w, h, 160, ['#7e5835', '#a2774b', '#8a6038']);
  g.fillStyle = '#c8b48a'; g.fillRect(0, 14, 32, 4);
  g.fillStyle = '#5a3c20'; g.fillRect(4, 4, 8, 1); g.fillRect(4, 6, 5, 1); g.fillRect(22, 24, 6, 1);
});
T.jeep = tex(64, 32, (g, w, h) => {
  g.fillStyle = '#b3b2ab'; g.fillRect(0, 0, w, h); speckle(g, w, h, 220, ['#cfcec8', '#96958f', '#bfbeb7']);
  g.fillStyle = '#0d0f15'; g.fillRect(0, 2, w, 9);
  g.fillStyle = '#b3b2ab'; for (let x = 0; x < w; x += 8) g.fillRect(x, 2, 1, 9);
  g.fillStyle = '#c42f25'; g.fillRect(0, 13, w, 3);
  g.fillStyle = '#e1b52e'; g.fillRect(0, 16, w, 1);
  g.fillStyle = '#244f96'; g.fillRect(0, 18, w, 3);
  g.fillStyle = '#1e7d4a'; for (let x = 2; x < w; x += 10) { g.fillRect(x, 23, 5, 2); }
  g.fillStyle = '#c42f25'; g.font = 'bold 6px sans-serif'; g.fillText('MALIGAYA', 18, 30);
});
T.chrome = tex(16, 16, (g, w, h) => { g.fillStyle = '#7d7c76'; g.fillRect(0, 0, w, h); g.fillStyle = '#dcdbd4'; for (let y = 0; y < 16; y += 2) g.fillRect(0, y, 16, 1); g.fillStyle = '#4a4944'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16); }, 4, 1);
T.shelf = tex(64, 32, (g, w, h) => {
  g.fillStyle = '#2a1d10'; g.fillRect(0, 0, w, h);
  const cols = ['#d23b2c', '#e8c43a', '#2f6fc0', '#3fa35a', '#e07a2e', '#f0ece0', '#8a3fb0'];
  for (let row = 0; row < 3; row++) {
    for (let x = 1; x < w - 2; x += 3) { g.fillStyle = pick(cols); g.fillRect(x, row * 10 + 2, 2, 7); }
    g.fillStyle = '#5a4026'; g.fillRect(0, row * 10 + 9, w, 1);
  }
  g.fillStyle = '#1a140e'; for (let i = 0; i < 64; i += 5) g.fillRect(i, 0, 1, 32); for (let j = 0; j < 32; j += 5) g.fillRect(0, j, 64, 1);
}, 1, 1);
T.grill = tex(32, 32, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#2c2a28';
  for (let i = 0; i < 32; i += 4) g.fillRect(i, 0, 1, 32);
  g.fillRect(0, 0, 32, 1); g.fillRect(0, 31, 32, 1); g.fillRect(0, 15, 32, 1);
  g.strokeStyle = '#2c2a28'; g.beginPath(); g.arc(16, 15, 6, 0, Math.PI * 2); g.stroke();
}, 3, 1);
function windowTex(lit) {
  return tex(32, 32, (g, w, h) => {
    g.fillStyle = '#4f4a40'; g.fillRect(0, 0, w, h);
    if (lit) {
      const gr = g.createLinearGradient(0, 3, 0, 29); gr.addColorStop(0, '#f2c27a'); gr.addColorStop(1, '#a8682a');
      g.fillStyle = gr; g.fillRect(3, 3, 26, 26);
      g.fillStyle = pick(['#8a2f3a', '#2f5a8a', '#6a8a2f', '#8a6a2f']);
      g.fillRect(3, 3, 7, 26); g.fillRect(22, 3, 7, 26);
      g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 3; y < 29; y += 3) { g.fillRect(4, y, 5, 1); g.fillRect(23, y, 5, 1); }
      if (Math.random() < 0.35) { g.fillStyle = 'rgba(30,18,8,.85)'; g.fillRect(13, 12, 6, 17); g.fillRect(14, 8, 4, 4); }
    } else {
      g.fillStyle = '#0c0f17'; g.fillRect(3, 3, 26, 26);
      g.fillStyle = '#18202e'; g.fillRect(5, 5, 4, 10);
    }
    g.fillStyle = '#2a2724'; for (let x = 3; x < 29; x += 4) g.fillRect(x, 3, 1, 26); g.fillRect(3, 15, 26, 1);
    g.fillStyle = '#6a6355'; g.fillRect(0, 0, 32, 3); g.fillRect(0, 29, 32, 3); g.fillRect(0, 0, 3, 32); g.fillRect(29, 0, 3, 32);
  });
}
T.winLit = [windowTex(true), windowTex(true), windowTex(true)];
T.winDark = [windowTex(false), windowTex(false)];
T.door = tex(32, 64, (g, w, h) => {
  g.fillStyle = '#4a3220'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a2618'; for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 1, h);
  speckle(g, w, h, 120, ['#553a26', '#3e2a1a']);
  g.fillStyle = '#2b2a28'; for (let x = 2; x < w; x += 5) g.fillRect(x, 0, 1, h); g.fillRect(0, 20, w, 1); g.fillRect(0, 44, w, 1);
  g.fillStyle = '#c9a548'; g.fillRect(25, 34, 2, 2);
});
function signTex(text, sub, bg, fg, w = 128, h = 32) {
  return tex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `bold ${Math.round(h * 0.42)}px sans-serif`; g.textAlign = 'center'; g.fillText(text, w / 2, h * 0.5);
    g.font = `${Math.round(h * 0.26)}px sans-serif`; g.fillText(sub, w / 2, h * 0.86);
    speckle(g, w, h, w * h * 0.06, ['rgba(0,0,0,.22)', 'rgba(255,255,255,.08)']);
    g.fillStyle = 'rgba(40,20,10,.25)'; for (let i = 0; i < 4; i++) g.fillRect(Math.floor(rnd(0, w)), 0, 2, Math.floor(rnd(4, h)));
  });
}
function furTex(kind) {
  return tex(32, 32, (g, w, h) => {
    const base = { orange: '#cf7b31', black: '#1d1c20', white: '#ddd8cc', gray: '#76736f', calico: '#e6dfd0', tabby: '#8d6c47' }[kind];
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    if (kind === 'calico') {
      g.fillStyle = '#c9772f'; g.fillRect(3, 4, 11, 9); g.fillRect(18, 18, 10, 9);
      g.fillStyle = '#1d1c20'; g.fillRect(19, 2, 8, 7); g.fillRect(2, 19, 8, 8);
    }
    if (kind === 'tabby' || kind === 'orange' || kind === 'gray') {
      g.fillStyle = kind === 'orange' ? 'rgba(120,50,10,.45)' : 'rgba(0,0,0,.32)';
      for (let y = 1; y < h; y += 4) { g.fillRect(0, y, w, 2); }
    }
    speckle(g, w, h, 140, ['rgba(0,0,0,.14)', 'rgba(255,255,255,.12)']);
  });
}
T.sky = tex(64, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#020309'); gr.addColorStop(0.35, '#080c1b'); gr.addColorStop(0.47, '#1a1a2e');
  gr.addColorStop(0.5, '#3a2a3a'); gr.addColorStop(0.53, '#141522'); gr.addColorStop(1, '#040407');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(80,82,110,${rnd(0.02, 0.06)})`; const cx = rnd(0, w), cy = rnd(70, 124), r = rnd(3, 10); g.beginPath(); g.ellipse(cx, cy, r * 1.8, r * 0.6, 0, 0, Math.PI * 2); g.fill(); }
  speckle(g, w, 90, 50, ['rgba(220,220,255,.6)', 'rgba(255,255,255,.35)']);
}, 4, 1);
T.sky.wrapT = THREE.ClampToEdgeWrapping;


// Soft glow used for cat eyeshine and the stalker's eyes.
const glowTex = tex(16, 16, (g) => { const r = g.createRadialGradient(8, 8, 0, 8, 8, 8); r.addColorStop(0, 'rgba(255,245,170,1)'); r.addColorStop(0.4, 'rgba(230,210,110,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 16, 16); });
glowTex.magFilter = THREE.LinearFilter;

export { tex, speckle, T, wallTex, windowTex, signTex, furTex, glowTex };
