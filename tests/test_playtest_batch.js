// Playtest-feedback batch: the shootout reconstruction (item 5), the attend travel-clash rule
// (item 6), Bosman free transfers (item 8), and distance-priced client visits (item 10).
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const sb = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {} }), head: { appendChild() {} } },
    window: { addEventListener() {} },
    Router: { register() {}, go() {} },
};
sb.UI = { money: n => String(Math.round(n || 0)), euro: n => '€' + n, esc: s => String(s), flag: () => '', clubName: id => { const c = sb.Clubs && sb.Clubs.getClubById(id); return c ? c.name : String(id); } };
vm.createContext(sb);
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js', 'dialogue-data.js', 'dialogue.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const LiveView = vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-livesim.js'), 'utf8') + ';LiveView', sb, { filename: 'screen-livesim.js' });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { const v = typeof c === 'function' ? c() : c; console.log((v ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!v) failed = true; };

// ---- item 5: the shootout reconstruction ends on the banked tallies, with the right winner --------
const shootoutOK = (h, a) => {
    const kicks = LiveView._shootout(h, a);
    const gh = kicks.filter(k => k.side === 'home' && k.scored).length;
    const ga = kicks.filter(k => k.side === 'away' && k.scored).length;
    const winnerRight = (h > a) === (gh > ga);
    return gh === h && ga === a && winnerRight && gh !== ga;
};
const scores = [[5, 3], [5, 4], [4, 3], [3, 2], [2, 1], [3, 0], [2, 0], [4, 1], [4, 2], [3, 1], [6, 5], [7, 6], [8, 7]];
let allScores = true, worst = '';
for (const [hi, lo] of scores) { if (!shootoutOK(hi, lo)) { allScores = false; worst = `${hi}-${lo}`; } if (!shootoutOK(lo, hi)) { allScores = false; worst = `${lo}-${hi}`; } }
check('shootout: every banked scoreline is reproduced exactly (home + away wins)', allScores, worst ? 'broke at ' + worst : `${scores.length * 2} scorelines`);
check('shootout: kicks alternate, home first', () => { const k = LiveView._shootout(5, 4); return k[0].side === 'home' && k[1].side === 'away'; });

// ---- item 6: the attend travel-clash rule -----------------------------------------------------
run(`Attend._matchCountry = m => m._country;`);   // stub country so we can build bare finals
const clash = (a, b) => vm.runInContext(`Attend._clashes(${JSON.stringify(a)}, ${JSON.stringify(b)})`, sb);
const F = (day, time, country) => ({ day, time, _country: country });
check('clash: same country, 90 min apart → clash', () => clash(F('Saturday', '14:30', 'Spain'), F('Saturday', '16:00', 'Spain')) === true);
check('clash: same country, exactly 3h apart → clash (need MORE than 3h)', () => clash(F('Saturday', '14:30', 'Spain'), F('Saturday', '17:30', 'Spain')) === true);
check('clash: same country, 3h30 apart → fine', () => clash(F('Saturday', '14:30', 'Spain'), F('Saturday', '18:00', 'Spain')) === false);
check('clash: same country, 4h apart → fine', () => clash(F('Saturday', '14:30', 'Spain'), F('Saturday', '18:30', 'Spain')) === false);
check('clash: different countries, same day → clash however far apart', () => clash(F('Sunday', '14:30', 'Spain'), F('Sunday', '20:45', 'England')) === true);
check('clash: different countries, different days → fine', () => clash(F('Saturday', '20:45', 'Spain'), F('Sunday', '14:30', 'England')) === false);

// ---- item 8: Bosman — a final-season deal goes free once the winter window shuts ---------------
run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Bosman FC');`);
const feeAt = (week, untilOffset) => vm.runInContext(`(function(){
    const p = Agency.clients()[0] || GameState.players.find(x => x.clubId);
    p.agentId = 'me'; p.everClient = true; p.freeAgent = false;
    p.contractUntilSeason = GameState.seasonStartYear + ${untilOffset};
    GameState.week = ${week};
    const club = Clubs.allClubs.find(c => c.id !== p.clubId && c.reputation > 40);
    return { free: Agency.isPreContractFree(p), fee: Agency.estimateFee(p, club) };
})()`, sb);
check('bosman: final-season deal, after winter window (wk 48) → free', () => { const r = feeAt(48, 0); return r.free === true && r.fee === 0; });
check('bosman: final-season deal, during winter window (wk 30) → still a fee', () => { const r = feeAt(30, 0); return r.free === false && r.fee > 0; });
check('bosman: multi-year deal, late season (wk 48) → still a fee', () => { const r = feeAt(48, 2); return r.free === false && r.fee > 0; });

// ---- item 10: visiting a client is priced by distance -----------------------------------------
const visitCostAt = country => vm.runInContext(`(function(){
    const club = Clubs.allClubs.find(c => c.country === ${JSON.stringify(country)});
    if (!club) return -1;
    const p = GameState.players.find(x => x.clubId) || {};
    p.clubId = club.id; p.onLoanAt = null;
    return Dialogue.visitCost(p);
})()`, sb);
run(`GameState.homeCountry = 'Netherlands'; GameState.agency.homeCountry = 'Netherlands';`);
check('visit: own country (Netherlands) → €200', () => visitCostAt('Netherlands') === 200);
check('visit: neighbouring country (Germany) → €1,000', () => visitCostAt('Germany') === 1000);
check('visit: far country (Spain) → €2,000', () => visitCostAt('Spain') === 2000);

// ---- item 2: a clear starter client is never rested in a big match ----------------------------
run(`Clubs.init(); GameState.startNewGame('Netherlands', 'XI FC');`);
const item2 = vm.runInContext(`(function(){
    // a standout client (top weight so he always makes the XI) at a modest club
    const club = Clubs.allClubs.filter(c => c.reputation <= 32).sort((a,b)=>a.reputation-b.reputation)[0] || Clubs.allClubs[0];
    const p = GameState.players.find(x => x.clubId && !x.injury);
    p.agentId='me'; p.everClient=true; p.knownToAgent=true; p.squadRole='key'; p.ability=99; p.onLoanAt=null; p.injury=null; p._recent=[]; p.clubId = club.id;
    let big=0, normal=0; const N=50;
    for (let i=0;i<N;i++){ p._suspended=0; const ap = League.assignStats(club.id,'EED',2,1,true)||[]; if (ap.some(a=>a.p===p)) big++; }
    for (let i=0;i<N;i++){ p._suspended=0; const ap = League.assignStats(club.id,'EED',2,1,false)||[]; if (ap.some(a=>a.p===p)) normal++; }
    return { big, normal, N, rep: club.reputation };
})()`, sb);
check('lineup: a standout client plays EVERY big match (never rested)', () => item2.big === item2.N, `big ${item2.big}/${item2.N}, normal ${item2.normal}/${item2.N} (rep ${item2.rep})`);

console.log(failed ? '\n*** FAIL ***' : '\nAll playtest-batch checks passed.');
process.exit(failed ? 1 : 0);
