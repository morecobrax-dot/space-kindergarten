# tools/voice: Pip's recorded voice

The voice pilot's clips (`VOICE_PILOT` in `index.html`) are made here with
the **Speechify AI Voice API**, through its official, documented API
(`POST https://api.speechify.ai/v1/audio/speech`), from a **stock adult
voice**: not a clone, not a child's voice, and not an imitation of anyone.
The voice is **AI-generated, not a human voice**, and the project says so
everywhere it is used.

This is an **authoring tool, not a build step**. The app ships the
committed MP3 files in `assets/voice/` and never calls any service: no
speech is requested while a child plays, online or offline.

## Rights and obligations

The Speechify AI Voice API terms (speechify.com/terms-ai-voice-api) treat
generated audio as the customer's output and allow it in the customer's
own application for its end users, on two conditions this project keeps:

- **Every use says it is AI-generated.** Each MP3 carries
  "AI-generated voice, not a human voice. Voices powered by Speechify." in
  its ID3 comment tag; the grown-ups area says "This voice is
  AI-generated, not a human voice"; docs/CONTENT-SOURCES.md and this file
  record it.
- **"Voices powered by Speechify"** is shown in the product: the grown-ups
  area, beside the pilot.

The terms also rule out a voice of anyone under 18, a deceased person or a
public political figure for cloning: nothing here is cloned.

## Make the clips

The key is never in the repository and is never printed. Save it, alone,
in a file outside the repository, and pass it in the environment:

```
SPEECHIFY_API_KEY="$(cat ~/.speechify/api-key.txt)" node tools/voice/voice.js voices
SPEECHIFY_API_KEY="$(cat ~/.speechify/api-key.txt)" node tools/voice/voice.js make
FFMPEG=/path/to/ffmpeg node tools/voice/voice.js build
FFMPEG=/path/to/ffmpeg node tools/voice/voice.js check
npm run config:sync
npm run verify
```

- `voices` lists the stock US English voices of `voice.json`'s model, every
  page of them (the full list lands in `out/`).
- `audition <voice>...` makes five test lines per voice in `out/audition/`,
  one for each letter and a story line, for choosing one. The choice goes in
  `voice.json`.
- `make [line...]` requests every pilot line (or only those listed) as
  24 kHz WAV, with `voice.json`'s style and pace, and keeps the service's
  word timings beside each take in `out/takes/`. A script is sent as it is
  written, except the letter O, sent as "O": its spelling "oh" was read as
  the exclamation.
- `build` trims each take (80 ms of air before the first sound and 220 ms
  after the last, found in the sound itself down to 45 dB under its loudest
  moment, so a quiet last "s" stays), fades its edges,
  brings every clip to one speaking level (`level`, dBFS) with the peak
  under -1 dBFS, encodes it as MP3 (`sampleRate`, `bitrate`) with the
  disclosure in its tags, writes `takes.json` (what each clip says, how it
  was made, its length and size) and writes the clips' `voiceAsset()`
  entries into `ASSET_REGISTRY` between the `VOICE-ASSETS` markers.
- `check` measures what ships: length, lead-in and tail, speaking level,
  peak and pace, and puts each letter line three times to Windows' own
  offline speech recogniser, which must choose between the mission's four
  letters in the same sentence. The record is `check.json`, committed with
  the clips: no letter line may ever be heard as another letter. That is a
  second opinion, not a person listening.

**Spending.** Every request is counted from the service's own billable
figure in `out/usage.json`. `voice.json`'s `budget` is the most the tool
spends in a calendar month, far inside the free plan: a request that could
pass it is never sent, and a refusal for payment (402) stops the tool at
once. Nothing is ever retried. Only the spoken text is billed, not the SSML
around it. The voice pilot took 2,843 characters, auditions included.

A line's script changing makes `build` refuse its old take: make it again.

## What `voice.json` says

| Setting | Meaning |
|---|---|
| `voice`, `model` | The stock voice and the model that says every clip. Contract 63 refuses a clip made any other way. |
| `rate` | SSML prosody rate: a little slower than the voice's own pace, for young listeners. The app plays every clip at the speed it was made; "A little quicker" only shortens the pauses between lines. |
| `emotion` | The Speechify style every line is said in. |
| `budget` | The most characters the tool may spend in a calendar month. |
| `level`, `sampleRate`, `bitrate` | The speaking level every clip is brought to, and how it is encoded. |
