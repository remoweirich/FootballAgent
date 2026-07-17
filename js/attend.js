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
    CAPTURE_CAP: 12,   // how many invited finals a single week can hold (wk 47 tops out around this)
    WATCH_CAP: 3,      // you may WATCH at most three of them live (decision 7)

    // ---- the transient capture list, filled by consider() during simulateWeek ----
    resetCaptures() { GameState._attend = []; },
    pending() { return this.order(GameState._attend || []); },

    // ================================================================ the viewing WINDOW
    // After the finals are played, the invited ones become a persisted "window": an ordered list you
    // can watch through, up to WATCH_CAP, forward only. Watching a game reveals it and every earlier
    // (less prestigious) one — those finals are now in the past. Until revealed, a final's result is
    // hidden in the Competitions tab (Attend.isHidden). The window closes — revealing everything —
    // when you advance past it (finalizeWindow).
    window() { return (typeof GameState !== 'undefined') ? GameState.attendWindow : null; },

    // Open a window from this week's captures (called at the end of advanceWeek). Least reputable
    // first, so the showpiece is the last thing you watch.
    // A finals weekend, in chronological order (Mon evening → Sun night). Assigning the LAST n slots
    // to the n finals puts the showpiece last (Sun night) and keeps the order chronological =
    // prestige; small fields sit on the weekend, only a big one spills onto weekday evenings.
    SCHEDULE_SLOTS: [
        ['Monday', '20:00'], ['Tuesday', '20:00'], ['Wednesday', '20:00'], ['Thursday', '20:00'],
        ['Friday', '19:45'], ['Friday', '20:45'],
        ['Saturday', '14:30'], ['Saturday', '16:00'], ['Saturday', '17:00'], ['Saturday', '18:30'], ['Saturday', '19:45'], ['Saturday', '20:45'],
        ['Sunday', '14:30'], ['Sunday', '16:00'], ['Sunday', '17:00'], ['Sunday', '18:00'], ['Sunday', '18:30'], ['Sunday', '19:45'], ['Sunday', '20:45'],
    ],
    _assignSchedule(finals) {
        const slots = this.SCHEDULE_SLOTS, n = finals.length;
        const chosen = slots.slice(Math.max(0, slots.length - n));
        while (chosen.length < n) chosen.unshift(slots[0]);   // more finals than slots (never, really)
        finals.forEach((m, i) => { m.day = chosen[i][0]; m.time = chosen[i][1]; });
    },

    openWindow(captures) {
        if (!captures || !captures.length) return null;
        const finals = this.order(captures);
        this._assignSchedule(finals);
        GameState.attendWindow = {
            season: GameState.seasonStartYear, week: GameState.week,
            finals, pointer: -1, watched: 0,
        };
        // each invite also lands in the inbox individually (the row opens the overview, not a mail
        // detail — see the inbox renderer's 'attend' special-case)
        if (GameState.addMail) for (const m of GameState.attendWindow.finals) {
            const inv = this.invitePayload(m);
            GameState.addMail({ kind: 'attend', subject: inv.header, body: inv.body, attendId: m.id, ttl: 3 });
        }
        return GameState.attendWindow;
    },
    // Close the window — everything it held is now revealed (isHidden looks it up, and there is no
    // window to find). Called at the start of the next advanceWeek, when the finals are in the past.
    finalizeWindow() { if (typeof GameState !== 'undefined') GameState.attendWindow = null; },

    windowFinals() { const w = this.window(); return w ? w.finals : []; },
    // index <= pointer means the game has been reached in time and its result is out
    isRevealed(i) { const w = this.window(); return !w || i <= w.pointer; },
    // watchable = not yet passed, and you have watches left (cannot jump back in time)
    isWatchable(i) { const w = this.window(); return !!w && i > w.pointer && w.watched < this.WATCH_CAP; },
    watchesLeft() { const w = this.window(); return w ? Math.max(0, this.WATCH_CAP - w.watched) : 0; },
    hasUnwatched() { const w = this.window(); return !!w && w.finals.some((_, i) => this.isWatchable(i)); },

    // Record that the game at index i was watched: it and everything before it are now revealed.
    watch(i) {
        const w = this.window(); if (!w || !this.isWatchable(i)) return false;
        w.pointer = Math.max(w.pointer, i); w.watched += 1;
        return true;
    },
    // Is THIS final (identified by the id stamped on its tie) still hidden? True only while its
    // window entry exists and it has not yet been reached.
    isHidden(attendId) {
        const w = this.window(); if (!w || !attendId) return false;
        const i = w.finals.findIndex(m => m.id === attendId);
        return i >= 0 && i > w.pointer;
    },
    // Is a cup/Europe object's FINAL still hidden? Looks at the last round's tie for the stamped
    // id. Used to suppress the "🏆 Winner" banners (and the league-table trophy) alongside the score.
    cupWinnerHidden(cupObj) {
        if (!cupObj || !this.window()) return false;
        const rounds = cupObj.results || [];
        const last = rounds[rounds.length - 1];
        const ft = last && (last.ties || []).find(t => t._attendId);
        if (ft) return this.isHidden(ft._attendId);
        if (cupObj.ko && cupObj.ko.final && cupObj.ko.final._attendId) return this.isHidden(cupObj.ko.final._attendId);
        return false;
    },

    // the next watchable final's fixture label, for the "Attend X vs Y" button
    nextWatchableLabel(afterIndex) {
        const w = this.window(); if (!w) return null;
        for (let i = afterIndex + 1; i < w.finals.length; i++)
            if (this.isWatchable(i)) return w.finals[i].homeName + ' vs ' + w.finals[i].awayName;
        return null;
    },

    // ---- ordering: least reputable first, the showpiece last (decision) ----
    // Main national cups outrank their country's secondary cup; the European finals outrank both
    // (UECL < UEL < UCL). Ties: more clients on the pitch => later; then the agent's home country
    // => later; then the leagues-dropdown order of countries.
    // the id each MAIN national cup FINAL is played under (see League.*Step); the secondary cups
    // (KBEK, LLC, LPOKAL, CUPABASS, LICHCUP, NOTRECOUPE, COUPENAT, SEGTACA, CFED, COPPACOMP) and the
    // minor Liechtensteiner Cup sit at the lower tier (prestige 0)
    MAIN_CUPS: new Set(['BEKER', 'FACUP', 'DFB', 'CDR', 'SCHWCUP', 'COPPA', 'COUPEFR', 'TACAPT', 'BELCUP']),
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
        if (!GameState.agency || !GameState._attend) return null;   // no game / not in a capture phase
        if (GameState._attend.length >= this.CAPTURE_CAP) return null;
        const clients = [
            ...this._clientsAt(homeId, 'home', r && r.homeAppear),
            ...this._clientsAt(awayId, 'away', r && r.awayAppear),
        ];
        if (!clients.length) return null;                     // nobody the agent represents is involved
        const match = {
            id: 'att_' + GameState.seasonStartYear + '_' + GameState.week + '_' + GameState._attend.length,
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
        };
        GameState._attend.push(match);
        return match;   // the caller stamps the tie with match.id so the result can be hidden
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
