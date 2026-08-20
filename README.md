# K-Pickle

A scroll-driven brand story site built with a WebGL background scene, custom shaders, and
scroll-scrubbed frame-sequence video — no framework, no build step.

**K-Pickle** itself is a fictional small-batch pickle brand invented for this piece. The site
tells its origin story across six scroll-pinned beats — Hero, Garden, Brine, Crock, Jar,
Taste — with a three.js scene running behind the content and dissolving between per-beat
background clips as you scroll.

## Live demo

_Add your deployed URL here (GitHub Pages, Netlify, Vercel — all work with zero config since
this is a static site)._

## Stack

- **Vanilla JS, ES modules** — no framework, no bundler, no `package.json`
- **[three.js](https://threejs.org/)** — WebGL background scene, custom geometry, custom shaders
- **[GSAP](https://gsap.com/) + ScrollTrigger** — scroll-driven timeline for each story beat
- **[Lenis](https://github.com/darkroomengineering/lenis)** — smooth scroll
- **Canvas frame-sequence playback** — each beat's background is 60 JPGs scrubbed against
  scroll position on a `<canvas>`, not a `<video>` element (see `js/main.js` for why — video
  seek has to decode forward from frame zero on every scrub step, which is unusable for this)
- Dependencies load from CDN via an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) in `index.html` — nothing to `npm install`

## Running locally

```bash
python3 serve.py        # http://localhost:8765
```

Use `serve.py`, not `python3 -m http.server` — the stock server ignores `Range` headers, which
some browsers rely on even for `fetch`/`<img>` loading patterns during scroll scrubbing. Any
real static host (GitHub Pages, Netlify, Vercel, S3, nginx) supports `Range` natively, so this
is local-only tooling.

## Structure

```
index.html            Page structure and per-beat copy
css/style.css          All styling, including the reduced-motion and low-quality-tier overrides
js/
  main.js               Entry point: quality detection, frame-sequence loader, beat wiring
  scene.js              three.js scene/camera/renderer setup
  geometry.js            Custom geometry for the WebGL scene
  materials.js            Custom materials
  palette.js              Brand color tokens shared between CSS and the WebGL scene
  quality.js               Device-tier + reduced-motion + WebGL-availability detection
  story.js                  GSAP ScrollTrigger timeline orchestration, Lenis wiring
  beats/                     One module per story beat (hero, garden, brine, crock, jar, taste)
  shaders/                    Custom shader chunks (liquid, grain, points, sky, noise)
media/
  *.mp4                  Source clips generated in Google Flow (Veo) — see flow-video-specs.md
  frames/{beat}/NNN.jpg   60-frame sequence extracted from each source clip, what the site
                          actually plays back (canvas-scrubbed, not the source video files)
  manifest.json           Lists which beats have a frame sequence available
flow-video-specs.md    Prompt/spec doc used to generate the six background clips in Flow
serve.py               Local dev server with HTTP Range support
```

## Performance & accessibility

- Detects device tier (`js/quality.js`) from `hardwareConcurrency`, `deviceMemory`, pointer
  type, and viewport size, and drops transmission materials, postprocessing, particle density,
  and pixel ratio on weaker devices.
- Honors `prefers-reduced-motion`: disables Lenis smooth scroll, GSAP scroll-scrubbing, and
  the ambient beat audio; falls back to instant scroll-position stepping.
- Falls back gracefully when WebGL is unavailable (`js/quality.js#webglAvailable`).

## Known limitations

- `--cream-soft` in `css/style.css` is documented in-code as measuring 3.3:1 contrast over the
  carded panel backdrop for small uppercase type (`.facts`, `.signoff`) — below WCAG AA's 4.5:1
  threshold for that text size. Flagged in the source; not yet fixed.
- "Order a case" and "Find a stockist" on the closing beat are intentionally inert — there's no
  backend behind this fictional brand, so they're left as on-brand decoration rather than wired
  to a fake checkout or contact form.

## License

MIT — see [LICENSE](LICENSE). K-Pickle is a fictional brand created for this project; the name,
wordmark, and copy are not a real product.
