// Shelter upgrades. cost[i] is the price of level i+1; the array length is the max level.
export const SHOP = [
  { id: 'flash', name: 'Stronger flashlight', desc: 'A wider beam that reaches farther.', cost: [40, 90, 150] },
  { id: 'shoes', name: 'Rubber shoes', desc: 'Walk and run faster.', cost: [50, 110] },
  { id: 'time', name: "Lola's coffee", desc: '+45 seconds every night.', cost: [40, 80, 130] },
  {
    id: 'bowls',
    name: 'Food bowls',
    desc: 'Cats outside meow more often.',
    cost: [30, 60, 100],
  },
  {
    id: 'home',
    name: 'Fix up the shelter',
    desc: 'Roof, walls, lights. +₱5 for every cat you bring home.',
    cost: [60, 130, 220],
  },
];
