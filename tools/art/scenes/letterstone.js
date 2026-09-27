'use strict';
/* LETTER STONE — the stone a letter is shown on: a chunky block of
   lavender-grey Moon clay, seen straight on and a little from above, so a
   sliver of its top shows. Its front face is FLAT and plain: the app lays
   an HTML plate over it and draws the letter there, so nothing textured
   ever sits behind a letter (docs/ART-DIRECTION.md, "Letter tiles").

   The block is a 2D rounded rectangle extruded with rounded edges, so the
   flat part of the front face is itself an exact rounded rectangle:
   half-size (FW, FH), corner radius FR. The app's plate is positioned by
   that rectangle. Outside it the clay is gently lumpy, as a hand-made
   stone is; on it, never. A long lens keeps the face square to the frame
   (a short one would make it a trapezoid). An invisible floor catches a
   soft contact shadow that fades out before the frame edge.

   Anchor, measured from the render (400×440): the flat face spans left
   13.00%, top 11.59%, width 74.00%, height 70.00% (x 52–348, y 51–359 px),
   corners rounded about 29 px. Move it and the plate's CSS moves too. */
const C = require('../clay.js');
const { len2, hex, smoothstep } = C;

const FW = 1.01, FH = 1.08, FR = 0.2;    // the flat front face
const EDGE = 0.09;                        // rounding where the face meets the sides
const DEPTH = 0.42;                       // half-depth of the block
const ELEV = 0.22, D = 48;

function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
const noise = C.makeNoise(23);

function block(x, y, z){
  // the outline is the face grown by EDGE; extruding with EDGE rounding
  // shrinks it back, so the flat face is exactly FW × FH with corners FR
  const d2 = roundRect2(x, y, FW + EDGE, FH + EDGE, FR + EDGE);
  const d = C.SD.extrude(d2, z, DEPTH, EDGE);
  // hand-made lumps on the rim, the top and the sides, none on the face.
  // Always added: skipping them far from the surface would make the
  // distance jump, and the soft shadows streak where it does.
  const off = Math.max(smoothstep(0.02, 0.1, roundRect2(x, y, FW, FH, FR)), smoothstep(DEPTH - 0.04, DEPTH - 0.25, z));
  return (d + off * (0.045 * noise(x * 1.1, y * 1.1, z * 1.1) + 0.012 * noise(x * 2.9 + 4, y * 2.9, z * 2.9))) * 0.9;
}

function build(){
  const W = 400, H = 440;
  const frameH = 3.05;
  const yBottom = -(FH + EDGE);
  const target = [0, -0.195, 0];
  return {
    width: W, height: H, scale: 1, seed: 29, spp: 3, aoRange: 0.12,
    camera: { pos: [0, target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, -0.3, 0], radius: 2.3 },
    materials: [
      C.clay({ albedo: hex('#A79FC6') }),                                          // 0 stone
      C.clay({ albedo: hex('#A79FC6'), grain: 0, stroke: 0, prints: 0 }),          // 1 the flat front face
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 1.0,
               fadeCenter: [0.1, 0.15], fadeRadius: 1.3 })                         // 2 shadow catcher
    ],
    map(x, y, z, rec){
      let d = block(x, y, z), m = z > DEPTH - 0.03 ? 1 : 0;
      // sunk a touch into the floor, so it sits rather than hovers
      const floor = Math.max(y - (yBottom + 0.04), len2(x, z) - 2.0);
      if(floor < d){ d = floor; m = 2; }
      if(rec) rec.m = m;
      return d;
    }
  };
}
module.exports = { build: build };
