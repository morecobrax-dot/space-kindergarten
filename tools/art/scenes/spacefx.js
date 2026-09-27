'use strict';
/* SPACE FX — what a flight passes on its way. All transparent, all lit by
   the one rig, none with a face.

     cloud-a, cloud-b, cloud-c           puffy cream-white clay clouds, each
                                         its own lumpy silhouette (640×400).
                                         The camera flies through them near
                                         Earth, so they are drawn large and
                                         partly blurred: soft, simple forms.
     asteroid-a, asteroid-b, asteroid-c  friendly round clay asteroids that
                                         drift past as scenery (384×384):
                                         a  lavender-grey, two soft dimples
                                         b  warm grey-brown, lumpy
                                         c  a small pair of rocks stuck together */
const C = require('../clay.js');
const { len3, smin, smax, hex, mix3, smoothstep, norm3 } = C;

/* ---------- clouds ---------- */
/* puffs: [x, y, z, radius]; a cloud is its puffs pressed together, its
   underside softly flattened, as a cumulus is. k is how softly the puffs
   blend, floor where the underside flattens, cy the cloud's middle (the
   camera looks there, so each cloud sits centred in its frame). */
const CLOUDS = {
  // a: the classic: a low row of puffs, three round bumps on top, the middle one biggest
  'cloud-a': { puffs: [[-1.08, -0.2, 0, 0.34], [-0.5, -0.16, 0.1, 0.42], [0.16, -0.16, 0.08, 0.44], [0.8, -0.18, 0.04, 0.38], [1.28, -0.24, 0, 0.26],
                       [-0.66, 0.16, -0.04, 0.42], [0.06, 0.3, -0.1, 0.55], [0.72, 0.12, -0.02, 0.4]], k: 0.15, floor: -0.4, seed: 3, cy: 0.21 },
  // b: long and low, a wavy line of small bumps
  'cloud-b': { puffs: [[-1.32, -0.2, 0, 0.26], [-0.86, -0.1, 0.06, 0.36], [-0.3, -0.06, 0.1, 0.42], [0.3, -0.04, 0.06, 0.44], [0.86, -0.1, 0.04, 0.36],
                       [1.32, -0.2, 0, 0.26], [-0.58, 0.2, -0.06, 0.34], [0.02, 0.28, -0.08, 0.38], [0.6, 0.18, -0.04, 0.32]], k: 0.15, floor: -0.3, seed: 5, cy: 0.175 },
  // c: tall and round: two big puffs side by side, one on top, a little one at each side
  'cloud-c': { puffs: [[-0.44, -0.1, 0.06, 0.52], [0.4, -0.12, 0.04, 0.5], [-0.02, 0.42, -0.06, 0.52], [0.98, -0.28, 0, 0.3],
                       [-0.98, -0.3, 0, 0.28], [0.52, 0.3, -0.02, 0.34]], k: 0.15, floor: -0.46, seed: 7, cy: 0.24 }
};
const cloudNoise = C.makeNoise(61);
function cloud(def, x, y, z){
  let d = 1e9;
  for(const P of def.puffs){
    const s = len3(x - P[0], y - P[1], (z - P[2]) * 1.15) - P[3];
    d = d > 1e8 ? s : smin(d, s, def.k);
  }
  // a softly flattened underside
  d = smax(d, def.floor - y, 0.22);
  // a whisper of hand-pressed unevenness, too broad to read as texture
  d += 0.018 * cloudNoise(x * 1.6 + def.seed, y * 1.6, z * 1.6);
  return d * 0.9;
}

/* ---------- asteroids ---------- */
/* dimples: { d: direction, r: size, depth } — soft round bowls pressed by
   a thumb, without the raised lips of a crater, so nothing reads as a face.
   A rock is one or more parts: a lumpy ball (centre, radius, squash, how
   lumpy, a noise offset) with its dimples. */
const rockNoise = C.makeNoise(83);
function dimpleAt(ux, uy, uz, list){
  let h = 0, f = 0;
  for(const k of list){
    const c = len3(ux - k.d[0], uy - k.d[1], uz - k.d[2]);
    if(c > k.r * 1.3) continue;
    const b = smoothstep(k.r * 1.2, k.r * 0.1, c);
    h -= k.depth * b * b * (3 - 2 * b);
    if(b > f) f = b;
  }
  return [h, f];
}
const ROCKS = {
  // a: a round lavender-grey ball with two soft dimples
  'asteroid-a': { parts: [{ c: [0, 0, 0], r: 1, sq: [1.0, 0.92, 0.96], lump: 0.05, o: 0,
                   dimples: [{ d: norm3([-0.4, 0.36, 0.84]), r: 0.33, depth: 0.075 }, { d: norm3([0.46, -0.3, 0.83]), r: 0.24, depth: 0.055 }] }],
                  albedo: '#A6A0BF', floorTint: '#8C86A8' },
  // b: a warm grey-brown lump, knobbly all round
  'asteroid-b': { parts: [{ c: [0, 0, 0], r: 1, sq: [1.08, 0.86, 0.94], lump: 0.12, o: 2.7,
                   dimples: [{ d: norm3([0.5, 0.42, 0.76]), r: 0.2, depth: 0.04 }] }],
                  albedo: '#A08E7E', floorTint: '#8A7969' },
  // c: two rocks stuck together, a big one and a small one
  'asteroid-c': { parts: [{ c: [-0.3, -0.12, 0], r: 0.72, sq: [1.0, 0.94, 0.96], lump: 0.07, o: 5.1,
                   dimples: [{ d: norm3([-0.3, 0.3, 0.9]), r: 0.26, depth: 0.05 }] },
                  { c: [0.58, 0.36, -0.08], r: 0.48, sq: [1.0, 0.95, 1.0], lump: 0.07, o: 9.4, dimples: [] }],
                  albedo: '#9C9EAC', floorTint: '#838594', k: 0.1 }
};
function rockPart(P, x, y, z){
  const px = (x - P.c[0]) / P.sq[0], py = (y - P.c[1]) / P.sq[1], pz = (z - P.c[2]) / P.sq[2];
  const l = len3(px, py, pz) || 1e-6;
  const ux = px / l, uy = py / l, uz = pz / l;
  const lumps = P.lump * rockNoise(ux * 1.5 + P.o, uy * 1.5, uz * 1.5) + P.lump * 0.2 * rockNoise(ux * 2.9, uy * 2.9 + P.o, uz * 2.9);
  const dm = dimpleAt(ux, uy, uz, P.dimples)[0];
  return (l - P.r * (1 + lumps + dm)) * Math.min(P.sq[0], P.sq[1], P.sq[2]) * 0.82;
}

function build(variant){
  if(CLOUDS[variant]){
    const def = CLOUDS[variant];
    const W = 640, H = 400, D = 14;
    const frameH = 2.3;
    return {
      width: W, height: H, scale: 1, seed: 61, spp: 3, aoRange: 0.12,
      camera: { pos: [0, def.cy + 0.3, D], target: [0, def.cy, 0], fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
      bounds: { center: [0, 0.1, 0], radius: 2.2 },
      materials: [C.clay({ albedo: hex('#F3EBDD'), sss: 0.3, sheen: 0.08, grain: 0, stroke: 0, rim: 0.7 })],
      map(x, y, z, rec){ if(rec) rec.m = 0; return cloud(def, x, y, z); }
    };
  }
  const R = ROCKS[variant];
  if(!R) throw new Error('spacefx: unknown variant ' + variant);
  const W = 384, H = 384, D = 12, ELEV = 0.2;
  const frame = 2.7;
  const ALB = hex(R.albedo), FLOOR = hex(R.floorTint);
  return {
    width: W, height: H, scale: 1, seed: 83, spp: 3, aoRange: 0.08,
    camera: { pos: [0, D * Math.sin(ELEV), D * Math.cos(ELEV)], target: [0, 0, 0], fov: 2 * Math.atan((frame / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0, 0], radius: 1.45 },
    materials: [C.clay({ albedo: ALB })],
    map(x, y, z, rec){
      if(rec) rec.m = 0;
      let d = 1e9;
      for(const P of R.parts){ const s = rockPart(P, x, y, z); d = d > 1e8 ? s : smin(d, s, R.k || 0.1); }
      return d;
    },
    albedoAt(x, y, z){
      // the dimples' floors a little darker, where the clay was pressed
      let f = 0;
      for(const P of R.parts){
        const px = (x - P.c[0]) / P.sq[0], py = (y - P.c[1]) / P.sq[1], pz = (z - P.c[2]) / P.sq[2];
        const l = len3(px, py, pz) || 1e-6;
        if(l > P.r * 1.3) continue;
        f = Math.max(f, dimpleAt(px / l, py / l, pz / l, P.dimples)[1]);
      }
      return mix3(ALB, FLOOR, f * 0.7);
    }
  };
}
module.exports = { build: build };
