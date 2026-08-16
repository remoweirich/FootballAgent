// Ads orchestration (ui/js/ads.js): the frequency cap, the Remove-Ads/Pro suppression, provider
// selection with no native plugin, and the guarantee that an ad failure never breaks the game.
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

(async () => {
    M.DEV_UNLOCK_ALL = false; M._reset();     // so ads are actually enabled
    await Ads.init();
    check('with no plugin, the dev (no-op) provider is selected', Ads._provider && Ads._ready === true);

    // first ad shows and stamps the clock
    check('canShow when ads on + gap elapsed', Ads.canShow() === true);
    check('first interstitial "shows"', (await Ads.maybeShowInterstitial('window-close')) === true);

    // frequency cap: a second one right away is suppressed
    check('cap blocks a second ad within the window', Ads.canShow() === false);
    check('maybeShow returns false while capped', (await Ads.maybeShowInterstitial('window-close')) === false);

    // after the gap elapses it can show again
    clock.t += Ads.MIN_GAP_MS + 1;
    check('cap clears after MIN_GAP_MS', Ads.canShow() === true);
    check('shows again after the gap', (await Ads.maybeShowInterstitial('window-close')) === true);

    // Remove Ads / Pro suppresses everything
    clock.t += Ads.MIN_GAP_MS + 1;
    M.grant(['removeAds']);
    check('owning removeAds disables ads', Ads.canShow() === false && (await Ads.maybeShowInterstitial('window-close')) === false);

    // a throwing provider must never break the game
    M._reset(); clock.t += Ads.MIN_GAP_MS + 1;
    Ads.setProvider({ async init() {}, async showInterstitial() { throw new Error('SDK boom'); } });
    Ads._ready = true;
    let threw = false;
    try { const r = await Ads.maybeShowInterstitial('window-close'); check('a failing ad provider returns false, no throw', r === false); }
    catch (e) { threw = true; }
    check('maybeShowInterstitial never propagates a provider error', threw === false);

    console.log(failed ? '\n*** FAIL ***' : '\nAll ads checks passed.');
    process.exitCode = failed ? 1 : 0;
})();
