// The scout card (ui/js/screen-scout.js) and the collapsed "Your scouts" list that feeds it.
// Renders both against a DOM stub with the real engine and the real English pack loaded, so it
// also proves every key the card asks for actually resolves.
//
// What this canNOT prove: that any of it is visible. A DOM stub has no layout and no paint order,
// which is exactly how the Settings language picker passed its test for weeks while sitting
// buried under a screen wrapper. The companion check is a real headless render.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

let appHTML = '', sheetHTML = '', modalHTML = '';
const byId = {};
const appEl = { set innerHTML(v) { appHTML = String(v); }, get innerHTML() { return appHTML; } };
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout() {},
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: {
        getElementById: id => (id === 'app' ? appEl : (byId[id] || null)),
        querySelector: () => null, querySelectorAll: () => [],
        createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, innerHTML: '', appendChild() {} }),
        head: { appendChild() {} }, body: { appendChild() {} },
        documentElement: { setAttribute() {} }, addEventListener() {},
    },
    addEventListener() {}, removeEventListener() {},
};
sb.window = sb;
vm.createContext(sb);

// real engine, real i18n — the card leans on Scouts, Clubs, Agency and ~31 new UI keys
vm.runInContext(fs.readFileSync(root + 'js/i18n.js', 'utf8'), sb, { filename: 'i18n.js' });
vm.runInContext(fs.readFileSync(root + 'js/i18n-en.js', 'utf8'), sb, { filename: 'i18n-en.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb, { filename: 'ui/i18n-en.js' });
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(root + 'js/' + f, 'utf8'), sb, { filename: f });

// the UI bits the two screens actually touch, stubbed only where they reach the real DOM
vm.runInContext(`
    var UI = {
        esc: s => (s == null ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')),
        euro: n => '\\u20ac' + n, money: n => '\\u20ac' + n, eabbr: n => '\\u20ac' + n,
        abilityBadge: (q, big) => '<span class="badge" data-q="' + q + '">' + q + '</span>',
        crest: c => '<span class="crest"></span>', flag: () => '', clubName: id => String(id),
    };
    var Router = {
        isFreshNav: true, screens: {},
        register(n, d) { this.screens[n] = d; },
        link: (n, id) => '#' + n + '/' + id,
        refresh() {}, go() {}, replace() {}, result() {},
        sheet(h) { __sheet(h); }, closeSheet() {}, modal(h) { __modal(h); }, closeModal() {},
    };
`, sb);
sb.__sheet = h => { sheetHTML = String(h); };
sb.__modal = h => { modalHTML = String(h); };
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-scouting.js', 'utf8'), sb, { filename: 'screen-scouting.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-scout.js', 'utf8'), sb, { filename: 'screen-scout.js' });

const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

vm.runInContext("Clubs.init(); GameState.startNewGame('Switzerland','T','A');", sb);
// two scouts: one posted to a home region, one roaming
run(`
    GameState.agency.scouts = [
        { id: 'sc_on', name: 'Lukas Ferrari', title: 'Senior scout', quality: 52, weeklyCost: 960,
          region: 'ostschweiz', league: null, country: null, weeksUntilFind: 1, maxTalentAge: 19 },
        { id: 'sc_off', name: 'Beat Wyss', title: 'Lead scout', quality: 41, weeklyCost: 420,
          region: null, league: null, country: null, weeksUntilFind: 7, maxTalentAge: 22 }
    ];
`);

// ---------------- the collapsed list ----------------
console.log('\n-- "Your scouts" is now rows, not forms --');
const list = run("ScoutingScreen.tab='scouts'; return ScoutingScreen.yourScouts();");
check('a row per scout, each linking to its card', /#scout\/sc_on/.test(list) && /#scout\/sc_off/.test(list));
check('the glanceable facts are on the row', /Lukas Ferrari/.test(list) && /Senior scout/.test(list)
    && /Scouting Ostschweiz/.test(list) && /960/.test(list) && /next report in 1w/.test(list));
check('a roaming scout says so rather than "idle"', /Roaming/.test(list) && !/\bidle\b/.test(list));
// the whole point of the change: no editable control survives on the list
check('no dropdowns left on the list', !/<select/.test(list));
check('no assign/release buttons left on the list', !/ScoutingScreen\.(assignRegion|assignLeague|release|setIdle)/.test(list));
// age and contract belong to steps 2-3; until the data exists the row must not print placeholders
check('no hollow age or contract while those fields are absent', !/undefinedy/.test(list) && !/NaN/.test(list));

// ---------------- the card ----------------
console.log('\n-- the card: header and Overview --');
run("Router.isFreshNav = true; ScoutCard.render(document.getElementById('app'), 'sc_on');");
check('header carries name, derived title and status', /Lukas Ferrari/.test(appHTML)
    && /Senior scout/.test(appHTML) && /Scouting/.test(appHTML) && /Ostschweiz/.test(appHTML));
check('ability badge is present', /data-q="52"/.test(appHTML));
check('both tabs render, Overview active', /ScoutCard\.setTab\('sc_on','assignment'\)/.test(appHTML)
    && /class="tab is-active"[^>]*>Overview/.test(appHTML));
check('Overview shows wage, role and region', /Wage/.test(appHTML) && /Role/.test(appHTML) && /Region/.test(appHTML));
check('an assigned scout offers Recall, not Create assignment',
    /ScoutCard\.recall\('sc_on'\)/.test(appHTML) && !/Create assignment/.test(appHTML));
check('Release is offered', /ScoutCard\.confirmRelease\('sc_on'\)/.test(appHTML));

run("Router.isFreshNav = true; ScoutCard.render(document.getElementById('app'), 'sc_off');");
check('a roaming scout offers Create assignment, not Recall',
    /Create assignment/.test(appHTML) && !/ScoutCard\.recall/.test(appHTML));

// ---------------- the Assignment tab and the lock ----------------
console.log('\n-- the Assignment tab --');
run("Router.isFreshNav = false; ScoutCard.setTab('sc_off','assignment'); ScoutCard.render(document.getElementById('app'), 'sc_off');");
const free = appHTML;
check('Domestic is the default scope', /value="domestic" selected/.test(free));
check('region, brief and Set assignment are all offered', /id="scRg_sc_off"/.test(free)
    && /Max talent age/.test(free) && /Target position/.test(free) && /Target level/.test(free)
    && /ScoutCard\.setAssignment\('sc_off'\)/.test(free));
check('an unassigned scout can edit every control', !/disabled/.test(free.replace(/<option[^>]*disabled[^>]*>/g, '')));

run("Router.isFreshNav = false; ScoutCard.setTab('sc_on','assignment'); ScoutCard.render(document.getElementById('app'), 'sc_on');");
const locked = appHTML;
// the requested behaviour: a working scout's brief is frozen until he is recalled
const selects = locked.match(/<select[^>]*>/g) || [];
check('every select is disabled while he is on assignment (' + selects.length + ' selects)',
    selects.length >= 4 && selects.every(t => /disabled/.test(t)));
check('the button is Recall, and the lock is explained',
    /ScoutCard\.recall\('sc_on'\)/.test(locked) && /Recall from assignment/.test(locked)
    && /locked while he is out on assignment/.test(locked) && !/Set assignment/.test(locked));

// ---------------- international ----------------
console.log('\n-- international scope --');
run("ScoutCard.ctx('sc_off').scope = 'international'; GameState.agency.intlLicenceUntil = null;");
const noLic = run("return ScoutCard.scopeBlock(GameState.agency.scouts[1]);");
check('without a licence: the ISL line and NO pickers', /International Scouting Licence \(ISL\)/.test(noLic)
    && !/<select/.test(noLic));
run("GameState.agency.intlLicenceUntil = GameState.absWeek() + 52;");
const lic = run("return ScoutCard.scopeBlock(GameState.agency.scouts[1]);");
check('with a licence: country and league pickers plus View clubs',
    /id="scIntlC_sc_off"/.test(lic) && /id="scIntlL_sc_off"/.test(lic) && /View clubs/.test(lic));
check('the home country is not offered as a destination', !/>Switzerland</.test(lic));

// the international club preview is new — the old screen could only preview home regions
const div = run("return COUNTRY_DIVS['Germany'][0];");
run("ScoutCard.showLeagueClubs(COUNTRY_DIVS['Germany'][0]);");
check('a foreign league can be previewed too (' + div + ')',
    /club\(s\)/.test(sheetHTML) && /per scouting report/.test(sheetHTML));

// ---------------- release ----------------
console.log('\n-- release --');
run("ScoutCard.confirmRelease('sc_off');");
check('release asks first, naming the scout', /Beat Wyss/.test(modalHTML) && /Cancel/.test(modalHTML));
// hardware back must cancel the modal rather than fall through to confirming it
check('hardware back cancels the confirm (data-back="close")', /data-back="close"/.test(modalHTML));
run("ScoutCard.doRelease('sc_off');");
check('confirming removes him', run("return GameState.agency.scouts.length;") === 1);

// ---------------- i18n ----------------
console.log('\n-- every string resolves --');
// an unresolved key renders as the key itself, e.g. "sc.roaming"
const all = [list, appHTML, free, locked, lic, noLic, sheetHTML, modalHTML].join('\n');
const raw = [...all.matchAll(/\b(sc|scouting|scouts)\.[a-zA-Z.]+/g)].map(m => m[0])
    .filter(k => !/^scouts\.(err|ok)\./.test(k) || !all.includes(k));
check('no untranslated keys leaked into the markup' + (raw.length ? ' — ' + raw.slice(0, 6).join(', ') : ''), raw.length === 0);

// and the derived title must track quality, not the frozen field
run("GameState.agency.scouts[0].quality = 72;");
check('title is derived from current quality, not the stored one',
    run("return ScoutCard.title(GameState.agency.scouts[0]);") === 'Chief scout');

console.log(failed ? '\n*** FAIL ***' : '\nAll scout-card checks passed.');
process.exit(failed ? 1 : 0);
