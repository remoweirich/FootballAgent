// Negotiation overhaul (Phase 2):
//  Part A  — the keystone: agent fee and wage draw from ONE budget, so a fat fee squeezes the wage.
//  Pass 1  — the threat/patience meter: push-back costs patience; at the ceiling the club walks.
//  Pass 2  — the profile classifier (Parasite/Champion/Wildcat/Optimizer) modulating patience +
//            conclusion goodwill; Champion generosity flexes the pool.
//  Pass 3  — data-driven club lines (negLine) keyed by profile x threat band x context.
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
    // fee 0: wage exactly at the ceiling is accepted
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
// a plain over-ask (fee 0, wage 1.2x the club's opening) classifies NEUTRAL, so the patience
// meter runs at its base rate and the walkout / relationship hit are the clean Pass-1 values.
const t2 = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = GameState.getPlayer(window.__p);
    GameState.agency.relationships[club.id] = 50;
    let neg = Agency.initNeg(null, club, 500);
    const probe = Agency.evaluateTransfer(p, club, { wage: 9e9, role: 'rotation', term: 3, bonus: 0, fee: 0 }, neg);
    const role = probe.counter.role, ask = Math.round(probe.counter.wage * 1.2);
    neg = Agency.initNeg(null, club, probe.counter.wage);
    let status = '', rounds = 0, profile = '';
    while (rounds < 25) {
        const r = Agency.evaluateTransfer(p, club, { wage: ask, role, term: 3, bonus: 0, fee: 0 }, neg);
        status = r.status; profile = r.neg.profile; rounds++;
        if (status === 'walkout') break;
    }
    return JSON.stringify({ status, rounds, profile, relAfter: Agency.relationship(club.id) });
`));
check('a plain over-ask stays NEUTRAL (patience runs at base rate)', t2.profile === 'NEUTRAL');
check('a relentless over-ask eventually makes the club walk out', t2.status === 'walkout');
check('the walkout drops the relationship by 20 (50 -> ' + t2.relAfter + ')', t2.relAfter === 30);

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
        let neg = Agency.initNeg(null, club, 500);
        const probe = Agency.evaluateTransfer(p, club, { wage: 9e9, role: 'rotation', term: 3, bonus: 0, fee: 0 }, neg);
        const role = probe.counter.role, ask = Math.round(probe.counter.wage * 1.2);
        neg = Agency.initNeg(null, club, probe.counter.wage);
        let n = 0;
        while (n < 30) { const r = Agency.evaluateTransfer(p, club, { wage: ask, role, term: 3, bonus: 0, fee: 0 }, neg); n++; if (r.status === 'walkout') break; }
        return n;
    }
    return JSON.stringify({ warm: roundsToWalk('ajax', 90), frosty: roundsToWalk('Liverpool', 20) });
`));
check('a frosty club walks out no later than a warm one (' + t3.frosty + ' <= ' + t3.warm + ')', t3.frosty <= t3.warm);

// ================= 4. profile classifier (Pass 2) =================
const cl = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = GameState.getPlayer(window.__p);
    function classify(wage, bonus, hist) {
        const neg = Agency.initNeg(null, club, 1000);
        if (hist) neg.history = hist;
        return Agency.classifyOffer(p, club, { wage, bonus, term: 3, role: 'rotation' }, neg).profile;
    }
    return JSON.stringify({
        parasite: classify(1050, 900000, [{ w: 1050, f: 900000 }]),                 // fat fee, wage barely above opening
        champion: classify(1400, 0, [{ w: 1400, f: 0 }]),                           // no fee, wage well above opening
        wildcat: classify(1500, 800000, [{ w: 1500, f: 800000 }]),                  // greedy, high wage, stubborn
        optimizer: classify(1100, 20000, [{ w: 1400, f: 20000 }, { w: 1100, f: 20000 }]),  // sensible, conceded toward club
        neutral: classify(1050, 20000, [{ w: 1050, f: 20000 }])                     // nothing special
    });
`));
check('classifyOffer: Parasite = fat fee, flat take-home', cl.parasite === 'Parasite');
check('classifyOffer: Champion = fee waived to push the wage', cl.champion === 'Champion');
check('classifyOffer: Wildcat = greedy, high and stubborn', cl.wildcat === 'Wildcat');
check('classifyOffer: Optimizer = sensible term, met the club', cl.optimizer === 'Optimizer');
check('classifyOffer: everything else is NEUTRAL', cl.neutral === 'NEUTRAL');

// Champion generosity flexes the wage ceiling above the base
const fx = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = GameState.getPlayer(window.__p);
    const base = Math.round(Agency.maxClubWage(p, club) / 10) * 10;
    const neg = Agency.initNeg(null, club, 1000);
    const r = Agency.evaluateTransfer(p, club, { wage: 9e9, role: 'rotation', term: 3, bonus: 0, fee: 0 }, neg);
    return JSON.stringify({ base, champ: r.counter.wage, profile: r.neg.profile });
`));
check('a fee-waived offer is classified Champion', fx.profile === 'Champion');
check('Champion generosity flexes the ceiling above the base (' + fx.champ + ' > ' + fx.base + ')', fx.champ > fx.base);

// conclusion goodwill deltas
const crd = JSON.parse(runv(`return JSON.stringify({
    champ: Agency.concludeRelDelta('Champion', 5), champFast: Agency.concludeRelDelta('Champion', 2),
    para: Agency.concludeRelDelta('Parasite', 5), wild: Agency.concludeRelDelta('Wildcat', 5), neut: Agency.concludeRelDelta('NEUTRAL', 5)
});`));
check('conclude deltas: Champion +6, +4 more for a fast deal', crd.champ === 6 && crd.champFast === 10);
check('conclude deltas: Parasite 0, Wildcat -6, Neutral +2', crd.para === 0 && crd.wild === -6 && crd.neut === 2);

// accepting a Champion deal lifts the negotiating club's relationship by its profile delta
const acc = JSON.parse(runv(`
    const from = Clubs.getClubById('psv'), to = Clubs.getClubById('Chelsea');
    const p = PlayerGen.makePlayer(from, { ability: 78, age: 24, position: 'ST' });
    p.agentId = 'me'; p.everClient = true; p.clubId = from.id; p.wage = 3000;
    GameState.players.push(p);
    GameState.week = 1;   // transfer window open -> immediate completion
    const relBefore = Agency.relationship(to.id);
    const mail = GameState.addMail({ kind: 'transfer', offer: { playerId: p.id, fromClubId: from.id, toClubId: to.id, transferFee: 5000000,
        neg: { _init: true, round: 5, threat: 20, profile: 'Champion', wInitial: 3000, history: [], lastCounter: null } } });
    const r = Agency.acceptTransfer(mail, 3200, null, 3, 0);
    return JSON.stringify({ ok: r.ok, relBefore, relAfter: Agency.relationship(to.id) });
`));
check('accepting a Champion deal lifts the club relationship by 6 (' + acc.relBefore + ' -> ' + acc.relAfter + ')', acc.ok && acc.relAfter === Math.min(100, acc.relBefore + 6));

// ================= 5. data-driven club lines (Pass 3) =================
const nl = JSON.parse(runv(`return JSON.stringify({
    authored: Agency.negLine('Wildcat', 'high', 'transfer', { wage: '1', role: 'r', term: 3, bonus: '2', bits: 'b', hint: '' }),
    missing: Agency.negLine('NEUTRAL', 'low', 'transfer', {})
});`));
check('negLine returns an authored profile line', nl.authored.length > 0 && nl.authored.indexOf('Take it or leave it') !== -1);
check('negLine returns empty for an unauthored cell (generic fallback)', nl.missing === '');

// ================= 6. renewal threat meter -> walkout + own-word rule =================
const t6 = JSON.parse(runv(`
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
check('renewal: pushing an impossible wage every round makes the club walk', t6.status === 'walkout');
check('renewal walkout drops the relationship by 20 (' + t6.relBefore + ' -> ' + t6.relAfter + ')', t6.relAfter === Math.max(0, t6.relBefore - 20));

const t7 = JSON.parse(runv(`
    const club = Clubs.getClubById('Chelsea');
    const p = PlayerGen.makePlayer(club, { ability: 70, age: 25, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 1000;
    GameState.players.push(p);
    const neg = Agency.initNeg(null, club, 1000);
    const r1 = Agency.negotiateWage(p, club, 9e9, neg);          // way too much -> counter C
    const r2 = Agency.negotiateWage(p, club, r1.counter, neg);   // ask exactly C -> accepted
    return JSON.stringify({ s1: r1.status, s2: r2.status, c1: r1.counter });
`));
check('renewal round 1 produces a counter', t7.s1 === 'counter' && t7.c1 > 0);
check('asking exactly the club\u2019s own counter is accepted', t7.s2 === 'accept');

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll negotiation checks passed.');
process.exitCode = failed ? 1 : 0;
