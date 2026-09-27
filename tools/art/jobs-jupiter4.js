'use strict';
/* Phase 4: Jupiter — its cloud-top horizon, the planet from afar (waiting
   and restored), and the two sight-word markers (the sky sign for Star
   Words and the orbit ring for Word Orbit, each off and on). Same shape
   as jobs.js; jobs.js appends it. */
module.exports = [
  // the world you stand on, and the world from afar
  { name: 'horizon-jupiter', scene: 'horizon', variant: 'jupiter', target: 'assets/horizons/jupiter.webp',    quality: 0.72 },
  { name: 'jupiter',         scene: 'jupiter', variant: 'dim',     target: 'assets/planets/jupiter.webp',     quality: 0.76 },
  { name: 'jupiter-lit',     scene: 'jupiter', variant: 'lit',     target: 'assets/planets/jupiter-lit.webp', quality: 0.76 },
  // the markers: waiting, and restored
  { name: 'skysign',         scene: 'skysign', variant: 'off',     target: 'assets/props/skysign.webp',       quality: 0.8 },
  { name: 'skysign-on',      scene: 'skysign', variant: 'on',      target: 'assets/props/skysign-on.webp',    quality: 0.8 },
  { name: 'orbit',           scene: 'orbit',   variant: 'off',     target: 'assets/props/orbit.webp',         quality: 0.8 },
  { name: 'orbit-on',        scene: 'orbit',   variant: 'on',      target: 'assets/props/orbit-on.webp',      quality: 0.8 }
];
