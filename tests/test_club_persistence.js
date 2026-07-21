// Verifies the club-division/reputation persistence fix. Each "session" is a fully separate
// vm sandbox (fresh Clubs.init(), fresh everything) sharing one host-side `sharedDisk` object
// standing in for IndexedDB - saving in one sandbox and loading in a brand new one is a
// faithful model of a real app force-close + relaunch (nothing but the serialized blob
// survives), which is exactly the scenario the bug was about.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

let sharedDisk = null;

function makeFakeIDB() {
    return { open(name) { const req = { result: null, onupgradeneeded: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } };
}
function buildSandbox() {
    const errors = [];
    const sandbox = {
        console: { log: () => { }, warn: () => { }, error: (...a) => errors.push(a.map(String).join(' ')) },
        setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(),
        localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
        document: { addEventListener() { } }, window: { addEventListener() { } },
        UI: { money: n => Math.round(n || 0).toLocaleString('en-US') }
    };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    // patch Storage to hit the shared host-side "disk" instead of the sandbox's own fake
    // indexedDB - see file header. Storage is `const`-declared (lexical, not a sandbox
    // property), so it must be patched via runInContext, not from the host directly.
    sandbox.__diskGet = () => sharedDisk;
    sandbox.__diskSet = (d) => { sharedDisk = d; };
    vm.runInContext(`{ Storage.loadGame = async () => __diskGet(); Storage.saveGame = (d) => __diskSet(d); Storage.flush = async () => {}; Storage.hasSave = async () => __diskGet() != null; }`, sandbox);
    sandbox.__errors = errors;
    return sandbox;
}
const run = (sb, code) => vm.runInContext('{' + code + '}', sb);
const runv = (sb, code) => vm.runInContext('(function(){' + code + '})()', sb);
// IMPORTANT: this returns a real Promise from the sandbox's async IIFE - every call MUST be
// awaited by the caller, or the host races ahead of GameState.load()'s internal `await
// Storage.loadGame()` and reads/mutates state before the load has actually finished.
const runa = (sb, code) => vm.runInContext('(async function(){' + code + '})()', sb);

let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

function dumpClubs(sb) {
    return JSON.parse(runv(sb, `return JSON.stringify(Clubs.allClubs.map(c => ({ id: c.id, division: c.division, tier: c.tier, reputation: c.reputation })))`));
}
function advanceToRollover(sb, maxWeeks) {
    for (let i = 0; i < maxWeeks; i++) {
        const r = JSON.parse(runv(sb, `return JSON.stringify(Sim.advanceWeek())`));
        if (r.rolledSeason) return true;
    }
    return false;
}
function devWarningMails(sb) {
    return JSON.parse(runv(sb, `return JSON.stringify(GameState.inbox.filter(m => m.subject && m.subject.includes('DEV WARNING')).map(m => m.subject))`));
}
// keyed diff, not positional - the honest way to compare two dumps of "the same" club set
function diffClubs(before, after) {
    const afterById = Object.fromEntries(after.map(c => [c.id, c]));
    return before.filter(c => JSON.stringify(c) !== JSON.stringify(afterById[c.id])).map(c => ({ before: c, after: afterById[c.id] }));
}

async function main() {

console.log('=== Scenario 1: new game -> rollover -> restart -> divisions survive ===');
{
    const A = buildSandbox();
    run(A, `Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency');`);
    const rolled = advanceToRollover(A, 55);
    check('reached a rollover within 55 weeks', rolled);
    const beforeRestart = dumpClubs(A);
    check('errors during session 1: none, got ' + JSON.stringify(A.__errors), A.__errors.length === 0);

    // --- simulate a force-close + relaunch: a totally fresh sandbox, loading only the disk ---
    const B = buildSandbox();
    run(B, `Clubs.init();`);
    await runa(B, `await GameState.load();`);
    const afterRestart = dumpClubs(B);
    check('club count unchanged across restart, ' + beforeRestart.length + ' -> ' + afterRestart.length, beforeRestart.length === afterRestart.length);
    const diffs = diffClubs(beforeRestart, afterRestart);
    check('every club\'s division+reputation survived the restart exactly, ' + diffs.length + ' mismatch(es)' + (diffs.length ? ': ' + JSON.stringify(diffs.slice(0, 5)) : ''), diffs.length === 0);
}

console.log('\n=== Scenario 2: mid-season save -> restart -> continue to rollover -> correct sizes ===');
{
    const A = buildSandbox();
    // advance naturally from week 1 rather than jumping GameState.week directly - several
    // cup competitions (e.g. the DFB Pokal) key their pairing rounds off specific week
    // numbers and set up internal state along the way, which a direct week-jump skips
    run(A, `Clubs.init(); GameState.startNewGame('England', 'Test Agency');`);
    for (let i = 0; i < 19; i++) run(A, `Sim.advanceWeek();`);   // mid-season, NOT at a rollover boundary
    const midSeasonDump = dumpClubs(A);

    const B = buildSandbox();
    run(B, `Clubs.init();`);
    await runa(B, `await GameState.load();`);
    const afterRestartMidSeason = dumpClubs(B);
    const diffs2 = diffClubs(midSeasonDump, afterRestartMidSeason);
    check('mid-season restart: every club (incl. those untouched by any pro/rel) keeps its exact division+reputation, ' + diffs2.length + ' mismatch(es)' + (diffs2.length ? ': ' + JSON.stringify(diffs2.slice(0, 5)) : ''), diffs2.length === 0);

    const rolled2 = advanceToRollover(B, 55);
    check('reached a rollover after restarting mid-season', rolled2);
    const englandDivs = ['PREM', 'CHAMP', 'LEAGUE1', 'LEAGUE2', 'Natleague'];
    const staticSizes = JSON.parse(runv(B, `return JSON.stringify(${JSON.stringify(englandDivs)}.map(d => ({ div: d, expected: Clubs.staticDivSize(d), actual: Clubs.getClubsByDivision(d).length })))`));
    staticSizes.forEach(s => check(`England ${s.div} is the correct static size after restart+rollover: expected ${s.expected}, got ${s.actual}`, s.expected === s.actual));
    check('no STEP 4 console.error fired, got ' + JSON.stringify(B.__errors), B.__errors.length === 0);
    check('no DEV WARNING mail in the inbox, got ' + JSON.stringify(devWarningMails(B)), devWarningMails(B).length === 0);
}

console.log('\n=== Scenario 3: load a pre-fix save (no clubState) -> STEP 3 repairs it ===');
{
    // realistic corruption: play through an ACTUAL rollover so real promotion/relegation moves
    // real clubs and setupSeason() rebuilds tables+schedule together, consistently, for the new
    // season (a hand-edited single-club table hack would desync tables vs schedule, which
    // can't happen from a real save/restore - only Clubs.allClubs' divisions were ever wrong).
    const A = buildSandbox();
    run(A, `Clubs.init(); GameState.startNewGame('Netherlands', 'Test Agency');`);
    const rolled0 = advanceToRollover(A, 55);
    check('test setup: reached a real rollover to produce genuine promotion/relegation', rolled0);
    const postRolloverDump = dumpClubs(A);
    run(A, `GameState.save();`);
    // simulate a pre-fix save: strip clubState entirely, as an old build's save() would never have written it
    run(A, `delete __diskGet().clubState;`);
    check('test setup: the stripped save genuinely has no clubState field', runv(A, `return __diskGet().clubState === undefined`));

    const C = buildSandbox();
    run(C, `Clubs.init();`);   // fresh boot: every club resets to its static day-one division
    const freshInitDump = dumpClubs(C);
    const corruptedByFreshInit = diffClubs(postRolloverDump, freshInitDump).filter(d => d.before.division !== d.after.division);
    check('test setup: fresh Clubs.init() really does diverge from the post-rollover layout (this IS the bug, pre-repair) - ' + corruptedByFreshInit.length + ' club(s) reset', corruptedByFreshInit.length > 0);

    await runa(C, `await GameState.load();`);
    const repairedDump = dumpClubs(C);
    const stillWrong = diffClubs(postRolloverDump, repairedDump).filter(d => d.before.division !== (d.after || {}).division);
    check('STEP 3 repair reconstructs every moved club\'s division from league.tables, ' + stillWrong.length + ' still wrong' + (stillWrong.length ? ': ' + JSON.stringify(stillWrong.slice(0, 5)) : ''), stillWrong.length === 0);
    const repairedDiskHasClubState = runv(C, `return __diskGet().clubState != null`);
    check('the repair persists clubState so it never needs to run again', repairedDiskHasClubState);

    const rolled3 = advanceToRollover(C, 55);
    check('reached another rollover after loading the repaired save', rolled3);
    const nlDivs = ['ERE', 'EED', 'TWD', 'DRD'];
    const staticSizes3 = JSON.parse(runv(C, `return JSON.stringify(${JSON.stringify(nlDivs)}.map(d => ({ div: d, expected: Clubs.staticDivSize(d), actual: Clubs.getClubsByDivision(d).length })))`));
    staticSizes3.forEach(s => check(`Netherlands ${s.div} is the correct static size after repair+rollover: expected ${s.expected}, got ${s.actual}`, s.expected === s.actual));
    check('no STEP 4 console.error fired after the repaired save rolls over, got ' + JSON.stringify(C.__errors), C.__errors.length === 0);
    check('no DEV WARNING mail after the repaired save rolls over, got ' + JSON.stringify(devWarningMails(C)), devWarningMails(C).length === 0);
}

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll club-persistence checks passed.');
process.exitCode = failed ? 1 : 0;

}
main();
