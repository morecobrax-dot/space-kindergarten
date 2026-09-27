# tools/art: the clay renderer

Every picture in `assets/` is rendered here, from a scene file in this
folder. The shapes are sculpted as signed distance fields (maths that
describes a solid shape), then shaded as matte modelling clay under **one
light rig**. Nothing is drawn by hand, traced or downloaded.

It is Node only, with no dependencies. It is deterministic: the same scene
file always renders the same pixels.

This is an **authoring tool, not a build step**. The app ships the committed
WebP files, and it never runs this code.

## Make the pictures

```
npm run art:render                 # every job → tools/art/out/*.png (lossless masters)
node tools/art/render.js earth     # only one job, or a list
npm run art:encode                 # then open http://127.0.0.1:8397/ in Chrome or Edge
npm run config:sync                # refresh the precache list and docs/ASSET-MANIFEST.md
npm run verify
```

- **Rendering:** a full render of every job takes about a minute on a
  20-core machine, because rows are shared across worker threads.
- **Encoding:** it uses the browser's own WebP encoder. Node has none, and a
  dependency would be the only alternative. The page writes each file to its
  job's target, lists the sizes, and sets its title to `DONE`. Safari cannot
  encode WebP, and the page says so rather than writing a PNG under a
  `.webp` name.

## Files

| File | What it is |
|---|---|
| `clay.js` | The renderer: shapes, noise, the camera, the **light rig (`RIG`)**, the house clay material (`clay()`), soft shadows, ambient occlusion, bloom, halos, the tone curve and the PNG writer |
| `scenes/*.js` | One file per picture or family: `build(variant)` returns the scene, and `post()` adds glow or atmosphere |
| `jobs.js` | Every picture made: its scene, variant, target path in `assets/` and WebP quality |
| `render.js` | Renders jobs into `out/`, and warns if a transparent picture touches its frame edge |
| `encode.js` | The local encoder page and server |
| `out/` | The masters, git-ignored |

## Rules

1. **Never declare a light in a scene.** The rig lives in `clay.js`, and a
   contract fails if a scene brings its own `dir:` or changes `RIG`. Warm
   accents come only from `points` (a lamp, a flame) that sit inside the
   world.
2. **Use the house clay.** Build materials with `clay({ albedo })` and change
   as little as possible. Warm colours get a lower `rim`, because cyan on
   yellow clay reads olive.
3. **Keep sprites inside their frame.** If `render.js` prints a WARNING, fix
   the framing, glow or shadow fade. A cut line in the app looks broken.
4. **Keep the anchors.** The app positions things by fixed points in each
   picture: Pip's antenna ball, the rocket's nozzle, the beacon's lamp, the
   Moon's beacon, and the rocket's landing spot on Earth.
   [docs/ASSET-BRIEFS.md](../../docs/ASSET-BRIEFS.md) lists them. If a scene
   moves one, update the CSS in the same change.
5. **Paints are masks, not pictures.** The rocket job also writes
   `rocket-paint.png`, the coverage of its `paint: true` materials. Never add
   one rocket per colour.
6. **Nothing from `references/`.** A contract checks this folder never
   mentions it.

## Adding a destination

Copy the Moon: a sphere at the standard framing (radius 42% of a square
frame) with one signature surface feature, and two variants.

- **Waiting** is cooler: use `keyScale` below 1.
- **Restored** adds a warm point light at its landmark, faint warm emission
  in its hollows (`emissiveAt`), and a warm halo.

Then add two jobs, two registry entries (`asset` and `restoredAsset` on the
destination), and see
[docs/ART-DIRECTION.md](../../docs/ART-DIRECTION.md#the-destination-system-for-planets-to-come).

## Previewing

Scratch previews are easiest by rendering a scene at a small size with one
sample per pixel. Build it with `mod.build(variant)`, lower
`scene.width`/`height`, and run `makeRenderer(scene).renderRow(y, 1, buf)`
for each row. Composite the result over the app's navy before judging it:
transparent pixels shown on black mislead.
