// UEFA club competitions (UCL / UEL / UECL). Reads js/europe-data.js (parsed from the spreadsheet)
// and simulates, every season: the non-implemented domestic leagues+cups, the entry lists, the
// qualifying rounds, the 36-team league phases (pots + swiss draw), and the knockouts. Vanilla JS,
// no dependencies. See docs/europe.md for the model.
//
// Virtual clubs (the pooled ranks 10-55) are registered in EUROPE_VIRTUAL_MAP and resolved by
// league.js's findVirtualClub(), so League.clubStrength / playMatch / _twoLeggedTie / teamName all
// work on them exactly like real clubs. Everything the engine stores is plain ids + numbers, so it
// serialises into the save with the rest of GameState.league.

const EUROPE_VIRTUAL_MAP = (function () {
    const m = {};
    if (typeof EUROPE_DATA !== 'undefined') {
        for (const [country, pool] of Object.entries(EUROPE_DATA.pools)) {
            // `real` clubs (e.g. Liechtenstein's Vaduz / Eschen-Mauren, who play in the Swiss league)
            // are actual game clubs — never shadow them with a virtual entry.
            for (const c of pool.clubs) if (!c.real) m[c.id] = { id: c.id, name: c.name, reputation: c.rep, country, virtual: true, european: true };
        }
    }
    return m;
})();

// tag -> row styling for the domestic top-division highlighting (section 5). 'CHAMP' is the champion
// (darkest); the rest mirror the berth each finishing position earns.
const EUROPE_TAG_INFO = {
    CHAMP: { label: 'Champion', color: '#14532D', text: '#ffffff' },
    U: { label: 'Champions League', color: '#16A34A', text: '#ffffff' },
    UCLq: { label: 'Champions League qualifying', color: '#86EFAC', text: '#0b3d1e' },
    UEL: { label: 'Europa League', color: '#2563EB', text: '#ffffff' },
    UELcup: { label: 'Europa League', color: '#2563EB', text: '#ffffff' },
    UELq: { label: 'Europa League qualifying', color: '#60A5FA', text: '#0b2a5b' },
    UECL: { label: 'Conference League', color: '#93C5FD', text: '#0b2a5b' },
};

// Distinct trophy silhouettes for the three competitions (used on honours pills, client history,
// agency history). UCL = big-eared cup; UEL = handleless chalice; UECL = wide shallow bowl. Returns
// '' for any other competition so callers fall back to the generic trophy icon.
function europeTrophyIcon(compId, size) {
    size = size || '1em';
    const open = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;flex:none" aria-hidden="true">`;
    const base = `<path d="M8.5 20.5h7l-1-4h-5z"/>`, stem = `<rect x="11" y="12.2" width="2" height="4.2"/>`;
    if (compId === 'UCL') return open +
        `<path d="M6 3.5h12v2.6c0 3.3-2.7 6-6 6s-6-2.7-6-6z"/>` +
        `<path d="M6 4.6H3.2v1.8c0 2 1.4 3.4 3.4 3.6" fill="none" stroke="currentColor" stroke-width="1.5"/>` +
        `<path d="M18 4.6h2.8v1.8c0 2-1.4 3.4-3.4 3.6" fill="none" stroke="currentColor" stroke-width="1.5"/>` +
        stem + base + `</svg>`;
    if (compId === 'UEL') return open +
        `<path d="M8 3.5h8l-1.3 5.6a2.9 2.9 0 0 1-5.4 0z"/>` +
        stem + `<path d="M7.5 20.5h9l-1.2-4h-6.6z"/>` + `</svg>`;
    if (compId === 'UECL') return open +
        `<path d="M4.6 4.5h14.8v1.1c0 2.9-3.3 4.3-7.4 4.3s-7.4-1.4-7.4-4.3z"/>` +
        `<rect x="11" y="10.2" width="2" height="6"/>` + `<path d="M7.5 20.5h9l-1.2-4h-6.6z"/>` + `</svg>`;
    return '';
}

// ---- local helpers (kept off the Europe object so they aren't serialised) ----
function euClub(id) { return (typeof EUROPE_VIRTUAL_MAP !== 'undefined' && EUROPE_VIRTUAL_MAP[id]) || null; }
function euRep(id) { const v = euClub(id); if (v) return v.reputation; const c = Clubs.getClubById(id); return c ? c.reputation : 50; }
function euAssoc(id) { const v = euClub(id); if (v) return v.country; const c = Clubs.getClubById(id); return c ? c.country : '?'; }
function euName(id) { return League.teamName(id); }
function euShuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Rng.next() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

const Europe = {
    COMPS: ['UCL', 'UEL', 'UECL'],

    // ============================================================ build (season start / rollover)
    // standings: { [div]: [clubId ordered 1st..last] } for the nine implemented divisions.
    // cupWinners: { [country]: clubId } domestic cup winner (may be null / lower-division).
    buildEurope(standings, cupWinners, year) {
        const ed = { year, comps: {}, qpools: { UCL: {}, UEL: {}, UECL: {} }, sim: {}, stage: 'qualifying', warnings: [] };
        this.COMPS.forEach(k => ed.comps[k] = this._newComp(k));
        this.COMPS.forEach(k => EUROPE_DATA.qualifying[k].rounds.forEach(r => ed.qpools[k][r.round] = { seeded: [], unseeded: [] }));

        // 1) simulate every pooled domestic league + cup (weighted, once per season). If a pooled
        // country has a real in-game cup result (Liechtenstein's Liechtensteiner Cup, played in the
        // Swiss cups), use that actual winner instead of drawing one.
        for (const [name, pool] of Object.entries(EUROPE_DATA.pools)) {
            if (!pool.clubs.length) continue;
            const order = this._weightedOrder(pool.clubs, c => c.likelihood);
            const cup = (cupWinners && cupWinners[name]) || this._weightedPick(pool.clubs, c => Math.sqrt(Math.max(0.01, c.likelihood)));
            ed.sim[name] = { order, cup };
        }

        // 2) implemented countries -> direct league-phase berths + seeded qualifying entries
        for (const [country, cfg] of Object.entries(EUROPE_DATA.implemented)) {
            const order = (standings && standings[cfg.div]) || [];
            const cupId = (cupWinners && cupWinners[country]) || null;
            const { byTag } = this._tierMap(country, order, cupId);
            (byTag.U || []).forEach(id => ed.comps.UCL.lpEntrants.push(id));
            (byTag.UEL || []).concat(byTag.UELcup || []).forEach(id => ed.comps.UEL.lpEntrants.push(id));
            (byTag.UECL || []).forEach(id => ed.comps.UECL.lpEntrants.push(id));
            (byTag.UCLq || []).forEach(id => ed.qpools.UCL[5].seeded.push(id));
            (byTag.UELq || []).forEach(id => ed.qpools.UEL[5].seeded.push(id));
        }

        // 3) pooled countries -> seeded/unseeded qualifying entries (cup/league clash resolved)
        for (const [name, pool] of Object.entries(EUROPE_DATA.pools)) {
            const sim = ed.sim[name]; if (!sim) continue;
            for (const e of this._resolvePooledEntries(sim, pool.entries)) {
                const bucket = ed.qpools[e.comp][e.round]; if (!bucket) continue;
                (e.seeded ? bucket.seeded : bucket.unseeded).push(e.id);
            }
        }

        if (typeof GameState !== 'undefined' && GameState.league) GameState.league.europe = ed;
        return ed;
    },

    _newComp(key) {
        return {
            key, lpEntrants: [], qual: { rounds: [] },
            pots: null, fixtures: null, schedule: null, table: null, ranked: null,
            mdPlayed: 0, mdResults: [],
            ko: { po: null, r16: null, qf: null, sf: null, final: null, winner: null },
            stage: 'qualifying',
        };
    },

    // Efraimidis-Spirakis weighted sampling without replacement -> full ordering (index 0 = 1st).
    _weightedOrder(clubs, wf) {
        return clubs.map(c => ({ id: c.id, k: Math.pow(Rng.next(), 1 / Math.max(1e-6, wf(c))) }))
            .sort((a, b) => b.k - a.k).map(x => x.id);
    },
    _weightedPick(clubs, wf) {
        let best = null, bk = -1;
        for (const c of clubs) { const k = Math.pow(Rng.next(), 1 / Math.max(1e-6, wf(c))); if (k > bk) { bk = k; best = c.id; } }
        return best;
    },

    // implemented country: finishing order + cup winner -> {byTag, byClub}. The domestic cup winner
    // takes the UEL "cup" slot. Cup-overflow cascade: only if a club that ALREADY qualified via its
    // league place wins the cup does its UEL berth drop down to the next league position.
    // `forDisplay` (live table highlighting): when the cup is undecided the cup slot is left RESERVED
    // for the eventual winner rather than pre-assigned to a league team. Entrant building (default)
    // always fills every slot so the field stays at 36.
    _tierMap(country, order, cupWinnerId, forDisplay) {
        const cfg = EUROPE_DATA.implemented[country];
        const byTag = {}, byClub = {};
        if (!cfg) return { byTag, byClub };
        const slots = cfg.slots, n = slots.length, cupIdx = slots.indexOf('UELcup');
        let cupId = cupWinnerId || null;
        if (cupId && typeof isReserveClub === 'function' && isReserveClub(cupId)) cupId = null; // reserves can't play in Europe
        const cupRank = cupId ? order.indexOf(cupId) : -1;
        const qualified = cupId != null && cupRank >= 0 && cupRank < n - 1;   // an already-qualified club won the cup
        const put = (tag, id) => { if (!id) return; (byTag[tag] = byTag[tag] || []).push(id); byClub[id] = tag; };
        if (cupId && !qualified) {
            let lp = 0;   // eligible cup winner from outside the qualifying places takes the cup slot
            for (let i = 0; i < n; i++) { if (i === cupIdx) put('UELcup', cupId); else put(slots[i], order[lp++]); }
        } else if (qualified) {
            for (let i = 0; i < n; i++) put(slots[i], order[i]);   // cascade: berth drops to the next league place
        } else if (forDisplay) {
            let lp = 0;   // cup not decided -> reserve the cup slot, don't hand it to a league team on assumption
            for (let i = 0; i < n; i++) { if (i === cupIdx) continue; put(slots[i], order[lp++]); }
        } else {
            for (let i = 0; i < n; i++) put(slots[i], order[i]);   // entrants: fill every slot to keep 36
        }
        // 1st place is always the champion — flag it for the darkest highlight
        if (order[0] && byClub[order[0]]) byClub[order[0]] = 'CHAMP';
        return { byTag, byClub, cupReserved: forDisplay && !cupId };
    },

    // pooled country: resolve each entry rule to a club, giving each club at most one slot. Only a
    // cup/league clash is possible (league positions are distinct); the cup berth then drops to the
    // next unclaimed finisher, mirroring the implemented cascade.
    _resolvePooledEntries(sim, entries) {
        const out = [], claimed = new Set();
        for (const comp of this.COMPS) for (const r of entries[comp]) {
            if (r.source === 'cup') continue;
            const id = sim.order[parseInt(r.source.split(':')[1], 10) - 1];
            if (!id) continue;
            claimed.add(id); out.push({ comp, round: r.round, seeded: r.seeded, id });
        }
        for (const comp of this.COMPS) for (const r of entries[comp]) {
            if (r.source !== 'cup') continue;
            let id = sim.cup;
            if (!id || claimed.has(id)) id = sim.order.find(x => !claimed.has(x));
            if (!id) continue;
            claimed.add(id); out.push({ comp, round: r.round, seeded: r.seeded, id });
        }
        return out;
    },

    // ============================================================ weekly step
    step(week) {
        const ed = (typeof GameState !== 'undefined' && GameState.league && GameState.league.europe) || null;
        if (!ed) return;
        try {
            // qualifying (both legs of a round resolve within its single week)
            for (const comp of this.COMPS) for (const rc of EUROPE_DATA.qualifying[comp].rounds) if (rc.week === week) this._playQualRound(ed, comp, rc);

            // league phase
            const lpWeeks = EUROPE_DATA.calendar.leaguePhase, mdIdx = lpWeeks.indexOf(week);
            if (mdIdx >= 0) {
                for (const comp of this.COMPS) if (!ed.comps[comp].pots) this._buildLeaguePhase(ed, comp);
                for (const comp of this.COMPS) this._playMatchday(ed, comp, mdIdx);
                if (mdIdx === lpWeeks.length - 1) { for (const comp of this.COMPS) this._finalizeLeaguePhase(ed, comp); ed.stage = 'knockout'; }
            }

            // knockouts — leg 1 in the first calendar week of each round, leg 2 in the second
            const cal = EUROPE_DATA.calendar;
            if (week === cal.knockoutPO[0]) for (const c of this.COMPS) this._poLeg1(ed, c);
            if (week === cal.knockoutPO[1]) for (const c of this.COMPS) this._koLeg2Round(ed, c, 'po');
            if (week === cal.R16[0]) for (const c of this.COMPS) this._r16Leg1(ed, c);
            if (week === cal.R16[1]) for (const c of this.COMPS) this._koLeg2Round(ed, c, 'r16');
            if (week === cal.QF[0]) for (const c of this.COMPS) this._nextRoundLeg1(ed, c, 'r16', 'qf');
            if (week === cal.QF[1]) for (const c of this.COMPS) this._koLeg2Round(ed, c, 'qf');
            if (week === cal.SF[0]) for (const c of this.COMPS) this._nextRoundLeg1(ed, c, 'qf', 'sf');
            if (week === cal.SF[1]) for (const c of this.COMPS) this._koLeg2Round(ed, c, 'sf');
            if (week === cal.final) { for (const c of this.COMPS) this._playFinal(ed, c); ed.stage = 'done'; }
        } catch (e) {
            this._warn(ed, 'step week ' + week + ': ' + (e && e.message));
            if (typeof console !== 'undefined') console.error('Europe.step error', e);
        }
    },

    _warn(ed, msg) { if (ed && ed.warnings && ed.warnings.length < 40) ed.warnings.push(msg); },

    _playQualRound(ed, comp, rc) {
        const pool = ed.qpools[comp][rc.round];
        const ties = [], byes = [], winners = [], losers = [];
        let seeded = euShuffle(pool.seeded), unseeded = euShuffle(pool.unseeded);
        if (seeded.length === 0) {
            // round 1: unseeded paired among themselves
            while (unseeded.length >= 2) { const a = unseeded.pop(), b = unseeded.pop(); const t = League._twoLeggedTie(a, b, comp); ties.push(t); winners.push(t.winner); losers.push(t.winner === a ? b : a); }
            if (unseeded.length === 1) { winners.push(unseeded[0]); byes.push(unseeded[0]); this._warn(ed, 'bye ' + comp + ' R' + rc.round); }
        } else {
            if (seeded.length !== unseeded.length) this._warn(ed, 'unbalanced ' + comp + ' R' + rc.round + ' S' + seeded.length + '/U' + unseeded.length);
            const n = Math.min(seeded.length, unseeded.length);
            for (let i = 0; i < n; i++) { const s = seeded[i], u = unseeded[i]; const t = League._twoLeggedTie(s, u, comp); t.seededId = s; ties.push(t); winners.push(t.winner); losers.push(t.winner === s ? u : s); }
            // any shortfall -> bye to the highest-reputation leftover seed
            const extra = seeded.slice(n).concat(unseeded.slice(n)).sort((a, b) => euRep(b) - euRep(a));
            if (extra.length) { winners.push(extra[0]); byes.push(extra[0]); this._warn(ed, 'bye ' + comp + ' R' + rc.round + ' ' + euName(extra[0])); for (let i = 1; i < extra.length; i++) losers.push(extra[i]); }
        }
        // advance winners
        const rounds = EUROPE_DATA.qualifying[comp].rounds, idx = rounds.findIndex(r => r.round === rc.round);
        if (idx === rounds.length - 1) winners.forEach(w => ed.comps[comp].lpEntrants.push(w));
        else { const nr = rounds[idx + 1].round; winners.forEach(w => ed.qpools[comp][nr].unseeded.push(w)); }
        // drop / eliminate losers
        if (rc.losersTo) {
            if (rc.losersTo.phase === 'league') losers.forEach(l => ed.comps[rc.losersTo.comp].lpEntrants.push(l));
            else { const tp = ed.qpools[rc.losersTo.comp][rc.losersTo.round]; losers.forEach(l => tp.seeded.push(l)); }
        }
        ed.comps[comp].qual.rounds.push({ round: rc.round, week: rc.week, ties, byes });
    },

    // ---- league phase ----
    _buildLeaguePhase(ed, comp) {
        const c = ed.comps[comp], ids = c.lpEntrants;
        if (ids.length !== EUROPE_DATA.leaguePhase.size) this._warn(ed, comp + ' league phase has ' + ids.length + ' (want 36)');
        const pots = this._buildPots(ids); this._repairPots(ed, comp, pots);
        const draw = this._drawLeaguePhase(ed, comp, ids, pots);
        c.pots = pots; c.fixtures = draw.fixtures; c.schedule = draw.schedule;
        c.table = ids.map(id => ({ clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GFa: 0, Wa: 0, Pts: 0 }));
        c.stage = 'league';
    },
    _buildPots(ids) {
        const sorted = ids.slice().sort((a, b) => euRep(b) - euRep(a) || Rng.next() - 0.5);
        const pots = [[], [], [], []];
        sorted.forEach((id, i) => pots[Math.min(3, Math.floor(i / 9))].push(id));
        return pots;
    },
    _repairPots(ed, comp, pots) {
        const cap = EUROPE_DATA.leaguePhase.maxPerAssocPerPot;
        for (let p = 0; p < pots.length; p++) {
            let guard = 0;
            while (guard++ < 300) {
                const cnt = {}; pots[p].forEach(id => { const a = euAssoc(id); cnt[a] = (cnt[a] || 0) + 1; });
                const over = Object.entries(cnt).find(([, n]) => n > cap);
                if (!over) break;
                const assoc = over[0];
                if (p === pots.length - 1) { this._warn(ed, comp + ' pot' + (p + 1) + ' relaxed: ' + over[1] + ' from ' + assoc); break; }
                const out = pots[p].filter(id => euAssoc(id) === assoc).sort((a, b) => euRep(a) - euRep(b))[0];
                const next = pots[p + 1];
                const cand = next.filter(id => euAssoc(id) !== assoc).sort((a, b) => euRep(b) - euRep(a))
                    .find(id => next.filter(x => euAssoc(x) === assoc && x !== id).length + 1 <= cap);
                if (!cand) { this._warn(ed, comp + ' pot' + (p + 1) + ' no legal swap for ' + assoc); break; }
                pots[p][pots[p].indexOf(out)] = cand; next[next.indexOf(cand)] = out;
            }
        }
    },
    // swiss draw: each club plays 2 from every pot (1 home, 1 away) -> 8 games / 4 home / 4 away,
    // no same-association opponents, <=2 from any one other association. The fixtures must ALSO admit a
    // perfect 8-matchday schedule (every club plays exactly once each matchday), so we keep redrawing
    // until we find a draw that 8-colours. The same-association rule is relaxed only if no schedulable
    // draw can be found with it on (per design: correctness of "same number of games" comes first).
    _drawLeaguePhase(ed, comp, ids, pots) {
        const potOf = {}; pots.forEach((p, pi) => p.forEach(id => potOf[id] = pi));
        const assoc = {}; ids.forEach(id => assoc[id] = euAssoc(id));
        for (const relaxed of [false, true]) {
            const cap = relaxed ? 400 : 1200;
            for (let attempt = 0; attempt < cap; attempt++) {
                const d = this._tryDraw(ids, pots, potOf, assoc, relaxed);
                if (!d) continue;
                const schedule = this._colorSchedule(ids, d.matches);
                if (schedule) {
                    if (relaxed) this._warn(ed, comp + ' relaxed the same-association rule to build a valid 8-matchday schedule');
                    return { fixtures: d.fixtures, matches: d.matches, schedule };
                }
            }
        }
        this._warn(ed, comp + ' could not build a schedulable league phase');
        return { fixtures: Object.fromEntries(ids.map(i => [i, []])), matches: [], schedule: Array.from({ length: 8 }, () => []) };
    },
    // 8-edge-colour the 8-regular fixture graph -> 8 matchdays, each a perfect matching (a valid
    // colouring means every club uses each colour exactly once, so every matchday is complete).
    // Backtracking with minimum-remaining-values; returns null if this draw isn't 8-colourable.
    _colorSchedule(ids, matches) {
        const K = 8, full = (1 << K) - 1, m = matches.length;
        const used = {}; ids.forEach(id => used[id] = 0);   // bitmask of matchdays already used by a club
        const assign = new Array(m).fill(-1);
        const popcount = x => { let n = 0; while (x) { x &= x - 1; n++; } return n; };
        let steps = 0; const CAP = 60000;
        const solve = () => {
            if (++steps > CAP) return false;
            let best = -1, bestCnt = 99, bestMask = 0;
            for (let i = 0; i < m; i++) {
                if (assign[i] !== -1) continue;
                const mask = (~(used[matches[i][0]] | used[matches[i][1]])) & full;
                const cnt = popcount(mask);
                if (cnt < bestCnt) { bestCnt = cnt; best = i; bestMask = mask; if (cnt <= 1) break; }
            }
            if (best === -1) return true;
            if (bestCnt === 0) return false;
            const [h, a] = matches[best];
            const cols = []; for (let r = 0; r < K; r++) if (bestMask & (1 << r)) cols.push(r);
            for (let i = cols.length - 1; i > 0; i--) { const j = Math.floor(Rng.next() * (i + 1));[cols[i], cols[j]] = [cols[j], cols[i]]; }
            for (const r of cols) {
                assign[best] = r; used[h] |= (1 << r); used[a] |= (1 << r);
                if (solve()) return true;
                assign[best] = -1; used[h] &= ~(1 << r); used[a] &= ~(1 << r);
            }
            return false;
        };
        if (!solve()) return null;
        const mds = Array.from({ length: K }, () => []);
        matches.forEach((mm, i) => mds[assign[i]].push(mm));
        return mds;
    },
    // Each home slot (club X needs a home opponent in pot p) is filled by a club Y in pot p that still
    // needs an away game vs X's pot. Fail-first (minimum-remaining-values): at every step fill the
    // slot with the fewest legal candidates, which all but eliminates dead-ends; a few restarts mop up.
    _tryDraw(ids, pots, potOf, assoc, relaxed) {
        const awayNeed = {}, opp = {}, ac = {};
        ids.forEach(id => { awayNeed[id] = [1, 1, 1, 1]; opp[id] = new Set(); ac[id] = {}; });
        const slots = [];
        ids.forEach(id => { for (let p = 0; p < 4; p++) slots.push({ X: id, p, done: false, match: null }); });
        const candFor = sl => {
            const X = sl.X, qx = potOf[X];
            return pots[sl.p].filter(Y => Y !== X && awayNeed[Y][qx] > 0 && !opp[X].has(Y) && assoc[Y] !== assoc[X]
                && (relaxed || ((ac[X][assoc[Y]] || 0) < 2 && (ac[Y][assoc[X]] || 0) < 2)));
        };
        let remaining = slots.length;
        while (remaining > 0) {
            let best = null, bestC = null, bestN = Infinity;
            for (const sl of slots) {
                if (sl.done) continue;
                const c = candFor(sl);
                if (c.length < bestN) { bestN = c.length; best = sl; bestC = c; if (bestN === 0) break; }
            }
            if (bestN === 0) return null;   // dead end -> restart
            const X = best.X, qx = potOf[X], Y = bestC[Math.floor(Rng.next() * bestC.length)];
            best.done = true; best.match = [X, Y]; remaining--;
            awayNeed[Y][qx] = 0; opp[X].add(Y); opp[Y].add(X);
            ac[X][assoc[Y]] = (ac[X][assoc[Y]] || 0) + 1; ac[Y][assoc[X]] = (ac[Y][assoc[X]] || 0) + 1;
        }
        const matches = slots.map(s => s.match);
        const fixtures = {}; ids.forEach(id => fixtures[id] = []);
        matches.forEach(([h, a]) => { fixtures[h].push({ opp: a, home: true, pot: potOf[a] }); fixtures[a].push({ opp: h, home: false, pot: potOf[h] }); });
        return { matches, fixtures };
    },
    _playMatchday(ed, comp, mdIdx) {
        const c = ed.comps[comp]; if (!c.schedule) return;
        const md = c.schedule[mdIdx] || [], results = [];
        for (const [h, a] of md) { const r = League.playMatch(h, a, comp, true); this._recordLP(c, h, a, r.hg, r.ag); results.push({ h, a, hg: r.hg, ag: r.ag }); }
        c.mdResults.push({ md: mdIdx + 1, matches: results }); c.mdPlayed = mdIdx + 1;
    },
    _recordLP(c, h, a, hg, ag) {
        const H = c.table.find(r => r.clubId === h), A = c.table.find(r => r.clubId === a);
        H.P++; A.P++; H.GF += hg; H.GA += ag; A.GF += ag; A.GA += hg; A.GFa += ag;
        if (hg > ag) { H.W++; A.L++; H.Pts += 3; } else if (ag > hg) { A.W++; A.Wa++; H.L++; A.Pts += 3; } else { H.D++; A.D++; H.Pts++; A.Pts++; }
    },
    _finalizeLeaguePhase(ed, comp) {
        const c = ed.comps[comp];
        c.ranked = c.table.slice().sort((a, b) =>
            b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || b.GFa - a.GFa || b.W - a.W || b.Wa - a.Wa || euRep(b.clubId) - euRep(a.clubId)
        ).map(r => r.clubId);
        c.stage = 'knockout';
    },

    // ---- knockouts ----
    // Each two-legged tie is split across its two calendar weeks: leg 1 (lower seed at home) in the
    // first week, leg 2 (higher seed at home) + the aggregate decision in the second. A round object
    // is { ties:[...], winners: null-until-leg2 }; a tie holds leg1 (always) and leg2 (null until the
    // second week). The final is a single neutral match.
    _seedRank(c, id) { return c.ranked ? c.ranked.indexOf(id) : 0; }, // lower = better league-phase finish
    _koPair(c, x, y) { return this._seedRank(c, x) <= this._seedRank(c, y) ? [x, y] : [y, x]; }, // [higher, lower]
    _koLeg1(higher, lower, comp) {
        const l1 = League.playMatch(lower, higher, comp, true);   // leg 1 at the lower seed's ground
        return { a: higher, b: lower, seededId: higher, leg1: { h: lower, a: higher, hg: l1.hg, ag: l1.ag }, leg2: null, aggA: null, aggB: null, winner: null, pens: null };
    },
    _koLeg2(t, comp) {
        const l2 = League.playMatch(t.a, t.b, comp, true);        // leg 2 at the higher seed's ground
        t.leg2 = { h: t.a, a: t.b, hg: l2.hg, ag: l2.ag };
        t.aggA = t.leg1.ag + l2.hg;   // higher seed: away in leg 1 + home in leg 2
        t.aggB = t.leg1.hg + l2.ag;   // lower seed
        if (t.aggA > t.aggB) t.winner = t.a;
        else if (t.aggB > t.aggA) t.winner = t.b;
        else { const sA = League.clubStrength(t.a), sB = League.clubStrength(t.b); t.winner = (Rng.next() < sA / (sA + sB)) ? t.a : t.b; const [w, l] = League._penScore(); t.pens = t.winner === t.a ? { winner: t.winner, a: w, b: l } : { winner: t.winner, a: l, b: w }; }
        return t;
    },
    _koLeg2Round(ed, comp, key) {   // second week of a round: play every leg 2, set winners
        const c = ed.comps[comp], r = c.ko[key]; if (!r || r.winners) return;
        r.ties.forEach(t => { if (!t.leg2) this._koLeg2(t, comp); });
        r.winners = r.ties.map(t => t.winner);
    },
    _poLeg1(ed, comp) {   // knockout play-off, leg 1: fixed ladder 9v24, 10v23, ... 16v17
        const c = ed.comps[comp]; if (!c.ranked || c.ranked.length < 24 || c.ko.po) return;
        const ties = [];
        for (let i = 0; i < 8; i++) ties.push(this._koLeg1(c.ranked[8 + i], c.ranked[23 - i], comp)); // 9th..16th (higher) host leg 2
        c.ko.po = { ties, winners: null };
    },
    _r16Leg1(ed, comp) {   // Round of 16, leg 1: top-8 seeded, play-off winners drawn to them at random
        const c = ed.comps[comp]; if (!c.ranked || !c.ko.po || !c.ko.po.winners || c.ko.r16) return;
        const top8 = c.ranked.slice(0, 8);
        const pw = euShuffle(c.ko.po.winners.slice());   // random draw of play-off winners onto the seeds
        const pairs = []; for (let i = 0; i < 8; i++) pairs.push([top8[i], pw[i]]);   // seed i vs a random play-off winner
        const bracket = [0, 7, 3, 5, 1, 4, 2, 6];   // fixed bracket from here: keeps seeds 1 & 2 apart until the final
        const ties = bracket.map(k => this._koLeg1(pairs[k][0], pairs[k][1], comp));   // the seed (top 8) hosts leg 2
        c.ko.r16 = { ties, winners: null };
    },
    _nextRoundLeg1(ed, comp, prevKey, key) {   // QF/SF, leg 1: pair the previous round's winners in bracket order
        const c = ed.comps[comp], prev = c.ko[prevKey]; if (!prev || !prev.winners || c.ko[key]) return;
        const w = prev.winners, ties = [];
        for (let i = 0; i < w.length; i += 2) { const [hi, lo] = this._koPair(c, w[i], w[i + 1]); ties.push(this._koLeg1(hi, lo, comp)); }
        c.ko[key] = { ties, winners: null };
    },
    _playFinal(ed, comp) {
        const c = ed.comps[comp]; if (!c.ko.sf || !c.ko.sf.winners || c.ko.sf.winners.length < 2 || c.ko.final) return;
        const [a, b] = c.ko.sf.winners;
        const r = League.playMatch(a, b, comp, false, true);   // neutral venue, no home edge; a final fields the best XI
        c.ko.final = { a, b, ag: r.hg, bg: r.ag, winner: r.winner };
        // level after 90': extra time (which may decide it), else penalties. Same as a domestic final.
        if (r.hg === r.ag) {
            const et = League._extraTime(a, b);
            if (et.hg !== et.ag) {
                c.ko.final.ag += et.hg; c.ko.final.bg += et.ag; c.ko.final.et = true;
                c.ko.final.winner = et.hg > et.ag ? a : b;
            } else { const [w, l] = League._penScore(); c.ko.final.pens = r.winner === a ? { h: w, a: l } : { h: l, a: w }; }
        }
        c.ko.winner = c.ko.final.winner;
        // a European final the agent may be invited to attend (see js/attend.js). Clock runs to 120
        // whenever it went past 90 (extra time and/or pens).
        if (typeof Attend !== 'undefined') {
            const m = Attend.consider('europe-final', comp, a, b, r, { pens: c.ko.final.pens, et: c.ko.final.et, winner: c.ko.final.winner, minutes: (c.ko.final.pens || c.ko.final.et) ? 120 : 90, score: { hg: c.ko.final.ag, ag: c.ko.final.bg }, regScore: { hg: r.hg, ag: r.ag } });
            if (m) c.ko.final._attendId = m.id;   // hide this final's score in the Europe view until watched
        }
    },

    // ============================================================ helpers for UI / capture / tests
    // clubId -> tag for the live top-division table of an implemented country (drives §5 highlight).
    // forDisplay=true so an undecided domestic cup leaves its UEL berth reserved (not pre-assigned).
    highlightMap(country, order, cupWinnerId) { return this._tierMap(country, order, cupWinnerId, true).byClub; },
    // whether a top-flight table has a UEL berth still reserved for the (undecided) domestic cup winner
    cupBerthReserved(country, order, cupWinnerId) { return !!this._tierMap(country, order, cupWinnerId, true).cupReserved; },
    assocOf(id) { return euAssoc(id); },   // association (country) of a real or virtual club — for the UI
    repOf(id) { return euRep(id); },

    // furthest stage a club reached in a competition, as an index into STAGE_LABELS (higher = further)
    STAGE_LABELS: ['Qualifying', 'League phase', 'Knockout play-off', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final', 'Winner'],
    // { compId: { clubId: stageIndex } } for a FINISHED edition — the best result each club achieved
    bestStages(edition) {
        const out = {};
        if (!edition || !edition.comps) return out;
        for (const k of ['UCL', 'UEL', 'UECL']) {
            const c = edition.comps[k]; if (!c) continue;
            const m = {};
            const set = (id, s) => { if (id && (m[id] == null || s > m[id])) m[id] = s; };
            if (c.qual && c.qual.rounds) c.qual.rounds.forEach(r => (r.ties || []).forEach(t => { set(t.a, 0); set(t.b, 0); }));
            (c.table || []).forEach(r => set(r.clubId, 1));   // everyone in the league phase reached the "group stage"
            if (c.ko) {
                if (c.ko.po) c.ko.po.ties.forEach(t => { set(t.a, 2); set(t.b, 2); });
                if (c.ko.r16) c.ko.r16.ties.forEach(t => { set(t.a, 3); set(t.b, 3); });
                if (c.ko.qf) c.ko.qf.ties.forEach(t => { set(t.a, 4); set(t.b, 4); });
                if (c.ko.sf) c.ko.sf.ties.forEach(t => { set(t.a, 5); set(t.b, 5); });
                if (c.ko.final) { set(c.ko.final.a, 6); set(c.ko.final.b, 6); if (c.ko.final.winner) set(c.ko.final.winner, 7); }
            }
            out[k] = m;
        }
        return out;
    },

    // read the just-finished season's standings + cup winners (call before setupSeason wipes them)
    captureStandings() {
        const standings = {}, cups = {};
        const L = (typeof GameState !== 'undefined' && GameState.league) || null;
        for (const [country, cfg] of Object.entries(EUROPE_DATA.implemented)) {
            const div = cfg.div;
            const hasTable = L && L.tables && L.tables[div] && L.tables[div].some(r => r.P > 0);
            standings[div] = hasTable ? League.sortedTable(div).map(r => r.clubId)
                : Clubs.getClubsByDivision(div).slice().sort((a, b) => b.reputation - a.reputation).map(c => c.id);
            const cupObj = L && L[cfg.cupKey];
            cups[country] = (cupObj && cupObj.winner) || null;
        }
        // Liechtenstein's UEL entrant is the actual Liechtensteiner Cup (lichcup) winner, whoever it is
        if (L && L.lichcup && L.lichcup.winner) cups.Liechtenstein = L.lichcup.winner;
        return { standings, cups };
    },
    // season 1 (fresh game): synthesise plausible standings from reputation + a weighted cup winner
    syntheticStandings() {
        const standings = {}, cups = {};
        for (const [country, cfg] of Object.entries(EUROPE_DATA.implemented)) {
            const clubs = Clubs.getClubsByDivision(cfg.div).slice()
                .sort((a, b) => (b.reputation + (Rng.next() * 8 - 4)) - (a.reputation + (Rng.next() * 8 - 4)));
            standings[cfg.div] = clubs.map(c => c.id);
            cups[country] = this._weightedPick(clubs.slice(0, 12).map(c => ({ id: c.id, r: c.reputation })), c => Math.sqrt(c.r));
        }
        return { standings, cups };
    },

    validate(ed) {
        ed = ed || (GameState.league && GameState.league.europe);
        const problems = [];
        if (!ed) return ['no europe edition'];
        const seen = new Map();
        for (const comp of this.COMPS) {
            const c = ed.comps[comp];
            if (c.lpEntrants.length !== 36) problems.push(`${comp} league phase = ${c.lpEntrants.length} (want 36)`);
            c.lpEntrants.forEach(id => { if (seen.has(id)) problems.push(`${euName(id)} in both ${seen.get(id)} & ${comp}`); else seen.set(id, comp); });
            if (c.pots) {
                if (c.pots.length !== 4 || c.pots.some(p => p.length !== 9)) problems.push(`${comp} pots malformed`);
                c.pots.forEach((p, pi) => { const cnt = {}; p.forEach(id => { const a = euAssoc(id); cnt[a] = (cnt[a] || 0) + 1; }); Object.entries(cnt).forEach(([a, n]) => { if (n > 3) problems.push(`${comp} pot${pi + 1}: ${n} from ${a}`); }); });
            }
            if (c.fixtures) for (const id of c.lpEntrants) {
                const fx = c.fixtures[id] || [];
                if (fx.length !== 8) { problems.push(`${comp} ${euName(id)} ${fx.length} fixtures`); continue; }
                if (fx.filter(f => f.home).length !== 4) problems.push(`${comp} ${euName(id)} not 4 home`);
                const perPot = [0, 0, 0, 0]; fx.forEach(f => perPot[f.pot]++); if (perPot.some(x => x !== 2)) problems.push(`${comp} ${euName(id)} pots ${perPot.join(',')}`);
                const oa = {}; fx.forEach(f => { const a = euAssoc(f.opp); oa[a] = (oa[a] || 0) + 1; });
                if (Object.entries(oa).some(([a, n]) => a === euAssoc(id) || n > 2)) problems.push(`${comp} ${euName(id)} assoc-opp violation`);
            }
        }
        return problems;
    },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Europe, EUROPE_VIRTUAL_MAP, EUROPE_TAG_INFO };
