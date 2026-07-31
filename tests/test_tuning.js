// Tuning batch: halved bench decay, quartered club decay, U18 club-morale lock, escalation
// window gate (covered in test_morale_escalation), role-based contract caps, reserve registry.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];
function makeFakeIDB() { return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } }; }
const sb = { console: { log: () => { }, warn: () => { }, error: () => { } }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => String(n) } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = code => vm.runInContext('{' + code + '}', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

run(`Clubs.init(); GameState.startNewGame('Switzerland', 'Tuning Test'); GameState.week = 20;`);

// ---- reserve<->parent registry (the Basel U21 bug) ----
check('reserveClubFor(Basel) -> Basel U21', runv(`const r = reserveClubFor('Basel'); return r && r.id === 'Basel U21';`));
check('parentClubForReserve(Basel U21) -> Basel', runv(`const r = parentClubForReserve('Basel U21'); return r && r.id === 'Basel';`));
check('Dutch still works: reserveClubFor(ajax) -> jong-ajax', runv(`const r = reserveClubFor('ajax'); return r && r.id === 'jong-ajax';`));
check('German: parentClubForReserve(Bayern II) -> Bayern Munich', runv(`const r = parentClubForReserve('Bayern II'); return r && r.id === 'Bayern Munich';`));
check('Spanish: parentClubForReserve(Valencia B) -> Valencia (name Mestalla!)', runv(`const r = parentClubForReserve('Valencia B'); return r && r.id === 'Valencia';`));
check('Lugano special case intact', runv(`const r = parentClubForReserve('FC Lugano U21'); return r && r.id === 'FC Lugano';`));

// ---- morale tuning ----
run(`
    const club = Clubs.getClubById('Basel');
    const kid = PlayerGen.makePlayer(club, { ability: 40, age: 15, position: 'CM' });
    kid.agentId = 'me'; kid.everClient = true; kid.clubId = club.id;
    kid.morale.club = 40; kid._weekApps = 1;
    GameState.players.push(kid);
    window.__kid = kid.id;
`);
run(`Sim._morale([]);`);
const kidClub = runv(`return GameState.getPlayer(window.__kid).morale.club`);
check('U18: club morale pinned at 80 regardless of club gap, got ' + kidClub, kidClub === 80);

run(`
    const club = Clubs.getClubById('Basel');   // rep 80
    const vet = PlayerGen.makePlayer(club, { ability: 95, age: 25, position: 'ST' });
    vet.agentId = 'me'; vet.everClient = true; vet.clubId = club.id;
    vet.morale.club = 80; vet._weekApps = 1;
    GameState.players.push(vet);
    window.__vet = vet.id;
`);
run(`Sim._morale([]);`);
const vetClub = runv(`return GameState.getPlayer(window.__vet).morale.club`);
// target = 50 + (80-95)*1.5 = 27.5 -> raw drift (27.5-80)*0.1 = -5.25 -> quartered = -1.3125
check('adult club decay quartered: 80 -> ' + vetClub + ' (expected 78.6875, was 75 before)', Math.abs(vetClub - 78.6875) < 0.001);

// bench decay halved: -1 first bench week (also verifies half-tick mid tier value exists)
const bench = runv(`
    const p = GameState.getPlayer(window.__vet);
    p.morale.time = 50; p._playStreak = 0; p._benchStreak = 0; p._weekApps = 0;
    Sim._morale([]);
    return p.morale.time;
`);
check('bench decay halved: 1 week benched -> -1, got ' + bench, Math.abs(bench - 49) < 1e-6);

// ---- contract caps by role-at-that-club ----
const caps = JSON.parse(runv(`
    const bayern = Clubs.getClubById('Bayern Munich');           // rep 90
    const zurich = Clubs.allClubs.find(c => c.reputation <= 70 && c.reputation >= 65);
    const mk = (age, ability) => { const q = PlayerGen.makePlayer(bayern, { ability, age, position: 'CM' }); return q; };
    return JSON.stringify({
        fringe34AtBayern: Agency.maxContractTerm(mk(34, 76), bayern),   // 90-76=14 gap -> fringe -> 1
        sameManWhereKey: Agency.maxContractTerm(mk(34, 76), zurich),    // outclasses -> key -> 6
        star35: Agency.maxContractTerm(mk(35, 95), bayern),             // key -> uncapped 6
        starter32: Agency.maxContractTerm(mk(32, 90), bayern),          // d=0 -> starter -> 4
        starter33: Agency.maxContractTerm(mk(33, 90), bayern),          // 3
        rotation34: Agency.maxContractTerm(mk(34, 85), bayern),         // rotation -> 2
        fringe32: Agency.maxContractTerm(mk(32, 76), bayern),           // 3
        young29: Agency.maxContractTerm(mk(29, 76), bayern)             // under 32 -> 6 (the screenshot bug)
    });
`));
check('34yo fringe at Bayern: max 1yr, got ' + caps.fringe34AtBayern, caps.fringe34AtBayern === 1);
check('same 34yo where he would star: max 6yrs, got ' + caps.sameManWhereKey, caps.sameManWhereKey === 6);
check('35yo star: never age-capped (6), got ' + caps.star35, caps.star35 === 6);
check('32yo starter: 4, got ' + caps.starter32, caps.starter32 === 4);
check('33yo starter: 3, got ' + caps.starter33, caps.starter33 === 3);
check('34yo rotation: 2, got ' + caps.rotation34, caps.rotation34 === 2);
check('32yo fringe: 3, got ' + caps.fringe32, caps.fringe32 === 3);
check('29yo (any role): 6 - the "29yo max 3" screenshot bug is gone, got ' + caps.young29, caps.young29 === 6);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll tuning checks passed.');
process.exitCode = failed ? 1 : 0;
