'use strict';
/* SLATE — Moon Writer's marker on the Moon: a friendly clay writing slate
   on a little easel. A dark blue-grey slate board, set a little below the
   front of a chunky, fully rounded frame of warm cream clay; a coral chalk
   tray along its foot holding one fat round stick of chalk; and two stubby
   coral legs in front and a third behind, holding it up on the Moon's
   ground, leaning back a little. It is turned a little toward the middle
   of the scene, so the frame's edge shows. An invisible floor catches its
   contact shadow. (A white frame, and a lamp on a collar on top, made it
   read as a television on a stand.)

   The slate is BLANK in both variants: no letter, line or mark, ever.

   Variants:
     off  the slate is dim
     on   the slate glows a soft lavender-white from within (still blank),
          brightest in its middle, and lights its frame, the tray and the
          chalk, with a gentle bloom

   Anchor: its foot (the middle of its three feet on the ground) is FOOT,
   projected by the camera; the app stands the marker there. Measured
   (400×480): the foot at (45.83%, 84.84%). */
const C = require('../clay.js');
const { len2, smin, smax, hex, smoothstep } = C;

const YAW = 0.26;                                   // turned a little toward the middle of the scene
const CY = Math.cos(YAW), SY = Math.sin(YAW);
const LEAN = 0.16;                                  // the easel leans back
const CL = Math.cos(LEAN), SL = Math.sin(LEAN);
const BOARD = { y: 0.68, hw: 0.46, hh: 0.4, hd: 0.07 };     // the frame: centre height, half sizes; its edges fully rounded
const FRONT = 0.04;                                 // the frame stands this far proud of the slate
const SLATE = { hw: 0.345, hh: 0.29, r: 0.075 };    // the slate's face: half sizes, corner radius
const LIP = 0.03;                                   // how soft the frame's inner edge is
const SHADOW_CLEAR = 0.2;                           // the frame's front, corners too, left out of the soft shadow
const SLATE_FOOT = BOARD.y - SLATE.hh * CL;         // the height of the slate's bottom edge
// (the tray stays clear of the slate's floor: closer, their soft seam would lift its corners)
const TRAY = { y: SLATE_FOOT - 0.066, z: 0.14, hw: 0.39, hh: 0.038, hd: 0.078, r: 0.034 };
const CHANNEL_Y = TRAY.y + TRAY.hh + 0.012;         // the channel along the tray's top
const CHALK = { x0: -0.26, z0: 0.144, x1: -0.03, z1: 0.156, y: CHANNEL_Y + 0.008, r: 0.043 };
const LEG_R = 0.058;
// from the board's back (never nearer the slate: their soft seam would lift it) to the ground
const LEGS = [[-0.27, 0.44, -0.065, -0.39, 0.055, 0.09], [0.27, 0.44, -0.065, 0.39, 0.055, 0.09], [0, 0.92, -0.14, 0, 0.055, -0.33]];
const FOOT_R = [0.08, 0.05, 0.08];
/* the middle of the three feet, on the ground (in the easel's own frame, then the world's) */
const FOOT_LOCAL = [0, 0, (LEGS[0][5] + LEGS[1][5] + LEGS[2][5]) / 3];
function toWorld(p){ return [p[0] * CY + p[2] * SY, p[1], -p[0] * SY + p[2] * CY]; }
const FOOT = toWorld(FOOT_LOCAL);

function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
/* the board's own frame: v up the board, w out of the slate's face */
function boardV(y, z){ return (y - BOARD.y) * CL - z * SL; }
function boardW(y, z){ return (y - BOARD.y) * SL + z * CL; }
/* and back: a point of the board (centred across it) in the easel's frame */
function boardPoint(v, w){ return [0, BOARD.y + v * CL + w * SL, -v * SL + w * CL]; }

/* the easel in its own frame (x right, y up, z toward the front). For the
   soft shadow (forShadow) the frame's front, in front of the slate, is left
   out: the key light rakes across the turned, leaning slate, and the lip's
   shadow darkened half of it, which read as a dark screen, not a slate. */
function easel(x, y, z, rec, forShadow){
  const v = boardV(y, z), w = boardW(y, z);
  // the frame, with the slate set into its front
  let d = C.SD.roundBox(x, v, w - (FRONT - BOARD.hd), BOARD.hw, BOARD.hh, BOARD.hd, BOARD.hd);
  const rr = roundRect2(x, v, SLATE.hw, SLATE.hh, SLATE.r);
  d = smax(d, -Math.max(rr, -w), LIP);
  if(forShadow) d = Math.max(d, -Math.max(rr - SHADOW_CLEAR, -w));
  let m = (rr < 0.004 && w < 0.004 && w > -0.05) ? 1 : 0;   // the slate is the flat floor; its soft rim is frame
  // the chalk tray: a level shelf along the frame's foot, with a shallow channel
  let t = C.SD.roundBox(x, y - TRAY.y, z - TRAY.z, TRAY.hw, TRAY.hh, TRAY.hd, TRAY.r);
  const cz = (CHALK.z0 + CHALK.z1) / 2;
  t = smax(t, -C.SD.capsule(x, y, z, -TRAY.hw + 0.07, CHANNEL_Y, cz, TRAY.hw - 0.07, CHANNEL_Y, cz, 0.036), 0.012);
  if(t < d + 0.02){ const b = smin(d, t, 0.02); if(t < d) m = 2; d = b; }
  // one fat round stick of chalk in the channel
  const ch = C.SD.capsule(x, y, z, CHALK.x0, CHALK.y, CHALK.z0, CHALK.x1, CHALK.y, CHALK.z1, CHALK.r);
  if(ch < d){ d = ch; m = 3; }
  // three stubby legs, each on a round foot
  for(const L of LEGS){
    const l = C.SD.capsule(x, y, z, L[0], L[1], L[2], L[3], L[4], L[5], LEG_R);
    if(l < d + 0.03){ const b = smin(d, l, 0.03); if(l < d) m = 2; d = b; }
    const f = C.SD.ellipsoid(x - L[3], y - FOOT_R[1] + 0.012, z - L[5], FOOT_R[0], FOOT_R[1], FOOT_R[2]);
    if(f < d + 0.02){ const b = smin(d, f, 0.02); if(f < d) m = 2; d = b; }
  }
  if(rec) rec.m = m;
  return d;
}

function world(x, y, z, rec, forShadow){
  // into the easel's own frame (undo its turn)
  const lx = x * CY - z * SY, lz = x * SY + z * CY;
  let d = easel(lx, y, lz, rec, forShadow), m = rec ? rec.m : 0;
  // the invisible floor: a thin sheet (a solid one catches rays entering the bounds from below)
  const floor = Math.max(y, -0.03 - y, len2(x, z) - 0.95);
  if(floor < d){ d = floor; m = 4; }
  if(rec) rec.m = m;
  // a little under 1, so a surface facing the key head-on never reads
  // as shadowed by itself (see picture.js)
  return d * 0.92;
}

function build(variant){
  const on = variant === 'on';
  const W = 400, H = 480, D = 12, ELEV = 0.2;
  const frameH = 1.5;
  const target = [0.04, 0.55, 0];
  return {
    width: W, height: H, scale: 1, seed: 97, spp: 3, aoRange: 0.07,
    camera: { pos: [target[0], target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.6, -0.05], radius: 1.0 },
    // the lit slate's own light, falling on its frame, the tray and the chalk
    points: on ? [{ pos: toWorld(boardPoint(0, 0.32)), color: [0.78, 0.76, 1.0], intensity: 1.1, radius: 0.42 }] : [],
    materials: [
      C.clay({ albedo: hex('#F3E4C8'), rim: 0.8 }),                                // 0 frame: a warm cream, a shade warmer than the beacon's
      C.clay(on ? { albedo: hex('#5E6688'), grain: 0, stroke: 0, emissive: [0.5, 0.46, 0.82] }
                : { albedo: hex('#474D5E'), grain: 0, stroke: 0 }),               // 1 slate
      C.clay({ albedo: hex('#FF8A76'), rim: 0.6 }),                                // 2 tray, legs, feet
      C.clay({ albedo: hex('#FBF8F2'), grain: 0, stroke: 0 }),                     // 3 chalk
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.04, -0.05], fadeRadius: 0.6 })                       // 4 shadow catcher
    ],
    emissiveAt: on ? function(x, y, z, mi, mat){
      if(mi !== 1) return mat.emissive;
      // brightest in the middle, softer toward the frame: a slate lit from
      // within, not a screen. A rounded-square falloff (a superellipse):
      // the rectangle's own distance drew creases from its corners.
      const lx = x * CY - z * SY, lz = x * SY + z * CY;
      const e = Math.pow(Math.pow(Math.abs(lx) / SLATE.hw, 4) + Math.pow(Math.abs(boardV(y, lz)) / SLATE.hh, 4), 0.25);
      const k = 0.22 + 0.78 * smoothstep(1.02, 0.2, e);
      return [mat.emissive[0] * k, mat.emissive[1] * k, mat.emissive[2] * k];
    } : null,
    map(x, y, z, rec){ return world(x, y, z, rec, false); },
    shadowMap(x, y, z){ return world(x, y, z, null, true); }
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.02, 0.22); C.addGlow(buf, W, H, CH, W * 0.07, 0.14); }
}
module.exports = { build: build, post: post, FOOT: FOOT };
