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
    MATCHDAYS: [                                    // group matchdays 1-6 (both formats)
        { week: 11, slot: 'A' }, { week: 11, slot: 'B' },
        { week: 12, slot: 'A' }, { week: 12, slot: 'B' },
        { week: 17, slot: 'A' }, { week: 18, slot: 'A' },
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
    // From EURO 2036 / WC 2038: 1-2 hosts drawn from these pots (to be filled in). Until then the
    // fallback picks ONE host, weighted by reputation: UEFA nations for the EURO, all for the WC.
    HOST_POTS: { EURO: [], WORLD_CUP: [] },
    HOSTS_PER_TOURNAMENT: [1, 2],
    MAX_HOSTS: 2,
    MAX_UEFA_HOSTS_WC: 2,
};

if (typeof window !== 'undefined') window.INTL_CONFIG = INTL_CONFIG;
