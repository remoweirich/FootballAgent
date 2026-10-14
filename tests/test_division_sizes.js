// League sizes across a season change (js/league.js promotion/relegation, js/simulation.js
// _repairDivisionSizes): a season whose play-offs never happen still promotes and relegates the
// right numbers (the next club in the table takes a missing play-off winner's place), and a save
// that has already drifted is evened out at the next season change. Spain, Italy, Switzerland and a
// created country are the ones that used to drift.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const noop = () => {};
const sb = { console: { log: noop, warn: noop, error: noop }, Math, Date, JSON, setTimeout: () => 0, clearTimeout: noop,
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, document: { addEventListener: noop, getElementById: () => null, querySelector: () => null },
    addEventListener: noop, UI: { money: String, esc: String, euro: String } };
sb.window = sb; vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb);
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

run(`Clubs.init();
    var cc = WorldExt.makeSkeleton('Austria', true);
    cc.regions = [0, 1, 2, 3, 4, 5].map(function (i) { return { id: 'CUS:Austria:r' + (i + 1), name: 'Region ' + (i + 1), clubIds: [cc.clubs[i].id, cc.clubs[i + 10].id] }; });
    GameState.startNewGame('Spain', 'S', 'A', { id: 'dbt', name: 'T', overrides: {}, competitions: {}, countries: { Austria: cc } }); GameState.save = function () {};
    __bad = function () { var s = {}; Object.values(COUNTRY_DIVS).forEach(function (d) { d.forEach(function (x) { var e = Clubs.staticDivSize(x), a = Clubs.getClubsByDivision(x).length; if (e != null && a !== e) s[x] = a + '/' + e; }); }); return s; };`);
// 1. a season in which no play-off is played (as if week 46 broke): sizes still hold
const skip = JSON.parse(run(`var y = GameState.seasonStartYear, mails = GameState.inbox.length;
    while (GameState.seasonStartYear === y) { if (GameState.week === 45) GameState.league.playoffs._done = true; Sim.advanceWeek(); }
    var dev = GameState.inbox.slice(0, GameState.inbox.length - mails).filter(function (m) { return /division size/.test(m.subject); }).length;
    return JSON.stringify({ bad: __bad(), dev: dev });`));
check('no play-offs at all in a season: every league is still the right size (Spain, Italy, Switzerland, the created country)', Object.keys(skip.bad).length === 0 && skip.dev === 0, JSON.stringify(skip));
// 2. a play-off function that throws: the other countries still play theirs
const thr = JSON.parse(run(`var L, orig = League.playPlayoffsSpain;
    while (GameState.week < 45) Sim.advanceWeek();
    League.playPlayoffsSpain = function () { throw new Error('boom'); };
    try { Sim.advanceWeek(); } catch (e) { League.playPlayoffsSpain = orig; return JSON.stringify({ threw: e.message }); }
    League.playPlayoffsSpain = orig; L = GameState.league;
    return JSON.stringify({ week: GameState.week, italy: !!(L.playoffs.SerieB && L.playoffs.SerieB.winner), custom: Object.keys(L.playoffs).some(function (k) { return /CUS:Austria/.test(k) && L.playoffs[k] && L.playoffs[k].winner; }), done: L.playoffs._done,
        mail: GameState.inbox.some(function (m) { return /playPlayoffsSpain failed/.test(m.subject); }) });`));
check('one country\'s play-offs failing no longer skips the others (Italy and the created country still play; a dev mail says which failed)', !thr.threw && thr.italy && thr.custom && thr.done && thr.mail, JSON.stringify(thr));
// 3. a save that has already drifted is evened out at the next season change
const fix = JSON.parse(run(`Clubs.setDivision(Clubs.getClubsByDivision('LaLiga')[5].id, 'Segunda');
    Clubs.setDivision(Clubs.getClubsByDivision('SerieA')[3].id, 'SerieB'); Clubs.setDivision(Clubs.getClubsByDivision('SerieB')[4].id, 'SerieC');
    Clubs.setDivision(Clubs.getClubsByDivision('CUS:Austria:1')[2].id, 'CUS:Austria:4');
    var before = __bad(), y = GameState.seasonStartYear;
    while (GameState.seasonStartYear === y) Sim.advanceWeek();
    return JSON.stringify({ before: before, after: __bad() });`));
check('a drifted save (the reported La Liga 19 / Segunda 21, Serie A 19, Austria 19 / 21) is back to the right sizes after the next season change',
    Object.keys(fix.before).length >= 4 && Object.keys(fix.after).length === 0, JSON.stringify(fix));

console.log(failed ? '\n*** FAIL ***' : '\nAll division size checks passed.');
process.exit(failed ? 1 : 0);
