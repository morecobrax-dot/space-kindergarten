'use strict';
/* =========================================================
   ENCODE — master PNGs → the WebP files the app ships
   ---------------------------------------------------------
     node tools/art/encode.js
     then open http://127.0.0.1:8397/ in Chrome or Edge
   (…/?only=rocket,gear- encodes only the jobs whose names start so,
   leaving every other shipped picture exactly as it is)

   Node has no WebP encoder, and adding one would mean a new
   dependency. Every Chromium browser has one, so this serves a
   page that loads each master from tools/art/out/, encodes it with
   canvas.toBlob('image/webp'), and posts it back; this script
   writes it to the job's target. The page lists every file and its
   size, and its title becomes DONE when it has finished.

   Safari cannot encode WebP; the page refuses rather than writing
   a PNG with a .webp name.
   ========================================================= */
const http = require('http');
const fs = require('fs');
const path = require('path');
const JOBS = require('./jobs.js');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out');
const PORT = Number(process.env.PORT || 8397);

/* Only targets a job names may be written, and only inside the repo. */
function allowedTarget(target){
  const all = [];
  JOBS.forEach(j => { all.push(j.target); if(j.paintMask) all.push(j.paintMask.target); });
  if(all.indexOf(target) === -1) return null;
  const abs = path.resolve(ROOT, target);
  return abs.indexOf(ROOT + path.sep) === 0 ? abs : null;
}

function list(){
  const items = [];
  JOBS.forEach(j => {
    items.push({ name: j.name, target: j.target, quality: j.quality || 0.8, format: j.format || 'webp' });
    if(j.paintMask) items.push({ name: j.paintMask.name, target: j.paintMask.target, quality: j.paintMask.quality || 0.8, format: 'webp' });
  });
  return items.filter(i => fs.existsSync(path.join(OUT, i.name + '.png')));
}

const PAGE = `<!doctype html><meta charset="utf-8"><title>encoding…</title>
<style>body{font:14px system-ui;background:#0b1030;color:#eef;padding:24px}td{padding:2px 12px}.bad{color:#f88}</style>
<h1>Encoding clay renders</h1><table id="t"></table><p id="s"></p>
<script>
(async function(){
  const items = await (await fetch('/list' + location.search)).json();
  const t = document.getElementById('t');
  let total = 0, failed = 0;
  for(const it of items){
    const img = new Image();
    img.src = '/out/' + it.name + '.png?' + Date.now();
    await img.decode();
    let blob;
    if(it.format === 'png'){
      blob = await (await fetch('/out/' + it.name + '.png')).blob();
    } else {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      blob = await new Promise(r => c.toBlob(r, 'image/webp', it.quality));
      if(!blob || blob.type !== 'image/webp'){ failed++; t.insertAdjacentHTML('beforeend', '<tr class="bad"><td>' + it.name + '</td><td>this browser cannot encode WebP</td></tr>'); continue; }
    }
    const res = await fetch('/save?target=' + encodeURIComponent(it.target), { method: 'POST', body: blob });
    const ok = res.ok;
    if(!ok) failed++;
    total += blob.size;
    t.insertAdjacentHTML('beforeend', '<tr' + (ok ? '' : ' class="bad"') + '><td>' + it.target + '</td><td>' +
      img.naturalWidth + '×' + img.naturalHeight + '</td><td>' + (blob.size / 1024).toFixed(1) + ' KB</td></tr>');
  }
  document.getElementById('s').textContent = items.length + ' files, ' + (total / 1024).toFixed(0) + ' KB' + (failed ? ', ' + failed + ' FAILED' : '');
  document.title = failed ? 'FAILED' : 'DONE';
})().catch(e => { document.title = 'FAILED'; document.body.insertAdjacentHTML('beforeend', '<pre class="bad">' + e + '</pre>'); });
</script>`;

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  if(req.method === 'GET' && u.pathname === '/'){ res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGE); return; }
  if(req.method === 'GET' && u.pathname === '/list'){
    const only = (u.searchParams.get('only') || '').split(',').filter(Boolean);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list().filter(i => !only.length || only.some(o => i.name.indexOf(o) === 0))));
    return;
  }
  if(req.method === 'GET' && u.pathname.indexOf('/out/') === 0){
    const f = path.join(OUT, path.basename(u.pathname));
    if(!fs.existsSync(f)){ res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
    return;
  }
  if(req.method === 'POST' && u.pathname === '/save'){
    const abs = allowedTarget(u.searchParams.get('target') || '');
    if(!abs){ res.writeHead(403); res.end('not a job target'); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.concat(chunks));
      console.log('wrote ' + path.relative(ROOT, abs) + '  ' + (Buffer.concat(chunks).length / 1024).toFixed(1) + ' KB');
      res.writeHead(204); res.end();
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, '127.0.0.1', () => console.log('open http://127.0.0.1:' + PORT + '/ in Chrome or Edge'));
