'use strict';
/* SPACE — the backdrop behind every child scene. Near-black navy deepening
   to blue low down, a faint cool haze, and sparse stars: most of the sky is
   left empty on purpose, because negative space is what makes the planets
   read as the stars of the show. One small planet far behind everything is
   out of focus, the way a lens on a miniature set would see it. */
const C = require('../clay.js');
const { hex, mix, smoothstep, clamp } = C;

const W = 2400, H = 1600;
const noise = C.makeNoise(91);

const TOP = hex('#03050E'), MID = hex('#070D27'), LOW = hex('#0D1841');
const GLOW_LOW = hex('#15306E'), HAZE = hex('#1E1850');

/* Stars, bucketed by cell so a pixel only looks at its neighbours. */
const CELL = 64;
const STARS = (function(){
  const r = C.rng(93);
  const list = [];
  for(let i = 0; i < 170; i++){
    const b = Math.pow(r(), 2.6);
    list.push({
      x: r() * W, y: r() * H,
      size: 0.7 + b * 1.6,
      bright: 0.25 + b * 1.6,
      tint: r() < 0.2 ? hex('#FFE7C2') : (r() < 0.5 ? hex('#DDE8FF') : hex('#FFFFFF')),
      sparkle: b > 0.72
    });
  }
  return list;
})();
const GRID = new Map();
STARS.forEach(s => {
  const cx = Math.floor(s.x / CELL), cy = Math.floor(s.y / CELL);
  for(let dx = -1; dx <= 1; dx++) for(let dy = -1; dy <= 1; dy++){
    const k = (cx + dx) + ',' + (cy + dy);
    if(!GRID.has(k)) GRID.set(k, []);
    GRID.get(k).push(s);
  }
});

/* The one distant planet: soft peach, lit from the upper left like the rest
   of the world, and out of focus. */
const FAR = { x: 0.15 * W, y: 0.22 * H, r: 0.028 * H, soft: 9 };

/* u, v in 0–1; everything below is measured in pixels of the 2400×1600
   design, so any output size frames the same sky. */
function pixel(u, v){
  const px = u * W, py = v * H;
  // base: vertical depth, then a low blue glow and a faint violet haze
  const t = Math.pow(v, 1.25);
  let c = t < 0.5 ? C.mix3(TOP, MID, t * 2) : C.mix3(MID, LOW, (t - 0.5) * 2);
  const gl = Math.exp(-((u - 0.18) * (u - 0.18) + (v - 1.05) * (v - 1.05)) / 0.35) * 0.42;
  const hz = Math.exp(-((u - 0.86) * (u - 0.86) + (v - 0.08) * (v - 0.08)) / 0.14) * 0.4;
  c = [c[0] + GLOW_LOW[0] * gl + HAZE[0] * hz, c[1] + GLOW_LOW[1] * gl + HAZE[1] * hz, c[2] + GLOW_LOW[2] * gl + HAZE[2] * hz];
  // a very quiet nebula texture
  const n = 1 + 0.12 * C.fbm(noise, u * 3.2, v * 2.2, 0.5, 3);
  c = [c[0] * n, c[1] * n, c[2] * n];
  // vignette: the eye stays in the middle
  const vg = 1 - 0.32 * ((u - 0.5) * (u - 0.5) * 1.4 + (v - 0.45) * (v - 0.45));
  c = [c[0] * vg, c[1] * vg, c[2] * vg];

  // the distant planet
  const fx = (px - FAR.x) / FAR.r, fy = (py - FAR.y) / FAR.r;
  const fd = Math.sqrt(fx * fx + fy * fy);
  if(fd < 1 + FAR.soft / FAR.r * 2){
    const cov = smoothstep(1 + FAR.soft / FAR.r, 1 - FAR.soft / FAR.r, fd);
    if(cov > 0){
      const nz = Math.sqrt(Math.max(0, 1 - Math.min(fd, 1) * Math.min(fd, 1)));
      const lit = clamp(0.25 + 0.75 * (-fx * 0.6 - fy * 0.62 + nz * 0.46), 0.08, 1);
      const pc = C.mix3(hex('#2A1C48'), hex('#D69482'), lit);
      const k = cov * 0.42;
      c = C.mix3(c, pc, k);
    }
  }

  // stars
  const key = Math.floor(px / CELL) + ',' + Math.floor(py / CELL);
  const near = GRID.get(key);
  if(near){
    for(const s of near){
      const dx = px - s.x, dy = py - s.y;
      const d2 = dx * dx + dy * dy;
      if(d2 > 900) continue;
      let e = s.bright * Math.exp(-d2 / (2 * s.size * s.size));
      e += s.bright * 0.035 * Math.exp(-d2 / (2 * 12 * s.size * s.size));
      if(s.sparkle){
        const ax = Math.abs(dx), ay = Math.abs(dy);
        e += s.bright * 0.13 * (Math.exp(-ax / 0.7) * Math.exp(-ay / 9) + Math.exp(-ay / 0.7) * Math.exp(-ax / 9));
      }
      c = [c[0] + s.tint[0] * e, c[1] + s.tint[1] * e, c[2] + s.tint[2] * e];
    }
  }
  return [c[0], c[1], c[2], 1];
}

function build(){
  return { width: W, height: H, designWidth: W, scale: 1, seed: 91, spp: 2, pixel: pixel, fillsFrame: true,
           camera: { pos: [0, 0, 1], target: [0, 0, 0], fov: 30 }, bounds: { center: [0, 0, 0], radius: 1 },
           materials: [C.clay({})], map(){ return 1e9; } };
}
module.exports = { build: build };
