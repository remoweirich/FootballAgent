// Verifies the wage/value/pens/sponsor/promotion changes in this batch.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = {
  console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) },
  setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {} }) },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
  location: { hash: '' },
};
sb.Router = { register() {}, link: (a, b) => `#${a}/${b}`, refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {} };
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands','Testers FC');`);

// ---- item 3: penFixPair repairs impossible shootouts, leaves valid ones ----
check('pens: 5-1 (impossible) repaired to 5-3', runv(`return League.penFixPair(5,1).join('-')==='5-3';`));
check('pens: 5-2 repaired to 5-3', runv(`return League.penFixPair(5,2).join('-')==='5-3';`));
check('pens: 4-0 repaired to 4-1', runv(`return League.penFixPair(4,0).join('-')==='4-1';`));
check('pens: 7-2 (impossible) repaired to 7-6', runv(`return League.penFixPair(7,2).join('-')==='7-6';`));
check('pens: 4-2 (valid) untouched', runv(`return League.penFixPair(4,2).join('-')==='4-2';`));
check('pens: 5-4 (valid SD) untouched', runv(`return League.penFixPair(5,4).join('-')==='5-4';`));
check('pens: orientation preserved (loser larger side)', runv(`return League.penFixPair(1,5).join('-')==='3-5';`));

// ---- item 1: youth wage caps ----
check('youth cap: 15yo, rep 60, pot 85 capped at 7500', runv(`
  return PlayerGen.capYouthWage(18000, 15, 60, 85) === 7500;`));
check('youth cap: 16yo capped at 15000', runv(`return PlayerGen.capYouthWage(40000,16,60,80)===15000;`));
check('youth cap: 82+ rep club uncapped', runv(`return PlayerGen.capYouthWage(18000,15,84,85)===18000;`));
check('youth cap: pot>90 uncapped', runv(`return PlayerGen.capYouthWage(18000,15,60,92)===18000;`));
check('youth cap: 18yo untouched (no cap key)', runv(`return PlayerGen.capYouthWage(18000,18,60,85)===18000;`));

// ---- item 1: loyalty / perf multipliers ----
check('perfWageMult tiers: >8=1.6, >7.5=1.25, >7.24=1.1, else 1', runv(`
  const A=Agency; A.recentSeasonRating=()=>8.1; const a=A.perfWageMult({});
  A.recentSeasonRating=()=>7.6; const b=A.perfWageMult({});
  A.recentSeasonRating=()=>7.3; const c=A.perfWageMult({});
  A.recentSeasonRating=()=>6.8; const d=A.perfWageMult({});
  return a===1.6 && b===1.25 && c===1.1 && d===1;`));
check('loyaltyMult: 10y at 28yo ~ +50%', runv(`
  const orig=Sim._seasonsAtClub;
  Sim._seasonsAtClub=()=>10; const m=Agency.loyaltyMult({age:28}); Sim._seasonsAtClub=orig;
  return Math.abs(m-1.5)<1e-9;`));
check('loyaltyMult: decays past 32 toward 5% floor', runv(`
  const orig=Sim._seasonsAtClub; Sim._seasonsAtClub=()=>10;
  const at35=Agency.loyaltyMult({age:35}); Sim._seasonsAtClub=orig;
  // 0.5 - 0.15*3 = 0.05 -> 1.05
  return Math.abs(at35-1.05)<1e-9;`));
check('loyaltyMult: new signing (0y) gets no floor bonus even when old', runv(`
  const orig=Sim._seasonsAtClub; Sim._seasonsAtClub=()=>0;
  const m=Agency.loyaltyMult({age:36}); Sim._seasonsAtClub=orig; return m===1;`));

// ---- item 1: country wage spread reflected in an offer ----
check('country: England outpays Portugal for the same player', runv(`
  const p={ability:75,age:26,potential:78,clubId:null};
  const eng={reputation:75,country:'England',id:'e'};
  const por={reputation:75,country:'Portugal',id:'p'};
  let en=0,po=0; for(let i=0;i<200;i++){ en+=Agency.offeredWage(p,eng,{loyalty:false});
    po+=Agency.offeredWage(p,por,{loyalty:false}); }
  return en > po*1.25;`));

// ---- item 2: age depreciation ratios vs a 26yo ----
check('value: 31yo ~35% less than 26yo (same ability)', runv(`
  const mk=age=>({ability:80,age,potential:80,contractUntilSeason:GameState.seasonStartYear+3});
  Agency.recentSeasonRating=()=>6.8; // neutralise form
  const base=Agency.playerValue(mk(26)), v31=Agency.playerValue(mk(31));
  return Math.abs(v31/base - 0.65) < 0.02;`));
check('value: 35yo ~80% less', runv(`
  const mk=age=>({ability:80,age,potential:80,contractUntilSeason:GameState.seasonStartYear+3});
  const base=Agency.playerValue(mk(26)), v=Agency.playerValue(mk(35));
  return Math.abs(v/base - 0.20) < 0.02;`));
check('value: 37yo ~95% less', runv(`
  const mk=age=>({ability:80,age,potential:80,contractUntilSeason:GameState.seasonStartYear+3});
  const base=Agency.playerValue(mk(26)), v=Agency.playerValue(mk(38));
  return Math.abs(v/base - 0.05) < 0.01;`));
check('value: monotonic non-increasing 30..37', runv(`
  const mk=age=>({ability:80,age,potential:80,contractUntilSeason:GameState.seasonStartYear+3});
  let ok=true,prev=Infinity; for(let a=30;a<=38;a++){const v=Agency.playerValue(mk(a)); if(v>prev+1)ok=false; prev=v;} return ok;`));

// ---- item 10: sponsor cap ----
check('sponsor cap: acceptSponsor blocked at 2 active deals', runv(`
  const p=Agency.clients()[0]||GameState.players[0];
  p.sponsorDeals=[{untilSeason:GameState.seasonStartYear+1,weekly:100},{untilSeason:GameState.seasonStartYear+1,weekly:100}];
  const mail={offer:{playerId:p.id,options:[{company:'X',weekly:50,annual:0,termSeasons:1}]}};
  const r=Agency.acceptSponsor(mail,0);
  return r.ok===false && /two|2|most/i.test(r.message);`));
check('sponsor cap: allowed again after one expires', runv(`
  const p=GameState.players[0];
  p.sponsorDeals=[{untilSeason:GameState.seasonStartYear-1,weekly:100},{untilSeason:GameState.seasonStartYear+1,weekly:100}];
  return Agency.activeSponsorCount(p)===1;`));

// ---- item 11: promotion any time + wage logic ----
check('promotion: sub-2k youth gets a pro deal on promotion', runv(`
  const parent={id:'PC',tier:1,reputation:70,country:'Netherlands'};
  const p={id:'yp',age:18,ability:64,potential:82,wage:800,clubId:'RES',squadRole:'starter',agentId:'me'};
  const res=Agency._promoteToSenior(p,parent);
  return res.pro===true && p.clubId==='PC' && p.wage>=2500 && p.onLoanAt===null;`));
check('promotion: already-pro youth pulled up on existing wage (no bump)', runv(`
  const parent={id:'PC',tier:1,reputation:70,country:'Netherlands'};
  const p={id:'yp2',age:19,ability:70,potential:82,wage:5000,clubId:'RES',squadRole:'starter'};
  const res=Agency._promoteToSenior(p,parent);
  return res.pro===false && p.wage===5000 && p.clubId==='PC';`));

console.log('\nengine errors:', errors.length ? errors : 'none');
console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll wage-batch checks passed.');
process.exit(failed || errors.length ? 1 : 0);
