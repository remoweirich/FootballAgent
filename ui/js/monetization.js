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
    PRODUCTS: {
        remove_ads:   { kind: 'nonconsumable', price: '€1.99', grants: ['removeAds'] },
        insights:     { kind: 'nonconsumable', price: '€1.99', grants: ['insights'] },
        editor:       { kind: 'nonconsumable', price: '€1.99', grants: ['editor'] },
        pro:          { kind: 'nonconsumable', price: '€5.99', grants: ['removeAds', 'insights', 'editor'], bundle: true },
        // sandbox is the top tier: everything Pro has + the full in-game editor (ages, names, abilities,
        // your reputation, your finances). No cash-boost consumables — editing money lives here instead.
        sandbox:      { kind: 'nonconsumable', price: '€9.99', grants: ['removeAds', 'insights', 'editor', 'sandbox'], bundle: true },
        supporter_2:  { kind: 'nonconsumable', price: '€1.99', grants: ['supporter'], tier: 1 },
        supporter_5:  { kind: 'nonconsumable', price: '€4.99', grants: ['supporter'], tier: 2 },
        supporter_10: { kind: 'nonconsumable', price: '€9.99', grants: ['supporter'], tier: 3 },
    },
    KEY: 'entitlements',       // Prefs key: array of owned entitlement ids
    KEY_TIER: 'supporterTier', // Prefs key: highest supporter tier bought (for the badge)

    // While true, everything except the "supporter" badge behaves as owned, so the prototype stays
    // fully usable before any store is live. Going to market = flip this false and attach a real
    // provider (see setProvider). Tests set it false to exercise real gating.
    DEV_UNLOCK_ALL: true,

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
    // Enhanced Insights is an owned entitlement the player can additionally toggle on/off (defaults on
    // once bought). insightsOn() is the single question the reveal code asks.
    insightsOn() { return this.owns('insights') && (typeof Prefs === 'undefined' || Prefs.get('insightsOn', true) !== false); },
    setInsights(on) { if (typeof Prefs !== 'undefined') Prefs.set('insightsOn', !!on); },
    priceOf(productId) { const p = this.PRODUCTS[productId]; return p ? (p._storePrice || p.price) : ''; },

    grant(ents) {
        const set = this._set();
        (Array.isArray(ents) ? ents : [ents]).forEach(e => e && set.add(e));
        this._save(set);
        this.applyToGame();
    },
    // dev/testing helper: wipe every local entitlement
    _reset() { this._save(new Set()); Prefs.set(this.KEY_TIER, 0); this.applyToGame(); },

    // ---- purchase / restore : delegate to the active provider ------------------------------------
    async purchase(productId) {
        const p = this.PRODUCTS[productId];
        if (!p) return { ok: false, error: 'unknown-product' };
        let res;
        try { res = await this._provider.purchase(productId, p); }
        catch (e) { return { ok: false, error: 'provider', detail: String(e) }; }
        if (!res || !res.ok) return res || { ok: false, error: 'cancelled' };
        this.grant(p.grants || []);
        if (p.tier) Prefs.set(this.KEY_TIER, Math.max(this.supporterTier(), p.tier));
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
