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

check('no engine errors, got ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
if (failed) process.exit(1);
