// Renderer, camera, lights, the player's flashlight and the post-processing pass.
import * as THREE from 'three';
import { settings } from '../core/storage.js';
import { QUALITY } from '../config.js';
import { loadText } from './load.js';

const [postVert, postFrag] = await Promise.all([
  loadText('../../shaders/post.vert.glsl'),
  loadText('../../shaders/post.frag.glsl'),
]);
let RES_W = 480,
  RES_H = 300; // internal resolution, set by resize() from the Graphics setting

const view = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(RES_W, RES_H, false);
renderer.setClearColor(0x080a14);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const FOG = 0x161c30;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(FOG, 0.05);
const camera = new THREE.PerspectiveCamera(66, RES_W / RES_H, 0.05, 140);
scene.add(camera);

const env = { hemiBase: 0.7, fogBase: 0.05, fogAdd: 0 }; // ambient light and fog, changed per mode and weather
const hemi = new THREE.HemisphereLight(0x4a5c90, 0x1a1820, env.hemiBase);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x7088c4, 0.3);
moon.position.set(-10, 20, 8);
scene.add(moon);

const flash = new THREE.SpotLight(0xfff0cf, 3.0, 24, 0.42, 0.5, 1);
flash.position.set(0.18, -0.18, 0.05);
flash.castShadow = true;
flash.shadow.mapSize.set(512, 512);
flash.shadow.camera.near = 0.2;
flash.shadow.camera.far = 22;
flash.shadow.bias = -0.002;
camera.add(flash);
const flashTarget = new THREE.Object3D();
flashTarget.position.set(0, -0.2, -5);
camera.add(flashTarget);
flash.target = flashTarget;

// ---------- post-processing: color grade, chromatic fringe, grain, vignette, ordered dither ----------
const rt = new THREE.WebGLRenderTarget(RES_W, RES_H, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
});
const post = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: rt.texture },
    time: { value: 0 },
    res: { value: new THREE.Vector2(RES_W, RES_H) },
    bolt: { value: 0 },
    fear: { value: 0 },
    glow: { value: 0.9 },
  },
  vertexShader: postVert,
  fragmentShader: postFrag,
  depthTest: false,
  depthWrite: false,
});
const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

// Fits the low-res render to the window without stretching.
export function resize() {
  const app = document.getElementById('app'),
    w = Math.max(1, app.clientWidth),
    h = Math.max(1, app.clientHeight),
    a = w / h;
  RES_H = QUALITY[settings.quality].h;
  RES_W = Math.max(160, Math.round(RES_H * a));
  renderer.setSize(RES_W, RES_H, false);
  rt.setSize(RES_W, RES_H);
  post.uniforms.res.value.set(RES_W, RES_H);
  camera.aspect = a;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// Draws the scene into the low-res target, then through the retro filter to the screen.
// Scene stats (before the post pass) for the F3 overlay.
export const stats = { calls: 0, triangles: 0 };
renderer.info.autoReset = false;
export function render() {
  renderer.info.reset();
  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  stats.calls = renderer.info.render.calls;
  stats.triangles = renderer.info.render.triangles;
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
}

export { renderer, scene, camera, hemi, moon, env, flash, flashTarget, post };
