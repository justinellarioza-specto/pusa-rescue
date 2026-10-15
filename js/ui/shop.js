// Kanlungan screen: the upgrade list, the roster of named cats and each cat's card.
import { $ } from './screens.js';
import { save, writeSave } from '../core/storage.js';
import { SHOP } from '../data/shop.js';
import { TXT } from '../data/text.js';
import { upgradeCost, canBuy, buy, cleanName } from '../core/rules.js';
import { audioOn, chime, meow } from '../audio.js';
import { applyShelterLook } from '../world/shelter.js';

export function renderShop() {
  $('shCoins').textContent = save.coins;
  $('shopList').innerHTML = '';
  SHOP.forEach((it) => {
    const lv = save.up[it.id],
      max = it.cost.length,
      cost = upgradeCost(it, lv);
    const row = document.createElement('div');
    row.className = 'up';
    row.innerHTML = `<b></b><span class="lv"></span><span></span><button class="btn" type="button"></button>`;
    row.children[0].textContent = it.name;
    row.children[1].textContent = TXT.level(lv, max);
    row.children[2].textContent = it.desc;
    const b = row.children[3];
    b.textContent = cost === null ? TXT.maxed : `₱${cost}`;
    b.disabled = !canBuy(save, it);
    b.addEventListener('click', () => {
      if (!buy(save, it)) return;
      writeSave();
      audioOn();
      chime();
      applyShelterLook(true);
      renderShop();
    });
    $('shopList').appendChild(row);
  });
  renderRoster();
}

function renderRoster() {
  $('rosterLabel').textContent = TXT.rosterLabel(save.cats.length);
  const box = $('roster');
  box.innerHTML = '';
  if (!save.cats.length) {
    const s = document.createElement('span');
    s.textContent = TXT.rosterEmpty;
    box.appendChild(s);
    return;
  }
  for (let i = save.cats.length - 1; i >= 0; i--) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pet';
    b.textContent = save.cats[i].name;
    b.addEventListener('click', () => openCard(i));
    box.appendChild(b);
  }
}

// ---------- cat card ----------
let cardIndex = -1;
function openCard(i) {
  const cat = save.cats[i];
  if (!cat) return;
  cardIndex = i;
  $('ccName').textContent = cat.name;
  const info = $('ccInfo');
  info.innerHTML = '';
  TXT.card(cat).forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    info.appendChild(li);
  });
  $('ccInput').value = cat.name;
  $('ccErr').hidden = true;
  $('catCard').hidden = false;
  audioOn();
  meow(0.18, 0, 1.15);
  $('ccInput').focus({ preventScroll: true });
}
function saveName() {
  const name = cleanName($('ccInput').value);
  if (!name) {
    $('ccErr').textContent = TXT.nameError;
    $('ccErr').hidden = false;
    return;
  }
  save.cats[cardIndex].name = name;
  writeSave();
  chime();
  $('ccName').textContent = name;
  renderRoster();
}
$('ccSave').addEventListener('click', saveName);
$('ccInput').addEventListener('input', () => {
  $('ccErr').hidden = true;
});
$('ccInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveName();
  }
});
$('ccClose').addEventListener('click', () => {
  $('catCard').hidden = true;
  cardIndex = -1;
});
export const closeCard = () => {
  $('catCard').hidden = true;
};
