// The .fam export envelope: what travels, what is stripped, what is refused.
// Runs the real SaveFile against a real GameState snapshot, including the real gzip path —
// Node has CompressionStream, so this exercises the same code the WebView runs.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: (f, t) => setTimeout(f, t), clearTimeout,
    indexedDB: undefined,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} }, addEventListener() {}, removeEventListener() {},
    UI: { money: String, esc: String, euro: String },
    // the browser globals the codec uses; Node has all of them
    CompressionStream, DecompressionStream, Response, Blob, Uint8Array,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
};
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'js/i18n.js', 'utf8'), sb, { filename: 'i18n.js' });
vm.runInContext(fs.readFileSync(root + 'js/i18n-en.js', 'utf8'), sb, { filename: 'i18n-en.js' });
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js', 'save-file.js'])
    vm.runInContext(fs.readFileSync(root + 'js/' + f, 'utf8'), sb, { filename: f });

const run = c => vm.runInContext('(function(){' + c + '})()', sb);
const runAsync = c => vm.runInContext('(async function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

vm.runInContext("Clubs.init(); GameState.startNewGame('England','Export Test','A. Tester'); Rng.seed(31);", sb);
for (let i = 0; i < 60; i++) run('Sim.advanceWeek();');

(async () => {
    // ---------------- round trip ----------------
    console.log('-- a career survives the round trip --');
    const snap = run('return JSON.stringify(GameState._snapshot());');
    const packed = await runAsync("return await SaveFile.pack(GameState._snapshot(), { app: 'v1.0.26', season: '26/27' });");
    check('pack succeeds and names a .fam file', packed.ok && /\.fam$/.test(packed.filename));
    check('the header is readable without decoding the payload',
        packed.env.fam === 1 && packed.env.app === 'v1.0.26' && packed.env.game.agency === 'Export Test'
        && packed.env.game.country === 'England' && typeof packed.env.game.week === 'number');
    check('it is gzipped, not raw JSON', packed.env.encoding === 'gzip+base64');
    // the whole point of compressing: the file must be far smaller than the state
    check(`it is much smaller than the raw save (${Math.round(packed.bytes / 1024)} KB vs ${Math.round(snap.length / 1024)} KB)`,
        packed.bytes < snap.length / 2);

    sb.__packed = packed.text;
    const un = await runAsync('return await SaveFile.unpack(__packed);');
    check('unpack succeeds', un.ok === true);
    check('nothing was altered in transit', un.modified === false);

    // equality of the blob is not the point — the career continuing identically is
    const a = JSON.parse(snap); delete a.clubLogos; delete a.savedAt;
    const b = JSON.parse(JSON.stringify(un.state)); delete b.clubLogos; delete b.savedAt;
    check('the state comes back identical (players, league, rngState, clubState)',
        JSON.stringify(a) === JSON.stringify(b));

    // ---------------- logos never travel ----------------
    console.log('\n-- logos are stripped --');
    const logo = 'data:image/png;base64,' + 'Q'.repeat(6000);
    run("GameState.clubLogos = {}; Clubs.allClubs.slice(0, 60).forEach(c => { GameState.clubLogos[c.id] = '" + logo + "'; });");
    const withLogos = await runAsync('return await SaveFile.pack(GameState._snapshot(), {});');
    sb.__wl = withLogos.text;
    const unL = await runAsync('return await SaveFile.unpack(__wl);');
    check('clubLogos is emptied in the payload', !unL.state.clubLogos || Object.keys(unL.state.clubLogos).length === 0);
    // 60 logos is ~350 KB of data URIs; the file must not have grown by anything like that
    check(`60 logos add almost nothing to the file (${Math.round(packed.bytes / 1024)} -> ${Math.round(withLogos.bytes / 1024)} KB)`,
        withLogos.bytes < packed.bytes * 1.1);
    check('club names and competition names still travel',
        'clubNames' in unL.state && 'compNames' in unL.state);
    run('GameState.clubLogos = null;');

    // ---------------- created countries ride along ----------------
    console.log('\n-- a created country is embedded --');
    run(`
        var cc = WorldExt.makeSkeleton('Austria', true);
        cc.clubs.forEach(function (c, i) { c.name = 'Austria Real ' + (i + 1); c.logo = 'data:image/png;base64,ZZZZ'; });
        WorldExt.registerCountry(cc);
    `);
    const withCC = await runAsync('return await SaveFile.pack(GameState._snapshot(), {});');
    sb.__cc = withCC.text;
    const unC = await runAsync('return await SaveFile.unpack(__cc);');
    check('the country travels with the save', !!(unC.world && unC.world.Austria));
    check('all 84 clubs and their names come with it',
        unC.world.Austria.clubs.length === 84 && unC.world.Austria.clubs[0].name === 'Austria Real 1');
    check('its logos are stripped too', unC.world.Austria.clubs.every(c => !c.logo));
    check(`embedding costs only a few KB (${Math.round(packed.bytes / 1024)} -> ${Math.round(withCC.bytes / 1024)} KB)`,
        withCC.bytes - packed.bytes < 12 * 1024);

    // the definition must not drift as the league is played
    const before = JSON.stringify(unC.world.Austria.clubs.map(c => c.id + c.division));
    for (let i = 0; i < 120; i++) run('Sim.advanceWeek();');
    const later = await runAsync('return await SaveFile.pack(GameState._snapshot(), {});');
    sb.__later = later.text;
    const unLater = await runAsync('return await SaveFile.unpack(__later);');
    const after = JSON.stringify(unLater.world.Austria.clubs.map(c => c.id + c.division));
    // registerCountry copies clubs into fresh objects, so prom/rel moves Clubs.allClubs and never
    // WorldExt.created. A refactor that aliased them would make every export describe a drifting world.
    check('promotion and relegation never change the embedded definition', before === after);

    // ---------------- the collision that must not merge ----------------
    console.log('\n-- planning the world on import --');
    const plan = run(`
        var local = WorldExt.created['Austria'];
        var same = JSON.parse(JSON.stringify(local));
        var diff = JSON.parse(JSON.stringify(local));
        diff.clubs[40].name = 'Somebody Else';
        return JSON.stringify({
            same: SaveFile.planWorld({ Austria: same }),
            diff: SaveFile.planWorld({ Austria: diff }),
            fresh: SaveFile.planWorld({ Croatia: WorldExt.makeSkeleton('Croatia', true) })
        });
    `);
    const P = JSON.parse(plan);
    check('an identical country is reused, not reinstalled', P.same.reuse[0] === 'Austria' && !P.same.conflict.length);
    check('a DIFFERENT country of the same name is a conflict', P.diff.conflict[0] === 'Austria');
    check('an unknown country is installed', P.fresh.install[0] === 'Croatia');
    // cosmetics must not trigger a conflict
    const cosmetic = run(`
        var c = JSON.parse(JSON.stringify(WorldExt.created['Austria']));
        c.clubs[3].logo = 'data:image/png;base64,AAA'; c.clubs[3].reputation = 99;
        c.clubs[5].colors = { primary: '#000', secondary: '#fff' };
        return JSON.stringify(SaveFile.planWorld({ Austria: c }));
    `);
    check('a crest, colour or reputation change is NOT a conflict', JSON.parse(cosmetic).reuse[0] === 'Austria');

    // ---------------- refusals ----------------
    console.log('\n-- every refusal says which check failed --');
    const bad = async (label, input, code) => {
        sb.__bad = input;
        const r = await runAsync('return await SaveFile.unpack(__bad);');
        check(label + ' -> ' + (r.error || 'ACCEPTED'), r.ok === false && r.error === code);
    };
    await bad('not JSON', 'this is not a save', 'notjson');
    await bad('JSON but not a save', '{"hello":"world"}', 'notasave');
    await bad('empty', '', 'empty');
    await bad('a save from a newer FORMAT', JSON.stringify({ fam: 99, payload: '{}' }), 'newerformat');
    await bad('a save from a newer SCHEMA', JSON.stringify({ fam: 1, schema: 999, encoding: 'plain', payload: '{}' }), 'newerschema');
    await bad('a truncated payload', JSON.stringify({ fam: 1, encoding: 'gzip+base64', payload: 'not-base64-gzip' }), 'baddata');
    await bad('valid JSON payload that is not a game', JSON.stringify({ fam: 1, encoding: 'plain', payload: '{"week":1}' }), 'notasave');
    const huge = '{"fam":1,"payload":"' + 'x'.repeat(26 * 1024 * 1024) + '"}';
    await bad('a 26 MB file (refused before decompressing)', huge, 'toobig');

    // ---------------- tamper detection ----------------
    console.log('\n-- an edited payload still loads, but is flagged --');
    const tampered = await runAsync(`
        var p = await SaveFile.pack(GameState._snapshot(), {});
        var env = JSON.parse(p.text);
        var body = JSON.parse(await SaveFile._gunzip(SaveFile._unb64(env.payload)));
        body.state.agency.balance = 999999999;
        env.payload = SaveFile._b64(await SaveFile._gzip(JSON.stringify(body)));
        return await SaveFile.unpack(JSON.stringify(env));
    `);
    check('it loads', tampered.ok === true);
    check('...and is marked modified', tampered.modified === true);
    check('the edit is really there', tampered.state.agency.balance === 999999999);

    // ---------------- the plain fallback ----------------
    console.log('\n-- the no-CompressionStream fallback --');
    const plain = await runAsync(`
        var real = SaveFile._hasCompression;
        SaveFile._hasCompression = function () { return false; };
        var p = await SaveFile.pack(GameState._snapshot(), {});
        SaveFile._hasCompression = real;
        var u = await SaveFile.unpack(p.text);
        return { enc: p.env.encoding, ok: u.ok, week: u.state.week, same: u.state.homeCountry };
    `);
    check('it writes plain JSON instead', plain.enc === 'plain' && plain.ok === true);
    check('and unpacks to the same career', plain.same === 'England' && typeof plain.week === 'number');

    // ---------------- import, end to end ----------------
    console.log('\n-- importing a file lands a new slot --');
    // a working IndexedDB stand-in, so Storage's slot/database API is exercised for real
    run(`
        var MEM = {};
        Storage._idbGetKey = function (k) { return Promise.resolve(MEM[k] === undefined ? null : MEM[k]); };
        Storage._idbPutKey = function (k, v) { MEM[k] = JSON.parse(JSON.stringify(v)); return Promise.resolve(true); };
        Storage._idbDeleteKey = function (k) { delete MEM[k]; return Promise.resolve(true); };
        Storage.listSlots = async function () { return (await this._idbGetKey(this.SLOT_INDEX)) || []; };
        Storage.getSlot = async function (id) { return await this._idbGetKey(this.SLOT_PREFIX + id); };
        Storage.listDatabases = async function () { return (await this._idbGetKey(this.DB_INDEX)) || []; };
        Storage.getDatabase = async function (id) { return await this._idbGetKey(this.DB_PREFIX + id); };
        Storage.putDatabase = async function (id, db, meta) {
            await this._idbPutKey(this.DB_PREFIX + id, db);
            var idx = await this.listDatabases(); var e = Object.assign({ id: id }, meta);
            var i = idx.findIndex(function (d) { return d.id === id; });
            if (i >= 0) idx[i] = e; else idx.push(e);
            await this._idbPutKey(this.DB_INDEX, idx); return true;
        };
        __MEMRESET = function () { for (var k in MEM) delete MEM[k]; };
    `);

    sb.__file = withCC.text;   // the export that carries Austria
    const imp = await runAsync('return await GameState.importSave(await SaveFile.unpack(__file));');
    check('the save lands as a new slot', imp.ok === true && !!imp.id);
    check('named after the career', typeof imp.name === 'string' && imp.name.length > 0);
    const stored = await runAsync('return await Storage.getSlot(' + JSON.stringify(imp.id) + ');');
    check('the slot really holds the career', !!stored && stored.homeCountry === 'England' && Array.isArray(stored.players));
    const dbs = await runAsync('return await Storage.listDatabases();');
    check('the world it brought is written to a database, so it survives a restart', dbs.length === 1);
    const db0 = await runAsync('return await Storage.getDatabase((await Storage.listDatabases())[0].id);');
    check('...with all 84 Austrian clubs in it', !!(db0 && db0.countries && db0.countries.Austria)
        && db0.countries.Austria.clubs.length === 84);
    check('the slot points at that database', stored.databaseId === dbs[0].id);

    // importing must never disturb the running career
    const liveBefore = run('return JSON.stringify(GameState._snapshot().agency);');
    await runAsync('return await GameState.importSave(await SaveFile.unpack(__file));');
    check('the running career is untouched by an import',
        run('return JSON.stringify(GameState._snapshot().agency);') === liveBefore);
    const slots2 = await runAsync('return await Storage.listSlots();');
    check('a second import gets its own name rather than colliding',
        slots2.length === 2 && slots2[0].name !== slots2[1].name);

    // ---------------- the conflict must refuse ----------------
    console.log('\n-- a different Austria is refused, not merged --');
    run('__MEMRESET();');
    await runAsync(`
        var other = JSON.parse(JSON.stringify(WorldExt.created['Austria']));
        other.clubs.forEach(function (c, i) { c.name = 'Someone Else ' + (i + 1); });
        return await Storage.putDatabase('dbLocal', { id: 'dbLocal', name: 'Mine', countries: { Austria: other } }, { name: 'Mine' });
    `);
    const conflict = await runAsync('return await GameState.importSave(await SaveFile.unpack(__file));');
    check('refused, with the reason and the country named',
        conflict.ok === false && conflict.error === 'worldconflict' && (conflict.countries || [])[0] === 'Austria');
    check('nothing was written', (await runAsync('return await Storage.listSlots();')).length === 0);
    // the check must read STORED databases: on the Start screen nothing is loaded, so comparing
    // against the live WorldExt.created would have missed this conflict entirely
    const localSeen = await runAsync('return Object.keys(await GameState.localCountries());');
    check('local countries are read from stored databases, not the live registry',
        localSeen.join(',') === 'Austria');

    run('__MEMRESET();');
    await runAsync(`
        var same = JSON.parse(JSON.stringify(WorldExt.created['Austria']));
        return await Storage.putDatabase('dbLocal', { id: 'dbLocal', name: 'Mine', countries: { Austria: same } }, { name: 'Mine' });
    `);
    const reuse = await runAsync('return await GameState.importSave(await SaveFile.unpack(__file));');
    check('an identical world is accepted', reuse.ok === true);
    check('...without creating a second database',
        (await runAsync('return await Storage.listDatabases();')).length === 1);

    // ---------------- caps ----------------
    console.log('\n-- the caps are honoured --');
    run('__MEMRESET();');
    await runAsync(`
        var idx = [];
        for (var i = 0; i < Storage.MAX_SLOTS; i++) idx.push({ id: 'x' + i, name: 'Filler ' + i });
        return await Storage._idbPutKey(Storage.SLOT_INDEX, idx);
    `);
    const full = await runAsync('return await GameState.importSave(await SaveFile.unpack(__file));');
    check('a full slot list refuses with slotsfull', full.ok === false && full.error === 'slotsfull');

    console.log(failed ? '\n*** FAIL ***' : '\nAll save-export checks passed.');
    process.exit(failed ? 1 : 0);
})().catch(e => { console.log('FAIL  threw: ' + (e && e.stack || e)); process.exit(1); });
