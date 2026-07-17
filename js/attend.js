// ============================================================
//  Attend the Final — invitation triggers + queue (engine layer)
// ============================================================
// When a season-defining match is about to be quick-simmed and one of the agent's clients is at a
// club playing in it, capture the match so the agent can be invited to WATCH it live. Architecture
// (b) from the spec: the result is computed here by the normal engine, and the live view later
// choreographs a timeline that matches it exactly (see LiveSim.buildTimeline). Whether the popup
// appears before or after the numbers are drawn is invisible to the player — the sim is a
// deterministic replay of a result that already stands, so declining changes nothing and the season
// is never left in a half-simulated state (spec §5).
//
// Pure engine: no DOM. `consider` is called from the final-playing code in league.js / europe.js;
// the UI reads `GameState._attend` after advanceWeek and renders the invitations.

const Attend = {
    MAX_PER_WEEK: 3,   // you may WATCH at most three live matches in a processing week (decision 7)

    // start of a fresh processing week — the captured list is transient (not persisted): if the app
    // closes before the agent watches, the results already stand from the quick sim.
    reset() { GameState._attend = []; },
    pending() { return this.order(GameState._attend || []); },

    // ---- ordering: least reputable first, the showpiece last (decision) ----
    // Main national cups outrank their country's secondary cup; the European finals outrank both
    // (UECL < UEL < UCL). Ties: more clients on the pitch => later; then the agent's home country
    // => later; then the leagues-dropdown order of countries.
    MAIN_CUPS: new Set(['BEKER', 'FACUP', 'DFB', 'CDR', 'SCHWCUP', 'coppaitalia', 'coupefrance', 'tacaportugal', 'belgiancup']),
    EUROPE_PRESTIGE: { UECL: 2, UEL: 3, UCL: 4 },
    COUNTRY_ORDER: ['England', 'Germany', 'Spain', 'Italy', 'France', 'Netherlands', 'Portugal', 'Switzerland', 'Belgium', 'Liechtenstein'],

    _prestige(m) {
        if (m.kind === 'europe-final') return this.EUROPE_PRESTIGE[m.compId] || 2;
        if (m.kind === 'cup-final') return this.MAIN_CUPS.has(m.compId) ? 1 : 0;
        return 0;   // play-off / last-day deciders sit with the lower cups until specced otherwise
    },
    _matchCountry(m) {
        const inviter = this._inviterSide(m);
        const club = (typeof Clubs !== 'undefined') ? Clubs.getClubById(inviter === 'home' ? m.homeId : m.awayId) : null;
        return club ? club.country : '';
    },
    // home country sorts last; everyone else follows the leagues-dropdown order
    _countryRank(country) {
        const i = this.COUNTRY_ORDER.indexOf(country);
        const base = i < 0 ? this.COUNTRY_ORDER.length : i;
        const home = (typeof GameState !== 'undefined') && country === GameState.homeCountry;
        return (home ? 1000 : 0) + base;
    },
    order(list) {
        return list.slice().sort((a, b) =>
            this._prestige(a) - this._prestige(b) ||
            a.clients.length - b.clients.length ||
            this._countryRank(this._matchCountry(a)) - this._countryRank(this._matchCountry(b)));
    },

    // Called by the final-playing code. `r` is the League.playMatch result (carries homeAppear /
    // awayAppear — the per-player match detail). `extra` may carry { minutes, firstLeg, targetDivision,
    // pens } depending on the kind. Captures only when a client's club is in the tie and the weekly
    // cap has room.
    consider(kind, compId, homeId, awayId, r, extra = {}) {
        if (!GameState.agency) return;                       // no game yet
        if (this.pending().length >= this.MAX_PER_WEEK) return;
        const clients = [
            ...this._clientsAt(homeId, 'home', r && r.homeAppear),
            ...this._clientsAt(awayId, 'away', r && r.awayAppear),
        ];
        if (!clients.length) return;                          // nobody the agent represents is involved
        GameState._attend.push({
            id: 'att_' + GameState.seasonStartYear + '_' + GameState.week + '_' + this.pending().length,
            kind, compId, homeId, awayId,
            homeName: this._clubName(homeId), awayName: this._clubName(awayId),
            // extra.score / extra.winner carry the extra-time-inclusive result when a final went to ET
            hg: extra.score ? extra.score.hg : r.hg, ag: extra.score ? extra.score.ag : r.ag,
            winner: extra.winner || r.winner,
            pens: extra.pens || r.pens || null,
            et: !!extra.et,
            minutes: extra.minutes || 90,
            firstLeg: extra.firstLeg || null,                 // { scored, conceded } for the client's team, two-legged decider only
            targetDivision: extra.targetDivision || null,
            clients,
            week: GameState.week, season: GameState.seasonStartYear,
        });
    },

    // Every client whose club (or loan club) is `clubId`, captured whether or not he featured —
    // a fringe client still gets an invitation, honestly flagged (decision 6). `played` and his match
    // line come from the appear data if he was in the XI.
    _clientsAt(clubId, side, appear) {
        const out = [];
        if (!clubId || typeof Agency === 'undefined') return out;
        for (const p of Agency.clients()) {
            if (effectiveClubId(p) !== clubId) continue;
            const a = (appear || []).find(x => x.p === p);
            out.push({
                playerId: p.id, name: p.name, position: p.position, styleRole: p.styleRole,
                squadRole: p.squadRole, side, played: !!a,
                goals: a ? (a.g || 0) : 0, assists: a ? (a.a || 0) : 0,
                yellow: a ? (a.yellow || 0) : 0, red: a ? (a.red || 0) : 0,
                rating: a ? a.rating : null,   // the engine's match rating, for the live-view client panel
            });
        }
        return out;
    },
    _clubName(id) { return (typeof UI !== 'undefined' && UI.clubName) ? UI.clubName(id) : String(id); },

    // Human label for a match's competition + fixture, e.g. "the Cup Final".
    COMP_TITLES: { 'cup-final': 'Cup Final', 'europe-final': 'European Final', 'playoff-final': 'Promotion Play-off Final', 'title-decider': 'Title decider', 'promotion-decider': 'Promotion decider' },
    _compTitle(m) {
        if (typeof compName === 'function') { const n = compName(m.compId); if (n) return n + (m.kind === 'cup-final' || m.kind === 'europe-final' ? ' Final' : ''); }
        return this.COMP_TITLES[m.kind] || 'the match';
    },

    // The invitation letter + a short header, for the popup. Pure text.
    invitePayload(m) {
        const agent = (typeof GameState !== 'undefined' && GameState.agentName) ? GameState.agentName() : '';
        const inviter = this._inviterSide(m);                 // whichever side the client's club is
        const teamName = inviter === 'home' ? m.homeName : m.awayName;
        const oppName = inviter === 'home' ? m.awayName : m.homeName;
        const names = this._clientList(m.clients);
        const comp = this._compTitle(m);
        let body;
        if (m.kind === 'playoff-final' && m.firstLeg && typeof LiveSim !== 'undefined' && LiveSim.playoffFinalInvite) {
            body = LiveSim.playoffFinalInvite({ agentName: agent, client: names, teamName, oppName, targetDivision: m.targetDivision, firstLeg: m.firstLeg });
        } else {
            body = `Dear ${agent || 'Sir/Madam'},\n\n`
                + `${teamName} have reserved a seat for you: come and watch ${names} in the ${comp} against ${oppName}.`;
        }
        // honest caveat when a named client is unlikely to see much of the pitch (decision 6)
        const benchers = m.clients.filter(c => ['rotation', 'fringe', 'youth'].includes(c.squadRole));
        if (benchers.length) {
            const who = this._clientList(benchers);
            body += `\n\nA word of honesty: ${who} may not play much — ${benchers.length > 1 ? 'they are' : 'he is'} not a guaranteed starter — but you're welcome all the same.`;
        }
        return {
            id: m.id,
            title: `${teamName} — ${comp}`,
            header: `Watch ${names} in the ${comp} against ${oppName}`,
            body, teamName, oppName, competition: comp, clients: m.clients,
        };
    },
    _inviterSide(m) { return m.clients.some(c => c.side === 'home') ? 'home' : 'away'; },
    _clientList(clients) {
        const names = [...new Set(clients.map(c => c.name))];
        if (names.length === 1) return names[0];
        if (names.length === 2) return names[0] + ' and ' + names[1];
        return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
    },

    // Turn a captured match into a spec for LiveSim.buildTimeline. Only clients who actually
    // featured go into the timeline (an unplayed fringe client doesn't appear in the feed).
    timelineSpec(m) {
        return {
            homeName: m.homeName, awayName: m.awayName,
            hg: m.hg, ag: m.ag, minutes: m.minutes,
            clients: m.clients.filter(c => c.played).map(c => ({
                player: { id: c.playerId, name: c.name, position: c.position, styleRole: c.styleRole },
                side: c.side, goals: c.goals, assists: c.assists, yellow: c.yellow, red: c.red,
            })),
        };
    },

    // Result wiring: the timeline may have handed a client an anonymous team goal via a converted
    // penalty (LiveSim statAdjust). The match was already banked by the quick sim, so this ADDS that
    // goal to his season record for the competition — the "finals generate a tad more" allowance.
    // The team scoreline is untouched (the goal was always in it; it just gets a name now). Only
    // applied if the agent actually watched.
    applyStatAdjust(m, statAdjust) {
        if (!statAdjust || !statAdjust.length) return;
        const year = m.season;
        for (const adj of statAdjust) {
            const p = GameState.getPlayer(adj.player && adj.player.id);
            if (!p || !adj.goals) continue;
            const loan = !!p.onLoanAt;
            const c = statBucket(p, year, effectiveClubId(p), loan, false, m.compId);
            c.goals = (c.goals || 0) + adj.goals;
        }
    },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Attend };
