// Everything saved in the player's browser: settings, Kanlungan progress and best times.
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

export const settings = Object.assign({ sens: 1, vol: 0.8, quality: 'med', invert: false }, store.get('pr-settings', {}));
export const saveSettings = () => store.set('pr-settings', settings);

const SAVE0 = { night: 1, coins: 0, cats: [], up: { flash: 0, shoes: 0, time: 0, bowls: 0, home: 0 } };
const freshSave = () => JSON.parse(JSON.stringify(SAVE0));

export const save = Object.assign(freshSave(), store.get('pr-save', {}));
save.up = Object.assign({}, SAVE0.up, save.up);
export const writeSave = () => store.set('pr-save', save);

export const best = store.get('pr-best', { classic: null });
export const writeBest = () => store.set('pr-best', best);

// Wipes Kanlungan progress and best times (objects are reset in place so imports stay valid).
export function resetProgress() {
  Object.assign(save, freshSave());
  best.classic = null;
  writeSave(); writeBest();
}
