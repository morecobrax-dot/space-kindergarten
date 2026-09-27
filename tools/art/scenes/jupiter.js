'use strict';
/* JUPITER — the fourth destination, seen from afar: a big, warm clay
   world of rolled bands. Coils of cream, amber and warm orange clay lie
   side by side round the ball like snakes of plasticine pressed together,
   with one thin coil of warm brown near the pole, and one big friendly
   storm where the wide southern belt meets the cream zone above it: a
   round lump of red-orange clay coiled like a cinnamon roll, in a collar
   of cream. Two small swirls ride a belt and a zone. Smooth and cloudy,
   never cratered: the bands and the round spot are how it reads as
   Jupiter at 60 px, and never as Mars. The same framing as Mercury and
   Mars (a sphere filling 84% of a square), so it travels and swaps the
   same way. Its clay is the horizon's (horizon.js `jupiter`), mixed to
   render as the same colours under this closer, frontal light.

   Variants:
     dim  waiting: quiet, cooler, a soft amber edge glow
     lit  restored: a faint warm glow in its belts and in the storm, and a
          warm halo */
const C = require('../clay.js');
const { len3, norm3, cross3, smoothstep, hex, mix3, clamp } = C;

/* the spin axis, tipped a little to the right and toward us, so the bands
   curve round the ball instead of lying flat across it */
const AXIS = norm3([0.12, 1, 0.2]);
const E1 = norm3(cross3(AXIS, [0, 0, 1])), E2 = cross3(E1, AXIS);

/* the seams between the coils, south to north: where each lies (the sine
   of its latitude), and how far and how often it wanders east to west */
const SEAMS = [
  { s: -0.76, a: 0.012, n: 3, p: 0.4 }, { s: -0.6, a: 0.014, n: 2, p: 2.1 }, { s: -0.2, a: 0.016, n: 3, p: 4.0 },
  { s: 0.1, a: 0.014, n: 2, p: 1.2 }, { s: 0.33, a: 0.012, n: 3, p: 5.1 }, { s: 0.47, a: 0.01, n: 4, p: 2.8 },
  { s: 0.61, a: 0.01, n: 3, p: 0.9 }, { s: 0.75, a: 0.01, n: 2, p: 3.6 }, { s: 0.87, a: 0.008, n: 3, p: 1.7 }
];
const CREAM = hex('#E6C994'), CREAM_WARM = hex('#DFB676'), AMBER = hex('#E39B49'), ORANGE = hex('#DC803D'),
      AMBER_ORANGE = hex('#DF8E43'), BROWN = hex('#B97C40'), POLE = hex('#CA9055'),
      SPOT = hex('#CF5327'), SPOT_LIGHT = hex('#D96F3C'), COLLAR = hex('#F0D2A1'), SWIRL = hex('#F5DAAC'),
      AMBER_LIGHT = hex('#E8AC62'), WARM = hex('#FF9A52');
/* each coil's clay, south to north, and how much of a belt it is (a
   belt glows a little once the planet is restored) */
const TONES = [POLE, CREAM_WARM, ORANGE, CREAM, AMBER_ORANGE, CREAM, AMBER, CREAM_WARM, BROWN, POLE];
const BELT = [0.4, 0, 1, 0, 1, 0, 0.8, 0, 0.6, 0.4];
/* a coil's roll: round on top, a soft groove at each seam, with the slope
   there kept finite (a bare square root is infinitely steep at a seam) */
const ROLL = 0.013;
function roll(t){ return (Math.sqrt(Math.sin(Math.PI * t) + 0.02) - 0.1414) / 0.8686; }

/* a swirl: where, its size along and across the coils, how many turns,
   how high, its clay, and whether it sits in a cream collar */
function swirl(d, rx, ry, turns, h, tone, light, collar){
  const t1 = norm3(cross3(AXIS, d)), t2 = cross3(d, t1);
  return { d: d, t1: t1, t2: t2, rx: rx, ry: ry, turns: turns, h: h, tone: tone, light: light, collar: collar };
}
const STORM = swirl(norm3([0.2, -0.4, 0.9]), 0.27, 0.2, 2.2, 0.02, SPOT, SPOT_LIGHT, true);
const SWIRLS = [swirl(norm3([-0.45, 0.3, 0.84]), 0.1, 0.076, 1.5, 0.008, AMBER, AMBER_LIGHT, false),
                swirl(norm3([-0.5, -0.46, 0.73]), 0.1, 0.076, 1.5, 0.008, CREAM, SWIRL, false)];

/* the coils at a point: [roll height, colour, how much of a belt] */
function bandsAt(u){
  const s = u[0] * AXIS[0] + u[1] * AXIS[1] + u[2] * AXIS[2];
  const lon = Math.atan2(u[0] * E1[0] + u[1] * E1[1] + u[2] * E1[2], u[0] * E2[0] + u[1] * E2[1] + u[2] * E2[2]);
  let found = false, lo = -1.02, hi = 1.02, col = TONES[0], belt = BELT[0];
  for(let k = 0; k < SEAMS.length; k++){
    const K = SEAMS[k], e = K.s + K.a * Math.sin(K.n * lon + K.p);
    if(s < e && !found){ found = true; hi = e; }
    if(s >= e) lo = e;
    // crisp seams, as coils of different clay pressed together
    const w = smoothstep(e - 0.006, e + 0.006, s);
    col = mix3(col, TONES[k + 1], w);
    belt += (BELT[k + 1] - belt) * w;
  }
  return [ROLL * roll(clamp((s - lo) / (hi - lo), 0, 1)), col, belt];
}
/* a swirl at a point: [height, how far out (1 at the coil's edge), coil, inside] or null.
   The coil is a lump of clay wound from the middle out, its edge a rounded
   shoulder; the storm's collar is a fat ring of cream clay round it */
function swirlAt(u, S){
  const qx = u[0] - S.d[0], qy = u[1] - S.d[1], qz = u[2] - S.d[2];
  const a = (qx * S.t1[0] + qy * S.t1[1] + qz * S.t1[2]) / S.rx;
  const b = (qx * S.t2[0] + qy * S.t2[1] + qz * S.t2[2]) / S.ry;
  const rho = Math.sqrt(a * a + b * b);
  if(rho > 1.45) return null;
  let w = rho * S.turns - Math.atan2(b, a) / (Math.PI * 2);
  w -= Math.floor(w);
  const coil = Math.sin(Math.PI * w) * smoothstep(0.02, 0.2, rho);
  const inside = smoothstep(1.0, 0.985, rho);
  const lump = smoothstep(1.0, 0.8, rho) * (0.75 + 0.25 * (1 - rho * rho)) * (0.62 + 0.38 * coil);
  const collar = S.collar && rho > 1 ? Math.pow(Math.sin(Math.PI * clamp((rho - 1) / 0.34, 0, 1)), 0.8) : 0;
  return [S.h * (lump + 0.55 * collar), rho, coil, inside];
}
function reliefAt(u){
  let h = bandsAt(u)[0];
  // the storm and the swirls are pressed on in place of the coil beneath
  const st = swirlAt(u, STORM);
  if(st) h = h * smoothstep(1.3, 1.45, st[1]) + st[0];
  for(const S of SWIRLS){ const sw = swirlAt(u, S); if(sw) h = h * smoothstep(0.9, 1.2, sw[1]) + sw[0]; }
  return h;
}
function surface(x, y, z){
  const r = len3(x, y, z);
  // scaled like the near field (see mars.js): an unscaled far field
  // doubles the distance as a shadow ray leaves the planet
  if(r > 1.06) return (r - 1.03) * 0.75;
  const inv = 1 / r, u = [x * inv, y * inv, z * inv];
  return (r - 1 - reliefAt(u)) * 0.75;
}

function build(variant){
  const lit = variant === 'lit';
  const W = 560, H = 560, D = 6.2;
  const tanHalf = (1 / Math.sqrt(D * D - 1)) / 0.84;
  return {
    width: W, height: H, scale: 1, seed: 401, spp: 3,
    keyScale: lit ? 1.05 : 0.8,
    camera: { pos: [0, 0.1, D], target: [0, 0, 0], fov: 2 * Math.atan(tanHalf) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.1 },
    materials: [C.clay({ albedo: CREAM, rim: 0.5 })],
    map(x, y, z, rec){ if(rec) rec.m = 0; return surface(x, y, z); },
    // shadows from an exact sphere just under the seams: the coils and the
    // storm keep their form from the light, and the penumbra stays smooth
    shadowMap(x, y, z){ return len3(x, y, z) - 0.99; },
    albedoAt(x, y, z){
      const r = len3(x, y, z), u = [x / r, y / r, z / r];
      let a = bandsAt(u)[1];
      const st = swirlAt(u, STORM);
      if(st){
        a = mix3(a, COLLAR, smoothstep(1.36, 1.32, st[1]));
        a = mix3(a, mix3(STORM.tone, STORM.light, st[2] * 0.6), st[3]);
      }
      for(const S of SWIRLS){ const sw = swirlAt(u, S); if(sw) a = mix3(a, mix3(S.tone, S.light, sw[2]), sw[3]); }
      return a;
    },
    emissiveAt(x, y, z){
      if(!lit) return null;
      const r = len3(x, y, z), u = [x / r, y / r, z / r];
      let g = 0.1 * bandsAt(u)[2];
      const st = swirlAt(u, STORM);
      if(st) g = g * smoothstep(1.0, 1.36, st[1]) + 0.16 * st[3];
      return g > 0.004 ? [WARM[0] * g, WARM[1] * g, WARM[2] * g] : null;
    }
  };
}
function post(buf, W, H, CH, variant){
  const lit = variant === 'lit';
  C.addDiskHalo(buf, W, H, CH, { cx: 0.5, cy: 0.5, r: 0.42, width: 0.055, strength: lit ? 0.62 : 0.3,
                                 color: lit ? hex('#FFC58A') : hex('#E8AE80'), towardX: -0.6, towardY: -0.6 });
}
module.exports = { build: build, post: post };
