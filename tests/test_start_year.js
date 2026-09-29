// The season a game starts in, and the database that can move it.
//
// The trap this pins: seasonsCompleted() used to be `seasonStartYear - START_SEASON_YEAR`, which
// silently coupled every existing save to the shipped constant. Bumping the default from 2025 to
// 2026 would have made a save already sitting at 2025 report MINUS ONE seasons played — suppressing
// interstitial ads (they need >= 1) and re-locking the five-season gate on the home screen. Each
// game therefore records the year it began in, which is also the mechanism a historical database
// uses to start in 2005.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const sb = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} }, window: { addEventListener() {} },
    UI: { money: n => String(Math.round(n || 0)), euro: n => '€' + n, esc: s => String(s) },
};
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js',
    'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
const g = k => vm.runInContext(k, sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

const GameState = g('GameState');
const START = g('START_SEASON_YEAR'), LEGACY = g('LEGACY_START_YEAR');
const MIN = g('MIN_START_YEAR'), MAX = g('MAX_START_YEAR');

// ---- 1. the shipped default ------------------------------------------------------------------
console.log('\n-- the shipped start season --');
// The squads that ship represent a real-world season, so this constant and the squad data have to
// agree. It moves when the squads are refreshed; the label is what the player actually sees.
check(`START_SEASON_YEAR is ${START}, shown as ${GameState.seasonLabelFor(START)}`,
    GameState.seasonLabelFor(START) === String(START % 100) + '/' + String((START + 1) % 100));
check('the legacy start year is 2025 and is NOT tied to the current default',
    LEGACY === 2025 && (START !== LEGACY || START === 2025));

run("Clubs.init(); GameState.startNewGame('Netherlands','Test FC','A');");
check(`a new game begins in ${START}`, GameState.seasonStartYear === START);
check('...and records that as its own start year', GameState.startYear === START);
check('...so it has completed no seasons', GameState.seasonsCompleted() === 0);

// ---- 2. the migration trap -------------------------------------------------------------------
console.log('\n-- an old save keeps the seasons it played --');
// A save written before startYear existed. It really did begin in 2025, so it must be read that
// way — never as "whatever the default is today", which is what would produce a negative count.
const legacySave = { startYear: undefined, seasonStartYear: 2025 };
GameState.startYear = undefined; GameState.seasonStartYear = legacySave.seasonStartYear;
check('a pre-startYear save at 2025 reports 0 seasons, not a negative number',
    GameState.seasonsCompleted() === 0);
GameState.seasonStartYear = 2030;
check('a pre-startYear save five seasons in still reports 5', GameState.seasonsCompleted() === 5);
check('gameStartYear() falls back to the legacy year, not the current default',
    GameState.gameStartYear() === LEGACY);
// the two consumers of the count
check('  ads: season 1 of an old save is still ad-free', (() => {
    GameState.startYear = undefined; GameState.seasonStartYear = 2025;
    return GameState.seasonsCompleted() === 0;   // ads.js needs >= 1
})());
check('  ads: season 2 of an old save is still eligible', (() => {
    GameState.seasonStartYear = 2026;
    return GameState.seasonsCompleted() === 1;
})());

// ---- 3. a database can move the start season -------------------------------------------------
console.log('\n-- a historical database --');
run("Clubs.init(); GameState.startNewGame('Netherlands','Retro FC','A', { id:'db1', startYear: 2005 });");
check('a database with startYear 2005 starts the game there', GameState.seasonStartYear === 2005);
check('...and the game records it', GameState.startYear === 2005);
check('...and reads as season 05/06', GameState.seasonLabel() === '05/06');
check('...with no seasons completed', GameState.seasonsCompleted() === 0);
run("GameState.seasonStartYear = 2008;");
check('...and counts its own seasons from there, not from the shipped default',
    GameState.seasonsCompleted() === 3);

console.log('\n-- the year off disk is not trusted --');
const yearFor = d => GameState.startYearFor(d);
check('no database -> the shipped default', yearFor(null) === START);
check('a database without a year -> the shipped default', yearFor({ id: 'x' }) === START);
check('a string is rejected', yearFor({ startYear: '2005' }) === START);
check('NaN is rejected', yearFor({ startYear: NaN }) === START);
check('Infinity is rejected', yearFor({ startYear: Infinity }) === START);
check(`below ${MIN} clamps up`, yearFor({ startYear: 1200 }) === MIN);
check(`above ${MAX} clamps down`, yearFor({ startYear: 5000 }) === MAX);
check('a fraction is rounded', yearFor({ startYear: 2005.6 }) === 2006);
// absWeek is the one place the absolute year reaches the engine; it must stay ordered and positive
run("GameState.startNewGame('Netherlands','Retro FC','A', { id:'db1', startYear: " + MIN + " });");
const wkMin = GameState.absWeek();
run("GameState.startNewGame('Netherlands','Future FC','A', { id:'db2', startYear: " + MAX + " });");
check('absWeek stays positive and ordered across the whole allowed range',
    wkMin > 0 && GameState.absWeek() > wkMin);

// ---- 4. it survives a save/load round trip ----------------------------------------------------
console.log('\n-- the start year survives being saved --');
const src = fs.readFileSync(path.join(base, 'game-state.js'), 'utf8');
check('save() writes startYear', /startYear:\s*this\.startYear/.test(src));
check('load() reads it, defaulting to the LEGACY year', /d\.startYear\s*!=\s*null\s*\?\s*d\.startYear\s*:\s*LEGACY_START_YEAR/.test(src));

// ---- 5. the walkthrough swaps it with the rest ------------------------------------------------
// The demo replaces seasonStartYear; if startYear did not travel with it the demo agent's season
// count would be wrong, and the real save would get the demo's year handed back.
const wt = fs.readFileSync(path.join(__dirname, '..', 'ui', 'js', 'walkthrough.js'), 'utf8');
const fields = (/FIELDS:\s*\[([^\]]*)\]/.exec(wt) || [])[1] || '';
check('walkthrough saves/restores startYear alongside seasonStartYear',
    /'seasonStartYear'/.test(fields) && /'startYear'/.test(fields));

console.log(failed ? '\n*** FAIL ***' : '\nAll start-year checks passed.');
process.exitCode = failed ? 1 : 0;
