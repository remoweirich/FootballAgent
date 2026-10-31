// Playtest batch 2026-10-30: the dressing-room answer matches his club morale; a fresh league fixture
// list every season; goalkeepers follow the depth chart (the Cup Goalkeeper plays the cups, a keeper is
// never an outfield player); a red card in an international costs his nation's next match.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const errors = [];
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.map(String).join(' ')) }, setTimeout: () => 0, clearTimeout() {}, Math, Date, JSON,
    indexedDB: undefined, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => null, querySelector: () => null, documentElement: { style: {}, setAttribute() {} } },
    addEventListener() {}, matchMedia: () => ({ matches: false }), location: { hash: '' }, UI: { money: String, esc: String, euro: String },
};
sb.window = sb;
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb);
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(5); Clubs.init(); GameState.startNewGame('Netherlands', 'T', 'A'); GameState.save = function () {};`);

// ---- 4. the dressing room ----
const room = JSON.parse(run(`
    var lines = DIALOGUE_DATA.checkin.filter(function (r) { return r.beat === 'reply' && r.choice === 'q-room'; });
    var unclassified = lines.filter(function (r) { return !Dialogue.ROOM_MORALE[r.id]; }).map(function (r) { return r.id; });
    var p = GameState.players.find(function (x) { return x.clubId; }); p.agentId = 'me'; Dialogue.ensureFacts(p);
    var said = function (club, trait) {
        p.morale = PlayerGen.freshMorale(); p.morale.club = club;
        if (trait) { p.personality = p.personality || {}; p.personality.primary = trait; p.personality.secondary = trait; }
        var out = {}; for (var i = 0; i < 300; i++) { p._checkinAbs = null; var r = Dialogue.resolveCheckin(p, 'q-room'); out[r.reply.id] = 1; }
        return Object.keys(out);
    };
    return JSON.stringify({ unclassified: unclassified, loyal57: said(57, 'loyal'), loyal85: said(85, 'loyal'), happy90: said(90), unhappy20: said(20) });`));
check('every dressing-room line has a club-morale range (a new workbook line cannot slip in unclassified)', room.unclassified.length === 0, JSON.stringify(room.unclassified));
check('at club morale 57 a loyal player never says "I see no reason to ever leave"', !room.loyal57.includes('K032') && !room.loyal57.includes('K033'), JSON.stringify(room.loyal57));
check('...at 85 he can', room.loyal85.includes('K033') || room.loyal85.includes('K032'), JSON.stringify(room.loyal85));
check('a very happy player never complains of snakes or mercenaries; an unhappy one never calls it the best group ever',
    !room.happy90.some(id => ['K034', 'K035', 'K030'].includes(id)) && !room.unhappy20.some(id => ['K028', 'K031', 'K032', 'K033', 'K036', 'K037'].includes(id)), JSON.stringify(room));

// ---- 5. fixtures differ from season to season ----
const fx = JSON.parse(run(`
    var div = 'ERE', a, b;
    League.setupSeason(); a = JSON.stringify(GameState.league.schedule[div]); var lastA = JSON.stringify(GameState.league.schedule[div].slice(-1));
    League.setupSeason(); b = JSON.stringify(GameState.league.schedule[div]); var lastB = JSON.stringify(GameState.league.schedule[div].slice(-1));
    var s = GameState.league.schedule[div], pairs = {}; s.forEach(function (rd) { rd.forEach(function (m) { var k = m.slice().sort().join('|'); pairs[k] = (pairs[k] || 0) + 1; }); });
    var n = Clubs.getClubsByDivision(div).length;
    return JSON.stringify({ same: a === b, lastSame: lastA === lastB, everyPairTwice: Object.keys(pairs).length === n * (n - 1) / 2 && Object.values(pairs).every(function (v) { return v === 2; }) });`));
check('the league fixture list (and its last matchday) is different every season', !fx.same && !fx.lastSame, JSON.stringify(fx));
check('...and still a proper double round robin (every pair meets twice)', fx.everyPairTwice);

// ---- 6. goalkeepers ----
const gk = JSON.parse(run(`
    var club = Clubs.allClubs.find(function (c) { return c.division === 'ERE'; });
    var cupId = Object.keys(COMPETITIONS).find(function (k) { return COMPETITIONS[k].type === 'cup'; });
    GameState.players.filter(function (p) { return p.clubId === club.id && p.position === 'GK'; }).forEach(function (p) { p.squadRole = 'fringe'; p.cupKeeper = false; p.ability = 40; });
    var no1 = PlayerGen.makePlayer(club, { ability: 62, age: 28, position: 'GK' }); no1.squadRole = 'starter'; no1.clubId = club.id; no1.agentId = 'me';
    var ck = PlayerGen.makePlayer(club, { ability: 70, age: 26, position: 'GK' }); ck.squadRole = 'rotation'; ck.cupKeeper = true; ck.clubId = club.id; ck.agentId = 'me';
    GameState.players.push(no1, ck);
    var tally = { leagueNo1: 0, leagueCk: 0, cupNo1: 0, cupCk: 0, twoKeepers: 0, gkOutfield: 0, n: 60 };
    for (var i = 0; i < tally.n; i++) {
        [club.division, cupId].forEach(function (comp) {
            no1.injury = null; ck.injury = null; no1._suspended = 0; ck._suspended = 0;
            var app = League.assignStats(club.id, comp, 1, 1, false) || [];
            var keepers = app.filter(function (a) { return a.p.position === 'GK'; });
            if (keepers.length > 1) tally.twoKeepers++;
            var has = function (p) { return keepers.some(function (a) { return a.p === p; }); };
            if (comp === cupId) { if (has(no1)) tally.cupNo1++; if (has(ck)) tally.cupCk++; } else { if (has(no1)) tally.leagueNo1++; if (has(ck)) tally.leagueCk++; }
        });
    }
    return JSON.stringify(tally);`));
check('a goalkeeper is never fielded as an outfield player (one keeper per match), got ' + JSON.stringify(gk), gk.twoKeepers === 0);
check('the Cup Goalkeeper plays the cup games, the No.1 the league ones, even when the cup keeper is rated higher',
    gk.cupCk >= gk.n * 0.9 && gk.cupNo1 <= gk.n * 0.1 && gk.leagueNo1 >= gk.n * 0.8 && gk.leagueCk <= gk.n * 0.2, JSON.stringify(gk));

// ---- 7. a red card in an international ----
const intl = JSON.parse(run(`
    var p = GameState.players.find(function (x) { return x.position === 'CB' && x.clubId; }); p.agentId = 'me'; p.intlStats = {};
    var nid = 'sui', season = GameState.seasonStartYear, sq = { list: [{ id: p.id, role: 'star' }] }, fx = { c: 'INTL_FRIENDLY', w: 11, h: nid, a: 'ger' };
    var apps = function () { var t = 0; Object.values(p.intlStats).forEach(function (s) { Object.values(s).forEach(function (c) { t += c.apps; }); }); return t; };
    var reds = function () { var t = 0; Object.values(p.intlStats).forEach(function (s) { Object.values(s).forEach(function (c) { t += c.red; }); }); return t; };
    var res = { reds: 0, playedAfterRed: 0, servedBans: 0 };
    for (var i = 0; i < 4000; i++) {
        var r0 = reds();
        Internationals._clientsPlay(nid, sq, fx, season, 1, 0);
        if (reds() > r0) {   // sent off: the next match he sits out
            res.reds++;
            var a0 = apps();
            Internationals._clientsPlay(nid, sq, fx, season, 1, 0);
            if (apps() > a0) res.playedAfterRed++; else res.servedBans++;
        }
    }
    return JSON.stringify(res);`));
check('a red card in an international: he misses the next match of his nation, got ' + JSON.stringify(intl), intl.reds > 0 && intl.playedAfterRed === 0 && intl.servedBans === intl.reds);

// ---- 3. transfer listing ----
const tl = JSON.parse(run(`
    var p = GameState.players.find(function (x) { var c = Clubs.getClubById(x.clubId); return c && x.ability >= 60 && x.position !== 'GK'; });
    p.agentId = 'me'; p.moraleCase = null; var c = Clubs.getClubById(p.clubId), y = GameState.seasonStartYear;
    var buyer = Clubs.allClubs.find(function (b) { return b.id !== c.id && Math.abs(b.reputation - p.ability) < 5; });
    var form = function (avg) { var comps = {}; comps[c.division] = { apps: 15, goals: 1, assists: 1, cs: 0, yellow: 0, red: 0, ratingSum: avg * 15 }; p.stats = {}; p.stats[y] = { s: { clubId: c.id, loan: false, youth: false, order: 0, comps: comps } }; };
    var out = {};
    [['inForm', 7.2], ['steady', 6.8], ['poor', 6.3], ['abysmal', 5.8], ['edge7', 7.0], ['edge65', 6.5], ['edge6', 6.0]].forEach(function (sc) {
        form(sc[1]); Agency.setTransferListed(p, false); var full = Agency.estimateFee(p, buyer);
        Agency.setTransferListed(p, true); var listed = Agency.estimateFee(p, buyer);
        out[sc[0]] = { band: Agency.listBand(p).key, ratio: Math.round(listed / full * 100) / 100 };
    });
    // the listing ends after two windows without a sale
    form(6.8); Agency.setTransferListed(p, false); GameState.week = 1; Agency.setTransferListed(p, true);
    GameState.week = 7; Sim._listingExpiry([]); var after1 = p.transferListed;
    GameState.week = 34; Sim._listingExpiry([]); var after2 = p.transferListed;
    // ...or the moment he signs a new contract
    Agency.setTransferListed(p, true);
    var ren = GameState.addMail({ kind: 'renewal', subject: 'r', offer: { playerId: p.id, clubId: p.clubId } });
    p._renewSeason = null; p.pendingTransfer = null;
    var rr = Agency.acceptRenewal(ren, p.wage, null, 1, {});
    out.expiry = { after1: after1, after2: after2, renewal: p.transferListed, renewOk: rr.ok, renewMsg: rr.message };
    return JSON.stringify(out);`));
check('form bands: 7.0+ in form, 6.51-6.99 steady, 6.01-6.5 poor, 6.0 or lower abysmal', tl.inForm.band === 'inForm' && tl.edge7.band === 'inForm' && tl.steady.band === 'steady' && tl.edge65.band === 'poor' && tl.poor.band === 'poor' && tl.edge6.band === 'abysmal' && tl.abysmal.band === 'abysmal', JSON.stringify(tl));
check('a listed player goes for 90% / 75% / 60% / 40% of his price by form', Math.abs(tl.inForm.ratio - 0.9) < 0.03 && Math.abs(tl.steady.ratio - 0.75) < 0.03 && Math.abs(tl.poor.ratio - 0.6) < 0.03 && Math.abs(tl.abysmal.ratio - 0.4) < 0.03, JSON.stringify(tl));
check('the listing survives one window without a sale, ends after the second, and ends at once with a new contract', tl.expiry.after1 === true && tl.expiry.after2 === false && tl.expiry.renewal === false, JSON.stringify(tl.expiry));
const agSrc = fs.readFileSync(root + 'js/agency.js', 'utf8'), simSrc = fs.readFileSync(root + 'js/simulation.js', 'utf8');
check('shopping out lands 42% of the time when listed, 20% otherwise', /const biteChance = p\.transferListed \? 0\.42 : 0\.20;/.test(agSrc));
check('a listed player’s weekly bid chance is multiplied by his form band and draws clubs from its range', /chance \* lb\.bidMult/.test(simSrc) && /p\.ability \+ lb\.lo/.test(simSrc));

// ---- patience on the bench (Agency.clubFit) ----
const pat = JSON.parse(run(`
    var top = Clubs.allClubs.slice().sort(function (a, b) { return b.reputation - a.reputation; })[0];
    var low = Clubs.allClubs.find(function (c) { return c.reputation >= 50 && c.reputation <= 56; });
    var p = PlayerGen.makePlayer(top, { ability: top.reputation - 12, age: 28, position: 'GK' }); p.agentId = 'me'; GameState.players.push(p);
    p.clubId = top.id; p.squadRole = 'rotation'; p.wage = Math.round(Agency.marketWage(p, top) * 2); p.facts = { ambition: { type: 'title' }, favClub: {} };
    var y = GameState.seasonStartYear; GameState.week = 10;
    var at = function (seasonsAgo) { p._clubSince = (y - seasonsAgo) * 52 + 1; return +Agency.clubFit(p, top).patience.toFixed(3); };
    var elite = [at(0), at(1), at(2), at(3)];
    // the same relief at a club that is not elite fades faster (0.5 a season instead of 0.4)
    var mid = Clubs.allClubs.find(function (c) { return c.reputation >= 70 && c.reputation <= 74; });
    var q = PlayerGen.makePlayer(mid, { ability: mid.reputation - 11, age: 28, position: 'CM' }); q.agentId = 'me'; GameState.players.push(q);
    q.clubId = mid.id; q.squadRole = 'rotation'; q.wage = Agency.marketWage(q, mid); q.facts = { ambition: { type: 'goals' }, favClub: {} };
    var atQ = function (s) { q._clubSince = (y - s) * 52 + 1; return +Agency.clubFit(q, mid).patience.toFixed(3); };
    var big = [atQ(0), atQ(1), atQ(2)];
    // a starter at a club well below his level: the bench hurts more, and that never fades
    var r = PlayerGen.makePlayer(low, { ability: low.reputation + 12, age: 26, position: 'ST' }); r.agentId = 'me'; GameState.players.push(r);
    r.clubId = low.id; r.squadRole = 'starter'; r.wage = Agency.marketWage(r, low); r.facts = { ambition: { type: 'goals' }, favClub: {} };
    var atR = function (s) { r._clubSince = (y - s) * 52 + 1; return +Agency.clubFit(r, low).patience.toFixed(3); };
    return JSON.stringify({ elite: elite, big: big, down: [atR(0), atR(3)] });`));
check('an elite club, his ambition served, double pay, Back Up role: the bench hurts least in his first season, got ' + JSON.stringify(pat.elite), pat.elite[0] <= 0.15);
check('...and that patience fades season by season, back to normal in the end', pat.elite[0] < pat.elite[1] && pat.elite[1] < pat.elite[2] && pat.elite[3] >= 0.99, JSON.stringify(pat.elite));
check('at a non-elite club the relief is gone after two seasons; at an elite club 20% slower (still some after two)', pat.big[2] >= 0.99 && pat.elite[2] < 0.99, JSON.stringify(pat));
check('a club well below his level: the bench hurts more (up to the cap), and that never fades', pat.down[0] > 1 && pat.down[0] === pat.down[1], JSON.stringify(pat.down));

// ---- keenness on offers (2 to 5 stars in half steps), the arrival effect, renewals and veterans ----
const kn = JSON.parse(run(`
    var C = function (id) { return Clubs.getClubById(id); };
    var bvb = C('Dortmund'), p = PlayerGen.makePlayer(bvb, { ability: 80, age: 25, position: 'RW' }); GameState.players.push(p);
    p.clubId = bvb.id; p.agentId = 'me'; p.squadRole = 'starter'; p.wage = Math.round(Agency.marketWage(p, bvb));
    p.personality = { primary: 'professional', secondary: 'humble', revP: true, revS: true };
    p.facts = { ambition: { type: 'league', div: 'PREM', discovered: true, fulfilled: false }, favClub: {}, home: 'Germany' };
    var sc = function (id) { return Agency.moveKeenness(p, C(id), { role: 'starter', wage: p.wage }).score; };
    var told = Agency.moveKeenness(p, C('Brighton'), { role: 'starter', wage: p.wage }).reasons;
    p.facts.ambition.discovered = false; var untold = Agency.moveKeenness(p, C('Brighton'), { role: 'starter', wage: p.wage }).reasons; p.facts.ambition.discovered = true;
    // the keeper: a back-up role at a giant vs at a weak club
    var mid = Clubs.allClubs.find(function (c) { return c.country === 'England' && Math.abs(c.reputation - 72) <= 2; });
    var weak = Clubs.allClubs.find(function (c) { return c.country === 'England' && Math.abs(c.reputation - 64) <= 2; });
    var gk = PlayerGen.makePlayer(mid, { ability: 78, age: 28, position: 'GK' }); GameState.players.push(gk); gk.clubId = mid.id; gk.agentId = 'me'; gk.squadRole = 'starter';
    gk.wage = Math.round(Agency.marketWage(gk, mid)); gk.facts = { ambition: { type: 'title', discovered: true }, favClub: {} }; gk.personality = { primary: 'professional', secondary: 'humble' };
    var giant = Agency.moveKeenness(gk, C('Arsenal'), { role: 'rotation', wage: gk.wage * 2 }).stars, small = Agency.moveKeenness(gk, weak, { role: 'rotation', wage: gk.wage }).stars;
    // arrival: a keen move starts higher club morale than a reluctant one
    var arrive = function (club, role, wage) {
        var q = PlayerGen.makePlayer(mid, { ability: 78, age: 28, position: 'GK' }); GameState.players.push(q); q.clubId = mid.id; q.agentId = 'me'; q.squadRole = 'starter';
        q.wage = Math.round(Agency.marketWage(q, mid)); q.facts = { ambition: { type: 'title', discovered: true }, favClub: {} }; q.personality = { primary: 'professional', secondary: 'humble' };
        q.contractUntilSeason = GameState.seasonStartYear + 1; GameState.week = 3;
        var m = GameState.addMail({ kind: 'transfer', subject: 't', offer: { playerId: q.id, fromClubId: mid.id, toClubId: club.id, transferFee: 1000, role: role, proposedWage: wage || q.wage } });
        var r = Agency.acceptTransfer(m, wage || q.wage, role, 2, 0);
        return { ok: r.ok, msg: r.ok ? '' : r.message, club: q.morale.club, moved: q.clubId === club.id, stars: Agency.moveKeenness(q, club, { role: role, wage: wage || q.wage }).stars };
    };
    var roleAt = function (club, q) { return Agency.maxRoleAt ? Agency.maxRoleAt(gk, club) : 'rotation'; };
    var keenArrive = arrive(C('Arsenal'), roleAt(C('Arsenal')), null), shyArrive = arrive(weak, 'rotation', null);
    // a renewal restarts the patience clock; a veteran's patience never fades
    var ar = C('Arsenal'), v = PlayerGen.makePlayer(ar, { ability: ar.reputation - 12, age: 33, position: 'GK' }); GameState.players.push(v);
    v.clubId = ar.id; v.agentId = 'me'; v.squadRole = 'rotation'; v.wage = Agency.marketWage(v, ar); v.facts = { ambition: { type: 'title' }, favClub: {} };
    var y = GameState.seasonStartYear; v._clubSince = (y - 4) * 52 + 1; var vet4 = Agency.clubFit(v, ar).patience;
    var w = PlayerGen.makePlayer(ar, { ability: ar.reputation - 12, age: 27, position: 'GK' }); GameState.players.push(w);
    w.clubId = ar.id; w.agentId = 'me'; w.squadRole = 'rotation'; w.wage = Agency.marketWage(w, ar); w.facts = { ambition: { type: 'title' }, favClub: {} };
    w._clubSince = (y - 3) * 52 + 1; var before = Agency.clubFit(w, ar).patience;
    var ren = GameState.addMail({ kind: 'renewal', subject: 'r', offer: { playerId: w.id, clubId: ar.id } }); w._renewSeason = null; w.contractUntilSeason = y + 1;
    var rr = Agency.acceptRenewal(ren, w.wage, null, 2, {}); var after = Agency.clubFit(w, ar).patience;
    return JSON.stringify({ real: sc('Real Madrid'), fulham: sc('Fulham'), brighton: sc('Brighton'), sevilla: sc('Sevilla'), told: told, untold: untold,
        giant: giant, small: small, keenArrive: keenArrive, shyArrive: shyArrive, vet4: vet4, before: before, after: after, renewOk: rr.ok });`));
check('a Prem dreamer at Dortmund: Brighton over Sevilla, and Real Madrid still over Fulham', kn.brighton > kn.sevilla && kn.real > kn.fulham, JSON.stringify(kn));
check('the reason names his dream only once he has told you ("something about this club appeals to him" before)', kn.told.includes('dreamLeague') && kn.untold.includes('secret') && !kn.untold.includes('dreamLeague'), JSON.stringify(kn));
check('a back-up role at a giant on double pay: 5 stars; the same role at a weak club: 2.5 stars or fewer', kn.giant === 5 && kn.small <= 2.5, JSON.stringify(kn));
check('arrival: a keen move starts with higher club morale than a reluctant one', kn.keenArrive.moved && kn.shyArrive.moved && kn.keenArrive.club > kn.shyArrive.club, JSON.stringify(kn));
check('a veteran back-up at a giant stays patient after four seasons (the Ulreich rule)', kn.vet4 <= 0.2, JSON.stringify(kn));
check('a new contract restarts the patience clock', kn.renewOk && kn.after < kn.before, JSON.stringify(kn));

// ---- a step up and better pay make a move attractive; a homebody can be won over by pay; a renewal resets
// playing-time morale ----
const kn2 = JSON.parse(run(`
    var C = function (id) { return Clubs.getClubById(id); };
    var mid = Clubs.allClubs.find(function (c) { return c.country === 'Germany' && Math.abs(c.reputation - 74) <= 1; });
    var mk = function (traits) { var p = PlayerGen.makePlayer(mid, { ability: 76, age: 25, position: 'RW' }); GameState.players.push(p);
        p.clubId = mid.id; p.agentId = 'me'; p.squadRole = 'starter'; p.wage = Math.round(Agency.marketWage(p, mid));
        p.personality = { primary: traits[0], secondary: traits[1] }; p.facts = { ambition: { type: 'goals' }, favClub: {}, home: 'Germany' }; return p; };
    var p = mk(['professional', 'humble']), hb = mk(['homebody', 'humble']);
    var abroad = Clubs.allClubs.find(function (c) { return c.country === 'France' && Math.abs(c.reputation - mid.reputation) <= 1; });
    var k = function (pl, club, x) { return Agency.moveKeenness(pl, club, { role: 'starter', wage: Math.round(pl.wage * x) }); };
    var r = PlayerGen.makePlayer(mid, { ability: 70, age: 27, position: 'CM' }); GameState.players.push(r); r.clubId = mid.id; r.agentId = 'me'; r.squadRole = 'rotation';
    r.wage = Agency.marketWage(r, mid); r.morale = PlayerGen.freshMorale(); r.morale.time = 22; r._renewSeason = null; r.contractUntilSeason = GameState.seasonStartYear + 1;
    var ren = GameState.addMail({ kind: 'renewal', subject: 'r', offer: { playerId: r.id, clubId: mid.id } });
    var rr = Agency.acceptRenewal(ren, r.wage, null, 2, {});
    return JSON.stringify({ sevSame: k(p, C('Sevilla'), 1).stars, sevPay: k(p, C('Sevilla'), 1.2).stars, hbSame: k(hb, abroad, 1).score, hbRich: k(hb, abroad, 1.6).score,
        renewOk: rr.ok, timeAfter: r.morale.time });`));
check('a step up to Sevilla is welcome (4 stars or more), more so with better pay', kn2.sevSame >= 4 && kn2.sevPay > kn2.sevSame, JSON.stringify(kn2));
check('a homebody hesitates about a move abroad at the same pay, but a big pay rise wins him over', kn2.hbSame < 0 && kn2.hbRich > 0, JSON.stringify(kn2));
check('a new contract resets his playing-time morale (he agreed to it, so he is content with it)', kn2.renewOk && kn2.timeAfter >= 70, JSON.stringify(kn2));

const st = JSON.parse(run(`
    var C = function (id) { return Clubs.getClubById(id); }, out = [], bvb = C('Dortmund');
    var p = PlayerGen.makePlayer(bvb, { ability: 80, age: 25, position: 'RW' }); GameState.players.push(p); p.clubId = bvb.id; p.agentId = 'me'; p.squadRole = 'starter';
    p.wage = Agency.marketWage(p, bvb); p.facts = { ambition: { type: 'goals' }, favClub: {} };
    Clubs.allClubs.slice(0, 300).forEach(function (c) { ['starter', 'rotation', 'fringe'].forEach(function (r) { [0.6, 1, 2].forEach(function (x) { out.push(Agency.moveKeenness(p, c, { role: r, wage: p.wage * x }).stars); }); }); });
    return JSON.stringify({ min: Math.min.apply(null, out), max: Math.max.apply(null, out), halves: out.every(function (v) { return v * 2 === Math.round(v * 2); }) });`));
check('the scale runs from 2 to 5 stars in half steps, got ' + JSON.stringify(st), st.min === 2 && st.max === 5 && st.halves);

// a loan is judged against his own level: a near-level club as rotation beats a club far below as Star Player,
// and the same club as a starter is better still
const ln = JSON.parse(run(`
    var near = function (rep) { return Clubs.allClubs.slice().sort(function (a, b) { return Math.abs(a.reputation - rep) - Math.abs(b.reputation - rep); })[0]; };
    var parent = near(80), p = PlayerGen.makePlayer(parent, { ability: 70, age: 21, position: 'CM' }); GameState.players.push(p);
    p.clubId = parent.id; p.agentId = 'me'; p.squadRole = 'fringe'; p.wage = Agency.marketWage(p, parent); p.facts = { ambition: { type: 'goals' }, favClub: {}, home: parent.country };
    p.personality = { primary: 'professional', secondary: 'humble' };
    var k = function (rep, role) { return Agency.moveKeenness(p, near(rep), { role: role, loan: true }).stars; };
    return JSON.stringify({ low: k(28, 'key'), nearRot: k(72, 'rotation'), nearStart: k(72, 'starter') });`));
check('loans: rotation at a club near his level beats Star Player far below him, and a starting role there is better still, got ' + JSON.stringify(ln), ln.nearRot > ln.low && ln.nearStart > ln.nearRot);

check('no engine errors, got ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
if (failed) process.exit(1);
