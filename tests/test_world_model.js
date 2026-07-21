// World-model v2 tests: frozen NPCs, direct club strength, seasonal delta rolls, anchor/legacy
// reputation split, migration of pre-V2 saves, and a full-season sanity pass.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

let sharedDisk = null;
function makeFakeIDB() {
    return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } };
}
function buildSandbox() {
    const errors = [];
    const sandbox = {
        console: { log: () => { }, warn: () => { }, error: (...a) => errors.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) },
        setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(),
        localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
        document: { addEventListener() { } }, window: { addEventListener() { } },
        UI: { money: n => Math.round(n || 0).toLocaleString('en-US') }
    };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    sandbox.__diskGet = () => sharedDisk;
    sandbox.__diskSet = (d) => { sharedDisk = d; };
    vm.runInContext(`{ Storage.loadGame = async () => __diskGet(); Storage.saveGame = (d) => __diskSet(d); Storage.flush = async () => {}; Storage.hasSave = async () => __diskGet() != null; }`, sandbox);
    sandbox.__errors = errors;
    return sandbox;
}
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };
const run = (sb, code) => vm.runInContext('{' + code + '}', sb);
const runv = (sb, code) => vm.runInContext('(function(){' + code + '})()', sb);
const runa = (sb, code) => vm.runInContext('(async function(){' + code + '})()', sb);

async function main() {

// ================= 1. roll tables + strength + legacy mechanics =================
{
    const sb = buildSandbox();
    run(sb, `Clubs.init(); GameState.startNewGame('Germany', 'World Test');`);

    // roll bounds, both directions
    const bounds = runv(sb, `
        let ok = true;
        for (let t = 0; t < 5; t++) for (let i = 0; i < 500; i++) {
            const d = rollFromTable(t, i % 2 === 1);
            if (Math.abs(d) > 5 || !Number.isInteger(d)) ok = false;
        }
        return ok;
    `);
    check('rollFromTable stays within ±5 integers across all 5 tables, both directions', bounds);

    // clientless club strength = reputation + seasonDelta exactly (direct, no blend)
    const direct = runv(sb, `
        const bayern = Clubs.getClubById('Bayern Munich');
        bayern.seasonDelta = -3;
        const s = League.clubStrength('Bayern Munich');
        bayern.seasonDelta = 0;
        return JSON.stringify({ s, expected: bayern.reputation - 3 });
    `);
    const dd = JSON.parse(direct);
    check(`clientless club strength = rep + seasonDelta (direct): ${dd.s} vs ${dd.expected}`, dd.s === dd.expected);

    // client bonus: 90-ability client at a ~60-rep club lifts strength by (90-base)/11
    const bonus = runv(sb, `
        const club = Clubs.allClubs.find(c => c.reputation === 60 || c.reputation === 61);
        const p = PlayerGen.makePlayer(club, { ability: 90, age: 25, position: 'ST' });
        p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
        GameState.players.push(p);
        GameState.week += 0;  // same week: bust the squad cache by shifting week
        GameState.week = GameState.week === 52 ? 1 : GameState.week + 1;
        const base = club.reputation + (club.seasonDelta || 0);
        const s = League.clubStrength(club.id);
        GameState.players.pop();
        GameState.week = GameState.week === 1 ? 52 : GameState.week - 1;
        return JSON.stringify({ lift: s - base, expected: (90 - base) / 11 });
    `);
    const bb = JSON.parse(bonus);
    check(`star client lifts club strength by (ability-base)/11: got +${bb.lift.toFixed(2)}, expected +${bb.expected.toFixed(2)}`, Math.abs(bb.lift - bb.expected) < 0.01);

    // transfer raises rep promptly to the roster-justified target (anchor + (ability-anchor)/11)
    const legacy = runv(sb, `
        const club = Clubs.allClubs.find(c => c.reputation <= 55 && c.country === 'Germany');
        const anchorBefore = club.anchorRep, repBefore = club.reputation;
        const p = PlayerGen.makePlayer(club, { ability: 88, age: 25, position: 'ST' });
        p.agentId = 'me'; p.everClient = true; p.clubId = Clubs.allClubs[0].id;
        GameState.players.push(p);
        const mail = { offer: { playerId: p.id, fromClubId: p.clubId, toClubId: club.id, transferFee: 100000 } };
        GameState.week = 2;   // transfer window open
        const r = Agency.acceptTransfer(mail, 1000, null, 2, 0);
        window.__auraClubId = club.id; window.__auraPid = p.id;
        return JSON.stringify({ ok: r.ok, anchorBefore, anchorAfter: club.anchorRep, rep: club.reputation, repBefore,
            expected: Math.round(anchorBefore + (88 - anchorBefore) / 11) });
    `);
    const lg = JSON.parse(legacy);
    check('transfer accepted for reputation-rise test: ' + JSON.stringify(lg), lg.ok === true);
    check(`transfer raises rep to target: anchor unchanged (${lg.anchorBefore}->${lg.anchorAfter}), rep ${lg.repBefore} -> ${lg.rep} (expected ${lg.expected})`, lg.anchorAfter === lg.anchorBefore && lg.rep === lg.expected && lg.rep > lg.repBefore);

    // uncapped: parking 10 grown talents at a tiny club lifts its rep way past the old +8 cap
    const ellikon = runv(sb, `
        const club = Clubs.allClubs.find(c => c.reputation <= 30);
        const anchor = club.anchorRep;
        for (let i = 0; i < 10; i++) {
            const t = PlayerGen.makePlayer(club, { ability: 52, age: 21, position: 'CM' });
            t.agentId = 'me'; t.everClient = true; t.clubId = club.id;
            GameState.players.push(t);
        }
        League.normalizeReputations();   // rollover recompute: rep rises to roster-justified level
        return JSON.stringify({ anchor, rep: club.reputation, expected: Math.round(anchor + 10 * (52 - anchor) / 11) });
    `);
    const el = JSON.parse(ellikon);
    check(`Ellikon scenario: 10x 52-rated talents at anchor-${el.anchor} club -> rep ${el.rep} (expected ${el.expected}, way past old +8 cap)`, el.rep === el.expected && el.rep - el.anchor > 8);

    // after the star leaves: rep does NOT snap down, it fades 1-5/season toward the new target
    const decay = runv(sb, `
        const club = Clubs.getClubById(window.__auraClubId);
        const p = GameState.getPlayer(window.__auraPid);
        p.clubId = Clubs.allClubs[0].id;   // he leaves
        const before = club.reputation;
        League.normalizeReputations();
        const after1 = club.reputation;
        League.normalizeReputations();
        League.normalizeReputations();
        return JSON.stringify({ before, after1, after3: club.reputation, anchor: club.anchorRep });
    `);
    const dc = JSON.parse(decay);
    check(`departure fade: rep ${dc.before} -> ${dc.after1} (drop 1-5, no snap) -> ${dc.after3} (settles at anchor ${dc.anchor})`, dc.after1 < dc.before && dc.before - dc.after1 <= 5 && dc.after1 >= dc.anchor && dc.after3 === dc.anchor);

    // anchor cap: 12 straight promotions can't push anchor past baseRep+10
    const cap = runv(sb, `
        const club = Clubs.allClubs.find(c => c.baseRep === 50 || c.baseRep === 51);
        for (let i = 0; i < 12; i++) League._repDrift([club.id], []);
        return JSON.stringify({ base: club.baseRep, anchor: club.anchorRep });
    `);
    const cp = JSON.parse(cap);
    check(`anchor capped at baseRep+10: base ${cp.base}, anchor ${cp.anchor}`, cp.anchor <= cp.base + 10);
}

// ================= 2. frozen NPCs across a season + roll wiring =================
{
    const sb = buildSandbox();
    run(sb, `Clubs.init(); GameState.startNewGame('Netherlands', 'Freeze Test');`);
    run(sb, `
        // pick a pure NPC and a client AT A DIFFERENT CLUB (teammates of clients legitimately
        // still collect stats as match dressing - the frozen guarantee is for everyone else)
        const clubA = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 1);
        const clubB = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 2);
        const npc = GameState.players.find(p => !isSimRelevant(p) && p.clubId === clubB.id);
        const cl = PlayerGen.makePlayer(clubA, { ability: 70, age: 20, position: 'CM' });
        cl.agentId = 'me'; cl.everClient = true; cl.clubId = clubA.id;
        GameState.players.push(cl);
        window.__npcId = npc.id; window.__clId = cl.id;
        window.__npcAge = npc.age; window.__npcAb = npc.ability;
        window.__clAge = cl.age;
    `);
    // run most of the season, then check the FINISHED table before rollover resets it
    for (let i = 0; i < 45; i++) run(sb, `Sim.advanceWeek();`);
    const table = JSON.parse(runv(sb, `
        const t = League.sortedTable('ERE');
        return JSON.stringify({ top: t[0] ? t[0].Pts : 0, bottom: t[t.length-1] ? t[t.length-1].Pts : 0, n: t.length });
    `));
    let rolled = false, guard = 0;
    while (!rolled && guard++ < 15) rolled = runv(sb, `return !!Sim.advanceWeek().rolledSeason;`);
    check('season rolled', rolled);
    const frozen = JSON.parse(runv(sb, `
        const npc = GameState.getPlayer(window.__npcId), cl = GameState.getPlayer(window.__clId);
        return JSON.stringify({
            npcAgeSame: npc.age === window.__npcAge, npcAbSame: npc.ability === window.__npcAb,
            npcNoStats: Object.keys(npc.stats || {}).length === 0,
            clAged: cl.age > window.__clAge,
            clHasStats: Object.keys(cl.stats || {}).length > 0,
            deltasSet: Clubs.allClubs.filter(c => c.seasonDelta !== 0).length,
            deltasInBounds: Clubs.allClubs.every(c => Math.abs(c.seasonDelta || 0) <= 5),
            streaksSet: Clubs.allClubs.filter(c => c.streakDir).length
        });
    `));
    check('NPC did not age across a full season', frozen.npcAgeSame);
    check('NPC ability unchanged across a full season', frozen.npcAbSame);
    check('NPC accumulated zero stats', frozen.npcNoStats);
    check('client DID age', frozen.clAged);
    check('client DID accumulate stats', frozen.clHasStats);
    check('season deltas rolled at rollover (' + frozen.deltasSet + ' clubs non-zero, all within ±5)', frozen.deltasSet > 50 && frozen.deltasInBounds);
    check('streaks recorded for clubs (' + frozen.streaksSet + ')', frozen.streaksSet > 500);
    check('no console errors during the season, got ' + JSON.stringify(sb.__errors.slice(0, 2)), sb.__errors.length === 0);

    // table sanity (captured pre-rollover above): champion points plausible, spread exists
    check(`ERE table sane: champion ${table.top} pts > bottom ${table.bottom} pts, plausible range`, table.top > table.bottom && table.top >= 55 && table.top <= 105 && table.bottom >= 5);
}

// ================= 3. pre-V2 save migration =================
{
    sharedDisk = null;
    const A = buildSandbox();
    run(A, `Clubs.init(); GameState.startNewGame('Netherlands', 'Migrate Test');`);
    run(A, `
        // simulate a legacy save: aged/decayed NPCs with stats, inflated club rep, no worldV
        const npc = GameState.players.find(p => !isSimRelevant(p) && p.clubId);
        npc.age = 39; npc.ability = 12;
        npc.stats = { 2025: { x: { clubId: npc.clubId, loan: false, youth: false, order: 1, comps: { ERE: { apps: 30, goals: 1, assists: 2, cs: 0, yellow: 4, red: 0, ratingSum: 200 } } } } };
        window.__npcId = npc.id;
        const ajax = Clubs.getClubById('ajax');
        ajax.reputation = 90;   // inflated way past its anchor (82) by old-model star signings
        GameState.save();
        delete __diskGet().schemaVersion; delete __diskGet().worldV;   // pretend the save predates versioning (legacy v1)
    `);
    const B = buildSandbox();
    run(B, `Clubs.init();`);
    await runa(B, `await GameState.load();`);
    const mig = JSON.parse(runv(B, `
        const npc = GameState.getPlayer(window.__npcId ?? '') || GameState.players.find(p => p.age === 39 && !isSimRelevant(p));
        const anyOld = GameState.players.filter(p => !isSimRelevant(p) && !p.archived && (p.age > 34 || Object.keys(p.stats||{}).length > 0)).length;
        const ajax = Clubs.getClubById('ajax');
        return JSON.stringify({ anyOldOrStatted: anyOld, ajaxAnchor: ajax.anchorRep, ajaxRep: ajax.reputation, savedSchema: __diskGet().schemaVersion, curSchema: GameState.SCHEMA_VERSION });
    `));
    check('migration regenerated all aged/statted NPCs (remaining: ' + mig.anyOldOrStatted + ')', mig.anyOldOrStatted === 0);
    check(`migration keeps inflated rep to fade naturally: anchor ${mig.ajaxAnchor} (static 82), rep ${mig.ajaxRep} (kept at 90)`, mig.ajaxAnchor === 82 && mig.ajaxRep === 90);
    check('migration stamped the current schemaVersion into the save', mig.savedSchema === mig.curSchema);
}

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll world-model checks passed.');
process.exitCode = failed ? 1 : 0;

}
main();
