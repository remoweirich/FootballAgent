// Asia and Oceania (js/intl-afc.js, docs/international.md "Asia and Oceania"): the AFC Nations
// League (both editions, 18/18/11), the AFC play-off, the Asian Cup (24) and its 2027 one-off, OFC
// World Cup qualifiers, the OFC Nations Cup (8), and a World Cup with no placeholder places left.
// Strict mode: a wrong match count in a slot, a team twice in a slot, a 23-team Asian Cup throw.
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

run(`Internationals.STRICT = true; Clubs.init(); GameState.startNewGame('England','Afc','A'); GameState.save = function () {};
    __fresh = function (y, w, seed) { GameState.intl = null; GameState.seasonStartYear = y; GameState.week = w; Rng.seed(seed || 555); };
    __to = function (y, w) { while (GameState.seasonStartYear * 100 + GameState.week < y * 100 + w) {
        if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++; Internationals.sync(); } };
    __ao = {}; var rec = Internationals._record;
    Internationals._record = function (fx, o) { var r = rec.apply(this, arguments); if (this.AO_COMPS[fx.c]) { var k = this._year + ':' + fx.w + fx.s; __ao[k] = (__ao[k] || 0) + 1; } return r; };
    __all = function (gs) { return gs.reduce(function (a, g) { return a.concat(g.teams); }, []); };
    __n = function (gs) { return gs.reduce(function (a, g) { return a + (g.fx || []).filter(function (f) { return f.hg != null; }).length; }, 0); };
    __ko = function (K) { var n = 0; Object.keys(K || {}).forEach(function (k) { [].concat(K[k]).forEach(function (m) { if (m && m.hg != null) n++; }); }); return n; };
    __divs = function () { var d = GameState.intl.ao.div; return d ? d.map(function (x) { return x.length; }).concat([new Set([].concat.apply([], d)).size]) : null; };`);

// ---------------- data ----------------
console.log('-- nations --');
const d = JSON.parse(run(`var C = INTL_CONFIG, afc = NATIONS.filter(function (n) { return n.confederation === 'AFC'; }), ofc = NATIONS.filter(function (n) { return n.confederation === 'OFC'; });
    var first = [].concat.apply([], C.AFCNL_FIRST);
    return JSON.stringify({ afc: afc.length, ofc: ofc.length, nmi: NATIONS_BY_ID['northern-mariana-islands'], sizes: C.AFCNL_FIRST.map(function (x) { return x.length; }),
        cover: first.length === 47 && new Set(first).size === 47 && afc.every(function (n) { return first.indexOf(n.id) >= 0; }) });`));
check('47 AFC nations (the Northern Mariana Islands joined, outside FIFA) and 11 OFC', d.afc === 47 && d.ofc === 11 && d.nmi && d.nmi.fifaMember === false && d.nmi.confederation === 'AFC', JSON.stringify(d.nmi));
check('the first AFC Nations League placement: 18 / 18 / 11, every AFC nation once', d.sizes.join() === '18,18,11' && d.cover);

// ---------------- 22 seasons ----------------
console.log('\n-- 22 seasons --');
run(`__fresh(2026, 0, 2026); __ao = {};`);
const S = [];
for (let y = 2026; y < 2048; y++) {
    run(`__to(${y + 1}, 2);`);
    S.push(JSON.parse(run(`
        var I = GameState.intl, Z = I.seasons[${y}], out = { y: ${y}, afc: Internationals.afcSeason(${y}), ofc: Internationals.ofcSeason(${y}), divs: __divs() };
        if (Z.ao.ac) { var T = Z.ao.ac.tour, t = __all(T.groups);
            out.ac = { n: t.length, uniq: new Set(t).size, hostsIn: Z.ao.ac.hosts.every(function (h) { return t.indexOf(h) >= 0; }), matches: __n(T.groups) + __ko(T.ko), winner: !!T.winner, fixed: !!Z.ao.ac.fixed, fallback: !!Z.ao.ac.fallback,
                groups: T.groups.map(function (g) { return g.teams.join(','); }) }; }
        if (Z.ao.nl) { var N = Z.ao.nl;
            out.nlac = { sizes: N.divs.map(function (x) { return __all(x.groups).length; }), m: N.divs.map(function (x) { return __n(x.groups); }), g3: N.divs[2].groups.map(function (g) { return g.teams.length; }).join(),
                ko: N.qf.concat(N.po.d12, N.po.d23).reduce(function (a, t) { return a + (t.leg1 ? 1 : 0) + (t.leg2 ? 1 : 0); }, 0), finals: __ko(N.finals), qual: Object.keys(I.ao.acQual).length ? I.ao.acQual[N.acQual.key].teams.length : 0, winner: !!N.result }; }
        if (Z.ao.onc) { var O = Z.ao.onc, ot = __all(O.tour.groups);
            out.onc = { q: __n([O.q]), n: ot.length, uniq: new Set(ot).size, matches: __n(O.tour.groups) + __ko(O.tour.ko), hostIn: O.hosts.every(function (h) { return ot.indexOf(h) >= 0 && O.q.teams.indexOf(h) < 0; }), winner: !!O.tour.winner }; }
        if (Z.type === 'WORLD_CUP') {
            var cyc = I.ao.cycles['WC-' + (${y} + 1)], N2 = cyc.nl, Q = cyc.ofc, wt = __all(Z.tour.groups);
            var byConf = {}; wt.forEach(function (id) { var c = Internationals.conf(id); byConf[c] = (byConf[c] || 0) + 1; });
            var ic = Z.wc.ic.winners.map(function (id) { return Internationals.conf(id); });
            out.wc = { n: wt.length, byConf: byConf, ic: ic, direct: Object.keys(Z.wc.direct).map(function (c) { return c + Z.wc.direct[c].length; }).join(), fallback: Z.wcFallback || null,
                nl: { m: N2.divs.map(function (x) { return __n(x.groups); }), po: __n([N2.playoff]), hosts: N2.hosts.length, direct: N2.result.direct.length, icAfc: N2.result.po.length },
                ofc: { m: (Q.r1.sf || []).length + (Q.r1.final ? 1 : 0) + __n(Q.r2.groups) + Q.r3.sf.length + 1, r2: __all(Q.r2.groups).length, hosts: Q.hosts.length } };
        }
        return JSON.stringify(out);`)));
}
const by = t => S.filter(s => s.afc === t);
const ac = S.filter(s => s.ac && !s.ac.fixed);
check(`Asian Cups in 2027 and every four years from 2032 (${S.filter(s => s.ac).map(s => s.y + 1).join(', ')})`, S.filter(s => s.ac).map(s => s.y + 1).join() === '2027,2032,2036,2040,2044,2048');
check('Asian Cup 2027: the real groups, Saudi Arabia hosting, no qualifying', S[0].ac.fixed && S[0].ac.groups.join('|') === JSON.parse(run('return JSON.stringify(INTL_CONFIG.AC_2027_GROUPS);')).map(g => g.join(',')).join('|') && S[0].ac.hostsIn);
check(`${S.filter(s => s.ac).length} Asian Cups: 24 teams, hosts in, 51 matches, a winner; the field always from the Nations League`, S.filter(s => s.ac).every(s => s.ac.n === 24 && s.ac.uniq === 24 && s.ac.hostsIn && s.ac.matches === 51 && s.ac.winner) && ac.every(s => !s.ac.fallback), JSON.stringify(S.filter(s => s.ac).map(s => [s.y, s.ac.n, s.ac.matches, s.ac.fallback])));
check('2026-27 and 2027-28: no AFC Nations League; the first is the World Cup edition in 2028-29', S[0].afc === 'AC_FIXED' && S[1].afc === null && S[2].afc === 'NL_WC' && !S[1].ac && !S[1].nlac);
check(`${by('NL_AC').length} Asian Cup editions: 18/18/11, Division 3 in groups of 4/4/3, 54/54/30 group matches, QF + play-offs 20, Finals 4, 24 qualified, a winner`,
    by('NL_AC').length >= 4 && by('NL_AC').every(s => s.nlac.sizes.join() === '18,18,11' && s.nlac.g3 === '4,4,3' && s.nlac.m.join() === '54,54,30' && s.nlac.ko === 20 && s.nlac.finals === 4 && s.nlac.qual === 24 && s.nlac.winner),
    JSON.stringify(by('NL_AC').map(s => s.nlac)));
check('the divisions stay 18/18/11 (47 different nations) after every promotion and relegation', S.every(s => !s.divs || s.divs.join() === '18,18,11,47'), JSON.stringify(S.map(s => s.divs && s.divs.join('/'))));
const wcs = S.filter(s => s.wc);
check(`${wcs.length} World Cup editions of the AFC Nations League: 90/90/30 matches, a 6-match play-off, direct + play-off = 8 - H, 1 to the IC play-off`,
    wcs.every(s => s.wc.nl.m.join() === '90,90,30' && s.wc.nl.po === 6 && s.wc.nl.direct === 8 - s.wc.nl.hosts && s.wc.nl.icAfc === 1), JSON.stringify(wcs.map(s => s.wc.nl)));
check(`${wcs.length} OFC qualifying campaigns: 18 matches with no OFC host, Round 2 always 8`, wcs.every(s => s.wc.ofc.r2 === 8 && (s.wc.ofc.hosts > 0 || s.wc.ofc.m === 18)), JSON.stringify(wcs.map(s => s.wc.ofc)));
const onc = S.filter(s => s.onc);
check(`OFC Nations Cups from 2028, every four years (${onc.map(s => s.y + 1).join(', ')}): 6 qualifying matches, 8 teams, host in (not in qualifying), 16 matches`,
    onc.length >= 5 && onc[0].y === 2027 && onc.every(s => s.onc.q === 6 && s.onc.n === 8 && s.onc.uniq === 8 && s.onc.hostIn && s.onc.matches === 16 && s.onc.winner), JSON.stringify(onc.map(s => s.onc)));
check(`${wcs.length} World Cups: 48, AFC 8 + IC winners, OFC 1 + IC winners, CAF 9, every confederation from its own qualifying`,
    wcs.every(s => s.wc.n === 48 && !s.wc.fallback && s.wc.direct === 'AFC8,CAF9,CONCACAF6,CONMEBOL6,OFC1'
        && s.wc.byConf.AFC === 8 + s.wc.ic.filter(c => c === 'AFC').length && s.wc.byConf.OFC === 1 + s.wc.ic.filter(c => c === 'OFC').length), JSON.stringify(wcs.map(s => [s.y + 1, s.wc.direct, s.wc.ic, s.wc.fallback])));

// ---------------- section 6: AFC + OFC matches per slot ----------------
const slots = JSON.parse(run('return JSON.stringify(__ao);'));
const row = (y, keys) => keys.map(k => slots[y + ':' + k] || 0).join(' ');
const STD = ['11A', '12A', '12B', '17A', '18A', '18B', '36A', '37A'], SUMMER = ['49A', '49B', '50A', '51A', '52A', '1A', '1B', '2A', '2B'];
check('NL season after a WC (2030-31): 23 x 6, 10 x 2, Finals 2 + 2 in week 49', row(2030, STD) === '23 23 23 23 23 23 10 10' && row(2030, ['49A', '49B']) === '2 2', row(2030, STD) + ' | ' + row(2030, SUMMER));
check('EURO season (2031-32): OFC qualifying 2 x 3; summer Asian Cup 12/12/12/8/4/2+1 + OFC Nations Cup 4/4/4/2/1+1', row(2031, STD) === '2 2 2 0 0 0 0 0' && row(2031, SUMMER) === '16 0 16 16 10 5 1 2 1', row(2031, STD) + ' | ' + row(2031, SUMMER));
check('NL season before a WC (2032-33): AFC 23 x 6 + 18 x 2, OFC R1 2/1, R2 4 x 3, R3 2/1', row(2032, STD) === '25 24 27 27 27 23 20 19', row(2032, STD));
check('WC season (2033-34): Nations League MD9-10 18 + 18, AFC play-off 2 x 3', row(2033, STD) === '18 18 2 2 2 0 0 0', row(2033, STD));
check('2026-27: only the Asian Cup 2027 in the summer; 2027-28: OFC qualifying, then the OFC Nations Cup', row(2026, STD) === '0 0 0 0 0 0 0 0' && row(2026, SUMMER) === '12 0 12 12 8 4 0 2 1' && row(2027, STD) === '2 2 2 0 0 0 0 0' && row(2027, SUMMER) === '4 0 4 4 2 1 1 0 0', row(2026, SUMMER) + ' | ' + row(2027, STD) + ' | ' + row(2027, SUMMER));

// ---------------- forced host scenarios ----------------
console.log('\n-- host scenarios --');
for (const [hosts, H, Ho] of [[['usa'], 0, 0], [['jpn'], 1, 0], [['jpn', 'kor'], 2, 0], [['nzl'], 0, 1]]) {
    const r = JSON.parse(run(`
        INTL_CONFIG.HOSTS['WC-2038'] = { hosts: ${JSON.stringify(hosts)} };
        __fresh(2036, 0, ${50 + hosts.length + H}); __to(2038, 2);
        var cyc = GameState.intl.ao.cycles['WC-2038'], N = cyc.nl, Q = cyc.ofc, Z = GameState.intl.seasons[2037], t = __all(Z.tour.groups);
        delete INTL_CONFIG.HOSTS['WC-2038'];
        return JSON.stringify({ n: t.length, rankDirect: N.ranking.direct.length, po: N.playoff.teams.length, direct: N.result.direct.length, afcIn: Z.wc.direct.AFC.length,
            r1: Q.r1.teams.length, r2: __all(Q.r2.groups).length, ofcDirect: Q.result.direct.length, ofcPo: Q.result.po.length, ofcIn: Z.wc.direct.OFC.length,
            hostsIn: ${JSON.stringify(hosts)}.every(function (h) { return t.indexOf(h) >= 0; }), hostsOut: ${JSON.stringify(hosts)}.every(function (h) { return __all(Q.r2.groups).indexOf(h) < 0 && Q.r1.teams.indexOf(h) < 0; }) });`));
    check(`World Cup with ${H} AFC / ${Ho} OFC host(s): AFC ${6 - H} direct + 4 in the play-off, OFC Round 1 of ${4 - Ho}, 48 teams, hosts in`,
        r.n === 48 && r.rankDirect === 6 - H && r.po === 4 && r.direct === 8 - H && r.afcIn === 8 && r.r1 === 4 - Ho && r.r2 === 8 && r.ofcIn === 1 && r.ofcDirect === (Ho ? 0 : 1) && r.ofcPo === 1 && r.hostsIn && r.hostsOut, JSON.stringify(r));
}
for (const [host, out] of [['jpn', 0], ['india', 1], ['nepal', 1]]) {
    const r = JSON.parse(run(`
        INTL_CONFIG.HOSTS['AC-2036'] = { hosts: ['${host}'] };
        __fresh(2034, 0, 61); __to(2036, 2);
        var q = GameState.intl.seasons[2034].ao.nl.acQual, A = GameState.intl.seasons[2035].ao.ac, t = __all(A.tour.groups);
        delete INTL_CONFIG.HOSTS['AC-2036'];
        return JSON.stringify({ n: t.length, uniq: new Set(t).size, d1: q.div1.length, out: q.hostsOut.length, d2: q.div2.length, hostIn: t.indexOf('${host}') >= 0, a1: A.tour.groups[0].teams[0] === '${host}', matches: __n(A.tour.groups) + __ko(A.tour.ko) });`));
    check(`Asian Cup with a host ${out ? 'outside' : 'inside'} Division 1 (${host}): 18 + ${out} + ${6 - out} of Division 2 = 24, host in A1, 51 matches`,
        r.n === 24 && r.uniq === 24 && r.d1 === 18 && r.out === out && r.d2 === 6 - out && r.hostIn && r.a1 && r.matches === 51, JSON.stringify(r));
}
const oh = JSON.parse(run(`
    INTL_CONFIG.HOSTS['ONC-2032'] = { hosts: ['tonga'] };
    __fresh(2031, 0, 71); __to(2032, 2);
    var O = GameState.intl.seasons[2031].ao.onc, t = __all(O.tour.groups);
    delete INTL_CONFIG.HOSTS['ONC-2032'];
    return JSON.stringify({ n: t.length, host: t.indexOf('tonga') >= 0, q: O.q.teams.indexOf('tonga') < 0, a1: O.tour.groups[0].teams[0] === 'tonga', w: O.qWinner && t.indexOf(O.qWinner) >= 0 });`));
check('OFC Nations Cup with a weak host (Tonga): it skips qualifying, plays in A1, the qualifying winner joins', oh.n === 8 && oh.host && oh.q && oh.a1 && oh.w, JSON.stringify(oh));

// ---------------- existing saves ----------------
console.log('\n-- existing saves --');
const mig = JSON.parse(run(`
    __fresh(2026, 0, 77); __to(2026, 20);
    var I = GameState.intl;
    delete I.ao; Object.keys(I.seasons).forEach(function (y) { delete I.seasons[y].ao; }); delete I.hosts['ONC-2028'];
    var mails = GameState.inbox.length;
    GameState._migrateAmericas();
    var Z = I.seasons[2026];
    return JSON.stringify({ has: !!(I.ao && Z.ao && Z.ao.ac && Z.ao.ac.fixed), groups: Z.ao && Z.ao.ac.tour.groups.length, nl: !!(Z.ao && Z.ao.nl), mails: GameState.inbox.length - mails, warn: I.warnings });`));
check('a 2026-27 save from week 20 gets only the Asian Cup 2027 (real groups), silently, without warnings', mig.has && mig.groups === 6 && !mig.nl && mig.mails === 0 && mig.warn.length === 0, JSON.stringify(mig));
const mig2 = JSON.parse(run(`
    __fresh(2028, 0, 78); __to(2028, 20);
    var I = GameState.intl;
    delete I.ao; Object.keys(I.seasons).forEach(function (y) { delete I.seasons[y].ao; });
    GameState._migrateAmericas();
    var c = I.ao.cycles['WC-2030'];
    return JSON.stringify({ nl: c && __n(Internationals._afcNlGroups(c.nl)), ofc: c && c.ofc && __n(c.ofc.r2.groups), r1: c && c.ofc && !!c.ofc.r1.winner, warn: I.warnings });`));
check('a 2028-29 save from week 20: the Nations League (World Cup edition) has its 6 matchdays played, OFC Rounds 1-2 done', mig2.nl === 138 && mig2.ofc === 12 && mig2.r1 && mig2.warn.length === 0, JSON.stringify(mig2));
check('the save schema moved on (11)', run('return GameState.SCHEMA_VERSION;') >= 11);

console.log(failed ? '\n*** FAIL ***' : '\nAll Asia and Oceania checks passed.');
process.exit(failed ? 1 : 0);
