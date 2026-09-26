// The Settings language picker. It used to be a segmented control with one button per locale,
// which stopped fitting once there were four languages; it is now a row that opens a sheet.
// Renders the real SettingsScreen against a DOM stub with the real i18n packs loaded, so this
// also proves every shipped locale is selectable and that switching actually takes effect.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

let appHTML = '', sheetHTML = '', sheetOpen = false;
const appEl = { set innerHTML(v) { appHTML = String(v); }, get innerHTML() { return appHTML; } };
const mkEl = () => ({
    style: {}, classList: { add() {}, remove() {} }, innerHTML: '', textContent: '',
    addEventListener() {}, remove() {}, appendChild() {}, scrollTop: 0,
    _id: '', set id(v) { this._id = v; }, get id() { return this._id; },
});
const store = {};
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout() {},
    localStorage: {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; },
    },
    document: {
        getElementById: id => (id === 'app' ? appEl : null),
        querySelector: () => null,          // no .set-body under the stub, so _reshow just re-renders
        createElement: () => mkEl(), head: { appendChild() {} }, body: { appendChild() {} },
        documentElement: { setAttribute() {} }, addEventListener() {},
    },
    UI: { esc: s => (s == null ? '' : String(s)), money: n => String(n) },
    Router: {
        sheet(html) { sheetHTML = String(html); sheetOpen = true; },
        closeSheet() { sheetOpen = false; },
        link: (a, b) => `#${a}/${b}`, refresh() {}, go() {}, register() {},
    },
};
sb.window = sb;
vm.createContext(sb);
// The real i18n engine first, then a pack pair PER LOCALE IN LANGS — driven by LANGS rather than a
// hardcoded list, so a new language is exercised here automatically instead of being quietly skipped.
vm.runInContext(fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8'), sb, { filename: 'i18n.js' });
const codes = JSON.parse(vm.runInContext('JSON.stringify(I18n.LANGS.map(function(l){return l.code;}))', sb));
for (const c of codes) {
    vm.runInContext(fs.readFileSync(path.join(root, `js/i18n-${c}.js`), 'utf8'), sb, { filename: `i18n-${c}.js` });
    vm.runInContext(fs.readFileSync(path.join(root, `ui/js/i18n-${c}.js`), 'utf8'), sb, { filename: `ui/i18n-${c}.js` });
}
for (const f of ['prefs.js', 'screen-settings.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'ui/js', f), 'utf8'), sb, { filename: f });

const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// Derived from I18n.LANGS, not hardcoded: adding a language should not need a test edit, and
// available() only returns locales whose pack actually registered, so this proves each one loaded.
const LANGS = JSON.parse(run('return JSON.stringify(I18n.LANGS);'));
const LOCALES = JSON.parse(run('return JSON.stringify(I18n.available().map(l => l.code));'));
check('every locale in LANGS has a registered pack and is selectable (' + LOCALES.join(', ') + ')',
    LANGS.length > 1 && JSON.stringify(LOCALES) === JSON.stringify(LANGS.map(l => l.code)));

// ---------------- the row ----------------
run("I18n.set('en'); SettingsScreen.show('game');");
check('the row opens the picker instead of listing every locale inline',
    appHTML.includes('SettingsScreen.pickLang()'));
check('the row no longer renders a per-locale segmented control',
    !/set-seg__btn[^>]*onclick="SettingsScreen\.setLang/.test(appHTML));
check('the row shows the CURRENT language as its value', appHTML.includes('English'));
const others = LANGS.filter(l => l.code !== 'en').map(l => l.name);
check('the other languages are not on the settings page itself',
    others.length > 0 && others.every(n => !appHTML.includes(n)));

// ---------------- the sheet ----------------
run('SettingsScreen.pickLang();');
check('the sheet opens', sheetOpen === true);
for (const { code, name } of LANGS) {
    check(`the sheet offers ${name}`,
        sheetHTML.includes(name) && sheetHTML.includes(`SettingsScreen.setLang('${code}')`));
}
const ticks = (sheetHTML.match(/ti-check/g) || []).length;
check('exactly one language is ticked as current (' + ticks + ')', ticks === 1);

// ---------------- switching ----------------
run("SettingsScreen.setLang('fr');");
check('choosing a language switches the locale', run("return I18n.locale === 'fr';"));
check('choosing a language closes the sheet', sheetOpen === false);
check('the page re-renders in the new language', appHTML.includes('Français') && appHTML.includes('Réglages'));
check('the choice is persisted to Prefs', store['lang'] === 'fr' || run("return Prefs.get('lang') === 'fr';"));

// switching back must work too — a one-way switch would be a nasty trap
run("SettingsScreen.pickLang(); SettingsScreen.setLang('en');");
check('switching back to English works', run("return I18n.locale === 'en';") && appHTML.includes('English'));

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll settings language-picker checks passed.');
process.exitCode = failed ? 1 : 0;
