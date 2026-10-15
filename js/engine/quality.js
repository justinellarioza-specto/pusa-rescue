// Applies the Graphics setting: resolution, shadow quality and amount of rain.
import { flash, resize } from './renderer.js';
import { settings } from '../core/storage.js';
import { QUALITY } from '../config.js';
import { rainGeo } from '../world/street.js';

export function applyQuality() {
  const q = QUALITY[settings.quality];
  flash.castShadow = !!q.shadow;
  if (q.shadow) { flash.shadow.mapSize.set(q.shadow, q.shadow); if (flash.shadow.map) { flash.shadow.map.dispose(); flash.shadow.map = null; } }
  rainGeo.setDrawRange(0, q.rain * 2);
  resize();
}
