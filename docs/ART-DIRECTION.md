# Art direction

## The target

Space Kindergarten should look like **a premium stop-motion children's space
film that the child can interact with**: simple cartoon design, made of
physical clay, lit like a premium film. Picture clay models that were
sculpted, placed into miniature space sets, lit by a professional, and
photographed. Space is shown the way a child imagines it, made with real
craft.

These are the things it is *not*:

- flat SVG illustration
- generic glossy 3D plastic
- mobile-game gloss
- AI clipart
- CSS gradients pretending to be clay
- a dashboard: panels, cards and menus over a picture

**The rule above all others:** art should make the learning world magical,
but it must never make the learning harder to understand.

## What we took from the references, in words

References are direction only. None is copied, traced, recoloured, shipped
or committed; see [../references/README.md](../references/README.md).

| Reference | What we took | What we did *not* take |
|---|---|---|
| Phase 1.2 reference: a clay-textured Earth over a moon horizon | **Material**: a velvety clay surface. **Light**: deep blue ambient, a cyan rim from behind, soft bloom. **Space**: near-black navy with restrained stars. **Depth**: a planet out of focus in the distance. **Composition**: a planet's horizon filling the bottom of the frame. | Its faced Earth with arms, its characters and their silhouettes, its ringed planet with a face, its flag, its rocket rider. Our planets have **no faces**, and Pip is the only character. |
| Clay Earth, clay planet grid, ringed clay planet | Matte sculpted spheres, and puffy cream clouds breaking the planet's edge | Any specific planet design. The ringed planet is glossier than we want. |
| Earth limb over a violet starfield | A huge planet at the edge of frame, and sparse stars | |
| Lavender cratered moon | The Moon's identity: lavender clay with raised, rimmed craters | |
| Three-ramp palette card | Palette relationships | |
| Cartoon rocket (Adobe Stock) | Only the generic idea of a friendly rocket with a porthole and fins | Its face, colours or drawing |
| Glowing star with eyes | Nothing. It resembles Nintendo's Power Star, which is why the guide is not a star | |

## The world is the navigation

A child moves through **one continuous world**, not a stack of screens. One
**stage** sits behind every child scene (see `CHILD WORLD` in `index.html`):

| Layer, back to front | What it is | How it moves |
|---|---|---|
| **Sky** | `bg.space`: near-black navy deepening to blue low down, a faint haze. No stars. | Never. |
| **Far stars** | `bg.starsFar`: many tiny dim stars, mostly empty sky | Slowly, in a flight |
| **Near stars** | `bg.starsNear`: a handful of brighter stars | Further than the far layer: the difference reads as speed |
| **Ambient** | Now and then a faint shooting star, far side of the sky | Rarely, at rest only; never over Pip, the title or a lesson |
| **Far travel layer** | What a flight passes behind the rocket: far clouds, far rocks, the light tunnel, the space station seen from outside | Only in a flight |
| **Places** | Two slots: the place the rocket is in, and the one a flight is bringing in. A place is its **sky** (planets and home, far away) and its **ground** (the horizon picture and the markers standing on it), or the station's garage | The ground falls away on departure and rises on arrival; the destination in the sky grows until it is the ground ahead |
| **The rocket** | One actor, standing on its place's landing spot | Trembles, lifts off, crosses, settles, and its clay gives a little on touchdown |
| **Near travel layer** | Near clouds, a big passing rock, specks rushing by; touchdown dust | Only in a flight, and at touchdown |
| **UI plane** | The HUD (the way back, the title, the stars) and the scene: bubbles, buttons, tiles | Clears as a flight begins and settles back after it; never moves with the world |

**Composition, on every place:**

1. **Open space at the top.** Negative space is deliberate; the stars are
   restrained, and most of the sky is empty.
2. **Pip, the destination and the story in the middle.**
3. **The interactive content** stands on the world: the markers, the letter
   stones, the pictures, the meteor stone.
4. **The planet's horizon fills the bottom 35–45%.** Its crest sits at 62%
   of the screen height (`--crest-y`), and its curve runs off both sides.

**Earth, home base.** A large curved Earth horizon; the rocket standing on
its launch pad, on the left-hand continent; Pip floating above; the Moon (and,
once open, Mercury) waiting in the sky. The one Launch will fly to comes
forward — a little larger, lit from behind by a cool light, its name and
what it teaches beneath it — and a band of light with marching dots joins
it to the rocket; the others wait, smaller and quieter. Launch is the one
warm-yellow action, and shows the chosen planet on it. The station button is
small and round; the HUD holds the lock, "EARTH", and the stars. Nothing
else.

**A planet.** The same composition: its horizon at the bottom, the rocket
parked on the right, Pip upper left, home far away in the sky. Its markers
stand on the ground — the Moon's beacon; Mercury's radar dish and meteor
rocks — and the one to play next stands in a warm pool of light with a
warm-yellow ring breathing on the ground around its foot.

**The space station** (the Rocket Dock) is a place, not a menu: a small,
friendly orbital garage above Earth, reached by a flight — up through the
clouds, the station coming into view, the camera on into its open bay, and
the rocket settling onto a turntable. Inside: rounded cream and lavender
clay walls, a softly curved floor, one big round window onto space with
Earth below, paint pots, a hose, and a turntable ringed with small warm
lights. The rocket stands on the turntable, large, as the hero; Pip hovers
nearby; the right-hand wall is kept quiet for the panel of things to try.
A kindergarten space workshop — never industrial, never a dark corridor.

## The planet system

Every destination is shown the same two ways, so a planet added later
belongs to the same universe:

- **From afar** (`asset`, `restoredAsset`): the sphere centred, filling 84%
  of a square canvas (640 px for the Moon, 560 for Mercury, Mars and Jupiter), in two states:
  - **Waiting:** cooler and quieter, its landmark unlit.
  - **Restored:** the same model, with a warm accent light at its landmark,
    faint warmth in its hollows and a warm halo. The app crossfades from one
    to the other while the child watches.
- **Underfoot** (`horizon`): the top of the same world as a horizon, from
  **one sphere and one camera shared by every world** (`horizon.js`,
  2400×780, the crest 18% down, the edges dropping to about half the
  frame). A world changes only its clay, one signature surface feature, and
  the colour of the glow along its edge. That shared grammar is what makes a
  child always know where the ground is.

Anchors — the launch pad, every marker's foot, the rocket's landing spot —
are fractions of the horizon picture, projected from the same camera, so
nothing floats off the ground at any screen size. A contract holds each one
on the ground.

A restored world is a **brighter** world: warm light pools around what the
child fixed (`--world-warmth`). Warm light always comes from something
meaningful: the beacon's lamp, the writing slate, the radar's tip, the
meteor rocks, Mars's sound scanner and word machine, Jupiter's sky sign and
orbit ring, the rocket's flame, the reward stars, and the Sun's spill over
Mercury's and Mars's skies.

| World | Clay colours | Signature feature | State |
|---|---|---|---|
| Earth | ocean blue, lime-green land, cream clouds | low rounded continents, floating cloud puffs, the launch pad | built |
| Moon | lavender-grey, violet shadows, warm beacon light | fingertip craters with raised lips | built |
| Mercury | warm stone, amber; the Sun's warm spill | overlapping shallow dimples | built |
| Venus | peach, coral, warm yellow | soft swirled cloud bands, sculpted in relief | planned |
| Mars | warm coral-rust, deep-red accents, a sunset-orange edge glow | soft rolled craters, huddles of round rust stones, a cream polar cap from afar: a red clay playground, never a hostile one | built |
| Jupiter | cream, amber, warm orange, one thin warm-brown coil; an amber edge glow | bands rolled like pressed plasticine coils, one big red-orange storm spiral in a cream collar, two small swirls; huge and friendly, never stormy; no ring (Saturn has that) | built |
| Saturn | gold, peach, lavender | a thick clay ring, matte, with pressed grooves | planned |
| Uranus | aqua, cyan | smooth, softly banded, a gentle tilt | planned |
| Neptune | deep blue, violet | wind streaks drawn in the clay | planned |

A planned world gets a render job, a registry entry, a horizon and its pair
of states only when it is built.

## One world, one light

Every picture is lit by **one rig**, declared once in `tools/art/clay.js`
(`RIG`). No scene declares its own light, and a contract fails if one tries.
Phase 2 made it premium studio light rather than drama:

| Light | Direction | Colour | Job |
|---|---|---|---|
| **Key** | upper left and in front; large and soft | warm white | form and soft shadows |
| **Fill** | front, from the right; no shadows | cool | keeps faces and the fronts of things bright and friendly while the world around them can be dark |
| **Ambient** | the whole sky | cool space blue above, near-black below | fills shadows without flattening them |
| **Rim** | behind, to the right; thin | cyan | a controlled edge that separates every silhouette from space |
| **Bounce** | below | faint lavender | lifts the undersides, as if light came off a surface |
| **Warm accents** | from things that glow | yellow and orange | only from meaningful sources (see above) |

Shadows follow the key light. They fall down and to the right, in the renders
and in CSS alike (`--contact-shadow`, and the tile and button shadow tokens).
An object that stands on the ground gets a tight contact shadow; a floating
cloud casts a soft, offset one; creases get ambient occlusion. A single
identical drop shadow on everything is never used.

## Material: the house clay

Every clay surface shares one material (`clay()` in `clay.js`). Phase 2 made
it **cleaner**: smooth sculpted plasticine, with the texture barely there.

- **Matte, velvety response.** Light wraps a little past the terminator; a
  saturated band sits there, which is what makes clay read as clay rather
  than plastic; grazing angles get a faint sheen.
- **A whisper of hand-made surface.** One soft octave of grain and a few
  long smoothing marks in patches. Fingerprints are off. Clean colour
  blocking and clean silhouettes do the work, not surface noise.
- **No gloss**, except where the real thing would shine: glass (the
  porthole, the beacon lamp, Pip's antenna ball) and Pip's bead eyes.
- **Warm colours take less of the cyan rim.** Cyan light on yellow clay reads
  olive, so warm clay's rim is reduced (the `rim` setting).

## Shape language

- rounded geometry, simple cartoon forms
- big readable silhouettes: a thing must read from its outline alone
- soft corners and slightly chunky proportions
- gentle asymmetry: Pip's antenna leans, and one wing tilts more than the
  other

Nothing is sharp, mechanical or NASA-realistic.

## Pip, the guide

An **original satellite buddy**, sculpted in clay, made simpler and more
iconic in Phase 2:

- **Body:** a chubby warm-yellow capsule with an orange band.
- **Wings:** two chunky teal solar-panel wings, each with one pressed
  groove, on short lavender arms.
- **Antenna:** a short, leaning stalk with a big glassy ball, which **glows
  while Pip is speaking**. The app lights it: `.pip-light` sits exactly on
  the ball.
- **Face:** big dark bead eyes, each with a catch-light, a small pressed-on
  smile, and soft pink cheeks.
- **Feet:** two little orange feet.

**Silhouette rule:** a body, two panel wings and an antenna. Pip must never
drift toward any of these:

- a five-point star with a face (Nintendo's Power Star)
- a pink ball (Kirby)
- a white egg with a black visor (EVE)
- a green owl (Duo)
- any existing educational mascot

**Personality:** warm, curious and encouraging. Never sarcastic, and never
disappointed. Pip holds each pose for a frame like a hand-posed model, and
hops when it cheers.

## Rocket and paints

The rocket is a friendly clay toy with a strong silhouette: a tall cone cap
with a softly rounded tip, a straight cream body with a big round window
(a cream rim, deep blue glass, a catch-light), three big swept fins and a
simple flared lavender-grey engine bell. It was chosen from five silhouettes
after the real-iPad QA found the first rocket weak and a little like an egg;
it must read as a rocket at 60 px. It stands on its nozzle, on the launch
pad at home, on the turntable in the station, and on the ground of every
place it lands. The flame is a separate sculpted layer, hung from the
nozzle and shown only in flight.

**A paint is a colour, not a picture.** The rocket is rendered once, with its
painted parts (the cap and the fins) in white clay. Those parts are also
exported as a mask (`rocket.paintMask`). In the app, the paint colour (a
`--paint-*` token) is cut to the mask and multiplied over the render.
Multiplying is how a matte surface takes a colour, so the render's shading
and shadows all survive every paint. There are ten (Phase 5 added Midnight
blue and Moon silver: a dark and a light one, unlike any of the eight).

**A theme is a pattern through the same mask:** Bumblebee's stripes (with
pale wings), Rainbow's bands, Galaxy's speckled purple, Polka dots' cream
dots on sky blue, and Race checkers' dark and cream squares, square in the
rocket's frame. Still one render.

**Gear is clay laid on the rocket:** a star or a moon topper, a tiny
antenna, warm side lights, little boosters, and from Phase 5 a gold planet
ring around the cap, a little satellite dish and a string of party flags
across the cap. (Party streamers tied to the fins were tried first and
dropped: at play size they read as squiggles, and in flight as legs.) Each is rendered in the
rocket's own frame and camera, with the shadow it casts on the rocket, so
it sits exactly in place over any paint. Gear keeps its own colours.

The rocket in a picture ("rocket" in Syllable Meteors) is always the child's
own, as it looks now.

## The game pictures and props

- **Pictures** (`picture.*`, 384×384): thirty-nine small clay objects
  under one camera — a gentle three-quarter view from slightly above — each
  filling about 80% of its frame, so they read as one set. Animals have
  small bead eyes (the robot has round eye discs); an object never has a
  face. No text is ever baked into a picture. Phase 5 added eleven for
  replays: bat, bun, pup, hut, fox, box, mouse, nest, seal, robot and
  butterfly, each chosen so its name is the one a child would say, or the
  one Pip says as it is shown.
- **Letter stones** (`prop.letterStone`): a Moon stone with a flat front
  face. The letter is drawn by the app on a clean plate laid over that face.
- **The meteor stone** (`prop.beatStone`): a round, drum-like rock with a
  wide, smooth top a child taps once for each beat.
- **Meteors** (`prop.meteor`, `prop.meteorLit`): a beat waiting to be
  tapped, and a beat tapped.
- **Markers** (the beacon, the writing slate, the radar dish, the meteor
  rocks, the sound scanner, the word machine, the sky sign, the orbit
  ring): each in a waiting and a restored state, standing on its world.
  A marker never carries a letter or a word: the slate and the sky sign
  are blank, always.
- **The word satellite** (`prop.wordSat`): one clay satellite for every
  sight word, with a flat, light face the app writes the word on, as the
  letter stones carry a letter.

## UI: a hybrid, on purpose

The world, the characters, the planets and the rocket are **clay miniature
art**. The controls are **clean, premium children's UI**. They are not made
of clay, because a screen full of textured buttons is noise. Phase 2 took
the UI back to the minimum; Phase 2.2 made it quieter still.

- **One HUD** over every scene: a small round way back top left, a short
  title and a few words of task in a dark glass pill top centre, the star
  count top right. Nothing else sits in the corners.
- **A large target does not need a giant mark.** Secondary controls are
  48–64 px marks inside full-size invisible targets; only Launch stays big.
- **The space station's panel** is one compact dark-glass panel on the
  quiet right-hand wall: three tabs, round chips (a colour for a paint, a
  little rocket wearing it for gear and themes), and one action.

- **Depth follows the world's light.** Buttons, tiles and panels get the same
  treatment (the `--shadow-*` tokens): a highlight at the top left, a darker
  lip at the bottom right, a shadow falling down and to the right, and on
  dark controls a thread of cyan rim light on the right edge.
- **What a child reads stays the clearest thing on screen:** a letter sits
  on a clean cream-lavender plate, never on clay, at a contrast far above
  what reading needs (a contract holds it there); a picture choice sits on a
  clean cream card.
- **Child-readable type:** the rounded system face, large, bold, and only a
  few words at a time — for captions and titles. **Letters and words a child
  is learning are not type:** they are the school print, drawn from the
  same strokes the child learns to write (ball-and-stick: a single-storey a,
  a capital I with bars), as round-capped vector strokes in the tile ink.
- **The writing slate on screen is clean UI, not clay:** a flat deep-blue
  surface (`--slate-surface`) with a light rim, the classroom's writing
  lines (solid top and base, a dashed middle, a faint tail line for little
  letters), cream lanes, a yellow dashed path and arrow, the child's ink in
  warm yellow, and the green start dot (`--success`). Nothing textured
  sits behind a letter being traced.
- **One primary action per screen** keeps the warm yellow. On a planet it is
  the marker's ring, until nothing is left to play and the way home turns
  yellow.

## Motion

- **Flights move the camera through the one world**, in the rhythm action,
  breath, travel, anticipation, settle. Tap Launch: the button presses in,
  the controls quietly clear, the engine lights and the clay rocket
  trembles, it lifts straight up, the Earth falls away, a layer of clouds
  passes the camera, space opens and streams past (the near stars faster,
  specks rushing by), the destination grows ahead, its horizon rises into
  place, and the rocket comes down upright onto its landing spot — dust
  puffs, the clay gives a little, Pip settles, the HUD returns.
- **A small vocabulary of motifs, reused by every route:** clouds leaving
  and reaching Earth; the stellar cruise; now and then a shooting star or a
  pass of friendly clay asteroids (never in the way, never danger); an
  original light tunnel of soft lavender, teal and cream rings for the
  first trip to a world beyond the first stop (rings, not streaks: nobody
  else's hyperspace); and the station's approach into its bay.
- **Pacing:** about 2.6 s for a common trip, settle included; about 3.4 s
  for a first arrival, which carries story; shorter for a route already
  flown. A tap anywhere skips it. Transforms and opacity only (the Web
  Animations API), so an iPad composites it without repainting; no WebGL.
  All the pictures a flight needs are fetched and decoded while the child
  is still on Earth.
- **Space is alive at rest:** a faint shooting star crosses the far side of
  the sky every 13–23 seconds, never over what a child reads.
- **Navigation stays smooth and fast.** Nothing a child waits for imitates
  stop-motion.
- **Characters move like stop-motion.** Pip's idle bob and cheer, and the
  rocket's idle sway, step at about ten frames a second (CSS `steps()`),
  holding each pose as a hand-posed model would.
- **Light moves smoothly:** the beacon's breath, the flame's flicker, what
  was fixed lighting up.
- **Rewards are quick:** three clay stars arc from what was fixed to the star
  count, landing within about two seconds.
- **Reduce Motion** turns all of it off: a flight becomes a short crossfade
  with nothing sliding or streaming, no clouds, rocks, rings or shooting
  stars, the stars simply count up, and nothing steps. It is honoured from both the device and the grown-ups setting, and
  contracts check both.

## The asset pipeline

1. **Render.** Each picture is a scene file in `tools/art/scenes/`, sculpted
   as signed-distance shapes and shaded by the house clay under the rig.
   `npm run art:render` writes lossless masters to `tools/art/out/`, which is
   git-ignored.
2. **Check edges.** The renderer warns if a sprite reaches its frame edge,
   which would show as a cut line in the app.
3. **Encode.** `npm run art:encode`, then open the page it prints in Chrome
   or Edge; it turns the masters into WebP files in `assets/`. The Home
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

The Phase 2 set is 39 files and about 750 KB, including the two PNG icons
(about 200 KB). The first Earth screen needs about 220 KB.

## What the current renders are, honestly

They are **computer-rendered clay**, made by a procedural renderer written
for this project. They are not a sculpture photographed on a set. Because
the renderer is shared, they share one light, one material, one camera
grammar and one level of detail. They are original, and they can be
re-rendered at any time.

**Where a sculptor or a 3D artist would still do better:**

- richer surface detail
- true subsurface scattering
- hand-placed imperfections
- more expressive character poses

[ASSET-BRIEFS.md](ASSET-BRIEFS.md) specifies each picture precisely, so
final art can replace the drafts one file at a time, with no change to the
app.
