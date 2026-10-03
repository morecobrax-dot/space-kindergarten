# Audio

How Space Kindergarten speaks, plays sounds a child learns from, and makes
its sound effects. The code is the `AUDIO` section of `index.html`.
[AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md) is the list of recordings a
voice actor will make; it is generated from the content. It lists every
sound and word said sound by sound, every authored line, and — since
Phase 5 — every family of lines built from a template (a letter's
questions and praise, each rhyme pair's, each word's beats, and so on),
each phrasing as written with every item it is said for, replays included.

**Since v0.7.1 one stretch of play has a recorded voice**: the first trip to
the Moon and its Letter Explorer mission, in an AI-generated voice ("The
voice pilot", below). Everywhere else Pip still uses the device's voice.

## One owner, one cue at a time

Everything the app says is a **cue**: an id, what may show on screen
(`text`), the spoken script (`speak`), a **type**, the locale (`en-US`), and
once one exists, a recording (`file`, from `VOICE_RECORDINGS`). `Voice` is
the only thing that plays cues. It plays one at a time, in order, and a new
line stops the one before. `speechSynthesis` appears nowhere else in the
code (a contract checks this).

Each cue is resolved in one place, `audioRoute()`:

1. **A recording**, if one is attached to the cue — for a line of the voice
   pilot, only inside the pilot (below).
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
| story | "We made it to Mars!" | 200 | 500 | — | yes | yes |
| instruction | "Listen." / how to play | 150 | 400 | — | yes | yes |
| question | "Which picture starts with…" | 150 | 0 | — | yes | yes |
| praise | "Yes! Moon!" | 100 | 350 | 1000 | **no** | yes |
| correction | "Almost! Listen again." / "Here it is!" | 100 | 350 | — | **no** | yes |
| hint | "Tap the sound scanner to start!" | 150 | 0 | — | yes | yes |
| reaction | "Blast off!" | 0 | 0 | — | yes | yes |
| word | "Moon." (a picture named) | 120 | 330 | — | yes | yes |
| letterName | "em" (the letter M's NAME) | 0 | 220 | — | yes | yes |
| **phoneme** | /m/ (the letter M's SOUND) | 200 | 400 | — | yes | **never** |
| **segmented** | "map", sound by sound: /m/ … /æ/ … /p/ | 200 | 450 | — | yes | **never** |
| **blended** | "map", blended slowly: "mmm-aaa-p" | 150 | 350 | — | **no** | **never** |
| sfx | sound effects: the `Sfx` family, not spoken | — | — | — | — | — |

Times are in milliseconds, at the calm pace (below). The pause between two
cues is the first cue's "after" plus the next one's "before". So the
teaching rhythm is:

> "Listen." · (0.6 s) · /m/ · (0.55 s) · "Which picture starts with…" ·
> (0.2 s) · /m/

It is never three lines fired back to back. A question never follows a
story line at once (at least 0.65 s), an instruction settles half a second
before the question, and no pause reaches 0.7 s, so there are no dead
spaces.

**Punctuation.** The device voice runs sentences together ("Yes! That's
the letter em."). A line of several sentences is said sentence by sentence
(`speechChunks()`). The pause after each depends on its punctuation: `!`
240 ms, `.` 260 ms, `?` 300 ms, `…` 420 ms.

## Pace (Phase 5)

Pip speaks at a **calm** pace by default, and a grown-up may choose **a
little quicker** (the grown-ups area, "Speaking pace"; saved with the other
sound settings on this device). The pace is `SPEECH_STYLE.paces`, read
through `speechPace()`:

| Pace | Device voice rate | Pauses (AUDIO_TYPES, punctuation) |
|---|---|---|
| Calm (the default) | 0.86 of the voice's own speed | as the tables above |
| A little quicker | 0.94 (close to the pace before Phase 5) | a quarter shorter |

The pace never touches the sounds a child learns from: a phoneme, a word
said sound by sound and a blended word keep their own timing, so they are
heard exactly. Around the lines, a round waits 0.36 s after praise before
the next question, a question is asked again only after **14 seconds** of
quiet (it was 10), twice at most, and the first moment of a mission (0.45 s)
takes no answer — a double tap on a marker once answered the first question
with its second tap.

**Honestly:** this makes the device voice easier to follow, not more
natural. It is still the device's built-in speech voice — the best one
installed (a Premium voice, then an Enhanced one, then any US English
voice; a tie is settled by name, so the order a device lists its voices in
never decides). Outside the voice pilot (below), Pip's voice naturalness is
still limited. The recording list is complete enough to hand to a voice
actor; recordings, not a slower synthesizer, are the way to a warm Pip.

**Delayed visuals.** In Sound Scout the pictures appear only as Pip names
them, so the sound is heard before there is anything to look at. In Word
Builder each slot lights as its sound plays, and the word's picture appears
only once it is built.

## The voice pilot (v0.7.1)

Pip's first recorded voice, for one stretch of play: **the first trip to the
Moon** — Launch, the landing, "Tap the beacon to start!", the whole first
Letter Explorer mission (M, S, O and T), its celebration and the way home —
and that mission whenever it is played again, from its lit beacon or from
the grown-ups area. Everywhere else, Pip still uses the device's voice.

**What it is.** 40 lines (`VOICE_PILOT.lines`), generated with the
Speechify AI Voice API from a stock adult US English voice ("Harper",
`harper_32`, model `simba-3.2`), 20% slower than its own pace and in its
"warm" style. **It is AI-generated, not a human voice.** The service's
terms ask that every use says so: each MP3 carries "AI-generated voice, not
a human voice. Voices powered by Speechify." in its tags, and the grown-ups
area says so beside the pilot. How the clips are made:
[tools/voice/README.md](../tools/voice/README.md); every take:
`tools/voice/takes.json`; every measurement: `tools/voice/check.json`.

**One voice per exchange.** A pilot recording plays only inside the pilot
(`voicePilot.on`: set by the Launch that brings the pilot's mission and by
starting that mission, ended by the flight home or by any other mission).
Outside it, the same line is the device voice. Inside it, every line that
stretch of play can say is recorded — "Go back to Earth?", the prompt to
turn the phone, the nudge and the help included — so Pip never changes
voice in the middle of an exchange. A family of lines rotates through its
recorded phrasings only (`pilotTakes()`): the questions alternate "Find the
letter em." and "Where is the letter em?", praise alternates its two
recorded phrasings and is never the same twice in a row, and the nudge
repeats its one.

**Letter names** are said inside their sentences, as the script writes
them. The one exception is the letter O: sent to the service as "oh", it
was read as the exclamation, and the recogniser found no letter in three of
six lines; sent as "O", all six were heard as O. Letter **sounds**, words
said sound by sound and blended words are not part of the pilot: they stay
separate assets, made by the development phonics voice, never by this one.

**Pace.** The clips are made slower than the voice's own pace: about 2.9
words a second in a story line, before the app's own pauses. A clip always
plays at the speed it was made; "A little quicker" shortens only the pauses
between lines, so the voice itself is never sped up or stretched.

**Offline and reliable.** The clips install with the app: 40 files, 126 s,
752 KB at 48 kbps, measured apart from the pictures, whose budgets they do
not touch (contract 63 holds them under 800 KB). The service worker answers
a clip from this version's cache first, so a lesson never waits on the
network, and in the byte ranges an audio element asks for: Safari will not
play a whole-file answer to a range request. One media element plays one
clip at a time; a new line stops the last, and every play is settled however
it ends. A clip that cannot play is said by the device voice instead, and a
clip that never reports its end is waited for its own length, then Pip
moves on.

**What was checked, and what was not.** Every clip was measured (length,
lead-in and tail, speaking level, peak, pace), and each letter line was put
three times to Windows' offline speech recogniser, which had to choose
between M, S, O and T in the same sentence: 20 of 24 were heard as intended
every time, 21 at least once, and none was ever heard as another letter.
The other three are sentences the recogniser could not match with either
spelling of the letter, while the same letter passed in five other lines.
**No person has listened to the clips here**: whether Pip now sounds warm,
clear and comfortably paced is for the first listen on an iPhone.

**To hear it:** the grown-ups area, "Pip's voice (pilot)". "Hear a sample"
plays three lines; "Play the pilot trip" flies to the Moon, where the beacon
starts Letter Explorer in the recorded voice.

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

## Phase 4: little letters, sight words and writing

Phase 4 added three kinds of lines, all through the same typed cues, the
same `Voice` and the same `audioRoute()`. **It added no phonics and no
recording to the required list**: a phoneme is still never given to the
device voice, and [AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md) is unchanged
in what it asks for.

| Family | Cue ids (`voiceCue()`) | Type | Who says it until recorded |
|---|---|---|---|
| Big and little letters (`letterCaseCue()`) | `little.M.k`, `pair.M.lower.k` and their again, found and show lines | question, praise, correction | the device voice: letter NAMES only ("the little letter em") |
| Sight words (`sightCue()`) | `sight.ask.the.k` (the question, ending "…"), then `sight.word.the` (the word alone); found, show, match lines | question, then **word**; praise, correction | the device voice: an ordinary word, as for a picture's name. `sight.word.*` has no caption text, so a question's caption never shows the word being asked |
| Writing (`writeCue()`) | `write.watch.L.upper.k`, `write.trace…`, `write.light…`, `write.done…`, `write.again.n`, `write.start`, `write.retry.k`, `write.watchAgain` | instruction, question, praise, hint, correction | the device voice. The letter is on the slate, so its name may be shown and said |

**What is and is not development audio here.** None of these lines is a
phonics sound, so none uses the development phonics voice. They are the
device voice, the same temporary stand-in as every other line, and each has
a script in `VOICE_CUES` or a line template ready for a voice actor. A sight
word said by the device voice must be checked on the target iPad voice: "to"
must not be heard as a number, and "see" is a word, not a letter C. The
screen only ever shows the one spelling being asked.

**Rounds that count with the sound off.** A pair of cases, Word Orbit and
Moon Writer are seen, not heard (`silentOk`), so they count as evidence
with the voice off; Letter Explorer's little letters and Star Words are
asked by sound, and like every heard question they fall back to a visual
caption and are not counted when nothing can be heard.

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

It is **deterministic** (the same cue gives the same samples every time).
A word takes about 15–50 ms to make on a desktop computer (not yet timed
on an iPad), once: after that it is cached. It needs no files and no network: it
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

**Recordings on an iPad** play through one media element that the first
tap wakes (`MediaVoice`). iOS lets a woken element play later without
another tap, where a new element each time would be refused. Since v0.7.1
it plays the voice pilot's clips: tested with a stand-in element in the
contracts and with a real one in Chromium (online, offline from the cache,
backgrounded, tapped fast), but **not yet on an iPhone or iPad**. The
element is only woken once a recording exists, because a woken element can
show iOS's "now playing" controls, and the silence that wakes it is never
allowed to pause the line the same tap starts.

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
