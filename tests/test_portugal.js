// Portugal integration test: wiring, sizes, colours/cities, reserve rules, cups, play-offs,
// multi-season size stability, no B-team ever in the Primeira Liga, guardrails silent.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = require('path').join(__dirname, '..', 'js') + '/';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = { console: { log() { }, warn() { }, error: (...a) => errors.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('{' + c + '}', sb);
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

run(`Clubs.init(); GameState.startNewGame('Portugal', 'Test SC');`);

// ---- wiring ----
check('Portugal is a home country', runv(`return Object.keys(REGIONS_BY_COUNTRY).includes('Portugal') && GameState.homeCountry==='Portugal'`));
check('4 divisions in COUNTRY_DIVS', runv(`return (COUNTRY_DIVS.Portugal||[]).length===4`));
check('divisions in COMPETITIONS', runv(`return ['LigaPortugal','LigaPortugal2','Liga3','Liga4'].every(d=>COMPETITIONS[d])`));
check('cups wired', runv(`return (COUNTRY_CUPS.Portugal||[]).map(c=>c[0]).join(',')==='tacaportugal,segundataca'`));
check('DIV_TIERS 1..4', runv(`return Clubs.DIV_TIERS.LigaPortugal===1 && Clubs.DIV_TIERS.Liga4===4`));
check('Portugal scout names present', runv(`return SCOUT_NAMES.Portugal && SCOUT_NAMES.Portugal.first.length>5`));

// ---- sizes ----
const sizes = () => runv(`return JSON.stringify(['LigaPortugal','LigaPortugal2','Liga3','Liga4'].map(d=>Clubs.getClubsByDivision(d).length))`);
check('static sizes 18/18/20/24', runv(`return JSON.stringify(['LigaPortugal','LigaPortugal2','Liga3','Liga4'].map(d=>Clubs.staticDivSize(d)))`) === JSON.stringify([18, 18, 20, 24]));
check('initial members 18/18/20/24', sizes() === JSON.stringify([18, 18, 20, 24]));

// ---- colours + cities ----
const badCol = runv(`const hex=/^#[0-9A-Fa-f]{6}$/;return JSON.stringify(Clubs.getClubsByCountry('Portugal').filter(c=>!hex.test(c.colors.primary)||!hex.test(c.colors.secondary)).map(c=>c.name))`);
check('all Portugal clubs valid hex, offenders: ' + badCol, JSON.parse(badCol).length === 0);
const badCity = runv(`const pt=new Set(REGIONS_PT.map(r=>r.id));return JSON.stringify(Clubs.getClubsByCountry('Portugal').filter(c=>!pt.has(regionOfCity(c.city))).map(c=>c.name+' @ '+c.city))`);
check('every Portugal city maps to a PT region, offenders: ' + badCity, JSON.parse(badCity).length === 0);

// ---- reserves ----
const reserves = JSON.parse(runv(`return JSON.stringify(Clubs.getClubsByCountry('Portugal').filter(c=>isReserveClub(c.id)).map(c=>c.name))`));
check('4 B sides detected: ' + JSON.stringify(reserves), reserves.length === 4 && reserves.every(n => / B$/.test(n)));
check('B side -> parent colours & registry', runv(`const b=Clubs.getClubById('Porto U21');const p=Clubs.getClubById('porto');return b.colors.primary===p.colors.primary && parentClubForReserve('Porto U21').id==='porto'`));

// ---- fees ----
check('Primeira fee cap 24M (NL-like)', runv(`return Agency._leagueCap('LigaPortugal')===24000000`));

// ---- cups built at setup ----
check('Taça: 18 seeded (Primeira), 34 non-reserve mid, 24 Liga4 prelim', runv(`const c=GameState.league.tacaportugal;return c.seeded.length===18 && c.midlower.length===34 && c.prelim.length===24`));
check('Segunda Taça: 64 entrants incl 2 virtuals', runv(`const c=GameState.league.segundataca;const v=c.remaining.filter(id=>SEGTACA_VIRTUAL_MAP[id]);return c.remaining.length===64 && v.length===2`));
check('findVirtualClub resolves a Segunda Taça virtual', runv(`return !!findVirtualClub(SEGTACA_VIRTUAL[0].id)`));

// ---- simulate a season, inspect the cups ----
run(`GameState.week=1;`);
for (let i = 0; i < 7; i++) run(`Sim.advanceWeek();`);   // through wk8 (prelim wk4, first round wk7)
const taca = JSON.parse(runv(`
  const c=GameState.league.tacaportugal;
  const prelim=c.results.find(r=>r.week===4), r1=c.results.find(r=>r.week===7);
  const isRes=id=>{const cl=Clubs.getClubById(id);return cl?isReserveClub(cl.id):false;};
  const bInR1=r1.ties.some(t=>(t.h&&isRes(t.h))||(t.a&&isRes(t.a)));
  const liga4=new Set(Clubs.getClubsByDivision('Liga4').map(x=>x.id));  // note: post-sim still fine, no rollover yet
  return JSON.stringify({prelimTies:prelim.ties.length, r1Ties:r1.ties.length, bInR1});
`));
check('Taça preliminary = 12 ties (24 Liga 4 sides)', taca.prelimTies === 12);
check('Taça first round = 32 ties (64 teams)', taca.r1Ties === 32);
check('Taça excludes B/U21 sides', taca.bInR1 === false);
const seg = JSON.parse(runv(`const c=GameState.league.segundataca;const r1=c.results.find(r=>r.week===4);return JSON.stringify({ties:r1.ties.length});`));
check('Segunda Taça round 1 = 32 ties (64 teams)', seg.ties === 32);

// ---- pro/rel counts + size stability: rig tables, drive play-offs + apply directly ----
run(`
  ['LigaPortugal','LigaPortugal2','Liga3','Liga4'].forEach(div=>{
    GameState.league.tables[div].forEach((r,i)=>{ r.Pts=(GameState.league.tables[div].length-i)*3; r.GF=40; r.GA=20; r.P=30; });
  });
  League.playPlayoffsPortugal();
  League.applyPromotionRelegationPortugal();
`);
const pr = JSON.parse(runv(`return JSON.stringify(GameState.league.prorelPt)`));
check('Primeira: 2 direct relegations', pr.p1Down.length === 2);
check('Liga2: 2 direct up, 2 direct down', pr.p2Up.length === 2 && pr.p2Down.length === 2);
check('Liga3: 2 up, 2 direct down', pr.p3Up.length === 2 && pr.p3Down.length === 2);
check('Liga4: 2 up', pr.p4Up.length === 2);
check('sizes still 18/18/20/24 after applying pro/rel: ' + sizes(), sizes() === JSON.stringify([18, 18, 20, 24]));
const allmv = [...pr.p1Down, ...pr.p2Up, ...pr.p2Down, ...pr.p3Up, ...pr.p3Down, ...pr.p4Up, ...pr.lpUp, ...pr.lpDown, ...pr.lp2Up, ...pr.lp2Down, ...pr.l3poUp, ...pr.l3poDown];
check('no club appears in two movement lists', new Set(allmv).size === allmv.length);
check('no B side promoted into the Primeira Liga', ![...pr.p2Up, ...pr.lpUp].some(id => runv(`return isReserveClub('${id.replace(/'/g, "\\'")}')`)));

// ---- multi-season stability + guardrails ----
run(`Clubs.init(); GameState.startNewGame('Portugal','Test SC'); GameState.week=1;`);
let rolled = false; for (let i = 0; i < 52 && !rolled; i++) rolled = runv(`return !!Sim.advanceWeek().rolledSeason`);
check('season rolled over', rolled);
check('sizes stable after rollover: ' + sizes(), sizes() === JSON.stringify([18, 18, 20, 24]));
// no reserve ever sits in the Primeira Liga
check('no B side in Primeira after S1', runv(`return !Clubs.getClubsByDivision('LigaPortugal').some(c=>isReserveClub(c.id))`));
for (let s = 0; s < 2; s++) { let r = false; for (let i = 0; i < 52 && !r; i++) r = runv(`return !!Sim.advanceWeek().rolledSeason`); }
check('sizes stable after 3 seasons: ' + sizes(), sizes() === JSON.stringify([18, 18, 20, 24]));
check('no B side in Primeira after 3 seasons', runv(`return !Clubs.getClubsByDivision('LigaPortugal').some(c=>isReserveClub(c.id))`));
check('no engine errors across 3 seasons, got: ' + JSON.stringify(errors.slice(0, 3)), errors.length === 0);
check('no DEV WARNING inbox mail', runv(`return GameState.inbox.filter(m=>m.subject&&m.subject.includes('DEV WARNING')).length`) === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Portugal integration checks passed.');
process.exitCode = failed ? 1 : 0;
