'use strict';
/* MOON GROUND — the set the letter mission stands on. The curved top of a
   big clay moon, seen from just above it: craters pressed in by fingers,
   soft lumps, and distance haze that melts the far ground into space. The
   horizon catches the cyan rim light. The sky is transparent, so the
   starfield shows through behind it.

   The layout crops this from the top (object-position: top), so the
   horizon and the near craters live in the upper three quarters. */
const C = require('../clay.js');
const { len3, smoothstep, hex, mix3 } = C;

const R = 10;
const noise = C.makeNoise(101);

/* Craters on the ground: x, z, radius, depth. Bigger nearer the camera. */
const CRATERS = [
  [-2.6, 1.9, 0.62, 0.075], [2.3, 2.1, 0.55, 0.07], [0.35, 2.7, 0.34, 0.05],
  [-1.1, 0.7, 0.4, 0.055], [1.2, 0.5, 0.33, 0.05], [3.4, 0.9, 0.42, 0.055], [-3.6, 0.3, 0.45, 0.06],
  [-0.2, -0.6, 0.28, 0.04], [2.1, -0.9, 0.3, 0.04], [-2.2, -1.1, 0.32, 0.045], [0.9, -2.0, 0.22, 0.035],
  [-1.2, -2.4, 0.2, 0.03], [3.0, -2.6, 0.26, 0.035], [-3.4, -2.3, 0.28, 0.035], [4.4, -0.8, 0.3, 0.04],
  [-4.6, 1.6, 0.5, 0.06], [4.8, 2.4, 0.55, 0.06], [0.0, 1.2, 0.16, 0.025], [-0.6, 3.4, 0.24, 0.035],
  // the near field (the bottom of the frame looks at z ≈ 1.8), so the
  // ground under the letters is not a blank sheet
  [-1.25, 2.05, 0.3, 0.045], [1.05, 2.2, 0.26, 0.04], [-0.1, 1.85, 0.2, 0.032], [1.9, 1.7, 0.34, 0.05],
  [-2.0, 1.55, 0.3, 0.045], [0.55, 1.45, 0.14, 0.022], [-0.75, 1.35, 0.17, 0.025]
];

function heightAt(x, z){
  let h = 0.03 * noise(x * 0.55, 0.3, z * 0.55) + 0.012 * noise(x * 1.7, 1.1, z * 1.7);
  let floor = 0;
  for(let i = 0; i < CRATERS.length; i++){
    const K = CRATERS[i];
    const dx = x - K[0], dz = z - K[1];
    const d2 = dx * dx + dz * dz;
    const reach = K[2] * 1.7;
    if(d2 > reach * reach) continue;
    const t = Math.sqrt(d2) / K[2];
    const bowl = smoothstep(1.05, 0.12, t);
    const lip = Math.exp(-((t - 1.03) / 0.27) * ((t - 1.03) / 0.27));
    h += -K[3] * bowl + K[3] * 0.34 * lip;
    if(bowl > floor) floor = bowl;
  }
  return [h, floor];
}

const ROCK = hex('#8279A6'), ROCK_LIGHT = hex('#968DBA'), FLOOR = hex('#6A6092');

function build(){
  const W = 2400, H = 800;
  return {
    width: W, height: H, scale: 1.2, seed: 101, spp: 2, aoRange: 0.12, stepScale: 0.8, maxSteps: 300, fillsFrame: true,
    keyScale: 0.66,
    camera: { pos: [0, 0.95, 4.6], target: [0, -0.34, 0], fov: 17 },
    bounds: { center: [0, -R, 0], radius: R + 0.2 },
    fog: { color: hex('#1A2455'), near: 3.5, far: 10, max: 0.66 },
    materials: [C.clay({ albedo: ROCK, grain: 0.0008, stroke: 0.0016, prints: 0.0008 })],
    map(x, y, z, rec){
      const dy = y + R;
      const r = Math.sqrt(x * x + dy * dy + z * z);
      if(rec) rec.m = 0;
      if(r > R + 0.2) return r - R - 0.1;
      return (r - R - heightAt(x, z)[0]) * 0.8;
    },
    albedoAt(x, y, z){
      const hf = heightAt(x, z);
      const m = 0.5 + 0.5 * noise(x * 1.3 + 7, 2.2, z * 1.3);
      return mix3(mix3(ROCK, ROCK_LIGHT, m * 0.6), FLOOR, hf[1] * 0.75);
    }
  };
}
/* A glow along the horizon, where the rim light grazes the edge. */
function post(buf, W, H, CH){
  C.addHalo(buf, W, H, CH, { radius: H * 0.03, strength: 0.4, color: hex('#5EA8FF'), shiftY: -0.012 });
}
module.exports = { build: build, post: post };
