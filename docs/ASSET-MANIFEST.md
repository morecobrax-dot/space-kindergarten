# Asset manifest

Every picture Space Kindergarten ships, where it came from, who owns it, and
whether it is final. The table is generated from `ASSET_REGISTRY` in
`index.html` by `npm run config:sync`, and `npm run verify` fails if it drifts.

**States.** `PLACEHOLDER` — a stand-in drawn to be replaced. `DRAFT` — real
artwork, not signed off. `FINAL` — approved production art.

**Rule.** Nothing from `references/` may ever appear here. A reference image is
direction, not material; see `references/README.md`.

<!-- ASSET-TABLE-BEGIN
 — derived from ASSET_REGISTRY by `npm run config:sync`. Do not hand-edit. -->

**53 registered assets: 53 DRAFT.**

| Id | Path | State | Format | Size | Purpose | Source | Licence |
|---|---|---|---|---|---|---|---|
| `bg.space` | `assets/backgrounds/space.webp` | DRAFT | webp | 1600×1100 | Deep space behind every place | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `bg.starsFar` | `assets/backgrounds/stars-far.webp` | DRAFT | webp | 2400×2200 | The far star field: it moves slowly in a flight | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `bg.starsNear` | `assets/backgrounds/stars-near.webp` | DRAFT | webp | 2400×2200 | A few near stars: they move faster in a flight, which reads as speed | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `horizon.earth` | `assets/horizons/earth.webp` | DRAFT | webp | 2400×780 | Home: the curve of Earth, with the launch pad the rocket stands on | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `horizon.moon` | `assets/horizons/moon.webp` | DRAFT | webp | 2400×780 | The Moon underfoot, where its mission happens | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `horizon.mercury` | `assets/horizons/mercury.webp` | DRAFT | webp | 2400×780 | Mercury underfoot: warm stone and soft dimples | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `place.stationOutside` | `assets/places/station-outside.webp` | DRAFT | webp | 1024×1024 | The space station seen from space, its docking bay open, as the rocket flies in | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `place.stationInside` | `assets/places/station-inside.webp` | DRAFT | webp | 2400×1600 | The station's garage: the turntable the rocket stands on, and a clear window onto space | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.earth` | `assets/planets/earth.webp` | DRAFT | webp | 600×600 | Home, far behind, in every destination's sky | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.moon` | `assets/planets/moon.webp` | DRAFT | webp | 640×640 | The Moon in the sky, waiting, its beacon dark; also the picture for "moon" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.moonLit` | `assets/planets/moon-lit.webp` | DRAFT | webp | 640×640 | The Moon once restored: its beacon lit, warm light in the craters | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.mercury` | `assets/planets/mercury.webp` | DRAFT | webp | 560×560 | Mercury in the sky, waiting | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.mercuryLit` | `assets/planets/mercury-lit.webp` | DRAFT | webp | 560×560 | Mercury once restored: warm light in its dimples | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.beacon` | `assets/props/beacon.webp` | DRAFT | webp | 512×896 | The Moon's beacon before its mission is complete: the Moon's marker | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.beaconLit` | `assets/props/beacon-lit.webp` | DRAFT | webp | 512×896 | The Moon's beacon, lit by a finished mission | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.radar` | `assets/props/radar.webp` | DRAFT | webp | 480×480 | Mercury's radar dish, its signal fuzzy: the Rhyme Radar marker | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.radarOn` | `assets/props/radar-on.webp` | DRAFT | webp | 480×480 | The radar dish fixed, its tip glowing | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.meteorField` | `assets/props/meteor-field.webp` | DRAFT | webp | 480×360 | Mercury's meteor rocks, cold: the Syllable Meteors marker | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.meteorFieldOn` | `assets/props/meteor-field-on.webp` | DRAFT | webp | 480×360 | The meteor rocks glowing warm | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.letterStone` | `assets/props/letter-stone.webp` | DRAFT | webp | 400×440 | A Moon stone carrying a letter plate, in Letter Explorer | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.beatStone` | `assets/props/beat-stone.webp` | DRAFT | webp | 512×400 | The big stone a child taps once for each beat | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.meteor` | `assets/props/meteor.webp` | DRAFT | webp | 192×192 | A beat still to tap | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.meteorLit` | `assets/props/meteor-lit.webp` | DRAFT | webp | 192×192 | A beat tapped: a glowing meteor | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.star` | `assets/props/star.webp` | DRAFT | webp | 256×256 | The star a child earns and spends | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.cloudA` | `assets/props/cloud-a.webp` | DRAFT | webp | 640×400 | A cloud the camera passes leaving or reaching Earth | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.cloudB` | `assets/props/cloud-b.webp` | DRAFT | webp | 640×400 | A second cloud, another shape | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.cloudC` | `assets/props/cloud-c.webp` | DRAFT | webp | 640×400 | A third cloud, another shape | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.asteroidA` | `assets/props/asteroid-a.webp` | DRAFT | webp | 384×384 | A friendly lavender-grey asteroid drifting past | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.asteroidB` | `assets/props/asteroid-b.webp` | DRAFT | webp | 384×384 | A friendly lumpy warm-grey asteroid drifting past | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.asteroidC` | `assets/props/asteroid-c.webp` | DRAFT | webp | 384×384 | A small pair of rocks drifting past together | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.apple` | `assets/pictures/apple.webp` | DRAFT | webp | 384×384 | A picture for the word "apple" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.banana` | `assets/pictures/banana.webp` | DRAFT | webp | 384×384 | A picture for the word "banana" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.bee` | `assets/pictures/bee.webp` | DRAFT | webp | 384×384 | A picture for the word "bee" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.cake` | `assets/pictures/cake.webp` | DRAFT | webp | 384×384 | A picture for the word "cake" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.car` | `assets/pictures/car.webp` | DRAFT | webp | 384×384 | A picture for the word "car" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.rock` | `assets/pictures/rock.webp` | DRAFT | webp | 384×384 | A picture for the word "rock" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.snake` | `assets/pictures/snake.webp` | DRAFT | webp | 384×384 | A picture for the word "snake" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.sock` | `assets/pictures/sock.webp` | DRAFT | webp | 384×384 | A picture for the word "sock" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.spoon` | `assets/pictures/spoon.webp` | DRAFT | webp | 384×384 | A picture for the word "spoon" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.tomato` | `assets/pictures/tomato.webp` | DRAFT | webp | 384×384 | A picture for the word "tomato" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `picture.tree` | `assets/pictures/tree.webp` | DRAFT | webp | 384×384 | A picture for the word "tree" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.body` | `assets/rocket/rocket.webp` | DRAFT | webp | 640×800 | The rocket, with its painted parts in white clay; also the picture for "rocket" | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.paintMask` | `assets/rocket/rocket-paint.webp` | DRAFT | webp | 640×800 | Where paint goes on the rocket: every paint colour is multiplied through it | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.flame` | `assets/rocket/flame.webp` | DRAFT | webp | 256×384 | Engine flame while flying | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.gearStar` | `assets/rocket/gear-star.webp` | DRAFT | webp | 640×800 | Gear: a star topper on the nose | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.gearMoon` | `assets/rocket/gear-moon.webp` | DRAFT | webp | 640×800 | Gear: a crescent moon topper on the nose | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.gearAntenna` | `assets/rocket/gear-antenna.webp` | DRAFT | webp | 640×800 | Gear: a tiny antenna on the nose cone | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.gearLights` | `assets/rocket/gear-lights.webp` | DRAFT | webp | 640×800 | Gear: two warm side lights on the fins | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.gearBooster` | `assets/rocket/gear-booster.webp` | DRAFT | webp | 640×800 | Gear: two small side boosters | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.gearWings` | `assets/rocket/gear-wings.webp` | DRAFT | webp | 640×800 | The bumblebee theme's pale wings | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `character.pip` | `assets/characters/pip.webp` | DRAFT | webp | 720×660 | Pip, the guide — an original satellite-buddy design | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `icon.192` | `icon-192.png` | DRAFT | png | 192×192 | Home-screen icon | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `icon.512` | `icon-512.png` | DRAFT | png | 512×512 | Install and splash icon | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
<!-- ASSET-TABLE-END -->
