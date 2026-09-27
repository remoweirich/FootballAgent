// ============================================================
//  Monetization — device-scoped entitlements + a store-agnostic purchase layer.
//
//  The whole game only ever asks Monetization.owns('insights') / .hasAds() / .purchase('pro').
//  It NEVER talks to a store directly, so the real billing backend (RevenueCat -> Google Play
//  Billing / Apple StoreKit) plugs in later via setProvider() with zero feature-code changes.
//  Until then a built-in dev provider "grants" instantly so the entire flow is playable and
//  testable with no store account.
//
//  Entitlements live in Prefs (localStorage), NOT in the game snapshot: a purchase belongs to the
//  device/account and must apply across every save and survive starting a new game. Consumables
//  (cash top-ups) are applied to the running game immediately and are never stored as entitlements.
// ============================================================
const Monetization = {
    // ---- product catalog -------------------------------------------------------------------------
    // `grants` = the entitlements a non-consumable unlocks (bundles list all of theirs, so owns()
    // stays a flat set lookup). Prices here are placeholders for the dev UI; the live store returns
    // its own localized prices, which the Store screen prefers when a real provider is attached.
    // `storeId` = the Play / RevenueCat product identifier. They differ from these internal catalog
    // keys (which the Store UI + i18n key off), so the RevenueCat adapter maps between the two.
    PRODUCTS: {
        remove_ads:   { kind: 'nonconsumable', price: '€1.99', grants: ['removeAds'], storeId: 'remove_ads' },
        insights:     { kind: 'nonconsumable', price: '€1.99', grants: ['insights'], storeId: 'enhanced_insights' },
        editor:       { kind: 'nonconsumable', price: '€1.99', grants: ['editor'], storeId: 'database_editor' },
        pro:          { kind: 'nonconsumable', price: '€5.99', grants: ['removeAds', 'insights', 'editor'], bundle: true, storeId: 'agent_pro' },
        // sandbox is the top tier: everything Pro has + the full in-game editor (ages, names, abilities,
        // your reputation, your finances). No cash-boost consumables — editing money lives here instead.
        sandbox:      { kind: 'nonconsumable', price: '€9.99', grants: ['removeAds', 'insights', 'editor', 'sandbox'], bundle: true, storeId: 'sandbox_editor' },
        // supporter packs are CONSUMABLE — a fan can buy them repeatedly (the badge tier is the highest bought)
        supporter_2:  { kind: 'consumable', price: '€1.99', grants: ['supporter'], tier: 1, storeId: 'sup_1' },
        supporter_5:  { kind: 'consumable', price: '€4.99', grants: ['supporter'], tier: 2, storeId: 'sup_2' },
        supporter_10: { kind: 'consumable', price: '€9.99', grants: ['supporter'], tier: 3, storeId: 'sup_3' },
    },
    // every entitlement any product can grant — lets the adapter recognise a RevenueCat entitlement
    // whose id already matches ours (it otherwise unlocks by owned-product-id -> that product's grants).
    ALL_ENTITLEMENTS: ['removeAds', 'insights', 'editor', 'sandbox', 'supporter'],
    KEY: 'entitlements',       // Prefs key: array of owned entitlement ids
    KEY_TIER: 'supporterTier', // Prefs key: highest supporter tier bought (for the badge)
    KEY_SUP: 'supporterCounts',// Prefs key: { '1': n, '2': n, '3': n } — how many of EACH pack was bought
    // Supporter plaques, shown on the start screen. Keyed by tier, in the order they are displayed
    // (cheapest first), with the artwork and the name written on it.
    PLAQUES: [
        { tier: 1, slug: 'grateful', name: 'Grateful Gamer' },
        { tier: 2, slug: 'ecstatic', name: 'Ecstatic Enjoyer' },
        { tier: 3, slug: 'super', name: 'Super Supporter' },
    ],

    // While true, everything except the "supporter" badge behaves as owned, so the prototype stays
    // fully usable before any store is live. Going to market = flip this false and attach a real
    // provider (see setProvider). Tests set it false to exercise real gating.
    DEV_UNLOCK_ALL: false,

    // ---- entitlement state -----------------------------------------------------------------------
    _set() { try { return new Set(Prefs.get(this.KEY, [])); } catch (e) { return new Set(); } },
    _save(set) { Prefs.set(this.KEY, Array.from(set)); },
    entitlements() { return Array.from(this._set()); },

    // The one question the rest of the game asks. `supporter` is a genuine "did they pay" flag, so it
    // is never auto-granted by DEV_UNLOCK_ALL.
    owns(ent) {
        if (this.DEV_UNLOCK_ALL && ent !== 'supporter') return true;
        return this._set().has(ent);
    },
    // The REAL ownership (ignores DEV_UNLOCK_ALL) — the Store shows this so Buy vs Owned is truthful
    // even while the prototype unlocks everything for play.
    purchased(ent) { return this._set().has(ent); },
    hasAds() { return !this.owns('removeAds'); },
    supporterTier() { return Prefs.get(this.KEY_TIER, 0) || 0; },
    // ---- supporter packs: how many of each tier were bought ---------------------------------------
    // Consumables, so a fan can buy the same one repeatedly and the plaque shows "4x". Counts live in
    // Prefs beside the entitlements: they belong to the device/account, not to a save.
    supporterCounts() {
        let raw = null;
        try { raw = Prefs.get(this.KEY_SUP, null); } catch (e) { raw = null; }
        const out = {};
        if (raw && typeof raw === 'object') for (const k of Object.keys(raw)) {
            const n = parseInt(raw[k], 10);
            if (n > 0) out[k] = n;
        }
        // Migration: someone who supported before counts existed has a tier but no counts. Credit them
        // with the one purchase we can prove, so their plaque appears instead of silently vanishing.
        if (!Object.keys(out).length) {
            const t = this.supporterTier();
            if (t > 0) out[String(t)] = 1;
        }
        return out;
    },
    supporterCountOf(tier) { return this.supporterCounts()[String(tier)] || 0; },
    // Record one purchase of a tier, and keep the legacy highest-tier key in step.
    addSupporterPack(tier, n) {
        if (!tier) return;
        const counts = this.supporterCounts();
        counts[String(tier)] = (counts[String(tier)] || 0) + (n || 1);
        if (typeof Prefs !== 'undefined') Prefs.set(this.KEY_SUP, counts);
        this.grantSupporterTier(tier);
    },
    // Raise a tier's count to at least n — used by restore, where the store tells us the true total
    // and must never reduce what the device already knows.
    setSupporterCountAtLeast(tier, n) {
        if (!tier || !(n > 0)) return;
        const counts = this.supporterCounts();
        if ((counts[String(tier)] || 0) >= n) return;
        counts[String(tier)] = n;
        if (typeof Prefs !== 'undefined') Prefs.set(this.KEY_SUP, counts);
        this.grantSupporterTier(tier);
    },
    // The plaques to show, cheapest first, with how many of each. [] for a non-supporter.
    supporterPlaques() {
        const counts = this.supporterCounts();
        return this.PLAQUES
            .map(p => ({ ...p, count: counts[String(p.tier)] || 0 }))
            .filter(p => p.count > 0);
    },
    // Enhanced Insights is an owned entitlement the player can additionally toggle on/off (defaults on
    // once bought). insightsOn() is the single question the reveal code asks.
    insightsOn() { return this.owns('insights') && (typeof Prefs === 'undefined' || Prefs.get('insightsOn', true) !== false); },
    setInsights(on) { if (typeof Prefs !== 'undefined') Prefs.set('insightsOn', !!on); },
    priceOf(productId) { const p = this.PRODUCTS[productId]; return p ? (p._storePrice || p.price) : ''; },

    // ---- internal catalog key <-> Play/RevenueCat store product id ----
    storeIdOf(id) { const p = this.PRODUCTS[id]; return (p && p.storeId) || id; },
    productByStoreId(storeId) {
        for (const id of Object.keys(this.PRODUCTS)) { const p = this.PRODUCTS[id]; if (p.storeId === storeId || id === storeId) return { id, def: p }; }
        return null;
    },
    // restore path: lift the supporter-badge tier to whatever an owned supporter pack grants
    grantSupporterTier(tier) { if (typeof Prefs !== 'undefined' && tier) Prefs.set(this.KEY_TIER, Math.max(this.supporterTier(), tier)); },

    grant(ents) {
        const set = this._set();
        (Array.isArray(ents) ? ents : [ents]).forEach(e => e && set.add(e));
        this._save(set);
        this.applyToGame();
    },
    // dev/testing helper: wipe every local entitlement
    _reset() { this._save(new Set()); Prefs.set(this.KEY_TIER, 0); Prefs.set(this.KEY_SUP, {}); this.applyToGame(); },

    // ---- purchase / restore : delegate to the active provider ------------------------------------
    async purchase(productId) {
        const p = this.PRODUCTS[productId];
        if (!p) return { ok: false, error: 'unknown-product' };
        let res;
        try { res = await this._provider.purchase(productId, p); }
        catch (e) { return { ok: false, error: 'provider', detail: String(e) }; }
        if (!res || !res.ok) return res || { ok: false, error: 'cancelled' };
        this.grant(p.grants || []);
        if (p.tier) this.addSupporterPack(p.tier, 1);   // consumable: counts up, so the plaque can show "4x"
        return { ok: true, productId };
    },
    async restore() {
        if (!this._provider || !this._provider.restore) return { ok: true, restored: [] };
        let res;
        try { res = await this._provider.restore(); }
        catch (e) { return { ok: false, error: 'provider', detail: String(e) }; }
        if (res && res.ok && Array.isArray(res.entitlements) && res.entitlements.length) this.grant(res.entitlements);
        return res || { ok: false };
    },
    // Push entitlement state into the running game: the engine reads a plain boolean and never has to
    // know a store exists. Safe to call anytime — on boot, after a load, and after each purchase.
    applyToGame() {
        if (typeof GameState !== 'undefined') GameState.canEditGameState = this.owns('editor');
    },

    // Swap in a real billing backend (a RevenueCat adapter) later; the default is the dev provider.
    setProvider(p) { this._provider = p || this._devProvider; },
};

// Default provider: simulates an instant successful purchase locally so the flow works end-to-end
// with no store attached. A real provider mirrors this shape: purchase() -> {ok}, restore() ->
// {ok, entitlements:[...]}, and may set PRODUCTS[id]._storePrice from the store's localized prices.
Monetization._devProvider = {
    async purchase() { return { ok: true }; },
    async restore() { return { ok: true, entitlements: [] }; },
};
Monetization._provider = Monetization._devProvider;

if (typeof module !== 'undefined' && module.exports) module.exports = Monetization;
