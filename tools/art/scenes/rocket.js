'use strict';
/* ROCKET — small, friendly, chunky, toy-like: a round cream clay body with
   a big porthole, a rounded painted nose, one painted band, three thick
   rounded fins and a little nozzle.

   Phase 2 made it chunkier and simpler: a shorter, fatter body, a rounder
   nose, a bigger window and fatter fins, so it reads as a toy from its
   silhouette alone.

   PAINT: the painted parts (nose, band, fins) are rendered in white clay
   and exported a second time as a mask. The app multiplies a paint
   colour through that mask, which is how a matte surface takes a colour —
   so every paint is the same rocket, and a new paint needs no new picture.

   The frame is 640×800. The nozzle's centre is at 50% across; the app
   hangs the flame from the nozzle's bottom (see NOZZLE_BOTTOM). */
const C = require('../clay.js');
const { len2, smin, hex, clamp } = C;

const HULL_R = 0.47, NOSE_H = 0.8, BODY_BOTTOM = -0.66;
const SEAM_NOSE = 0.3, BAND_TOP = -0.3, BAND_BOTTOM = -0.44;
const NOZZLE_Y = -0.72, NOZZLE_BOTTOM = -0.79;

/* The hull as a body of revolution: a round nose on a short straight body
   whose bottom edge is rounded. The body's top is cut flat at y = 0,
   exactly where the nose is as wide as the body, so the seam is smooth. */
function hullProfile(q, y){
  // a slight taper towards the base, as if rolled by hand
  const qq = q * (1 + 0.05 * clamp(-y / -BODY_BOTTOM, 0, 1));
  // a rounded cone nose, blended into the body: a toy rocket, not an egg
  const cone = C.SD.roundCone(0, y, qq, HULL_R, 0.07, NOSE_H - 0.07);
  const nose = y > -0.2 ? smin(ellipse2(qq, y, HULL_R, NOSE_H * 0.45), cone, 0.12) : 1e9;
  const top = 0.5, cy = (BODY_BOTTOM + top) / 2, hy = (top - BODY_BOTTOM) / 2;
  const body = Math.max(roundRect2(qq, y - cy, HULL_R, hy, 0.22), y);
  return Math.min(nose, body) * 0.94;
}
function ellipse2(x, y, a, b){
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
  const g = (t) => Math.exp(-((y - t) / 0.012) * ((y - t) / 0.012));
  return 0.006 * (g(SEAM_NOSE) + g(BAND_TOP) + g(BAND_BOTTOM));
}

/* A fin in its own plane: u runs out from the axis, y up. Short and fat. */
const FIN = [0.3, -0.16, 0.76, -0.48, 0.76, -0.8, 0.3, -0.74];
/* Two fins angled toward the viewer, one behind: a head-on fin would read
   as a plank across the base. */
const FIN_YAWS = [Math.PI / 3, Math.PI, 5 * Math.PI / 3];

const WIN_Y = 0.03, WIN_R = 0.2;

function build(){
  const W = 640, H = 800;
  const frameW = 1.8, frameH = frameW * H / W;
  const D = 8;
  return {
    width: W, height: H, scale: 1, seed: 41, spp: 3, aoRange: 0.08,
    camera: { pos: [0, 0.3, D], target: [0, -0.07, 0], fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, -0.06, 0], radius: 1.2 },
    materials: [
      C.clay({ albedo: hex('#F4EEE3') }),                                   // 0 hull: cream
      C.clay({ albedo: hex('#F3F0F4'), paint: true }),                      // 1 paint: white, tinted in the app
      C.clay({ albedo: hex('#EDE6DA') }),                                   // 2 porthole rim
      C.clay({ albedo: hex('#1E4296'), spec: 1.5, specPow: 50, sheen: 0.2, grain: 0, stroke: 0, sss: 0.2 }), // 3 glass
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
        if(u < 0.12) continue;
        const df = C.SD.extrude(C.SD.poly2(u, y, FIN), w, 0.1, 0.09);
        if(df < d){
          const blended = smin(d, df, 0.05);
          if(df < d) m = 1;
          d = blended;
        }
      }
      // porthole: a rim ring pressed into the curve, and a domed glass bead
      const gz = z - 0.415;
      const ring = len2(len2(x, y - WIN_Y) - WIN_R, gz) - 0.05;
      if(ring < d + 0.02){ const b = smin(d, ring, 0.02); if(ring < d) m = 2; d = b; }
      const glass = C.SD.ellipsoid(x, y - WIN_Y, gz + 0.012, WIN_R * 0.9, WIN_R * 0.9, 0.1);
      if(glass < d){ d = glass; m = 3; }
      // nozzle: a short flared puck under the hull
      const nz = C.SD.roundCylinder(x, y - NOZZLE_Y, z, 0.25 + 0.03 * clamp((NOZZLE_Y - y) / 0.07, -1, 1), 0.07, 0.04);
      if(nz < d){ d = smin(d, nz, 0.02); if(nz <= d + 0.001) m = 4; }
      if(rec) rec.m = m;
      return d;
    }
  };
}

module.exports = { build: build, NOZZLE_BOTTOM: NOZZLE_BOTTOM };
