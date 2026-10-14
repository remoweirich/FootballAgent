// The fixture list ahead (js/intl-schedule.js): knockout rounds pre-filled as soon as their teams are
// known (and then played exactly so), friendlies arranged ahead (no repeat within 104 weeks, at least
// half against another confederation), Nations League positions, the host boost, the week summary,
// international achievements. Strict mode over eight seasons.
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

const r = JSON.parse(run(`Internationals.STRICT = true; Rng.seed(31); Clubs.init(); GameState.startNewGame('England','Sch','A'); GameState.save = function () {};
    GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0;
    var I, out = { missed: [], ahead: 0, frScheduled: 0, frPlayed: 0, snaps: {} };
    var key = function (h, a) { return h < a ? h + '|' + a : a + '|' + h; };
    var step = function () {
        // what the game says is coming next week...
        var y = GameState.seasonStartYear, w = GameState.week, ny = w >= 52 ? y + 1 : y, nw = w >= 52 ? 1 : w + 1;
        var known = GameState.intl ? Internationals.knownFixtures() : [], L = Internationals._absKey(nw <= 2 ? ny - 1 : ny, nw);
        var next = known.filter(function (f) { return f.L === L; });
        GameState.seasonStartYear = ny; GameState.week = nw; Internationals.sync();
        I = GameState.intl;
        // ...is what is played (the same two teams, that week)
        var played = new Set((I.res || []).filter(function (e) { return e[0] === L; }).map(function (e) { return key(e[1], e[2]); }));
        next.forEach(function (f) {
            if (f.c === 'INTL_FRIENDLY') { out.frScheduled++; if (played.has(key(f.h, f.a))) out.frPlayed++; return; }
            out.ahead++; if (!played.has(key(f.h, f.a))) out.missed.push(ny + '/' + nw + ' ' + f.c + ' ' + f.st + ' ' + f.h + '-' + f.a);
        });
        // snapshots: brackets pre-filled before they are played
        var S = I.seasons[ny <= 2 ? ny - 1 : ny], P = I.seasons[ny - 1];
        if (ny === 2027 && nw === 52) out.snaps.euroQf = (I.seasons[2027].tour.ko.qf || []).map(function (m) { return [m.h, m.a, m.hg == null]; });
        if (ny === 2027 && nw === 51) out.snaps.afconR16 = (I.seasons[2027].caf.afq.tour.ko.r16 || []).filter(function (m) { return m.hg == null; }).length;
        if (ny === 2029 && nw === 52) out.snaps.wcR16 = (I.seasons[2029].tour.ko.r16 || []).filter(function (m) { return m.hg == null && m.h && m.a; }).length;
        if (ny === 2028 && nw === 1) out.snaps.euroQfPlayed = I.seasons[2027].tour.ko.qf.map(function (m) { return [m.h, m.a]; });
        if (ny === 2026 && nw === 9) out.snaps.fsAt9 = (I.fs || []).length;
    };
    while (GameState.seasonStartYear * 100 + GameState.week < 2034 * 100 + 3) step();
    // friendlies: no repeat within 104 weeks, at least half against another confederation
    var fr = Internationals._compCode('INTL_FRIENDLY'), seen = {}, repeats = 0, cross = 0, n = 0, bra = [];
    // (the results list only keeps 104 weeks: every pair in it is inside the window)
    I.res.forEach(function (e) { if (e[5] !== fr) return; n++; var k = key(e[1], e[2]); if (seen[k]) repeats++; seen[k] = 1;
        if (Internationals.conf(e[1]) !== Internationals.conf(e[2])) cross++; if (e[1] === 'bra' || e[2] === 'bra') bra.push(e[1] === 'bra' ? e[2] : e[1]); });
    out.fr = { n: n, repeats: repeats, cross: Math.round(cross / Math.max(1, n) * 100), bra: bra };
    // Nations League positions
    var nlp = I.nlp, cnt = function (comp, season) { var c = 0, pos = {}; Object.keys(nlp).forEach(function (id) { nlp[id].forEach(function (x) { if (x[0] === comp && x[1] === season) { c++; pos[x[2]] = (pos[x[2]] || 0) + 1; } }); }); return [c, pos]; };
    out.nl = { uefa2030: cnt('INTL_NL', 2030), cnl2030: cnt('INTL_CNL', 2030), afc2032: cnt('INTL_AFCNL', 2032) };
    // the host boost
    var T = { hosts: ['ger'], md1Only: [], key: 'EURO-2036' };
    var o1 = Internationals._tourOpts(T, 'ger', 'fra', 49, 'A', 'group', 1), o2 = Internationals._tourOpts(T, 'fra', 'esp', 49, 'A', 'qf', 1);
    out.boost = [o1.bH, Internationals._tourOpts(T, 'fra', 'ger', 49, 'A', 'group', 1).bA, o2.bH, o1.advH || o1.advA || o2.advH ? 'adv' : 'noadv'];
    return JSON.stringify(out);`));
check(`every fixture announced for the coming week is played that week by the same two teams (${r.ahead} competitive fixtures)`, r.ahead > 2000 && r.missed.length === 0, r.missed.slice(0, 5).join(' | '));
check('brackets pre-filled: EURO 2028 quarter-finals set after the Round of 16 (week 52), and played exactly so; AFCON 2028 Round of 16 after the groups; World Cup 2030 Round of 16 after the Round of 32',
    r.snaps.euroQf.length === 4 && r.snaps.euroQf.every(m => m[2]) && JSON.stringify(r.snaps.euroQf.map(m => [m[0], m[1]])) === JSON.stringify(r.snaps.euroQfPlayed) && r.snaps.afconR16 === 8 && r.snaps.wcR16 === 8, JSON.stringify(r.snaps));
check(`friendlies are arranged ahead (week 8 for weeks 11-12) and played (${r.frPlayed} of ${r.frScheduled}; a competitive match coming up calls one off)`, r.snaps.fsAt9 > 50 && r.frPlayed >= r.frScheduled * 0.95, JSON.stringify([r.snaps.fsAt9, r.frPlayed, r.frScheduled]));
check(`friendlies: never the same pair within 104 weeks (${r.fr.n} played), ${r.fr.cross}% against another confederation (at least half)`, r.fr.repeats === 0 && r.fr.cross >= 50, JSON.stringify(r.fr));
check(`Brazil's friendlies of the last two seasons: all different opponents (${r.fr.bra.join(', ')})`, new Set(r.fr.bra).size === r.fr.bra.length);
check('Nations League positions: UEFA 54 (18 per league), CONCACAF 41, AFC 47 (18 / 18 / 11) per edition',
    r.nl.uefa2030[0] === 54 && r.nl.uefa2030[1].A === 18 && r.nl.cnl2030[0] === 41 && r.nl.afc2032[0] === 47 && r.nl.afc2032[1]['3'] === 11, JSON.stringify(r.nl));
check('a tournament has no home advantage: only a host gets +2 (Spain v Argentina in Italy: nothing for either)', r.boost.join() === '2,2,0,noadv', JSON.stringify(r.boost));

// the week summary + achievements
const w = JSON.parse(run(`GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0; Rng.seed(5);
    var p = GameState.players.find(function (x) { return !x.agentId && x.clubId && !x.retired; });
    p.agentId = 'me'; p.everClient = true; p.nationality = 'Iceland'; p.position = 'ST'; p.ability = 80; p.age = 24; p.injury = null;
    Internationals.sync();
    while (GameState.week < 9) { GameState.week++; Internationals.sync(); }
    var res = Sim.advanceWeek(), ev = res.events.map(function (e) { return e.text; });
    p.intlStats = { 2026: { INTL_NL: { apps: 50, goals: 50, assists: 0, cs: 0, yellow: 0, red: 0, ratingSum: 350 } } };
    p.intlTrophies = [{ comp: 'INTL_AFCON', year: 2027, nation: 'isl', season: 2026 }, { comp: 'INTL_CNL', year: 2026, nation: 'isl', season: 2026 }];
    Achievements.refresh(); var u = Achievements.state().unlocked;
    return JSON.stringify({ week: GameState.week, event: ev.filter(function (t) { return /call-ups/.test(t); }), ach: ['caps1', 'caps50', 'caps100', 'intlGoals50', 'intlGoals100', 'intlCont', 'intlNL', 'intlWC'].map(function (k) { return k + ':' + !!u[k]; }).join(' ') });`));
check('advancing into the call-up week: the week summary names who is called up', w.week === 10 && w.event.length === 1 && /Iceland/.test(w.event[0]), JSON.stringify(w));
check('achievements: debut, 50 caps, 50 international goals, a continental title, a Nations League (not 100 caps, 100 goals or the World Cup yet)',
    w.ach === 'caps1:true caps50:true caps100:false intlGoals50:true intlGoals100:false intlCont:true intlNL:true intlWC:false', w.ach);

console.log(failed ? '\n*** FAIL ***' : '\nAll schedule checks passed.');
process.exit(failed ? 1 : 0);
