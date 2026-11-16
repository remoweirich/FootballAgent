// Short club names for the history tables (clubShortName, at most 15 letters) and the names pack's
// "short:<id>" entries (club short names and competition abbreviations). The full name stays
// everywhere else. The real-names pack is local only, so its checks run only when the file is there.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { addEventListener() {} }, addEventListener() {} };
sb.window = sb;
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

run(`Clubs.init(); GameState.startNewGame('England', 'T', 'A'); GameState.save = function () {};`);
const gen = JSON.parse(run(`return JSON.stringify(Clubs.allClubs.map(function (c) { return [c.id, c.name, clubShortName(c), youthTeamShort(c)]; }));`));
const over = gen.filter(c => c[2].length > 15 || /…$/.test(c[2]));
check(`every generic club has a short name of at most 15 letters (${gen.length} clubs)`, !over.length, JSON.stringify(over.slice(0, 5)));
check('a name that already fits is its own short name', gen.filter(c => c[1].length <= 15).every(c => c[2] === c[1]));
check('the full name is untouched (short names are for the history tables only)', run(`var c = Clubs.getClubById('Aston Villa'); return c.name === 'Birmingham Claret' && clubShortName(c) === "B'ham Claret";`));

check('importing a name drops the generic short one; the pack\'s short: entry sets it', run(`
  GameState.setClubName('Aston Villa', 'A Very Long Imported Club Name');
  var cut = clubShortName('Aston Villa');
  GameState.setClubShort('Aston Villa', 'Imported');
  return /…$/.test(cut) && cut.length === 15 && clubShortName('Aston Villa') === 'Imported' && Clubs.getClubById('Aston Villa').name === 'A Very Long Imported Club Name';`));
check('...and a competition abbreviation, saved and re-applied on load', run(`
  GameState.setCompName('UEL', 'Europa League'); GameState.setCompShort('UEL', 'UEL');
  var snap = GameState._snapshot();
  COMPETITIONS.UEL.short = 'EUR';
  GameState.compShorts = snap.compShorts; GameState._applyCompNames();
  return COMPETITIONS.UEL.short === 'UEL' && snap.clubShorts['Aston Villa'] === 'Imported';`));

const packPath = root + 'real-club-names.json';
if (fs.existsSync(packPath)) {
    const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
    const ids = new Set(gen.map(c => c[0]));
    const longNoShort = Object.entries(pack).filter(([id, v]) => ids.has(id) && typeof v === 'string' && v.trim().length > 15 && !pack['short:' + id]);
    const tooLong = Object.entries(pack).filter(([k, v]) => k.startsWith('short:') && ids.has(k.slice(6)) && String(v).length > 15);
    check('real-names pack: every club name over 15 letters has a short one, none over 15', !longNoShort.length && !tooLong.length, JSON.stringify([longNoShort.slice(0, 3), tooLong.slice(0, 3)]));
    check('real-names pack: Spurs, Man United, M\'gladbach, A Coruña, Stade L-O', pack['short:Tottenham'] === 'Spurs' && pack['short:Manchester United'] === 'Man United'
        && pack['short:Mönchengladbach'] === "M'gladbach" && pack['short:Deportivo'] === 'A Coruña' && pack.Deportivo === 'Deportivo A Coruña' && pack['short:Stade Lausanne'] === 'Stade L-O');
    check('real-names pack: the European and international abbreviations are real', pack['short:UCL'] === 'UCL' && pack['short:UEL'] === 'UEL' && pack['short:UECL'] === 'UECL'
        && pack['short:INTL_WC'] === 'WC' && pack['short:INTL_NL'] === 'UNL' && pack['short:INTL_QUAL'] === 'ECQ' && pack['short:INTL_EURO'] === 'EURO');
}
if (failed) process.exit(1);
console.log('All short-name checks passed.');
