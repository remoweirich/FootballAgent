// Italy integration test: wiring, league sizes stable across seasons, pro/rel counts,
// cup entry rules, guardrails silent. Loads the real engine files via vm.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];

function makeFakeIDB() {
    return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } };
}
function buildSandbox() {
    const errors = [];
    const sandbox = {
        console: { log: () => { }, warn: () => { }, error: (...a) => errors.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) },
        setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(),
        localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
        document: { addEventListener() { } }, window: { addEventListener() { } },
        UI: { money: n => Math.round(n || 0).toLocaleString('en-US') }
    };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    sandbox.__errors = errors;
    return sandbox;
}
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };
const sb = buildSandbox();
const run = code => vm.runInContext('{' + code + '}', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);

run(`Clubs.init(); GameState.startNewGame('Italy', 'Squadra Test');`);

// ---- Part 1: wiring ----
check('Italy is a selectable home country (in REGIONS_BY_COUNTRY)', runv(`return Object.keys(REGIONS_BY_COUNTRY).includes('Italy')`));
check('startNewGame accepted Italy as home country', runv(`return GameState.homeCountry === 'Italy'`));
check('Italy is in COUNTRY_DIVS with 4 divisions', runv(`return (COUNTRY_DIVS.Italy || []).length === 4`));
check('Italy has scout names', runv(`return SCOUT_NAMES.Italy && SCOUT_NAMES.Italy.first.length > 5`));
check('Serie A/B/C/D all in COMPETITIONS', runv(`return ['SerieA','SerieB','SerieC','SerieD'].every(d => COMPETITIONS[d])`));
check('Serie divisions in DIV_TIERS', runv(`return Clubs.DIV_TIERS.SerieA===1 && Clubs.DIV_TIERS.SerieD===4`));
check('Italy in COUNTRY_CUPS (coppaitalia + coppacompagno)', runv(`return (COUNTRY_CUPS.Italy||[]).map(c=>c[0]).join(',')==='coppaitalia,coppacompagno'`));
// every Italian club's city maps to a real Italian region (not the Dutch 'middelland' fallback)
const badCities = runv(`
    const it = REGIONS_IT.map(r => r.id);
    return JSON.stringify(Clubs.getClubsByCountry('Italy').filter(c => !it.includes(regionOfCity(c.city))).map(c => c.name + ' @ ' + c.city));
`);
check('every Italian club city maps to an Italian region, offenders: ' + badCities, JSON.parse(badCities).length === 0);

// ---- Part 3: static sizes ----
check('Serie A static size 20', runv(`return Clubs.staticDivSize('SerieA')===20`));
check('Serie B static size 20', runv(`return Clubs.staticDivSize('SerieB')===20`));
check('Serie C static size 24', runv(`return Clubs.staticDivSize('SerieC')===24`));
check('Serie D static size 20', runv(`return Clubs.staticDivSize('SerieD')===20`));
check('Serie A initial members = 20', runv(`return Clubs.getClubsByDivision('SerieA').length===20`));

// ---- Part 8: fee caps ----
check('Serie A fee cap = La Liga (75M)', runv(`return Agency._leagueCap('SerieA')===75000000`));
check('Serie D fee cap = Primera Inferior level (2M)', runv(`return Agency._leagueCap('SerieD')===2000000`));

// ---- Part 6: colours all valid hex ----
const badColours = runv(`
    const hex = /^#[0-9A-Fa-f]{6}$/;
    return JSON.stringify(Clubs.getClubsByCountry('Italy').filter(c => !hex.test(c.colors.primary) || !hex.test(c.colors.secondary)).map(c => c.name));
`);
check('every Italian club has valid 6-digit hex colours, offenders: ' + badColours, JSON.parse(badColours).length === 0);

// ---- setupSeason built Italian schedules + cups ----
check('setupSeason built Serie A table', runv(`return !!(GameState.league.tables.SerieA)`));
check('Coppa Italia built with 64 entrants (SerieA seeded + SerieB/C lower)', runv(`const c=GameState.league.coppaitalia; return c && (c.seeded.length + c.lower.length)===64 && c.seeded.length===20`));
check('Coppa Compagno built with 64 entrants (SerieB seeded + SerieC/D lower)', runv(`const c=GameState.league.coppacompagno; return c && (c.seeded.length + c.lower.length)===64 && c.seeded.length===20`));

// ---- simulate a full season, check the cup entry rule (Serie A can't meet Serie A in R1, seeded away) ----
run(`GameState.week = 1;`);
for (let i = 0; i < 6; i++) run(`Sim.advanceWeek();`);   // week 1->7 covers cup R1 (wk4) and R2 (wk7)
const r1 = runv(`
    const c = GameState.league.coppaitalia;
    const r1 = c.results.find(r => r.week === 4);
    if (!r1) return JSON.stringify({ err: 'no R1' });
    const serieA = new Set(Clubs.getClubsByDivision('SerieA').map(x=>x.id));
    // note: divisions may already reflect this season; SerieA membership is stable pre-rollover
    let seededHome = 0, aVsA = 0;
    r1.ties.forEach(t => {
        if (t.bye) return;
        const hA = serieA.has(t.h), aA = serieA.has(t.a);
        if (hA && aA) aVsA++;              // two Serie A clubs met (should never happen in R1)
        if (hA) seededHome++;              // a Serie A club is at HOME (should be away/seeded)
    });
    return JSON.stringify({ ties: r1.ties.length, aVsA, seededHome });
`);
const r1o = JSON.parse(r1);
check('Coppa Italia R1 has 32 ties (64 clubs)', r1o.ties === 32);
check('Coppa Italia R1: no Serie A club plays another Serie A club', r1o.aVsA === 0);
check('Coppa Italia R1: no Serie A club is drawn at home (seeded away)', r1o.seededHome === 0);

// ---- advance a full season to rollover, verify pro/rel counts + sizes ----
function sizes() { return runv(`return JSON.stringify(['SerieA','SerieB','SerieC','SerieD'].map(d => Clubs.getClubsByDivision(d).length))`); }
const preSizes = sizes();
let rolled = false;
for (let i = 0; i < 52 && !rolled; i++) { rolled = runv(`return !!Sim.advanceWeek().rolledSeason`); }
check('season rolled over', rolled);
const prorel = runv(`return JSON.stringify(GameState.league.prorelIta || (GameState.lastSeasonReport||{}).prorelIta || null)`);
// prorelIta lives on the NEW season's league object? No - applyPromotionRelegation ran on the old L then setupSeason replaced it.
// So read the counts indirectly by checking sizes are still correct + guardrail silent.
check('Serie sizes unchanged after rollover: ' + preSizes + ' -> ' + sizes(), preSizes === sizes());
check('sizes are exactly [20,20,24,20]', sizes() === JSON.stringify([20, 20, 24, 20]));
check('no DEV WARNING errors after rollover (guardrail silent), got: ' + JSON.stringify(sb.__errors), sb.__errors.length === 0);
const devMail = runv(`return GameState.inbox.filter(m => m.subject && m.subject.includes('DEV WARNING')).length`);
check('no DEV WARNING inbox mail', devMail === 0);

// ---- run 3 more seasons to be sure sizes stay stable ----
for (let s = 0; s < 3; s++) { let r = false; for (let i = 0; i < 52 && !r; i++) r = runv(`return !!Sim.advanceWeek().rolledSeason`); }
check('sizes still [20,20,24,20] after 4 total seasons: ' + sizes(), sizes() === JSON.stringify([20, 20, 24, 20]));
check('still no DEV WARNING errors after 4 seasons, got: ' + JSON.stringify(sb.__errors.slice(0,3)), sb.__errors.length === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Italy integration checks passed.');
process.exitCode = failed ? 1 : 0;
