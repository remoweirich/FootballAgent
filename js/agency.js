// ============================================================
//  Agency — negotiations (multi-step), clients, money, deals
// ============================================================
const Agency = {
    init() {
        const relationships = {};
        Clubs.allClubs.forEach(c => {
            let base = 72 - (c.reputation - 38) * 0.5;
            relationships[c.id] = Math.round(Math.max(48, Math.min(75, base)));
        });
        GameState.agency = {
            name: 'Your Agency', reputation: 12, balance: 3000,
            scouts: [], relationships,
            upgrades: { officeIndex: 0, vehicleIndex: -1, propertyIndex: -1 },
            facilities: { items: [], physios: 0, trainers: 0 },
            ledger: {}, ledgerLast: {}, ledgerAll: {}, ledgerSeason: GameState.seasonStartYear
        };
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

    // ---------- signing eligibility ----------
    canSign(p) {
        if (!p) return { ok: false, reason: 'No player selected.' };
        if (p.agentId === 'me') return { ok: false, reason: 'Already one of your clients.' };
        if (p.agentId) return { ok: false, reason: 'Represented by another agent.' };
        if (p.noTalkUntil && p.noTalkUntil > GameState.absWeek()) return { ok: false, reason: `“I don't want to talk with you right now.” (~${p.noTalkUntil - GameState.absWeek()} weeks)` };
        if (p.age >= 23) return { ok: false, reason: 'You can only sign players under 23 who can still develop.' };
        if (this.atCapacity()) return { ok: false, reason: `Your agency is at capacity (${this.capacity()} clients). Release someone first.` };
        const ceiling = GameState.agency.reputation + 12;
        if (p.ability > ceiling) return { ok: false, reason: "This player won't sign with a low-reputation agency yet." };
        return { ok: true };
    },

    // base commission ceiling (forward commissions on transfers/renewals)
    maxCommissions(p) {
        const lev = GameState.agency.reputation - p.ability;
        return {
            wage: Math.max(0, Math.min(25, Math.round(7 + lev * 0.7))),
            sponsor: Math.max(0, Math.min(25, Math.round(10 + lev * 0.8)))
        };
    },
    // signing ceiling: players tolerate a higher cut for a LONGER commitment
    maxSignCommissions(p, term) {
        const lev = GameState.agency.reputation - p.ability;
        const termBonus = Math.max(0, term - 1) * 1.0;
        return {
            wage: Math.max(0, Math.min(25, Math.round(4 + lev * 0.6 + termBonus))),
            sponsor: Math.max(0, Math.min(25, Math.round(6 + lev * 0.7 + termBonus)))
        };
    },

    // multi-step representation negotiation. term 1..10; longer term => higher tolerance.
    negotiateSign(p, wage, sponsor, term, round = 1) {
        const aw = GameState.absWeek();
        if (p.noTalkUntil && p.noTalkUntil > aw) return { status: 'cold', message: `“I don't want to talk with you right now.”` };
        const max = this.maxSignCommissions(p, term);
        const wageOver = wage - max.wage, sponsorOver = sponsor - max.sponsor;
        if (wageOver <= 0 && sponsorOver <= 0) {
            const lines = ['“That works for me — let’s do it.”', '“Fair enough. You’ve got yourself a client.”', '“I’m happy with that. Let’s get to work.”'];
            return { status: 'accept', message: lines[Math.floor(Math.random() * lines.length)] };
        }
        if (round >= 4) {
            const weeks = 5 + Math.floor(Math.random() * 6);
            p.noTalkUntil = aw + weeks;
            return { status: 'walk', weeks, message: `“We're going round in circles. I don't want to discuss this again for a while.”` };
        }
        // a longer commitment lets him stomach a bigger cut
        const suggestTerm = Math.min(10, term + 2);
        const m2 = this.maxSignCommissions(p, suggestTerm);
        // worded reaction referencing the actual sticking point
        let msg;
        const shortTerm = term <= 4;
        if (wageOver > 0 && sponsorOver > 0)
            msg = shortTerm
                ? `“I don't want to give you that much of my wages and sponsorships for only ${term} year${term > 1 ? 's' : ''} of guaranteed representation.”`
                : `“Those cuts are too steep — both the wage and the sponsorship slice are more than I'll accept.”`;
        else if (wageOver > 0)
            msg = shortTerm
                ? `“${Math.round(wage)}% of my wages for just ${term} year${term > 1 ? 's' : ''}? That's too much for too little security.”`
                : `“That's a bigger slice of my wages than I'm willing to give up.”`;
        else
            msg = `“Your cut of my sponsorship deals is too steep for my liking.”`;
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
        GameState.addLog(`Signed ${p.name} — ${wage}% wage / ${sponsor}% sponsor, ${term} season(s).`, 'sign');
    },

    // ---------- loans: interested clubs come to you ----------
    requestLoan(p) {
        if (!this.isClient(p)) return { ok: false, message: 'Not your client.' };
        if (p.onLoanAt && !isU21Loan(p)) return { ok: false, message: `${p.name} is already away.` };
        const cands = Clubs.allClubs.filter(c => {
            if (c.id === p.clubId) return false;
            const role = this.maxRoleAt(p, c);
            if (!(role === 'key' || role === 'starter' || role === 'rotation')) return false; // must get minutes
            if (this.clubHasMyPlayerAtPos(c.id, p.position, p.id)) return false;
            return true;
        });
        if (!cands.length) {
            return { ok: false, message: `No senior club can give ${p.name} regular minutes right now. Send him to your U21 instead to keep developing.` };
        }
        // spread the picks across the candidates so some weaker clubs (who'd offer a bigger role) are included
        for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[cands[i], cands[j]] = [cands[j], cands[i]]; }
        const picks = cands.slice(0, 3 + Math.floor(Math.random() * 2)).map(c => c.id);
        // the parent club must sanction the loan first
        const parent = Clubs.getClubById(p.clubId);
        const rel = this.relationship(p.clubId);
        let sanction = 0.55 + (rel - 55) / 200 + (['youth', 'fringe', 'rotation'].includes(p.squadRole) ? 0.2 : -0.15);
        sanction = Math.max(0.1, Math.min(0.95, sanction));
        if (Math.random() > sanction) {
            this.changeRelationship(p.clubId, -1);
            GameState.addMail({ kind: 'news', cat: 'general', subject: `${parent ? parent.name : 'His club'} on a loan for ${p.name}`, body: `${parent ? parent.name : 'His club'} would rather keep ${p.name} around for now and won't sanction a loan. Try again later or build the relationship.`, ttl: 4 });
            return { ok: false, message: `${parent ? parent.name : 'His club'} won't sanction a loan for ${p.name} right now.` };
        }
        p._pendingLoan = { from: GameState.absWeek() + 1, picks };
        GameState.addMail({ kind: 'news', cat: 'general', subject: `${parent ? parent.name : 'His club'} open to loaning ${p.name}`, body: `${parent ? parent.name : 'His club'} are happy to let ${p.name} go out on loan for game time. Interested clubs will be in touch over the coming week.`, ttl: 5 });
        return { ok: true, message: `${parent ? parent.name : 'His club'} sanction the loan. Loan offers will start arriving next week.` };
    },
    _u21ClubReaction(p, clubName, dest) {
        const lines = [
            `We agree that ${p.name} could benefit from youth-team football.`,
            `Game time with ${dest} will do ${p.name} the world of good.`,
            `Good call — ${p.name} needs minutes, and he'll get them at ${dest}.`,
            `${p.name} will sharpen up against tough opposition at ${dest}.`,
            `Sensible. We'd rather ${p.name} play regularly than warm our bench.`
        ];
        GameState.addMail({ kind: 'news', subject: `${clubName} on ${p.name}`, body: lines[Math.floor(Math.random() * lines.length)], ttl: 3 });
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
        if (!this.isClient(p)) return { ok: false, message: 'Not your client.' };
        if (p.onLoanAt) return { ok: false, message: `${p.name} is already away.` };
        if (p.age > 21) return { ok: false, message: `${p.name} is ${p.age} — only players aged 21 or under can drop to a youth/U21 side.` };
        if (isReserveClub(p.clubId)) return { ok: false, message: `${p.name} already plays for a reserve side (${Clubs.getClubById(p.clubId)?.name}); he can't be sent down further. You can request a promotion to the senior team instead.` };
        const seniorName = Clubs.getClubById(p.clubId)?.name || '';
        // the club has to agree to drop him to the youth/reserve setup
        if (Math.random() > this._u21Consent(p)) {
            this.changeRelationship(p.clubId, -1);
            const no = [
                `We disagree — ${p.name} is part of our first-team plans and stays with the senior squad.`,
                `We disagree. We need ${p.name} around the first team right now.`,
                `Not for us — ${p.name} won't be going down to the youth side at the moment.`
            ];
            GameState.addMail({ kind: 'news', cat: 'general', subject: `${seniorName} on ${p.name}`, body: no[Math.floor(Math.random() * no.length)], ttl: 4 });
            return { ok: false, message: `${seniorName} won't sanction sending ${p.name} to the youth side right now.` };
        }
        const reserve = reserveClubFor(p.clubId);
        if (reserve) {
            p.onLoanAt = reserve.id; p.loanUntilSeason = GameState.seasonStartYear; p.loanMid = false; p.loanRole = 'starter';
            GameState.addLog(`${p.name} sent to ${reserve.name} (reserves).`, 'loan');
            this._u21ClubReaction(p, seniorName, reserve.name);
            return { ok: true, message: `${p.name} joined ${reserve.name}; he'll feature in their league games. He returns to the senior side at the end of the season.` };
        }
        p.onLoanAt = 'u21:' + p.clubId; p.loanUntilSeason = GameState.seasonStartYear; p.loanMid = false; p.loanRole = 'starter';
        const jong = 'Jong ' + seniorName;
        GameState.addLog(`${p.name} sent to ${jong}.`, 'loan');
        this._u21ClubReaction(p, seniorName, jong);
        return { ok: true, message: `${p.name} joined ${jong}. He'll play youth-league games to develop — they appear in his history but don't count toward senior appearances.` };
    },
    // a client at a reserve side can ask to be pulled up to the senior team
    requestPromotion(p) {
        if (!this.isClient(p)) return { ok: false, message: 'Not your client.' };
        if (!isReserveClub(p.clubId)) return { ok: false, message: `${p.name} isn't at a reserve side.` };
        if (p.onLoanAt) return { ok: false, message: `${p.name} is currently away on loan.` };
        const parent = parentClubForReserve(p.clubId);
        if (!parent) return { ok: false, message: `No senior side is linked to ${Clubs.getClubById(p.clubId)?.name}.` };
        if (GameState.inbox.find(m => m.kind === 'transfer' && m.offer.playerId === p.id && m.offer.toClubId === parent.id)) return { ok: false, message: 'A promotion offer is already in your inbox.' };
        const offer = this._offerObj(p, p.clubId, parent.id, 0, { initiatedByAgent: true, internal: true });
        GameState.addMail({ kind: 'transfer', subject: `${parent.name} can promote ${p.name}`, offer, persistence: 0, ttl: 3 });
        GameState.addLog(`Requested a promotion of ${p.name} to ${parent.name}.`, 'offer');
        return { ok: true, message: `${parent.name} are open to promoting ${p.name} from the reserves — complete it from your inbox (no transfer fee).` };
    },
    // loan duration options depend on the open window (summer: any; winter: half-steps only)
    loanDurationOptions() {
        const w = GameState.week;
        if (w >= 1 && w <= 6) return [{ code: '0.5', label: 'Half season' }, { code: '1', label: '1 season' }, { code: '1.5', label: '1.5 seasons' }, { code: '2', label: '2 seasons' }];
        if (w >= 21 && w <= 25) return [{ code: '0.5', label: 'Rest of season' }, { code: '1.5', label: '1.5 seasons' }];
        // loans can be arranged any time of year — offer sensible defaults outside the main windows
        if (w >= 48) return [{ code: '1', label: 'Next season' }, { code: '2', label: '2 seasons' }];
        return [{ code: '0.5', label: 'Rest of season' }, { code: '1.5', label: 'Through next season' }];
    },
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
        const pool = Clubs.allClubs.filter(c => c.id !== parent.id && c.reputation <= parent.reputation + 2)
            .sort((a, b) => Math.abs(a.reputation - (parent.reputation - 8)) - Math.abs(b.reputation - (parent.reputation - 8)));
        return pool[Math.floor(Math.random() * Math.min(5, pool.length))] || parent;
    },

    // ---------- shop player to ANY club ----------
    shopPlayer(p, targetClubId) {
        if (!this.isClient(p)) return { ok: false, message: 'Not your client.' };
        const parent = Clubs.getClubById(p.clubId);
        const target = Clubs.getClubById(targetClubId);
        if (!target) return { ok: false, message: 'Unknown club.' };
        if (target.id === p.clubId) return { ok: false, message: 'That is already the player\'s club.' };

        const potRead = p.potential + Math.round((Math.random() - 0.5) * 16);
        const perceived = p.ability + 0.5 * Math.max(0, potRead - p.ability);
        const interested = perceived >= target.reputation - 6 && Math.random() < 0.8;
        const discovered = Math.random() < 0.5;
        let msg = '';
        if (discovered && parent) { this.changeRelationship(parent.id, -15); msg += `${parent.name} found out and feels betrayed (relationship −15). `; }

        if (!interested) return { ok: true, interested: false, message: msg + `${target.name} didn't bite.` };

        const fee = this.estimateFee(p, target);
        const offer = this._offerObj(p, parent ? parent.id : null, target.id, fee, { initiatedByAgent: true });
        GameState.addMail({ kind: 'transfer', subject: `${target.name} want ${p.name}`, offer, persistence: 1, ttl: 2 });
        GameState.addLog(`${target.name} tabled €${UI.money(fee)} for ${p.name}.`, 'offer');
        return { ok: true, interested: true, message: msg + `${target.name} are interested — offer in your inbox (€${UI.money(fee)}).` };
    },

    // ---------- contract renewal request (to parent club) ----------
    requestRenewalTalks(p) {
        if (!this.isClient(p)) return { ok: false, message: 'Not your client.' };
        const club = Clubs.getClubById(p.clubId);
        if (!club) return { ok: false, message: 'No club.' };
        const seasonsLeft = (p.contractUntilSeason ?? GameState.seasonStartYear) - GameState.seasonStartYear;
        if (seasonsLeft > 2 && Math.random() < 0.7) return { ok: false, message: `${club.name} won't talk — plenty of contract left.` };
        if (p.squadRole === 'fringe' && Math.random() < 0.5) return { ok: false, message: `${club.name} aren't planning with ${p.name}.` };
        const proposedWage = Math.max(p.wage + 10, Math.round(PlayerGen.wageFor(p.ability, club.tier) * 1.1 / 10) * 10);
        const offer = { playerId: p.id, clubId: club.id, proposedWage, proposedTermSeasons: 2 + Math.floor(Math.random() * 2) };
        GameState.addMail({ kind: 'renewal', subject: `Renewal terms for ${p.name} at ${club.name}`, offer, persistence: 0, ttl: 3 });
        return { ok: true, message: `${club.name} are open to talks — proposal in your inbox.` };
    },

    // club willingness to pay wage (for renewal/transfer negotiation)
    maxClubWage(p, club) {
        let base = PlayerGen.wageFor(p.ability, club ? club.tier : 3) * 1.6;   // clear room to push the wage up
        base *= 1 + Math.max(-0.08, Math.min(0.25, (this.relationship(club ? club.id : null) - 55) / 220));
        return Math.round(base / 10) * 10;
    },
    contractSeasonsLeft(p) { return (p.contractUntilSeason != null ? p.contractUntilSeason : GameState.seasonStartYear) - GameState.seasonStartYear; },
    isFreeAgent(p) { return !!p.freeAgent || p.clubId == null; },

    // greeting reflects how the club feels about you
    greetingFor(clubId) {
        const rel = this.relationship(clubId);
        if (rel >= 75) return "Always a pleasure to see you.";
        if (rel >= 55) return "Good to see you again.";
        if (rel >= 35) return "Nice to meet you.";
        if (rel >= 18) return "Let's keep this businesslike.";
        return "Not you again…";
    },
    // wage the club will accept depends on player value AND your relationship; no hard ceiling shown to you
    negotiateWage(p, club, requested, round = 1) {
        const rel = this.relationship(club ? club.id : null);
        const base = this.maxClubWage(p, club);
        const room = base * (1 + Math.max(-0.10, Math.min(0.45, (rel - 55) / 110)));   // a bit more give than before
        const cap = Math.round(room) - (round - 1) * Math.round(p.wage * 0.03);
        if (requested <= cap) return { status: 'accept', message: round === 1 ? `We can do €${UI.money(requested)}/wk — agreed.` : `Alright, €${UI.money(requested)}/wk. We have a deal.` };
        const counter = Math.max(p.wage, Math.round(cap / 10) * 10);
        if (requested <= cap * 1.12) return { status: 'counter', counter, message: `We're close — we can stretch to €${UI.money(counter)}/wk.` };
        if (round >= 5) return { status: 'reject', message: `We aren't prepared to pay that much for ${p.name}.` };
        return { status: 'counter', counter, message: requested > cap * 1.5 ? `That is far too much. €${UI.money(counter)}/wk is our ceiling.` : `That's too much — we could do €${UI.money(counter)}/wk.` };
    },
    // negotiate loan game time: ask above the club's comfort level and they may dig in — or, with a good
    // relationship and persistence, eventually relent. Sometimes they stay stubborn.
    negotiateLoanRole(p, club, requested, round = 1) {
        const ceil = this.clubRoleCeiling(p, club);
        const reqIdx = ROLE_ORDER.indexOf(requested), ceilIdx = ROLE_ORDER.indexOf(ceil);
        if (reqIdx <= ceilIdx) return { status: 'accept', role: requested, message: `Agreed — ${p.name} joins as ${ROLE_LABEL[requested]}.` };
        const rel = this.relationship(club ? club.id : null);
        const concede = Math.max(0, Math.min(0.85, 0.12 + (rel - 55) / 200 + (round - 1) * 0.22 - (reqIdx - ceilIdx - 1) * 0.28));
        if (Math.random() < concede) return { status: 'accept', role: requested, message: `Alright — we'll let ${p.name} play as ${ROLE_LABEL[requested]}.` };
        if (round >= 4) return { status: 'final', role: ceil, message: `That's our final word — ${ROLE_LABEL[ceil]} at most for ${p.name}.` };
        return { status: 'counter', role: ceil, message: `We see ${p.name} more as a ${ROLE_LABEL[ceil]}, not a ${ROLE_LABEL[requested]}.` };
    },
    // ask the club to transfer-list your player; they may agree (more offers) or keep him
    requestTransferListing(p) {
        if (!this.isClient(p)) return { ok: false, message: 'Not your client.' };
        if (p.onLoanAt) return { ok: false, message: `${p.name} is away on loan.` };
        const club = Clubs.getClubById(p.clubId);
        if (!club) return { ok: false, message: `${p.name} has no club to list him.` };
        if (p.transferListed) return { ok: false, message: `${p.name} is already transfer-listed.` };
        const rel = this.relationship(club.id);
        const surplus = club.reputation - p.ability;     // >0 => player below club level (easier to release)
        let chance = 0.35 + surplus * 0.03 + (rel - 55) / 250
            + (['youth', 'fringe'].includes(p.squadRole) ? 0.15 : 0)
            - (['key', 'starter'].includes(p.squadRole) ? 0.20 : 0);
        chance = Math.max(0.05, Math.min(0.92, chance));
        if (Math.random() < chance) {
            p.transferListed = true;
            p._txOffersFrom = GameState.absWeek() + 1;
            GameState.addLog(`${club.name} agreed to transfer-list ${p.name}.`, 'info');
            GameState.addMail({ kind: 'news', subject: `${p.name} transfer-listed`, body: `${club.name} have agreed to list ${p.name}. Expect interested clubs to start coming in from next week.`, ttl: 5 });
            return { ok: true, message: `${club.name} agree to list ${p.name} — offers should start arriving next week.` };
        }
        this.changeRelationship(club.id, -1);
        return { ok: false, message: `${club.name} rate ${p.name} and won't list him right now. Try again later or build the relationship.` };
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
    // largest signing bonus the club will stomach for this player
    clubBonusWillingness(p, club, wage) {
        const fair = this.maxSigningBonus(p, wage);
        const rel = this.relationship(club ? club.id : null);
        const fit = p.ability - (club ? club.reputation : 45);
        const f = Math.max(0.08, Math.min(1, 0.42 + fit / 60 + (rel - 55) / 280));
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
    // the club weighs the WHOLE package (wage, role, term, signing bonus) at once and answers with one improved counter
    evaluateTransfer(p, club, pkg, round = 1) {
        const term = Math.max(1, Math.min(6, pkg.term || 3));
        const termFactor = 1 + (3 - term) * 0.05;                 // a shorter deal -> they'll stretch the wage
        const maxWage = Math.round(this.maxClubWage(p, club) * termFactor / 10) * 10;
        const roleCeil = this.clubRoleCeiling(p, club);
        const roleOk = ROLE_ORDER.indexOf(pkg.role) <= ROLE_ORDER.indexOf(roleCeil);
        const maxBonus = this.clubBonusWillingness(p, club, Math.min(pkg.wage, maxWage));
        const wageOk = pkg.wage <= maxWage, bonusOk = (pkg.bonus || 0) <= maxBonus;
        const counter = { wage: Math.min(pkg.wage, maxWage), role: roleOk ? pkg.role : roleCeil, term, bonus: Math.min(pkg.bonus || 0, maxBonus) };

        if (wageOk && roleOk && bonusOk) {
            const lines = [`“Good — we've got a deal for ${p.name}.”`, `“That package works for us. Welcome aboard, ${p.name}.”`, `“Agreed on all counts. Let's get it signed.”`];
            return { status: 'accept', counter, message: lines[Math.floor(Math.random() * lines.length)] };
        }
        if (round >= 4) return { status: 'final', counter, message: `“This is our final package: €${UI.money(counter.wage)}/wk, ${ROLE_LABEL[counter.role]}, ${term}yr, €${UI.money(counter.bonus)} bonus. Take it or leave it.”` };

        const bits = [];
        if (!wageOk) bits.push(`€${UI.money(pkg.wage)}/wk is more than we'll pay — we can do €${UI.money(maxWage)}`);
        if (!roleOk) bits.push(`we see him as a ${ROLE_LABEL[roleCeil]}, not a ${ROLE_LABEL[pkg.role]}`);
        if (!bonusOk) bits.push(`the €${UI.money(pkg.bonus || 0)} signing bonus is steep — €${UI.money(maxBonus)} is our limit`);
        const wageClose = pkg.wage <= maxWage * 1.08, bonusClose = (pkg.bonus || 0) <= maxBonus * 1.12;
        const hint = (!wageOk && term > 1) ? ` On a shorter contract we could push the wage higher.` : '';
        if (roleOk && wageClose && bonusClose) return { status: 'close', counter, message: `“We're almost there — ${bits.join('; ')}.${hint}”` };
        return { status: 'counter', counter, message: `“${bits.join('; ')}.${hint}”` };
    },

    acceptTransfer(mail, agreedWage, role, termSeasons, signingBonus) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        if (!p) return { ok: false, message: 'Player gone.' };
        const toClub = Clubs.getClubById(o.toClubId), fromClub = Clubs.getClubById(o.fromClubId);
        if (!toClub) return { ok: false, message: 'Club gone.' };
        if (p.onLoanAt) return { ok: false, message: `${p.name} is out on loan/with the reserves — he can't be transferred until he's back. He returns at the end of the season.` };
        const term = Math.max(1, Math.min(6, termSeasons || 3));

        const preSeason = GameState.week >= 48;   // negotiated in the off-season -> effectively a next-season move

        // at most one transfer per transfer window (skipped for pre-season deals)
        const winKey = GameState.transferWindowKey ? GameState.transferWindowKey() : null;
        if (!preSeason && winKey && p._txWindow === winKey)
            return { ok: false, message: `${p.name} has already changed clubs this transfer window — he can move again in the next window.` };

        // max two senior clubs per season (skipped for pre-season deals, since he'll arrive next season)
        const yr = GameState.seasonStartYear;
        const seniorSet = new Set();
        Object.values(p.stats[yr] || {}).forEach(st => { if (!st.youth && !isReserveClub(st.clubId)) seniorSet.add(st.clubId); });
        if (p.clubId && !isReserveClub(p.clubId)) seniorSet.add(p.clubId);
        if (!preSeason && !o.internal && !isReserveClub(toClub.id) && !seniorSet.has(toClub.id) && seniorSet.size >= 2)
            return { ok: false, message: `${p.name} has already turned out for two clubs this season — he can't join a third until next season.` };

        // the club won't hand out any role / signing bonus you ask for
        if (role && !this.roleAcceptable(p, toClub, role))
            return { ok: false, message: `${toClub.name} won't give ${p.name} a ${ROLE_LABEL[role]} role — the most they'll offer is ${ROLE_LABEL[this.clubRoleCeiling(p, toClub)]}. Lower the role and try again.` };
        const reqBonus = Math.max(0, Math.round(signingBonus || 0));
        const okBonus = this.clubBonusWillingness(p, toClub, agreedWage);
        if (reqBonus > okBonus)
            return { ok: false, message: `${toClub.name} won't pay a €${UI.money(reqBonus)} signing bonus for ${p.name} — they'll go to about €${UI.money(okBonus)}. Lower it and try again.` };

        const movingUp = toClub && fromClub && toClub.reputation > fromClub.reputation;
        const wasFree = this.isFreeAgent(p);
        const fee = wasFree ? 0 : o.transferFee;
        const bonus = reqBonus;

        GameState.agency.balance += bonus; GameState.addFinance('Transfer & loan bonuses', bonus);
        if (!p.history) p.history = { ability: [], wage: [], fees: [] };
        p.history.fees.push({ t: GameState.absWeek(), age: careerAge(p), value: fee, fromId: o.fromClubId, toId: o.toClubId });

        p.clubId = toClub.id; p.onLoanAt = null; p.loanUntilSeason = null; p.loanRole = null; p.freeAgent = false;
        if (winKey) p._txWindow = winKey;
        p.wage = agreedWage; p.contractUntilSeason = GameState.seasonStartYear + term;
        p.transferListed = false; p.loanListed = false;
        p.squadRole = (role && ROLE_ORDER.includes(role)) ? role : this.maxRoleAt(p, toClub);
        recordWagePoint(p);

        if (fromClub) this.changeRelationship(fromClub.id, o.initiatedByAgent ? +1 : +3);
        this.changeRelationship(toClub.id, +4);
        Agency.bumpRep(movingUp ? 3 + Math.random() * 3 : 1);
        if (movingUp) p.morale.club = Math.min(100, p.morale.club + 12);
        GameState.removeMail(mail.id);
        GameState.inbox = GameState.inbox.filter(m => !(m.kind === 'transfer' && m.offer.playerId === p.id));
        GameState.addLog(`${p.name} → ${toClub.name} for €${UI.money(fee)} (signing bonus €${UI.money(bonus)}).`, 'transfer');
        const myCut = Math.round(agreedWage * p.wageCommission / 100);
        return { ok: true, message: `${p.name} joins ${toClub.name} as ${ROLE_LABEL[p.squadRole]} until ${GameState.seasonLabelFor(p.contractUntilSeason)}. ${wasFree ? 'Free transfer. ' : ''}Signing bonus €${UI.money(bonus)}; your cut €${UI.money(myCut)}/wk.`, bonus };
    },

    acceptRenewal(mail, agreedWage, role, termSeasons) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        const club = Clubs.getClubById(o.clubId);
        if (!p || !club) return { ok: false, message: 'Gone.' };
        const term = Math.max(1, Math.min(6, termSeasons || o.proposedTermSeasons || 2));
        if (p._renewSeason === GameState.seasonStartYear)
            return { ok: false, message: `${p.name}'s deal has already been renegotiated this season — you can revisit it next season.` };
        if (role && !this.roleAcceptable(p, club, role))
            return { ok: false, message: `${club.name} won't give ${p.name} a ${ROLE_LABEL[role]} role — the most they'll offer is ${ROLE_LABEL[this.clubRoleCeiling(p, club)]}. Lower the role and try again.` };
        p.wage = agreedWage; p.contractUntilSeason = GameState.seasonStartYear + term; p.freeAgent = false; p._renewSeason = GameState.seasonStartYear;
        if (role && ROLE_ORDER.includes(role)) p.squadRole = role;
        recordWagePoint(p);
        this.changeRelationship(club.id, +2);
        p.morale.wage = Math.min(100, p.morale.wage + 10); p.morale.club = Math.min(100, p.morale.club + 4);
        GameState.removeMail(mail.id);
        GameState.addLog(`${p.name} renewed at ${club.name}: €${UI.money(agreedWage)}/wk until ${GameState.seasonLabelFor(p.contractUntilSeason)} (${ROLE_LABEL[p.squadRole]}).`, 'contract');
        return { ok: true, message: `Renewed: €${UI.money(agreedWage)}/wk as ${ROLE_LABEL[p.squadRole]} until end of ${GameState.seasonLabelFor(p.contractUntilSeason)}.` };
    },

    acceptLoanOffer(mail, role, durationCode) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        const borrower = Clubs.getClubById(o.toClubId);
        if (!p || !borrower) return { ok: false, message: 'Gone.' };
        const r = role || o.role || 'starter';
        const opts = this.loanDurationOptions();
        const code = (durationCode && opts.find(o2 => o2.code === durationCode)) ? durationCode : (opts[0] ? opts[0].code : '1');
        const end = this.computeLoanEnd(code);
        p.onLoanAt = borrower.id; p.loanUntilSeason = end.until; p.loanMid = end.mid; p.loanListed = false; p.loanRole = r;
        this.changeRelationship(borrower.id, +2);
        GameState.removeMail(mail.id);
        GameState.inbox = GameState.inbox.filter(m => !(m.kind === 'loan' && m.offer.playerId === p.id));
        const durLabel = (opts.find(o2 => o2.code === code) || {}).label || code;
        GameState.addLog(`${p.name} loaned to ${borrower.name} as ${ROLE_LABEL[r]} (${durLabel}).`, 'loan');
        return { ok: true, message: `${p.name} is on loan at ${borrower.name} (${ROLE_LABEL[r]}, ${durLabel}).` };
    },

    acceptSponsor(mail, optionIndex = 0) {
        const o = mail.offer, p = GameState.getPlayer(o.playerId);
        if (!p) return { ok: false, message: 'Gone.' };
        const opt = (o.options && o.options[optionIndex]) || (o.weeklyAmount != null ? { company: o.sponsorName, weekly: o.weeklyAmount, annual: 0, termSeasons: o.termSeasons || 1 } : null);
        if (!opt) return { ok: false, message: 'Offer expired.' };
        p.sponsorIncome += opt.weekly;
        if (!p.sponsorDeals) p.sponsorDeals = [];
        p.sponsorDeals.push({ company: opt.company, weekly: opt.weekly, annual: opt.annual, untilSeason: GameState.seasonStartYear + opt.termSeasons });
        // pay the first annual instalment now (your sponsor cut on it goes to the agency)
        const annualCut = Math.round((opt.annual || 0) * p.sponsorCommission / 100);
        if (annualCut) GameState.agency.balance += annualCut; GameState.addFinance('Sponsoring', annualCut);
        p.morale.agent = Math.min(100, p.morale.agent + 6);
        GameState.removeMail(mail.id);
        const weeklyCut = Math.round(opt.weekly * p.sponsorCommission / 100);
        GameState.addLog(`${p.name} signed ${opt.company}: +€${UI.money(opt.weekly)}/wk${opt.annual ? ' + €' + UI.money(opt.annual) + '/yr' : ''} for ${opt.termSeasons} season(s).`, 'sign');
        return { ok: true, message: `${p.name} signs with ${opt.company}: €${UI.money(opt.weekly)}/wk${opt.annual ? ' plus €' + UI.money(opt.annual) + '/yr' : ''} for ${opt.termSeasons} season(s). Your ${p.sponsorCommission}% = €${UI.money(weeklyCut)}/wk${annualCut ? ' + €' + UI.money(annualCut) + '/yr' : ''}.` };
    },

    declineMail(mail) { GameState.removeMail(mail.id); },

    // ---- injury treatments ----
    recoverInjury(p) {
        if (!p.injury) return;
        p.injuryHistory.push({ type: p.injury.type, weeks: p.injury.total, season: GameState.seasonLabel() });
        const t = `${p.name} has recovered from ${p.injury.type}.`;
        GameState.addLog(t, 'info'); GameState.addMail({ kind: 'news', cat: 'injury', subject: `${p.name} fit again`, body: t, ttl: 2 });
        p.injury = null;
    },
    treatPhysio(p) {
        if (!p.injury) return { ok: false, message: `${p.name} is fully fit.` };
        const aw = GameState.absWeek();
        if (p.injury.treatedWeek === aw) return { ok: false, message: `${p.name} has already had treatment this week.` };
        if (GameState.agency.balance < 1000) return { ok: false, message: 'Physio costs €1,000 — not enough cash.' };
        GameState.agency.balance -= 1000; GameState.addFinance('Physio treatments', -1000);
        p.injury.weeksOut = Math.max(0, p.injury.weeksOut - 0.5);
        p.injury.treatedWeek = aw;
        GameState.addLog(`Physio for ${p.name} (−0.5 wk, €1,000).`, 'money');
        if (p.injury.weeksOut <= 0) { this.recoverInjury(p); return { ok: true, message: `Physio session done — ${p.name} is fit again!` }; }
        return { ok: true, message: `Physio session done — ${p.name} now out ~${this._wk(p.injury.weeksOut)} more.` };
    },
    treatSpecialist(p) {
        if (!p.injury) return { ok: false, message: `${p.name} is fully fit.` };
        if (p.injury.specialistUsed) return { ok: false, message: `${p.name} has already seen the specialist for this injury.` };
        const aw = GameState.absWeek();
        if (p.injury.treatedWeek === aw) return { ok: false, message: `You can't see the specialist and do physio in the same week.` };
        if (GameState.agency.balance < 15000) return { ok: false, message: 'The specialist costs €15,000 — not enough cash.' };
        GameState.agency.balance -= 15000; GameState.addFinance('Specialists', -15000);
        p.injury.weeksOut = Math.round((p.injury.weeksOut / 2) / 0.5) * 0.5;
        p.injury.specialistUsed = true;
        p.injury.treatedWeek = aw;
        GameState.addLog(`Specialist for ${p.name} (halved recovery, €15,000).`, 'money');
        if (p.injury.weeksOut <= 0) { this.recoverInjury(p); return { ok: true, message: `The specialist worked wonders — ${p.name} is fit again!` }; }
        return { ok: true, message: `The specialist halved it — ${p.name} now out ~${this._wk(p.injury.weeksOut)} more.` };
    },
    _wk(w) { return (Math.round(w * 2) / 2) + ' week(s)'; },

    // ---------- gifts / release / listing ----------
    giftCost(tier) { return ({ small: 200, medium: 800, large: 2500 })[tier] || 200; },
    giftBoost(tier) { return ({ small: 5, medium: 12, large: 25 })[tier] || 5; },
    giveGift(p, tier) {
        const cost = this.giftCost(tier);
        if (GameState.agency.balance < cost) return { ok: false, message: 'Not enough money for that gift.' };
        GameState.addFinance('Gifts & relationships', -cost);
        GameState.agency.balance -= cost;
        p.morale.agent = Math.min(100, p.morale.agent + this.giftBoost(tier));
        GameState.addLog(`Gave ${p.name} a gift (−€${UI.money(cost)}). Agent morale up.`, 'info');
        return { ok: true, message: `${p.name} appreciated the gesture. Agent satisfaction is now ${Math.round(p.morale.agent)}/100.` };
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
        if (GameState.agency.balance < fee) return { ok: false, message: `You must pay out the contract (€${UI.money(fee)}) but can't afford it.` };
        GameState.addFinance('Release pay-outs', -fee);
        GameState.agency.balance -= fee;
        p.agentId = null; p.wageCommission = 0; p.sponsorCommission = 0; p.repUntilSeason = null;
        p.transferListed = false; p.loanListed = false; p.dismissedTalent = true;   // ex-client: out of clients & talent, kept in Client History
        GameState.addLog(`Released ${p.name} (paid out €${UI.money(fee)}).`, 'warn');
        return { ok: true, message: `${p.name} is no longer your client. Contract pay-out: €${UI.money(fee)}.` };
    },
    toggleTransferList(p) { p.transferListed = !p.transferListed; GameState.addLog(`${p.name} ${p.transferListed ? 'added to' : 'removed from'} transfer list.`, 'info'); return p.transferListed; },
    toggleLoanList(p) { p.loanListed = !p.loanListed; if (p.loanListed) p._loanOffersFrom = GameState.absWeek() + 1; GameState.addLog(`${p.name} ${p.loanListed ? 'added to' : 'removed from'} loan list.`, 'info'); return p.loanListed; },

    // ---------- helpers ----------
    estimateFee(p, targetClub) {
        let v = Math.exp(p.ability / 9) * 200;                 // ~6k at 4th-tier level, scaling steeply with ability
        v *= 1 + Math.max(0, p.potential - p.ability) / 40;
        if (p.age <= 20) v *= 1.25;
        if (p.age >= 30) v *= 0.6;
        if (targetClub) v *= 0.7 + targetClub.reputation / 140;
        return Math.max(500, Math.round(v / 500) * 500);
    },
    _offerObj(p, fromId, toId, fee, opts = {}) {
        const toClub = Clubs.getClubById(toId);
        return {
            playerId: p.id, fromClubId: fromId, toClubId: toId, transferFee: fee,
            proposedWage: PlayerGen.wageFor(p.ability, toClub ? toClub.tier : 3),
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
            wageComm: cl.reduce((s, p) => s + Math.round(p.wage * p.wageCommission / 100), 0),
            sponsorComm: cl.reduce((s, p) => s + Math.round(p.sponsorIncome * p.sponsorCommission / 100), 0),
            scoutWages: GameState.agency.scouts.reduce((s, sc) => s + sc.weeklyCost, 0),
            office: Upgrades.weeklyOfficeCost(),
            facilities: Upgrades.weeklyFacCost()
        };
    }
};
