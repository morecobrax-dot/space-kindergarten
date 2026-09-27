'use strict';
/* STATION — the Rocket Dock as a place: a small, friendly orbital space
   station, a kindergarten space workshop. Two variants:

     outside  the station seen from space as the rocket comes in (1024×1024,
              transparent): a round cream core in a chunky lavender ring, a
              big round-topped docking-bay door facing us (dark inside, warm
              deep inside) framed by a rolled coral trim, two cream modules
              threaded on the ring, a short dish, and a ring of warm lights.
     inside   the garage room (2400×1600, opaque but for its porthole): soft
              cream and lavender clay walls curving into the floor and the
              ceiling, one big porthole whose glass is left OPEN (alpha 0) so
              the app's live sky and Earth show through, a chunky teal
              turntable ringed with warm lights where the rocket stands, paint
              pots, a soft coral hose and a row of station lamps. The right
              third is a calm, quiet wall: the app lays its panel there.

   Anchors, as fractions of each picture (ANCHORS below; move one and the
   CSS moves too):
     inside   turntable top-face centre 38.00%, 70.50%; porthole centre
              23.36%, 33.71%, radius 7.88% of the width (11.81% of the height)
     outside  docking-bay centre 46.68%, 60.01% */
const C = require('../clay.js');
const { SD, len2, len3, smin, smax, hex, smoothstep, norm3 } = C;

/* ---------- a pose: world = Ry(yaw) Rx(pitch) local ---------- */
function makePose(yaw, pitch){
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const out = [0, 0, 0];
  return {
    toLocal(x, y, z){
      // undo yaw, then undo pitch
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      out[0] = x1; out[1] = y * cp + z1 * sp; out[2] = -y * sp + z1 * cp;
      return out;
    },
    toWorld(p){
      const y1 = p[1] * cp - p[2] * sp, z1 = p[1] * sp + p[2] * cp;
      return [p[0] * cy + z1 * sy, y1, -p[0] * sy + z1 * cy];
    }
  };
}

/* =========================================================
   OUTSIDE — the station from space
   Local frame: the hub's axis is +z (toward us before the pose). The pose
   turns it a little left and down, so the ring reads as a ring and the
   door still faces us.
   ========================================================= */
const O = {
  CORE_R: 1.08, CORE_H: 0.6, CORE_RB: 0.38, CORE_Z: 0.1,     // the cream core: a chunky drum
  RING_R: 1.7, RING_T: 0.44,                                  // the lavender ring
  BAY_W: 0.52, BAY_TOP: 0.56, BAY_BOT: -0.5, BAY_BACK: -0.42, // the docking bay: a round-topped door, how deep
  LIGHTS: 12
};
O.FRONT = O.CORE_Z + O.CORE_H;                                 // the core's front face
O.BAY_C = O.BAY_TOP - O.BAY_W;                                 // centre of the door's round top
/* the door's outline in the front face: a round-topped arch with a flat
   sill, its lower corners softened (negative inside) */
function arch2(x, y){
  const side = y > O.BAY_C ? len2(x, y - O.BAY_C) - O.BAY_W : Math.abs(x) - O.BAY_W;
  return smax(side, O.BAY_BOT - y, 0.12);
}
const POSE_OUT = makePose(-0.28, 0.32);
/* modules: chunky barrels threaded on the ring: angle round it, radius, half-length */
const MODS = [[2.6, 0.62, 0.3], [-0.5, 0.58, 0.26]].map(p => {
  const c = Math.cos(p[0]), s = Math.sin(p[0]);
  return { c: [c * O.RING_R, s * O.RING_R], t: [-s, c], n: [c, s], r: p[1], h: p[2] };
});
/* the dish: on top of the ring, tipped up and to the right */
const DISH_A = 1.28;
const DISH_BASE = [Math.cos(DISH_A) * (O.RING_R + O.RING_T * 0.7), Math.sin(DISH_A) * (O.RING_R + O.RING_T * 0.7), 0.05];
const DISH_AXIS = norm3([0.45, 0.8, 0.4]);
const DISH_JOINT = [DISH_BASE[0] + 0.02, DISH_BASE[1] + 0.3, DISH_BASE[2]];
const DISH_RIM = 0.36, DISH_DEPTH = 0.15, DISH_SHELL = 0.038;
const DISH_SR = (DISH_RIM * DISH_RIM + DISH_DEPTH * DISH_DEPTH) / (2 * DISH_DEPTH), DISH_SH = DISH_DEPTH - DISH_SR;
const DISH_X = norm3(C.cross3(DISH_AXIS, [0, 0, 1])), DISH_Z = C.cross3(DISH_X, DISH_AXIS);
const DISH_C = [DISH_JOINT[0] + DISH_AXIS[0] * (DISH_SR + DISH_SHELL + 0.02), DISH_JOINT[1] + DISH_AXIS[1] * (DISH_SR + DISH_SHELL + 0.02),
                DISH_JOINT[2] + DISH_AXIS[2] * (DISH_SR + DISH_SHELL + 0.02)];
const DISH_FEED = [DISH_C[0] - DISH_AXIS[0] * DISH_SR, DISH_C[1] - DISH_AXIS[1] * DISH_SR, DISH_C[2] - DISH_AXIS[2] * DISH_SR];
const DISH_TIP = [DISH_FEED[0] + DISH_AXIS[0] * 0.24, DISH_FEED[1] + DISH_AXIS[1] * 0.24, DISH_FEED[2] + DISH_AXIS[2] * 0.24];

/* a sphere of radius r cut at height h, the part below kept (opening +y),
   with shell half-thickness t: an exact distance (as radar.js) */
function cutHollowSphere(x, y, z, r, h, t){
  const w = Math.sqrt(r * r - h * h);
  const qx = len2(x, z), qy = y;
  return ((h * qx < w * qy) ? len2(qx - w, qy - h) : Math.abs(len2(qx, qy) - r)) - t;
}

function outsideLocal(x, y, z, rec){
  // the core, a chunky drum along z
  let d = SD.roundCylinder(x, z - O.CORE_Z, y, O.CORE_R, O.CORE_H, O.CORE_RB), m = 0;
  // the docking bay: a tunnel the shape of the door, pressed into the core's front
  const a2 = arch2(x, y);
  const bayLen = (O.FRONT + 0.4 - O.BAY_BACK) / 2;
  const hole = SD.extrude(a2, z - (O.BAY_BACK + bayLen), bayLen, 0.2);
  if(hole < 0.06){ d = smax(d, -hole, 0.05); if(hole > -0.02 && a2 < 0.01 && z < O.FRONT - 0.03) m = 4; }
  // its coral trim: a rolled snake of clay pressed round the door
  const trim = len2(a2 - 0.1, z - (O.FRONT - 0.02)) - 0.1;
  if(trim < d){ d = smin(d, trim, 0.03); if(trim < d + 0.02) m = 3; }
  // the ring, and the short spokes that hold it
  const ring = SD.torus(x, z, y, O.RING_R, O.RING_T);
  if(ring < d){ d = ring; m = 1; }
  const ang = Math.atan2(y, x);
  const sk = Math.round((ang - Math.PI / 4) / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 4;
  const spoke = SD.capsule(x, y, z, Math.cos(sk) * (O.CORE_R - 0.2), Math.sin(sk) * (O.CORE_R - 0.2), 0,
                           Math.cos(sk) * (O.RING_R - 0.1), Math.sin(sk) * (O.RING_R - 0.1), 0, 0.12);
  if(spoke < d + 0.05){ const b = smin(d, spoke, 0.05); if(spoke < d) m = 2; d = b; }
  // the ring of small warm lights, on the ring's front
  const step = 2 * Math.PI / O.LIGHTS;
  const lk = (Math.round((ang - step / 2) / step) + 0.5) * step;
  const light = len3(x - Math.cos(lk) * O.RING_R, y - Math.sin(lk) * O.RING_R, z - O.RING_T * 0.9) - 0.085;
  if(light < d){ d = light; m = 5; }
  // the modules: cream barrels with teal ends and a small round window
  for(const M of MODS){
    const qx = x - M.c[0], qy = y - M.c[1];
    const u = qx * M.t[0] + qy * M.t[1], v = qx * M.n[0] + qy * M.n[1];
    const md = SD.roundCylinder(v, u, z, M.r, M.h, 0.22);
    if(md < d + 0.05){
      const b = smin(d, md, 0.05);
      if(md < d) m = Math.abs(u) > M.h - 0.1 ? 2 : 6;
      d = b;
      const w = len3(v, u, z - M.r + 0.035) - 0.12;
      if(w < d){ d = w; m = 7; }
    }
  }
  // the dish: a stalk, a shallow bowl, a feed rod and a coral tip
  const st = SD.capsule(x, y, z, DISH_BASE[0], DISH_BASE[1] - 0.1, DISH_BASE[2], DISH_JOINT[0], DISH_JOINT[1], DISH_JOINT[2], 0.07);
  if(st < d + 0.04){ const b = smin(d, st, 0.04); if(st < d) m = 2; d = b; }
  const px = x - DISH_C[0], py = y - DISH_C[1], pz = z - DISH_C[2];
  const lx = px * DISH_X[0] + py * DISH_X[1] + pz * DISH_X[2];
  const ly = px * DISH_AXIS[0] + py * DISH_AXIS[1] + pz * DISH_AXIS[2];
  const lz = px * DISH_Z[0] + py * DISH_Z[1] + pz * DISH_Z[2];
  const dish = cutHollowSphere(lx, ly, lz, DISH_SR, DISH_SH, DISH_SHELL);
  if(dish < d){ d = dish; m = 0; }
  const rod = SD.capsule(x, y, z, DISH_FEED[0], DISH_FEED[1], DISH_FEED[2], DISH_TIP[0], DISH_TIP[1], DISH_TIP[2], 0.022);
  if(rod < d){ d = rod; m = 2; }
  const tip = len3(x - DISH_TIP[0], y - DISH_TIP[1], z - DISH_TIP[2]) - 0.06;
  if(tip < d){ d = tip; m = 3; }
  if(rec) rec.m = m;
  return d;
}

const BAY_WARM = [1.0, 0.62, 0.26];
const OUT_CAM = { W: 1024, H: 1024, D: 16, frame: 5.85, y: 0.37 };
/* the middle of the door's opening, in the front face */
const BAY_CENTER = POSE_OUT.toWorld([0, (O.BAY_TOP + O.BAY_BOT) / 2, O.FRONT]);
function buildOutside(){
  const bayDeep = POSE_OUT.toWorld([0, 0, O.BAY_BACK + 0.12]);
  return {
    width: OUT_CAM.W, height: OUT_CAM.H, scale: 1, seed: 131, spp: 3, aoRange: 0.08,
    camera: { pos: [0, OUT_CAM.y, OUT_CAM.D], target: [0, OUT_CAM.y, 0], fov: 2 * Math.atan((OUT_CAM.frame / 2) / OUT_CAM.D) * 180 / Math.PI },
    bounds: { center: [0, 0.1, 0], radius: 2.75 },
    // the warm heart of the hangar, deep inside the door
    points: [{ pos: bayDeep, color: BAY_WARM, intensity: 1.5, radius: 0.24 }],
    materials: [
      C.clay({ albedo: hex('#F0E4D0') }),                                          // 0 core, dish
      C.clay({ albedo: hex('#A69CDA') }),                                          // 1 ring
      C.clay({ albedo: hex('#2AAFB8') }),                                          // 2 teal: spokes, module ends, stalk
      C.clay({ albedo: hex('#FF8A76'), rim: 0.5 }),                                // 3 coral trim, dish tip
      C.clay({ albedo: hex('#2A2352'), rim: 0.4, emissive: [0, 0, 0] }),           // 4 the bay's inside
      C.clay({ albedo: hex('#FFD27A'), grain: 0, stroke: 0, rim: 0.3, emissive: [1.05, 0.66, 0.2] }), // 5 warm lights
      C.clay({ albedo: hex('#EFE8F4') }),                                          // 6 module bodies
      C.clay({ albedo: hex('#1E4296'), spec: 1.5, specPow: 50, sheen: 0.2, grain: 0, stroke: 0, sss: 0.2 }) // 7 module windows
    ],
    map(x, y, z, rec){
      const p = POSE_OUT.toLocal(x, y, z);
      return outsideLocal(p[0], p[1], p[2], rec) * 0.95;
    },
    emissiveAt(x, y, z, mi, mat){
      if(mi !== 4) return mat.emissive;
      // the bay glows warm deep inside: a warm heart at the back, fading
      // out toward the walls and the mouth, which stay dark
      const p = POSE_OUT.toLocal(x, y, z);
      const k = smoothstep(O.BAY_BACK + 0.45, O.BAY_BACK + 0.02, p[2]) * smoothstep(0.02, -0.4, arch2(p[0], p[1]));
      const f = 0.9 * k * k;
      return [BAY_WARM[0] * f, BAY_WARM[1] * f, BAY_WARM[2] * f];
    }
  };
}

/* =========================================================
   INSIDE — the garage room
   A soft clay room shot as a stop-motion set: a flat floor curving up
   into a back wall that leans back just enough to face the camera (so
   the porthole is a true circle in the picture), a wall curving in at
   the left, a ceiling cove at the top. Everything that matters is placed
   by where it lands in the picture, through the camera's own maths, so
   the anchors are exact.
   ========================================================= */
const IW = 2400, IH = 1600, IASPECT = IW / IH;
const I_TH = 0.3;                                             // tan of half the vertical field of view
const I_PITCH = 9.5 * Math.PI / 180;                          // the camera looks down this much
const I_CAM = [0, 4.3, 10.2];
const I_TARGET = [0, I_CAM[1] - 15 * Math.sin(I_PITCH), I_CAM[2] - 15 * Math.cos(I_PITCH)];
const IF = norm3([I_TARGET[0] - I_CAM[0], I_TARGET[1] - I_CAM[1], I_TARGET[2] - I_CAM[2]]);
const IR = norm3(C.cross3(IF, [0, 1, 0])), IU = C.cross3(IR, IF);
function rayAt(fx, fy){
  const ndx = (2 * fx - 1) * I_TH * IASPECT, ndy = (1 - 2 * fy) * I_TH;
  return norm3([IF[0] + IR[0] * ndx + IU[0] * ndy, IF[1] + IR[1] * ndx + IU[1] * ndy, IF[2] + IR[2] * ndx + IU[2] * ndy]);
}
/* where the picture point (fx, fy) meets the plane n·p = c */
function onPlane(fx, fy, n, c){
  const d = rayAt(fx, fy), P = I_CAM;
  const t = (c - C.dot3(n, P)) / C.dot3(n, d);
  return [P[0] + d[0] * t, P[1] + d[1] * t, P[2] + d[2] * t];
}
function onFloor(fx, fy, h){ return onPlane(fx, fy, [0, 1, 0], h); }
/* how far a point is in front of the camera */
function depthOf(p){ return (p[0] - I_CAM[0]) * IF[0] + (p[1] - I_CAM[1]) * IF[1] + (p[2] - I_CAM[2]) * IF[2]; }

/* the room: a floor, the back wall, a wall at each side and a ceiling,
   their meeting lines rounded into soft coves */
const NB = [-IF[0], -IF[1], -IF[2]];                          // the back wall faces the camera
const WALL_Z = -7.5;                                          // where it meets the floor
const CB = NB[2] * WALL_Z;
const onWall = (fx, fy) => onPlane(fx, fy, NB, CB);
const XL = -8.6, XR = 9.5, YC = 7.0, COVE = 1.35, COVE_TOP = 2.4, SHELL = 0.4;
const BAND_Y = 1.0;                                           // the lavender band along the foot of the walls
const FLOOR_UP = 0.42;                                        // how far the floor's colour runs up the coves
/* the wall's own frame: across (IR), up along it (EU), out of it (NB) */
const EU = C.cross3(NB, IR);
function wallFrame(x, y, z, o){
  const vx = x - o[0], vy = y - o[1], vz = z - o[2];
  return [vx * IR[0] + vy * IR[1] + vz * IR[2], vx * EU[0] + vy * EU[1] + vz * EU[2], vx * NB[0] + vy * NB[1] + vz * NB[2]];
}
function room(x, y, z){
  const back = CB - (NB[0] * x + NB[1] * y + NB[2] * z);
  let k = smax(-y, back, COVE);
  k = smax(k, XL - x, COVE);
  k = smax(k, x - XR, COVE);
  k = smax(k, y - YC, COVE_TOP);
  return k;
}
/* soft pressed seams that part the back wall into big clay panels:
   upright ones (x on the wall), and one along the top of the band */
const SEAMS = [0.075, 0.47].map(fx => onWall(fx, 0.3)[0]);

/* the porthole: a hole through the back wall, framed by a thick cream rim
   and a lavender plate. Nothing is in the hole: its glass is the app's sky. */
const WIN_AT = [0.235, 0.338];                                // its centre on the wall, in the picture
const WIN_C = onWall(WIN_AT[0], WIN_AT[1]);
const WIN_R = 0.118 * 2 * I_TH * depthOf(WIN_C);              // the open glass: 11.8% of the picture's height
const WIN_T = WIN_R * 0.2;                                    // the rim's thickness
const WIN_PLATE = WIN_R + 2 * WIN_T + WIN_R * 0.3;
/* the open glass's own edge is the rim's inner edge, a little in front of
   the wall: the circle the app's sky shows through */
const WINDOW_CENTER = [WIN_C[0] + NB[0] * WIN_T * 0.45, WIN_C[1] + NB[1] * WIN_T * 0.45, WIN_C[2] + NB[2] * WIN_T * 0.45];

/* the turntable: its top face centred at TT_AT in the picture, TT_SPAN of
   the picture's width across. Its front edge stays above 84% of the
   picture, so a wide screen's crop never cuts it. */
const TT_AT = [0.38, 0.705], TT_SPAN = 0.225;
const TT_TOP = 0.57, TT_LID = 0.16;
const TT_C = onFloor(TT_AT[0], TT_AT[1], TT_TOP);             // the top face's centre: the rocket stands here
const TT_R = (function(){
  const a = onFloor(TT_AT[0] - TT_SPAN / 2, TT_AT[1], TT_TOP), b = onFloor(TT_AT[0] + TT_SPAN / 2, TT_AT[1], TT_TOP);
  return len3(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 2;
})();
const TT_R2 = TT_R + 0.04, TT_LIGHTS = 16;

/* paint pots standing on the floor at the left: where, radius, half-height */
const POTS = [[0.155, 0.742, 0.42, 0.36], [0.235, 0.785, 0.36, 0.28], [0.125, 0.822, 0.3, 0.24]]
  .map(p => ({ c: onFloor(p[0], p[1], 0), r: p[2], h: p[3] }));

/* a soft clay hose from a socket in the wall to the turntable's side */
const HOSE_R = 0.17, HOSE_N = 40;                              // enough links that its bends stay round
const HOSE = (function(){
  const sy = 2.1, s = onWall(0.54, 0.5);
  const p0 = [s[0], sy, (CB - NB[1] * sy) / NB[2] + 0.05];     // the socket, above the cove
  const p1 = [s[0] + 0.2, HOSE_R, p0[2] + 2.2];
  const p3 = [TT_C[0] + TT_R2 * 0.92, HOSE_R, TT_C[2] - TT_R2 * 0.3];
  const p2 = [p3[0] + 1.7, HOSE_R, p3[2] + 0.9];
  const pts = [];
  for(let i = 0; i <= HOSE_N; i++){
    const t = i / HOSE_N, u = 1 - t;
    const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    pts.push([0, 1, 2].map(k => b[0] * p0[k] + b[1] * p1[k] + b[2] * p2[k] + b[3] * p3[k]));
  }
  // lying on the floor once it reaches it
  for(const p of pts) p[1] = Math.max(p[1], HOSE_R);
  return { pts: pts, socket: p0 };
})();

/* small station lamps high on the back wall: a warm bulb on a cream cup,
   each sitting where a picture point meets the room's own surface */
const LAMP_R = 0.2;
function surfaceAt(fx, fy){
  const r = rayAt(fx, fy), P = I_CAM;
  const shell = (x, y, z) => { const k = room(x, y, z); return Math.max(-k, k - SHELL); };
  let t = 0;
  for(let i = 0; i < 400; i++){
    const h = shell(P[0] + r[0] * t, P[1] + r[1] * t, P[2] + r[2] * t);
    if(h < 1e-5) break;
    t += h * 0.8;
  }
  const p = [P[0] + r[0] * t, P[1] + r[1] * t, P[2] + r[2] * t], e = 1e-3;
  const n = norm3([shell(p[0] + e, p[1], p[2]) - shell(p[0] - e, p[1], p[2]),
                   shell(p[0], p[1] + e, p[2]) - shell(p[0], p[1] - e, p[2]),
                   shell(p[0], p[1], p[2] + e) - shell(p[0], p[1], p[2] - e)]);
  return { p: p, n: n };
}
const LAMPS = [0.1, 0.22, 0.34, 0.46].map(fx => surfaceAt(fx, 0.075));

/* the props: everything that stands in the room and casts a shadow.
   Computed in full everywhere: a cheap bounding shape swapped for the
   real one leaves a step in the distance, and the soft shadows draw
   arcs where it does. forShadow asks for the shadows' version: the lamps
   are left out (a light casts no shadow), and the hose is thinner. */
function props(x, y, z, rec, forShadow){
  let d, m;
  // the window's rim
  const w = wallFrame(x, y, z, WIN_C);
  d = len2(len2(w[0], w[1]) - (WIN_R + WIN_T), w[2] - WIN_T * 0.45) - WIN_T; m = 2;
  // the turntable: a chunky teal drum ringed with small warm lights, a
  // coral roll of clay under its cream lid, a soft ring pressed into the lid
  const tx = x - TT_C[0], tz = z - TT_C[2], tq = len2(tx, tz);
  const DH = (TT_TOP - TT_LID) / 2;
  const drum = SD.roundCylinder(tx, y - DH, tz, TT_R, DH, 0.13);
  if(drum < d){ d = drum; m = 3; }
  let lid = SD.roundCylinder(tx, y - (TT_TOP - TT_LID / 2), tz, TT_R + 0.04, TT_LID / 2, 0.075);
  lid += 0.02 * Math.exp(-((tq - TT_R * 0.72) / 0.05) * ((tq - TT_R * 0.72) / 0.05)) * smoothstep(TT_TOP - 0.1, TT_TOP, y);
  if(lid < d){ d = lid; m = 4; }
  const roll = len2(tq - TT_R - 0.01, y - (TT_TOP - TT_LID)) - 0.055;
  if(roll < d){ d = roll; m = 6; }
  const step = 2 * Math.PI / TT_LIGHTS, a = Math.atan2(tz, tx);
  const ak = (Math.round(a / step - 0.5) + 0.5) * step;
  const lamp = len3(tx - Math.cos(ak) * TT_R, y - DH * 0.95, tz - Math.sin(ak) * TT_R) - 0.085;
  if(lamp < d){ d = lamp; m = 5; }
  // the paint pots: a round pot with a rolled lip, paint showing on top
  for(let i = 0; i < POTS.length; i++){
    const P = POTS[i];
    const px = x - P.c[0], pz = z - P.c[2];
    let pot = SD.roundCylinder(px, y - P.h, pz, P.r, P.h, 0.1);
    const lip = SD.torus(px, y - P.h * 2 + 0.03, pz, P.r - 0.02, 0.06);
    pot = smin(pot, lip, 0.03);
    if(pot < d){ d = pot; m = y > P.h * 2 - 0.02 && len2(px, pz) < P.r - 0.07 ? 10 + i : 7; }
  }
  // the hose, and its socket in the wall. For shadows the hose is a
  // little thinner: a shadow ray leaving a tube this thin skims its own
  // surface, and the soft shadow ripples along its shaded side.
  const H = HOSE.pts, hr = forShadow ? HOSE_R - 0.05 : HOSE_R;
  let hd = 1e9;
  for(let i = 0; i < H.length - 1; i++){
    const c = SD.capsule(x, y, z, H[i][0], H[i][1], H[i][2], H[i + 1][0], H[i + 1][1], H[i + 1][2], hr);
    if(c < hd) hd = c;
  }
  if(hd < d + 0.05){ const b = smin(d, hd, 0.05); if(hd < d) m = 8; d = b; }
  const sw = wallFrame(x, y, z, HOSE.socket);
  const sock = SD.extrude(len2(sw[0], sw[1]) - 0.34, sw[2] + 0.02, 0.12, 0.07);
  if(sock < d + 0.03){ const b = smin(d, sock, 0.03); if(sock < d) m = 9; d = b; }
  if(forShadow) return d;
  // the station lamps
  for(const L of LAMPS){
    const vx = x - L.p[0], vy = y - L.p[1], vz = z - L.p[2];
    const al = vx * L.n[0] + vy * L.n[1] + vz * L.n[2];
    const pr = len3(vx - L.n[0] * al, vy - L.n[1] * al, vz - L.n[2] * al);
    const cup = SD.extrude(pr - LAMP_R * 1.5, al, 0.09, 0.07);
    if(cup < d){ d = cup; m = 9; }
    const l = len3(vx - L.n[0] * 0.1, vy - L.n[1] * 0.1, vz - L.n[2] * 0.1) - LAMP_R;
    if(l < d){ d = l; m = 5; }
  }
  if(rec) rec.m = m;
  return d;
}

const PREC = { m: 0 };
function inside(x, y, z, rec){
  const k = room(x, y, z);
  let d = Math.max(-k, k - SHELL), m = 0;
  // pressed seams: panels on the back wall above the band, and the band's edge
  if(d < 0.3){
    const onBack = smoothstep(0.6, 0.1, CB - (NB[0] * x + NB[1] * y + NB[2] * z)) * smoothstep(0.1, 0.4, y);
    let g = Math.exp(-((y - BAND_Y) / 0.035) * ((y - BAND_Y) / 0.035));
    if(y > BAND_Y) for(const sx of SEAMS){ const t = (x - sx) / 0.035; g += Math.exp(-t * t); }
    d += 0.022 * g * onBack;
  }
  // the lavender plate round the window, pressed onto the wall, and the hole
  const w = wallFrame(x, y, z, WIN_C);
  const wq = len2(w[0], w[1]);
  const plate = SD.extrude(wq - WIN_PLATE, w[2], 0.08, 0.06);
  if(plate < d + 0.06){ const b = smin(d, plate, 0.06); if(plate < d + 0.01) m = 1; d = b; }
  const hole = Math.max(wq - (WIN_R + WIN_T * 0.6), Math.abs(w[2] + SHELL / 2) - SHELL / 2 - 0.3);
  d = smax(d, -hole, 0.03);
  const p = props(x, y, z, rec ? PREC : null);
  if(p < d){ d = p; m = PREC.m; }
  if(rec) rec.m = m;
  // a little under 1: the coves' soft blends make the distance slightly long
  return d * 0.92;
}

const FLOOR = hex('#7F77AD'), BAND = hex('#A79CD6'), CREAM = hex('#E6D4B8');
const TT_WARM = [1.0, 0.72, 0.4], LAMP_WARM = [1.0, 0.78, 0.46];
function buildInside(){
  return {
    width: IW, height: IH, scale: 1.2, seed: 137, spp: 2, aoRange: 0.25, maxSteps: 320,
    exposure: 0.86,
    fillsFrame: true,
    camera: { pos: I_CAM, target: I_TARGET, fov: 2 * Math.atan(I_TH) * 180 / Math.PI },
    bounds: { center: [0, 3, -1], radius: 22 },
    // warm light only from things that glow: the turntable's ring of lights,
    // the station lamps, and a soft wash from the lamps along the top
    points: [
      { pos: [TT_C[0], TT_TOP + 0.15, TT_C[2]], color: TT_WARM, intensity: 2.0, radius: TT_R2 * 1.4 },
      { pos: [-1.5, 6.4, -2], color: [1.0, 0.88, 0.72], intensity: 0.3, radius: 8 }
    ].concat(LAMPS.map(L => ({ pos: [L.p[0] + L.n[0] * 0.45, L.p[1] + L.n[1] * 0.45, L.p[2] + L.n[2] * 0.45],
                               color: LAMP_WARM, intensity: 0.7, radius: 1.3 }))),
    materials: [
      C.clay({ albedo: CREAM, rim: 0.3 }),                                          // 0 floor and walls (see albedoAt)
      C.clay({ albedo: BAND, rim: 0.4 }),                                           // 1 the window's plate
      C.clay({ albedo: hex('#F4E4C8'), rim: 0.4 }),                                 // 2 the window's rim
      C.clay({ albedo: hex('#2AAFB8'), rim: 0.5 }),                                 // 3 turntable drum
      C.clay({ albedo: hex('#F7EEDF'), rim: 0.4 }),                                 // 4 turntable lid
      C.clay({ albedo: hex('#FFD27A'), grain: 0, stroke: 0, rim: 0.2, emissive: [1.05, 0.66, 0.2] }), // 5 warm lights
      C.clay({ albedo: hex('#FF8A76'), rim: 0.4 }),                                 // 6 turntable's coral roll
      C.clay({ albedo: hex('#F3E8D6'), rim: 0.4 }),                                 // 7 paint pots
      C.clay({ albedo: hex('#FF8A76'), rim: 0.4 }),                                 // 8 hose
      C.clay({ albedo: hex('#F6ECDC'), rim: 0.4 }),                                 // 9 hose socket, lamp cups
      C.clay({ albedo: hex('#FF8A76'), rim: 0.4 }),                                 // 10-12 paint in the pots
      C.clay({ albedo: hex('#FFC845'), rim: 0.3 }),
      C.clay({ albedo: hex('#2AAFB8'), rim: 0.5 })
    ],
    map: inside,
    shadowMap(x, y, z){ return props(x, y, z, null, true) * 0.92; },
    albedoAt(x, y, z, mi, mat){
      if(mi !== 0) return mat.albedo;
      // the floor's colour runs part way up the coves, so the floor curves up into the walls
      if(y < FLOOR_UP){
        // a little darker toward the camera, so the eye settles on the turntable
        const k = smoothstep(TT_C[2] + 1, TT_C[2] + 6, z) * 0.12;
        return [FLOOR[0] * (1 - k), FLOOR[1] * (1 - k), FLOOR[2] * (1 - k)];
      }
      return y < BAND_Y ? BAND : CREAM;
    },
    background(dx, dy, dz){
      // only the porthole may be open; anything else a ray misses is wall
      const t = (CB - C.dot3(NB, I_CAM)) / (NB[0] * dx + NB[1] * dy + NB[2] * dz);
      const w = wallFrame(I_CAM[0] + dx * t, I_CAM[1] + dy * t, I_CAM[2] + dz * t, WIN_C);
      return len2(w[0], w[1]) < WIN_R + WIN_T ? null : [CREAM[0] * 0.8, CREAM[1] * 0.8, CREAM[2] * 0.8, 1];
    }
  };
}
/* Glow that never touches the porthole: bloom is added only where the
   picture is solid, so the open glass stays fully transparent. */
function glowSolid(buf, W, H, CH, radius, strength){
  const R = C.boxBlur(buf, W, H, CH, 4, radius), G = C.boxBlur(buf, W, H, CH, 5, radius), B = C.boxBlur(buf, W, H, CH, 6, radius);
  for(let i = 0; i < W * H; i++){
    const o = i * CH, a = buf[o + 3];
    buf[o] += R[i] * strength * a; buf[o + 1] += G[i] * strength * a; buf[o + 2] += B[i] * strength * a;
  }
}

function build(variant){
  if(variant === 'outside') return buildOutside();
  if(variant === 'inside') return buildInside();
  throw new Error('station: unknown variant ' + variant);
}
function post(buf, W, H, CH, variant){
  if(variant === 'outside'){ C.addGlow(buf, W, H, CH, W * 0.012, 0.35); C.addGlow(buf, W, H, CH, W * 0.04, 0.25); }
  if(variant === 'inside'){ glowSolid(buf, W, H, CH, W * 0.006, 0.5); glowSolid(buf, W, H, CH, W * 0.025, 0.35); }
}

/* The anchors the app positions things by, as fractions of each picture:
   the turntable's top-face centre (where the rocket stands), the
   porthole's open circle (its radius as a fraction of the picture's width)
   and the middle of the docking bay's door. The turntable and the bay are
   TURNTABLE_TOP and BAY_CENTER projected through their scene's camera, so
   a contract can do the same and hold the CSS to them; the porthole was
   measured from the render's open glass (WINDOW_CENTER, its drawn centre,
   projects within a pixel of it). */
const ANCHORS = {
  inside: { turntable: [0.38, 0.705], window: { x: 0.2336, y: 0.3371, r: 0.0788 } },
  outside: { bay: [0.4668, 0.6001] }
};
const TURNTABLE_TOP = TT_C;
module.exports = { build: build, post: post, ANCHORS: ANCHORS, TURNTABLE_TOP: TURNTABLE_TOP,
                   WINDOW_CENTER: WINDOW_CENTER, BAY_CENTER: BAY_CENTER };
