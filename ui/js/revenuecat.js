// ============================================================
//  RevenueCat provider — the real billing backend for Monetization (Google Play Billing / StoreKit).
//  Written AHEAD of setup and kept INERT: until you paste an SDK key below AND the native plugin is
//  installed, initRevenueCat() no-ops and the app keeps using Monetization's dev provider — so this
//  file can ship now without changing any behaviour or risking the build.
//
//  STEP 5 (finish once your Play products + RevenueCat project exist):
//   1. `npm i @revenuecat/purchases-capacitor` then `npx cap sync android`
//   2. Paste your RevenueCat PUBLIC SDK key(s) into REVENUECAT_CONFIG below.
//   3. In RevenueCat, define entitlements  removeAds · insights · editor · sandbox · supporter
//      and attach the Play products to them exactly like Monetization.PRODUCTS[id].grants:
//         remove_ads→removeAds · insights→insights · editor→editor
//         pro→(removeAds,insights,editor) · sandbox→(removeAds,insights,editor,sandbox)
//         supporter_2/5/10→supporter
//   4. Set Monetization.DEV_UNLOCK_ALL = false.
//   NOTE: confirm the plugin's exact method names/return shapes against the installed version — the
//   calls below follow the documented @revenuecat/purchases-capacitor API and are wrapped defensively.
// ============================================================
const REVENUECAT_CONFIG = {
    apiKeyAndroid: '',   // <- your RevenueCat ANDROID public SDK key
    apiKeyIos: '',       // <- your RevenueCat iOS public SDK key (Step 6)
};

const RevenueCatProvider = {
    _offerings: null,

    _p() {
        const cap = (typeof window !== 'undefined') && window.Capacitor;
        if (!cap || !cap.Plugins) return null;
        return cap.Plugins.PurchasesPlugin || cap.Plugins.Purchases || null;   // registered plugin
    },
    _apiKey() {
        const plat = (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.getPlatform) ? window.Capacitor.getPlatform() : 'android';
        return plat === 'ios' ? REVENUECAT_CONFIG.apiKeyIos : REVENUECAT_CONFIG.apiKeyAndroid;
    },

    async init() {
        const P = this._p(); if (!P) throw new Error('RevenueCat plugin not present');
        await P.configure({ apiKey: this._apiKey() });
        await this._loadOfferings();   // pull localized prices into the catalog
        await this._sync();            // grant entitlements the account already owns
        return true;
    },
    async _loadOfferings() {
        const P = this._p(); if (!P) return;
        try {
            const res = await P.getOfferings();
            const offs = res && res.offerings;
            const packages = [];
            if (offs && offs.current && offs.current.availablePackages) packages.push(...offs.current.availablePackages);
            if (offs && offs.all) Object.values(offs.all).forEach(o => o && o.availablePackages && packages.push(...o.availablePackages));
            this._offerings = packages;
            // map each Play product id -> its store-localized price string, shown on the Store cards
            packages.forEach(pkg => {
                const prod = pkg && (pkg.product || pkg.storeProduct);
                const pid = prod && (prod.identifier || prod.productIdentifier);
                if (pid && Monetization.PRODUCTS[pid] && prod.priceString) Monetization.PRODUCTS[pid]._storePrice = prod.priceString;
            });
        } catch (e) { /* prices simply fall back to the catalog placeholders */ }
    },
    _packageFor(productId) {
        return (this._offerings || []).find(pkg => {
            const prod = pkg && (pkg.product || pkg.storeProduct);
            return prod && (prod.identifier === productId || prod.productIdentifier === productId);
        }) || null;
    },
    async _activeEntitlements() {
        const P = this._p(); if (!P) return [];
        try {
            const info = await P.getCustomerInfo();
            const ci = info && (info.customerInfo || info);
            return Object.keys((ci && ci.entitlements && ci.entitlements.active) || {});
        } catch (e) { return []; }
    },
    async _sync() {
        const active = await this._activeEntitlements();
        if (active.length && typeof Monetization !== 'undefined') Monetization.grant(active);
    },

    // ---- the interface Monetization.purchase()/restore() call ----
    async purchase(productId) {
        const P = this._p(); if (!P) return { ok: false, error: 'no-plugin' };
        if (!this._offerings) await this._loadOfferings();
        const pkg = this._packageFor(productId);
        try {
            if (pkg) await P.purchasePackage({ aPackage: pkg });
            else await P.purchaseStoreProduct({ product: { identifier: productId } });   // fallback: product not in an offering
            return { ok: true };
        } catch (e) {
            const msg = String((e && e.message) || e || '');
            if ((e && (e.userCancelled || e.code === '1')) || /cancel/i.test(msg)) return { ok: false, error: 'cancelled' };
            return { ok: false, error: 'purchase', detail: msg };
        }
    },
    async restore() {
        const P = this._p(); if (!P) return { ok: false, error: 'no-plugin' };
        try {
            const info = await P.restorePurchases();
            const ci = info && (info.customerInfo || info);
            const active = Object.keys((ci && ci.entitlements && ci.entitlements.active) || {});
            return { ok: true, entitlements: active };
        } catch (e) { return { ok: false, error: 'restore' }; }
    },
};

// Activate ONLY when a key is set and the plugin is present; otherwise stay on the dev provider.
async function initRevenueCat() {
    if (typeof Monetization === 'undefined') return;
    if (!REVENUECAT_CONFIG.apiKeyAndroid && !REVENUECAT_CONFIG.apiKeyIos) return;   // not configured yet
    if (!RevenueCatProvider._p()) return;                                            // plugin not installed
    try { await RevenueCatProvider.init(); Monetization.setProvider(RevenueCatProvider); }
    catch (e) { /* leave the dev provider in place */ }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { RevenueCatProvider, REVENUECAT_CONFIG, initRevenueCat };
