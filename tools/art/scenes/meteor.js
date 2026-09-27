'use strict';
/* METEOR — a small round clay meteor rock: a lumpy ball with a few soft
   craters pressed in by a fingertip, each with a little raised lip.

   Variants:
     dim  cool grey-lavender clay, unlit: waiting to be caught
     lit  the same rock in warm orange-yellow clay, glowing from inside:
          the glow is strongest where the rock faces us and in its crater
          floors, so it reads as a warm core showing through, plus a small,
          controlled bloom */
const C = require('../clay.js');
const { len3, norm3, smoothstep, hex, mix3 } = C;

const noise = C.makeNoise(53);

/* craters: direction, size (chord), depth, lip */
const CRATERS = [
  [[-0.35, 0.38, 0.86], 0.36, 0.07, 0.02],
  [[0.45, -0.22, 0.87], 0.3, 0.06, 0.018],
  [[-0.5, -0.5, 0.7], 0.24, 0.05, 0.016],
  [[0.55, 0.55, 0.62], 0.2, 0.045, 0.014],
  [[0.05, -0.75, 0.66], 0.18, 0.04, 0.012]
].map(c => ({ d: norm3(c[0]), r: c[1], depth: c[2], lip: c[3] }));

function craterAt(ux, uy, uz){
  let h = 0, floor = 0;
  for(let i = 0; i < CRATERS.length; i++){
    const K = CRATERS[i];
    const dx = ux - K.d[0], dy = uy - K.d[1], dz = uz - K.d[2];
    const c2 = dx * dx + dy * dy + dz * dz;
    const reach = K.r * 1.6;
    if(c2 > reach * reach) continue;
    const t = Math.sqrt(c2) / K.r;
    const bowl = smoothstep(1.05, 0.15, t);
    const lip = Math.exp(-((t - 1.02) / 0.28) * ((t - 1.02) / 0.28));
    h += -K.depth * bowl + K.lip * lip;
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}
/* a squashed, lumpy ball */
const SQ = [1.0, 0.9, 0.95];
function surface(x, y, z){
  const r = len3(x / SQ[0], y / SQ[1], z / SQ[2]);
  const ux = x / (r * SQ[0]), uy = y / (r * SQ[1]), uz = z / (r * SQ[2]);
  const l = len3(ux, uy, uz);
  const nx = ux / l, ny = uy / l, nz = uz / l;
  const lumps = 0.06 * noise(nx * 1.7, ny * 1.7 + 3, nz * 1.7) + 0.02 * noise(nx * 3.6 - 1, ny * 3.6, nz * 3.6);
  return (r - 1 - lumps - craterAt(nx, ny, nz)[0]) * 0.8;
}

function build(variant){
  const lit = variant === 'lit';
  const W = 192, H = 192, D = 10, ELEV = 0.22;
  const frame = 2.62;
  const pos = [0, D * Math.sin(ELEV), D * Math.cos(ELEV)];
  const view = norm3(pos);
  const ROCK = lit ? hex('#FFA23F') : hex('#9C96B6');
  const FLOOR = lit ? hex('#FFC766') : hex('#857EA3');
  const CORE = [0.16, 0.07, 0.01], HOT = [0.62, 0.36, 0.08];
  return {
    width: W, height: H, scale: 1, seed: 53, spp: 3, aoRange: 0.08,
    camera: { pos: pos, target: [0, 0, 0], fov: 2 * Math.atan((frame / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.25 },
    materials: [
      C.clay(lit ? { albedo: ROCK, rim: 0.4, emissive: [0, 0, 0] } : { albedo: ROCK })
    ],
    map(x, y, z, rec){
      if(rec) rec.m = 0;
      return surface(x, y, z);
    },
    albedoAt(x, y, z){
      const r = len3(x, y, z);
      return mix3(ROCK, FLOOR, craterAt(x / r, y / r, z / r)[1] * 0.75);
    },
    emissiveAt: lit ? function(x, y, z){
      // a warm core showing through: brightest facing us and in the craters
      const r = len3(x, y, z), ux = x / r, uy = y / r, uz = z / r;
      const facing = Math.max(0, ux * view[0] + uy * view[1] + uz * view[2]);
      const core = facing * facing;
      const f = craterAt(ux, uy, uz)[1];
      return [CORE[0] * core + HOT[0] * f, CORE[1] * core + HOT[1] * f, CORE[2] * core + HOT[2] * f];
    } : null
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'lit'){ C.addGlow(buf, W, H, CH, W * 0.025, 0.3); C.addGlow(buf, W, H, CH, W * 0.07, 0.18); }
}
module.exports = { build: build, post: post };
