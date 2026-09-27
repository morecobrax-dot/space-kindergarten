'use strict';
/* HORIZON — the world you are standing on. Every destination is shown the
   same way: the top of a big clay sphere filling the bottom of the screen,
   seen from just above it, its curve reading as a horizon against space.
   Only part of it is visible, so it feels enormous.

   One sphere (radius 1) and one camera for every world; a world changes
   only its clay (colours, one signature surface feature), its clouds or
   props, and the colour of the glow along its edge. That shared grammar is
   the planet system: a child always knows where the ground is.

   Framing (2400×780): the crest of the curve sits 18% down from the top;
   the edges drop to about half the frame height. The app anchors the
   rocket's launch pad and each world's markers to points on this surface,
   projected from the same camera (see anchorAt()). */
const C = require('../clay.js');
const { len3, norm3, smoothstep, hex, mix3, smin, clamp } = C;

const W = 2400, H = 780;
const FRAME_W = 0.75;                 // world units across, at the sphere
const FRAME_H = FRAME_W * H / W;
const CREST = 0.18;                   // where the crest of the curve sits
const FRAME_TOP = 1 + CREST * FRAME_H;
const CENTER_Y = FRAME_TOP - FRAME_H / 2;
const D = 30;                         // a long lens: almost no perspective

/* The surface direction under an image point (fractions of the frame). */
function dirAt(fx, fy){
  const x = (fx - 0.5) * FRAME_W, y = FRAME_TOP - fy * FRAME_H;
  const z2 = 1 - x * x - y * y;
  return norm3([x, y, z2 > 0 ? Math.sqrt(z2) : 0]);
}

/* ---------- the worlds ---------- */
const noise = C.makeNoise(211);

function blobField(u, blobs, wobble){
  let m = 0;
  const wob = wobble ? wobble * noise(u[0] * 9, u[1] * 9 + 2, u[2] * 9) : 0;
  for(const b of blobs){
    const c = len3(u[0] - b.d[0], u[1] - b.d[1], u[2] - b.d[2]);
    const v = smoothstep(b.r + b.e, b.r - b.e, c + wob);
    if(v > m) m = v;
  }
  return m;
}
function dimples(u, list){
  let h = 0, floor = 0;
  for(const k of list){
    const c = len3(u[0] - k.d[0], u[1] - k.d[1], u[2] - k.d[2]);
    if(c > k.r * 1.7) continue;
    const t = c / k.r;
    const bowl = smoothstep(1.05, 0.15, t);
    const lip = Math.exp(-((t - 1.03) / 0.28) * ((t - 1.03) / 0.28));
    h += -k.depth * bowl + k.depth * 0.32 * lip;
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}

/* Continents are friendly cartoon shapes: a few overlapping round lumps of
   clay each, pressed onto the sea. The first holds the launch pad. */
const EARTH_LAND = [
  { d: dirAt(0.28, 0.56), r: 0.081, e: 0.016 }, { d: dirAt(0.19, 0.5), r: 0.061, e: 0.016 },
  { d: dirAt(0.36, 0.66), r: 0.061, e: 0.016 }, { d: dirAt(0.12, 0.62), r: 0.047, e: 0.016 },
  { d: dirAt(0.74, 0.6), r: 0.068, e: 0.016 }, { d: dirAt(0.82, 0.68), r: 0.054, e: 0.016 },
  { d: dirAt(0.67, 0.7), r: 0.041, e: 0.016 }, { d: dirAt(0.93, 0.46), r: 0.038, e: 0.016 },
  { d: dirAt(0.52, 0.98), r: 0.081, e: 0.016 }, { d: dirAt(0.6, 1.02), r: 0.068, e: 0.016 }
];
const EARTH_CLOUDS = [
  { at: [0.06, 0.36], s: 0.02 }, { at: [0.57, 0.24], s: 0.017 },
  { at: [0.9, 0.36], s: 0.018 }, { at: [0.47, 0.74], s: 0.016 }
].map(c => {
  const n = dirAt(c.at[0], c.at[1]);
  const up = [0, 1, 0];
  const t1 = norm3(C.cross3(up, n)), t2 = C.cross3(n, t1);
  const alt = 1 + c.s * 1.25;
  return { n: n, t1: t1, t2: t2, c: [n[0] * alt, n[1] * alt, n[2] * alt], s: c.s };
});
const PUFFS = [[0, 0, 0, 1.0], [-1.1, -0.15, 0, 0.75], [1.05, -0.1, 0, 0.8], [0.3, 0.5, 0, 0.7]];
function clouds(x, y, z){
  let d = 1e9;
  for(const K of EARTH_CLOUDS){
    const qx = x - K.c[0], qy = y - K.c[1], qz = z - K.c[2];
    const far = len3(qx, qy, qz) - 2.3 * K.s;
    if(far > 0.02){ if(far < d) d = far; continue; }
    const a = (qx * K.t1[0] + qy * K.t1[1] + qz * K.t1[2]) / K.s;
    const b = (qx * K.t2[0] + qy * K.t2[1] + qz * K.t2[2]) / K.s;
    const h = (qx * K.n[0] + qy * K.n[1] + qz * K.n[2]) / (K.s * 0.6);
    let dc = 1e9;
    PUFFS.forEach((P, j) => { const ds = len3(a - P[0], b - P[1], h - P[2]) - P[3]; dc = j === 0 ? ds : smin(dc, ds, 0.4); });
    d = Math.min(d, dc * K.s * 0.6);
  }
  return d;
}

/* The launch pad on Earth: a round clay platform with warm lamps, wide
   enough for the rocket's fins to stand on it. The app stands the rocket
   on the centre of its top (PAD_TOP: a radius, along PAD). */
const PAD = dirAt(0.3, 0.56);
const PAD_T1 = norm3(C.cross3([0, 0, 1], PAD)), PAD_T2 = C.cross3(PAD, PAD_T1);
const PAD_R = 0.052, PAD_H = 0.006;
const PAD_TOP = 1 + PAD_H * 1.6;
function padLocal(x, y, z){
  const qx = x - PAD[0], qy = y - PAD[1], qz = z - PAD[2];
  return [qx * PAD_T1[0] + qy * PAD_T1[1] + qz * PAD_T1[2], qx * PAD[0] + qy * PAD[1] + qz * PAD[2], qx * PAD_T2[0] + qy * PAD_T2[1] + qz * PAD_T2[2]];
}
function pad(x, y, z, rec){
  const p = padLocal(x, y, z);
  let d = C.SD.roundCylinder(p[0], p[1] - PAD_H * 0.6, p[2], PAD_R, PAD_H, PAD_H * 0.8);
  let m = 4;
  for(let i = 0; i < 6; i++){
    const a = (i + 0.5) / 6 * Math.PI * 2;
    const l = C.SD.sphere(p[0] - Math.cos(a) * PAD_R * 0.92, p[1] - PAD_H * 1.5, p[2] - Math.sin(a) * PAD_R * 0.92, PAD_H * 0.9);
    if(l < d){ d = l; m = 5; }
  }
  if(rec) rec.m = m;
  return d;
}

const MOON_CRATERS = [
  { d: dirAt(0.2, 0.55), r: 0.05, depth: 0.008 }, { d: dirAt(0.58, 0.44), r: 0.035, depth: 0.006 },
  { d: dirAt(0.44, 0.78), r: 0.06, depth: 0.009 }, { d: dirAt(0.83, 0.62), r: 0.045, depth: 0.007 },
  { d: dirAt(0.07, 0.8), r: 0.04, depth: 0.006 }, { d: dirAt(0.68, 0.9), r: 0.03, depth: 0.005 },
  { d: dirAt(0.33, 0.36), r: 0.022, depth: 0.004 }, { d: dirAt(0.94, 0.86), r: 0.035, depth: 0.006 }
];
const MERCURY_DIMPLES = [
  { d: dirAt(0.12, 0.5), r: 0.03, depth: 0.0028 }, { d: dirAt(0.22, 0.72), r: 0.045, depth: 0.0038 },
  { d: dirAt(0.5, 0.52), r: 0.025, depth: 0.0022 }, { d: dirAt(0.55, 0.85), r: 0.05, depth: 0.004 },
  { d: dirAt(0.8, 0.46), r: 0.03, depth: 0.0026 }, { d: dirAt(0.9, 0.75), r: 0.04, depth: 0.0034 },
  { d: dirAt(0.38, 0.62), r: 0.018, depth: 0.0016 }, { d: dirAt(0.66, 0.66), r: 0.02, depth: 0.0018 },
  { d: dirAt(0.04, 0.9), r: 0.035, depth: 0.003 }, { d: dirAt(0.33, 0.95), r: 0.03, depth: 0.0026 }
];
/* Mars, a red clay playground: a few wide, soft thumb-press craters (a
   flat floor, a rounded wall, a rolled rim) and a few friendly huddles of
   smooth round stones in deeper rust clay. Its relief is as low as
   Mercury's, so what stands on the ground stays on it, and every feature
   keeps clear of where the markers stand (37%, 50% and 58%, 55%) and the
   rocket lands (about 76%, 45%). A stone is a gentle dome, no taller than
   0.3 of its radius and 0.0038 in all: on a steeper slope facing the key
   light, or above the height where ground() switches to its unscaled far
   bound, the distance grows faster than a shadow ray and the soft shadow
   paints a black patch there. */
const MARS_CRATERS = [
  { d: dirAt(0.13, 0.64), r: 0.05, depth: 0.0055 }, { d: dirAt(0.47, 0.83), r: 0.058, depth: 0.006 },
  { d: dirAt(0.9, 0.67), r: 0.045, depth: 0.005 }, { d: dirAt(0.215, 0.41), r: 0.02, depth: 0.0028 },
  { d: dirAt(0.655, 0.36), r: 0.018, depth: 0.0025 }, { d: dirAt(0.935, 0.515), r: 0.022, depth: 0.003 },
  { d: dirAt(0.29, 0.94), r: 0.034, depth: 0.004 }
];
/* stones: [across, down, size]; big, middling and small (radius, height) */
const STONE = { big: [0.016, 0.0038], mid: [0.012, 0.0029], small: [0.0078, 0.0019] };
const MARS_ROCKS = [
  [0.075, 0.47, 'big'], [0.108, 0.5, 'mid'], [0.052, 0.505, 'small'],
  [0.695, 0.68, 'big'], [0.73, 0.71, 'mid'], [0.668, 0.715, 'small'],
  [0.18, 0.865, 'big'], [0.222, 0.9, 'mid'], [0.148, 0.905, 'small'],
  [0.5, 0.365, 'mid'], [0.528, 0.38, 'small'],
  [0.975, 0.578, 'mid'], [0.996, 0.6, 'small']
].map(p => ({ d: dirAt(p[0], p[1]), r: STONE[p[2]][0], h: STONE[p[2]][1] }));
const MARS = { clay: hex('#C8673A'), light: hex('#D27646'), floor: hex('#A8472F'), rock: hex('#AE5130'), rockTop: hex('#C0613A') };
/* a thumb-press crater: [height, how deep in the floor] */
function thumbs(u, list){
  let h = 0, floor = 0;
  for(const k of list){
    const c = len3(u[0] - k.d[0], u[1] - k.d[1], u[2] - k.d[2]);
    if(c > k.r * 1.6) continue;
    const t = c / k.r;
    const bowl = smoothstep(1.0, 0.5, t);
    h += -k.depth * bowl + k.depth * 0.42 * Math.exp(-((t - 1.02) / 0.2) * ((t - 1.02) / 0.2));
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}
/* a smooth round stone, half sunk in the clay: a gentle dome. [height, how high up the stone] */
function rocks(u, list){
  let h = 0, up = 0;
  for(const k of list){
    const c = len3(u[0] - k.d[0], u[1] - k.d[1], u[2] - k.d[2]);
    if(c > k.r) continue;
    const v = k.h * (0.5 + 0.5 * Math.cos(Math.PI * c / k.r));
    if(v > h){ h = v; up = v / k.h; }
  }
  return [h, up];
}

const WORLDS = {
  earth: {
    halo: hex('#5BC4FF'), haloStrength: 0.5,
    height(u){
      // low relief with soft bevels: seen almost edge-on from the surface,
      // tall slabs showed their walls, not their tops
      const land = blobField(u, EARTH_LAND, 0.006);
      return 0.0034 * land + 0.0006 * noise(u[0] * 12, u[1] * 12 + 3, u[2] * 12);
    },
    albedo(u){
      const land = blobField(u, EARTH_LAND, 0.006);
      const shore = blobField(u, EARTH_LAND.map(b => ({ d: b.d, r: b.r + 0.016, e: 0.012 })), 0.006);
      const sea = mix3(hex('#2F7FCF'), hex('#52A8E6'), shore * 0.55);
      return mix3(sea, hex('#7CCB55'), smoothstep(0.25, 0.75, land));
    }
  },
  moon: {
    halo: hex('#8FA8FF'), haloStrength: 0.34,
    height(u){ return dimples(u, MOON_CRATERS)[0] + 0.0008 * noise(u[0] * 12, u[1] * 12, u[2] * 12); },
    albedo(u){ return mix3(hex('#A59CC4'), hex('#8479AB'), dimples(u, MOON_CRATERS)[1] * 0.8); }
  },
  mercury: {
    halo: hex('#FFB77A'), haloStrength: 0.36,
    height(u){ return dimples(u, MERCURY_DIMPLES)[0] * 1.8 + 0.0008 * noise(u[0] * 12 + 4, u[1] * 12, u[2] * 12); },
    albedo(u){
      const f = dimples(u, MERCURY_DIMPLES)[1];
      const m = 0.5 + 0.5 * noise(u[0] * 12 + 7, u[1] * 12, u[2] * 12);
      return mix3(mix3(hex('#B48E70'), hex('#C49E7E'), m * 0.4), hex('#8E6D56'), f * 0.8);
    }
  },
  mars: {
    halo: hex('#FF8A55'), haloStrength: 0.62,
    height(u){ return thumbs(u, MARS_CRATERS)[0] + rocks(u, MARS_ROCKS)[0] + 0.0007 * noise(u[0] * 12 - 3, u[1] * 12, u[2] * 12); },
    albedo(u){
      const f = thumbs(u, MARS_CRATERS)[1], k = rocks(u, MARS_ROCKS)[1];
      const m = 0.5 + 0.5 * noise(u[0] * 12 + 7, u[1] * 12, u[2] * 12);
      const ground = mix3(mix3(MARS.clay, MARS.light, m * 0.4), MARS.floor, f * 0.7);
      return mix3(ground, mix3(MARS.rock, MARS.rockTop, smoothstep(0.5, 0.95, k)), smoothstep(0.04, 0.2, k));
    }
  }
};

function build(variant){
  const w = WORLDS[variant] || WORLDS.earth;
  const earth = variant === 'earth';
  function ground(x, y, z){
    const r = len3(x, y, z);
    if(r > 1.012) return r - 1.006;
    const inv = 1 / r;
    return (r - 1 - w.height([x * inv, y * inv, z * inv])) * 0.8;
  }
  return {
    width: W, height: H, scale: 0.05, seed: 211, spp: 2, aoRange: 0.25, maxSteps: 260, stepScale: 0.85,
    fillsFrame: true,
    camera: { pos: [0, CENTER_Y, D], target: [0, CENTER_Y, 0], fov: 2 * Math.atan((FRAME_H / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.03 },
    materials: [
      C.clay({ albedo: [0.5, 0.5, 0.5], stroke: 0, grain: 0, spec: 0.03 }),         // 0 ground: clean
      C.clay({ albedo: hex('#F4F0E8'), sss: 0.3, sheen: 0.08, grain: 0, stroke: 0 }), // 1 clouds
      C.clay({}), C.clay({}),
      C.clay({ albedo: hex('#A99FC6'), grain: 0, stroke: 0 }),                    // 4 pad
      C.clay({ albedo: hex('#FFE3A0'), grain: 0, stroke: 0, emissive: [1.6, 1.15, 0.5] }) // 5 pad lamps
    ],
    shadowMap: earth ? function(x, y, z){ return Math.min(ground(x, y, z), clouds(x, y, z), pad(x, y, z, null)); } : ground,
    map(x, y, z, rec){
      let d = ground(x, y, z), m = 0;
      if(earth){
        const dc = clouds(x, y, z);
        if(dc < d){ d = dc; m = 1; }
        const dp = pad(x, y, z, null);
        if(dp < d){ d = dp; if(rec) pad(x, y, z, rec); if(rec) return d; }
      }
      if(rec) rec.m = m;
      return d;
    },
    albedoAt(x, y, z, mi, mat){
      if(mi !== 0) return mat.albedo;
      const r = len3(x, y, z);
      return w.albedo([x / r, y / r, z / r]);
    }
  };
}

/* The glow along the edge: an atmosphere for Earth, a rim for the others. */
function post(buf, Wd, Hd, CH, variant){
  const w = WORLDS[variant] || WORLDS.earth;
  C.addHalo(buf, Wd, Hd, CH, { radius: Hd * 0.035, strength: w.haloStrength, color: w.halo, shiftY: -0.014 });
  if(variant === 'earth') C.addGlow(buf, Wd, Hd, CH, Wd * 0.004, 0.5);
}

/* Where an image point is, and where a surface direction lands in the
   image — for the app's anchors (the pad, the markers). */
function anchorAt(u){
  return [(u[0] / FRAME_W + 0.5) * 100, (FRAME_TOP - u[1]) / FRAME_H * 100];
}
/* Whether an image point (fractions of the frame) is on the planet rather
   than the sky above it: what a marker's foot must be. */
function groundAt(fx, fy){
  const x = (fx - 0.5) * FRAME_W, y = FRAME_TOP - fy * FRAME_H;
  return 1 - x * x - y * y > 0;
}

module.exports = { build: build, post: post, dirAt: dirAt, anchorAt: anchorAt, groundAt: groundAt,
                   PAD: PAD, PAD_H: PAD_H, PAD_TOP: PAD_TOP, CREST: CREST };
