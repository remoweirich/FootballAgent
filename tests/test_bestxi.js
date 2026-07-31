// Best XI (hall-of-fame line-up): formation integrity, position eligibility, and that picks /
// clears / formation changes mutate + persist the state (auto-save) correctly.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
let sheetHTML = '';
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => ({ innerHTML: '' }), createElement: () => ({ style: {}, appendChild() {} }), head: { appendChild() {} } },
    window: { addEventListener() {} },
    Router: { register() {}, sheet(h) { sheetHTML = h; }, closeSheet() {} },
};
sb.UI = { esc: s => String(s == null ? '' : s), flag: () => '', money: n => String(n) };
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-bestxi.js'), 'utf8'), sb, { filename: 'screen-bestxi.js' });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c, x) => { const v = typeof c === 'function' ? c() : c; console.log((v ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!v) failed = true; };

run(`Clubs.init(); GameState.startNewGame('Netherlands', 'XI FC');`);

// ---- formation integrity ----
const VALID = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const info = JSON.parse(run(`
    const out = {};
    for (const [k, f] of Object.entries(BestXI.FORMATIONS)) {
        out[k] = {
            n: f.slots.length,
            gk: f.slots.filter(s => s.pos.length === 1 && s.pos[0] === 'GK').length,
            badPos: f.slots.some(s => s.pos.some(p => !${JSON.stringify(VALID)}.includes(p))),
            slots: f.slots.map(s => ({ id: s.id, pos: s.pos })),
        };
    }
    out._bench = BestXI.BENCH.map(s => ({ id: s.id, pos: s.pos }));
    return JSON.stringify(out);
`));
check('all six formations exist', ['433', '343', '523', '4312', '442', '4231'].every(k => info[k]));
check('every formation has 11 slots incl. exactly one keeper', ['433', '343', '523', '4312', '442', '4231'].every(k => info[k].n === 11 && info[k].gk === 1));
check('no slot allows an invalid position', ['433', '343', '523', '4312', '442', '4231'].every(k => !info[k].badPos));
// spec spot-checks
check('4-3-3 central mids accept CDM/CM/CAM', info['433'].slots.filter(s => JSON.stringify(s.pos) === JSON.stringify(['CDM', 'CM', 'CAM'])).length === 3);
check('4-2-3-1 deep mids are CDM/CM, the AM is CAM/CM', () => {
    const dm = info['4231'].slots.filter(s => JSON.stringify(s.pos) === JSON.stringify(['CDM', 'CM']));
    const am = info['4231'].slots.find(s => s.id === 'am');
    return dm.length === 2 && am && JSON.stringify(am.pos) === JSON.stringify(['CAM', 'CM']);
});
check('3-4-3 wide slots accept a fullback OR a winger', () => {
    const wide = info['343'].slots.filter(s => s.pos.includes('LW') || s.pos.includes('RW')).filter(s => s.pos.includes('LB') || s.pos.includes('RB'));
    return wide.length === 2;
});
check('bench is 1 GK, 2 DEF, 2 MID, 2 FWD', () => {
    const b = info._bench;
    return b.length === 7 && b[0].pos.join() === 'GK'
        && b.filter(s => s.pos.join() === 'CB,LB,RB').length === 2
        && b.filter(s => s.pos.join() === 'CDM,CM,CAM').length === 2
        && b.filter(s => s.pos.join() === 'LW,RW,ST').length === 2;
});

// ---- eligibility + picking ----
run(`
    // three ex/current clients across positions; one archived (former), to prove "ever a client" counts
    const mk = (name, pos, ab, arch) => { const c = Clubs.allClubs[0]; const p = PlayerGen.makePlayer(c, { ability: ab, age: 24, position: pos }); p.name = name; p.everClient = true; p.agentId = arch ? null : 'me'; p.archived = !!arch; GameState.players.push(p); return p.id; };
    window.cmId = mk('Mid Maestro', 'CM', 80, false);
    window.camId = mk('Archived Ten', 'CAM', 78, true);
    window.stId = mk('Poacher Nine', 'ST', 82, false);
`);
run(`BestXI.selectFormation('433');`);
check('selecting a formation stores it', run(`return GameState.bestXI.formation;`) === '433');

// a central-mid slot should list the CM and the archived CAM (both fit CDM/CM/CAM), not the striker
run(`BestXI.openPicker('m2');`);
check('picker lists eligible clients incl. a former (archived) client', () => sheetHTML.includes('Mid Maestro') && sheetHTML.includes('Archived Ten'));
check('picker excludes a player who does not play that position', () => !sheetHTML.includes('Poacher Nine'));

run(`BestXI.pick('m2', window.cmId);`);
check('pick assigns the player to the slot', run(`return GameState.bestXI.picks.m2 === window.cmId;`) === true);

// once placed, he no longer appears as a choice for another mid slot (no duplicates)
run(`BestXI.openPicker('m1');`);
check('an already-placed player is not offered again', () => !sheetHTML.includes('Mid Maestro') && sheetHTML.includes('Archived Ten'));

// the striker slot only offers the striker
run(`BestXI.openPicker('st');`);
check('a striker slot offers the striker, not the midfielders', () => sheetHTML.includes('Poacher Nine') && !sheetHTML.includes('Mid Maestro'));

run(`BestXI.clear('m2');`);
check('clear removes the pick', run(`return GameState.bestXI.picks.m2 === undefined;`) === true);

// re-pick then change formation -> line-up clears
run(`BestXI.pick('m2', window.cmId); BestXI.selectFormation('442');`);
check('changing formation clears the whole line-up', () => run(`return GameState.bestXI.formation === '442' && Object.keys(GameState.bestXI.picks).length === 0;`) === true);

// persistence: the XI rides in the save snapshot
run(`BestXI.pick('st1', window.stId);`);
check('best XI is written into the save snapshot', () => {
    const snap = JSON.parse(run(`return JSON.stringify(GameState._snapshot().bestXI);`));
    return snap && snap.formation === '442' && snap.picks.st1;
});

// ---- item 3: tile shows PEAK ability in a club-coloured circle, name below ----
run(`
    const p = GameState.getPlayer(window.stId);
    p.peakAbility = 91; p.clubId = 'ajax';                    // ajax primary #D2122E, secondary #FFFFFF
    BestXI.selectFormation('433'); BestXI.pick('st', window.stId);
    window.__html = '';
    const el = { set innerHTML(v) { window.__html = v; }, get innerHTML() { return window.__html; } };
    BestXI.render(el);
`);
check('tile shows the peak ability (91), not just current', () => run(`return window.__html.includes('91');`) === true);
check('tile circle is filled with the club primary colour', () => run(`return window.__html.toLowerCase().includes('#d2122e');`) === true);
check('tile circle outline uses the club secondary colour', () => run(`return window.__html.toLowerCase().includes('border-color:#ffffff');`) === true);
check('the name appears below (bx-slotname) the circle', () => run(`return window.__html.includes('bx-slotname');`) === true);
check('_clubColors falls back to the current club when there are no senior apps', () => {
    const c = JSON.parse(run(`return JSON.stringify(BestXI._clubColors({ clubId: 'ajax', stats: {} }));`));
    return c.primary === '#D2122E' && c.secondary === '#FFFFFF';
});
check('_ink chooses dark text on a light fill, light on a dark fill', () => run(`return BestXI._ink('#FFFFFF') === '#0b140c' && BestXI._ink('#111111') === '#ffffff';`) === true);

console.log(failed ? '\n*** FAIL ***' : '\nAll Best XI checks passed.');
process.exit(failed ? 1 : 0);
