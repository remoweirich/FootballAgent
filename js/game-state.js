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
            // Clubs.init() rebuilds allClubs from static LEAGUES_DATA on every boot (hardcoded
            // division/reputation), so without saving the mutable bits here, every restart
            // silently reset the whole pyramid to its day-one layout and corrupted the next
            // promotion/relegation (clubs "promoted" from mid-table, league sizes drifting).
            // Static data (names/colours/etc.) stays in code - only what actually changes at
            // runtime is persisted here, keyed by club id so saves stay forward-compatible
            // with future club-list changes (a club present in code but absent from an old
            // save just keeps its static default - see _restoreClubState below).
            const clubState = {};
            (Clubs.allClubs || []).forEach(c => {
                clubState[c.id] = {
                    division: c.division, reputation: c.reputation,
                    anchorRep: c.anchorRep,
                    seasonDelta: c.seasonDelta, streakDir: c.streakDir, streakLen: c.streakLen
                };
            });
            Storage.saveGame({
                week: this.week, seasonStartYear: this.seasonStartYear, homeCountry: this.homeCountry,
                players: this.players, inbox: this.inbox, log: this.log,
                agency: this.agency, league: this.league, clubHistory: this.clubHistory,
                lastSeasonReport: this.lastSeasonReport, clubState,
                worldV: 2   // frozen-NPC world model (see _migrateWorldV2)
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
            this._migrateMoraleFields();
            this._restoreClubState(d.clubState);
            this._migrateWorldV2(d);
            return this.players.length > 0 && this.agency != null;
        } catch (e) { console.warn('Load failed', e); return false; }
    },
    // One-time migration to the frozen-NPC world model (worldV 2). Pre-V2 saves carry a living
    // NPC pool that aged and decayed for every season played (a season-8 save's background
    // players average ~33 years old with visibly eroded ability), plus per-NPC stat buckets
    // nobody can ever view that make up the bulk of the save size. Since background players are
    // invisible by design, regenerating them fresh from their club's reputation is undetectable
    // in play — only sim-relevant players (clients, ex-clients, scouted prospects) are kept as
    // they are. Also splits the old single reputation into anchor + fading client legacy.
    _migrateWorldV2(d) {
        if (d && d.worldV >= 2) return;
        (Clubs.allClubs || []).forEach(c => {
            const anchor = c.anchorRep != null ? c.anchorRep : c.baseRep;   // static value from code
            if (c.reputation < anchor) {
                // old relegation drift belongs in the anchor under the new model
                c.anchorRep = Math.max(Math.max(20, c.baseRep - 10), c.reputation);
            }
            // reps inflated by stars the agent sent there are kept as-is: they now fade
            // naturally (1-5/season) via League.normalizeReputations once no longer justified
            c.reputation = Math.max(20, Math.min(95, Math.round(c.reputation)));
        });
        (this.players || []).forEach(p => {
            if (isSimRelevant(p) || p.archived) return;   // keep everyone the user can see
            const club = Clubs.getClubById(p.clubId);
            const rep = club ? club.reputation : 45;
            p.age = PlayerGen.randSquadAge();
            let ab = PlayerGen.gauss(rep, 7);
            if (p.age < 24) ab -= (24 - p.age) * 1.1;
            p.ability = Math.max(3, Math.min(99, Math.round(ab)));
            p.potential = p.ability;
            p.stats = {}; p.history = { ability: [], wage: [], fees: [] };
            p.injury = null; p.injuryHistory = []; p.trophies = [];
        });
        this.save();
    },
    // Club division/reputation persistence (see the comment in save()). Clubs.init() has
    // always already run by this point (both boot sequences call it before GameState.load() -
    // see js/main.js / ui/js/main.js), so this only overlays the mutable fields on top of a
    // fresh static club list. Idempotent: re-running it (e.g. a second load in the same
    // session) just reapplies the same values.
    _restoreClubState(clubState) {
        if (clubState) {
            Object.entries(clubState).forEach(([id, s]) => {
                const c = Clubs.getClubById(id);
                if (!s || !c) return;   // club removed from code since this save - keep its static default
                // only call setDivision when the division actually changed: it looks up
                // Clubs.DIV_TIERS/DIV_NAMES, which don't (yet) cover every division a club
                // can statically start in (e.g. Italy has no promotion/relegation wired up
                // at all) - calling it needlessly for a club whose division never moved
                // would blank out its tier/divisionName instead of leaving them alone
                if (s.division && s.division !== c.division) Clubs.setDivision(id, s.division);
                if (s.reputation != null) c.reputation = s.reputation;
                if (s.anchorRep != null) c.anchorRep = s.anchorRep;
                if (s.seasonDelta != null) c.seasonDelta = s.seasonDelta;
                if (s.streakDir !== undefined) c.streakDir = s.streakDir;
                if (s.streakLen != null) c.streakLen = s.streakLen;
            });
            return;
        }
        // Repair path for saves written before this fix (no clubState at all): reconstruct
        // divisions from the season already in progress - every clubId listed in
        // league.tables[div] was playing in div this season, so that's authoritative for
        // where it belongs right now. Clubs in no table at all keep whatever Clubs.init()
        // gave them. Reputation has no equivalent record to recover, but division is the
        // field that actually corrupts promotion/relegation, and sizes fully renormalize at
        // the next rollover regardless. Persist the repair immediately so it only ever runs once.
        const tables = this.league && this.league.tables;
        if (!tables) return;
        let repaired = false;
        Object.entries(tables).forEach(([div, rows]) => {
            (rows || []).forEach(r => {
                if (Clubs.getClubById(r.clubId)) { Clubs.setDivision(r.clubId, div); repaired = true; }
            });
        });
        if (repaired) this.save();
    },
    // morale-rework save migration: old saves lack these fields entirely. Defensive defaults
    // only — never overwrites a field that's already there. Sim._ensureMoraleFields does the
    // same thing lazily every week, so this is belt-and-braces for the Morale tab/Home screen
    // being correct on the very first render after loading, before any week has been advanced.
    _migrateMoraleFields() {
        const aw = this.absWeek();
        (this.players || []).forEach(p => {
            if (!p.morale) p.morale = { club: 70, time: 70, wage: 70, agent: 70 };
            if (p.moraleCase === undefined) p.moraleCase = null;
            if (!p._badStreak) p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 };
            if (p._playStreak == null) p._playStreak = 0;
            if (p._benchStreak == null) p._benchStreak = 0;
            if (p._lastAgentActionAbs == null) p._lastAgentActionAbs = aw;
            if (p._neglectWarned == null) p._neglectWarned = false;
            if (!p._moraleHist) p._moraleHist = [{ club: p.morale.club, time: p.morale.time, wage: p.morale.wage, agent: p.morale.agent }];
            if (!p._giftLog) p._giftLog = { small: null, medium: null, large: null, lastAny: null };
        });
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
