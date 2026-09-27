'use strict';
/* =========================================================
   CLAY — Space Kindergarten's procedural clay renderer
   ---------------------------------------------------------
   Every picture of the child's world is sculpted here as a
   signed distance field, then shaded as matte modelling clay
   under ONE light rig. Nothing is drawn by hand and nothing is
   traced, so each render is original, and every asset is lit by
   the same world: the key light from the upper left, cool space
   ambient, a cyan rim from behind, and warm light only where a
   beacon, a star or a flame gives it.

   Deterministic: the same scene file always renders the same
   pixels. No dependencies: Node's zlib writes the PNG.

   This is computer-rendered clay, not a sculpture photographed
   on a set. Its output is DRAFT art until a person signs it off.
   ========================================================= */
const zlib = require('zlib');

/* ---------- small math ---------- */
function clamp(x, a, b){ return x < a ? a : (x > b ? b : x); }
function mix(a, b, t){ return a + (b - a) * t; }
function smoothstep(a, b, x){ const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function len2(x, y){ return Math.sqrt(x * x + y * y); }
function len3(x, y, z){ return Math.sqrt(x * x + y * y + z * z); }
function norm3(v){ const l = len3(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function dot3(a, b){ return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b){ return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

/* Light adds up in linear space, so every colour is converted on the way in
   and converted back only when the pixel is written. */
function srgbToLinear(c){ return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function linearToSrgb(c){ return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
function hex(h){
  const n = parseInt(h.slice(1), 16);
  return [srgbToLinear(((n >> 16) & 255) / 255), srgbToLinear(((n >> 8) & 255) / 255), srgbToLinear((n & 255) / 255)];
}
function scale3(c, k){ return [c[0] * k, c[1] * k, c[2] * k]; }
function mix3(a, b, t){ return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]; }

/* ---------- seeded randomness and noise ---------- */
function rng(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Improved Perlin gradient noise, seeded, roughly in [-1, 1]. */
function makeNoise(seed){
  const r = rng(seed);
  const p = new Uint8Array(256);
  for(let i = 0; i < 256; i++) p[i] = i;
  for(let i = 255; i > 0; i--){ const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  const perm = new Uint8Array(512);
  for(let i = 0; i < 512; i++) perm[i] = p[i & 255];
  function grad(h, x, y, z){
    switch(h & 15){
      case 0: return x + y;   case 1: return -x + y;  case 2: return x - y;   case 3: return -x - y;
      case 4: return x + z;   case 5: return -x + z;  case 6: return x - z;   case 7: return -x - z;
      case 8: return y + z;   case 9: return -y + z;  case 10: return y - z;  case 11: return -y - z;
      case 12: return x + y;  case 13: return -x + y; case 14: return -y + z; default: return -y - z;
    }
  }
  return function noise(x, y, z){
    const xf = Math.floor(x), yf = Math.floor(y), zf = Math.floor(z);
    const X = xf & 255, Y = yf & 255, Z = zf & 255;
    x -= xf; y -= yf; z -= zf;
    const u = x * x * x * (x * (x * 6 - 15) + 10);
    const v = y * y * y * (y * (y * 6 - 15) + 10);
    const w = z * z * z * (z * (z * 6 - 15) + 10);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    const x1 = mix(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u);
    const x2 = mix(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u);
    const x3 = mix(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u);
    const x4 = mix(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u);
    return mix(mix(x1, x2, v), mix(x3, x4, v), w);
  };
}
function fbm(noise, x, y, z, octaves){
  let s = 0, a = 0.5, f = 1;
  for(let i = 0; i < octaves; i++){ s += a * noise(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
  return s;
}

/* ---------- distance-field shapes (all scalar, nothing allocated) ---------- */
const SD = {
  sphere(x, y, z, r){ return len3(x, y, z) - r; },
  /* Close to exact near the surface, which is where it matters. */
  ellipsoid(x, y, z, a, b, c){
    const k0 = len3(x / a, y / b, z / c);
    const k1 = len3(x / (a * a), y / (b * b), z / (c * c));
    return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(a, b, c);
  },
  roundBox(x, y, z, bx, by, bz, r){
    const qx = Math.abs(x) - bx + r, qy = Math.abs(y) - by + r, qz = Math.abs(z) - bz + r;
    return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
  },
  capsule(x, y, z, ax, ay, az, bx, by, bz, r){
    const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
    const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
    return len3(pax - bax * h, pay - bay * h, paz - baz * h) - r;
  },
  /* A ring lying flat, around the y axis. */
  torus(x, y, z, R, r){ const q = len2(x, z) - R; return len2(q, y) - r; },
  /* A cylinder along y with rounded rims: radius ra, half-height h, rim rounding rb. */
  roundCylinder(x, y, z, ra, h, rb){
    const dx = len2(x, z) - ra + rb, dy = Math.abs(y) - h + rb;
    return Math.min(Math.max(dx, dy), 0) + len2(Math.max(dx, 0), Math.max(dy, 0)) - rb;
  },
  /* A cone with round ends between any two points a (radius r1) and b (r2). */
  roundCone2(x, y, z, ax, ay, az, bx, by, bz, r1, r2){
    const bax = bx - ax, bay = by - ay, baz = bz - az;
    const l2 = bax * bax + bay * bay + baz * baz;
    const rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
    const pax = x - ax, pay = y - ay, paz = z - az;
    const yy = pax * bax + pay * bay + paz * baz, z0 = yy - l2;
    const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
    const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = z0 * z0 * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if(Math.sign(z0) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if(Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  },
  /* A cone along y with round ends: radius r1 at y = 0, radius r2 at y = h. */
  roundCone(x, y, z, r1, r2, h){
    const qx = len2(x, z), qy = y;
    const b = (r1 - r2) / h, a = Math.sqrt(1 - b * b);
    const k = -qx * b + qy * a;
    if(k < 0) return len2(qx, qy) - r1;
    if(k > a * h) return len2(qx, qy - h) - r2;
    return qx * a + qy * b - r1;
  },
  /* A convex or concave polygon in 2D (vertices as [x0, y0, x1, y1, …]). */
  poly2(x, y, v){
    const n = v.length / 2;
    let d = (x - v[0]) * (x - v[0]) + (y - v[1]) * (y - v[1]);
    let s = 1;
    for(let i = 0, j = n - 1; i < n; j = i, i++){
      const ex = v[j * 2] - v[i * 2], ey = v[j * 2 + 1] - v[i * 2 + 1];
      const wx = x - v[i * 2], wy = y - v[i * 2 + 1];
      const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
      const bx = wx - ex * t, by = wy - ey * t;
      d = Math.min(d, bx * bx + by * by);
      const c1 = y >= v[i * 2 + 1], c2 = y < v[j * 2 + 1], c3 = ex * wy > ey * wx;
      if((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  },
  /* Give a 2D shape thickness h (half) along a third axis w, rounded by r. */
  extrude(d2, w, h, r){
    const qx = d2 + r, qy = Math.abs(w) - h + r;
    return Math.min(Math.max(qx, qy), 0) + len2(Math.max(qx, 0), Math.max(qy, 0)) - r;
  },
  /* A five-point star in the xy plane (exact 2D distance). */
  star2(x, y, r, rf){
    const k1x = 0.809016994375, k1y = -0.587785252292;
    const k2x = -k1x, k2y = k1y;
    x = Math.abs(x);
    let d = 2 * Math.max(k1x * x + k1y * y, 0); x -= d * k1x; y -= d * k1y;
    d = 2 * Math.max(k2x * x + k2y * y, 0); x -= d * k2x; y -= d * k2y;
    x = Math.abs(x);
    y -= r;
    const bax = rf * -k1y - 0, bay = rf * k1x - 1;
    const h = clamp((x * bax + y * bay) / (bax * bax + bay * bay), 0, r);
    const dx = x - bax * h, dy = y - bay * h;
    return len2(dx, dy) * Math.sign(dy * bax - dx * bay);
  }
};
/* Soft union: two lumps of clay pressed together leave a smooth seam. */
function smin(a, b, k){ const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); }
function smax(a, b, k){ return -smin(-a, -b, k); }

/* =========================================================
   THE LIGHT RIG — one world, one light
   Every asset imports this; none defines its own. A contract
   fails if a scene file declares a key or rim light.
     key     a large, soft studio light, upper left and in front
     fill    a cool, gentle front fill, so faces stay bright and
             friendly while the world around them can be dark
     ambient cool space blue from above, near-black from below
     rim     a controlled cyan edge, from behind and to the right
     bounce  faint lavender from below, as if off a surface
   Warm light comes only from things in the world that glow.
   Phase 2 softened it: a bigger key (softer shadows), more fill,
   and a thinner rim — premium studio light, not drama.
   ========================================================= */
const RIG = {
  key:    { dir: norm3([-0.6, 0.63, 0.46]), color: [1.0, 0.94, 0.86], intensity: 1.2, softness: 3.2 },
  fill:   { dir: norm3([0.55, 0.12, 0.83]), color: [0.58, 0.66, 0.9], intensity: 0.42 },
  ambient:{ up: [0.13, 0.17, 0.34], down: [0.03, 0.035, 0.08], intensity: 1.4 },
  rim:    { dir: norm3([0.8, 0.26, -0.54]), color: [0.3, 0.7, 1.0], intensity: 2.3, power: 3.0 },
  bounce: { dir: norm3([0.2, -1, 0.3]), color: [0.16, 0.14, 0.26], intensity: 0.5 },
  exposure: 1.0
};

/* ---------- materials ---------- */
/* A clay material. Only albedo is required; the rest default to the house
   clay so every asset shares one surface.
   Phase 2: smooth, sculpted plasticine — texture is barely there. Grain
   and strokes are a whisper, fingerprints are off unless a scene asks for
   them where they help the material read. Clean colour blocking and
   clean silhouettes do the work, not surface noise. */
function clay(opts){
  return Object.assign({
    albedo: [0.5, 0.5, 0.5],
    wrap: 0.42,          // light reaching round the terminator: soft, waxy
    sss: 0.45,           // saturated colour in the terminator band
    spec: 0.05,          // the soft sheen of smoothed plasticine
    specPow: 14,
    sheen: 0.05,         // velvety brightening at grazing angles
    rim: 1,              // how much cyan rim a colour takes (warm clay takes less:
                         // cyan light on yellow clay reads olive)
    grain: 0.00018,      // fine surface grain, in scene units
    stroke: 0.0006,      // smoothing marks from a thumb or a tool
    prints: 0,           // faint ridge patches: off unless a scene asks
    lump: 1,             // multiplier on the scene's lumpiness
    emissive: null,      // linear RGB, for things that glow
    paint: false,        // part of the rocket that takes a paint colour
    catcher: false       // invisible floor that only receives a shadow
  }, opts || {});
}

/* ---------- the camera ---------- */
function makeCamera(cam, W, H){
  const f = norm3([cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]]);
  const r = norm3(cross3(f, cam.up || [0, 1, 0]));
  const u = cross3(r, f);
  return { pos: cam.pos, f: f, r: r, u: u, th: Math.tan((cam.fov * Math.PI / 180) / 2), aspect: W / H, W: W, H: H };
}

/* =========================================================
   THE RENDERER
   A scene is { width, height, camera, bounds, materials, map,
   albedoAt?, background?, points?, scale }. map(x, y, z, rec)
   returns the distance to the nearest surface and, when rec is
   given, sets rec.m to the index of the material there.
   ========================================================= */
function makeRenderer(scene){
  const W = scene.width, H = scene.height;
  const cam = makeCamera(scene.camera, W, H);
  const map = scene.map;
  const S = scene.scale || 1;                   // size of the main object, in scene units
  const mats = scene.materials;
  const detailNoise = makeNoise((scene.seed || 7) + 101);
  const rec = { m: 0 };
  const EPS = 0.00035 * S;
  const MAX_STEPS = scene.maxSteps || 220;
  const STEP = scene.stepScale || 0.85;
  const bc = scene.bounds.center, br = scene.bounds.radius;
  const points = scene.points || [];            // warm local lights: { pos, color, intensity, radius }

  function raySphere(ox, oy, oz, dx, dy, dz){
    const lx = ox - bc[0], ly = oy - bc[1], lz = oz - bc[2];
    const b = lx * dx + ly * dy + lz * dz;
    const c = lx * lx + ly * ly + lz * lz - br * br;
    const disc = b * b - c;
    if(disc < 0) return null;
    const s = Math.sqrt(disc);
    return [Math.max(-b - s, 0), -b + s];
  }

  function march(ox, oy, oz, dx, dy, dz, t0, t1){
    let t = t0;
    for(let i = 0; i < MAX_STEPS; i++){
      const d = map(ox + dx * t, oy + dy * t, oz + dz * t, null);
      if(d < EPS * (1 + t * 0.15)) return t;
      t += d * STEP;
      if(t > t1) return -1;
    }
    return -1;
  }

  function normalAt(x, y, z){
    const e = 0.0006 * S;
    const a = map(x + e, y - e, z - e, null), b = map(x - e, y - e, z + e, null);
    const c = map(x - e, y + e, z - e, null), d = map(x + e, y + e, z + e, null);
    return norm3([a - b - c + d, -a - b + c + d, -a + b - c + d]);
  }

  /* The clay surface itself: fine grain, smoothing strokes in patches, and
     faint ridges where a thumb pressed. Bump only — the silhouette stays
     clean, as a sculptor's would. */
  function clayHeight(x, y, z, m){
    const s = S;
    // grain: one soft octave only — a plasticine surface, not sandpaper
    let h = m.grain * detailNoise(x * 70 / s, y * 70 / s, z * 70 / s);
    // strokes: long, soft smoothing marks in a slow swirl, only in patches
    const sw = detailNoise(x * 1.3 / s + 3.1, y * 1.3 / s, z * 1.3 / s) * 2.2;
    const ca = Math.cos(sw), sa = Math.sin(sw);
    const a1 = (x * ca + y * sa) / s, a2 = (y * ca - x * sa) / s;
    const strokeMask = smoothstep(0.05, 0.5, detailNoise(x * 1.8 / s + 9, y * 1.8 / s, z * 1.8 / s + 4));
    h += m.stroke * strokeMask * detailNoise(a1 * 2.4, a2 * 12, z * 12 / s);
    // prints: fine parallel ridges, only in a few small patches
    if(m.prints > 0){
      const pm = smoothstep(0.32, 0.5, detailNoise(x * 3.3 / s - 5, y * 3.3 / s + 2, z * 3.3 / s));
      if(pm > 0){
        const warp = detailNoise(x * 6 / s, y * 6 / s, z * 6 / s) * 2.5;
        h += m.prints * pm * Math.sin((x * 0.6 + y * 0.8 + z * 0.3) * 150 / s + warp * 3);
      }
    }
    return h;
  }

  function bumped(n, x, y, z, m){
    if(m.grain <= 0 && m.stroke <= 0 && m.prints <= 0) return n;
    const e = 0.0012 * S;
    const h0 = clayHeight(x, y, z, m);
    const gx = (clayHeight(x + e, y, z, m) - h0) / e;
    const gy = (clayHeight(x, y + e, z, m) - h0) / e;
    const gz = (clayHeight(x, y, z + e, m) - h0) / e;
    const gn = gx * n[0] + gy * n[1] + gz * n[2];
    return norm3([n[0] - (gx - gn * n[0]), n[1] - (gy - gn * n[1]), n[2] - (gz - gn * n[2])]);
  }

  /* Contact darkening in creases and under overhangs. Short range on
     purpose: a cloud floating above the sea should shade it, not black it. */
  const AO_RANGE = (scene.aoRange || 0.1) * S;
  function ambientOcclusion(x, y, z, n){
    let occ = 0, w = 1;
    for(let i = 1; i <= 5; i++){
      const h = 0.004 * S + AO_RANGE * (i / 5) * (i / 5);
      const d = map(x + n[0] * h, y + n[1] * h, z + n[2] * h, null);
      occ += (h - d) * w;
      w *= 0.75;
    }
    return clamp(1 - 3.5 * occ / AO_RANGE * 0.1, 0, 1);
  }

  /* Some small props (a beacon on the Moon) read better without the long
     shadow a low sun would give them; a scene can leave them out. */
  const shadowMap = scene.shadowMap || map;
  function softShadow(x, y, z, L, k){
    let res = 1, t = 0.012 * S, ph = 1e9;
    for(let i = 0; i < 64; i++){
      const h = shadowMap(x + L[0] * t, y + L[1] * t, z + L[2] * t, null);
      if(h < 0.0002 * S) return 0;
      const yy = h * h / (2 * ph);
      const dd = Math.sqrt(Math.max(h * h - yy * yy, 0));
      res = Math.min(res, k * dd / Math.max(0.0001, t - yy));
      ph = h;
      t += clamp(h, 0.006 * S, 0.25 * S);
      if(res < 0.002 || t > 4 * S) break;
    }
    res = clamp(res, 0, 1);
    return res * res * (3 - 2 * res);
  }

  const key = RIG.key, rim = RIG.rim, amb = RIG.ambient, bnc = RIG.bounce, fil = RIG.fill;
  const keyI = key.intensity * (scene.keyScale || 1);

  /* One shaded sample. Writes linear RGB into out[0..2]. */
  function shade(x, y, z, n, vx, vy, vz, m, albedo, out){
    const nv = Math.max(n[0] * vx + n[1] * vy + n[2] * vz, 0);
    const ao = ambientOcclusion(x, y, z, n);
    const ndl = dot3(n, key.dir);
    const sh = ndl > -m.wrap ? softShadow(x + n[0] * 0.002 * S, y + n[1] * 0.002 * S, z + n[2] * 0.002 * S, key.dir, key.softness) : 0;
    const wrapD = Math.max(0, (ndl + m.wrap) / (1 + m.wrap)) * sh;
    // the saturated band at the terminator that makes clay read as clay
    const band = smoothstep(-m.wrap, 0.12, ndl) * (1 - smoothstep(0.12, 0.62, ndl)) * m.sss * sh;
    const hemi = 0.5 + 0.5 * n[1];
    const ar = mix(amb.down[0], amb.up[0], hemi) * ao, ag = mix(amb.down[1], amb.up[1], hemi) * ao, ab = mix(amb.down[2], amb.up[2], hemi) * ao;
    const bd = Math.max(0, (dot3(n, bnc.dir) + 0.4) / 1.4) * bnc.intensity * ao;
    // the soft front fill: no shadow, just keeping the side facing us friendly
    const fd = Math.max(0, (dot3(n, fil.dir) + 0.35) / 1.35) * fil.intensity * (0.5 + 0.5 * ao);
    const fres = Math.pow(1 - nv, rim.power);
    const rimD = Math.max(0, (dot3(n, rim.dir) + 0.45) / 1.45) * fres * rim.intensity * (0.35 + 0.65 * ao) * m.rim;
    // waxy sheen, from the key only
    const hx = key.dir[0] + vx, hy = key.dir[1] + vy, hz = key.dir[2] + vz;
    const hl = len3(hx, hy, hz) || 1;
    const sp = Math.pow(Math.max((n[0] * hx + n[1] * hy + n[2] * hz) / hl, 0), m.specPow) * m.spec * sh * keyI;
    const sheen = m.sheen * Math.pow(1 - nv, 3) * ao;

    for(let c = 0; c < 3; c++){
      const alb = albedo[c];
      let v = alb * (key.color[c] * wrapD * keyI + (c === 0 ? ar : c === 1 ? ag : ab) * amb.intensity + bnc.color[c] * bd + fil.color[c] * fd);
      v += alb * alb * key.color[c] * band * keyI * 0.9;
      v += rim.color[c] * rimD * mix(alb, 1, 0.3);
      v += key.color[c] * sp;
      v += rim.color[c] * sheen * 0.6 + key.color[c] * sheen * 0.25;
      out[c] = v;
    }
    // warm accents from things in the world that glow
    for(let i = 0; i < points.length; i++){
      const P = points[i];
      const lx = P.pos[0] - x, ly = P.pos[1] - y, lz = P.pos[2] - z;
      const dist = len3(lx, ly, lz) || 1e-6;
      const nd = (n[0] * lx + n[1] * ly + n[2] * lz) / dist;
      const fall = P.intensity / (1 + (dist / P.radius) * (dist / P.radius));
      const d = Math.max(0, (nd + 0.3) / 1.3) * fall * (0.4 + 0.6 * ao);
      for(let c = 0; c < 3; c++) out[c] += albedo[c] * P.color[c] * d + P.color[c] * d * 0.04;
    }
    const em = emissionAt(x, y, z, m);
    if(em){ for(let c = 0; c < 3; c++) out[c] += em[c]; }
  }
  /* Emission can vary across a surface (a warm glow in a crater floor), so
     a scene may compute it; otherwise it is the material's own. */
  function emissionAt(x, y, z, m){
    return scene.emissiveAt ? scene.emissiveAt(x, y, z, rec.m, m) : m.emissive;
  }

  const col = [0, 0, 0];
  const fog = scene.fog || null;
  /* Renders row y into buf (W * CH floats):
       0-2 premultiplied colour, 3 coverage, 4-6 emission, 7 paint coverage */
  function renderRow(y, spp, buf){
    const CH = 8;
    const n2 = spp * spp;
    if(scene.pixel){
      // a flat picture (the starfield): no geometry, just a colour per
      // sample, in 0–1 coordinates so any output size frames the same sky
      const k = W / (scene.designWidth || W);
      for(let x = 0; x < W; x++){
        let r = 0, g = 0, b = 0, a = 0;
        for(let s = 0; s < n2; s++){
          const px = scene.pixel((x + (s % spp + 0.5) / spp) / W, (y + (Math.floor(s / spp) + 0.5) / spp) / H, k);
          r += px[0] * px[3]; g += px[1] * px[3]; b += px[2] * px[3]; a += px[3];
        }
        const o = x * CH;
        buf[o] = r / n2; buf[o + 1] = g / n2; buf[o + 2] = b / n2; buf[o + 3] = a / n2;
        buf[o + 4] = buf[o + 5] = buf[o + 6] = buf[o + 7] = 0;
      }
      return;
    }
    for(let x = 0; x < W; x++){
      let r = 0, g = 0, b = 0, a = 0, er = 0, eg = 0, eb = 0, pc = 0;
      for(let s = 0; s < n2; s++){
        // rotated-grid supersampling: fewer staircase artefacts than a plain grid
        const sx = (s % spp + 0.5) / spp, sy = (Math.floor(s / spp) + 0.5) / spp;
        const jx = sx + (sy - 0.5) * 0.25, jy = sy - (sx - 0.5) * 0.25;
        const ndx = (2 * (x + jx) / W - 1) * cam.th * cam.aspect;
        const ndy = (1 - 2 * (y + jy) / H) * cam.th;
        let dx = cam.f[0] + cam.r[0] * ndx + cam.u[0] * ndy;
        let dy = cam.f[1] + cam.r[1] * ndx + cam.u[1] * ndy;
        let dz = cam.f[2] + cam.r[2] * ndx + cam.u[2] * ndy;
        const dl = len3(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        const ox = cam.pos[0], oy = cam.pos[1], oz = cam.pos[2];
        const span = raySphere(ox, oy, oz, dx, dy, dz);
        const t = span ? march(ox, oy, oz, dx, dy, dz, span[0], span[1]) : -1;
        if(t < 0){
          if(scene.background){
            const bg = scene.background(dx, dy, dz, x + jx, y + jy);
            if(bg){ r += bg[0] * bg[3]; g += bg[1] * bg[3]; b += bg[2] * bg[3]; a += bg[3]; }
          }
          continue;
        }
        const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
        map(px, py, pz, rec);
        const m = mats[rec.m];
        let n = normalAt(px, py, pz);
        if(m.catcher){
          // an invisible floor: only the shadow and the contact darkening
          // show, fading out well before the frame edge so no line is cut
          const ao = ambientOcclusion(px, py, pz, n);
          const sh = softShadow(px + n[0] * 0.002 * S, py + n[1] * 0.002 * S, pz + n[2] * 0.002 * S, key.dir, key.softness);
          const fc = m.fadeCenter || [0, 0], fr = m.fadeRadius || 1e9;
          const fade = smoothstep(fr, fr * 0.35, len2(px - fc[0], pz - fc[1]));
          const dark = clamp((1 - sh) * 0.6 + (1 - ao) * 0.55, 0, 1) * (m.strength || 1) * fade;
          r += m.albedo[0] * dark; g += m.albedo[1] * dark; b += m.albedo[2] * dark; a += dark;
          continue;
        }
        n = bumped(n, px, py, pz, m);
        const albedo = scene.albedoAt ? scene.albedoAt(px, py, pz, rec.m, m) : m.albedo;
        shade(px, py, pz, n, -dx, -dy, -dz, m, albedo, col);
        if(fog){
          // distance haze: far ground melts into cool space, which sells depth
          const f = smoothstep(fog.near, fog.far, t) * fog.max;
          for(let c = 0; c < 3; c++) col[c] = mix(col[c], fog.color[c], f);
        }
        r += col[0]; g += col[1]; b += col[2]; a += 1;
        const em = emissionAt(px, py, pz, m);
        if(em){ er += em[0]; eg += em[1]; eb += em[2]; }
        if(m.paint) pc += 1;
      }
      const o = x * CH;
      buf[o] = r / n2; buf[o + 1] = g / n2; buf[o + 2] = b / n2; buf[o + 3] = a / n2;
      buf[o + 4] = er / n2; buf[o + 5] = eg / n2; buf[o + 6] = eb / n2; buf[o + 7] = pc / n2;
    }
  }

  return { renderRow: renderRow, CH: 8 };
}

/* =========================================================
   POST — glow, atmosphere, depth of field, then pixels
   All buffers are premultiplied linear RGBA plus extras.
   ========================================================= */
function boxBlur(src, W, H, stride, ch, radius){
  // three box passes approximate a gaussian; separable, in place via a temp
  const out = new Float32Array(W * H);
  for(let i = 0; i < W * H; i++) out[i] = src[i * stride + ch];
  const tmp = new Float32Array(W * H);
  const r = Math.max(1, Math.round(radius / 1.8));
  for(let pass = 0; pass < 3; pass++){
    for(let y = 0; y < H; y++){
      let acc = 0; const row = y * W;
      for(let x = -r; x <= r; x++) acc += out[row + clamp(x, 0, W - 1)];
      for(let x = 0; x < W; x++){
        tmp[row + x] = acc / (2 * r + 1);
        acc += out[row + clamp(x + r + 1, 0, W - 1)] - out[row + clamp(x - r, 0, W - 1)];
      }
    }
    for(let x = 0; x < W; x++){
      let acc = 0;
      for(let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, H - 1) * W + x];
      for(let y = 0; y < H; y++){
        out[y * W + x] = acc / (2 * r + 1);
        acc += tmp[clamp(y + r + 1, 0, H - 1) * W + x] - tmp[clamp(y - r, 0, H - 1) * W + x];
      }
    }
  }
  return out;
}

/* Light that spills out of glowing things: bloom from the emission buffer. */
function addGlow(buf, W, H, CH, radius, strength){
  const R = boxBlur(buf, W, H, CH, 4, radius), G = boxBlur(buf, W, H, CH, 5, radius), B = boxBlur(buf, W, H, CH, 6, radius);
  for(let i = 0; i < W * H; i++){
    const gr = R[i] * strength, gg = G[i] * strength, gb = B[i] * strength;
    const o = i * CH;
    const lum = Math.min(1, (gr * 0.3 + gg * 0.55 + gb * 0.15) * 1.6);
    buf[o] += gr; buf[o + 1] += gg; buf[o + 2] += gb;
    buf[o + 3] = 1 - (1 - buf[o + 3]) * (1 - lum);
  }
}

/* A soft coloured halo behind a silhouette: atmosphere, or the glow of a
   lit moon. Composited UNDER the object, so it never veils it. */
function addHalo(buf, W, H, CH, o){
  const shifted = new Float32Array(W * H * CH);
  const sx = Math.round((o.shiftX || 0) * W), sy = Math.round((o.shiftY || 0) * H);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const xx = clamp(x - sx, 0, W - 1), yy = clamp(y - sy, 0, H - 1);
    shifted[(y * W + x) * CH + 3] = buf[(yy * W + xx) * CH + 3];
  }
  const mask = boxBlur(shifted, W, H, CH, 3, o.radius);
  for(let i = 0; i < W * H; i++){
    const p = i * CH;
    const ha = clamp(mask[i] * o.strength, 0, 1) * (1 - buf[p + 3]);
    buf[p] += o.color[0] * ha; buf[p + 1] += o.color[1] * ha; buf[p + 2] += o.color[2] * ha;
    buf[p + 3] += ha;
  }
}

/* An atmosphere for a sphere: a soft ring just outside its disc, stronger
   on the rim-lit side. Drawn from the disc itself, not the render's
   outline, so clouds that break the silhouette do not grow a halo. */
function addDiskHalo(buf, W, H, CH, o){
  const cx = o.cx * W, cy = o.cy * H, r = o.r * H, w = o.width * r;
  const rimA = Math.atan2(-(o.towardY || 0), o.towardX || 1);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if(d < r * 0.9) continue;
    const fall = d < r ? 1 : Math.exp(-(d - r) / w);
    const side = 0.55 + 0.45 * Math.max(0, Math.cos(Math.atan2(dy, dx) - rimA));
    const p = (y * W + x) * CH;
    const ha = clamp(fall * side * o.strength, 0, 1) * (1 - buf[p + 3]);
    if(ha <= 0) continue;
    buf[p] += o.color[0] * ha; buf[p + 1] += o.color[1] * ha; buf[p + 2] += o.color[2] * ha;
    buf[p + 3] += ha;
  }
}

/* Out of focus: for things far behind the action. */
function blurAll(buf, W, H, CH, radius){
  for(let c = 0; c < 4; c++){
    const b = boxBlur(buf, W, H, CH, c, radius);
    for(let i = 0; i < W * H; i++) buf[i * CH + c] = b[i];
  }
}

/* Tone curve: linear through the mid-tones, so a clay colour stays the
   colour it was mixed as, then a smooth shoulder instead of clipped whites.
   (A filmic ACES curve was tried first; it washed saturated clay pastel.) */
function tone(x){
  const t = 0.7;
  if(x <= t) return x < 0 ? 0 : x;
  const k = 1 - t;
  return t + k * (1 - Math.exp(-(x - t) / k));
}

/* Premultiplied linear → straight sRGB bytes, with a whisper of dither so
   dark space gradients do not band. */
function toRGBA8(buf, W, H, CH, exposure, ditherSeed){
  const out = new Uint8Array(W * H * 4);
  const r = rng(ditherSeed || 1);
  for(let i = 0; i < W * H; i++){
    const p = i * CH, a = clamp(buf[p + 3], 0, 1);
    const o = i * 4;
    if(a <= 0.0005){ out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0; continue; }
    const d = (r() - r()) * 0.6;
    for(let c = 0; c < 3; c++){
      const v = linearToSrgb(tone((buf[p + c] / a) * (exposure || 1)));
      out[o + c] = clamp(Math.round(v * 255 + d), 0, 255);
    }
    out[o + 3] = clamp(Math.round(a * 255), 0, 255);
  }
  return out;
}

/* ---------- PNG (RGBA, 8-bit), with zlib from Node ---------- */
const CRC_TABLE = (function(){
  const t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf){ let c = 0xFFFFFFFF; for(let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(rgba, W, H){
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for(let y = 0; y < H; y++){
    const ro = y * (W * 4 + 1);
    raw[ro] = 1; // Sub filter: cheap, and much smaller for smooth renders
    for(let x = 0; x < W * 4; x++){
      const v = rgba[y * W * 4 + x];
      const left = x >= 4 ? rgba[y * W * 4 + x - 4] : 0;
      raw[ro + 1 + x] = (v - left) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

module.exports = {
  clamp, mix, smoothstep, len2, len3, norm3, dot3, cross3, hex, scale3, mix3,
  srgbToLinear, linearToSrgb, rng, makeNoise, fbm, SD, smin, smax,
  RIG, clay, makeRenderer, boxBlur, addGlow, addHalo, addDiskHalo, blurAll, toRGBA8, encodePNG, tone
};
