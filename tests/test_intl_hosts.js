// Host pots (INTL_CONFIG.HOST_POTS, docs/international.md "Hosts"): every entry is one possible
// hosting, a nation alone ('ger') or a fixed group (['den', 'swe']) that only ever hosts together.
// Checks the pots as configured, the draw, and tournaments with 1-3 hosts from a pot (strict).
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

run(`Clubs.init(); GameState.startNewGame('England','Hosts','A'); GameState.save = function () {};
    __fresh = function (y, w, seed) { GameState.intl = null; GameState.seasonStartYear = y; GameState.week = w; Rng.seed(seed || 555); };
    __to = function (y, w) { while (GameState.seasonStartYear * 100 + GameState.week < y * 100 + w) {
        if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++; Internationals.sync(); } };
    __pots = JSON.parse(JSON.stringify(INTL_CONFIG.HOST_POTS)); __reset = function () { INTL_CONFIG.HOST_POTS = JSON.parse(JSON.stringify(__pots)); };
    __all = function (gs) { return gs.reduce(function (a, g) { return a.concat(g.teams); }, []); };`);

// ---------------- the pots as configured ----------------
const cfg = JSON.parse(run(`var out = {}; Object.keys(INTL_CONFIG.HOST_POTS).forEach(function (k) { if (k !== 'GOLD_CUP') out[k] = Internationals.hostPotEntries(k).bad; }); return JSON.stringify(out);`));
const badCfg = Object.keys(cfg).filter(k => cfg[k].length).map(k => `${k}: ${cfg[k].map(b => JSON.stringify(b.entry) + ' ' + b.why).join(', ')}`);
check('every entry in the configured host pots is valid', badCfg.length === 0, badCfg.join(' | '));

// ---------------- the draw ----------------
const draw = JSON.parse(run(`
    Internationals.STRICT = false; __fresh(2034, 0, 3); Internationals.sync();
    INTL_CONFIG.HOST_POTS.EURO = ['ger', ['den', 'swe'], ['den', 'nor'], 'xxx', ['den', 'cro', 'swe', 'nor'], 'arg', ['ger', 'ger']];
    var v = Internationals.hostPotEntries('EURO'), seen = {};
    for (var i = 0; i < 600; i++) { var h = Internationals._drawHosts('EURO', 'UEFA'); seen[h.join('+')] = (seen[h.join('+')] || 0) + 1; }
    __reset();
    return JSON.stringify({ ok: v.entries.map(function (g) { return g.join('+'); }), bad: v.bad.map(function (b) { return b.why; }), seen: seen });`));
check('pot entries: a nation alone or a fixed group; bad ones skipped with a reason', draw.ok.join() === 'ger,den+swe,den+nor' && draw.bad.length === 4, JSON.stringify(draw.bad));
check('only whole entries are drawn, each about equally often: Denmark never with Croatia, never alone', Object.keys(draw.seen).sort().join() === 'den+nor,den+swe,ger' && Object.values(draw.seen).every(n => n > 150), JSON.stringify(draw.seen));
const rules = JSON.parse(run(`
    INTL_CONFIG.HOST_POTS.WORLD_CUP = [['eng', 'fra', 'ger'], ['usa', 'can', 'mex'], ['northern-mariana-islands']];
    INTL_CONFIG.HOST_POTS.ANL_FINALS = [['egy', 'mar'], 'nga'];
    INTL_CONFIG.HOST_POTS.ASIAN_CUP = ['northern-mariana-islands', 'nzl'];
    var r = { wc: Internationals.hostPotEntries('WORLD_CUP'), anl: Internationals.hostPotEntries('ANL_FINALS'), ac: Internationals.hostPotEntries('ASIAN_CUP') };
    __reset();
    return JSON.stringify({ wc: r.wc.entries.length, wcBad: r.wc.bad.map(function (b) { return b.why; }), anl: r.anl.entries.length, ac: r.ac.entries.length, acBad: r.ac.bad.map(function (b) { return b.why; }) });`));
check('the rules: at most 2 UEFA nations in a World Cup entry, FIFA members only; one Finals venue; AFC members (outside FIFA too) for the Asian Cup',
    rules.wc === 1 && rules.wcBad.length === 2 && rules.anl === 1 && rules.ac === 1 && /AFC/.test(rules.acBad[0]), JSON.stringify(rules));

// ---------------- whole tournaments with hosts from a pot (strict) ----------------
const t3 = JSON.parse(run(`
    Internationals.STRICT = true;
    INTL_CONFIG.HOST_POTS.EURO = [['den', 'swe', 'nor']];
    INTL_CONFIG.HOST_POTS.WORLD_CUP = [['usa', 'can', 'mex']];
    INTL_CONFIG.HOST_POTS.ASIAN_CUP = [['qat', 'uae'], ['jor', 'irq']];
    INTL_CONFIG.HOST_POTS.AFCON = [['sen', 'gambia'], ['egy', 'tun'], ['cmr', 'gab']];
    INTL_CONFIG.HOST_POTS.OFC_NATIONS_CUP = [['fij', 'samoa'], ['tah', 'tonga'], ['ncl', 'vanuatu']];
    __fresh(2034, 0, 9); __to(2036, 2);
    var I = GameState.intl, E = I.seasons[2035], A = E.ao.ac, F = E.caf.afq, O = E.ao.onc;
    var et = __all(E.tour.groups), at = __all(A.tour.groups), ft = __all(F.tour.groups), ot = __all(O.tour.groups);
    __to(2038, 2);
    var W = I.seasons[2037], wt = __all(W.tour.groups);
    var hin = function (hs, t) { return hs.every(function (h) { return t.indexOf(h) >= 0; }); };
    __reset();
    return JSON.stringify({ euro: [et.length, E.hosts.join('+'), hin(E.hosts, et)], wc: [wt.length, W.hosts.join('+'), hin(W.hosts, wt)], ac: [at.length, A.hosts.join('+'), hin(A.hosts, at)],
        afcon: [ft.length, F.hosts.join('+'), hin(F.hosts, ft)], onc: [ot.length, O.hosts.join('+'), hin(O.hosts, ot)], warn: I.warnings.length,
        prev: [I.hosts['AC-2032'], I.hosts['AFCON-2032'], I.hosts['ONC-2032'], I.hosts['AFCON-2028'], I.hosts['ONC-2028']].map(function (h) { return h.join('+'); }) });`));
const other = (prev, a, b) => prev === a ? b : a;
const third = (p1, p2, all) => all.find(x => x !== p1 && x !== p2);
check('EURO 2036 with 3 co-hosts (32 teams), World Cup 2038 with 3 (48), Asian Cup, AFCON and OFC Nations Cup with a pair (never a pair from the last two editions): all hosts in, no warnings',
    t3.euro.join() === '32,den+swe+nor,true' && t3.wc.join() === '48,usa+can+mex,true' && t3.ac.join() === '24,' + other(t3.prev[0], 'qat+uae', 'jor+irq') + ',true' && t3.afcon.join() === '28,' + third(t3.prev[1], t3.prev[3], ['sen+gambia', 'egy+tun', 'cmr+gab']) + ',true' && t3.onc.join() === '8,' + third(t3.prev[2], t3.prev[4], ['fij+samoa', 'tah+tonga', 'ncl+vanuatu']) + ',true' && t3.warn === 0, JSON.stringify(t3));

// ---------------- rotation ----------------
const rot = JSON.parse(run(`
    Internationals.STRICT = false; var out = { wcBad: [], euro: [], first: [] };
    for (var seed = 1; seed <= 6; seed++) {
        __fresh(2026, 0, seed * 101); Internationals.sync();
        var conf = function (k) { return Internationals.hostsForKey(k).map(function (id) { return Internationals.conf(id); }); };
        var hist = { 2026: ['CONCACAF'], 2030: conf('WC-2030'), 2034: conf('WC-2034') };
        for (var y = 2038; y <= 2078; y += 4) {
            hist[y] = conf('WC-' + y);
            hist[y].forEach(function (c) { if (hist[y - 4].indexOf(c) >= 0 || hist[y - 8].indexOf(c) >= 0) out.wcBad.push(y + ' ' + c); });
        }
        var H = function (k) { return Internationals.hostsForKey(k).join('+'); };
        out.first.push([H('COPA-2028'), H('AFCON-2028'), H('AC-2032'), H('ONC-2028')].join(' '));
    }
    INTL_CONFIG.HOST_POTS.EURO = ['ger', 'fra', ['den', 'swe']];
    __fresh(2026, 0, 5); Internationals.sync();
    for (var e = 2036; e <= 2068; e += 4) out.euro.push(Internationals.hostsForKey('EURO-' + e).join('+'));
    __reset();
    return JSON.stringify(out);`));
check('World Cups 2038-2078 (6 saves): no confederation hosts within two World Cups of its last one', rot.wcBad.length === 0, rot.wcBad.join(', '));
check('continental: with three possible hostings the EURO rotates a, b, c, a, b, c', rot.euro.every((h, i) => i < 3 || h === rot.euro[i - 3]) && new Set(rot.euro.slice(0, 3)).size === 3, rot.euro.join(' | '));
check('the first draws know the real hosts: no Copa 2028 in the USA or Brazil, no AFCON 2028 in Morocco or East Africa, no Asian Cup 2032 in Saudi Arabia or Qatar, no OFC Nations Cup 2028 in Vanuatu or Papua New Guinea',
    rot.first.every(l => { const [c, a, s, o] = l.split(' '); return !/usa|bra/.test(c) && !/mar|kenya|tanzania|uga/.test(a) && !/ksa|qat/.test(s) && !/vanuatu|papua/.test(o); }), rot.first.join(' | '));

console.log(failed ? '\n*** FAIL ***' : '\nAll host pot checks passed.');
process.exit(failed ? 1 : 0);
