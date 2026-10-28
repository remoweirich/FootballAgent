// Competition names per language in a names pack (real-club-names.json): an entry may be one name or
// { en, de, ... }. The current language wins (then English), a language change re-resolves it, and a
// club entry stays a single name. Real file, real importer helpers (ui/js/screen-customize.js).
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const errs = [];

function makeEl() {
    const el = {
        _html: '', _id: '', set innerHTML(v) { this._html = String(v); }, get innerHTML() { return this._html; },
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        dataset: {}, style: {}, textContent: '', value: '', type: '', accept: '', multiple: false, files: [],
        addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {}, click() {},
        focus() {}, select() {}, setAttribute() {}, querySelectorAll() { return []; }, closest() { return null; }
    };
    // assigning an id registers the element, so dynamically-created overlays are retrievable by id
    Object.defineProperty(el, 'id', { get() { return el._id; }, set(v) { el._id = v; if (v) els[v] = el; }, configurable: true });
    return el;
}
const els = {};
const document = {
    getElementById: id => (els[id] || (els[id] = makeEl())),
    querySelectorAll: () => [], createElement: () => makeEl(),
    addEventListener() {}, removeEventListener() {},
    body: { appendChild() {}, removeChild() {} }, head: { appendChild() {} },
};
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    Math, Date, JSON, document,
    setTimeout: () => 0, clearTimeout() {},
    indexedDB: { open() { const r = { result: null, onsuccess: null }; return r; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    window: { addEventListener() {} },
};
sb.__written = [];
sb.UI = {
    money: n => String(n), esc: s => (s == null ? '' : String(s)), crest: () => '<crest>', cur: () => '€',
    saveFileOut: (filename, text, mime) => { sb.__written.push({ filename, text, mime }); return Promise.resolve({ ok: true }); },
};
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'world-ext.js', 'agency.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const CX = vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-customize.js'), 'utf8') + ';CustomizeScreen', sb, { filename: 'screen-customize.js' });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
vm.runInContext('Clubs.init();', sb);

let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };
// the real-names pack is kept only on the owner's machine (never in the repository): without it, skip
if (!fs.existsSync(path.join(root, 'real-club-names.json'))) { console.log('SKIP  real-club-names.json is not present (it is kept locally only)'); process.exit(0); }
const text = fs.readFileSync(path.join(root, 'real-club-names.json'), 'utf8');
sb.__map = CX._parseNamesText(text);
// the live import (Settings > Import names), routed exactly as _readNamesLive does
const n = runv(`GameState.startNewGame('England', 'T', 'A'); GameState.save = function () {}; var n = 0;
    Object.keys(__map).forEach(function (id) { var nm = __map[id];
        if (Clubs.getClubById(id)) { var a = CustomizeScreen._packName(nm, false); if (a) { GameState.setClubName(id, a); n++; } }
        else if (COMPETITIONS[id]) { var b = CustomizeScreen._packName(nm, true); if (b) { GameState.setCompName(id, b); n++; } } });
    return n;`);
check('the real-names file imports (' + n + ' entries)', n > 800);
const en = runv(`I18n.set('en'); return [compName('INTL_WC'), compName('INTL_EURO'), compName('INTL_AFCON'), compName('ERE'), Clubs.getClubById('ajax').name].join('|');`);
check('English: World Cup, EURO, Africa Cup of Nations; plain entries unchanged', en === 'World Cup|EURO|Africa Cup of Nations|Eredivisie|Ajax', en);
const de = runv(`I18n.set('de'); return [compName('INTL_WC'), compName('INTL_EURO'), compName('INTL_AFCON'), compName('ERE'), compName('UCL')].join('|');`);
check('German after a language change: Weltmeisterschaft, Europameisterschaft, Afrika-Cup (Eredivisie, Champions League stay)', de === 'Weltmeisterschaft|Europameisterschaft|Afrika-Cup|Eredivisie|Champions League', de);
const missing = runv(`I18n.locale = 'xx'; GameState._applyCompNames(); var a = compName('INTL_WC'); I18n.set('en'); return a;`);
check('a language the pack does not have falls back to English', missing === 'World Cup', missing);
check('every international entry in the file has all 7 languages, none over 40 characters', runv(`return Object.keys(__map).filter(function (k) { return k.indexOf('INTL_') === 0; }).every(function (k) { var v = __map[k];
    return typeof v === 'object' && ['en','de','es','fr','it','nl','pt'].every(function (l) { return v[l] && v[l].length <= 40; }); });`));
const kept = runv(`var s = JSON.parse(JSON.stringify(GameState.compNames)); GameState.compNames = s; I18n.set('de'); GameState._applyCompNames(); return compName('INTL_WC');`);
check('the per-language names survive a save round-trip', kept === 'Weltmeisterschaft', kept);
// the Customize database path (import into a database before a new game)
const db = runv(`Clubs.applyDatabase({ competitions: { INTL_FRIENDLY: { name: { en: 'Friendly EN', de: 'Freundschaftsspiel DE' } } }, overrides: {} });
    I18n.set('en'); var a = compName('INTL_FRIENDLY'); I18n.set('de'); var b = compName('INTL_FRIENDLY'); I18n.set('en'); return a + '|' + b;`);
check('a database rename can be per-language too, and follows the language', db === 'Friendly EN|Freundschaftsspiel DE', db);
// a save from a build that predates per-language names: the importer stored "[object Object]"
const fixed = runv(`I18n.set('en'); var gen = 'World Nations Cup';
    GameState.compNames = { INTL_WC: '[object Object]', INTL_EURO: '[object Object]', ERE: 'Eredivisie' };
    COMPETITIONS.INTL_WC.name = '[object Object]'; COMPETITIONS.INTL_EURO.name = '[object Object]';
    resetCompetitionNames(); applyNativeCompNames(); GameState._applyCompNames();
    var after = [compName('INTL_WC'), compName('ERE'), Object.keys(GameState.compNames).join(',')].join('|');
    GameState.setCompName('INTL_WC', '[object Object]');   // an old file imported again: ignored
    var ignored = compName('INTL_WC');
    GameState.setCompName('INTL_WC', __map.INTL_WC);       // the real file imported again: fixed
    return after + '|' + ignored + '|' + compName('INTL_WC');`);
check('a save with "[object Object]" names shows the generic names again, keeps good entries, and re-importing the pack fixes it',
    fixed === 'World Nations Cup|Eredivisie|ERE|World Nations Cup|World Cup', fixed);
check('no errors', errs.length === 0);
if (failed) process.exit(1);
