'use strict';
/* Phase 3: Mars — its horizon, the planet from afar (waiting and
   restored), the two markers (the Sound Scout scanner and the Word
   Builder machine, each off and on) and the rock pedestal a picture
   stands on in Sound Scout. Same shape as jobs.js; jobs.js appends it. */
module.exports = [
  // the world you stand on, and the world from afar
  { name: 'horizon-mars', scene: 'horizon',  variant: 'mars', target: 'assets/horizons/mars.webp',     quality: 0.72 },
  { name: 'mars',         scene: 'mars',     variant: 'dim',  target: 'assets/planets/mars.webp',      quality: 0.76 },
  { name: 'mars-lit',     scene: 'mars',     variant: 'lit',  target: 'assets/planets/mars-lit.webp',  quality: 0.76 },
  // the markers: waiting, and restored
  { name: 'scanner',      scene: 'scanner',  variant: 'off',  target: 'assets/props/scanner.webp',     quality: 0.8 },
  { name: 'scanner-on',   scene: 'scanner',  variant: 'on',   target: 'assets/props/scanner-on.webp',  quality: 0.8 },
  { name: 'workshop',     scene: 'workshop', variant: 'off',  target: 'assets/props/workshop.webp',    quality: 0.8 },
  { name: 'workshop-on',  scene: 'workshop', variant: 'on',   target: 'assets/props/workshop-on.webp', quality: 0.8 },
  // what a picture stands on in Sound Scout
  { name: 'pedestal',     scene: 'pedestal',                  target: 'assets/props/pedestal.webp',    quality: 0.8 }
];
