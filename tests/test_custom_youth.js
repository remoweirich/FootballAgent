// Youth sides and the cup template for created countries (js/league.js applyPromotionRelegationCustom,
// buildCustomCups; js/world-ext.js youthProblems): divisions 3-4 only (at most 6 in each on day one, any
// number in the game), never in or above the parent's division (they share division 4), and the cups.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = require('path').join(__dirname, '..', 'js') + '/';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = { console: { log() { }, warn() { }, error: (...a) => errors.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('{' + c + '}', sb);
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

// A created country with no youth sides; each scenario places clubs and youth sides by hand, writes the
// final tables in a chosen order, and runs the season's promotion/relegation.
run(`
    Clubs.init();
    var cc = WorldExt.makeSkeleton('Nigeria', false);
    var db = { id:'dbNG', name:'NG', overrides:{}, competitions:{}, countries:{ 'Nigeria': cc } };
    GameState.startNewGame('Nigeria', 'Test FC', 'Me', db);
    globalThis.CC = WorldExt.created['Nigeria'];
    globalThis.HOME = {}; Clubs.allClubs.filter(function (c) { return c.country === 'Nigeria'; }).forEach(function (c) { HOME[c.id] = c.division; });
    globalThis.div = function (i) { return CC.divIds[i]; };
    globalThis.reset = function () {
        Object.keys(HOME).forEach(function (id) { Clubs.setDivision(id, HOME[id]); Clubs._reserveIds.delete(id); delete Clubs.reserveParentId[id]; delete Clubs.parentReserveId[id]; });
    };
    globalThis.youth = function (id, parentId) { Clubs._reserveIds.add(id); Clubs.reserveParentId[id] = parentId; Clubs.parentReserveId[parentId] = id; };
    globalThis.clubsIn = function (i) { return Clubs.getClubsByDivision(div(i)).map(function (c) { return c.id; }); };
    // tables: first[i] at the top of division i, last<i> at the bottom, everyone else in between
    globalThis.tables = function (first) {
        CC.divIds.forEach(function (d, i) {
            var ids = clubsIn(i), top = (first[i] || []).filter(function (id) { return ids.indexOf(id) >= 0; });
            var last = (first['last' + i] || []).filter(function (id) { return ids.indexOf(id) >= 0; });
            var rest = ids.filter(function (id) { return top.indexOf(id) < 0 && last.indexOf(id) < 0; });
            GameState.league.tables[d] = top.concat(rest, last).map(function (id, k) { return { clubId: id, Pts: 200 - k, GF: 0, GA: 0 }; });
            GameState.league.playoffs[d] = null;
        });
    };
    globalThis.where = function (id) { return CC.divIds.indexOf(Clubs.getClubById(id).division); };
    globalThis.sizes = function () { return CC.divIds.map(function (d) { return Clubs.getClubsByDivision(d).length; }).join(); };
`);

// youth sides top division 3: never promoted into division 2
const a = JSON.parse(runv(`reset(); var d1 = clubsIn(0), d3 = clubsIn(2);
    youth(d3[0], d1[0]); youth(d3[1], d1[1]);
    tables({ 2: [d3[0], d3[1], d3[2], d3[3], d3[4]] });
    var order = League._customPromoOrder(CC, 2).indexOf(d3[0]);
    League.applyPromotionRelegationCustom(CC);
    return JSON.stringify({ y1: where(d3[0]), y2: where(d3[1]), s1: where(d3[2]), s2: where(d3[3]), order: order });`));
check('youth sides finishing 1st and 2nd in division 3 stay there; the next two seniors go up', a.y1 === 2 && a.y2 === 2 && a.s1 === 1 && a.s2 === 1, JSON.stringify(a));
check('division 3 play-offs never include a youth side', a.order === -1, JSON.stringify(a));

// youth side tops division 4: up if its parent is safely above division 3, not if the parent is coming down
const b = JSON.parse(runv(`reset(); var d1 = clubsIn(0), d2 = clubsIn(1), d4 = clubsIn(3);
    youth(d4[0], d1[0]); youth(d4[1], d2[19]);
    tables({ 3: [d4[0], d4[1]], last1: [d2[19]] });
    League.applyPromotionRelegationCustom(CC);
    return JSON.stringify({ yA: where(d4[0]), yB: where(d4[1]) });`));
check('a division-4 youth side whose parent is in division 1 is promoted to division 3', b.yA === 2, JSON.stringify(b));
check('...but not one whose parent is being relegated into division 3', b.yB === 3, JSON.stringify(b));

// parent relegated into its youth side's division: the youth side drops to division 4 and swaps
const c = JSON.parse(runv(`reset(); var d2 = clubsIn(1), d3 = clubsIn(2);
    var par = d2[19], y = d3[10]; youth(y, par);
    tables({ last1: [par] });
    var r = League.applyPromotionRelegationCustom(CC);
    return JSON.stringify({ par: where(par), y: where(y), swapped: r.seniorUp.length, sizes: sizes() });`));
check("a parent relegated into its youth side's division sends the youth side to division 4 (sizes kept by a swap)",
    c.par === 2 && c.y === 3 && c.swapped === 1 && c.sizes === '20,20,24,20', JSON.stringify(c));

// parent and youth side both end up in division 4: they share it
const d = JSON.parse(runv(`reset(); var d3 = clubsIn(2);
    var par = d3[23], y = d3[5]; youth(y, par);
    tables({ last2: [par] });
    League.applyPromotionRelegationCustom(CC);
    var after1 = [where(par), where(y)];
    tables({ 3: [y] });   // the youth side wins division 4 while its parent is there too
    League.applyPromotionRelegationCustom(CC);
    return JSON.stringify({ after1: after1, yAfter2: where(y), sizes: sizes() });`));
check('a parent relegated into division 4 takes its youth side down too, and they share division 4', d.after1.join() === '3,3', JSON.stringify(d));
check('...where the youth side cannot be promoted while its parent is there', d.yAfter2 === 3 && d.sizes === '20,20,24,20', JSON.stringify(d));

// the cap of 6 is for the day-one layout only: in the game, every relegated youth side goes down
const e = JSON.parse(runv(`reset(); var d1 = clubsIn(0), d3 = clubsIn(2), d4 = clubsIn(3);
    d4.slice(14, 20).forEach(function (id, i) { youth(id, d1[i]); });                     // 6 in division 4, finishing bottom
    var yd3 = d3.slice(0, 4); yd3.forEach(function (id, i) { youth(id, d1[6 + i]); });   // 4 in division 3, finishing bottom
    tables({ last2: yd3, last3: d4.slice(14, 20) });
    var r = League.applyPromotionRelegationCustom(CC);
    var cnt = function (i) { return clubsIn(i).filter(function (id) { return isReserveClub(id); }).length; };
    return JSON.stringify({ d3: cnt(2), d4: cnt(3), down: r.d3Down.filter(function (id) { return isReserveClub(id); }).length, sizes: sizes() });`));
check('in the game a division may hold more than 6 youth sides: all 4 relegated youth sides go down (10 in division 4)',
    e.d4 === 10 && e.d3 === 0 && e.down === 4 && e.sizes === '20,20,24,20', JSON.stringify(e));

// a country built under the old rules (youth sides in division 2) is put right at the season change
const f = JSON.parse(runv(`reset(); var d1 = clubsIn(0), d2 = clubsIn(1);
    var y = d2[5]; youth(y, d1[0]); tables({});
    League.applyPromotionRelegationCustom(CC);
    return JSON.stringify({ y: where(y), sizes: sizes() });`));
check('an old youth side in division 2 moves down to division 3 at the season change', f.y === 2 && f.sizes === '20,20,24,20', JSON.stringify(f));

// cups
const g = JSON.parse(runv(`reset(); var d1 = clubsIn(0), d3 = clubsIn(2), d4 = clubsIn(3);
    d3.slice(0, 6).forEach(function (id, i) { youth(id, d1[i]); }); d4.slice(0, 6).forEach(function (id, i) { youth(id, d1[6 + i]); });
    var cu = League.buildCustomCups()['Nigeria'];
    var hi = cu.higher.seeded.concat(cu.higher.lower), lo = cu.lower.seeded.concat(cu.lower.lower);
    var y = function (l) { return l.filter(function (id) { return isReserveClub(id); }).length; };
    return JSON.stringify({ hi: hi.length, hiY: y(hi), hiSeeded: cu.higher.seeded.every(function (id) { return where(id) === 0; }),
        fromD4: hi.filter(function (id) { return where(id) === 3; }).length, uniq: new Set(hi).size,
        lo: lo.length, loY: y(lo), loSeeded: cu.lower.seeded.every(function (id) { return where(id) === 1; }) });`));
check('national cup: 64 clubs, division 1 seeded, no youth sides, topped up from division 4', g.hi === 64 && g.uniq === 64 && g.hiY === 0 && g.hiSeeded && g.fromD4 === 6, JSON.stringify(g));
check('challenge cup: divisions 2-4, 64 clubs, division 2 seeded, youth sides in', g.lo === 64 && g.loY === 12 && g.loSeeded, JSON.stringify(g));
const h = runv(`var cu = League.buildCustomCups()['Nigeria'];
    League._customCupStep(cu.higher, CC.cups.higher.id, 4); League._customCupStep(cu.higher, CC.cups.higher.id, 7);
    return cu.higher.results.map(function (r) { return r.roundKey + ':' + r.ties.length; }).join();`);
check('cup rounds carry translatable names (round of 64 = 32 ties, round of 32 = 16)', h === 'cup.round.r64:32,cup.round.r32:16', h);
check('new countries get the template cup names', runv(`var s = WorldExt.makeSkeleton('Kenya', false); return s.cups.higher.name === 'Kenya Cup' && s.cups.lower.name === 'Kenya Challenge Cup';`));

// the save-time rules
const p = JSON.parse(runv(`var s = WorldExt.makeSkeleton('Ghana', false);
    var inDiv = function (x, i) { return x.clubs.filter(function (c) { return c.division === x.divIds[i]; }); };
    var ok = JSON.parse(JSON.stringify(s)); inDiv(ok, 2)[0].reserve = true; inDiv(ok, 2)[0].parentId = inDiv(ok, 0)[0].id;
    var bad = JSON.parse(JSON.stringify(s)), b1 = inDiv(bad, 0), b2 = inDiv(bad, 1), b3 = inDiv(bad, 2), b4 = inDiv(bad, 3);
    b2[0].reserve = true; b2[0].parentId = b1[0].id;                                                    // division 2: not allowed
    b4[0].reserve = true; b4[0].parentId = b4[1].id;                                                    // parent not above
    b3[0].reserve = true; b3[0].parentId = b1[1].id; b3[1].reserve = true; b3[1].parentId = b1[1].id;   // two youth sides for one club
    b3[2].reserve = true; b3[2].parentId = 'nobody';                                                    // no parent
    return JSON.stringify({ ok: WorldExt.youthProblems(ok).length, bad: WorldExt.youthProblems(bad).map(function (x) { return x.code; }).sort().join() });`));
check('saving: a youth side in division 3 under a division-1 club is fine', p.ok === 0, JSON.stringify(p));
check('saving: division 2, parent not above, two youth sides for one club and a missing parent are all refused', p.bad === 'div,noParent,parentBelow,twoYouth', JSON.stringify(p));
check('no engine errors, got ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);

if (failed) process.exit(1);
