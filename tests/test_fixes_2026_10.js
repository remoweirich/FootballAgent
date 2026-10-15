// The October 2026 playtest batch: hidden ambitions reached before you asked, ambitions never
// pointing at something already done, former clients keeping their whole career at rollover,
// single-match play-off games never ending level, the {regio} sponsor token, and the agency
// records formatting counts as plain numbers (not through the currency converter).
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const noop = () => {};
const sb = { console: { log: noop, warn: noop, error: noop }, Math, Date, JSON, setTimeout: () => 0, clearTimeout: noop,
    setInterval: () => 0, clearInterval: noop, indexedDB: undefined, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: { addEventListener: noop, getElementById: () => null, querySelector: () => null }, addEventListener: noop, removeEventListener: noop,
    UI: { money: String, esc: String, euro: String } };
sb.window = sb; vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb);
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(7); Clubs.init(); GameState.startNewGame('England','Cu','A'); GameState.save = function () {};
    __pool = GameState.players.filter(function (p) { return !p.agentId && p.clubId && !p.retired && p.stats; }); __k = 0;
    __client = function () { var p = __pool[__k++]; p.agentId = 'me'; p.everClient = true; p.knownToAgent = true; return p; };`);

// ---------------- ambitions ----------------
console.log('-- ambitions --');
const amb = JSON.parse(run(`
    var p = __client(); delete p.facts; Dialogue.ensureFacts(p);
    p.facts.ambition = { type: 'title', discovered: false, fulfilled: false };
    var lc = Object.keys(COMPETITIONS).find(function (k) { return COMPETITIONS[k].type === 'league'; });
    p.trophies = (p.trophies || []).concat([{ compId: lc, year: GameState.seasonStartYear, clubId: p.clubId }]);
    GameState.agency.pendingScenes = []; p.bond = 30; var rep = GameState.agency.reputation;
    Dialogue._checkAmbition(p);
    var a = p.facts.ambition, queued = (GameState.agency.pendingScenes || []).length > 0;
    var scene = Dialogue.buildCheckinScene(p);
    var r = Dialogue.resolveCheckin(p, 'q-ambition');
    return JSON.stringify({ type: a.type, fulfilled: a.fulfilled, queued: queued, bond: p.bond, repSame: GameState.agency.reputation === rep,
        askable: scene.choices.some(function (c) { return c.key === 'q-ambition'; }), revealed: p.facts.ambition.discovered });`));
check('a hidden ambition reached before you asked pays nothing (no scene, no bond, no rep) and is replaced by a new one',
    amb.type !== 'title' && !amb.fulfilled && !amb.queued && amb.repSame, JSON.stringify(amb));
check('...asking about his ambition stays available once and reveals the new dream', amb.askable && amb.revealed, JSON.stringify(amb));

const roll = JSON.parse(run(`
    var p = __client(), lgs = Dialogue.LEAGUE_IDS, y = GameState.seasonStartYear - 1;
    // he has played in every big league but one
    p.stats = p.stats || {}; p.stats[y] = { x: { clubId: p.clubId, comps: {} } };
    lgs.slice(1).forEach(function (d) { p.stats[y].x.comps[d] = { apps: 10 }; });
    var divs = {}; for (var i = 0; i < 200; i++) divs[Dialogue._rollDreamLeague(p)] = 1;
    var big = Clubs.allClubs.filter(function (c) { return c.tier === 1 && c.reputation >= 80; });
    var played = big.slice(0, Math.max(0, big.length - 1)).map(function (c) { return c.id; });
    var spy = Dialogue._playedAtClub; Dialogue._playedAtClub = function (pl, id) { return played.indexOf(id) >= 0; };
    var hits = 0; p.ability = 80; for (var j = 0; j < 100; j++) { var id = Dialogue._rollDreamClub(p, null); if (played.indexOf(id) >= 0) hits++; }
    Dialogue._playedAtClub = spy;
    return JSON.stringify({ divs: Object.keys(divs), only: lgs[0], hits: hits });`));
check('a dream league is never one he has already played in', roll.divs.length === 1 && roll.divs[0] === roll.only, JSON.stringify(roll));
check('a dream club is never one he has already played for', roll.hits === 0, JSON.stringify(roll));

// ---------------- former clients keep their history ----------------
console.log('\n-- rollover keeps a former client career --');
const keep = JSON.parse(run(`
    var p = __client(), q = __pool[__k++], y0 = GameState.seasonStartYear;
    p.agentId = null;   // released: still everClient
    [p, q].forEach(function (pl) { pl.stats = pl.stats || {}; for (var y = y0 - 16; y < y0; y++) pl.stats[y] = pl.stats[y0] ? JSON.parse(JSON.stringify(pl.stats[y0])) : {}; });
    var before = Object.keys(p.stats).length;
    try { Sim._rollNewSeason([], []); } catch (e) { return JSON.stringify({ err: String(e) }); }
    return JSON.stringify({ before: before, after: Object.keys(p.stats).length, stranger: Object.keys(q.stats).length });`));
check('a released player keeps all his seasons at rollover; a stranger is still trimmed',
    !keep.err && keep.after >= keep.before && keep.stranger <= 5, JSON.stringify(keep));

// ---------------- play-offs ----------------
console.log('\n-- single-match play-offs --');
const po = JSON.parse(run(`
    var c = Clubs.allClubs.filter(function (x) { return x.country === 'England'; }), level = 0, bad = 0, et = 0, pens = 0;
    for (var i = 0; i < 400; i++) {
        var f = League._poMatch(c[i % 20].id, c[(i + 7) % 20].id, i % 2 === 0);
        if (f.hg === f.ag && !f.pens) level++;
        if (f.winner !== f.h && f.winner !== f.a) bad++;
        if (f.hg !== f.ag && f.winner !== (f.hg > f.ag ? f.h : f.a)) bad++;
        if (f.pens && f.winner !== (f.pens.h > f.pens.a ? f.h : f.a)) bad++;
        if (f.et) et++; if (f.pens) pens++;
    }
    return JSON.stringify({ level: level, bad: bad, et: et, pens: pens });`));
check('a level single play-off game always has penalties, and the winner matches the score / shoot-out', po.level === 0 && po.bad === 0 && po.pens > 0, JSON.stringify(po));
check('only finals go to extra time', po.et > 0);

// ---------------- sponsor token ----------------
const sp = run(`return Upgrades._fill('{regio} à jour', 'Switzerland');`);
check('a sponsor name never shows a raw {regio} / {region} token', !/[{}]/.test(sp), sp);

// ---------------- records formatting ----------------
const src = fs.readFileSync(root + 'ui/js/screen-clients.js', 'utf8');
check('agency records format counts as plain numbers, not through the currency converter', !/const num = v => UI\.money/.test(src));

// ---------------- releasing a personal trainer ----------------
console.log('\n-- trainer release --');
const tr = JSON.parse(run(`
    var a = GameState.agency; Upgrades.hireStaff('trainer'); var lim = Upgrades.repLimit();
    a.reputation = lim + 0.5; Upgrades.releaseStaff('trainer'); var above = a.reputation, lim2 = Upgrades.repLimit();
    Upgrades.hireStaff('trainer'); a.reputation = 5; Upgrades.releaseStaff('trainer');
    return JSON.stringify({ lim: lim, lim2: lim2, above: above, low: a.reputation });`));
check('releasing a trainer drops the rep limit by one and an above-limit reputation by one too (never below the new limit)', tr.lim2 === tr.lim - 1 && tr.above === tr.lim - 0.5, JSON.stringify(tr));
check('...and leaves a reputation already under the cap alone', tr.low === 5, JSON.stringify(tr));

// ---------------- wage budgets and renewals ----------------
console.log('\n-- wage budgets and renewals --');
const wb = JSON.parse(run(`
    var by = function (n) { return Clubs.allClubs.find(function (c) { return c.name === n; }); };
    var mu = by('Manchester Red'), thun = by('Thun');
    var p = GameState.players.find(function (x) { return x.clubId === mu.id; });
    p.agentId = 'me'; p.age = 21; p.ability = 64; p.potential = 86; p.wage = 40000; p.squadRole = 'fringe'; delete p._renewStance;
    var out = { muStance: Agency.renewalStance(p, mu), thunMax: Agency.maxClubWage(p, thun), thunCap: Agency.clubWageCap(thun),
        thunOffer: Agency.offeredWage(p, thun, { jitter: false }), capMu: Agency.clubWageCap(mu) };
    // a star far too good for Thun still can't be paid beyond its budget
    p.ability = 90; p.age = 27; out.starAtThun = Agency.maxClubWage(p, thun);
    // short deals every season: the wage rises only while it is below his worth
    var q = GameState.players.find(function (x) { var c = Clubs.getClubById(x.clubId); return c && c.reputation >= 74 && c.reputation <= 78 && x.squadRole === 'starter' && !x.agentId; });
    q.agentId = 'me'; var cq = Clubs.getClubById(q.clubId), y0 = GameState.seasonStartYear, w = [];
    for (var y = 0; y < 8; y++) { GameState.seasonStartYear = y0 + 1 + y; q.age = 26; if (Agency.renewalStance(q, cq) !== 'release') q.wage = Agency.maxClubWage(q, cq); w.push(q.wage); }
    GameState.seasonStartYear = y0;
    var worth = Agency.offeredWage(q, cq, { loyalty: true, jitter: false });
    // the stance holds for the season: asking again changes nothing
    var same = true, s0 = Agency.renewalStance(q, cq); for (var i = 0; i < 20; i++) if (Agency.renewalStance(q, cq) !== s0) same = false;
    // not every club offers: across many clients, some let it run out and some only hold the wage
    var mix = {}; GameState.players.filter(function (x) { return x.clubId && !x.onLoanAt && (x.squadRole === 'starter' || x.squadRole === 'rotation'); }).slice(0, 1500)
        .forEach(function (x) { delete x._renewStance; var s = Agency.renewalStance(x, Clubs.getClubById(x.clubId)); mix[s] = (mix[s] || 0) + 1; });
    return JSON.stringify(Object.assign(out, { wages: w, worth: worth, same: same, mix: mix }));`));
check('a failed talent at a big club (21, 22 below its level, fringe) is not renewed', wb.muStance === 'release', JSON.stringify(wb));
check('Thun can only pay him its budget, nowhere near his 40k', wb.thunMax <= wb.thunCap && wb.thunOffer <= wb.thunCap && wb.thunCap < 20000, JSON.stringify(wb));
check('a 90-rated star still cannot get more than Thun can afford; an elite club budget is far deeper', wb.starAtThun <= wb.thunCap && wb.capMu > 20 * wb.thunCap, JSON.stringify(wb));
check('renewing on one-season deals every year stops climbing once the wage is past his worth',
    wb.wages[wb.wages.length - 1] === wb.wages[wb.wages.length - 3] && wb.wages[wb.wages.length - 1] <= wb.worth * 1.7, JSON.stringify(wb.wages) + ' worth ' + wb.worth);
check('the club decides once a season', wb.same);
check('some clubs let a contract run out, some only hold the wage, most still want a raise',
    wb.mix.release > 0 && wb.mix.hold > 0 && wb.mix.raise > 0, JSON.stringify(wb.mix));

// ---------------- injury proneness ----------------
console.log('\n-- injury proneness --');
const ip = JSON.parse(run(`
    var h = {}, sum = 0, sq = 0, n = 20000;
    for (var i = 0; i < n; i++) { var v = injuryProneness({}); h[v] = (h[v] || 0) + 1; sum += v; sq += v * v; }
    var m = function (x) { return injuryProneMult({ injProne: x }); };
    return JSON.stringify({ mean: sum / n, sd: Math.sqrt(sq / n - (sum / n) * (sum / n)), min: Math.min.apply(null, Object.keys(h).map(Number)), max: Math.max.apply(null, Object.keys(h).map(Number)),
        m0: m(0), m1: m(1), m5: m(5), m10: m(10), mm5: m(-5), mm10: m(-10), keep: (function () { var p = {}; var a = injuryProneness(p); return injuryProneness(p) === a; })() });`));
check('proneness is a normal roll: mean ~0, SD ~3, within -10..+10', Math.abs(ip.mean) < 0.1 && Math.abs(ip.sd - 3) < 0.15 && ip.min >= -10 && ip.max <= 10, JSON.stringify(ip));
check('risk multiplier 1 + x²/20 when prone (x1 1.05, x5 2.25, x10 6), mirrored when robust (-5 0.44, -10 1/6)',
    ip.m0 === 1 && Math.abs(ip.m1 - 1.05) < 1e-9 && ip.m5 === 2.25 && ip.m10 === 6 && Math.abs(ip.mm5 - 1 / 2.25) < 1e-9 && Math.abs(ip.mm10 - 1 / 6) < 1e-9, JSON.stringify(ip));
check('rolled once and kept', ip.keep);
const cd = fs.readFileSync(root + 'ui/js/screen-client-detail.js', 'utf8');
check('Enhanced Insights shows injury proneness on the Potential tab', cd.indexOf("I18n.t('cd.injuryProne')") > 0);

// ---------------- career chats ----------------
console.log('\n-- career chats --');
const ch = JSON.parse(run(`
    var q = function () { return GameState.agency.pendingScenes || []; }, reset = function () { GameState.agency.pendingScenes = []; };
    var out = { marks: Dialogue.GOAL_MARKS.join() };
    // third long injury: "not again"
    var p = __client(); p.injuryHistory = [{ weeks: 8 }, { weeks: 2 }]; reset(); Dialogue.onInjury(p, 7); out.inj2 = q()[0];
    p.injuryHistory.push({ weeks: 10 }); reset(); Dialogue.onInjury(p, 7); out.inj3 = q()[0];
    var sc = Dialogue.buildMomentScene(out.inj3); out.injText = sc && sc.open && sc.open.id;
    out.injChoices = sc.choices.map(function (c) { return c.key; }).join();
    // international: call-up, first cap, first goal, 50 caps
    var a = __client(); a.intlCalled = false; a.intlStats = null; delete a._imile; a.intlNation = Internationals.nationOfPlayer(a) || 'eng';
    Dialogue._intlMoments(a); reset();
    a.intlCalled = true; Dialogue._intlMoments(a); out.callup = q().map(function (e) { return e.type; }).join();
    reset(); a.intlStats = { 2026: { X: { apps: 1, goals: 0 } } }; Dialogue._intlMoments(a); out.debut = q().map(function (e) { return e.type; }).join();
    reset(); a.intlStats[2026].X.goals = 1; Dialogue._intlMoments(a); out.goal = q().map(function (e) { return e.type; }).join();
    reset(); a.intlStats[2026].X.apps = 50; Dialogue._intlMoments(a); out.fifty = q().map(function (e) { return e.milestone; }).join();
    var s2 = Dialogue.buildMomentScene({ type: 'intlcallup', playerId: a.id, nation: 'Iceland' }); out.callText = s2.open.text;
    // a first trophy shared by three clients: one call, naming the other two
    reset(); var b = __client(), c = __client(), d = __client();
    [b, c, d].forEach(function (x) { x.trophies = []; x.intlTrophies = []; delete x._trmile; });
    Agency.clients().forEach(function (x) { if (x._trmile == null) { x._trmile = { c: (x.trophies || []).filter(function (t) { return !isYouthComp(t.compId); }).length, i: (x.intlTrophies || []).length }; } });
    var lc = Object.keys(COMPETITIONS).find(function (k) { return COMPETITIONS[k].type === 'league' && !isYouthComp(k); });
    [b, c, d].forEach(function (x) { x.trophies.push({ compId: lc, year: 2026, clubId: 'shared' }); });
    d.trophies.unshift({ compId: lc, year: 2020, clubId: 'old' }); d._trmile.c = 1;   // not d's first
    b.bond = 80; c.bond = 20;
    Dialogue._trophyMoments(); out.trophy = q().map(function (e) { return e.type + ':' + e.playerId + ':' + e.others.length; });
    var s3 = Dialogue.buildMomentScene(q()[0]); out.trophyText = s3.open.text; out.b = b.id; out.cName = c.name; out.dName = d.name;
    // an international trophy: every winner's trophy counts, one call
    reset(); [b, c].forEach(function (x) { x.intlTrophies.push({ comp: 'INTL_WC', year: 2026, nation: 'isl' }); });
    Dialogue._trophyMoments(); out.intl = q().map(function (e) { return e.type + ':' + e.others.length; }).join();
    return JSON.stringify(out);`));
check('goal milestones are 100-700 (no 50)', ch.marks === '100,200,300,400,500,600,700', ch.marks);
check('a second long injury is a normal one; the third says "not again" and keeps the visit/flowers choices',
    !ch.inj2.again && ch.inj3.again && /^M0(49|5[0-2])$/.test(ch.injText) && ch.injChoices === 'there,flowers', JSON.stringify([ch.inj2, ch.inj3, ch.injText]));
check('first call-up, first cap, first international goal each get their chat', ch.callup === 'intlcallup' && ch.debut === 'intldebut' && ch.goal === 'intlfirstgoal', JSON.stringify(ch));
check('50 caps is a milestone chat naming the nation', /^50 caps for /.test(ch.fifty) && ch.callText.indexOf('Iceland') >= 0, ch.fifty + ' | ' + ch.callText);
check('a first trophy won by several clients: ONE chat, from the closest client, naming the others',
    ch.trophy.length === 1 && ch.trophy[0] === 'firsttrophy:' + ch.b + ':2' && ch.trophyText.indexOf(ch.cName) >= 0 && ch.trophyText.indexOf(ch.dName) >= 0, JSON.stringify(ch.trophy) + ' | ' + ch.trophyText);
check('an international trophy (not a first) still gets one shared chat', ch.intl === 'intltrophy:1', ch.intl);

// ---------------- national-team reserves come off the bench ----------------
console.log('\n-- reserves and property rent --');
const rs = JSON.parse(run(`
    var C = INTL_CONFIG, n = { reserve: [0, 0], rotation: [0, 0] };
    var p = __client(), q = __client(); p.position = 'CM'; q.position = 'ST'; p.injury = q.injury = null; p.retired = q.retired = false;
    var sq = { list: [{ id: p.id, role: 'reserve' }, { id: q.id, role: 'rotation' }] };
    var play = JSON.stringify(C.CALLUP_PLAY); C.CALLUP_PLAY.reserve = 1; C.CALLUP_PLAY.rotation = 1;   // both play every game, to count starts
    for (var i = 0; i < 4000; i++) {
        p._weekApps = 0; q._weekApps = 0;
        Internationals._clientsPlay('isl', sq, { h: 'isl', a: 'fro', hg: 1, ag: 0, w: 20, c: 'INTL_FRIENDLY' }, 2026, 1, 0);
        [[p, 'reserve'], [q, 'rotation']].forEach(function (x) { if (x[0]._weekApps > 0) { n[x[1]][0]++; if (x[0]._weekApps >= 1) n[x[1]][1]++; } });
    }
    C.CALLUP_PLAY = JSON.parse(play);
    return JSON.stringify({ reserve: n.reserve, rotation: n.rotation });`));
check('a national-team reserve comes off the bench: he starts only in an injury crisis (~0.5% of his games); rotation still starts ~40%',
    rs.reserve[0] === 4000 && rs.reserve[1] <= 50 && rs.rotation[1] > 1400 && rs.rotation[1] < 1800, JSON.stringify(rs));

// ---------------- properties cut the office rent ----------------
const rent = JSON.parse(run(`
    var s = Upgrades.state(), o0 = s.officeIndex, p0 = s.propertyIndex;
    s.officeIndex = OFFICES.length - 1; s.propertyIndex = -1; var full = Upgrades.weeklyOfficeCost();
    var steps = []; for (var i = 0; i < PROPERTIES.length; i++) { s.propertyIndex = i; steps.push(Upgrades.weeklyOfficeCost()); }
    s.officeIndex = o0; s.propertyIndex = p0;
    return JSON.stringify({ full: full, steps: steps, cut: PROPERTIES.map(function (p) { return p.rentCut; }) });`));
check('properties take 2/3/3/4/5/6% off the office rent, adding up to 23% (Iconic III: 195k -> 150.15k)',
    rent.cut.join() === '0.02,0.03,0.03,0.04,0.05,0.06' && rent.full === 195000 && rent.steps[5] === 150150 && rent.steps[0] === 191100, JSON.stringify(rent));

if (failed) process.exit(1);
