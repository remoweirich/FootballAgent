// Play-off final groundwork: agent name, two-legged decomposition, invite prose.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const errs = [];
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => null, querySelector: () => null },
    window: { addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false }) },
    location: { hash: '' },
};
sb.UI = { money: n => String(n), euro: n => '€' + n, clubName: id => String(id) };
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const LiveSim = vm.runInContext(fs.readFileSync(path.join(root, 'js', 'live-sim.js'), 'utf8') + ';LiveSim', sb, { filename: 'live-sim.js' });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { const v = typeof c === 'function' ? c() : c; console.log((v ? 'PASS' : 'FAIL') + '  ' + l); if (!v) failed = true; };

run(`Clubs.init();`);

// ---------------- agent name ----------------
check('agent name: startNewGame stores it, and agentName() returns it', run(`
  GameState.startNewGame("Switzerland","Nordvind Sports","Alex Mercer");
  return GameState.agency.agentName==="Alex Mercer" && GameState.agentName()==="Alex Mercer";
`));
check('agent name: agency name still stored independently', run(`
  return GameState.agency.name==="Nordvind Sports";
`));
check('agent name: blank/whitespace agent name falls back to empty, not the string given', run(`
  GameState.startNewGame("Switzerland","Nordvind Sports","   ");
  return GameState.agency.agentName==="" && GameState.agentName()==="";
`));
check('agent name: a save from before the field (no agentName) yields empty rather than undefined', run(`
  GameState.startNewGame("Switzerland","Nordvind Sports","Alex Mercer");
  delete GameState.agency.agentName;   // simulate an old save
  return GameState.agentName()==="";
`));
check('agent name: survives a save/load round-trip through the persisted agency object', run(`
  GameState.startNewGame("Switzerland","Nordvind Sports","Alex Mercer");
  const snap = JSON.parse(JSON.stringify(GameState.agency));   // this is what gets persisted
  GameState.agency = snap;
  return GameState.agentName()==="Alex Mercer";
`));

// ---------------- two-legged decomposition ----------------
check('two-legged: _twoLeggedTie composes leg1 + leg2 and is shaped as before', run(`
  GameState.startNewGame("Spain","T");
  const a = Clubs.allClubs.find(c=>c.country==="Spain");
  const b = Clubs.allClubs.find(c=>c.country==="Spain" && c.id!==a.id);
  const tie = League._twoLeggedTie(a.id, b.id, "PO");
  return tie.a===a.id && tie.b===b.id && tie.leg1 && tie.leg2 &&
         typeof tie.aggA==="number" && typeof tie.aggB==="number" &&
         (tie.winner===a.id || tie.winner===b.id);
`));
check('two-legged: the seam — leg1 then resolve — reproduces the aggregate rule exactly', run(`
  const a="A", b="B";
  const state = { a, b, comp:"PO", leg1:{ h:b, a:a, hg:1, ag:2 } };  // a won leg 1 away 2-1
  // leg 2 (home for a): a wins 1-0  -> agg a=3, b=1 -> a through
  let t = League._twoLeggedResolve(state, { hg:1, ag:0, winner:a });
  if (!(t.aggA===3 && t.aggB===1 && t.winner===a && !t.pens)) return false;
  // level aggregate -> penalties decide, and a definitive shootout score is recorded
  const st2 = { a, b, comp:"PO", leg1:{ h:b, a:a, hg:2, ag:1 } };   // a lost leg 1 away 1-2
  t = League._twoLeggedResolve(st2, { hg:1, ag:0, winner:a });      // a wins leg 2 1-0 -> agg 2-2
  // pens.a / pens.b are A's and B's shootout scores; the winner (whichever the flip picks) has more
  const winnerScored = t.winner===a ? t.pens.a : t.pens.b, loserScored = t.winner===a ? t.pens.b : t.pens.a;
  return t.aggA===2 && t.aggB===2 && t.pens && (t.winner===a||t.winner===b) &&
         t.pens.winner===t.winner && winnerScored>loserScored;
`));
check('two-legged: leg 1 always has a home for b, leg 2 a home for a (venue orientation preserved)', run(`
  const s = League._twoLeggedLeg1("A","B","PO");
  return s.leg1.h==="B" && s.leg1.a==="A" && s.comp==="PO";
`));
check('two-legged: a live-simmed leg 2 result folds in identically to a quick-simmed one', run(`
  const state = { a:"A", b:"B", comp:"PO", leg1:{ h:"B", a:"A", hg:0, ag:0 } };
  // pretend the live sim produced 2-1 to A in leg 2
  const t = League._twoLeggedResolve(state, { hg:2, ag:1, winner:"A" });
  return t.leg2.h==="A" && t.leg2.a==="B" && t.leg2.hg===2 && t.leg2.ag===1 &&
         t.aggA===2 && t.aggB===1 && t.winner==="A";
`));

// ---------------- invite prose (the 5 first-leg variants) ----------------
const inv = (scored, conceded, extra) => run(`
  return LiveSim.playoffFinalInvite(Object.assign({
    agentName:"Alex Mercer", client:"Luca Meier", teamName:"FC Basel", oppName:"FC Zürich",
    targetDivision:"the Super League", firstLeg:{ scored:${scored}, conceded:${conceded} }
  }, ${JSON.stringify(extra || {})}));
`);
check('invite: opens addressed to the agent by name and mentions the client', () => {
  const t = inv(3, 0); return t.startsWith('Dear Alex Mercer,') && t.includes('Luca Meier');
});
check('invite: won by 3+ -> the "comfortable" variant with the score', () => {
  const t = inv(4, 1); return /comfortable/.test(t) && t.includes('4:1') && !/nailbiter|draw|loss|didn't look good/.test(t);
});
check('invite: won by 1-2 -> the "nailbiter / narrow win" variant', () => {
  const t = inv(2, 1); return /nailbiter/.test(t) && /narrow 2:1 win/.test(t);
});
check('invite: a draw -> the "competitive draw" variant', () => {
  const t = inv(1, 1); return /draw/.test(t) && t.includes('1:1') && /put us over the line/.test(t);
});
check('invite: lost by 1-2 -> the "dig in" variant, names the opponent and target division', () => {
  const t = inv(1, 2); return /narrow 1:2 loss/.test(t) && t.includes('FC Zürich') && t.includes('the Super League');
});
check('invite: lost by 3+ -> the "remontada" variant', () => {
  const t = inv(0, 3); return /remontada/.test(t) && t.includes('0:3');
});
check('invite: the score is always the CLIENT team first (scored:conceded), win or lose', () => {
  return inv(3, 0).includes('3:0') && inv(0, 3).includes('0:3') && inv(2, 1).includes('2:1') && inv(1, 2).includes('1:2');
});
check('invite: an empty agent name falls back to a neutral salutation', () => {
  const t = inv(2, 0, { agentName: '' }); return t.startsWith('Dear Sir/Madam,');
});
check('invite: exact margin boundaries pick the right variant (2=win, 3=comfortable; -2=dig in, -3=remontada)', () => {
  return /nailbiter/.test(inv(2, 0)) && /comfortable/.test(inv(3, 0)) &&
         /dig in/.test(inv(0, 2)) && /remontada/.test(inv(0, 3));
});

// ---------------- setup screen wiring (start reads both fields) ----------------
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-setup.js'), 'utf8'), sb, { filename: 'screen-setup.js' });
check('setup: start() passes agency name AND agent name to startNewGame', run(`
  const fields = { setupName:{value:"  Nordvind Sports  "}, setupAgent:{value:"  Alex Mercer  "}, setupCountry:{value:"Switzerland"} };
  const _get = document.getElementById; document.getElementById = id => fields[id];
  let captured=null; const _sng = GameState.startNewGame;
  GameState.startNewGame = (c,n,a) => { captured=[c,n,a]; };
  const _main = typeof Main!=='undefined'?Main:undefined; Main = { afterLoad(){} };
  Setup.start();
  document.getElementById=_get; GameState.startNewGame=_sng; Main=_main;
  return captured && captured[0]==="Switzerland" && captured[1]==="Nordvind Sports" && captured[2]==="Alex Mercer";
`));
check('setup: start() is a no-op if the agent name is blank (mirrors the disabled button)', run(`
  const fields = { setupName:{value:"Nordvind Sports"}, setupAgent:{value:"   "}, setupCountry:{value:"Switzerland"} };
  const _get = document.getElementById; document.getElementById = id => fields[id];
  let called=false; const _sng = GameState.startNewGame; GameState.startNewGame = () => { called=true; };
  const _main = typeof Main!=='undefined'?Main:undefined; Main = { afterLoad(){} };
  Setup.start();
  document.getElementById=_get; GameState.startNewGame=_sng; Main=_main;
  return called===false;
`));

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll play-off checks passed.');
process.exitCode = failed ? 1 : 0;
