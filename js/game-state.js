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
    attendWindow: null,  // "Attend the Final" viewing window (finals to watch this week), or null
    homeCountry: 'Netherlands', // chosen at the start: drives initial talents + domestic scouting regions
    needsSetup: false,

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
    startNewGame(country, name, agentName) {
        this.homeCountry = (country && REGIONS_BY_COUNTRY[country]) ? country : 'Netherlands';
        this.week = 1; this.seasonStartYear = 2025;
        // Fix this game's RNG seed up front so the very first pool is drawn from the seeded stream;
        // it rides along in every save (see save/load) and also anchors background-squad regen.
        this.rngSeed = (Date.now() >>> 0) || 1;
        Rng.seed(this.rngSeed);
        this.players = PlayerGen.generatePool();
        Agency.init();
        this.agency.name = (name && name.trim()) ? name.trim() : 'Your Agency';
        this.agency.agentName = (agentName && agentName.trim()) ? agentName.trim() : '';
        this.agency.homeCountry = this.homeCountry;
        PlayerGen.seedKnownProspects();
        League.setupSeason();
        // Season 1 has no finished campaign to seed European entrants from, so the UEFA competitions
        // don't run in the first season (the Leagues > Europe view shows a disclaimer). They are built
        // at the first rollover from season 1's final tables + cup winners (see Simulation._rollNewSeason).
        // (Europe.syntheticStandings() remains available if we ever want to pre-populate season 1 instead.)
        this.needsSetup = false;
        this.save();
    },

    getPlayer(id) { return this.players.find(p => p.id === id); },

    // The agent's own name, for letters addressed to them (invitations). Empty on saves made before
    // the field existed — callers fall back to a neutral salutation.
    agentName() { return (this.agency && this.agency.agentName) || ''; },

    addLog(text, type = 'info') {
        this.log.unshift({ week: this.week, season: this.seasonLabel(), text, type });
        if (this.log.length > 60) this.log.length = 60;
    },

    // ---- inbox ----
    addMail(mail) {
        mail.id = mail.id || ('m_' + Rng.next().toString(36).slice(2, 9));
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
    // Build the persistable state object. Shared by the rolling autosave (save → Storage.saveGame) and
    // manual named saves (createNamedSave → Storage.putSlot), so both capture exactly the same shape.
    _snapshot() {
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
        return {
            week: this.week, seasonStartYear: this.seasonStartYear, homeCountry: this.homeCountry,
            // only the players the user can ever see are saved; the anonymous background squads
            // (~95% of the old save) are regenerated on load (see isPersistedPlayer / regenerateBackgroundSquads)
            players: this.players.filter(isPersistedPlayer), inbox: this.inbox, log: this.log,
            agency: this.agency, league: this.league, clubHistory: this.clubHistory,
            clubEuropeBest: this.clubEuropeBest, debug: this.debug,
            attendWindow: this.attendWindow,   // open "Attend the Final" viewing window, if any
            lastSeasonReport: this.lastSeasonReport, clubState,
            saveName: this.saveName || null,  // player-given name for this game (Settings > Save game)
            bestXI: this.bestXI || null,      // the player's hall-of-fame XI (Clients > Best XI)
            namedClean: !!this.namedClean,    // true = this exact state is backed up to a named slot
            savedAt: Date.now(),              // when this snapshot was taken (shown in the Load list)
            rngSeed: this.rngSeed,            // this game's fixed seed (anchors background-squad regen)
            rngState: Rng.getState(),         // live stream position, so a reload keeps rolling from here
            schemaVersion: this.SCHEMA_VERSION   // ordered-migration pipeline (see _runMigrations)
        };
    },
    save() {
        this.namedClean = false;   // any ordinary autosave = progress not yet captured in a named slot
        try { Storage.saveGame(this._snapshot()); }
        catch (e) { console.warn('Save failed', e); }
    },
    async load() {
        const d = await Storage.loadGame();
        if (!d) return false;
        return this._applySaved(d);
    },
    // Apply a loaded state object to the live GameState. Used by load() (autosave) and loadNamedSave().
    _applySaved(d) {
        try {
            this.week = d.week; this.seasonStartYear = d.seasonStartYear;
            this.homeCountry = d.homeCountry || (d.agency && d.agency.homeCountry) || 'Netherlands';
            this.players = d.players || []; this.inbox = d.inbox || [];
            this.log = d.log || []; this.agency = d.agency; this.league = d.league;
            this.clubHistory = d.clubHistory || {};
            this.clubEuropeBest = d.clubEuropeBest || {};
            this.debug = !!d.debug;   // developer/debug mode (off by default)
            this.attendWindow = d.attendWindow || null;
            this.lastSeasonReport = d.lastSeasonReport || null;
            this.saveName = d.saveName || null;
            this.bestXI = d.bestXI || null;
            this.namedClean = !!d.namedClean;
            // Restore the RNG: legacy saves predate the seed, so fall back to one derived from the
            // save so a given save always regenerates the same background squads. rngState (the live
            // position) is preferred; without it we reseed from rngSeed.
            this.rngSeed = (d.rngSeed != null ? d.rngSeed : ((d.seasonStartYear || 2025) * 52 + (d.week || 1))) >>> 0 || 1;
            Rng.setState(d.rngState != null ? d.rngState : this.rngSeed);
            this._runMigrations(d);
            // the save holds only the players the user can see; rebuild the anonymous background
            // squads around them (a near no-op for old saves that still carry full squads)
            if (typeof regenerateBackgroundSquads === 'function') regenerateBackgroundSquads();
            return this.players.length > 0 && this.agency != null;
        } catch (e) { console.warn('Load failed', e); return false; }
    },

    // ---- manual named saves (Settings > Save game; Start > Load). The autosave above is separate. ----
    _slotSeq: 0,
    // summary shown in the Load list without reading a whole snapshot
    _metaOf(d, name) {
        return {
            name: (name != null ? name : (d.saveName || '')) || '',
            savedAt: d.savedAt || null,
            week: d.week || 1,
            seasonLabel: this.seasonLabelFor ? this.seasonLabelFor(d.seasonStartYear) : String(d.seasonStartYear || ''),
            agency: (d.agency && d.agency.name) || '',
            namedClean: !!d.namedClean,
        };
    },
    listNamedSaves() { return Storage.listSlots ? Storage.listSlots() : Promise.resolve([]); },
    // Snapshot the CURRENT game into a named slot. Reusing a name overwrites it; otherwise a free slot
    // is required (max 5). Returns { ok, message, id, overwritten }.
    async createNamedSave(name) {
        const nm = (name || '').trim();
        if (!nm) return { ok: false, message: 'Give the save a name.' };
        if (!Storage.putSlot) return { ok: false, message: 'Saving is unavailable here.' };
        const slots = await Storage.listSlots();
        const existing = slots.find(s => (s.name || '').toLowerCase() === nm.toLowerCase());
        if (!existing && slots.length >= Storage.MAX_SLOTS)
            return { ok: false, message: `You already have ${Storage.MAX_SLOTS} saves. Reuse a name to overwrite, or delete one first.`, full: true };
        const id = existing ? existing.id : 's' + Date.now().toString(36) + '-' + (++this._slotSeq);
        this.saveName = nm;    // the live game adopts the name too, so the autosave/Continue shows it
        this.namedClean = true;   // this exact state is now backed up to a slot
        const state = this._snapshot();
        const ok = await Storage.putSlot(id, state, this._metaOf(state, nm));
        if (!ok) { this.namedClean = false; return { ok: false, message: 'Save failed.' }; }
        Storage.saveGame(state);   // refresh the autosave so Continue/Load sees it as clean too
        return { ok: true, id, overwritten: !!existing, message: existing ? `Overwrote “${nm}”.` : `Saved as “${nm}”.` };
    },
    // Load a named slot into the live game AND make it the rolling autosave, so Continue resumes it.
    async loadNamedSave(id) {
        if (!Storage.getSlot) return false;
        const d = await Storage.getSlot(id);
        if (!d) return false;
        const ok = this._applySaved(d);
        if (ok) {
            this.namedClean = true;   // it came straight from a named slot — clean until you play on
            Storage.saveGame(this._snapshot());   // becomes the rolling autosave (kept clean)
        }
        return ok;
    },
    deleteNamedSave(id) { return Storage.deleteSlot ? Storage.deleteSlot(id) : Promise.resolve(false); },
    // Summary of the rolling autosave for the Load list (null if there isn't one).
    async autosaveMeta() {
        const d = await (Storage.loadGame ? Storage.loadGame() : null);
        return d ? this._metaOf(d) : null;
    },

    // ---- save schema versioning ----
    // Bump SCHEMA_VERSION and append a MIGRATIONS entry when the save shape changes. Each entry's
    // run() upgrades a save from the previous version to its own `to`; the pipeline runs every entry
    // newer than the loaded save, in order. A legacy save with no schemaVersion is inferred from the
    // old `worldV` marker (v2) or treated as v1 otherwise, so the very first saves still upgrade cleanly.
    SCHEMA_VERSION: 3,
    MIGRATIONS: [
        { to: 2, run(gs, d) { gs._migrateWorldV2(d); } },     // frozen-NPC world model + anchor/reputation split
        { to: 3, run(gs) { gs._migrateScoutRegions(); } }     // reshaped Portugal/Belgium scouting regions
    ],
    _runMigrations(d) {
        // Structural defaults, not versioned steps: they must apply on EVERY load, because a save at
        // the current version can still lack a lazily-added field (see the corresponding weekly ensure
        // helpers). Both are idempotent and self-guarding.
        this._migrateMoraleFields();
        this._restoreClubState(d.clubState);
        // versioned pipeline: infer the starting version, then run each newer migration in order
        let from = d.schemaVersion != null ? d.schemaVersion : (d.worldV >= 2 ? 2 : 1);
        for (const m of this.MIGRATIONS) if (m.to > from) { m.run(this, d); from = m.to; }
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
    // Portugal/Belgium scouting regions were reshaped (Norte split off Noroeste; Alentejo+Algarve
    // merged into Sul; N-E Belgium split off Noord-België; E-Belgique+Sud Belgique merged into
    // S-E Belgique). Re-point any scout parked on a removed region id so old saves aren't stranded.
    _migrateScoutRegions() {
        const remap = { 'Alejento': 'Sul', 'Algarve': 'Sul', 'E-Belgique': 'S-E Belgique', 'Sud Belgique': 'S-E Belgique' };
        ((this.agency && this.agency.scouts) || []).forEach(s => { if (s && s.region && remap[s.region]) s.region = remap[s.region]; });
    },
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
