// Game-wide tuning numbers. Change these to change how the game feels.
export const REACH = 2.7; // how close (metres) you must be to pick up a cat
export const WALK = 3.0; // walking speed, metres per second
export const RUN = 5.2; // running speed
export const QUALITY = {
  // Graphics setting: internal height, raindrops, shadow map size, bloom strength, rain splashes
  low: { h: 200, rain: 500, shadow: 0, glow: 0, splash: 40 },
  med: { h: 270, rain: 1100, shadow: 512, glow: 0.9, splash: 90 },
  high: { h: 360, rain: 1600, shadow: 1024, glow: 1.15, splash: 140 },
};
