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
        xyChart: (pts, col, o) => '<svg class="xychart" data-n="' + pts.length + '"></svg>',
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
          region: 'ostschweiz', league: null, country: null, weeksUntilFind: 1, maxTalentAge: 19,
          contractWeeks: 104, contractUntil: GameState.absWeek() + 78,
          age: 43, birthWeek: 12, hireQuality: 44,
          history: { ability: [{ t: GameState.absWeek() - 208, value: 44 },
                               { t: GameState.absWeek() - 104, value: 48 },
                               { t: GameState.absWeek(), value: 52 }] } },
        { id: 'sc_off', name: 'Beat Wyss', title: 'Lead scout', quality: 41, weeklyCost: 420,
          region: null, league: null, country: null, weeksUntilFind: 7, maxTalentAge: 22,
          contractWeeks: 52, contractUntil: GameState.absWeek(),
          age: 31, birthWeek: 30, hireQuality: 41, history: { ability: [] } }
    ];
`);

// ---------------- the collapsed list ----------------
console.log('\n-- "Your scouts" is now rows, not forms --');
const list = run("ScoutingScreen.tab='scouts'; return ScoutingScreen.yourScouts();");
check('a row per scout, each linking to its card', /#scout\/sc_on/.test(list) && /#scout\/sc_off/.test(list));
check('age is on the row now that scouts have one', /43y/.test(list) && /31y/.test(list));
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
check('all three tabs render, Overview active', /ScoutCard\.setTab\('sc_on','assignment'\)/.test(appHTML)
    && /ScoutCard\.setTab\('sc_on','history'\)/.test(appHTML)
    && /class="tab is-active"[^>]*>Overview/.test(appHTML));
check('the header carries his age', /43y/.test(appHTML));
check('Overview shows wage, role and region', /Wage/.test(appHTML) && /Role/.test(appHTML) && /Region/.test(appHTML));
// 78 weeks to run reads in years; inside the last season it switches to weeks
check('contract remaining reads in years past a season', /Contract/.test(appHTML) && /1\.5 years/.test(appHTML));
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
// sc_off is out of contract, so there is nothing to pay and nothing to warn about
check('an out-of-contract scout shows no fee', !/costs/.test(modalHTML) && !/disabled/.test(modalHTML));
run("ScoutCard.doRelease('sc_off');");
check('confirming removes him', run("return GameState.agency.scouts.length;") === 1);

// sc_on still has 78 weeks to run: the modal must state the bill before you commit
run("GameState.agency.balance = 50000000; ScoutCard.confirmRelease('sc_on');");
const feeDue = run("return Scouts.terminationFee(GameState.agency.scouts[0]);");
check('a scout under contract shows the pay-off and the weeks left (' + feeDue + ')',
    feeDue > 0 && /78 week/.test(modalHTML) && modalHTML.includes(String(feeDue)));
// and when you cannot cover it the button is dead rather than the action silently failing
run("GameState.agency.balance = 10; ScoutCard.confirmRelease('sc_on');");
check('an unaffordable pay-off disables the confirm', /cannot cover that pay-off/i.test(modalHTML)
    && /<button[^>]*disabled[^>]*>[^<]*Release/.test(modalHTML));
run("ScoutCard.doRelease('sc_on');");
check('...and forcing it through still does not remove him', run("return GameState.agency.scouts.length;") === 1);

// ---------------- the hire negotiation ----------------
console.log('\n-- hiring opens a negotiation, not an instant signing --');
run("GameState.agency.scouts = []; GameState.agency.balance = 5000000; Upgrades.ownedOffice = 'iconic3';");
run("GameState.agency.scoutMarket = [Scouts.makeOffer('Chief scout', 70)]; GameState.agency.scoutMarketWeek = GameState.absWeek();");
const offerId = run("return GameState.agency.scoutMarket[0].id;");
const marketHTML = run("return ScoutingScreen.market();");
check('the Hire button opens the negotiation rather than hiring',
    marketHTML.includes("ScoutingScreen.openHire('" + offerId + "')"));
check('the walkthrough can still find the hire button', /data-scout="/.test(marketHTML));
check('nobody was hired by rendering the market', run("return GameState.agency.scouts.length;") === 0);

run("ScoutingScreen.openHire('" + offerId + "');");
check('all six terms are offered', (sheetHTML.match(/ScoutingScreen\.pickTerm\(/g) || []).length === 6);
check('one year is preselected', /pickTerm\('[^']+',52\)/.test(sheetHTML) && /accent-tint/.test(sheetHTML));
check('the commitment is explained', /minimum contract is what you owe him/.test(sheetHTML));
// the point of the screen: longer is cheaper per week
const quotes = JSON.parse(run("return JSON.stringify(GameState.agency.scoutMarket[0].quotes);"));
check('the sheet prints the per-week price for each term',
    sheetHTML.includes(String(quotes['13'])) && sheetHTML.includes(String(quotes['156'])));
check('...and the total it commits you to', sheetHTML.includes(String(quotes['156'] * 156)));
check('3 months is dearer per week than 3 years', quotes['13'] > quotes['156']);

run("ScoutingScreen.pickTerm('" + offerId + "', 156);");
run("ScoutingScreen.confirmHire('" + offerId + "');");
const signed = JSON.parse(run("var s = GameState.agency.scouts[0]; return JSON.stringify({ n: GameState.agency.scouts.length, wage: s && s.weeklyCost, term: s && s.contractWeeks });"));
check('confirming hires him on the chosen term', signed.n === 1 && signed.term === 156 && signed.wage === quotes['156']);
check('he leaves the market', run("return (GameState.agency.scoutMarket || []).length;") === 0);

// ---------------- History ----------------
console.log('\n-- the History tab --');
run("GameState.agency.scouts = [{ id: 'sc_h', name: 'Chart Man', title: 'Senior scout', quality: 52,"
    + " weeklyCost: 900, age: 43, birthWeek: 12, hireQuality: 44, region: null, league: null, weeksUntilFind: 6,"
    + " contractUntil: GameState.absWeek(), history: { ability: ["
    + "   { t: GameState.absWeek() - 208, value: 44 }, { t: GameState.absWeek() - 104, value: 48 },"
    + "   { t: GameState.absWeek(), value: 52 } ] } }];");
run("Router.isFreshNav = false; ScoutCard.setTab('sc_h','history'); ScoutCard.render(document.getElementById('app'), 'sc_h');");
check('it draws a chart of every recorded point', /<svg class="xychart" data-n="3"/.test(appHTML));
check('it shows where he started and his peak', /Hired at/.test(appHTML) && />44</.test(appHTML)
    && /Peak/.test(appHTML) && />52</.test(appHTML));

// a scout whose rating has never moved has nothing to plot — one point is not a line
run("GameState.agency.scouts[0].history = { ability: [{ t: GameState.absWeek(), value: 52 }] };");
run("ScoutCard.render(document.getElementById('app'), 'sc_h');");
check('a flat career says so instead of drawing an empty chart',
    /Nothing to chart yet/.test(appHTML) && !/<svg class="xychart"/.test(appHTML));
// an old save's scout has no history at all until the migration seeds one
run("delete GameState.agency.scouts[0].history; ScoutCard.render(document.getElementById('app'), 'sc_h');");
check('a scout with no history at all does not crash the tab', /Nothing to chart yet/.test(appHTML));

// ---------------- the below-standard note ----------------
console.log('\n-- a scout who has slipped below his league --');
run("GameState.agency.scouts = [{ id: 'sc_lo', name: 'Faded', title: 'Lead scout', quality: 40,"
    + " weeklyCost: 500, age: 72, birthWeek: 3, hireQuality: 60, region: null, league: 'BUNDES',"
    + " country: 'Germany', weeksUntilFind: 4, contractUntil: GameState.absWeek(), history: { ability: [] } }];");
run("Router.isFreshNav = true; ScoutCard.render(document.getElementById('app'), 'sc_lo');");
check('the Overview warns he is below the league standard', /slipped below the \d+ this league expects/.test(appHTML));
check('...but he is NOT recalled — the decision stays the player\'s',
    /ScoutCard\.recall\('sc_lo'\)/.test(appHTML) && run("return GameState.agency.scouts[0].league;") === 'BUNDES');
run("GameState.agency.scouts[0].quality = 90; ScoutCard.render(document.getElementById('app'), 'sc_lo');");
check('a scout who meets the bar gets no warning', !/slipped below/.test(appHTML));

// ---------------- the tutorial must not be fenced behind the sheet ----------------
// #wtLayer sits at z-index 150, above .sheet-backdrop at 100, so once the tour's Hire tap opens
// the negotiation the walkthrough fences everything except its next target — which would be
// underneath the sheet. Hiring therefore HAS to be followed by a step aimed inside the sheet.
console.log('\n-- the walkthrough survives the negotiation --');
const wtSrc = require('fs').readFileSync(root + 'ui/js/walkthrough.js', 'utf8');
const stepKeys = [...wtSrc.matchAll(/key:\s*'([^']+)'/g)].map(m => m[1]);
const iHire = stepKeys.indexOf('wt.scout.hireGemma');
const iYours = stepKeys.indexOf('wt.scout.toYours');
check('the tour still hires Gemma and still reaches "Your scouts"', iHire >= 0 && iYours > iHire);
check('a step sits between them, so the player is not stuck behind the sheet', iYours === iHire + 2);
const between = wtSrc.slice(wtSrc.indexOf("'wt.scout.hireGemma'"), wtSrc.indexOf("'wt.scout.toYours'"));
check('...and it targets the sheet, not the screen underneath', /\.sheet /.test(between));
check('its text is translated in every language', (() => {
    const fsx = require('fs');
    return ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'].every(l =>
        /["']wt\.scout\.contract["']\s*:/.test(fsx.readFileSync(root + 'ui/js/i18n-' + l + '.js', 'utf8')));
})());

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
