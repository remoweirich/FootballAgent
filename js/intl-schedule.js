// ============================================================
//  The fixture list ahead (docs/international.md, "Schedule"):
//   - every knockout round is pre-filled as soon as its teams are known (a bracket shows the next
//     round before it is played; the engine then plays exactly those fixtures)
//   - friendlies are arranged FRIENDLY_SCHEDULE_AHEAD weeks before a break and played in it
//   - knownFixtures(): every fixture already set, for a nation's upcoming matches
//   - Nations League group positions per edition (a nation's past performances)
//
//  State on GameState.intl:  fs  [[L, home, away, neutral, slot]] friendlies arranged, not played yet
//                            nlp { nationId: [[comp, season, tier, position]] }
// ============================================================
Object.assign(Internationals, {
    // a fixture not played yet (a pre-filled knockout match)
    _ph(h, a, w, s, y) { const o = { h, a, hg: null, ag: null, w, s: s || 'A' }; if (y != null) o.y = y; return o; },
    _allPlayed(list) { return !!(list && list.length && list.every(m => m && m.hg != null)); },
    _groupsPlayed(groups) { return !!(groups && groups.length && groups.every(g => g.fx && g.fx.length && g.fx.every(f => f.hg != null))); },

    // ------------------------------------------------------------ the weekly pass (end of a processed week)
    _weekly(sy, w) {
        const I = this.state(); if (!I) return;
        const S = I.seasons[sy];
        if (S) { this._previewSeason(S); this._nlPositions(S); }
        this._previewCycles(sy);
    },

    // ------------------------------------------------------------ knockout rounds, pre-filled
    _previewSeason(S) {
        const C = INTL_CONFIG;
        const stamp = (list, w, s) => (list || []).forEach(m => { if (m && m.hg == null && m.w == null) { m.w = w; m.s = s; } });
        if (S.tour) this._previewEuroWc(S.tour);
        if (S.finals) stamp(S.finals.sf, C.NL_FINALS_WEEK, 'A');
        // European qualifying play-off paths: semi-finals once drawn, the final once they are played
        if (S.po && S.po.paths) S.po.paths.forEach(p => {
            if (!p.sf && p.teams && p.teams.every(Boolean)) p.sf = [this._ph(p.teams[0], p.teams[3], C.LEG1_WEEK), this._ph(p.teams[1], p.teams[2], C.LEG1_WEEK)];
            if (this._allPlayed(p.sf) && !p.final) { const f = this._shuffle(p.sf.map(m => this.winnerOf(m))); p.final = this._ph(f[0], f[1], C.LEG2_WEEK); }
        });
        // the inter-confederation play-off
        const ic = S.wc && S.wc.ic;
        if (ic && ic.semis && ic.semis.length === 4) {
            if (!ic.sf) ic.sf = [this._ph(ic.semis[0], ic.semis[1], C.LEG1_WEEK), this._ph(ic.semis[2], ic.semis[3], C.LEG1_WEEK)];
            if (this._allPlayed(ic.sf) && !ic.finals) ic.finals = [this._ph(ic.seeds[0], this.winnerOf(ic.sf[0]), C.LEG2_WEEK), this._ph(ic.seeds[1], this.winnerOf(ic.sf[1]), C.LEG2_WEEK)];
        }
        if (S.am) {
            if (S.am.gold && S.am.gold.tour) this._preview16(S.am.gold.tour);
            if (S.am.copa && S.am.copa.tour) this._preview16(S.am.copa.tour);
            if (S.am.cnl) this._previewCnl(S.am.cnl);
        }
        if (S.caf) {
            if (S.caf.afq && S.caf.afq.tour) this._previewAfcon(S.caf.afq.tour);
            if (S.caf.anl && S.caf.anl.tour) this._preview16(S.caf.anl.tour);
        }
        if (S.ao) {
            if (S.ao.ac && S.ao.ac.tour) this._previewAc(S.ao.ac.tour);
            if (S.ao.onc && S.ao.onc.tour) this._previewOnc(S.ao.onc.tour);
            if (S.ao.nl && S.ao.nl.finals) stamp(S.ao.nl.finals.sf, C.AFCNL_FINALS_WEEK, 'A');
        }
    },
    // EURO 24 / 32, World Cup 48: the same pairings the tournament days use
    _previewEuroWc(T) {
        const TW = INTL_CONFIG.TOURNAMENT_WEEKS, K = T.ko, wc = T.size === 48, W = m => this.winnerOf(m);
        [wc ? K.r32 : K.r16].forEach(l => (l || []).forEach(m => { if (m.hg == null && m.w == null) { m.w = TW[3]; m.s = 'A'; } }));
        if (wc && this._allPlayed(K.r32) && !K.r16) {
            const r = K.r32.map(W);
            K.r16 = [[1, 16], [2, 15], [3, 11], [4, 9], [5, 14], [6, 13], [7, 12], [8, 10]].map(([x, z]) => this._ph(r[x - 1], r[z - 1], TW[4], 'A'));
        }
        if (this._allPlayed(K.r16) && !K.qf) {
            const r = K.r16.map(W), pairs = wc ? [[0, 2], [1, 3], [4, 6], [5, 7]] : T.size === 24 ? [[2, 0], [4, 5], [3, 1], [6, 7]] : [[0, 1], [2, 3], [4, 5], [6, 7]];
            K.qf = pairs.map(([x, z]) => this._ph(r[x], r[z], TW[4], wc ? 'B' : 'A'));
        }
        if (this._allPlayed(K.qf) && !K.sf) { const q = K.qf.map(W); K.sf = [this._ph(q[0], q[1], TW[5], 'A'), this._ph(q[2], q[3], TW[5], 'A')]; }
    },
    // the 16-team tournaments (Gold Cup, Copa, the African Nations Series Finals)
    _preview16(T) {
        const TW = INTL_CONFIG.TOURNAMENT_WEEKS, K = T.ko, W = m => this.winnerOf(m), Lo = m => this.loserOf(m);
        if (this._groupsPlayed(T.groups) && !K.qf) {
            const st = {}; T.groups.forEach(g => { st[g.id] = this.standings(g, 'rr'); });
            const P = (n, g) => st[g][n - 1].id;
            K.qf = [[P(1, 'A'), P(2, 'B')], [P(1, 'B'), P(2, 'A')], [P(1, 'C'), P(2, 'D')], [P(1, 'D'), P(2, 'C')]].map(([h, a]) => this._ph(h, a, TW[3], 'A'));
        }
        if (this._allPlayed(K.qf) && !K.sf) { const q = K.qf.map(W); K.sf = [this._ph(q[0], q[1], TW[4]), this._ph(q[2], q[3], TW[4])]; }
        if (this._allPlayed(K.sf) && !K.final) {
            const s = K.sf;
            if (T.thirdPlace) K.third = this._ph(Lo(s[0]), Lo(s[1]), TW[5], 'A');
            K.final = this._ph(W(s[0]), W(s[1]), TW[5], T.thirdPlace ? 'B' : 'A');
        }
    },
    _previewAfcon(T) {
        const TW = INTL_CONFIG.TOURNAMENT_WEEKS, K = T.ko, W = m => this.winnerOf(m);
        if (this._groupsPlayed(T.groups) && !K.r16) this._afconR16(T);
        if (this._allPlayed(K.r16) && !K.qf) { const r = K.r16.map(W); K.qf = [[0, 1], [2, 3], [4, 5], [6, 7]].map(([x, z]) => this._ph(r[x], r[z], TW[4])); }
        if (this._allPlayed(K.qf) && !K.sf) { const q = K.qf.map(W); K.sf = [this._ph(q[0], q[1], TW[5]), this._ph(q[2], q[3], TW[5])]; }
    },
    _previewAc(T) {
        const TW = INTL_CONFIG.TOURNAMENT_WEEKS, K = T.ko, W = m => this.winnerOf(m);
        (K.r16 || []).forEach(m => { if (m.hg == null && m.w == null) { m.w = TW[3]; m.s = 'A'; } });
        if (this._allPlayed(K.r16) && !K.qf) { const r = K.r16.map(W); K.qf = [[2, 0], [4, 5], [3, 1], [6, 7]].map(([x, z]) => this._ph(r[x], r[z], TW[4])); }
        if (this._allPlayed(K.qf) && !K.sf) { const q = K.qf.map(W); K.sf = [this._ph(q[0], q[1], TW[5]), this._ph(q[2], q[3], TW[5])]; }
    },
    _previewOnc(T) {
        const TW = INTL_CONFIG.TOURNAMENT_WEEKS, K = T.ko, W = m => this.winnerOf(m), Lo = m => this.loserOf(m);
        if (this._groupsPlayed(T.groups) && !K.sf) {
            const [A, B] = T.groups.map(g => this.standings(g, 'rr').map(r => r.id));
            K.sf = [this._ph(A[0], B[1], TW[3]), this._ph(B[0], A[1], TW[3])];
        }
        if (this._allPlayed(K.sf) && !K.final) { K.third = this._ph(Lo(K.sf[0]), Lo(K.sf[1]), TW[4], 'A'); K.final = this._ph(W(K.sf[0]), W(K.sf[1]), TW[4], 'B'); }
    },
    _previewCnl(N) {
        const C = INTL_CONFIG, at = i => this.slotOf(i), W = m => this.winnerOf(m), Lo = m => this.loserOf(m);
        const sf = at(C.CNL_SF_SLOT), fin = at(C.CNL_FINAL_SLOT);
        if (N.A.qf && N.A.qf.every(t => t.winner) && !N.A.sf) { const q = N.A.qf.map(t => t.winner); N.A.sf = [this._ph(q[0], q[3], sf.w, sf.s), this._ph(q[1], q[2], sf.w, sf.s)]; }
        ['B', 'C'].forEach(L => {
            const X = N[L];
            if (!X.sf && this._groupsPlayed(X.groups)) { const t = this._cnlChamp(N, L); X.sf = [this._ph(t[0], t[3], sf.w, sf.s), this._ph(t[1], t[2], sf.w, sf.s)]; }
        });
        ['A', 'B', 'C'].forEach(L => {
            const X = N[L];
            if (this._allPlayed(X.sf) && !X.final) { X.third = this._ph(Lo(X.sf[0]), Lo(X.sf[1]), fin.w, fin.s); X.final = this._ph(W(X.sf[0]), W(X.sf[1]), fin.w, fin.s); }
        });
    },
    // two-season qualifying: the CAF play-off, OFC Rounds 1 and 3
    _previewCycles() {
        const I = this.state(), C = INTL_CONFIG, W = m => this.winnerOf(m);
        const caf = (I.caf && I.caf.cycles) || {}, ao = (I.ao && I.ao.cycles) || {};
        Object.keys(caf).forEach(k => {
            const q = caf[k].q, P = q && q.playoff, y = +k.slice(3) - 1;
            if (!P) return;
            const a = this.slotOf(C.CAFQ_PLAYOFF_SF), b = this.slotOf(C.CAFQ_PLAYOFF_FINAL);
            if (!P.sf) P.sf = [this._ph(P.teams[0], P.teams[3], a.w, a.s, y), this._ph(P.teams[1], P.teams[2], a.w, a.s, y)];
            if (this._allPlayed(P.sf) && !P.final) P.final = this._ph(W(P.sf[0]), W(P.sf[1]), b.w, b.s, y);
        });
        Object.keys(ao).forEach(k => {
            const Q = ao[k].ofc; if (!Q) return;
            const y = Q.year, R1 = Q.r1, t = R1.teams;
            const s1 = this.slotOf(C.OFCQ_R1_SF_SLOT), s2 = this.slotOf(C.OFCQ_R1_FINAL_SLOT);
            if (t.length >= 3 && !R1.sf) R1.sf = t.length === 4 ? [this._ph(t[0], t[3], s1.w, s1.s, y), this._ph(t[1], t[2], s1.w, s1.s, y)] : [this._ph(t[1], t[2], s1.w, s1.s, y)];
            if (!R1.final && t.length >= 2) {
                if (t.length === 2) R1.final = this._ph(t[0], t[1], s2.w, s2.s, y);
                else if (this._allPlayed(R1.sf)) R1.final = t.length === 4 ? this._ph(W(R1.sf[0]), W(R1.sf[1]), s2.w, s2.s, y) : this._ph(t[0], W(R1.sf[0]), s2.w, s2.s, y);
            }
            const s7 = this.slotOf(C.OFCQ_R3_SF_SLOT), s8 = this.slotOf(C.OFCQ_R3_FINAL_SLOT);
            if (!Q.r3 && this._groupsPlayed(Q.r2.groups)) {
                const [A, B] = Q.r2.groups.map(g => this.standings(g, 'rr').map(r => r.id));
                Q.r3 = { sf: [this._ph(A[0], B[1], s7.w, s7.s, y), this._ph(B[0], A[1], s7.w, s7.s, y)], final: null };
            }
            if (Q.r3 && this._allPlayed(Q.r3.sf) && !Q.r3.final) Q.r3.final = this._ph(W(Q.r3.sf[0]), W(Q.r3.sf[1]), s8.w, s8.s, y);
        });
    },

    // ------------------------------------------------------------ Nations League positions
    // the group position of every team, per edition: UEFA League A-C, CONCACAF A-C, AFC Division 1-3
    _nlPositions(S) {
        const I = this.state(), R = I.nlp || (I.nlp = {});
        const put = (comp, season, tier, groups) => groups.forEach(g => this.standings(g, 'rr').forEach((r, i) => (R[r.id] = R[r.id] || []).push([comp, season, tier, i + 1])));
        if (S.type === 'NATIONS_LEAGUE' && S.leagues && !S._nlp && INTL_CONFIG.NL_LEAGUES.every(L => this._groupsPlayed(S.leagues[L].groups))) {
            INTL_CONFIG.NL_LEAGUES.forEach(L => put('INTL_NL', S.year, L, S.leagues[L].groups)); S._nlp = 1;
        }
        const N = S.am && S.am.cnl;
        if (N && !N._nlp && ['A', 'B', 'C'].every(L => this._groupsPlayed(N[L].groups))) {
            ['A', 'B', 'C'].forEach(L => put('INTL_CNL', S.year, L, N[L].groups));
            (N.seeds || []).forEach(id => (R[id] = R[id] || []).push(['INTL_CNL', S.year, 'A', 0]));   // seeded straight into the quarter-finals
            N._nlp = 1;
        }
        const A = S.ao && S.ao.nl;
        if (A && !A._nlp && A.divs.every(d => this._groupsPlayed(d.groups))) { A.divs.forEach((d, k) => put('INTL_AFCNL', A.year, String(k + 1), d.groups)); A._nlp = 1; }
        // the World Cup edition: complete in the World Cup season (MD10)
        Object.values((I.ao && I.ao.cycles) || {}).forEach(c => {
            const B = c.nl; if (!B || B._nlp || !B.divs.every(d => this._groupsPlayed(d.groups))) return;
            B.divs.forEach((d, k) => put('INTL_AFCNL', B.year, String(k + 1), d.groups)); B._nlp = 1;
        });
    },
    nationNlPositions(nid) { const I = this.state(); return ((I && I.nlp && I.nlp[nid]) || []).map(([comp, season, tier, pos]) => ({ comp, season, tier, pos })); },

    // ------------------------------------------------------------ friendlies, arranged ahead
    // the slot friendlies use in each week of break i: the week's first standard slot
    _friendlySlots(i) {
        const S = INTL_CONFIG.STD_SLOTS;
        return INTL_CONFIG.CALLUP_WINDOWS[i].weeks.map(w => S.find(([ww]) => ww === w)).filter(Boolean);
    },
    // replaces the Americas' live friendlies: arrange the next break's (live weeks only: a catch-up
    // never backfills), then play this week's
    _friendlies(S, w) {
        const C = INTL_CONFIG;
        if (this._live) C.CALLUP_WINDOWS.slice(0, 3).forEach((win, i) => { if (win.weeks[0] - C.FRIENDLY_SCHEDULE_AHEAD === w) this._arrangeFriendlies(S.year, i); });
        this._playFriendlies(S, w);
    },
    _arrangeFriendlies(y, i) {
        const I = this.state(), C = INTL_CONFIG, win = C.CALLUP_WINDOWS[i], A = this.am();
        const from = this._absKey(y, win.weeks[0]), to = this._absKey(y, win.weeks[win.weeks.length - 1]);
        // anyone with a competitive match already set in this break plays no friendlies in it
        const busy = new Set();
        this.knownFixtures().forEach(f => { if (f.L >= from && f.L <= to && f.c !== 'INTL_FRIENDLY') { busy.add(f.h); busy.add(f.a); } });
        // never the same friendly twice within FRIENDLY_NO_REPEAT_WEEKS (played or arranged)
        const key = (a, b) => a < b ? a + '|' + b : b + '|' + a, recent = new Set(), fr = this._compCode('INTL_FRIENDLY');
        (I.res || []).forEach(e => { if (e[5] === fr && e[0] >= from - C.FRIENDLY_NO_REPEAT_WEEKS) recent.add(key(e[1], e[2])); });
        (I.fs || []).forEach(e => recent.add(key(e[1], e[2])));
        const prob = id => { const r = this.rep(id); for (const [min, p] of C.FRIENDLY_PLAY_PROB) if (r >= min) return p; return 0; };
        const near = (x, z) => { const a = this.conf(x), b = this.conf(z); if (a === b) return C.FRIENDLY_DIST_SAME;
            return C.FRIENDLY_NEIGHBOURS.some(([p, q]) => (p === a && q === b) || (p === b && q === a)) ? C.FRIENDLY_DIST_NEIGHBOUR : C.FRIENDLY_DIST_FAR; };
        const mem = id => A.fr[id] || (A.fr[id] = { opp: [], home: -1 });
        const free = NATIONS.filter(n => !n.suspended && !busy.has(n.id)).map(n => n.id);
        I.fs = I.fs || [];
        this._friendlySlots(i).forEach(([w, s]) => {
            const L = this._absKey(y, w);
            const willing = this.sortStrength(free.filter(id => Rng.next() < prob(id)));
            const open = new Set(willing);
            willing.forEach(id => {
                if (!open.has(id)) return;
                open.delete(id);
                let cand = [...open].filter(o => !recent.has(key(id, o)) && this._prohibitedOk([o], id));
                const cross = Rng.next() < C.FRIENDLY_CROSS_SHARE;
                const want = cand.filter(o => (this.conf(o) !== this.conf(id)) === cross);
                if (want.length) cand = want;
                if (!cand.length) return;
                // the closest in strength (and geography), with noise, then one of the best few
                const ranked = cand.map(o => ({ o, sc: Math.abs(this.rep(id) - this.rep(o)) + near(id, o) + Rng.next() * C.FRIENDLY_SCORE_NOISE }))
                    .sort((a, b) => a.sc - b.sc).slice(0, C.FRIENDLY_PICK_FROM);
                const tot = ranked.reduce((t, x, k) => t + 1 / (k + 1), 0);
                let r = Rng.next() * tot, pick = ranked[0].o;
                for (let k = 0; k < ranked.length; k++) { r -= 1 / (k + 1); if (r <= 0) { pick = ranked[k].o; break; } }
                open.delete(pick); recent.add(key(id, pick));
                const [h, a] = mem(id).home <= mem(pick).home ? [id, pick] : [pick, id];
                const neutral = this.conf(id) !== this.conf(pick) && Rng.next() < C.FRIENDLY_NEUTRAL_CROSS;
                if (!neutral) mem(h).home = L;
                I.fs.push([L, h, a, neutral ? 1 : 0, s]);
            });
        });
    },
    _playFriendlies(S, w) {
        const I = this.state(); if (!I.fs || !I.fs.length) return;
        const L = this._absKey(S.year, w), keep = [];
        I.fs.forEach(e => {
            const [EL, h, a, n, s] = e;
            if (EL > L) { keep.push(e); return; }
            if (EL < L) return;                                   // a week that was never played (an old save): dropped
            const busy = this._slotTeams[w + s] || new Set();
            if (busy.has(h) || busy.has(a)) return;              // a competitive match came up in that slot: called off
            const fx = this._play(h, a, { week: w, slot: s, neutral: !!n, comp: 'INTL_FRIENDLY', stage: 'friendly' });
            S.am = S.am || {};
            (S.am.fr = S.am.fr || []).push([h, a, fx.hg, fx.ag, this.slotIdx(w, s), n ? 1 : 0]);
        });
        I.fs = keep;
    },

    // ------------------------------------------------------------ every fixture already set
    // [{ L, h, a, c, st, n }] not played yet, both teams known (n: neutral venue)
    knownFixtures() {
        const I = this.state(); if (!I) return [];
        const C = INTL_CONFIG, y = GameState.seasonStartYear, w0 = GameState.week, out = [];
        const now = this._absKey(w0 <= 2 ? y - 1 : y, w0);
        const ok = id => typeof id === 'string' && !!NATIONS_BY_ID[id];
        const add = (season, w, s, h, a, c, st, n) => {
            if (!w || !ok(h) || !ok(a)) return;
            const L = this._absKey(season, w);
            if (L > now || (L === now && !this._playedNow(h, a))) out.push({ L, s: s || 'A', h, a, c, st: st || '', n: n ? 1 : 0 });
        };
        const fxs = (season, list, c, n) => (list || []).forEach(f => { if (f && f.hg == null) add(f.y != null ? f.y : season, f.w, f.s, f.h, f.a, f.c || c, f.st, n); });
        const groups = (season, gs, c) => (gs || []).forEach(g => fxs(season, g.fx, c));
        const at = i => this.slotOf(i);
        const tie = (season, t, i1, i2, c, st) => {
            if (!t || !ok(t.hi) || !ok(t.lo)) return;
            const a = typeof i1 === 'number' ? at(i1) : i1, b = typeof i2 === 'number' ? at(i2) : i2;
            if (!t.leg1) add(season, a.w, a.s, t.lo, t.hi, c, st);
            if (!t.leg2) add(season, b.w, b.s, t.hi, t.lo, c, st);
        };
        const tour = (season, T, c) => {
            if (!T) return;
            (T.groups || []).forEach(g => (g.fx || []).forEach(f => { if (f.hg == null) add(season, f.w || C.TOURNAMENT_WEEKS[(f.md || 1) - 1], 'A', f.h, f.a, T.comp || c, 'group', 1); }));
            Object.keys(T.ko || {}).forEach(k => [].concat(T.ko[k] || []).forEach(m => { if (m && m.hg == null) add(season, m.w, m.s, m.h, m.a, T.comp || c, k, 1); }));
        };
        const legs = { w: C.LEG1_WEEK, s: 'A' }, legs2 = { w: C.LEG2_WEEK, s: 'A' };
        [y - 1, y].forEach(sy => {
            const S = I.seasons[sy]; if (!S) return;
            if (S.leagues) C.NL_LEAGUES.forEach(L => groups(sy, S.leagues[L].groups, 'INTL_NL'));
            (S.qf || []).forEach(t => tie(sy, t, legs, legs2, 'INTL_NL', 'qf'));
            if (S.po && S.po.AB) S.po.AB.concat(S.po.BC).forEach(t => tie(sy, t, legs, legs2, 'INTL_NL', 'po'));
            if (S.finals) fxs(sy, S.finals.sf, 'INTL_NL', 1);
            if (S.l1) groups(sy, S.l1.groups.concat(S.l2.groups), 'INTL_QUAL');
            if (S.po && S.po.paths) S.po.paths.forEach(p => { fxs(sy, p.sf, 'INTL_QUAL'); fxs(sy, p.final ? [p.final] : [], 'INTL_QUAL'); });
            if (S.wc && S.wc.ic) { fxs(sy, S.wc.ic.sf, 'INTL_WC', 1); fxs(sy, S.wc.ic.finals, 'INTL_WC', 1); }
            if (S.tour) tour(sy, S.tour, S.type === 'WORLD_CUP' ? 'INTL_WC' : 'INTL_EURO');
            const M = S.am;
            if (M) {
                if (M.cnl) {
                    ['A', 'B', 'C'].forEach(L => { groups(sy, M.cnl[L].groups, 'INTL_CNL'); fxs(sy, M.cnl[L].sf, 'INTL_CNL', 1); fxs(sy, [M.cnl[L].third, M.cnl[L].final].filter(Boolean), 'INTL_CNL', 1); });
                    (M.cnl.A.qf || []).forEach(t => tie(sy, t, C.CNL_A_QF_SLOTS[0], C.CNL_A_QF_SLOTS[1], 'INTL_CNL', 'qf'));
                }
                if (M.gold) { (M.gold.prelims || []).forEach(t => tie(sy, t, C.GOLD_PRELIM_SLOTS[0], C.GOLD_PRELIM_SLOTS[1], 'INTL_GOLD', 'prelim')); tour(sy, M.gold.tour, 'INTL_GOLD'); }
                if (M.copa) {
                    (M.copa.playin || []).forEach(t => { if (!t.fx) { const p = at(C.COPA_PLAYIN_SLOT); add(sy, p.w, p.s, t.hi, t.lo, 'INTL_COPA', 'playin'); } });
                    tour(sy, M.copa.tour, 'INTL_COPA');
                }
            }
            const F = S.caf;
            if (F) {
                if (F.afq) { (F.afq.prelim || []).forEach(t => tie(sy, t, C.AFQ_PRELIM_SLOTS[0], C.AFQ_PRELIM_SLOTS[1], 'INTL_AFCONQ', 'prelim')); groups(sy, F.afq.groups, 'INTL_AFCONQ'); tour(sy, F.afq.tour, 'INTL_AFCON'); }
                if (F.anl) { F.anl.zones.forEach(z => groups(sy, z.groups, 'INTL_ANL')); tour(sy, F.anl.tour, 'INTL_ANL'); }
            }
            const O = S.ao;
            if (O) {
                if (O.nl) {
                    O.nl.divs.forEach(d => groups(sy, d.groups, 'INTL_AFCNL'));
                    const k1 = C.AFCNL_KO_SLOTS[0], k2 = C.AFCNL_KO_SLOTS[1];
                    (O.nl.qf || []).forEach(t => tie(sy, t, k1, k2, 'INTL_AFCNL', 'qf'));
                    if (O.nl.po) O.nl.po.d12.concat(O.nl.po.d23).forEach(t => tie(sy, t, k1, k2, 'INTL_AFCNL', 'po'));
                    if (O.nl.finals) fxs(sy, O.nl.finals.sf, 'INTL_AFCNL', 1);
                }
                if (O.ac) tour(sy, O.ac.tour, 'INTL_AC');
                if (O.onc) { groups(sy, [O.onc.q], 'INTL_ONCQ'); tour(sy, O.onc.tour, 'INTL_ONC'); }
            }
        });
        // qualifying that spans seasons (fixtures carry their own season, or the cycle's)
        Object.keys((I.am && I.am.cycles) || {}).forEach(k => {
            const c = I.am.cycles[k], wy = +k.slice(3);
            if (c.cm) fxs(wy - 3, c.cm.fx, 'INTL_CMQ');
            if (c.cc) {
                (c.cc.r1 || []).forEach(t => tie(wy - 3, t, C.CCQ_R1_SLOTS[0], C.CCQ_R1_SLOTS[1], 'INTL_CCQ', 'r1'));
                groups(wy - 3, c.cc.r2 && c.cc.r2.groups, 'INTL_CCQ');
                if (c.cc.r3) groups(wy - 1, c.cc.r3.groups, 'INTL_CCQ');
            }
        });
        Object.keys((I.caf && I.caf.cycles) || {}).forEach(k => {
            const q = I.caf.cycles[k].q; if (!q) return;
            groups(+k.slice(3) - 2, q.groups, 'INTL_CAFQ');
            if (q.playoff) { fxs(0, q.playoff.sf, 'INTL_CAFQ', 1); fxs(0, q.playoff.final ? [q.playoff.final] : [], 'INTL_CAFQ', 1); }
        });
        Object.keys((I.ao && I.ao.cycles) || {}).forEach(k => {
            const c = I.ao.cycles[k];
            if (c.nl) { c.nl.divs.forEach(d => groups(c.nl.year, d.groups, 'INTL_AFCNL')); if (c.nl.playoff) groups(c.nl.year + 1, [c.nl.playoff], 'INTL_AFCQ'); }
            if (c.ofc) {
                const Q = c.ofc;
                fxs(Q.year, Q.r1.sf, 'INTL_OFCQ', 1); fxs(Q.year, Q.r1.final ? [Q.r1.final] : [], 'INTL_OFCQ', 1);
                groups(Q.year, Q.r2.groups, 'INTL_OFCQ');
                if (Q.r3) { fxs(Q.year, Q.r3.sf, 'INTL_OFCQ', 1); fxs(Q.year, Q.r3.final ? [Q.r3.final] : [], 'INTL_OFCQ', 1); }
            }
        });
        (I.fs || []).forEach(([L, h, a, n, s]) => { if (L >= now) out.push({ L, s, h, a, c: 'INTL_FRIENDLY', st: 'friendly', n }); });
        return out.sort((a, b) => a.L - b.L || (a.s < b.s ? -1 : 1));
    },
    // already played this week (the list is read mid-week by the UI)
    _playedNow(h, a) {
        const I = this.state(), y = GameState.seasonStartYear, w = GameState.week, L = this._absKey(w <= 2 ? y - 1 : y, w);
        return (I.res || []).some(e => e[0] === L && ((e[1] === h && e[2] === a) || (e[1] === a && e[2] === h)));
    },
    // a nation's fixtures to come, soonest first: { L, season, week, opp, comp, stage, venue }
    nationSchedule(nid) {
        return this.knownFixtures().filter(f => f.h === nid || f.a === nid).map(f => {
            const season = Math.floor((f.L - 3) / 52), wk = f.L - season * 52;
            return { L: f.L, season, week: wk > 52 ? wk - 52 : wk, opp: f.h === nid ? f.a : f.h, comp: f.c, stage: f.st, venue: f.n ? 'N' : f.h === nid ? 'H' : 'A', upcoming: true };
        });
    },
});
