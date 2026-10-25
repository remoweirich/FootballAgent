// Club reputation from honours (js/league.js applyHonoursRep): league titles (favourite: nothing; else +1,
// outside the country's favourites +2 with the 2nd point temporary; the worst flop pays), lower divisions
// (title +1, promotion +1, surprise promotion +1 temporary), main cups (+1 for 3 seasons,
// nobody pays), Europe (beat the seeding by 8+ in the knockout rounds +1, miss it by 8+ -1, final +1,
// win +2/+1/+1 on top), results-based fading, the 90 ceiling and the ±10 window.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const noop = () => {};
const errors = [];
const sb = { console: { log: noop, warn: noop, error: (...a) => errors.push(a.join(' ')) }, Math, Date, JSON, setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    indexedDB: undefined, localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, document: { addEventListener: noop, getElementById: () => null, querySelector: () => null },
    addEventListener: noop, removeEventListener: noop, UI: { money: String, esc: String, euro: String } };
sb.window = sb; vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb);
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

// a fresh world; each scenario resets reputations, writes a top-division table in a chosen order and
// hands the rollover step only what it needs (no cups or Europe unless the scenario adds them)
run(`Rng.seed(5); Clubs.init(); GameState.startNewGame('Switzerland','H','A'); GameState.save = function () {};
    __start = {}; Clubs.allClubs.forEach(function (c) { __start[c.id] = [c.reputation, c.division]; });
    __reset = function () { Clubs.allClubs.forEach(function (c) { var s = __start[c.id]; if (c.division !== s[1]) Clubs.setDivision(c.id, s[1]); c.reputation = s[0]; c.anchorRep = s[0]; c.baseRep = s[0]; c.repTemp = []; }); };
    __div = COUNTRY_DIVS.Switzerland[0];
    __byRep = function () { return Clubs.getClubsByDivision(__div).map(function (c) { return c.id; }).sort(function (a, b) { return Clubs.getClubById(b).reputation - Clubs.getClubById(a).reputation; }); };
    __season = function (order) {   // order: the final top-division table, best first; everyone else as expected
        var L = GameState.league, pre = {}; Clubs.allClubs.forEach(function (c) { pre[c.id] = c.reputation; });
        L.preRep = pre;
        Object.keys(L.tables).forEach(function (d) { var ids = Clubs.getClubsByDivision(d).map(function (c) { return c.id; }).sort(function (a, b) { return pre[b] - pre[a]; });
            if (d === __div && order) ids = order.concat(ids.filter(function (x) { return order.indexOf(x) < 0; }));
            L.tables[d] = ids.map(function (id, k) { return { clubId: id, Pts: 300 - k, GF: 0, GA: 0 }; }); });
        TOP_TIER_CUPS.forEach(function (k) { if (L[k]) L[k].winner = null; }); L.customCups = {}; L.europe = null;
        return League.applyHonoursRep();
    };
    __rep = function (id) { return Clubs.getClubById(id).anchorRep; };`);

// ---------------- league titles ----------------
const ud = JSON.parse(run(`__reset(); var r = __byRep();
    r.slice(0, 5).forEach(function (id, i) { var c = Clubs.getClubById(id); c.reputation = c.anchorRep = c.baseRep = 80 - 2 * i; });   // distinct, so the 4th is 4th
    var log = __season([r[3]]); var e = log.find(function (x) { return x.kind === 'title' && x.country === 'Switzerland'; });
    return JSON.stringify({ rank: e && e.rank, amount: e && e.amount, U: League.HONOURS.underdog });`));
console.log('-- league titles --');
const t1 = JSON.parse(run(`__reset(); var r = __byRep(); var log = __season(null);
    return JSON.stringify({ titles: log.filter(function (e) { return e.kind === 'title' && e.country === 'Switzerland'; }).length, top: __rep(r[0]) - __start[r[0]][0] });`));
check('the favourite winning the league changes nothing', t1.titles === 0 && t1.top === 0, JSON.stringify(t1));
const t2 = JSON.parse(run(`__reset(); var r = __byRep(); var champ = r[2];
    var log = __season([champ, r[0], r[1]]); var e = log.find(function (x) { return x.kind === 'title' && x.country === 'Switzerland'; });
    return JSON.stringify({ e: e, champ: __rep(champ) - __start[champ][0], flop: e && e.flop ? __rep(e.flop) - __start[e.flop][0] : null });`));
check('the 3rd favourite winning: +1, taken from the worst flop', t2.e && t2.e.amount === 1 && t2.champ === 1 && t2.flop === -1, JSON.stringify(t2));
const t3 = JSON.parse(run(`__reset(); var r = __byRep(); var champ = r[7];
    var log = __season([champ]); var e = log.find(function (x) { return x.kind === 'title' && x.country === 'Switzerland'; });
    var c = Clubs.getClubById(champ), after1 = __rep(champ) - __start[champ][0], temp = (c.repTemp || []).length;
    GameState.seasonStartYear += 1; __season(null); GameState.seasonStartYear += 1; __season(null);   // two more seasons, as expected
    var after3 = __rep(champ) - __start[champ][0], tempLeft = (c.repTemp || []).length;
    return JSON.stringify({ amount: e && e.amount, after1: after1, temp: temp, after3: after3, tempLeft: tempLeft });`));
check('a champion from outside the top 3 (Switzerland): +2, the 2nd point temporary', t3.amount === 2 && t3.after1 === 2 && t3.temp === 1, JSON.stringify(t3));
check('...the temporary point is gone after 2 seasons (and the first fades if he falls back)', t3.tempLeft === 0 && t3.after3 <= 1, JSON.stringify(t3));
const tie = JSON.parse(run(`__reset(); var r = __byRep(); var a = Clubs.getClubById(r[0]), b = Clubs.getClubById(r[1]); b.reputation = a.reputation; b.anchorRep = b.reputation; b.baseRep = b.reputation;
    var log = __season([b.id]); return JSON.stringify({ titles: log.filter(function (e) { return e.kind === 'title' && e.country === 'Switzerland'; }).length });`));
check('two clubs level on reputation are both favourites (the other one winning is no surprise)', tie.titles === 0, JSON.stringify(tie));

// ---------------- fading ----------------
const fade = JSON.parse(run(`__reset(); var r = __byRep(); var c = Clubs.getClubById(r[5]); c.anchorRep = c.baseRep + 3; c.reputation = c.anchorRep;
    var pre = __rep(c.id); __season(r.slice(0, 5).concat(r.slice(6), [c.id])); var down = pre - __rep(c.id);   // finished last: below expectation
    c.anchorRep = c.baseRep + 3; c.reputation = c.anchorRep; var pre2 = __rep(c.id); __season([c.id].concat(r.filter(function (x) { return x !== c.id; }))); var held = __rep(c.id) - pre2;
    var d = Clubs.getClubById(r[3]); d.anchorRep = d.baseRep - 3; d.reputation = d.anchorRep; var pre3 = __rep(d.id); __season(null); var up = __rep(d.id) - pre3;
    return JSON.stringify({ down: down, held: held, up: up });`));
check('fading: above its start and finishing below expectation drops 1; living up to it keeps it; below its start and doing well recovers 1', fade.down === 1 && fade.held >= 0 && fade.up === 1, JSON.stringify(fade));

// ---------------- cups ----------------
const cup = JSON.parse(run(`__reset(); var r = __byRep(); var L = GameState.league;
    // (not the division favourite, who would also collect the lower-division title point)
    var surprise = Clubs.allClubs.filter(function (c) { return c.country === 'Switzerland' && c.tier === 2; }).sort(function (a, b) { return a.reputation - b.reputation; })[0];
    var pre = {}; Clubs.allClubs.forEach(function (c) { pre[c.id] = c.reputation; }); L.preRep = pre;
    Object.keys(L.tables).forEach(function (d) { L.tables[d] = Clubs.getClubsByDivision(d).map(function (c) { return c.id; }).sort(function (a, b) { return pre[b] - pre[a]; }).map(function (id, k) { return { clubId: id, Pts: 300 - k, GF: 0, GA: 0 }; }); });
    L.europe = null; L.customCups = {}; TOP_TIER_CUPS.forEach(function (k) { if (L[k]) L[k].winner = null; });
    L.schwcup = L.schwcup || {}; L.schwcup.winner = surprise.id;
    var losers = Clubs.allClubs.filter(function (c) { return c.country === 'Switzerland'; }).map(function (c) { return [c.id, c.anchorRep]; });
    League.applyHonoursRep();
    var gain = __rep(surprise.id) - __start[surprise.id][0], temps = surprise.repTemp.map(function (t) { return t.until - GameState.seasonStartYear; });
    var lost = losers.filter(function (x) { return x[0] !== surprise.id && __rep(x[0]) < x[1]; }).length;
    L.schwcup.winner = r[0]; var before = __rep(r[0]); League.applyHonoursRep(); var fav = __rep(r[0]) - before;
    return JSON.stringify({ gain: gain, temps: temps, lost: lost, fav: fav });`));
check('a cup winner outside the 4 favourites: +1 for 3 seasons, and nobody loses anything', cup.gain === 1 && cup.temps.join() === '3' && cup.lost === 0, JSON.stringify(cup));
check('the favourite winning the cup changes nothing', cup.fav === 0, JSON.stringify(cup));

// ---------------- Europe ----------------
console.log('\n-- Europe --');
const eu = JSON.parse(run(`__reset();
    // 36 game clubs from around Europe, seeded by reputation (1 = highest)
    // (clubs below the 90 ceiling, so every gain can show)
    var ids = Clubs.allClubs.filter(function (c) { return c.tier === 1 && c.reputation < 84; }).sort(function (a, b) { return b.reputation - a.reputation; }).slice(0, 36).map(function (c) { return c.id; });
    var seedOf = function (k) { return ids[k - 1]; };
    // stages: 7 winner, 6 final, 5 SF, 4 QF, 3 R16, 2 knockout play-off, 1 league phase out
    var stage = {}; ids.forEach(function (id, i) { stage[id] = i < 8 ? 4 : i < 16 ? 3 : i < 24 ? 2 : 1; });
    stage[seedOf(1)] = 3;     // the top seed out in the last 16: finishes 9th-16th -> more than 8 below? (no: within 8 of 1st is 9th)
    stage[seedOf(2)] = 2;     // seed 2 out in the knockout play-off: finishes 17th+ -> -1
    stage[seedOf(33)] = 2;    // seed 33 reaches the knockout play-off (finishes ~24th) -> +1
    stage[seedOf(36)] = 1;    // seed 36 finishes 25th in the league phase -> nothing
    stage[seedOf(20)] = 7;    // seed 20 wins it: underdog +1, final +1, win +2 -> +4
    stage[seedOf(5)] = 6;     // seed 5 loses the final: +1
    var table = ids.map(function (id) { return { clubId: id }; });
    // league-phase order: by stage, and the 33rd seed tops the knockout play-off group (so he finishes 17th, as in a real 16-team play-off)
    var ranked = ids.slice().sort(function (a, b) { return stage[b] - stage[a] || (a === seedOf(33) ? -1 : b === seedOf(33) ? 1 : 0); });
    var mk = function (k) { return { table: table, ranked: ranked, ko: {} }; };
    var L = GameState.league, pre = {}; Clubs.allClubs.forEach(function (c) { pre[c.id] = c.reputation; }); L.preRep = pre;
    Object.keys(L.tables).forEach(function (d) { L.tables[d] = Clubs.getClubsByDivision(d).map(function (c) { return c.id; }).sort(function (a, b) { return pre[b] - pre[a]; }).map(function (id, k) { return { clubId: id, Pts: 300 - k, GF: 0, GA: 0 }; }); });
    TOP_TIER_CUPS.forEach(function (k) { if (L[k]) L[k].winner = null; }); L.customCups = {};
    L.europe = { comps: { UCL: mk(), UEL: null, UECL: null } };
    var real = Europe.bestStages; Europe.bestStages = function () { return { UCL: stage }; };
    var before = {}; ids.forEach(function (id) { before[id] = Clubs.getClubById(id).anchorRep; });
    League.applyHonoursRep(); Europe.bestStages = real;
    var d = function (k) { var id = seedOf(k); return Clubs.getClubById(id).anchorRep - before[id]; };
    return JSON.stringify({ s1: d(1), s2: d(2), s33: d(33), s36: d(36), s20: d(20), s5: d(5), b20: Clubs.getClubById(seedOf(20)).baseRep, a20: Clubs.getClubById(seedOf(20)).anchorRep });`));
check('seeded 2nd but out in the knockout play-off (more than 8 places short): -1', eu.s2 === -1, JSON.stringify(eu));
check('seeded 33rd and into the knockout play-off: +1; seeded 36th and 25th in the league phase: nothing', eu.s33 === 1 && eu.s36 === 0, JSON.stringify(eu));
check('a losing finalist seeded 5th: +1 (the final, regardless of expectations)', eu.s5 === 1, JSON.stringify(eu));
check('the Champions Cup won from 20th: +1 underdog, +1 final, +2 win = +4 (within the 90 ceiling and +10 window)', eu.s20 === Math.min(4, Math.min(90, eu.b20 + 10) - (eu.a20 - eu.s20)), JSON.stringify(eu));
const cap = JSON.parse(run(`__reset(); var c = Clubs.allClubs.filter(function (x) { return x.country === 'Switzerland'; }).sort(function (a, b) { return b.reputation - a.reputation; })[0];
    c.baseRep = 85; c.anchorRep = 89; c.reputation = 89; var got = League._honourNudge(c.id, 4);
    var d = Clubs.allClubs.filter(function (x) { return x.country === 'Switzerland'; })[3]; d.baseRep = 60; d.anchorRep = 69; d.reputation = 69; var w = League._honourNudge(d.id, 4);
    return JSON.stringify({ capTo: c.anchorRep, got: got, window: d.anchorRep, w: w });`));
check('gains stop at 90 and at +10 above where a club started', cap.capTo === 90 && cap.got === 1 && cap.window === 70 && cap.w === 1, JSON.stringify(cap));
check('the underdog line per country: England 7th+, Spain/NL/Switzerland/Portugal 4th+, Belgium/Italy 5th+, Germany/France 2nd+',
    JSON.stringify(ud.U) === JSON.stringify({ England: 6, Spain: 3, Netherlands: 3, Switzerland: 3, Germany: 1, France: 1, Portugal: 3, Belgium: 4, Italy: 4 }));
check('a Swiss champion rated 4th: +2 (outside the 3 favourites)', ud.rank === 4 && ud.amount === 2, JSON.stringify(ud));

// ---------------- lower divisions: title +1, promotion +1, surprise promotion +1 more ----------------
console.log('-- lower divisions --');
const pr = JSON.parse(run(`__reset(); var log = __season(null); var L = GameState.league, pre = L.preRep, div = 'ChallengeLeague';
    var champ = L.tables[div][0].clubId, lt = log.find(function (x) { return x.kind === 'lowerTitle' && x.div === div; });
    var rank = function (id) { return L.tables[div].filter(function (r) { return pre[r.clubId] > pre[id]; }).length + 1; };
    var ids = L.tables[div].map(function (r) { return r.clubId; });
    var normal = ids.find(function (id) { return id !== champ && rank(id) <= 5; }), surprise = ids.find(function (id) { return rank(id) >= 6; });
    var sl = L.tables.SuperLeagueCH.map(function (r) { return r.clubId; });   // in rating order
    var down = sl[0], downLow = sl[sl.length - 1];
    var b = {}; [champ, normal, surprise, down, downLow].forEach(function (id) { b[id] = __rep(id); });
    League._repDrift([champ, normal, surprise], [down, downLow]);
    return JSON.stringify({ lt: !!lt, champTotal: __rep(champ) - __start[champ][0], normal: __rep(normal) - b[normal], surprise: __rep(surprise) - b[surprise], sRank: rank(surprise),
        temp: (Clubs.getClubById(surprise).repTemp || []).map(function (t) { return t.amt + '/' + (t.until - GameState.seasonStartYear); }).join(), down: __rep(down) - b[down], downLow: __rep(downLow) - b[downLow],
        champLine: League._promoLast('CHAMP') + 4, clLine: League._promoLast('ChallengeLeague') + 4 });`));
check('a lower-division champion that goes up: +1 title +1 promotion = +2', pr.lt && pr.champTotal === 2, JSON.stringify(pr));
check('promoted but not champion: +1', pr.normal === 1, JSON.stringify(pr));
check('a surprise promotion (rated 6th or lower in the Challenge League): +2, the 2nd point temporary for 2 seasons', pr.surprise === 2 && pr.temp === '1/2', JSON.stringify(pr));
check('relegated from the top half of the ratings: -2; from the bottom half (expected down there): -1', pr.down === -2 && pr.downLow === -1, JSON.stringify(pr));
check('surprise line: 10th or lower in the Championship, 6th or lower in the Challenge League', pr.champLine === 10 && pr.clLine === 6, JSON.stringify(pr));
check('no engine errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
if (failed) process.exit(1);
