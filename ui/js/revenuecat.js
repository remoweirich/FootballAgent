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
//   Verified against @revenuecat/purchases-capacitor 13.4.2: the native plugin registers as
//   @CapacitorPlugin(name = "Purchases"), so window.Capacitor.Plugins.Purchases exists without this
//   no-bundler app importing the ES module. getCustomerInfo()/restorePurchases() resolve to
//   { customerInfo }, and CustomerInfo really does carry allPurchasedProductIdentifiers and
//   nonSubscriptionTransactions[].productIdentifier, which _grantsFrom reads.
// ============================================================
const REVENUECAT_CONFIG = {
    apiKeyAndroid: 'goog_KjLcaHiBqfZWaxXJIOyMyCoGCwG',   // RevenueCat Android public SDK key (production, Google Play)
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
            // getOfferings() resolves to PurchasesOfferings ({ all, current }) directly in the
            // installed plugin; older/wrapped shapes nest it under .offerings — handle both.
            const offs = res && (res.offerings || res);
            const packages = [];
            if (offs && offs.current && offs.current.availablePackages) packages.push(...offs.current.availablePackages);
            if (offs && offs.all) Object.values(offs.all).forEach(o => o && o.availablePackages && packages.push(...o.availablePackages));
            this._offerings = packages;
            // map each store product's localized price onto its catalog entry (matched by storeId)
            packages.forEach(pkg => {
                const prod = pkg && (pkg.product || pkg.storeProduct);
                const pid = prod && (prod.identifier || prod.productIdentifier);
                if (!pid || !prod.priceString || typeof Monetization === 'undefined') return;
                const entry = Monetization.productByStoreId(pid);
                if (entry) entry.def._storePrice = prod.priceString;
            });
        } catch (e) { /* prices simply fall back to the catalog placeholders */ }
    },
    _packageFor(productId) {
        const sid = (typeof Monetization !== 'undefined') ? Monetization.storeIdOf(productId) : productId;
        return (this._offerings || []).find(pkg => {
            const prod = pkg && (pkg.product || pkg.storeProduct);
            return prod && (prod.identifier === sid || prod.productIdentifier === sid);
        }) || null;
    },
    // Resolve everything a customerInfo says the user owns into OUR internal entitlements. Unlocking is
    // driven by owned product ids -> that product's catalog grants (robust no matter how the RevenueCat
    // entitlements are named); any active RC entitlement that already matches one of ours is honoured too.
    _grantsFrom(info) {
        const ci = info && (info.customerInfo || info);
        const grants = new Set(); let tier = 0;
        const owned = new Set();
        ((ci && ci.allPurchasedProductIdentifiers) || []).forEach(id => id && owned.add(id));
        // nonSubscriptionTransactions holds ONE ENTRY PER PURCHASE, where allPurchasedProductIdentifiers
        // is de-duplicated. Supporter packs are consumable and repeatable, so the count comes from here
        // — it is the only place the store tells us someone bought Grateful Gamer four times.
        const tierCounts = {};
        ((ci && ci.nonSubscriptionTransactions) || []).forEach(t => {
            const sid = t && t.productIdentifier;
            if (!sid) return;
            owned.add(sid);
            if (typeof Monetization === 'undefined') return;
            const e = Monetization.productByStoreId(sid);
            if (e && e.def.tier) tierCounts[e.def.tier] = (tierCounts[e.def.tier] || 0) + 1;
        });
        if (typeof Monetization !== 'undefined') owned.forEach(sid => {
            const entry = Monetization.productByStoreId(sid);
            if (entry) { (entry.def.grants || []).forEach(g => grants.add(g)); if (entry.def.tier) tier = Math.max(tier, entry.def.tier); }
        });
        const internal = (typeof Monetization !== 'undefined') ? Monetization.ALL_ENTITLEMENTS : [];
        Object.keys((ci && ci.entitlements && ci.entitlements.active) || {}).forEach(e => { if (internal.includes(e)) grants.add(e); });
        return { grants: Array.from(grants), tier, tierCounts };
    },
    // Apply restored supporter counts without ever REDUCING what the device already recorded: a
    // consumable that Play has already consumed may no longer appear in the transaction list.
    _applyTierCounts(tierCounts) {
        if (typeof Monetization === 'undefined' || !tierCounts) return;
        Object.keys(tierCounts).forEach(t => Monetization.setSupporterCountAtLeast(parseInt(t, 10), tierCounts[t]));
    },
    async _sync() {
        const P = this._p(); if (!P) return;
        let info; try { info = await P.getCustomerInfo(); } catch (e) { return; }
        const { grants, tier, tierCounts } = this._grantsFrom(info);
        if (typeof Monetization === 'undefined') return;
        if (grants.length) Monetization.grant(grants);
        if (tier) Monetization.grantSupporterTier(tier);
        this._applyTierCounts(tierCounts);
    },

    // Every product this game sells is a ONE-OFF purchase, never a subscription. getProducts()
    // defaults to SUBSCRIPTION on Android and would return nothing for them, so the category is
    // always passed explicitly.
    PRODUCT_CATEGORY: 'NON_SUBSCRIPTION',
    // Fetch a real store product by its Play id. Needed because purchaseStoreProduct() is given to
    // the native side as-is, and PurchasesPlugin reads `productCategory` off that object and rejects
    // the call without it — a hand-made { identifier } can never work.
    async _storeProduct(sid) {
        const P = this._p(); if (!P || !P.getProducts) return null;
        try {
            const got = await P.getProducts({ productIdentifiers: [sid], type: this.PRODUCT_CATEGORY });
            const list = (got && got.products) || [];
            return list.find(p => p && (p.identifier === sid || p.productIdentifier === sid)) || list[0] || null;
        } catch (e) { return null; }
    },

    // ---- the interface Monetization.purchase()/restore() call ----
    async purchase(productId) {
        const P = this._p(); if (!P) return { ok: false, error: 'no-plugin' };
        // An empty offerings list is worth retrying: it usually means the catalogue was not ready yet.
        if (!this._offerings || !this._offerings.length) await this._loadOfferings();
        const pkg = this._packageFor(productId);
        const sid = (typeof Monetization !== 'undefined') ? Monetization.storeIdOf(productId) : productId;
        try {
            if (pkg) { await P.purchasePackage({ aPackage: pkg }); return { ok: true }; }
            // Not in an Offering — buy the product directly, with the object the store itself gave us.
            const prod = await this._storeProduct(sid);
            if (!prod) return { ok: false, error: 'not-in-store', detail: sid };
            if (!prod.productCategory) prod.productCategory = this.PRODUCT_CATEGORY;   // older plugin builds omit it
            await P.purchaseStoreProduct({ product: prod });
            return { ok: true };
        } catch (e) {
            const msg = String((e && e.message) || e || '');
            // RevenueCat's PURCHASE_CANCELLED_ERROR is code 1, and `userCancelled` rides along in the
            // rejection's info payload (PurchasesPlugin.rejectWithErrorContainer).
            if ((e && (e.userCancelled || e.code === '1')) || /cancel/i.test(msg)) return { ok: false, error: 'cancelled' };
            return { ok: false, error: 'purchase', detail: msg, code: (e && e.code) || null };
        }
    },
    async restore() {
        const P = this._p(); if (!P) return { ok: false, error: 'no-plugin' };
        try {
            const info = await P.restorePurchases();
            const { grants, tier, tierCounts } = this._grantsFrom(info);
            if (typeof Monetization !== 'undefined' && tier) Monetization.grantSupporterTier(tier);
            this._applyTierCounts(tierCounts);
            return { ok: true, entitlements: grants };
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
