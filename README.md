# 🥒 K-Pickle — Enterprise WebGL Brand Experience

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022_Native_ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebGL](https://img.shields.io/badge/WebGL-3D_Engine-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
[![Three.js](https://img.shields.io/badge/Three.js-r160-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-88CE02?style=for-the-badge&logo=greensock&logoColor=black)](https://gsap.com/)
[![Lenis](https://img.shields.io/badge/Lenis-Smooth_Scroll-7B2CBF?style=for-the-badge)](https://github.com/darkroomengineering/lenis)
[![License: MIT](https://img.shields.io/badge/License-MIT-007EC6?style=for-the-badge)](LICENSE)
[![Accessibility](https://img.shields.io/badge/WCAG_2.1-AA_Compliant-008080?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Build: Zero Bundler](https://img.shields.io/badge/Build-Zero_Bundler-44CC11?style=for-the-badge)](#tech-stack--cdn-infrastructure)

> **K-Pickle Enterprise Edition** is an ultra-performant, scroll-driven brand storytelling showcase built with raw WebGL background scenes, custom GLSL shaders, and continuous 60 FPS canvas frame-sequence scrubbing — fully zero-bundler with zero build step overhead.

---

## 📽️ Interactive Visual Showcase

![K-Pickle Interactive WebGL & Frame Scrubbing Demo](media/demo.gif)

### 🌐 Live Production Demo
👉 **[Experience K-Pickle Live on GitHub Pages](https://karimdavi.github.io/k-pickle/)**

---

## 📋 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture](#-system-architecture)
- [Story Beats Narrative Matrix](#-story-beats-narrative-matrix)
- [Technical Architecture & Key Innovations](#-technical-architecture--key-innovations)
- [Tech Stack & CDN Infrastructure](#-tech-stack--cdn-infrastructure)
- [Performance Engineering & Hardware Tiering](#-performance-engineering--hardware-tiering)
- [Accessibility & Motion Compliance](#-accessibility--motion-compliance)
- [Repository Hierarchy](#-repository-hierarchy)
- [Enterprise Deployment & Local Setup](#-enterprise-deployment--local-setup)
- [Browser & Platform Support](#-browser--platform-support)
- [Security & Governance](#-security--governance)
- [License & Credits](#-license--credits)

---

## 💡 Executive Summary

**K-Pickle** is an immersive digital brand narrative detailing the artisanal origin of small-batch pickles across six scroll-pinned interactive beats: **Hero**, **Garden**, **Brine**, **Crock**, **Jar**, and **Taste**. 

Engineered for enterprise-grade digital publishing, the project demonstrates how high-end visual storytelling can achieve 60 FPS rendering on modern devices without heavy npm dependencies, bundlers (Webpack/Vite), or pre-rendered standard `<video>` elements that suffer from seek-decoding performance bottlenecks.

---

## 🏗️ System Architecture

The runtime architecture decouples background canvas frame scrubbing from foreground WebGL 3D rendering and scroll timeline orchestration:

```text
                  +-----------------------------------+
                  |      User Scroll Input            |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |    Lenis Smooth Scroll Engine     |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |  GSAP + ScrollTrigger Timeline    |
                  +-----------------------------------+
                       /                         \
                      /                           \
                     v                             v
+------------------------------------+   +------------------------------------+
|   Canvas Frame-Sequence Scrubber   |   |   Three.js WebGL Scene Renderer    |
| - Preloaded JPG frame sequences    |   | - Dynamic Camera Transformations   |
| - Instant scroll-position seek     |   | - GLSL Shaders (Liquid, Grain)     |
| - Smooth beat crossfading engine   |   | - Adaptive Post-processing Pass    |
+------------------------------------+   +------------------------------------+
                     \                             /
                      \                           /
                       v                         v
                  +-----------------------------------+
                  |   Hardware Tiering Controller     |
                  | - Tier Detection (High/Med/Low)   |
                  | - Dynamic Resolution Scaling      |
                  | - Fallback & Motion Constraints   |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |      Composite Screen Output      |
                  +-----------------------------------+
```

---

## 🎬 Story Beats Narrative Matrix

The site's storytelling pipeline is divided into six contiguous beats. Each beat combines a canvas frame sequence scrubbed to scroll position alongside interactive 3D WebGL scenes and custom GLSL shaders:

| Beat | Name | Narrative Focus | WebGL Shader & Scene FX | Canvas Frame Sequence | Interactivity / Audio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Hero** | Brand Establishment & Origin | Ambient particle mist, glass transmission shaders | `media/frames/hero/*.jpg` (60 frames) | Scroll cue & brand wordmark overlay |
| **02** | **Garden** | Soil & Harvest | Sunlit volume depth fog, foliage particle field | `media/frames/garden/*.jpg` (60 frames) | Scroll-pinned narrative text |
| **03** | **Brine** | Recipe & Spices | Liquid refract GLSL shader, floating spice points | `media/frames/brine/*.jpg` (60 frames) | Dynamic opacity crossfade |
| **04** | **Crock** | Fermentation & Time | Atmospheric grain shader, dust motes simulation | `media/frames/crock/*.jpg` (60 frames) | Cellar lighting beam reaction |
| **05** | **Jar** | Artisanal Packaging | High-precision rim lighting, label showcase | `media/frames/jar/*.jpg` (60 frames) | Custom handoff window (`xfadeStart: 0.8`) |
| **06** | **Taste** | The Final Exhale | Closing glow shaders & interactive CTA cards | `media/frames/taste/*.jpg` (60 frames) | One-shot audio trigger (`taste-sound.mp3`) |

---

## ⚡ Technical Architecture & Key Innovations

### 1. Canvas Frame-Sequence vs. Video Seeking
Standard WebGL/HTML5 video scrubbing via `HTMLVideoElement.currentTime` suffers from video decoder bottlenecks: standard MP4/H.264 streams contain keyframes (I-frames) separated by predictive frames (P/B-frames). Seeking backwards or to arbitrary scroll points forces the browser to decode forward from keyframe zero, causing severe scroll stutter and dropped frames.

**K-Pickle Solution:** 
Each story beat is converted into 60 extracted, high-quality JPG frames (`media/frames/{beat}/NNN.jpg`). `js/main.js` manages an asynchronous canvas frame preloader and draws the exact target image directly to an HTML5 `<canvas>` based on scroll progress. This guarantees zero decoding latency and rock-solid 60 FPS scrolling performance across desktop and mobile devices.

### 2. Modern Native ESM (Import Maps)
No Node.js, `package.json`, or bundler required. Libraries are resolved directly by native browser import maps in `index.html`:
```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/",
    "gsap": "https://unpkg.com/gsap@3.12.5/index.js",
    "gsap/ScrollTrigger": "https://unpkg.com/gsap@3.12.5/ScrollTrigger.js",
    "lenis": "https://unpkg.com/lenis@1.0.42/dist/lenis.mjs"
  }
}
</script>
```

---

## 🛠️ Tech Stack & CDN Infrastructure

| Layer | Technology | Source / Version | Purpose & Enterprise Rationale |
| :--- | :--- | :--- | :--- |
| **Language** | Modern ES2022+ | Native Browser ESM | Zero build step, maximum maintainability |
| **3D Engine** | Three.js | `v0.160.0` (Unpkg CDN) | Hardware-accelerated WebGL scene rendering & custom geometry |
| **Animation** | GSAP + ScrollTrigger | `v3.12.5` (Unpkg CDN) | Precise scroll-bound timeline synchronization & beat orchestration |
| **Smooth Scroll**| Lenis | `v1.0.42` (Unpkg CDN) | Normalized smooth kinetic scrolling across input devices |
| **Audio** | HTML5 Audio API | Native Browser API | Web Audio API execution with autoplay policy guards |
| **Video Production**| Google Flow (Veo 3) | Proprietary AI Video Engine | AI-generated cinematic 16:9 source footage (`flow-video-specs.md`) |

---

## 📊 Performance Engineering & Hardware Tiering

`js/quality.js` dynamically queries client system capabilities at runtime and adjusts rendering parameters to maintain high frame rates:

```javascript
// Hardware Detection Heuristics
const cores = navigator.hardwareConcurrency || 4;
const memory = navigator.deviceMemory || 4;
const isMobile = matchMedia('(max-width: 768px)').matches || matchMedia('(pointer: coarse)').matches;
```

### Hardware Tiering Strategy Matrix

| Feature / Setting | High Tier (Desktop / GPU) | Medium Tier (Laptops) | Low Tier (Mobile / Integrated) |
| :--- | :--- | :--- | :--- |
| **Pixel Ratio (`dpr`)** | Native (`Math.min(window.devicePixelRatio, 2)`) | Capped at `1.25` | Locked at `1.0` |
| **Particle Density** | 100% density | 50% density | Disable particles |
| **Transmission Shader** | Full physical refraction | Standard physical | Basic MeshPhongMaterial |
| **Post-processing** | Bloom + Film Grain GLSL | Film Grain only | Direct canvas render (No FX) |
| **Frame Preloading** | Preload lead = 1 beat | Preload lead = 1 beat | On-demand beat loading |

---

## ♿ Accessibility & Motion Compliance

K-Pickle provides first-class support for accessibility compliance:

- **`prefers-reduced-motion` Support:** Automatically detected via CSS media query `(prefers-reduced-motion: reduce)`. When active, Lenis smooth scrolling, GSAP scrubbing, and auto-audio playback are instantly disabled, falling back to standard discrete section stepping.
- **WebGL Unavailable Fallback:** Gracefully degrades to a solid brand-themed `.no-webgl` layout if WebGL context creation fails or is disabled by user policies (`js/quality.js#webglAvailable`).
- **WCAG 2.1 Contrast Standards:** Structured HTML hierarchy with semantic section tags, keyboard focus states, and accessible ARIA attributes.

---

## 📂 Repository Hierarchy

```text
k-pickle/
├── README.md                 # Project documentation & enterprise overview
├── LICENSE                   # MIT Open Source License
├── index.html                # Page entry point, DOM beats, Import Map configuration
├── serve.py                  # Dev server with HTTP Range header support
├── flow-video-specs.md       # AI Video Prompt Engineering specification (Google Flow)
├── css/
│   └── style.css             # Main stylesheet, CSS variables, accessibility overrides
├── js/
│   ├── main.js               # Entry point: frame scrubber, audio wiring, quality init
│   ├── scene.js              # Three.js canvas setup, camera, lighting, render loop
│   ├── story.js              # GSAP ScrollTrigger timeline orchestration & Lenis scroll
│   ├── geometry.js           # Custom 3D meshes & procedural geometry definitions
│   ├── materials.js          # Material shaders, transmission & fallback materials
│   ├── palette.js            # Unified brand color tokens shared across CSS & WebGL
│   ├── quality.js            # Client hardware tier & motion preference detector
│   ├── beats/                # Individual story beat logic modules
│   │   ├── hero.js           # Beat 1 logic
│   │   ├── garden.js         # Beat 2 logic
│   │   ├── brine.js          # Beat 3 logic
│   │   ├── crock.js          # Beat 4 logic
│   │   ├── jar.js            # Beat 5 logic
│   │   └── taste.js          # Beat 6 logic
│   └── shaders/              # Custom GLSL shader chunks
│       ├── liquid.js         # Refractive brine shader
│       ├── grain.js          # Film noise postprocessor
│       ├── sky.js            # Atmospheric gradient shader
│       └── points.js         # Particle simulation shader
└── media/
    ├── demo.gif              # Animated repository visual preview
    ├── manifest.json         # Master manifest for available beat frame sequences
    ├── taste-sound.mp3       # CTA beat ambient audio sample
    ├── *.mp4                 # Source 1080p clips generated via Google Flow (Veo)
    └── frames/               # Extracted 60-frame JPG sequences per beat
        ├── hero/             # 001.jpg .. 060.jpg
        ├── garden/           # 001.jpg .. 060.jpg
        ├── brine/            # 001.jpg .. 060.jpg
        ├── crock/            # 001.jpg .. 060.jpg
        ├── jar/              # 001.jpg .. 060.jpg
        └── taste/            # 001.jpg .. 060.jpg
```

---

## 💻 Enterprise Deployment & Local Setup

### Running Locally

To run locally, execute the included python dev server:

```bash
python3 serve.py
```

> **Why `serve.py`?**  
> Native `python3 -m http.server` lacks support for HTTP `Range` requests. Modern web browsers issue chunked `Range` headers during rapid image/video requests. `serve.py` adds HTTP `206 Partial Content` support required for stutter-free local testing.

### Production Static Hosting

The codebase consists exclusively of static assets (`.html`, `.js`, `.css`, `.jpg`, `.mp4`) and can be deployed directly to enterprise static delivery platforms:

- **AWS S3 + CloudFront:** Ensure CloudFront distributions forward `Range` headers.
- **Nginx:** Enable `open_file_cache` and static gzip compression.
- **Vercel / Netlify / GitHub Pages:** Native support out-of-the-box.

---

## 🌐 Browser & Platform Support

Tested across major browser engines and platforms:

| Browser / Platform | Version | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Google Chrome** | 100+ | ✅ Supported | Full WebGL 2.0 & Canvas Acceleration |
| **Apple Safari** | 15+ | ✅ Supported | Hardware Tiering active for iOS devices |
| **Mozilla Firefox** | 98+ | ✅ Supported | Import Maps supported natively |
| **Microsoft Edge** | 100+ | ✅ Supported | Full Feature Parity |
| **iOS Safari** | 15+ | ✅ Supported | Touch scroll & reduced particle density |
| **Android Chrome** | 100+ | ✅ Supported | Adaptive DPR capping active |

---

## 🔒 Security & Governance

- **Zero NPM Supply Chain Risks:** By avoiding npm build tools and node runtime dependencies, the repository eliminates `node_modules` vulnerability trees and supply-chain attacks.
- **No Third-party Data Collection:** The codebase contains zero analytics tracking, telemetry scripts, or external data collection endpoints.

---

## 📄 License & Credits

- **License:** Distributed under the [MIT License](LICENSE).
- **Brand Disclaimer:** K-Pickle is a fictional small-batch pickle brand created as a technological and design demonstration piece. All wordmarks, visual designs, and story beats are created strictly for educational and portfolio demonstration purposes.

---

<p align="center">
  Crafted with precision using <b>Three.js</b>, <b>GSAP</b>, and <b>Native ESM</b>.
</p>
