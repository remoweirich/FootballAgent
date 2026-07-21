// Minimal fake IndexedDB + localStorage, just enough surface area to exercise
// js/storage.js's actual code paths (open/upgrade/transaction/get/put/delete
// with the same onsuccess/oncomplete/onerror callback timing shape).
const vm = require('vm');
const fs = require('fs');

function makeFakeIDB() {
    const stores = new Map(); // dbName -> Map(storeName -> Map(key->val))
    function fireAsync(fn) { setTimeout(fn, 0); }
    return {
        open(name, version) {
            const req = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
            fireAsync(() => {
                let isNew = false;
                if (!stores.has(name)) { stores.set(name, new Map()); isNew = true; }
                const dbStores = stores.get(name);
                const db = {
                    objectStoreNames: { contains: n => dbStores.has(n) },
                    createObjectStore(n) { dbStores.set(n, new Map()); return { }; },
                    transaction(storeNames, mode) {
                        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
                        const tx = { oncomplete: null, onerror: null, onabort: null, _ops: [] };
                        const objectStore = (n) => ({
                            get(key) {
                                const r = { onsuccess: null, onerror: null, result: undefined };
                                fireAsync(() => { r.result = dbStores.get(n).get(key); if (r.onsuccess) r.onsuccess(); });
                                return r;
                            },
                            put(val, key) {
                                const r = { onsuccess: null, onerror: null };
                                dbStores.get(n).set(key, val);
                                return r;
                            },
                            delete(key) {
                                const r = { onsuccess: null, onerror: null };
                                dbStores.get(n).delete(key);
                                return r;
                            }
                        });
                        tx.objectStore = (n) => objectStore(names.includes(n) ? n : n);
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

function makeFakeLocalStorage() {
    const m = new Map();
    return {
        getItem: k => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => { m.set(k, String(v)); },
        removeItem: k => { m.delete(k); },
        _dump: () => Object.fromEntries(m)
    };
}

async function run() {
    const sandbox = {
        console,
        setTimeout, clearTimeout,
        indexedDB: makeFakeIDB(),
        localStorage: makeFakeLocalStorage(),
        document: { addEventListener() {} },
        window: { addEventListener() {} },
    };
    vm.createContext(sandbox);
    const src = fs.readFileSync('c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\storage.js', 'utf8');
    vm.runInContext(src, sandbox, { filename: 'storage.js' });
    const run2 = code => vm.runInContext(code, sandbox);

    let failed = false;
    const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

    // ---- 1. fresh install: no save anywhere ----
    check('fresh install: hasSave() is false', (await run2('Storage.hasSave()')) === false);
    check('fresh install: loadGame() is null', (await run2('Storage.loadGame()')) === null);

    // ---- 2. legacy localStorage save + migration ----
    run2(`localStorage.setItem(Storage.LEGACY_KEY, JSON.stringify({week:5, players:['p1'], agency:{name:'Legacy FC'}}))`);
    check('legacy save seeded', (await run2('Storage.hasSave()')) === true);
    await run2('Storage.migrateLegacy()');
    const migrated = await run2('Storage.loadGame()');
    check('migration: loadGame() returns migrated data', migrated && migrated.agency && migrated.agency.name === 'Legacy FC');
    const legacyStillThere = run2(`localStorage.getItem(Storage.LEGACY_KEY)`);
    check('migration: legacy localStorage key removed after verified import', legacyStillThere === null);

    // ---- 3. normal save/load round-trip (debounced) ----
    run2(`Storage.saveGame({week:12, players:['a','b'], agency:{name:'New Agency'}})`);
    // read back before the debounce timer fires — saveGame() must make new data visible
    // immediately via loadGame() even though the disk write is still pending
    let immediate = await run2('Storage.loadGame()');
    check('save is readable immediately (pre-flush) via the in-memory pending write', immediate && immediate.agency.name === 'New Agency');
    await run2('Storage.flush()');
    const afterFlush = await run2('Storage.loadGame()');
    check('after flush(): IndexedDB has the new save', afterFlush && afterFlush.agency.name === 'New Agency');

    // ---- 4. hasSave reflects the flushed IndexedDB save ----
    check('hasSave() true after flush', (await run2('Storage.hasSave()')) === true);

    // ---- 5. deleteSave wipes everything ----
    await run2('Storage.deleteSave()');
    check('deleteSave(): hasSave() false', (await run2('Storage.hasSave()')) === false);
    check('deleteSave(): loadGame() null', (await run2('Storage.loadGame()')) === null);

    // ---- 6. IndexedDB unavailable -> localStorage fallback still works ----
    const sandbox2 = {
        console, setTimeout, clearTimeout,
        indexedDB: undefined,
        localStorage: makeFakeLocalStorage(),
        document: { addEventListener() {} }, window: { addEventListener() {} },
    };
    vm.createContext(sandbox2);
    vm.runInContext(src, sandbox2, { filename: 'storage.js' });
    const run3 = code => vm.runInContext(code, sandbox2);
    run3(`Storage.saveGame({week:1, players:[], agency:{name:'No IDB here'}})`);
    await run3('Storage.flush()');
    const fbLoaded = await run3('Storage.loadGame()');
    check('no-IndexedDB fallback: save/load round-trips via localStorage', fbLoaded && fbLoaded.agency.name === 'No IDB here');

    console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll checks passed.');
    process.exit(failed ? 1 : 0);
}
run();
