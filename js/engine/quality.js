// Applies the Graphics setting: resolution and shadow quality (rain amount is read every frame).
import { flash, resize } from './renderer.js';
import { settings } from '../core/storage.js';
import { QUALITY } from '../config.js';

export function applyQuality() {
  const q = QUALITY[settings.quality];
  flash.castShadow = !!q.shadow;
  if (q.shadow) {
    flash.shadow.mapSize.set(q.shadow, q.shadow);
    if (flash.shadow.map) {
      flash.shadow.map.dispose();
      flash.shadow.map = null;
    }
  }
  resize();
}
