// Playtest batch 2026-11-14: no Youth role past 21, frozen-out clients get listed, a spell with his
// own B team / U21s doesn't block a transfer, international XIs keep a real formation, stars always
// start knockout games, a tournament host plays at home, rating gaps count for more between nations,
// and a 1000-game career total gets wider columns.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, addEventListener() {},
    UI: { money: n => String(n), eabbr: n => String(n), cur: () => '€', abbr: n => String(n), esc: s => s, clubName: id => id } };
sb.window = sb;
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(3); Clubs.init(); GameState.startNewGame('Germany', 'T', 'A'); GameState.save = function () {};
  globalThis.TOP = Clubs.allClubs.find(function (c) { return c.country === 'England' && c.tier === 1 && c.reputation >= 85; });
  globalThis.mk = function (age, ab, pos) { var p = PlayerGen.makePlayer(TOP, { ability: ab, age: age, position: pos || 'ST' }); p.agentId = 'me'; p.everClient = true; p.morale = PlayerGen.freshMorale(); GameState.players.push(p); return p; };`);

// ---- 5. Youth role only up to 21 ----
check('a weak 35-year-old is offered Fringe, never Youth; a weak 19-year-old can still be Youth', run(`
  var old = mk(35, 60), kid = mk(19, 60);
  return Agency.maxRoleAt(old, TOP) === 'fringe' && Agency.maxRoleAt(kid, TOP) === 'youth' && Agency.roleForAge('youth', 22) === 'fringe';`));

// ---- 3. frozen out -> transfer-listed ----
check('a First Choice left out for weeks is frozen out, and the club lists him itself', run(`
  var p = mk(28, 88, 'GK'); p.clubId = TOP.id; p.squadRole = 'starter'; p._badStreak = { time: MORALE.CASE_OPEN_BAD_STREAK };
  var fo = Agency.frozenOut(p); Agency.listFrozenOut(p, []);
  var rot = mk(28, 80); rot.squadRole = 'rotation'; rot._badStreak = { time: 9 };
  var inj = mk(28, 88); inj.squadRole = 'key'; inj._badStreak = { time: 9 }; inj.injury = { weeksOut: 3 };
  return fo && p.transferListed === true && !Agency.frozenOut(rot) && !Agency.frozenOut(inj)
    && GameState.inbox.some(function (m) { return m.playerId === p.id && /transfer-list/.test(m.subject); });`));
check('...and a listing request for a frozen-out Star Player is always granted', run(`
  var ok = 0;
  for (var i = 0; i < 20; i++) { var p = mk(28, 92); p.clubId = TOP.id; p.squadRole = 'key'; p._badStreak = { time: 6 }; if (Agency.requestTransferListing(p).ok) ok++; }
  return ok === 20;`));

// ---- 9. own B team / U21s is no loan ----
check('with his own B team or U21s he can still be shopped and sold; on a real loan he cannot', run(`
  var res = Clubs.allClubs.find(function (c) { return isReserveClub(c); }), other = Clubs.allClubs.find(function (c) { return !isReserveClub(c) && c.id !== TOP.id; });
  var b = mk(17, 70); b.clubId = TOP.id; b.onLoanAt = res.id;
  var u = mk(17, 70); u.clubId = TOP.id; u.onLoanAt = 'u21_' + TOP.id;
  var l = mk(17, 70); l.clubId = TOP.id; l.onLoanAt = other.id;
  var target = Clubs.allClubs.find(function (c) { return c.id !== TOP.id && !isReserveClub(c) && c.tier === 1; });
  var shopB = Agency.shopPlayer(b, target.id), shopL = Agency.shopPlayer(l, target.id);
  return !awayOnLoan(b) && !awayOnLoan(u) && awayOnLoan(l) && shopB.ok !== false && shopL.ok === false;`));

// ---- 10. an international XI is a real formation ----
check('13 client call-ups: the starters fit the XI limits (2 ST, 3 attackers, room for 3 defenders), at most 5 subs', run(`
  var poss = ['GK', 'RB', 'ST', 'ST', 'LW', 'CDM', 'CM', 'CB', 'CM', 'RB', 'RW', 'ST', 'CDM'];
  var bad = 0;
  for (var t = 0; t < 200; t++) {
    var appear = poss.map(function (ps, i) { return { p: { position: ps, ability: 80 - i }, role: i % 3 ? 'starter' : 'star', full: true }; });
    appear.push({ p: { position: 'CM', ability: 60 }, role: 'rotation', full: false }, { p: { position: 'CB', ability: 60 }, role: 'rotation', full: false },
      { p: { position: 'LB', ability: 60 }, role: 'reserve', full: false });
    Internationals._fitXI(appear);
    var st = appear.filter(function (a) { return a.full && a.p.position !== 'GK'; }), c = {}, ln = { D: 0, M: 0, A: 0 };
    st.forEach(function (a) { c[a.p.position] = (c[a.p.position] || 0) + 1; ln[Internationals.XI_LINE[a.p.position]]++; });
    var room = 10 - st.length >= Math.max(0, 3 - ln.D) + Math.max(0, 2 - ln.M) + Math.max(0, 1 - ln.A);
    if ((c.ST || 0) > 2 || ln.A > 3 || ln.M > 4 || ln.D > 5 || st.length > 10 || !room || appear.filter(function (a) { return !a.full; }).length > 5) bad++;
  }
  return bad === 0;`));

// ---- 8. knockout: stars always start ----
check('in a knockout tie a star always starts, keeper included', run(`
  var g = mk(27, 90, 'GK'), s = mk(27, 90, 'ST'), miss = 0;
  var sq = { list: [{ id: g.id, role: 'star' }, { id: s.id, role: 'star' }] };
  for (var i = 0; i < 100; i++) {
    g.intlStats = {}; s.intlStats = {};
    Internationals._clientsPlay('ger', sq, { h: 'ger', a: 'fra', hg: 1, ag: 0, w: 51, c: 'INTL_EURO', st: 'final' }, GameState.seasonStartYear, 1, 0);
    var a = function (p) { var n = 0; Object.values(p.intlStats).forEach(function (y) { Object.values(y).forEach(function (c) { n += c.apps; }); }); return n; };
    if (a(g) !== 1 || a(s) !== 1) miss++;
  }
  return miss === 0;`));

// ---- 6. a host plays at home ----
check('a tournament host is at home (not neutral) in its own tournament; everyone else neutral', run(`
  var I = Internationals;
  var hostH = I._play('ger', 'fra', { week: 49, neutral: true, bH: 2, comp: 'INTL_EURO', stage: 'group' });
  var hostA = I._play('fra', 'ger', { week: 49, neutral: true, bA: 2, comp: 'INTL_EURO', stage: 'group' });
  var none = I._play('ita', 'esp', { week: 49, neutral: true, comp: 'INTL_EURO', stage: 'group' });
  return hostH.hv === 'h' && hostA.hv === 'a' && !none.hv && I.venueOf(0, true) === 'H' && I.venueOf(2, false) === 'H' && I.venueOf(2, true) === 'A' && I.venueOf(1, true) === 'N';`));

// ---- 7. rating gaps count for more between nations ----
check('a top nation (86) beats a 68-rated one at a neutral venue at least 85% of the time', run(`
  var I = Internationals, w = 0, n = 3000, saved = I.onInternationalMatch; I.onInternationalMatch = function () {};
  var rep = I.rep; I.rep = function (id) { return id === 'fra' ? 86 : 68; };
  for (var i = 0; i < n; i++) { var f = I._play('fra', 'uzb', { neutral: true, ko: true }); if (I.winnerOf(f) === 'fra') w++; }
  I.rep = rep; I.onInternationalMatch = saved;
  return w / n >= 0.85;`));

// ---- 4. outgrown his contract: talks always open, a raise and the bigger role ----
check('a prospect who grew +10 since his contract always gets renewal talks, with a bigger role and a raise', run(`
  var ok = 0, roleUp = 0, raise = 0, n = 30;
  for (var i = 0; i < n; i++) {
    var p = mk(17, 85, 'CDM'); p.clubId = TOP.id; p.squadRole = 'fringe'; p.wage = 6000; p._contractAbility = 72;
    p.contractUntilSeason = GameState.seasonStartYear + 5;   // plenty of contract left: normally a refusal
    p._renewStance = { y: GameState.seasonStartYear, c: TOP.id, s: 'release' };   // even a "let him go" season
    var r = Agency.requestRenewalTalks(p);
    var m = GameState.inbox.find(function (x) { return x.kind === 'renewal' && x.offer.playerId === p.id; });
    if (r.ok && m) { ok++; if (ROLE_ORDER.indexOf(m.offer.proposedRole) > ROLE_ORDER.indexOf('fringe')) roleUp++; if (m.offer.proposedWage > p.wage) raise++; }
  }
  return ok === n && roleUp === n && raise === n;`));
check('...but one who has not grown, in the role he merits, gets the usual refusals sometimes', run(`
  var refused = 0;
  for (var i = 0; i < 40; i++) {
    var p = mk(24, 80, 'CM'); p.clubId = TOP.id; p.squadRole = Agency.maxRoleAt(p, TOP); p._contractAbility = 79;
    p.contractUntilSeason = GameState.seasonStartYear + 5;
    if (!Agency.outgrownContract(p, TOP) && !Agency.requestRenewalTalks(p).ok) refused++;
  }
  return refused > 10;`));
check('an older save without the stored rating reads it from his history at the last wage point', run(`
  var p = mk(19, 84, 'ST'); p.clubId = TOP.id; delete p._contractAbility;
  p.history = { ability: [{ t: 10, value: 70 }, { t: 50, value: 74 }, { t: 90, value: 84 }], wage: [{ t: 60, value: 3000 }] };
  return Agency.contractAbility(p) === 74 && Agency.outgrownContract(p, TOP);`));

// ---- renewal refusals follow form over the last ~25 games ----
check('form steers renewal refusals: in form never "not planning", rarely let go; abysmal much likelier', run(`
  var rf = Agency.recentForm, A = Agency, res = {};
  function rate(avg, apps, role, ab) {
    A.recentForm = function () { return { avg: avg, apps: apps }; };
    var noPlans = 0, release = 0, n = 2000;
    for (var i = 0; i < n; i++) {
      var p = { id: 'x' + i, squadRole: role, ability: ab, age: 25, position: 'CM', wage: 1, clubId: TOP.id, history: {} };
      if (Rng.next() < (A.RENEW_NOPLANS[role] || 0) * A.renewFormMult(p).noPlans) noPlans++;
      if (A.renewalStance(p, TOP) === 'release') release++;
    }
    return { noPlans: noPlans / n, release: release / n };
  }
  var inForm = rate(7.3, 25, 'fringe', TOP.reputation - 9), base = rate(6.8, 3, 'fringe', TOP.reputation - 9), bad = rate(5.7, 25, 'fringe', TOP.reputation - 9), star = rate(6.8, 3, 'key', 99);
  A.recentForm = rf;
  return inForm.noPlans === 0 && inForm.release < 0.16 && Math.abs(base.release - 0.45) < 0.05 && Math.abs(base.noPlans - 0.5) < 0.05
    && bad.release > 0.7 && bad.noPlans > 0.7 && star.release < 0.03 && A.RENEW_RELEASE.key === 0.01 && A.RENEW_RELEASE.starter === 0.05;`));
check('the form window tops this season up with last season to ~25 games', run(`
  var y = GameState.seasonStartYear, st = seasonTotals;
  globalThis.seasonTotals = function (p, yy) { return yy === y ? { apps: 10, ratingSum: 75, avg: 7.5 } : { apps: 30, ratingSum: 180, avg: 6 }; };
  var f = Agency.recentForm({});
  globalThis.seasonTotals = st;
  return f.apps === 25 && Math.abs(f.avg - (75 + 6 * 15) / 25) < 1e-9;`));

// ---- loyalty: paid above the club's wage budget; loyal veterans in the XI are never cut ----
check('a player who outgrew his club still earns loyalty above its wage budget', run(`
  var club = Clubs.allClubs.filter(function (c) { return c.country === 'England' && c.reputation >= 70 && c.reputation <= 74; })[0];
  var p = mk(29, 84, 'CM'); p.clubId = club.id; p.squadRole = 'key'; p.stats = {};
  for (var k = 0; k < 8; k++) statBucket(p, GameState.seasonStartYear - k, club.id, false, false, 'X').apps = 30;
  var cap = Agency.clubWageCap(club), worth = Agency.offeredWage(p, club, { loyalty: true, jitter: false, full: true });
  return Agency.loyaltyMult(p) >= 1.39 && worth > cap * 1.3 && worth <= Agency.loyalWageCap(p, club);`));
check('a loyal veteran (8+ seasons, in the XI) paid far over his worth is held, not cut', run(`
  var p = mk(33, 76, 'CB'); p.clubId = TOP.id; p.squadRole = 'starter'; p.stats = {};
  for (var k = 0; k < 9; k++) statBucket(p, GameState.seasonStartYear - k, TOP.id, false, false, 'X').apps = 30;
  p.wage = Agency.offeredWage(p, TOP, { loyalty: true, jitter: false, full: true }) * 2; delete p._renewStance;
  var vet = Agency.renewalStance(p, TOP), w = Agency.renewalWage(p, TOP);
  var q = mk(33, 76, 'CB'); q.clubId = TOP.id; q.squadRole = 'starter'; q.stats = {}; statBucket(q, GameState.seasonStartYear, TOP.id, false, false, 'X').apps = 30;
  q.wage = p.wage; var fresh = Agency.renewalStance(q, TOP);
  return vet === 'hold' && w === p.wage && fresh === 'cut';`));

// ---- club page: seasons that ended in promotion (green) / relegation (red) ----
check('club history: a season is up / down against the next league season (or the current division), cups and stays plain', (() => {
  sb.Router = { register() {}, link: (a, b) => '#' + a + '/' + b };
  vm.runInContext(fs.readFileSync(root + 'ui/js/screen-club.js', 'utf8'), sb, { filename: 'screen-club.js' });
  return run(`
    var c = Clubs.allClubs.find(function (x) { return x.division === '2BUNDES'; }), y = 2031;
    var hist = [{ year: y, division: '2BUNDES', position: 5 }, { year: y + 1, division: '2BUNDES', position: 1 }, { year: y + 1, division: 'DFB', position: 1 },
      { year: y + 2, division: 'BUNDES', position: 18 }, { year: y + 3, division: '2BUNDES', position: 3 }, { year: y + 4, division: '2BUNDES', position: 3 }];
    c.division = 'BUNDES';   // promoted at the end of the newest season
    var m = ClubScreen.seasonMoves(c.id, hist), at = function (i) { return m.get(hist[i]) || ''; };
    return at(0) === '' && at(1) === 'up' && at(2) === '' && at(3) === 'down' && at(4) === '' && at(5) === 'up';`);
})());

// ---- 2. 1000+ games: wider total row ----
const css = fs.readFileSync(root + 'ui/app.css', 'utf8'), cd = fs.readFileSync(root + 'ui/js/screen-client-detail.js', 'utf8');
check('a 1000-game career total gets the wide number columns', /\.ht-row\.ht-row--wide\s*\{[^}]*36px/.test(css) && /ct\.apps >= 1000 \? ' ht-row--wide'/.test(cd));

if (failed) process.exit(1);
console.log('All 2026-11-14 batch checks passed.');
