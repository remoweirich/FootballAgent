// Seeded RNG: the module is a deterministic, resumable stream, and that stream rides along in the
// save so a reloaded game keeps rolling from exactly where it left off (rather than jumping to a fresh
// sequence). Part 1 exercises the Rng module directly; Part 2 proves the save/load threading.
const vm = require('vm'), fs = require('fs'), path = require('path');
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };

// ---- Part 1: the Rng module, in isolation ------------------------------------------------------
const Rng = require(path.join(__dirname, '..', 'js', 'rng.js'));

// range: every draw is in [0, 1)
Rng.seed(1);
let inRange = true;
for (let i = 0; i < 5000; i++) { const v = Rng.next(); if (!(v >= 0 && v < 1)) inRange = false; }
check('next() always returns a float in [0, 1)', inRange);

// same seed -> identical sequence
const seqOf = s => { Rng.seed(s); return Array.from({ length: 8 }, () => Rng.next()); };
const a1 = seqOf(12345), a2 = seqOf(12345);
check('same seed reproduces the same sequence', JSON.stringify(a1) === JSON.stringify(a2));
check('a different seed gives a different sequence', JSON.stringify(seqOf(999)) !== JSON.stringify(a1));

// getState / setState resume the stream mid-flight
Rng.seed(777);
Rng.next(); Rng.next();
const mark = Rng.getState();
const tail1 = [Rng.next(), Rng.next(), Rng.next()];
Rng.setState(mark);
const tail2 = [Rng.next(), Rng.next(), Rng.next()];
check('getState/setState resumes the exact stream', JSON.stringify(tail1) === JSON.stringify(tail2));

// withSeed runs a derived stream, then restores the outer one untouched
Rng.seed(42);
Rng.next();
const before = Rng.getState();
const derivedA = Rng.withSeed(2024, () => [Rng.next(), Rng.next()]);
const after = Rng.getState();
check('withSeed leaves the outer stream exactly where it was', before === after);
const derivedB = Rng.withSeed(2024, () => [Rng.next(), Rng.next()]);
check('withSeed is deterministic for a given seed', JSON.stringify(derivedA) === JSON.stringify(derivedB));

// ---- Part 2: the seed threads through save/load ------------------------------------------------
const base = path.join(__dirname, '..', 'js') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
function makeDisk() {
    let stored = null;
    const idb = { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = store; if (r.onsuccess) r.onsuccess(); }, 0); return r; } };
    const store = {
        objectStoreNames: { contains: () => true }, createObjectStore() { return {}; },
        transaction() {
            const tx = { oncomplete: null, onerror: null, onabort: null, objectStore: () => ({
                put(v) { stored = v; setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); return {}; },
                get() { const rq = {}; setTimeout(() => { rq.result = stored; if (rq.onsuccess) rq.onsuccess(); }, 0); return rq; },
                delete() { stored = null; return {}; }
            }) };
            return tx;
        }
    };
    return { idb, peek: () => stored };
}
function sandbox(disk) {
    const g = { console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: disk.idb, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, window: { addEventListener() {} }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
    vm.createContext(g);
    for (const f of engine) vm.runInContext(fs.readFileSync(base + f, 'utf8'), g, { filename: f });
    return g;
}
const runv = (g, c) => vm.runInContext('(function(){' + c + '})()', g);

(async () => {
    const disk = makeDisk();
    const A = sandbox(disk);
    runv(A, `Clubs.init(); GameState.startNewGame('Netherlands', 'Rng Test');`);
    runv(A, `for (let i = 0; i < 3; i++) Sim.advanceWeek();`);
    // snapshot the stream, save, then read three more draws from A's continuing stream
    const snap = JSON.parse(runv(A, `
        Storage._flushTimer = null; GameState.save();
        return JSON.stringify({ seed: GameState.rngSeed, state: Rng.getState(), savedState: Storage._dirty.rngState, savedSeed: Storage._dirty.rngSeed });
    `));
    check('save carries the seed and the live stream position', snap.savedSeed === snap.seed && snap.savedState === snap.state);
    const nextA = JSON.parse(runv(A, `return JSON.stringify([Rng.next(), Rng.next(), Rng.next()]);`));

    await vm.runInContext('Storage.flush()', A);
    const B = sandbox(disk);
    runv(B, `Clubs.init();`);
    await vm.runInContext('GameState.load()', B);
    const afterLoad = JSON.parse(runv(B, `return JSON.stringify({ seed: GameState.rngSeed, state: Rng.getState() });`));
    check('load restores the seed', afterLoad.seed === snap.seed);
    check('load resumes the stream at the saved position (background regen did not perturb it)', afterLoad.state === snap.state, `${afterLoad.state} vs ${snap.state}`);
    const nextB = JSON.parse(runv(B, `return JSON.stringify([Rng.next(), Rng.next(), Rng.next()]);`));
    check('a reloaded game draws the same next values the original would have', JSON.stringify(nextA) === JSON.stringify(nextB), JSON.stringify(nextB));

    console.log(failed ? '\n*** FAIL ***' : '\nAll RNG checks passed.');
    process.exit(failed ? 1 : 0);
})();
