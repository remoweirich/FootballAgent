// ============================================================
//  Central Game State
// ============================================================
const GameState = {
    week: 1,
    seasonStartYear: 2025,
    players: [],
    inbox: [],           // email messages (offers, news, summaries)
    log: [],             // short activity log
    agency: null,
    league: null,        // standings, schedules, cups (rebuilt each season)
    clubHistory: {},     // { clubId: [{year, division, position, trophies:[compId]}] }
    lastSeasonReport: null, // snapshot of finished-season cups/play-offs/promotions     // { clubId: [{year, division, position, trophies:[compId]}] }
    homeCountry: 'Netherlands', // chosen at the start: drives initial talents + domestic scouting regions
    needsSetup: false,

    STORAGE_KEY: 'fam_proto_v4',

    // ---- season phase ----
    isTransferWindowOpen(w = this.week) { return (w >= 1 && w <= 6) || (w >= 28 && w <= 33); },
    absWeek() { return this.seasonStartYear * 52 + this.week; },
    // record a money flow by category for the Finance tab (positive = income, negative = expense)
    addFinance(cat, amount) {
        if (!amount) return;
        const a = this.agency; if (!a) return;
        if (!a.ledger) a.ledger = {};
        if (!a.ledgerAll) a.ledgerAll = {};
        a.ledger[cat] = (a.ledger[cat] || 0) + amount;
        a.ledgerAll[cat] = (a.ledgerAll[cat] || 0) + amount;
    },
    transferWindowKey(w = this.week) {
        if (w >= 1 && w <= 6) return this.seasonStartYear + ':S';
        if (w >= 28 && w <= 33) return this.seasonStartYear + ':W';
        return this.seasonStartYear + ':' + w;   // outside windows (e.g. free-agent signings): per-week
    },
    isSeasonActive(w = this.week) { return w >= 1 && w <= 47; },
    isOffSeason(w = this.week) { return w >= 48 && w <= 52; },
    phaseLabel() {
        if (this.isOffSeason()) return 'Off-season';
        if (this.isTransferWindowOpen()) return 'Transfer window open';
        return 'Season — window closed';
    },
    seasonLabelFor(y) {
        const a = String(y % 100).padStart(2, '0');
        const b = String((y + 1) % 100).padStart(2, '0');
        return `${a}/${b}`;
    },
    seasonLabel() { return this.seasonLabelFor(this.seasonStartYear); },

    // ---- init ----
    // async now (IndexedDB has no synchronous read) — the only call sites are the two
    // app boot sequences (js/main.js, ui/js/main.js) and the old UI's reset button,
    // all of which already need to await this before deciding setup-vs-load anyway.
    async hasSave() { return Storage.hasSave(); },
    async init() {
        if (!(await this.load())) {
            // no save: generate a default game (the live app shows the setup screen first and calls startNewGame)
            this.startNewGame(this.homeCountry || 'Netherlands', (this.agency && this.agency.name) || 'Your Agency');
        }
    },
    startNewGame(country, name) {
        this.homeCountry = (country && REGIONS_BY_COUNTRY[country]) ? country : 'Netherlands';
        this.week = 1; this.seasonStartYear = 2025;
        this.players = PlayerGen.generatePool();
        Agency.init();
        this.agency.name = (name && name.trim()) ? name.trim() : 'Your Agency';
        this.agency.homeCountry = this.homeCountry;
        PlayerGen.seedKnownProspects();
        League.setupSeason();
        this.needsSetup = false;
        this.save();
    },

    getPlayer(id) { return this.players.find(p => p.id === id); },

    addLog(text, type = 'info') {
        this.log.unshift({ week: this.week, season: this.seasonLabel(), text, type });
        if (this.log.length > 60) this.log.length = 60;
    },

    // ---- inbox ----
    addMail(mail) {
        mail.id = mail.id || ('m_' + Math.random().toString(36).slice(2, 9));
        mail.week = this.week;
        mail.abs = this.absWeek();
        mail.season = this.seasonLabel();
        mail.read = false;
        this.inbox.unshift(mail);
        if (this.inbox.length > 120) this.inbox.length = 120;
        return mail;
    },
    unreadCount() { return this.inbox.filter(m => !m.read).length; },
    markAllRead() { this.inbox.forEach(m => m.read = true); },
    dismissAllMail() { this.inbox = []; },
    removeMail(id) { this.inbox = this.inbox.filter(m => m.id !== id); },

    // ---- persistence ----
    // Fire-and-forget on purpose: every one of the ~80 call sites across the engine and
    // both UIs just calls GameState.save() synchronously, same as always. Storage.saveGame()
    // itself debounces the actual IndexedDB write (see js/storage.js) — advanceWeek() forces
    // an immediate flush (js/simulation.js), as does the app being backgrounded.
    save() {
        try {
            Storage.saveGame({
                week: this.week, seasonStartYear: this.seasonStartYear, homeCountry: this.homeCountry,
                players: this.players, inbox: this.inbox, log: this.log,
                agency: this.agency, league: this.league, clubHistory: this.clubHistory,
                lastSeasonReport: this.lastSeasonReport
            });
        } catch (e) { console.warn('Save failed', e); }
    },
    async load() {
        const d = await Storage.loadGame();
        if (!d) return false;
        try {
            this.week = d.week; this.seasonStartYear = d.seasonStartYear;
            this.homeCountry = d.homeCountry || (d.agency && d.agency.homeCountry) || 'Netherlands';
            this.players = d.players || []; this.inbox = d.inbox || [];
            this.log = d.log || []; this.agency = d.agency; this.league = d.league;
            this.clubHistory = d.clubHistory || {};
            this.lastSeasonReport = d.lastSeasonReport || null;
            return this.players.length > 0 && this.agency != null;
        } catch (e) { console.warn('Load failed', e); return false; }
    },
    // native-dialog version, kept for the old desktop UI's plain reset button
    async reset() {
        if (!confirm('Reset the game? All progress will be lost.')) return;
        await this.hardReset();
    },
    // no confirmation of its own — the caller (e.g. the mobile UI's "Reset save"
    // bottom sheet) is expected to have already confirmed with the player
    async hardReset() {
        await Storage.deleteSave();
        location.reload();
    }
};
