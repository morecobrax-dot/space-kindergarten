'use strict';
/* METEOR FIELD — a little landing place for meteors: three round clay
   rocks of different sizes, huddled in a shallow crater pressed into a
   low mound of warm stone, its rim pushed up where the clay was pressed.
   Seen from a raised camera, so the hollow shows. An invisible floor
   catches the mound's contact shadow.

   Variants:
     off  the rocks are cool grey
     on   the rocks glow warm orange from inside (brightest facing us and
          in a warm spot or two), warming the crater around them, with a
          gentle bloom

   Anchor (480×360): the cluster's centre on the crater floor is at
   52.3%, 53.6% (the crater's own centre is at 51.4%, 51.6%). */
const C = require('../clay.js');
const { len2, len3, smin, smax, hex, smoothstep, mix3, norm3 } = C;

const noise = C.makeNoise(71);

/* the crater: a low mound whose slope meets the ground, a bowl pressed
   into its top, and a raised rim around the bowl */
const MOUND_R = 1.36, MOUND_H = 0.26;   // base radius at the ground, height
const CAP_R = (MOUND_R * MOUND_R + MOUND_H * MOUND_H) / (2 * MOUND_H);   // a cap of this sphere
const BOWL_R = 1.9;
const FLOOR_Y = 0.07;                    // the bowl's lowest point
/* where the bowl breaks the mound's top: the raised lip sits exactly there */
const RIM_Y = MOUND_H - 0.04;
const RIM_R = Math.sqrt(BOWL_R * BOWL_R - (FLOOR_Y + BOWL_R - RIM_Y) * (FLOOR_Y + BOWL_R - RIM_Y));

/* Every distance here is scaled a little under 1: where a surface faces
   the key light head-on, the renderer's soft shadow reads a distance that
   grows as fast as the ray as a hit, and paints a false black patch. */
function mound(x, y, z){
  const a = Math.atan2(z, x);
  const k = 1 + 0.025 * Math.sin(3 * a + 0.7) + 0.015 * Math.sin(5 * a + 2.1);
  // a low cap of a big sphere (an exact distance: a flat ellipsoid's
  // approximate one banded the shading into rings)
  let d = Math.max(len3(x * k, y - (MOUND_H - CAP_R), z * k) - CAP_R, -0.06 - y);   // nothing under the ground
  // the raised rim, pushed up as the bowl was pressed
  d = smin(d, len2(len2(x, z) * k - RIM_R, y - RIM_Y) - 0.085, 0.16);
  // the bowl: a big sphere pressed in, its lowest point FLOOR_Y
  d = smax(d, -(len3(x, y - (FLOOR_Y + BOWL_R), z) - BOWL_R), 0.1);
  return d * 0.88;
}

/* three rocks: centre (x, z), radius; each rests on the crater floor */
const ROCKS = [[-0.26, -0.12, 0.4], [0.38, 0.04, 0.31], [-0.02, 0.44, 0.24]].map((r, i) => {
  const x = r[0], z = r[1], R = r[2];
  // the bowl surface under the rock, so it sits in the hollow
  const fy = FLOOR_Y + BOWL_R - Math.sqrt(BOWL_R * BOWL_R - x * x - z * z);
  return { c: [x, fy + R * 0.86, z], r: R, o: i * 7.3 };
});
function rock(x, y, z, k){
  const R = ROCKS[k];
  const px = x - R.c[0], py = y - R.c[1], pz = z - R.c[2];
  const l = len3(px, py, pz) || 1e-6;
  const ux = px / l, uy = py / l, uz = pz / l;
  const lumps = 0.07 * noise(ux * 1.6 + R.o, uy * 1.6, uz * 1.6) + 0.025 * noise(ux * 3.4, uy * 3.4 + R.o, uz * 3.4);
  return (l - R.r * (1 + lumps)) * 0.85;
}
/* a warm spot or two on each rock, where the glow shows through most */
const DENTS = [[0, [-0.5, 0.45, 0.74]], [0, [0.55, -0.1, 0.83]], [1, [-0.35, 0.3, 0.89]], [2, [0.4, 0.5, 0.77]]]
  .map(d => ({ k: d[0], n: norm3(d[1]) }));
function dentAt(x, y, z, k){
  const R = ROCKS[k];
  const px = x - R.c[0], py = y - R.c[1], pz = z - R.c[2];
  const l = len3(px, py, pz) || 1e-6;
  let f = 0;
  for(const D of DENTS){
    if(D.k !== k) continue;
    const c = (px * D.n[0] + py * D.n[1] + pz * D.n[2]) / l;
    f = Math.max(f, smoothstep(0.9, 0.97, c));
  }
  return f;
}

function build(variant){
  const on = variant === 'on';
  const W = 480, H = 360, D = 14, ELEV = 0.5;
  const frameW = 3.62, frameH = frameW * H / W;
  const target = [-0.05, 0.12, 0];
  const pos = [target[0], target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)];
  const view = norm3([pos[0], pos[1] - 0.3, pos[2]]);
  const STONE = hex('#B49E84');
  const ROCK = on ? hex('#FF9C45') : hex('#98979F');
  const CORE = [0.14, 0.055, 0.008], HOT = [0.42, 0.21, 0.04];
  const yGround = -0.03;
  return {
    width: W, height: H, scale: 1, seed: 71, spp: 3, aoRange: 0.08,
    camera: { pos: pos, target: target, fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.2, 0], radius: 1.95 },
    points: on ? [{ pos: [0.03, FLOOR_Y + 0.42, 0.14], color: [1.0, 0.66, 0.34], intensity: 2.0, radius: 0.6 }] : [],
    materials: [
      C.clay({ albedo: STONE, rim: 0.5 }),                                          // 0 crater mound
      C.clay(on ? { albedo: ROCK, rim: 0.4, emissive: [0, 0, 0] } : { albedo: ROCK }), // 1 rocks
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.1, 0.2], fadeRadius: 1.55 })                        // 2 shadow catcher
    ],
    map(x, y, z, rec){
      let d = mound(x, y, z), m = 0;
      for(let k = 0; k < ROCKS.length; k++){
        const r = rock(x, y, z, k);
        if(r < d + 0.04){ const b = smin(d, r, 0.04); if(r < d) m = 1; d = b; }
      }
      // a thin sheet, wide enough that its edge lies outside the bounds: a
      // solid floor would catch rays that enter the bounds below it
      const floor = Math.max(y - yGround, yGround - 0.03 - y, len2(x, z) - 2.6);
      if(floor < d){ d = floor; m = 2; }
      if(rec) rec.m = m;
      return d;
    },
    albedoAt(x, y, z, mi, mat){
      if(mi !== 0) return mat.albedo;
      // the crater floor is a touch darker, where the clay was pressed
      const q = len2(x, z);
      return mix3(STONE, hex('#A08A72'), smoothstep(0.85, 0.35, q) * 0.6);
    },
    emissiveAt: on ? function(x, y, z, mi, mat){
      if(mi !== 1) return mat.emissive;
      // which rock: the nearest centre
      let k = 0, best = 1e9;
      for(let i = 0; i < ROCKS.length; i++){
        const c = ROCKS[i].c, dd = len3(x - c[0], y - c[1], z - c[2]) - ROCKS[i].r;
        if(dd < best){ best = dd; k = i; }
      }
      const c = ROCKS[k].c, l = len3(x - c[0], y - c[1], z - c[2]) || 1e-6;
      const facing = Math.max(0, ((x - c[0]) * view[0] + (y - c[1]) * view[1] + (z - c[2]) * view[2]) / l);
      const core = facing * facing, f = dentAt(x, y, z, k);
      return [CORE[0] * core + HOT[0] * f, CORE[1] * core + HOT[1] * f, CORE[2] * core + HOT[2] * f];
    } : null
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.02, 0.3); C.addGlow(buf, W, H, CH, W * 0.06, 0.2); }
}
module.exports = { build: build, post: post };
