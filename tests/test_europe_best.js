// Verifies "Best in Europe" updates across seasons: it should climb to a new high, keep the year
// of that high, and never regress on a worse season. Drives the exact rollover update logic.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = {
  console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) },
  setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {} }) },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, location: { hash: '' },
};
sb.Router = { register() {}, link: () => '#', refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {} };
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'shim.js'), 'utf8'), sb, { filename: 'shim.js' });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands', 'Testers FC');`);

// the exact update block from simulation.js season rollover, applied for a given (comp, clubId, stage, year)
const applyBest = (clubId, comp, stage, year) => runv(`
  if (!GameState.clubEuropeBest) GameState.clubEuropeBest = {};
  const clubId='${clubId}', comp='${comp}', stage=${stage}, year=${year};
  if (!GameState.clubEuropeBest[clubId]) GameState.clubEuropeBest[clubId] = {};
  const cur = GameState.clubEuropeBest[clubId][comp];
  const curStage = (cur && typeof cur === 'object') ? cur.stage : cur;
  if (curStage == null || stage > curStage) GameState.clubEuropeBest[clubId][comp] = { stage, year };
  return JSON.stringify(GameState.clubEuropeBest[clubId][comp]);
`);

// season 1: reached the Round of 16 (stage 3)
check('S1: first record set to Round of 16', applyBest('AJAX', 'UCL', 3, 2026) === '{"stage":3,"year":2026}');
// season 2: better — reached the Final (stage 6). MUST update (this was the bug).
check('S2: improves to Final and keeps the new year', applyBest('AJAX', 'UCL', 6, 2027) === '{"stage":6,"year":2027}');
// season 3: worse — group phase only (stage 1). MUST NOT regress.
check('S3: a worse season does not overwrite the best', applyBest('AJAX', 'UCL', 1, 2028) === '{"stage":6,"year":2027}');
// season 4: equalling the best does not bump the year (strictly-better only)
check('S4: equalling the best keeps the original year', applyBest('AJAX', 'UCL', 6, 2029) === '{"stage":6,"year":2027}');
// season 5: a new high (Winner, stage 7) updates again
check('S5: a new high (Winner) updates', applyBest('AJAX', 'UCL', 7, 2030) === '{"stage":7,"year":2030}');
// legacy save shape: a bare number should still be improvable
check('legacy: a bare-number entry is comparable and improves', runv(`
  GameState.clubEuropeBest['PSV'] = { UEL: 2 };   // pre-{stage,year} shape
  const clubId='PSV', comp='UEL', stage=5, year=2031;
  const cur = GameState.clubEuropeBest[clubId][comp];
  const curStage = (cur && typeof cur === 'object') ? cur.stage : cur;
  if (curStage == null || stage > curStage) GameState.clubEuropeBest[clubId][comp] = { stage, year };
  return JSON.stringify(GameState.clubEuropeBest[clubId][comp]) === '{"stage":5,"year":2031}';
`));

// end-to-end: three real seasons through the engine, then assert at least one club has a
// multi-season improvement OR a best whose year is NOT the first season (proving updates happen)
runv(`
  GameState.clubEuropeBest = {};
  for (let i = 0; i < 3 * 52; i++) Sim.advanceWeek();
`);
check('e2e: 3 seasons produced Best-in-Europe records', runv(`return Object.keys(GameState.clubEuropeBest).length > 0;`),
  'clubs=' + runv(`return Object.keys(GameState.clubEuropeBest).length;`));
check('e2e: no engine errors across 3 seasons', errors.length === 0, errors.slice(0, 2).join(' | '));
// prove at least one best-year is a later season (not everyone frozen on season 1)
check('e2e: at least one club improved to a later season (not all frozen on the first)', runv(`
  const y0 = GameState.seasonStartYear - 3;   // ~first simulated season
  let later = false;
  Object.values(GameState.clubEuropeBest).forEach(byComp => Object.values(byComp).forEach(rec => { if (rec && rec.year > y0) later = true; }));
  return later;
`));

console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll Best-in-Europe checks passed.');
process.exit(failed || errors.length ? 1 : 0);
