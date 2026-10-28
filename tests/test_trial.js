// The launch bonus (ui/js/monetization.js TRIAL): Enhanced Insights free for 72 hours for anyone who
// opens the game between 2 and 9 November 2026, once per device (a record with its own id that is
// never replaced), not a purchase, and turning the clock back neither restarts nor stretches it.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

const store = {};
let now = new Date(2026, 9, 27, 12).getTime();
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, JSON, setTimeout: () => 0,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { documentElement: { setAttribute() {}, removeAttribute() {}, style: {} }, addEventListener() {}, querySelector: () => null },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
};
sb.window = sb;
sb.Date = class extends Date { constructor(...a) { if (a.length) super(...a); else super(now); } static now() { return now; } };
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'ui/js/prefs.js', 'utf8'), sb, { filename: 'prefs.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/monetization.js', 'utf8'), sb, { filename: 'monetization.js' });
const run = c => vm.runInContext(c, sb);
const H = 3600e3, at = (d, h) => new Date(2026, 10, d, h || 0).getTime();
run(`Monetization.DEV_UNLOCK_ALL = false`);

check('before 2 November: no trial', run(`Monetization.trialTick()`) === null && run(`Monetization.owns('insights')`) === false);
now = at(3, 10);
check('opened on 3 November: the trial starts', run(`Monetization.trialTick()`) === 'started' && run(`Monetization.owns('insights')`) === true);
const rec = JSON.parse(run(`JSON.stringify(Monetization._trialRec())`));
check('it carries its own unique id and lasts exactly 72 hours', typeof rec.id === 'string' && rec.id.length >= 8 && rec.end - rec.start === 72 * H, JSON.stringify(rec));
check('it is not a purchase (the entitlement set stays empty, the Store still sells it)', run(`Monetization.entitlements().length`) === 0 && run(`Monetization.purchased('insights')`) === false);
check('the start screen says hello once', run(`Monetization.trialNotice()`) === 'welcome' && (run(`Monetization.trialNoted('welcome')`), run(`Monetization.trialNotice()`) === null));
now = at(5, 9);
check('still on two days later', run(`Monetization.owns('insights')`) === true);
now = at(6, 11);
check('over after 72 hours', run(`Monetization.owns('insights')`) === false);
check('...and the start screen says so once, with the way to the Shop', run(`Monetization.trialNotice()`) === 'ended' && (run(`Monetization.trialNoted('ended')`), run(`Monetization.trialNotice()`) === null));
now = at(8, 12);
check('opening again inside the window does NOT restart it (one per device)', run(`Monetization.trialTick()`) === null && run(`Monetization.owns('insights')`) === false && JSON.parse(run(`JSON.stringify(Monetization._trialRec())`)).id === rec.id);
now = at(3, 12);
check('turning the clock back to the trial days does not bring it back', run(`Monetization.trialTick()`) === null && run(`Monetization.owns('insights')`) === false);

// a fresh device: turning the clock back mid-trial switches it off rather than freezing it
run(`Prefs.set('trial_launch2026', null); Prefs.set('entitlements', [])`);
now = at(4, 8);
run(`Monetization.trialTick()`);
now = at(5, 8); run(`Monetization.owns('insights')`);           // used a day later (the latest time is recorded)
now = at(4, 20);
check('a clock set back mid-trial switches it off (it cannot be stretched)', run(`Monetization.owns('insights')`) === false);
now = at(5, 9);
check('...back to real time it carries on, and still ends 72 hours after it began', run(`Monetization.owns('insights')`) === true && (now = at(7, 8) + 1, run(`Monetization.owns('insights')`) === false));

// someone who bought it never gets a trial
run(`Prefs.set('trial_launch2026', null); Prefs.set('entitlements', [])`);
run(`Monetization._save(new Set(['insights']))`);
now = at(3, 10);
check('a buyer gets no trial (and no notices)', run(`Monetization.trialTick()`) === null && run(`Monetization.trialNotice()`) === null && run(`Monetization.owns('insights')`) === true);
// after the window: nothing starts
run(`Prefs.set('trial_launch2026', null); Prefs.set('entitlements', [])`);
now = at(10, 1);
check('from 10 November nothing starts', run(`Monetization.trialTick()`) === null && run(`Monetization.owns('insights')`) === false);

const start = fs.readFileSync(root + 'ui/js/screen-start.js', 'utf8'), shop = fs.readFileSync(root + 'ui/js/screen-store.js', 'utf8');
check('the start screen runs it on every launch and shows the notices', /this\._trialNotice\(\)/.test(start) && /trial\.welcomeTitle/.test(start) && /trial\.endedTitle/.test(start));
check('the Shop shows how long the bonus lasts', /trial\.storeLine/.test(shop));
const langs = ['en', 'de', 'es', 'fr', 'it', 'nl', 'pt'];
check('the texts exist in all 7 languages', langs.every(l => { const t = fs.readFileSync(root + 'ui/js/i18n-' + l + '.js', 'utf8'); return ['welcomeTitle', 'welcomeBody', 'endedTitle', 'endedBody', 'openShop', 'storeLine'].every(k => t.includes("'trial." + k + "'")); }));
if (failed) process.exit(1);
