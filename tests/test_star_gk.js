// A client keeper signed as Star Player or First Choice starts, even when the club already has a
// better-rated No.1. Signing him never demotes the keeper already there, and since v1.0.37 a spare
// keeper no longer fills an outfield place, so a Star keeper behind a better NPC No.1 sat out the
// whole season (median 3 appearances). The negotiated role now wins the depth chart (league.js
// assignStats, gkRank).
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, addEventListener() {},
    UI: { money: n => String(n), eabbr: n => String(n), cur: () => '€', abbr: n => String(n), esc: s => s } };
sb.window = sb;
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

const r = JSON.parse(vm.runInContext(`(function () {
    Rng.seed(11); Clubs.init(); GameState.startNewGame('Germany', 'T', 'A'); GameState.save = function () {};
    var star = [], first = [], rivals = [];
    Clubs.allClubs.filter(function (c) { return c.tier === 1; }).slice(0, 70).forEach(function (c, i) {
        var g = GameState.players.filter(function (p) { return p.clubId === c.id && p.position === 'GK' && !p.archived; })
            .sort(function (a, b) { return b.ability - a.ability; });
        if (g.length < 2 || g[g.length - 1].ability >= g[0].ability || g[0].squadRole !== 'key') return;
        var p = g[g.length - 1];
        p.agentId = 'me'; p.everClient = true; p.squadRole = i % 2 ? 'starter' : 'key';
        p.morale = p.morale || PlayerGen.freshMorale();
        (i % 2 ? first : star).push(p); rivals.push(g[0]);
    });
    var y = GameState.seasonStartYear;
    for (var w = 0; w < 60 && GameState.seasonStartYear === y; w++) Sim.advanceWeek();
    function apps(p) { var s = (p.stats || {})[y] || {}, n = 0; Object.values(s).forEach(function (st) { Object.values(st.comps || {}).forEach(function (c) { n += c.apps || 0; }); }); return n; }
    return JSON.stringify({ star: star.map(apps), first: first.map(apps), rivals: rivals.map(apps) });
})()`, sb));
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
check(`Star keeper behind a better No.1 still plays (n ${r.star.length}, median ${med(r.star)} apps)`, r.star.length >= 5 && med(r.star) >= 25);
check(`First Choice keeper behind a better Star No.1 plays too (n ${r.first.length}, median ${med(r.first)} apps)`, r.first.length >= 5 && med(r.first) >= 25);
check(`the better-rated NPC keeper drops to the bench (median ${med(r.rivals)} apps)`, med(r.rivals) < 12);
if (failed) process.exit(1);
console.log('All Star-keeper checks passed.');
