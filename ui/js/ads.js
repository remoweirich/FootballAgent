// ============================================================
//  Ads — at most ONE interstitial per in-game season. Store-agnostic like
//  Monetization: the game only calls Ads.maybeShowInterstitial(placement); a provider does the
//  real work. The real provider (Capacitor + @capacitor-community/admob) is used automatically
//  when the native plugin is present; otherwise a no-op dev provider stands in, so the web build
//  and tests never touch a native SDK. An ad is NEVER allowed to break the game — every path
//  swallows its own errors.
//
//  ACTIVATION (Android): `npm i @capacitor-community/admob`, put your AdMob **App ID** in
//  android AndroidManifest (meta-data com.google.android.gms.ads.APPLICATION_ID), drop your real
//  ad-unit id into AD_CONFIG.interstitial below, set AD_CONFIG.testing=false, `npx cap sync`.
//  EU consent (UMP) is requested at init by the real provider — required for your DACH audience.
// ============================================================
const AD_CONFIG = {
    // Live AdMob ids (ch.jens.footballagent). During development flip `testing` back to true to use
    // Google's public test ids and avoid invalid-activity strikes; test id kept below for reference.
    testing: false,
    interstitial: 'ca-app-pub-9156400497236757/6996258921',   // live Android interstitial (test: ca-app-pub-3940256099942544/1033173712)
    // Rewarded ad unit for "See potential" (one player's Enhanced Insights). Paste the live id from
    // AdMob > Apps > Ad units > Rewarded here. While it is empty the button still works on the web
    // build (dev provider), and on a device it uses Google's public rewarded TEST unit, so it never
    // serves live ads from an unconfigured slot.
    rewarded: 'ca-app-pub-9156400497236757/5027230775',
    rewardedTest: 'ca-app-pub-3940256099942544/5224354917',
};

const Ads = {
    // ---- the frequency policy, in one place ----
    // At most one interstitial per in-game SEASON, offered after the WINTER transfer window shuts
    // (week 34 — screen-home.js arms it, see Home._doAdvance), and none at all in the player's first
    // season. So the earliest ad anyone can see is week 34 of season 2, and never more than one a
    // season after that. Deliberately NOT a wall-clock rule: a player who rattles through quiet weeks
    // crosses two window closes in minutes, and a real-time cap would silently eat a season's ad.
    FIRST_AD_SEASON: 1,          // GameState.seasonsCompleted() must be >= this (0 = season 1, 1 = season 2)
    KEY_SEASON: 'adLastSeason',  // field on GameState.agency — save-scoped, so a new game starts clean
    MIN_GAP_MS: 30 * 1000,       // NOT the frequency policy: only stops two placements double-firing in one flow
    KEY_LAST: 'adLastShown',
    _provider: null,
    _ready: false,

    async init() {
        if (!this._provider) this._provider = this._pickProvider();
        try { await this._provider.init(); this._ready = true; }
        catch (e) { this._ready = false; }
    },
    _pickProvider() {
        const cap = (typeof window !== 'undefined') && window.Capacitor;
        const plugin = cap && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
        return (plugin && typeof CapAdMobProvider !== 'undefined') ? CapAdMobProvider : DevAdsProvider;
    },
    setProvider(p) { this._provider = p || DevAdsProvider; this._ready = false; },

    // Gate: never while ads are removed (Pro / Remove Ads), then the season policy, then the
    // anti-double-fire guard.
    canShow() {
        if (typeof Monetization !== 'undefined' && !Monetization.hasAds()) return false;
        if (!this.seasonEligible()) return false;
        const last = (typeof Prefs !== 'undefined') ? (Prefs.get(this.KEY_LAST, 0) || 0) : 0;
        return (Date.now() - last) >= this.MIN_GAP_MS;
    },
    // Seasons completed, or null when there is no game at all (web build, tests) — in which case
    // nothing is gated, the same way an absent Monetization or Prefs never blocks.
    _season() {
        if (typeof GameState === 'undefined' || !GameState || typeof GameState.seasonsCompleted !== 'function') return null;
        const s = GameState.seasonsCompleted();
        return Number.isFinite(s) ? s : null;
    },
    seasonEligible() {
        const s = this._season();
        if (s === null) return true;
        if (s < this.FIRST_AD_SEASON) return false;                  // the first season is ad-free
        const a = GameState.agency;
        return !a || a[this.KEY_SEASON] !== s;                       // one per season
    },
    // Remember the season on the SAVE, not in Prefs: a fresh game must start clean, and a reload
    // must not hand out a second ad for a season that already had one.
    _stampSeason() {
        const s = this._season();
        if (s === null || !GameState.agency) return;
        GameState.agency[this.KEY_SEASON] = s;
        try { if (typeof GameState.save === 'function') GameState.save(); }
        catch (e) { /* an ad must never surface a save hiccup */ }
    },
    // A REWARDED ad the player chose to watch (e.g. "See potential"). Outside the interstitial policy:
    // it is opt-in, so neither the one-per-season cap nor Remove Ads applies. Resolves to
    // 'earned' (watched to the end), 'closed' (closed early: no reward) or 'unavailable' (no fill,
    // offline, no SDK). Only 'earned' may grant the reward.
    async showRewarded(placement) {
        if (!this._ready) { try { await this.init(); } catch (e) { /* the provider reports below */ } }
        try {
            const r = await this._provider.showRewarded(placement);
            if (r === 'earned' && typeof Prefs !== 'undefined') Prefs.set(this.KEY_LAST, Date.now());   // no interstitial right after
            return r === 'earned' || r === 'closed' ? r : 'unavailable';
        } catch (e) { return 'unavailable'; }
    },
    async maybeShowInterstitial(placement) {
        if (!this.canShow()) return false;
        if (!this._ready) { try { await this.init(); } catch (e) { /* keep going with whatever we have */ } }
        try {
            const shown = await this._provider.showInterstitial(placement);
            if (shown) {
                if (typeof Prefs !== 'undefined') Prefs.set(this.KEY_LAST, Date.now());
                this._stampSeason();
                return true;
            }
        } catch (e) { /* an ad must never crash or block the game */ }
        return false;
    },
};

// No-op provider: used on the web build, in tests, and on any device without the AdMob plugin.
// Reports success so the frequency-cap logic is still exercised, but shows nothing.
const DevAdsProvider = {
    async init() { return true; },
    async showInterstitial() { return true; },
    async showRewarded() { return 'earned'; },
};

// Real provider — @capacitor-community/admob. Lives here inert until the plugin is installed and
// present at runtime (see _pickProvider). Kept defensive so an API/version mismatch can't crash boot.
const CapAdMobProvider = {
    _init: false,
    async init() {
        if (this._init) return true;
        const AdMob = window.Capacitor.Plugins.AdMob;
        await AdMob.initialize({ initializeForTesting: AD_CONFIG.testing, requestTrackingAuthorization: true });
        // EU consent (UMP): request info, and show the form if the user's region requires it.
        try {
            const info = await AdMob.requestConsentInfo();
            if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
        } catch (e) { /* consent SDK hiccup: don't block the app, AdMob will still gate serving */ }
        this._init = true;
        return true;
    },
    async showInterstitial() {
        const AdMob = window.Capacitor.Plugins.AdMob;
        await AdMob.prepareInterstitial({ adId: AD_CONFIG.interstitial, isTesting: AD_CONFIG.testing });
        await AdMob.showInterstitial();
        return true;
    },
    // Two signals say the reward was earned: the plugin's showRewardVideoAd() promise (it resolves on
    // the reward and never settles if the viewer closes early, so it is not awaited) and the Rewarded
    // event. Dismissed ends the ad, but on Android the reward can arrive just AFTER it (the SDK may
    // report it late, and the WebView is paused while the ad is full screen, so queued events land
    // together), so a dismissal waits a short grace period for a late reward before it says 'closed'.
    REWARD_GRACE_MS: 2000,
    async showRewarded() {
        const AdMob = window.Capacitor.Plugins.AdMob;
        const test = AD_CONFIG.testing || !AD_CONFIG.rewarded;
        let earned = false, finish = null;
        const handles = [];
        const done = new Promise(resolve => { finish = resolve; });
        const on = async (ev, fn) => { try { handles.push(await AdMob.addListener(ev, fn)); } catch (e) { /* older plugin */ } };
        const reward = () => { earned = true; finish('earned'); };
        // listeners are in place BEFORE the ad is loaded or shown
        await on('onRewardedVideoAdReward', reward);
        await on('onRewardedVideoAdDismissed', () => setTimeout(() => finish(earned ? 'earned' : 'closed'), this.REWARD_GRACE_MS));
        await on('onRewardedVideoAdFailedToShow', () => finish(earned ? 'earned' : 'unavailable'));
        const guard = setTimeout(() => finish(earned ? 'earned' : 'unavailable'), 5 * 60 * 1000);   // never hang the button
        try {
            await AdMob.prepareRewardVideoAd({ adId: test ? AD_CONFIG.rewardedTest : AD_CONFIG.rewarded, isTesting: test });
            AdMob.showRewardVideoAd().then(item => { if (item) reward(); }).catch(() => {});
        } catch (e) { finish('unavailable'); }
        const r = await done;
        clearTimeout(guard);
        handles.forEach(h => { try { h.remove(); } catch (e) { /* already gone */ } });
        return r;
    },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Ads, AD_CONFIG };
