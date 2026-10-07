// Guards the 1.0.22 performance regression: transfer-window weeks went from ~50ms to ~300ms
// (desktop; well over a second on a phone) because _generateOffers began building its buyer pool
// for every client every week, and each candidate club ran clubHasMyPlayerAtPos — an unindexed
// scan of all ~14k players. The fix indexes "my players by club + position" once per pass.
//
// Timing tests flake, so this guards the STRUCTURE instead: it counts how often the slow,
// unindexed scan runs during a transfer-window week. Before the fix that was thousands of calls;
// a regression that puts a per-club scan back into the weekly path will light this up at once.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const noop = () => {};
const sb = {
    console: { log: noop, warn: noop, error: noop }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    indexedDB: undefined, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: { addEventListener: noop, getElementById: () => null, querySelector: () => null },
    addEventListener: noop, removeEventListener: noop, UI: { money: String, esc: String, euro: String },
};
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'js/i18n.js', 'utf8'), sb, { filename: 'i18n.js' });
vm.runInContext(fs.readFileSync(root + 'js/i18n-en.js', 'utf8'), sb, { filename: 'i18n-en.js' });
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(root + 'js/' + f, 'utf8'), sb, { filename: f });

const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

run(`Clubs.init(); GameState.startNewGame('England','Perf','A'); Rng.seed(9090);
     GameState.agency.balance = 50000000; GameState.agency.reputation = 60;
     var pool = GameState.players.filter(function (p) { return p.clubId && !p.agentId && p.age >= 18 && p.age <= 28; });
     pool.sort(function (a, b) { return b.ability - a.ability; });
     var step = Math.max(1, Math.floor(pool.length / 18));
     for (var i = 0, n = 0; i < pool.length && n < 18; i += step, n++) {
         var p = pool[i]; p.agentId = 'me'; p.everClient = true; p.knownToAgent = true;
         p.wageCommission = 10; p.sponsorCommission = 10;
         p.repUntilSeason = GameState.seasonStartYear + 4; p.repExpired = false;
         if (!p.morale) p.morale = { club: 70, time: 70, wage: 70, agent: 70 };
     }`);

// ---------------- the index answers exactly what the scan answers ----------------
console.log('-- myPosIndex agrees with the unindexed scan --');
// Exhaustive over every club x every position, for each client excluding himself and with no
// exclusion — the two call shapes the game uses. Any disagreement would change which clubs bid.
const agree = JSON.parse(run(`
    var idx = Agency.myPosIndex();
    var POS = ['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST'];
    var excludes = [null].concat(Agency.clients().map(function (p) { return p.id; }));
    var n = 0, bad = 0, hits = 0;
    Clubs.allClubs.forEach(function (c) {
        POS.forEach(function (pos) {
            excludes.forEach(function (ex) {
                var slow = Agency.clubHasMyPlayerAtPos(c.id, pos, ex);
                var fast = Agency.clubHasMyPlayerAtPos(c.id, pos, ex, idx);
                n++; if (slow !== fast) bad++; if (slow) hits++;
            });
        });
    });
    return JSON.stringify({ n: n, bad: bad, hits: hits });
`));
check(`identical on all ${agree.n} club x position x exclusion combinations`, agree.bad === 0);
// a check that agrees only because it always says "no" proves nothing
check(`...including the ${agree.hits} where a client really is there`, agree.hits > 0);

// it must keep the scan's predicate, not clients()'s — archived players are counted by the scan
check('an archived player still blocks his position, as the scan does', run(`
    var p = Agency.clients()[0]; var was = p.archived; p.archived = true;
    var idx = Agency.myPosIndex();
    var slow = Agency.clubHasMyPlayerAtPos(p.clubId, p.position, null);
    var fast = Agency.clubHasMyPlayerAtPos(p.clubId, p.position, null, idx);
    p.archived = was;
    return slow === true && fast === true;
`) === true);

// ---------------- the slow scan stays out of the weekly path ----------------
console.log('\n-- the slow scan stays out of the weekly path --');
run(`__slow = 0; __fast = 0; __orig = Agency.clubHasMyPlayerAtPos;
     Agency.clubHasMyPlayerAtPos = function (c, pos, ex, idx) { if (idx) __fast++; else __slow++; return __orig.apply(this, arguments); };`);
// advance into a transfer window and measure one window week
let guard = 0;
while (!run('return GameState.isTransferWindowOpen(GameState.week);') && guard++ < 60) run('Sim.advanceWeek();');
run('__slow = 0; __fast = 0;');
const t0 = Date.now();
run('Sim.advanceWeek();');
const ms = Date.now() - t0;
const slow = run('return __slow;'), fast = run('return __fast;');
console.log(`      one window week: ${slow} unindexed scans, ${fast} indexed lookups, ${ms}ms`);
check('the offer pass actually ran (indexed lookups happened)', fast > 50);
// before the fix this was thousands per window week — every candidate club, every client
check(`unindexed scans in a window week stay small (${slow})`, slow < 40);

// and across a whole season, so an off-window path cannot reintroduce it either
run('__slow = 0; __fast = 0;');
for (let i = 0; i < 52; i++) run('Sim.advanceWeek();');
const sSeason = run('return __slow;'), fSeason = run('return __fast;');
console.log(`      a full season: ${sSeason} unindexed scans, ${fSeason} indexed lookups`);
check(`unindexed scans across a season stay small (${sSeason})`, sSeason < 400);

run('Agency.clubHasMyPlayerAtPos = __orig;');
console.log(failed ? '\n*** FAIL ***' : '\nAll offer-performance checks passed.');
process.exit(failed ? 1 : 0);
