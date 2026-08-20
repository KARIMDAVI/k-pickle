import * as THREE from 'three';

export const HEX = {
  night: 0x0d0f0a,
  glass: 0x1f2b1a,
  brine: 0x6b8e4e,
  mustard: 0xd4a72c,
  cream: 0xe8dcc4,
  soil: 0x2b2318,
  clay: 0x8a6a45,
  stone: 0x6d6a5c,
  leaf: 0x4f7a35,
  dill: 0x93b46a,
  cucumber: 0x74a13c,
  pickled: 0x59632c,
  wood: 0x4a3626,
  dawn: 0xffb46a,
  noon: 0xfff0c6,
  cellar: 0x9fb08a,
};

const lerpA = new THREE.Color();
const lerpB = new THREE.Color();

export function lerpHex(a, b, t) {
  lerpA.setHex(a);
  lerpB.setHex(b);
  return lerpA.lerp(lerpB, Math.min(Math.max(t, 0), 1)).getHex();
}

/* Moods are the per-beat lighting contract: story.js interpolates every field between
   consecutive beats, which is what makes the light "travel" through the story. */
export function mood(overrides = {}) {
  return Object.assign({
    fog: HEX.night,
    fogDensity: 0.0062,
    skyTop: HEX.glass,
    skyBottom: HEX.night,
    skyIntensity: 1,
    key: HEX.noon,
    keyIntensity: 2.1,
    keyPosition: new THREE.Vector3(6, 12, 8),
    fill: HEX.brine,
    fillIntensity: 0.5,
    rim: HEX.mustard,
    rimIntensity: 1.4,
    ambient: HEX.glass,
    ambientIntensity: 0.55,
    bloom: 0.42,
    exposure: 1.05,
  }, overrides);
}
