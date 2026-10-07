// Negotiations: Accept may only sign terms the club has agreed to.
// The exploit: on a renewal or loan you could drag the sliders / role anywhere and press Accept,
// dictating any deal. Now "Suggest terms" puts the package to the club; whatever it agrees to (or
// counters with) becomes the agreed package; Accept is live only while the controls show exactly
// that package, and it signs the AGREED package, never the raw controls.
// Also: mail text links names to the right player even when namesakes exist, and player ids
// can never repeat.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const noop = () => {};
// DOM: only what the negotiation screen touches. getElementById hands back one stable stub per id
// so syncAgreed's disabled/display writes can be read back.
const els = {};
const elStub = id => els[id] || (els[id] = { id, disabled: false, style: {}, innerHTML: '', textContent: '' });
const sb = {
    console: { log: noop, warn: noop, error: noop }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    indexedDB: undefined, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: { addEventListener: noop, getElementById: elStub, querySelector: () => null },
    addEventListener: noop, removeEventListener: noop,
};
sb.window = sb;
// UI helpers: plain text where the engine formats money, empty markup for the rest
sb.UI = new Proxy({ money: String, euro: String, esc: String, ordinal: String }, { get: (t, k) => (k in t ? t[k] : () => '') });
const routerLog = [];
sb.Router = {
    register: noop, link: (r, id) => '#/' + r + '/' + id,
    refresh() { routerLog.push('refresh'); }, result(msg, cls) { routerLog.push('result:' + cls); },
    back: noop, replace: noop,
};
vm.createContext(sb);
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb, { filename: 'ui-i18n-en.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-negotiations.js', 'utf8'), sb, { filename: 'screen-negotiations.js' });

const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

run(`Rng.seed(31337); Clubs.init(); GameState.startNewGame('England','Nego','A'); Rng.seed(31337);
     GameState.agency.balance = 50000000; GameState.agency.reputation = 60;
     GameState.save = function () {};
     // spy on what Accept actually signs
     __signed = [];
     ['acceptRenewal', 'acceptLoanOffer', 'acceptTransfer'].forEach(function (fn) {
         var orig = Agency[fn];
         Agency[fn] = function () { __signed.push({ fn: fn, args: [].slice.call(arguments, 1) }); return orig.apply(this, arguments); };
     });
     __client = function (pred) {
         var p = GameState.players.filter(function (q) { return q.clubId && !q.agentId && !q.onLoanAt && pred(q); })[0];
         p.agentId = 'me'; p.everClient = true; p.knownToAgent = true; p.wageCommission = 10; p.sponsorCommission = 10;
         p.contractUntilSeason = GameState.seasonStartYear + 3;
         if (!p.morale) p.morale = { club: 70, time: 70, wage: 70, agent: 70 };
         return p;
     };
     __render = function (m) { var el = { innerHTML: '' }; Nego[m.kind](el, m); return el.innerHTML; };`);
const signed = () => JSON.parse(run('return JSON.stringify(__signed);'));
const resetSigned = () => run('__signed = [];');

// ---------------- renewal ----------------
console.log('-- renewal --');
run(`var p = __client(function (q) { return q.ability >= 45 && q.ability <= 60 && q.age < 30 && q.position !== 'GK' && q.squadRole === 'rotation'; });
     __rp = p; __club = Clubs.getClubById(p.clubId);
     __rm = GameState.addMail({ kind: 'renewal', subject: 'r', offer: { playerId: p.id, clubId: p.clubId, proposedWage: p.wage + 200, proposedTermSeasons: 2 } });`);
let html = run('return __render(__rm);');
check('Decline, Suggest terms and Accept renewal are on the screen', /nego\.decline|Decline/.test(html) && html.includes('Suggest terms') && html.includes('Accept renewal'));
check('the inline "Put it to the club" button is gone', !html.includes('Put it to the club'));
check('opening offer: Accept is live, Suggest is greyed (nothing to suggest)', /id="negoAccept"[^>]*onclick[^>]*>/.test(html) && !/id="negoAccept"[^>]*disabled/.test(html) && /id="negoSuggest"[^>]*disabled/.test(html));
check('Accept sits after (below) the Decline/Suggest row', html.indexOf('id="negoAccept"') > html.indexOf('id="negoSuggest"'));

// the exploit: drag the wage to the moon and press Accept
run(`Nego.slide(__rm.id, 'wage', String(__rm.offer.proposedWage * 3));`);
check('dragging the wage greys Accept out', run('return document.getElementById("negoAccept").disabled === true;') === true);
check('...and lights Suggest up', run('return document.getElementById("negoSuggest").disabled === false;') === true);
check('...and shows the hint saying why', run('return document.getElementById("negoLocked").style.display === "";') === true);
resetSigned(); run('Nego.accept(__rm.id);');
check('Accept with un-agreed terms signs nothing (the old exploit)', signed().length === 0);

// put it back exactly -> live again, no second suggestion needed
run(`Nego.slide(__rm.id, 'wage', String(__rm.offer.proposedWage));`);
check('setting the wage back re-enables Accept without suggesting', run('return document.getElementById("negoAccept").disabled === false;') === true);
// same for the role and the length
run(`Nego.slide(__rm.id, 'role', 'key');`);
check('changing the role greys Accept out', run('return Nego.matchesAgreed(__rm, Nego.ctxFor(__rm.id));') === false);
run(`Nego.slide(__rm.id, 'role', __rm.offer.agreed.role);`);
check('...and setting it back re-enables it', run('return Nego.matchesAgreed(__rm, Nego.ctxFor(__rm.id));') === true);
const t0 = run('return Nego.ctxFor(__rm.id).term;');
run(`Nego.slide(__rm.id, 'term', String(${t0} === 1 ? 2 : 1));`);
check('changing the length greys Accept out', run('return Nego.matchesAgreed(__rm, Nego.ctxFor(__rm.id));') === false);
run(`Nego.slide(__rm.id, 'term', '${t0}');`);
check('...and setting it back re-enables it', run('return Nego.matchesAgreed(__rm, Nego.ctxFor(__rm.id));') === true);

// a slider that cannot land on the agreed figure still counts at its nearest notch
run(`Nego.ctxFor(__rm.id).wage = __rm.offer.agreed.wage + 4;`);
check('a wage within half a notch of the agreed figure counts as agreed', run('return Nego.matchesAgreed(__rm, Nego.ctxFor(__rm.id));') === true);
run(`Nego.ctxFor(__rm.id).wage = __rm.offer.agreed.wage + 10;`);
check('...a whole notch away does not', run('return Nego.matchesAgreed(__rm, Nego.ctxFor(__rm.id));') === false);

// greedy ask + a role above the club's ceiling -> one counter covering both
const ren = JSON.parse(run(`
    var c = Nego.ctxFor(__rm.id);
    Nego.slide(__rm.id, 'wage', String(__rm.offer.proposedWage * 3));
    Nego.slide(__rm.id, 'role', 'key');
    var ceil = Agency.clubRoleCeiling(__rp, __club);
    Nego.suggest(__rm.id);
    var gone = !GameState.inbox.some(function (x) { return x.id === __rm.id; });
    return JSON.stringify({ gone: gone, ceil: ceil, a: __rm.offer.agreed, c: { wage: c.wage, role: c.role, term: c.term },
        ask: __rm.offer.proposedWage * 3, keyOk: Agency.roleAcceptable(__rp, __club, 'key'), reply: c.reply });`));
check('the club answered (no walkout on a first round)', !ren.gone);
check(`the wage came back as a counter below the ask (${ren.a.wage} < ${ren.ask})`, ren.a.wage < ren.ask);
check(`the role came back at the club's ceiling (${ren.a.role})`, ren.keyOk || ren.a.role === ren.ceil);
check('the counter lands in the controls, so Accept is live on it', run('return Nego.matchesAgreed(__rm, Nego.ctxFor(__rm.id));') === true);
check('the club\'s reply is kept for the redraw', !!(ren.reply && ren.reply.msg));
resetSigned(); run('Nego.accept(__rm.id);');
const rs = signed();
check('Accept signs exactly the agreed package', rs.length === 1 && rs[0].fn === 'acceptRenewal'
    && rs[0].args[0] === ren.a.wage && rs[0].args[1] === ren.a.role && rs[0].args[2] === ren.a.term, JSON.stringify(rs[0] && rs[0].args));
check('...and the player now earns the agreed wage', run('return __rp.wage;') === ren.a.wage);

// the club never haggles below its own opening offer
console.log('\n-- the club stands by its opening wage --');
const floorRuns = JSON.parse(run(`
    var bad = 0, n = 0;
    for (var s = 1; s <= 200; s++) {
        Rng.seed(s);
        var neg = Agency.initNeg(null, __club, 0);
        var open = Agency.maxClubWage(__rp, __club) + 500;            // an opening offer above the bargain's usual start
        var r = Agency.evaluateRenewal(__rp, __club, { wage: open, role: 'rotation', term: 2 }, neg, open);
        n++; if (r.status !== 'accept') bad++;
    }
    return JSON.stringify({ n: n, bad: bad });`));
check(`asking for exactly the opening wage is always a yes (${floorRuns.n - floorRuns.bad}/${floorRuns.n})`, floorRuns.bad === 0);

// ---------------- loan ----------------
console.log('\n-- loan --');
run(`GameState.week = 2;   // inside the summer window, so lengths are on offer
     var p = __client(function (q) { return q.ability >= 35 && q.ability <= 55 && q.age <= 23; });
     __lp = p;
     var to = Clubs.allClubs.filter(function (c) { return c.id !== p.clubId && c.reputation > p.ability + 8; })[0];
     __to = to;
     __lm = GameState.addMail({ kind: 'loan', subject: 'l', offer: { playerId: p.id, fromClubId: p.clubId, toClubId: to.id, role: 'rotation' } });`);
html = run('return __render(__lm);');
check('Decline, Suggest terms and Accept loan are on the screen', html.includes('Suggest terms') && html.includes('Accept loan') && !html.includes('Put it to the club'));
check('opening offer: Accept is live', !/id="negoAccept"[^>]*disabled/.test(html));
const lCeil = run(`return Agency.clubRoleCeiling(__lp, Clubs.getClubById(__lm.offer.toClubId));`);
run(`Nego.slide(__lm.id, 'loanRole', 'key');`);
check('asking for a bigger role greys Accept out', run('return Nego.matchesAgreed(__lm, Nego.ctxFor(__lm.id));') === false);
resetSigned(); run('Nego.accept(__lm.id);');
check('Accept with an un-agreed role signs nothing (the old exploit)', signed().length === 0);
const loanS = JSON.parse(run(`Nego.suggest(__lm.id); return JSON.stringify(__lm.offer.agreed);`));
check(`the club's answer becomes the agreed role (${loanS.loanRole}; ceiling ${lCeil})`, loanS.loanRole === 'key' || loanS.loanRole === lCeil);
check('...and is in the dropdown, so Accept is live', run('return Nego.matchesAgreed(__lm, Nego.ctxFor(__lm.id));') === true);

// changing ONLY the length: no re-haggle of a role already agreed
const durs = JSON.parse(run(`return JSON.stringify(Agency.loanDurationOptions(__lp).map(function (d) { return d.code; }));`));
check(`the window offers more than one length (${durs.join(', ')})`, durs.length > 1);
const other = durs.find(d => String(d) !== String(loanS.duration));
run(`Nego.slide(__lm.id, 'duration', '${other}');`);
check('changing the length greys Accept out', run('return Nego.matchesAgreed(__lm, Nego.ctxFor(__lm.id));') === false);
const round0 = run('return Nego.ctxFor(__lm.id).loanRound;');
run(`Nego.suggest(__lm.id);`);
check('suggesting just a new length keeps the agreed role (no re-roll)', run('return __lm.offer.agreed.loanRole;') === loanS.loanRole
    && run('return Nego.ctxFor(__lm.id).loanRound;') === round0);
check('...and agrees the new length', String(run('return __lm.offer.agreed.duration;')) === String(other));
resetSigned(); run('Nego.accept(__lm.id);');
const ls = signed();
check('Accept loan signs the agreed role and length', ls.length === 1 && ls[0].args[0] === loanS.loanRole && String(ls[0].args[1]) === String(other), JSON.stringify(ls[0] && ls[0].args));
check('...and he is on loan in that role', run('return __lp.onLoanAt === __to.id && __lp.loanRole;') === loanS.loanRole);

// ---------------- transfer ----------------
console.log('\n-- transfer --');
run(`var p = __client(function (q) { return q.ability >= 50 && q.ability <= 65 && q.age < 28; });
     __tp = p;
     var to = Clubs.allClubs.filter(function (c) { return c.id !== p.clubId && c.reputation >= p.ability; })[0];
     __tto = to;
     __tm = GameState.addMail({ kind: 'transfer', subject: 't', offer: { playerId: p.id, fromClubId: p.clubId, toClubId: to.id, transferFee: 2000000, proposedWage: Agency.offeredWage ? Agency.offeredWage(p, to, { jitter: false }) : p.wage, role: 'rotation' } });`);
html = run('return __render(__tm);');
check('Reject, Suggest terms and Accept transfer are on the screen', html.includes('Suggest terms') && html.includes('Accept transfer') && !html.includes('Propose package'));
check('opening offer: Accept is live', !/id="negoAccept"[^>]*disabled/.test(html));
run(`Nego.slide(__tm.id, 'wage', String(__tm.offer.proposedWage * 3)); Nego.slide(__tm.id, 'bonus', '999999999');`);
check('dragging wage and fee greys Accept out', run('return Nego.matchesAgreed(__tm, Nego.ctxFor(__tm.id));') === false);
resetSigned(); run('Nego.accept(__tm.id);');
check('Accept with un-agreed terms signs nothing', signed().length === 0);
const tr = JSON.parse(run(`Nego.suggest(__tm.id); return JSON.stringify({ a: __tm.offer.agreed, alive: GameState.inbox.some(function (x) { return x.id === __tm.id; }) });`));
check('a suggestion no longer signs on its own: the offer stays open', tr.alive && signed().length === 0);
check('the club\'s package is agreed and in the controls', run('return Nego.matchesAgreed(__tm, Nego.ctxFor(__tm.id));') === true);
resetSigned(); run('Nego.accept(__tm.id);');
const ts = signed();
check('Accept transfer signs the agreed package', ts.length === 1 && ts[0].args[0] === tr.a.wage && ts[0].args[3] === tr.a.bonus, JSON.stringify(ts[0] && ts[0].args));
check('...and the club takes it (the deal goes through)', run('return !GameState.inbox.some(function (x) { return x.id === __tm.id; }) && !!(__tp.pendingTransfer || __tp.clubId === __tto.id);') === true);

// every counter a club makes must be one it then signs: otherwise Accept would light up on a
// package that the last check refuses
console.log('\n-- every counter is signable --');
const sweep = JSON.parse(run(`
    var n = 0, bad = [], clubs = Clubs.allClubs;
    var pool = GameState.players.filter(function (q) { return q.clubId && q.age < 31 && q.ability >= 30; });
    for (var i = 0; i < 400; i++) {
        var p = pool[(i * 37) % pool.length], club = clubs[(i * 53) % clubs.length];
        if (club.id === p.clubId) continue;
        var fee = [0, 250000, 3000000, 25000000][i % 4], wage = p.wage * (1 + (i % 5));
        var pkg = { wage: wage, role: ROLE_ORDER[i % ROLE_ORDER.length], term: 1 + (i % 4), bonus: [0, 50000, 500000, 5000000][(i >> 2) % 4], fee: fee };
        var r = Agency.evaluateTransfer(p, club, pkg, Agency.initNeg(null, club, wage));
        if (r.status === 'walkout') continue;
        var cc = r.counter; n++;
        var why = [];
        if (!Agency.roleAcceptable(p, club, cc.role)) why.push('role');
        if (cc.term > Agency.maxContractTerm(p, club)) why.push('term');
        if (cc.bonus > Agency.clubBonusWillingness(p, club, cc.wage, fee)) why.push('bonus');
        if (why.length) bad.push(why.join('+'));
    }
    return JSON.stringify({ n: n, bad: bad });`));
check(`all ${sweep.n} transfer counters pass acceptTransfer's own checks`, sweep.n > 100 && sweep.bad.length === 0, sweep.bad.slice(0, 5).join(', '));

// ---------------- name links ----------------
console.log('\n-- name links go to the right namesake --');
const links = JSON.parse(run(`
    var a = GameState.players[10], b = GameState.players[20], c = GameState.players[30];
    a.knownToAgent = true; b.name = a.name; c.name = a.name;     // three namesakes, only one already known
    var body = 'Found: ' + a.name + ' (ST); and ' + a.name + ' (CB).';
    var ids = function (html) { return (html.match(/#\\/client\\/[^"]+/g) || []).map(function (s) { return s.split('/')[2]; }); };
    return JSON.stringify({
        a: a.id, b: b.id, c: c.id,
        report: ids(Nego.linkifyPlayers(body, { playerIds: [b.id, c.id] })),
        single: ids(Nego.linkifyPlayers('News about ' + a.name + '.', { playerId: b.id })),
        none: ids(Nego.linkifyPlayers('News about ' + a.name + '.', {})),
    });`));
check('a scout report links each found namesake to himself, in order', links.report.join() === [links.b, links.c].join(), links.report.join());
check('a mail about one player links his name to him, not to the known namesake', links.single.join() === links.b);
check('a mail that names nobody still links to the known player', links.none.join() === links.a);
check('scout-found mails carry the ids of the players they report', /playerIds: f\.players\.map\(pl => pl\.id\)/.test(fs.readFileSync(root + 'js/simulation.js', 'utf8')));

// ---------------- ids ----------------
console.log('\n-- player ids never repeat --');
const ids = JSON.parse(run(`
    var realNow = Date.now, realNext = Rng.next, draws = 0;
    Date.now = function () { return 1760000000000; };                   // same millisecond...
    Rng.next = function () { draws++; return 0.123456789; };            // ...and the same dice: a forced clash
    var out = [];
    for (var i = 0; i < 50; i++) out.push(PlayerGen._id());
    Date.now = realNow; Rng.next = realNext;
    var existing = GameState.players[0].id;
    return JSON.stringify({ unique: new Set(out).size, n: out.length, draws: draws,
        clashesWorld: out.some(function (id) { return GameState.getPlayer(id); }) });`));
check(`50 ids from one millisecond and one random value are all distinct (${ids.unique}/${ids.n})`, ids.unique === ids.n);
check('...without a single extra random draw (seeded worlds unchanged)', ids.draws === ids.n);
check('...and none collides with a player already in the world', !ids.clashesWorld);

console.log(failed ? '\n*** FAIL ***' : '\nAll agreed-terms, name-link and id checks passed.');
process.exit(failed ? 1 : 0);
