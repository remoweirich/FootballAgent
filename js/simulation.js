// ============================================================
//  Simulation — advancing one calendar week
// ============================================================
const INJURY_TYPES = ['Knock', 'Muscle strain', 'Ankle sprain', 'Hamstring', 'Knee ligament'];

// ============================================================
//  MORALE — every tunable number for the morale system lives here so it can
//  be balanced without hunting through the engine. Bands are aligned with
//  the UI's own morale-dot colours (see UI.moraleVar in ui/js/shim.js):
//  GOOD >=60, MID 35-59, BAD <35. "avg" = mean of club/time/wage/agent.
// ============================================================
const MORALE = {
    BAND_GOOD: 60, BAND_BAD: 35,

    // ---- Phase 1: passive effects ----
    // match-rating modifier: linear from avg, kinked at the "0" point (55) —
    // NOT one straight line corner-to-corner (see simulation.js moraleRatingMod)
    RATING_MOD_HI_AVG: 85, RATING_MOD_HI: 0.10,
    RATING_MOD_ZERO_AVG: 55,
    RATING_MOD_LO_AVG: 25, RATING_MOD_LO: -0.30,
    RATING_MOD_CAP_HI: 0.1, RATING_MOD_CAP: 0.3,

    DEV_MULT_GOOD: 1.15, DEV_MULT_MID: 1.0, DEV_MULT_BAD: 0.8,

    MAX_WEEKLY_DIM_DRIFT: 5,   // anti-spiral: caps the weekly drift-to-target step, per dimension
    CLUB_DOWN_MULT: 0.25,      // club morale DECAYS at quarter speed (recovery runs full speed)
    WAGE_FAIR_FROM: 0.9,       // at/above this fraction of his market-for-ability wage he feels fairly paid
    WAGE_UNDERPAID_DECAY: 2.2, // weekly wage-morale erosion when underpaid, scaled by how far below fair he is
    CLUB_LOCK_UNDER_AGE: 18, CLUB_LOCK_VALUE: 80,   // U18s don't resent their club yet: pinned at 80

    TROPHY_CLUB: 12, TROPHY_AGENT: 8,
    PROMOTION_CLUB: 10, RELEGATION_CLUB: -12,
    HOT_FORM_AVG_RATING: 7.5, HOT_FORM_MIN_APPS: 10, HOT_FORM_MSG_MIN_APPS: 30,
    HOT_FORM_TIME: 15, HOT_FORM_WAGE: -10, HOT_FORM_CLUB: 30, HOT_FORM_AGENT: 20,

    // playing-time weekly ticks, keyed by how many consecutive weeks he has (not) played
    PLAY_TICK: { base: 1, mid: 3, long: 5 },        // streak 1-2 / 3-5 / 6-25+ weeks played
    BENCH_TICK: { base: -1, mid: -2.5, long: -5 },  // streak 1-2 / 3-5 / 6-25+ weeks NOT played (halved: was -2/-5/-10)
    TIME_STREAK_MID_FROM: 3, TIME_STREAK_LONG_FROM: 6,
    TIME_RESET_ON_MOVE: 70,
    CLUB_RESET_ON_MOVE: 90,      // he has to agree to sign, so he starts happy at a club he just joined
    CLUB_RENEW_BOOST: 20,        // re-signing a contract at a club he's already at lifts club morale
    // no "didn't play" penalty in weeks where matches aren't really available: the off-season
    // (48-52 + 1) and the international-break weeks (no league fixtures - league.js NO_LEAGUE).
    // Streaks are frozen in these weeks, not reset.
    BENCH_EXEMPT_WEEKS: [48, 49, 50, 51, 52, 1, 2, 10, 11, 12, 17, 18, 27, 28],

    // ---- Phase 2: agent dimension (earn-and-neglect, replaces the old flat decay) ----
    AGENT_DEAL_BONUS: 25,                                    // transfer/renewal concluded by the agent (never a stage-3 forced move)
    AGENT_LOAN_BONUS: 12, AGENT_LOAN_BONUS_OPEN_CASE: 18,    // proactive loan while time morale is below GOOD
    NEGLECT_GRACE_WEEKS: 26,     // no decay for this long after the last agent action
    NEGLECT_DECAY_1: 0.25,       // per week, weeks 26-104 of neglect
    NEGLECT_DECAY_2: 0.5,        // per week, beyond 104 weeks (2 seasons)
    NEGLECT_SEASON2_WEEKS: 104,

    // ---- Phase 3: escalation ladder ----
    CASE_OPEN_BAD_STREAK: 4,     // consecutive weeks a dimension must sit in BAD before a case opens
    TALK_AGENT_BONUS: 6, TALK_COOLDOWN_WEEKS: 4,
    PROMISE_EXTRA_WEEKS: 8,      // deadline for newContract/renegotiateRep (move/playingTime use next transfer window)
    PROMISE_KEPT_DIM: 20, PROMISE_KEPT_AGENT: 10,
    PROMISE_BROKEN_AGENT: -20, PROMISE_BROKEN_REP: -0.5,
    STAGE2_UNRESOLVED_WEEKS: 6, STAGE3_UNRESOLVED_WEEKS: 6,
    STAGE2_TIME_ATTRACT: 25, STAGE2_CLUB_ATTRACT: 35,
    STAGE2_WAGE_CLUB_PENALTY: -20,
    STAGE2_CLUB_FEE_MULT: 0.85, STAGE2_CLUB_ASK_MULT: 0.9,
    STAGE3_AGENT_LEAVE_WEEKS: 8,   // grace between the breaking-point warning and actually walking out
    DEPARTURE_AGENCY_REP: -1,

    // ---- Phase 4: gifts + market coupling ----
    GIFT_BOOST: { small: 10, medium: 30, large: 60 },
    GIFT_COST_MULT: { small: 1.5, medium: 5, large: 15 },
    GIFT_COST_MIN: 50,
    GIFT_DIMINISH_WEEKS: 12, GIFT_DIMINISH_FACTOR: 0.5,
    GIFT_TIER_COOLDOWN_WEEKS: 104,   // 2 seasons, per tier

    COMMISSION_TOLERANCE_GOOD: 3, COMMISSION_TOLERANCE_BAD: -3,
    SPONSOR_APPROACH_GOOD_BONUS: 0.05
};

// ---- core morale helpers (used by simulation.js, league.js, players.js, agency.js) ----
function moraleAvg(p) {
    const m = p.morale || {};
    return ((m.club || 0) + (m.time || 0) + (m.wage || 0) + (m.agent || 0)) / 4;
}
function moraleBand(avg) { return avg >= MORALE.BAND_GOOD ? 'GOOD' : avg >= MORALE.BAND_BAD ? 'MID' : 'BAD'; }
// match-rating modifier: two straight segments meeting at (55, 0) — NOT one line corner to
// corner (that would put avg 55 at -0.05, not 0). Hard-capped either way as a safety net.
function moraleRatingMod(avg) {
    const M = MORALE;
    let mod;
    if (avg >= M.RATING_MOD_ZERO_AVG) {
        const t = Math.max(0, Math.min(1, (avg - M.RATING_MOD_ZERO_AVG) / (M.RATING_MOD_HI_AVG - M.RATING_MOD_ZERO_AVG)));
        mod = t * M.RATING_MOD_HI;
    } else {
        const t = Math.max(0, Math.min(1, (M.RATING_MOD_ZERO_AVG - avg) / (M.RATING_MOD_ZERO_AVG - M.RATING_MOD_LO_AVG)));
        mod = t * M.RATING_MOD_LO;
    }
    // asymmetric on purpose: a happy player gets a nudge, an unhappy one can genuinely sulk
    return Math.max(-M.RATING_MOD_CAP, Math.min(M.RATING_MOD_CAP_HI, mod));
}
function moraleDevMult(avg) {
    const band = moraleBand(avg);
    return band === 'GOOD' ? MORALE.DEV_MULT_GOOD : band === 'BAD' ? MORALE.DEV_MULT_BAD : MORALE.DEV_MULT_MID;
}
// end of the current transfer window, or the next one if none is open right now —
// windows are weeks 1-6 (summer) and 28-33 (winter), matching GameState.isTransferWindowOpen
function nextTransferWindowEndAbsWeek() {
    const year = GameState.seasonStartYear, week = GameState.week;
    if (week <= 6) return year * 52 + 6;
    if (week <= 33) return year * 52 + 33;
    return (year + 1) * 52 + 6;
}
// Club/playing-time complaints may only escalate after the player has genuinely had a chance
// to be moved: at least one transfer window must have CLOSED between the complaint (or the
// previous escalation) and now. Without this, a week-10 complaint could hit stage 2 by week 16
// with every window shut in between - nothing the agent could possibly have done.
function transferWindowPassedBetween(fromAbs, toAbs) {
    for (let y = Math.floor(fromAbs / 52) - 1; y <= Math.floor(toAbs / 52) + 1; y++) {
        for (const end of [y * 52 + 6, y * 52 + 33]) if (end > fromAbs && end <= toAbs) return true;
    }
    return false;
}
// promise types a "Make a promise" action can offer, by which dimension the case is about
const MORALE_PROMISE_TYPES = { club: ['move'], time: ['playingTime', 'move'], wage: ['newContract'], agent: ['renegotiateRep'] };
function moralePromiseDeadline(type) {
    return (type === 'move' || type === 'playingTime') ? nextTransferWindowEndAbsWeek() : GameState.absWeek() + MORALE.PROMISE_EXTRA_WEEKS;
}

const Sim = {
    advanceWeek() {
        const events = [];
        // richer one-off "spotlight" moments (e.g. a client retiring) that deserve their own
        // pop-up after the week summary, instead of just another line in it
        const spotlights = [];
        if (typeof Attend !== 'undefined') {
            Attend.finalizeWindow();   // last week's invited finals are now in the past — reveal them all
            Attend.resetCaptures();    // fresh capture list for this week's finals
        }
        GameState.players.forEach(p => { p._weekApps = 0; if (p._finalTalk) delete p._finalTalk; });   // any unsettled dressing-room promise lapses with the week

        // ---- detect season-end / rollover ----
        let rolledSeason = false, seasonFinished = false, windowClosed = false;
        const prevWeek = GameState.week;
        GameState.week += 1;

        if (prevWeek === 47) { // finals (wk47) + play-offs (wk46) done -> crown season
            seasonFinished = true;
            this._endOfSeason(events, spotlights);
        }
        if (GameState.week > 52) {
            GameState.week = 1;
            this._rollNewSeason(events, spotlights);
            rolledSeason = true;
        }
        const week = GameState.week;
        // individual birthdays (week 1 = 1 July): a player ages on his birth week.
        // World model: only sim-relevant players (clients, ex-clients, scouted prospects) age —
        // the invisible background squads are frozen, so the world never grows old or decays.
        GameState.players.forEach(p => { if (isSimRelevant(p) && (p.birthWeek || 0) === week) p.age += 1; });

        // ---- transfer window just opened: complete moves agreed while it was shut ----
        if (!GameState.isTransferWindowOpen(prevWeek) && GameState.isTransferWindowOpen(week)) Agency.completePendingTransfers(events);

        // ---- transfer window just closed ----
        if (GameState.isTransferWindowOpen(prevWeek) && !GameState.isTransferWindowOpen(week)) {
            windowClosed = true;   // UI shows one interstitial ad here (twice a season), unless ads are removed
            const reopens = prevWeek <= 6 ? I18n.t('sim.reopensWinter') : I18n.t('sim.reopensSummer', { season: GameState.seasonLabelFor(GameState.seasonStartYear + 1) });
            GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('sim.windowClosedSubj'), body: I18n.t('sim.windowClosedBody', { reopens }), ttl: 4 });
            GameState.addLog(I18n.t('sim.windowClosedLog'), 'info');
        }

        // ---- mid-season loan returns (summer half/1.5-season loans end at the winter window) ----
        if (week >= 28 && week <= 33) {
            GameState.players.forEach(p => {
                if (p.onLoanAt && !isU21Loan(p) && p.loanMid && p.loanUntilSeason === GameState.seasonStartYear) {
                    const back = Clubs.getClubById(p.clubId);
                    if (p.agentId === 'me') GameState.addMail({ kind: 'news', subject: I18n.t('sim.loanOverSubj', { name: p.name }), body: I18n.t('sim.loanOverBody', { name: p.name, club: back ? back.name : I18n.t('co.hisClubLc') }), ttl: 3 });
                    p.onLoanAt = null; p.loanRole = null; p.loanMid = false; p.loanUntilSeason = null;
                }
            });
        }

        // ---- clubs may recall a youngster from the U21/reserves mid-season if they need him ----
        if (week >= 8 && week <= 40) {
            Agency.clients().forEach(p => {
                if (p.onLoanAt && (isU21Loan(p) || isReserveClub(p.onLoanAt)) && Rng.next() < 0.02) {
                    const back = Clubs.getClubById(p.clubId);
                    p.onLoanAt = null; p.loanRole = null; p.loanMid = false;
                    p.squadRole = 'fringe';   // eased back in — occasional minutes, not a guaranteed starter
                    GameState.addLog(I18n.t('sim.recallLog', { club: back ? back.name : I18n.t('ag.hisClub'), name: p.name }), 'info');
                    GameState.addMail({ kind: 'news', subject: I18n.t('sim.recallSubj', { club: back ? back.name : I18n.t('co.club'), name: p.name }), body: I18n.t('sim.recallBody', { club: back ? back.name : I18n.t('ag.hisClub'), name: p.name }), ttl: 4 });
                }
            });
        }

        // ---- matches + development (leagues, cups, play-offs run through week 47) ----
        if (week <= 47) {
            League.simulateWeek();
            if (week <= 45) this._simU21();
            const notes = [];
            GameState.players.forEach(p => {
                if (!isSimRelevant(p)) return;   // frozen background players don't develop or decline
                const d = PlayerDev.weeklyTick(p, p._weekApps || 0);
                if (d > 0 && p.agentId === 'me') {
                    notes.push(I18n.t('sim.devNote', { name: p.name, ovr: p.ability, d }));
                    Agency.bumpRep(0.05 * d);
                }
            });
            notes.slice(0, 5).forEach(n => { GameState.addLog(n, 'dev'); events.push({ type: 'dev', text: n }); });
            if (notes.length) GameState.addMail({ kind: 'news', cat: 'dev', subject: I18n.t('sim.devUpdateSubj'), body: notes.join('<br>'), ttl: 3 });
            this._injuries(events);
        }
        // morale runs every week, including the off-season (weeks 48-52, 1) — agent-neglect
        // decay and promise/case deadlines are real calendar time and must keep ticking even
        // when there are no matches; only the playing-time streak penalty is exempted then
        this._morale(events);
        this._moraleCases(events);

        // ---- scouts ----
        this._scoutLicence(events);   // enforce the International Scouting Licence (warn/fine/suspend) before scouts work
        const finds = Scouts.tick();
        finds.forEach(f => {
            // an idle / home scout carries no region id — fall back to the found player's country,
            // the assigned league's country, or the agency's home country so the mail never reads "null"
            const region = (f.region && regionName(f.region))
                || (f.players && f.players[0] && (Clubs.getClubById(f.players[0].clubId) || {}).country)
                || f.country
                || (f.league && (((Clubs.getClubsByDivision(f.league) || [])[0]) || {}).country)
                || GameState.homeCountry || '';
            if (f.none) {
                const t = I18n.t('sim.scoutNone', { scout: f.scout, region });
                GameState.addLog(t, 'scout'); events.push({ type: 'scout', text: t });
                GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('sim.scoutNoneSubj', { region }), body: I18n.t('sim.scoutNoneBody', { t }), ttl: 3 });
                return;
            }
            const names = f.players.map(pl => `${pl.name} (${pl.position}, ${pl.ability} OVR — ${Clubs.getClubById(pl.clubId)?.name})`).join('; ');
            const t = I18n.t('sim.scoutFound', { scout: f.scout, region, n: f.players.length, cost: f.cost ? I18n.t('sim.scoutCost', { amt: UI.money(f.cost) }) : '', names });
            GameState.addLog(t, 'scout'); events.push({ type: 'scout', text: t });
            GameState.addMail({ kind: 'news', subject: I18n.t('sim.scoutFoundSubj', { region, n: f.players.length }), body: t, ttl: 4 });
        });

        // ---- finances ----
        const bd = Agency.weeklyBreakdown();
        const income = bd.wageComm + bd.sponsorComm;
        const expenses = bd.scoutWages + bd.office + bd.facilities;
        GameState.addFinance('Wage commission', bd.wageComm);
        GameState.addFinance('Sponsoring', bd.sponsorComm);
        GameState.addFinance('Scout wages', -bd.scoutWages);
        GameState.addFinance('Office', -bd.office);
        GameState.addFinance('Facilities & staff', -bd.facilities);
        GameState.agency.balance += income - expenses;
        if (income || expenses) events.push({ type: 'money', text: I18n.t('sim.moneyEvent', { income: UI.money(income), expenses: UI.money(expenses), balance: UI.money(GameState.agency.balance) }) });
        if (GameState.agency.balance < 0) {
            const t = I18n.t('sim.redLog', { balance: UI.money(GameState.agency.balance) }); GameState.addLog(t, 'warn'); events.push({ type: 'warn', text: t });
            // your best client resents the financial mess: −1 morale/week while in the red
            const roster = Agency.clients().filter(p => p.morale && !p.archived);
            if (roster.length) {
                roster.sort((a, b) => b.ability - a.ability || (b.wage || 0) - (a.wage || 0));
                const star = roster[0];
                star.morale.agent = Math.max(0, (star.morale.agent || 0) - 1);
                if (!GameState.agency._redMoaned) {
                    GameState.agency._redMoaned = true;
                    GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.redMoanSubj', { name: star.name }), body: I18n.t('sim.redMoanBody', { name: star.name }), ttl: 6 });
                    events.push({ type: 'warn', text: I18n.t('sim.redEvent', { name: star.name }) });
                }
            }
        } else { GameState.agency._redMoaned = false; }

        // ---- inbox: new offers during window, sponsors anytime, expiry/persistence ----
        this._deliverPending(events);
        if (GameState.isTransferWindowOpen(week) || week >= 48) this._generateOffers(events);
        this._forcedMoves(events);   // stage-3 time/club: the player pushes his own move through (window only; guards inside)
        this._sponsorOffers(events);
        this._clubRenewals(events);   // clubs proactively try to re-sign final-year clients they want to keep
        this._expireMail(events);

        // career moments: milestone crossings and fulfilled ambitions become queued scenes
        if (typeof Dialogue !== 'undefined') Dialogue.weeklyMoments();

        // finals a client is in become a persisted viewing window: their results are hidden in the
        // Competitions tab until the agent watches (or advances past) them.
        if (typeof Attend !== 'undefined') Attend.openWindow(GameState._attend);
        // achievements: re-evaluate the whole set from the freshly-updated state; a heads-up mail when new ones unlock
        if (typeof Achievements !== 'undefined') {
            const newAch = Achievements.refresh();
            if (newAch.length) {
                events.push({ type: 'info', text: I18n.t('ach.event', { n: newAch.length }) });
                GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('ach.mailSubj', { n: newAch.length }), body: I18n.t('ach.mailBody', { n: newAch.length }), ttl: 6 });
            }
        }
        GameState.save();
        Storage.flush();   // a completed week is a meaningful checkpoint — don't leave it debounced
        const attend = (typeof Attend !== 'undefined') ? Attend.windowFinals() : [];
        return { events, spotlights, rolledSeason, seasonFinished, windowClosed, attend };
    },

    _simU21() {
        const year = GameState.seasonStartYear;
        Agency.clients().forEach(p => {
            if (!isU21Loan(p) || p.injury) return;
            const c = statBucket(p, year, p.onLoanAt, true, true, 'U21');
            let g = 0, a = 0;
            if (ATTACK_POS.includes(p.position) && Rng.next() < 0.30 + p.ability / 220) g = 1;
            if (Rng.next() < 0.18) a = 1;
            c.apps += 1; c.goals += g; c.assists += a;
            p._weekApps = (p._weekApps || 0) + 1;
            const r = Rng.next();
            if (r < 0.006) c.red += 1; else if (r < 0.10) c.yellow += 1;
            let rating = 7.0 + (p.ability - 34) * 0.03 + g * 0.45 + a * 0.25 + PlayerGen.gauss(0, 0.5);
            rating += moraleRatingMod(moraleAvg(p));
            c.ratingSum += Math.max(4, Math.min(9.9, rating));
        });
    },

    // Pick a specific injury, weighted by likelihood, and roll its duration from that type's range —
    // from the editable table (js/injuries-data.js, built from injuries.xlsx). Common knocks are short
    // and frequent; the season-enders (ACL, Achilles, fracture) are rare and long. Falls back to the
    // old flat list if the table isn't loaded (a minimal test harness).
    _rollInjury() {
        if (typeof INJURIES !== 'undefined' && INJURIES.length) {
            const total = INJURIES.reduce((s, x) => s + (x.weight || 0), 0);
            let r = Rng.next() * total;
            for (const inj of INJURIES) {
                r -= (inj.weight || 0);
                if (r <= 0) { const span = Math.max(0, inj.maxWeeks - inj.minWeeks); return { type: inj.name, weeks: inj.minWeeks + Math.floor(Rng.next() * (span + 1)) }; }
            }
        }
        return { type: INJURY_TYPES[Math.floor(Rng.next() * INJURY_TYPES.length)], weeks: 1 + Math.floor(Rng.next() * 11) };
    },
    _injuries(events) {
        GameState.players.forEach(p => {
            if (!isSimRelevant(p)) return;   // frozen background players never get injured
            if (p.injury) {
                p.injury.weeksOut -= 1;
                if (p.injury.weeksOut <= 0) {
                    p.injuryHistory.push({ type: p.injury.type, weeks: p.injury.total, season: GameState.seasonLabel() });
                    if (p.agentId === 'me') { const t = I18n.t('ag.log.recovered', { name: p.name, type: p.injury.type }); GameState.addLog(t, 'info'); GameState.addMail({ kind: 'news', cat: 'injury', subject: I18n.t('ag.mail.fitSubj', { name: p.name }), body: t, ttl: 2 }); }
                    p.injury = null;
                }
                return;
            }
            // small weekly injury chance, a touch higher for outfield
            if (Rng.next() < 0.0055 * ((typeof Upgrades !== 'undefined') ? Upgrades.injuryRiskMult() : 1)) {
                const inj = this._rollInjury();
                p.injury = { type: inj.type, weeksOut: inj.weeks, total: inj.weeks };
                // an injury HALTS the playing-time streak — it's frozen (not reset) while he's out, and
                // no weekly tick runs during injury (see _morale). Being injured therefore neither decays
                // his playing-time morale nor erases the run he was on; he picks it back up on his return.
                if (p.agentId === 'me') {
                    const t = I18n.t('sim.injuredLog', { name: p.name, type: p.injury.type, weeks: inj.weeks });
                    GameState.addLog(t, 'warn'); events.push({ type: 'warn', text: t });
                    GameState.addMail({ kind: 'news', cat: 'injury', subject: I18n.t('sim.injurySubj', { name: p.name }), body: t, ttl: 4 });
                    if (typeof Dialogue !== 'undefined') Dialogue.onInjury(p, inj.weeks);   // a long layoff earns a visit
                }
            }
        });
    },

    // migration + defensive defaults for the morale-system fields — safe to call every week
    // on every client; also the one place old saves get backfilled (see also GameState.load)
    _ensureMoraleFields(p, aw) {
        if (!p.morale) p.morale = PlayerGen.freshMorale();
        if (p.moraleCase === undefined) p.moraleCase = null;
        if (!p._badStreak) p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 };
        if (p._playStreak == null) p._playStreak = 0;
        if (p._benchStreak == null) p._benchStreak = 0;
        if (p._lastAgentActionAbs == null) p._lastAgentActionAbs = aw;
        if (p._neglectWarned == null) p._neglectWarned = false;
        if (!p._moraleHist) p._moraleHist = [{ club: p.morale.club, time: p.morale.time, wage: p.morale.wage, agent: p.morale.agent }];
        if (!p._giftLog) p._giftLog = { small: null, medium: null, large: null, lastAny: null };
    },

    _morale(events) {
        const week = GameState.week, aw = GameState.absWeek();
        const offSeasonNoMatch = MORALE.BENCH_EXEMPT_WEEKS.includes(week);
        Agency.clients().forEach(p => {
            this._ensureMoraleFields(p, aw);
            const club = Clubs.getClubById(p.clubId);

            // ---- club / wage: unchanged target-drift model, now anti-spiral clamped ----
            const rep = club ? club.reputation : 50;
            const clubTarget = Math.max(20, Math.min(95, 50 + (rep - p.ability) * 1.5));
            let wageTarget, payRatio = null;
            if (Agency.isFreeAgent(p)) {
                wageTarget = 15;
            } else {
                // he knows his market value: what he'd command at a club at HIS level, not merely his
                // current one — so a strong player stuck on a weak club's wages knows he's underpaid.
                const market = PlayerGen.wageFor(p.ability, Math.max(club ? club.reputation : 0, p.ability));
                payRatio = p.wage / Math.max(1, market);
                wageTarget = payRatio >= 1
                    ? Math.min(95, 78 + (payRatio - 1) * 40)         // fairly/over-paid: high, climbs a little with surplus
                    : Math.max(0, 78 - (1 - payRatio) * 150);        // underpaid: target sinks (0.9→63, 0.8→48, 0.6→18)
            }
            const drift = (target, cur, downMult = 1) => {
                let d = (target - cur) * 0.1;
                if (d < 0) d *= downMult;   // decay can be tuned gentler than recovery
                d = Math.max(-MORALE.MAX_WEEKLY_DIM_DRIFT, Math.min(MORALE.MAX_WEEKLY_DIM_DRIFT, d));
                return Math.max(0, Math.min(100, cur + d));
            };
            // U18s don't hold club grudges (a 15-year-old out on loan shouldn't be miserable
            // about his parent club) - club morale stays pinned until his 18th birthday
            if (p.age < MORALE.CLUB_LOCK_UNDER_AGE) p.morale.club = MORALE.CLUB_LOCK_VALUE;
            else p.morale.club = drift(clubTarget, p.morale.club, MORALE.CLUB_DOWN_MULT);
            p.morale.wage = drift(wageTarget, p.morale.wage);
            // a genuine underpayment keeps nagging: a small steady erosion on top of the drift, so wage
            // morale doesn't just settle — the more underpaid, the faster it slides (but never fast)
            if (payRatio != null && payRatio < MORALE.WAGE_FAIR_FROM)
                p.morale.wage = Math.max(0, p.morale.wage - MORALE.WAGE_UNDERPAID_DECAY * (MORALE.WAGE_FAIR_FROM - payRatio));

            // ---- time: discrete streak-based ticks. Playing always counts in his favour;
            // NOT playing only counts against him when matches were actually possible -
            // off-season and international-break weeks freeze the clock (no penalty, streak
            // preserved), and an injured player is frozen too: any week with no club games for
            // him simply halts his current streak rather than decaying it (see Sim._injuries) ----
            if (!p.injury) {
                const played = (p._weekApps || 0) > 0;
                const tierOf = (streak, table) => streak >= MORALE.TIME_STREAK_LONG_FROM ? table.long : streak >= MORALE.TIME_STREAK_MID_FROM ? table.mid : table.base;
                if (played) {
                    p._playStreak += 1; p._benchStreak = 0;
                    p.morale.time = Math.max(0, Math.min(100, p.morale.time + tierOf(p._playStreak, MORALE.PLAY_TICK)));
                } else if (!offSeasonNoMatch) {
                    p._benchStreak += 1; p._playStreak = 0;
                    p.morale.time = Math.max(0, Math.min(100, p.morale.time + tierOf(p._benchStreak, MORALE.BENCH_TICK)));
                }
            }

            // ---- agent: earn-and-neglect (replaces the old flat -0.2/week decay) ----
            const sinceAction = aw - p._lastAgentActionAbs;
            if (sinceAction > MORALE.NEGLECT_GRACE_WEEKS) {
                const rate = sinceAction > MORALE.NEGLECT_SEASON2_WEEKS ? MORALE.NEGLECT_DECAY_2 : MORALE.NEGLECT_DECAY_1;
                const before = p.morale.agent;
                p.morale.agent = Math.max(0, p.morale.agent - rate);
                if (before >= MORALE.BAND_GOOD && p.morale.agent < MORALE.BAND_GOOD && !p._neglectWarned) {
                    p._neglectWarned = true;
                    GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.neglectSubj', { name: p.name }), body: I18n.t('sim.neglectBody', { name: p.name }), ttl: 6 });
                    events.push({ type: 'morale', text: I18n.t('sim.neglectEvent', { name: p.name }) });
                }
            } else {
                p._neglectWarned = false;   // back in good standing (a fresh action reset the clock) — rearm the one-shot warning
            }

            // ---- history ring for the UI's trend arrows (vs 4 weeks ago) ----
            p._moraleHist.push({ club: p.morale.club, time: p.morale.time, wage: p.morale.wage, agent: p.morale.agent });
            if (p._moraleHist.length > 4) p._moraleHist.shift();

            // ---- per-dimension BAD streaks -> opens a case (worst dim wins; one case at a time) ----
            ['club', 'time', 'wage', 'agent'].forEach(dim => {
                p._badStreak[dim] = p.morale[dim] < MORALE.BAND_BAD ? (p._badStreak[dim] || 0) + 1 : 0;
            });
            if (!p.moraleCase) {
                const qualifying = ['club', 'time', 'wage', 'agent'].filter(d => p._badStreak[d] >= MORALE.CASE_OPEN_BAD_STREAK);
                if (qualifying.length) {
                    qualifying.sort((a, b) => p.morale[a] - p.morale[b]);
                    this._openMoraleCase(p, qualifying[0], events);
                }
            }
        });
    },

    _openMoraleCase(p, dim, events) {
        const DIM_LABEL = { club: I18n.t('sim.dim.club'), time: I18n.t('sim.dim.time'), wage: I18n.t('sim.dim.wage'), agent: I18n.t('sim.dim.agent') };
        const DIM_BODY = {
            club: I18n.t('sim.dimBody.club'),
            time: I18n.t('sim.dimBody.time'),
            wage: I18n.t('sim.dimBody.wage'),
            agent: I18n.t('sim.dimBody.agent')
        };
        // Confidant+ perk: he warns you privately first — a short grace before the case opens
        if (typeof Dialogue !== 'undefined' && Dialogue.tipOff(p, dim)) return;
        p.moraleCase = { dim, stage: 1, sinceAbsWeek: GameState.absWeek(), promise: null };
        GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.caseSubj', { name: p.name, dim: DIM_LABEL[dim] }), body: I18n.t('sim.caseBody', { name: p.name, body: DIM_BODY[dim] }), ttl: 6 });
        events.push({ type: 'morale', text: I18n.t('sim.caseEvent', { name: p.name, dim: DIM_LABEL[dim] }) });
    },

    // weekly pass for players with an open case: resolution, promise deadlines, stage escalation
    _moraleCases(events) {
        const aw = GameState.absWeek();
        Agency.clients().forEach(p => {
            const c = p.moraleCase; if (!c) return;
            // resolved: the underlying dimension recovered to GOOD -> close with thanks, any stage
            if (p.morale[c.dim] >= MORALE.BAND_GOOD) {
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.thankSubj', { name: p.name }), body: I18n.t('sim.thankBody', { name: p.name }), ttl: 4 });
                events.push({ type: 'morale', text: I18n.t('sim.resolvedEvent', { name: p.name }) });
                p.moraleCase = null;
                return;
            }
            // breaking point + free to walk: any stage-3 case fires the agent once his representation
            // term is up. A player still under a rep contract can't leave (an agent case chips at your
            // reputation instead, and a time/club case forces a club move via _forcedMoves), but once
            // that term has lapsed there's nothing holding him — he leaves after a short grace window
            // (right away if it had already lapsed by the time he reached breaking point).
            if (c.stage === 3 && p.repExpired) {
                if (c.leaveAtAbsWeek == null) c.leaveAtAbsWeek = aw + MORALE.STAGE3_AGENT_LEAVE_WEEKS;
                if (aw >= c.leaveAtAbsWeek) {
                    const parting = c.dim === 'agent'
                        ? I18n.t('sim.partingAgent', { name: p.name })
                        : I18n.t('sim.partingOther', { name: p.name });
                    p.agentId = null; p.moraleCase = null;
                    GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.leftSubj', { name: p.name }), body: parting, ttl: 6 });
                    Agency.bumpRep(MORALE.DEPARTURE_AGENCY_REP);
                    events.push({ type: 'morale', text: I18n.t('sim.leftEvent', { name: p.name }) });
                    return;
                }
            }
            if (c.promise) {
                if (aw < c.promise.deadlineAbsWeek) return;   // still pending, not due yet
                // deadline passed without being fulfilled (a kept promise clears itself — see agency.js) -> broken
                p.morale.agent = Math.max(0, p.morale.agent + MORALE.PROMISE_BROKEN_AGENT);
                Agency.bumpRep(MORALE.PROMISE_BROKEN_REP);
                if (typeof Dialogue !== 'undefined') Dialogue.addBond(p, -8);   // broken word cuts deep, and stays cut
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.brokenSubj', { name: p.name }), body: I18n.t('sim.brokenBody', { name: p.name }), ttl: 6 });
                events.push({ type: 'morale', text: I18n.t('sim.brokenEvent', { name: p.name }) });
                this._escalateMoraleCase(p, events);
                return;
            }
            // no promise on the table: escalate once this stage has sat unresolved long enough.
            // club/time gripes additionally wait for a transfer window to have passed - their
            // remedy needs an open market; wage/agent can be addressed any week (renewal, talk)
            // a client who genuinely trusts you gives you longer before taking it further (bond perk)
            const limit = (c.stage === 1 ? MORALE.STAGE2_UNRESOLVED_WEEKS : MORALE.STAGE3_UNRESOLVED_WEEKS)
                + ((typeof Dialogue !== 'undefined') ? Dialogue.patienceBonusWeeks(p) : 0);
            const needsWindow = c.dim === 'club' || c.dim === 'time';
            if (c.stage < 3 && aw - c.sinceAbsWeek >= limit && (!needsWindow || transferWindowPassedBetween(c.sinceAbsWeek, aw))) this._escalateMoraleCase(p, events);
        });
    },

    // International Scouting Licence enforcement (runs weekly). Only bites if you're actually scouting
    // abroad. Once the licence lapses: a two-week grace period (weeks 0-1) with a renewal warning, then
    // escalating fines — €10k (week 2), €20k (week 3), €40k + a 52-week suspension (week 4) that recalls
    // your overseas scouts. Renewing in the Agency tab (which pushes intlLicenceUntil forward) stops it.
    _scoutLicence(events) {
        const a = GameState.agency; if (!a || !a.scouts) return;
        const aw = GameState.absWeek();
        if (a.intlSuspendedUntil != null && aw >= a.intlSuspendedUntil) a.intlSuspendedUntil = null;   // suspension served
        if (a.intlSuspendedUntil != null) return;                 // still suspended — nothing more to enforce
        const abroad = a.scouts.filter(s => s.league);
        if (!abroad.length || a.intlLicenceUntil == null) return; // not scouting abroad (or never licensed)
        const over = aw - a.intlLicenceUntil;                     // <0 while valid; 0 the week it lapses
        if (over < 0) return;
        const renew = I18n.t('sim.licRenew');
        if (over <= 1) {   // two-week grace period: a warning, no fine
            GameState.addMail({ kind: 'news', cat: 'scout', subject: I18n.t('sim.licExpiredSubj'), body: I18n.t(abroad.length > 1 ? 'sim.licExpiredBodyPl' : 'sim.licExpiredBodySg', { renew }), ttl: 3 });
            if (over === 0) events.push({ type: 'warn', text: I18n.t('sim.licExpiredEvent') });
            return;
        }
        let fine = 0, suspend = false;
        if (over === 2) fine = 10000; else if (over === 3) fine = 20000; else if (over === 4) { fine = 40000; suspend = true; }
        else return;   // past week 4 without scouts recalled shouldn't happen (suspension idles them)
        a.balance -= fine; GameState.addFinance('Licence fines', -fine);
        if (suspend) {
            a.intlSuspendedUntil = aw + 52;
            abroad.forEach(s => { s.league = null; s.country = null; s.region = null; });   // recall the overseas scouts
            GameState.addMail({ kind: 'news', cat: 'scout', subject: I18n.t('sim.licSuspendSubj'), body: I18n.t('sim.licSuspendBody', { fine: UI.money(fine) }), ttl: 10 });
            events.push({ type: 'warn', text: I18n.t('sim.licSuspendEvent', { fine: UI.money(fine) }) });
        } else {
            GameState.addMail({ kind: 'news', cat: 'scout', subject: I18n.t('sim.licFineSubj', { fine: UI.money(fine) }), body: I18n.t('sim.licFineBody', { fine: UI.money(fine), warn: over === 3 ? I18n.t('sim.licFineWarn') : '', renew }), ttl: 6 });
            events.push({ type: 'warn', text: I18n.t('sim.licFineEvent', { fine: UI.money(fine) }) });
        }
    },

    _escalateMoraleCase(p, events) {
        const c = p.moraleCase; if (!c || c.stage >= 3) return;
        c.stage += 1; c.sinceAbsWeek = GameState.absWeek(); c.promise = null;
        const club = Clubs.getClubById(p.clubId);
        if (c.stage === 2) {
            if (c.dim === 'time') {
                c.agitating = true;
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.esc.timeSubj', { name: p.name }), body: I18n.t('sim.esc.timeBody', { name: p.name }), ttl: 8 });
            } else if (c.dim === 'wage') {
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.esc.wageSubj', { name: p.name }), body: I18n.t('sim.esc.wageBody', { name: p.name, club: club ? club.name : I18n.t('co.hisClubLc') }), ttl: 8 });
            } else if (c.dim === 'club') {
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.esc.clubSubj', { name: p.name }), body: I18n.t('sim.esc.clubBody', { name: p.name }), ttl: 8 });
                GameState.addLog(I18n.t('sim.esc.clubLog', { name: p.name }), 'morale');
            } else if (c.dim === 'agent') {
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.esc.agentSubj', { name: p.name }), body: I18n.t('sim.esc.agentBody', { name: p.name }), ttl: 8 });
            }
            events.push({ type: 'morale', text: I18n.t('sim.esc.event2', { name: p.name }) });
        } else if (c.stage === 3) {
            if (c.dim === 'time' || c.dim === 'club') {
                c.forcedMove = true;
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.esc.acceptSubj', { name: p.name }), body: I18n.t('sim.esc.acceptBody', { name: p.name }), ttl: 10 });
            } else if (c.dim === 'wage') {
                // converts to a club-style case at stage-2 rules (hands in a transfer request over money)
                c.dim = 'club'; c.stage = 2;
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.esc.wageToClubSubj', { name: p.name }), body: I18n.t('sim.esc.wageToClubBody', { name: p.name }), ttl: 8 });
            } else if (c.dim === 'agent') {
                GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.esc.finalSubj', { name: p.name }), body: I18n.t('sim.esc.finalBody', { name: p.name }), ttl: 8 });
            }
            events.push({ type: 'morale', text: I18n.t('sim.esc.event3', { name: p.name }) });
        }
    },

    // stage-3 time/club: the player accepts the next reasonable offer at the next window,
    // with no veto for the agent — a light-touch auto-resolution rather than re-running the
    // full interactive negotiation UI, since the whole point is that he's gone over your head
    _forcedMoves(events) {
        if (!GameState.isTransferWindowOpen()) return;
        Agency.clients().forEach(p => {
            const c = p.moraleCase;
            if (!c || !c.forcedMove || p.onLoanAt) return;
            if (c.leaveAtAbsWeek != null) return;   // he's already walking out on the agency — don't also move his club
            const homeClub = Clubs.getClubById(p.clubId);
            const val = Agency.playerValue(p);
            const cands = Clubs.allClubs.filter(cl =>
                cl.id !== p.clubId && cl.reputation >= p.ability - 12 && cl.reputation <= p.ability + 16 &&
                Agency.buyerMaxFee(cl) >= val * 0.4 && !Agency.clubHasMyPlayerAtPos(cl.id, p.position, p.id));
            if (!cands.length) return;   // nobody suitable yet — try again next window
            const dest = Agency.pickBuyer(cands, p); if (!dest) return;
            // stage 3 discounts uniformly for either dimension (time or club), so applied here
            // explicitly rather than via estimateFee's own club-only stage-2+ auto-discount
            const fee = Math.round(Agency.estimateFee(p, dest, { skipCaseDiscount: true }) * MORALE.STAGE2_CLUB_FEE_MULT / 500) * 500;
            const role = Agency.maxRoleAt(p, dest);
            const term = Math.min(3, Agency.maxContractTerm(p, dest));
            const wage = Agency.offeredWage(p, dest, { loyalty: false });
            const mail = { offer: { playerId: p.id, fromClubId: p.clubId, toClubId: dest.id, transferFee: fee } };
            Agency.acceptTransfer(mail, wage, role, term, 0, { forced: true });
            GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.forcedSubj', { name: p.name, dest: dest.name }), body: I18n.t('sim.forcedBody', { name: p.name, dest: dest.name, fee: UI.money(fee) }), ttl: 6 });
            if (typeof Dialogue !== 'undefined') Dialogue.addBond(p, -6);   // it came to this because you didn't fix it
            events.push({ type: 'morale', text: I18n.t('sim.forcedEvent', { name: p.name, dest: dest.name }) });
            if (homeClub) Agency.changeRelationship(homeClub.id, -2);
        });
    },

    _deliverPending(events) {
        const aw = GameState.absWeek();
        Agency.clients().forEach(p => {
            if (p._pendingLoan && aw >= p._pendingLoan.from) {
                if (!p.onLoanAt || isU21Loan(p)) {
                    let n = 0;
                    p._pendingLoan.picks.forEach(cid => {
                        const c = Clubs.getClubById(cid); if (!c) return;
                        if (Agency.clubHasMyPlayerAtPos(c.id, p.position, p.id)) return;
                        if (GameState.inbox.find(m => m.kind === 'loan' && m.offer.playerId === p.id && m.offer.toClubId === c.id)) return;
                        const role = Agency.maxRoleAt(p, c);
                        GameState.addMail({ kind: 'loan', subject: I18n.t('ag.mail.loanWantSubj', { target: c.name, name: p.name }), offer: { playerId: p.id, fromClubId: p.clubId, toClubId: c.id, role }, persistence: 0, ttl: 4 });
                        n++;
                    });
                    if (n) events.push({ type: 'offer', text: I18n.t('sim.ev.loanIn', { n, name: p.name }) });
                }
                delete p._pendingLoan;
            }
        });
    },

    _generateOffers(events) {
        const winKey = GameState.transferWindowKey ? GameState.transferWindowKey() : null;
        Agency.clients().forEach(p => {
            if (p.injury) return;
            if (p.retiringThisSeason) return;   // announced his final season -> clubs stop chasing him (you can still tout him out)
            if (p.onLoanAt) return;   // out on loan / with reserves -> no transfer interest until he's back
            if (winKey && p._txWindow === winKey) return;   // just changed clubs this window -> no fresh approaches until next window
            // free agents: clubs approach with contract offers (no transfer fee)
            if (Agency.isFreeAgent(p)) {
                const pending = GameState.inbox.filter(m => m.kind === 'transfer' && m.offer.playerId === p.id).length;
                if (pending < 2 && Rng.next() < 0.5) {
                    const cands = Clubs.allClubs.filter(c =>
                        c.reputation >= p.ability - 10 && c.reputation <= p.ability + 14 &&
                        !Agency.clubHasMyPlayerAtPos(c.id, p.position, p.id) &&
                        !GameState.inbox.some(m => m.kind === 'transfer' && m.offer.playerId === p.id && m.offer.toClubId === c.id));
                    if (cands.length) {
                        const club = Agency.pickBuyer(cands, p); if (!club) return;
                        const offer = Agency._offerObj(p, null, club.id, 0, { initiatedByAgent: false });
                        GameState.addMail({ kind: 'transfer', subject: I18n.t('ag.mail.offerContractSubj', { target: club.name, name: p.name }), offer, persistence: 0, ttl: 3 });
                        events.push({ type: 'offer', text: I18n.t('sim.ev.freeAgentWant', { club: club.name, name: p.name }) });
                    }
                }
                return;
            }
            const pending = GameState.inbox.filter(m => m.kind === 'transfer' && m.offer.playerId === p.id).length;
            // a club may list a player it no longer builds on, to recoup a fee
            const homeClub = Clubs.getClubById(p.clubId);
            if (homeClub && !p.transferListed && ['youth', 'fringe'].includes(p.squadRole) && p.ability < homeClub.reputation - 6 && Rng.next() < 0.015) {
                p.transferListed = true;
                GameState.addMail({ kind: 'news', subject: I18n.t('sim.aiListSubj', { club: homeClub.name, name: p.name }), body: I18n.t('sim.aiListBody', { club: homeClub.name, name: p.name }), ttl: 4 });
                events.push({ type: 'offer', text: I18n.t('sim.ev.listed', { club: homeClub.name, name: p.name }) });
            }
            if (pending < 3 && !p.pendingTransfer && !(p._txOffersFrom && GameState.absWeek() < p._txOffersFrom)) {
                const tot = seasonTotals(p, GameState.seasonStartYear);
                const mc = p.moraleCase;
                // stage-2 escalation is public knowledge: an agitating player or a formal transfer
                // request both draw noticeably more interest than usual
                const caseAttract = (mc && mc.stage >= 2) ? (mc.dim === 'time' ? MORALE.STAGE2_TIME_ATTRACT : mc.dim === 'club' ? MORALE.STAGE2_CLUB_ATTRACT : 0) : 0;
                // a red-hot recent season pulls MORE suitors too (up to +25%), on top of higher bids (see perfValueMult)
                const attract = (10 + Math.min(20, tot.apps) * 0.5 + (p.transferListed ? 22 : 0) + caseAttract) * Agency.perfValueMult(p);
                // elite players attract bids far less often — only a handful of clubs can afford them, and
                // they don't get fresh approaches every window
                const scarcity = p.ability >= 84 ? 0.30 : p.ability >= 80 ? 0.48 : p.ability >= 74 ? 0.68 : p.ability >= 68 ? 0.90 : 1.0;
                const chance = Math.min(0.26, 0.02 + attract / 320) * scarcity;
                if (Rng.next() < chance) {
                    const lo = p.transferListed ? p.ability - 14 : p.ability - 6;
                    const val = Agency.playerValue(p);
                    const cands = Clubs.allClubs.filter(c =>
                        c.id !== p.clubId && c.reputation >= lo && c.reputation <= p.ability + 16 &&
                        Agency.buyerMaxFee(c) >= val * 0.55 &&
                        !Agency.clubHasMyPlayerAtPos(c.id, p.position, p.id) &&
                        !GameState.inbox.some(m => m.kind === 'transfer' && m.offer.playerId === p.id && m.offer.toClubId === c.id));
                    if (cands.length) {
                        // a player clearly outgrowing his club, in hot form, or a big-potential prospect
                        // draws interest from more than one suitor at once — a real bidding situation
                        const abilityGap = p.ability - (homeClub ? homeClub.reputation : 45);
                        const hot = tot.apps >= 6 && tot.avg > 7.5;
                        const bigUpside = ((p.potential || p.ability) - p.ability) >= 15 && p.age <= 23;
                        let suitors = 1;
                        if (abilityGap > 10) suitors++;
                        if (hot) suitors++;
                        if (bigUpside) suitors++;
                        suitors = Math.min(suitors, 3 - pending, cands.length);
                        const pool = cands.slice();
                        const buyers = [];
                        for (let i = 0; i < suitors; i++) {
                            const buyer = Agency.pickBuyer(pool, p);
                            if (!buyer) break;
                            buyers.push(buyer);
                            pool.splice(pool.indexOf(buyer), 1);
                        }
                        if (buyers.length === 1) {
                            const fee = Agency.estimateFee(p, buyers[0]);
                            const offer = Agency._offerObj(p, p.clubId, buyers[0].id, fee, { initiatedByAgent: false });
                            GameState.addMail({ kind: 'transfer', subject: I18n.t('sim.bidSubj', { club: buyers[0].name, name: p.name }), offer, persistence: Rng.next() < 0.5 ? 1 : 0, ttl: 1 + Math.floor(Rng.next() * 3) });
                            const feeClause = fee > 0 ? I18n.t('sim.ev.bidClause', { fee: UI.money(fee), name: p.name }) : I18n.t('sim.ev.freeClause', { name: p.name });
                            events.push({ type: 'offer', text: I18n.t('sim.ev.bid1', { club: buyers[0].name, clause: feeClause, role: roleLabel(offer.role, p.age) }) });
                        } else if (buyers.length > 1) {
                            const names = [];
                            buyers.forEach(buyer => {
                                const fee = Agency.estimateFee(p, buyer);
                                const offer = Agency._offerObj(p, p.clubId, buyer.id, fee, { initiatedByAgent: false });
                                GameState.addMail({ kind: 'transfer', subject: I18n.t('sim.bidSubj', { club: buyer.name, name: p.name }), offer, persistence: Rng.next() < 0.5 ? 1 : 0, ttl: 1 + Math.floor(Rng.next() * 3) });
                                names.push(`${buyer.name} (${fee > 0 ? `€${UI.money(fee)}` : I18n.t('sim.ev.free')})`);
                            });
                            events.push({ type: 'offer', text: I18n.t('sim.ev.bidMany', { n: buyers.length, name: p.name, names: names.join(', ') }) });
                        }
                        if (buyers.length) {
                            // after a bidding round, this player isn't approached again for a while — longer for the elite
                            p._txOffersFrom = GameState.absWeek() + (p.ability >= 80 ? 18 + Math.floor(Rng.next() * 18) : 7 + Math.floor(Rng.next() * 9));
                        }
                    }
                }
            }
            // loan offers if loan-listed — interest is NOT guaranteed. Each cycle we roll whether any club
            // fancies him (based on his appeal); often there's a genuine dry spell with no interest at all
            if (p.loanListed && !p.onLoanAt && !(p._loanOffersFrom && GameState.absWeek() < p._loanOffersFrom) && !GameState.inbox.find(m => m.kind === 'loan' && m.offer.playerId === p.id)) {
                const appeal = Math.max(0.08, Math.min(0.55, ((p.ability || 45) - 35) / 80 + (22 - (p.age || 22)) * 0.02));
                if (Rng.next() < appeal) {
                    const club = Clubs.getClubById(p.clubId);
                    const dest = Agency._findLoanClub(p, club || Clubs.allClubs[0]);
                    if (dest && !Agency.clubHasMyPlayerAtPos(dest.id, p.position, p.id)) {
                        GameState.addMail({ kind: 'loan', subject: I18n.t('ag.mail.loanWantSubj', { target: dest.name, name: p.name }), offer: { playerId: p.id, fromClubId: p.clubId, toClubId: dest.id, role: Agency.maxRoleAt(p, dest) }, persistence: 0, ttl: 3 });
                        events.push({ type: 'offer', text: I18n.t('sim.ev.loanWant', { club: dest.name, name: p.name }) });
                    }
                    p._loanOffersFrom = GameState.absWeek() + 3 + Math.floor(Rng.next() * 5);
                } else {
                    // nobody's biting right now — a real dry spell before anyone looks again
                    p._loanOffersFrom = GameState.absWeek() + 6 + Math.floor(Rng.next() * 10);
                }
            }
        });
    },

    _seasonLeagueApps(p, year) {
        let n = 0;
        seasonStints(p, year).forEach(st => {
            if (st.youth) return;
            Object.entries(st.comps).forEach(([cid, c]) => { const comp = COMPETITIONS[cid]; if (comp && comp.type === 'league') n += (c.apps || 0); });
        });
        return n;
    },
    // which sponsor tier a player can attract, from his division, game time and quality —
    // capped by the agency's office (a Home Office can only land local deals, however good the player is)
    // Tier-based so it works in every country: tier 1 = top flight, 2 = second tier, … (Clubs.DIV_TIERS).
    // The thresholds mirror the original Dutch ladder (tier1=Ere, tier2=Eerste, tier3=Tweede, tier4+=Derde…).
    _sponsorLevelFor(p) {
        const club = Clubs.getClubById(p.clubId);
        if (!club) return null;
        const tier = club.tier || (Clubs.DIV_TIERS && Clubs.DIV_TIERS[club.division]) || 99;
        const apps = this._seasonLeagueApps(p, GameState.seasonStartYear);
        const talent = p.potential >= 78 && p.age <= 22;   // promising youngsters punch above their weight
        let level;
        if (p.ability >= 90) level = 'worldwide';
        else if (tier === 1 && p.ability >= 80) level = 'international';
        else if (tier === 1) level = 'national';
        else if (tier === 2 && apps > 25) level = 'national';
        else if (talent) level = 'national';
        else if (tier === 2 && apps > 5) level = 'regional';
        else if (tier === 3 && apps > 25) level = 'regional';
        else if (tier >= 4 && apps > 25) level = 'local';
        else return null;
        const cap = SPONSOR_LEVELS.indexOf(Upgrades.sponsorLevel());
        return SPONSOR_LEVELS[Math.min(SPONSOR_LEVELS.indexOf(level), cap)];
    },
    _sponsorOffers(events) {
        const wkBase = { local: 50, regional: 200, national: 1000, international: 10000, worldwide: 50000 };
        Agency.clients().forEach(p => {
            if (p.injury || p.onLoanAt) return;
            if (p._sponsorSeason === GameState.seasonStartYear) return;                 // one approach per season
            if (Agency.activeSponsorCount(p) >= Agency.MAX_SPONSORS) return;            // a player holds at most two deals at once
            if (GameState.inbox.find(m => m.kind === 'sponsor' && m.offer.playerId === p.id)) return;
            // an open formal transfer request (stage 2+ club case) is public knowledge — sponsors
            // won't commit to a player who may be gone by the time the ink dries
            if (p.moraleCase && p.moraleCase.dim === 'club' && p.moraleCase.stage >= 2) return;
            const level = this._sponsorLevelFor(p);
            if (!level) return;
            const moraleBonus = (p.morale && moraleBand(moraleAvg(p)) === 'GOOD') ? MORALE.SPONSOR_APPROACH_GOOD_BONUS : 0;
            const mediaBonus = p._mediaTrained ? 0.02 : 0;                              // a polished interviewee gets approached more
            if (Rng.next() > 0.06 + moraleBonus + mediaBonus) return;                // spread the approach across the season
            p._sponsorSeason = GameState.seasonStartYear;

            const tot = seasonTotals(p, GameState.seasonStartYear);
            const tenure = this._seasonsAtClub(p);
            const loyal = p.age >= 28 && tenure >= 6;
            const hot = tot.apps >= 6 && tot.avg > 7.5;
            // base weekly for the tier, with a little noise; loyalty/form can push an outlier higher
            let base = wkBase[level] * (0.85 + Rng.next() * 0.3);
            if (p._mediaTrained) base *= 1.15;   // media training: he interviews well, brands pay for it
            if (loyal || hot) base *= 1.4 + Rng.next() * 1.1;                        // standout deal
            const annualEquiv = base * 60;                                              // ~€3k/yr at local 50/wk

            const club = Clubs.getClubById(p.clubId);
            const playCountry = (club && typeof divCountry === 'function') ? divCountry(club.division) : GameState.homeCountry;
            // Sub-international sponsors come from BOTH where he plays and his home country — a Dutch
            // player at Brighton can attract Dutch brands and English brands. (At international/worldwide
            // level the same picker yields big-name brands that read as international sponsors.) Home
            // country only mixes in if the game has a sponsor pool for that nationality.
            const homeCountry = (typeof SPONSOR_COUNTRY_KEY !== 'undefined' && SPONSOR_COUNTRY_KEY[p.nationality]) ? p.nationality : null;
            const srcFor = () => (homeCountry && homeCountry !== playCountry && Rng.next() < 0.45) ? homeCountry : playCountry;
            // Up to three DISTINCT companies, none of them a brand he already has an active deal with
            // (a player never holds two deals from the same sponsor). Capped attempts so a thin sponsor
            // roster can't spin forever, and if none is available the approach is skipped this week.
            const held = new Set((p.sponsorDeals || []).filter(d => d.untilSeason >= GameState.seasonStartYear).map(d => d.company));
            const pool = []; const used = new Set(held);
            for (let tries = 0; pool.length < 3 && tries < 60; tries++) {
                const c = Upgrades.pickSponsor(level, srcFor());
                if (c && !used.has(c)) { used.add(c); pool.push(c); }
            }
            if (!pool.length) return;   // nothing to offer that he doesn't already carry
            // Offers of ROUGHLY EQUAL yearly value (each within ~±8% of a common per-year total), but
            // split very differently between steady weekly wages and an up-front annual lump sum — so the
            // choice is "steady income vs cash now", not "which one obviously pays more". Term length is
            // decoupled from the per-year value: a longer deal doesn't systematically pay more per year.
            const round = v => Math.max(10, Math.round(v / 10) * 10);
            const ra = v => Math.round(v / 100) * 100;
            const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Rng.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
            const perYear = annualEquiv * 1.4;                                           // ~ the combined weekly+lump value per year
            const splits = shuffle([0.85, 0.58, 0.30]);                                  // fraction of each option's per-year value paid as weekly wages (steady / balanced / lump-heavy)
            const terms = shuffle([1, 2, 3]);                                            // term is independent of value
            const opts = pool.map((company, i) => {                                      // one option per distinct company
                const vy = perYear * (0.92 + Rng.next() * 0.16);                      // this option's per-year total, ±8%
                const ws = Math.max(0.15, Math.min(0.95, splits[i] + (Rng.next() - 0.5) * 0.08));
                return { company, weekly: round(vy * ws / 52), annual: ra(vy * (1 - ws)), termSeasons: terms[i] };
            });
            // C3: now and then one offer really stands out — 10% of the time a random option pays ~25% more
            let standout = false;
            if (opts.length && Rng.next() < 0.10) {
                const star = opts[Math.floor(Rng.next() * opts.length)];
                star.weekly = round(star.weekly * 1.25); star.annual = ra(star.annual * 1.25); star.standout = true;
                standout = true;
            }
            const offer = { playerId: p.id, level, options: opts, legend: loyal, hot, standout };
            GameState.addMail({ kind: 'sponsor', subject: I18n.t('sim.sponsorOffersSubj', { name: p.name }), offer, persistence: 0, ttl: 6 });
            events.push({ type: 'offer', text: I18n.t('sim.ev.sponsor', { tier: SPONSOR_LABEL[level], name: p.name, tag: loyal ? I18n.t('sim.ev.loyalTag') : hot ? I18n.t('sim.ev.hotTag') : '', offers: opts.length === 1 ? I18n.t('sim.ev.oneOffer') : I18n.t('sim.ev.nOffers', { n: opts.length }) }) });
        });
    },
    _seasonsAtClub(p) {
        if (!p.clubId) return 0;
        let n = 0;
        Object.keys(p.stats || {}).forEach(y => { if (Object.values(p.stats[y]).some(st => st.clubId === p.clubId && !st.loan)) n++; });
        return n;
    },

    // Clubs proactively try to re-sign a client in the FINAL season of his contract, so you're never
    // ambushed by a player silently running down to a free transfer. If you keep turning them down the
    // club comes back a few weeks later with a better offer — and eventually may decide he isn't worth
    // chasing and lets him run down. (Player-initiated renewals via Agency.requestRenewal still work too.)
    _clubRenewals(events) {
        if (!GameState.isSeasonActive()) return;
        Agency.clients().forEach(p => {
            // only relevant in his final contract season; otherwise clear any stale chase state
            if (p.contractUntilSeason == null || p.contractUntilSeason !== GameState.seasonStartYear) {
                if (p._clubRenewTries || p._clubRenewGaveUp || p._clubRenewNext != null) { p._clubRenewTries = 0; p._clubRenewGaveUp = false; delete p._clubRenewNext; }
                return;
            }
            if (p.freeAgent || p.onLoanAt || p.pendingTransfer || p._clubRenewGaveUp) return;
            if (p.retiringThisSeason) return;   // no point re-signing a player who has announced he'll retire
            if (p._renewSeason === GameState.seasonStartYear) return;   // already re-signed this season
            const club = Clubs.getClubById(p.clubId); if (!club) return;
            if (p.squadRole === 'fringe' && p.ability < club.reputation - 8) return;   // a body they'd happily let go
            // one live offer at a time — wait for the current one to be answered or to lapse
            if (GameState.inbox.some(m => m.kind === 'renewal' && m.offer && m.offer.playerId === p.id)) return;
            if (p._clubRenewNext != null && GameState.absWeek() < p._clubRenewNext) return;
            const tries = p._clubRenewTries || 0;
            if (tries >= 3 && Rng.next() < 0.5) {
                p._clubRenewGaveUp = true;
                GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('sim.clubGiveUpSubj', { name: p.name }), body: I18n.t('sim.clubGiveUpBody', { name: p.name, club: club.name }), ttl: 6 });
                events.push({ type: 'offer', text: I18n.t('sim.clubGiveUpEvent', { name: p.name, club: club.name }) });
                return;
            }
            const bump = 1 + Math.min(0.15, tries * 0.05);   // each knock-back sweetens the next approach
            const proposedWage = Math.round(Math.max(p.wage + 10, Agency.offeredWage(p, club, { loyalty: true, jitter: false }) * bump) / 10) * 10;
            const proposedTermSeasons = Math.min(2 + Math.floor(Rng.next() * 2), Agency.maxContractTerm(p, club));
            GameState.addMail({ kind: 'renewal', subject: I18n.t('sim.clubRenewSubj', { name: p.name, club: club.name }), body: I18n.t('sim.clubRenewBody', { name: p.name, club: club.name, wage: UI.money(proposedWage) }), offer: { playerId: p.id, clubId: club.id, proposedWage, proposedTermSeasons, clubInitiated: true }, ttl: 4 });
            events.push({ type: 'offer', text: I18n.t('sim.clubRenewEvent', { name: p.name, club: club.name }) });
            p._clubRenewTries = tries + 1;
            p._clubRenewNext = GameState.absWeek() + 3 + Math.floor(Rng.next() * 3);
        });
    },

    _expireMail(events) {
        const keep = [];
        GameState.inbox.forEach(m => {
            if (m.ttl == null) { keep.push(m); return; }
            if (m.abs != null && m.abs >= GameState.absWeek()) { keep.push(m); return; }   // never expire a mail the same week it arrived
            m.ttl -= 1;
            if (m.ttl > 0) { keep.push(m); return; }
            // expiring
            if (m.kind === 'transfer' && (m.persistence || 0) > 0) {
                const p = GameState.getPlayer(m.offer.playerId);
                const to = Clubs.getClubById(m.offer.toClubId);
                // a player who has gone out on loan since the bid landed is off the market: let it lapse
                if (p && to && !p.onLoanAt) {
                    const improved = { ...m.offer, transferFee: Math.round(m.offer.transferFee * 1.12 / 500) * 500, proposedWage: Math.round(m.offer.proposedWage * 1.1 / 10) * 10 };
                    keep.push({ id: 'm_' + Rng.next().toString(36).slice(2, 9), kind: 'transfer', subject: I18n.t('sim.improveBidSubj', { club: to.name, name: p.name }), offer: improved, persistence: m.persistence - 1, ttl: 2, week: GameState.week, season: GameState.seasonLabel(), read: false });
                    events.push({ type: 'offer', text: I18n.t('sim.ev.improvedBid', { club: to.name, name: p.name }) });
                }
            }
            // else: drops silently
        });
        GameState.inbox = keep;
    },

    _seasonsActive(p) {
        let n = 0;
        Object.keys(p.stats || {}).forEach(y => { if (seasonTotals(p, +y, true).apps > 0) n++; });
        return n;
    },
    // odds a "final season" player postpones retirement, by appearances that season —
    // graduated rather than an all-or-nothing threshold
    _retirePostponeChance(apps) {
        if (apps >= 30) return 0.7;
        if (apps >= 25) return 0.5;
        if (apps >= 20) return 0.4;
        if (apps >= 15) return 0.2;
        if (apps >= 10) return 0.1;
        return 0;
    },
    _endOfSeason(events, spotlights) {
        const awarded = League.finishSeason();
        const year = GameState.seasonStartYear;
        // hot form: a genuine breakout season lifts him — but also makes him aware he could be
        // earning more elsewhere, hence the wage dip alongside everything else going up
        Agency.clients().forEach(p => {
            if (!p.morale) return;
            const tot = seasonTotals(p, year);
            if (tot.apps < MORALE.HOT_FORM_MIN_APPS || tot.avg < MORALE.HOT_FORM_AVG_RATING) return;
            if (p._hotFormSeason === year) return;
            p._hotFormSeason = year;
            p.morale.time = Math.min(100, p.morale.time + MORALE.HOT_FORM_TIME);
            p.morale.wage = Math.max(0, p.morale.wage + MORALE.HOT_FORM_WAGE);
            p.morale.club = Math.min(100, p.morale.club + MORALE.HOT_FORM_CLUB);
            p.morale.agent = Math.min(100, p.morale.agent + MORALE.HOT_FORM_AGENT);
            // the "season to remember" note is reserved for a genuine FULL season of top form — a
            // handful of brilliant games (10+ apps) still lifts his morale, but doesn't earn the message
            if (tot.apps < MORALE.HOT_FORM_MSG_MIN_APPS) return;
            GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('sim.hotSubj', { name: p.name }), body: I18n.t('sim.hotBody', { name: p.name, avg: tot.avg.toFixed(2), apps: tot.apps }), ttl: 6 });
            events.push({ type: 'morale', text: I18n.t('sim.hotEvent', { name: p.name }) });
        });
        // resolve retirements: games played this "final" season buys a graduated chance of one more year (max 3 stays)
        GameState.players.forEach(p => {
            if (p.archived || !p.retiringThisSeason || !p.everClient) return;
            const apps = seasonTotals(p, year).apps;
            const chance = this._retirePostponeChance(apps);
            if (p.retireDelays < 3 && Rng.next() < chance) {
                p.retireDelays += 1; p.retireAge = p.age + 1; p.retiringThisSeason = false;
                if (p.agentId === 'me') {
                    const body = I18n.t('sim.playsOnBody', { apps, name: p.name });
                    GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('sim.playsOnSubj', { name: p.name }), body, ttl: 6 });
                    GameState.addLog(I18n.t('sim.playsOnLog', { name: p.name }), 'contract');
                    if (spotlights) spotlights.push({ icon: '💪', title: I18n.t('sim.playsOnSubj', { name: p.name }), quote: body, playerId: p.id });
                }
            } else {
                const body = I18n.t('sim.retireBody', { name: p.name, seasons: this._seasonsActive(p) });
                // a CURRENT client gets a proper farewell conversation instead of a spotlight card —
                // queued here (persisted on the agency), played from the Home advance flow
                if (p.agentId === 'me') {
                    // while he still has a club: did he finish where his heart always was?
                    if (typeof Dialogue !== 'undefined') Dialogue.checkBoyhoodAtRetirement(p);
                    if (!GameState.agency.pendingFarewells) GameState.agency.pendingFarewells = [];
                    GameState.agency.pendingFarewells.push(p.id);
                }
                GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('sim.retireSubj', { name: p.name }), body, ttl: 6 });
                GameState.addLog(I18n.t('sim.retireLog', { name: p.name }), 'contract');
                p.archived = true; p.retired = true; p.agentId = null; p.clubId = null; p.onLoanAt = null; p.transferListed = false;
            }
        });
        // unsigned scouted talents who age out of the youth window quietly drop off the radar
        // (keeps memory bounded; NO new youth is generated to replace them)
        GameState.players = GameState.players.filter(p =>
            !(typeof p.discoveredVia === 'string' && p.discoveredVia.indexOf('scout') === 0
                && p.age > 23 && p.agentId == null && !p.everClient && !p.archived));
        // record each club's finishing position + trophies (persists across seasons)
        if (!GameState.clubHistory) GameState.clubHistory = {};
        ALL_LEAGUE_DIVS.forEach(div => {
            if (!GameState.league.tables[div]) return;
            League.sortedTable(div).forEach((row, i) => {
                const trophies = awarded.filter(a => a.clubId === row.clubId).map(a => a.compId);
                if (!GameState.clubHistory[row.clubId]) GameState.clubHistory[row.clubId] = [];
                GameState.clubHistory[row.clubId].push({ year, division: div, position: i + 1, trophies });
            });
        });
        // European winners that live only in the pooled associations (virtual clubs, not in any
        // domestic division above) still earn an honours entry so their guest card shows the title
        if (GameState.league.europe && GameState.league.europe.comps) ['UCL', 'UEL', 'UECL'].forEach(k => {
            const w = GameState.league.europe.comps[k].ko && GameState.league.europe.comps[k].ko.winner;
            if (w && !Clubs.getClubById(w)) {
                if (!GameState.clubHistory[w]) GameState.clubHistory[w] = [];
                GameState.clubHistory[w].push({ year, division: k, position: 1, trophies: [k] });
            }
        });
        // remember each club's BEST-EVER run in each of the three European competitions (kept only if
        // it improves on the previous best) — surfaced on the club page
        if (GameState.league.europe && typeof Europe !== 'undefined' && Europe.bestStages) {
            if (!GameState.clubEuropeBest) GameState.clubEuropeBest = {};
            const bs = Europe.bestStages(GameState.league.europe);
            Object.entries(bs).forEach(([comp, m]) => Object.entries(m).forEach(([clubId, stage]) => {
                if (!GameState.clubEuropeBest[clubId]) GameState.clubEuropeBest[clubId] = {};
                const cur = GameState.clubEuropeBest[clubId][comp];
                // cur is a { stage, year } record (legacy saves may hold a bare number) — compare the
                // STAGE, not the object. Comparing `stage > cur` against an object is always false, so
                // the best-ever run never improved past the first European season it was recorded.
                const curStage = (cur && typeof cur === 'object') ? cur.stage : cur;
                if (curStage == null || stage > curStage) GameState.clubEuropeBest[clubId][comp] = { stage, year };
            }));
        }
        // build summary of client trophies (any country)
        const L = GameState.league;
        const hc = GameState.homeCountry || 'Netherlands';
        const lines = [];
        awarded.forEach(a => {
            if (a.clients.length) {
                const club = Clubs.getClubById(a.clubId);
                const abroad = club && club.country !== hc ? I18n.t('sim.rev.abroad', { country: club.country }) : '';
                const names = a.clients.map(id => GameState.getPlayer(id)?.name).filter(Boolean).join(', ');
                lines.push(`${compName(a.compId)} — ${club ? club.name : League.teamName(a.clubId)}${abroad}: ${names}`);
            }
        });
        const homeDivs = (typeof COUNTRY_DIVS !== 'undefined' && COUNTRY_DIVS[hc]) || ['ERE', 'EED', 'TWD', 'DRD'];
        const champs = homeDivs.map(d => `${COMPETITIONS[d].name}: ${Clubs.getClubById(League.sortedTable(d)[0]?.clubId)?.name || '—'}`).join('<br>');
        const CUP_KEY_COMP = { beker: 'BEKER', kbek: 'KBEK', facup: 'FACUP', llc: 'LLC', dfb: 'DFB', lpokal: 'LPOKAL', cdr: 'CDR', cfed: 'CFED' };
        const homeCups = (typeof COUNTRY_CUPS !== 'undefined' && COUNTRY_CUPS[hc]) || [['beker', 'KNVB Beker'], ['kbek', 'De kleine Beker']];
        const cupLine = homeCups.map(([key, label]) => {
            const wid = L && L[key] ? L[key].winner : null;
            const nm = wid ? (Clubs.getClubById(wid)?.name || League.teamName(wid)) : '—';
            return `${label}: ${nm}`;
        }).join('<br>');
        let poLine = homeDivs.filter((d, i) => i > 0).map(d => L?.playoffs?.[d] ? I18n.t('sim.rev.poWon', { comp: COMPETITIONS[d].short, club: Clubs.getClubById(L.playoffs[d].winner)?.name || League.teamName(L.playoffs[d].winner) }) : null).filter(Boolean).join('<br>');
        if (hc === 'Switzerland' && L?.swissBarrage) {
            const bar = L.swissBarrage;
            const barLines = [];
            if (bar.top) barLines.push(I18n.t('sim.rev.barrageTop', { club: Clubs.getClubById(bar.top.winner)?.name || League.teamName(bar.top.winner) }));
            if (bar.bottom) barLines.push(I18n.t('sim.rev.barrageBottom', { club: Clubs.getClubById(bar.bottom.winner)?.name || League.teamName(bar.bottom.winner) }));
            poLine = [poLine, ...barLines].filter(Boolean).join('<br>');
        }
        const body = `${I18n.t('sim.rev.over', { label: GameState.seasonLabel() })}<br><br>${I18n.t('sim.rev.champsHead', { hc })}<br>${champs}<br><br>${I18n.t('sim.rev.cupsHead')}<br>${cupLine}<br><br>` +
            (poLine ? `${I18n.t('sim.rev.poHead')}<br>${poLine}<br><br>` : '') +
            (lines.length ? `${I18n.t('sim.rev.clientsWon')}<br>${lines.join('<br>')}` : I18n.t('sim.rev.noSilver')) +
            `<br><br>${I18n.t('sim.rev.footer')}`;
        GameState.addMail({ kind: 'summary', subject: I18n.t('sim.rev.subj', { label: GameState.seasonLabel() }), body, ttl: 8 });

        // snapshot the finished season so it stays viewable after the rollover
        GameState.lastSeasonReport = {
            year,
            champions: { ...((L && L.champions) || {}) },
            beker: L && L.beker ? { winner: L.beker.winner, results: L.beker.results } : null,
            kbek: L && L.kbek ? { winner: L.kbek.winner, results: L.kbek.results, groups: L.kbek.groups } : null,
            facup: L && L.facup ? { winner: L.facup.winner, results: L.facup.results } : null,
            llc: L && L.llc ? { winner: L.llc.winner, results: L.llc.results, groups: L.llc.groups } : null,
            playoffs: L && L.playoffs ? { ...L.playoffs } : null,
            dfb: L && L.dfb ? { winner: L.dfb.winner, results: L.dfb.results } : null,
            lpokal: L && L.lpokal ? { winner: L.lpokal.winner, results: L.lpokal.results } : null,
            germanReleg: L && L.germanReleg ? { ...L.germanReleg } : null,
            cdr: L && L.cdr ? { winner: L.cdr.winner, results: L.cdr.results } : null,
            cfed: L && L.cfed ? { winner: L.cfed.winner, results: L.cfed.results } : null,
            tacaportugal: L && L.tacaportugal ? { winner: L.tacaportugal.winner, results: L.tacaportugal.results } : null,
            segundataca: L && L.segundataca ? { winner: L.segundataca.winner, results: L.segundataca.results } : null,
            belgiancup: L && L.belgiancup ? { winner: L.belgiancup.winner, results: L.belgiancup.results, groups: L.belgiancup.groups } : null,
            notrecoupe: L && L.notrecoupe ? { winner: L.notrecoupe.winner, results: L.notrecoupe.results } : null,
            europe: L && L.europe ? L.europe : null,
            prorel: null
        };
        GameState.addLog(I18n.t('sim.rev.finishedLog', { label: GameState.seasonLabel() }), 'season');
        events.push({ type: 'season', text: I18n.t('sim.rev.finishedEvent', { label: GameState.seasonLabel() }) });

        // bring everyone home for the off-season: out of the U21/reserves and back from loans that end this season,
        // so they're at their parent club and ready to negotiate before the new campaign
        const backNames = [];
        GameState.players.forEach(p => {
            if (p.agentId !== 'me' || !p.onLoanAt) return;
            const isYouth = isU21Loan(p) || isReserveClub(p.onLoanAt);
            const loanEnds = p.loanUntilSeason == null || p.loanUntilSeason <= year;
            if (isYouth || loanEnds) {
                p.onLoanAt = null; p.loanRole = null; p.loanMid = false; p.loanUntilSeason = null;
                if (isYouth) p.squadRole = 'fringe';   // returns as a squad option, not an automatic starter
                backNames.push(p.name);
            }
        });
        if (backNames.length) GameState.addMail({ kind: 'news', subject: I18n.t('sim.backSubj'), body: I18n.t('sim.backBody', { names: backNames.join(', ') }), ttl: 6 });
    },

    _rollNewSeason(events, spotlights) {
        const year = GameState.seasonStartYear;
        // capture the finished season's final tables + cup winners now — next season's European
        // entrants are read from them, before promotion/relegation & setupSeason wipe the tables.
        const euSnap = (typeof Europe !== 'undefined') ? Europe.captureStandings() : null;
        // archive this season's finance ledger and start a fresh one
        GameState.agency.ledgerLast = GameState.agency.ledger || {};
        GameState.agency.ledger = {};
        GameState.agency.ledgerSeason = year + 1;
        // seasonal form rolls for next season, judged on the season just finished — must run
        // BEFORE promotion/relegation moves clubs between divisions (expected vs actual position
        // both refer to the finished season's ladder)
        League.rollSeasonDeltas();
        // promotion/relegation from the finished season (moves clubs between divisions)
        const tierBefore = {}; Clubs.allClubs.forEach(c => tierBefore[c.id] = c.tier);
        const prorel = League.applyPromotionRelegation();
        this._assertDivisionSizes();
        // fade departed-star auras and re-derive every club's moving reputation from its anchor
        League.normalizeReputations();
        // record promotions (green ▲) / relegations (red ▼) for clients by their club's tier change — country-agnostic
        GameState.players.forEach(p => {
            if (!p.everClient) return;
            const stints = seasonStints(p, year).filter(st => !st.youth);
            const end = stints[stints.length - 1]; if (!end) return;
            let divId = null;
            Object.entries(end.comps).forEach(([cid, c]) => { const comp = COMPETITIONS[cid]; if (comp && comp.type === 'league' && (c.apps || 0) > 0) divId = cid; });
            if (!divId) return;
            const club = Clubs.getClubById(end.clubId); if (!club) return;
            const oldTier = tierBefore[end.clubId], newTier = club.tier;
            if (oldTier == null || newTier == null || oldTier === newTier) return;
            const wonTitle = (p.trophies || []).some(t => t.year === year && t.compId === divId);
            if (!p.movements) p.movements = [];
            if (newTier < oldTier && !wonTitle) {
                p.movements.push({ year, type: 'promo', division: divId });   // moved up a tier
                if (p.agentId === 'me' && p.morale) p.morale.club = Math.min(100, p.morale.club + MORALE.PROMOTION_CLUB);
            } else if (newTier > oldTier) {
                p.movements.push({ year, type: 'releg', division: divId });   // dropped a tier
                if (p.agentId === 'me' && p.morale) p.morale.club = Math.max(0, p.morale.club + MORALE.RELEGATION_CLUB);
            }
        });
        if (GameState.lastSeasonReport) GameState.lastSeasonReport.prorel = prorel;
        if (GameState.lastSeasonReport) GameState.lastSeasonReport.prorelEng = (GameState.league && GameState.league.prorelEng) || null;
        if (GameState.lastSeasonReport) GameState.lastSeasonReport.prorelGer = (GameState.league && GameState.league.prorelGer) || null;
        if (GameState.lastSeasonReport) GameState.lastSeasonReport.prorelEsp = (GameState.league && GameState.league.prorelEsp) || null;
        // add your clients' promotions/relegations (incl. those playing abroad) to the season review
        const hc = GameState.homeCountry || 'Netherlands';
        const moveLines = [];
        GameState.players.forEach(p => {
            if (p.agentId !== 'me') return;
            (p.movements || []).filter(m => m.year === year).forEach(m => {
                const club = Clubs.getClubById(p.clubId);
                const abroad = club && club.country !== hc ? I18n.t('sim.rev.abroad', { country: club.country }) : '';
                const compNm = (COMPETITIONS[m.division] || {}).name || m.division;
                moveLines.push(`${m.type === 'promo' ? I18n.t('sim.rev.promoted') : I18n.t('sim.rev.relegated')}: ${p.name} (${compNm})${abroad}`);
            });
        });
        if (moveLines.length) {
            const review = GameState.inbox.find(m => m.kind === 'summary');
            const block = `<br><br>${I18n.t('sim.rev.moveBlockHead')}<br>${moveLines.join('<br>')}`;
            if (review) review.body = (review.body || '') + block;
            else GameState.addMail({ kind: 'news', subject: I18n.t('sim.rev.moveSubj'), body: moveLines.join('<br>'), ttl: 6 });
        }
        if (prorel) {
            const nm = id => Clubs.getClubById(id)?.name || id;
            GameState.addMail({
                kind: 'news', subject: I18n.t('sim.prorel.subj'),
                body: `${I18n.t('sim.prorel.upTo', { div: 'Eredivisie' })} ${prorel.eedUp.map(nm).join(', ')}<br>` +
                    `${I18n.t('sim.prorel.downFrom', { div: 'Eredivisie' })} ${prorel.ereDown.map(nm).join(', ')}<br><br>` +
                    `${I18n.t('sim.prorel.upTo', { div: 'Eerste' })} ${prorel.twdUp.map(nm).join(', ')}<br>` +
                    `${I18n.t('sim.prorel.downFrom', { div: 'Eerste' })} ${prorel.eedDown.map(nm).join(', ')}<br><br>` +
                    `${I18n.t('sim.prorel.upTo', { div: 'Tweede' })} ${prorel.drdUp.map(nm).join(', ')}<br>` +
                    `${I18n.t('sim.prorel.downFrom', { div: 'Tweede' })} ${prorel.twdDown.map(nm).join(', ')}`, ttl: 6
            });
        }
        GameState.players.forEach(p => {
            if (p.onLoanAt && (p.loanUntilSeason == null || p.loanUntilSeason <= year)) { p.onLoanAt = null; p.loanRole = null; p.loanMid = false; }
            if (p.agentId !== 'me' && p.stats) {
                Object.keys(p.stats).forEach(y => { if (+y < year - 3) delete p.stats[y]; });
            }
        });
        GameState.seasonStartYear += 1;
        // pre-season transfers now take effect: the player is officially at his new club, drop the "joining" tag
        GameState.players.forEach(p => { if (p._joinSeason && p._joinSeason <= GameState.seasonStartYear) { delete p.joiningClubId; delete p._joinSeason; } });
        // players nearing the end announce their final season to their agent
        const RETIRE_REASONS = [I18n.t('sim.retireReason1'), I18n.t('sim.retireReason2'), I18n.t('sim.retireReason3'), I18n.t('sim.retireReason4'), I18n.t('sim.retireReason5'), I18n.t('sim.retireReason6')];
        GameState.players.forEach(p => {
            if (p.archived || p.retiringThisSeason || !p.everClient) return;   // only your (ever-)clients retire & get archived
            if (p.age >= p.retireAge - 1) {
                p.retiringThisSeason = true;
                if (p.agentId === 'me') {
                    const body = I18n.t('sim.retirePlanBody', { reason: RETIRE_REASONS[Math.floor(Rng.next() * RETIRE_REASONS.length)] });
                    GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('sim.retirePlanSubj', { name: p.name }), body, ttl: 6 });
                    GameState.addLog(I18n.t('sim.retirePlanLog', { name: p.name }), 'contract');
                    if (spotlights) spotlights.push({ icon: '🕰️', title: I18n.t('sim.retirePlanSubj', { name: p.name }), quote: body, playerId: p.id });
                }
            }
        });
        // contracts that have run out -> the player becomes a free agent (no club, free transfer, unsettled)
        GameState.players.forEach(p => {
            if (p.agentId === 'me' && !p.freeAgent && p.clubId && p.contractUntilSeason != null && p.contractUntilSeason < GameState.seasonStartYear) {
                const old = Clubs.getClubById(p.clubId);
                p.freeAgent = true; p.clubId = null; p.onLoanAt = null; p.loanRole = null; p.squadRole = 'fringe';
                p.morale.club = Math.max(0, p.morale.club - 25);
                GameState.addMail({ kind: 'news', subject: I18n.t('sim.freeAgentSubj', { name: p.name }), body: I18n.t('sim.freeAgentBody', { name: p.name, club: old ? old.name : I18n.t('co.hisClubLc') }), ttl: 6 });
                GameState.addLog(I18n.t('sim.freeAgentLog', { name: p.name }), 'contract');
            }
        });
        // another season together quietly deepens every client relationship (see js/dialogue.js)
        if (typeof Dialogue !== 'undefined') {
            Agency.clients().forEach(p => Dialogue.addBond(p, 1));
            Dialogue.onSeasonRollover();   // weddings, christenings, referrals (Phase 4)
        }
        // sponsor deals: pay the yearly instalment for active deals, expire the ones that have run out
        GameState.players.forEach(p => {
            if (p.agentId !== 'me' || !p.sponsorDeals || !p.sponsorDeals.length) return;
            const keep = [];
            p.sponsorDeals.forEach(d => {
                if (d.untilSeason >= GameState.seasonStartYear) {
                    const cut = Math.round((d.annual || 0) * p.sponsorCommission / 100);
                    if (cut) { GameState.agency.balance += cut; GameState.addFinance('Sponsoring', cut); }
                    keep.push(d);
                } else {
                    p.sponsorIncome = Math.max(0, p.sponsorIncome - d.weekly);   // deal lapses
                }
            });
            p.sponsorDeals = keep;
        });
        Upgrades.facRollover();
        GameState.players.forEach(p => {
            if (p.agentId === 'me' && p.repUntilSeason != null && p.repUntilSeason < GameState.seasonStartYear && !p.repExpired) {
                p.repExpired = true;
                GameState.addMail({ kind: 'news', subject: I18n.t('sim.repTermSubj', { name: p.name }), body: I18n.t('sim.repTermBody', { name: p.name }), ttl: 6 });
            }
        });
        League.setupSeason();
        // build the new season's UEFA competitions from the standings captured above (seasonStartYear
        // has already advanced to the new season by this point)
        if (typeof Europe !== 'undefined' && euSnap) Europe.buildEurope(euSnap.standings, euSnap.cups, GameState.seasonStartYear);
        this._assertNoDualDivisionMembership();
        const t = I18n.t('sim.newSeasonLog', { label: GameState.seasonLabel() });
        GameState.addLog(t, 'season'); events.push({ type: 'season', text: t });
    },

    // ---- guardrails against the class of bug fixed alongside these (club divisions not
    // persisting across a restart, corrupting promotion/relegation): if a division ever ends
    // up the wrong size again, or a club ends up scheduled in two divisions at once, surface
    // it immediately (console + a dev-visible inbox mail) instead of it silently compounding
    // season after season. Italy has no promotion/relegation wired up yet (COUNTRY_DIVS
    // doesn't include it), so it's naturally excluded from both checks below. ----
    _assertDivisionSizes() {
        const mismatches = [];
        Object.values(COUNTRY_DIVS).forEach(divs => divs.forEach(div => {
            const expected = Clubs.staticDivSize(div);
            const actual = Clubs.getClubsByDivision(div).length;
            if (expected != null && actual !== expected) mismatches.push({ div, expected, actual });
        }));
        if (mismatches.length) {
            console.error('Division size mismatch after promotion/relegation:', mismatches);
            GameState.addMail({
                kind: 'news', cat: 'dev', subject: 'DEV WARNING: division size mismatch',
                body: mismatches.map(m => `${m.div}: expected ${m.expected}, got ${m.actual}`).join('<br>'), ttl: 20
            });
        }
    },
    _assertNoDualDivisionMembership() {
        const seen = {};
        Object.entries((GameState.league && GameState.league.tables) || {}).forEach(([div, rows]) => {
            (rows || []).forEach(r => { (seen[r.clubId] = seen[r.clubId] || []).push(div); });
        });
        const dupes = Object.entries(seen).filter(([, divs]) => divs.length > 1);
        if (dupes.length) {
            console.error('Clubs scheduled in multiple divisions after setupSeason():', dupes);
            GameState.addMail({
                kind: 'news', cat: 'dev', subject: 'DEV WARNING: club in two divisions',
                body: dupes.map(([id, divs]) => `${(Clubs.getClubById(id) || {}).name || id}: ${divs.join(', ')}`).join('<br>'), ttl: 20
            });
        }
    }
};
