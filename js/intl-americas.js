// ============================================================
//  International football in the Americas (docs/international.md, "The Americas"): CONMEBOL
//  World Cup qualifiers, Copa América, CONCACAF Nations League, Gold Cup (with preliminary round)
//  and World Cup qualifiers, friendlies for every nation, and the Finalissima.
//
//  Built on js/internationals.js: same draws, tables, matches, knockouts and checks. The standard
//  slots S1-S8 are INTL_CONFIG.STD_SLOTS (11A, 12A, 12B, 17A, 18A, 18B, 36A, 37A).
//
//  State: per season on I.seasons[y].am; across seasons on I.am:
//    cycles   { 'WC-2030': { cm, cc } } World Cup qualifying (CONMEBOL spans three seasons)
//    cnl      Nations League membership + seeds for the next edition
//    lastGold the last Gold Cup's semi-finalists and quarter-final losers (Copa entry)
//    fr       per nation: last friendly opponents, last time at home (friendly scheduling)
//    last     the last week the Americas have been processed (separate from I.last, so a save
//             that already had the European competitions catches up the Americas on its own)
// ============================================================
Object.assign(Internationals, {
    // ------------------------------------------------------------ basics
    cyclePos(y) { return ({ 2: 'NL_AFTER', 3: 'EURO', 0: 'NL_BEFORE', 1: 'WC' })[((y % 4) + 4) % 4]; },
    slotIdx(w, s) { const i = INTL_CONFIG.STD_SLOTS.findIndex(([ww, ss]) => ww === w && ss === s); return i < 0 ? 0 : i + 1; },
    slotOf(i) { const [w, s] = INTL_CONFIG.STD_SLOTS[i - 1]; return { w, s }; },
    am() {
        const I = this.state();
        if (!I.am) I.am = { cycles: {}, cnl: null, lastGold: null, fr: {}, last: null };
        return I.am;
    },
    confIds(conf, opts = {}) {
        return NATIONS.filter(n => n.confederation === conf && !n.suspended && (!opts.fifa || n.fifaMember !== false)).map(n => n.id);
    },
    sortStrength(ids) { return ids.slice().sort((a, b) => this.byStrength(a, b)); },
    // a group's fixtures from a template, on the given standard slots (oneBased template slots)
    _amFixtures(teams, tpl, slots, comp) {
        const fx = [];
        tpl.forEach((md, i) => md.forEach(([x, y]) => {
            const { w, s } = this.slotOf(slots[i]);
            fx.push({ h: teams[x - 1], a: teams[y - 1], md: i + 1, w, s, c: comp, hg: null, ag: null });
        }));
        return fx;
    },
    // play every not-yet-played fixture of `groups` in slot (w, s); `venue(g, f)` may return
    // { neutral, advH, advA } for centralised venues
    _amPlayGroups(groups, w, s, comp, venue) {
        groups.forEach(g => g.fx.forEach(f => {
            if (f.w !== w || f.s !== s || f.hg != null) return;
            const v = venue ? venue(g, f) : {};
            const r = this._play(f.h, f.a, Object.assign({ week: w, slot: s, comp, stage: 'group' }, v));
            f.hg = r.hg; f.ag = r.ag; if (r.n) f.n = 1;
        }));
    },
    // two-legged tie with both legs on standard slots
    _amLeg(t, leg, w, s, comp, stage) {
        if (leg === 1) t.leg1 = this._play(t.lo, t.hi, { week: w, slot: s, comp, stage });
        else this._leg2(t, w, comp, stage, s);
    },

    // templates (appendix): slots are 1-based, home first
    G6S: [[[1, 3], [2, 5], [4, 6]], [[4, 1], [6, 2], [3, 5]], [[5, 1], [2, 4], [6, 3]], [[1, 6], [3, 2], [5, 4]]],
    G5: [[[2, 5], [3, 4]], [[1, 5], [3, 2]], [[4, 1], [5, 3]], [[1, 3], [4, 2]], [[2, 1], [5, 4]]],
    G4D: [[[1, 2], [3, 4]], [[4, 1], [2, 3]], [[1, 3], [4, 2]], [[2, 1], [4, 3]], [[1, 4], [3, 2]], [[3, 1], [2, 4]]],
    G3D: [[[2, 3]], [[3, 1]], [[1, 2]], [[3, 2]], [[1, 3]], [[2, 1]]],

    // ------------------------------------------------------------ the weekly entry points
    // draws in the draw week (week 3) of season S
    _amDraw(S) {
        if (!S) return;
        const y = S.year, pos = this.cyclePos(y), A = this.am();
        S.am = S.am || {};
        Object.keys(A.cycles).forEach(k => { if (+k.slice(3) < y) delete A.cycles[k]; });
        if (pos === 'NL_AFTER' || pos === 'NL_BEFORE') this._cnlDraw(S);
        if (pos === 'EURO') {
            const key = 'WC-' + (y + 3);
            A.cycles[key] = { cm: Object.assign(this._cmqDraw(y), { wcYear: y + 3 }), cc: this._ccqDraw(y) };
            this._copaEntrants(S);
        }
        if (pos === 'WC') {
            const cyc = A.cycles['WC-' + (y + 1)];
            if (cyc && cyc.cc && cyc.cc.r2) this._ccqR3Draw(cyc.cc);
        }
    },
    // every standard slot of week w, A before B (a later slot can depend on an earlier one)
    _amWeek(S, w) {
        if (!S || !S.am) return;
        const C = INTL_CONFIG;
        C.STD_SLOTS.forEach(([ww, s], i) => { if (ww === w) this._amSlot(S, i + 1, w, s); });
        if (w === C.ROUND_DRAW_WEEK && S.am.cnl) this._goldPrelimDraw(S);
        if (w === C.FINALS_DRAW_WEEK) {
            if (S.am.cnl) this._goldDraw(S);
            if (S.am.copa) this._copaDraw(S);
        }
        if (w === C.FINALISSIMA[0]) this._finalissima(S);
    },
    _amSlot(S, i, w, s) {
        const y = S.year, pos = this.cyclePos(y), A = this.am();
        // CONMEBOL qualifiers (EURO, NL_BEFORE and WC seasons of the cycle)
        const cyc = A.cycles['WC-' + (y + (pos === 'EURO' ? 3 : pos === 'NL_BEFORE' ? 2 : pos === 'WC' ? 1 : 99))];
        if (cyc && cyc.cm) {
            const cm = cyc.cm;
            cm.fx.forEach(f => {
                if (f.y !== y || f.w !== w || f.s !== s || f.hg != null) return;
                const r = this._play(f.h, f.a, { week: w, slot: s, comp: 'INTL_CMQ', stage: 'group' });
                f.hg = r.hg; f.ag = r.ag;
            });
            if (pos === 'WC' && i === INTL_CONFIG.CMQ_SLOTS.WC.slice(-1)[0] && !cm.result) this._cmqResult(cm);
        }
        if (cyc && cyc.cc) this._ccqSlot(cyc.cc, y, pos, i, w, s);
        if (S.am.cnl) this._cnlSlot(S, i, w, s);
        if (S.am.gold && S.am.gold.prelims) {
            const P = INTL_CONFIG.GOLD_PRELIM_SLOTS;
            if (i === P[0]) S.am.gold.prelims.forEach(t => this._amLeg(t, 1, w, s, 'INTL_GOLD', 'prelim'));
            if (i === P[1]) S.am.gold.prelims.forEach(t => this._amLeg(t, 2, w, s, 'INTL_GOLD', 'prelim'));
        }
        if (S.am.copa && i === INTL_CONFIG.COPA_PLAYIN_SLOT && S.am.copa.playin) {
            S.am.copa.playin.forEach(t => {
                t.fx = this._play(t.hi, t.lo, { week: w, slot: s, ko: true, comp: 'INTL_COPA', stage: 'playin' });
                t.winner = this.winnerOf(t.fx);
            });
        }
    },
    // tournament window days 0-5 for season S (Gold Cup in NL seasons, Copa in EURO seasons)
    _amTournamentDay(S, day) {
        if (!S || !S.am || day < 0) return;
        if (S.am.gold && S.am.gold.tour) this._goldDay(S, day);
        if (S.am.copa && S.am.copa.tour) this._copaDay(S, day);
    },

    // ------------------------------------------------------------ CONMEBOL World Cup qualifiers
    // 10 teams, double round-robin over three seasons; circle-method pairings, home/away chosen so
    // no team has three home or three away matches in a row (the second half mirrors the first)
    _cmqDraw(y) {
        const teams = this._shuffle(this.confIds('CONMEBOL', { fifa: true }));
        const n = teams.length, half = n - 1;
        const rounds = [], arr = [...Array(n).keys()];
        for (let r = 0; r < half; r++) { const m = []; for (let k = 0; k < n / 2; k++) m.push([arr[k], arr[n - 1 - k]]); rounds.push(m); arr.splice(1, 0, arr.pop()); }
        const order = this._cmqOrient(rounds, n);
        const C = INTL_CONFIG, slots = [];
        C.CMQ_SLOTS.EURO.forEach(i => slots.push([y, i]));
        C.CMQ_SLOTS.NL_BEFORE.forEach(i => slots.push([y + 1, i]));
        C.CMQ_SLOTS.WC.forEach(i => slots.push([y + 2, i]));
        const fx = [];
        order.forEach((md, r) => md.forEach(([h, a]) => {
            const put = (mdNo, hh, aa) => { const [sy, si] = slots[mdNo - 1]; const { w, s } = this.slotOf(si); fx.push({ h: teams[hh], a: teams[aa], md: mdNo, y: sy, w, s, c: 'INTL_CMQ', hg: null, ag: null }); };
            put(r + 1, h, a); put(r + 1 + half, a, h);
        }));
        const hosts = this.hostsForKey('WC-' + (y + 3)).filter(id => this.conf(id) === 'CONMEBOL');
        return { teams, fx, hosts, result: null };
    },
    _cmqOrient(rounds, n) {
        const half = rounds.length, ms = [];
        rounds.forEach((m, r) => m.forEach(p => ms.push([r, p])));
        const seq = [...Array(n)].map(() => []), out = rounds.map(() => []);
        const bad = s => { for (let i = 2; i < s.length; i++) if (s[i] === s[i - 1] && s[i] === s[i - 2]) return true; return false; };
        const full = t => bad(seq[t].concat(seq[t].map(x => !x)));
        for (let attempt = 0; attempt < 30; attempt++) {
            let steps = 0;
            seq.forEach(s => s.length = 0); out.forEach(o => o.length = 0);
            const go = k => {
                if (++steps > 200000) return false;
                if (k === ms.length) return true;
                const [r, [a, b]] = ms[k];
                const opts = Rng.next() < 0.5 ? [[a, b], [b, a]] : [[b, a], [a, b]];
                for (const [h, w] of opts) {
                    seq[h].push(true); seq[w].push(false); out[r].push([h, w]);
                    const okH = !bad(seq[h]) && (seq[h].length < half || !full(h)), okW = !bad(seq[w]) && (seq[w].length < half || !full(w));
                    if (okH && okW && go(k + 1)) return true;
                    seq[h].pop(); seq[w].pop(); out[r].pop();
                }
                return false;
            };
            if (go(0)) return out.map(o => o.slice());
        }
        this._assert(false, 'CONMEBOL qualifiers: no fixture list without three home/away in a row; using the plain one');
        return rounds;
    },
    // points, GD, GF, head-to-head points, head-to-head GD, wins, reputation
    cmqTable(cm) {
        const rows = this.table({ teams: cm.teams, fx: cm.fx });
        const h2h = (x, y) => {
            let px = 0, py = 0, gx = 0;
            cm.fx.forEach(f => {
                if (f.hg == null) return;
                if (f.h === x && f.a === y) { gx += f.hg - f.ag; if (f.hg > f.ag) px += 3; else if (f.hg < f.ag) py += 3; else { px++; py++; } }
                if (f.h === y && f.a === x) { gx += f.ag - f.hg; if (f.ag > f.hg) px += 3; else if (f.ag < f.hg) py += 3; else { px++; py++; } }
            });
            return [px - py, gx];
        };
        return rows.sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF
            || -h2h(a.id, b.id)[0] || -h2h(a.id, b.id)[1] || b.W - a.W || this.rep(b.id) - this.rep(a.id) || (a.id < b.id ? -1 : 1));
    },
    _cmqResult(cm) {
        const C = INTL_CONFIG, H = cm.hosts.length;
        const rest = this.cmqTable(cm).map(r => r.id).filter(id => !cm.hosts.includes(id));
        cm.result = { direct: rest.slice(0, C.CMQ_DIRECT - H), po: rest.slice(C.CMQ_DIRECT - H, C.CMQ_DIRECT - H + C.CMQ_PLAYOFF) };
        const top = this.cmqTable(cm)[0];
        if (top) this.state().honours.CMQ = (this.state().honours.CMQ || []).concat([{ year: cm.wcYear, winner: top.id }]);
    },

    // ------------------------------------------------------------ CONCACAF World Cup qualifiers
    // R1 (lowest 2(N-30), two legs) and R2 (30 teams, 6 groups of 5) in the EURO season; R3 (12
    // teams, 3 groups of 4, double round-robin) in the World Cup season. Hosts sit it out.
    _ccqDraw(y) {
        const C = INTL_CONFIG;
        const hosts = this.hostsForKey('WC-' + (y + 3)).filter(id => this.conf(id) === 'CONCACAF');
        const field = this.sortStrength(this.confIds('CONCACAF', { fifa: true }).filter(id => !hosts.includes(id)));
        const N = field.length, ties = Math.max(0, N - C.CCQ_R2_TEAMS);
        const r1Teams = field.slice(N - 2 * ties), byes = field.slice(0, N - 2 * ties);
        const r1 = [];
        for (let k = 0; k < ties; k++) r1.push({ hi: r1Teams[k], lo: r1Teams[r1Teams.length - 1 - k], leg1: null, leg2: null, winner: null });
        // R2: byes by strength, then the R1 ties (placeholders) - pots of 6, one team per pot per group
        const entries = byes.concat(r1.map((t, k) => 'R1W' + (k + 1)));
        const pots = [];
        for (let p = 0; p < 5; p++) pots.push(entries.slice(p * 6, p * 6 + 6));
        const groups = this._drawGroups(pots, C.CCQ_R2_GROUPS);
        return { hosts, field, r1, r2: { groups: groups.map((teams, g) => ({ id: 'R2-' + (g + 1), teams, fx: null })) }, r3: null, result: null };
    },
    _ccqSlot(cc, y, pos, i, w, s) {
        const C = INTL_CONFIG;
        if (pos === 'EURO') {
            if (i === C.CCQ_R1_SLOTS[0]) cc.r1.forEach(t => this._amLeg(t, 1, w, s, 'INTL_CCQ', 'r1'));
            if (i === C.CCQ_R1_SLOTS[1]) cc.r1.forEach(t => this._amLeg(t, 2, w, s, 'INTL_CCQ', 'r1'));
            if (i === C.CCQ_R2_SLOTS[0] && !cc.r2.groups[0].fx) {
                // R1 is done: the winners take their places, then the fixtures are set
                cc.r2.groups.forEach(g => {
                    g.teams = g.teams.map(t => /^R1W\d+$/.test(t) ? cc.r1[+t.slice(3) - 1].winner : t);
                    g.fx = this._amFixtures(g.teams, this.G5, C.CCQ_R2_SLOTS, 'INTL_CCQ');
                });
            }
            if (cc.r2.groups[0].fx) this._amPlayGroups(cc.r2.groups, w, s, 'INTL_CCQ');
        }
        if (pos === 'WC' && cc.r3) {
            this._amPlayGroups(cc.r3.groups, w, s, 'INTL_CCQ');
            if (i === C.CCQ_R3_SLOTS.slice(-1)[0] && !cc.result) this._ccqResult(cc);
        }
    },
    _ccqR3Draw(cc) {
        const C = INTL_CONFIG;
        const through = [];
        cc.r2.groups.forEach(g => this.standings(g, 'rr').slice(0, 2).forEach(r => through.push(r.id)));
        const ranked = this.sortStrength(through);
        const pots = [0, 1, 2, 3].map(p => ranked.slice(p * 3, p * 3 + 3));
        const groups = this._drawGroups(pots, 3);
        cc.r3 = { groups: groups.map((teams, g) => ({ id: 'R3-' + (g + 1), teams, fx: this._amFixtures(teams, this.G4D, C.CCQ_R3_SLOTS, 'INTL_CCQ') })) };
    },
    _ccqResult(cc) {
        const C = INTL_CONFIG, H = cc.hosts.length;
        const bands = [[], [], [], []];
        cc.r3.groups.forEach(g => this.standings(g, 'rr').forEach((r, i) => bands[i].push(r)));
        const order = bands.reduce((a, b) => a.concat(this.crossRank(b).map(r => r.id)), []);
        cc.result = { direct: order.slice(0, C.CCQ_DIRECT - H), po: order.slice(C.CCQ_DIRECT - H, C.CCQ_DIRECT - H + C.CCQ_PLAYOFF) };
    },

    // ------------------------------------------------------------ CONCACAF Nations League
    _cnlDraw(S) {
        const C = INTL_CONFIG, A = this.am();
        let L = A.cnl, first = false;
        if (!L) {   // first edition: the real 2026/27 groups
            first = true;
            const F = C.CNL_FIRST;
            const flat = a => a.reduce((x, g) => x.concat(g), []);
            L = A.cnl = { seeds: F.seeds.slice(), leagues: { A: F.seeds.concat(flat(F.A)), B: flat(F.B), C: flat(F.C) } };
        }
        const byRep = ids => this.sortStrength(ids);
        let groupsA, groupsB, groupsC;
        if (first) {
            const F = C.CNL_FIRST;
            groupsA = F.A.map(byRep); groupsB = F.B.map(byRep); groupsC = F.C.map(byRep);
        } else {
            const restA = byRep(L.leagues.A.filter(id => !L.seeds.includes(id)));
            groupsA = this._drawGroups([0, 1, 2].map(p => restA.slice(p * 4, p * 4 + 4)), 2);
            const b = byRep(L.leagues.B); groupsB = this._drawGroups([0, 1, 2, 3].map(p => b.slice(p * 4, p * 4 + 4)), 4);
            const c = byRep(L.leagues.C); groupsC = this._drawGroups([0, 1, 2].map(p => c.slice(p * 3, p * 3 + 3)), 3);
        }
        const mk = (L1, list, tpl, slots) => list.map((teams, g) => ({ id: L1 + (g + 1), teams, fx: this._amFixtures(teams, tpl, slots, 'INTL_CNL') }));
        S.am.cnl = {
            seeds: L.seeds.slice(),
            A: { groups: mk('A', groupsA, this.G6S, C.CNL_A_GROUP_SLOTS), qf: null, sf: null, third: null, final: null },
            B: { groups: mk('B', groupsB, this.G4D, C.CNL_BC_GROUP_SLOTS), sf: null, third: null, final: null },
            C: { groups: mk('C', groupsC, this.G3D, C.CNL_BC_GROUP_SLOTS), sf: null, third: null, final: null },
        };
        const sizes = { A: L.leagues.A.length, B: L.leagues.B.length, C: L.leagues.C.length };
        this._assert(sizes.A === C.CNL_SIZES.A && sizes.B === C.CNL_SIZES.B && sizes.C === C.CNL_SIZES.C, `CONCACAF Nations League sizes ${JSON.stringify(sizes)}`);
    },
    // centralised venues (B and C): the hosting team plays at home, every other match is neutral
    _cnlVenue(league) {
        return (g, f) => {
            const ranked = this.sortStrength(g.teams);
            const host = league === 'B' ? ranked[({ 1: 2, 2: 2, 3: 1, 4: 1, 5: 0, 6: 0 })[f.md]] : ranked[f.md <= 3 ? 1 : 0];
            return { neutral: true, advH: f.h === host, advA: f.a === host };
        };
    },
    _cnlSlot(S, i, w, s) {
        const C = INTL_CONFIG, N = S.am.cnl;
        this._amPlayGroups(N.A.groups, w, s, 'INTL_CNL');
        this._amPlayGroups(N.B.groups, w, s, 'INTL_CNL', this._cnlVenue('B'));
        this._amPlayGroups(N.C.groups, w, s, 'INTL_CNL', this._cnlVenue('C'));
        const ko = { neutral: true, ko: true, comp: 'INTL_CNL' };
        if (i === C.CNL_A_QF_SLOTS[0]) {
            const st = N.A.groups.map(g => this.standings(g, 'rr'));
            const Q = this.crossRank(st.map(t => t[0])).concat(this.crossRank(st.map(t => t[1]))).map(r => r.id);
            N.A.qf = N.seeds.map((seed, k) => ({ hi: seed, lo: Q[3 - k], leg1: null, leg2: null, winner: null }));
            N.A.qf.forEach(t => this._amLeg(t, 1, w, s, 'INTL_CNL', 'qf'));
        }
        if (i === C.CNL_A_QF_SLOTS[1] && N.A.qf) N.A.qf.forEach(t => this._amLeg(t, 2, w, s, 'INTL_CNL', 'qf'));
        if (i === C.CNL_SF_SLOT) {
            const W = N.A.qf.map(t => t.winner);
            N.A.sf = [this._play(W[0], W[3], Object.assign({ week: w, slot: s, stage: 'sf' }, ko)), this._play(W[1], W[2], Object.assign({ week: w, slot: s, stage: 'sf' }, ko))];
            const champ = (L, teams) => {
                N[L].champ = teams;
                N[L].sf = [this._play(teams[0], teams[3], Object.assign({ week: w, slot: s, stage: 'sf' }, ko)), this._play(teams[1], teams[2], Object.assign({ week: w, slot: s, stage: 'sf' }, ko))];
            };
            champ('B', this._cnlChamp(N, 'B'));
            champ('C', this._cnlChamp(N, 'C'));
        }
        if (i === C.CNL_FINAL_SLOT) {
            ['A', 'B', 'C'].forEach(L => {
                const X = N[L]; if (!X.sf) return;
                X.third = this._play(this.loserOf(X.sf[0]), this.loserOf(X.sf[1]), Object.assign({ week: w, slot: s, stage: 'third' }, ko));
                X.final = this._play(this.winnerOf(X.sf[0]), this.winnerOf(X.sf[1]), Object.assign({ week: w, slot: s, stage: 'final' }, ko));
                X.winner = this.winnerOf(X.final);
                const H = this.state().honours, key = 'CNL_' + L;
                H[key] = (H[key] || []).concat([{ season: S.year, winner: X.winner, runnerUp: this.loserOf(X.final), final: this._finalRec(X.final) }]);
                if (L === 'A' && this._recordFinals4) this._recordFinals4('INTL_CNL', S.year, X);
            });
            this._cnlPromote(S);
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(N.A.winner), opp: this.name(this.loserOf(N.A.final)), score: this._score(N.A.final), comp: compName('INTL_CNL') });
        }
    },
    // the championship four of League B (the 4 group winners) / C (3 winners + the best runner-up)
    _cnlChamp(N, L) {
        const st = N[L].groups.map(g => this.standings(g, 'rr'));
        const w = this.crossRank(st.map(t => t[0])).map(r => r.id);
        return L === 'B' ? w : w.concat(this.crossRank(st.map(t => t[1]))[0].id);
    },
    _cnlPromote(S) {
        const C = INTL_CONFIG, N = S.am.cnl, A = this.am();
        const pos = groups => { const o = {}; groups.forEach(g => this.standings(g, 'rr').forEach((r, k) => { o[r.id] = k + 1; })); return o; };
        const pA = pos(N.A.groups), pB = pos(N.B.groups);
        const finals = [this.winnerOf(N.A.final), this.loserOf(N.A.final), this.winnerOf(N.A.third), this.loserOf(N.A.third)];
        const relA = Object.keys(pA).filter(id => pA[id] >= 5);
        const upB = Object.keys(pB).filter(id => pB[id] === 1), downB = Object.keys(pB).filter(id => pB[id] === 4);
        const upC = N.C.champ.slice();
        const all = L => L.groups.reduce((a, g) => a.concat(g.teams), []);
        const newA = finals.concat(all(N.A).concat(N.seeds).filter(id => !finals.includes(id) && !relA.includes(id)), upB);
        const newB = relA.concat(all(N.B).filter(id => !upB.includes(id) && !downB.includes(id)), upC);
        const newC = downB.concat(all(N.C).filter(id => !upC.includes(id)));
        A.cnl = { seeds: finals, leagues: { A: newA, B: newB, C: newC } };
        S.am.cnl.movement = { upA: upB, downB: relA, upB: upC, downC: downB };
        this._assert(newA.length === C.CNL_SIZES.A && newB.length === C.CNL_SIZES.B && newC.length === C.CNL_SIZES.C
            && new Set(newA.concat(newB, newC)).size === 41, `CONCACAF Nations League after promotion: ${newA.length}/${newB.length}/${newC.length}`);
        // Gold Cup route: direct = League A's Finals four + League B's group winners
        S.am.gold = {
            direct: finals.concat(upB),
            prelims: S.am.gold && S.am.gold.prelims, tour: null,
        };
    },

    // ------------------------------------------------------------ Gold Cup
    // preliminary round, drawn in week 19: 16 teams paired by strength (1v16...), two legs in 36A/37A
    _goldPrelimDraw(S) {
        const N = S.am.cnl; if (!N || !N.A.qf) return;
        const pA = {}; N.A.groups.forEach(g => this.standings(g, 'rr').forEach((r, k) => { pA[r.id] = k + 1; }));
        const pB = {}; N.B.groups.forEach(g => this.standings(g, 'rr').forEach((r, k) => { pB[r.id] = k + 1; }));
        const qfLosers = N.A.qf.map(t => t.winner === t.hi ? t.lo : t.hi);
        const teams = qfLosers.concat(Object.keys(pA).filter(id => pA[id] >= 3), Object.keys(pB).filter(id => pB[id] === 2));
        const r = this.sortStrength(teams);
        S.am.gold = S.am.gold || {};
        S.am.gold.prelims = [];
        for (let k = 0; k < r.length / 2; k++) S.am.gold.prelims.push({ hi: r[k], lo: r[r.length - 1 - k], leg1: null, leg2: null, winner: null });
        this._assert(r.length === 16, `Gold Cup preliminary round: ${r.length} teams`);
    },
    _goldDraw(S) {
        const G = S.am.gold; if (!G || !G.prelims) return;
        const teams = G.direct.concat(G.prelims.map(t => t.winner));
        this._assert(teams.length === 16 && new Set(teams).size === 16, `Gold Cup: ${teams.length} teams`);
        const inFinals = new Set([].concat(...['A', 'B', 'C'].map(L => (S.am.cnl[L].sf || []).map(m => [m.h, m.a]).reduce((a, b) => a.concat(b), []))));
        this._assert(!G.prelims.some(t => inFinals.has(t.hi) || inFinals.has(t.lo)), 'Gold Cup prelims overlap a Nations League final stage');
        const hosts = this.hostsForKey('GOLD-' + (S.year + 1)).filter(id => teams.includes(id));
        G.tour = this._amTournament(teams, hosts, { comp: 'INTL_GOLD', thirdPlace: false, maxPerConf: null });
    },
    _goldDay(S, day) {
        const T = S.am.gold.tour;
        this._amTourDay(T, day, false, (w) => {
            const list = this.state().honours.GOLD = this.state().honours.GOLD || [];
            list.push({ season: S.year, year: S.year + 1, winner: T.winner, runnerUp: T.runnerUp, hosts: T.hosts.slice(), final: this._finalRec(T.ko.final) });
            if (this._recordFinishes) this._recordFinishes('INTL_GOLD', S.year + 1, T);
            const K = T.ko;
            this.am().lastGold = {
                season: S.year, semis: K.sf.reduce((a, m) => a.concat([m.h, m.a]), []),
                qfLosers: this._goldRecordRank(T, K.qf.map(m => this.loserOf(m))),
                others: this._goldRecordRank(T, T.groups.reduce((a, g) => a.concat(g.teams), []).filter(id => !K.qf.some(m => m.h === id || m.a === id))),
            };
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(T.winner), opp: this.name(T.runnerUp), score: this._score(K.final), comp: compName('INTL_GOLD') + ' ' + (S.year + 1) });
        });
    },
    // Gold Cup record (group points, GD, GF, then reputation), for the Copa play-in
    _goldRecordRank(T, ids) {
        const rows = {};
        T.groups.forEach(g => this.table(g).forEach(r => { rows[r.id] = r; }));
        return ids.slice().sort((a, b) => { const x = rows[a], y = rows[b]; return (y.Pts - x.Pts) || ((y.GF - y.GA) - (x.GF - x.GA)) || (y.GF - x.GF) || this.byStrength(a, b); });
    },

    // ------------------------------------------------------------ Copa América
    // entrants (week 3 of the EURO season): 10 CONMEBOL + 6 CONCACAF - a CONCACAF host, the last Gold
    // Cup's semi-finalists, then a play-in (37A) for whatever is left
    _copaEntrants(S) {
        const C = INTL_CONFIG, A = this.am(), y = S.year;
        const hosts = this.hostsForKey('COPA-' + (y + 1));
        const cm = this.confIds('CONMEBOL', { fifa: true });
        const ccHost = hosts.filter(id => this.conf(id) === 'CONCACAF');
        const G = A.lastGold && A.lastGold.season === y - 1 ? A.lastGold : null;
        let cc = ccHost.slice(), playin = [];
        if (G) {
            G.semis.forEach(id => { if (!cc.includes(id) && cc.length < C.COPA_CONCACAF) cc.push(id); });
            const need = C.COPA_CONCACAF - cc.length;
            const pool = G.qfLosers.concat(G.others).filter(id => !cc.includes(id));
            const p = pool.slice(0, 2 * need);
            playin = need === 1 ? [{ hi: p[0], lo: p[1] }] : need === 2 ? [{ hi: p[0], lo: p[3] }, { hi: p[1], lo: p[2] }] : [];
        } else {   // no Gold Cup to read (a save from before the Americas): the strongest by reputation
            this.sortStrength(this.confIds('CONCACAF')).forEach(id => { if (!cc.includes(id) && cc.length < C.COPA_CONCACAF) cc.push(id); });
        }
        S.am.copa = { hosts, cm, cc, playin: playin.map(t => Object.assign(t, { fx: null, winner: null })), tour: null, fromGold: !!G };
    },
    _copaDraw(S) {
        const P = S.am.copa;
        const teams = P.cm.concat(P.cc, P.playin.map(t => t.winner));
        this._assert(teams.length === 16 && new Set(teams).size === 16, `Copa América: ${teams.length} teams`);
        P.tour = this._amTournament(teams, P.hosts.filter(id => teams.includes(id)), { comp: 'INTL_COPA', thirdPlace: true, maxPerConf: { CONCACAF: INTL_CONFIG.COPA_MAX_CONCACAF_PER_GROUP }, top3Pot1: true });
    },
    _copaDay(S, day) {
        const T = S.am.copa.tour;
        this._amTourDay(T, day, true, () => {
            const list = this.state().honours.COPA = this.state().honours.COPA || [];
            list.push({ season: S.year, year: S.year + 1, winner: T.winner, runnerUp: T.runnerUp, third: T.ko.third ? this.winnerOf(T.ko.third) : null, hosts: T.hosts.slice(), final: this._finalRec(T.ko.final) });
            if (this._recordFinishes) this._recordFinishes('INTL_COPA', S.year + 1, T);
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(T.winner), opp: this.name(T.runnerUp), score: this._score(T.ko.final), comp: compName('INTL_COPA') + ' ' + (S.year + 1) });
        });
    },

    // ------------------------------------------------------------ 16-team tournaments (Gold Cup, Copa)
    // 4 pots of 4 by strength, hosts first (position 1 of their own groups); top 2 to the QF
    _amTournament(teams, hosts, o) {
        const rest = this.sortStrength(teams.filter(id => !hosts.includes(id)));
        const ranked = hosts.concat(rest);
        const pots = [0, 1, 2, 3].map(p => ranked.slice(p * 4, p * 4 + 4));
        const ok = (g, id) => {
            if (hosts.includes(id) && g.some(x => hosts.includes(x))) return false;
            if (o.maxPerConf) { const c = this.conf(id), cap = o.maxPerConf[c]; if (cap != null && g.filter(x => this.conf(x) === c).length >= cap) return false; }
            return !o.extraOk || o.extraOk(g, id);
        };
        // the host's group is group A (the host in A1)
        const groups = this._drawGroups(pots, 4, ok).sort((x, y) => (hosts.includes(y[0]) ? 1 : 0) - (hosts.includes(x[0]) ? 1 : 0));
        return { comp: o.comp, size: 16, hosts, md1Only: [], thirdPlace: !!o.thirdPlace, groups: groups.map((t, i) => ({ id: 'ABCD'[i], teams: t, fx: this._tourGroupFixtures(t) })), ko: {}, winner: null };
    },
    // days 0-2 groups (slot A), 3 QF, 4 SF, 5 third (A) + final (B) / final. `pensOnly`: the Copa
    // rule (straight to penalties before the final)
    _amTourDay(T, day, pensOnly, onDone) {
        const week = INTL_CONFIG.TOURNAMENT_WEEKS[day];
        const B = INTL_CONFIG.TOURNAMENT_HOST_BOOST || 0;
        const opt = (h, a, slot, stage) => ({ week, slot, neutral: true, advH: false, advA: false, bH: T.hosts.includes(h) ? B : 0, bA: T.hosts.includes(a) ? B : 0, ko: stage !== 'group', pensOnly: pensOnly && stage !== 'final' && stage !== 'group', comp: T.comp, stage });
        const W = m => this.winnerOf(m), Lo = m => this.loserOf(m);
        if (day <= 2) {
            T.groups.forEach(g => g.fx.forEach(f => {
                if (f.md !== day + 1) return;
                const r = this._play(f.h, f.a, opt(f.h, f.a, 'A', 'group'));
                f.hg = r.hg; f.ag = r.ag; f.w = week; f.s = 'A';
            }));
            return;
        }
        const K = T.ko;
        if (day === 3) {
            const st = {}; T.groups.forEach(g => { st[g.id] = this.standings(g, 'rr'); });
            const P = (n, g) => st[g][n - 1].id;
            K.qf = [[P(1, 'A'), P(2, 'B')], [P(1, 'B'), P(2, 'A')], [P(1, 'C'), P(2, 'D')], [P(1, 'D'), P(2, 'C')]].map(([h, a]) => this._play(h, a, opt(h, a, 'A', 'qf')));
        } else if (day === 4) {
            const q = K.qf.map(W);
            K.sf = [this._play(q[0], q[1], opt(q[0], q[1], 'A', 'sf')), this._play(q[2], q[3], opt(q[2], q[3], 'A', 'sf'))];
        } else if (day === 5) {
            const s = K.sf;
            if (T.thirdPlace) K.third = this._play(Lo(s[0]), Lo(s[1]), opt(Lo(s[0]), Lo(s[1]), 'A', 'third'));
            K.final = this._play(W(s[0]), W(s[1]), opt(W(s[0]), W(s[1]), T.thirdPlace ? 'B' : 'A', 'final'));
            T.winner = W(K.final); T.runnerUp = Lo(K.final);
            onDone && onDone();
        }
    },

    // ------------------------------------------------------------ Finalissima
    // EURO winner v Copa winner, week 50 of the next season, slot B, neutral, extra time + penalties
    _finalissima(S) {
        if (this.cyclePos(S.year) !== 'NL_BEFORE' || S.am.finalissima) return;
        const prev = this.state().seasons[S.year - 1];
        const euro = prev && prev.tour && prev.tour.winner, copa = prev && prev.am && prev.am.copa && prev.am.copa.tour && prev.am.copa.tour.winner;
        if (!euro || !copa || euro === copa) return;
        const [w, s] = INTL_CONFIG.FINALISSIMA;
        const fx = this._play(euro, copa, { week: w, slot: s, neutral: true, ko: true, comp: 'INTL_FINALISSIMA', stage: 'final' });
        S.am.finalissima = fx;
        const H = this.state().honours;
        H.FINALISSIMA = (H.FINALISSIMA || []).concat([{ season: S.year, year: S.year + 1, winner: this.winnerOf(fx), final: this._finalRec(fx) }]);
        if (this._intlTrophy) this._intlTrophy(this.winnerOf(fx), 'INTL_FINALISSIMA', S.year + 1);
        this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(this.winnerOf(fx)), opp: this.name(this.loserOf(fx)), score: this._score(fx), comp: compName('INTL_FINALISSIMA') + ' ' + (S.year + 1) });
    },

    // ------------------------------------------------------------ friendlies
    // For every standard slot of week w: every nation without a competitive match may arrange a
    // friendly (probability by reputation); opponents by closeness in strength and geography.
    _friendlies(S, w) {
        const C = INTL_CONFIG, A = this.am();
        C.STD_SLOTS.forEach(([ww, s]) => {
            if (ww !== w) return;
            const busy = this._slotTeams[w + s] || new Set();
            const prob = id => { const r = this.rep(id); for (const [min, p] of C.FRIENDLY_PLAY_PROB) if (r >= min) return p; return 0; };
            const willing = this.sortStrength(NATIONS.filter(n => !n.suspended && !busy.has(n.id)).map(n => n.id)).filter(id => Rng.next() < prob(id));
            const free = new Set(willing);
            const near = (x, y) => { const a = this.conf(x), b = this.conf(y); if (a === b) return C.FRIENDLY_DIST_SAME;
                return C.FRIENDLY_NEIGHBOURS.some(([p, q]) => (p === a && q === b) || (p === b && q === a)) ? C.FRIENDLY_DIST_NEIGHBOUR : C.FRIENDLY_DIST_FAR; };
            const mem = id => A.fr[id] || (A.fr[id] = { opp: [], home: -1 });
            S.am.fr = S.am.fr || [];
            const tick = (S.year * 100 + w) * 2 + (s === 'B' ? 1 : 0);
            willing.forEach(id => {
                if (!free.has(id)) return;
                free.delete(id);
                let best = null, bestScore = Infinity;
                free.forEach(o => {
                    if (mem(id).opp.includes(o) || mem(o).opp.includes(id) || !this._prohibitedOk([o], id)) return;
                    const sc = Math.abs(this.rep(id) - this.rep(o)) + near(id, o) + Rng.next() * C.FRIENDLY_NOISE;
                    if (sc < bestScore) { bestScore = sc; best = o; }
                });
                if (!best) return;
                free.delete(best);
                const [h, a] = mem(id).home <= mem(best).home ? [id, best] : [best, id];
                const neutral = this.conf(id) !== this.conf(best) && Rng.next() < C.FRIENDLY_NEUTRAL_CROSS;
                const fx = this._play(h, a, { week: w, slot: s, neutral, comp: 'INTL_FRIENDLY', stage: 'friendly' });
                // compact: [home, away, home goals, away goals, standard slot, neutral] (~400 a season)
                S.am.fr.push([h, a, fx.hg, fx.ag, this.slotIdx(w, s), neutral ? 1 : 0]);
                if (!neutral) mem(h).home = tick;
                [[id, best], [best, id]].forEach(([x, o]) => { const m = mem(x); m.opp.unshift(o); m.opp.length = Math.min(m.opp.length, C.FRIENDLY_NO_REPEAT); });
            });
        });
    },

    // a season's friendlies as fixtures ({ h, a, hg, ag, w, s, c, n })
    friendliesOf(S) {
        return ((S && S.am && S.am.fr) || []).map(([h, a, hg, ag, i, nn]) => { const { w, s } = this.slotOf(i); return { h, a, hg, ag, w, s, c: 'INTL_FRIENDLY', n: nn }; });
    },

    // ------------------------------------------------------------ hosts
    // hosts of a tournament by key: 'EURO-2032', 'WC-2038', 'COPA-2032', 'GOLD-2029'
    hostsForKey(key) {
        const C = INTL_CONFIG, I = this.state();
        if (!key) return [];
        if (C.HOSTS[key]) return C.HOSTS[key].hosts.slice();
        if (I && I.hosts[key]) return I.hosts[key].slice();
        const type = key.split('-')[0];
        let hosts;
        if (type === 'GOLD') hosts = (C.HOST_POTS.GOLD_CUP || []).slice(0, 1);
        else if (type === 'AC') hosts = this._drawHosts('ASIAN_CUP', 'AFC', key);
        else if (type === 'ONC') hosts = this._drawHosts('OFC_NATIONS_CUP', 'OFC', key);
        else if (type === 'AFCON') hosts = this._drawHosts('AFCON', 'CAF', key);
        else if (type === 'ANLF') hosts = this._drawHosts('ANL_FINALS', 'CAF', key);
        else if (type === 'COPA') hosts = this._drawHosts('COPA', 'CONMEBOL', key);
        else return this.hostsFor(+key.split('-')[1] - 1);
        if (I) I.hosts[key] = hosts.slice();
        return hosts;
    },
    // week 1: hosts become known (and shown) for tournaments n seasons ahead (HOST_DRAW_SEASONS_BEFORE_BY)
    _hostDraws(y) {
        const B = INTL_CONFIG.HOST_DRAW_SEASONS_BEFORE_BY;
        const at = T => this.seasonType(T);
        [['EURO', B.EURO], ['WC', B.WC], ['COPA', B.COPA], ['GOLD', B.GOLD], ['AFCON', B.AFCON], ['ANLF', B.ANLF], ['AC', B.AC], ['ONC', B.ONC]].forEach(([type, n]) => {
            const T = y + n;   // the season whose tournament this is
            const t = at(T);
            if (type === 'EURO' && t === 'EURO') this.hostsForKey('EURO-' + (T + 1));
            if (type === 'WC' && t === 'WORLD_CUP') this.hostsForKey('WC-' + (T + 1));
            if (type === 'COPA' && t === 'EURO') this.hostsForKey('COPA-' + (T + 1));
            if (type === 'GOLD' && t === 'NATIONS_LEAGUE') this.hostsForKey('GOLD-' + (T + 1));
            if (type === 'AFCON' && this.cafSeason && this.cafSeason(T) === 'AFCON') this.hostsForKey('AFCON-' + (T + 1));
            if (type === 'ANLF' && this.cafSeason && this.cafSeason(T) === 'ANL') this.hostsForKey('ANLF-' + (T + 1));
            if (type === 'AC' && this.afcSeason && /^AC/.test(this.afcSeason(T) || '')) this.hostsForKey('AC-' + (T + 1));
            if (type === 'ONC' && this.ofcSeason && this.ofcSeason(T) === 'NC') this.hostsForKey('ONC-' + (T + 1));
        });
    },

    // ------------------------------------------------------------ checks
    // expected Americas matches per slot (sections 3-7 and 11 of the plan)
    amExpected(y, w, S) {
        const out = {}; if (!S || !S.am) return out;
        const pos = this.cyclePos(y), A = this.am(), C = INTL_CONFIG;
        const add = (k, n) => { if (n) out[k] = (out[k] || 0) + n; };
        C.STD_SLOTS.forEach(([ww, s], i0) => {
            if (ww !== w) return;
            const i = i0 + 1, k = w + s;
            const cyc = A.cycles['WC-' + (y + (pos === 'EURO' ? 3 : pos === 'NL_BEFORE' ? 2 : pos === 'WC' ? 1 : 99))];
            if (cyc && cyc.cm) add(k, cyc.cm.fx.filter(f => f.y === y && f.w === w && f.s === s).length);
            if (cyc && cyc.cc) {
                const cc = cyc.cc;
                if (pos === 'EURO') { if (C.CCQ_R1_SLOTS.includes(i)) add(k, cc.r1.length); if (C.CCQ_R2_SLOTS.includes(i)) add(k, 12); }
                if (pos === 'WC' && cc.r3 && C.CCQ_R3_SLOTS.includes(i)) add(k, 6);
            }
            if (S.am.cnl) add(k, i <= 4 ? 17 : i <= 6 ? 15 : 6);
            if (S.am.gold && S.am.gold.prelims && C.GOLD_PRELIM_SLOTS.includes(i)) add(k, 8);
            if (S.am.copa && i === C.COPA_PLAYIN_SLOT) add(k, S.am.copa.playin.length);
        });
        if (w === C.FINALISSIMA[0] && S.am.finalissima) add(w + C.FINALISSIMA[1], 1);
        return out;
    },
    amTourExpected(S, day) {
        const out = {}; if (!S || !S.am || day < 0) return out;
        const w = INTL_CONFIG.TOURNAMENT_WEEKS[day];
        [S.am.gold && S.am.gold.tour, S.am.copa && S.am.copa.tour].forEach(T => {
            if (!T) return;
            const n = [8, 8, 8, 4, 2][day];
            if (n) out[w + 'A'] = (out[w + 'A'] || 0) + n;
            if (day === 5) { if (T.thirdPlace) { out[w + 'A'] = (out[w + 'A'] || 0) + 1; out[w + 'B'] = (out[w + 'B'] || 0) + 1; } else out[w + 'A'] = (out[w + 'A'] || 0) + 1; }
        });
        return out;
    },
});
