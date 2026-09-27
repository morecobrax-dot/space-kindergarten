'use strict';
/* ROCKET — small, friendly, chunky: a cream clay bullet with a porthole,
   three thick fins, a painted nose and band, and a little nozzle.

   PAINT: the painted parts (nose, band, fins) are rendered in white clay
   and exported a second time as a mask. The app multiplies a paint
   colour through that mask, which is how a matte surface takes a colour —
   so every paint is the same rocket, and a new paint needs no new picture.

   Framing matches the old 200:340 layout: the nozzle's centre is at 50%
   across, the flame hangs from about 88% down. */
const C = require('../clay.js');
const { len2, len3, smin, hex, clamp } = C;

const HULL_R = 0.39, NOSE_H = 0.86, BODY_BOTTOM = -0.93;
const SEAM_NOSE = 0.44, BAND_TOP = -0.5, BAND_BOTTOM = -0.64;

/* The hull as a body of revolution: an elliptical nose on a straight body
   whose bottom edge is rounded. The body's top is cut flat at y = 0,
   exactly where the nose is as wide as the body, so the seam is smooth. */
function hullProfile(q, y){
  // a slight taper towards the base, as if rolled by hand
  const qq = q * (1 + 0.07 * clamp(-y / -BODY_BOTTOM, 0, 1));
  const nose = SD2ellipse(qq, y, HULL_R, NOSE_H);
  const top = 0.5, cy = (BODY_BOTTOM + top) / 2, hy = (top - BODY_BOTTOM) / 2;
  const body = Math.max(roundRect2(qq, y - cy, HULL_R, hy, 0.17), y);
  return Math.min(nose, body) * 0.94;
}
function SD2ellipse(x, y, a, b){
  const k0 = len2(x / a, y / b), k1 = len2(x / (a * a), y / (b * b));
  return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(a, b);
}
function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
/* Shallow grooves where the painted pieces meet the hull: separate lumps
   of clay pressed together. */
function seams(y){
  const g = (t) => Math.exp(-((y - t) / 0.011) * ((y - t) / 0.011));
  return 0.0065 * (g(SEAM_NOSE) + g(BAND_TOP) + g(BAND_BOTTOM));
}

/* A fin in its own plane: u runs out from the axis, y up. Swept back. */
const FIN = [0.24, -0.4, 0.68, -0.84, 0.66, -1.1, 0.24, -0.98];
/* Two fins angled toward the viewer, one behind: a head-on fin would read
   as a plank across the base. */
const FIN_YAWS = [Math.PI / 3, Math.PI, 5 * Math.PI / 3];

const WIN_Y = 0.1, WIN_R = 0.165;

function build(){
  const W = 640, H = 1088;
  const frameH = 2.52;
  const D = 8;
  return {
    width: W, height: H, scale: 1, seed: 41, spp: 3, aoRange: 0.08,
    camera: { pos: [0, 0.34, D], target: [0, -0.1, 0], fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, -0.12, 0], radius: 1.35 },
    materials: [
      C.clay({ albedo: hex('#F4EEE3') }),                                   // 0 hull: cream
      C.clay({ albedo: hex('#F3F0F4'), paint: true }),                      // 1 paint: white, tinted in the app
      C.clay({ albedo: hex('#EDE6DA'), stroke: 0.0012 }),                   // 2 porthole rim
      C.clay({ albedo: hex('#1E4296'), spec: 1.6, specPow: 55, sheen: 0.25, grain: 0.0002, stroke: 0, prints: 0, sss: 0.2 }), // 3 glass
      C.clay({ albedo: hex('#5A5373') })                                    // 4 nozzle
    ],
    map(x, y, z, rec){
      const q = len2(x, z);
      // hull, with seams
      let d = hullProfile(q, y) + seams(y);
      let m = (y > SEAM_NOSE || (y < BAND_TOP && y > BAND_BOTTOM)) ? 1 : 0;
      // fins
      for(let i = 0; i < 3; i++){
        const a = FIN_YAWS[i], s = Math.sin(a), c = Math.cos(a);
        const u = x * s + z * c, w = x * c - z * s;
        if(u < 0.1) continue;
        const df = C.SD.extrude(C.SD.poly2(u, y, FIN), w, 0.075, 0.05);
        if(df < d){
          const blended = smin(d, df, 0.04);
          if(df < d) m = 1;
          d = blended;
        }
      }
      // porthole: a rim ring pressed into the curve, and a domed glass bead
      const gz = z - 0.345;
      const ring = len2(len2(x, y - WIN_Y) - WIN_R, gz) - 0.042;
      if(ring < d + 0.02){ const b = smin(d, ring, 0.018); if(ring < d) m = 2; d = b; }
      const glass = C.SD.ellipsoid(x, y - WIN_Y, gz + 0.01, WIN_R * 0.9, WIN_R * 0.9, 0.085);
      if(glass < d){ d = glass; m = 3; }
      // nozzle: a short flared puck under the hull
      const nz = C.SD.roundCylinder(x, y + 0.99, z, 0.2 + 0.05 * clamp((-0.99 - y) / 0.08, -1, 1) * 0.5, 0.075, 0.035);
      if(nz < d){ d = smin(d, nz, 0.02); if(nz <= d + 0.001) m = 4; }
      if(rec) rec.m = m;
      return d;
    }
  };
}

module.exports = { build: build };
