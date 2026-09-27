'use strict';
/* SPACE — the deep sky behind every world, in three layers so the camera
   can move through it:
     bg    near-black navy deepening to blue low down, a faint cool haze.
           No stars: they live in their own layers.
     far   many tiny, dim stars — the distant field. Moves slowly.
     near  a handful of brighter stars. Moves faster: that difference is
           what makes a flight feel like travelling through space.
   Most of the sky is left empty on purpose: negative space is what makes
   the worlds read as the stars of the show. The star layers are taller
   than the screen, so they can slide during a flight without an edge. */
const C = require('../clay.js');
const { hex, smoothstep } = C;

const noise = C.makeNoise(91);
const TOP = hex('#02040C'), MID = hex('#060B22'), LOW = hex('#0B1538');
const GLOW_LOW = hex('#12295E'), HAZE = hex('#191447');

function bgPixel(u, v){
  const t = Math.pow(v, 1.2);
  let c = t < 0.5 ? C.mix3(TOP, MID, t * 2) : C.mix3(MID, LOW, (t - 0.5) * 2);
  const gl = Math.exp(-((u - 0.5) * (u - 0.5) * 0.6 + (v - 1.1) * (v - 1.1)) / 0.3) * 0.5;
  const hz = Math.exp(-((u - 0.85) * (u - 0.85) + (v - 0.1) * (v - 0.1)) / 0.12) * 0.35;
  c = [c[0] + GLOW_LOW[0] * gl + HAZE[0] * hz, c[1] + GLOW_LOW[1] * gl + HAZE[1] * hz, c[2] + GLOW_LOW[2] * gl + HAZE[2] * hz];
  const n = 1 + 0.08 * C.fbm(noise, u * 3.2, v * 2.2, 0.5, 3);
  const vg = 1 - 0.3 * ((u - 0.5) * (u - 0.5) * 1.4 + (v - 0.45) * (v - 0.45));
  return [c[0] * n * vg, c[1] * n * vg, c[2] * n * vg, 1];
}

/* A star field, bucketed by cell so a pixel only looks at its neighbours.
   Sizes and positions are in pixels of the 2400×2200 design. */
function starField(seed, count, sizeMin, sizeSpan, brightMin, brightSpan, sparkleAbove){
  const DW = 2400, DH = 2200, CELL = 64;
  const r = C.rng(seed);
  const stars = [];
  for(let i = 0; i < count; i++){
    const b = Math.pow(r(), 2.4);
    stars.push({ x: r() * DW, y: r() * DH, size: sizeMin + b * sizeSpan, bright: brightMin + b * brightSpan,
                 tint: r() < 0.18 ? hex('#FFE8C4') : (r() < 0.5 ? hex('#DCE6FF') : hex('#FFFFFF')),
                 sparkle: b > sparkleAbove });
  }
  const grid = new Map();
  stars.forEach(s => {
    const cx = Math.floor(s.x / CELL), cy = Math.floor(s.y / CELL);
    for(let dx = -1; dx <= 1; dx++) for(let dy = -1; dy <= 1; dy++){
      const k = (cx + dx) + ',' + (cy + dy);
      if(!grid.has(k)) grid.set(k, []);
      grid.get(k).push(s);
    }
  });
  return function(u, v){
    const px = u * DW, py = v * DH;
    const near = grid.get(Math.floor(px / CELL) + ',' + Math.floor(py / CELL));
    let rr = 0, gg = 0, bb = 0, a = 0;
    if(near){
      for(const s of near){
        const dx = px - s.x, dy = py - s.y, d2 = dx * dx + dy * dy;
        if(d2 > 900) continue;
        let e = s.bright * Math.exp(-d2 / (2 * s.size * s.size));
        e += s.bright * 0.03 * Math.exp(-d2 / (2 * 10 * s.size * s.size));
        if(s.sparkle){
          const ax = Math.abs(dx), ay = Math.abs(dy);
          e += s.bright * 0.1 * (Math.exp(-ax / 0.7) * Math.exp(-ay / 8) + Math.exp(-ay / 0.7) * Math.exp(-ax / 8));
        }
        rr += s.tint[0] * e; gg += s.tint[1] * e; bb += s.tint[2] * e; a += e;
      }
    }
    // a star is light on transparency: straight colour, coverage from its brightness
    const cov = Math.min(1, a);
    return cov > 0 ? [rr / a, gg / a, bb / a, cov] : [0, 0, 0, 0];
  };
}
const FAR = starField(93, 120, 0.55, 0.7, 0.18, 0.55, 2);
const NEAR = starField(97, 16, 0.9, 1.3, 0.45, 1.1, 0.8);

function build(variant){
  if(variant === 'far' || variant === 'near'){
    return { width: 2400, height: 2200, designWidth: 2400, scale: 1, seed: 91, spp: 2,
             pixel: variant === 'far' ? FAR : NEAR, fillsFrame: true,
             camera: { pos: [0, 0, 1], target: [0, 0, 0], fov: 30 }, bounds: { center: [0, 0, 0], radius: 1 },
             materials: [C.clay({})], map(){ return 1e9; } };
  }
  return { width: 1600, height: 1100, designWidth: 1600, scale: 1, seed: 91, spp: 1, pixel: bgPixel, fillsFrame: true,
           camera: { pos: [0, 0, 1], target: [0, 0, 0], fov: 30 }, bounds: { center: [0, 0, 0], radius: 1 },
           materials: [C.clay({})], map(){ return 1e9; } };
}
module.exports = { build: build };
