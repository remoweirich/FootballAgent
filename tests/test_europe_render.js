// Render smoke test: loads the real ui/js/screen-leagues.js with light UI/Router stubs, drives a
// full season so Europe reaches the knockouts, then renders the Europe tab (all 3 comps) and the
// home top-division table (with European highlighting) — asserting valid HTML and no throw.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
const engine = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'simulation.js'];
function idb() { return { open() { const r = { result: null, onsuccess: null }; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (r.onsuccess) r.onsuccess(); }, 0); return r; } }; }
const errors = [];
const sb = {
    console: { log() { }, warn() { }, error: (...a) => errors.push(a.map(x => x && x.stack ? x.stack : String(x)).join(' ')) },
    setTimeout, clearTimeout, Math, Date, JSON, indexedDB: idb(),
    localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
    document: { addEventListener() { }, getElementById: () => null },
    window: { addEventListener() { } },
    location: { hash: '' },
};
// UI + Router stubs used by screen-leagues.js
sb.UI = {
    crest: c => `<crest ${c && c.name ? c.name[0] : '?'}>`,
    clubName: id => (sb.Clubs && sb.Clubs.getClubById(id) ? sb.Clubs.getClubById(id).name : (typeof id === 'string' && id.startsWith('eu:') ? sb.__euName(id) : id)),
    ordinal: n => n + 'th', ratingText: v => String(v || 0), money: n => String(n),
};
sb.Router = { register() { }, link: (a, b) => `#${a}/${b}`, refresh() { } };
vm.createContext(sb);
for (const f of engine) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
// give the UI stub a way to name virtual clubs
sb.__euName = id => vm.runInContext(`League.teamName(${JSON.stringify(id)})`, sb);
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'i18n-en.js'), 'utf8'), sb, { filename: 'ui-i18n-en.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-leagues.js'), 'utf8'), sb, { filename: 'screen-leagues.js' });
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('England','Renderers FC');`);
// season 1 has no Europe -> the Europe section shows a disclaimer
check('season-1 Europe section shows a disclaimer', runv(`LeaguesScreen.state.country='Europe'; const h=LeaguesScreen.europeSection(); return h.includes('begin next season') && !h.includes('<select');`));
// country dropdown order: home first, Europe second, then the fixed order minus home
check('country list is [home, Europe, ...fixed-minus-home]', runv(`
  const l=LeaguesScreen.countryList();
  return l[0]==='England' && l[1]==='Europe' && JSON.stringify(l.slice(2))===JSON.stringify(['Germany','Spain','Italy','France','Netherlands','Portugal','Switzerland','Belgium']);
`));
// drive TWO seasons: S1 (no Europe) then S2 (Europe runs to completion, snapshotted at the S2 rollover)
runv(`for(let sea=0;sea<2;sea++){ for(let i=0;i<60;i++){ const r=Sim.advanceWeek(); if(r.rolledSeason) break; } }`);
check('completed Europe edition available after two seasons', runv(`return !!(GameState.lastSeasonReport && GameState.lastSeasonReport.europe && GameState.lastSeasonReport.europe.comps.UCL.ko.winner)`));

// the finished (complete) edition drives the stage-specific views
const html = runv(`
  const ed = GameState.lastSeasonReport.europe;
  const c = ed.comps.UCL;
  const tabs = LeaguesScreen.euTabs(c).map(t=>t[0]);
  const def = LeaguesScreen.euDefaultTab(c);
  const lp = LeaguesScreen.euStage(c,'UCL','lp');
  const finalV = LeaguesScreen.euStage(c,'UCL','final');
  const r16 = LeaguesScreen.euStage(c,'UCL','r16');
  const bracket = LeaguesScreen.euBracketTree(c);
  const qual = LeaguesScreen.euStage(c,'UCL','qual');
  const fixturesMd8 = (LeaguesScreen.state.euMd=8, LeaguesScreen.euStage(c,'UCL','fixtures'));
  return JSON.stringify({
    tabs, def,
    lpLeftBars: lp.includes('border-left-color:#16A34A') && lp.includes('border-left-color:#2563EB') && !/<tr[^>]*style="[^"]*background/.test(lp),
    finalOk: finalV.includes('Final') && finalV.includes('neutral venue'),
    r16Ok: r16.includes('Round of 16') && r16.includes('Leg 1') && r16.includes('Leg 2'),
    bracketOk: ['Round of 16','Quarter-finals','Semi-finals','Final'].every(s=>bracket.includes(s)),
    qualOk: qual.includes('Round 1'),
    fixturesOk: fixturesMd8.includes('Matchday 8') && fixturesMd8.includes('<select') && (fixturesMd8.match(/class="fixture"/g)||[]).length===18,
    hasCrest: lp.includes('<crest'), noRawNameText: !lp.includes('<span>eu:')
  });
`);
const H = JSON.parse(html);
check('stage tabs include qual/lp/fixtures/po/r16/qf/sf/final/bracket: ' + JSON.stringify(H.tabs), ['qual','lp','fixtures','po','r16','qf','sf','final','bracket'].every(t => H.tabs.includes(t)));
check('default stage for a completed edition is the Final: ' + H.def, H.def === 'final');
check('League-phase table uses LEFT BARS (no full-row background)', H.lpLeftBars);
check('Fixtures tab shows a matchday dropdown and 18 fixtures for matchday 8', H.fixturesOk);
check('Final stage shows the neutral-venue final', H.finalOk);
check('Round-of-16 stage shows two-legged ties (Leg 1 + Leg 2)', H.r16Ok);
check('Bracket tree renders all four columns', H.bracketOk);
check('Qualification stage renders rounds', H.qualOk);
check('club cells use crests, virtual names resolved (no raw eu: as text)', H.hasCrest && H.noRawNameText);

// europeSection: competition dropdown (UCL/UEL/UECL) + phase content (tab bar lives in render())
const view = runv(`LeaguesScreen.state.country='Europe'; LeaguesScreen.state.euComp='UCL'; return LeaguesScreen.europeSection()`);
check('europeSection renders a competition <select> with all three comps', view.includes('<select') && view.includes('European Champions Cup') && view.includes('European Cup') && view.includes('European Challenge Cup'));
check('euPhaseTabs exposes stage tabs for the tab bar (Qualifiers live in season 3)', runv(`return LeaguesScreen.euPhaseTabs().some(t=>t[1]==='Qualifiers')`));

// a partial (leg-1-only) knockout tie renders a "to come" second leg without throwing
check('partial two-legged tie renders leg 1 + pending leg 2', runv(`
  const t = { a:'ajax', b:'psv', leg1:{h:'psv',a:'ajax',hg:1,ag:2}, leg2:null, winner:null };
  const h = LeaguesScreen.tie(t);
  return h.includes('Leg 1') && h.includes('Leg 2') && h.includes('to come');
`));

// distinct trophy icon appears in the winner banner (finished edition, forced via state)
check('europeTrophyIcon is an SVG used by the UI', runv(`return typeof europeTrophyIcon==='function' && europeTrophyIcon('UCL').startsWith('<svg')`));

// domestic highlighting on England's top flight (Premier League): left-side colour strips
const dom = runv(`
  GameState.week=20; // mid-season, domestic cup undecided
  const t = LeaguesScreen.standingsTable('PREM');
  // rows must carry NO inline background (full-row highlight removed); only <td> left-bars remain
  const rowBg = /<tr[^>]*style="[^"]*background/.test(t);
  return JSON.stringify({
    champBar: t.includes('border-left-color:#14532D'),
    uclBar: t.includes('border-left-color:#16A34A'),
    uelBar: t.includes('border-left-color:#2563EB'),
    noRowBg: !rowBg,
    hasLegend: t.includes('European qualification'),
    reservedNote: t.includes('only drops to the next league position')
  });
`);
const Dm = JSON.parse(dom);
check('PREM champion shown as a dark-green LEFT BAR (#14532D)', Dm.champBar);
check('PREM UCL/UEL shown as left bars, and rows have no full-row background', Dm.uclBar && Dm.uelBar && Dm.noRowBg);
check('PREM shows the European-qualification legend', Dm.hasLegend);
check('with the cup undecided, the reserved-cup-berth note is shown (not pre-assigned)', Dm.reservedNote);
// point 5: with the cup undecided, the cup UEL berth is NOT handed to a league team
check('undecided cup: cupBerthReserved true and no extra UEL assigned by assumption', runv(`
  const order = League.sortedTable('PREM').map(r=>r.clubId);
  const reserved = Europe.cupBerthReserved('England', order, null);
  const hm = Europe.highlightMap('England', order, null);
  // England slots U*5,UEL,UELcup,UECL: with cup reserved, exactly ONE UEL (6th) and UECL on 7th, cup slot empty
  const uelCount = Object.values(hm).filter(t=>t==='UEL'||t==='UELcup').length;
  return reserved===true && uelCount===1 && hm[order[6]]==='UECL';
`));
// once an already-qualified club (champion) wins the cup, the cascade kicks in
check('qualified cup winner triggers the cascade (UEL to 6th & 7th, UECL to 8th)', runv(`
  const order = League.sortedTable('PREM').map(r=>r.clubId);
  const hm = Europe.highlightMap('England', order, order[0]); // champion wins the cup
  const isUel = x => x==='UEL' || x==='UELcup';   // both are Europa League places (same colour)
  return isUel(hm[order[5]]) && isUel(hm[order[6]]) && hm[order[7]]==='UECL';
`));

// a lower England division must NOT get European highlighting
check('Championship (2nd tier) has no European highlight legend', runv(`return !LeaguesScreen.standingsTable('CHAMP').includes('European qualification')`));

// virtual club page renders a guest card instead of "Unknown club"
check('no render errors thrown, got: ' + JSON.stringify(errors.slice(0, 3)), errors.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll Europe render checks passed.');
process.exitCode = failed ? 1 : 0;
