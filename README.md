# Space Kindergarten *(working title)*

A space-adventure learning game for kindergarten children, aged about five to
six, on iPad. A child starts on Earth, launches a rocket through one
continuous clay world, lands on the Moon, finds letters big and little to
relight its beacon and learns to write them on its writing slate, flies on
to Mercury to fix its fuzzy signal with rhymes and beats, to Mars to wake
its sound scanner with first sounds and short words, and to Jupiter to give
its sky signs their words back. Stars earned there dress up the rocket at a
space station with paint, gear and themes. Learning comes first; the
adventure is what makes it fun.

**Status: Phase 4 (v0.6.3).** All seven learning areas have a first game,
and an installed copy picks up each new release by itself at a quiet moment,
never in the middle of play.
The world is the navigation: one stage, planets as places, and flights that
are one camera journey. Twenty missions across eight games are built:

- Letter Explorer ×5 on the Moon (big letters, little letters, big and
  little partners) and Moon Writer ×3 on its writing slate (watch, trace,
  trace with less help)
- Rhyme Radar ×2 and Syllable Meteors ×2 on Mercury
- Sound Scout (beginning sounds) ×2 and Word Builder (CVC words) ×2 on Mars
- Star Words ×2 and Word Orbit ×2 (sight words) on Jupiter

Every letter a child reads is drawn in one school print, from the same
strokes a child learns to write. Tracing is checked by geometry, never by
handwriting recognition. The sight words are twelve from the Dolch
pre-primer list, used as a source, not claimed as alignment
([docs/CONTENT-SOURCES.md](docs/CONTENT-SOURCES.md)).

All of it is development content, awaiting review. Letter sounds and blended
words are **development audio**: a small synthesiser made for this app,
never the device voice, until recordings replace them
([docs/AUDIO.md](docs/AUDIO.md)).

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
assets/                 every picture (WebP), each registered in ASSET_REGISTRY with when it is fetched
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
npm run config:sync   # rewrite derived files (head, manifest, sw.js, package.json, asset manifest, recording list)
npm run economy       # how stars and the rocket's things pace against the missions
```

## Documentation

- [docs/PRODUCT.md](docs/PRODUCT.md): what the product is, what is built, and what is placeholder
- [docs/LEARNING-DESIGN.md](docs/LEARNING-DESIGN.md): how the learning works and why
- [docs/AUDIO.md](docs/AUDIO.md): the audio system, phonics safety, Pip's voice and the sound effects; [docs/AUDIO-RECORDINGS.md](docs/AUDIO-RECORDINGS.md): every recording to make (generated)
- [docs/ART-DIRECTION.md](docs/ART-DIRECTION.md): the visual target, the world stage and planet system, the palette, and Pip
- [docs/ASSET-BRIEFS.md](docs/ASSET-BRIEFS.md): what final art for each picture must match, and every anchor
- [docs/IPAD-QA-PHASE-2.2.md](docs/IPAD-QA-PHASE-2.2.md): the checklist for testing Phase 2.2 on a real iPad ([Phase 2](docs/IPAD-QA-PHASE-2.md) before it)
- [docs/CONTENT-SOURCES.md](docs/CONTENT-SOURCES.md) and [docs/CONTENT-REVIEW.md](docs/CONTENT-REVIEW.md): where the content came from, and what a person must check
- [docs/ASSET-MANIFEST.md](docs/ASSET-MANIFEST.md): every picture and its provenance (generated)
- [ARCHITECTURE.md](ARCHITECTURE.md): how the code fits together and where new work goes
- [PRODUCT-DESIGN.md](PRODUCT-DESIGN.md): the UI rules inherited from the foundation
- [CLAUDE.md](CLAUDE.md): the development method for AI coding sessions
