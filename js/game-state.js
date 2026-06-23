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

    STORAGE_KEY: 'fam_proto_v4',

    // ---- season phase ----
    isTransferWindowOpen(w = this.week) { return (w >= 1 && w <= 6) || (w >= 21 && w <= 25); },
    absWeek() { return this.seasonStartYear * 52 + this.week; },
    transferWindowKey(w = this.week) {
        if (w >= 1 && w <= 6) return this.seasonStartYear + ':S';
        if (w >= 21 && w <= 25) return this.seasonStartYear + ':W';
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
    init() {
        if (!this.load()) {
            this.players = PlayerGen.generatePool();
            Agency.init();
            PlayerGen.seedKnownProspects();
            League.setupSeason();
            this.save();
        }
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
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                week: this.week, seasonStartYear: this.seasonStartYear,
                players: this.players, inbox: this.inbox, log: this.log,
                agency: this.agency, league: this.league, clubHistory: this.clubHistory,
                lastSeasonReport: this.lastSeasonReport
            }));
        } catch (e) { console.warn('Save failed', e); }
    },
    load() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return false;
        try {
            const d = JSON.parse(raw);
            this.week = d.week; this.seasonStartYear = d.seasonStartYear;
            this.players = d.players || []; this.inbox = d.inbox || [];
            this.log = d.log || []; this.agency = d.agency; this.league = d.league;
            this.clubHistory = d.clubHistory || {};
            this.lastSeasonReport = d.lastSeasonReport || null;
            return this.players.length > 0 && this.agency != null;
        } catch (e) { console.warn('Load failed', e); return false; }
    },
    reset() {
        if (confirm('Reset the game? All progress will be lost.')) {
            localStorage.removeItem(this.STORAGE_KEY);
            location.reload();
        }
    }
};
