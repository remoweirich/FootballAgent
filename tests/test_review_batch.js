// Focused coverage for the review-batch changes not exercised elsewhere:
//  - Storage flush race: a save queued DURING an in-flight write must not be lost
//  - Sponsor uniqueness: acceptSponsor refuses a second deal from a brand he already carries
//  - Clubs.getClubById Map index returns the same objects as a linear scan
//  - Schema-version migration pipeline runs legacy saves forward
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const engine = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };

// ---------- Storage flush race (real Storage against a controllable fake IDB) ----------
(async () => {
    // a fake IDB whose put() resolves only when we release it — lets us queue a newer save mid-write
    let releasePut = null;
    const puts = [];
    const fakeIdb = {
        open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = store; if (r.onsuccess) r.onsuccess(); }, 0); return r; }
    };
    const store = {
        objectStoreNames: { contains: () => true }, createObjectStore() { return {}; },
        transaction() {
            // the returned tx object is the SAME one Storage sets .oncomplete on, and the one put()'s
            // release callback fires — otherwise the write promise never resolves
            const tx = {
                oncomplete: null, onerror: null, onabort: null,
                objectStore: () => ({
                    put(v) { puts.push(v); new Promise(res => { releasePut = res; }).then(() => { if (tx.oncomplete) tx.oncomplete(); }); return {}; },
                    get() { const rq = {}; setTimeout(() => { if (rq.onsuccess) rq.onsuccess(); }, 0); return rq; },
                    delete() { return {}; }
                })
            };
            return tx;
        }
    };
    const sb = { console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: fakeIdb, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, window: { addEventListener() {} } };
    vm.createContext(sb);
    vm.runInContext(fs.readFileSync(base + 'storage.js', 'utf8'), sb, { filename: 'storage.js' });
    const S = vm.runInContext('Storage', sb);
    S.FLUSH_DELAY_MS = 5;

    S.saveGame({ v: 1 });
    const flushP = S.flush();                       // starts writing {v:1}
    await new Promise(r => setTimeout(r, 0));        // let the put() begin
    S.saveGame({ v: 2 });                            // NEWER save arrives mid-write
    releasePut();                                    // finish the {v:1} write
    await new Promise(r => setTimeout(r, 0));
    if (releasePut) releasePut();                    // finish the follow-up {v:2} write
    await flushP;
    check('storage: a save queued during an in-flight write is not lost (v2 written)', puts.some(p => p.v === 2), 'puts=' + JSON.stringify(puts.map(p => p.v)));
    check('storage: nothing left dirty after draining', S._dirty == null);

    // ---------- the rest, in the normal engine sandbox ----------
    function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
    const g = { console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(), localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, window: { addEventListener() {} }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
    vm.createContext(g);
    for (const f of engine) vm.runInContext(fs.readFileSync(base + f, 'utf8'), g, { filename: f });
    const runv = c => vm.runInContext('(function(){' + c + '})()', g);
    runv(`Clubs.init(); GameState.startNewGame('Netherlands', 'Batch Test');`);

    // getClubById Map index parity
    check('clubs: Map index returns the same object as a linear scan, for every id', runv(`
      return Clubs.allClubs.every(c => Clubs.getClubById(c.id) === c) && Clubs.getClubById('does-not-exist') === undefined;
    `));

    // sponsor uniqueness: acceptSponsor refuses a brand he already holds an active deal with
    check('sponsor: a second deal from a brand he already carries is refused', runv(`
      const p = Agency.clients()[0] || GameState.players[0];
      p.sponsorDeals = [{ company: 'Naik', weekly: 100, annual: 0, untilSeason: GameState.seasonStartYear + 1 }];
      p.sponsorCommission = 10;
      const dupe = Agency.acceptSponsor({ offer: { playerId: p.id, options: [{ company: 'Naik', weekly: 50, annual: 0, termSeasons: 1 }] } }, 0);
      const other = Agency.acceptSponsor({ offer: { playerId: p.id, options: [{ company: 'Adadis', weekly: 50, annual: 0, termSeasons: 1 }] } }, 0);
      return dupe.ok === false && /already has an active deal/i.test(dupe.message) && other.ok === true;
    `));

    // schema-version pipeline: a legacy save (no schemaVersion) runs migrations forward
    check('schema: legacy save (no schemaVersion) is inferred as v1 and migrates to current', runv(`
      let ranWorldV2 = false, ranScout = false;
      const origWV = GameState._migrateWorldV2, origSc = GameState._migrateScoutRegions;
      GameState._migrateWorldV2 = () => { ranWorldV2 = true; };
      GameState._migrateScoutRegions = () => { ranScout = true; };
      GameState._runMigrations({ clubState: null });   // no schemaVersion, no worldV -> v1
      GameState._migrateWorldV2 = origWV; GameState._migrateScoutRegions = origSc;
      return ranWorldV2 && ranScout;
    `));
    check('schema: a current-version save skips the versioned migrations', runv(`
      let ran = false;
      const orig = GameState._migrateWorldV2;
      GameState._migrateWorldV2 = () => { ran = true; };
      GameState._runMigrations({ clubState: null, schemaVersion: GameState.SCHEMA_VERSION });
      GameState._migrateWorldV2 = orig;
      return ran === false;
    `));

    console.log(failed ? '\n*** FAIL ***' : '\nAll review-batch checks passed.');
    process.exit(failed ? 1 : 0);
})();
