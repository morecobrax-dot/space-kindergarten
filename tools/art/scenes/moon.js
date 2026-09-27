'use strict';
/* MOON — the first destination. Soft lavender-grey clay with craters
   pressed in by a fingertip, each with a little raised lip. A tiny beacon
   stands on its upper right: dark while the Moon waits, warm once a child
   has relit it.

   Variants:
     dim  cool and quiet: the lamp is unlit, the halo is cool lavender
     lit  the lamp glows, warm light spills over the nearby craters, the
          crater floors hold a faint warmth, and the halo turns warm */
const C = require('../clay.js');
const { len3, norm3, smoothstep, hex, mix3 } = C;

const noise = C.makeNoise(31);

/* Craters: direction, size (chord), depth, lip. Kept off the beacon's spot. */
const CRATERS = [
  [[-0.42, 0.30, 0.86], 0.30, 0.050, 0.016],
  [[0.20, -0.30, 0.93], 0.22, 0.042, 0.014],
  [[-0.62, -0.38, 0.68], 0.20, 0.040, 0.013],
  [[0.62, -0.02, 0.78], 0.16, 0.034, 0.012],
  [[-0.08, 0.72, 0.69], 0.15, 0.032, 0.011],
  [[0.38, -0.72, 0.58], 0.14, 0.030, 0.011],
  [[-0.18, -0.02, 0.98], 0.10, 0.026, 0.010],
  [[-0.86, 0.12, 0.49], 0.17, 0.034, 0.012],
  [[0.86, 0.36, 0.36], 0.14, 0.030, 0.011],
  [[-0.35, -0.80, 0.49], 0.12, 0.026, 0.010],
  [[0.06, 0.34, 0.94], 0.075, 0.020, 0.008],
  [[-0.66, 0.66, 0.35], 0.11, 0.026, 0.009],
  [[0.72, -0.52, 0.46], 0.09, 0.022, 0.008],
  [[0.48, 0.14, 0.87], 0.06, 0.016, 0.007],
  [[-0.02, -0.56, 0.83], 0.07, 0.018, 0.007]
].map(c => ({ d: norm3(c[0]), r: c[1], depth: c[2], lip: c[3] }));

/* Where the beacon stands: the upper right of the face. */
const BEACON = norm3([0.238, 0.381, 0.894]);

function craterAt(ux, uy, uz){
  let h = 0, floor = 0;
  for(let i = 0; i < CRATERS.length; i++){
    const K = CRATERS[i];
    const dx = ux - K.d[0], dy = uy - K.d[1], dz = uz - K.d[2];
    const c2 = dx * dx + dy * dy + dz * dz;
    const reach = K.r * 1.6;
    if(c2 > reach * reach) continue;
    const t = Math.sqrt(c2) / K.r;
    const bowl = smoothstep(1.05, 0.15, t);
    const lip = Math.exp(-((t - 1.02) / 0.26) * ((t - 1.02) / 0.26));
    h += -K.depth * bowl + K.lip * lip;
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}
function heightAt(ux, uy, uz){
  const lumps = 0.011 * noise(ux * 2.4, uy * 2.4 + 3, uz * 2.4) + 0.004 * noise(ux * 6.3 - 1, uy * 6.3, uz * 6.3);
  return lumps + craterAt(ux, uy, uz)[0];
}

/* The tiny beacon, built along the surface normal at its spot. */
const B_BASE = 1.004, B_TOP = 1.1, B_LAMP = 1.128;
function beacon(x, y, z, rec, lit){
  const bx = BEACON[0], by = BEACON[1], bz = BEACON[2];
  const tower = C.SD.capsule(x, y, z, bx * B_BASE, by * B_BASE, bz * B_BASE, bx * B_TOP, by * B_TOP, bz * B_TOP, 0.02);
  const lamp = C.SD.sphere(x - bx * B_LAMP, y - by * B_LAMP, z - bz * B_LAMP, 0.027);
  const cap = C.SD.sphere(x - bx * 1.158, y - by * 1.158, z - bz * 1.158, 0.019);
  let d = tower, m = 1;
  if(lamp < d){ d = lamp; m = 2; }
  if(cap < d){ d = cap; m = 3; }
  if(rec) rec.m = m;
  return d;
}

const ROCK = hex('#C9C1DC'), FLOOR = hex('#AFA4C9'), WARM = hex('#FFD79A');

function surface(x, y, z){
  const r = len3(x, y, z);
  if(r > 1.06) return r - 1.03;
  const inv = 1 / r;
  return (r - 1 - heightAt(x * inv, y * inv, z * inv)) * 0.75;
}

function build(variant){
  const lit = variant === 'lit';
  const W = 640, H = 640, D = 6.2;
  const tanHalf = (1 / Math.sqrt(D * D - 1)) / 0.84;
  const lampPos = [BEACON[0] * B_LAMP, BEACON[1] * B_LAMP, BEACON[2] * B_LAMP];
  return {
    width: W, height: H, scale: 1, seed: 31, spp: 3,
    keyScale: lit ? 1.0 : 0.82,
    camera: { pos: [0, 0.1, D], target: [0, 0, 0], fov: 2 * Math.atan(tanHalf) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.22 },
    points: lit ? [{ pos: lampPos, color: [1.0, 0.72, 0.38], intensity: 3.4, radius: 0.34 }] : [],
    materials: [
      C.clay({ albedo: ROCK, stroke: 0.0024, prints: 0.001 }),
      C.clay({ albedo: hex('#F3ECE0'), grain: 0.0006, stroke: 0.0008, prints: 0 }),
      C.clay({ albedo: lit ? hex('#FFF1C8') : hex('#8E86A6'), spec: 0.25, specPow: 40, grain: 0, stroke: 0, prints: 0,
               emissive: lit ? [6.0, 4.4, 2.2] : null }),
      C.clay({ albedo: hex('#FF8C78'), grain: 0.0006, stroke: 0.0008, prints: 0 })
    ],
    shadowMap: surface,
    map(x, y, z, rec){
      let d = surface(x, y, z);
      if(rec) rec.m = 0;
      // the beacon only matters near its spot
      const nearB = len3(x - BEACON[0] * 1.08, y - BEACON[1] * 1.08, z - BEACON[2] * 1.08);
      if(nearB < 0.2){
        const bd = beacon(x, y, z, null);
        if(bd < d){ d = bd; if(rec) beacon(x, y, z, rec); }
      } else if(nearB - 0.12 < d) d = Math.min(d, nearB - 0.12);
      return d;
    },
    albedoAt(x, y, z, mi, mat){
      if(mi !== 0) return mat.albedo;
      const r = len3(x, y, z), ux = x / r, uy = y / r, uz = z / r;
      const f = craterAt(ux, uy, uz)[1];
      const mott = 0.5 + 0.5 * noise(ux * 5 + 9, uy * 5, uz * 5);
      return mix3(mix3(ROCK, hex('#D6CFE6'), mott * 0.5), FLOOR, f * 0.8);
    },
    emissiveAt(x, y, z, mi, mat){
      if(mi !== 0 || !lit) return mat.emissive;
      // a faint warmth held in the crater floors: the Moon is awake again
      const r = len3(x, y, z);
      const f = craterAt(x / r, y / r, z / r)[1];
      return f > 0.05 ? [WARM[0] * 0.11 * f, WARM[1] * 0.11 * f, WARM[2] * 0.11 * f] : null;
    }
  };
}

function post(buf, W, H, CH, variant){
  const lit = variant === 'lit';
  if(lit){ C.addGlow(buf, W, H, CH, W * 0.02, 0.6); C.addGlow(buf, W, H, CH, W * 0.05, 0.35); }
  C.addDiskHalo(buf, W, H, CH, { cx: 0.5, cy: 0.5, r: 0.42, width: lit ? 0.055 : 0.05, strength: lit ? 0.5 : 0.34,
                                 color: lit ? hex('#FFE2A8') : hex('#B8A8FF'), towardX: lit ? 0.4 : 1, towardY: lit ? -0.8 : -0.35 });
}

module.exports = { build: build, post: post };
