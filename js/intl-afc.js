// ============================================================
//  International football in Asia and Oceania (docs/international.md, "Asia and Oceania"):
//  the AFC Nations League (Divisions 1-3; an Asian Cup edition and a World Cup edition), the AFC
//  World Cup play-off, the Asian Cup (24, the EURO 24 format), OFC World Cup qualifiers and the
//  OFC Nations Cup (8) with its qualifying. Every tournament is played in the summer window.
//
//  Built on js/internationals.js, js/intl-americas.js and js/intl-caf.js (slots, templates, draws,
//  the 24-team bracket). State: per season on I.seasons[y].ao; the World Cup edition of the Nations
//  League and OFC qualifying (both feed one World Cup) on I.ao.cycles['WC-2030']; across seasons:
//    div     the three AFC Nations League divisions for the next edition
//    acQual  { 'AC-2032': { teams, ... } } the Asian Cup field, decided by the edition before it
//    last    the region's own catch-up cursor
// ============================================================
Object.assign(Internationals, {
    AO_COMPS: { INTL_AFCNL: 1, INTL_AC: 1, INTL_AFCQ: 1, INTL_OFCQ: 1, INTL_ONC: 1, INTL_ONCQ: 1 },
    ao() {
        const I = this.state();
        if (!I.ao) I.ao = { cycles: {}, div: null, acQual: {}, last: null };
        return I.ao;
    },
    // what AFC plays in season y: 'NL_AC' | 'AC' | 'AC_FIXED' | 'NL_WC' | 'NL_WC_END' | null
    afcSeason(y) {
        const C = INTL_CONFIG;
        if (!this.active(y)) return null;
        const t = C.AFC_SEASON_OVERRIDES[y] || C.AFC_BY_POS[this.cyclePos(y)];
        return t === 'NONE' ? null : t;
    },
    // what OFC plays in season y: 'NC' | 'WCQ' | null
    ofcSeason(y) {
        if (!this.active(y)) return null;
        const t = INTL_CONFIG.OFC_BY_POS[this.cyclePos(y)];
        return t === 'NONE' ? null : t;
    },
    // the three divisions for the next edition (the first edition: the real-life placement)
    afcDivisions() {
        const K = this.ao();
        if (!K.div) K.div = INTL_CONFIG.AFCNL_FIRST.map(d => d.filter(id => NATIONS_BY_ID[id]));
        return K.div;
    },
    // fixtures from a 1-based template on [year, standard slot] pairs (a competition can span seasons)
    _aoFixtures(teams, tpl, slots, comp) {
        const fx = [];
        tpl.forEach((md, k) => md.forEach(([x, z]) => {
            const [y, i] = slots[k], { w, s } = this.slotOf(i);
            fx.push({ h: teams[x - 1], a: teams[z - 1], md: k + 1, y, w, s, c: comp, hg: null, ag: null });
        }));
        return fx;
    },
    // play the fixtures of `groups` dated (y, w, s); `neutral`: a centralised venue, nobody at home
    _aoPlay(groups, y, w, s, comp, neutral) {
        groups.forEach(g => g.fx && g.fx.forEach(f => {
            if (f.y !== y || f.w !== w || f.s !== s || f.hg != null) return;
            const r = this._play(f.h, f.a, { week: w, slot: s, comp, stage: 'group', neutral: !!neutral });
            f.hg = r.hg; f.ag = r.ag; if (r.n) f.n = 1;
        }));
    },
    _aoCycle(key) { const K = this.ao(); return K.cycles[key] || (K.cycles[key] = {}); },

    // ------------------------------------------------------------ the weekly entry points
    _aoDraw(S) {
        if (!S) return;
        const y = S.year, K = this.ao();
        S.ao = S.ao || {};
        Object.keys(K.cycles).forEach(k => { if (+k.slice(3) < y) delete K.cycles[k]; });
        Object.keys(K.acQual).forEach(k => { if (+k.slice(3) < y) delete K.acQual[k]; });
        const a = this.afcSeason(y), o = this.ofcSeason(y);
        if (a === 'AC_FIXED') S.ao.ac = this._acFixed(y);
        if (a === 'NL_AC') S.ao.nl = this._afcNlDraw(y, 'AC');
        if (a === 'AC') S.ao.ac = this._acPrepare(y);
        if (a === 'NL_WC') this._aoCycle('WC-' + (y + 2)).nl = this._afcNlDraw(y, 'WC');
        if (o === 'NC') S.ao.onc = this._oncDraw(y);
        if (o === 'WCQ') this._aoCycle('WC-' + (y + 2)).ofc = this._ofcqDraw(y);
    },
    _aoWeek(S, w) {
        if (!S || !S.ao) return;
        const C = INTL_CONFIG;
        C.STD_SLOTS.forEach(([ww, s], i) => { if (ww === w) this._aoSlot(S, i + 1, w, s); });
        if (w === C.FINALS_DRAW_WEEK) {
            if (S.ao.nl) this._afcNlFinalsDraw(S.ao.nl);
            if (S.ao.ac && !S.ao.ac.tour) this._acDraw(S.ao.ac);
            if (S.ao.onc) this._oncFinalsDraw(S.ao.onc);
        }
        if (w === C.AFCNL_FINALS_WEEK && S.ao.nl) this._afcNlFinals(S.ao.nl, S.year);
    },
    // the World Cup cycle this season belongs to (the edition / qualifying that feeds it)
    _aoWcCycle(y) {
        const a = this.afcSeason(y), o = this.ofcSeason(y), K = this.ao();
        const nlKey = a === 'NL_WC' ? 'WC-' + (y + 2) : a === 'NL_WC_END' ? 'WC-' + (y + 1) : null;
        const ofKey = o === 'WCQ' ? 'WC-' + (y + 2) : null;
        return { nl: nlKey && K.cycles[nlKey] && K.cycles[nlKey].nl, ofc: ofKey && K.cycles[ofKey] && K.cycles[ofKey].ofc };
    },
    _aoSlot(S, i, w, s) {
        const y = S.year, cyc = this._aoWcCycle(y);
        if (S.ao.nl) this._afcNlAcSlot(S.ao.nl, y, i, w, s);
        if (cyc.nl) this._afcNlWcSlot(cyc.nl, y, i, w, s);
        if (cyc.ofc) this._ofcqSlot(cyc.ofc, y, i, w, s);
        if (S.ao.onc) this._oncSlot(S.ao.onc, y, i, w, s);
    },
    _aoTournamentDay(S, day) {
        if (!S || !S.ao || day < 0) return;
        if (S.ao.ac && S.ao.ac.tour) this._acDay(S, day);
        if (S.ao.onc && S.ao.onc.tour) this._oncDay(S, day);
    },

    // ------------------------------------------------------------ AFC Nations League
    // Divisions 1-2: 3 groups of 6 (Asian Cup edition: the UEFA Nations League G6 template on S1-S6;
    // World Cup edition: double round-robin G6D, MD1-8 then MD9-10 next season). Division 3: groups
    // of 4, 4 and 3, double round-robin on S1-S6 in both editions. Hosts play (skipped for places).
    _afcNlDraw(y, ed) {
        const C = INTL_CONFIG, div = this.afcDivisions();
        const hosts = (ed === 'AC' ? this.hostsForKey('AC-' + (y + 2)) : this.hostsForKey('WC-' + (y + 2))).filter(id => this.conf(id) === 'AFC');
        const on = (yy, list) => list.map(i => [yy, i]);
        const big = (ids, d) => {
            const r = this.sortStrength(ids);
            const pots = ed === 'AC' ? [0, 1, 2].map(p => r.slice(p * 6, p * 6 + 6)) : [0, 1, 2, 3, 4, 5].map(p => r.slice(p * 3, p * 3 + 3));
            const tpl = ed === 'AC' ? this.G6 : this.G6D;
            const slots = ed === 'AC' ? on(y, C.AFCNL_GROUP_SLOTS) : on(y, C.AFCNL_WC_SLOTS.NL_BEFORE).concat(on(y + 1, C.AFCNL_WC_SLOTS.WC));
            return { groups: this._drawGroups(pots, 3).map((teams, g) => ({ id: d + 'ABC'[g], teams, fx: this._aoFixtures(teams, tpl, slots, 'INTL_AFCNL') })) };
        };
        const r3 = this.sortStrength(div[2]);
        const pots3 = [0, 1, 2, 3].map(p => r3.slice(p * 3, p * 3 + 3)).filter(p => p.length);
        const g3 = this._drawGroups(pots3, 3).sort((a, b) => b.length - a.length);
        const d3 = { groups: g3.map((teams, g) => ({ id: '3' + 'ABC'[g], teams, fx: this._aoFixtures(teams, teams.length === 4 ? this.G4D : this.G3D, on(y, C.AFCNL_GROUP_SLOTS), 'INTL_AFCNL') })) };
        return { ed, year: y, hosts, divs: [big(div[0], 1), big(div[1], 2), d3], qf: null, po: null, finals: null, result: null, movement: null };
    },
    _afcNlGroups(N) { return N.divs.reduce((a, d) => a.concat(d.groups), []); },
    // [{ row, pos, group }] for a division's final tables (`skip`: hosts left out of the positions)
    _afcPlaces(N, d, skip) {
        const out = [];
        N.divs[d].groups.forEach(g => this._groupOrder(g, 'rr', skip || new Set()).forEach((row, i) => out.push({ row, pos: i + 1, group: g.id })));
        return out;
    },
    _afcNlAcSlot(N, y, i, w, s) {
        const C = INTL_CONFIG;
        this._aoPlay(this._afcNlGroups(N), y, w, s, 'INTL_AFCNL');
        if (i === C.AFCNL_GROUP_SLOTS.slice(-1)[0] && !N.qf) this._afcNlAfterGroups(N, y);
        if (N.qf && (i === C.AFCNL_KO_SLOTS[0] || i === C.AFCNL_KO_SLOTS[1])) {
            const leg = i === C.AFCNL_KO_SLOTS[0] ? 1 : 2;
            N.qf.forEach(t => this._amLeg(t, leg, w, s, 'INTL_AFCNL', 'qf'));
            N.po.d12.concat(N.po.d23).forEach(t => this._amLeg(t, leg, w, s, 'INTL_AFCNL', 'po'));
            if (leg === 2) this._afcNlPromote(N);
        }
    },
    // Asian Cup edition, after the groups: Division 1 quarter-finals, the promotion play-offs and
    // the Asian Cup field
    _afcNlAfterGroups(N, y) {
        const C = INTL_CONFIG;
        const A = this._afcPlaces(N, 0);
        const thirds = this.crossRank(A.filter(e => e.pos === 3).map(e => e.row)).slice(0, C.AFCNL_QF_THIRDS).map(r => r.id);
        const seed = this._byPosThenRecord(A.filter(e => e.pos <= 2 || thirds.includes(e.row.id))).map(e => e.row.id);
        const grp = Object.fromEntries(A.map(e => [e.row.id, e.group]));
        const pairs = [[0, 7], [1, 6], [2, 5], [3, 4]].map(([x, z]) => [seed[x], seed[z]]);
        for (let guard = 0; guard < 8; guard++) {   // no group meets again in the quarter-finals
            const k = pairs.findIndex(([x, z]) => grp[x] === grp[z]);
            if (k < 0) break;
            const j = k < pairs.length - 1 ? k + 1 : k - 1;
            [pairs[k][1], pairs[j][1]] = [pairs[j][1], pairs[k][1]];
        }
        N.seed = seed;
        N.qf = pairs.map(([hi, lo]) => ({ hi, lo, leg1: null, leg2: null, winner: null }));
        const po = (up, low) => {
            const U = this.crossRank(this._afcPlaces(N, up).filter(e => e.pos === 5).map(e => e.row)).map(r => r.id);
            const D = this.crossRank(this._afcPlaces(N, low).filter(e => e.pos === 2).map(e => e.row)).map(r => r.id).reverse();
            return U.map((hi, k) => ({ hi, lo: D[k], leg1: null, leg2: null, winner: null }));
        };
        N.po = { d12: po(0, 1), d23: po(1, 2) };
        this._acQualify(N, y);
    },
    // all of Division 1 (hosts included) + hosts outside it + the best (6 - H_out) non-host
    // Division 2 teams (winners, then runners-up, then thirds; by record within a band)
    _acQualify(N, y) {
        const C = INTL_CONFIG, key = 'AC-' + (y + 2);
        const d1 = this._afcNlGroups({ divs: [N.divs[0]] }).reduce((a, g) => a.concat(g.teams), []);
        const hostsOut = N.hosts.filter(id => !d1.includes(id));
        const skip = new Set(N.hosts);
        const d2 = this._byPosThenRecord(this._afcPlaces(N, 1, skip)).map(e => e.row.id).slice(0, Math.max(0, C.AC_FROM_DIV2 - hostsOut.length));
        const teams = d1.concat(hostsOut, d2);
        this._assert(teams.length === C.AC_TEAMS && new Set(teams).size === C.AC_TEAMS, `Asian Cup ${y + 2}: ${teams.length} qualified`);
        N.acQual = { key, div1: d1, hostsOut, div2: d2 };
        this.ao().acQual[key] = { teams, hosts: N.hosts.slice() };
    },
    // Asian Cup edition: Division 1 5th v Division 2 runners-up, Division 2 5th v Division 3
    // runners-up (two legs); group winners up, 6th-placed down
    _afcNlPromote(N) {
        const pos = d => Object.fromEntries(this._afcPlaces(N, d).map(e => [e.row.id, e.pos]));
        const p = [pos(0), pos(1), pos(2)];
        const lost = list => new Set(list.filter(t => t.winner !== t.hi).map(t => t.hi));
        const won = list => new Set(list.filter(t => t.winner === t.lo).map(t => t.lo));
        const l12 = lost(N.po.d12), w12 = won(N.po.d12), l23 = lost(N.po.d23), w23 = won(N.po.d23);
        const down = [id => p[0][id] === 6 || l12.has(id), id => p[1][id] === 6 || l23.has(id)];
        const up = [null, id => p[1][id] === 1 || w12.has(id), id => p[2][id] === 1 || w23.has(id)];
        this._afcNlMove(N, down, up);
    },
    // World Cup edition: direct promotion / relegation only (winners up, 6th-placed down)
    _afcNlMove(N, down, up) {
        const ids = d => this.sortStrength(N.divs[d].groups.reduce((a, g) => a.concat(g.teams), []));
        const D = [ids(0), ids(1), ids(2)];
        const nd = [
            D[0].filter(id => !down[0](id)).concat(D[1].filter(up[1])),
            D[0].filter(down[0]).concat(D[1].filter(id => !up[1](id) && !down[1](id)), D[2].filter(up[2])),
            D[1].filter(down[1]).concat(D[2].filter(id => !up[2](id))),
        ];
        const want = INTL_CONFIG.AFCNL_SIZES;
        this._assert(nd.every((d, k) => d.length === want[k]) && new Set([].concat(...nd)).size === want.reduce((a, b) => a + b, 0),
            `AFC Nations League divisions after promotion/relegation: ${nd.map(d => d.length).join('/')}`);
        this.ao().div = nd;
        N.movement = { up: [null, D[1].filter(up[1]), D[2].filter(up[2])], down: [D[0].filter(down[0]), D[1].filter(down[1]), null] };
    },
    _afcNlFinalsDraw(N) {
        if (!N.qf || N.finals || N.qf.some(t => !t.winner)) return;
        const d = this._shuffle(N.qf.map(t => t.winner));
        N.finals = { sf: [{ h: d[0], a: d[1] }, { h: d[2], a: d[3] }], third: null, final: null };
    },
    _afcNlFinals(N, y) {
        const F = N.finals; if (!F || F.final) return;
        const w = INTL_CONFIG.AFCNL_FINALS_WEEK;
        const opt = (slot, stage) => ({ week: w, slot, neutral: true, ko: true, comp: 'INTL_AFCNL', stage });
        F.sf = F.sf.map(m => this._play(m.h, m.a, opt('A', 'sf')));
        const W = F.sf.map(m => this.winnerOf(m)), L = F.sf.map(m => this.loserOf(m));
        F.third = this._play(L[0], L[1], opt('B', 'third'));
        F.final = this._play(W[0], W[1], opt('B', 'final'));
        N.result = { winner: this.winnerOf(F.final), runnerUp: this.loserOf(F.final), third: this.winnerOf(F.third) };
        const H = this.state().honours;
        H.AFCNL = (H.AFCNL || []).concat([{ season: y, winner: N.result.winner, runnerUp: N.result.runnerUp, third: N.result.third, final: this._finalRec(F.final) }]);
        if (this._recordFinals4) this._recordFinals4('INTL_AFCNL', y, F);
        this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(N.result.winner), opp: this.name(N.result.runnerUp), score: this._score(F.final), comp: compName('INTL_AFCNL') });
    },
    // World Cup edition: MD1-8 (NL season before the World Cup), MD9-10 (World Cup season), then
    // promotion/relegation, the World Cup ranking and the AFC play-off
    _afcNlWcSlot(N, y, i, w, s) {
        const C = INTL_CONFIG;
        this._aoPlay(this._afcNlGroups(N), y, w, s, 'INTL_AFCNL');
        if (y !== N.year + 1) return;
        if (i === C.AFCNL_WC_SLOTS.WC.slice(-1)[0] && !N.ranking) {
            const p = [0, 1, 2].map(d => Object.fromEntries(this._afcPlaces(N, d).map(e => [e.row.id, e.pos])));
            this._afcNlMove(N, [id => p[0][id] === 6, id => p[1][id] === 6], [null, id => p[1][id] === 1, id => p[2][id] === 1]);
            this._afcWcRank(N, y);
        }
        if (N.playoff) {
            this._aoPlay([N.playoff], y, w, s, 'INTL_AFCQ', true);
            if (i === C.AFC_PLAYOFF_SLOTS.slice(-1)[0] && !N.result) {
                const st = this.standings(N.playoff, 'rr').map(r => r.id);
                N.result = { direct: N.ranking.direct.concat(st.slice(0, C.AFC_PLAYOFF_THROUGH)), po: [st[C.AFC_PLAYOFF_THROUGH]] };
            }
        }
    },
    // non-host Division 1 teams ranked across groups (position, then record): 6 - H direct, next 4
    // to the AFC play-off (single round-robin, neutral)
    _afcWcRank(N, y) {
        const C = INTL_CONFIG, H = N.hosts.length;
        const order = this._byPosThenRecord(this._afcPlaces(N, 0, new Set(N.hosts))).map(e => e.row.id);
        const direct = order.slice(0, C.AFC_WC_DIRECT - H), po = order.slice(C.AFC_WC_DIRECT - H, C.AFC_WC_DIRECT - H + C.AFC_PLAYOFF_TEAMS);
        N.ranking = { order, direct };
        this._assert(po.length === C.AFC_PLAYOFF_TEAMS, `AFC play-off: ${po.length} teams`);
        const teams = this.sortStrength(po);
        N.playoff = { id: 'PO', teams, fx: this._aoFixtures(teams, this.G4D.slice(0, 3), C.AFC_PLAYOFF_SLOTS.map(k => [y, k]), 'INTL_AFCQ') };
    },

    // ------------------------------------------------------------ Asian Cup (24)
    _acFixed(y) {
        const key = 'AC-' + (y + 1), hosts = this.hostsForKey(key);
        const groups = INTL_CONFIG.AC_2027_GROUPS.map(t => t.filter(id => NATIONS_BY_ID[id]));
        const teams = [].concat(...groups);
        return { key, hosts, teams, fixed: true, tour: this._acTour(key, hosts, groups) };
    },
    _acTour(key, hosts, groups) {
        return { key, comp: 'INTL_AC', size: 24, hosts: hosts.slice(), md1Only: [], groups: groups.map((t, k) => ({ id: 'ABCDEF'[k], teams: t, fx: this._tourGroupFixtures(t) })), ko: {}, winner: null };
    },
    // the field, decided by the Asian Cup edition of the Nations League the season before. A save that
    // joined after that edition takes the hosts and the strongest AFC teams instead.
    _acPrepare(y) {
        const C = INTL_CONFIG, key = 'AC-' + (y + 1), hosts = this.hostsForKey(key);
        const q = this.ao().acQual[key];
        let teams;
        if (q) teams = q.teams.slice();
        else teams = hosts.concat(this.sortStrength(this.confIds('AFC').filter(id => !hosts.includes(id)))).slice(0, C.AC_TEAMS);
        return { key, hosts, teams, fallback: !q, tour: null };
    },
    _acDraw(A) {
        const C = INTL_CONFIG;
        this._assert(A.teams.length === C.AC_TEAMS && new Set(A.teams).size === C.AC_TEAMS, `${A.key}: ${A.teams.length} teams`);
        const hosts = A.hosts.filter(id => A.teams.includes(id));
        const ranked = hosts.concat(this.sortStrength(A.teams.filter(id => !hosts.includes(id))));
        const pots = [0, 1, 2, 3].map(p => ranked.slice(p * 6, p * 6 + 6));
        const groups = this._drawGroups(pots, 6, (g, id) => !(hosts.includes(id) && g.some(x => hosts.includes(x))))
            .sort((x, z) => (hosts.includes(z[0]) ? 1 : 0) - (hosts.includes(x[0]) ? 1 : 0));
        A.tour = this._acTour(A.key, hosts, groups);
    },
    // days 0-2 groups, 3 Round of 16 (with the 4 best thirds), 4 QF, 5 SF (A) + final (B)
    _acDay(S, day) {
        const T = S.ao.ac.tour, week = INTL_CONFIG.TOURNAMENT_WEEKS[day];
        const B = INTL_CONFIG.TOURNAMENT_HOST_BOOST || 0;
        const opt = (h, a, slot, stage) => ({ week, slot, neutral: true, advH: false, advA: false, bH: T.hosts.includes(h) ? B : 0, bA: T.hosts.includes(a) ? B : 0, ko: stage !== 'group', comp: 'INTL_AC', stage });
        const play = (h, a, slot, stage) => this._play(h, a, opt(h, a, slot, stage));
        const W = m => this.winnerOf(m), Lo = m => this.loserOf(m), K = T.ko;
        if (day <= 2) {
            T.groups.forEach(g => g.fx.forEach(f => {
                if (f.md !== day + 1) return;
                const r = play(f.h, f.a, 'A', 'group'); f.hg = r.hg; f.ag = r.ag; f.w = week; f.s = 'A';
            }));
            if (day === 2) this._firstKnockout(T, week);   // the EURO 24 bracket
            return;
        }
        if (day === 3) K.r16 = K.r16.map(m => play(m.h, m.a, 'A', 'r16'));
        else if (day === 4) {
            const r = K.r16.map(W);
            K.qf = [[2, 0], [4, 5], [3, 1], [6, 7]].map(([x, z]) => play(r[x], r[z], 'A', 'qf'));
        } else if (day === 5) {
            const q = K.qf.map(W);
            K.sf = [play(q[0], q[1], 'A', 'sf'), play(q[2], q[3], 'A', 'sf')];
            K.final = play(W(K.sf[0]), W(K.sf[1]), 'B', 'final');
            T.winner = W(K.final); T.runnerUp = Lo(K.final);
            const H = this.state().honours;
            H.AC = (H.AC || []).concat([{ season: S.year, year: S.year + 1, winner: T.winner, runnerUp: T.runnerUp, hosts: T.hosts.slice(), final: this._finalRec(K.final) }]);
            if (this._recordFinishes) this._recordFinishes('INTL_AC', S.year + 1, T);
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(T.winner), opp: this.name(T.runnerUp), score: this._score(K.final), comp: compName('INTL_AC') + ' ' + (S.year + 1) });
        }
    },

    // ------------------------------------------------------------ OFC World Cup qualifiers
    // hosts sit out. R1: the (11 - H) - 7 weakest, a neutral knockout (S1 semis, S2 final); R2: 2
    // groups of 4 (S3-S5); R3: neutral semis (S7) and final (S8)
    _ofcqDraw(y) {
        const C = INTL_CONFIG, key = 'WC-' + (y + 2);
        const hosts = this.hostsForKey(key).filter(id => this.conf(id) === 'OFC');
        const field = this.sortStrength(this.confIds('OFC', { fifa: true }).filter(id => !hosts.includes(id)));
        const nBye = C.OFCQ_R2_TEAMS - 1, byes = field.slice(0, nBye), r1 = field.slice(nBye);
        const [p1, p2] = C.OFCQ_R2_POTS;
        const pots = [byes.slice(0, p1), byes.slice(p1, p1 + p2), byes.slice(p1 + p2).concat(['R1W'])];
        const groups = this._drawGroups(pots, 2).map((teams, g) => ({ id: 'AB'[g], teams, fx: null }));
        return { key, year: y, hosts, r1: { teams: r1, sf: null, final: null, winner: r1.length === 1 ? r1[0] : null }, r2: { groups }, r3: null, result: null };
    },
    _ofcqSlot(Q, y, i, w, s) {
        const C = INTL_CONFIG;
        const ko = (h, a, stage) => this._play(h, a, { week: w, slot: s, neutral: true, ko: true, comp: 'INTL_OFCQ', stage });
        const R1 = Q.r1, t = R1.teams;
        if (i === C.OFCQ_R1_SF_SLOT && t.length >= 3 && !(R1.sf && R1.sf.some(m => m.hg != null))) R1.sf = t.length === 4 ? [ko(t[0], t[3], 'sf'), ko(t[1], t[2], 'sf')] : [ko(t[1], t[2], 'sf')];
        if (i === C.OFCQ_R1_FINAL_SLOT && t.length >= 2) {
            const [x, z] = t.length === 4 ? R1.sf.map(m => this.winnerOf(m)) : t.length === 3 ? [t[0], this.winnerOf(R1.sf[0])] : [t[0], t[1]];
            R1.final = ko(x, z, 'final'); R1.winner = this.winnerOf(R1.final);
        }
        if (i === C.OFCQ_R2_SLOTS[0] && !Q.r2.groups[0].fx) Q.r2.groups.forEach(g => {
            g.teams = g.teams.map(id => id === 'R1W' ? R1.winner : id);
            g.fx = this._aoFixtures(g.teams, this.G4D.slice(0, 3), C.OFCQ_R2_SLOTS.map(k => [y, k]), 'INTL_OFCQ');
        });
        this._aoPlay(Q.r2.groups, y, w, s, 'INTL_OFCQ');
        if (i === C.OFCQ_R3_SF_SLOT && (!Q.r3 || Q.r3.sf.every(m => m.hg == null))) {
            const [A, B] = Q.r2.groups.map(g => this.standings(g, 'rr').map(r => r.id));
            Q.r3 = { sf: [ko(A[0], B[1], 'sf'), ko(B[0], A[1], 'sf')], final: null };
        }
        if (i === C.OFCQ_R3_FINAL_SLOT && Q.r3 && (!Q.r3.final || Q.r3.final.hg == null)) {
            Q.r3.final = ko(this.winnerOf(Q.r3.sf[0]), this.winnerOf(Q.r3.sf[1]), 'final');
            const win = this.winnerOf(Q.r3.final), ru = this.loserOf(Q.r3.final);
            // 1 direct place (an OFC host takes it) + 1 inter-confederation play-off place
            Q.result = Q.hosts.length ? { direct: [], po: [win] } : { direct: [win], po: [ru] };
        }
    },

    // ------------------------------------------------------------ OFC Nations Cup (8)
    _oncDraw(y) {
        const C = INTL_CONFIG, key = 'ONC-' + (y + 1), hosts = this.hostsForKey(key);
        const rest = this.sortStrength(this.confIds('OFC').filter(id => !hosts.includes(id)));
        const qTeams = rest.slice(rest.length - C.ONCQ_TEAMS), direct = hosts.concat(rest.slice(0, rest.length - C.ONCQ_TEAMS));
        const q = { id: 'Q', teams: qTeams, fx: this._aoFixtures(qTeams, this.G4D.slice(0, 3), C.ONCQ_SLOTS.map(k => [y, k]), 'INTL_ONCQ') };
        return { key, hosts, direct, q, qWinner: null, tour: null };
    },
    _oncSlot(N, y, i, w, s) {
        this._aoPlay([N.q], y, w, s, 'INTL_ONCQ', true);
        if (i === INTL_CONFIG.ONCQ_SLOTS.slice(-1)[0] && !N.qWinner) N.qWinner = this.standings(N.q, 'rr')[0].id;
    },
    _oncFinalsDraw(N) {
        if (!N.qWinner || N.tour) return;
        const C = INTL_CONFIG, teams = N.direct.concat([N.qWinner]);
        this._assert(teams.length === C.ONC_TEAMS && new Set(teams).size === C.ONC_TEAMS, `${N.key}: ${teams.length} teams`);
        const hosts = N.hosts.filter(id => teams.includes(id));
        const ranked = hosts.concat(this.sortStrength(teams.filter(id => !hosts.includes(id))));
        const pots = [0, 1, 2, 3].map(p => ranked.slice(p * 2, p * 2 + 2));
        const groups = this._drawGroups(pots, 2, (g, id) => !(hosts.includes(id) && g.some(x => hosts.includes(x))))
            .sort((x, z) => (hosts.includes(z[0]) ? 1 : 0) - (hosts.includes(x[0]) ? 1 : 0));
        N.tour = { key: N.key, comp: 'INTL_ONC', size: 8, hosts, md1Only: [], groups: groups.map((t, k) => ({ id: 'AB'[k], teams: t, fx: this._tourGroupFixtures(t) })), ko: {}, winner: null };
    },
    // days 0-2 groups, 3 semi-finals, 4 third place (A) + final (B)
    _oncDay(S, day) {
        const T = S.ao.onc.tour, week = INTL_CONFIG.TOURNAMENT_WEEKS[day];
        const B = INTL_CONFIG.TOURNAMENT_HOST_BOOST || 0;
        const play = (h, a, slot, stage) => this._play(h, a, { week, slot, neutral: true, advH: false, advA: false, bH: T.hosts.includes(h) ? B : 0, bA: T.hosts.includes(a) ? B : 0, ko: stage !== 'group', comp: 'INTL_ONC', stage });
        const W = m => this.winnerOf(m), Lo = m => this.loserOf(m), K = T.ko;
        if (day <= 2) {
            T.groups.forEach(g => g.fx.forEach(f => {
                if (f.md !== day + 1) return;
                const r = play(f.h, f.a, 'A', 'group'); f.hg = r.hg; f.ag = r.ag; f.w = week; f.s = 'A';
            }));
        } else if (day === 3) {
            const [A, B] = T.groups.map(g => this.standings(g, 'rr').map(r => r.id));
            K.sf = [play(A[0], B[1], 'A', 'sf'), play(B[0], A[1], 'A', 'sf')];
        } else if (day === 4) {
            K.third = play(Lo(K.sf[0]), Lo(K.sf[1]), 'A', 'third');
            K.final = play(W(K.sf[0]), W(K.sf[1]), 'B', 'final');
            T.winner = W(K.final); T.runnerUp = Lo(K.final);
            const H = this.state().honours;
            H.ONC = (H.ONC || []).concat([{ season: S.year, year: S.year + 1, winner: T.winner, runnerUp: T.runnerUp, third: W(K.third), hosts: T.hosts.slice(), final: this._finalRec(K.final) }]);
            if (this._recordFinishes) this._recordFinishes('INTL_ONC', S.year + 1, T);
            this._notify('intl.mail.tourWinSubj', 'intl.mail.tourWinBody', { nation: this.name(T.winner), opp: this.name(T.runnerUp), score: this._score(K.final), comp: compName('INTL_ONC') + ' ' + (S.year + 1) });
        }
    },

    // ------------------------------------------------------------ checks
    _aoCheck(y, w, S, ti) {
        const want = this.aoExpected(y, w, S, ti), got = this._aoCount || {};
        new Set([...Object.keys(want), ...Object.keys(got)]).forEach(k => this._assert((want[k] || 0) === (got[k] || 0), `Asia/Oceania, season ${y} week ${k}: ${got[k] || 0} matches, expected ${want[k] || 0}`));
    },
    // expected AFC + OFC matches per slot (sections 2-4 and 6 of the plan)
    aoExpected(y, w, S, ti) {
        const out = {}; if (!S || !S.ao) return out;
        const C = INTL_CONFIG, cyc = this._aoWcCycle(y);
        const add = (k, n) => { if (n) out[k] = (out[k] || 0) + n; };
        const dated = (groups, s) => groups.reduce((a, g) => a + (g.fx ? g.fx.filter(f => f.y === y && f.w === w && f.s === s).length : 0), 0);
        C.STD_SLOTS.forEach(([ww, s], i0) => {
            if (ww !== w) return;
            const i = i0 + 1, k = w + s;
            if (S.ao.nl) {
                add(k, dated(this._afcNlGroups(S.ao.nl), s));
                if (S.ao.nl.qf && C.AFCNL_KO_SLOTS.includes(i)) add(k, 4 + 3 + 3);
            }
            if (cyc.nl) add(k, dated(this._afcNlGroups(cyc.nl).concat(cyc.nl.playoff ? [cyc.nl.playoff] : []), s));
            if (cyc.ofc) {
                const n1 = cyc.ofc.r1.teams.length;
                if (i === C.OFCQ_R1_SF_SLOT) add(k, n1 === 4 ? 2 : n1 === 3 ? 1 : 0);
                if (i === C.OFCQ_R1_FINAL_SLOT) add(k, n1 >= 2 ? 1 : 0);
                add(k, dated(cyc.ofc.r2.groups, s));
                if (cyc.ofc.r3 && i === C.OFCQ_R3_SF_SLOT) add(k, 2);
                if (cyc.ofc.r3 && i === C.OFCQ_R3_FINAL_SLOT) add(k, 1);
            }
            if (S.ao.onc) add(k, dated([S.ao.onc.q], s));
        });
        if (w === C.AFCNL_FINALS_WEEK && S.ao.nl && S.ao.nl.finals) { add(w + 'A', 2); add(w + 'B', 2); }
        if (ti >= 0) {
            const tw = C.TOURNAMENT_WEEKS[ti];
            if (S.ao.ac && S.ao.ac.tour) { if (ti <= 2) add(tw + 'A', 12); else if (ti === 3) add(tw + 'A', 8); else if (ti === 4) add(tw + 'A', 4); else { add(tw + 'A', 2); add(tw + 'B', 1); } }
            if (S.ao.onc && S.ao.onc.tour) { if (ti <= 2) add(tw + 'A', 4); else if (ti === 3) add(tw + 'A', 2); else if (ti === 4) { add(tw + 'A', 1); add(tw + 'B', 1); } }
        }
        return out;
    },
});
