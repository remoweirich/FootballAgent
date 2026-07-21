// Part 7: proactive-loan agent bonus (spec 5b) - a loan agreed while time morale is below
// GOOD earns +12 (or +18 with an open playingTime-promise case); no bonus if time was already GOOD.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

function makeFakeIDB() {
    return { open(name) { const req = { result: null, onupgradeneeded: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } };
}
function buildSandbox() {
    const sandbox = { console, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    return sandbox;
}
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };
const sb = buildSandbox();
const run = code => vm.runInContext('{' + code + '}', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);

function freshLoanClient(sb, timeVal) {
    run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency'); GameState.week = 2;`);
    run(`
        const club = Clubs.allClubs.find(c => c.reputation <= 55) || Clubs.allClubs[0];
        const p = PlayerGen.makePlayer(club, { ability: 55, age: 22, position: 'CM' });
        p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
        p.morale.time = ${timeVal};
        p._lastAgentActionAbs = GameState.absWeek() - 300;
        window.__pid = p.id;
        GameState.players.push(p);
    `);
}

// Case 1: time morale BELOW good (e.g. 40, MID band) and NO open playingTime case -> AGENT_LOAN_BONUS (12)
freshLoanClient(sb, 40);
run(`
    const p = GameState.getPlayer(window.__pid);
    const borrower = Clubs.allClubs.find(c => c.id !== p.clubId);
    const mail = { offer: { playerId: p.id, toClubId: borrower.id, role: 'starter' } };
    window.__before = p.morale.agent;
    window.__r1 = Agency.acceptLoanOffer(mail, 'starter', null);
`);
const before1 = runv(`return window.__before`);
const after1 = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
const ok1 = runv(`return window.__r1.ok`);
check('loan accepted, ok=' + ok1, ok1 === true);
check('proactive loan while time<GOOD, no open case: +12 (AGENT_LOAN_BONUS), ' + before1 + ' -> ' + after1, Math.abs(after1 - (before1 + 12)) < 0.01);
const timeAfterLoan1 = runv(`return GameState.getPlayer(window.__pid).morale.time`);
check('loan resets time morale to 70 regardless', Math.abs(timeAfterLoan1 - 70) < 0.01);

// Case 2: time morale BELOW good AND an open playingTime-promise case -> AGENT_LOAN_BONUS_OPEN_CASE (18)
freshLoanClient(sb, 30);
run(`
    const p = GameState.getPlayer(window.__pid);
    p.moraleCase = { dim: 'time', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: { type: 'playingTime', deadlineAbsWeek: GameState.absWeek() + 10 } };
    const borrower = Clubs.allClubs.find(c => c.id !== p.clubId);
    const mail = { offer: { playerId: p.id, toClubId: borrower.id, role: 'starter' } };
    window.__before2 = p.morale.agent;
    window.__r2 = Agency.acceptLoanOffer(mail, 'starter', null);
`);
const before2 = runv(`return window.__before2`);
const after2 = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
// +18 (AGENT_LOAN_BONUS_OPEN_CASE) AND the loan also fulfills the pending playingTime promise,
// which separately awards +10 (PROMISE_KEPT_AGENT) via _checkPromiseKept - both apply, so +28 total
check('proactive loan with an open playingTime-promise case: +18 loan bonus + +10 promise-kept = +28, ' + before2 + ' -> ' + after2, Math.abs(after2 - (before2 + 28)) < 0.01);
const caseAfterLoan2 = runv(`return GameState.getPlayer(window.__pid).moraleCase`);
check('the playingTime promise is fulfilled too (case closes)', caseAfterLoan2 === null);

// Case 3: time morale already GOOD -> no bonus at all (still resets the neglect clock, per code comment)
freshLoanClient(sb, 90);
run(`
    const p = GameState.getPlayer(window.__pid);
    const borrower = Clubs.allClubs.find(c => c.id !== p.clubId);
    const mail = { offer: { playerId: p.id, toClubId: borrower.id, role: 'starter' } };
    window.__before3 = p.morale.agent;
    Agency.acceptLoanOffer(mail, 'starter', null);
`);
const before3 = runv(`return window.__before3`);
const after3 = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
check('no bonus when time was already GOOD, ' + before3 + ' -> ' + after3, Math.abs(after3 - before3) < 0.01);
const lastActionAfter3 = runv(`return GameState.getPlayer(window.__pid)._lastAgentActionAbs`);
const awNow = runv(`return GameState.absWeek()`);
check('neglect clock still refreshed even with no bonus', lastActionAfter3 === awNow);

console.log(failed ? '\n*** SOME CHECKS FAILED (part 7) ***' : '\nPart 7 (proactive loan bonus) all passed.');
process.exitCode = failed ? 1 : 0;
