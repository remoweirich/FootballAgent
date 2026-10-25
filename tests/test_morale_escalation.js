// Part 2: agent neglect decay, the full case escalation ladder (open -> stage1 -> stage2 ->
// stage3), promise kept/broken, gifts (cost/diminishing/cooldown/stage-3 refusal), and the
// trophy/promotion/hot-form positive events.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'injuries-data.js', 'simulation.js'];

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
    // pick a club whose reputation is close to the player's ability so clubTarget
    // (50 + (rep-ability)*1.5, clamped 20-95) stays well under BAND_GOOD=60 and drift
    // can't accidentally resolve the case out from under the escalation-ladder test
    const club = Clubs.allClubs.find(c => Math.abs(c.reputation - 60) <= 3) || Clubs.allClubs[0];
    const p = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
    GameState.players.push(p);
    window.__pid = p.id;
`);

// ================= Agent neglect decay =================
run(`GameState.week = 1; GameState.seasonStartYear = 2025; const p = GameState.getPlayer(window.__pid); p.morale.agent = 90; p._lastAgentActionAbs = GameState.absWeek(); p._spillPauseUntilAbs = 1e9;`);   // neglect alone (no complaint spillover)
// weeks 1..26 since the action are still inside the grace period (sinceAction<=26 -> no decay)
for (let i = 0; i < 26; i++) run(`GameState.week += 1; Sim._morale([]);`);
let a26 = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
check('agent morale UNCHANGED through the 26-week grace period, got ' + a26, Math.abs(a26 - 90) < 0.01);
run(`GameState.week += 1; Sim._morale([]);`);
let a27 = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
check('agent morale starts decaying right after the grace period, got ' + a27, a27 < a26);

// ================= Case escalation ladder =================
run(`
    const p = GameState.getPlayer(window.__pid);
    p.moraleCase = null; p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 };
    p.morale = { club: 10, time: 70, wage: 70, agent: 70 }; p._spillPauseUntilAbs = null;
`);
for (let i = 0; i < 4; i++) run(`Sim._morale([]);`);
let caseAfter4 = runv(`return JSON.stringify(GameState.getPlayer(window.__pid).moraleCase)`);
check('case opens after 4 consecutive BAD weeks on club dim, got ' + caseAfter4, JSON.parse(caseAfter4) && JSON.parse(caseAfter4).dim === 'club' && JSON.parse(caseAfter4).stage === 1);

// stage 1 -> stage 2 after 6 more weeks unresolved (no promise made)
for (let i = 0; i < 6; i++) run(`GameState.week += 1; Sim._morale([]); Sim._moraleCases([]);`);
let stage2 = runv(`return GameState.getPlayer(window.__pid).moraleCase.stage`);
check('escalates to stage 2 after 6 unresolved weeks, got stage ' + stage2, stage2 === 2);

// stage 2 -> stage 3: needs 6+ unresolved weeks AND a transfer window to have passed since the
// stage-2 escalation (club/time cases wait for the market to open+close before going further).
// Stage 2 fired at week ~34; the next window closes at next-season week 6 (abs week 58 with the
// non-wrapping counter this test uses), so run 24 weeks and confirm it does NOT fire early.
for (let i = 0; i < 6; i++) run(`GameState.week += 1; Sim._morale([]); Sim._moraleCases([]);`);
const stageMid = runv(`return GameState.getPlayer(window.__pid).moraleCase.stage`);
check('does NOT escalate to stage 3 while no transfer window has passed (still stage ' + stageMid + ')', stageMid === 2);
for (let i = 0; i < 18; i++) run(`GameState.week += 1; Sim._morale([]); Sim._moraleCases([]);`);
let stage3 = runv(`return GameState.getPlayer(window.__pid).moraleCase.stage`);
const forcedMove = runv(`return !!GameState.getPlayer(window.__pid).moraleCase.forcedMove`);
check('escalates to stage 3 once the next window has passed, got stage ' + stage3, stage3 === 3);
check('stage 3 club case sets forcedMove flag', forcedMove === true);

// resolving the dimension back to GOOD closes the case at any stage
run(`const p = GameState.getPlayer(window.__pid); p.morale.club = 65;`);
run(`Sim._moraleCases([]);`);
let closed = runv(`return GameState.getPlayer(window.__pid).moraleCase`);
check('resolving the dim to GOOD closes the case (moraleCase=null)', closed === null);

// ================= Spillover: an open complaint costs You morale =================
const spill = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__pid), aw = GameState.absWeek();
    const one = (dim, stage) => { p.moraleCase = { dim, stage, sinceAbsWeek: aw, promise: null }; p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 };
        p.morale = { club: 70, time: 70, wage: 70, agent: 70 }; p.morale[dim] = 5; p._lastAgentActionAbs = GameState.absWeek(); p.injury = null;
        Sim._morale([]); return +(70 - p.morale.agent).toFixed(3); };
    p._spillPauseUntilAbs = null;
    const wage2 = one('wage', 2), time3 = one('time', 3), club1 = one('club', 1);
    p._spillPauseUntilAbs = aw + MORALE.SPILL_LISTEN_PAUSE_WEEKS;   // what "Listen" sets (js/dialogue.js; checked in test_batch_2026_10_25)
    const paused = one('wage', 2);
    p._spillPauseUntilAbs = null; p.pendingTransfer = { clubId: 'x' }; const pending = one('wage', 3); p.pendingTransfer = null;
    p.moraleCase = { dim: 'wage', stage: 2, sinceAbsWeek: aw, promise: null }; p.morale.wage = 50; p.morale.agent = 70; Sim._morale([]); const okBar = +(70 - p.morale.agent).toFixed(3);
    p.moraleCase = null;
    return JSON.stringify({ wage2, time3, club1, paused, pending, okBar });
`));
check('spillover per week: wage stage 2 = 1, time stage 3 = 1.05, club stage 1 = 0.25, got ' + JSON.stringify(spill), spill.wage2 === 1 && spill.time3 === 1.05 && spill.club1 === 0.25);
check('"Listen" pauses the spillover', spill.paused === 0);
check('no spillover over club/wage while a move is agreed, nor once the bar is out of BAD', spill.pending === 0 && spill.okBar === 0);

// ================= A wage complaint turned transfer request keeps its grievance =================
const wc = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__pid), aw = GameState.absWeek();
    p.pendingTransfer = null; p._spillPauseUntilAbs = null; p._lastAgentActionAbs = aw;
    p.moraleCase = { dim: 'wage', stage: 2, sinceAbsWeek: aw, promise: null };
    Sim._escalateMoraleCase(p, []);
    const conv = { dim: p.moraleCase.dim, stage: p.moraleCase.stage, from: p.moraleCase.from };
    p.morale = { club: 75, time: 70, wage: 5, agent: 70 }; Sim._morale([]); const spill = +(70 - p.morale.agent).toFixed(3);
    p.morale = { club: 75, time: 70, wage: 10, agent: 70 }; Sim._moraleCases([]); const openWhileUnderpaid = !!p.moraleCase;
    p.morale.wage = 40; Sim._moraleCases([]); const closedOnceFixed = !p.moraleCase;
    return JSON.stringify({ conv, spill, openWhileUnderpaid, closedOnceFixed });
`));
check('a stage-3 wage complaint becomes a stage-2 transfer request that remembers it was about wages, got ' + JSON.stringify(wc.conv), wc.conv.dim === 'club' && wc.conv.stage === 2 && wc.conv.from === 'wage');
check('...it keeps spilling over the wage bar even when his club morale is fine (1/week at stage 2), got ' + wc.spill, wc.spill === 1);
check('...and does not close as "resolved" while he is still badly underpaid, only once his wage morale is out of BAD', wc.openWhileUnderpaid && wc.closedOnceFixed);

// ================= The saving grace: a full transfer window before anything drastic =================
const fw = JSON.parse(runv(`
    const Y = GameState.seasonStartYear, A = w => Y * 52 + w;
    return JSON.stringify({
        midSeason: fullWindowSince(A(10), A(33), true), beforeEnd: fullWindowSince(A(10), A(32), true), strict: fullWindowSince(A(10), A(33), false),
        after: fullWindowSince(A(10), A(34), false), late: fullWindowSince(A(3), A(6), true), nextSummer: fullWindowSince(A(3), (Y + 1) * 52 + 6, true) });
`));
check('full window: from week 10 the winter window counts once its last week (33) is reached, got ' + JSON.stringify(fw), fw.midSeason && !fw.beforeEnd && !fw.strict && fw.after);
check('...a window already running at the breaking point does not count; the next one does', !fw.late && fw.nextSummer);

const wo = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__pid), Y = GameState.seasonStartYear;
    p.agentId = 'me'; p.repExpired = true; p.pendingTransfer = null;
    GameState.week = 10; const aw = GameState.absWeek();
    p.moraleCase = { dim: 'agent', stage: 3, sinceAbsWeek: aw, stage3Abs: aw, leaveAtAbsWeek: aw, promise: null };
    const at = w => { GameState.week = w; p.morale.agent = 10; Sim._moraleCases([]); return p.agentId === 'me'; };
    const r = { w20: at(20), w30: at(30), w33: at(33), w34: !at(34) };
    p.agentId = 'me'; p.everClient = true; p.repExpired = false; p.moraleCase = null; p.morale = { club: 70, time: 70, wage: 70, agent: 70 };
    return JSON.stringify(r);
`));
check('a client at breaking point with no contract still waits out a whole transfer window before walking out (stays at weeks 20/30/33, gone at 34), got ' + JSON.stringify(wo), wo.w20 && wo.w30 && wo.w33 && wo.w34);

const fm = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__pid), home = p.clubId;
    p.onLoanAt = null; p.pendingTransfer = null;
    GameState.week = 3; const aw = GameState.absWeek();
    p.moraleCase = { dim: 'club', stage: 3, sinceAbsWeek: aw, stage3Abs: aw, forcedMove: true, promise: null };
    const at = w => { GameState.week = w; Sim._forcedMoves([]); return p.clubId === home; };
    const r = { w4: at(4), w6: at(6), w28: at(28), w32: at(32) };
    p.moraleCase = null;
    return JSON.stringify(r);
`));
check('a forced move waits for the last week of a full window (not in the window he broke in, nor early in the next), got ' + JSON.stringify(fm), fm.w4 && fm.w6 && fm.w28 && fm.w32);

// ================= Promise kept/broken =================
run(`
    const p = GameState.getPlayer(window.__pid);
    p.moraleCase = null; p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 };
    p.morale = { club: 70, time: 70, wage: 10, agent: 70 };
`);
for (let i = 0; i < 4; i++) run(`Sim._morale([]);`);
const wageDim = runv(`return GameState.getPlayer(window.__pid).moraleCase.dim`);
check('wage-dim case opened for the promise test, got ' + wageDim, wageDim === 'wage');
run(`const r = Agency.makePromise(GameState.getPlayer(window.__pid), 'newContract'); window.__promiseR = r;`);
const promiseOk = runv(`return window.__promiseR.ok`);
check('makePromise accepted for a wage-dim case with newContract', promiseOk === true);
// KEPT: simulate a renewal completing for this player
run(`
    const p = GameState.getPlayer(window.__pid);
    const club = Clubs.getClubById(p.clubId);
    const mail = { offer: { playerId: p.id, clubId: club.id, proposedWage: p.wage + 50, proposedTermSeasons: 2 } };
    window.__renewResult = Agency.acceptRenewal(mail, p.wage + 50, null, 2);
`);
const renewResult = runv(`return JSON.stringify(window.__renewResult)`);
const afterKept = runv(`return GameState.getPlayer(window.__pid).moraleCase`);
const wageAfterKept = runv(`return GameState.getPlayer(window.__pid).morale.wage`);
check('renewal accepted (no role requested), got ' + renewResult, JSON.parse(renewResult).ok === true);
check('kept promise closes the case, got ' + JSON.stringify(afterKept), afterKept === null);
check('kept promise bumped wage morale up (PROMISE_KEPT_DIM), got ' + wageAfterKept, wageAfterKept > 10);

// BROKEN: open a new case, make a promise, let the deadline pass without fulfilling it
run(`
    const p = GameState.getPlayer(window.__pid);
    p.moraleCase = null; p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 };
    p.morale = { club: 70, time: 70, wage: 10, agent: 70 };
`);
for (let i = 0; i < 4; i++) run(`Sim._morale([]);`);
run(`const p = GameState.getPlayer(window.__pid); Agency.makePromise(p, 'newContract'); p.moraleCase.promise.deadlineAbsWeek = GameState.absWeek() + 1;`);
const agentBefore = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
run(`GameState.week += 2; Sim._moraleCases([]);`);
const agentAfterBroken = runv(`return GameState.getPlayer(window.__pid).morale.agent`);
const stageAfterBroken = runv(`return GameState.getPlayer(window.__pid).moraleCase.stage`);
check('broken promise dings agent morale, ' + agentBefore + ' -> ' + agentAfterBroken, agentAfterBroken < agentBefore);
check('broken promise escalates the case to stage 2', stageAfterBroken === 2);

console.log(failed ? '\n*** SOME CHECKS FAILED (part 2) ***' : '\nPart 2 (escalation ladder + promises) all passed.');
process.exitCode = failed ? 1 : 0;
