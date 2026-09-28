'use strict';
/* PICTURE-P5C — three Phase 5 word pictures: a seal, a robot and a
   butterfly, in the same family as picture.js and picture-p3.js and built
   under the one word-picture camera (picture.js buildObject), so they share
   its framing (about 80% of the frame), its gentle three-quarter view from
   slightly above, and its light.

   Each object is sculpted in its own frame at a natural size, then posed
   (yaw, pitch, roll), scaled and nudged to the centre of the picture.
   Only the seal has a face: two bead eyes and a small nose. The robot's
   eyes are round pale discs with bead pupils; the butterfly has none. */
const C = require('../clay.js');
const PIC = require('./picture.js');
const P3 = require('./picture-p3.js').helpers;
const { SD, smin, smax, hex } = C;
const { spline, tubeDist, towardCamera, beadEyes, EYE } = P3;

/* a round cone squashed flat about the height y0 (by k): a paddle lying level */
function paddle(x, y, z, a, b, r1, r2, y0, k){
  return SD.roundCone2(x, (y - y0) / k, z, a[0], (a[1] - y0) / k, a[2], b[0], (b[1] - y0) / k, b[2], r1, r2) * k;
}

/* =========================================================
   THE OBJECTS — each: pose, materials, sdf(x, y, z, rec)
   ========================================================= */
const OBJECTS = {};

/* SEAL: a friendly grey-blue seal lying on its belly with its head raised,
   seen three-quarters: a plump body that tapers to two rear flippers
   splayed in a V, two front flippers resting on the ground, and a round
   head turned toward us, with a pale muzzle of two whisker pads (a few
   dark dots on them), a small dark nose and two bead eyes. No ears. The
   head is +x. */
const SEAL_POSE = { s: 0.885, t: [-0.237, -0.007, 0], yaw: Math.PI + 0.55, pitch: 0.12 };
const SEAL = (function(){
  const cam = towardCamera(SEAL_POSE);
  // the body: a tube along the spine, its radius carried as a fourth value
  const sp = spline([[-1.0, -0.28, 0, 0.07], [-0.78, -0.34, 0, 0.17], [-0.42, -0.33, 0, 0.31],
                     [-0.02, -0.21, 0, 0.38], [0.28, 0.02, 0, 0.35], [0.42, 0.3, 0, 0.29]], 20);
  const body = { pts: sp.map(p => [p[0], p[1], p[2]]), rad: sp.map(p => p[3]) };
  // the head turns from the body's line toward us
  const H = [0.46, 0.54, 0], R = 0.31;
  const f = C.norm3([1 + cam[0] * 1.5, 0.1, cam[2] * 1.5]);
  const s = C.norm3(C.cross3(f, [0, 1, 0])), u = C.cross3(s, f);
  const at = (o, lf, lu, ls) => [o[0] + f[0] * lf + u[0] * lu + s[0] * ls, o[1] + f[1] * lf + u[1] * lu + s[1] * ls,
                                 o[2] + f[2] * lf + u[2] * lu + s[2] * ls];
  const pads = [at(H, 0.23, -0.09, -0.085), at(H, 0.23, -0.09, 0.085)];
  const nose = at(H, 0.32, -0.01, 0);
  const eyes = beadEyes(H, [R, R, R], f, cam, 0.2, 0.46, 0.34, 0.02);
  // three whisker dots on the outer front of each pad, well apart
  const dots = [];
  pads.forEach((p, i) => {
    const k = i ? 1 : -1;
    for(const q of [[0.75, 0.25, 0.6], [0.45, 0.05, 0.9], [0.7, -0.3, 0.65]]){
      const n = C.norm3([f[0] * q[0] + u[0] * q[1] + s[0] * q[2] * k, f[1] * q[0] + u[1] * q[1] + s[1] * q[2] * k,
                         f[2] * q[0] + u[2] * q[1] + s[2] * q[2] * k]);
      dots.push([p[0] + n[0] * 0.1, p[1] + n[1] * 0.1, p[2] + n[2] * 0.1]);
    }
  });
  return { body, H, R, pads, nose, eyes, dots };
})();
OBJECTS.seal = {
  pose: SEAL_POSE,
  materials: () => [
    C.clay({ albedo: hex('#8E99AC') }),                                            // 0 body
    C.clay({ albedo: hex('#DCE4EE') }),                                            // 1 muzzle
    C.clay({ albedo: hex('#2B2638') }),                                            // 2 nose, whisker dots
    EYE()                                                                          // 3 eyes
  ],
  sdf(x, y, z, rec){
    let d = tubeDist(x, y, z, SEAL.body);
    d = smin(d, SD.sphere(x - SEAL.H[0], y - SEAL.H[1], z - SEAL.H[2], SEAL.R), 0.12);
    d = smax(d, -(y + 0.56), 0.06);
    // flat flippers: two in front resting on the ground, two behind in a V
    for(const k of [-1, 1]){
      const fr = paddle(x, y, z, [0.18, -0.32, k * 0.25], [0.48, -0.51, k * 0.55], 0.11, 0.17, -0.5, 0.42);
      const rr = paddle(x, y, z, [-0.96, -0.28, 0], [-1.24, -0.26, k * 0.28], 0.06, 0.16, -0.27, 0.45);
      d = smin(d, Math.min(fr, rr), 0.06);
    }
    let m = 0;
    let mz = 1e9;
    for(const p of SEAL.pads) mz = Math.min(mz, SD.sphere(x - p[0], y - p[1], z - p[2], 0.1));
    if(mz < d + 0.05){ const b = smin(d, mz, 0.05); if(mz < d) m = 1; d = b; }
    const n = SEAL.nose;
    const nd = SD.sphere(x - n[0], y - n[1], z - n[2], 0.05);
    if(nd < d){ d = nd; m = 2; }
    if(rec && m === 1){
      for(const p of SEAL.dots) if(C.len3(x - p[0], y - p[1], z - p[2]) < 0.016){ m = 2; break; }
    }
    for(const e of SEAL.eyes){
      const ed = SD.sphere(x - e[0], y - e[1], z - e[2], 0.065);
      if(ed < d){ d = ed; m = 3; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* ROBOT: a friendly toy robot standing and waving: a rounded box head
   with two round pale eyes (dark bead pupils), round ear discs and a
   short antenna with a coral ball; a short neck; a rounded box body with
   a small chest panel and a coral button; simple arms, one raised in a
   wave; short legs and flat feet. Teal and silver-grey, with coral. Its
   face is +z. */
const ROBOT_POSE = { s: 0.897, t: [-0.04, -0.029, 0], yaw: -0.35, pitch: 0.08 };
const ROBOT = (function(){
  // the pupils look out at us, not past us
  const cam = towardCamera(ROBOT_POSE);
  return { px: cam[0] * 0.05, py: cam[1] * 0.05 };
})();
OBJECTS.robot = {
  pose: ROBOT_POSE,
  materials: () => [
    C.clay({ albedo: hex('#2FAE9F') }),                                            // 0 head, body
    C.clay({ albedo: hex('#B3BBC8') }),                                            // 1 limbs, neck, ears, antenna, panel
    C.clay({ albedo: hex('#FF7059'), rim: 0.45 }),                                 // 2 antenna ball, button
    C.clay({ albedo: hex('#F3F6FA') }),                                            // 3 eye discs
    EYE()                                                                          // 4 pupils
  ],
  sdf(x, y, z, rec){
    const ax = Math.abs(x);
    let d = Math.min(SD.roundBox(x, y + 0.2, z, 0.4, 0.34, 0.3, 0.15),
                     SD.roundBox(x, y - 0.52, z, 0.37, 0.27, 0.29, 0.14)), m = 0;
    let sil = SD.roundCylinder(x, y - 0.2, z, 0.1, 0.08, 0.03);
    sil = Math.min(sil, SD.roundCylinder(ax - 0.2, y + 0.72, z, 0.085, 0.2, 0.04));
    sil = Math.min(sil, SD.roundBox(ax - 0.2, y + 0.95, z - 0.04, 0.14, 0.06, 0.19, 0.055));
    sil = Math.min(sil, SD.roundCylinder(y - 0.52, ax - 0.39, z, 0.1, 0.05, 0.025));
    sil = Math.min(sil, SD.capsule(x, y, z, 0, 0.76, 0, 0, 0.98, 0, 0.03));
    // arms: the left hangs, the right waves
    sil = Math.min(sil, SD.capsule(x, y, z, -0.44, -0.02, 0, -0.56, -0.36, 0.04, 0.07));
    sil = Math.min(sil, SD.sphere(x + 0.58, y + 0.43, z - 0.05, 0.1));
    sil = Math.min(sil, SD.capsule(x, y, z, 0.44, -0.02, 0, 0.62, 0.12, 0.04, 0.07));
    sil = Math.min(sil, SD.capsule(x, y, z, 0.62, 0.12, 0.04, 0.66, 0.4, 0.06, 0.07));
    sil = Math.min(sil, SD.sphere(x - 0.67, y - 0.48, z - 0.06, 0.1));
    // the chest panel
    sil = Math.min(sil, SD.roundBox(x, y + 0.24, z - 0.3, 0.2, 0.13, 0.03, 0.03));
    if(sil < d + 0.03){ const b = smin(d, sil, 0.03); if(sil < d) m = 1; d = b; }
    let acc = SD.sphere(x, y - 1.04, z, 0.085);
    acc = Math.min(acc, SD.roundCylinder(x - 0.07, z - 0.335, y + 0.24, 0.055, 0.02, 0.015));
    if(acc < d){ d = acc; m = 2; }
    for(const k of [-1, 1]){
      const disc = SD.roundCylinder(x - k * 0.15, z - 0.29, y - 0.54, 0.11, 0.025, 0.02);
      if(disc < d){ d = disc; m = 3; }
      const pu = SD.sphere(x - k * 0.15 - ROBOT.px, y - 0.54 - ROBOT.py, z - 0.29, 0.065);
      if(pu < d){ d = pu; m = 4; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* BUTTERFLY: a butterfly with its four wings spread, seen from above with
   its head tipped a little away from us: big rounded orange forewings and
   smaller yellow hindwings, each with a few large dots of the other colour,
   a slim dark body, and two antennae with round tips. Symmetric. The wings
   lie in the x-z plane, lifted into a shallow V and curling up a little
   toward their tips, so they shade as clay rather than a flat card; the
   forewings overlap the hindwings. The head is -z. */
const BF = { DIH: 0.34,
  foreDots: [[0.66, -0.52, 0.13], [0.36, -0.22, 0.08]],
  hindDots: [[0.44, 0.42, 0.1]] };
OBJECTS.butterfly = {
  pose: { s: 1.071, t: [0, -0.267, 0], pitch: 0.9 },
  materials: () => [
    C.clay({ albedo: hex('#FF8A2A'), rim: 0.4 }),                                  // 0 forewings, hindwing dots
    C.clay({ albedo: hex('#FFC634'), rim: 0.4 }),                                  // 1 hindwings, forewing dots
    C.clay({ albedo: hex('#2E2742') })                                             // 2 body, antennae
  ],
  sdf(x, y, z, rec){
    const ax = Math.abs(x), c = Math.cos(BF.DIH), s = Math.sin(BF.DIH);
    const u = ax * c + y * s, v = -ax * s + y * c - 0.1 * u * u;
    const fw = SD.extrude(SD.roundCone2(u, z, 0, 0.08, -0.06, 0, 0.6, -0.44, 0, 0.1, 0.36), v - 0.03, 0.028, 0.024);
    const hw = SD.extrude(SD.roundCone2(u, z, 0, 0.08, 0.1, 0, 0.4, 0.4, 0, 0.1, 0.26), v + 0.01, 0.028, 0.024);
    let d = fw, m = 0;
    if(hw < d){ d = hw; m = 1; }
    if(rec){
      if(m === 0){ for(const p of BF.foreDots) if(C.len2(u - p[0], z - p[1]) < p[2]){ m = 1; break; } }
      else { for(const p of BF.hindDots) if(C.len2(u - p[0], z - p[1]) < p[2]){ m = 0; break; } }
    }
    let b = SD.sphere(x, y - 0.07, z + 0.56, 0.11);
    b = smin(b, SD.ellipsoid(x, y - 0.07, z + 0.28, 0.115, 0.11, 0.2), 0.04);
    b = smin(b, SD.roundCone2(x, y, z, 0, 0.07, -0.08, 0, 0.05, 0.54, 0.088, 0.045), 0.04);
    for(const k of [-1, 1]){
      b = Math.min(b, SD.capsule(x, y, z, k * 0.04, 0.1, -0.62, k * 0.26, 0.14, -1.0, 0.027));
      b = Math.min(b, SD.sphere(x - k * 0.28, y - 0.15, z + 1.04, 0.07));
    }
    if(b < d){ d = b; m = 2; }
    if(rec) rec.m = m;
    return d * 0.9;
  }
};

/* =========================================================
   THE SCENE — every object under picture.js's one camera
   ========================================================= */
function build(variant){
  const o = OBJECTS[variant];
  if(!o) throw new Error('picture-p5c: unknown variant ' + variant);
  return PIC.buildObject(o);
}
function post(){}
module.exports = { build: build, post: post };
