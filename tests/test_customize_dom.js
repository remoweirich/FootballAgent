// DOM smoke for the Customize screen: drive the render + validation paths (chooser, editor table,
// size/B-team validation, rename flow) against a minimal DOM and confirm nothing throws and the
// overlay/validator logic behaves. Interaction wiring (real click delegation, file import, download)
// needs a browser and is left to on-device playtest.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const errs = [];

function makeEl() {
    const el = {
        _html: '', _id: '', set innerHTML(v) { this._html = String(v); }, get innerHTML() { return this._html; },
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        dataset: {}, style: {}, textContent: '', value: '', type: '', accept: '', multiple: false, files: [],
        addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {}, click() {},
        focus() {}, select() {}, setAttribute() {}, querySelectorAll() { return []; }, closest() { return null; }
    };
    // assigning an id registers the element, so dynamically-created overlays are retrievable by id
    Object.defineProperty(el, 'id', { get() { return el._id; }, set(v) { el._id = v; if (v) els[v] = el; }, configurable: true });
    return el;
}
const els = {};
const document = {
    getElementById: id => (els[id] || (els[id] = makeEl())),
    querySelectorAll: () => [], createElement: () => makeEl(),
    addEventListener() {}, removeEventListener() {},
    body: { appendChild() {}, removeChild() {} }, head: { appendChild() {} },
};
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    Math, Date, JSON, document,
    setTimeout: () => 0, clearTimeout() {},
    indexedDB: { open() { const r = { result: null, onsuccess: null }; return r; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    window: { addEventListener() {} },
};
sb.UI = { money: n => String(n), esc: s => (s == null ? '' : String(s)), crest: () => '<crest>', cur: () => '€' };
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'world-ext.js', 'agency.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const CX = vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-customize.js'), 'utf8') + ';CustomizeScreen', sb, { filename: 'screen-customize.js' });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
vm.runInContext('Clubs.init();', sb);

let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// give the screen a fresh working database
CX.db = { id: 't', name: 'Test DB', createdAt: 1, updatedAt: 1, overrides: {} };
CX.country = 'Netherlands';
CX.division = 'ERE';

check('_injectCSS runs without throwing', (() => { try { CX._injectCSS(); return true; } catch (e) { errs.push(String(e)); return false; } })());
check('clean base validates (no size/cap errors)', CX._validateCountry('Netherlands').length === 0);
check('_divisionRows renders the top flight with a club name', /Amsterdam/.test(CX._divisionRows('ERE', false)));
check('_divisionRows shows the size counter', /cx-count/.test(CX._divisionRows('ERE', false)));
check('reserve rows get a B tag', /cx-btag/.test(CX._divisionRows('EED', false)));

// gate off -> reputation cell shows a lock
check('gated render marks reputation locked', /cx-locked/.test(CX._divisionRows('ERE', true)));

// move a club out of its division -> validator flags the size on BOTH affected tiers
CX._setOverride('ajax', { division: 'EED' });
const errsOut = CX._validateCountry('Netherlands');
check('moving one club out fails validation', errsOut.length >= 1);
check('clubView reflects the override division', CX.clubView('ajax').division === 'EED');
check('membership honours the override', CX._membersOf('Netherlands', 'EED').indexOf('ajax') >= 0 && CX._membersOf('Netherlands', 'ERE').indexOf('ajax') < 0);

// swap a club the other way -> valid again
CX._setOverride('nac', { division: 'ERE' });
check('a matching swap restores validity', CX._validateCountry('Netherlands').length === 0);

// ---- filename -> club resolver for logo import (the fix for "all logos skipped") ----
check('logo match: exact id (ajax.png)', CX._clubIdForFilename('ajax') === 'ajax');
check('logo match: case-insensitive id (Ajax.png)', CX._clubIdForFilename('Ajax') === 'ajax');
check('logo match: by club name (Feyenoord.png)', CX._clubIdForFilename('Feyenoord') === 'feyenoord');
check('logo match: normalised name, spaces + case', CX._clubIdForFilename('amsterdam white') === 'ajax');
check('logo match: a club from another country does not match', CX._clubIdForFilename('Barcelona') === null);

// B-teams are excluded from the assign list (they inherit their parent's logo)
check('logo list excludes B-teams but keeps seniors', CX._logoClubList().every(c => c.id !== 'jong-ajax') && CX._logoClubList().some(c => c.id === 'ajax'));

// a club chosen in one row is removed from the other rows' dropdowns
CX._pendingLogos = [{ name: 'a.png', uri: 'data:1', guess: 'ajax' }, { name: 'b.png', uri: 'data:2', guess: null }];
CX._logoAssignSheet();
check('a chosen club disappears from the other dropdowns', (CX._assignBodyHTML().match(/value="ajax"/g) || []).length === 1);

// bulk import applies whatever the dropdowns say (works even when filenames were lost), and a chosen
// parent's logo propagates to its B-team automatically
CX._pendingLogos = [{ name: 'image.png', uri: 'data:image/png;base64,AAAA', guess: null }];
CX._logoAssignSheet();
CX._pendingLogos[0].chosen = 'ajax';   // simulate the dropdown change
CX._applyAssignedLogos();
check('assign sheet writes the chosen club logo even with no filename match', CX.clubView('ajax').logo === 'data:image/png;base64,AAAA');
check('the B-team inherits its parent logo on import', CX.clubView('jong-ajax').logo === 'data:image/png;base64,AAAA');

// mid-save (live) logo import: GameState stores it per-save and re-applies it (incl. B-team inheritance)
check('mid-save logo applies to the club', runv(`GameState.clubLogos = { az: 'data:azlogo' }; GameState._applyClubLogos(); return Clubs.getClubById('az').logo === 'data:azlogo';`));
check('mid-save parent logo is inherited by its B-team', runv(`return Clubs.getClubById('jong-az').logo === 'data:azlogo';`));
check('setClubLogo stores per-save and applies live', runv(`GameState.setClubLogo('twente','data:live'); return GameState.clubLogos.twente === 'data:live' && Clubs.getClubById('twente').logo === 'data:live';`));

// mid-save name import (real-names pack): parse an {id:name} file and apply live + persist
check('names parser reads a JSON id:name map', (() => { const m = CX._parseNamesText('{"ajax":"Ajax AFC","psv":"PSV E."}'); return m.ajax === 'Ajax AFC' && m.psv === 'PSV E.'; })());
check('names parser reads CSV', (() => { const m = CX._parseNamesText(['id,name', 'ajax,Ajax CSV'].join(String.fromCharCode(10))); return m.ajax === 'Ajax CSV'; })());
check('setClubName stores per-save and applies live', runv(`GameState.setClubName('ajax','Ajax Real'); GameState._applyClubNames(); return GameState.clubNames.ajax==='Ajax Real' && Clubs.getClubById('ajax').name==='Ajax Real';`));

// rename flow: editName opens an overlay reading #cxIn, _saveName writes the override.
// (getElementById lazily materialises the mock input — a real browser creates it from innerHTML.)
CX.editName('psv');
document.getElementById('cxIn').value = 'PSV Eindhoven';
CX._saveName('psv');
check('rename writes the name override', CX.db.overrides.psv && CX.db.overrides.psv.name === 'PSV Eindhoven');
check('clubView reflects the renamed club', CX.clubView('psv').name === 'PSV Eindhoven');

// colour flow
CX.editColor('psv', 'primary');
document.getElementById('cxHex').value = '#FF0000';
CX._saveColor('psv', 'primary');
check('colour override applied + normalised to upper hex', CX.clubView('psv').colors.primary === '#FF0000');

// reputation flow (gate is on by default -> allowed)
CX.editRep('psv');
document.getElementById('cxRep').value = '77';
CX._saveRep('psv');
check('reputation override clamped/applied', CX.clubView('psv').reputation === 77);

// render the editor end-to-end without throwing, and the chooser
check('openCountry renders the editor without throwing', (() => { try { CX.openCountry('Netherlands'); return /cx-table|cx-toolbar/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
check('menu renders without throwing', (() => { try { CX.menu(); return /cx-menu|cx-dbtag/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
check('countryList renders every country without throwing', (() => { try { CX.countryList(); return /Netherlands/.test(els.app.innerHTML) && /Germany/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());

// ---------- Part 2: Add a new country ----------
CX.db.countries = {};
CX.db.competitions = CX.db.competitions || {};
CX.db.countries['Nigeria'] = runv(`return WorldExt.makeSkeleton('Nigeria', false)`);
const NG = CX.db.countries['Nigeria'];

check('addCountryHome renders create/import + the created country', (() => { try { CX.addCountryHome(); return /Nigeria/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
check('createCountry renders the two classifiers + country select', (() => { try { CX.createCountry(); return /cxEuro/.test(els.app.innerHTML) && /cxTier/.test(els.app.innerHTML) && /cxCountry/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
check('country classifier lists creatable countries', runv(`return WorldExt.creatableCountries(true,'extended').indexOf('Croatia')>=0 && WorldExt.creatableCountries(false,'small').indexOf('Nigeria')>=0`));
check('blocked countries are not creatable', runv(`return WorldExt.creatableCountries(true,'none').indexOf('Liechtenstein')<0`));
check('countryMenu renders build/names/regions', (() => { try { CX.countryMenu('Nigeria'); return /cx-menu/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());

// build-league editor over the created country's own clubs
check('buildLeague renders the created editor', (() => { try { CX.buildLeague('Nigeria'); return /cx-table|cx-toolbar/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
check('lower divisions expose a B-team toggle', (() => { try { CX.division = NG.divIds[1]; CX._refreshTable(); return /cx-bbtn/.test(els.cxTable.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
const d2id = NG.clubs.find(c => c.division === NG.divIds[1]).id;
CX.toggleReserve(d2id);
document.getElementById('cxParent').value = NG.clubs.find(c => c.division === NG.divIds[0]).id;
CX._saveParent(d2id);
check('B-team toggle links a parent club', (() => { const c = NG.clubs.find(x => x.id === d2id); return c.reserve === true && !!c.parentId; })());

// reputation cap without the editor
runv(`GameState.canEditGameState=false`);
check('rep cap governs created D1 without the editor', runv(`return CustomizeScreen._repMaxFor({division:'${NG.divIds[0]}'})===82`));
check('save blocks an over-cap reputation', (() => {
    NG.clubs.find(x => x.division === NG.divIds[0]).reputation = 95;   // above D1 cap 82
    try { CX.buildLeague('Nigeria'); CX.saveCreatedLeague(); return /cx-errlist/.test(document.getElementById('cxOverlay').innerHTML); } catch (e) { errs.push(String(e)); return false; }
})());
runv(`GameState.canEditGameState=true`);
NG.clubs.find(x => x.division === NG.divIds[0]).reputation = 80;
CX._created = null; CX._closeOverlay();

// name editor + competition names + regions render without throwing
check('name editor renders', (() => { try { CX.editNames('Nigeria'); return /cxFirst/.test(els.app.innerHTML) && /cxLast/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
check('competition-names dialog lists 4 leagues + 2 cups', (() => { try { CX._created = NG; CX.country = 'Nigeria'; CX.competitionNames(); const h = document.getElementById('cxOverlay').innerHTML; CX._created = null; return (h.match(/data-act="renameone"/g) || []).length === 6; } catch (e) { errs.push(String(e)); return false; } })());
check('scouting regions need the league built first', (() => { NG._leagueBuilt = false; CX.regionBuilder('Nigeria'); NG._leagueBuilt = true; try { CX.regionBuilder('Nigeria'); return /cx-regcard/.test(els.app.innerHTML); } catch (e) { errs.push(String(e)); return false; } })());
check('region cost shows once a region has clubs', (() => {
    try {
        CX._regCountry = 'Nigeria';
        NG.regions.forEach((r, i) => { r.clubIds = NG.clubs.slice(i * 14, i * 14 + 14).map(c => c.id); });
        CX._renderRegions(); return /cx-regcost/.test(els.app.innerHTML);
    } catch (e) { errs.push(String(e)); return false; }
})());
check('export country produces JSON without throwing', (() => { try { CX.exportCountry('Nigeria'); return true; } catch (e) { errs.push(String(e)); return false; } })());

check('no errors thrown across the render/validation smoke, got ' + JSON.stringify(errs.slice(0, 3)), errs.length === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll customize-DOM checks passed.');
process.exitCode = failed ? 1 : 0;
