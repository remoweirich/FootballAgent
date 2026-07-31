// Belgium integration test: wiring, sizes, colours/cities, reserve rules, cups (group-phase Belgian Cup
// + Notre Coupe), play-offs, multi-season size stability, no B-team ever in the Pro League, guardrails.
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

run(`Clubs.init(); GameState.startNewGame('Belgium', 'Test FC');`);

// ---- wiring ----
check('Belgium is a home country', runv(`return Object.keys(REGIONS_BY_COUNTRY).includes('Belgium') && GameState.homeCountry==='Belgium'`));
check('4 divisions in COUNTRY_DIVS', runv(`return (COUNTRY_DIVS.Belgium||[]).length===4`));
check('divisions in COMPETITIONS', runv(`return ['JupilerProLeague','ChallengerProLeague','BelgianDivision1','BelgianDivision2'].every(d=>COMPETITIONS[d])`));
check('cups wired', runv(`return (COUNTRY_CUPS.Belgium||[]).map(c=>c[0]).join(',')==='belgiancup,notrecoupe'`));
check('DIV_TIERS 1..4', runv(`return Clubs.DIV_TIERS.JupilerProLeague===1 && Clubs.DIV_TIERS.BelgianDivision2===4`));
check('Belgium scout names present', runv(`return SCOUT_NAMES.Belgium && SCOUT_NAMES.Belgium.first.length>5`));

// ---- sizes ----
const sizes = () => runv(`return JSON.stringify(['JupilerProLeague','ChallengerProLeague','BelgianDivision1','BelgianDivision2'].map(d=>Clubs.getClubsByDivision(d).length))`);
check('static sizes 18/18/20/24', runv(`return JSON.stringify(['JupilerProLeague','ChallengerProLeague','BelgianDivision1','BelgianDivision2'].map(d=>Clubs.staticDivSize(d)))`) === JSON.stringify([18, 18, 20, 24]));
check('initial members 18/18/20/24', sizes() === JSON.stringify([18, 18, 20, 24]));

// ---- colours + cities ----
const badCol = runv(`const hex=/^#[0-9A-Fa-f]{6}$/;return JSON.stringify(Clubs.getClubsByCountry('Belgium').filter(c=>!hex.test(c.colors.primary)||!hex.test(c.colors.secondary)).map(c=>c.name))`);
check('all Belgium clubs valid hex, offenders: ' + badCol, JSON.parse(badCol).length === 0);
const badCity = runv(`const be=new Set(REGIONS_BE.map(r=>r.id));return JSON.stringify(Clubs.getClubsByCountry('Belgium').filter(c=>!be.has(regionOfCity(c.city))).map(c=>c.name+' @ '+c.city))`);
check('every Belgium city maps to a BE region, offenders: ' + badCity, JSON.parse(badCity).length === 0);

// ---- reserves ----
const reserves = JSON.parse(runv(`return JSON.stringify(Clubs.getClubsByCountry('Belgium').filter(c=>isReserveClub(c.id)).map(c=>c.name))`));
check('10 B sides detected: ' + JSON.stringify(reserves), reserves.length === 10);
check('B side -> parent colours & registry', runv(`const b=Clubs.getClubById('Anderlecht U21');const p=Clubs.getClubById('anderlecht');return b.colors.primary===p.colors.primary && parentClubForReserve('Anderlecht U21').id==='anderlecht'`));

// ---- fees ----
check('Pro League fee cap 24M (NL-like)', runv(`return Agency._leagueCap('JupilerProLeague')===24000000`));

// ---- cups built at setup ----
check('Belgian Cup: 8 groups of 3, 18 seeded, 38 midlower', runv(`const c=GameState.league.belgiancup;return c.groups.length===8 && c.groups.every(g=>g.teams.length===3) && c.seeded.length===18 && c.midlower.length===38`));
check('Notre Coupe: 64 entrants incl 2 virtuals', runv(`const c=GameState.league.notrecoupe;const v=c.remaining.filter(id=>NOTRECOUPE_VIRTUAL_MAP[id]);return c.remaining.length===64 && v.length===2`));
check('findVirtualClub resolves a Notre Coupe virtual', runv(`return !!findVirtualClub(NOTRECOUPE_VIRTUAL[0].id)`));

// ---- simulate a season, inspect the cups ----
run(`GameState.week=1;`);
for (let i = 0; i < 7; i++) run(`Sim.advanceWeek();`);   // through wk8 (group phase wk4, round of 64 wk7)
check('Belgian Cup group phase done (8 groups played)', runv(`const c=GameState.league.belgiancup;return c.groupDone && c.groups.every(g=>g.table.every(r=>r.P===2))`));
const bc = JSON.parse(runv(`const c=GameState.league.belgiancup;const r=c.results.find(x=>x.week===7);return JSON.stringify({ties:r?r.ties.length:0});`));
check('Belgian Cup Round of 64 = 32 ties (64 teams)', bc.ties === 32);
const nc = JSON.parse(runv(`const c=GameState.league.notrecoupe;const r=c.results.find(x=>x.week===4);return JSON.stringify({ties:r.ties.length});`));
check('Notre Coupe round 1 = 32 ties (64 teams)', nc.ties === 32);

// ---- pro/rel counts + size stability: rig tables, drive play-offs + apply directly ----
run(`
  ['JupilerProLeague','ChallengerProLeague','BelgianDivision1','BelgianDivision2'].forEach(div=>{
    GameState.league.tables[div].forEach((r,i)=>{ r.Pts=(GameState.league.tables[div].length-i)*3; r.GF=40; r.GA=20; r.P=30; });
  });
  League.playPlayoffsBelgium();
  League.applyPromotionRelegationBelgium();
`);
const pr = JSON.parse(runv(`return JSON.stringify(GameState.league.prorelBe)`));
check('Pro League: 2 direct relegations', pr.p1Down.length === 2);
check('Challenger: 2 direct up, 2 direct down', pr.p2Up.length === 2 && pr.p2Down.length === 2);
check('Division 1: 2 up, 2 direct down', pr.p3Up.length === 2 && pr.p3Down.length === 2);
check('Division 2: 2 up', pr.p4Up.length === 2);
check('sizes still 18/18/20/24 after applying pro/rel: ' + sizes(), sizes() === JSON.stringify([18, 18, 20, 24]));
const allmv = [...pr.p1Down, ...pr.p2Up, ...pr.p2Down, ...pr.p3Up, ...pr.p3Down, ...pr.p4Up, ...pr.proUp, ...pr.proDown, ...pr.cplUp, ...pr.cplDown, ...pr.d1poUp, ...pr.d1poDown];
check('no club appears in two movement lists', new Set(allmv).size === allmv.length);
check('no B side promoted into the Pro League', ![...pr.p2Up, ...pr.proUp].some(id => runv(`return isReserveClub('${id.replace(/'/g, "\\'")}')`)));

// ---- multi-season stability + guardrails ----
run(`Clubs.init(); GameState.startNewGame('Belgium','Test FC'); GameState.week=1;`);
let rolled = false; for (let i = 0; i < 52 && !rolled; i++) rolled = runv(`return !!Sim.advanceWeek().rolledSeason`);
check('season rolled over', rolled);
check('sizes stable after rollover: ' + sizes(), sizes() === JSON.stringify([18, 18, 20, 24]));
check('no B side in Pro League after S1', runv(`return !Clubs.getClubsByDivision('JupilerProLeague').some(c=>isReserveClub(c.id))`));
for (let s = 0; s < 2; s++) { let r = false; for (let i = 0; i < 52 && !r; i++) r = runv(`return !!Sim.advanceWeek().rolledSeason`); }
check('sizes stable after 3 seasons: ' + sizes(), sizes() === JSON.stringify([18, 18, 20, 24]));
check('no B side in Pro League after 3 seasons', runv(`return !Clubs.getClubsByDivision('JupilerProLeague').some(c=>isReserveClub(c.id))`));
check('no engine errors across 3 seasons, got: ' + JSON.stringify(errors.slice(0, 3)), errors.length === 0);
check('no DEV WARNING inbox mail', runv(`return GameState.inbox.filter(m=>m.subject&&m.subject.includes('DEV WARNING')).length`) === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Belgium integration checks passed.');
process.exitCode = failed ? 1 : 0;
