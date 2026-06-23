// ============================================================
//  Competitions, schedules, standings, match simulation, cups,
//  promotion play-offs and promotion/relegation
// ============================================================
const COMPETITIONS = {
    ERE: { name: 'Eredivisie', short: 'ERE', type: 'league' },
    EED: { name: 'Eerste Divisie', short: 'EED', type: 'league' },
    TWD: { name: 'Tweede Divisie', short: 'TWD', type: 'league' },
    DRD: { name: 'Derde Divisie', short: 'DRD', type: 'league' },
    BEKER: { name: 'KNVB Beker', short: 'Beker', type: 'cup' },
    KBEK: { name: 'De kleine Beker', short: 'kl. Beker', type: 'cup' },
    PO: { name: 'Promotion Play-off', short: 'PO', type: 'playoff' },
    UCL: { name: 'Champions League', short: 'UCL', type: 'cont' },
    JCS: { name: 'Johan Cruijff Schaal', short: 'JCS', type: 'super' },
    U21: { name: 'U21 League', short: 'U21', type: 'youth', youth: true }
};
function compName(id) { return COMPETITIONS[id] ? COMPETITIONS[id].name : id; }

const DIV_ORDER = ['ERE', 'EED', 'TWD', 'DRD'];
const DIV_TIER = { ERE: 1, EED: 2, TWD: 3, DRD: 4 };

const League = {
    roundRobin(ids) {
        ids = [...ids];
        if (ids.length % 2) ids.push(null);
        const n = ids.length, rounds = [];
        const arr = [...ids];
        for (let r = 0; r < n - 1; r++) {
            const pairs = [];
            for (let i = 0; i < n / 2; i++) {
                const a = arr[i], b = arr[n - 1 - i];
                if (a != null && b != null) pairs.push(r % 2 ? [b, a] : [a, b]);
            }
            rounds.push(pairs);
            arr.splice(1, 0, arr.pop());
        }
        return rounds.concat(rounds.map(rd => rd.map(([h, a]) => [a, h])));
    },
    shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

    setupSeason() {
        const tables = {}, schedule = {}, mdIndex = {};
        DIV_ORDER.forEach(div => {
            const ids = Clubs.getClubsByDivision(div).map(c => c.id);
            schedule[div] = this.roundRobin(ids);
            mdIndex[div] = 0;
            tables[div] = ids.map(id => ({ clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }));
        });
        GameState.league = {
            tables, schedule, mdIndex,
            beker: this._buildBeker(),
            kbek: this._buildKleine(),
            playoffs: { EED: null, TWD: null, DRD: null, _done: false },
            prorel: null,
            champions: {},
            finished: false
        };
    },

    // ---------------- KNVB Beker ----------------
    _buildBeker() {
        const lower = Clubs.allClubs.filter(c => c.tier >= 2 && c.tier <= 4).map(c => c.id);
        return { remaining: this.shuffle(lower), stage: 'early', results: [], winner: null };
    },
    _bekerRoundName(week) {
        return ({ 4: 'First round', 7: 'Second round', 15: 'Round of 32', 26: 'Round of 16', 32: 'Quarter-finals', 38: 'Semi-finals', 47: 'Final' })[week];
    },
    bekerStep(week) {
        const B = GameState.league.beker; if (!B || B.winner) return;
        if (week === 15) {
            B.remaining = this.shuffle(B.remaining.concat(Clubs.getClubsByDivision('ERE').map(c => c.id)));
            B.stage = 'main';
        }
        const pairs = week === 4 ? this._bekerFirstRoundPairs(B.remaining) : this._pairUp(this.shuffle(B.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const r = this.playMatch(h, a, 'BEKER', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner });
            winners.push(r.winner);
        });
        B.remaining = winners;
        B.results.push({ week, round: this._bekerRoundName(week), ties });
        if (week === 47 || B.remaining.length <= 1) B.winner = B.remaining[0];
    },
    _bekerFirstRoundPairs(ids) {
        const t2 = this.shuffle(ids.filter(id => Clubs.getClubById(id)?.tier === 2));
        const lower = this.shuffle(ids.filter(id => Clubs.getClubById(id)?.tier !== 2));
        const pairs = [];
        t2.forEach(t => { const o = lower.pop(); pairs.push([t, o ?? null]); });
        while (lower.length >= 2) pairs.push([lower.pop(), lower.pop()]);
        if (lower.length) pairs.push([lower.pop(), null]);
        return pairs;
    },
    _pairUp(arr) { const pairs = []; for (let i = 0; i < arr.length; i += 2) pairs.push([arr[i], arr[i + 1] ?? null]); return pairs; },

    // ---------------- De kleine Beker ----------------
    _buildKleine() {
        const twd = this.shuffle(Clubs.getClubsByDivision('TWD').map(c => c.id));
        const drd = this.shuffle(Clubs.getClubsByDivision('DRD').map(c => c.id));
        const groups = [];
        for (let g = 0; g < 12; g++) {
            const teams = g < 6 ? [twd.pop(), twd.pop(), drd.pop()] : [twd.pop(), drd.pop(), drd.pop()];
            groups.push({
                teams,
                table: teams.map(id => ({ clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0, cards: 0 })),
                fixtures: [[0, 1], [2, 0], [1, 2]],
                md: 0
            });
        }
        return { groups, results: [], remaining: [], groupDone: false, winner: null };
    },
    kleineGroupStep() {
        const K = GameState.league.kbek;
        K.groups.forEach(grp => {
            if (grp.md >= grp.fixtures.length) return;
            const [i, j] = grp.fixtures[grp.md];
            const h = grp.teams[i], a = grp.teams[j];
            const r = this.playMatch(h, a, 'KBEK', true);
            const rh = grp.table.find(x => x.clubId === h), ra = grp.table.find(x => x.clubId === a);
            rh.P++; ra.P++; rh.GF += r.hg; rh.GA += r.ag; ra.GF += r.ag; ra.GA += r.hg;
            if (r.hg > r.ag) { rh.W++; ra.L++; rh.Pts += 3; } else if (r.hg < r.ag) { ra.W++; rh.L++; ra.Pts += 3; } else { rh.D++; ra.D++; rh.Pts++; ra.Pts++; }
            rh.cards += Math.floor(Math.random() * 4); ra.cards += Math.floor(Math.random() * 4);
            grp.md++;
        });
    },
    _kSort(table) {
        return [...table].sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || a.GA - b.GA || a.cards - b.cards || (Math.random() - 0.5));
    },
    seedKleineKO() {
        const K = GameState.league.kbek;
        const winners = [], seconds = [];
        K.groups.forEach(grp => { const s = this._kSort(grp.table); winners.push(s[0].clubId); seconds.push(s[1]); });
        seconds.sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || a.GA - b.GA || a.cards - b.cards || (Math.random() - 0.5));
        K.remaining = this.shuffle(winners.concat(seconds.slice(0, 4).map(r => r.clubId)));
    },
    _kleineRoundName(week) { return ({ 26: 'Round of 16', 32: 'Quarter-finals', 38: 'Semi-finals', 47: 'Final' })[week]; },
    kleineKOStep(week) {
        const K = GameState.league.kbek; if (!K || K.winner) return;
        const pairs = this._pairUp(this.shuffle(K.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); return; }
            const r = this.playMatch(h, a, 'KBEK', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        K.remaining = winners;
        K.results.push({ week, round: this._kleineRoundName(week), ties });
        if (week === 47 || K.remaining.length <= 1) K.winner = K.remaining[0];
    },

    // ---------------- promotion play-offs (week 46) ----------------
    playPlayoffs() {
        const L = GameState.league;
        ['EED', 'TWD', 'DRD'].forEach(div => {
            const blue = this.promoStructure(div).blue;
            if (blue.length < 4) { L.playoffs[div] = null; return; }
            const [b1, b2, b3, b4] = blue;   // ordered by league finish (best seed first)
            const sf1 = this.playMatch(b1, b4, 'PO', true);
            const sf2 = this.playMatch(b2, b3, 'PO', true);
            const t = this.sortedTable(div); const seed = id => t.findIndex(r => r.clubId === id);
            const home = seed(sf1.winner) <= seed(sf2.winner) ? sf1.winner : sf2.winner;
            const away = home === sf1.winner ? sf2.winner : sf1.winner;
            const fin = this.playMatch(home, away, 'PO', true);
            L.playoffs[div] = {
                sf: [{ h: b1, a: b4, hg: sf1.hg, ag: sf1.ag, winner: sf1.winner }, { h: b2, a: b3, hg: sf2.hg, ag: sf2.ag, winner: sf2.winner }],
                final: { h: home, a: away, hg: fin.hg, ag: fin.ag, winner: fin.winner },
                winner: fin.winner
            };
        });
    },

    YOUTH_CAP: { ERE: 0, EED: Infinity, TWD: 5, DRD: 4 },
    _destDivOf(srcDiv) { return { EED: 'ERE', TWD: 'EED', DRD: 'TWD' }[srcDiv]; },
    // ordered promotion picture for a division: who is green (direct), who is blue (play-off), who is denied
    promoStructure(srcDiv) {
        const destDiv = this._destDivOf(srcDiv);
        const sorted = this.sortedTable(srcDiv).map(r => r.clubId);
        const isY = id => isReserveClub(id);
        const parentDivOf = id => { const par = parentClubForReserve(id); return par ? par.division : null; };
        const cap = this.YOUTH_CAP[destDiv];
        // reserve sides already guaranteed to sit in destDiv next season (survivors + relegated-in from above)
        const destSorted = this.sortedTable(destDiv).map(r => r.clubId);
        const destSurvReserves = (destDiv === 'ERE' ? destSorted : destSorted.slice(0, destSorted.length - 3)).filter(isY).length;
        const aboveDiv = { EED: 'ERE', TWD: 'EED', DRD: 'TWD' }[destDiv] || null;
        const relegInReserves = aboveDiv ? this.sortedTable(aboveDiv).map(r => r.clubId).slice(-3).filter(isY).length : 0;
        let reservesInDest = destSurvReserves + relegInReserves;
        const green = [], blue = [], denied = [];
        for (const id of sorted) {
            let elig = true;
            if (isY(id)) {
                if (destDiv === 'ERE') elig = false;                 // never a reserve side in the Eredivisie
                else if (parentDivOf(id) === destDiv) elig = false;  // can't join the first team's own division
                else if (reservesInDest + 1 > cap) elig = false;     // division reserve cap reached
            }
            if (elig) { (green.length < 2 ? green : blue).push(id); if (isY(id)) reservesInDest++; }
            else if (isY(id) && sorted.indexOf(id) < 6) denied.push(id);
            if (green.length + blue.length >= 6) break;
        }
        return { green, blue: blue.slice(0, 4), denied };
    },
    computeProRel() {
        const L = GameState.league; if (!L) return null;
        const poW = d => (L.playoffs && L.playoffs[d]) ? L.playoffs[d].winner : null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const ere = ord('ERE'), eed = ord('EED'), twd = ord('TWD'), drd = ord('DRD');
        const ereDown = ere.slice(-3), eedDown = eed.slice(-3), twdDown = twd.slice(-3);
        const sEED = this.promoStructure('EED'), sTWD = this.promoStructure('TWD'), sDRD = this.promoStructure('DRD');
        const promoted = (s, pw) => { const out = [...s.green]; const w = (pw && s.blue.includes(pw)) ? pw : s.blue[0]; if (w) out.push(w); return out.slice(0, 3); };
        const eedUp = promoted(sEED, poW('EED')), twdUp = promoted(sTWD, poW('TWD')), drdUp = promoted(sDRD, poW('DRD'));
        const notes = [...sEED.denied.map(id => ({ div: 'EED', clubId: id })), ...sTWD.denied.map(id => ({ div: 'TWD', clubId: id })), ...sDRD.denied.map(id => ({ div: 'DRD', clubId: id }))];
        return {
            year: GameState.seasonStartYear, ere, eed, twd, drd, ereDown, eedDown, twdDown, eedUp, twdUp, drdUp,
            marks: { EED: { green: sEED.green, blue: sEED.blue }, TWD: { green: sTWD.green, blue: sTWD.blue }, DRD: { green: sDRD.green, blue: sDRD.blue } },
            notes
        };
    },
    applyPromotionRelegation() {
        const c = this.computeProRel(); if (!c) return null;
        const move = (arr, div) => arr.forEach(id => Clubs.setDivision(id, div));
        move(c.ereDown, 'EED'); move(c.eedUp, 'ERE');
        move(c.eedDown, 'TWD'); move(c.twdUp, 'EED');
        move(c.twdDown, 'DRD'); move(c.drdUp, 'TWD');
        return c;
    },

    clubStrength(clubId) {
        const c = Clubs.getClubById(clubId);
        if (!c) return 50;
        const squad = GameState.players.filter(p => effectiveClubId(p) === clubId && !p.injury);
        const top = squad.sort((a, b) => b.ability - a.ability).slice(0, 11);
        const avg = top.length ? top.reduce((s, p) => s + p.ability, 0) / top.length : c.reputation;
        return c.reputation * 0.5 + avg * 0.5;
    },

    // ---------------- weekly simulation ----------------
    simulateWeek() {
        const L = GameState.league; if (!L) return;
        const week = GameState.week;

        DIV_ORDER.forEach(div => {
            const s = L.schedule[div], idx = L.mdIndex[div];
            if (idx < s.length) { s[idx].forEach(([h, a]) => this.playLeagueMatch(div, h, a)); L.mdIndex[div] = idx + 1; }
        });

        if ([4, 7, 15, 26, 32, 38, 47].includes(week)) this.bekerStep(week);

        if ([4, 7, 16].includes(week) && L.kbek && !L.kbek.groupDone) {
            this.kleineGroupStep();
            if (week === 16) { this.seedKleineKO(); L.kbek.groupDone = true; }
        } else if ([26, 32, 38, 47].includes(week) && L.kbek && L.kbek.groupDone) {
            this.kleineKOStep(week);
        }

        if (week === 46 && L.playoffs && !L.playoffs._done) { this.playPlayoffs(); L.playoffs._done = true; }
    },

    playLeagueMatch(div, homeId, awayId) {
        const res = this.playMatch(homeId, awayId, div, true);
        const T = GameState.league.tables[div];
        const home = T.find(r => r.clubId === homeId), away = T.find(r => r.clubId === awayId);
        home.P++; away.P++;
        home.GF += res.hg; home.GA += res.ag; away.GF += res.ag; away.GA += res.hg;
        if (res.hg > res.ag) { home.W++; away.L++; home.Pts += 3; }
        else if (res.hg < res.ag) { away.W++; home.L++; away.Pts += 3; }
        else { home.D++; away.D++; home.Pts++; away.Pts++; }
    },

    playMatch(homeId, awayId, compId, homeAdv = false) {
        const sh = this.clubStrength(homeId) + (homeAdv ? 4 : 0);
        const sa = this.clubStrength(awayId);
        const hg = this.scoreGoals(sh, sa);
        const ag = this.scoreGoals(sa, sh);
        this.assignStats(homeId, compId, hg, ag);
        this.assignStats(awayId, compId, ag, hg);
        let winner = homeId;
        if (ag > hg) winner = awayId;
        else if (hg === ag) winner = (sh + Math.random() * 6) >= (sa + Math.random() * 6) ? homeId : awayId;
        return { hg, ag, winner };
    },

    scoreGoals(att, def) {
        const lambda = Math.max(0.2, 1.3 + (att - def) / 22);
        let g = 0; const p = Math.exp(-lambda); let cum = p, x = Math.random(), term = p, k = 0;
        while (x > cum && k < 8) { k++; term *= lambda / k; cum += term; g = k; }
        return g;
    },

    assignStats(clubId, compId, scored, conceded) {
        const year = GameState.seasonStartYear;
        const squad = GameState.players.filter(p => effectiveClubId(p) === clubId && !p.injury);
        if (!squad.length) return;

        const loanedIn = squad.filter(p => p.onLoanAt === clubId);
        const guaranteed = [], maybeLoan = [];
        loanedIn.forEach(p => { if (p.loanRole === 'rotation' && Math.random() > 0.65) maybeLoan.push(p); else guaranteed.push(p); });
        guaranteed.splice(5);
        const rest = squad.filter(p => !guaranteed.includes(p) && !maybeLoan.includes(p));
        const bestGK = rest.filter(p => p.position === 'GK').sort((a, b) => b.ability - a.ability)[0];
        const outfield = rest.filter(p => p !== bestGK)
            .map(p => ({ p, w: (ROLE_PLAYTIME[p.squadRole] ?? 0.4) * 3 + p.ability / 80 + Math.random() * 0.8 }))
            .sort((a, b) => b.w - a.w).map(x => x.p);

        const starters = [];
        if (bestGK) starters.push(bestGK);
        guaranteed.forEach(p => { if (starters.length < 11) starters.push(p); });
        for (const p of outfield) { if (starters.length >= 11) break; starters.push(p); }
        const subs = maybeLoan.concat(outfield.filter(p => !starters.includes(p))).slice(0, 5);

        const appear = [];
        starters.forEach(p => appear.push({ p, full: true, g: 0, a: 0 }));
        subs.forEach(p => { if (Math.random() < 0.5) appear.push({ p, full: false, g: 0, a: 0 }); });
        if (!appear.length) return;

        const posW = { ST: 1.0, LW: 0.8, RW: 0.8, CAM: 0.7, CM: 0.4, CDM: 0.2, LB: 0.15, RB: 0.15, CB: 0.12, GK: 0.0 };
        const posWA = { ST: 1.0, LW: 0.95, RW: 0.95, CAM: 1.0, CM: 0.55, CDM: 0.3, LB: 0.4, RB: 0.4, CB: 0.12, GK: 0.015 };
        const sBias = p => (typeof Scouting !== 'undefined' ? Scouting.styleBias(p) : { goal: 1, assist: 1 });
        const wG = a => (posW[a.p.position] ?? 0.3) * (0.5 + a.p.ability / 100) * sBias(a.p).goal;
        const wA = a => (posWA[a.p.position] ?? 0.3) * (0.5 + a.p.ability / 100) * sBias(a.p).assist;
        for (let i = 0; i < scored; i++) {
            const total = appear.reduce((s, a) => s + wG(a), 0) || 1;
            let r = Math.random() * total, pick = appear[0];
            for (const a of appear) { r -= wG(a); if (r <= 0) { pick = a; break; } }
            pick.g += 1;
            if (Math.random() < 0.7) {
                const others = appear.filter(a => a !== pick);
                if (others.length) {
                    const t2 = others.reduce((s, a) => s + wA(a) + 0.05, 0); let r2 = Math.random() * t2, as = others[0];
                    for (const a of others) { r2 -= (wA(a) + 0.05); if (r2 <= 0) { as = a; break; } }
                    as.a += 1;
                }
            }
        }

        // yellow/red card rates by position: keepers almost never, forwards seldom, defenders/holding most
        const yellowRate = { GK: 0.02, CB: 0.15, LB: 0.13, RB: 0.13, CDM: 0.15, CM: 0.11, CAM: 0.08, LW: 0.06, RW: 0.06, ST: 0.06 };
        const win = scored > conceded, draw = scored === conceded;
        const resultBonus = win ? 0.55 : draw ? 0.05 : -0.4;
        appear.forEach(a => {
            const p = a.p, loan = p.onLoanAt === clubId;
            const c = statBucket(p, year, clubId, loan, false, compId);
            c.apps += 1; c.goals += a.g; c.assists += a.a;
            if (p.position === 'GK' && conceded === 0) c.cs = (c.cs || 0) + 1;   // clean sheet
            p._weekApps = (p._weekApps || 0) + (a.full ? 1 : 0.5);
            const yRate = yellowRate[p.position] ?? 0.10, rRate = yRate * 0.06;
            const rr = Math.random();
            if (rr < rRate) c.red += 1; else if (rr < yRate) c.yellow += 1;
            // base ratings sit higher; goals/assists swing them up sharply
            let rating = 6.7 + (p.ability - 50) * 0.018 + resultBonus + a.g * 1.0 + a.a * 0.55;
            if (conceded === 0 && (p.position === 'GK' || p.position === 'CB' || p.position === 'LB' || p.position === 'RB')) rating += 0.6;
            if (conceded >= 3 && (p.position === 'GK' || p.position === 'CB')) rating -= 0.45;
            rating += PlayerGen.gauss(0, 0.4);
            c.ratingSum += Math.max(4.0, Math.min(10, rating));
        });
    },

    sortedTable(div) {
        const T = (GameState.league.tables[div] || []).slice();
        T.sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF);
        return T;
    },

    finishSeason() {
        const L = GameState.league, year = GameState.seasonStartYear, awarded = [];
        DIV_ORDER.forEach(div => {
            const champ = this.sortedTable(div)[0];
            if (champ) { L.champions[div] = champ.clubId; this.awardTrophy(champ.clubId, div, year, awarded); }
        });
        if (L.beker && L.beker.winner) this.awardTrophy(L.beker.winner, 'BEKER', year, awarded);
        if (L.kbek && L.kbek.winner) this.awardTrophy(L.kbek.winner, 'KBEK', year, awarded);
        L.finished = true;
        return awarded;
    },

    awardTrophy(clubId, compId, year, awarded) {
        const winners = GameState.players.filter(p => {
            const s = p.stats[year]; if (!s) return false;
            return Object.values(s).some(st => st.clubId === clubId && !st.youth);
        });
        const clientWinners = [];
        winners.forEach(p => { p.trophies.push({ year, compId, clubId }); if (p.agentId === 'me') clientWinners.push(p.id); });
        awarded.push({ clubId, compId, clients: clientWinners });
    }
};
