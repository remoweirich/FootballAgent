// International Scouting Licence: new cost tiers, and the lapse-enforcement ladder — two-week grace,
// then €10k / €20k / €40k fines and a 52-week suspension that recalls overseas scouts.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const engine = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'injuries-data.js', 'simulation.js'];
const g = { console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: { open() { return { result: null, onsuccess: null }; } }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, window: { addEventListener() {} } };
g.UI = { money: n => Math.round(n || 0).toLocaleString('en-US'), euro: n => '€' + n };
vm.createContext(g);
for (const f of engine) vm.runInContext(fs.readFileSync(base + f, 'utf8'), g, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', g);
let failed = false; const check = (l, c, x) => { const v = typeof c === 'function' ? c() : c; console.log((v ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!v) failed = true; };

run(`Clubs.init(); GameState.startNewGame('Netherlands', 'Lic FC'); GameState.agency.balance = 1e6;`);

// ---- cost tiers ----
check('three licence options priced 20k / 37.5k / 52.5k', () => {
    const o = JSON.parse(run(`return JSON.stringify(Agency.INTL_LICENCE_OPTIONS);`));
    return o.length === 3 && o[0].weeks === 52 && o[0].cost === 20000 && o[1].weeks === 104 && o[1].cost === 37500 && o[2].weeks === 156 && o[2].cost === 52500;
});
check('buying the 2-season tier costs 37,500 and grants 104 weeks', () => {
    const r = JSON.parse(run(`const b0 = GameState.agency.balance; const r = Agency.buyIntlLicence(104); return JSON.stringify({ ok: r.ok, spent: b0 - GameState.agency.balance, left: Agency.intlLicenceWeeksLeft() });`));
    return r.ok && r.spent === 37500 && r.left === 104;
});

// ---- lapse ladder (drive _scoutLicence directly, controlling "weeks over" via intlLicenceUntil) ----
run(`
    // one scout working abroad
    GameState.agency.scouts.push({ id: 'sc1', name: 'Klaas', quality: 75, league: 'LIGUE1', country: 'France', region: null, weeksUntilFind: 3 });
    window.aw = GameState.absWeek();
`);
// while the licence is still valid, nothing happens
run(`GameState.agency.intlLicenceUntil = window.aw + 5; GameState.agency.balance = 1e6; GameState.inbox = []; Sim._scoutLicence([]);`);
check('valid licence: no fine, no mail', () => run(`return GameState.agency.balance === 1e6 && GameState.inbox.length === 0;`) === true);

// helper to set "weeks over" and run one enforcement tick from a clean slate
const tick = over => run(`GameState.agency.intlLicenceUntil = window.aw - ${over}; GameState.agency.intlSuspendedUntil = null; GameState.agency.scouts[0].league = 'LIGUE1'; GameState.agency.balance = 1e6; GameState.inbox = []; const ev = []; Sim._scoutLicence(ev); return JSON.stringify({ bal: GameState.agency.balance, mail: (GameState.inbox[0]||{}).subject || '', susp: Agency.intlSuspended(), league: GameState.agency.scouts[0].league });`);
let r = JSON.parse(tick(0)); check('week 0 (grace): warning, no fine', r.bal === 1e6 && /expired/i.test(r.mail));
r = JSON.parse(tick(1)); check('week 1 (grace): warning, no fine', r.bal === 1e6 && /expired/i.test(r.mail));
r = JSON.parse(tick(2)); check('week 2: €10,000 fine', r.bal === 1e6 - 10000 && /fine/i.test(r.mail));
r = JSON.parse(tick(3)); check('week 3: €20,000 fine', r.bal === 1e6 - 20000 && /fine/i.test(r.mail));
r = JSON.parse(tick(4)); check('week 4: €40,000 fine + suspension + scout recalled', r.bal === 1e6 - 40000 && r.susp === true && r.league == null);

// ---- suspension blocks abroad + buying, and only relevant while actually scouting abroad ----
check('a suspended agency cannot send a scout abroad', () => {
    const res = JSON.parse(run(`GameState.agency.intlSuspendedUntil = window.aw + 40; const r = Scouts.assignLeague('sc1', 'France', 'LIGUE1'); return JSON.stringify(r);`));
    return res.ok === false && /suspend/i.test(res.message);
});
check('a suspended agency cannot buy a licence', () => JSON.parse(run(`return JSON.stringify(Agency.buyIntlLicence(52));`)).ok === false);
check('no overseas scout: a lapsed licence does nothing', () => {
    return run(`GameState.agency.intlSuspendedUntil = null; GameState.agency.scouts[0].league = null; GameState.agency.intlLicenceUntil = window.aw - 3; GameState.agency.balance = 5e5; GameState.inbox = []; Sim._scoutLicence([]); return GameState.agency.balance === 5e5 && GameState.inbox.length === 0;`) === true;
});
check('renewing while lapsed (not yet suspended) stops the fines', () => {
    return run(`
        GameState.agency.intlSuspendedUntil = null; GameState.agency.scouts[0].league = 'LIGUE1';
        GameState.agency.intlLicenceUntil = window.aw - 2; GameState.agency.balance = 1e6;
        Agency.buyIntlLicence(52);            // renew -> intlLicenceUntil jumps forward
        const bal = GameState.agency.balance; GameState.inbox = []; Sim._scoutLicence([]);
        return GameState.inbox.length === 0 && GameState.agency.balance === bal;   // no fine after renewal
    `) === true;
});

console.log(failed ? '\n*** FAIL ***' : '\nAll scout-licence checks passed.');
process.exit(failed ? 1 : 0);
