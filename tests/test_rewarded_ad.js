// The real AdMob provider's rewarded flow (ui/js/ads.js CapAdMobProvider.showRewarded) against a scripted
// fake plugin: the reward must count however its signals arrive. On Android the reward can land AFTER
// the ad is dismissed (that order once made a fully watched test ad look closed early).
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const sb = { console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, setTimeout, clearTimeout, Promise };
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'ui/js/ads.js', 'utf8') + ';globalThis.CapAdMobProvider = CapAdMobProvider; globalThis.AD_CONFIG = AD_CONFIG;', sb, { filename: 'ads.js' });
let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

// a fake plugin: `script` decides what happens once the ad is shown
function fakeAdMob(script) {
    const ls = {};
    const emit = (ev, data) => (ls[ev] || []).forEach(fn => fn(data));
    let resolveShow = null;
    const plugin = {
        prepared: null,
        async addListener(ev, fn) { (ls[ev] = ls[ev] || []).push(fn); return { remove() { ls[ev] = (ls[ev] || []).filter(f => f !== fn); } }; },
        async prepareRewardVideoAd(o) { if (script.loadFails) throw new Error('no fill'); plugin.prepared = o; return {}; },
        showRewardVideoAd() { const p = new Promise(r => { resolveShow = r; }); setTimeout(() => script.run(emit, item => resolveShow(item)), 5); return p; },
    };
    return plugin;
}
const runCase = async script => {
    sb.Capacitor = { Plugins: { AdMob: fakeAdMob(script) } };
    sb.CapAdMobProvider.REWARD_GRACE_MS = 50;
    return sb.CapAdMobProvider.showRewarded();
};
const later = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const R = 'onRewardedVideoAdReward', D = 'onRewardedVideoAdDismissed', F = 'onRewardedVideoAdFailedToShow';
    check('reward, then dismissed: earned', await runCase({ run: (emit, show) => { emit(R, {}); show({}); emit(D); } }) === 'earned');
    check('dismissed FIRST, reward a moment later (the bug): earned', await runCase({ run: async (emit, show) => { emit(D); await later(10); emit(R, {}); show({}); } }) === 'earned');
    check('only the show() promise reports the reward: earned', await runCase({ run: async (emit, show) => { show({ type: 'insight', amount: 1 }); await later(5); emit(D); } }) === 'earned');
    check('closed early (no reward at all): closed', await runCase({ run: emit => emit(D) }) === 'closed');
    check('reward arriving long after the grace period does not count', await runCase({ run: async emit => { emit(D); await later(200); emit(R, {}); } }) === 'closed');
    check('failed to show: unavailable', await runCase({ run: emit => emit(F) }) === 'unavailable');
    check('no ad to load: unavailable', await runCase({ loadFails: true, run: () => {} }) === 'unavailable');
    sb.AD_CONFIG.testing = true;
    await runCase({ run: (emit, show) => { emit(R, {}); show({}); emit(D); } });
    check('a test build always asks for Google\'s test rewarded unit', sb.Capacitor.Plugins.AdMob.prepared.adId === sb.AD_CONFIG.rewardedTest && sb.Capacitor.Plugins.AdMob.prepared.isTesting === true);
    if (failed) process.exit(1);
})();
