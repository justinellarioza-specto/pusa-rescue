// Save data works even where localStorage is missing (like Node or a private window). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settings, save, best, resetProgress } from '../js/core/storage.js';

test('defaults load when nothing is saved', () => {
  assert.equal(settings.quality, 'med');
  assert.equal(settings.diff, 'normal');
  assert.equal(settings.subs, true);
  assert.equal(save.night, 1);
  assert.deepEqual(save.cats, []);
});

test('resetProgress wipes progress in place', () => {
  const ref = save;
  save.night = 7;
  save.coins = 500;
  save.cats.push({ name: 'Mochi', kind: 'white', night: 3 });
  save.up.home = 3;
  best.classic = 100;
  resetProgress();
  assert.equal(ref, save);
  assert.equal(save.night, 1);
  assert.equal(save.coins, 0);
  assert.deepEqual(save.cats, []);
  assert.equal(save.up.home, 0);
  assert.equal(best.classic, null);
});
