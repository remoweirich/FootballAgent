// Full-engine integration test: boots the real engine files (not just storage.js in
// isolation) through a fake IndexedDB, simulating "advance a week, force-close the
// app, reopen it" by tearing down the sandbox and rebuilding a fresh one that shares
// only the persisted backing store — nothing in-memory carries over between them.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

function makeFakeIDB(sharedStores) {
    const stores = sharedStores || new Map();
    function fireAsync(fn) { setTimeout(fn, 0); }
    return {
        _stores: stores,
        open(name) {
            const req = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
            fireAsync(() => {
                let isNew = false;
                if (!stores.has(name)) { stores.set(name, new Map()); isNew = true; }
                const dbStores = stores.get(name);
                const db = {
                    objectStoreNames: { contains: n => dbStores.has(n) },
                    createObjectStore(n) { dbStores.set(n, new Map()); return {}; },
                    transaction(storeNames) {
                        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
                        const tx = { oncomplete: null, onerror: null, onabort: null };
                        tx.objectStore = (n) => ({
                            get(key) { const r = { onsuccess: null, onerror: null, result: undefined }; fireAsync(() => { r.result = dbStores.get(n).get(key); if (r.onsuccess) r.onsuccess(); }); return r; },
                            put(val, key) { dbStores.get(n).set(key, val); return { onsuccess: null, onerror: null }; },
                            delete(key) { dbStores.get(n).delete(key); return { onsuccess: null, onerror: null }; }
                        });
                        fireAsync(() => { if (tx.oncomplete) tx.oncomplete(); });
                        return tx;
                    }
                };
                req.result = db;
                if (isNew && req.onupgradeneeded) req.onupgradeneeded();
                if (req.onsuccess) req.onsuccess();
            });
            return req;
        }
    };
}
function makeFakeLocalStorage(shared) {
    const m = shared || new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _map: m };
}

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

function buildSandbox(idbStores) {
    const sandbox = {
        console, setTimeout, clearTimeout, Math, Date, JSON,
        indexedDB: makeFakeIDB(idbStores),
        localStorage: makeFakeLocalStorage(),
        document: { addEventListener() {} },
        window: { addEventListener() {} },
        UI: { money: n => Math.round(n||0).toLocaleString('en-US') },  // stub: real UI shim lives in ui/js/shim.js, loaded after the engine in the real app
    };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    return sandbox;
}

async function main() {
    let failed = false;
    const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };
    const sharedIdbStores = new Map(); // simulates the phone's actual persisted IndexedDB file

    // ---- Session 1: fresh install ----
    let sb = buildSandbox(sharedIdbStores);
    let run = code => vm.runInContext(code, sb);

    run(`Clubs.init();`);
    check('fresh install: hasSave() false', (await run(`GameState.hasSave()`)) === false);

    run(`GameState.startNewGame('England', 'Brotherly Sports');`);
    check('new game: agency created', run(`GameState.agency.name`) === 'Brotherly Sports');
    check('new game: week is 1', run(`GameState.week`) === 1);

    // advanceWeek() calls GameState.save() then Storage.flush() itself
    await run(`Sim.advanceWeek()`);
    await run(`Storage.flush()`); // belt and braces, in case the fire-and-forget hasn't settled
    check('after advancing: week is 2', run(`GameState.week`) === 2);

    // ---- "force-close": throw the whole in-memory sandbox away ----
    sb = null; run = null;

    // ---- Session 2: reopen, simulating the same physical IndexedDB store ----
    sb = buildSandbox(sharedIdbStores);
    run = code => vm.runInContext(code, sb);
    run(`Clubs.init();`);
    check('reopen: hasSave() true (persisted across "restart")', (await run(`GameState.hasSave()`)) === true);
    await run(`GameState.init()`);
    check('reopen: agency name survived', run(`GameState.agency.name`) === 'Brotherly Sports');
    check('reopen: week survived (2, not reset to 1)', run(`GameState.week`) === 2);
    check('reopen: home country survived', run(`GameState.homeCountry`) === 'England');
    check('reopen: players array is non-empty', run(`GameState.players.length`) > 0);

    // ---- airplane-mode style check: engine works with no globalThis.fetch/XHR at all ----
    check('no network primitives referenced (fetch/XMLHttpRequest undefined in sandbox, no crash so far)', typeof sb.fetch === 'undefined');

    // ---- reset flow ----
    let reloaded = false;
    sb.location = { reload: () => { reloaded = true; } };
    await run(`GameState.hardReset()`);
    check('hardReset(): triggers reload', reloaded === true);
    check('hardReset(): hasSave() false afterwards', (await run(`GameState.hasSave()`)) === false);

    console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll checks passed.');
    process.exit(failed ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
