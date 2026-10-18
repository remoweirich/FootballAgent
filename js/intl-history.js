// ============================================================
//  Real international honours from before the game starts (2026). Shown on the roll of honour and
//  a nation's page next to the titles won in the game; never part of the simulation.
//
//  [year, winner, runner-up (World Cup and EURO only)]; nation ids from js/nations.js. Successor
//  nations carry the record, as FIFA and UEFA count it: West Germany -> Germany, the Soviet Union
//  -> Russia, Czechoslovakia -> Czechia, Yugoslavia -> Serbia. Nations League entries use the
//  season's start year (2018 = 2018-19), like the game's own.
// ============================================================
const INTL_HISTORY = {
    WC: [[1930, 'uru', 'arg'], [1934, 'ita', 'cze'], [1938, 'ita', 'hun'], [1950, 'uru', 'bra'], [1954, 'ger', 'hun'], [1958, 'bra', 'swe'],
        [1962, 'bra', 'cze'], [1966, 'eng', 'ger'], [1970, 'bra', 'ita'], [1974, 'ger', 'ned'], [1978, 'arg', 'ned'], [1982, 'ita', 'ger'],
        [1986, 'arg', 'ger'], [1990, 'ger', 'arg'], [1994, 'bra', 'ita'], [1998, 'fra', 'bra'], [2002, 'bra', 'ger'], [2006, 'ita', 'fra'],
        [2010, 'esp', 'ned'], [2014, 'ger', 'arg'], [2018, 'fra', 'cro'], [2022, 'arg', 'fra'], [2026, 'esp', 'arg']],
    EURO: [[1960, 'russia', 'srb'], [1964, 'esp', 'russia'], [1968, 'ita', 'srb'], [1972, 'ger', 'russia'], [1976, 'cze', 'ger'], [1980, 'ger', 'bel'],
        [1984, 'fra', 'esp'], [1988, 'ned', 'russia'], [1992, 'den', 'ger'], [1996, 'ger', 'cze'], [2000, 'fra', 'ita'], [2004, 'gre', 'por'],
        [2008, 'esp', 'ger'], [2012, 'esp', 'ita'], [2016, 'por', 'fra'], [2020, 'ita', 'eng'], [2024, 'esp', 'eng']],
    NL: [[2018, 'por'], [2020, 'fra'], [2022, 'esp'], [2024, 'por']],
    COPA: [[1916, 'uru'], [1917, 'uru'], [1919, 'bra'], [1920, 'uru'], [1921, 'arg'], [1922, 'bra'], [1923, 'uru'], [1924, 'uru'], [1925, 'arg'],
        [1926, 'uru'], [1927, 'arg'], [1929, 'arg'], [1935, 'uru'], [1937, 'arg'], [1939, 'per'], [1941, 'arg'], [1942, 'uru'], [1945, 'arg'],
        [1946, 'arg'], [1947, 'arg'], [1949, 'bra'], [1953, 'par'], [1955, 'arg'], [1956, 'uru'], [1957, 'arg'], [1959, 'arg'], [1959, 'uru'],
        [1963, 'bol'], [1967, 'uru'], [1975, 'per'], [1979, 'par'], [1983, 'uru'], [1987, 'uru'], [1989, 'bra'], [1991, 'arg'], [1993, 'arg'],
        [1995, 'uru'], [1997, 'bra'], [1999, 'bra'], [2001, 'col'], [2004, 'bra'], [2007, 'bra'], [2011, 'uru'], [2015, 'chi'], [2016, 'chi'],
        [2019, 'bra'], [2021, 'arg'], [2024, 'arg']],
    GOLD: [[1991, 'usa'], [1993, 'mex'], [1996, 'mex'], [1998, 'mex'], [2000, 'can'], [2002, 'usa'], [2003, 'mex'], [2005, 'usa'], [2007, 'usa'],
        [2009, 'mex'], [2011, 'mex'], [2013, 'usa'], [2015, 'mex'], [2017, 'usa'], [2019, 'mex'], [2021, 'usa'], [2023, 'mex'], [2025, 'mex']],
    CNL_A: [[2019, 'usa'], [2022, 'usa'], [2023, 'usa'], [2024, 'mex']],
    FINALISSIMA: [[1985, 'fra'], [1993, 'arg'], [2022, 'arg']],
    AFCON: [[1957, 'egy'], [1959, 'egy'], [1962, 'ethiopia'], [1963, 'gha'], [1965, 'gha'], [1968, 'cod'], [1970, 'sudan'], [1972, 'congo'],
        [1974, 'cod'], [1976, 'mar'], [1978, 'gha'], [1980, 'nga'], [1982, 'gha'], [1984, 'cmr'], [1986, 'egy'], [1988, 'cmr'], [1990, 'alg'],
        [1992, 'civ'], [1994, 'nga'], [1996, 'rsa'], [1998, 'egy'], [2000, 'cmr'], [2002, 'cmr'], [2004, 'tun'], [2006, 'egy'], [2008, 'egy'],
        [2010, 'egy'], [2012, 'zam'], [2013, 'nga'], [2015, 'civ'], [2017, 'cmr'], [2019, 'alg'], [2021, 'sen'], [2023, 'civ'], [2025, 'mar']],
    AC: [[1956, 'kor'], [1960, 'kor'], [1964, 'isr'], [1968, 'irn'], [1972, 'irn'], [1976, 'irn'], [1980, 'kuwait'], [1984, 'ksa'], [1988, 'ksa'],
        [1992, 'jpn'], [1996, 'ksa'], [2000, 'jpn'], [2004, 'jpn'], [2007, 'irq'], [2011, 'jpn'], [2015, 'aus'], [2019, 'qat'], [2023, 'qat']],
    ONC: [[1973, 'nzl'], [1980, 'aus'], [1996, 'aus'], [1998, 'nzl'], [2000, 'aus'], [2002, 'nzl'], [2004, 'aus'], [2008, 'nzl'], [2012, 'tah'],
        [2016, 'nzl'], [2024, 'nzl']],
};
// as honours entries ({ year | season, winner, runnerUp, hist: 1 }), oldest first
function intlHistoryHonours(key) {
    const season = key === 'NL' || key === 'CNL_A';
    return (INTL_HISTORY[key] || []).map(([y, w, r]) => Object.assign(season ? { season: y } : { year: y }, { winner: w, runnerUp: r || null, final: null, hist: 1 }));
}
if (typeof window !== 'undefined') { window.INTL_HISTORY = INTL_HISTORY; window.intlHistoryHonours = intlHistoryHonours; }
