'use strict';
/* ROCKETGEAR — the rocket's add-ons, one per variant:
     star     a puffy warm-yellow clay star on the nose tip
     moon     a small lavender crescent moon on the nose tip
     antenna  a short leaning lavender-grey stalk with a coral ball, on the
              cap's left shoulder
     lights   two small round warm lamps, one on each front fin
     wings    a pair of pale bee wings on the upper body sides
     booster  two short cream canisters with a coral band and little
              lavender-grey nozzles, low on the body sides, just above the fins

   Each picture is ONLY the add-on, rendered through the rocket's own camera
   in the rocket's 640×800 frame, sitting where it belongs on the rocket, so
   the app lays it exactly over rocket.webp.

   The rocket itself is in every scene as an invisible occluder: its surface
   stops camera rays (what the rocket hides stays hidden), and it shadows and
   crowds the add-on as the real rocket would, but it wears a shadow-catcher
   material with no strength, so none of it reaches the picture. post() then
   adds the add-on's own soft shadow and contact darkening ON the rocket —
   cast by the add-on alone, because the rocket's own shading is already in
   rocket.webp — so a piece looks pressed on, not pasted.

   Gear is fixed-colour clay. It never takes the paint (the app multiplies
   paint only through the rocket's own mask), so the app draws it above the
   paint layer. The colours sit on a red, sky-blue, yellow or purple rocket. */
const C = require('../clay.js');
const R = require('./rocket.js');
const { len2, len3, smin, smax, hex, clamp, norm3, dot3, cross3 } = C;

const DEG = Math.PI / 180;

/* ---------- small vector helpers ---------- */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
function rocketNormal(p){
  const e = 0.0005;
  return norm3([R.sdf(p[0] + e, p[1], p[2], null) - R.sdf(p[0] - e, p[1], p[2], null),
                R.sdf(p[0], p[1] + e, p[2], null) - R.sdf(p[0], p[1] - e, p[2], null),
                R.sdf(p[0], p[1], p[2] + e, null) - R.sdf(p[0], p[1], p[2] - e, null)]);
}
/* Where a ray from p (outside the rocket) along dir first meets it. */
function onRocket(p, dir){
  const d0 = norm3(dir);
  let t = 0;
  for(let i = 0; i < 400; i++){
    const d = R.sdf(p[0] + d0[0] * t, p[1] + d0[1] * t, p[2] + d0[2] * t, null);
    if(d < 1e-5) break;
    t += d * 0.8;
  }
  return add(p, mul(d0, t));
}
/* A 2D ellipse: close to exact near its edge (as clay.js's ellipsoid). */
function ellipse2(x, y, a, b){
  const k0 = len2(x / a, y / b), k1 = len2(x / (a * a), y / (b * b));
  return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(a, b);
}

/* The nose tip: the top of the cap, which leans a hair to the right. */
const TIP = [R.NOSE_LEAN, R.NOSE_TIP, 0];

/* =========================================================
   THE PIECES — each returns its distance and sets rec.m
   (material 0 is the rocket, so pieces start at 1)

   No "far away, return a bound" shortcuts here: a field that jumps at a
   shortcut's edge turns into rings and crackle wherever a soft shadow
   crosses it. The pieces are cheap enough to evaluate everywhere.
   ========================================================= */

/* STAR: puffy, thicker in the middle, orange at the edges like the reward
   star; tilted a little, its bottom notch resting on the tip. */
const STAR_R = 0.098, STAR_RF = 0.52, STAR_ROUND = 0.018, STAR_TILT = 9 * DEG;
const STAR_C = [TIP[0] - 0.004, TIP[1] + 0.043, 0.0];
function starLocal(x, y, z){
  const dx = x - STAR_C[0], dy = y - STAR_C[1];
  const c = Math.cos(STAR_TILT), s = Math.sin(STAR_TILT);
  return [dx * c + dy * s, -dx * s + dy * c, z - STAR_C[2]];
}
function starFlat(lx, ly){ return C.SD.star2(lx, ly, STAR_R - STAR_ROUND, STAR_RF) - STAR_ROUND; }
function star(x, y, z, rec){
  const p = starLocal(x, y, z);
  const h = 0.02 + 0.022 * clamp(1 - len2(p[0], p[1]) / STAR_R, 0, 1);
  if(rec) rec.m = 1;
  return C.SD.extrude(starFlat(p[0], p[1]), p[2], h + 0.012, 0.018) * 0.85;
}

/* MOON: a puffy crescent, its round back resting on the tip, the horns
   curling up and to the right. */
const MOON_R = 0.088, MOON_CUT = 0.073, MOON_OFF = [0.046, 0.026], MOON_TILT = -24 * DEG;
const MOON_C = [TIP[0] + 0.018, TIP[1] + MOON_R - 0.016, 0.0];
function moonLocal(x, y, z){
  const dx = x - MOON_C[0], dy = y - MOON_C[1];
  const c = Math.cos(MOON_TILT), s = Math.sin(MOON_TILT);
  return [dx * c + dy * s, -dx * s + dy * c, z - MOON_C[2]];
}
function moon(x, y, z, rec){
  const p = moonLocal(x, y, z);
  // a disc, less a disc pushed toward the opening: rounded by smax
  const d2 = smax(len2(p[0], p[1]) - MOON_R, -(len2(p[0] - MOON_OFF[0], p[1] - MOON_OFF[1]) - MOON_CUT), 0.02);
  // puffy: thickest in the middle of the crescent's back
  const back = clamp(1 - len2(p[0] + 0.04, p[1] + 0.01) / 0.09, 0, 1);
  const h = 0.018 + 0.02 * back;
  if(rec) rec.m = 1;
  return C.SD.extrude(d2, p[2], h + 0.01, 0.016) * 0.85;
}

/* ANTENNA: plugged into the cap's left shoulder through a little collar,
   leaning out and up, with a big coral ball. */
const ANT_BASE = (function(){
  const a = -42 * DEG, y = 0.4;
  return onRocket([Math.sin(a) * 1.2, y, Math.cos(a) * 1.2], [-Math.sin(a), 0, -Math.cos(a)]);
})();
const ANT_N = rocketNormal(ANT_BASE);
const ANT_DIR = norm3([ANT_N[0] * 0.5 - 0.08, 0.86, ANT_N[2] * 0.3]);
const ANT_LEN = 0.25, ANT_BALL_R = 0.056, ANT_STALK_R = 0.017;
const ANT_TOP = add(ANT_BASE, mul(ANT_DIR, ANT_LEN));
const ANT_IN = sub(ANT_BASE, mul(ANT_N, 0.03));
function antenna(x, y, z, rec){
  // the stalk tapers a touch toward the ball
  const stalk = C.SD.roundCone2(x, y, z, ANT_IN[0], ANT_IN[1], ANT_IN[2], ANT_TOP[0], ANT_TOP[1], ANT_TOP[2], ANT_STALK_R * 1.15, ANT_STALK_R * 0.9);
  const collar = C.SD.ellipsoid(x - ANT_BASE[0], y - ANT_BASE[1], z - ANT_BASE[2], 0.036, 0.036, 0.036);
  let d = smin(stalk, collar, 0.02), m = 1;
  const ball = len3(x - ANT_TOP[0], y - ANT_TOP[1], z - ANT_TOP[2]) - ANT_BALL_R;
  if(ball < d + 0.012){ const b = smin(d, ball, 0.012); if(ball < d) m = 2; d = b; }
  if(rec) rec.m = m;
  return d;
}

/* LIGHTS: a warm glowing bead in a little lavender-grey bezel, on the face
   of each front fin that looks at the camera. */
const LAMPS = [0, 2].map(i => {
  const a = R.FIN_YAWS[i] * DEG;
  const u = 0.62, y = -0.36;
  const plane = [u * Math.sin(a), y, u * Math.cos(a)];
  // the face that looks toward the camera
  let n = [Math.cos(a), 0, -Math.sin(a)];
  if(n[2] < 0) n = mul(n, -1);
  const at = onRocket(add(plane, mul(n, 0.4)), mul(n, -1));
  return { at: at, n: n };
});
const LAMP_R = 0.054, BEZEL_R = 0.058, BEZEL_T = 0.014;
function lights(x, y, z, rec){
  let d = 1e9, m = 1;
  for(const L of LAMPS){
    const v = [x - L.at[0], y - L.at[1], z - L.at[2]];
    const along = dot3(v, L.n);
    const across = len3(v[0] - L.n[0] * along, v[1] - L.n[1] * along, v[2] - L.n[2] * along);
    const bezel = len2(across - BEZEL_R, along - 0.004) - BEZEL_T;
    if(bezel < d){ d = bezel; m = 1; }
    const bead = len3(v[0] - L.n[0] * -0.014, v[1] - L.n[1] * -0.014, v[2] - L.n[2] * -0.014) - LAMP_R;
    if(bead < d){ d = bead; m = 2; }
  }
  if(rec) rec.m = m;
  return d;
}

/* WINGS: a big and a small lobe on each side, pale and thin, set on the
   upper body a little behind its sides, reaching out and up; a soft vein
   pressed down the middle of each. */
const WING_LOBES = [];
for(const s of [-1, 1]){
  const az = s * 104 * DEG, y = 0.02;
  const root = onRocket([Math.sin(az) * 1.2, y, Math.cos(az) * 1.2], [-Math.sin(az), 0, -Math.cos(az)]);
  for(const L of [{ ang: 42, a: 0.2, b: 0.098, off: 0.8 }, { ang: 12, a: 0.135, b: 0.066, off: 0.75, drop: 0.07 }]){
    const A = norm3([s * Math.cos(L.ang * DEG), Math.sin(L.ang * DEG), -0.12]);
    const Nn = norm3(sub([0, 0.16, 1], mul(A, dot3([0, 0.16, 1], A))));
    const Bv = cross3(Nn, A);
    const c = add(add(root, mul(A, L.a * L.off)), [0, -(L.drop || 0), 0]);
    WING_LOBES.push({ c: c, A: A, B: Bv, N: Nn, a: L.a, b: L.b });
  }
}
const WING_T = 0.017;
function wings(x, y, z, rec){
  let d = 1e9;
  for(const L of WING_LOBES){
    const v = [x - L.c[0], y - L.c[1], z - L.c[2]];
    const la = dot3(v, L.A), lb = dot3(v, L.B), ln = dot3(v, L.N);
    const e = ellipse2(la, lb, L.a, L.b);
    // thin at the edge, a little fuller in the middle; a vein down the middle
    const h = WING_T * (0.8 + 0.45 * clamp(-e / L.b, 0, 1));
    let dl = C.SD.extrude(e, ln, h, h * 0.95) * 0.85;
    dl += 0.0035 * Math.exp(-(lb / 0.009) * (lb / 0.009)) * clamp(1 - Math.abs(la) / L.a, 0, 1);
    d = Math.min(d, dl);
  }
  if(rec) rec.m = 1;
  return d;
}

/* BOOSTER: a short upright canister on each side, sunk a little into the
   body, a raised coral band round its middle and a little flared nozzle. */
const BOOST_R = 0.085, BOOST_Y0 = -0.01, BOOST_Y1 = 0.05, BAND_Y = 0.02, BAND_H = 0.028;
const BOOST_BELL = [0.034, -0.1, 0.05, -0.148], BOOST_BELL_R = 0.012;
const BOOST_BELL_POLY = [BOOST_BELL[0], BOOST_BELL[1], BOOST_BELL[2], BOOST_BELL[3], -BOOST_BELL[2], BOOST_BELL[3], -BOOST_BELL[0], BOOST_BELL[1]];
const BOOSTERS = [-1, 1].map(s => {
  const az = s * 80 * DEG, ym = (BOOST_Y0 + BOOST_Y1) / 2;
  const r = R.bodyR(ym) + BOOST_R - 0.022;
  return [Math.sin(az) * r, 0, Math.cos(az) * r];
});
function booster(x, y, z, rec){
  let d = 1e9, m = 1;
  for(const B of BOOSTERS){
    const bx = x - B[0], bz = z - B[2];
    const q = len2(bx, bz);
    // the canister: a capsule, coral where the band wraps it
    const cyl = C.SD.capsule(bx, y, bz, 0, BOOST_Y0, 0, 0, BOOST_Y1, 0, BOOST_R);
    if(cyl < d){ d = cyl; m = Math.abs(y - BAND_Y) < BAND_H ? 2 : 1; }
    // the band: a coil of coral clay pressed round it
    const band = len2(q - BOOST_R - 0.004, y - BAND_Y) - 0.02;
    if(band < d + 0.01){ const b = smin(d, band, 0.01); if(band < d) m = 2; d = b; }
    // the nozzle: a little flared bell under it
    const nz = C.SD.poly2(q, y, BOOST_BELL_POLY) - BOOST_BELL_R;
    if(nz < d + 0.01){ const b = smin(d, nz, 0.01); if(nz < d) m = 3; d = b; }
  }
  if(rec) rec.m = m;
  return d;
}

/* =========================================================
   THE VARIANTS
   ========================================================= */
const GEAR = {
  star:    { d: star, mats: [C.clay({ albedo: hex('#FFC93A'), sss: 0.8, sheen: 0.14, rim: 0.35, emissive: [0.04, 0.028, 0.004] })],
             albedoAt(x, y, z){ const p = starLocal(x, y, z); return C.mix3(hex('#FFD54A'), hex('#FF9A2A'), C.smoothstep(-0.02, 0.004, starFlat(p[0], p[1]))); } },
  moon:    { d: moon, mats: [C.clay({ albedo: hex('#BBA8EE'), sheen: 0.1 })] },
  antenna: { d: antenna, mats: [C.clay({ albedo: hex('#9189B4') }),                                   // stalk and collar
                                C.clay({ albedo: hex('#FF8A76'), rim: 0.45, spec: 0.12 })] },        // the ball
  lights:  { d: lights, glow: true, keyShadow: false,
             mats: [C.clay({ albedo: hex('#8F87AE') }),                                              // bezel
                    C.clay({ albedo: hex('#FFD983'), spec: 0.6, specPow: 40, sheen: 0.2, grain: 0, stroke: 0, sss: 0.3,
                             emissive: [1.9, 1.1, 0.32] })] },                                      // the warm lamp
  wings:   { d: wings, mats: [C.clay({ albedo: hex('#EEF2F9'), sheen: 0.18, spec: 0.1, specPow: 24, grain: 0, stroke: 0 })] },
  booster: { d: booster, mats: [C.clay({ albedo: hex('#F2E4C8') }),                                  // canister: the rocket's cream
                                C.clay({ albedo: hex('#FF8A76'), rim: 0.45 }),                        // band: coral
                                C.clay({ albedo: hex('#655E84') })] }                                // nozzle: the engine's lavender-grey
};

function build(variant){
  const G = GEAR[variant];
  if(!G) throw new Error('rocketgear: no such variant ' + variant);
  const rk = R.build();
  const recG = { m: 0 };
  function gearD(x, y, z){ return G.d(x, y, z, null); }
  function map(x, y, z, rec){
    const dr = R.sdf(x, y, z, null);
    const dg = G.d(x, y, z, rec ? recG : null);
    if(dg < dr){ if(rec) rec.m = recG.m; return dg; }
    if(rec) rec.m = 0;
    return dr;
  }
  return {
    width: rk.width, height: rk.height, scale: 1, seed: 43, spp: 3, aoRange: rk.aoRange,
    camera: rk.camera, bounds: rk.bounds,
    materials: [
      // the rocket: stops rays and shadows the piece, but leaves nothing in the picture
      C.clay({ albedo: [0, 0, 0], catcher: true, strength: 1e-9 })
    ].concat(G.mats),
    map: map,
    // soft shadows read the field a little short (see rocket.js)
    shadowMap(x, y, z){ return map(x, y, z, null) * 0.85; },
    albedoAt: G.albedoAt ? function(x, y, z, m, mat){ return m === 1 ? G.albedoAt(x, y, z) : mat.albedo; } : null,
    gearD: gearD, glow: !!G.glow, keyShadow: G.keyShadow !== false
  };
}

/* =========================================================
   POST — the piece's own shadow on the rocket, then any glow
   ========================================================= */
const SHADOW = hex('#140F33'), SHADOW_STRENGTH = 0.7, SHADOW_REACH = 0.24;

/* Soft shadow toward the key light through the piece alone: the renderer's
   own penumbra estimate, on the piece's field. */
function pieceShadow(gearD, x, y, z, L, k){
  let res = 1, t = 0.012, ph = 1e9;
  for(let i = 0; i < 64; i++){
    const h = gearD(x + L[0] * t, y + L[1] * t, z + L[2] * t) * 0.85;
    if(h < 0.0002) return 0;
    const yy = h * h / (2 * ph);
    const dd = Math.sqrt(Math.max(h * h - yy * yy, 0));
    res = Math.min(res, k * dd / Math.max(0.0001, t - yy));
    ph = h;
    t += clamp(h, 0.006, 0.25);
    if(res < 0.002 || t > 4) break;
  }
  res = clamp(res, 0, 1);
  return res * res * (3 - 2 * res);
}

/* Where a camera ray meets the rocket (and not the piece first), darken it
   by what the piece alone does there: its shadow from the key light and its
   contact occlusion, weighted as the renderer's shadow catcher weights them
   (a lamp that glows keeps only the contact: it casts no dark shadow).
   Rays are cast exactly as the renderer casts them, sample for sample, so
   the shadow's edge follows the rocket's outline in rocket.webp. The key
   light is soft, so a small piece's penumbra would spread wide and faint:
   the darkening fades out by SHADOW_REACH from the piece, and only a box
   around the piece, grown past that reach, is traced. */
function castOnRocket(buf, W, H, CH, scene){
  const cam = scene.camera, gearD = scene.gearD, map = scene.map;
  const f = norm3([cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]]);
  const r = norm3(cross3(f, [0, 1, 0])), u = cross3(r, f);
  const th = Math.tan((cam.fov * Math.PI / 180) / 2), aspect = W / H;
  const bc = scene.bounds.center, br = scene.bounds.radius;
  const key = C.RIG.key, spp = scene.spp || 3, n2 = spp * spp;
  const aoRange = scene.aoRange;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(buf[(y * W + x) * CH + 3] > 0.002){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if(x1 < 0) return;
  // a model unit in pixels, at the rocket (the lens is long: nearly uniform)
  const unit = H / (2 * th * len3(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]));
  const grow = Math.ceil((SHADOW_REACH + 0.04) * unit);
  x0 = Math.max(1, x0 - grow); x1 = Math.min(W - 2, x1 + grow);
  y0 = Math.max(1, y0 - grow); y1 = Math.min(H - 2, y1 + grow);
  const ox = cam.pos[0], oy = cam.pos[1], oz = cam.pos[2];
  const e = 0.0006;
  for(let py = y0; py <= y1; py++) for(let px = x0; px <= x1; px++){
    let dark = 0;
    for(let s = 0; s < n2; s++){
      const sx = (s % spp + 0.5) / spp, sy = (Math.floor(s / spp) + 0.5) / spp;
      const jx = sx + (sy - 0.5) * 0.25, jy = sy - (sx - 0.5) * 0.25;
      const ndx = (2 * (px + jx) / W - 1) * th * aspect, ndy = (1 - 2 * (py + jy) / H) * th;
      let dx = f[0] + r[0] * ndx + u[0] * ndy, dy = f[1] + r[1] * ndx + u[1] * ndy, dz = f[2] + r[2] * ndx + u[2] * ndy;
      const dl = len3(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      // the bounds, then march, as the renderer does
      const lx = ox - bc[0], ly = oy - bc[1], lz = oz - bc[2];
      const b = lx * dx + ly * dy + lz * dz, c = lx * lx + ly * ly + lz * lz - br * br, disc = b * b - c;
      if(disc < 0) continue;
      const sq = Math.sqrt(disc);
      let t = Math.max(-b - sq, 0), hit = -1;
      const t1 = -b + sq;
      for(let i = 0; i < 220; i++){
        const d = map(ox + dx * t, oy + dy * t, oz + dz * t, null);
        if(d < 0.00035 * (1 + t * 0.15)){ hit = t; break; }
        t += d * 0.85;
        if(t > t1) break;
      }
      if(hit < 0) continue;
      const hx = ox + dx * hit, hy = oy + dy * hit, hz = oz + dz * hit;
      const gd = gearD(hx, hy, hz);
      if(gd <= R.sdf(hx, hy, hz, null)) continue;                        // the piece itself: already drawn
      const near = C.smoothstep(SHADOW_REACH, 0.05, gd);
      if(near <= 0) continue;
      const a1 = map(hx + e, hy - e, hz - e, null), a2 = map(hx - e, hy - e, hz + e, null);
      const a3 = map(hx - e, hy + e, hz - e, null), a4 = map(hx + e, hy + e, hz + e, null);
      const nn = norm3([a1 - a2 - a3 + a4, -a1 - a2 + a3 + a4, -a1 + a2 - a3 + a4]);
      const sh = scene.keyShadow ? pieceShadow(gearD, hx + nn[0] * 0.002, hy + nn[1] * 0.002, hz + nn[2] * 0.002, key.dir, key.softness) : 1;
      let occ = 0, w = 1;
      for(let i = 1; i <= 5; i++){
        const h = 0.004 + aoRange * (i / 5) * (i / 5);
        occ += Math.max(0, h - gearD(hx + nn[0] * h, hy + nn[1] * h, hz + nn[2] * h)) * w;
        w *= 0.75;
      }
      const ao = clamp(1 - 3.5 * occ / aoRange * 0.1, 0, 1);
      dark += clamp((1 - sh) * 0.6 + (1 - ao) * 0.55, 0, 1) * near;
    }
    const a = dark / n2 * SHADOW_STRENGTH;
    if(a <= 0) continue;
    const o = (py * W + px) * CH;
    buf[o] += SHADOW[0] * a; buf[o + 1] += SHADOW[1] * a; buf[o + 2] += SHADOW[2] * a; buf[o + 3] += a;
  }
}

function post(buf, W, H, CH, variant){
  const scene = build(variant);
  castOnRocket(buf, W, H, CH, scene);
  if(scene.glow){ C.addGlow(buf, W, H, CH, W * 0.02, 0.45); C.addGlow(buf, W, H, CH, W * 0.06, 0.28); }
}

module.exports = { build: build, post: post };
