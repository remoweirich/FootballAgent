// Custom-country engine test (Customize Part 2): register a created country via a database, play a full
// season + rollover, and assert the injected league behaves like a stock one — sizes hold (20/20/24/20),
// no DEV WARNING, reserve caps respected, cups + play-offs resolve. Plus scouting-cost + JSON round-trip.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = require('path').join(__dirname, '..', 'js') + '/';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = { console: { log() { }, warn() { }, error: (...a) => errors.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('{' + c + '}', sb);
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// Build a created country (Nigeria — non-European, keeps Europe out of this test), give it 6 scouting
// regions and a few B-teams (within the 0/2/4 caps), then start a game on a database that contains it.
run(`
    Clubs.init();
    var cc = WorldExt.makeSkeleton('Nigeria', false);
    // 6 regions, all 84 clubs distributed round-robin (>=2 each)
    cc.regions = [0,1,2,3,4,5].map(function(i){ return { id:'CUS:Nigeria:r'+(i+1), name:'Region '+(i+1), clubIds:[] }; });
    cc.clubs.forEach(function(c,i){ cc.regions[i % 6].clubIds.push(c.id); });
    // reserves: 2 in D2, 4 in D3 (exactly the caps), each linked to a D1 senior
    var d1 = cc.clubs.filter(function(c){return c.division===cc.divIds[0];});
    var d2 = cc.clubs.filter(function(c){return c.division===cc.divIds[1];});
    var d3 = cc.clubs.filter(function(c){return c.division===cc.divIds[2];});
    d2.slice(0,2).forEach(function(c,i){ c.reserve=true; c.parentId=d1[i].id; });
    d3.slice(0,4).forEach(function(c,i){ c.reserve=true; c.parentId=d1[i].id; });
    globalThis.__cc = cc;
    var db = { id:'dbNG', name:'NG', overrides:{}, competitions:{}, countries:{ 'Nigeria': cc } };
    GameState.startNewGame('Nigeria', 'Test FC', 'Me', db);
`);

const D = runv(`return JSON.stringify(WorldExt.created['Nigeria'].divIds)`) && JSON.parse(runv(`return JSON.stringify(WorldExt.created['Nigeria'].divIds)`));
const sizes = () => runv(`return JSON.stringify(${JSON.stringify(D)}.map(function(d){return Clubs.getClubsByDivision(d).length;}))`);

// ---- injection ----
check('country wired into COUNTRY_DIVS (4 divisions)', runv(`return (COUNTRY_DIVS['Nigeria']||[]).length===4`));
check('divisions + cups in COMPETITIONS', runv(`var cc=WorldExt.created['Nigeria']; return cc.divIds.every(function(d){return COMPETITIONS[d]&&COMPETITIONS[d].type==='league';}) && COMPETITIONS[cc.cups.higher.id].type==='cup' && COMPETITIONS[cc.cups.lower.id].type==='cup'`));
check('static sizes 20/20/24/20', runv(`return JSON.stringify(${JSON.stringify(D)}.map(function(d){return Clubs.staticDivSize(d);}))`) === JSON.stringify([20, 20, 24, 20]));
check('initial members 20/20/24/20', sizes() === JSON.stringify([20, 20, 24, 20]));
check('divisions added to ALL_LEAGUE_DIVS', runv(`return ${JSON.stringify(D)}.every(function(d){return ALL_LEAGUE_DIVS.includes(d);})`));
check('6 scouting regions registered', runv(`return (REGIONS_BY_COUNTRY['Nigeria']||[]).length===6`));
check('home country accepted as the created country', runv(`return GameState.homeCountry==='Nigeria'`));
check('squads at this country map to its name pool', runv(`return getRegionPrimaryNationality('Nigeria')==='Nigeria' && !!NAMES_DATABASE['Nigeria']`));
check('reserve link resolves (B-team -> parent)', runv(`var cc=WorldExt.created['Nigeria']; var r=cc.clubs.find(function(c){return c.reserve;}); return !!parentClubForReserve(r.id)`));

// ---- play a full season to the rollover (capturing cup + play-off winners before setupSeason wipes them) ----
run(`
    globalThis.__rolled=false; globalThis.__cups=false; globalThis.__po=false;
    for (var i=0;i<52 && !globalThis.__rolled;i++){
        var r = Sim.advanceWeek();
        var cu = GameState.league.customCups && GameState.league.customCups['Nigeria'];
        if (cu && cu.higher.winner && cu.lower.winner) globalThis.__cups=true;
        var d4 = WorldExt.created['Nigeria'].divIds[3];
        if (GameState.league.playoffs && GameState.league.playoffs[d4] && GameState.league.playoffs[d4].winner) globalThis.__po=true;
        globalThis.__rolled = !!r.rolledSeason;
    }
`);
check('season rolled over', runv(`return globalThis.__rolled===true`));
check('both created cups produced a winner', runv(`return globalThis.__cups===true`));
check('a promotion play-off produced a winner', runv(`return globalThis.__po===true`));
check('sizes stable after rollover: ' + sizes(), sizes() === JSON.stringify([20, 20, 24, 20]));
check('no DEV WARNING inbox mail', runv(`return GameState.inbox.filter(function(m){return m.subject&&m.subject.indexOf('DEV WARNING')>=0;}).length`) === 0);
check('no engine errors across the season, got ' + JSON.stringify(errors.slice(0, 3)), errors.length === 0);

// reserve caps (0/2/4/4) respected after prom/rel
check('reserve counts within caps after rollover', runv(`
    var cc=WorldExt.created['Nigeria']; var caps=[0,2,4,4];
    return cc.divIds.every(function(d,i){
        var res = Clubs.getClubsByDivision(d).filter(function(c){return isReserveClub(c.id);}).length;
        return res <= caps[i];
    });
`));
// ---- scouting-cost formula ----
check('formula: all-equal regions cost 2000', runv(`
    var cc={ clubs:[{id:'a',reputation:50},{id:'b',reputation:50},{id:'c',reputation:50},{id:'d',reputation:50}],
             regions:[{id:'r1',clubIds:['a','b']},{id:'r2',clubIds:['c','d']}] };
    var o=WorldExt.regionCosts(cc); return o.r1===2000 && o.r2===2000;
`));
check('formula: min-max — strongest region 4000, weakest (lowest in both) 600', runv(`
    var cc={ clubs:[{id:'a',reputation:80},{id:'b',reputation:80},{id:'c',reputation:40},{id:'d',reputation:40}],
             regions:[{id:'r1',clubIds:['a','b']},{id:'r2',clubIds:['c','d']}] };
    var o=WorldExt.regionCosts(cc); return o.r1===4000 && o.r2===600;
`));
check('formula: a region lowest in BOTH avg and top costs 600', runv(`
    var cc={ clubs:[{id:'a',reputation:26},{id:'b',reputation:26},{id:'c',reputation:57},{id:'d',reputation:80},{id:'e',reputation:63},{id:'f',reputation:78}],
             regions:[{id:'low',clubIds:['a','b']},{id:'mid',clubIds:['c','d']},{id:'hi',clubIds:['e','f']}] };
    return WorldExt.regionCosts(cc).low===600;
`));
check('formula: every cost lands in [500,4000]', runv(`
    var cc={ clubs:[{id:'a',reputation:5},{id:'b',reputation:5},{id:'c',reputation:90},{id:'d',reputation:90}],
             regions:[{id:'r1',clubIds:['a','b']},{id:'r2',clubIds:['c','d']}] };
    var o=WorldExt.regionCosts(cc); return Object.values(o).every(function(v){return v>=500 && v<=4000;});
`));

// ---- JSON round-trip (how a created country is stored / imported / exported) ----
check('created country JSON round-trips', runv(`
    var cc=WorldExt.created['Nigeria']; var b=JSON.parse(JSON.stringify(cc));
    return b.name==='Nigeria' && b.divIds.length===4 && b.clubs.length===84 && b.regions.length===6 && b.cups.higher.id===cc.cups.higher.id;
`));

// ---- Europe integration: a created EUROPEAN country feeds real teams into UEFA competitions ----
// (play as a stock country; the created country coexists and contributes to Europe.)
run(`
    var tk = WorldExt.makeSkeleton('Türkiye', true);
    var db = { id:'dbTK', name:'TK', overrides:{}, competitions:{}, countries:{ 'Türkiye': tk } };
    GameState.startNewGame('Germany', 'Euro FC', 'Me', db);
    globalThis.__r2=false;
    for (var i=0;i<52 && !globalThis.__r2;i++){ globalThis.__r2 = !!Sim.advanceWeek().rolledSeason; }
`);
check('Türkiye registered as European', runv(`return WorldExt.created['Türkiye'] && WorldExt.created['Türkiye'].european===true`));
check('Europe edition built after the first rollover', runv(`return !!(GameState.league.europe && GameState.league.europe.comps)`));
check('real Türkiye clubs enter Europe, virtual placeholders suppressed', runv(`
    var ed=GameState.league.europe; var ids=[];
    ['UCL','UEL','UECL'].forEach(function(k){ var c=ed.comps[k]; if(c) ids=ids.concat(c.lpEntrants||[]); });
    Object.keys(ed.qpools).forEach(function(k){ Object.keys(ed.qpools[k]).forEach(function(rd){ var b=ed.qpools[k][rd]; ids=ids.concat(b.seeded||[],b.unseeded||[]); }); });
    var realTK = ids.some(function(id){ var c=Clubs.getClubById(id); return c && c.country==='Türkiye'; });
    var virtTK = ids.some(function(id){ return EUROPE_VIRTUAL_MAP[id] && EUROPE_VIRTUAL_MAP[id].country==='Türkiye'; });
    return realTK && !virtTK;
`));
check('no engine errors in the Europe scenario, got ' + JSON.stringify(errors.slice(0, 3)), errors.length === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll custom-country checks passed.');
process.exitCode = failed ? 1 : 0;
