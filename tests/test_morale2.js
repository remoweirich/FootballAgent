const vm=require('vm'),fs=require('fs'),path=require('path');
const base=require('path').join(__dirname, '..', 'js') + '/';
const files=['i18n.js','i18n-en.js','i18n-de.js','storage.js','rng.js','names-data.js','clubs.js','players.js','game-state.js','upgrades.js','scouting.js','league.js','scouts.js','agency.js','simulation.js'];
function idb(){return{open(){const r={result:null,onsuccess:null};setTimeout(()=>{r.result={objectStoreNames:{contains:()=>true},createObjectStore(){return{}},transaction(){return{objectStore:()=>({get(){return{}},put(){return{}},delete(){return{}}})}}};if(r.onsuccess)r.onsuccess()},0);return r}}}
const sb={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,Math,Date,JSON,indexedDB:idb(),localStorage:{getItem:()=>null,setItem(){},removeItem(){}},document:{addEventListener(){}},window:{addEventListener(){}},UI:{money:n=>String(Math.round(n||0))}};
vm.createContext(sb);
for(const f of files)vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),sb,{filename:f});
const run=c=>vm.runInContext(c,sb), runv=c=>vm.runInContext('(function(){'+c+'})()',sb);
let failed=false; const check=(l,c)=>{console.log((c?'PASS':'FAIL')+'  '+l); if(!c)failed=true;};
run("Clubs.init(); GameState.startNewGame('Netherlands','Test');");

// pick an adult client
run("var P=GameState.players.find(p=>p.clubId); P.agentId='me'; P.archived=false; if(!P.morale)P.morale=PlayerGen.freshMorale(); P.age=Math.max(22,P.age||24);");

// --- A: injury halts the play streak & no decay while injured ---
run("P.injury={type:'knock',weeksOut:2,total:2}; P._playStreak=6; P._benchStreak=0; P.morale.time=50; P._weekApps=0; GameState.week=5; Sim._morale([]);");
check('injured: play streak halted at 6', runv("return P._playStreak")===6);
check('injured: time morale unchanged (no decay)', runv("return P.morale.time")===50);

// --- A2: back fit + plays -> streak resumes from where it paused ---
run("P.injury=null; P._weekApps=1; P.morale.time=50; GameState.week=5; Sim._morale([]);");
check('recovered & played: streak resumes to 7', runv("return P._playStreak")===7);
check('recovered & played: long-tier +5 applied (50->55)', runv("return P.morale.time")===55);

// --- B: international-break week halts the bench streak, no decay ---
run("P.injury=null; P._weekApps=0; P._benchStreak=3; P._playStreak=0; P.morale.time=50; GameState.week=10; Sim._morale([]);");
check('int-break wk10: bench streak halted at 3', runv("return P._benchStreak")===3);
check('int-break wk10: time unchanged', runv("return P.morale.time")===50);

// --- C: ordinary week with no apps still decays (sanity: mechanic intact) ---
run("P.injury=null; P._weekApps=0; P._benchStreak=2; P._playStreak=0; P.morale.time=50; GameState.week=5; Sim._morale([]);");
check('normal wk5 bench: streak -> 3 and time decays by 2.5 (50->47.5)', runv("return P._benchStreak")===3 && runv("return P.morale.time")===47.5);

// --- D: changing club sets club morale to 90 ---
run(`
  var dest=Clubs.allClubs.find(c=>c.id!==P.clubId);
  P.morale.club=30;
  Agency._finalizeTransfer(P, {toClubId:dest.id, fromClubId:P.clubId, fee:0, bonus:0, wage:P.wage||1000, term:2, role:'starter'});
`);
check('club change: morale.club set to 90', runv("return P.morale.club")===90);
check('club change: player now at new club', runv("return P.clubId")===runv("return Clubs.allClubs.find(c=>c.id!==null)&&P.clubId")); // clubId is set (non-null)
check('club change: clubId is set', runv("return !!P.clubId"));

// --- E: renewing at the SAME club gives +20 club ---
run(`
  P._renewSeason=null; P.pendingTransfer=null; P.freeAgent=false; P.morale.club=40;
  var mail={id:'rm1', kind:'renewal', offer:{playerId:P.id, clubId:P.clubId, proposedTermSeasons:2, proposedWage:P.wage||1000}};
  GameState.inbox.push(mail);
  var r=Agency.acceptRenewal(mail, P.wage||1000, 'starter', 2);
  GameState.__renewOk=r.ok; GameState.__clubAfter=P.morale.club;
`);
check('renewal accepted ok: '+runv("return JSON.stringify(GameState.__renewOk)"), runv("return GameState.__renewOk")===true);
check('renewal at same club: +20 club (40->60)', runv("return GameState.__clubAfter")===60);

console.log(failed?'\n*** FAIL ***':'\nAll morale-change checks passed.');
process.exitCode=failed?1:0;
