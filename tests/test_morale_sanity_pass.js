// SANITY PASS (spec-required): season-by-season morale.agent distribution for a fully passive
// agent vs an active agent, plus a gift-spam-on-neglected-star check. No case/promise machinery
// involved here - pure agent-dimension neglect decay in isolation, run directly against the
// real MORALE constants and the real weekly decay code path (Sim._morale).
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
const run = (sb, code) => vm.runInContext('{' + code + '}', sb);
const runv = (sb, code) => vm.runInContext('(function(){' + code + '})()', sb);

function freshClient(sb) {
    run(sb, `Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency'); GameState.week = 1;`);
    run(sb, `
        const club = Clubs.allClubs[0];
        const p = PlayerGen.makePlayer(club, { ability: 65, age: 24, position: 'CM' });
        p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 2000;
        p.morale.agent = 100;   // fresh deal (+25, clamped)
        p._lastAgentActionAbs = GameState.absWeek();
        p._weekApps = 1;        // keep other dimensions irrelevant/neutral - playing every week
        GameState.players.push(p);
        window.__pid = p.id;
    `);
}

console.log('=== Scenario A: fully passive agent (one fresh deal, then total silence) ===');
{
    const sb = buildSandbox();
    freshClient(sb);
    for (let season = 1; season <= 6; season++) {
        for (let w = 0; w < 52; w++) run(sb, `GameState.week += 1; Sim._morale([]);`);
        const agent = runv(sb, `return GameState.getPlayer(window.__pid).morale.agent`);
        const band = runv(sb, `return moraleBand(GameState.getPlayer(window.__pid).morale.agent)`);
        console.log(`  season ${season} end: agent=${agent.toFixed(2)}  (${band})`);
    }
}

console.log('\n=== Scenario B: active agent (one deal every ~2 seasons, nothing else) ===');
{
    const sb = buildSandbox();
    freshClient(sb);
    for (let season = 1; season <= 6; season++) {
        for (let w = 0; w < 52; w++) run(sb, `GameState.week += 1; Sim._morale([]);`);
        // once every 2 seasons, touch _lastAgentActionAbs (simulate "did literally anything")
        if (season % 2 === 0) run(sb, `Agency._creditAgentAction(GameState.getPlayer(window.__pid), 0);`);
        const agent = runv(sb, `return GameState.getPlayer(window.__pid).morale.agent`);
        const band = runv(sb, `return moraleBand(GameState.getPlayer(window.__pid).morale.agent)`);
        console.log(`  season ${season} end: agent=${agent.toFixed(2)}  (${band})`);
    }
}

console.log('\n=== Scenario C: gift-spam on a neglected star (no real deals, gifts only) ===');
{
    const sb = buildSandbox();
    freshClient(sb);
    run(sb, `GameState.agency.balance = 1e9;`); // money is not the bottleneck we're testing
    let weeksTotal = 0;
    for (let season = 1; season <= 6; season++) {
        for (let w = 0; w < 52; w++) {
            run(sb, `GameState.week += 1; Sim._morale([]);`);
            weeksTotal++;
            // gift every single week, whichever tier is off cooldown - the spammiest possible play
            run(sb, `
                const p = GameState.getPlayer(window.__pid);
                for (const tier of ['large','medium','small']) {
                    const r = Agency.giveGift(p, tier);
                    if (r.ok) break;
                }
            `);
        }
        const agent = runv(sb, `return GameState.getPlayer(window.__pid).morale.agent`);
        const band = runv(sb, `return moraleBand(GameState.getPlayer(window.__pid).morale.agent)`);
        console.log(`  season ${season} end: agent=${agent.toFixed(2)}  (${band})`);
    }
}
