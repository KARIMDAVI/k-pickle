import { detectQuality, webglAvailable } from './quality.js';
import { createStage } from './scene.js';
import { createStory } from './story.js';
import { createHero } from './beats/hero.js';
import { createGarden } from './beats/garden.js';
import { createBrine } from './beats/brine.js';
import { createCrock } from './beats/crock.js';
import { createJarBeat } from './beats/jar.js';
import { createTaste } from './beats/taste.js';

function degrade() {
  document.documentElement.classList.add('no-webgl');
}

const BEAT_VIDEO_NAMES = ['hero', 'garden', 'brine', 'crock', 'jar', 'taste'];

/* Frame-sequence-on-canvas, not a scrubbed <video>. Every exported clip here has exactly
   one keyframe at t=0 (confirmed with ffprobe) — normal for short generated clips, but it
   means video.currentTime seeking has to decode forward from frame zero on every single
   seek, which can't keep up with continuous scroll input and shows up as a stuck frame.
   Re-encoding with a denser keyframe interval only narrows the problem and still varies
   by browser; extracting each clip to FRAME_COUNT independent JPEGs and painting the
   right one per scroll position sidesteps the decode chain entirely — this is the
   standard technique for scroll-scrubbed video on the web. media/manifest.json is the
   source of truth for which beats have a sequence at all; a beat it doesn't list stays on
   the three.js-only look with zero requests. */
const FRAME_COUNT = 60;

/* Handoff window in beat-local scroll units (0..1 across one beat). It opens where the
   camera leaves its station (story.js DWELL) so the background handoff and the camera
   move read as one gesture, and closes just short of the beat boundary. */
const XFADE_START = 0.72;
const XFADE_END = 0.98;

/* Per-beat override of that window, plus where a beat's sequence reaches its last JPEG.
   The jar clip spends its whole run rotating the jar towards the lens and the brand label
   only reads square-on across its last ten frames (050–060, beat-local 0.83–1.0). Against
   the global window those frames were already dissolving: at local 0.90 the taste clip sat
   on top at 77% opacity, so the clearest read anyone ever got was a half-dissolved "K-PICK".
   `frameEnd` lands the sequence's final frame at 0.80 and holds it there, and `xfadeStart`
   holds the handoff to the same 0.80 — so the entire legible stretch of the rotation plays
   at full opacity first, and the square-on frame is what dissolves into taste. */
const BEAT_HANDOFF = {
  jar: { xfadeStart: 0.8, frameEnd: 0.8 },
};

const xfadeStartFor = (entry) => {
  const override = BEAT_HANDOFF[entry.name];
  return override && override.xfadeStart !== undefined ? override.xfadeStart : XFADE_START;
};

const frameEndFor = (entry) => {
  const override = BEAT_HANDOFF[entry.name];
  return override && override.frameEnd !== undefined ? override.frameEnd : 1;
};

/* A beat's JPEGs start downloading this far (in beats) before it is reached. */
const PRELOAD_LEAD = 1;

/* Seconds a sequence takes to ease up to its computed opacity once its last JPEG has
   decoded. Without it a slow-loading beat pops from the three.js scene straight to full
   video; with it that first appearance is a dissolve like every other handoff. */
const REVEAL_SECONDS = 0.35;

/* The site's only sound, on its closing beat. Deliberately a one-shot rather than a
   scrubbed track like the frame sequences above: a paused video frame still reads as a
   still image, but real-time audio paused and resumed against scroll direction reads as a
   glitch. Once per page load — the previous always-on ambient system was removed for being
   repetitive, and a clip that re-fires on every re-entry would be the same mistake. */
const TASTE_BEAT = 5;

function wireTasteSound() {
  const audio = new Audio('media/taste-sound.mp3');
  audio.preload = 'auto';
  let fired = false;

  return (t) => {
    if (t >= TASTE_BEAT) {
      if (fired) return;
      fired = true;
      /* Unmuted playback needs a prior user gesture, and scrolling is not one under
         Chrome's autoplay policy. A first-time visitor who has clicked nothing gets
         silence — an accepted limitation, so the rejection is swallowed rather than
         logged or retried. */
      const started = audio.play();
      if (started) started.catch(() => {});
    } else if (fired && !audio.paused) {
      /* Scrolled back off the last beat mid-clip: stop it rather than let it play over
         an earlier section. `fired` stays true, so re-entering does not restart it. */
      audio.pause();
    }
  };
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const smooth = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/* Every available beat gets its canvas up front, in beat order. Stacking order is load
   bearing — see beatTargets, where the handoff relies on the later beat sitting on top of
   the earlier one — and creating them lazily would make it depend on which beats happened
   to be scrolled past first. Only the JPEGs are lazy. */
function wireBeatVideos(layer) {
  if (!layer) return [];
  const entries = BEAT_VIDEO_NAMES.map((name) => ({
    name, canvas: null, ctx: null, frames: null, frameIndex: -1,
    ready: false, available: false, loading: false, reveal: 0,
  }));
  fetch('media/manifest.json').then((res) => (res.ok ? res.json() : { available: [] })).then((manifest) => {
    const available = new Set(manifest.available || []);
    entries.forEach((entry) => {
      if (!available.has(entry.name)) return;
      entry.available = true;
      entry.canvas = layer.appendChild(document.createElement('canvas'));
      entry.ctx = entry.canvas.getContext('2d', { alpha: false });
    });
  }).catch(() => {});
  return entries;
}

function loadFrames(entry) {
  if (entry.loading || !entry.available) return;
  entry.loading = true;
  let loaded = 0;
  entry.frames = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const img = new Image();
    img.decoding = 'async';
    const settle = () => {
      loaded += 1;
      if (loaded === FRAME_COUNT) entry.ready = true;
    };
    img.onload = settle;
    /* A failed frame still has to count toward FRAME_COUNT, or one dropped request out of
       60 leaves `ready` false forever and the beat never reveals its footage. drawCover
       is skipped per-frame for a failed image via the img.complete check below. */
    img.onerror = settle;
    img.src = `media/frames/${entry.name}/${String(i + 1).padStart(3, '0')}.jpg`;
    return img;
  });
}

function sizeCanvas(entry) {
  const rect = entry.canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (entry.canvas.width !== w || entry.canvas.height !== h) {
    entry.canvas.width = w;
    entry.canvas.height = h;
    entry.frameIndex = -1;
  }
}

/* Manual object-fit: cover — a canvas's backing bitmap has no CSS box model of its own,
   so the same crop math the browser does for <video> has to be done by hand here. */
function drawCover(ctx, img, canvasW, canvasH) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = canvasW / canvasH;
  let sx, sy, sw, sh;
  if (imgRatio > canvasRatio) {
    sh = img.naturalHeight;
    sw = sh * canvasRatio;
    sy = 0;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sw = img.naturalWidth;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

/* Two clips hand over with a one-sided dissolve rather than a symmetric crossfade: the
   outgoing one holds at full opacity underneath while the incoming one — later in the DOM,
   so painted over it — fades in on top. The layer therefore stays fully opaque for the
   whole handoff and the three.js scene behind it can never bleed through. That bleed-
   through was the bug: procedural geometry and real footage stage the same subject
   differently (the jar beat modelled a shelf of jars against a clip of one jar on a
   table), so any moment where both showed at once read as a broken double exposure rather
   than a transition.

   A clip only ever fades *out* when the beat it is handing over to has no footage — that
   is the one case where there is nothing to dissolve into, and revealing the three.js
   scene is the intended connective tissue rather than an accident. */
function beatTargets(entries, t, out) {
  const last = entries.length - 1;
  const index = clamp(Math.floor(t), 0, last);
  const next = entries[index + 1];
  const handedOver = next ? next.available : true;
  const p = smooth(xfadeStartFor(entries[index]), XFADE_END, t - index);

  out.fill(0);
  if (entries[index].available) out[index] = handedOver ? 1 : 1 - p;
  if (next && next.available) out[index + 1] = p;
  return out;
}

function updateBeatVideos(entries, targets, t, sceneCanvas, delta) {
  beatTargets(entries, t, targets);
  let cover = 0;

  entries.forEach((entry, i) => {
    if (t > i - PRELOAD_LEAD) loadFrames(entry);
    if (!entry.canvas) return;

    if (entry.ready && entry.reveal < 1) {
      entry.reveal = Math.min(1, entry.reveal + delta / REVEAL_SECONDS);
    }
    const o = targets[i] * entry.reveal;
    if (o > cover) cover = o;

    if (o > 0) {
      sizeCanvas(entry);
      const local = clamp((t - i) / frameEndFor(entry), 0, 1);
      const targetIndex = Math.round(local * (FRAME_COUNT - 1));
      if (targetIndex !== entry.frameIndex) {
        entry.frameIndex = targetIndex;
        const img = entry.frames[targetIndex];
        /* A failed image is also `complete` (per spec, on both load and error), but has
           naturalWidth 0 — drawCover's crop math would divide by zero and canvas would
           throw on a zero-size source. */
        if (img && img.complete && img.naturalWidth) drawCover(entry.ctx, img, entry.canvas.width, entry.canvas.height);
      }
    }
    entry.canvas.style.opacity = String(o);
  });

  /* Exactly the inverse of how much of the frame the clips actually cover, so the two
     systems are never both partly visible except while a sequence is still easing in. */
  sceneCanvas.style.opacity = String(1 - cover);
}

function boot() {
  if (!window.gsap || !window.ScrollTrigger) {
    degrade();
    return;
  }
  if (!webglAvailable()) {
    degrade();
    return;
  }

  const canvas = document.getElementById('scene');
  const quality = detectQuality();

  /* webglAvailable() only probes context creation; renderer/material construction can still
     throw (e.g. a GPU on the driver blocklist, or a WebGL2 context that rejects a feature
     three.js requires) — without this guard that throw happens inside DOMContentLoaded and
     the site is left on the CSS-hidden `.panel { opacity: 0 }` state with no fallback. */
  let stage;
  let beats;
  try {
    stage = createStage({ canvas, quality });
    const ctx = { quality, pixelRatio: quality.pixelRatio };
    beats = [
      createHero(ctx),
      createGarden(ctx),
      createBrine(ctx),
      createCrock(ctx),
      createJarBeat(ctx),
      createTaste(ctx),
    ];
  } catch (err) {
    degrade();
    return;
  }

  const story = createStory({ stage, beats, quality });
  const beatVideos = quality.reduced ? [] : wireBeatVideos(document.querySelector('.bg-video'));
  const targets = new Array(beatVideos.length).fill(0);
  const updateTasteSound = wireTasteSound();

  window.gsap.ticker.add((time, deltaMS) => {
    const delta = Math.min(deltaMS / 1000, 0.05);
    story.update(time, delta);
    stage.render(time);

    if (beatVideos.length) {
      updateBeatVideos(beatVideos, targets, story.state.t, canvas, delta);
    }
    updateTasteSound(story.state.t);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.gsap.ticker.sleep();
    else window.gsap.ticker.wake();
  });

  window.addEventListener('load', () => story.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
