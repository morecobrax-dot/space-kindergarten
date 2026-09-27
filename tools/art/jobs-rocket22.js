'use strict';
/* Phase 2.2: the redesigned rocket's gear and theme add-ons. Appended by jobs.js.
   Each picture is only the add-on, rendered in the rocket's own 640×800
   frame and camera (scenes/rocketgear.js), so the app lays it exactly over
   rocket.webp, above the paint layer. */
module.exports = [
  { name: 'gear-star',    scene: 'rocketgear', variant: 'star',    target: 'assets/rocket/gear-star.webp',    quality: 0.8 },
  { name: 'gear-moon',    scene: 'rocketgear', variant: 'moon',    target: 'assets/rocket/gear-moon.webp',    quality: 0.8 },
  { name: 'gear-antenna', scene: 'rocketgear', variant: 'antenna', target: 'assets/rocket/gear-antenna.webp', quality: 0.8 },
  { name: 'gear-lights',  scene: 'rocketgear', variant: 'lights',  target: 'assets/rocket/gear-lights.webp',  quality: 0.8 },
  { name: 'gear-wings',   scene: 'rocketgear', variant: 'wings',   target: 'assets/rocket/gear-wings.webp',   quality: 0.8 },
  { name: 'gear-booster', scene: 'rocketgear', variant: 'booster', target: 'assets/rocket/gear-booster.webp', quality: 0.8 }
];
