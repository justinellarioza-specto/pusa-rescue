// Weather presets, picked at random each round (see rollWeather in core/rules.js).
// rain: share of raindrops · rainVol: rain sound · bolt: seconds between lightning [min, max]
// wind: flag/laundry sway · fog: added to fog density · moon: show the moon · moonLight: moonlight strength
export const WEATHER = {
  ulan: { rain: 1, rainVol: 1, bolt: [14, 28], wind: 1, fog: 0, moon: false, moonLight: 0.3 },
  bagyo: { rain: 1, rainVol: 1.9, bolt: [5, 11], wind: 2.3, fog: 0.012, moon: false, moonLight: 0.22 },
  ambon: { rain: 0.3, rainVol: 0.4, bolt: [40, 80], wind: 0.6, fog: -0.008, moon: false, moonLight: 0.36 },
  aliwalas: { rain: 0, rainVol: 0, bolt: [Infinity, Infinity], wind: 0.35, fog: -0.016, moon: true, moonLight: 0.6 },
};
