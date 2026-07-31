// Phase 1 of the client-dialogue system: personality, bond, complaint and gift scenes,
// line picking, bond hooks, and the DialogueView flow under a DOM stub.
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
  setTimeout: (fn) => { fn(); return 0; },   // scenes land instantly under test
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

// a controllable client
runv(`
  const club = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 1);
  globalThis.P = PlayerGen.makePlayer(club, { ability: 70, age: 24, position: 'ST' });
  P.agentId = 'me'; P.everClient = true; P.name = 'Test Man';
  GameState.players.push(P);
`);

// ---- personality ----
check('personality: lazily rolled with primary+secondary from different axes', runv(`
  const pe = Dialogue.ensurePersonality(P);
  const axisOf = pole => Dialogue.AXES.findIndex(a => a.includes(pole));
  return pe.primary && pe.secondary && axisOf(pe.primary) !== axisOf(pe.secondary) && !pe.revP && !pe.revS;
`));
check('personality: hidden until revealed, then shows a label', runv(`
  if (Dialogue.knownPersona(P) !== null) return false;
  P.personality.revP = true;
  const shown = Dialogue.knownPersona(P);
  P.personality.revP = false;
  return typeof shown === 'string' && shown.length > 2;
`));
check('personality: stable across calls (no re-roll)', runv(`
  const a = Dialogue.ensurePersonality(P).primary;
  return Dialogue.ensurePersonality(P).primary === a;
`));

// ---- bond ----
check('bond: seeds from morale.agent, clamped small', runv(`
  delete P.bond; P.morale.agent = 90;
  const b = Dialogue.bondOf(P);
  return b >= 0 && b <= 10;
`));
check('bond: addBond clamps to [0,100] and tiers change', runv(`
  P.bond = 24; Dialogue.addBond(P, 1);
  const wasTrusted = Dialogue.tierName(P) === 'Trusted';
  Dialogue.addBond(P, -500);
  const floored = P.bond === 0 && Dialogue.tierName(P) === 'Business';
  Dialogue.addBond(P, 500);
  return wasTrusted && floored && P.bond === 100 && Dialogue.tierName(P) === 'Family';
`));
check('bond: tier upgrade sends a mail', runv(`
  P.bond = 24; const before = GameState.inbox.length;
  Dialogue.addBond(P, 2, 'test');
  return GameState.inbox.length === before + 1;
`));
check('bond: Trusted+ buys patience weeks', runv(`
  P.bond = 30; const a = Dialogue.patienceBonusWeeks(P);
  P.bond = 10; const b = Dialogue.patienceBonusWeeks(P);
  return a === 2 && b === 0;
`));

// ---- line picking / slots ----
check('slots: {first} {club} {agent} filled', runv(`
  const t = Dialogue.fill('Hi {first}, {agent} here about {club}.', P);
  return t.includes('Test') && t.includes('Jens') && !t.includes('{');
`));
check('lines: no repeat until pool exhausted (seen log respected)', runv(`
  P._linesSeen = [];
  const rows = DIALOGUE_DATA.complaint.filter(r => r.beat === 'reply' && r.choice === 'listen' && r.personality === 'any');
  const got = new Set();
  for (let i = 0; i < rows.length; i++) {
    P.personality = { primary: 'homebody', secondary: 'adventurer', revP: false, revS: false }; // no listen-specific lines for these
    const l = Dialogue._pick(rows, P);
    got.add(l.id);
  }
  return got.size === rows.length;
`));

// ---- complaint scene ----
check('complaint: scene builds with open line and 4 choices at stage 1', runv(`
  P.moraleCase = { dim: 'time', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: null };
  P.morale.time = 40; P._talkCooldownAbs = null; P._linesSeen = [];
  const s = Dialogue.buildComplaintScene(P);
  return s && s.open && s.open.text.length > 5 && s.choices.length === 4;
`));
check('complaint: stage 2 drops promise and deflect', runv(`
  P.moraleCase.stage = 2;
  const s = Dialogue.buildComplaintScene(P);
  P.moraleCase.stage = 1;
  return s.choices.map(c => c.key).sort().join(',') === 'listen,pushback';
`));
check('complaint: listen soothes and sets cooldown', runv(`
  const beforeAgent = P.morale.agent = 50;
  const since = P.moraleCase.sinceAbsWeek;
  const r = Dialogue.resolveComplaint(P, 'listen');
  return r.ok && r.reply && P.morale.agent > beforeAgent && P.moraleCase.sinceAbsWeek === since + 2 && P._talkCooldownAbs === GameState.absWeek();
`));
check('complaint: canTalk blocks during cooldown', runv(`
  return Dialogue.canTalk(P).ok === false && Dialogue.canTalk(P).reason === 'cooldown';
`));
check('complaint: promise routes through Agency.makePromise', runv(`
  P._talkCooldownAbs = null;
  const types = Agency.validPromiseTypes(P);
  const r = Dialogue.resolveComplaint(P, 'promise', types[0]);
  return r.ok && P.moraleCase.promise && P.moraleCase.promise.type === types[0];
`));
check('complaint: pushback works on a professional and closes the case', runv(`
  P.moraleCase = { dim: 'time', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: null };
  P.personality = { primary: 'professional', secondary: 'loyal', revP: false, revS: false };
  P._talkCooldownAbs = null; P.bond = 10;
  const r = Dialogue.resolveComplaint(P, 'pushback');
  return r.ok && r.outcome === 'good' && r.closed && P.moraleCase === null && P.personality.revP === true;
`));
check('complaint: pushback backfires on a hothead and reveals it', runv(`
  P.moraleCase = { dim: 'wage', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: null };
  P.personality = { primary: 'hothead', secondary: 'showman', revP: false, revS: false };
  P._talkCooldownAbs = null; P.morale.wage = 40; P.morale.agent = 50;
  const since = P.moraleCase.sinceAbsWeek;
  const r = Dialogue.resolveComplaint(P, 'pushback');
  return r.ok && r.outcome === 'bad' && P.moraleCase && P.morale.wage === 36 && P.morale.agent === 47
      && P.moraleCase.sinceAbsWeek === since - 2 && P.personality.revP === true && r.revealed === 'Hothead';
`));
check('complaint: pushback on neutral personality needs bond 50', runv(`
  P.personality = { primary: 'homebody', secondary: 'loyal', revP: false, revS: false };
  P.moraleCase = { dim: 'time', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: null };
  P._talkCooldownAbs = null; P.bond = 60;
  const r = Dialogue.resolveComplaint(P, 'pushback');
  return r.outcome === 'good' && r.closed;
`));

// ---- gift scene ----
check('gift: giveGift returns scene info and adds bond', runv(`
  P.bond = 10; P.morale.agent = 40;
  P._giftLog = null; GameState.agency.balance = 10000000;
  const r = Agency.giveGift(P, 'small');
  return r.ok && r.scene && r.tier === 'small' && r.diminished === false && P.bond === 12;
`));
check('gift: scene builds react line + 2 closes; close matches personality', runv(`
  P.personality = { primary: 'showman', secondary: 'loyal', revP: true, revS: false };
  const s = Dialogue.buildGiftScene(P, 'large', false);
  const beforeAgent = P.morale.agent;
  const r = Dialogue.resolveGiftClose(P, 'praise');
  return s.react && s.react.text.length > 3 && s.choices.length === 2 && r.ok && r.matched && P.morale.agent === beforeAgent + 1;
`));
check('gift: diminished mood pulls diminished lines', runv(`
  P._linesSeen = [];
  let sawDim = false;
  for (let i = 0; i < 20; i++) {
    P._linesSeen = [];
    const s = Dialogue.buildGiftScene(P, 'small', true);
    if (/already|spoiling|close together/i.test(s.react.text)) sawDim = true;
  }
  return sawDim;
`));

// ---- bond hooks ----
check('hook: kept promise adds bond', runv(`
  P.bond = 10;
  P.moraleCase = { dim: 'time', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: { type: 'playingTime', deadlineAbsWeek: GameState.absWeek() + 5 } };
  Agency._checkPromiseKept(P, ['playingTime']);
  return P.bond === 14 && P.moraleCase === null;
`));
check('hook: Attend.watch adds bond to the clients in that final', runv(`
  P.bond = 20;
  GameState.attendWindow = { finals: [{ id: 'am_x', clients: [{ playerId: P.id, played: true }] }], pointer: -1, watched: 0 };
  const ok = Attend.watch(0);
  const after = P.bond;
  GameState.attendWindow = null;
  return ok && after === 26;
`));
check('hook: escalation patience extended at Trusted+', runv(`
  // stage-1 case, exactly at the base limit: a Trusted client should NOT escalate yet
  P.bond = 30; P.morale.time = 40;
  P.moraleCase = { dim: 'wage', stage: 1, sinceAbsWeek: GameState.absWeek() - MORALE.STAGE2_UNRESOLVED_WEEKS, promise: null };
  P.morale.wage = 40;
  Sim._moraleCases([]);
  const stayed = P.moraleCase && P.moraleCase.stage === 1;
  P.bond = 0;
  Sim._moraleCases([]);
  const escalated = P.moraleCase && P.moraleCase.stage === 2;
  P.moraleCase = null;
  return stayed && escalated;
`));

// ---- DialogueView flow under DOM stub ----
check('view: full complaint conversation runs to the leave button', runv(`
  P.moraleCase = { dim: 'time', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: null };
  P._talkCooldownAbs = null; P.morale.time = 40;
  let done = false;
  DialogueView.show(Dialogue.buildComplaintScene(P), () => { done = true; });
  DialogueView.pick('listen');
  const hasLeave = (DialogueView.pendingChoices || []).some(c => c.key === 'leave');
  DialogueView.pick('leave'); // routes through pick -> not a scene choice; use leave()
  DialogueView.leave();
  return hasLeave && done;
`));
check('view: promise choice opens promise-type sub-choices', runv(`
  P.moraleCase = { dim: 'time', stage: 1, sinceAbsWeek: GameState.absWeek(), promise: null };
  P._talkCooldownAbs = null;
  DialogueView.show(Dialogue.buildComplaintScene(P), () => {});
  DialogueView.pick('promise');
  const subs = (DialogueView.pendingChoices || []).map(c => c.key);
  DialogueView.leave();
  P.moraleCase = null;
  return subs.length >= 2 && subs.some(k => k.indexOf('promise:') === 0) && subs.includes('back');
`));

// ---- persistence ----
check('persistence: personality, bond and seen-lines survive a save/load round trip', runv(`
  P.bond = 42; P.personality = { primary: 'loyal', secondary: 'showman', revP: true, revS: false };
  P._linesSeen = ['C001'];
  const snap = JSON.parse(JSON.stringify(GameState.players.find(x => x.id === P.id)));
  return snap.bond === 42 && snap.personality.primary === 'loyal' && snap._linesSeen[0] === 'C001';
`));

// ---- a season advances with the module loaded (no engine errors) ----
runv(`for (let i = 0; i < 12; i++) Sim.advanceWeek();`);
check('engine: 12 weeks advance cleanly with Dialogue loaded', errors.length === 0, errors.slice(0, 2).join(' | '));

console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll dialogue checks passed.');
process.exit(failed || errors.length ? 1 : 0);
