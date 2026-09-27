'use strict';
/* Every picture the renderer makes: which scene, which variant, and where
   the shipped file goes. The target paths are the ones ASSET_REGISTRY in
   index.html names; `quality` is the WebP quality encode.js uses.

   Sizes are about twice the largest size each picture is drawn at on an
   iPad, so they stay sharp on a Retina screen without shipping more. */
const BASE = [
  // the sky, in layers the camera can move through
  { name: 'space',        scene: 'space',   variant: 'bg',   target: 'assets/backgrounds/space.webp',      quality: 0.7 },
  { name: 'stars-far',    scene: 'space',   variant: 'far',  target: 'assets/backgrounds/stars-far.webp',  quality: 0.7 },
  { name: 'stars-near',   scene: 'space',   variant: 'near', target: 'assets/backgrounds/stars-near.webp', quality: 0.75 },
  // the worlds you stand on
  { name: 'horizon-earth',   scene: 'horizon', variant: 'earth',   target: 'assets/horizons/earth.webp',   quality: 0.72 },
  { name: 'horizon-moon',    scene: 'horizon', variant: 'moon',    target: 'assets/horizons/moon.webp',    quality: 0.72 },
  { name: 'horizon-mercury', scene: 'horizon', variant: 'mercury', target: 'assets/horizons/mercury.webp', quality: 0.72 },
  // the worlds seen from afar
  { name: 'earth',        scene: 'earth',   target: 'assets/planets/earth.webp',  quality: 0.76 },
  { name: 'moon',         scene: 'moon',    variant: 'dim', target: 'assets/planets/moon.webp',     quality: 0.76 },
  { name: 'moon-lit',     scene: 'moon',    variant: 'lit', target: 'assets/planets/moon-lit.webp', quality: 0.76 },
  { name: 'mercury',      scene: 'mercury', variant: 'dim', target: 'assets/planets/mercury.webp',     quality: 0.76 },
  { name: 'mercury-lit',  scene: 'mercury', variant: 'lit', target: 'assets/planets/mercury-lit.webp', quality: 0.76 },
  // characters and props
  { name: 'rocket',       scene: 'rocket',  target: 'assets/rocket/rocket.webp', quality: 0.8,
    paintMask: { name: 'rocket-paint', target: 'assets/rocket/rocket-paint.webp', quality: 0.8 } },
  { name: 'flame',        scene: 'flame',   target: 'assets/rocket/flame.webp',           quality: 0.8 },
  { name: 'pip',          scene: 'pip',     target: 'assets/characters/pip.webp',         quality: 0.82 },
  { name: 'star',         scene: 'star',    target: 'assets/props/star.webp',             quality: 0.85 },
  { name: 'beacon',       scene: 'beacon',  variant: 'off', target: 'assets/props/beacon.webp',     quality: 0.8 },
  { name: 'beacon-lit',   scene: 'beacon',  variant: 'on',  target: 'assets/props/beacon-lit.webp', quality: 0.8 },
  // Home Screen icons must be PNG, and opaque
  { name: 'icon-512',     scene: 'pip',     variant: 'icon', target: 'icon-512.png', format: 'png' },
  { name: 'icon-192',     scene: 'pip',     variant: 'icon', size: 192, target: 'icon-192.png', format: 'png' }
];

/* The Phase 2 game pictures and props, and the Phase 2.2 rocket gear and
   world props, live in their own lists. */
module.exports = BASE.concat(require('./jobs-phase2.js'), require('./jobs-rocket22.js'), require('./jobs-world22.js'));
