// Targeted test of the exact Italian promotion/relegation counts and who moves, by driving the
// playoff + play-out + apply functions directly on a fresh season (no need to sim 46 weeks).
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];
function makeFakeIDB() { return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } }; }
const sandbox = { console, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
vm.createContext(sandbox);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
const run = code => vm.runInContext('{' + code + '}', sandbox);
const runv = code => vm.runInContext('(function(){' + code + '})()', sandbox);
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

run(`Clubs.init(); GameState.startNewGame('Italy', 'Squadra Test');`);
// give every table a slight point spread so sortedTable produces a deterministic-ish order
run(`
    ['SerieA','SerieB','SerieC','SerieD'].forEach(div => {
        GameState.league.tables[div].forEach((r, i) => { r.Pts = (GameState.league.tables[div].length - i) * 3; r.GF = 40; r.GA = 20; r.P = 30; });
    });
    // run the Italian playoffs + play-outs + apply pro/rel directly
    League.playPlayoffsItaly();
    League.playItalianPlayouts();
    League.applyPromotionRelegationItaly();
`);
const pr = JSON.parse(runv(`return JSON.stringify(GameState.league.prorelIta)`));

check('Serie A: exactly 3 relegated', pr.aDown.length === 3);
check('Serie B: exactly 3 promoted (2 auto + 1 play-off)', pr.bUp.length === 3);
check('Serie B: exactly 4 relegated (3 direct + 1 play-out)', pr.bDown.length === 4);
check('Serie C: exactly 4 promoted (3 auto + 1 play-off)', pr.cUp.length === 4);
check('Serie C: exactly 4 relegated (3 direct + 1 play-out)', pr.cDown.length === 4);
check('Serie D: exactly 4 promoted (3 auto + 1 play-off)', pr.dUp.length === 4);

// balance: A relegations == B promotions, B relegations == C promotions, C relegations == D promotions
check('A down (3) == B up (3)', pr.aDown.length === pr.bUp.length);
check('B down (4) == C up (4)', pr.bDown.length === pr.cUp.length);
check('C down (4) == D up (4)', pr.cDown.length === pr.dUp.length);

// no club appears in two movement lists
const all = [...pr.aDown, ...pr.bUp, ...pr.bDown, ...pr.cUp, ...pr.cDown, ...pr.dUp];
check('no club appears in two movement lists', new Set(all).size === all.length);

// sizes still correct after applying
check('sizes exactly [20,20,24,20] after applying pro/rel', runv(`return JSON.stringify(['SerieA','SerieB','SerieC','SerieD'].map(d => Clubs.getClubsByDivision(d).length))`) === JSON.stringify([20, 20, 24, 20]));

// the play-out losers are among the relegated sets (sanity that play-out feeds relegation)
const poutB = runv(`return GameState.league.italianPlayout.SerieB.relegated`);
const poutC = runv(`return GameState.league.italianPlayout.SerieC.relegated`);
check('Serie B play-out loser is in bDown', pr.bDown.includes(poutB));
check('Serie C play-out loser is in cDown', pr.cDown.includes(poutC));

// play-off winners are among the promoted sets
const bpo = runv(`return GameState.league.playoffs.SerieB.winner`);
const cpo = runv(`return GameState.league.playoffs.SerieC.winner`);
const dpo = runv(`return GameState.league.playoffs.SerieD.winner`);
check('Serie B play-off winner is in bUp', pr.bUp.includes(bpo));
check('Serie C play-off winner is in cUp', pr.cUp.includes(cpo));
check('Serie D play-off winner is in dUp', pr.dUp.includes(dpo));

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Italy pro/rel-count checks passed.');
process.exitCode = failed ? 1 : 0;
