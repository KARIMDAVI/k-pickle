import * as THREE from 'three';
import { HEX, mood, lerpHex } from '../palette.js';
import { count, segments } from '../quality.js';
import { matte, cucumberMaterial, glow } from '../materials.js';
import { cucumberGeometry, leafGeometry, vineGeometry, mergeGeometries, seeded } from '../geometry.js';
import { createMotes } from '../shaders/points.js';

const smooth = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

function buildPlant(seed, quality) {
  const rand = seeded(seed);
  const height = 3.4 + rand() * 1.7;
  const parts = [vineGeometry({ height, radius: 0.07, seed, segments: segments(quality, 7, 5) })];

  const leafCount = quality.tier === 'high' ? 5 : 3;
  for (let i = 0; i < leafCount; i += 1) {
    const leaf = leafGeometry({ size: 0.95 + rand() * 0.7, segments: segments(quality, 12, 5) });
    leaf.rotateX(0.85 + rand() * 0.5);
    leaf.rotateY(rand() * Math.PI * 2);
    leaf.translate(
      (rand() - 0.5) * 0.3,
      height * (0.32 + (i / leafCount) * 0.62),
      (rand() - 0.5) * 0.3,
    );
    parts.push(leaf);
  }

  return { geometry: mergeGeometries(parts), height };
}

export function createGarden(ctx) {
  const { quality } = ctx;
  const group = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120, segments(quality, 120, 40), segments(quality, 120, 40)),
    matte(0x2e2318, 0.98, { flatShading: false }),
  );
  ground.rotation.x = -Math.PI / 2;

  const gp = ground.geometry.attributes.position;
  for (let i = 0; i < gp.count; i += 1) {
    const x = gp.getX(i);
    const y = gp.getY(i);
    const furrow = Math.sin(x * 0.56) * 0.34;
    const roll = Math.sin(x * 0.13 + 1.4) * 0.9 + Math.cos(y * 0.11) * 0.7;
    gp.setZ(i, furrow + roll - 0.6);
  }
  gp.needsUpdate = true;
  ground.geometry.computeVertexNormals();
  group.add(ground);

  const foliage = matte(0x6d9a41, 0.68, { side: THREE.DoubleSide });
  const plants = [];
  const rows = quality.tier === 'high' ? 5 : 3;
  const perRow = quality.tier === 'high' ? 6 : 4;
  let seed = 1;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < perRow; c += 1) {
      seed += 1;
      const rand = seeded(seed * 13);
      const { geometry, height } = buildPlant(seed, quality);
      const mesh = new THREE.Mesh(geometry, foliage);

      const holder = new THREE.Group();
      holder.position.set(
        (c - (perRow - 1) / 2) * 5.6 + (rand() - 0.5) * 1.4,
        0,
        -r * 6.4 - 2 + (rand() - 0.5) * 1.2,
      );
      holder.rotation.y = rand() * Math.PI * 2;
      holder.add(mesh);
      group.add(holder);

      plants.push({
        holder,
        height,
        delay: (r / rows) * 0.14 + (c / perRow) * 0.07 + rand() * 0.05,
        sway: 0.6 + rand() * 0.8,
      });
    }
  }

  const cukeGeometry = cucumberGeometry({
    length: 1.5,
    radius: 0.24,
    segments: segments(quality, 16, 9),
    rings: segments(quality, 18, 9),
    seed: 21,
  });
  const cukes = new THREE.InstancedMesh(cukeGeometry, cucumberMaterial({ color: 0x7aa63c }), plants.length);
  cukes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(cukes);

  const harvestGeometry = cucumberGeometry({
    length: 2.1,
    radius: 0.34,
    segments: segments(quality, 20, 10),
    rings: segments(quality, 20, 10),
    seed: 33,
  });
  const harvestMaterial = cucumberMaterial({ color: 0x86b545 });
  const harvest = [];

  for (let i = 0; i < 6; i += 1) {
    const mesh = new THREE.Mesh(harvestGeometry, harvestMaterial);
    const angle = (i / 6) * Math.PI * 2;
    mesh.userData.base = new THREE.Vector3(Math.cos(angle) * 3.6, 0.9, 6 + Math.sin(angle) * 2.2);
    mesh.userData.spin = 0.4 + (i % 3) * 0.35;
    group.add(mesh);
    harvest.push(mesh);
  }

  const sun = glow({ color: HEX.dawn, size: 21, opacity: 0.3 });
  sun.position.set(-13, 1.5, -34);
  group.add(sun);

  const motes = createMotes({
    count: count(quality, 700),
    bounds: new THREE.Vector3(46, 16, 40),
    size: 0.34,
    color: 0xf0d79a,
    opacity: 0.3,
    pixelRatio: ctx.pixelRatio,
  });
  motes.position.set(0, 6, -4);
  group.add(motes);

  const beatMood = mood({
    fog: 0x14180d,
    fogDensity: 0.0125,
    skyTop: 0x2c3a1c,
    skyBottom: 0x110f09,
    key: HEX.dawn,
    keyIntensity: 3.2,
    keyPosition: new THREE.Vector3(-11, 3, -14),
    fill: 0x5c7a3e,
    fillIntensity: 0.62,
    rim: 0xffcf7a,
    rimIntensity: 1.1,
    ambient: 0x38481f,
    ambientIntensity: 1.0,
    bloom: 0.22,
    exposure: 1.08,
  });

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const euler = new THREE.Euler();

  return {
    group,
    mood: beatMood,
    camera: {
      enter: { position: new THREE.Vector3(2, 3.4, 22), look: new THREE.Vector3(0, 1.6, -3) },
      exit: { position: new THREE.Vector3(-6.5, 6.4, 11), look: new THREE.Vector3(0.5, 1.2, -7) },
    },
    update({ local, time }) {
      const dawnToNoon = smooth(0.08, 0.78, local);
      beatMood.key = lerpHex(HEX.dawn, HEX.noon, dawnToNoon);
      beatMood.keyPosition.set(-11 + dawnToNoon * 12, 3 + dawnToNoon * 13, -14 + dawnToNoon * 8);
      beatMood.keyIntensity = 2.9 + dawnToNoon * 1.3;
      beatMood.ambientIntensity = 0.85 + dawnToNoon * 0.5;

      sun.position.set(-13 + dawnToNoon * 13, 1.5 + dawnToNoon * 15, -34);
      sun.material.color.setHex(lerpHex(HEX.dawn, 0xfff2cf, dawnToNoon));
      sun.material.opacity = 0.32 - dawnToNoon * 0.09;

      for (let i = 0; i < plants.length; i += 1) {
        const plant = plants[i];
        const grown = 0.42 + 0.58 * smooth(plant.delay, plant.delay + 0.3, local);
        plant.holder.scale.setScalar(grown);
        plant.holder.rotation.z = Math.sin(time * plant.sway * 0.6 + i) * 0.045 * grown;

        const fruit = smooth(plant.delay + 0.1, plant.delay + 0.36, local);
        position.set(
          plant.holder.position.x + Math.sin(i * 2.1) * 0.55,
          plant.height * 0.46 * grown + 0.1,
          plant.holder.position.z + Math.cos(i * 1.7) * 0.55,
        );
        euler.set(1.35, i * 0.9, Math.sin(time * 0.5 + i) * 0.12);
        quat.setFromEuler(euler);
        scale.setScalar(Math.max(fruit, 0.0001));
        matrix.compose(position, quat, scale);
        cukes.setMatrixAt(i, matrix);
      }
      cukes.instanceMatrix.needsUpdate = true;

      const lift = smooth(0.7, 1, local);
      for (let i = 0; i < harvest.length; i += 1) {
        const mesh = harvest[i];
        const base = mesh.userData.base;
        mesh.position.set(
          base.x * (1 + lift * 0.5),
          base.y + lift * (2.6 + i * 0.32) + Math.sin(time * 0.8 + i) * 0.12 * lift,
          base.z + lift * 3.4,
        );
        mesh.rotation.set(time * 0.24 * mesh.userData.spin, time * 0.3, 0.6 + i);
        mesh.scale.setScalar(Math.max(lift, 0.0001));
      }

      motes.material.uniforms.uTime.value = time;
      motes.material.uniforms.uOpacity.value = 0.14 + dawnToNoon * 0.2;
    },
  };
}
