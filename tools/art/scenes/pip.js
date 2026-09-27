'use strict';
/* PIP — the guide: an original satellite buddy, sculpted. A warm-yellow
   capsule body with an orange band, two chunky teal solar-panel wings on
   short arms, an antenna with a glassy ball (the app lights it while Pip
   speaks), bead eyes with a tiny catch-light, a pressed-on smile, soft
   cheeks and two little feet. Slightly asymmetric, as a hand-made figure
   is: the antenna leans, one wing tilts a touch more than the other.

   Silhouette rule (docs/ART-DIRECTION.md): body + two panel wings +
   antenna. Never a star with a face, a pink ball, a white egg with a
   visor, or an owl. */
const C = require('../clay.js');
const { len2, len3, smin, hex, clamp } = C;

const BODY_R = 0.36, BODY_HALF = 0.19, DEPTH = 0.84;
const BAND_TOP = -0.13, BAND_BOTTOM = -0.3;
const FACE_Z = 0.27;

function body(x, y, z){
  // a capsule, a little shallower front to back
  return C.SD.capsule(x, y, z / DEPTH, 0, -BODY_HALF, 0, 0, BODY_HALF, 0, BODY_R) * DEPTH;
}
function seams(y){
  const g = (t) => Math.exp(-((y - t) / 0.01) * ((y - t) / 0.01));
  return 0.006 * (g(BAND_TOP) + g(BAND_BOTTOM));
}
/* A pressed-in smile: a short arc of dark clay lying on the face. */
function smile(x, y, z){
  const cx = 0.0, cy = 0.035, R = 0.085;
  let a = Math.atan2(y - cy, x - cx);
  // the lower arc, from about 205° to 335°
  const a1 = -2.55, a2 = -0.6;
  if(a > 0) a = a > Math.PI / 2 ? a1 : a2;
  a = clamp(a, a1, a2);
  const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
  const sz = Math.sqrt(Math.max(BODY_R * BODY_R - px * px, 0)) * DEPTH - 0.004;
  return len3(x - px, y - py, z - sz) - 0.019;
}
/* A solar-panel wing, in its own frame, with a pressed cross of grooves. */
function panel(lx, ly, lz){
  const d = C.SD.roundBox(lx, ly, lz, 0.25, 0.27, 0.045, 0.035);
  if(d > 0.02) return d;
  const gx = Math.exp(-(lx / 0.012) * (lx / 0.012)), gy = Math.exp(-(ly / 0.012) * (ly / 0.012));
  return d + 0.012 * Math.max(gx, gy) * (lz > 0 ? 1 : 0.2);
}

const EYES = [[-0.135, 0.1], [0.135, 0.1]];

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
  const frameW = icon ? 2.62 : 2.36, frameH = frameW * H / W;
  const D = 12;
  const cy = icon ? 0.08 : 0.14;
  return {
    width: W, height: H, scale: 1, seed: 51, spp: 3, aoRange: 0.07, fillsFrame: icon,
    background: icon ? function(dx, dy, dz, px, py){ return iconBackground(dx, dy, dz, px, py, this.width, this.height); } : null,
    camera: { pos: [0, cy + 0.18, D], target: [0, cy, 0], fov: 2 * Math.atan((frameH / 2) / D) * 180 / Math.PI },
    bounds: { center: [0, 0.1, 0], radius: 1.25 },
    materials: [
      C.clay({ albedo: hex('#FFC43D'), rim: 0.45 }),                                // 0 body
      C.clay({ albedo: hex('#FF8A2A'), rim: 0.45 }),                                // 1 band, feet
      C.clay({ albedo: hex('#27B3C3'), stroke: 0.0016 }),                           // 2 panels
      C.clay({ albedo: hex('#9D93D6') }),                                           // 3 arms, stalk
      C.clay({ albedo: hex('#EEF4FF'), spec: 0.9, specPow: 45, sheen: 0.3, grain: 0.0002, stroke: 0, prints: 0 }), // 4 antenna ball
      C.clay({ albedo: hex('#1B1F3B'), spec: 1.4, specPow: 60, sheen: 0.05, grain: 0.0001, stroke: 0, prints: 0 }), // 5 eyes, smile
      C.clay({ albedo: hex('#FF9EAE'), grain: 0.0006, stroke: 0.0006 }),            // 6 cheeks
      C.clay({ albedo: hex('#FFFFFF'), grain: 0, stroke: 0, prints: 0, spec: 0.3, emissive: [0.35, 0.35, 0.35] }) // 7 catch-lights
    ],
    map(x, y, z, rec){
      let d = body(x, y, z) + seams(y);
      let m = (y < BAND_TOP && y > BAND_BOTTOM) ? 1 : 0;
      // feet
      for(const s of [-1, 1]){
        const f = C.SD.ellipsoid(x - s * 0.13, y + 0.56, z - 0.02, 0.085, 0.06, 0.1);
        if(f < d + 0.03){ const b = smin(d, f, 0.03); if(f < d) m = 1; d = b; }
      }
      // arms and wings; the left wing tilts a little more (hand-made)
      for(const s of [-1, 1]){
        const arm = C.SD.capsule(x, y, z, s * 0.3, -0.03, 0, s * 0.58, -0.03, 0, 0.042);
        if(arm < d){ d = smin(d, arm, 0.02); if(arm <= d + 0.004) m = 3; }
        const yaw = s * 0.3, roll = s < 0 ? 0.07 : -0.03;
        const px = x - s * 0.83, py = y + 0.03, pz = z - 0.04;
        const cyw = Math.cos(yaw), syw = Math.sin(yaw);
        let lx = px * cyw + pz * syw, lz = -px * syw + pz * cyw;
        const cr = Math.cos(roll), sr = Math.sin(roll);
        const ly = py * cr - lx * sr; lx = lx * cr + py * sr;
        const p = panel(lx, ly, lz);
        if(p < d){ d = p; m = 2; }
      }
      // antenna: a leaning stalk and the ball the app lights
      const stalk = C.SD.capsule(x, y, z, 0, BODY_HALF + BODY_R - 0.05, 0, 0.04, 0.78, 0.0, 0.022);
      if(stalk < d){ d = smin(d, stalk, 0.02); if(stalk <= d + 0.004) m = 3; }
      const ball = C.SD.sphere(x - 0.045, y - 0.83, z, 0.07);
      if(ball < d){ d = ball; m = 4; }
      // face: bead eyes with catch-lights, a smile, cheeks
      if(z > 0.1 && y > -0.15 && y < 0.3 && Math.abs(x) < 0.36){
        for(const e of EYES){
          const eye = C.SD.ellipsoid(x - e[0], y - e[1], z - (FACE_Z - 0.025), 0.07, 0.082, 0.05);
          if(eye < d){ d = eye; m = 5; }
          const hl = C.SD.sphere(x - e[0] + 0.024, y - e[1] - 0.03, z - (FACE_Z + 0.018), 0.017);
          if(hl < d){ d = hl; m = 7; }
          const cheek = C.SD.ellipsoid(x - e[0] * 1.72, y - e[1] + 0.105, z - (FACE_Z - 0.052), 0.055, 0.036, 0.03);
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

module.exports = { build: build };
