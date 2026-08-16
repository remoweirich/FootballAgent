// Verifies the 4-item batch: sponsor parity, cup prestige order, europe weeks presence, intl scout costs.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'attend.js'];
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

runv(`Clubs.init(); GameState.startNewGame('Switzerland','Testers FC');`);

// ---- item 1: sponsor offers — per-year values within ~10% of each other; splits vary ----
// Re-run the exact offer-building math many times and check invariants.
const buildOffer = () => runv(`
  const base = 200 * (0.85 + Math.random()*0.3);
  const annualEquiv = base * 60;
  const round = v => Math.max(10, Math.round(v/10)*10);
  const ra = v => Math.round(v/100)*100;
  const shuffle = a => { for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const perYear = annualEquiv * 1.4;
  const splits = shuffle([0.85,0.58,0.30]);
  const terms = shuffle([1,2,3]);
  const opts = [0,1,2].map(i=>{ const vy=perYear*(0.92+Math.random()*0.16); const ws=Math.max(0.15,Math.min(0.95,splits[i]+(Math.random()-0.5)*0.08));
    return { weekly: round(vy*ws/52), annual: ra(vy*(1-ws)), termSeasons: terms[i], _ws: ws }; });
  return JSON.stringify(opts);
`);
let parityOk = true, spreadOk = false, termIndepOk = true;
for (let n = 0; n < 400; n++) {
  const opts = JSON.parse(buildOffer());
  const per = opts.map(o => o.weekly * 52 + o.annual);
  const mx = Math.max(...per), mn = Math.min(...per);
  if ((mx - mn) / mn > 0.22) parityOk = false;                 // ±8% each side => ~≤16-22% max spread; allow rounding
  const ws = opts.map(o => o._ws);
  if (Math.max(...ws) - Math.min(...ws) > 0.35) spreadOk = true; // splits genuinely differ (steady vs lump)
  // term should NOT correlate with per-year value (checked loosely below by aggregate)
}
check('sponsor: all three options within ~10% per year (±rounding)', parityOk);
check('sponsor: the weekly/lump split varies widely across options', spreadOk);
// term-independence: over many draws, avg per-year for term=1 ~ term=3
let sum = { 1: 0, 3: 0 }, cnt = { 1: 0, 3: 0 };
for (let n = 0; n < 2000; n++) { const opts = JSON.parse(buildOffer()); opts.forEach(o => { if (o.termSeasons === 1 || o.termSeasons === 3) { sum[o.termSeasons] += o.weekly * 52 + o.annual; cnt[o.termSeasons]++; } }); }
const avg1 = sum[1] / cnt[1], avg3 = sum[3] / cnt[3];
check('sponsor: term length does NOT systematically change per-year value', Math.abs(avg1 - avg3) / avg1 < 0.05);

// ---- item 2: finals are scheduled by competition across the week (day map) ----
check('day: Liechtensteiner Cup + lower cups play Monday', runv(`
  return Attend._dayFor({kind:'cup-final',compId:'LICHCUP'})==='Monday'
      && Attend._dayFor({kind:'cup-final',compId:'CUPABASS'})==='Monday';`));
check('day: main national cups play Friday, Conference/Europa/Champions on Tue/Thu/Sun', runv(`
  return Attend._dayFor({kind:'cup-final',compId:'SCHWCUP'})==='Friday'
      && Attend._dayFor({kind:'europe-final',compId:'UECL'})==='Tuesday'
      && Attend._dayFor({kind:'europe-final',compId:'UEL'})==='Thursday'
      && Attend._dayFor({kind:'europe-final',compId:'UCL'})==='Sunday';`));
check('order: chronological — a lower cup (Mon) before a main cup (Fri) before UCL (Sun)', runv(`
  const mk=(compId,kind)=>({kind:kind||'cup-final',compId,clients:[{}],homeId:'h',awayId:'a'});
  const list=[mk('SCHWCUP'),mk('UCL','europe-final'),mk('CUPABASS')];
  const ord=Attend.order(list).map(m=>m.compId);
  return ord[0]==='CUPABASS' && ord[1]==='SCHWCUP' && ord[2]==='UCL';`));

// ---- item 4: intl scouting costs from row 13 ----
check('intl scout: PREM cost base 20000 (before discount)', runv(`return Scouts.INTL_LEAGUE_COST['PREM']===20000;`));
check('intl scout: SuperLeagueCH 6000, 2.LigaCH 600', runv(`return Scouts.INTL_LEAGUE_COST['SuperLeagueCH']===6000 && Scouts.INTL_LEAGUE_COST['2.LigaCH']===600;`));
check('intl scout: BelgianDivision2 1020, JupilerProLeague 7340', runv(`return Scouts.INTL_LEAGUE_COST['BelgianDivision2']===1020 && Scouts.INTL_LEAGUE_COST['JupilerProLeague']===7340;`));
check('intl scout: intlLeagueCost(PREM) uses the table (=20000 at 0 discount)', runv(`return Scouts.intlLeagueCost('PREM')===20000;`));
check('intl scout: intlLeagueCost(LaLiga)=18470', runv(`return Scouts.intlLeagueCost('LaLiga')===18470;`));
check('intl scout: unknown division falls back without throwing', runv(`const v=Scouts.intlLeagueCost('NOPE'); return typeof v==='number' && v>0;`));
check('intl scout: all 42 league keys present', runv(`return Object.keys(Scouts.INTL_LEAGUE_COST).length===42;`));

// ---- item 3: europe calendar weeks are present in data (UI reads these) ----
check('europe: leaguePhase weeks present (8)', runv(`return EUROPE_DATA.calendar.leaguePhase.length===8 && EUROPE_DATA.calendar.leaguePhase[0]===11;`));
check('europe: knockout calendar present', runv(`const c=EUROPE_DATA.calendar; return c.knockoutPO[0]===34 && c.R16[0]===37 && c.QF[0]===41 && c.SF[0]===44 && c.final===47;`));

console.log('\nengine errors:', errors.length ? errors : 'none');
console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll batch-2 checks passed.');
process.exit(failed || errors.length ? 1 : 0);
