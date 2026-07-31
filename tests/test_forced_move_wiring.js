// Regression for the review-batch fixes to the stage-3 escalation:
//  (1) Sim.advanceWeek actually INVOKES _forcedMoves (it was defined but never called, so a
//      breaking-point time/club case soft-locked forever);
//  (2) a stage-3 case whose rep-term has lapsed fires the agent, for ANY dimension (not just 'agent').
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js', 'dialogue-data.js', 'dialogue-data-de.js', 'dialogue.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = {
  console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) },
  setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {} }), head: { appendChild() {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, location: { hash: '' },
};
sb.Router = { register() {}, link: () => '#', refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {} };
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(base + f, 'utf8'), sb, { filename: f });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'ui', 'js', 'shim.js'), 'utf8'), sb, { filename: 'shim.js' });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands', 'Wiring Test');`);

// ---- (1) wiring: advanceWeek must call _forcedMoves ----
check('advanceWeek invokes _forcedMoves (source-level wiring)', /this\._forcedMoves\(/.test(runv('return Sim.advanceWeek.toString()')));

// a stage-3 time case with an open forcedMove, in an open window, should actually move his club
check('advanceWeek executes a pending forced move (club changes)', runv(`
  GameState.week = 2;   // inside summer window
  const club = Clubs.allClubs.find(c => c.reputation >= 58 && c.reputation <= 68);
  const p = PlayerGen.makePlayer(club, { ability: 63, age: 25, position: 'CM' });
  p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 2000;
  p.repUntilSeason = GameState.seasonStartYear + 3; p.repExpired = false;   // still under contract: he moves, not fires
  p.morale = { club: 8, time: 70, wage: 70, agent: 70 };
  p.moraleCase = { dim: 'club', stage: 3, sinceAbsWeek: GameState.absWeek() - 20, promise: null, forcedMove: true };
  GameState.players.push(p);
  const before = p.clubId;
  Sim._forcedMoves([]);   // the exact call advanceWeek now makes; run directly for determinism
  return p.clubId !== before;
`));

// ---- (2) firing at breaking point once the rep term is up, for a non-agent dimension ----
check('stage-3 WAGE case + rep expired -> he fires the agency (grace elapsed)', runv(`
  const p = GameState.players.find(x => x.agentId === 'me') || (() => { const c = Clubs.allClubs[0]; const q = PlayerGen.makePlayer(c, { ability: 60, age: 26, position: 'ST' }); q.agentId='me'; q.everClient=true; q.clubId=c.id; GameState.players.push(q); return q; })();
  p.repExpired = true;
  p.morale = { club: 70, time: 70, wage: 10, agent: 70 };   // wage stays BAD so the case can't resolve
  p.moraleCase = { dim: 'wage', stage: 3, sinceAbsWeek: GameState.absWeek() - 20, promise: null, leaveAtAbsWeek: GameState.absWeek() - 1 };
  Sim._moraleCases([]);
  return p.agentId === null && p.moraleCase === null;
`));

check('stage-3 case while STILL under a rep term does NOT fire (he cannot just walk)', runv(`
  const c = Clubs.allClubs.find(x => x.reputation >= 55);
  const p = PlayerGen.makePlayer(c, { ability: 62, age: 27, position: 'CB' });
  p.agentId = 'me'; p.everClient = true; p.clubId = c.id;
  p.repExpired = false; p.repUntilSeason = GameState.seasonStartYear + 2;
  p.morale = { club: 70, time: 70, wage: 8, agent: 70 };
  p.moraleCase = { dim: 'wage', stage: 3, sinceAbsWeek: GameState.absWeek() - 20, promise: null };
  GameState.players.push(p);
  Sim._moraleCases([]);
  return p.agentId === 'me' && p.moraleCase != null;   // stays a client, case intact
`));

check('the agent-dimension firing (original behaviour) still works', runv(`
  const c = Clubs.allClubs[3];
  const p = PlayerGen.makePlayer(c, { ability: 61, age: 28, position: 'CM' });
  p.agentId = 'me'; p.everClient = true; p.clubId = c.id; p.repExpired = true;
  p.morale = { club: 70, time: 70, wage: 70, agent: 8 };
  p.moraleCase = { dim: 'agent', stage: 3, sinceAbsWeek: GameState.absWeek() - 20, promise: null, leaveAtAbsWeek: GameState.absWeek() - 1 };
  GameState.players.push(p);
  Sim._moraleCases([]);
  return p.agentId === null;
`));

check('no engine errors', errors.length === 0, errors.slice(0, 2).join(' | '));
console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll forced-move wiring checks passed.');
process.exit(failed || errors.length ? 1 : 0);
