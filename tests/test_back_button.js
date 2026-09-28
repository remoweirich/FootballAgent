// The Android hardware back button must always go UP one level, and must never drop the player out
// of the game without asking.
//
// The bug this pins: hardwareBack() only knew about Router screens, but nine screens take over #app
// and run outside the Router shell. In those, `this.current` still named whatever route was hidden
// underneath, so back either navigated an invisible screen or — when that screen was Home — fell
// straight through to exitApp() and quit the game mid-save.
//
// Each check drives the REAL Router against a DOM stub, then asserts BOTH what happened and that
// exitApp() was not reached.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---- a DOM stub just rich enough for the two selectors hardwareBack uses -------------------
// `state` is what is currently "on screen"; each field maps to one rung of the ladder.
const state = {
    loose: null,        // id of a loose top overlay (artLightbox, ssOverlay, ...)
    sheet: '',          // #sheetLayer.innerHTML
    modal: '',          // #modalLayer.innerHTML — data-back is read back OUT of this, so the real
                        // confirmExit() markup is exercised rather than a hand-set flag
    overlay: null,      // data-screen of the full-screen overlay owning #app
};
const log = [];
const removed = id => log.push('remove:' + id);

function elFor(id) {
    if (id === 'sheetLayer') return { get innerHTML() { return state.sheet; }, set innerHTML(v) { state.sheet = v; } };
    if (id === 'modalLayer') return { get innerHTML() { return state.modal; }, set innerHTML(v) { state.modal = v; } };
    if (state.loose === id) return { remove() { state.loose = null; removed(id); } };
    return null;
}
const sb = {
    console: { log() {}, warn() {}, error() {} },
    Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { hash: '' },
    document: {
        getElementById: elFor,
        querySelector(sel) {
            if (sel === '#modalLayer .modal-card > *') {
                if (!state.modal) return null;
                const m = /data-back="([^"]+)"/.exec(state.modal);
                return {
                    getAttribute: a => (a === 'data-back' ? (m ? m[1] : null) : null),
                    click() { log.push('modalClick'); },
                };
            }
            if (sel === '#app > [data-screen]') {
                if (!state.overlay) return null;
                return { getAttribute: () => state.overlay };
            }
            return null;
        },
        querySelectorAll: () => [],
        createElement: () => ({ id: '', style: { setProperty() {} }, appendChild() {} }),
        addEventListener() {}, head: { appendChild() {} },
        body: { appendChild() {} }, documentElement: { setAttribute() {} },
    },
    window: {
        addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false }),
        Capacitor: { Plugins: { App: { exitApp() { log.push('EXIT'); }, addListener() {} } } },
    },
};
sb.UI = { esc: s => (s == null ? '' : String(s)) };
sb.I18n = { locale: 'en', t: k => k, available: () => [], LANGS: [] };
// the overlay handlers are looked up with `typeof X !== 'undefined'`, so stubs must be real bindings
sb.SettingsScreen = { close() { log.push('settings.close'); }, toStart() { log.push('toStart'); } };
sb.AchievementsScreen = { back() { log.push('achievements.back'); } };
sb.StoreScreen = { back() { log.push('store.back'); } };
sb.CustomizeScreen = { exit() { log.push('customize.exit'); } };
sb.Sandbox = { back() { log.push('sandbox.back'); } };
sb.StartScreen = { show() { log.push('start.show'); } };
sb.DialogueView = { leave() { log.push('dialogue.leave'); } };
sb.LiveView = { s: { done: false }, _done() { log.push('livesim.done'); } };
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root, 'ui/js/router.js'), 'utf8'), sb, { filename: 'router.js' });
const Router = vm.runInContext('Router', sb);
Router.back = () => log.push('router.back');
Router.go = n => log.push('router.go:' + n);

// press the button from a given situation and return everything it did
function press(situation) {
    Object.assign(state, { loose: null, sheet: '', modal: '', overlay: null }, situation.state || {});
    Router.screens = situation.screens || { home: { isMain: true } };
    Router.current = situation.current || 'home';
    Router.navStack = situation.navStack || [];
    log.length = 0;
    Router.hardwareBack();
    return log.join(',');
}

console.log('--- the ladder, rung by rung ---');

// 1. loose overlays sit on top of everything and dismiss themselves
for (const id of ['artLightbox', 'ssOverlay', 'helpOverlay', 'setOverlay', 'cxOverlay']) {
    check(`#${id} open -> it closes, nothing else`, press({ state: { loose: id } }) === 'remove:' + id);
}
// ...even from the start screen, where the next rung would be the quit dialog
check('a loose overlay beats the quit dialog',
    press({ state: { loose: 'ssOverlay', overlay: 'start' } }) === 'remove:ssOverlay');

// 2. an open sheet closes, like tapping its backdrop
check('open sheet -> closeSheet()', (() => {
    const r = press({ state: { sheet: '<div class="sheet">x</div>' } });
    return r === '' && state.sheet === '';
})());

// 3. an open modal forwards the press to its root, because several modals DRIVE a flow on click
//    (week summary -> spotlight chain); clearing the layer would strand it half-finished
check('open modal -> its root is clicked, not wiped',
    press({ state: { modal: '<div>continue</div>' } }) === 'modalClick');
check('a modal marked data-back="close" is cancelled instead of answered', (() => {
    const r = press({ state: { modal: '<div data-back="close">really?</div>' } });
    return r === '' && state.modal === '';
})());

// 4. the nine full-screen overlays each close themselves
const expected = {
    settings: 'settings.close', achievements: 'achievements.back', store: 'store.back',
    customize: 'customize.exit', sandbox: 'sandbox.back', setup: 'start.show',
    dialogue: 'dialogue.leave',                // the chat's own X: choices are already banked
    livesim: '',                               // still running -> swallowed (see below)
};
for (const name of Object.keys(expected)) {
    // the hidden route underneath is Home — the exact case that used to quit the app
    const r = press({ state: { overlay: name }, current: 'home' });
    check(`overlay "${name}" -> ${expected[name] || '(swallowed)'}`, r === expected[name]);
}
// the live sim is the one screen whose answer depends on its own state
sb.LiveView.s.done = true;
check('overlay "livesim" AFTER the whistle -> leave, like the full-time button',
    press({ state: { overlay: 'livesim' }, current: 'home' }) === 'livesim.done');
sb.LiveView.s.done = false;
check('overlay "livesim" MID-match -> swallowed, so no outcome is skipped',
    press({ state: { overlay: 'livesim' }, current: 'home' }) === '');
check('overlay "start" -> the quit dialog, not an immediate exit', (() => {
    const r = press({ state: { overlay: 'start' } });
    return r === '' && /quit\.title/.test(state.modal) && /quit\.leave/.test(state.modal);
})());
// an overlay nobody wired up must swallow the press rather than fall through and quit
check('an UNKNOWN overlay swallows the press (never falls through to exit)',
    press({ state: { overlay: 'somethingNew' }, current: 'home' }) === '');

// 5. inside the Router shell
check('a pushed screen -> back()',
    press({ screens: { player: { isMain: false } }, current: 'player' }) === 'router.back');
check('a non-empty navStack -> back()',
    press({ current: 'home', navStack: ['home'] }) === 'router.back');
check('a main tab -> Home',
    press({ screens: { home: { isMain: true }, clients: { isMain: true } }, current: 'clients' }) === 'router.go:home');

// 6. Home is the top of the in-game hierarchy: OUT to the start screen, never out of the app
// toStart() saves and THEN shows the menu — the press that used to quit the app mid-save
check('Home -> the start screen, via the saving route (this press used to quit)',
    press({ current: 'home' }) === 'toStart');

console.log('\n--- exitApp is unreachable without a confirmation ---');
// Every situation above is one press; none of them may quit.
const situations = [
    { state: { loose: 'artLightbox' } }, { state: { sheet: 'x' } },
    { state: { modal: '<div>x</div>' } }, { state: { modal: '<div data-back="close">x</div>' } },
    ...Object.keys(expected).map(n => ({ state: { overlay: n }, current: 'home' })),
    { state: { overlay: 'start' } }, { current: 'home' },
    { screens: { player: { isMain: false } }, current: 'player' },
];
check('no single back press anywhere quits the game',
    situations.every(s => !/EXIT/.test(press(s))));
// pressing back repeatedly from the deepest screen must settle on the start screen, not quit
let seq = [];
Object.assign(state, { loose: null, sheet: '', modal: '', overlay: null });
Router.screens = { home: { isMain: true }, player: { isMain: false } };
Router.current = 'player'; Router.navStack = [];
for (let i = 0; i < 12; i++) {
    log.length = 0;
    Router.hardwareBack();
    seq = seq.concat(log);
    if (/toStart|start\.show/.test(log.join(','))) { Router.current = 'home'; state.overlay = 'start'; }
    else if (/router\.back/.test(log.join(','))) { Router.current = 'home'; Router.navStack = []; }
}
check('hammering back 12x from a deep screen never quits: ' + [...new Set(seq)].join(' > '),
    !seq.includes('EXIT'));
// ...and the only route out is the dialog's own Leave button
log.length = 0; Router.exitApp();
check('Router.exitApp() (the dialog\'s Leave button) is what actually quits', log.includes('EXIT'));

console.log('\n--- coverage: no overlay may be added without a back handler ---');
// If a new screen starts taking over #app, this fails until it is tagged AND wired, rather than
// silently regaining the old quit-the-app behaviour.
const uiDir = path.join(root, 'ui/js');
const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.js'));
const owners = files.filter(f => /getElementById\('app'\)\.innerHTML/.test(fs.readFileSync(path.join(uiDir, f), 'utf8')));
const tagged = {};
for (const f of files) {
    const m = fs.readFileSync(path.join(uiDir, f), 'utf8').match(/data-screen="([a-z]+)"/g) || [];
    for (const t of m) tagged[t.slice(13, -1)] = f;
}
check(`every screen owning #app is tagged with data-screen (${owners.length} owners, ${Object.keys(tagged).length} tags)`,
    owners.length === Object.keys(tagged).length);
for (const name of Object.keys(tagged)) {
    check(`  data-screen="${name}" (${tagged[name]}) has a back handler`,
        Object.prototype.hasOwnProperty.call(Router.OVERLAY_BACK, name));
}
for (const name of Object.keys(Router.OVERLAY_BACK)) {
    check(`  OVERLAY_BACK["${name}"] still matches a real tag`, !!tagged[name]);
}

console.log('\n--- the quit dialog is translated everywhere ---');
const KEYS = ['quit.title', 'quit.body', 'quit.stay', 'quit.leave'];
for (const f of files.filter(f => /^i18n-[a-z]{2}\.js$/.test(f))) {
    const src = fs.readFileSync(path.join(uiDir, f), 'utf8');
    const missing = KEYS.filter(k => !src.includes(`'${k}':`));
    check(`${f} has all four quit strings${missing.length ? ' — missing ' + missing.join(', ') : ''}`,
        missing.length === 0);
}

console.log(failed ? '\n*** FAIL ***' : '\nAll hardware-back checks passed.');
process.exitCode = failed ? 1 : 0;
