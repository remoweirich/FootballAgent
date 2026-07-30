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
    LANGS: [{ code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }],

    register(loc, dict) { this.packs[loc] = Object.assign(this.packs[loc] || {}, dict); },
    available() { return this.LANGS.filter(l => this.packs[l.code]); },
    langName(code) { const l = this.LANGS.find(x => x.code === (code || this.locale)); return l ? l.name : (code || this.locale); },

    init() {
        const want = (typeof Prefs !== 'undefined') ? Prefs.get('lang', 'en') : 'en';
        this.locale = this.packs[want] ? want : 'en';
    },
    set(loc) {
        this.locale = this.packs[loc] ? loc : 'en';
        if (typeof Prefs !== 'undefined') Prefs.set('lang', this.locale);
    },

    // t('some.key', { n: 3 }) → looks up current locale, then English, then returns the key itself
    // (so a missing string is visible rather than blank).
    t(key, vars) {
        let s = this.packs[this.locale] && this.packs[this.locale][key];
        if (s === undefined) s = this.packs[this.fallback] && this.packs[this.fallback][key];
        if (s === undefined) return key;
        if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
        return s;
    },
};
