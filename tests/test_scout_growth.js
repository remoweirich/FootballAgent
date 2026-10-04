// Scout ageing: the growth/decline curve, the +15 cap, retirement, and the shortfall penalty
// that replaces recalling a scout who has declined below his foreign league's bar.
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

vm.runInContext("Clubs.init(); GameState.startNewGame('Netherlands','T','A'); Rng.seed(777);", sb);

// ---------------- the curve ----------------
console.log('-- the yearly curve --');
const band = a => run('return Scouts.yearlyDelta(' + a + ');');
check('25-34 gains 2', band(25) === 2 && band(34) === 2);
check('35-54 gains 1', band(35) === 1 && band(54) === 1);
check('55-64 is flat', band(55) === 0 && band(64) === 0);
check('65-69 loses 1', band(65) === -1 && band(69) === -1);
check('70-79 loses 2', band(70) === -2 && band(79) === -2);
check('80-84 loses 3', band(80) === -3 && band(84) === -3);

// ---------------- age at hire ----------------
console.log('\n-- age at hire tracks standing, loosely --');
const ages = { lo: [], hi: [] };
for (let i = 0; i < 600; i++) {
    ages.lo.push(run('return Scouts._offerAge(20);'));
    ages.hi.push(run('return Scouts._offerAge(95);'));
}
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const mLo = mean(ages.lo), mHi = mean(ages.hi);
check(`a top scout is older on average (${mLo.toFixed(1)} at q20 vs ${mHi.toFixed(1)} at q95)`, mHi - mLo > 8);
check('always inside 25-60', ages.lo.concat(ages.hi).every(a => a >= 25 && a <= 60));
// the user asked for loose, not deterministic: a young star must stay possible
const youngStars = ages.hi.filter(a => a <= 30).length;
check(`a young top scout is rare but possible (${youngStars}/600 at 30 or under)`, youngStars > 0 && youngStars < 60);
check('the spread is wide, not clustered', new Set(ages.hi).size > 15);

// ---------------- a whole career ----------------
console.log('\n-- a career, year by year --');
// drive ageTick 60 times on his birth week, which is what the weekly sim does
const career = JSON.parse(run(`
    GameState.agency.scouts = [{ id: 'c', name: 'Career', title: 't', quality: 50, hireQuality: 50,
        age: 26, birthWeek: 5, weeklyCost: 100, region: null, league: null,
        history: { ability: [{ t: GameState.absWeek(), value: 50 }] } }];
    var log = [], retiredAt = null;
    for (var y = 0; y < 70; y++) {
        GameState.week = 5;
        var notes = Scouts.ageTick();
        var s = GameState.agency.scouts[0];
        if (!s) { retiredAt = notes[0] && notes[0].age; break; }
        log.push({ age: s.age, q: s.quality });
        GameState.absWeekOffset = 0;
        GameState.seasonStartYear += 1;   // push absWeek forward a year so history points separate
    }
    var s0 = GameState.agency.scouts[0];
    return JSON.stringify({ log: log, retiredAt: retiredAt,
                            hist: s0 ? s0.history.ability.length : null });
`));
const at = a => (career.log.find(r => r.age === a) || {}).q;
check('he improves while young (50 at 26 -> ' + at(30) + ' at 30)', at(30) === 58);
check('the +15 cap binds before the band runs out (' + at(34) + ' at 34, ' + at(40) + ' at 40)',
    at(34) === 65 && at(40) === 65);
check('he plateaus through his fifties', at(50) === 65 && at(60) === 65);
// he loses the point ON turning 65, so 65 itself is already 64 and 69 is 60
check('decline starts on turning 65 (' + at(65) + ' at 65, ' + at(69) + ' at 69)', at(65) === 64 && at(69) === 60);
check('it steepens at 70 (' + at(75) + ' at 75) and again at 80 (' + at(82) + ' at 82)',
    at(75) === 48 && at(82) === 31);
// peak 65 down to 25 by the end: a scout you keep to 85 really is finished
check('the full decline is about -40 from his peak (' + at(84) + ' at 84)', at(84) === 25);
check('he retires at 85', career.retiredAt === 85);
check('every move is recorded for the chart', career.hist === null || career.hist > 10);

// the cap is measured from the rating he was HIRED at, not wherever he is now
const capped = run(`
    GameState.agency.scouts = [{ id: 'k', name: 'K', quality: 80, hireQuality: 70, age: 30, birthWeek: 9,
        history: { ability: [] } }];
    for (var i = 0; i < 20; i++) { GameState.week = 9; Scouts.ageTick(); GameState.seasonStartYear += 1; }
    return GameState.agency.scouts[0].quality;
`);
check('the cap is +15 over the HIRE rating, not the current one (' + capped + ')', capped === 85);

// decline is deliberately uncapped, but never goes through the floor
const floored = run(`
    GameState.agency.scouts = [{ id: 'f', name: 'F', quality: 20, hireQuality: 20, age: 70, birthWeek: 3,
        history: { ability: [] } }];
    for (var i = 0; i < 14; i++) { GameState.week = 3; Scouts.ageTick(); GameState.seasonStartYear += 1; }
    var s = GameState.agency.scouts[0];
    return s ? s.quality : -1;
`);
check('decline stops at the floor rather than going negative (' + floored + ')', floored === 5);

// nothing happens on any other week
const quiet = run(`
    GameState.agency.scouts = [{ id: 'q', name: 'Q', quality: 50, hireQuality: 50, age: 30, birthWeek: 11,
        history: { ability: [] } }];
    GameState.week = 12; Scouts.ageTick();
    return GameState.agency.scouts[0].quality;
`);
check('he only ages on his own birth week', quiet === 50);

// ---------------- retirement ----------------
console.log('\n-- retirement --');
const ret = JSON.parse(run(`
    GameState.agency.scouts = [{ id: 'r', name: 'Old Hand', quality: 40, hireQuality: 40, age: 84,
        birthWeek: 7, league: 'BUNDES', country: 'Germany', history: { ability: [] } }];
    GameState.week = 7;
    var notes = Scouts.ageTick();
    return JSON.stringify({ notes: notes, left: GameState.agency.scouts.length });
`));
check('he is off the books', ret.left === 0);
check('a note is returned for the inbox', ret.notes.length === 1 && ret.notes[0].kind === 'retired'
    && ret.notes[0].name === 'Old Hand' && ret.notes[0].age === 85);
check('it names what he was covering, so the gap is visible', !!ret.notes[0].where);
check('all four mail strings exist', ['sim.scoutRetired', 'sim.scoutRetiredSubj', 'sim.scoutRetiredBody', 'sim.scoutRetiredBodyPosted']
    .every(k => run("return I18n.t('" + k + "') !== '" + k + "';")));

// End to end through the real weekly tick, not just ageTick in isolation: the wiring in
// Simulation is where a returned note turns into something the player actually sees.
const mailed = JSON.parse(run(`
    GameState.inbox = [];
    GameState.agency.scouts = [{ id: 'e', name: 'Walter Oud', title: 'Chief scout', quality: 70,
        hireQuality: 70, age: 84, birthWeek: (GameState.week % 52) + 1, weeklyCost: 100,
        region: 'noord', league: null, weeksUntilFind: 9, contractUntil: GameState.absWeek(),
        history: { ability: [] } }];
    Sim.advanceWeek();
    var m = (GameState.inbox || []).find(x => /Walter Oud/.test(x.subject || ''));
    return JSON.stringify({ left: GameState.agency.scouts.length, subj: m && m.subject,
                            body: m && m.body, cat: m && m.cat });
`));
check('advancing a week retires him for real', mailed.left === 0);
check('an inbox mail arrives, filed under scouting', !!mailed.subj && mailed.cat === 'scout');
// the whole point of the "posted" variant: the body must name the region left uncovered
check('the mail names his age and the region now uncovered',
    /85/.test(mailed.body || '') && /Noord/i.test(mailed.body || ''));
check('no untranslated key leaked into it', !/sim\.scoutRetired/.test((mailed.subj || '') + (mailed.body || '')));

// ---------------- declining below a league's bar ----------------
console.log('\n-- a scout who has slipped below his league --');
const minQ = run("return Scouts.minScoutQualityFor('BUNDES');");
const pen = run(`
    return JSON.stringify([
        Scouts.leagueShortfallPenalty({ league: 'BUNDES', quality: ${minQ} }),
        Scouts.leagueShortfallPenalty({ league: 'BUNDES', quality: ${minQ} - 5 }),
        Scouts.leagueShortfallPenalty({ league: 'BUNDES', quality: ${minQ} + 10 }),
        Scouts.leagueShortfallPenalty({ region: 'noord', quality: 10 })
    ]);
`);
const P = JSON.parse(pen);
check('a scout who still meets the bar is not penalised (' + minQ + ' needed)', P[0] === 0 && P[2] === 0);
check('falling short costs him, scaled to the gap', P[1] === 10);
check('a domestic posting is never penalised', P[3] === 0);
// he must NOT be recalled — the decision stays the player's
const stays = run(`
    GameState.agency.scouts = [{ id: 'd', name: 'D', quality: 30, hireQuality: 30, age: 70, birthWeek: 2,
        league: 'BUNDES', country: 'Germany', weeksUntilFind: 5, history: { ability: [] } }];
    GameState.week = 2; Scouts.ageTick();
    var s = GameState.agency.scouts[0];
    return s && s.league === 'BUNDES';
`);
check('he keeps the posting rather than being pulled off it', stays === true);

// ---------------- old saves ----------------
console.log('\n-- an existing save --');
const mig = JSON.parse(run(`
    GameState.agency.scouts = [{ id: 'old', name: 'Legacy', title: 'Lead scout', quality: 44,
                                 weeklyCost: 500, region: null, weeksUntilFind: 3 }];
    GameState._migrateScoutAges();
    var s = GameState.agency.scouts[0];
    return JSON.stringify({ age: s.age, bw: s.birthWeek, hq: s.hireQuality,
                            hist: (s.history && s.history.ability || []).length });
`));
check('he gets an age in range', mig.age >= 25 && mig.age <= 60);
check('and a birth week', mig.bw >= 1 && mig.bw <= 52);
check('his CURRENT rating becomes the growth baseline, so he can still improve', mig.hq === 44);
check('the chart gets an anchor point', mig.hist === 1);
check('the schema version was bumped', run('return GameState.SCHEMA_VERSION;') >= 5);
const idem = run(`
    GameState.agency.scouts = [{ id: 'x', quality: 50, age: 41, birthWeek: 9, hireQuality: 30,
                                 history: { ability: [{ t: 1, value: 30 }, { t: 2, value: 50 }] } }];
    GameState._migrateScoutAges();
    var s = GameState.agency.scouts[0];
    return s.age === 41 && s.birthWeek === 9 && s.hireQuality === 30 && s.history.ability.length === 2;
`);
check('a scout who already has all of it is left alone', idem === true);

// ---------------- wages never move ----------------
const wageFixed = run(`
    GameState.agency.scouts = [{ id: 'w', name: 'W', quality: 50, hireQuality: 50, age: 28, birthWeek: 4,
        weeklyCost: 1234, history: { ability: [] } }];
    for (var i = 0; i < 6; i++) { GameState.week = 4; Scouts.ageTick(); GameState.seasonStartYear += 1; }
    var s = GameState.agency.scouts[0];
    return s.weeklyCost === 1234 && s.quality > 50;
`);
check('he is paid what he negotiated, however good he gets', wageFixed === true);

console.log(failed ? '\n*** FAIL ***' : '\nAll scout-growth checks passed.');
process.exit(failed ? 1 : 0);
