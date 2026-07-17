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
    SerieA: { name: 'Serie A', short: 'Serie A', type: 'league' },
    SerieB: { name: 'Serie B', short: 'Serie B', type: 'league' },
    SerieC: { name: 'Serie C', short: 'Serie C', type: 'league' },
    SerieD: { name: 'Serie D', short: 'Serie D', type: 'league' },
    COPPA: { name: 'Coppa Italia', short: 'Coppa', type: 'cup' },
    COPPACOMP: { name: 'Coppa Compagno', short: 'C. Compagno', type: 'cup' },
    Ligue1: { name: 'Ligue 1', short: 'L1', type: 'league' },
    Ligue2: { name: 'Ligue 2', short: 'L2', type: 'league' },
    Ligue3: { name: 'Ligue 3', short: 'L3', type: 'league' },
    Ligue4: { name: 'Ligue 4', short: 'L4', type: 'league' },
    Ligue5: { name: 'Ligue 5', short: 'L5', type: 'league' },
    COUPEFR: { name: 'Coupe de France', short: 'Coupe', type: 'cup' },
    COUPENAT: { name: 'Coupe National', short: 'C. Nat', type: 'cup' },
    LigaPortugal: { name: 'Primeira Liga', short: 'Liga PT', type: 'league' },
    LigaPortugal2: { name: 'Liga Portugal 2', short: 'Liga 2', type: 'league' },
    Liga3: { name: 'Liga 3', short: 'Liga 3', type: 'league' },
    Liga4: { name: 'Liga 4', short: 'Liga 4', type: 'league' },
    TACAPT: { name: 'Taça de Portugal', short: 'Taça', type: 'cup' },
    SEGTACA: { name: 'Segunda Taça', short: 'Seg. Taça', type: 'cup' },
    JupilerProLeague: { name: 'Jupiler Pro League', short: 'JPL', type: 'league' },
    ChallengerProLeague: { name: 'Challenger Pro League', short: 'CPL', type: 'league' },
    BelgianDivision1: { name: 'Belgian Division 1', short: 'BD1', type: 'league' },
    BelgianDivision2: { name: 'Belgian Division 2', short: 'BD2', type: 'league' },
    BELCUP: { name: 'Belgian Cup', short: 'Cup', type: 'cup' },
    NOTRECOUPE: { name: 'Notre Coupe', short: 'N. Coupe', type: 'cup' },
    BEKER: { name: 'KNVB Beker', short: 'Beker', type: 'cup' },
    KBEK: { name: 'De kleine Beker', short: 'kl. Beker', type: 'cup' },
    FACUP: { name: 'FA Cup', short: 'FA Cup', type: 'cup' },
    LLC: { name: 'Lower Leagues Cup', short: 'LLC', type: 'cup' },
    PO: { name: 'Promotion Play-off', short: 'PO', type: 'playoff' },
    UCL: { name: 'Champions League', short: 'UCL', type: 'cont' },
    UEL: { name: 'Europa League', short: 'UEL', type: 'cont' },
    UECL: { name: 'Conference League', short: 'UECL', type: 'cont' },
    JCS: { name: 'Johan Cruijff Schaal', short: 'JCS', type: 'super' },
    U21: { name: 'U21 League', short: 'U21', type: 'youth', youth: true }
};
function compName(id) { return COMPETITIONS[id] ? COMPETITIONS[id].name : (Clubs.DIV_NAMES && Clubs.DIV_NAMES[id]) || id; }

const DIV_ORDER = ['ERE', 'EED', 'TWD', 'DRD'];
const DIV_TIER = { ERE: 1, EED: 2, TWD: 3, DRD: 4 };
// every country's league ladder, top tier first
const COUNTRY_DIVS = { Netherlands: ['ERE', 'EED', 'TWD', 'DRD'], England: ['PREM', 'CHAMP', 'LEAGUE1', 'LEAGUE2', 'Natleague'], Germany: ['BUNDES', '2BUNDES', '3LIGA', 'REGIONAL1', 'REGIONAL2', 'REGIONAL3'], Spain: ['LaLiga', 'LaLiga2', 'PrimeraSup', 'PrimeraInf', 'Segunda'], Switzerland: ['SuperLeagueCH', 'ChallengeLeague', 'PromotionLeague', '1.LigaCH', '2.LigaCH'], Italy: ['SerieA', 'SerieB', 'SerieC', 'SerieD'], Portugal: ['LigaPortugal', 'LigaPortugal2', 'Liga3', 'Liga4'], Belgium: ['JupilerProLeague', 'ChallengerProLeague', 'BelgianDivision1', 'BelgianDivision2'], France: ['Ligue1', 'Ligue2', 'Ligue3', 'Ligue4', 'Ligue5'] };
const ALL_LEAGUE_DIVS = Object.values(COUNTRY_DIVS).reduce((a, b) => a.concat(b), []);
// cups shown per country in the Leagues tab (extend this when adding more countries)
const COUNTRY_CUPS = { Netherlands: [['beker', 'KNVB Beker'], ['kbek', 'kleine Beker']], England: [['facup', 'FA Cup'], ['llc', 'Lower Leagues Cup']], Germany: [['dfb', 'DFB Pokal'], ['lpokal', 'Landespokal']], Spain: [['cdr', 'Copa del Rey'], ['cfed', 'Copa Federación']], Switzerland: [['schwcup', 'Schweizer Cup'], ['cupabass', 'Cupa Bass'], ['lichcup', 'Liechtensteiner Cup']], Italy: [['coppaitalia', 'Coppa Italia'], ['coppacompagno', 'Coppa Compagno']], Portugal: [['tacaportugal', 'Taça de Portugal'], ['segundataca', 'Segunda Taça']], Belgium: [['belgiancup', 'Belgian Cup'], ['notrecoupe', 'Notre Coupe']], France: [['coupefrance', 'Coupe de France'], ['coupenational', 'Coupe National']] };
function divCountry(div) { for (const [c, ds] of Object.entries(COUNTRY_DIVS)) if (ds.includes(div)) return c; return 'Netherlands'; }

// ---- weekly squad index (world model) ----
// How many recent appearances count as "current form" when the manager decides who plays.
const RECENT_FORM_WINDOW = 12;

// Squad lists are only needed for clubs employing a sim-relevant player (the agent's clients,
// ex-clients, scouted prospects — ~dozens of people, a handful of clubs). Built lazily once per
// week from a single pass over the player pool, instead of the old per-match full-pool filter
// that scanned ~10k players ~53,000 times a season (measured: 89% of all simulation time).
// Saves made before the frozen-NPC world model let background players age, decline and retire with
// nothing generated to replace them, so a long-running save can hold clubs with barely a squad left
// (the V2 migration rejuvenates the survivors but never refills the gaps). A club with almost no
// modelled team-mates handed its entire goal output to whichever tracked player was on the pitch —
// full-backs with 40+ goal seasons. Refill any host club that has drifted below a proper squad;
// lazily, once, and only for the handful of clubs employing someone the game actually tracks.
function _topUpHostSquads(hostClubs) {
    if (!hostClubs.size || typeof PlayerGen === 'undefined' || !PlayerGen.makePlayer) return;
    const have = new Map();
    for (const p of GameState.players) {
        if (p.archived || !p.clubId || !hostClubs.has(p.clubId)) continue;
        const c = have.get(p.clubId) || { gk: 0, out: 0 };
        if (p.position === 'GK') c.gk++; else c.out++;
        have.set(p.clubId, c);
    }
    const OUT = POS_LIST.filter(x => x !== 'GK');
    for (const cid of hostClubs) {
        const club = Clubs.getClubById(cid);
        if (!club) continue;                                                      // European guest clubs have no roster
        if (isReserveClub(cid) || String(cid).indexOf('u21:') === 0) continue;    // youth/reserve sides borrow from the seniors
        const h = have.get(cid) || { gk: 0, out: 0 };
        const want = PlayerGen.squadSizeByTier(club.tier);
        const needGK = Math.max(0, 2 - h.gk), needOut = Math.max(0, (want - 2) - h.out);
        if (!needGK && !needOut) continue;
        const mk = pos => {
            const age = PlayerGen.randSquadAge();
            let ability = PlayerGen.gauss(club.reputation, 7);
            if (age < 24) ability -= (24 - age) * 1.1;
            const np = PlayerGen.makePlayer(club, { ability, age, position: pos });
            np.potential = np.ability;   // background players are frozen: no development curve
            return np;
        };
        const fresh = [];
        for (let i = 0; i < needGK; i++) fresh.push(mk('GK'));
        for (let i = 0; i < needOut; i++) fresh.push(mk(OUT[Math.floor(Math.random() * OUT.length)]));
        GameState.players.push(...fresh);
        // re-derive roles across the club's background squad (the agent's own players keep theirs)
        const bg = GameState.players.filter(p => !p.archived && p.clubId === cid && !isSimRelevant(p));
        if (bg.length) PlayerGen.assignRoles(bg);
    }
}
let __sqCache = null, __sqCacheWeek = -1;
function relevantSquads() {
    const wk = GameState.seasonStartYear * 52 + GameState.week;
    if (__sqCacheWeek !== wk) {
        __sqCacheWeek = wk;
        __sqCache = new Map();
        const hostClubs = new Set();
        for (const p of GameState.players) {
            if (isSimRelevant(p)) { const cid = effectiveClubId(p); if (cid) hostClubs.add(cid); }
        }
        _topUpHostSquads(hostClubs);   // repair thin background squads before indexing them
        for (const p of GameState.players) {
            if (p.archived || p.injury) continue;
            const cid = effectiveClubId(p);
            if (cid && hostClubs.has(cid)) {
                let arr = __sqCache.get(cid);
                if (!arr) __sqCache.set(cid, arr = []);
                arr.push(p);
            }
        }
    }
    return __sqCache;
}
// Live extra strength from the agent's clients: the roster-justified level is
// anchor + Σ max(0, ability − anchor)/11 (the "replace n of 11 anchor-rated players with your
// actual clients" formula). The club's stored reputation converges to that level seasonally
// (rising promptly, fading slowly after departures — League.normalizeReputations), so only the
// part NOT yet reflected in reputation is added here: mid-season signings and talents whose
// ability grew since the last rollover count immediately, with no double-counting.
function clientStrengthBonus(clubId, currentRep) {
    const c = Clubs.getClubById(clubId);
    if (!c) return 0;
    const sq = relevantSquads().get(clubId);
    if (!sq) return 0;
    const anchor = c.anchorRep != null ? c.anchorRep : c.reputation;
    let boost = 0;
    for (const p of sq) if (p.agentId === 'me') boost += Math.max(0, p.ability - anchor) / 11;
    return Math.max(0, anchor + boost - currentRep);
}

// ---- seasonal form rolls (world model) ----
// Once per rollover every club rolls a seasonDelta (ability offset vs reputation, bounded ±5)
// from one of these tables, chosen by how long it has finished below/above its expected
// position (= its reputation rank inside its country's ladder). The tables are deliberately
// mean-reverting: sustained underperformers drift back up, sustained overperformers back down,
// and after 5 (under) / 6 (over) straight seasons the delta resets outright.
const SEASON_ROLL_TABLES = [
    [[-2, 20], [-1, 20], [0, 20], [1, 20], [2, 20]],
    [[-3, 10], [-2, 15], [-1, 15], [0, 15], [1, 15], [2, 20], [3, 10]],
    [[-4, 10], [-3, 10], [-2, 10], [-1, 10], [1, 15], [2, 15], [3, 15], [4, 15]],
    [[-5, 5], [-4, 10], [-3, 10], [-2, 5], [-1, 5], [1, 10], [2, 15], [3, 20], [4, 15], [5, 5]],
    [[-5, 5], [-4, 5], [-3, 5], [-2, 5], [-1, 5], [0, 15], [1, 10], [2, 15], [3, 15], [4, 15], [5, 5]]
];
function rollFromTable(tableIdx, inverted) {
    const table = SEASON_ROLL_TABLES[tableIdx];
    const total = table.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [delta, w] of table) {
        r -= w;
        if (r <= 0) return inverted ? -delta : delta;
    }
    return 0;
}

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
// 39 overseas French "virtual" clubs (rep 16). Each season 28 are drawn into the Coupe
// de France's first round alongside the 100 league clubs, for 128 entrants total (a clean 2^7).
const COUPEFR_VIRTUAL = [
    { id: "vfr_as_pirae", name: "AS Pirae", reputation: 16 },
    { id: "vfr_as_rosador", name: "AS Rosador", reputation: 16 },
    { id: "vfr_hiengh_ne_sport", name: "Hienghène Sport", reputation: 16 },
    { id: "vfr_asc_le_geldar", name: "ASC Le Geldar", reputation: 16 },
    { id: "vfr_asc_agouado", name: "ASC Agouado", reputation: 16 },
    { id: "vfr_la_tamponnaise", name: "La Tamponnaise", reputation: 16 },
    { id: "vfr_saint_denis_fc", name: "Saint-Denis FC", reputation: 16 },
    { id: "vfr_as_samaritaine", name: "AS Samaritaine", reputation: 16 },
    { id: "vfr_golden_lion_fc", name: "Golden Lion FC", reputation: 16 },
    { id: "vfr_cs_moulien", name: "CS Moulien", reputation: 16 },
    { id: "vfr_sc_baie_mahault", name: "SC Baie-Mahault", reputation: 16 },
    { id: "vfr_asu_grand_santi", name: "ASU Grand Santi", reputation: 16 },
    { id: "vfr_l_toile_de_morne_l_eau", name: "L'Étoile de Morne-à-l'Eau", reputation: 16 },
    { id: "vfr_aiglon_du_lamentin_fc", name: "Aiglon du Lamentin FC", reputation: 16 },
    { id: "vfr_as_v_nus", name: "AS Vénus", reputation: 16 },
    { id: "vfr_diables_noirs", name: "Diables Noirs", reputation: 16 },
    { id: "vfr_as_jumeaux_de_m_zouazia", name: "AS Jumeaux de M'zouazia", reputation: 16 },
    { id: "vfr_csc_cayenne", name: "CSC Cayenne", reputation: 16 },
    { id: "vfr_solidarit_scolaire", name: "Solidarité-Scolaire", reputation: 16 },
    { id: "vfr_club_franciscain", name: "Club Franciscain", reputation: 16 },
    { id: "vfr_as_saint_pierraise", name: "AS Saint Pierraise", reputation: 16 },
    { id: "vfr_js_saint_pierroise", name: "JS Saint-Pierroise", reputation: 16 },
    { id: "vfr_fc_mtsap_r", name: "FC Mtsapéré", reputation: 16 },
    { id: "vfr_phrae_du_canal", name: "Phrae du Canal", reputation: 16 },
    { id: "vfr_us_sinnamary", name: "US Sinnamary", reputation: 16 },
    { id: "vfr_pamandzi_sc", name: "Pamandzi SC", reputation: 16 },
    { id: "vfr_unit_sainte_rosienne", name: "Unité Sainte Rosienne", reputation: 16 },
    { id: "vfr_as_llienne_amateur", name: "AS Îllienne Amateur", reputation: 16 },
    { id: "vfr_golden_star", name: "Golden Star", reputation: 16 },
    { id: "vfr_an_jeunesse_volution", name: "AN Jeunesse Évolution", reputation: 16 },
    { id: "vfr_aj_saint_georges", name: "AJ Saint-Georges", reputation: 16 },
    { id: "vfr_ss_jeanne_d_arc", name: "SS Jeanne d'Arc", reputation: 16 },
    { id: "vfr_as_magenta", name: "AS Magenta", reputation: 16 },
    { id: "vfr_usr_sainte_rose", name: "USR Sainte-Rose", reputation: 16 },
    { id: "vfr_ase_de_matoury", name: "ASE de Matoury", reputation: 16 },
    { id: "vfr_js_vieux_habitants", name: "JS Vieux-Habitants", reputation: 16 },
    { id: "vfr_us_de_matoury", name: "US de Matoury", reputation: 16 },
    { id: "vfr_as_dragon", name: "AS Dragon", reputation: 16 },
    { id: "vfr_as_sainte_suzanne", name: "AS Sainte-Suzanne", reputation: 16 },
];
const COUPEFR_VIRTUAL_MAP = COUPEFR_VIRTUAL.reduce((m, c) => { m[c.id] = c; return m; }, {});
// 7 Portuguese amateur "virtual" clubs (rep 18); each season 2 are drawn into the Segunda Taça to
// round the field of 62 (divisions 2-4) up to a clean 64.
const SEGTACA_VIRTUAL = [
    { id: 'vpt_vila_mea', name: 'AC Vila Meã', reputation: 18 },
    { id: 'vpt_maia_lidador', name: 'FC Maia Lidador', reputation: 18 },
    { id: 'vpt_maria_da_fonte', name: 'SC Maria da Fonte', reputation: 18 },
    { id: 'vpt_nazarenos', name: 'GD Nazarenos', reputation: 18 },
    { id: 'vpt_nogueirense', name: 'AD Nogueirense', reputation: 18 },
    { id: 'vpt_florgrade', name: 'Florgrade FC', reputation: 18 },
    { id: 'vpt_uniao_lamas', name: 'União Lamas', reputation: 18 },
];
const SEGTACA_VIRTUAL_MAP = SEGTACA_VIRTUAL.reduce((m, c) => { m[c.id] = c; return m; }, {});
// 7 Belgian amateur "virtual" clubs (rep 18); each season 2 are drawn into Notre Coupe to round the
// field of 62 (divisions 2-4) up to a clean 64.
const NOTRECOUPE_VIRTUAL = [
    { id: 'vbe_oudenaarde', name: 'KSV Oudenaarde', reputation: 18 },
    { id: 'vbe_racing_gent', name: 'Racing Gent', reputation: 18 },
    { id: 'vbe_vw_hamme', name: 'VW Hamme', reputation: 18 },
    { id: 'vbe_gullegem', name: 'FC Gullegem', reputation: 18 },
    { id: 'vbe_berchem', name: 'Berchem Sport', reputation: 18 },
    { id: 'vbe_hades', name: 'Hades', reputation: 18 },
    { id: 'vbe_sporting_bruxelles', name: 'Sporting Bruxelles', reputation: 18 },
];
const NOTRECOUPE_VIRTUAL_MAP = NOTRECOUPE_VIRTUAL.reduce((m, c) => { m[c.id] = c; return m; }, {});
function findVirtualClub(id) { return FACUP_VIRTUAL_MAP[id] || SWISSCUP_VIRTUAL_MAP[id] || LICHCUP_VIRTUAL_MAP[id] || COUPEFR_VIRTUAL_MAP[id] || SEGTACA_VIRTUAL_MAP[id] || NOTRECOUPE_VIRTUAL_MAP[id] || (typeof EUROPE_VIRTUAL_MAP !== 'undefined' && EUROPE_VIRTUAL_MAP[id]) || null; }

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
            coppaitalia: this._buildSpanishCup(['SerieA'], ['SerieB', 'SerieC']),
            coppacompagno: this._buildSpanishCup(['SerieB'], ['SerieC', 'SerieD']),
            coupefrance: this._buildCoupeFrance(),
            coupenational: this._buildCoupeNational(),
            tacaportugal: this._buildTacaPortugal(),
            segundataca: this._buildSegundaTaca(),
            belgiancup: this._buildBelgianCup(),
            notrecoupe: this._buildNotreCoupe(),
            playoffs: { EED: null, TWD: null, DRD: null, CHAMP: null, LEAGUE1: null, LEAGUE2: null, Natleague: null, LaLiga2: null, PrimeraSup: null, PrimeraInf: null, Segunda: null, '1.LigaCH': null, '2.LigaCH': null, SerieB: null, SerieC: null, SerieD: null, Ligue2: null, Ligue3: null, Ligue4: null, Ligue5: null, _done: false },
            germanReleg: null,
            swissBarrage: null,
            italianPlayout: null,
            frenchBarrage: null,
            ptPlayoffs: null,
            bePlayoffs: null,
            europe: null,
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
            const t = this.playCupTie(h, a, 'BEKER', week === 47);
            ties.push(t);
            winners.push(t.winner);
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
    // One-legged cup tie: the lower-division side always hosts (the bigger club is drawn
    // away - proper cup atmosphere), and the FINAL is on neutral ground: original order is
    // kept and neither side gets the home bonus.
    // A definitive penalty-shootout result (the winner is strictly ahead). Best-of-five with
    // sudden death, ~75% conversion. Returns [winnerGoals, loserGoals], e.g. [4,3] or [5,4] or [3,1].
    // A shootout score that could actually have happened. Kicks alternate and STOP the moment the
    // tie is mathematically settled, so the losing side never takes a kick that cannot matter —
    // which is why 5:1 is impossible (at 4:1 with one kick each left, the trailing side can only
    // reach 3, so it is already over). Playing all five each and counting produced those results.
    // Returns [winner, loser].
    _penScore() {
        const CONV = 0.75, KICKS = 5;
        let a = 0, b = 0, ka = 0, kb = 0;
        for (let i = 0; i < KICKS * 2; i++) {
            if (i % 2 === 0) { if (Math.random() < CONV) a++; ka++; }
            else { if (Math.random() < CONV) b++; kb++; }
            if (a > b + (KICKS - kb)) break;   // b cannot catch up even by scoring everything left
            if (b > a + (KICKS - ka)) break;
        }
        // sudden death: both take one, repeat until exactly one of them scores
        let guard = 0;
        while (a === b && guard++ < 40) {
            const sa = Math.random() < 0.72, sb = Math.random() < 0.72;
            if (sa) a++;
            if (sb) b++;
        }
        if (a === b) a++;   // the guard should never fire; never hand back a drawn shootout
        return a > b ? [a, b] : [b, a];
    },

    // Extra time for a FINAL level after 90'. Two 15-minute halves, low-scoring: ~0.45 goals a side
    // for an even tie. Returns { hg, ag } — the ET goals only. If they differ the tie is decided in
    // ET; if not, it goes to penalties. Team-level (the ET goals are not attributed to a player).
    _extraTime(homeId, awayId) {
        const sh = this.clubStrength(homeId), sa = this.clubStrength(awayId);
        const half = (att, def) => {
            const lam = Math.max(0.06, 0.45 + (att - def) / 40);
            let g = 0, p = Math.exp(-lam), cum = p, x = Math.random(), term = p, k = 0;
            while (x > cum && k < 6) { k++; term *= lam / k; cum += term; g = k; }
            return g;
        };
        return { hg: half(sh, sa), ag: half(sa, sh) };
    },

    playCupTie(h, a, compId, isFinal) {
        let home = h, away = a;
        if (!isFinal) {
            const tierOf = id => { const c = Clubs.getClubById(id); return c ? c.tier : 99; };   // virtual minnows always host
            if (tierOf(h) < tierOf(a)) { home = a; away = h; }
        }
        const r = this.playMatch(home, away, compId, !isFinal);
        const tie = { h: home, a: away, hg: r.hg, ag: r.ag, winner: r.winner };
        // level after 90': a FINAL plays extra time (which may decide it); anything else goes
        // straight to penalties (no ET for ordinary cup rounds). See _extraTime / _penScore.
        if (r.hg === r.ag) {
            const et = isFinal ? this._extraTime(home, away) : { hg: 0, ag: 0 };
            if (et.hg !== et.ag) {
                tie.hg += et.hg; tie.ag += et.ag; tie.et = true;
                tie.winner = et.hg > et.ag ? home : away;
            } else {
                const [w, l] = this._penScore(); tie.pens = (r.winner === home) ? { h: w, a: l } : { h: l, a: w };
            }
        }
        // the final is a match the agent may be invited to attend (see js/attend.js). It runs the
        // clock to 120 whenever it went beyond 90 (extra time and/or pens).
        if (isFinal && typeof Attend !== 'undefined')
            Attend.consider('cup-final', compId, home, away, r, { pens: tie.pens, et: tie.et, winner: tie.winner, minutes: (tie.pens || tie.et) ? 120 : 90, score: { hg: tie.hg, ag: tie.ag } });
        return tie;
    },

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
            const t = this.playCupTie(h, a, 'FACUP', week === 47);
            ties.push(t); winners.push(t.winner);
        });
        F.remaining = winners;
        F.results.push({ week, round: this._facupRoundName(week), ties });
        if (week === 47 || F.remaining.length <= 1) F.winner = F.remaining[0];
    },

    // ---------------- Lower Leagues Cup (England: National League group stage + League One/Two) ----------------
    // The 24 National League clubs contest 8 groups of 3; the top two of each group (16) join the
    // 48 League One + League Two clubs for a 64-team knockout. The Championship is not involved.
    _buildLLC() {
        const nat = this.shuffle(Clubs.getClubsByDivision('Natleague').map(c => c.id)); // 24
        const groups = [];
        for (let g = 0; g < 8 && nat.length >= 3; g++) {
            const teams = [nat.pop(), nat.pop(), nat.pop()];
            groups.push({
                teams,
                table: teams.map(id => ({ clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0, cards: 0 })),
                fixtures: [[0, 1], [0, 2], [1, 2]],
                md: 0
            });
        }
        // League One + League Two enter directly at the first knockout round (48 clubs)
        const direct = ['LEAGUE1', 'LEAGUE2'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), []);
        return { groups, direct, results: [], remaining: [], groupDone: false, winner: null };
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
            // top two of each group (8×2 = 16) join the 48 League One/Two clubs -> 64-team knockout
            const qualifiers = C.groups.reduce((a, grp) => { const s = this._kSort(grp.table); return a.concat([s[0].clubId, s[1].clubId]); }, []);
            C.remaining = this.shuffle(qualifiers.concat(C.direct || []));
            C.groupDone = true;
        }
    },
    _llcRoundName(week) { return ({ 11: 'Round of 64', 15: 'Round of 32', 26: 'Round of 16', 32: 'Quarter-finals', 38: 'Semi-finals', 47: 'Final' })[week] || 'Round'; },
    llcKOStep(week) {
        const C = GameState.league.llc; if (!C || C.winner || !C.groupDone) return;
        const pairs = this._pairUp(this.shuffle(C.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); return; }
            const t = this.playCupTie(h, a, 'LLC', week === 47);
            ties.push(t); winners.push(t.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._llcRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
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
            const t = this.playCupTie(h, a, 'KBEK', week === 47);
            ties.push(t); winners.push(t.winner);
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
    // promoted clubs edge up in prestige, relegated clubs edge down — gently, so standings stay
    // coherent season to season. This is the ONLY thing that moves the anchor reputation, and
    // total anchor drift is capped at baseRep±10 so serial yo-yo clubs can't run away from their
    // division's reputation band (runtime reputation = anchor + fading client legacy).
    _repDrift(ups, downs) {
        const nudge = (id, dir) => {
            const c = Clubs.getClubById(id); if (!c) return;
            if (c.anchorRep == null) c.anchorRep = c.reputation;
            if (c.baseRep == null) c.baseRep = c.anchorRep;
            const lo = Math.max(20, c.baseRep - 10), hi = Math.min(95, c.baseRep + 10);
            const before = c.anchorRep;
            c.anchorRep = Math.max(lo, Math.min(hi, c.anchorRep + dir * 2));
            // the moving reputation shifts by the same amount, preserving any client-earned excess
            c.reputation = Math.max(20, Math.min(95, c.reputation + (c.anchorRep - before)));
        };
        (ups || []).forEach(id => nudge(id, +1));
        (downs || []).forEach(id => nudge(id, -1));
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
        this.applyPromotionRelegationItaly();
        this.applyPromotionRelegationFrance();
        this.applyPromotionRelegationPortugal();
        this.applyPromotionRelegationBelgium();
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
            const t = this.playCupTie(h, a, 'DFB', week === 47);
            ties.push(t); winners.push(t.winner);
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
            const t = this.playCupTie(h, a, 'LPOKAL', week === 47);
            ties.push(t); winners.push(t.winner);
        });
        P.remaining = winners;
        P.results.push({ week, round: this._lpokalRoundName(week), ties });
        if (week === 47 || P.remaining.length <= 1) P.winner = P.remaining[0];
    },

    // ---- German relegation: two-legged ties (higher seed hosts leg 2), penalties if level on aggregate ----
    // A two-legged tie, decomposed so the DECIDING leg (leg 2) can be intercepted and live-simmed
    // ("Attend the Final") while leg 1 is always quick-simmed. `_twoLeggedTie` composes the two and
    // is behaviourally identical to before — every existing caller is unaffected.
    _twoLeggedTie(aId, bId, comp) {
        return this._twoLeggedLeg2(this._twoLeggedLeg1(aId, bId, comp));
    },
    // Leg 1 (away for a). Returns the state the decider needs, with the first-leg score.
    _twoLeggedLeg1(aId, bId, comp) {
        const l1 = this.playMatch(bId, aId, comp, true);
        return { a: aId, b: bId, comp, leg1: { h: bId, a: aId, hg: l1.hg, ag: l1.ag } };
    },
    // Fold a single-match leg-2 result (r is oriented home = a) into the aggregate and settle the
    // tie. Kept separate from playing the match so an attended (live-simmed) leg 2 resolves the tie
    // through exactly this path — the result feeds season processing identically to a quick sim.
    _twoLeggedResolve(state, r) {
        const l1 = state.leg1;
        const aggA = l1.ag + r.hg, aggB = l1.hg + r.ag;
        let winner, pens = null;
        if (aggA > aggB) winner = state.a;
        else if (aggB > aggA) winner = state.b;
        else { const sA = this.clubStrength(state.a), sB = this.clubStrength(state.b); winner = (Math.random() < sA / (sA + sB)) ? state.a : state.b; const [w, l] = this._penScore(); pens = winner === state.a ? { winner, a: w, b: l } : { winner, a: l, b: w }; }
        return { a: state.a, b: state.b, leg1: l1, leg2: { h: state.a, a: state.b, hg: r.hg, ag: r.ag }, aggA, aggB, winner, pens };
    },
    // Leg 2 (home for a), quick-simmed, then resolved.
    _twoLeggedLeg2(state) {
        return this._twoLeggedResolve(state, this.playMatch(state.a, state.b, state.comp, true));
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
            const t = this.playCupTie(h, a, comp, week === 47);
            ties.push(t); winners.push(t.winner);
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
            const t = this.playCupTie(h, a, 'SCHWCUP', week === 47);
            ties.push(t); winners.push(t.winner);
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
            const t = this.playCupTie(h, a, 'CUPABASS', week === 47);
            ties.push(t); winners.push(t.winner);
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
                const t = this.playCupTie(h, a, 'LICHCUP', true);
                ties.push(t); winners.push(t.winner);
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

    // ================= ITALY =================
    // Coppa Italia (Serie A/B/C, 64 clubs) & Coppa Compagno (Serie B/C/D, 64 clubs): built with the
    // generic seeded-away cup builder (top-tier seeded, drawn away, kept apart in round 1; everyone
    // else drawn at random), then a standard single-leg knockout bracket. Same 6-round schedule as
    // the Spanish cups (64 clubs -> one fewer round than the 128-ish cups, so week 32 is skipped).
    _italianCupRoundName(week) {
        return ({ 4: 'Primo turno', 7: 'Secondo turno', 15: 'Ottavi di finale', 26: 'Quarti di finale', 38: 'Semifinali', 47: 'Finale' })[week] || 'Turno';
    },
    italianCupStep(key, week) {
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
        const comp = key === 'coppaitalia' ? 'COPPA' : 'COPPACOMP';
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const t = this.playCupTie(h, a, comp, week === 47);
            ties.push(t); winners.push(t.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._italianCupRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- Italian promotion play-off: two single-leg qualifiers feed two two-legged semi-finals
    // (each hosted by a directly-seeded regular-season finisher), then a two-legged final decided on
    // penalties if level. cfg gives 0-indexed final regular-season positions: sf1/sf2 are the seeded
    // semi-final hosts; qf1/qf2 are the [higher, lower] pairs whose winner meets sf1/sf2 respectively. ----
    _italianPromoSeries(div, cfg) {
        const order = this.sortedTable(div).map(r => r.clubId);
        const need = Math.max(cfg.sf1, cfg.sf2, cfg.qf1[0], cfg.qf1[1], cfg.qf2[0], cfg.qf2[1]) + 1;
        if (order.length < need) return null;
        const qf = (a, b) => { const r = this.playMatch(order[a], order[b], 'PO', true); return { h: order[a], a: order[b], hg: r.hg, ag: r.ag, winner: r.winner }; };   // higher seed hosts the single leg
        const qf1 = qf(cfg.qf1[0], cfg.qf1[1]);
        const qf2 = qf(cfg.qf2[0], cfg.qf2[1]);
        const sf1 = this._twoLeggedTie(order[cfg.sf1], qf1.winner, 'PO');   // seeded finisher hosts leg 2
        const sf2 = this._twoLeggedTie(order[cfg.sf2], qf2.winner, 'PO');
        const seed = id => order.indexOf(id);
        const a = seed(sf1.winner) <= seed(sf2.winner) ? sf1.winner : sf2.winner;   // higher regular-season finisher hosts final leg 2
        const b = a === sf1.winner ? sf2.winner : sf1.winner;
        const final = this._twoLeggedTie(a, b, 'PO');
        return { qf: [qf1, qf2], sf: [sf1, sf2], final, winner: final.winner };
    },
    playPlayoffsItaly() {
        const L = GameState.league;
        if (!L.tables.SerieA) return;
        // Serie B: 1-2 auto up; play-off among 3rd-8th (3rd/4th seeded into the semis, 6v7 & 5v8 qualifiers)
        L.playoffs.SerieB = this._italianPromoSeries('SerieB', { sf1: 2, qf1: [5, 6], sf2: 3, qf2: [4, 7] });
        // Serie C: 1-3 auto up; play-off among 4th-9th (4th/5th seeded, 7v8 & 6v9 qualifiers)
        L.playoffs.SerieC = this._italianPromoSeries('SerieC', { sf1: 3, qf1: [6, 7], sf2: 4, qf2: [5, 8] });
        // Serie D: 1-3 auto up; identical play-off shape to Serie C
        L.playoffs.SerieD = this._italianPromoSeries('SerieD', { sf1: 3, qf1: [6, 7], sf2: 4, qf2: [5, 8] });
    },
    // ---- Italian relegation play-out: two-legged, penalties if level, the loser is relegated ----
    _italianPlayout(div, aIdx, bIdx) {
        const order = this.sortedTable(div).map(r => r.clubId);
        if (order.length <= bIdx) return null;
        const tie = this._twoLeggedTie(order[aIdx], order[bIdx], 'PO');
        const relegated = tie.winner === order[aIdx] ? order[bIdx] : order[aIdx];
        return { tie, relegated };
    },
    playItalianPlayouts() {
        const L = GameState.league;
        if (!L.tables.SerieA) { L.italianPlayout = null; return; }
        L.italianPlayout = {
            SerieB: this._italianPlayout('SerieB', 15, 16),   // 16th v 17th (20-team table)
            SerieC: this._italianPlayout('SerieC', 19, 20)    // 20th v 21st (24-team table)
        };
    },

    applyPromotionRelegationItaly() {
        const L = GameState.league;
        if (!L.tables.SerieA) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const A = ord('SerieA'), B = ord('SerieB'), C = ord('SerieC'), D = ord('SerieD');
        const poW = d => (L.playoffs && L.playoffs[d]) ? L.playoffs[d].winner : null;
        const pout = d => (L.italianPlayout && L.italianPlayout[d]) ? L.italianPlayout[d].relegated : null;

        // Serie A: bottom 3 relegated directly (no Italian reserve sides exist, so no caps needed anywhere)
        const aDown = A.slice(-3);
        // Serie B: 2 auto + play-off winner up (3, matching A's 3 down); bottom 3 + play-out loser down (4)
        const bUp = [B[0], B[1], poW('SerieB')].filter(Boolean);
        const bDown = [...B.slice(-3), pout('SerieB')].filter(Boolean);
        // Serie C: 3 auto + play-off winner up (4, matching B's 4 down); bottom 3 + play-out loser down (4)
        const cUp = [C[0], C[1], C[2], poW('SerieC')].filter(Boolean);
        const cDown = [...C.slice(-3), pout('SerieC')].filter(Boolean);
        // Serie D: 3 auto + play-off winner up (4, matching C's 4 down); bottom rung — no relegation
        const dUp = [D[0], D[1], D[2], poW('SerieD')].filter(Boolean);

        const move = (arr, div) => arr.forEach(id => id != null && Clubs.setDivision(id, div));
        move(aDown, 'SerieB'); move(bUp, 'SerieA');
        move(bDown, 'SerieC'); move(cUp, 'SerieB');
        move(cDown, 'SerieD'); move(dUp, 'SerieC');

        this._repDrift([...bUp, ...cUp, ...dUp], [...aDown, ...bDown, ...cDown]);
        L.prorelIta = { aDown, bUp, bDown, cUp, cDown, dUp };
        return L.prorelIta;
    },

    // ---- seasonal form rolls: called at rollover BEFORE promotion/relegation is applied, so
    // expected/actual positions both refer to the season just finished. Expected position =
    // the club's reputation rank inside its country's full ladder (Bayern 1st in Germany, a
    // mid 2.Bundesliga side ~30th); actual = ladder position (higher divisions stacked on top,
    // then finishing position). Streaks of under/over-performing shift the roll tables. ----
    rollSeasonDeltas() {
        Object.entries(COUNTRY_DIVS).forEach(([country, divs]) => {
            if (!GameState.league || !GameState.league.tables[divs[0]]) return;
            // actual ladder position per club: division offset + table position
            const actualRank = {};
            let offset = 0;
            divs.forEach(div => {
                const table = this.sortedTable(div);
                table.forEach((row, i) => { actualRank[row.clubId] = offset + i + 1; });
                offset += table.length;
            });
            // expected position: reputation rank across the same set of clubs
            const clubs = Object.keys(actualRank).map(id => Clubs.getClubById(id)).filter(Boolean);
            const byRep = clubs.slice().sort((a, b) => b.reputation - a.reputation);
            const expectedRank = {};
            byRep.forEach((c, i) => { expectedRank[c.id] = i + 1; });

            clubs.forEach(c => {
                const under = actualRank[c.id] > expectedRank[c.id];   // finished below expectation
                const dir = under ? 'under' : 'over';
                c.streakLen = (c.streakDir === dir) ? (c.streakLen || 0) + 1 : 1;
                c.streakDir = dir;
                if (under) {
                    // 1st..5th under-season -> tables 1..5; the 6th resets to par and restarts
                    if (c.streakLen >= 6) { c.seasonDelta = 0; c.streakLen = 0; }
                    else c.seasonDelta = rollFromTable(c.streakLen - 1, false);
                } else {
                    // over-performing rolls only from the 2nd season on (inverted tables); the
                    // 7th consecutive over-season resets to par and restarts
                    if (c.streakLen === 1) c.seasonDelta = 0;
                    else if (c.streakLen >= 7) { c.seasonDelta = 0; c.streakLen = 0; }
                    else c.seasonDelta = rollFromTable(c.streakLen - 2, true);
                }
            });
        });
    },

    // ---- rollover reputation upkeep. Each club's roster-justified level is
    // anchor + Σ max(0, clientAbility − anchor)/11 over the agent's clients currently there
    // (current ability — talents growing at the club keep raising it, uncapped). Reputation
    // rises to that level promptly, but when the justified level drops (players left or
    // declined) it only fades by 1–5 points a season, never snapping down. ----
    normalizeReputations() {
        const boost = new Map();
        GameState.players.forEach(p => {
            if (p.agentId !== 'me' || p.archived) return;
            const cid = effectiveClubId(p); if (!cid) return;
            const c = Clubs.getClubById(cid); if (!c) return;
            const anchor = c.anchorRep != null ? c.anchorRep : c.reputation;
            boost.set(cid, (boost.get(cid) || 0) + Math.max(0, p.ability - anchor) / 11);
        });
        Clubs.allClubs.forEach(c => {
            if (c.anchorRep == null) c.anchorRep = c.reputation;
            const target = Math.round(Math.max(20, Math.min(95, c.anchorRep + (boost.get(c.id) || 0))));
            if (c.reputation < target) c.reputation = target;
            else if (c.reputation > target) c.reputation = Math.max(target, Math.round(c.reputation - (1 + Math.random() * 4)));
        });
    },

    // Match strength (world model): the club's moving reputation, plus this season's rolled
    // form delta, plus the live boost from any of the agent's clients in the squad. Direct —
    // no squad-average blending; NPC squads no longer factor into results at all.

    // ================= FRANCE =================
    // Coupe de France (128 entrants: all 100 league clubs + 28 random overseas virtual clubs).
    // 128 = 2^7, so the bracket runs cleanly to a 2-team final with no byes. All enter round 1;
    // Ligue 1 clubs are seeded so they can't meet each other in R1; in every round the
    // higher-division side is drawn away (playCupTie), and the final is on neutral ground.
    _buildCoupeFrance() {
        const league = ['Ligue1', 'Ligue2', 'Ligue3', 'Ligue4', 'Ligue5'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), []);
        const virt = this.shuffle(COUPEFR_VIRTUAL.map(v => v.id)).slice(0, 28);
        return { entrants: league.concat(virt), remaining: null, results: [], winner: null };
    },
    _coupeFranceRoundName(week) {
        return ({ 4: 'Premier tour', 7: 'Trente-deuxièmes de finale', 15: 'Seizièmes de finale', 26: 'Huitièmes de finale', 32: 'Quarts de finale', 38: 'Demi-finales', 47: 'Finale' })[week] || 'Tour';
    },
    coupeFranceStep(week) {
        const C = GameState.league.coupefrance; if (!C || C.winner) return;
        let pairs;
        if (C.remaining === null) {
            const l1 = new Set(Clubs.getClubsByDivision('Ligue1').map(c => c.id));
            const seeded = this.shuffle(C.entrants.filter(id => l1.has(id)));   // Ligue 1: kept apart
            const lower = this.shuffle(C.entrants.filter(id => !l1.has(id)));
            pairs = [];
            seeded.forEach(s => { const h = lower.pop(); pairs.push(h != null ? [h, s] : [s, null]); });
            while (lower.length >= 2) pairs.push([lower.pop(), lower.pop()]);
            if (lower.length) pairs.push([lower.pop(), null]);
        } else {
            pairs = this._pairUp(this.shuffle(C.remaining));
        }
        const isFinal = week === 47;
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const t = this.playCupTie(h, a, 'COUPEFR', isFinal);
            ties.push(t); winners.push(t.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._coupeFranceRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // Coupe National (64 clubs: all of Ligue 3, 4 and 5). No seeding; higher-division side away;
    // neutral final. A clean 64-team knockout over 6 rounds (skips week 32).
    _buildCoupeNational() { return { remaining: null, results: [], winner: null }; },
    _coupeNationalRoundName(week) {
        return ({ 4: 'Trente-deuxièmes', 7: 'Seizièmes', 15: 'Huitièmes', 26: 'Quarts', 38: 'Demi-finales', 47: 'Finale' })[week] || 'Tour';
    },
    coupeNationalStep(week) {
        const C = GameState.league.coupenational; if (!C || C.winner) return;
        let pairs;
        if (C.remaining === null) {
            const all = ['Ligue3', 'Ligue4', 'Ligue5'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), []);
            pairs = this._pairUp(this.shuffle(all));
        } else {
            pairs = this._pairUp(this.shuffle(C.remaining));
        }
        const isFinal = week === 47;
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const t = this.playCupTie(h, a, 'COUPENAT', isFinal);
            ties.push(t); winners.push(t.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._coupeNationalRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- French promotion mini-bracket: two single-leg games (higher-placed side hosts each)
    // feed the "Ligue X / Ligue Y" barrage. cfg.g1 = [higherIdx, lowerIdx] first game; its winner
    // then visits cfg.seed (the higher regular-season finisher, who hosts). ----
    _frenchPromoBracket(div, cfg) {
        const order = this.sortedTable(div).map(r => r.clubId);
        const need = Math.max(cfg.g1[0], cfg.g1[1], cfg.seed) + 1;
        if (order.length < need) return null;
        const leg = (homeId, awayId) => { const r = this.playMatch(homeId, awayId, 'PO', true); return { h: homeId, a: awayId, hg: r.hg, ag: r.ag, winner: r.winner }; };
        const g1 = leg(order[cfg.g1[0]], order[cfg.g1[1]]);
        const g2 = leg(order[cfg.seed], g1.winner);
        return { g1, g2, winner: g2.winner };
    },
    // ---- the barrage itself: two-legged (higher-division side hosts leg 2), penalties if level.
    // Winner plays in the higher division next season. ----
    _frenchBarrage(higherId, challengerId) { return this._twoLeggedTie(higherId, challengerId, 'PO'); },
    playPlayoffsFrance() {
        const L = GameState.league;
        if (!L.tables.Ligue1) return;
        L.playoffs.Ligue2 = this._frenchPromoBracket('Ligue2', { g1: [3, 4], seed: 2 });   // 5v4 -> v3
        L.playoffs.Ligue3 = this._frenchPromoBracket('Ligue3', { g1: [3, 4], seed: 2 });
        L.playoffs.Ligue4 = this._frenchPromoBracket('Ligue4', { g1: [4, 5], seed: 3 });   // 6v5 -> v4
        L.playoffs.Ligue5 = this._frenchPromoBracket('Ligue5', { g1: [5, 6], seed: 4 });   // 7v6 -> v5
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const L1 = ord('Ligue1'), L2 = ord('Ligue2'), L3 = ord('Ligue3'), L4 = ord('Ligue4');
        const bw = d => (L.playoffs[d] ? L.playoffs[d].winner : null);
        const bar = (defenderId, ch) => (defenderId && ch) ? this._frenchBarrage(defenderId, ch) : null;
        L.frenchBarrage = {
            L1L2: bar(L1[15], bw('Ligue2')),   // Ligue 1's 16th vs Ligue 2 bracket winner
            L2L3: bar(L2[15], bw('Ligue3')),   // Ligue 2's 16th vs Ligue 3 bracket winner
            L3L4: bar(L3[14], bw('Ligue4')),   // Ligue 3's 15th vs Ligue 4 bracket winner
            L4L5: bar(L4[17], bw('Ligue5')),   // Ligue 4's 18th vs Ligue 5 bracket winner
        };
    },

    applyPromotionRelegationFrance() {
        const L = GameState.league;
        if (!L.tables.Ligue1) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const L1 = ord('Ligue1'), L2 = ord('Ligue2'), L3 = ord('Ligue3'), L4 = ord('Ligue4'), L5 = ord('Ligue5');
        const bar = L.frenchBarrage || {};
        const bw = d => (L.playoffs && L.playoffs[d]) ? L.playoffs[d].winner : null;

        // direct movements
        const l1Down = [L1[16], L1[17]];
        const l2Up = [L2[0], L2[1]];
        const l2Down = [L2[16], L2[17]];
        const l3Up = [L3[0], L3[1]];
        const l3Down = [L3[15], L3[16], L3[17]];
        const l4Up = [L4[0], L4[1], L4[2]];
        const l4Down = [L4[18], L4[19], L4[20], L4[21]];
        const l5Up = [L5[0], L5[1], L5[2], L5[3]];

        // barrage crossings: the lower-division challenger only goes up (and the higher-division
        // defender down) when the challenger actually wins the two-legged tie
        const cross = (barTie, challengerId, defenderId) => (barTie && challengerId && barTie.winner === challengerId)
            ? { up: [challengerId], down: [defenderId] } : { up: [], down: [] };
        const c1 = cross(bar.L1L2, bw('Ligue2'), L1[15]);
        const c2 = cross(bar.L2L3, bw('Ligue3'), L2[15]);
        const c3 = cross(bar.L3L4, bw('Ligue4'), L3[14]);
        const c4 = cross(bar.L4L5, bw('Ligue5'), L4[17]);

        const move = (arr, div) => arr.forEach(id => id != null && Clubs.setDivision(id, div));
        move([...l1Down, ...c1.down], 'Ligue2'); move([...l2Up, ...c1.up], 'Ligue1');
        move([...l2Down, ...c2.down], 'Ligue3'); move([...l3Up, ...c2.up], 'Ligue2');
        move([...l3Down, ...c3.down], 'Ligue4'); move([...l4Up, ...c3.up], 'Ligue3');
        move([...l4Down, ...c4.down], 'Ligue5'); move([...l5Up, ...c4.up], 'Ligue4');

        this._repDrift(
            [...l2Up, ...c1.up, ...l3Up, ...c2.up, ...l4Up, ...c3.up, ...l5Up, ...c4.up],
            [...l1Down, ...c1.down, ...l2Down, ...c2.down, ...l3Down, ...c3.down, ...l4Down, ...c4.down]);
        L.prorelFra = { l1Down, l2Up, l2Down, l3Up, l3Down, l4Up, l4Down, l5Up,
            barrageUp: [...c1.up, ...c2.up, ...c3.up, ...c4.up], barrageDown: [...c1.down, ...c2.down, ...c3.down, ...c4.down] };
        return L.prorelFra;
    },

    // ================= PORTUGAL =================
    // ---- Taça de Portugal ----
    // Liga 4 (24) play a preliminary round; the 12 winners join the 52 non-reserve clubs of the top
    // three divisions (56 - 4 B sides) for a 64-team seeded knockout. The 18 Primeira Liga clubs are
    // seeded in that first main round (drawn away, kept apart); B/U21 sides are excluded entirely.
    _buildTacaPortugal() {
        const seeded = Clubs.getClubsByDivision('LigaPortugal').map(c => c.id);   // 18, none reserve
        const midlower = ['LigaPortugal2', 'Liga3'].reduce((a, d) => a.concat(
            Clubs.getClubsByDivision(d).filter(c => !isReserveClub(c.id)).map(c => c.id)), []);   // 15 + 19 = 34
        const liga4 = Clubs.getClubsByDivision('Liga4').map(c => c.id);   // 24
        return { seeded, midlower, prelim: this.shuffle(liga4), liga4winners: null, remaining: null, results: [], winner: null };
    },
    _tacaRoundName(week) {
        return ({ 4: 'Preliminary round', 7: 'First round', 15: 'Round of 32', 26: 'Round of 16', 32: 'Quarter-finals', 38: 'Semi-finals', 47: 'Final' })[week] || 'Round';
    },
    tacaPortugalStep(week) {
        const C = GameState.league.tacaportugal; if (!C || C.winner) return;
        const play = pairs => {
            const ties = [], winners = [];
            pairs.forEach(([h, a]) => {
                if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
                const t = this.playCupTie(h, a, 'TACAPT', week === 47); ties.push(t); winners.push(t.winner);
            });
            C.results.push({ week, round: this._tacaRoundName(week), ties });
            return winners;
        };
        if (week === 4) {
            // preliminary: the 24 Liga 4 sides among themselves -> 12 winners (held aside for the main draw)
            C.liga4winners = play(this._pairUp(this.shuffle(C.prelim.slice())));
            return;
        }
        let pairs;
        if (week === 7) {
            // first main round of 64: Primeira seeded (drawn away, kept apart) vs everyone else
            const seeded = this.shuffle(C.seeded.slice());
            const unseeded = this.shuffle(C.midlower.concat(C.liga4winners || []));
            pairs = [];
            seeded.forEach(s => { const h = unseeded.pop(); pairs.push(h != null ? [h, s] : [s, null]); });   // seeded drawn away
            while (unseeded.length >= 2) pairs.push([unseeded.pop(), unseeded.pop()]);
            if (unseeded.length) pairs.push([unseeded.pop(), null]);
        } else {
            pairs = this._pairUp(this.shuffle(C.remaining));
        }
        C.remaining = play(pairs);
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },
    // ---- Segunda Taça: the 62 clubs of divisions 2-4 (B sides included) + 2 random virtual amateurs
    // (rep 18) = a clean 64, played as a straight knockout (no seeding). ----
    _buildSegundaTaca() {
        const clubs = ['LigaPortugal2', 'Liga3', 'Liga4'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), []);   // 62
        const virtuals = this.shuffle(SEGTACA_VIRTUAL.map(v => v.id)).slice(0, 2);
        return { remaining: this.shuffle(clubs.concat(virtuals)), results: [], winner: null };
    },
    _segundaTacaRoundName(week) {
        return ({ 4: '1ª Eliminatória', 7: '2ª Eliminatória', 15: 'Oitavos de final', 26: 'Quartos de final', 38: 'Meias-finais', 47: 'Final' })[week] || 'Eliminatória';
    },
    segundaTacaStep(week) {
        const C = GameState.league.segundataca; if (!C || C.winner) return;
        const pairs = this._pairUp(this.shuffle(C.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const t = this.playCupTie(h, a, 'SEGTACA', week === 47); ties.push(t); winners.push(t.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._segundaTacaRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- Portuguese play-offs (computed at week 46, applied at rollover). Each tie is two-legged
    // (better-placed / higher-division side hosts leg 2), decided on penalties if level:
    //   · Liga Portugal play-off:   Primeira 16th vs Liga 2's best non-reserve 3rd -> winner in Primeira
    //   · Liga Portugal 2 play-off: Liga 2 16th   vs Liga 3 3rd                     -> winner in Liga 2
    //   · Liga 3 play-off (3 rounds): SF-A Liga 4 3rd v 4th, SF-B Liga 3 17th v 18th;
    //       the loser of SF-B meets the winner of SF-A in a two-legged final        -> winner in Liga 3
    playPlayoffsPortugal() {
        const L = GameState.league;
        if (!L.tables.LigaPortugal) return;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const P1 = ord('LigaPortugal'), P2 = ord('LigaPortugal2'), P3 = ord('Liga3'), P4 = ord('Liga4');
        const P2prom = P2.filter(id => !isReserveClub(id));   // B sides can't chase a Primeira place
        const lpPlayoff = (P1.length >= 16 && P2prom.length >= 3) ? this._twoLeggedTie(P1[15], P2prom[2], 'PO') : null;
        const lp2Playoff = (P2.length >= 16 && P3.length >= 3) ? this._twoLeggedTie(P2[15], P3[2], 'PO') : null;
        let liga3PO = null;
        if (P3.length >= 18 && P4.length >= 4) {
            const sfA = this._twoLeggedTie(P4[2], P4[3], 'PO');     // Liga 4: 3rd (higher) hosts leg 2
            const sfB = this._twoLeggedTie(P3[16], P3[17], 'PO');   // Liga 3: 17th (higher) hosts leg 2
            const loserB = sfB.winner === P3[16] ? P3[17] : P3[16];
            const final = this._twoLeggedTie(loserB, sfA.winner, 'PO');   // Liga 3 side (higher) hosts leg 2
            liga3PO = { sfA, sfB, winnerA: sfA.winner, loserB, final, winner: final.winner };
        }
        L.ptPlayoffs = { lpPlayoff, lp2Playoff, liga3PO, lpChallenger: P2prom[2] || null, lp2Challenger: P3[2] || null };
    },
    applyPromotionRelegationPortugal() {
        const L = GameState.league;
        if (!L.tables.LigaPortugal) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const P1 = ord('LigaPortugal'), P2 = ord('LigaPortugal2'), P3 = ord('Liga3'), P4 = ord('Liga4');
        const P2prom = P2.filter(id => !isReserveClub(id));
        const PO = L.ptPlayoffs || {};

        // Tier 1 <-> Tier 2
        const p1Down = [P1[16], P1[17]];
        const p2Up = [P2prom[0], P2prom[1]];
        const lpW = PO.lpPlayoff ? PO.lpPlayoff.winner : null, lpCh = P2prom[2], lpDef = P1[15];
        const lp = (lpW && lpW === lpCh) ? { up: [lpCh], down: [lpDef] } : { up: [], down: [] };

        // Tier 2 <-> Tier 3
        const p2Down = [P2[16], P2[17]];
        const p3Up = [P3[0], P3[1]];   // B sides may promote here — only a Primeira place is barred
        const lp2W = PO.lp2Playoff ? PO.lp2Playoff.winner : null, lp2Ch = P3[2], lp2Def = P2[15];
        const lp2 = (lp2W && lp2W === lp2Ch) ? { up: [lp2Ch], down: [lp2Def] } : { up: [], down: [] };

        // Tier 3 <-> Tier 4
        const p3Down = [P3[18], P3[19]];
        const p4Up = [P4[0], P4[1]];
        const l3po = PO.liga3PO || null;
        let l3 = { up: [], down: [] };
        if (l3po && l3po.winner === l3po.winnerA) l3 = { up: [l3po.winnerA], down: [l3po.loserB] };

        const move = (arr, div) => arr.forEach(id => id != null && Clubs.setDivision(id, div));
        move([...p1Down, ...lp.down], 'LigaPortugal2'); move([...p2Up, ...lp.up], 'LigaPortugal');
        move([...p2Down, ...lp2.down], 'Liga3');        move([...p3Up, ...lp2.up], 'LigaPortugal2');
        move([...p3Down, ...l3.down], 'Liga4');         move([...p4Up, ...l3.up], 'Liga3');

        this._repDrift(
            [...p2Up, ...lp.up, ...p3Up, ...lp2.up, ...p4Up, ...l3.up],
            [...p1Down, ...lp.down, ...p2Down, ...lp2.down, ...p3Down, ...l3.down]);
        L.prorelPt = { p1Down, p2Up, p2Down, p3Up, p3Down, p4Up,
            lpUp: lp.up, lpDown: lp.down, lp2Up: lp2.up, lp2Down: lp2.down, l3poUp: l3.up, l3poDown: l3.down };
        return L.prorelPt;
    },

    // ================= BELGIUM =================
    // Same ladder shape as Portugal (18/18/20/24, three tiered play-offs), so the pro/rel logic mirrors it.
    // ---- Belgian Cup ----
    // The 24 Belgian Division 2 clubs play 8 groups of 3 (single round robin); the 8 group winners join
    // the 56 clubs of the top three divisions (B sides included) for a 64-team seeded knockout. The 18
    // Jupiler Pro League clubs are seeded in the first knockout round (drawn away, kept apart).
    _buildBelgianCup() {
        const div2 = this.shuffle(Clubs.getClubsByDivision('BelgianDivision2').map(c => c.id));   // 24
        const groups = [];
        for (let g = 0; g < 8 && div2.length >= 3; g++) {
            const teams = [div2.pop(), div2.pop(), div2.pop()];
            groups.push({ teams, table: teams.map(id => ({ clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0, cards: 0 })), fixtures: [[0, 1], [0, 2], [1, 2]], md: 0 });
        }
        const seeded = Clubs.getClubsByDivision('JupilerProLeague').map(c => c.id);   // 18
        const midlower = ['ChallengerProLeague', 'BelgianDivision1'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), []);   // 18 + 20 = 38
        return { groups, seeded, midlower, remaining: null, results: [], groupDone: false, winner: null };
    },
    _belgianGroupFixture(grp) {
        if (grp.md >= grp.fixtures.length) return;
        const [i, j] = grp.fixtures[grp.md];
        const h = grp.teams[i], a = grp.teams[j];
        const r = this.playMatch(h, a, 'BELCUP', true);
        const rh = grp.table.find(x => x.clubId === h), ra = grp.table.find(x => x.clubId === a);
        rh.P++; ra.P++; rh.GF += r.hg; rh.GA += r.ag; ra.GF += r.ag; ra.GA += r.hg;
        if (r.hg > r.ag) { rh.W++; ra.L++; rh.Pts += 3; } else if (r.hg < r.ag) { ra.W++; rh.L++; ra.Pts += 3; } else { rh.D++; ra.D++; rh.Pts++; ra.Pts++; }
        rh.cards += Math.floor(Math.random() * 4); ra.cards += Math.floor(Math.random() * 4);
        grp.md++;
    },
    _belgianCupRoundName(week) {
        return ({ 4: 'Group stage', 7: 'Round of 64', 15: 'Round of 32', 26: 'Round of 16', 32: 'Quarter-finals', 38: 'Semi-finals', 47: 'Final' })[week] || 'Round';
    },
    belgianCupStep(week) {
        const C = GameState.league.belgiancup; if (!C || C.winner) return;
        if (week === 4) {   // whole group phase (all three fixtures per group) resolved in one weekend
            C.groups.forEach(grp => { while (grp.md < grp.fixtures.length) this._belgianGroupFixture(grp); });
            C.groupDone = true;
            return;
        }
        let pairs;
        if (week === 7) {
            const winners = C.groups.map(grp => this._kSort(grp.table)[0].clubId);   // 8 group winners
            const seeded = this.shuffle(C.seeded.slice());
            const unseeded = this.shuffle(C.midlower.concat(winners));
            pairs = [];
            seeded.forEach(s => { const h = unseeded.pop(); pairs.push(h != null ? [h, s] : [s, null]); });   // seeded drawn away
            while (unseeded.length >= 2) pairs.push([unseeded.pop(), unseeded.pop()]);
            if (unseeded.length) pairs.push([unseeded.pop(), null]);
        } else {
            pairs = this._pairUp(this.shuffle(C.remaining));
        }
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const t = this.playCupTie(h, a, 'BELCUP', week === 47); ties.push(t); winners.push(t.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._belgianCupRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },
    // ---- Notre Coupe: the 62 clubs of divisions 2-4 (B sides included) + 2 random virtual amateurs
    // (rep 18) = a clean 64, played as a straight knockout (no seeding). ----
    _buildNotreCoupe() {
        const clubs = ['ChallengerProLeague', 'BelgianDivision1', 'BelgianDivision2'].reduce((a, d) => a.concat(Clubs.getClubsByDivision(d).map(c => c.id)), []);   // 62
        const virtuals = this.shuffle(NOTRECOUPE_VIRTUAL.map(v => v.id)).slice(0, 2);
        return { remaining: this.shuffle(clubs.concat(virtuals)), results: [], winner: null };
    },
    _notreCoupeRoundName(week) {
        return ({ 4: '1er Tour', 7: '2e Tour', 15: 'Huitièmes de finale', 26: 'Quarts de finale', 38: 'Demi-finales', 47: 'Finale' })[week] || 'Tour';
    },
    notreCoupeStep(week) {
        const C = GameState.league.notrecoupe; if (!C || C.winner) return;
        const pairs = this._pairUp(this.shuffle(C.remaining));
        const ties = [], winners = [];
        pairs.forEach(([h, a]) => {
            if (a == null) { winners.push(h); ties.push({ h, a: null, bye: true }); return; }
            const t = this.playCupTie(h, a, 'NOTRECOUPE', week === 47); ties.push(t); winners.push(t.winner);
        });
        C.remaining = winners;
        C.results.push({ week, round: this._notreCoupeRoundName(week), ties });
        if (week === 47 || C.remaining.length <= 1) C.winner = C.remaining[0];
    },

    // ---- Belgian play-offs (computed at week 46, applied at rollover) — identical structure to Portugal:
    //   · Pro League play-off:         Pro League 16th vs Challenger's best non-reserve 3rd -> winner in Pro League
    //   · Challenger Pro League play-off: Challenger 16th vs Division 1 3rd                  -> winner in Challenger
    //   · Division 1 play-off (3 rounds): SF-A Div 2 3rd v 4th, SF-B Div 1 17th v 18th;
    //       the loser of SF-B meets the winner of SF-A in a two-legged final                -> winner in Division 1
    playPlayoffsBelgium() {
        const L = GameState.league;
        if (!L.tables.JupilerProLeague) return;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const P1 = ord('JupilerProLeague'), P2 = ord('ChallengerProLeague'), P3 = ord('BelgianDivision1'), P4 = ord('BelgianDivision2');
        const P2prom = P2.filter(id => !isReserveClub(id));   // B sides can't chase a Pro League place
        const proPlayoff = (P1.length >= 16 && P2prom.length >= 3) ? this._twoLeggedTie(P1[15], P2prom[2], 'PO') : null;
        const cplPlayoff = (P2.length >= 16 && P3.length >= 3) ? this._twoLeggedTie(P2[15], P3[2], 'PO') : null;
        let d1PO = null;
        if (P3.length >= 18 && P4.length >= 4) {
            const sfA = this._twoLeggedTie(P4[2], P4[3], 'PO');     // Div 2: 3rd (higher) hosts leg 2
            const sfB = this._twoLeggedTie(P3[16], P3[17], 'PO');   // Div 1: 17th (higher) hosts leg 2
            const loserB = sfB.winner === P3[16] ? P3[17] : P3[16];
            const final = this._twoLeggedTie(loserB, sfA.winner, 'PO');   // Div 1 side (higher) hosts leg 2
            d1PO = { sfA, sfB, winnerA: sfA.winner, loserB, final, winner: final.winner };
        }
        L.bePlayoffs = { proPlayoff, cplPlayoff, d1PO, proChallenger: P2prom[2] || null, cplChallenger: P3[2] || null };
    },
    applyPromotionRelegationBelgium() {
        const L = GameState.league;
        if (!L.tables.JupilerProLeague) return null;
        const ord = d => this.sortedTable(d).map(r => r.clubId);
        const P1 = ord('JupilerProLeague'), P2 = ord('ChallengerProLeague'), P3 = ord('BelgianDivision1'), P4 = ord('BelgianDivision2');
        const P2prom = P2.filter(id => !isReserveClub(id));
        const PO = L.bePlayoffs || {};

        // Tier 1 <-> Tier 2
        const p1Down = [P1[16], P1[17]];
        const p2Up = [P2prom[0], P2prom[1]];
        const proW = PO.proPlayoff ? PO.proPlayoff.winner : null, proCh = P2prom[2], proDef = P1[15];
        const pro = (proW && proW === proCh) ? { up: [proCh], down: [proDef] } : { up: [], down: [] };

        // Tier 2 <-> Tier 3
        const p2Down = [P2[16], P2[17]];
        const p3Up = [P3[0], P3[1]];   // B sides may promote here — only a Pro League place is barred
        const cplW = PO.cplPlayoff ? PO.cplPlayoff.winner : null, cplCh = P3[2], cplDef = P2[15];
        const cpl = (cplW && cplW === cplCh) ? { up: [cplCh], down: [cplDef] } : { up: [], down: [] };

        // Tier 3 <-> Tier 4
        const p3Down = [P3[18], P3[19]];
        const p4Up = [P4[0], P4[1]];
        const d1po = PO.d1PO || null;
        let d1 = { up: [], down: [] };
        if (d1po && d1po.winner === d1po.winnerA) d1 = { up: [d1po.winnerA], down: [d1po.loserB] };

        const move = (arr, div) => arr.forEach(id => id != null && Clubs.setDivision(id, div));
        move([...p1Down, ...pro.down], 'ChallengerProLeague'); move([...p2Up, ...pro.up], 'JupilerProLeague');
        move([...p2Down, ...cpl.down], 'BelgianDivision1');    move([...p3Up, ...cpl.up], 'ChallengerProLeague');
        move([...p3Down, ...d1.down], 'BelgianDivision2');     move([...p4Up, ...d1.up], 'BelgianDivision1');

        this._repDrift(
            [...p2Up, ...pro.up, ...p3Up, ...cpl.up, ...p4Up, ...d1.up],
            [...p1Down, ...pro.down, ...p2Down, ...cpl.down, ...p3Down, ...d1.down]);
        L.prorelBe = { p1Down, p2Up, p2Down, p3Up, p3Down, p4Up,
            proUp: pro.up, proDown: pro.down, cplUp: cpl.up, cplDown: cpl.down, d1poUp: d1.up, d1poDown: d1.down };
        return L.prorelBe;
    },

    clubStrength(clubId) {
        const c = Clubs.getClubById(clubId);
        if (!c) { const v = findVirtualClub(clubId); return v ? v.reputation : 50; }
        const base = c.reputation + (c.seasonDelta || 0);
        return base + clientStrengthBonus(clubId, base);
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
        else if ([11, 15, 26, 32, 38, 47].includes(week) && L.llc) this.llcKOStep(week);

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

        // Italian cups: both are 64 clubs, so 6 rounds skipping week 32 like the Spanish/Cupa Bass cups
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.coppaitalia) this.italianCupStep('coppaitalia', week);
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.coppacompagno) this.italianCupStep('coppacompagno', week);

        // French cups: Coupe de France is 124 clubs -> 7 rounds (uses week 32); Coupe National
        // is a clean 64 -> 6 rounds (skips week 32)
        if ([4, 7, 15, 26, 32, 38, 47].includes(week) && L.coupefrance) this.coupeFranceStep(week);
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.coupenational) this.coupeNationalStep(week);

        // Portuguese cups: Taça de Portugal has a Liga 4 preliminary (wk4) then a 64-team seeded
        // knockout using week 32; the Segunda Taça is a clean 64 -> 6 rounds, skipping week 32
        if ([4, 7, 15, 26, 32, 38, 47].includes(week) && L.tacaportugal) this.tacaPortugalStep(week);
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.segundataca) this.segundaTacaStep(week);

        // Belgian cups: the Belgian Cup runs a Division 2 group phase (wk4) then a 64-team seeded
        // knockout using week 32; Notre Coupe is a clean 64 -> 6 rounds, skipping week 32
        if ([4, 7, 15, 26, 32, 38, 47].includes(week) && L.belgiancup) this.belgianCupStep(week);
        if ([4, 7, 15, 26, 38, 47].includes(week) && L.notrecoupe) this.notreCoupeStep(week);

        if (week === 46 && L.playoffs && !L.playoffs._done) { this.playPlayoffs(); this.playPlayoffsEngland(); this.playGermanRelegation(); this.playPlayoffsSpain(); this.playSwissBarrages(); this.playPlayoffsSwiss(); this.playPlayoffsItaly(); this.playItalianPlayouts(); this.playPlayoffsFrance(); this.playPlayoffsPortugal(); this.playPlayoffsBelgium(); L.playoffs._done = true; }

        // UEFA club competitions (UCL/UEL/UECL) run in parallel all season — qualifying wk1-6,
        // league phase wk11-31, knockouts wk34-48. See js/europe.js.
        if (typeof Europe !== 'undefined' && L.europe) Europe.step(week);
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
        // home edge: +6 in leagues/play-offs, +8 in cups (one-off knockout nights swing harder)
        const advSize = (COMPETITIONS[compId] && COMPETITIONS[compId].type === 'cup') ? 8 : 6;
        const sh = this.clubStrength(homeId) + (homeAdv ? advSize : 0);
        const sa = this.clubStrength(awayId);
        const hg = this.scoreGoals(sh, sa);
        const ag = this.scoreGoals(sa, sh);
        const homeAppear = this.assignStats(homeId, compId, hg, ag);
        const awayAppear = this.assignStats(awayId, compId, ag, hg);
        let winner = homeId;
        if (ag > hg) winner = awayId;
        else if (hg === ag) winner = (sh + Math.random() * 6) >= (sa + Math.random() * 6) ? homeId : awayId;
        // homeAppear/awayAppear are undefined for clubs this save doesn't model in detail; only the
        // live sim reads them (see assignStats), every other caller uses hg/ag/winner as before.
        return { hg, ag, winner, homeAppear, awayAppear };
    },

    scoreGoals(att, def) {
        const lambda = Math.max(0.2, 1.3 + (att - def) / 22);
        let g = 0; const p = Math.exp(-lambda); let cum = p, x = Math.random(), term = p, k = 0;
        while (x > cum && k < 8) { k++; term *= lambda / k; cum += term; g = k; }
        return g;
    },

    assignStats(clubId, compId, scored, conceded) {
        const year = GameState.seasonStartYear;
        // world model: only clubs hosting a sim-relevant player (client / ex-client / scouted
        // prospect) get their match dressed in player detail — for everyone else the result is
        // enough, and NPC stat buckets (which nobody could ever view) stop accumulating
        const squad = relevantSquads().get(clubId);
        if (!squad || !squad.length) return;

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

        // squad role decides how often a player features — but a loaned-in player follows the role his
        // loan deal guaranteed (a youth prospect loaned out as a star plays like a star at the loan club)
        const baseRole = pl => (pl.onLoanAt === clubId ? (pl.loanRole || 'starter') : pl.squadRole);
        // Form beats the depth chart. A squad player on a genuine scoring run (think 10 in 12), or
        // one simply playing out of his skin, picks himself: no manager leaves him out because of
        // what the pre-season pecking order said. One step up the ladder only.
        //
        // Judged on his last dozen appearances (RECENT_FORM_WINDOW), never on season totals: a run
        // is a run whether it started in March or September, and a rotation player would need half
        // a season just to accumulate enough season stats to qualify — then lose it all again in
        // August. The window also handles the lapse for free, as cold games push the hot ones out.
        // The scoring bar sits well above what a striker manages simply by being a striker; a goal
        // every other game is a good season, not a run of form.
        const HOT_STEP = { youth: 'rotation', fringe: 'rotation', rotation: 'starter', starter: 'key', key: 'key' };
        const effRole = pl => {
            const r = baseRole(pl), rec = pl._recent;
            if (!rec || rec.length < 5) return r;
            const perGame = rec.reduce((s, x) => s + x.g + x.a * 0.6, 0) / rec.length;
            // a scoring run speaks for itself quickly; "he's been playing well" needs a real sample
            const hot = perGame >= 0.75 || (rec.length >= 10 && rec.reduce((s, x) => s + x.r, 0) / rec.length >= 7.6);
            return hot ? (HOT_STEP[r] || r) : r;
        };

        const outfield = rest.filter(p => p !== bestGK)
            .map(p => ({ p, w: (ROLE_PLAYTIME[effRole(p)] ?? 0.4) * 3 + p.ability / 80 + Math.random() * 0.8 }))
            .sort((a, b) => b.w - a.w).map(x => x.p);

        const starters = [];
        if (bestGK) starters.push(bestGK);
        guaranteed.forEach(p => { if (starters.length < 11) starters.push(p); });
        for (const p of outfield) { if (starters.length >= 11) break; starters.push(p); }

        const ATTEND = { key: 0.95, starter: 0.82, rotation: 0.26, fringe: 0.16, youth: 0.08 };
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
        // A club always fields eleven, but only the players this save actually models turn up in
        // `appear`. Whatever is missing from the XI still scores its share, so give the unmodelled
        // remainder its own weight in the draw. Without this, a club whose background squad has
        // thinned out funnels EVERY goal it scores into the one tracked player on the pitch — which
        // is how full-backs ended up with 40+ goal seasons. A full XI has no ghosts, so healthy
        // clubs are completely unaffected.
        const ghostClub = Clubs.getClubById(clubId);
        const ghostAb = 0.5 + ((ghostClub ? ghostClub.reputation : 45) / 100);
        const ghosts = Math.max(0, 11 - appear.length);
        const ghostG = ghosts * 0.45 * ghostAb;   // ~ the average outfielder's goal weight
        const ghostA = ghosts * 0.50 * ghostAb;   // ~ the average outfielder's assist weight
        for (let i = 0; i < scored; i++) {
            const total = appear.reduce((s, a) => s + wG(a), 0) + ghostG || 1;
            let r = Math.random() * total, pick = null;
            for (const a of appear) { r -= wG(a); if (r <= 0) { pick = a; break; } }
            if (!pick) continue;   // an unmodelled team-mate scored — nothing to record
            pick.g += 1;
            if (Math.random() < 0.7) {
                const others = appear.filter(a => a !== pick);
                const t2 = others.reduce((s, a) => s + wA(a) + 0.05, 0) + ghostA;
                if (t2 > 0) {
                    let r2 = Math.random() * t2, as = null;
                    for (const a of others) { r2 -= (wA(a) + 0.05); if (r2 <= 0) { as = a; break; } }
                    if (as) as.a += 1;   // otherwise an unmodelled team-mate laid it on
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
                c.red += 1; a.red = 1;
                p._suspended = (p._suspended || 0) + 1;                 // straight red -> one-match ban
            } else if (rr < yRate) {
                c.yellow += 1; a.yellow = 1;
                p._yellowsSeason = (p._yellowsSeason || 0) + 1;
                if (p._yellowsSeason % 5 === 0) p._suspended = (p._suspended || 0) + 1;  // 5th, 10th, 15th... yellow -> ban
            }
            // A rating measures you against the level you're playing at, not against a fixed
            // scale: holding your own at your own club's level is an unremarkable 6.6 season, and
            // a big average is earned by being better than the company you keep (or by scoring).
            // Keying this off raw ability instead meant anyone halfway decent averaged 7.5
            // everywhere. A season at your own level can still be exceptional — that's what the
            // form draw is for — it just isn't the default.
            let rating = 6.55 + levelGapRating(p.ability - (ghostClub ? ghostClub.reputation : 50)) + resultBonus + a.g * 1.0 + a.a * 0.55;
            if (conceded === 0 && (p.position === 'GK' || p.position === 'CB' || p.position === 'LB' || p.position === 'RB')) rating += 0.6;
            if (conceded >= 3 && (p.position === 'GK' || p.position === 'CB')) rating -= 0.45;
            rating += PlayerGen.gauss(0, 0.62);        // match to match: some days it just doesn't click
            rating += formBiasOf(p);                   // this season's form, and his temperament
            rating += moraleRatingMod(moraleAvg(p));   // derived from avg morale only — never a single dimension
            rating = Math.max(4.0, Math.min(10, rating));
            c.ratingSum += rating; a.rating = rating;
            // rolling recent form (see effRole): the last dozen appearances, oldest dropping off
            p._recent = p._recent || [];
            p._recent.push({ g: a.g, a: a.a, r: Math.round(rating * 10) / 10 });
            if (p._recent.length > RECENT_FORM_WINDOW) p._recent.splice(0, p._recent.length - RECENT_FORM_WINDOW);
        });
        // Who played and what they did. The live sim ("Attend the Final") choreographs its
        // commentary to THIS, rather than deciding anything itself — that is what keeps an
        // attended match's stats identical to a quick-simmed one, and keeps the position/style
        // weighting above in charge of who scores. Quick sims ignore the return value.
        return appear;
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
        if (L.coppaitalia && L.coppaitalia.winner) this.awardTrophy(L.coppaitalia.winner, 'COPPA', year, awarded);
        if (L.coppacompagno && L.coppacompagno.winner) this.awardTrophy(L.coppacompagno.winner, 'COPPACOMP', year, awarded);
        if (L.coupefrance && L.coupefrance.winner) this.awardTrophy(L.coupefrance.winner, 'COUPEFR', year, awarded);
        if (L.coupenational && L.coupenational.winner) this.awardTrophy(L.coupenational.winner, 'COUPENAT', year, awarded);
        if (L.tacaportugal && L.tacaportugal.winner) this.awardTrophy(L.tacaportugal.winner, 'TACAPT', year, awarded);
        if (L.segundataca && L.segundataca.winner) this.awardTrophy(L.segundataca.winner, 'SEGTACA', year, awarded);
        if (L.belgiancup && L.belgiancup.winner) this.awardTrophy(L.belgiancup.winner, 'BELCUP', year, awarded);
        if (L.notrecoupe && L.notrecoupe.winner) this.awardTrophy(L.notrecoupe.winner, 'NOTRECOUPE', year, awarded);
        // UEFA competitions — the finals are played in week 47, before this runs
        if (L.europe && L.europe.comps) ['UCL', 'UEL', 'UECL'].forEach(k => {
            const c = L.europe.comps[k];
            if (c && c.ko && c.ko.winner) this.awardTrophy(c.ko.winner, k, year, awarded);
        });
        L.finished = true;
        return awarded;
    },

    awardTrophy(clubId, compId, year, awarded) {
        const winners = GameState.players.filter(p => {
            const s = p.stats[year]; if (!s) return false;
            return Object.values(s).some(st => st.clubId === clubId && !st.youth);
        });
        const clientWinners = [];
        winners.forEach(p => {
            p.trophies.push({ year, compId, clubId });
            if (p.agentId === 'me') {
                clientWinners.push(p.id);
                if (p.morale) { p.morale.club = Math.min(100, p.morale.club + MORALE.TROPHY_CLUB); p.morale.agent = Math.min(100, p.morale.agent + MORALE.TROPHY_AGENT); }
            }
        });
        awarded.push({ clubId, compId, clients: clientWinners });
    }
};
