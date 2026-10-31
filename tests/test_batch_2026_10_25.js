// Playtest batch 2026-10-25: shared records list every holder (youngest/oldest scorer dropped);
// international competitions have history pages and linked schedules, and "World" holds the World
// Cup; fewer red cards outside the hard men; a new client's wage morale can't dip for 52 weeks; youth
// finds start on a youth contract; a loan-listed client is offered out on loan by default.
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
for (const f of ['i18n-en.js', 'shim.js', 'screen-leagues.js', 'screen-home.js', 'screen-intl.js', 'screen-intl-americas.js', 'screen-intl-caf.js', 'screen-intl-asia.js', 'screen-nation.js', 'screen-clients.js', 'screen-club.js', 'screen-client-detail.js'])
    vm.runInContext(fs.readFileSync(root + 'ui/js/' + f, 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(41); Clubs.init(); GameState.startNewGame('England','B','A'); GameState.save = function () {};
    __pool = GameState.players.filter(function (x) { return !x.agentId && x.clubId && !x.retired; }); __k = 0;
    __client = function () { var p = __pool[__k++]; p.agentId = 'me'; p.everClient = true; return p; };`);

// ---------------- 1. records ----------------
console.log('-- records --');
const rec = JSON.parse(run(`var a = __client(), b = __client(), c = __client();
    a.name = 'Zane'; b.name = 'Abel'; c.name = 'Milo';
    [a, b].forEach(function (p) { p.intlTrophies = [{ comp: 'INTL_EURO', year: 2028, nation: 'eng' }, { comp: 'INTL_NL', year: 2027, nation: 'eng' }]; });
    c.intlTrophies = [{ comp: 'INTL_NL', year: 2027, nation: 'eng' }];
    var R = ClientRecords.compute([a, b, c]).filter(Boolean), t = R.find(function (r) { return /international trophies/i.test(r.label); });
    var card = ClientRecords.card(t);
    return JSON.stringify({ ps: t.ps.map(function (p) { return p.name; }), card: card.indexOf('Abel') >= 0 && card.indexOf('Zane') >= 0 && card.indexOf('Milo') < 0,
        labels: R.map(function (r) { return r.label; }) });`));
check('a shared record lists every holder (alphabetically), and only them', rec.ps.join() === 'Abel,Zane' && rec.card, JSON.stringify(rec));
check('youngest and oldest goalscorer are gone (goal dates are only kept per season)', !rec.labels.some(l => /Youngest goalscorer|Oldest goalscorer/.test(l)), JSON.stringify(rec.labels));

// ---------------- 2. international competitions ----------------
console.log('\n-- international history --');
const ih = JSON.parse(run(`var el = { innerHTML: '' };
    CompHistory.ctx('INTL_WC').tab = 'winners'; CompHistory.render(el, 'INTL_WC'); var wc = el.innerHTML;
    var p = __client(); p.intlStats = { 2027: { INTL_WC: { apps: 5, goals: 3, assists: 1, cs: 0, yellow: 1, red: 0, ratingSum: 36 } } }; p.intlTrophies = [{ comp: 'INTL_WC', year: 2030, nation: 'eng' }];
    var rows = CompHistory.playerRows('INTL_WC'), me = rows.find(function (r) { return r.p === p; });
    var q = { innerHTML: '' }; CompHistory.render(q, 'INTL_QUAL'); var qual = q.innerHTML;
    return JSON.stringify({ spain: /2026/.test(wc) && wc.indexOf('Spain') >= 0, brazil: /Brazil/.test(wc) && /5 titles|titles/.test(wc), record: wc.indexOf('Most titles') >= 0 || wc.indexOf('record') >= 0,
        me: me ? [me.apps, me.goals, me.titles, Math.round(me.avg * 10) / 10] : null, qual: qual.indexOf('no trophy') >= 0 });`));
check('the World Cup has a history page: record champions and the roll of honour, real history included (Spain 2026)', ih.spain && ih.brazil, JSON.stringify(ih));
check('...and a clients tab with what each client did in it', ih.me && ih.me.join() === '5,3,1,7.2', JSON.stringify(ih.me));
check('a competition without a trophy (qualifying) says so instead of showing winners', ih.qual, JSON.stringify(ih));
const links = JSON.parse(run(`
    var tl = trophyLink('INTL_EURO', 'x'), el = { innerHTML: '' };
    var res = Internationals.nationResults('eng'); NationScreen.state.tab = 'matches'; NationScreen.render(el, 'eng'); NationScreen.state.tab = 'overview';
    var keep = IntlScreen.state.conf; IntlScreen.state.conf = 'UEFA'; var hl = IntlScreen.historyLink('nl'), hq = IntlScreen.historyLink('teams'); IntlScreen.state.conf = keep;
    return JSON.stringify({ trophy: tl.indexOf("IntlScreen.openComp('INTL_EURO')") >= 0, schedule: res.length === 0 || el.innerHTML.indexOf("IntlScreen.openComp('INTL_") >= 0, hist: hl.indexOf('#comphist/INTL_NL') >= 0 && hq === '' });`));
check('international trophies open the competition itself (Competitions > International)', links.trophy, JSON.stringify(links));
check('the competition abbreviations in the nation schedule open the competition too', links.schedule, JSON.stringify(links));
check('each international competition view links to its history page', links.hist, JSON.stringify(links));
const world = JSON.parse(run(`
    var keep = IntlScreen.state.conf, out = {};
    IntlScreen.state.conf = 'WORLD'; out.world = IntlScreen.tabs().map(function (t) { return t[0]; });
    out.worldInfo = IntlScreen.info('WORLD').indexOf(compName('INTL_WC')) >= 0;
    out.ranking = IntlScreen.confTeams('WORLD').split('<tr').length - 2;
    IntlScreen.state.conf = 'UEFA'; out.uefaInfo = IntlScreen.info('UEFA').indexOf('>' + compName('INTL_WC') + '<') >= 0;
    out.picker = IntlScreen.confPicker().indexOf('value="WORLD"') >= 0;
    IntlScreen.state.conf = keep;
    return JSON.stringify(out);`));
check('"World" is in the dropdown, with the world ranking (every nation) and the World Cup roll of honour', world.picker && world.world.includes('teams') && world.world.includes('info') && world.worldInfo && world.ranking > 150, JSON.stringify(world));
check('the confederations no longer list the World Cup themselves', !world.uefaInfo, JSON.stringify(world));
const wcTab = JSON.parse(run(`
    // a World Cup season with its tournament drawn: the tournament shows under World, not under UEFA
    var S = IntlScreen.season(); if (!S) return JSON.stringify({ skip: true });
    var fake = Object.assign({}, S, { type: 'WORLD_CUP', tour: S.tour || { size: 48, hosts: [], groups: [], ko: {} } });
    var real = IntlScreen.season; IntlScreen.season = function () { return fake; };
    var keep = IntlScreen.state.conf; IntlScreen.state.conf = 'UEFA'; var u = IntlScreen.tabs().map(function (t) { return t[0]; });
    IntlScreen.state.conf = 'CONMEBOL'; var c = IntlScreen.tabs().map(function (t) { return t[0]; });
    IntlScreen.state.conf = 'WORLD'; var w = IntlScreen.tabs().map(function (t) { return t[0]; });
    IntlScreen.season = real; IntlScreen.state.conf = keep;
    return JSON.stringify({ u: u, c: c, w: w });`));
check('in a World Cup year the tournament tab sits under World only', wcTab.skip || (wcTab.w.includes('tour') && !wcTab.u.includes('tour') && !wcTab.c.includes('tour')), JSON.stringify(wcTab));

// ---------------- 3. red cards ----------------
const red = JSON.parse(run(`return JSON.stringify({ normal: redShare(1), fb: redShare(1.3), hard: redShare(1.8), soft: redShare(0.7) });`));
check('reds: the hard men keep 6% of their bookings, a normal player ~3.3%, sliding in between', red.hard === 0.06 && red.normal === 0.033 && red.soft === 0.033 && red.fb > 0.033 && red.fb < 0.06, JSON.stringify(red));
const career = JSON.parse(run(`
    // the expected reds of a 500-game career by position (normal role)
    var y = { CB: 0.15, CM: 0.11, ST: 0.06 }, out = {}; Object.keys(y).forEach(function (k) { out[k] = Math.round(y[k] * redShare(1) * 500 * 10) / 10; }); out.hardCB = Math.round(0.15 * 1.8 * redShare(1.8) * 500 * 10) / 10; return JSON.stringify(out);`));
check('a normal centre-back ends a 500-game career on ~2.5 reds (midfielders fewer, strikers fewest); a physical defender still ~8', career.CB < 3 && career.CM < career.CB && career.ST < career.CM && career.hardCB > 7.5, JSON.stringify(career));

// ---------------- 4. playing on in the final season ----------------
const ret = run(`return [35, 27, 22, 17, 12, 5].map(function (a) { return Sim._retirePostponeChance(a); }).join();`);
check('playing on after an announced final season: 50% (30+ games), 40, 30, 20, 10, 1%', ret === '0.5,0.4,0.3,0.2,0.1,0.01', ret);

// ---------------- 5. new clients' wage morale ----------------
const fresh = JSON.parse(run(`var p = __client(); p.injury = null; p.morale = { club: 70, time: 70, wage: 70, agent: 70 }; p._badStreak = { club: 0, time: 0, wage: 0, agent: 0 };
    Agency.signPlayer(Object.assign(p, { agentId: null }), 10, 10, 3); p.wage = 10;   // badly underpaid
    var w = []; for (var i = 0; i < 20; i++) { Sim._morale([]); w.push(p.morale.wage); }
    var low = Math.min.apply(null, w);
    p._signedAbs = GameState.absWeek() - 60; Sim._morale([]);
    return JSON.stringify({ low: low, start: w[0], after: p.morale.wage });`));
check('in his first 52 weeks with you the wage morale of a client never dips (even badly underpaid)', fresh.low >= 70, JSON.stringify(fresh));
check('...after that it behaves as normal again', fresh.after < 70, JSON.stringify(fresh));

// ---------------- 6. youth finds ----------------
const yth = JSON.parse(run(`
    var small = Clubs.allClubs.filter(function (c) { return c.tier >= 3; })[0];
    var full = Math.round(PlayerGen.wageFor(55, small.reputation) * clubWageMult(small) / 10) * 10;
    var pr = PlayerGen.makeProspect(small, { ability: 55, age: 18, potential: 80 });
    pr.agentId = 'me'; pr.everClient = true; GameState.players.push(pr);
    var worth = Agency.offeredWage(pr, small, { loyalty: true, jitter: false });
    // an older save: a known talent on a senior wage gets the youth deal at load
    var old = PlayerGen.makeProspect(small, { ability: 55, age: 18, potential: 80 }); old.wage = full; delete old._youthDeal; old.knownToAgent = true; GameState.players.push(old);
    GameState._youthDeals();
    return JSON.stringify({ full: full, youth: pr.wage, worth: worth, old: old.wage });`));
check('a youth find starts on a youth contract (40% of a senior wage for his level)', yth.youth === Math.round(yth.full * 0.4 / 10) * 10, JSON.stringify(yth));
check('...so renewing him is a real raise', yth.worth > yth.youth * 1.5, JSON.stringify(yth));
check('known talents in an older save get the youth deal too (clients keep theirs)', yth.old === Math.round(yth.full * 0.4 / 10) * 10, JSON.stringify(yth));

// ---------------- 7. offering a client out ----------------
const shop = JSON.parse(run(`var p = __client(); p.onLoanAt = null; p.pendingTransfer = null; p._loanOk = true;
    ClientDetail.renderShop = function () {};
    p.loanListed = true; ClientDetail.openShop(p.id); var a = ClientDetail.ctx(p.id).shop.mode;
    p.loanListed = false; ClientDetail.openShop(p.id); var b = ClientDetail.ctx(p.id).shop.mode;
    return JSON.stringify({ listed: a, normal: b });`));
check('a loan-listed client is offered out on loan by default; anyone else as a transfer', shop.listed === 'loan' && shop.normal === 'transfer', JSON.stringify(shop));

// morale: "Listen" in a complaint talk pauses the complaint's spillover onto You morale
const lis = JSON.parse(run(`
    var p = Agency.clients()[0]; var aw = GameState.absWeek();
    p.moraleCase = { dim: 'wage', stage: 2, sinceAbsWeek: aw, promise: null }; p._talkCooldownAbs = null; p.morale.agent = 50;
    var r = Dialogue.resolveComplaint(p, 'listen'); var out = { ok: r.ok, pause: p._spillPauseUntilAbs - aw, agent: p.morale.agent };
    p._talkCooldownAbs = null; Dialogue.resolveComplaint(p, 'listen'); out.again = p.morale.agent;
    p.moraleCase = null; return JSON.stringify(out);`));
check('"Listen" pauses the complaint spillover for 4 weeks and gives +6 You the first time', lis.ok && lis.pause === 4 && lis.agent === 56, JSON.stringify(lis));
check('...listening again to the same complaint only gives +2', lis.again === 58, JSON.stringify(lis));

// accepting a loan clears transfer bids (a contract offer stays); accepting a transfer clears loan offers and contract offers too
const deals = JSON.parse(run(`
    var p = Agency.clients().find(function (x) { return x.clubId && !x.onLoanAt && !x.pendingTransfer; });
    p.contractUntilSeason = GameState.seasonStartYear + 4;
    var others = Clubs.allClubs.filter(function (c) { return c.id !== p.clubId && c.tier <= 2; });
    var plant = function () {
        GameState.inbox = GameState.inbox.filter(function (m) { return !(m.offer && m.offer.playerId === p.id); });
        var t = GameState.addMail({ kind: 'transfer', subject: 't', offer: { playerId: p.id, fromClubId: p.clubId, toClubId: others[0].id, transferFee: 100000 } });
        var l = GameState.addMail({ kind: 'loan', subject: 'l', offer: { playerId: p.id, fromClubId: p.clubId, toClubId: others[1].id, role: 'starter' } });
        var l2 = GameState.addMail({ kind: 'loan', subject: 'l2', offer: { playerId: p.id, fromClubId: p.clubId, toClubId: others[2].id, role: 'starter' } });
        var r = GameState.addMail({ kind: 'renewal', subject: 'r', offer: { playerId: p.id, fromClubId: p.clubId, toClubId: p.clubId } });
        return { t: t, l: l, l2: l2, r: r };
    };
    var left = function () { return GameState.inbox.filter(function (m) { return m.offer && m.offer.playerId === p.id; }).map(function (m) { return m.kind; }).sort().join(','); };
    var m = plant(); var lr = Agency.acceptLoanOffer(m.l, 'starter'); var afterLoan = left();
    p.onLoanAt = null; p.loanUntilSeason = null; p.pendingTransfer = null;
    m = plant(); var tr = Agency.acceptTransfer(m.t, p.wage, 'starter', 3, 0); var afterTransfer = left();
    return JSON.stringify({ loanOk: !!(lr && lr.ok), afterLoan: afterLoan, transferOk: !!(tr && tr.ok !== false), afterTransfer: afterTransfer });`));
check('accepting a loan discards the transfer bids and the other loan offers, the contract offer stays', deals.loanOk && deals.afterLoan === 'renewal', JSON.stringify(deals));
check('accepting a transfer discards the loan offers and the contract offer too', deals.transferOk && deals.afterTransfer === '', JSON.stringify(deals));

// Client History counts the same as Records and the player's career total: every senior club competition
const hist = JSON.parse(run(`
    var p = Agency.clients()[0], club = Clubs.getClubById(p.clubId), yr = GameState.seasonStartYear - 1;
    p.stats = p.stats || {};
    var comps = {}; comps[club.division] = { apps: 30, goals: 9, assists: 4, cs: 0, yellow: 2, red: 0, ratingSum: 30 * 7 };
    comps.dummy_cup = { apps: 5, goals: 3, assists: 1, cs: 0, yellow: 0, red: 0, ratingSum: 5 * 7 };
    p.stats[yr] = { h: { clubId: p.clubId, loan: false, youth: false, order: 0, comps: comps } };
    var row = ClientHistory.rows().find(function (r) { return r.p.id === p.id; }), all = careerTotal(p), league = careerLeagueTotal(p);
    return JSON.stringify({ hist: [row.apps, row.goals, row.assists], all: [all.apps, all.goals, all.assists], league: league.apps });`));
check('Client History shows the same totals as Records / the career total (cups and Europe included), got ' + JSON.stringify(hist),
    JSON.stringify(hist.hist) === JSON.stringify(hist.all) && hist.all[0] > hist.league);

// boyhood / dream club: a player from a nation with no clubs in the game (Argentina) never gets a local side
// of the country he plays in; a Dutch player still can; older saves are repaired; the unnamed club is askable
const fav = JSON.parse(run(`
    var nl = Clubs.allClubs.find(function (c) { return c.country === 'Netherlands' && c.tier === 3; });
    var giant = function (id) { var c = Clubs.getClubById(id); return !!c && c.tier === 1 && c.reputation >= 82; };
    var mk = function (nat) { var p = PlayerGen.makePlayer(nl, { ability: 64, age: 22, position: 'RB' }); p.nationality = nat; p.clubId = nl.id; return p; };
    var arg = { local: 0, giants: 0, none: 0, dreamLocal: 0 }, nlp = { dutch: 0 };
    for (var i = 0; i < 300; i++) {
        var a = mk('Argentina'); delete a.facts; var f = Dialogue.ensureFacts(a), id = f.favClub.clubId;
        if (!id) arg.none++; else if (giant(id)) arg.giants++; else arg.local++;
        var dc = f.ambition.clubId; if (dc && Clubs.getClubById(dc) && Clubs.getClubById(dc).country === 'Netherlands' && Clubs.getClubById(dc).tier > 1) arg.dreamLocal++;
        var d = mk('Netherlands'); delete d.facts; var g = Dialogue.ensureFacts(d).favClub.clubId; if (g && Clubs.getClubById(g).country === 'Netherlands') nlp.dutch++;
    }
    // an older save: an Argentinian with an untold Dutch third-tier boyhood club and a dream pointing at it
    var o = mk('Argentina'); Dialogue.ensureFacts(o);
    o.facts.favClub = { clubId: nl.id, discovered: false, fulfilled: false }; o.facts.ambition = { type: 'dreamclub', clubId: nl.id, discovered: false, fulfilled: false };
    Dialogue.ensureFacts(o);
    var repaired = { fav: o.facts.favClub.clubId, dream: o.facts.ambition.clubId || null };
    // ...but an answer he already gave stands
    var t = mk('Argentina'); Dialogue.ensureFacts(t); t.facts.favClub = { clubId: nl.id, discovered: true, fulfilled: false };
    Dialogue.ensureFacts(t); var told = t.facts.favClub.clubId;
    // an unnamed boyhood club can still be asked about, and the answer is "a club back home"
    var u = mk('Argentina'); Dialogue.ensureFacts(u); u.facts.favClub = { clubId: null, discovered: false, fulfilled: false };
    var scene = Dialogue.buildCheckinScene ? Dialogue.buildCheckinScene(u) : null;
    var asks = scene ? scene.choices.some(function (c) { return c.key === 'q-club'; }) : null;
    var res = Dialogue.resolveCheckin(u, 'q-club');
    return JSON.stringify({ arg: arg, nl: nlp, repaired: repaired, nlId: nl.id, told: told, asks: asks, note: res && res.note, discovered: u.facts.favClub.discovered });`));
check('an Argentinian playing in the Netherlands never gets a local Dutch side as boyhood club (a foreign giant sometimes, else unnamed), got ' + JSON.stringify(fav.arg),
    fav.arg.local === 0 && fav.arg.giants > 0 && fav.arg.none > 0);
check('...nor a Dutch lower-league side as his dream club', fav.arg.dreamLocal === 0, JSON.stringify(fav.arg));
check('a Dutch player still grows up on a Dutch club', fav.nl.dutch > 250, JSON.stringify(fav.nl));
check('older saves: an untold local boyhood club (and the dream pointing at it) is rolled again', fav.repaired.fav !== fav.nlId && fav.repaired.dream !== fav.nlId, JSON.stringify(fav));
check('...but a boyhood club he already told you stands', fav.told === fav.nlId);
check('an unnamed boyhood club can be asked about: "a club back home"', fav.asks !== false && fav.discovered === true && /club back home/.test(fav.note || ''), JSON.stringify(fav));

// regional nationalities: weighted lists, and region entries that only state what differs from the country
// (rules, not today's numbers, so tuning the lists never breaks this)
const reg = JSON.parse(run(`
    var ch = secondaryNationalities('Switzerland'), vd = secondaryNationalities('Switzerland', 'vaud'), be = secondaryNationalities('Switzerland', 'bern');
    var inherited = Object.keys(ch).filter(function (k) { return !(k in SECONDARY_NATIONALITIES['Switzerland/vaud']); }).every(function (k) { return vd[k] === ch[k]; });
    var overridden = Object.keys(SECONDARY_NATIONALITIES['Switzerland/vaud']).every(function (k) { var w = SECONDARY_NATIONALITIES['Switzerland/vaud'][k]; return w > 0 ? vd[k] === w : !(k in vd); });
    // a 0 removes a country for a region; a plain country list counts as weight 1 each
    // (Brazil: still a plain list; the clubbed countries are all weighted now)
    SECONDARY_NATIONALITIES['Brazil/test'] = { 'Germany': 0, 'Chile': 2 }; delete _secondaryResolved['Brazil/test'];
    var nn = secondaryNationalities('Brazil', 'test'); delete SECONDARY_NATIONALITIES['Brazil/test']; delete _secondaryResolved['Brazil/test'];
    // the draw follows the weights
    var n = 40000, hit = 0, tot = Object.values(ch).reduce(function (s, w) { return s + w; }, 0);
    for (var i = 0; i < n; i++) if (getRegionSecondaryNationality('Switzerland', 'bern') === 'Liechtenstein') hit++;
    var nl = {}; for (var j = 0; j < n; j++) { var x = getRegionSecondaryNationality('Brazil'); nl[x] = (nl[x] || 0) + 1; }
    return JSON.stringify({ inherited: inherited, overridden: overridden, sameAsCountry: be === ch, noord: nn,
        lie: hit / n, lieExpected: (ch.Liechtenstein || 0) / tot, nl: nl, n: n, obj: pickWeightedNationality({ Japan: 0, Chile: 2 }) });`));
check('a region entry changes only what it names; everything else is the country list', reg.inherited && reg.overridden, JSON.stringify(reg));
check('a region without an entry uses the country list as is', reg.sameAsCountry);
check('in a region entry, 0 removes a country and a new one is added (plain country lists count as 1 each)', !('Germany' in reg.noord) && reg.noord.Chile === 2 && reg.noord.Italy === 1, JSON.stringify(reg.noord));
check('draws follow the weights (Liechtenstein in Bern: expected ' + (reg.lieExpected * 100).toFixed(1) + '%, got ' + (reg.lie * 100).toFixed(1) + '%)', Math.abs(reg.lie - reg.lieExpected) < 0.008);
check('plain lists pick evenly, and a weight of 0 is never picked', Object.values(reg.nl).every(v => Math.abs(v / reg.n - 1 / Object.keys(reg.nl).length) < 0.012) && reg.obj === 'Chile', JSON.stringify(reg.nl));

// regions can have their own neighbour list: more Liechtensteiners in the east, French in the west,
// Italians in the south; a region without its own list uses the country's
const rg = JSON.parse(run(`
    var club = function (reg) { return Clubs.allClubs.find(function (c) { return c.country === 'Switzerland' && c.region === reg; }); };
    // wiring: a club's region reaches the neighbour list (captured, no dice involved)
    var seen = {}, real = getRegionSecondaryNationality;
    getRegionSecondaryNationality = function (country, sub) { seen[country + '/' + sub] = 1; return real(country, sub); };
    for (var i = 0; i < 200; i++) getRegionForClub(club('vaud'));
    getRegionSecondaryNationality = real;
    var w = function (reg, nat) { var l = secondaryNationalities('Switzerland', reg), t = Object.values(l).reduce(function (s, x) { return s + x; }, 0); return (l[nat] || 0) / t; };
    return JSON.stringify({ wired: !!seen['Switzerland/vaud'],
        lieEast: w('ostschweiz', 'Liechtenstein'), lieBern: w('bern', 'Liechtenstein'), fraVaud: w('vaud', 'France'), fraBern: w('bern', 'France'),
        itaSouth: w('ticinovalais', 'Italy'), itaBern: w('bern', 'Italy'),
        bayern: (Clubs.getClubById('Bayern Munich') || {}).region, eschen: (Clubs.getClubById('Eschen-Mauren') || {}).region });`));
check('a club’s region reaches the neighbour list', rg.wired);
check('eastern Switzerland lists more Liechtensteiners than a region using the country list, got ' + (rg.lieEast * 100).toFixed(1) + '% vs ' + (rg.lieBern * 100).toFixed(1) + '%', rg.lieEast > rg.lieBern);
check('western Switzerland more French, the south more Italians', rg.fraVaud > rg.fraBern && rg.itaSouth > rg.itaBern, JSON.stringify(rg));
check('Bayern Munich and Eschen/Mauren sit in their own regions (not the Dutch Middelland)', rg.bayern === 'bayern' && rg.eschen === 'ostschweiz', JSON.stringify(rg));

// the history tables (Client History, club page): goals for everybody, clean sheets only when sorted by them or
// filtered to goalkeepers; the club page has the same position filter and sort list
const tbl = JSON.parse(run(`
    var gk = Agency.clients().find(function (p) { return p.position === 'GK'; }) || Agency.clients()[0];
    gk.position = 'GK'; var club = Clubs.getClubById(gk.clubId), y = GameState.seasonStartYear - 1, comps = {};
    comps[club.division] = { apps: 20, goals: 0, assists: 0, cs: 13, yellow: 1, red: 0, ratingSum: 20 * 6.9 };
    gk.stats = gk.stats || {}; gk.stats[y] = { t: { clubId: club.id, loan: false, youth: false, order: 0, comps: comps } };
    var head = function (html) { var i = html.indexOf('ht-head'); return html.slice(i, i + 400); };
    var st = ClientHistory.state, keep = JSON.stringify(st);
    var el = { innerHTML: '' }; st.sort = 'apps'; st.pos = 'all'; ClientHistory.render(el); var dflt = head(el.innerHTML);
    st.sort = 'cs'; ClientHistory.render(el); var bySort = head(el.innerHTML);
    st.sort = 'apps'; st.pos = 'GK'; ClientHistory.render(el); var byPos = head(el.innerHTML);
    Object.assign(st, JSON.parse(keep));
    ClubScreen.state.mode = 'all'; var c = { innerHTML: '' }; ClubScreen.render(c, club.id);
    return JSON.stringify({ dflt: dflt, bySort: bySort, byPos: byPos, club: c.innerHTML });`));
const csH = '>' + run(`return I18n.t('common.csShort')`) + '<', gH = '>' + run(`return I18n.t('common.goalsShort')`) + '<';
check('the history table shows goals by default, clean sheets only when sorted by them or filtered to keepers', tbl.dflt.includes(gH) && !tbl.dflt.includes(csH) && tbl.bySort.includes(csH) && tbl.byPos.includes(csH));
// the Clients tab keeps its OWN sort list (age, contract, ...): the shared table is History and the club page only
const cs = JSON.parse(run(`var a = ClientsScreen.sortPickerRows(), h = ClientHistory.sortPickerRows();
    return JSON.stringify({ own: ClientsScreen.SORTS.every(function (x) { return a.indexOf("ClientsScreen.setSort('" + x[0] + "')") >= 0; }),
        noHist: a.indexOf('ClientHistory') < 0, hist: h.indexOf("ClientHistory.setSort('cs')") >= 0 && h.indexOf('ClientsScreen') < 0 });`));
check('the Clients tab sort picker is its own (no History stats, no jump to History), got ' + JSON.stringify(cs), cs.own && cs.noHist && cs.hist);
check('the club page uses the same table with the position filter and sort picker', tbl.club.includes('hist-table') && tbl.club.includes('ClubScreen.setPos') && tbl.club.includes('ClubScreen.pickSort'));

// the stars follow the terms on the table: what you negotiate, then what the club agreed, else its first offer
const kt = JSON.parse(run(`
    var p = Agency.clients()[0], club = Clubs.allClubs.find(function (c) { return c.id !== p.clubId && Math.abs(c.reputation - p.ability) <= 3; });
    p.facts = p.facts || { ambition: { type: 'goals' }, favClub: {} };
    var m = GameState.addMail({ kind: 'loan', subject: 'l', offer: { playerId: p.id, fromClubId: p.clubId, toClubId: club.id, role: 'rotation' } });
    // the score, not the stars: a client who is already at 5 stars cannot show the rise
    var first = UI.keenFor(m).score, live = UI.keenFor(m, { role: 'starter' }).score;
    m.offer.agreed = { loanRole: 'starter' }; var agreed = UI.keenFor(m).score;
    return JSON.stringify({ first: first, live: live, agreed: agreed });`));
check('the stars follow the negotiation: a starting role negotiated (or agreed) scores higher than the first rotation offer, got ' + JSON.stringify(kt), kt.live > kt.first && kt.agreed === kt.live);
const negSrc = fs.readFileSync(root + 'ui/js/screen-negotiations.js', 'utf8');
check('changing a term in the offer screen refreshes the stars', /Nego\._slide = function \(id, key, val\) \{ this\._slideTerms\(id, key, val\); this\.refreshKeen\(id\); \}/.test(negSrc));

check('no engine errors, got ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
if (failed) process.exit(1);
