'use strict';
/* PICTURE-P5B — four Phase 5 word pictures: fox, box, mouse and nest. The
   same family as picture.js and picture-p3.js, built under its camera
   (buildObject), so they share its framing (about 80% of the frame), its
   gentle three-quarter view from slightly above, and its light.

   Each object is sculpted in its own frame at a natural size, then posed
   (yaw, pitch, roll), scaled and nudged to the centre of the picture.
   Only the fox and the mouse have faces: two bead eyes and a small nose. */
const C = require('../clay.js');
const PIC = require('./picture.js');
const P3 = require('./picture-p3.js').helpers;
const { SD, len2, len3, smin, smax, hex, clamp, smoothstep } = C;
const { basis } = PIC.helpers;
const { spline, ell2, tubeDist, towardCamera, beadEyes, EYE } = P3;

/* ---------- small helpers ---------- */
/* a tube along a smooth path (for tubeDist), its radius following a
   profile rad(u), u 0..1, where makeTube's only eases from one to another */
function profileTube(P, n, rad){
  const pts = spline(P, n);
  return { n, pts, rad: pts.map((p, i) => rad(i / n)) };
}
/* a point in a frame: origin o, axes B.f (forward), B.u (up), B.s (side) */
function inFrame(x, y, z, o, B, out){
  const px = x - o[0], py = y - o[1], pz = z - o[2];
  out[0] = px * B.f[0] + py * B.f[1] + pz * B.f[2];
  out[1] = px * B.u[0] + py * B.u[1] + pz * B.u[2];
  out[2] = px * B.s[0] + py * B.s[1] + pz * B.s[2];
  return out;
}
/* a head turned part of the way from +x toward the camera, level */
function headBasis(cam, turn){
  const a = turn * Math.atan2(cam[2], cam[0]);
  return basis([Math.cos(a), 0, Math.sin(a)], [0, 1, 0]);
}
function along(o, v, k, dy){ return [o[0] + v[0] * k, o[1] + v[1] * k + (dy || 0), o[2] + v[2] * k]; }

/* =========================================================
   THE OBJECTS — each: pose, materials, sdf(x, y, z, rec)
   ========================================================= */
const OBJECTS = {};

/* FOX: an orange fox sitting side-on, its head turned toward us: big
   pointed ears with dark tips, a long narrow snout with a dark nose, white
   cheeks, chin and chest, dark socks, and a big bushy tail curled round
   its feet with a white tip. Two bead eyes. It faces +x. */
const FOX_POSE = { s: 0.936, t: [-0.111, -0.782, 0], yaw: Math.PI + 0.45, pitch: 0.08 };
const FOX = (function(){
  const cam = towardCamera(FOX_POSE);
  const B = headBasis(cam, 0.4);
  const H = [0.26, 1.16, 0];
  const sf = C.norm3([B.f[0], -0.16, B.f[2]]);
  const tail = profileTube([[-0.28, 0.34, 0.02], [-0.58, 0.24, -0.12], [-0.6, 0.23, -0.44], [-0.28, 0.22, -0.64],
                            [0.12, 0.2, -0.62], [0.42, 0.24, -0.5]], 40,
                           u => 0.08 + 0.2 * smoothstep(0, 0.45, u) - 0.25 * smoothstep(0.66, 1, u));
  // the white tip begins at a plane across the tail: the nearest of two
  // tapering pieces flickers there, and a cut by it came out speckled
  const k = Math.round(0.78 * tail.n), a = tail.pts[k - 1], b = tail.pts[k + 1];
  return { B, H, s0: along(H, sf, 0.08, -0.07), s1: along(H, sf, 0.58, -0.07), nose: along(H, sf, 0.625, -0.07),
           eyes: beadEyes(H, [0.32, 0.29, 0.31], B.f, cam, 0.5, 0.42, 0.35, 0.02), tail,
           tipP: tail.pts[k], tipT: C.norm3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]) };
})();
const FOX_Q = [0, 0, 0];
OBJECTS.fox = {
  pose: FOX_POSE,
  materials: () => [
    C.clay({ albedo: hex('#E8702A'), rim: 0.4 }),                                  // 0 fur
    C.clay({ albedo: hex('#FFF4E6'), rim: 0.6 }),                                  // 1 white
    C.clay({ albedo: hex('#3A2A2E') }),                                            // 2 socks, ear tips, nose
    EYE()                                                                          // 3 eyes
  ],
  sdf(x, y, z, rec){
    // the body sitting: chest, belly, haunches, front legs and feet
    let d = SD.ellipsoid(x - 0.2, y - 0.62, z, 0.25, 0.4, 0.24);
    d = smin(d, SD.ellipsoid(x + 0.08, y - 0.32, z, 0.38, 0.3, 0.27), 0.15);
    let legs = 1e9;
    for(const k of [-1, 1]){
      d = smin(d, SD.ellipsoid(x + 0.1, y - 0.27, z - k * 0.16, 0.3, 0.25, 0.14), 0.08);
      legs = Math.min(legs, SD.capsule(x, y, z, 0.3, 0.5, k * 0.1, 0.36, 0.08, k * 0.1, 0.07));
      legs = Math.min(legs, SD.ellipsoid(x - 0.41, y - 0.045, z - k * 0.1, 0.1, 0.05, 0.07));
      legs = Math.min(legs, SD.ellipsoid(x - 0.1, y - 0.045, z - k * 0.24, 0.15, 0.05, 0.075));
    }
    d = smin(d, legs, 0.05);
    // the neck and the head
    const H = FOX.H, q = inFrame(x, y, z, H, FOX.B, FOX_Q);
    d = smin(d, SD.capsule(x, y, z, 0.2, 0.8, 0, H[0], H[1] - 0.08, H[2], 0.18), 0.1);
    let head = SD.ellipsoid(x - H[0], y - H[1], z - H[2], 0.32, 0.29, 0.31);
    for(const k of [-1, 1]) head = smin(head, SD.ellipsoid(q[0] - 0.02, q[1] + 0.11, q[2] - k * 0.21, 0.15, 0.13, 0.13), 0.06);
    const s0 = FOX.s0, s1 = FOX.s1;
    head = smin(head, SD.roundCone2(x, y, z, s0[0], s0[1], s0[2], s1[0], s1[1], s1[2], 0.16, 0.05), 0.06);
    let m = 0;
    if(rec){
      // white: the chin, the cheeks and the front of the snout's underside on
      // the head; a bib down the throat and chest on the body
      const az = Math.abs(z) / 0.24;
      if(head < d) m = (q[1] < -0.03 - 0.08 * smoothstep(0.1, 0.5, q[0]) && q[0] > -0.2) ? 1 : 0;
      else if((x - 0.2) / 0.25 > 0.25 + 0.9 * az * az && y > 0.46 + 0.3 * az) m = 1;
      if(legs < 0.02 && y < 0.26) m = 2;
    }
    d = smin(d, head, 0.06);
    // ears: big, tall and pointed, flat to the front, with dark tips
    for(const k of [-1, 1]){
      const ear = SD.roundCone2(q[2], q[1], (q[0] + 0.06) / 0.42, k * 0.14, 0.13, 0, k * 0.28, 0.64, 0, 0.18, 0.04) * 0.42;
      if(ear < d + 0.04){
        const b = smin(d, ear, 0.04);
        if(rec && ear < d){
          if(q[1] > 0.5) m = 2;
          else if(q[0] > -0.05 && SD.roundCone2(q[2], q[1], 0, k * 0.15, 0.15, 0, k * 0.26, 0.54, 0, 0.11, 0.025) < 0) m = 1;
          else m = 0;
        }
        d = b;
      }
    }
    // the nose
    const n = SD.sphere(x - FOX.nose[0], y - FOX.nose[1], z - FOX.nose[2], 0.06);
    if(n < d){ d = n; m = 2; }
    // the tail: big and bushy, curled round the feet, with a white tip
    const tl = tubeDist(x, y, z, FOX.tail);
    if(tl < d + 0.04){
      const b = smin(d, tl, 0.04), P = FOX.tipP, T = FOX.tipT;
      if(rec && tl < d) m = ((x - P[0]) * T[0] + (y - P[1]) * T[1] + (z - P[2]) * T[2] > 0) ? 1 : 0;
      d = b;
    }
    for(const e of FOX.eyes){
      const ed = SD.sphere(x - e[0], y - e[1], z - e[2], 0.062);
      if(ed < d){ d = ed; m = 3; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* BOX: a cardboard box, its four top flaps folded open, a darker inside,
   and a strip of darker tape down the end that faces the light. Turned
   inside the sdf (BOX.TURN), so the pose's pitch shows its open top rather
   than rolling it over. */
const BOX = (function(){
  const A = 0.6, HY = 0.42, Z = 0.5, T = 0.05, L = 0.42;
  // each flap: its edge's outward normal, half its length, and how far it has fallen open from upright
  const flaps = [[[0, 0, 1], A - 0.02, 1.15], [[-1, 0, 0], Z - 0.07, 0.95], [[0, 0, -1], A - 0.02, 0.35], [[1, 0, 0], Z - 0.07, 0.5]].map(f => {
    const n = f[0], ext = n[0] !== 0 ? A : Z, c = Math.cos(f[2]), s = Math.sin(f[2]);
    return { h: [n[0] * (ext - T / 2), HY, n[2] * (ext - T / 2)], e: [n[2], 0, -n[0]], half: f[1],
             v: [n[0] * s, c, n[2] * s], w: [n[0] * c, -s, n[2] * c] };
  });
  return { A, HY, Z, T, L, flaps, TURN: 0.62, TAPE: 0.11 };
})();
OBJECTS.box = {
  pose: { s: 0.92, t: [0.007, -0.174, 0], pitch: 0.35 },
  materials: () => [
    C.clay({ albedo: hex('#D2A064'), rim: 0.35 }),                                 // 0 cardboard
    C.clay({ albedo: hex('#9C6A3C'), rim: 0.5 }),                                  // 1 inside
    C.clay({ albedo: hex('#B5773D'), rim: 0.4 })                                   // 2 tape
  ],
  sdf(x0, y, z0, rec){
    const ct = Math.cos(BOX.TURN), st = Math.sin(BOX.TURN);
    const x = x0 * ct - z0 * st, z = x0 * st + z0 * ct;
    const { A, HY, Z, T, L } = BOX;
    const outer = SD.roundBox(x, y, z, A, HY, Z, 0.06);
    const inner = SD.roundBox(x, y - 0.6, z, A - T, HY + 0.6 - T, Z - T, 0.03);
    let d = smax(outer, -inner, 0.012), m = (rec && inner < 0.02) ? 1 : 0;
    // the tape that sealed the lid, cut open: a strip down the middle of
    // each end, over the rim and under the bottom, raised a little so it
    // reads as stuck on (short, flat and dark, it read as a handle hole)
    const tape = smax(outer - 0.012, Math.max(Math.abs(z) - BOX.TAPE, A - 0.035 - Math.abs(x)), 0.008);
    if(tape < d){ d = tape; m = 2; }
    for(const f of BOX.flaps){
      const px = x - f.h[0], py = y - f.h[1], pz = z - f.h[2];
      const e = px * f.e[0] + pz * f.e[2];
      const v = px * f.v[0] + py * f.v[1] + pz * f.v[2];
      const w = px * f.w[0] + py * f.w[1] + pz * f.w[2];
      const fd = SD.roundBox(e, v - L / 2, w, f.half, L / 2, T / 2, 0.022);
      if(fd < d){ d = fd; m = 0; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* MOUSE: a small grey mouse, round as an egg, its head turned toward us:
   big round cupped ears, pink inside, a pink nose, little pink feet, and a
   long thin tail curling out behind. Two bead eyes. It faces +x. */
const MOUSE_POSE = { s: 1.11, t: [-0.23, -0.574, 0], yaw: Math.PI + 0.5, pitch: 0.12 };
const MOUSE = (function(){
  const cam = towardCamera(MOUSE_POSE);
  const B = headBasis(cam, 0.45);
  const H = [0.3, 0.56, 0];
  const sf = C.norm3([B.f[0], -0.2, B.f[2]]);
  const ears = [-1, 1].map(k => {
    const c = [H[0] + B.s[0] * k * 0.2 - B.f[0] * 0.08, H[1] + 0.3, H[2] + B.s[2] * k * 0.2 - B.f[2] * 0.08];
    const n = C.norm3([B.f[0] * Math.cos(0.5) + B.s[0] * k * Math.sin(0.5), 0.12, B.f[2] * Math.cos(0.5) + B.s[2] * k * Math.sin(0.5)]);
    const e1 = C.norm3(C.cross3(n, [0, 1, 0])), e2 = C.cross3(e1, n);
    return { c, n, e1, e2 };
  });
  const tail = profileTube([[-0.5, 0.2, 0], [-0.8, 0.06, 0.02], [-1.06, 0.07, 0], [-1.22, 0.2, -0.04],
                            [-1.2, 0.4, -0.07], [-1.06, 0.47, -0.07], [-0.98, 0.37, -0.06]], 30, u => 0.042 - 0.02 * u);
  return { B, H, ears, tail, s0: along(H, sf, 0.1, -0.02), s1: along(H, sf, 0.42, -0.02), nose: along(H, sf, 0.46, -0.02),
           eyes: beadEyes(H, [0.3, 0.3, 0.3], B.f, cam, 0.55, 0.42, 0.3, 0.02) };
})();
OBJECTS.mouse = {
  pose: MOUSE_POSE,
  materials: () => [
    C.clay({ albedo: hex('#A9A6AA') }),                                            // 0 fur
    C.clay({ albedo: hex('#F7A1B5'), rim: 0.5 }),                                  // 1 ears inside, nose, feet, tail
    EYE()                                                                          // 2 eyes
  ],
  sdf(x, y, z, rec){
    const H = MOUSE.H, s0 = MOUSE.s0, s1 = MOUSE.s1;
    let d = smax(SD.ellipsoid(x + 0.1, y - 0.38, z, 0.52, 0.4, 0.4), -y, 0.06);
    d = smin(d, SD.sphere(x - H[0], y - H[1], z - H[2], 0.3), 0.18);
    d = smin(d, SD.roundCone2(x, y, z, s0[0], s0[1], s0[2], s1[0], s1[1], s1[2], 0.19, 0.06), 0.08);
    let m = 0;
    for(const e of MOUSE.ears){
      const px = x - e.c[0], py = y - e.c[1], pz = z - e.c[2];
      const qn = px * e.n[0] + py * e.n[1] + pz * e.n[2];
      const q1 = px * e.e1[0] + py * e.e1[1] + pz * e.e1[2], q2 = px * e.e2[0] + py * e.e2[1] + pz * e.e2[2];
      // a round disc with a soft rim (a flat ellipsoid's distance was loose
      // here, up to twice too far), hollowed into a cup
      let ear = SD.roundCylinder(q1, qn, q2, 0.22, 0.06, 0.05);
      ear = smax(ear, -(len3(q1, q2, qn - 0.2) - 0.22), 0.02);
      // pink over the whole hollow of the cup (its floor is 0.02 behind the
      // ear's middle; the back is 0.06), grey on the rim and behind
      if(ear < d + 0.03){ const b = smin(d, ear, 0.03); if(ear < d) m = (qn > -0.04 && len2(q1, q2) < 0.17) ? 1 : 0; d = b; }
    }
    let pink = SD.sphere(x - MOUSE.nose[0], y - MOUSE.nose[1], z - MOUSE.nose[2], 0.065);
    for(const k of [-1, 1]) pink = Math.min(pink, SD.ellipsoid(x - 0.2, y - 0.035, z - k * 0.13, 0.075, 0.04, 0.055));
    pink = Math.min(pink, tubeDist(x, y, z, MOUSE.tail));
    if(pink < d + 0.02){ const b = smin(d, pink, 0.02); if(pink < d) m = 1; d = b; }
    for(const e of MOUSE.eyes){
      const ed = SD.sphere(x - e[0], y - e[1], z - e[2], 0.065);
      if(ed < d){ d = ed; m = 2; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* NEST: a round nest of twigs seen from above, holding three pale blue
   eggs. The wall is ten thick twig rings, each tilted its own way so they
   cross like weaving, in three browns, with twig ends poking out all
   round; the eggs lie on a dark lining. Woven strands that wave over and
   under each other were tried, and read as a basket. */
function tilt(beta, tau){
  // a rotation about the level axis at angle beta, by tau
  const a = [Math.cos(beta), 0, Math.sin(beta)], c = Math.cos(tau), s = Math.sin(tau), t = 1 - c;
  return [c + a[0] * a[0] * t, -a[2] * s, a[0] * a[2] * t,
          a[2] * s, c, -a[0] * s,
          a[2] * a[0] * t, a[0] * s, c + a[2] * a[2] * t];
}
const NEST = (function(){
  // ten twig rings, each tilted its own way, rising and widening a little
  // toward the rim, so the wall flares like a cup
  const rnd = C.rng(11), rings = [];
  for(let i = 0; i < 10; i++){
    const h = i / 9;
    rings.push({ cy: -0.04 + 0.3 * h + 0.03 * (rnd() - 0.5), M: tilt(i * 2.4 + rnd(), 0.12 + 0.14 * rnd()),
                 R: 0.72 + 0.12 * h + 0.03 * (rnd() - 0.5), r: 0.1 - 0.02 * h, m: i % 3 });
  }
  const eggs = [[0.6, 0.3], [2.7, 2.2], [4.8, 4.4]].map(e => {
    const c = [0.27 * Math.cos(e[0]), 0.33, 0.27 * Math.sin(e[0])];
    const ax = C.norm3([Math.cos(e[1]), 0.25, Math.sin(e[1])]);
    return { c, ax };
  });
  // twig ends poking out: where round the rim, how high, which way (along
  // the rim, outward, up) and how far
  const twigs = [[0.4, 0.3, 0.7, 0.5, 0.35, 0.36], [1.6, 0.1, -0.6, 0.7, 0.1, 0.32], [2.8, 0.34, 0.5, 0.6, 0.5, 0.36],
                 [3.9, 0.05, -0.7, 0.6, -0.1, 0.3], [5.0, 0.3, 0.8, 0.4, 0.3, 0.34], [4.4, 0.3, -0.5, 0.45, 0.6, 0.34],
                 [5.6, 0.26, 0.6, 0.5, 0.45, 0.32], [2.2, 0.08, -0.6, 0.7, -0.15, 0.28]].map((t, i) => {
    const a = t[0], r = [Math.cos(a), 0, Math.sin(a)], tg = [-Math.sin(a), 0, Math.cos(a)];
    const p = [0.84 * r[0], t[1], 0.84 * r[2]];
    const v = C.norm3([tg[0] * t[2] + r[0] * t[3], t[4], tg[2] * t[2] + r[2] * t[3]]);
    // in two browns and two thicknesses, so they read as twigs, not pegs
    return { a: [p[0] - v[0] * 0.1, p[1] - v[1] * 0.1, p[2] - v[2] * 0.1], b: [p[0] + v[0] * t[5], p[1] + v[1] * t[5], p[2] + v[2] * t[5]],
             r: i % 2 ? 0.034 : 0.043, m: i % 2 ? 0 : 1 };
  });
  return { rings, eggs, twigs };
})();
OBJECTS.nest = {
  pose: { s: 0.879, t: [-0.043, -0.096, 0], yaw: 0.3, pitch: 0.5 },
  materials: () => [
    C.clay({ albedo: hex('#9A643A'), rim: 0.5 }),                                  // 0 twigs
    C.clay({ albedo: hex('#C8925A'), rim: 0.45 }),                                 // 1 lighter twigs
    C.clay({ albedo: hex('#704629'), rim: 0.5 }),                                  // 2 darker twigs
    C.clay({ albedo: hex('#4E3322'), rim: 0.5 }),                                  // 3 lining
    C.clay({ albedo: hex('#A8DAF0') })                                             // 4 eggs
  ],
  sdf(x, y, z, rec){
    let d = SD.ellipsoid(x, y + 0.1, z, 0.72, 0.26, 0.72), m = y > 0.04 ? 3 : 0;
    for(const g of NEST.rings){
      const M = g.M, py = y - g.cy;
      const qx = M[0] * x + M[1] * py + M[2] * z, qy = M[3] * x + M[4] * py + M[5] * z, qz = M[6] * x + M[7] * py + M[8] * z;
      const rd = SD.torus(qx, qy, qz, g.R, g.r);
      if(rd < d + 0.015){ const b = smin(d, rd, 0.015); if(rd < d) m = g.m; d = b; }
    }
    for(const t of NEST.twigs){
      const td = SD.capsule(x, y, z, t.a[0], t.a[1], t.a[2], t.b[0], t.b[1], t.b[2], t.r);
      if(td < d){ d = td; m = t.m; }
    }
    for(const e of NEST.eggs){
      const px = x - e.c[0], py = y - e.c[1], pz = z - e.c[2];
      const w = px * e.ax[0] + py * e.ax[1] + pz * e.ax[2];
      const rho = len3(px - e.ax[0] * w, py - e.ax[1] * w, pz - e.ax[2] * w);
      const k = 1 - 0.1 * clamp(w / 0.29, -1, 1);
      const ed = ell2(rho / k, w, 0.205, 0.29) * k * 0.9;
      if(ed < d){ d = ed; m = 4; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* =========================================================
   THE SCENE — every object under picture.js's one camera
   ========================================================= */
function build(variant){
  const o = OBJECTS[variant];
  if(!o) throw new Error('picture-p5b: unknown variant ' + variant);
  return PIC.buildObject(o);
}
function post(){}
module.exports = { build: build, post: post };
