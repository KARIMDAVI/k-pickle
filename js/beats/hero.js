import * as THREE from 'three';
import { HEX, mood } from '../palette.js';
import { count, segments } from '../quality.js';
import { glassMaterial, brineMaterial, cucumberMaterial, matte, metal, glow } from '../materials.js';
import { cucumberGeometry, jarGeometry, lidGeometry, dillGeometry, labelBandGeometry, labelTexture } from '../geometry.js';
import { createBubbles, createMotes } from '../shaders/points.js';

export function createHero(ctx) {
  const { quality } = ctx;
  const group = new THREE.Group();

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 10.2, 0.7, segments(quality, 72, 36)),
    matte(HEX.soil, 0.94),
  );
  plinth.position.y = -0.35;
  group.add(plinth);

  const pool = glow({ color: HEX.brine, size: 17, opacity: 0.1 });
  pool.position.set(0, 0.06, 0);
  pool.material.rotation = 0;
  group.add(pool);

  const halo = glow({ color: HEX.mustard, size: 19, opacity: 0.22 });
  halo.position.set(0, 3.4, -7);
  group.add(halo);

  const jarHeight = 6.4;
  const jarRadius = 2.3;

  const jar = new THREE.Group();
  group.add(jar);

  const glassMesh = new THREE.Mesh(
    jarGeometry({ height: jarHeight, radius: jarRadius, segments: segments(quality, 72, 30) }),
    glassMaterial(quality, { tint: 0xd6e6c6 }),
  );
  jar.add(glassMesh);

  const brine = new THREE.Mesh(
    new THREE.CylinderGeometry(jarRadius * 0.9, jarRadius * 0.88, jarHeight * 0.78, segments(quality, 48, 24)),
    brineMaterial({ color: 0x9fbb52, opacity: 0.5 }),
  );
  brine.position.y = jarHeight * 0.42;
  jar.add(brine);

  const cukeGeometry = cucumberGeometry({
    length: 4.1,
    radius: 0.52,
    segments: segments(quality, 22, 12),
    rings: segments(quality, 24, 12),
    seed: 4,
  });
  const cukeMaterial = cucumberMaterial({ color: 0x6f9738 });

  for (let i = 0; i < 4; i += 1) {
    const cucumber = new THREE.Mesh(cukeGeometry, cukeMaterial);
    const angle = (i / 4) * Math.PI * 2 + 0.4;
    cucumber.position.set(Math.cos(angle) * 1.05, jarHeight * 0.42, Math.sin(angle) * 1.05);
    cucumber.rotation.set(0.14 * Math.cos(angle), angle, 0.16 * Math.sin(angle));
    jar.add(cucumber);
  }

  const dill = new THREE.Mesh(dillGeometry({ size: 1.5 }), matte(HEX.dill, 0.7));
  dill.position.set(-0.3, jarHeight * 0.2, 0.9);
  dill.rotation.z = 0.4;
  jar.add(dill);

  const label = new THREE.Mesh(
    labelBandGeometry({ height: jarHeight, radius: jarRadius, segments: segments(quality, 64, 28) }),
    new THREE.MeshStandardMaterial({
      map: labelTexture(),
      roughness: 0.86,
      metalness: 0,
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );
  label.position.y = jarHeight * 0.34;
  jar.add(label);

  const lid = new THREE.Mesh(
    lidGeometry({ height: jarHeight, radius: jarRadius, segments: segments(quality, 64, 28) }),
    metal(0xb9932f, 0.38),
  );
  lid.position.y = jarHeight;
  jar.add(lid);

  const bubbles = createBubbles({
    count: count(quality, 260),
    radius: jarRadius * 0.78,
    bottom: 0.35,
    top: jarHeight * 0.78,
    size: 0.8,
    color: 0xc9e39a,
    opacity: 0.5,
    pixelRatio: ctx.pixelRatio,
  });
  bubbles.material.uniforms.uSpeed.value = 0.09;
  bubbles.material.uniforms.uSpread.value = 0.16;
  jar.add(bubbles);

  const motes = createMotes({
    count: count(quality, 620),
    bounds: new THREE.Vector3(38, 24, 30),
    size: 0.42,
    color: HEX.mustard,
    opacity: 0.34,
    pixelRatio: ctx.pixelRatio,
  });
  motes.position.y = 5;
  group.add(motes);

  return {
    group,
    mood: mood({
      fog: 0x0d0f0a,
      fogDensity: 0.019,
      skyTop: 0x243019,
      skyBottom: 0x0b0d08,
      key: 0xffe7b4,
      keyIntensity: 3.4,
      keyPosition: new THREE.Vector3(7, 9, 6),
      fill: 0x4d6b39,
      fillIntensity: 1.05,
      rim: 0xd4a72c,
      rimIntensity: 4.6,
      ambient: 0x2a3a22,
      ambientIntensity: 0.95,
      bloom: 0.32,
      exposure: 1.02,
    }),
    camera: {
      enter: { position: new THREE.Vector3(0, 6.4, 25), look: new THREE.Vector3(0, 6.2, 0) },
      exit: { position: new THREE.Vector3(3.6, 7.6, 18.5), look: new THREE.Vector3(0, 5.8, 0) },
    },
    update({ local, time }) {
      jar.rotation.y = Math.sin(time * 0.11) * 0.13 + local * 0.55;
      bubbles.material.uniforms.uTime.value = time;
      motes.material.uniforms.uTime.value = time;
      halo.material.opacity = 0.2 + Math.sin(time * 0.6) * 0.03 + local * 0.08;
      pool.material.opacity = 0.08 + local * 0.05;
      brine.material.opacity = 0.5 - local * 0.12;
    },
  };
}
