'use strict';
/* =========================================================
   RENDER — turns the scene files into master PNGs
   ---------------------------------------------------------
     node tools/art/render.js              every job
     node tools/art/render.js earth moon   only these

   Masters land in tools/art/out/ (git-ignored). They are the
   lossless source; tools/art/encode.js turns them into the WebP
   files the app ships. Rows are shared across worker threads, so
   a render uses every core the machine has.
   ========================================================= */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const C = require('./clay.js');
const JOBS = require('./jobs.js');

const OUT = path.join(__dirname, 'out');

function loadScene(job){
  const mod = require(path.join(__dirname, 'scenes', job.scene + '.js'));
  const scene = mod.build(job.variant);
  if(job.size){
    // a smaller copy of the same framing (the 192px icon)
    const ratio = scene.height / scene.width;
    scene.width = job.size; scene.height = Math.round(job.size * ratio);
  }
  return { mod: mod, scene: scene };
}

if(!isMainThread){
  const job = workerData.job;
  const { scene } = loadScene(job);
  const R = C.makeRenderer(scene);
  const spp = job.spp || scene.spp || 3;
  for(const y of workerData.rows){
    const buf = new Float32Array(scene.width * R.CH);
    R.renderRow(y, spp, buf);
    parentPort.postMessage({ y: y, buf: buf }, [buf.buffer]);
  }
  parentPort.postMessage({ done: true });
  return;
}

async function renderJob(job){
  const { mod, scene } = loadScene(job);
  const W = scene.width, H = scene.height, CH = 8;
  const buf = new Float32Array(W * H * CH);
  const threads = Math.max(1, Math.min(os.cpus().length - 2, 18));
  const started = Date.now();
  await Promise.all(Array.from({ length: threads }, (_, k) => new Promise((resolve, reject) => {
    const rows = [];
    for(let y = k; y < H; y += threads) rows.push(y);
    const w = new Worker(__filename, { workerData: { job: job, rows: rows } });
    w.on('message', msg => {
      if(msg.done){ w.terminate(); resolve(); return; }
      buf.set(msg.buf, msg.y * W * CH);
    });
    w.on('error', reject);
  })));
  if(mod.post) mod.post(buf, W, H, CH, job.variant, C);
  /* A sprite that reaches its frame edge shows a hard cut line in the app
     (a shadow or a glow sliced off). Backgrounds are meant to fill it. */
  if(!scene.fillsFrame){
    // the flame hangs from the nozzle, so its top edge is meant to be solid
    let edge = 0;
    for(let x = 0; x < W; x++){ edge = Math.max(edge, scene.rootAtTop ? 0 : buf[x * CH + 3], buf[((H - 1) * W + x) * CH + 3]); }
    for(let y = 0; y < H; y++){ edge = Math.max(edge, buf[(y * W) * CH + 3], buf[(y * W + W - 1) * CH + 3]); }
    if(edge > 0.03) console.warn('\n  WARNING: ' + job.name + ' touches its frame edge (alpha ' + edge.toFixed(2) + ') — it will show a cut line');
  }
  const exposure = (scene.exposure || 1) * C.RIG.exposure;
  const rgba = C.toRGBA8(buf, W, H, CH, exposure, 17);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, job.name + '.png'), C.encodePNG(rgba, W, H));
  if(job.paintMask){
    // the paint layer: white where paint goes, its coverage as alpha
    const mask = new Uint8Array(W * H * 4);
    for(let i = 0; i < W * H; i++){
      mask[i * 4] = mask[i * 4 + 1] = mask[i * 4 + 2] = 255;
      mask[i * 4 + 3] = C.clamp(Math.round(buf[i * CH + 7] * 255), 0, 255);
    }
    fs.writeFileSync(path.join(OUT, job.paintMask.name + '.png'), C.encodePNG(mask, W, H));
  }
  return (Date.now() - started) / 1000;
}

async function main(){
  const wanted = process.argv.slice(2);
  const jobs = wanted.length ? JOBS.filter(j => wanted.indexOf(j.name) !== -1 || wanted.indexOf(j.scene) !== -1) : JOBS;
  if(!jobs.length){ console.error('no job matches: ' + wanted.join(', ')); process.exit(1); }
  for(const job of jobs){
    process.stdout.write('rendering ' + job.name + ' … ');
    const s = await renderJob(job);
    console.log(s.toFixed(1) + 's');
  }
}
main().catch(e => { console.error(e && e.stack || e); process.exit(1); });
