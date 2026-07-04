// ============================================================
//  Competitions, schedules, standings, match simulation, cups,
//  promotion play-offs and promotion/relegation
// ============================================================
const COMPETITIONS = {
    ERE: { name: 'Eredivisie', short: 'ERE', type: 'league' },
    EED: { name: 'Eerste Divisie', short: 'EED', type: 'league' },
    TWD: { name: 'Tweede Divisie', short: 'TWD', type: 'league' },
    DRD: { name: 'Derde Divisie', short: 'DRD', type: 'league' },
    PREM: { name: 'Premier League', short: 'PL', type: 'league' },
    CHAMP: { name: 'Championship', short: 'CHA', type: 'league' },
    LEAGUE1: { name: 'League One', short: 'L1', type: 'league' },
    LEAGUE2: { name: 'League Two', short: 'L2', type: 'league' },
    Natleague: { name: 'National League', short: 'NL', type: 'league' },
    BUNDES: { name: 'Bundesliga', short: 'BL', type: 'league' },
    '2BUNDES': { name: '2. Bundesliga', short: '2.BL', type: 'league' },
    '3LIGA': { name: '3. Liga', short: '3.Liga', type: 'league' },
    REGIONAL1: { name: '1. Regionalliga', short: 'RL1', type: 'league' },
    REGIONAL2: { name: '2. Regionalliga', short: 'RL2', type: 'league' },
    REGIONAL3: { name: '3. Regionalliga', short: 'RL3', type: 'league' },
    DFB: { name: 'DFB Pokal', short: 'DFB', type: 'cup' },
    LPOKAL: { name: 'Landespokal', short: 'LP', type: 'cup' },
    GRELEG: { name: 'Relegation', short: 'Releg', type: 'playoff' },
    LaLiga: { name: 'La Liga', short: 'LaLiga', type: 'league' },
    LaLiga2: { name: 'La Liga 2', short: 'LaLiga2', type: 'league' },
    PrimeraSup: { name: 'Primera Superior', short: 'P.Sup', type: 'league' },
    PrimeraInf: { name: 'Primera Inferior', short: 'P.Inf', type: 'league' },
    Segunda: { name: 'Segunda Federación', short: 'Segunda', type: 'league' },
    CDR: { name: 'Copa del Rey', short: 'Copa', type: 'cup' },
    CFED: { name: 'Copa Federación', short: 'C.Fed', type: 'cup' },
    SuperLeagueCH: { name: 'Super League', short: 'SL', type: 'league' },
    ChallengeLeague: { name: 'Challenge League', short: 'CL', type: 'league' },
    PromotionLeague: { name: 'Promotion League', short: 'PL', type: 'league' },
    '1.LigaCH': { name: '1. Liga', short: '1.Liga', type: 'league' },
    '2.LigaCH': { name: '2. Liga', short: '2.Liga', type: 'league' },
    SCHWCUP: { name: 'Schweizer Cup', short: 'Schw. Cup', type: 'cup' },
    CUPABASS: { name: 'Cupa Bass', short: 'Cupa Bass', type: 'cup' },
    LICHCUP: { name: 'Liechtensteiner Cup', short: 'Lie. Cup', type: 'cup' },
    CHBAR: { name: 'Barrage', short: 'Barrage', type: 'playoff' },
    BEKER: { name: 'KNVB Beker', short: 'Beker', type: 'cup' },
    KBEK: { name: 'De kleine Beker', short: 'kl. Beker', type: 'cup' },
    FACUP: { name: 'FA Cup', short: 'FA Cup', type: 'cup' },
    LLC: { name: 'Lower Leagues Cup', short: 'LLC', type: 'cup' },
    PO: { name: 'Promotion Play-off', short: 'PO', type: 'playoff' },
    UCL: { name: 'Champions League', short: 'UCL', type: 'cont' },
    JCS: { name: 'Johan Cruijff Schaal', short: 'JCS', type: 'super' },
    U21: { name: 'U21 League', short: 'U21', type: 'youth', youth: true }
};
function compName(id) { return COMPETITIONS[id] ? COMPETITIONS[id].name : (Clubs.DIV_NAMES && Clubs.DIV_NAMES[id]) || id; }

const DIV_ORDER = ['ERE', 'EED', 'TWD', 'DRD'];
const DIV_TIER = { ERE: 1, EED: 2, TWD: 3, DRD: 4 };
// every country's league ladder, top tier first
const COUNTRY_DIVS = { Netherlands: ['ERE', 'EED', 'TWD', 'DRD'], England: ['PREM', 'CHAMP', 'LEAGUE1', 'LEAGUE2', 'Natleague'], Germany: ['BUNDES', '2BUNDES', '3LIGA', 'REGIONAL1', 'REGIONAL2', 'REGIONAL3'], Spain: ['LaLiga', 'LaLiga2', 'PrimeraSup', 'PrimeraInf', 'Segunda'], Switzerland: ['SuperLeagueCH', 'ChallengeLeague', 'PromotionLeague', '1.LigaCH', '2.LigaCH'] };
const ALL_LEAGUE_DIVS = Object.values(COUNTRY_DIVS).reduce((a, b) => a.concat(b), []);
// cups shown per country in the Leagues tab (extend this when adding more countries)
const COUNTRY_CUPS = { Netherlands: [['beker', 'KNVB Beker'], ['kbek', 'kleine Beker']], England: [['facup', 'FA Cup'], ['llc', 'Lower Leagues Cup']], Germany: [['dfb', 'DFB Pokal'], ['lpokal', 'Landespokal']], Spain: [['cdr', 'Copa del Rey'], ['cfed', 'Copa Federación']], Switzerland: [['schwcup', 'Schweizer Cup'], ['cupabass', 'Cupa Bass'], ['lichcup', 'Liechtensteiner Cup']] };
function divCountry(div) { for (const [c, ds] of Object.entries(COUNTRY_DIVS)) if (ds.includes(div)) return c; return 'Netherlands'; }

// 12 non-league "virtual" clubs that only ever appear in the FA Cup (no squads, no transfers)
const FACUP_VIRTUAL = [
    { id: 'v_hashtag', name: 'Hashtag United', reputation: 20 },
    { id: 'v_truro', name: 'Truro City', reputation: 21 },
    { id: 'v_fylde', name: 'Fylde', reputation: 21 },
    { id: 'v_kidderminster', name: 'Kidderminster', reputation: 21 },
    { id: 'v_macclesfield', name: 'Macclesfield', reputation: 20 },
    { id: 'v_hemel', name: 'Hemel Hempstead', reputation: 20 },
    { id: 'v_maidenhead', name: 'Maidenhead United', reputation: 21 },
    { id: 'v_ebbsfleet', name: 'Ebbsfleet', reputation: 21 },
    { id: 'v_slough', name: 'Slough', reputation: 20 },
    { id: 'v_chesham', name: 'Chesham', reputation: 20 },
    { id: 'v_salisbury', name: 'Salisbury', reputation: 20 },
    { id: 'v_dagenham', name: 'Dagenham & Redbridge', reputation: 21 },
];
const FACUP_VIRTUAL_MAP = FACUP_VIRTUAL.reduce((m, c) => { m[c.id] = c; return m; }, {});

// 13 non-league Swiss "virtual" clubs (+ 2 Liechtenstein amateur sides) that stand in for reserve/U21
// teams and Vaduz/Eschen-Mauren in the Schweizer Cup, whenever those clubs draw a fixture there
const SWISSCUP_VIRTUAL = [
    { id: 'vch_pully', name: 'Pully Football', reputation: 15 },
    { id: 'vch_terresainte', name: 'US Terre Sainte', reputation: 15 },
    { id: 'vch_italienge', name: 'CS Italien GE', reputation: 15 },
    { id: 'vch_brunnen', name: 'FC Brunnen', reputation: 15 },
    { id: 'vch_rotkreuz', name: 'FC Rotkreuz', reputation: 15 },
    { id: 'vch_vedeggio', name: 'Vedeggio Calcio', reputation: 15 },
    { id: 'vch_regensdorf', name: 'FC Regensdorf', reputation: 15 },
    { id: 'vch_interlaken', name: 'FC Interlaken', reputation: 15 },
    { id: 'vch_zurichcity', name: 'Zürich City SC', reputation: 15 },
    { id: 'vch_rebstein', name: 'FC Rebstein', reputation: 15 },
    { id: 'vch_liestal', name: 'FC Liestal', reputation: 15 },
    { id: 'vch_schaffhausensv', name: 'SV Schaffhausen', reputation: 15 },
    { id: 'vch_wiesendangen', name: 'FC Wiesendangen', reputation: 15 },
];
const SWISSCUP_VIRTUAL_MAP = SWISSCUP_VIRTUAL.reduce((m, c) => { m[c.id] = c; return m; }, {});

// Liechtenstein amateur sides that only ever appear in the Liechtensteiner Cup, alongside Vaduz and
// Eschen/Mauren themselves (who otherwise play out their real season in the Swiss league pyramid)
const LICHCUP_VIRTUAL = [
    { id: 'vli_triesen', name: 'FC Triesen', reputation: 10 },
    { id: 'vli_balzers', name: 'FC Balzers', reputation: 10 },
    { id: 'vli_triesenberg', name: 'FC Triesenberg', reputation: 10 },
    { id: 'vli_ruggell', name: 'FC Ruggell', reputation: 10 },
    { id: 'vli_schaan', name: 'FC Schaan', reputation: 10 },
    { id: 'vli_schellenberg', name: 'FC Schellenberg', reputation: 5 },
];
const LICHCUP_VIRTUAL_MAP = LICHCUP_VIRTUAL.reduce((m, c) => { m[c.id] = c; return m; }, {});
function findVirtualClub(id) { return FACUP_VIRTUAL_MAP[id] || SWISSCUP_VIRTUAL_MAP[id] || LICHCUP_VIRTUAL_MAP[id] || null; }

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
    // Swiss Super League / Challenge League: every pair meets 4 times a season, not 2
    quadRoundRobin(ids) { return this.roundRobin(ids).concat(this.roundRobin(ids)); },
    shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

    setupSeason() {
        const tables = {}, schedule = {}, mdIndex = {};
        const QUAD = new Set(['SuperLeagueCH', 'ChallengeLeague']);
        ALL_LEAGUE_DIVS.forEach(div => {
            const ids = Clubs.getClubsByDivision(div).map(c => c.id);
            schedule[div] = QUAD.has(div) ? this.quadRoundRobin(ids) : this.roundRobin(ids);
            mdIndex[div] = 0;
            tables[div] = ids.map(id => ({ clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }));
        });
        GameState.league = {
            tables, schedule, mdIndex,
            beker: this._buildBeker(),
            kbek: this._buildKleine(),
            facup: this._buildFACup(),
            llc: this._buildLLC(),
            dfb: this._buildDFB(),
            lpokal: this._buildLandespokal(),
            cdr: this._buildSpanishCup(['LaLiga'], ['LaLiga2', 'PrimeraSup']),
            cfed: this._buildSpanishCup(['PrimeraSup'], ['PrimeraInf', 'Segunda']),
            schwcup: this._buildSchweizerCup(),
            cupabass: this._buildCupaBass(),
            lichcup: this._buildLichCup(),
            playoffs: { EED: null, TWD: null, DRD: null, CHAMP: null, LEAGUE1: null, LEAGUE2: null, Natleague: null, LaLiga2: null, PrimeraSup: null, PrimeraInf: null, Segunda: null, '1.LigaCH': null, '2.LigaCH': null, _done: false },
            germanReleg: null,
            swissBarrage: null,
            prorel: null,
            champions: {},
            finished: false
        };
    },

    // ---------------- KNVB Beker ----------------
    _buildBeker() {
        const lower = Clubs.allClubs.filter(c => c.country === 'Netherlands' && c.tier >= 2 && c.tier <= 4).map(c => c.id);
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
    // ---------------- FA Cup (England) ----------------
    _buildFACup() {
        const eng = Clubs.getClubsByCountry('England').map(c => c.id);
        const all = eng.concat(FACUP_VIRTUAL.map(v => v.id));   // 116 + 12 = 128
        return { remaining: this.shuffle(all), results: [], winner: null };
    },
    _facupRoundName(week) {
        return ({ 4: 'First round', 7: 'Second round', 15: 'Round of 16', 26: 'Round of 8', 32: 'Quarter-finals', 38: 'Semi-finals', 47: 'Final' })[week] || 'Round';
    },
    facupStep(week) {
        const F = GameState.league.facup; if (!F || F.winner) return;
        const pairs = this._pairUp(this.shuffle(F.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const r = this.playMatch(h, a, 'FACUP', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        F.remaining = winners;
        F.results.push({ week, round: this._facupRoundName(week), ties });
        if (week === 47 || F.remaining.length <= 1) F.winner = F.remaining[0];
    },

    // ---------------- Lower Leagues Cup (England: National League..Championship) ----------------
    _buildLLC() {
        const pool = this.shuffle(
            ['CHAMP', 'LEAGUE1', 'LEAGUE2', 'Natleague'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), [])
        ); // 96 teams
        const groups = [];
        for (let g = 0; g < 32 && pool.length >= 3; g++) {
            const teams = [pool.pop(), pool.pop(), pool.pop()];
            groups.push({
                teams,
                table: teams.map(id => ({ clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0, cards: 0 })),
                fixtures: [[0, 1], [0, 2], [1, 2]],
                md: 0
            });
        }
        return { groups, results: [], remaining: [], groupDone: false, winner: null };
    },
    _llcPlayFixture(grp) {
        if (grp.md >= grp.fixtures.length) return;
        const [i, j] = grp.fixtures[grp.md];
        const h = grp.teams[i], a = grp.teams[j];
        const r = this.playMatch(h, a, 'LLC', true);
        const rh = grp.table.find(x => x.clubId === h), ra = grp.table.find(x => x.clubId === a);
        rh.P++; ra.P++; rh.GF += r.hg; rh.GA += r.ag; ra.GF += r.ag; ra.GA += r.hg;
        if (r.hg > r.ag) { rh.W++; ra.L++; rh.Pts += 3; } else if (r.hg < r.ag) { ra.W++; rh.L++; ra.Pts += 3; } else { rh.D++; ra.D++; rh.Pts++; ra.Pts++; }
        rh.cards += Math.floor(Math.random() * 4); ra.cards += Math.floor(Math.random() * 4);
        grp.md++;
    },
    llcGroupStep(week) {
        const C = GameState.league.llc; if (!C) return;
        if (week === 4) { C.groups.forEach(grp => { this._llcPlayFixture(grp); this._llcPlayFixture(grp); }); }   // two of the three group games
        else if (week === 7) {
            C.groups.forEach(grp => this._llcPlayFixture(grp));                                                  // final group game
            C.remaining = this.shuffle(C.groups.map(grp => this._kSort(grp.table)[0].clubId));                   // 32 group winners -> R32
            C.groupDone = true;
        }
    },
    _llcRoundName(week) { return ({ 15: 'Round of 32', 26: 'Round of 16', 32: 'Quarter-finals', 38: 'Semi-finals', 46: 'Final' })[week] || 'Round'; },
    llcKOStep(week) {
        const C = GameState.league.llc; if (!C || C.winner || !C.groupDone) return;
        const pairs = this._pairUp(this.shuffle(C.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); return; }
            const r = this.playMatch(h, a, 'LLC', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._llcRoundName(week), ties });
        if (week === 46 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },
    clubPosition(clubId) {
        const club = Clubs.getClubById(clubId);
        if (!club || !GameState.league || !GameState.league.tables) return null;
        const div = club.division;
        const T = GameState.league.tables[div];
        if (!T || !T.length) return null;
        const sorted = [...T].sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF);
        const idx = sorted.findIndex(r => r.clubId === clubId);
        if (idx < 0) return null;
        return { pos: idx + 1, total: sorted.length, div, divName: (COMPETITIONS[div] || {}).name || div, pts: sorted[idx].Pts, played: sorted[idx].P };
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
        // always promote exactly 3 (auto + play-off winner, topped up by league order) so promotions match relegations and sizes never drift
        const promoted = (s, pw, ordered) => {
            const out = [...s.green];
            const w = (pw && s.blue.includes(pw)) ? pw : s.blue[0];
            if (w && !out.includes(w)) out.push(w);
            for (const id of ordered) { if (out.length >= 3) break; if (!out.includes(id)) out.push(id); }
            return out.slice(0, 3);
        };
        const eedUp = promoted(sEED, poW('EED'), eed), twdUp = promoted(sTWD, poW('TWD'), twd), drdUp = promoted(sDRD, poW('DRD'), drd);
        const notes = [...sEED.denied.map(id => ({ div: 'EED', clubId: id })), ...sTWD.denied.map(id => ({ div: 'TWD', clubId: id })), ...sDRD.denied.map(id => ({ div: 'DRD', clubId: id }))];
        return {
            year: GameState.seasonStartYear, ere, eed, twd, drd, ereDown, eedDown, twdDown, eedUp, twdUp, drdUp,
            marks: { EED: { green: sEED.green, blue: sEED.blue }, TWD: { green: sTWD.green, blue: sTWD.blue }, DRD: { green: sDRD.green, blue: sDRD.blue } },
            notes
        };
    },
    // promoted clubs edge up in prestige, relegated clubs edge down — gently, so standings stay coherent
    // season to season instead of the same clubs yo-yoing at random
    _repDrift(ups, downs) {
        (ups || []).forEach(id => { const c = Clubs.getClubById(id); if (c) c.reputation = Math.min(95, c.reputation + 2); });
        (downs || []).forEach(id => { const c = Clubs.getClubById(id); if (c) c.reputation = Math.max(20, c.reputation - 2); });
    },
    applyPromotionRelegation() {
        const c = this.computeProRel();
        if (c) {
            const move = (arr, div) => arr.forEach(id => Clubs.setDivision(id, div));
            move(c.ereDown, 'EED'); move(c.eedUp, 'ERE');
            move(c.eedDown, 'TWD'); move(c.twdUp, 'EED');
            move(c.twdDown, 'DRD'); move(c.drdUp, 'TWD');
            this._repDrift([...c.eedUp, ...c.twdUp, ...c.drdUp], [...c.ereDown, ...c.eedDown, ...c.twdDown]);
        }
        this.applyPromotionRelegationEngland();
        this.applyPromotionRelegationGermany();
        this.applyPromotionRelegationSpain();
        this.applyPromotionRelegationSwiss();
        return c;
    },

    // ---------------- England: play-offs + promotion/relegation ----------------
    _poSeries(seeds, div) {
        // 4-team play-off (seeds = [s1,s2,s3,s4] by league finish): SF s1vs4 (3v6) & s2vs3 (4v5), then final
        const sf1r = this.playMatch(seeds[0], seeds[3], 'PO', true);
        const sf2r = this.playMatch(seeds[1], seeds[2], 'PO', true);
        const sf1 = { h: seeds[0], a: seeds[3], hg: sf1r.hg, ag: sf1r.ag, winner: sf1r.winner };
        const sf2 = { h: seeds[1], a: seeds[2], hg: sf2r.hg, ag: sf2r.ag, winner: sf2r.winner };
        const order = this.sortedTable(div).map(r => r.clubId); const seed = id => order.indexOf(id);
        const home = seed(sf1.winner) <= seed(sf2.winner) ? sf1.winner : sf2.winner;
        const away = home === sf1.winner ? sf2.winner : sf1.winner;
        const fin = this.playMatch(home, away, 'PO', true);
        return { sf: [sf1, sf2], final: { h: home, a: away, hg: fin.hg, ag: fin.ag, winner: fin.winner }, winner: fin.winner };
    },
    playPlayoffsEngland() {
        const L = GameState.league;
        ['CHAMP', 'LEAGUE1', 'LEAGUE2'].forEach(div => {
            const t = this.sortedTable(div).map(r => r.clubId);
            if (t.length < 6) { L.playoffs[div] = null; return; }
            L.playoffs[div] = this._poSeries([t[2], t[3], t[4], t[5]], div);   // places 3,4,5,6
        });
        // National League: places 2-7. Eliminators 4v7 and 5v6; winners meet 3 and 2 in the semis.
        const div = 'Natleague', t = this.sortedTable(div).map(r => r.clubId);
        if (t.length >= 7) {
            const e1r = this.playMatch(t[3], t[6], 'PO', true);   // 4 v 7
            const e2r = this.playMatch(t[4], t[5], 'PO', true);   // 5 v 6
            const e1 = { h: t[3], a: t[6], hg: e1r.hg, ag: e1r.ag, winner: e1r.winner };
            const e2 = { h: t[4], a: t[5], hg: e2r.hg, ag: e2r.ag, winner: e2r.winner };
            const sf1r = this.playMatch(t[2], e1.winner, 'PO', true);   // 3 v winner(4v7)
            const sf2r = this.playMatch(t[1], e2.winner, 'PO', true);   // 2 v winner(5v6)
            const sf1 = { h: t[2], a: e1.winner, hg: sf1r.hg, ag: sf1r.ag, winner: sf1r.winner };
            const sf2 = { h: t[1], a: e2.winner, hg: sf2r.hg, ag: sf2r.ag, winner: sf2r.winner };
            const seed = id => t.indexOf(id);
            const home = seed(sf1.winner) <= seed(sf2.winner) ? sf1.winner : sf2.winner;
            const away = home === sf1.winner ? sf2.winner : sf1.winner;
            const fin = this.playMatch(home, away, 'PO', true);
            L.playoffs[div] = { elim: [e1, e2], sf: [sf1, sf2], final: { h: home, a: away, hg: fin.hg, ag: fin.ag, winner: fin.winner }, winner: fin.winner };
        } else L.playoffs[div] = null;
    },
    applyPromotionRelegationEngland() {
        const L = GameState.league;
        if (!L.tables.PREM) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const prem = ord('PREM'), champ = ord('CHAMP'), l1 = ord('LEAGUE1'), l2 = ord('LEAGUE2'), nl = ord('Natleague');
        const poW = d => (L.playoffs && L.playoffs[d]) ? L.playoffs[d].winner : null;
        const take = (n, autos, pw, ordered) => {
            const o = []; autos.forEach(id => { if (id && !o.includes(id)) o.push(id); });
            if (pw && !o.includes(pw)) o.push(pw);
            for (const id of ordered) { if (o.length >= n) break; if (!o.includes(id)) o.push(id); }
            return o.slice(0, n);
        };
        const champUp = take(3, [champ[0], champ[1]], poW('CHAMP'), champ);
        const l1Up = take(3, [l1[0], l1[1]], poW('LEAGUE1'), l1);
        const l2Up = take(3, [l2[0], l2[1]], poW('LEAGUE2'), l2);
        const nlUp = take(2, [nl[0]], poW('Natleague'), nl);
        const premDown = prem.slice(-3), champDown = champ.slice(-3), l1Down = l1.slice(-3), l2Down = l2.slice(-2);
        const move = (arr, div) => arr.forEach(id => Clubs.setDivision(id, div));
        move(premDown, 'CHAMP'); move(champUp, 'PREM');
        move(champDown, 'LEAGUE1'); move(l1Up, 'CHAMP');
        move(l1Down, 'LEAGUE2'); move(l2Up, 'LEAGUE1');
        move(l2Down, 'Natleague'); move(nlUp, 'LEAGUE2');
        this._repDrift([...champUp, ...l1Up, ...l2Up, ...nlUp], [...premDown, ...champDown, ...l1Down, ...l2Down]);
        L.prorelEng = { premDown, champUp, champDown, l1Up, l1Down, l2Up, l2Down, nlUp };
        return L.prorelEng;
    },

    // ================= GERMANY =================
    // ---- DFB Pokal: all 6 German leagues; top-3-tier seeded (drawn away) & kept apart in round 1 ----
    _buildDFB() {
        const seeded = [];
        ['BUNDES', '2BUNDES', '3LIGA'].forEach(d => seeded.push(...Clubs.getClubsByDivision(d).map(c => c.id)));
        const lower = [];
        ['REGIONAL1', 'REGIONAL2', 'REGIONAL3'].forEach(d => lower.push(...Clubs.getClubsByDivision(d).map(c => c.id)));
        return { seeded, lower, remaining: null, results: [], winner: null };
    },
    _dfbRoundName(week) {
        return ({ 4: '1. Runde', 7: '2. Runde', 15: '3. Runde', 26: 'Achtelfinale', 32: 'Viertelfinale', 38: 'Halbfinale', 47: 'Finale' })[week] || 'Runde';
    },
    dfbStep(week) {
        const D = GameState.league.dfb; if (!D || D.winner) return;
        let pairs;
        if (week === 4) {
            const seeded = this.shuffle(D.seeded.slice()), lower = this.shuffle(D.lower.slice());
            pairs = [];
            seeded.forEach(s => { const h = lower.pop(); pairs.push(h != null ? [h, s] : [s, null]); });   // seeded away
            while (lower.length >= 2) pairs.push([lower.pop(), lower.pop()]);
            if (lower.length) pairs.push([lower.pop(), null]);
        } else {
            pairs = this._pairUp(this.shuffle(D.remaining));
        }
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const r = this.playMatch(h, a, 'DFB', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        D.remaining = winners;
        D.results.push({ week, round: this._dfbRoundName(week), ties });
        if (week === 47 || D.remaining.length <= 1) D.winner = D.remaining[0];
    },

    // ---- Landespokal: RL1+RL2 play 2 rounds, survivors merge with 3.Liga into the main bracket ----
    _buildLandespokal() {
        const rl = [];
        ['REGIONAL1', 'REGIONAL2'].forEach(d => rl.push(...Clubs.getClubsByDivision(d).map(c => c.id)));
        return { remaining: this.shuffle(rl), merged: false, results: [], winner: null };
    },
    _lpokalRoundName(week) {
        return ({ 4: '1. Runde', 7: '2. Runde', 15: '3. Runde', 26: 'Achtelfinale', 32: 'Viertelfinale', 38: 'Halbfinale', 47: 'Finale' })[week] || 'Runde';
    },
    lpokalStep(week) {
        const P = GameState.league.lpokal; if (!P || P.winner) return;
        if (week === 15 && !P.merged) {
            P.remaining = this.shuffle(P.remaining.concat(Clubs.getClubsByDivision('3LIGA').map(c => c.id)));
            P.merged = true;
        }
        const pairs = this._pairUp(this.shuffle(P.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const r = this.playMatch(h, a, 'LPOKAL', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        P.remaining = winners;
        P.results.push({ week, round: this._lpokalRoundName(week), ties });
        if (week === 47 || P.remaining.length <= 1) P.winner = P.remaining[0];
    },

    // ---- German relegation: two-legged ties (higher seed hosts leg 2), penalties if level on aggregate ----
    _twoLeggedTie(aId, bId, comp) {
        const l1 = this.playMatch(bId, aId, comp, true);   // leg 1 away for a
        const l2 = this.playMatch(aId, bId, comp, true);   // leg 2 home for a
        const aggA = l1.ag + l2.hg, aggB = l1.hg + l2.ag;
        let winner, pens = null;
        if (aggA > aggB) winner = aId;
        else if (aggB > aggA) winner = bId;
        else { const sA = this.clubStrength(aId), sB = this.clubStrength(bId); winner = (Math.random() < sA / (sA + sB)) ? aId : bId; pens = { winner }; }
        return { a: aId, b: bId, leg1: { h: bId, a: aId, hg: l1.hg, ag: l1.ag }, leg2: { h: aId, a: bId, hg: l2.hg, ag: l2.ag }, aggA, aggB, winner, pens };
    },
    playGermanRelegation() {
        const L = GameState.league;
        if (!L.tables.BUNDES) { L.germanReleg = null; return; }
        const B = this.sortedTable('BUNDES').map(r => r.clubId);
        const B2 = this.sortedTable('2BUNDES').map(r => r.clubId);
        const L3 = this.sortedTable('3LIGA').map(r => r.clubId);
        const top = (B.length >= 16 && B2.length >= 3) ? this._twoLeggedTie(B[15], B2[2], 'GRELEG') : null;
        const bottom = (B2.length >= 16 && L3.length >= 3) ? this._twoLeggedTie(B2[15], L3[2], 'GRELEG') : null;
        L.germanReleg = { top, bottom };
    },

    // pick `count` promotees from `order`, skipping excluded teams and skipping reserves once the cap is hit
    _promoteRespectingReserves(order, count, existingReserves, maxReserves, excludeSet) {
        const out = []; let res = existingReserves;
        for (const id of order) {
            if (out.length >= count) break;
            if (excludeSet && excludeSet.has(id)) continue;
            const isRes = isReserveClub(id);
            if (isRes && res >= maxReserves) continue;   // pass the spot to the next non-reserve
            out.push(id); if (isRes) res++;
        }
        return out;
    },

    applyPromotionRelegationGermany() {
        const L = GameState.league;
        if (!L.tables.BUNDES) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const B = ord('BUNDES'), B2 = ord('2BUNDES'), L3 = ord('3LIGA'), R1 = ord('REGIONAL1'), R2 = ord('REGIONAL2'), R3 = ord('REGIONAL3');
        const gr = L.germanReleg || {};

        // relegation outcomes
        const topA = B[15], topB = B2[2];
        const topWinner = gr.top ? gr.top.winner : topA;
        const buli16Down = topWinner !== topA, b2_3Up = topWinner === topB;
        const botA = B2[15], botB = L3[2];
        const botWinner = gr.bottom ? gr.bottom.winner : botA;
        const b2_16Down = botWinner !== botA, l3_3Up = botWinner === botB;

        // direct moves
        const buliDown = [B[16], B[17]];
        const buliUpDirect = [B2[0], B2[1]];
        const l3UpDirect = this._promoteRespectingReserves(L3, 2, 0, 0, new Set([topB, botB]));   // no reserves into 2.Bundesliga
        const b2DownDirect = [B2[16], B2[17]];
        const l3DownDirect = [L3[16], L3[17], L3[18], L3[19]];

        // Regionalliga promotions with reserve caps
        const leaving3L = new Set([...l3UpDirect, ...l3DownDirect]); if (l3_3Up) leaving3L.add(botB);
        const in3LfromB2 = [...b2DownDirect]; if (b2_16Down) in3LfromB2.push(botA);
        const res3L = [...L3.filter(id => !leaving3L.has(id)), ...in3LfromB2].filter(isReserveClub).length;
        const rl1Up = this._promoteRespectingReserves(R1, 4, res3L, 3, null);
        const rl1Down = [R1[20], R1[21], R1[22], R1[23]];

        const leavingR1 = new Set([...rl1Up, ...rl1Down]);
        const resR1 = [...R1.filter(id => !leavingR1.has(id)), ...l3DownDirect].filter(isReserveClub).length;
        const rl2Up = this._promoteRespectingReserves(R2, 4, resR1, 5, null);
        const rl2Down = [R2[20], R2[21], R2[22], R2[23]];

        const leavingR2 = new Set([...rl2Up, ...rl2Down]);
        const resR2 = [...R2.filter(id => !leavingR2.has(id)), ...rl1Down].filter(isReserveClub).length;
        const rl3Up = this._promoteRespectingReserves(R3, 4, resR2, 5, null);

        // apply
        const move = (arr, div) => arr.forEach(id => id != null && Clubs.setDivision(id, div));
        move(buliDown, '2BUNDES'); move(buliUpDirect, 'BUNDES');
        if (b2_3Up) move([topB], 'BUNDES'); if (buli16Down) move([topA], '2BUNDES');
        move(l3UpDirect, '2BUNDES'); if (l3_3Up) move([botB], '2BUNDES');
        move(b2DownDirect, '3LIGA'); if (b2_16Down) move([botA], '3LIGA');
        move(l3DownDirect, 'REGIONAL1'); move(rl1Up, '3LIGA');
        move(rl1Down, 'REGIONAL2'); move(rl2Up, 'REGIONAL1');
        move(rl2Down, 'REGIONAL3'); move(rl3Up, 'REGIONAL2');

        const ups = [...buliUpDirect, ...l3UpDirect, ...rl1Up, ...rl2Up, ...rl3Up]; if (b2_3Up) ups.push(topB); if (l3_3Up) ups.push(botB);
        const downs = [...buliDown, ...b2DownDirect, ...l3DownDirect, ...rl1Down, ...rl2Down]; if (buli16Down) downs.push(topA); if (b2_16Down) downs.push(botA);
        this._repDrift(ups, downs);

        L.prorelGer = { buliDown, buliUpDirect, b2_3Up, buli16Down, l3UpDirect, l3_3Up, b2_16Down, b2DownDirect, l3DownDirect, rl1Up, rl1Down, rl2Up, rl2Down, rl3Up };
        return L.prorelGer;
    },

    // ================= SPAIN =================
    // ---- Copa del Rey / Copa Federación: top division of the pool seeded (drawn away) & kept apart in round 1;
    //      64 clubs, one fewer cup weekend than the other countries ----
    _buildSpanishCup(seededDivs, lowerDivs) {
        const seeded = []; seededDivs.forEach(d => seeded.push(...Clubs.getClubsByDivision(d).map(c => c.id)));
        const lower = []; lowerDivs.forEach(d => lower.push(...Clubs.getClubsByDivision(d).map(c => c.id)));
        return { seeded, lower, remaining: null, results: [], winner: null };
    },
    _spanishCupRoundName(week) {
        return ({ 4: '1ª Ronda', 7: '2ª Ronda', 15: 'Octavos de final', 26: 'Cuartos de final', 38: 'Semifinales', 47: 'Final' })[week] || 'Ronda';
    },
    spanishCupStep(key, week) {
        const C = GameState.league[key]; if (!C || C.winner) return;
        let pairs;
        if (C.remaining === null) {
            const seeded = this.shuffle(C.seeded.slice()), lower = this.shuffle(C.lower.slice());
            pairs = [];
            seeded.forEach(s => { const h = lower.pop(); pairs.push(h != null ? [h, s] : [s, null]); });   // seeded drawn away
            while (lower.length >= 2) pairs.push([lower.pop(), lower.pop()]);
            if (lower.length) pairs.push([lower.pop(), null]);
        } else {
            pairs = this._pairUp(this.shuffle(C.remaining));
        }
        const comp = key === 'cdr' ? 'CDR' : 'CFED';
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const r = this.playMatch(h, a, comp, true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._spanishCupRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- Spanish promotion play-offs: two-legged semis (s1 v s4, s2 v s3) then a two-legged final ----
    _spanishPOSeries(seeds, div) {
        const sf1 = this._twoLeggedTie(seeds[0], seeds[3], 'PO');   // higher seed hosts leg 2
        const sf2 = this._twoLeggedTie(seeds[1], seeds[2], 'PO');
        const order = this.sortedTable(div).map(r => r.clubId); const seed = id => order.indexOf(id);
        const a = seed(sf1.winner) <= seed(sf2.winner) ? sf1.winner : sf2.winner;
        const b = a === sf1.winner ? sf2.winner : sf1.winner;
        const final = this._twoLeggedTie(a, b, 'PO');
        return { sf: [sf1, sf2], final, winner: final.winner };
    },
    playPlayoffsSpain() {
        const L = GameState.league;
        if (!L.tables.LaLiga) return;
        [['LaLiga2', 2], ['PrimeraSup', 3], ['PrimeraInf', 3], ['Segunda', 3]].forEach(([div, autoUp]) => {
            const t = this.sortedTable(div).map(r => r.clubId);
            if (t.length < autoUp + 4) { L.playoffs[div] = null; return; }
            L.playoffs[div] = this._spanishPOSeries([t[autoUp], t[autoUp + 1], t[autoUp + 2], t[autoUp + 3]], div);
        });
    },

    // keep a promoted set the right size while honouring a target division's reserve-team cap:
    // any reserve beyond the cap is swapped for the next eligible non-reserve in the division order
    _capReserves(promoted, order, maxRes, existingRes, excludeSet) {
        let res = existingRes; const result = [], used = new Set(promoted), overflow = [];
        promoted.forEach(id => {
            if (isReserveClub(id)) { if (res < maxRes) { result.push(id); res++; } else overflow.push(id); }
            else result.push(id);
        });
        overflow.forEach(() => {
            const repl = order.find(id => !used.has(id) && !isReserveClub(id) && !(excludeSet && excludeSet.has(id)));
            if (repl) { result.push(repl); used.add(repl); }
        });
        return result;
    },

    applyPromotionRelegationSpain() {
        const L = GameState.league;
        if (!L.tables.LaLiga) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const LL = ord('LaLiga'), L2 = ord('LaLiga2'), PS = ord('PrimeraSup'), PI = ord('PrimeraInf'), SG = ord('Segunda');
        const poW = d => (L.playoffs && L.playoffs[d]) ? L.playoffs[d].winner : null;

        // direct relegations
        const llDown = LL.slice(-3), l2Down = L2.slice(-4), psDown = PS.slice(-4), piDown = PI.slice(-4);
        const l2DownS = new Set(l2Down), psDownS = new Set(psDown), piDownS = new Set(piDown);

        // La Liga 2 -> La Liga: 2 auto + play-off winner, NO reserves allowed
        const l2Promote = this._capReserves([L2[0], L2[1], poW('LaLiga2')].filter(Boolean), L2, 0, 0, l2DownS);
        // Primera Superior -> La Liga 2: 3 auto + play-off, max 2 reserves in La Liga 2
        const l2Stay = L2.filter(id => !l2DownS.has(id) && !l2Promote.includes(id));
        const resL2 = [...l2Stay, ...llDown].filter(isReserveClub).length;
        const psPromote = this._capReserves([PS[0], PS[1], PS[2], poW('PrimeraSup')].filter(Boolean), PS, 2, resL2, psDownS);
        // Primera Inferior -> Primera Superior: 3 auto + play-off, max 4 reserves in Primera Superior
        const psStay = PS.filter(id => !psDownS.has(id) && !psPromote.includes(id));
        const resPS = [...psStay, ...l2Down].filter(isReserveClub).length;
        const piPromote = this._capReserves([PI[0], PI[1], PI[2], poW('PrimeraInf')].filter(Boolean), PI, 4, resPS, piDownS);
        // Segunda Federación -> Primera Inferior: 3 auto + play-off, no reserve cap
        const sgPromote = [SG[0], SG[1], SG[2], poW('Segunda')].filter(Boolean);

        const move = (arr, div) => arr.forEach(id => id != null && Clubs.setDivision(id, div));
        move(llDown, 'LaLiga2'); move(l2Promote, 'LaLiga');
        move(l2Down, 'PrimeraSup'); move(psPromote, 'LaLiga2');
        move(psDown, 'PrimeraInf'); move(piPromote, 'PrimeraSup');
        move(piDown, 'Segunda'); move(sgPromote, 'PrimeraInf');

        this._repDrift([...l2Promote, ...psPromote, ...piPromote, ...sgPromote], [...llDown, ...l2Down, ...psDown, ...piDown]);
        L.prorelEsp = { llDown, l2Promote, l2Down, psPromote, psDown, piPromote, piDown, sgPromote };
        return L.prorelEsp;
    },

    // ================= SWITZERLAND =================
    // draw a stand-in from a virtual pool for a club that isn't allowed to actually play a cup tie
    // (reserve/U21 sides, and Vaduz/Eschen-Mauren in the two Swiss FA cups); reuses a name if the
    // pool's ever exhausted rather than breaking the bracket
    _swissVirtualSub(pool, usedSet) {
        let pick = pool.find(v => !usedSet.has(v.id));
        if (!pick) pick = pool[Math.floor(Math.random() * pool.length)];
        usedSet.add(pick.id);
        return pick.id;
    },
    _swissCupEligible(id, usedSet) {
        if (id === 'Eschen/Mauren' || id === 'Vaduz' || isReserveClub(id)) return this._swissVirtualSub(SWISSCUP_VIRTUAL, usedSet);
        return id;
    },

    // ---- Schweizer Cup: R1 is 1. Liga (away) v 2. Liga (home); R2 merges in the top 3 divisions
    // (64 clubs total) with Super League seeded away and kept apart from each other ----
    _buildSchweizerCup() {
        return { remaining: null, results: [], winner: null, _r1Winners: null, _usedVirtual: new Set() };
    },
    _schweizerCupRoundName(week) {
        return ({ 4: '1. Hauptrunde', 7: '2. Hauptrunde', 15: '3. Hauptrunde', 26: 'Achtelfinal', 32: 'Viertelfinal', 38: 'Halbfinal', 47: 'Final' })[week] || 'Runde';
    },
    schweizerCupStep(week) {
        const C = GameState.league.schwcup; if (!C || C.winner) return;
        let pairs;
        if (week === 4) {
            const away = this.shuffle(Clubs.getClubsByDivision('1.LigaCH').map(c => this._swissCupEligible(c.id, C._usedVirtual)));
            const home = this.shuffle(Clubs.getClubsByDivision('2.LigaCH').map(c => this._swissCupEligible(c.id, C._usedVirtual)));
            pairs = home.map((h, i) => [h, away[i]]);
        } else if (C.remaining === null) {
            const seeded = this.shuffle(Clubs.getClubsByDivision('SuperLeagueCH').map(c => this._swissCupEligible(c.id, C._usedVirtual)));
            const lower = this.shuffle([
                ...(C._r1Winners || []),
                ...Clubs.getClubsByDivision('ChallengeLeague').map(c => c.id),
                ...Clubs.getClubsByDivision('PromotionLeague').map(c => this._swissCupEligible(c.id, C._usedVirtual))
            ]);
            pairs = [];
            seeded.forEach(s => { const h = lower.pop(); pairs.push(h != null ? [h, s] : [s, null]); });
            while (lower.length >= 2) pairs.push([lower.pop(), lower.pop()]);
            if (lower.length) pairs.push([lower.pop(), null]);
        } else {
            pairs = this._pairUp(this.shuffle(C.remaining));
        }
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const r = this.playMatch(h, a, 'SCHWCUP', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        C.results.push({ week, round: this._schweizerCupRoundName(week), ties });
        if (week === 4) { C._r1Winners = winners; return; }
        C.remaining = winners;
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- Cupa Bass: Promotion League + 1. Liga + 2. Liga (66 clubs) minus Eschen/Mauren and one
    // random reserve side -> a clean 64; Promotion League seeded away, one fewer round than the others ----
    _buildCupaBass() {
        const pool = ['PromotionLeague', '1.LigaCH', '2.LigaCH'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), []);
        let entrants = pool.filter(id => id !== 'Eschen/Mauren');
        const reserves = entrants.filter(isReserveClub);
        if (entrants.length > 64 && reserves.length) {
            const drop = reserves[Math.floor(Math.random() * reserves.length)];
            entrants = entrants.filter(id => id !== drop);
        }
        const promSet = new Set(Clubs.getClubsByDivision('PromotionLeague').map(c => c.id));
        const seeded = entrants.filter(id => promSet.has(id));
        const lower = entrants.filter(id => !promSet.has(id));
        return { seeded, lower, remaining: null, results: [], winner: null };
    },
    _cupaBassRoundName(week) {
        return ({ 4: '1. Hauptrunde', 7: '2. Hauptrunde', 15: 'Achtelfinal', 26: 'Viertelfinal', 38: 'Halbfinal', 47: 'Final' })[week] || 'Runde';
    },
    cupaBassStep(week) {
        const C = GameState.league.cupabass; if (!C || C.winner) return;
        let pairs;
        if (C.remaining === null) {
            const seeded = this.shuffle(C.seeded.slice()), lower = this.shuffle(C.lower.slice());
            pairs = [];
            seeded.forEach(s => { const h = lower.pop(); pairs.push(h != null ? [h, s] : [s, null]); });
            while (lower.length >= 2) pairs.push([lower.pop(), lower.pop()]);
            if (lower.length) pairs.push([lower.pop(), null]);
        } else {
            pairs = this._pairUp(this.shuffle(C.remaining));
        }
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const r = this.playMatch(h, a, 'CUPABASS', true);
            ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._cupaBassRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- Liechtensteiner Cup: Vaduz + Eschen/Mauren + 6 Liechtenstein amateur sides; QF & SF are
    // two-legged, the final is a single match ----
    _buildLichCup() {
        const teams = ['Vaduz', 'Eschen/Mauren', ...LICHCUP_VIRTUAL.map(v => v.id)];
        return { remaining: this.shuffle(teams), results: [], winner: null };
    },
    _lichCupRoundName(week) { return ({ 32: 'Viertelfinal', 38: 'Halbfinal', 47: 'Final' })[week] || 'Runde'; },
    lichCupStep(week) {
        const C = GameState.league.lichcup; if (!C || C.winner) return;
        const pairs = this._pairUp(C.remaining);
        const ties = [], winners = [];
        const twoLegged = week !== 47;
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            if (twoLegged) {
                const t = this._twoLeggedTie(h, a, 'LICHCUP');
                ties.push(t); winners.push(t.winner);
            } else {
                const r = this.playMatch(h, a, 'LICHCUP', true);
                ties.push({ h, a, hg: r.hg, ag: r.ag, winner: r.winner }); winners.push(r.winner);
            }
        });
        C.remaining = winners;
        C.results.push({ week, round: this._lichCupRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- Barrage: Super League 11th v Challenge League 2nd, and Challenge League 9th v Promotion
    // League 2nd (Challenge League bans reserves outright, so PL's barrage slot skips past any reserve) ----
    playSwissBarrages() {
        const L = GameState.league;
        if (!L.tables.SuperLeagueCH) { L.swissBarrage = null; return; }
        const SL = this.sortedTable('SuperLeagueCH').map(r => r.clubId);
        const CL = this.sortedTable('ChallengeLeague').map(r => r.clubId);
        const PL = this.sortedTable('PromotionLeague').map(r => r.clubId);
        const top = (SL.length >= 11 && CL.length >= 2) ? this._twoLeggedTie(SL[10], CL[1], 'CHBAR') : null;
        const plUp = this._promoteRespectingReserves(PL, 2, 0, 0, null);
        const bottom = (CL.length >= 9 && plUp.length >= 2) ? this._twoLeggedTie(CL[8], plUp[1], 'CHBAR') : null;
        L.swissBarrage = { top, bottom, plUp };
    },

    // ---- 1. Liga & 2. Liga promotion play-offs: identical shape to the Spanish 4-team play-off ----
    playPlayoffsSwiss() {
        const L = GameState.league;
        if (!L.tables['1.LigaCH']) return;
        [['1.LigaCH', 2], ['2.LigaCH', 3]].forEach(([div, autoUp]) => {
            const t = this.sortedTable(div).map(r => r.clubId);
            if (t.length < autoUp + 4) { L.playoffs[div] = null; return; }
            L.playoffs[div] = this._spanishPOSeries([t[autoUp], t[autoUp + 1], t[autoUp + 2], t[autoUp + 3]], div);
        });
    },

    applyPromotionRelegationSwiss() {
        const L = GameState.league;
        if (!L.tables.SuperLeagueCH) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const SL = ord('SuperLeagueCH'), CL = ord('ChallengeLeague'), PL = ord('PromotionLeague'), L1 = ord('1.LigaCH'), L2 = ord('2.LigaCH');
        const bar = L.swissBarrage || {};
        const poW = d => (L.playoffs && L.playoffs[d]) ? L.playoffs[d].winner : null;

        // Super League <-> Challenge League barrage (11th v Challenge League 2nd)
        const slA = SL[10], clB = CL[1];
        const topWinner = bar.top ? bar.top.winner : slA;
        const sl11Down = topWinner !== slA;
        const slDown = sl11Down ? [SL[11], slA] : [SL[11]];
        const clUp = sl11Down ? [CL[0], clB] : [CL[0]];

        // Challenge League <-> Promotion League barrage (9th v Promotion League's reserve-respecting 2nd —
        // Challenge League never admits a reserve side, so the spot skips to the next eligible PL club)
        const plUp2 = bar.plUp || this._promoteRespectingReserves(PL, 2, 0, 0, null);
        const plDirect = plUp2[0], plA = plUp2[1], clB2 = CL[8];
        const bottomWinner = bar.bottom ? bar.bottom.winner : clB2;
        const plWinsBarrage = bottomWinner === plA;
        const clDown = plWinsBarrage ? [CL[9], clB2] : [CL[9]];
        const plToCL = plWinsBarrage ? [plDirect, plA] : [plDirect];

        // Promotion League <-> 1. Liga (max 4 reserves in Promotion League)
        const plRelegDirect = [PL[15], PL[16], PL[17]];
        const plLeaving = new Set([...plRelegDirect, ...plToCL]);
        const plArriving = plWinsBarrage ? [] : [clB2];
        const resPLbase = [...PL.filter(id => !plLeaving.has(id)), ...plArriving].filter(isReserveClub).length;
        const l1UpCandidates = [L1[0], L1[1], poW('1.LigaCH')].filter(Boolean);
        const l1Up = this._capReserves(l1UpCandidates, L1, 4, resPLbase, new Set());

        // 1. Liga <-> 2. Liga (max 6 reserves in 1. Liga; 2. Liga has no reserve cap and no relegation)
        const l1RelegDirect = [L1[20], L1[21], L1[22], L1[23]];
        const l1Stay = L1.filter(id => !l1RelegDirect.includes(id) && !l1Up.includes(id));
        const resL1base = [...l1Stay, ...plRelegDirect].filter(isReserveClub).length;
        const l2UpCandidates = [L2[0], L2[1], L2[2], poW('2.LigaCH')].filter(Boolean);
        const l2Up = this._capReserves(l2UpCandidates, L2, 6, resL1base, new Set());

        const move = (arr, div) => arr.forEach(id => id != null && Clubs.setDivision(id, div));
        move(slDown, 'ChallengeLeague'); move(clUp, 'SuperLeagueCH');
        move(clDown, 'PromotionLeague'); move(plToCL, 'ChallengeLeague');
        move(plRelegDirect, '1.LigaCH'); move(l1Up, 'PromotionLeague');
        move(l1RelegDirect, '2.LigaCH'); move(l2Up, '1.LigaCH');

        this._repDrift([...clUp, ...plToCL, ...l1Up, ...l2Up], [...slDown, ...clDown, ...plRelegDirect, ...l1RelegDirect]);
        L.prorelSwiss = { slDown, clUp, clDown, plToCL, plRelegDirect, l1Up, l1RelegDirect, l2Up };
        return L.prorelSwiss;
    },

    clubStrength(clubId) {
        const c = Clubs.getClubById(clubId);
        if (!c) { const v = findVirtualClub(clubId); return v ? v.reputation : 50; }
        const squad = GameState.players.filter(p => effectiveClubId(p) === clubId && !p.injury);
        const top = squad.sort((a, b) => b.ability - a.ability).slice(0, 11);
        const avg = top.length ? top.reduce((s, p) => s + p.ability, 0) / top.length : c.reputation;
        return c.reputation * 0.5 + avg * 0.5;
    },
    teamName(id) {
        const c = Clubs.getClubById(id);
        if (c) return c.name;
        const v = findVirtualClub(id);
        return v ? v.name : id;
    },

    // ---------------- weekly simulation ----------------
    _leagueWeeksRemaining(fromWeek) {
        const NO_LEAGUE = new Set([1, 2, 10, 11, 12, 17, 18, 27, 28]);
        let n = 0; for (let w = fromWeek; w <= 45; w++) if (!NO_LEAGUE.has(w)) n++;
        return n;
    },
    simulateWeek() {
        const L = GameState.league; if (!L) return;
        const week = GameState.week;

        // no league matches in the opening fortnight or during international breaks (cups still run)
        const NO_LEAGUE = new Set([1, 2, 10, 11, 12, 17, 18, 27, 28]);
        if (!NO_LEAGUE.has(week)) {
            // how many active league weeks have elapsed (incl. this one) vs the whole season — used to spread
            // any extra rounds evenly across the campaign instead of cramming them into the opening weeks
            let elapsed = 0, total = 0;
            for (let w = 1; w <= 45; w++) { if (NO_LEAGUE.has(w)) continue; total++; if (w <= week) elapsed++; }
            ALL_LEAGUE_DIVS.forEach(div => {
                const s = L.schedule[div]; if (!s) return;
                const remMd = s.length - L.mdIndex[div];
                if (remMd <= 0) return;
                // ease in: the first few active league weeks play a single matchday so fixtures don't jump by two
                // right away; afterwards we hold a linear pace, with any doubles spread across the campaign
                let perWeek;
                if (elapsed <= 6) {
                    perWeek = Math.min(remMd, 1);
                } else {
                    const targetByNow = Math.round(s.length * elapsed / total);
                    perWeek = Math.max(1, Math.min(remMd, targetByNow - L.mdIndex[div]));
                }
                for (let k = 0; k < perWeek && L.mdIndex[div] < s.length; k++) {
                    s[L.mdIndex[div]].forEach(([h, a]) => this.playLeagueMatch(div, h, a));
                    L.mdIndex[div] += 1;
                }
            });
        }

        if ([4, 7, 15, 26, 32, 38, 47].includes(week)) this.bekerStep(week);

        if ([4, 7, 16].includes(week) && L.kbek && !L.kbek.groupDone) {
            this.kleineGroupStep();
            if (week === 16) { this.seedKleineKO(); L.kbek.groupDone = true; }
        } else if ([26, 32, 38, 47].includes(week) && L.kbek && L.kbek.groupDone) {
            this.kleineKOStep(week);
        }

        // English cups (run in parallel with the Dutch ones)
        if ([4, 7, 15, 26, 32, 38, 47].includes(week) && L.facup) this.facupStep(week);
        if ((week === 4 || week === 7) && L.llc) this.llcGroupStep(week);
        else if ([15, 26, 32, 38, 46].includes(week) && L.llc) this.llcKOStep(week);

        // German cups (same rounds/weeks as the others)
        if ([4, 7, 15, 26, 32, 38, 47].includes(week) && L.dfb) this.dfbStep(week);
        if ([4, 7, 15, 26, 32, 38, 47].includes(week) && L.lpokal) this.lpokalStep(week);

        // Spanish cups (64 clubs -> one fewer round; week 32 is skipped)
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.cdr) this.spanishCupStep('cdr', week);
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.cfed) this.spanishCupStep('cfed', week);

        // Swiss cups: Schweizer Cup runs the full 7 rounds like the others; Cupa Bass is 64 clubs so
        // skips week 32 like the Spanish cups; the Liechtensteiner Cup is just QF/SF/Final
        if ([4, 7, 15, 26, 32, 38, 47].includes(week) && L.schwcup) this.schweizerCupStep(week);
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.cupabass) this.cupaBassStep(week);
        if ([32, 38, 47].includes(week) && L.lichcup) this.lichCupStep(week);

        if (week === 46 && L.playoffs && !L.playoffs._done) { this.playPlayoffs(); this.playPlayoffsEngland(); this.playGermanRelegation(); this.playPlayoffsSpain(); this.playSwissBarrages(); this.playPlayoffsSwiss(); L.playoffs._done = true; }
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

        // serve suspensions: a banned player sits this one out (no appearance) and his ban ticks down
        const available = [];
        squad.forEach(p => {
            if (p._cardSeason !== year) { p._cardSeason = year; p._yellowsSeason = 0; p._suspended = 0; }
            if (p._suspended > 0) { p._suspended -= 1; return; }
            available.push(p);
        });
        if (!available.length) return;

        const loanedIn = available.filter(p => p.onLoanAt === clubId);
        const guaranteed = [], maybeLoan = [];
        loanedIn.forEach(p => { if (p.loanRole === 'rotation' && Math.random() > 0.65) maybeLoan.push(p); else guaranteed.push(p); });
        guaranteed.splice(5);
        const rest = available.filter(p => !guaranteed.includes(p) && !maybeLoan.includes(p));
        const bestGK = rest.filter(p => p.position === 'GK').sort((a, b) => b.ability - a.ability)[0];
        const outfield = rest.filter(p => p !== bestGK)
            .map(p => ({ p, w: (ROLE_PLAYTIME[p.squadRole] ?? 0.4) * 3 + p.ability / 80 + Math.random() * 0.8 }))
            .sort((a, b) => b.w - a.w).map(x => x.p);

        const starters = [];
        if (bestGK) starters.push(bestGK);
        guaranteed.forEach(p => { if (starters.length < 11) starters.push(p); });
        for (const p of outfield) { if (starters.length >= 11) break; starters.push(p); }

        // squad role decides how often a player features — but a loaned-in player follows the role his
        // loan deal guaranteed (a youth prospect loaned out as a star plays like a star at the loan club)
        const ATTEND = { key: 0.95, starter: 0.82, rotation: 0.26, fringe: 0.16, youth: 0.08 };
        const effRole = pl => (pl.onLoanAt === clubId ? (pl.loanRole || 'starter') : pl.squadRole);
        const willPlay = pl => Math.random() < (ATTEND[effRole(pl)] ?? 0.6);
        const benchPool = outfield.filter(p => !starters.includes(p));   // remaining outfielders, best-first
        const finalStarters = [];
        starters.forEach(pl => {
            if (pl === bestGK) { finalStarters.push(pl); return; }     // the No.1 keeper plays
            if (willPlay(pl)) { finalStarters.push(pl); return; }
            const rep = benchPool.shift();                            // rested -> a squad player deputises
            if (rep) finalStarters.push(rep);
        });

        const subs = maybeLoan.concat(benchPool).slice(0, 5);
        const appear = [];
        finalStarters.forEach(p => appear.push({ p, full: true, g: 0, a: 0 }));
        subs.forEach(p => { if (Math.random() < (ATTEND[effRole(p)] ?? 0.5) * 0.7) appear.push({ p, full: false, g: 0, a: 0 }); });
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
            const yRate = (yellowRate[p.position] ?? 0.10) * (sBias(p).card || 1), rRate = yRate * 0.06;
            const rr = Math.random();
            if (rr < rRate) {
                c.red += 1;
                p._suspended = (p._suspended || 0) + 1;                 // straight red -> one-match ban
            } else if (rr < yRate) {
                c.yellow += 1;
                p._yellowsSeason = (p._yellowsSeason || 0) + 1;
                if (p._yellowsSeason % 5 === 0) p._suspended = (p._suspended || 0) + 1;  // 5th, 10th, 15th... yellow -> ban
            }
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
        ALL_LEAGUE_DIVS.forEach(div => {
            if (!L.tables[div]) return;
            const champ = this.sortedTable(div)[0];
            if (champ) { L.champions[div] = champ.clubId; this.awardTrophy(champ.clubId, div, year, awarded); }
        });
        if (L.beker && L.beker.winner) this.awardTrophy(L.beker.winner, 'BEKER', year, awarded);
        if (L.kbek && L.kbek.winner) this.awardTrophy(L.kbek.winner, 'KBEK', year, awarded);
        if (L.facup && L.facup.winner) this.awardTrophy(L.facup.winner, 'FACUP', year, awarded);
        if (L.llc && L.llc.winner) this.awardTrophy(L.llc.winner, 'LLC', year, awarded);
        if (L.dfb && L.dfb.winner) this.awardTrophy(L.dfb.winner, 'DFB', year, awarded);
        if (L.lpokal && L.lpokal.winner) this.awardTrophy(L.lpokal.winner, 'LPOKAL', year, awarded);
        if (L.cdr && L.cdr.winner) this.awardTrophy(L.cdr.winner, 'CDR', year, awarded);
        if (L.cfed && L.cfed.winner) this.awardTrophy(L.cfed.winner, 'CFED', year, awarded);
        if (L.schwcup && L.schwcup.winner) this.awardTrophy(L.schwcup.winner, 'SCHWCUP', year, awarded);
        if (L.cupabass && L.cupabass.winner) this.awardTrophy(L.cupabass.winner, 'CUPABASS', year, awarded);
        if (L.lichcup && L.lichcup.winner) this.awardTrophy(L.lichcup.winner, 'LICHCUP', year, awarded);
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
