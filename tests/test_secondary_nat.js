// Secondary nationalities (js/names-data.js SECONDARY_NATIONALITIES): weighted lists per country from
// official immigration statistics, with regional differences. Every nationality named must have a name
// list and a flag (a missing one would give a player a fallback name and no flag), every region key must
// be a real region id, and the regional differences must show up in the draws. Also: a town name used in
// two countries (Bocholt) puts each club in its own country's region.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, addEventListener() {} };
sb.window = sb;
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
const shim = fs.readFileSync(root + 'ui/js/shim.js', 'utf8'), a = shim.indexOf('const NATIONALITY_ISO'), b = shim.indexOf('\n};', a);
vm.runInContext(shim.slice(a, b + 3).replace('const NATIONALITY_ISO', 'var NATIONALITY_ISO'), sb);
const css = fs.readFileSync(root + 'ui/vendor/flag-icons/flag-icons.css', 'utf8');
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

const d = JSON.parse(vm.runInContext(`JSON.stringify({ S: SECONDARY_NATIONALITIES, N: Object.keys(NAMES_DATABASE), I: NATIONALITY_ISO,
    R: Object.fromEntries(Object.entries(REGIONS_BY_COUNTRY).map(function (e) { return [e[0], e[1].map(function (x) { return x.id; })]; })) })`, sb));
const noNames = [], noFlag = [], badRegion = [];
for (const k in d.S) {
    const [c, reg] = k.split('/');
    if (reg && !(d.R[c] || []).includes(reg)) badRegion.push(k);
    const v = d.S[k];
    for (const n of Array.isArray(v) ? v : Object.keys(v)) {
        if (!d.N.includes(n)) noNames.push(n);
        if (!d.I[n] || !css.includes('.fi-' + d.I[n])) noFlag.push(n);
    }
}
check('every secondary nationality has a name list, got missing ' + JSON.stringify([...new Set(noNames)]), !noNames.length);
check('every secondary nationality has a flag, got missing ' + JSON.stringify([...new Set(noFlag)]), !noFlag.length);
check('every region entry is a real region id, got bad ' + JSON.stringify(badRegion), !badRegion.length);
check('every country with clubs has a weighted list', ['Netherlands', 'Germany', 'Switzerland', 'Belgium', 'France', 'Spain', 'Italy', 'England', 'Portugal'].every(c => d.S[c] && !Array.isArray(d.S[c])));

const share = (c, r, nat) => vm.runInContext(`(function () { Rng.seed(3); var n = 0; for (var i = 0; i < 10000; i++) if (getRegionSecondaryNationality(${JSON.stringify(c)}, ${JSON.stringify(r)}) === ${JSON.stringify(nat)}) n++; return n / 10000; })()`, sb);
const pair = (label, c, r, nat) => { const x = share(c, r, nat), y = share(c, null, nat); check(label + ` (${(x * 100).toFixed(1)}% vs ${(y * 100).toFixed(1)}% in the country)`, x > y * 1.3); };
pair('eastern Germany draws more Poles', 'Germany', 'ostdeutschland', 'Poland');
pair('Wallonia draws more French', 'Belgium', 'S-O Belgique', 'France');
pair('Flanders draws more Dutch', 'Belgium', 'Noord België', 'Netherlands');
pair('Paris draws more Malians', 'France', 'centre France', 'Mali');
pair('London draws more Jamaicans', 'England', 'greater-london', 'Jamaica');
pair('Lisbon draws more Cape Verdeans', 'Portugal', 'Lisbon', 'Cape Verde');
check('eastern Germany draws fewer Turks than the country', share('Germany', 'ostdeutschland', 'Türkiye') < share('Germany', null, 'Türkiye') / 2);

// football affinity: a big community that plays another sport first never weighs more than the cap
const caps = JSON.parse(vm.runInContext(`(function () { var over = [];
    Object.keys(SECONDARY_NATIONALITIES).forEach(function (k) { var c = k.split('/')[0], r = k.split('/')[1] || null, L = secondaryNationalities(c, r);
        if (Array.isArray(L)) return;
        Object.keys(FOOTBALL_AFFINITY).forEach(function (n) { if (L[n] != null && L[n] > FOOTBALL_AFFINITY_CAP + 1e-9) over.push(k + ': ' + n + ' ' + L[n]); }); });
    return JSON.stringify({ over: over, cap: FOOTBALL_AFFINITY_CAP, india: secondaryNationalities('England', null).India, poland: secondaryNationalities('England', null).Poland }); })()`, sb));
check('cricket and baseball nations stay at or under the cap (' + caps.cap + '), got over ' + JSON.stringify(caps.over), !caps.over.length && caps.cap <= 0.5);
check('in England, India (the largest group) now weighs less than Poland, got ' + caps.india + ' vs ' + caps.poland, caps.india < caps.poland);

// the five added nationalities: names, flag, a national team that picks them, and somewhere to come from
const added = ['Curaçao', 'Venezuela', 'Syria', 'Bangladesh', 'Afghanistan'];
const nat = JSON.parse(vm.runInContext(`JSON.stringify(NATIONS_RAW.filter(function (n) { return n.nationality; }).map(function (n) { return n.nationality; }))`, sb));
const listed = new Set(Object.values(d.S).flatMap(v => Array.isArray(v) ? v : Object.keys(v)));
check('Curaçao, Venezuela, Syria, Bangladesh, Afghanistan have names, a flag, a national team and a list to come from',
    added.every(n => d.N.includes(n) && d.I[n] && css.includes('.fi-' + d.I[n]) && nat.includes(n) && listed.has(n)));
pair('Madeira and the Azores draw more Venezuelans', 'Portugal', 'Ilhas', 'Venezuela');
pair('Rotterdam and The Hague draw more Curaçaoans', 'Netherlands', 'zuid-holland', 'Curaçao');

const boc = JSON.parse(vm.runInContext(`Clubs.init(); JSON.stringify(Clubs.allClubs.filter(function (c) { return c.city === 'Bocholt'; }).map(function (c) { return [c.country, c.region]; }))`, sb));
check('Bocholt: the German club is in NRW, the Belgian one in Limburg, got ' + JSON.stringify(boc),
    boc.some(x => x[0] === 'Germany' && x[1] === 'nrw') && boc.some(x => x[0] === 'Belgium' && x[1] === 'N-E Belgium'));
if (failed) process.exit(1);
console.log('All secondary-nationality checks passed.');
