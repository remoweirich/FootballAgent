// The call-ups on the player card and in the agency records (ui/js/screen-client-detail.js,
// screen-clients.js, screen-nation.js): the International cell on Overview, the Club /
// International toggle on History, the international records. Real engine + real screens.
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
for (const f of ['i18n-en.js', 'shim.js', 'screen-leagues.js', 'screen-home.js', 'screen-intl.js', 'screen-intl-americas.js', 'screen-intl-caf.js', 'screen-intl-asia.js', 'screen-nation.js', 'screen-clients.js', 'screen-club.js', 'screen-client-detail.js'])
    vm.runInContext(fs.readFileSync(root + 'ui/js/' + f, 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

const r = JSON.parse(run(`Rng.seed(5); Clubs.init(); GameState.startNewGame('England','Card','A'); GameState.save = function () {};
    var p = GameState.players.find(function (x) { return !x.agentId && x.clubId && !x.retired; });
    p.agentId = 'me'; p.everClient = true; p.nationality = 'Iceland'; p.position = 'ST'; p.ability = 80; p.age = 24; p.injury = null;
    var q = GameState.players.find(function (x) { return !x.agentId && x.clubId && !x.retired && x !== p; });
    q.agentId = 'me'; q.everClient = true; q.nationality = 'Iceland'; q.position = 'CB'; q.ability = 40; q.age = 24; q.injury = null;
    while (GameState.seasonStartYear * 100 + GameState.week < 2026 * 100 + 20) { if (GameState.week >= 52) { GameState.seasonStartYear++; GameState.week = 1; } else GameState.week++; Internationals.sync(); }
    GameState.week = 17; Internationals.sync();
    var el = { innerHTML: '' };
    var r3 = GameState.players.find(function (x) { return !x.agentId && x.clubId && !x.retired && x !== p && x !== q; });
    r3.agentId = 'me'; r3.nationality = 'Iceland'; r3.position = 'LB'; r3.ability = 40; r3.intlCalled = true;   // in a squad once, never played
    var head = function (x) { ClientDetail.render(el, x.id); return el.innerHTML; };
    var hp = head(p), hqq = head(q), hr = head(r3);
    var ov = ClientDetail.tabOverview(p, true);
    ClientDetail.ctx(p.id).histMode = 'intl'; var hiClosed = ClientDetail.tabHistory(p);
    Object.keys(p.intlStats).forEach(function (y) { ClientDetail.ctx(p.id).expanded['i:' + y] = true; }); ClientDetail.ctx(p.id).expanded['i:career'] = true;
    var hi = ClientDetail.tabHistory(p);
    ClientDetail.ctx(p.id).histMode = 'club'; var hc = ClientDetail.tabHistory(p), hq = ClientDetail.tabHistory(q);
    var rec = (typeof ClientRecords !== 'undefined' && ClientRecords.compute) ? ClientRecords.compute([p, q]) : null;
    NationScreen.state.tab = 'overview'; NationScreen.render(el, 'isl'); var nat = el.innerHTML;
    var caps = NationScreen.intlTotal(p);
    return JSON.stringify({ capsLine: hp.indexOf(caps.apps + ' caps') >= 0, noCaps: /No caps/.test(hqq), zero: /0 caps/.test(hr), noRole: !/Not called up|National team/.test(ov + hp) && !/Star Player|Starter|Rotation|Reserve|First Choice|Back Up|Third Keeper/.test(hi + nat),
        intl: /Iceland/.test(hi) && /Nations Series/.test(hi) && /Career total/.test(hi), club: /htog/.test(hc) && !/Nations Series/.test(hc), qDisabled: /disabled/.test(hq),
        nat: nat.indexOf(p.name) >= 0 && /With national squad/.test(nat) && !/Skill level/.test(nat), caps: caps.apps,
        status: /With national squad/.test(ov), collapsed: !/Nations Series/.test(hiClosed) && /season-row/.test(hiClosed) && !/is-open/.test(hiClosed),
        natLink: hp.indexOf('href="#nation/isl"') >= 0, stranger: (function () { var s = GameState.players.find(function (x) { return !x.agentId && !x.everClient && x.nationality === 'Germany'; }); return s ? !/caps|No caps/.test(head(s)) : true; })(),
        off: (function () { GameState.week = 20; var o = ClientDetail.tabOverview(p, true); NationScreen.render(el, 'isl'); var n2 = el.innerHTML; GameState.week = 17; return !/With national squad/.test(o + n2); })(), raw: [ov, hi, nat].some(function (h) { return /undefined|NaN/.test(h); }),
        rec: rec ? rec.filter(Boolean).map(function (x) { return x.label; }).filter(function (l) { return /international/i.test(l); }) : 'n/a' });`));
check('next to the age: "N caps" (counted to this week), "No caps" before a first call-up, "0 caps" for a squad member who never played', r.capsLine && r.noCaps && r.zero, JSON.stringify(r));
check('the national squad role is never shown: not on the card, its international history, or the nation page (no skill level either); the club role stays', r.noRole);
check('History: International shows the caps by season and competition plus the career total; Club stays the club history', r.intl && r.club && r.caps > 0, JSON.stringify(r));
check('the International toggle is disabled for a client with no caps', r.qDisabled);
check("the nation's page lists the client; during a break he is 'With national squad' (also the card's status), in between nothing", r.nat && r.status && r.off, JSON.stringify([r.nat, r.status, r.off]));
check('caps are only shown for clients (nobody else\'s are counted)', r.stranger);
check('the international history: rows closed by default, opening like the club history', r.collapsed && r.intl, JSON.stringify([r.collapsed, r.intl]));
check("the player card's nationality links to the nation page", r.natLink);
// a match a client played in: marked on the nation page, and it opens his stats in that game
const m = JSON.parse(run(`var p = GameState.players.find(function (x) { return x.agentId === 'me' && x.intlStats && x.ability === 80; });
    var res = Internationals.nationResults('isl'), r = res.find(function (x) { return x.clients && x.clients.length; });
    var sheet = ''; Router.sheet = function (h) { sheet = h; };
    if (r) NationScreen.openMatch('isl', r.L, r.opp);
    var el = { innerHTML: '' }; NationScreen.state.tab = 'matches'; NationScreen.render(el, 'isl');
    var kf = Internationals.knownFixtures(), any = kf.length ? kf[0].h : 'isl', el2 = { innerHTML: '' }; NationScreen.render(el2, any); NationScreen.state.tab = 'overview';
    return JSON.stringify({ found: !!r, sheet: sheet.indexOf(p.name) >= 0 && /Your clients in this match/.test(sheet), marked: /ti-shirt/.test(el.innerHTML) && /openMatch/.test(el.innerHTML),
        upcoming: kf.length > 0 && /Coming up/.test(el2.innerHTML) });`));
check("the nation's match list marks a client's games; tapping one shows what he did", m.found && m.sheet && m.marked, JSON.stringify(m));
check("the nation's match list starts with the fixtures already set", m.upcoming, JSON.stringify(m));
// trophies link to their competition; the call-up shows in Needs attention
const t = JSON.parse(run(`var p = GameState.players.find(function (x) { return x.agentId === 'me' && x.intlStats; });
    p.trophies = [{ compId: 'PREM', year: 2026, clubId: p.clubId }]; p.intlTrophies = [{ comp: 'INTL_EURO', year: 2028, nation: 'isl', season: 2027 }];
    var hon = ClientDetail.honoursLine(p); ClientDetail.ctx(p.id).histMode = 'intl'; var ih = ClientDetail.tabHistory(p);
    var el = { innerHTML: '' }; NationScreen.render(el, 'bra'); var nat = el.innerHTML;
    LeaguesScreen.state = LeaguesScreen.state || {}; IntlScreen.openComp('INTL_COPA');
    var mail = { id: 'm1', kind: 'news', cat: 'callup', read: false, subject: 'International call-ups: 2 of your clients', body: '' }; GameState.inbox.unshift(mail);
    var att = Home.needsAttention(); GameState.inbox.shift();
    return JSON.stringify({ club: hon.indexOf('href="#comphist/PREM"') >= 0, intl: ih.indexOf("IntlScreen.openComp('INTL_EURO')") >= 0, nat: nat.indexOf("IntlScreen.openComp('INTL_WC')") >= 0,
        open: [LeaguesScreen.state.country, IntlScreen.state.conf].join(), attn: att.some(function (a) { return a.title === 'International call-ups'; }) });`));
check('trophies link to their competition (club: history page; international: Competitions > International)', t.club && t.intl && t.nat && t.open === 'International,CONMEBOL', JSON.stringify(t));
check('an unread call-up mail is under Needs attention', t.attn);
check('no undefined / NaN anywhere', !r.raw);
if (r.rec !== 'n/a') check('agency records: most caps / international goals', r.rec.length >= 1, JSON.stringify(r.rec));
const rec2 = JSON.parse(run(`var p = GameState.players.find(function (x) { return x.agentId === 'me' && x.intlStats; });
    p.intlStats[2029] = { INTL_WC: { apps: 7, goals: 6, assists: 1, cs: 0, yellow: 0, red: 0, ratingSum: 50 } };
    var g = GameState.players.find(function (x) { return !x.agentId && x.clubId && !x.retired; }); g.agentId = 'me'; g.position = 'GK'; g.intlStats = { 2027: { INTL_NL: { apps: 4, goals: 0, assists: 0, cs: 3, yellow: 0, red: 0, ratingSum: 28 } } };
    p.intlTrophies = [{ comp: 'INTL_EURO', year: 2028, nation: 'isl' }];
    var R = ClientRecords.compute([p, g]).filter(Boolean), f = function (re) { return R.find(function (x) { return re.test(x.label); }); };
    var wc = f(/one World Nations Cup/), tr = f(/international trophies/), cs = f(/clean sheets for country/);
    return JSON.stringify({ wc: wc && wc.value, wcSub: wc && wc.sub, tr: tr && tr.value, cs: cs && cs.value });`));
check('records: most goals at one World Nations Cup (6, 2030), most international trophies (1), most clean sheets for country (3)', rec2.wc === '6' && /2030/.test(rec2.wcSub) && rec2.tr === '1' && rec2.cs === '3', JSON.stringify(rec2));
check('no errors logged', errors.length === 0, errors.slice(0, 2).join(' | '));

console.log(failed ? '\n*** FAIL ***' : '\nAll player card checks passed.');
process.exit(failed ? 1 : 0);
