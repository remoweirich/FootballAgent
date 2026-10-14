// Call-ups (js/intl-callups.js, docs/international.md "Call-ups"): the rating bands against a
// national team's skill level (scaled by population), the position / group caps that push extra
// clients down, the squad limits, how often each role plays, the strength boost, the season's
// stats, the results log, the tournament finishes, away-with-the-national-team, real history.
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
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb);
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

run(`Internationals.STRICT = true; Rng.seed(12); Clubs.init(); GameState.startNewGame('England','Cu','A'); GameState.save = function () {};
    __to = function (y, w) { while (GameState.seasonStartYear * 100 + GameState.week < y * 100 + w) {
        if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++; Internationals.sync(); } };
    // a pool of real players to turn into test clients
    __pool = GameState.players.filter(function (p) { return !p.agentId && p.clubId && !p.retired; });
    __k = 0;
    __mk = function (nat, pos, ab, age) { var p = __pool[__k++]; p.agentId = 'me'; p.nationality = nat; p.position = pos; p.ability = ab; p.age = age || 25; p.injury = null; p.retired = false; p.archived = false; p.intlStats = null; return p; };
    __roles = function (sq) { var o = {}; sq.forEach(function (e) { o[GameState.getPlayer(e.id).ability + ':' + GameState.getPlayer(e.id).position + ':' + e.id] = e.role; }); return o; };`);

// ---------------- bands ----------------
console.log('-- bands --');
const B = JSON.parse(run(`return JSON.stringify(['isl', 'ger', 'usa', 'sco', 'ned', 'fra'].map(function (id) { var b = Internationals.callupBands(id, 2026); return [id, b.skill, b.star, b.starter, b.rotation, b.reserve]; }));`));
const b = Object.fromEntries(B.map(r => [r[0], r.slice(1)]));
check('Iceland (rep 69, 0.4m): skill 71; star 74+, starter 68-73, rotation 62-67, reserve 55-61', b.isl.join() === '71,74,68,62,55', JSON.stringify(b.isl));
check('100m+ (USA, rep 77): rotation -4/-5, reserve -6/-9', b.usa.join() === [79, 82, 76, 74, 70].join(), JSON.stringify(b.usa));
check('the bands narrow with population: Germany (84m) and the Netherlands (18m) between them', b.ger[3] === b.ger[0] - 5 && b.ned[3] === b.ned[0] - 6 && b.sco[3] >= b.sco[0] - 8, JSON.stringify(b));
check('reputation is capped at 86: France (86) skill 88, star 91', b.fra[0] === 88 && b.fra[1] === 91);

// ---------------- squad rules ----------------
console.log('\n-- squad rules --');
const rb = JSON.parse(run(`var ps = [75, 74, 74, 74].map(function (a) { return __mk('Iceland', 'RB', a); });
    var sq = Internationals.pickSquad('isl', ps, 2026);
    return JSON.stringify(ps.map(function (p) { var e = sq.find(function (x) { return x.id === p.id; }); return e ? e.role : 'out'; }));`));
check('four Icelandic right-backs (75, 74, 74, 74): star, rotation, reserve, out', rb[0] === 'star' && rb.slice(1).sort().join() === 'out,reserve,rotation', rb.join());
const cb = JSON.parse(run(`var ps = [80, 79, 78, 77, 76, 75, 74].map(function (a) { return __mk('Iceland', 'CB', a); });
    var sq = Internationals.pickSquad('isl', ps, 2026);
    return JSON.stringify(ps.map(function (p) { var e = sq.find(function (x) { return x.id === p.id; }); return e ? e.role : 'out'; }));`));
check('seven centre-backs: 3 keep their role, then rotation, reserve, and the rest out', cb.join() === 'star,star,star,rotation,reserve,out,out', cb.join());
const grp = JSON.parse(run(`var ps = [['RB', 80], ['LB', 79], ['CB', 78], ['CB', 77], ['CB', 76], ['CDM', 80], ['CM', 79], ['CM', 78], ['CAM', 77], ['CAM', 76], ['ST', 80], ['ST', 79], ['LW', 78], ['RW', 74]]
        .map(function (x) { return __mk('Iceland', x[0], x[1]); });
    var sq = Internationals.pickSquad('isl', ps, 2026), XI = sq.filter(function (e) { return e.role === 'star' || e.role === 'starter'; });
    var g = function (pos) { return XI.filter(function (e) { return pos.indexOf(GameState.getPlayer(e.id).position) >= 0; }).length; };
    return JSON.stringify({ D: g(['CB', 'LB', 'RB']), M: g(['CDM', 'CM', 'CAM']), A: g(['ST', 'LW', 'RW']), all: XI.length, n: sq.length,
        rot: sq.filter(function (e) { return e.role === 'rotation'; }).map(function (e) { return GameState.getPlayer(e.id).position + GameState.getPlayer(e.id).ability; }) });`));
check('14 would-be starters: at most 5 defenders, 4 midfielders, 3 attackers and 10 outfielders start; the lowest-rated drop to rotation',
    grp.D <= 5 && grp.M <= 4 && grp.A <= 3 && grp.all === 10 && grp.n === 14 && grp.rot.includes('RW74') && grp.rot.includes('CAM76'), JSON.stringify(grp));
const lim = JSON.parse(run(`var gk = [80, 70, 66, 64, 63].map(function (a) { return __mk('Iceland', 'GK', a); });
    var st = [70, 69, 68, 67, 66, 65].map(function (a) { return __mk('Iceland', 'ST', a); });
    var young = __mk('Iceland', 'CM', 75, 15), hurt = __mk('Iceland', 'CM', 75); hurt.injury = { id: 'x', type: 'x', weeksOut: 3, total: 3 };
    var low = __mk('Iceland', 'CM', 54);
    var sq = Internationals.pickSquad('isl', gk.concat(st, [low]), 2026), el = Internationals._eligibleClients().isl || [];
    return JSON.stringify({ gk: gk.map(function (p) { var e = sq.find(function (x) { return x.id === p.id; }); return e ? e.role : 'out'; }),
        st: st.filter(function (p) { return sq.some(function (x) { return x.id === p.id; }); }).length, low: sq.some(function (x) { return x.id === low.id; }),
        young: el.indexOf(young) >= 0, hurt: el.indexOf(hurt) >= 0 });`));
check('keepers: first choice, back-up, third keeper, then out (3 at most)', lim.gk.join() === 'star,rotation,reserve,out,out', lim.gk.join());
check('at most 4 strikers; below the reserve band nobody is called up; under-16s and the injured are not eligible', lim.st === 4 && !lim.low && !lim.young && !lim.hurt, JSON.stringify(lim));

// reserves: one per line, and only by chance when rated in the reserve band
const rv = JSON.parse(run(`
    var two = [58, 57].map(function (a) { return __mk('Iceland', 'CB', a, 20); }), mid = __mk('Iceland', 'CM', 59, 20);
    var lines = { cb: 0, both: 0, mid: 0 }, N = 400;
    for (var i = 0; i < N; i++) { var sq = Internationals.pickSquad('isl', two.concat([mid]), 2026), ids = sq.map(function (e) { return e.id; });
        var n = two.filter(function (p) { return ids.indexOf(p.id) >= 0; }).length; if (n) lines.cb++; if (n === 2) lines.both++; if (ids.indexOf(mid.id) >= 0) lines.mid++; }
    var chance = function (age, called) { var p = __mk('Iceland', 'ST', 58, age); p.intlCalled = called; var k = 0;
        for (var i = 0; i < 4000; i++) if (Internationals.pickSquad('isl', [p], 2026).length) k++; return Math.round(k / 40 * 10) / 10; };
    return JSON.stringify({ both: lines.both, cb: Math.round(lines.cb / N * 100), mid: Math.round(lines.mid / N * 100),
        young: chance(21, false), olderCapped: chance(27, true), olderNever: chance(27, false) });`));
check('at most one reserve per line: two reserve-range centre-backs are never both called up (a midfielder in the same band can be)', rv.both === 0 && rv.cb > 80 && rv.mid > 60, JSON.stringify(rv));
check('a reserve-range client is called up 75% of the time at 22 or younger, 15% at 23+ if capped before, 1% if never', Math.abs(rv.young - 75) <= 3 && Math.abs(rv.olderCapped - 15) <= 2.5 && rv.olderNever <= 2.5, JSON.stringify(rv));

// clubs: the same starter limits among your clients (no club has two star right-backs)
const club = JSON.parse(run(`
    GameState.players.forEach(function (x) { if (x.agentId === 'me') x.agentId = null; });   // only this block's clients
    var c = Clubs.getClubById(GameState.players.find(function (x) { return x.clubId && !x.agentId; }).clubId), r = c.reputation;
    var at = function (pos, ab, role) { var p = __mk('Iceland', pos, ab); p.clubId = c.id; p.onLoanAt = null; p.squadRole = role; return p; };
    var rb1 = at('RB', r + 8, 'key'), rb2 = at('RB', r + 9, 'rotation');
    var cbs = [at('CB', r + 6, 'key'), at('CB', r + 6, 'starter'), at('CB', r + 6, 'starter')], cb4 = at('CB', r + 7, 'rotation');
    var lb = at('LB', r + 8, 'rotation');
    var other = Clubs.allClubs.find(function (x) { return x.id !== c.id && Math.abs(x.reputation - r) < 3; });
    var out = { rb2: Agency.maxRoleAt(rb2, c), rb2Ceil: Agency.clubRoleCeiling(rb2, c), rb2Elsewhere: Agency.maxRoleAt(rb2, other), cb4: Agency.maxRoleAt(cb4, c), lb: Agency.maxRoleAt(lb, c) };
    // five defenders already starting: a sixth (a free position, LB) can only rotate
    var lbFull = (function () { rb1.squadRole = 'key'; lb.squadRole = 'rotation'; var x = at('LB', r + 8, 'starter'); var y = Agency.maxRoleAt(lb, c); x.clubId = null; x.agentId = null; return y; })();
    out.lbFull = lbFull;
    [rb1, rb2, lb, cb4].concat(cbs).forEach(function (p) { p.agentId = null; });
    return JSON.stringify(out);`));
check('clubs: a second star-level right-back of yours can only join as rotation (elsewhere he is a star; a left-back still can start)',
    club.rb2 === 'rotation' && club.rb2Ceil === 'rotation' && club.rb2Elsewhere === 'key' && club.lb === 'key', JSON.stringify(club));
check('clubs: three centre-backs may start, a fourth rotates; with 5 defenders starting, a sixth rotates', club.cb4 === 'rotation' && club.lbFull === 'rotation', JSON.stringify(club));

// ---------------- how often each role plays ----------------
console.log('\n-- playing time --');
const share = JSON.parse(run(`
    GameState.players.forEach(function (p) { if (p.agentId === 'me') p.agentId = null; });
    var star = __mk('Iceland', 'ST', 80), st = __mk('Iceland', 'CM', 70), rot = __mk('Iceland', 'CB', 64), res = __mk('Iceland', 'LB', 58);
    var g1 = __mk('Iceland', 'GK', 70), g2 = __mk('Iceland', 'GK', 64), g3 = __mk('Iceland', 'GK', 58);
    var sq = { list: [{ id: star.id, role: 'star' }, { id: st.id, role: 'starter' }, { id: rot.id, role: 'rotation' }, { id: res.id, role: 'reserve' },
        { id: g1.id, role: 'starter' }, { id: g2.id, role: 'rotation' }, { id: g3.id, role: 'reserve' }], boost: 0 };
    GameState.intl = GameState.intl || Internationals._fresh();
    for (var i = 0; i < 4000; i++) Internationals._clientsPlay('isl', sq, { h: 'isl', a: 'fro', hg: 1, ag: 0, w: 11, s: 'A', c: 'INTL_FRIENDLY' }, 2026, 1, 0);
    var a = function (p) { return Math.round(((p.intlStats && p.intlStats[2026] && p.intlStats[2026].INTL_FRIENDLY.apps) || 0) / 40); };
    return JSON.stringify({ star: a(star), starter: a(st), rotation: a(rot), reserve: a(res), gk1: a(g1), gk2: a(g2), gk3: ((g3.intlStats && g3.intlStats[2026] && g3.intlStats[2026].INTL_FRIENDLY.apps) || 0) });`));
check('outfield: star 100%, starter 90%, rotation 50%, reserve 10% of matches', share.star === 100 && Math.abs(share.starter - 90) <= 3 && Math.abs(share.rotation - 50) <= 3 && Math.abs(share.reserve - 10) <= 2, JSON.stringify(share));
check('keepers: first choice 90%, back-up 10%, third keeper ~0.1% (of 4000: a handful)', Math.abs(share.gk1 - 90) <= 3 && Math.abs(share.gk2 - 10) <= 2 && share.gk3 <= 15, JSON.stringify(share));

// ---------------- a real season ----------------
console.log('\n-- in the game --');
const live = JSON.parse(run(`
    GameState.players.forEach(function (p) { if (p.agentId === 'me') p.agentId = null; });
    GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0; Rng.seed(77);
    var star = __mk('Iceland', 'ST', 80, 24), starter = __mk('Iceland', 'CM', 70, 26), rot = __mk('Iceland', 'CB', 64, 22), none = __mk('Iceland', 'RB', 50, 22);
    var mails0 = GameState.inbox.length;
    __to(2026, 10);
    var mail = GameState.inbox.slice(0, GameState.inbox.length - mails0).find(function (m) { return /call/i.test(m.subject); });
    var cu = GameState.intl.cu, sq = cu && cu.squads.isl;
    var strengthIn = (function () { Internationals._year = 2026; Internationals._matchWeek = 11; var s = Internationals._strength('isl'); Internationals._matchWeek = 20; var t = Internationals._strength('isl'); Internationals._year = null; Internationals._matchWeek = null; return [s, t]; })();
    __to(2027, 3);
    var st = function (p) { var t = { apps: 0, goals: 0 }; Object.values(p.intlStats || {}).forEach(function (y) { Object.values(y).forEach(function (c) { t.apps += c.apps; t.goals += c.goals; }); }); return t; };
    var res = Internationals.nationResults('isl');
    return JSON.stringify({ mail: !!mail, mailClean: !!mail && /Iceland/.test(mail.body) && !/Star Player|Starter|Rotation|Reserve/.test(mail.body), called: !!(star.intlCalled && starter.intlCalled && rot.intlCalled && !none.intlCalled), key: cu && cu.key, roles: sq && sq.list.map(function (e) { return e.role; }).join(), boost: sq && sq.boost, strengthIn: strengthIn,
        star: st(star), starter: st(starter), rot: st(rot), none: st(none), nation: star.intlNation, res: res.length, comps: Array.from(new Set(res.map(function (r) { return r.comp; }))).join(),
        rep: Internationals.repAt('isl', 2026) });`));
check('the squad is named in week 10, with a mail: star, starter, rotation (the 50-rated right-back is not called up)', live.mail && live.key === '2026:0' && live.roles === 'star,starter,rotation', JSON.stringify(live));
check('called-up starters and stars lift the team: rep + (80 - rep)/11 + (70 - rep)/11, only inside the window', Math.abs(live.boost - ((80 - live.rep) / 11 + Math.max(0, 70 - live.rep) / 11)) < 0.02 && Math.abs(live.strengthIn[0] - live.strengthIn[1] - live.boost) < 0.02, JSON.stringify([live.boost, live.strengthIn]));
check('a season of internationals: the star plays more than the starter, the starter more than the rotation player; caps and goals recorded',
    live.star.apps >= live.starter.apps && live.starter.apps > live.rot.apps && live.rot.apps > 0 && live.none.apps === 0 && live.star.goals > 0 && live.nation === 'isl', JSON.stringify([live.star, live.starter, live.rot, live.none]));
check("Iceland's match list: Nations League and friendlies", live.res >= 6 && /INTL_NL/.test(live.comps), JSON.stringify([live.res, live.comps]));
check('the call-up mail names the players, never their role; everyone named is marked as called up', live.mailClean && live.called, JSON.stringify([live.mailClean, live.called]));

// results kept 104 weeks, tournament finishes, away with the national team
const keep = JSON.parse(run(`__to(2029, 20);
    var I = GameState.intl, nowL = Internationals._absKey(2029, 20), oldest = I.res.length ? I.res[0][0] : nowL;
    var ac = Object.keys(I.fin).filter(function (id) { return I.fin[id].some(function (f) { return f[0] === 'INTL_AC' && f[1] === 2027; }); });
    var w = ac.filter(function (id) { return I.fin[id].some(function (f) { return f[0] === 'INTL_AC' && f[1] === 2027 && f[2] === 'W'; }); });
    var euro = Object.keys(I.fin).filter(function (id) { return I.fin[id].some(function (f) { return f[0] === 'INTL_EURO' && f[1] === 2028; }); });
    var codes = {}; Object.values(I.fin).forEach(function (l) { l.forEach(function (f) { if (f[0] === 'INTL_EURO' && f[1] === 2028) codes[f[2]] = (codes[f[2]] || 0) + 1; }); });
    return JSON.stringify({ span: nowL - oldest, ac: ac.length, w: w.length, euro: euro.length, codes: codes, honours: I.honours.AC[0].winner === w[0] });`));
check('match lists keep the last 104 weeks only', keep.span <= 104, JSON.stringify(keep.span));
check('tournament finishes: all 24 at Asian Cup 2027, one winner (the roll of honour agrees); EURO 2028: 1 W, 1 F, 2 SF, 4 QF, 8 R16, 8 GS',
    keep.ac === 24 && keep.w === 1 && keep.honours && keep.euro === 24 && [['GS', 8], ['R16', 8], ['QF', 4], ['SF', 2], ['F', 1], ['W', 1]].every(([k, n]) => keep.codes[k] === n), JSON.stringify(keep));
const away = JSON.parse(run(`
    var p = __mk('Japan', 'ST', 85, 25), I = GameState.intl;
    I.cu = { key: '2030:3', squads: { jpn: { list: [{ id: p.id, role: 'star' }], boost: 0 } } };
    GameState.seasonStartYear = 2031; GameState.week = 1; Internationals._year = 2030;
    Internationals._clientsPlay('jpn', I.cu.squads.jpn, { h: 'jpn', a: 'kor', hg: 2, ag: 1, w: 1, s: 'A', c: 'INTL_AC' }, 2030, 2, 1);
    var inWeek = Internationals.clientAway(p);
    GameState.week = 2; var next = Internationals.clientAway(p);
    Internationals._year = null;
    return JSON.stringify({ inWeek: inWeek, next: next });`));
check('a client whose nation plays this week is away from his club (weeks 1-2: the European qualifiers); the week after, he is back', away.inWeek && !away.next, JSON.stringify(away));

// ---------------- the review fixes ----------------
console.log('\n-- fixes --');
const fx = JSON.parse(run(`var I = GameState.intl, out = {};
    // 1. a second leg decided in extra time / on penalties is logged with them
    var n = 0, bad = 0;
    for (var k = 0; k < 300; k++) {
        var t = { hi: 'fra', lo: 'esp', leg1: { h: 'esp', a: 'fra', hg: 1, ag: 1 } };
        Internationals._slotTeams = {}; Internationals._weekCount = {};   // the same tie, over and over: not a real slot
        Internationals._year = 2029; Internationals._leg2(t, 37, 'INTL_NL', 'qf', 'A');
        var e = I.res[I.res.length - 1];
        if (t.leg2.et || t.leg2.pens) { n++; if (e[3] !== t.leg2.hg || e[4] !== t.leg2.ag || !e[8]) bad++; }
    }
    Internationals._year = null;
    out.legs = [n, bad];
    // 3. a week 1-2 match shows in the season it belongs to
    I.res.push([Internationals._absKey(2027, 2), 'esp', 'fra', 2, 1, Internationals._compCode('INTL_EURO'), 'final']);
    var r = Internationals.nationResults('esp').find(function (x) { return x.comp === 'INTL_EURO' && x.week === 2 && x.L === Internationals._absKey(2027, 2); });
    out.season = r && r.season;
    // 7. sorted by date even if logged out of order
    I.res.push([Internationals._absKey(2026, 12), 'esp', 'ger', 0, 0, 0]);
    var L = Internationals.nationResults('esp').map(function (x) { return x.L; });
    out.sorted = L.every(function (v, i) { return i === 0 || L[i - 1] >= v; });
    // 8. the inter-confederation play-off is not World Cup goals
    var q = __mk('Japan', 'ST', 88, 25); I.cu = { key: '2029:2', squads: { jpn: { list: [{ id: q.id, role: 'star' }], boost: 0 } } };
    Internationals._clientsPlay('jpn', I.cu.squads.jpn, { h: 'jpn', a: 'nzl', hg: 3, ag: 0, w: 36, s: 'A', c: 'INTL_WC', st: 'ic' }, 2029, 3, 0);
    out.ic = Object.keys(q.intlStats[2029]).join();
    // 6. a client away in week 1: his club plays without what he adds, that week only
    var c = GameState.players.find(function (x) { return x.agentId === 'me' && x.clubId && Clubs.getClubById(x.clubId); });
    var club = Clubs.getClubById(c.clubId); c.ability = club.reputation + 22;
    var y0 = GameState.seasonStartYear, w0 = GameState.week;
    GameState.seasonStartYear = 2031; GameState.week = 1;
    var s0 = League.clubStrength(club.id);
    I.away = { t: Internationals._absKey(2030, 1), ids: [c.id] };
    var s1 = League.clubStrength(club.id);
    GameState.week = 3; I.away = { t: Internationals._absKey(2031, 3), ids: [c.id] }; var s3 = League.clubStrength(club.id);
    I.away = null; var s3b = League.clubStrength(club.id);
    GameState.seasonStartYear = y0; GameState.week = w0;
    out.club = [s0, s1, s3, s3b];
    return JSON.stringify(out);`));
check('a second leg that went to extra time / penalties is logged with them (it used to be the 90-minute score)', fx.legs[0] > 30 && fx.legs[1] === 0, JSON.stringify(fx.legs));
check('a week-2 match (a EURO final) is listed under the season it belongs to', fx.season === 2027, JSON.stringify(fx.season));
check("a nation's matches are always newest first", fx.sorted);
check('inter-confederation play-off goals are not World Nations Cup goals', fx.ic === 'INTL_WCPO', fx.ic);
check('away with his nation in week 1: his club is weaker that week only (week 3: unchanged)', fx.club[1] < fx.club[0] - 1 && fx.club[2] === fx.club[3], JSON.stringify(fx.club));
// 2. the summer window: only nations that play in it
const summer = JSON.parse(run(`GameState.players.forEach(function (p) { if (p.agentId === 'me') p.agentId = null; });
    GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0; Rng.seed(19);
    var isl = __mk('Iceland', 'CB', 70, 22), jpn = __mk('Japan', 'ST', 84, 25), mails0 = GameState.inbox.length;
    __to(2026, 48);
    var cu = GameState.intl.cu, m = GameState.inbox.slice(0, GameState.inbox.length - mails0).find(function (x) { return /call-ups/.test(x.subject) && /Japan/.test(x.body); });
    return JSON.stringify({ key: cu.key, nations: Object.keys(cu.squads).join(), mailNoIceland: !!m && !/Iceland/.test(m.body) });`));
check('summer: only nations that play (Japan at the Asian Cup 2027) are named; Iceland, with no summer match, is not', summer.key === '2026:3' && summer.nations === 'jpn' && summer.mailNoIceland, JSON.stringify(summer));

// ---------------- real history ----------------
console.log('\n-- history --');
const hist = JSON.parse(run(`var bad = [], n = {};
    Object.keys(INTL_HISTORY).forEach(function (k) { INTL_HISTORY[k].forEach(function (e) { [e[1], e[2]].forEach(function (id) { if (id && !NATIONS_BY_ID[id]) bad.push(k + ' ' + e[0] + ' ' + id); }); }); });
    INTL_HISTORY.WC.forEach(function (e) { n[e[1]] = (n[e[1]] || 0) + 1; });
    return JSON.stringify({ bad: bad, n: n, euro: INTL_HISTORY.EURO.filter(function (e) { return e[1] === 'esp'; }).length, copa: INTL_HISTORY.COPA.filter(function (e) { return e[1] === 'arg'; }).length });`));
check('every nation in the real history exists', hist.bad.length === 0, hist.bad.join(', '));
check('AFCON 2025: Morocco', JSON.parse(run(`return JSON.stringify(INTL_HISTORY.AFCON.slice(-1)[0]);`)).join() === '2025,mar');
const troph = JSON.parse(run(`var p = __mk('Japan', 'ST', 85, 25), I = GameState.intl;
    I.cu = { key: '2030:3', squads: { jpn: { list: [{ id: p.id, role: 'reserve' }], boost: 0 } } };
    Internationals._recordFinishes('INTL_AC', 2031, { groups: [{ teams: ['jpn', 'kor'] }], ko: {}, winner: 'jpn', runnerUp: 'kor' });
    return JSON.stringify(p.intlTrophies || []);`));
check("a title goes to every client in the winner's squad (a reserve too)", troph.length === 1 && troph[0].comp === 'INTL_AC' && troph[0].year === 2031, JSON.stringify(troph));
check('World Cups: Brazil 5, Germany 4, Italy 4, Argentina 3; Spain 4 EUROs; Argentina 16 Copas', hist.n.bra === 5 && hist.n.ger === 4 && hist.n.ita === 4 && hist.n.arg === 3 && hist.euro === 4 && hist.copa === 16, JSON.stringify(hist));

console.log(failed ? '\n*** FAIL ***' : '\nAll call-up checks passed.');
process.exit(failed ? 1 : 0);
