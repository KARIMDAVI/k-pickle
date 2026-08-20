import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GrainVignetteShader } from './shaders/grain.js';
import { createSky } from './shaders/sky.js';
import { HEX } from './palette.js';

export function createStage({ canvas, quality }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality.antialias,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(HEX.night, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(HEX.night, 0.0062);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(0, 2, 14);

  const sky = createSky();
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(HEX.cellar, HEX.soil, 0.55);
  scene.add(hemi);

  /* The story runs 1000 units deep along -Z, so both directional lights are re-anchored to
     the camera each frame; without a moving target their direction would swing as the
     camera travels away from world origin. */
  const key = new THREE.DirectionalLight(HEX.noon, 2.1);
  key.position.set(6, 12, 8);
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(HEX.brine, 0.5);
  fill.position.set(-8, 4, -6);
  scene.add(fill, fill.target);

  const rim = new THREE.PointLight(HEX.mustard, 1.4, 60, 1.6);
  rim.position.set(0, 3, -6);
  scene.add(rim);

  let composer = null;
  let bloom = null;
  let grain = null;

  if (quality.postprocessing) {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: 4,
    });

    composer = new EffectComposer(renderer, target);
    composer.setPixelRatio(quality.pixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));

    bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.3,
      0.5,
      0.86,
    );
    composer.addPass(bloom);

    grain = new ShaderPass(GrainVignetteShader);
    composer.addPass(grain);

    composer.addPass(new OutputPass());
  }

  const fogColor = new THREE.Color();
  const skyTop = new THREE.Color();
  const skyBottom = new THREE.Color();
  const forward = new THREE.Vector3();

  function applyMood(mood) {
    fogColor.setHex(mood.fog);
    scene.fog.color.copy(fogColor);
    scene.fog.density = mood.fogDensity;
    renderer.setClearColor(fogColor, 1);

    skyTop.setHex(mood.skyTop);
    skyBottom.setHex(mood.skyBottom);
    sky.material.uniforms.uTop.value.copy(skyTop);
    sky.material.uniforms.uBottom.value.copy(skyBottom);
    sky.material.uniforms.uIntensity.value = mood.skyIntensity;

    key.color.setHex(mood.key);
    key.intensity = mood.keyIntensity;
    key.position.copy(mood.keyPosition).add(camera.position);
    key.target.position.copy(camera.position);

    fill.color.setHex(mood.fill);
    fill.intensity = mood.fillIntensity;
    fill.position.set(-9, 5, -7).add(camera.position);
    fill.target.position.copy(camera.position);

    rim.color.setHex(mood.rim);
    rim.intensity = mood.rimIntensity;
    camera.getWorldDirection(forward);
    rim.position.copy(camera.position).addScaledVector(forward, 13).setY(camera.position.y + 3.4);

    hemi.color.setHex(mood.ambient);
    hemi.intensity = mood.ambientIntensity;

    renderer.toneMappingExposure = mood.exposure;
    if (bloom) bloom.strength = mood.bloom;
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (composer) composer.setSize(width, height);
    if (bloom) bloom.resolution.set(width, height);
  }

  function render(elapsed) {
    sky.position.copy(camera.position);
    sky.material.uniforms.uTime.value = elapsed;
    if (grain) grain.uniforms.uTime.value = elapsed;

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize);

  return { renderer, scene, camera, sky, lights: { hemi, key, fill, rim }, applyMood, render, resize };
}
