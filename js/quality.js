export function detectQuality() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 720;

  const weak = cores <= 4 || memory <= 4 || (coarse && narrow);
  const tier = weak ? 'low' : 'high';

  return {
    tier,
    reduced,
    /* Transmission forces an extra opaque render pass per transmissive material; on a phone
       that alone can halve the frame rate, so low tier gets a cheaper faked glass. */
    transmission: tier === 'high',
    postprocessing: tier === 'high',
    particleScale: tier === 'high' ? 1 : 0.34,
    pixelRatio: Math.min(window.devicePixelRatio || 1, tier === 'high' ? 1.85 : 1.25),
    antialias: tier === 'low',
  };
}

export function segments(quality, high, low) {
  return quality.tier === 'high' ? high : low;
}

export function count(quality, base) {
  return Math.max(24, Math.round(base * quality.particleScale));
}

/* three r169 dropped WebGL1 support, so a WebGL1-only context is not actually usable here —
   checking for it would pass environments that then fail inside createStage(). */
export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch (err) {
    return false;
  }
}
