// Verifies the reworked favourite-club + ambition system: home/region bias, rival avoidance,
// league aspirations, ability-attenuated dream clubs, and pronoun-free first-person text.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js', 'dialogue-data.js', 'dialogue.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = {
  console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) },
  setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {} }), head: { appendChild() {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, location: { hash: '' },
};
sb.Router = { register() {}, link: () => '#', refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {} };
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands', 'Testers FC');`);

// --- favourite club: home + region bias, rival avoidance -------------------
check('favClub: ~95% from the home country over many rolls', runv(`
  const club = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 1);
  let home = 0, n = 400;
  for (let i = 0; i < n; i++) {
    const p = PlayerGen.makePlayer(club, { ability: 62, age: 20, position: 'CM' });
    p.nationality = 'Netherlands';
    const fav = Clubs.getClubById(Dialogue._rollFavClub(p));
    if (fav && fav.country === 'Netherlands') home++;
  }
  return home / n > 0.9;
`), 'expect >0.90');

check('favClub: a Basel one-club man never gets a big Swiss RIVAL (Zürich/YB/Servette…)', runv(`
  const basel = Clubs.allClubs.find(c => c.name === 'FC Basel');
  if (!basel) return true;
  let rival = 0, self = 0, n = 300;
  for (let i = 0; i < n; i++) {
    const p = PlayerGen.makePlayer(basel, { ability: 78, age: 22, position: 'CM' });
    p.nationality = 'Switzerland';
    // give him real Basel tenure so _primaryClub = Basel
    const y = GameState.seasonStartYear; const b = statBucket(p, y, basel.id, false, false, 'SuperLeagueCH'); b.apps += 60;
    const fav = Clubs.getClubById(Dialogue._rollFavClub(p));
    if (!fav) continue;
    if (fav.id === basel.id) self++;
    else if (fav.country === 'Switzerland' && fav.reputation >= 62) rival++;
  }
  return rival === 0 && self > 0;
`), 'no big Swiss rival, and Basel itself appears');

check('favClub: region bias — a Basel man usually supports a Basel-region club', runv(`
  const basel = Clubs.allClubs.find(c => c.name === 'FC Basel');
  if (!basel) return true;
  let sameRegion = 0, n = 200;
  for (let i = 0; i < n; i++) {
    const p = PlayerGen.makePlayer(basel, { ability: 70, age: 21, position: 'CM' });
    p.nationality = 'Switzerland';
    const fav = Clubs.getClubById(Dialogue._rollFavClub(p));
    if (fav && fav.region === basel.region) sameRegion++;
  }
  return sameRegion / n > 0.6;
`), 'expect majority in his region');

// --- ambitions --------------------------------------------------------------
check('ambition: a Swiss talent can dream of a bigger LEAGUE (e.g. the Bundesliga), never his own', runv(`
  const yb = Clubs.allClubs.find(c => c.name === 'Young Boys') || Clubs.allClubs.find(c => c.country === 'Switzerland' && c.tier === 1);
  let leagueDreams = 0, ownLeague = 0, n = 300;
  for (let i = 0; i < n; i++) {
    const p = PlayerGen.makePlayer(yb, { ability: 68, age: 20, position: 'LW' });
    p.nationality = 'Switzerland';
    const a = Dialogue._rollAmbition(p, null);
    if (a.type === 'league') { leagueDreams++; if (a.div === yb.division) ownLeague++; }
  }
  return leagueDreams > 30 && ownLeague === 0;
`), 'league dreams present, never his own division');

check('ambition text is first-person clean (no "his", fills all slots)', runv(`
  const club = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 1);
  const types = ['league','dreamclub','boyhood','title','cup','europe','goals'];
  for (const t of types) {
    const p = PlayerGen.makePlayer(club, { ability: 66, age: 22, position: 'ST' });
    p.nationality = 'Netherlands';
    Dialogue.ensureFacts(p);
    // force each type
    if (t === 'league') p.facts.ambition = { type:'league', div:'BUNDES', discovered:true };
    else if (t === 'dreamclub') p.facts.ambition = { type:'dreamclub', clubId: club.id, discovered:true };
    else if (t === 'boyhood') p.facts.ambition = { type:'boyhood', discovered:true };
    else if (t === 'goals') p.facts.ambition = { type:'goals', target:100, discovered:true };
    else p.facts.ambition = { type:t, discovered:true };
    const txt = Dialogue.ambitionText(p);
    const line = 'I want to ' + txt + '.';
    if (/\\bhis\\b/.test(txt) || txt.includes('{') || txt.length < 5) return false;
    // sanity: reads as a sentence after "I want to"
    if (!/^I want to [a-z]/.test(line)) return false;
  }
  return true;
`));

check('ambition: league fulfils by playing in that division; dreamclub by joining that club', runv(`
  const nl = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 1);
  const de = Clubs.allClubs.find(c => c.division === 'BUNDES');
  const p = PlayerGen.makePlayer(nl, { ability: 72, age: 24, position: 'CM' });
  p.nationality = 'Netherlands'; p.agentId = 'me'; p.everClient = true; GameState.players.push(p);
  Dialogue.ensureFacts(p);
  p.facts.ambition = { type:'league', div:'BUNDES', discovered:true, fulfilled:false };
  GameState.agency.pendingScenes = [];
  Dialogue._checkAmbition(p);            // still in NL -> not fulfilled
  const before = p.facts.ambition.fulfilled;
  p.clubId = de.id;
  Dialogue._checkAmbition(p);            // now in the Bundesliga -> fulfilled
  const leagueOK = before === false && p.facts.ambition.fulfilled === true;
  const target = Clubs.allClubs.find(c => c.country === 'England' && c.tier === 1 && c.id !== de.id);
  p.facts.ambition = { type:'dreamclub', clubId: target.id, discovered:true, fulfilled:false };
  Dialogue._checkAmbition(p); const notYet = !p.facts.ambition.fulfilled;
  p.clubId = target.id; Dialogue._checkAmbition(p);
  GameState.players = GameState.players.filter(x => x.id !== p.id);
  return leagueOK && notYet && p.facts.ambition.fulfilled === true;
`));

check('ambition: low-ability dream club stays a top-flight side back home (realistic), never a rival', runv(`
  const nl2 = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 2) || Clubs.allClubs.find(c => c.country === 'Netherlands');
  let homeTop1 = 0, n = 200;
  for (let i = 0; i < n; i++) {
    const p = PlayerGen.makePlayer(nl2, { ability: 48, age: 19, position: 'RB' });
    p.nationality = 'Netherlands';
    const id = Dialogue._rollDreamClub(p, null);
    const c = Clubs.getClubById(id);
    if (c && c.country === 'Netherlands' && c.tier === 1) homeTop1++;
  }
  return homeTop1 / n > 0.6;
`), 'modest talents dream of home top-flight clubs');

// legacy compatibility
check('legacy: old topflight/abroad ambitions still render and fulfil', runv(`
  const club = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 1);
  const p = PlayerGen.makePlayer(club, { ability: 70, age: 25, position: 'ST' });
  p.nationality = 'Netherlands'; Dialogue.ensureFacts(p);
  p.facts.ambition = { type:'abroad', discovered:true, fulfilled:false };
  const txt = Dialogue.ambitionText(p);
  const eng = Clubs.allClubs.find(c => c.country === 'England' && c.tier === 1);
  p.clubId = eng.id;
  Dialogue._checkAmbition(p);
  return txt === 'play abroad' && p.facts.ambition.fulfilled === true;
`));

check('no engine errors', errors.length === 0, errors.slice(0,2).join(' | '));
console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll ambition/favClub checks passed.');
process.exit(failed || errors.length ? 1 : 0);
