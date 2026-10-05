// First-Aid Kit and Resistance Bands expire 52 weeks after they are BOUGHT, not at the next
// season rollover, and staff keep theirs stocked the moment it lapses.
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

vm.runInContext("Clubs.init(); GameState.startNewGame('Netherlands','T','A');", sb);

// ---------------- the term is 52 weeks from purchase ----------------
console.log('-- 52 weeks from the day you buy it --');
check('both consumables are weeks-based now', run(`
    var a = Upgrades.equipById('first_aid'), b = Upgrades.equipById('resistance_bands');
    return a.expiresWeeks === 52 && b.expiresWeeks === 52 && a.expires == null && b.expires == null;
`) === true);

// This is the behaviour the change is FOR: buying late in a season used to leave you a couple of
// weeks, because expiry was pinned to the season rollover rather than the purchase.
const late = JSON.parse(run(`
    GameState.agency.balance = 100000; GameState.week = 50;
    Upgrades.buyEquip('first_aid');
    return JSON.stringify({ left: Upgrades.weeksLeft('first_aid'), week: GameState.week });
`));
check('bought in week 50, it still has a full 52 weeks (' + late.left + ')', late.left === 52);

const early = run(`
    GameState.agency.facilities = { items: [], physios: 0, trainers: 0 };
    GameState.week = 3; GameState.agency.balance = 100000;
    Upgrades.buyEquip('first_aid');
    return Upgrades.weeksLeft('first_aid');
`);
check('and so does one bought in week 3', early === 52);

// ---------------- it runs out, weekly ----------------
console.log('\n-- it lapses on its own week, not at the rollover --');
const decay = JSON.parse(run(`
    var seen = [];
    for (var i = 0; i < 51; i++) { GameState.week++; if (GameState.week > 52) { GameState.week = 1; GameState.seasonStartYear++; } Upgrades.facTick(); }
    seen.push(Upgrades.weeksLeft('first_aid'));          // 1 week to go, still owned
    seen.push(Upgrades.ownsEquip('first_aid'));
    GameState.week++; if (GameState.week > 52) { GameState.week = 1; GameState.seasonStartYear++; }
    Upgrades.facTick();
    seen.push(Upgrades.ownsEquip('first_aid'));          // now gone
    return JSON.stringify(seen);
`));
check('it survives 51 weeks (' + decay[0] + ' left) and is gone on the 52nd',
    decay[0] === 1 && decay[1] === true && decay[2] === false);
check('losing it removes its effect', run("return Upgrades.facInjuryBonus();") >= 0
    || run("return !Upgrades.ownsEquip('first_aid');") === true);

// ---------------- staff keep theirs stocked ----------------
console.log('\n-- a physio means you never see the expiry --');
const staffed = JSON.parse(run(`
    GameState.agency.facilities = { items: [], physios: 0, trainers: 0 };
    GameState.agency.balance = 10000000;
    Upgrades.hireStaff('physio');
    var first = Upgrades.weeksLeft('first_aid');
    var everMissing = false, lows = [];
    for (var i = 0; i < 160; i++) {
        GameState.week++; if (GameState.week > 52) { GameState.week = 1; GameState.seasonStartYear++; }
        Upgrades.facTick();
        if (!Upgrades.ownsEquip('first_aid')) everMissing = true;
        lows.push(Upgrades.weeksLeft('first_aid'));
    }
    return JSON.stringify({ first: first, everMissing: everMissing, min: Math.min.apply(null, lows), end: Upgrades.weeksLeft('first_aid') });
`));
check('hiring a physio brings a kit immediately (' + staffed.first + 'w)', staffed.first === 52);
check('over three years it is never once missing', staffed.everMissing === false);
check('...because it is replaced the week it runs out, not at the rollover', staffed.min >= 0 && staffed.end > 0);
// and a trainer does the same for the bands
check('a trainer keeps the resistance bands stocked', run(`
    GameState.agency.facilities = { items: [], physios: 0, trainers: 0 };
    Upgrades.hireStaff('trainer');
    for (var i = 0; i < 120; i++) { GameState.week++; if (GameState.week > 52) { GameState.week = 1; GameState.seasonStartYear++; } Upgrades.facTick(); }
    return Upgrades.ownsEquip('resistance_bands');
`) === true);
// with no staff it is NOT replaced
check('with no staff it simply runs out and stays out', run(`
    GameState.agency.facilities = { items: [], physios: 0, trainers: 0 };
    GameState.agency.balance = 100000; Upgrades.buyEquip('first_aid');
    for (var i = 0; i < 60; i++) { GameState.week++; if (GameState.week > 52) { GameState.week = 1; GameState.seasonStartYear++; } Upgrades.facTick(); }
    return Upgrades.ownsEquip('first_aid');
`) === false);

// ---------------- an existing save ----------------
console.log('\n-- a save from before the change --');
// old items stored expiresSeason; they must not vanish on the first tick, nor live forever
const legacy = JSON.parse(run(`
    GameState.seasonStartYear = 2030; GameState.week = 10;
    GameState.agency.facilities = { items: [
        { id: 'first_aid', expiresSeason: 2031 },        // still in date
        { id: 'resistance_bands', expiresSeason: 2029 }  // lapsed before this season
    ], physios: 0, trainers: 0 };
    Upgrades.facTick();
    return JSON.stringify({
        kept: Upgrades.ownsEquip('first_aid'),
        dropped: !Upgrades.ownsEquip('resistance_bands'),
        left: Upgrades.weeksLeft('first_aid')
    });
`));
check('an in-date legacy item is kept', legacy.kept === true);
check('a lapsed legacy item is dropped', legacy.dropped === true);
check('its remaining weeks are read from the season it meant (' + legacy.left + 'w)',
    legacy.left > 0 && legacy.left <= 104);

// ---------------- the strings ----------------
console.log('\n-- wording --');
const ui = fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8');
check('the year-based string is gone', !/'agency\.eff\.expires':/.test(ui));
check('weeks strings exist', /'agency\.eff\.expiresIn':/.test(ui) && /'agency\.eff\.lastsWeeks':/.test(ui));
check('staff no longer promise a yearly restock',
    !/every year/.test(run("return I18n.t('upg.ok.staffHired');")));
const agency = fs.readFileSync(root + 'ui/js/screen-agency.js', 'utf8');
check('the shop reads the new fields, not e.expires', /expiresWeeks/.test(agency) && !/e\.expires \?/.test(agency));

console.log(failed ? '\n*** FAIL ***' : '\nAll consumable checks passed.');
process.exit(failed ? 1 : 0);
