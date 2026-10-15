// Wires up every menu button: main menu, mode select, settings, pause and results.
import { settings, saveSettings, save, best, resetProgress } from '../core/storage.js';
import { audioOn, rainSound, setVolume } from '../audio.js';
import { applyQuality } from '../engine/quality.js';
import { $, nav, show, toggleFull } from './screens.js';
import { startGame, resumeGame, toMenu, openShelter, getState, getMode } from '../game.js';

function refreshModeLabels() {
  $('bestClassic').textContent = best.classic ? `Pinakamabilis: ${Math.floor(best.classic / 60)}:${String(best.classic % 60).padStart(2, '0')}` : 'Wala pang record';
  $('buildStatus').textContent = save.night > 1 || save.cats.length ? `Gabi ${save.night} · ₱${save.coins} · ${save.cats.length} alaga` : 'Gabi 1 · Bagong kanlungan';
}
$('mPlay').addEventListener('click', () => { audioOn(); refreshModeLabels(); show('modes'); });
$('mHow').addEventListener('click', () => { nav.backTo = 'menu'; show('how'); });
$('mSet').addEventListener('click', () => { nav.backTo = 'menu'; openSettings(); });
$('mFull').addEventListener('click', toggleFull);
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show(nav.backTo === 'pause' && getState() === 'paused' ? 'pause' : 'menu')));
$('modeClassic').addEventListener('click', () => startGame('classic'));
$('modeHorror').addEventListener('click', () => startGame('horror'));
$('modeBuild').addEventListener('click', () => {
  if (save.night === 1 && !save.cats.length) startGame('build');
  else { audioOn(); rainSound(); openShelter(`Maligayang pagbabalik. ${save.cats.length} pusa ang nakatira na sa kanlungan.`); }
});
$('shNext').addEventListener('click', () => startGame('build'));
$('shMenu').addEventListener('click', toMenu);
$('pResume').addEventListener('click', resumeGame);
$('pSet').addEventListener('click', () => { nav.backTo = 'pause'; openSettings(); });
$('pFull').addEventListener('click', toggleFull);
$('pQuit').addEventListener('click', toMenu);
$('rAgain').addEventListener('click', () => startGame(getMode()));
$('rMenu').addEventListener('click', toMenu);

function openSettings() {
  $('sSens').value = settings.sens; $('sVol').value = settings.vol; $('sQual').value = settings.quality; $('sInv').checked = settings.invert;
  $('resetSave').textContent = 'BURAHIN ANG SAVE'; resetArmed = false;
  show('settings');
}
$('sSens').addEventListener('input', e => { settings.sens = +e.target.value; saveSettings(); });
$('sVol').addEventListener('input', e => { settings.vol = +e.target.value; setVolume(settings.vol); saveSettings(); });
$('sQual').addEventListener('change', e => { settings.quality = e.target.value; saveSettings(); applyQuality(); });
$('sInv').addEventListener('change', e => { settings.invert = e.target.checked; saveSettings(); });
let resetArmed = false;
$('resetSave').addEventListener('click', () => {
  if (!resetArmed) { resetArmed = true; $('resetSave').textContent = 'SIGURADO? I-CLICK ULIT'; return; }
  resetProgress();
  resetArmed = false; $('resetSave').textContent = 'NABURA NA';
});
