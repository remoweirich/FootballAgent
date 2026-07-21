// Regression test for the "goal explosion + offers/navigation" batch.
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
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

run(`Clubs.init(); GameState.startNewGame("Switzerland","T");`);

// ---------- item 4: goal distribution ----------
check('GUARD: a lone tracked player at a gutted club no longer eats the team\'s goals', run(`
  const club = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=50 && c.reputation<=65);
  GameState.players = GameState.players.filter(p=>p.clubId!==club.id);
  const gk = PlayerGen.makePlayer(club,{ability:55,age:26,position:"GK"}); gk.squadRole="starter";
  const rb = PlayerGen.makePlayer(club,{ability:60,age:24,position:"RB"});
  rb.styleRole="defensive_fb"; rb.agentId="me"; rb.everClient=true; rb.squadRole="key"; rb.stats={};
  GameState.players.push(gk, rb);
  let team=0;
  for(let m=0;m<38;m++){ const s=Math.floor(Math.random()*4); team+=s; League.assignStats(club.id,"SuperLeagueCH",s,1); }
  const t=seasonTotals(rb,GameState.seasonStartYear);
  return t.goals <= 6;   // was ~56 (97% of everything the team scored)
`));
check('REPAIR: a gutted host club is refilled to a real squad', run(`
  const club = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=50 && c.reputation<=65);
  GameState.players = GameState.players.filter(p=>p.clubId!==club.id);
  const rb = PlayerGen.makePlayer(club,{ability:60,age:24,position:"RB"});
  rb.agentId="me"; rb.everClient=true; rb.squadRole="key"; rb.stats={};
  GameState.players.push(rb);
  __sqCacheWeek=-1;
  const sq = relevantSquads().get(club.id)||[];
  return sq.length >= 14 && sq.filter(p=>p.position==="GK").length >= 2;
`));
check('healthy squads are untouched: striker still scores, defender does not', run(`
  const club = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=50 && c.reputation<=65);
  const mkStar = (pos,style) => {
    GameState.players = GameState.players.filter(p=>p.clubId!==club.id);
    const squad=[];
    for(let i=0;i<20;i++) squad.push(PlayerGen.makePlayer(club,{ability:PlayerGen.gauss(club.reputation,7),age:26,position:i<2?"GK":PlayerGen.randPos()}));
    PlayerGen.assignRoles(squad);
    const s = PlayerGen.makePlayer(club,{ability:65,age:25,position:pos});
    s.styleRole=style; s.agentId="me"; s.everClient=true; s.squadRole="key"; s.stats={};
    GameState.players.push(...squad, s); __sqCacheWeek=-1;
    for(let m=0;m<38;m++) League.assignStats(club.id,"SuperLeagueCH",Math.floor(Math.random()*4),1);
    return seasonTotals(s,GameState.seasonStartYear).goals;
  };
  const st = mkStar("ST","poacher"), lb = mkStar("LB","defensive_fb");
  return st >= 8 && lb <= 6;
`));

// ---------- 1a: a transfer kills open contract proposals ----------
check('1a: accepting a transfer auto-rejects open renewal proposals', run(`
  GameState.startNewGame("Switzerland","T");
  const from = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=50 && c.reputation<=60);
  const to = Clubs.allClubs.find(c=>c.country==="Switzerland" && c.reputation>=50 && c.reputation<=60 && c.id!==from.id);
  const p = GameState.players.find(x=>x.clubId===from.id && x.position!=="GK");
  p.agentId="me"; p.everClient=true; p.ability=55; p.wage=2000; p.wageCommission=10; p.contractUntilSeason=GameState.seasonStartYear+2;
  GameState.week = 2;   // transfer window open
  const rn = { playerId:p.id, clubId:from.id, proposedWage:2500, proposedTermSeasons:2 };
  GameState.addMail({ kind:"renewal", subject:"renew", offer:rn, ttl:3 });
  const tm = { id:"m_tx", kind:"transfer", offer:{ playerId:p.id, fromClubId:from.id, toClubId:to.id, transferFee:100000, proposedWage:2600, role:"rotation" } };
  GameState.inbox.push(tm);
  const r = Agency.acceptTransfer(tm, 2600, "rotation", 2, 0);
  if (!r.ok) { console.log("   (transfer rejected: " + r.message + ")"); return false; }
  const renewalsLeft = GameState.inbox.filter(m=>m.kind==="renewal" && m.offer && m.offer.playerId===p.id).length;
  return renewalsLeft === 0;
`));

// ---------- 1c: no transfer offers for a loaned player ----------
check('1c: shopPlayer refuses while he is out on loan', run(`
  const p = GameState.players.find(x=>x.agentId==="me");
  const other = Clubs.allClubs.find(c=>c.id!==p.clubId);
  p.onLoanAt = other.id;
  const r = Agency.shopPlayer(p, other.id);
  p.onLoanAt = null;
  return r.ok === false && /loan/i.test(r.message);
`));
check('1c: weekly offer generation skips loaned players', run(`
  const p = GameState.players.find(x=>x.agentId==="me");
  p.onLoanAt = Clubs.allClubs.find(c=>c.id!==p.clubId).id;
  GameState.inbox = [];
  for (let i=0;i<40;i++) Sim._generateOffers([]);
  const got = GameState.inbox.filter(m=>m.kind==="transfer" && m.offer.playerId===p.id).length;
  p.onLoanAt = null;
  return got === 0;
`));
check('1c: a pending bid lapses instead of re-bidding once he goes on loan', run(`
  const p = GameState.players.find(x=>x.agentId==="me");
  const to = Clubs.allClubs.find(c=>c.id!==p.clubId);
  p.onLoanAt = to.id;
  GameState.inbox = [{ id:"m_p", kind:"transfer", persistence:2, ttl:1, offer:{ playerId:p.id, toClubId:to.id, fromClubId:p.clubId, transferFee:50000, proposedWage:1000 } }];
  Sim._expireMail ? Sim._expireMail([]) : null;
  const improved = GameState.inbox.filter(m=>m.kind==="transfer" && /improve/i.test(m.subject||"")).length;
  p.onLoanAt = null;
  return improved === 0;
`));

// ---------- 3: back navigation ----------
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'router.js'), 'utf8'), sb, { filename: 'router.js' });
run(`
  Router.renderShell = function(){}; Router.closeSheet=function(){}; Router.closeModal=function(){};
  Router.register("clients", { isMain:true, title:"Clients", render(){} });
  Router.register("inbox", { isMain:false, title:"Inbox", render(){} });
  Router.register("client", { isMain:false, parent:"clients", title:"P", render(){} });
  Router.register("mail", { isMain:false, parent: () => "client/PX", title:"M", render(){} });
  window.__nav = h => { location.hash = "#" + h; Router.route(true); };
`);
check('3: clicking through 8 offers then back lands on the player, not offer #7', run(`
  location.hash=""; Router._lastHash=null; Router.navStack.length=0;
  window.__nav("clients");
  window.__nav("client/PX");
  for (let i=1;i<=8;i++) window.__nav("mail/m"+i);
  Router.back();
  // lands on the player (not offer #7); the remaining crumb is 'clients', so a second back goes UP again
  return location.hash.replace(/^#/,"") === "client/PX" && Router.navStack.join() === "clients";
`));
check('3: back from a deep-linked offer falls back to the declared parent', run(`
  location.hash=""; Router._lastHash=null; Router.navStack.length=0;
  window.__nav("mail/m3");            // deep link, nothing stacked
  Router.back();
  return location.hash.replace(/^#/,"") === "client/PX";
`));
check('3: back from the player page goes up to Clients', run(`
  location.hash=""; Router._lastHash=null; Router.navStack.length=0;
  window.__nav("client/PX");
  Router.back();
  return location.hash.replace(/^#/,"") === "clients";
`));
check('3: genuine drill-down still returns where you came from', run(`
  location.hash=""; Router._lastHash=null; Router.navStack.length=0;
  window.__nav("inbox");
  window.__nav("mail/m1");
  Router.back();
  return location.hash.replace(/^#/,"") === "inbox";
`));

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll batch-4 checks passed.');
process.exitCode = failed ? 1 : 0;
