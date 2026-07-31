// Verifies the slim-save change: only user-visible players are saved (the ~14k background NPCs are
// dropped), yet a save/load round-trip preserves every client and rebuilds full background squads,
// so nothing the game reads is missing.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];

// a fake IDB that actually retains the last put value, so load() reads back what save() wrote
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
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };
const runv = (g, c) => vm.runInContext('(function(){' + c + '})()', g);

(async () => {
    const disk = makeDisk();
    const A = sandbox(disk);
    runv(A, `Clubs.init(); GameState.startNewGame('Netherlands', 'Slim Test');`);
    // sign a handful of clients across clubs, then run a few weeks so squads/stats build up
    runv(A, `
      GameState.agency.reputation = 60; GameState.agency.balance = 5e7;
      GameState.players.filter(p => p.age <= 22 && p.ability >= 55 && p.ability <= 70).slice(0, 8).forEach(p => Agency.signPlayer(p, 10, 10, 5));
    `);
    runv(A, `for (let i = 0; i < 6; i++) Sim.advanceWeek();`);
    const before = JSON.parse(runv(A, `
      Storage._flushTimer = null;
      GameState.save();
      return JSON.stringify({
        total: GameState.players.length,
        clients: Agency.clients().map(p => p.id).sort(),
        savedPlayers: (Storage._dirty && Storage._dirty.players || []).length,
        savedBytes: JSON.stringify(Storage._dirty).length,
        savedPlayerBytes: JSON.stringify(Storage._dirty.players).length
      });
    `));
    check('save: full in-memory pool is large (~14k with background)', before.total > 10000, 'total=' + before.total);
    check('save: only user-visible players are persisted (a few hundred, not 14k)', before.savedPlayers < 1000 && before.savedPlayers >= 8, 'saved=' + before.savedPlayers);
    check('save: players payload is now small (< 1 MB)', before.savedPlayerBytes < 1024 * 1024, (before.savedPlayerBytes / 1024).toFixed(0) + ' KB');

    // flush to the fake disk and load into a FRESH sandbox
    await vm.runInContext('Storage.flush()', A);
    const B = sandbox(disk);
    runv(B, `Clubs.init();`);
    await vm.runInContext('GameState.load()', B);
    const after = JSON.parse(runv(B, `
      // a host club (one of the clients' clubs) must have a full background squad rebuilt around him
      const client = Agency.clients()[0];
      const cid = client ? (client.onLoanAt || client.clubId) : null;
      const squadAt = cid ? GameState.players.filter(p => (p.onLoanAt || p.clubId) === cid && !p.archived).length : 0;
      return JSON.stringify({
        clients: Agency.clients().map(p => p.id).sort(),
        total: GameState.players.length,
        squadAtHostClub: squadAt,
        anyBackground: GameState.players.some(p => !isSimRelevant(p) && !p.archived)
      });
    `));
    check('load: every client survived the round-trip', JSON.stringify(after.clients) === JSON.stringify(before.clients), `${after.clients.length} clients`);
    check('load: background squads regenerated (pool back to ~14k)', after.total > 10000, 'total=' + after.total);
    check('load: the client host club has a full rebuilt squad', after.squadAtHostClub >= 11, 'squad=' + after.squadAtHostClub);
    check('load: background players exist again', after.anyBackground === true);

    // and the reloaded game keeps simulating without errors
    const ok = runv(B, `try { for (let i = 0; i < 4; i++) Sim.advanceWeek(); return true; } catch (e) { return String(e); }`);
    check('load: the reloaded save advances weeks cleanly', ok === true, ok === true ? '' : String(ok));

    console.log(failed ? '\n*** FAIL ***' : '\nAll slim-save checks passed.');
    process.exit(failed ? 1 : 0);
})();
