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
    resetCaptures() { GameState._attend = []; GameState._attendSnapshots = {}; },
    pending() { return this.order(GameState._attend || []); },
    // pre-final-round league table, stashed while the final round is played and hidden (see league.js)
    stashLeagueSnapshot(div, rows) { (GameState._attendSnapshots = GameState._attendSnapshots || {})[div] = rows; },
    // is a division's final round still hidden? (it has an unwatched title/promotion decider)
    leagueRoundHidden(div) {
        const w = this.window(); if (!w) return false;
        return w.finals.some((m, i) => (m.kind === 'title-decider' || m.kind === 'promotion-decider') && m.compId === div && i > w.pointer);
    },
    leagueSnapshot(div) { const w = this.window(); return (w && w.leagueSnapshots) ? w.leagueSnapshots[div] : null; },

    // ================================================================ the viewing WINDOW
    // After the finals are played, the invited ones become a persisted "window": an ordered list you
    // can watch through, up to WATCH_CAP, forward only. Watching a game reveals it and every earlier
    // (less prestigious) one — those finals are now in the past. Until revealed, a final's result is
    // hidden in the Competitions tab (Attend.isHidden). The window closes — revealing everything —
    // when you advance past it (finalizeWindow).
    window() { return (typeof GameState !== 'undefined') ? GameState.attendWindow : null; },

    // The finals are spread across the week by COMPETITION, not by prestige, so you can attend several
    // (they no longer all pile onto one weekend). Fixed days: Mon lower cups + the Liechtensteiner Cup,
    // Tue Conference League, Wed lower-league title/promotion deciders, Thu Europa League, Fri higher
    // (main national) cups, Sat top-division title deciders, Sun Champions League.
    _dayFor(m) {
        if (m.kind === 'europe-final') return ({ UCL: 'Sunday', UEL: 'Thursday', UECL: 'Tuesday' })[m.compId] || 'Tuesday';
        if (m.kind === 'cup-final') {
            if (m.compId === 'LICHCUP') return 'Monday';
            return this.MAIN_CUPS.has(m.compId) ? 'Friday' : 'Monday';
        }
        if (m.kind === 'title-decider') {
            const tier = (typeof Clubs !== 'undefined' && Clubs.DIV_TIERS) ? Clubs.DIV_TIERS[m.compId] : 1;
            return tier === 1 ? 'Saturday' : 'Wednesday';
        }
        return 'Wednesday';   // play-off / promotion deciders sit with the lower-league deciders
    },
    // several kick-off times per day, so multiple same-day finals get distinct slots for the travel/
    // clash check; cycles (with a widening offset) if a day somehow holds more finals than listed times
    DAY_SLOTS: {
        Monday: ['18:00', '20:00', '20:45', '19:00', '21:00'],
        Tuesday: ['20:00', '18:00', '21:00'],
        Wednesday: ['13:00', '15:30', '18:00', '20:30', '14:00', '16:30', '19:00', '21:00', '12:30', '17:00'],
        Thursday: ['20:00', '18:00', '21:00'],
        Friday: ['18:00', '20:00', '20:45', '19:00', '21:00'],
        Saturday: ['12:30', '15:00', '17:30', '20:00', '13:30', '16:00', '18:30', '21:00', '14:00', '19:00'],
        Sunday: ['20:00', '18:00', '16:00', '21:00'],
    },
    _assignSchedule(finals) {
        const perDay = {};
        finals.forEach(m => {
            const day = this._dayFor(m);
            const slots = this.DAY_SLOTS[day] || ['20:00'];
            const n = (perDay[day] = (perDay[day] || 0) + 1) - 1;
            m.day = day;
            m.time = slots[n % slots.length];
            if (n >= slots.length) { const [h, mi] = m.time.split(':').map(Number); m.time = String(h + Math.floor(n / slots.length)).padStart(2, '0') + ':' + String(mi).padStart(2, '0'); }
        });
    },

    openWindow(captures) {
        if (!captures || !captures.length) return null;
        const finals = captures.slice();
        this._assignSchedule(finals);
        finals.sort((a, b) => (this._slotMinutes(a) || 0) - (this._slotMinutes(b) || 0));   // chronological: Mon → Sun
        GameState.attendWindow = {
            season: GameState.seasonStartYear, week: GameState.week,
            finals, pointer: -1, watched: 0, attended: [],
            leagueSnapshots: GameState._attendSnapshots || {},   // pre-round tables for hidden title deciders
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
    // watchable = not yet passed, you have watches left (cannot jump back in time), and it doesn't
    // clash with a final you're already attending (decision 6)
    isWatchable(i) { const w = this.window(); return !!w && i > w.pointer && w.watched < this.WATCH_CAP && !this._attendClash(i); },
    watchesLeft() { const w = this.window(); return w ? Math.max(0, this.WATCH_CAP - w.watched) : 0; },
    hasUnwatched() { const w = this.window(); return !!w && w.finals.some((_, i) => this.isWatchable(i)); },

    // Record that the game at index i was watched: it and everything before it are now revealed.
    watch(i) {
        const w = this.window(); if (!w || !this.isWatchable(i)) return false;
        w.pointer = Math.max(w.pointer, i); w.watched += 1;
        (w.attended = w.attended || []).push(i);   // remember its slot so later finals can't clash with it
        // showing up for his big day is one of the strongest bonds an agent can build (js/dialogue.js)
        if (typeof Dialogue !== 'undefined') {
            const m = w.finals[i];
            if (m && m.clients) m.clients.forEach(c => {
                const p = GameState.getPlayer(c.playerId);
                if (p) Dialogue.addBond(p, 6, 'you were there for his final');
            });
        }
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

    // is a play-off final object (single-match or two-legged) an unwatched invitation?
    poFinalHidden(finalObj) { return !!(finalObj && finalObj._attendId && this.isHidden(finalObj._attendId)); },

    // Main national cups play their final on Friday; each country's secondary/lower-league cups (KBEK,
    // LLC, LPOKAL, CUPABASS, NOTRECOUPE, COUPENAT, SEGTACA, CFED, COPPACOMP) and the Liechtensteiner
    // Cup play on Monday. See _dayFor for the full week map.
    MAIN_CUPS: new Set(['BEKER', 'FACUP', 'DFB', 'CDR', 'SCHWCUP', 'COPPA', 'COUPEFR', 'TACAPT', 'BELCUP']),
    _matchCountry(m) {
        const inviter = this._inviterSide(m);
        const club = (typeof Clubs !== 'undefined') ? Clubs.getClubById(inviter === 'home' ? m.homeId : m.awayId) : null;
        return club ? club.country : '';
    },
    // display order for the transient capture list — chronological by the fixed day map
    order(list) {
        const di = m => { const d = this.DAY_INDEX[this._dayFor(m)]; return d != null ? d : 9; };
        return list.slice().sort((a, b) => di(a) - di(b) || a.clients.length - b.clients.length);
    },

    // ---- travel: you can't be in two places at once (decision 6) ----
    DAY_INDEX: { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 },
    // a slot as an absolute minute of the finals weekend (Mon 00:00 = 0), or null if unscheduled
    _slotMinutes(m) {
        const d = this.DAY_INDEX[m && m.day]; if (d == null || !m.time) return null;
        const [h, min] = String(m.time).split(':').map(Number);
        return d * 1440 + (h || 0) * 60 + (min || 0);
    },
    // two finals you can't both attend: in different countries on the same day (no dashing between
    // countries), or in the same country less than the travel gap (more than 3 hours) apart.
    _clashes(a, b) {
        const ma = this._slotMinutes(a), mb = this._slotMinutes(b);
        if (ma == null || mb == null) return false;
        const sameDay = Math.floor(ma / 1440) === Math.floor(mb / 1440);
        const ca = this._matchCountry(a), cb = this._matchCountry(b);
        if (ca && cb && ca !== cb) return sameDay;   // different countries → only a same-day clash
        return Math.abs(ma - mb) <= 180;             // same country → need MORE than 3 hours between
    },
    // does final i clash with any final you've already committed to attending this weekend?
    _attendClash(i) {
        const w = this.window(); if (!w || !w.attended || !w.attended.length) return false;
        const cand = w.finals[i];
        return w.attended.some(j => this._clashes(cand, w.finals[j]));
    },
    // why final i can't be attended right now (for the overview), or null if it can
    watchBlockReason(i) {
        const w = this.window(); if (!w) return null;
        if (i <= w.pointer) return 'in the past';
        if (this._attendClash(i)) return 'clashes with your schedule';
        if (w.watched >= this.WATCH_CAP) return 'no watches left';
        return null;
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
            regScore: extra.regScore || null,   // score at 90' (level when the final went to ET) — see timelineSpec._etGoals
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
            // a loaned-in player follows the role his loan deal guaranteed, not his parent-club standing
            // (mirrors assignStats' baseRole) — so the "may not play" caveat reflects where he'll actually
            // line up: a youth prospect loaned out as a star is a star at the loan club.
            const effRole = p.onLoanAt === clubId ? (p.loanRole || 'starter') : p.squadRole;
            out.push({
                playerId: p.id, name: p.name, position: p.position, styleRole: p.styleRole,
                squadRole: effRole, side, played: !!a,
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
        const divName = (typeof compName === 'function') ? compName(m.compId) : null;
        if (m.kind === 'title-decider') return (divName || 'League') + ' title decider';
        if (m.kind === 'promotion-decider') return (divName || 'League') + ' promotion decider';
        if (divName) return divName + (['cup-final', 'europe-final', 'playoff-final'].includes(m.kind) ? ' Final' : '');
        return this.COMP_TITLES[m.kind] || 'the match';
    },

    // The invitation letter + a short header, for the popup. Pure text.
    invitePayload(m) {
        const agent = (typeof GameState !== 'undefined' && GameState.agentName) ? GameState.agentName() : '';
        const inviter = this._inviterSide(m);                 // the club with MORE of your clients invites you
        const teamName = inviter === 'home' ? m.homeName : m.awayName;
        const oppName = inviter === 'home' ? m.awayName : m.homeName;
        const ownClients = m.clients.filter(c => c.side === inviter);       // the inviting club's players
        const oppClients = m.clients.filter(c => c.side !== inviter);       // your clients on the OTHER side
        const names = this._clientList(ownClients);
        const comp = this._compTitle(m);
        let body;
        if (m.kind === 'playoff-final' && m.firstLeg && typeof LiveSim !== 'undefined' && LiveSim.playoffFinalInvite) {
            // firstLeg is stored from the deciding leg's HOME team; flip it for an away-team inviter
            const fl = inviter === 'home' ? m.firstLeg : { scored: m.firstLeg.conceded, conceded: m.firstLeg.scored };
            body = LiveSim.playoffFinalInvite({ agentName: agent, client: names, teamName, oppName, targetDivision: m.targetDivision, firstLeg: fl });
        } else {
            body = `Dear ${agent || 'Sir/Madam'},\n\n`
                + `${teamName} have reserved a seat for you: come and watch ${names} in the ${comp} against ${oppName}.`;
        }
        // your clients on the opposing side are named separately, with their real club (D1)
        if (oppClients.length) {
            body += `\n\n(${this._clientList(oppClients)} also play${oppClients.length > 1 ? '' : 's'} in this game, but for ${oppName}.)`;
        }
        // honest caveat when a named client is unlikely to see much of the pitch (decision 6) — inviter's players only
        const benchers = ownClients.filter(c => ['rotation', 'fringe', 'youth'].includes(c.squadRole));
        if (benchers.length) {
            const who = this._clientList(benchers);
            body += `\n\nA word of honesty: ${who} may not play much — ${benchers.length > 1 ? 'they are' : 'he is'} not a guaranteed starter — but you're welcome all the same.`;
        }
        // a last-day title decider hinges on more than this pitch: even a win may not be enough
        if (m.kind === 'title-decider') {
            body += `\n\nOne caveat: this is the last day, and the title isn't in their hands alone — even a win may not be enough if the rivals get their result too.`;
        }
        return {
            id: m.id,
            title: `${teamName} — ${comp}`,
            header: `Watch ${names} in the ${comp} against ${oppName}`,
            body, teamName, oppName, competition: comp, clients: m.clients,
        };
    },
    // the club with MORE of your clients sends the invite (a tie, or clients only one side, favours home)
    _inviterSide(m) {
        const h = (m.clients || []).filter(c => c.side === 'home').length;
        const a = (m.clients || []).filter(c => c.side === 'away').length;
        return a > h ? 'away' : 'home';
    },
    _clientList(clients) {
        const names = [...new Set(clients.map(c => c.name))];
        if (names.length === 1) return names[0];
        if (names.length === 2) return names[0] + ' and ' + names[1];
        return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
    },

    // Turn a captured match into a spec for LiveSim.buildTimeline. Only clients who actually
    // featured go into the timeline (an unplayed fringe client doesn't appear in the feed).
    // goals scored in extra time = final score − score at 90' (0 for anything that didn't win in ET)
    _etGoals(m) {
        if (!m.regScore) return { home: 0, away: 0 };
        return { home: Math.max(0, (m.hg || 0) - (m.regScore.hg || 0)), away: Math.max(0, (m.ag || 0) - (m.regScore.ag || 0)) };
    },
    timelineSpec(m) {
        return {
            homeName: m.homeName, awayName: m.awayName,
            hg: m.hg, ag: m.ag, minutes: m.minutes,
            // regulation events all sit inside 90'; the clock then runs on (empty for a shootout, or
            // carrying the extra-time goals) toward `minutes`. See buildTimeline's stampWindow split.
            regulation: Math.min(m.minutes || 90, 90),
            etGoals: this._etGoals(m),
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
