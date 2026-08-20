import * as THREE from 'three';
import { HEX, mood, lerpHex } from '../palette.js';
import { count, segments } from '../quality.js';
import { matte, cucumberMaterial, brineMaterial, glow } from '../materials.js';
import { crockGeometry, cucumberGeometry, stoneGeometry, dillGeometry, seeded } from '../geometry.js';
import { createBrineMaterial, createCausticsMaterial } from '../shaders/liquid.js';
import { createBubbles, createMotes } from '../shaders/points.js';

const smooth = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

const CROCK_RADIUS = 3.6;
const CROCK_HEIGHT = 4.4;
const LIQUID_TOP = 3.35;

export function createCrock(ctx) {
  const { quality } = ctx;
  const group = new THREE.Group();
  const rand = seeded(404);

  const crock = new THREE.Mesh(
    crockGeometry({
      height: CROCK_HEIGHT,
      radius: CROCK_RADIUS,
      segments: segments(quality, 80, 34),
    }),
    matte(0x6f6152, 0.86, { side: THREE.DoubleSide }),
  );
  /* The lathe leaves its gap facing +X; the story camera sits on +Z, so the cutaway is
     turned to read as a cross-section rather than a solid pot. */
  crock.rotation.y = -Math.PI / 2 + 0.32;
  group.add(crock);

  const glaze = new THREE.Mesh(
    new THREE.TorusGeometry(CROCK_RADIUS * 0.98, 0.075, 8, segments(quality, 80, 34)),
    matte(0x3f4b30, 0.4, { metalness: 0.15 }),
  );
  glaze.rotation.x = Math.PI / 2;
  glaze.position.y = CROCK_HEIGHT * 0.86;
  group.add(glaze);

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(CROCK_RADIUS * 0.9, CROCK_RADIUS * 0.84, LIQUID_TOP - 0.3, segments(quality, 56, 26)),
    brineMaterial({ color: 0x7d8f3e, opacity: 0.42 }),
  );
  liquid.position.y = (LIQUID_TOP - 0.3) * 0.5 + 0.3;
  group.add(liquid);

  const surfaceMaterial = createBrineMaterial({
    radius: CROCK_RADIUS * 0.89,
    deep: 0x1d2712,
    shallow: 0x8fa84a,
    foam: 0xe4dcbc,
    opacity: 0.6,
  });
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(CROCK_RADIUS * 0.89, segments(quality, 110, 44)),
    surfaceMaterial,
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = LIQUID_TOP;
  group.add(surface);

  const caustics = new THREE.Mesh(
    new THREE.PlaneGeometry(CROCK_RADIUS * 1.7, CROCK_RADIUS * 1.7),
    createCausticsMaterial({ color: 0xbfcf74, intensity: 0.7, scale: 4.2 }),
  );
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.y = 0.42;
  group.add(caustics);

  const cukeMaterial = cucumberMaterial({ color: HEX.cucumber });
  const cukes = [];
  const cukeGeometry = cucumberGeometry({
    length: 2.5,
    radius: 0.36,
    segments: segments(quality, 20, 10),
    rings: segments(quality, 22, 11),
    seed: 51,
  });

  const packed = quality.tier === 'high' ? 11 : 7;
  for (let i = 0; i < packed; i += 1) {
    const mesh = new THREE.Mesh(cukeGeometry, cukeMaterial);
    const angle = (i / packed) * Math.PI * 2 + rand() * 0.5;
    const radius = 0.5 + rand() * 1.9;
    mesh.position.set(Math.cos(angle) * radius, 1.55 + rand() * 0.5, Math.sin(angle) * radius);
    mesh.rotation.set((rand() - 0.5) * 0.7, angle, (rand() - 0.5) * 0.7);
    mesh.userData.bob = rand() * Math.PI * 2;
    group.add(mesh);
    cukes.push(mesh);
  }

  const dill = new THREE.Mesh(dillGeometry({ size: 1.1 }), matte(0x7f9a52, 0.72));
  dill.position.set(1.1, 2.4, 0.7);
  dill.rotation.set(1.1, 0.4, 0.3);
  group.add(dill);

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(CROCK_RADIUS * 0.76, CROCK_RADIUS * 0.74, 0.16, segments(quality, 48, 22)),
    matte(0xd8d2c0, 0.44, { metalness: 0.05 }),
  );
  group.add(plate);

  const stone = new THREE.Mesh(
    stoneGeometry({ radius: 0.92, seed: 12 }),
    matte(HEX.stone, 0.94),
  );
  group.add(stone);

  const bubbles = createBubbles({
    count: count(quality, 620),
    radius: CROCK_RADIUS * 0.82,
    bottom: 0.4,
    top: LIQUID_TOP - 0.05,
    size: 0.75,
    color: 0xcfe6a2,
    opacity: 0,
    pixelRatio: ctx.pixelRatio,
  });
  bubbles.material.uniforms.uSpeed.value = 0.1;
  bubbles.material.uniforms.uSpread.value = 0.2;
  group.add(bubbles);

  const cellarLight = glow({ color: 0xbcd0a0, size: 11, opacity: 0.12 });
  cellarLight.position.set(-5.5, 7, -3);
  group.add(cellarLight);

  const dust = createMotes({
    count: count(quality, 420),
    bounds: new THREE.Vector3(24, 14, 20),
    size: 0.3,
    color: 0xcbd7b0,
    opacity: 0.2,
    pixelRatio: ctx.pixelRatio,
  });
  dust.position.y = 4;
  group.add(dust);

  const beatMood = mood({
    fog: 0x0b0e08,
    fogDensity: 0.026,
    skyTop: 0x161d11,
    skyBottom: 0x070905,
    key: 0xbcd0a0,
    keyIntensity: 1.2,
    keyPosition: new THREE.Vector3(-8, 9, 4),
    fill: 0x4a5c33,
    fillIntensity: 0.4,
    rim: 0x9fb46a,
    rimIntensity: 1.2,
    ambient: 0x1d2616,
    ambientIntensity: 0.45,
    bloom: 0.3,
    exposure: 1.0,
  });

  return {
    group,
    mood: beatMood,
    camera: {
      enter: { position: new THREE.Vector3(0, 6, 19.5), look: new THREE.Vector3(0, 2.4, 0) },
      exit: { position: new THREE.Vector3(3.4, 4, 11), look: new THREE.Vector3(-0.2, 2.1, -0.6) },
    },
    update({ local, time }) {
      const ferment = smooth(0.08, 0.72, local);
      /* Scroll is the clock here: three cellar day/night cycles map onto the five days of copy. */
      const daylight = 0.5 + 0.5 * Math.sin(local * Math.PI * 6 - Math.PI * 0.5);

      beatMood.key = lerpHex(0x6f86a6, 0xd8dcae, daylight);
      beatMood.keyIntensity = 0.55 + daylight * 1.5;
      beatMood.ambientIntensity = 0.3 + daylight * 0.35;
      beatMood.rimIntensity = 0.7 + ferment * 1.6;
      beatMood.fogDensity = 0.03 - daylight * 0.008;

      cellarLight.material.opacity = 0.05 + daylight * 0.14;
      cellarLight.position.x = -5.5 + daylight * 2.4;

      surfaceMaterial.uniforms.uTime.value = time;
      surfaceMaterial.uniforms.uWave.value = 0.3 + ferment * 0.55;
      surfaceMaterial.uniforms.uSwirl.value = 0.2 + ferment * 0.6;
      surfaceMaterial.uniforms.uCloud.value = 0.15 + ferment * 1.05;
      surfaceMaterial.uniforms.uCaustic.value = 0.3 + ferment * 0.5;

      caustics.material.uniforms.uTime.value = time;
      caustics.material.uniforms.uIntensity.value = 0.25 + ferment * 0.6;

      liquid.material.color.setHex(lerpHex(0x93aa4a, 0x6f7a35, ferment));
      liquid.material.opacity = 0.34 + ferment * 0.22;

      bubbles.material.uniforms.uTime.value = time;
      bubbles.material.uniforms.uOpacity.value = ferment * 0.75;
      bubbles.material.uniforms.uSpeed.value = 0.06 + ferment * 0.14;

      cukeMaterial.color.setHex(lerpHex(HEX.cucumber, HEX.pickled, ferment));
      cukeMaterial.sheen = 0.6 - ferment * 0.45;

      for (let i = 0; i < cukes.length; i += 1) {
        const mesh = cukes[i];
        mesh.position.y = 1.55 + Math.sin(time * 0.5 + mesh.userData.bob) * 0.05 - ferment * 0.22;
        mesh.scale.setScalar(1 - ferment * 0.06);
      }

      const press = smooth(0.05, 0.3, local);
      plate.position.y = LIQUID_TOP + 0.9 - press * 0.72;
      plate.rotation.y = time * 0.05;
      stone.position.set(0.25, plate.position.y + 0.5, -0.15);
      stone.rotation.y = time * 0.05;

      dust.material.uniforms.uTime.value = time;
      dust.material.uniforms.uOpacity.value = 0.08 + daylight * 0.14;
    },
  };
}
