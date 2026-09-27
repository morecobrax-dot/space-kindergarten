'use strict';
/* PEDESTAL — a small Mars rock plinth a word picture stands on in Sound
   Scout (three stand side by side, one under each picture). A low,
   hand-made drum of rust clay, a little narrower at the top: an exactly
   flat top, lighter and warmer (where the picture stands), a softly
   rounded top edge, an irregular outline, a few soft thumb dimples round
   its side (never the top) and a deeper red foot. An invisible floor
   catches a soft contact shadow. (A regular drum read as a machined puck;
   a pebble cut flat lost its top.)

   Seen by the word pictures' own camera (picture.js: the same distance,
   the same gentle elevation, the same scale per pixel), so a picture's
   perspective matches the plinth's top.

   Anchor: the top face's centre, TOP, projected by the camera; the app
   stands a picture there. */
const C = require('../clay.js');
const { len2, len3, smax, hex, smoothstep, mix3 } = C;
const PIC = require('./picture.js').camera;

const R = 0.82, RB = 0.92, HALF = 0.21, ROUND = 0.13;    // top radius, foot radius, half-height, rim rounding
const TOP_Y = 2 * HALF;                                   // the flat top; the foot is on the ground at y = 0
const TOP = [0, TOP_Y, 0];
const noise = C.makeNoise(89);

/* soft thumb dimples round the side: angle, height (from the middle), size */
const DIMPLES = [[0.75, 0.0, 0.19], [2.4, 0.02, 0.17], [3.7, -0.01, 0.19], [5.3, 0.01, 0.18]]
  .map(k => ({ x: Math.cos(k[0]) * (R + 0.05 + k[2] - 0.055), y: HALF + k[1], z: Math.sin(k[0]) * (R + 0.05 + k[2] - 0.055), r: k[2] }));

/* an isosceles trapezoid in 2D (exact): bottom half-width r1, top r2 */
function trapezoid2(px, py, r1, r2, he){
  const k1x = r2, k1y = he, k2x = r2 - r1, k2y = 2 * he;
  px = Math.abs(px);
  const cax = px - Math.min(px, py < 0 ? r1 : r2), cay = Math.abs(py) - he;
  const t = C.clamp(((k1x - px) * k2x + (k1y - py) * k2y) / (k2x * k2x + k2y * k2y), 0, 1);
  const cbx = px - k1x + k2x * t, cby = py - k1y + k2y * t;
  const s = (cbx < 0 && cay < 0) ? -1 : 1;
  return s * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby));
}

function plinth(x, y, z){
  // an irregular round outline, as a hand-made rock has
  const a = Math.atan2(z, x);
  const q = len2(x, z) * (1 + 0.035 * Math.sin(3 * a + 0.8) + 0.018 * Math.sin(5 * a + 2.2));
  let d = trapezoid2(q, y - HALF, RB - ROUND, R - ROUND, HALF - ROUND) - ROUND;
  // lumpiness on the side only, so the top stays exactly flat
  d += smoothstep(TOP_Y - 0.05, TOP_Y - 0.17, y) * 0.026 * noise(x * 1.5, y * 1.5, z * 1.5);
  for(const D of DIMPLES) d = smax(d, -(len3(x - D.x, y - D.y, z - D.z) - D.r), 0.07);
  return d;
}

function build(){
  const W = 384, H = 200;
  const frameH = PIC.FRAME * H / PIC.H;                   // the pictures' scale per pixel
  const target = [0, 0.16, 0];
  const SIDE = hex('#BC5D39'), TOPC = hex('#D9805A'), FOOTC = hex('#A24A2F');
  return {
    width: W, height: H, scale: 1, seed: 89, spp: 3, aoRange: 0.08,
    camera: { pos: [target[0], target[1] + PIC.D * Math.sin(PIC.ELEV), PIC.D * Math.cos(PIC.ELEV)], target: target,
              fov: 2 * Math.atan((frameH / 2) / PIC.D) * 180 / Math.PI },
    bounds: { center: [0, 0.2, 0], radius: 1.3 },
    materials: [
      C.clay({ albedo: SIDE, rim: 0.5 }),                                          // 0 rock (see albedoAt)
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.1, 0.12], fadeRadius: 1.05 })                        // 1 shadow catcher
    ],
    map(x, y, z, rec){
      let d = plinth(x, y, z), m = 0;
      // a thin floor sheet (a solid one catches rays entering the bounds from below)
      const floor = Math.max(y, -0.03 - y, len2(x, z) - 1.25);
      if(floor < d){ d = floor; m = 1; }
      if(rec) rec.m = m;
      // a little under 1, so a surface facing the key head-on never reads
      // as shadowed by itself (see picture.js)
      return d * 0.92;
    },
    albedoAt(x, y, z, mi, mat){
      if(mi !== 0) return mat.albedo;
      return mix3(mix3(FOOTC, SIDE, smoothstep(0.03, 0.14, y)), TOPC, smoothstep(TOP_Y - 0.07, TOP_Y - 0.005, y));
    }
  };
}
module.exports = { build: build, TOP: TOP };
