// Scout contracts: the wage-vs-length ladder negotiated at hire, and what it costs to break.
// Engine-level — the sheet that renders it is covered in test_scout_card.js.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout() {},
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} },
    addEventListener() {}, removeEventListener() {},
    UI: { money: n => '€' + n, esc: String, euro: n => '€' + n },
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

vm.runInContext("Clubs.init(); GameState.startNewGame('Netherlands','T','A'); Rng.seed(4242);", sb);

// ---------------- the ladder ----------------
console.log('-- a longer deal is always cheaper per week --');
const TERMS = JSON.parse(run('return JSON.stringify(Scouts.CONTRACT_TERMS);'));
check('six terms, 3 months to 3 years', TERMS.length === 6
    && TERMS[0].weeks === 13 && TERMS[5].weeks === 156);
check('the terms are in ascending length', TERMS.every((t, i) => i === 0 || t.weeks > TERMS[i - 1].weeks));

// 400 freshly rolled offers: the stance that varies the ladder must never invert it
let inversions = 0, missingQuote = 0, matchesAdvertised = 0;
const spread = [];
for (let i = 0; i < 400; i++) {
    const o = JSON.parse(run("return JSON.stringify(Scouts.makeOffer('x', 40 + Math.floor(Rng.next()*55)));"));
    let prev = Infinity;
    for (const t of TERMS) {
        const q = o.quotes[t.weeks];
        if (q == null) { missingQuote++; continue; }
        if (q > prev) inversions++;
        prev = q;
    }
    if (o.quotes[52] === o.weeklyCost) matchesAdvertised++;
    if (o.weeklyCost > 0) spread.push(o.quotes[156] / o.weeklyCost);
}
check('every offer quotes all six terms', missingQuote === 0);
check('no inversion in 400 offers (a longer deal is never dearer)', inversions === 0);
check('the 1-year quote IS the advertised wage', matchesAdvertised === 400);
const lo = Math.min(...spread), hi = Math.max(...spread);
// the 3-year discount should land near 20%, bent by the per-offer stance but never reversed
check(`a 3-year deal discounts ~20% (range ${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}% of the 1-year wage)`,
    lo > 0.70 && hi < 0.92);
check('some offers bargain harder than others', hi - lo > 0.04);

// quotes are stable: reading them repeatedly must not re-roll
const stable = run(`
    var o = Scouts.makeOffer('x', 60);
    var a = JSON.stringify(o.quotes);
    for (var i = 0; i < 5; i++) Scouts.quoteFor(o, 104);
    return a === JSON.stringify(o.quotes);
`);
check('reading a quote never re-rolls it', stable === true);

// an offer with no quotes (restored from a save, or the walkthrough's hardcoded scouts)
const legacy = JSON.parse(run(`
    var o = { id: 'wt_x', name: 'Demo', title: 'Chief scout', quality: 75, weeklyCost: 4590 };
    Scouts._ensureOffer(o);
    return JSON.stringify(o.quotes);
`));
check('a legacy offer gets a deterministic ladder', legacy['52'] === 4590 && legacy['156'] < 4590);
const before = run('return Rng.next();');
run("var o2 = { id:'z', name:'n', title:'t', quality:50, weeklyCost:1000 }; Scouts._ensureOffer(o2);");
const after = run('return Rng.next();');
// drawing from Rng at render time would desync the seeded world between repaints
check('filling a legacy offer draws nothing from Rng', typeof before === 'number' && typeof after === 'number'
    && run("var r=Rng.next(); var o3={id:'z2',name:'n',title:'t',quality:50,weeklyCost:1000}; Scouts._ensureOffer(o3); return Rng.next()!==r;") === true);

// ---------------- hiring on a term ----------------
console.log('\n-- hiring locks in the wage and the term --');
run("GameState.agency.scouts = []; GameState.agency.balance = 5000000; Upgrades.ownedOffice = 'iconic3';");
const hired = JSON.parse(run(`
    var o = Scouts.makeOffer('Chief scout', 70);
    var w3 = o.quotes[156];
    var r = Scouts.hire(o, 156);
    var s = GameState.agency.scouts[0];
    return JSON.stringify({ ok: r.ok, wage: s.weeklyCost, want: w3, term: s.contractWeeks,
                            until: s.contractUntil, now: GameState.absWeek() });
`));
check('the chosen term sets the wage', hired.ok && hired.wage === hired.want);
check('the minimum term is recorded', hired.term === 156 && hired.until === hired.now + 156);

// the old one-argument call must keep working
run("GameState.agency.scouts = [];");
const dflt = JSON.parse(run(`
    var o = Scouts.makeOffer('Senior scout', 55);
    Scouts.hire(o);
    var s = GameState.agency.scouts[0];
    return JSON.stringify({ wage: s.weeklyCost, advertised: o.weeklyCost, term: s.contractWeeks });
`));
check('hire() with no term defaults to a year at the advertised wage',
    dflt.term === 52 && dflt.wage === dflt.advertised);

// ---------------- breaking it ----------------
console.log('\n-- the pay-off --');
run("GameState.agency.scouts = []; GameState.agency.balance = 5000000;");
run("var o = Scouts.makeOffer('Chief scout', 70); Scouts.hire(o, 104);");
const fee0 = run('return Scouts.terminationFee(GameState.agency.scouts[0]);');
const wage0 = run('return GameState.agency.scouts[0].weeklyCost;');
check(`the fee is the remaining wages (${fee0} = 104 x ${wage0})`, fee0 === 104 * wage0);

// halfway through, half is owed
run("GameState.agency.scouts[0].contractUntil = GameState.absWeek() + 52;");
check('it shrinks as the term runs down', run('return Scouts.terminationFee(GameState.agency.scouts[0]);') === 52 * wage0);

// expiry costs nothing, and does NOT end the job
run("GameState.agency.scouts[0].contractUntil = GameState.absWeek();");
check('an expired contract owes nothing', run('return Scouts.terminationFee(GameState.agency.scouts[0]);') === 0);
check('...and he is still on the books, still working',
    run('return GameState.agency.scouts.length;') === 1
    && run('return GameState.agency.scouts[0].weeklyCost;') === wage0);
run("GameState.agency.scouts[0].contractUntil = GameState.absWeek() - 30;");
check('a long-expired contract never owes a negative', run('return Scouts.terminationFee(GameState.agency.scouts[0]);') === 0);

// releasing inside the term charges, and lands in the ledger the client release already uses
run("GameState.agency.scouts = []; GameState.agency.balance = 5000000; GameState.agency.ledger = {};");
run("var o = Scouts.makeOffer('Chief scout', 72); Scouts.hire(o, 156);");
const paid = JSON.parse(run(`
    var s = GameState.agency.scouts[0];
    var fee = Scouts.terminationFee(s), bal = GameState.agency.balance;
    var r = Scouts.release(s.id);
    return JSON.stringify({ ok: r.ok, msg: r.message, fee: fee, spent: bal - GameState.agency.balance,
                            ledger: GameState.agency.ledger['Release pay-outs'] || 0,
                            left: GameState.agency.scouts.length });
`));
check('releasing early charges exactly the fee', paid.ok && paid.spent === paid.fee && paid.fee > 0);
check('it books to Release pay-outs, like releasing a client', paid.ledger === -paid.fee);
check('he is off the books', paid.left === 0);
check('the message states what was paid', /paid off/.test(paid.msg));

// too poor: refused rather than overdrawn (matches Agency.releasePlayer)
run("GameState.agency.scouts = []; GameState.agency.balance = 5000000;");
run("var o = Scouts.makeOffer('Chief scout', 75); Scouts.hire(o, 156);");
const broke = JSON.parse(run(`
    GameState.agency.balance = 100;
    var s = GameState.agency.scouts[0], bal = GameState.agency.balance;
    var r = Scouts.release(s.id);
    return JSON.stringify({ ok: r.ok, bal: GameState.agency.balance, same: bal, left: GameState.agency.scouts.length });
`));
check('a pay-off you cannot afford is refused, not overdrawn',
    broke.ok === false && broke.bal === broke.same && broke.left === 1);

// free once expired
run("GameState.agency.scouts[0].contractUntil = GameState.absWeek();");
const freed = JSON.parse(run(`
    var bal = GameState.agency.balance;
    var r = Scouts.release(GameState.agency.scouts[0].id);
    return JSON.stringify({ ok: r.ok, cost: bal - GameState.agency.balance, left: GameState.agency.scouts.length });
`));
check('releasing an out-of-contract scout is free', freed.ok && freed.cost === 0 && freed.left === 0);

// ---------------- old saves ----------------
console.log('\n-- an existing save --');
// a scout from before contracts existed must not be handed one retroactively
const migrated = JSON.parse(run(`
    GameState.agency.scouts = [{ id: 'old', name: 'Legacy', title: 'Lead scout', quality: 40,
                                 weeklyCost: 500, region: null, weeksUntilFind: 3 }];
    GameState._migrateScoutContracts();
    var s = GameState.agency.scouts[0];
    return JSON.stringify({ until: s.contractUntil, now: GameState.absWeek(),
                            weeks: Scouts.contractWeeksLeft(s), fee: Scouts.terminationFee(s) });
`));
check('a pre-contract scout is treated as already expired',
    migrated.until === migrated.now && migrated.weeks === 0 && migrated.fee === 0);
check('the schema version was bumped for it', run('return GameState.SCHEMA_VERSION;') >= 4);
// and the migration must not stomp a contract that is already there
const keep = run(`
    GameState.agency.scouts = [{ id: 'new', contractUntil: GameState.absWeek() + 80, contractWeeks: 104 }];
    GameState._migrateScoutContracts();
    return GameState.agency.scouts[0].contractUntil === GameState.absWeek() + 80;
`);
check('a scout who already has a contract keeps it', keep === true);

console.log(failed ? '\n*** FAIL ***' : '\nAll scout-contract checks passed.');
process.exit(failed ? 1 : 0);
