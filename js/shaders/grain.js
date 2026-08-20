import * as THREE from 'three';

/* Final grade pass: vignette, 35mm-ish grain, a whisper of chromatic aberration at the
   corners and a warm lift, so bloom highlights sit in a photographed image rather than a
   clean synthetic render. */
export const GrainVignetteShader = {
  name: 'GrainVignetteShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.036 },
    uVignette: { value: 0.88 },
    uAberration: { value: 0.0016 },
    uWarm: { value: new THREE.Color(0xd4a72c) },
    uWarmAmount: { value: 0.05 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uAberration;
    uniform vec3 uWarm;
    uniform float uWarmAmount;

    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      vec2 offset = centered * dist * uAberration;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + offset).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - offset).b;

      float vignette = smoothstep(0.92, 0.18, dist * uVignette);
      col *= mix(0.56, 1.0, vignette);

      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col, col * uWarm * 1.6, uWarmAmount * (1.0 - luma));

      float grain = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 137.0) - 0.5;
      col += grain * uGrain * (1.0 - luma * 0.55);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
