'use strict';
/* ROCKET — the child's own rocket: a friendly, chunky clay toy. A short
   cream barrel; a tall painted cone cap, its point softly rounded, pressed
   on with a crease under its lip; a big porthole (a pale cream rim, deep
   blue glass with a catch-light); three big swept painted fins standing
   level with a lavender-grey flared engine bell.

   Phase 2.2 redesigned it (real-iPad QA found the old one weak and a
   little egg-like): the pointed cap and the swept fins make the outline
   read as a rocket even at 60 px, and the crease under the cap keeps the
   body and the nose from melting into one smooth egg. A whisper of lumps,
   a tip that leans a hair and fins that are not quite symmetric keep it
   hand-made.

   PAINT: the cap and the fins are rendered in near-white clay, as
   `paint: true` materials, and exported a second time as a mask
   (rocket-paint.png, their coverage). The app multiplies a paint colour
   through that mask, which is how a matte surface takes a colour — so
   every paint is the same rocket, and a new paint needs no new picture.
   The body stays warm cream, the glass deep blue and the engine
   lavender-grey under every paint.

   FRAME: 640×800, transparent; a long lens, near side-on and slightly from
   above. The anchors, as percent of the frame from its top-left corner,
   projected from the model and checked against the render:
     nozzle bottom centre, the standing point   (50%, 81.8%)
       (its front lip, the lowest pixel, is at 83.3%)
     nozzle edges, at the bell's lip (79.6%)    35.1% and 64.9%
       (its flat bottom face: 37.8% to 62.2%)
     window centre                              (50%, 56.2%)
     window radius, to the rim's outer edge     13.9% of the width
       (the blue glass inside the rim: 8.6% of the width)
     nose tip                                   8.5% from the top
   The app stands the rocket on the nozzle's bottom centre and hangs the
   flame from it. A change that moves an anchor updates the CSS in the same
   change. rocketgear.js renders the add-ons in this same frame. */
const C = require('../clay.js');
const { len2, smin, smax, hex, clamp } = C;

const DEG = Math.PI / 180;

/* ---------- the shape, in model units: y up, z toward the camera ---------- */
// the body: a straight barrel, rolled by hand
const BODY_R = 0.42, BODY_BOTTOM = -0.54, BODY_TOP = 0.2, BODY_ROUND = 0.14, BODY_BULGE = 0.02;
// the cap: an ogive cut above its widest point, so it slopes in from its
// base (CAP_E: how far above the ogive's middle it is cut); its tip is
// rounded by CAP_TIP_R and leans CAP_LEAN to the right
const CAP_BASE = 0.12, CAP_R = 0.44, CAP_H = 0.74, CAP_E = 0.25, CAP_TIP_R = 0.11, CAP_LIP = 0.035, CAP_LEAN = 0.02;
// the porthole, wrapped on the barrel
const WIN_Y = -0.18, WIN_R = 0.19, WIN_T = 0.046, GLASS_R = 0.172, GLASS_DEPTH = 0.05;
// three fins, one behind; a 2D outline in its own plane (u out from the
// axis, y up), grown by FIN_ROUND, puffed to FIN_T in the middle
const FIN_YAWS = [59, 180, -61];
const FIN = [0.30, -0.04, 0.70, -0.46, 0.72, -0.67, 0.30, -0.57], FIN_ROUND = 0.12, FIN_T = 0.11, FIN_K = 0.05;
// the engine: a flared bell, as a half-profile [q, y, …] grown by BELL_ROUND
const BELL = [0.15, -0.41, 0.22, -0.74], BELL_ROUND = 0.05, BELL_K = 0.03;
const LUMP = 0.005;

/* ---------- anchors (model space) ---------- */
const NOZZLE_BOTTOM = BELL[3] - BELL_ROUND;      // the bell's flat bottom
const NOZZLE_R = BELL[2] + BELL_ROUND;           // the bell's lip, its widest
const NOSE_TIP = CAP_BASE + CAP_H;               // the tip's top (x = CAP_LEAN)
const BCY = (BODY_BOTTOM + BODY_TOP) / 2, BHY = (BODY_TOP - BODY_BOTTOM) / 2;
function bodyR(y){ const t = clamp((y - BCY) / BHY, -1, 1); return BODY_R + BODY_BULGE * (1 - t * t); }
const WINDOW = { center: [0, WIN_Y, bodyR(WIN_Y) + GLASS_DEPTH], radius: WIN_R + WIN_T, glass: GLASS_R };

/* ---------- 2D helpers ---------- */
/* iq's vesica: two circles of radius r, centres at x = ±d; tips on y. */
function vesica2(x, y, r, d){
  x = Math.abs(x); y = Math.abs(y);
  const b = Math.sqrt(r * r - d * d);
  return ((y - b) * d > x * b) ? len2(x, y - b) : len2(x + d, y) - r;
}
function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
/* The vesica that, grown by its rounding rt, stands h tall from its cut
   base and is exactly wb wide there (the arc near the base grows by rt). */
function fitOgive(wb, h, e, rt){
  const h0 = h - rt;
  let lo = 0.02, hi = wb, nd = 0, nr = 0;
  for(let i = 0; i < 60; i++){
    const w0 = (lo + hi) / 2;
    nd = (h0 * h0 + 2 * h0 * e - w0 * w0) / (2 * w0);
    nr = Math.sqrt(nd * nd + (h0 + e) * (h0 + e));
    const base = Math.sqrt(Math.max(0, (nr + rt) * (nr + rt) - e * e)) - nd;
    if(base > wb) hi = w0; else lo = w0;
  }
  return { nr: nr, nd: nd };
}

/* ---------- derived once ---------- */
const CAP = fitOgive(CAP_R, CAP_H, CAP_E, CAP_TIP_R);
const FS = FIN_YAWS.map(a => Math.sin(a * DEG)), FC = FIN_YAWS.map(a => Math.cos(a * DEG));
let FIN_UMIN = 1e9;
for(let i = 0; i < FIN.length; i += 2) FIN_UMIN = Math.min(FIN_UMIN, FIN[i]);
FIN_UMIN -= FIN_ROUND + 0.01;
const finFlat = (u, y) => C.SD.poly2(u, y, FIN) - FIN_ROUND;
// a fin puffs from the middle of its visible part (outside the body)
const PUFF = (function(){
  let u0 = 1e9, u1 = -1e9, y0 = 1e9, y1 = -1e9;
  for(let iu = 0; iu <= 120; iu++) for(let iy = 0; iy <= 180; iy++){
    const u = iu / 100, y = -1 + iy / 100;
    if(u > BODY_R && finFlat(u, y) < 0){ u0 = Math.min(u0, u); u1 = Math.max(u1, u); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  return { u: (u0 + u1) / 2 - 0.04, y: (y0 + y1) / 2, ru: (u1 - u0) / 2 + 0.06, ry: (y1 - y0) / 2 + 0.06 };
})();
// the bell's half-profile, mirrored into one polygon
const BELL_POLY = [BELL[0], BELL[1], BELL[2], BELL[3], -BELL[2], BELL[3], -BELL[0], BELL[1]];
const BELL_TOP = BELL[1] + BELL_ROUND, BELL_RMAX = NOZZLE_R;
// the window's reach, for skipping it far away
const WIN_R0 = bodyR(WIN_Y), WIN_REACH = WIN_R + WIN_T + 0.06;
const WIN_Z = WIN_R0 * Math.cos(Math.min(1.4, WIN_REACH / WIN_R0)) - 0.08;
const GLASS_SR = (GLASS_R * GLASS_R + GLASS_DEPTH * GLASS_DEPTH) / (2 * GLASS_DEPTH);
const SHINE_S = -0.42 * GLASS_R, SHINE_V = 0.42 * GLASS_R, SHINE_A = 0.3 * GLASS_R, SHINE_B = 0.1 * GLASS_R;

/* A whisper of hand-made unevenness, so the pieces are not machined. */
const lumpNoise = C.makeNoise(47);

/* Materials, by index. */
const M_BODY = 0, M_PAINT = 1, M_RIM = 2, M_GLASS = 3, M_ENGINE = 4, M_SHINE = 5;

/* The rocket's distance field. rec.m gets the material there. */
function sdf(x, y, z, rec){
  const q = len2(x, z);
  // the body: a barrel
  const t = clamp((y - BCY) / BHY, -1, 1);
  let d = roundRect2(q - BODY_BULGE * (1 - t * t), y - BCY, BODY_R, BHY, BODY_ROUND) * 0.97;
  let m = M_BODY;
  // the cap: a separate lump pressed on top; the tip leans a little
  const yl = y - CAP_BASE;
  if(-yl - 0.05 < d){
    const lt = clamp(yl / CAP_H, 0, 1);
    const qn = len2(x - CAP_LEAN * lt * lt, z);
    const dn = smax(vesica2(qn, yl + CAP_E, CAP.nr, CAP.nd) - CAP_TIP_R, -yl, CAP_LIP);
    if(dn < d + 0.015){ const b = smin(d, dn, 0.015); if(dn < d) m = M_PAINT; d = b; }
  }
  // fins: puffed like a pillow, thickest in the middle
  for(let i = 0; i < 3; i++){
    const u = x * FS[i] + z * FC[i], w = x * FC[i] - z * FS[i];
    // skip a fin only where even its nearest possible (scaled) surface is
    // beyond the blend: a skip that changes the field leaves a seam
    if(0.9 * Math.max(Math.abs(w) - FIN_T, FIN_UMIN - u) > d + FIN_K) continue;
    const d2 = finFlat(u, y);
    const pu = (u - PUFF.u) / PUFF.ru, pv = (y - PUFF.y) / PUFF.ry;
    const hh = FIN_T * Math.max(0.55, 1 - 0.4 * (pu * pu + pv * pv));
    const df = C.SD.extrude(d2, w, hh, hh * 0.96) * 0.9;
    if(df < d + FIN_K){ const b = smin(d, df, FIN_K); if(df < d) m = M_PAINT; d = b; }
  }
  // the engine bell
  if(Math.max(y - BELL_TOP - 0.02, q - BELL_RMAX, NOZZLE_BOTTOM - y) < d + BELL_K){
    const de = C.SD.poly2(q, y, BELL_POLY) - BELL_ROUND;
    if(de < d + BELL_K){ const b = smin(d, de, BELL_K); if(de < d) m = M_ENGINE; d = b; }
  }
  d += LUMP * lumpNoise(x * 2.2, y * 2.2, z * 2.2);
  // the porthole: a rim coil and a domed glass, wrapped on the barrel
  if(Math.max(len2(x, y - WIN_Y) - WIN_REACH, WIN_Z - z) < d){
    const s = Math.atan2(x, z) * WIN_R0, v = y - WIN_Y;
    const h = q - bodyR(y);
    const rho = len2(s, v);
    const dRim = len2(rho - WIN_R, h) - WIN_T;
    if(dRim < d + 0.025){ const b = smin(d, dRim, 0.025); if(dRim < d) m = M_RIM; d = b; }
    // the glass: a spherical cap meeting the body at its edge
    const dGl = Math.max(len2(rho, h - GLASS_DEPTH + GLASS_SR) - GLASS_SR, rho - GLASS_R);
    if(dGl < d){
      d = dGl; m = M_GLASS;
      // the catch-light, upper left, following the curve: painted on the glass
      const cs = s - SHINE_S, cv = v - SHINE_V;
      const al = (cs + cv) * 0.7071 / SHINE_A, ac = (cv - cs) * 0.7071 / SHINE_B;
      if(al * al + ac * ac < 1) m = M_SHINE;
    }
  }
  if(rec) rec.m = m;
  return d;
}

/* The one camera and frame every rocket picture shares (rocketgear.js too). */
const W = 640, H = 800, FRAME_W = 1.8, CAM_D = 8;
function camera(){
  const frameH = FRAME_W * H / W;
  return { pos: [0, 0.3, CAM_D], target: [0, -0.07, 0], fov: 2 * Math.atan((frameH / 2) / CAM_D) * 180 / Math.PI };
}

function build(){
  return {
    width: W, height: H, scale: 1, seed: 41, spp: 3, aoRange: 0.08,
    camera: camera(),
    bounds: { center: [0, 0.02, 0], radius: 1.12 },
    materials: [
      C.clay({ albedo: hex('#F2E4C8') }),                                   // 0 body: warm cream
      C.clay({ albedo: hex('#F3F0F4'), paint: true }),                      // 1 paint: white, tinted in the app
      C.clay({ albedo: hex('#F7EFE0') }),                                   // 2 window rim: pale cream
      C.clay({ albedo: hex('#1B3C92'), spec: 1.5, specPow: 50, sheen: 0.2, grain: 0, stroke: 0, sss: 0.2 }), // 3 glass
      C.clay({ albedo: hex('#655E84') }),                                   // 4 engine: lavender-grey
      C.clay({ albedo: hex('#FFFFFF'), grain: 0, stroke: 0, spec: 0.3, emissive: [0.45, 0.45, 0.5] }) // 5 catch-light
    ],
    map: sdf,
    /* Soft shadows read the field a little short: where a surface faces the
       key light head on, a field that grows as fast as the shadow ray fools
       the penumbra estimate into a hard black patch (README, Previewing). */
    shadowMap(x, y, z){ return sdf(x, y, z, null) * 0.85; }
  };
}

module.exports = {
  build: build,
  // anchors, in model space: the app's CSS and contract 31 read NOZZLE_BOTTOM
  NOZZLE_BOTTOM: NOZZLE_BOTTOM, NOZZLE_R: NOZZLE_R, NOSE_TIP: NOSE_TIP, NOSE_LEAN: CAP_LEAN, WINDOW: WINDOW,
  // the shape itself, for the add-ons that sit on it (rocketgear.js)
  sdf: sdf, bodyR: bodyR, FIN_YAWS: FIN_YAWS
};
