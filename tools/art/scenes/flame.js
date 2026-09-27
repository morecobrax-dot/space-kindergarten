'use strict';
/* FLAME — sculpted, not painted: tongues of orange clay around a longer
   yellow core, glowing, with a hand-pinched wobble. Shown under the rocket
   only in flight. The top of the frame is the flame's root at the nozzle. */
const C = require('../clay.js');
const { smin, hex } = C;

const noise = C.makeNoise(83);

/* A tongue hanging down from its root: widest at the top, pinched to a tip. */
function tongue(x, y, z, ox, top, len, w){
  return C.SD.roundCone(x - ox, y - (top - len), z, 0.015, w, len);
}

function build(){
  const W = 256, H = 384, frameH = 1.5, D = 10;
  return {
    width: W, height: H, scale: 0.8, seed: 81, spp: 3, aoRange: 0.04, keyScale: 0.6, stepScale: 0.7, rootAtTop: true,
    camera: { pos: [0, -0.62, D], target: [0, -0.68, 0], fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, -0.6, 0], radius: 0.9 },
    materials: [
      C.clay({ albedo: hex('#FF6A28'), stroke: 0.003, emissive: [1.0, 0.26, 0.04] }),  // 0 outer
      C.clay({ albedo: hex('#FFD84F'), stroke: 0.002, emissive: [2.4, 1.7, 0.45] })    // 1 core
    ],
    map(x, y, z, rec){
      // the pinch: a slow wobble that grows toward the tip
      const wob = 0.02 * noise(x * 2.5, y * 3.2, z * 2.5) * Math.min(1, -y * 1.2 + 0.2);
      let outer = tongue(x, y, z, 0, 0.06, 1.3, 0.25);
      // side licks splay outward, the way a flame spreads, not hang like drips
      outer = smin(outer, C.SD.roundCone2(x, y, z, -0.13, -0.02, 0, -0.34, -0.66, 0.02, 0.13, 0.02), 0.05);
      outer = smin(outer, C.SD.roundCone2(x, y, z, 0.13, -0.02, 0, 0.32, -0.74, 0.02, 0.13, 0.02), 0.05);
      outer += wob;
      const core = tongue(x, y, z - 0.1, 0, 0.04, 0.9, 0.14) + wob * 0.6;
      let d = outer, m = 0;
      if(core < d + 0.005){ d = Math.min(d, core); m = 1; }
      if(rec) rec.m = m;
      return d;
    }
  };
}
function post(buf, W, H, CH){ C.addGlow(buf, W, H, CH, W * 0.06, 0.4); }
module.exports = { build: build, post: post };
