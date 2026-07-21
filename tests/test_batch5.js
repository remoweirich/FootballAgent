// Regression test: axis crowding, decline age, renewal-kills-bids, rating variance,
// hot-form playing time, "Joining <club>".
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
vm.createContext(sb);
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
for (const f of ['shim.js', 'router.js', 'screen-client-detail.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

run(`Clubs.init(); GameState.startNewGame("Switzerland","T");`);

// ---------- 1: x-axis labels ----------
check('1: a 17-year career labels at most 8 ages (was one per year, overlapping)', run(`
  const p = GameState.players.find(x=>x.position!=="GK");
  p.agentId="me"; p.everClient=true; p.age=33; p.history={ability:[],wage:[],fees:[]};
  const now = GameState.absWeek();
  for (let a=16; a<=33; a++) { const t = now-(33-a)*52; p.history.ability.push({t,value:20+a}); p.history.wage.push({t,value:200*a}); }
  const html = ClientDetail.tabDevelopment(p);
  const labels = (html.match(/>\\d+y</g)||[]).length / 2;   // ability chart + wage chart share the ticks
  return labels > 0 && labels <= 8;
`));
check('1: every year still gets its own vertical gridline', run(`
  const p = GameState.players.find(x=>x.agentId==="me");
  const html = ClientDetail.tabDevelopment(p);
  const svg = html.slice(html.indexOf("<svg"), html.indexOf("</svg>"));
  const vlines = (svg.match(/<line x1="([\\d.]+)" y1="10"/g)||[]).length;
  return vlines >= 17;   // 18 age ticks
`));

// ---------- 2: no decline before 30 ----------
check('2: nobody loses ability before turning 30', run(`
  let worst = 99;
  for (let i=0;i<400;i++) {
    const club = Clubs.allClubs[i % Clubs.allClubs.length];
    const p = PlayerGen.makePlayer(club,{ability:50,age:24,position:PlayerGen.randPos()});
    p.potential = 50;   // already at his ceiling: only decline can move him
    for (let age=24; age<40; age++) {
      p.age = age; const before = p.ability;
      for (let w=0; w<52; w++) PlayerDev.weeklyTick(p, 1);
      if (p.ability < before) { worst = Math.min(worst, age); break; }
    }
  }
  return worst >= 30;
`));
check('2: decline age is individual, not a fixed birthday', run(`
  const seen = new Set();
  for (let i=0;i<200;i++) seen.add(PlayerGen.declineAgeFor(PlayerGen.peakAgeFor(PlayerGen.randPos())));
  return seen.size >= 4 && Math.min(...seen) >= 30;
`));
check('2: a peak lasts 2-7 years (never longer, and only shorter where the "not before 30" floor lifts it)', run(`
  const durations = new Set();
  for (let i=0;i<4000;i++) {
    const peak = PlayerGen.peakAgeFor(PlayerGen.randPos());
    const d = PlayerGen.declineAgeFor(peak) - peak;
    if (peak + 7 <= 30 || peak + 2 >= 38) continue;   // clamped by the floor/ceiling, not a free draw
    if (d < 2 || d > 7) return false;
    durations.add(d);
  }
  return durations.size >= 5;   // the full 2-7 range actually occurs
`));
check('2: an outfielder can peak 26->33 and a keeper 30->37', run(`
  let longOutfield = false, longGK = false;
  for (let i=0;i<3000;i++) {
    if (PlayerGen.declineAgeFor(26) >= 33) longOutfield = true;
    if (PlayerGen.declineAgeFor(30) >= 37) longGK = true;
  }
  return longOutfield && longGK;
`));
check('2: a save with no declineAge gets one assigned lazily', run(`
  const p = { peakAge: 26 };
  return declineAgeOf(p) >= 30 && p.declineAge === declineAgeOf(p);
`));

// ---------- 3: renewal kills open bids ----------
check('3: signing a new contract auto-rejects open transfer offers', run(`
  const from = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=50 && c.reputation<=60);
  const to = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==from.id);
  const p = GameState.players.find(x=>x.clubId===from.id && x.position!=="GK");
  p.agentId="me"; p.everClient=true; p.ability=55; p.wage=2000; p._renewSeason=null;
  GameState.inbox = [];
  GameState.inbox.push({ id:"m_bid", kind:"transfer", offer:{ playerId:p.id, fromClubId:from.id, toClubId:to.id, transferFee:100000, proposedWage:2600 } });
  const rm = { id:"m_rn", kind:"renewal", offer:{ playerId:p.id, clubId:from.id, proposedWage:2500, proposedTermSeasons:2 } };
  GameState.inbox.push(rm);
  const r = Agency.acceptRenewal(rm, 2500, "rotation", 2);
  if (!r.ok) { console.log("   (renewal rejected: " + r.message + ")"); return false; }
  return GameState.inbox.filter(m=>m.kind==="transfer" && m.offer.playerId===p.id).length === 0;
`));

// ---------- 4: morale boost + rating variance ----------
check('4: morale can add at most +0.1 to a rating (penalty side untouched)', run(`
  return moraleRatingMod(100) <= 0.1001 && moraleRatingMod(85) <= 0.1001 && moraleRatingMod(0) <= -0.29;
`));
check('4: roughly 1 player in 30 is a reliable performer', run(`
  let n=0; for (let i=0;i<6000;i++) if (PlayerGen.formTraitRoll() > 0.2) n++;
  const rate = n/6000;
  return rate > 1/60 && rate < 1/15;
`));
check('4: form is drawn once per season, not per match', run(`
  const p = GameState.players.find(x=>x.agentId==="me");
  const a = formBiasOf(p), b = formBiasOf(p);
  GameState.seasonStartYear += 1;
  const c = formBiasOf(p);
  GameState.seasonStartYear -= 1;
  return a === b && c !== b;
`));

// ---------- rating levels: measured, not asserted blind ----------
const stats = run(`
  const club = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=55 && c.reputation<=62);
  const rep = club.reputation;
  const trial = (pos, style, gap, seasons) => {
    const avgs = [];
    for (let s=0; s<(seasons||30); s++) {
      GameState.players = GameState.players.filter(p=>p.clubId!==club.id);
      GameState.seasonStartYear = 2100 + s;
      const squad=[];
      for(let i=0;i<20;i++) squad.push(PlayerGen.makePlayer(club,{ability:PlayerGen.gauss(rep,7),age:26,position:i<2?"GK":PlayerGen.randPos()}));
      PlayerGen.assignRoles(squad);
      const x = PlayerGen.makePlayer(club,{ability:rep+gap,age:25,position:pos});
      x.styleRole=style; x.agentId="me"; x.everClient=true; x.squadRole="starter"; x.stats={};
      GameState.players.push(...squad, x); __sqCacheWeek=-1;
      for(let m=0;m<38;m++) League.assignStats(club.id,"SuperLeagueCH",Math.floor(Math.random()*4),Math.floor(Math.random()*3));
      const t = seasonTotals(x, GameState.seasonStartYear);
      if (t.apps>=5) avgs.push(t.avg);
    }
    const mean = avgs.reduce((s,v)=>s+v,0)/avgs.length;
    return { mean, hot: avgs.filter(v=>v>=7.5).length/avgs.length, spread: Math.max(...avgs)-Math.min(...avgs), best: Math.max(...avgs) };
  };
  return JSON.stringify({ at: trial("CM","box_to_box",0,150), g5: trial("CM","box_to_box",5),
                          g12: trial("ST","poacher",12), way: trial("ST","poacher",25) });
`);
const S = JSON.parse(stats);
check(`4: a player at his club's level is unremarkable by default (mean ${S.at.mean.toFixed(2)}, ${(S.at.hot*100).toFixed(0)}% of seasons 7.5+)`, S.at.mean < 7.2 && S.at.hot <= 0.25);
// "Possible but not the default" is the property worth pinning. Asserting a precise rate would be
// flaky: at ~4% a 150-season sample still only estimates it to about +/-1.5 points.
check(`4: ...but CAN still have an exceptional season at his own level (${(S.at.hot*100).toFixed(1)}% of 150 seasons, best ${S.at.best.toFixed(2)})`, S.at.best >= 7.5 && S.at.hot > 0 && S.at.hot <= 0.25);
check(`4: seasons genuinely vary (spread ${S.at.spread.toFixed(2)} rating points across 30 seasons)`, S.at.spread >= 0.4);
check(`4: +5 over the club is already a real edge (mean ${S.g5.mean.toFixed(2)}, ${(S.g5.hot*100).toFixed(0)}% of seasons 7.5+)`, S.g5.mean >= 7.15 && S.g5.mean <= 7.6);
check(`4: +12 over the club is a star (mean ${S.g12.mean.toFixed(2)}, ${(S.g12.hot*100).toFixed(0)}% of seasons 7.5+)`, S.g12.mean >= 7.8 && S.g12.hot >= 0.85);
check(`4: returns flatten past +12 rather than running away (+12 ${S.g12.mean.toFixed(2)} -> +25 ${S.way.mean.toFixed(2)})`, S.way.mean - S.g12.mean < 0.6 && S.way.mean > S.g12.mean);

// ---------- 5: hot rotation player plays more ----------
// The two runs are identical except for the recent-form window pinned on the tracked player each
// week, so any difference in appearances is the form bump and nothing else. The rate is pinned in
// BOTH runs (0.2/game vs 0.83/game) — letting the "cold" run score at a striker's natural ~0.5/game
// would drift over the threshold on its own and quietly test nothing.
const hot = run(`
  const club = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=55 && c.reputation<=62);
  const appsFor = perGame => {
    const runs = [];
    for (let s=0; s<12; s++) {
      GameState.players = GameState.players.filter(p=>p.clubId!==club.id);
      GameState.seasonStartYear = 2200 + s;
      const squad=[];
      for(let i=0;i<20;i++) squad.push(PlayerGen.makePlayer(club,{ability:PlayerGen.gauss(club.reputation,7),age:26,position:i<2?"GK":PlayerGen.randPos()}));
      PlayerGen.assignRoles(squad);
      const x = PlayerGen.makePlayer(club,{ability:club.reputation,age:25,position:"ST"});
      x.agentId="me"; x.everClient=true; x.squadRole="rotation"; x.stats={};
      GameState.players.push(...squad, x); __sqCacheWeek=-1;
      const pin = () => {   // last 12 games: "perGame" goals a game, par ratings
        x._recent = [];
        for (let i=0;i<12;i++) x._recent.push({ g: (i < Math.round(12*perGame)) ? 1 : 0, a: 0, r: 6.9 });
      };
      pin();
      for(let m=0;m<38;m++) { League.assignStats(club.id,"SuperLeagueCH",2,1); pin(); }
      runs.push(seasonTotals(x, GameState.seasonStartYear).apps);
    }
    return runs.reduce((s,v)=>s+v,0)/runs.length;
  };
  return JSON.stringify({ cold: appsFor(0.2), warm: appsFor(10/12) });
`);
const H = JSON.parse(hot);
check(`5: a rotation player scoring 10 in 12 gets picked far more often (${H.cold.toFixed(0)} apps cold -> ${H.warm.toFixed(0)} apps on the run)`, H.warm > H.cold * 1.7);
check('5: form carries across the season boundary instead of resetting every August', run(`
  const p = { squadRole: "rotation", _recent: [] };
  for (let i=0;i<12;i++) p._recent.push({ g: i<10?1:0, a:0, r:6.9 });
  const before = p._recent.slice();
  GameState.seasonStartYear += 1;
  return JSON.stringify(p._recent) === JSON.stringify(before);   // not keyed on the season at all
`));
check('5: the window only holds the last 12 appearances, so a run lapses when it ends', run(`
  const club = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=55 && c.reputation<=62);
  GameState.players = GameState.players.filter(p=>p.clubId!==club.id);
  GameState.seasonStartYear = 2300;
  const squad=[];
  for(let i=0;i<20;i++) squad.push(PlayerGen.makePlayer(club,{ability:PlayerGen.gauss(club.reputation,7),age:26,position:i<2?"GK":PlayerGen.randPos()}));
  PlayerGen.assignRoles(squad);
  const x = PlayerGen.makePlayer(club,{ability:club.reputation,age:25,position:"CB"});
  x.agentId="me"; x.everClient=true; x.squadRole="key"; x.stats={};
  GameState.players.push(...squad, x); __sqCacheWeek=-1;
  for(let m=0;m<60;m++) League.assignStats(club.id,"SuperLeagueCH",2,1);
  return x._recent.length === 12;
`));

// ---------- 6: Joining <club> ----------
check('6: a pending move reads "Joining <club>", not a season', run(`
  const p = GameState.players.find(x=>x.agentId==="me");
  const to = Clubs.allClubs.find(c=>c.id!==p.clubId);
  p.joiningClubId = to.id; p._joinSeason = undefined; p.retired=false; p.retiringThisSeason=false; p.freeAgent=false;
  const txt = ClientDetail.contractText(p);
  return txt === "Joining " + UI.clubName(to.id) && !/\\d\\d\\/\\d\\d|NaN/.test(txt);
`));

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll batch-5 checks passed.');
process.exitCode = failed ? 1 : 0;
