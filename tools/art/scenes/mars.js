'use strict';
/* MARS — the third destination, seen from afar: a warm coral clay planet,
   a red clay playground. One big soft crater pressed in low on its face,
   a small cream polar cap dolloped on top, a few soft craters and one
   deep-red patch of clay pressed on: enough to read as Mars at 60 px,
   never barren. The same framing as Mercury (a sphere filling 84% of a
   square), so it travels and swaps the same way.

   Variants:
     dim  waiting: quiet, cooler, a soft coral edge glow
     lit  restored: warm light in its hollows and a warm sunset halo */
const C = require('../clay.js');
const { len3, norm3, cross3, smoothstep, hex, mix3 } = C;

const noise = C.makeNoise(331);

/* soft craters: direction, size (chord), depth. The first is the big one.
   Each is a thumb press: a flat floor, a rounded wall and a rolled rim. */
const CRATERS = [
  [[0.26, -0.3, 0.92], 0.34, 0.045], [[-0.5, 0.3, 0.81], 0.14, 0.024], [[-0.6, -0.48, 0.64], 0.15, 0.026],
  [[0.72, 0.26, 0.64], 0.12, 0.022], [[0.04, 0.34, 0.94], 0.085, 0.017], [[-0.2, -0.74, 0.64], 0.1, 0.02],
  [[0.8, -0.42, 0.43], 0.11, 0.02]
].map(k => ({ d: norm3(k[0]), r: k[1], depth: k[2] }));

/* the polar cap: tipped toward us, so it sits on the face and reads from
   the front, clear of the outline (on the rim it read as a flat cut). A
   lobed edge, like icing, in its own frame. */
const CAP = norm3([0.08, 0.8, 0.6]), CAP_R = 0.28, CAP_H = 0.026;
const CAP_T1 = norm3(cross3(CAP, [0, 0, 1])), CAP_T2 = cross3(CAP_T1, CAP);
/* one deep-red patch of clay, pressed on over the left of the face */
const PATCH = norm3([-0.6, -0.06, 0.8]), PATCH_R = 0.24;

function craterAt(u){
  let h = 0, floor = 0;
  for(const K of CRATERS){
    const c = len3(u[0] - K.d[0], u[1] - K.d[1], u[2] - K.d[2]);
    if(c > K.r * 1.6) continue;
    const t = c / K.r;
    const bowl = smoothstep(1.0, 0.5, t);
    const lip = Math.exp(-((t - 1.02) / 0.2) * ((t - 1.02) / 0.2));
    h += -K.depth * bowl + K.depth * 0.42 * lip;
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}
/* the cap at a point: [how much covers it, its height there]. A soft,
   lobed edge, and a gentle dome, so the key light gives it a form */
function capAt(u){
  const qx = u[0] - CAP[0], qy = u[1] - CAP[1], qz = u[2] - CAP[2];
  const c = len3(qx, qy, qz);
  if(c > CAP_R * 1.4) return [0, 0];
  const a = Math.atan2(qx * CAP_T2[0] + qy * CAP_T2[1] + qz * CAP_T2[2], qx * CAP_T1[0] + qy * CAP_T1[1] + qz * CAP_T1[2]);
  const edge = CAP_R * (1 + 0.07 * Math.cos(6 * a + 0.5));
  const cover = smoothstep(edge + 0.025, edge - 0.025, c);
  const t = Math.min(1, c / edge);
  return [cover, CAP_H * cover * (0.5 + 0.5 * (1 - t * t))];
}
function patchAt(u){
  const c = len3(u[0] - PATCH[0], u[1] - PATCH[1], u[2] - PATCH[2]);
  if(c > PATCH_R * 1.5) return 0;
  const wob = 0.045 * noise(u[0] * 3.2 - 4, u[1] * 3.2, u[2] * 3.2);
  return smoothstep(PATCH_R + 0.022, PATCH_R - 0.022, c + wob);
}
function surface(x, y, z){
  const r = len3(x, y, z);
  // scaled like the near field: an unscaled far field doubles the distance
  // as a shadow ray leaves the planet facing the key light, and the soft
  // shadow reads that as a hit (a black speck on the limb). 0.75, as the
  // Moon: at 0.8 a crater wall facing the key still grew a dark scratch.
  if(r > 1.06) return (r - 1.03) * 0.75;
  const inv = 1 / r, u = [x * inv, y * inv, z * inv];
  // the cap is a dollop of cream clay laid on top; the patch a thin layer
  const h = craterAt(u)[0] + capAt(u)[1] + 0.003 * patchAt(u) + 0.006 * noise(u[0] * 2.5, u[1] * 2.5, u[2] * 2.5);
  return (r - 1 - h) * 0.75;
}

const CORAL = hex('#DB7856'), CORAL_LIGHT = hex('#E78D69'), DEEP = hex('#C65743'), FLOOR = hex('#B7503B'),
      CREAM = hex('#E9D2BA'), WARM = hex('#FF8A56');

function build(variant){
  const lit = variant === 'lit';
  const W = 560, H = 560, D = 6.2;
  const tanHalf = (1 / Math.sqrt(D * D - 1)) / 0.84;
  return {
    width: W, height: H, scale: 1, seed: 331, spp: 3,
    keyScale: lit ? 1.05 : 0.8,
    camera: { pos: [0, 0.1, D], target: [0, 0, 0], fov: 2 * Math.atan(tanHalf) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.1 },
    materials: [C.clay({ albedo: CORAL, rim: 0.5 })],
    map(x, y, z, rec){ if(rec) rec.m = 0; return surface(x, y, z); },
    // shadows from an exact sphere just under the deepest crater floor: the
    // soft shadow run on the displaced (and scaled) surface banded the
    // penumbra into terraces; the craters keep their form from the light
    shadowMap(x, y, z){ return len3(x, y, z) - 0.94; },
    albedoAt(x, y, z){
      const r = len3(x, y, z), u = [x / r, y / r, z / r];
      const f = craterAt(u)[1];
      const m = 0.5 + 0.5 * noise(u[0] * 4 + 7, u[1] * 4, u[2] * 4);
      let a = mix3(CORAL, CORAL_LIGHT, m * 0.4);
      a = mix3(a, DEEP, patchAt(u) * 0.55);
      a = mix3(a, FLOOR, f * 0.7);
      return mix3(a, CREAM, capAt(u)[0]);
    },
    emissiveAt(x, y, z){
      if(!lit) return null;
      const r = len3(x, y, z);
      const f = craterAt([x / r, y / r, z / r])[1];
      // a warm, saturated glow: a yellower one turned brown where the floor is in shade
      return f > 0.05 ? [WARM[0] * 0.2 * f, WARM[1] * 0.2 * f, WARM[2] * 0.2 * f] : null;
    }
  };
}
function post(buf, W, H, CH, variant){
  const lit = variant === 'lit';
  C.addDiskHalo(buf, W, H, CH, { cx: 0.5, cy: 0.5, r: 0.42, width: 0.055, strength: lit ? 0.62 : 0.3,
                                 color: lit ? hex('#FFB48A') : hex('#E8977C'), towardX: -0.6, towardY: -0.6 });
}
module.exports = { build: build, post: post };
