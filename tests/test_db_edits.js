// Customization databases: how many you may keep, and the "N edits" the chooser shows.
//
// The reported bug: every test database read "0 edits". The count came from
// Object.keys(db.overrides).length, which only ever counted CLUB overrides — so a database built
// by renaming competitions or adding a whole country counted as empty, and any database saved
// before a given edit type existed kept whatever stale number the index happened to hold. The
// chooser now recomputes the number from the stored database rather than trusting the index.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---- the cap ---------------------------------------------------------------------------------
console.log('\n-- how many databases you may keep --');
const storageSrc = fs.readFileSync(path.join(root, 'js', 'storage.js'), 'utf8');
const cap = +(/MAX_DBS:\s*(\d+)/.exec(storageSrc) || [])[1];
check(`Storage.MAX_DBS is ${cap}`, cap === 5);
// Every place that enforces or reports the cap goes through one accessor. There used to be six
// copies of `Storage.MAX_DBS || 3` scattered through the screen, so raising the cap in storage.js
// would have left the screen enforcing the old number anywhere that fallback fired.
const cxSrc = fs.readFileSync(path.join(root, 'ui', 'js', 'screen-customize.js'), 'utf8');
check('the screen reads the cap through a single accessor', /maxDbs\(\)\s*\{\s*return/.test(cxSrc));
const inlined = cxSrc.match(/Storage\.MAX_DBS\s*\|\|\s*\d+/g) || [];
check(`no duplicated fallback is left (${inlined.length} found outside the accessor)`, inlined.length === 1);
const accFallback = +(/maxDbs\(\)\s*\{\s*return[^;]*\|\|\s*(\d+)/.exec(cxSrc) || [])[1];
check(`the accessor's own fallback (${accFallback}) matches Storage.MAX_DBS (${cap})`, accFallback === cap);
check('no bare numeric cap is left in the screen', !/dbs\.length\s*>=\s*\d/.test(cxSrc));

// ---- the count -------------------------------------------------------------------------------
// editCount is a pure function on the stored shape, so it can be lifted out and driven directly.
const fn = (/\n\s*editCount\(db\)\s*\{[\s\S]*?\n    \},/.exec(cxSrc) || [])[0];
check('editCount() is present and self-contained', !!fn);
const sb = { Object };
vm.createContext(sb);
vm.runInContext('const C = { ' + fn.replace(/,\s*$/, '') + ' };', sb);
const count = db => vm.runInContext('C.editCount', sb)(db);

console.log('\n-- what counts as an edit --');
check('a database with nothing in it is 0', count({ overrides: {}, competitions: {}, countries: {} }) === 0);
check('null is 0, not a crash', count(null) === 0);
check('a database with no fields at all is 0', count({}) === 0);
check('one edited club is 1', count({ overrides: { ajax: { name: 'X' } } }) === 1);
check('two edited clubs are 2', count({ overrides: { a: { name: 'X' }, b: { reputation: 70 } } }) === 2);
check('a club with three changed fields still counts once',
    count({ overrides: { a: { name: 'X', reputation: 70, division: 'ERE' } } }) === 1);
// the bug, in its three forms
check('a renamed competition counts (it did not before)',
    count({ overrides: {}, competitions: { ERE: { name: 'Eredivisie' } } }) === 1);
check('a created country counts (it did not before)',
    count({ overrides: {}, countries: { Wales: { tiers: [] } } }) === 1);
check('all three add up',
    count({ overrides: { a: { name: 'X' }, b: { name: 'Y' } }, competitions: { ERE: {} }, countries: { Wales: {} } }) === 4);
console.log('\n-- and what does not --');
check('an override left empty by an opened-then-cancelled editor does not count',
    count({ overrides: { a: {} } }) === 0);
check('...even mixed in with real ones', count({ overrides: { a: {}, b: { name: 'X' }, c: {} } }) === 1);
check('a null override does not count', count({ overrides: { a: null } }) === 0);
check('a non-object override does not count', count({ overrides: { a: 'oops' } }) === 0);

// ---- the chooser must not trust the index ----------------------------------------------------
console.log('\n-- the chooser recomputes rather than trusting the stored count --');
// Indexes written by earlier builds carry the old clubs-only number. Reading it back would leave
// every existing database misreporting forever, so the chooser opens each one and counts it.
check('the chooser reads each database blob', /getDatabase\(d\.id\)[\s\S]{0,200}editCount\(blob\)/.test(cxSrc));
check('...and falls back to the index only when the blob cannot be read',
    /d\.edits\s*==\s*null[\s\S]{0,60}d\.clubs\s*\|\|\s*0/.test(cxSrc));
check('the row renders the recomputed number, not d.clubs',
    /customize\.dbClubs',\s*\{\s*n:\s*d\.edits\s*\}/.test(cxSrc));
check('_meta still writes clubs for older builds, and edits for this one',
    /clubs:\s*Object\.keys\(this\.db\.overrides\s*\|\|\s*\{\}\)\.length/.test(cxSrc)
    && /edits:\s*this\.editCount\(this\.db\)/.test(cxSrc));

// ---- the start-season control ----------------------------------------------------------------
console.log('\n-- the start-season control is wired and translated --');
check('the menu row exists', /data-act="startyear"/.test(cxSrc));
check('both actions are handled', /case 'startyear':/.test(cxSrc) && /case 'startyearsave':/.test(cxSrc));
check('the chosen year is stored on the database', /this\.db\.startYear\s*=\s*n/.test(cxSrc));
check('_meta carries it into the index', /startYear:\s*this\.db\.startYear/.test(cxSrc));
check('the input is bounded by the engine constants',
    /min="\$\{MIN_START_YEAR\}"/.test(cxSrc) && /max="\$\{MAX_START_YEAR\}"/.test(cxSrc));
const KEYS = ['customize.startSeason', 'customize.startSeasonNote', 'customize.startSeasonLabel',
    'customize.startSeasonBad', 'customize.startSeasonSet'];
const uiDir = path.join(root, 'ui', 'js');
for (const f of fs.readdirSync(uiDir).filter(f => /^i18n-[a-z]{2}\.js$/.test(f))) {
    const src = fs.readFileSync(path.join(uiDir, f), 'utf8');
    const missing = KEYS.filter(k => !src.includes(`'${k}':`));
    check(`  ${f}${missing.length ? ' — missing ' + missing.join(', ') : ''}`, missing.length === 0);
}

console.log(failed ? '\n*** FAIL ***' : '\nAll database-edit checks passed.');
process.exitCode = failed ? 1 : 0;
