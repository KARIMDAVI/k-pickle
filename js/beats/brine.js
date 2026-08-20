import * as THREE from 'three';
import { HEX, mood } from '../palette.js';
import { count, segments } from '../quality.js';
import { matte, metal, glow } from '../materials.js';
import { garlicCloveGeometry, dillGeometry, seeded } from '../geometry.js';
import { createBrineMaterial, createCausticsMaterial } from '../shaders/liquid.js';
import { createMotes } from '../shaders/points.js';

const smooth = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

const SURFACE_Y = 1.75;
const VAT_RADIUS = 5;

export function createBrine(ctx) {
  const { quality } = ctx;
  const group = new THREE.Group();
  const rand = seeded(77);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(VAT_RADIUS, VAT_RADIUS * 0.92, 2.9, segments(quality, 72, 32), 1, true),
    matte(0x4d5642, 0.62, { side: THREE.DoubleSide, metalness: 0.25 }),
  );
  wall.position.y = 1.45;
  group.add(wall);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(VAT_RADIUS, 0.09, 8, segments(quality, 84, 36)),
    metal(0x9aa38c, 0.44),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2.9;
  group.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(VAT_RADIUS * 0.92, segments(quality, 64, 28)),
    matte(0x232a1e, 0.9),
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const caustics = new THREE.Mesh(
    new THREE.PlaneGeometry(VAT_RADIUS * 1.84, VAT_RADIUS * 1.84),
    createCausticsMaterial({ color: 0xd7bf68, intensity: 0.85, scale: 5 }),
  );
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.y = 0.04;
  group.add(caustics);

  const surfaceMaterial = createBrineMaterial({
    radius: VAT_RADIUS * 0.94,
    deep: 0x243119,
    shallow: 0x9cbb54,
    foam: 0xf0e4c6,
    opacity: 0.62,
  });
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(VAT_RADIUS * 0.94, segments(quality, 128, 48)),
    surfaceMaterial,
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = SURFACE_Y;
  group.add(surface);

  const ripples = [];
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.02, segments(quality, 72, 32)),
      new THREE.MeshBasicMaterial({
        color: 0xdcd0a4,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = SURFACE_Y + 0.02;
    group.add(ring);
    ripples.push(ring);
  }

  const saltCount = count(quality, 260);
  const salt = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.075, 0),
    new THREE.MeshStandardMaterial({ color: 0xf3ecd8, roughness: 0.35, metalness: 0.05 }),
    saltCount,
  );
  salt.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const saltData = [];
  for (let i = 0; i < saltCount; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * 1.5;
    saltData.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      phase: rand(),
      speed: 0.32 + rand() * 0.42,
      scale: 0.5 + rand() * 0.9,
      spin: rand() * Math.PI * 2,
    });
  }
  group.add(salt);

  const seedCount = count(quality, 150);
  const seeds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.055, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0xb98a2c, roughness: 0.5 }),
    seedCount,
  );
  seeds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const pepperCount = count(quality, 70);
  const pepper = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.07, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0x2e2519, roughness: 0.72 }),
    pepperCount,
  );
  pepper.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(seeds, pepper);

  const orbit = [];
  for (let i = 0; i < seedCount + pepperCount; i += 1) {
    orbit.push({
      angle: rand() * Math.PI * 2,
      radius: 1.6 + rand() * 3,
      height: 1.4 + rand() * 3.4,
      speed: 0.35 + rand() * 0.7,
      scale: 0.7 + rand() * 0.8,
    });
  }

  const garlicMaterial = matte(0xe9e2cd, 0.58);
  const garlic = [];
  for (let i = 0; i < 5; i += 1) {
    const clove = new THREE.Mesh(garlicCloveGeometry({ size: 0.62, segments: segments(quality, 16, 8) }), garlicMaterial);
    clove.userData.angle = (i / 5) * Math.PI * 2;
    clove.userData.radius = 2.4 + rand() * 1.1;
    group.add(clove);
    garlic.push(clove);
  }

  const dillMaterial = matte(HEX.dill, 0.68);
  const dills = [];
  for (let i = 0; i < 3; i += 1) {
    const sprig = new THREE.Mesh(dillGeometry({ size: 0.9 }), dillMaterial);
    sprig.userData.angle = (i / 3) * Math.PI * 2 + 0.6;
    sprig.userData.radius = 3.1 + rand() * 0.8;
    group.add(sprig);
    dills.push(sprig);
  }

  const pourGlow = glow({ color: 0xf1e6c2, size: 5, opacity: 0 });
  pourGlow.position.set(0, 5.4, 0);
  group.add(pourGlow);

  const spray = createMotes({
    count: count(quality, 340),
    bounds: new THREE.Vector3(9, 5, 9),
    size: 0.28,
    color: 0xe6dcbc,
    opacity: 0.24,
    pixelRatio: ctx.pixelRatio,
  });
  spray.position.y = SURFACE_Y + 1.4;
  group.add(spray);

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const vec = new THREE.Vector3();
  const scaleVec = new THREE.Vector3();

  return {
    group,
    mood: mood({
      fog: 0x101309,
      fogDensity: 0.021,
      skyTop: 0x1e2716,
      skyBottom: 0x090b06,
      key: 0xfff0cd,
      keyIntensity: 2.9,
      keyPosition: new THREE.Vector3(3, 11, 5),
      fill: 0x86a24f,
      fillIntensity: 0.66,
      rim: 0xd4a72c,
      rimIntensity: 2.2,
      ambient: 0x2f3b23,
      ambientIntensity: 0.62,
      bloom: 0.3,
      exposure: 1.04,
    }),
    camera: {
      enter: { position: new THREE.Vector3(0.6, 8.6, 19.5), look: new THREE.Vector3(0, 1.9, 0) },
      exit: { position: new THREE.Vector3(-1.8, 4.4, 11.5), look: new THREE.Vector3(0.2, 1.7, -0.4) },
    },
    update({ local, time }) {
      const pour = smooth(0.04, 0.2, local) * (1 - smooth(0.48, 0.66, local));
      const settle = smooth(0.22, 0.9, local);
      const strength = smooth(0.05, 0.55, local);

      surfaceMaterial.uniforms.uTime.value = time;
      surfaceMaterial.uniforms.uWave.value = 0.42 + pour * 1.5 + strength * 0.35;
      surfaceMaterial.uniforms.uSwirl.value = 0.3 + settle * 1.5;
      surfaceMaterial.uniforms.uCloud.value = 0.24 + settle * 0.85;
      surfaceMaterial.uniforms.uCaustic.value = 0.55 + strength * 0.7;
      surfaceMaterial.uniforms.uOpacity.value = 0.5 + settle * 0.22;

      caustics.material.uniforms.uTime.value = time;
      caustics.material.uniforms.uIntensity.value = 0.5 + strength * 0.9;

      pourGlow.material.opacity = pour * 0.26;

      for (let i = 0; i < saltCount; i += 1) {
        const d = saltData[i];
        const fall = (d.phase + time * d.speed) % 1;
        const y = 6.2 - fall * (6.2 - SURFACE_Y);
        const alive = pour > 0.02 ? 1 : 0;
        const shrink = (1 - smooth(0.78, 1, fall)) * alive * d.scale * pour;
        vec.set(d.x * (0.4 + fall * 0.8), y, d.z * (0.4 + fall * 0.8));
        euler.set(d.spin + time * 1.4, d.spin * 2 + time, 0);
        quat.setFromEuler(euler);
        scaleVec.setScalar(Math.max(shrink, 0.0001));
        matrix.compose(vec, quat, scaleVec);
        salt.setMatrixAt(i, matrix);
      }
      salt.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < orbit.length; i += 1) {
        const o = orbit[i];
        const angle = o.angle + time * o.speed * (0.4 + settle);
        const radius = o.radius * (1 - settle * 0.72);
        const y = o.height * (1 - settle) + SURFACE_Y * settle - settle * 0.5;
        vec.set(Math.cos(angle) * radius, y + 0.6, Math.sin(angle) * radius);
        euler.set(time * 0.6 + i, angle, 0);
        quat.setFromEuler(euler);
        scaleVec.setScalar(o.scale * smooth(0.02, 0.24, local));
        matrix.compose(vec, quat, scaleVec);
        if (i < seedCount) seeds.setMatrixAt(i, matrix);
        else pepper.setMatrixAt(i - seedCount, matrix);
      }
      seeds.instanceMatrix.needsUpdate = true;
      pepper.instanceMatrix.needsUpdate = true;

      const drop = smooth(0.18, 0.72, local);
      for (let i = 0; i < garlic.length; i += 1) {
        const clove = garlic[i];
        const angle = clove.userData.angle + time * 0.32 * (0.5 + drop);
        const radius = clove.userData.radius * (1 - drop * 0.62);
        clove.position.set(Math.cos(angle) * radius, 4.2 - drop * 2.6, Math.sin(angle) * radius);
        clove.rotation.set(time * 0.5 + i, angle * 1.4, 0.5);
        clove.scale.setScalar(smooth(0.12, 0.32, local));
      }

      for (let i = 0; i < dills.length; i += 1) {
        const sprig = dills[i];
        const angle = sprig.userData.angle + time * 0.24 * (0.5 + drop);
        const radius = sprig.userData.radius * (1 - drop * 0.55);
        sprig.position.set(Math.cos(angle) * radius, 4.6 - drop * 2.9, Math.sin(angle) * radius);
        sprig.rotation.set(0.9 + Math.sin(time * 0.5 + i) * 0.2, angle, 0.3);
        sprig.scale.setScalar(smooth(0.3, 0.55, local));
      }

      for (let i = 0; i < ripples.length; i += 1) {
        const phase = (time * 0.35 + i / ripples.length) % 1;
        const ring = ripples[i];
        ring.scale.setScalar(0.4 + phase * 4.4);
        ring.material.opacity = (1 - phase) * 0.42 * (0.25 + pour + settle * 0.4);
      }

      spray.material.uniforms.uTime.value = time;
      spray.material.uniforms.uOpacity.value = 0.08 + pour * 0.24;
    },
  };
}
