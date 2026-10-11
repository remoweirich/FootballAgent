// ============================================================
//  International football (docs/international.md): Nations League, European Qualifiers,
//  EURO and World Cup for the 54 UEFA nations, plus placeholder pools for the World Cup.
//
//  State lives in GameState.intl (saved with the game):
//    seeding      54 UEFA ids, seeding rank order (drives NL pots and qualifier leagues)
//    nlLeagues    { A, B, C }: Nations League membership for the next edition, in seeding order
//    hosts        drawn hosts by tournament key ('EURO-2036'); awarded ones are in INTL_CONFIG.HOSTS
//    seasons      { [startYear]: season } — the current season and the previous one only
//    honours      { NL, EURO, WC }: roll of honour
//    last         { year, week } last week processed: step() catches up from here, so a save
//                 that predates international football (or skipped a week) settles by itself
//
//  A season's tournament (weeks 49-52 + weeks 1-2 of the next season) belongs to that season.
//  Nothing here throws into the weekly simulation: a failed assertion is logged and kept in
//  intl.warnings, and only throws when Internationals.STRICT is set (the tests do that).
// ============================================================
const Internationals = {
    STRICT: false,
    _silent: false,
    // Hook for call-ups (not built yet): called once for every international match played.
    onInternationalMatch(fixture) {},

    // ------------------------------------------------------------ basics
    cfg() { return INTL_CONFIG; },
    state() { return GameState.intl || null; },
    seasonType(startYear) {
        if (startYear % 2 === 0) return 'NATIONS_LEAGUE';
        return ((startYear + 1) % 4 === 0) ? 'EURO' : 'WORLD_CUP';
    },
    active(startYear) { return startYear >= INTL_CONFIG.FIRST_SEASON; },
    // an international break (not the summer tournament window) in a season with international football
    isBreakWeek(y = GameState.seasonStartYear, w = GameState.week) { return this.active(y) && INTL_CONFIG.BREAK_WEEKS.includes(w); },
    // the tournament played at the end of season `y` ('EURO-2028'), or null in a Nations League season
    tournamentKey(y) {
        const t = this.seasonType(y);
        return t === 'NATIONS_LEAGUE' ? null : (t === 'EURO' ? 'EURO-' : 'WC-') + (y + 1);
    },
    euroSize(tournamentYear) { return tournamentYear >= INTL_CONFIG.EURO_32_FROM ? 32 : 24; },
    nation(id) { return NATIONS_BY_ID[id] || null; },
    rep(id) { const n = NATIONS_BY_ID[id]; return n ? n.reputation : 50; },
    name(id) { const n = NATIONS_BY_ID[id]; return n ? n.name : id; },
    conf(id) { const n = NATIONS_BY_ID[id]; return n ? n.confederation : null; },
    uefaIds() { return NATIONS.filter(n => n.confederation === 'UEFA').map(n => n.id); },
    _shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Rng.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    _assert(ok, msg) {
        if (ok) return true;
        const I = this.state();
        if (I) { I.warnings = I.warnings || []; I.warnings.push(msg); if (I.warnings.length > 30) I.warnings.splice(0, I.warnings.length - 30); }
        if (typeof console !== 'undefined' && console.error) console.error('[international] ' + msg);
        if (this.STRICT) throw new Error('[international] ' + msg);
        return false;
    },
    // Efraimidis-Spirakis: weighted sampling without replacement. Returns ALL items in draw
    // order, so the first k are a weighted sample of k and the next ones continue it.
    _weightedOrder(items, weightOf) {
        return items.map(x => ({ x, k: Math.pow(Rng.next() || 1e-12, 1 / Math.max(1e-9, weightOf(x))) }))
            .sort((a, b) => b.k - a.k).map(o => o.x);
    },

    // ------------------------------------------------------------ lifecycle
    _fresh() {
        const seeding = this.uefaIds().sort((a, b) => this.rep(b) - this.rep(a) || (a < b ? -1 : 1));
        const L = INTL_CONFIG.NL_LEAGUE_SIZE;
        return {
            v: 1, seeding,
            nlLeagues: { A: seeding.slice(0, L), B: seeding.slice(L, 2 * L), C: seeding.slice(2 * L, 3 * L) },
            prevPlayoffPairs: [], hosts: {}, seasons: {}, honours: { NL: [], EURO: [], WC: [] }, warnings: [],
            last: null,
        };
    },
    // Bring international football up to the current week. Creates the state the first time a
    // season from FIRST_SEASON on is reached (new game, or a save from before this feature) and
    // silently plays every week of the current season that has already passed. Never builds a
    // previous season's competitions.
    sync(opts = {}) {
        const y = GameState.seasonStartYear, w = GameState.week;
        if (!this.active(y)) return null;
        let I = this.state();
        if (!I) {
            I = GameState.intl = this._fresh();
            I.last = { year: y, week: 0 };          // start of THIS season: weeks 1..w are caught up silently
        }
        let { year, week } = I.last || { year: y, week: 0 };
        // a big gap (a save that was edited, or never stepped) restarts from this season's start
        if (year < y - 1 || year > y) { year = y; week = 0; }
        const target = y * 100 + w;
        let guard = 0;
        while (year * 100 + week < target && guard++ < 120) {
            if (week >= 52) { year += 1; week = 1; } else week += 1;
            const now = year === y && week === w;
            const prev = this._silent;
            this._silent = prev || !!opts.silent || !now;   // catch-up weeks never notify
            try { this._processWeek(year, week); }
            catch (e) { this._assert(false, `week ${week} of ${year}: ${e && e.message}`); if (this.STRICT) throw e; }
            finally { this._silent = prev; }
            I.last = { year, week };
        }
        return I;
    },
    // the weekly entry point (Simulation.advanceWeek, after the clubs have played)
    step() { return this.sync(); },

    // ------------------------------------------------------------ the weekly schedule
    _processWeek(y, w) {
        const C = INTL_CONFIG, I = this.state();
        this._weekCount = {};
        if (w === C.HOST_DRAW_WEEK) {
            // hosts for the tournament at the end of NEXT season become known now (shown in the UI)
            const T = y + C.HOST_DRAW_SEASONS_BEFORE;
            if (this.tournamentKey(T)) this.hostsFor(T);
        }
        // weeks 1-2: the tail of the previous season's tournament
        const ti = C.TOURNAMENT_WEEKS.indexOf(w);
        if (w <= 2) {
            const prev = I.seasons[y - 1];
            if (prev && prev.tour) this._tournamentDay(prev, ti);
            this._checkCounts(y - 1, w, prev);
            return;
        }
        if (!this.active(y)) return;
        if (w === C.DRAW_WEEK) this._newSeason(y);
        const S = I.seasons[y]; if (!S) return;
        if (S.type === 'NATIONS_LEAGUE') this._nlWeek(S, w);
        else this._qualWeek(S, w);
        if (ti >= 0 && S.tour) this._tournamentDay(S, ti);
        this._checkCounts(y, w, S);
    },
    _newSeason(y) {
        const I = this.state();
        Object.keys(I.seasons).forEach(k => { if (+k < y - 1) delete I.seasons[k]; });
        const type = this.seasonType(y);
        const S = { year: y, type };
        I.seasons[y] = S;
        if (type === 'NATIONS_LEAGUE') this._nlDraw(S);
        else this._qualDraw(S);
        return S;
    },

    // ------------------------------------------------------------ matches
    // strength = reputation; `advH` / `advA` = that side gets home advantage. A knockout match
    // (`ko`) level after 90 goes to extra time, then penalties.
    _strength(id) { return this.rep(id); },
    _play(h, a, o = {}) {
        const adv = INTL_CONFIG.HOME_ADVANTAGE;
        const advH = o.neutral ? !!o.advH : true, advA = o.neutral ? !!o.advA : false;
        const sh = this._strength(h) + (advH && !advA ? adv : 0);
        const sa = this._strength(a) + (advA && !advH ? adv : 0);
        const fx = { h, a, hg: League.scoreGoals(sh, sa), ag: League.scoreGoals(sa, sh), w: o.week, s: o.slot || 'A' };
        if (o.neutral) fx.n = 1;
        if (o.ko && fx.hg === fx.ag) this._decide(fx, sh, sa);
        return this._record(fx, o);
    },
    // extra time (same shape as League._extraTime) then a penalty shootout
    _decide(fx, sh, sa) {
        const half = (att, def) => {
            const lam = Math.max(0.06, 0.45 + (att - def) / 40);
            let g = 0, p = Math.exp(-lam), cum = p, x = Rng.next(), term = p, k = 0;
            while (x > cum && k < 6) { k++; term *= lam / k; cum += term; g = k; }
            return g;
        };
        const eh = half(sh, sa), ea = half(sa, sh);
        fx.et = 1;
        if (eh !== ea) { fx.hg += eh; fx.ag += ea; return; }
        fx.hg += eh; fx.ag += ea;
        const hWins = Rng.next() < sh / (sh + sa);
        const [w, l] = League._penScore();
        fx.pens = hWins ? { h: w, a: l } : { h: l, a: w };
    },
    winnerOf(fx) {
        if (!fx || fx.hg == null) return null;
        if (fx.pens) return fx.pens.h > fx.pens.a ? fx.h : fx.a;
        return fx.hg > fx.ag ? fx.h : fx.ag > fx.hg ? fx.a : null;
    },
    loserOf(fx) { const w = this.winnerOf(fx); return w == null ? null : (w === fx.h ? fx.a : fx.h); },
    _record(fx, o) {
        if (o.comp) fx.c = o.comp;
        if (o.stage) fx.st = o.stage;
        const key = (fx.w || 0) + fx.s;
        this._weekCount[key] = (this._weekCount[key] || 0) + 1;
        try { this.onInternationalMatch(fx); } catch (e) { /* a hook must never break the week */ }
        return fx;
    },
    // A two-legged tie: `lo` hosts leg 1, `hi` hosts leg 2; aggregate, no away goals; extra time
    // and penalties in leg 2 if level.
    _leg1(tie, week, comp, stage) { tie.leg1 = this._play(tie.lo, tie.hi, { week, comp, stage }); },
    _leg2(tie, week, comp, stage) {
        const l2 = this._play(tie.hi, tie.lo, { week, comp, stage });
        const aggHi = tie.leg1.ag + l2.hg, aggLo = tie.leg1.hg + l2.ag;
        if (aggHi === aggLo) {
            const adv = INTL_CONFIG.HOME_ADVANTAGE;
            this._decide(l2, this._strength(tie.hi) + adv, this._strength(tie.lo));
        }
        tie.leg2 = l2;
        const fh = tie.leg1.ag + l2.hg, fl = tie.leg1.hg + l2.ag;
        tie.agg = [fh, fl];
        tie.winner = fh > fl ? tie.hi : fl > fh ? tie.lo : (l2.pens.h > l2.pens.a ? tie.hi : tie.lo);
        return tie.winner;
    },

    // ------------------------------------------------------------ tables
    // rows for a group, from its played fixtures
    table(group) {
        const rows = {};
        group.teams.forEach(id => { rows[id] = { id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0, AGF: 0 }; });
        group.fx.forEach(f => {
            if (f.hg == null) return;
            const H = rows[f.h], A = rows[f.a]; if (!H || !A) return;
            H.P++; A.P++; H.GF += f.hg; H.GA += f.ag; A.GF += f.ag; A.GA += f.hg; A.AGF += f.ag;
            if (f.hg > f.ag) { H.W++; A.L++; H.Pts += 3; } else if (f.ag > f.hg) { A.W++; H.L++; A.Pts += 3; } else { H.D++; A.D++; H.Pts++; A.Pts++; }
        });
        return Object.values(rows);
    },
    // Ranked table. 'rr' (everyone plays everyone): points, head-to-head points, head-to-head GD,
    // GD, GF, wins, reputation. 'l1' (League 1, not everyone meets): points, GD, GF, away goals,
    // wins, reputation.
    standings(group, mode = 'rr') {
        const rows = this.table(group);
        const tail = (a, b) => (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF
            || (mode === 'l1' ? b.AGF - a.AGF : 0) || b.W - a.W || this.rep(b.id) - this.rep(a.id) || (a.id < b.id ? -1 : 1);
        if (mode === 'l1') return rows.sort((a, b) => b.Pts - a.Pts || tail(a, b));
        rows.sort((a, b) => b.Pts - a.Pts);
        const out = [];
        for (let i = 0; i < rows.length;) {
            let j = i; while (j < rows.length && rows[j].Pts === rows[i].Pts) j++;
            const block = rows.slice(i, j);
            if (block.length > 1) {
                const ids = new Set(block.map(r => r.id)), h2h = {};
                block.forEach(r => { h2h[r.id] = { p: 0, gd: 0 }; });
                group.fx.forEach(f => {
                    if (f.hg == null || !ids.has(f.h) || !ids.has(f.a)) return;
                    h2h[f.h].gd += f.hg - f.ag; h2h[f.a].gd += f.ag - f.hg;
                    if (f.hg > f.ag) h2h[f.h].p += 3; else if (f.ag > f.hg) h2h[f.a].p += 3; else { h2h[f.h].p++; h2h[f.a].p++; }
                });
                block.sort((a, b) => h2h[b.id].p - h2h[a.id].p || h2h[b.id].gd - h2h[a.id].gd || tail(a, b));
            }
            out.push(...block); i = j;
        }
        return out;
    },
    // across groups (best thirds etc.): points, GD, GF, wins, reputation
    crossRank(rows) {
        return rows.slice().sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || b.W - a.W
            || this.rep(b.id) - this.rep(a.id) || (a.id < b.id ? -1 : 1));
    },
    // group position first, then points, GD, GF, wins, reputation (seeding, play-off entrants)
    _cmpPosRecord(x, y) {
        return x.pos - y.pos || y.row.Pts - x.row.Pts || (y.row.GF - y.row.GA) - (x.row.GF - x.row.GA)
            || y.row.GF - x.row.GF || y.row.W - x.row.W || this.rep(y.row.id) - this.rep(x.row.id) || (x.row.id < y.row.id ? -1 : 1);
    },
    _byPosThenRecord(entries) { return entries.slice().sort((x, y) => this._cmpPosRecord(x, y)); },

    // ------------------------------------------------------------ group draws
    // Distribute `pots` (arrays of ids) over `n` groups so each group gets an equal share of every
    // pot, honouring `ok(groupTeams, id)` (hosts apart, prohibited pairs). Randomised backtracking.
    _drawGroups(pots, n, ok = () => true) {
        const groups = Array.from({ length: n }, () => []);
        const order = [];
        pots.forEach((pot, pi) => this._shuffle(pot.slice()).forEach(id => order.push({ id, pi, per: pot.length / n })));
        const count = (g, pi) => g.filter(x => x.pi === pi).length;
        let steps = 0;
        const place = i => {
            if (i === order.length) return true;
            if (++steps > 20000) return false;   // a dead end this deep: start over with a fresh shuffle
            const t = order[i];
            const tries = this._shuffle(groups.map((g, k) => k));
            for (const k of tries) {
                const g = groups[k];
                if (count(g, t.pi) >= t.per) continue;
                if (!ok(g.map(x => x.id), t.id)) continue;
                g.push(t);
                if (place(i + 1)) return true;
                g.pop();
            }
            return false;
        };
        let ok2 = place(0);
        for (let retry = 0; !ok2 && retry < 20; retry++) {
            groups.forEach(g => g.length = 0); steps = 0;
            this._shuffle(order);
            order.sort((x, y) => x.pi - y.pi);   // still pot by pot, new order within each pot
            ok2 = place(0);
        }
        if (!ok2) {
            this._assert(false, 'group draw had no valid solution; constraints ignored');
            groups.forEach(g => g.length = 0);
            order.forEach((t, i) => groups[i % n].push(t));
        }
        // each group: its teams pot by pot, in random order within a pot (that is the slot draw)
        return groups.map(g => pots.map((_, pi) => this._shuffle(g.filter(x => x.pi === pi).map(x => x.id))).reduce((a, b) => a.concat(b), []));
    },
    _prohibitedOk(teams, id) {
        return !INTL_CONFIG.PROHIBITED_PAIRS.some(([x, y]) => (x === id && teams.includes(y)) || (y === id && teams.includes(x)));
    },
    // Group-of-6 template (appendix): slots 1-6, pot 1 = 1-2, pot 2 = 3-4, pot 3 = 5-6; home first.
    G6: [[[1, 3], [2, 5], [4, 6]], [[4, 1], [6, 2], [3, 5]], [[1, 2], [3, 4], [5, 6]],
        [[5, 1], [2, 4], [6, 3]], [[1, 6], [3, 2], [5, 4]], [[2, 1], [4, 3], [6, 5]]],
    // League 1 group-of-12 template: slots A0-A3 = 0-3, B0-B3 = 4-7, C0-C3 = 8-11.
    G12: (() => {
        const s = x => ({ A: 0, B: 4, C: 8 })[x[0]] + +x[1];
        return [
            'A0-B0 A1-B1 B2-C2 C0-B3 A2-C1 C3-A3', 'A0-A1 A2-A3 B0-B1 B2-B3 C0-C1 C2-C3',
            'A2-B2 A3-B3 B0-C0 C2-B1 A0-C3 C1-A1', 'B1-A0 B3-A2 C1-B0 C3-B2 A1-C0 A3-C2',
            'A1-A2 A3-A0 B1-B2 B3-B0 C1-C2 C3-C0', 'B2-A1 B0-A3 B1-C1 B3-C3 C0-A0 C2-A2',
        ].map(md => md.split(' ').map(p => p.split('-').map(s)));
    })(),
    // a group's fixtures from a template; `oneBased` for G6
    _fixtures(teams, tpl, oneBased, comp) {
        const fx = [];
        tpl.forEach((md, i) => md.forEach(([x, y]) => {
            const t = INTL_CONFIG.MATCHDAYS[i];
            fx.push({ h: teams[oneBased ? x - 1 : x], a: teams[oneBased ? y - 1 : y], md: i + 1, w: t.week, s: t.slot, c: comp, hg: null, ag: null });
        }));
        return fx;
    },
    _playMatchday(groups, week, comp, hostsAdv) {
        groups.forEach(g => g.fx.forEach((f, i) => {
            if (f.w !== week || f.hg != null) return;
            const r = this._play(f.h, f.a, { week, slot: f.s, comp, stage: 'group' });
            f.hg = r.hg; f.ag = r.ag;
        }));
    },

    // ------------------------------------------------------------ Nations League
    _nlDraw(S) {
        const I = this.state();
        S.leagues = {};
        INTL_CONFIG.NL_LEAGUES.forEach(L => {
            const ids = I.nlLeagues[L].slice();
            const pots = [ids.slice(0, 6), ids.slice(6, 12), ids.slice(12, 18)];
            const groups = this._drawGroups(pots, 3, (t, id) => this._prohibitedOk(t, id));
            S.leagues[L] = { groups: groups.map((teams, gi) => ({ id: L + (gi + 1), teams, fx: this._fixtures(teams, this.G6, true, 'INTL_NL') })) };
        });
    },
    _nlAllGroups(S) { return INTL_CONFIG.NL_LEAGUES.reduce((a, L) => a.concat(S.leagues[L].groups), []); },
    _nlWeek(S, w) {
        const C = INTL_CONFIG;
        if (C.MATCHDAYS.some(m => m.week === w)) this._playMatchday(this._nlAllGroups(S), w, 'INTL_NL');
        if (w === C.ROUND_DRAW_WEEK) this._nlRoundDraw(S);
        if (w === C.LEG1_WEEK) this._nlLegs(S, 1);
        if (w === C.LEG2_WEEK) this._nlLegs(S, 2);
        if (w === C.FINALS_DRAW_WEEK) this._nlFinalsDraw(S);
        if (w === C.NL_FINALS_WEEK) this._nlFinals(S);
    },
    // per league: [{ row, pos, group }] for every team, from the final group tables
    _nlPlaces(S, L) {
        const out = [];
        S.leagues[L].groups.forEach(g => this.standings(g, 'rr').forEach((row, i) => out.push({ row, pos: i + 1, group: g.id })));
        return out;
    },
    _nlRoundDraw(S) {
        const C = INTL_CONFIG, I = this.state();
        // League A quarter-finals: 3 winners, 3 runners-up, 2 best thirds, seeded 1-8
        const A = this._nlPlaces(S, 'A');
        const thirds = this.crossRank(A.filter(e => e.pos === 3).map(e => e.row)).slice(0, C.NL_QF_THIRDS).map(r => r.id);
        const qfIn = this._byPosThenRecord(A.filter(e => e.pos <= 2 || thirds.includes(e.row.id)));
        const seed = qfIn.map(e => e.row.id), grp = Object.fromEntries(A.map(e => [e.row.id, e.group]));
        const pairs = [[0, 7], [1, 6], [2, 5], [3, 4]].map(([x, y]) => [seed[x], seed[y]]);
        for (let guard = 0; guard < 8; guard++) {
            const i = pairs.findIndex(([x, y]) => grp[x] === grp[y]);
            if (i < 0) break;
            const j = i < pairs.length - 1 ? i + 1 : i - 1;
            [pairs[i][1], pairs[j][1]] = [pairs[j][1], pairs[i][1]];
        }
        S.seedA = seed;
        S.qf = pairs.map(([hi, lo]) => ({ hi, lo, leg1: null, leg2: null, winner: null }));
        // promotion/relegation play-offs: upper league's 5th v lower league's runners-up
        const prev = new Set(I.prevPlayoffPairs || []);
        const po = (up, low) => {
            const U = this.crossRank(this._nlPlaces(S, up).filter(e => e.pos === 5).map(e => e.row)).map(r => r.id);
            const D = this.crossRank(this._nlPlaces(S, low).filter(e => e.pos === 2).map(e => e.row)).map(r => r.id).reverse();
            // best upper v worst lower; avoid last edition's pairings if a permutation allows
            const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
            const reps = p => p.reduce((n, d, i) => n + (prev.has(U[i] + '|' + D[d]) || prev.has(D[d] + '|' + U[i]) ? 1 : 0), 0);
            let best = perms[0];
            perms.forEach(p => { if (reps(p) < reps(best)) best = p; });
            return U.map((hi, i) => ({ hi, lo: D[best[i]], leg1: null, leg2: null, winner: null }));
        };
        S.po = { AB: po('A', 'B'), BC: po('B', 'C') };
        I.prevPlayoffPairs = S.po.AB.concat(S.po.BC).map(t => t.hi + '|' + t.lo);
    },
    _nlLegs(S, leg) {
        if (!S.qf) return;
        const all = [...S.qf.map(t => ['qf', t]), ...S.po.AB.map(t => ['po', t]), ...S.po.BC.map(t => ['po', t])];
        const w = leg === 1 ? INTL_CONFIG.LEG1_WEEK : INTL_CONFIG.LEG2_WEEK;
        all.forEach(([stage, t]) => (leg === 1 ? this._leg1(t, w, 'INTL_NL', stage) : this._leg2(t, w, 'INTL_NL', stage)));
    },
    _nlFinalsDraw(S) {
        if (!S.qf) return;
        const four = S.qf.map(t => t.winner);
        const host = four.slice().sort((a, b) => S.seedA.indexOf(a) - S.seedA.indexOf(b))[0];
        const d = this._shuffle(four.slice());
        S.finals = { host, sf: [{ h: d[0], a: d[1] }, { h: d[2], a: d[3] }], third: null, final: null };
    },
    _nlFinals(S) {
        const F = S.finals; if (!F) return;
        const C = INTL_CONFIG, w = C.NL_FINALS_WEEK;
        const opt = (h, a, slot, stage) => ({ week: w, slot, neutral: true, advH: h === F.host, advA: a === F.host, ko: true, comp: 'INTL_NL', stage });
        F.sf = F.sf.map(m => this._play(m.h, m.a, opt(m.h, m.a, 'A', 'sf')));
        const W = F.sf.map(m => this.winnerOf(m)), Lz = F.sf.map(m => this.loserOf(m));
        F.third = this._play(Lz[0], Lz[1], opt(Lz[0], Lz[1], 'B', 'third'));
        F.final = this._play(W[0], W[1], opt(W[0], W[1], 'B', 'final'));
        const winner = this.winnerOf(F.final);
        S.result = { winner, runnerUp: this.loserOf(F.final), third: this.winnerOf(F.third), fourth: this.loserOf(F.third) };
        this._nlPromoteAndReseed(S);
        this.state().honours.NL.push({ season: S.year, winner, runnerUp: S.result.runnerUp, third: S.result.third, host: F.host, final: this._finalRec(F.final) });
        this._notify('intl.mail.nlWinSubj', 'intl.mail.nlWinBody', { nation: this.name(winner), opp: this.name(S.result.runnerUp), score: this._score(F.final), comp: compName('INTL_NL') });
    },
    // a final as stored in the roll of honour (oriented: h / a as played)
    _finalRec(fx) { return fx ? { h: fx.h, a: fx.a, hg: fx.hg, ag: fx.ag, et: fx.et || 0, pens: fx.pens || null } : null; },
    _score(fx) {
        if (!fx) return '';
        const s = fx.hg + '-' + fx.ag;
        if (fx.pens) return I18n.t('intl.score.pens', { s, p: fx.pens.h + '-' + fx.pens.a });
        if (fx.et) return I18n.t('intl.score.aet', { s });
        return s;
    },
    // League order within one Nations League league (section 3.6)
    _nlOrder(S, L) {
        const places = this._byPosThenRecord(this._nlPlaces(S, L)).map(e => e.row.id);
        if (L !== 'A' || !S.result) return places;
        const top = [S.result.winner, S.result.runnerUp, S.result.third, S.result.fourth];
        const qfLosers = this._byPosThenRecord(this._nlPlaces(S, 'A').filter(e => S.qf.some(t => (t.hi === e.row.id || t.lo === e.row.id) && t.winner !== e.row.id))).map(e => e.row.id);
        const seen = new Set([...top, ...qfLosers]);
        return [...top, ...qfLosers, ...places.filter(id => !seen.has(id))];
    },
    _nlPromoteAndReseed(S) {
        const I = this.state();
        const ord = { A: this._nlOrder(S, 'A'), B: this._nlOrder(S, 'B'), C: this._nlOrder(S, 'C') };
        const pos = L => Object.fromEntries(this._nlPlaces(S, L).map(e => [e.row.id, e.pos]));
        const pA = pos('A'), pB = pos('B'), pC = pos('C');
        const ab = S.po.AB, bc = S.po.BC;
        const lostAB = new Set(ab.filter(t => t.winner !== t.hi).map(t => t.hi)), wonAB = new Set(ab.filter(t => t.winner === t.lo).map(t => t.lo));
        const lostBC = new Set(bc.filter(t => t.winner !== t.hi).map(t => t.hi)), wonBC = new Set(bc.filter(t => t.winner === t.lo).map(t => t.lo));
        const relA = id => pA[id] === 6 || lostAB.has(id);
        const promB = id => pB[id] === 1 || wonAB.has(id);
        const relB = id => pB[id] === 6 || lostBC.has(id);
        const promC = id => pC[id] === 1 || wonBC.has(id);
        const A = ord.A.filter(id => !relA(id)).concat(ord.B.filter(promB));
        const B = ord.A.filter(relA).concat(ord.B.filter(id => !promB(id) && !relB(id)), ord.C.filter(promC));
        const Cc = ord.B.filter(relB).concat(ord.C.filter(id => !promC(id)));
        const n = INTL_CONFIG.NL_LEAGUE_SIZE;
        this._assert(A.length === n && B.length === n && Cc.length === n, `NL leagues after promotion/relegation: ${A.length}/${B.length}/${Cc.length}`);
        I.nlLeagues = { A, B, C: Cc };
        I.seeding = A.concat(B, Cc);
        S.movement = { promoted: { B: ord.B.filter(promB), C: ord.C.filter(promC) }, relegated: { A: ord.A.filter(relA), B: ord.B.filter(relB) } };
    },

    // ------------------------------------------------------------ hosts
    // The hosts of the tournament at the end of season T: awarded (config), already drawn, or
    // drawn now. Fallback until HOST_POTS is filled: one host, weighted by reputation.
    hostsFor(T) {
        const key = this.tournamentKey(T); if (!key) return [];
        const C = INTL_CONFIG, I = this.state();
        if (C.HOSTS[key]) return C.HOSTS[key].hosts.slice();
        if (I && I.hosts[key]) return I.hosts[key].slice();
        const isEuro = key.startsWith('EURO');
        const pot = (C.HOST_POTS[isEuro ? 'EURO' : 'WORLD_CUP'] || []).filter(id => NATIONS_BY_ID[id]);
        let hosts;
        if (pot.length) {
            const n = Math.min(C.MAX_HOSTS, C.HOSTS_PER_TOURNAMENT[Math.floor(Rng.next() * C.HOSTS_PER_TOURNAMENT.length)]);
            hosts = this._shuffle(pot.slice()).slice(0, n);
            if (!isEuro) {   // at most MAX_UEFA_HOSTS_WC UEFA hosts at a World Cup
                const u = hosts.filter(id => this.conf(id) === 'UEFA');
                if (u.length > C.MAX_UEFA_HOSTS_WC) hosts = hosts.filter(id => this.conf(id) !== 'UEFA').concat(u.slice(0, C.MAX_UEFA_HOSTS_WC));
            }
        } else {
            const pool = NATIONS.filter(n => !isEuro || n.confederation === 'UEFA');
            hosts = [this._weightedOrder(pool, n => Math.exp((n.reputation - 60) / NATION_WEIGHT_SPREAD))[0].id];
        }
        if (I) I.hosts[key] = hosts.slice();
        return hosts;
    },
    hostRule(key) { return INTL_CONFIG.HOSTS[key] || {}; },

    // ------------------------------------------------------------ European Qualifiers
    _qualDraw(S) {
        const C = INTL_CONFIG, I = this.state();
        S.key = this.tournamentKey(S.year);
        S.hosts = this.hostsFor(S.year);
        const uefaHosts = S.hosts.filter(id => this.conf(id) === 'UEFA');
        const l1 = I.seeding.slice(0, C.QUAL_L1_SIZE), l2 = I.seeding.slice(C.QUAL_L1_SIZE, C.QUAL_L1_SIZE + C.QUAL_L2_SIZE);
        // hosts apart: as evenly as the groups allow (EURO 2028 has 4 hosts for 3 groups, so 2 may share)
        const sep = league => {
            const n = league.filter(id => uefaHosts.includes(id)).length, cap = Math.max(1, Math.ceil(n / 3));
            return (t, id) => this._prohibitedOk(t, id) && !(uefaHosts.includes(id) && t.filter(x => uefaHosts.includes(x)).length >= cap);
        };
        const g1 = this._drawGroups([l1.slice(0, 12), l1.slice(12, 24), l1.slice(24, 36)], 3, sep(l1));
        const g2 = this._drawGroups([l2.slice(0, 6), l2.slice(6, 12), l2.slice(12, 18)], 3, sep(l2));
        S.l1 = { groups: g1.map((teams, i) => ({ id: 'L1-' + (i + 1), teams, fx: this._fixtures(teams, this.G12, false, 'INTL_QUAL') })) };
        S.l2 = { groups: g2.map((teams, i) => ({ id: 'L2-' + (i + 1), teams, fx: this._fixtures(teams, this.G6, true, 'INTL_QUAL') })) };
    },
    _qualWeek(S, w) {
        const C = INTL_CONFIG;
        if (C.MATCHDAYS.some(m => m.week === w)) this._playMatchday(S.l1.groups.concat(S.l2.groups), w, 'INTL_QUAL');
        if (w === C.GROUPS_DONE_WEEK) { this._qualify(S); if (S.type === 'WORLD_CUP') this._wcOthers(S); }
        if (w === C.ROUND_DRAW_WEEK) this._playoffDraw(S);
        if (w === C.LEG1_WEEK) this._playoffs(S, 1);
        if (w === C.LEG2_WEEK) { this._playoffs(S, 2); if (C.QUALIFIERS_RESEED) this._qualReseed(S); }
        if (w === C.FINALS_DRAW_WEEK) this._tournamentDraw(S);
    },
    // group order with hosts kept in (`skip` = auto-qualified hosts to leave out when reading places)
    _groupOrder(g, mode, skip) { return this.standings(g, mode).filter(r => !skip.has(r.id)); },
    _qualify(S) {
        const C = INTL_CONFIG;
        const rule = this.hostRule(S.key);
        const uefaHosts = S.hosts.filter(id => this.conf(id) === 'UEFA');
        const reservedRule = !!rule.reserved;                // EURO 2028: hosts play and are NOT skipped
        const auto = new Set(reservedRule ? [] : uefaHosts); // auto-qualified hosts, skipped in the tables
        const H = auto.size;
        const groups = S.l1.groups.map(g => this._groupOrder(g, 'l1', auto));
        let direct = [], reserved = [], P;
        if (S.type === 'WORLD_CUP') {
            groups.forEach(o => direct.push(...o.slice(0, C.WC_UEFA_DIRECT_PER_GROUP).map(r => r.id)));
            P = 4 - H;
        } else if (this.euroSize(S.year + 1) === 32) {
            groups.forEach(o => direct.push(...o.slice(0, C.EURO32_DIRECT_PER_GROUP).map(r => r.id)));
            const tenths = this.crossRank(groups.map(o => o[C.EURO32_DIRECT_PER_GROUP]).filter(Boolean)).slice(0, 3 - H).map(r => r.id);
            direct.push(...tenths);
            P = C.EURO32_PLAYOFF_PATHS;
        } else {
            groups.forEach(o => direct.push(...o.slice(0, C.EURO24_DIRECT_PER_GROUP).map(r => r.id)));
            const sevenths = this.crossRank(groups.map(o => o[C.EURO24_DIRECT_PER_GROUP]).filter(Boolean)).slice(0, C.EURO24_BEST_SEVENTH).map(r => r.id);
            direct.push(...sevenths);
            if (reservedRule) {
                // hosts that missed the direct places, ranked across groups; up to `reserved` take a place
                const all = S.l1.groups.concat(S.l2.groups);
                const missed = [];
                all.forEach(g => this.standings(g, S.l1.groups.includes(g) ? 'l1' : 'rr').forEach((row, i) => {
                    if (uefaHosts.includes(row.id) && !direct.includes(row.id)) missed.push({ row, pos: i + 1, l2: S.l2.groups.includes(g) ? 1 : 0 });
                }));
                missed.sort((x, y) => x.l2 - y.l2 || this._cmpPosRecord(x, y));
                reserved = missed.slice(0, rule.reserved).map(e => e.row.id);
            }
            P = 4 - reserved.length;
        }
        S.qual = { direct, reserved, auto: [...auto], P };
    },
    _playoffDraw(S) {
        if (!S.qual) return;
        const P = S.qual.P, auto = new Set(S.qual.auto);
        const done = new Set([...S.qual.direct, ...S.qual.reserved, ...auto]);
        // League 1: the best 3P not yet qualified, by group position then record (hosts skipped)
        const l1 = [];
        S.l1.groups.forEach(g => this._groupOrder(g, 'l1', auto).forEach((row, i) => { if (!done.has(row.id)) l1.push({ row, pos: i + 1 }); }));
        const l1In = this._byPosThenRecord(l1).slice(0, 3 * P).map(e => e.row.id);
        // League 2: group winners ranked across groups (+ best runner-up when P = 4)
        const orders = S.l2.groups.map(g => this._groupOrder(g, 'rr', auto));
        let l2In = this.crossRank(orders.map(o => o[0]).filter(Boolean)).map(r => r.id);
        if (P > l2In.length) l2In = l2In.concat(this.crossRank(orders.map(o => o[1]).filter(Boolean)).slice(0, P - l2In.length).map(r => r.id));
        l2In = l2In.slice(0, P);
        const pots = [l1In.slice(0, P), l1In.slice(P, 2 * P), l1In.slice(2 * P, 3 * P), l2In].map(p => this._shuffle(p.slice()));
        S.po = { paths: Array.from({ length: P }, (_, i) => ({ teams: pots.map(p => p[i]), sf: null, final: null, winner: null })) };
        this._assert(S.po.paths.every(p => p.teams.every(Boolean)), `play-off paths short of teams (P=${P})`);
    },
    _playoffs(S, round) {
        const w = round === 1 ? INTL_CONFIG.LEG1_WEEK : INTL_CONFIG.LEG2_WEEK;
        if (S.po) S.po.paths.forEach(p => {
            if (round === 1) {
                const [p1, p2, p3, p4] = p.teams;
                p.sf = [this._play(p1, p4, { week: w, ko: true, comp: 'INTL_QUAL', stage: 'posf' }), this._play(p2, p3, { week: w, ko: true, comp: 'INTL_QUAL', stage: 'posf' })];
            } else {
                const f = this._shuffle(p.sf.map(m => this.winnerOf(m)));
                p.final = this._play(f[0], f[1], { week: w, ko: true, comp: 'INTL_QUAL', stage: 'pofinal' });
                p.winner = this.winnerOf(p.final);
            }
        });
        const ic = S.wc && S.wc.ic;
        if (ic) {
            const o = { week: w, neutral: true, ko: true, comp: 'INTL_WC', stage: 'ic' };
            if (round === 1) ic.sf = [this._play(ic.semis[0], ic.semis[1], o), this._play(ic.semis[2], ic.semis[3], o)];
            else {
                ic.finals = [this._play(ic.seeds[0], this.winnerOf(ic.sf[0]), o), this._play(ic.seeds[1], this.winnerOf(ic.sf[1]), o)];
                ic.winners = ic.finals.map(m => this.winnerOf(m));
            }
        }
    },
    // World Cup: the other confederations' places (placeholder until their qualifiers exist)
    _wcOthers(S) {
        const C = INTL_CONFIG;
        const hosts = new Set(S.hosts);
        const direct = {}, icEntrants = [];
        Object.keys(C.WC_DIRECT).forEach(conf => {
            const pool = NATIONS.filter(n => n.confederation === conf && !hosts.has(n.id));
            const hostsHere = S.hosts.filter(id => this.conf(id) === conf);
            const k = Math.max(0, C.WC_DIRECT[conf] - hostsHere.length);
            const order = this._weightedOrder(pool, n => n.weight || 1).map(n => n.id);
            direct[conf] = hostsHere.concat(order.slice(0, k));
            icEntrants.push(...order.slice(k, k + (C.WC_IC_ENTRANTS[conf] || 0)));
        });
        const byRep = icEntrants.slice().sort((a, b) => this.rep(b) - this.rep(a) || (a < b ? -1 : 1));
        S.wc = { direct, ic: { entrants: icEntrants, seeds: byRep.slice(0, 2), semis: this._shuffle(byRep.slice(2)), sf: null, finals: null, winners: null } };
    },
    // the qualified teams (after week 37)
    qualifiedTeams(S) {
        if (!S.qual) return [];
        const out = [...S.qual.auto, ...S.qual.direct, ...S.qual.reserved, ...(S.po ? S.po.paths.map(p => p.winner).filter(Boolean) : [])];
        if (S.type === 'WORLD_CUP' && S.wc) {
            Object.values(S.wc.direct).forEach(l => out.push(...l));
            if (S.wc.ic.winners) out.push(...S.wc.ic.winners);
        }
        return out;
    },
    // Qualifier results re-order the seeding WITHIN each Nations League league (membership is the
    // Nations League's business): league 1 before league 2, then group position, then record.
    _qualReseed(S) {
        const I = this.state();
        const info = {};
        [['l1', 'l1', 0], ['l2', 'rr', 1]].forEach(([k, mode, lv]) => S[k].groups.forEach(g => this.standings(g, mode).forEach((row, i) => { info[row.id] = { row, pos: i + 1, lv }; })));
        const reorder = ids => ids.slice().sort((a, b) => {
            const x = info[a], y = info[b]; if (!x || !y) return 0;
            return x.lv - y.lv || this._cmpPosRecord(x, y);
        });
        I.nlLeagues = { A: reorder(I.nlLeagues.A), B: reorder(I.nlLeagues.B), C: reorder(I.nlLeagues.C) };
        I.seeding = I.nlLeagues.A.concat(I.nlLeagues.B, I.nlLeagues.C);
    },

    // ------------------------------------------------------------ final tournaments
    _tournamentDraw(S) {
        const C = INTL_CONFIG;
        const teams = this.qualifiedTeams(S);
        const wc = S.type === 'WORLD_CUP';
        const size = wc ? C.WC_TEAMS : this.euroSize(S.year + 1);
        this._assert(teams.length === size, `${S.key}: ${teams.length} qualified, expected ${size}`);
        this._assert(new Set(teams).size === teams.length, `${S.key}: a nation qualified twice`);
        if (wc) this._assert(teams.filter(id => this.conf(id) === 'UEFA').length === C.WC_UEFA, `${S.key}: UEFA teams != ${C.WC_UEFA}`);
        const hosts = S.hosts.filter(id => teams.includes(id));
        const nG = size / 4;
        const rest = teams.filter(id => !hosts.includes(id)).sort((a, b) => this.rep(b) - this.rep(a) || (a < b ? -1 : 1));
        const ranked = hosts.concat(rest);
        const pots = [0, 1, 2, 3].map(i => ranked.slice(i * nG, (i + 1) * nG));
        const okWc = (g, id) => {
            const c = this.conf(id), same = g.filter(x => this.conf(x) === c).length;
            return c === 'UEFA' ? same < 2 : same < 1;
        };
        const okHosts = (g, id) => !(hosts.includes(id) && g.some(x => hosts.includes(x)));
        let groups = this._drawGroups(pots, nG, (g, id) => okHosts(g, id) && (!wc || okWc(g, id)));
        // a host is position 1 in its group (the draw already orders pot 1 first)
        const letters = 'ABCDEFGHIJKL';
        const rule = this.hostRule(S.key);
        S.tour = {
            key: S.key, size, hosts,
            md1Only: (rule.md1Only || []).filter(id => hosts.includes(id)),
            groups: groups.map((t, i) => ({ id: letters[i], teams: t, fx: this._tourGroupFixtures(t) })),
            ko: {}, winner: null,
        };
    },
    // group of 4: slots 0-3; the listed home side is only nominal (tournament games are neutral)
    _tourGroupFixtures(t) {
        const md = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]];
        const fx = [];
        md.forEach((m, i) => m.forEach(([x, y]) => fx.push({ h: t[x], a: t[y], md: i + 1, hg: null, ag: null })));
        return fx;
    },
    _tourOpts(T, h, a, week, slot, stage, md) {
        const adv = id => T.hosts.includes(id) && (!T.md1Only.includes(id) || md === 1);
        return { week, slot, neutral: true, advH: adv(h), advA: adv(a), ko: stage !== 'group', comp: T.key.startsWith('WC') ? 'INTL_WC' : 'INTL_EURO', stage };
    },
    _tKo(T, h, a, week, slot, stage) { return this._play(h, a, this._tourOpts(T, h, a, week, slot, stage)); },
    _tournamentDay(S, day) {
        const T = S.tour; if (!T || day < 0) return;
        const week = INTL_CONFIG.TOURNAMENT_WEEKS[day];
        const wc = T.size === 48;
        if (day <= 2) {
            T.groups.forEach(g => g.fx.forEach(f => {
                if (f.md !== day + 1) return;
                const r = this._play(f.h, f.a, this._tourOpts(T, f.h, f.a, week, 'A', 'group', f.md));
                f.hg = r.hg; f.ag = r.ag; f.w = week; f.s = 'A';
            }));
            if (day === 2) this._firstKnockout(T, week);
            return;
        }
        const K = T.ko;
        const W = m => this.winnerOf(m), Lo = m => this.loserOf(m);
        if (day === 3) {
            const first = wc ? 'r32' : 'r16';
            K[first] = K[first].map(m => this._tKo(T, m.h, m.a, week, 'A', first));
        } else if (day === 4) {
            if (wc) {
                const r = K.r32.map(W);   // W1..W16 = r[0..15]
                const pairs = [[1, 16], [2, 15], [3, 11], [4, 9], [5, 14], [6, 13], [7, 12], [8, 10]];
                K.r16 = pairs.map(([x, y]) => this._tKo(T, r[x - 1], r[y - 1], week, 'A', 'r16'));
                const q = K.r16.map(W);
                K.qf = [[0, 2], [1, 3], [4, 6], [5, 7]].map(([x, y]) => this._tKo(T, q[x], q[y], week, 'B', 'qf'));
            } else {
                const r = K.r16.map(W);
                const pairs = T.size === 24 ? [[2, 0], [4, 5], [3, 1], [6, 7]] : [[0, 1], [2, 3], [4, 5], [6, 7]];
                K.qf = pairs.map(([x, y]) => this._tKo(T, r[x], r[y], week, 'A', 'qf'));
            }
        } else if (day === 5) {
            const q = K.qf.map(W);
            K.sf = [this._tKo(T, q[0], q[1], week, 'A', 'sf'), this._tKo(T, q[2], q[3], week, 'A', 'sf')];
            if (wc) K.third = this._tKo(T, Lo(K.sf[0]), Lo(K.sf[1]), week, 'B', 'third');
            K.final = this._tKo(T, W(K.sf[0]), W(K.sf[1]), week, 'B', 'final');
            T.winner = W(K.final); T.runnerUp = Lo(K.final);
            const list = this.state().honours[wc ? 'WC' : 'EURO'];
            list.push({ season: S.year, year: S.year + 1, winner: T.winner, runnerUp: T.runnerUp, third: K.third ? W(K.third) : null, hosts: T.hosts.slice(), final: this._finalRec(K.final), size: T.size });
            const comp = compName(wc ? 'INTL_WC' : 'INTL_EURO') + ' ' + (S.year + 1);
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(T.winner), opp: this.name(T.runnerUp), score: this._score(K.final), comp });
        }
    },
    // after the group stage: the first knockout round, from the bracket in sections 6 / 7
    _firstKnockout(T, week) {
        const st = {};
        T.groups.forEach(g => { st[g.id] = this.standings(g, 'rr'); });
        const P = (pos, gid) => st[gid][pos - 1].id;
        const nThirds = T.size === 48 ? 8 : T.size === 24 ? 4 : 0;
        const thirds = this.crossRank(T.groups.map(g => Object.assign({ gid: g.id }, st[g.id][2]))).slice(0, nThirds);
        T.thirds = thirds.map(r => r.id);
        const tg = Object.fromEntries(thirds.map(r => [r.id, r.gid]));
        const fx = (h, a) => ({ h, a, hg: null, ag: null });
        if (T.size === 48) {
            const winners = 'ABCDEFGH'.split('');
            const match = this._matchThirds(winners, T.thirds.map(id => ({ id, g: tg[id] })), (w, t) => t.g !== w);
            const m = winners.map(g => fx(P(1, g), match[g]));
            m.push(fx(P(1, 'I'), P(2, 'J')), fx(P(1, 'J'), P(2, 'I')), fx(P(1, 'K'), P(2, 'L')), fx(P(1, 'L'), P(2, 'K')));
            m.push(fx(P(2, 'A'), P(2, 'B')), fx(P(2, 'C'), P(2, 'D')), fx(P(2, 'E'), P(2, 'F')), fx(P(2, 'G'), P(2, 'H')));
            T.ko.r32 = m;
        } else if (T.size === 24) {
            const allowed = { B: 'ADEF', C: 'DEF', E: 'ABCD', F: 'ABC' };
            const match = this._matchThirds(['B', 'C', 'F', 'E'], T.thirds.map(id => ({ id, g: tg[id] })), (w, t) => allowed[w].includes(t.g));
            T.ko.r16 = [fx(P(1, 'A'), P(2, 'C')), fx(P(2, 'A'), P(2, 'B')), fx(P(1, 'B'), match.B), fx(P(1, 'C'), match.C),
                fx(P(1, 'F'), match.F), fx(P(2, 'D'), P(2, 'E')), fx(P(1, 'E'), match.E), fx(P(1, 'D'), P(2, 'F'))];
        } else {
            T.ko.r16 = [fx(P(1, 'A'), P(2, 'B')), fx(P(1, 'C'), P(2, 'D')), fx(P(1, 'E'), P(2, 'F')), fx(P(1, 'G'), P(2, 'H')),
                fx(P(1, 'B'), P(2, 'A')), fx(P(1, 'D'), P(2, 'C')), fx(P(1, 'F'), P(2, 'E')), fx(P(1, 'H'), P(2, 'G'))];
        }
    },
    // bipartite matching of group winners to third-placed teams, randomised; { winnerGroup: thirdId }
    _matchThirds(winners, thirds, allowed) {
        const out = {}, used = new Set();
        const order = this._shuffle(thirds.slice());
        const go = i => {
            if (i === winners.length) return true;
            for (const t of order) {
                if (used.has(t.id) || !allowed(winners[i], t)) continue;
                used.add(t.id); out[winners[i]] = t.id;
                if (go(i + 1)) return true;
                used.delete(t.id);
            }
            return false;
        };
        if (!go(0)) {
            this._assert(false, 'third-placed teams could not be matched; assigned in order');
            winners.forEach((w, i) => { out[w] = order[i].id; });
        }
        return out;
    },

    // ------------------------------------------------------------ checks
    // expected international matches per slot in a week (sections 3, 4, 6, 7)
    expectedCount(y, w, S) {
        const C = INTL_CONFIG, out = {};
        if (!S) return out;
        const md = C.MATCHDAYS.filter(m => m.week === w);
        md.forEach(m => { out[w + m.slot] = 27; });
        if (S.type === 'NATIONS_LEAGUE') {
            if (w === C.LEG1_WEEK || w === C.LEG2_WEEK) out[w + 'A'] = 10;
            if (w === C.NL_FINALS_WEEK) { out[w + 'A'] = 2; out[w + 'B'] = 2; }
            return out;
        }
        const P = S.qual ? S.qual.P : 0, ic = S.type === 'WORLD_CUP' ? 2 : 0;
        if (w === C.LEG1_WEEK) out[w + 'A'] = 2 * P + ic;
        if (w === C.LEG2_WEEK) out[w + 'A'] = P + ic;
        const day = C.TOURNAMENT_WEEKS.indexOf(w);
        if (day >= 0 && S.tour) {
            const n = S.tour.size, G = n / 4;
            if (day <= 2) out[w + 'A'] = G * 2;
            if (day === 3) out[w + 'A'] = n === 48 ? 16 : 8;
            if (day === 4) { if (n === 48) { out[w + 'A'] = 8; out[w + 'B'] = 4; } else out[w + 'A'] = 4; }
            if (day === 5) { out[w + 'A'] = 2; out[w + 'B'] = n === 48 ? 2 : 1; }
        }
        return out;
    },
    _checkCounts(y, w, S) {
        const want = this.expectedCount(y, w, S), got = this._weekCount || {};
        const keys = new Set([...Object.keys(want), ...Object.keys(got)]);
        keys.forEach(k => this._assert((want[k] || 0) === (got[k] || 0), `season ${y} week ${k}: ${got[k] || 0} matches, expected ${want[k] || 0}`));
    },

    // ------------------------------------------------------------ notifications
    _notify(subjKey, bodyKey, vars) {
        if (this._silent) return;
        const text = I18n.t(bodyKey, vars);
        GameState.addLog(text, 'season');
        GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t(subjKey, vars), body: text, ttl: 4 });
    },

    // ------------------------------------------------------------ read helpers for the UI
    // the season whose competitions are running now: in weeks 1-2 that is still last season's
    // tournament; otherwise this season (null before its draw in week 3)
    currentSeason() {
        const I = this.state(); if (!I) return null;
        const y = GameState.seasonStartYear;
        return I.seasons[y] || (GameState.week <= 2 ? I.seasons[y - 1] : null) || I.seasons[y - 1] || null;
    },
    upcomingHosts() {
        const I = this.state(); if (!I) return [];
        const y = GameState.seasonStartYear, out = [];
        for (let T = y; T <= y + 3; T++) {
            const key = this.tournamentKey(T); if (!key) continue;
            const hosts = INTL_CONFIG.HOSTS[key] ? INTL_CONFIG.HOSTS[key].hosts : I.hosts[key];
            if (hosts) out.push({ key, year: T + 1, hosts: hosts.slice() });
        }
        return out;
    },
};

if (typeof window !== 'undefined') window.Internationals = Internationals;
