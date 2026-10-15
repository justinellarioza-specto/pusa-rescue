// Pure game rules: no DOM, no three.js, so they can be unit tested with `npm test`.

export const DIFFICULTY = {
  easy: { label: 'Madali', time: 1.4, hint: -3, stalker: 0.75 },
  normal: { label: 'Normal', time: 1, hint: 0, stalker: 1 },
  hard: { label: 'Mahirap', time: 0.8, hint: 4, stalker: 1.3 },
};

const NO_UPGRADES = { flash: 0, shoes: 0, time: 0, bowls: 0, home: 0 };

// Everything that changes per mode / difficulty / Kanlungan upgrades, worked out once per round.
export function roundSetup(mode, save, diffKey = 'normal') {
  const diff = DIFFICULTY[diffKey] || DIFFICULTY.normal;
  const build = mode === 'build';
  const up = build ? save.up : NO_UPGRADES;
  let total = 8,
    baseTime = 300;
  if (mode === 'horror') total = 6;
  if (build) {
    total = Math.min(8, 2 + save.night);
    baseTime = 150 + up.time * 45;
  }
  return {
    total,
    timeLimit: Math.round(baseTime * diff.time),
    hintEvery: Math.max(3, 9 - up.bowls * 2 + diff.hint),
    speedMul: 1 + up.shoes * 0.18,
    flashAngle: 0.42 + up.flash * 0.07,
    flashDistance: 24 + up.flash * 5,
    flashBase: 3.0 + up.flash * 0.4,
    stalkerMul: diff.stalker,
  };
}

export const catReward = (save) => 20 + save.up.home * 5;
export const nightBonus = (night) => 30 + night * 5;

export function upgradeCost(item, level) {
  return level < item.cost.length ? item.cost[level] : null;
}
export function canBuy(save, item) {
  const cost = upgradeCost(item, save.up[item.id]);
  return cost !== null && save.coins >= cost;
}
// Spends coins and raises the level. Returns false (and changes nothing) if not affordable.
export function buy(save, item) {
  if (!canBuy(save, item)) return false;
  save.coins -= upgradeCost(item, save.up[item.id]);
  save.up[item.id]++;
  return true;
}

// Picks a name nobody at the shelter has yet; adds a number once every name is taken.
export function pickName(usedNames, names, rand = Math.random) {
  const used = new Set(usedNames);
  const free = names.filter((n) => !used.has(n));
  if (free.length) return free[Math.floor(rand() * free.length)];
  const base = names[Math.floor(rand() * names.length)];
  let i = 2;
  while (used.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

// Cleans up a name typed by the player. Returns null if it can't be used.
export function cleanName(raw, maxLen = 16) {
  const s = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s || s.length > maxLen) return null;
  return s;
}

export const formatTime = (secs) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

// 11:00 PM at the start of the round, 12:00 AM when time runs out.
export function clockLabel(timeLeft, timeLimit) {
  if (timeLeft <= 0) return '12:00 AM';
  const mins = Math.min(59, Math.floor((1 - timeLeft / timeLimit) * 60));
  return `11:${String(mins).padStart(2, '0')} PM`;
}

// Random weather for a round. LAGIM is always wet and stormy.
export function rollWeather(mode, rand = Math.random) {
  const table =
    mode === 'horror'
      ? [
          ['ulan', 1],
          ['bagyo', 1],
        ]
      : [
          ['ulan', 3],
          ['ambon', 2],
          ['bagyo', 1.5],
          ['aliwalas', 1.5],
        ];
  const sum = table.reduce((a, [, w]) => a + w, 0);
  let r = rand() * sum;
  for (const [k, w] of table) {
    if ((r -= w) < 0) return k;
  }
  return table[0][0];
}

// Is a point inside one of the elliptical puddles [x, z, radiusX, radiusZ]?
export function inPuddle(x, z, puddles) {
  return puddles.some(([px, pz, sx, sz]) => ((x - px) / sx) ** 2 + ((z - pz) / sz) ** 2 < 1);
}
