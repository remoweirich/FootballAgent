// The RevenueCat adapter, driven against a fake Capacitor plugin that behaves like the real one.
//
// The bug this pins: when a product is not in a RevenueCat Offering, purchase() fell back to
//   P.purchaseStoreProduct({ product: { identifier: sid } })
// with a hand-made object. The native plugin (PurchasesPlugin.kt) reads `productCategory` off that
// object and rejects the call without it, so the fallback could NEVER succeed — which is what the
// Store reported as "Something went wrong. Please try again."
//
// It also pins the second half: getProducts() defaults to SUBSCRIPTION on Android, and every product
// this game sells is a one-time purchase, so the category has to be passed explicitly or the store
// returns nothing.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// A fake plugin that enforces the same contract the native side does.
function mkPlugin(opts) {
    const o = Object.assign({ offerings: [], products: [], failPurchase: null }, opts || {});
    const calls = { getProducts: [], purchaseStoreProduct: [], purchasePackage: [] };
    return {
        calls, opts: o,
        async configure() { return {}; },
        async getOfferings() { return { all: { default: { availablePackages: o.offerings } }, current: null }; },
        async getCustomerInfo() { return { customerInfo: { allPurchasedProductIdentifiers: [], nonSubscriptionTransactions: [], entitlements: { active: {} } } }; },
        async getProducts(args) {
            calls.getProducts.push(args);
            // the real plugin returns SUBSCRIPTION products unless told otherwise
            if (args.type !== 'NON_SUBSCRIPTION') return { products: [] };
            return { products: o.products.filter(p => args.productIdentifiers.includes(p.identifier)) };
        },
        async purchasePackage(args) { calls.purchasePackage.push(args); return { customerInfo: {} }; },
        async purchaseStoreProduct(args) {
            calls.purchaseStoreProduct.push(args);
            const p = args && args.product;
            // mirrors PurchasesPlugin.kt: both fields are read with getStringOrReject
            if (!p || !p.identifier) { const e = new Error('Missing identifier parameter'); e.code = '10'; throw e; }
            if (!p.productCategory) { const e = new Error('Missing productCategory parameter'); e.code = '10'; throw e; }
            if (o.failPurchase) throw o.failPurchase;
            return { customerInfo: {} };
        },
        async restorePurchases() { return { customerInfo: { allPurchasedProductIdentifiers: o.owned || [], nonSubscriptionTransactions: [], entitlements: { active: {} } } }; },
    };
}

function load(plugin) {
    const store = {};
    const sb = {
        console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0,
        localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
        document: { documentElement: { setAttribute() {} } },
    };
    sb.window = { Capacitor: { getPlatform: () => 'android', Plugins: { Purchases: plugin } } };
    Object.assign(sb, { Capacitor: sb.window.Capacitor });
    vm.createContext(sb);
    for (const f of ['prefs.js', 'monetization.js', 'revenuecat.js'])
        vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
    return vm.runInContext('({ M: Monetization, RC: RevenueCatProvider, init: initRevenueCat })', sb);
}

(async () => {
    // ---- 1. the failing case: nothing in an Offering, and the product IS in the store ----
    const storeProd = { identifier: 'agent_pro', productCategory: 'NON_SUBSCRIPTION', priceString: '€5.99' };
    let plug = mkPlugin({ products: [storeProd] });
    let { M, RC } = load(plug);
    M.DEV_UNLOCK_ALL = false; M._reset();
    let res = await RC.purchase('pro');
    check('a product outside any Offering can now be bought', res && res.ok === true);
    check('it asks the store for the NON_SUBSCRIPTION category', plug.calls.getProducts.length === 1
        && plug.calls.getProducts[0].type === 'NON_SUBSCRIPTION');
    check('it maps the catalog key to the Play product id (pro -> agent_pro)',
        plug.calls.getProducts[0].productIdentifiers.join() === 'agent_pro');
    check('it passes the REAL product object, carrying productCategory',
        plug.calls.purchaseStoreProduct.length === 1
        && plug.calls.purchaseStoreProduct[0].product.productCategory === 'NON_SUBSCRIPTION');

    // ---- 2. the old hand-made object would have been rejected ----
    let threw = null;
    try { await plug.purchaseStoreProduct({ product: { identifier: 'agent_pro' } }); }
    catch (e) { threw = e; }
    check('a product object without productCategory is rejected, as the native side does',
        threw && /productCategory/.test(threw.message));

    // ---- 3. a product genuinely missing from Play reports something actionable ----
    plug = mkPlugin({ products: [] });
    ({ M, RC } = load(plug));
    res = await RC.purchase('pro');
    check('a product missing from the store reports not-in-store, not a shrug',
        res && res.ok === false && res.error === 'not-in-store' && res.detail === 'agent_pro');

    // ---- 4. an Offering package is still preferred when there is one ----
    const pkg = { product: { identifier: 'agent_pro', priceString: '€5.49', productCategory: 'NON_SUBSCRIPTION' } };
    plug = mkPlugin({ offerings: [pkg], products: [storeProd] });
    ({ M, RC } = load(plug));
    await RC._loadOfferings();
    res = await RC.purchase('pro');
    check('an Offering package is used in preference to a direct product buy',
        res.ok === true && plug.calls.purchasePackage.length === 1 && plug.calls.purchaseStoreProduct.length === 0);
    check('the store\'s own localized price replaces the placeholder', M.priceOf('pro') === '€5.49');

    // ---- 5. a cancelled purchase is not an error the player is shown ----
    const cancel = Object.assign(new Error('Purchase was cancelled.'), { code: '1', userCancelled: true });
    plug = mkPlugin({ products: [storeProd], failPurchase: cancel });
    ({ M, RC } = load(plug));
    res = await RC.purchase('pro');
    check('a user cancel reports "cancelled", which the Store stays silent about',
        res.ok === false && res.error === 'cancelled');

    // ---- 6. every catalog product has a Play id, and they are all distinct ----
    ({ M, RC } = load(mkPlugin({})));
    const ids = Object.keys(M.PRODUCTS).map(k => M.storeIdOf(k));
    check('every product has a store id (' + ids.length + ')', ids.every(Boolean));
    check('the store ids are unique', new Set(ids).size === ids.length);
    check('each store id maps back to its catalog key',
        Object.keys(M.PRODUCTS).every(k => (M.productByStoreId(M.storeIdOf(k)) || {}).id === k));

    // ---- 7. restore turns owned Play ids back into entitlements ----
    plug = mkPlugin({ owned: ['agent_pro'] });
    ({ M, RC } = load(plug));
    M.DEV_UNLOCK_ALL = false; M._reset();
    res = await RC.restore();
    check('restoring an owned bundle grants all of its entitlements',
        res.ok === true && ['removeAds', 'insights', 'editor'].every(e => res.entitlements.includes(e)));

    // ---- 8. INERT AND GRACEFUL with no plugin and no key. These checks predate the ones above and
    //         are the reason this file existed: the adapter ships live in the build, so it must never
    //         swap the provider or throw before it is configured, and no SECRET key may be committed.
    const store2 = {};
    const sb2 = {
        console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0,
        localStorage: { getItem: k => (k in store2 ? store2[k] : null), setItem: (k, v) => { store2[k] = String(v); }, removeItem: k => { delete store2[k]; } },
        document: { documentElement: { setAttribute() {} } },
        window: { matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }) },   // no Capacitor
    };
    vm.createContext(sb2);
    for (const f of ['prefs.js', 'monetization.js', 'revenuecat.js'])
        vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb2, { filename: f });
    const ctx = vm.runInContext('({ M: Monetization, RC: RevenueCatProvider, initRC: initRevenueCat, CFG: REVENUECAT_CONFIG })', sb2);

    check('no Capacitor plugin present -> _p() is null', ctx.RC._p() === null);
    // the Android PUBLIC SDK key is intentionally embedded (public keys are safe to ship); the guard
    // is that no SECRET key (sk_...) ever gets committed.
    check('no secret RevenueCat key committed (public key is fine)',
        !/^sk_/.test(ctx.CFG.apiKeyAndroid || '') && !/^sk_/.test(ctx.CFG.apiKeyIos || ''));

    const devProvider = ctx.M._provider;
    await ctx.initRC();
    check('initRevenueCat() with no plugin -> dev provider untouched', ctx.M._provider === devProvider);

    const savedKey = ctx.CFG.apiKeyAndroid;
    ctx.CFG.apiKeyAndroid = 'test_key';
    await ctx.initRC();
    check('a key but no plugin -> still the dev provider', ctx.M._provider === devProvider);
    ctx.CFG.apiKeyAndroid = savedKey;

    const buy2 = await ctx.RC.purchase('pro');
    check('purchase() without a plugin returns a clean failure', buy2 && buy2.ok === false && buy2.error === 'no-plugin');
    const res2 = await ctx.RC.restore();
    check('restore() without a plugin returns a clean failure', res2 && res2.ok === false && res2.error === 'no-plugin');

    console.log(failed ? '\n*** FAIL ***' : '\nAll RevenueCat adapter checks passed.');
    process.exitCode = failed ? 1 : 0;
})();
