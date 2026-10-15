// Wires up every menu button: main menu, mode select, settings, pause and results.
import { settings, saveSettings, save, best, resetProgress } from '../core/storage.js';
import { formatTime } from '../core/rules.js';
import { TXT } from '../data/text.js';
import { audioOn, rainSound, setVolume } from '../audio.js';
import { applyQuality } from '../engine/quality.js';
import { $, nav, show, toggleFull, applyA11y } from './screens.js';
import { startGame, resumeGame, toMenu, openShelter, enterPhoto, getState, getMode } from '../game.js';

function refreshModeLabels() {
  $('bestClassic').textContent = best.classic ? TXT.best(formatTime(best.classic)) : TXT.noBest;
  $('buildStatus').textContent =
    save.night > 1 || save.cats.length ? TXT.buildStatus(save.night, save.coins, save.cats.length) : TXT.buildNew;
  $('sDiff').value = settings.diff;
}

// main menu
$('mPlay').addEventListener('click', () => {
  audioOn();
  refreshModeLabels();
  show('modes');
});
$('mHow').addEventListener('click', () => {
  nav.backTo = 'menu';
  show('how');
});
$('mSet').addEventListener('click', () => {
  nav.backTo = 'menu';
  openSettings();
});
$('mFull').addEventListener('click', toggleFull);

// BUMALIK buttons return to the pause menu if a round is paused, otherwise to the main menu
export function goBack() {
  if (!$('catCard').hidden) {
    $('catCard').hidden = true;
    return;
  }
  if (!$('shelter').hidden) return;
  if (!$('pause').hidden) {
    resumeGame();
    return;
  }
  if (!$('result').hidden || !$('menu').hidden) return;
  show(nav.backTo === 'pause' && getState() === 'paused' ? 'pause' : 'menu');
}
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', goBack));

// mode select
$('sDiff').addEventListener('change', (e) => {
  settings.diff = e.target.value;
  saveSettings();
});
$('modeClassic').addEventListener('click', () => startGame('classic'));
$('modeHorror').addEventListener('click', () => startGame('horror'));
$('modeBuild').addEventListener('click', () => {
  if (save.night === 1 && !save.cats.length) startGame('build');
  else {
    audioOn();
    rainSound();
    openShelter(TXT.night.welcome(save.cats.length));
  }
});

// Kanlungan, pause and results
$('shNext').addEventListener('click', () => startGame('build'));
$('shMenu').addEventListener('click', toMenu);
$('pResume').addEventListener('click', resumeGame);
$('pPhoto').addEventListener('click', enterPhoto);
$('pSet').addEventListener('click', () => {
  nav.backTo = 'pause';
  openSettings();
});
$('pFull').addEventListener('click', toggleFull);
$('pQuit').addEventListener('click', toMenu);
$('rAgain').addEventListener('click', () => startGame(getMode()));
$('rMenu').addEventListener('click', toMenu);

// settings
function openSettings() {
  $('sSens').value = settings.sens;
  $('sVol').value = settings.vol;
  $('sQual').value = settings.quality;
  $('sInv').checked = settings.invert;
  $('sSubs').checked = settings.subs;
  $('sCalm').checked = settings.calm;
  $('sBig').checked = settings.bigHud;
  $('sFps').checked = settings.fps;
  $('resetSave').textContent = 'BURAHIN ANG SAVE';
  resetArmed = false;
  show('settings');
}
const bindCheck = (id, key) =>
  $(id).addEventListener('change', (e) => {
    settings[key] = e.target.checked;
    saveSettings();
    applyA11y();
  });
$('sSens').addEventListener('input', (e) => {
  settings.sens = +e.target.value;
  saveSettings();
});
$('sVol').addEventListener('input', (e) => {
  settings.vol = +e.target.value;
  setVolume(settings.vol);
  saveSettings();
});
$('sQual').addEventListener('change', (e) => {
  settings.quality = e.target.value;
  saveSettings();
  applyQuality();
});
bindCheck('sInv', 'invert');
bindCheck('sSubs', 'subs');
bindCheck('sCalm', 'calm');
bindCheck('sBig', 'bigHud');
bindCheck('sFps', 'fps');

let resetArmed = false;
$('resetSave').addEventListener('click', () => {
  if (!resetArmed) {
    resetArmed = true;
    $('resetSave').textContent = 'SIGURADO? I-CLICK ULIT';
    return;
  }
  resetProgress();
  resetArmed = false;
  $('resetSave').textContent = 'NABURA NA';
});
