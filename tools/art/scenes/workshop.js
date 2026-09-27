'use strict';
/* WORKSHOP — Word Builder's marker on Mars: a friendly clay word machine.
   A chunky rounded cream box with a coral lid flush on top, on four stubby
   teal legs, with three empty square sockets in a row on its front (each
   in a lavender bezel: no letters, no text, ever), a little glass lamp on
   its lid and a crank on its right-hand side. It is turned a little, so
   the crank side shows. An invisible floor catches its contact shadow.
   (A roof overhang and a chimney made it read as a house with windows;
   round feet and a funnel, as a toy train.)

   Variants:
     off  the sockets are dark, the lamp dull glass
     on   the sockets glow warm and light their bezels, the lamp is lit,
          with a gentle bloom

   Anchor: its foot (the middle of its footprint on the ground) is FOOT,
   projected by the camera; the app stands the marker there. */
const C = require('../clay.js');
const { len2, len3, smin, smax, hex } = C;

const YAW = -0.34;                               // turned so the right-hand side shows
const CY = Math.cos(YAW), SY = Math.sin(YAW);
const BODY = { y: 0.7, hx: 0.7, hy: 0.52, hz: 0.44, r: 0.17 };
const FACE = BODY.hz;                            // the front face is local z = FACE
const LID = { y: 1.11, hx: BODY.hx + 0.012, hy: 0.12, hz: BODY.hz + 0.012, r: 0.13 };
const FEET = [[-0.48, -0.25], [0.48, -0.25], [-0.48, 0.25], [0.48, 0.25]];  // stubby legs, narrower than tall
const FOOT_R = 0.085, FOOT_H = 0.1;
const SOCKETS = [-0.41, 0, 0.41], SOCK_Y = 0.64, SOCK = 0.15, SOCK_R = 0.065, SOCK_D = 0.12;
const BEZEL = 0.05, BEZEL_OUT = 0.035;           // bezel width and how far it stands proud
const LAMP = { x: -0.34, z: -0.08, y: 1.36, r: 0.12 };      // the glass lamp, on a short collar
const COLLAR = { y0: 1.2, y1: 1.28, r: 0.11 };
const CRANK = { x: BODY.hx, y: 0.72, z: 0.02 };
const FOOT = [0, 0, 0];

function roundRect2(x, y, hx, hy, r){
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
/* the nearest socket's centre along x */
function socketX(x){ return x < -0.205 ? SOCKETS[0] : (x > 0.205 ? SOCKETS[2] : SOCKETS[1]); }

/* the machine in its own frame (x right, y up, z out of the front) */
function machine(x, y, z, rec){
  // body, with the three sockets pressed into its front
  let d = C.SD.roundBox(x, y - BODY.y, z, BODY.hx, BODY.hy, BODY.hz, BODY.r), m = 0;
  const sx = socketX(x);
  const hole = C.SD.extrude(roundRect2(x - sx, y - SOCK_Y, SOCK, SOCK, SOCK_R), z - FACE, SOCK_D, 0.02);
  d = smax(d, -hole, 0.02);
  if(rec && z > FACE - SOCK_D - 0.03 && roundRect2(x - sx, y - SOCK_Y, SOCK, SOCK, SOCK_R) < 0.004) m = 5;
  // the lavender bezels round the sockets
  const ring = Math.abs(roundRect2(x - sx, y - SOCK_Y, SOCK + BEZEL * 0.5, SOCK + BEZEL * 0.5, SOCK_R + BEZEL * 0.5)) - BEZEL * 0.5;
  const bezel = C.SD.extrude(ring, z - FACE, BEZEL_OUT, 0.022);
  if(bezel < d){ d = bezel; m = 3; }
  // the lid
  const lid = C.SD.roundBox(x, y - LID.y, z, LID.hx, LID.hy, LID.hz, LID.r);
  if(lid < d + 0.03){ const b = smin(d, lid, 0.03); if(lid < d) m = 1; d = b; }
  // the feet
  for(const f of FEET){
    const ft = C.SD.roundCylinder(x - f[0], y - FOOT_H, z - f[1], FOOT_R, FOOT_H, 0.04);
    if(ft < d + 0.03){ const b = smin(d, ft, 0.03); if(ft < d) m = 2; d = b; }
  }
  // the lamp: a glass ball in a teal collar on the lid
  const col = C.SD.roundCylinder(x - LAMP.x, y - (COLLAR.y0 + COLLAR.y1) * 0.5, z - LAMP.z, COLLAR.r, (COLLAR.y1 - COLLAR.y0) * 0.5 + 0.03, 0.03);
  if(col < d + 0.03){ const b = smin(d, col, 0.03); if(col < d) m = 2; d = b; }
  const lamp = len3(x - LAMP.x, y - LAMP.y, z - LAMP.z) - LAMP.r;
  if(lamp < d){ d = lamp; m = 6; }
  // the crank: an axle out of the side, an arm down, a coral knob
  const ax = CRANK.x + 0.13, ay = CRANK.y, az = CRANK.z, ex = ax + 0.02, ey = ay - 0.26, ez = az + 0.1;
  const axle = C.SD.capsule(x, y, z, CRANK.x - 0.05, ay, az, ax, ay, az, 0.045);
  if(axle < d + 0.02){ const b = smin(d, axle, 0.02); if(axle < d) m = 3; d = b; }
  const arm = C.SD.capsule(x, y, z, ax, ay, az, ex, ey, ez, 0.038);
  if(arm < d + 0.02){ const b = smin(d, arm, 0.02); if(arm < d) m = 3; d = b; }
  const knob = C.SD.capsule(x, y, z, ex, ey, ez, ex + 0.1, ey, ez + 0.03, 0.055);
  if(knob < d + 0.02){ const b = smin(d, knob, 0.02); if(knob < d) m = 1; d = b; }
  if(rec) rec.m = m;
  return d;
}

function build(variant){
  const on = variant === 'on';
  const W = 480, H = 400, D = 12, ELEV = 0.34;
  const frameH = 2.04;
  const target = [0.17, 0.68, 0];
  const yFloor = 0.0;
  // a warm light just in front of each socket, in world space
  const lights = on ? SOCKETS.map(sx => {
    const lx = sx, lz = FACE + 0.12;
    return { pos: [lx * CY + lz * SY, SOCK_Y, -lx * SY + lz * CY], color: [1.0, 0.7, 0.38], intensity: 0.55, radius: 0.24 };
  }).concat([{ pos: [LAMP.x * CY + LAMP.z * SY, LAMP.y, -LAMP.x * SY + LAMP.z * CY], color: [1.0, 0.76, 0.42], intensity: 1.4, radius: 0.26 }]) : [];
  return {
    width: W, height: H, scale: 1, seed: 79, spp: 3, aoRange: 0.07,
    camera: { pos: [target[0], target[1] + D * Math.sin(ELEV), D * Math.cos(ELEV)], target: target,
              fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0.05, 0.75, 0], radius: 1.55 },
    points: lights,
    materials: [
      C.clay({ albedo: hex('#F1E8D8') }),                                          // 0 body
      C.clay({ albedo: hex('#FF8A76'), rim: 0.6 }),                                // 1 lid, rim, knob
      C.clay({ albedo: hex('#2AAFB8') }),                                          // 2 legs, lamp collar
      C.clay({ albedo: hex('#9D93D6') }),                                          // 3 bezels, crank
      C.clay({ albedo: hex('#140F33'), catcher: true, strength: 0.85,
               fadeCenter: [0.1, 0.05], fadeRadius: 1.25 }),                       // 4 shadow catcher
      C.clay(on ? { albedo: hex('#FFA24A'), rim: 0.3, grain: 0, stroke: 0, emissive: [0.5, 0.21, 0.04] }
                : { albedo: hex('#40376E') }),                                     // 5 socket floors
      C.clay({ albedo: on ? hex('#FFD98A') : hex('#9E97B8'), spec: 0.8, specPow: 50, sheen: 0.2,
               grain: 0.0002, stroke: 0, prints: 0, sss: 0.3, rim: on ? 0.3 : 1,
               emissive: on ? [2.4, 1.4, 0.4] : null })                             // 6 lamp glass
    ],
    emissiveAt: on ? function(x, y, z, mi, mat){
      if(mi !== 5) return mat.emissive;
      // brightest on the socket's floor, softer up its walls: a lit hollow, not a flat panel
      const g = C.smoothstep(FACE + 0.01, FACE - SOCK_D, x * SY + z * CY), k = 0.3 + 0.7 * g;
      return [mat.emissive[0] * k, mat.emissive[1] * k, mat.emissive[2] * k];
    } : null,
    map(x, y, z, rec){
      // into the machine's own frame (undo its turn)
      const lx = x * CY - z * SY, lz = x * SY + z * CY;
      let d = machine(lx, y, lz, rec), m = rec ? rec.m : 0;
      // the invisible floor
      const floor = Math.max(y - yFloor, len2(x, z) - 1.8);
      if(floor < d){ d = floor; m = 4; }
      if(rec) rec.m = m;
      // a little under 1, so a surface facing the key head-on never reads
      // as shadowed by itself (see picture.js)
      return d * 0.92;
    }
  };
}
function post(buf, W, H, CH, variant){
  if(variant === 'on'){ C.addGlow(buf, W, H, CH, W * 0.02, 0.3); C.addGlow(buf, W, H, CH, W * 0.06, 0.2); }
}
module.exports = { build: build, post: post, FOOT: FOOT };
