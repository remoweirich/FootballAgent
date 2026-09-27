// ============================================================
//  i18n engine — flat dotted keys, {var} interpolation, English
//  fallback. Locale packs register via I18n.register(loc, dict)
//  from i18n-<loc>.js script files (no runtime fetch — matches the
//  dialogue-data.js / injuries-data.js data-file pattern). The
//  chosen locale persists in device Prefs (js/prefs.js).
//  I18n.init() is called once from Main.boot(), after the packs
//  have registered.
// ============================================================
const I18n = {
    packs: {},
    locale: 'en',
    fallback: 'en',
    // languages offered in Settings — a pack must be registered for a code to be selectable
    LANGS: [{ code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }, { code: 'es', name: 'Español' }, { code: 'fr', name: 'Français' }, { code: 'pt', name: 'Português' }, { code: 'it', name: 'Italiano' }, { code: 'nl', name: 'Nederlands' }],

    register(loc, dict) { this.packs[loc] = Object.assign(this.packs[loc] || {}, dict); },
    available() { return this.LANGS.filter(l => this.packs[l.code]); },
    langName(code) { const l = this.LANGS.find(x => x.code === (code || this.locale)); return l ? l.name : (code || this.locale); },

    // First run has no stored choice, so match the DEVICE. Without this every player started in
    // English however their phone was set, and the six translations only reached the few who went
    // looking in Settings. An explicit choice is stored and always wins from then on.
    init() {
        const saved = (typeof Prefs !== 'undefined') ? Prefs.get('lang', null) : null;
        const want = (saved && this.packs[saved]) ? saved : this.deviceLang();
        this.locale = this.packs[want] ? want : 'en';
        this._applyDocLang();
    },
    // navigator.language(s) are full tags ('de-AT', 'pt-BR', 'en-GB'), so match on the base tag:
    // pt-BR lands on the pt-PT pack, which is far closer for that reader than English. Ordered by
    // the user's own preference list, so a German phone set to prefer Dutch gets Dutch.
    deviceLang() {
        let tags = [];
        try {
            if (typeof navigator !== 'undefined' && navigator) {
                tags = navigator.languages && navigator.languages.length ? navigator.languages
                    : (navigator.language ? [navigator.language] : []);
            }
        } catch (e) { /* no navigator (tests, headless) */ }
        for (const tag of tags) {
            const base = String(tag || '').toLowerCase().split('-')[0];
            if (base && this.packs[base]) return base;
        }
        return 'en';
    },
    set(loc) {
        this.locale = this.packs[loc] ? loc : 'en';
        if (typeof Prefs !== 'undefined') Prefs.set('lang', this.locale);
        this._applyDocLang();
        this._applyNativeComps();
    },
    // Competitions are named in their own country's language, which does not depend on the player's —
    // except in Switzerland and Belgium, where it does. So a language change has to re-resolve them,
    // and then let an imported real-names pack win again.
    _applyNativeComps() {
        try {
            if (typeof applyNativeCompNames === 'function') applyNativeCompNames();
            if (typeof GameState !== 'undefined' && GameState._applyCompNames) GameState._applyCompNames();
        } catch (e) { /* engine not loaded (tests, boot order) */ }
    },
    // Keep <html lang> in step, so a screen reader pronounces the page in the language it is in.
    _applyDocLang() {
        try { if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = this.locale; }
        catch (e) { /* no DOM */ }
    },

    // t('some.key', { n: 3 }) → looks up current locale, then English, then returns the key itself
    // (so a missing string is visible rather than blank).
    t(key, vars) {
        let s = this.packs[this.locale] && this.packs[this.locale][key];
        if (s === undefined) s = this.packs[this.fallback] && this.packs[this.fallback][key];
        if (s === undefined) return key;
        if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
        // currency: baseline strings are written with '€'; swap in the player's chosen symbol. (Amounts
        // are converted separately by UI.money/UI.abbr; interpolated euro() values already carry the
        // right symbol, so only literal '€' in the template remains to translate.)
        if (typeof Currency !== 'undefined' && Currency.get() !== 'EUR') { s = String(s); if (s.indexOf('€') >= 0) s = s.replace(/€/g, Currency.sym()); }
        return s;
    },
};
