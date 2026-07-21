// Verifies (2) knockout ties are split into two legs and (5) European trophies + distinct icons +
// per-competition player stats. Drives a real season to the rollover so finishSeason() awards them.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = require('path').join(__dirname, '..', 'js') + '/';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = { console: { log() { }, warn() { }, error: (...a) => errors.push(a.map(x => x && x.stack ? x.stack : String(x)).join(' ')) }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => String(n) } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(base + f, 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('England','Trophy FC');`);
// season 1 has no Europe; drive to the first rollover so season 2's Europe (with real direct entrants) exists
runv(`for(let i=0;i<60;i++){ const r=Sim.advanceWeek(); if(r.rolledSeason) break; }`);
// plant one of the agent's clients at a real UCL league-phase entrant so the stats/trophy pipeline
// is actually exercised (assignStats only tracks clubs hosting a tracked player, exactly like domestic)
const planted = runv(`
  const ucl = GameState.league.europe.comps.UCL.lpEntrants.filter(id=>Clubs.getClubById(id));
  const club = ucl[0];
  const p = GameState.players.find(x=>!x.archived && x.position!=='GK') || GameState.players[0];
  p.agentId='me'; p.everClient=true; p.clubId = club; p.onLoanAt=null; p.injury=null; p.archived=false; p.squadRole='key'; p.freeAgent=false;
  if(!p.trophies) p.trophies=[]; if(!p.stats) p.stats={};
  return JSON.stringify({ club, pid: p.id, pname: p.name });
`);
const PL = JSON.parse(planted);
// drive season 2 to completion (its Europe edition is snapshotted at the next rollover)
runv(`for(let i=0;i<60;i++){ const r=Sim.advanceWeek(); if(r.rolledSeason) break; }`);
const year1 = runv(`return GameState.lastSeasonReport.europe.year`);

// (2) two-leg knockout ties
check('every knockout tie has both legs (leg1 + leg2)', runv(`
  const ed=GameState.lastSeasonReport.europe;
  let ok=true, seen=0;
  Europe.COMPS.forEach(k=>{ const ko=ed.comps[k].ko; ['po','r16','qf','sf'].forEach(rk=>{ const r=ko[rk]; if(r) r.ties.forEach(t=>{ seen++; if(!t.leg1||!t.leg2||!t.winner) ok=false; }); }); });
  return ok && seen>0;
`));
check('final is a single match with a winner', runv(`
  const ed=GameState.lastSeasonReport.europe; return Europe.COMPS.every(k=> ed.comps[k].ko.final && ed.comps[k].ko.final.winner);
`));
check('leg1 hosted by lower seed, leg2 by higher seed (aggregate consistent)', runv(`
  const ed=GameState.lastSeasonReport.europe; const t=ed.comps.UCL.ko.po.ties[0];
  // a = higher seed; leg1 at b (lower), leg2 at a (higher); aggA = leg1.ag + leg2.hg
  return t.leg1.h===t.b && t.leg2.h===t.a && t.aggA===(t.leg1.ag+t.leg2.hg) && t.aggB===(t.leg1.hg+t.leg2.ag);
`));

// (5) trophies awarded to the winning clubs (clubHistory) for real clubs
check('UCL/UEL/UECL winners recorded in clubHistory (for real winning clubs)', runv(`
  const ed=GameState.lastSeasonReport.europe; const year=ed.year;
  let checked=0, ok=true;
  Europe.COMPS.forEach(k=>{
    const w = ed.comps[k].ko.winner;
    if (w && Clubs.getClubById(w)) { // real club
      checked++;
      const hist=(GameState.clubHistory[w]||[]).find(h=>h.year===year && (h.trophies||[]).includes(k));
      if(!hist) ok=false;
    }
  });
  return checked>0 && ok;
`));
// the planted client accrued UCL apps (per-competition stats bucketed by compId, like domestic)
check(`planted client ${PL.pname} accrued UCL apps at his club`, runv(`
  const p=GameState.getPlayer(${JSON.stringify(PL.pid)}); const s=p.stats&&p.stats[${year1}];
  if(!s) return false;
  return Object.values(s).some(st=> st.clubId===${JSON.stringify(PL.club)} && st.comps.UCL && st.comps.UCL.apps>0);
`));
// awardTrophy attributes a European trophy to players with stats at the winning club (unit check on the planted club)
check('awardTrophy gives the planted club UCL trophy to its tracked players', runv(`
  const p=GameState.getPlayer(${JSON.stringify(PL.pid)});
  const before=(p.trophies||[]).length;
  League.awardTrophy(${JSON.stringify(PL.club)}, 'UCL', ${year1}, []);
  return (p.trophies||[]).some(t=>t.year===${year1} && t.compId==='UCL' && t.clubId===${JSON.stringify(PL.club)});
`));

// distinct trophy shapes
check('europeTrophyIcon returns non-empty distinct SVGs for UCL/UEL/UECL', runv(`
  const a=europeTrophyIcon('UCL'), b=europeTrophyIcon('UEL'), c=europeTrophyIcon('UECL');
  return a && b && c && a!==b && b!==c && a!==c && a.startsWith('<svg') && europeTrophyIcon('FACUP')==='';
`));

check('no engine errors, got: ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Europe trophy/two-leg checks passed.');
process.exitCode = failed ? 1 : 0;
