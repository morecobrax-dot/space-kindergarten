'use strict';
/* PIP — the guide: an original satellite buddy, sculpted in clay.

   Phase 2 made Pip simpler and more iconic, so it reads from its
   silhouette alone: a chubby warm-yellow capsule with an orange band, a
   big friendly face (large bead eyes, a small smile), two chunky teal
   solar-panel wings on short arms, and a short antenna with a big glassy
   ball — the ball the app lights while Pip speaks. Slightly hand-made: the
   antenna leans, one wing tilts a touch more than the other.

   Silhouette rule (docs/ART-DIRECTION.md): body + two panel wings +
   antenna. Never a star with a face, a pink ball, a white egg with a
   visor, or an owl. */
const C = require('../clay.js');
const { len3, smin, hex, clamp } = C;

const BODY_R = 0.41, BODY_HALF = 0.12, DEPTH = 0.88;
const BAND_TOP = -0.1, BAND_BOTTOM = -0.27;
const EYES = [[-0.15, 0.085], [0.15, 0.085]];
const BALL = [0.035, 0.8, 0], BALL_R = 0.09;

function body(x, y, z){
  // a chubby capsule, a little shallower front to back
  return C.SD.capsule(x, y, z / DEPTH, 0, -BODY_HALF, 0, 0, BODY_HALF, 0, BODY_R) * DEPTH;
}
/* The front of the body at (x, y): where the face features sit. */
function faceZ(x, y){
  const yy = Math.max(0, Math.abs(y) - BODY_HALF);
  const r2 = BODY_R * BODY_R - x * x - yy * yy;
  return r2 > 0 ? Math.sqrt(r2) * DEPTH : 0;
}
function seams(y){
  const g = (t) => Math.exp(-((y - t) / 0.011) * ((y - t) / 0.011));
  return 0.006 * (g(BAND_TOP) + g(BAND_BOTTOM));
}
/* A small pressed-on smile: a short arc of dark clay lying on the face. */
function smile(x, y, z){
  const cx = 0.0, cy = -0.01, R = 0.075;
  let a = Math.atan2(y - cy, x - cx);
  const a1 = -2.5, a2 = -0.64;
  if(a > 0) a = a > Math.PI / 2 ? a1 : a2;
  a = clamp(a, a1, a2);
  const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
  return len3(x - px, y - py, z - (faceZ(px, py) - 0.004)) - 0.021;
}
/* A chunky solar-panel wing with one soft pressed groove down its middle. */
function panel(lx, ly, lz){
  const d = C.SD.roundBox(lx, ly, lz, 0.22, 0.24, 0.06, 0.07);
  if(d > 0.02) return d;
  const g = Math.exp(-(lx / 0.014) * (lx / 0.014));
  return d + 0.01 * g * (lz > 0 ? 1 : 0.2);
}

/* The app icon's backdrop: Pip against deep space, brighter behind it. */
const ICON_IN = hex('#1E3279'), ICON_OUT = hex('#060A20');
function iconBackground(dx, dy, dz, px, py, W, H){
  const u = px / W - 0.5, v = py / H - 0.46;
  const t = Math.min(1, Math.sqrt(u * u + v * v) / 0.68);
  return [ICON_IN[0] + (ICON_OUT[0] - ICON_IN[0]) * t, ICON_IN[1] + (ICON_OUT[1] - ICON_IN[1]) * t,
          ICON_IN[2] + (ICON_OUT[2] - ICON_IN[2]) * t, 1];
}

/* Variants: none for the guide; 'icon' frames Pip square and fills the
   background, because a Home Screen icon cannot be transparent. */
function build(variant){
  const icon = variant === 'icon';
  const W = icon ? 512 : 720, H = icon ? 512 : 660;
  const frameW = icon ? 2.5 : 2.3, frameH = frameW * H / W;
  const D = 12;
  const cy = icon ? 0.1 : 0.14;
  return {
    width: W, height: H, scale: 1, seed: 51, spp: 3, aoRange: 0.07, fillsFrame: icon,
    background: icon ? function(dx, dy, dz, px, py){ return iconBackground(dx, dy, dz, px, py, this.width, this.height); } : null,
    camera: { pos: [0, cy + 0.18, D], target: [0, cy, 0], fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.12, 0], radius: 1.25 },
    materials: [
      C.clay({ albedo: hex('#FFC53F'), rim: 0.4 }),                                   // 0 body
      C.clay({ albedo: hex('#FF8B2C'), rim: 0.4 }),                                   // 1 band, feet
      C.clay({ albedo: hex('#2BB6C6') }),                                             // 2 panels
      C.clay({ albedo: hex('#9C93D4') }),                                             // 3 arms, stalk
      C.clay({ albedo: hex('#F2F6FF'), spec: 0.8, specPow: 40, sheen: 0.2, grain: 0, stroke: 0 }), // 4 antenna ball
      C.clay({ albedo: hex('#1B1F3B'), spec: 1.2, specPow: 55, sheen: 0.04, grain: 0, stroke: 0 }), // 5 eyes, smile
      C.clay({ albedo: hex('#FF9EAE'), grain: 0, stroke: 0 }),                        // 6 cheeks
      C.clay({ albedo: hex('#FFFFFF'), grain: 0, stroke: 0, spec: 0.3, emissive: [0.4, 0.4, 0.4] }) // 7 catch-lights
    ],
    map(x, y, z, rec){
      let d = body(x, y, z) + seams(y);
      let m = (y < BAND_TOP && y > BAND_BOTTOM) ? 1 : 0;
      // feet
      for(const s of [-1, 1]){
        const f = C.SD.ellipsoid(x - s * 0.14, y + 0.55, z - 0.03, 0.09, 0.06, 0.1);
        if(f < d + 0.03){ const b = smin(d, f, 0.03); if(f < d) m = 1; d = b; }
      }
      // arms and wings; the left wing tilts a little more (hand-made)
      for(const s of [-1, 1]){
        const arm = C.SD.capsule(x, y, z, s * 0.34, -0.04, 0, s * 0.57, -0.04, 0, 0.05);
        if(arm < d){ d = smin(d, arm, 0.02); if(arm <= d + 0.004) m = 3; }
        const yaw = s * 0.28, roll = s < 0 ? 0.07 : -0.03;
        const px = x - s * 0.8, py = y + 0.04, pz = z - 0.04;
        const cyw = Math.cos(yaw), syw = Math.sin(yaw);
        let lx = px * cyw + pz * syw, lz = -px * syw + pz * cyw;
        const cr = Math.cos(roll), sr = Math.sin(roll);
        const ly = py * cr - lx * sr; lx = lx * cr + py * sr;
        const p = panel(lx, ly, lz);
        if(p < d){ d = p; m = 2; }
      }
      // antenna: a short leaning stalk and the big ball the app lights
      const stalk = C.SD.capsule(x, y, z, 0, BODY_HALF + BODY_R - 0.06, 0, 0.03, 0.74, 0, 0.03);
      if(stalk < d){ d = smin(d, stalk, 0.02); if(stalk <= d + 0.004) m = 3; }
      const ball = C.SD.sphere(x - BALL[0], y - BALL[1], z - BALL[2], BALL_R);
      if(ball < d){ d = ball; m = 4; }
      // face: big bead eyes with catch-lights, a small smile, soft cheeks
      if(z > 0.12 && y > -0.2 && y < 0.3 && Math.abs(x) < 0.4){
        for(const e of EYES){
          const fz = faceZ(e[0], e[1]);
          const eye = C.SD.ellipsoid(x - e[0], y - e[1], z - (fz - 0.03), 0.082, 0.098, 0.055);
          if(eye < d){ d = eye; m = 5; }
          const hl = C.SD.sphere(x - e[0] + 0.03, y - e[1] - 0.036, z - (fz + 0.018), 0.022);
          if(hl < d){ d = hl; m = 7; }
          const cz = faceZ(e[0] * 1.68, -0.035);
          const cheek = C.SD.ellipsoid(x - e[0] * 1.68, y + 0.035, z - (cz - 0.018), 0.046, 0.03, 0.022);
          if(cheek < d){ d = cheek; m = 6; }
        }
        const sm = smile(x, y, z);
        if(sm < d){ d = sm; m = 5; }
      }
      if(rec) rec.m = m;
      return d;
    }
  };
}

module.exports = { build: build, BALL: BALL, BALL_R: BALL_R };
