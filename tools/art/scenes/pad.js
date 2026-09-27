'use strict';
/* PAD — the Rocket Dock's launch pad: a thick round slab of Moon clay with
   a ring pressed into its top and six small warm lamps around the rim. The
   rocket stands on it; the app draws the rocket's contact shadow. */
const C = require('../clay.js');
const { len2, smin, smax, hex } = C;

const LAMPS = 6;

function build(){
  const W = 1200, H = 480;
  const lamps = [];
  for(let i = 0; i < LAMPS; i++){
    const a = (i + 0.5) / LAMPS * Math.PI * 2;
    lamps.push([Math.cos(a) * 0.93, 0.02, Math.sin(a) * 0.93]);
  }
  return {
    width: W, height: H, scale: 1, seed: 111, spp: 3, aoRange: 0.06,
    camera: { pos: [0, 1.3, 4.2], target: [0, -0.06, 0], fov: 18 },
    bounds: { center: [0, -0.05, 0], radius: 1.25 },
    points: lamps.map(p => ({ pos: [p[0], p[1] + 0.08, p[2]], color: [1.0, 0.78, 0.45], intensity: 0.5, radius: 0.18 })),
    materials: [
      C.clay({ albedo: hex('#A99FC6'), stroke: 0.0026 }),                         // 0 slab
      C.clay({ albedo: hex('#FFE3A0'), spec: 0.6, specPow: 40, grain: 0.0002, stroke: 0, prints: 0,
               emissive: [2.2, 1.6, 0.7] }),                                      // 1 lamps
      C.clay({ albedo: hex('#8E84B3') })                                          // 2 pressed ring
    ],
    map(x, y, z, rec){
      const q = len2(x, z);
      let d = C.SD.roundCylinder(x, y + 0.1, z, 1.0, 0.1, 0.07);
      let m = 0;
      // a ring pressed into the top, and a shallow centre dish
      const ring = len2(q - 0.62, y - 0.0) - 0.035;
      if(ring < 0.03){ const b = smax(d, -ring, 0.02); if(ring < 0.012 && y > -0.04) m = 2; d = b; }
      const dish = C.SD.ellipsoid(x, y - 0.07, z, 0.4, 0.05, 0.4);
      d = smax(d, -dish, 0.03);
      for(const L of lamps){
        const l = C.SD.sphere(x - L[0], y - L[1], z - L[2], 0.055);
        if(l < d){ d = l; m = 1; }
      }
      if(rec) rec.m = m;
      return d;
    }
  };
}
function post(buf, W, H, CH){ C.addGlow(buf, W, H, CH, W * 0.012, 0.5); }
module.exports = { build: build, post: post };
