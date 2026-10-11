// ============================================================
//  National teams (docs/international.md). Data only.
//
//  id            stable key, never shown (saves and fixtures store it)
//  name          display name
//  nationality   the player-nationality string this team picks from (NAMES_DATABASE /
//                NATIONALITY_DISTRIBUTION spelling), or null if the game has no such players yet
//  confederation UEFA | AFC | CAF | CONCACAF | CONMEBOL | OFC
//  reputation    0-100, same scale as club reputation; drives seeding, pots and match strength
//  weight        non-UEFA only: relative chance of being drawn as a World Cup qualifier.
//                Defaulted to Math.exp((reputation - 60) / NATION_WEIGHT_SPREAD) and stored so it
//                can be edited. A bigger spread flattens the curve (more upsets).
//
//  UEFA: all 55 members except Russia = 54. Reputations are unique so the seeding ranking (and
//  with it the starting Nations League leagues) never needs a tie-break.
// ============================================================
const NATIONS_UEFA = [
    // ---- League A at the start (seeding ranks 1-18) ----
    { id: 'fra', name: 'France', nationality: 'France', reputation: 92 },
    { id: 'esp', name: 'Spain', nationality: 'Spain', reputation: 91 },
    { id: 'eng', name: 'England', nationality: 'England', reputation: 90 },
    { id: 'por', name: 'Portugal', nationality: 'Portugal', reputation: 89 },
    { id: 'ger', name: 'Germany', nationality: 'Germany', reputation: 88 },
    { id: 'ned', name: 'Netherlands', nationality: 'Netherlands', reputation: 87 },
    { id: 'ita', name: 'Italy', nationality: 'Italy', reputation: 86 },
    { id: 'bel', name: 'Belgium', nationality: 'Belgium', reputation: 85 },
    { id: 'cro', name: 'Croatia', nationality: 'Croatia', reputation: 84 },
    { id: 'sui', name: 'Switzerland', nationality: 'Switzerland', reputation: 82 },
    { id: 'den', name: 'Denmark', nationality: 'Denmark', reputation: 81 },
    { id: 'aut', name: 'Austria', nationality: 'Austria', reputation: 80 },
    { id: 'nor', name: 'Norway', nationality: 'Norway', reputation: 79 },
    { id: 'tur', name: 'Türkiye', nationality: 'Türkiye', reputation: 78 },
    { id: 'ukr', name: 'Ukraine', nationality: 'Ukraine', reputation: 77 },
    { id: 'srb', name: 'Serbia', nationality: 'Serbia', reputation: 76 },
    { id: 'pol', name: 'Poland', nationality: 'Poland', reputation: 75 },
    { id: 'swe', name: 'Sweden', nationality: 'Sweden', reputation: 74 },
    // ---- League B at the start (ranks 19-36) ----
    { id: 'sco', name: 'Scotland', nationality: 'Scotland', reputation: 73 },
    { id: 'cze', name: 'Czechia', nationality: 'Czechia', reputation: 72 },
    { id: 'hun', name: 'Hungary', nationality: 'Hungary', reputation: 71 },
    { id: 'svk', name: 'Slovakia', nationality: 'Slovakia', reputation: 70 },
    { id: 'gre', name: 'Greece', nationality: 'Greece', reputation: 69 },
    { id: 'rou', name: 'Romania', nationality: 'Romania', reputation: 68 },
    { id: 'geo', name: 'Georgia', nationality: 'Georgia', reputation: 67 },
    { id: 'svn', name: 'Slovenia', nationality: 'Slovenia', reputation: 66 },
    { id: 'wal', name: 'Wales', nationality: 'Wales', reputation: 65 },
    { id: 'irl', name: 'Republic of Ireland', nationality: 'Republic of Ireland', reputation: 64 },
    { id: 'alb', name: 'Albania', nationality: 'Albania', reputation: 63 },
    { id: 'isr', name: 'Israel', nationality: null, reputation: 62 },
    { id: 'bih', name: 'Bosnia and Herzegovina', nationality: 'Bosnia and Herzegovina', reputation: 61 },
    { id: 'isl', name: 'Iceland', nationality: 'Iceland', reputation: 60 },
    { id: 'fin', name: 'Finland', nationality: 'Finland', reputation: 59 },
    { id: 'nir', name: 'Northern Ireland', nationality: 'Northern Ireland', reputation: 58 },
    { id: 'mkd', name: 'North Macedonia', nationality: 'North Macedonia', reputation: 57 },
    { id: 'kos', name: 'Kosovo', nationality: 'Kosovo', reputation: 56 },
    // ---- League C at the start (ranks 37-54) ----
    { id: 'mne', name: 'Montenegro', nationality: null, reputation: 55 },
    { id: 'bul', name: 'Bulgaria', nationality: 'Bulgaria', reputation: 54 },
    { id: 'blr', name: 'Belarus', nationality: null, reputation: 53 },
    { id: 'kaz', name: 'Kazakhstan', nationality: 'Kazakhstan', reputation: 52 },
    { id: 'lux', name: 'Luxembourg', nationality: 'Luxembourg', reputation: 51 },
    { id: 'arm', name: 'Armenia', nationality: 'Armenia', reputation: 50 },
    { id: 'aze', name: 'Azerbaijan', nationality: null, reputation: 49 },
    { id: 'cyp', name: 'Cyprus', nationality: 'Cyprus', reputation: 48 },
    { id: 'fro', name: 'Faroe Islands', nationality: null, reputation: 47 },
    { id: 'est', name: 'Estonia', nationality: null, reputation: 46 },
    { id: 'lva', name: 'Latvia', nationality: null, reputation: 45 },
    { id: 'ltu', name: 'Lithuania', nationality: null, reputation: 44 },
    { id: 'mda', name: 'Moldova', nationality: null, reputation: 43 },
    { id: 'mlt', name: 'Malta', nationality: null, reputation: 42 },
    { id: 'and', name: 'Andorra', nationality: null, reputation: 40 },
    { id: 'lie', name: 'Liechtenstein', nationality: 'Liechtenstein', reputation: 38 },
    { id: 'gib', name: 'Gibraltar', nationality: null, reputation: 36 },
    { id: 'smr', name: 'San Marino', nationality: null, reputation: 30 },
].map(n => Object.assign({ confederation: 'UEFA' }, n));

// Non-UEFA pools: placeholders until their own qualifiers exist (World Cup only).
const NATION_WEIGHT_SPREAD = 5;   // bigger = flatter curve, more upsets
const _w = rep => Math.round(Math.exp((rep - 60) / NATION_WEIGHT_SPREAD) * 100) / 100;
const _pool = (conf, list) => list.map(([id, name, nationality, reputation]) =>
    ({ id, name, nationality, confederation: conf, reputation, weight: _w(reputation) }));
const NATIONS_OTHER = [].concat(
    _pool('CONMEBOL', [
        ['arg', 'Argentina', 'Argentina', 92], ['bra', 'Brazil', 'Brazil', 90], ['uru', 'Uruguay', 'Uruguay', 81],
        ['col', 'Colombia', 'Colombia', 80], ['ecu', 'Ecuador', 'Ecuador', 76], ['par', 'Paraguay', null, 72],
        ['per', 'Peru', 'Peru', 69], ['chi', 'Chile', 'Chile', 68], ['ven', 'Venezuela', null, 67], ['bol', 'Bolivia', null, 60],
    ]),
    _pool('AFC', [
        ['jpn', 'Japan', 'Japan', 79], ['kor', 'South Korea', 'South Korea', 75], ['irn', 'Iran', null, 74],
        ['aus', 'Australia', 'Australia', 72], ['ksa', 'Saudi Arabia', null, 69], ['uzb', 'Uzbekistan', null, 68],
        ['qat', 'Qatar', null, 67], ['irq', 'Iraq', 'Iraq', 66], ['jor', 'Jordan', null, 65], ['uae', 'United Arab Emirates', null, 64],
        ['oma', 'Oman', null, 61], ['chn', 'China', 'China', 60], ['bhr', 'Bahrain', null, 59], ['syr', 'Syria', null, 58],
        ['ple', 'Palestine', null, 57], ['idn', 'Indonesia', 'Indonesia', 56],
    ]),
    _pool('CAF', [
        ['mar', 'Morocco', 'Morocco', 83], ['sen', 'Senegal', 'Senegal', 78], ['civ', "Côte d'Ivoire", "Côte d'Ivoire", 75],
        ['egy', 'Egypt', 'Egypt', 74], ['nga', 'Nigeria', 'Nigeria', 74], ['alg', 'Algeria', 'Algeria', 73],
        ['cmr', 'Cameroon', 'Cameroon', 71], ['tun', 'Tunisia', 'Tunisia', 70], ['mli', 'Mali', 'Mali', 70],
        ['gha', 'Ghana', 'Ghana', 69], ['cod', 'DR Congo', 'DR Congo', 69], ['rsa', 'South Africa', 'South Africa', 68],
        ['bfa', 'Burkina Faso', null, 67], ['cpv', 'Cape Verde', null, 66], ['gui', 'Guinea', null, 63],
        ['gab', 'Gabon', 'Gabon', 62], ['ang', 'Angola', null, 62], ['zam', 'Zambia', null, 61],
        ['eqg', 'Equatorial Guinea', null, 60], ['uga', 'Uganda', 'Uganda', 58],
    ]),
    _pool('CONCACAF', [
        ['usa', 'USA', 'USA', 79], ['mex', 'Mexico', 'Mexico', 78], ['can', 'Canada', 'Canada', 75],
        ['pan', 'Panama', null, 69], ['crc', 'Costa Rica', null, 67], ['jam', 'Jamaica', null, 66],
        ['hon', 'Honduras', null, 64], ['cuw', 'Curaçao', null, 61], ['hai', 'Haiti', null, 60], ['slv', 'El Salvador', null, 58],
    ]),
    _pool('OFC', [
        ['nzl', 'New Zealand', 'New Zealand', 64], ['ncl', 'New Caledonia', null, 48], ['fij', 'Fiji', null, 45], ['tah', 'Tahiti', null, 44],
    ]),
);

const NATIONS = NATIONS_UEFA.concat(NATIONS_OTHER);
const NATIONS_BY_ID = Object.fromEntries(NATIONS.map(n => [n.id, n]));

if (typeof window !== 'undefined') { window.NATIONS = NATIONS; window.NATIONS_BY_ID = NATIONS_BY_ID; }
