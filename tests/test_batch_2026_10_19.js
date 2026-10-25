// Playtest batch 2026-10-19: a club id with an apostrophe (Collina d'Oro) stays clickable; boyhood
// clubs come from his nationality or where he plays (never the agency's country by default, never a
// youth side); the Clients tab sorts by scouted potential (the verdict's range, then the name); the
// client history sorts by clean sheets.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const errors = [];
const mkEl = () => ({ innerHTML: '', style: {}, querySelectorAll: () => [], addEventListener() {} });
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.map(String).join(' ')) }, setTimeout: () => 0, clearTimeout() {}, Math, Date, JSON,
    indexedDB: undefined, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => null, createElement: mkEl, querySelector: () => null, documentElement: { style: {}, setAttribute() {} } },
    addEventListener() {}, matchMedia: () => ({ matches: false }), location: { hash: '' },
};
sb.window = sb;
sb.Router = { register() {}, link: (a, b) => `#${a}/${encodeURIComponent(b).replace(/'/g, '%27')}`, refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {}, isFreshNav: false };
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
for (const f of ['i18n-en.js', 'shim.js', 'screen-leagues.js', 'screen-clients.js', 'screen-club.js', 'screen-client-detail.js'])
    vm.runInContext(fs.readFileSync(root + 'ui/js/' + f, 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(31); Clubs.init(); GameState.startNewGame('Switzerland','B','A'); GameState.save = function () {};`);

// ---------------- 1. an apostrophe in a club id ----------------
console.log('-- Collina d\'Oro --');
check('links encode the apostrophe (so a link inside an onclick still works)', /replace\(\/'\/g, '%27'\)/.test(fs.readFileSync(root + 'ui/js/router.js', 'utf8')));
const arg = run(`return UI.jsArg("Collina d'Oro");`);
const decoded = arg.replace(/&#39;/g, "'").replace(/&amp;/g, '&');
let got = null; new Function('go', "go('" + decoded + "')")(x => { got = x; });
check('UI.jsArg survives the browser turning &#39; back into a quote', got === "Collina d'Oro", arg);
const lg = fs.readFileSync(root + 'ui/js/screen-leagues.js', 'utf8');
check('no league table row builds its club hash with encodeURIComponent alone', !/location\.hash='clubs\/\$\{encodeURIComponent/.test(lg));
const tbl = run(`var c = Clubs.getClubById("Collina d'Oro"); if (!c) return 'no club'; var el = { innerHTML: '' }; ClubScreen.render(el, c.id); return el.innerHTML;`);
check("the club page's buttons carry a safe id", tbl.indexOf("Collina d\\&#39;Oro") >= 0 && tbl.indexOf("setMode('Collina d&#39;Oro'") < 0, tbl.slice(0, 120));

// ---------------- 2. boyhood clubs ----------------
console.log('\n-- boyhood clubs --');
const fav = JSON.parse(run(`
    var eng = Clubs.allClubs.find(function (c) { return c.country === 'England' && c.tier === 1; });
    var res = { country: {}, reserve: 0, n: 300 };
    for (var i = 0; i < res.n; i++) {
        var p = PlayerGen.makePlayer(eng, { ability: 60, age: 20, position: 'CM' }); p.nationality = 'Nigeria';
        var c = Clubs.getClubById(Dialogue._rollFavClub(p));
        res.country[c.country] = (res.country[c.country] || 0) + 1;
        if (isReserveClub(c.id)) res.reserve++;
    }
    // clubless (free agent): his last club decides, not the agency's country (Switzerland)
    var fa = PlayerGen.makePlayer(eng, { ability: 60, age: 24, position: 'CM' }); fa.nationality = 'Nigeria';
    var y = GameState.seasonStartYear; fa.stats = {}; fa.stats[y - 1] = { a: { clubId: eng.id, youth: false, comps: { PREM: { apps: 20, goals: 0, assists: 0 } } } };
    fa.clubId = null; fa.freeAgent = true;
    res.faHome = Dialogue._homeCountryOf(fa);
    // a Swiss lad never names a youth side
    var yb = Clubs.allClubs.find(function (c) { return c.country === 'Switzerland' && c.tier === 1; }); var sw = 0;
    for (var j = 0; j < 300; j++) { var q = PlayerGen.makePlayer(yb, { ability: 60, age: 19, position: 'ST' }); q.nationality = 'Switzerland'; if (isReserveClub(Dialogue._rollFavClub(q))) sw++; }
    res.swissReserve = sw;
    return JSON.stringify(res);`));
const eng = fav.country.England || 0;
check('a Nigerian at an English club: his boyhood club is English (bar the odd foreign giant), never Swiss', eng >= fav.n * 0.9 && !fav.country.Switzerland, JSON.stringify(fav.country));
check('a clubless player: the club he played for decides his home, not the agency country', fav.faHome === 'England', fav.faHome);
check('a boyhood club is never a youth side', fav.reserve === 0 && fav.swissReserve === 0, JSON.stringify(fav));
const mig = JSON.parse(run(`
    var res = Clubs.allClubs.find(function (c) { return isReserveClub(c.id) && parentClubForReserve(c.id); });
    var p = GameState.players.find(function (x) { return x.clubId && !x.agentId; }); delete p.facts; Dialogue.ensureFacts(p);
    p.facts.favClub = { clubId: res.id, discovered: true, fulfilled: false };
    Dialogue.ensureFacts(p);
    return JSON.stringify({ was: res.id, now: p.facts.favClub.clubId, parent: parentClubForReserve(res.id).id });`));
check('an old save whose boyhood club is a youth side gets its senior club instead', mig.now === mig.parent, JSON.stringify(mig));

// European nations without a league in the game: their clubs from the European cups
const eu = JSON.parse(run(`
    var eng = Clubs.allClubs.find(function (c) { return c.country === 'England' && c.tier === 1; });
    var out = {};
    ['Croatia', 'Türkiye', 'Republic of Ireland', 'Germany'].forEach(function (nat) {
        var key = Dialogue.EU_POOL_KEY[nat] || nat, pool = EUROPE_DATA.pools[key], ids = pool ? pool.clubs.map(function (c) { return c.id; }) : [];
        var home = 0, giant = 0, names = {}, n = 200;
        for (var i = 0; i < n; i++) {
            var p = PlayerGen.makePlayer(eng, { ability: 60, age: 20, position: 'CM' }); p.nationality = nat;
            var id = Dialogue._rollFavClub(p), c = Clubs.getClubById(id);
            if (ids.indexOf(id) >= 0 || (c && c.country === nat)) home++; else if (c && c.tier === 1 && c.reputation >= 82) giant++;
            names[Dialogue._favName(id)] = 1;
        }
        out[nat] = { home: home, giant: giant, other: n - home - giant, distinct: Object.keys(names).length, sample: Object.keys(names).slice(0, 3) };
    });
    var p = PlayerGen.makePlayer(eng, { ability: 60, age: 20, position: 'CM' }); p.nationality = 'Croatia'; delete p.facts;
    Dialogue.ensureFacts(p); p.facts.favClub.clubId = EUROPE_DATA.pools.Croatia.clubs[0].id; p.facts.favClub.discovered = false;
    var said = Dialogue.resolveCheckin(p, 'q-club').note;
    out.said = said; out.club = EUROPE_DATA.pools.Croatia.clubs[0].name;
    return JSON.stringify(out);`));
check('a Croatian, a Turk and an Irishman at an English club grow up supporting clubs of their own nation (bar the odd foreign giant)',
    ['Croatia', 'Türkiye', 'Republic of Ireland'].every(k => eu[k].home >= 180 && eu[k].other === 0 && eu[k].distinct >= 2), JSON.stringify(eu));
check('...and a German still picks from the German league as before', eu.Germany.home >= 180 && eu.Germany.other === 0, JSON.stringify(eu.Germany));
check('the European-cup club is named when he tells you', eu.said.indexOf(eu.club) >= 0, eu.said + ' / ' + eu.club);

// ---------------- 3. sort by scouted potential ----------------
console.log('\n-- scouted potential --');
const pot = JSON.parse(run(`
    var mk = function (name, country, est) { var p = GameState.players.find(function (x) { return x.clubId && !x.agentId && !x._t; }); p._t = 1; p.agentId = 'me'; p.name = name;
        p.report = { scoutQuality: 50, role: null, descIdx: 0, estPotential: est, floorPotential: est - 8, country: country }; p.potential = 99 - est; return p; };
    Agency.clients().forEach(function (q) { if (!q._t) q.agentId = null; });
    // Netherlands: EED Regular 58-64; England has its own ladder: pick two estimates in the same Dutch tier
    var a = mk('Zed', 'Netherlands', 60), b = mk('Abe', 'Netherlands', 63), c = mk('Max', 'Netherlands', 79), d = mk('Old', 'Netherlands', 30);
    d.report = { ceiling: 'Some old words' };
    ClientsScreen.state.filter = 'all'; ClientsScreen.state.positions = []; ClientsScreen.state.sort = 'potential'; ClientsScreen.state.dir = 'desc';
    var order = ClientsScreen.sorted().map(function (r) { return r.p.name; });
    var ra = Scouting.ceilingRange(a), rc = Scouting.ceilingRange(c);
    var card = ClientsScreen.card(ClientsScreen.sorted()[0]);
    return JSON.stringify({ order: order, ra: ra, rc: rc, card: card.indexOf(Scouting.ceilingFor(c)) >= 0 });`));
check('ceiling ranges come from the tier, not the hidden estimate (60 and 63 both read 58-64)', pot.ra.lower === 58 && pot.ra.upper === 64 && pot.rc.lower === 78 && pot.rc.upper === 84, JSON.stringify(pot));
check('sorted by the verdict, then alphabetically within the same verdict (true potential never decides); old reports last', pot.order.join() === 'Max,Abe,Zed,Old', JSON.stringify(pot.order));
check('while sorting by it, each card shows the scout\'s ceiling verdict', pot.card);
const cross = JSON.parse(run(`return JSON.stringify(['Netherlands', 'England', 'Germany', 'Spain', 'Switzerland'].map(function (k) { var p = { report: { estPotential: 61, country: k } }; return [k, Scouting.ceilingRange(p)]; }));`));
check('the same estimate maps onto each country\'s own tier bands (comparable across leagues)', cross.every(x => x[1] && x[1].upper >= x[1].lower), JSON.stringify(cross));

// ---------------- 4. client history: clean sheets ----------------
const cs = JSON.parse(run(`return JSON.stringify(ClientHistory.SORTS.map(function (s) { return s[0]; }));`));
check('the client history can sort by clean sheets', cs.indexOf('cs') >= 0 && run(`return I18n.t('clienthist.sort.cs');`) === 'Clean sheets', JSON.stringify(cs));
// ---------------- wages, 2026-10-20 ----------------
console.log('\n-- wages --');
// a move agreed for the next window: no wage worries, club morale frozen, no club/wage complaints
const pend = JSON.parse(run(`
    var p = GameState.players.find(function (x) { return x.clubId && !x.agentId && x.age >= 22 && !x.onLoanAt; }); p.agentId = 'me'; p.everClient = true;
    p.morale = { club: 30, time: 70, wage: 20, agent: 70 }; p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 }; p.moraleCase = null; p.injury = null;
    var to = Clubs.allClubs.find(function (c) { return c.id !== p.clubId && c.tier === 1; });
    p.pendingTransfer = { toClubId: to.id, fromClubId: p.clubId, wage: p.wage * 2, role: 'rotation', term: 3 };
    var club0 = p.morale.club, wage0 = p.morale.wage, wages = [];
    for (var i = 0; i < 12; i++) { Sim._morale([]); wages.push(p.morale.wage); }
    return JSON.stringify({ wage0: wage0, wages: wages, club0: club0, club: p.morale.club, cse: p.moraleCase, streak: p._badStreak });`));
check('a move agreed: wage morale stays frozen where it was at the handshake until the move', pend.wages.every(w => w === pend.wage0), JSON.stringify(pend));
check('...his club morale stays frozen where it was, and no club or wage complaint opens', pend.club === pend.club0 && !pend.cse && pend.streak.club === 0 && pend.streak.wage === 0, JSON.stringify(pend));
// what a player expects lines up with what his league pays
const mk = JSON.parse(run(`var by = {}; GameState.players.forEach(function (p) { var c = Clubs.getClubById(p.clubId); if (!c || p.age < 20) return; (by[c.country] = by[c.country] || []).push(p.wage / Agency.marketWage(p, c)); });
    var out = {}; Object.keys(by).forEach(function (k) { var a = by[k].sort(function (x, y) { return x - y; }); out[k] = { median: Math.round(a[a.length >> 1] * 100) / 100, under: Math.round(a.filter(function (x) { return x < MORALE.WAGE_FAIR_FROM; }).length / a.length * 100) }; });
    return JSON.stringify(out);`));
check('in every league a typical player feels fairly paid (median ~1.0, few under the complaint line)', Object.values(mk).every(v => v.median >= 0.95 && v.under <= 10), JSON.stringify(mk));
// negotiations: room above the opening, and counters never go down
const ng = JSON.parse(run(`
    var clubs = Clubs.allClubs.filter(function (c) { return c.tier <= 3; }), minRoom = 9, overBudget = 0;
    for (var i = 0; i < 1500; i++) { var c = clubs[Math.floor(Rng.next() * clubs.length)], p = GameState.players[Math.floor(Rng.next() * GameState.players.length)]; if (!p || p.clubId === c.id) continue;
        var o = Agency.offeredWage(p, c, { loyalty: false }), m = Agency.maxClubWage(p, c); minRoom = Math.min(minRoom, m / o); if (o > Agency.clubWageCap(c) * 0.8 + 10) overBudget++; }
    var p = GameState.players.find(function (x) { return x.age <= 21 && x.potential - x.ability > 15 && x.clubId; }), c = Clubs.allClubs.find(function (x) { return x.reputation >= 78 && x.id !== p.clubId; });
    var open = Agency.offeredWage(p, c, { loyalty: false }), neg = null, ask = Math.round(open * 2), prev = 0, dropped = false, trail = [];
    for (var r = 0; r < 6; r++) { var res = Agency.evaluateTransfer(p, c, { wage: ask, role: 'rotation', term: 3, bonus: 0 }, neg, open); neg = res.neg;
        if (res.counter.wage < prev) dropped = true; prev = res.counter.wage; trail.push(res.counter.wage); if (res.status === 'accept' || res.status === 'walkout') break; ask = Math.round((ask + res.counter.wage) / 2 / 10) * 10; }
    var feeAsk = Agency.evaluateTransfer(p, c, { wage: open, role: 'rotation', term: 6, bonus: 0 }, null, open);
    return JSON.stringify({ minRoom: minRoom, overBudget: overBudget, dropped: dropped, trail: trail, openAccepted: feeAsk.status === 'accept' || feeAsk.status === 'close' || feeAsk.counter.wage >= open });`));
check('a club opens at most at 80% of its wage budget, leaving at least ~20% to haggle for', ng.minRoom >= 1.2 && ng.overBudget === 0, JSON.stringify(ng));
check('haggling never makes the club\'s counter go down, and its own opening wage always stands', !ng.dropped && ng.openAccepted, JSON.stringify(ng));

check('no engine errors, got ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
if (failed) process.exit(1);
