// International football (js/internationals.js, docs/international.md), section 11 of the plan:
// match counts per week, league-phase structure, league sizes, tournament totals, every host
// scenario over 20+ seasons, the save migration and the hook. Runs in STRICT mode, so any
// failed engine assertion (a wrong match count, a short play-off path, a 47-team World Cup)
// throws instead of only being logged.
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

run(`Internationals.STRICT = true; Rng.seed(424242); Clubs.init(); GameState.startNewGame('England','Intl','A'); GameState.save = function () {};
    // drive international football alone, week by week (no club simulation: fast, and isolates the engine)
    __to = function (y, w) {
        while (GameState.seasonStartYear * 100 + GameState.week < y * 100 + w) {
            if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++;
            Internationals.sync();
        }
    };
    __fresh = function (y, w) { GameState.intl = null; GameState.seasonStartYear = y; GameState.week = w; };
    __matches = 0; Internationals.onInternationalMatch = function () { __matches++; };`);

// ---------------- basics ----------------
console.log('-- nations and the season cycle --');
const basics = JSON.parse(run(`
    var u = NATIONS.filter(function (n) { return n.confederation === 'UEFA'; });
    return JSON.stringify({ uefa: u.length, ids: new Set(NATIONS.map(function (n) { return n.id; })).size === NATIONS.length,
        russia: NATIONS.some(function (n) { return /russia/i.test(n.name); }),
        types: [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map(function (y) { return Internationals.seasonType(y); }),
        keys: [2026, 2027, 2029, 2031, 2033].map(function (y) { return Internationals.tournamentKey(y); }),
        sizes: [2028, 2032, 2036].map(function (y) { return Internationals.euroSize(y); }),
        spelling: ['tur', 'cze', 'irl', 'bih'].map(function (id) { return NATIONS_BY_ID[id].name; }) });`));
check('54 UEFA nations, unique ids, no Russia', basics.uefa === 54 && basics.ids && !basics.russia);
check('season types follow the cycle', basics.types.join() === 'NATIONS_LEAGUE,EURO,NATIONS_LEAGUE,WORLD_CUP,NATIONS_LEAGUE,EURO,NATIONS_LEAGUE,WORLD_CUP', basics.types.join());
check('tournament keys', basics.keys.join() === ',EURO-2028,WC-2030,EURO-2032,WC-2034', basics.keys.join());
check('EURO: 24 teams in 2028, 32 from 2032', basics.sizes.join() === '24,32,32');
check('official spellings', basics.spelling.join() === 'Türkiye,Czechia,Republic of Ireland,Bosnia and Herzegovina');
const start = JSON.parse(run(`var I = GameState.intl; return JSON.stringify({ has: !!I, A: I.nlLeagues.A.slice(0, 3), C: I.nlLeagues.C.slice(-2), seeding: I.seeding.length });`));
check('a new 2026 game starts with Nations League leagues from reputation', start.has && start.A.join() === 'fra,esp,eng' && start.C.join() === 'gib,smr' && start.seeding === 54);

const brk = JSON.parse(run(`return JSON.stringify({ on: [11, 12, 17, 18, 36, 37].map(function (w) { return Internationals.isBreakWeek(2027, w); }),
    off: [1, 2, 10, 13, 35, 38, 49, 50, 51, 52].map(function (w) { return Internationals.isBreakWeek(2027, w); }), pre: Internationals.isBreakWeek(2025, 11) });`));
check('"International break" in weeks 11-12, 17-18, 36-37 only (not the tournament window), and not before 2026-27', brk.on.every(Boolean) && !brk.off.some(Boolean) && !brk.pre);
const NATION_SPREAD = run('return NATION_WEIGHT_SPREAD;');
check(`World Cup draw weights use the /${NATION_SPREAD} curve`, NATION_SPREAD === 5 && run("return NATIONS_BY_ID.arg.weight;") === Math.round(Math.exp((92 - 60) / 5) * 100) / 100);

check('matchdays: 1 in week 11, 2 in week 12, 1 in week 17, 2 in week 18', run(`return JSON.stringify(INTL_CONFIG.MATCHDAYS);`) === JSON.stringify([{ week: 11, slot: 'A' }, { week: 12, slot: 'A' }, { week: 12, slot: 'B' }, { week: 17, slot: 'A' }, { week: 18, slot: 'A' }, { week: 18, slot: 'B' }]));

// ---------------- 22 seasons, structure checked edition by edition ----------------
console.log('\n-- 22 seasons, every edition --');
const STRUCT = `
    __structNL = function (S) {
        var bad = [];
        ['A', 'B', 'C'].forEach(function (L) {
            var gs = S.leagues[L].groups, all = [];
            if (gs.length !== 3) bad.push(L + ' groups ' + gs.length);
            gs.forEach(function (g) {
                all = all.concat(g.teams);
                g.teams.forEach(function (id, slot) {
                    var mine = g.fx.filter(function (f) { return f.h === id || f.a === id; });
                    var home = mine.filter(function (f) { return f.h === id; }).length;
                    var rival = g.teams[slot % 2 === 0 ? slot + 1 : slot - 1];
                    var vsRival = mine.filter(function (f) { return f.h === rival || f.a === rival; }).length;
                    var potHome = [0, 0, 0], potAway = [0, 0, 0];
                    mine.forEach(function (f) { var o = f.h === id ? f.a : f.h, p = Math.floor(g.teams.indexOf(o) / 2); if (f.h === id) potHome[p]++; else potAway[p]++; });
                    if (mine.length !== 6 || home !== 3 || vsRival !== 2 || potHome.join() !== '1,1,1' || potAway.join() !== '1,1,1') bad.push(id + ' ' + mine.length + '/' + home + '/' + vsRival + '/' + potHome + '/' + potAway);
                });
            });
            if (new Set(all).size !== 18) bad.push(L + ' has ' + new Set(all).size + ' teams');
        });
        return bad;
    };
    __structQ = function (S) {
        var bad = [];
        S.l1.groups.forEach(function (g) {
            g.teams.forEach(function (id) {
                var mine = g.fx.filter(function (f) { return f.h === id || f.a === id; });
                var pots = [0, 0, 0], ph = [0, 0, 0], opp = new Set();
                mine.forEach(function (f) { var o = f.h === id ? f.a : f.h, p = Math.floor(g.teams.indexOf(o) / 4); pots[p]++; if (f.h === id) ph[p]++; opp.add(o); });
                var home = mine.filter(function (f) { return f.h === id; }).length;
                if (mine.length !== 6 || home !== 3 || opp.size !== 6 || pots.join() !== '2,2,2' || ph.join() !== '1,1,1') bad.push('L1 ' + id + ' ' + mine.length + '/' + home + '/' + opp.size + '/' + pots + '/' + ph);
            });
        });
        bad = bad.concat(__structNL({ leagues: { A: S.l2, B: S.l2, C: S.l2 } }).filter(function (b) { return !/teams/.test(b); }));
        return bad;
    };
    __tourCount = function (T) {
        var n = 0;
        T.groups.forEach(function (g) { g.fx.forEach(function (f) { if (f.hg != null) n++; }); });
        Object.keys(T.ko).forEach(function (k) { var v = T.ko[k]; (Array.isArray(v) ? v : [v]).forEach(function (f) { if (f && f.hg != null) n++; }); });
        return n;
    };`;
run(STRUCT);
run(`__fresh(2026, 0); __matches = 0;`);
const editions = [];
for (let y = 2026; y < 2048; y++) {
    run(`__to(${y + 1}, 2);`);   // through the season's tournament (its final is in week 2 of the next season)
    const e = JSON.parse(run(`
        var I = GameState.intl, S = I.seasons[${y}], out = { y: ${y}, type: S.type };
        if (S.type === 'NATIONS_LEAGUE') {
            out.bad = __structNL(S);
            out.final = !!(S.finals && S.finals.final && S.finals.final.hg != null);
            out.lens = [I.nlLeagues.A.length, I.nlLeagues.B.length, I.nlLeagues.C.length];
            out.seeding = new Set(I.seeding).size;
            out.moved = S.movement ? [S.movement.promoted.B.length, S.movement.promoted.C.length, S.movement.relegated.A.length, S.movement.relegated.B.length] : null;
        } else {
            out.bad = __structQ(S);
            var teams = S.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []);
            out.size = teams.length; out.unique = new Set(teams).size;
            out.uefa = teams.filter(function (id) { return Internationals.conf(id) === 'UEFA'; }).length;
            out.hosts = S.hosts; out.hostsIn = S.hosts.filter(function (h) { return teams.indexOf(h) >= 0; });
            out.P = S.qual.P; out.reserved = S.qual.reserved.length;
            var inPaths = []; S.po.paths.forEach(function (p) { inPaths = inPaths.concat(p.teams); });
            out.pathDupes = inPaths.length - new Set(inPaths).size;
            out.matches = __tourCount(S.tour);
            out.winner = S.tour.winner;
            if (S.type === 'WORLD_CUP') {
                out.groupRule = S.tour.groups.every(function (g) {
                    var c = {}; g.teams.forEach(function (id) { var k = Internationals.conf(id); c[k] = (c[k] || 0) + 1; });
                    return Object.keys(c).every(function (k) { return k === 'UEFA' ? c[k] <= 2 : c[k] <= 1; });
                });
                out.hostsPos1 = S.tour.hosts.every(function (h) { return S.tour.groups.some(function (g) { return g.teams[0] === h; }); })
                    && S.tour.groups.every(function (g) { return g.teams.filter(function (t) { return S.tour.hosts.indexOf(t) >= 0; }).length <= 1; });
            }
        }
        return JSON.stringify(out);`));
    editions.push(e);
}
const nl = editions.filter(e => e.type === 'NATIONS_LEAGUE'), q = editions.filter(e => e.type !== 'NATIONS_LEAGUE');
check(`${nl.length} Nations Leagues: every team 6 games, 3 home, own-pot rival twice, one home + one away v each pot`, nl.every(e => !e.bad.length), (nl.find(e => e.bad.length) || { bad: [] }).bad.slice(0, 2).join(' | '));
check('...every edition reaches its final', nl.every(e => e.final));
check('...leagues stay at 18 after promotion/relegation, seeding stays 54 unique', nl.every(e => e.lens.join() === '18,18,18' && e.seeding === 54));
check('...3 + 3 promoted, 3 + 3 relegated at least (plus play-off movers)', nl.every(e => e.moved && e.moved.every(n => n >= 3 && n <= 6)), JSON.stringify(nl.map(e => e.moved)));
check(`${q.length} qualifying campaigns: League 1 teams 6 games v 6 opponents, 2 per pot, 3 home; League 2 like a Nations League group`, q.every(e => !e.bad.length), (q.find(e => e.bad.length) || { bad: [] }).bad.slice(0, 2).join(' | '));
const wcs = q.filter(e => e.type === 'WORLD_CUP'), euros = q.filter(e => e.type === 'EURO');
check(`${wcs.length} World Cups: 48 teams, 16 UEFA, no nation twice, 104 matches`, wcs.every(e => e.size === 48 && e.unique === 48 && e.uefa === 16 && e.matches === 104), JSON.stringify(wcs.map(e => [e.y, e.size, e.uefa, e.matches])));
check('...draw rules: at most 2 UEFA and 1 per other confederation per group; hosts in position 1, apart', wcs.every(e => e.groupRule && e.hostsPos1));
check(`${euros.length} EUROs: 24 teams / 51 matches in 2028, 32 / 63 from 2032, no nation twice`,
    euros.every(e => e.unique === e.size && (e.y + 1 < 2032 ? e.size === 24 && e.matches === 51 : e.size === 32 && e.matches === 63)), JSON.stringify(euros.map(e => [e.y + 1, e.size, e.matches])));
check('no nation in two play-off paths', q.every(e => e.pathDupes === 0));
check('auto-qualified hosts are in their tournament (EURO 2028 hosts excepted: they must qualify)', q.every(e => e.y === 2027 || e.hostsIn.length === e.hosts.length));
check('every tournament has a winner', q.every(e => !!e.winner));
const honours = JSON.parse(run('var H = GameState.intl.honours; return JSON.stringify({ NL: H.NL.length, EURO: H.EURO.length, WC: H.WC.length });'));
check(`roll of honour: ${honours.NL} Nations Leagues, ${honours.EURO} EUROs, ${honours.WC} World Cups`, honours.NL === nl.length && honours.EURO === euros.length && honours.WC === wcs.length);
check(`the hook fired for every international match (${run('return __matches;')})`, run('return __matches;') > 4000);
check('no warnings were logged in 22 seasons', run('return JSON.stringify(GameState.intl.warnings || []);') === '[]', run('return JSON.stringify(GameState.intl.warnings || []);'));

// ---------------- host scenarios ----------------
console.log('\n-- host scenarios --');
const P = JSON.parse(run(`return JSON.stringify(${JSON.stringify(q.map(e => [e.y, e.type, e.hosts, e.P]))});`));
const wcByYear = Object.fromEntries(wcs.map(e => [e.y + 1, e])), euroByYear = Object.fromEntries(euros.map(e => [e.y + 1, e]));
check('WC 2030: six hosts, 2 of them UEFA -> 2 play-off paths', wcByYear[2030].hosts.length === 6 && wcByYear[2030].P === 2);
check('WC 2034: Saudi Arabia, no UEFA host -> 4 play-off paths', wcByYear[2034].hosts.join() === 'ksa' && wcByYear[2034].P === 4);
check('EURO 2032: Italy and Türkiye -> 2 paths (32 teams)', euroByYear[2032].hosts.join() === 'ita,tur' && euroByYear[2032].P === 2);
check('later tournaments get one host drawn (pots still empty)', [2036, 2040, 2044].every(y => euroByYear[y] && euroByYear[y].hosts.length === 1) && [2038, 2042, 2046].every(y => wcByYear[y] && wcByYear[y].hosts.length === 1));
// force the remaining combinations: EURO with 2 hosts, WC with exactly 1 UEFA host
const forced = JSON.parse(run(`
    var out = {};
    INTL_CONFIG.HOSTS['EURO-2036'] = { hosts: ['ger', 'aut'] };
    INTL_CONFIG.HOSTS['WC-2038'] = { hosts: ['ned', 'usa'] };
    __fresh(2035, 0); __to(2036, 2);
    var S = GameState.intl.seasons[2035]; out.euro = { P: S.qual.P, size: S.tour.size, n: S.tour.groups.reduce(function (a, g) { return a + g.teams.length; }, 0), hosts: S.tour.hosts };
    __to(2038, 2);
    S = GameState.intl.seasons[2037]; var t = S.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []);
    out.wc = { P: S.qual.P, n: t.length, uefa: t.filter(function (id) { return Internationals.conf(id) === 'UEFA'; }).length, hosts: S.tour.hosts, usaDirect: S.wc.direct.CONCACAF.length };
    delete INTL_CONFIG.HOSTS['EURO-2036']; delete INTL_CONFIG.HOSTS['WC-2038'];
    return JSON.stringify(out);`));
check('EURO with 2 hosts: 32 teams, both in, 2 paths', forced.euro.n === 32 && forced.euro.hosts.length === 2 && forced.euro.P === 2, JSON.stringify(forced.euro));
check('WC with 1 UEFA host: 48 teams, 16 UEFA, 3 paths; the CONCACAF host is deducted from its 6', forced.wc.n === 48 && forced.wc.uefa === 16 && forced.wc.P === 3 && forced.wc.usaDirect === 6, JSON.stringify(forced.wc));
// EURO 2028 reserved places: 0, 1 and 2 used. Hosts' qualifier results are forced (win or lose
// everything) before the matchdays are played; the rest of the campaign plays out normally.
for (const [losers, want] of [[0, 0], [1, 1], [3, 2]]) {
    const r = JSON.parse(run(`
        // pre-filled results are not "played" this week, so the per-week match counter would object
        Internationals.STRICT = false;
        __fresh(2027, 0); __to(2027, 3);
        var S = GameState.intl.seasons[2027], hosts = ['eng', 'irl', 'sco', 'wal'], lose = hosts.slice(0, ${losers});
        S.l1.groups.concat(S.l2.groups).forEach(function (g) { g.fx.forEach(function (f) {
            var hL = lose.indexOf(f.h) >= 0, aL = lose.indexOf(f.a) >= 0, hW = hosts.indexOf(f.h) >= 0 && !hL, aW = hosts.indexOf(f.a) >= 0 && !aL;
            if (hL && aL) { f.hg = 0; f.ag = 0; } else if (hL || aW) { f.hg = 0; f.ag = 5; } else if (aL || hW) { f.hg = 5; f.ag = 0; }
        }); });
        __to(2028, 2);
        var other = (GameState.intl.warnings || []).filter(function (w) { return !/matches, expected/.test(w); });
        Internationals.STRICT = true;
        var t = S.tour.groups.reduce(function (a, g) { return a.concat(g.teams); }, []);
        return JSON.stringify({ other: other, reserved: S.qual.reserved.length, P: S.qual.P, n: t.length, hostsIn: hosts.filter(function (h) { return t.indexOf(h) >= 0 || S.qual.reserved.indexOf(h) >= 0 || S.qual.direct.indexOf(h) >= 0; }).length });`));
    check(`EURO 2028 with ${want} reserved place(s) used: 24 teams, ${4 - want} paths, nothing else amiss`, r.reserved === want && r.P === 4 - want && r.n === 24 && !r.other.length, JSON.stringify(r));
}

// ---------------- saves (section 9) ----------------
console.log('\n-- existing saves --');
const mid = JSON.parse(run(`
    __fresh(2027, 30); var inbox = GameState.inbox.length, log = GameState.log.length;
    GameState._migrateInternationals();
    var I = GameState.intl, S = I.seasons[2027];
    return JSON.stringify({ has: !!I, md6: S && S.l1.groups[0].fx.every(function (f) { return f.hg != null; }), poDrawn: !!(S && S.po), sf: !!(S && S.po && S.po.paths[0].sf), prev: !!I.seasons[2026], mails: GameState.inbox.length - inbox, logs: GameState.log.length - log, last: I.last });`));
check('a save at week 30 of 2027-28 gets the state, with every passed matchday and draw played', mid.has && mid.md6 && mid.poDrawn && !mid.sf, JSON.stringify(mid));
check('...silently (no mails, no log lines) and without building last season', mid.mails === 0 && mid.logs === 0 && !mid.prev);
const early = JSON.parse(run(`__fresh(2027, 2); GameState._migrateInternationals(); var I = GameState.intl; return JSON.stringify({ seasons: Object.keys(I.seasons), honours: I.honours.NL.length });`));
check('a save in week 2 does not create the previous season\'s tournament', early.seasons.length === 0 && early.honours === 0, JSON.stringify(early));
const before = JSON.parse(run(`__fresh(2025, 40); GameState._migrateInternationals(); var a = GameState.intl; GameState.seasonStartYear = 2026; GameState.week = 3; Internationals.sync(); return JSON.stringify({ before: a, after: !!GameState.intl && !!GameState.intl.seasons[2026] });`));
check('a 2025-26 save has no international football until 2026-27 begins', before.before === null && before.after);
const ren = JSON.parse(run(`
    var p = GameState.players[0], q = GameState.players[1];
    p.nationality = 'Turkey'; q.nationality = 'DRC';
    GameState._migrateInternationals();
    return JSON.stringify([p.nationality, q.nationality, GameState.SCHEMA_VERSION]);`));
check('renamed nationalities are migrated (Turkey -> Türkiye, DRC -> DR Congo), schema 8', ren[0] === 'Türkiye' && ren[1] === 'DR Congo' && ren[2] >= 8, JSON.stringify(ren));
const snap = JSON.parse(run(`__fresh(2027, 0); __to(2028, 2); var s = JSON.stringify(GameState._snapshot().intl); return JSON.stringify({ has: s && s.length > 100, kb: Math.round(s.length / 1024) });`));
check(`the international state is saved with the game (${snap.kb} KB after a full qualifying + EURO season)`, snap.has && snap.kb < 200);

// ---------------- the real weekly simulation ----------------
console.log('\n-- inside the real game --');
const real = JSON.parse(run(`
    Internationals.STRICT = true; Rng.seed(77); GameState.startNewGame('Germany','Real','B'); GameState.save = function () {};
    var weeks = {}, subjects = [], am = GameState.addMail;
    GameState.addMail = function (m) { subjects.push(m.subject || ''); return am.apply(this, arguments); };
    Internationals.onInternationalMatch = function (f) { weeks[f.w] = 1; };
    for (var i = 0; i < 60; i++) Sim.advanceWeek();
    return JSON.stringify({ weeks: Object.keys(weeks).map(Number).sort(function (a, b) { return a - b; }), warnings: GameState.intl.warnings, nl: GameState.intl.honours.NL.length, mail: subjects.filter(function (x) { return /Nations Series/.test(x); }) });`));
check('international matches only in the international weeks', real.weeks.every(w => [11, 12, 17, 18, 36, 37, 49, 50, 51, 52, 1, 2].includes(w)), real.weeks.join(','));
check('a full season of the real game: the Nations League is decided, no warnings', real.nl === 1 && real.warnings.length === 0, JSON.stringify(real.warnings));
check(`...and the winner is announced once in the inbox ("${real.mail[0]}")`, real.mail.length === 1);

console.log(failed ? '\n*** FAIL ***' : '\nAll international football checks passed.');
process.exit(failed ? 1 : 0);
