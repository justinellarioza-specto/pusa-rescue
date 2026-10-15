// All sound is synthesized with the Web Audio API: meows, rain, thunder, heartbeat, scream.
// Audio unlocks on the first tap or key press (browsers require a user gesture).
import { settings } from './core/storage.js';
import { rnd } from './core/util.js';

let AC = null, master = null, silentEl = null;
function silentWav() {
  const n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, str) => { for (let i = 0; i < str.length; i++) b[o + i] = str.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  b.fill(128, 44); let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return 'data:audio/wav;base64,' + btoa(s);
}
function audioOn() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  try {
    if (!silentEl) { silentEl = new Audio(silentWav()); silentEl.loop = true; silentEl.setAttribute('playsinline', ''); }
    const pr = silentEl.play(); if (pr && pr.catch) pr.catch(() => {});
  } catch (e) {}
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.connect(AC.destination); }
    master.gain.value = settings.vol * 1.4;
    if (AC.state === 'suspended') AC.resume();
    rainSound();
  } catch (e) { AC = null; }
}
const unlock = () => { audioOn(); if (AC && AC.state === 'running') { removeEventListener('pointerdown', unlock, true); removeEventListener('keydown', unlock, true); } };
addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);
document.addEventListener('visibilitychange', () => { if (!document.hidden && AC && AC.state !== 'running') AC.resume(); });
function meow(vol, pan = 0, pitch = 1) {
  if (!AC) return;
  const t = AC.currentTime, o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(480 * pitch, t); o.frequency.linearRampToValueAtTime(820 * pitch, t + 0.16); o.frequency.linearRampToValueAtTime(400 * pitch, t + 0.6);
  f.type = 'bandpass'; f.frequency.value = 1150; f.Q.value = 2.2;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.002), t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
  let node = o.connect(f).connect(g);
  if (AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan; node = node.connect(p); }
  node.connect(master); o.start(t); o.stop(t + 0.7);
}
function tone(freq, start, dur, vol, type = 'sine') {
  if (!AC) return;
  const t = AC.currentTime + start, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function chirp() { for (let i = 0; i < 3; i++) tone(rnd(4100, 4500), i * 0.07, 0.05, 0.03); }
function tick() { tone(660, 0, 0.06, 0.05, 'triangle'); }
function chime() { tone(988, 0, 0.18, 0.08); tone(1319, 0.09, 0.3, 0.08); }
function thud() {
  if (!AC) return;
  const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
  g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.5);
}
function heartbeat(vol) {
  if (!AC) return;
  [0, 0.2].forEach((d, i) => {
    const t = AC.currentTime + d, o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * (i ? 0.6 : 1), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.25);
  });
}
let noiseBuf = null, rainNode = null;
function makeNoise() {
  if (noiseBuf || !AC) return;
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function rainSound() {
  if (!AC || rainNode) return; makeNoise();
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.5;
  const g = AC.createGain(); g.gain.value = 0.09;
  s.connect(f).connect(g).connect(master); s.start(); rainNode = s;
}
function thunder() {
  if (!AC) return; makeNoise();
  const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(90, t + 2.5);
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 3);
}
function scream() {
  if (!AC) return; makeNoise();
  const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(380, t + 1.2); f.Q.value = 1.4;
  const g = AC.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 1.5);
  const o = AC.createOscillator(), g2 = AC.createGain(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(950, t); o.frequency.exponentialRampToValueAtTime(110, t + 1.2);
  g2.gain.setValueAtTime(0.35, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  o.connect(g2).connect(master); o.start(t); o.stop(t + 1.4);
}


export function setVolume(v) { if (master) master.gain.value = v * 1.4; }

export { audioOn, meow, tone, chirp, tick, chime, thud, heartbeat, rainSound, thunder, scream };
