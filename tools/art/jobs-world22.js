'use strict';
/* Phase 2.2: the space station, travel clouds and asteroids, refined mission stones. Appended by jobs.js. */
module.exports = [
  // the Rocket Dock as a place: the station from space, and its garage room
  { name: 'station-outside', scene: 'station', variant: 'outside', target: 'assets/places/station-outside.webp', quality: 0.8 },
  { name: 'station-inside',  scene: 'station', variant: 'inside',  target: 'assets/places/station-inside.webp',  quality: 0.78 },
  // what a flight passes: cloud puffs near Earth, friendly asteroids out in space
  { name: 'cloud-a',    scene: 'spacefx', variant: 'cloud-a',    target: 'assets/props/cloud-a.webp',    quality: 0.8 },
  { name: 'cloud-b',    scene: 'spacefx', variant: 'cloud-b',    target: 'assets/props/cloud-b.webp',    quality: 0.8 },
  { name: 'cloud-c',    scene: 'spacefx', variant: 'cloud-c',    target: 'assets/props/cloud-c.webp',    quality: 0.8 },
  { name: 'asteroid-a', scene: 'spacefx', variant: 'asteroid-a', target: 'assets/props/asteroid-a.webp', quality: 0.8 },
  { name: 'asteroid-b', scene: 'spacefx', variant: 'asteroid-b', target: 'assets/props/asteroid-b.webp', quality: 0.8 },
  { name: 'asteroid-c', scene: 'spacefx', variant: 'asteroid-c', target: 'assets/props/asteroid-c.webp', quality: 0.8 }
];
