# Art direction

## The target

Space Kindergarten should look like **a premium stop-motion children's space
film that the child can interact with**. Picture clay models that were
sculpted, placed into miniature space sets, lit by a professional, and
photographed. Space is shown the way a child imagines it, made with real
craft.

These are the things it is *not*:

- flat SVG illustration
- generic glossy 3D plastic
- mobile-game gloss
- AI clipart
- CSS gradients pretending to be clay

**The rule above all others:** art should make the learning world magical,
but it must never make the learning harder to understand.

## What we took from the references, in words

References are direction only. None is copied, traced, recoloured, shipped
or committed; see [../references/README.md](../references/README.md).

| Reference | What we took | What we did *not* take |
|---|---|---|
| Phase 1.2 reference: a clay-textured Earth over a moon horizon | **Material**: a velvety, finely brushed clay surface. **Light**: deep blue ambient, a strong cyan rim from behind, and soft bloom. **Space**: near-black navy with restrained stars. **Depth**: a planet out of focus in the distance. | Its faced Earth with arms, its characters and their silhouettes, its ringed planet with a face, its flag, its rocket rider, and its composition. Our Earth and Moon have **no faces**, and Pip is the only character. |
| Clay Earth, clay planet grid, ringed clay planet | Matte sculpted spheres, and puffy cream clouds breaking the planet's edge | Any specific planet design. The ringed planet is glossier than we want. |
| Earth limb over a violet starfield | A huge planet at the edge of frame, and sparse stars | |
| Lavender cratered moon | The Moon's identity: lavender clay with raised, rimmed craters | |
| Three-ramp palette card | Palette relationships | |
| Cartoon rocket (Adobe Stock) | Only the generic idea of a friendly bullet rocket with a porthole and fins | Its face, colours or drawing |
| Glowing star with eyes | Nothing. It resembles Nintendo's Power Star, which is why the guide is not a star | |

## One world, one light

Every picture is lit by **one rig**, declared once in `tools/art/clay.js`
(`RIG`). No scene declares its own light, and a contract fails if one tries.
Objects in the same scene must look lit by the same world: an Earth lit from
the left beside a Pip lit from the right would break the miniature-film
illusion.

| Light | Direction | Colour | Job |
|---|---|---|---|
| **Key** | upper left and slightly in front | warm white | form, soft shadows, a warm edge highlight |
| **Ambient** | the whole sky | cool space blue above, near-black below | fills shadows without flattening them |
| **Rim** | behind, to the right | cyan | separates every silhouette from space |
| **Bounce** | below | faint lavender | lifts the undersides, as if light came off a surface |
| **Warm accents** | from things that glow | yellow and orange | the beacon, the reward stars and the rocket flame, and nothing else |

Shadows follow the key light. They fall down and to the right, in the renders
and in CSS alike (`--contact-shadow`, and the tile and button shadow tokens).
Different surfaces get different shadows:

- An object that stands on the ground gets a tight contact shadow.
- A floating cloud casts a soft, offset shadow.
- Creases get ambient occlusion.

A single identical drop shadow on everything is never used.

## Material: the house clay

Every clay surface shares one material (`clay()` in `clay.js`):

- **Matte, velvety response**
  - Light wraps a little past the terminator, the line between the lit and
    unlit sides.
  - A saturated band sits at the terminator, which is what makes clay read
    as clay rather than plastic.
  - Grazing angles get a faint velvet sheen.
- **Handmade surface**
  - fine grain
  - smoothing strokes in patches
  - very faint ridge patches where a thumb pressed
  - soft lumpiness in the forms

  All of it is subtle: the result must look professionally made, not
  smeared.
- **No gloss**, except where the real thing would shine: glass (the porthole,
  the beacon lamp, Pip's antenna ball) and Pip's bead eyes.
- **Warm colours take less of the cyan rim.** Cyan light on yellow clay reads
  olive, so warm clay's rim is reduced (the `rim` setting).

## Shape language

- rounded geometry
- big readable silhouettes
- soft corners
- slightly chunky proportions
- gentle asymmetry: Pip's antenna leans, and one wing tilts more than the
  other

Nothing is sharp, mechanical or NASA-realistic.

## Depth: four layers

| Layer | What sits there | How it reads as far or near |
|---|---|---|
| **Background** | `bg.space`: navy deepening to blue, sparse stars, one small out-of-focus planet | Low contrast and soft focus. Negative space is deliberate. |
| **Midground** | the destination (Earth or the Moon), Pip, the rocket | Full clay detail and the full light rig |
| **Foreground** | the Moon ground set, the launch pad, and the beacon's base | Distance haze melts the far ground into space. The horizon catches the rim light. |
| **UI plane** | bubbles, buttons, tiles, progress, stars | Clean surfaces with depth that follows the key light (see UI) |

The Earth seen from the Moon is small and slightly soft, as a lens would see
it. There is no WebGL and no parallax engine: depth comes from the pictures
and their layering.

## The destination system (for planets to come)

Every destination follows one template, so a planet added later belongs to
the same universe.

**What every destination shares:**

- **Material:** the house clay.
- **Light:** the rig.
- **Framing:** the sphere centred, filling 84% of a square canvas, rendered
  at 800 px or more.
- **Detail:** one signature surface feature, pressed or raised, and never
  more than a child can read at a glance. The Moon has craters; Earth has
  land slabs and clouds.
- **No faces on planets.** The guide is the only character.

**Two states for every destination:**

- **Waiting** (`asset`): cooler and quieter, its beacon or landmark unlit.
- **Restored** (`restoredAsset`): the same model, with a warm accent light at
  its landmark, a faint warmth in its hollows and a warm halo. The app
  crossfades from one to the other, so a child sees the change happen.

The palette gives each world its identity:

| World | Clay colours | Signature feature (proposed) |
|---|---|---|
| Earth | ocean blue, lime-green land, cream clouds | raised land slabs, floating cloud puffs |
| Moon | lavender-grey, violet shadows, warm beacon light | fingertip craters with raised lips |
| Mercury | warm stone, amber | overlapping shallow dimples |
| Venus | peach, coral, warm yellow | soft swirled cloud bands, sculpted in relief |
| Mars | rust, orange, red | pinched ridges and one big volcano mound |
| Jupiter | cream, orange, warm brown | rolled clay bands and one thumbprint storm |
| Saturn | gold, peach, lavender | a thick clay ring, matte, with pressed grooves |
| Uranus | aqua, cyan | smooth, softly banded, a gentle tilt |
| Neptune | deep blue, violet | wind streaks drawn in the clay |

None of these planets exist in code yet. A destination gets a render job, a
registry entry and a pair of states only when it is built.

## Pip, the guide

An **original satellite buddy**, now sculpted in clay:

- **Body:** a warm-yellow capsule with an orange band.
- **Wings:** two chunky teal solar-panel wings, with pressed grooves, on short
  lavender arms.
- **Antenna:** a glassy antenna ball, which **glows while Pip is speaking**.
  The app lights it: `.pip-light` sits exactly on the ball.
- **Face:** dark bead eyes, each with a tiny catch-light, a pressed-on smile,
  and soft pink cheeks.
- **Feet:** two little orange feet.

The face must read from across an iPad, so there are big eyes, few features
and high contrast.

**Silhouette rule:** a body, two panel wings and an antenna. Pip must never
drift toward any of these:

- a five-point star with a face (Nintendo's Power Star)
- a pink ball (Kirby)
- a white egg with a black visor (EVE)
- a green owl (Duo)
- any existing educational mascot

**Personality:** warm, curious and encouraging. Never sarcastic, and never
disappointed.

## Rocket and paints

The rocket is small, friendly and chunky: a cream clay bullet with a
porthole, three thick fins, a nozzle and pressed seams where the painted
pieces meet the hull. The flame is a separate sculpted layer, shown only in
flight.

**A paint is a colour, not a picture.** The rocket is rendered once, with its
painted parts (nose, band, fins) in white clay. Those parts are also exported
as a mask (`rocket.paintMask`). In the app, the paint colour (a `--paint-*`
token) is cut to the mask and multiplied over the render. Multiplying is how
a matte surface takes a colour, so the render's shading, seams and shadows
all survive every paint.

To add a paint, add a token and a line in `COSMETICS`. No new artwork is
needed, and a contract proves a made-up paint still draws a rocket.

## UI: a hybrid, on purpose

The world, the characters, the planets and the rocket are **clay miniature
art**. The controls are **clean, premium children's UI**. They are not made
of clay, because a screen full of textured buttons is noise.

- **Depth follows the world's light.** Buttons, tiles and panels get the same
  treatment (the `--shadow-*` tokens):
  - a highlight at the top left
  - a darker lip at the bottom right
  - a shadow falling down and to the right
  - on dark controls, a thread of cyan rim light on the right edge
- **Letter tiles stay the clearest thing on screen:**
  - cream-lavender, with dark ink letters and no texture or picture behind
    them
  - a contrast ratio far above what reading needs, and a contract holds it
    there
  - they stand on the Moon's surface, with contact shadows
- **One primary action per screen** keeps the warm yellow.

## Motion

- **Navigation stays smooth and fast.** Nothing a child waits for imitates
  stop-motion.
- **Characters move like stop-motion.** Pip's idle bob and tilt, and the
  rocket's idle sway on Earth, step at about ten frames a second (CSS
  `steps()`), holding each pose as a hand-posed model would.
- **Light moves smoothly:** the Moon's beacon breathing and the flame
  flicker.
- **Reduce Motion** turns all of it off. It is honoured from both the device
  and the grown-ups setting, and a contract checks it.

## The asset pipeline

1. **Render.** Each picture is a scene file in `tools/art/scenes/`, sculpted
   as signed-distance shapes and shaded by the house clay under the rig.
   Running `npm run art:render` writes lossless masters to `tools/art/out/`,
   which is git-ignored.
2. **Check edges.** The renderer warns if a sprite reaches its frame edge,
   which would show as a cut line in the app.
3. **Encode.** Running `npm run art:encode` and opening the page it prints in
   Chrome or Edge turns the masters into WebP files in `assets/`. The Home
   Screen icons stay PNG.
4. **Register.** Every file has an `ASSET_REGISTRY` entry giving its id,
   path, purpose, source, licence, real size and state. Scenes ask for an
   id, never a path.
5. **Sync.** `npm run config:sync` regenerates the offline precache list and
   [ASSET-MANIFEST.md](ASSET-MANIFEST.md).
6. **States.** The states are `PLACEHOLDER`, then `DRAFT`, then `FINAL`.
   **Only a person promotes art to `FINAL`.** A contract fails if anything
   claims it.

**Budgets, enforced by a contract:**

- 260 KB for any single picture
- 1.2 MB for the whole set
- 700 KB for the first Earth screen

The current set is about 850 KB, and the first Earth screen about 400 KB.

## What the current renders are, honestly

They are **computer-rendered clay**, made by a procedural renderer written
for this project. They are not a sculpture photographed on a set. Because
the renderer is shared, they share one light, one material, one camera and
one level of detail. They are original, and they can be re-rendered at any
time.

**Where a sculptor or a 3D artist would still do better:**

- richer surface detail
- true subsurface scattering
- hand-placed imperfections
- more expressive character poses

[ASSET-BRIEFS.md](ASSET-BRIEFS.md) specifies each picture precisely, so
final art can replace the drafts one file at a time, with no change to the
app.
