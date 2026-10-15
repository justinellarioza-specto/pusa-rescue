// PS1-style material: flat Phong shading plus vertex snapping from shaders/ps1-snap.glsl.
import * as THREE from 'three';
import { loadText } from './load.js';

const snapChunk = await loadText('../../shaders/ps1-snap.glsl');

function snap(m) {
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + snapChunk);
  };
  return m;
}

export function mat(opt) {
  return snap(new THREE.MeshPhongMaterial(Object.assign({ shininess: 0, specular: 0x000000 }, opt)));
}
