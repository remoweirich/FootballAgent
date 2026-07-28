// Part 6: stage-3 agent case actually executes the departure (agentId=null, farewell mail,
// agency rep hit) once repExpired is true, either immediately or after the grace window.
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

run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency');`);
run(`
    const club = Clubs.allClubs[0];
    const p = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
    p.repExpired = true;
    p.morale = { club: 70, time: 70, wage: 70, agent: 10 };   // must stay BAD or the case auto-resolves before departure fires
    p.moraleCase = { dim: 'agent', stage: 3, sinceAbsWeek: GameState.absWeek(), promise: null };
    GameState.players.push(p);
    window.__pid = p.id;
    window.__repBefore = GameState.agency.reputation;
`);
run(`Sim._moraleCases([]);`);
const agentIdImmediate = runv(`return GameState.getPlayer(window.__pid).agentId`);
check('stage-3 agent case does NOT depart the same week it is discovered (grace window applies)', agentIdImmediate === 'me');
const graceWeeks = runv(`return (typeof MORALE !== 'undefined' && MORALE.STAGE3_AGENT_LEAVE_WEEKS) || 8`);
for (let i = 0; i < graceWeeks + 1; i++) run(`GameState.week += 1; Sim._moraleCases([]);`);
const agentIdAfter = runv(`return GameState.getPlayer(window.__pid).agentId`);
check('after the grace window, the player actually leaves (agentId=null)', agentIdAfter === null);
const caseAfter = runv(`return GameState.getPlayer(window.__pid).moraleCase`);
check('moraleCase cleared on departure', caseAfter === null);
const repAfter = runv(`return GameState.agency.reputation`);
const repBefore = runv(`return window.__repBefore`);
check('agency reputation dinged by DEPARTURE_AGENCY_REP, ' + repBefore + ' -> ' + repAfter, repAfter < repBefore);

console.log(failed ? '\n*** SOME CHECKS FAILED (part 6) ***' : '\nPart 6 (agent departure) all passed.');
process.exitCode = failed ? 1 : 0;
