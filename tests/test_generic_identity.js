// Settings > Remove imported names & logos (GameState.clearImportedIdentity + Clubs.applyDatabase
// { identity: false }): a save goes back to the game's own generic club names, competition names and
// crests, both those imported mid-save and those from a customization database, while club colours
// stay; importing again brings real names back.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const errors = [];
const sb = { console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) }, Math, Date, JSON, setTimeout: () => 0, clearTimeout() {},
    indexedDB: undefined, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {}, getElementById: () => null, querySelector: () => null },
    addEventListener() {}, UI: { money: String, esc: String, euro: String } };
sb.window = sb; vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

const r = JSON.parse(run(`
  Rng.seed(3); Clubs.init(); GameState.startNewGame('Netherlands','T','A'); GameState.save = function () {};
  var club = Clubs.allClubs.filter(function (c) { return c.tier === 1; })[0], id = club.id, stockName = club.name, stockComp = COMPETITIONS.ERE.name;
  var db = { overrides: {}, competitions: { ERE: { name: 'Real League Name' } } };
  db.overrides[id] = { name: 'Real Club Name', logo: 'data:image/png;base64,AAAA', colors: { primary: '#123456', secondary: '#ffffff' } };
  // a database with real names
  Clubs.applyDatabase(db);
  var withDb = { name: Clubs.getClubById(id).name, logo: Clubs.getClubById(id).logo, comp: COMPETITIONS.ERE.name };
  // the same database on a save set to generic names & crests
  Clubs.init(); Clubs.applyDatabase(db, { identity: false });
  var generic = { name: Clubs.getClubById(id).name, logo: Clubs.getClubById(id).logo || null, comp: COMPETITIONS.ERE.name, colour: Clubs.getClubById(id).colors.primary };
  // names and logos imported mid-save (Settings > Import), then removed
  Clubs.init(); GameState.setClubName(id, 'Imported Club'); GameState.setCompName('ERE', 'Imported League'); GameState.setClubLogo(id, 'data:image/png;base64,BBBB');
  var imported = { name: Clubs.getClubById(id).name, comp: COMPETITIONS.ERE.name };
  GameState.clearImportedIdentity();
  var snap = GameState._snapshot();
  Clubs.init(); GameState._applySaved(JSON.parse(JSON.stringify(snap)));   // the reload
  var after = { name: Clubs.getClubById(id).name, comp: COMPETITIONS.ERE.name, logo: Clubs.getClubById(id).logo || null, flag: GameState.genericIdentity };
  // importing again works on a generic save
  GameState.setClubName(id, 'Imported Again');
  var again = Clubs.getClubById(id).name;
  // a new game starts without the flag
  GameState.startNewGame('Netherlands','T2','A');
  return JSON.stringify({ stockName: stockName, stockComp: stockComp, withDb: withDb, generic: generic, imported: imported,
    snap: { clubNames: snap.clubNames, compNames: snap.compNames, clubLogos: snap.clubLogos, genericIdentity: snap.genericIdentity }, after: after, again: again, newGameFlag: GameState.genericIdentity });
`));
check('a database with real names shows them', r.withDb.name === 'Real Club Name' && r.withDb.comp === 'Real League Name' && !!r.withDb.logo, JSON.stringify(r.withDb));
check('on a generic save the database names, logos and competition names are skipped', r.generic.name === r.stockName && r.generic.comp === r.stockComp && r.generic.logo === null, JSON.stringify(r));
check('...but the club colours still apply', r.generic.colour === '#123456', JSON.stringify(r.generic));
check('imported names show before the reset', r.imported.name === 'Imported Club' && r.imported.comp === 'Imported League', JSON.stringify(r.imported));
check('the reset drops every mid-save import and marks the save generic', r.snap.clubNames == null && r.snap.compNames == null && r.snap.clubLogos == null && r.snap.genericIdentity === true, JSON.stringify(r.snap));
check('after the reload: generic club name, competition name and crest', r.after.name === r.stockName && r.after.comp === r.stockComp && r.after.logo === null && r.after.flag === true, JSON.stringify(r.after));
check('importing names again still works afterwards', r.again === 'Imported Again');
check('a new game starts with real-name support as normal (no flag)', r.newGameFlag === false);
const settings = fs.readFileSync(root + 'ui/js/screen-settings.js', 'utf8');
check('Settings offers it in-game, asks first, writes the save to disk and reloads', /settings\.removeImports'/.test(settings) && /_doRemoveImports/.test(settings) && /Storage\.flush\(\)/.test(settings) && /GameState\.init\(\)/.test(settings));
check('the texts exist in all 7 languages', ['en', 'de', 'es', 'fr', 'it', 'nl', 'pt'].every(l => { const t = fs.readFileSync(root + 'ui/js/i18n-' + l + '.js', 'utf8'); return ['removeImports', 'removeImportsBody', 'removeImportsBtn'].every(k => t.includes("'settings." + k + "'")); }));
check('no engine errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
if (failed) process.exit(1);
