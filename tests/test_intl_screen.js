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
    var UI = { esc: s => (s == null ? '' : String(s)), euro: String, money: String, flag: n => '<span class="fi" data-n="' + n + '"></span>' };
    var Router = { register() {}, link: (n, id) => '#' + n + '/' + id, refresh() {}, go() {} };
    var LeaguesScreen = { renderSection() {} };`, sb);
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-intl.js', 'utf8'), sb, { filename: 'screen-intl.js' });
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
            var out = [], tabs = IntlScreen.tabs().map(function (t) { return t[0]; });
            tabs.forEach(function (t) {
                ['A', 'B', 'C'].forEach(function (L, i) {
                    IntlScreen.state.nlLeague = L; IntlScreen.state.qLeague = i === 2 ? 1 : i + 1;
                    try { out.push([t, IntlScreen.section(t)]); } catch (e) { out.push([t, 'THROW ' + e.message]); }
                });
            });
            I18n.locale = 'en';
            return JSON.stringify({ tabs: tabs, def: IntlScreen.defaultTab(), out: out });`));
        r.out.forEach(([t, html]) => {
            renders++;
            if (/^THROW/.test(html)) problems.push(`${y}/${w} ${lang} ${t}: ${html}`);
            const raw = html.match(/\bintl\.[a-zA-Z.]+/);
            if (raw) problems.push(`${y}/${w} ${lang} ${t}: raw key ${raw[0]}`);
            if (/undefined|NaN/.test(html)) problems.push(`${y}/${w} ${lang} ${t}: undefined/NaN in output`);
        });
        if (!r.tabs.includes(r.def)) problems.push(`${y}/${w}: default tab ${r.def} not among ${r.tabs}`);
    }
}
check(`every International tab renders cleanly at ${moments.length} moments of a 4-season cycle, en + de (${renders} renders)`, problems.length === 0, problems.slice(0, 4).join(' | '));
const t31 = JSON.parse(run(`__to(2031, 2); var a = IntlScreen.tabs().map(function (t) { return t[0]; }); __to(2031, 3); var b = IntlScreen.tabs().map(function (t) { return t[0]; }); return JSON.stringify([a, b]);`));
check('weeks 1-2 still show last season; in week 3 the new season (qualifying) takes over', t31[0].includes('nl') && t31[1].includes('qual') && !t31[1].includes('nl'), JSON.stringify(t31));

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
