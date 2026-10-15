// ============================================================
//  Call-ups (docs/international.md, "Call-ups"): your clients in their national teams.
//
//  Before every window (weeks 10, 16, 35, 48) each national team with an eligible client names
//  its squad. A client's role comes from his rating against the team's skill level (reputation
//  + 2), bands scaled by population; position and group caps then push extra clients down. The
//  rest of every squad is virtual, at the team's reputation, so only clients are modelled.
//  Called-up starters and stars lift the team like clients lift a club: rep + sum(ability - rep)/11.
//
//  State on GameState.intl:
//    cu    { key: '2027:1', squads: { nationId: { list: [{ id, role }], boost } } } the current window
//    res   [[L, home, away, hg, ag, comp code, stage, neutral, tag]] every match of the last 104 weeks
//    fin   { nationId: [[comp, year, stage]] } how far a nation got at every tournament it played
//  On a player: intlStats { [season]: { [comp]: blankComp } }, intlNation.
// ============================================================
Object.assign(Internationals, {
    ROLE_RANK: { star: 0, starter: 1, rotation: 2, reserve: 3 },
    POS_GROUP: { GK: 'GK', CB: 'D', LB: 'D', RB: 'D', CDM: 'M', CM: 'M', CAM: 'M', LW: 'A', RW: 'A', ST: 'A' },

    // the national team a player can play for (by his nationality), or null
    nationOfPlayer(p) {
        if (!p || !p.nationality) return null;
        if (!this._natMap) { this._natMap = {}; NATIONS.forEach(n => { if (n.nationality && !n.suspended) this._natMap[n.nationality] = n.id; }); }
        return this._natMap[p.nationality] || null;
    },
    skillLevel(nid, y) { const C = INTL_CONFIG; return Math.min(C.REP_CAP, this.repAt(nid, y != null ? y : GameState.seasonStartYear)) + C.CALLUP_SKILL_OFFSET; },
    // the bands for a nation: { star, starter, rotation, reserve } = the lowest rating of each
    callupBands(nid, y) {
        const C = INTL_CONFIG, n = NATIONS_BY_ID[nid], S = this.skillLevel(nid, y);
        const pop = (n && n.population) || 0;
        const [, rot, res] = C.CALLUP_BANDS_BY_POP.find(b => pop < b[0]) || C.CALLUP_BANDS_BY_POP[C.CALLUP_BANDS_BY_POP.length - 1];
        return { skill: S, star: S + C.CALLUP_STAR_FROM, starter: S + C.CALLUP_STARTER_FROM, rotation: S - rot, reserve: S - res };
    },
    _naturalRole(ability, B) {
        return ability >= B.star ? 'star' : ability >= B.starter ? 'starter' : ability >= B.rotation ? 'rotation' : ability >= B.reserve ? 'reserve' : null;
    },
    _lower(a, b) { if (!a || !b) return null; return this.ROLE_RANK[a] >= this.ROLE_RANK[b] ? a : b; },
    // A nation's squad from its eligible clients: [{ id, role }]. Exposed for tests and the UI.
    pickSquad(nid, players, y) {
        const C = INTL_CONFIG, B = this.callupBands(nid, y);
        const XI = r => r === 'star' || r === 'starter';
        let cand = players.map(p => ({ p, role: this._naturalRole(p.ability, B) })).filter(c => c.role);
        // rated in the reserve band: picked by chance (a talent usually, an older player rarely)
        const RC = C.CALLUP_RESERVE_CHANCE;
        cand = cand.filter(c => c.role !== 'reserve' || Rng.next() < ((c.p.age || 0) <= C.CALLUP_YOUNG_MAX_AGE ? RC.young : c.p.intlCalled ? RC.capped : RC.uncapped));
        // within a position: the first (cap) keep their role, the next is rotation at best, the
        // one after reserve at best, anyone further misses out
        const byPos = {};
        cand.forEach(c => (byPos[c.p.position] = byPos[c.p.position] || []).push(c));
        Object.keys(byPos).forEach(pos => {
            const cap = C.CALLUP_XI_POS[pos] || 1;
            byPos[pos].sort((a, b) => b.p.ability - a.p.ability || (a.p.id < b.p.id ? -1 : 1)).forEach((c, i) => {
                if (i < cap) return;
                c.role = i === cap ? this._lower(c.role, 'rotation') : i === cap + 1 ? this._lower(c.role, 'reserve') : null;
            });
        });
        cand = cand.filter(c => c.role);
        // at most CALLUP_RESERVE_PER_LINE reserve per line, the best-rated
        ['GK', 'D', 'M', 'A'].forEach(g => cand.filter(c => c.role === 'reserve' && this.POS_GROUP[c.p.position] === g)
            .sort((a, b) => b.p.ability - a.p.ability || (a.p.id < b.p.id ? -1 : 1)).slice(C.CALLUP_RESERVE_PER_LINE).forEach(c => { c.role = null; }));
        cand = cand.filter(c => c.role);
        // starters + stars per group, then outfield in total: the lowest-rated drop to rotation
        const demote = (list, max) => list.filter(c => XI(c.role)).sort((a, b) => a.p.ability - b.p.ability).slice(0, Math.max(0, list.filter(c => XI(c.role)).length - max)).forEach(c => { c.role = 'rotation'; });
        ['D', 'M', 'A'].forEach(g => demote(cand.filter(c => this.POS_GROUP[c.p.position] === g), C.CALLUP_XI_GROUP[g]));
        demote(cand.filter(c => c.p.position !== 'GK'), C.CALLUP_XI_OUTFIELD);
        // squad limits: per position, per group (the wildcards: a group may take what the other
        // groups' minimums leave), 23 in all; the weakest role / rating misses out
        const M = C.CALLUP_GROUP_MIN, total = C.CALLUP_SQUAD_MAX;
        const groupMax = { GK: M.GK, D: total - M.GK - M.M - M.A, M: total - M.GK - M.D - M.A, A: total - M.GK - M.D - M.M };
        cand.sort((a, b) => this.ROLE_RANK[a.role] - this.ROLE_RANK[b.role] || b.p.ability - a.p.ability || (a.p.id < b.p.id ? -1 : 1));
        const nPos = {}, nGrp = {}, out = [];
        cand.forEach(c => {
            const pos = c.p.position, g = this.POS_GROUP[pos];
            if ((nPos[pos] || 0) >= (C.CALLUP_POS_MAX[pos] || 0) || (nGrp[g] || 0) >= groupMax[g] || out.length >= total) return;
            nPos[pos] = (nPos[pos] || 0) + 1; nGrp[g] = (nGrp[g] || 0) + 1;
            out.push({ id: c.p.id, role: c.role });
        });
        return out;
    },
    // clients who may be called up: by nation
    _eligibleClients() {
        const C = INTL_CONFIG, by = {};
        if (typeof Agency === 'undefined') return by;
        Agency.clients().forEach(p => {
            if (p.retired || p.injury || (p.age || 0) < C.CALLUP_MIN_AGE) return;
            const nid = this.nationOfPlayer(p); if (!nid) return;
            (by[nid] = by[nid] || []).push(p);
        });
        return by;
    },
    // the window a week belongs to: index into CALLUP_WINDOWS and the season it belongs to
    callupWindow(y, w) {
        const W = INTL_CONFIG.CALLUP_WINDOWS;
        for (let i = 0; i < W.length; i++) if (W[i].weeks.includes(w)) return { i, season: w <= 2 ? y - 1 : y, key: (w <= 2 ? y - 1 : y) + ':' + i };
        return null;
    },
    // name every squad for window `i` of season y (and tell the agent who made it)
    _callups(y, i, notify) {
        const I = this.state(), key = y + ':' + i, by = this._eligibleClients(), squads = {};
        const prev = this._year; this._year = y;
        const summer = i === INTL_CONFIG.CALLUP_WINDOWS.length - 1 ? this._summerNations(y) : null;
        Object.keys(by).forEach(nid => {
            if (summer && !summer.has(nid)) return;   // no match this summer: no squad
            const list = this.pickSquad(nid, by[nid], y);
            if (!list.length) return;
            list.forEach(e => { const p = GameState.getPlayer(e.id); if (p) { p.intlCalled = true; p.intlNation = nid; } });
            const rep = Math.min(INTL_CONFIG.REP_CAP, this.repAt(nid, y));
            const boost = list.filter(e => e.role === 'star' || e.role === 'starter').reduce((s, e) => s + Math.max(0, (GameState.getPlayer(e.id) || {}).ability - rep || 0) / 11, 0);
            squads[nid] = { list, boost: Math.round(boost * 100) / 100 };
        });
        this._year = prev;
        I.cu = { key, squads };
        if (notify && !this._silent) {
            const lines = [];
            Object.keys(squads).forEach(nid => squads[nid].list.forEach(e => {
                const p = GameState.getPlayer(e.id); if (!p) return;
                lines.push(I18n.t('intl.cu.line', { name: p.name, nation: this.name(nid) }));
            }));
            this._weekCallups = lines;   // the week summary lists them too (Sim.advanceWeek)
            if (lines.length) GameState.addMail({ kind: 'news', cat: 'callup', subject: I18n.t('intl.cu.subj', { n: lines.length }), body: I18n.t('intl.cu.body') + '\n' + lines.join('\n'), ttl: 3 });
        }
        return I.cu;
    },
    // the role's name, as for clubs (Star Player, Starter, ...; keepers: First Choice, Back Up, Third Keeper)
    ROLE_EN: { star: 'Star Player', starter: 'Starter', rotation: 'Rotation', reserve: 'Reserve', firstChoice: 'First Choice', backUp: 'Back Up', thirdKeeper: 'Third Keeper' },
    // every nation with a match in the summer window of season y: the tournaments, the Nations
    // League Finals (UEFA, AFC) and the Finalissima
    _summerNations(y) {
        const I = this.state(), S = I && I.seasons[y], out = new Set();
        if (!S) return out;
        const tour = T => { if (T) (T.groups || []).forEach(g => g.teams.forEach(id => out.add(id))); };
        const four = F => { if (F && F.sf) F.sf.forEach(m => { out.add(m.h); out.add(m.a); }); };
        tour(S.tour); four(S.finals);
        if (S.am) { tour(S.am.gold && S.am.gold.tour); tour(S.am.copa && S.am.copa.tour); }
        if (S.caf) { tour(S.caf.afq && S.caf.afq.tour); tour(S.caf.anl && S.caf.anl.tour); }
        if (S.ao) { tour(S.ao.ac && S.ao.ac.tour); tour(S.ao.onc && S.ao.onc.tour); four(S.ao.nl && S.ao.nl.finals); }
        // the Finalissima (week 50 of a season before a World Cup): last summer's EURO and Copa winners
        const P = I.seasons[y - 1];
        if (this.cyclePos && this.cyclePos(y) === 'NL_BEFORE' && P) {
            if (P.tour && P.tour.winner) out.add(P.tour.winner);
            if (P.am && P.am.copa && P.am.copa.tour && P.am.copa.tour.winner) out.add(P.am.copa.tour.winner);
        }
        return out;
    },
    // is he with his national team right now? Only during a window's weeks (11-12, 17-18, 36-37,
    // 49-2), never in between: that is all the game ever shows of a squad
    withSquadNow(p) {
        const I = this.state(); if (!I || !I.cu || !p) return false;
        const win = this.callupWindow(GameState.seasonStartYear, GameState.week);
        if (!win || win.key !== I.cu.key) return false;
        return Object.values(I.cu.squads).some(sq => sq.list.some(e => e.id === p.id));
    },
    roleName(role, pos) {
        const k = pos === 'GK' ? ({ star: 'star', starter: 'firstChoice', rotation: 'backUp', reserve: 'thirdKeeper' })[role] : role;
        return typeof tRole === 'function' ? tRole(k, this.ROLE_EN[k] || k) : (this.ROLE_EN[k] || k);
    },
    // the squads for the window a match is in (named now if a save never got them)
    _squadsFor(season, w) {
        const I = this.state(), win = this.callupWindow(w <= 2 ? season + 1 : season, w);
        if (!win) return null;
        if (!I.cu || I.cu.key !== win.key) this._callups(win.season, win.i, false);
        return I.cu.squads;
    },
    // a client's call-up right now: { nation, role } or null
    callupOf(p) {
        const I = this.state(); if (!I || !I.cu || !p) return null;
        for (const nid of Object.keys(I.cu.squads)) { const e = I.cu.squads[nid].list.find(x => x.id === p.id); if (e) return { nation: nid, role: e.role, key: I.cu.key }; }
        return null;
    },
    // match strength: the reputation, lifted by called-up starters and stars
    _strength(id) {
        const base = this.rep(id), I = this.state();
        if (!I || this._matchWeek == null || !I.cu || !I.cu.squads[id]) return base;
        const season = this._year != null ? this._year : GameState.seasonStartYear;
        const win = this.callupWindow(this._matchWeek <= 2 ? season + 1 : season, this._matchWeek);
        return win && win.key === I.cu.key ? base + I.cu.squads[id].boost : base;
    },

    // ------------------------------------------------------------ the call-up week + each match
    _callupWeek(y, w) {
        const W = INTL_CONFIG.CALLUP_WINDOWS;
        W.forEach((win, i) => { if (win.announce === w) this._callups(y, i, true); });
        this._pruneResults(this._absKey(y, w));   // match lists: only the last RESULTS_KEEP_WEEKS
    },
    // every international match (Internationals._record): results log, then the clients' minutes
    onInternationalMatch(fx) {
        const season = this._year != null ? this._year : GameState.seasonStartYear;
        this._logResult(fx, season);
        const squads = this._squadsFor(season, fx.w);
        if (!squads) return;
        [[fx.h, fx.hg, fx.ag], [fx.a, fx.ag, fx.hg]].forEach(([nid, gf, ga]) => { if (squads[nid]) this._clientsPlay(nid, squads[nid], fx, season, gf, ga); });
    },
    _clientsPlay(nid, sq, fx, season, gf, ga) {
        const C = INTL_CONFIG, comp = fx.c === 'INTL_WC' && fx.st === 'ic' ? 'INTL_WCPO' : (fx.c || 'INTL_FRIENDLY');
        const members = sq.list.map(e => ({ e, p: GameState.getPlayer(e.id) })).filter(m => m.p && !m.p.injury && !m.p.retired && m.p.agentId === 'me');
        const appear = [];
        // goalkeepers: one keeper plays; client keepers take their share of the slot in role order
        let u = Rng.next(), at = 0;
        members.filter(m => m.p.position === 'GK').sort((a, b) => this.ROLE_RANK[a.e.role] - this.ROLE_RANK[b.e.role]).forEach(m => {
            const sh = C.CALLUP_PLAY_GK[m.e.role] || 0;
            if (u >= at && u < at + sh && !appear.some(a => a.p.position === 'GK')) appear.push({ p: m.p, full: true, g: 0, a: 0 });
            at += sh;
        });
        members.filter(m => m.p.position !== 'GK').forEach(m => {
            if (Rng.next() >= (C.CALLUP_PLAY[m.e.role] || 0)) return;
            appear.push({ p: m.p, full: Rng.next() < (C.CALLUP_START[m.e.role] ?? 0.4), g: 0, a: 0 });
        });
        // the whole squad is with its national team this week, playing or not: not available to his club (the European qualifiers
        // in weeks 1-2 run while the summer tournaments finish)
        const I = this.state();
        const t = this._absKey(season, fx.w);
        if (!I.away || I.away.t !== t) I.away = { t, ids: [] };
        members.forEach(m => { if (!I.away.ids.includes(m.p.id)) I.away.ids.push(m.p.id); });
        if (!appear.length) return;
        // goals and assists: the clients on the pitch against the virtual rest of the XI
        const posW = { ST: 1.0, LW: 0.8, RW: 0.8, CAM: 0.7, CM: 0.4, CDM: 0.2, LB: 0.15, RB: 0.15, CB: 0.12, GK: 0.0 };
        const posWA = { ST: 1.0, LW: 0.95, RW: 0.95, CAM: 1.0, CM: 0.55, CDM: 0.3, LB: 0.4, RB: 0.4, CB: 0.12, GK: 0.015 };
        const rep = this.rep(nid), ghostAb = 0.5 + rep / 100, ghosts = Math.max(0, 11 - appear.length);
        const wG = a => (posW[a.p.position] ?? 0.3) * (0.5 + a.p.ability / 100), wA = a => (posWA[a.p.position] ?? 0.3) * (0.5 + a.p.ability / 100);
        for (let k = 0; k < gf; k++) {
            const tot = appear.reduce((s, a) => s + wG(a), 0) + ghosts * 0.45 * ghostAb;
            let r = Rng.next() * tot, pick = null;
            for (const a of appear) { r -= wG(a); if (r <= 0) { pick = a; break; } }
            if (!pick) continue;
            pick.g += 1;
            if (Rng.next() < 0.7) {
                const others = appear.filter(a => a !== pick), t2 = others.reduce((s, a) => s + wA(a) + 0.05, 0) + ghosts * 0.5 * ghostAb;
                let r2 = Rng.next() * t2;
                for (const a of others) { r2 -= wA(a) + 0.05; if (r2 <= 0) { a.a += 1; break; } }
            }
        }
        const yellowRate = { GK: 0.02, CB: 0.15, LB: 0.13, RB: 0.13, CDM: 0.15, CM: 0.11, CAM: 0.08, LW: 0.06, RW: 0.06, ST: 0.06 };
        const resultBonus = gf > ga ? 0.55 : gf === ga ? 0.05 : -0.4;
        appear.forEach(a => {
            const p = a.p;
            p.intlNation = nid;
            p.intlStats = p.intlStats || {};
            const sy = p.intlStats[season] || (p.intlStats[season] = {});
            const c = sy[comp] || (sy[comp] = blankComp());
            c.apps += 1; c.goals += a.g; c.assists += a.a;
            if (p.position === 'GK' && ga === 0) c.cs = (c.cs || 0) + 1;
            const rr = Rng.next(), yr = yellowRate[p.position] ?? 0.1;
            if (rr < yr * 0.06) { c.red += 1; a.card = 2; } else if (rr < yr) { c.yellow += 1; a.card = 1; }
            let rating = (typeof RATING_BASE !== 'undefined' ? RATING_BASE : 6.35) + (typeof levelGapRating === 'function' ? levelGapRating(p.ability - rep) : 0)
                + resultBonus + a.g * (typeof RATING_PER_GOAL !== 'undefined' ? RATING_PER_GOAL : 0.75) + a.a * (typeof RATING_PER_ASSIST !== 'undefined' ? RATING_PER_ASSIST : 0.5);
            if (ga === 0 && ['GK', 'CB', 'LB', 'RB'].includes(p.position)) rating += 0.6;
            if (ga >= 3 && ['GK', 'CB'].includes(p.position)) rating -= 0.45;
            if (typeof PlayerGen !== 'undefined' && PlayerGen.gauss) rating += PlayerGen.gauss(0, 0.62);
            if (typeof formBiasOf === 'function') rating += formBiasOf(p);
            rating = Math.max(4.0, Math.min(10, rating));
            c.ratingSum += rating; a.rating = rating;
            p._weekApps = (p._weekApps || 0) + (a.full ? 1 : 0.5);   // international minutes count for development too
        });
        // the match in the nation's list keeps what each client did in it (the nation page shows it):
        // [player, side (1 home), goals, assists, rating x10, card (1 yellow, 2 red), started]
        const I2 = this.state(), e = I2.res && I2.res[I2.res.length - 1];
        if (e && e[1] === fx.h && e[2] === fx.a) {
            while (e.length < 9) e.push(0);
            e[9] = (e[9] || []).concat(appear.map(a => [a.p.id, nid === fx.h ? 1 : 0, a.g, a.a, Math.round(a.rating * 10), a.card || 0, a.full ? 1 : 0]));
        }
    },
    // is a client with his national team this week (and so missing his club's match)?
    clientAway(p) {
        const I = this.state(); if (!I || !I.away || !p) return false;
        const y = GameState.seasonStartYear, w = GameState.week;
        return I.away.t === this._absKey(w <= 2 ? y - 1 : y, w) && I.away.ids.includes(p.id);
    },

    // ------------------------------------------------------------ results + finishes
    // a linear week number: season * 52 + week, weeks 1-2 counting as 53-54 of the season before
    _absKey(season, w) { return season * 52 + (w <= 2 ? w + 52 : w); },
    // one shared list, each match once: [L, home, away, hg, ag, comp code, stage, neutral, tag]
    // competition codes: a table kept in the save, append-only, so a later build adding a competition never shifts them
    _compCode(c) { const I = this.state(), T = I.rc || (I.rc = []); let i = T.indexOf(c); if (i < 0) { T.push(c); i = T.length - 1; } return i; },
    _compOf(code) { const T = (this.state() || {}).rc || []; return typeof code === 'number' ? (T[code] || 'INTL_FRIENDLY') : code; },
    _logResult(fx, season) {
        const I = this.state(); if (!I) return;
        if (!Array.isArray(I.res)) I.res = [];   // (an object per nation in the first builds of this)
        const tag = fx.pens ? fx.pens.h + '-' + fx.pens.a : fx.et ? 'e' : 0;
        const e = [this._absKey(season, fx.w || 0), fx.h, fx.a, fx.hg, fx.ag, this._compCode(fx.c || 'INTL_FRIENDLY'), fx.st || 0, fx.n ? 1 : 0, tag];
        while (e.length > 5 && !e[e.length - 1]) e.pop();
        I.res.push(e);
    },
    _pruneResults(L) {
        const I = this.state(); if (!I || !Array.isArray(I.res)) { if (I && I.res) I.res = []; return; }
        const cut = L - INTL_CONFIG.RESULTS_KEEP_WEEKS;
        if (I.res.some(e => e[0] < cut)) I.res = I.res.filter(e => e[0] >= cut);
    },
    // a nation's matches, newest first: { L, season, week, opp, gf, ga, comp, stage, venue: 'H'|'A'|'N', tag }
    nationResults(nid) {
        const I = this.state(), list = (I && Array.isArray(I.res)) ? I.res.slice().sort((a, b) => a[0] - b[0]) : [], out = [];
        for (let k = list.length - 1; k >= 0; k--) {
            const [L, h, a, hg, ag, cc, st, n, tg, cl] = list[k];
            if (h !== nid && a !== nid) continue;
            const home = h === nid, season = Math.floor((L - 3) / 52), wk = L - season * 52;
            const pens = typeof tg === 'string' && tg !== 'e' ? tg.split('-') : null;
            const tag = pens ? 'p' + (home ? pens[0] + '-' + pens[1] : pens[1] + '-' + pens[0]) : tg === 'e' ? 'e' : '';
            const clients = (cl || []).filter(c => c[1] === (home ? 1 : 0)).map(([id, side, g, as, r, card, full]) => ({ id, g, a: as, rating: r / 10, card, full: !!full }));
            out.push({ L, season, week: wk > 52 ? wk - 52 : wk, opp: home ? a : h, gf: home ? hg : ag, ga: home ? ag : hg, comp: this._compOf(cc), stage: st || '', venue: n ? 'N' : home ? 'H' : 'A', tag, clients });
        }
        return out;
    },
    // how far every team got: W, F, SF, QF, R16, R32, GS (best = lowest index)
    FINISH_ORDER: ['W', 'F', 'SF', 'QF', 'R16', 'R32', 'GS'],
    _recordFinishes(comp, year, T) {
        const I = this.state(); if (!I || !T) return;
        const F = I.fin || (I.fin = {}), K = T.ko || {}, stage = {};
        (T.groups || []).forEach(g => g.teams.forEach(id => { stage[id] = 'GS'; }));
        [['r32', 'R32'], ['r16', 'R16'], ['qf', 'QF'], ['sf', 'SF']].forEach(([k, code]) => [].concat(K[k] || []).forEach(m => {
            if (!m || m.hg == null) return;
            const lo = this.loserOf(m); if (lo) stage[lo] = code;
            const wi = this.winnerOf(m); if (wi && (!stage[wi] || stage[wi] === 'GS')) stage[wi] = code;
        }));
        if (T.winner) stage[T.winner] = 'W';
        if (T.runnerUp) stage[T.runnerUp] = 'F';
        Object.keys(stage).forEach(id => (F[id] = F[id] || []).push([comp, year, stage[id]]));
        if (T.winner) this._intlTrophy(T.winner, comp, year);
    },
    // every client in the winner's squad gets the title (p.intlTrophies)
    _intlTrophy(nid, comp, year) {
        const I = this.state(), sq = I && I.cu && I.cu.squads[nid]; if (!sq) return;
        sq.list.forEach(e => { const p = GameState.getPlayer(e.id); if (p && p.agentId === 'me') (p.intlTrophies = p.intlTrophies || []).push({ comp, year, nation: nid, season: this._year != null ? this._year : GameState.seasonStartYear }); });
    },
    // a four-team Finals (Nations League): winner, runner-up, the two semi-final losers
    _recordFinals4(comp, season, Fin) {
        if (!Fin || !Fin.final) return;
        this._recordFinishes(comp, season, { groups: [], ko: { sf: Fin.sf }, winner: this.winnerOf(Fin.final), runnerUp: this.loserOf(Fin.final) });
    },
    nationFinishes(nid) { const I = this.state(); return ((I && I.fin && I.fin[nid]) || []).map(([comp, year, stage]) => ({ comp, year, stage })); },
});
