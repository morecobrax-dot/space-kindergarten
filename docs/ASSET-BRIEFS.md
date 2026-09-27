# Asset briefs

What a **final** version of each picture must match, so that final art can
replace a draft render **one file at a time**, with no change to the app's
code or layout. The current drafts are rendered by `tools/art` (see
[ART-DIRECTION.md](ART-DIRECTION.md)). They are the reference for framing
and anchors.

## Rules for every final picture

- **Original work only.** Nothing traced, sampled or derived from
  `references/` or any other artwork. Record its source and licence in
  `ASSET_REGISTRY`.
- **Same world.** Use the same light as every other picture:
  - a large, soft key light from the upper left and in front, warm white
  - a cool, gentle front fill, so faces stay bright
  - cool blue ambient
  - a thin cyan rim from behind, to the right
  - warm light only from things that glow
- **Same material:** smooth, matte, velvety plasticine with only a whisper of
  hand-made texture. Gloss only on glass and on Pip's eyes.
- **Same camera:** a long lens, with very little perspective distortion.
- **Same file:** the same path, pixel size, transparency and anchors as the
  draft below. Then run `npm run config:sync`. Promote the registry entry to
  `FINAL` only when a person has signed it off.
- **No text, labels or UI baked into any picture.**
- Transparent pictures must **fade to fully transparent before the frame
  edge**. A shadow or glow cut off by the frame shows as a hard line in the
  app.
- **Format:** WebP with transparency, except the Home Screen icons, which
  are opaque PNG. Stay inside the budgets in
  [ART-DIRECTION.md](ART-DIRECTION.md#the-asset-pipeline).

Positions below are percentages of the frame, measured from the top-left
corner. **An anchor is a promise:** the app places something there (a
light, the rocket, a letter plate), and a contract checks the CSS against
the render.

## The sky

### Space — `assets/backgrounds/space.webp` · 1600×1100 · opaque

- Near-black navy at the top, deepening to blue low down; a faint cool haze
  upper right. **No stars**: they are their own layers.
- It is cropped to fit every iPad shape: nothing important in the corners.

### Star layers — `assets/backgrounds/stars-far.webp`, `stars-near.webp` · 2400×2200 each · transparent

- **Far:** about 120 tiny, dim stars, a few warm or cool, spread thinly.
- **Near:** about 16 brighter stars, a few with a soft four-point sparkle.
- Mostly empty: negative space is deliberate. They are taller than the
  screen because a flight slides them.

## The worlds you stand on

### Horizons — `assets/horizons/earth.webp`, `moon.webp`, `mercury.webp` · 2400×780 each · transparent sky

Every world is the top of **the same clay sphere seen by the same camera**
(`tools/art/scenes/horizon.js`): a long lens, the crest of the curve **18%**
down the frame, the edges dropping to about half the frame height. A final
version must keep that exact curve, because the app stands things on it.

- **Glow:** a soft halo along the edge in the world's colour (Earth cyan,
  the Moon lavender-blue, Mercury amber), fading out inside the frame.
- **Earth:** a blue ocean, low rounded green continents (soft bevels, no
  tall slab walls), a few cream cloud puffs floating just above the surface
  with soft shadows. **The launch pad** is baked in: a round lavender clay
  platform with six small warm lamps, its top face centred at
  **(29.81%, 52.43%)**, about 14% of the width across. The rocket stands
  exactly there.
- **The Moon:** lavender-grey clay with fingertip craters, bigger nearer the
  viewer. Nothing standing on it: the beacon is its own picture.
- **Mercury:** warm stone with soft overlapping dimples.
- **Keep clear:** the landing spots and marker feet listed below must be on
  plain ground, not in a crater's wall or under a cloud.

| Anchor | Where (fraction of the horizon picture) |
|---|---|
| Earth: the rocket stands on the pad | (29.81%, 52.43%) |
| The Moon: the rocket's landing spot | (74.5%, 44%) |
| The Moon: the beacon's foot | (44%, 47%) |
| Mercury: the rocket's landing spot | (76.5%, 45%) |
| Mercury: the radar dish's foot | (37%, 50%) |
| Mercury: the meteor rocks' centre | (58%, 55%) |

## The worlds seen from afar

Every planet is centred and fills **84%** of a square frame, with a soft
halo just outside the disc. **No faces.**

### Earth — `assets/planets/earth.webp` · 600×600 · transparent

Home, far away in every destination's sky, drawn at about 11% of the screen
height: a blue ocean, green land, cream clouds. It must read at 80 px.

### Moon — `assets/planets/moon.webp` and `moon-lit.webp` · 640×640 each · transparent

- **Anchor:** a tiny beacon on the surface, its lamp at **(63.3%, 29.5%)**.
  The app breathes a warm glow there once the Moon is restored.
- **Waiting:** cool and quiet, the beacon dark, the halo cool lavender.
- **Restored:** the **same model and pose**, so the two crossfade cleanly:
  the lamp glows warm, warm light spills over the nearby craters, a faint
  warmth in the crater floors, a warm halo. Subtle: no neon.
- It is also the picture for the word "moon" in Rhyme Radar.

### Mercury — `assets/planets/mercury.webp` and `mercury-lit.webp` · 560×560 each · transparent

- Warm stone covered in soft dimples. Its sunward side glows a little warm.
- **Restored:** the same model, warm light in the dimples, a warm halo.

## What stands on the worlds

### Beacon — `assets/props/beacon.webp` and `beacon-lit.webp` · 512×896 each · transparent

- **Anchors:** the **lamp's centre at (50%, 23.9%)**; the **foot, where it
  meets the ground, at (50%, 88.5%)**. Its contact shadow fades out inside
  the frame.
- A cream clay lighthouse with two coral stripes and an arched door, a
  railing ring, a glass lamp and a coral dome, on a mound of Moon clay.
- **Lit:** the same model and pose, with a warm glowing lamp that lights the
  railing and the dome.

### Radar dish — `assets/props/radar.webp` and `radar-on.webp` · 480×480 each · transparent

- **Anchors:** the **foot at (45.28%, 83.82%)**; the antenna tip at
  (61.54%, 37.05%).
- A friendly cream clay dish on a stubby teal base, facing up and to the
  right, a small antenna in its centre, and a baked contact shadow.
- **On:** the tip glows warm, with a gentle bloom.

### Meteor rocks — `assets/props/meteor-field.webp` and `meteor-field-on.webp` · 480×360 each · transparent

- **Anchor:** the cluster's **ground centre at (52.31%, 53.63%)**.
- Three round clay rocks of different sizes in a shallow pressed crater of
  warm stone, with a baked contact shadow.
- **On:** the rocks glow warm orange from within, with a gentle bloom.

### Letter stone — `assets/props/letter-stone.webp` · 400×440 · transparent

- **Anchor:** the **flat front face** is a rounded rectangle at left 13%,
  top 11.6%, 74% wide and 70% tall (corners about 29 px). The app lays a
  clean plate just inside it and draws the letter on the plate, so the face
  must be flat, plain and square to the frame.
- A chunky rounded stone of lavender-grey Moon clay, its top showing a
  little, with a soft baked contact shadow.

### Meteor stone — `assets/props/beat-stone.webp` · 512×400 · transparent

- **Anchor:** the **top face's centre at (51.18%, 32.89%)**; the app draws
  its "tap here" ring there.
- A big, round, drum-like clay rock in warm grey-amber stone, a wide smooth
  top seen from above, a few soft dimples around its side (none on top), and
  a baked contact shadow.

### Meteors — `assets/props/meteor.webp` and `meteor-lit.webp` · 192×192 each · transparent

- A small round clay meteor rock, centred.
- **Dim:** cool grey-lavender: a beat still to tap.
- **Lit:** the same rock in warm orange-yellow clay with a softly glowing
  core and a small, controlled bloom: a beat tapped.

### Star — `assets/props/star.webp` · 256×256 · transparent

A puffy five-point star of warm yellow clay, thicker in the middle, with
rounded tips and orange edges, and a faint warm glow. It must read at 26 px,
the size of the Dock's price tags. It is also the picture for "star".

## Pictures for words — `assets/pictures/<word>.webp` · 384×384 each · transparent

`apple`, `banana`, `bee`, `cake`, `car`, `rock`, `snake`, `sock`, `spoon`,
`tomato`, `tree`.

- **One set:** the same camera for every picture, a gentle three-quarter
  view from slightly above; each object centred and filling about 80% of the
  frame's larger dimension.
- **Instantly recognisable at 120 px** by a five-year-old: exaggerate the
  defining feature (a banana's curve, a car's wheels, a bee's stripes).
- Only the snake and the bee have faces: two dark bead eyes each.
- Friendly, saturated colours, never neon. No text.

## The rocket and the guide

### Rocket — `assets/rocket/rocket.webp` + `rocket-paint.webp` · 640×800 each · transparent

- **Anchors:** the **nozzle's bottom centre at (50%, 81.8%)**: the rocket
  stands on this point. The nozzle spans about 34%–66% of the width; the
  nose tip is at about 11% from the top.
- **Content:** a short cream clay body with a rounded cone nose, a big
  porthole (a cream rim, dark blue glass with a catch-light), one band,
  three thick rounded fins (two angled toward the viewer, one behind) and a
  little dark nozzle, with pressed seams where the painted pieces meet the
  hull.
- **Paint rule:**
  - In `rocket.webp`, the **painted parts (nose, band, fins) are white
    clay**, fully shaded.
  - `rocket-paint.webp` is the **mask**: white, its alpha set to exactly
    those painted parts, aligned pixel for pixel with `rocket.webp`.
  - The app multiplies each paint colour through the mask. Never deliver one
    rocket per colour.

### Flame — `assets/rocket/flame.webp` · 256×384 · transparent

- **Framing:** the flame's root runs along the **top edge**, centred, about
  90% of the width. The app hangs it from the nozzle: its top edge at 80.5%
  of the rocket's height, 35% of the rocket's width across.
- Sculpted clay tongues of flame (orange outside, yellow core) that glow,
  with a soft bloom. Only the top edge may touch the frame.

### Pip — `assets/characters/pip.webp` · 720×660 · transparent

- **Anchor:** the **antenna ball's centre at (51.5%, 18.7%)**, its diameter
  about 7.8% of the width. The app lights exactly that spot while Pip speaks.
- **Design:** a chubby warm-yellow capsule with an orange band; two chunky
  teal solar-panel wings, each with one pressed groove, on short lavender
  arms; a short leaning antenna with a big glassy ball; big dark bead eyes
  with catch-lights, a small pressed smile and pink cheeks; two small orange
  feet; slight hand-made asymmetry.
- **Silhouette rule:** a body, two wings and an antenna. Never a star with a
  face, a pink ball, a white egg with a visor, or an owl. The face must read
  from across an iPad.

## Home Screen icons — `icon-512.png` and `icon-192.png` · opaque PNG

Pip, centred, over deep navy, brighter behind Pip. Keep Pip inside the
middle 80%, because iOS rounds the corners.
