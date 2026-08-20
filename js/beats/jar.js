import * as THREE from 'three';
import { HEX, mood } from '../palette.js';
import { count, segments } from '../quality.js';
import { glassMaterial, brineMaterial, cucumberMaterial, matte, metal, glow } from '../materials.js';
import { jarGeometry, lidGeometry, spearGeometry, labelBandGeometry, labelTexture, seeded } from '../geometry.js';
import { createBubbles, createMotes } from '../shaders/points.js';

const smooth = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

function buildJar({ height, radius, quality, texture, spearCount, seed }) {
  const jar = new THREE.Group();
  const rand = seeded(seed);

  const glass = new THREE.Mesh(
    jarGeometry({ height, radius, segments: segments(quality, 60, 26) }),
    glassMaterial(quality, { tint: 0xd2e2c0 }),
  );
  jar.add(glass);

  const brine = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.88, radius * 0.86, 1, segments(quality, 44, 20)),
    brineMaterial({ color: 0x9cb84f, opacity: 0.46 }),
  );
  brine.geometry.translate(0, 0.5, 0);
  brine.position.y = height * 0.06;
  brine.scale.y = height * 0.78;
  jar.add(brine);

  const spearGeo = spearGeometry({
    length: height * 0.62,
    radius: radius * 0.17,
    segments: segments(quality, 16, 9),
    seed: seed + 3,
  });
  const spearMaterial = cucumberMaterial({ color: 0x74973c });
  const spears = [];

  for (let i = 0; i < spearCount; i += 1) {
    const spear = new THREE.Mesh(spearGeo, spearMaterial);
    const angle = (i / spearCount) * Math.PI * 2 + rand();
    const r = radius * (0.34 + rand() * 0.3);
    spear.userData.rest = new THREE.Vector3(Math.cos(angle) * r, height * 0.42, Math.sin(angle) * r);
    spear.userData.tilt = new THREE.Euler((rand() - 0.5) * 0.24, angle, (rand() - 0.5) * 0.24);
    spear.position.copy(spear.userData.rest);
    spear.rotation.copy(spear.userData.tilt);
    jar.add(spear);
    spears.push(spear);
  }

  const label = new THREE.Mesh(
    labelBandGeometry({ height, radius, segments: segments(quality, 56, 24) }),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.88,
      metalness: 0,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    }),
  );
  label.position.y = height * 0.34;
  jar.add(label);

  const lid = new THREE.Mesh(
    lidGeometry({ height, radius, segments: segments(quality, 52, 24) }),
    metal(0xb9932f, 0.36),
  );
  lid.position.y = height;
  jar.add(lid);

  return { jar, glass, brine, spears, label, lid, height };
}

export function createJarBeat(ctx) {
  const { quality } = ctx;
  const group = new THREE.Group();
  const texture = labelTexture();

  /* One jar on a wood table, deliberately — the beat's background clip is a single jar on
     a table, and any moment where both layers are visible at once (a sequence still easing
     in, a manifest without `jar`) has to read as the same shot in two renderings rather
     than two different product shots fighting each other. An earlier version staged a
     shelf of five jars here and ghosted into the clip as a smear of overlapping labels. */
  const table = new THREE.Mesh(new THREE.BoxGeometry(34, 0.6, 15), matte(HEX.wood, 0.92));
  table.position.set(0, -0.3, -2.4);
  group.add(table);

  const edge = new THREE.Mesh(new THREE.BoxGeometry(34, 0.26, 0.34), matte(0x39281b, 0.9));
  edge.position.set(0, -0.06, 5.2);
  group.add(edge);

  const hero = buildJar({
    height: 5.2, radius: 1.85, quality, texture, spearCount: 6, seed: 8,
  });
  hero.jar.position.set(0, 0, 0.6);
  group.add(hero.jar);

  const bubbles = createBubbles({
    count: count(quality, 220),
    radius: 1.35,
    bottom: 0.4,
    top: 4.1,
    size: 0.7,
    color: 0xd0e7a4,
    opacity: 0,
    pixelRatio: ctx.pixelRatio,
  });
  bubbles.material.uniforms.uSpeed.value = 0.16;
  bubbles.position.copy(hero.jar.position);
  group.add(bubbles);

  const lamp = glow({ color: 0xffd894, size: 8, opacity: 0.16 });
  lamp.position.set(0.5, 10.5, 1.5);
  group.add(lamp);

  const dust = createMotes({
    count: count(quality, 460),
    bounds: new THREE.Vector3(30, 14, 16),
    size: 0.3,
    color: 0xe6dcbc,
    opacity: 0.24,
    pixelRatio: ctx.pixelRatio,
  });
  dust.position.y = 4.5;
  group.add(dust);

  return {
    group,
    mood: mood({
      fog: 0x0e1109,
      fogDensity: 0.024,
      skyTop: 0x202a17,
      skyBottom: 0x0a0c07,
      key: 0xffe2ae,
      keyIntensity: 2.7,
      keyPosition: new THREE.Vector3(2, 10, 7),
      fill: 0x6f8a45,
      fillIntensity: 0.58,
      rim: 0xd4a72c,
      rimIntensity: 1.5,
      ambient: 0x2b3620,
      ambientIntensity: 0.55,
      bloom: 0.34,
      exposure: 1.06,
    }),
    camera: {
      enter: { position: new THREE.Vector3(-2, 5.6, 24), look: new THREE.Vector3(1.6, 2.6, 0) },
      exit: { position: new THREE.Vector3(2.6, 4.2, 15.5), look: new THREE.Vector3(1.4, 2.5, 0) },
    },
    update({ local, time }) {
      const fill = smooth(0.2, 0.56, local);
      const capping = smooth(0.55, 0.76, local);
      const labelling = smooth(0.72, 0.94, local);
      const present = smooth(0.7, 1, local);

      for (let i = 0; i < hero.spears.length; i += 1) {
        const spear = hero.spears[i];
        const drop = smooth(i * 0.035, i * 0.035 + 0.2, local);
        const rest = spear.userData.rest;
        spear.position.set(rest.x, rest.y + (1 - drop) * 7.5, rest.z);
        spear.rotation.set(
          spear.userData.tilt.x + (1 - drop) * 1.1,
          spear.userData.tilt.y + (1 - drop) * 2.4,
          spear.userData.tilt.z,
        );
        spear.visible = drop > 0.001;
      }

      hero.brine.scale.y = Math.max(fill * hero.height * 0.78, 0.0001);
      hero.brine.material.opacity = 0.2 + fill * 0.3;

      hero.lid.position.y = hero.height + (1 - capping) * 3.4;
      hero.lid.rotation.y = (1 - capping) * 9.5;

      hero.label.material.opacity = labelling;
      hero.label.visible = labelling > 0.01;

      hero.jar.rotation.y = (1 - present) * -0.9 + Math.sin(time * 0.12) * 0.02;
      hero.jar.position.y = present * 0.35;

      bubbles.material.uniforms.uTime.value = time;
      bubbles.material.uniforms.uOpacity.value = fill * 0.5 * (1 - capping * 0.4);
      bubbles.material.uniforms.uTop.value = 0.4 + fill * 3.7;
      bubbles.position.y = hero.jar.position.y;

      lamp.material.opacity = 0.14 + present * 0.1;
      dust.material.uniforms.uTime.value = time;
    },
  };
}
