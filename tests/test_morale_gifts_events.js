// Part 3: gifts (cost/diminishing returns/tier cooldown/stage-3 refusal) and the positive
// event hooks (trophy, promotion, relegation, hot form).
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
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 1000;
    GameState.players.push(p);
    window.__pid = p.id;
    GameState.agency.balance = 10000000;
`);

// ================= Gifts =================
run(`const p = GameState.getPlayer(window.__pid); p.morale.agent = 50;`);
const smallCost = runv(`return Agency.giftCost('small', GameState.getPlayer(window.__pid))`);
check('small gift cost = wage*1.5 rounded to 10, got ' + smallCost, smallCost === 1500);
const mediumCost = runv(`return Agency.giftCost('medium', GameState.getPlayer(window.__pid))`);
check('medium gift cost = wage*5, got ' + mediumCost, mediumCost === 5000);
const largeCost = runv(`return Agency.giftCost('large', GameState.getPlayer(window.__pid))`);
check('large gift cost = wage*15, got ' + largeCost, largeCost === 15000);
const minCost = runv(`return Agency.giftCost('small', { wage: 1 })`);
check('gift cost floors at min 50, got ' + minCost, minCost === 50);

run(`window.__g1 = Agency.giveGift(GameState.getPlayer(window.__pid), 'small');`);
const g1ok = runv(`return window.__g1.ok`);
const agentAfterG1 = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
check('first small gift accepted and applies full boost, ' + agentAfterG1, g1ok === true && Math.abs(agentAfterG1 - 60) < 0.01);

// second gift of a DIFFERENT tier within 12 weeks -> diminished (half effect, any-prior-gift rule)
run(`window.__g2 = Agency.giveGift(GameState.getPlayer(window.__pid), 'medium');`);
const g2ok = runv(`return window.__g2.ok`);
const agentAfterG2 = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
check('second gift (different tier, <12wk later) diminished to half effect, ' + agentAfterG1 + ' -> ' + agentAfterG2, g2ok === true && Math.abs(agentAfterG2 - (agentAfterG1 + 15)) < 0.01);

// same tier again immediately -> blocked by the 104-week per-tier cooldown
run(`window.__g3 = Agency.giveGift(GameState.getPlayer(window.__pid), 'small');`);
const g3ok = runv(`return window.__g3.ok`);
check('repeating the SAME tier immediately is blocked by the 104-week cooldown', g3ok === false);

// stage-3 agent case -> refuses gifts entirely
run(`
    const p = GameState.getPlayer(window.__pid);
    p.moraleCase = { dim: 'agent', stage: 3, sinceAbsWeek: GameState.absWeek(), promise: null };
`);
run(`window.__g4 = Agency.giveGift(GameState.getPlayer(window.__pid), 'large');`);
const g4ok = runv(`return window.__g4.ok`);
check('stage-3 agent case refuses gifts entirely', g4ok === false);
run(`const p = GameState.getPlayer(window.__pid); p.moraleCase = null;`);

// gift-spam cannot hold GOOD indefinitely: exhaust all 3 tiers, then simulate neglect decay
// resuming (no further deals) and confirm agent morale is NOT sustained at GOOD forever
run(`
    const p = GameState.getPlayer(window.__pid);
    p.morale.agent = 60;
    p._lastAgentActionAbs = GameState.absWeek() - 200; // long neglected already
`);
for (let i = 0; i < 30; i++) run(`GameState.week += 1; Sim._morale([]);`);
const agentAfterLongNeglectNoGifts = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
check('with all gift tiers on cooldown, neglect decay still drags agent morale down over time, got ' + agentAfterLongNeglectNoGifts, agentAfterLongNeglectNoGifts < 60);

// ================= Trophy / promotion / relegation / hot form =================
run(`
    const p = GameState.getPlayer(window.__pid);
    p.morale.club = 50; p.morale.agent = 50;
`);
run(`
    const p = GameState.getPlayer(window.__pid);
    const yr = GameState.seasonStartYear;
    p.stats = p.stats || {};
    p.stats[yr] = { 'trophy': { clubId: p.clubId, loan: false, youth: false, order: 0, comps: { 'dummy_comp': { apps: 5, goals: 0, assists: 0, cs: 0, yellow: 0, red: 0, ratingSum: 5 * 7 } } } };
    const club = Clubs.getClubById(p.clubId);
    League.awardTrophy(club.id, 'dummy_comp', yr, []);
`);
const clubAfterTrophy = runv(`return GameState.getPlayer(window.__pid).morale.club`);
const agentAfterTrophy = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
check('trophy win bumps club morale +12, got ' + clubAfterTrophy, Math.abs(clubAfterTrophy - 62) < 0.01);
check('trophy win bumps agent morale +8, got ' + agentAfterTrophy, Math.abs(agentAfterTrophy - 58) < 0.01);

// hot form. NOTE: Sim._endOfSeason() also calls the real League.finishSeason(), which -
// on this fresh, no-matches-played sandbox - can crown the player's own club champion of
// its division by default table order, firing the TROPHY_CLUB/TROPHY_AGENT hook on TOP of
// hot form for the same player/week. That's a real, independently-verified hook (checked
// above), not a bug, so the assertions below account for it via the trophies-array delta
// instead of assuming an exact isolated hot-form-only delta.
run(`
    const p = GameState.getPlayer(window.__pid);
    p.morale = { club: 50, time: 50, wage: 50, agent: 50 };
    const yr = GameState.seasonStartYear;
    p.stats = p.stats || {};
    p.stats[yr] = { 'hot': { clubId: p.clubId, loan: false, youth: false, order: 0, comps: { 'dummy_comp': { apps: 12, goals: 2, assists: 1, cs: 0, yellow: 0, red: 0, ratingSum: 12 * 7.8 } } } };
    window.__trophiesBefore = p.trophies.length;
`);
run(`Sim._endOfSeason([], []);`);
const hf = runv(`const p = GameState.getPlayer(window.__pid); return JSON.stringify(p.morale)`);
const parsed = JSON.parse(hf);
const gotTrophyToo = runv(`return GameState.getPlayer(window.__pid).trophies.length`) > runv(`return window.__trophiesBefore`);
const expClub = 50 + 30 + (gotTrophyToo ? 12 : 0);
const expAgent = 50 + 20 + (gotTrophyToo ? 8 : 0);
check('hot form: time +15, got ' + parsed.time, Math.abs(parsed.time - 65) < 0.01);
check('hot form: wage -10, got ' + parsed.wage, Math.abs(parsed.wage - 40) < 0.01);
check('hot form: club +30' + (gotTrophyToo ? ' (+ a real trophy this season, +12)' : '') + ', got ' + parsed.club, Math.abs(parsed.club - expClub) < 0.01);
check('hot form: agent +20' + (gotTrophyToo ? ' (+ a real trophy this season, +8)' : '') + ', got ' + parsed.agent, Math.abs(parsed.agent - expAgent) < 0.01);

console.log(failed ? '\n*** SOME CHECKS FAILED (part 3) ***' : '\nPart 3 (gifts + positive events) all passed.');
process.exitCode = failed ? 1 : 0;
