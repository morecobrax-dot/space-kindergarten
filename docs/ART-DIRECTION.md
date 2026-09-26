# Art direction

## The target

A cohesive **clay / sculpted 3D** illustration language:

- smooth, rounded forms
- a subtly handmade feel
- soft matte surfaces with controlled highlights
- gentle ambient occlusion and soft shadows
- rim light where it helps a silhouette read against space

Shapes are large and simple, with friendly proportions and strong silhouettes.
It should look premium and playful without being babyish, and stay readable at
arm's length on an iPad.

**Avoid:**

- cheap gradients or generic clipart
- flat worksheet graphics
- excessive gloss or a plastic-toy look
- hyper-realism or busy space scenes
- the inconsistency of mixed AI imagery

## What we took from the moodboard, in words only

The images in `references/visual/` are stock, commercial and third-party work
we do not own, so none of it is used. See [../references/README.md](../references/README.md).

| Reference | Direction taken |
|---|---|
| Clay Earth, clay planet grid, ringed clay planet | The **target material**: matte sculpted spheres, puffy cream clouds breaking the planet's edge, low surface detail. The ringed planet is glossier than we want. |
| Earth limb over a violet starfield | **Composition**: a huge planet at the edge of frame, deep navy to violet space, sparse stars |
| Lavender cratered moon | The **Moon's identity**: lavender with raised, rimmed craters and a violet glow |
| Three-ramp palette card | **Palette relationships**: violet to lavender, deep indigo with orange and yellow accents, blue to cyan to mint |
| Cartoon rocket (Adobe Stock) | A generic idea only: a friendly bullet rocket with a porthole, fins and a flame. **Not** its face, colours or drawing |
| Glowing star with eyes | Nothing. It resembles Nintendo's Power Star, which is exactly why the guide is not a star |

The references mix flat vector and 3D clay. The target is clay, and the flat
vector ones informed palette and composition only.

## Palette

The tokens live in `index.html` (layers 1, 2 and 4).

- **Space:** deep navy `#0B1030`, midnight surfaces, violet glows
- **Primary child action:** warm yellow into orange, used on exactly one thing
  per screen
- **Touchable surfaces:** lavender and cream, with ink `#11163F` for letters
  on them
- **Accents:** cyan (repeat and guidance), lime (success), coral (a small
  warm accent)

### Planet identities

Only Earth and the Moon are tokenised, because only they exist.

| World | Direction |
|---|---|
| Earth | blue, cyan, lime-green land, cream clouds |
| Moon | lavender with violet shadows; beacon light is a warm cream |
| Mercury | warm stone, amber |
| Venus | peach, coral, warm yellow |
| Mars | rust, orange, red |
| Jupiter | cream, orange, warm brown |
| Saturn | gold, peach, lavender |
| Uranus | aqua, cyan |
| Neptune | deep blue, violet |

## Pip, the guide

An **original satellite buddy**:

- **Body:** a warm-yellow rounded body with an orange band.
- **Solar-panel "wings":** two teal panels.
- **Antenna:** a glass antenna ball that **glows while Pip is speaking**. It
  is the visual half of every spoken line.
- **Face:** simple dot eyes, a small smile and soft cheeks, drawn directly on
  the body. There is no visor.

**Silhouette rule:** a body plus two panel wings plus an antenna. Pip must
never drift toward:

- a five-point star with a face (Nintendo's Power Star)
- a pink ball (Kirby)
- a white egg with a black visor (EVE)
- a green owl (Duo)
- any existing educational mascot

**Animation language:**

- a gentle idle bob
- the antenna glowing while speaking
- small tilts and bounces for cheering and pointing, to come

**Personality:** warm, curious and encouraging, never sarcastic, and never
disappointed.

## Rocket

A friendly bullet rocket: a cream hull, a painted nose, fins and bands, a
porthole with a cyan glass highlight, and a nozzle. The flame is a separate
layer shown only in flight.

**Paints are cosmetics.** Each paint is its own asset (`rocket.<paint>`), so
final clay renders can replace them one for one. Any tinting belongs to the
renders, not to CSS.

## The asset pipeline

1. Every production picture is a file in `assets/` with an `ASSET_REGISTRY`
   entry: id, path, purpose, source, licence, size, format, and state
   (`PLACEHOLDER`, then `DRAFT`, then `FINAL`).
2. Scenes ask for an **id**, never a path, so replacing art means replacing
   the file and updating one registry entry.
3. `npm run config:sync` regenerates the offline precache list and
   [ASSET-MANIFEST.md](ASSET-MANIFEST.md). A missing file fails the sync.
4. Contracts fail if a file in `assets/` is unregistered, if a registered file
   is missing, or if anything the app loads or caches points into
   `references/`.

**Recommended final formats:**

- **Clay renders:** WebP (with a PNG fallback if needed) at 2× the largest
  on-screen size.
- **Transparent sprites:** trimmed to the silhouette.
- **Planets:** a square canvas with the sphere centred, so layout maths stays
  the same.

## Phase 1 placeholders

Every picture in Phase 1 was drawn in this repository as a **stand-in**. It
uses simple SVG shapes with soft radial shading to suggest volume, and makes
no attempt to fake final clay renders. All are marked `PLACEHOLDER`, and the
grown-ups area tells families the artwork is temporary.

The UI chrome is not artwork: buttons, tiles and bubbles get their depth from
tokenised shadows, and the child's icon glyphs are one inline set drawn on a
24px grid.
