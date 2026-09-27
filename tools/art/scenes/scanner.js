'use strict';
/* SCANNER — Sound Scout's marker on Mars: a friendly clay listening
   horn. A big flared cream horn with a rolled coral lip, tipped up and to
   the right and toward us so its open bell shows, plugged into a lavender
   ball joint on a short neck, on a sturdy rounded teal base. A little
   antenna leans back from the joint with a small ball on top. An
   invisible floor catches its contact shadow.

   The horn is a revolved profile (a polyline in its own meridian plane),
   so its distance is exact and the hollow shades cleanly.

   Variants:
     off  quiet: the inside of the horn is dark, the antenna ball dull
     on   fixed: a warm glow deep in the horn lights its bell from inside,
          and the antenna ball glows

   Anchor: its foot (the base's centre on the ground) is FOOT, projected
   by the camera; the app stands the marker there. */
const C = require('../clay.js');
const { len2, len3, smin, hex, clamp, smoothstep } = C;

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

const BASE_R = 0.46, BASE_H = 0.34;                  // the sturdy base
const BAND = [0.15, 0.22];                           // its coral band
const JOINT = [0, 0.66, 0], JOINT_R = 0.15;          // the ball the horn plugs into
const AXIS = C.norm3([0.68, 0.6, 0.42]);             // where the horn listens: up to the sky, right, a little toward us
const THROAT = [JOINT[0] + AXIS[0] * 0.05, JOINT[1] + AXIS[1] * 0.05, JOINT[2] + AXIS[2] * 0.05];
const L = 0.92, R0 = 0.085, RM = 0.56, FLARE = 2.3;  // horn length, throat and mouth radius, flare
const SHELL = 0.042;                                  // half-thickness of the horn's clay
const LIP_R = 0.048;                                  // the rolled lip at the mouth
function flare(h){ return R0 + (RM - R0) * Math.pow(clamp(h / L, 0, 1), FLARE); }
/* the profile as a polyline (q across, h along the axis) */
const PROFILE = [];
for(let i = 0; i <= 22; i++){ const h = L * i / 22; PROFILE.push([flare(h), h]); }
const MOUTH = [THROAT[0] + AXIS[0] * L, THROAT[1] + AXIS[1] * L, THROAT[2] + AXIS[2] * L];
/* the antenna: from the joint, leaning back and to the left */
const ANT0 = [JOINT[0] - 0.04, JOINT[1] + 0.08, JOINT[2] - 0.04], ANT1 = [-0.3, 1.2, -0.16], ANT_BALL = 0.085;
const FOOT = [0, 0, 0];

/* the horn in its own frame: [distance, along the axis, across it] */
function hornLocal(x, y, z){
  const px = x - THROAT[0], py = y - THROAT[1], pz = z - THROAT[2];
  const h = px * AXIS[0] + py * AXIS[1] + pz * AXIS[2];
  const rx = px - AXIS[0] * h, ry = py - AXIS[1] * h, rz = pz - AXIS[2] * h;
  const q = len3(rx, ry, rz);
  let d2 = 1e9;
  for(let i = 0; i < PROFILE.length - 1; i++){
    const a = PROFILE[i], b = PROFILE[i + 1];
    const ex = b[0] - a[0], ey = b[1] - a[1], wx = q - a[0], wy = h - a[1];
    const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
    const dx = wx - ex * t, dy = wy - ey * t;
    const dd = dx * dx + dy * dy;
    if(dd < d2) d2 = dd;
  }
  return [Math.sqrt(d2) - SHELL, h, q];
}

function build(variant){
  const on = variant === 'on';
  const W = 480, H = 480, D = 12, ELEV = 0.3;
  const frame = 2.2;
  const target = [0.32, 0.8, 0];
  const yFloor = 0.0;
  const glowAt = [THROAT[0] + AXIS[0] * 0.3, THROAT[1] + AXIS[1] * 0.3, THROAT[2] + AXIS[2] * 0.3];
  return {
    width: W, height: H, scale: 1, seed: 73, spp: 3, aoRange: 0.07,
    camera: { pos: [target[0], target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frame / 2) / D) * 180 / Math.PI },
    bounds: { center: [0.2, 0.85, 0.1], radius: 1.75 },
    points: on ? [{ pos: glowAt, color: [1.0, 0.7, 0.38], intensity: 2.8, radius: 0.44 },
                  { pos: ANT1, color: [1.0, 0.76, 0.42], intensity: 1.2, radius: 0.2 }] : [],
    materials: [
      C.clay({ albedo: hex('#F1E8D8') }),                                          // 0 horn, outside
      C.clay(on ? { albedo: hex('#FFD9A6'), rim: 0.3 }
                : { albedo: hex('#40376E') }),                                     // 1 horn, inside
      C.clay({ albedo: hex('#FF8A76'), rim: 0.6 }),                                // 2 rolled lip
      C.clay({ albedo: hex('#2AAFB8') }),                                          // 3 base
      C.clay({ albedo: hex('#9D93D6') }),                                          // 4 neck, joint, antenna
      C.clay({ albedo: on ? hex('#FFD98A') : hex('#9E97B8'), spec: 0.8, specPow: 50, sheen: 0.2,
               grain: 0.0002, stroke: 0, prints: 0, sss: 0.3, rim: on ? 0.3 : 1,
               emissive: on ? [2.4, 1.4, 0.4] : null }),                            // 5 antenna ball
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.14, 0.02], fadeRadius: 1.0 })                        // 6 shadow catcher
    ],
    map(x, y, z, rec){
      // the base: a sturdy drum, a little wider at its foot, rims rounded,
      // with a band of coral clay round it (colour only: pressed seams on
      // its sloping side streaked the shadows)
      let d = trapezoid2(len2(x, z), y - BASE_H * 0.5, BASE_R + 0.03 - 0.1, BASE_R - 0.04 - 0.1, BASE_H * 0.5 - 0.1) - 0.1;
      let m = y > BAND[0] && y < BAND[1] ? 2 : 3;
      // the neck and the ball joint
      const neck = C.SD.capsule(x, y, z, 0, BASE_H - 0.05, 0, JOINT[0], JOINT[1], JOINT[2], 0.09);
      if(neck < d + 0.05){ const b = smin(d, neck, 0.05); if(neck < d) m = 4; d = b; }
      const joint = len3(x - JOINT[0], y - JOINT[1], z - JOINT[2]) - JOINT_R;
      if(joint < d){ d = joint; m = 4; }
      // the antenna and its ball
      const ant = C.SD.capsule(x, y, z, ANT0[0], ANT0[1], ANT0[2], ANT1[0], ANT1[1], ANT1[2], 0.028);
      if(ant < d + 0.03){ const b = smin(d, ant, 0.03); if(ant < d) m = 4; d = b; }
      const ball = len3(x - ANT1[0], y - ANT1[1], z - ANT1[2]) - ANT_BALL;
      if(ball < d){ d = ball; m = 5; }
      // the horn and its rolled lip (only near the horn: the polyline is the costly part)
      const near = len3(x - MOUTH[0] * 0.6 - THROAT[0] * 0.4, y - MOUTH[1] * 0.6 - THROAT[1] * 0.4, z - MOUTH[2] * 0.6 - THROAT[2] * 0.4) - 0.95;
      if(near < d){
        const hl = hornLocal(x, y, z);
        if(hl[0] < d){ d = hl[0]; m = hl[2] < flare(hl[1]) ? 1 : 0; }
        const lip = len2(hl[2] - RM, hl[1] - L) - LIP_R;
        if(lip < d + 0.03){ const b = smin(d, lip, 0.03); if(lip < d) m = 2; d = b; }
      }
      // the invisible floor
      const floor = Math.max(y - yFloor, len2(x, z) - 1.6);
      if(floor < d){ d = floor; m = 6; }
      if(rec) rec.m = m;
      // a little under 1, so a surface facing the key head-on never reads
      // as shadowed by itself (see picture.js)
      return d * 0.92;
    },
    emissiveAt: on ? function(x, y, z, mi, mat){
      if(mi !== 1) return mat.emissive;
      // the glow lives deep in the horn and fades toward the mouth
      const hl = hornLocal(x, y, z);
      const g = smoothstep(L * 0.95, L * 0.05, hl[1]);
      return [1.9 * g * g, 1.1 * g * g, 0.32 * g * g];
    } : null
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.02, 0.35); C.addGlow(buf, W, H, CH, W * 0.07, 0.25); }
}
module.exports = { build: build, post: post, FOOT: FOOT };
