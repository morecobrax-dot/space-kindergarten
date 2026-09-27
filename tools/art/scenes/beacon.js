'use strict';
/* BEACON — the Moon's lighthouse. A cream clay tower with two coral
   stripes and an arched door, a railing ring, a glass lamp and a coral
   dome, standing on a mound of Moon clay. An invisible floor catches its
   contact shadow, so it sits on the Moon ground rather than floating.

   Variants:
     off  the lamp is dull lavender glass
     on   the lamp glows warm and lights the railing and the dome from
          inside — the moment a mission restores it */
const C = require('../clay.js');
const { len2, len3, smin, smax, hex, clamp } = C;

const STRIPES = [[0.44, 0.56], [0.8, 0.92]];
const LAMP_Y = 1.4;

function tower(x, y, z){
  return C.SD.roundCone(x, y - 0.08, z, 0.23, 0.165, 1.1);
}
function seams(y){
  let s = 0;
  for(const st of STRIPES){
    for(const t of st){ const k = (y - t) / 0.01; s += Math.exp(-k * k); }
  }
  return 0.006 * s;
}

function build(variant){
  const on = variant === 'on';
  const W = 512, H = 896;
  const frameH = 2.3, D = 10;
  const lamp = [0, LAMP_Y, 0];
  return {
    width: W, height: H, scale: 1.6, seed: 71, spp: 3, aoRange: 0.06,
    camera: { pos: [0, 1.5, D], target: [0, 0.8, 0], fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.8, 0], radius: 1.3 },
    points: on ? [{ pos: lamp, color: [1.0, 0.78, 0.42], intensity: 3.2, radius: 0.38 }] : [],
    materials: [
      C.clay({ albedo: hex('#F4EEE3') }),                                         // 0 tower
      C.clay({ albedo: hex('#FF8A76') }),                                         // 1 stripes, dome
      C.clay({ albedo: hex('#C4BCD8') }),                                         // 2 mound (Moon clay)
      C.clay({ albedo: hex('#E6DFD2') }),                                         // 3 railing
      C.clay({ albedo: on ? hex('#FFF0C2') : hex('#9E97B8'), spec: 0.8, specPow: 50, sheen: 0.2,
               grain: 0.0002, stroke: 0, prints: 0, sss: 0.3,
               emissive: on ? [4.2, 3.0, 1.35] : null }),                         // 4 lamp glass
      C.clay({ albedo: hex('#3E3677') }),                                         // 5 door
      // the frame is only ±0.66 wide: the shadow must be gone before its edge
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85, fadeCenter: [0.04, 0], fadeRadius: 0.6 }) // 6 shadow catcher
    ],
    map(x, y, z, rec){
      let d = tower(x, y, z) + seams(y);
      let m = 0;
      for(const st of STRIPES) if(y > st[0] && y < st[1]) m = 1;
      // arched door, pressed into the front
      const door = C.SD.roundBox(x, y - 0.27, z - 0.22, 0.075, 0.12, 0.06, 0.06);
      if(door < 0.02 && z > 0){ const b = smax(d, -door, 0.012); if(door < 0.008) m = 5; d = b; }
      // the mound it stands on
      const mound = C.SD.ellipsoid(x, y - 0.02, z, 0.62, 0.17, 0.5);
      if(mound < d + 0.04){ const b = smin(d, mound, 0.06); if(mound < d) m = 2; d = b; }
      // railing ring, lamp, dome and knob
      const rail = C.SD.torus(x, y - 1.22, z, 0.21, 0.035);
      if(rail < d){ d = rail; m = 3; }
      const glass = C.SD.sphere(x, y - LAMP_Y, z, 0.165);
      if(glass < d){ d = glass; m = 4; }
      const dome = smin(C.SD.ellipsoid(x, y - 1.57, z, 0.2, 0.13, 0.2), C.SD.sphere(x, y - 1.72, z, 0.042), 0.03);
      if(dome < d){ d = dome; m = 1; }
      // the invisible floor that receives the contact shadow
      const floor = Math.max(y + 0.04, len2(x, z) - 1.6);
      if(floor < d){ d = floor; m = 6; }
      if(rec) rec.m = m;
      return d;
    }
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.025, 0.35); C.addGlow(buf, W, H, CH, W * 0.11, 0.3); }
}
module.exports = { build: build, post: post };
