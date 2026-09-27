'use strict';
/* WORD SATELLITE — a floating clay satellite that shows a sight word. Its
   body is one wide, flat, rounded panel seen straight on: a clean, light
   cream face set a little below the front of a chunky, fully rounded
   frame of amber clay, with a small teal solar-panel wing on a short
   lavender arm at each side, and a tiny antenna with a coral ball leaning
   from its top, off centre (a centred one made the panel look like a
   face). No text and no marks: the app lays the word over the face as
   crisp vector letters, the way the letter stone's plate carries a letter.

   The face is FLAT, plain and square to the frame: the floor of a rounded
   rectangular recess, half-size (FACE.hw, FACE.hh), corners FACE.r, in
   the plane z = 0, seen by a level camera on the z axis with a long lens,
   so it projects to an exact rectangle (FACE_RECT). It has no grain,
   strokes or sheen, and it is lit evenly: the front of the frame is left
   out of the soft shadow (shadowMap), because the key light rakes across
   the face from the upper left and the lip's shadow darkened a band a
   sixth of the face deep along its top and left edges.

   Anchor, from the geometry (512×300): the flat face spans left 20.24%,
   top 37.30%, width 59.52%, height 42.16% (x 103.6–408.4, y 111.9–238.4
   px), about 2.4 : 1, corners rounded about 20 px. Move it and the CSS
   that places the word moves too.

   One variant: it floats, so there is no floor and no shadow. */
const C = require('../clay.js');
const { len2, len3, smin, smax, hex } = C;

const FACE = { hw: 1.0, hh: 0.415, r: 0.13 };       // the flat cream face
const RIM = 0.17;                                    // the frame's width round the face
const FRAME = { hw: FACE.hw + RIM, hh: FACE.hh + RIM, hd: 0.15 };   // its edges fully rounded
const FRONT = 0.035;                                 // the frame stands this far proud of the face
const LIP = 0.03;                                    // how soft the frame's inner edge is
const SHADOW_CLEAR = 0.3;                            // the frame's front, corners too, left out of the soft shadow
const MID = FRONT - FRAME.hd;                        // the frame's middle, front to back
const WING = { x: 1.38, hw: 0.13, hh: 0.19, hd: 0.035, r: 0.06, yaw: 0.3 };
const ARM_R = 0.045;
const ANT = { a: [0.44, FRAME.hh - 0.05, MID], b: [0.54, FRAME.hh + 0.25, MID + 0.02], r: 0.024, ball: 0.068 };

/* the camera: level, on the z axis, a long lens */
const W = 512, H = 300, D = 30;
const FRAME_W = 3.36, FRAME_H = FRAME_W * H / W;
const TARGET = [0, 0.165, 0];
/* the flat face in the picture, as fractions: exact, because the face is
   parallel to the image plane (projected the same way contract 31 does) */
function project(p){
  const z = D - p[2], th = (FRAME_H / 2) / D;
  return [((p[0] - TARGET[0]) / z / (th * W / H) + 1) / 2, (1 - (p[1] - TARGET[1]) / z / th) / 2];
}
const TL = project([-FACE.hw, FACE.hh, 0]), BR = project([FACE.hw, -FACE.hh, 0]);
// left, top, width and height as fractions of the picture; radius, the
// corners', as a fraction of its width
const FACE_RECT = { left: TL[0], top: TL[1], width: BR[0] - TL[0], height: BR[1] - TL[1], radius: FACE.r / (FACE.hw * 2) * (BR[0] - TL[0]) };

function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
/* a small solar-panel wing with one soft pressed groove down its middle */
function wing(lx, ly, lz){
  const d = C.SD.extrude(roundRect2(lx, ly, WING.hw, WING.hh, WING.r), lz, WING.hd, 0.03);
  if(d > 0.02) return d;
  const g = Math.exp(-(lx / 0.013) * (lx / 0.013));
  return d + 0.009 * g * (lz > 0 ? 1 : 0.2);
}

/* the satellite. For the soft shadow (forShadow) the front of the frame,
   in front of the face, is left out, so it never shades the face. */
function satellite(x, y, z, rec, forShadow){
  // the frame, with the face set into its front
  let d = C.SD.roundBox(x, y, z - MID, FRAME.hw, FRAME.hh, FRAME.hd, FRAME.hd);
  const rr = roundRect2(x, y, FACE.hw, FACE.hh, FACE.r);
  d = smax(d, -Math.max(rr, -z), LIP);
  if(forShadow) d = Math.max(d, -Math.max(rr - SHADOW_CLEAR, -z));
  let m = (rr < 0.004 && z < 0.004 && z > -0.05) ? 1 : 0;
  // a wing at each side on a short arm; the left one tilts a touch more (hand-made)
  for(const s of [-1, 1]){
    const arm = C.SD.capsule(x, y, z, s * (FRAME.hw - 0.06), 0, MID, s * (WING.x - WING.hw + 0.03), 0, MID, ARM_R);
    if(arm < d + 0.02){ const b = smin(d, arm, 0.02); if(arm < d) m = 3; d = b; }
    const yaw = s * WING.yaw, roll = s < 0 ? 0.07 : -0.03;
    const px = x - s * WING.x, py = y, pz = z - MID;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw);
    let lx = px * cyw + pz * syw;
    const lz = -px * syw + pz * cyw;
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const ly = py * cr - lx * sr; lx = lx * cr + py * sr;
    const wd = wing(lx, ly, lz);
    if(wd < d){ d = wd; m = 2; }
  }
  // the antenna: a short leaning stalk from the top, and its ball
  const st = C.SD.capsule(x, y, z, ANT.a[0], ANT.a[1], ANT.a[2], ANT.b[0], ANT.b[1], ANT.b[2], ANT.r);
  if(st < d + 0.02){ const b = smin(d, st, 0.02); if(st < d) m = 3; d = b; }
  const ball = len3(x - ANT.b[0], y - ANT.b[1] - ANT.ball * 0.6, z - ANT.b[2]) - ANT.ball;
  if(ball < d){ d = ball; m = 4; }
  if(rec) rec.m = m;
  // a little under 1, so a surface facing the key head-on never reads
  // as shadowed by itself (see picture.js)
  return d * 0.92;
}

function build(){
  return {
    width: W, height: H, scale: 1.2, seed: 101, spp: 3, aoRange: 0.05,
    camera: { pos: [TARGET[0], TARGET[1], D], target: TARGET, fov: 2 * Math.atan((FRAME_H / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.16, -0.05], radius: 1.72 },
    materials: [
      C.clay({ albedo: hex('#FFA43B'), rim: 0.4 }),                                // 0 frame: amber
      C.clay({ albedo: hex('#F8EACF'), grain: 0, stroke: 0, prints: 0, spec: 0.02, sheen: 0 }), // 1 the face: clean light cream
      C.clay({ albedo: hex('#2BB6C6') }),                                          // 2 wings
      C.clay({ albedo: hex('#9C93D4') }),                                          // 3 arms, antenna stalk
      C.clay({ albedo: hex('#FF8A76'), rim: 0.6 })                                 // 4 antenna ball
    ],
    map(x, y, z, rec){ return satellite(x, y, z, rec, false); },
    shadowMap(x, y, z){ return satellite(x, y, z, null, true); }
  };
}
module.exports = { build: build, FACE: FACE, FACE_RECT: FACE_RECT };
