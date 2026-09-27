'use strict';
/* PICTURE — the Phase 2 game pictures: eleven small clay objects a child
   names, matches or sorts. One camera for the whole set, so they read as
   one family: a gentle 3/4 view from slightly above, each object turned to
   show its most telling side, and sized to fill about 80% of the frame.

   Each object is sculpted in its own frame at a natural size, then posed
   (yaw, pitch, roll), scaled and nudged to the centre of the picture.
   Only the snake and the bee have faces: two dark bead eyes each. */
const C = require('../clay.js');
const { SD, len2, len3, smin, smax, hex, clamp, smoothstep } = C;

const W = 384, H = 384, D = 10, ELEV = 0.3, FRAME = 2.4;

/* ---------- small helpers ---------- */
/* A lens (two circle arcs), pointed along y: half-width r - d, half-length sqrt(r² - d²). */
function vesica2(x, y, r, d){
  x = Math.abs(x); y = Math.abs(y);
  const b = Math.sqrt(r * r - d * d);
  return ((y - b) * d > x * b) ? len2(x, y - b) : len2(x + d, y) - r;
}
/* world = T + Ry(yaw) Rx(pitch) Rz(roll) (local * s); returns local. */
function makePose(o){
  const cy = Math.cos(o.yaw || 0), sy = Math.sin(o.yaw || 0);
  const cp = Math.cos(o.pitch || 0), sp = Math.sin(o.pitch || 0);
  const cr = Math.cos(o.roll || 0), sr = Math.sin(o.roll || 0);
  const t = o.t || [0, 0, 0], inv = 1 / (o.s || 1);
  const out = [0, 0, 0];
  return function(x, y, z){
    x -= t[0]; y -= t[1]; z -= t[2];
    const x1 = x * cy - z * sy, z1 = x * sy + z * cy;          // undo yaw
    const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;        // undo pitch
    const x3 = x1 * cr + y2 * sr, y3 = -x1 * sr + y2 * cr;      // undo roll
    out[0] = x3 * inv; out[1] = y3 * inv; out[2] = z2 * inv;
    return out;
  };
}
/* a basis from a forward direction and an up hint, for parts that point somewhere */
function basis(f, up){
  f = C.norm3(f);
  const s = C.norm3(C.cross3(f, up));
  const u = C.cross3(s, f);
  return { f, s, u };
}

/* =========================================================
   THE OBJECTS — each: pose, materials, sdf(x, y, z, rec)
   ========================================================= */
const OBJECTS = {};

/* SPOON: an oval bowl on a long handle that widens toward its end and
   rises gently from the bowl, as a real spoon's does. The bowl is a cut
   hollow sphere (an exact distance), squashed to an oval: a subtracted
   ellipsoid gave the soft shadows streaks inside the bowl. */
function cutHollowSphere(x, y, z, r, h, t){
  // a sphere of radius r cut at height h, the part below kept: opening up +y
  const w = Math.sqrt(r * r - h * h);
  const qx = len2(x, z), qy = y;
  return ((h * qx < w * qy) ? len2(qx - w, qy - h) : Math.abs(len2(qx, qy) - r)) - t;
}
OBJECTS.spoon = {
  pose: { s: 0.943, t: [0.053, 0.136, 0], yaw: 0.3, pitch: -0.55, roll: -0.72 },
  materials: () => [C.clay({ albedo: hex('#C9C3DE') })],
  sdf(x, y, z, rec){
    const bowl = cutHollowSphere(x / 0.72, z - 0.48, y - 0.5, 0.62, -0.38, 0.05) * 0.72;
    const zc = 0.08 + 0.08 * smoothstep(0, -1.25, y);
    const handle = SD.roundCone2(x, y, (z - zc) / 0.5, 0, 0.06, 0, 0, -1.25, 0, 0.065, 0.14) * 0.5;
    if(rec) rec.m = 0;
    return smin(bowl, handle, 0.07);
  }
};

/* CAR: a red toy car, a chunky body and a round cabin, light-blue windows,
   four dark wheels with pale hubs. Forward is +x. */
const WHEELS = [[0.56, 0.46], [0.56, -0.46], [-0.56, 0.46], [-0.56, -0.46]];
OBJECTS.car = {
  pose: { s: 0.915, t: [-0.006, -0.341, 0], yaw: -0.55, pitch: 0.05 },
  materials: () => [
    C.clay({ albedo: hex('#E8412E'), rim: 0.4 }),                                  // 0 body
    C.clay({ albedo: hex('#A6DDF7'), spec: 0.5, specPow: 40, sheen: 0.15 }),       // 1 windows
    C.clay({ albedo: hex('#2B2638') }),                                            // 2 tyres
    C.clay({ albedo: hex('#CFC9DC') })                                             // 3 hubs
  ],
  sdf(x, y, z, rec){
    let d = SD.roundBox(x, y - 0.36, z, 0.98, 0.25, 0.52, 0.2);
    for(const w of [0.56, -0.56]) d = smax(d, -(len2(x - w, y - 0.2) - 0.31), 0.05);
    const cx = x + 0.08;
    const cab = SD.roundBox(cx, y - 0.74, z, 0.5, 0.22, 0.44, 0.19);
    d = smin(d, cab, 0.08);
    let m = 0;
    if(rec && y > 0.6 && y < 0.9){
      const corner = Math.abs(cx) > 0.36 && Math.abs(z) > 0.3;
      const bpillar = Math.abs(cx) < 0.045 && Math.abs(z) > 0.3;
      if(!corner && !bpillar) m = 1;
    }
    for(const w of WHEELS){
      const wd = SD.roundCylinder(x - w[0], z - w[1], y - 0.2, 0.25, 0.1, 0.06);
      if(wd < d){ d = wd; m = (len2(x - w[0], y - 0.2) < 0.11 && Math.abs(z) > 0.5) ? 3 : 2; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* CAKE: two cream layers with pink filling, pink frosting dripping over the
   top edge, one candle with a small warm flame. */
OBJECTS.cake = {
  pose: { s: 0.929, t: [-0.023, -0.634, 0], yaw: 0.3, pitch: 0.1 },
  materials: () => [
    C.clay({ albedo: hex('#F6E3C0') }),                                            // 0 sponge
    C.clay({ albedo: hex('#FF8FB8'), rim: 0.6 }),                                  // 1 frosting
    C.clay({ albedo: hex('#7FC9F4') }),                                            // 2 candle
    C.clay({ albedo: hex('#FFE7A0'), spec: 0.2, grain: 0, stroke: 0, rim: 0.2,
             emissive: [3.2, 2.0, 0.7] })                                          // 3 flame
  ],
  sdf(x, y, z, rec){
    const q = len2(x, z);
    let d = SD.roundCylinder(x, y - 0.5, z, 0.9, 0.5, 0.1), m = 0;
    // the pink filling between the layers: a band squeezed out a little
    const ring = SD.roundCylinder(x, y - 0.42, z, 0.925, 0.075, 0.05);
    if(ring < d){ d = ring; m = 1; }
    const a = Math.atan2(z, x);
    const drip = Math.pow(0.5 + 0.5 * Math.cos(7 * a + 0.5), 4);
    let fr = SD.roundCylinder(x, y - 0.55, z, 0.94, 0.52, 0.15);
    fr = smax(fr, (0.82 - 0.22 * drip) - y, 0.04);
    if(fr < d){ d = fr; m = 1; }
    const cd = SD.roundCylinder(x, y - 1.25, z, 0.09, 0.21, 0.035);
    if(cd < d){ d = cd; m = 2; }
    const fl = SD.roundCone2(x, y, z, 0, 1.55, 0, 0, 1.74, 0, 0.075, 0.018);
    if(fl < d){ d = fl; m = 3; }
    if(rec) rec.m = m;
    return d;
  }
};

/* BEE: a round yellow body with dark stripes and a little stinger, two
   pale wings, two bead eyes and two short antennae. The head is +x. */
const WING_A = 0.55, WING_B = 0.3;
/* The bee is seen side-on so its stripes show, so its face is turned toward
   the camera: both eyes sit around a direction between the head and us. */
const BEE = (function(){
  const c = C.norm3([0.8, 0.28, -0.5]);
  const h = C.norm3([-c[2], 0, c[0]]);
  const fl = Math.hypot(c[0], c[2]), f = [c[0] / fl, 0, c[2] / fl];
  const eyes = [], ants = [];
  for(const k of [-1, 1]){
    const d = C.norm3([c[0] + k * 0.3 * h[0], c[1], c[2] + k * 0.3 * h[2]]);
    const l = len3(d[0] / 0.92, d[1] / 0.74, d[2] / 0.74);
    eyes.push([d[0] / l - d[0] * 0.03, d[1] / l - d[1] * 0.03, d[2] / l - d[2] * 0.03]);
    ants.push([[f[0] * 0.5 + k * 0.15 * h[0], 0.52, f[2] * 0.5 + k * 0.15 * h[2]],
               [f[0] * 0.72 + k * 0.27 * h[0], 0.96, f[2] * 0.72 + k * 0.27 * h[2]]]);
  }
  return { eyes, ants };
})();
OBJECTS.bee = {
  pose: { s: 1.014, t: [0.014, -0.199, 0], yaw: Math.PI + 0.65, pitch: 0.1 },
  materials: () => [
    C.clay({ albedo: hex('#FFC634'), rim: 0.4 }),                                  // 0 body
    C.clay({ albedo: hex('#2E2742') }),                                            // 1 stripes, stinger, antennae
    C.clay({ albedo: hex('#EEF5FF'), spec: 0.3, sheen: 0.2 }),                     // 2 wings
    C.clay({ albedo: hex('#1B1F3B'), spec: 1.4, specPow: 60, sheen: 0.05 })        // 3 eyes
  ],
  sdf(x, y, z, rec){
    let d = SD.ellipsoid(x, y, z, 0.92, 0.74, 0.74);
    const stripe = (x > -0.2 && x < 0.04) || (x > -0.62 && x < -0.4);
    let m = stripe ? 1 : 0;
    const st = SD.roundCone2(x, y, z, -0.84, 0, 0, -1.08, 0.02, 0, 0.12, 0.025);
    if(st < d + 0.03){ const b = smin(d, st, 0.03); if(st < d) m = 1; d = b; }
    for(const s of [-1, 1]){
      // wings: flat ovals standing up from the back, leaning out and back
      const px = x + 0.12, py = y - 0.5, pz = z - s * 0.16;
      const cb = Math.cos(WING_B), sb = Math.sin(WING_B);
      const x1 = px * cb + py * sb, y1 = -px * sb + py * cb;
      const ca = Math.cos(s * WING_A), sa = Math.sin(s * WING_A);
      const y2 = y1 * ca + pz * sa, z2 = -y1 * sa + pz * ca;
      const wd = SD.ellipsoid(x1, y2 - 0.32, z2, 0.26, 0.36, 0.05);
      if(wd < d){ d = wd; m = 2; }
    }
    for(let k = 0; k < 2; k++){
      const e = BEE.eyes[k], a = BEE.ants[k];
      const eye = SD.sphere(x - e[0], y - e[1], z - e[2], 0.1);
      if(eye < d){ d = eye; m = 3; }
      const an = SD.capsule(x, y, z, a[0][0], a[0][1], a[0][2], a[1][0], a[1][1], a[1][2], 0.035);
      const ab = SD.sphere(x - a[1][0], y - a[1][1] - 0.03, z - a[1][2], 0.075);
      const ad = Math.min(an, ab);
      if(ad < d){ d = ad; m = 1; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* TREE: a brown trunk and a big round canopy of three soft blobs. */
OBJECTS.tree = {
  pose: { s: 0.917, t: [-0.017, 0.108, 0], yaw: 0.2 },
  materials: () => [
    C.clay({ albedo: hex('#5CBB4A') }),                                            // 0 canopy
    C.clay({ albedo: hex('#8B5A3A'), rim: 0.5 })                                   // 1 trunk
  ],
  sdf(x, y, z, rec){
    let trunk = SD.roundCone(x, y + 0.98, z, 0.18, 0.13, 0.8);
    trunk = smin(trunk, SD.roundCone(x, y + 1.0, z, 0.21, 0.15, 0.16), 0.06);
    let can = smin(SD.sphere(x, y - 0.32, z, 0.6), SD.sphere(x + 0.5, y + 0.06, z - 0.1, 0.46), 0.15);
    can = smin(can, SD.sphere(x - 0.52, y + 0.02, z + 0.06, 0.5), 0.15);
    if(rec) rec.m = can < trunk ? 0 : 1;
    return smin(can, trunk, 0.04);
  }
};

/* SNAKE: a green snake in an S on the ground, tail tapering to a point,
   head raised a little, with two bead eyes and darker bands. The body is
   a chain of round cones along a path on the ground. */
function makeSnake(path){
  const N = 24, pts = [], rad = [];
  for(let i = 0; i <= N; i++){
    const t = i / N, p = path(t);
    const r = 0.03 + 0.21 * smoothstep(0, 0.34, t) - 0.03 * smoothstep(0.85, 1, t);
    pts.push([p[0], r + 0.3 * smoothstep(0.78, 1, t), p[1]]); rad.push(r);
  }
  const a = pts[N - 1], b = pts[N];
  const hb = basis([b[0] - a[0], 0, b[2] - a[2]], [0, 1, 0]);
  const hc = [b[0] + hb.f[0] * 0.16, b[1] + 0.04, b[2] + hb.f[2] * 0.16];
  return { N, pts, rad, hb, hc };
}
/* an S laid along a diagonal: the tail at the front left, the head at the back right */
const SN = makeSnake(t => { const g = -1 + 2 * t, o = 0.3 * Math.sin(2 * Math.PI * t); return [0.82 * g + 0.51 * o, -0.5 * g + 0.84 * o]; });
OBJECTS.snake = {
  pose: { s: 0.855, t: [-0.212, -0.164, 0], yaw: 0.05, pitch: 0.8 },
  materials: () => [
    C.clay({ albedo: hex('#74C653') }),                                            // 0 body
    C.clay({ albedo: hex('#3F9A3D') }),                                            // 1 bands
    C.clay({ albedo: hex('#1B1F3B'), spec: 1.4, specPow: 60, sheen: 0.05 })        // 2 eyes
  ],
  sdf(x, y, z, rec){
    let d = 1e9, bi = 0;
    for(let i = 0; i < SN.N; i++){
      const a = SN.pts[i], b = SN.pts[i + 1];
      const s = SD.roundCone2(x, y, z, a[0], a[1], a[2], b[0], b[1], b[2], SN.rad[i], SN.rad[i + 1]);
      if(s < d){ d = s; bi = i; }
    }
    const hx = x - SN.hc[0], hy = y - SN.hc[1], hz = z - SN.hc[2];
    const f = SN.hb.f, s = SN.hb.s, u = SN.hb.u;
    const lf = hx * f[0] + hy * f[1] + hz * f[2], ls = hx * s[0] + hy * s[1] + hz * s[2], lu = hx * u[0] + hy * u[1] + hz * u[2];
    const head = SD.ellipsoid(lf, lu, ls, 0.36, 0.22, 0.28);
    let m = 0;
    if(rec){
      // bands by a continuous position along the body, so bends stay clean
      const a = SN.pts[bi], b = SN.pts[bi + 1];
      const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
      const h = clamp(((x - a[0]) * bx + (y - a[1]) * by + (z - a[2]) * bz) / (bx * bx + by * by + bz * bz), 0, 1);
      const t = (bi + h) / SN.N;
      if(t > 0.14 && t < 0.84 && ((t * 6.5) % 1) < 0.34) m = 1;
    }
    if(head < d + 0.07){ const b = smin(d, head, 0.07); if(head < d) m = 0; d = b; }
    for(const k of [-1, 1]){
      const e = SD.sphere(lf - 0.07, lu - 0.14, ls - k * 0.15, 0.08);
      if(e < d){ d = e; m = 2; }
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* ROCK: a grey stone: a chunky lump cut by a few broad facets whose edges
   are softened, with a gentle lumpiness. Flat underneath. */
const rockNoise = C.makeNoise(7);
const FACETS = [
  [0.05, 1, 0.12, 0.62], [-0.62, 0.62, 0.48, 0.8], [0.68, 0.6, 0.42, 0.82], [0.12, 0.32, 1, 0.72],
  [-1, 0.12, 0.25, 0.92], [1, 0.05, -0.12, 0.96], [0.3, 0.5, -0.9, 0.72], [-0.5, 0.35, -0.8, 0.78]
].map(f => { const n = C.norm3([f[0], f[1], f[2]]); return [n[0], n[1], n[2], f[3]]; });
OBJECTS.rock = {
  pose: { s: 0.95, t: [0.012, -0.021, 0], yaw: 0.3 },
  materials: () => [C.clay({ albedo: hex('#96929B') })],
  sdf(x, y, z, rec){
    let d = SD.ellipsoid(x, y, z, 1.02, 0.82, 0.86);
    for(const f of FACETS) d = smax(d, x * f[0] + y * f[1] + z * f[2] - f[3], 0.14);
    d = smax(d, -y - 0.52, 0.12);
    d += 0.025 * rockNoise(x * 1.6, y * 1.6, z * 1.6);
    if(rec) rec.m = 0;
    return d * 0.9;
  }
};

/* SOCK: one blue sock, toe to the right, with a pressed cuff, two stripes,
   and a coral heel and toe. */
OBJECTS.sock = {
  pose: { s: 0.966, t: [-0.121, -0.101, 0], yaw: -0.4, pitch: 0.08 },
  materials: () => [
    C.clay({ albedo: hex('#4FA3E8') }),                                            // 0 sock
    C.clay({ albedo: hex('#FF7F5C'), rim: 0.45 }),                                 // 1 stripes, heel, toe
    C.clay({ albedo: hex('#2F6FB0') })                                             // 2 inside
  ],
  sdf(x, y, z, rec){
    const zz = z / 0.75;
    const leg = SD.capsule(x, y, zz, -0.25, 1.0, 0, -0.25, -0.3, 0, 0.36);
    const foot = SD.capsule(x, y, zz, -0.25, -0.4, 0, 0.62, -0.52, 0, 0.33);
    let d = smin(leg, foot, 0.2) * 0.75;
    d = smax(d, y - 1.0, 0.06);
    d -= 0.03 * smoothstep(0.7, 0.76, y);
    const open = SD.roundCylinder(x + 0.25, y - 1.1, z / 0.75, 0.25, 0.2, 0.08) * 0.75;
    d = smax(d, -open, 0.04);
    let m = 0;
    if(rec){
      if(open < 0.03 && y > 0.85) m = 2;
      else if((y > 0.47 && y < 0.6) || (y > 0.22 && y < 0.35)) m = 1;
      else if(len2(x + 0.58, y + 0.6) < 0.36 || x > 0.66) m = 1;
    }
    if(rec) rec.m = m;
    return d;
  }
};

/* BANANA: a yellow crescent, thick in the middle, with a short stalk at one
   end and a small brown tip at the other. The body is a chain of round
   cones along an arc: exact distances, so the tips shade cleanly. */
const BA = (function(){
  const cy = 0.9, R = 1.15, a0 = 203 * Math.PI / 180, a1 = 337 * Math.PI / 180, N = 30;
  const pts = [], rad = [];
  for(let i = 0; i <= N; i++){
    const u = i / N, a = a0 + (a1 - a0) * u;
    pts.push([R * Math.cos(a), cy + R * Math.sin(a)]);
    rad.push(0.04 + 0.25 * Math.pow(Math.sin(Math.PI * u), 0.6));
  }
  const t1 = [-Math.sin(a1), Math.cos(a1)], e1 = pts[N];
  return { N, pts, rad, e0: pts[0],
           s0: [e1[0] - t1[0] * 0.05, e1[1] - t1[1] * 0.05], s1: [e1[0] + t1[0] * 0.2, e1[1] + t1[1] * 0.2] };
})();
OBJECTS.banana = {
  pose: { s: 0.965, t: [0.139, -0.24, 0], yaw: -0.2, pitch: 0.3, roll: 0.55 },
  materials: () => [
    C.clay({ albedo: hex('#FFD23F'), rim: 0.4 }),                                  // 0 skin
    C.clay({ albedo: hex('#6B4630'), rim: 0.5 })                                   // 1 tips
  ],
  sdf(x, y, z, rec){
    let d = 1e9;
    for(let i = 0; i < BA.N; i++){
      const a = BA.pts[i], b = BA.pts[i + 1];
      d = Math.min(d, SD.roundCone2(x, y, z, a[0], a[1], 0, b[0], b[1], 0, BA.rad[i], BA.rad[i + 1]));
    }
    let m = 0;
    const stalk = SD.capsule(x, y, z, BA.s0[0], BA.s0[1], 0, BA.s1[0], BA.s1[1], 0, 0.055);
    if(stalk < d + 0.03){ const b = smin(d, stalk, 0.03); if(stalk < d) m = 1; d = b; }
    const tip = SD.sphere(x - BA.e0[0], y - BA.e0[1], z, 0.05);
    if(tip < d + 0.02){ const b = smin(d, tip, 0.02); if(tip < d) m = 1; d = b; }
    if(rec) rec.m = m;
    return d;
  }
};

/* APPLE: round with wide shoulders, a dimple at the top, a brown stem and
   one green leaf. */
const LEAF = basis([0.85, 0.35, 0.3], [0, 1, 0.3]);
OBJECTS.apple = {
  pose: { s: 1.018, t: [0, -0.133, 0], yaw: 0.2, pitch: 0.2 },
  materials: () => [
    C.clay({ albedo: hex('#E23B36'), rim: 0.4 }),                                  // 0 apple
    C.clay({ albedo: hex('#6E4A2E'), rim: 0.5 }),                                  // 1 stem
    C.clay({ albedo: hex('#5CBB4A') })                                             // 2 leaf
  ],
  sdf(x, y, z, rec){
    const q = len2(x, z);
    let d = len2(q, y) - (0.86 + 0.07 * clamp(y / 0.86, -1, 1));
    d = smax(d, -(len3(x, y - 0.98, z) - 0.3), 0.2);
    d = smax(d, -(len3(x, y + 1.02, z) - 0.18), 0.12);
    let m = 0;
    const stem = SD.capsule(x, y, z, 0, 0.6, 0, 0.07, 1.08, 0, 0.055);
    if(stem < d){ d = stem; m = 1; }
    const lx = x - 0.06, ly = y - 0.92, lz = z;
    const lf = lx * LEAF.f[0] + ly * LEAF.f[1] + lz * LEAF.f[2];
    const ls = lx * LEAF.s[0] + ly * LEAF.s[1] + lz * LEAF.s[2];
    const lu = lx * LEAF.u[0] + ly * LEAF.u[1] + lz * LEAF.u[2];
    const leaf = SD.extrude(vesica2(ls, lf - 0.3, 0.42, 0.28), lu, 0.035, 0.03);
    if(leaf < d){ d = leaf; m = 2; }
    if(rec) rec.m = m;
    return d;
  }
};

/* TOMATO: a slightly squashed red ball with soft lobes, a green five-point
   leaf cap lying on its top, and a short stem. */
OBJECTS.tomato = {
  pose: { s: 0.942, t: [0, -0.006, 0], yaw: 0.25, pitch: 0.35 },
  materials: () => [
    C.clay({ albedo: hex('#F0513A'), rim: 0.4 }),                                  // 0 tomato
    C.clay({ albedo: hex('#4FAE45') })                                             // 1 cap, stem
  ],
  sdf(x, y, z, rec){
    const a = Math.atan2(z, x);
    const lobe = 1 + 0.035 * Math.cos(5 * a) * smoothstep(-0.2, 0.6, y);
    let body = SD.ellipsoid(x / lobe, y, z / lobe, 1.0, 0.74, 1.0) * 0.95;
    body = smax(body, -(len3(x, y - 0.8, z) - 0.24), 0.16);
    const shell = Math.abs(body - 0.03) - 0.035;
    let cap = smax(shell, SD.star2(x, -z, 0.62, 0.42) - 0.04, 0.03);
    cap = smax(cap, 0.3 - y, 0.05);
    const stem = SD.capsule(x, y, z, 0, 0.6, 0, 0.03, 0.9, 0.02, 0.07);
    cap = smin(cap, stem, 0.04);
    if(rec) rec.m = cap < body ? 1 : 0;
    return Math.min(body, cap);
  }
};

/* =========================================================
   THE SCENE
   ========================================================= */
function build(variant){
  const o = OBJECTS[variant];
  if(!o) throw new Error('picture: unknown variant ' + variant);
  const pose = makePose(o.pose);
  const s = o.pose.s || 1;
  return {
    width: W, height: H, scale: 1, seed: 83, spp: 3, aoRange: 0.07,
    camera: { pos: [0, D * Math.sin(ELEV), D * Math.cos(ELEV)], target: [0, 0, 0],
              fov: 2 * Math.atan((FRAME / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.9 },
    materials: o.materials(),
    // distances are scaled a little under 1: where a surface faces the key
    // light head-on, a distance growing as fast as the shadow ray would be
    // read by the soft shadow as a hit, a false black speck
    map(x, y, z, rec){
      const p = pose(x, y, z);
      return o.sdf(p[0], p[1], p[2], rec) * s * 0.95;
    }
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'cake') C.addGlow(buf, W, H, CH, W * 0.02, 0.35);
}
module.exports = { build: build, post: post };
