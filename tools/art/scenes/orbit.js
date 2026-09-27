'use strict';
/* ORBIT — Word Orbit's marker on Jupiter: a friendly clay orbit gadget,
   like a toy orrery. A round lavender clay ball (a little moon, with one
   fingertip crater) sits on a short lavender neck on a stubby round teal
   base, and a slim ring of amber clay circles it, tipped up to the right
   and toward us so it reads as an orbit. Two tiny round coral satellites
   ride on top of the ring, each with a little glass lamp. An invisible
   floor catches its contact shadow.

   Variants:
     off  waiting: the ring is quiet clay, the lamps dull glass
     on   fixed: the ring glows warm, the satellites' lamps light, with a
          gentle bloom

   Anchor: its foot (the base's centre on the ground) is FOOT, projected
   by the camera; the app stands the marker there. */
const C = require('../clay.js');
const { len2, len3, smin, smax, hex, clamp, norm3, cross3 } = C;

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

const BASE_R = 0.42, BASE_H = 0.3;                  // the stubby base
const BALL = [0, 0.98, 0], BALL_R = 0.34;           // the little moon
/* the ring: tipped up to the right (about z) and toward us (about x) */
const TIP_Z = 0.36, TIP_X = 0.4;
const RING_N = norm3([-Math.sin(TIP_Z), Math.cos(TIP_Z) * Math.cos(TIP_X), Math.cos(TIP_Z) * Math.sin(TIP_X)]);
const RING_U = norm3(cross3([0, 0, 1], RING_N).map(v => -v));   // in the ring's plane, to the right
const RING_V = cross3(RING_U, RING_N);                          // in the ring's plane, toward us
const RING_R = 0.7, RING_T = 0.048;                             // its radius and the coil's thickness
/* two satellites riding on it: where round the ring (0 right, π/2 front) */
const SAT_R = 0.085, LAMP_R = 0.04;
const SATS = [0.95, 2.75].map(th => {
  const p = [BALL[0] + RING_R * (Math.cos(th) * RING_U[0] + Math.sin(th) * RING_V[0]),
             BALL[1] + RING_R * (Math.cos(th) * RING_U[1] + Math.sin(th) * RING_V[1]),
             BALL[2] + RING_R * (Math.cos(th) * RING_U[2] + Math.sin(th) * RING_V[2])];
  const lift = RING_T + SAT_R * 0.72;
  const c = [p[0] + RING_N[0] * lift, p[1] + RING_N[1] * lift, p[2] + RING_N[2] * lift];
  const up = SAT_R + LAMP_R * 0.35;
  return { c: c, lamp: [c[0] + RING_N[0] * up, c[1] + RING_N[1] * up, c[2] + RING_N[2] * up] };
});
/* one fingertip crater on the little moon, high on its lit side: a
   direction and a size (a pair of them read as a face) */
const CRATERS = [[norm3([-0.38, 0.42, 0.82]), 0.1]];
const FOOT = [0, 0, 0];

function build(variant){
  const on = variant === 'on';
  const W = 480, H = 400, D = 12, ELEV = 0.3;
  const frameH = 1.96;
  const target = [0.08, 0.72, 0];
  const yFloor = 0.0;
  return {
    width: W, height: H, scale: 1, seed: 89, spp: 3, aoRange: 0.07,
    camera: { pos: [target[0], target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.8, 0], radius: 1.55 },
    // on: each lamp lights its satellite, and the glowing ring's near side
    // warms the front of the little moon
    points: on ? SATS.map(s => ({ pos: s.lamp, color: [1.0, 0.76, 0.42], intensity: 0.9, radius: 0.18 }))
                   .concat([{ pos: [BALL[0] + RING_V[0] * 0.55, BALL[1] + RING_V[1] * 0.55 - 0.05, BALL[2] + RING_V[2] * 0.55],
                              color: [1.0, 0.72, 0.4], intensity: 0.7, radius: 0.35 }]) : [],
    materials: [
      C.clay({ albedo: hex('#A59CC4') }),                                          // 0 the little moon
      C.clay({ albedo: hex('#2AAFB8') }),                                          // 1 base
      C.clay({ albedo: hex('#9D93D6') }),                                          // 2 neck
      C.clay(on ? { albedo: hex('#FFA94D'), rim: 0.3, grain: 0, stroke: 0.0003, emissive: [0.34, 0.13, 0.02] }
                : { albedo: hex('#C29456'), rim: 0.5, grain: 0, stroke: 0.0003 }), // 3 ring
      C.clay({ albedo: hex('#FF8A76'), rim: 0.6 }),                                // 4 satellites
      C.clay({ albedo: on ? hex('#FFD98A') : hex('#9E97B8'), spec: 0.8, specPow: 50, sheen: 0.2,
               grain: 0.0002, stroke: 0, prints: 0, sss: 0.3, rim: on ? 0.3 : 1,
               emissive: on ? [2.4, 1.4, 0.4] : null }),                            // 5 lamps
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.1, 0.04], fadeRadius: 1.05 })                        // 6 shadow catcher
    ],
    map(x, y, z, rec){
      // the base: a stubby rounded drum, a little wider at its foot (an
      // exact revolved profile, as the radar's)
      let d = trapezoid2(len2(x, z), y - BASE_H * 0.5, BASE_R + 0.03 - 0.09, BASE_R - 0.03 - 0.09, BASE_H * 0.5 - 0.09) - 0.09, m = 1;
      // the neck, up into the little moon
      const neck = C.SD.capsule(x, y, z, 0, BASE_H - 0.05, 0, BALL[0], BALL[1] - BALL_R * 0.6, BALL[2], 0.08);
      if(neck < d + 0.05){ const b = smin(d, neck, 0.05); if(neck < d) m = 2; d = b; }
      // the little moon, with a fingertip crater pressed in
      const bx = x - BALL[0], by = y - BALL[1], bz = z - BALL[2];
      let ball = len3(bx, by, bz) - BALL_R;
      for(const K of CRATERS){
        const cx = BALL_R * 1.08 * K[0][0], cy = BALL_R * 1.08 * K[0][1], cz = BALL_R * 1.08 * K[0][2];
        ball = smax(ball, -(len3(bx - cx, by - cy, bz - cz) - K[1]), 0.03);
      }
      if(ball < d + 0.03){ const b = smin(d, ball, 0.03); if(ball < d) m = 0; d = b; }
      // the ring, in its own plane
      const rn = bx * RING_N[0] + by * RING_N[1] + bz * RING_N[2];
      const ru = bx * RING_U[0] + by * RING_U[1] + bz * RING_U[2];
      const rv = bx * RING_V[0] + by * RING_V[1] + bz * RING_V[2];
      const ring = len2(len2(ru, rv) - RING_R, rn) - RING_T;
      if(ring < d){ d = ring; m = 3; }
      // the satellites, sitting on it, and their lamps
      for(const S of SATS){
        const sat = len3(x - S.c[0], y - S.c[1], z - S.c[2]) - SAT_R;
        if(sat < d + 0.025){ const b = smin(d, sat, 0.025); if(sat < d) m = 4; d = b; }
        const lamp = len3(x - S.lamp[0], y - S.lamp[1], z - S.lamp[2]) - LAMP_R;
        if(lamp < d){ d = lamp; m = 5; }
      }
      // the invisible floor
      const floor = Math.max(y - yFloor, len2(x, z) - 1.6);
      if(floor < d){ d = floor; m = 6; }
      if(rec) rec.m = m;
      // a little under 1, so a surface facing the key head-on never reads
      // as shadowed by itself (see picture.js)
      return d * 0.92;
    }
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.02, 0.32); C.addGlow(buf, W, H, CH, W * 0.06, 0.22); }
}
module.exports = { build: build, post: post, FOOT: FOOT };
