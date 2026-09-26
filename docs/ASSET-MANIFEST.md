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

**14 registered assets: 14 PLACEHOLDER.**

| Id | Path | State | Format | Size | Purpose | Source | Licence |
|---|---|---|---|---|---|---|---|
| `bg.space` | `assets/backgrounds/space.svg` | PLACEHOLDER | svg | 1600×1000 | Starfield behind every child scene | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `bg.moonGround` | `assets/backgrounds/moon-ground.svg` | PLACEHOLDER | svg | 1600×420 | Moon surface under the mission and the celebration | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `planet.earth` | `assets/planets/earth.svg` | PLACEHOLDER | svg | 600×600 | Home base: the Earth hero and the start of every flight | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `planet.moon` | `assets/planets/moon.svg` | PLACEHOLDER | svg | 400×400 | The first destination, in Earth's sky and in flight | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `prop.beacon` | `assets/props/beacon.svg` | PLACEHOLDER | svg | 160×280 | The Moon's beacon, lit when its mission is complete | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `prop.star` | `assets/props/star.svg` | PLACEHOLDER | svg | 100×100 | The star a child earns and spends | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `rocket.classic` | `assets/rocket/rocket-classic.svg` | PLACEHOLDER | svg | 200×340 | Rocket in the paint every explorer starts with | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `rocket.sky` | `assets/rocket/rocket-sky.svg` | PLACEHOLDER | svg | 200×340 | Rocket in sky-blue paint (cosmetic) | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `rocket.sunny` | `assets/rocket/rocket-sunny.svg` | PLACEHOLDER | svg | 200×340 | Rocket in sunny-yellow paint (cosmetic) | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `rocket.lime` | `assets/rocket/rocket-lime.svg` | PLACEHOLDER | svg | 200×340 | Rocket in lime-green paint (cosmetic) | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `rocket.flame` | `assets/rocket/flame.svg` | PLACEHOLDER | svg | 100×150 | Engine flame while flying | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `character.pip` | `assets/characters/pip.svg` | PLACEHOLDER | svg | 240×220 | Pip, the guide — an original satellite-buddy design | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `icon.192` | `icon-192.png` | PLACEHOLDER | png | 192×192 | Home-screen icon | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
| `icon.512` | `icon-512.png` | PLACEHOLDER | png | 512×512 | Install and splash icon | Drawn in this repository as a stand-in, 2026-09-26 | Project-owned |
<!-- ASSET-TABLE-END -->
