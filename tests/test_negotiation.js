// Negotiation overhaul (Phase 2), Part A + Pass 1:
//  - the keystone: agent fee and wage draw from ONE budget, so a fat fee squeezes the wage
//  - the threat/patience meter: each round the club has to push back it loses patience, and
//    at the ceiling (or after enough rounds) it walks out, dropping the relationship.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];
function makeFakeIDB() { return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } }; }
const sb = { console: { log: () => { }, warn: () => { }, error: () => { } }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => String(n) } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
vm.runInContext('{ Storage.saveGame = () => {}; Storage.flush = async () => {}; }', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands', 'Nego');
    const club = Clubs.getClubById('ajax');
    const p = PlayerGen.makePlayer(club, { ability: 72, age: 25, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = 'psv'; p.wage = 1000;
    GameState.players.push(p);
    window.__p = p.id;`);

// ================= 1. keystone: the agent fee eats wage room =================
const t1 = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = GameState.getPlayer(window.__p);
    const TF = 100000000;                         // big transfer fee -> generous fee ceiling (agentFeeCap up to 5M)
    // probe the wage ceiling + an acceptable role at fee 0
    let neg = Agency.initNeg(null, club, 500);
    const probe = Agency.evaluateTransfer(p, club, { wage: 9e9, role: 'rotation', term: 3, bonus: 0, fee: TF }, neg);
    const role = probe.counter.role, maxWage = probe.counter.wage;
    // fee 0: wage exactly at the ceiling is accepted (today's behaviour preserved)
    neg = Agency.initNeg(null, club, 500);
    const a0 = Agency.evaluateTransfer(p, club, { wage: maxWage, role, term: 3, bonus: 0, fee: TF }, neg);
    // the fee ceiling (so the bonus stays within it and the squeeze is the reason, not an over-limit bonus)
    neg = Agency.initNeg(null, club, 500);
    const feeCeil = Agency.evaluateTransfer(p, club, { wage: 100, role, term: 3, bonus: 9e15, fee: TF }, neg).counter.bonus;
    const B = Math.min(maxWage * 156, feeCeil);   // an amortized fee big enough to visibly cut the wage room
    // same wage, now with a hefty (in-ceiling) agent fee -> no longer fits
    neg = Agency.initNeg(null, club, 500);
    const a1 = Agency.evaluateTransfer(p, club, { wage: maxWage, role, term: 3, bonus: B, fee: TF }, neg);
    // dropping the wage to the squeezed counter is accepted again -> the frontier is explorable
    neg = Agency.initNeg(null, club, 500);
    const a2 = Agency.evaluateTransfer(p, club, { wage: a1.counter.wage, role, term: 3, bonus: B, fee: TF }, neg);
    return JSON.stringify({ maxWage, s0: a0.status, s1: a1.status, cw1: a1.counter.wage, s2: a2.status, inCeil: B <= feeCeil });
`));
check('setup: fee is within the club ceiling (isolates the wage squeeze)', t1.inCeil === true);
check('fee 0: wage at the ceiling is accepted', t1.s0 === 'accept');
check('a hefty agent fee squeezes the wage room: the same wage no longer fits (' + t1.s1 + ')', t1.s1 !== 'accept');
check('the squeezed counter wage is below the fee-free ceiling (' + t1.cw1 + ' < ' + t1.maxWage + ')', t1.cw1 < t1.maxWage);
check('dropping the wage to the squeezed counter is accepted again', t1.s2 === 'accept');

// ================= 2. transfer threat meter -> walkout =================
const t2 = JSON.parse(runv(`
    const club = Clubs.getClubById('Liverpool');
    const p = GameState.getPlayer(window.__p);
    const relBefore = Agency.relationship(club.id);
    const neg = Agency.initNeg(null, club, 500);
    let status = '', rounds = 0;
    while (rounds < 25) {
        const r = Agency.evaluateTransfer(p, club, { wage: 9e9, role: 'key', term: 3, bonus: 5000000, fee: 100000000 }, neg);
        status = r.status; rounds++;
        if (status === 'walkout') break;
    }
    return JSON.stringify({ status, rounds, relBefore, relAfter: Agency.relationship(club.id) });
`));
check('a relentlessly greedy package eventually makes the club walk out', t2.status === 'walkout');
check('the walkout drops the relationship by 20 (' + t2.relBefore + ' -> ' + t2.relAfter + ')', t2.relAfter === Math.max(0, t2.relBefore - 20));

// ================= 3. threat seeded by the relationship =================
const ti = JSON.parse(runv(`return JSON.stringify({ warm: Agency.threatInit(85), warmEdge: Agency.threatInit(78), neutral: Agency.threatInit(55), frosty: Agency.threatInit(30), cold: Agency.threatInit(20) });`));
check('threatInit: a warm club starts calm', ti.warm === 0 && ti.warmEdge === 0);
check('threatInit: a neutral club is mildly on the clock', ti.neutral === 8);
check('threatInit: a frosty club is already on edge', ti.frosty === 30 && ti.cold === 30);

const t3 = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__p);
    function roundsToWalk(clubId, rel) {
        GameState.agency.relationships[clubId] = rel;
        const club = Clubs.getClubById(clubId);
        const neg = Agency.initNeg(null, club, 500);
        let n = 0;
        while (n < 30) { const r = Agency.evaluateTransfer(p, club, { wage: 9e9, role: 'key', term: 3, bonus: 4000000, fee: 100000000 }, neg); n++; if (r.status === 'walkout') break; }
        return n;
    }
    return JSON.stringify({ warm: roundsToWalk('ajax', 90), frosty: roundsToWalk('Liverpool', 20) });
`));
check('a frosty club walks out no later than a warm one (' + t3.frosty + ' <= ' + t3.warm + ')', t3.frosty <= t3.warm);

// ================= 4. renewal threat meter -> walkout =================
const t4 = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = PlayerGen.makePlayer(club, { ability: 68, age: 27, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 1200;
    GameState.players.push(p);
    const relBefore = Agency.relationship(club.id);
    const neg = Agency.initNeg(null, club, 1200);
    let status = '', n = 0;
    while (n < 25) { const r = Agency.negotiateWage(p, club, 9e9, neg); status = r.status; n++; if (status === 'walkout') break; }
    return JSON.stringify({ status, n, relBefore, relAfter: Agency.relationship(club.id) });
`));
check('renewal: pushing an impossible wage every round makes the club walk', t4.status === 'walkout');
check('renewal walkout drops the relationship by 20 (' + t4.relBefore + ' -> ' + t4.relAfter + ')', t4.relAfter === Math.max(0, t4.relBefore - 20));

// a club never goes back on its own word: its own last counter is always a done deal
const t5 = JSON.parse(runv(`
    const club = Clubs.getClubById('Chelsea');
    const p = PlayerGen.makePlayer(club, { ability: 70, age: 25, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 1000;
    GameState.players.push(p);
    const neg = Agency.initNeg(null, club, 1000);
    const r1 = Agency.negotiateWage(p, club, 9e9, neg);          // way too much -> counter C
    const r2 = Agency.negotiateWage(p, club, r1.counter, neg);   // ask exactly C -> accepted
    return JSON.stringify({ s1: r1.status, s2: r2.status, c1: r1.counter });
`));
check('renewal round 1 produces a counter', t5.s1 === 'counter' && t5.c1 > 0);
check('asking exactly the club\u2019s own counter is accepted', t5.s2 === 'accept');

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll negotiation checks passed.');
process.exitCode = failed ? 1 : 0;
