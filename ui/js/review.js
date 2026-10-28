// ============================================================
//  In-app review (Google Play In-App Review API / Apple's review sheet, via
//  @capacitor-community/in-app-review). Asked at a few good moments, right after a
//  celebration has closed:
//    - season2:     the second season is over
//    - firstTrophy: a client wins a trophy (the first time we ask for it)
//    - bigTransfer: you negotiate a client's move to a bigger club
//  Google's rules: the native sheet is shown directly, with no "do you like the game?" question
//  before it, and Google alone decides whether it actually appears (a quota; the app never learns
//  whether it showed or whether the player rated). On top of that we cap ourselves: each moment
//  at most once, at most MAX_ASKS in total, and MIN_GAP_DAYS of real time between asks. All of
//  it is device-scoped (Prefs), so a new save never asks again.
// ============================================================
const Review = {
    MAX_ASKS: 3,
    MIN_GAP_DAYS: 14,
    MOMENTS: ['season2', 'firstTrophy', 'bigTransfer'],
    _state() {
        let s = null;
        try { s = typeof Prefs !== 'undefined' ? Prefs.get('reviewAsks', null) : null; } catch (e) { s = null; }
        return s && typeof s === 'object' ? { n: s.n || 0, last: s.last || 0, done: s.done || {} } : { n: 0, last: 0, done: {} };
    },
    _plugin() {
        const C = typeof window !== 'undefined' ? window.Capacitor : null;
        if (!C || !C.Plugins || !C.Plugins.InAppReview) return null;
        if (typeof C.isNativePlatform === 'function' && !C.isNativePlatform()) return null;
        return C.Plugins.InAppReview;
    },
    // whether a moment may ask now (not asked for before, under the caps, spaced out, not the tutorial)
    canAsk(moment, now) {
        if (!this.MOMENTS.includes(moment)) return false;
        if (typeof GameState !== 'undefined' && GameState.demoMode) return false;
        const s = this._state(), t = now || Date.now();
        if (s.done[moment] || s.n >= this.MAX_ASKS) return false;
        return !s.last || t - s.last >= this.MIN_GAP_DAYS * 864e5;
    },
    // ask (if allowed and the native plugin is there). Returns true when the request went out.
    request(moment) {
        if (!this.canAsk(moment)) return false;
        const plugin = this._plugin(); if (!plugin) return false;   // web / dev build: nothing to show
        const s = this._state(), t = Date.now();
        s.n += 1; s.last = t; s.done[moment] = t;
        try { Prefs.set('reviewAsks', s); } catch (e) { /* no storage: the plugin's own quota still applies */ }
        try { const r = plugin.requestReview(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* never surfaces */ }
        return true;
    }
};
if (typeof window !== 'undefined') window.Review = Review;
