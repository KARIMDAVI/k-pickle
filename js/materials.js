import * as THREE from 'three';
import { HEX } from './palette.js';

export function glassMaterial(quality, { tint = 0xcfe0bd, roughness = 0.06 } = {}) {
  if (quality.transmission) {
    return new THREE.MeshPhysicalMaterial({
      color: tint,
      metalness: 0,
      roughness,
      transmission: 1,
      thickness: 0.9,
      ior: 1.52,
      attenuationColor: new THREE.Color(HEX.brine),
      attenuationDistance: 7,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });
  }

  /* Low tier: transmission triggers a second scene render per material, so glass is faked
     with a rough tinted dielectric plus fresnel-ish envMap-free specular. */
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 0,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

export function brineMaterial({ color = 0x9db656, opacity = 0.72 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0,
    transparent: true,
    opacity,
    transmission: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.05),
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

export function cucumberMaterial({ color = HEX.cucumber } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(HEX.dill),
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
  });
}

export function matte(color, roughness = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness, metalness: 0 }, extra));
}

export function metal(color, roughness = 0.34) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.86 });
}

let glowMap = null;

function glowTexture() {
  if (glowMap) return glowMap;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.14)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  glowMap = new THREE.CanvasTexture(canvas);
  glowMap.colorSpace = THREE.SRGBColorSpace;
  return glowMap;
}

export function glow({ color = HEX.mustard, size = 10, opacity = 0.6 } = {}) {
  const material = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(size);
  return sprite;
}

