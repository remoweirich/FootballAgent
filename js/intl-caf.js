// ============================================================
//  International football in Africa (docs/international.md, "Africa"): Africa Cup of Nations
//  (28) with its qualifiers, the African Nations League (zonal groups + 16-team Finals), CAF World
//  Cup qualifiers with the CAF play-off. Every CAF tournament is played in the summer window.
//
//  Built on js/internationals.js and js/intl-americas.js (slots, templates, 16-team tournaments).
//  State: per season on I.seasons[y].caf; World Cup qualifying (two seasons) on I.caf.cycles; the
//  region's own catch-up cursor on I.caf.last.
// ============================================================
Object.assign(Internationals, {
    CAF_COMPS: { INTL_AFCONQ: 1, INTL_AFCON: 1, INTL_ANL: 1, INTL_CAFQ: 1 },
    caf() {
        const I = this.state();
        if (!I.caf) I.caf = { cycles: {}, last: null };
        return I.caf;
    },
    // what CAF plays in season y: 'AFCON' | 'ANL' | 'WCQ' | 'WCQ_END' | null (friendlies only)
    cafSeason(y) {
        const C = INTL_CONFIG;
        if (!this.active(y)) return null;
        if (C.CAF_SEASON_OVERRIDES[y]) return C.CAF_SEASON_OVERRIDES[y];
        const t = C.CAF_BY_POS[this.cyclePos(y)];
        return t === 'ANL' && y < C.ANL_FROM ? null : t;
    },
    // CAF World Cup qualifiers: group of 6, double round-robin (appendix), 1-based slots
    G6D: [[[1, 6], [2, 5], [3, 4]], [[6, 4], [5, 3], [1, 2]], [[2, 6], [3, 1], [4, 5]], [[5, 6], [4, 1], [3, 2]], [[6, 3], [2, 4], [1, 5]],
        [[6, 1], [5, 2], [4, 3]], [[4, 6], [3, 5], [2, 1]], [[6, 2], [1, 3], [5, 4]], [[6, 5], [1, 4], [2, 3]], [[3, 6], [4, 2], [5, 1]]],

    // ------------------------------------------------------------ the weekly entry points
    _cafDraw(S) {
        if (!S) return;
        const y = S.year, K = this.caf();
        S.caf = S.caf || {};
        Object.keys(K.cycles).forEach(k => { if (+k.slice(3) < y) delete K.cycles[k]; });
        const t = this.cafSeason(y);
        if (t === 'AFCON') S.caf.afq = this._afqDraw(y);
        if (t === 'ANL') S.caf.anl = this._anlDraw(y);
        if (t === 'WCQ') K.cycles['WC-' + (y + 2)] = { q: this._cafqDraw(y) };
    },
    _cafWeek(S, w) {
        if (!S || !S.caf) return;
        const C = INTL_CONFIG;
        C.STD_SLOTS.forEach(([ww, s], i) => { if (ww === w) this._cafSlot(S, i + 1, w, s); });
        if (w === C.FINALS_DRAW_WEEK) {
            if (S.caf.afq) this._afconDraw(S);
            if (S.caf.anl) this._anlFinalsDraw(S);
        }
    },
    _cafSlot(S, i, w, s) {
        const C = INTL_CONFIG, y = S.year, t = this.cafSeason(y);
        if (S.caf.afq) this._afqSlot(S.caf.afq, i, w, s);
        if (S.caf.anl) {
            const A = S.caf.anl;
            this._amPlayGroups(A.zones.reduce((a, z) => a.concat(z.groups), []), w, s, 'INTL_ANL');
            if (i === C.ANL_BIG_SLOTS.slice(-1)[0] && !A.qualified) this._anlQualify(A);
        }
        const cyc = this.caf().cycles['WC-' + (y + (t === 'WCQ' ? 2 : 1))];
        if (cyc && cyc.q && (t === 'WCQ' || t === 'WCQ_END')) this._cafqSlot(cyc.q, y, t, i, w, s);
    },
    _cafTournamentDay(S, day) {
        if (!S || !S.caf || day < 0) return;
        if (S.caf.afq && S.caf.afq.tour) this._afconDay(S, day);
        if (S.caf.anl && S.caf.anl.tour) this._anlFinalsDay(S, day);
    },

    // ------------------------------------------------------------ AFCON qualifiers
    _afqDraw(y) {
        const C = INTL_CONFIG;
        const key = 'AFCON-' + (y + 1), hosts = this.hostsForKey(key);
        const field = this.sortStrength(this.confIds('CAF', { fifa: true }));
        const n = C.AFQ_PRELIM_TEAMS, pre = field.slice(field.length - n), byes = field.slice(0, field.length - n);
        const prelim = [];
        for (let k = 0; k < n / 2; k++) prelim.push({ hi: pre[k], lo: pre[n - 1 - k], leg1: null, leg2: null, winner: null });
        const entries = byes.concat(prelim.map((t, k) => 'PW' + (k + 1)));
        const per = entries.length / 4;
        const pots = [0, 1, 2, 3].map(p => entries.slice(p * per, (p + 1) * per));
        const groups = this._drawGroups(pots, C.AFQ_GROUPS);
        return { key, hosts, prelim, groups: groups.map((teams, g) => ({ id: 'Q' + (g + 1), teams, fx: null })), qualified: null, tour: null };
    },
    _afqSlot(Q, i, w, s) {
        const C = INTL_CONFIG;
        if (i === C.AFQ_PRELIM_SLOTS[0]) Q.prelim.forEach(t => this._amLeg(t, 1, w, s, 'INTL_AFCONQ', 'prelim'));
        if (i === C.AFQ_PRELIM_SLOTS[1]) Q.prelim.forEach(t => this._amLeg(t, 2, w, s, 'INTL_AFCONQ', 'prelim'));
        if (i === C.AFQ_GROUP_SLOTS[0] && !Q.groups[0].fx) {
            Q.groups.forEach(g => {
                g.teams = g.teams.map(t => /^PW\d+$/.test(t) ? Q.prelim[+t.slice(2) - 1].winner : t);
                g.fx = this._amFixtures(g.teams, this.G4D, C.AFQ_GROUP_SLOTS, 'INTL_AFCONQ');
            });
        }
        if (Q.groups[0].fx) this._amPlayGroups(Q.groups, w, s, 'INTL_AFCONQ');
        if (i === C.AFQ_GROUP_SLOTS.slice(-1)[0] && !Q.qualified) this._afqQualify(Q);
    },
    // top 2 non-host per group + the best (4 - H) non-host thirds + the H hosts = 28
    _afqQualify(Q) {
        const C = INTL_CONFIG, H = Q.hosts.length;
        const orders = Q.groups.map(g => this.standings(g, 'rr').filter(r => !Q.hosts.includes(r.id)));
        const direct = orders.reduce((a, o) => a.concat(o.slice(0, 2).map(r => r.id)), []);
        const thirds = this.crossRank(orders.map(o => o[2]).filter(Boolean)).slice(0, Math.max(0, C.AFCON_THIRDS - H)).map(r => r.id);
        Q.qualified = { direct, thirds, hosts: Q.hosts.slice() };
    },

    // ------------------------------------------------------------ AFCON (28)
    _afconDraw(S) {
        const Q = S.caf.afq; if (!Q.qualified) return;
        const C = INTL_CONFIG;
        const teams = Q.qualified.hosts.concat(Q.qualified.direct, Q.qualified.thirds);
        this._assert(teams.length === C.AFCON_TEAMS && new Set(teams).size === C.AFCON_TEAMS, `AFCON: ${teams.length} teams`);
        const hosts = Q.hosts.filter(id => teams.includes(id));
        const ranked = hosts.concat(this.sortStrength(teams.filter(id => !hosts.includes(id))));
        const pots = [0, 1, 2, 3].map(p => ranked.slice(p * 7, p * 7 + 7));
        const ok = (g, id) => !(hosts.includes(id) && g.some(x => hosts.includes(x)));
        const groups = this._drawGroups(pots, 7, ok).sort((x, y) => (hosts.includes(y[0]) ? 1 : 0) - (hosts.includes(x[0]) ? 1 : 0));
        Q.tour = { comp: 'INTL_AFCON', size: 28, hosts, md1Only: [], groups: groups.map((t, k) => ({ id: 'ABCDEFG'[k], teams: t, fx: this._tourGroupFixtures(t) })), ko: {}, winner: null };
    },
    _afconDay(S, day) {
        const T = S.caf.afq.tour, week = INTL_CONFIG.TOURNAMENT_WEEKS[day];
        const B = INTL_CONFIG.TOURNAMENT_HOST_BOOST || 0;
        const opt = (h, a, slot, stage) => ({ week, slot, neutral: true, advH: false, advA: false, bH: T.hosts.includes(h) ? B : 0, bA: T.hosts.includes(a) ? B : 0, ko: stage !== 'group', comp: 'INTL_AFCON', stage });
        const W = m => this.winnerOf(m), Lo = m => this.loserOf(m), K = T.ko;
        const play = (h, a, slot, stage) => this._play(h, a, opt(h, a, slot, stage));
        if (day <= 2) {
            T.groups.forEach(g => g.fx.forEach(f => {
                if (f.md !== day + 1) return;
                const r = play(f.h, f.a, 'A', 'group'); f.hg = r.hg; f.ag = r.ag; f.w = week; f.s = 'A';
            }));
            return;
        }
        if (day === 3) {
            if (!K.r16 || K.r16.some(m => m.hg != null)) this._afconR16(T);
            K.r16 = K.r16.map(m => play(m.h, m.a, 'A', 'r16'));
        } else if (day === 4) {
            const r = K.r16.map(W);
            K.qf = [[0, 1], [2, 3], [4, 5], [6, 7]].map(([x, y]) => play(r[x], r[y], 'A', 'qf'));
        } else if (day === 5) {
            const q = K.qf.map(W);
            K.sf = [play(q[0], q[1], 'A', 'sf'), play(q[2], q[3], 'A', 'sf')];
            K.third = play(Lo(K.sf[0]), Lo(K.sf[1]), 'B', 'third');
            K.final = play(W(K.sf[0]), W(K.sf[1]), 'B', 'final');
            T.winner = W(K.final); T.runnerUp = Lo(K.final);
            const H = this.state().honours;
            H.AFCON = (H.AFCON || []).concat([{ season: S.year, year: S.year + 1, winner: T.winner, runnerUp: T.runnerUp, third: W(K.third), hosts: T.hosts.slice(), final: this._finalRec(K.final) }]);
            if (this._recordFinishes) this._recordFinishes('INTL_AFCON', S.year + 1, T);
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(T.winner), opp: this.name(T.runnerUp), score: this._score(K.final), comp: compName('INTL_AFCON') + ' ' + (S.year + 1) });
        }
    },

    // the AFCON Round of 16 from the final group tables (the 2 best thirds matched to B and D)
    _afconR16(T) {
        const st = {}; T.groups.forEach(g => { st[g.id] = this.standings(g, 'rr'); });
        const P = (n, g) => st[g][n - 1].id;
        const thirds = this.crossRank(T.groups.map(g => Object.assign({ gid: g.id }, st[g.id][2]))).slice(0, INTL_CONFIG.AFCON_R16_THIRDS);
        T.thirds = thirds.map(r => r.id);
        const m = this._matchThirds(['B', 'D'], thirds.map(r => ({ id: r.id, g: r.gid })), (wg, t) => t.g !== wg);
        const pairs = [[P(1, 'A'), P(2, 'C')], [P(1, 'B'), m.B], [P(1, 'E'), P(2, 'F')], [P(2, 'D'), P(2, 'G')],
            [P(1, 'C'), P(2, 'A')], [P(1, 'D'), m.D], [P(1, 'F'), P(2, 'E')], [P(1, 'G'), P(2, 'B')]];
        const w = INTL_CONFIG.TOURNAMENT_WEEKS[3];
        T.ko.r16 = pairs.map(([h, a]) => ({ h, a, hg: null, ag: null, w, s: 'A' }));
    },

    // ------------------------------------------------------------ African Nations League
    _anlDraw(y) {
        const C = INTL_CONFIG;
        const zones = C.ANL_ZONES.map(z => {
            const ids = this.sortStrength(NATIONS.filter(n => n.confederation === 'CAF' && n.zone === z && !n.suspended).map(n => n.id));
            if (z === 'NORTH') {
                const teams = this._shuffle(ids.slice());   // the slot draw for the single group
                return { id: z, groups: [{ id: 'N', teams, fx: this._amFixtures(teams, this.G6D.slice(0, 5), C.ANL_NORTH_SLOTS, 'INTL_ANL') }] };
            }
            const groups = this._drawGroups([0, 1, 2, 3].map(p => ids.slice(p * 4, p * 4 + 4)), 4);
            return { id: z, groups: groups.map((teams, g) => ({ id: z[0] + (g + 1), teams, fx: this._amFixtures(teams, this.G4D, C.ANL_BIG_SLOTS, 'INTL_ANL') })) };
        });
        return { zones, qualified: null, tour: null, host: this.hostsForKey('ANLF-' + (y + 1))[0] || null };
    },
    // the Finals 16: North's top 2, the 12 group winners, the 2 best runners-up
    _anlQualify(A) {
        const C = INTL_CONFIG;
        const north = A.zones.find(z => z.id === 'NORTH'), big = A.zones.filter(z => z.id !== 'NORTH');
        const northIn = this.standings(north.groups[0], 'rr').slice(0, C.ANL_NORTH_THROUGH).map(r => r.id);
        const st = big.reduce((a, z) => a.concat(z.groups.map(g => this.standings(g, 'rr'))), []);
        const winners = st.map(t => t[0].id);
        const runners = this.crossRank(st.map(t => t[1])).slice(0, C.ANL_RUNNERS_UP).map(r => r.id);
        A.qualified = { north: northIn, winners, runners };
    },
    _anlFinalsDraw(S) {
        const A = S.caf.anl; if (!A.qualified) return;
        const teams = A.qualified.north.concat(A.qualified.winners, A.qualified.runners);
        this._assert(teams.length === 16 && new Set(teams).size === 16, `African Nations League Finals: ${teams.length} teams`);
        const zone = id => (NATIONS_BY_ID[id] || {}).zone;
        const ok = (g, id) => g.filter(x => zone(x) === zone(id)).length < (zone(id) === 'NORTH' ? 1 : INTL_CONFIG.ANL_FINALS_MAX_PER_ZONE);
        // neutral host: nobody gets home advantage and nobody qualifies by hosting
        A.tour = this._amTournament(teams, [], { comp: 'INTL_ANL', thirdPlace: true, extraOk: ok });
        A.tour.venue = A.host;
    },
    _anlFinalsDay(S, day) {
        const T = S.caf.anl.tour;
        this._amTourDay(T, day, false, () => {
            const H = this.state().honours;
            H.ANL = (H.ANL || []).concat([{ season: S.year, year: S.year + 1, winner: T.winner, runnerUp: T.runnerUp, third: T.ko.third ? this.winnerOf(T.ko.third) : null, hosts: T.venue ? [T.venue] : [], final: this._finalRec(T.ko.final) }]);
            if (this._recordFinishes) this._recordFinishes('INTL_ANL', S.year + 1, T);
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(T.winner), opp: this.name(T.runnerUp), score: this._score(T.ko.final), comp: compName('INTL_ANL') });
        });
    },

    // ------------------------------------------------------------ CAF World Cup qualifiers
    _cafqDraw(y) {
        const C = INTL_CONFIG, key = 'WC-' + (y + 2);
        const hosts = this.hostsForKey(key).filter(id => this.conf(id) === 'CAF');
        const field = this.sortStrength(this.confIds('CAF', { fifa: true }));
        const pots = [0, 1, 2, 3, 4, 5].map(p => field.slice(p * 9, p * 9 + 9));
        const groups = this._drawGroups(pots, C.CAFQ_GROUPS);
        const slots = C.CAFQ_SLOTS.NL_BEFORE.map(i => [y, i]).concat(C.CAFQ_SLOTS.WC.map(i => [y + 1, i]));
        return {
            key, hosts, playoff: null, result: null,
            groups: groups.map((teams, g) => {
                const fx = [];
                this.G6D.forEach((md, k) => md.forEach(([x, z]) => {
                    const [sy, si] = slots[k]; const { w, s } = this.slotOf(si);
                    fx.push({ h: teams[x - 1], a: teams[z - 1], md: k + 1, y: sy, w, s, c: 'INTL_CAFQ', hg: null, ag: null });
                }));
                return { id: 'C' + (g + 1), teams, fx };
            }),
        };
    },
    _cafqSlot(q, y, t, i, w, s) {
        const C = INTL_CONFIG;
        q.groups.forEach(g => g.fx.forEach(f => {
            if (f.y !== y || f.w !== w || f.s !== s || f.hg != null) return;
            const r = this._play(f.h, f.a, { week: w, slot: s, comp: 'INTL_CAFQ', stage: 'group' });
            f.hg = r.hg; f.ag = r.ag;
        }));
        if (t !== 'WCQ_END') return;
        if (i === C.CAFQ_SLOTS.WC.slice(-1)[0] && !q.ranking) this._cafqRank(q);
        const ko = { neutral: true, ko: true, comp: 'INTL_CAFQ' };
        if (i === C.CAFQ_PLAYOFF_SF && q.playoff) {
            const P = q.playoff.teams;
            q.playoff.sf = [this._play(P[0], P[3], Object.assign({ week: w, slot: s, stage: 'posf' }, ko)), this._play(P[1], P[2], Object.assign({ week: w, slot: s, stage: 'posf' }, ko))];
        }
        if (i === C.CAFQ_PLAYOFF_FINAL && q.playoff && q.playoff.sf) {
            const f = q.playoff.sf.map(m => this.winnerOf(m));
            q.playoff.final = this._play(f[0], f[1], Object.assign({ week: w, slot: s, stage: 'pofinal' }, ko));
            q.result.po = [this.winnerOf(q.playoff.final)];
        }
    },
    // group winner = the best non-host team; direct = the best 9 - H winners; play-off = the other H
    // winners + the best 4 - H non-host runners-up (semi-finals by reputation, 1v4 and 2v3)
    _cafqRank(q) {
        const C = INTL_CONFIG, H = q.hosts.length;
        const orders = q.groups.map(g => this.standings(g, 'rr').filter(r => !q.hosts.includes(r.id)));
        const winners = this.crossRank(orders.map(o => o[0])).map(r => r.id);
        const runners = this.crossRank(orders.map(o => o[1])).map(r => r.id);
        q.ranking = { winners, runners };
        const direct = winners.slice(0, C.CAFQ_DIRECT - H);
        const po = this.sortStrength(winners.slice(C.CAFQ_DIRECT - H).concat(runners.slice(0, 4 - H)));
        q.playoff = { teams: po, sf: null, final: null };
        q.result = { direct, po: [] };
        this._assert(po.length === 4, `CAF play-off: ${po.length} teams`);
    },

    // ------------------------------------------------------------ checks
    _cafCheck(y, w, S, ti) {
        const want = this.cafExpected(y, w, S, ti), got = this._cafCount || {};
        new Set([...Object.keys(want), ...Object.keys(got)]).forEach(k => this._assert((want[k] || 0) === (got[k] || 0), `Africa, season ${y} week ${k}: ${got[k] || 0} matches, expected ${want[k] || 0}`));
    },
    // expected CAF matches per slot (sections 2-5 and 7 of the plan)
    cafExpected(y, w, S, ti) {
        const out = {}; if (!S || !S.caf) return out;
        const C = INTL_CONFIG, t = this.cafSeason(y);
        const add = (k, n) => { if (n) out[k] = (out[k] || 0) + n; };
        C.STD_SLOTS.forEach(([ww, s], i0) => {
            if (ww !== w) return;
            const i = i0 + 1, k = w + s;
            if (S.caf.afq) { if (C.AFQ_PRELIM_SLOTS.includes(i)) add(k, S.caf.afq.prelim.length); if (C.AFQ_GROUP_SLOTS.includes(i)) add(k, 24); }
            if (S.caf.anl) add(k, (C.ANL_BIG_SLOTS.includes(i) ? 24 : 0) + (C.ANL_NORTH_SLOTS.includes(i) ? 3 : 0));
            const cyc = this.caf().cycles['WC-' + (y + (t === 'WCQ' ? 2 : 1))];
            if (cyc && cyc.q && (t === 'WCQ' || t === 'WCQ_END')) {
                add(k, cyc.q.groups.reduce((a, g) => a + g.fx.filter(f => f.y === y && f.w === w && f.s === s).length, 0));
                if (t === 'WCQ_END' && cyc.q.playoff) { if (i === C.CAFQ_PLAYOFF_SF) add(k, 2); if (i === C.CAFQ_PLAYOFF_FINAL) add(k, 1); }
            }
        });
        if (ti >= 0) {
            const tw = C.TOURNAMENT_WEEKS[ti];
            if (S.caf.afq && S.caf.afq.tour) {
                if (ti <= 2) add(tw + 'A', 14); else if (ti === 3) add(tw + 'A', 8); else if (ti === 4) add(tw + 'A', 4); else { add(tw + 'A', 2); add(tw + 'B', 2); }
            }
            if (S.caf.anl && S.caf.anl.tour) {
                if (ti <= 2) add(tw + 'A', 8); else if (ti === 3) add(tw + 'A', 4); else if (ti === 4) add(tw + 'A', 2); else { add(tw + 'A', 1); add(tw + 'B', 1); }
            }
        }
        return out;
    },
});
