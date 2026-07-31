// Validates the new training-environment growth factor:
//  (a) playing (even at a lower level) always beats not playing,
//  (b) benched at a high-rep club beats benched at a low-rep club,
//  (c) growth rises with the ability<->reputation gap and with reputation,
//  (d) overall development pace hasn't drifted much from before.
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
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
  location: { hash: '' },
};
sb.Router = { register() {}, link: (a, b) => `#${a}/${b}`, refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {} };
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c, extra) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (extra ? '  ' + extra : '')); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands','Testers FC');`);

// Expose helpers + a stubbed env so we can drive weeklyTick deterministically per (ability, clubRep).
// We stub envLevelFor to a chosen reputation and disable RNG by averaging many ticks.
sb.PlayerDevTest = vm.runInContext('PlayerDev', sb);

// average weekly dev points for a fresh player with given ability, potential, age, clubRep, apps
function avgWeekly(ability, clubRep, apps, n = 6000) {
  return runv(`
    const orig = PlayerDev.envLevelFor;
    PlayerDev.envLevelFor = () => ${clubRep};
    let sum = 0;
    for (let i = 0; i < ${n}; i++) {
      const p = { ability: ${ability}, potential: ${ability} + 20, age: 18, peakAge: 27,
        _dev: 0, _devGained: 0, _devSeason: GameState.seasonStartYear, morale: {club:70,time:70,wage:70,agent:70}, stats: {} };
      // measure the fractional pts added this tick by reading _dev delta (before it rolls into ability)
      const before = p._dev;
      PlayerDev.weeklyTick(p, ${apps});
      // weeklyTick may roll _dev into ability; reconstruct total pts added = (ability gained) + (_dev now - before)
      const gainedAbility = p.ability - ${ability};
      sum += gainedAbility + (p._dev - before);
    }
    PlayerDev.envLevelFor = orig;
    return sum / ${n};
  `);
}

// factor-only helpers
const challenge = (ab, rep) => runv(`const o=PlayerDev.envLevelFor;PlayerDev.envLevelFor=()=>${rep};const v=PlayerDev.challengeFactor({ability:${ab}});PlayerDev.envLevelFor=o;return v;`);
const facilities = (rep) => runv(`const o=PlayerDev.envLevelFor;PlayerDev.envLevelFor=()=>${rep};const v=PlayerDev.facilitiesFactor({});PlayerDev.envLevelFor=o;return v;`);
const envF = (ab, rep) => runv(`const o=PlayerDev.envLevelFor;PlayerDev.envLevelFor=()=>${rep};const v=PlayerDev.envFactor({ability:${ab}});PlayerDev.envLevelFor=o;return v;`);

// ---- (c) monotonicity of the factors ----
check('challenge rises as club rep rises above ability', challenge(60, 80) > challenge(60, 50), `(${challenge(60,80).toFixed(3)} > ${challenge(60,50).toFixed(3)})`);
check('challenge below 1 when player is above his club level', challenge(70, 45) < 1, `(${challenge(70,45).toFixed(3)})`);
check('facilities rises with club rep', facilities(85) > facilities(45), `(${facilities(85).toFixed(3)} > ${facilities(45).toFixed(3)})`);
check('envFactor bounded [0.585,1.885]-ish', envF(30, 90) <= 1.9 && envF(90, 30) >= 0.55, `hi=${envF(30,90).toFixed(3)} lo=${envF(90,30).toFixed(3)}`);

// ---- (a) playing (even at a lower level) always beats not playing — worst case ----
// worst playing: dominating a weak club (ability 75 @ rep 35), 1 app; best bench: challenged at elite (ability 55 @ rep 90), 0 apps
const playWorst = avgWeekly(75, 35, 1);
const benchBest = avgWeekly(55, 90, 0);
check('(a) worst playing week > best bench week', playWorst > benchBest, `play@low=${playWorst.toFixed(4)} bench@elite=${benchBest.toFixed(4)}`);
// same young player: loan to play at a lower club vs sit at his big club
const younPlayLow = avgWeekly(60, 50, 1);
const younBenchHigh = avgWeekly(60, 82, 0);
check('(a) same player: playing at a lower club > benched at his big club', younPlayLow > younBenchHigh, `playLow=${younPlayLow.toFixed(4)} benchHigh=${younBenchHigh.toFixed(4)}`);

// ---- (b) benched at high-rep club beats benched at low-rep club ----
const benchHi = avgWeekly(60, 82, 0), benchLo = avgWeekly(60, 40, 0);
check('(b) benched at high-rep > benched at low-rep', benchHi > benchLo, `hi=${benchHi.toFixed(4)} lo=${benchLo.toFixed(4)}`);

// ---- (c) growth rises with the ability<->rep gap (playing) ----
const stretched = avgWeekly(60, 82, 1), atLevel = avgWeekly(60, 60, 1), dominating = avgWeekly(60, 40, 1);
check('(c) stretched (rep>>ability) develops faster than at-level, which beats dominating', stretched > atLevel && atLevel > dominating,
  `stretched=${stretched.toFixed(4)} atLevel=${atLevel.toFixed(4)} dominating=${dominating.toFixed(4)}`);

// ---- (d) overall pace drift: average env factor over a plausible developing cohort ~ near 1.0 ----
let sumEnv = 0, cnt = 0;
for (let ab = 45; ab <= 75; ab += 5) {
  for (let rep = ab - 10; rep <= ab + 15; rep += 5) {   // prospects tend to be at/above their level
    sumEnv += envF(ab, rep); cnt++;
  }
}
const avgEnv = sumEnv / cnt;
check('(d) average env factor across a developing cohort within 0.9..1.15 (pace not wildly shifted)', avgEnv >= 0.9 && avgEnv <= 1.15, `avgEnv=${avgEnv.toFixed(3)}`);

console.log('\nengine errors:', errors.length ? errors : 'none');
console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll dev-env checks passed.');
process.exit(failed || errors.length ? 1 : 0);
