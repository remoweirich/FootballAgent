// ============================================================
//  Ads — one interstitial at each transfer-window close (twice a season). Store-agnostic like
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
    // Google's public TEST ids — safe during development; policy REQUIRES test ads while building.
    // Replace `interstitial` with your own unit id and flip `testing` to false to go live.
    testing: true,
    interstitial: 'ca-app-pub-3940256099942544/1033173712',   // Android test interstitial
};

const Ads = {
    MIN_GAP_MS: 8 * 60 * 1000,   // frequency cap: at most one interstitial per 8 real minutes
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

    // Gate: never while ads are removed (Pro / Remove Ads), and honour the frequency cap.
    canShow() {
        if (typeof Monetization !== 'undefined' && !Monetization.hasAds()) return false;
        const last = (typeof Prefs !== 'undefined') ? (Prefs.get(this.KEY_LAST, 0) || 0) : 0;
        return (Date.now() - last) >= this.MIN_GAP_MS;
    },
    async maybeShowInterstitial(placement) {
        if (!this.canShow()) return false;
        if (!this._ready) { try { await this.init(); } catch (e) { /* keep going with whatever we have */ } }
        try {
            const shown = await this._provider.showInterstitial(placement);
            if (shown) { if (typeof Prefs !== 'undefined') Prefs.set(this.KEY_LAST, Date.now()); return true; }
        } catch (e) { /* an ad must never crash or block the game */ }
        return false;
    },
};

// No-op provider: used on the web build, in tests, and on any device without the AdMob plugin.
// Reports success so the frequency-cap logic is still exercised, but shows nothing.
const DevAdsProvider = {
    async init() { return true; },
    async showInterstitial() { return true; },
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
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Ads, AD_CONFIG };
