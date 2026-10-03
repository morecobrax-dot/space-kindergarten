/* =========================================================
   PIP'S RECORDED VOICE — tools/voice
   ---------------------------------------------------------
   Makes the voice pilot's clips (VOICE_PILOT in index.html) with the
   Speechify AI Voice API, its official documented API, from a stock
   adult voice, and checks them. An authoring tool, not a build step:
   the app ships the committed MP3 files and never calls any service.

     node tools/voice/voice.js voices             the account's voices → out/voices.json, English ones listed
     node tools/voice/voice.js audition <id>...   three test lines per voice → out/audition/
     node tools/voice/voice.js make [line...]     every pilot line (or those listed) → out/takes/
     node tools/voice/voice.js build              takes → assets/voice/*.mp3, takes.json, the registry
     node tools/voice/voice.js check              every shipped clip: length, level, silence, pace, words

   THE KEY comes from the environment (SPEECHIFY_API_KEY), never from the
   repository, and is used only to call the API. It is never printed,
   logged, written anywhere or sent anywhere else. ffmpeg (for encoding and
   checking) is FFMPEG, or ffmpeg on the PATH. README.md says how.

   The voice is AI-generated. The service's terms ask that every use says
   so: each MP3 carries the disclosure in its ID3 tags, and the app's
   grown-ups area shows it with "Voices powered by Speechify".
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const H = require('../../test/harness.js');

const HERE = __dirname;
const OUT = path.join(HERE, 'out');
const ASSETS = path.join(H.ROOT, 'assets', 'voice');
const SETTINGS = path.join(HERE, 'voice.json');
const TAKES = path.join(HERE, 'takes.json');
const CHECK = path.join(HERE, 'check.json');
const API = 'https://api.speechify.ai';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const DISCLOSURE = 'AI-generated voice, not a human voice. Voices powered by Speechify.';

/* ---------- the account ---------- */
function key(){
  const k = String(process.env.SPEECHIFY_API_KEY || '').trim();
  if(!k) throw new Error('No API key: set SPEECHIFY_API_KEY (see tools/voice/README.md). It never goes in the repository.');
  if(/\s/.test(k)) throw new Error('SPEECHIFY_API_KEY should be the key alone.');
  return k;
}
/* One request. An error names the status and the service's own message,
   never the request's headers. */
async function api(method, route, body){
  const res = await fetch(API + route, {
    method: method,
    headers: Object.assign({ Authorization: 'Bearer ' + key(), Accept: 'application/json' }, body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if(!res.ok) throw new Error(method + ' ' + route + ' → ' + res.status + ': ' + text.slice(0, 400));
  return JSON.parse(text);
}

/* ---------- what to say ---------- */
function settings(){ return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); }
function app(){ return H.loadApp().ctx; }
/* 'story.moon.firstArrive' → 'story-moon-first-arrive' */
function fileName(line){ return line.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/\./g, '-'); }
function xml(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
/* What the service is sent for a line: its script, said at the pilot's
   pace and in its style. The script is sent as it is written, spoken
   letter names and all ("the letter em") — except where a letter's spoken
   spelling is also an ordinary word with a way of its own: "oh" is read as
   the exclamation, so the letter O is sent as "O", which the model reads
   as the letter's name. The letter test found it: three of six "oh" lines
   matched no letter at all, and sent as "O" all three were heard as O. */
const LETTER_INPUT = { 'the letter oh': 'the letter O' };
function inputText(script){
  let t = String(script);
  Object.keys(LETTER_INPUT).forEach(k => { t = t.replace(new RegExp('\\b' + k + '\\b', 'g'), LETTER_INPUT[k]); });
  return t;
}
function ssml(script, s){
  let body = xml(inputText(script));
  if(s.rate) body = '<prosody rate="' + s.rate + '">' + body + '</prosody>';
  if(s.emotion) body = '<speechify:style emotion="' + s.emotion + '">' + body + '</speechify:style>';
  return '<speak>' + body + '</speak>';
}
/* What this tool may spend: s.budget characters in a calendar month,
   counted from the service's own billable figure in tools/voice/out/
   usage.json, kept well inside the free plan. A request that could pass the
   budget is never sent, and a refusal for payment (402) stops everything:
   nothing is retried. */
const USAGE = path.join(OUT, 'usage.json');
function usage(){ try{ return JSON.parse(fs.readFileSync(USAGE, 'utf8')); }catch(e){ return {}; } }
function month(){ return new Date().toISOString().slice(0, 7); }
function spent(){ const u = usage()[month()]; return u ? u.billable : 0; }
function record(billable){
  const u = usage(), m = month();
  u[m] = { billable: (u[m] ? u[m].billable : 0) + billable, requests: (u[m] ? u[m].requests : 0) + 1 };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(USAGE, JSON.stringify(u, null, 2));
}
async function take(script, s, voice){
  const input = ssml(script, s);
  if(!(s.budget > 0)) throw new Error('voice.json needs a budget: the most characters this tool may spend in a month.');
  if(spent() + input.length > s.budget){
    throw new Error('Stopped before the budget: ' + spent() + ' of ' + s.budget + ' characters spent this month, and this line could take ' + input.length + '.');
  }
  let r;
  try{
    r = await api('POST', '/v1/audio/speech', {
      input: input, voice_id: voice || s.voice, model: s.model, language: 'en-US',
      output_format: 'wav_24000', options: { loudness_normalization: true, text_normalization: true }
    });
  }catch(e){
    if(/ → 402:/.test(e.message)) throw new Error('Stopped: the service asked for payment (402) — the free balance is used up, or the plan does not cover this. Nothing was retried.\n' + e.message);
    throw e;
  }
  const billable = typeof r.billable_characters_count === 'number' ? r.billable_characters_count : input.length;
  record(billable);
  return { input: input, wav: Buffer.from(r.audio_data, 'base64'), marks: r.speech_marks || null, billable: billable };
}

/* ---------- sound ---------- */
function readWav(buf){
  if(buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV file');
  let at = 12, fmt = null, data = null;
  while(at + 8 <= buf.length){
    const id = buf.toString('ascii', at, at + 4);
    let size = buf.readUInt32LE(at + 4);
    if(id === 'data' && (size === 0 || size === 0xFFFFFFFF || at + 8 + size > buf.length)) size = buf.length - at - 8;   // streamed WAVs leave it open
    if(id === 'fmt ') fmt = { format: buf.readUInt16LE(at + 8), channels: buf.readUInt16LE(at + 10), rate: buf.readUInt32LE(at + 12), bits: buf.readUInt16LE(at + 22) };
    if(id === 'data') data = buf.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size % 2);
  }
  if(!fmt || !data || fmt.format !== 1 || fmt.bits !== 16) throw new Error('expected 16-bit PCM');
  const n = Math.floor(data.length / 2 / fmt.channels), x = new Float32Array(n);
  for(let i = 0; i < n; i++){
    let v = 0;
    for(let ch = 0; ch < fmt.channels; ch++) v += data.readInt16LE((i * fmt.channels + ch) * 2);
    x[i] = v / fmt.channels / 32768;
  }
  return { rate: fmt.rate, x: x };
}
function writeWav(file, rate, x){
  const b = Buffer.alloc(44 + x.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for(let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}
const db = v => 20 * Math.log10(Math.max(v, 1e-9));
/* 10 ms frames: where speech begins and ends, its level while speaking,
   and its peak. Speech is any frame within 40 dB of the loudest. */
function measure(rate, x, floor){
  const f = Math.round(rate / 100), frames = [];
  for(let i = 0; i + f <= x.length; i += f){
    let e = 0;
    for(let k = 0; k < f; k++) e += x[i + k] * x[i + k];
    frames.push(Math.sqrt(e / f));
  }
  const loud = Math.max.apply(null, frames.concat([1e-9]));
  const on = frames.map(v => db(v) > db(loud) - (floor || 40));
  const first = on.indexOf(true), last = on.lastIndexOf(true);
  const active = frames.filter(v => db(v) > db(loud) - 30);
  const level = db(Math.sqrt(active.reduce((s, v) => s + v * v, 0) / Math.max(1, active.length)));
  let peak = 0;
  for(let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  return { seconds: x.length / rate, lead: Math.max(0, first) / 100, tail: first < 0 ? 0 : (frames.length - 1 - last) / 100,
           speech: first < 0 ? 0 : (last - first + 1) / 100, level: level, peak: db(peak) };
}
/* Every word the service says it spoke, with its times in ms. */
function words(marks){
  const out = [];
  (function walk(m){
    if(!m || typeof m !== 'object') return;
    if(Array.isArray(m)){ m.forEach(walk); return; }
    if(m.type === 'word' && typeof m.value === 'string') out.push({ value: m.value, start: m.start_time, end: m.end_time });
    Object.keys(m).forEach(k => { if(typeof m[k] === 'object') walk(m[k]); });
  })(marks);
  return out.sort((a, b) => a.start - b.start);
}

/* A take, trimmed and levelled: 80 ms of air before the first sound and
   220 ms after the last, soft edges, and every clip at one speaking level
   (s.level dBFS while speaking) with its peak under -1 dBFS. The ends are
   found in the sound itself, down to 45 dB under the loudest moment, so a
   quiet last "s" or "t" is kept. The service's word times are estimates
   spread over the line, not where each word ends: trimming to them left
   up to half a second of silence after a line. */
function finish(t, s){
  const w = readWav(t.wav), m = measure(w.rate, w.x, 45);
  const a = m.lead, z = m.lead + m.speech;
  const i0 = Math.max(0, Math.floor((a - 0.08) * w.rate)), i1 = Math.min(w.x.length, Math.ceil((z + 0.22) * w.rate));
  const x = w.x.slice(i0, i1);
  const fin = Math.round(0.008 * w.rate), fout = Math.round(0.06 * w.rate);
  for(let i = 0; i < fin && i < x.length; i++) x[i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / fin);
  for(let i = 0; i < fout && i < x.length; i++) x[x.length - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / fout);
  const before = measure(w.rate, x);
  let gain = s.level - before.level;
  if(before.peak + gain > -1) gain = -1 - before.peak;
  const g = Math.pow(10, gain / 20);
  for(let i = 0; i < x.length; i++) x[i] *= g;
  return { rate: w.rate, x: x, gain: gain, cut: [i0 / w.rate, i1 / w.rate], words: words(t.marks) };
}
function encode(wavFile, mp3File, s, title){
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', wavFile, '-ac', '1', '-ar', String(s.sampleRate),
    '-c:a', 'libmp3lame', '-b:a', s.bitrate, '-id3v2_version', '3', '-write_xing', '1',
    '-metadata', 'title=' + title, '-metadata', 'artist=Pip (AI-generated voice)', '-metadata', 'album=Space Kindergarten',
    '-metadata', 'comment=' + DISCLOSURE, mp3File]);
}
/* The length of an MP3 from its frames (not counting the Xing/Info frame). */
function mp3Seconds(buf){
  let at = 0;
  if(buf.toString('ascii', 0, 3) === 'ID3') at = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
  const RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  const KBPS = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
  let samples = 0, rate = 0, first = true;
  while(at + 4 <= buf.length){
    if(buf[at] !== 0xFF || (buf[at + 1] & 0xE0) !== 0xE0){ at++; continue; }
    const ver = (buf[at + 1] >> 3) & 3, layer = (buf[at + 1] >> 1) & 3, bi = buf[at + 2] >> 4, si = (buf[at + 2] >> 2) & 3, pad = (buf[at + 2] >> 1) & 1;
    if(ver === 1 || layer !== 1 || bi === 0 || bi === 15 || si === 3){ at++; continue; }
    const mpeg1 = ver === 3, sr = RATES[ver][si], kbps = KBPS[mpeg1 ? 1 : 2][bi];
    const len = Math.floor((mpeg1 ? 144 : 72) * kbps * 1000 / sr) + pad;
    const side = mpeg1 ? 32 : 17, tag = buf.toString('ascii', at + 4 + side, at + 8 + side);
    if(!(first && (tag === 'Xing' || tag === 'Info'))) samples += mpeg1 ? 1152 : 576;
    first = false; rate = sr; at += len;
  }
  return rate ? samples / rate : 0;
}

/* ---------- checking what ships ---------- */
/* Windows' own speech recogniser, offline: what it hears in each clip,
   and for a letter line, which of the mission's four letters it hears
   in the sentence. Not a person listening — a second opinion that every
   word is there and each letter name is the one intended. */
function recognise(items){
  const list = path.join(OUT, 'check', 'asr.json');
  fs.writeFileSync(list, JSON.stringify(items));
  const text = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(HERE, 'asr.ps1'), list], { encoding: 'utf8', maxBuffer: 1 << 24 });
  return JSON.parse(text.trim() || '[]');
}
const LETTER_WORDS = { M: 'em', S: 'ess', O: 'oh', T: 'tee' };
function norm(s){ return String(s).toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
/* The sentence that names the letter, once with each of the mission's
   letters in it: what the recogniser must choose between. */
function letterPhrases(script, L){
  const said = new RegExp('\\b' + LETTER_WORDS[L] + '\\b');
  const sentence = (String(script).match(/[^.!?]+[.!?]*/g) || [script]).find(x => said.test(x)) || script;
  return Object.keys(LETTER_WORDS).map(k => norm(sentence.replace(new RegExp('\\b' + LETTER_WORDS[L] + '\\b', 'g'), k)));
}
/* The word error rate of what was heard against the script. */
function wer(ref, hyp){
  const a = norm(ref).split(' '), b = norm(hyp).split(' ').filter(Boolean);
  const d = [];
  for(let i = 0; i <= a.length; i++){ d[i] = [i]; for(let j = 1; j <= b.length; j++) d[i][j] = i === 0 ? j : 0; }
  for(let i = 1; i <= a.length; i++) for(let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length] / a.length;
}

/* ---------- commands ---------- */
/* The stock (shared) US English voices of the pilot's model, every page. */
async function voices(){
  const s = settings();
  fs.mkdirSync(OUT, { recursive: true });
  const all = [];
  let cursor = null;
  do {
    const q = '?type=shared&locale=en-US&limit=200&model=' + encodeURIComponent(s.model) + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const page = await api('GET', '/v1/voices' + q);
    (page.voices || []).forEach(v => all.push(v));
    cursor = page.has_more ? page.next_cursor : null;
  } while(cursor);
  fs.writeFileSync(path.join(OUT, 'voices.json'), JSON.stringify(all, null, 2));
  all.forEach(v => console.log([v.id, v.display_name, v.gender, v.locale, v.type, (v.tags || []).join(',')].join(' | ')));
  console.log(all.length + ' stock en-US voices for ' + s.model + '; the full list is in tools/voice/out/voices.json');
}
async function audition(ids){
  const s = settings(), x = app();
  const lines = ['story.moon.firstArrive', 'find.M', 'found.O.0', 'show.T', 'again.S.0'];
  for(const v of ids){
    const dir = path.join(OUT, 'audition', v);
    fs.mkdirSync(dir, { recursive: true });
    for(const line of lines){
      const t = await take(x.voiceCue(line).speak, s, v);
      fs.writeFileSync(path.join(dir, fileName(line) + '.wav'), t.wav);
      fs.writeFileSync(path.join(dir, fileName(line) + '.json'), JSON.stringify({ input: t.input, marks: t.marks, billable: t.billable }, null, 2));
      const w = readWav(t.wav), m = measure(w.rate, w.x), n = words(t.marks).length;
      console.log(v + ' ' + line + ': ' + m.seconds.toFixed(2) + ' s, speech ' + m.speech.toFixed(2) + ' s, ' +
        (n ? (n / m.speech).toFixed(2) + ' words/s' : 'no word marks') + ', level ' + m.level.toFixed(1) + ' dBFS, billed ' + t.billable + ' (month ' + spent() + ')');
    }
  }
}
async function make(only){
  const s = settings(), x = app();
  if(!s.voice) throw new Error('Choose the voice in tools/voice/voice.json first.');
  const lines = only.length ? only : x.VOICE_PILOT.lines;
  const dir = path.join(OUT, 'takes');
  fs.mkdirSync(dir, { recursive: true });
  let chars = 0;
  for(const line of lines){
    const cue = x.voiceCue(line);
    if(!cue || x.VOICE_PILOT.lines.indexOf(line) === -1) throw new Error('not a pilot line: ' + line);
    const t = await take(cue.speak, s);
    chars += t.billable;
    fs.writeFileSync(path.join(dir, fileName(line) + '.wav'), t.wav);
    fs.writeFileSync(path.join(dir, fileName(line) + '.json'), JSON.stringify({
      line: line, script: cue.speak, input: t.input, voice: s.voice, model: s.model, made: new Date().toISOString(),
      billable: t.billable, marks: t.marks }, null, 2));
    console.log('took ' + line);
  }
  console.log(lines.length + ' takes, ' + chars + ' billable characters');
}
function build(){
  const s = settings(), x = app();
  fs.mkdirSync(ASSETS, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'clips'), { recursive: true });
  const record = [];
  x.VOICE_PILOT.lines.forEach(line => {
    const name = fileName(line), meta = JSON.parse(fs.readFileSync(path.join(OUT, 'takes', name + '.json'), 'utf8'));
    if(meta.script !== x.voiceCue(line).speak) throw new Error(line + ': its script changed since it was made — make it again');
    const f = finish({ wav: fs.readFileSync(path.join(OUT, 'takes', name + '.wav')), marks: meta.marks }, s);
    const wav = path.join(OUT, 'clips', name + '.wav'), mp3 = path.join(ASSETS, name + '.mp3');
    writeWav(wav, f.rate, f.x);
    encode(wav, mp3, s, 'Pip: ' + meta.script);
    const seconds = Math.round(mp3Seconds(fs.readFileSync(mp3)) * 100) / 100;
    record.push({ line: line, file: 'assets/voice/' + name + '.mp3', script: meta.script, input: meta.input, voice: meta.voice, model: meta.model,
                  made: meta.made.slice(0, 10), seconds: seconds, bytes: fs.statSync(mp3).size, gainDb: Math.round(f.gain * 10) / 10,
                  words: f.words.map(w => w.value) });
  });
  fs.writeFileSync(TAKES, JSON.stringify({ disclosure: DISCLOSURE, service: 'Speechify AI Voice API (api.speechify.ai, POST /v1/audio/speech)',
    settings: s, clips: record }, null, 2) + '\n');
  /* the registry's voice entries, derived from the takes */
  const P = H.APP_PATH, a = '/* VOICE-ASSETS-BEGIN: written by tools/voice build, from tools/voice/takes.json */', z = '/* VOICE-ASSETS-END */';
  const html = fs.readFileSync(P, 'utf8'), i = html.indexOf(a), j = html.indexOf(z);
  if(i === -1 || j < i) throw new Error('index.html has no VOICE-ASSETS region in ASSET_REGISTRY');
  const rows = record.map(r => "  voiceAsset('" + r.line + "', '" + r.file + "', " + r.seconds.toFixed(2) + '),').join('\n');
  fs.writeFileSync(P, html.slice(0, i + a.length) + '\n' + rows + '\n  ' + html.slice(j));
  const total = record.reduce((n, r) => n + r.bytes, 0);
  console.log(record.length + ' clips, ' + record.reduce((n, r) => n + r.seconds, 0).toFixed(1) + ' s, ' + total + ' bytes → assets/voice/');
}
function check(){
  const dir = path.join(OUT, 'check');
  fs.mkdirSync(dir, { recursive: true });
  const takes = JSON.parse(fs.readFileSync(TAKES, 'utf8')).clips;
  const items = takes.map(t => {
    const wav = path.join(dir, path.basename(t.file, '.mp3') + '.wav');
    execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(H.ROOT, t.file), '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);
    const p = t.line.split('.'), L = /^(find|found|again|show)$/.test(p[0]) ? p[1] : null;
    return { line: t.line, file: wav, script: t.script, letter: L, phrases: L ? letterPhrases(t.script, L) : null };
  });
  /* The recogniser is not quite deterministic on a borderline clip, so it
     is asked three times, and every answer is kept. */
  const asked = items.filter(i => i.phrases);
  const runs = [0, 1, 2].map(() => recognise(asked.map(i => ({ file: i.file, phrases: i.phrases }))));
  const r2 = v => Math.round(v * 100) / 100;
  const rows = items.map(it => {
    const m = measure(16000, readWav(fs.readFileSync(it.file)).x), n = norm(it.script).split(' ').length;
    const k = asked.indexOf(it);
    const picks = k < 0 ? null : runs.map(run => (run[k] && run[k].pick >= 0 ? Object.keys(LETTER_WORDS)[run[k].pick] : null));
    const conf = k < 0 ? null : r2(Math.max.apply(null, runs.map(run => (run[k] ? run[k].pickConfidence || 0 : 0))));
    return { line: it.line, seconds: r2(m.seconds), leadSeconds: r2(m.lead), tailSeconds: r2(m.tail), levelDb: r2(m.level), peakDb: r2(m.peak),
             wordsPerSecond: r2(n / m.speech), letter: it.letter, letterRuns: picks, letterConfidence: conf };
  });
  /* The record that ships beside the clips: what was measured, and what
     the recogniser chose each time. */
  fs.writeFileSync(CHECK, JSON.stringify({
    method: 'tools/voice check: each shipped MP3 decoded to 16 kHz; lengths and levels measured in 10 ms frames; each letter line given three times to ' +
      'Windows\' offline speech recogniser (System.Speech, en-US) with the sentence that names the letter, once with each of M, S, O and T. ' +
      'null: it matched none of the four. Not a person listening.',
    checked: new Date().toISOString().slice(0, 10),
    clips: rows
  }, null, 2) + '\n');
  rows.forEach(r => console.log([r.line, r.seconds.toFixed(2) + 's', 'lead ' + r.leadSeconds.toFixed(2), 'tail ' + r.tailSeconds.toFixed(2), r.levelDb.toFixed(1) + 'dB',
    'pk ' + r.peakDb.toFixed(1), r.wordsPerSecond.toFixed(2) + 'w/s', r.letter ? 'letter ' + r.letter + '→' + r.letterRuns.join('/') + ' (' + r.letterConfidence.toFixed(2) + ')' : ''].join(' | ')));
  const letters = rows.filter(r => r.letter);
  const every = letters.filter(r => r.letterRuns.every(p => p === r.letter)).length;
  const some = letters.filter(r => r.letterRuns.some(p => p === r.letter)).length;
  const wrong = letters.filter(r => r.letterRuns.some(p => p && p !== r.letter)).length;
  console.log('\n' + rows.length + ' clips; letter lines heard as intended in every run: ' + every + ' of ' + letters.length + ', in at least one: ' + some +
    ', ever heard as another letter: ' + wrong + '; record in tools/voice/check.json');
}

module.exports = { fileName, ssml, inputText, mp3Seconds, readWav, writeWav, measure, finish, encode, wer, norm, letterPhrases, take, spent, DISCLOSURE };

if(require.main === module){
  const [cmd, ...rest] = process.argv.slice(2);
  const run = { voices: () => voices(), audition: () => audition(rest), make: () => make(rest), build: () => build(), check: () => check() }[cmd];
  if(!run){ console.log('usage: node tools/voice/voice.js voices | audition <voice>... | make [line...] | build | check'); process.exit(1); }
  Promise.resolve().then(run).catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
}
