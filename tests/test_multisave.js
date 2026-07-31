// Multi-save backend: one rolling autosave PLUS up to five manual named saves. Verifies create /
// list / load / delete, the 5-slot cap, overwrite-by-name, that named snapshots are independent of
// the autosave (advancing the game doesn't mutate an earlier snapshot), and that loading a slot
// becomes the new autosave.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'injuries-data.js', 'simulation.js'];

// a keyed fake IndexedDB that retains put values by key (deep-copied, like structured clone) so named
// slots and the autosave live side by side, and a stored snapshot can't alias the live game state
function makeDisk() {
    const map = new Map();
    const idb = { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = store; if (r.onsuccess) r.onsuccess(); }, 0); return r; } };
    const store = {
        objectStoreNames: { contains: () => true }, createObjectStore() { return {}; },
        transaction() {
            const tx = { oncomplete: null, onerror: null, onabort: null, objectStore: () => ({
                put(v, k) { map.set(k, JSON.parse(JSON.stringify(v))); setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); return {}; },
                get(k) { const rq = {}; setTimeout(() => { rq.result = map.has(k) ? map.get(k) : undefined; if (rq.onsuccess) rq.onsuccess(); }, 0); return rq; },
                delete(k) { map.delete(k); setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); return {}; }
            }) };
            return tx;
        }
    };
    return { idb, map };
}
function sandbox(disk) {
    const g = { console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: disk.idb, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, window: { addEventListener() {} }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
    vm.createContext(g);
    for (const f of engine) vm.runInContext(fs.readFileSync(base + f, 'utf8'), g, { filename: f });
    return g;
}
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };
const runv = (g, c) => vm.runInContext('(function(){' + c + '})()', g);
const runa = (g, c) => vm.runInContext('(async function(){' + c + '})()', g);

(async () => {
    const disk = makeDisk();
    const A = sandbox(disk);
    runv(A, `Clubs.init(); GameState.startNewGame('Netherlands', 'Slot FC');`);
    runv(A, `GameState.agency.reputation = 60; GameState.agency.balance = 5e7;
      GameState.players.filter(p => p.age <= 22 && p.ability >= 55 && p.ability <= 70).slice(0, 6).forEach(p => Agency.signPlayer(p, 10, 10, 5));`);
    runv(A, `for (let i = 0; i < 6; i++) Sim.advanceWeek();`);
    await runa(A, `Storage._flushTimer = null; GameState.save(); await Storage.flush();`);

    const autoMeta = JSON.parse(await runa(A, `const m = await GameState.autosaveMeta(); return JSON.stringify(m);`));
    check('autosave meta reads back (week + agency)', autoMeta && autoMeta.week >= 7 && autoMeta.agency === 'Slot FC', `week=${autoMeta && autoMeta.week}`);
    // a played-on autosave that was never named-saved is "dirty" (would warn before a Load replaces it)
    check('autosave is dirty (namedClean false) before any named save', autoMeta.namedClean === false);

    // create "Alpha" at ~week 7, remember its clients + week
    const alpha = JSON.parse(await runa(A, `
        const r = await GameState.createNamedSave('Alpha');
        const clients = Agency.clients().map(p => p.id).sort();
        return JSON.stringify({ r, week: GameState.week, clients });
    `));
    check('createNamedSave returns ok + id', alpha.r.ok && alpha.r.id, alpha.r.message);
    check('one named save now listed', (await runa(A, `return (await GameState.listNamedSaves()).length;`)) === 1);
    // saving to a slot marks the live game (and its autosave) clean; advancing dirties it again
    check('game is clean right after a named save', runv(A, `return GameState.namedClean;`) === true);
    check('autosave reads clean right after a named save', (JSON.parse(await runa(A, `return JSON.stringify(await GameState.autosaveMeta());`))).namedClean === true);
    runv(A, `Sim.advanceWeek();`);
    check('advancing a week dirties it again', runv(A, `return GameState.namedClean;`) === false);

    // advance further, then create "Beta" at a later week
    runv(A, `for (let i = 0; i < 6; i++) Sim.advanceWeek();`);
    const beta = JSON.parse(await runa(A, `const r = await GameState.createNamedSave('Beta'); return JSON.stringify({ r, week: GameState.week });`));
    check('two named saves listed', (await runa(A, `return (await GameState.listNamedSaves()).length;`)) === 2, `betaWeek=${beta.week}`);

    // the Alpha snapshot must NOT have moved with the game (independent snapshot)
    const alphaStored = JSON.parse(await runa(A, `const d = await Storage.getSlot('${alpha.r.id}'); return JSON.stringify({ week: d.week, name: d.saveName });`));
    check('named snapshot is frozen at save time (not advanced with the game)', alphaStored.week === alpha.week && alphaStored.week < beta.week, `alpha=${alphaStored.week} beta=${beta.week}`);

    // overwrite by name (case-insensitive) keeps the slot count — overwrite Beta so Alpha stays frozen
    const over = JSON.parse(await runa(A, `const r = await GameState.createNamedSave('beta'); return JSON.stringify(r);`));
    check('reusing a name overwrites (count stays 2)', over.ok && over.overwritten && (await runa(A, `return (await GameState.listNamedSaves()).length;`)) === 2);

    // fill to the cap of 5, then the 6th is refused
    await runa(A, `await GameState.createNamedSave('C'); await GameState.createNamedSave('D'); await GameState.createNamedSave('E');`);
    check('cap reached at five saves', (await runa(A, `return (await GameState.listNamedSaves()).length;`)) === 5);
    const sixth = JSON.parse(await runa(A, `return JSON.stringify(await GameState.createNamedSave('F'));`));
    check('a sixth NEW save is refused (full)', sixth.ok === false && sixth.full === true, sixth.message);
    check('overwriting an existing name still works when full', (await runa(A, `return (await GameState.createNamedSave('C')).ok;`)) === true);

    // load Alpha into a FRESH game and confirm it matches Alpha's snapshot, and becomes the autosave
    const B = sandbox(disk);
    runv(B, `Clubs.init();`);
    const loaded = JSON.parse(await runa(B, `
        const ok = await GameState.loadNamedSave('${alpha.r.id}');
        const clients = Agency.clients().map(p => p.id).sort();
        return JSON.stringify({ ok, week: GameState.week, clients, clean: GameState.namedClean });
    `));
    check('loadNamedSave restores the frozen snapshot (week + clients)',
        loaded.ok && loaded.week === alpha.week && JSON.stringify(loaded.clients) === JSON.stringify(alpha.clients),
        `week=${loaded.week} clients=${loaded.clients.length}`);
    check('a freshly loaded slot is clean (no false warning next time)', loaded.clean === true);
    await runa(B, `await Storage.flush();`);
    const bAuto = JSON.parse(await runa(B, `const m = await GameState.autosaveMeta(); return JSON.stringify(m);`));
    check('loading a slot becomes the new autosave (Continue resumes it)', bAuto && bAuto.week === alpha.week, `autoWeek=${bAuto && bAuto.week}`);

    // delete a slot (Beta, by the id we captured on creation)
    await runa(A, `await GameState.deleteNamedSave('${beta.r.id}');`);
    check('deleteNamedSave removes exactly one slot (5 → 4)', (await runa(A, `return (await GameState.listNamedSaves()).length;`)) === 4);

    console.log(failed ? '\n*** FAIL ***' : '\nAll multi-save checks passed.');
    process.exit(failed ? 1 : 0);
})();
