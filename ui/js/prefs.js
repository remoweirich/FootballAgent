// ============================================================
//  Device-level preferences — separate from game saves.
//  Theme, language, and (later) audio volumes live here in
//  localStorage, so they apply on the Start screen before any
//  game is loaded and persist across saves / new games.
//  Loaded FIRST among the UI scripts; self-applies the theme at
//  parse time (before Main.boot renders) to avoid a theme flash.
// ============================================================
const Prefs = {
    KEY: 'fa_prefs',
    _cache: null,
    all() {
        if (this._cache) return this._cache;
        try { this._cache = JSON.parse(localStorage.getItem(this.KEY)) || {}; }
        catch (e) { this._cache = {}; }
        return this._cache;
    },
    get(k, dflt) { const v = this.all()[k]; return v === undefined ? dflt : v; },
    set(k, v) {
        const a = this.all(); a[k] = v;
        try { localStorage.setItem(this.KEY, JSON.stringify(a)); } catch (e) { /* private mode / quota */ }
        return v;
    },
};

// Theme: 'dark' (default — the app's original look), 'light', or 'system' (follow the OS).
// The resolved value ('dark' | 'light') is stamped on <html data-theme> and drives the
// [data-theme="light"] token overrides in design-tokens.css.
const Theme = {
    MODES: ['system', 'dark', 'light'],
    LABEL: { system: 'System', dark: 'Dark', light: 'Light' },
    get() { return Prefs.get('theme', 'dark'); },
    set(mode) { Prefs.set('theme', this.MODES.includes(mode) ? mode : 'dark'); this.apply(); },
    _prefersLight() { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches); },
    resolved(mode) {
        mode = mode || this.get();
        if (mode === 'system') return this._prefersLight() ? 'light' : 'dark';
        return mode === 'light' ? 'light' : 'dark';
    },
    apply() {
        try { document.documentElement.setAttribute('data-theme', this.resolved()); } catch (e) { /* no DOM yet */ }
    },
};

// Currency: EUR is the baseline — every amount in the game is stored in euros. GBP/CHF are derived
// by a fixed rate and rounded to the nearest 10. UI.money/UI.abbr convert the number, I18n.t swaps the
// € symbol in translated strings, and UI.cur() returns the active symbol. See ui/js/shim.js.
const Currency = {
    CODES: ['EUR', 'GBP', 'CHF'],
    INFO: { EUR: { sym: '€', rate: 1 }, GBP: { sym: '£', rate: 0.86 }, CHF: { sym: 'CHF ', rate: 0.95 } },
    get() { const c = Prefs.get('currency', 'EUR'); return this.INFO[c] ? c : 'EUR'; },
    set(code) { if (this.INFO[code]) Prefs.set('currency', code); },
    sym() { return this.INFO[this.get()].sym; },
    // convert a baseline euro amount to the chosen currency; non-EUR is rounded to the nearest 10
    conv(eur) {
        eur = eur || 0;
        const code = this.get();
        if (code === 'EUR') return Math.round(eur);
        const sign = eur < 0 ? -1 : 1;
        return sign * Math.round(Math.abs(eur) * this.INFO[code].rate / 10) * 10;
    },
};

// Apply immediately (parse-time) so content renders in the right theme from the first paint.
Theme.apply();
// Keep 'system' mode live if the OS theme flips while the app is open.
if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => { if (Theme.get() === 'system') Theme.apply(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);   // older WebViews
}
