# Learning design

How the learning works, and the decisions behind it. For where the content
came from and what still needs expert review, see
[CONTENT-SOURCES.md](CONTENT-SOURCES.md) and
[CONTENT-REVIEW.md](CONTENT-REVIEW.md). **Nothing here claims to be
research-backed or aligned with a standard or curriculum.** The content is
development content, written for this project (the twelve sight words are
taken from one published list, as a source) and awaiting review.

## Principles every activity follows

- **One clear task at a time,** spoken aloud, with a **Repeat** button
  always visible.
- **Almost no reading.** On-screen text is a few words and never necessary.
  Each game shows its name and what to do (LETTER EXPLORER / Find the
  letter you hear), and each planet what it teaches (MERCURY / Rhymes •
  Beats, in the game's own word; the grown-ups area names the skill,
  Counting syllables): for grown-ups and early readers. Pip says everything a
  pre-reader needs, and nothing on screen gives an answer away.
- **Big, forgiving targets.** Choice tiles are 130–236px on an iPad (they
  shrink to fit a phone rather than slip off it), and every child control
  is at least a 76px target, whatever the size of its mark. The writing
  slate is the largest thing on its screen.
- **One school print.** Every letter a child reads is drawn from the same
  strokes a child learns to write (see "The school print" below), so the
  "a" found on the Moon is the "a" traced on the slate.
- **An answer being praised owns the screen.** Taps during praise wait; a
  tap during the explanation means "go on" and skips to the question; a
  second tap straight after a wrong answer is the same finger bouncing, not
  a second try (a 0.45s hold). Found on a real iPad: fast taps during
  feedback cut the praise off.
- **Immediate, calm feedback.** There is no "wrong!", no buzzer, no red, no
  lost lives and no lost stars. There is no countdown.
- **Short.** A mission is five or six rounds, which takes about 1–2 minutes
  with the device voice.
- **A stop point after every mission.** The child is back in the world: what
  they fixed lights up, the stars land in the count, and there is one thing
  to do next — the next marker, or the yellow way home.

## Two layers: story and learning

The **story layer** is the solar system: Earth, then the Moon, Mercury, Mars
and Jupiter, then planets later. It is a story map, not a curriculum: Jupiter
comes after Mars because it is the next adventure outward, and Venus is not
built yet. The **learning layer** is the skills. They cooperate but are not
the same thing:

- A destination has a `primarySkill` and `reviewSkills`.
- A **mission** names its own `skillId`.
- Resequencing the curriculum never means moving a planet, and a planet never
  locks a skill behind it.

Handwriting in particular does not wait for a planet of its own. It is the
**Moon's writing slate** (Moon Writer): the first world a child reaches, so
writing starts beside the letters it writes, and the slate can come back on
other worlds later. A planet is never created only to hold a skill.

### Missions happen in the world

The world is the navigation. Launch flies to a place; the place has
**markers** standing on its ground — the Moon's beacon and writing slate,
Mercury's radar dish and meteor rocks, Mars's sound scanner and word
machine, Jupiter's sky sign and orbit ring. Each marker is one
game, and its missions come there one after another, with a small lamp under
it for each one played.

1. **Arrive.** Pip tells the place's story and points at the marker to tap.
2. **One mission at a time.** Only the next marker pulses; tapping another
   one is answered by pointing at the one that is ready.
3. **Play** the mission, standing on the world: the learning layer is drawn
   over the planet's horizon, and the markers step back while it plays.
4. **The world answers.** The marker lights up in front of the child, a
   restored place brightens, three stars arc to the count, and Pip cheers.
5. **What is next is shown:** the next marker pulses, or — when the place is
   restored — the next route appears in its sky and the way home turns
   yellow.

A place is **restored** by its story missions (the Moon by `moon-1`, Mercury
by its first Rhyme Radar and Syllable Meteors, Mars by its first Sound Scout
and Word Builder, Jupiter by its first Star Words and Word Orbit). Missions
added to a place later are more to play there, never a new lock: a child who
restored the Moon before it had a writing slate still has it restored. Until
a place is restored, its story missions follow one another in the same
visit. **The visit that restores a place also offers the first mission of
any game there not yet played**, so every game is met: a new child relights
the Moon with Letter Explorer and is pointed straight at the writing slate.
Once it is restored, it offers one mission a visit: any not yet played
first, then each in turn. After that the way forward is home, and Earth
points to the first open place with something new.

### The route (a plan, apart from what is built)

| Destination | Primary skill | State |
|---|---|---|
| Moon | Letter recognition, and handwriting | **Built:** `moon-1` to `moon-3` Letter Explorer (big letters), `moon-4` (little letters) and `moon-5` (big and little partners); `writer-1` to `writer-3` Moon Writer |
| Mercury | Rhyming, then counting syllables | **Built:** `mercury-1` and `mercury-3` Rhyme Radar, `mercury-2` and `mercury-4` Syllable Meteors. Opens when the Moon shines |
| Mars | Beginning sounds, then CVC words | **Built:** `mars-1` and `mars-3` Sound Scout, `mars-2` and `mars-4` Word Builder. Opens when Mercury's signal is clear |
| Jupiter | Sight words | **Built:** `jupiter-1` and `jupiter-3` Star Words, `jupiter-2` and `jupiter-4` Word Orbit. Opens when Mars is full of sounds again |
| Venus | More CVC words (short i, o, e) | planned |
| Saturn | Consonant blends, then digraphs (sh, ch, th) | planned |
| Uranus | More sight words (the rest of the pre-primer list, then primer) | planned |
| Neptune | Mixed review, with more letters to write | planned |

Twenty missions in all: 8 on the Moon, 4 on each other world. All seven
learning areas now have a first game; depth (more words, blends, the rest of
the alphabet to write) comes after review.

The planned destinations are declared in `DESTINATIONS` as `kind: 'planned'`
so no mission can be filed under a place nobody planned. They have no
pictures and no missions, nothing draws them, and a contract holds them to
that: a declared plan, not content pretending to exist.

## Sound Scout: `sound-pick` (Mars)

**Objective:** hear the first sound of a spoken word: phonemic awareness,
the step between knowing letters and reading words.

A round is heard before it is seen. Pip says "Listen.", plays the sound (a
PHONEME cue: /m/ held, never "muh"), asks "Which picture starts with…", and
plays the sound again. Then three pictures rise onto low Mars rocks as Pip
names each one, so a child who does not know a picture's name still can.
The child taps the picture that starts with the sound.

- **The sound is the question.** The screen never shows the letter as the
  clue. Once the picture is found, the letter that spells the sound appears
  on the scanner ("M"), after "mmm … Moon!". It is a bridge from sounds to
  letters, never the thing asked.
- **Sounds that can be held come first:** /m/ /s/ /f/ (the first mission),
  then /n/ /r/. A stop said on its own is where a stray "uh" creeps in, so
  stops wait.
- **Every answer starts with the sound on its own**, never a cluster: "sun",
  not "star".
- **Wrong pictures** never start with the sound. At level 1 they start with
  a sound of another kind altogether (a hum, a hiss, a glide, a stop or a
  vowel); /m/ and /n/ are never set against each other. At level 2, one
  wrong picture rhymes with the answer (moon: spoon): hearing past "sounds
  the same at the end" is the skill.
- **Help:** a wrong picture steps aside, and Pip says "almost", the sound
  again and the pictures left. After a second miss: "Here it is! Moon
  starts with…" /m/ "Tap the moon!".
- **Evidence** is kept per sound (/m/), not per word.

## Word Builder: `word-build` (Mars)

**Objective:** segmenting and blending a CVC word, and matching each sound to
its letter: SOUND → SOUND → SOUND → WORD, never spelling from memory.

Pip says "Listen." and the word sound by sound (/m/ … /æ/ … /p/), each slot
lighting as its sound plays, then "Build the word!". The child taps the
letters (uppercase, clean tiles) into three slots in order:

- **Tap to place, never drag:** a tapped letter hops into the next empty
  slot. Fine motor precision is not the skill.
- **A letter tapped plays its SOUND, never its name**, so a child who does
  not yet know letter sounds can find out by trying.
- **Undo:** a letter in a slot tapped again hops back.
- **When the word is full it is checked**, as the order of its letters.
  Right: the letters slide together as Pip blends the word slowly
  ("mmm-aaa-p"), then says it ("Map! You built it!"), and its picture
  appears. The word is taught as sounds, never as letter names ("em, ay,
  pee").
- **Wrong order:** only the letters in the wrong places hop back, then
  "almost" and the word sound by sound again. After a second miss, Pip
  builds it with the child, a sound at a time, then hands it back, and only
  the next right letter can go in.
- **Level 1** offers exactly the word's three letters, never already in
  order. **Level 2** adds one letter whose sound is nowhere in the word and
  which is not a lookalike of its letters.
- The first mission builds short-a words (map, fan, hat, cat, cap, pan), and
  the second short-u words (sun, cup, nut, bus, bug). Short i, o and e wait
  for words that picture well.
- **Evidence** is kept per word built.

## Review, by rule

A few rounds are **review rounds**: each lists what it may ask. When it
begins, it asks what the child most needs to see again:

1. the candidate whose recent answers (the last 8) needed help most often;
2. if there is a tie, the one practised longest ago;
3. with nothing shown yet, the first one listed;
4. never something already asked in the same mission, and never at random.

Evidence counts across games where the skills meet:

| Needed help with | Comes back in |
|---|---|
| a letter, big or little, in Letter Explorer | Sound Scout's review asks its sound: M was hard → /m/ comes back, with a picture that starts with it |
| a little letter (m), finding it or matching it to its partner | the little-letter review at the end of `moon-5` |
| a sound (/m/) in Sound Scout | Word Builder's review picks a word that starts with it |
| a sight word, heard (Star Words) or matched (Word Orbit) | the reviews in `jupiter-3` and `jupiter-4` |
| a letter traced with help | the review at the end of `writer-2`, with less help |

`moon-3` ends with two letter reviews, `moon-5` with one, `mars-3` with two
sound reviews, `mars-4` with one word review, `jupiter-3` with two word
reviews, `jupiter-4` with one, and `writer-2` with one letter to trace. The
same evidence always picks the same thing, and a grown-up could follow the
rule on paper.

## Replays, by rule (Phase 5)

A mission played again used to ask its written rounds word for word; only
the answers' places moved. Now:

1. **The first play is always the mission as written**: its introductions
   and its teaching order, which a grown-up can read in the content.
2. **Once it has been finished, a replay keeps its shape**: as many rounds,
   the guided round where it was, each review round with its rule, the same
   case (big or little) and, for a pair, the same direction. Only the item
   changes, drawn from the mission's own list (`replay` in `MISSIONS`):
   a letter the mission teaches, another rhyme, a word with as many beats,
   another picture that starts with the same sound, a word with the same
   vowel and the same kind of first sound (Word Builder's level).
3. **A replay teaches nothing new.** A mission's list holds its own items and
   more of the same kind, never a letter or a sound it does not teach. A
   Word Builder word may use only the sounds its mission already asks for:
   "bat" waits for a short-a mission that asks for /b/. The content check
   refuses a list that breaks this, and the sounds taught are still derived
   from the missions as written.
4. **Chosen by a seed, so it can be followed.** Which item is the run's
   seeded choice: the same seed, content and history always give the same
   sequence. Within a run an item comes back only when every other item
   that fits its round has been asked as often. What the mission asked last
   time (its completion keeps a short `shown` list) comes after what it did
   not, and a replay never starts with the question the last one started
   with. A small list repeats honestly; nothing is invented.
5. **Review still decides what needs practice.** A replay's review rounds
   ask what the evidence says, exactly as before; the seed only chooses
   among suitable pictures for a review of a sound.
6. **Moon Writer is never shuffled**: its letters come in stroke order.

On a planet, once the visit's mission is played, **a lit marker plays its
game again** — its finished missions in turn — and says so ("Let's play it
again!"). Nothing pulses and the yellow way home stays the next thing to
do; a game not yet played waits for a visit of its own. A replay pays the
same 3 stars.

## The school print

The letters a child reads are **drawn, not typed**. Each letter is a list of
vector strokes (`LETTER_FORMS`: sticks, slants, circles and dots, in the
order and direction they are written), and the same strokes are drawn for
reading, animated when Pip writes, and followed when the child traces. It is
ball-and-stick manuscript: a single-storey a and g, a capital I with its bars
(so it is never a stick like l), little letters between the dashed middle
line and the baseline, tails below it. Letters sit on one shared baseline in
a round, so a tall b and a short o are compared as they appear on a page.
The device's own font was rejected (a double-storey a, an I that looks like
l, different on every device); a bundled font was not needed once the
strokes existed. Every letter's strokes are listed for review in
[CONTENT-REVIEW.md](CONTENT-REVIEW.md#21-how-each-letter-is-written-stroke-order-and-direction).

## Letter Explorer: `find-letter` (the Moon)

**Objective:** recognise a letter from its **spoken name** — first the big
(uppercase) letters, then the little (lowercase) ones, then which big and
little letters go together.

The letters stand on **Moon stones**: clay stones on the Moon's ground, each
with a clean plate on its face. The letter is always on the plate, never on
the clay, and the plate is as plain as a tile (7:1 contrast or better).

**How a round goes:**

1. Pip says *"Find the letter em."* The bubble reads **"Find the letter!"**
   and never shows the letter, because showing "Find M" beside a tile that
   says M would turn hearing a name into matching two shapes. Later rounds
   ask in other words (*"Where is the letter em?"*), but always name "the
   letter".
2. Three stones show three uppercase letters. The child taps one.
3. **Correct:** the plate gains a green ring and a check mark, and Pip
   praises and names it: *"Yes! That's the letter em."*, *"Great job! You
   found the letter em."* Confirming the name reinforces the connection
   being taught.
4. **First wrong tap:** that stone wiggles and steps aside (dimmed and
   smaller), and Pip says *"Almost! Listen again. Find the letter em."* The
   question comes back in its plainest words.
5. **Second wrong tap:** that stone steps aside too, and the answer glows:
   *"Here it is! This is the letter em. Tap it!"* The only stone left is the
   answer, so **every round can be finished**.
6. If nothing is tapped for 14 seconds, Pip nudges (*"Listen. Find the
   letter em."*), then once more (*"Take your time…"*), then waits. This
   never counts against the child. The Repeat button says the question
   again in the same words. A question cut off from outside — the screen
   turned, or the app left and come back to — is asked again.

**The guided first round.** The first round of every mission teaches the tap
itself: after the question, a ring pulses around the answer. It is not
recorded as evidence of anything.

**When nothing can be heard** (voice off, or no speech engine), the question
caption falls back to showing the letter ("Find M"), which turns the round
into visual matching. Those rounds are **not recorded as recognition
evidence**, and the grown-ups area explains why.

**Little letters (`moon-4`).** The same game with little letters: *"Find
the little letter em."* To a child they are "big" and "little" letters;
"uppercase" and "lowercase" are grown-up words. First the little letters
shaped like their big ones (o, s, c), then ones that are not (m, a, t).

**Big and little partners (`moon-5`).** One case is shown on a round
plate: *"This is the big letter en. Find the little letter en!"* The child
finds its partner among three. Big to little first, then little to big. It
is **seen, not heard** — matching the two shapes is the skill — so a pair
counts as evidence even with the voice off. The last round is a review of
the little letters.

Evidence is kept per letter **and case**: M (big), m (little) and M–m (the
pair) are three records, so a child who knows M and not m is seen as exactly
that. In the grown-ups area they count as one letter practiced.

## Moon Writer: `letter-trace` (the Moon's writing slate)

**Objective:** learn **how a letter is formed** — where it starts, which way
each stroke goes, and in what order. Not handwriting quality: nothing is
scored, recognised or graded.

For each letter:

1. **Watch.** Pip writes the letter on the slate: each stroke drawn along
   its path in order, a pen moving with it (*"Watch. This is how we write the
   big letter el."*). With Reduce Motion, each stroke appears whole, in order.
2. **Trace, with the path shown.** A wide lane for every stroke, the one to
   trace brighter with a dashed middle and an arrow, and a green dot where it
   starts (*"Now you! Trace the big letter el."*). This round teaches and is
   not recorded.
3. **Trace again, with less help.** A faint outline and only the green dot
   (*"Now write it again, with less help!"*). This one is recorded.
4. **Celebrate:** *"Nice tracing! The big letter el!"*, and on to the next
   letter.

**How a trace is checked — geometry, no AI.** Each stroke is a path of
points a small step apart. A stroke begins only when the finger goes down
near its green dot. As the finger moves, the trace advances to the nearest
point of the path a little way ahead, if the finger is within the lane; so
progress is along the path, in its direction — going backwards, cutting
across or starting at the end makes none. A stroke is done when the finger
reaches its end, then the next stroke's dot appears; the letter is done when
the last stroke is. It is judged the same way every time, and a grown-up
could follow it.

**Forgiving, never wrong.**

- A finger a little off the path is neither counted nor punished.
- Straying **well** off the path for a while starts **that stroke only**
  again: its ink goes, its green dot pulses, and Pip says *"Let's try that
  line again."* The strokes already done stay done. Twice astray on one
  stroke, Pip writes that stroke again.
- A lifted finger carries on from where it stopped: the green dot moves
  there. Going back to the stroke's start begins it again.
- Going down somewhere else just pulses the dot (*"Start at the green
  dot."*, not more than once every few seconds).
- **Watch again** (the eye) and **start again** (the circular arrow) are
  always beside the slate. Watching again, or a stroke started again,
  counts as help — the letter is recorded as traced with help — and never
  costs anything.
- Every letter can be finished: there is no "wrong", no percentage and no
  time limit.

**Touch.** Pointer Events, so a finger and the Apple Pencil work the same
(a Pencil is never required). One pointer draws at a time: a second finger
is ignored, and a Pencil coming down while a touch is drawing takes over,
since that touch is most likely a resting palm. A cancelled touch (a system
gesture) just lifts. The page never scrolls or selects under the slate, and
everything outside it behaves normally.

**The letters.** `writer-1`: L, T, H (straight lines). `writer-2`: O, C
(round, "start like c"), then a review of the straight-line letters with
less help. `writer-3`: little c, a, d (little letters that start like c).
Every letter's strokes exist, for reading, and more wait to be written.
**Evidence** is per letter and case: "Traced 3 times · traced without help
2 times".

## Star Words: `sight-find` (Jupiter)

**Objective:** recognise a common word **by sight** when it is heard — words
children meet everywhere and often cannot yet sound out ("the", "you").

Jupiter's sky signs have lost their words. Three word satellites float over
the clouds, each showing a word in the school print. Pip says *"Find the
word…"* and then the word itself. The question's caption is **"Find the
word!"** — the word is never on screen as the clue. The child taps the
satellite that says it.

- **Correct:** the satellite glows, and Pip says the word again (*"the! You
  found it!"*).
- **Help:** the same ladder as every game: a wrong word steps aside, *"Listen
  again."*, the word again; after a second miss, *"Here it is! This word
  is…"* the word, *"Tap it!"*.
- **Wrong words** are chosen from the same twelve by a written-down likeness
  score (same first letter, same length, same last letter, letters shared).
  The easy level never shows a look-alike; the harder level puts one in
  (*is* beside *it*). Never two of the same word in a round.
- **The word is an ordinary word**, so the device voice may say it (a
  recording later). No sound of a letter is ever given to the device voice.

## Word Orbit: `sight-match` (Jupiter)

**Objective:** see a word as **its letters in order** — the same word, not
one that only looks like it.

A word satellite waits at the centre; three wait on a ring below. *"Find the
same word!"* The child taps the one just like it; *"They match! the!"* It is
seen, not heard, so it counts with the voice off too. At the harder level a
look-alike stands on the ring (*in* beside *is* and *it*).

**Evidence** for sight words is kept per word and game — heard (Star Words)
and matched (Word Orbit) — and a word needing help in either comes back in
the reviews.

**The list.** Twelve words of the Dolch pre-primer list, chosen and
documented in [CONTENT-SOURCES.md](CONTENT-SOURCES.md), met in this order:
the, and, see, you; to, go, is, it; in, can, we, my. The product never claims
to be "Dolch aligned".

## Rhyme Radar: `rhyme-pick` (Mercury)

**Objective:** hear which of three words rhymes with a word — the same
sound at the end — from **pictures and the spoken words**, without reading.

Mercury's signal is fuzzy; the radar dish hears one word. That word's
picture is shown in the radar's round window, and three pictures stand on
the ground below it.

1. Pip says the word as a name (*"Cake."*), then the question (*"What rhymes
   with cake?"*), then **names each picture as it lights up** (*"Snake."
   "Sock." "Moon."*). A child who cannot read cannot rhyme with a picture
   nobody has named, and a picture can be called more than one thing.
2. The child taps a picture.
3. **Correct:** the card gains the green ring and check, and Pip says both
   words, so the rhyme is the last thing heard: *"Yes! cake, snake. They
   rhyme!"*
4. **First wrong tap:** the card steps aside; *"Almost! Listen again. What
   rhymes with cake?"*, and the pictures left are named again.
5. **Second wrong tap:** *"Here it is! cake, snake. Tap the snake!"*, with
   the answer ringed. Every round can be finished.

**Difficulty.** The wrong pictures are chosen by the engine from the word
list. A wrong picture **never** rhymes with the word heard. At the easier
level the wrong pictures also start with different sounds; at the harder
level one of them starts with the **same** sound as the word heard (cake:
car), because "starts the same" is the classic mix-up with "rhymes", and
hearing past it is the skill. The level comes from the same rule as letters:
three first-try answers up, any help down, recomputed from stored answers.

## Syllable Meteors: `syllable-tap` (Mercury)

**Objective:** hear the beats (syllables) in a spoken word, and show how
many there are by tapping once for each.

1. Pip says the word (*"Banana."*) and asks for its beats (*"Tap the stone
   once for each beat!"*). The word's picture is shown; the count never is.
2. The child taps the big meteor stone. **Each tap lights a meteor**, so the
   child sees the count they are making.
3. **A pause ends the count** (1.5 seconds without a tap). **Only the count
   is judged** — never the rhythm, never the speed. Two taps closer than
   0.09 s are one finger bouncing, and count once.
4. **Correct:** the meteors glow, and Pip says the count in words: *"Yes!
   banana has three beats!"*
5. **First wrong count:** the meteors clear, *"Almost! Listen again."*, and
   the word and question again. A count is not a tile: the child may tap the
   same wrong count again, and it is simply another try.
6. **Second wrong count:** Pip **shows the beats**: *"Let's tap it together.
   Listen!"*, each beat said on its own as a meteor lights (*"ba!" "na!"
   "na!"*), then *"Now you! three beats. Tap the stone!"*, with three
   meteors waiting. From then on only that many taps count, so the round
   always ends right.

The first round of the mission is shown the same way before the child
tries, and is not evidence. Waiting meteors are drawn **only** while Pip is
showing the count: drawn before a first try, they would give the answer
away.

**The device voice and beats.** Beats are whole-word parts, not isolated
phonemes, so the device voice can say them. Each is spelled so the voice
says it clearly on its own (*"ap" "pull"* for apple) and must be checked on
the target iPad voice ([CONTENT-REVIEW.md](CONTENT-REVIEW.md#7-syllable-meteors-mercury-2--development-content)).
Recordings should replace them before they are called final.

### When Pip speaks

The first real-iPad test found the device voice robotic and repetitive: the
same sentences, in the same words, on every visit. That is how a child learns
to stop listening to a guide. Pip therefore speaks by **fixed rules**:

1. **An instruction is given once.** After that Pip stays quiet, and offers a
   hint only when the child seems stuck: no tap for 12 seconds on Earth, on a
   planet or in the space station. It gives at most one hint per visit, and
   never during a mission, where the 10-second nudges above do that job. A
   task is explained when its mission starts, until it has been done once.
2. **A recurring moment rotates its words.** Launching, arriving, finishing,
   coming home, each question, each praise and each "almost" has several
   phrasings, and the same phrasing is never used twice in a row.
3. **A moment with nothing new to say gets no line.** The Dock welcome is
   said on the first visit each time the app is opened, and later visits are
   quiet. "Look, the Moon is shining!" and "Next stop, Mercury!" are said
   once, on the flight home from the mission that made them true.
4. **Pip finishes its sentences.** A tap asking for the line already playing
   does not restart it, and tapping Pip mid-sentence does not cut Pip off.
5. **Each kind of line has its own timing** (`AUDIO_TYPES`): a small breath
   after a piece of story before the next line, praise held long enough to
   see the right answer, and whether a tap may cut the line short. Recorded
   narration will keep these rules. [AUDIO.md](AUDIO.md) has the table, and
   Pip's personality.
6. **A letter's name and its sound are never confused.** "Em" is the
   letter M's name, and the device voice may say it. /m/ is its sound: a
   recording, or until then the development phonics voice, never the device
   voice.

The choice of line is deterministic: it comes from counts, never from chance,
and never from an AI. A contract plays whole journeys and fails if any rule is
broken.

**The voice itself** is the device's speech synthesiser. It is a temporary
stand-in until recorded narration exists. The app chooses the most natural
US English voice installed: Premium, then Enhanced, then standard. It never
chooses a novelty voice, and it does not pitch-shift the voice, because
pitch-shifting was what made it sound most robotic. The grown-ups area names
the voice in use, and explains how to download a better one.

### Difficulty: which wrong letters appear

| Level | Distractors | Example for M | Example for little m |
|---|---|---|---|
| 1 | Different stroke shape, never a lookalike | O, S | o, t |
| 2 | The same kind of strokes, not a lookalike | A, K | r, u |
| 3 | At least one letter commonly confused with the target | N or W | n or w |

Little letters have their own shape families — round (a c e o s), hump
(m n r u), short (i v w x z), tall (b d f h k l t) and tail (g j p q y) —
and their own lookalikes (b d p q; n h u; i l j; …), listed in
[CONTENT-REVIEW.md](CONTENT-REVIEW.md#19-little-letters-moon-4--development-content).

Adaptation is deterministic and explainable, for letters and rhymes alike:

- Every item starts at the mission's lowest level (1).
- **Three answers in a row right first try** move that item up one level,
  up to the mission's ceiling (3 for `moon-1`, 2 for `mercury-1`).
- **Any answer that needed help** moves it down one level, but never below
  the floor.
- The level is **never stored**. It is recomputed from the item's last 8
  answers, so it can never disagree with them.
- Choice order comes from a random generator seeded by the run and round, so
  the same inputs always give the same round, and a test can prove it.

Beats have one level: the count is the count. Sound Scout, Word Builder,
Star Words and Word Orbit have two (see their sections above). Moon Writer
has none: its help is the lane and the dot, and less help is authored into
the mission, not chosen by the engine.

There is no AI or model anywhere, and none should be added.

### Evidence (grown-ups only)

Per letter or word, the app records how many times it was asked, how many
were right on the first try, the last 8 outcomes, and when it was last
practiced. The grown-ups area opens with **seven plain counts** — "Letters
practiced", "Rhyming words practiced", "Beginning sounds practiced",
"Syllable words practiced", "Words built", "Sight words practiced", "Letters
traced" — then lists each item ("Practiced 3 times · found on the first try
2 times"; "Traced 2 times · traced without help 1 time"). There are no
percentages, no mastery labels, no grades or ranks, and nothing calling a
child behind or weak. Evidence exists only to shape the next experience.

## Stars: participation, not grades

- Finishing a mission earns a **fixed 3 stars**, however many mistakes were
  made. A replay earns them again, because practice counts.
- A wrong answer can never touch the star ledger, and a contract holds it to
  that.
- Stars buy **purely cosmetic** rocket paint. There are no gameplay
  advantages, no real money, no random rewards and no scarcity.

## What changes for the next skills

Each learning area gets interactions designed around its real objective, not
reskinned multiple choice. All seven now have a first game: letters (hear a
name, find it; big, little and partners), rhyming (listen-first pairing of
pictures), syllables (tap once per beat), beginning sounds (hear a sound,
find what starts with it), CVC words (hear the sounds, build the word, hear
it blended), sight words (hear it, find it; see it, match it) and
handwriting (watch, trace, trace with less help). Still planned, **and not
built**:

- **Sight words in sentences** (a short sentence with a word missing), once
  sentences can be written with only one right answer — "I see ___ dog" has
  several.
- **More letters to write**, then writing without the outline.
- **Deeper phonics**: more vowels, blends, digraphs.

**Recordings are a prerequisite for calling any phonics content final.** A
speech synthesiser cannot be trusted to produce isolated phonemes without an
added schwa, so no letter-sound or CVC content runs on the device voice.
Until recordings exist, the sounds are development audio from a synthesiser
made for this purpose, and every sound and word is Awaiting review
([CONTENT-REVIEW.md](CONTENT-REVIEW.md), [AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md)).
