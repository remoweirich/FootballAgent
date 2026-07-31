// End-to-end: drives the real Sim.advanceWeek() loop for 3 seasons and checks that Europe is built
// at new-game, stepped weekly, validated, and rebuilt each rollover — without breaking the domestic
// sim (sizes stable, no DEV-WARNING mail, no engine errors).
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = require('path').join(__dirname, '..', 'js') + '/';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = { console: { log() { }, warn() { }, error: (...a) => errors.push(a.map(x => x && x.stack ? x.stack : (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')) }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => Math.round(n || 0).toLocaleString('en-US') } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Germany','Integrationsverein');`);
check('season 1 has NO European competitions (disclaimer)', runv(`return !GameState.league.europe`));

// helper: advance until a season rolls, collecting the finished edition BEFORE it's replaced
function playSeason(label) {
    // snapshot europe object reference detection: run to rollover
    let rolled = false, weeks = 0, stageAtLP = null, doneEdition = null;
    while (!rolled && weeks < 60) {
        // capture the current edition just before advancing past week 48
        const info = JSON.parse(runv(`
      const before = GameState.league.europe;
      const r = Sim.advanceWeek();
      // if we just rolled, GameState.league.europe is the NEW edition; the finished one is in lastSeasonReport.europe
      return JSON.stringify({ rolled: !!r.rolledSeason, week: GameState.week, stage: before? before.stage: null });
    `));
        weeks++;
        rolled = info.rolled;
    }
    return rolled;
}

for (let s = 1; s <= 3; s++) {
    const rolled = playSeason('S' + s);
    check(`season ${s} rolled over`, rolled);
    if (s === 1) {
        // season 1 had no Europe, so nothing is snapshotted; the NEW live edition (season 2) exists
        check('  after S1 rollover: no finished Europe edition (S1 had none)', runv(`return !(GameState.lastSeasonReport && GameState.lastSeasonReport.europe)`));
        check('  season 2 Europe now live (built from S1 results)', runv(`return !!GameState.league.europe && GameState.league.europe.comps.UCL.lpEntrants.length>=27`));
        continue;
    }
    // seasons 2+ : the just-finished edition is snapshotted in lastSeasonReport.europe
    const rep = JSON.parse(runv(`
    const ed = GameState.lastSeasonReport && GameState.lastSeasonReport.europe;
    if(!ed) return JSON.stringify({none:true});
    const problems = Europe.validate(ed);
    const sizes = Europe.COMPS.map(k=>ed.comps[k].lpEntrants.length);
    const champs = {}; Europe.COMPS.forEach(k=> champs[k]= ed.comps[k].ko.winner? League.teamName(ed.comps[k].ko.winner):null);
    const stage = ed.stage;
    const warnings = ed.warnings;
    return JSON.stringify({problems, sizes, champs, stage, warnings});
  `));
    check(`  S${s} finished edition validates clean: ` + JSON.stringify(rep.problems || rep), !rep.none && rep.problems.length === 0);
    check(`  S${s} finished edition sizes 36/36/36 (${rep.sizes})`, rep.sizes && rep.sizes.join(',') === '36,36,36');
    check(`  S${s} all three champions crowned: ` + JSON.stringify(rep.champs), rep.champs && Object.values(rep.champs).every(Boolean));
    check(`  S${s} edition stage 'done'`, rep.stage === 'done');
    check(`  S${s} no draw/relax warnings: ` + JSON.stringify(rep.warnings), rep.warnings && rep.warnings.length === 0);
    // domestic health
    check(`  S${s} no DEV WARNING mail`, runv(`return GameState.inbox.filter(m=>m.subject&&m.subject.includes('DEV WARNING')).length`) === 0);
}

// a real qualified club has its 8 fixtures; virtual clubs participate too
check('a real UCL entrant has 8 league-phase fixtures', runv(`
  const ed=GameState.lastSeasonReport.europe; const c=ed.comps.UCL;
  const real = c.lpEntrants.find(id=> Clubs.getClubById(id));
  return real && c.fixtures[real] && c.fixtures[real].length===8;
`));
check('a virtual (pooled) club reached the league phase somewhere', runv(`
  const ed=GameState.lastSeasonReport.europe;
  return Europe.COMPS.some(k=> ed.comps[k].lpEntrants.some(id=> id.startsWith('eu:')));
`));

// highlighting derives from the same config for the home country
check('highlightMap marks the champion CHAMP for the home division', runv(`
  const order = League.sortedTable('BUNDES').map(r=>r.clubId);
  const cup = GameState.league.dfb ? GameState.league.dfb.winner : null;
  const hm = Europe.highlightMap('Germany', order, cup);
  return hm[order[0]]==='CHAMP';
`));

check('no engine errors across 3 seasons, got: ' + JSON.stringify(errors.slice(0, 3)), errors.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Europe integration checks passed.');
process.exitCode = failed ? 1 : 0;
