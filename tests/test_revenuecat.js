// RevenueCat provider (ui/js/revenuecat.js) — verifies it stays INERT and GRACEFUL until configured:
// no plugin + no key must never change the provider or throw. (The live purchase/restore paths are
// exercised on-device in Step 5 once the plugin + keys exist.)
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const store = {};
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, setTimeout: () => 0,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    window: { matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }) },   // no Capacitor
    document: { documentElement: { setAttribute() {} } },
};
vm.createContext(sb);
for (const f of ['prefs.js', 'monetization.js', 'revenuecat.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
const ctx = vm.runInContext('({ M: Monetization, RC: RevenueCatProvider, initRC: initRevenueCat, CFG: REVENUECAT_CONFIG })', sb);
const { M, RC, initRC, CFG } = ctx;

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

(async () => {
    check('no Capacitor plugin present -> _p() is null', RC._p() === null);
    check('config keys start empty (nothing to leak)', CFG.apiKeyAndroid === '' && CFG.apiKeyIos === '');

    const devProvider = M._provider;
    await initRC();
    check('initRevenueCat() no-ops with no key -> dev provider untouched', M._provider === devProvider);

    // even with a key set, without the native plugin it must not swap the provider or throw
    CFG.apiKeyAndroid = 'test_key';
    await initRC();
    check('with a key but no plugin -> still the dev provider', M._provider === devProvider);
    CFG.apiKeyAndroid = '';

    // the provider methods themselves degrade gracefully (never throw)
    const buy = await RC.purchase('pro');
    check('purchase() without plugin returns a clean failure', buy && buy.ok === false && buy.error === 'no-plugin');
    const res = await RC.restore();
    check('restore() without plugin returns a clean failure', res && res.ok === false && res.error === 'no-plugin');

    console.log(failed ? '\n*** FAIL ***' : '\nAll RevenueCat-provider checks passed.');
    process.exitCode = failed ? 1 : 0;
})();
