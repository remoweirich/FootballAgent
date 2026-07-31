const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

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

run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency'); GameState.week = 2;`); // summer window: 0.5/1/1.5/2 all offered raw

// 1 season remaining (contractUntilSeason = currentSeason+1) -> 2-season loan must be excluded, 1-season allowed
run(`
    const p = GameState.getPlayer(Agency.clients()[0] ? Agency.clients()[0].id : null) || (() => {
        const club = Clubs.allClubs[0];
        const pl = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
        pl.agentId = 'me'; pl.everClient = true; pl.clubId = club.id;
        GameState.players.push(pl);
        return pl;
    })();
    p.contractUntilSeason = GameState.seasonStartYear + 1;   // 1 season remaining
    window.__pid = p.id;
`);
const codesOneYearLeft = runv(`return Agency.loanDurationOptions(GameState.getPlayer(window.__pid)).map(o => o.code)`);
check('1 season remaining: only 0.5 and 1 offered, got ' + JSON.stringify(codesOneYearLeft), JSON.stringify(codesOneYearLeft) === JSON.stringify(['0.5', '1']));

// 2 seasons remaining -> everything up to 2 seasons should be allowed (all 4 summer options)
run(`GameState.getPlayer(window.__pid).contractUntilSeason = GameState.seasonStartYear + 2;`);
const codesTwoYearsLeft = runv(`return Agency.loanDurationOptions(GameState.getPlayer(window.__pid)).map(o => o.code)`);
check('2 seasons remaining: all 4 summer options offered, got ' + JSON.stringify(codesTwoYearsLeft), JSON.stringify(codesTwoYearsLeft) === JSON.stringify(['0.5', '1', '1.5', '2']));

// 0 seasons remaining (contract expires at the end of THIS season) -> no valid loan durations at all
run(`GameState.getPlayer(window.__pid).contractUntilSeason = GameState.seasonStartYear;`);
const codesZero = runv(`return Agency.loanDurationOptions(GameState.getPlayer(window.__pid)).map(o => o.code)`);
check('0 seasons remaining: no loan durations offered, got ' + JSON.stringify(codesZero), codesZero.length === 0);

// acceptLoanOffer must reject outright when no valid duration exists (defensive, not just UI-side)
run(`
    const p = GameState.getPlayer(window.__pid);
    const borrower = Clubs.allClubs.find(c => c.id !== p.clubId);
    const mail = { offer: { playerId: p.id, toClubId: borrower.id, role: 'starter' } };
    window.__r = Agency.acceptLoanOffer(mail, 'starter', '2');
`);
const rejectResult = runv(`return JSON.stringify(window.__r)`);
check('acceptLoanOffer rejects when contract leaves no room for any loan, got ' + rejectResult, JSON.parse(rejectResult).ok === false);

// with 1 season remaining, requesting the disallowed '2' code should silently fall back to the longest ALLOWED option (1), not bypass the cap
run(`
    const p = GameState.getPlayer(window.__pid);
    p.contractUntilSeason = GameState.seasonStartYear + 1;
    const borrower = Clubs.allClubs.find(c => c.id !== p.clubId);
    const mail = { offer: { playerId: p.id, toClubId: borrower.id, role: 'starter' } };
    window.__r2 = Agency.acceptLoanOffer(mail, 'starter', '2');
`);
const loanUntilAfter = runv(`return GameState.getPlayer(window.__pid).loanUntilSeason`);
const contractUntil = runv(`return GameState.getPlayer(window.__pid).contractUntilSeason`);
check('requesting an over-length code falls back to the longest ALLOWED duration (loanUntilSeason < contractUntilSeason), loanUntil=' + loanUntilAfter + ' contractUntil=' + contractUntil, loanUntilAfter < contractUntil);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nLoan-cap tests all passed.');
process.exitCode = failed ? 1 : 0;
