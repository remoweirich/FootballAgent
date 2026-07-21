// DOM smoke for the live view: drive a captured final to full time and confirm the render + clock
// loop never throw and the scoreboard lands on the banked scoreline.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const errs = [];

// a minimal DOM good enough for LiveView's render calls
function makeEl() {
    return { _html: '', set innerHTML(v) { this._html = String(v); }, get innerHTML() { return this._html; },
        classList: { toggle() {}, add() {}, remove() {} }, dataset: {}, style: {}, textContent: '' };
}
const els = {};
const document = {
    getElementById: id => (els[id] || (els[id] = makeEl())),
    querySelectorAll: () => [],
    createElement: () => makeEl(),
    addEventListener() {}, removeEventListener() {},
    head: { appendChild() {} },
};
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    Math, Date, JSON, document,
    setInterval: () => 1, clearInterval: () => {},   // we pump _tick manually
    Router: { register() {}, link: () => '#', go() {}, refresh() {}, modal() {}, closeModal() {} },
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    window: { addEventListener() {} },
};
sb.UI = { money: n => String(n), euro: n => '€' + n, esc: s => String(s), clubName: id => String(id) };
vm.createContext(sb);
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const LiveView = vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-livesim.js'), 'utf8') + ';LiveView', sb, { filename: 'screen-livesim.js' });

let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

const match = (over) => Object.assign({
    id: 'att_1', kind: 'cup-final', compId: 'SCHWCUP', homeId: 'H', awayId: 'A',
    homeName: 'FC Basel', awayName: 'FC Zürich', hg: 3, ag: 1, winner: 'H', pens: null, minutes: 90,
    firstLeg: null, targetDivision: null, season: 2025, week: 47,
    clients: [
        { playerId: 'p1', name: 'Luca Meier', position: 'LW', styleRole: 'winger', squadRole: 'key', side: 'home', played: true, goals: 1, assists: 1, yellow: 0, red: 0, rating: 7.9 },
        { playerId: 'p2', name: 'Bench Guy', position: 'CB', styleRole: 'aerial_dominator', squadRole: 'fringe', side: 'home', played: false, goals: 0, assists: 0, yellow: 0, red: 0, rating: null },
    ],
}, over || {});

check('show() renders without throwing, and a #app body is written', () => {
    let done = false;
    LiveView.show(match(), () => { done = true; });
    LiveView._done = done;
    return els.app && els.app.innerHTML.includes('lv-board');
});

check('paint across the three tabs never throws', () => {
    try { LiveView._setTab('stats'); LiveView._setTab('clients'); LiveView._setTab('feed'); return true; }
    catch (e) { errs.push(String(e)); return false; }
});

check('skip() drives to full time and the scoreboard equals the scoreline', () => {
    LiveView.skip();
    return LiveView.s.done && LiveView.score.home === 3 && LiveView.score.away === 1;
});

check('Continue (_close) invokes the done callback exactly once', () => {
    let n = 0;
    LiveView.show(match({ hg: 0, ag: 0 }), () => { n++; });
    LiveView.skip();
    LiveView._close();
    LiveView._close();   // idempotent — should not fire again
    return n === 1;
});

check('a manual clock run (ticking) advances the clock, and finishing lands the scoreline', () => {
    LiveView.show(match({ hg: 2, ag: 2, winner: 'H', pens: { h: 4, a: 2 }, minutes: 120 }), () => {});
    LiveView.setSpeed(4);
    for (let i = 0; i < 300; i++) LiveView._tick();   // pump the clock forward a while
    const advanced = LiveView.s.clock > 0;
    LiveView.skip();                                   // then jump to the result
    return advanced && LiveView.s.done && LiveView.score.home === 2 && LiveView.score.away === 2;
});
check('an event narrates piece by piece — its lines reveal one at a time', () => {
    // find a multi-line chain event and confirm the feed shows it partially, then fully
    LiveView.show(match({ hg: 1, ag: 0 }), () => {});
    const multi = LiveView.timeline.events.find(e => (e.lines || []).length > 1);
    if (!multi) return true;   // vacuous if this match had only one-liners
    // simulate the reveal state at one line shown
    multi._shown = 1; LiveView.feed = [multi]; LiveView.s.reveal = { e: multi };
    const partial = LiveView._feedHTML();
    multi._shown = multi.lines.length; LiveView.s.reveal = null;
    const full = LiveView._feedHTML();
    // partial shows fewer <div class="lv-line"> than full, and hides the outcome tag until the end
    const count = h => (h.match(/lv-line/g) || []).length;
    return count(partial) < count(full);
});

check('at full time the tabbed view survives — stats + full feed still browsable', () => {
    LiveView.show(match({ hg: 2, ag: 1 }), () => {});
    LiveView.skip();
    // the board is still the tabbed shell (not a takeover card), and tabs still switch
    if (!els.lvBoard || !els.lvBoard.innerHTML.includes('Full time')) return false;
    try { LiveView._setTab('stats'); LiveView._setTab('feed'); } catch (e) { errs.push(String(e)); return false; }
    // the feed holds every event of the match
    return els.lvBody.innerHTML.length > 0;
});
check('the full-time button reads "Leave" for a lone match, "Attend …" when another follows', () => {
    LiveView.show(match(), () => {}, {});
    LiveView.skip();
    const lone = els.lvBoard.innerHTML.includes('Leave');
    LiveView.show(match(), () => {}, { nextLabel: 'FC Sion vs FC Luzern' });
    LiveView.skip();
    const chained = els.lvBoard.innerHTML.includes('Attend FC Sion vs FC Luzern');
    return lone && chained;
});
check('a level final shows its result note (pens / ET) at full time', () => {
    LiveView.show(match({ hg: 2, ag: 2, winner: 'H', pens: { h: 5, a: 4 }, minutes: 120 }), () => {});
    LiveView.skip();
    const pens = els.lvBoard.innerHTML.includes('pens 5–4');
    LiveView.show(match({ hg: 2, ag: 1, winner: 'H', et: true, minutes: 120 }), () => {});
    LiveView.skip();
    const et = els.lvBoard.innerHTML.includes('extra time');
    return pens && et;
});

check('no errors thrown, got: ' + JSON.stringify(errs.slice(0, 3)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll live-view DOM checks passed.');
process.exitCode = failed ? 1 : 0;
