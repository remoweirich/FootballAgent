// The season calendar (docs/international-football-spec.md), measured from real simulated seasons:
//  - three international breaks (11-12, 17-18, 36-37) with no senior club football at all
//  - league rounds on the fixed table: one per league week, doubles only in the agreed weeks,
//    never three in a week, everything finished by week 45 (34-round leagues by 43)
//  - domestic cups: round 2 in week 8, top-tier finals week 46, lower-tier finals week 47
//  - Europe: MD 10/15/16/19/21/25/29/31, R16 38/39, final 47
//  - a save already past week 6 finishes its season on the OLD calendar, then switches
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const noop = () => {};
const sb = { console: { log: noop, warn: noop, error: noop }, Math, Date, JSON, setTimeout: () => 0, clearTimeout: noop,
    setInterval: () => 0, clearInterval: noop, indexedDB: undefined, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: { addEventListener: noop, getElementById: () => null, querySelector: () => null }, addEventListener: noop, removeEventListener: noop,
    UI: { money: String, esc: String, euro: String } };
sb.window = sb; vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

// Record, per real week: league rounds per division, every cup result's round, every European step.
run(`Rng.seed(2026); Clubs.init(); GameState.startNewGame('England','Cal','A'); GameState.save = function () {};
    __wk = {};
    var at = function () { var w = GameState.week; return (__wk[w] = __wk[w] || { md: {}, cups: [], eu: [], ties: 0 }); };
    var sw = League.simulateWeek;
    League.simulateWeek = function () {
        var L = GameState.league, b = Object.assign({}, L.mdIndex);
        var r = sw.apply(this, arguments);
        Object.keys(L.mdIndex).forEach(function (d) { var n = L.mdIndex[d] - (b[d] || 0); if (n > 0) at().md[d] = n; });
        return r;
    };
    var pt = League.playCupTie;
    League.playCupTie = function (h, a, comp, fin) { at().ties++; if (fin) at().cups.push('FINAL:' + comp); return pt.apply(this, arguments); };
    ['_playQualRound', '_playMatchday', '_poLeg1', '_koLeg2Round', '_r16Leg1', '_nextRoundLeg1', '_playFinal'].forEach(function (k) {
        var f = Europe[k];
        Europe[k] = function (ed, comp, x, y) { at().eu.push(k + ':' + comp + (typeof x === 'string' ? ':' + x : '')); return f.apply(this, arguments); };
    });
    __season = function () {
        __wk = {};
        var lens = {}; Object.keys(GameState.league.schedule).forEach(function (d) { lens[d] = GameState.league.schedule[d].length; });
        do { Sim.advanceWeek(); } while (GameState.week !== 48);
        var L = GameState.league, cups = {};
        ['beker','kbek','facup','llc','dfb','lpokal','cdr','cfed','schwcup','cupabass','lichcup','coppaitalia','coppacompagno','coupefrance','coupenational','tacaportugal','segundataca','belgiancup','notrecoupe']
            .forEach(function (k) { var C = L[k]; if (C) cups[k] = { winner: !!C.winner, weeks: (C.results || []).map(function (r) { return r.week + ':' + r.round; }) }; });
        var done = {}; Object.keys(L.schedule).forEach(function (d) { done[d] = L.mdIndex[d] === L.schedule[d].length; });
        var out = { wk: __wk, lens: lens, cups: cups, done: done, legacy: !!L.legacyCalendar };
        while (GameState.week !== 1) Sim.advanceWeek();   // through the rollover into the next season
        return JSON.stringify(out);
    };`);

// season 1 has no European competitions (they are drawn from the previous season's tables), so
// measure season 2 for the full picture
run('__season();');
const S = JSON.parse(run('return __season();'));
const W = w => S.wk[w] || { md: {}, cups: [], eu: [], ties: 0 };

console.log('-- international breaks --');
for (const w of [11, 12, 17, 18, 36, 37]) {
    const x = W(w);
    check(`week ${w}: no league, cup or European football`, !Object.keys(x.md).length && !x.ties && !x.eu.length, JSON.stringify(x).slice(0, 120));
}
check('week 27 (winter break): no league', !Object.keys(W(27).md).length);
check('weeks 10 and 28 are league weeks now', Object.keys(W(10).md).length > 0 && Object.keys(W(28).md).length > 0);

console.log('\n-- league rounds --');
const DOUBLES = { 34: [], 36: [], 38: [10, 14], 42: [9, 10, 14, 22, 30, 42], 44: [9, 10, 19, 23, 30, 34, 39, 43], 46: [7, 9, 10, 14, 20, 24, 29, 33, 40, 44] };
const LEAGUE_WEEKS = [];
for (let w = 3; w <= 45; w++) if (![11, 12, 17, 18, 27, 36, 37].includes(w)) LEAGUE_WEEKS.push(w);
check('36 league weeks', LEAGUE_WEEKS.length === 36);
const byLen = {};
for (const [div, len] of Object.entries(S.lens)) (byLen[len] = byLen[len] || []).push(div);
for (const [len, divs] of Object.entries(byLen)) {
    const bad = [];
    for (const div of divs) {
        for (let w = 1; w <= 52; w++) {
            const got = (W(w).md[div]) || 0;
            const li = LEAGUE_WEEKS.indexOf(w);
            const want = li < 0 ? 0 : (+len <= 36 ? (li < +len ? 1 : 0) : 1 + ((DOUBLES[len] || []).includes(w) ? 1 : 0));
            if (got !== want) { bad.push(`${div} wk${w}: ${got} (want ${want})`); break; }
        }
        if (!S.done[div]) bad.push(div + ' unfinished');
    }
    check(`${len}-round leagues (${divs.length}): exactly the agreed rounds every week, all finished`, bad.length === 0, bad.slice(0, 3).join('; '));
}
const maxPerWeek = Math.max(...Object.values(S.wk).map(x => Math.max(0, ...Object.values(x.md))));
check(`no league ever plays three rounds in a week (max ${maxPerWeek})`, maxPerWeek <= 2);
const last34 = Math.max(...Object.keys(S.wk).map(Number).filter(w => byLen[34].some(d => W(w).md[d])));
check(`34-round leagues finish in week 43 (${last34})`, last34 === 43);

console.log('\n-- domestic cups --');
const TOP = ['beker', 'facup', 'dfb', 'cdr', 'schwcup', 'lichcup', 'coppaitalia', 'coupefrance', 'tacaportugal', 'belgiancup'];
for (const [k, c] of Object.entries(S.cups)) {
    const weeks = c.weeks.map(s => +s.split(':')[0]);
    const fin = weeks[weeks.length - 1];
    const want = TOP.includes(k) ? 46 : 47;
    check(`${k}: has a winner, final in week ${want}${weeks.includes(8) ? ', round 2 in week 8' : ''}`, c.winner && fin === want && !weeks.includes(7), c.weeks.join(' | '));
}
const allowed = new Set([4, 8, 10, 15, 16, 26, 32, 38, 46, 47]);
const stray = Object.keys(S.wk).map(Number).filter(w => W(w).ties && !allowed.has(w));
check('cup ties only in cup weeks (4, 8, 10, 15, 26, 32, 38, 46, 47)', stray.length === 0, stray.join(','));
check('the Dutch Cup keeps its round names (week 8 = "Second round")', S.cups.beker.weeks.includes('8:Second round'));

console.log('\n-- European competitions --');
const euWeeks = name => Object.keys(S.wk).map(Number).filter(w => W(w).eu.some(e => e.startsWith(name))).sort((a, b) => a - b);
check('league phase MD1-8 in weeks 10, 15, 16, 19, 21, 25, 29, 31', euWeeks('_playMatchday').join() === '10,15,16,19,21,25,29,31', euWeeks('_playMatchday').join());
check('R16 legs in weeks 38 and 39', euWeeks('_r16Leg1').join() === '38' && W(39).eu.some(e => e.endsWith(':r16')));
check('finals in week 47', euWeeks('_playFinal').join() === '47');
check('top-tier cup finals are in week 46, the European finals a week later', S.cups.facup.weeks.some(s => s.startsWith('46:')));

console.log('\n-- saves from the old calendar --');
const mig = JSON.parse(run(`
    var out = {};
    [3, 6, 7, 20, 47, 48, 52].forEach(function (w) {
        var L = { schedule: {} }; var gs = { league: L, week: w };
        GameState._migrateCalendarV2.call(gs);
        out[w] = !!L.legacyCalendar;
    });
    return JSON.stringify(out);`));
check('a save at week 6 or earlier switches straight away', !mig[3] && !mig[6]);
check('a save in weeks 7-47 finishes the season on the old calendar', mig[7] && mig[20] && mig[47]);
check('an off-season save (48-52) switches straight away', !mig[48] && !mig[52]);
check('the migration is wired as schema 7', run('return GameState.SCHEMA_VERSION >= 7 && GameState.MIGRATIONS.some(function (m) { return m.to === 7; });') === true);

// a legacy season, start to finish: the old weeks, every cup and league completed
run('GameState.league.legacyCalendar = true;');
const O = JSON.parse(run('return __season();'));
const OW = w => O.wk[w] || { md: {}, cups: [], eu: [], ties: 0 };
check('legacy season: old breaks (no league in weeks 10 and 28)', !Object.keys(OW(10).md).length && !Object.keys(OW(28).md).length);
check('legacy season: league plays in 36 and 37 as before', Object.keys(OW(36).md).length > 0 && Object.keys(OW(37).md).length > 0);
check('legacy season: cup round 2 in week 7, every final in week 47',
    Object.values(O.cups).every(c => c.winner && c.weeks.length && c.weeks[c.weeks.length - 1].startsWith('47:')) && O.cups.beker.weeks.some(s => s.startsWith('7:')));
const oMd = Object.keys(O.wk).map(Number).filter(w => OW(w).eu.some(e => e.startsWith('_playMatchday'))).sort((a, b) => a - b);
check('legacy season: Europe on its old weeks (MD1 week 11, R16 37)', oMd.join() === '11,16,17,19,22,24,29,31' && OW(37).eu.some(e => e.startsWith('_r16Leg1')), oMd.join());
check('legacy season: every league completed', Object.values(O.done).every(Boolean));
check('...and the next season is back on the new calendar', run('return GameState.league.legacyCalendar;') == null || run('return !!GameState.league.legacyCalendar;') === false);

console.log('\n-- morale --');
check('no "didn\'t play" penalty in a break week (11), but there is in week 10', run('return MORALE.benchExempt(11) && !MORALE.benchExempt(10) && MORALE.benchExempt(50);') === true);

console.log(failed ? '\n*** FAIL ***' : '\nAll calendar checks passed.');
process.exit(failed ? 1 : 0);
