// Live-sim engine: chain rules, weighting, tag parsing/resolution, placeholders.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const errs = [];
const sb = { console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) }, Math, Date, JSON };
vm.createContext(sb);
for (const f of ['rng.js', 'live-sim-data.js', 'live-sim.js']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---------------- key compatibility (§3 base / numbered / multi-key) ----------------
check('key: a base piece links to anything in its family (A <-> A3)', run(`return LiveSim.keysLink("A","A3") && LiveSim.keysLink("A3","A");`));
check('key: same branch links (A1 <-> A1)', run(`return LiveSim.keysLink("A1","A1");`));
check('key: different branches do NOT link (A1 <-> A2)', run(`return !LiveSim.keysLink("A1","A2");`));
check('key: different families never link (A1 <-> B1)', run(`return !LiveSim.keysLink("A1","B1");`));
check('key: a multi-key fits either of its branches (A1/A3)', run(`return LiveSim.keysLink("A1/A3","A1") && LiveSim.keysLink("A1/A3","A3") && !LiveSim.keysLink("A1/A3","A2");`));

// ---------------- chain assembly rules (§3) ----------------
check('chain: A -> A1 -> A is valid (base end fits the branch)', run(`return !!LiveSim.chainBranch(["A","A1","A"]);`));
check('chain: A -> A1 -> A1 is valid', run(`const b=LiveSim.chainBranch(["A","A1","A1"]); return !!b && b.br===1;`));
check('chain: A -> A1 -> A2 is INVALID even though each pair links via the base', run(`return LiveSim.chainBranch(["A","A1","A2"])===null;`));
check('chain: A1 -> A1 -> A1 (two middles, same branch) is valid', run(`return !!LiveSim.chainBranch(["A","A1","A1","A1"]);`));
check('chain: A1 -> A2 two middles disagreeing is INVALID', run(`return LiveSim.chainBranch(["A","A1","A2","A"])===null;`));
check('chain: an all-base chain resolves to no branch', run(`const b=LiveSim.chainBranch(["A","A","A"]); return !!b && b.br===null;`));
check('chain: a multi-key end settles the branch (A -> A3 -> A1/A3 => branch 3)', run(`const b=LiveSim.chainBranch(["A","A3","A1/A3"]); return !!b && b.br===3;`));
check('chain: cross-family is invalid', run(`return LiveSim.chainBranch(["A","B1","B"])===null;`));

// ---------------- weighted selection (§3) ----------------
check('weights: respected within tolerance over 40k draws', run(`
  let i=0; const seq=[0.1,0.35,0.6,0.85];
  const list=[{weight:100,id:"common"},{weight:5,id:"rare"}];
  const counts={common:0,rare:0};
  for(let n=0;n<40000;n++) counts[LiveSim.pickWeighted(list, Math.random).id]++;
  const rareRate = counts.rare/40000;               // expected 5/105 = 4.76%
  return rareRate > 0.035 && rareRate < 0.062;
`));
check('weights: a zero/absent pool returns null rather than throwing', run(`return LiveSim.pickWeighted([])===null && LiveSim.pickWeighted([{weight:0}])===null;`));
check('weights: rare pieces are demonstrably rarer in the real data', run(`
  const rare = LIVE_SIM_DATA.pieces.end.filter(p=>p.w<=8).length;
  const std  = LIVE_SIM_DATA.pieces.end.filter(p=>p.w===100).length;
  return rare>0 && std>rare*3;
`));

// ---------------- tag parsing (§3 / Legend) ----------------
check('tags: parse "GOAL:E; ASSIST:M"', run(`
  const t=LiveSim.parseTags("GOAL:E; ASSIST:M");
  return t.length===2 && t[0].tag==="GOAL" && t[0].ref==="E" && t[1].tag==="ASSIST" && t[1].ref==="M";
`));
check('tags: blank means nothing for the report', run(`return LiveSim.parseTags("").length===0 && LiveSim.parseTags(null).length===0;`));
check('tags: an unknown tag or ref throws rather than being silently dropped', run(`
  let a=false,b=false;
  try{LiveSim.parseTags("NOPE:E")}catch(e){a=true}
  try{LiveSim.parseTags("GOAL:Z")}catch(e){b=true}
  return a&&b;
`));
check('tags: every result string in the shipped data parses', run(`
  for(const p of LIVE_SIM_DATA.pieces.end) if(p.r) LiveSim.parseTags(p.r);
  return true;
`));

// ---------------- tag resolution: O/T anonymisation + self-assist ----------------
const mkBound = `
  const A={id:"a",name:"Luca Meier",position:"LW",styleRole:"winger"};
  const B={id:"b",name:"Ben Riva",position:"ST",styleRole:"poacher"};
  const bind=(tags,sP,mP,eP)=>({ pieces:[{piece:{},player:sP},{piece:{},player:mP},{piece:{tags},player:eP}],
                                 lastMiddle:{piece:{},player:mP}, end:{piece:{tags},player:eP} });
`;
check('resolve: GOAL:E credits the end piece player', run(mkBound + `
  const r=LiveSim.resolveTags(bind("GOAL:E",A,A,B));
  return r.length===1 && r[0].tag==="GOAL" && r[0].player===B;
`));
check('resolve: O never produces a name (opposition does not exist)', run(mkBound + `
  const r=LiveSim.resolveTags(bind("YC:O",A,A,A));
  return r.length===1 && r[0].player===null && r[0].anonymous===true && r[0].side==="opp";
`));
check('resolve: T never produces a name (team-mates do not exist)', run(mkBound + `
  const r=LiveSim.resolveTags(bind("GOAL:T; ASSIST:E",A,A,A));
  const g=r.find(x=>x.tag==="GOAL"), a=r.find(x=>x.tag==="ASSIST");
  return g.player===null && g.anonymous && g.side==="own" && a.player===A;
`));
check('resolve: a self-assist is suppressed (S/M/E all the same client)', run(mkBound + `
  const r=LiveSim.resolveTags(bind("GOAL:E; ASSIST:M",A,A,A));
  return r.length===1 && r[0].tag==="GOAL";
`));
check('resolve: two different clients DO get goal + assist', run(mkBound + `
  const r=LiveSim.resolveTags(bind("GOAL:E; ASSIST:M",A,A,B));
  const g=r.find(x=>x.tag==="GOAL"), a=r.find(x=>x.tag==="ASSIST");
  return r.length===2 && g.player===B && a.player===A;
`));
check('resolve: ASSIST:S references the START piece player', run(mkBound + `
  const r=LiveSim.resolveTags(bind("GOAL:E; ASSIST:S",A,B,B));
  // S=A assisted, E=B scored -> both credited, no suppression
  return r.length===2 && r.find(x=>x.tag==="ASSIST").player===A;
`));

// ---------------- the corrected A1 piece ----------------
check('data: the "cleverly created by XY" end is tagged GOAL:T; ASSIST:E (client creates, unnamed team-mate finishes)', run(`
  const p=LIVE_SIM_DATA.pieces.end.find(p=>/cleverly created by XY/.test(p.t));
  return !!p && p.r==="GOAL:T; ASSIST:E";
`));
check('data: that piece now credits the NAMED client with the assist and nobody with the goal', run(mkBound + `
  const p=LIVE_SIM_DATA.pieces.end.find(p=>/cleverly created by XY/.test(p.t));
  const r=LiveSim.resolveTags(bind(p.r,A,A,A));
  const g=r.find(x=>x.tag==="GOAL"), as=r.find(x=>x.tag==="ASSIST");
  return g.player===null && as.player===A;
`));

// ---------------- role codes ----------------
check('roles: every (position, styleRole) in the data resolves to a code', run(`
  let n=0;
  for(const [pos,roles] of Object.entries(LIVE_SIM_DATA.roleCodes))
    for(const role of Object.keys(roles)) { if(!LiveSim.roleCodeOf({position:pos,styleRole:role})) return false; n++; }
  return n===45;
`));
check('roles: an unknown role yields no code rather than a wrong one', run(`return LiveSim.roleCodeOf({position:"ST",styleRole:"nonsense"})===null && LiveSim.roleCodeOf({position:"ZZ",styleRole:"poacher"})===null;`));

// ---------------- placeholders ----------------
check('text: XY, and the full team tokens incl. their parentheticals, are all replaced', run(`
  const piece={text:"XY of xy (player's team) beats yx (opposition team)"};
  const out=LiveSim.renderPiece(piece,{name:"Luca Meier"},{teamName:"FC Basel",oppName:"FC Zurich"});
  return out==="Luca Meier of FC Basel beats FC Zurich";
`));
check('text: no placeholder survives rendering of any shipped piece', run(`
  const A={id:"a",name:"Luca Meier",position:"LW",styleRole:"winger"};
  for(const b of ["start","middle","end"]) for(const p of LIVE_SIM_DATA.pieces[b]) {
    const out=LiveSim.renderPiece({text:p.t},A,{teamName:"FC Basel",oppName:"FC Zurich"});
    if(/XY|\\bxy \\(|\\byx \\(/.test(out)) return false;
  }
  return true;
`));

// ---------------- end-to-end chain building on the real data ----------------
check('build: every one of the 45 roles can build a chain', run(`
  const bad=[];
  for(const [pos,roles] of Object.entries(LIVE_SIM_DATA.roleCodes)) for(const role of Object.keys(roles)) {
    const c={id:"x",name:"Test Client",position:pos,styleRole:role};
    let ok=false;
    for(let i=0;i<40 && !ok;i++) ok=!!LiveSim.buildChain(c,[c]);
    if(!ok) bad.push(pos+"/"+role);
  }
  if(bad.length) console.error("roles that cannot build: "+bad.join(", "));
  return bad.length===0;
`));
check('build: every built chain obeys the branch rule', run(`
  const c={id:"x",name:"Luca Meier",position:"LW",styleRole:"winger"};
  for(let i=0;i<3000;i++){
    const ch=LiveSim.buildChain(c,[c]); if(!ch) continue;
    if(!LiveSim.chainBranch(ch.pieces.map(x=>x.piece.keys))) return false;
  }
  return true;
`));
check('build: chains are start -> middle(s) -> end with at most two middles', run(`
  const c={id:"x",name:"Luca Meier",position:"LW",styleRole:"winger"};
  let sawTwo=false;
  for(let i=0;i<3000;i++){
    const ch=LiveSim.buildChain(c,[c]); if(!ch) continue;
    const n=ch.pieces.length;
    if(n<3||n>4) return false;
    if(n===4) sawTwo=true;
  }
  return sawTwo;   // the ~15% double-middle actually happens
`));
check('build: a chain never uses the same piece twice (families like N carry one middle per branch)', run(`
  const roles=[["LW","winger"],["ST","poacher"],["GK","sweeper_keeper"],["CB","aerial_dominator"],["CM","playmaker"]];
  for(const [pos,role] of roles){
    const c={id:"x",name:"Test Client",position:pos,styleRole:role};
    for(let i=0;i<2000;i++){
      const ch=LiveSim.buildChain(c,[c]); if(!ch) continue;
      const ids=ch.pieces.map(x=>x.piece.id+":"+x.piece.text.slice(0,20));
      if(new Set(ids).size!==ids.length) return false;
    }
  }
  return true;
`));
check('build: the ~15% double-middle rate is roughly honoured', run(`
  const c={id:"x",name:"Luca Meier",position:"LW",styleRole:"winger"};
  let two=0,n=0;
  for(let i=0;i<6000;i++){ const ch=LiveSim.buildChain(c,[c]); if(!ch) continue; n++; if(ch.pieces.length===4) two++; }
  const rate=two/n;
  return rate>0.06 && rate<0.20;
`));
check('build: the trigger client is always named in the START piece', run(`
  const c={id:"x",name:"Luca Meier",position:"LW",styleRole:"winger"};
  for(let i=0;i<2000;i++){
    const ch=LiveSim.buildChain(c,[c]); if(!ch) continue;
    if(ch.pieces[0].player!==c) return false;
    if(!ch.pieces[0].piece.codes.has("LWWNG")) return false;
  }
  return true;
`));
check('build: opts.allow can forbid goal chains (this is how the goal BUDGET stays in charge)', run(`
  const c={id:"x",name:"Ben Riva",position:"ST",styleRole:"poacher"};
  const noGoal = tags => !/GOAL:(E|S|M)/.test(tags||"");
  for(let i=0;i<2500;i++){
    const ch=LiveSim.buildChain(c,[c],{allow:noGoal}); if(!ch) continue;
    const ev=LiveSim.resolveTags(ch);
    if(ev.some(e=>e.tag==="GOAL" && e.player)) return false;
  }
  return true;
`));
check('build: an unfiltered poacher DOES score sometimes (the filter above proves nothing otherwise)', run(`
  const c={id:"x",name:"Ben Riva",position:"ST",styleRole:"poacher"};
  let goals=0;
  for(let i=0;i<600;i++){ const ch=LiveSim.buildChain(c,[c]); if(!ch) continue;
    if(LiveSim.resolveTags(ch).some(e=>e.tag==="GOAL"&&e.player)) goals++; }
  return goals>0;
`));
check('build: with two clients, both can appear in one chain', run(`
  const A={id:"a",name:"Luca Meier",position:"LW",styleRole:"winger"};
  const B={id:"b",name:"Ben Riva",position:"ST",styleRole:"poacher"};
  let both=false;
  for(let i=0;i<4000 && !both;i++){
    const ch=LiveSim.buildChain(A,[A,B]); if(!ch) continue;
    const names=new Set(ch.pieces.map(x=>x.player&&x.player.id));
    if(names.has("a")&&names.has("b")) both=true;
  }
  return both;
`));
check('build: a chain never names a client whose role the piece does not list', run(`
  const A={id:"a",name:"Luca Meier",position:"LW",styleRole:"winger"};
  const B={id:"b",name:"Ben Riva",position:"ST",styleRole:"poacher"};
  for(let i=0;i<3000;i++){
    const ch=LiveSim.buildChain(A,[A,B]); if(!ch) continue;
    for(const {piece,player} of ch.pieces){
      if(!piece.names) continue;                       // connective piece: carries the last actor, no name printed
      const rc=LiveSim.roleCodeOf(player);
      if(!piece.codes.has(rc)) return false;
    }
  }
  return true;
`));
check('build: identical chains do not repeat within a match', run(`
  const c={id:"x",name:"Luca Meier",position:"LW",styleRole:"winger"};
  const used=new Set(); let n=0;
  for(let i=0;i<9;i++){ const ch=LiveSim.buildChain(c,[c],{used}); if(!ch) continue;
    const k=LiveSim.chainKey(ch); if(used.has(k)) return false; used.add(k); n++; }
  return n>=6;
`));

// ---------------- timeline (§4 invariants) ----------------
const TL = `
  const mk=(id,name,pos,role)=>({id,name,position:pos,styleRole:role});
  const A=mk("a","Luca Meier","LW","winger"), B=mk("b","Ben Riva","ST","poacher"), C=mk("c","Jonas Frei","CB","aerial_dominator");
  const spec=(o)=>Object.assign({ homeName:"FC Basel", awayName:"FC Zurich", hg:0, ag:0, minutes:90, clients:[] }, o);
`;
check('timeline: a client goal budget of 0 NEVER produces a client goal (defenders stay defenders)', run(TL + `
  for(let i=0;i<300;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:1, clients:[{player:C,side:"home",goals:0,assists:0}] }));
    for(const e of t.events) for(const ev of e.events||[])
      if(ev.tag==="GOAL" && ev.player) return false;
  }
  return true;
`));
check('timeline: client goals in the feed exactly equal the budget assignStats handed over', run(TL + `
  for(let i=0;i<300;i++){
    const t=LiveSim.buildTimeline(spec({ hg:3, ag:0, clients:[{player:B,side:"home",goals:2,assists:0}] }));
    let n=0; for(const e of t.events) for(const ev of e.events||[]) if(ev.tag==="GOAL"&&ev.player===B) n++;
    if(n!==2) return false;
  }
  return true;
`));
check('timeline: total goals shown equal the scoreline (client + anonymous)', run(TL + `
  for(let i=0;i<300;i++){
    const t=LiveSim.buildTimeline(spec({ hg:3, ag:2, clients:[{player:B,side:"home",goals:1,assists:0},{player:A,side:"away",goals:1,assists:0}] }));
    const count=side=>{ let n=0; for(const e of t.events){ if(e.side!==side) continue;
      for(const ev of e.events||[]) if(ev.tag==="GOAL" && ev.side!=="opp") n++; } return n; };
    if(count("home")!==3 || count("away")!==2) return false;
  }
  return true;
`));
check('timeline: an assist budget is honoured exactly', run(TL + `
  for(let i=0;i<200;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:0, clients:[{player:A,side:"home",goals:0,assists:1}] }));
    let n=0; for(const e of t.events) for(const ev of e.events||[]) if(ev.tag==="ASSIST"&&ev.player===A) n++;
    if(n!==1) return false;
  }
  return true;
`));
check('timeline: 3-9 core puzzle events (corners excluded), scaling with the number of clients', run(TL + `
  const counts=[];
  for(let n=1;n<=3;n++){
    const cl=[A,B,C].slice(0,n).map(p=>({player:p,side:"home",goals:0,assists:0}));
    for(let i=0;i<200;i++){
      const t=LiveSim.buildTimeline(spec({ hg:0, ag:0, clients:cl }));
      // pure corner FLAVOUR (a corner chain with no result) is extra, not a core puzzle event;
      // a goal straight from a corner still counts (it carries a result)
      const k=t.events.filter(e=>e.kind==="chain" && !(e.corner && (e.events||[]).length===0)).length;
      if(k<3||k>9) return false;
      counts.push([n,k]);
    }
  }
  const avg=n=>{const s=counts.filter(x=>x[0]===n);return s.reduce((a,x)=>a+x[1],0)/s.length;};
  return avg(3)>avg(1);   // more clients -> more events
`));
check('timeline: never two events in the same minute, all within 1..90', run(TL + `
  for(let i=0;i<300;i++){
    const t=LiveSim.buildTimeline(spec({ hg:3, ag:2, clients:[{player:B,side:"home",goals:1,assists:1},{player:A,side:"away",goals:1,assists:0}] }));
    const mins=t.events.map(e=>e.minute);
    if(new Set(mins).size!==mins.length) return false;
    if(mins.some(m=>m<1||m>90)) return false;
    for(let k=1;k<mins.length;k++) if(mins[k]<mins[k-1]) return false;   // ordered
  }
  return true;
`));
check('timeline: extra time extends the clock to 120 for finals', run(TL + `
  const t=LiveSim.buildTimeline(spec({ hg:2, ag:2, minutes:120, clients:[{player:B,side:"home",goals:1,assists:0}] }));
  return t.minutes===120 && t.events.every(e=>e.minute>=1 && e.minute<=120);
`));
check('timeline: with two eligible clients, a goal goes to the one the ENGINE credited, not the other', run(TL + `
  // A and B are both eligible for the same goal chains. Only A scored. Without the credit hint the
  // binder happily hands GOAL:E to B, inventing a goal for a client whose budget was zero.
  for(let i=0;i<400;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:0, clients:[
      {player:A,side:"home",goals:1,assists:0},{player:B,side:"home",goals:0,assists:0}] }));
    let toA=0,toB=0;
    for(const e of t.events) for(const ev of e.events||[]) if(ev.tag==="GOAL"&&ev.player){ if(ev.player===A) toA++; if(ev.player===B) toB++; }
    if(toA!==1||toB!==0) return false;
  }
  return true;
`));
check('timeline: a required outcome always carries commentary — no silent events', run(TL + `
  const G=mk("g","Marc Suter","GK","shot_stopper");
  const cases=[
    [{player:A,side:"home",goals:1,assists:0}, 1,0],
    [{player:A,side:"home",goals:0,assists:1}, 1,0],
    [{player:C,side:"home",goals:0,assists:0,yellow:1}, 0,0],
    [{player:G,side:"home",goals:1,assists:0}, 1,0],   // a keeper has no goal chains at all
  ];
  for(const [cl,hg,ag] of cases) for(let i=0;i<150;i++){
    const t=LiveSim.buildTimeline(spec({ hg, ag, clients:[cl] }));
    for(const e of t.events){
      if(!e.lines || !e.lines.length) return false;
      if(e.lines.some(l=>!l || !l.trim())) return false;
    }
  }
  return true;
`));
check('timeline: a required goal is always narrated even if no chain fits it', run(TL + `
  // a GK has no goal-scoring chains at all; the goal must still appear rather than vanish
  const G=mk("g","Marc Suter","GK","shot_stopper");
  for(let i=0;i<200;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:0, clients:[{player:G,side:"home",goals:1,assists:0}] }));
    let n=0; for(const e of t.events) for(const ev of e.events||[]) if(ev.tag==="GOAL"&&ev.player===G) n++;
    if(n!==1) return false;
  }
  return true;
`));
check('timeline: a won or conceded penalty is ALWAYS followed by the kick being taken', run(TL + `
  let sawPen=false;
  for(let i=0;i<600;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:1, clients:[{player:C,side:"away",goals:0,assists:0,yellow:1},{player:B,side:"home",goals:1,assists:0}] }));
    for(let k=0;k<t.events.length;k++){
      const awarded=(t.events[k].events||[]).some(ev=>ev.tag==="PENWON"||ev.tag==="PENCONC");
      if(!awarded) continue;
      sawPen=true;
      const nxt=t.events[k+1];
      if(!nxt || nxt.kind!=="penalty") return false;          // left hanging
      if(!nxt.lines || !nxt.lines.length) return false;       // resolved but not narrated
      const settled=(nxt.events||[]).some(ev=>["GOAL","PENSAVE","PENMISS"].includes(ev.tag));
      if(!settled) return false;                              // narrated but nothing happened
    }
  }
  return sawPen;   // the case actually occurs, so this proves something
`));
check('timeline: a penalty follow-up never breaks the scoreline', run(TL + `
  for(let i=0;i<600;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:1, clients:[{player:C,side:"away",goals:0,assists:0,yellow:1},{player:B,side:"home",goals:1,assists:0}] }));
    const count=side=>{ let n=0; for(const e of t.events){ if(e.side!==side) continue;
      for(const ev of e.events||[]) if(ev.tag==="GOAL" && ev.side!=="opp") n++; } return n; };
    if(count("home")!==2 || count("away")!==1) return false;
  }
  return true;
`));
check('timeline: an eligible client ALWAYS takes the penalty for his side (anonymous takers stay rare)', run(TL + `
  // B is a poacher: the workbook lets him take penalties. Any spot kick for his side is his.
  for(let i=0;i<600;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:0, clients:[{player:B,side:"home",goals:1,assists:0}] }));
    for(const e of t.events){
      if(e.kind!=="penalty" || e.side!=="home") continue;
      if(e.client!==B) return false;
    }
  }
  return true;
`));
check('timeline: a client with no goal budget takes the penalty but does NOT score', run(TL + `
  for(let i=0;i<400;i++){
    const t=LiveSim.buildTimeline(spec({ hg:0, ag:0, clients:[{player:B,side:"home",goals:0,assists:0}] }));
    for(const e of t.events){
      if(e.kind!=="penalty") continue;
      for(const ev of e.events||[]) if(ev.tag==="GOAL") return false;
    }
  }
  return true;
`));
check('timeline: about 25% of matches see a penalty, and never more than one', run(TL + `
  let withPen=0, tooMany=0;
  const N=2500;
  for(let i=0;i<N;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:1, clients:[
      {player:B,side:"home",goals:1,assists:0},{player:C,side:"away",goals:0,assists:0,yellow:1}] }));
    const n=t.events.filter(e=>e.kind==="penalty").length;
    if(n) withPen++;
    if(n>1) tooMany++;
  }
  const rate=withPen/N;
  if(tooMany) return false;
  return rate>0.18 && rate<0.32;   // was 100%: the N family was being picked as ordinary open play
`));
check('timeline: the spot kick is taken the minute AFTER it is given away', run(TL + `
  let seen=0;
  for(let i=0;i<2000;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:1, clients:[
      {player:B,side:"home",goals:1,assists:0},{player:C,side:"away",goals:0,assists:0,yellow:1}] }));
    for(let k=0;k<t.events.length;k++){
      if(t.events[k].kind!=="penalty") continue;
      const prev=t.events[k-1];
      if(!prev) return false;
      if(t.events[k].minute !== prev.minute+1) return false;
      seen++;
    }
  }
  return seen>50;
`));
check('timeline: a converted client penalty reports the goal it took over via statAdjust', run(TL + `
  let transfers=0, checked=0;
  for(let i=0;i<3000;i++){
    // B scored nothing himself; any penalty he converts must borrow one of the team's two goals
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:0, clients:[{player:B,side:"home",goals:0,assists:0}] }));
    const pen=t.events.find(e=>e.kind==="penalty" && (e.events||[]).some(x=>x.tag==="GOAL"&&x.player===B));
    const adj=(t.statAdjust||[]).filter(a=>a.player===B);
    if(pen){ transfers++; if(adj.length!==1 || adj[0].goals!==1) return false; }
    else if(adj.length) return false;    // nothing to report when he didn't convert one
    // the scoreline must be untouched by the transfer
    let goals=0; for(const e of t.events) for(const ev of e.events||[]) if(ev.tag==="GOAL"&&ev.side!=="opp") goals++;
    if(goals!==2) return false;
    checked++;
  }
  return transfers>20 && checked===3000;
`));
check('build: N and X are unreachable unless asked for by name', run(`
  const B={id:"b",name:"Ben Riva",position:"ST",styleRole:"poacher"};
  let sawPenFamily=false;
  for(let i=0;i<3000;i++){
    const ch=LiveSim.buildChain(B,[B]); if(!ch) continue;
    if(ch.pieces.some(x=>x.piece.keys.some(k=>k.fam==="N"||k.fam==="X"))) sawPenFamily=true;
  }
  if(sawPenFamily) return false;
  // ...but asking explicitly still works, or penalties could never be narrated
  let gotN=false;
  for(let i=0;i<40 && !gotN;i++){ const ch=LiveSim.buildChain(B,[B],{family:"N"});
    if(ch && ch.pieces.every(x=>x.piece.keys.some(k=>k.fam==="N"))) gotN=true; }
  return gotN;
`));
check('penaltyTakers: outfield attackers qualify, a keeper never does', run(TL + `
  const G=mk("g","Marc Suter","GK","shot_stopper");
  const cl=[{player:B,side:"home"},{player:G,side:"home"},{player:C,side:"home"}];
  const t=LiveSim.penaltyTakers(cl,"home").map(c=>c.player.name);
  return t.includes("Ben Riva") && !t.includes("Marc Suter");
`));
check('timeline: a goal chain never hands an unearned assist to a zero-budget team-mate', run(TL + `
  for(let i=0;i<400;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:0, clients:[
      {player:A,side:"home",goals:1,assists:0},{player:B,side:"home",goals:0,assists:0}] }));
    for(const e of t.events) for(const ev of e.events||[])
      if(ev.tag==="ASSIST" && ev.player) return false;   // nobody was credited an assist by the engine
  }
  return true;
`));
check('timeline: an event can never spend more of a budget than exists', run(TL + `
  for(let i=0;i<400;i++){
    const cl=[{player:A,side:"home",goals:1,assists:1},{player:B,side:"home",goals:1,assists:0}];
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:0, clients:cl }));
    const tot=new Map();
    for(const e of t.events) for(const ev of e.events||[]){
      if(!ev.player) continue;
      const k=ev.player.name+":"+ev.tag; tot.set(k,(tot.get(k)||0)+1);
    }
    if((tot.get("Luca Meier:GOAL")||0)!==1) return false;
    if((tot.get("Luca Meier:ASSIST")||0)!==1) return false;
    if((tot.get("Ben Riva:GOAL")||0)!==1) return false;
    if((tot.get("Ben Riva:ASSIST")||0)!==0) return false;
  }
  return true;
`));
check('timeline: a GOAL:T chain consumes an anonymous goal rather than adding one', run(TL + `
  // the corrected A1 piece is GOAL:T; ASSIST:E — client assists, unnamed team-mate finishes.
  // The team goal it narrates must come OUT of the scoreline, not be added on top of it.
  for(let i=0;i<400;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:0, clients:[{player:A,side:"home",goals:0,assists:1}] }));
    let goals=0;
    for(const e of t.events) for(const ev of e.events||[]) if(ev.tag==="GOAL" && ev.side!=="opp") goals++;
    if(goals!==2) return false;
  }
  return true;
`));
check('timeline: cards follow the engine, not the chains', run(TL + `
  for(let i=0;i<200;i++){
    const t=LiveSim.buildTimeline(spec({ hg:0, ag:0, clients:[{player:C,side:"home",goals:0,assists:0,yellow:1}] }));
    let y=0,r=0;
    for(const e of t.events) for(const ev of e.events||[]){ if(ev.tag==="YC"&&ev.player===C) y++; if((ev.tag==="RC"||ev.tag==="Y2C")&&ev.player===C) r++; }
    if(y!==1||r!==0) return false;
  }
  return true;
`));
check('timeline: no client is named on the wrong side of the match', run(TL + `
  for(let i=0;i<200;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:1, clients:[{player:B,side:"home",goals:1,assists:0},{player:A,side:"away",goals:1,assists:0}] }));
    for(const e of t.events){
      if(e.kind!=="chain"||!e.lines) continue;
      const txt=e.lines.join(" ");
      if(e.side==="home" && txt.includes("Luca Meier")) return false;
      if(e.side==="away" && txt.includes("Ben Riva")) return false;
    }
  }
  return true;
`));
check('timeline: a client on each side gets his own team named as "his", the other as opposition', run(TL + `
  for(let i=0;i<150;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:2, clients:[{player:B,side:"home",goals:1,assists:0},{player:A,side:"away",goals:1,assists:0}] }));
    for(const e of t.events){
      if(e.kind!=="chain"||!e.lines) continue;
      const txt=e.lines.join(" ");
      if(/XY|xy \\(|yx \\(/.test(txt)) return false;
    }
  }
  return true;
`));

// ---------------- corners ----------------
check('corners: every match reports a plausible corner count per side', run(TL + `
  for(let i=0;i<300;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:1, clients:[{player:B,side:"home",goals:1,assists:0}] }));
    if(!t.corners) return false;
    // 2 is the floor per side; a match with several corner-family chains can run a little over the
    // top-up target, which is fine — it just means more corners were actually shown
    if(t.corners.home<2||t.corners.home>11||t.corners.away<2||t.corners.away>11) return false;
  }
  return true;
`));
check('corners: the reported count equals the number of corner-flagged events, per side', run(TL + `
  for(let i=0;i<400;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:1, clients:[{player:B,side:"home",goals:1,assists:0},{player:C,side:"away",goals:0,assists:0}] }));
    const seen={home:0,away:0};
    for(const e of t.events) if(e.corner) seen[e.corner]++;
    if(seen.home!==t.corners.home || seen.away!==t.corners.away) return false;
  }
  return true;
`));
check('corners: a corner event never touches the scoreline', run(TL + `
  for(let i=0;i<500;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:0, clients:[{player:B,side:"home",goals:0,assists:0}] }));
    const goals=side=>{let n=0;for(const e of t.events){if(e.side!==side)continue;for(const ev of e.events||[])if(ev.tag==="GOAL"&&ev.side!=="opp")n++;}return n;};
    if(goals("home")!==1||goals("away")!==0) return false;
    // corner-flagged chains must carry no result events at all
    for(const e of t.events) if(e.corner && (e.events||[]).length) return false;
  }
  return true;
`));
check('corners: some are narrated as client events, most are plain ticks', run(TL + `
  let narrated=0, plain=0;
  for(let i=0;i<800;i++){
    const t=LiveSim.buildTimeline(spec({ hg:0, ag:0, clients:[{player:B,side:"home",goals:0,assists:0}] }));
    for(const e of t.events){ if(!e.corner) continue; if(e.kind==="chain") narrated++; else plain++; }
  }
  return narrated>0 && plain>narrated && narrated<=800*2;   // capped, and the exception not the rule
`));
check('corners: a narrated corner reads like one (mentions "corner")', run(TL + `
  for(let i=0;i<1500;i++){
    const t=LiveSim.buildTimeline(spec({ hg:0, ag:0, clients:[{player:B,side:"home",goals:0,assists:0},{player:C,side:"away",goals:0,assists:0}] }));
    for(const e of t.events){
      if(!(e.corner && e.kind==="chain")) continue;
      if(!/corner/i.test(e.lines.join(" "))) return false;
    }
  }
  return true;
`));

// ---------------- random penalties ----------------
check('penalties: happen even when NO client could have won or conceded one', run(TL + `
  // one lone defender who is not a penalty-taker and earns nothing; penalties must still occur
  let withPen=0; const N=3000;
  for(let i=0;i<N;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:1, clients:[{player:C,side:"home",goals:0,assists:0}] }));
    if(t.events.some(e=>e.kind==="penalty")) withPen++;
  }
  const rate=withPen/N;
  return rate>0.15 && rate<0.32;   // ~25%, driven by the random award, not client involvement
`));
check('penalties: a random award is anonymous, then still resolves', run(TL + `
  let sawAward=false;
  for(let i=0;i<2000;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:1, clients:[{player:C,side:"home",goals:0,assists:0}] }));
    for(let k=0;k<t.events.length;k++){
      if(t.events[k].kind!=="penalty-award") continue;
      sawAward=true;
      if(t.events[k].client) return false;                 // the AWARD names nobody
      const kick=t.events[k+1];
      if(!kick || kick.kind!=="penalty") return false;     // and it is taken next
      if(kick.minute!==t.events[k].minute+1) return false; // one minute later
    }
  }
  return sawAward;
`));
check('penalties: still at most one per match, and one event never awards two', run(TL + `
  for(let i=0;i<2000;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:2, clients:[{player:B,side:"home",goals:1,assists:0},{player:C,side:"away",goals:0,assists:0,yellow:1}] }));
    if(t.events.filter(e=>e.kind==="penalty").length>1) return false;
    for(const e of t.events) if((e.events||[]).filter(x=>x.tag==="PENWON"||x.tag==="PENCONC").length>1) return false;
  }
  return true;
`));

// ---------------- sent off: no further events (spec §4) ----------------
check('sent off: a red-carded client features in NO event after his dismissal', run(TL + `
  for(let i=0;i<800;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:1, clients:[
      {player:C,side:"home",goals:0,assists:0,red:1},
      {player:B,side:"home",goals:1,assists:0}] }));
    const involves = (e,p) => e.client===p || (e.events||[]).some(ev=>ev.player===p);
    const rc = t.events.find(e=>(e.events||[]).some(ev=>(ev.tag==="RC"||ev.tag==="Y2C")&&ev.player===C));
    if(!rc) return false;                                  // his red must be narrated
    for(const e of t.events){ if(e===rc) continue; if(involves(e,C) && e.minute>rc.minute) return false; }
  }
  return true;
`));
check('sent off: a client who scores THEN is dismissed still gets his goal, before the red', run(TL + `
  let sawGoalThenRed=false;
  for(let i=0;i<1500;i++){
    const t=LiveSim.buildTimeline(spec({ hg:2, ag:0, clients:[{player:B,side:"home",goals:1,assists:0,red:1}] }));
    const goal=t.events.find(e=>(e.events||[]).some(ev=>ev.tag==="GOAL"&&ev.player===B));
    const rc=t.events.find(e=>(e.events||[]).some(ev=>(ev.tag==="RC"||ev.tag==="Y2C")&&ev.player===B));
    if(!rc) return false;
    if(goal){ if(goal.minute>=rc.minute) return false; sawGoalThenRed=true; }   // goal strictly before the red
  }
  return sawGoalThenRed;
`));
check('sent off: the OTHER team clients are unaffected and still feature normally', run(TL + `
  let otherFeatured=0;
  for(let i=0;i<400;i++){
    const t=LiveSim.buildTimeline(spec({ hg:1, ag:1, clients:[
      {player:C,side:"home",goals:0,assists:0,red:1},
      {player:A,side:"away",goals:0,assists:0}] }));
    if(t.events.some(e=>e.client===A || (e.events||[]).some(ev=>ev.player===A))) otherFeatured++;
    else if(t.events.some(e=>e.side==="away")) {} // A may simply not have drawn an event this match
  }
  return otherFeatured>0;
`));

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll live-sim checks passed.');
process.exitCode = failed ? 1 : 0;
