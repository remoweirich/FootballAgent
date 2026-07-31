// Batch tests: wage-counter ratchet, deferred transfers, cup tie orientation + neutral finals,
// break-week/injury playing-time freezes.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];
function makeFakeIDB() { return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } }; }
const sb = { console: { log: () => { }, warn: () => { }, error: () => { } }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => String(n) } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
vm.runInContext('{ Storage.saveGame = () => {}; Storage.flush = async () => {}; }', sb);
const run = code => vm.runInContext('{' + code + '}', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Updates3');`);

// ================= 1. wage-counter ratchet =================
const ratchet = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = PlayerGen.makePlayer(club, { ability: 70, age: 25, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id; p.wage = 1000;
    GameState.players.push(p);
    // round 1: ask way too much -> counter C
    const r1 = Agency.negotiateWage(p, club, 999999, 1, null);
    // round 2: ask exactly their counter, passing it as lastCounter -> must accept
    const r2 = Agency.negotiateWage(p, club, r1.counter, 2, r1.counter);
    // and a fresh counter can never undercut the previous one
    const r3 = Agency.negotiateWage(p, club, 999999, 5, r1.counter);
    return JSON.stringify({ s1: r1.status, c1: r1.counter, s2: r2.status, s3: r3.status, c3: r3.counter });
`));
check('round 1 produces a counter: ' + ratchet.s1 + ' @ ' + ratchet.c1, ratchet.s1 === 'counter' && ratchet.c1 > 0);
check('asking exactly their counter is ACCEPTED (no more 650->640->630 spiral)', ratchet.s2 === 'accept');
check('a later counter never undercuts the earlier one: ' + ratchet.c3 + ' >= ' + ratchet.c1, ratchet.s3 === 'reject' || ratchet.c3 >= ratchet.c1);

// ================= 2. deferred transfers =================
// advance NATURALLY to week 38 (window firmly shut) so cup/playoff state stays coherent for
// the later advance across the rollover - jumping GameState.week directly corrupts cup brackets
let atWk38 = false, g0 = 0;
while (!atWk38 && g0++ < 45) { run(`Sim.advanceWeek();`); atWk38 = runv(`return GameState.week === 38;`); }
check('reached week 38 naturally', atWk38);
run(`
    const from = Clubs.getClubById('ajax'), to = Clubs.getClubById('Liverpool');
    const p = PlayerGen.makePlayer(from, { ability: 85, age: 26, position: 'ST' });
    p.agentId = 'me'; p.everClient = true; p.clubId = from.id; p.wage = 5000;
    GameState.players.push(p);
    window.__star = p.id;
    const mail = GameState.addMail({ kind: 'transfer', offer: { playerId: p.id, fromClubId: from.id, toClubId: to.id, transferFee: 30000000 } });
    window.__r = Agency.acceptTransfer(mail, 9000, null, 4, 0);
`);
const def = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__star);
    return JSON.stringify({ ok: window.__r.ok, msg: window.__r.message, clubId: p.clubId, pending: !!p.pendingTransfer, joining: p.joiningClubId, wage: p.wage, credited: p.pendingTransfer && p.pendingTransfer.credited });
`));
check('accept in week 38 succeeds as an AGREEMENT: ' + def.msg.slice(0, 60) + '...', def.ok === true);
check('player stays at his current club (ajax), got ' + def.clubId, def.clubId === 'ajax');
check('pendingTransfer stored, joiningClubId tag set to Liverpool', def.pending && def.joining === 'Liverpool');
check('old wage still in force until the move (5000), got ' + def.wage, def.wage === 5000);
check('agent credit flagged at agreement (no double +25 later)', def.credited === true);

// blocked actions while pending
const blocks = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__star);
    const from = Clubs.getClubById('ajax');
    const m2 = GameState.addMail({ kind: 'transfer', offer: { playerId: p.id, fromClubId: 'ajax', toClubId: 'Arsenal', transferFee: 1000000 } });
    const t2 = Agency.acceptTransfer(m2, 8000, null, 2, 0);
    const lm = GameState.addMail({ kind: 'loan', offer: { playerId: p.id, toClubId: 'psv', role: 'starter' } });
    const lo = Agency.acceptLoanOffer(lm, 'starter', null);
    const rm = GameState.addMail({ kind: 'renewal', offer: { playerId: p.id, clubId: 'ajax', proposedWage: 6000, proposedTermSeasons: 3 } });
    const rn = Agency.acceptRenewal(rm, 6000, null, 3);
    return JSON.stringify({ t2: t2.ok, lo: lo.ok, rn: rn.ok });
`));
check('second transfer / loan / renewal all blocked while a move is agreed', blocks.t2 === false && blocks.lo === false && blocks.rn === false);

// advance to week 52, snapshot agent morale, then the single rollover week completes the move
// (a tight window keeps legitimate season-end bumps like trophies out of the double-credit check)
let at52 = false, guard = 0;
while (!at52 && guard++ < 20) {
    run(`Sim.advanceWeek();`);
    at52 = runv(`return GameState.week === 52;`);
}
run(`GameState.getPlayer(window.__star).morale.agent = 60; window.__agentBefore = 60;`);   // below the 100 cap so a stray +25 would be visible
run(`Sim.advanceWeek();`);
const done = runv(`return GameState.week === 1;`);
const completed = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__star);
    const mail = GameState.inbox.find(m => m.subject && m.subject.includes('completes his move'));
    return JSON.stringify({ week: GameState.week, clubId: p.clubId, wage: p.wage, pending: !!p.pendingTransfer, joining: p.joiningClubId || null, mail: !!mail, agentAfter: p.morale.agent, agentBefore: window.__agentBefore });
`));
check('window opened (week 1): move completed to Liverpool, got ' + completed.clubId, completed.week === 1 && completed.clubId === 'Liverpool');
check('new wage in force after completion (9000), got ' + completed.wage, completed.wage === 9000);
check('pendingTransfer + joining tag cleared', !completed.pending && completed.joining === null);
check('completion mail arrived', completed.mail === true);
check(`no second +25 agent credit at completion (${completed.agentBefore} -> ${completed.agentAfter})`, completed.agentAfter <= completed.agentBefore + 1);

// in-window accepts still complete immediately
const immediate = JSON.parse(runv(`
    const from = Clubs.getClubById('psv'), to = Clubs.getClubById('Chelsea');
    const p = PlayerGen.makePlayer(from, { ability: 82, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = from.id; p.wage = 4000;
    GameState.players.push(p);
    const mail = GameState.addMail({ kind: 'transfer', offer: { playerId: p.id, fromClubId: from.id, toClubId: to.id, transferFee: 20000000 } });
    const r = Agency.acceptTransfer(mail, 8000, null, 4, 0);   // week 1: window open
    return JSON.stringify({ ok: r.ok, clubId: p.clubId, pending: !!p.pendingTransfer });
`));
check('in-window accept still moves him immediately, got ' + immediate.clubId, immediate.ok && immediate.clubId === 'Chelsea' && !immediate.pending);

// ================= 3. cup tie orientation + neutral final =================
run(`
    window.__pmCalls = [];
    const orig = League.playMatch.bind(League);
    window.__origPM = League.playMatch;
    League.playMatch = function (h, a, comp, adv) { window.__pmCalls.push({ h, a, adv: !!adv }); return orig(h, a, comp, adv); };
`);
const cup = JSON.parse(runv(`
    const t1 = League.playCupTie('Bayern Munich', 'Vilzing', 'DFB', false);   // tier 1 vs tier 4
    const t2 = League.playCupTie('Vilzing', 'Bayern Munich', 'DFB', false);   // already right way round
    const t3 = League.playCupTie('Bayern Munich', 'Dortmund', 'DFB', true);   // FINAL: neutral
    return JSON.stringify({ h1: t1.h, a1: t1.a, h2: t2.h, a2: t2.a, h3: t3.h, calls: window.__pmCalls });
`));
run(`League.playMatch = window.__origPM;`);
check('big club drawn away: Bayern@Vilzing regardless of draw order (' + cup.h1 + ' v ' + cup.a1 + ')', cup.h1 === 'Vilzing' && cup.a1 === 'Bayern Munich');
check('already-correct orientation kept (' + cup.h2 + ' v ' + cup.a2 + ')', cup.h2 === 'Vilzing' && cup.a2 === 'Bayern Munich');
check('non-final ties keep home advantage flag', cup.calls[0].adv === true && cup.calls[1].adv === true);
check('final keeps draw order (no re-orient): ' + cup.h3, cup.h3 === 'Bayern Munich');
check('final played WITHOUT home advantage (neutral ground)', cup.calls[2].adv === false);

// ================= 4. break-week + injury playing-time freezes =================
run(`
    GameState.week = 10;   // international break (NO_LEAGUE, now exempt)
    const club = Clubs.getClubById('ajax');
    const p = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
    p.morale.time = 50; p._benchStreak = 3; p._playStreak = 0; p._weekApps = 0;
    GameState.players.push(p);
    window.__bw = p.id;
    Sim._morale([]);
`);
const bw = JSON.parse(runv(`const p = GameState.getPlayer(window.__bw); return JSON.stringify({ time: p.morale.time, bench: p._benchStreak });`));
check('break week, benched: time morale frozen at 50, got ' + bw.time, bw.time === 50);
check('break week, benched: streak preserved (3), got ' + bw.bench, bw.bench === 3);

const bwPlayed = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__bw);
    p._weekApps = 1;                       // e.g. a U21 kid playing through the break
    Sim._morale([]);
    return JSON.stringify({ time: p.morale.time, play: p._playStreak, bench: p._benchStreak });
`));
check('break week, PLAYED: still earns his +1 tick, got ' + bwPlayed.time, bwPlayed.time === 51 && bwPlayed.play === 1 && bwPlayed.bench === 0);

const inj = JSON.parse(runv(`
    const p = GameState.getPlayer(window.__bw);
    GameState.week = 20;                   // normal league week
    p.injury = { type: 'Knock', weeksOut: 3, total: 3 };
    p._playStreak = 0; p._benchStreak = 0; // as the onset reset would leave them
    p.morale.time = 60; p._weekApps = 0;
    Sim._morale([]);
    return JSON.stringify({ time: p.morale.time, bench: p._benchStreak });
`));
check('injured + benched in a normal week: time morale frozen, got ' + inj.time, inj.time === 60 && inj.bench === 0);

// injury onset FREEZES streaks (not reset) — he picks up the run he was on when he returns
const onset = JSON.parse(runv(`
    const club = Clubs.getClubById('psv');
    const p = PlayerGen.makePlayer(club, { ability: 60, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
    p._playStreak = 7; p._benchStreak = 0;
    GameState.players.push(p);
    const realNext = Rng.next;
    Rng.next = () => 0;                    // guarantees the injury roll hits (engine draws via Rng now)
    Sim._injuries([]);
    Rng.next = realNext;
    return JSON.stringify({ injured: !!p.injury, play: p._playStreak, bench: p._benchStreak });
`));
check('injury onset: player injured, streaks FROZEN (not reset)', onset.injured && onset.play === 7 && onset.bench === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll update-batch checks passed.');
process.exitCode = failed ? 1 : 0;
