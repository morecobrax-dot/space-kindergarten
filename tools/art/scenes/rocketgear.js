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
     ring     a chunky gold planet ring with a cream band, round the cap just
              above its lip, tilted like Saturn's and floating clear of it
     flags    party bunting: a cream cord in a shallow swag round the front of
              the cap, five little yellow, teal, pink, lavender and orange
              pennants hanging from it
     dish     a small cream satellite dish with a coral feed horn, on a short
              lavender-grey arm from the body's right side, facing out and up

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

/* RING: a chunky golden planet ring round the cap, tilted toward the
   camera (in front low, behind high) and rising a little to the right,
   floating clear of the rocket all round. A cream band runs round its
   middle between two pressed grooves. */
const RING_C = [0, 0.415, -0.035], RING_TILT = 13 * DEG, RING_ROLL = 12 * DEG;
const RING_R = 0.635, RING_W = 0.115, RING_T = 0.046, RING_BAND = [0.615, 0.695];
const RING_N = [-Math.cos(RING_TILT) * Math.sin(RING_ROLL), Math.cos(RING_TILT) * Math.cos(RING_ROLL), Math.sin(RING_TILT)];
function ring(x, y, z, rec){
  const dx = x - RING_C[0], dy = y - RING_C[1], dz = z - RING_C[2];
  const h = dx * RING_N[0] + dy * RING_N[1] + dz * RING_N[2];
  const rho = len3(dx - RING_N[0] * h, dy - RING_N[1] * h, dz - RING_N[2] * h);
  // puffy: a little fuller across the middle of the band
  const across = (rho - RING_R) / RING_W;
  const t = RING_T * (0.85 + 0.25 * clamp(1 - across * across, 0, 1));
  let d = C.SD.extrude(Math.abs(rho - RING_R) - RING_W, h, t, t * 0.95) * 0.9;
  for(const b of RING_BAND){ const g = (rho - b) / 0.008; d += 0.004 * Math.exp(-g * g); }
  if(rec) rec.m = rho > RING_BAND[0] && rho < RING_BAND[1] ? 2 : 1;
  return d;
}
/* The gold warms to orange toward both edges, as the reward star does. */
function ringAlbedo(x, y, z){
  const dx = x - RING_C[0], dy = y - RING_C[1], dz = z - RING_C[2];
  const h = dx * RING_N[0] + dy * RING_N[1] + dz * RING_N[2];
  const rho = len3(dx - RING_N[0] * h, dy - RING_N[1] * h, dz - RING_N[2] * h);
  return C.mix3(hex('#FFC93A'), hex('#F59A2E'), C.smoothstep(0.55, 1.05, Math.abs(rho - RING_R) / RING_W));
}

/* FLAGS: party bunting round the cap. A cream cord rests on the cap in a
   shallow swag, lowest in front and rising to each side, where it wraps
   round out of sight; five little clay pennants hang from it, each lying
   against the cap with its top edge along the cord, so they fan out a
   little as the cord rises. No two hang quite alike.
   Everything is measured in the cap's own terms. Its side is a circle arc
   in every plane through its axis (an ogive), so a point's height above
   the cap is its distance from that circle, and its place up the side is
   the arc along it: the cord and the flags hug the cap exactly, and the
   field is smooth everywhere. The circle is found once, from the rocket. */
const CAP_ARC = (function(){
  // the cap's radius at a height, averaged round it (the lumps and lean cancel)
  function across(y){
    let s = 0;
    for(let k = 0; k < 16; k++){
      const a = k * Math.PI / 8, p = onRocket([Math.sin(a) * 1.2, y, Math.cos(a) * 1.2], [-Math.sin(a), 0, -Math.cos(a)]);
      s += len2(p[0], p[2]);
    }
    return s / 16;
  }
  // the circle through three points up the side
  const [a, b, c] = [0.2, 0.42, 0.64].map(y => [across(y), y]);
  const a2 = a[0] * a[0] + a[1] * a[1], b2 = b[0] * b[0] + b[1] * b[1], c2 = c[0] * c[0] + c[1] * c[1];
  const k = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const q = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / k;
  const y = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / k;
  return { q: q, y: y, r: len2(a[0] - q, a[1] - y) };
})();
/* The arc up the cap's side to height y, and the cap's radius at an arc. */
function capArcAt(y){ return CAP_ARC.r * Math.asin((y - CAP_ARC.y) / CAP_ARC.r); }
function capRadiusAt(arc){ return CAP_ARC.q + CAP_ARC.r * Math.cos(arc / CAP_ARC.r); }
// the cord: its middle in front at CORD_Y, rising by CORD_SAG to each side,
// and hung a touch lower on the right (CORD_TILT, along the arc)
const CORD_Y = 0.372, CORD_SAG = 0.1, CORD_TILT = -0.012, CORD_R = 0.015, CORD_H = CORD_R * 0.9;
const CORD_M = capArcAt(CORD_Y), CORD_A = capArcAt(CORD_Y + CORD_SAG) - CORD_M;
function cordArc(th){ const s = Math.sin(th); return CORD_M + CORD_A * s * s + CORD_TILT * s; }
/* How fast the cord climbs along the cap at th, where it lies at arc. */
function cordRise(th, arc){ return (CORD_A * Math.sin(2 * th) + CORD_TILT * Math.cos(th)) / capRadiusAt(arc); }
// the pennants, left to right: where each hangs round the cap (degrees), a
// little lean of its own, its size, how far its tip lifts away, and how
// much more one side of the tip lifts than the other (twist)
const FLAG_W = 0.178, FLAG_L = 0.215, FLAG_T = 0.011, FLAG_ROUND = 0.018, FLAG_H = FLAG_T + 0.002;
const FLAGS = [
  { at: -61, lean: 4,  wide: 1.0,  len: 0.95, lift: 0.01,  twist: 0.012,  m: 2 },     // yellow
  { at: -31, lean: -6, wide: 0.96, len: 1.04, lift: 0.004, twist: -0.01,  m: 3 },     // teal
  { at: -2,  lean: 3,  wide: 1.04, len: 1.0,  lift: 0.014, twist: 0.008,  m: 4 },     // pink
  { at: 28,  lean: -2, wide: 0.98, len: 0.95, lift: 0.006, twist: 0.012,  m: 5 },     // lavender
  { at: 55,  lean: 5,  wide: 1.0,  len: 1.03, lift: 0.012, twist: -0.012, m: 6 }      // orange
].map(F => {
  const th = F.at * DEG, arc = cordArc(th);
  // the flag's top edge follows the cord
  const turn = Math.atan(cordRise(th, arc)) + F.lean * DEG;
  // a triangle hanging from its top edge, pulled in by its rounding
  const hw = FLAG_W * F.wide / 2, L = FLAG_L * F.len;
  const rin = hw * L / (hw + len2(hw, L)), k = (rin - FLAG_ROUND) / rin;
  const poly = [-hw, 0, hw, 0, 0, L].map((v, i) => i % 2 ? rin + (v - rin) * k : v * k);
  return { th: th, arc: arc, c: Math.cos(turn), s: Math.sin(turn), poly: poly, hw: hw, len: L, rin: rin, lift: F.lift, twist: F.twist, m: F.m };
});
function flags(x, y, z, rec){
  // the point in the cap's terms: height above it, arc up it, angle round it
  const q = len2(x, z), dq = q - CAP_ARC.q, dy = y - CAP_ARC.y;
  const h = len2(dq, dy) - CAP_ARC.r, arc = CAP_ARC.r * Math.atan2(dy, dq), th = Math.atan2(x, z);
  // the cord, resting on the cap; measured across its own slope
  const ca = cordArc(th), rise = cordRise(th, ca);
  let d = len2((arc - ca) / Math.sqrt(1 + rise * rise), h - CORD_H) - CORD_R, m = 1;
  for(const F of FLAGS){
    let a = th - F.th;
    if(a > Math.PI) a -= 2 * Math.PI; else if(a < -Math.PI) a += 2 * Math.PI;
    const su = a * q, sv = F.arc - arc;                                   // across, and down from its top
    const fu = su * F.c - sv * F.s, fv = su * F.s + sv * F.c;
    const d2 = C.SD.poly2(fu, fv, F.poly) - FLAG_ROUND;
    // puffy: a little fuller in the middle; the tip lifts away a touch, one
    // side more than the other, as cloth that does not lie quite flat
    const t = FLAG_T * (0.85 + 0.3 * clamp(-d2 / F.rin, 0, 1));
    const v = clamp(fv / F.len, 0, 1);
    const df = C.SD.extrude(d2, h - FLAG_H - (F.lift * v + F.twist * fu / F.hw) * v, t, t * 0.9) * 0.85;
    if(df < d + 0.006){ const b = smin(d, df, 0.006); if(df < d) m = F.m; d = b; }
  }
  if(rec) rec.m = m;
  return d;
}

/* DISH: a small round satellite dish on a short lavender-grey arm from the
   body's right side, just under the cap's lip, facing out and up: a cream
   bowl (a cut hollow sphere) with a coral feed horn held at its middle on
   a little stalk. */
const DISH_BASE = (function(){
  const a = 88 * DEG, y = 0.04;
  return onRocket([Math.sin(a) * 1.2, y, Math.cos(a) * 1.2], [-Math.sin(a), 0, -Math.cos(a)]);
})();
const DISH_ARM = norm3([0.85, 0.5, 0.2]), DISH_ARM_LEN = 0.135, DISH_ARM_R = 0.03;
const DISH_AXIS = norm3([0.6, 0.62, 0.5]);
const DISH_W = 0.165, DISH_DEPTH = 0.066, DISH_T = 0.021;
const DISH_SR = (DISH_W * DISH_W + DISH_DEPTH * DISH_DEPTH) / (2 * DISH_DEPTH), DISH_H = -(DISH_SR - DISH_DEPTH);
const DISH_BACK = add(DISH_BASE, mul(DISH_ARM, DISH_ARM_LEN));
const DISH_O = add(DISH_BACK, mul(DISH_AXIS, DISH_SR + DISH_T));          // the bowl's sphere centre
const DISH_VTX = sub(DISH_O, mul(DISH_AXIS, DISH_SR));                    // the middle of the bowl
const DISH_FEED = add(DISH_VTX, mul(DISH_AXIS, DISH_SR * 0.5));           // its focus: the horn
const DISH_HORN = add(DISH_FEED, mul(DISH_AXIS, 0.03));
const DISH_IN = sub(DISH_BASE, mul(rocketNormal(DISH_BASE), 0.03));
function dish(x, y, z, rec){
  // the bowl: a hollow sphere cut by the rim's plane
  const ox = x - DISH_O[0], oy = y - DISH_O[1], oz = z - DISH_O[2];
  const qy = ox * DISH_AXIS[0] + oy * DISH_AXIS[1] + oz * DISH_AXIS[2];
  const qx = len3(ox - DISH_AXIS[0] * qy, oy - DISH_AXIS[1] * qy, oz - DISH_AXIS[2] * qy);
  let d = (DISH_H * qx < DISH_W * qy ? len2(qx - DISH_W, qy - DISH_H) : Math.abs(len2(qx, qy) - DISH_SR)) - DISH_T, m = 1;
  // the arm, its collar on the body, and the feed stalk
  const arm = smin(C.SD.roundCone2(x, y, z, DISH_IN[0], DISH_IN[1], DISH_IN[2], DISH_BACK[0], DISH_BACK[1], DISH_BACK[2], DISH_ARM_R * 1.1, DISH_ARM_R * 0.9),
                   C.SD.ellipsoid(x - DISH_BASE[0], y - DISH_BASE[1], z - DISH_BASE[2], 0.036, 0.036, 0.036), 0.02);
  const stalk = C.SD.capsule(x, y, z, DISH_VTX[0], DISH_VTX[1], DISH_VTX[2], DISH_FEED[0], DISH_FEED[1], DISH_FEED[2], 0.009);
  const grey = Math.min(arm, stalk);
  if(grey < d + 0.012){ const b = smin(d, grey, 0.012); if(grey < d) m = 2; d = b; }
  // the horn: a little coral cone, its mouth toward the bowl
  const horn = C.SD.roundCone2(x, y, z, DISH_FEED[0], DISH_FEED[1], DISH_FEED[2], DISH_HORN[0], DISH_HORN[1], DISH_HORN[2], 0.029, 0.019);
  if(horn < d + 0.008){ const b = smin(d, horn, 0.008); if(horn < d) m = 3; d = b; }
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
                                C.clay({ albedo: hex('#655E84') })] },                               // nozzle: the engine's lavender-grey
  ring:    { d: ring, albedoAt: ringAlbedo,
             mats: [C.clay({ albedo: hex('#FFC93A'), sss: 0.7, sheen: 0.12, rim: 0.35 }),              // gold, orange toward its edges
                    C.clay({ albedo: hex('#F6E3C0'), rim: 0.6 })] },                                   // the cream band
  flags:   { d: flags, mats: [C.clay({ albedo: hex('#F2E4C8'), rim: 0.55 }),                          // cord: the rocket's cream
                              C.clay({ albedo: hex('#FFC93A'), rim: 0.35 }),                           // yellow
                              C.clay({ albedo: hex('#2BBFB3') }),                                      // teal
                              C.clay({ albedo: hex('#FF86C2'), rim: 0.6 }),                            // pink
                              C.clay({ albedo: hex('#9B72E6') }),                                      // lavender
                              C.clay({ albedo: hex('#FF9A3D'), rim: 0.4 })] },                         // orange
  dish:    { d: dish, mats: [C.clay({ albedo: hex('#F2E4C8'), rim: 0.55 }),                           // bowl: the rocket's cream
                             C.clay({ albedo: hex('#9189B4') }),                                       // arm and stalk: lavender-grey
                             C.clay({ albedo: hex('#FF8A76'), rim: 0.45, spec: 0.12 })] }              // the feed horn: coral
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
