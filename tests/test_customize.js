// Customize feature test: the engine primitives the Customize screen relies on — Clubs.applyDatabase
// overlay, reserve-set stability across renames, League.RESERVE_CAP / reserveCapFor, division-move
// size math (the editor's exit-validation core), databaseId persistence, and overlay JSON round-trip.
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

run(`Clubs.init();`);

// ---- 1. overlay applies every field, including derived reputation anchors ----
run(`Clubs.applyDatabase({ id:'t1', overrides:{
    'ajax': { name:'AFC Ajax', colors:{primary:'#111111',secondary:'#222222'}, reputation:90, logo:'data:image/png;base64,AAAA' }
}});`);
check('overlay applies name', runv(`return Clubs.getClubById('ajax').name==='AFC Ajax'`));
check('overlay applies both colours', runv(`var c=Clubs.getClubById('ajax'); return c.colors.primary==='#111111' && c.colors.secondary==='#222222'`));
check('overlay applies reputation + baseRep + anchorRep', runv(`var c=Clubs.getClubById('ajax'); return c.reputation===90 && c.baseRep===90 && c.anchorRep===90`));
check('overlay applies logo', runv(`return Clubs.getClubById('ajax').logo==='data:image/png;base64,AAAA'`));
check('unlisted club untouched', runv(`return Clubs.getClubById('psv').name==='Eindhoven Red'`));

// ---- 2. reserve/B-team status is frozen by id, so a rename cannot flip it (the robustness fix) ----
run(`Clubs.init();`);
check('jong-ajax is a reserve on the clean base', runv(`return isReserveClub('jong-ajax')===true`));
check('ajax is not a reserve', runv(`return isReserveClub('ajax')===false`));
run(`Clubs.applyDatabase({ id:'t2', overrides:{ 'jong-ajax': { name:'Amsterdam Reserves' } }});`);
check('jong-ajax renamed away from the "Jong" pattern', runv(`return Clubs.getClubById('jong-ajax').name==='Amsterdam Reserves'`));
check('jong-ajax STILL a reserve after rename (frozen set)', runv(`return isReserveClub('jong-ajax')===true`));
check('reserve->parent link still resolves after rename', runv(`var p=parentClubForReserve('jong-ajax'); return !!p && p.id==='ajax'`));

// ---- 3. centralized reserve caps mirror the engine's inline caps ----
check('RESERVE_CAP: no reserves in top flights', runv(`return League.RESERVE_CAP.LaLiga===0 && League.RESERVE_CAP.BUNDES===0 && League.RESERVE_CAP.PREM===0`));
check('RESERVE_CAP: known mid-tier caps', runv(`return League.RESERVE_CAP.PrimeraSup===4 && League.RESERVE_CAP['3LIGA']===3 && League.RESERVE_CAP.LaLiga2===2`));
check('reserveCapFor returns explicit cap', runv(`return League.reserveCapFor('LaLiga2')===2`));
check('reserveCapFor falls back to a number for uncapped tiers', runv(`return typeof League.reserveCapFor('Ligue5')==='number'`));

// ---- 4. division-move size math — the editor's exit validator core (getClubsByDivision honours moves) ----
run(`Clubs.init();`);
check('ERE starts at its static size (18)', runv(`return Clubs.getClubsByDivision('ERE').length===18 && Clubs.staticDivSize('ERE')===18`));
run(`Clubs.applyDatabase({ id:'t3', overrides:{ 'ajax': { division:'EED' } }});`);
check('moving one club OUT makes ERE the wrong size (17) — validator would block', runv(`return Clubs.getClubsByDivision('ERE').length===17`));
run(`Clubs.applyDatabase({ id:'t3b', overrides:{ 'nac': { division:'ERE' } }});`);
check('a matching swap IN restores ERE to 18', runv(`return Clubs.getClubsByDivision('ERE').length===18`));
check('EED also back to its static size after the swap', runv(`return Clubs.getClubsByDivision('EED').length===Clubs.staticDivSize('EED')`));
check('moved club carries the right tier + divisionName', runv(`var c=Clubs.getClubById('ajax'); return c.division==='EED' && c.tier===Clubs.DIV_TIERS.EED && c.divisionName===Clubs.DIV_NAMES.EED`));

// ---- 5. B-team cap validation: piling reserves into a capped division is detectable ----
run(`Clubs.init();`);
check('a capped mid-tier (3LIGA) holds no more reserves than its cap on the clean base', runv(`
    var res = Clubs.getClubsByDivision('3LIGA').filter(function(c){return isReserveClub(c.id);}).length;
    return res <= League.reserveCapFor('3LIGA');
`));

// ---- 6. databaseId flows through startNewGame + snapshot; overlay applied at game start ----
run(`GameState.startNewGame('Netherlands','Test FC','Me',{ id:'dbX', overrides:{ 'ajax': { name:'AFC Ajax', reputation:88 } }});`);
check('startNewGame stores databaseId', runv(`return GameState.databaseId==='dbX'`));
check('startNewGame applied the overlay before squad generation', runv(`return Clubs.getClubById('ajax').name==='AFC Ajax' && Clubs.getClubById('ajax').reputation===88`));
check('snapshot carries databaseId for reload', runv(`return GameState._snapshot().databaseId==='dbX'`));
check('a Standard game records a null databaseId', runv(`GameState.startNewGame('Netherlands','Plain FC'); return GameState.databaseId===null && GameState._snapshot().databaseId===null`));

// ---- 7. sparse overlay round-trips through JSON (how databases are stored) ----
check('overlay JSON round-trip preserves every field', runv(`
    var db={id:'r',overrides:{'ajax':{name:'X',reputation:70,colors:{primary:'#010203',secondary:'#040506'},division:'EED',logo:'data:img'}}};
    var b=JSON.parse(JSON.stringify(db));
    return b.overrides.ajax.name==='X' && b.overrides.ajax.reputation===70 && b.overrides.ajax.division==='EED' && b.overrides.ajax.colors.secondary==='#040506' && b.overrides.ajax.logo==='data:img';
`));

check('no engine errors during customize checks, got ' + JSON.stringify(errors.slice(0, 3)), errors.length === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll customize checks passed.');
process.exitCode = failed ? 1 : 0;
