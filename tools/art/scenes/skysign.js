'use strict';
/* SKYSIGN — Star Words' marker on Jupiter: a friendly clay sky sign. A
   big rounded signboard with a BLANK cream face (no letter, no word,
   ever: the app shows words on panels of its own), framed by one fat
   rolled coil of amber clay bent round it, with a small pillowy
   five-point star standing on its top. It is held up on one short,
   sturdy lavender post that rises out of a soft cloud puff sitting on
   the ground. The board is turned a little, so the frame's thickness
   shows on the right. An invisible floor catches its contact shadow.

   Variants:
     off  waiting: the face dim and cool, the star dark
     on   fixed: the face glows softly warm (still blank), the star lights,
          with a gentle bloom

   Anchor: its foot (the middle of the cloud's footprint on the ground)
   is FOOT, projected by the camera; the app stands the marker there. */
const C = require('../clay.js');
const { len2, len3, smin, smax, hex } = C;

const YAW = -0.3;                                  // turned so the right-hand side shows
const CY = Math.cos(YAW), SY = Math.sin(YAW);
/* the board, in its own frame (x right, y up, z out of the face) */
const BOARD_Y = 1.2;                               // the board's centre height
const FX = 0.6, FY = 0.38, FR = 0.25, TUBE = 0.095; // the frame coil's centreline (half sizes, corner) and thickness
const FACE_T = 0.045, FACE_Z = -0.01;              // the face slab: half-thickness, and how far back it sits
/* the post, and the cloud puff it stands in: [x, y, z, radius] */
const POST_R = 0.088, POST_TOP = BOARD_Y - FY;
/* (laid out so the footprint's middle is the origin: FOOT) */
const PUFFS = [[-0.008, 0.2, -0.02, 0.3], [-0.338, 0.13, 0.02, 0.22], [0.332, 0.14, -0.04, 0.23],
               [0.052, 0.12, 0.24, 0.2], [-0.088, 0.15, -0.26, 0.2], [-0.208, 0.3, -0.04, 0.17], [0.192, 0.29, 0.04, 0.16]];
/* the star on top: its centre's height, its size and how deep its points
   are cut, how round its edges are, and its half-thickness */
const STAR = { y: BOARD_Y + FY + TUBE + 0.15, r: 0.24, rf: 0.5, round: 0.075, t: 0.105 };
const FOOT = [0, 0, 0];

function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

/* the sign in the board's frame: sets rec.m */
function sign(x, y, z, rec){
  const by = y - BOARD_Y;
  // the frame: one rolled coil of clay bent round a rounded rectangle
  const path = roundRect2(x, by, FX, FY, FR);
  let d = len2(path, z) - TUBE, m = 2;
  // the face: a flat slab filling the frame, set back a little
  const face = C.SD.extrude(path, z - FACE_Z, FACE_T, 0.02);
  if(face < d){ d = face; m = z > FACE_Z ? 3 : 2; }
  // the post, rising from the cloud into the frame's bottom
  const post = C.SD.capsule(x, y, z, 0, 0.3, -0.02, 0, POST_TOP - 0.03, -0.02, POST_R);
  if(post < d + 0.04){ const b = smin(d, post, 0.04); if(post < d) m = 1; d = b; }
  // the cloud puff: round lumps pressed together, flat where it sits
  let cl = 1e9;
  for(let i = 0; i < PUFFS.length; i++){
    const P = PUFFS[i], s = len3(x - P[0], y - P[1], z - P[2]) - P[3];
    cl = i === 0 ? s : smin(cl, s, 0.09);
  }
  cl = smax(cl, -y, 0.04);
  if(cl < d + 0.03){ const b = smin(d, cl, 0.03); if(cl < d) m = 0; d = b; }
  // the star: a pillowy cookie of clay, its edges rounded right round,
  // standing on the frame's top. Always evaluated: skipping it far off let
  // a step jump into it, and a bounding shape in its place casts a soft
  // shadow of its own
  const st = C.SD.extrude(C.SD.star2(x, y - STAR.y, STAR.r - STAR.round, STAR.rf), z, STAR.t, STAR.round);
  if(st < d + 0.03){ const b = smin(d, st, 0.03); if(st < d) m = 4; d = b; }
  if(rec) rec.m = m;
  return d;
}

function build(variant){
  const on = variant === 'on';
  const W = 480, H = 480, D = 12, ELEV = 0.3;
  const frame = 2.62;
  const target = [0.12, 1.02, 0];
  const yFloor = 0.0;
  // a warm light in front of the face, and one at the star (world space)
  const faceLight = [0.34 * SY, BOARD_Y, 0.34 * CY], starAt = [0.1 * SY, STAR.y, 0.1 * CY];
  return {
    width: W, height: H, scale: 1, seed: 83, spp: 3, aoRange: 0.07,
    camera: { pos: [target[0], target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frame / 2) / D) * 180 / Math.PI },
    bounds: { center: [0.05, 0.95, 0], radius: 1.75 },
    points: on ? [{ pos: faceLight, color: [1.0, 0.74, 0.42], intensity: 0.9, radius: 0.5 },
                  { pos: starAt, color: [1.0, 0.8, 0.45], intensity: 1.3, radius: 0.3 }] : [],
    materials: [
      C.clay({ albedo: hex('#F3EBDD'), sss: 0.3, sheen: 0.08, stroke: 0.0003, rim: 0.7 }),   // 0 cloud puff
      C.clay({ albedo: hex('#9D93D6') }),                                                  // 1 post
      C.clay({ albedo: hex('#F5A43F'), rim: 0.5 }),                                        // 2 frame coil
      C.clay(on ? { albedo: hex('#E4B47E'), rim: 0.3, stroke: 0.0002, emissive: [0.12, 0.07, 0.025] }
                : { albedo: hex('#BDB7BA'), stroke: 0.0002 }),                             // 3 face (blank)
      C.clay(on ? { albedo: hex('#FFD24A'), sss: 0.85, sheen: 0.16, rim: 0.35, grain: 0, stroke: 0, emissive: [0.9, 0.55, 0.1] }
                : { albedo: hex('#857D9E'), sss: 0.5, grain: 0, stroke: 0 }),              // 4 star
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.1, 0.05], fadeRadius: 1.1 })                                 // 5 shadow catcher
    ],
    // the star's edges are a deeper colour, as the reward star's are
    albedoAt(x, y, z, mi, mat){
      if(mi !== 4) return mat.albedo;
      const lx = x * CY - z * SY;
      const e = C.smoothstep(-0.1, 0.0, C.SD.star2(lx, y - STAR.y, STAR.r - STAR.round, STAR.rf));
      return C.mix3(mat.albedo, on ? hex('#FF9A2A') : hex('#7D7699'), e);
    },
    map(x, y, z, rec){
      // into the board's own frame (undo its turn)
      const lx = x * CY - z * SY, lz = x * SY + z * CY;
      let d = sign(lx, y, lz, rec), m = rec ? rec.m : 0;
      // the invisible floor
      const floor = Math.max(y - yFloor, len2(x, z) - 1.6);
      if(floor < d){ d = floor; m = 5; }
      if(rec) rec.m = m;
      // a little under 1, so a surface facing the key head-on never reads
      // as shadowed by itself (see picture.js)
      return d * 0.92;
    }
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.02, 0.3); C.addGlow(buf, W, H, CH, W * 0.07, 0.22); }
}
module.exports = { build: build, post: post, FOOT: FOOT };
