import * as THREE from 'three';
import { HEX, mood } from '../palette.js';
import { count, segments } from '../quality.js';
import { glassMaterial, brineMaterial, cucumberMaterial, matte, metal, glow } from '../materials.js';
import { jarGeometry, lidGeometry, spearGeometry, labelBandGeometry, labelTexture } from '../geometry.js';
import { createBurst, createBubbles, createMotes } from '../shaders/points.js';

const smooth = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

const AROMA_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const AROMA_FRAG = /* glsl */`
uniform float uTime;
uniform float uProgress;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;

void main() {
  float along = vUv.x;
  float reveal = smoothstep(uProgress, uProgress - 0.28, along);
  float pulse = 0.6 + 0.4 * sin(along * 26.0 - uTime * 2.4);
  float edge = sin(vUv.y * 3.14159);

  vec3 col = mix(uColorA, uColorB, along) * (0.55 + pulse * 0.65);
  float alpha = reveal * edge * uOpacity * (0.3 + pulse * 0.4) * pow(1.0 - along, 0.85);
  gl_FragColor = vec4(col, alpha);
}
`;

function aromaRibbon(quality) {
  const points = [];
  const turns = 4.6;
  const steps = 80;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * Math.PI * 2 * turns;
    const radius = 0.55 + t * 2.6;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      t * 11,
      Math.sin(angle) * radius,
    ));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(
    curve,
    segments(quality, 180, 80),
    0.062,
    segments(quality, 8, 5),
    false,
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uColorA: { value: new THREE.Color(0xdcc26a) },
      uColorB: { value: new THREE.Color(0x9fc45c) },
    },
    vertexShader: AROMA_VERT,
    fragmentShader: AROMA_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Mesh(geometry, material);
}

export function createTaste(ctx) {
  const { quality } = ctx;
  const group = new THREE.Group();

  const height = 6;
  const radius = 2.1;

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 17, 0.6, segments(quality, 64, 30)),
    matte(0x2a2016, 0.95),
  );
  table.position.y = -0.45;
  group.add(table);

  const jar = new THREE.Group();
  jar.position.y = 0;
  group.add(jar);

  const glass = new THREE.Mesh(
    jarGeometry({ height, radius, segments: segments(quality, 72, 30) }),
    glassMaterial(quality, { tint: 0xd8e6c4 }),
  );
  jar.add(glass);

  const brine = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.88, radius * 0.86, height * 0.74, segments(quality, 48, 22)),
    brineMaterial({ color: 0xa8c257, opacity: 0.48 }),
  );
  brine.position.y = height * 0.42;
  jar.add(brine);

  const spearGeo = spearGeometry({
    length: height * 0.6,
    radius: radius * 0.19,
    segments: segments(quality, 18, 10),
    seed: 61,
  });
  const spearMaterial = cucumberMaterial({ color: 0x6d9139 });

  for (let i = 0; i < 5; i += 1) {
    const spear = new THREE.Mesh(spearGeo, spearMaterial);
    const angle = (i / 5) * Math.PI * 2;
    spear.position.set(Math.cos(angle) * radius * 0.5, height * 0.42, Math.sin(angle) * radius * 0.5);
    spear.rotation.set(0.1, angle, 0.12);
    jar.add(spear);
  }

  const label = new THREE.Mesh(
    labelBandGeometry({ height, radius, segments: segments(quality, 60, 26) }),
    new THREE.MeshStandardMaterial({
      map: labelTexture(),
      roughness: 0.88,
      metalness: 0,
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );
  label.position.y = height * 0.34;
  jar.add(label);

  const lid = new THREE.Mesh(
    lidGeometry({ height, radius, segments: segments(quality, 56, 26) }),
    metal(0xc09a31, 0.34),
  );
  lid.position.y = height;
  group.add(lid);

  const floating = [];
  for (let i = 0; i < 3; i += 1) {
    const spear = new THREE.Mesh(spearGeo, spearMaterial);
    spear.userData.angle = (i / 3) * Math.PI * 2;
    group.add(spear);
    floating.push(spear);
  }

  const aroma = aromaRibbon(quality);
  aroma.position.y = height * 0.96;
  group.add(aroma);

  const burst = createBurst({
    count: count(quality, 900),
    radius: 8.5,
    size: 1.0,
    color: 0xe0b447,
    opacity: 0.95,
    pixelRatio: ctx.pixelRatio,
  });
  burst.position.y = height * 0.94;
  group.add(burst);

  const inner = createBubbles({
    count: count(quality, 260),
    radius: radius * 0.75,
    bottom: 0.5,
    top: height * 0.76,
    size: 0.7,
    color: 0xd8ecac,
    opacity: 0.5,
    pixelRatio: ctx.pixelRatio,
  });
  inner.material.uniforms.uSpeed.value = 0.2;
  jar.add(inner);

  const halo = glow({ color: HEX.mustard, size: 15, opacity: 0.16 });
  halo.position.set(0, height * 0.6, -5);
  group.add(halo);

  const pool = glow({ color: 0xc9a33a, size: 16, opacity: 0.12 });
  pool.position.set(0, 0.12, 0);
  group.add(pool);

  const motes = createMotes({
    count: count(quality, 520),
    bounds: new THREE.Vector3(26, 18, 22),
    size: 0.36,
    color: 0xf0d089,
    opacity: 0.3,
    pixelRatio: ctx.pixelRatio,
  });
  motes.position.y = 5;
  group.add(motes);

  const beatMood = mood({
    fog: 0x120f08,
    fogDensity: 0.022,
    skyTop: 0x2a2411,
    skyBottom: 0x0b0a06,
    key: 0xffe7ba,
    keyIntensity: 2.8,
    keyPosition: new THREE.Vector3(4, 9, 8),
    fill: 0x8ba24d,
    fillIntensity: 0.6,
    rim: 0xe8b73a,
    rimIntensity: 3.6,
    ambient: 0x33301c,
    ambientIntensity: 0.6,
    bloom: 0.42,
    exposure: 1.1,
  });

  return {
    group,
    mood: beatMood,
    camera: {
      enter: { position: new THREE.Vector3(0, 6.2, 24), look: new THREE.Vector3(0, 4.6, 0) },
      exit: { position: new THREE.Vector3(0, 7.2, 17.5), look: new THREE.Vector3(0, 5, 0) },
    },
    update({ local, time }) {
      const open = smooth(0.05, 0.34, local);
      const release = smooth(0.18, 0.86, local);
      const finale = smooth(0.6, 1, local);

      lid.position.y = height + open * 1.9;
      lid.rotation.set(open * 1.05, open * 4.2, open * 0.6);
      lid.position.x = open * 3.6;
      lid.position.z = open * 1.2;

      jar.rotation.y = time * 0.06 + local * 0.5;
      jar.position.y = Math.sin(time * 0.5) * 0.06;

      aroma.material.uniforms.uTime.value = time;
      aroma.material.uniforms.uProgress.value = release * 1.28;
      aroma.material.uniforms.uOpacity.value = 0.22 + release * 0.4;
      aroma.rotation.y = time * 0.12;

      burst.material.uniforms.uTime.value = time;
      burst.material.uniforms.uProgress.value = release;
      burst.material.uniforms.uOpacity.value = 0.25 + release * 0.6;

      inner.material.uniforms.uTime.value = time;
      inner.material.uniforms.uOpacity.value = 0.3 + open * 0.4;

      for (let i = 0; i < floating.length; i += 1) {
        const spear = floating[i];
        const angle = spear.userData.angle + time * 0.24;
        const r = 5.4 + finale * 1.4;
        spear.position.set(
          Math.cos(angle) * r,
          height * 0.34 + Math.sin(time * 0.6 + i * 2) * 0.35 + finale * 0.7,
          Math.sin(angle) * r,
        );
        spear.rotation.set(Math.sin(time * 0.4 + i) * 0.4, angle * 1.2, 1.1);
        spear.scale.setScalar(Math.max(smooth(0.28, 0.55, local) * 0.5, 0.0001));
      }

      halo.material.opacity = 0.12 + finale * 0.14;
      pool.material.opacity = 0.09 + release * 0.09;

      beatMood.bloom = 0.34 + finale * 0.2;
      beatMood.exposure = 1.05 + finale * 0.12;
      beatMood.rimIntensity = 2.4 + release * 2.4;

      motes.material.uniforms.uTime.value = time;
      motes.material.uniforms.uOpacity.value = 0.24 + finale * 0.24;
    },
  };
}
