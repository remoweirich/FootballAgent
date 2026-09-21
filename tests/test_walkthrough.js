// Walkthrough test: the first-run tutorial runs on a scripted demo save swapped into GameState.
// This checks (a) the demo player really carries the numbers the narration claims, (b) the career
// timeline is internally consistent, (c) every script step points at an i18n key that exists in
// BOTH languages, and (d) the demo never touches the player's own save.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const uiBase = path.join(__dirname, '..', 'ui', 'js') + '/';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'dialogue.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const sb = {
    console: { log() { }, warn() { }, error() { } }, setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, indexedDB: idb(),
    localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
    document: { addEventListener() { }, getElementById: () => null, querySelector: () => null, createElement: () => ({ style: {}, classList: { toggle() { } }, appendChild() { } }), head: { appendChild() { } }, body: { appendChild() { } } },
    window: { addEventListener() { }, innerWidth: 400, innerHeight: 800 },
    UI: { money: n => Math.round(n || 0).toLocaleString('en-US') },
};
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
// UI-side packs + the walkthrough itself
vm.runInContext(fs.readFileSync(path.join(uiBase, 'i18n-en.js'), 'utf8'), sb, { filename: 'ui/i18n-en.js' });
vm.runInContext(fs.readFileSync(path.join(uiBase, 'i18n-de.js'), 'utf8'), sb, { filename: 'ui/i18n-de.js' });
vm.runInContext(fs.readFileSync(path.join(uiBase, 'walkthrough.js'), 'utf8'), sb, { filename: 'walkthrough.js' });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Switzerland','Test Agency','Tester');`);

// ---- starter mails land in every new save ----
check('a new save opens with the two starter mails', runv(`
  return GameState.inbox.length === 2 && GameState.inbox.every(m => !m.read)
      && GameState.inbox.some(m => m.subject === I18n.t('mail.welcome.subj', { agency: GameState.agency.name }))
      && GameState.inbox.some(m => m.subject === I18n.t('mail.basics.subj'));`));

// ---- the demo player carries the numbers the narration claims ----
runv(`Walkthrough._installDemo();`);
const p = () => runv(`return JSON.parse(JSON.stringify(GameState.players[0]))`);

check('one client: Johan Maradona, Swiss, 24, CAM, star, ability 92', runv(`
  const c = Agency.clients(); const p = c[0];
  return c.length === 1 && p.name === 'Johan Maradona' && p.nationality === 'Switzerland'
      && p.age === 24 && p.position === 'CAM' && p.squadRole === 'star' && p.ability === 92;`));

check('at München Red on 250k, contract to 31/32, represented to 33/34', runv(`
  const p = GameState.players[0];
  return Clubs.getClubById(p.clubId).name === 'München Red' && p.wage === 250000
      && GameState.seasonLabelFor(p.contractUntilSeason) === '31/32'
      && GameState.seasonLabelFor(p.repUntilSeason) === '33/34';`));

check('contract reads as 2 years left in season 30/31', runv(`
  return GameState.seasonLabel() === '30/31'
      && (GameState.players[0].contractUntilSeason - GameState.seasonStartYear) + 1 === 2;`));

check('morale 47/100/59/83 -> amber, green, amber, green', runv(`
  const m = GameState.players[0].morale;
  const band = v => v >= 60 ? 'green' : v >= 35 ? 'amber' : 'red';
  return m.club === 47 && m.time === 100 && m.wage === 59 && m.agent === 83
      && [band(m.club), band(m.time), band(m.wage), band(m.agent)].join(',') === 'amber,green,amber,green';`));

check('bond 38 sits in the Trusted tier', runv(`
  const tier = Dialogue.TIERS.find(t => GameState.players[0].bond >= t[0]);
  return tier && tier[1] === 'Trusted';`));

check('injured: ankle sprain, 3 weeks, untreated', runv(`
  const i = GameState.players[0].injury;
  return i && i.weeksOut === 3 && !i.specialistUsed && i.treatedWeek === null;`));

check('injury history: a 22-week hamstring tear in 26/27', runv(`
  const h = GameState.players[0].injuryHistory;
  return h.length === 1 && h[0].weeks === 22 && h[0].season === '26/27';`));

check('current season: 32 apps, 14 goals, 12 assists, 2 yellow, 0 red, 8.38 avg', runv(`
  const c = GameState.players[0].stats[2030]['Bayern Munich'].comps.league;
  return c.apps === 32 && c.goals === 14 && c.assists === 12 && c.yellow === 2 && c.red === 0
      && Math.abs((c.ratingSum / c.apps) - 8.38) < 0.005;`));

check('scout report: attacking midfielder, Superstar ceiling / Regular floor', runv(`
  const r = GameState.players[0].report;
  return r.role === 'attacking_midfielder' && r.ceiling === 'International Superstar' && r.floor === 'International Regular';`));

// ---- the career timeline adds up ----
check('career: Basel U21 -> Basel -> Stuttgart -> München Red, 3rd season now', runv(`
  const st = GameState.players[0].stats;
  const years = Object.keys(st).map(Number).sort((a, b) => a - b);
  const munich = years.filter(y => st[y]['Bayern Munich']);
  return years[0] === 2023 && years[years.length - 1] === 2030
      && st[2023]['Basel U21'] && st[2024]['Basel U21'] && st[2024]['Basel'] && st[2025]['Basel']
      && st[2026]['Stuttgart'] && st[2027]['Stuttgart'] && munich.length === 3;`));

check('he was 17 in his first U21 season (24 now, 8 seasons)', runv(`
  const p = GameState.players[0];
  const first = Math.min(...Object.keys(p.stats).map(Number));
  return p.age - (GameState.seasonStartYear - first) === 17;`));

check('the 26/27 hamstring year shows a shortened season', runv(`
  const st = GameState.players[0].stats;
  return st[2026]['Stuttgart'].comps.league.apps < st[2027]['Stuttgart'].comps.league.apps / 2;`));

// ---- the script is complete and translated ----
check('every script step resolves to a non-empty EN string', runv(`
  I18n.setLocale && I18n.setLocale('en');
  return Walkthrough.SCRIPT.every(s => { const t = I18n.t(s.key); return t && t !== s.key; });`));

check('every script step resolves in German too (EN/DE parity)', runv(`
  const missing = Walkthrough.SCRIPT.filter(s => !(s.key in I18n.packs.de));
  return missing.length === 0;`));

check('control strings exist in both languages', runv(`
  const keys = ['wt.skip', 'wt.next', 'wt.done', 'wt.step', 'wt.finished', 'settings.walkthrough'];
  return keys.every(k => (k in I18n.packs.en) && (k in I18n.packs.de));`));

check('tap steps all name a target to tap', runv(`
  return Walkthrough.SCRIPT.filter(s => s.tap).every(s => !!s.target) && Walkthrough.SCRIPT.some(s => s.tap);`));

// ---- part 2: the scouting stage is set up in England with a fixed shortlist ----
check('demo is based in England (West Midlands / Birmingham Claret)', runv(`
  return GameState.homeCountry === 'England'
      && regionsForCountry('England').some(r => r.id === 'west-midlands')
      && Clubs.getClubById('Aston Villa').name === 'Birmingham Claret';`));

check("scout shortlist is the scripted three, at the game's own wages", runv(`
  const m = Scouts.market();
  const want = [['James Wilson', 61, 'Senior scout'], ['Gemma Harris', 75, 'Chief scout'], ['Mo Jackson', 85, 'Chief scout']];
  return m.length === 3 && want.every(([n, q, t], i) =>
      m[i].name === n && m[i].quality === q && m[i].title === t
      && m[i].title === Scouts.titleFor(q) && m[i].weeklyCost === Scouts.salaryFor(q));`));

check('all three scouts read as High find quality (>=55)', runv(`
  return Scouts.market().every(o => o.quality >= 55);`));

check('the shortlist cannot be refreshed away mid-tutorial', runv(`
  const before = Scouts.market().map(o => o.id).join(',');
  GameState.week += 3;
  const after = Scouts.market().map(o => o.id).join(',');
  GameState.week -= 3;
  return before === after;`));

check('hiring Gemma puts her on the books, ready to be posted', runv(`
  const offer = Scouts.market().find(o => o.name === 'Gemma Harris');
  const r = Scouts.hire(offer);
  const hired = GameState.agency.scouts.find(s => s.name === 'Gemma Harris');
  return r.ok && hired && hired.region === null;`));

check('posting her to the West Midlands satisfies the assign step', runv(`
  const hired = GameState.agency.scouts.find(s => s.name === 'Gemma Harris');
  Scouts.assignRegion(hired.id, 'west-midlands');
  const step = Walkthrough.SCRIPT.find(s => s.key === 'wt.scout.assign');
  return step.until();`));

check('the brief narrows her to under-20s, any position, top division', runv(`
  Walkthrough._briefGemma();
  const g = GameState.agency.scouts.find(s => s.region === 'west-midlands');
  return g.maxTalentAge === 19 && g.position === null && g.tier === 'top';`));

// ---- the real save is never written while the demo is up ----
check('save() is a no-op in demo mode', runv(`
  let wrote = false;
  const real = Storage.saveGame; Storage.saveGame = () => { wrote = true; };
  GameState.demoMode = true; GameState.save();
  const blocked = !wrote;
  GameState.demoMode = false; GameState.save();
  const allowed = wrote;
  Storage.saveGame = real;
  return blocked && allowed;`));

// ---- restoring puts the player's own game back untouched ----
check('restore returns the real players/inbox/week/season', runv(`
  Walkthrough._restore();
  return GameState.seasonStartYear === 2025 && GameState.week === 1
      && GameState.inbox.length === 2 && Agency.clients().length === 0
      && GameState.demoMode === false;`));

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll walkthrough checks passed.');
process.exit(failed ? 1 : 0);
