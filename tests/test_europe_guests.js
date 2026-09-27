// Liechtenstein clubs are GUESTS in the Swiss league. Vaduz and Eschen-Mauren play out their season in
// the Swiss pyramid but represent Liechtenstein, whose only European berth is the Liechtensteiner Cup.
// So a Swiss league finish must give them nothing — the berth cascades to the next Swiss club — and the
// cup must still be a live route. Before this rule they could hold a Swiss berth AND Liechtenstein's
// cup berth in the same season, putting one club in two competitions.
//
// Also pins the pot repair: no pot may exceed the per-association cap, in ANY pot. The repair used to
// push overflow downwards only, so the last pot had no outlet and gave up — and because pots are built
// by reputation, a weak association's clubs all land in that bottom pot together.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js',
    'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js',
    'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errs = [];
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(),
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} }, window: { addEventListener() {} },
    UI: { money: n => String(Math.round(n || 0)) },
};
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };
run("Clubs.init(); GameState.startNewGame('Switzerland','Test FC');");

// ---- who counts as a guest ----
check('Vaduz and Eschen-Mauren are guests in Switzerland',
    run("return Europe.isGuestIn('Vaduz','Switzerland') && Europe.isGuestIn('Eschen-Mauren','Switzerland');"));
check('they are NOT guests in Liechtenstein, the association they represent',
    run("return !Europe.isGuestIn('Vaduz','Liechtenstein');"));
check('an ordinary Swiss club is not a guest',
    run("const c = Clubs.allClubs.find(x => x.country==='Switzerland' && x.division==='SuperLeagueCH' && x.id!=='Vaduz'); return !Europe.isGuestIn(c.id,'Switzerland');"));
check('the guest list is exactly those two today',
    run("return Array.from(Europe.guestIds().keys()).sort().join(',') === 'Eschen-Mauren,Vaduz';"));

// ---- a top-five Swiss finish gives Vaduz nothing, and everyone below moves up ----
const res = JSON.parse(run(`
  const swiss = Clubs.getClubsByDivision('SuperLeagueCH').map(c => c.id).filter(id => id !== 'Vaduz');
  // Vaduz FIRST, so it would take the champions' berth under the old behaviour
  const order = ['Vaduz'].concat(swiss);
  const t = Europe._tierMap('Switzerland', order, null);
  const flat = {};
  Object.entries(t.byTag).forEach(([tag, ids]) => ids.forEach(id => { flat[id] = tag; }));
  return JSON.stringify({ vaduzTag: flat['Vaduz'] || null, byClub: t.byClub,
                          firstFive: order.slice(0, 6), tagged: Object.keys(flat) });
`));
check('Vaduz finishing FIRST in the Super League gets no berth at all', res.vaduzTag === null);
check('Vaduz gets no highlight on the league table either', !res.byClub['Vaduz']);
check('the berths cascade: the club that finished 2nd is now the champion berth',
    res.byClub[res.firstFive[1]] === 'CHAMP');
check('Switzerland still fills every one of its slots',
    res.tagged.length === JSON.parse(run("return JSON.stringify(EUROPE_DATA.implemented.Switzerland.slots);")).length);

// ---- winning the Swiss cup gives them nothing either ----
check('a guest winning the Swiss cup does not take the cup berth', run(`
  const swiss = Clubs.getClubsByDivision('SuperLeagueCH').map(c => c.id).filter(id => id !== 'Vaduz');
  const t = Europe._tierMap('Switzerland', swiss, 'Vaduz');
  const flat = {}; Object.entries(t.byTag).forEach(([tag, ids]) => ids.forEach(id => { flat[id] = tag; }));
  return !flat['Vaduz'];
`));

// ---- the Liechtensteiner Cup is still a real route ----
check('Liechtenstein still has a European entry rule of its own', run(`
  const e = EUROPE_DATA.pools['Liechtenstein'].entries;
  return Europe.COMPS.some(c => (e[c] || []).length > 0);
`));
check('a Liechtenstein cup win still puts the club into Europe', run(`
  Rng.seed(20250901);
  const snap = Europe.syntheticStandings();
  snap.cups = Object.assign({}, snap.cups, { Liechtenstein: 'Vaduz' });
  const ed = Europe.buildEurope(snap.standings, snap.cups, 2025);
  let found = false;
  for (const comp of Europe.COMPS) {
    Object.values(ed.qpools[comp]).forEach(b => {
      if (b.seeded.includes('Vaduz') || b.unseeded.includes('Vaduz')) found = true;
    });
    if (ed.comps[comp].lpEntrants.includes('Vaduz')) found = true;
  }
  return found;
`));

// ---- and the whole edition is valid, including every pot ----
const sweep = JSON.parse(run(`
  const out = { editions: 0, problems: [], relaxed: 0 };
  for (let seed = 1; seed <= 12; seed++) {
    Rng.seed(seed * 7919);
    for (let s = 0; s < 3; s++) {
      const snap = Europe.syntheticStandings();
      const ed = Europe.buildEurope(snap.standings, snap.cups, 2025 + s);
      for (let w = 1; w <= 48; w++) Europe.step(w);
      out.editions++;
      Europe.validate(ed).forEach(p => out.problems.push(p));
      (ed.warnings || []).forEach(w => { if (/relaxed:/.test(w)) out.relaxed++; });
    }
  }
  return JSON.stringify(out);
`));
check(`${sweep.editions} editions, every pot within cap and no club in two competitions`
    + (sweep.problems.length ? ' — ' + sweep.problems.slice(0, 3).join('; ') : ''), sweep.problems.length === 0);
check('the pot repair never had to give up (relaxed: ' + sweep.relaxed + ')', sweep.relaxed === 0);

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** FAIL ***' : '\nAll Europe guest/pot checks passed.');
process.exitCode = failed ? 1 : 0;
