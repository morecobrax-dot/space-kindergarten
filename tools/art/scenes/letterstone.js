'use strict';
/* LETTER STONE — the stone a letter is shown on: a chunky Moon stone that
   happens to have one smooth flat face, seen straight on and a little from
   above. The face is FLAT and plain: the app lays an HTML plate over it and
   draws the letter there, so nothing textured ever sits behind a letter
   (docs/ART-DIRECTION.md, "Letter tiles").

   The face is the front of a 2D rounded rectangle extruded with rounded
   edges, so its flat part is an exact rounded rectangle: half-size
   (FW, FH), corner radius FR. The app's plate is positioned by that
   rectangle. The rock around it is a lump of darker lavender-grey Moon clay
   cut by broad, softened facets that lean back from the face's rounded edge:
   an uneven outline with a lopsided domed top, a bulge on the left, a broad
   belly it sits on, knobbly clay and a few fingertip craters. The rock never
   comes near the face, so the face never moves. A long lens keeps the face
   square to the frame (a short one would make it a trapezoid). An invisible
   floor catches a soft contact shadow that fades out before the frame edge.

   Anchor, measured from the render (400×440): the flat face spans left
   13.00%, top 11.59%, width 74.00%, height 70.00% (x 52–348, y 51–359 px),
   corners rounded about 29 px. Move it and the plate's CSS moves too. */
const C = require('../clay.js');
const { len2, len3, hex, smoothstep } = C;

const FW = 1.01, FH = 1.08, FR = 0.2;    // the flat front face
const EDGE = 0.09;                        // rounding where the face meets the rock
const DEPTH = 0.42;                       // the face is the plane z = DEPTH
const ELEV = 0.22, D = 48;
const GROUND = -1.46;                     // below the face: a belly of rock shows beneath it

function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
const noise = C.makeNoise(23), mottle = C.makeNoise(31);

/* The rock: a lump of clay cut by softened facets, like the rock in the
   game pictures. Its widest outline (at z = ZW, behind the face) is an
   uneven convex polygon round the face. Each front facet leans back from
   just outside the face's rounded edge to its side of that outline, each
   back facet turns in again from it (so the rock rounds away behind), a
   front cap hides behind the face, and the stone sits sunk in the ground. */
const A = FW + EDGE, B = FH + EDGE, R = FR + EDGE;
const support = (nx, ny) => (A - R) * Math.abs(nx) + (B - R) * Math.abs(ny) + R;
const ZF = DEPTH - EDGE - 0.035, ZW = 0, GAP = 0.01;
const BACK_LEAN = 42 * Math.PI / 180, BACK = 0.6;
const SOFT = 0.12;                        // how soft the facets' edges are
const OUTLINE = [                         // counter-clockwise, x right, y up
  [1.26, -0.55], [1.22, 0.25], [1.19, 0.85], [1.02, 1.15], [0.6, 1.24], [-0.25, 1.3], [-0.75, 1.27], [-1.1, 1.13],
  [-1.27, 0.75], [-1.28, 0.25], [-1.26, -0.55], [-1.2, -1.2], [-0.7, -1.6], [0.6, -1.6], [1.18, -1.25], [1.26, -0.95]
];
const FACETS = [];
for(let i = 0; i < OUTLINE.length; i++){
  const p = OUTLINE[i], q = OUTLINE[(i + 1) % OUTLINE.length];
  const ex = q[0] - p[0], ey = q[1] - p[1], el = Math.hypot(ex, ey);
  const nx = ey / el, ny = -ex / el;      // outward, for a counter-clockwise outline
  const c = nx * p[0] + ny * p[1];
  // how far this side of the outline stands beyond the face: the lean that
  // makes the facet start at the face's edge
  const room = c - support(nx, ny) - GAP;
  if(room <= 0) throw new Error('letterstone: outline edge ' + i + ' cuts into the face');
  const lean = Math.atan(room / (ZF - ZW));
  FACETS.push({ n: [nx * Math.cos(lean), ny * Math.cos(lean), Math.sin(lean)], c: c * Math.cos(lean) + ZW * Math.sin(lean) });
  FACETS.push({ n: [nx * Math.cos(BACK_LEAN), ny * Math.cos(BACK_LEAN), -Math.sin(BACK_LEAN)],
                c: c * Math.cos(BACK_LEAN) - ZW * Math.sin(BACK_LEAN) });
}
/* where the clay may be knobbly and pitted: everywhere but the face */
function offFace(x, y, z){
  return Math.max(smoothstep(0.02, 0.1, roundRect2(x, y, FW, FH, FR)), smoothstep(DEPTH - 0.04, DEPTH - 0.25, z));
}
function rock(x, y, z){
  let d = z - ZF;                                                  // the front cap, hidden behind the face
  for(const F of FACETS) d = C.smax(d, F.n[0] * x + F.n[1] * y + F.n[2] * z - F.c, SOFT);
  d = C.smax(d, -BACK - z, SOFT);                                  // the back
  d = C.smax(d, (GROUND - 0.04) - y, 0.04);                        // sunk a touch into the ground
  // knobbly, hand-made clay. Always added: skipping it far from the
  // surface would make the distance jump, and the soft shadows streak.
  d += 0.042 * noise(x * 1.7, y * 1.7, z * 1.7) + 0.014 * noise(x * 3.6 + 4, y * 3.6, z * 3.6);
  // the face: the outline is the face grown by EDGE; extruding with EDGE
  // rounding shrinks it back, so the flat face is exactly FW × FH with
  // corners FR. The rock stays clear of its rounded edge, so the soft seam
  // between them never reaches the face.
  const slab = C.SD.extrude(roundRect2(x, y, A, B, R), z - (DEPTH - 0.2), 0.2, EDGE);
  return C.smin(slab, d, 0.05);
}

/* A few fingertip craters with little raised lips, the Moon's own mark,
   pressed into the rock (never the face). Each is placed where it shows in
   the picture: [x, y as picture fractions, size]; the camera's ray to that
   point is marched to the clay. */
const CAM = { pos: [0, -0.195 + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: [0, -0.195, 0], frameH: 3.05, W: 400, H: 440 };
const CRATER_R = 0.09, CRATER_DEPTH = 0.04;
const CRATERS = [[0.072, 0.36, 1.0], [0.94, 0.3, 0.8], [0.935, 0.7, 0.75], [0.3, 0.865, 1.15]].map(k => {
  const f = C.norm3([CAM.target[0] - CAM.pos[0], CAM.target[1] - CAM.pos[1], CAM.target[2] - CAM.pos[2]]);
  const r = C.norm3(C.cross3(f, [0, 1, 0])), u = C.cross3(r, f);
  const th = (CAM.frameH / 2) / D, ndx = (2 * k[0] - 1) * th * CAM.W / CAM.H, ndy = (1 - 2 * k[1]) * th;
  const dir = C.norm3([f[0] + r[0] * ndx + u[0] * ndy, f[1] + r[1] * ndx + u[1] * ndy, f[2] + r[2] * ndx + u[2] * ndy]);
  let t = D - 3;
  for(let i = 0; i < 400; i++){
    const h = rock(CAM.pos[0] + dir[0] * t, CAM.pos[1] + dir[1] * t, CAM.pos[2] + dir[2] * t) * 0.7;
    if(h < 1e-5) break;
    t += h;
  }
  return { c: [CAM.pos[0] + dir[0] * t, CAM.pos[1] + dir[1] * t, CAM.pos[2] + dir[2] * t], r: CRATER_R * k[2] };
});
function craterAt(x, y, z){
  let h = 0, floor = 0;
  for(const K of CRATERS){
    const t = len3(x - K.c[0], y - K.c[1], z - K.c[2]) / K.r;
    if(t > 1.8) continue;
    const bowl = smoothstep(1.05, 0.15, t);
    h += -CRATER_DEPTH * bowl + CRATER_DEPTH * 0.35 * Math.exp(-((t - 1.02) / 0.26) * ((t - 1.02) / 0.26));
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}
function stone(x, y, z){
  // the craters sink the clay (h below zero) and raise their lips
  const d = rock(x, y, z) - craterAt(x, y, z)[0] * offFace(x, y, z);
  // a little under 1, so a surface facing the key head-on never reads as
  // shadowed by itself (see tools/art/README.md)
  return d * 0.9;
}

function build(){
  const W = 400, H = 440;
  const frameH = 3.05;
  const target = [0, -0.195, 0];
  // a little darker and greyer than the Moon's lavender, so the pale plate stands out
  const STONE = hex('#958FAB'), LIGHT = hex('#A39DBA'), DARK = hex('#857E9E');
  return {
    width: W, height: H, scale: 1, seed: 29, spp: 3, aoRange: 0.12,
    camera: { pos: [0, target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, -0.3, 0], radius: 2.3 },
    materials: [
      C.clay({ albedo: STONE }),                                                   // 0 stone
      C.clay({ albedo: STONE, grain: 0, stroke: 0, prints: 0 }),                   // 1 the flat front face
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 1.0,
               fadeCenter: [0.1, 0.15], fadeRadius: 1.3 })                         // 2 shadow catcher
    ],
    map(x, y, z, rec){
      let d = stone(x, y, z), m = z > DEPTH - 0.03 ? 1 : 0;
      const floor = Math.max(y - GROUND, len2(x, z) - 2.0);
      if(floor < d){ d = floor; m = 2; }
      if(rec) rec.m = m;
      return d;
    },
    albedoAt(x, y, z, mi, mat){
      if(mi !== 0) return mat.albedo;
      // the rock is gently mottled, as the Moon is; the face stays plain
      const n = mottle(x * 1.8 + 3, y * 1.8, z * 1.8);
      const base = n > 0 ? C.mix3(STONE, LIGHT, Math.min(1, n * 1.6)) : C.mix3(STONE, DARK, Math.min(1, -n * 1.6));
      // the crater floors a little darker, as on the Moon
      return C.mix3(base, DARK, craterAt(x, y, z)[1] * 0.8);
    }
  };
}
module.exports = { build: build };
