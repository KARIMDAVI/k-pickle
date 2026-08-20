# K-Pickle — Google Flow (Veo) Video Specs

Reference doc for generating the hero/section video clips in Flow. Hand the finished
exports to the site build — drop them where `js/scene.js` / `index.html` marks
`data-hero-video` (see that file's comment for the exact hookup).

## Brand guardrails (apply to every prompt below)

- **"K" is an original human founder character** — a weathered, warm small-batch
  fermenter (the site's brand name is "K-Pickle"; the founder in the story is "K",
  not "Rick"). Never mention "Pickle Rick," "Rick and Morty," "Rick Sanchez,"
  or describe a green anthropomorphic figure, portal/sci-fi imagery, lab coat, or
  spiky blue hair. If Flow's model drifts toward cartoon/sci-fi styling on any
  generation, regenerate — don't keep a clip that reads as the show.
- Visual language: **cinematic food/product photography**, natural and practical
  lighting, shallow depth of field, tactile textures (glass, brine, wood, cloth,
  garden soil). Think farmhouse/artisanal, not animated, not futuristic.
- Color grade to land in the brand palette: deep brine green (`#1f2b1a`–`#6b8e4e`),
  mustard/amber accents (`#d4a72c`), warm kraft/cream highlights (`#e8dcc4`), near-black
  backgrounds. Ask Flow for "warm amber and moss-green color grade" in every prompt to
  keep the six clips visually consistent as a set.
- Always add to the prompt: *"no text, no logos, no on-screen graphics, no people's
  faces in focus"* — keep clips as clean background/texture footage, not framed shots
  with legible text Flow might render wrong.

## Technical baseline (verify current limits in-app — Veo/Flow specs shift)

- **Aspect ratio:** 16:9 for every clip — they're all backing full-viewport desktop
  sections. If Flow offers a 9:16 export pass too, generate that as a second variant
  for a future mobile-optimized background (nice-to-have, not required for v1).
- **Resolution:** export at the highest tier Flow offers you (1080p if available).
- **Clip length:** Veo generations are short (commonly up to ~8s per generation as of
  this writing). Plan on generating 2–3 short takes per section and either (a) picking
  the single best loopable take, or (b) using Flow's **Extend** feature to stretch a
  good take to 15–20s for a longer background loop.
- **Loopability matters more than length** — these play as muted, looping backgrounds
  behind scroll-pinned 3D and text, not as watched-once clips. Prefer prompts with
  continuous/cyclical motion (steady drip, slow rotation, gentle steam, settling
  bubbles) over motion with a clear beginning/end (something falling and landing),
  which will visibly jump-cut on loop.
- **Frame rate:** accept Flow's default (typically 24fps); don't fight it.
- **Audio:** if Veo 3 generates ambient audio with the clip, keep it — the site's
  ambient audio bed (via Howler.js) will use isolated SFX separately, but a clip with
  natural room tone doesn't hurt as a fallback. Site video element ships muted by
  default regardless.

## Workflow tips for best results in Flow

1. **Generate a style-anchor first.** Run your Hero prompt (below) 2–3 times, pick the
   take with the color grade and lighting you like best, then screenshot a clean frame
   from it. Use that frame as a reference image ("image-to-video" / Ingredients-to-Video
   input, if Flow's UI offers it) for the remaining five prompts — this is the single
   biggest lever for making six separately-generated clips feel like one shoot instead
   of six random takes.
2. **Iterate in small prompt deltas**, not full rewrites — change one clause (camera
   move, or lighting, or subject action) between regenerations so you can tell what
   actually moved the result.
3. **Generate 3–4 takes per section minimum.** Veo output varies a lot run to run;
   budget for picking the best of several, not the first result.
4. If a take drifts off-brand (cartoonish, wrong palette, a face in focus), don't try
   to prompt your way out mid-thread — start a fresh generation with the anchor image
   re-attached.
5. Export web-ready: after picking final takes, compress to **H.264 MP4** (site
   `<video>` fallback) and optionally a **WebM/VP9** copy for smaller file size —
   most video tools/ffmpeg can do this in one pass:
   `ffmpeg -i input.mp4 -vcodec libx264 -crf 23 -preset slow -an output.mp4`
   (strip audio with `-an` for the muted background loop; keep a separate audio-on
   export only if you want it for social use elsewhere).
6. Name files to match the section they back, e.g. `hero.mp4`, `garden.mp4`,
   `brine.mp4`, `crock.mp4`, `jar.mp4`, `cta.mp4` — matches the `data-hero-video`
   slots the build uses.

---

## Section 1 — Hero

**Placement:** full-bleed background behind the "K-PICKLE" wordmark and scroll cue.
**Feel:** the whole brand in one shot — establishing, a little slow, confident.

> Cinematic macro shot, extreme slow motion: a single glass jar of pickles catching
> warm amber light, condensation beading on the glass, tiny air bubbles rising slowly
> through brine. Shallow depth of field, background a soft blur of dark moss-green.
> Warm amber and moss-green color grade, natural window light from camera-left,
> tactile and artisanal, food-photography style. Very slow, continuous, hypnotic
> motion suitable for a seamless loop. No text, no logos, no on-screen graphics, no
> people's faces in focus.

**Loop note:** ask for "continuous bubble rise, no hard cuts" — bubbles rising is
naturally loop-friendly if you trim to a steady mid-section of the clip.

---

## Section 2 — The Garden

**Placement:** origin-story section — cucumbers, soil, harvest.
**Feel:** warm, sunlit, unhurried. First act of the story.

> Golden-hour documentary footage of a small farm garden: rows of cucumber vines with
> dew on the leaves, a weathered hand (no face, wrist and forearm only, in soft focus)
> gently lifting a ripe cucumber from the vine. Warm low sun flare from camera-right,
> shallow depth of field, dust motes visible in the light. Warm amber and moss-green
> color grade, tactile and artisanal documentary style, slow deliberate camera pan.
> No text, no logos, no on-screen graphics, no people's faces in focus.

**Loop note:** favor a slow lateral pan across the vines over the hand-harvest action
for the loop — the pan is naturally continuous; use the harvest take (if you generate
one) as a one-off cutaway instead if the site needs a non-looping insert.

---

## Section 3 — The Brine

**Placement:** process section — salt, spice, water.
**Feel:** ingredients meeting, the recipe coming together.

> Close-up macro shot of clear brine being poured into a glass jar over cucumbers,
> garlic cloves, dill sprigs, and whole peppercorns, salt crystals dissolving and
> swirling as the liquid settles. Steam or condensation on the glass, warm amber
> backlighting through the jar, moss-green out-of-focus background. Warm and
> tactile, food-photography macro style, continuous slow pour and settle. No text,
> no logos, no on-screen graphics, no people's faces in focus.

**Loop note:** the settling swirl after the pour finishes is your loop segment — trim
out the initial pour, loop the slow swirl/settle tail.

---

## Section 4 — The Crock

**Placement:** fermentation section — time, patience, transformation.
**Feel:** stillness, quiet activity, the passage of time.

> Static locked-off macro shot of a ceramic fermentation crock in a dim cellar, a
> single warm shaft of light cutting through from above, tiny bubbles occasionally
> rising and breaking the surface of the brine inside a glass weight. Dust motes
> drifting slowly in the light beam. Very quiet, minimal motion, moody warm-amber and
> deep-green color grade, cinematic stillness. No text, no logos, no on-screen
> graphics, no people's faces in focus.

**Loop note:** this is your best natural loop candidate — request "minimal motion,
mostly static" explicitly so the loop point is nearly invisible.

---

## Section 5 — The Jar

**Placement:** bottling/finished-product section — craftsmanship, the payoff.
**Feel:** pride, precision, the product as hero. This is the one clip where the brand
should actually be legible on camera — every other section stays text-free by design,
but this is the product-hero shot, so the label carrying the name is the point.

> Slow orbiting camera move around a finished glass jar of pickles on a rustic wood
> table. A cream-colored paper label is wrapped around the front of the jar, printed
> in bold serif lettering that clearly reads "K-PICKLE" — the "K" in dark charcoal-
> green ink, "-PICKLE" in warm mustard-yellow ink, both in the same bold serif face,
> centered on the label, large enough to read clearly as the camera passes it. Warm
> rim light catching the glass edge, moss-green out-of-focus backdrop. Shallow depth
> of field, polished but tactile food-product cinematography, smooth continuous
> rotation suitable for looping, constant even rotation speed. No other text, no
> additional logos, no people's faces in focus.

**Text-rendering warning:** AI video models are unreliable at rendering legible text
— expect garbled, misspelled, or backwards lettering on a good number of takes. Budget
for more regenerations here than any other section (aim for 6–8+ takes, not 3–4), and
reject anything where "K-PICKLE" doesn't read cleanly and doesn't match the site's
actual charcoal-green / mustard-yellow color split — a jar with the wrong or garbled
brand text is worse than the empty-label fallback below. If it still won't render
legibly after a reasonable number of tries, don't force it: fall back to the original
blurred/no-text version of this prompt (soft mustard-yellow label, out of focus, no
legible text) and let the persistent three.js/CSS "K-Pickle" wordmark on screen carry
the brand instead — the video doesn't have to do that job alone.

**Loop note:** a full 360° orbit *should* loop cleanly if the rotation speed is constant
— explicitly request "constant, even rotation speed" to avoid easing artifacts at the
seam. Verify it rather than assuming it: the delivered take does **not** wrap. Per-frame
luma delta across the 240-frame export averages ~2.4, but the last-to-first wrap is 8.2
and the framing visibly jumps. An early cut spliced the label-legible tail (frames
206–240) onto the label-legible head (frames 2–36) on that assumption, which put a hard
jump cut exactly halfway through the beat's scroll. `media/frames/jar/` is a single
contiguous run instead — source frames 181–240, `-ss 7.5 -frames:v 60` — where the label
rotates into view and ends centered and legible, per-frame delta rising smoothly from
2.0 to 2.9 with no discontinuity. Nothing is lost by giving up the loop: the site scrubs
each sequence once across its beat's scroll and never plays frame 60 into frame 1, so a
clean wrap buys the Jar beat nothing while a legible label at the end of the arc — where
the beat's copy sits — is the whole point of the shot.

---

## Section 6 — Taste / CTA

**Placement:** closing section behind the order call-to-action.
**Feel:** warm, inviting, a final exhale.

> Warm close-up shot of a jar being opened, a small puff of brine mist escaping,
> soft steam catching golden backlight, out-of-focus warm kitchen background. Gentle,
> inviting, cinematic food commercial style, warm amber and moss-green color grade,
> slow motion. No text, no logos, no on-screen graphics, no people's faces in focus.

**Loop note:** this section can tolerate a non-seamless loop (it's the last, shortest
beat) — a slow crossfade loop in CSS/video-loop is fine if the raw clip doesn't tile
perfectly.

---

## After export checklist

- [ ] All 6 clips color-consistent (compare side by side against the Hero anchor frame)
- [ ] No visible show/character references in any take
- [ ] No legible text/logos baked into any clip
- [ ] Each clip trimmed to its best loop segment
- [ ] Compressed to web-ready MP4 (and optionally WebM) — target well under ~5–8MB
      per clip if possible so six background videos don't tank page load
- [ ] Files named `hero.mp4`, `garden.mp4`, `brine.mp4`, `crock.mp4`, `jar.mp4`,
      `taste.mp4` (the code's beat name for Section 6 — not `cta.mp4`) and dropped in
      the `media/` folder
- [ ] Each new filename (without `.mp4`) added to the `"available"` list in
      `media/manifest.json` — a clip in `media/` that isn't listed there is silently
      ignored, by design, to avoid a console error for in-progress drops
