// Checks that the game data files are complete and consistent. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAT_SPOTS, CAT_NAMES } from '../js/data/cats.js';
import { SHOP } from '../js/data/shop.js';
import { WEATHER } from '../js/data/weather.js';
import { TXT } from '../js/data/text.js';

const KINDS = ['orange', 'black', 'white', 'gray', 'calico', 'tabby'];

test('there are 12 hiding spots and the first 8 make the Klasik layout', () => {
  assert.equal(CAT_SPOTS.length, 12);
});

test('every hiding spot is inside the street and has a hint', () => {
  for (const s of CAT_SPOTS) {
    assert.ok(KINDS.includes(s.kind), `unknown fur ${s.kind}`);
    const [x, y, z] = s.p;
    assert.ok(Math.abs(x) <= 9 && z <= 6 && z >= -59 && y >= 0 && y < 3, `spot out of bounds: ${s.p}`);
    assert.ok(s.where.startsWith('sa '), `hint should read "sa ...": ${s.where}`);
  }
});

test('every fur kind has a label on the cat card', () => {
  for (const k of KINDS) assert.ok(TXT.fur[k]);
});

test('cat names are unique and short enough to rename', () => {
  assert.equal(new Set(CAT_NAMES).size, CAT_NAMES.length);
  for (const n of CAT_NAMES) assert.ok(n.length <= 16);
});

test('shop prices go up with each level', () => {
  const ids = new Set();
  for (const it of SHOP) {
    assert.ok(!ids.has(it.id), `duplicate upgrade ${it.id}`);
    ids.add(it.id);
    for (let i = 1; i < it.cost.length; i++) assert.ok(it.cost[i] > it.cost[i - 1]);
  }
  assert.deepEqual([...ids].sort(), ['bowls', 'flash', 'home', 'shoes', 'time']);
});

test('every weather has a name and valid values', () => {
  for (const [key, w] of Object.entries(WEATHER)) {
    assert.ok(TXT.weather[key], `missing name for ${key}`);
    assert.ok(w.rain >= 0 && w.rain <= 1);
    assert.ok(w.bolt[0] <= w.bolt[1]);
  }
});

test('templated text fills in values', () => {
  assert.equal(TXT.reward(25, 'Mochi'), '+₱25 · Mochi');
  assert.match(TXT.result.time(3, 8), /3 sa 8/);
  assert.equal(TXT.intro.build(1, 3).length, 2);
  assert.deepEqual(TXT.card({ kind: 'black', night: 2, where: 'sa bubong ng jeep' }), [
    'Balahibo: Itim',
    'Nailigtas: Gabi 2',
    'Natagpuan sa bubong ng jeep',
  ]);
});
