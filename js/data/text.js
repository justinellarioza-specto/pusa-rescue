// Every line of in-game text that changes during play (dialogue, prompts, results).
// Menu labels live in index.html. To translate the game, copy this file and swap the strings.

export const TXT = {
  intro: {
    classic: [
      'Lola: Apo, may bagyo bukas.',
      'Lola: Hanapin mo yung walong pusang gala sa kalye.',
      'Lola: Dalhin mo sila dito sa kahon, sa likod mo.',
      'Lola: Bago maghatinggabi, ha?',
    ],
    horror: [
      'Lola: Apo... may kakaiba ngayong gabi.',
      'Lola: Kapag may nakita kang nakatayo sa dilim...',
      'Lola: Huwag mong aalisin ang ilaw sa kanya.',
    ],
    build: (night, total) => [
      `Gabi ${night}. ${total} pusa ang nasa labas.`,
      night === 1 ? 'Lola: Bawat pusang maiuuwi mo, may baon ka.' : 'Lola: Nandito lang ako sa kanlungan, apo.',
    ],
  },
  weather: {
    ulan: 'Umuulan',
    bagyo: 'Malakas ang bagyo',
    ambon: 'Umaambon lang',
    aliwalas: 'Maaliwalas ang gabi',
  },
  grabbed: ['Nakuha mo siya.', 'Sige, takbo sa kahon ni Lola.', 'Ayan, ligtas ka na.', 'Mrrp?'],
  lastOne: 'Ayan na lahat... balik na tayo kay Lola.',
  named: (name) => `Ikaw na si ${name}.`,
  reward: (coins, name) => `+₱${coins} · ${name}`,
  battery: '+ BATERYA',
  promptCat: (touch) => (touch ? 'KUNIN ang pusa' : '[E] Kunin ang pusa'),
  promptBattery: (touch) => (touch ? 'KUNIN ang baterya' : '[E] Kunin ang baterya'),
  nearMeow: '...meow?',
  hint: (where) => `Lola: Baka ${where}...`,
  noise: '...ano yun?',
  stalkerAppears: '...may tao ba diyan?',
  stalkerGone: '...nawala siya.',
  count: (found, total) => `PUSA <b>${found}</b>/${total}`,
  coins: (coins) => `₱<b>${coins}</b>`,
  result: {
    caughtTitle: 'NAHULI KA',
    caught: (saved, total) => `Inabutan ka niya sa dilim. ${saved} sa ${total} pusa ang nakauwi bago nangyari iyon.`,
    wonTitle: 'LIGTAS NA SILA',
    wonHorror: (total) => `Nakauwi ang lahat ng ${total} pusa. Hindi ka niya naabutan... ngayong gabi.`,
    wonClassic: (total, time) => `Salamat, apo. Lahat ng ${total} pusa ay nasa kahon na ni Lola. Oras: ${time}.`,
    timeTitle: 'HATINGGABI NA',
    time: (saved, total) =>
      `${saved} sa ${total} pusa ang nakauwi. May ${total - saved} pang naiwan sa labas... naririnig mo pa sila.`,
  },
  night: {
    won: (n, total, coins, bonus) =>
      `Gabi ${n}: nailigtas mo lahat ng ${total}. Kinita: ₱${coins} (may bonus na ₱${bonus}).`,
    partial: (n, found, total, coins) =>
      `Gabi ${n}: ${found} sa ${total} ang naiuwi bago maghatinggabi. Kinita: ₱${coins}.`,
    welcome: (count) => `Maligayang pagbabalik. ${count} pusa ang nakatira na sa kanlungan.`,
    title: (n) => `KANLUNGAN · GABI ${n}`,
    start: (n) => `SIMULAN ANG GABI ${n}`,
  },
  fur: {
    orange: 'Orange',
    black: 'Itim',
    white: 'Puti',
    gray: 'Abo',
    calico: 'Calico (tatlong kulay)',
    tabby: 'Tabby (guhit-guhit)',
  },
  card: (cat) =>
    [
      `Balahibo: ${TXT.fur[cat.kind] || cat.kind}`,
      `Nailigtas: Gabi ${cat.night}`,
      cat.where ? `Natagpuan ${cat.where}` : '',
    ].filter(Boolean),
  nameError: 'Maglagay ng pangalan (hanggang 16 na letra).',
  photoSaved: 'Na-save ang larawan',
  noFullscreen: 'Hindi pinapayagan ang fullscreen dito',
  best: (time) => `Pinakamabilis: ${time}`,
  noBest: 'Wala pang record',
  buildStatus: (night, coins, count) => `Gabi ${night} · ₱${coins} · ${count} alaga`,
  buildNew: 'Gabi 1 · Bagong kanlungan',
  level: (lv, max) => `ANTAS ${lv}/${max}`,
  maxed: 'TAPOS',
  rosterLabel: (n) => `Mga alaga (${n})`,
  rosterEmpty: 'Wala pa',
};
