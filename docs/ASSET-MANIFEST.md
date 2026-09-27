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

**15 registered assets: 15 DRAFT.**

| Id | Path | State | Format | Size | Purpose | Source | Licence |
|---|---|---|---|---|---|---|---|
| `bg.space` | `assets/backgrounds/space.webp` | DRAFT | webp | 2400×1600 | Deep space behind every child scene | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `bg.moonGround` | `assets/backgrounds/moon-ground.webp` | DRAFT | webp | 2400×800 | Moon surface under the mission and the celebration | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.earth` | `assets/planets/earth.webp` | DRAFT | webp | 1400×1400 | Home base: the Earth hero and the start of every flight | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.moon` | `assets/planets/moon.webp` | DRAFT | webp | 800×800 | The first destination, waiting: cool, its beacon dark | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `planet.moonLit` | `assets/planets/moon-lit.webp` | DRAFT | webp | 800×800 | The Moon once restored: its beacon lit, warm light in the craters | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.beacon` | `assets/props/beacon.webp` | DRAFT | webp | 512×896 | The Moon's beacon before its mission is complete | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.beaconLit` | `assets/props/beacon-lit.webp` | DRAFT | webp | 512×896 | The Moon's beacon, lit by a finished mission | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.star` | `assets/props/star.webp` | DRAFT | webp | 256×256 | The star a child earns and spends | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `prop.pad` | `assets/props/pad.webp` | DRAFT | webp | 1200×480 | The Rocket Dock's launch pad | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.body` | `assets/rocket/rocket.webp` | DRAFT | webp | 640×1088 | The rocket, with its painted parts in white clay | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.paintMask` | `assets/rocket/rocket-paint.webp` | DRAFT | webp | 640×1088 | Where paint goes on the rocket: every paint colour is multiplied through it | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `rocket.flame` | `assets/rocket/flame.webp` | DRAFT | webp | 256×384 | Engine flame while flying | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `character.pip` | `assets/characters/pip.webp` | DRAFT | webp | 720×660 | Pip, the guide — an original satellite-buddy design | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `icon.192` | `icon-192.png` | DRAFT | png | 192×192 | Home-screen icon | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
| `icon.512` | `icon-512.png` | DRAFT | png | 512×512 | Install and splash icon | Rendered in this repository by tools/art (procedural clay renderer), 2026-09-26 | Project-owned |
<!-- ASSET-TABLE-END -->
