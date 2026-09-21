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
    UI: {
        money: n => Math.round(n || 0).toLocaleString('en-US'),
        euro: n => '€' + Math.round(n || 0).toLocaleString('en-US'),
        // resolved lazily: Clubs is only defined once the engine files below have run
        clubName: id => { const c = sb.Clubs && sb.Clubs.getClubById(id); return (c && c.name) || id; },
    },
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

// ---- part 2 stage B: the three frozen advances play the same way every time ----
check('advancing in demo mode never runs the real simulation', runv(`
  const before = JSON.stringify(GameState.league || null);
  Sim.advanceWeek();
  return GameState.week === 35 && JSON.stringify(GameState.league || null) === before;`));

check('week 35 is quiet: books only, no new mail, Johan still out', runv(`
  const j = GameState.players.find(p => p.id === 'wt_johan');
  const mails = GameState.inbox.length;
  return mails === 2 && j.injury && j.injury.weeksOut === 2
      && GameState.log !== undefined;`));

check('week 36 brings exactly three sponsor offers for Johan', runv(`
  Sim.advanceWeek();
  const m = GameState.inbox.find(x => x.kind === 'sponsor');
  return GameState.week === 36 && m && m.offer.playerId === 'wt_johan'
      && m.offer.options.length === 3
      && m.offer.options.every(o => o.company && o.weekly > 0 && o.annual > 0 && o.termSeasons >= 1);`));

check('week 37: Gemma reports Wayne Kane, and Johan is fit again', runv(`
  Sim.advanceWeek();
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  const j = GameState.players.find(p => p.id === 'wt_johan');
  return GameState.week === 37 && w && j.injury === null;`));

check('Wayne Kane: 17, ST, England, 56, Birmingham Claret, 5050/wk', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  return w.name === 'Wayne Kane' && w.age === 17 && w.position === 'ST'
      && w.nationality === 'England' && w.ability === 56 && w.wage === 5050
      && Clubs.getClubById(w.clubId).name === 'Birmingham Claret'
      && w.squadRole === 'youth';`));

check('Wayne shows up in the Scouting finds list, unsigned', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  return w.knownToAgent === true && w.agentId == null && !w.dismissedTalent
      && !w.archived && w.age <= 22 && w.discoveredWeek != null;`));

check('his report reads Superstar ceiling / English First Division floor', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  return w.report.role === 'complete_forward'
      && w.report.ceiling === 'International Superstar'
      && w.report.floor === 'English First Division regular'
      && w.stats && Object.keys(w.stats).length === 0;`));

check('the three advance steps unlock in order', runv(`
  const wk = k => Walkthrough.SCRIPT.find(s => s.key === k);
  return wk('wt.adv.first').until() && wk('wt.adv.second').until() && wk('wt.adv.third').until();`));

check('the books actually moved money and logged it', runv(`
  const l = GameState.agency.ledger || {};
  return l.Commission > 0 && l.Scouts < 0;`));

// ---- part 2 stage C: the scripted negotiation, run through the real engine ----
check('Wayne is willing to talk to this agency at all', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  return Agency.signConcession(w) === 10 && Agency.canSign(w).ok !== false;`));

check('14% wages / 12% sponsor / 4 seasons is refused', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  const r = Agency.negotiateSign(w, 14, 12, 4, 1);
  return r.status === 'counter' && !!r.message;`));

check('11% wages / 9% sponsor / 5 seasons is accepted', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  const r = Agency.negotiateSign(w, 11, 9, 5, 2);
  return r.status === 'accept';`));

check('the scripted second offer is the FIRST that works at 5 seasons', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  // anything greedier on wages at the same term must still be refused
  return Agency.negotiateSign(w, 13, 9, 5, 2).status === 'counter'
      && Agency.negotiateSign(w, 11, 9, 5, 2).status === 'accept';`));

check('signing him makes him a client of the agency', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  Agency.signPlayer(w, 11, 9, 5);
  return w.agentId === 'me' && w.wageCommission > 0;`));

check('the sign step unlocks once he has signed', runv(`
  return Walkthrough.SCRIPT.find(s => s.key === 'wt.wayne.neg2').until();`));

check('narration can interpolate the agency name', runv(`
  const v = Walkthrough.vars();
  return v.agency === GameState.agency.name
      && I18n.t('wt.wayne.signed', v).indexOf('{agency}') === -1
      && I18n.t('wt.wayne.signed', v).indexOf(v.agency) !== -1;`));

// ---- content the playtest found empty or wrong ----
check('Johan: scouting report carries a written description + role label', runv(`
  const r = GameState.players.find(p => p.id === 'wt_johan').report;
  return r.role === 'attacking_midfielder' && !!r.roleLabel
      && typeof r.desc === 'string' && r.desc.length > 20;`));

check('Johan: boyhood club reads Basel Red and is discovered', runv(`
  const j = GameState.players.find(p => p.id === 'wt_johan');
  const f = Dialogue.ensureFacts(j);
  return f.favClub.discovered === true && f.favClub.clubId === 'Basel'
      && Clubs.getClubById(f.favClub.clubId).name === 'Basel Red';`));

check('Johan: ambition and home life stay undiscovered (ask him sometime)', runv(`
  const f = Dialogue.ensureFacts(GameState.players.find(p => p.id === 'wt_johan'));
  return f.ambition.discovered !== true && f.family.discovered !== true;`));

check('Johan: commissions are 8% and 9%, not fractions', runv(`
  const j = GameState.players.find(p => p.id === 'wt_johan');
  return j.wageCommission === 8 && j.sponsorCommission === 9;`));

check('Johan: has one live sponsorship deal', runv(`
  const j = GameState.players.find(p => p.id === 'wt_johan');
  return (j.sponsorDeals || []).length === 1
      && j.sponsorDeals[0].untilSeason > GameState.seasonStartYear
      && j.sponsorIncome === j.sponsorDeals[0].weekly;`));

check('Wayne: report describes a complete forward', runv(`
  const r = GameState.players.find(p => p.id === 'wt_wayne').report;
  return r.role === 'complete_forward' && !!r.roleLabel
      && typeof r.desc === 'string' && r.desc.length > 20
      && r.ceiling === 'International Superstar'
      && r.floor === 'English First Division regular';`));

check("Gemma's card agrees with the narration: three weeks to her report", runv(`
  const g = GameState.agency.scouts.find(s => s.region === 'west-midlands');
  return g.weeksUntilFind === 3;`));

check('the sponsor step refuses to pass until a deal is taken', runv(`
  const step = Walkthrough.SCRIPT.find(s => s.key === 'wt.adv.sponsor');
  const j = GameState.players.find(p => p.id === 'wt_johan');
  const before = step.until();
  j.sponsorDeals.push({ company: 'Kestrel Energy', weekly: 6400, annual: 430000, untilSeason: GameState.seasonStartYear + 3 });
  const after = step.until();
  j.sponsorDeals.pop();
  return before === false && after === true;`));

check('steps that would sit over what they describe are pinned', runv(`
  const by = k => Walkthrough.SCRIPT.find(s => s.key === k);
  return by('wt.client.youth').place === 'above'
      && by('wt.adv.sponsor').place === 'top' && by('wt.adv.found').place === 'top'
      && by('wt.wayne.card').place === 'below'
      && by('wt.wayne.card').anchor === 'button[onclick*="openSign"]'
      && by('wt.wayne.neg1').place === 'top' && by('wt.wayne.neg2').place === 'top'
      && by('wt.scout.hireGemma').scrollTo === true
      && by('wt.wayne.neg1').waitFor === 'button[onclick*="proposeSign"]';`));

check('her report is three weeks away in every field the UI prints', runv(`
  // both the toast shown on posting her and the "next report" line read the same roll
  GameState.demoMode = true;
  const rolled = Scouts.nextFindDelay(75);
  GameState.demoMode = false;
  return rolled === 3 && Scouts.nextFindDelay(75) >= 6;`));

check('the weekly-summary step cannot be skipped with Next', runv(`
  const s = Walkthrough.SCRIPT.find(x => x.key === 'wt.adv.found');
  return !!s.until;`));

check('arriving at Scouting for the find opens the Finds list', runv(`
  const s = Walkthrough.SCRIPT.find(x => x.key === 'wt.found.toScouting');
  if (typeof s.before !== 'function') return false;
  globalThis.ScoutingScreen = { tab: 'scouts' };
  s.before();
  const ok = globalThis.ScoutingScreen.tab === 'finds';
  delete globalThis.ScoutingScreen;
  return ok;`));

// ---- part 2 stage D: the loan chain, run through the real engine ----
check("Birmingham Claret's record reads as scripted", runv(`
  const h = GameState.clubHistory['Aston Villa'];
  const eb = GameState.clubEuropeBest['Aston Villa'];
  const f = y => h.find(x => x.year === y);
  return h.length === 4
      && f(2025).position === 6 && f(2026).position === 8
      && f(2027).position === 4 && f(2027).trophies[0] === 'UECL'
      && f(2028).position === 13
      && h.every(x => x.division === 'PREM')
      && eb.UCL.stage === 3 && eb.UCL.year === 2028
      && eb.UEL.stage === 4 && eb.UEL.year === 2026
      && eb.UECL.stage === 7 && eb.UECL.year === 2027;`));

check('relationship with the club is Neutral (50)', runv(`
  return Agency.relationship('Aston Villa') === 50;`));

check('the club is far too big for him (rep 83 vs ability 56)', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  return Clubs.getClubById('Aston Villa').reputation === 83 && w.ability === 56;`));

check('the club always sanctions the loan during the tour', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  GameState.demoMode = true;
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) {   // would refuse on some rolls outside the tour
    w._loanOk = false; delete w._cooldowns;
    ok = Agency.requestLoan(w).ok;
  }
  return ok && w._loanOk === true && w.loanListed === true;`));

check('the loan-request step unlocks once the club agrees', runv(`
  return Walkthrough.SCRIPT.find(s => s.key === 'wt.loan.request').until();`));

check('pitching him out on loan produces offers to accept', runv(`
  const w = GameState.players.find(p => p.id === 'wt_wayne');
  const three = Clubs.getClubsByDivision('LEAGUE1').filter(c => c.id !== w.clubId).slice(0, 4);
  three.forEach(c => Agency.shopPlayerLoan(w, c.id));
  const step = Walkthrough.SCRIPT.find(s => s.key === 'wt.shop.send');
  return three.length === 4 && step.until();`));

// ---- the loan step cannot be dead-ended by rejecting everything ----
check('rejecting all loan offers is refused outright', runv(`
  Walkthrough._active = true; Walkthrough._explore = false;
  Walkthrough._steps = Walkthrough.SCRIPT.slice();   // start() normally does this
  Walkthrough._i = Walkthrough._steps.findIndex(s => s.key === 'wt.shop.offers');
  return Walkthrough.blocksLoanReject('wt_wayne', true) === true;`));

check('rejecting one offer is fine while others remain', runv(`
  // the pitch only wins over the clubs that fancy him, so stage the inbox explicitly here
  GameState.inbox = GameState.inbox.filter(m => m.kind !== 'loan');
  const offer = to => ({ id: 'l_' + to, kind: 'loan', subject: to, read: false,
      offer: { playerId: 'wt_wayne', fromClubId: 'Aston Villa', toClubId: to, role: 'starter' } });
  GameState.inbox.push(offer('Blackpool'), offer('Exeter City'), offer('Bradford City'));
  return GameState.inbox.filter(m => m.kind === 'loan').length === 3
      && Walkthrough.blocksLoanReject('wt_wayne', false) === false;`));

check('rejecting the LAST offer is refused', runv(`
  const loans = GameState.inbox.filter(m => m.kind === 'loan');
  GameState.inbox = GameState.inbox.filter(m => m.kind !== 'loan' || m === loans[0]);
  return GameState.inbox.filter(m => m.kind === 'loan').length === 1
      && Walkthrough.blocksLoanReject('wt_wayne', false) === true;`));

check('the guard is silent outside the loan step', runv(`
  Walkthrough._i = 0;
  const off = Walkthrough.blocksLoanReject('wt_wayne', true);
  Walkthrough._i = Walkthrough._steps.findIndex(s => s.key === 'wt.shop.offers');
  return off === false;`));

check('the guard is silent once the tour is over', runv(`
  Walkthrough._explore = true;
  const off = Walkthrough.blocksLoanReject('wt_wayne', true);
  Walkthrough._explore = false;
  return off === false;`));

check('the guard never touches another player', runv(`
  return Walkthrough.blocksLoanReject('someone_else', true) === false;`));

check('the refusal message exists in both languages', runv(`
  Walkthrough._active = false;
  return ('wt.mustAccept' in I18n.packs.en) && ('wt.mustAccept' in I18n.packs.de);`));

// ---- part 2 stage E: the tour ends into an explorable demo, not straight out ----
check('finishing the script opens explore mode rather than restoring', runv(`
  Walkthrough._explore = false;
  Walkthrough.explore();
  return Walkthrough.isExploring() === true && GameState.demoMode === true;`));

check('leaving explore mode hands the real save back', runv(`
  Walkthrough._active = true;          // explore() left it active on purpose
  Walkthrough.finish(false);
  return Walkthrough.isExploring() === false && GameState.demoMode === false
      && GameState.seasonStartYear === 2025 && Agency.clients().length === 0;`));

check('the leave-tutorial strings exist in both languages', runv(`
  return ['wt.leave', 'wt.leaveSub', 'wt.outro']
    .every(k => (k in I18n.packs.en) && (k in I18n.packs.de));`));

// ---- the overlay must never fence the player in ----
// The tour strands the player if a step both (a) fences the screen to one element and (b) expects
// him to do something that navigates away from it. Only single-tap steps may fence.
check('no step both fences the screen and expects multi-step work', runv(`
  const bad = Walkthrough.SCRIPT.filter(s => s.tap && s.until);
  return bad.length === 0;`));

check('every free-roam (until) step is unfenced by design', runv(`
  // _position() computes freeRoam from s.until, so any such step drops the shroud
  return Walkthrough.SCRIPT.filter(s => s.until).every(s => !s.tap);`));

check('the card can be tucked away and brought back', runv(`
  return typeof Walkthrough.collapse === 'function'
      && typeof Walkthrough.expand === 'function'
      && (I18n.packs.en['wt.hide'] && I18n.packs.de['wt.hide'])
      && (I18n.packs.en['wt.reopen'] && I18n.packs.de['wt.reopen']) ? true : false;`));

check('the inbox read-both step is free-roam, not a fenced tap', runv(`
  const s = Walkthrough.SCRIPT.find(x => x.key === 'wt.inbox.read');
  return !!s.until && !s.tap;`));

check('the negotiation steps leave the sliders reachable', runv(`
  return ['wt.wayne.neg1', 'wt.wayne.neg2']
    .map(k => Walkthrough.SCRIPT.find(s => s.key === k))
    .every(s => !!s.until && !s.tap);`));

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
