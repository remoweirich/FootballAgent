// The Americas (js/intl-americas.js, docs/international.md "The Americas"): CONMEBOL + CONCACAF
// qualifiers, CONCACAF Nations League, Gold Cup, Copa América, Finalissima, friendlies and the
// reputation drift. Strict mode: any failed engine assertion (a wrong match count in a slot, a team
// twice in one slot, a 15-team Copa) throws.
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

run(`Internationals.STRICT = true; Clubs.init(); GameState.startNewGame('England','Am','A'); GameState.save = function () {};
    __fresh = function (y, w, seed) { GameState.intl = null; GameState.seasonStartYear = y; GameState.week = w; Rng.seed(seed || 777); };
    __to = function (y, w) { while (GameState.seasonStartYear * 100 + GameState.week < y * 100 + w) {
        if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++; Internationals.sync(); } };
    __am = {}; var rec = Internationals._record;
    Internationals._record = function (fx, o) { var r = rec.apply(this, arguments); if (fx.c && fx.c !== 'INTL_FRIENDLY' && !this.UEFA_COUNTED[fx.c] && !this.CAF_COMPS[fx.c] && !this.AO_COMPS[fx.c]) { var k = this._year + ':' + fx.w + fx.s; __am[k] = (__am[k] || 0) + 1; } return r; };`);

// ---------------- data ----------------
console.log('-- nations --');
const d = JSON.parse(run(`var c = function (x) { return NATIONS.filter(function (n) { return n.confederation === x; }); };
    return JSON.stringify({ cm: c('CONMEBOL').length, cc: c('CONCACAF').length, ccFifa: c('CONCACAF').filter(function (n) { return n.fifaMember !== false; }).length,
        first: [].concat(INTL_CONFIG.CNL_FIRST.seeds, [].concat.apply([], INTL_CONFIG.CNL_FIRST.A), [].concat.apply([], INTL_CONFIG.CNL_FIRST.B), [].concat.apply([], INTL_CONFIG.CNL_FIRST.C)) });`));
check('10 CONMEBOL nations, 41 CONCACAF (35 FIFA + 6)', d.cm === 10 && d.cc === 41 && d.ccFifa === 35);
check('the first Nations League places all 41, each once, all known ids', d.first.length === 41 && new Set(d.first).size === 41 && JSON.parse(run(`return JSON.stringify(${JSON.stringify(d.first)}.every(function (id) { return !!NATIONS_BY_ID[id]; }));`)));

// ---------------- drift ----------------
console.log('\n-- reputation drift --');
const dr = JSON.parse(run(`__fresh(2026, 0, 5); Internationals.sync();
    var bad = [], at26 = true, period = 0, n = 0;
    NATIONS.forEach(function (x) {
        if (Internationals.repAt(x.id, 2026) !== x.reputation) at26 = false;
        for (var y = 2026; y <= 2060; y++) { var r = Internationals.repAt(x.id, y); if (r < x.reputation - x.var - 1e-9 || r > Math.min(x.reputation + x.var, INTL_CONFIG.REP_CAP) + 1e-9) bad.push(x.id + '@' + y + '=' + r); }
        n++; if (Math.abs(Internationals.repAt(x.id, 2031) - Internationals.repAt(x.id, 2041)) <= 2 * INTL_CONFIG.DRIFT_NOISE + 0.11) period++;
    });
    var moved = NATIONS.filter(function (x) { return Math.abs(Internationals.repAt(x.id, 2031) - x.reputation) >= 1; }).length;
    return JSON.stringify({ at26: at26, bad: bad.slice(0, 3), period: period, n: n, moved: moved });`));
check('every nation starts 2026-27 exactly at its std reputation', dr.at26);
check('the drift never leaves std +- var (capped at REP_CAP, 86) in 35 years', dr.bad.length === 0, dr.bad.join(', '));
check(`a 10-year wave: every nation is back where it was ten years later (+- noise) (${dr.period}/${dr.n})`, dr.period === dr.n);
check(`...and nations really move (${dr.moved} of ${dr.n} are 1+ off their std in 2031)`, dr.moved > 50);

// ---------------- 22 seasons ----------------
console.log('\n-- 22 seasons --');
run(`__fresh(2026, 0, 2026); __am = {};`);
const seasons = [];
for (let y = 2026; y < 2048; y++) {
    run(`__to(${y + 1}, 2);`);
    seasons.push(JSON.parse(run(`
        var I = GameState.intl, S = I.seasons[${y}], A = I.am, out = { y: ${y}, pos: Internationals.cyclePos(${y}) };
        if (S.am.cnl) {
            var N = S.am.cnl, all = function (L) { return L.groups.reduce(function (a, g) { return a.concat(g.teams); }, []); };
            out.cnlSizes = [all(N.A).length + N.seeds.length, all(N.B).length, all(N.C).length];
            out.cnlNext = [A.cnl.leagues.A.length, A.cnl.leagues.B.length, A.cnl.leagues.C.length, new Set(A.cnl.leagues.A.concat(A.cnl.leagues.B, A.cnl.leagues.C)).size];
            out.cnlWinners = [N.A.winner, N.B.winner, N.C.winner].every(Boolean);
            var bal = true; ['A', 'B', 'C'].forEach(function (L) { N[L].groups.forEach(function (g) { g.teams.forEach(function (t) {
                var h = g.fx.filter(function (f) { return f.h === t; }).length, a = g.fx.filter(function (f) { return f.a === t; }).length; if (Math.abs(h - a) > 1) bal = false; }); }); });
            out.cnlBalanced = bal;
            var G = S.am.gold; out.gold = G.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []);
            out.goldWinner = G.tour.winner;
        }
        if (S.am.copa) {
            var P = S.am.copa; out.copa = P.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []);
            out.copaCc = out.copa.filter(function (id) { return Internationals.conf(id) === 'CONCACAF'; }).length;
            out.copaGroupsOk = P.tour.groups.every(function (g) { return g.teams.filter(function (id) { return Internationals.conf(id) === 'CONCACAF'; }).length <= 2; });
            out.copaWinner = P.tour.winner; out.playin = P.playin.length; out.fromGold = P.fromGold;
            out.copaPensOnly = ['qf', 'sf'].every(function (k) { return (P.tour.ko[k] || []).every(function (m) { return !m.et; }); }) && !(P.tour.ko.third && P.tour.ko.third.et);
        }
        if (S.type === 'WORLD_CUP') {
            var t = S.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []), by = {};
            t.forEach(function (id) { var c = Internationals.conf(id); by[c] = (by[c] || 0) + 1; });
            out.wc = by; out.wcSize = t.length;
            var cyc = A.cycles['WC-' + (${y} + 1)];
            if (cyc) {
                var cm = cyc.cm, home = {}, away = {}, run3 = false;
                cm.teams.forEach(function (x) { home[x] = cm.fx.filter(function (f) { return f.h === x; }).length; away[x] = cm.fx.filter(function (f) { return f.a === x; }).length;
                    var seq = cm.fx.filter(function (f) { return f.h === x || f.a === x; }).sort(function (p, q) { return p.md - q.md; }).map(function (f) { return f.h === x; });
                    for (var i = 2; i < seq.length; i++) if (seq[i] === seq[i - 1] && seq[i] === seq[i - 2]) run3 = true; });
                out.cmq = { n: cm.teams.length, played: cm.fx.filter(function (f) { return f.hg != null; }).length, nineNine: cm.teams.every(function (x) { return home[x] === 9 && away[x] === 9; }), run3: run3, direct: cm.result.direct.length, hosts: cm.hosts.length };
                var cc = cyc.cc;
                out.ccq = { field: cc.field.length, r1: cc.r1.length, r2: cc.r2.groups.reduce(function (a, g) { return a + g.teams.length; }, 0), r3: cc.r3.groups.reduce(function (a, g) { return a + g.teams.length; }, 0), direct: cc.result.direct.length, hosts: cc.hosts.length,
                    r2bal: cc.r2.groups.every(function (g) { return g.teams.every(function (x) { return g.fx.filter(function (f) { return f.h === x; }).length === 2 && g.fx.filter(function (f) { return f.a === x; }).length === 2; }); }) };
            }
        }
        out.friendlies = (S.am.fr || []).length;
        return JSON.stringify(out);`)));
}
const nl = seasons.filter(s => s.cnlSizes), eu = seasons.filter(s => s.copa), wc = seasons.filter(s => s.wc);
check(`${nl.length} CONCACAF Nations Leagues: 16/16/9, after promotion too, 41 different nations, every league has a winner`,
    nl.every(s => s.cnlSizes.join() === '16,16,9' && s.cnlNext.join() === '16,16,9,41' && s.cnlWinners), JSON.stringify(nl.map(s => [s.y, s.cnlSizes, s.cnlNext])));
check('...every group balanced home and away (+-0, or +-1 for odd counts)', nl.every(s => s.cnlBalanced));
check(`${nl.length} Gold Cups: 16 different teams, a winner`, nl.every(s => s.gold.length === 16 && new Set(s.gold).size === 16 && s.goldWinner));
check(`${eu.length} Copas: 16 different teams, 10 CONMEBOL + 6 CONCACAF, at most 2 CONCACAF per group`, eu.every(s => s.copa.length === 16 && new Set(s.copa).size === 16 && s.copaCc === 6 && s.copaGroupsOk));
check('...the Copa play-in has 1 or 2 ties whenever a Gold Cup fed it', eu.every(s => !s.fromGold || (s.playin >= 1 && s.playin <= 2)), JSON.stringify(eu.map(s => [s.y, s.playin, s.fromGold])));
check('...Copa quarter-finals, semi-finals and third place go straight to penalties (no extra time)', eu.every(s => s.copaPensOnly));
const wcFull = wc.filter(s => s.cmq);
check(`${wc.length} World Cups: 48 teams, UEFA 16, CONMEBOL 6, CONCACAF 6, AFC 8, CAF 9, OFC 1 (+ the 2 play-off winners in theirs)`,
    wc.every(s => s.wcSize === 48 && s.wc.UEFA === 16 && s.wc.CONMEBOL + s.wc.CONCACAF + s.wc.AFC + s.wc.CAF + s.wc.OFC === 32), JSON.stringify(wc.map(s => [s.y + 1, s.wc])));
check(`${wcFull.length} CONMEBOL qualifying campaigns: 10 teams, all 90 matches, 9 home + 9 away each, never 3 home or away in a row`,
    wcFull.every(s => s.cmq.n === 10 && s.cmq.played === 90 && s.cmq.nineNine && !s.cmq.run3), JSON.stringify(wcFull.map(s => s.cmq)));
check('...direct places = 6 - hosts (2030: 3 hosts -> 3)', wcFull.every(s => s.cmq.direct === 6 - s.cmq.hosts));
check(`${wcFull.length} CONCACAF qualifying campaigns: 35 - H enter, R2 always 30 (2 home + 2 away each), R3 12, direct 6 - H`,
    wcFull.every(s => s.ccq.field === 35 - s.ccq.hosts && s.ccq.r2 === 30 && s.ccq.r2bal && s.ccq.r3 === 12 && s.ccq.direct === 6 - s.ccq.hosts), JSON.stringify(wcFull.map(s => s.ccq)));
check(`friendlies every season (${seasons.map(s => s.friendlies).join(', ')})`, seasons.every(s => s.friendlies > 30));
check('no warnings in 22 seasons', run('return JSON.stringify(GameState.intl.warnings);') === '[]', run('return JSON.stringify(GameState.intl.warnings);'));

// the per-slot totals of section 11 (Americas competitions only), for the 2026-30 cycle
const am = JSON.parse(run('return JSON.stringify(__am);'));
const slot = (y, w) => am[y + ':' + w] || 0;
check('NL season after a WC (2026-27): 17 in 11A/12A/12B/17A, 15 in 18A/18B, 14 in 36A/37A',
    [slot(2026, '11A'), slot(2026, '12A'), slot(2026, '12B'), slot(2026, '17A'), slot(2026, '18A'), slot(2026, '18B'), slot(2026, '36A'), slot(2026, '37A')].join() === '17,17,17,17,15,15,14,14',
    [slot(2026, '11A'), slot(2026, '12A'), slot(2026, '12B'), slot(2026, '17A'), slot(2026, '18A'), slot(2026, '18B'), slot(2026, '36A'), slot(2026, '37A')].join());
check('EURO season (2027-28): 10, 10, then 17 x 5, then 5 + the Copa play-in in 37A',
    [slot(2027, '11A'), slot(2027, '12A'), slot(2027, '12B'), slot(2027, '17A'), slot(2027, '18A'), slot(2027, '18B'), slot(2027, '36A')].join() === '10,10,17,17,17,17,17' && [6, 7].includes(slot(2027, '37A')),
    [slot(2027, '11A'), slot(2027, '12A'), slot(2027, '12B'), slot(2027, '17A'), slot(2027, '18A'), slot(2027, '18B'), slot(2027, '36A'), slot(2027, '37A')].join());
check('NL season before a WC (2028-29): 22 x 4, 20 x 2, 19 x 2',
    [slot(2028, '11A'), slot(2028, '12A'), slot(2028, '12B'), slot(2028, '17A'), slot(2028, '18A'), slot(2028, '18B'), slot(2028, '36A'), slot(2028, '37A')].join() === '22,22,22,22,20,20,19,19',
    [slot(2028, '11A'), slot(2028, '12A'), slot(2028, '12B'), slot(2028, '17A'), slot(2028, '18A'), slot(2028, '18B'), slot(2028, '36A'), slot(2028, '37A')].join());
check('WC season (2029-30): 11, 11, then 6 x 4', [slot(2029, '11A'), slot(2029, '12A'), slot(2029, '12B'), slot(2029, '17A'), slot(2029, '18A'), slot(2029, '18B')].join() === '11,11,6,6,6,6');
check('tournament windows: Gold Cup 31, Copa 32, Finalissima 1', (() => {
    // weeks 1-2 of the next season belong to this season's tournament (recorded under this season)
    const t = y => [49, 50, 51, 52, 1, 2].reduce((a, w) => a + slot(y, w + 'A') + slot(y, w + 'B'), 0);
    return t(2026) === 31 && t(2027) === 32 && t(2028) === 32;   // 2028-29: Gold Cup 31 + Finalissima 1 (week 50B)
})());

// ---------------- forced host scenarios ----------------
console.log('\n-- host scenarios --');
const scen = [[['arg', 'bra'], 2, 0], [[], 0, 0], [['col'], 1, 0], [['usa'], 0, 1], [['usa', 'mex'], 0, 2], [['arg', 'can'], 1, 1]];
for (const [hosts, hcm, hcc] of scen) {
    const r = JSON.parse(run(`
        INTL_CONFIG.HOSTS['WC-2038'] = { hosts: ${JSON.stringify(hosts)} };
        __fresh(2035, 0, ${11 + hosts.length}); __to(2038, 2);
        var I = GameState.intl, S = I.seasons[2037], cyc = I.am.cycles['WC-2038'];
        var t = S.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []), by = {};
        t.forEach(function (id) { var c = Internationals.conf(id); by[c] = (by[c] || 0) + 1; });
        delete INTL_CONFIG.HOSTS['WC-2038'];
        return JSON.stringify({ n: t.length, by: by, cmDirect: cyc.cm.result.direct.length, ccField: cyc.cc.field.length, ccDirect: cyc.cc.result.direct.length, ccHostsIn: cyc.cc.field.filter(function (x) { return ${JSON.stringify(hosts)}.indexOf(x) >= 0; }).length, r2: cyc.cc.r2.groups.reduce(function (a, g) { return a + g.teams.length; }, 0) });`));
    check(`WC 2038 hosted by ${hosts.join('+') || 'nobody from the Americas'}: CONMEBOL H=${hcm}, CONCACAF H=${hcc} -> 48 teams, direct ${6 - hcm}/${6 - hcc}, ${35 - hcc} enter CONCACAF qualifying (hosts sit out), R2 30`,
        r.n === 48 && r.cmDirect === 6 - hcm && r.ccDirect === 6 - hcc && r.ccField === 35 - hcc && r.ccHostsIn === 0 && r.r2 === 30, JSON.stringify(r));
}
check('CONMEBOL H=3: 2030 (Argentina, Uruguay, Paraguay) -> 3 direct', wcFull.some(s => s.y === 2029 && s.cmq.hosts === 3 && s.cmq.direct === 3));
// Copa hosts: CONMEBOL; CONCACAF and a Gold Cup semi-finalist; CONCACAF and not
const copa = (hostFn, seed) => JSON.parse(run(`
    __fresh(2030, 0, ${seed}); __to(2031, 2);
    var G = GameState.intl.am.lastGold, host = (${hostFn})(G);
    INTL_CONFIG.HOSTS['COPA-2032'] = { hosts: [host] };
    __to(2032, 2);
    var P = GameState.intl.seasons[2031].am.copa, t = P.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []);
    delete INTL_CONFIG.HOSTS['COPA-2032'];
    return JSON.stringify({ host: host, semi: G.semis.indexOf(host) >= 0, n: t.length, inIt: t.indexOf(host) >= 0, playin: P.playin.length, a1: P.tour.groups[0].teams[0] === host,
        cc: t.filter(function (id) { return Internationals.conf(id) === 'CONCACAF'; }).length });`));
const c1 = copa("function () { return 'chi'; }", 41);
check('Copa hosted by a CONMEBOL nation: 16 teams, host in A1, 2 play-in ties (only the 4 semi-finalists go straight in)', c1.n === 16 && c1.inIt && c1.a1 && c1.playin === 2 && c1.cc === 6, JSON.stringify(c1));
const c2 = copa('function (G) { return G.semis[0]; }', 42);
check('Copa hosted by a CONCACAF Gold Cup semi-finalist: still 2 play-in ties', c2.semi && c2.n === 16 && c2.a1 && c2.playin === 2 && c2.cc === 6, JSON.stringify(c2));
const c3 = copa("function (G) { var x = ['crc', 'pan', 'jam', 'hon', 'can', 'mex', 'usa'].filter(function (id) { return G.semis.indexOf(id) < 0; })[0]; return x; }", 43);
check('Copa hosted by a CONCACAF nation outside the semi-finals: host + 4 semi-finalists, 1 play-in tie', !c3.semi && c3.n === 16 && c3.inIt && c3.a1 && c3.playin === 1 && c3.cc === 6, JSON.stringify(c3));

// ---------------- existing saves ----------------
console.log('\n-- existing saves --');
const mig = JSON.parse(run(`
    __fresh(2027, 0, 99); __to(2027, 15);
    var I = GameState.intl;
    // a save from before the Americas: European state only
    delete I.am; Object.keys(I.seasons).forEach(function (y) { delete I.seasons[y].am; });
    var mails = GameState.inbox.length;
    GameState._migrateAmericas();
    var S = I.seasons[2027], cyc = I.am && I.am.cycles['WC-2030'];
    return JSON.stringify({ has: !!I.am, cmPlayed: cyc ? cyc.cm.fx.filter(function (f) { return f.hg != null; }).length : -1,
        r1: cyc ? cyc.cc.r1.every(function (t) { return t.winner; }) : false, fr: (S.am && S.am.fr || []).length, mails: GameState.inbox.length - mails, prev: !!(I.seasons[2026] && I.seasons[2026].am), last: I.am.last });`));
check('a 2027-28 save from week 15 gets this season\'s Americas: CONMEBOL MD1-3 played, CONCACAF R1 decided', mig.has && mig.cmPlayed === 15 && mig.r1, JSON.stringify(mig));
check('...silently, without backfilled friendlies, without last season\'s competitions', mig.fr === 0 && mig.mails === 0 && !mig.prev);
const next = JSON.parse(run(`__to(2027, 18); var S = GameState.intl.seasons[2027]; return JSON.stringify({ fr: (S.am.fr || []).length, warn: GameState.intl.warnings });`));
check('...and carries on from there (friendlies from the next live week, no warnings)', next.fr > 0 && next.warn.length === 0, JSON.stringify(next));
check('the save schema moved on (9)', run('return GameState.SCHEMA_VERSION;') >= 9);
const kb = run(`return Math.round(JSON.stringify(GameState.intl).length / 1024);`);
check(`the international state stays small (${kb} KB)`, kb < 160);

console.log(failed ? '\n*** FAIL ***' : '\nAll Americas checks passed.');
process.exit(failed ? 1 : 0);
