'use strict';
/* RADAR — a friendly clay satellite dish: a cream dish on a ball joint,
   tipped up and to the right, a little toward us, so its hollow shows and
   sits in soft shade (lit by the key, a glowing tip would vanish against
   it), on a short neck and a stubby round teal base standing on the ground. A little feed rod rises
   from the dish's centre to a round antenna tip. An invisible floor
   catches its contact shadow.

   Variants:
     off  the antenna tip is dull lavender glass
     on   the tip glows warm and lights the inside of the dish

   Anchors (480×480): the base stands on the ground at 45.3%, 83.8%, and
   the antenna tip is at 61.5%, 37.1%. Move one and the CSS moves too. */
const C = require('../clay.js');
const { len2, len3, smin, hex, clamp } = C;

/* a sphere of radius r cut at height h, the part below kept (opening +y),
   with shell half-thickness t: an exact distance, so the hollow shades cleanly */
function cutHollowSphere(x, y, z, r, h, t){
  const w = Math.sqrt(r * r - h * h);
  const qx = len2(x, z), qy = y;
  return ((h * qx < w * qy) ? len2(qx - w, qy - h) : Math.abs(len2(qx, qy) - r)) - t;
}

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

const BASE_R = 0.5, BASE_H = 0.36;               // the stubby base
const JOINT = [0, 0.78, 0], JOINT_R = 0.13;       // the ball the dish sits on
const AXIS = C.norm3([0.62, 0.64, 0.42]);          // where the dish looks: up, right, toward us
const RIM = 0.64, DEPTH = 0.28, SHELL = 0.05;     // dish rim radius, bowl depth, half-thickness
const SR = (RIM * RIM + DEPTH * DEPTH) / (2 * DEPTH), SH = DEPTH - SR;
const DX = C.norm3(C.cross3(AXIS, [0, 0, 1])), DZ = C.cross3(DX, AXIS);
const DC = [JOINT[0] + AXIS[0] * (SR + SHELL + 0.04), JOINT[1] + AXIS[1] * (SR + SHELL + 0.04), JOINT[2] + AXIS[2] * (SR + SHELL + 0.04)];
const FEED0 = [DC[0] - AXIS[0] * SR, DC[1] - AXIS[1] * SR, DC[2] - AXIS[2] * SR];
const TIP = [FEED0[0] + AXIS[0] * 0.44, FEED0[1] + AXIS[1] * 0.44, FEED0[2] + AXIS[2] * 0.44];

function build(variant){
  const on = variant === 'on';
  const W = 480, H = 480, D = 12, ELEV = 0.3;
  const frame = 2.08;
  const target = [0.1, 0.78, 0];
  const yFloor = 0.03;
  return {
    width: W, height: H, scale: 1, seed: 67, spp: 3, aoRange: 0.07,
    camera: { pos: [target[0], target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frame / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.85, 0], radius: 1.75 },
    points: on ? [{ pos: [TIP[0] + AXIS[0] * 0.06, TIP[1] + AXIS[1] * 0.06, TIP[2] + AXIS[2] * 0.06],
                    color: [1.0, 0.76, 0.42], intensity: 2.6, radius: 0.34 }] : [],
    materials: [
      C.clay({ albedo: hex('#F1E8D8') }),                                          // 0 dish
      C.clay({ albedo: hex('#2AAFB8') }),                                          // 1 base
      C.clay({ albedo: hex('#9D93D6') }),                                          // 2 neck, joint, feed rod
      C.clay({ albedo: on ? hex('#FFD98A') : hex('#9E97B8'), spec: 0.8, specPow: 50, sheen: 0.2,
               grain: 0.0002, stroke: 0, prints: 0, sss: 0.3, rim: on ? 0.3 : 1,
               emissive: on ? [2.7, 1.55, 0.42] : null }),                          // 3 antenna tip
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.12, -0.05], fadeRadius: 1.05 })                      // 4 shadow catcher
    ],
    map(x, y, z, rec){
      // the base: a stubby rounded drum, a little wider at its foot (an
      // exact revolved profile: a distorted one made the shadows blotch)
      let d = trapezoid2(len2(x, z), y - BASE_H * 0.5, BASE_R + 0.03 - 0.09, BASE_R - 0.03 - 0.09, BASE_H * 0.5 - 0.09) - 0.09, m = 1;
      // the neck and the ball joint
      const neck = C.SD.capsule(x, y, z, 0, BASE_H - 0.05, 0, JOINT[0], JOINT[1], JOINT[2], 0.085);
      if(neck < d + 0.05){ const b = smin(d, neck, 0.05); if(neck < d) m = 2; d = b; }
      const joint = len3(x - JOINT[0], y - JOINT[1], z - JOINT[2]) - JOINT_R;
      if(joint < d){ d = joint; m = 2; }
      // the dish, in its own frame
      const px = x - DC[0], py = y - DC[1], pz = z - DC[2];
      const lx = px * DX[0] + py * DX[1] + pz * DX[2];
      const ly = px * AXIS[0] + py * AXIS[1] + pz * AXIS[2];
      const lz = px * DZ[0] + py * DZ[1] + pz * DZ[2];
      const dish = cutHollowSphere(lx, ly, lz, SR, SH, SHELL);
      if(dish < d){ d = dish; m = 0; }
      // the feed rod and the antenna tip
      const rod = C.SD.capsule(x, y, z, FEED0[0], FEED0[1], FEED0[2], TIP[0], TIP[1], TIP[2], 0.032);
      if(rod < d + 0.03){ const b = smin(d, rod, 0.03); if(rod < d) m = 2; d = b; }
      const tip = len3(x - TIP[0], y - TIP[1], z - TIP[2]) - 0.095;
      if(tip < d){ d = tip; m = 3; }
      // the invisible floor
      const floor = Math.max(y - yFloor, len2(x, z) - 1.6);
      if(floor < d){ d = floor; m = 4; }
      if(rec) rec.m = m;
      // a little under 1, so a surface facing the key head-on never reads
      // as shadowed by itself (see picture.js)
      return d * 0.95;
    }
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.02, 0.35); C.addGlow(buf, W, H, CH, W * 0.07, 0.25); }
}
module.exports = { build: build, post: post };
