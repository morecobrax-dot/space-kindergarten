'use strict';
/* MERCURY — the second destination, seen from afar: a small warm-stone
   clay planet covered in soft overlapping dimples, closest to the Sun, so
   its sunward side glows a little warm. The same framing as the Moon (a
   sphere filling 84% of a square), so it travels and swaps the same way.

   Variants:
     dim  waiting: quiet, cool shadows, a faint warm edge
     lit  restored: warm light in its dimples and a warm halo */
const C = require('../clay.js');
const { len3, norm3, smoothstep, hex, mix3 } = C;

const noise = C.makeNoise(301);
const DIMPLES = [
  [[-0.35, 0.4, 0.85], 0.26, 0.04], [[0.3, -0.25, 0.92], 0.22, 0.035], [[-0.55, -0.45, 0.7], 0.2, 0.034],
  [[0.6, 0.35, 0.72], 0.17, 0.03], [[0.02, 0.72, 0.69], 0.14, 0.026], [[0.35, -0.75, 0.56], 0.15, 0.028],
  [[-0.15, -0.05, 0.99], 0.1, 0.022], [[-0.85, 0.15, 0.5], 0.16, 0.03], [[0.85, -0.1, 0.5], 0.14, 0.026],
  [[0.1, 0.25, 0.96], 0.07, 0.016], [[-0.4, -0.8, 0.45], 0.12, 0.024]
].map(k => ({ d: norm3(k[0]), r: k[1], depth: k[2] }));

function dimpleAt(u){
  let h = 0, floor = 0;
  for(const K of DIMPLES){
    const c = len3(u[0] - K.d[0], u[1] - K.d[1], u[2] - K.d[2]);
    if(c > K.r * 1.6) continue;
    const t = c / K.r;
    const bowl = smoothstep(1.05, 0.15, t);
    const lip = Math.exp(-((t - 1.02) / 0.26) * ((t - 1.02) / 0.26));
    h += -K.depth * bowl + K.depth * 0.3 * lip;
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}
function surface(x, y, z){
  const r = len3(x, y, z);
  if(r > 1.05) return r - 1.02;
  const inv = 1 / r, u = [x * inv, y * inv, z * inv];
  return (r - 1 - dimpleAt(u)[0] - 0.008 * noise(u[0] * 2.5, u[1] * 2.5, u[2] * 2.5)) * 0.8;
}

const STONE = hex('#BC9677'), STONE_LIGHT = hex('#CBA585'), FLOOR = hex('#937059'), WARM = hex('#FFC98A');

function build(variant){
  const lit = variant === 'lit';
  const W = 560, H = 560, D = 6.2;
  const tanHalf = (1 / Math.sqrt(D * D - 1)) / 0.84;
  return {
    width: W, height: H, scale: 1, seed: 301, spp: 3,
    keyScale: lit ? 1.05 : 0.8,
    camera: { pos: [0, 0.1, D], target: [0, 0, 0], fov: 2 * Math.atan(tanHalf) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.1 },
    materials: [C.clay({ albedo: STONE, rim: 0.6 })],
    map(x, y, z, rec){ if(rec) rec.m = 0; return surface(x, y, z); },
    albedoAt(x, y, z){
      const r = len3(x, y, z), u = [x / r, y / r, z / r];
      const f = dimpleAt(u)[1];
      const m = 0.5 + 0.5 * noise(u[0] * 4 + 7, u[1] * 4, u[2] * 4);
      return mix3(mix3(STONE, STONE_LIGHT, m * 0.45), FLOOR, f * 0.75);
    },
    emissiveAt(x, y, z){
      if(!lit) return null;
      const r = len3(x, y, z);
      const f = dimpleAt([x / r, y / r, z / r])[1];
      return f > 0.05 ? [WARM[0] * 0.2 * f, WARM[1] * 0.2 * f, WARM[2] * 0.2 * f] : null;
    }
  };
}
function post(buf, W, H, CH, variant){
  const lit = variant === 'lit';
  C.addDiskHalo(buf, W, H, CH, { cx: 0.5, cy: 0.5, r: 0.42, width: 0.055, strength: lit ? 0.6 : 0.26,
                                 color: lit ? hex('#FFD29A') : hex('#E6B48C'), towardX: -0.7, towardY: -0.5 });
}
module.exports = { build: build, post: post };
