// ============================================================
//  Agency — negotiations (multi-step), clients, money, deals
// ============================================================
// Rough country centroids (lat, lon) for the leagues the game simulates — used to weight where
// loan interest comes from: mostly domestic, some from neighbours, rarely from a distant league.
const LOAN_COUNTRY_COORD = {
    England: [52.5, -1.5], Netherlands: [52.2, 5.3], Belgium: [50.6, 4.5], Germany: [51.0, 10.0],
    France: [46.6, 2.4], Switzerland: [46.8, 8.2], Italy: [43.0, 12.5], Spain: [40.2, -3.7], Portugal: [39.5, -8.0]
};
function loanCountryDist(a, b) {
    const A = LOAN_COUNTRY_COORD[a], B = LOAN_COUNTRY_COORD[b];
    if (!A || !B) return 14;   // unknown country -> treat as far away
    return Math.hypot(A[0] - B[0], A[1] - B[1]);
}
// ---- Negotiation dynamics (Phase 2 overhaul, see docs/negotiation-overhaul-spec.md) ----
// The keystone: wage and agent fee draw from ONE implicit budget, so a fatter fee visibly
// costs the player wage (which then erodes his morale on its own). Patience is a threat meter
// seeded by the relationship: each round the club has to push back it loses a little, and at
// 100 it walks. All values are calibration knobs to be tuned in playtest.
const NEGO = {
    FEE_TO_WAGE: 1.0,   // €1 of amortized annual fee costs ~€1 of annual wage room
    THREAT_BASE: 8,     // patience lost per haggling round at a neutral relationship
    THREAT_MAX: 100,    // at 100 the club walks away from the table
    ROUND_CAP: 8,       // hard safety net so nothing can loop forever
    WALKOUT_REL: -20,   // relationship hit when a club walks
    BAND_MED: 40, BAND_HIGH: 75,   // threat thresholds for the tension cue / final-offer tone
};
const Agency = {
    NEGO,
    init() {
        const relationships = {};
        Clubs.allClubs.forEach(c => {
            let base = 72 - (c.reputation - 38) * 0.5;
            relationships[c.id] = Math.round(Math.max(48, Math.min(75, base)));
        });
        GameState.agency = {
            name: 'Your Agency', agentName: '', reputation: 12, balance: 3000,
            homeCountry: GameState.homeCountry || 'Netherlands',
            scouts: [], relationships,
            intlLicenceUntil: null,   // absWeek until which an International Scouting Licence is valid
            intlSuspendedUntil: null, // absWeek until which scouting abroad is suspended (licence-lapse penalty)
            upgrades: { officeIndex: 0, vehicleIndex: -1, propertyIndex: -1 },
            facilities: { items: [], physios: 0, trainers: 0 },
            ledger: {}, ledgerLast: {}, ledgerAll: {}, ledgerSeason: GameState.seasonStartYear
        };
    },
    INTL_LICENCE_COST: 20000,   // the 1-season fee; also the reference for lapse fines (see Sim._scoutLicence)
    // buy/renew options: { weeks, cost, label }. Longer terms are a little cheaper per season.
    INTL_LICENCE_OPTIONS: [
        { weeks: 52, cost: 20000, label: '1 season' },
        { weeks: 104, cost: 37500, label: '2 seasons' },
        { weeks: 156, cost: 52500, label: '3 seasons' },
    ],
    hasIntlLicence() { const a = GameState.agency; return !!(a && a.intlLicenceUntil != null && GameState.absWeek() < a.intlLicenceUntil); },
    intlLicenceWeeksLeft() { const a = GameState.agency; return (a && a.intlLicenceUntil != null) ? Math.max(0, a.intlLicenceUntil - GameState.absWeek()) : 0; },
    // international scouting can be suspended for a year after repeatedly ignoring a lapsed licence
    intlSuspended() { const a = GameState.agency; return !!(a && a.intlSuspendedUntil != null && GameState.absWeek() < a.intlSuspendedUntil); },
    intlSuspendWeeksLeft() { const a = GameState.agency; return (a && a.intlSuspendedUntil != null) ? Math.max(0, a.intlSuspendedUntil - GameState.absWeek()) : 0; },
    buyIntlLicence(weeks) {
        const a = GameState.agency;
        if (this.intlSuspended()) return { ok: false, message: I18n.t('ag.lic.suspended', { n: this.intlSuspendWeeksLeft() }) };
        const opt = this.INTL_LICENCE_OPTIONS.find(o => o.weeks === weeks) || this.INTL_LICENCE_OPTIONS[0];
        if (a.balance < opt.cost) return { ok: false, message: I18n.t('ag.lic.cost', { amt: UI.money(opt.cost) }) };
        GameState.addFinance('International licence', -opt.cost);
        a.balance -= opt.cost;
        // extend from now, or from the current expiry if still valid
        const from = this.hasIntlLicence() ? a.intlLicenceUntil : GameState.absWeek();
        a.intlLicenceUntil = from + opt.weeks;
        GameState.addLog(I18n.t('ag.log.licence', { amt: UI.money(opt.cost), label: this.durLabel(opt.label) }), 'scout');
        return { ok: true, message: I18n.t('ag.lic.active', { label: this.durLabel(opt.label) }) };
    },
    data() { return GameState.agency; },
    clients() { return GameState.players.filter(p => p.agentId === 'me' && !p.archived); },
    isClient(p) { return p && p.agentId === 'me'; },
    capacity() { return 5 + Upgrades.playerBonus(); },
    repLimit() { return Upgrades.repLimit(); },
    bumpRep(d) { const a = GameState.agency; a.reputation = Math.max(0, Math.min(this.repLimit(), a.reputation + d)); return a.reputation; },
    atCapacity() { return this.clients().length >= this.capacity(); },

    relationship(clubId) { const r = GameState.agency.relationships; if (r[clubId] == null) r[clubId] = 55; return r[clubId]; },
    changeRelationship(clubId, d) { const r = GameState.agency.relationships; r[clubId] = Math.max(0, Math.min(100, (r[clubId] ?? 55) + d)); return r[clubId]; },

    // ---------- negotiation patience (threat meter) ----------
    // warm clubs start relaxed, frosty ones already on edge
    threatInit(rel) { return rel >= 78 ? 0 : rel <= 30 ? 30 : 8; },
    // and lose patience slower / faster per round accordingly
    threatAccumMod(rel) { return rel >= 78 ? 0.7 : rel <= 30 ? 1.5 : 1.0; },
    threatBand(t) { return t >= NEGO.BAND_HIGH ? 'high' : t >= NEGO.BAND_MED ? 'med' : 'low'; },
    // Persisted per-deal negotiation state, carried on the mail's offer so it survives a reload.
    // profile/wInitial/history are recorded now but only consumed by the Pass-2 classifier.
    initNeg(neg, club, wInitial) {
        if (neg && neg._init) return neg;
        neg = neg || {};
        neg._init = true;
        neg.round = 1;
        neg.threat = this.threatInit(this.relationship(club ? club.id : null));
        neg.profile = 'NEUTRAL';
        neg.wInitial = wInitial || 0;
        neg.history = [];
        neg.lastCounter = null;
        return neg;
    },
    // advance patience after a round the club had to push back on; true => the club walks
    bumpThreat(neg, club) {
        neg.threat += NEGO.THREAT_BASE * (neg.profileMod || 1.0) * this.threatAccumMod(this.relationship(club ? club.id : null));
        neg.round += 1;
        return neg.threat >= NEGO.THREAT_MAX || neg.round > NEGO.ROUND_CAP;
    },

    // ---------- Pass 2: how the agent is playing this deal ----------
    // Four archetypes drawn from the fee/wage/concession shape of the offer. They never gate money
    // or trust directly (the keystone budget already does that) — they only modulate how fast the
    // club loses patience (profileMod), and the goodwill delta when the deal concludes.
    profileMod(profile) {
        return profile === 'Wildcat' ? 3.0 : profile === 'Champion' ? 0.5 : profile === 'Optimizer' ? 0.6 : 1.0;
    },
    // how far the agent has walked his wage ask down from the opening round (0 = stubborn, 1 = met them)
    _concession(neg) {
        const h = neg && neg.history;
        if (!h || h.length < 2) return 0;
        const first = h[0].w, last = h[h.length - 1].w;
        if (first <= 0) return 0;
        return Math.max(0, Math.min(1, ((first - last) / first) / 0.25));   // giving back ~25% reads as "met them"
    },
    // classify the CURRENT package -> { profile, rGreed, rWage, vConcess }. Only transfers carry a fee,
    // so this is a transfer-flow tool; renewals stay NEUTRAL.
    classifyOffer(p, club, pkg, neg) {
        const term = Math.max(1, Math.min(6, pkg.term || 3));
        const W = Math.max(1, pkg.wage || 0), F = pkg.bonus || 0;
        const rGreed = (F / term) / (W * 52);                              // amortized fee vs annual wage
        const rWage = W / Math.max(1, (neg && neg.wInitial) || W);         // how far above the club's opening wage
        const vConcess = this._concession(neg);
        const termOk = pkg.term >= 2 && pkg.term <= this.maxContractTerm(p, club);
        let profile = 'NEUTRAL';
        if (rGreed > 0.25 && rWage < 1.15) profile = 'Parasite';           // fat fee, take-home barely moves
        else if (rGreed < 0.08 && rWage > 1.25) profile = 'Champion';      // waives fee to push the player's wage
        else if (rWage > 1.35 && rGreed > 0.20 && vConcess < 0.1) profile = 'Wildcat';   // greedy AND stubborn
        else if (termOk && vConcess >= 0.3) profile = 'Optimizer';         // sensible length, willing to meet them
        return { profile, rGreed, rWage, vConcess };
    },
    // goodwill change when a deal is AGREED (walkout is handled inline at -20 / -15 after an ultimatum)
    concludeRelDelta(profile, rounds) {
        let d = profile === 'Champion' ? 6 : profile === 'Wildcat' ? -6 : profile === 'Parasite' ? 0 : 2;
        if (rounds <= 2) d += 4;   // a fast, clean deal is its own goodwill
        return d;
    },
    // Pass 3: data-driven club line for (profile × threat band × context), keyed nego.line.<ctx>.<profile>.<band>.
    // Returns '' when no line is authored for that cell, so callers fall back to the generic counter/final string.
    negLine(profile, band, context, vars) {
        const k = 'nego.line.' + context + '.' + profile + '.' + band;
        const v = I18n.t(k, vars || {});
        return v === k ? '' : v;
    },

    // ---------- request cooldowns: stop re-asking the same thing repeatedly to force a lucky roll ----------
    // one attempt per player+action per week; the answer stands until at least the next week
    onCooldown(p, action) {
        const cd = p._reqCd; if (!cd) return false;
        const last = cd[action];
        return last != null && GameState.absWeek() - last < 1;
    },
    setCooldown(p, action) { if (!p._reqCd) p._reqCd = {}; p._reqCd[action] = GameState.absWeek(); },

    // ---------- signing eligibility ----------
    canSign(p) {
        if (!p) return { ok: false, reason: I18n.t('ag.sign.noPlayer') };
        if (p.agentId === 'me') return { ok: false, reason: I18n.t('ag.sign.already') };
        if (p.agentId) return { ok: false, reason: I18n.t('ag.sign.otherAgent') };
        if (p.noTalkUntil && p.noTalkUntil > GameState.absWeek()) return { ok: false, reason: I18n.t('ag.sign.noTalkWeeks', { n: p.noTalkUntil - GameState.absWeek() }) };
        if (p.age >= 23) return { ok: false, reason: I18n.t('ag.sign.under23') };
        if (this.atCapacity()) return { ok: false, reason: I18n.t('ag.sign.capacity', { n: this.capacity() }) };
        const ceiling = GameState.agency.reputation + 12;
        if (p.ability > ceiling) return { ok: false, reason: I18n.t('ag.sign.lowRep') };
        return { ok: true };
    },

    // base commission ceiling (forward commissions on transfers/renewals). lev = how far the agency
    // out-ranks the player. A balanced matchup lands ~10-12%; standout talents give less; weaker players
    // tolerate more, but 25% stays out of reach (only very lopsided pairings approach the cap).
    // Phase 4 (morale rework): an existing client's tolerance for the agent's own cut moves
    // with how he feels about your representation — up to +3pp at GOOD, down to -3pp at BAD.
    // Note: the mobile UI has no "renegotiate representation cut" flow yet, so this currently
    // only affects the old desktop UI's equivalent screen (js/ui.js) — see the morale rework
    // report for detail.
    maxCommissions(p) {
        const lev = GameState.agency.reputation - p.ability;
        const band = p.morale ? moraleBand(moraleAvg(p)) : 'MID';
        const tol = band === 'GOOD' ? MORALE.COMMISSION_TOLERANCE_GOOD : band === 'BAD' ? MORALE.COMMISSION_TOLERANCE_BAD : 0;
        return {
            wage: Math.max(5, Math.min(18, Math.round(10 + lev * 0.32 + tol))),
            sponsor: Math.max(6, Math.min(20, Math.round(12 + lev * 0.36 + tol)))
        };
    },
    // signing ceiling: a LONGER commitment buys a little extra tolerance, but only a little
    maxSignCommissions(p, term) {
        const lev = GameState.agency.reputation - p.ability;
        const termBonus = Math.max(0, term - 1) * 0.4;   // up to +3.6 at a 10-year deal
        return {
            wage: Math.max(5, Math.min(18, Math.round(9 + lev * 0.30 + termBonus))),
            sponsor: Math.max(6, Math.min(20, Math.round(11 + lev * 0.34 + termBonus)))
        };
    },

    // multi-step representation negotiation. term 1..10; longer term => higher tolerance.
    negotiateSign(p, wage, sponsor, term, round = 1) {
        const aw = GameState.absWeek();
        if (p.noTalkUntil && p.noTalkUntil > aw) return { status: 'cold', message: I18n.t('ag.noTalk') };
        const max = this.maxSignCommissions(p, term);
        const wageOver = wage - max.wage, sponsorOver = sponsor - max.sponsor;
        if (wageOver <= 0 && sponsorOver <= 0) {
            const lines = [I18n.t('nego.sign.accept1'), I18n.t('nego.sign.accept2'), I18n.t('nego.sign.accept3')];
            return { status: 'accept', message: lines[Math.floor(Rng.next() * lines.length)] };
        }
        if (round >= 4) {
            const weeks = 5 + Math.floor(Rng.next() * 6);
            p.noTalkUntil = aw + weeks;
            return { status: 'walk', weeks, message: I18n.t('ag.walkAway') };
        }
        // a longer commitment lets him stomach a bigger cut
        const suggestTerm = Math.min(10, term + 2);
        const m2 = this.maxSignCommissions(p, suggestTerm);
        // worded reaction referencing the actual sticking point
        let msg;
        const shortTerm = term <= 4;
        if (wageOver > 0 && sponsorOver > 0)
            msg = shortTerm
                ? I18n.t('nego.sign.bothShort', { yrs: this.yrs(term) })
                : I18n.t('nego.sign.bothLong');
        else if (wageOver > 0)
            msg = shortTerm
                ? I18n.t('nego.sign.wageShort', { pct: Math.round(wage), yrs: this.yrs(term) })
                : I18n.t('nego.sign.wageLong');
        else
            msg = I18n.t('nego.sign.sponsorOnly');
        return {
            status: 'counter', message: msg,
            counter: {
                wage: Math.min(wage, Math.max(0, Math.round(max.wage))),
                sponsor: Math.min(sponsor, Math.max(0, Math.round(max.sponsor))),
                term,
                suggestTerm,
                suggestWage: Math.min(wage, m2.wage),
                suggestSponsor: Math.min(sponsor, m2.sponsor)
            }
        };
    },

    // role the club will grant, by ability vs club reputation
    maxRoleAt(p, club) {
        const d = p.ability - (club ? club.reputation : 45);
        if (d >= 4) return 'key';
        if (d >= -1) return 'starter';
        if (d >= -8) return 'rotation';
        if (d >= -16) return 'fringe';
        return 'youth';
    },
    rolesUpTo(role) { const i = ROLE_ORDER.indexOf(role); return ROLE_ORDER.slice(0, i + 1); },
    clubHasMyPlayerAtPos(clubId, pos, excludeId) {
        return GameState.players.some(p => p.agentId === 'me' && p.id !== excludeId && p.clubId === clubId && p.position === pos);
    },

    signPlayer(p, wage, sponsor, term) {
        p.agentId = 'me'; p.wageCommission = wage; p.sponsorCommission = sponsor;
        p.repUntilSeason = GameState.seasonStartYear + term; p.repExpired = false;
        p.knownToAgent = true; p.everClient = true; p.dismissedTalent = false;
        if (!p.history) p.history = { ability: [], wage: [], fees: [] };
        recordAbilityPoint(p); recordWagePoint(p);
        Agency.bumpRep(0.3);
        p._lastAgentActionAbs = GameState.absWeek();   // the neglect clock starts fresh from day one
        // a referral arrives warm: his team-mate vouched for you, so he starts as a believer
        if (p._warmIntro) {
            if (p.morale) p.morale.agent = Math.max(p.morale.agent, 85);
            p.bond = Math.max(p.bond || 0, 12);
            delete p._warmIntro;
            GameState.addLog(I18n.t('ag.log.signWarm', { name: p.name }), 'sign');
        }
        GameState.addLog(I18n.t('ag.log.signed', { name: p.name, wage, sponsor, term }), 'sign');
    },

    // ---------- loans: interested clubs come to you ----------
    // Weight for a loan enquiry coming from `toCountry` given the player's club is in `fromCountry`.
    // Domestic dominates; neighbours are occasional; distant leagues rare. Better players (higher
    // ability) draw interest from further afield (flatter decay), but home still makes up the bulk.
    _loanCountryWeight(fromCountry, toCountry, ability) {
        if (fromCountry === toCountry) return 100;
        const d = loanCountryDist(fromCountry, toCountry);
        const scale = 2.2 + Math.max(0, (ability || 45) - 40) * 0.09;   // ~2.2 (steep) at 40, ~5.8 at 80
        return 26 * Math.exp(-d / scale);   // neighbour (d~3) -> a few; far league (d~11+) -> a fraction
    },
    // weighted sampling without replacement of `n` loan clubs, biased toward home/nearby countries
    _weightedLoanPicks(cands, fromCountry, ability, n) {
        const pool = cands.slice(), picks = [];
        while (pool.length && picks.length < n) {
            const weights = pool.map(c => Math.max(0.0005, this._loanCountryWeight(fromCountry, c.country || fromCountry, ability)));
            let total = weights.reduce((s, w) => s + w, 0), r = Rng.next() * total, idx = 0;
            for (; idx < pool.length - 1; idx++) { r -= weights[idx]; if (r <= 0) break; }
            picks.push(pool[idx]); pool.splice(idx, 1);
        }
        return picks;
    },

    requestLoan(p) {
        if (p.pendingTransfer) return { ok: false, message: I18n.t('ag.loan.pendingTransfer', { name: p.name }) };
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        if (p.onLoanAt && !isU21Loan(p)) return { ok: false, message: I18n.t('ag.alreadyAway', { name: p.name }) };
        if (this.onCooldown(p, 'loan')) return { ok: false, message: I18n.t('ag.loan.cooldown', { name: p.name }) };
        this.setCooldown(p, 'loan');
        const cands = Clubs.allClubs.filter(c => {
            if (c.id === p.clubId) return false;
            const role = this.maxRoleAt(p, c);
            if (!(role === 'key' || role === 'starter' || role === 'rotation')) return false; // must get minutes
            if (this.clubHasMyPlayerAtPos(c.id, p.position, p.id)) return false;
            return true;
        });
        if (!cands.length) {
            return { ok: false, message: I18n.t('ag.loan.noSenior', { name: p.name }) };
        }
        // the parent club must sanction the loan first
        const parent = Clubs.getClubById(p.clubId);
        // interest is weighted by geography: mostly his own country, some neighbours, rarely far away
        const parentCountry = (parent && parent.country) || GameState.homeCountry;
        const picks = this._weightedLoanPicks(cands, parentCountry, p.ability, 3 + Math.floor(Rng.next() * 2)).map(c => c.id);
        const rel = this.relationship(p.clubId);
        // clubs happily loan out youth/fringe/rotation for minutes, but a starter is a wrench and a
        // star player almost unthinkable — they're built around him, so he's kept regardless
        let sanction = 0.55 + (rel - 55) / 200 + (['youth', 'fringe', 'rotation'].includes(p.squadRole) ? 0.2 : p.squadRole === 'starter' ? -0.45 : -0.6);
        const floor = (p.squadRole === 'key' || p.squadRole === 'starter') ? 0.03 : 0.1;
        sanction = Math.max(floor, Math.min(0.95, sanction));
        if (Rng.next() > sanction) {
            this.changeRelationship(p.clubId, -1);
            GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('ag.mail.loanRefusedSubj', { club: parent ? parent.name : I18n.t('ag.hisClub'), name: p.name }), body: I18n.t('ag.mail.loanRefusedBody', { club: parent ? parent.name : I18n.t('ag.hisClub'), name: p.name }), ttl: 4 });
            return { ok: false, message: I18n.t('ag.loan.refused', { club: parent ? parent.name : I18n.t('ag.hisClub'), name: p.name }) };
        }
        p._pendingLoan = { from: GameState.absWeek() + 1, picks };
        p._loanOk = true;   // the club has sanctioned a loan — you can now also shop him out on loan to clubs of your choosing
        p.loanListed = true; // reflected as a read-only "Loan-listed" indicator on his page
        GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('ag.mail.loanOpenSubj', { club: parent ? parent.name : I18n.t('ag.hisClub'), name: p.name }), body: I18n.t('ag.mail.loanOpenBody', { club: parent ? parent.name : I18n.t('ag.hisClub'), name: p.name }), ttl: 5 });
        return { ok: true, message: I18n.t('ag.loan.sanctioned', { club: parent ? parent.name : I18n.t('ag.hisClub') }) };
    },
    _u21ClubReaction(p, clubName, dest) {
        const lines = [
            I18n.t('ag.mail.u21ok1', { name: p.name }),
            I18n.t('ag.mail.u21ok2', { name: p.name, dest }),
            I18n.t('ag.mail.u21ok3', { name: p.name, dest }),
            I18n.t('ag.mail.u21ok4', { name: p.name, dest }),
            I18n.t('ag.mail.u21ok5', { name: p.name })
        ];
        GameState.addMail({ kind: 'news', subject: I18n.t('ag.mail.onSubj', { club: clubName, name: p.name }), body: lines[Math.floor(Rng.next() * lines.length)], ttl: 3 });
    },
    _u21Consent(p) {
        const rel = this.relationship(p.clubId);
        // clubs happily send down fringe/youth players; they resist sending down players they rate/use
        let chance = 0.6 + (rel - 55) / 220
            + (['youth', 'fringe'].includes(p.squadRole) ? 0.25 : 0)
            - (['key', 'starter'].includes(p.squadRole) ? 0.30 : 0);
        return Math.max(0.08, Math.min(0.95, chance));
    },
    sendToU21(p) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        if (p.onLoanAt) return { ok: false, message: I18n.t('ag.alreadyAway', { name: p.name }) };
        if (p.age > 21) return { ok: false, message: I18n.t('ag.u21.tooOld', { name: p.name, age: p.age }) };
        if (isReserveClub(p.clubId)) return { ok: false, message: I18n.t('ag.u21.alreadyReserve', { name: p.name, club: Clubs.getClubById(p.clubId)?.name }) };
        if (this.onCooldown(p, 'u21send')) return { ok: false, message: I18n.t('ag.u21.cooldown') };
        this.setCooldown(p, 'u21send');
        const seniorName = Clubs.getClubById(p.clubId)?.name || '';
        // the club has to agree to drop him to the youth/reserve setup
        if (Rng.next() > this._u21Consent(p)) {
            this.changeRelationship(p.clubId, -1);
            const no = [
                I18n.t('ag.mail.u21no1', { name: p.name }),
                I18n.t('ag.mail.u21no2', { name: p.name }),
                I18n.t('ag.mail.u21no3', { name: p.name })
            ];
            GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('ag.mail.onSubj', { club: seniorName, name: p.name }), body: no[Math.floor(Rng.next() * no.length)], ttl: 4 });
            return { ok: false, message: I18n.t('ag.u21.refused', { club: seniorName, name: p.name }) };
        }
        const reserve = reserveClubFor(p.clubId);
        if (reserve) {
            p.onLoanAt = reserve.id; p.loanUntilSeason = GameState.seasonStartYear; p.loanMid = false; p.loanRole = 'starter';
            GameState.addLog(I18n.t('ag.log.sentReserves', { name: p.name, club: reserve.name }), 'loan');
            this._u21ClubReaction(p, seniorName, reserve.name);
            return { ok: true, message: I18n.t('ag.u21.joinedReserve', { name: p.name, club: reserve.name }) };
        }
        p.onLoanAt = 'u21:' + p.clubId; p.loanUntilSeason = GameState.seasonStartYear; p.loanMid = false; p.loanRole = 'starter';
        const jong = youthTeamName(p.clubId);
        GameState.addLog(I18n.t('ag.log.sentJong', { name: p.name, club: jong }), 'loan');
        this._u21ClubReaction(p, seniorName, jong);
        return { ok: true, message: I18n.t('ag.u21.joinedJong', { name: p.name, club: jong }) };
    },
    // Sub-professional youth wage: below this, a promotion earns a proper first-team contract; at or
    // above it he's already on pro money and is simply pulled up on his existing deal.
    PRO_WAGE_FLOOR: 2000,
    // Move a client up to the senior squad. Returns { pro, wage } describing whether a new professional
    // contract was handed out (only when he was on a sub-professional youth wage).
    _promoteToSenior(p, parent) {
        const wasWage = p.wage || 0;
        p.clubId = parent.id; p.clubTierAtJoin = parent.tier;
        p.onLoanAt = null; p.loanUntilSeason = null; p.loanMid = false; p.loanRole = null; p._loanOk = false;
        p.squadRole = 'fringe';
        if (wasWage < this.PRO_WAGE_FLOOR) {
            const pro = Math.max(2500, this.offeredWage(p, parent, { loyalty: false, jitter: false }));
            p.wage = pro; p.contractUntilSeason = GameState.seasonStartYear + 2;
            if (p.agentId === 'me' && typeof recordWagePoint === 'function') recordWagePoint(p);
            // his first professional contract is a life moment, not just a ledger entry
            if (p.agentId === 'me' && typeof Dialogue !== 'undefined') Dialogue.queueMoment({ type: 'procontract', playerId: p.id });
            return { pro: true, wage: pro };
        }
        return { pro: false, wage: wasWage };
    },
    // a client at a reserve side can ask to be pulled up to the senior team — possible any time of
    // year (an internal move within the same club family, nothing to do with the transfer window)
    requestPromotion(p) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        if (!isReserveClub(p.clubId)) return { ok: false, message: I18n.t('ag.promote.notReserve', { name: p.name }) };
        if (p.onLoanAt) return { ok: false, message: I18n.t('ag.promote.away', { name: p.name }) };
        const parent = parentClubForReserve(p.clubId);
        if (!parent) return { ok: false, message: I18n.t('ag.promote.noParent', { club: Clubs.getClubById(p.clubId)?.name }) };
        const res = this._promoteToSenior(p, parent);
        GameState.addLog(I18n.t('ag.log.promoted', { name: p.name, club: parent.name, pro: res.pro ? I18n.t('ag.log.promotedPro', { wage: UI.money(res.wage) }) : '' }), 'sign');
        GameState.addMail({
            kind: 'news', cat: 'general', subject: I18n.t('ag.mail.promoteSubj', { club: parent.name, name: p.name }),
            body: res.pro
                ? I18n.t('ag.mail.promoteBodyPro', { club: parent.name, name: p.name, wage: UI.money(res.wage) })
                : I18n.t('ag.mail.promoteBodyNoPro', { club: parent.name, name: p.name }), ttl: 4
        });
        return {
            ok: true, message: res.pro
                ? I18n.t('ag.promote.donePro', { name: p.name, club: parent.name, wage: UI.money(res.wage) })
                : I18n.t('ag.promote.doneNoPro', { name: p.name, club: parent.name })
        };
    },
    // ask the parent club to pull a player back up from the U21/reserves early (e.g. to loan him out properly)
    requestU21Recall(p) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        if (!p.onLoanAt || !(isU21Loan(p) || isReserveClub(p.onLoanAt))) return { ok: false, message: I18n.t('ag.recall.notYouth', { name: p.name }) };
        if (this.onCooldown(p, 'u21recall')) return { ok: false, message: I18n.t('ag.recall.cooldown') };
        this.setCooldown(p, 'u21recall');
        const club = Clubs.getClubById(p.clubId);
        const dest = Clubs.getClubById(p.onLoanAt);
        const destName = dest ? dest.name : youthTeamName(p.clubId);
        const clubName = club ? club.name : I18n.t('ag.hisClub');
        const rel = this.relationship(p.clubId);
        let chance = 0.35 + (rel - 55) / 200 + (['starter', 'key'].includes(p.squadRole) ? 0.15 : -0.1);
        chance = Math.max(0.08, Math.min(0.85, chance));
        if (Rng.next() < chance) {
            p.onLoanAt = null; p.loanUntilSeason = null; p.loanMid = false; p.loanRole = null;
            p.squadRole = 'fringe';
            // stepping up from the youth side on a sub-professional wage earns a proper first-team deal;
            // one already on pro money is just pulled up as he is
            let proNote = '';
            if ((p.wage || 0) < this.PRO_WAGE_FLOOR && club) {
                const pro = Math.max(2500, this.offeredWage(p, club, { loyalty: false, jitter: false }));
                p.wage = pro; p.contractUntilSeason = GameState.seasonStartYear + 2;
                if (p.agentId === 'me' && typeof recordWagePoint === 'function') recordWagePoint(p);
                if (p.agentId === 'me' && typeof Dialogue !== 'undefined') Dialogue.queueMoment({ type: 'procontract', playerId: p.id });
                proNote = I18n.t('ag.recall.proNote', { amt: UI.money(pro) });
            }
            GameState.addLog(I18n.t('ag.log.recalled', { club: clubName, name: p.name, dest: destName, pro: proNote }), 'info');
            GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('ag.mail.recallSubj', { club: clubName, name: p.name }), body: I18n.t('ag.mail.recallBody', { club: clubName, name: p.name, dest: destName, pro: proNote }), ttl: 4 });
            return { ok: true, message: I18n.t('ag.recall.done', { club: clubName, name: p.name, dest: destName, pro: proNote }) };
        }
        this.changeRelationship(p.clubId, -1);
        return { ok: false, message: I18n.t('ag.recall.declined', { club: clubName, name: p.name, dest: destName }) };
    },
    // loan duration options depend on the open window (summer: any; winter: half-steps only).
    // Pass the player to also drop any duration that would run past his parent-club contract
    // (e.g. a 2-season loan when only 1 season remains on his deal) - he can't be out on loan
    // longer than he's actually contracted to the club doing the loaning.
    loanDurationOptions(p) {
        const w = GameState.week;
        let opts;
        if (w >= 1 && w <= 6) opts = [{ code: '0.5', label: 'Half season' }, { code: '1', label: '1 season' }, { code: '1.5', label: '1.5 seasons' }, { code: '2', label: '2 seasons' }];
        else if (w >= 28 && w <= 33) opts = [{ code: '0.5', label: 'Rest of season' }, { code: '1.5', label: '1.5 seasons' }];
        // loans can be arranged any time of year — offer sensible defaults outside the main windows
        else if (w >= 48) opts = [{ code: '1', label: 'Next season' }, { code: '2', label: '2 seasons' }];
        else opts = [{ code: '0.5', label: 'Rest of season' }, { code: '1.5', label: 'Through next season' }];
        if (p && p.contractUntilSeason != null) opts = opts.filter(o => this.computeLoanEnd(o.code).until < p.contractUntilSeason);
        return opts;
    },
    // localized label for a licence/loan duration option ('dur.<slug>'), falling back to the English label
    DUR_SLUG: { '1 season': 's1', '2 seasons': 's2', '3 seasons': 's3', 'Half season': 'half', '1.5 seasons': 's15', 'Rest of season': 'rest', 'Next season': 'next', 'Through next season': 'through' },
    durLabel(en) {
        const slug = this.DUR_SLUG[en];
        if (!slug || typeof I18n === 'undefined') return en;
        const s = I18n.t('dur.' + slug);
        return s === 'dur.' + slug ? en : s;
    },
    // localized "N year"/"N years" count phrase
    yrs(n) { return I18n.t(n === 1 ? 'unit.yr' : 'unit.yrs', { n }); },
    // returns { until, mid } describing when the loan ends
    computeLoanEnd(code) {
        const Y = GameState.seasonStartYear, w = GameState.week, summer = (w >= 1 && w <= 6);
        if (summer) {
            if (code === '0.5') return { until: Y, mid: true };       // ends winter of this season
            if (code === '1') return { until: Y, mid: false };        // ends at next summer
            if (code === '1.5') return { until: Y + 1, mid: true };   // ends winter of next season
            return { until: Y + 1, mid: false };                      // 2 seasons
        }
        // winter window
        if (code === '0.5') return { until: Y, mid: false };          // rest of this season
        return { until: Y + 1, mid: false };                          // 1.5 seasons
    },
    _findLoanClub(p, parent) {
        // clubs a rung or two below the parent that would actually give him a role; may be none
        const pool = Clubs.allClubs.filter(c => c.id !== parent.id && c.reputation <= parent.reputation + 2 && ROLE_ORDER.indexOf(this.maxRoleAt(p, c)) >= ROLE_ORDER.indexOf('fringe'));
        if (!pool.length) return null;
        // weighted toward the parent club's own country and its neighbours (item: domestic loans)
        const parentCountry = (parent && parent.country) || GameState.homeCountry;
        return this._weightedLoanPicks(pool, parentCountry, p.ability, 1)[0] || null;
    },

    // ---------- shop player to ANY club, in any country ----------
    shopPlayer(p, targetClubId) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        // out on loan (or with the reserves): nobody talks about a permanent move until he's back
        if (p.onLoanAt) return { ok: false, message: I18n.t('ag.shop.awayLoan', { name: p.name, club: UI.clubName ? UI.clubName(p.onLoanAt) : I18n.t('ag.anotherClub') }) };
        const parent = Clubs.getClubById(p.clubId);
        const target = Clubs.getClubById(targetClubId);
        if (!target) return { ok: false, message: I18n.t('ag.unknownClub') };
        if (target.id === p.clubId) return { ok: true, interested: false, message: I18n.t('ag.alreadyHave', { target: target.name }) };
        if (this.onCooldown(p, 'shop:' + target.id)) return { ok: false, message: I18n.t('ag.shop.cooldown', { target: target.name, name: p.name }) };
        this.setCooldown(p, 'shop:' + target.id);

        const potRead = p.potential + Math.round((Rng.next() - 0.5) * 16);
        const perceived = p.ability + 0.5 * Math.max(0, potRead - p.ability);
        // a transfer-listed player is explicitly up for sale — shopping him around is
        // exactly what the club expects an agent to do, so it never offends them. Only
        // shopping a player who ISN'T listed (going behind the club's back) risks it.
        const discovered = !p.transferListed && Rng.next() < 0.5;
        let msg = '';
        if (discovered && parent) { this.changeRelationship(parent.id, -15); msg += `${parent.name} found out and feels betrayed (relationship −15). `; }

        const free = this.isFreeAgent(p);
        // A FREE AGENT has no fee — a club that can't take him on can't afford his WAGES, not a fee.
        // Even then most clubs will still table a low-wage contract rather than walk away; only a minority
        // decide the wages are out of reach and pass entirely.
        const wageTight = free && this.offeredWage(p, target, { loyalty: false, jitter: false }) > this.maxClubWage(p, target);
        // Affordability only bites at the very top of the market: below 94 ability essentially every
        // club that rates him can fund the deal (superclubs have near-bottomless wallets, see buyerMaxFee).
        const canPriceOut = p.ability >= 94;
        // even the friendliest fee estimate is beyond what this club/league can fund (permanent deals only)
        if (!free && canPriceOut && this.playerValue(p) * 0.6 > this.buyerMaxFee(target)) {
            return { ok: true, interested: false, message: msg + `${target.name} rate him but can't afford the fee.` };
        }
        // not good enough right now to dislodge their current XI
        if (perceived < target.reputation - 6) {
            return { ok: true, interested: false, message: msg + `${target.name} say they don't need a player like ${p.name} right now.` };
        }
        if (wageTight && canPriceOut && Rng.next() < 0.3) {
            return { ok: true, interested: false, message: msg + `${target.name} like ${p.name} but can't afford his wages.` };
        }
        // most clubs pass — only a minority bite on any given pitch. Being persistent (re-shopping
        // week after week) gives fresh rolls, so a club can still come round; blanket-pitching a whole
        // division no longer floods you with offers. Transfer-listed players draw a little more interest.
        const biteChance = p.transferListed ? 0.42 : 0.30;
        if (Rng.next() >= biteChance) return { ok: true, interested: false, message: msg + `${target.name} didn't bite this time.` };

        // a stage-2+ club case means he's publicly known to want out — the club's own asking
        // price softens too (a smaller cut than the incoming-bid discount, since this is the
        // agent choosing to sell rather than the market pricing in his unhappiness)
        let fee = free ? 0 : this.estimateFee(p, target, { skipCaseDiscount: true });
        if (!free && p.moraleCase && p.moraleCase.dim === 'club' && p.moraleCase.stage >= 2) {
            fee = Math.max(500, Math.round(fee * MORALE.STAGE2_CLUB_ASK_MULT / 500) * 500);
        }
        const offer = this._offerObj(p, parent ? parent.id : null, target.id, fee, { initiatedByAgent: true });
        // a wage-tight club that still bites offers what it CAN pay — a low-wage contract
        if (wageTight) offer.proposedWage = Math.max(30, Math.round(this.maxClubWage(p, target) * (0.85 + Rng.next() * 0.1) / 10) * 10);
        GameState.addMail({ kind: 'transfer', subject: free ? I18n.t('ag.mail.offerContractSubj', { target: target.name, name: p.name }) : I18n.t('ag.mail.offerWantSubj', { target: target.name, name: p.name }), offer, persistence: 1, ttl: 2 });
        GameState.addLog(free ? I18n.t('ag.log.offerFree', { target: target.name, name: p.name, wage: UI.money(offer.proposedWage) }) : I18n.t('ag.log.offerFee', { target: target.name, fee: UI.money(fee), name: p.name }), 'offer');
        const tail = free ? `offering €${UI.money(offer.proposedWage)}/wk${wageTight ? ' (a reduced deal — his usual wages are a stretch for them)' : ''}` : `offer in your inbox (€${UI.money(fee)})`;
        return { ok: true, interested: true, message: msg + `${target.name} are interested — ${tail}.` };
    },

    // whether the "loan" mode is available in Shop-to-clubs: the parent club must first have
    // sanctioned a loan (via requestLoan), and he can't already be out or mid-transfer.
    canLoanShop(p) { return this.isClient(p) && !p.pendingTransfer && !(p.onLoanAt && !isU21Loan(p)) && !!p._loanOk; },

    // ---------- shop player OUT ON LOAN to a chosen club ----------
    shopPlayerLoan(p, targetClubId) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        if (p.pendingTransfer) return { ok: false, message: I18n.t('ag.loanShop.pendingTransfer', { name: p.name }) };
        if (p.onLoanAt && !isU21Loan(p)) return { ok: false, message: I18n.t('ag.loanShop.alreadyOut', { name: p.name }) };
        if (!p._loanOk) return { ok: false, message: I18n.t('ag.loanShop.notSanctioned', { club: Clubs.getClubById(p.clubId)?.name || I18n.t('ag.hisClub') }) };
        const target = Clubs.getClubById(targetClubId);
        if (!target) return { ok: false, message: I18n.t('ag.unknownClub') };
        if (target.id === p.clubId) return { ok: true, interested: false, message: I18n.t('ag.alreadyHave', { target: target.name }) };
        if (this.clubHasMyPlayerAtPos(target.id, p.position, p.id)) return { ok: true, interested: false, message: I18n.t('ag.loanShop.samePos', { target: target.name }) };
        if (this.onCooldown(p, 'loanshop:' + target.id)) return { ok: false, message: I18n.t('ag.loanShop.cooldown', { target: target.name, name: p.name }) };
        this.setCooldown(p, 'loanshop:' + target.id);
        const role = this.maxRoleAt(p, target);
        if (!(role === 'key' || role === 'starter' || role === 'rotation'))
            return { ok: true, interested: false, message: I18n.t('ag.loanShop.noGameTime', { target: target.name, name: p.name }) };
        // loans bite a little more readily than permanent deals (lower commitment), but still selective
        if (Rng.next() >= 0.42) return { ok: true, interested: false, message: I18n.t('ag.loanShop.passed', { target: target.name, name: p.name }) };
        if (GameState.inbox.find(m => m.kind === 'loan' && m.offer.playerId === p.id && m.offer.toClubId === target.id))
            return { ok: true, interested: false, message: I18n.t('ag.loanShop.existing', { target: target.name, name: p.name }) };
        GameState.addMail({ kind: 'loan', subject: I18n.t('ag.mail.loanWantSubj', { target: target.name, name: p.name }), offer: { playerId: p.id, fromClubId: p.clubId, toClubId: target.id, role }, persistence: 0, ttl: 3 });
        GameState.addLog(I18n.t('ag.log.loanEnquiry', { target: target.name, name: p.name }), 'offer');
        return { ok: true, interested: true, message: I18n.t('ag.loanShop.want', { target: target.name, name: p.name }) };
    },

    // ---------- contract renewal request (to parent club) ----------
    requestRenewalTalks(p) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        const club = Clubs.getClubById(p.clubId);
        if (!club) return { ok: false, message: I18n.t('ag.noClub') };
        if (this.onCooldown(p, 'renewal')) return { ok: false, message: I18n.t('ag.renew.cooldown', { club: club.name }) };
        this.setCooldown(p, 'renewal');
        // a stage-2+ wage case means he's formally demanded this renewal — a refusal now visibly
        // sours his view of the club, on top of the normal rejection
        const wageCaseOpen = p.moraleCase && p.moraleCase.dim === 'wage' && p.moraleCase.stage >= 2;
        const refuse = (msg) => { if (wageCaseOpen) p.morale.club = Math.max(0, p.morale.club + MORALE.STAGE2_WAGE_CLUB_PENALTY); return { ok: false, message: msg }; };
        const seasonsLeft = (p.contractUntilSeason ?? GameState.seasonStartYear) - GameState.seasonStartYear;
        if (seasonsLeft > 2 && Rng.next() < 0.7) return refuse(`${club.name} won't talk — plenty of contract left.`);
        if (p.squadRole === 'fringe' && Rng.next() < 0.5) return refuse(`${club.name} aren't planning with ${p.name}.`);
        // a renewal reflects loyalty and recent form, not just the ability bracket — a long-serving,
        // in-form player is due a real bump, not the +€10 the flat bracket used to hand back
        const proposedWage = Math.max(p.wage + 10, this.offeredWage(p, club, { loyalty: true, jitter: false }));
        const proposedTermSeasons = Math.min(2 + Math.floor(Rng.next() * 2), this.maxContractTerm(p, club));
        const offer = { playerId: p.id, clubId: club.id, proposedWage, proposedTermSeasons };
        GameState.addMail({ kind: 'renewal', subject: I18n.t('ag.mail.renewalSubj', { name: p.name, club: club.name }), offer, persistence: 0, ttl: 3 });
        return { ok: true, message: I18n.t('ag.renew.open', { club: club.name }) };
    },

    // How much a raw ability-to-potential gap should move a price, scaled down for low-ability
    // players. An ability-24 kid with a 30-point gap to his cap is a hopeful punt — nobody has
    // seen him do anything yet — while an ability-60 player with the same gap has already shown
    // he can perform; the same gap shouldn't buy the same premium. Full weight from ability 60 up
    // (roughly "good enough to matter" on the game's own ability bands), tapering below that.
    potentialConfidence(ability) {
        return Math.max(0.3, Math.min(1, ability / 60));
    },
    // a wonderkid worth a huge fee should command a wage to match, not just one set by his current ability:
    // the same potential-gap/age logic behind playerValue(), scaled down to a sane wage multiplier
    wagePotentialFactor(p) {
        const potGap = Math.max(0, (p.potential || p.ability) - p.ability);
        const potWeight = p.age <= 21 ? 1.3 : p.age <= 25 ? 0.8 : p.age <= 28 ? 0.4 : 0.15;
        return 1 + potGap * 0.06 * potWeight * this.potentialConfidence(p.ability);
    },

    // ---------- wage market factors (loyalty · form · country · youth caps) ----------
    // The most recent MEANINGFUL season average — the current one once it has real minutes, else the
    // last completed campaign. Drives both the performance wage bonus and the higher-value transfer pull.
    recentSeasonRating(p) {
        const y = GameState.seasonStartYear;
        const cur = seasonTotals(p, y);
        if (cur.apps >= 10) return cur.avg;
        const prev = seasonTotals(p, y - 1);
        if (prev.apps >= 10) return prev.avg;
        return cur.apps > 0 ? cur.avg : (prev.avg || 0);
    },
    // A season of >8.00 is worth +60% wage, >7.50 +25%, >7.24 +10% (each tier, nothing below).
    perfWageMult(p) {
        const r = this.recentSeasonRating(p);
        return r > 8.00 ? 1.60 : r > 7.50 ? 1.25 : r > 7.24 ? 1.10 : 1;
    },
    // In form also lifts a player's market value and the bids he draws — up to +25%.
    perfValueMult(p) {
        const r = this.recentSeasonRating(p);
        return r > 8.00 ? 1.25 : r > 7.50 ? 1.15 : r > 7.24 ? 1.08 : 1;
    },
    // Loyalty: +5% per season at the club, growing until 32; from 33 on it sheds 15 points a year down
    // to a 5%-above-normal floor. Only meaningful when re-signing at the SAME club.
    loyaltyMult(p) {
        const years = (typeof Sim !== 'undefined' && Sim._seasonsAtClub) ? Sim._seasonsAtClub(p) : 0;
        let bonus = 0.05 * years;
        if (p.age > 32 && bonus > 0) bonus = Math.max(0.05, bonus - 0.15 * (p.age - 32));
        return 1 + Math.max(0, bonus);
    },
    // Country pay tendency, with a per-offer jitter so it's a likelihood rather than a fixed law: an
    // English suitor USUALLY outpays a Portuguese one for the same player, but not on literally every bid.
    countryWageMult(club, jitter) {
        let m = (club && COUNTRY_WAGE_MULT[club.country]) || 1;
        if (jitter) m *= 0.9 + Rng.next() * 0.28;
        return m;
    },
    // The wage a club would put on the table for `p`: ability/reputation base × wonderkid premium ×
    // country tendency × recent-form bonus × (loyalty, only when re-signing) — then teenage caps.
    offeredWage(p, club, opts = {}) {
        const rep = club ? club.reputation : 45;
        let w = PlayerGen.wageFor(p.ability, rep) * this.wagePotentialFactor(p);
        w *= this.countryWageMult(club, opts.jitter !== false);
        w *= this.perfWageMult(p);
        if (opts.loyalty && club && p.clubId === club.id) w *= this.loyaltyMult(p);
        w = PlayerGen.capYouthWage(w, p.age, rep, p.potential);
        return Math.max(30, Math.round(w / 10) * 10);
    },
    // club willingness to pay wage (for renewal/transfer negotiation)
    maxClubWage(p, club) {
        const rep = club ? club.reputation : 45;
        let base = PlayerGen.wageFor(p.ability, rep) * 1.6 * this.wagePotentialFactor(p);   // clear room to push the wage up
        base *= this.countryWageMult(club, false) * this.perfWageMult(p);                   // country tendency + recent form
        if (club && p.clubId === club.id) base *= this.loyaltyMult(p);                      // long service pays, when he stays
        base *= 1 + Math.max(-0.08, Math.min(0.25, (this.relationship(club ? club.id : null) - 55) / 220));
        base = PlayerGen.capYouthWage(base, p.age, rep, p.potential);
        return Math.round(base / 10) * 10;
    },
    // clubs won't lock up an ageing player for years — unless he clearly outclasses the level he's at
    // Longest deal a club will offer, by the role the player would hold THERE and his age.
    // Importance beats age: a star gets any length anywhere, and a 34-year-old fringe body at
    // Bayern can still sign long at a club where he'd be the main man. Under 32 nobody is
    // age-capped at all.
    maxContractTerm(p, club) {
        const role = this.maxRoleAt(p, club);
        if (role === 'key') return 6;                    // stars are never age-capped
        if (p.age <= 31) return 6;
        if (role === 'starter' || role === 'rotation') return p.age === 32 ? 4 : p.age === 33 ? 3 : 2;   // 34+ -> 2
        return p.age === 32 ? 3 : p.age === 33 ? 2 : 1;  // fringe/youth: 34+ -> 1
    },
    contractSeasonsLeft(p) { return (p.contractUntilSeason != null ? p.contractUntilSeason : GameState.seasonStartYear) - GameState.seasonStartYear; },
    isFreeAgent(p) { return !!p.freeAgent || p.clubId == null; },
    // Bosman: once the winter window shuts in a player's final contract season, other clubs can agree a
    // free pre-contract and he moves for nothing. Before that he still commands a fee; after the season
    // rolls over he'd be a plain free agent anyway once the deal lapses.
    isPreContractFree(p) {
        return !!p && !this.isFreeAgent(p) && p.contractUntilSeason != null
            && p.contractUntilSeason <= GameState.seasonStartYear && GameState.week > 33;
    },
    // pick a bidding club, strongly preferring the player's own country; cross-border bids are
    // rare and rarer the lower the player's level (Urk bids for a TEC player far sooner than Carlisle)
    pickBuyer(cands, p) {
        if (!cands || !cands.length) return null;
        const home = (Clubs.getClubById(p.clubId) || {}).country || p._lastCountry || null;
        if (!home) return cands[Math.floor(Rng.next() * cands.length)];
        const same = cands.filter(c => c.country === home);
        const cross = cands.filter(c => c.country !== home);
        const crossProb = Math.max(0.02, Math.min(0.35, ((p.ability || 50) - 45) / 120));
        let pool;
        if (same.length && cross.length) pool = (Rng.next() < crossProb) ? cross : same;
        else pool = same.length ? same : cross;
        return pool[Math.floor(Rng.next() * pool.length)];
    },

    // greeting reflects how the club feels about you
    greetingFor(clubId) {
        const rel = this.relationship(clubId);
        if (rel >= 75) return I18n.t('nego.greet.warm');
        if (rel >= 55) return I18n.t('nego.greet.friendly');
        if (rel >= 35) return I18n.t('nego.greet.neutral');
        if (rel >= 18) return I18n.t('nego.greet.cool');
        return I18n.t('nego.greet.cold');
    },
    // wage the club will accept depends on player value AND your relationship; no hard ceiling shown to you.
    // `neg` is the persisted patience/threat state (see initNeg), created lazily and mutated in place.
    negotiateWage(p, club, requested, neg) {
        const base = this.maxClubWage(p, club);
        neg = this.initNeg(neg, club, base);
        // a club never goes back on its own word: anything at or below the counter it offered
        // last round is a done deal (the per-round patience penalty used to shrink the cap
        // below the club's own previous counter, producing a 650 -> 640 -> 630... death spiral)
        if (neg.lastCounter != null && requested <= neg.lastCounter)
            return { status: 'accept', neg, message: I18n.t('nego.wage.acceptDiscussed', { amt: UI.money(requested) }) };
        const rel = this.relationship(club ? club.id : null);
        const room = base * (1 + Math.max(-0.10, Math.min(0.45, (rel - 55) / 110)));   // a bit more give than before
        const cap = Math.round(room) - (neg.round - 1) * Math.round(p.wage * 0.03);
        if (requested <= cap) return { status: 'accept', neg, message: neg.round === 1 ? I18n.t('nego.wage.acceptR1', { amt: UI.money(requested) }) : I18n.t('nego.wage.acceptRn', { amt: UI.money(requested) }) };

        // the club had to push back — record it and lose patience; at the ceiling it walks
        neg.history.push({ w: requested, f: 0 });
        const walk = this.bumpThreat(neg, club);
        const counter = Math.max(p.wage, Math.round(cap / 10) * 10, neg.lastCounter || 0);
        neg.lastCounter = counter;
        if (walk) {
            this.changeRelationship(club.id, neg._ultimatum ? -15 : NEGO.WALKOUT_REL);
            return { status: 'walkout', neg, message: I18n.t('nego.wage.walkout', { name: p.name }) };
        }
        // Pass 3: renewals stay NEUTRAL; a data line for this band replaces the generic counter where authored
        const band = this.threatBand(neg.threat);
        const flavor = this.negLine('NEUTRAL', band, 'renewal', { amt: UI.money(counter) });
        if (requested <= cap * 1.12) return { status: 'counter', counter, neg, message: I18n.t('nego.wage.close', { amt: UI.money(counter) }) };
        return { status: 'counter', counter, neg, message: flavor || (requested > cap * 1.5 ? I18n.t('nego.wage.counterHigh', { amt: UI.money(counter) }) : I18n.t('nego.wage.counter', { amt: UI.money(counter) })) };
    },
    // negotiate loan game time: ask above the club's comfort level and they may dig in — or, with a good
    // relationship and persistence, eventually relent. Sometimes they stay stubborn.
    negotiateLoanRole(p, club, requested, round = 1) {
        const ceil = this.clubRoleCeiling(p, club);
        const reqIdx = ROLE_ORDER.indexOf(requested), ceilIdx = ROLE_ORDER.indexOf(ceil);
        if (reqIdx <= ceilIdx) return { status: 'accept', role: requested, message: I18n.t('nego.loanRole.accept', { name: p.name, role: roleLabel(requested, p.age, p.position) }) };
        const rel = this.relationship(club ? club.id : null);
        const concede = Math.max(0, Math.min(0.85, 0.12 + (rel - 55) / 200 + (round - 1) * 0.22 - (reqIdx - ceilIdx - 1) * 0.28));
        if (Rng.next() < concede) return { status: 'accept', role: requested, message: I18n.t('nego.loanRole.relent', { name: p.name, role: roleLabel(requested, p.age, p.position) }) };
        if (round >= 4) return { status: 'final', role: ceil, message: I18n.t('nego.loanRole.final', { role: roleLabel(ceil, p.age, p.position), name: p.name }) };
        return { status: 'counter', role: ceil, message: I18n.t('nego.loanRole.counter', { name: p.name, role: roleLabel(ceil, p.age, p.position), reqRole: roleLabel(requested, p.age, p.position) }) };
    },
    // ask the club to transfer-list your player; they may agree (more offers) or keep him
    requestTransferListing(p) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        if (p.onLoanAt) return { ok: false, message: I18n.t('ag.txlist.away', { name: p.name }) };
        const club = Clubs.getClubById(p.clubId);
        if (!club) return { ok: false, message: I18n.t('ag.txlist.noClub', { name: p.name }) };
        if (p.transferListed) return { ok: false, message: I18n.t('ag.txlist.already', { name: p.name }) };
        if (this.onCooldown(p, 'txlist')) return { ok: false, message: I18n.t('ag.txlist.cooldown', { club: club.name }) };
        this.setCooldown(p, 'txlist');
        const rel = this.relationship(club.id);
        const surplus = club.reputation - p.ability;     // >0 => player below club level (easier to release)
        let chance = 0.35 + surplus * 0.03 + (rel - 55) / 250
            + (['youth', 'fringe'].includes(p.squadRole) ? 0.15 : 0)
            - (['key', 'starter'].includes(p.squadRole) ? 0.20 : 0);
        // C2: a club that isn't building around him (fringe/youth — the same standing on which it refuses
        // a renewal, "not in our plans") has no grounds to call him too important to list. So listing him
        // is all but guaranteed for those roles — the two stances can't contradict each other.
        if (['youth', 'fringe'].includes(p.squadRole)) chance = Math.max(chance, 0.9);
        chance = Math.max(0.05, Math.min(0.95, chance));
        if (Rng.next() < chance) {
            p.transferListed = true;
            p._txOffersFrom = GameState.absWeek() + 1;
            GameState.addLog(I18n.t('ag.log.txlistAgreed', { club: club.name, name: p.name }), 'info');
            GameState.addMail({ kind: 'news', subject: I18n.t('ag.mail.txlistSubj', { name: p.name }), body: I18n.t('ag.mail.txlistBody', { club: club.name, name: p.name }), ttl: 5 });
            return { ok: true, message: I18n.t('ag.txlist.agreed', { club: club.name, name: p.name }) };
        }
        this.changeRelationship(club.id, -1);
        return { ok: false, message: I18n.t('ag.txlist.refused', { club: club.name, name: p.name }) };
    },
    // highest role the club will hand this player (relationship nudges it by up to one step)
    clubRoleCeiling(p, club) {
        const base = this.maxRoleAt(p, club);
        const rel = this.relationship(club ? club.id : null);
        let idx = ROLE_ORDER.indexOf(base);
        if (rel >= 80 && idx < ROLE_ORDER.length - 1) idx += 1;     // a great relationship earns a little extra
        return ROLE_ORDER[idx];
    },
    roleAcceptable(p, club, role) {
        if (!role) return true;
        return ROLE_ORDER.indexOf(role) <= ROLE_ORDER.indexOf(this.clubRoleCeiling(p, club));
    },
    // largest signing bonus the club will stomach. On a TRANSFER this is an agent's fee that scales with the
    // transfer fee (up to €5m); for renewals (no transferFee passed) it stays the modest wage-based figure.
    clubBonusWillingness(p, club, wage, transferFee) {
        const rel = this.relationship(club ? club.id : null);
        const fit = p.ability - (club ? club.reputation : 45);
        const f = Math.max(0.08, Math.min(1, 0.42 + fit / 60 + (rel - 55) / 280));
        if (transferFee != null) {
            const cap = Math.max(this.maxSigningBonus(p, wage), this.agentFeeCap(transferFee));
            return Math.round(cap * f / 1000) * 1000;
        }
        const fair = this.maxSigningBonus(p, wage);
        return Math.round(fair * f / 10) * 10;
    },

    // ---------- transfer commission ----------
    maxTransferCommission(p) {
        const lev = GameState.agency.reputation - p.ability;
        return Math.max(0, Math.min(15, Math.round(5 + lev * 0.5)));
    },
    // agent signing bonus on a transfer: at most one-tenth of the player's annual wage
    maxSigningBonus(p, wage) { return Math.round((wage != null ? wage : p.wage) * 52 / 10); },

    // commission is FIXED at what you originally negotiated. You agree wage, role, term and your signing bonus.
    // the club weighs the WHOLE package (wage, role, term, signing bonus) at once and answers with one improved counter.
    // `neg` is the persisted patience/threat state (see initNeg); it is created lazily and mutated in place.
    evaluateTransfer(p, club, pkg, neg) {
        const term = Math.max(1, Math.min(6, pkg.term || 3));
        const termFactor = 1 + (3 - term) * 0.05;                 // a shorter deal -> they'll stretch the wage
        const baseMaxWage = Math.round(this.maxClubWage(p, club) * termFactor / 10) * 10;
        const roleCeil = this.clubRoleCeiling(p, club);
        const roleOk = ROLE_ORDER.indexOf(pkg.role) <= ROLE_ORDER.indexOf(roleCeil);
        const feeCeil = this.clubBonusWillingness(p, club, Math.min(pkg.wage, baseMaxWage), pkg.fee);

        neg = this.initNeg(neg, club, baseMaxWage);
        neg.history.push({ w: pkg.wage, f: pkg.bonus || 0 });     // recorded before we classify this round
        const cls = this.classifyOffer(p, club, pkg, neg);
        neg.profile = cls.profile;
        neg.profileMod = this.profileMod(cls.profile);

        // Champion generosity (Part C): waive the fee to push the player's wage and the club flexes the pool
        const maxWage = cls.profile === 'Champion' ? Math.round(baseMaxWage * 1.08 / 10) * 10 : baseMaxWage;
        // KEYSTONE (A.1): the agent fee is amortized over the deal and eats into the wage room —
        // one implicit budget, so asking a fat fee visibly lowers the wage the club will accept.
        const feeAnnual = (pkg.bonus || 0) / term;
        const wageFloor = Math.max(30, p.wage || 30);
        const effMaxWage = Math.round(Math.max(wageFloor, maxWage - NEGO.FEE_TO_WAGE * feeAnnual / 52) / 10) * 10;
        const wageOk = pkg.wage <= effMaxWage, bonusOk = (pkg.bonus || 0) <= feeCeil;
        const counter = { wage: Math.min(pkg.wage, effMaxWage), role: roleOk ? pkg.role : roleCeil, term, bonus: Math.min(pkg.bonus || 0, feeCeil) };

        if (wageOk && roleOk && bonusOk) {
            const lines = [I18n.t('nego.tr.accept1', { name: p.name }), I18n.t('nego.tr.accept2', { name: p.name }), I18n.t('nego.tr.accept3')];
            return { status: 'accept', counter, neg, message: lines[Math.floor(Rng.next() * lines.length)] };
        }

        // the club had to push back — it loses patience; at the ceiling it walks. Walking away from an
        // ultimatum the club had already spelled out stings a little less than a cold walkout.
        if (this.bumpThreat(neg, club)) {
            this.changeRelationship(club.id, neg._ultimatum ? -15 : NEGO.WALKOUT_REL);
            return { status: 'walkout', counter, neg, message: I18n.t('nego.tr.walkout', { name: p.name }) };
        }

        const bits = [];
        if (!wageOk) bits.push(I18n.t('nego.tr.bitWage', { req: UI.money(pkg.wage), max: UI.money(effMaxWage) }));
        if (!roleOk) bits.push(I18n.t('nego.tr.bitRole', { ceil: roleLabel(roleCeil, p.age, p.position), role: roleLabel(pkg.role, p.age, p.position) }));
        if (!bonusOk) bits.push(I18n.t('nego.tr.bitBonus', { bonus: UI.money(pkg.bonus || 0), max: UI.money(feeCeil) }));
        const hint = (!wageOk && term > 1) ? I18n.t('nego.tr.hint') : '';
        const vars = { bits: bits.join('; '), hint, wage: UI.money(counter.wage), role: roleLabel(counter.role, p.age, p.position), term, bonus: UI.money(counter.bonus) };
        // out of patience -> a take-it-or-leave-it final package instead of another soft counter
        if (this.threatBand(neg.threat) === 'high') {
            neg._ultimatum = true;
            return { status: 'final', counter, neg, message: this.negLine(cls.profile, 'high', 'transfer', vars) || I18n.t('nego.tr.final', vars) };
        }
        // Pass 3: the club's counter takes on the profile's tone where a line is authored, else stays generic
        const flavor = this.negLine(cls.profile, 'med', 'transfer', vars);
        const wageClose = pkg.wage <= effMaxWage * 1.08, bonusClose = (pkg.bonus || 0) <= feeCeil * 1.12;
        if (roleOk && wageClose && bonusClose) return { status: 'close', counter, neg, message: I18n.t('nego.tr.close', vars) };
        return { status: 'counter', counter, neg, message: flavor || I18n.t('nego.tr.counter', vars) };
    },

    // Phase 2 (morale rework): a transfer/renewal/loan/sponsor deal concluded by the agent is
    // what keeps the "You" morale dimension from decaying (see MORALE.NEGLECT_* in
    // simulation.js) — every completion path below touches _lastAgentActionAbs regardless of
    // whether it also earns the flat AGENT_DEAL_BONUS.
    _creditAgentAction(p, bonus) {
        p._lastAgentActionAbs = GameState.absWeek();
        p._neglectWarned = false;
        if (bonus && p.morale) p.morale.agent = Math.min(100, p.morale.agent + bonus);
    },
    // closes an open moraleCase if its promise matches one of the just-fulfilled types
    _checkPromiseKeptBondHook(p) {
        // a promise kept is the quiet backbone of a long relationship (see js/dialogue.js)
        if (typeof Dialogue !== 'undefined') Dialogue.addBond(p, 4, 'you kept your word');
    },
    _checkPromiseKept(p, fulfillTypes) {
        const c = p.moraleCase;
        if (!c || !c.promise || !fulfillTypes.includes(c.promise.type)) return;
        p.morale[c.dim] = Math.min(100, p.morale[c.dim] + MORALE.PROMISE_KEPT_DIM);
        p.morale.agent = Math.min(100, p.morale.agent + MORALE.PROMISE_KEPT_AGENT);
        GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('ag.mail.promiseKeptSubj', { name: p.name }), body: I18n.t('ag.mail.promiseKeptBody', { name: p.name }), ttl: 4 });
        p.moraleCase = null;
        this._checkPromiseKeptBondHook(p);
    },

    acceptTransfer(mail, agreedWage, role, termSeasons, signingBonus, opts = {}) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        if (!p) return { ok: false, message: I18n.t('ag.playerGone') };
        const toClub = Clubs.getClubById(o.toClubId), fromClub = Clubs.getClubById(o.fromClubId);
        if (!toClub) return { ok: false, message: I18n.t('ag.clubGone') };
        if (p.onLoanAt) return { ok: false, message: I18n.t('ag.tr.onLoan', { name: p.name }) };
        if (p.pendingTransfer) return { ok: false, message: I18n.t('ag.tr.pending', { name: p.name, club: Clubs.getClubById(p.pendingTransfer.toClubId)?.name || I18n.t('ag.anotherClub') }) };
        const term = Math.max(1, Math.min(6, termSeasons || 3));

        // deals can be AGREED any week, but the move itself only happens inside a transfer
        // window: agreed while the window is shut -> he sees out the current stretch at his
        // club and the switch completes the week the next window opens (so the per-window and
        // two-clubs-a-season limits, which are about actual moves, don't bind at agreement)
        const windowOpen = GameState.isTransferWindowOpen();

        // at most one actual transfer per transfer window
        const winKey = GameState.transferWindowKey ? GameState.transferWindowKey() : null;
        if (windowOpen && winKey && p._txWindow === winKey)
            return { ok: false, message: I18n.t('ag.tr.windowUsed', { name: p.name }) };

        // max two senior clubs per season
        const yr = GameState.seasonStartYear;
        const seniorSet = new Set();
        Object.values(p.stats[yr] || {}).forEach(st => { if (!st.youth && !isReserveClub(st.clubId)) seniorSet.add(st.clubId); });
        if (p.clubId && !isReserveClub(p.clubId)) seniorSet.add(p.clubId);
        if (windowOpen && !o.internal && !isReserveClub(toClub.id) && !seniorSet.has(toClub.id) && seniorSet.size >= 2)
            return { ok: false, message: I18n.t('ag.tr.twoClubs', { name: p.name }) };

        // clubs won't commit long term to an ageing player unless he clearly outclasses the squad
        const termCap = this.maxContractTerm(p, toClub);
        if (term > termCap)
            return { ok: false, message: I18n.t('ag.deal.termTooLong', { club: toClub.name, term, cap: termCap }) };

        // the club won't hand out any role / signing bonus you ask for
        if (role && !this.roleAcceptable(p, toClub, role))
            return { ok: false, message: I18n.t('ag.deal.roleTooHigh', { club: toClub.name, name: p.name, role: roleLabel(role, p.age, p.position), ceil: roleLabel(this.clubRoleCeiling(p, toClub), p.age, p.position) }) };
        const reqBonus = Math.max(0, Math.round(signingBonus || 0));
        const okBonus = this.clubBonusWillingness(p, toClub, agreedWage, o.transferFee);
        if (reqBonus > okBonus)
            return { ok: false, message: I18n.t('ag.tr.bonusTooHigh', { club: toClub.name, bonus: UI.money(reqBonus), name: p.name, ok: UI.money(okBonus) }) };

        const wasFree = this.isFreeAgent(p);
        const pkg = {
            toClubId: toClub.id, fromClubId: o.fromClubId || p.clubId || null,
            wage: agreedWage, role: role || null, term, bonus: reqBonus,
            fee: wasFree ? 0 : o.transferFee, wasFree, initiatedByAgent: !!o.initiatedByAgent,
            // a keeper signed as Back Up can be earmarked the Cup Goalkeeper (plays the cup ties)
            cupKeeper: !!opts.cupKeeper && p.position === 'GK' && role === 'rotation',
            forced: !!opts.forced, credited: false
        };

        // the signing bonus is banked at signature, not when he reports for duty
        GameState.agency.balance += reqBonus; GameState.addFinance('Transfer & loan bonuses', reqBonus);

        // Pass 2: goodwill at conclusion reflects HOW the deal was struck (profile + speed). Forced
        // moves went over the agent's head, so they carry no negotiated goodwill (finalize gives them
        // the old flat +4 instead).
        if (!opts.forced) {
            const neg = o.neg;
            this.changeRelationship(toClub.id, this.concludeRelDelta(neg ? neg.profile : 'NEUTRAL', neg ? neg.round : 1));
        }

        GameState.removeMail(mail.id);
        // agreeing a move kills every other open approach for him: rival bids AND any contract-renewal
        // proposal from the club he's leaving (that deal is moot the moment he's agreed to go)
        GameState.inbox = GameState.inbox.filter(m => !(['transfer', 'renewal'].includes(m.kind) && m.offer && m.offer.playerId === p.id));

        if (!windowOpen) {
            // agreed outside a window: park the package, complete it when the window opens
            p.pendingTransfer = pkg;
            p.joiningClubId = toClub.id;   // shows the "Joining X" tag in the UI
            // the season the move actually completes in (winter window = this season; otherwise next) —
            // used to label "Joining 26/27" instead of the old undefined -> "NaN/NaN"
            p._joinSeason = (GameState.week >= 7 && GameState.week <= 27) ? GameState.seasonStartYear : GameState.seasonStartYear + 1;
            p.transferListed = false; p.loanListed = false; p._loanOk = false;
            // the agent's work ends at the handshake: promises count as kept and the deal
            // credits his standing now (finalize skips both via pkg.credited)
            this._checkPromiseKept(p, ['move', 'renegotiateRep']);
            if (!opts.forced) this._creditAgentAction(p, MORALE.AGENT_DEAL_BONUS);
            pkg.credited = true;
            const openWk = (GameState.week >= 7 && GameState.week <= 27) ? 28 : 1;
            const myCut = Math.round(agreedWage * p.wageCommission / 100);
            GameState.addLog(I18n.t('ag.log.moveAgreed', { name: p.name, club: toClub.name, week: openWk }), 'transfer');
            return { ok: true, message: I18n.t('ag.tr.agreed', { name: p.name, club: toClub.name, week: openWk, from: fromClub ? fromClub.name : I18n.t('ag.currentClub'), free: wasFree ? I18n.t('ag.freeTransfer') : '', bonus: UI.money(reqBonus), cut: UI.money(myCut) }), bonus: reqBonus };
        }
        return this._finalizeTransfer(p, pkg);
    },

    // The actual club switch and everything that hangs off it. Runs immediately for deals
    // agreed inside a window, or from completePendingTransfers() the week a window opens.
    _finalizeTransfer(p, pkg) {
        const toClub = Clubs.getClubById(pkg.toClubId), fromClub = pkg.fromClubId ? Clubs.getClubById(pkg.fromClubId) : null;
        if (!toClub) { delete p.pendingTransfer; delete p.joiningClubId; return { ok: false, message: I18n.t('ag.clubGone') }; }
        const movingUp = !!(fromClub && toClub.reputation > fromClub.reputation);
        if (!p.history) p.history = { ability: [], wage: [], fees: [] };
        p.history.fees.push({ t: GameState.absWeek(), age: careerAge(p), value: pkg.fee, fromId: pkg.fromClubId, toId: pkg.toClubId });

        p.clubId = toClub.id; p.onLoanAt = null; p.loanUntilSeason = null; p.loanRole = null; p.freeAgent = false;
        const winKey = GameState.transferWindowKey ? GameState.transferWindowKey() : null;
        if (winKey) p._txWindow = winKey;
        p.wage = pkg.wage; p.contractUntilSeason = GameState.seasonStartYear + pkg.term;
        p.transferListed = false; p.loanListed = false; p._loanOk = false;
        delete p.pendingTransfer; delete p.joiningClubId; delete p._joinSeason;
        p.squadRole = (pkg.role && ROLE_ORDER.includes(pkg.role)) ? pkg.role : this.maxRoleAt(p, toClub);
        p.cupKeeper = p.position === 'GK' && !!pkg.cupKeeper;   // the negotiated Cup Goalkeeper flag (GK only)
        recordWagePoint(p);

        if (fromClub) this.changeRelationship(fromClub.id, pkg.initiatedByAgent ? +1 : +3);
        // agent-negotiated deals already booked their conclusion goodwill in acceptTransfer (profile-based);
        // forced moves never passed through it, so they keep the old flat handshake bump here
        if (pkg.forced) this.changeRelationship(toClub.id, +4);
        Agency.bumpRep(movingUp ? 3 + Rng.next() * 3 : 1);
        // his call after signing — and if this is the club he supported as a boy, THE call (js/dialogue.js)
        if (typeof Dialogue !== 'undefined') Dialogue.onTransferCompleted(p, toClub.id);
        // the club's reputation promptly rises to what its roster of agent clients justifies:
        // anchor + Σ max(0, ability − anchor)/11 (uncapped). It never snaps DOWN here — once
        // players leave, League.normalizeReputations fades it by 1–5 per season instead.
        {
            const anchor = toClub.anchorRep != null ? toClub.anchorRep : toClub.reputation;
            let boost = 0;
            GameState.players.forEach(pp => {
                if (pp.agentId === 'me' && !pp.archived && (pp.onLoanAt || pp.clubId) === toClub.id)
                    boost += Math.max(0, pp.ability - anchor) / 11;
            });
            const target = Math.round(Math.max(20, Math.min(95, anchor + boost)));
            if (target > toClub.reputation) toClub.reputation = target;
        }
        // he had to agree to sign, so he's happy at the club he just joined — club morale resets high
        p.morale.club = MORALE.CLUB_RESET_ON_MOVE;
        // a move — any move — is a fresh start for how he feels about playing time
        p.morale.time = MORALE.TIME_RESET_ON_MOVE; p._playStreak = 0; p._benchStreak = 0;
        if (!pkg.credited) {
            this._checkPromiseKept(p, ['move', 'renegotiateRep']);
            // stage-3 forced moves went over the agent's head — no credit for doing nothing,
            // and _lastAgentActionAbs deliberately stays untouched (see _creditAgentAction)
            if (!pkg.forced) this._creditAgentAction(p, MORALE.AGENT_DEAL_BONUS);
        }
        GameState.addLog(I18n.t('ag.log.moveDone', { name: p.name, club: toClub.name, fee: UI.money(pkg.fee), bonus: UI.money(pkg.bonus) }), 'transfer');
        const myCut = Math.round(pkg.wage * p.wageCommission / 100);
        return { ok: true, message: I18n.t('ag.tr.completed', { name: p.name, club: toClub.name, role: roleLabel(p.squadRole, p.age, p.position, p.cupKeeper), until: GameState.seasonLabelFor(p.contractUntilSeason), free: pkg.wasFree ? I18n.t('ag.freeTransfer') : '', bonus: UI.money(pkg.bonus), cut: UI.money(myCut) }), bonus: pkg.bonus };
    },

    // called by Sim.advanceWeek the week a transfer window opens
    completePendingTransfers(events) {
        GameState.players.forEach(p => {
            if (!p.pendingTransfer) return;
            const pkg = p.pendingTransfer;
            if (p.archived) { delete p.pendingTransfer; delete p.joiningClubId; return; }   // retired before it completed
            const toClub = Clubs.getClubById(pkg.toClubId);
            const r = this._finalizeTransfer(p, pkg);
            if (r.ok && p.agentId === 'me') {
                GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('ag.mail.moveDoneSubj', { name: p.name }), body: I18n.t('ag.mail.moveDoneBody', { name: p.name, msg: r.message }), ttl: 4 });
                if (events) events.push({ type: 'transfer', text: `${p.name}'s move to ${toClub ? toClub.name : 'his new club'} is complete.` });
            }
        });
    },

    acceptRenewal(mail, agreedWage, role, termSeasons, opts = {}) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        const club = Clubs.getClubById(o.clubId);
        if (!p || !club) return { ok: false, message: I18n.t('ag.gone') };
        if (p.pendingTransfer) return { ok: false, message: I18n.t('ag.renew.movingAway', { name: p.name }) };
        const term = Math.max(1, Math.min(6, termSeasons || o.proposedTermSeasons || 2));
        if (p._renewSeason === GameState.seasonStartYear)
            return { ok: false, message: I18n.t('ag.renew.alreadyDone', { name: p.name }) };
        const termCap = this.maxContractTerm(p, club);
        if (term > termCap)
            return { ok: false, message: I18n.t('ag.deal.termTooLong', { club: club.name, term, cap: termCap }) };
        if (role && !this.roleAcceptable(p, club, role))
            return { ok: false, message: I18n.t('ag.deal.roleTooHigh', { club: club.name, name: p.name, role: roleLabel(role, p.age, p.position), ceil: roleLabel(this.clubRoleCeiling(p, club), p.age, p.position) }) };
        p.wage = agreedWage; p.contractUntilSeason = GameState.seasonStartYear + term; p.freeAgent = false; p._renewSeason = GameState.seasonStartYear;
        p.transferListed = false; p.loanListed = false; p._loanOk = false;   // committing to a new deal takes him off the market
        if (role && ROLE_ORDER.includes(role)) p.squadRole = role;
        p.cupKeeper = p.position === 'GK' && !!opts.cupKeeper && role === 'rotation';   // Cup Goalkeeper (GK Back Up only)
        recordWagePoint(p);
        // renewals stay NEUTRAL (no fee to weigh), so goodwill is the neutral +2, plus the fast-deal
        // bonus when it was wrapped up inside the first couple of rounds (see concludeRelDelta)
        this.changeRelationship(club.id, this.concludeRelDelta('NEUTRAL', o.neg ? o.neg.round : 1));
        // a renewal only fully settles his wage grievance if it actually clears "underpaid"; if he
        // re-signs for love of the club but is still below market, the raise is only a small comfort
        const mkt = PlayerGen.wageFor(p.ability, Math.max(club.reputation, p.ability));
        p.morale.wage = (agreedWage / Math.max(1, mkt) >= MORALE.WAGE_FAIR_FROM)
            ? Math.max(p.morale.wage, 85)
            : Math.min(100, p.morale.wage + 8);
        p.morale.club = Math.min(100, p.morale.club + MORALE.CLUB_RENEW_BOOST);
        this._checkPromiseKept(p, ['newContract', 'renegotiateRep']);
        this._creditAgentAction(p, MORALE.AGENT_DEAL_BONUS);
        GameState.removeMail(mail.id);
        // He has just committed: every bid on the table dies with the signature. Clubs that still
        // want him have to come back with a fresh (and better) offer.
        GameState.inbox = GameState.inbox.filter(m => !(m.kind === 'transfer' && m.offer && m.offer.playerId === p.id));
        GameState.addLog(I18n.t('ag.log.renewed', { name: p.name, club: club.name, wage: UI.money(agreedWage), until: GameState.seasonLabelFor(p.contractUntilSeason), role: roleLabel(p.squadRole, p.age, p.position, p.cupKeeper) }), 'contract');
        return { ok: true, message: I18n.t('ag.renew.done', { wage: UI.money(agreedWage), role: roleLabel(p.squadRole, p.age, p.position, p.cupKeeper), until: GameState.seasonLabelFor(p.contractUntilSeason) }) };
    },

    acceptLoanOffer(mail, role, durationCode, cupKeeper) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        const borrower = Clubs.getClubById(o.toClubId);
        if (!p || !borrower) return { ok: false, message: I18n.t('ag.gone') };
        if (p.pendingTransfer) return { ok: false, message: I18n.t('ag.loan.acceptPending', { name: p.name }) };
        const r = role || o.role || 'starter';
        const opts = this.loanDurationOptions(p);
        if (!opts.length) return { ok: false, message: I18n.t('ag.loan.noRoom', { name: p.name }) };
        const code = (durationCode && opts.find(o2 => o2.code === durationCode)) ? durationCode : opts[0].code;
        const end = this.computeLoanEnd(code);
        // capture BEFORE the move resets his playing-time context — the bonus is for fixing a
        // genuine problem, not for a loan that changed nothing he was unhappy about
        const timeWasBelowGood = p.morale && moraleBand(p.morale.time) !== 'GOOD';
        const hadPlayingTimeCase = !!(p.moraleCase && p.moraleCase.promise && p.moraleCase.promise.type === 'playingTime');
        p.onLoanAt = borrower.id; p.loanUntilSeason = end.until; p.loanMid = end.mid; p.loanListed = false; p.loanRole = r; p._loanOk = false;
        // scoped to the loan spell (auto-ignored once he's back home): a keeper loaned in as Back Up who takes the cup ties
        p.loanCupKeeper = p.position === 'GK' && !!cupKeeper && r === 'rotation';
        // a (shorter) settling-in at the loan club; an immediate loan cancels any settling at the parent club
        if (typeof Dialogue !== 'undefined') Dialogue.onLoanStarted(p, borrower.id);
        if (p.morale) { p.morale.time = MORALE.TIME_RESET_ON_MOVE; }
        p._playStreak = 0; p._benchStreak = 0;
        this.changeRelationship(borrower.id, +2);
        this._checkPromiseKept(p, ['playingTime', 'renegotiateRep']);
        if (timeWasBelowGood) this._creditAgentAction(p, hadPlayingTimeCase ? MORALE.AGENT_LOAN_BONUS_OPEN_CASE : MORALE.AGENT_LOAN_BONUS);
        else this._creditAgentAction(p, 0);   // still counts as contact for the neglect clock, just no bonus
        GameState.removeMail(mail.id);
        GameState.inbox = GameState.inbox.filter(m => !(m.kind === 'loan' && m.offer.playerId === p.id));
        const durLabel = this.durLabel((opts.find(o2 => o2.code === code) || {}).label || code);
        GameState.addLog(I18n.t('ag.log.loaned', { name: p.name, club: borrower.name, role: roleLabel(r, p.age, p.position, p.loanCupKeeper), dur: durLabel }), 'loan');
        return { ok: true, message: I18n.t('ag.loan.done', { name: p.name, club: borrower.name, role: roleLabel(r, p.age, p.position, p.loanCupKeeper), dur: durLabel }) };
    },

    // sponsor deals still running this season or later
    activeSponsorCount(p) { return (p.sponsorDeals || []).filter(d => d.untilSeason >= GameState.seasonStartYear).length; },
    MAX_SPONSORS: 2,
    acceptSponsor(mail, optionIndex = 0) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        if (!p) return { ok: false, message: I18n.t('ag.gone') };
        if (this.activeSponsorCount(p) >= this.MAX_SPONSORS) return { ok: false, message: I18n.t('ag.sponsor.max', { name: p.name, n: this.MAX_SPONSORS }) };
        const opt = (o.options && o.options[optionIndex]) || (o.weeklyAmount != null ? { company: o.sponsorName, weekly: o.weeklyAmount, annual: 0, termSeasons: o.termSeasons || 1 } : null);
        if (!opt) return { ok: false, message: I18n.t('ag.sponsor.expired') };
        // never two active deals from the same brand (a stale offer could name one he has since signed)
        if ((p.sponsorDeals || []).some(d => d.company === opt.company && d.untilSeason >= GameState.seasonStartYear))
            return { ok: false, message: I18n.t('ag.sponsor.dupe', { name: p.name, company: opt.company }) };
        p.sponsorIncome += opt.weekly;
        if (!p.sponsorDeals) p.sponsorDeals = [];
        p.sponsorDeals.push({ company: opt.company, weekly: opt.weekly, annual: opt.annual, untilSeason: GameState.seasonStartYear + opt.termSeasons });
        // pay the first annual instalment now (your sponsor cut on it goes to the agency)
        const annualCut = Math.round((opt.annual || 0) * p.sponsorCommission / 100);
        if (annualCut) { GameState.agency.balance += annualCut; GameState.addFinance('Sponsoring', annualCut); }
        this._creditAgentAction(p, 6);   // unchanged +6 bump, now also resets the neglect clock (Phase 2)
        GameState.removeMail(mail.id);
        const weeklyCut = Math.round(opt.weekly * p.sponsorCommission / 100);
        GameState.addLog(I18n.t('ag.log.sponsorSigned', { name: p.name, company: opt.company, weekly: UI.money(opt.weekly), annual: opt.annual ? I18n.t('ag.log.plusAnnual', { amt: UI.money(opt.annual) }) : '', terms: opt.termSeasons }), 'sign');
        return { ok: true, message: I18n.t('ag.sponsor.signed', { name: p.name, company: opt.company, weekly: UI.money(opt.weekly), lump: opt.annual ? I18n.t('ag.sponsor.lump', { amt: UI.money(opt.annual) }) : '', terms: opt.termSeasons, pct: p.sponsorCommission, cut: UI.money(weeklyCut), annualCut: annualCut ? I18n.t('ag.sponsor.annualCut', { amt: UI.money(annualCut) }) : '' }) };
    },

    declineMail(mail) { GameState.removeMail(mail.id); },

    // ---- injury treatments ----
    recoverInjury(p) {
        if (!p.injury) return;
        p.injuryHistory.push({ type: p.injury.type, weeks: p.injury.total, season: GameState.seasonLabel() });
        const t = I18n.t('ag.log.recovered', { name: p.name, type: p.injury.type });
        GameState.addLog(t, 'info'); GameState.addMail({ kind: 'news', cat: 'injury', subject: I18n.t('ag.mail.fitSubj', { name: p.name }), body: t, ttl: 2 });
        p.injury = null;
    },
    treatPhysio(p) {
        if (!p.injury) return { ok: false, message: I18n.t('ag.fullyFit', { name: p.name }) };
        const aw = GameState.absWeek();
        if (p.injury.treatedWeek === aw) return { ok: false, message: I18n.t('ag.physio.treated', { name: p.name }) };
        if (GameState.agency.balance < 1000) return { ok: false, message: I18n.t('ag.physio.cost') };
        GameState.agency.balance -= 1000; GameState.addFinance('Physio treatments', -1000);
        p.injury.weeksOut = Math.max(0, p.injury.weeksOut - 0.5);
        p.injury.treatedWeek = aw;
        GameState.addLog(I18n.t('ag.log.physio', { name: p.name }), 'money');
        if (p.injury.weeksOut <= 0) { this.recoverInjury(p); return { ok: true, message: I18n.t('ag.physio.doneFit', { name: p.name }) }; }
        return { ok: true, message: I18n.t('ag.physio.doneOut', { name: p.name, wk: this._wk(p.injury.weeksOut) }) };
    },
    treatSpecialist(p) {
        if (!p.injury) return { ok: false, message: I18n.t('ag.fullyFit', { name: p.name }) };
        if (p.injury.specialistUsed) return { ok: false, message: I18n.t('ag.spec.used', { name: p.name }) };
        const aw = GameState.absWeek();
        if (p.injury.treatedWeek === aw) return { ok: false, message: I18n.t('ag.spec.sameWeek') };
        if (GameState.agency.balance < 15000) return { ok: false, message: I18n.t('ag.spec.cost') };
        GameState.agency.balance -= 15000; GameState.addFinance('Specialists', -15000);
        p.injury.weeksOut = Math.round((p.injury.weeksOut / 2) / 0.5) * 0.5;
        p.injury.specialistUsed = true;
        p.injury.treatedWeek = aw;
        GameState.addLog(I18n.t('ag.log.specialist', { name: p.name }), 'money');
        if (p.injury.weeksOut <= 0) { this.recoverInjury(p); return { ok: true, message: I18n.t('ag.spec.doneFit', { name: p.name }) }; }
        return { ok: true, message: I18n.t('ag.spec.doneOut', { name: p.name, wk: this._wk(p.injury.weeksOut) }) };
    },
    _wk(w) { return (Math.round(w * 2) / 2) + ' week(s)'; },

    // ---------- gifts / release / listing ----------
    // gift cost scales with the player's wage — better-paid players have pricier tastes
    giftCost(tier, p) {
        const wage = p ? (p.wage || 0) : 1000;
        const mult = MORALE.GIFT_COST_MULT[tier] || MORALE.GIFT_COST_MULT.small;
        return Math.max(MORALE.GIFT_COST_MIN, Math.round(wage * mult / 10) * 10);
    },
    giftBoost(tier) { return MORALE.GIFT_BOOST[tier] || MORALE.GIFT_BOOST.small; },
    // a given tier is off cooldown once 2 full seasons have passed since it was last given
    giftTierReady(p, tier) {
        const last = p._giftLog && p._giftLog[tier];
        return last == null || GameState.absWeek() - last >= MORALE.GIFT_TIER_COOLDOWN_WEEKS;
    },
    giveGift(p, tier) {
        if (!p._giftLog) p._giftLog = { small: null, medium: null, large: null, lastAny: null };
        if (p.moraleCase && p.moraleCase.dim === 'agent' && p.moraleCase.stage >= 3)
            return { ok: false, message: I18n.t('ag.gift.refuses', { name: p.name }) };
        if (!this.giftTierReady(p, tier)) {
            const weeksLeft = MORALE.GIFT_TIER_COOLDOWN_WEEKS - (GameState.absWeek() - p._giftLog[tier]);
            return { ok: false, message: I18n.t('ag.gift.recent', { name: p.name, n: Math.ceil(weeksLeft / 52) }) };
        }
        const cost = this.giftCost(tier, p);
        if (GameState.agency.balance < cost) return { ok: false, message: I18n.t('ag.gift.cost', { amt: UI.money(cost) }) };
        GameState.addFinance('Gifts & relationships', -cost);
        GameState.agency.balance -= cost;
        const aw = GameState.absWeek();
        // gifts too close together (any tier) ring hollow — halved effect within the window
        const diminished = p._giftLog.lastAny != null && (aw - p._giftLog.lastAny) < MORALE.GIFT_DIMINISH_WEEKS;
        const boost = this.giftBoost(tier) * (diminished ? MORALE.GIFT_DIMINISH_FACTOR : 1);
        const strained = p.morale.agent < 50;   // read BEFORE the boost: was this a peace offering?
        p.morale.agent = Math.min(100, p.morale.agent + boost);
        p._giftLog[tier] = aw; p._giftLog.lastAny = aw;
        const lines = {
            small: ['“Cheers — appreciate the thought.”', '“Nice of you, thanks.”', '“A little something, eh? Ta.”'],
            medium: ['“Now that’s a proper gift — thank you!”', '“Really generous of you, cheers.”', '“You’ve got good taste, I’ll give you that.”'],
            large: ['“Wow — you didn’t have to! I won’t forget this.”', '“This is incredible, thank you so much!”', '“Now we’re talking — you look after me and I’ll repay it on the pitch.”']
        };
        const arr = lines[tier] || lines.small;
        const quote = arr[Math.floor(Rng.next() * arr.length)];
        GameState.addLog(I18n.t('ag.log.gift', { name: p.name, tier, amt: UI.money(cost), dim: diminished ? I18n.t('ag.log.giftDim') : '' }), 'info');
        // a gift lands hardest when things between you are strained (see js/dialogue.js)
        if (typeof Dialogue !== 'undefined') Dialogue.addBond(p, strained ? 2 : 1);
        // `scene` lets the UI play the reaction as a short conversation instead of a banner
        return { ok: true, quote, scene: true, tier, diminished, message: I18n.t('ag.gift.result', { name: p.name, quote, note: diminished ? I18n.t('ag.gift.diminishedNote') : '' }), cost };
    },

    // ---------- morale case actions ----------
    // (the "Talk to him" flow is now the Dialogue complaint scene — see js/dialogue.js /
    // ui/js/screen-dialogue.js; the old flat-bonus Agency.talkToClient it replaced is gone)

    // which promise types make sense for the player's currently open case
    validPromiseTypes(p) {
        if (!p.moraleCase || p.moraleCase.stage !== 1) return [];
        return MORALE_PROMISE_TYPES[p.moraleCase.dim] || [];
    },
    makePromise(p, type) {
        if (!this.isClient(p)) return { ok: false, message: I18n.t('ag.notClient') };
        const c = p.moraleCase;
        if (!c || c.stage !== 1) return { ok: false, message: I18n.t('ag.promise.noCase') };
        if (!this.validPromiseTypes(p).includes(type)) return { ok: false, message: I18n.t('ag.promise.badFit') };
        c.promise = { type, deadlineAbsWeek: moralePromiseDeadline(type) };
        GameState.addLog(I18n.t('ag.log.promised', { name: p.name }), 'morale');
        return { ok: true, message: I18n.t('ag.promise.made', { name: p.name }) };
    },

    repRemainingWeeks(p) {
        if (p.repExpired) return 0;
        const seasonsLeft = Math.max(0, (p.repUntilSeason ?? GameState.seasonStartYear) - GameState.seasonStartYear);
        const weeksThisSeason = Math.max(0, 45 - GameState.week);
        return seasonsLeft * 45 + weeksThisSeason;
    },
    releaseFee(p) { return p.repExpired ? 0 : Math.round(p.wage * this.repRemainingWeeks(p) * p.wageCommission / 100); },
    releasePlayer(p) {
        const fee = this.releaseFee(p);
        if (GameState.agency.balance < fee) return { ok: false, message: I18n.t('ag.release.cost', { amt: UI.money(fee) }) };
        GameState.addFinance('Release pay-outs', -fee);
        GameState.agency.balance -= fee;
        p.agentId = null; p.wageCommission = 0; p.sponsorCommission = 0; p.repUntilSeason = null;
        p.transferListed = false; p.loanListed = false; p.dismissedTalent = true;   // ex-client: out of clients & talent, kept in Client History
        GameState.addLog(I18n.t('ag.log.released', { name: p.name, amt: UI.money(fee) }), 'warn');
        if (typeof Achievements !== 'undefined') Achievements.noteRelease();
        return { ok: true, message: I18n.t('ag.release.done', { name: p.name, amt: UI.money(fee) }) };
    },
    toggleTransferList(p) { p.transferListed = !p.transferListed; GameState.addLog(I18n.t(p.transferListed ? 'ag.log.txlistAdded' : 'ag.log.txlistRemoved', { name: p.name }), 'info'); return p.transferListed; },
    toggleLoanList(p) { p.loanListed = !p.loanListed; if (p.loanListed) p._loanOffersFrom = GameState.absWeek() + 1; GameState.addLog(I18n.t(p.loanListed ? 'ag.log.loanlistAdded' : 'ag.log.loanlistRemoved', { name: p.name }), 'info'); return p.loanListed; },

    // ---------- helpers ----------
    // the most a club will spend on a single player, driven by its league's wealth and its own standing.
    // the Premier League can bankroll huge fees; the Eredivisie and lower leagues simply cannot.
    _leagueCap(div) {
        // DRD is the Dutch amateur bottom rung (Derde Divisie) — nowhere near as well-funded as other
        // countries' tier-4 leagues (League Two is fully pro, Regionalliga/Primera Inferior semi-pro)
        // Swiss transfer/wage ceilings sit a notch under the Dutch ladder at every tier (Super League
        // clubs' reputations run neck-and-neck with the Eredivisie's, but real budgets fall a bit short)
        // Italy mirrors the Spanish ladder (Serie A≈La Liga money): A↔LaLiga, B↔LaLiga2, C↔PrimeraSup, D↔PrimeraInf
        const CAP = { PREM: 95000000, CHAMP: 32000000, LEAGUE1: 11000000, LEAGUE2: 4000000, Natleague: 1500000, ERE: 24000000, EED: 8000000, TWD: 3000000, DRD: 60000, BUNDES: 60000000, '2BUNDES': 18000000, '3LIGA': 6000000, REGIONAL1: 2500000, REGIONAL2: 1000000, REGIONAL3: 500000, LaLiga: 75000000, LaLiga2: 14000000, PrimeraSup: 5000000, PrimeraInf: 2000000, Segunda: 800000, SuperLeagueCH: 20000000, ChallengeLeague: 6500000, PromotionLeague: 2200000, '1.LigaCH': 45000, '2.LigaCH': 15000, SerieA: 75000000, SerieB: 14000000, SerieC: 5000000, SerieD: 2000000, Ligue1: 70000000, Ligue2: 13000000, Ligue3: 4500000, Ligue4: 1800000, Ligue5: 700000, LigaPortugal: 24000000, LigaPortugal2: 8000000, Liga3: 3000000, Liga4: 60000, JupilerProLeague: 24000000, ChallengerProLeague: 8000000, BelgianDivision1: 3000000, BelgianDivision2: 60000 };
        return CAP[div] != null ? CAP[div] : 6000000;
    },
    buyerMaxFee(club) {
        if (!club) return 6000000;
        let factor = Math.max(0.04, 0.5 + (club.reputation - 45) / 55);
        // genuine superclubs (Premier League giants, PSG, …) have near-bottomless wallets: from rep ~80
        // up the ceiling escalates sharply so a marquee 94+ signing is comfortably within reach.
        if (club.reputation > 80) factor *= 1 + (club.reputation - 80) * 0.4;
        return Math.round(this._leagueCap(club.division) * factor);
    },
    // intrinsic value of a player, independent of any particular buyer
    playerValue(p) {
        let v = 380 * Math.pow(1.15, p.ability);                       // steep in current ability
        const potGap = Math.max(0, (p.potential || p.ability) - p.ability);
        const potWeight = p.age <= 21 ? 1.3 : p.age <= 25 ? 0.8 : p.age <= 28 ? 0.4 : 0.15;
        v *= 1 + potGap * 0.045 * potWeight * this.potentialConfidence(p.ability);   // upside is worth most in the young — but muted for unproven low-ability players, see potentialConfidence()
        // age curve: young premium, then a steep, explicit decline from 31 so ageing players slide down
        // the market and become affordable to lower clubs. Relative to a 26-year-old of the same ability,
        // a 31yo is worth 35% less, 32→45%, 33→55%, 34→65%, 35→80%, 36→90%, 37+→95% less.
        const ageMult = p.age <= 19 ? 1.35 : p.age <= 21 ? 1.25 : p.age <= 23 ? 1.12 : p.age <= 26 ? 1.0
            : p.age <= 28 ? 0.80 : p.age <= 30 ? 0.72
            : p.age === 31 ? 0.65 : p.age === 32 ? 0.55 : p.age === 33 ? 0.45 : p.age === 34 ? 0.35
            : p.age === 35 ? 0.20 : p.age === 36 ? 0.10 : 0.05;
        v *= ageMult;
        v *= this.perfValueMult(p);   // a red-hot season pulls higher bids (up to +25%)
        const yrsLeft = Math.max(0, (p.contractUntilSeason || GameState.seasonStartYear) - GameState.seasonStartYear);
        v *= 0.78 + Math.min(4, yrsLeft) * 0.11;                       // longer deal left -> pricier
        return v;
    },
    estimateFee(p, targetClub, opts = {}) {
        if (this.isPreContractFree(p)) return 0;   // a pre-contract signing costs no transfer fee (Bosman)
        let v = this.playerValue(p);
        if (targetClub) {
            const rep = targetClub.reputation;
            // buyer-quality premium: from mid-table up this is unchanged, but it now falls away steeply
            // for genuinely weak/amateur clubs (Dutch Derde Divisie, deep regional leagues abroad) instead
            // of floors at 72% of "full value" for literally any buyer, however small
            const factor = rep >= 45 ? (0.72 + rep / 150) : Math.max(0.04, Math.pow(rep / 45, 4.5) * 1.02);
            v *= factor;
            v = Math.min(v, this.buyerMaxFee(targetClub));            // but never beyond what they can afford
        }
        // a formal (stage 2+) transfer request is public knowledge — incoming bids come in lower.
        // Skipped by callers that apply their own case-discount (shopPlayer's smaller ask-price cut,
        // and stage-3 forced moves, which discount uniformly regardless of which dimension escalated).
        if (!opts.skipCaseDiscount && p.moraleCase && p.moraleCase.dim === 'club' && p.moraleCase.stage >= 2) {
            v *= MORALE.STAGE2_CLUB_FEE_MULT;
        }
        const step = v < 50000 ? 1000 : 10000;                         // finer granularity for small, low-league fees
        return Math.max(500, Math.round(v / step) * step);
    },
    // agent's fee on a transfer scales with the size of the deal, up to €5m on a €100m+ move
    agentFeeCap(transferFee) {
        return Math.min(5000000, Math.round((transferFee || 0) * 0.05 / 1000) * 1000);
    },
    _offerObj(p, fromId, toId, fee, opts = {}) {
        const toClub = Clubs.getClubById(toId);
        return {
            playerId: p.id, fromClubId: fromId, toClubId: toId, transferFee: fee,
            proposedWage: this.offeredWage(p, toClub, { loyalty: false }),   // includes country tendency + form (item: cross-country payrise)
            role: this.maxRoleAt(p, toClub),
            initiatedByAgent: !!opts.initiatedByAgent
        };
    },
    _expiry(weeks) { return ((GameState.week + weeks - 1) % 52) + 1; },

    weeklyIncome() {
        return this.clients().reduce((s, p) => s + Math.round(p.wage * p.wageCommission / 100) + Math.round(p.sponsorIncome * p.sponsorCommission / 100), 0);
    },
    weeklyExpenses() { return GameState.agency.scouts.reduce((s, sc) => s + sc.weeklyCost, 0) + Upgrades.weeklyOfficeCost() + Upgrades.weeklyFacCost(); },
    weeklyBreakdown() {
        const cl = this.clients();
        return {
            wageComm: cl.reduce((s, p) => s + (this.isFreeAgent(p) ? 0 : Math.round(p.wage * p.wageCommission / 100)), 0),
            sponsorComm: cl.reduce((s, p) => s + Math.round(p.sponsorIncome * p.sponsorCommission / 100), 0),
            scoutWages: GameState.agency.scouts.reduce((s, sc) => s + sc.weeklyCost, 0),
            office: Upgrades.weeklyOfficeCost(),
            facilities: Upgrades.weeklyFacCost()
        };
    }
};
