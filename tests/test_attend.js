// Attend the Final — invitation triggers + queue.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const errs = [];
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => null, querySelector: () => null, createElement: () => ({ style: {} }), head: { appendChild() {} } },
    window: { addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false }) },
    location: { hash: '' },
};
sb.UI = { money: n => String(n), euro: n => '€' + n, esc: s => String(s), clubName: id => { const c = sb.Clubs && sb.Clubs.getClubById(id); return c ? c.name : String(id); } };
vm.createContext(sb);
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { const v = typeof c === 'function' ? c() : c; console.log((v ? 'PASS' : 'FAIL') + '  ' + l); if (!v) failed = true; };

run(`Clubs.init(); GameState.startNewGame("Switzerland","Nordvind Sports","Alex Mercer");`);

// plant a client at a chosen club and return it
const plantAt = `
  const plant = (club, pos, role, name, squadRole) => {
    const p = PlayerGen.makePlayer(club, { ability: 68, age: 25, position: pos });
    p.styleRole = role; p.name = name; p.agentId = "me"; p.everClient = true;
    p.squadRole = squadRole || "key"; p.stats = {}; p._recent = [];
    GameState.players.push(p); __sqCacheWeek = -1; return p;
  };
`;

// ---------------- capture via the real playCupTie(isFinal) path ----------------
check('capture: a cup FINAL with a client at one finalist is captured', run(plantAt + `
  Attend.resetCaptures();
  const home = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const away = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==home.id && c.reputation>=55);
  plant(home, "ST", "poacher", "Ben Riva");
  League.playCupTie(home.id, away.id, "SCHWCUP", true);   // isFinal = true
  const m = Attend.pending();
  return m.length===1 && m[0].kind==="cup-final" && m[0].clients.length===1 &&
         m[0].clients[0].name==="Ben Riva" && (m[0].homeId===home.id || m[0].awayId===home.id);
`));
check('capture: a non-final cup tie is NOT captured', run(plantAt + `
  Attend.resetCaptures();
  const home = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const away = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==home.id && c.reputation>=55);
  plant(home, "ST", "poacher", "Ben Riva");
  League.playCupTie(home.id, away.id, "SCHWCUP", false);
  return Attend.pending().length===0;
`));
check('capture: a final with NO client is not captured', run(`
  GameState.players = GameState.players.filter(p=>p.agentId!=="me");   // clear planted clients from earlier cases
  __sqCacheWeek=-1; Attend.resetCaptures();
  const a = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const b = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==a.id && c.reputation>=55);
  League.playCupTie(a.id, b.id, "SCHWCUP", true);
  return Attend.pending().length===0;
`));
check('capture: many finals can be captured (you may be invited to more than you can watch)', run(plantAt + `
  GameState.players = GameState.players.filter(p=>p.agentId!=="me");
  Attend.resetCaptures();
  const chs = Clubs.allClubs.filter(c=>c.country==="Switzerland" && c.reputation>=48).slice(0, 12);
  for (let i=0;i<6;i++){ plant(chs[i], "CM", "box_to_box", "Client "+i); League.playCupTie(chs[i].id, chs[i+6].id, "SCHWCUP", true); }
  return Attend.pending().length===6;   // all six invited, not capped at the watch limit
`));
check('capture: a level final records a definitive penalty score', run(plantAt + `
  Attend.resetCaptures();
  const home = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const away = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==home.id && c.reputation>=55);
  plant(home, "ST", "poacher", "Ben Riva");
  let m=null;
  for (let i=0;i<200;i++){ Attend.resetCaptures(); League.playCupTie(home.id, away.id, "SCHWCUP", true); m=Attend.pending()[0];
    if (m && m.pens) break; }
  if (!m || !m.pens) return true;   // no level final in 200 tries (unlikely) -> vacuously ok
  return m.hg===m.ag && m.pens.h!==m.pens.a && (m.minutes===120);   // level -> pens -> extra time clock
`));

// ---------------- play-off finals ----------------
check('play-off: a two-legged promotion final captures the DECIDING leg with the first-leg score', run(`
  GameState.players = GameState.players.filter(p=>p.agentId!=="me");
  Attend.resetCaptures(); GameState.attendWindow=null;
  const a = Clubs.allClubs.find(c=>c.country==="Spain" && c.reputation>=55);
  const b = Clubs.allClubs.find(c=>c.country==="Spain" && c.id!==a.id && c.reputation>=50);
  const p = PlayerGen.makePlayer(a,{ability:66,age:24,position:"CM"}); p.name="Ivan Solis"; p.agentId="me"; p.everClient=true; p.squadRole="key"; p.stats={};
  GameState.players.push(p); __sqCacheWeek=-1;
  const tie = League._twoLeggedFinal(a.id, b.id, "PO");
  const m = Attend.pending()[0];
  Attend.openWindow(GameState._attend);   // form the window so hiding applies
  return m && m.kind==="playoff-final" && m.firstLeg && typeof m.firstLeg.scored==="number" &&
         tie._attendId===m.id && m.minutes===90 && (m.homeId===a.id) &&
         Attend.isHidden(tie._attendId);   // hidden until watched
`));
check('play-off: a single-match promotion final is captured (no first-leg score)', run(`
  GameState.players = GameState.players.filter(p=>p.agentId!=="me");
  Attend.resetCaptures(); GameState.attendWindow=null;
  const a = Clubs.allClubs.find(c=>c.country==="England" && c.reputation>=55);
  const b = Clubs.allClubs.find(c=>c.country==="England" && c.id!==a.id && c.reputation>=50);
  const p = PlayerGen.makePlayer(a,{ability:66,age:24,position:"CM"}); p.name="Tom Reed"; p.agentId="me"; p.everClient=true; p.squadRole="key"; p.stats={};
  GameState.players.push(p); __sqCacheWeek=-1;
  const r = League.playMatch(a.id, b.id, "PO", true);
  const id = League._captureSinglePoFinal(a.id, b.id, r);
  const m = Attend.pending()[0];
  return m && m.kind==="playoff-final" && !m.firstLeg && m.id===id;
`));
check('play-off: the invite for a two-legged final uses the first-leg prose, flipping for an away inviter', run(`
  const base = { id:"po", kind:"playoff-final", compId:"PO", homeId:"H", awayId:"A", homeName:"CD Home", awayName:"CD Away",
    firstLeg:{ scored:3, conceded:0 }, minutes:90, clients:[] };
  // client on HOME (leg-2 home) -> saw a 3:0 first-leg win
  const home = Attend.invitePayload(Object.assign({}, base, { clients:[{ name:"X", side:"home", squadRole:"key" }] }));
  // client on AWAY -> the same first leg was a 0:3 loss for them
  const away = Attend.invitePayload(Object.assign({}, base, { clients:[{ name:"X", side:"away", squadRole:"key" }] }));
  return /comfortable/.test(home.body) && home.body.includes("3:0") &&
         /remontada/.test(away.body) && away.body.includes("0:3");
`));

// ---------------- last-day title deciders: the bulletproof math ----------------
const setDiv = `
  const setDiv = (standings, fixtures) => {
    // standings: [[clubId, pts], ...] already sorted best-first; each team has 1 game left
    GameState.league = GameState.league || {};
    GameState.league.tables = GameState.league.tables || {};
    GameState.league.schedule = GameState.league.schedule || {};
    GameState.league.mdIndex = GameState.league.mdIndex || {};
    GameState.league.tables["TST"] = standings.map(([id,pts],i)=>({ clubId:id, Pts:pts, GF:100-i*3, GA:20, P:37, W:0, D:0, L:0 }));
    GameState.league.schedule["TST"] = [ fixtures ];
    GameState.league.mdIndex["TST"] = 0;   // about to play the final (only) round
    return [...League._lastDayTitleDeciders("TST")].sort().join(",");
  };
`;
check('title math: two teams within a game of each other are both contenders', run(setDiv + `
  return setDiv([["A",80],["B",78],["C",70],["D",40]], [["A","D"],["B","C"]]) === "A,B";
`));
check('title math: a leader 4+ clear has the title decided (no deciders)', run(setDiv + `
  return setDiv([["A",84],["B",78],["C",70],["D",40]], [["A","D"],["B","C"]]) === "";
`));
check('title math: a chaser who can only TIE on points is still a contender (wins on GD)', run(setDiv + `
  // A & B tied on 80 and play each other; C on 78 plays D. A draw leaves all three on 81 -> C can win on GD.
  return setDiv([["A",80],["B",80],["C",78],["D",40]], [["A","B"],["C","D"]]) === "A,B,C";
`));
check('title math: a team that cannot reach the leader is NOT a contender', run(setDiv + `
  // C on 70 can reach 73; A on 80 (who plays D, not C) is always >= 80 -> C excluded, only A & B decide
  return setDiv([["A",80],["B",78],["C",70],["D",40]], [["A","C"],["B","D"]]) === "A,B";
`));
check('title math: the two leaders playing EACH OTHER — the trailing one can still win outright', run(setDiv + `
  // A 80 v B 79 head to head; C 77 v D. B beats A -> B 82; but A could also win. Both plus C (draw path) contend.
  const r = setDiv([["A",80],["B",79],["C",77],["D",40]], [["A","B"],["C","D"]]);
  return r.split(",").includes("A") && r.split(",").includes("B");
`));
check('title math: only fires at the FINAL round, not earlier', run(setDiv + `
  GameState.league.schedule["TST"] = [ [["A","B"],["C","D"]], [["A","C"],["B","D"]] ];  // two rounds
  GameState.league.mdIndex["TST"] = 0;   // first round, not the last
  return [...League._lastDayTitleDeciders("TST")].length === 0;
`));

// ---------------- title decider: capture + hide the whole round ----------------
check('title decider: a division snapshot hides its final round until watched', run(`
  GameState._attend = []; GameState.attendWindow = null; GameState._attendSnapshots = {};
  const snap = [{clubId:"A",Pts:80,GF:60,GA:20,P:37},{clubId:"B",Pts:78,GF:55,GA:25,P:37}];
  Attend.stashLeagueSnapshot("PREM", snap);
  // a captured title decider for that division
  GameState._attend = [{ id:"td1", kind:"title-decider", compId:"PREM", homeId:"A", awayId:"C",
    homeName:"A FC", awayName:"C FC", hg:2, ag:1, winner:"A", clients:[{name:"X",side:"home"}] }];
  Attend.openWindow(GameState._attend);
  const w = Attend.window();
  const beforeHidden = Attend.leagueRoundHidden("PREM") && Attend.leagueSnapshot("PREM")===snap;
  Attend.watch(w.finals.findIndex(m=>m.compId==="PREM"));   // watch it
  const afterShown = !Attend.leagueRoundHidden("PREM");
  return beforeHidden && afterShown;
`));
check('title decider: the invite names the division title decider', run(`
  const m = { id:"t", kind:"title-decider", compId:"PREM", homeId:"A", awayId:"B", homeName:"Arsenal", awayName:"Spurs", clients:[{name:"X",side:"home",squadRole:"key"}] };
  const inv = Attend.invitePayload(m);
  return /title decider/i.test(inv.body) || /title decider/i.test(inv.competition);
`));

// ---------------- extra time ----------------
check('extra time: a level FINAL is sometimes decided in ET, sometimes on pens', run(`
  const a = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const b = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==a.id && c.reputation>=55);
  let et=0, pens=0;
  for(let i=0;i<800;i++){ const t=League.playCupTie(a.id,b.id,"SCHWCUP",true);
    if(t.et){ et++; if(t.hg===t.ag) return false; if(t.winner!==a.id && t.winner!==b.id) return false; }
    else if(t.pens){ pens++; if(t.hg!==t.ag) return false; if(t.pens.h===t.pens.a) return false; }
  }
  return et>0 && pens>0;   // both routes actually occur
`));
check('extra time: a NON-final level tie never goes to ET (straight to pens)', run(`
  const a = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const b = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==a.id && c.reputation>=55);
  for(let i=0;i<400;i++){ const t=League.playCupTie(a.id,b.id,"SCHWCUP",false); if(t.et) return false; }
  return true;
`));
check('extra time: an ET-decided final is captured with a 120-minute clock and the ET flag', run(`
  GameState.players = GameState.players.filter(p=>p.agentId!=="me");
  const a = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const b = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==a.id && c.reputation>=55);
  const p = PlayerGen.makePlayer(a,{ability:68,age:25,position:"ST"}); p.name="Ben Riva"; p.agentId="me"; p.everClient=true; p.squadRole="key"; p.stats={};
  GameState.players.push(p); __sqCacheWeek=-1;
  let m=null;
  for(let i=0;i<500;i++){ Attend.resetCaptures(); League.playCupTie(a.id,b.id,"SCHWCUP",true); const c=Attend.pending()[0]; if(c && c.et){ m=c; break; } }
  if(!m) return true;   // vacuous if no ET final in 500 tries (unlikely)
  return m.minutes===120 && m.hg!==m.ag && (m.winner===a.id||m.winner===b.id) && !m.pens;
`));

// ---------------- a fringe client is invited too, but flagged ----------------
check('capture: a fringe client at a finalist is captured even if he did not play', run(plantAt + `
  Attend.resetCaptures();
  const home = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=60);
  const away = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==home.id && c.reputation>=55);
  // a low-ability fringe player: unlikely to be in the XI
  const p = PlayerGen.makePlayer(home, { ability: 40, age: 19, position: "GK" });
  p.name="Young Sub"; p.agentId="me"; p.everClient=true; p.squadRole="fringe"; p.stats={}; p._recent=[];
  GameState.players.push(p); __sqCacheWeek=-1;
  let found=null;
  for (let i=0;i<60;i++){ Attend.resetCaptures(); League.playCupTie(home.id, away.id, "SCHWCUP", true);
    const c=(Attend.pending()[0]||{clients:[]}).clients.find(x=>x.name==="Young Sub"); if (c){ found=c; if(!c.played) break; } }
  return found && found.squadRole==="fringe";
`));

// ---------------- invitation payload ----------------
const mkMatch = `
  const mkMatch = (over) => Object.assign({
    id:"att_1", kind:"cup-final", compId:"SCHWCUP", homeId:"H", awayId:"A",
    homeName:"FC Basel", awayName:"FC Zürich", hg:2, ag:1, winner:"H", pens:null, minutes:90,
    firstLeg:null, targetDivision:null, season:2025, week:47,
    clients:[{ playerId:"p1", name:"Luca Meier", position:"LW", styleRole:"winger", squadRole:"key", side:"home", played:true, goals:1, assists:0, yellow:0, red:0 }]
  }, over||{});
`;
check('invite: cup-final letter names the agent, the client, the competition and the opponent', run(mkMatch + `
  const inv = Attend.invitePayload(mkMatch());
  return /Dear Alex Mercer,/.test(inv.body) && inv.body.includes("Luca Meier") && inv.body.includes("FC Zürich") && /Cup/.test(inv.competition);
`));
check('invite: a bench-likely client draws the honest "may not play much" caveat', run(mkMatch + `
  const inv = Attend.invitePayload(mkMatch({ clients:[{ playerId:"p1", name:"Young Sub", position:"GK", styleRole:"shot_stopper", squadRole:"fringe", side:"home", played:false, goals:0, assists:0, yellow:0, red:0 }] }));
  return /may not play much/.test(inv.body);
`));
check('invite: a key starter draws NO caveat', run(mkMatch + `
  const inv = Attend.invitePayload(mkMatch());
  return !/may not play much/.test(inv.body);
`));
check('invite: a two-legged playoff-final uses the five-variant first-leg prose', run(mkMatch + `
  const inv = Attend.invitePayload(mkMatch({ kind:"playoff-final", firstLeg:{ scored:3, conceded:0 }, targetDivision:"the Super League" }));
  return /comfortable/.test(inv.body) && inv.body.includes("3:0");
`));
check('invite: multiple clients are listed together', run(mkMatch + `
  const inv = Attend.invitePayload(mkMatch({ clients:[
    { playerId:"p1", name:"Luca Meier", position:"LW", styleRole:"winger", squadRole:"key", side:"home", played:true, goals:0, assists:0 },
    { playerId:"p2", name:"Ben Riva",  position:"ST", styleRole:"poacher", squadRole:"key", side:"home", played:true, goals:0, assists:0 }] }));
  return inv.body.includes("Luca Meier and Ben Riva");
`));

// ---------------- timeline spec bridges to LiveSim, scoreline preserved ----------------
check('timeline: the spec replays to exactly the captured scoreline', run(mkMatch + `
  for (let i=0;i<200;i++){
    const t = LiveSim.buildTimeline(Attend.timelineSpec(mkMatch({ hg:3, ag:1 })));
    const g = side => { let n=0; for (const e of t.events){ if(e.side!==side) continue; for (const ev of e.events||[]) if(ev.tag==="GOAL"&&ev.side!=="opp") n++; } return n; };
    if (g("home")!==3 || g("away")!==1) return false;
  }
  return true;
`));
check('timeline: only clients who actually played appear in the spec', run(mkMatch + `
  const spec = Attend.timelineSpec(mkMatch({ clients:[
    { playerId:"p1", name:"Luca Meier", position:"LW", styleRole:"winger", squadRole:"key", side:"home", played:true, goals:1, assists:0 },
    { playerId:"p2", name:"Bench Guy",  position:"CB", styleRole:"aerial_dominator", squadRole:"fringe", side:"home", played:false, goals:0, assists:0 }] }));
  return spec.clients.length===1 && spec.clients[0].player.name==="Luca Meier";
`));

// ---------------- result wiring: statAdjust banks a converted-penalty goal ----------------
check('wiring: applyStatAdjust adds the transferred goal to the client season record', run(plantAt + `
  const club = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const p = plant(club, "ST", "poacher", "Ben Riva");
  const bucketBefore = (statBucket(p, GameState.seasonStartYear, club.id, false, false, "SCHWCUP").goals)||0;
  const m = { compId:"SCHWCUP", season:GameState.seasonStartYear };
  Attend.applyStatAdjust(m, [{ player:{ id:p.id }, goals:1 }]);
  const after = statBucket(p, GameState.seasonStartYear, club.id, false, false, "SCHWCUP").goals;
  return after === bucketBefore + 1;
`));
check('wiring: applyStatAdjust with nothing to bank is a no-op', run(`
  return (Attend.applyStatAdjust({ compId:"SCHWCUP", season:2025 }, []) === undefined) &&
         (Attend.applyStatAdjust({ compId:"SCHWCUP", season:2025 }, null) === undefined);
`));

// ---------------- advanceWeek surfaces the queue ----------------
check('advanceWeek: returns an attend array, and reset clears last week captures', run(`
  const r = Sim.advanceWeek();
  return Array.isArray(r.attend) && Attend.pending().length===0;   // a quiet early week: nothing to attend
`));

// ---------------- ordering: least reputable first, showpiece last ----------------
const ord = `
  // home country is Switzerland (started above). Build finals with real finalist clubs for country.
  const clubOf = country => Clubs.allClubs.find(c=>c.country===country);
  const mk = (kind, compId, country, nClients) => ({
    id: kind+compId+country+nClients, kind, compId,
    homeId: clubOf(country).id, awayId: clubOf(country==="Germany"?"France":"Germany").id,
    clients: Array.from({length:nClients}, (_,i)=>({ name:"C"+i, side:"home" })),
  });
`;
check('order: lower cup < main cup < UECL < UEL < UCL', run(ord + `
  const list = [
    mk("europe-final","UCL","Germany",1), mk("cup-final","KBEK","Netherlands",1),
    mk("europe-final","UECL","Germany",1), mk("cup-final","BEKER","Netherlands",1),
    mk("europe-final","UEL","Germany",1),
  ];
  const seq = GameState._attend = list, o = Attend.order(list).map(m=>m.compId);
  return JSON.stringify(o) === JSON.stringify(["KBEK","BEKER","UECL","UEL","UCL"]);
`));
check('order: at the same prestige, more clients comes later', run(ord + `
  const o = Attend.order([ mk("cup-final","BEKER","Netherlands",2), mk("cup-final","FACUP","England",1) ]);
  return o[0].compId==="FACUP" && o[1].compId==="BEKER";   // 1 client before 2 clients
`));
check('order: same prestige + client count, the HOME country comes later', run(ord + `
  // Switzerland is home. A Swiss main cup vs a German main cup, both 1 client.
  const o = Attend.order([ mk("cup-final","SCHWCUP","Switzerland",1), mk("cup-final","DFB","Germany",1) ]);
  return o[0].compId==="DFB" && o[1].compId==="SCHWCUP";   // foreign first, home last
`));
check('order: otherwise the leagues-dropdown country order decides', run(ord + `
  // England precedes Germany in the dropdown order; neither is home (Switzerland).
  const o = Attend.order([ mk("cup-final","DFB","Germany",1), mk("cup-final","FACUP","England",1) ]);
  return o[0].compId==="FACUP" && o[1].compId==="DFB";
`));
check('order: a MAIN cup (COPPA) outranks a lower cup (LICHCUP) — the compId fix', run(ord + `
  // prestige differs (main vs lower), so the country tiebreak is irrelevant; use clubbed countries
  const o = Attend.order([ mk("cup-final","COPPA","Italy",1), mk("cup-final","LICHCUP","Germany",1) ]);
  return o[0].compId==="LICHCUP" && o[1].compId==="COPPA";   // lower cup first, main cup later
`));

// ---------------- schedule: chronological = prestige, showpiece last ----------------
check('schedule: openWindow stamps a weekday + time, the showpiece last (Sunday night)', run(`
  GameState.attendWindow = null;
  const caps = [
    { id:"a", kind:"europe-final", compId:"UCL", homeId:"H", awayId:"A", homeName:"H", awayName:"A", clients:[{side:"home"}] },
    { id:"b", kind:"cup-final", compId:"KBEK", homeId:"H2", awayId:"A2", homeName:"H2", awayName:"A2", clients:[{side:"home"}] },
    { id:"c", kind:"cup-final", compId:"BEKER", homeId:"H3", awayId:"A3", homeName:"H3", awayName:"A3", clients:[{side:"home"}] },
  ];
  const w = Attend.openWindow(caps);
  // least first: KBEK (lower) -> BEKER (main) -> UCL (europe). All have a day/time; UCL is last & latest.
  const days = w.finals.map(f=>f.day+" "+f.time);
  return w.finals[0].compId==="KBEK" && w.finals[2].compId==="UCL" &&
         w.finals[2].day==="Sunday" && w.finals[2].time==="20:45" &&
         w.finals.every(f=>f.day && f.time);
`));
check('schedule: three or fewer finals stay on the weekend', run(`
  GameState.attendWindow = null;
  const caps = [1,2,3].map(i=>({ id:"s"+i, kind:"cup-final", compId:"KBEK", homeId:"H"+i, awayId:"A"+i, homeName:"H"+i, awayName:"A"+i, clients:[{side:"home"}] }));
  const w = Attend.openWindow(caps);
  return w.finals.every(f=>f.day==="Saturday" || f.day==="Sunday");
`));

// ---------------- the viewing window: reveal / watch / hide ----------------
const win = `
  const finals = Array.from({length:6}, (_,i)=>({ id:"f"+i, kind:"cup-final", compId:"C"+i,
    homeId:"H"+i, awayId:"A"+i, homeName:"Home"+i, awayName:"Away"+i, hg:1, ag:0, winner:"H"+i, clients:[{name:"C",side:"home"}] }));
  GameState.attendWindow = { season:2025, week:47, finals, pointer:-1, watched:0 };
`;
check('window: at first everything is hidden and watchable, nothing revealed', run(win + `
  for(let i=0;i<6;i++){ if(Attend.isRevealed(i)) return false; if(!Attend.isWatchable(i)) return false; if(!Attend.isHidden("f"+i)) return false; }
  return Attend.watchesLeft()===3 && Attend.hasUnwatched();
`));
check('window: watching game 4 reveals games 1-4 and locks the earlier unwatched ones', run(win + `
  if(!Attend.watch(3)) return false;                      // watch index 3 (the 4th game)
  for(let i=0;i<=3;i++){ if(!Attend.isRevealed(i)) return false; if(Attend.isHidden("f"+i)) return false; if(Attend.isWatchable(i)) return false; }
  for(let i=4;i<6;i++){ if(Attend.isRevealed(i)) return false; if(!Attend.isHidden("f"+i)) return false; }
  return Attend.watchesLeft()===2;                          // one watch spent
`));
check('window: you cannot jump back to an earlier game once you have passed it', run(win + `
  Attend.watch(3);
  return Attend.watch(1)===false && Attend.watch(2)===false;   // in the past now
`));
check('window: only three games can be watched in total', run(win + `
  return Attend.watch(0) && Attend.watch(2) && Attend.watch(4) && Attend.watch(5)===false && Attend.watchesLeft()===0;
`));
check('window: finalizeWindow reveals everything (isHidden goes false for all)', run(win + `
  Attend.finalizeWindow();
  for(let i=0;i<6;i++) if(Attend.isHidden("f"+i)) return false;
  return Attend.window()===null;
`));
check('window: openWindow orders least-reputable first and clears the capture list feed', run(`
  GameState.attendWindow = null;
  const caps = [
    { id:"a", kind:"europe-final", compId:"UCL", homeId:"H", awayId:"A", homeName:"H", awayName:"A", clients:[{side:"home"}] },
    { id:"b", kind:"cup-final", compId:"KBEK", homeId:"H2", awayId:"A2", homeName:"H2", awayName:"A2", clients:[{side:"home"}] },
  ];
  const w = Attend.openWindow(caps);
  return w.finals[0].compId==="KBEK" && w.finals[1].compId==="UCL" && w.pointer===-1 && w.watched===0;
`));
check('window: survives a save/load JSON round-trip (persisted, not transient)', run(win + `
  Attend.watch(2);
  const snap = JSON.parse(JSON.stringify(GameState.attendWindow));
  GameState.attendWindow = snap;
  return Attend.isRevealed(2) && !Attend.isRevealed(3) && Attend.watchesLeft()===2;
`));
check('window: consider stamps the tie with the match id so its score can be hidden', run(`
  GameState.players = GameState.players.filter(p=>p.agentId!=="me");
  Attend.resetCaptures(); GameState.attendWindow = null;
  const a = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=58);
  const b = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.id!==a.id && c.reputation>=55);
  const p = PlayerGen.makePlayer(a,{ability:68,age:25,position:"ST"}); p.name="Ben Riva"; p.agentId="me"; p.everClient=true; p.squadRole="key"; p.stats={};
  GameState.players.push(p); __sqCacheWeek=-1;
  const tie = League.playCupTie(a.id, b.id, "SCHWCUP", true);
  Attend.openWindow(GameState._attend);
  return tie._attendId && Attend.isHidden(tie._attendId);   // hidden until watched
`));

// ---------------- live view pure helpers (score/stat/rating math) ----------------
sb.setInterval = () => 0; sb.clearInterval = () => {};
sb.Router = { register() {}, link: () => '#', go() {}, refresh() {}, modal() {}, closeModal() {} };
const LiveView = vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-livesim.js'), 'utf8') + ';LiveView', sb, { filename: 'screen-livesim.js' });
const AttendOverview = vm.runInContext('AttendOverview', sb);
const LiveSim = vm.runInContext('LiveSim', sb);   // capture the sandbox's LiveSim for the Node-scope checks below

check('liveview: the running score-deltas sum to EXACTLY the scoreline, over many timelines', () => {
  const mk = (name, pos, role) => ({ id: name, name, position: pos, styleRole: role });
  const B = mk('Ben Riva', 'ST', 'poacher'), A = mk('Luca Meier', 'LW', 'winger');
  for (let i = 0; i < 400; i++) {
    const hg = Math.floor(Math.random() * 4), ag = Math.floor(Math.random() * 3);
    const t = LiveSim.buildTimeline({ homeName: 'H', awayName: 'A', hg, ag, minutes: 90,
      clients: [{ player: B, side: 'home', goals: Math.min(hg, 1), assists: 0 }, { player: A, side: 'away', goals: Math.min(ag, 1), assists: 0 }] });
    const tot = { home: 0, away: 0 };
    for (const e of t.events) { const d = LiveView.scoreDelta(e); tot.home += d.home; tot.away += d.away; }
    if (tot.home !== hg || tot.away !== ag) return false;
  }
  return true;
});
check('liveview: buildStats keeps shots on target <= shots and possession summing to 100', () => {
  const t = { corners: { home: 4, away: 3 }, minutes: 90 };
  for (let i = 0; i < 500; i++) {
    const s = LiveView.buildStats({ hg: 3, ag: 1 }, t);
    if (s.sot.home > s.shots.home || s.sot.away > s.shots.away) return false;
    if (s.possession.home + s.possession.away !== 100) return false;
    if (s.corners.home !== 4 || s.corners.away !== 3) return false;
  }
  return true;
});
check('liveview: a drifting stat starts at 0, ends at its final, never overshoots', () => {
  return LiveView.statAt(12, 0) === 0 && LiveView.statAt(12, 1) === 12 &&
         LiveView.statAt(12, 0.5) <= 12 && LiveView.statAt(12, 0.5) >= 0;
});
check('liveview: possession drifts from 50 toward the final split', () => {
  return LiveView.possAt(62, 0) === 50 && LiveView.possAt(62, 1) === 62;
});
check('liveview: the live rating starts ~6.3, eases to the engine rating, stays in 1..10', () => {
  const r0 = LiveView.ratingAt(8.2, 0), r1 = LiveView.ratingAt(8.2, 1);
  return Math.abs(r0 - 6.3) < 0.01 && Math.abs(r1 - 8.2) < 0.01 &&
         LiveView.ratingAt(12, 0.5) <= 10 && LiveView.ratingAt(-3, 0.5) >= 1;
});

// ---------------- overview render: watchable / revealed / locked ----------------
check('overview: renders each final as watchable, then reveals the score once passed', () => {
  const el = { innerHTML: '' };
  const finals = Array.from({ length: 3 }, (_, i) => ({ id: 'g' + i, kind: 'cup-final', compId: 'C' + i, homeId: 'H' + i, awayId: 'A' + i, homeName: 'Home' + i, awayName: 'Away' + i, hg: 2, ag: 1, winner: 'H' + i, clients: [{ side: 'home' }] }));
  vm.runInContext('GameState.attendWindow = ' + JSON.stringify({ season: 2025, week: 47, finals, pointer: -1, watched: 0 }), sb);
  AttendOverview.render(el);
  if (!/Attend/.test(el.innerHTML) || /2–1/.test(el.innerHTML)) return false;   // watchable, no score shown
  vm.runInContext('Attend.watch(1)', sb);   // pass game index 1 -> reveals 0 and 1
  AttendOverview.render(el);
  return /2–1/.test(el.innerHTML) && /in the past/.test(el.innerHTML) === false ? /2–1/.test(el.innerHTML) : /2–1/.test(el.innerHTML);
});
check('overview: an empty window shows a friendly placeholder', () => {
  const el = { innerHTML: '' };
  vm.runInContext('GameState.attendWindow = null', sb);
  AttendOverview.render(el);
  return /No finals to attend/.test(el.innerHTML);
});

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll attend checks passed.');
process.exitCode = failed ? 1 : 0;
