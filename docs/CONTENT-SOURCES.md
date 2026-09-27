# Content sources

Where every piece of learning content came from. **Space Kindergarten is not
aligned to any published curriculum or standard, and no copy may claim
otherwise.** One published list is used as a source: the twelve sight words
come from the Dolch pre-primer list (below). That is recorded here as a
source, not claimed anywhere as alignment.

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

## Phases 2 and 3: authored for this project

The rhyming pairs, syllable counts, beginning sounds, CVC words, and every
line and picture word behind them were written for this project. None comes
from a published list. Each is in [CONTENT-REVIEW.md](CONTENT-REVIEW.md),
awaiting review.

## Phase 4: sight words — the source

A sight word is a very common word a child learns to recognise whole,
because it comes up everywhere (and often cannot yet be sounded out: "the",
"you"). A child should meet the words most kindergarten classrooms teach,
not a list invented for an app. The candidate sources were weighed on five
things:

| Source | For kindergarten | Licence and redistribution | Common use | Order | Decodable or irregular |
|---|---|---|---|---|---|
| **Dolch pre-primer** (Edward W. Dolch; first published in a journal article in 1936, then in *Problems in Reading*, 1948): 40 words | Written for the earliest readers, and used in kindergarten and grade 1 | A list of common English words. No single word can be owned, the list is reproduced freely by schools and publishers, and we copy only which words are on it: no text, layout or materials. We found no licence restricting that use | Very widely used in US classrooms | Grouped by stage (pre-primer, primer, grades 1–3), not by lesson | Both: a mix of decodable words (and, can) and ones that must be known by sight (the, you, said) |
| Dolch primer: 52 words | The next step, better for later in kindergarten | As above | As above | As above | As above |
| Fry's first hundred (Edward Fry) | Its first hundred reach well past kindergarten | Its later revised lists are published commercially, so reuse is less clear | Widely used | Ordered by frequency | Both |

**Chosen: the Dolch pre-primer list** — the earliest stage of the most widely
used list, with the clearest basis for using its words. The app **never**
says it is "Dolch aligned": it uses twelve of the forty words as a
development set, in its own order, awaiting an educator's review. If any
future copy ever names Dolch, confirm the claim with this file first.

**The development set.** Twelve of the forty, in the order the missions meet
them. "Decodable" means a child could sound it out with the letter sounds
the app teaches (short vowels, one sound per letter); the rest are learned
by sight for now. The single-letter words **a** and **I** wait: on their own
they look exactly like the letters a child is finding on the Moon.

| Word | List | Decodable with the sounds taught | Missions | Status |
|---|---|---|---|---|
| `the` | Dolch pre-primer | no (irregular) | jupiter-1, jupiter-2, reviews | Awaiting review |
| `and` | Dolch pre-primer | yes | jupiter-1, jupiter-2, reviews | Awaiting review |
| `see` | Dolch pre-primer | not yet (the "ee" team comes later) | jupiter-1, jupiter-2, reviews | Awaiting review |
| `you` | Dolch pre-primer | no (irregular) | jupiter-1, jupiter-2, reviews | Awaiting review |
| `to` | Dolch pre-primer | no (irregular) | jupiter-2, jupiter-3 | Awaiting review |
| `go` | Dolch pre-primer | not yet (a long vowel at the end) | jupiter-2, jupiter-3 | Awaiting review |
| `is` | Dolch pre-primer | not yet (its s says /z/) | jupiter-3, jupiter-4 | Awaiting review |
| `it` | Dolch pre-primer | yes | jupiter-3, a review | Awaiting review |
| `in` | Dolch pre-primer | yes | jupiter-4 | Awaiting review |
| `can` | Dolch pre-primer | yes | jupiter-4 | Awaiting review |
| `we` | Dolch pre-primer | not yet (a long vowel at the end) | jupiter-4 | Awaiting review |
| `my` | Dolch pre-primer | not yet (y says "eye") | jupiter-4 | Awaiting review |

In the code, each word names its list (`WORDS.the.sight.list`, checked
against `WORD_LISTS`) and says whether it is decodable; a contract checks
every one against the forty words typed out independently.

## Phase 4: how letters are written — the model

**Handwriting follows the ball-and-stick manuscript model** taught in many US
kindergartens: letters are built from straight sticks, slants and round
circles; every letter starts at the top; sticks are pulled down; bars slide
left to right; circles start near one o'clock and go counterclockwise
("start like c", so c, o, a, d, g and q all begin the same way). A capital I
carries its top and bottom bars, a little a and g are single-storey, and
little letters sit between the dashed midline and the baseline.

The shapes, stroke order and direction are **original to this app**,
written as vector strokes in `LETTER_FORMS` (index.html). They were not
traced or copied from any program's materials. Named programs (Zaner-Bloser,
Handwriting Without Tears, D'Nealian) each have their own conventions and
fonts; the app follows none of them by name and claims none. Every letter's
strokes are listed in [CONTENT-REVIEW.md](CONTENT-REVIEW.md) (section 21) for
an educator to confirm, because stroke-order conventions vary between
schools.

## Phase 4: the letters a child reads — the school print

The letters and words a child reads are **drawn from those same strokes**
(the "school print"), not typed in a font. So the "a" a child finds in
Letter Explorer is exactly the "a" they trace in Moon Writer.

Fonts evaluated first:

| Option | Assessment |
|---|---|
| The device's own font (SF Pro Rounded on iPad) | Rejected: a double-storey "a", a capital I that is one stick like a little l, and it differs by device |
| **Andika** (SIL, Open Font License 1.1) | A good literacy typeface: single-storey "a" and "g", clear I and l, free to redistribute. Not bundled, because handwriting needs its own stroke data anyway; drawing the reading letters from the same strokes guarantees reading and writing agree, adds no download and no licence to track, and works offline with nothing to cache |
| **Letters drawn from the writing strokes** | **Chosen.** Uniform round-ended strokes, like classroom print |

## Sources still to choose

- **Recordings** of every sound, word and line, by a person who can produce
  isolated sounds without an added schwa ([AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md)).
- **An educator's review** of everything in [CONTENT-REVIEW.md](CONTENT-REVIEW.md),
  including rhymes and syllable counts for regional pronunciation.
- **Later sight words**: the rest of the pre-primer list, then primer, once
  the first twelve are reviewed.

## Rules

1. Record the source of every new content set here before it ships.
2. Never write "research-backed", "standards aligned" or "curriculum aligned"
   in the app, the store listing or the docs without a mapping in this file.
3. Every authored item also goes into [CONTENT-REVIEW.md](CONTENT-REVIEW.md).
