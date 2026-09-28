'use strict';
/* PICTURE-P5A — Phase 5 word pictures: bat, bun, pup and hut, four more
   small clay objects in the same family as picture.js and picture-p3.js,
   built under its camera (buildObject), so they share its framing (about
   80% of the frame), its gentle three-quarter view from slightly above,
   and its light.

   Each object is sculpted in its own frame at a natural size, then posed
   (yaw, pitch, roll), scaled and nudged to the centre of the picture.
   Only the bat and the pup have faces: two bead eyes each, and the pup a
   small dark nose. */
const C = require('../clay.js');
const PIC = require('./picture.js');
const P3 = require('./picture-p3.js').helpers;
const { SD, len2, smin, smax, hex } = C;
const { seg2, spline, makeTube, tubeDist, towardCamera, beadEyes, EYE } = P3;

/* =========================================================
   THE OBJECTS — each: pose, materials, sdf(x, y, z, rec)
   ========================================================= */
const OBJECTS = {};

/* BAT: a round, friendly bat facing us with its wings spread wide: a
   round lavender head with two pointed ears, pink inside, over a round
   body with a pale belly, and two dusky wings, each with its arm and two
   fingers standing out from the wrist and its lower edge scalloped
   between the finger tips, so it cannot be a bird's wing or a cape. Two
   bead eyes. Its face is +z. */
const BAT_POSE = { s: 0.915, t: [-0.058, -0.066, 0], yaw: -0.2, pitch: 0.1 };
const BAT = (function(){
  // the right wing's outline in its own plane (u out from the body, v up),
  // clockwise: the shoulder, the wrist, the tip, two finger tips, the hip
  const poly = [0.12, 0.14, 0.58, 0.5, 1.04, 0.3, 0.92, -0.1, 0.62, -0.3, 0.14, -0.26];
  // the scallops: circles that cut the trailing edge between the tips
  const tips = [[1.04, 0.3, 0.12], [0.92, -0.1, 0.11], [0.62, -0.3, 0.11], [0.14, -0.26, 0]];
  const cuts = [];
  for(let i = 0; i + 1 < tips.length; i++){
    const a = tips[i], b = tips[i + 1], sg = a[2];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = len2(dx, dy);
    const R = (L * L / 4 + sg * sg) / (2 * sg);
    cuts.push([(a[0] + b[0]) / 2 - dy / L * (R - sg), (a[1] + b[1]) / 2 + dx / L * (R - sg), R]);
  }
  const cam = towardCamera(BAT_POSE);
  return { poly, cuts, eyes: beadEyes([0, 0.17, 0.02], [0.37, 0.33, 0.34], [0, 0, 1], cam, 0.4, 0.36, 0.1, 0.02) };
})();
function batWing(u, v, w){
  let d = SD.poly2(u, v, BAT.poly);
  for(const c of BAT.cuts) d = smax(d, -(len2(u - c[0], v - c[1]) - c[2]), 0.03);
  // the wing sweeps back a little as it spreads
  const k = Math.max(u - 0.15, 0), wb = w + 0.3 * k * k;
  let wing = SD.extrude(d - 0.03, wb, 0.03, 0.025);
  // the arm along the top edge, and two fingers from the wrist to the tips
  let bone = len2(seg2(u, v, 0.2, 0.17, 0.58, 0.49), wb) - 0.05;
  bone = Math.min(bone, len2(seg2(u, v, 0.58, 0.49, 1.0, 0.31), wb) - 0.04);
  bone = Math.min(bone, len2(seg2(u, v, 0.58, 0.49, 0.87, -0.04), wb) - 0.042);
  bone = Math.min(bone, len2(seg2(u, v, 0.58, 0.49, 0.63, -0.2), wb) - 0.042);
  return smin(wing, bone, 0.02) * 0.85;
}
OBJECTS.bat = {
  pose: BAT_POSE,
  materials: () => [
    C.clay({ albedo: hex('#8C7AB8'), rim: 0.7 }),                                  // 0 body, head, ears
    C.clay({ albedo: hex('#6A5A96'), rim: 0.7 }),                                  // 1 wings
    C.clay({ albedo: hex('#B3A2D8') }),                                            // 2 belly
    C.clay({ albedo: hex('#F2A9BF'), rim: 0.5 }),                                  // 3 inside the ears
    EYE()                                                                          // 4 eyes
  ],
  sdf(x, y, z, rec){
    // a round head over a round body, set back a little so the chin shows
    let d = smin(SD.ellipsoid(x, y - 0.17, z - 0.02, 0.37, 0.33, 0.34), SD.ellipsoid(x, y + 0.3, z + 0.03, 0.3, 0.31, 0.27), 0.08);
    let m = 0;
    if(rec && z > 0.06 && y < -0.14 && len2(x / 0.18, (y + 0.33) / 0.2) < 1) m = 2;
    const ax = Math.abs(x);
    const ear = SD.roundCone2(ax, y, (z - 0.02) / 0.5, 0.17, 0.36, 0, 0.29, 0.7, 0, 0.13, 0.03) * 0.5;
    if(ear < d + 0.04){
      const b = smin(d, ear, 0.04);
      if(ear < d){ m = 0; if(rec && z > 0.04 && SD.roundCone2(ax, y, 0, 0.18, 0.41, 0, 0.28, 0.66, 0, 0.075, 0.02) < 0) m = 3; }
      d = b;
    }
    const wing = batWing(ax, y, z);
    if(wing < d + 0.04){ const b = smin(d, wing, 0.04); if(wing < d) m = 1; d = b; }
    for(const e of BAT.eyes){
      const ed = SD.sphere(x - e[0], y - e[1], z - e[2], 0.075);
      if(ed < d){ d = ed; m = 4; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* BUN: a round, soft bread bun: a golden dome with a few pale sesame
   seeds on top, and a paler band low around its sides where it rose, over
   a flat bottom. No face. */
const BUN = { A: 0.95, B: 0.74 };
// seeds as [x, z, turn], spread over the side of the dome that faces us
BUN.seeds = [[0.0, 0.28, 0.4], [-0.3, 0.1, 2.0], [0.32, 0.12, 1.0], [-0.1, -0.15, 2.7], [0.22, -0.25, 0.3],
             [-0.42, 0.42, 1.2], [0.44, 0.42, 2.3], [0.04, 0.6, 1.6], [-0.56, -0.08, 0.7], [0.58, -0.02, 1.9]].map(p => {
  const r2 = (p[0] * p[0] + p[1] * p[1]) / (BUN.A * BUN.A);
  const c = [p[0], BUN.B * Math.sqrt(1 - r2), p[1]];
  const n = C.norm3([c[0] / (BUN.A * BUN.A), c[1] / (BUN.B * BUN.B), c[2] / (BUN.A * BUN.A)]);
  const g = [Math.cos(p[2]), 0, Math.sin(p[2])], gn = C.dot3(g, n);
  const t1 = C.norm3([g[0] - n[0] * gn, g[1] - n[1] * gn, g[2] - n[2] * gn]);
  const t2 = C.cross3(n, t1);
  return { c: [c[0] + n[0] * 0.004, c[1] + n[1] * 0.004, c[2] + n[2] * 0.004], n, t1, t2 };
});
OBJECTS.bun = {
  pose: { s: 0.997, t: [0.003, -0.034, 0], yaw: 0.3, pitch: 0.35 },
  materials: () => [
    C.clay({ albedo: hex('#E39B45'), rim: 0.35 }),                                 // 0 crust
    C.clay({ albedo: hex('#F6DDAE'), rim: 0.4 }),                                  // 1 the pale band
    C.clay({ albedo: hex('#FFF6E2'), rim: 0.45 })                                  // 2 seeds
  ],
  sdf(x, y, z, rec){
    let d = SD.ellipsoid(x, y, z, BUN.A, BUN.B, BUN.A);
    d = smax(d, -0.26 - y, 0.12);
    let m = 0;
    if(rec && y < 0.04 + 0.025 * Math.sin(7 * Math.atan2(z, x))) m = 1;
    for(const s of BUN.seeds){
      const px = x - s.c[0], py = y - s.c[1], pz = z - s.c[2];
      const sd = SD.ellipsoid(px * s.t1[0] + py * s.t1[1] + pz * s.t1[2], px * s.n[0] + py * s.n[1] + pz * s.n[2],
                              px * s.t2[0] + py * s.t2[1] + pz * s.t2[2], 0.075, 0.03, 0.045);
      if(sd < d){ d = sd; m = 2; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* PUP: a puppy sitting up and facing us: a big round tan head with a
   cream muzzle and a small dark nose, long floppy brown ears, a cream
   chest, front legs and paws, and a little tail up at its side. Two bead
   eyes. Its face is +z. */
const PUP_POSE = { s: 1.212, t: [-0.066, 0.052, 0], yaw: -0.25, pitch: 0.08 };
const PUP = (function(){
  const cam = towardCamera(PUP_POSE);
  const ears = [-1, 1].map(s => {
    const top = [s * 0.36, 0.62, 0];
    const f = C.norm3([s * 0.35, -1, 0.12]);
    const n0 = C.norm3([s, 0, 0.5]);
    const w = C.norm3(C.cross3(f, n0)), n = C.cross3(w, f);
    return { c: [top[0] + f[0] * 0.26, top[1] + f[1] * 0.26, top[2] + f[2] * 0.26], f, w, n };
  });
  const tail = makeTube(spline([[0.2, -0.55, -0.3], [0.42, -0.45, -0.34], [0.55, -0.22, -0.3], [0.58, 0.0, -0.25]], 16), 0.075, 0.05);
  return { ears, tail, eyes: beadEyes([0, 0.4, 0.04], [0.42, 0.37, 0.37], [0, 0, 1], cam, 0.4, 0.38, 0.3, 0.02) };
})();
OBJECTS.pup = {
  pose: PUP_POSE,
  materials: () => [
    C.clay({ albedo: hex('#E4B272'), rim: 0.4 }),                                  // 0 fur
    C.clay({ albedo: hex('#F5D9AE'), rim: 0.45 }),                                 // 1 muzzle, chest, paws
    C.clay({ albedo: hex('#8E5B3A'), rim: 0.5 }),                                  // 2 ears
    C.clay({ albedo: hex('#2B2638') }),                                            // 3 nose
    EYE()                                                                          // 4 eyes
  ],
  sdf(x, y, z, rec){
    const head = SD.ellipsoid(x, y - 0.4, z - 0.04, 0.42, 0.37, 0.37);
    let d = smin(head, SD.ellipsoid(x, y + 0.22, z + 0.02, 0.36, 0.4, 0.34), 0.1), m = 0;
    if(rec && z > 0.15 && len2(x / 0.2, (y + 0.05) / 0.3) < 1) m = 1;
    for(const s of [-1, 1]){
      d = smin(d, SD.ellipsoid(x - s * 0.25, y + 0.5, z + 0.06, 0.19, 0.2, 0.3), 0.08);
      d = smin(d, SD.capsule(x, y, z, s * 0.13, -0.15, 0.18, s * 0.14, -0.62, 0.24, 0.095), 0.05);
    }
    const tl = tubeDist(x, y, z, PUP.tail);
    if(tl < d + 0.05){ const b = smin(d, tl, 0.05); if(tl < d) m = 0; d = b; }
    let paw = 1e9;
    for(const s of [-1, 1]){
      paw = Math.min(paw, SD.ellipsoid(x - s * 0.14, y + 0.66, z - 0.3, 0.11, 0.07, 0.13));
      paw = Math.min(paw, SD.ellipsoid(x - s * 0.33, y + 0.68, z - 0.12, 0.1, 0.06, 0.15));
    }
    if(paw < d + 0.03){ const b = smin(d, paw, 0.03); if(paw < d) m = 1; d = b; }
    const muz = SD.ellipsoid(x, y - 0.27, z - 0.33, 0.21, 0.15, 0.17);
    if(muz < d + 0.06){ const b = smin(d, muz, 0.06); if(muz < d) m = 1; d = b; }
    const nose = SD.ellipsoid(x, y - 0.35, z - 0.47, 0.08, 0.055, 0.055);
    if(nose < d){ d = nose; m = 3; }
    for(const e of PUP.ears){
      const px = x - e.c[0], py = y - e.c[1], pz = z - e.c[2];
      const ed = SD.ellipsoid(px * e.f[0] + py * e.f[1] + pz * e.f[2], px * e.w[0] + py * e.w[1] + pz * e.w[2],
                              px * e.n[0] + py * e.n[1] + pz * e.n[2], 0.28, 0.15, 0.065) * 0.9;
      if(ed < d + 0.03){ const b = smin(d, ed, 0.03); if(ed < d) m = 2; d = b; }
    }
    for(const e of PUP.eyes){
      const ed = SD.sphere(x - e[0], y - e[1], z - e[2], 0.07);
      if(ed < d){ d = ed; m = 4; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* HUT: a small round hut: a cream mud wall with a dark arched doorway,
   under a tall cone of golden straw laid in two overlapping tiers whose
   eaves overhang the wall, with a little tuft on top. The wall and the
   doorway are what make it a hut, not a tent. The door is +z. */
// the roof's cross-section, from its tip down the outside to the eaves:
// two tiers of thatch, the upper one's hem lapping over the lower
const HUT_ROOF = [0, 1.0, 0.51, 0.45, 0.44, 0.45, 0.91, -0.05, 0.56, 0.08, 0, 0.08];
OBJECTS.hut = {
  pose: { s: 0.911, t: [0, -0.093, 0], yaw: 0.2, pitch: -0.02 },
  materials: () => [
    C.clay({ albedo: hex('#E9CB98'), rim: 0.45 }),                                 // 0 wall
    C.clay({ albedo: hex('#DDA343'), rim: 0.35 }),                                 // 1 straw
    C.clay({ albedo: hex('#4A3226'), rim: 0.5 }),                                  // 2 doorway
    C.clay({ albedo: hex('#C98A2E'), rim: 0.4 })                                   // 3 tuft
  ],
  sdf(x, y, z, rec){
    const q = len2(x, z), a = Math.atan2(z, x);
    let wall = SD.roundCylinder(x, y + 0.36, z, 0.6, 0.44, 0.06);
    const door = seg2(x, y, 0, -0.8, 0, -0.36) - 0.19;
    wall = smax(wall, -Math.max(door, 0.46 - z), 0.02);
    let d = wall, m = (rec && z > 0.3 && z < 0.55 && door < 0.02) ? 2 : 0;
    // straw: soft vertical flutes, fading toward the tip
    const qs = q - 0.022 * q * (0.5 + 0.5 * Math.cos(28 * a));
    const roof = (SD.poly2(qs, y, HUT_ROOF) - 0.025) * 0.9;
    if(roof < d){ d = roof; m = 1; }
    const tuft = SD.roundCone2(x, y, z, 0, 0.9, 0, 0, 1.12, 0, 0.07, 0.035);
    if(tuft < d + 0.03){ const b = smin(d, tuft, 0.03); if(tuft < d) m = 3; d = b; }
    if(rec) rec.m = m;
    return d;
  }
};

/* =========================================================
   THE SCENE — every object under picture.js's one camera
   ========================================================= */
function build(variant){
  const o = OBJECTS[variant];
  if(!o) throw new Error('picture-p5a: unknown variant ' + variant);
  return PIC.buildObject(o);
}
function post(){}
module.exports = { build: build, post: post };
