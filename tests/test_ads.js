// Ads orchestration (ui/js/ads.js): the season frequency policy (one interstitial a season, none in
// the player's first), the Remove-Ads/Pro suppression, provider selection with no native plugin, and
// the guarantee that an ad failure never breaks the game.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const store = {};
const clock = { t: 1_000_000_000 };
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, JSON, setTimeout: () => 0,
    Date: { now: () => clock.t },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    window: { matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }) },   // no Capacitor -> dev provider
    document: { documentElement: { setAttribute() {} } },
};
vm.createContext(sb);
for (const f of ['prefs.js', 'monetization.js', 'ads.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
const { Ads, M } = vm.runInContext('({ Ads: Ads, M: Monetization })', sb);

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// Minimal GameState stub: only what the season policy reads. `saves` counts GameState.save() calls,
// so the test can prove the season marker is persisted rather than left in memory.
let saves = 0;
const gs = {
    seasonStartYear: 2025,
    agency: {},
    seasonsCompleted() { return this.seasonStartYear - 2025; },
    save() { saves++; },
};
const installGameState = () => { sb.GameState = gs; };

(async () => {
    M.DEV_UNLOCK_ALL = false; M._reset();     // so ads are actually enabled
    await Ads.init();
    check('with no plugin, the dev (no-op) provider is selected', Ads._provider && Ads._ready === true);

    // ---- with no game at all (web build, tests): nothing is gated on a season ----
    check('no GameState: the season gate is permissive', Ads.seasonEligible() === true && Ads._season() === null);
    check('no GameState: an ad still shows', (await Ads.maybeShowInterstitial('window-close')) === true);
    check('no GameState: stamping is a no-op, not a crash', saves === 0);

    // ---- the season policy ----
    installGameState();
    clock.t += Ads.MIN_GAP_MS + 1;
    gs.seasonStartYear = 2025; gs.agency = {};        // season 1
    check('season 1 is ad-free', gs.seasonsCompleted() === 0 && Ads.seasonEligible() === false);
    check('season 1 shows nothing even with everything else clear', (await Ads.maybeShowInterstitial('window-close')) === false);

    gs.seasonStartYear = 2026;                        // season 2 — the first eligible one
    clock.t += Ads.MIN_GAP_MS + 1;
    check('season 2 is eligible', gs.seasonsCompleted() === 1 && Ads.seasonEligible() === true);
    check('season 2 shows its one ad', (await Ads.maybeShowInterstitial('window-close')) === true);
    check('the season is stamped on the save, and the save is written',
        gs.agency[Ads.KEY_SEASON] === 1 && saves === 1);

    // a second one in the SAME season is refused however much real time passes
    clock.t += 60 * 60 * 1000;
    check('one ad per season: the same season is refused an hour later', Ads.seasonEligible() === false);
    check('one ad per season: maybeShow returns false', (await Ads.maybeShowInterstitial('window-close')) === false);

    // the next season opens it up again — even seconds later, since the policy is not wall-clock
    gs.seasonStartYear = 2027;
    check('the next season is eligible again', Ads.seasonEligible() === true);
    check('the next season shows one', (await Ads.maybeShowInterstitial('window-close')) === true);
    check('the new season is stamped', gs.agency[Ads.KEY_SEASON] === 2);

    // a fresh game (new agency object) starts clean, because the marker lives on the save
    gs.agency = {};
    check('a new game starts clean: same season, fresh agency, eligible again', Ads.seasonEligible() === true);

    // a save that throws must not surface through an ad
    gs.seasonStartYear = 2028; gs.agency = {}; clock.t += Ads.MIN_GAP_MS + 1;
    const goodSave = gs.save;
    gs.save = () => { throw new Error('disk full'); };
    check('a throwing save never propagates out of an ad', (await Ads.maybeShowInterstitial('window-close')) === true);
    gs.save = goodSave;

    // ---- the anti-double-fire guard, which is NOT the frequency policy ----
    gs.seasonStartYear = 2029; gs.agency = {}; clock.t += Ads.MIN_GAP_MS + 1;
    check('back-to-back placements in one flow are still blocked', (await Ads.maybeShowInterstitial('a')) === true
        && Ads.canShow() === false);
    check('MIN_GAP_MS is a short guard, not a frequency cap', Ads.MIN_GAP_MS <= 60 * 1000);

    // Remove Ads / Pro suppresses everything
    gs.seasonStartYear = 2030; gs.agency = {};
    clock.t += Ads.MIN_GAP_MS + 1;
    M.grant(['removeAds']);
    check('owning removeAds disables ads', Ads.canShow() === false && (await Ads.maybeShowInterstitial('window-close')) === false);

    // a throwing provider must never break the game
    M._reset(); gs.agency = {}; clock.t += Ads.MIN_GAP_MS + 1;
    Ads.setProvider({ async init() {}, async showInterstitial() { throw new Error('SDK boom'); } });
    Ads._ready = true;
    let threw = false;
    try { const r = await Ads.maybeShowInterstitial('window-close'); check('a failing ad provider returns false, no throw', r === false); }
    catch (e) { threw = true; }
    check('maybeShowInterstitial never propagates a provider error', threw === false);

    // ---- the TRIGGER: which window close arms an ad at all ----
    // A second sandbox, with the real engine, because the policy above is only half the rule: the
    // other half is that Home only arms an ad when the WINTER window shuts. Driven one week at a
    // time from just before each boundary rather than simulating 34 weeks.
    const esb = {
        console: { log() {}, warn() {}, error() {} },
        Math, Date, JSON, setTimeout, clearTimeout,
        indexedDB: { open() { return { result: null, onsuccess: null }; } },
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        document: { addEventListener() {}, getElementById: () => null, querySelector: () => null, createElement: () => ({ style: {} }), head: { appendChild() {} } },
        window: { addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false }) },
        location: { hash: '' },
    };
    esb.UI = { money: n => String(n), euro: n => '€' + n, esc: s => String(s), clubName: id => String(id) };
    vm.createContext(esb);
    for (const f of ['i18n.js', 'i18n-en.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js',
        'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
        'agency.js', 'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js'])
        vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), esb, { filename: f });
    vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'i18n-en.js'), 'utf8'), esb, { filename: 'ui-i18n-en.js' });
    const erun = c => vm.runInContext('(function(){' + c + '})()', esb);
    erun('Clubs.init(); GameState.startNewGame("Switzerland","Nordvind Sports","Alex Mercer");');

    // Walk a whole season a week at a time — the league is a state machine (cup brackets are built
    // round by round), so the week counter cannot be teleported to a boundary.
    const closes = JSON.parse(erun(`
      const out = [];
      for (let i = 0; i < 40; i++) {
        const w = Sim.advanceWeek().windowClosed;
        if (w) out.push([GameState.week, w]);
      }
      return JSON.stringify(out);
    `));
    check('a season has exactly two window closes, got ' + JSON.stringify(closes), closes.length === 2);
    check('the summer window shuts entering week 7', closes[0] && closes[0][0] === 7 && closes[0][1] === 'summer');
    check('the winter window shuts entering week 34', closes[1] && closes[1][0] === 34 && closes[1][1] === 'winter');

    // the comparison screen-home.js makes: only the winter close arms an ad, so one a season
    const arms = v => v === 'winter';
    check('Home arms an ad on the winter close and on nothing else',
        arms('winter') === true && arms('summer') === false && arms(null) === false);
    check("exactly one of a season's closes arms an ad", closes.filter(c => arms(c[1])).length === 1);

    console.log(failed ? '\n*** FAIL ***' : '\nAll ads checks passed.');
    process.exitCode = failed ? 1 : 0;
})();
