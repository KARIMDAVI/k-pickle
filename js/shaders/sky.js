import * as THREE from 'three';
import { NOISE } from './noise.js';

const SKY_VERT = /* glsl */`
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAG = /* glsl */`
${NOISE}
uniform vec3 uTop;
uniform vec3 uBottom;
uniform float uIntensity;
uniform float uTime;

varying vec3 vLocal;

void main() {
  vec3 dir = normalize(vLocal);
  float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uBottom, uTop, pow(h, 1.35));

  float haze = pr_fbm(dir * 2.4 + vec3(0.0, uTime * 0.012, 0.0)) * 0.5 + 0.5;
  col *= 0.86 + haze * 0.28;

  float glow = pow(1.0 - abs(dir.y), 6.0);
  col += uTop * glow * 0.16;

  /* Ordered dither: a smooth dark gradient across a full sphere bands badly without it. */
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  col += dither * 0.006;

  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

export function createSky() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(0x1f2b1a) },
      uBottom: { value: new THREE.Color(0x0d0f0a) },
      uIntensity: { value: 1 },
      uTime: { value: 0 },
    },
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.scale.setScalar(600);
  return mesh;
}
