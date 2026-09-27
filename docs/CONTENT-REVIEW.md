# Content review

Educational correctness is product correctness. This is the checklist a
person (ideally an early-literacy educator) works through, and the record of
what they found.

**Nothing below has been reviewed by an educator yet.** Every item is
**Awaiting review**.

## How to review

1. Play the Moon, Mercury and Mars missions on an actual iPad, with the sound
   on, in the voice the child will hear. The letter sounds on Mars are
   development audio (section 11): judge the content, and note any sound that
   is wrong.
2. Work down each table, and mark each row **OK**, **Change** (with the fix)
   or **Remove**.
3. Put the reviewer's name and the date at the bottom. A change is made in
   `index.html` (the content section) and recorded here.

## 1. Letter names as spoken by the device voice

The device voice reads `speak`, never the bare letter. Listen for each letter
in context. Every line that names a letter says *"the letter ___"*, as in
*"Find the letter ___."* and *"That's the letter ___."* A bare "em" or "oh"
after "found" is heard as "them" or as a sigh.

| Letter | Script | Risk to listen for | Status |
|---|---|---|---|
| A | `ay` | must not sound like "uh" or "eye" | Awaiting review |
| E | `E` | must not be spelled out or clipped | Awaiting review |
| G | `gee` | must be /dʒiː/, not a hard g | Awaiting review |
| H | `aitch` | regional "haitch" is also acceptable; pick one | Awaiting review |
| M | `em` | "Find the letter em": must not be heard as "them" | Awaiting review |
| O | `oh` | fine unless the voice adds emotion | Awaiting review |
| R | `are` | must be the letter name, not the verb said flatly | Awaiting review |
| S | `ess` | | Awaiting review |
| T | `tee` | | Awaiting review |
| W | `double you` | should be one fluent name | Awaiting review |
| Y | `why` | | Awaiting review |
| Z | `zee` | US; UK English would be "zed", so decide the locale | Awaiting review |
| All others | see `LETTERS` | | Awaiting review |

**Locale decision needed:** the voice is set to `en-US`. If the product
targets UK or Australian classrooms, Z, H and several scripts change.

## 2. The Moon mission (`moon-1`)

| Item | Current | Question for the reviewer | Status |
|---|---|---|---|
| Letters | M, S, O, T, S, M | Are these good first letters? Is uppercase-first right for this audience? | Awaiting review |
| Length | 6 rounds, the first guided | Is it too long or too short for a first session? | Awaiting review |
| Choices | 3 tiles | Is 3 right, or should the first mission use 2? | Awaiting review |
| Guided first round | a ring shows the answer after the question | Is this clear enough without reading? | Awaiting review |

## 3. Distractors

| Item | Current | Status |
|---|---|---|
| Shape families | straight E F H I L T · diagonal A K M N V W X Y Z · curved C G J O Q S U · mixed B D P R | Awaiting review |
| Lookalikes | see `LETTERS[x].lookalikes`. Key pairs: M N W, B P R D, O Q C D, E F, U V, K X | Awaiting review |
| Excluded | I (ambiguous in a sans-serif) | Awaiting review |

## 4. Feedback and wording

A moment that recurs has several phrasings (separated by " / " below), and
Pip rotates through them so that no phrasing is used twice in a row. The
rules for when Pip speaks at all are in
[LEARNING-DESIGN.md](LEARNING-DESIGN.md#when-pip-speaks).

| Line | Script | Status |
|---|---|---|
| Question, first of a mission | "Find the letter em." (bubble: "Find the letter!") | Awaiting review |
| Question, later rounds | "Now find the letter em." / "Can you find the letter em?" / "Where is the letter em?" | Awaiting review |
| Nudge, after 10 seconds of no tap | "Listen. Find the letter em.", then "Take your time. Find the letter em.", then nothing more | Awaiting review |
| Correct | "Yes! That's the letter em." / "Great job! You found the letter em." / "You got it! The letter em." / "Wonderful! That's the letter em." / "Super! You found the letter em." | Awaiting review |
| First miss | "Almost! Listen again." / "Good try! Listen again." / "So close! Listen again.", then "Find the letter em." | Awaiting review |
| Second miss | "Here it is! This is the letter em. Tap it!" | Awaiting review |
| First arrival | "We made it to the Moon! Its beacon is dim. Let's find letters to light it up!" then "Tap the beacon to start!". The task, "I'll say a letter. You tap it!", is explained when the mission starts, until it has been done once | Awaiting review |
| Later arrivals | "Back on the Moon!" / "The Moon again! Ready to find some letters?" / "Here we are on the Moon!", then the marker to tap | Awaiting review |
| Mission end, the relight | "You did it! The Moon's beacon is shining again!" then "You found 3 stars!" | Awaiting review |
| Mission end, later | "You did it! The Moon is shining bright!" / "Hooray! Another mission done!" / "Great work, explorer! The Moon is glowing!", then the stars | Awaiting review |
| Launch | "Let's launch!" / "Blast off!" / "Here we go!" | Awaiting review |
| Earth, first visit | "Tap the big Launch button to fly!" | Awaiting review |
| Earth, hint when stuck | "Ready to fly? Tap Launch!" / "Let's fly! Tap the yellow Launch button." / "Tap the big Launch button to fly!" | Awaiting review |
| Home | "Welcome home, explorer!" / "Home again! Nice flying." / "Welcome back to Earth!" | Awaiting review |
| Home after the relight | "Welcome home! Look, the Moon is shining!" | Awaiting review |
| Stars to spend | "You have stars! Tap the paint brush to visit the space station and dress up your rocket." Said once unasked; after that, only when Pip is tapped | Awaiting review |
| Space station, first visit each time the app is opened | "Welcome to the space station! This is your rocket's garage. Tap something to try it on." | Awaiting review |
| Space station, hint when stuck | "Tap a color to try it on your rocket." / "Which one do you like? Tap one to try it on!" / "Tap Gear to find a star or a moon for the top of your rocket!" | Awaiting review |
| Hint timing | A pause of 12 seconds on Earth, on a planet or in the station earns one hint per visit. Is 12 seconds right for this age? | Awaiting review |

## 6. Rhyme Radar (`mercury-1`) — development content

**Development content, written for this project. Nothing here is
curriculum-approved, and every row is Awaiting review.** A round: Pip says a
word ("Cake."), asks what rhymes with it, and names each of three pictures
as it lights up. The child taps the picture that rhymes.

| Round | Word heard / the rhyme | Rhyming part | Status |
|---|---|---|---|
| 1 (guided: the answer is ringed after the question) | cake / snake | *-ake* | Awaiting review |
| 2 | bee / tree | *-ee* | Awaiting review |
| 3 | rock / sock | *-ock* | Awaiting review |
| 4 | moon / spoon | *-oon* | Awaiting review |
| 5 | star / car | *-ar* | Awaiting review |

**The wrong pictures** are chosen by the engine from the word list, never
by hand: a wrong picture never rhymes with the word heard. At the easier
level they also start with a different sound; at the harder level one wrong
picture starts with the **same** sound as the word heard (cake: car; rock:
rocket; star: spoon), because "starts the same" is the usual mix-up with
"rhymes". Questions for the reviewer:

| Item | Question | Status |
|---|---|---|
| rock and rocket at the harder level | "Rocket" begins with the whole word "rock". A fair test of rhyme at this age, or too confusing? | Awaiting review |
| The picture for "moon" | The Moon itself, as seen from space. Clear enough? | Awaiting review |
| The picture for "star" | The reward star. Could a child call it something else? | Awaiting review |
| The picture for "rock" | A grey stone. Pip names every picture aloud, so the name is always given; is that enough? | Awaiting review |
| Three choices, five rounds | Right for a first rhyming mission? | Awaiting review |

| Line | Script | Status |
|---|---|---|
| Explained once, until the mission is done | "Rhyming words sound the same at the end, like cat and hat. I'll say a word. You find the picture that rhymes!" | Awaiting review |
| The word | "Cake." (each word is said as a name) | Awaiting review |
| Question, first round | "What rhymes with cake?" (bubble: "What rhymes?") | Awaiting review |
| Question, later rounds | "Which one rhymes with bee?" / "Find the one that rhymes with rock!" | Awaiting review |
| The pictures | each named as it lights: "Snake." "Sock." "Moon." | Awaiting review |
| Correct | "Yes! Cake, snake. They rhyme!" / "Cake and snake. You found the rhyme!" / "Great listening! Cake, snake!" / "You got it! Cake rhymes with snake!" | Awaiting review |
| First miss | the rotating "almost", then "What rhymes with cake?" and the pictures left, named again | Awaiting review |
| Second miss | "Here it is! cake, snake. Tap the snake!" | Awaiting review |
| Nudge, after 10 seconds | "Listen. What rhymes with cake?", then "Take your time. What rhymes with cake?" | Awaiting review |

## 7. Syllable Meteors (`mercury-2`) — development content

**Development content, not curriculum-approved; every row Awaiting review.**
A round: Pip says a word, and the child taps the big stone once for each
beat. Each tap lights a meteor, so the child sees the count they are
making. A pause of 1.5 seconds ends the count. **Only the count is judged:
never the rhythm, never the speed.** Taps closer together than 0.09 s are
one finger bouncing, and count once.

Pip says the beats one at a time only when showing the answer. Each beat is
a separate short utterance, spelled for the device voice. These spellings
are the riskiest scripts in the app: listen to each on the target iPad
voice, and replace them with recordings before calling them final.

| Word | Beats | Beats as Pip says them | Status |
|---|---|---|---|
| rocket (guided: Pip taps it first) | 2 | "rock!" "it!" | Awaiting review |
| bee | 1 | "bee!" | Awaiting review |
| apple | 2 | "ap!" "pull!" | Awaiting review |
| banana | 3 | "ba!" "na!" "na!" | Awaiting review |
| car | 1 | "car!" | Awaiting review |
| tomato | 3 | "toe!" "may!" "toe!" | Awaiting review |

Every word in the list has a beat count, whether or not a mission uses it
yet. A contract checks these against a second, hand-typed list.

| Word | Beats | Status |
|---|---|---|
| cake | 1 | Awaiting review |
| snake | 1 | Awaiting review |
| bee | 1 | Awaiting review |
| tree | 1 | Awaiting review |
| rock | 1 | Awaiting review |
| sock | 1 | Awaiting review |
| moon | 1 | Awaiting review |
| spoon | 1 | Awaiting review |
| star | 1 | Awaiting review |
| car | 1 | Awaiting review |
| apple | 2 | Awaiting review |
| rocket | 2 | Awaiting review |
| banana | 3 | Awaiting review |
| tomato | 3 | Awaiting review |
| map | 1 | Awaiting review |
| fan | 1 | Awaiting review |
| hat | 1 | Awaiting review |
| cat | 1 | Awaiting review |
| cap | 1 | Awaiting review |
| pan | 1 | Awaiting review |
| sun | 1 | Awaiting review |
| nut | 1 | Awaiting review |
| rug | 1 | Awaiting review |
| cup | 1 | Awaiting review |
| bus | 1 | Awaiting review |
| bug | 1 | Awaiting review |
| net | 1 | Awaiting review |
| fish | 1 | Awaiting review |
| pumpkin | 2 | Awaiting review |
| umbrella | 3 | Awaiting review |
| cupcake | 2 | Awaiting review |

| Line | Script | Status |
|---|---|---|
| Explained once, until the mission is done | "Words have beats. Tap the big stone once for each beat!" | Awaiting review |
| Question | "Banana." then "Tap the stone once for each beat!" / "How many beats? Tap them!" / "Tap the beats!" (bubble: "Tap the beats!", never the count) | Awaiting review |
| Correct | "Yes! Banana has three beats!" / "You got it! Three beats!" / "Great tapping! Banana, three beats!" | Awaiting review |
| First miss | the rotating "almost", then the word again and the question | Awaiting review |
| Second miss, and the guided first round | "Let's tap it together. Listen!", each beat as a meteor lights, then "Now you! Three beats. Tap the stone!" — after this, only that many taps count | Awaiting review |
| Nudge, after 10 seconds | "Listen. banana. Tap each beat!", then "Take your time. banana. Tap each beat!" | Awaiting review |
| Pause length | 1.5 seconds ends a count. Long enough for a slow tapper, short enough not to feel stuck? | Awaiting review |

## 8. Mercury and the world

| Line | Script | Status |
|---|---|---|
| The route opens, seen from the Moon | "Look! A new planet is waiting for us. That is Mercury!" | Awaiting review |
| Home, the first time | "Next stop, Mercury! Tap Launch when you are ready." | Awaiting review |
| Choosing a planet in the sky | "The Moon! That's where we find letters. Tap Launch to fly there!" / "Mercury! That's where we play with rhymes and beats. Tap Launch to fly there!" | Awaiting review |
| First arrival | "We made it to Mercury! Mercury's signal is fuzzy. Let's fix it!" | Awaiting review |
| Later arrivals | "Back on Mercury!" / "Mercury again! Hello, warm rocks!" / "Here we are on Mercury!" | Awaiting review |
| The markers | "Tap the beacon to start!" / "Tap the radar dish to start!" / "Now tap the meteor rocks!" | Awaiting review |
| One mission done, one to go | "It works! One more thing to fix on Mercury." | Awaiting review |
| Mercury restored | "You did it! Mercury's signal is clear!" | Awaiting review |
| Home after restoring it | "Welcome home! Look, Mercury is glowing!" | Awaiting review |
| Nothing left to play on a planet | "Tap the big yellow button to fly home!" (only if the child waits) | Awaiting review |

## 9. The shell: titles, labels and the space station (Phase 2.2)

The HUD shows a short title and a task over every lesson, and a planet's
name and what it teaches. They are on screen for grown-ups and early
readers; Pip still says everything a pre-reader needs.

| Item | On screen | Question for the reviewer | Status |
|---|---|---|---|
| Letter Explorer | "LETTER EXPLORER" / "Find the letter you hear" | Clear? Never gives the answer away? | Awaiting review |
| Rhyme Radar | "RHYME RADAR" / "Find the picture that rhymes" | | Awaiting review |
| Syllable Meteors | "SYLLABLE METEORS" / "Tap the beats" | Is "beats" the right word for syllables at this age? | Awaiting review |
| What a planet teaches | "MOON" / "Letters"; "MERCURY" / "Rhymes • Beats". Derived from the missions' skills (`SKILLS[].short`) | Decided 2026-09-27: "Beats" on screen, because the game says "Tap the beats". The skill is still Syllables in the learning data, these docs and the grown-ups area ("Counting syllables") | Decided (Beats) |
| Home | "EARTH" / "Home base" | | Awaiting review |
| The station | "SPACE STATION" / "Rocket garage"; the Earth button reads "Station" | | Awaiting review |

| Line | Script | Status |
|---|---|---|
| Flying up to the station | "Up we go, to the space station!" | Awaiting review |
| Flying home from it | "Back down to Earth!" | Awaiting review |
| A tab | "Paint!" / "Rocket gear!" / "Rocket themes!" | Awaiting review |
| Trying something on | its name: "Grape purple!", "Star topper!", "Bumblebee!" | Awaiting review |
| Unlocking | "Ta-da! It's on your rocket!" | Awaiting review |
| Wearing one already owned | "Looking good!" | Awaiting review |

| Things to wear | Names and prices | Status |
|---|---|---|
| Paint | Classic red (free), Sky blue 3★, Grape purple 4★, Tangerine orange 4★, Sunny yellow 5★, Bubblegum pink 5★, Lime green 6★, Ocean teal 6★ | Awaiting review |
| Gear | No gear (free), Tiny antenna 3★, Star topper 4★, Moon topper 4★, Side lights 5★, Boosters 6★ | Awaiting review |
| Themes | No theme (free), Bumblebee 8★ (stripes and wings), Rainbow explorer 9★, Galaxy explorer 10★ | Are the prices fair? A mission pays 3★ | Awaiting review |

## 10. Grown-ups area wording

| Item | Status |
|---|---|
| "Heard N times · found on the first try N times": neutral, not a grade? | Awaiting review |
| Practice is listed skill by skill: letters; rhymes ("rhyme found on the first try"); beats ("beats counted on the first try"); beginning sounds, each shown as a sound (/m/), never a letter ("first sound heard on the first try"); built words in capitals (MAP, "built on the first try"). Neutral? | Awaiting review |
| The journey, place by place: "Restored · 1 of 3 missions done", "2 of 4 missions done", "Not reached yet" | Awaiting review |
| "Letter sounds: Development audio, awaiting recordings", and the note that explains it | Awaiting review |
| The note that answers given with the voice off are not counted | Awaiting review |
| The rocket: "Bumblebee · Star topper · 5 of 16 unlocked" | Awaiting review |
| "Display checks: All clear" (or "Redrawn N times this session"): useful to a grown-up testing the app, or noise? | Awaiting review |

## 11. Letter sounds: the development phonics voice (Phase 3)

**Development audio, not final.** A letter's NAME ("em") and its SOUND (/m/)
are different things to a child. The device voice may say a name, but never
a sound: it adds a vowel ("muh") and cannot hold one. Every sound below is
made on the device by the development phonics voice, a small formant
synthesiser written for this app (see [AUDIO.md](AUDIO.md)). It is
deterministic and labelled as development audio. **Each sound needs a
recording by a person before it is final.** The full recording list is
[AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md).

| Sound | As in | Spelled | How it is made today | Question for the reviewer | Status |
|---|---|---|---|---|---|
| /m/ | moon | M | a hum with the lips closed, held about half a second | Recognisable as "mmm", with no "uh" after it? | Awaiting review |
| /s/ | sun | S | a hiss, held | Clearly "sss", not "sh"? | Awaiting review |
| /f/ | fish | F | a softer, flatter hiss, held | Distinct from /s/? | Awaiting review |
| /n/ | net | N | a hum, held (close to /m/: never asked against /m/) | Is keeping /m/ and /n/ apart enough? | Awaiting review |
| /r/ | rug | R | a held American "rrr" | Clearly /r/, not "er"? | Awaiting review |
| /h/ | hat | H | breath shaped like the vowel after it | Audible at all as a sound on its own? | Awaiting review |
| /p/ /t/ /k/ | pan, tub, cat | P, T, C | one short puff, no vowel after it | Hearable, and never "puh", "tuh", "kuh"? | Awaiting review |
| /b/ /g/ | bus, bug | B, G | a short voiced burst | The riskiest: any "buh"/"guh"? | Awaiting review |
| /æ/ /ʌ/ | apple, up | A, U | the short vowel, held | Clearly the short vowel (not "ay", "you")? | Awaiting review |

## 12. Sound Scout (`mars-1`, `mars-3`) — beginning sounds, development content

**Development content, not curriculum-approved; every row Awaiting review.**
A round: Pip says "Listen.", plays the sound, asks "Which picture starts
with…" and plays the sound again. Three pictures then rise onto rocks as
Pip names each one. The child taps the picture that starts with the sound.
**The screen never shows the letter as the clue**: once the picture is
found, the letter that spells the sound appears on the scanner. It is a
bridge to letters and sounds, never the question.

The first sounds are ones that can be held (/m/ /s/ /f/ /n/ /r/), because a
stop said on its own is where a stray "uh" creeps in. Every answer starts
with that sound on its own, never a cluster ("star" and "spoon" start with
two sounds together).

| Mission | Round | Sound | Letter (shown after) | Answer picture | Audio | Status |
|---|---|---|---|---|---|---|
| mars-1 | 1 (guided: the answer glows) | /m/ | M | moon | development | Awaiting review |
| mars-1 | 2 | /s/ | S | sun | development | Awaiting review |
| mars-1 | 3 | /f/ | F | fish | development | Awaiting review |
| mars-1 | 4 | /m/ | M | map | development | Awaiting review |
| mars-1 | 5 | /s/ | S | sock | development | Awaiting review |
| mars-1 | 6 | /f/ | F | fan | development | Awaiting review |
| mars-3 | 1 | /n/ | N | net | development | Awaiting review |
| mars-3 | 2 | /r/ | R | rug | development | Awaiting review |
| mars-3 | 3 | /n/ | N | nut | development | Awaiting review |
| mars-3 | 4 | /r/ | R | rock | development | Awaiting review |
| mars-3 | 5, 6 | REVIEW: the sound the child most needed help with (see section 17); /m/ (map) and /s/ (sun) until there is any | — | — | development | Awaiting review |

**The wrong pictures** are chosen by the engine from the word list, never by
hand. A wrong picture never starts with the sound asked about. At the easy
level it starts with a sound of another kind altogether: a hum (/m/ /n/), a
hiss (/s/ /f/ /h/), a glide (/r/), a stop, or a vowel. At the harder level,
one wrong picture RHYMES with the answer (moon: spoon), because "sounds the
same at the end" is the mix-up to hear past.

| Item | Question for the reviewer | Status |
|---|---|---|
| A wrong picture may start with a cluster ("snake" beside /m/) | Fair, since it does not start with the sound asked? | Awaiting review |
| The picture for "nut" is an acorn-like nut | Will children say "acorn"? Pip names every picture aloud | Awaiting review |
| The picture for "rug" | Could a child call it "mat"? | Awaiting review |
| "fish" ends in /ʃ/ | Only its first sound is asked; fine? | Awaiting review |
| The letter shown on the scanner after the answer | Helpful bridge to letter sounds, or a distraction? | Awaiting review |
| Three choices, six rounds | Right for a first beginning-sounds mission? | Awaiting review |

| Line | Script | Status |
|---|---|---|
| Explained once, until the game is played | "Words start with a sound. I'll play a sound. You find the picture that starts with it." | Awaiting review |
| The round | "Listen." … /m/ … "Which picture starts with…" /m/, then the pictures named: "Moon." "Sun." "Fish." (bubble: "Which one starts with this sound?", never the letter) | Awaiting review |
| Later questions | "Which one starts with…" / "Find the one that starts with…", each followed by the sound | Awaiting review |
| Correct | the sound, then "Moon!" / "Yes! Moon!" / "You found it! Moon!" / "Great listening! Moon!" | Awaiting review |
| First miss | the rotating "almost", the sound again, then the pictures left, named again | Awaiting review |
| Second miss | "Here it is! Moon starts with…" /m/ "Tap the moon!" | Awaiting review |
| Nudge, after 10 seconds | "Listen again." then the sound; then "Take your time. Listen." then the sound | Awaiting review |
| With no sound at all | the bubble shows "Find the picture that starts with M!", and the answer is not counted as practice | Awaiting review |

## 13. Word Builder (`mars-2`, `mars-4`) — CVC words, development content

**Development content, not curriculum-approved; every row Awaiting review.**
A round: Pip says "Listen." and the word sound by sound (/m/ … /æ/ … /p/),
each slot lighting as its sound plays, then "Build the word!". The child
taps the letters into the three slots in order. **Tapping a letter plays its
SOUND, never its name.** Tapping a letter in a slot takes it back (undo).
When the word is full it is checked: right, and the letters slide together
as Pip blends it slowly ("mmm-aaa-p"), says it ("Map! You built it!"), and
its picture appears. Wrong: only the letters in the wrong places hop back.
After a second miss, Pip builds it with the child sound by sound, then only
the next right letter can go in.

Every word is CVC: three letters, each spelling one sound, consonant, short
vowel, consonant, with no letter twice.

| Word | Sounds | Pattern | Level | Picture | Audio (sound by sound, and blended) | Possible ambiguity | Status |
|---|---|---|---|---|---|---|---|
| map | /m/ /æ/ /p/ | CVC, short a | 1 | a folded treasure map | development | | Awaiting review |
| fan | /f/ /æ/ /n/ | CVC, short a | 1 | a desk fan | development | | Awaiting review |
| hat | /h/ /æ/ /t/ | CVC, short a | 1 | a sun hat with a ribbon | development | /h/ alone is only breath | Awaiting review |
| cat | /k/ /æ/ /t/ | CVC, short a | 2 | a sitting cat | development | C spells /k/ | Awaiting review |
| cap | /k/ /æ/ /p/ | CVC, short a | 2 | a baseball cap | development | a child may say "hat" | Awaiting review |
| pan | /p/ /æ/ /n/ | CVC, short a | 2 | a frying pan | development | | Awaiting review |
| sun | /s/ /ʌ/ /n/ | CVC, short u | 1 | the sun | development | | Awaiting review |
| cup | /k/ /ʌ/ /p/ | CVC, short u | 2 | a cup with a handle | development | a child may say "mug" | Awaiting review |
| nut | /n/ /ʌ/ /t/ | CVC, short u | 1 | an acorn-like nut | development | a child may say "acorn" | Awaiting review |
| bus | /b/ /ʌ/ /s/ | CVC, short u | 2 | a school bus | development | /b/ alone is the riskiest sound | Awaiting review |
| bug | /b/ /ʌ/ /g/ | CVC, short u | 2 | a ladybug | development | a child may say "ladybug" | Awaiting review |

`mars-2` builds map (guided), fan, hat, cat, cap, pan. `mars-4` builds sun,
cup, nut, bus, bug, then a REVIEW round: the short-a word the child most
needed help with, map until there is any.

**Words not used, and why** (for the reviewer to confirm): "tap" (in US
English a faucet), "nap" and "man" (people; Pip is the only character),
"sit" (an action, hard to picture), "pin" and "fin" (short i: less familiar
as pictures; short i waits for better words), and anything with a digraph or
x ("fish", "rock", "fox" are not CVC by sound and letter).

**At the harder level** one extra letter joins the three, whose sound is
nowhere in the word and which is not a lookalike of its letters (for
example F or S beside M, A, P).

| Line | Script | Status |
|---|---|---|
| Explained once, until the game is played | "I'll say a word sound by sound. Tap the letters to build it." | Awaiting review |
| The round | "Listen." /m/ … /æ/ … /p/ "Build the word!" / "Tap the letters in order!" / "Can you build it?" | Awaiting review |
| A letter tapped | its sound, never its name | Awaiting review |
| Correct | the word blended slowly ("mmm-aaa-p"), then "Map! You built it!" / "Map! You made the word!" / "Great building! Map!", and the picture | Awaiting review |
| First miss | the rotating "almost", then the word sound by sound again | Awaiting review |
| Second miss, and the guided first round | "Let's build it together. Listen.", each letter hopping in with its sound, the blend, then "Now you! Build map." | Awaiting review |
| Nudge, after 10 seconds | "Listen again." then the word sound by sound; then "Take your time. Listen." | Awaiting review |

## 14. More letters on the Moon (`moon-2`, `moon-3`)

The same game and lines as `moon-1` (sections 2–4). The game is already
known, so no round is guided and the task is not explained again.

| Mission | Letters | Question for the reviewer | Status |
|---|---|---|---|
| moon-2 | A, P, F, N, A, P | Chosen because the first Word Builder words are built from them. Fair second set? | Awaiting review |
| moon-3 | C, H, U, B, then two REVIEW rounds: the letters so far the child most needed help with (M and S until there is any) | Is C/G/O at the hardest level too hard this early? | Awaiting review |

## 15. Rhyme Radar's second mission (`mercury-3`)

| Round | Word heard / the rhyme | Rhyming part | Status |
|---|---|---|---|
| 1 | cat / hat | *-at* | Awaiting review |
| 2 | map / cap | *-ap* | Awaiting review |
| 3 | fan / pan | *-an* | Awaiting review |
| 4 | bug / rug | *-ug* | Awaiting review |
| 5 | sock / rock | *-ock* | Awaiting review |

The wrong pictures follow section 6's rules, from the larger word list.
"cupcake" rhymes with cake and snake (*-ake*), so it can never be a wrong
picture beside them.

## 16. Syllable Meteors' second mission (`mercury-4`)

| Word | Beats | Beats as Pip says them | Status |
|---|---|---|---|
| cupcake | 2 | "cup!" "cake!" | Awaiting review |
| sun | 1 | "sun!" | Awaiting review |
| umbrella | 3 | "um!" "brel!" "la!" | Awaiting review |
| pumpkin | 2 | "pump!" "kin!" | Awaiting review |
| fish | 1 | "fish!" | Awaiting review |
| banana | 3 | "ba!" "na!" "na!" | Awaiting review |

## 17. Review: what was hard comes back

A few rounds are REVIEW rounds. Each lists what it may ask. When it begins,
it asks the item whose recent answers needed help most often. If there is a
tie, it asks the one practised longest ago. With nothing shown yet, it asks
the first one listed. It never asks something already asked in the same
mission, and never at random. A letter found only with help in Letter
Explorer brings its SOUND back in Sound Scout (M hard → /m/ with a picture
that starts with it). A grown-up could follow the rule on paper.

| Item | Question for the reviewer | Status |
|---|---|---|
| "Needed help most often" counts the answers that needed help among the last 8 of that item | A fair measure of "hard"? | Awaiting review |
| Two review rounds at the end of `moon-3` and `mars-3`, one at the end of `mars-4` | Enough, or too much? | Awaiting review |

## 18. Mars and the world

| Line | Script | Status |
|---|---|---|
| The route opens, seen from Mercury | "Look! A red planet is waiting for us. That is Mars!" | Awaiting review |
| Home, the first time | "Next stop, Mars! Tap Launch when you are ready." | Awaiting review |
| Choosing it in the sky | "Mars! That's where we play with sounds and words. Tap Launch to fly there!" | Awaiting review |
| First arrival | "We made it to Mars! Its sound scanner is quiet. Let's help it hear again!" | Awaiting review |
| Later arrivals | "Back on Mars!" / "Mars again! Hello, red rocks!" / "Here we are on Mars!" | Awaiting review |
| The markers | "Tap the sound scanner to start!" / "Now tap the word machine!" | Awaiting review |
| One done, one to go | "It works! Now the word machine needs help." | Awaiting review |
| Mars restored | "You did it! Mars is full of sounds again!" | Awaiting review |
| Home after restoring it | "Welcome home! Look, Mars is glowing!" | Awaiting review |
| A child who had already cleared Mercury before Mars existed | on Earth, once: Mars appears in the sky with the reveal line and "Next stop, Mars!" | Awaiting review |
| On screen | "MARS" / "Sounds • Words"; "SOUND SCOUT" / "Find the starting sound"; "WORD BUILDER" / "Build the word you hear" | Awaiting review |

---

**Reviewer:** _____ **Date:** _____
