// A created country has to behave like a stock one in three places the engine reads:
// the scout-report ladder, the scout name pool, and the European berths it takes over.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout() {}, indexedDB: undefined,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} }, addEventListener() {}, removeEventListener() {},
    UI: { money: String, esc: String, euro: String },
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

vm.runInContext("Clubs.init(); Rng.seed(11);", sb);

// ---------------- the scout-report ladder ----------------
console.log('-- a report reads against THIS country, not the Dutch ladder --');
// Austria the way the player described it: Salzburg 80 at the top, Liefering 64 in the second tier
run(`
    var cc = WorldExt.makeSkeleton('Austria', true);
    var d = cc.divIds;
    var top = cc.clubs.filter(function (c) { return c.division === d[0]; });
    top.forEach(function (c, i) { c.reputation = 80 - i * 0.7; });        // best 80, median ~73
    var second = cc.clubs.filter(function (c) { return c.division === d[1]; });
    second.forEach(function (c, i) { c.reputation = 64 - i * 0.7; });     // best 64, median ~57
    // six populated scouting regions: registerCountry only adds the country to REGIONS_BY_COUNTRY
    // when it has them, and that is what makes it selectable as a home country
    cc.regions = [0, 1, 2, 3, 4, 5].map(function (i) {
        return { id: 'CUS:Austria:r' + (i + 1), name: 'Region ' + (i + 1),
                 clubIds: [cc.clubs[i].id, cc.clubs[i + 10].id] };
    });
    WorldExt.registerCountry(cc);
    __austria = cc;
`);
const lab = p => run("return Scouting.tierLabel(" + p + ", 'Austria');");
// the player's own worked example
check('top club rep 80 -> a potential of 78 is a 1st Division Star', /1st Division/.test(lab(78)) && /Star/.test(lab(78)));
check('...and 79, 80 are too', /Star/.test(lab(79)) && /Star/.test(lab(80)));
check('2nd-tier best rep 64 -> a potential of 62 is a 2nd Division Star',
    /2nd Division/.test(lab(62)) && /Star/.test(lab(62)));
const ladder = JSON.parse(run("return JSON.stringify(LEAGUE_TIERS['Austria'].tiers);"));
const d1reg = ladder.find(t => t.rank === 'regular' && /:1$/.test(t.comp || ''));
const d1 = JSON.parse(run(`
    var d = WorldExt.created['Austria'].divIds[0];
    var reps = WorldExt.created['Austria'].clubs.filter(function (c) { return c.division === d; }).map(function (c) { return c.reputation; }).sort(function (a, b) { return a - b; });
    return JSON.stringify({ median: reps[Math.floor(reps.length / 2)], best: reps[reps.length - 1] });
`));
check(`"Regular" is the division's MEDIAN club (${d1reg && d1reg.min} = median ${d1.median})`,
    !!d1reg && d1reg.min === Math.round(d1.median));
check(`"Star" is the division's best minus 2 (${d1.best} -> ${Math.round(d1.best) - 2})`,
    (ladder.find(t => t.rank === 'star' && /:1$/.test(t.comp || '')) || {}).min === Math.round(d1.best) - 2);

// the international tiers are the same everywhere, so "world class" means one thing
const nl = JSON.parse(run("return JSON.stringify(LEAGUE_TIERS.Netherlands.tiers.filter(function(t){return !t.comp;}));"));
check('International Superstar / Regular match the stock ladder',
    ladder.find(t => t.rank === 'intlSuperstar').min === nl.find(t => t.rank === 'intlSuperstar').min
    && ladder.find(t => t.rank === 'intlRegular').min === nl.find(t => t.rank === 'intlRegular').min);
check('the labels name the created divisions, not Dutch ones',
    !/Eredivisie|Eerste/.test(lab(78) + lab(62) + lab(40)));

// the ladder is read top-down by `pot >= min`, so it has to descend no matter what reps were set
const monotonic = ladder.every((t, i) => i === 0 || t.min < ladder[i - 1].min);
check('the ladder strictly descends', monotonic);
// a player can set absurd reputations; the ladder must still be sane
run(`
    var cc2 = WorldExt.makeSkeleton('Croatia', true);
    cc2.clubs.forEach(function (c) { c.reputation = 97; });     // every club identical and sky-high
    WorldExt.registerCountry(cc2);
`);
const silly = JSON.parse(run("return JSON.stringify(LEAGUE_TIERS['Croatia'].tiers);"));
check('all-identical, sky-high reputations still produce a descending ladder',
    silly.every((t, i) => i === 0 || t.min < silly[i - 1].min));
check('...and never outrank the international tiers',
    silly.filter(t => t.comp).every(t => t.min < 85));

// ---------------- scout names ----------------
console.log('\n-- scouts are named locally --');
// startNewGame re-inits Clubs (dropping the registered world) and only THEN validates the home
// country — so the created country has to arrive as the database argument, exactly as the setup
// screen passes it. Without it, homeCountry silently falls back to the Netherlands.
run("GameState.startNewGame('Austria', 'T', 'A', { id: 'dbT', countries: { Austria: __austria } });");
check('a created country can be the home country when its database is passed',
    run("return GameState.homeCountry;") === 'Austria');
run("WorldExt.created['Austria'].names.scouts = ['Hansi Krankl', 'Toni Polster', 'Herbert Prohaska'];");
const names = [];
for (let i = 0; i < 40; i++) names.push(run('return Scouts.scoutName();'));
check('a supplied scout list is used', names.every(n => /Krankl|Polster|Prohaska/.test(n)));
check('...and all of it is used', new Set(names).size === 3);
// no list given: build from the country's own player names rather than another country's scouts
run("delete WorldExt.created['Austria'].names.scouts;");
run("WorldExt.created['Austria'].names.first = ['Dominik']; WorldExt.created['Austria'].names.last = ['Gruber'];");
check('with no scout list, the country\'s own name pools are used, not the Dutch fallback',
    run('return Scouts.scoutName();') === 'Dominik Gruber');

// ---------------- Europe ----------------
console.log('\n-- the clubs a created country replaces in Europe --');
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-customize.js', 'utf8'), sb, { filename: 'screen-customize.js' });
const stand = JSON.parse(run("return JSON.stringify(CustomizeScreen.euroStandIns(WorldExt.created['Austria']));"));
check('Austria is recognised and its stand-in clubs listed (' + stand.length + ')', stand.length > 0);
check('they are the real Austrian names from EUROPE_DATA',
    stand.some(c => /Salzburg|Sturm|Rapid|LASK|Austria Wien/.test(c.name)));
check('strongest first, with reputations', stand[0].rep >= stand[stand.length - 1].rep && stand[0].rep > 0);
check('a non-European created country lists nothing', (() => {
    run("var x = WorldExt.makeSkeleton('Brazil', false); WorldExt.registerCountry(x);");
    return JSON.parse(run("return JSON.stringify(CustomizeScreen.euroStandIns(WorldExt.created['Brazil']));")).length === 0;
})());
// the swap itself already exists in europe.js; this is the check that it is still wired
const euSrc = fs.readFileSync(root + 'js/europe.js', 'utf8');
check('europe.js still feeds a created country\'s real table into its berths',
    /WorldExt[\s\S]{0,200}created[\s\S]{0,400}customEuro/.test(euSrc) && /customEuro\[name\]/.test(euSrc));

console.log(failed ? '\n*** FAIL ***' : '\nAll created-country checks passed.');
process.exit(failed ? 1 : 0);
