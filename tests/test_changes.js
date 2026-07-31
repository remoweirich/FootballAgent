// Regression test for the 12-item change batch. Loads the real engine + mobile UI screen modules
// under a vm sandbox with light UI/Router/document stubs, drives two seasons so Europe/clubHistory
// populate, then exercises the new code paths.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
const uiFiles = ['i18n-en.js', 'shim.js', 'screen-leagues.js', 'screen-clients.js', 'screen-club.js', 'screen-client-detail.js', 'screen-setup.js', 'screen-finance.js', 'screen-agency.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const els = {};
const mkEl = () => ({ innerHTML: '', style: {}, querySelectorAll: () => [], addEventListener() {} });
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.map(x => x && x.stack ? x.stack : String(x)).join(' ')) },
    setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(),
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: id => els[id] || null, createElement: mkEl },
    window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
    location: { hash: '' },
};
sb.Router = {
    register() {}, link: (a, b) => `#${a}/${b}`, refresh() {}, go(h) { sb.location.hash = h; },
    sheet() {}, result() {}, closeSheet() {}, isFreshNav: false
};
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
for (const f of uiFiles) vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Switzerland','Testers FC');`);

// ---- item 2: loan geography weighting ----
check('loan weight: domestic > neighbour > far', runv(`
  const home = Agency._loanCountryWeight('Switzerland','Switzerland',35);
  const nb   = Agency._loanCountryWeight('Switzerland','Germany',35);
  const far  = Agency._loanCountryWeight('Switzerland','Portugal',35);
  return home > nb && nb > far && far >= 0;
`));
check('loan weight: better players draw more from abroad (flatter decay)', runv(`
  const lo = Agency._loanCountryWeight('Switzerland','Germany',35);
  const hi = Agency._loanCountryWeight('Switzerland','Germany',80);
  return hi > lo;
`));
check('weighted loan picks skew domestic for a low-level player', runv(`
  const cands = Clubs.allClubs.map(c => ({ id:c.id, country:c.country }));
  let dom = 0, tot = 0;
  for (let i=0;i<400;i++){ const picks = Agency._weightedLoanPicks(cands, 'Switzerland', 35, 3); picks.forEach(pk => { tot++; if (pk.country==='Switzerland') dom++; }); }
  return dom/tot > 0.5;   // majority of loan interest comes from home
`));

// ---- item 3: fewer clubs bite (unit: bite chance path) ----
// drive two seasons so Europe + clubHistory + clubEuropeBest populate
runv(`for(let sea=0;sea<2;sea++){ for(let i=0;i<60;i++){ const r=Sim.advanceWeek(); if(r.rolledSeason) break; } }`);
check('two seasons advanced; clubHistory populated', runv(`return Object.keys(GameState.clubHistory||{}).length > 0`));
check('completed Europe edition available', runv(`return !!(GameState.lastSeasonReport && GameState.lastSeasonReport.europe && GameState.lastSeasonReport.europe.comps.UCL.ko.winner)`));

// ---- item 11: best European stages recorded ----
check('Europe.bestStages returns per-comp club stage maps', runv(`
  const bs = Europe.bestStages(GameState.lastSeasonReport.europe);
  const ucl = bs.UCL || {};
  const winner = GameState.lastSeasonReport.europe.comps.UCL.ko.winner;
  return Object.keys(ucl).length >= 36 && ucl[winner] === 7;   // winner reached stage 7
`));
check('GameState.clubEuropeBest recorded and persists best run', runv(`
  const keys = Object.keys(GameState.clubEuropeBest||{});
  if (!keys.length) return false;
  // every recorded entry is {stage, year}
  return keys.every(k => Object.values(GameState.clubEuropeBest[k]).every(v => v && typeof v.stage==='number' && typeof v.year==='number'));
`));

// ---- item 10: competition history ----
check('CompHistory.winnersOf(home league) returns champions', runv(`
  const div = COUNTRY_DIVS['Switzerland'][0];
  const w = CompHistory.winnersOf(div);
  return w.length >= 1 && w.every(x => x.clubId && typeof x.year==='number');
`));
check('CompHistory.winnersOf(UCL) finds a European winner', runv(`
  const w = CompHistory.winnersOf('UCL');
  return w.length >= 1;
`));
check('CompHistory renders winners + clients without throwing', runv(`
  const el = { innerHTML:'' };
  CompHistory.render(el, COUNTRY_DIVS['Switzerland'][0]);
  const hadWinners = el.innerHTML.includes('Roll of honour') || el.innerHTML.includes('No winners');
  CompHistory.setTab(COUNTRY_DIVS['Switzerland'][0], 'players');
  CompHistory.render(el, COUNTRY_DIVS['Switzerland'][0]);
  return hadWinners && (el.innerHTML.includes('Sort') || el.innerHTML.includes('No clients') || el.innerHTML.includes('apps'));
`));
check('CompHistory handles a cup and a European comp', runv(`
  const el = { innerHTML:'' };
  CompHistory.render(el, 'SCHWCUP'); const a = el.innerHTML.length > 20;
  CompHistory.render(el, 'UEL'); const b = el.innerHTML.length > 20;
  return a && b;
`));

// ---- item 9: openFor deep-link ----
check('LeaguesScreen.openFor sets country+division and navigates', runv(`
  const div = COUNTRY_DIVS['Germany'][1];
  LeaguesScreen.openFor(div);
  return LeaguesScreen.state.country==='Germany' && LeaguesScreen.state.division===div && LeaguesScreen.state.tab==='tables' && sb_hash()==='leagues';
  function sb_hash(){ return location.hash; }
`));

// ---- plant a client with history + stats for the client-facing items ----
runv(`
  window.__cid = null;
  const p = GameState.players.find(pp => pp.clubId && Clubs.getClubById(pp.clubId) && !isReserveClub(pp.clubId));
  const club = Clubs.getClubById(p.clubId); const div = club.division; const yr = GameState.seasonStartYear;
  p.agentId = 'me'; p.everClient = true; p.wageCommission = 10; p.sponsorCommission = 10; p.repUntilSeason = yr + 3;
  p.wage = 10750;
  p.history = { ability:[{t:GameState.absWeek()-104, value:45},{t:GameState.absWeek(), value:62}], wage:[{t:GameState.absWeek()-104, value:2000},{t:GameState.absWeek()-52, value:5000},{t:GameState.absWeek(), value:10750}], fees:[{t:GameState.absWeek()-52, age:17, value:250000}] };
  p.stats = {}; p.stats[yr] = {}; p.stats[yr][p.clubId] = { clubId:p.clubId, loan:false, youth:false, order:yr*100, comps:{} };
  p.stats[yr][p.clubId].comps[div] = { apps:30, goals:12, assists:7, cs:0, yellow:4, red:1, ratingSum:213 };
  p.trophies = [{ year:yr, compId:div, clubId:p.clubId }];
  window.__cid = p.id; window.__div = div;
`);

// ---- item 1: development charts (compact axis labels, few gridlines, no clipping) ----
check('tabDevelopment uses compact axis labels, no un-abbreviated fee axis', runv(`
  const p = GameState.getPlayer(window.__cid);
  const html = ClientDetail.tabDevelopment(p);
  const compact = /€\\d+(?:\\.\\d)?k/.test(html);       // e.g. "€5k"/"€250k" axis labels present
  const noRawFeeAxis = !html.includes('€250,000');     // the old clipped fee axis format is gone
  return html.includes('Ability') && html.includes('Wage') && html.includes('Transfer fees') && compact && noRawFeeAxis;
`));
check('CompHistory.playerRows includes a client who featured', runv(`
  const rows = CompHistory.playerRows(window.__div);
  return rows.some(r => r.p.id === window.__cid && r.apps === 30 && r.goals === 12 && r.titles === 1);
`));
check('niceAxis caps gridline count (<=6 wage steps over the range)', runv(`
  const a = UI.niceAxis(2000, 10750, 4);
  const steps = Math.round((a.max - a.min)/a.step);
  return steps >= 2 && steps <= 6;
`));

// ---- item 5: Joining NaN/NaN fix ----
check('contractText shows a real season for a pending join (no NaN)', runv(`
  const p = GameState.getPlayer(window.__cid);
  p.joiningClubId = Clubs.allClubs[0].id; delete p._joinSeason;   // legacy state
  const t1 = ClientDetail.contractText(p);
  p._joinSeason = GameState.seasonStartYear + 1;
  const t2 = ClientDetail.contractText(p);
  delete p.joiningClubId;
  return t1.startsWith('Joining') && !t1.includes('NaN') && t2.includes('Joining') && !t2.includes('NaN');
`));

// ---- item 4: loan-shop gating ----
check('shopPlayerLoan blocked until club sanctions, allowed after', runv(`
  const p = GameState.getPlayer(window.__cid);
  p.onLoanAt = null; p.pendingTransfer = null; p._loanOk = false;
  const target = Clubs.allClubs.find(c => c.id !== p.clubId).id;
  const before = Agency.shopPlayerLoan(p, target);
  p._loanOk = true;
  const canLoan = Agency.canLoanShop(p);
  return before.ok === false && before.message.includes('sanction') && canLoan === true;
`));

// ---- item 6: Listed filter ----
check('Clients "listed" filter selects transfer/loan-listed clients', runv(`
  const p = GameState.getPlayer(window.__cid);
  p.transferListed = true;
  ClientsScreen.state.filter = 'listed';
  const rows = ClientsScreen.filtered();
  p.transferListed = false;
  return rows.some(r => r.p.id === window.__cid);
`));

// ---- item 12: records ----
check('ClientRecords.compute returns records incl. season + wage + fee', runv(`
  const players = GameState.players.filter(p => p.everClient);
  const recs = ClientRecords.compute(players);
  const labels = recs.map(r => r.label);
  return recs.length >= 3 && labels.includes('Highest wage') && labels.includes('Highest transfer fee') && recs.every(r => r.p);
`));
check('ClientRecords includes the newly-added records', runv(`
  const p = GameState.getPlayer(window.__cid);
  // give the planted client sponsor income, movements and a second scoring season so new records populate
  p.sponsorDeals = [{ company:'X', weekly:1200, annual:0, untilSeason:GameState.seasonStartYear+1 }]; p.sponsorIncome = 1200;
  p.movements = [{year:GameState.seasonStartYear, type:'promo', division:window.__div},{year:GameState.seasonStartYear, type:'releg', division:window.__div}];
  const yr2 = GameState.seasonStartYear - 1;
  p.stats[yr2] = {}; p.stats[yr2][p.clubId] = { clubId:p.clubId, loan:false, youth:false, order:yr2*100, comps:{} };
  p.stats[yr2][p.clubId][window.__div] = undefined;
  p.stats[yr2][p.clubId].comps = {}; p.stats[yr2][p.clubId].comps[window.__div] = { apps:20, goals:5, assists:3, cs:0, yellow:1, red:0, ratingSum:140 };
  const recs = ClientRecords.compute(GameState.players.filter(pp => pp.everClient));
  const L = recs.map(r => r.label);
  const need = ['Most goal involvements','Youngest goalscorer','Oldest goalscorer','Most clubs played for','Longest spell at one club','Highest sponsor income','Most promotions','Most relegations'];
  const missing = need.filter(n => !L.includes(n));
  if (missing.length) { console.log('   missing:', missing.join(', ')); return false; }
  // sanity: youngest/oldest are ages, sponsor income is €/wk, promotions/relegations are counts
  const yg = recs.find(r=>r.label==='Youngest goalscorer'), sp = recs.find(r=>r.label==='Highest sponsor income');
  const spell = recs.find(r=>r.label==='Longest spell at one club');
  return /y$/.test(yg.value) && /\\/wk$/.test(sp.value) && /season/.test(spell.value);
`));
check('ClientRecords renders without throwing', runv(`const el={innerHTML:''}; ClientRecords.render(el); return el.innerHTML.includes('record') || el.innerHTML.includes('Highest') || el.innerHTML.includes('Most');`));

// ---- item 8: tutorial slide present ----
check('setup slides include a club-reputation slide', runv(`return Setup.slides.some(s => /rise and fall|reputation/i.test(I18n.t('setup.' + s.id + '.title') + ' ' + I18n.t('setup.' + s.id + '.text')));`));

// ---- follow-up: non-top-division title counts as a promotion in records ----
check('a non-top-division title adds to Most promotions (no extra arrow needed)', runv(`
  const p = GameState.getPlayer(window.__cid);
  const div2 = COUNTRY_DIVS['Switzerland'][1];   // a NON-top Swiss division
  const topDiv = COUNTRY_DIVS['Switzerland'][0];
  p.movements = [];   // no recorded promo movements
  p.trophies = [{ year:GameState.seasonStartYear, compId:div2, clubId:p.clubId }];   // won a 2nd-tier title
  let recs = ClientRecords.compute([p]);
  const promoRec = recs.find(r => r.label === 'Most promotions');
  const one = promoRec && promoRec.value === '1';
  // a TOP-division title must NOT count as a promotion
  p.trophies = [{ year:GameState.seasonStartYear, compId:topDiv, clubId:p.clubId }];
  recs = ClientRecords.compute([p]);
  const none = !recs.find(r => r.label === 'Most promotions');
  return one && none;
`));

// ---- follow-up: exceptional-season message needs 30 games ----
check('season-to-remember requires 30+ apps for the message', runv(`
  return MORALE.HOT_FORM_MSG_MIN_APPS === 30 && MORALE.HOT_FORM_AVG_RATING === 7.5;
`));

// ---- follow-up: debug gating on finance + potential ----
check('finance debug controls hidden by default, shown when debug on', runv(`
  const el = { innerHTML:'' };
  GameState.debug = false; FinanceScreen.render(el);
  const offHidden = !el.innerHTML.includes('Set balance') && el.innerHTML.includes('Debug mode');
  GameState.debug = true; FinanceScreen.render(el);
  const onShown = el.innerHTML.includes('Set balance') && el.innerHTML.includes('Reputation');
  GameState.debug = false;
  return offHidden && onShown;
`));
check('potential tab hides age/true-potential unless debug on; shows true potential when on', runv(`
  const p = GameState.getPlayer(window.__cid);
  GameState.debug = false;
  const off = ClientDetail.tabPotential(p);
  GameState.debug = true;
  const on = ClientDetail.tabPotential(p);
  GameState.debug = false;
  return !off.includes('True potential') && !off.includes('dbgAge') && on.includes('True potential') && on.includes(String(p.potential)) && on.includes('dbgAge');
`));
check('enabling debug persists the flag', runv(`
  GameState.debug = false; FinanceScreen.doEnableDebug();
  const on = GameState.debug === true;
  GameState.debug = false;
  return on;
`));

// ---- follow-up: agency info boxes link to clients/scouting ----
check('agency clients/scouts boxes link to their pages', runv(`
  const el = { innerHTML:'' }; AgencyScreen.render(el);
  return el.innerHTML.includes('href="#clients"') && el.innerHTML.includes('href="#scouting"');
`));

check('no runtime errors thrown, got: ' + JSON.stringify(errors.slice(0,3)), errors.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll change-batch checks passed.');
process.exitCode = failed ? 1 : 0;
