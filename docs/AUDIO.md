# Audio

How Space Kindergarten speaks, plays sounds a child learns from, and makes
its sound effects. The code is the `AUDIO` section of `index.html`.
[AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md) is the list of recordings a
voice actor will make; it is generated from the content.

## One owner, one cue at a time

Everything the app says is a **cue**: an id, what may show on screen
(`text`), the spoken script (`speak`), a **type**, the locale (`en-US`), and
once one exists, a recording (`file`, from `VOICE_RECORDINGS`). `Voice` is
the only thing that plays cues. It plays one at a time, in order, and a new
line stops the one before. `speechSynthesis` appears nowhere else in the
code (a contract checks this).

Each cue is resolved in one place, `audioRoute()`:

1. **A recording**, if one is attached to the cue.
2. **A sound a child learns from** (a letter's sound, a word said sound by
   sound, a word blended) plays in the **development phonics voice**. It is
   **never** given to the device voice.
   **Every other cue** uses the device's speech voice, a temporary stand-in
   labelled as such in the grown-ups area.
3. **Nothing audible:** the caption stays up long enough to be read. For a
   sound game this is the only case in which the letter is shown, and the
   answer is then not counted as practice.

A recording that fails to play falls back down the same list. For a
phonics cue that means the development voice, never the device voice.

## Cue types

`AUDIO_TYPES` says how each kind of cue sits in time and who may say it.

| Type | Example | Before | After | Minimum hold | A tap may cut it | Device voice |
|---|---|---|---|---|---|---|
| story | "We made it to Mars!" | 150 | 450 | — | yes | yes |
| instruction | "Listen." / how to play | 100 | 250 | — | yes | yes |
| question | "Which picture starts with…" | 100 | 0 | — | yes | yes |
| praise | "Yes! Moon!" | 0 | 250 | 950 | **no** | yes |
| correction | "Almost! Listen again." / "Here it is!" | 0 | 200 | — | **no** | yes |
| hint | "Tap the sound scanner to start!" | 100 | 0 | — | yes | yes |
| reaction | "Blast off!" | 0 | 0 | — | yes | yes |
| word | "Moon." (a picture named) | 80 | 220 | — | yes | yes |
| letterName | "em" (the letter M's NAME) | 0 | 150 | — | yes | yes |
| **phoneme** | /m/ (the letter M's SOUND) | 150 | 300 | — | yes | **never** |
| **segmented** | "map", sound by sound: /m/ … /æ/ … /p/ | 150 | 350 | — | yes | **never** |
| **blended** | "map", blended slowly: "mmm-aaa-p" | 100 | 250 | — | **no** | **never** |
| sfx | sound effects: the `Sfx` family, not spoken | — | — | — | — | — |

Times are in milliseconds. The pause between two cues is the first cue's
"after" plus the next one's "before". So the teaching rhythm is:

> "Listen." · (0.4 s) · /m/ · (0.4 s) · "Which picture starts with…" ·
> (0.15 s) · /m/

It is never three lines fired back to back. A question never follows a
story line at once (at least 0.55 s), and no pause is longer than 0.6 s, so
there are no dead spaces.

**Punctuation.** The device voice runs sentences together ("Yes! That's
the letter em."). A line of several sentences is said sentence by sentence
(`speechChunks()`). The pause after each depends on its punctuation: `!`
180 ms, `.` 200 ms, `?` 260 ms, `…` 380 ms.

**Delayed visuals.** In Sound Scout the pictures appear only as Pip names
them, so the sound is heard before there is anything to look at. In Word
Builder each slot lights as its sound plays, and the word's picture appears
only once it is built.

## Letter name and letter sound

These are different educational assets, and the data keeps them apart:

| | Name | Sound |
|---|---|---|
| In the data | `LETTERS.M.speak` = "em" | `LETTERS.M.sound` = `m`, a `PHONEMES` id |
| Cue | `letter.M` (type letterName) | `phoneme.m` (type phoneme) |
| Who may say it | the device voice, until recorded | a recording, or the development voice |
| Used by | Letter Explorer ("Find the letter em.") | Sound Scout, and Word Builder's letters |

Word Builder never says a letter's name when a letter is tapped. It plays
the letter's sound.

## Phonics safety

- The device voice is never the authority for a sound. It says /m/ as
  "muh" and cannot hold /s/.
- Beginning sounds start with sounds that can be held (/m/ /s/ /f/ /n/ /r/).
  A stop said on its own (/p/ /t/ /k/) is one short puff with no vowel
  after it. Stops come later, and first only inside words.
- /m/ and /n/ said alone are hard to tell apart even for adults. They are
  never the target and a wrong choice in the same round.
- Blending is taught as sounds, never letter names: /m/ /æ/ /p/ → "map",
  not "em, ay, pee".

## The development phonics voice (DEVELOPMENT AUDIO)

Until a person records them, every sound, word said sound by sound, and
blended word is made on the device by a small formant synthesiser. It
follows Klatt (1980) and is written for this app.

- A buzz for the voice and breath for /h/ go through five resonances of the
  mouth. The buzz is one Rosenberg glottal pulse per period, a little uneven
  like a real voice.
- A nasal pole and zero make /m/ and /n/ a hum with the mouth closed.
- A hiss with its own resonances makes /s/ and /f/.
- Vowel resonances are from Peterson & Barney (1952), women's voices.

It is **deterministic** (the same cue gives the same samples every time)
and takes a few milliseconds per word. It needs no files and no network: it
plays through the Web Audio output that the first tap wakes (`AudioOut`),
the same one the sound effects use. A contract measures what it makes:

- /s/ has nearly all its energy above 3 kHz.
- /m/ has almost none above 1 kHz.
- A held sound lasts about half a second, and a stop lasts under 0.15 s.
- A segmented word has a pause between its sounds.
- A blended word has no gap between its sounds.

It is **development audio**. It is labelled that way in the code, in the
grown-ups area and here, and **it is not production-ready**. It sounds
synthetic, its voice is not the device voice that says everything else, and
nobody has yet judged it on an iPad. Each cue is replaced by its recording
the moment one is attached in `VOICE_RECORDINGS`. No code changes; every
recording needed is listed in [AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md).

**Silent Mode (to check on the iPad).** iOS mutes Web Audio in Silent
Mode, and the development voice and the sound effects both play through
it. The device voice may keep speaking, which would leave a silent gap
where each sound should be. If the iPad shows this, one line fixes it on
iOS 17 and later: `navigator.audioSession.type = 'playback'`. It also
pauses another app's music while the game plays, so it is a choice to
make, not a default to slip in.

**Recordings on an iPad** will play through one media element that the
first tap wakes (`MediaVoice`). iOS lets a woken element play later without
another tap, where a new element each time would be refused. That path is
built and tested with a stand-in element, but **not on a device**: no
recordings exist yet. Verify it with the first recordings. The element is
only woken once a recording exists, because a woken element can show iOS's
"now playing" controls.

## Pip's voice

Pip is **warm, curious, encouraging, clear, playful and calm**. Pip is a
friend exploring alongside the child, not a teacher at the front of a room
and not a cheerleader.

- **Speak only when it helps.** An instruction is given once. After that,
  Pip waits to be needed: a hint comes only when a child seems stuck, at
  most once a visit. A moment with nothing new to say gets no line.
- **Never narrate the obvious.** Pip does not announce taps, transitions or
  what the child can plainly see. Naming a picture, a tab or a planet is
  not narration: a pre-reader cannot read the label.
- **Short and clear.** One idea a line, a few words on screen, US English.
  "Find the letter em.", not "Can you please look for the letter that is
  called em?"
- **Warm, not hyperactive.** Praise names what was done ("Moon!",
  "Cake and snake. You found the rhyme!"), and rotates so it is never the
  same twice in a row. No shrieking, no "AMAZING!!!", no babyish words, no
  sarcasm, never disappointment.
- **Calm about mistakes.** "Almost! Listen again." A wrong answer is
  never a failure. After a second miss Pip shows the answer and the child
  finishes it.
- **Curious about the world.** The story is told in small moments: "Its
  sound scanner is quiet. Let's help it hear again!" Pip never lectures.

## Sound design

One small family, made by the Web Audio API, with no files to license:

- **One scale.** Every note is from F major pentatonic, with low rumbles
  and thuds beneath it.
- **Soft and round.** Sine and triangle waves only, a soft start and a
  quick fade.
- **Short.** Nothing lasts much over a second.
- **Distinct.** Each moment has its own shape.

| Moment | Sound |
|---|---|
| Rocket ignition | a low rumble that rises, with a swelling tone beneath it |
| Travel | air rushing past as space opens (at the start of the cruise) |
| Touchdown | a soft thud and a puff of dust |
| Correct | two rising notes |
| Gentle correction | one soft falling note: no buzzer |
| Star collected | a single soft "tink" per star, not a jackpot run |
| Planet restored | a warm rising chord |
| Space station | an airlock hiss, then two notes |
| Unlock / equip | three quick rising notes / a soft pop |
| Word Builder | a wooden "tock" as a letter lands, the reverse as it lifts, a soft chord as the word is built |

There is **no music** and no ambient loop. The effects switch in the
grown-ups area silences all of it, and a contract checks the scale, the
waveforms and the lengths.
