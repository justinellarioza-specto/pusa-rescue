// Every line of in-game text that changes during play (dialogue, prompts, results).
// Menu labels live in index.html. To translate the game, copy this file and swap the strings.
import { CAT_SPOTS, LEGACY_WHERE } from './cats.js';

// Cats saved before the English update stored their hiding spot in Tagalog.
const whereText = (where) => {
  const i = LEGACY_WHERE.indexOf(where);
  return i >= 0 ? CAT_SPOTS[i].where : where;
};

export const TXT = {
  intro: {
    classic: [
      "Lola: There's a storm coming tomorrow, dear.",
      'Lola: Find the eight stray cats out on the street.',
      'Lola: Bring them here to the box behind you.',
      'Lola: Before midnight, okay?',
    ],
    horror: [
      'Lola: Something feels wrong tonight, dear...',
      'Lola: If you see someone standing in the dark...',
      "Lola: Don't take your light off them.",
    ],
    build: (night, total) => [
      `Night ${night}. ${total} cats are out there.`,
      night === 1
        ? 'Lola: Every cat you bring home earns you some pocket money.'
        : "Lola: I'll be right here at the shelter.",
    ],
  },
  weather: {
    ulan: "It's raining",
    bagyo: 'A strong storm',
    ambon: 'Just a drizzle',
    aliwalas: 'A clear night',
  },
  grabbed: ['Got you.', "Go on, run to Lola's box.", "There, you're safe now.", 'Mrrp?'],
  lastOne: "That's all of them... let's head back to Lola.",
  named: (name) => `Your name is ${name} now.`,
  reward: (coins, name) => `+₱${coins} · ${name}`,
  battery: '+ BATTERY',
  promptCat: (touch) => (touch ? 'PICK UP the cat' : '[E] Pick up the cat'),
  promptBattery: (touch) => (touch ? 'PICK UP the battery' : '[E] Pick up the battery'),
  nearMeow: '...meow?',
  hint: (where) => `Lola: Maybe ${where}...`,
  noise: '...what was that?',
  stalkerAppears: '...is someone there?',
  stalkerGone: '...it disappeared.',
  count: (found, total) => `CATS <b>${found}</b>/${total}`,
  coins: (coins) => `₱<b>${coins}</b>`,
  result: {
    caughtTitle: 'CAUGHT',
    caught: (saved, total) => `It caught you in the dark. ${saved} of ${total} cats made it home before that.`,
    wonTitle: "THEY'RE SAFE",
    wonHorror: (total) => `All ${total} cats made it home. It didn't catch you... tonight.`,
    wonClassic: (total, time) => `Thank you, dear. All ${total} cats are in Lola's box. Time: ${time}.`,
    timeTitle: "IT'S MIDNIGHT",
    time: (saved, total) =>
      `${saved} of ${total} cats made it home. ${total - saved} are still out there... you can still hear them.`,
  },
  night: {
    won: (n, total, coins, bonus) =>
      `Night ${n}: you saved all ${total}. Earned: ₱${coins} (including a ₱${bonus} bonus).`,
    partial: (n, found, total, coins) =>
      `Night ${n}: ${found} of ${total} made it home before midnight. Earned: ₱${coins}.`,
    welcome: (count) => `Welcome back. ${count} cats live at the shelter now.`,
    title: (n) => `SHELTER · NIGHT ${n}`,
    start: (n) => `START NIGHT ${n}`,
  },
  fur: {
    orange: 'Orange',
    black: 'Black',
    white: 'White',
    gray: 'Gray',
    calico: 'Calico (three colors)',
    tabby: 'Tabby (striped)',
  },
  card: (cat) =>
    [
      `Fur: ${TXT.fur[cat.kind] || cat.kind}`,
      `Rescued: Night ${cat.night}`,
      cat.where ? `Found ${whereText(cat.where)}` : '',
    ].filter(Boolean),
  nameError: 'Enter a name (up to 16 letters).',
  photoSaved: 'Photo saved',
  noFullscreen: "Fullscreen isn't allowed here",
  best: (time) => `Best time: ${time}`,
  noBest: 'No record yet',
  buildStatus: (night, coins, count) => `Night ${night} · ₱${coins} · ${count} cats`,
  buildNew: 'Night 1 · New shelter',
  level: (lv, max) => `LEVEL ${lv}/${max}`,
  maxed: 'MAXED',
  rosterLabel: (n) => `Your cats (${n})`,
  rosterEmpty: 'None yet',
};
