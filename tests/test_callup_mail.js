// The international call-up mail (js/intl-callups.js callupGroups + ui/js/screen-negotiations.js
// Nego.callupHTML): grouped by nation (most of your clients first), players GK -> DEF -> MID -> ATT,
// the window's fixtures, a table above 3 clients and lines up to 3, an honest NEW tag, a grouped
// plain-text body and a grouped summary on Home.
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
sb.Router = { register() {}, link: (a, b) => `#${a}/${b}`, refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {}, replace() {}, back() {}, isFreshNav: false };
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
for (const f of ['i18n-en.js', 'shim.js', 'screen-leagues.js', 'screen-intl.js', 'screen-nation.js', 'screen-home.js', 'screen-negotiations.js'])
    vm.runInContext(fs.readFileSync(root + 'ui/js/' + f, 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

const r = JSON.parse(run(`
  Rng.seed(7); Clubs.init(); GameState.startNewGame('England','T','A'); GameState.save = function () {};
  var nats = {}, picked = 0;
  GameState.players.filter(function (p) { return p.clubId && p.agentId !== 'me' && p.ability >= 74 && p.age >= 20 && p.age <= 30; })
    .sort(function (a, b) { return b.ability - a.ability; }).forEach(function (p) {
      if (picked >= 9) return; var n = p.nationality; if ((nats[n] || 0) >= 3) return; nats[n] = (nats[n] || 0) + 1;
      p.agentId = 'me'; p.everClient = true; p.morale = PlayerGen.freshMorale(); picked++; });
  for (var w = 0; w < 12 && !GameState.inbox.some(function (m) { return m.cat === 'callup'; }); w++) Sim.advanceWeek();
  var m = GameState.inbox.find(function (m) { return m.cat === 'callup'; });
  if (!m || !m.callup) return JSON.stringify({ err: 'no call-up mail with data' });
  var G = m.callup.groups, LINE = Internationals.CU_LINE;
  var sizesDesc = G.every(function (g, k) { return !k || G[k - 1].players.length >= g.players.length; });
  var ln = function (pos) { return LINE[pos] != null ? LINE[pos] : 9; };
  var lineOrder = G.every(function (g) { return g.players.every(function (p, k) { return !k || ln(g.players[k - 1].pos) <= ln(p.pos); }); });
  var win = INTL_CONFIG.CALLUP_WINDOWS[m.callup.i].weeks;
  var fx = [].concat.apply([], G.map(function (g) { return g.fixtures; }));
  var inWindow = fx.length > 0 && fx.every(function (f) { return win.indexOf(f.week) >= 0 && f.opp && f.comp && 'HAN'.indexOf(f.venue) >= 0; });
  var bodyGrouped = G.every(function (g) { return m.body.split(Internationals.name(g.nid) + ':').length === 2; });
  var total = G.reduce(function (s, g) { return s + g.players.length; }, 0);
  var el = { innerHTML: '' }; Nego.generic(el, m); var big = el.innerHTML;
  // the same mail cut to 2 clients: lines instead of a table
  var small = JSON.parse(JSON.stringify(m)); small.callup.groups = [G[0]]; small.callup.groups[0].players = G[0].players.slice(0, 2);
  var el2 = { innerHTML: '' }; Nego.generic(el2, small);
  var attn = Home.needsAttention().filter(function (i) { return i.icon === 'ti-flag'; }).map(function (i) { return i.sub; });
  // NEW: a first ever call-up at any age, unless he was already an international when he joined you
  // (estimated at signing: 24+ and good enough for a rotation place or better)
  var nid = G[0].nid, cl = Agency.clients(), aw = GameState.absWeek(), B = Internationals.callupBands(nid);
  var a = cl[0], b = cl[1], c = cl[2], d = cl[3];
  [a, b, c, d].forEach(function (p) { p.intlStats = {}; });
  a.age = 28; a._intlPrior = false;                                                    // signed before he was good enough
  b.age = 28; b.ability = B.starter + 1; delete b._intlPrior; b._signedAbs = aw - 2;  // an established international, just signed
  c.age = 28; c.ability = B.starter + 1; delete c._intlPrior; c._signedAbs = aw - 60; // older save: with you a year, never called
  d.age = 19; d._intlPrior = false; d.intlStats = { 2026: { INTL_NL: { apps: 2 } } };   // already capped
  // signing sets the estimate: an established 28-year-old yes, a 28-year-old not yet good enough no, a 22-year-old star no
  var pool = GameState.players.filter(function (p) { return p.agentId !== 'me' && Internationals.nationOfPlayer(p) === nid; });
  var s1 = pool[0], s2 = pool[1], s3 = pool[2];
  s1.age = 28; s1.ability = B.starter + 2; s2.age = 28; s2.ability = B.reserve - 3; s3.age = 22; s3.ability = B.star + 2;
  [s1, s2, s3].forEach(function (p) { delete p._intlPrior; Agency.signPlayer(p, 10, 10, 2); });
  var signEst = [s1._intlPrior, s2._intlPrior, s3._intlPrior];
  var sq = {}; sq[nid] = { list: [a, b, c, d].map(function (p) { return { id: p.id, role: 'starter' }; }) };
  var ng = Internationals.callupGroups(sq, m.callup.y, m.callup.i, {})[0].players, isNew = {};
  ng.forEach(function (p) { isNew[p.id] = p.isNew; });
  var calledBefore = {}; calledBefore[a.id] = true;
  var ng2 = Internationals.callupGroups(sq, m.callup.y, m.callup.i, calledBefore)[0].players.find(function (p) { return p.id === a.id; });
  return JSON.stringify({ subject: m.subject, total: total, groups: G.length, sizesDesc: sizesDesc, lineOrder: lineOrder, inWindow: inWindow, bodyGrouped: bodyGrouped,
    table: big.indexOf('cu-table') >= 0 && G.every(function (g) { return big.indexOf('#nation/' + g.nid) >= 0; }) && big.indexOf('pos-chip') >= 0,
    lines: el2.innerHTML.indexOf('cu-table') < 0 && el2.innerHTML.indexOf('cu-line') >= 0,
    attn: attn[0] || '', summary: Internationals.callupSummary(G),
    new28: isNew[a.id], newEstablished: isNew[b.id], newOldSave: isNew[c.id], newCapped: isNew[d.id], newCalledBefore: ng2.isNew, signEst: signEst });
`));
if (r.err) { console.log('FAIL  ' + r.err); process.exit(1); }
check('the subject counts clients and nations, got "' + r.subject + '"', r.subject === 'International call-ups: ' + r.total + ' clients for ' + r.groups + ' nations' || /: 1 client for 1 nation$/.test(r.subject));
check('nations with the most of your clients come first', r.sizesDesc);
check('inside a nation: GK, DEF, MID, ATT', r.lineOrder);
check("each nation's fixtures are the ones in that window (week, opponent, competition, venue)", r.inWindow);
check('the plain-text body names each nation once', r.bodyGrouped);
check('more than 3 clients: a table per nation with links to the nation and coloured position tags', r.table);
check('3 or fewer: one line per player, no table', r.lines);
check('Home shows the grouped summary, got "' + r.attn + '"', r.attn && r.attn === r.summary && r.attn.indexOf(' · ') > 0);
check('NEW at any age: a 28-year-old called up for the first time', r.new28 === true, JSON.stringify(r));
check('...but not an established international you just signed', r.newEstablished === false, JSON.stringify(r));
check('...an older-save client with you a year and never called up does get it', r.newOldSave === true, JSON.stringify(r));
check('...never for anyone with caps or called up before', r.newCapped === false && r.newCalledBefore === false, JSON.stringify(r));
check('signing estimates it: established 28-year-old yes, not-yet-good-enough 28-year-old no, 22-year-old star no, got ' + JSON.stringify(r.signEst), JSON.stringify(r.signEst) === '[true,false,false]');
check('no engine errors, got ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
if (failed) process.exit(1);
