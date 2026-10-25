// Prestige (js/agency.js, js/scouts.js, ui/js/screen-agency.js ReputationScreen): capped transfer and
// retirement gains are kept as Prestige (max 5, never back into reputation); the shop: media day, call in
// a favour, insider tip, network bonus, instant report; and where the stored items are used.
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
sb.Router = { register() {}, link: (a, b) => `#${a}/${b}`, refresh() {}, go(h) { sb.location.hash = h; }, sheet() {}, result() {}, closeSheet() {}, isFreshNav: false };
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
for (const f of ['i18n-en.js', 'shim.js', 'prefs.js', 'monetization.js', 'ads.js', 'screen-leagues.js', 'screen-home.js', 'screen-intl.js', 'screen-intl-americas.js', 'screen-intl-caf.js', 'screen-intl-asia.js', 'screen-nation.js', 'screen-clients.js', 'screen-club.js', 'screen-client-detail.js', 'screen-agency.js', 'screen-scout.js'])
    vm.runInContext(fs.readFileSync(root + 'ui/js/' + f, 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(21); Clubs.init(); GameState.startNewGame('England','Pr','A'); GameState.save = function () {}; Monetization.DEV_UNLOCK_ALL = false;
    __pool = GameState.players.filter(function (x) { return !x.agentId && x.clubId && !x.retired; }); __k = 0;
    __client = function (ab) { var p = __pool[__k++]; p.agentId = 'me'; p.everClient = true; p.ability = ab; p.morale = PlayerGen.freshMorale(); return p; };`);

// ---------------- filling ----------------
const fill = JSON.parse(run(`var a = GameState.agency, lim = Agency.repLimit();
    a.reputation = lim - 0.3; a.prestige = 0;
    Agency.bumpRep(1, 'transfer'); var afterTransfer = [a.reputation, a.prestige];
    Agency.bumpRep(0.5); Agency.bumpRep(0.5, 'sponsor'); var others = a.prestige;
    Agency.bumpRep(3, 'retirement'); Agency.bumpRep(3, 'trophy'); var capped = a.prestige;
    a.reputation = lim - 5; a.prestige = 1; Agency.bumpRep(1, 'transfer'); var below = a.prestige;
    return JSON.stringify({ lim: lim, afterTransfer: afterTransfer, others: others, capped: capped, below: below });`));
check('at the limit, the part of a transfer gain the cap blocks becomes Prestige (+1 with 0.3 room: rep at limit, 0.7 prestige)', fill.afterTransfer[0] === fill.lim && Math.abs(fill.afterTransfer[1] - 0.7) < 1e-9, JSON.stringify(fill));
check('only transfers, retirements and trophies fill it (development, sponsors and the rest do not)', Math.abs(fill.others - 0.7) < 1e-9, JSON.stringify(fill));
check('Prestige stops at 5', fill.capped === 5, JSON.stringify(fill));
check('below the limit nothing is blocked, so nothing turns into Prestige', fill.below === 1, JSON.stringify(fill));

// ---------------- shop ----------------
const md = JSON.parse(run(`var a = GameState.agency; a.prestige = 5;
    var cl = [90, 80, 70, 60, 50, 40, 30, 20].map(function (ab) { return __client(ab); });
    var weeks = cl.map(function (p) { return Agency.mediaDayWeeks(p); });
    var rent = Upgrades.office().weekly, bal = a.balance;
    var bad = Agency.holdMediaDay([cl[0].id, cl[1].id]).ok;
    var top = Agency.holdMediaDay([cl[0].id, cl[1].id, cl[2].id]);
    var low = Agency.mediaDayQuote([cl[5].id, cl[6].id, cl[7].id]);
    return JSON.stringify({ weeks: weeks, rent: rent, got: a.balance - bal, top: top, bad: bad, low: low, prestige: a.prestige, morale: cl[0].morale.agent, untouched: cl[3].morale.agent });`));
check('media day: top 25% of your clients bring 2 weeks, top half 1, the rest 0.5', md.weeks.join() === '2,2,1,1,0.5,0.5,0.5,0.5', JSON.stringify(md.weeks));
check('three top clients: capped at 4 weeks of rent, paid as media income; costs 2 prestige; needs exactly three',
    md.top.ok && md.top.weeks === 4 && md.got === md.top.amount && md.top.amount === Math.round(4 * md.rent / 10) * 10 && md.prestige === 3 && md.bad === false, JSON.stringify(md));
check('three bottom-half clients bring 1.5 weeks', md.low.weeks === 1.5, JSON.stringify(md.low));
check('each media-day client thinks 15 less of you; others are untouched', md.morale === 55 && md.untouched === 70, JSON.stringify(md));
check('the media income is booked as its own finance line ("Media day")', run(`return (GameState.agency.ledger['Media day'] || 0) > 0;`));

const fav = JSON.parse(run(`var a = GameState.agency; a.prestige = 1; var c = Clubs.allClubs[5]; var before = Agency.relationship(c.id);
    var r = Agency.callInFavour(c.id); return JSON.stringify({ ok: r.ok, gain: Agency.relationship(c.id) - before, prestige: a.prestige, again: Agency.callInFavour(c.id).ok });`));
check('call in a favour: +10 relationship for 1 prestige (not without prestige)', fav.ok && fav.gain === 10 && fav.prestige === 0 && fav.again === false, JSON.stringify(fav));

const items = JSON.parse(run(`var a = GameState.agency; a.prestige = 5; a.prestigeItems = null;
    var r1 = Agency.buyPrestigeItem('insider').ok, after1 = a.prestige; a.prestige = 5; Agency.buyPrestigeItem('insider'); a.prestige = 5;
    var third = Agency.buyPrestigeItem('insider').ok, block = Agency.prestigeBlock('insider');
    var p = __client(60); var used = Agency.useInsiderTip(p).ok, twice = Agency.useInsiderTip(p).ok;
    return JSON.stringify({ r1: r1, after1: after1, third: third, block: block, used: used, twice: twice, revealed: p.insightAd === true, left: Agency.prestigeItem('insider') });`));
check('insider tip: costs 5, at most 2 held', items.r1 && items.after1 === 0 && !items.third && items.block === 'full', JSON.stringify(items));
check('using one reveals that player for good (once)', items.used && !items.twice && items.revealed && items.left === 1, JSON.stringify(items));

const net = JSON.parse(run(`var a = GameState.agency; a.prestige = 5; a.prestigeItems.network = 0; Agency.buyPrestigeItem('network');
    var p = __client(40); var giant = Clubs.allClubs.filter(function (c) { return c.id !== p.clubId; }).sort(function (x, y) { return y.reputation - x.reputation; })[0];
    a.relationships[giant.id] = 99; var at99 = Agency.canUseNetwork(p, giant.id);
    a.relationships[giant.id] = 100; GameState.inbox = [];
    var r = Agency.useNetworkBonus(p, giant.id); var m = GameState.inbox.find(function (x) { return x.kind === 'transfer' && x.offer && x.offer.playerId === p.id; });
    return JSON.stringify({ at99: at99, ok: r.ok, offerTo: !!(m && m.offer.toClubId === giant.id), role: m && m.offer.role, left: Agency.prestigeItem('network') });`));
check('network bonus: only with a club at 100 relationship', net.at99 === false && net.ok, JSON.stringify(net));
check('...a 40-rated client gets a guaranteed offer from the biggest club, for the role he would honestly get there',
    net.offerTo && net.role && net.role !== 'key' && net.role !== 'starter' && net.left === 0, JSON.stringify(net));

const inst = JSON.parse(run(`var a = GameState.agency; a.prestige = 1; a.prestigeItems.instant = 0; Agency.buyPrestigeItem('instant');
    var s = { id: 'scT', name: 'Test Scout', quality: 70, maxTalentAge: 22, weeklyCost: 0 }; a.scouts.push(s);
    var region = (REGIONS_BY_COUNTRY[GameState.homeCountry] || [])[0]; s.region = region.id; s.league = null; s.weeksUntilFind = 5;
    GameState.inbox = []; var f = Scouts.instantReport(s.id); Sim.deliverScoutFinds([f], []);
    var mail = GameState.inbox.length; var none = Scouts.instantReport(s.id);
    return JSON.stringify({ prestige: a.prestige, f: !!f, mail: mail, weeks: s.weeksUntilFind, left: Agency.prestigeItem('instant'), none: none });`));
check('instant report: 1 prestige; an assigned scout reports now (mail), his own schedule untouched; one use each',
    !inst.noscout && inst.prestige === 0 && inst.f && inst.mail === 1 && inst.weeks === 5 && inst.left === 0 && inst.none === null, JSON.stringify(inst));

// ---------------- kit sale ----------------
const kit = JSON.parse(run(`var a = GameState.agency; a.prestige = 1; Agency.clients().forEach(function (q) { q.agentId = null; });
    var cl = [90, 80, 70, 60, 50, 40, 30, 20].map(function (ab) { return __client(ab); });
    var rent = Upgrades.office().weekly, vals = cl.map(function (p) { return Agency.kitSaleValue(p); });
    var bal = a.balance, before = Agency.interestWeights(cl[0]).boost;
    var r = Agency.holdKitSale(cl[0].id);
    var after = Agency.interestWeights(cl[0]).boost, other = Agency.interestWeights(cl[1]).boost;
    var w0 = GameState.week, y0 = GameState.seasonStartYear; GameState.seasonStartYear += 1; GameState.week = w0 + 1; var expired = Agency.interestWeights(cl[0]).boost; GameState.seasonStartYear = y0; GameState.week = w0;
    return JSON.stringify({ rent: rent, vals: vals, ok: r.ok, got: a.balance - bal, prestige: a.prestige, before: before, after: after, other: other, expired: expired, ledger: a.ledger['Kit sale'] || 0 });`));
const wk = w => Math.round(w * kit.rent / 10) * 10;
check('kit sale: top 25% of your clients bring 3 weeks of rent, top half 2, the rest 0.5 (paid as an amount)', kit.vals.join() === [3, 3, 2, 2, 0.5, 0.5, 0.5, 0.5].map(wk).join(), JSON.stringify(kit.vals));
check('kit sale costs 1 prestige, pays at once and books a "Kit sale" line', kit.ok && kit.prestige === 0 && kit.got === wk(3) && kit.ledger === wk(3), JSON.stringify(kit));
check('...and halves the bids for that player for 52 weeks (others untouched)', kit.after === kit.before * 0.5 && kit.other === kit.before && kit.expired === kit.before, JSON.stringify(kit));

// ---------------- trophies give reputation ----------------
const tro = JSON.parse(run(`return JSON.stringify(['PREM', 'CHAMP', 'FACUP', 'UCL'].map(function (c) { return Agency.trophyRep(c); }));`));
check('trophy reputation: top league title +0.5, lower league +0.25, cup +0.25, European +1', tro.join() === '0.5,0.25,0.25,1', JSON.stringify(tro));
const trophyPrestige = JSON.parse(run(`var a = GameState.agency; a.reputation = Agency.repLimit(); a.prestige = 0;
    var p = Agency.clients()[0]; var y = GameState.seasonStartYear; p.stats[y] = p.stats[y] || {}; p.stats[y].tq = { clubId: p.clubId, youth: false, comps: {} };
    League.awardTrophy(p.clubId, 'UCL', y, []);
    return JSON.stringify({ prestige: a.prestige, rep: a.reputation === Agency.repLimit() });`));
check('a client\'s trophy won at the reputation limit turns into prestige', trophyPrestige.prestige >= 1 && trophyPrestige.rep, JSON.stringify(trophyPrestige));

// the shop never tells the player its payouts come from the office rent
const rentWords = /rent|Miete|alquiler|loyer|affitto|huur|renda/i;
check('media day and kit sale texts show amounts, never office-rent weeks', run(`return ['pr.desc.mediaDay', 'pr.desc.kitSale', 'pr.media.note', 'pr.kit.note', 'pr.media.quote'].map(function (k) { return I18n.t(k); }).join(' | ');`).match(rentWords) === null);

// ---------------- screens ----------------
const ui = JSON.parse(run(`var el = { innerHTML: '' }; GameState.agency.prestige = 2.5;
    AgencyScreen.render(el); var box = /href="#reputation"/.test(el.innerHTML) && /Prestige 2.5/.test(el.innerHTML);
    ReputationScreen.render(el); var h = el.innerHTML;
    var shop = ['mediaDay', 'kitSale', 'favour', 'insider', 'network', 'instant'].every(function (k) { return h.indexOf(I18n.t('pr.shop.' + k)) >= 0; });
    var docked = []; var p = __client(55); p.insightAd = false; GameState.agency.prestigeItems.insider = 1;
    var scr = { innerHTML: '', parentElement: { classList: { add: function () {} } }, appendChild: function (d) { docked.push(d); } };
    document.createElement = function () { return { className: '', innerHTML: '', querySelector: function () { return { onclick: null }; } }; };
    ClientDetail.ctx(p.id).tab = 'potential'; Router.isFreshNav = false; ClientDetail.render(scr, p.id);
    var dock = docked.length ? docked[0].innerHTML : '';
    return JSON.stringify({ box: box, shop: shop, top: h.indexOf(I18n.t('pr.rep.what')) < h.indexOf(I18n.t('pr.what')),
        split: /cta-split/.test(dock) && /data-act="ad"/.test(dock) && /data-act="tip"/.test(dock), raw: /undefined|NaN/.test(h) });`));
check('Agency tab: the reputation box shows Prestige and opens the Reputation screen', ui.box, JSON.stringify(ui));
check('Reputation screen: reputation and how it works on top, then Prestige and a shop with all six entries', ui.shop && ui.top && !ui.raw, JSON.stringify(ui));
check('Potential tab: with an insider tip the ad button shares the dock half and half with "Use insider tip"', ui.split, JSON.stringify(ui));
check('no engine errors, got ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
if (failed) process.exit(1);
