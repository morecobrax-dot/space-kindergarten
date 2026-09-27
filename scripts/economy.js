/* =========================================================
   ECONOMY SIMULATION
   ---------------------------------------------------------
   How stars and the rocket's things pace against the missions that
   exist. Runs the app's own engine in the test harness (the star ledger,
   the prices, the missions in journey order), so it can never disagree
   with the product. Nothing is stored and no real data is read.

     node scripts/economy.js            the table for 5, 10 and 20 missions

   A child finishes missions in the order the journey offers them (every
   first completion, then replays), earning each mission's reward. Two
   ways of spending are simulated: buying the cheapest thing as soon as
   it is affordable, and saving for a theme first.
   ========================================================= */
'use strict';
const H = require('../test/harness.js');

const c = H.loadApp().ctx;
const order = [];
c.JOURNEY_ORDER.forEach(d => c.DESTINATIONS[d].missions.forEach(id => order.push(id)));
const things = c.COSMETICS.filter(x => !x.starter);
const total = things.reduce((s, x) => s + x.cost, 0);

function simulate(missions, strategy){
  let ledger = [];
  const at = '2026-09-27T00:00:00.000Z';
  for(let i = 0; i < missions; i++){
    const id = order[i % order.length];
    ledger = c.awardStars(ledger, 'run_' + i, c.MISSIONS[id].reward.stars, at).ledger;
    for(;;){
      const owned = c.ownedCosmetics(ledger), balance = c.starBalance(ledger);
      let pool = things.filter(x => owned.indexOf(x.id) === -1);
      if(strategy === 'theme first'){
        const theme = pool.filter(x => x.slot === 'theme').sort((a, b) => a.cost - b.cost)[0];
        if(theme) pool = [theme];
      }
      const next = pool.sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))[0];
      if(!next || next.cost > balance) break;
      ledger = c.unlockCosmetic(ledger, next.id, at).ledger;
    }
  }
  const owned = c.ownedCosmetics(ledger).map(id => c.cosmeticById(id)).filter(x => !x.starter);
  return { earned: c.ledgerTotal(ledger, 'earn'), balance: c.starBalance(ledger), owned: owned };
}

console.log('\nMissions on the journey: ' + order.length + ' (' + order.join(', ') + ')');
console.log('Reward: ' + [...new Set(order.map(id => c.MISSIONS[id].reward.stars))].join('/') + ' stars a mission');
console.log('Things to unlock: ' + things.length + ', costing ' + total + ' stars in all\n');
[5, 10, 20].forEach(n => {
  ['cheapest first', 'theme first'].forEach(s => {
    const r = simulate(n, s);
    console.log(String(n).padStart(2) + ' missions, ' + s.padEnd(14) + ' earned ' + String(r.earned).padStart(2) + ', unlocked ' +
      String(r.owned.length).padStart(2) + ' of ' + things.length + ' (' + Math.round(100 * (r.earned - r.balance) / total) + '% of all prices), left ' + r.balance +
      ': ' + r.owned.map(x => x.name).join(', '));
  });
});
const all = Math.ceil(total / 3);
console.log('\nEverything is unlocked after ' + all + ' missions at 3 stars each.\n');
