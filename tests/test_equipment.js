// Gym equipment expansion + the Agency / Scouting reshuffle.
//  - Plyo Boxes, Kettlebells and a Weight Bench join the free weights; the Multifunctional
//    Strength Machine is replaced by four machines, each with the old machine's effect.
//  - Saves that owned the old machine get the Leg Curl Machine (same price, same effect).
//  - Every equipment / facility name is translated in all seven languages.
//  - Agency: one "Upgrades" section (Office, Vehicles, Properties, Equipment, Facilities), each a
//    row opening its list; Staff below it; no licence any more.
//  - Scouting: Finds, Your scouts, Hire, Licence; the licence is bought there.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

let appHTML = '', sheetHTML = '';
const byId = {};
const appEl = { set innerHTML(v) { appHTML = String(v); }, get innerHTML() { return appHTML; } };
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout() {},
    indexedDB: undefined, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: {
        getElementById: id => (id === 'app' ? appEl : (byId[id] || null)),
        querySelector: () => null, querySelectorAll: () => [],
        createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, innerHTML: '', appendChild() {} }),
        head: { appendChild() {} }, body: { appendChild() {} }, addEventListener() {},
    },
    addEventListener() {}, removeEventListener() {},
};
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'js/i18n.js', 'utf8'), sb, { filename: 'i18n.js' });
vm.runInContext(fs.readFileSync(root + 'js/i18n-en.js', 'utf8'), sb, { filename: 'i18n-en.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb, { filename: 'ui/i18n-en.js' });
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(root + 'js/' + f, 'utf8'), sb, { filename: f });
vm.runInContext(`
    var UI = { esc: s => (s == null ? '' : String(s)), euro: n => '\\u20ac' + n, money: n => String(n),
        abilityBadge: q => String(q), crest: () => '', flag: () => '', clubName: id => String(id) };
    var Router = { isFreshNav: true, screens: {}, register(n, d) { this.screens[n] = d; },
        link: (n, id) => '#' + n + '/' + id, refresh() {}, go() {}, replace() {}, result() {},
        sheet(h) { __sheet(h); }, closeSheet() {}, modal() {}, closeModal() {} };
`, sb);
sb.__sheet = h => { sheetHTML = String(h); };
for (const f of ['screen-agency.js', 'screen-scouting.js'])
    vm.runInContext(fs.readFileSync(root + 'ui/js/' + f, 'utf8'), sb, { filename: f });

const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

run(`Clubs.init(); GameState.startNewGame('England','Gym','A'); GameState.save = function () {};`);

// ---------------- the shelf ----------------
console.log('-- the equipment shelf --');
const eq = JSON.parse(run(`return JSON.stringify(EQUIPMENT);`));
const by = Object.fromEntries(eq.map(e => [e.id, e]));
const same = (a, b) => a && b && a.dev === b.dev && a.injury === b.injury && a.rep === b.rep;
check('the Multifunctional Strength Machine is gone', !by.strength_machine);
check('Plyo Boxes: same price as Dumbbells, same effect', by.plyo_boxes && by.plyo_boxes.price === by.dumbbells.price && same(by.plyo_boxes, by.dumbbells));
check('Kettlebells: twice the Dumbbells, same effect', by.kettlebells && by.kettlebells.price === 2 * by.dumbbells.price && same(by.kettlebells, by.dumbbells));
check('Weight Bench: twice the Kettlebells, same effect', by.weight_bench && by.weight_bench.price === 2 * by.kettlebells.price && same(by.weight_bench, by.dumbbells));
const OLD_MACHINE = { dev: 0.5, injury: -0.25, rep: 1 };
for (const [id, price] of [['squat_rack', 15000], ['functional_trainer', 20000], ['leg_curl', 10000], ['leg_extension', 10000]])
    check(`${by[id] ? by[id].name : id}: €${price}, the old machine's effect`, by[id] && by[id].price === price && same(by[id], OLD_MACHINE));

const full = JSON.parse(run(`
    var st = Upgrades.facState(); st.items = [];
    var before = { dev: Upgrades.facDevBonus(), rep: Upgrades.facRepBonus() };
    EQUIPMENT.filter(function (e) { return !e.facility; }).forEach(function (e) { st.items.push({ id: e.id, expiresWeek: null }); });
    var after = { dev: Upgrades.facDevBonus(), rep: Upgrades.facRepBonus(), inj: Upgrades.facInjuryBonus() };
    st.items = [];
    return JSON.stringify({ before: before, after: after });`));
check(`a full equipment shelf: +${full.after.dev}% development, +${full.after.rep} rep limit, ${full.after.inj}% injury`,
    full.after.dev === 5 && full.after.rep === 5 && full.after.inj === -3.5);

// buying works for the new items, once each
const buy = JSON.parse(run(`
    GameState.agency.balance = 100000;
    var a = Upgrades.buyEquip('kettlebells'), b = Upgrades.buyEquip('kettlebells'), c = Upgrades.buyEquip('functional_trainer');
    return JSON.stringify({ a: a.ok, b: b.ok, c: c.ok, bal: GameState.agency.balance, msg: a.message });`));
check('a new item can be bought, and only once', buy.a && !buy.b && buy.c && buy.bal === 100000 - 2000 - 20000);
check('...and the confirmation names it', buy.msg.includes('Kettlebells'), buy.msg);

// ---------------- old saves ----------------
console.log('\n-- saves with the old Strength Machine --');
check('the save schema moved on (6)', run('return GameState.SCHEMA_VERSION;') === 6);
check('...with a migration to 6', run('return GameState.MIGRATIONS.some(function (m) { return m.to === 6; });') === true);
const mig = JSON.parse(run(`
    var st = Upgrades.facState();
    st.items = [{ id: 'dumbbells', expiresWeek: null }, { id: 'strength_machine', expiresWeek: null }];
    // what the old machine was worth to him, before the migration (an unknown id counts for nothing,
    // so measure with the old definition put back for a moment)
    EQUIPMENT.push({ id: 'strength_machine', price: 10000, dev: 0.5, injury: -0.25, rep: 1 });
    var was = { dev: Upgrades.facDevBonus(), rep: Upgrades.facRepBonus(), lim: Upgrades.repLimit() };
    EQUIPMENT.pop();
    GameState._migrateStrengthMachine();
    var now = { dev: Upgrades.facDevBonus(), rep: Upgrades.facRepBonus(), lim: Upgrades.repLimit() };
    var ids = st.items.map(function (it) { return it.id; });
    GameState._migrateStrengthMachine();                 // running it twice changes nothing
    var again = st.items.map(function (it) { return it.id; });
    st.items = [{ id: 'dumbbells', expiresWeek: null }];
    GameState._migrateStrengthMachine();
    var never = st.items.map(function (it) { return it.id; });
    return JSON.stringify({ was: was, now: now, ids: ids, again: again, never: never });`));
check('the old machine became a Leg Curl Machine', mig.ids.includes('leg_curl') && !mig.ids.includes('strength_machine'), mig.ids.join());
check(`...worth exactly what it was (dev ${mig.was.dev}→${mig.now.dev}, rep limit ${mig.was.lim}→${mig.now.lim})`, mig.was.dev === mig.now.dev && mig.was.lim === mig.now.lim);
check('...and running the migration again changes nothing', mig.again.join() === mig.ids.join());
check('a save that never had the machine gets nothing extra', mig.never.join() === 'dumbbells');

// ---------------- names in every language ----------------
console.log('\n-- item names are translated --');
for (const lang of ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl']) {
    const src = fs.readFileSync(root + `js/i18n-${lang}.js`, 'utf8');
    const missing = eq.filter(e => !src.includes(`'equip.${e.id}':`)).map(e => e.id);
    check(`${lang}: all ${eq.length} equipment and facility names`, missing.length === 0, missing.join(', '));
}
const upg = JSON.parse(run(`return JSON.stringify([].concat(OFFICES, VEHICLES, PROPERTIES, STAFF).map(function (x) { return x.id; }));`));
for (const lang of ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl']) {
    const src = fs.readFileSync(root + `js/i18n-${lang}.js`, 'utf8');
    const missing = upg.filter(id => !src.includes(`'upg.name.${id}':`));
    check(`${lang}: all ${upg.length} office, vehicle, property and staff names`, missing.length === 0, missing.join(', '));
}
// no screen or message may print an untranslated .name for these any more
const rawName = /\b(off|vNext|pNext|item|v|p|o|s)\.name\b/;
const agencySrc = fs.readFileSync(root + 'ui/js/screen-agency.js', 'utf8');
check('the Agency screen shows only translated upgrade names', !/(off|vNext|pNext|item|s)\.name\b/.test(agencySrc.replace(/e\.name/g, '')));
const upgSrc = fs.readFileSync(root + 'js/upgrades.js', 'utf8').split('\n').filter(l => l.includes('this._t(') && !l.includes('itemName(item)') && !l.includes('equipName(id)')).join('\n');
check('...and so does every upgrade message', !rawName.test(upgSrc), (upgSrc.match(rawName) || [''])[0]);
// German end to end: the real German pack, a real purchase message
vm.runInContext(fs.readFileSync(root + 'js/i18n-de.js', 'utf8'), sb, { filename: 'i18n-de.js' });
const de = JSON.parse(run(`I18n.set('de'); var st = Upgrades.state(); var vi = st.vehicleIndex;
    GameState.agency.balance = 10; var poor = Upgrades.buyVehicle().message;
    GameState.agency.balance = 1e9; var ok = Upgrades.buyVehicle().message; st.vehicleIndex = vi;
    var r = JSON.stringify({ poor: poor, ok: ok, office: Upgrades.itemName(OFFICES[7]), staff: Upgrades.itemName(STAFF[1]) });
    I18n.set('en'); return r;`));
check(`German: "${de.poor}"`, de.poor.startsWith('Nicht genug Geld: Firmenwagen'));
check(`German: "${de.ok.slice(0, 40)}…"`, de.ok.startsWith('Firmenwagen erworben'));
check(`German office "${de.office}", staff "${de.staff}"`, de.office === 'Klassisches Büro II' && de.staff === 'Personal Trainer');
check('the staff line names the item they restock through the translation', fs.readFileSync(root + 'ui/js/screen-agency.js', 'utf8').includes('Upgrades.equipName(s.yearly)'));

// ---------------- Agency layout ----------------
console.log('\n-- the Agency screen --');
const body = { innerHTML: '' };
byId.screenBody = body;
run(`Upgrades.facState().items = [{ id: 'dumbbells', expiresWeek: null }, { id: 'kettlebells', expiresWeek: null }];`);
run(`AgencyScreen.render(document.getElementById('screenBody'));`);
const html = body.innerHTML;
const at = s => html.indexOf(s);
const rows = ['ladder(\'office\')', 'ladder(\'vehicle\')', 'ladder(\'property\')', 'shelf(\'equipment\')', 'shelf(\'facilities\')'].map(at);
check('one Upgrades section', html.includes('>Upgrades</div>'));
check('...holding Office, Vehicles, Properties, Equipment, Facilities in that order', rows.every(i => i > at('>Upgrades</div>')) && rows.every((v, i) => i === 0 || v > rows[i - 1]), rows.join(','));
check('Staff is its own section, below the Upgrades', at('>Staff</div>') > rows[4]);
check('the licence is no longer on the Agency screen', !html.includes('International Scouting Licence') && !html.includes('buyLicence'));
check('no equipment cards loose on the screen (they live in the lists)', !html.includes('buyEquip('));
check('the Equipment row counts what you own', /2 of 11 owned/.test(html), (html.match(/\d+ of \d+ owned/g) || []).join(' | '));
check('...and the Facilities row too', /0 of 4 owned/.test(html));

run(`AgencyScreen.shelf('equipment');`);
const eqSheet = sheetHTML;
const prices = [...eqSheet.matchAll(/buyEquip\('([a-z_]+)'\)/g)].map(m => by[m[1]].price);
check('the Equipment list shows all 11 items (9 still to buy), none of the facilities', prices.length === 11 - 2 && (eqSheet.match(/class="card"/g) || []).length === 11 && !eqSheet.includes("buyEquip('gym')"), prices.length + ' buyable');
check('...cheapest first', prices.every((p, i) => i === 0 || p >= prices[i - 1]), prices.join(','));
check('...owned items say so instead of offering a price', (eqSheet.match(/pill--accent">owned</g) || []).length === 2);
run(`AgencyScreen.shelf('facilities');`);
check('the Facilities list holds the four facilities', ['gym', 'pool', 'training_ground', 'medical_center'].every(id => sheetHTML.includes(`buyEquip('${id}')`)) && !sheetHTML.includes("buyEquip('dumbbells')"));

run(`GameState.agency.balance = 50000; sheetHTML = '';`);
sheetHTML = '';
run(`AgencyScreen.buyEquip('plyo_boxes');`);
check('buying from the list reopens the list, with the item now owned', sheetHTML.includes('Plyo Boxes') && !sheetHTML.includes("buyEquip('plyo_boxes')"));
check('...and the row underneath counts it', /3 of 11 owned/.test(body.innerHTML), (body.innerHTML.match(/\d+ of 11 owned/) || [''])[0]);

// ---------------- Scouting ----------------
console.log('\n-- the Scouting screen --');
const sEl = { innerHTML: '' };
byId.scoutSection = sEl;
run(`ScoutingScreen.tab = 'finds'; ScoutingScreen.render({ set innerHTML(v) { __tabs = v; } });`);
const tabs = [...run('return __tabs;').matchAll(/setTab\('([a-z]+)'\)/g)].map(m => m[1]);
check('tabs read Finds, Your scouts, Hire, Licence', tabs.join() === 'finds,scouts,market,licence', tabs.join());
run(`ScoutingScreen.tab = 'licence'; ScoutingScreen.renderSection();`);
check('the Licence tab shows the status and the licence options', sEl.innerHTML.includes('Not held') || sEl.innerHTML.includes('Status'));
check('...with a buy button per option', (sEl.innerHTML.match(/ScoutingScreen\.buyLicence\(/g) || []).length === run('return Agency.INTL_LICENCE_OPTIONS.length;'));
run(`GameState.agency.balance = 10000000; ScoutingScreen.buyLicence(Agency.INTL_LICENCE_OPTIONS[0].weeks);`);
check('buying there grants the licence', run('return Agency.hasIntlLicence();') === true);
check('the scout card\'s "needs a licence" hint links to that tab', fs.readFileSync(root + 'ui/js/screen-scout.js', 'utf8').includes('ScoutingScreen.openLicence()'));
const stale = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'].filter(l => {
    const ui = fs.readFileSync(root + `ui/js/i18n-${l}.js`, 'utf8'), en = fs.readFileSync(root + `js/i18n-${l}.js`, 'utf8');
    const pick = (src, k) => ((src.match(new RegExp(`'${k.replace('.', '\\.')}':\\s*(['"])(.*?)\\1,`)) || [])[2] || '');
    const agencyWord = { en: 'Agency', de: 'Agentur', fr: 'Agence', es: 'Agencia', it: 'Agenzia', pt: 'Agência', nl: 'Bureau' }[l];
    return [pick(ui, 'sc.needISL'), pick(ui, 'scouting.needLicence'), pick(en, 'sim.licRenew'), pick(en, 'scouts.err.needLicence')]
        .some(t => t.includes(agencyWord) || t.includes('Agentschap'));
});
check('no language still sends you to the Agency tab for the licence', stale.length === 0, stale.join(', '));

console.log(failed ? '\n*** FAIL ***' : '\nAll equipment and agency-layout checks passed.');
process.exit(failed ? 1 : 0);
