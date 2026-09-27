// Competition names are in their OWN country's language, in every UI language — a German division
// reads German whether you play in English, Dutch or Portuguese. The two countries with more than one
// football language are the exceptions, and their variant follows the player's language:
//   Switzerland — German for de/en/nl, French for fr/es/pt, Italian for it
//   Belgium     — Dutch for en/de/nl, French for fr/es/pt/it
//
// Also: every name must stay invented (the whole reason the generics exist), and an imported
// real-names pack must still win over the native name.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const errs = [];
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => null, querySelector: () => null, createElement: () => ({ style: {} }), head: { appendChild() {} }, documentElement: {} },
    window: { addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false }) },
    location: { hash: '' },
};
sb.UI = { money: n => String(n), euro: n => '€' + n, esc: s => String(s), clubName: id => String(id) };
vm.createContext(sb);
const load = f => vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
load('i18n.js');
const LOCALES = JSON.parse(vm.runInContext('JSON.stringify(I18n.LANGS.map(function(l){return l.code;}))', sb));
for (const c of LOCALES) load('i18n-' + c + '.js');
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'world-ext.js',
    'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js']) load(f);
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
run('Clubs.init(); GameState.startNewGame("Netherlands","Testers FC","Alex Mercer");');
const I = vm.runInContext('I18n', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };
const at = (loc, id) => { I.locale = loc; I._applyNativeComps(); return run('return compName(' + JSON.stringify(id) + ');'); };

// ---- 1. single-language countries never vary with the player's language ----
const FIXED = {
    ERE: 'Eerste Nederlandse Liga', BEKER: 'Nederlandse Beker',
    PREM: 'English First Division', FACUP: 'English Cup',
    BUNDES: 'Erste Deutsche Liga', REGIONAL3: 'Sechste Deutsche Liga', DFB: 'Deutscher Pokal',
    LaLiga: 'Primera Liga Española', CDR: 'Copa Española',
    SerieA: 'Prima Lega Italiana', COPPA: 'Coppa Nazionale Italiana',
    LigaPortugal: 'Primeira Divisão Portuguesa', TACAPT: 'Taça Portuguesa',
    Ligue1: 'Première Division Française', COUPEFR: 'Coupe Française',
    LICHCUP: 'Liechtensteiner Pokal',
};
let wrong = [];
for (const [id, want] of Object.entries(FIXED)) {
    for (const loc of LOCALES) {
        const got = at(loc, id);
        if (got !== want) wrong.push(`${loc} ${id}: "${got}" != "${want}"`);
    }
}
check(`single-language competitions read the same in all ${LOCALES.length} UI languages`
    + (wrong.length ? ' — ' + wrong.slice(0, 3).join('; ') : ''), wrong.length === 0);

// ---- 2. Switzerland and Belgium follow the player's language, exactly as specified ----
const CH_DE = ['en', 'de', 'nl'], CH_FR = ['fr', 'es', 'pt'], CH_IT = ['it'];
check('Swiss: German for en/de/nl', CH_DE.every(l => at(l, 'SuperLeagueCH') === 'Erste Schweizer Liga'
    && at(l, 'SCHWCUP') === 'Schweizer Pokal'));
check('Swiss: French for fr/es/pt', CH_FR.every(l => at(l, 'SuperLeagueCH') === 'Première Division Suisse'
    && at(l, 'SCHWCUP') === 'Coupe Suisse'));
check('Swiss: Italian for it', CH_IT.every(l => at(l, 'SuperLeagueCH') === 'Prima Lega Svizzera'
    && at(l, 'SCHWCUP') === 'Coppa Svizzera'));

const BE_NL = ['en', 'de', 'nl'], BE_FR = ['fr', 'es', 'pt', 'it'];
check('Belgian: Dutch for en/de/nl', BE_NL.every(l => at(l, 'JupilerProLeague') === 'Eerste Belgische Liga'
    && at(l, 'BELCUP') === 'Belgische Beker'));
check('Belgian: French for fr/es/pt/it', BE_FR.every(l => at(l, 'JupilerProLeague') === 'Première Division Belge'
    && at(l, 'BELCUP') === 'Coupe Belge'));
check('the two countries differ from each other in Italian (Swiss it, Belgian fr)',
    at('it', 'SuperLeagueCH') === 'Prima Lega Svizzera' && at('it', 'JupilerProLeague') === 'Première Division Belge');

// ---- 3. no real competition name ships ----
const REAL = ['Bundesliga', 'Eredivisie', 'Eerste Divisie', 'Tweede Divisie', 'Derde Divisie',
    'Premier League', 'Championship', 'League One', 'League Two', 'La Liga', 'LaLiga',
    'Primera División', 'Serie A', 'Serie B', 'Serie C', 'Serie D', 'Coppa Italia', 'Ligue 1',
    'Ligue 2', 'Liga Portugal', 'Primeira Liga', 'Taça de Portugal', 'Coupe de France',
    'Jupiler', 'Super League', 'Challenge League', 'Beker van België', 'Coupe de Belgique',
    'Copa del Rey', 'DFB-Pokal', 'KNVB'];
const ids = JSON.parse(run('return JSON.stringify(Object.keys(COMPETITIONS));'));
let leaks = [];
for (const loc of LOCALES) {
    for (const id of ids) {
        const n = at(loc, id);
        for (const r of REAL) if (String(n).includes(r)) leaks.push(`${loc} ${id}="${n}" (${r})`);
    }
}
check('no real trademarked competition name ships' + (leaks.length ? ' — ' + [...new Set(leaks)].slice(0, 3).join('; ') : ''),
    leaks.length === 0);

// ---- 4. an imported real-names pack still wins, and survives a language change ----
I.locale = 'de'; I._applyNativeComps();
check('native name before an import', run('return compName("BUNDES");') === 'Erste Deutsche Liga');
run('GameState.setCompName("BUNDES", "Bundesliga");');
check('an imported real name wins over the native one', run('return compName("BUNDES");') === 'Bundesliga');
I.locale = 'it'; I._applyNativeComps();
check('and survives a language change', run('return compName("BUNDES");') === 'Bundesliga');
run('GameState.compNames = null; Clubs.init();');

// ---- 5. the cached club.divisionName tracks the language ----
check('club.divisionName follows the locale for a Swiss club', (() => {
    const get = loc => { I.locale = loc; I._applyNativeComps(); return run(`
      const c = Clubs.allClubs.find(x => x.country === 'Switzerland' && x.tier === 1); return c.divisionName;`); };
    return get('de') === 'Erste Schweizer Liga' && get('fr') === 'Première Division Suisse'
        && get('it') === 'Prima Lega Svizzera';
})());

// ---- 6. the scout tier label puts the competition in front of a separator, not inside a phrase.
//         A native name is a proper noun that its own language would decline ("Star der ERSTEN
//         DEUTSCHEN Liga"), and a data string cannot be declined, so no template may wrap it.
check('no rank template wraps {comp} in a prepositional phrase', LOCALES.every(loc => {
    const t = vm.runInContext(`(I18n.packs['${loc}']||{})['scout.rank.star']||''`, sb);
    return /^\{comp\}/.test(t);
}));
I.locale = 'de'; I._applyNativeComps();
// German ladder: 84+ first-division star, 76+ first-division regular, 70+ second-division star.
check('a German tier label reads "<comp> · <rank>" at each rung',
    run('return Scouting.tierLabel(84, "Germany");') === 'Erste Deutsche Liga · Star'
    && run('return Scouting.tierLabel(76, "Germany");') === 'Erste Deutsche Liga · Stammspieler'
    && run('return Scouting.tierLabel(72, "Germany");') === 'Zweite Deutsche Liga · Star');
I.locale = 'en';

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** FAIL ***' : '\nAll competition-name checks passed.');
process.exitCode = failed ? 1 : 0;
