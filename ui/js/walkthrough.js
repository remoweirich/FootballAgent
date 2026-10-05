// ============================================================
//  Walkthrough — the first-run interactive tutorial.
//
//  It runs on the REAL screens, not mock-ups: a scripted demo save is swapped into GameState for
//  the duration, so every tab (Potential / Morale / Injuries / Contract / History) renders through
//  the normal code and the tutorial can never drift out of sync with the UI.
//
//  Nothing is persisted while it runs. GameState.save() has ~66 call sites, so rather than guard
//  each one, GameState.demoMode short-circuits save() itself (see js/game-state.js) — the player's
//  own save cannot be touched. On finish/skip the snapshotted fields are put back verbatim.
//
//  A step highlights a DOM element by CSS selector and dims everything else with four backdrop
//  panes around it, which leaves the highlighted element genuinely tappable while the rest of the
//  screen is inert. That is how "tap the inbox" steps work: the player performs the real action.
// ============================================================
const Walkthrough = {
    KEY: 'walkthroughDone',       // Prefs flag: device-scoped, so it runs once per device
    EDGE: 14,                     // keep the card this far off the top/bottom of the screen
    _active: false,
    _i: 0,
    _saved: null,                 // snapshot of the real GameState fields we replace
    _tick: null,                  // reposition poll
    _steps: [],

    // ---- lifecycle -------------------------------------------------------------------------
    done() { return (typeof Prefs !== 'undefined') && Prefs.get(this.KEY, false) === true; },
    markDone() { if (typeof Prefs !== 'undefined') Prefs.set(this.KEY, true); },

    // Offered automatically the first time a new game reaches Home. Replayable from Settings.
    maybeOffer() {
        if (this.done() || this._active) return false;
        if (typeof GameState === 'undefined' || !GameState.agency) return false;
        this.start();
        return true;
    },

    start() {
        if (this._active) return;
        this._active = true;
        this._i = 0;
        this._installDemo();
        this._steps = this.SCRIPT.slice();
        this._injectCSS();
        this._layer();
        if (typeof Router !== 'undefined') Router.go('home');
        // let the home render settle before measuring the first target
        setTimeout(() => this._show(), 60);
        this._tick = setInterval(() => { this._autoMin(); this._position(); }, 220);
    },

    // Leave the tutorial: put the player's own game back exactly as it was, then land on Home.
    finish(skipped) {
        if (!this._active) return;
        this._active = false;
        this._explore = false;
        clearInterval(this._tick); this._tick = null;
        this._restore();
        this.markDone();
        const l = document.getElementById('wtLayer'); if (l) l.remove();
        if (typeof Router !== 'undefined') { Router.closeSheet(); Router.closeModal(); Router.go('home'); Router.refresh(); }
        if (!skipped && typeof Router !== 'undefined') Router.result(I18n.t('wt.finished'), 'ok');
    },
    skip() { this.finish(true); },

    // The tour is over but the demo world is left standing so he can wander it. Home swaps its
    // advance button for "Leave tutorial", which is what finally restores his own save.
    isExploring() { return !!this._explore; },
    explore() {
        this._explore = true;
        clearInterval(this._tick); this._tick = null;
        const l = document.getElementById('wtLayer'); if (l) l.remove();
        if (typeof Router !== 'undefined') { Router.go('home'); Router.refresh(); }
    },

    // ---- demo save -------------------------------------------------------------------------
    // Replace only the fields the tutorial shows. league/clubHistory and the rest stay as they are,
    // so screens that read them keep working; restoring puts the original references straight back.
    // `startYear` travels with seasonStartYear: seasonsCompleted() is the difference between them,
    // so swapping one without the other makes the demo (or the real save it hands back) report a
    // nonsense season count.
    FIELDS: ['players', 'inbox', 'log', 'week', 'seasonStartYear', 'startYear', 'agency', 'homeCountry',
        'clubHistory', 'clubEuropeBest'],

    _installDemo() {
        const G = GameState;
        this._saved = {};
        this.FIELDS.forEach(f => { this._saved[f] = G[f]; });
        G.demoMode = true;                     // blocks every save() while the tutorial runs

        // Season 30/31, late in the campaign: Johan has 32 appearances behind him. startYear is
        // pinned five seasons back so the demo agent reads as five seasons in, whatever the
        // shipped default start season happens to be.
        G.seasonStartYear = 2030;
        G.startYear = 2025;
        G.week = 34;
        G.log = [];
        // Part 2 is set in England: West Midlands scouting, Birmingham Claret, the Third Division.
        G.homeCountry = 'England';
        // A deep copy: Object.assign copies only the top level, so upgrades/relationships/ledger
        // would still be the very objects the real save owns - and dressing the demo world up would
        // hand the player an upgraded office and a garage in his brand-new game.
        G.agency = Object.assign(JSON.parse(JSON.stringify(this._saved.agency || {})), {
            balance: 1850000,
            reputation: 82,
            homeCountry: 'England',
            scouts: [],
            // A fixed shortlist instead of the random catalogue. Wages come from the game's own
            // salaryFor(quality) so the tutorial never shows a price the real game couldn't produce.
            scoutMarket: this.DEMO_SCOUTS.map(sc => Object.assign({ region: null, maxTalentAge: 22 }, sc)),
            // parked far ahead so the two-weekly refresh can't swap the shortlist out mid-tutorial
            scoutMarketWeek: G.absWeek() + 500,
        });
        G.players = [this._demoPlayer()];
        this._demoClub(G);
        G.inbox = [];
        // newest first, so the welcome sits on top
        const vars = { agency: G.agency.name };
        Walkthrough.STARTER_MAILS.forEach(m => G.addMail({ kind: m.kind, subject: I18n.t(m.subj, vars), body: I18n.t(m.body, vars), ttl: 99 }));
    },

    _restore() {
        const G = GameState;
        if (this._saved) this.FIELDS.forEach(f => { G[f] = this._saved[f]; });
        this._saved = null;
        G.demoMode = false;
    },

    // Built through the real PlayerGen so every field the seven tabs read exists in the right
    // shape; only the values the script names are overridden.
    _demoPlayer() {
        const club = Clubs.getClubById('Bayern Munich');
        const p = PlayerGen.makePlayer(club, { ability: 92, age: 24, position: 'CAM' });
        p.id = 'wt_johan';
        p.name = 'Johan Maradona';
        p.nationality = 'Switzerland';
        p.nationalityFlag = (typeof getNationalityFlag === 'function') ? getNationalityFlag('Switzerland') : '';
        p.clubId = 'Bayern Munich';
        p.squadRole = 'star';
        p.ability = 92; p.peakAbility = 92; p.potential = 96;
        p.wage = 250000;
        p.contractUntilSeason = 2031;          // -> "31/32"
        p.agentId = 'me';
        p.repUntilSeason = 2033;               // -> "33/34"
        p.repExpired = false;
        // commissions are whole percents in the engine (8 = 8%), not fractions
        p.wageCommission = 8;
        p.sponsorCommission = 9;
        // one sponsorship already running, so the Contract tab has something real to show
        p.sponsorDeals = [{ company: 'Halvard Sportswear', weekly: 7400, annual: 180000, untilSeason: GameState.seasonStartYear + 2 }];
        p.sponsorIncome = 7400;
        p.transferListed = false; p.loanListed = false;
        p.onLoanAt = null; p.loanUntilSeason = null;
        p.morale = { club: 47, time: 100, wage: 59, agent: 83 };
        p.bond = 38;                            // 25-49 -> "Trusted"
        p.personality = { primary: 'professional', secondary: 'homebody', revP: true, revS: false };
        // Facts live in the Dialogue shape ({favClub, ambition, family}); only the boyhood club is
        // known, so ambition and life keep showing their own "ask him sometime" copy.
        if (typeof Dialogue !== 'undefined') {
            const facts = Dialogue.ensureFacts(p);
            if (facts && facts.favClub) { facts.favClub.clubId = 'Basel'; facts.favClub.discovered = true; }
        }
        p.injury = { type: 'Ankle sprain', weeksOut: 3, total: 3, specialistUsed: false, treatedWeek: null };
        p.injuryHistory = [{ type: 'Hamstring tear', weeks: 22, season: '26/27' }];
        // Build the report through the real generator so it carries the role description and label
        // the Potential tab prints, then pin the verdict to what the script quotes.
        p.styleRole = 'attacking_midfielder';
        p.scoutQuality = 78;
        this._report(p, 78, 92, 86);        // Germany: 90+ international superstar, 84+ first-division star
        p.stats = this._demoStats();
        p.trophies = [];
        return p;
    },

    // Birmingham Claret's record, plus an agency that has clearly been going a while — so the club
    // page and the Agency/Finance screens have something real on them if he wanders off-script.
    _demoClub(G) {
        G.clubHistory = Object.assign({}, G.clubHistory, {
            'Aston Villa': [
                { year: 2025, division: 'PREM', position: 6, trophies: [] },
                { year: 2026, division: 'PREM', position: 8, trophies: [] },
                { year: 2027, division: 'PREM', position: 4, trophies: ['UECL'] },
                { year: 2028, division: 'PREM', position: 13, trophies: [] },
            ],
        });
        // stage index: 3 = Round of 16, 4 = Quarter-final, 7 = Winner
        G.clubEuropeBest = Object.assign({}, G.clubEuropeBest, {
            'Aston Villa': { UCL: { stage: 3, year: 2028 }, UEL: { stage: 4, year: 2026 }, UECL: { stage: 7, year: 2027 } },
        });
        if (!G.agency.relationships) G.agency.relationships = {};
        G.agency.relationships['Aston Villa'] = 50;   // Neutral
        const up = G.agency.upgrades || (G.agency.upgrades = {});
        up.officeIndex = 6; up.vehicleIndex = 2; up.propertyIndex = 1;
        if (!G.agency.ledger) G.agency.ledger = {};
        if (!G.agency.ledgerAll) G.agency.ledgerAll = {};
    },

    // A real scouting report (role label + written description), with the verdict pinned.
    // The verdict is pinned as POTENTIALS, not as finished strings: the report resolves its
    // ceiling/floor text through Scouting.tierLabel at read time now, so that it follows the
    // player's language and the current competition names. The tutorial narration describes the
    // verdict ("a floor of a solid English first-division regular") rather than quoting it, and is
    // itself translated, so nothing depends on the exact words.
    _report(p, quality, ceilingPot, floorPot) {
        if (typeof Scouting !== 'undefined' && Scouting.generateReport) Scouting.generateReport(p, quality);
        if (!p.report) p.report = { role: p.styleRole, scoutQuality: quality };
        p.report.estPotential = ceilingPot;
        p.report.floorPotential = floorPot;
        delete p.report.ceiling; delete p.report.floor;   // no stale resolved strings
    },

    // Career: Basel U21 23/24 · Basel (U21 + first team) 24/25 · Basel 25/26 · Stuttgart 26/27-27/28
    // · München Red 28/29-30/31 (third season, current). Age 17 at the first U21 season -> 24 now.
    _demoStats() {
        const st = {};
        const line = (year, clubId, loan, youth, apps, goals, assists, yellow, red, avg) => {
            if (!st[year]) st[year] = {};
            const key = clubId + (loan ? '|L' : '');
            st[year][key] = {
                clubId, loan: !!loan, youth: !!youth, order: year * 100,
                comps: { league: { apps, goals, assists, cs: 0, yellow, red, ratingSum: +(avg * apps).toFixed(2) } }
            };
        };
        line(2023, 'Basel U21', false, true, 24, 6, 5, 1, 0, 6.90);
        line(2024, 'Basel U21', false, true, 10, 4, 3, 0, 0, 7.30);
        line(2024, 'Basel', false, false, 19, 5, 4, 2, 0, 7.05);
        line(2025, 'Basel', false, false, 33, 11, 9, 3, 0, 7.42);
        line(2026, 'Stuttgart', false, false, 14, 4, 3, 1, 0, 7.31);   // hamstring tear cost him 22 weeks
        line(2027, 'Stuttgart', false, false, 34, 13, 11, 4, 1, 7.68);
        line(2028, 'Bayern Munich', false, false, 31, 12, 10, 3, 0, 7.84);
        line(2029, 'Bayern Munich', false, false, 35, 16, 13, 2, 0, 8.05);
        line(2030, 'Bayern Munich', false, false, 32, 14, 12, 2, 0, 8.38);   // current season
        return st;
    },

    // Quality drives both the title (>=70 Chief, >=52 Senior) and the wage, via Scouts.salaryFor.
    DEMO_SCOUTS: [
        { id: 'wt_wilson', name: 'James Wilson', title: 'Senior scout', quality: 61, weeklyCost: 1760 },
        { id: 'wt_harris', name: 'Gemma Harris', title: 'Chief scout', quality: 75, weeklyCost: 4590 },
        { id: 'wt_jackson', name: 'Mo Jackson', title: 'Chief scout', quality: 85, weeklyCost: 8200 },
    ],

    // ---- frozen-world advance ------------------------------------------------------------
    // Sim.advanceWeek() hands over to this while the tutorial is up. Nothing is simulated: the
    // week ticks, the books are settled, and whichever beat belongs to this week is played.
    demoAdvance() {
        const G = GameState;
        const events = [];
        G.week += 1;
        this._settleBooks(events);
        this._tickInjury(events);
        const beat = this.BEATS[G.week];
        if (beat) { try { this[beat](events); } catch (e) { /* a broken beat must not strand the player */ } }
        return { events, spotlights: [], rolledSeason: false, seasonFinished: false, windowClosed: null, attend: [] };
    },
    // week the beat fires on (the demo starts on 34, so the first advance lands on 35)
    BEATS: { 36: '_beatSponsor', 37: '_beatScoutReport' },

    // Wages out, commission in — so the header's weekly net and the Finance tab both mean something.
    _settleBooks(events) {
        const G = GameState, ag = G.agency;
        const scoutCost = (ag.scouts || []).reduce((n, s) => n + (s.weeklyCost || 0), 0);
        const office = (typeof Upgrades !== 'undefined' && Upgrades.office()) ? Upgrades.office().weekly : 0;
        // wageCommission is a PERCENTAGE — the real books divide by 100 (Agency.weeklyBreakdown).
        // Without it the tutorial paid 100x: Johan on 250k at 8% read as €2,000,000 a week.
        const commission = (typeof Agency !== 'undefined' ? Agency.clients() : []).reduce(
            (n, p) => n + Math.round((p.wage || 0) * (p.wageCommission || 0) / 100), 0);
        if (commission) { ag.balance += commission; G.addFinance('Commission', commission); }
        if (scoutCost) { ag.balance -= scoutCost; G.addFinance('Scouts', -scoutCost); }
        if (office) { ag.balance -= office; G.addFinance('Office', -office); }
        const net = commission - scoutCost - office;
        events.push({ type: 'money', text: I18n.t('wt.ev.books', { net: UI.euro(Math.abs(net)), dir: I18n.t(net >= 0 ? 'wt.ev.up' : 'wt.ev.down') }) });
    },

    // He is three weeks out at the start; untreated that is exactly the length of this demo, and
    // physio/specialist simply bring the good news forward.
    _tickInjury(events) {
        const p = (GameState.players || []).find(x => x.id === 'wt_johan');
        if (!p || !p.injury) return;
        p.injury.weeksOut = Math.max(0, p.injury.weeksOut - 1);
        if (p.injury.weeksOut > 0) return;
        const name = p.name;
        p.injury = null;
        GameState.addMail({ kind: 'news', subject: I18n.t('wt.mail.fit.subj', { name }), body: I18n.t('wt.mail.fit.body', { name }), ttl: 6 });
        events.push({ type: 'injury', text: I18n.t('wt.ev.fit', { name }) });
    },

    // Beat 2: three sponsors want a piece of Johan.
    _beatSponsor(events) {
        const p = (GameState.players || []).find(x => x.id === 'wt_johan');
        if (!p) return;
        const offer = {
            playerId: p.id, level: 'international', legend: false, hot: true, standout: false,
            options: [
                { company: 'Aster Athletic', weekly: 9800, annual: 260000, termSeasons: 2 },
                { company: 'Kestrel Energy', weekly: 6400, annual: 430000, termSeasons: 3 },
                { company: 'Nordwelle Bank', weekly: 12500, annual: 120000, termSeasons: 1 },
            ],
        };
        GameState.addMail({ kind: 'sponsor', subject: I18n.t('sim.sponsorOffersSubj', { name: p.name }), offer, persistence: 0, ttl: 6 });
        events.push({ type: 'offer', text: I18n.t('wt.ev.sponsor', { name: p.name }) });
    },

    // Beat 3: Gemma's first report — one name.
    _beatScoutReport(events) {
        const wayne = this._demoProspect();
        GameState.players.push(wayne);
        const scout = (GameState.agency.scouts || [])[0];
        const who = scout ? scout.name : 'Gemma Harris';
        GameState.addMail({
            kind: 'news',
            subject: I18n.t('wt.mail.scout.subj', { scout: who }),
            body: I18n.t('wt.mail.scout.body', { scout: who, name: wayne.name, age: wayne.age, pos: wayne.position, club: UI.clubName(wayne.clubId) }),
            ttl: 6,
        });
        events.push({ type: 'scout', text: I18n.t('wt.ev.scout', { scout: who, name: wayne.name }) });
    },

    // Wayne Kane — 17, striker, Birmingham Claret. Built through PlayerGen for shape, then pinned
    // to the numbers the script quotes.
    _demoProspect() {
        const club = Clubs.getClubById('Aston Villa');
        const p = PlayerGen.makePlayer(club, { ability: 56, age: 17, position: 'ST' });
        p.id = 'wt_wayne';
        p.name = 'Wayne Kane';
        p.nationality = 'England';
        p.nationalityFlag = (typeof getNationalityFlag === 'function') ? getNationalityFlag('England') : '';
        p.clubId = 'Aston Villa';
        p.ability = 56; p.peakAbility = 56; p.potential = 83;
        p.wage = 5050;
        p.contractUntilSeason = GameState.seasonStartYear + 1;   // two seasons including this one
        p.squadRole = 'youth';
        p.agentId = null; p.repUntilSeason = null; p.repExpired = false;
        p.transferListed = false; p.loanListed = false;
        p.onLoanAt = null; p.loanUntilSeason = null;
        p.injury = null; p.injuryHistory = [];
        p.knownToAgent = true;
        p.discoveredWeek = GameState.absWeek();
        p.dismissedTalent = false; p.archived = false;
        p.styleRole = 'complete_forward';
        p.scoutQuality = 75;
        this._report(p, 75, 92, 79);        // England: 90+ international superstar, 77+ first-division regular
        p.stats = {};
        p.trophies = [];
        return p;
    },

    // Two mails every new save starts with (also seeded in GameState.startNewGame).
    STARTER_MAILS: [
        { kind: 'news', subj: 'mail.welcome.subj', body: 'mail.welcome.body' },
        { kind: 'news', subj: 'mail.basics.subj', body: 'mail.basics.body' },
    ],

    // ---- the script ------------------------------------------------------------------------
    // target : CSS selector to highlight (null = narration over a dimmed screen)
    // tap    : the player must tap the target to advance (the real action happens)
    // until  : advance only once this predicate is true (free roam meanwhile)
    // go     : navigate here before showing the step
    SCRIPT: [
        // ---------------- Home ----------------
        { key: 'wt.home.intro', go: 'home' },
        { key: 'wt.home.attention', target: '[data-wt="attention"]' },
        { key: 'wt.home.inbox', target: 'a.icon-btn[href="#inbox"]', tap: true },

        // ---------------- Inbox ----------------
        { key: 'wt.inbox.intro', target: '[data-wt="inbox-list"]' },
        {
            key: 'wt.inbox.read', target: '[data-wt="inbox-list"]',
            // The card sits over the screen, so it tucks itself away while a mail is open and comes
            // back when he returns to the list — otherwise it covers the second mail he is told to read.
            autoMin: () => /^#?mail\//.test(location.hash || ''),
            // ...and only advance once he is back on the LIST with both read. Advancing while still
            // inside the second mail put the next step's "go back" prompt on top of what he was reading.
            until: () => GameState.inbox.length > 0 && GameState.inbox.every(m => m.read)
                && !/^#?mail\//.test(location.hash || '')
        },
        { key: 'wt.inbox.back', target: '.push-bar__back', tap: true },

        // ---------------- Home -> Clients ----------------
        { key: 'wt.home.clients', go: 'home', target: '[data-wt="clients-field"]' },
        { key: 'wt.home.clientsTab', target: 'a.nav-item[href="#clients"]', tap: true },

        // ---------------- Clients list ----------------
        { key: 'wt.clients.general', target: '[data-wt="cl-general"]' },
        { key: 'wt.clients.stats', target: '.cl-stats' },
        { key: 'wt.clients.morale', target: '[data-wt="cl-morale"]' },
        { key: 'wt.clients.open', target: 'a.cl-card', tap: true },

        // ---------------- Client detail: overview ----------------
        { key: 'wt.client.overview' },
        { key: 'wt.client.shop', target: 'button[onclick*="openShop"]' },
        { key: 'wt.client.youth', target: 'button[onclick*="sendU21"]', place: 'above' },
        { key: 'wt.client.chat', target: 'button[onclick*="checkIn"]' },

        // ---------------- Morale ----------------
        { key: 'wt.client.toMorale', target: 'button.tab[onclick*="\'morale\'"]', tap: true },
        { key: 'wt.client.morale' },
        { key: 'wt.client.bond', scroll: 'bottom' },

        // ---------------- Injuries ----------------
        { key: 'wt.client.toInjuries', target: 'button.tab[onclick*="\'injuries\'"]', tap: true },
        { key: 'wt.client.injuries' },

        // ---------------- Back to the list ----------------
        { key: 'wt.client.back', target: '.push-bar__back', tap: true },
        { key: 'wt.clients.filters', go: 'clients', target: '[data-wt="cl-filters"]' },
        { key: 'wt.clients.sort', target: 'button[onclick*="pickSort"]' },
        { key: 'wt.clients.history', target: 'a.gbtn[href="#clienthist"]' },
        { key: 'wt.clients.outro' },

        // ---------------- Scouting: hire and post a scout ----------------
        { key: 'wt.scout.tab', target: 'a.nav-item[href="#scouting"]', tap: true },
        { key: 'wt.scout.empty' },
        { key: 'wt.scout.toHire', target: 'button.tab[onclick*="\'market\'"]', tap: true },
        { key: 'wt.scout.list' },
        { key: 'wt.scout.regions', target: '[data-wt="scout-regions"]', scrollTo: true },
        { key: 'wt.scout.hireGemma', target: '[data-scout="wt_harris"] button', tap: true, scrollTo: true },
        // Hiring opens the contract negotiation. Without a step here the tour fences the player
        // behind the sheet: #wtLayer sits at z-index 150, above .sheet-backdrop at 100, so the
        // next target would be unreachable underneath it.
        { key: 'wt.scout.contract', target: '.sheet .btn--primary', tap: true, gate: 'scoutTerm18' },
        { key: 'wt.scout.toYours', target: 'button.tab[onclick*="\'scouts\'"]', tap: true, scroll: 'top' },
        // Orders live on the scout card now, not inline on the list, so the tour has to open it.
        { key: 'wt.scout.openCard', target: 'a[data-scout-row="wt_harris"]', tap: true, scrollTo: true },
        {
            key: 'wt.scout.assign', gate: 'scoutBrief',
            until: () => (GameState.agency.scouts || []).some(s => s.region === 'west-midlands')
        },
        { key: 'wt.scout.brief', before: () => Walkthrough._briefGemma() },
        // The card is a detail screen and hides the bottom nav, so "tap Home" has nothing to
        // point at until the player is back on the scouting list.
        { key: 'wt.scout.back', target: '.push-bar__back', tap: true },
        { key: 'wt.scout.advance', target: 'a.nav-item[href="#home"]', tap: true },

        // ---------------- three weeks pass ----------------
        { key: 'wt.adv.first', go: 'home', target: '.cta-dock button', until: () => GameState.week >= 35 },
        { key: 'wt.adv.second', target: '.cta-dock button', until: () => GameState.week >= 36 },
        {
            key: 'wt.adv.sponsor', target: '.modal-card', place: 'top',
            // you have to actually take one of the three deals before moving on
            until: () => {
                const j = (GameState.players || []).find(p => p.id === 'wt_johan');
                return !!(j && (j.sponsorDeals || []).some(d => d.company !== 'Halvard Sportswear'));
            }
        },
        { key: 'wt.adv.third', target: '.cta-dock button', until: () => GameState.week >= 37 },
        {
            key: 'wt.adv.found', target: '.modal-card', place: 'top',
            // no Next: the player closes the weekly summary himself, so it cannot be skipped past
            until: () => !document.querySelector('.modal-card')
        },

        // ---------------- Wayne Kane: look him over and sign him ----------------
        {
            key: 'wt.found.toScouting', target: 'a.nav-item[href="#scouting"]', tap: true,
            // he was last on "Your scouts"; the find is on the Finds list
            before: () => { if (typeof ScoutingScreen !== 'undefined') ScoutingScreen.tab = 'finds'; }
        },
        { key: 'wt.found.tapWayne', target: 'a.cl-card[href*="wt_wayne"]', tap: true },
        { key: 'wt.wayne.card', place: 'bottom' },
        { key: 'wt.wayne.toPotential', target: 'button.tab[onclick*="\'potential\'"]', tap: true },
        { key: 'wt.wayne.potential', place: 'bottom' },
        { key: 'wt.wayne.offerRep', target: 'button[onclick*="openSign"]', tap: true },
        {
            key: 'wt.wayne.neg1', target: 'button[onclick*="proposeSign"]', place: 'top',
            waitFor: 'button[onclick*="proposeSign"]', gate: 'signTerms',
            until: () => {
                if (typeof ClientDetail === 'undefined') return false;
                const c = ClientDetail.ctx && ClientDetail.ctx('wt_wayne');
                return !!(c && c.sign && c.sign.round >= 2);
            }
        },
        {
            key: 'wt.wayne.neg2', target: 'button[onclick*="proposeSign"]', place: 'top',
            gate: 'signTerms',
            until: () => {
                const w = (GameState.players || []).find(p => p.id === 'wt_wayne');
                return !!(w && w.agentId === 'me');
            }
        },
        { key: 'wt.wayne.signed' },

        // ---------------- can he expect to play? -> a loan ----------------
        { key: 'wt.loan.checkClub', target: '.cl-sub a[href*="clubs"]', tap: true },
        { key: 'wt.loan.clubProfile', place: 'bottom' },
        { key: 'wt.loan.back', target: '.push-bar__back', tap: true },
        {
            key: 'wt.loan.request', target: 'button[onclick*="reqLoan"]', place: 'above',
            until: () => {
                const w = (GameState.players || []).find(p => p.id === 'wt_wayne');
                return !!(w && w._loanOk);
            }
        },
        { key: 'wt.loan.agreed', target: 'button[onclick*="openShop"]', tap: true },
        {
            key: 'wt.shop.loanMode', target: 'button.htog[onclick*="\'loan\'"]', place: 'bottom',
            until: () => {
                if (typeof ClientDetail === 'undefined') return false;
                const c = ClientDetail.ctx && ClientDetail.ctx('wt_wayne');
                return !!(c && c.shop && c.shop.mode === 'loan');
            }
        },
        {
            key: 'wt.shop.pitchAll', target: 'button.gbtn[onclick*="toggleShopDivision"][onclick*="LEAGUE1"]', place: 'top',
            until: () => {
                if (typeof ClientDetail === 'undefined') return false;
                const c = ClientDetail.ctx && ClientDetail.ctx('wt_wayne');
                return !!(c && c.shop && c.shop.selected && c.shop.selected.size > 0);
            }
        },
        {
            key: 'wt.shop.send', target: '#shopPitchBtn', place: 'top',
            until: () => (GameState.inbox || []).some(m => m.kind === 'loan')
        },
        {
            key: 'wt.shop.offers', place: 'top',
            until: () => {
                const w = (GameState.players || []).find(p => p.id === 'wt_wayne');
                return !!(w && w.onLoanAt);
            }
        },
        { key: 'wt.outro' },
    ],

    // Narrow her brief to what the script describes, so the find that follows is the one the
    // tutorial promises: any position, a top-division prospect, nobody older than 19.
    _briefGemma() {
        const sc = (GameState.agency.scouts || []).find(s => s.region === 'west-midlands');
        if (!sc) return;
        sc.maxTalentAge = 19;
        // targetPos / targetTier are what the engine reads (Scouts.rolledTalentFiltered); this
        // used to set `position` and `tier`, so only the age ever applied and the card contradicted
        // the narration beside it
        sc.targetPos = null;
        sc.targetTier = 'top';
        sc.weeksUntilFind = 3;   // the card must agree with the narration: three weeks, not a roll
        if (typeof Router !== 'undefined') Router.refresh();
    },

    // The tour cannot end unless Wayne actually goes somewhere, so while the loan offers are on
    // the table the last one is protected and "reject all" is refused outright. Outside the tour
    // (and once it is over and he is just exploring) this never fires.
    LOAN_STEP: 'wt.shop.offers',
    blocksLoanReject(playerId, rejectingAll) {
        if (!this._active || this._explore) return false;
        const step = this.step();
        if (!step || step.key !== this.LOAN_STEP) return false;
        if (playerId && playerId !== 'wt_wayne') return false;
        const left = (GameState.inbox || []).filter(m =>
            m.kind === 'loan' && m.offer && m.offer.playerId === 'wt_wayne').length;
        return rejectingAll ? left > 0 : left <= 1;
    },
    // shared refusal, so all three reject paths say the same thing
    refuseLoanReject() {
        if (typeof Router !== 'undefined') Router.result(I18n.t('wt.mustAccept'), 'bad');
        return true;
    },

    // values the narration can interpolate
    vars() {
        const ag = (typeof GameState !== 'undefined' && GameState.agency) || {};
        const t = k => (typeof I18n !== 'undefined' && I18n.t) ? I18n.t(k) : k;
        return {
            agency: ag.name || 'your agency',
            // Real control labels, so an instruction can never name a button that does not exist.
            // These drifted in German: the tour said "Anheuern" where the tab reads "Anwerben" and
            // the button reads "Anstellen". Interpolating them makes that impossible to repeat.
            tabHire: t('scouting.tab.market'),
            btnHire: t('agency.hire'),
            btnSetAssignment: t('sc.setAssignment'),
        };
    },

    // ---- step machinery --------------------------------------------------------------------
    step() { return this._steps[this._i]; },

    // Some steps teach by doing: the confirm button stays disabled until the player has actually
    // set what the narration asked for. The screens ask here rather than importing step keys.
    //
    // The NEXT step counts too. A gated control is usually created by the tap that advances into
    // the gated step — the hire sheet is built while "tap Hire" is still current — so checking
    // only the current step renders the button ungated and the gate never bites.
    gating(name) {
        if (!this._active) return false;
        const cur = this._steps && this._steps[this._i];
        const next = this._steps && this._steps[this._i + 1];
        return !!((cur && cur.gate === name) || (next && next.gate === name));
    },

    // At most this many clubs answer a tutorial pitch. In demo mode every club bites (so the tour
    // can never be stranded waiting for an offer), which turned "pitch to the whole division" into
    // 23 replies. See ClientDetail.doShop.
    DEMO_MAX_OFFERS: 4,

    // The terms the negotiation steps ask for, per round. Kept here beside the script so the
    // narration and the thing the button checks cannot drift apart; the sign sheet reads this and
    // leaves Propose disabled until the sliders match. Keyed by round rather than by step, because
    // the tour advances to the second step only after the first proposal has been rejected.
    SIGN_TERMS: {
        1: { wage: 14, sponsor: 12, term: 4 },
        2: { wage: 11, sponsor: 9, term: 5 },
    },
    signTerms(round) {
        if (!this.gating('signTerms')) return null;
        return this.SIGN_TERMS[round] || null;
    },

    next() {
        if (!this._active) return;
        this._i++;
        if (this._i >= this._steps.length) { this.explore(); return; }
        this._show();
    },

    _show() {
        const s = this.step(); if (!s) { this.finish(false); return; }
        if (s.go && typeof Router !== 'undefined') {
            const cur = (location.hash || '').replace(/^#/, '').split('/')[0];
            if (cur !== s.go) Router.go(s.go);
        }
        if (typeof s.before === 'function') { try { s.before(); } catch (e) { /* never block the tour */ } }
        if (s.scrollTo) this._scrollIntoView(s.target);
        if (s.scroll === 'bottom' || s.scroll === 'top') {
            const scr = document.querySelector('.screen');
            if (scr) scr.scrollTo({ top: s.scroll === 'top' ? 0 : scr.scrollHeight, behavior: 'smooth' });
        }
        this._autoMinWas = null;   // re-evaluate the auto-minimise for the new step
        this._awaitTarget(s, 0);
    },

    // Bring a highlighted element back into view before talking about it — after a long scroll the
    // thing the step describes can otherwise be off-screen behind the card.
    _scrollIntoView(sel) {
        if (!sel) return;
        setTimeout(() => {
            const el = document.querySelector(sel);
            if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); } }
        }, 120);
    },

    // Screens re-render asynchronously after navigation, so wait (briefly) for the target to exist
    // rather than measuring a node that is not in the DOM yet.
    _awaitTarget(s, tries) {
        if (!this._active || this.step() !== s) return;
        // waitFor is a HARD gate — don't speak until the sheet is open. A plain target is soft and
        // must not hold the text back: it used to, and while it waited (up to 60 x 60ms) the card
        // still showed the PREVIOUS step's words. Pressing Next then looked like the same box
        // appearing again and again. The ring and placement catch up on the next _position tick.
        if (!s.waitFor) { this._paint(); return; }
        if (document.querySelector(s.waitFor) || tries > 60) { this._paint(); return; }
        setTimeout(() => this._awaitTarget(s, tries + 1), 60);
    },

    // The "until" steps let the player roam freely; poll the predicate and move on when satisfied.
    _pollUntil() {
        const s = this.step();
        if (!s || !s.until) return;
        let ok = false;
        try { ok = !!s.until(); } catch (e) { ok = false; }
        if (ok) this.next();
    },

    // ---- rendering -------------------------------------------------------------------------
    _layer() {
        let l = document.getElementById('wtLayer');
        if (l) return l;
        l = document.createElement('div');
        l.id = 'wtLayer';
        l.innerHTML = `
            <div class="wt-pane" data-p="t" onclick="Walkthrough.collapse()"></div>
            <div class="wt-pane" data-p="b" onclick="Walkthrough.collapse()"></div>
            <div class="wt-pane" data-p="l" onclick="Walkthrough.collapse()"></div>
            <div class="wt-pane" data-p="r" onclick="Walkthrough.collapse()"></div>
            <div class="wt-ring"></div>
            <div class="wt-tap"><span></span></div>
            <button class="wt-fab" onclick="Walkthrough.expand()" aria-label="${I18n.t('wt.reopen')}"><i class="ti ti-route"></i></button>
            <div class="wt-card">
                <div class="wt-progress"></div>
                <p class="wt-text"></p>
                <div class="wt-actions">
                    <button class="wt-skip" onclick="Walkthrough.skip()"></button>
                    <button class="wt-hide" onclick="Walkthrough.collapse()"></button>
                    <button class="wt-next btn btn--primary btn--sm" onclick="Walkthrough.next()"></button>
                </div>
            </div>`;
        document.body.appendChild(l);
        return l;
    },

    _paint() {
        const l = this._layer(), s = this.step(); if (!s) return;
        this._min = false;                       // every new step arrives open, ready to be read
        this._autoMinWas = null;
        l.querySelector('.wt-text').innerHTML = I18n.t(s.key, this.vars());
        l.querySelector('.wt-skip').textContent = I18n.t('wt.skip');
        l.querySelector('.wt-hide').textContent = I18n.t('wt.hide');
        const nextBtn = l.querySelector('.wt-next');
        const gated = !!(s.tap || s.until);
        // inline display beats the .btn class rule, which was keeping Next clickable on tap steps
        // and letting the player skip a step whose whole point was performing the action
        nextBtn.hidden = gated;
        nextBtn.style.display = gated ? 'none' : '';
        nextBtn.textContent = I18n.t(this._i >= this._steps.length - 1 ? 'wt.done' : 'wt.next');
        l.querySelector('.wt-progress').textContent = I18n.t('wt.step', { n: this._i + 1, total: this._steps.length });
        l.classList.toggle('wt-gated', gated);
        this._position();
    },

    // Tucking the card away to a handle on the right is what makes the tour usable: you can read
    // the step, put it aside, look at (or work with) whatever it just described, then bring it back.
    // A step may ask to tuck the card away while the player is somewhere it would be in the way
    // (reading a mail). Fired on the TRANSITION only, so he can still expand it by hand and it
    // will not fight him on the next tick.
    _autoMin() {
        const s = this.step(); if (!s || typeof s.autoMin !== 'function') return;
        let want = false;
        try { want = !!s.autoMin(); } catch (e) { return; }
        if (want === this._autoMinWas) return;
        this._autoMinWas = want;
        this._min = want;
    },
    collapse() { if (!this._active) return; this._min = true; this._position(); },
    expand() { if (!this._active) return; this._min = false; this._position(); },

    // Lay the four dim panes around the target's rect, leaving it exposed and tappable.
    _position() {
        if (!this._active) return;
        const l = document.getElementById('wtLayer'); const s = this.step();
        if (!l || !s) return;
        if (s.until) this._pollUntil();
        const el = s.target ? document.querySelector(s.target) : null;
        // a step may position its card against one element while highlighting another (or none)
        const anchorEl = s.anchor ? document.querySelector(s.anchor) : el;
        const ring = l.querySelector('.wt-ring'), tap = l.querySelector('.wt-tap'), card = l.querySelector('.wt-card');
        const W = window.innerWidth, H = window.innerHeight;
        const pane = (p, x, y, w, h) => {
            const d = l.querySelector(`.wt-pane[data-p="${p}"]`);
            d.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px`;
        };
        const hidePanes = () => { pane('t', 0, 0, 0, 0); pane('b', 0, 0, 0, 0); pane('l', 0, 0, 0, 0); pane('r', 0, 0, 0, 0); };

        // An "until" step is a job the player does across several screens (open both mails, post a
        // scout, haggle a deal). Fencing the screen there strands him — the target he is allowed to
        // touch disappears the moment he navigates. So those steps never block, and neither does a
        // step whose target is not on screen.
        const freeRoam = !!s.until || !el;
        const blocking = !!(s.tap && el && !this._min);
        l.classList.toggle('wt-block', blocking);
        l.classList.toggle('wt-free', freeRoam);
        l.classList.toggle('wt-min', !!this._min);

        if (this._min) {   // tucked away: nothing dimmed, nothing fenced, ring left as a breadcrumb
            hidePanes();
            if (el) {
                const r0 = el.getBoundingClientRect(), p0 = 6;
                ring.style.cssText = `display:block;left:${r0.left - p0}px;top:${r0.top - p0}px;width:${r0.width + p0 * 2}px;height:${r0.height + p0 * 2}px`;
            } else ring.style.display = 'none';
            tap.style.display = 'none';
            return;
        }

        if (!el) {   // narration with nothing to point at: dim gently, place the card
            pane('t', 0, 0, W, H); pane('b', 0, 0, 0, 0); pane('l', 0, 0, 0, 0); pane('r', 0, 0, 0, 0);
            ring.style.display = 'none'; tap.style.display = 'none';
            this._placeCard(card, s, anchorEl, H);
            return;
        }
        const r = el.getBoundingClientRect(), pad = 6;
        const x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2;
        if (freeRoam) hidePanes();   // keep the highlight, drop the shroud
        else {
            pane('t', 0, 0, W, y);
            pane('b', 0, y + h, W, H - (y + h));
            pane('l', 0, y, x, h);
            pane('r', x + w, y, W - (x + w), h);
        }
        ring.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
        if (s.tap) {
            tap.style.cssText = `display:block;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px`;
        } else tap.style.display = 'none';
        this._placeCard(card, s, anchorEl, H);
    },

    // Where the card sits. A step can pin it (the weekly summary and the negotiation sliders both
    // need it out of the way); otherwise it goes under its anchor when there is room, above it if not.
    _placeCard(card, s, anchorEl, H) {
        card.classList.toggle('wt-card--top', s.place === 'top');
        if (s.place === 'top') { card.style.cssText = 'left:50%;transform:translateX(-50%)'; return; }
        const CH = card.offsetHeight || 170;
        const lo = this.EDGE, hi = Math.max(lo, H - CH - this.EDGE);
        const clamp = v => Math.max(lo, Math.min(hi, v));
        let top;
        if (!anchorEl) top = s.place === 'bottom' ? hi : Math.max(lo, (H - CH) / 2);
        else {
            const r = anchorEl.getBoundingClientRect(), pad = 6;
            const y = r.top - pad, h = r.height + pad * 2;
            if (s.place === 'bottom') top = hi;
            else if (s.place === 'above') top = clamp(y - CH - 14);
            else if (s.place === 'below') top = clamp(y + h + 14);
            else top = (H - (y + h) > CH + 30) ? clamp(y + h + 14) : clamp(y - CH - 14);
        }
        card.style.cssText = `left:50%;transform:translateX(-50%);top:${Math.round(top)}px`;
    },

    _injectCSS() {
        if (document.getElementById('wtCSS')) return;
        const css = `
        #wtLayer{position:fixed;inset:0;z-index:150;pointer-events:none}
        /* the shroud is only ever clickable on a single-tap step, and tapping it tucks the card
           away rather than swallowing the tap silently */
        .wt-pane{position:fixed;background:rgba(4,7,11,.58);pointer-events:none;transition:background .15s}
        #wtLayer.wt-block .wt-pane{pointer-events:auto}
        /* free-roam still dims — the panes are click-through there, so the shroud costs nothing
           and keeps the card legible. Only tucking it away clears the screen. */
        #wtLayer.wt-free .wt-pane{background:rgba(4,7,11,.5)}
        #wtLayer.wt-min .wt-card,#wtLayer.wt-min .wt-tap{display:none}
        .wt-fab{position:fixed;right:10px;top:50%;transform:translateY(-50%);width:44px;height:44px;
            border-radius:50%;border:1px solid var(--accent);background:var(--surface);color:var(--accent);
            display:none;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;
            box-shadow:0 6px 18px rgba(0,0,0,.45);z-index:2}
        .wt-fab .ti{font-size:22px}
        #wtLayer.wt-min .wt-fab{display:flex}
        .wt-ring{position:fixed;display:none;border:2px solid var(--accent);border-radius:var(--radius-md);
            box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 28%, transparent);pointer-events:none;
            transition:left .18s,top .18s,width .18s,height .18s}
        .wt-tap{position:fixed;display:none;width:0;height:0;pointer-events:none}
        .wt-tap span{position:absolute;left:-19px;top:-19px;width:38px;height:38px;border-radius:50%;
            border:2px solid var(--accent);animation:wtPulse 1.4s ease-out infinite}
        @keyframes wtPulse{0%{transform:scale(.55);opacity:.95}100%{transform:scale(1.5);opacity:0}}
        .wt-card--top{top:calc(env(safe-area-inset-top,0px) + 14px)}
        .wt-card{position:fixed;width:min(92vw,400px);background:var(--surface);color:var(--text);
            border:1px solid var(--accent);border-radius:var(--radius-lg);padding:var(--space-5);
            box-shadow:0 0 0 9999px rgba(4,7,11,.18), 0 18px 48px rgba(0,0,0,.75);pointer-events:auto}
        .wt-progress{font-size:var(--fs-xs);color:var(--text-dim);text-transform:uppercase;
            letter-spacing:var(--tracking-caps);margin-bottom:6px}
        .wt-text{margin:0 0 var(--space-4);font-size:var(--fs-lg);line-height:1.55}
        .wt-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .wt-skip{background:none;border:none;color:var(--text-dim);font:inherit;font-size:var(--fs-sm);
            cursor:pointer;padding:6px 2px;text-decoration:underline}
        .wt-hide{background:none;border:1px solid var(--line-strong);color:var(--text-secondary);font:inherit;
            font-size:var(--fs-sm);cursor:pointer;padding:6px 12px;border-radius:var(--radius-sm);margin-left:auto;margin-right:8px}
        .wt-gated .wt-next{display:none}`;
        const st = document.createElement('style'); st.id = 'wtCSS'; st.textContent = css;
        document.head.appendChild(st);
    },
};

// A tap on a highlighted target advances the tutorial: the real click runs first (navigating,
// switching tab, opening the player), then the script moves to its next line.
document.addEventListener('click', (e) => {
    if (!Walkthrough._active) return;
    const s = Walkthrough.step();
    if (!s || !s.tap || !s.target) return;
    const el = document.querySelector(s.target);
    if (el && (e.target === el || el.contains(e.target))) setTimeout(() => Walkthrough.next(), 120);
}, true);

if (typeof module !== 'undefined' && module.exports) module.exports = Walkthrough;
