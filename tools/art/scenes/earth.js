'use strict';
/* EARTH — home base. A hand-sized clay ball: blue ocean, raised green
   slabs of land pressed on by thumb, and puffy clouds floating just above
   the surface, casting their own soft shadows. A child's Earth, not an
   atlas: the continents are friendly shapes, not real coastlines.

   Framing: the sphere is centred and fills 84% of the square, so the
   layout maths from the placeholder still holds, and the rocket's landing
   spot (upper right of the face) is solid land. */
const C = require('../clay.js');
const { len3, norm3, smoothstep, clamp, hex, mix3, smin } = C;

const noise = C.makeNoise(11);

/* Directions of the continents, as seen from the camera (+z is toward it). */
const LANDS = [
  { d: norm3([0.40, 0.45, 0.80]), r: 0.34 },   // the launch site, under the rocket
  { d: norm3([-0.56, 0.12, 0.82]), r: 0.40 },
  { d: norm3([0.12, -0.58, 0.80]), r: 0.30 },
  { d: norm3([0.93, -0.22, 0.28]), r: 0.30 },
  { d: norm3([-0.55, 0.78, 0.25]), r: 0.26 },
  { d: norm3([-0.8, -0.5, 0.2]), r: 0.28 }
];
const SHOULDER = 0.045;     // how wide the rounded edge of a land slab is
const LAND_H = 0.036;       // how thick the slab stands above the sea

function landMask(ux, uy, uz){
  const wob = 0.15 * noise(ux * 2.2 + 3.1, uy * 2.2, uz * 2.2) + 0.06 * noise(ux * 5.1, uy * 5.1 - 2, uz * 5.1);
  let m = 0;
  for(let i = 0; i < LANDS.length; i++){
    const L = LANDS[i];
    const cx = ux - L.d[0], cy = uy - L.d[1], cz = uz - L.d[2];
    const c = Math.sqrt(cx * cx + cy * cy + cz * cz);
    const v = smoothstep(L.r + SHOULDER, L.r - SHOULDER, c + wob);
    if(v > m) m = v;
  }
  return m;
}
function heightAt(ux, uy, uz){
  const m = landMask(ux, uy, uz);
  const sea = 0.0035 * noise(ux * 4.2, uy * 4.2 + 1.7, uz * 4.2);
  const top = m > 0 ? m * (LAND_H + 0.007 * noise(ux * 6.5 - 4, uy * 6.5, uz * 6.5)) : 0;
  return sea + top;
}

/* Clouds: little clusters of clay puffs, squashed flat against the sky. */
const PUFFS = [[0, 0, 0, 1.0], [-1.15, -0.2, 0.05, 0.72], [1.05, -0.15, 0, 0.8], [0.3, 0.55, 0.1, 0.72], [-0.52, 0.42, 0, 0.6]];
const SQUASH = 0.62;
/* Two clouds break the silhouette, as puffs of clay would; none may cross
   the frame's edge, or it would show up sliced flat. */
const CLOUDS = [
  { d: [-0.70, 0.58, 0.42], s: 0.135, spin: 0.3 },
  { d: [0.80, 0.0, 0.60], s: 0.115, spin: -0.4 },
  { d: [-0.22, -0.40, 0.89], s: 0.1, spin: 0.2 },
  { d: [0.1, 0.88, 0.46], s: 0.11, spin: 0.9 },
  { d: [-0.9, -0.2, 0.39], s: 0.115, spin: -0.2 },
  { d: [0.5, -0.72, 0.48], s: 0.1, spin: 0.5 }
].map(c => {
  const n = norm3(c.d);
  // a tangent frame, turned by `spin` so no two clusters sit the same way
  const up = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let t1 = norm3(C.cross3(up, n));
  let t2 = C.cross3(n, t1);
  const cs = Math.cos(c.spin), sn = Math.sin(c.spin);
  const a = [t1[0] * cs + t2[0] * sn, t1[1] * cs + t2[1] * sn, t1[2] * cs + t2[2] * sn];
  const b = [t2[0] * cs - t1[0] * sn, t2[1] * cs - t1[1] * sn, t2[2] * cs - t1[2] * sn];
  // high enough that the lowest puff clears the land: clouds float, never touch
  const alt = 1.06 + c.s * SQUASH * 1.15;
  return { n: n, t1: a, t2: b, c: [n[0] * alt, n[1] * alt, n[2] * alt], s: c.s };
});
function clouds(x, y, z){
  let d = 1e9;
  for(let i = 0; i < CLOUDS.length; i++){
    const K = CLOUDS[i];
    const qx = x - K.c[0], qy = y - K.c[1], qz = z - K.c[2];
    const far = len3(qx, qy, qz) - 2.3 * K.s;
    if(far > 0.12){ if(far < d) d = far; continue; }
    const a = (qx * K.t1[0] + qy * K.t1[1] + qz * K.t1[2]) / K.s;
    const b = (qx * K.t2[0] + qy * K.t2[1] + qz * K.t2[2]) / K.s;
    const h = (qx * K.n[0] + qy * K.n[1] + qz * K.n[2]) / (K.s * SQUASH);
    let dc = 1e9;
    for(let j = 0; j < PUFFS.length; j++){
      const P = PUFFS[j];
      const ds = len3(a - P[0], b - P[1], h - P[2]) - P[3];
      dc = j === 0 ? ds : smin(dc, ds, 0.38);
    }
    dc *= K.s * SQUASH;
    if(dc < d) d = dc;
  }
  return d;
}

const OCEAN = hex('#2C86DC'), SHALLOW = hex('#4DB4F2'), LAND = hex('#76C957'), LAND_TOP = hex('#95DA6C');

function build(){
  const W = 1400, H = 1400;
  const D = 6.2;
  const tanHalf = (1 / Math.sqrt(D * D - 1)) / 0.84;
  return {
    width: W, height: H, scale: 1, seed: 11, spp: 3,
    camera: { pos: [0, 0.12, D], target: [0, 0, 0], fov: 2 * Math.atan(tanHalf) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.28 },
    materials: [
      C.clay({ albedo: OCEAN, stroke: 0.0026, prints: 0.0007 }),
      C.clay({ albedo: hex('#F4EFE7'), sss: 0.35, sheen: 0.14, stroke: 0.0016, grain: 0.0009 })
    ],
    map(x, y, z, rec){
      const r = len3(x, y, z);
      let d;
      if(r > 1.09) d = r - 1.05;
      // the land's rounded shoulders are steep: step carefully in the shell
      else { const inv = 1 / r; d = (r - 1 - heightAt(x * inv, y * inv, z * inv)) * 0.7; }
      let m = 0;
      const dc = clouds(x, y, z);
      if(dc < d){ d = dc; m = 1; }
      if(rec) rec.m = m;
      return d;
    },
    albedoAt(x, y, z, mi, mat){
      if(mi !== 0) return mat.albedo;
      const r = len3(x, y, z), ux = x / r, uy = y / r, uz = z / r;
      const m = landMask(ux, uy, uz);
      if(m <= 0.001){
        // the sea is a touch lighter where it laps the land
        const near = landMaskWide(ux, uy, uz);
        return mix3(OCEAN, SHALLOW, near * 0.55);
      }
      const hi = clamp(0.5 + 3 * noise(ux * 7, uy * 7, uz * 7 + 5), 0, 1);
      return mix3(OCEAN, mix3(LAND, LAND_TOP, hi * 0.6), smoothstep(0.15, 0.7, m));
    }
  };
}
function landMaskWide(ux, uy, uz){
  const wob = 0.15 * noise(ux * 2.2 + 3.1, uy * 2.2, uz * 2.2) + 0.06 * noise(ux * 5.1, uy * 5.1 - 2, uz * 5.1);
  let m = 0;
  for(let i = 0; i < LANDS.length; i++){
    const L = LANDS[i];
    const c = len3(ux - L.d[0], uy - L.d[1], uz - L.d[2]);
    const v = smoothstep(L.r + 0.16, L.r + SHOULDER, c + wob);
    if(v > m) m = v;
  }
  return m;
}

/* A thin cyan atmosphere, stronger on the rim-lit side. The disc sits at
   the centre, 42% of the frame's height in radius. */
function post(buf, W, H, CH){
  C.addDiskHalo(buf, W, H, CH, { cx: 0.5, cy: 0.5, r: 0.42, width: 0.05, strength: 0.42,
                                 color: hex('#56C4FF'), towardX: 1, towardY: -0.35 });
}

module.exports = { build: build, post: post };
