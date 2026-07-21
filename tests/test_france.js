// France integration test: wiring, sizes, colours/cities, pro/rel counts + barrage balance,
// cup entry rules (Coupe de France 124 seeded/higher-away; Coupe National 64), multi-season
// size stability, guardrails silent.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'simulation.js'];
function makeFakeIDB() { return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } }; }
function buildSandbox() {
    const errors = [];
    const sandbox = { console: { log: () => { }, warn: () => { }, error: (...a) => errors.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
    vm.createContext(sandbox);
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sandbox, { filename: f });
    sandbox.__errors = errors;
    return sandbox;
}
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };
const sb = buildSandbox();
const run = code => vm.runInContext('{' + code + '}', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);

run(`Clubs.init(); GameState.startNewGame('France', 'Équipe Test');`);

// ---- wiring ----
check('France is a home country', runv(`return Object.keys(REGIONS_BY_COUNTRY).includes('France')`) && runv(`return GameState.homeCountry==='France'`));
check('France in COUNTRY_DIVS with 5 divisions', runv(`return (COUNTRY_DIVS.France||[]).length===5`));
check('Ligue1-5 in COMPETITIONS', runv(`return ['Ligue1','Ligue2','Ligue3','Ligue4','Ligue5'].every(d=>COMPETITIONS[d])`));
check('France scout names present', runv(`return SCOUT_NAMES.France && SCOUT_NAMES.France.first.length>5`));
check('France cups wired', runv(`return (COUNTRY_CUPS.France||[]).map(c=>c[0]).join(',')==='coupefrance,coupenational'`));
check('DIV_TIERS Ligue1=1 Ligue5=5', runv(`return Clubs.DIV_TIERS.Ligue1===1 && Clubs.DIV_TIERS.Ligue5===5`));

// ---- sizes ----
const sizes = () => runv(`return JSON.stringify(['Ligue1','Ligue2','Ligue3','Ligue4','Ligue5'].map(d=>Clubs.getClubsByDivision(d).length))`);
check('static sizes 18/18/18/22/24', runv(`return JSON.stringify(['Ligue1','Ligue2','Ligue3','Ligue4','Ligue5'].map(d=>Clubs.staticDivSize(d)))`) === JSON.stringify([18,18,18,22,24]));
check('initial members match', sizes() === JSON.stringify([18,18,18,22,24]));

// ---- colours + cities ----
const badCol = runv(`const hex=/^#[0-9A-Fa-f]{6}$/;return JSON.stringify(Clubs.getClubsByCountry('France').filter(c=>!hex.test(c.colors.primary)||!hex.test(c.colors.secondary)).map(c=>c.name))`);
check('all France clubs valid hex, offenders: ' + badCol, JSON.parse(badCol).length === 0);
const badCity = runv(`const fr=new Set(REGIONS_FR.map(r=>r.id));return JSON.stringify(Clubs.getClubsByCountry('France').filter(c=>!fr.has(regionOfCity(c.city))).map(c=>c.name+' @ '+c.city))`);
check('every France city maps to a French region, offenders: ' + badCity, JSON.parse(badCity).length === 0);
check('Troyes city fixed (not Lecce)', runv(`return Clubs.getClubById('Troyes').city==='Troyes'`));

// ---- fees ----
check('Ligue1 fee 70M (below Spain 75M)', runv(`return Agency._leagueCap('Ligue1')===70000000`));

// ---- cups built at setupSeason ----
check('Coupe de France = 128 entrants (100 league + 28 virtual)', runv(`const c=GameState.league.coupefrance;return c && c.entrants.length===128`));
check('Coupe de France virtuals = 28 of the 39 pool', runv(`const c=GameState.league.coupefrance;const v=c.entrants.filter(id=>COUPEFR_VIRTUAL_MAP[id]);return v.length===28 && COUPEFR_VIRTUAL.length===39`));
check('findVirtualClub resolves a Coupe de France virtual', runv(`return !!findVirtualClub(COUPEFR_VIRTUAL[0].id)`));

// ---- pro/rel counts + barrage balance: drive playoffs+apply directly on a rigged table ----
run(`
    ['Ligue1','Ligue2','Ligue3','Ligue4','Ligue5'].forEach(div=>{
        GameState.league.tables[div].forEach((r,i)=>{ r.Pts=(GameState.league.tables[div].length-i)*3; r.GF=40; r.GA=20; r.P=30; });
    });
    League.playPlayoffsFrance();
    League.applyPromotionRelegationFrance();
`);
const pr = JSON.parse(runv(`return JSON.stringify(GameState.league.prorelFra)`));
check('Ligue1: 2 direct relegations', pr.l1Down.length === 2);
check('Ligue2: 2 direct up, 2 direct down', pr.l2Up.length === 2 && pr.l2Down.length === 2);
check('Ligue3: 2 up, 3 down', pr.l3Up.length === 2 && pr.l3Down.length === 3);
check('Ligue4: 3 up, 4 down', pr.l4Up.length === 3 && pr.l4Down.length === 4);
check('Ligue5: 4 up', pr.l5Up.length === 4);
// barrage: exactly one team crosses per boundary that the challenger won (0 or 1 each), and up-count == down-count
check('barrage up-count equals down-count (balanced exchanges): ' + pr.barrageUp.length + '/' + pr.barrageDown.length, pr.barrageUp.length === pr.barrageDown.length);
// sizes must stay exactly correct after applying
check('sizes still 18/18/18/22/24 after applying pro/rel', sizes() === JSON.stringify([18,18,18,22,24]));
// no club appears twice
const allmv = [...pr.l1Down,...pr.l2Up,...pr.l2Down,...pr.l3Up,...pr.l3Down,...pr.l4Up,...pr.l4Down,...pr.l5Up,...pr.barrageUp,...pr.barrageDown];
check('no club appears in two movement lists', new Set(allmv).size === allmv.length);
// promo bracket winners are the barrage challengers
check('each Ligue2-5 promo bracket produced a winner', runv(`return ['Ligue2','Ligue3','Ligue4','Ligue5'].every(d=>GameState.league.playoffs[d] && GameState.league.playoffs[d].winner)`));

// ---- cup entry rule test: sim a season, inspect Coupe de France R1 + Coupe National R1 ----
run(`Clubs.init(); GameState.startNewGame('France', 'Équipe Test'); GameState.week=1;`);
for (let i = 0; i < 6; i++) run(`Sim.advanceWeek();`);   // through wk7 (cup R1 wk4, R2 wk7)
const cf = JSON.parse(runv(`
    const c=GameState.league.coupefrance; const r1=c.results.find(r=>r.week===4);
    const l1=new Set(Clubs.getClubsByDivision('Ligue1').map(x=>x.id));
    const tierOf=id=>{const cl=Clubs.getClubById(id);return cl?cl.tier:99;};
    let l1vsl1=0, l1home=0, higherHome=0, ties=r1.ties.length;
    r1.ties.forEach(t=>{ if(t.bye)return;
        if(l1.has(t.h)&&l1.has(t.a)) l1vsl1++;
        if(l1.has(t.h)) l1home++;
        if(tierOf(t.h)<tierOf(t.a)) higherHome++;   // higher division (lower tier num) at home = violation
    });
    return JSON.stringify({ties,l1vsl1,l1home,higherHome});
`));
check('Coupe de France R1 = 64 ties (128 clubs, clean bracket)', cf.ties === 64);
check('Coupe de France R1: no Ligue1 vs Ligue1', cf.l1vsl1 === 0);
check('Coupe de France R1: no higher-division side at home (all drawn away)', cf.higherHome === 0);
const cn = JSON.parse(runv(`
    const c=GameState.league.coupenational; const r1=c.results.find(r=>r.week===4);
    const tierOf=id=>{const cl=Clubs.getClubById(id);return cl?cl.tier:99;};
    let higherHome=0, ties=r1.ties.length, hasL1orL2=0;
    const l12=new Set([...Clubs.getClubsByDivision('Ligue1'),...Clubs.getClubsByDivision('Ligue2')].map(x=>x.id));
    r1.ties.forEach(t=>{ if(t.bye)return; if(tierOf(t.h)<tierOf(t.a))higherHome++; if(l12.has(t.h)||l12.has(t.a))hasL1orL2++; });
    return JSON.stringify({ties,higherHome,hasL1orL2});
`));
check('Coupe National R1 = 32 ties (64 clubs L3/4/5)', cn.ties === 32);
check('Coupe National: no Ligue1/Ligue2 clubs involved', cn.hasL1orL2 === 0);
check('Coupe National R1: higher-division side always away', cn.higherHome === 0);

// ---- multi-season stability + guardrails ----
let rolled = false; for (let i = 0; i < 52 && !rolled; i++) rolled = runv(`return !!Sim.advanceWeek().rolledSeason`);
check('season rolled over', rolled);
check('sizes stable after rollover: ' + sizes(), sizes() === JSON.stringify([18,18,18,22,24]));
for (let s = 0; s < 2; s++) { let r = false; for (let i = 0; i < 52 && !r; i++) r = runv(`return !!Sim.advanceWeek().rolledSeason`); }
check('sizes stable after 3 seasons: ' + sizes(), sizes() === JSON.stringify([18,18,18,22,24]));
check('no DEV WARNING errors across 3 seasons, got: ' + JSON.stringify(sb.__errors.slice(0,3)), sb.__errors.length === 0);
check('no DEV WARNING inbox mail', runv(`return GameState.inbox.filter(m=>m.subject&&m.subject.includes('DEV WARNING')).length`) === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll France integration checks passed.');
process.exitCode = failed ? 1 : 0;
