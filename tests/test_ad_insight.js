// "See potential": a rewarded ad reveals ONE player's Enhanced Insights (ui/js/screen-client-detail.js,
// ui/js/ads.js). The button hides once the player is revealed, and everywhere once Insights is owned.
// Real engine + real screens, with a scripted ad provider.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const build = fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8');
const ENGINE = [...build.match(/ENGINE_FILES\s*=\s*\[([\s\S]*?)\]/)[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
const errors = [];
const mkEl = () => ({ innerHTML: '', style: {}, querySelectorAll: () => [], addEventListener() {} });
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.map(String).join(' ')) }, setTimeout: () => 0, clearTimeout() {}, Math, Date, JSON,
    indexedDB: undefined, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {}, getElementById: () => null, createElement: mkEl, querySelector: () => null, documentElement: { style: {}, setAttribute() {} } },
    addEventListener() {}, matchMedia: () => ({ matches: false }), location: { hash: '' },
};
sb.window = sb;
sb.Router = { register() {}, link: (a, b) => `#${a}/${b}`, refresh() {}, go(h) { sb.location.hash = h; }, sheet() {}, result() {}, closeSheet() {}, isFreshNav: false };
vm.createContext(sb);
for (const f of ENGINE) { const p = root + 'js/' + f; if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
for (const f of ['i18n-en.js', 'shim.js', 'prefs.js', 'monetization.js', 'ads.js', 'screen-leagues.js', 'screen-home.js', 'screen-intl.js', 'screen-intl-americas.js', 'screen-intl-caf.js', 'screen-intl-asia.js', 'screen-nation.js', 'screen-clients.js', 'screen-club.js', 'screen-client-detail.js'])
    vm.runInContext(fs.readFileSync(root + 'ui/js/' + f, 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '   ' + x : '')); if (!c) failed = true; };

// a DOM just rich enough for the dock: the screen element collects appended children
run(`Rng.seed(9); Clubs.init(); GameState.startNewGame('England','Ad','A'); GameState.save = function () {};
    __docked = []; __parent = { classList: { add: function () {} } };
    __el = { innerHTML: '', parentElement: __parent, appendChild: function (d) { __docked.push(d); } };
    __btn = { disabled: false, onclick: null };
    document.createElement = function () { return { className: '', innerHTML: '', querySelector: function () { return __btn; } }; };
    document.querySelector = function () { return __btn; };
    __p = GameState.players.find(function (x) { return !x.agentId && x.clubId && x.age <= 21; }); __p.potential = 88;
    Monetization.DEV_UNLOCK_ALL = false;
    __show = function () { __docked = []; ClientDetail.ctx(__p.id).tab = 'potential'; Router.isFreshNav = false; ClientDetail.render(__el, __p.id); return { dock: __docked.length, ins: __el.innerHTML.indexOf(I18n.t('cd.truePotential')) >= 0, prone: __el.innerHTML.indexOf(I18n.t('cd.injuryProne')) >= 0 }; };`);

const r = JSON.parse(run(`return JSON.stringify(__show());`));
check('without Enhanced Insights the Potential tab hides the exact potential and shows the "See potential" ad button', r.dock === 1 && !r.ins && !r.prone, JSON.stringify(r));
const html = run(`return __docked.length ? __docked[0].innerHTML : '';`);
check('the button says "See potential" with the ad symbol, docked like the Advance button', html.indexOf('See potential') >= 0 && html.indexOf('ti-ad') >= 0 && run(`return __docked[0].className;`).indexOf('cta-dock') >= 0, html);
check('the ad icon and the Reddit logo exist in the trimmed icon CSS', /\.ti-ad:before/.test(fs.readFileSync(root + 'ui/vendor/tabler-icons/tabler-icons.css', 'utf8')) && /\.ti-brand-reddit:before/.test(fs.readFileSync(root + 'ui/vendor/tabler-icons/tabler-icons.css', 'utf8')));

(async () => {
    // closed early: nothing revealed
    run(`Ads.setProvider({ init: async function () { return true; }, showRewarded: async function () { return 'closed'; } });`);
    await run(`return ClientDetail.adReveal(__p.id);`);
    const closed = JSON.parse(run(`return JSON.stringify(Object.assign(__show(), { flag: !!__p.insightAd }));`));
    check('an ad closed early reveals nothing (button still there)', !closed.flag && closed.dock === 1 && !closed.ins, JSON.stringify(closed));
    // no fill: nothing revealed
    run(`Ads.setProvider({ init: async function () { return true; }, showRewarded: async function () { return 'unavailable'; } });`);
    await run(`return ClientDetail.adReveal(__p.id);`);
    check('no ad available: nothing revealed', run(`return !__p.insightAd;`));
    // watched to the end: revealed for good, button gone, saved with the game
    run(`Ads.setProvider({ init: async function () { return true; }, showRewarded: async function () { return 'earned'; } });`);
    await run(`return ClientDetail.adReveal(__p.id);`);
    const ok = JSON.parse(run(`return JSON.stringify(Object.assign(__show(), { flag: !!__p.insightAd, kept: isPersistedPlayer(__p) }));`));
    check('a watched ad reveals potential and injury proneness for this player, the button disappears, and he is kept in the save',
        ok.flag && ok.ins && ok.prone && ok.dock === 0 && ok.kept, JSON.stringify(ok));
    // ...but only for him
    const other = JSON.parse(run(`var q = GameState.players.find(function (x) { return !x.agentId && x.clubId && x !== __p; }); var keep = __p; __p = q; var s = __show(); __p = keep; return JSON.stringify(s);`));
    check('another player is still hidden and still has the button', other.dock === 1 && !other.ins, JSON.stringify(other));
    // owning Enhanced Insights: the button is gone everywhere
    const owned = JSON.parse(run(`Monetization.owns = function (k) { return k === 'insights'; }; var q = GameState.players.find(function (x) { return !x.agentId && x.clubId && x !== __p && !x.insightAd; }); var keep = __p; __p = q; var s = __show(); __p = keep; return JSON.stringify(s);`));
    check('once Enhanced Insights is owned the button is gone on every player', owned.dock === 0 && owned.ins, JSON.stringify(owned));
    if (failed) process.exit(1);
})();
