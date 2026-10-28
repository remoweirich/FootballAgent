// In-app review (ui/js/review.js): the native sheet is asked for directly (no "do you like it?"
// question first), at most once per moment, at most 3 times in total, 14 days apart, never in the
// tutorial and never without the native plugin; the three moments are wired into the game.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

const store = {};
const calls = [];
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, JSON, setTimeout: () => 0,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { documentElement: { setAttribute() {}, removeAttribute() {}, style: {} }, addEventListener() {}, querySelector: () => null },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    GameState: { demoMode: false },
};
sb.window = sb;
let now = Date.UTC(2026, 9, 25);
sb.Date = class extends Date { static now() { return now; } };
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'ui/js/prefs.js', 'utf8'), sb, { filename: 'prefs.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/review.js', 'utf8'), sb, { filename: 'review.js' });
const run = c => vm.runInContext(c, sb);

// no native plugin (web / dev): nothing is asked and nothing is used up
check('without the native plugin nothing is asked (and the moment is not used up)', run(`Review.request('season2')`) === false && run(`Review.canAsk('season2')`) === true);

sb.Capacitor = { isNativePlatform: () => true, Plugins: { InAppReview: { requestReview: () => { calls.push(now); return Promise.resolve(); } } } };
check('season 2: asks the native sheet directly', run(`Review.request('season2')`) === true && calls.length === 1);
check('the same moment never asks twice', run(`Review.canAsk('season2')`) === false);
check('another moment inside 14 days waits', run(`Review.request('firstTrophy')`) === false && calls.length === 1);
now += 15 * 864e5;
check('...and asks once 14 days have passed', run(`Review.request('firstTrophy')`) === true && calls.length === 2);
now += 15 * 864e5;
sb.GameState.demoMode = true;
check('never during the tutorial (demo save)', run(`Review.request('bigTransfer')`) === false);
sb.GameState.demoMode = false;
check('the third moment asks', run(`Review.request('bigTransfer')`) === true && calls.length === 3);
now += 60 * 864e5;
check('at most 3 asks in total, and an unknown moment never asks', run(`Review.canAsk('season2')`) === false && run(`Review.canAsk('whatever')`) === false);
check('the record is kept on the device (Prefs)', /reviewAsks/.test(JSON.stringify(store)));

// wiring: season 2 (not 5) and a client trophy from the advance flow; a move to a bigger club from negotiations
const home = fs.readFileSync(root + 'ui/js/screen-home.js', 'utf8'), nego = fs.readFileSync(root + 'ui/js/screen-negotiations.js', 'utf8');
check('Home asks after the second season and after a client trophy', /seasonsCompleted\(\) >= 2 && Review\.canAsk\('season2'\)/.test(home) && /Review\.canAsk\('firstTrophy'\)/.test(home) && /Review\.request\(moment\)/.test(home));
check('a negotiated move to a bigger club asks (after the confirmation)', /to\.reputation > from\.reputation/.test(nego) && /Review\.request\('bigTransfer'\)/.test(nego));
check('the old "Enjoying the game?" pop-up is gone (no question before the review)', !/_showRatePrompt|ratePromptShown/.test(home) && !/'rate\.title'/.test(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8')));
check('review.js ships in the app bundle and the web page', /'review\.js'/.test(fs.readFileSync(root + 'scripts/build-mobile.js', 'utf8')) && /js\/review\.js/.test(fs.readFileSync(root + 'ui/index.html', 'utf8')));
if (failed) process.exit(1);
