// Store screen (ui/js/screen-store.js): renders products with truthful Buy/Owned state and routes
// Buy/Restore through Monetization. Drives it against a light DOM stub. I18n.t is stubbed to echo the
// key, so we assert on key/price presence rather than prose.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

let appHTML = '';
const appEl = { set innerHTML(v) { appHTML = String(v); }, get innerHTML() { return appHTML; } };
const el = () => ({ style: {}, classList: { add() {}, remove() {} }, innerHTML: '', addEventListener() {}, remove() {}, textContent: '', appendChild() {}, _id: '', set id(v) { this._id = v; }, get id() { return this._id; } });
const store = {};
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, setTimeout: () => 0,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    window: { matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }) },
    document: { getElementById: id => (id === 'app' ? appEl : null), createElement: () => el(), head: { appendChild() {} }, body: { appendChild() {} }, documentElement: { setAttribute() {} } },
    UI: { esc: s => (s == null ? '' : String(s)) }, I18n: { t: k => k },
    StartScreen: { show() {} }, SettingsScreen: { show() {} },
};
vm.createContext(sb);
for (const f of ['prefs.js', 'monetization.js', 'screen-store.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
const { S, M } = vm.runInContext('({ S: StoreScreen, M: Monetization })', sb);

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };
const has = s => appHTML.indexOf(s) >= 0;
const count = s => appHTML.split(s).length - 1;

(async () => {
    M.DEV_UNLOCK_ALL = false; M._reset();

    S.show('start');
    check('lists all product groups', has('store.bundles') && has('store.individual') && has('store.support'));
    check('lists individual insights + editor as their own items', has('store.insights.name') && has('store.editor.name'));
    check('shows real prices on Buy buttons', has('€5.99') && has('€9.99') && has('€1.99'));
    check('nothing owned yet', !has('store.owned'));

    // buying the Pro bundle unlocks its three entitlements and flips their cards to Owned
    await S.buy('pro');
    check('pro purchase grants the bundle', M.purchased('removeAds') && M.purchased('insights') && M.purchased('editor'));
    check('pro + its 3 singles now read Owned (4 cards)', count('store.owned') >= 4);
    check('sandbox is still buyable', has('€9.99'));

    await S.buy('sandbox');
    check('sandbox now owned', M.purchased('sandbox') === true);

    // supporter tier
    await S.buy('supporter_5');
    check('supporter thank-you banner appears', has('store.thanks'));

    // truthful even under DEV_UNLOCK_ALL: the game unlocks everything, the Store still shows Buy
    M._reset(); M.DEV_UNLOCK_ALL = true;
    S.show('start');
    check('dev-unlock does NOT fake Owned in the Store', !has('store.owned') && has('€5.99'));
    check('but the game itself is unlocked', M.owns('sandbox') === true);

    console.log(failed ? '\n*** FAIL ***' : '\nAll store checks passed.');
    process.exitCode = failed ? 1 : 0;
})();
