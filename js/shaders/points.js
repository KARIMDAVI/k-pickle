import * as THREE from 'three';

const SOFT_SPRITE = /* glsl */`
uniform vec3 uColor;
uniform vec3 uHighlight;
uniform float uRim;

varying float vAlpha;
varying float vLife;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.5, 0.06, d);
  float shell = smoothstep(0.5, 0.44, d) * (1.0 - smoothstep(0.44, 0.3, d));
  float glint = smoothstep(0.24, 0.0, length(uv - vec2(-0.14, 0.16)));

  vec3 col = uColor * (0.28 + core * 0.55) + uHighlight * (shell * uRim + glint * 0.5 * uRim);
  float alpha = vAlpha * (core * 0.5 + shell * uRim + glint * 0.35 * uRim);
  gl_FragColor = vec4(col, alpha);
}
`;

const BUBBLE_VERT = /* glsl */`
uniform float uTime;
uniform float uSize;
uniform float uOpacity;
uniform float uSpeed;
uniform float uPixelRatio;
uniform float uBottom;
uniform float uTop;
uniform float uSpread;

attribute float aSeed;
attribute float aSpeed;
attribute float aScale;

varying float vAlpha;
varying float vLife;

void main() {
  float life = fract(aSeed + uTime * aSpeed * uSpeed);
  vLife = life;

  float y = mix(uBottom, uTop, life);
  float wobble = sin(uTime * 1.7 + aSeed * 43.0) * uSpread * (0.25 + life * 0.9);
  float wobbleZ = cos(uTime * 1.35 + aSeed * 27.0) * uSpread * (0.25 + life * 0.9);

  vec3 pos = vec3(position.x + wobble, y, position.z + wobbleZ);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  float grow = smoothstep(0.0, 0.14, life) * (1.0 - smoothstep(0.78, 1.0, life));
  float swell = mix(0.6, 1.25, life);

  gl_PointSize = uSize * aScale * grow * swell * uPixelRatio * (240.0 / max(-mv.z, 0.001));
  vAlpha = grow * uOpacity;
  gl_Position = projectionMatrix * mv;
}
`;

const MOTE_VERT = /* glsl */`
uniform float uTime;
uniform float uSize;
uniform float uOpacity;
uniform float uDrift;
uniform float uPixelRatio;
uniform vec3 uBounds;

attribute float aSeed;
attribute float aSpeed;
attribute float aScale;

varying float vAlpha;
varying float vLife;

void main() {
  float t = uTime * uDrift;
  vec3 pos = position;
  pos.x += sin(t * aSpeed * 0.6 + aSeed * 31.0) * uBounds.x * 0.12;
  pos.y = mod(position.y + t * aSpeed * 0.55 + uBounds.y * 0.5, uBounds.y) - uBounds.y * 0.5;
  pos.z += cos(t * aSpeed * 0.5 + aSeed * 19.0) * uBounds.z * 0.12;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float twinkle = 0.55 + 0.45 * sin(uTime * 2.1 + aSeed * 53.0);

  vLife = twinkle;
  gl_PointSize = uSize * aScale * uPixelRatio * (240.0 / max(-mv.z, 0.001));
  vAlpha = uOpacity * twinkle;
  gl_Position = projectionMatrix * mv;
}
`;

const BURST_VERT = /* glsl */`
uniform float uTime;
uniform float uSize;
uniform float uOpacity;
uniform float uProgress;
uniform float uRadius;
uniform float uPixelRatio;
uniform float uSwirl;

attribute float aSeed;
attribute float aSpeed;
attribute float aScale;

varying float vAlpha;
varying float vLife;

void main() {
  float life = clamp(uProgress * (0.5 + aSpeed * 0.9), 0.0, 1.0);
  float eased = 1.0 - pow(1.0 - life, 3.0);

  vec3 dir = normalize(position);
  float swirlAngle = uSwirl * eased * (1.0 + aSeed) + uTime * 0.25;
  float cs = cos(swirlAngle);
  float sn = sin(swirlAngle);
  vec3 spun = vec3(dir.x * cs - dir.z * sn, dir.y, dir.x * sn + dir.z * cs);

  vec3 pos = spun * uRadius * eased;
  pos.y += eased * 2.4 + sin(uTime * 1.2 + aSeed * 30.0) * 0.12 * eased;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float fade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.55, 1.0, life));

  vLife = life;
  gl_PointSize = uSize * aScale * (0.4 + eased * 1.4) * uPixelRatio * (240.0 / max(-mv.z, 0.001));
  vAlpha = fade * uOpacity;
  gl_Position = projectionMatrix * mv;
}
`;

function attributes(count, geometry, randomScale) {
  const seeds = new Float32Array(count);
  const speeds = new Float32Array(count);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    seeds[i] = Math.random();
    speeds[i] = 0.45 + Math.random() * 1.1;
    scales[i] = randomScale();
  }
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
}

export function createBubbles({
  count = 400,
  radius = 2,
  bottom = -2,
  top = 2,
  size = 26,
  color = 0xb9d68a,
  highlight = 0xe8dcc4,
  opacity = 0.8,
  pixelRatio = 1,
} = {}) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  attributes(count, geometry, () => 0.35 + Math.pow(Math.random(), 2.2) * 1.15);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uOpacity: { value: opacity },
      uSpeed: { value: 0.12 },
      uPixelRatio: { value: pixelRatio },
      uBottom: { value: bottom },
      uTop: { value: top },
      uSpread: { value: 0.12 },
      uRim: { value: 1 },
      uColor: { value: new THREE.Color(color) },
      uHighlight: { value: new THREE.Color(highlight) },
    },
    vertexShader: BUBBLE_VERT,
    fragmentShader: SOFT_SPRITE,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function createBurst({
  count = 700,
  radius = 9,
  size = 16,
  color = 0xd4a72c,
  highlight = 0xfff0cf,
  opacity = 0.9,
  pixelRatio = 1,
} = {}) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const cone = 0.35 + Math.random() * 0.65;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * cone;
    positions[i * 3 + 1] = Math.abs(Math.cos(phi)) * 0.9 + 0.25;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * cone;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  attributes(count, geometry, () => 0.3 + Math.pow(Math.random(), 2) * 1.2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uOpacity: { value: opacity },
      uProgress: { value: 0 },
      uRadius: { value: radius },
      uSwirl: { value: 2.4 },
      uPixelRatio: { value: pixelRatio },
      uRim: { value: 0.6 },
      uColor: { value: new THREE.Color(color) },
      uHighlight: { value: new THREE.Color(highlight) },
    },
    vertexShader: BURST_VERT,
    fragmentShader: SOFT_SPRITE,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function createMotes({
  count = 600,
  bounds = new THREE.Vector3(40, 22, 40),
  size = 12,
  color = 0xd4a72c,
  highlight = 0xe8dcc4,
  opacity = 0.5,
  pixelRatio = 1,
} = {}) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * bounds.x;
    positions[i * 3 + 1] = (Math.random() - 0.5) * bounds.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  attributes(count, geometry, () => 0.25 + Math.pow(Math.random(), 3) * 1.3);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uOpacity: { value: opacity },
      uDrift: { value: 0.35 },
      uPixelRatio: { value: pixelRatio },
      uBounds: { value: bounds },
      uRim: { value: 0.25 },
      uColor: { value: new THREE.Color(color) },
      uHighlight: { value: new THREE.Color(highlight) },
    },
    vertexShader: MOTE_VERT,
    fragmentShader: SOFT_SPRITE,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}
