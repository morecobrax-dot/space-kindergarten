'use strict';
/* STAR — the reward. A puffy five-point star of warm yellow clay, thicker
   in the middle like a pressed cookie, with rounded tips and orange edges.
   It is lit by the same key as everything else and gives a little warm
   light of its own: stars are one of the world's warm accents. */
const C = require('../clay.js');
const { len2, smoothstep, hex, mix3, clamp } = C;

const R = 0.9, RF = 0.52, ROUND = 0.15;
const TILT = -0.16, TURN = 0.32;

function local(x, y, z){
  // turn the star a little toward the light, so its thickness shows
  const cy = Math.cos(TURN), sy = Math.sin(TURN);
  const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
  const cz = Math.cos(TILT), sz = Math.sin(TILT);
  return [x1 * cz - y * sz, x1 * sz + y * cz, z1];
}
function d2(lx, ly){ return C.SD.star2(lx, ly - 0.02, R - ROUND, RF); }

function build(){
  const W = 256, H = 256, D = 10, frame = 1.96;
  return {
    width: W, height: H, scale: 1, seed: 61, spp: 4, aoRange: 0.06,
    camera: { pos: [0, 0.1, D], target: [0, 0.02, 0], fov: 2 * Math.atan((frame / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.2 },
    materials: [
      C.clay({ albedo: hex('#FFC93A'), sss: 0.85, sheen: 0.16, spec: 0.06, stroke: 0.002, rim: 0.35, emissive: [0.05, 0.035, 0.005] })
    ],
    map(x, y, z, rec){
      const p = local(x, y, z);
      const s = d2(p[0], p[1]);
      // puffy: thicker in the middle
      const h = 0.12 + 0.16 * clamp(1 - len2(p[0], p[1]) / R, 0, 1);
      if(rec) rec.m = 0;
      return C.SD.extrude(s, p[2], h + ROUND * 0.5, ROUND) * 0.85;
    },
    albedoAt(x, y, z){
      const p = local(x, y, z);
      const s = d2(p[0], p[1]);
      return mix3(hex('#FFD54A'), hex('#FF9A2A'), smoothstep(-0.16, 0.02, s));
    }
  };
}
function post(buf, W, H, CH){
  C.addHalo(buf, W, H, CH, { radius: W * 0.05, strength: 0.28, color: hex('#FFD66B') });
}
module.exports = { build: build, post: post };
