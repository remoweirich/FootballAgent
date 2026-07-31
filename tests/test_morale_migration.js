// Part 5: old-save migration. Simulates loading a pre-morale-rework save (players lack
// morale/moraleCase/streak/gift fields entirely) and confirms _migrateMoraleFields backfills
// everything without clobbering any pre-existing values.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

let savedBlob = null;
function makeFakeIDB() {
    return { open(name) { const req = { result: null, onupgradeneeded: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } };
}
function buildSandbox() {
    const sandbox = { console, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    // stub Storage.loadGame/saveGame with an in-memory blob we control directly, so we can
    // hand-craft an "old save" payload with old-format player objects (no morale fields).
    // Storage is declared `const` at top level, so it's a lexical binding, not an own
    // property of the sandbox object - must be patched via runInContext, not from the host.
    sandbox.__getSavedBlob = () => savedBlob;
    sandbox.__setSavedBlob = (d) => { savedBlob = d; };
    vm.runInContext(`{ Storage.loadGame = async () => __getSavedBlob(); Storage.saveGame = (d) => __setSavedBlob(d); }`, sandbox);
    return sandbox;
}
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };
const sb = buildSandbox();
const run = code => vm.runInContext('{' + code + '}', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);
const runa = code => vm.runInContext('(async function(){' + code + '})()', sb);

run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency');`);
run(`
    const club = Clubs.allClubs[0];
    const p = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
    // strip every morale-rework field to simulate a genuinely old save
    delete p.morale; delete p.moraleCase; delete p._badStreak; delete p._playStreak;
    delete p._benchStreak; delete p._lastAgentActionAbs; delete p._neglectWarned;
    delete p._moraleHist; delete p._giftLog;
    GameState.players.push(p);
    window.__pid = p.id;
`);
// Stage the blob through the host setter (like the second half below). The old save() stored a live
// reference to the players array, so a bare `savedBlob = {...}` here used to leak later pushes in by
// luck; the slim save filters players into a fresh array, so the payload must be set explicitly.
run(`__setSavedBlob({ week: GameState.week, seasonStartYear: GameState.seasonStartYear, homeCountry: GameState.homeCountry, players: GameState.players, inbox: GameState.inbox, log: GameState.log, agency: GameState.agency, league: GameState.league, clubHistory: GameState.clubHistory, lastSeasonReport: GameState.lastSeasonReport });`);

async function main() {
// simulate a fresh app load against that "old" blob
await runa(`
    GameState.players = []; GameState.agency = null;
    const ok = await GameState.load();
    window.__loadOk = ok;
`);
const loadOk = runv(`return window.__loadOk`);
check('old-format save loads without throwing, ok=' + loadOk, loadOk === true);
const p = runv(`return JSON.stringify(GameState.getPlayer(window.__pid))`);
const parsed = JSON.parse(p);
check('morale object backfilled to defaults', parsed.morale && parsed.morale.club === 70 && parsed.morale.time === 70 && parsed.morale.wage === 70 && parsed.morale.agent === 70);
check('moraleCase backfilled to null', parsed.moraleCase === null);
check('_badStreak backfilled to zeros', parsed._badStreak && parsed._badStreak.club === 0 && parsed._badStreak.agent === 0);
check('_playStreak/_benchStreak backfilled to 0', parsed._playStreak === 0 && parsed._benchStreak === 0);
check('_lastAgentActionAbs seeded with current absWeek (not 0/null)', typeof parsed._lastAgentActionAbs === 'number' && parsed._lastAgentActionAbs > 0);
check('_moraleHist seeded with a single entry matching current morale', Array.isArray(parsed._moraleHist) && parsed._moraleHist.length === 1 && parsed._moraleHist[0].club === 70);
check('_giftLog backfilled with all-null tiers', parsed._giftLog && parsed._giftLog.small === null && parsed._giftLog.lastAny === null);

// migration must NOT clobber existing values on a save that already has partial fields
run(`
    const club = Clubs.allClubs[0];
    const p2 = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
    p2.agentId = 'me'; p2.everClient = true; p2.clubId = club.id;
    p2.morale = { club: 12, time: 34, wage: 56, agent: 78 };
    delete p2.moraleCase; delete p2._badStreak;
    GameState.players.push(p2);
    window.__pid2 = p2.id;
    __setSavedBlob({ week: GameState.week, seasonStartYear: GameState.seasonStartYear, homeCountry: GameState.homeCountry, players: GameState.players, inbox: GameState.inbox, log: GameState.log, agency: GameState.agency, league: GameState.league, clubHistory: GameState.clubHistory, lastSeasonReport: GameState.lastSeasonReport });
`);
await runa(`
    GameState.players = []; GameState.agency = null;
    await GameState.load();
`);
const p2After = runv(`return JSON.stringify(GameState.getPlayer(window.__pid2))`);
const parsed2 = JSON.parse(p2After);
check('migration does not overwrite an existing morale object, got ' + JSON.stringify(parsed2.morale), parsed2.morale.club === 12 && parsed2.morale.agent === 78);

console.log(failed ? '\n*** SOME CHECKS FAILED (part 5) ***' : '\nPart 5 (save migration) all passed.');
process.exitCode = failed ? 1 : 0;
}
main();
