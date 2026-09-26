# References

`references/visual/` holds **moodboard images**. They are direction, not
material.

## The rules

1. **Never ship a reference.** No file in this folder may be copied, cropped,
   traced, recoloured, or loaded by the app. Production art lives in
   `assets/`, and every file there has a registry entry naming its source and
   licence (see `docs/ASSET-MANIFEST.md`). A contract fails if anything the app
   loads or caches points into `references/`.
2. **Never commit a reference.** `references/visual/*` is git-ignored. A
   pushed repository, or a GitHub Pages deployment of it, would redistribute
   artwork we do not own.
3. **Extract only high-level direction** — shape language, lighting, palette
   relationships, composition. Record what was taken in
   `docs/ART-DIRECTION.md`, in words, never as a sample of the image.

## Why the rules are this strict

The current moodboard, collected on 2026-09-26, includes:

- a watermarked **Adobe Stock** illustration (the cartoon rocket)
- artwork from an **OpenSea** profile (the cloud-wrapped Earth)
- a **commercial Etsy clipart set** (the clay planet grid and the clay Earth)
- **Pinterest pins** of unknown origin, one labelled "AI modified"
- a glowing five-point star with two oval eyes, which closely resembles
  **Nintendo's Power Star**. The guide character must not be a star with a
  face for exactly this reason — see the guide section of
  `docs/ART-DIRECTION.md`.

None of it is licensed to this project. All of it is useful as direction.
