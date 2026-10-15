// Tests for the pure game rules in js/core/rules.js. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY,
  roundSetup,
  catReward,
  nightBonus,
  upgradeCost,
  canBuy,
  buy,
  pickName,
  cleanName,
  formatTime,
  clockLabel,
  rollWeather,
  inPuddle,
} from '../js/core/rules.js';

const freshSave = () => ({ night: 1, coins: 0, cats: [], up: { flash: 0, shoes: 0, time: 0, bowls: 0, home: 0 } });
const item = { id: 'flash', cost: [40, 90, 150] };

test('Klasik has 8 cats and 5 minutes on Normal', () => {
  const r = roundSetup('classic', freshSave(), 'normal');
  assert.equal(r.total, 8);
  assert.equal(r.timeLimit, 300);
});

test('Lagim has 6 cats', () => {
  assert.equal(roundSetup('horror', freshSave()).total, 6);
});

test('Kanlungan adds a cat every night, up to 8', () => {
  const s = freshSave();
  assert.equal(roundSetup('build', s).total, 3);
  s.night = 4;
  assert.equal(roundSetup('build', s).total, 6);
  s.night = 20;
  assert.equal(roundSetup('build', s).total, 8);
});

test('upgrades only count in Kanlungan', () => {
  const s = freshSave();
  s.up.time = 2;
  s.up.shoes = 1;
  assert.equal(roundSetup('build', s).timeLimit, 150 + 2 * 45);
  assert.ok(roundSetup('build', s).speedMul > 1);
  assert.equal(roundSetup('classic', s).speedMul, 1);
});

test('difficulty changes the time and the stalker speed', () => {
  const easy = roundSetup('classic', freshSave(), 'easy');
  const hard = roundSetup('classic', freshSave(), 'hard');
  assert.ok(easy.timeLimit > 300 && hard.timeLimit < 300);
  assert.ok(hard.stalkerMul > easy.stalkerMul);
  assert.equal(roundSetup('classic', freshSave(), 'nonsense').timeLimit, 300);
  assert.deepEqual(Object.keys(DIFFICULTY), ['easy', 'normal', 'hard']);
});

test('hint interval never drops below 3 seconds', () => {
  const s = freshSave();
  s.up.bowls = 3;
  assert.ok(roundSetup('build', s, 'easy').hintEvery >= 3);
});

test('rewards grow with shelter upgrades and nights', () => {
  const s = freshSave();
  assert.equal(catReward(s), 20);
  s.up.home = 2;
  assert.equal(catReward(s), 30);
  assert.ok(nightBonus(5) > nightBonus(1));
});

test('upgrade cost is null once maxed', () => {
  assert.equal(upgradeCost(item, 0), 40);
  assert.equal(upgradeCost(item, 2), 150);
  assert.equal(upgradeCost(item, 3), null);
});

test('buy spends coins and levels up only when affordable', () => {
  const s = freshSave();
  s.coins = 39;
  assert.equal(canBuy(s, item), false);
  assert.equal(buy(s, item), false);
  assert.equal(s.coins, 39);
  s.coins = 100;
  assert.equal(buy(s, item), true);
  assert.equal(s.coins, 60);
  assert.equal(s.up.flash, 1);
  s.up.flash = 3;
  s.coins = 9999;
  assert.equal(buy(s, item), false);
});

test('pickName never repeats a name', () => {
  const names = ['Muning', 'Siopao'];
  assert.equal(pickName(['Muning'], names), 'Siopao');
  const extra = pickName(['Muning', 'Siopao'], names, () => 0);
  assert.equal(extra, 'Muning 2');
  assert.equal(
    pickName(['Muning', 'Siopao', 'Muning 2'], names, () => 0),
    'Muning 3',
  );
});

test('cleanName trims and rejects empty or long names', () => {
  assert.equal(cleanName('  Mochi   Jr '), 'Mochi Jr');
  assert.equal(cleanName('   '), null);
  assert.equal(cleanName(''), null);
  assert.equal(cleanName(undefined), null);
  assert.equal(cleanName('x'.repeat(17)), null);
});

test('time and clock labels', () => {
  assert.equal(formatTime(222), '3:42');
  assert.equal(formatTime(5), '0:05');
  assert.equal(clockLabel(300, 300), '11:00 PM');
  assert.equal(clockLabel(150, 300), '11:30 PM');
  assert.equal(clockLabel(0, 300), '12:00 AM');
});

test('weather: Lagim is always rainy or stormy', () => {
  for (let i = 0; i < 50; i++) assert.ok(['ulan', 'bagyo'].includes(rollWeather('horror')));
  assert.equal(
    rollWeather('classic', () => 0),
    'ulan',
  );
  assert.equal(
    rollWeather('classic', () => 0.999),
    'aliwalas',
  );
});

test('inPuddle uses elliptical puddles', () => {
  const puddles = [[0, 0, 2, 1]];
  assert.equal(inPuddle(1.5, 0, puddles), true);
  assert.equal(inPuddle(0, 1.5, puddles), false);
  assert.equal(inPuddle(10, 10, puddles), false);
});
