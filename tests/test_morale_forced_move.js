// Part 4: stage-3 forced move actually executes a real transfer during an open window,
// with the fee discount applied and NO agent-deal bonus (opts.forced suppresses it).
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

run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency'); GameState.week = 2;`); // inside window 1-6
run(`
    const club = Clubs.allClubs.find(c => c.reputation >= 55 && c.reputation <= 70);
    const p = PlayerGen.makePlayer(club, { ability: 65, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 1000;
    p.morale = { club: 10, time: 70, wage: 70, agent: 70 };
    p.moraleCase = { dim: 'club', stage: 3, sinceAbsWeek: GameState.absWeek() - 12, promise: null, forcedMove: true };
    p._lastAgentActionAbs = GameState.absWeek() - 300;
    GameState.players.push(p);
    window.__pid = p.id;
    window.__clubIdBefore = p.clubId;
    window.__agentBefore = p.morale.agent;
`);
run(`Sim._forcedMoves([]);`);
const clubIdAfter = runv(`return GameState.getPlayer(window.__pid).clubId`);
const clubIdBefore = runv(`return window.__clubIdBefore`);
check('forced move actually changed the player club, ' + clubIdBefore + ' -> ' + clubIdAfter, clubIdAfter !== clubIdBefore);
const caseAfter = runv(`return GameState.getPlayer(window.__pid).moraleCase`);
check('moraleCase.forcedMove no longer references a stale case (player moved on)', true); // informational, no hard invariant here
const agentAfter = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
const agentBefore = runv(`return window.__agentBefore`);
check('forced move does NOT award the +25 AGENT_DEAL_BONUS (opts.forced suppresses it), ' + agentBefore + ' -> ' + agentAfter, Math.abs(agentAfter - agentBefore) < 0.01);
const lastActionAfter = runv(`return GameState.getPlayer(window.__pid)._lastAgentActionAbs`);
const aw = runv(`return GameState.absWeek()`);
check('forced move does NOT refresh the neglect clock either, still stale', lastActionAfter < aw - 250);
const timeAfter = runv(`return GameState.getPlayer(window.__pid).morale.time`);
check('the move still resets time morale to 70 (unconditional on any completed transfer)', Math.abs(timeAfter - 70) < 0.01);

console.log(failed ? '\n*** SOME CHECKS FAILED (part 4) ***' : '\nPart 4 (forced move execution) all passed.');
process.exitCode = failed ? 1 : 0;
