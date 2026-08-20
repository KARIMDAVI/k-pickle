import * as THREE from 'three';
import { NOISE } from './noise.js';

const LIQUID_VERT = /* glsl */`
${NOISE}
uniform float uTime;
uniform float uWave;
uniform float uSwirl;

varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying vec2 vPlane;
varying float vHeight;

float surfaceHeight(vec2 p) {
  float h = 0.0;
  h += sin(p.x * 1.55 + uTime * 1.05) * 0.055;
  h += sin(p.y * 1.85 - uTime * 0.82) * 0.045;
  h += sin(length(p) * 3.1 - uTime * 1.6) * 0.035;
  h += pr_fbm(vec3(p * 0.85 + vec2(uTime * 0.06, -uTime * 0.04), uTime * 0.18)) * 0.12;
  float swirl = sin(atan(p.y, p.x) * 3.0 + length(p) * 2.2 - uTime * 1.3) * 0.04 * uSwirl;
  return (h + swirl) * uWave;
}

void main() {
  vec2 p = position.xy;
  float e = 0.08;
  float h = surfaceHeight(p);
  float hx = surfaceHeight(p + vec2(e, 0.0));
  float hy = surfaceHeight(p + vec2(0.0, e));

  vec3 objNormal = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 1.0));
  vWorldNormal = normalize(mat3(modelMatrix) * objNormal);
  vPlane = p;
  vHeight = h;

  vec3 displaced = vec3(position.xy, position.z + h);
  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const LIQUID_FRAG = /* glsl */`
${NOISE}
uniform float uTime;
uniform float uOpacity;
uniform float uCloud;
uniform float uCaustic;
uniform float uRadius;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uLightDir;

varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying vec2 vPlane;
varying float vHeight;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 3.0);

  float cloud = pr_fbm(vec3(vPlane * 0.55, uTime * 0.07)) * 0.5 + 0.5;
  vec3 body = mix(uDeep, uShallow, clamp(cloud * uCloud + vHeight * 2.0 + 0.28, 0.0, 1.0));

  float caustic = pr_ridge(vec3(vPlane * 1.35, uTime * 0.24));
  caustic = pow(clamp(caustic, 0.0, 1.0), 6.0) * uCaustic;

  vec3 lightDir = normalize(uLightDir);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 90.0);

  float rim = smoothstep(uRadius, uRadius * 0.82, length(vPlane));
  float foam = smoothstep(0.62, 1.0, pr_fbm(vec3(vPlane * 2.6, uTime * 0.4))) * (1.0 - rim) * 0.6;

  vec3 col = body;
  col += uShallow * caustic * 0.85;
  col += uFoam * (spec * 1.6 + foam);
  col += uFoam * fresnel * 0.42;

  float alpha = clamp(uOpacity + fresnel * 0.35 + caustic * 0.2, 0.0, 1.0) * rim;
  gl_FragColor = vec4(col, alpha);
}
`;

const CAUSTIC_FRAG = /* glsl */`
${NOISE}
uniform float uTime;
uniform float uIntensity;
uniform float uScale;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  vec2 p = (vUv - 0.5) * uScale;
  float a = pr_ridge(vec3(p, uTime * 0.2));
  float b = pr_ridge(vec3(p * 1.9 + 4.0, uTime * 0.31));
  float cells = pow(clamp(a * b, 0.0, 1.0), 5.0);
  float falloff = 1.0 - smoothstep(0.18, 0.5, length(vUv - 0.5));
  float intensity = cells * uIntensity * falloff;
  gl_FragColor = vec4(uColor * intensity, intensity);
}
`;

const CAUSTIC_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function createBrineMaterial({
  radius = 4,
  deep = 0x223018,
  shallow = 0x8fae4f,
  foam = 0xe8dcc4,
  opacity = 0.72,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWave: { value: 1 },
      uSwirl: { value: 0 },
      uOpacity: { value: opacity },
      uCloud: { value: 0.4 },
      uCaustic: { value: 0.8 },
      uRadius: { value: radius },
      uDeep: { value: new THREE.Color(deep) },
      uShallow: { value: new THREE.Color(shallow) },
      uFoam: { value: new THREE.Color(foam) },
      uLightDir: { value: new THREE.Vector3(0.4, 1, 0.35).normalize() },
    },
    vertexShader: LIQUID_VERT,
    fragmentShader: LIQUID_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function createCausticsMaterial({ color = 0xd9c26a, intensity = 0.8, scale = 4 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uScale: { value: scale },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: CAUSTIC_VERT,
    fragmentShader: CAUSTIC_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
