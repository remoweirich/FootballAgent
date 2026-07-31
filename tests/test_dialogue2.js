// Phase 2 of the client-dialogue system: final-day rituals (pre-match word, win-bonus promise,
// party, consolation) and the retirement farewell.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js', 'dialogue-data.js', 'dialogue-data-de.js', 'dialogue.js'];
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

// a client and a fake attended-final match object shaped like Attend.consider's output
runv(`
  const clubs = Clubs.allClubs.filter(c => c.country === 'Netherlands' && c.tier === 1);
  globalThis.CLUB = clubs[0]; globalThis.OPP = clubs[1];
  globalThis.P = PlayerGen.makePlayer(CLUB, { ability: 74, age: 26, position: 'ST' });
  P.agentId = 'me'; P.everClient = true; P.name = 'Final Hero';
  GameState.players.push(P);
  globalThis.mkMatch = (winnerHome) => ({
    id: 'am_test1', kind: 'cup-final', compId: 'BEKER',
    homeId: CLUB.id, awayId: OPP.id,
    winner: winnerHome ? CLUB.id : OPP.id,
    clients: [{ playerId: P.id, side: 'home', played: true, rating: 7.8 }]
  });
`);

// ---- data presence ----
check('data: final + farewell pools parsed', runv(`
  return DIALOGUE_DATA.final.length >= 40 && DIALOGUE_DATA.farewell.length >= 12
    && DIALOGUE_DATA.choices.some(c => c.scene === 'prematch') && DIALOGUE_DATA.choices.some(c => c.scene === 'farewell');
`));

// ---- featured client ----
check('featuredClient: picks the inviter-side player', runv(`
  const m = mkMatch(true);
  const f = Dialogue.featuredClient(m);
  return f && f.id === P.id;
`));
check('featuredClient: null when no clients', runv(`
  return Dialogue.featuredClient({ clients: [] }) === null;
`));

// ---- prematch ----
check('prematch: scene builds with opponent slot and 3 choices', runv(`
  P._linesSeen = [];
  const s = Dialogue.buildPrematchScene(P, mkMatch(true));
  return s.kind === 'prematch' && s.open && s.open.text.length > 5 && !s.open.text.includes('{')
    && s.choices.map(c => c.key).join(',') === 'calm,fireup,bonus' && s.extra.opponent === OPP.name;
`));
check('prematch: calm on a hothead is matched and stored', runv(`
  P.personality = { primary: 'hothead', secondary: 'loyal', revP: false, revS: false };
  const s = Dialogue.buildPrematchScene(P, mkMatch(true));
  const r = Dialogue.resolvePrematch(P, s, 'calm');
  return r.ok && r.outcome === 'good' && P._finalTalk && P._finalTalk.matched === true && P._finalTalk.matchId === 'am_test1';
`));
check('prematch: fireup on a professional misses', runv(`
  P.personality = { primary: 'professional', secondary: 'homebody', revP: false, revS: false };
  const s = Dialogue.buildPrematchScene(P, mkMatch(true));
  const r = Dialogue.resolvePrematch(P, s, 'fireup');
  return r.ok && r.outcome === 'bad' && P._finalTalk.matched === false;
`));
check('prematch: bonus promise stores tier, blocks when broke', runv(`
  GameState.agency.balance = 100000000;
  let s = Dialogue.buildPrematchScene(P, mkMatch(true));
  const r1 = Dialogue.resolvePrematch(P, s, 'bonus', 'large');
  const stored = P._finalTalk.bonusTier === 'large';
  GameState.agency.balance = 10;
  s = Dialogue.buildPrematchScene(P, mkMatch(true));
  const r2 = Dialogue.resolvePrematch(P, s, 'bonus', 'large');
  GameState.agency.balance = 100000000;
  return r1.ok && stored && r2.ok === false;
`));

// ---- postmatch: bonus payout on a win ----
check('postmatch win: promised bonus pays out at 1.5x boost, +3 bond, money leaves', runv(`
  P.personality = { primary: 'showman', secondary: 'loyal', revP: true, revS: true };
  P.bond = 30; P.morale.agent = 50;
  P._finalTalk = { matchId: 'am_test1', choice: 'bonus', matched: false, bonusTier: 'medium' };
  const cost = Agency.giftCost('medium', P);
  const boost = Math.round(Agency.giftBoost('medium') * 1.5);
  const before = GameState.agency.balance;
  const s = Dialogue.buildPostmatchScene(P, mkMatch(true), true);
  return GameState.agency.balance === before - cost
    && P.morale.agent === Math.min(100, 50 + boost)
    && P.bond === 33
    && s.notes.some(n => n.includes('kept your promise'))
    && P._finalTalk === undefined;
`));
check('postmatch loss: promised bonus costs nothing', runv(`
  P._finalTalk = { matchId: 'am_test1', choice: 'bonus', matched: false, bonusTier: 'large' };
  const before = GameState.agency.balance;
  const s = Dialogue.buildPostmatchScene(P, mkMatch(false), false);
  return GameState.agency.balance === before && s.notes.some(n => n.includes('stays in your pocket'));
`));
check('postmatch: matched pre-match word adds +2 bond via notes', runv(`
  P.bond = 30;
  P._finalTalk = { matchId: 'am_test1', choice: 'calm', matched: true };
  const s = Dialogue.buildPostmatchScene(P, mkMatch(true), true);
  return P.bond === 32 && s.notes.some(n => n.includes('steadied him'));
`));
check('postmatch win: toast matches a showman (+3 bond)', runv(`
  P.bond = 30; P.morale.agent = 60;
  const r = Dialogue.resolvePostmatch(P, 'toast', true, { opponent: OPP.name });
  return r.ok && r.outcome === 'good' && P.bond === 33 && P.morale.agent === 63;
`));
check('postmatch win: tab always lands, costs a medium gift', runv(`
  P.bond = 30;
  const cost = Agency.giftCost('medium', P);
  const before = GameState.agency.balance;
  const r = Dialogue.resolvePostmatch(P, 'tab', true, { opponent: OPP.name });
  return r.ok && GameState.agency.balance === before - cost && P.bond === 34 && r.note && r.note.includes('on you');
`));
check('postmatch loss: sit on a humble player converts the moment (+4 bond)', runv(`
  P.personality = { primary: 'humble', secondary: 'loyal', revP: true, revS: true };
  P.bond = 30; P.morale.agent = 50;
  const r = Dialogue.resolvePostmatch(P, 'sit', false, { opponent: OPP.name });
  return r.ok && r.outcome === 'good' && P.bond === 34 && P.morale.agent === 52;
`));
check('postmatch loss: wrong call costs morale, small bond for showing up', runv(`
  P.personality = { primary: 'humble', secondary: 'loyal', revP: true, revS: true };
  P.bond = 30; P.morale.agent = 50;
  const r = Dialogue.resolvePostmatch(P, 'space', false, { opponent: OPP.name });
  return r.ok && r.outcome === 'bad' && P.bond === 31 && P.morale.agent === 48;
`));

// ---- scene ordering guarantee: banked result untouched ----
check('prematch: resolving choices never touches the banked match/winner', runv(`
  const m = mkMatch(true);
  const w = m.winner;
  const s = Dialogue.buildPrematchScene(P, m);
  Dialogue.resolvePrematch(P, s, 'calm');
  return m.winner === w;
`));

// ---- farewell ----
check('farewell: opener keyed by bond tier (family vs business)', runv(`
  P._linesSeen = [];
  P.bond = 80;
  const fam = Dialogue.buildFarewellScene(P);
  P._linesSeen = [];
  P.bond = 5;
  const biz = Dialogue.buildFarewellScene(P);
  const famRows = DIALOGUE_DATA.farewell.filter(r => r.beat === 'open' && r.tier === 'family').map(r => r.id);
  const bizRows = DIALOGUE_DATA.farewell.filter(r => r.beat === 'open' && r.tier === 'business').map(r => r.id);
  return fam.tier === 'family' && famRows.includes(fam.open.id) && biz.tier === 'business' && bizRows.includes(biz.open.id);
`));
check('farewell: montage reflects his real record', runv(`
  const y = GameState.seasonStartYear;
  const c = statBucket(P, y, CLUB.id, false, false, 'ERE');
  c.apps += 30; c.goals += 12; c.ratingSum += 30 * 7;
  const s = Dialogue.buildFarewellScene(P);
  return s.montage.includes('appearances') && s.montage.includes('goals');
`));
check('farewell: Confidant+ farewell bumps agency reputation once', runv(`
  P.bond = 60; delete P._farewellDone;
  const before = GameState.agency.reputation;
  const r1 = Dialogue.resolveFarewell(P, 'personal');
  const mid = GameState.agency.reputation;
  const r2 = Dialogue.resolveFarewell(P, 'career');
  return r1.ok && r1.note && mid === before + 2 && GameState.agency.reputation === mid;
`));
check('farewell: low bond farewell gives no rep bump', runv(`
  P.bond = 10; delete P._farewellDone;
  const before = GameState.agency.reputation;
  const r = Dialogue.resolveFarewell(P, 'career');
  return r.ok && !r.note && GameState.agency.reputation === before;
`));

// ---- retirement queue plumbing ----
check('retirement: pendingFarewells persists on the agency (save shape)', runv(`
  GameState.agency.pendingFarewells = [P.id];
  const snap = JSON.parse(JSON.stringify(GameState.agency));
  const ok = snap.pendingFarewells && snap.pendingFarewells[0] === P.id;
  GameState.agency.pendingFarewells = [];
  return ok;
`));

// ---- view flows ----
check('view: prematch bonus opens tier sub-choices with costs, then resolves', runv(`
  GameState.agency.balance = 100000000;
  delete P._finalTalk; P._linesSeen = [];
  let done = false;
  DialogueView.show(Dialogue.buildPrematchScene(P, mkMatch(true)), () => { done = true; });
  DialogueView.pick('bonus');
  const subs = (DialogueView.pendingChoices || []).map(c => c.key);
  const hasTiers = subs.includes('bonus:small') && subs.includes('bonus:large') && subs.includes('back');
  DialogueView.pick('bonus:small');
  const promised = P._finalTalk && P._finalTalk.bonusTier === 'small';
  const leave = (DialogueView.pendingChoices || []).some(c => c.key === 'leave');
  DialogueView.pick('leave');
  return hasTiers && promised && leave && done;
`));
check('view: postmatch scene shows notes then choices; full flow to leave', runv(`
  P._finalTalk = { matchId: 'am_test1', choice: 'calm', matched: true };
  let done = false;
  DialogueView.show(Dialogue.buildPostmatchScene(P, mkMatch(true), true), () => { done = true; });
  const offered = (DialogueView.pendingChoices || []).map(c => c.key).join(',');
  DialogueView.pick('quiet');
  const leave = (DialogueView.pendingChoices || []).some(c => c.key === 'leave');
  DialogueView.pick('leave');
  return offered === 'toast,quiet,tab' && leave && done;
`));
check('view: farewell flow shows montage and completes', runv(`
  P.bond = 80; delete P._farewellDone; P._linesSeen = [];
  let done = false;
  DialogueView.show(Dialogue.buildFarewellScene(P), () => { done = true; });
  const sawMontage = DialogueView.bubbles.some(b => b.side === 'sys' && /appearances/.test(b.text));
  DialogueView.pick('personal');
  DialogueView.pick('leave');
  return sawMontage && done;
`));

// ---- engine stability ----
runv(`for (let i = 0; i < 8; i++) Sim.advanceWeek();`);
check('engine: 8 weeks advance cleanly with Phase 2 loaded', errors.length === 0, errors.slice(0, 2).join(' | '));
check('engine: stale _finalTalk cleared by advanceWeek', runv(`
  P._finalTalk = { matchId: 'zz', choice: 'calm', matched: true };
  Sim.advanceWeek();
  return P._finalTalk === undefined;
`));

console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll Phase 2 dialogue checks passed.');
process.exit(failed || errors.length ? 1 : 0);
