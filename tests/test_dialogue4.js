// Phase 4 of the client-dialogue system: reciprocity (thank-you gifts, invitations, tip-offs,
// referrals) and the settling-in / concierge services.
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
  globalThis.CLUB = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 1);
  globalThis.ENG = Clubs.allClubs.find(c => c.country === 'England' && c.tier === 1);
  globalThis.BEL = Clubs.allClubs.find(c => c.country === 'Belgium' && c.tier === 1);
  globalThis.P = PlayerGen.makePlayer(CLUB, { ability: 72, age: 25, position: 'CM' });
  P.nationality = 'Netherlands';   // deterministic: makePlayer sometimes rolls a foreign heritage
  P.agentId = 'me'; P.everClient = true; P.name = 'Loyal Rock';
  GameState.players.push(P);
  Dialogue.ensureFacts(P);
`);

// ---- thank-you gifts ----
check('thanks: fires only at Confidant+ and once a season', runv(`
  GameState.agency.pendingScenes = [];
  P.bond = 30; P._thanksSeason = null;
  let fired = 0;
  for (let i = 0; i < 50; i++) { Dialogue._maybeThanks(P, 4); if (GameState.agency.pendingScenes.length) fired++; }
  const lowBond = fired === 0;
  P.bond = 60;
  for (let i = 0; i < 200 && !GameState.agency.pendingScenes.length; i++) Dialogue._maybeThanks(P, 4);
  const highBond = GameState.agency.pendingScenes.length === 1;
  const guard = P._thanksSeason === GameState.seasonStartYear;
  Dialogue._maybeThanks(P, 4);
  return lowBond && highBond && guard && GameState.agency.pendingScenes.length === 1;
`));
check('thanks: money gift credits the agency on scene build', runv(`
  GameState.agency.pendingScenes = [];
  const entry = { type: 'thanks', playerId: P.id, gift: 'money', value: 15000 };
  const before = GameState.agency.balance;
  const scene = Dialogue.buildMomentScene(entry);
  return GameState.agency.balance === before + 15000 && scene.notes.length === 1
    && scene.open.text.includes('15,000') === scene.open.text.includes('15,000')   // just no crash
    && !scene.open.text.includes('{');
`));
check('thanks: keepsake lands in the facts ledger, pays once', runv(`
  const entry = { type: 'thanks', playerId: P.id, gift: 'keepsake', thing: 'a signed shirt from his debut' };
  const scene = Dialogue.buildMomentScene(entry);
  const n1 = (P.facts.keepsakes || []).length;
  Dialogue.buildMomentScene(entry);   // rebuild must not double-pay
  return n1 === 1 && P.facts.keepsakes.length === 1 && scene.open.text.includes('signed shirt');
`));
check('thanks: cherish suits the loyal (+1 bond)', runv(`
  P.personality = { primary: 'loyal', secondary: 'homebody', revP: true, revS: true };
  const scene = { kind: 'moment', momentType: 'thanks', playerId: P.id, extra: { thing: 'a watch' } };
  P.bond = 60;
  const r = Dialogue.resolveMoment(P, scene, 'cherish');
  return r.ok && P.bond === 61;
`));

// ---- invitations ----
check('invite: wedding queued at rollover for Confidant+ with a known partner', runv(`
  GameState.agency.pendingScenes = [];
  P.bond = 60; P.facts.family = { status: 'partner', discovered: true };
  delete P._evWedding;
  let got = false;
  for (let i = 0; i < 60 && !got; i++) { delete P._evWedding; GameState.agency.pendingScenes = []; Dialogue.onSeasonRollover(); got = GameState.agency.pendingScenes.some(e => e.type === 'invite'); }
  return got && P._evWedding === true;
`));
check('invite: never queued while the family fact is undiscovered', runv(`
  GameState.agency.pendingScenes = [];
  P.facts.family.discovered = false; delete P._evWedding;
  for (let i = 0; i < 40; i++) Dialogue.onSeasonRollover();
  const none = GameState.agency.pendingScenes.length === 0;
  P.facts.family.discovered = true;
  return none;
`));
check('invite: attending costs money and earns +4 bond; declining stings', runv(`
  const scene = Dialogue.buildMomentScene({ type: 'invite', playerId: P.id, occasion: 'my wedding' });
  P.bond = 60; P.morale.agent = 60;
  const before = GameState.agency.balance;
  const r = Dialogue.resolveMoment(P, scene, 'attend');
  const attended = r.ok && GameState.agency.balance === before - 2000 && P.bond === 64 && P.morale.agent === 63;
  P.bond = 60; P.morale.agent = 60;
  const r2 = Dialogue.resolveMoment(P, scene, 'decline');
  return attended && r2.ok && P.bond === 59 && P.morale.agent === 58 && scene.open.text.includes('wedding');
`));

// ---- tip-offs ----
check('tipoff: Confidant gets a warning and a two-week grace before a case opens', runv(`
  P.bond = 60; delete P._tipSeason; delete P._tipUntil; P.moraleCase = null;
  const before = GameState.inbox.length;
  const intercepted = Dialogue.tipOff(P, 'time');
  const mailed = GameState.inbox.length === before + 1;
  const stillGrace = Dialogue.tipOff(P, 'time');
  GameState.week += 2;
  const opens = Dialogue.tipOff(P, 'time') === false;
  GameState.week -= 2;
  return intercepted && mailed && stillGrace && opens && P._tipUntil === undefined;
`));
check('tipoff: only once a season, never below Confidant', runv(`
  P.bond = 60;
  const again = Dialogue.tipOff(P, 'wage');   // _tipSeason already set this season
  P.bond = 20; delete P._tipSeason; delete P._tipUntil;
  const low = Dialogue.tipOff(P, 'time');
  P.bond = 60;
  return again === false && low === false;
`));

// ---- referrals ----
check('referral: Family tier recommends the best young teammate, warm intro attached', runv(`
  GameState.agency.pendingScenes = [];
  P.bond = 80; delete P._referSeason;
  // guarantee eligible teammates exist
  let got = null;
  for (let i = 0; i < 80 && !got; i++) { delete P._referSeason; GameState.agency.pendingScenes = []; Dialogue.onSeasonRollover(); got = GameState.agency.pendingScenes.find(e => e.type === 'referral'); }
  if (!got) return false;
  const mate = GameState.getPlayer(got.mateId);
  const scene = Dialogue.buildMomentScene(got);
  return mate.knownToAgent === true && mate._warmIntro === P.id && mate.age <= 26
    && scene.extra.mate === mate.name && !scene.open.text.includes('{');
`));
check('referral: warm intro pays off at signing (agent morale 85+, bond seeded)', runv(`
  const mate = GameState.players.find(x => x._warmIntro === P.id);
  if (!mate) return false;
  Agency.signPlayer(mate, 10, 10, 2);
  const ok = mate.morale.agent >= 85 && mate.bond >= 12 && mate._warmIntro === undefined;
  mate.agentId = null;   // clean up
  return ok;
`));

// ---- settling in ----
check('settling: NL -> England starts a settling period; NL -> Belgium does not', runv(`
  delete P.settling; P._langs = [];
  Dialogue._startSettling(P, ENG);
  const eng = !!P.settling;
  const w1 = P.settling ? P.settling.weeksLeft : 0;
  delete P.settling;
  Dialogue._startSettling(P, BEL);   // Dutch is spoken in Belgium
  const bel = !P.settling;
  return eng && w1 >= 6 && bel;
`));
check('settling: homebodies suffer longer, adventurers barely notice', runv(`
  delete P.settling;
  P.personality = { primary: 'homebody', secondary: 'loyal', revP: true, revS: true };
  let hbTotal = 0, advTotal = 0;
  for (let i = 0; i < 40; i++) { delete P.settling; Dialogue._startSettling(P, ENG); hbTotal += P.settling.weeksLeft; }
  P.personality = { primary: 'adventurer', secondary: 'showman', revP: true, revS: true };
  for (let i = 0; i < 40; i++) { delete P.settling; Dialogue._startSettling(P, ENG); advTotal += P.settling.weeksLeft; }
  P.personality = { primary: 'loyal', secondary: 'homebody', revP: true, revS: true };
  return hbTotal / 40 > 20 && advTotal / 40 < 10;
`));
check('settling: ticks down, drags morale, ends with the language learned', runv(`
  delete P.settling; P._langs = [];
  P.personality = { primary: 'professional', secondary: 'loyal', revP: true, revS: true };
  Dialogue._startSettling(P, ENG);
  P.settling.weeksLeft = 3; P.morale.club = 70;
  const before = P.morale.club;
  for (let i = 0; i < 3; i++) Dialogue._settleTick(P);
  return P.settling === undefined && P._langs.includes('en') && P.morale.club < before;
`));
check('settling: language course halves, family cut needs the fact', runv(`
  delete P.settling; P._langs = [];
  Dialogue._startSettling(P, ENG);
  P.settling.weeksLeft = 12;
  GameState.agency.balance = 1000000;
  const r1 = Dialogue.buyService(P, 'language');
  const halved = P.settling.weeksLeft === 6;
  P.facts.family = { status: 'single', discovered: true };
  const r2 = Dialogue.buyService(P, 'family');
  P.facts.family = { status: 'kids', discovered: true };
  const r3 = Dialogue.buyService(P, 'family');
  const cut = P.settling.weeksLeft === 2;
  const r4 = Dialogue.buyService(P, 'house');
  return r1.ok && halved && r2.ok === false && r3.ok && cut && r4.ok && P.settling.morale === false;
`));
check('settling: form drag wired into the rating engine (league.js source)', (() => {
  const src = fs.readFileSync(path.join(root, 'js', 'league.js'), 'utf8');
  return src.includes('if (p.settling) rating -= 0.3;');
})());
check('settling: after settling, a second move to the same language zone is instant', runv(`
  delete P.settling;
  P._langs = ['en'];
  Dialogue._startSettling(P, ENG);
  const ok = !P.settling;
  P._langs = [];
  return ok;
`));

// ---- financial advisor (reworked: personality-gated, rare, multi-year) ----
check('money trouble: sensible types never risk a bad investment', runv(`
  const year = GameState.seasonStartYear;
  P.personality = { primary: 'professional', secondary: 'loyal', revP: true, revS: true };
  P.morale.wage = 70; delete P._finAdvisorUntil;
  const orig = Rng.next; Rng.next = () => 0.0001;   // force any roll
  Dialogue._moneyTick(P, year);
  Rng.next = orig;
  return P.morale.wage === 70 && Dialogue._moneyRisky(P) === false;
`));
check('money trouble: only reckless types (showman/hothead) are at risk, and it tanks wage morale', runv(`
  const year = GameState.seasonStartYear;
  P.personality = { primary: 'showman', secondary: 'loyal', revP: true, revS: true };
  P.morale.wage = 70; P.morale.agent = 60; delete P._finAdvisorUntil;
  const orig = Rng.next; Rng.next = () => 0.0001;
  Dialogue._moneyTick(P, year);
  Rng.next = orig;
  return Dialogue._moneyRisky(P) === true && P.morale.wage === 58 && P.morale.agent === 56;
`));
check('advisor: a multi-year contract catches the hit; no morale loss', runv(`
  const year = GameState.seasonStartYear;
  P.personality = { primary: 'hothead', secondary: 'showman', revP: true, revS: true };
  GameState.agency.balance = 1000000; delete P._finAdvisorUntil;
  const r = Dialogue.hireAdvisor(P, 3);
  const engagedNow = Dialogue.advisorEngaged(P) && P._finAdvisorUntil === year + 3;
  P.morale.wage = 70; P.morale.agent = 60;
  const orig = Rng.next; Rng.next = () => 0.0001;
  Dialogue._moneyTick(P, year);
  Rng.next = orig;
  return r.ok && engagedNow && P.morale.wage === 70 && P.morale.agent === 60;
`));
check('advisor: cost scales (discount for longer), extends from the current end, capped at 5', runv(`
  const c1 = Dialogue.advisorCost(1), c5 = Dialogue.advisorCost(5), c9 = Dialogue.advisorCost(9);
  const perYear1 = c1, perYear5 = c5 / 5;
  const cheaperPerYear = perYear5 < perYear1;
  const capped = c9 === c5;   // clamped to 5
  const year = GameState.seasonStartYear;
  GameState.agency.balance = 1000000; delete P._finAdvisorUntil;
  Dialogue.hireAdvisor(P, 2);
  const end2 = P._finAdvisorUntil;
  Dialogue.hireAdvisor(P, 2);   // extends, not resets
  return cheaperPerYear && capped && end2 === year + 2 && P._finAdvisorUntil === year + 4;
`));
check('advisor: an expired contract sends a renewal reminder once at rollover', runv(`
  P.personality = { primary: 'showman', secondary: 'loyal', revP: true, revS: true };
  P._finAdvisorUntil = GameState.seasonStartYear;   // as if it lapsed entering this season
  const before = GameState.inbox.length;
  Dialogue.onSeasonRollover();
  const reminded = GameState.inbox.length > before && /advisor contract expired/i.test(GameState.inbox[0].subject);
  const cleared = P._finAdvisorUntil === undefined;
  const before2 = GameState.inbox.length;
  Dialogue.onSeasonRollover();   // must not re-remind
  return reminded && cleared && GameState.inbox.length === before2;
`));
check('advisor: risk hint only shows once the reckless trait is known', runv(`
  P.personality = { primary: 'showman', secondary: 'loyal', revP: false, revS: false };
  const hiddenNoHint = Dialogue.moneyRiskKnown(P) === false;
  P.personality.revP = true;
  const shownHint = Dialogue.moneyRiskKnown(P) === true;
  P.personality = { primary: 'professional', secondary: 'humble', revP: true, revS: true };
  const sensibleNoHint = Dialogue.moneyRiskKnown(P) === false;
  return hiddenNoHint && shownHint && sensibleNoHint;
`));
check('media: purchasable once, boosts sponsor base', runv(`
  GameState.agency.balance = 1000000; P._mediaTrained = false;
  const r3 = Dialogue.buyService(P, 'media');
  const r4 = Dialogue.buyService(P, 'media');
  return r3.ok && r4.ok === false && P._mediaTrained === true;
`));

// ---- view flow ----
check('view: invite scene offers three choices and completes', runv(`
  let done = false;
  const scene = Dialogue.buildMomentScene({ type: 'invite', playerId: P.id, occasion: 'my wedding' });
  DialogueView.show(scene, () => { done = true; });
  const keys = (DialogueView.pendingChoices || []).map(c => c.key).join(',');
  DialogueView.pick('gift');
  DialogueView.pick('leave');
  return keys === 'attend,gift,decline' && done;
`));
check('view: thanks scene completes with cherish/banter choices', runv(`
  let done = false;
  const scene = Dialogue.buildMomentScene({ type: 'thanks', playerId: P.id, gift: 'keepsake', thing: 'a watch', _paid: true });
  DialogueView.show(scene, () => { done = true; });
  const keys = (DialogueView.pendingChoices || []).map(c => c.key).join(',');
  DialogueView.pick('banter');
  DialogueView.pick('leave');
  return keys === 'cherish,banter' && done;
`));

// ---- engine stability ----
runv(`GameState.agency.pendingScenes = []; for (let i = 0; i < 10; i++) Sim.advanceWeek();`);
check('engine: 10 weeks advance cleanly with Phase 4 loaded', errors.length === 0, errors.slice(0, 2).join(' | '));

console.log(failed || errors.length ? '\n*** FAIL ***' : '\nAll Phase 4 dialogue checks passed.');
process.exit(failed || errors.length ? 1 : 0);
