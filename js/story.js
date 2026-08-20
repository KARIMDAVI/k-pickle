import * as THREE from 'three';
import Lenis from 'lenis';
import { mood as makeMood, lerpHex } from './palette.js';

const SPACING = 200;
const DWELL = 0.72;
const MOOD_BLEND_START = 0.6;

/* A panel's out-tween used to end (i+1.0) after the next panel's in-tween had already
   started (i+1-0.2=i+0.8) — a 0.2-unit window where both were partially opaque at once.
   Fine for one photo dissolving into another, but two dense text blocks double-exposed
   read as an unreadable jumble. These constants make the handoff exact instead: OUT ends
   at i+PANEL_OUT_START+PANEL_OUT_DUR, IN for the next panel starts at (i+1)+PANEL_IN_START
   — same value, zero overlap. */
const PANEL_OUT_START = 0.68;
const PANEL_OUT_DUR = 0.18;
const PANEL_IN_START = -0.14;
const PANEL_IN_DUR = 0.28;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const HEX_KEYS = ['fog', 'skyTop', 'skyBottom', 'key', 'fill', 'rim', 'ambient'];
const NUMBER_KEYS = [
  'fogDensity', 'skyIntensity', 'keyIntensity', 'fillIntensity',
  'rimIntensity', 'ambientIntensity', 'bloom', 'exposure',
];

function blendMood(out, a, b, t) {
  for (const key of HEX_KEYS) out[key] = lerpHex(a[key], b[key], t);
  for (const key of NUMBER_KEYS) out[key] = a[key] + (b[key] - a[key]) * t;
  out.keyPosition.copy(a.keyPosition).lerp(b.keyPosition, t);
  return out;
}

export function createStory({ stage, beats, quality }) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const total = beats.length;
  const stations = [];

  beats.forEach((beat, i) => {
    beat.group.position.z = -SPACING * i;
    beat.group.visible = i === 0;
    stage.scene.add(beat.group);
    stations.push(new THREE.Vector3(0, 0, -SPACING * i));
  });

  const panels = Array.from(document.querySelectorAll('.panel'));
  const railButtons = Array.from(document.querySelectorAll('.rail button'));
  const brandbar = document.querySelector('[data-brandbar]');
  const counters = panels.map((panel) => panel.querySelector('[data-count-from]'));
  const counterCache = new Array(panels.length).fill('');

  const desktop = window.matchMedia('(min-width: 901px)');

  function applyPanelBase() {
    const wide = desktop.matches;
    panels.forEach((panel) => {
      const centered = panel.dataset.align === 'center';
      gsap.set(panel, {
        xPercent: centered && wide ? -50 : 0,
        yPercent: centered || wide ? -50 : 0,
        y: 0,
      });
    });
  }

  applyPanelBase();
  gsap.set(panels, { opacity: 0 });
  gsap.set(panels[0], { opacity: 1 });

  const lenis = quality.reduced ? null : new Lenis({
    duration: 1.1,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.4,
    lerp: 0.09,
  });

  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* Scroll position in beats (0..total). The only thing this module publishes — the
     background frame-sequence layer derives its own blending from it in main.js. */
  const state = { t: 0 };

  const master = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: quality.reduced ? true : 0.85,
      invalidateOnRefresh: true,
    },
  });

  master.to(state, { t: total, duration: total }, 0);

  panels.forEach((panel, i) => {
    const shift = panel.dataset.align === 'center' ? 18 : 30;
    if (i > 0) {
      master.fromTo(
        panel,
        { opacity: 0, y: shift },
        { opacity: 1, y: 0, duration: PANEL_IN_DUR, ease: 'power2.out' },
        i + PANEL_IN_START,
      );
    }
    if (i < total - 1) {
      master.to(panel, { opacity: 0, y: -shift, duration: PANEL_OUT_DUR, ease: 'power2.in' }, i + PANEL_OUT_START);
    }
  });

  railButtons.forEach((button, i) => {
    button.addEventListener('click', () => {
      const trigger = master.scrollTrigger;
      const target = trigger.start + ((i + 0.3) / total) * (trigger.end - trigger.start);
      if (lenis) lenis.scrollTo(target, { duration: 1.5 });
      else window.scrollTo({ top: target, behavior: 'auto' });
    });
  });

  const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 };
  if (!quality.reduced) {
    window.addEventListener('pointermove', (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  window.addEventListener('resize', applyPanelBase);

  const activeMood = makeMood();
  const posA = new THREE.Vector3();
  const posB = new THREE.Vector3();
  const lookA = new THREE.Vector3();
  const lookB = new THREE.Vector3();
  const target = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  let railIndex = -1;
  let brandVisible = false;

  function resolvePose(t) {
    const index = clamp(Math.floor(t), 0, total - 1);
    const f = clamp(t - index, 0, 1);
    const beat = beats[index];

    if (f <= DWELL) {
      const u = easeInOut(f / DWELL);
      posA.copy(beat.camera.enter.position).add(stations[index]);
      posB.copy(beat.camera.exit.position).add(stations[index]);
      lookA.copy(beat.camera.enter.look).add(stations[index]);
      lookB.copy(beat.camera.exit.look).add(stations[index]);
      target.copy(posA).lerp(posB, u);
      lookAt.copy(lookA).lerp(lookB, u);
      return;
    }

    const next = beats[index + 1];
    const u = easeInOut((f - DWELL) / (1 - DWELL));
    posA.copy(beat.camera.exit.position).add(stations[index]);
    lookA.copy(beat.camera.exit.look).add(stations[index]);

    if (next) {
      posB.copy(next.camera.enter.position).add(stations[index + 1]);
      lookB.copy(next.camera.enter.look).add(stations[index + 1]);
    } else {
      posB.copy(posA);
      lookB.copy(lookA);
    }

    target.copy(posA).lerp(posB, u);
    lookAt.copy(lookA).lerp(lookB, u);
  }

  /* Counters run against PANEL_OUT_START rather than the full beat. A counter driven by raw
     `local` only rounds up to its final value at local 0.875, but the panel it lives in has
     already faded to opacity 0 by PANEL_OUT_START + PANEL_OUT_DUR (0.86) — so the crock
     beat's "five days in the brine" resolved on screen at 04 and never showed 05. */
  function updateCounters(index, local) {
    const element = counters[index];
    if (!element) return;
    const from = Number(element.dataset.countFrom);
    const to = Number(element.dataset.countTo);
    const pad = Number(element.dataset.countPad || 0);
    const progress = clamp(local / PANEL_OUT_START, 0, 1);
    const value = Math.round(from + (to - from) * progress);
    const text = pad ? String(value).padStart(pad, '0') : String(value);
    if (counterCache[index] !== text) {
      counterCache[index] = text;
      element.textContent = text;
    }
  }

  function update(elapsed, delta) {
    const t = clamp(state.t, 0, total);
    const index = clamp(Math.floor(t), 0, total - 1);
    const f = clamp(t - index, 0, 1);

    resolvePose(t);

    if (quality.reduced) {
      stage.camera.position.copy(target);
    } else {
      const damping = 1 - Math.exp(-7 * delta);
      pointer.currentX += (pointer.x - pointer.currentX) * damping;
      pointer.currentY += (pointer.y - pointer.currentY) * damping;
      stage.camera.position.copy(target);
      stage.camera.position.x += pointer.currentX * 0.9;
      stage.camera.position.y += -pointer.currentY * 0.55;
    }
    stage.camera.lookAt(lookAt);

    const next = beats[index + 1] || beats[index];
    const blend = smooth(MOOD_BLEND_START, 1, f);
    blendMood(activeMood, beats[index].mood, next.mood, blend);
    stage.applyMood(activeMood);

    for (let i = 0; i < total; i += 1) {
      const beat = beats[i];
      const visible = t > i - 1.32 && t < i + 1.32;
      beat.group.visible = visible;
      if (!visible) continue;

      const local = clamp(t - i, 0, 1);
      const time = quality.reduced ? i * 6 + local * 6 : elapsed;
      beat.update({ local, time, delta, t });
      updateCounters(i, local);
    }

    const active = clamp(Math.floor(t + 0.34), 0, total - 1);
    if (active !== railIndex) {
      railIndex = active;
      railButtons.forEach((button, i) => button.classList.toggle('is-active', i === active));
    }

    const showBrand = t > 0.55;
    if (showBrand !== brandVisible && brandbar) {
      brandVisible = showBrand;
      brandbar.classList.toggle('is-visible', showBrand);
    }
  }

  return { update, state, lenis, refresh: () => ScrollTrigger.refresh() };
}
