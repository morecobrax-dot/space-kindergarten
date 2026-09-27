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

### Horizons — `assets/horizons/earth.webp`, `moon.webp`, `mercury.webp`, `mars.webp`, `jupiter.webp` · 2400×780 each · transparent sky

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
- **Mars:** a red clay playground: warm coral-rust clay, soft craters with
  rolled rims and deep-red floors, small huddles of round rust stones, and
  an orange sunset glow at its edge. Friendly, never dark or hostile. Its
  relief stays low (a stone at most 0.0038 of the sphere high), because
  taller relief makes the shared soft shadow paint black patches.
- **Jupiter:** a huge, friendly cloud world, never stormy: bands of cream,
  amber and warm orange clay rolled side by side as arcs following the
  curve, like pressed coils of plasticine, with faint cloud wisps along
  them. One big red-orange storm spiral in a cream collar at the lower
  left, and two small swirls. An amber halo. The wide cream band under the
  markers stays plain. Its clay is mixed darker and more saturated than
  the planet's (horizon cream `#CDAE7D` against the planet's `#E6C994`),
  because the horizon's rim light washes warm clay toward white.
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
| Mars: the rocket's landing spot | (76.5%, 45%) |
| Mars: the sound scanner's foot | (37%, 50%) |
| Mars: the word machine's foot | (58%, 55%) |
| The Moon: the writing slate's foot | (26%, 42%) |
| Jupiter: the rocket's landing spot | (76.5%, 45%) |
| Jupiter: the sky sign's foot | (37%, 50%) |
| Jupiter: the orbit ring's foot | (58%, 55%) |

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

### Mars — `assets/planets/mars.webp` and `mars-lit.webp` · 560×560 each · transparent

- Coral clay with a cream polar cap on its face, one big soft crater, a few
  small ones and one deep-red patch: it reads as Mars at 60 px.
- **Restored:** the same model, warm light in its hollows, a warm halo.

### Jupiter — `assets/planets/jupiter.webp` and `jupiter-lit.webp` · 560×560 each · transparent

- Coils of cream, amber and warm orange clay around the ball, one thin
  warm-brown coil near the pole, and one big storm: a round red-orange
  spiral like a cinnamon roll in a cream collar, with two small swirls.
  Smooth and cloudy, never cratered: it reads as Jupiter at 60 px and never
  as Mars. **No ring**, so it is never confused with Saturn.
- **Waiting:** the light a little lower, a soft amber halo.
- **Restored:** the same model, a faint warm glow in the belts and the
  storm, a warm halo.
- Kept offline from when Mars is restored (its route is next), not in the
  first download (see "When a picture is fetched" below).

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

### Sound scanner — `assets/props/scanner.webp` and `scanner-on.webp` · 480×480 each · transparent

- **Anchor:** the **foot at (35.74%, 84.07%)**.
- The Sound Scout marker: a flared cream listening horn with a coral lip on
  a teal base with a coral band, and a small antenna ball.
- **On:** the horn glows warm inside and the ball lights.

### Word machine — `assets/props/workshop.webp` and `workshop-on.webp` · 480×400 each · transparent

- **Anchor:** the **foot at (43.18%, 80.84%)**; it stands 0.42 of the
  horizon's height tall.
- The Word Builder marker: a cream box machine with a coral lid, three
  EMPTY sockets in lavender bezels (never a letter), a crank, a lamp and
  stubby legs. It must not read as a house or a train.
- **On:** the sockets glow amber and the lamp lights.

### Writing slate — `assets/props/slate.webp` and `slate-on.webp` · 400×480 each · transparent

- **Anchor:** the **foot at (45.83%, 84.84%)** (the middle of its three
  feet); it stands 0.45 of the horizon's height tall, at (26%, 42%) on the
  Moon.
- The Moon Writer marker: a dark blue-grey slate board in a chunky, fully
  rounded frame of warm cream clay, a coral chalk tray with one fat stick
  of chalk, on a little coral easel leaning back. Turned a little toward
  the middle of the scene. The slate is **blank**: never a letter, a line
  or a mark. (A white frame and a lamp on top made it read as a television.)
- **On:** the board glows softly warm; still blank.

### Sky sign — `assets/props/skysign.webp` and `skysign-on.webp` · 480×480 each · transparent

- **Anchor:** the **foot at (45.53%, 86.28%)**; it stands 0.5 of the
  horizon's height tall.
- The Star Words marker: a big rounded signboard with a **blank** cream face
  in one fat rolled coil of amber clay, a small pillowy star on top, on a
  short lavender post rising out of a white cloud puff.
- **Off:** the face dim and cool, the star dark. **On:** the face glows
  softly warm (still blank), the star lights yellow.

### Orbit ring — `assets/props/orbit.webp` and `orbit-on.webp` · 480×400 each · transparent

- **Anchor:** the **foot at (46.66%, 84.48%)**; it stands 0.44 of the
  horizon's height tall.
- The Word Orbit marker, like a toy orrery: a lavender clay moon (one
  crater only: two read as a face) on a short neck on a round teal base,
  circled by a slim amber ring tipped up to the right, with two small coral
  satellites riding it, each with a glass lamp.
- **Off:** the ring quiet clay, the lamps dull. **On:** the ring glows
  warm and the lamps light.

### Word satellite — `assets/props/word-satellite.webp` · 512×300 · transparent

- **Anchor:** the **flat face** is a rectangle at left 20.24%, top 37.30%,
  59.52% wide and 42.16% tall. The app lays the word over it in the school
  print, so the face must be flat, plain, light and square to the frame.
- A wide, flat, rounded panel: a clean light cream face in a chunky amber
  frame, a small teal solar-panel wing on a lavender arm at each side, a
  tiny antenna with a coral ball leaning from the top, off centre (a
  centred one made the panel look like a face). No text and no marks.
- Used for every word in Star Words and Word Orbit, floating over Jupiter.

### Rock pedestal — `assets/props/pedestal.webp` · 384×200 · transparent

- **Anchor:** the flat top's **centre at (50%, 29.98%)**: a picture stands
  there in Sound Scout.
- A low rust rock drum with an exactly flat, lighter top, drawn with the
  word pictures' own camera and scale.

### Letter stone — `assets/props/letter-stone.webp` · 400×440 · transparent

- **Anchor:** the **flat front face** is a rounded rectangle at left 13%,
  top 11.6%, 74% wide and 70% tall (corners about 29 px). The app lays a
  clean plate just inside it and draws the letter on the plate, so the face
  must be flat, plain and square to the frame.
- A chunky Moon rock around that smooth face: a lopsided domed top,
  knobbly faceted sides, a broad belly and a few fingertip craters, in
  darker, greyer Moon clay (`#958FAB`) so the pale plate stands out, with
  a soft baked contact shadow. Its ground line sits at about 90% of the
  picture.

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
rounded tips and orange edges, and a faint warm glow. It must read at 18 px,
the size of the space station's price tags. It is also the picture for
"star".

## The space station (the Rocket Dock as a place)

### Outside — `assets/places/station-outside.webp` · 1024×1024 · transparent

- **Anchor:** the **docking bay's centre at (46.68%, 60.01%)**. A flight
  into the station scales the picture around this point, so the camera
  goes in through the door.
- A small, friendly orbital station filling about 80% of the frame: a
  round cream core inside a chunky lavender ring with a row of warm
  lights, two cream modules with teal ends, a short dish, and a big
  round-topped bay door trimmed with rolled coral clay, dark inside with a
  warm glow deep within. Not an eye: the door is an arch, not a ring.

### Inside — `assets/places/station-inside.webp` · 2400×1600 · opaque but for its window

- **Anchors:**
  - the **turntable's top-face centre at (38%, 70.5%)**: the rocket stands
    here
  - the **window's open circle**: centre (23.36%, 33.71%), radius 7.88% of
    the width. Its glass is fully transparent, so the live sky and a
    separate Earth picture show through it
- The garage: cream walls with a lavender band, a softly curved floor, a
  ceiling cove of warm lamps, a porthole with a thick cream rim, a chunky
  teal turntable ringed with warm lights under a cream lid, three paint
  pots, and a soft coral hose.
- **Crop safety:** the app covers screens from 4:3 to about 2.2:1, so
  everything important stays within x 8–92%, y 16–84%, and the right third
  stays a quiet wall for the panel.

## What a flight passes

### Clouds — `assets/props/cloud-a.webp`, `cloud-b.webp`, `cloud-c.webp` · 640×400 each · transparent

Puffy cream-white clay clouds with softly flattened bottoms, each a
different lumpy outline. They are drawn large and pass the camera quickly,
so they stay soft and simple.

### Asteroids — `assets/props/asteroid-a.webp`, `asteroid-b.webp`, `asteroid-c.webp` · 384×384 each · transparent

Friendly round clay rocks: (a) lavender-grey with two soft dimples, (b)
lumpy warm grey-brown, (c) a small pair stuck together. No faces. They
drift past as scenery, never toward the rocket.

## Pictures for words — `assets/pictures/<word>.webp` · 384×384 each · transparent

`apple`, `banana`, `bee`, `cake`, `car`, `rock`, `snake`, `sock`, `spoon`,
`tomato`, `tree`; and from Phase 3 (`tools/art/scenes/picture-p3.js`, the same
camera) `map`, `sun`, `fish`, `fan`, `net`, `rug`, `hat`, `cat`, `cap`, `pan`,
`cup`, `bus`, `bug` (a ladybug), `nut` (an acorn-like nut), `pumpkin`,
`umbrella`, `cupcake`.

- **One set:** the same camera for every picture, a gentle three-quarter
  view from slightly above; each object centred and filling about 80% of the
  frame's larger dimension.
- **Instantly recognisable at 120 px** by a five-year-old: exaggerate the
  defining feature (a banana's curve, a car's wheels, a bee's stripes).
- Only the snake, the bee, the fish, the cat and the bug have faces: two
  bead eyes each (the ladybug's are white with dark pupils, because dark
  beads disappear on its dark head). Nothing else has a face.
- Pairs a child could mix up must differ at a glance: the sun hat and the
  baseball cap, the cupcake and the cake, the fan and a flower.
- Friendly, saturated colours, never neon. No text.

## The rocket and the guide

### Rocket — `assets/rocket/rocket.webp` + `rocket-paint.webp` · 640×800 each · transparent

- **Anchors** (tools/art `rocket.js` exports them):
  - the **nozzle's bottom centre at (50%, 81.8%)**: the rocket stands on
    this point
  - the nozzle's lip spans 35.0%–64.8% of the width
  - the window's centre at (50%, 56.1%), its rim 13.9% of the width in
    radius
  - the nose tip about 8.5% from the top
- **Design** (Phase 2.2, chosen from five silhouettes after the real-iPad
  QA scored the first rocket 4 of 10): a friendly clay toy.
  - a tall cone cap about as tall as the body, its tip softly rounded
  - a straight cream body with a big round window: a cream rim, deep blue
    glass and a catch-light
  - three big swept fins standing level with a flared lavender-grey
    engine bell
  - no band, no seams to read, no realistic detail
  - it must read as a rocket at 60 px
- **Paint rule:**
  - In `rocket.webp`, the **painted parts (the cap and the fins) are white
    clay**, fully shaded: about 63% of the rocket.
  - `rocket-paint.webp` is the **mask**: white, its alpha set to exactly
    those painted parts, aligned pixel for pixel with `rocket.webp`.
  - The app multiplies each paint colour, and each theme's pattern, through
    the mask. Never deliver one rocket per colour or per look.

### Gear — `assets/rocket/gear-*.webp` · 640×800 each · transparent

`star`, `moon`, `antenna`, `lights`, `booster`, and `wings` (the
Bumblebee theme's).

- **Framing:** the **rocket's own frame and camera**. Each picture holds
  only the piece, exactly where it sits on the rocket, with the shadow it
  casts on the rocket, so the app lays it over the rocket without placing
  it. The rocket itself is not in the picture.
- **Fixed colours**, never painted: a warm yellow star, a lavender moon, a
  lavender-grey antenna with a coral ball, warm lamps in lavender-grey
  bezels, pale cream-white wings, cream boosters with a coral band. Each
  must read on a red, blue, yellow or purple rocket.

### Flame — `assets/rocket/flame.webp` · 256×384 · transparent

- **Framing:** the flame's root runs along the **top edge**, centred, about
  90% of the width. The app hangs it from the nozzle: its top edge at 80.5%
  of the rocket's height, left 33.6% and 32.8% wide (1.1× the nozzle).
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

## When a picture is fetched

Every picture's registry entry says when it is fetched (`load`). The
service worker precaches only the **core** pictures, so the first download
stays small; the **icons** are fetched by the device when the app is added
to the Home Screen; a **world's** pictures (Jupiter's horizon, planet,
markers and word satellite) are fetched once its route is open or next to
open, and then kept offline. [ASSET-MANIFEST.md](ASSET-MANIFEST.md) lists
each picture's tier. A final picture keeps its tier and stays within its
budget: core under 1.2 MB, each world under 300 KB.

## Home Screen icons — `icon-512.png` and `icon-192.png` · opaque PNG

Pip, centred, over deep navy, brighter behind Pip. Keep Pip inside the
middle 80%, because iOS rounds the corners.
