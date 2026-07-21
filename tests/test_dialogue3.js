// Phase 3 of the client-dialogue system: check-in, facts ledger, favourite club + dream moves,
// ambitions, career-moment scenes and their detection hooks.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js', 'dialogue-data.js', 'dialogue.js'];
const uiFiles = ['shim.js', 'screen-dialogue.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const els = {};
const mkEl = id => els[id] || (els[id] = { id, innerHTML: '', style: {}, scrollTop: 0, scrollHeight: 0, querySelectorAll: () => [], addEventListener() {} });
const sb = {
  console: { log() {}, warn() {}, error: (...a) => errors.push(a.map(x => x && x.stack ? x.stack : String(x)).join(' ')) },
  setTimeout: (fn) => { fn(); return 0; },
  clearTimeout() {},
  Math, Date, JSON, indexedDB: idb(),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, getElementById: mkEl, createElement: () => ({ style: {}, textContent: '' }), head: { appendChild() {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
  location: { hash: '' },
};
sb.Router = { register() {}, link: (a, b) => `#${a}/${b}`, refresh() {}, go() {}, sheet() {}, result() {}, closeSheet() {}, modal() {}, closeModal() {} };
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
for (const f of uiFiles) vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c, extra) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (extra ? '  ' + extra : '')); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands', 'Testers FC', 'Jens');`);
runv(`
  const t1 = Clubs.allClubs.filter(c => c.country === 'Netherlands' && c.tier === 1);
  globalThis.CLUB = t1[0]; globalThis.FAV = t1[1];
  globalThis.P = PlayerGen.makePlayer(CLUB, { ability: 68, age: 22, position: 'ST' });
  P.agentId = 'me'; P.everClient = true; P.name = 'Kid Wonder';
  GameState.players.push(P);
`);

// ---- facts rolls ----
check('facts: rolled lazily with all four entries, undiscovered', runv(`
  const f = Dialogue.ensureFacts(P);
  return f.favClub && f.family && f.hobby && f.ambition
    && !f.favClub.discovered && !f.family.discovered && !f.hobby.discovered && !f.ambition.discovered;
`));
check('facts: a real favourite club is assigned (home/region bias covered in test_ambitions)', runv(`
  const f = Dialogue.ensureFacts(P);
  return !!Clubs.getClubById(f.favClub.clubId);
`));
check('facts: stable across calls, survives JSON round trip', runv(`
  const a = Dialogue.ensureFacts(P).favClub.clubId;
  const snap = JSON.parse(JSON.stringify(P));
  return Dialogue.ensureFacts(P).favClub.clubId === a && snap.facts.favClub.clubId === a;
`));
check('facts: ambitionText and progress render without holes', runv(`
  const t = Dialogue.ambitionText(P), pr = Dialogue.ambitionProgress(P);
  return typeof t === 'string' && t.length > 4 && !t.includes('{') && typeof pr === 'string';
`));

// ---- check-in ----
check('checkin: gated by cooldown', runv(`
  P._checkinAbs = null;
  const a = Dialogue.canCheckIn(P).ok;
  P._checkinAbs = GameState.absWeek();
  const b = Dialogue.canCheckIn(P);
  P._checkinAbs = null;
  return a === true && b.ok === false && b.reason === 'cooldown';
`));
check('checkin: scene offers club/ambition questions only while undiscovered', runv(`
  P.facts.favClub.discovered = false; P.facts.ambition.discovered = false;
  const s1 = Dialogue.buildCheckinScene(P);
  P.facts.favClub.discovered = true; P.facts.ambition.discovered = true;
  const s2 = Dialogue.buildCheckinScene(P);
  P.facts.favClub.discovered = false; P.facts.ambition.discovered = false;
  const k1 = s1.choices.map(c => c.key), k2 = s2.choices.map(c => c.key);
  return k1.includes('q-club') && k1.includes('q-ambition') && !k2.includes('q-club') && !k2.includes('q-ambition') && k2.includes('q-life');
`));
check('checkin: q-club discovers the boyhood club with a note and slot-filled reply', runv(`
  P._linesSeen = [];
  const r = Dialogue.resolveCheckin(P, 'q-club');
  const c = Clubs.getClubById(P.facts.favClub.clubId);
  return r.ok && P.facts.favClub.discovered && r.note.includes(c.name) && !r.reply.text.includes('{');
`));
check('checkin: q-life discovers family first, hobby second, then nothing', runv(`
  P.facts.family.discovered = false; P.facts.hobby.discovered = false;
  const r1 = Dialogue.resolveCheckin(P, 'q-life');
  const gotFam = P.facts.family.discovered && !P.facts.hobby.discovered;
  const r2 = Dialogue.resolveCheckin(P, 'q-life');
  const gotHobby = P.facts.hobby.discovered && r2.note.includes(P.facts.hobby.name);
  const r3 = Dialogue.resolveCheckin(P, 'q-life');
  return gotFam && gotHobby && r3.ok && !r3.note;
`));
check('checkin: resets the neglect clock (agent-action credit)', runv(`
  P._lastAgentActionAbs = 0;
  Dialogue.resolveCheckin(P, 'q-none');
  return P._lastAgentActionAbs === GameState.absWeek();
`));

// ---- moment queue + milestones ----
check('queue: dedupes by (type, player) and caps', runv(`
  GameState.agency.pendingScenes = [];
  Dialogue.queueMoment({ type: 'hattrick', playerId: P.id });
  Dialogue.queueMoment({ type: 'hattrick', playerId: P.id });
  return GameState.agency.pendingScenes.length === 1;
`));
check('milestones: baseline initialises silently (no stale scene for a veteran)', runv(`
  GameState.agency.pendingScenes = [];
  delete P._mile;
  const y = GameState.seasonStartYear;
  const c = statBucket(P, y, CLUB.id, false, false, 'ERE');
  c.apps += 120; c.goals += 60; c.ratingSum += 120 * 7;
  Dialogue.weeklyMoments();
  return GameState.agency.pendingScenes.length === 0 && P._mile.a >= 120;
`));
check('milestones: crossing 250 apps queues the milestone scene', runv(`
  GameState.agency.pendingScenes = [];
  const y = GameState.seasonStartYear;
  const c = statBucket(P, y, CLUB.id, false, false, 'ERE');
  const need = 250 - P._mile.a + 1;
  c.apps += need; c.ratingSum += need * 7;
  Dialogue.weeklyMoments();
  const q = GameState.agency.pendingScenes;
  return q.length === 1 && q[0].type === 'milestone' && q[0].milestone === '250 appearances';
`));
check('milestones: debut fires for a fresh client with a tracked zero baseline', runv(`
  GameState.agency.pendingScenes = [];
  const kid = PlayerGen.makePlayer(CLUB, { ability: 55, age: 17, position: 'CM' });
  kid.agentId = 'me'; kid.everClient = true; GameState.players.push(kid);
  Dialogue.weeklyMoments();                       // baseline at 0 apps
  const y = GameState.seasonStartYear;
  const c = statBucket(kid, y, CLUB.id, false, false, 'ERE');
  c.apps += 1; c.ratingSum += 7;
  Dialogue.weeklyMoments();
  const q = GameState.agency.pendingScenes;
  const ok = q.some(e => e.type === 'debut' && e.playerId === kid.id);
  GameState.players = GameState.players.filter(x => x.id !== kid.id);
  GameState.agency.pendingScenes = [];
  return ok;
`));

// ---- ambitions ----
check('ambition: goals target fulfils and queues, +6 bond +1 rep on scene build', runv(`
  P.facts.ambition = { type: 'goals', target: 50, discovered: true, fulfilled: false };
  P.bond = 30;
  const repBefore = GameState.agency.reputation;
  GameState.agency.pendingScenes = [];
  Dialogue.weeklyMoments();          // career goals are already 60+
  const q = GameState.agency.pendingScenes;
  const queued = q.length === 1 && q[0].type === 'ambition' && P.facts.ambition.fulfilled;
  const scene = Dialogue.buildMomentScene(q[0]);
  return queued && scene && P.bond === 36 && GameState.agency.reputation === repBefore + 1
    && scene.extra.ambition.includes('50');
`));
check('ambition: undiscovered ambitions never fulfil silently', runv(`
  P.facts.ambition = { type: 'goals', target: 50, discovered: false, fulfilled: false };
  GameState.agency.pendingScenes = [];
  Dialogue.weeklyMoments();
  return GameState.agency.pendingScenes.length === 0 && !P.facts.ambition.fulfilled;
`));
check('ambition: abroad fulfils when playing outside his homeland', runv(`
  P.facts.ambition = { type: 'abroad', discovered: true, fulfilled: false };
  const eng = Clubs.allClubs.find(c => c.country === 'England' && c.tier === 1);
  const old = P.clubId; P.clubId = eng.id;
  GameState.agency.pendingScenes = [];
  Dialogue.weeklyMoments();
  const ok = P.facts.ambition.fulfilled;
  P.clubId = old; GameState.agency.pendingScenes = [];
  return ok;
`));

// ---- transfer + dream move ----
check('transfer: completing a move to his boyhood club queues the dream scene, +8 bond', runv(`
  P.facts.favClub = { clubId: FAV.id, discovered: false, fulfilled: false };
  P.bond = 40;
  GameState.agency.pendingScenes = [];
  Dialogue.onTransferCompleted(P, FAV.id);
  const q = GameState.agency.pendingScenes;
  const queued = q.length === 1 && q[0].type === 'dreammove';
  const scene = Dialogue.buildMomentScene(q[0]);
  return queued && P.facts.favClub.fulfilled && P.facts.favClub.discovered
    && P.bond === 48 && scene.extra.newclub === FAV.name;
`));
check('transfer: an ordinary move queues NO chat (only meaningful moves do)', runv(`
  GameState.agency.pendingScenes = [];
  P.facts.favClub = { clubId: 'some-other-club', discovered: false, fulfilled: false };
  Dialogue.onTransferCompleted(P, CLUB.id);   // CLUB is not his favourite
  return GameState.agency.pendingScenes.length === 0;
`));
check('transfer: _finalizeTransfer hook fires end-to-end (ordinary move, no chat, no crash)', runv(`
  GameState.agency.pendingScenes = [];
  const dest = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 2);
  P.facts.favClub = { clubId: 'not-the-dest', discovered: false, fulfilled: false };
  const r = Agency._finalizeTransfer(P, { toClubId: dest.id, fromClubId: P.clubId, fee: 100000, wage: 8000, term: 2, role: 'starter', initiatedByAgent: true });
  return r.ok !== false && GameState.agency.pendingScenes.length === 0;
`));

// ---- injury ----
check('injury: a long layoff queues the visit; short ones do not', runv(`
  GameState.agency.pendingScenes = [];
  Dialogue.onInjury(P, 3);
  const short = GameState.agency.pendingScenes.length === 0;
  Dialogue.onInjury(P, 8);
  const long = GameState.agency.pendingScenes.length === 1 && GameState.agency.pendingScenes[0].weeks === 8;
  return short && long;
`));
check('injury: visiting in person earns +3 bond; scene fills {weeks}', runv(`
  const entry = GameState.agency.pendingScenes[0];
  const scene = Dialogue.buildMomentScene(entry);
  P.bond = 30;
  const r = Dialogue.resolveMoment(P, scene, 'there');
  GameState.agency.pendingScenes = [];
  return scene.open.text.includes('8') && r.ok && P.bond === 33
    && scene.choices.map(c => c.key).join(',') === 'there,flowers';
`));

// ---- moment resolution matching ----
check('moment: praise suits a showman (+2 bond), modest suits him less (+1)', runv(`
  P.personality = { primary: 'showman', secondary: 'loyal', revP: true, revS: true };
  const scene = { kind: 'moment', momentType: 'hattrick', playerId: P.id, extra: {} };
  P.bond = 30;
  Dialogue.resolveMoment(P, scene, 'praise');
  const praised = P.bond === 32;
  P.bond = 30;
  Dialogue.resolveMoment(P, scene, 'modest');
  return praised && P.bond === 31;
`));

// ---- volunteered facts on tier upgrade ----
check('tier upgrade: he volunteers an undiscovered fact in the mail', runv(`
  P.facts.favClub = { clubId: FAV.id, discovered: false, fulfilled: false };
  P.bond = 24;
  const before = GameState.inbox.length;
  Dialogue.addBond(P, 2, 'test');
  const mail = GameState.inbox[0];   // addMail unshifts: the newest mail is FIRST
  return GameState.inbox.length === before + 1 && P.facts.favClub.discovered
    && mail.body.includes(FAV.name);
`));

// ---- boyhood at retirement ----
check('boyhood: retiring at the boyhood club fulfils the ambition (+4 bond)', runv(`
  P.facts.favClub = { clubId: FAV.id, discovered: true, fulfilled: false };
  P.facts.ambition = { type: 'boyhood', discovered: true, fulfilled: false };
  P.clubId = FAV.id; P.bond = 50;
  Dialogue.checkBoyhoodAtRetirement(P);
  const s = Dialogue.buildFarewellScene(P);
  return P.facts.ambition.fulfilled && P.bond === 54 && s.boyhoodNote && s.boyhoodNote.length > 10;
`));

// ---- view flow ----
check('view: check-in full flow (question, fact note, leave)', runv(`
  P.facts.favClub.discovered = false; P._checkinAbs = null; P._linesSeen = [];
  let done = false;
  DialogueView.show(Dialogue.buildCheckinScene(P), () => { done = true; });
  const hasQ = (DialogueView.pendingChoices || []).some(c => c.key === 'q-club');
  DialogueView.pick('q-club');
  const noted = DialogueView.bubbles.some(b => b.side === 'sys' && b.text.indexOf('Noted') === 0);
  DialogueView.pick('leave');
  return hasQ && noted && done;
`));
check('view: moment scene full flow', runv(`
  let done = false;
  const scene = Dialogue.buildMomentScene({ type: 'hattrick', playerId: P.id });
  DialogueView.show(scene, () => { done = true; });
  DialogueView.pick('praise');
  DialogueView.pick('leave');
  return done;
`));

// ---- engine stability ----
runv(`GameState.agency.pendingScenes = []; for (let i = 0; i < 10; i++) Sim.advanceWeek();`);
check('engine: 10 weeks advance cleanly with Phase 3 loaded', errors.length === 0, errors.slice(0, 2).join(' | '));

console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll Phase 3 dialogue checks passed.');
process.exit(failed || errors.length ? 1 : 0);
