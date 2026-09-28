// Who shows interest in a client, and how much: the form table, trophies won, and being relegated.
// The authority for these numbers is docs/offers-design.md — if this test and that document
// disagree, one of them is wrong and it is worth stopping to work out which.
//
// The load-bearing property is in section 3: the per-tier weights are not a preference ordering,
// they are RATES. Scaling the roll by the mean weight across the pool and then drawing the buyer in
// proportion to its own weight makes each tier's absolute rate of approaches proportional to that
// tier's weight and nothing else — which is what lets the table be read straight off as
// "step-down 1.15 on a bad season = smaller clubs circle 15% more than normal".
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const sb = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} }, window: { addEventListener() {} },
    UI: { money: n => String(Math.round(n || 0)), euro: n => '€' + n, esc: s => String(s) },
};
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js',
    'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };
run("Clubs.init(); GameState.startNewGame('Netherlands','Test FC','A');");
const A = vm.runInContext('Agency', sb);
const GameState = vm.runInContext('GameState', sb);
const Rng = vm.runInContext('Rng', sb);
const COMPETITIONS = vm.runInContext('COMPETITIONS', sb);
const near = (a, b, eps) => Math.abs(a - b) <= (eps == null ? 1e-9 : eps);

// Form is read through recentSeason(), so stubbing that is enough to drive every band.
const form = (avg, apps) => { A.recentSeason = () => ({ avg, apps: apps == null ? 30 : apps }); };
const bandOf = avg => { form(avg); return A.formBand({}).key; };

// ---- 1. the band boundaries -------------------------------------------------------------------
// The spec is written as 6.01-6.50, 6.51-7.00, ... so a rating sitting exactly ON a boundary
// belongs to the band BELOW it: 8.00 is "7.51-8.00", not "8.01+".
console.log('\n-- band boundaries --');
const BOUNDS = [
    [8.40, 'outstanding'], [8.01, 'outstanding'], [8.00, 'excellent'],
    [7.51, 'excellent'], [7.50, 'good'], [7.01, 'good'], [7.00, 'steady'],
    [6.51, 'steady'], [6.50, 'poor'], [6.01, 'poor'], [6.00, 'bad'], [5.99, 'bad'], [3.00, 'bad'],
];
BOUNDS.forEach(([r, key]) => check(`${r.toFixed(2)} -> ${key}`, bandOf(r) === key));

// ---- 2. no sample is not a bad sample ---------------------------------------------------------
// A youth player, a new signing who has not featured, a season not yet under way: all of these
// read 0 from recentSeason. Before the bands carried a penalty that was harmless; now it would
// quietly cut their value, wage and suitors, so it must resolve to steady.
console.log('\n-- an unplayed client reads steady, never bad --');
form(0, 0); check('0 apps, 0 rating -> steady', A.formBand({}).key === 'steady');
form(4.5, 2); check('a 2-game cameo at 4.50 -> steady (under FORM_MIN_APPS)', A.formBand({}).key === 'steady');
form(4.5, 5); check('5 games at 4.50 -> bad (a real sample)', A.formBand({}).key === 'bad');
form(0, 40); check('40 apps but no rating recorded -> steady', A.formBand({}).key === 'steady');

// ---- 3. fee and wage move with form, both ways ------------------------------------------------
console.log('\n-- form drives fee and wage, downward too --');
const vw = avg => { form(avg); return [A.perfValueMult({}), A.perfWageMult({})]; };
check('8.40 -> fee x1.30, wage x1.60', String(vw(8.40)) === '1.3,1.6');
check('7.80 -> fee x1.18, wage x1.30', String(vw(7.80)) === '1.18,1.3');
check('6.80 -> neutral', String(vw(6.80)) === '1,1');
check('6.30 -> fee x0.92, wage x0.95', String(vw(6.30)) === '0.92,0.95');
check('5.50 -> fee x0.80, wage x0.88 (a bad season COSTS him)', String(vw(5.50)) === '0.8,0.88');
form(5.5);
const badFee = A.playerValue({ ability: 70, age: 26, potential: 70, contractUntilSeason: GameState.seasonStartYear + 3 });
form(6.8);
const okFee = A.playerValue({ ability: 70, age: 26, potential: 70, contractUntilSeason: GameState.seasonStartYear + 3 });
check('a bad season really lowers playerValue', badFee < okFee * 0.85);

// ---- 4. buyer tiers ---------------------------------------------------------------------------
console.log('\n-- which tier a club falls in (FORM_TIER_GAP = ' + A.FORM_TIER_GAP + ') --');
const p70 = { ability: 70 };
const tier = rep => A.buyerTier(p70, { reputation: rep });
check('rep 75 (+5) -> up', tier(75) === 'up');
check('rep 74 (+4) -> level', tier(74) === 'level');
check('rep 70 (same) -> level', tier(70) === 'level');
check('rep 66 (-4) -> level', tier(66) === 'level');
check('rep 65 (-5) -> down', tier(65) === 'down');

// ---- 5. the rate property ---------------------------------------------------------------------
// The claim: approaches from tier t scale with w_t alone. Verified by simulating the whole
// mechanism — mean-weight scaling plus weighted draw — against a steady-season baseline.
console.log('\n-- per-tier approach rates match the table --');
// a synthetic pool spread evenly across the three tiers, so shares are unambiguous
const pool = [];
for (let rep = 58; rep <= 86; rep += 2) pool.push({ id: 'c' + rep, reputation: rep, country: 'Netherlands', division: 'ERE' });
const player = { ability: 70, clubId: null, _lastCountry: 'Netherlands' };
function rateByTier(avg) {
    form(avg);
    const w = A.interestWeights(player);
    const mean = A.meanBuyerWeight(player, pool, w);
    const N = 60000, hits = { up: 0, level: 0, down: 0 };
    for (let i = 0; i < N; i++) {
        const b = A.pickBuyer(pool, player, w);
        if (b) hits[A.buyerTier(player, b)]++;
    }
    // rate = P(a bid happens) x P(it is this tier) , with the common base factored out
    const out = {};
    ['up', 'level', 'down'].forEach(k => out[k] = mean * hits[k] / N);
    return out;
}
Rng.seed(4242);
const baseRate = rateByTier(6.80);
[['outstanding', 8.40], ['excellent', 7.80], ['good', 7.30], ['poor', 6.30], ['bad', 5.50]].forEach(([key, avg]) => {
    const band = A.FORM_BANDS.filter(b => b.key === key)[0];
    const r = rateByTier(avg);
    ['up', 'level', 'down'].forEach(t => {
        const want = band[t] / A.FORM_BANDS.filter(b => b.key === 'steady')[0][t];
        const got = r[t] / baseRate[t];
        check(`  ${key} ${t}: ${got.toFixed(2)}x, table says ${want.toFixed(2)}x`, near(got, want, 0.06 * want + 0.03));
    });
});

// ---- 6. only the best season widens the net ---------------------------------------------------
console.log('\n-- the top band alone lets clubs too good for him look --');
form(8.40); check('outstanding widens by 10', A.interestWeights({ ability: 70 }).widen === 10);
form(7.80); check('excellent does not widen', A.interestWeights({ ability: 70 }).widen === 0);
form(6.80); check('steady does not widen', A.interestWeights({ ability: 70 }).widen === 0);

// ---- 7. trophies ------------------------------------------------------------------------------
console.log('\n-- trophies, last 52 weeks, as a regular --');
form(6.80);
const aw = GameState.absWeek(), yr = GameState.seasonStartYear;
const REGULAR = A.REGULAR_APPS;
let appsStub = REGULAR;
A._seniorLeagueApps = () => appsStub;
const upWith = trophies => A.interestWeights({ ability: 70, trophies, movements: [] }).up;
const LEAGUE = { year: yr, compId: 'ERE', aw };
const CUP = { year: yr, compId: 'BEKER', aw };
const EURO = { year: yr, compId: 'UCL', aw };
check('the ids used here are the real ones', COMPETITIONS.ERE.type === 'league'
    && COMPETITIONS.BEKER.type === 'cup' && COMPETITIONS.UCL.type === 'cont');
check('nothing won -> x1', near(upWith([]), 1));
check('league title -> x' + A.HON_LEAGUE, near(upWith([LEAGUE]), A.HON_LEAGUE));
check('domestic cup -> x' + A.HON_CUP, near(upWith([CUP]), A.HON_CUP));
check('European trophy -> x' + A.HON_EURO, near(upWith([EURO]), A.HON_EURO));
check('league AND cup do not stack — the bigger one wins',
    near(upWith([LEAGUE, CUP]), A.HON_LEAGUE));
check('Europe stacks on top of a league title', near(upWith([LEAGUE, EURO]), A.HON_LEAGUE * A.HON_EURO));
check('two league titles in the window do not double up', near(upWith([LEAGUE, LEAGUE]), A.HON_LEAGUE));
check('honours never touch clubs at his level or below', (() => {
    const w = A.interestWeights({ ability: 70, trophies: [LEAGUE, EURO], movements: [] });
    return w.level === 1 && w.down === 1;
})());
appsStub = REGULAR - 1;
check(`a medal won with only ${REGULAR - 1} league games -> nothing (not a regular)`, near(upWith([LEAGUE]), 1));
appsStub = REGULAR;
check('a medal from 53 weeks ago has expired', near(upWith([{ year: yr - 1, compId: 'ERE', aw: aw - 53 }]), 1));
check('a medal from 51 weeks ago still counts', near(upWith([{ year: yr - 1, compId: 'ERE', aw: aw - 51 }]), A.HON_LEAGUE));
// saves written before this feature carry no `aw` at all
check('a legacy trophy with no timestamp falls back to the end of its season',
    near(upWith([{ year: yr, compId: 'ERE' }]), A.HON_LEAGUE)
    && near(upWith([{ year: yr - 4, compId: 'ERE' }]), 1));
// reserve football never even records a trophy — awardTrophy skips youth stints
check('awardTrophy stamps `aw` so the 52-week clock can start',
    /trophies\.push\(\{\s*year,\s*compId,\s*clubId,\s*aw:/.test(fs.readFileSync(path.join(base, 'league.js'), 'utf8')));
check('awardTrophy still ignores reserve-only players',
    /st\.clubId === clubId && !st\.youth/.test(fs.readFileSync(path.join(base, 'league.js'), 'utf8')));

// ---- 8. relegation ----------------------------------------------------------------------------
console.log('\n-- relegated as a regular, at least as good as the club that went down --');
const Clubs = vm.runInContext('Clubs', sb);
const host = Clubs.allClubs.filter(c => c.division === 'PromotionLeague')[0];
const relegP = (ability, mv, apps) => {
    appsStub = apps == null ? REGULAR : apps;
    return A.interestWeights({ ability, clubId: host.id, trophies: [], movements: mv });
};
const RELEG = [{ year: yr, type: 'releg', division: 'ChallengeLeague', aw }];
check('his club is real and has a reputation', !!host && host.reputation > 0);
let w = relegP(host.reputation, RELEG);
check('at exactly his club\'s level -> the division he left is flagged', w.relegDiv === 'ChallengeLeague');
check('...and interest overall rises', near(w.boost, A.RELEG_INTEREST));
check('well above his club\'s level -> still flagged', relegP(host.reputation + 10, RELEG).relegDiv === 'ChallengeLeague');
check('BELOW his club\'s level -> no boost (he was not their standard)',
    relegP(host.reputation - 1, RELEG).relegDiv === null);
check(`only ${REGULAR - 1} league games -> no boost`, relegP(host.reputation, RELEG, REGULAR - 1).relegDiv === null);
check('a relegation 53 weeks ago has expired',
    relegP(host.reputation, [{ year: yr - 1, type: 'releg', division: 'ChallengeLeague', aw: aw - 53 }]).relegDiv === null);
check('a PROMOTION is not a relegation',
    relegP(host.reputation, [{ year: yr, type: 'promo', division: 'ChallengeLeague', aw }]).relegDiv === null);
check('no movements at all -> no boost and no overall bump', (() => {
    const x = relegP(host.reputation, []);
    return x.relegDiv === null && x.boost === 1;
})());
// the pool weight, and the tilt toward that division's MODEST clubs
appsStub = REGULAR;
w = relegP(host.reputation, RELEG);
const oldDiv = c => A.buyerWeight({ ability: host.reputation }, c, w);
const modest = { reputation: host.reputation, division: 'ChallengeLeague' };
const strong = { reputation: host.reputation + 14, division: 'ChallengeLeague' };
const elsewhere = { reputation: host.reputation, division: 'ERE' };
check('a club in the division he left outweighs an equivalent club elsewhere',
    oldDiv(modest) > oldDiv(elsewhere) * 4);
check('...and its modest clubs outweigh its title contenders', oldDiv(modest) > oldDiv(strong) * 1.5);

// ---- 9. the untouched paths -------------------------------------------------------------------
// Free agents and loans still call pickBuyer with no weights, and must stay uniform.
console.log('\n-- pickBuyer without weights is still a flat draw --');
Rng.seed(99);
const flat = {};
for (let i = 0; i < 30000; i++) {
    const b = A.pickBuyer(pool, player);
    if (b) flat[b.id] = (flat[b.id] || 0) + 1;
}
const counts = Object.values(flat);
const expect = 30000 / pool.length;
check(`every club drawn about equally (${counts.length} clubs, spread ${Math.min(...counts)}-${Math.max(...counts)}, expected ~${Math.round(expect)})`,
    counts.length === pool.length && Math.min(...counts) > expect * 0.85 && Math.max(...counts) < expect * 1.15);
check('meanBuyerWeight of an empty pool is 1, not NaN', A.meanBuyerWeight(player, [], { up: 1, level: 1, down: 1 }) === 1);
check('a weight is never zero, so no club is impossible', (() => {
    form(5.5);
    const ww = A.interestWeights(player);
    return A.buyerWeight(player, { reputation: 90, division: 'ERE' }, ww) > 0;
})());

console.log(failed ? '\n*** FAIL ***' : '\nAll offer-interest checks passed.');
process.exitCode = failed ? 1 : 0;
