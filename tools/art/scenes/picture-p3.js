'use strict';
/* PICTURE-P3 — the Phase 3 word pictures: seventeen more small clay
   objects a child names, in the same family as picture.js and built under
   its camera (buildObject), so they share its framing (about 80% of the
   frame), its gentle three-quarter view from slightly above, and its light.

   Each object is sculpted in its own frame at a natural size, then posed
   (yaw, pitch, roll), scaled and nudged to the centre of the picture.
   Only the fish, the cat and the bug have faces: two bead eyes each. */
const C = require('../clay.js');
const PIC = require('./picture.js');
const { SD, len2, len3, smin, smax, hex, clamp, smoothstep } = C;
const { makePose } = PIC.helpers;

/* ---------- small helpers ---------- */
function seg2(px, py, ax, ay, bx, by){
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1);
  return len2(pax - bax * h, pay - bay * h);
}
/* distance to a 2D polyline given as [x0, y0, x1, y1, …] */
function line2(px, py, v){
  let d = 1e9;
  for(let i = 0; i + 3 < v.length; i += 2) d = Math.min(d, seg2(px, py, v[i], v[i + 1], v[i + 2], v[i + 3]));
  return d;
}
/* a 2D ellipse (close to exact near its edge) */
function ell2(x, y, a, b){ return SD.ellipsoid(x, y, 0, a, b, 1); }
/* a smooth path through control points (Catmull-Rom), n + 1 samples */
function spline(P, n){
  const out = [];
  for(let i = 0; i <= n; i++){
    const u = i / n * (P.length - 1);
    const k = Math.min(Math.floor(u), P.length - 2), f = u - k;
    const p0 = P[Math.max(k - 1, 0)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(k + 2, P.length - 1)];
    const r = [];
    for(let c = 0; c < p1.length; c++){
      r.push(0.5 * (2 * p1[c] + (p2[c] - p0[c]) * f + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * f * f +
                    (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * f * f * f));
    }
    out.push(r);
  }
  return out;
}
/* a tube along a path of points, its radius easing from r0 to r1 */
function makeTube(pts, r0, r1){
  const rad = pts.map((p, i) => r0 + (r1 - r0) * i / (pts.length - 1));
  return { pts, rad };
}
function tubeDist(x, y, z, T){
  let d = 1e9;
  for(let i = 0; i + 1 < T.pts.length; i++){
    const a = T.pts[i], b = T.pts[i + 1];
    d = Math.min(d, SD.roundCone2(x, y, z, a[0], a[1], a[2], b[0], b[1], b[2], T.rad[i], T.rad[i + 1]));
  }
  return d;
}
/* a direction turned about y the way makePose undoes a yaw */
function turnY(v, a){
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
}
/* The direction to the camera in an object's own frame, from its pose. */
function towardCamera(pose){
  const f = makePose(pose), t = pose.t || [0, 0, 0], E = PIC.camera.ELEV;
  const a = f(t[0], t[1], t[2]).slice();
  const b = f(t[0], t[1] + Math.sin(E), t[2] + Math.cos(E));
  return C.norm3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
}
/* Two bead eyes on an ellipsoid (centre o, radii r), either side of a
   direction between where the face points and the camera, as the bee's. */
function beadEyes(o, r, face, cam, wCam, spread, lift, sink){
  const c = C.norm3([face[0] + cam[0] * wCam, face[1] + cam[1] * wCam + lift, face[2] + cam[2] * wCam]);
  const h = C.norm3([c[2], 0, -c[0]]);
  const eyes = [];
  for(const k of [-1, 1]){
    const d = C.norm3([c[0] + k * spread * h[0], c[1], c[2] + k * spread * h[2]]);
    const l = len3(d[0] / r[0], d[1] / r[1], d[2] / r[2]);
    eyes.push([o[0] + d[0] / l - d[0] * sink, o[1] + d[1] / l - d[1] * sink, o[2] + d[2] / l - d[2] * sink]);
  }
  return eyes;
}
const EYE = () => C.clay({ albedo: hex('#1B1F3B'), spec: 1.4, specPow: 60, sheen: 0.05 });

/* =========================================================
   THE OBJECTS — each: pose, materials, sdf(x, y, z, rec)
   ========================================================= */
const OBJECTS = {};

/* MAP: a treasure map of parchment clay, folded in four and opened out a
   little so its panels zigzag, with a dotted path across it to a red star. */
const MAP = (function(){
  const A = 0.19;
  const star = [0.66, -0.34];
  const pts = spline([[-0.8, 0.44], [-0.5, 0.14], [-0.15, 0.38], [0.18, 0.1], [0.3, -0.22], star], 240);
  const dots = [];
  let acc = 0.1;
  for(let i = 1; i < pts.length; i++){
    acc += len2(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if(acc >= 0.15 && len2(pts[i][0] - star[0], pts[i][1] - star[1]) > 0.22){ dots.push(pts[i]); acc = 0; }
  }
  return { prof: [-1.0, 0, -0.5, A, 0, 0, 0.5, A, 1.0, 0], dots, star };
})();
OBJECTS.map = {
  pose: { s: 0.844, t: [0.006, -0.003, 0], yaw: -0.25, pitch: 0.75 },
  materials: () => [
    C.clay({ albedo: hex('#F1D9A4'), rim: 0.5 }),                                  // 0 parchment
    C.clay({ albedo: hex('#8A5A3B'), rim: 0.5 }),                                  // 1 dotted path
    C.clay({ albedo: hex('#E23B36'), rim: 0.4 })                                   // 2 star
  ],
  sdf(x, y, z, rec){
    const d = SD.extrude(line2(x, y, MAP.prof) - 0.032, z, 0.7, 0.025);
    if(rec){
      let m = 0;
      if(SD.star2(x - MAP.star[0], -(z - MAP.star[1]), 0.17, 0.45) < 0) m = 2;
      else for(const p of MAP.dots) if(len2(x - p[0], z - p[1]) < 0.042){ m = 1; break; }
      rec.m = m;
    }
    return d;
  }
};

/* SUN: a domed disc of warm yellow clay with ten short, rounded orange
   rays, turned a little so its thickness shows. It gives a little warm
   light of its own, and a soft warm halo (post). */
const SUN_N = 10;
OBJECTS.sun = {
  pose: { s: 0.943, t: [-0.023, -0.024, 0], yaw: -0.3, pitch: 0.12 },
  materials: () => [
    C.clay({ albedo: hex('#FFC634'), rim: 0.35, emissive: [0.05, 0.035, 0.004] }), // 0 disc
    C.clay({ albedo: hex('#FF9B2F'), rim: 0.35, emissive: [0.045, 0.02, 0.002] })  // 1 rays
  ],
  sdf(x, y, z, rec){
    const disc = SD.ellipsoid(x, y, z, 0.62, 0.62, 0.3);
    const sec = 2 * Math.PI / SUN_N, k = Math.round(Math.atan2(y, x) / sec);
    let ray = 1e9;
    for(let j = k - 1; j <= k + 1; j++){
      const cb = Math.cos(j * sec), sb = Math.sin(j * sec);
      const px = x * cb + y * sb, py = -x * sb + y * cb;
      ray = Math.min(ray, SD.roundCone2(px, py, z / 0.55, 0.5, 0, 0, 0.92, 0, 0, 0.17, 0.06) * 0.55);
    }
    if(rec) rec.m = disc < ray ? 0 : 1;
    return smin(disc, ray, 0.05);
  }
};

/* FISH: a plump orange fish seen from the side, head to the left and
   turned a little toward us, with a broad forked tail, a tall dorsal fin,
   a small belly fin, and two bead eyes. The head is +x. */
const FISH_POSE = { s: 0.957, t: [-0.239, -0.136, 0], yaw: Math.PI + 0.4, pitch: 0.1 };
const FISH = (function(){
  const cam = towardCamera(FISH_POSE);
  return { eyes: beadEyes([0.05, 0, 0], [0.72, 0.54, 0.3], [1, 0, 0], cam, 0.9, 0.3, 0.3, 0.03) };
})();
OBJECTS.fish = {
  pose: FISH_POSE,
  materials: () => [
    C.clay({ albedo: hex('#FF8A3D'), rim: 0.4 }),                                  // 0 body
    C.clay({ albedo: hex('#FFB84D'), rim: 0.4 }),                                  // 1 fins, tail
    EYE()                                                                          // 2 eyes
  ],
  sdf(x, y, z, rec){
    let d = smin(SD.ellipsoid(x - 0.05, y, z, 0.72, 0.54, 0.3), SD.ellipsoid(x + 0.5, y, z, 0.4, 0.22, 0.14), 0.25);
    let m = 0;
    // a broad forked tail, a tall dorsal fin and a small fin below: flat clay
    const zt = z / 0.4;
    let fin = Math.min(SD.roundCone2(x, y, zt, -0.78, 0, 0, -1.22, 0.42, 0, 0.09, 0.17),
                       SD.roundCone2(x, y, zt, -0.78, 0, 0, -1.22, -0.42, 0, 0.09, 0.17));
    fin = smin(fin, SD.ellipsoid(x + 1.0, y, zt, 0.2, 0.26, 0.12), 0.05);
    fin = Math.min(fin, SD.roundCone2(x, y, zt, 0.1, 0.36, 0, -0.28, 0.74, 0, 0.22, 0.07));
    fin = Math.min(fin, SD.roundCone2(x, y, zt, -0.18, -0.36, 0, -0.38, -0.58, 0, 0.12, 0.05)) * 0.4;
    if(fin < d + 0.06){ const b = smin(d, fin, 0.06); if(fin < d) m = 1; d = b; }
    for(const e of FISH.eyes){
      const ed = SD.sphere(x - e[0], y - e[1], z - e[2], 0.085);
      if(ed < d){ d = ed; m = 2; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* FAN: an electric desk fan: three blades inside a round guard (a rim, a
   ring and spokes that dome forward to a badge, and a back grille), a
   motor behind, on a neck and a round base. Its face is +z. */
const FAN = { R: 0.74, HY: 0.3, NS: 12 };
OBJECTS.fan = {
  pose: { s: 0.994, t: [-0.017, -0.119, 0], yaw: -0.5, pitch: 0.06 },
  materials: () => [
    C.clay({ albedo: hex('#79C3F2') }),                                            // 0 guard, motor, stand
    C.clay({ albedo: hex('#F4F2EC') })                                             // 1 blades
  ],
  sdf(x, y, z, rec){
    const hy = y - FAN.HY, a = Math.atan2(hy, x);
    let g = SD.torus(x, z, hy, FAN.R, 0.058);
    g = Math.min(g, SD.torus(x, z - 0.126, hy, 0.45, 0.02));
    const sec = 2 * Math.PI / FAN.NS, ks = Math.round(a / sec);
    for(const j of [ks, ks + (a > ks * sec ? 1 : -1)]){
      const cb = Math.cos(j * sec), sb = Math.sin(j * sec);
      const px = x * cb + hy * sb, py = -x * sb + hy * cb;
      g = Math.min(g, SD.capsule(px, py, z, 0.14, 0, 0.24, FAN.R, 0, 0.02, 0.022));
      g = Math.min(g, SD.capsule(px, py, z, 0.16, 0, -0.26, FAN.R, 0, -0.03, 0.02));
    }
    g = Math.min(g, SD.roundCylinder(x, z - 0.25, hy, 0.15, 0.045, 0.035));
    // the motor, the neck and the base
    g = Math.min(g, SD.capsule(x, hy, z, 0, 0, -0.34, 0, 0, -0.58, 0.22));
    g = smin(g, SD.capsule(x, y, z, 0, FAN.HY - 0.12, -0.48, 0, -0.74, -0.32, 0.075), 0.05);
    g = smin(g, SD.roundCylinder(x, y + 0.8, (z + 0.3) / 0.8, 0.5, 0.08, 0.07) * 0.8, 0.06);
    // the blades, twisted, between the grilles: extruded ellipses, not flat
    // ellipsoids, whose loose distance let the soft shadow go falsely black
    const bsec = 2 * Math.PI / 3, kb = Math.round((a - 0.3) / bsec);
    let bl = SD.roundCylinder(x, z, hy, 0.12, 0.08, 0.05);
    for(let j = kb - 1; j <= kb + 1; j++){
      const b = j * bsec + 0.3, cb = Math.cos(b), sb = Math.sin(b);
      const px = x * cb + hy * sb, py = -x * sb + hy * cb;
      const ct = Math.cos(0.4), st = Math.sin(0.4);
      const qy = py * ct - z * st, qz = py * st + z * ct;
      bl = Math.min(bl, SD.extrude(ell2(px - 0.37, qy, 0.3, 0.2), qz, 0.03, 0.025) * 0.9);
    }
    if(rec) rec.m = bl < g ? 1 : 0;
    return Math.min(g, bl);
  }
};

/* NET: a butterfly net: a wooden handle, a red hoop and a soft white mesh
   bag that sags behind the hoop, its strings crossing in diamonds with
   real holes between them. The hoop faces +z; the handle runs down. */
const NET_POSE = { s: 0.869, t: [0.283, 0.477, 0], yaw: 0.9, pitch: 0.2, roll: -0.6 };
const NET = (function(){
  // world-down in the net's own frame, so the bag sags the way things fall
  const f = makePose(NET_POSE), t = NET_POSE.t;
  const a = f(t[0], t[1], t[2]).slice(), b = f(t[0], t[1] - 1, t[2]);
  const g = [b[0] - a[0], b[1] - a[1]], gl = len2(g[0], g[1]) || 1;
  return { R: 0.52, L: 1.15, NU: 14, NV: 5, gx: g[0] / gl, gy: g[1] / gl };
})();
OBJECTS.net = {
  pose: NET_POSE,
  materials: () => [
    C.clay({ albedo: hex('#F3F1F6') }),                                            // 0 mesh
    C.clay({ albedo: hex('#E8553E'), rim: 0.45 }),                                 // 1 hoop
    C.clay({ albedo: hex('#C08A55'), rim: 0.5 })                                   // 2 handle
  ],
  sdf(x, y, z, rec){
    const hoop = SD.torus(x, z, y, NET.R, 0.045);
    const handle = SD.capsule(x, y, z, 0, -NET.R - 0.02, 0, 0, -1.75, 0, 0.055);
    const h = -z, sag = 0.5 * Math.max(h, 0) * Math.max(h, 0);
    const bx = x - NET.gx * sag, by = y - NET.gy * sag;
    const rho = len2(bx, by);
    let bag = Math.abs(ell2(rho, h, NET.R, NET.L)) - 0.018;
    bag = Math.max(bag, -h);
    const th = Math.atan2(by, bx), phi = Math.atan2(h / NET.L, rho / NET.R);
    const u = th / (2 * Math.PI) * NET.NU, v = phi / (Math.PI / 2) * NET.NV;
    const f1 = Math.abs(u + v - Math.round(u + v)), f2 = Math.abs(u - v - Math.round(u - v));
    const cell = Math.min(2 * Math.PI * rho / NET.NU, 0.3);
    // the sag stretches space by up to about 1.5, so the bag's distance is
    // scaled well under 1: a distance that grows faster than the shadow ray
    // makes the soft shadow read a false black
    bag = Math.max(bag, Math.min(f1, f2) * cell * 0.7 - 0.02) * 0.55;
    let d = bag, m = 0;
    if(hoop < d){ d = hoop; m = 1; }
    if(handle < d){ d = handle; m = 2; }
    if(rec) rec.m = m;
    return d;
  }
};

/* RUG: a small rectangular rug lying flat, in bold stripes pressed apart
   by soft grooves, with a cream fringe along both short ends and a gentle
   rumple, so it reads as thick soft cloth rather than a board. */
const RUG_BANDS = [1, 0, 2, 3, 2, 0, 1];
OBJECTS.rug = {
  pose: { s: 0.778, t: [0.005, 0.022, 0], yaw: 0.25, pitch: 0.82 },
  materials: () => [
    C.clay({ albedo: hex('#F6E3C0') }),                                            // 0 cream, fringe
    C.clay({ albedo: hex('#2FB0A4') }),                                            // 1 teal
    C.clay({ albedo: hex('#FF7A55'), rim: 0.45 }),                                 // 2 coral
    C.clay({ albedo: hex('#FFC634'), rim: 0.4 })                                   // 3 yellow
  ],
  sdf(x, y, z, rec){
    const fx = (x + 1.0) / (2.0 / 7), nb = Math.round(fx);
    const groove = (nb > 0 && nb < 7) ? 0.006 * (1 - smoothstep(0, 0.08, Math.abs(fx - nb))) : 0;
    const ry = y - 0.05 * Math.sin(1.7 * x + 0.9) * (0.7 + 0.3 * Math.cos(2.1 * z + 0.4)) + groove;
    let d = SD.roundBox(x, ry, z, 1.0, 0.04, 0.64, 0.035) * 0.8, m = -1;
    const sp = 0.115, zi = clamp(Math.round(z / sp), -5, 5) * sp;
    const fr = SD.capsule(Math.abs(x), ry, z - zi, 0.97, 0, 0, 1.13, -0.01, 0, 0.024);
    if(fr < d){ d = smin(d, fr, 0.01); m = 0; }
    if(rec){
      if(m < 0) m = RUG_BANDS[clamp(Math.floor(fx), 0, 6)];
      rec.m = m;
    }
    return d;
  }
};

/* HAT: a wide-brimmed straw sun hat: a round dome crown, a brim that
   droops softly toward its wavy edge, and a ribbon band with a bow. */
const HAT_BOW = 2.4;
OBJECTS.hat = {
  pose: { s: 0.934, t: [0.016, 0.146, 0], yaw: 0.2, pitch: 0.38 },
  materials: () => [
    C.clay({ albedo: hex('#EDCB7E'), rim: 0.45 }),                                 // 0 straw
    C.clay({ albedo: hex('#EF5A6F'), rim: 0.5 })                                   // 1 ribbon
  ],
  sdf(x, y, z, rec){
    const q = len2(x, z), a = Math.atan2(z, x);
    const e = smoothstep(0.42, 1.05, q);
    const yb = -0.2 * e * e + 0.035 * Math.cos(3 * a + 0.8) * e;
    const brim = SD.extrude(q - 1.02, y - yb, 0.032, 0.03) * 0.8;
    let crown = SD.ellipsoid(x, y - 0.02, z, 0.47, 0.52, 0.47);
    crown = smax(crown, -y - 0.03, 0.02);
    let d = smin(brim, crown, 0.06), m = 0;
    let rib = SD.roundCylinder(x, y - 0.1, z, 0.49, 0.075, 0.03);
    // the bow, on the band
    const n0 = Math.cos(HAT_BOW), n2 = Math.sin(HAT_BOW);
    const px = x - 0.5 * n0, py = y - 0.1, pz = z - 0.5 * n2;
    const bn = px * n0 + pz * n2, bt = -px * n2 + pz * n0;
    let bow = SD.ellipsoid(bt, py, bn - 0.025, 0.075, 0.075, 0.06);
    for(const s of [-1, 1]){
      bow = Math.min(bow, SD.extrude(ell2(bt - s * 0.16, py - 0.035, 0.16, 0.095), bn - 0.035, 0.04, 0.035) * 0.9);
      bow = Math.min(bow, SD.capsule(bt, py, bn, s * 0.03, -0.03, 0.05, s * 0.13, -0.2, 0.17, 0.035));
    }
    rib = Math.min(rib, bow);
    if(rib < d){ d = rib; m = 1; }
    if(rec) rec.m = m;
    return d;
  }
};

/* CAT: a friendly sitting cat, facing us a little from the side: a round
   head with pointed ears (pink inside), a pear-shaped body, two front
   legs, and a tail curled up at its side like a question mark. Two bead
   eyes, nothing more. Its face is +z. */
const CAT_POSE = { s: 0.937, t: [-0.211, -0.164, 0], yaw: -0.35, pitch: 0.08 };
const CAT = (function(){
  const cam = towardCamera(CAT_POSE);
  const tail = makeTube(spline([[0.25, -0.62, -0.3], [0.6, -0.55, -0.3], [0.78, -0.18, -0.26], [0.74, 0.22, -0.2],
                                [0.56, 0.38, -0.16], [0.46, 0.24, -0.12]], 28), 0.09, 0.07);
  return { tail, eyes: beadEyes([0, 0.66, 0.08], [0.4, 0.34, 0.36], [0, 0, 1], cam, 0.4, 0.36, 0.08, 0.02) };
})();
OBJECTS.cat = {
  pose: CAT_POSE,
  materials: () => [
    C.clay({ albedo: hex('#F4A04E'), rim: 0.4 }),                                  // 0 fur
    C.clay({ albedo: hex('#F7A1B5'), rim: 0.5 }),                                  // 1 inside the ears
    EYE()                                                                          // 2 eyes
  ],
  sdf(x, y, z, rec){
    let d = smin(SD.ellipsoid(x, y + 0.36, z + 0.05, 0.5, 0.38, 0.46), SD.ellipsoid(x, y - 0.08, z - 0.02, 0.34, 0.44, 0.32), 0.22);
    for(const s of [-1, 1]){
      d = smin(d, SD.capsule(x, y, z, s * 0.13, 0, 0.2, s * 0.14, -0.6, 0.28, 0.1), 0.05);
      d = smin(d, SD.ellipsoid(x - s * 0.14, y + 0.66, z - 0.33, 0.12, 0.08, 0.14), 0.04);
    }
    d = smin(d, SD.ellipsoid(x, y - 0.66, z - 0.08, 0.4, 0.34, 0.36), 0.08);
    let m = 0;
    for(const s of [-1, 1]){
      const ear = SD.roundCone2(x, y, (z - 0.05) / 0.45, s * 0.22, 0.88, 0, s * 0.32, 1.18, 0, 0.14, 0.035) * 0.45;
      if(ear < d + 0.04){
        const b = smin(d, ear, 0.04);
        if(rec && ear < d && z > 0.06 && SD.roundCone2(x, y, 0, s * 0.23, 0.9, 0, s * 0.31, 1.13, 0, 0.08, 0.02) < 0) m = 1;
        d = b;
      }
    }
    const tl = tubeDist(x, y, z, CAT.tail);
    if(tl < d + 0.05){ const b = smin(d, tl, 0.05); if(tl < d) m = 0; d = b; }
    for(const e of CAT.eyes){
      const ed = SD.sphere(x - e[0], y - e[1], z - e[2], 0.065);
      if(ed < d){ d = ed; m = 2; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* CAP: a blue baseball cap: a round crown of six panels with pressed
   seams, a button on top, and one curved visor out of the front (+z). */
OBJECTS.cap = {
  pose: { s: 1.178, t: [0.19, 0.009, 0], yaw: -0.95, pitch: 0.28 },
  materials: () => [
    C.clay({ albedo: hex('#3E7BE0') }),                                            // 0 crown, button
    C.clay({ albedo: hex('#2C5DB8') })                                             // 1 visor
  ],
  sdf(x, y, z, rec){
    let crown = SD.ellipsoid(x, y, z + 0.04, 0.6, 0.54, 0.64);
    crown = smax(crown, -y, 0.02);
    const a = Math.atan2(z + 0.04, x), sec = Math.PI / 3;
    const seam = len2(x, z + 0.04) * Math.abs(Math.sin(a - Math.round(a / sec) * sec));
    crown += 0.008 * (1 - smoothstep(0, 0.035, seam)) * smoothstep(0.02, 0.12, y);
    crown = smin(crown, SD.ellipsoid(x, y - 0.535, z + 0.04, 0.1, 0.06, 0.1), 0.02);
    const v2 = smax(ell2(x, z - 0.32, 0.5, 0.8), 0.3 - z, 0.03);
    const yv = 0.03 - 0.13 * (x / 0.5) * (x / 0.5) * smoothstep(0.3, 0.75, z) - 0.08 * Math.max(z - 0.45, 0);
    const visor = SD.extrude(v2, y - yv, 0.03, 0.026) * 0.8;
    if(rec) rec.m = visor < crown ? 1 : 0;
    return smin(crown, visor, 0.02);
  }
};

/* PAN: a frying pan seen from above: a shallow flared pan, red outside
   so its rim reads on the dark sky and dark inside like a real pan's
   cooking surface, and a long black handle out to the side (+x). */
const PAN_PROF = [0, 0, 0.58, 0, 0.74, 0.2];
OBJECTS.pan = {
  pose: { s: 0.867, t: [-0.245, -0.098, 0], yaw: -0.45, pitch: 0.5 },
  materials: () => [
    C.clay({ albedo: hex('#E0503F'), rim: 0.4 }),                                  // 0 outside, rim
    C.clay({ albedo: hex('#3C394A') }),                                            // 1 inside
    C.clay({ albedo: hex('#2B2638') })                                             // 2 handle
  ],
  sdf(x, y, z, rec){
    const q = len2(x, z);
    let d = line2(q, y, PAN_PROF) - 0.04, m = 0;
    if(rec && y > 0 && q < 0.56 + 0.8 * y) m = 1;
    const handle = SD.roundCone2(x, y / 0.7, z, 0.7, 0.16 / 0.7, 0, 1.4, 0.28 / 0.7, 0, 0.08, 0.105) * 0.7;
    if(handle < d + 0.04){ const b = smin(d, handle, 0.04); if(handle < d) m = 2; d = b; }
    if(rec) rec.m = m;
    return d;
  }
};

/* CUP: a plain cup, a little wider at the top, with a round handle; teal
   outside and cream inside, so its opening reads from above. */
const CUP_PROF = [0, -0.5, 0.44, -0.5, 0.56, 0.48];
OBJECTS.cup = {
  pose: { s: 1.277, t: [-0.169, -0.02, 0], yaw: 0.35, pitch: 0.32 },
  materials: () => [
    C.clay({ albedo: hex('#2FB5B0') }),                                            // 0 outside, handle
    C.clay({ albedo: hex('#F4EDE0') })                                             // 1 inside
  ],
  sdf(x, y, z, rec){
    const q = len2(x, z);
    let d = line2(q, y, CUP_PROF) - 0.06, m = 0;
    if(rec && y > -0.5 && q < 0.44 + 0.1224 * (y + 0.5)) m = 1;
    let h = SD.torus(x - 0.62, z, y, 0.25, 0.07);
    h = smax(h, 0.47 + 0.1224 * (y + 0.5) - x, 0.02);
    if(h < d + 0.04){ const b = smin(d, h, 0.04); if(h < d) m = 0; d = b; }
    if(rec) rec.m = m;
    return d;
  }
};

/* BUS: a yellow school bus seen three-quarters: a long body with a short
   hood in front, a row of windows, black trim, and four wheels. Forward
   is +x. */
const BUS_WHEELS = [[0.7, 0.36], [0.7, -0.36], [-0.7, 0.36], [-0.7, -0.36]];
OBJECTS.bus = {
  pose: { s: 0.804, t: [-0.052, -0.374, 0], yaw: -0.55, pitch: 0.05 },
  materials: () => [
    C.clay({ albedo: hex('#FFB524'), rim: 0.4 }),                                  // 0 body
    C.clay({ albedo: hex('#A6DDF7'), spec: 0.5, specPow: 40, sheen: 0.15 }),       // 1 windows
    C.clay({ albedo: hex('#2B2638') }),                                            // 2 tyres, trim, bumper
    C.clay({ albedo: hex('#CFC9DC') }),                                            // 3 hubs
    C.clay({ albedo: hex('#FFF4CC') })                                             // 4 lights
  ],
  sdf(x, y, z, rec){
    let d = SD.roundBox(x + 0.18, y - 0.58, z, 0.92, 0.42, 0.4, 0.13);
    d = smin(d, SD.roundBox(x - 0.9, y - 0.4, z, 0.28, 0.24, 0.36, 0.11), 0.06);
    for(const w of [0.7, -0.7]) d = smax(d, -(len2(x - w, y - 0.22) - 0.27), 0.04);
    let m = 0;
    const bump = SD.roundBox(x - 1.18, y - 0.22, z, 0.05, 0.07, 0.37, 0.04);
    if(bump < d){ d = bump; m = 2; }
    if(rec && m === 0){
      const az = Math.abs(z);
      if(az > 0.3 && x < 0.72 && y > 0.6 && y < 0.86){
        const u = (x + 1.02) / 0.32;
        if(u > 0 && u < 5 && (u % 1) < 0.8) m = 1;
      } else if(x > 0.66 && x < 0.9 && y > 0.6 && y < 0.88 && az < 0.33) m = 1;
      else if(az > 0.3 && ((y > 0.47 && y < 0.51) || (y > 0.3 && y < 0.34))) m = 2;
      else if(x > 1.12 && len2(Math.abs(z) - 0.24, y - 0.42) < 0.06) m = 4;
    }
    for(const w of BUS_WHEELS){
      const wd = SD.roundCylinder(x - w[0], z - w[1], y - 0.22, 0.22, 0.09, 0.05);
      if(wd < d){ d = wd; m = (len2(x - w[0], y - 0.22) < 0.1 && Math.abs(z) > 0.4) ? 3 : 2; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* BUG: a ladybug: a red domed shell with a seam and black spots, a dark
   head with two bead eyes (white, with dark pupils, so they read on the
   dark head), two short antennae and little legs. The head is +x in the
   bug's own frame, which is turned (BUG_TURN) inside the sdf so that the
   pose's pitch tips its back toward us rather than rolling it over. */
const BUG_TURN = Math.PI + 0.6;
const BUG_POSE = { s: 1.013, t: [0.145, 0.004, 0], pitch: 0.55 };
const BUG = (function(){
  const cam = turnY(towardCamera(BUG_POSE), BUG_TURN);
  const eyes = beadEyes([0.7, 0.02, 0], [0.3, 0.26, 0.34], [1, 0, 0], cam, 1.0, 0.42, 0.25, 0.03);
  const pupils = eyes.map(e => [e[0] + cam[0] * 0.045, e[1] + cam[1] * 0.045, e[2] + cam[2] * 0.045]);
  // seven spots: one on the seam behind the head, three down each side
  const spots = [[0.55, 0.83, 0], [0.3, 0.6, 0.74], [0.3, 0.6, -0.74], [-0.15, 0.85, 0.5], [-0.15, 0.85, -0.5],
                 [-0.7, 0.55, 0.45], [-0.7, 0.55, -0.45]].map(C.norm3);
  return { eyes, pupils, spots };
})();
OBJECTS.bug = {
  pose: BUG_POSE,
  materials: () => [
    C.clay({ albedo: hex('#E5352F'), rim: 0.4 }),                                  // 0 shell
    C.clay({ albedo: hex('#2B2638') }),                                            // 1 head, spots, legs, antennae
    C.clay({ albedo: hex('#F6F4FA'), spec: 0.4, specPow: 40 }),                    // 2 eye whites
    EYE()                                                                          // 3 pupils
  ],
  sdf(x0, y, z0, rec){
    const ct = Math.cos(BUG_TURN), st = Math.sin(BUG_TURN);
    const x = x0 * ct - z0 * st, z = x0 * st + z0 * ct;
    let d = smax(SD.ellipsoid(x + 0.05, y, z, 0.8, 0.56, 0.66), -(y + 0.04), 0.05), m = 0;
    if(rec){
      const ux = (x + 0.05) / 0.8, uy = y / 0.56, uz = z / 0.66, ul = len3(ux, uy, uz) || 1;
      if(Math.abs(z) < 0.018 && x < 0.55 && y > 0.1) m = 1;
      else for(const s of BUG.spots) if((ux * s[0] + uy * s[1] + uz * s[2]) / ul > 0.97){ m = 1; break; }
    }
    let dark = SD.ellipsoid(x - 0.7, y - 0.02, z, 0.3, 0.26, 0.34);
    for(const s of [-1, 1]){
      for(const lx of [0.3, -0.05, -0.4]) dark = Math.min(dark, SD.capsule(x, y, z, lx, -0.02, s * 0.42, lx + 0.05, -0.08, s * 0.64, 0.04));
      dark = Math.min(dark, SD.capsule(x, y, z, 0.84, 0.2, s * 0.12, 1.0, 0.42, s * 0.28, 0.022));
      dark = Math.min(dark, SD.sphere(x - 1.0, y - 0.42, z - s * 0.28, 0.045));
    }
    if(dark < d){ d = dark; m = 1; }
    for(let k = 0; k < 2; k++){
      const e = BUG.eyes[k], p = BUG.pupils[k];
      const ew = SD.sphere(x - e[0], y - e[1], z - e[2], 0.085);
      if(ew < d){ d = ew; m = 2; }
      const ep = SD.sphere(x - p[0], y - p[1], z - p[2], 0.048);
      if(ep < d){ d = ep; m = 3; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* NUT: an acorn-like nut, plump like a hazelnut: a glossy brown nut with a
   little point, a darker cap of criss-cross scales that overhangs it, and
   a short stem. */
OBJECTS.nut = {
  pose: { s: 1.259, t: [-0.041, 0.008, 0], yaw: 0.3, pitch: 0.18, roll: -0.18 },
  materials: () => [
    C.clay({ albedo: hex('#C4843F'), rim: 0.45 }),                                 // 0 nut
    C.clay({ albedo: hex('#8C6239'), rim: 0.5 }),                                  // 1 cap
    C.clay({ albedo: hex('#6A4527'), rim: 0.5 })                                   // 2 scale lines, stem, point
  ],
  sdf(x, y, z, rec){
    let nut = smin(SD.ellipsoid(x, y + 0.2, z, 0.5, 0.6, 0.5), SD.sphere(x, y + 0.82, z, 0.05), 0.12);
    let cap = smax(SD.ellipsoid(x, y - 0.16, z, 0.6, 0.36, 0.6), 0.1 - y, 0.03);
    const stem = SD.capsule(x, y, z, 0, 0.45, 0, 0.07, 0.76, 0.02, 0.055);
    let d = nut, m = y < -0.72 ? 2 : 0;
    if(cap < d){
      d = cap; m = 1;
      if(rec){
        const u = Math.atan2(z, x) / (2 * Math.PI) * 18, v = (y - 0.1) * 12;
        const f = Math.min(Math.abs(u + v - Math.round(u + v)), Math.abs(u - v - Math.round(u - v)));
        if(f < 0.1) m = 2;
      }
    }
    if(stem < d + 0.03){ const b = smin(d, stem, 0.03); if(stem < d) m = 2; d = b; }
    if(rec) rec.m = m;
    return d;
  }
};

/* PUMPKIN: an orange pumpkin, wider than tall, with ten deep rounded
   ribs, a dimple on top and a short, thick green stem. No face. */
OBJECTS.pumpkin = {
  pose: { s: 0.953, t: [0.01, -0.049, 0], yaw: 0.2, pitch: 0.28 },
  materials: () => [
    C.clay({ albedo: hex('#F57F22'), rim: 0.4 }),                                  // 0 pumpkin
    C.clay({ albedo: hex('#5E9A3A'), rim: 0.6 })                                   // 1 stem
  ],
  sdf(x, y, z, rec){
    const a = Math.atan2(z, x), c = 1 - Math.abs(Math.cos(5 * a));
    const k = 0.9 + 0.1 * (1 - c * c);
    let body = SD.ellipsoid(x / k, y, z / k, 1.0, 0.68, 1.0) * 0.7;
    body = smax(body, -(len3(x, y - 0.72, z) - 0.28), 0.2);
    body = smax(body, -(y + 0.62), 0.1);
    let stem = SD.roundCone2(x, y, z, 0, 0.45, 0, 0.08, 0.95, 0.04, 0.13, 0.09);
    if(rec) rec.m = stem < body ? 1 : 0;
    return smin(body, stem, 0.06);
  }
};

/* UMBRELLA: an open umbrella of eight coloured panels that sag a little
   between their ribs, with a scalloped edge, a tip on top, a thin shaft
   and a curved wooden handle. */
const UMB_COLS = [0, 1, 2, 3, 0, 1, 2, 3];
OBJECTS.umbrella = {
  pose: { s: 0.96, t: [0.01, 0.098, 0], yaw: 0.3, pitch: 0.18, roll: 0.22 },
  materials: () => [
    C.clay({ albedo: hex('#E8412E'), rim: 0.4 }),                                  // 0 red
    C.clay({ albedo: hex('#FFC634'), rim: 0.4 }),                                  // 1 yellow
    C.clay({ albedo: hex('#4F8FE0') }),                                            // 2 blue
    C.clay({ albedo: hex('#5CBB4A') }),                                            // 3 green
    C.clay({ albedo: hex('#8B5A3A'), rim: 0.5 }),                                  // 4 handle
    C.clay({ albedo: hex('#CFC9DC') })                                             // 5 shaft, tip
  ],
  sdf(x, y, z, rec){
    const N = 8, sec = 2 * Math.PI / N, a = Math.atan2(z, x);
    const p = Math.abs(a - Math.round(a / sec) * sec) / (sec / 2);
    const sag = 1 - 0.045 * (1 - Math.cos(Math.PI * p)) / 2;
    let can = Math.abs(SD.ellipsoid(x / sag, y + 0.05, z / sag, 1.0, 0.66, 1.0) * sag) - 0.025;
    can = smax(can, -0.05 + 0.14 * Math.sin(Math.PI * p / 2) - y, 0.015);
    let d = can * 0.9, m = 0;
    if(rec) m = UMB_COLS[((Math.floor(a / sec) % N) + N) % N];
    let shaft = SD.capsule(x, y, z, 0, 0.8, 0, 0, -0.95, 0, 0.03);
    shaft = Math.min(shaft, SD.sphere(x, y - 0.8, z, 0.05));
    if(shaft < d){ d = shaft; m = 5; }
    let hd = SD.capsule(x, y, z, 0, -0.72, 0, 0, -1.0, 0, 0.055);
    hd = Math.min(hd, smax(SD.torus(x - 0.18, z, y + 1.0, 0.18, 0.055), y + 1.0, 0.01));
    if(hd < d){ d = hd; m = 4; }
    if(rec) rec.m = m;
    return d;
  }
};

/* CUPCAKE: a pleated paper case, wider at the top, a piped swirl of
   frosting that winds up to a round top, and a red cherry with a stem:
   tall and narrow, where the cake is wide, pink and has a candle. */
const CUP_SWIRL = { T: 2.4, P: 0.25, Y0: 0.14 };
OBJECTS.cupcake = {
  pose: { s: 0.818, t: [-0.017, -0.15, 0], yaw: 0.25, pitch: 0.22 },
  materials: () => [
    C.clay({ albedo: hex('#7FC4F2') }),                                            // 0 paper case
    C.clay({ albedo: hex('#FFF3EA') }),                                            // 1 frosting
    C.clay({ albedo: hex('#E0263A'), rim: 0.4, spec: 0.25, specPow: 30 }),         // 2 cherry
    C.clay({ albedo: hex('#6E4A2E'), rim: 0.5 })                                   // 3 stem
  ],
  sdf(x, y, z, rec){
    const q = len2(x, z), a = Math.atan2(z, x);
    const u18 = a / (2 * Math.PI) * 18, tri = Math.abs(u18 - Math.floor(u18) - 0.5) * 2;
    const cs = (SD.poly2(q + 0.028 * (tri - 0.5), y, [0, -0.85, 0.46, -0.85, 0.62, 0.1, 0, 0.1]) - 0.02) * 0.8;
    const S = CUP_SWIRL, u = a / (2 * Math.PI) - Math.floor(a / (2 * Math.PI));
    let fr = SD.torus(x, y - S.Y0, z, 0.52, 0.19);
    for(let k = 0; k <= 3; k++){
      const tau = u + k;
      if(tau > S.T) break;
      // the piping tapers away inside the round top, so it has no cut end
      const R = 0.54 * (1 - tau / (S.T + 0.35)), r = (0.2 - 0.05 * tau / S.T) * (1 - smoothstep(S.T - 0.35, S.T, tau));
      fr = smin(fr, len2(q - R, y - S.Y0 - S.P * tau) - r, 0.04);
    }
    // a round top over the piping's end, for the cherry to sit on
    fr = smin(fr, SD.sphere(x, y - S.Y0 - S.P * S.T - 0.02, z, 0.24), 0.08) * 0.85;
    let d = cs, m = 0;
    if(fr < d + 0.03){ const b = smin(d, fr, 0.03); if(fr < d) m = 1; d = b; }
    const ch = SD.sphere(x, y - 1.06, z, 0.16);
    if(ch < d){ d = ch; m = 2; }
    const st = SD.capsule(x, y, z, 0, 1.18, 0, 0.08, 1.42, -0.03, 0.022);
    if(st < d){ d = st; m = 3; }
    if(rec) rec.m = m;
    return d;
  }
};

/* =========================================================
   THE SCENE — every object under picture.js's one camera
   ========================================================= */
function build(variant){
  const o = OBJECTS[variant];
  if(!o) throw new Error('picture-p3: unknown variant ' + variant);
  return PIC.buildObject(o);
}
function post(buf, W, H, CH, variant){
  if(variant === 'sun') C.addHalo(buf, W, H, CH, { radius: W * 0.045, strength: 0.3, color: hex('#FFCB5A') });
}
module.exports = { build: build, post: post };
