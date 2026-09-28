'use strict';
/* Phase 5: three more pieces of rocket gear. Each picture is only the
   add-on, rendered in the rocket's own 640×800 frame and camera
   (scenes/rocketgear.js), so the app lays it exactly over rocket.webp,
   above the paint layer. */
module.exports = [
  { name: 'gear-ring',      scene: 'rocketgear', variant: 'ring',      target: 'assets/rocket/gear-ring.webp',      quality: 0.8 },
  { name: 'gear-flags',     scene: 'rocketgear', variant: 'flags',     target: 'assets/rocket/gear-flags.webp',     quality: 0.8 },
  { name: 'gear-dish',      scene: 'rocketgear', variant: 'dish',      target: 'assets/rocket/gear-dish.webp',      quality: 0.8 }
];
