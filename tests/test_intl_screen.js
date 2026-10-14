// Competitions > International (ui/js/screen-intl.js): every tab renders, at every phase of a
// four-season cycle, in English and German, without throwing and without a raw 'intl.' key showing.
// Plus: every national team has a flag (map entry, CSS rule and the image file itself).
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const noop = () => {};
const sb = { console: { log: noop, warn: noop, error: noop }, Math, Date, JSON, setTimeout: () => 0, clearTimeout: noop,
    setInterval: () => 0, clearInterval: noop, indexedDB: undefined, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: { addEventListener: noop, getElementById: () => null, querySelector: () => null }, addEventListener: noop, removeEventListener: noop };
sb.window = sb; vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
for (const l of ['en', 'de']) vm.runInContext(fs.readFileSync(root + `ui/js/i18n-${l}.js`, 'utf8'), sb, { filename: `ui-${l}` });
vm.runInContext(`
    var UI = { esc: s => (s == null ? '' : String(s)), euro: String, money: String, ordinal: n => n + '.', ratingText: v => (v || 0).toFixed(2), flag: n => '<span class="fi" data-n="' + n + '"></span>' };
    var Router = { register() {}, link: (n, id) => '#' + n + '/' + id, refresh() {}, go() {}, sheet(h) { __sheet = h; } };
    var LeaguesScreen = { renderSection() {} };`, sb);
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-intl.js', 'utf8'), sb, { filename: 'screen-intl.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-intl-americas.js', 'utf8'), sb, { filename: 'screen-intl-americas.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-intl-caf.js', 'utf8'), sb, { filename: 'screen-intl-caf.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-intl-asia.js', 'utf8'), sb, { filename: 'screen-intl-asia.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-nation.js', 'utf8'), sb, { filename: 'screen-nation.js' });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(9); Clubs.init(); GameState.startNewGame('England','S','A'); GameState.save = function () {};
    __to = function (y, w) { while (GameState.seasonStartYear * 100 + GameState.week < y * 100 + w) {
        if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++; Internationals.sync(); } };`);
const moments = [[2026, 2], [2026, 12], [2026, 19], [2026, 37], [2026, 50], [2027, 2], [2027, 12], [2027, 19], [2027, 37], [2027, 50],
    [2028, 2], [2028, 20], [2029, 18], [2029, 37], [2029, 51], [2030, 1], [2030, 2], [2030, 40]];
const problems = [];
let renders = 0;
for (const [y, w] of moments) {
    run(`__to(${y}, ${w});`);
    for (const lang of ['en', 'de']) {
        const r = JSON.parse(run(`
            I18n.locale = '${lang}';
            var out = [], tabs = [], defs = [];
            IntlScreen.CONFS.forEach(function (conf) {
                IntlScreen.state.conf = conf;
                var ct = IntlScreen.tabs().map(function (t) { return t[0]; });
                tabs = tabs.concat(ct); defs.push([conf, IntlScreen.defaultTab(), ct]);
                ct.forEach(function (t) {
                    ['A', 'B', 'C'].forEach(function (L, i) {
                        IntlScreen.state.nlLeague = L; IntlScreen.state.qLeague = i === 2 ? 1 : i + 1;
                        try { out.push([conf + ':' + t, IntlScreen.section(t)]); } catch (e) { out.push([conf + ':' + t, 'THROW ' + e.message]); }
                    });
                });
            });
            IntlScreen.state.conf = 'UEFA';
            I18n.locale = 'en';
            return JSON.stringify({ tabs: tabs, defs: defs, out: out });`));
        r.out.forEach(([t, html]) => {
            renders++;
            if (/^THROW/.test(html)) problems.push(`${y}/${w} ${lang} ${t}: ${html}`);
            const raw = html.match(/\bintl\.[a-zA-Z.]+/);
            if (raw) problems.push(`${y}/${w} ${lang} ${t}: raw key ${raw[0]}`);
            if (/undefined|NaN/.test(html)) problems.push(`${y}/${w} ${lang} ${t}: undefined/NaN in output`);
        });
        r.defs.forEach(([conf, def, ct]) => { if (!ct.includes(def)) problems.push(`${y}/${w} ${conf}: default tab ${def} not among ${ct}`); });
    }
}
check(`every International tab renders cleanly at ${moments.length} moments of a 4-season cycle, en + de (${renders} renders)`, problems.length === 0, problems.slice(0, 4).join(' | '));
const t31 = JSON.parse(run(`__to(2031, 2); var a = IntlScreen.tabs().map(function (t) { return t[0]; }); __to(2031, 3); var b = IntlScreen.tabs().map(function (t) { return t[0]; }); return JSON.stringify([a, b]);`));
check('weeks 1-2 still show last season; in week 3 the new season (qualifying) takes over', t31[0].includes('nl') && t31[1].includes('qual') && !t31[1].includes('nl'), JSON.stringify(t31));

// the League 2 tab of qualifying: the button hands over '2' as TEXT (this used to do nothing)
const l2 = JSON.parse(run(`__to(2031, 30); IntlScreen.state.conf = 'UEFA'; IntlScreen.setQLeague('2'); var a = IntlScreen.section('qual');
    IntlScreen.setQLeague('1'); var b = IntlScreen.section('qual'); return JSON.stringify({ two: /L2-1/.test(a) && !/L1-1/.test(a), one: /L1-1/.test(b) });`));
check('the League 2 tab of qualifying opens League 2 (and League 1 back)', l2.two && l2.one, JSON.stringify(l2));
const confs = JSON.parse(run(`__to(2033, 20); IntlScreen.state.conf = 'CAF'; var teams = IntlScreen.section('teams'); IntlScreen.state.conf = 'UEFA';
    return JSON.stringify({ teams: (teams.match(/<tr[ >]/g) || []).length });`));
check('the Nations tab lists a confederation (Africa: 54 + the header row)', confs.teams === 55, JSON.stringify(confs));
// Asia and Oceania: every tab and Nations League view, at a moment of each season type
const ao = JSON.parse(run(`var out = {}, bad = [], ko = '', po = '', ac = '', onc = '', info = {}; GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0; Rng.seed(41);
    [[2026, 20], [2027, 2], [2027, 20], [2028, 2], [2028, 20], [2029, 12], [2029, 20], [2030, 1], [2030, 20], [2030, 40], [2031, 1], [2031, 20], [2032, 2]].forEach(function (m) { __to(m[0], m[1]);
        ['AFC', 'OFC'].forEach(function (c) { IntlScreen.state.conf = c; var tabs = IntlScreen.tabs().map(function (t) { return t[0]; }); out[m.join('/') + ' ' + c] = tabs;
            var def = IntlScreen.defaultTab(); if (tabs.indexOf(def) < 0) bad.push(m.join('/') + ' ' + c + ': default ' + def);
            tabs.forEach(function (t) { ['1', '2', '3', 'KO'].forEach(function (v) { IntlScreen.state.afcView = v;
                var h; try { h = IntlScreen.section(t); } catch (e) { h = 'THROW ' + e.message; }
                if (/THROW|undefined|NaN|\bintl\.[a-z]/.test(h)) bad.push(m.join('/') + ' ' + c + ' ' + t + '/' + v + ': ' + (h.match(/THROW.*|undefined|NaN|\bintl\.[a-zA-Z.]+/) || [''])[0]);
                if (t === 'afcnl' && v === 'KO' && m.join('/') === '2031/1') ko = h;
                if (t === 'afcnl' && v === 'KO' && m.join('/') === '2029/20') po = h;
                if (t === 'ac' && m.join('/') === '2027/2') ac = h;
                if (t === 'onc' && m.join('/') === '2028/2') onc = h; }); });
            if (m.join('/') === '2032/2') info[c] = IntlScreen.section('info'); }); });
    IntlScreen.state.conf = 'UEFA';
    return JSON.stringify({ out: out, bad: bad, ko: /Play-offs Division 1.2/.test(ko) && /Asian Nations Series winner/.test(ko), po: /AFC play-off/.test(po) && /Division 1 ranking/.test(po),
        ac: /Asian Nations Cup 2027 winner/.test(ac) && /the real draw/.test(ac), onc: /Oceania Nations Cup 2028 winner/.test(onc) && /Qualifying/.test(onc),
        info: /Asian Nations Cup/.test(info.AFC) && /Asian Nations Series/.test(info.AFC) && /Oceania Nations Cup/.test(info.OFC) });`));
check('Asia and Oceania: every tab and Nations League view renders cleanly at 13 moments, default tabs valid', ao.bad.length === 0, ao.bad.slice(0, 4).join(' | '));
check('Asia: Asian Cup 2027, the Nations League from 2028-29 (World Cup edition, then the Asian Cup edition 2030-31); Oceania: qualifying in 2028-29, the Nations Cup 2028',
    ao.out['2026/20 AFC'].includes('ac') && !ao.out['2027/20 AFC'].includes('afcnl') && ao.out['2028/20 AFC'].includes('afcnl') && ao.out['2030/20 AFC'].includes('afcnl')
    && ao.out['2027/20 OFC'].includes('onc') && ao.out['2028/20 OFC'].includes('ofcq'), JSON.stringify(ao.out));
check('Asia: knockouts with the Finals and the division play-offs; the AFC play-off with the ranking; the Asian Cup 2027 from the real draw', ao.ko && ao.po && ao.ac, JSON.stringify({ ko: ao.ko, po: ao.po, ac: ao.ac }));
check('Oceania: the Nations Cup with its qualifying; the roll of honour lists the Asian Cup, the Nations League and the Nations Cup', ao.onc && ao.info, JSON.stringify({ onc: ao.onc, info: ao.info }));
// Africa: AFCON (qualifiers -> tournament), the Nations Series (zones -> Finals), World Cup qualifying, the roll of honour
const caf = JSON.parse(run(`var out = {}, bad = [], fin = ''; GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0; Rng.seed(37);
    [[2026, 20], [2027, 2], [2028, 20], [2029, 12], [2030, 1], [2030, 20], [2031, 2], [2032, 2]].forEach(function (m) { __to(m[0], m[1]);
        IntlScreen.state.conf = 'CAF'; var tabs = IntlScreen.tabs().map(function (t) { return t[0]; }); out[m.join('/')] = tabs;
        if (m[0] === 2031) { IntlScreen.state.anlView = 'FINALS'; fin = IntlScreen.section('anl'); }
        tabs.forEach(function (t) { ['NORTH', 'WEST', 'EAST', 'CS', 'FINALS'].forEach(function (v) { IntlScreen.state.anlView = v;
            var h; try { h = IntlScreen.section(t); } catch (e) { h = 'THROW ' + e.message; }
            if (/THROW|undefined|NaN|\bintl\.[a-z]/.test(h)) bad.push(m.join('/') + ' ' + t + '/' + v + ': ' + (h.match(/THROW.*|undefined|NaN|\bintl\.[a-zA-Z.]+/) || [''])[0]); }); }); });
    IntlScreen.state.conf = 'CAF'; var info = IntlScreen.section('info');
    IntlScreen.state.conf = 'UEFA';
    return JSON.stringify({ out: out, bad: bad, honours: /African Nations Cup/.test(info) && /African Nations Series/.test(info), finals: /Through to the Finals/.test(fin) && /Finals venue/.test(fin) });`));
check('Africa: every tab and Nations Series view renders cleanly at 8 moments', caf.bad.length === 0, caf.bad.slice(0, 4).join(' | '));
check('Africa: AFCON in 2026-27, World Cup qualifying in 2028-30, the Nations Series from 2030, AFCON again in 2031-32',
    caf.out['2026/20'].includes('afcon') && caf.out['2028/20'].includes('cafq') && caf.out['2030/1'].includes('cafq') && caf.out['2030/20'].includes('anl')
    && caf.out['2031/2'].includes('anl') && caf.out['2032/2'].includes('afcon'), JSON.stringify(caf.out));
check('Africa: AFCON and the Nations Series are on the roll of honour; the Finals list who got there and where', caf.honours && caf.finals);
// the Americas: every tab at a moment of each season type (the cycle runs 2026-2030 above)
const amTabs = JSON.parse(run(`var out = {}; GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0; Rng.seed(31);
    [[2027, 20], [2028, 40], [2029, 51], [2030, 1]].forEach(function (m) { __to(m[0], m[1]);
        ['CONMEBOL', 'CONCACAF'].forEach(function (c) { IntlScreen.state.conf = c; out[m.join('/') + ' ' + c] = IntlScreen.tabs().map(function (t) { return t[0]; }); }); });
    IntlScreen.state.conf = 'UEFA'; return JSON.stringify(out);`));
check('South America shows its qualifying table and the Copa; North & Central America its Nations Series, Gold Cup and qualifying',
    amTabs['2027/20 CONMEBOL'].includes('cmq') && amTabs['2028/40 CONCACAF'].includes('cnl') && amTabs['2028/40 CONCACAF'].includes('gold') && amTabs['2029/51 CONCACAF'].includes('ccq'), JSON.stringify(amTabs));
// a nation's page: overview (bands, titles with the real ones, best ever, tournaments) and its matches
const nat = JSON.parse(run(`var el = { innerHTML: '' }, out = {};
    ['bra', 'isl', 'fij', 'arg'].forEach(function (id) { ['overview', 'matches'].forEach(function (t) { NationScreen.state.tab = t; NationScreen.render(el, id); out[id + ':' + t] = el.innerHTML; }); });
    NationScreen.state.tab = 'overview';
    var bad = Object.keys(out).filter(function (k) { return /undefined|NaN|(^|[^a-z])(nat|intl)[.][a-z]/.test(out[k]); });
    var B = Internationals.callupBands('isl'); return JSON.stringify({ bad: bad, braTitles: /World Nations Cup ×5/.test(out['bra:overview']), islBands: !/Skill level/.test(out['isl:overview']) && out['isl:overview'].indexOf(B.star + '+') < 0,
        fijMatches: /frow/.test(out['fij:matches']) || /No matches/.test(out['fij:matches']), argBest: /Winner/.test(out['arg:overview']), link: /nation.fij/.test(IntlScreen.nation('fij')) });`));
check("a nation's page renders (overview + matches) for four nations, without raw keys", nat.bad.length === 0, nat.bad.join(', '));
check('Brazil shows its 5 real World Cups; no skill level or call-up bands on a nation page; nation names link to the page', nat.braTitles && nat.islBands && nat.argBest && nat.link, JSON.stringify(nat));
check('the confederations show under generic names', !/>UEFA<|>CONMEBOL</.test(run(`return IntlScreen.confPicker();`)));

// the South American qualifying fixtures in matchday order (they are stored 1, 10, 2, 11, ...);
// the Asian Cup bracket is the EURO 24 one (its quarter-finals pair R16 3+1, 5+6, 4+2, 7+8)
const order = JSON.parse(run(`GameState.intl = null; GameState.seasonStartYear = 2026; GameState.week = 0; Rng.seed(31); __to(2028, 2);
    IntlScreen.state.conf = 'CONMEBOL'; var h = IntlScreen.cmqView(); IntlScreen.state.conf = 'UEFA';
    var mds = (h.match(/Matchday [0-9]+/g) || []).map(function (x) { return +x.split(' ')[1]; });
    var S = GameState.intl.seasons[2026], T = S.ao.ac.tour, ac = IntlScreen.acView(S);
    return JSON.stringify({ mds: mds, sorted: mds.every(function (v, i) { return i === 0 || mds[i - 1] < v; }), acBracket: ac.indexOf(IntlScreen.bracket(T)) >= 0 });`));
check('South American qualifying: matchdays listed in order', order.mds.length >= 8 && order.sorted, JSON.stringify(order.mds));
check('the Asian Cup uses the EURO 24 bracket (Round of 16 laid out by the quarter-final it feeds)', order.acBracket);
const past = JSON.parse(run(`var el = { innerHTML: '' }; NationScreen.state.tab = 'overview'; NationScreen.render(el, 'isl');
    var P = NationScreen.pastPerformances('isl'); return JSON.stringify({ rows: P.map(function (r) { return r.label + ' ' + r.text; }), shown: P.length > 0 && el.innerHTML.indexOf(P[0].text) >= 0 });`));
check("past performances: every Nations League edition with its league and position (like a club's league finishes)", past.shown && past.rows.some(r => /League [ABC] · [0-9]/.test(r)), JSON.stringify(past.rows));

// flags for every nation: map entry -> CSS rule -> file on disk
const shim = fs.readFileSync(root + 'ui/js/shim.js', 'utf8');
const isoSrc = shim.slice(shim.indexOf('const NATIONALITY_ISO'), shim.indexOf('};', shim.indexOf('const NATIONALITY_ISO')) + 2);
const ctx = {}; vm.createContext(ctx); vm.runInContext(isoSrc.replace('const NATIONALITY_ISO', 'this.ISO'), ctx);
const css = fs.readFileSync(root + 'ui/vendor/flag-icons/flag-icons.css', 'utf8');
const names = JSON.parse(run('return JSON.stringify(NATIONS.map(function (n) { return n.name; }));'));
const missing = names.filter(n => {
    const code = ctx.ISO[n]; if (!code) return true;
    const m = css.match(new RegExp('\\.fi-' + code + '\\{background-image:url\\(flags/4x3/([^)]+)\\)\\}'));
    return !m || !fs.existsSync(root + 'ui/vendor/flag-icons/flags/4x3/' + m[1]);
});
check(`all ${names.length} national teams have a flag (map, CSS rule, file)`, missing.length === 0, missing.join(', '));
check("Côte d'Ivoire players get their flag now", !!ctx.ISO["Côte d'Ivoire"]);

console.log(failed ? '\n*** FAIL ***' : '\nAll International screen checks passed.');
process.exit(failed ? 1 : 0);
