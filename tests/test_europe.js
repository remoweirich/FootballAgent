// Europe engine test: builds an edition, drives it week 1..48, validates 36/comp, no dup clubs,
// pot <=3/assoc, 8 fixtures 4h/4a 2-per-pot, no same-assoc opponents, plus qualifying/KO integrity.
// Runs multiple editions to shake out draw failures + pooled cup/league clashes.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = require('path').join(__dirname, '..', 'js') + '/';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = { console: { log() { }, warn() { }, error: (...a) => errors.push(a.map(x => x && x.stack ? x.stack : (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')) }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Belgium','Test FC');`);

// ---- data sanity ----
check('EUROPE_DATA present, 46 pools', runv(`return Object.keys(EUROPE_DATA.pools).length===46`));
check('EUROPE_VIRTUAL_MAP registered in findVirtualClub', runv(`const id=EUROPE_DATA.pools['Türkiye'].clubs[0].id; return !!findVirtualClub(id) && League.teamName(id)!==id;`));
check('virtual club strength uses reputation', runv(`const id=EUROPE_DATA.pools['Türkiye'].clubs.find(c=>c.name.includes('Galatasaray')).id; return Math.abs(League.clubStrength(id)-81)<1;`));

// Liechtenstein's cup winner is a REAL club (Vaduz / Eschen-Mauren), not a virtual placeholder
check('Vaduz is a real club, not virtual', runv(`
  return Clubs.getClubById('Vaduz') && findVirtualClub('Vaduz')===null && typeof EUROPE_VIRTUAL_MAP['Vaduz']==='undefined'
    && League.teamName('Vaduz')===Clubs.getClubById('Vaduz').name && Europe.repOf('Vaduz')===Clubs.getClubById('Vaduz').reputation;
`));
check('Liechtenstein pool references real ids and is flagged real', runv(`
  const cl=EUROPE_DATA.pools['Liechtenstein'].clubs;
  return cl.length===2 && cl.every(c=>c.real===true) && cl.some(c=>c.id==='Vaduz') && cl.some(c=>c.id==='Eschen/Mauren');
`));
check("Liechtenstein's UEL cup entrant resolves to a real Liechtenstein club", runv(`
  // build an edition and confirm the Liechtenstein UEL R1 entrant is Vaduz or Eschen-Mauren (real ids)
  const snap = Europe.syntheticStandings(); const ed = Europe.buildEurope(snap.standings, snap.cups, 2050);
  const r1 = ed.qpools.UEL[1].unseeded;
  return r1.includes('Vaduz') || r1.includes('Eschen/Mauren');
`));
// UECL qualifying starts in week 3, not week 1
check('UECL qualifying first round is week 3 (not 1)', runv(`return EUROPE_DATA.qualifying.UECL.rounds[0].week===3 && EUROPE_DATA.qualifying.UEL.rounds[0].week===2 && EUROPE_DATA.qualifying.UCL.rounds[0].week===1;`));

// ---- run N independent editions, validate each ----
const N = 25;
let anyProblem = null, schedFails = 0, uclWinners = {}, assocRelax = 0, mdImperfect = 0;
for (let s = 0; s < N; s++) {
    const rep = JSON.parse(runv(`
    const snap = Europe.syntheticStandings();
    const ed = Europe.buildEurope(snap.standings, snap.cups, 2025+${s});
    // drive the whole calendar
    for (let w=1; w<=48; w++) Europe.step(w);
    const problems = Europe.validate(ed);
    const sizes = Europe.COMPS.map(k=>ed.comps[k].lpEntrants.length);
    const winners = {}; Europe.COMPS.forEach(k=> winners[k]= ed.comps[k].ko.winner ? League.teamName(ed.comps[k].ko.winner):null);
    const qualRounds = {}; Europe.COMPS.forEach(k=> qualRounds[k]= ed.comps[k].qual.rounds.map(r=>r.ties.length));
    const lpMatches = {}; Europe.COMPS.forEach(k=> lpMatches[k]= (ed.comps[k].schedule||[]).reduce((a,md)=>a+md.length,0));
    // matchday perfection: every matchday has 18 games and each of the 36 clubs plays exactly once
    let mdPerfect = true;
    Europe.COMPS.forEach(k=>{ const c=ed.comps[k]; if(!c.schedule){mdPerfect=false;return;}
      c.schedule.forEach(md=>{ if(md.length!==18) mdPerfect=false; const seen={}; md.forEach(([h,a])=>{seen[h]=(seen[h]||0)+1;seen[a]=(seen[a]||0)+1;}); if(Object.keys(seen).length!==36||Object.values(seen).some(v=>v!==1)) mdPerfect=false; }); });
    return JSON.stringify({problems, sizes, winners, qualRounds, lpMatches, mdPerfect, warnings: ed.warnings});
  `));
    if (rep.problems.length && !anyProblem) anyProblem = rep.problems;
    if (rep.sizes.join(',') !== '36,36,36') { anyProblem = anyProblem || ['sizes ' + rep.sizes]; }
    for (const k of ['UCL', 'UEL', 'UECL']) { if (rep.lpMatches[k] !== 144) anyProblem = anyProblem || [k + ' lpMatches ' + rep.lpMatches[k]]; }
    if (!rep.mdPerfect) mdImperfect++;
    for (const w of rep.warnings) { if (/schedulable/.test(w)) schedFails++; if (/same-association/.test(w)) assocRelax++; }
    const uw = rep.winners.UCL; if (uw) uclWinners[uw] = (uclWinners[uw] || 0) + 1;
    if (s === N - 1) sb.__last = rep;
}
check(`all ${N} editions valid (36/comp, no dup, pots, fixtures). first problem: ` + JSON.stringify(anyProblem), anyProblem === null);
check('every matchday is a perfect round (18 games, each club exactly once) in every edition (imperfect: ' + mdImperfect + ')', mdImperfect === 0);
check('no schedule failures across editions (had ' + schedFails + ')', schedFails === 0);
console.log('   (same-association rule relaxed in ' + assocRelax + ' of ' + (N * 3) + ' league-phase draws)');
check('every edition: 144 league matches per competition', true /* asserted via anyProblem */);

// ---- inspect the last edition in detail ----
const D = sb.__last;
check('last edition sizes 36/36/36: ' + D.sizes.join('/'), D.sizes.join(',') === '36,36,36');
check('UCL qualifying rounds tie-counts [9,9,9,9,9]: ' + JSON.stringify(D.qualRounds.UCL), JSON.stringify(D.qualRounds.UCL) === '[9,9,9,9,9]');
check('UEL qualifying rounds tie-counts [11,11,11,11,11]: ' + JSON.stringify(D.qualRounds.UEL), JSON.stringify(D.qualRounds.UEL) === '[11,11,11,11,11]');
check('UECL qualifying rounds tie-counts [16,16,16,16]: ' + JSON.stringify(D.qualRounds.UECL), JSON.stringify(D.qualRounds.UECL) === '[16,16,16,16]');
check('all three produced a champion: ' + JSON.stringify(D.winners), Object.values(D.winners).every(Boolean));

// ---- knockout bracket integrity on a fresh edition ----
const ko = JSON.parse(runv(`
  const snap=Europe.syntheticStandings(); const ed=Europe.buildEurope(snap.standings,snap.cups,2099);
  for(let w=1;w<=48;w++) Europe.step(w);
  const c=ed.comps.UCL;
  return JSON.stringify({ po:c.ko.po.ties.length, r16:c.ko.r16.ties.length, qf:c.ko.qf.ties.length, sf:c.ko.sf.ties.length, hasFinal: !!c.ko.final, top8: c.ranked.slice(0,8).map(League.teamName) });
`));
check('KO shape PO=8,R16=8,QF=4,SF=2,final: ' + JSON.stringify(ko), ko.po === 8 && ko.r16 === 8 && ko.qf === 4 && ko.sf === 2 && ko.hasFinal);

// knockout play-off pairings: 9v24, 10v23, ... 16v17 (higher seed = ranked[8+i], hosts leg 2)
check('play-off ladder is 9v24,10v23,...,16v17', runv(`
  const snap=Europe.syntheticStandings(); const ed=Europe.buildEurope(snap.standings,snap.cups,4100);
  for(let w=1;w<=35;w++) Europe.step(w); // through the play-off (leg 2 in wk35)
  const c=ed.comps.UCL, r=c.ranked, po=c.ko.po;
  let ok = po.ties.length===8;
  for(let i=0;i<8;i++){ const t=po.ties[i]; if(t.a!==r[8+i] || t.b!==r[23-i]) ok=false; }
  return ok;
`));
// Round of 16: the 8 seeds are the top 8; their opponents are exactly the 8 play-off winners (random draw)
check('R16 pairs each top-8 seed with a play-off winner', runv(`
  const snap=Europe.syntheticStandings(); const ed=Europe.buildEurope(snap.standings,snap.cups,4200);
  for(let w=1;w<=38;w++) Europe.step(w); // through R16 leg 2 (wk38)
  const c=ed.comps.UCL; const top8=new Set(c.ranked.slice(0,8)); const pw=new Set(c.ko.po.winners);
  // in every R16 tie, one side is a top-8 seed (a=higher, hosts leg2) and the other is a play-off winner
  return c.ko.r16.ties.length===8 && c.ko.r16.ties.every(t=> top8.has(t.a) && pw.has(t.b));
`));

// ---- cup-overflow cascade (implemented) ----
check('cascade: champion also wins cup -> fields top-n, UEL gains a place', runv(`
  // England: slots U*5, UEL, UELcup, UECL (n=8). champion (idx0) wins cup -> qualified.
  const order = Array.from({length:20},(_,i)=>'club'+i);
  const t = Europe.highlightMap('England', order, 'club0');
  // expect club0 CHAMP, club1..4 U, club5&6 both Europa League (UEL/UELcup), club7 UECL
  const uel = x => x==='UEL' || x==='UELcup';
  return t['club0']==='CHAMP' && t['club4']==='U' && uel(t['club5']) && uel(t['club6']) && t['club7']==='UECL' && t['club8']===undefined;
`));
check('cascade: lower cup winner (10th) takes UEL cup slot, 7th=UECL', runv(`
  const order = Array.from({length:20},(_,i)=>'club'+i);
  const t = Europe.highlightMap('England', order, 'club9'); // 10th place wins cup
  return t['club0']==='CHAMP' && t['club5']==='UEL' && t['club6']==='UECL' && t['club9']==='UELcup' && t['club7']===undefined;
`));
check('Belgium slots: champion UCL, 2nd UCLq, cup UELcup, 3rd UELq, 4th UECL', runv(`
  const order=Array.from({length:18},(_,i)=>'b'+i);
  const t=Europe.highlightMap('Belgium', order, 'bX'); // foreign/lower cup winner
  return t['b0']==='CHAMP' && t['b1']==='UCLq' && t['bX']==='UELcup' && t['b2']==='UELq' && t['b3']==='UECL';
`));

// the actual in-game Liechtensteiner Cup winner (not a draw) becomes the Liechtenstein UEL entrant
check('real Liechtensteiner Cup winner flows through to the Liechtenstein UEL entrant', runv(`
  Clubs.init(); GameState.startNewGame('Switzerland','X');
  GameState.league.lichcup = { winner: 'Vaduz' };
  const snap = Europe.captureStandings();
  if (snap.cups.Liechtenstein !== 'Vaduz') return false;
  const ed = Europe.buildEurope(snap.standings, snap.cups, 2222);
  return ed.sim.Liechtenstein.cup === 'Vaduz' && ed.qpools.UEL[1].unseeded.includes('Vaduz');
`));

check('no engine errors thrown, got: ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
console.log('\nUCL winners distribution (top): ' + Object.entries(uclWinners).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0] + ':' + e[1]).join(', '));
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Europe engine checks passed.');
process.exitCode = failed ? 1 : 0;
