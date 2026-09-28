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
                                   # (…/?only=rocket,gear- encodes only jobs whose names start so;
                                   #  PORT=8420 npm run art:encode if 8397 is in use)
npm run config:sync                # refresh the precache list and docs/ASSET-MANIFEST.md
npm run verify
```

Opening the encoder page encodes every master in `out/` at once. The
browser's encoder is deterministic, so an unchanged master writes a
byte-identical file, but `?only=` keeps a partial re-render from touching
anything else.

- **Rendering:** a full render of every job takes a few minutes on a
  20-core machine, because rows are shared across worker threads. A single
  horizon takes about 20 seconds; a word picture 1 to 10.
- **Encoding:** it uses the browser's own WebP encoder. Node has none, and a
  dependency would be the only alternative. The page writes each file to its
  job's target, lists the sizes, and sets its title to `DONE`. Safari cannot
  encode WebP, and the page says so rather than writing a PNG under a
  `.webp` name. To drive the page from a headless browser, use a
  throwaway guest session with sync off (`msedge --headless=new --guest
  --disable-sync`): a fresh ordinary profile can sign itself into the
  computer's account and start syncing.

## Files

| File | What it is |
|---|---|
| `clay.js` | The renderer: shapes, noise, the camera, the **light rig (`RIG`)**, the house clay material (`clay()`), soft shadows, ambient occlusion, bloom, halos, the tone curve and the PNG writer |
| `scenes/*.js` | One file per picture or family: `build(variant)` returns the scene, and `post()` adds glow or atmosphere |
| `jobs.js` | Every picture made: its scene, variant, target path in `assets/` and WebP quality. It appends `jobs-phase2.js` (the game pictures and props), `jobs-rocket22.js` (the rocket's gear), `jobs-world22.js` (the space station, travel clouds and asteroids), `jobs-mars3.js` and `jobs-pictures3.js` (Mars and its word pictures), `jobs-jupiter4.js` and `jobs-moon4.js` (Jupiter, the writing slate), `jobs-p5a.js`, `jobs-p5b.js`, `jobs-p5c.js` (the Phase 5 word pictures) and `jobs-gear5.js` (the Phase 5 gear) |
| `scenes/picture*.js` | The word pictures, one camera for all (`picture.js` `buildObject`). `picture-p3.js` exports its shared shapes and bead eyes (`helpers`), which the Phase 5 files use |
| `scenes/rocketgear.js` | Gear rendered in the rocket's own frame and camera: the rocket is present as an invisible occluder, so only the piece and the shadow it casts on the rocket reach the picture |
| `scenes/station.js`, `scenes/spacefx.js` | The space station (outside, and the garage room with a clear window), and what a flight passes (clouds, asteroids) |
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
   Moon's beacon, the launch pad and every landing spot and marker foot on a
   horizon, the letter stone's face, the meteor stone's top, and the
   station's turntable, window and docking bay (`station.js` `ANCHORS`).
   Gear shares the rocket's frame, so it has no anchor of its own: never
   reframe the rocket without re-rendering every gear piece.
   [docs/ASSET-BRIEFS.md](../../docs/ASSET-BRIEFS.md) lists them, and
   contract 31 projects the scene cameras to check the CSS against them. If a
   scene moves one, update the CSS (or the destination's marker data) in the
   same change.
5. **Paints are masks, not pictures.** The rocket job also writes
   `rocket-paint.png`, the coverage of its `paint: true` materials. Never add
   one rocket per colour; a theme is a CSS pattern through the same mask.
6. **Nothing from `references/`.** A contract checks this folder never
   mentions it.

## Adding a destination

A destination is drawn two ways, and both follow a template:

- **From afar:** copy `mercury.js` — a sphere at the standard framing
  (radius 42% of a square frame) with one signature surface feature, and two
  variants. **Waiting** is cooler (`keyScale` below 1); **restored** adds
  faint warm emission in its hollows (`emissiveAt`) and a warm halo.
- **Underfoot:** add a world to `WORLDS` in `horizon.js`: its clay, its
  signature feature as a height, and the colour of its edge glow. The sphere
  and camera are shared by every world; never change them for one.

Then add three jobs, the registry entries (`asset`, `restoredAsset` and
`horizon` on the destination), a marker picture per mission, and see
[docs/ART-DIRECTION.md](../../docs/ART-DIRECTION.md#the-planet-system).

## Previewing

**A known renderer quirk:** a soft shadow can come out fully black where a
surface faces the key light head on and the scene's distance grows as fast
as the shadow ray. Scaling that scene's distances by 0.88–0.95 avoids it
(`meteorfield.js` does). A solid shadow-catcher floor can also catch rays
entering the bounds from below; a thin floor sheet avoids that.

Scratch previews are easiest by rendering a scene at a small size with one
sample per pixel. Build it with `mod.build(variant)`, lower
`scene.width`/`height`, and run `makeRenderer(scene).renderRow(y, 1, buf)`
for each row. Composite the result over the app's navy before judging it:
transparent pixels shown on black mislead.
