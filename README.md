# Space Kindergarten *(working title)*

A space-adventure learning game for kindergarten children, aged about five to
six, on iPad. A child starts on Earth, launches a rocket, travels to the Moon,
finds letters to relight its beacon, earns stars, and spends them on rocket
paint. Learning comes first; the adventure is what makes it fun.

**Status: Phase 1, a vertical slice.** It contains one complete Moon mission
of six uppercase letter-recognition rounds, plus the full loop around it.

The artwork is a set of draft clay renders made in this repository by
`tools/art`. Spoken instructions use the device's own speech voice as a
temporary stand-in for recorded narration. See
[docs/PRODUCT.md](docs/PRODUCT.md) for what is and is not built.

## What it is

- **One HTML file, one service worker, one manifest.** No framework, no build
  step, no dependencies, no backend. `npm` is used only for tests and config
  tooling.
- **Local-first.** Progress lives on the device, under this app's own
  namespace.
- **Private.** No accounts, no ads, no analytics, no network calls, and no
  links out of the child's world.
- **Landscape-first on iPad.** Pre-readers can use it through voice, pictures
  and very large targets.

```
index.html              the whole app: tokens, scenes, engine, content, audio
sw.js                   offline cache; name and precache list derived
manifest.webmanifest    install metadata, derived from APP_CONFIG
assets/                 every picture (WebP), each registered in ASSET_REGISTRY
icon-192/512.png        home-screen icons (draft clay renders)
tools/art/              the clay renderer that makes every picture (see its README)
docs/                   product, learning, art, content and asset docs
references/             moodboard rules (the images are git-ignored)
scripts/config.js       sync / verify derived files against the app
scripts/contamination.js residue guard inherited from the starter
test/                   Node harness and the contract suite
```

## Run it

```bash
npx --yes http-server -p 8181 -c-1 .
```

Then open `http://localhost:8181` in landscape. Opening `index.html` directly
also works, but without the service worker.

## Verify it

```bash
npm run verify
```

That one command runs the contracts, checks the derived files against
`index.html`, and scans for residue. It must be green before every commit.

```bash
npm test              # contracts only
npm run config:sync   # rewrite derived files (head, manifest, sw.js, package.json, asset manifest)
```

## Documentation

- [docs/PRODUCT.md](docs/PRODUCT.md): what the product is, Phase 1 scope, and what is placeholder
- [docs/LEARNING-DESIGN.md](docs/LEARNING-DESIGN.md): how the learning works and why
- [docs/ART-DIRECTION.md](docs/ART-DIRECTION.md): the visual target, the palette, and Pip
- [docs/CONTENT-SOURCES.md](docs/CONTENT-SOURCES.md) and [docs/CONTENT-REVIEW.md](docs/CONTENT-REVIEW.md): where the content came from, and what a person must check
- [docs/ASSET-MANIFEST.md](docs/ASSET-MANIFEST.md): every picture and its provenance (generated)
- [ARCHITECTURE.md](ARCHITECTURE.md): how the code fits together and where new work goes
- [PRODUCT-DESIGN.md](PRODUCT-DESIGN.md): the UI rules inherited from the foundation
- [CLAUDE.md](CLAUDE.md): the development method for AI coding sessions
