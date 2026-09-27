'use strict';
/* Every picture the renderer makes: which scene, which variant, and where
   the shipped file goes. The target paths are the ones ASSET_REGISTRY in
   index.html names; `quality` is the WebP quality encode.js uses.

   Sizes are about twice the largest size each picture is drawn at on an
   iPad, so they stay sharp on a Retina screen without shipping more. */
module.exports = [
  { name: 'space',       scene: 'space',  target: 'assets/backgrounds/space.webp',       quality: 0.72 },
  { name: 'moon-ground', scene: 'ground', target: 'assets/backgrounds/moon-ground.webp', quality: 0.72 },
  { name: 'earth',       scene: 'earth',  target: 'assets/planets/earth.webp',           quality: 0.76 },
  { name: 'moon',        scene: 'moon',   variant: 'dim', target: 'assets/planets/moon.webp',     quality: 0.76 },
  { name: 'moon-lit',    scene: 'moon',   variant: 'lit', target: 'assets/planets/moon-lit.webp', quality: 0.76 },
  { name: 'rocket',      scene: 'rocket', target: 'assets/rocket/rocket.webp', quality: 0.8,
    paintMask: { name: 'rocket-paint', target: 'assets/rocket/rocket-paint.webp', quality: 0.8 } },
  { name: 'flame',       scene: 'flame',  target: 'assets/rocket/flame.webp',           quality: 0.8 },
  { name: 'pip',         scene: 'pip',    target: 'assets/characters/pip.webp',         quality: 0.82 },
  { name: 'star',        scene: 'star',   target: 'assets/props/star.webp',             quality: 0.85 },
  { name: 'beacon',      scene: 'beacon', variant: 'off', target: 'assets/props/beacon.webp',     quality: 0.8 },
  { name: 'beacon-lit',  scene: 'beacon', variant: 'on',  target: 'assets/props/beacon-lit.webp', quality: 0.8 },
  { name: 'pad',         scene: 'pad',    target: 'assets/props/pad.webp',              quality: 0.78 },
  // Home Screen icons must be PNG, and opaque
  { name: 'icon-512',    scene: 'pip',    variant: 'icon', target: 'icon-512.png', format: 'png' },
  { name: 'icon-192',    scene: 'pip',    variant: 'icon', size: 192, target: 'icon-192.png', format: 'png' }
];
