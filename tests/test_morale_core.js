// Engine-only test harness for the morale rework: loads the real engine files via vm,
// and exercises the core formulas + weekly mechanics directly, without any UI/browser.
// NOTE: every snippet passed to run() is wrapped in its own block `{ ... }` — vm.runInContext
// calls sharing one context accumulate top-level const/let bindings, so re-declaring `const p`
// across separate run() calls throws a SyntaxError on the second declaration.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

function makeFakeIDB() {
    const stores = new Map();
    return {
        open(name) {
            const req = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null };
            setTimeout(() => {
                if (!stores.has(name)) stores.set(name, new Map());
                const db = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }), oncomplete: null }; } };
                req.result = db;
                if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
        }
    };
}

function buildSandbox() {
    const sandbox = {
        console, setTimeout, clearTimeout, Math, Date, JSON,
        indexedDB: makeFakeIDB(),
        localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
        document: { addEventListener() { } },
        window: { addEventListener() { } },
        UI: { money: n => Math.round(n || 0).toLocaleString('en-US') },
    };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    return sandbox;
}

let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

const sb = buildSandbox();
const run = code => vm.runInContext('{' + code + '}', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);   // for expressions that need a return value

run(`Clubs.init();`);

// ---- 1. Core formula sanity ----
check('moraleBand(70) = GOOD', runv(`return moraleBand(70)`) === 'GOOD');
check('moraleBand(60) = GOOD (boundary)', runv(`return moraleBand(60)`) === 'GOOD');
check('moraleBand(59) = MID', runv(`return moraleBand(59)`) === 'MID');
check('moraleBand(35) = MID (boundary)', runv(`return moraleBand(35)`) === 'MID');
check('moraleBand(34) = BAD', runv(`return moraleBand(34)`) === 'BAD');
check('moraleRatingMod(55) = 0', Math.abs(runv(`return moraleRatingMod(55)`)) < 1e-9);
check('moraleRatingMod(85) = +0.10', Math.abs(runv(`return moraleRatingMod(85)`) - 0.10) < 1e-9);
check('moraleRatingMod(99) still capped at +0.10 (clamped, not extrapolated)', Math.abs(runv(`return moraleRatingMod(99)`) - 0.10) < 1e-9);
check('moraleRatingMod(25) = -0.30', Math.abs(runv(`return moraleRatingMod(25)`) - (-0.30)) < 1e-9);
check('moraleRatingMod(0) still capped at -0.30', Math.abs(runv(`return moraleRatingMod(0)`) - (-0.30)) < 1e-9);
check('moraleRatingMod(70) between 0 and +0.20 (upper segment)', runv(`return moraleRatingMod(70)`) > 0 && runv(`return moraleRatingMod(70)`) < 0.20);
check('moraleDevMult GOOD=1.15', runv(`return moraleDevMult(70)`) === 1.15);
check('moraleDevMult MID=1.0', runv(`return moraleDevMult(50)`) === 1.0);
check('moraleDevMult BAD=0.8', runv(`return moraleDevMult(20)`) === 0.8);

// ---- 2. Set up a fresh client for weekly-mechanics tests ----
run(`
    GameState.startNewGame('Netherlands', 'Test Agency');
    const club = Clubs.allClubs.find(c => c.reputation > 60) || Clubs.allClubs[0];
    const p = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
    GameState.players.push(p);
    window.__pid = p.id;
`);
const pid = runv(`return window.__pid`);

// ---- 3. Anti-spiral clamp: a huge target gap should still only move <=5/week ----
run(`const p = GameState.getPlayer(window.__pid); p.morale.club = 10; p.morale.wage = 10;`);
run(`Sim._morale([]);`);
const clubAfterOneWeek = runv(`return GameState.getPlayer(window.__pid).morale.club`);
check('club morale moved by at most 5 in one week (anti-spiral clamp), got ' + clubAfterOneWeek, Math.abs(clubAfterOneWeek - 10) <= 5.001);

// ---- 4. Playing-time streaks ----
run(`const p = GameState.getPlayer(window.__pid); p.morale.time = 50; p._playStreak = 0; p._benchStreak = 0; p._weekApps = 1; GameState.week = 20;`);
run(`Sim._morale([]);`);
const t1 = runv(`return GameState.getPlayer(window.__pid).morale.time`);
check('played 1 game -> time +1 (base tier), got ' + t1, Math.abs(t1 - 51) < 1e-6);
for (let i = 0; i < 3; i++) run(`const p = GameState.getPlayer(window.__pid); p._weekApps = 1; Sim._morale([]);`);
const streak = runv(`return GameState.getPlayer(window.__pid)._playStreak`);
check('play streak accumulated to 4 after 4 played weeks total, got ' + streak, streak === 4);
const t2 = runv(`return GameState.getPlayer(window.__pid).morale.time`);
check('time morale rose across the streak (mid tier kicked in by week 3-5), ' + t1 + ' -> ' + t2, t2 > t1);

// bench streak
run(`const p = GameState.getPlayer(window.__pid); p.morale.time = 50; p._playStreak = 0; p._benchStreak = 0;`);
run(`const p = GameState.getPlayer(window.__pid); p._weekApps = 0; Sim._morale([]);`);
const b1 = runv(`return GameState.getPlayer(window.__pid).morale.time`);
check('benched 1 week -> time -1 (base tier, halved decay), got ' + b1, Math.abs(b1 - 49) < 1e-6);

// off-season exemption
run(`GameState.week = 49; const p = GameState.getPlayer(window.__pid); p.morale.time = 50; p._benchStreak = 5; p._weekApps = 0;`);
run(`Sim._morale([]);`);
const bOff = runv(`return GameState.getPlayer(window.__pid).morale.time`);
check('week 49 (off-season): no bench penalty applied, got ' + bOff, Math.abs(bOff - 50) < 1e-6);
run(`GameState.week = 20;`);

console.log(failed ? '\n*** SOME CHECKS FAILED (part 1) ***' : '\nPart 1 (formulas + streaks) all passed.');
process.exitCode = failed ? 1 : 0;
