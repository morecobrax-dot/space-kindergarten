'use strict';
/* Phase 4: the Moon's writing slate (the Moon Writer marker, off and on)
   and the word satellite a sight word floats on. Same shape as jobs.js;
   jobs.js appends it. */
module.exports = [
  // the Moon Writer marker: waiting, and restored
  { name: 'slate',    scene: 'slate',   variant: 'off', target: 'assets/props/slate.webp',          quality: 0.8 },
  { name: 'slate-on', scene: 'slate',   variant: 'on',  target: 'assets/props/slate-on.webp',       quality: 0.8 },
  // the panel a sight word is shown on
  { name: 'wordsat',  scene: 'wordsat',                 target: 'assets/props/word-satellite.webp', quality: 0.8 }
];
