// PS1-style material: flat Phong shading plus vertex snapping from shaders/ps1-snap.glsl.
// Textured materials also get bump relief from their own texture, and a wet sheen
// that follows the weather (see setWetness).
import * as THREE from 'three';
import { loadText } from './load.js';

const snapChunk = await loadText('../../shaders/ps1-snap.glsl');

function snap(m) {
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + snapChunk);
  };
  return m;
}

// Materials that pick up a sheen when it rains: textured, opaque, with no specular set by hand.
const wettable = [];

// opt.bump: false turns relief off, or a number sets its strength (default 0.03).
export function mat(opt) {
  const { bump, ...rest } = opt;
  const m = snap(new THREE.MeshPhongMaterial(Object.assign({ shininess: 0, specular: 0x000000 }, rest)));
  const map = rest.map;
  const solid = map && !rest.transparent && !rest.alphaTest && !rest.emissiveMap;
  if (solid && bump !== false && !map.isFlat) {
    m.bumpMap = map;
    m.bumpScale = typeof bump === 'number' ? bump : 0.03;
  }
  if (solid && rest.specular === undefined && !map.isFlat) wettable.push(m);
  return m;
}

// 0 = dry, 1 = soaked. Specular strength and size don't change the shader, so this is cheap.
export function setWetness(w) {
  const k = Math.max(0, Math.min(1, w));
  wettable.forEach((m) => {
    m.specular.setScalar(0.03 + k * 0.16);
    m.shininess = 6 + k * 34;
  });
}
