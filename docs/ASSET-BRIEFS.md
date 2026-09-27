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
  - key light from the upper left and slightly in front, warm white
  - cool blue ambient
  - a cyan rim from behind, to the right
  - warm light only from things that glow
- **Same material:** matte, velvety clay with subtle tool marks and soft
  imperfections. Gloss only on glass and on Pip's eyes.
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
corner.

## Earth — `assets/planets/earth.webp` · 1400×1400 · transparent

- **Framing:**
  - The sphere is centred, its radius **42%** of the frame (84% across).
  - Clouds may break the silhouette, but must stay inside the frame.
  - Keep a soft cyan atmosphere just outside the disc, stronger on the right.
- **Anchor:** the rocket stands at **(67%, 32%)**. That spot must be solid
  green land, on the face of the sphere.
- **Content:**
  - a blue clay ocean
  - raised green land slabs with rounded, thumb-pressed edges
  - cream cloud puffs floating just above the surface, casting soft shadows
    down and to the right
  - friendly invented continents, not real coastlines
  - **no face**
- **Prompt, if an image generator is used:**
  > A hand-sculpted modelling-clay Earth, a single matte clay sphere with
  > raised lime-green land slabs and a blue clay ocean, soft cream clay
  > cloud puffs floating just above the surface casting soft shadows,
  > subtle fingerprints and tool marks, lit by a soft warm key light from
  > the upper left, cool blue ambient, a cyan rim light from behind right,
  > stop-motion miniature, centred, transparent background, no face, no
  > text.

## Moon — `assets/planets/moon.webp` and `moon-lit.webp` · 800×800 each · transparent

- **Framing:** the sphere is centred, its radius **42%** of the frame.
- **Anchor:** a tiny beacon on the surface, its lamp at **(63%, 30%)**.
- **Content:**
  - soft lavender-grey clay, with craters pressed in by a fingertip, each
    with a raised lip
  - **no face**
- **Waiting** (`moon.webp`): cool and quiet. The beacon lamp is dark, and
  the halo is a cool lavender.
- **Restored** (`moon-lit.webp`): the **same model and pose**, so the two
  crossfade cleanly.
  - The lamp glows warm.
  - Warm light spills over the nearby craters, and there is a faint warmth
    in the crater floors.
  - The halo is warm.
  - Keep it subtle: no neon.

## Rocket — `assets/rocket/rocket.webp` + `rocket-paint.webp` · 640×1088 each · transparent

- **Framing:** upright, centred.
  - The nose tip is at **12%** from the top.
  - The **nozzle's bottom centre is at (50%, 88%)**, and the nozzle spans
    about 36%–64% of the width.
- **Content:**
  - a cream clay bullet hull with a porthole (a cream rim, and dark blue
    glass with a catch-light)
  - three thick rounded fins: two angled toward the viewer, one behind
  - a nose cone and a band
  - a small dark nozzle
  - pressed seams where the painted pieces meet the hull
- **Paint rule:**
  - In `rocket.webp`, the **painted parts (nose cone, band, fins) are white
    clay**, fully shaded.
  - `rocket-paint.webp` is the **mask**: white, with its alpha set to exactly
    those painted parts, aligned pixel for pixel with `rocket.webp`.
  - The app multiplies each paint colour through the mask. Never deliver one
    rocket per colour.

## Flame — `assets/rocket/flame.webp` · 256×384 · transparent

- **Framing:** the flame's root runs along the **top edge**, centred, about
  90% of the width. The tip points down, at about 87% of the height.
- **Content:** sculpted clay tongues of flame (orange outside, yellow core)
  that glow, with a soft bloom. Only the top edge may touch the frame.

## Pip — `assets/characters/pip.webp` · 720×660 · transparent

- **Anchors:**
  - The **antenna ball's centre is at (51.9%, 18.1%)**, with a diameter of
    about 6% of the width. The app lights exactly that spot while Pip
    speaks.
  - The body is centred at (50%, 56%), and the feet are at about 85%.
- **Design:**
  - a warm-yellow capsule body with an orange band
  - two teal solar-panel wings with pressed grooves, on short lavender arms
  - dark bead eyes with tiny catch-lights, a pressed smile and pink cheeks
  - two small orange feet
  - slight hand-made asymmetry
- **Silhouette rule:** a body, two wings and an antenna. Never a star with a
  face, a pink ball, a white egg with a visor, or an owl. The face must read
  from across an iPad.

## Star — `assets/props/star.webp` · 256×256 · transparent

- **Framing:** centred, filling about 84%.
- **Content:** a puffy five-point star of warm yellow clay, thicker in the
  middle, with rounded tips and orange edges, and a faint warm glow. It
  must read at 26 px, the size of the Dock's price tags.

## Beacon — `assets/props/beacon.webp` and `beacon-lit.webp` · 512×896 each · transparent

- **Anchors:**
  - The **lamp's centre is at (50%, 24%)**.
  - The base mound's bottom is at about 94%.
  - Its contact shadow must fade out inside the frame.
- **Content:**
  - a cream clay lighthouse with two coral stripes and an arched door
  - a railing ring, a glass lamp and a coral dome
  - a mound of Moon clay at its base
- **The lit version** is the same model and pose, with a warm glowing lamp
  that lights the railing and the dome.

## Launch pad — `assets/props/pad.webp` · 1200×480 · transparent

- **Anchor:** the top face's centre, where the rocket stands, is at
  **(50%, 46%)**.
- **Content:** a thick round slab of Moon clay, seen from a little above,
  with a pressed ring and six small warm lamps around the rim.

## Moon ground — `assets/backgrounds/moon-ground.webp` · 2400×800 · transparent sky

- **Framing:**
  - The horizon is a gentle curve in the **top 15%**.
  - The layout crops from the top, so the upper three quarters must hold
    the composition.
  - The ground fills the frame to the bottom and sides.
- **Content:**
  - the curved top of a big lavender clay moon, seen from just above it
  - fingertip craters, with bigger ones nearer the viewer
  - soft lumps
  - distance haze that melts the far ground into blue
  - the horizon catching the cyan rim light
  - mid-dark values, so the pale letter tiles stand out against it

## Space — `assets/backgrounds/space.webp` · 2400×1600 · opaque

- **Content:**
  - near-black navy at the top, deepening to blue low down
  - a faint cool haze
  - sparse, small stars (only a few with a soft sparkle)
  - one small, out-of-focus distant planet at the upper left
  - mostly empty: negative space is deliberate
- **Keep clear:** nothing important in the corners, because it is cropped
  to fit every iPad shape.

## Home Screen icons — `icon-512.png` and `icon-192.png` · opaque PNG

- **Content:** Pip, centred, over deep navy, brighter behind Pip. Keep Pip
  inside the middle 80%, because iOS rounds the corners.
