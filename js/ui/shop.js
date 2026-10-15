// Renders the Kanlungan upgrade list and the roster of named cats.
import { $ } from './screens.js';
import { save, writeSave } from '../core/storage.js';
import { SHOP } from '../data/shop.js';
import { audioOn, chime } from '../audio.js';
import { applyShelterLook } from '../world/shelter.js';

export function renderShop() {
  $('shCoins').textContent = save.coins;
  $('shopList').innerHTML = '';
  SHOP.forEach(it => {
    const lv = save.up[it.id], max = it.cost.length, cost = it.cost[lv];
    const row = document.createElement('div'); row.className = 'up';
    row.innerHTML = `<b></b><span class="lv"></span><span></span><button class="btn" type="button"></button>`;
    row.children[0].textContent = it.name;
    row.children[1].textContent = `ANTAS ${lv}/${max}`;
    row.children[2].textContent = it.desc;
    const b = row.children[3];
    b.textContent = lv >= max ? 'TAPOS' : `₱${cost}`;
    b.disabled = lv >= max || save.coins < cost;
    b.addEventListener('click', () => { if (lv >= max || save.coins < cost) return; save.coins -= cost; save.up[it.id]++; writeSave(); audioOn(); chime(); applyShelterLook(true); renderShop(); });
    $('shopList').appendChild(row);
  });
  $('rosterLabel').textContent = `Mga alaga (${save.cats.length})`;
  $('roster').innerHTML = '';
  save.cats.slice().reverse().forEach(c => { const s = document.createElement('span'); s.textContent = c.name; $('roster').appendChild(s); });
  if (!save.cats.length) { const s = document.createElement('span'); s.textContent = 'Wala pa'; $('roster').appendChild(s); }
}
