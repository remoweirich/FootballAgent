// ============================================================
//  International football: every number in one place (docs/international.md).
//  Nations are in js/nations.js; the engine is js/internationals.js.
// ============================================================
const INTL_CONFIG = {
    // International football exists from this season on (2026-27, after the 2026 World Cup).
    // Earlier seasons have none; a save in 2025-26 starts it at the rollover.
    FIRST_SEASON: 2026,

    // ---- calendar ----
    // A match week has two slots: A (~Thursday) and B (~Sunday). A team plays at most once per slot.
    DRAW_WEEK: 3,                                   // Nations League / qualifier draw
    MATCHDAYS: [                                    // group matchdays 1-6 (both formats): one, then two, in each window
        { week: 11, slot: 'A' },
        { week: 12, slot: 'A' }, { week: 12, slot: 'B' },
        { week: 17, slot: 'A' },
        { week: 18, slot: 'A' }, { week: 18, slot: 'B' },
    ],
    // the international breaks: no club football, "International break" on the Home week card
    BREAK_WEEKS: [11, 12, 17, 18, 36, 37],
    GROUPS_DONE_WEEK: 18,                           // qualification read off the tables after MD6
    ROUND_DRAW_WEEK: 19,                            // NL quarter-final + play-off draw / qualifier play-off draw
    LEG1_WEEK: 36,                                  // NL QF + promotion play-offs leg 1 / qualifier play-off semis
    LEG2_WEEK: 37,                                  // second legs / qualifier play-off finals
    FINALS_DRAW_WEEK: 38,                           // NL Finals draw + host / final tournament draw
    NL_FINALS_WEEK: 49,                             // semis in slot A, 3rd place + final in slot B
    // the tournament window: days 0-5 = weeks 49, 50, 51, 52 of season N, then 1, 2 of season N+1.
    // It belongs to season N; the final is in week 2.
    TOURNAMENT_WEEKS: [49, 50, 51, 52, 1, 2],
    // hosts of the tournament played at the end of season T are drawn in week 1 of season T - 1
    HOST_DRAW_WEEK: 1,
    HOST_DRAW_SEASONS_BEFORE: 1,

    // ---- match engine ----
    HOME_ADVANTAGE: 6,                              // added to the home side's reputation-strength

    // ---- Nations League ----
    NL_LEAGUES: ['A', 'B', 'C'],
    NL_LEAGUE_SIZE: 18,                             // 3 groups of 6
    NL_QF_THIRDS: 2,                                // best third-placed teams joining 3 winners + 3 runners-up

    // ---- European Qualifiers ----
    QUAL_L1_SIZE: 36,                               // seeding ranks 1-36: 3 groups of 12
    QUAL_L2_SIZE: 18,                               // seeding ranks 37-54: 3 groups of 6
    // Qualifier results re-order the seeding ranking within each Nations League league (league
    // membership itself only changes through Nations League promotion/relegation). See docs.
    QUALIFIERS_RESEED: true,
    PROHIBITED_PAIRS: [['esp', 'gib'], ['srb', 'kos'], ['bih', 'kos'], ['arm', 'aze'], ['ukr', 'blr']],

    // ---- World Cup (48) ----
    WC_TEAMS: 48,
    WC_UEFA: 16,
    WC_UEFA_DIRECT_PER_GROUP: 4,                    // top 4 non-host in each League 1 group
    WC_DIRECT: { AFC: 8, CAF: 9, CONCACAF: 6, CONMEBOL: 6, OFC: 1 },   // hosts are deducted from their own
    WC_IC_ENTRANTS: { AFC: 1, CAF: 1, CONCACAF: 2, CONMEBOL: 1, OFC: 1 },
    WC_IC_PLACES: 2,

    // ---- EURO ----
    EURO_32_FROM: 2032,                             // tournament year from which the EURO has 32 teams (24 before)
    EURO24_DIRECT_PER_GROUP: 6,                     // + 2 best 7th-placed = 20
    EURO24_BEST_SEVENTH: 2,
    EURO32_DIRECT_PER_GROUP: 9,                     // + (3 - H) best non-host 10th-placed
    EURO32_PLAYOFF_PATHS: 2,

    // ---- hosts ----
    // Already awarded. `reserved`: hosts do NOT qualify automatically; up to that many of the
    // hosts that missed the direct places take reserved places (EURO 2028). `md1Only`: hosts that
    // only get home advantage on matchday 1 (WC 2030's South American openers).
    HOSTS: {
        'EURO-2028': { hosts: ['eng', 'irl', 'sco', 'wal'], reserved: 2 },
        'WC-2030': { hosts: ['esp', 'por', 'mar', 'arg', 'uru', 'par'], md1Only: ['arg', 'uru', 'par'] },
        'EURO-2032': { hosts: ['ita', 'tur'] },
        'WC-2034': { hosts: ['ksa'] },
    },
    // Host pots, for every tournament not awarded above (the other pots are further down: COPA,
    // AFCON, ANL_FINALS, ASIAN_CUP, OFC_NATIONS_CUP). Each entry is ONE possible hosting, and one
    // entry is drawn, every entry equally likely:
    //     'ger'            Germany hosts alone
    //     ['den', 'swe']   Denmark and Sweden host together, and only together
    // A nation may be in several entries (alone and in a pair, or in two different pairs). An entry
    // that breaks the rules below (unknown id, wrong confederation, too many nations) is skipped
    // with a warning. An empty pot: one host, drawn by reputation from the confederation (any
    // FIFA member for the World Cup).
    HOST_POTS: {
        EURO: [
            'ger', 'fra', 'esp', 'eng', 'ita', 'ned', 'esp', 'por', 'tur', 'fra', 'ita', 'ger',  // can host alone
            ['den', 'swe'],                     // only together
            ['den', 'nor'],                     // Denmark again, with Norway instead
            ['swe', 'nor'],              // 
            ['bel', 'ned'],                     // only together
            ['pol', 'cze'],                     // only together
            ['cro', 'svn'],                     // only together
            ['hun', 'aut'],                     // only together
            ['sui', 'aut'],                     
            ['sco', 'irl'],                     
            ['por', 'esp'],
            ['tur', 'ita'],
            ['eng', 'wal'],
            ['eng', 'sco'],
            ['ukr', 'pol'],

        ],
        WORLD_CUP: ['ger', 'fra', 'esp', 'eng', 'ita', 'bra', 'arg', 'usa', 'ger', 'fra', 'esp', 'eng', 'ita', 'bra', 'arg', 'usa', 'rsa', 'jpn', 'chn',
            'ger', 'fra', 'esp', 'eng', 'ita', 'bra', 'arg', 'usa',
            ['aus', 'nzl'], ['jpn', 'kor'], ['mar', 'egy'], ['gha', 'nga'], ['mex', 'usa'], ['arg', 'uru'], ['esp', 'por'],
            ['ned', 'bel'], ['tur', 'ita'], ['eng', 'sco'], ['por', 'esp', 'mar'], ['aus', 'nzl', 'idn'], ['col', 'bra'],
            ['chn', 'idn'], ['usa', 'can'], ['mex', 'crc', 'col'], ['swe', 'nor', 'can'],
        ], 
    },
    MAX_HOSTS: 3,                                   // most nations in one entry
    HOST_GROUP_MAX: { ANL_FINALS: 1, OFC_NATIONS_CUP: 2 },   // a single neutral venue; 2 groups of 4 (hosts apart)
    MAX_UEFA_HOSTS_WC: 2,                           // most UEFA nations in one World Cup entry
    // Rotation: a confederation that hosted one of the last N World Cups may not host the next one
    // (FIFA's rule); a nation that hosted one of the last N editions of a continental tournament may
    // not host it again (host a, b, c, then a again). Every member of a pot entry must be free.
    HOST_REST_WC_CONFEDERATION: 2,
    HOST_REST_CONTINENTAL: 2,
    // Real hosts from before the game starts, so the first draws follow the rotation too
    HOST_HISTORY: {
        'WC-2022': ['qat'], 'WC-2026': ['usa', 'can', 'mex'],
        'EURO-2024': ['ger'],
        'COPA-2021': ['bra'], 'COPA-2024': ['usa'],
        'AFCON-2023': ['civ'], 'AFCON-2025': ['mar'],
        'AC-2019': ['uae'], 'AC-2023': ['qat'],
        'ONC-2016': ['papua-new-guinea'], 'ONC-2024': ['vanuatu'],
    },
};

// ---- the Americas (docs/international.md, "The Americas") ----
Object.assign(INTL_CONFIG, {
    // the 8 standard international slots of every season, in order (S1-S8). Every competitive
    // fixture outside the tournament window uses one of them; friendlies fill the rest.
    STD_SLOTS: [[11, 'A'], [12, 'A'], [12, 'B'], [17, 'A'], [18, 'A'], [18, 'B'], [36, 'A'], [37, 'A']],
    // UEFA hosts play their qualifiers (skipped when places are read); CONCACAF hosts sit them out
    HOSTS_PLAY_QUALIFIERS: { UEFA: true, CONMEBOL: true, CONCACAF: false },
    // hosts of the tournament at the end of season T are drawn in week 1 of season T - n
    HOST_DRAW_SEASONS_BEFORE_BY: { EURO: 1, WC: 2, COPA: 1, GOLD: 1 },

    // CONMEBOL World Cup qualifiers: 10 teams, double round-robin over three seasons
    CMQ_SLOTS: { EURO: [1, 2, 3, 4, 5, 6, 7, 8], NL_BEFORE: [1, 2, 3, 4, 5, 6, 7, 8], WC: [1, 2] },   // MD1-8, MD9-16, MD17-18
    CMQ_DIRECT: 6, CMQ_PLAYOFF: 1,                   // direct = 6 - H (hosts play, skipped in the table)

    // CONCACAF World Cup qualifiers (the 2026 format, scaled)
    CCQ_FIELD: 35,                                   // FIFA members; N = 35 - H hosts take part
    CCQ_R2_TEAMS: 30, CCQ_R2_GROUPS: 6,              // 6 groups of 5, single round-robin
    CCQ_R1_SLOTS: [1, 2],                            // legs (11A, 12A)
    CCQ_R2_SLOTS: [3, 4, 5, 6, 7],                   // rounds 1-5 (12B, 17A, 18A, 18B, 36A)
    CCQ_R3_SLOTS: [1, 2, 3, 4, 5, 6],                // 3 groups of 4, double round-robin
    CCQ_DIRECT: 6, CCQ_PLAYOFF: 2,                   // direct = 6 - H

    // CONCACAF Nations League: League A 16, B 16, C 9
    CNL_SIZES: { A: 16, B: 16, C: 9 },
    CNL_FIRST: {   // the real 2026/27 groups (first edition); later editions are drawn
        seeds: ['mex', 'usa', 'can', 'pan'],
        A: [['crc', 'hai', 'trinidad-and-tobago', 'cuw', 'nicaragua', 'dominican-republic'],
            ['hon', 'jam', 'guatemala', 'suriname', 'martinique', 'slv']],
        B: [['guyana', 'puerto-rico', 'dominica', 'cayman-islands'], ['guadeloupe', 'bermuda', 'saint-lucia', 'barbados'],
            ['cuba', 'grenada', 'saint-kitts-and-nevis', 'bonaire'], ['french-guiana', 'saint-vincent-and-the-grenadines', 'belize', 'sint-maarten']],
        C: [['montserrat', 'turks-and-caicos-islands', 'british-virgin-islands'], ['antigua-and-barbuda', 'aruba', 'anguilla'],
            ['saint-martin', 'bahamas', 'us-virgin-islands']],
    },
    CNL_A_GROUP_SLOTS: [1, 2, 3, 4], CNL_A_QF_SLOTS: [5, 6], CNL_SF_SLOT: 7, CNL_FINAL_SLOT: 8,
    CNL_BC_GROUP_SLOTS: [1, 2, 3, 4, 5, 6],

    // Gold Cup (NL seasons): 8 direct + 8 from a two-legged preliminary round
    GOLD_PRELIM_SLOTS: [7, 8],
    GOLD_HOSTS: ['usa'],                             // HOST_POTS.GOLD_CUP; home advantage, no automatic place
    // Copa América (EURO seasons): 10 CONMEBOL + 6 CONCACAF
    COPA_CONCACAF: 6, COPA_PLAYIN_SLOT: 8,
    COPA_MAX_CONCACAF_PER_GROUP: 2,
    // Finalissima: EURO winner v Copa winner, week 50 (slot B: slot A is the Gold Cup's) of the next season
    FINALISSIMA: [50, 'B'],

    // friendlies, for every nation with no competitive match in a standard slot
    FRIENDLY_PLAY_PROB: [[70, 0.95], [55, 0.85], [45, 0.70], [0, 0.55]],   // reputation >= x -> probability
    FRIENDLY_NOISE: 6,
    FRIENDLY_DIST_SAME: 0, FRIENDLY_DIST_NEIGHBOUR: 3, FRIENDLY_DIST_FAR: 6,
    FRIENDLY_NEIGHBOURS: [['UEFA', 'CAF'], ['UEFA', 'AFC'], ['CONMEBOL', 'CONCACAF'], ['AFC', 'OFC']],
    FRIENDLY_NO_REPEAT: 2,                           // not against either of its last 2 friendly opponents
    FRIENDLY_NEUTRAL_CROSS: 0.2,                     // cross-confederation friendlies on neutral ground

    // reputation drift: each nation's reputation moves within std +- var on a wave of this many years
    DRIFT_PERIOD: 10, DRIFT_NOISE: 0.5, DRIFT_FROM: 2026, REP_CAP: 86,
});
// ---- Africa: CAF (docs/international.md, "Africa") ----
Object.assign(INTL_CONFIG, {
    // what CAF plays in a season, by cycle position; overrides win (2026-27 plays the real AFCON 2027
    // instead of the African Nations League)
    CAF_BY_POS: { NL_AFTER: 'ANL', EURO: 'AFCON', NL_BEFORE: 'WCQ', WC: 'WCQ_END' },
    CAF_SEASON_OVERRIDES: { 2026: 'AFCON' },
    ANL_FROM: 2030,                                  // first African Nations League edition (2030-31)

    // AFCON qualifiers: 12 weakest in a two-legged preliminary round, then 12 groups of 4
    AFQ_PRELIM_TEAMS: 12, AFQ_PRELIM_SLOTS: [1, 2],
    AFQ_GROUPS: 12, AFQ_GROUP_SLOTS: [3, 4, 5, 6, 7, 8],
    AFCON_TEAMS: 28, AFCON_THIRDS: 4,                // top 2 non-host per group (24) + (4 - H) best thirds + H hosts
    AFCON_R16_THIRDS: 2,                             // best third-placed teams into the Round of 16 (M2, M6)

    // African Nations League: zones, groups and the 16-team Finals
    ANL_ZONES: ['NORTH', 'WEST', 'EAST', 'CS'],
    ANL_BIG_SLOTS: [1, 2, 3, 4, 5, 6],               // West / East / Central & Southern: 4 groups of 4, double round-robin
    ANL_NORTH_SLOTS: [1, 2, 3, 4, 5],                // North: one group of 6, single round-robin (G6D MD1-5)
    ANL_NORTH_THROUGH: 2, ANL_RUNNERS_UP: 2,         // + the 12 group winners = 16
    ANL_FINALS_MAX_PER_ZONE: 2,

    // CAF World Cup qualifiers: 9 groups of 6, double round-robin over two seasons, then a play-off
    CAFQ_GROUPS: 9,
    CAFQ_SLOTS: { NL_BEFORE: [1, 2, 3, 4, 5, 6, 7, 8], WC: [1, 2] },   // MD1-8, MD9-10
    CAFQ_PLAYOFF_SF: 3, CAFQ_PLAYOFF_FINAL: 4,       // (12B, 17A): single legs, neutral
    CAFQ_DIRECT: 9,                                  // direct = 9 - H (best non-host group winners)
});
INTL_CONFIG.HOSTS_PER_TOURNAMENT_BY = { COPA: 1 };
INTL_CONFIG.HOSTS['AFCON-2027'] = { hosts: ['kenya', 'tanzania', 'uga'] };   // real; like WC 2030, above the 2-host cap
INTL_CONFIG.HOSTS_PLAY_QUALIFIERS.CAF = true;
INTL_CONFIG.HOST_DRAW_SEASONS_BEFORE_BY.AFCON = 1;
INTL_CONFIG.HOST_DRAW_SEASONS_BEFORE_BY.ANLF = 1;
INTL_CONFIG.HOST_POTS.AFCON = ['rsa', 'mar', 'egy', 'sen', 'civ', 'nga', 'gha', 'tun', 'alg', 'cmr', 'mli',
    'bfa', 'cpv', 'nga', 'gha', 'rsa', 'kenya', 
    ['mar', 'egy'], ['sen', 'civ'], ['tun', 'alg'], ['cmr', 'mli'], ['bfa', 'cpv'], ['nga', 'gha'], ['kenya', 'tanzania']
];
INTL_CONFIG.HOST_POTS.ANL_FINALS = [];
INTL_CONFIG.HOSTS_PER_TOURNAMENT_BY.AFCON = [1, 2];
INTL_CONFIG.HOSTS_PER_TOURNAMENT_BY.ANL_FINALS = [1];

// ---- Asia and Oceania: AFC and OFC (docs/international.md, "Asia and Oceania") ----
Object.assign(INTL_CONFIG, {
    // what AFC plays in a season, by cycle position; overrides win (2026-27: the real Asian Cup 2027
    // with its real groups and no qualifying; 2027-28: friendlies, the next Asian Cup is 2032)
    AFC_BY_POS: { NL_AFTER: 'NL_AC', EURO: 'AC', NL_BEFORE: 'NL_WC', WC: 'NL_WC_END' },
    AFC_SEASON_OVERRIDES: { 2026: 'AC_FIXED', 2027: 'NONE' },
    // what OFC plays: Nations Cup (qualifying + finals) in EURO seasons, World Cup qualifiers before a WC
    OFC_BY_POS: { NL_AFTER: 'NONE', EURO: 'NC', NL_BEFORE: 'WCQ', WC: 'NONE' },

    // AFC Nations League: Divisions 1 / 2 / 3. The first edition (2028-29) starts from the real-life
    // placement below (fixed, not recomputed); later editions follow promotion and relegation.
    AFCNL_SIZES: [18, 18, 11],
    AFCNL_FIRST: [
        ['jpn', 'kor', 'irn', 'aus', 'uzb', 'ksa', 'qat', 'jor', 'irq', 'uae', 'oma', 'chn', 'syr', 'idn', 'bhr', 'vietnam', 'thailand', 'ple'],
        ['tajikistan', 'north-korea', 'kyrgyzstan', 'malaysia', 'lebanon', 'kuwait', 'india', 'turkmenistan', 'philippines', 'hong-kong',
            'yemen', 'myanmar', 'singapore', 'afghanistan', 'chinese-taipei', 'cambodia', 'maldives', 'bangladesh'],
        ['nepal', 'mongolia', 'laos', 'pakistan', 'bhutan', 'sri-lanka', 'brunei', 'timor-leste', 'guam', 'macau', 'northern-mariana-islands'],
    ],
    AFCNL_GROUP_SLOTS: [1, 2, 3, 4, 5, 6],           // Asian Cup edition groups; Division 3 in both editions
    AFCNL_KO_SLOTS: [7, 8],                          // Asian Cup edition: Division 1 QF + promotion play-offs, two legs
    AFCNL_QF_THIRDS: 2,                              // + 3 winners + 3 runners-up
    AFCNL_WC_SLOTS: { NL_BEFORE: [1, 2, 3, 4, 5, 6, 7, 8], WC: [1, 2] },   // World Cup edition, Divisions 1-2: MD1-8, MD9-10
    AFCNL_FINALS_WEEK: 49,                           // semis slot A, third place + final slot B, neutral
    AC_FROM_DIV2: 6,                                 // Asian Cup: all of Division 1 + hosts outside it + (6 - H_out) of Division 2
    AFC_WC_DIRECT: 6,                                // direct = 6 - H; the next 4 play the AFC play-off
    AFC_PLAYOFF_SLOTS: [3, 4, 5],                    // single round-robin, neutral (G4D MD1-3); top 2 to the World Cup, 3rd to the IC play-off
    AFC_PLAYOFF_TEAMS: 4, AFC_PLAYOFF_THROUGH: 2,

    // Asian Cup (24): the EURO 24 format
    AC_TEAMS: 24,
    AC_2027_GROUPS: [   // the real draw (A1 = the host)
        ['ksa', 'kuwait', 'oma', 'ple'], ['uzb', 'bhr', 'north-korea', 'jor'], ['irn', 'syr', 'kyrgyzstan', 'chn'],
        ['aus', 'tajikistan', 'irq', 'singapore'], ['kor', 'uae', 'vietnam', 'yemen'], ['jpn', 'qat', 'thailand', 'idn'],
    ],

    // OFC World Cup qualifiers (hosts sit out): R1 a knockout of the (11 - H) - 7 weakest, R2 two
    // groups of 4 (single round-robin), R3 semi-finals + final; all neutral except R2
    OFCQ_R2_TEAMS: 8, OFCQ_R2_POTS: [2, 4, 2],      // pot 3 = the next 1 + the R1 winner
    OFCQ_R1_SF_SLOT: 1, OFCQ_R1_FINAL_SLOT: 2,
    OFCQ_R2_SLOTS: [3, 4, 5],
    OFCQ_R3_SF_SLOT: 7, OFCQ_R3_FINAL_SLOT: 8,
    // OFC Nations Cup (8): qualifying = the 4 weakest non-hosts (single round-robin, neutral), then
    // 2 groups of 4, semi-finals, third place + final
    ONC_TEAMS: 8, ONCQ_TEAMS: 4, ONCQ_SLOTS: [1, 2, 3],
});
INTL_CONFIG.HOSTS['AC-2027'] = { hosts: ['ksa'] };
INTL_CONFIG.HOSTS_PLAY_QUALIFIERS.AFC = true;
INTL_CONFIG.HOSTS_PLAY_QUALIFIERS.OFC = false;
INTL_CONFIG.HOST_DRAW_SEASONS_BEFORE_BY.AC = 2;
INTL_CONFIG.HOST_DRAW_SEASONS_BEFORE_BY.ONC = 1;
INTL_CONFIG.HOST_POTS.ASIAN_CUP = ['chn', 'jpn', 'kor', 'aus', 'irn', 'irq', 'idn', 'ksa', 'qat', 'uae', 'kor', 'jpn',
    ['malaysia', 'idn'], ['thailand', 'malaysia'], ['philippines', 'idn'], ['hong-kong', 'chn'], ['india', 'sri-lanka'],
    ['bangladesh', 'india'], ['aus', 'idn'],
];
INTL_CONFIG.HOST_POTS.OFC_NATIONS_CUP = ['nzl'];
INTL_CONFIG.HOSTS_PER_TOURNAMENT_BY.ASIAN_CUP = [1, 2];
INTL_CONFIG.HOSTS_PER_TOURNAMENT_BY.OFC_NATIONS_CUP = [1];

// ---- call-ups: your clients in their national teams (docs/international.md, "Call-ups") ----
Object.assign(INTL_CONFIG, {
    // A national team's skill level = its reputation (capped at REP_CAP) + 2. A client's role comes
    // from his rating against it; every other player of a national team is virtual, at its reputation.
    CALLUP_SKILL_OFFSET: 2, CALLUP_MIN_AGE: 16,
    CALLUP_STAR_FROM: 3,                             // star: skill + 3 and above
    CALLUP_STARTER_FROM: -3,                         // starter: skill - 3 to skill + 2
    CALLUP_ROTATION_TOP: -4,                         // rotation: skill - 4 down to the population floor
    // the population floor (log scale): t = clamp(log10(population in millions) / 2, 0, 1), so 0 at
    // 1m and below, 1 at 100m and above. Rotation reaches down to skill - round(9 - 4t); the reserve
    // band is the next round(7 - 3t) points below it.
    CALLUP_ROT_DEPTH: [9, 5], CALLUP_RES_DEPTH: [7, 4], CALLUP_POP_LOG: [1, 100],
    // share of the national team's matches each role plays in
    CALLUP_PLAY: { star: 1.0, starter: 0.9, rotation: 0.5, reserve: 0.1 },
    CALLUP_PLAY_GK: { star: 1.0, starter: 0.9, rotation: 0.1, reserve: 0.001 },   // first choice, back-up, third keeper
    // squad limits (they only bind clients: the rest of a squad is virtual)
    CALLUP_SQUAD_MAX: 23,
    CALLUP_POS_MAX: { GK: 3, RB: 3, CB: 6, LB: 3, CDM: 5, CM: 5, CAM: 5, RW: 3, ST: 4, LW: 3 },
    CALLUP_GROUP_MIN: { GK: 3, D: 7, M: 6, A: 5 },   // + 2 wildcards = 23
    // starters + stars: per position, per group, outfield in total (variance for formations)
    CALLUP_XI_POS: { GK: 1, RB: 1, LB: 1, ST: 2, RW: 2, LW: 2, CAM: 2, CDM: 2, CM: 3, CB: 3 },
    CALLUP_XI_GROUP: { D: 5, M: 4, A: 3 }, CALLUP_XI_OUTFIELD: 10,
    // reserves: at most one per line (GK, defence, midfield, attack); a client rated in the reserve
    // band is only picked by chance: a talent (22 or younger) usually, an older player rarely
    CALLUP_RESERVE_PER_LINE: 1, CALLUP_YOUNG_MAX_AGE: 22,
    CALLUP_RESERVE_CHANCE: { young: 0.75, capped: 0.15, uncapped: 0.01 },   // capped = called up before
    // the call-up windows: squads are named the week before (mail), and hold until the next
    CALLUP_WINDOWS: [{ announce: 10, weeks: [11, 12] }, { announce: 16, weeks: [17, 18] }, { announce: 35, weeks: [36, 37] },
        { announce: 48, weeks: [49, 50, 51, 52, 1, 2] }],
    RESULTS_KEEP_WEEKS: 104,                          // a nation's match list
    TOURNAMENT_HOST_BOOST: 2,                         // a host's strength at its own tournament / Nations League Finals: the only edge (no home advantage at a tournament)
    // friendlies: arranged FRIENDLY_SCHEDULE_AHEAD weeks before a break, for every nation with no
    // competitive match in it; one a week, never the same opponent within FRIENDLY_NO_REPEAT_WEEKS,
    // FRIENDLY_CROSS_SHARE of them against another confederation, the opponent drawn from the
    // FRIENDLY_PICK_FROM closest in strength (+ noise)
    FRIENDLY_SCHEDULE_AHEAD: 3, FRIENDLY_NO_REPEAT_WEEKS: 104, FRIENDLY_CROSS_SHARE: 0.6, FRIENDLY_PICK_FROM: 8, FRIENDLY_SCORE_NOISE: 8,
});

INTL_CONFIG.HOST_POTS.GOLD_CUP = INTL_CONFIG.GOLD_HOSTS;
INTL_CONFIG.HOST_POTS.COPA = ['bra', 'arg', 'col', 'uru', 'ven', 'col', 'ecu', 'bra', 'arg', 'chi', 'per',
    ['par','uru'], ['col','ecu'], ['uru','arg'], ['chi','per'], ['chi','ecu'], ['ven','col'],
];

if (typeof window !== 'undefined') window.INTL_CONFIG = INTL_CONFIG;
