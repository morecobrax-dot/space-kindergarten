# Content sources

Where every piece of learning content came from. **Nothing in Space
Kindergarten is currently aligned to, or derived from, a published curriculum,
standard or word list, and no copy may claim otherwise** until a source is
chosen and recorded here.

## Phase 1 content: all internally authored

| Content | Where it lives | Source | Status |
|---|---|---|---|
| The Moon mission's letters (M S O T S M, uppercase) | `MISSIONS['moon-1']` | Chosen for this project: four visually distinct uppercase letters, repeated so each is met twice. M comes first and last to bookend the mission. | Authored; needs review |
| Letter shape families (straight, diagonal, curved, mixed) | `LETTERS[x].family` | Internal classification by stroke type, used only to pick easy distractors | Authored; needs review |
| Lookalike letters | `LETTERS[x].lookalikes` | Internal list of commonly confused uppercase pairs (M/N/W, B/P/R/D, O/Q/C/D, E/F…) | Authored; needs review |
| "Ambiguous" flag on I | `LETTERS.I.ambiguous` | Internal: in a plain sans-serif, uppercase I is indistinguishable from lowercase l and the digit 1 | Authored |
| Spoken letter names for the device voice | `LETTERS[x].speak` | Standard US English letter names, spelled phonetically for a speech synthesiser | Authored; **must be heard on the target iPad voice** |
| Every spoken line and caption | `VOICE_CUES`, `voiceCue()` | Written for this project | Authored; needs review |
| Difficulty rules (3 in a row up, any help down) | `tierFor()`, `TIER_STEP_UP` | Internal design decision, not a published model | Documented in LEARNING-DESIGN.md |
| Star price list (3, 5, 6) | `COSMETICS` | Internal: the first paint is affordable after one mission | Authored |

## Sources to choose before future content

- **A sight-word list.** Candidates include Dolch pre-primer and primer, and
  Fry's first hundred. One must be chosen, cited, and its licence checked
  before any sight-word content ships.
- **A phoneme inventory and letter-sound mapping** for beginning sounds and
  CVC words. Recordings must be made by a person who can produce isolated
  sounds without an added schwa.
- **Letter formation (stroke order and direction)** for handwriting. Choose
  one named handwriting model and follow it consistently.
- **Rhyming pairs and syllable counts.** Author them, then have a person
  review them, especially for regional pronunciation (for example "flower" or
  "fire").
- **A school-style font** for lowercase, with single-storey "a" and "g".
  Andika (SIL Open Font License) is a strong candidate and can be bundled
  offline.

## Rules

1. Record the source of every new content set here before it ships.
2. Never write "research-backed", "standards aligned" or "curriculum aligned"
   in the app, the store listing or the docs without a mapping in this file.
3. Every authored item also goes into [CONTENT-REVIEW.md](CONTENT-REVIEW.md).
