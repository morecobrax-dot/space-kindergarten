'use strict';
/* Phase 2 pictures: the game pictures and the props the new learning
   games stand on. Same shape as jobs.js; jobs.js appends this list. */
module.exports = [
  // the game pictures: one scene, one shared camera, one variant each
  { name: 'pic-spoon',       scene: 'picture',     variant: 'spoon',  target: 'assets/pictures/spoon.webp',  quality: 0.82 },
  { name: 'pic-car',         scene: 'picture',     variant: 'car',    target: 'assets/pictures/car.webp',    quality: 0.82 },
  { name: 'pic-cake',        scene: 'picture',     variant: 'cake',   target: 'assets/pictures/cake.webp',   quality: 0.82 },
  { name: 'pic-bee',         scene: 'picture',     variant: 'bee',    target: 'assets/pictures/bee.webp',    quality: 0.82 },
  { name: 'pic-tree',        scene: 'picture',     variant: 'tree',   target: 'assets/pictures/tree.webp',   quality: 0.82 },
  { name: 'pic-snake',       scene: 'picture',     variant: 'snake',  target: 'assets/pictures/snake.webp',  quality: 0.82 },
  { name: 'pic-rock',        scene: 'picture',     variant: 'rock',   target: 'assets/pictures/rock.webp',   quality: 0.82 },
  { name: 'pic-sock',        scene: 'picture',     variant: 'sock',   target: 'assets/pictures/sock.webp',   quality: 0.82 },
  { name: 'pic-banana',      scene: 'picture',     variant: 'banana', target: 'assets/pictures/banana.webp', quality: 0.82 },
  { name: 'pic-apple',       scene: 'picture',     variant: 'apple',  target: 'assets/pictures/apple.webp',  quality: 0.82 },
  { name: 'pic-tomato',      scene: 'picture',     variant: 'tomato', target: 'assets/pictures/tomato.webp', quality: 0.82 },
  // the props the games stand on
  { name: 'letter-stone',    scene: 'letterstone', target: 'assets/props/letter-stone.webp', quality: 0.8 },
  { name: 'beat-stone',      scene: 'beatstone',   target: 'assets/props/beat-stone.webp',   quality: 0.8 },
  { name: 'meteor',          scene: 'meteor',      variant: 'dim', target: 'assets/props/meteor.webp',          quality: 0.8 },
  { name: 'meteor-lit',      scene: 'meteor',      variant: 'lit', target: 'assets/props/meteor-lit.webp',      quality: 0.8 },
  { name: 'radar',           scene: 'radar',       variant: 'off', target: 'assets/props/radar.webp',           quality: 0.8 },
  { name: 'radar-on',        scene: 'radar',       variant: 'on',  target: 'assets/props/radar-on.webp',        quality: 0.8 },
  { name: 'meteor-field',    scene: 'meteorfield', variant: 'off', target: 'assets/props/meteor-field.webp',    quality: 0.8 },
  { name: 'meteor-field-on', scene: 'meteorfield', variant: 'on',  target: 'assets/props/meteor-field-on.webp', quality: 0.8 }
];
