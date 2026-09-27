'use strict';
/* BEAT STONE — a big round clay asteroid a child taps once for each beat:
   a short, wide, drum-like lump of warm amber-grey stone. Its top is
   broad, smooth and gently domed, like a drum skin, and seen from a
   raised camera so it reads as the thing to tap. A few soft dimples are
   pressed into its side (never the top), and its side bulges a little,
   as a hand-made asteroid would. An invisible floor catches a soft
   contact shadow.

   Anchor: the app centres its tap target on the top face's centre, the
   dome's highest point (SHIFT, TOP, 0): 51.2%, 32.9% of the 512×400
   picture. Move it and the CSS moves too. */
const C = require('../clay.js');
const { len2, len3, smax, hex, clamp, smoothstep, mix3 } = C;

const R = 1.3, RB = 1.2, HALF = 0.42, ROUND = 0.18;   // the drum: top and bottom radius
const DOME = 0.08;                                     // the top rises this much in the middle
const TOP = HALF + DOME;                               // the dome's highest point
const ELEV = 0.52, D = 14;
const SHIFT = 0.04;                                    // centres the irregular outline in the frame
const SIDE = hex('#AC957C'), TOPC = hex('#BCA58A');     // greyer sides, a warmer top to tap
const noise = C.makeNoise(97);

/* soft thumb dimples around the side: angle, height, size. Each is a big
   sphere mostly outside the clay, so it presses a wide, shallow dent. */
const DIMPLES = [
  [0.55, 0.0, 0.34], [1.45, -0.04, 0.3], [2.35, 0.02, 0.34], [3.4, -0.02, 0.32], [4.6, 0.02, 0.33], [5.55, -0.03, 0.31]
].map(k => ({ x: Math.cos(k[0]) * (R + k[2] - 0.1), y: k[1], z: Math.sin(k[0]) * (R + k[2] - 0.1), r: k[2] }));

/* an isosceles trapezoid in 2D (exact): bottom half-width r1, top r2 */
function trapezoid2(px, py, r1, r2, he){
  const k1x = r2, k1y = he, k2x = r2 - r1, k2y = 2 * he;
  px = Math.abs(px);
  const cax = px - Math.min(px, py < 0 ? r1 : r2), cay = Math.abs(py) - he;
  const t = clamp(((k1x - px) * k2x + (k1y - py) * k2y) / (k2x * k2x + k2y * k2y), 0, 1);
  const cbx = px - k1x + k2x * t, cby = py - k1y + k2y * t;
  const s = (cbx < 0 && cay < 0) ? -1 : 1;
  return s * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby));
}

function stone(x, y, z){
  // a slightly irregular round outline, as a hand-made asteroid has
  const a = Math.atan2(z, x);
  const q = len2(x, z) * (1 + 0.025 * Math.sin(3 * a + 1.1) + 0.015 * Math.sin(5 * a + 0.4));
  // a drum narrowing a little toward the ground, its rims rounded; the
  // upper half is raised toward the middle, so the top is one smooth dome
  const rise = DOME * Math.max(0, 1 - (q / R) * (q / R)) * smoothstep(-0.4, 0.4, y);
  let d = trapezoid2(q, y - rise, RB - ROUND, R - ROUND, HALF - ROUND) - ROUND;
  // asteroid lumpiness, on the side only (wide, gentle mask): the top stays smooth
  const side = smoothstep(0.34, -0.1, y) * smoothstep(0.62, 0.98, q / R);
  d += side * 0.028 * noise(x * 1.3, y * 1.3, z * 1.3);
  // pressed dimples
  for(const k of DIMPLES){
    const dd = len3(x - k.x, y - k.y, z - k.z) - k.r;
    d = smax(d, -dd, 0.1);
  }
  return d * 0.9;
}

function build(){
  const W = 512, H = 400;
  const frameW = 3.44, frameH = frameW * H / W;
  const yGround = -HALF - 0.03;
  const target = [0, -0.02, 0];
  return {
    width: W, height: H, scale: 1, seed: 97, spp: 3, aoRange: 0.1,
    camera: { pos: [0, target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, -0.1, 0], radius: 2.1 },
    materials: [
      C.clay({ albedo: hex('#B49E84'), rim: 0.5 }),                                // 0 stone (see albedoAt)
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.9,
               fadeCenter: [0.12 + SHIFT, 0.35], fadeRadius: 1.52 })               // 1 shadow catcher
    ],
    map(x, y, z, rec){
      let d = stone(x - SHIFT, y, z), m = 0;
      const floor = Math.max(y - yGround, len2(x - SHIFT, z) - 2.0);
      if(floor < d){ d = floor; m = 1; }
      if(rec) rec.m = m;
      return d;
    },
    albedoAt(x, y, z, mi, mat){
      return mi === 0 ? mix3(SIDE, TOPC, smoothstep(HALF - 0.2, HALF + 0.03, y)) : mat.albedo;
    }
  };
}
module.exports = { build: build };
