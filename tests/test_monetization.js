// Entitlements foundation (ui/js/monetization.js): owns()/hasAds() gating, bundle grant expansion,
// consumable cash top-ups, device-scoped persistence, restore, and the DEV_UNLOCK_ALL switch.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

// a real-ish localStorage so Prefs actually persists across reads within the run
const store = {};
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, setTimeout,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    window: { matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }) },
    document: { documentElement: { setAttribute() {} } },
};
// GameState stub so applyToGame() and cash top-ups have somewhere to land
sb.GameState = { canEditGameState: true, agency: { balance: 1000 }, _saved: 0, save() { this._saved++; }, addFinance() {} };
function loadMonet(ctx) {
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'prefs.js'), 'utf8'), ctx, { filename: 'prefs.js' });
    return vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'monetization.js'), 'utf8') + ';Monetization', ctx, { filename: 'monetization.js' });
}
const M = loadMonet(sb), GS = sb.GameState;

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---- real gating (dev switch OFF) ----
M.DEV_UNLOCK_ALL = false;
M._reset();
check('fresh: owns nothing', !M.owns('editor') && !M.owns('insights') && !M.owns('removeAds') && !M.owns('sandbox'));
check('fresh: ads are on', M.hasAds() === true);
check('fresh: insights off when not owned', M.insightsOn() === false);
check('applyToGame locks the editor when unowned', (M.applyToGame(), GS.canEditGameState === false));

// ---- a bundle grants all its entitlements (owns stays a flat lookup) ----
(async () => {
    const r = await M.purchase('pro');
    check('purchase(pro) succeeds', r.ok === true);
    check('pro grants removeAds + insights + editor', M.owns('removeAds') && M.owns('insights') && M.owns('editor'));
    check('pro does NOT grant sandbox', M.owns('sandbox') === false);
    check('ads turn off after remove-ads entitlement', M.hasAds() === false);
    check('purchase re-syncs the editor unlock into the game', GS.canEditGameState === true);

    // ---- enhanced insights: owned + player toggle ----
    check('insights owned via pro bundle', M.owns('insights') === true);
    check('insightsOn defaults on once owned', M.insightsOn() === true);
    M.setInsights(false);
    check('insightsOn respects the off toggle', M.insightsOn() === false);
    M.setInsights(true);

    // ---- sandbox is the superset top tier ----
    await M.purchase('sandbox');
    check('sandbox grants the sandbox entitlement', M.owns('sandbox') === true);
    check('no cash-boost consumables in the catalog', !M.PRODUCTS.cash_mid && !M.PRODUCTS.cash_small);

    // ---- persistence: a fresh module reading the same localStorage sees the unlocks ----
    const sb2 = { console: sb.console, Math, Date, JSON, setTimeout, localStorage: sb.localStorage, window: sb.window, document: sb.document, GameState: { canEditGameState: true } };
    const M2 = loadMonet(sb2);
    M2.DEV_UNLOCK_ALL = false;
    check('entitlements persist across a reload (localStorage)', M2.owns('editor') && M2.owns('sandbox'));

    // ---- supporter tier + restore ----
    await M.purchase('supporter_5');
    check('supporter purchase records the tier', M.supporterTier() === 2 && M.owns('supporter'));

    // restore pulls entitlements from the provider
    M._reset();
    M.setProvider({ async purchase() { return { ok: true }; }, async restore() { return { ok: true, entitlements: ['editor', 'removeAds'] }; } });
    const rr = await M.restore();
    check('restore re-grants entitlements from the provider', rr.ok && M.owns('editor') && M.owns('removeAds'));
    M.setProvider(null);   // back to dev provider

    // ---- DEV_UNLOCK_ALL: everything owned EXCEPT the paid-only supporter flag ----
    M._reset();
    M.DEV_UNLOCK_ALL = true;
    check('dev-unlock: owns editor/insights/sandbox', M.owns('editor') && M.owns('insights') && M.owns('sandbox'));
    check('dev-unlock: NO ads', M.hasAds() === false);
    check('dev-unlock does NOT fake the supporter badge', M.owns('supporter') === false);
    check('dev-unlock: purchased() stays truthful for the Store', M.owns('editor') === true && M.purchased('editor') === false);

    console.log(failed ? '\n*** FAIL ***' : '\nAll monetization checks passed.');
    process.exitCode = failed ? 1 : 0;
})();
