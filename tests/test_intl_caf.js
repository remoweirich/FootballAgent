// Africa (js/intl-caf.js, docs/international.md "Africa"): AFCON qualifiers + AFCON (28), the
// African Nations League (zones + Finals), CAF World Cup qualifiers + CAF play-off, the 2026-27
// override. Strict mode: a wrong match count in a slot, a team twice in a slot, a 27-team AFCON throw.
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

run(`Internationals.STRICT = true; Clubs.init(); GameState.startNewGame('England','Caf','A'); GameState.save = function () {};
    __fresh = function (y, w, seed) { GameState.intl = null; GameState.seasonStartYear = y; GameState.week = w; Rng.seed(seed || 555); };
    __to = function (y, w) { while (GameState.seasonStartYear * 100 + GameState.week < y * 100 + w) {
        if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++; Internationals.sync(); } };
    __caf = {}; var rec = Internationals._record;
    Internationals._record = function (fx, o) { var r = rec.apply(this, arguments); if (this.CAF_COMPS[fx.c]) { var k = this._year + ':' + fx.w + fx.s; __caf[k] = (__caf[k] || 0) + 1; } return r; };
    __all = function (gs) { return gs.reduce(function (a, g) { return a.concat(g.teams); }, []); };
    __bal = function (g, want) { return g.teams.every(function (t) { var h = g.fx.filter(function (f) { return f.h === t; }).length, a = g.fx.filter(function (f) { return f.a === t; }).length; return want(h, a); }); };`);

// ---------------- data ----------------
console.log('-- nations --');
const z = JSON.parse(run(`var c = {}; NATIONS.filter(function (n) { return n.confederation === 'CAF'; }).forEach(function (n) { c[n.zone] = (c[n.zone] || 0) + 1; }); return JSON.stringify(c);`));
check('54 CAF nations in the four zones: North 6, West 16, East 16, Central & Southern 16', z.NORTH === 6 && z.WEST === 16 && z.EAST === 16 && z.CS === 16 && Object.keys(z).length === 4, JSON.stringify(z));
check('the CAF World Cup qualifier template: 5 home + 5 away, never 3 in a row; MD1-5 give 2-3 home each', JSON.parse(run(`
    var T = Internationals.G6D, ok = true;
    for (var t = 1; t <= 6; t++) {
        var seq = []; T.forEach(function (md) { md.forEach(function (p) { if (p[0] === t) seq.push(1); if (p[1] === t) seq.push(0); }); });
        var h = seq.filter(Boolean).length, h5 = seq.slice(0, 5).filter(Boolean).length;
        for (var i = 2; i < seq.length; i++) if (seq[i] === seq[i - 1] && seq[i] === seq[i - 2]) ok = false;
        if (h !== 5 || h5 < 2 || h5 > 3) ok = false;
    }
    return JSON.stringify(ok);`)));

// ---------------- 22 seasons ----------------
console.log('\n-- 22 seasons --');
run(`__fresh(2026, 0, 2026); __caf = {};`);
const S = [];
for (let y = 2026; y < 2048; y++) {
    run(`__to(${y + 1}, 2);`);
    S.push(JSON.parse(run(`
        var I = GameState.intl, Z = I.seasons[${y}], out = { y: ${y}, t: Internationals.cafSeason(${y}) };
        if (Z.caf.afq) {
            var Q = Z.caf.afq, T = Q.tour, teams = __all(T.groups), n = 0;
            T.groups.forEach(function (g) { g.fx.forEach(function (f) { if (f.hg != null) n++; }); });
            Object.keys(T.ko).forEach(function (k) { [].concat(T.ko[k]).forEach(function (m) { if (m && m.hg != null) n++; }); });
            var qn = Q.prelim.length * 2; Q.groups.forEach(function (g) { g.fx.forEach(function (f) { if (f.hg != null) qn++; }); });
            out.afcon = { n: teams.length, uniq: new Set(teams).size, hosts: Q.hosts, hostsIn: Q.hosts.every(function (h) { return teams.indexOf(h) >= 0; }), matches: n, qMatches: qn,
                groups: Q.groups.length, bal: Q.groups.every(function (g) { return __bal(g, function (h, a) { return h === 3 && a === 3; }); }), winner: T.winner,
                thirds: Q.qualified.thirds.length, opp: T.groups.every(function (g) { return true; }) };
        }
        if (Z.caf.anl) {
            var A = Z.caf.anl, gm = 0, north = A.zones[0].groups[0];
            A.zones.forEach(function (zz) { zz.groups.forEach(function (g) { gm += g.fx.length; }); });
            var ft = __all(A.tour.groups);
            out.anl = { group: gm, northBal: __bal(north, function (h, a) { return h >= 2 && h <= 3; }), bigBal: A.zones.slice(1).every(function (zz) { return zz.groups.every(function (g) { return __bal(g, function (h, a) { return h === 3 && a === 3; }); }); }),
                finals: ft.length, uniq: new Set(ft).size, zoneOk: A.tour.groups.every(function (g) { var c = {}; g.teams.forEach(function (id) { var zz = NATIONS_BY_ID[id].zone; c[zz] = (c[zz] || 0) + 1; }); return Object.keys(c).every(function (k) { return c[k] <= (k === 'NORTH' ? 1 : 2); }); }),
                winner: A.tour.winner, adv: A.tour.hosts.length };
        }
        if (Z.type === 'WORLD_CUP') {
            var cyc = I.caf.cycles['WC-' + (${y} + 1)], t = __all(Z.tour.groups), caf = t.filter(function (id) { return Internationals.conf(id) === 'CAF'; });
            out.wc = { n: t.length, caf: caf.length };
            if (cyc) { var q = cyc.q; out.cafq = { teams: __all(q.groups).length, groups: q.groups.length, played: q.groups.reduce(function (a, g) { return a + g.fx.filter(function (f) { return f.hg != null; }).length; }, 0),
                bal: q.groups.every(function (g) { return __bal(g, function (h, a) { return h === 5 && a === 5; }); }), po: q.playoff.teams.length, poWinner: q.result.po[0], direct: q.result.direct.length, hosts: q.hosts.length,
                poInWc: t.indexOf(q.result.po[0]) >= 0 || (Z.wc.ic.winners || []).indexOf(q.result.po[0]) < 0 }; }
        }
        return JSON.stringify(out);`)));
}
const af = S.filter(s => s.afcon), anl = S.filter(s => s.anl), wc = S.filter(s => s.cafq);
check('2026-27 plays the AFCON (2027) instead of the Nations League; 2027-28 the AFCON 2028', S[0].t === 'AFCON' && S[1].t === 'AFCON' && S[0].afcon && S[1].afcon);
check('AFCON 2027 is hosted by Kenya, Tanzania and Uganda (3 hosts, 1 best third)', S[0].afcon.hosts.join() === 'kenya,tanzania,uga' && S[0].afcon.thirds === 1, JSON.stringify(S[0].afcon.hosts));
check(`${af.length} AFCONs: 28 different teams, hosts in, 58 matches, a winner`, af.every(s => s.afcon.n === 28 && s.afcon.uniq === 28 && s.afcon.hostsIn && s.afcon.matches === 58 && s.afcon.winner), JSON.stringify(af.map(s => [s.y + 1, s.afcon.n, s.afcon.matches])));
check('...their qualifiers: 12 groups, 156 matches, 3 home + 3 away each', af.every(s => s.afcon.groups === 12 && s.afcon.qMatches === 156 && s.afcon.bal), JSON.stringify(af.map(s => s.afcon.qMatches)));
check(`${anl.length} African Nations Leagues (from 2030-31): 159 group matches, North 2-3 home, others 3 + 3`, anl.length >= 4 && anl[0].y === 2030 && anl.every(s => s.anl.group === 159 && s.anl.northBal && s.anl.bigBal), JSON.stringify(anl.map(s => [s.y, s.anl.group])));
check('...Finals: 16 different teams, at most 2 per zone and the North teams apart, neutral (no home advantage), a winner', anl.every(s => s.anl.finals === 16 && s.anl.uniq === 16 && s.anl.zoneOk && s.anl.adv === 0 && s.anl.winner));
check(`${wc.length} CAF World Cup qualifying campaigns: 54 teams in 9 groups of 6, 270 group matches, 5 home + 5 away each, a 4-team play-off`,
    wc.every(s => s.cafq.teams === 54 && s.cafq.groups === 9 && s.cafq.played === 270 && s.cafq.bal && s.cafq.po === 4 && s.cafq.poWinner), JSON.stringify(wc.map(s => s.cafq)));
check('...direct places = 9 - CAF hosts (2030, Morocco: 8)', wc.every(s => s.cafq.direct === 9 - s.cafq.hosts) && wc.some(s => s.y === 2029 && s.cafq.hosts === 1 && s.cafq.direct === 8));
check('World Cups: 48 teams, CAF 9 (+1 if its play-off winner wins the inter-confederation play-off)', S.filter(s => s.wc).every(s => s.wc.n === 48 && (s.wc.caf === 9 || s.wc.caf === 10)), JSON.stringify(S.filter(s => s.wc).map(s => s.wc)));
check('no warnings in 22 seasons', run('return JSON.stringify(GameState.intl.warnings);') === '[]', run('return JSON.stringify(GameState.intl.warnings);'));

// the per-slot table of section 7 (CAF competitions)
const c = JSON.parse(run('return JSON.stringify(__caf);'));
const row = (y, slots) => slots.map(k => c[y + ':' + k] || 0).join();
const SL = ['11A', '12A', '12B', '17A', '18A', '18B', '36A', '37A'];
check('2026-27 (AFCON override): 6, 6, then 24 x 6', row(2026, SL) === '6,6,24,24,24,24,24,24', row(2026, SL));
check('NL season after a WC (ANL, 2030-31): 27 x 5, 24, then nothing', row(2030, SL) === '27,27,27,27,27,24,0,0', row(2030, SL));
check('NL season before a WC (2028-29): 27 in every slot', row(2028, SL) === '27,27,27,27,27,27,27,27', row(2028, SL));
check('WC season (2029-30): 27, 27, play-off 2 + 1, then nothing', row(2029, SL) === '27,27,2,1,0,0,0,0', row(2029, SL));
const win = y => [49, 50, 51, 52, 1, 2].reduce((a, w) => a + (c[y + ':' + w + 'A'] || 0) + (c[y + ':' + w + 'B'] || 0), 0);
check(`tournament windows: AFCON 58 (2026, 2027), ANL Finals 32 (2030), none in 2028-29 (${win(2026)}, ${win(2027)}, ${win(2030)}, ${win(2028)})`, win(2026) === 58 && win(2027) === 58 && win(2030) === 32 && win(2028) === 0);

// ---------------- forced host scenarios ----------------
console.log('\n-- host scenarios --');
for (const hosts of [['sen'], ['sen', 'civ'], ['nga', 'gha', 'cmr']]) {
    const r = JSON.parse(run(`
        INTL_CONFIG.HOSTS['AFCON-2032'] = { hosts: ${JSON.stringify(hosts)} };
        __fresh(2031, 0, ${30 + hosts.length}); __to(2032, 2);
        var Q = GameState.intl.seasons[2031].caf.afq, t = __all(Q.tour.groups);
        delete INTL_CONFIG.HOSTS['AFCON-2032'];
        return JSON.stringify({ n: t.length, uniq: new Set(t).size, thirds: Q.qualified.thirds.length, in: ${JSON.stringify(hosts)}.every(function (h) { return t.indexOf(h) >= 0; }), direct: Q.qualified.direct.length });`));
    check(`AFCON with ${hosts.length} host(s): 28 teams, 24 + ${4 - hosts.length} thirds + ${hosts.length}`, r.n === 28 && r.uniq === 28 && r.in && r.thirds === 4 - hosts.length && r.direct === 24, JSON.stringify(r));
}
for (const hosts of [['usa'], ['egy'], ['egy', 'nga']]) {
    const H = hosts.filter(h => ['egy', 'nga'].includes(h)).length;
    const r = JSON.parse(run(`
        INTL_CONFIG.HOSTS['WC-2038'] = { hosts: ${JSON.stringify(hosts)} };
        __fresh(2036, 0, ${40 + hosts.length}); __to(2038, 2);
        var q = GameState.intl.caf.cycles['WC-2038'].q, Z = GameState.intl.seasons[2037], t = __all(Z.tour.groups);
        delete INTL_CONFIG.HOSTS['WC-2038'];
        return JSON.stringify({ n: t.length, caf: t.filter(function (id) { return Internationals.conf(id) === 'CAF'; }).length, direct: q.result.direct.length, po: q.playoff.teams.length, hosts: q.hosts.length,
            hostsIn: ${JSON.stringify(hosts)}.every(function (h) { return t.indexOf(h) >= 0; }) });`));
    check(`World Cup with ${H} CAF host(s): ${9 - H} direct + a 4-team play-off, 48 teams, hosts in`, r.n === 48 && r.direct === 9 - H && r.po === 4 && r.hosts === H && r.hostsIn && (r.caf === 9 || r.caf === 10), JSON.stringify(r));
}

// ---------------- existing saves ----------------
console.log('\n-- existing saves --');
const mig = JSON.parse(run(`
    __fresh(2026, 0, 77); __to(2026, 20);
    var I = GameState.intl;
    delete I.caf; Object.keys(I.seasons).forEach(function (y) { delete I.seasons[y].caf; }); delete I.hosts['AFCON-2028'];
    var mails = GameState.inbox.length;
    GameState._migrateAmericas();
    var Z = I.seasons[2026];
    return JSON.stringify({ has: !!(I.caf && Z.caf && Z.caf.afq), prelim: Z.caf && Z.caf.afq.prelim.every(function (t) { return t.winner; }),
        played: Z.caf ? Z.caf.afq.groups.reduce(function (a, g) { return a + g.fx.filter(function (f) { return f.hg != null; }).length; }, 0) : -1,
        host28: !!I.hosts['AFCON-2028'], mails: GameState.inbox.length - mails, warn: I.warnings });`));
check('a 2026-27 save from week 20 gets the AFCON 2027 qualifiers: preliminary round done, 4 group matchdays played', mig.has && mig.prelim && mig.played === 96, JSON.stringify(mig));
check('...an AFCON 2028 host is drawn, silently, without warnings', mig.host28 && mig.mails === 0 && mig.warn.length === 0);
check('the save schema moved on (10)', run('return GameState.SCHEMA_VERSION;') >= 10);

console.log(failed ? '\n*** FAIL ***' : '\nAll Africa checks passed.');
process.exit(failed ? 1 : 0);
