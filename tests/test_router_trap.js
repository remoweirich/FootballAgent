// Reproduces the "stuck in the inbox" trap and verifies the Router.replace() fix.
// Loads the REAL router.js under a jsdom-free stub that models location.hash + async hashchange
// and the .screen DOM node route() reads, then drives home -> inbox -> mail -> resolve -> back.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';

// --- minimal DOM + hash model -----------------------------------------------
let hash = '#home';
const listeners = {};
const scr = { scrollTop: 0 };
const appEl = { innerHTML: '' };
const screenBody = { innerHTML: '' };
function el(id) { return id === 'app' ? appEl : id === 'screenBody' ? screenBody : { innerHTML: '', style: {} }; }
const doc = {
    addEventListener() {}, getElementById: el,
    querySelector: sel => sel === '.screen' ? scr : null,
    createElement: () => ({ style: {}, appendChild() {} }), head: { appendChild() {} }, body: {}
};
const win = {
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    matchMedia: () => ({ matches: false }), Capacitor: null, scrollTo() {}
};
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: fn => { fn(); return 0; }, clearTimeout() {},
    document: doc, window: win,
    get location() { return { get hash() { return hash; }, set hash(v) { const nv = v[0] === '#' ? v : '#' + v; if (nv !== hash) { hash = nv; (listeners.hashchange || []).forEach(f => f()); } } }; },
};
// location needs to be a stable object whose .hash setter fires hashchange
const locObj = { _h: '#home' };
Object.defineProperty(locObj, 'hash', { get() { return hash; }, set(v) { const nv = v[0] === '#' ? v : '#' + v; if (nv !== hash) { hash = nv; (listeners.hashchange || []).forEach(f => f()); } } });
sb.location = locObj;
sb.window.location = locObj;
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'i18n-de.js']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'i18n-en.js'), 'utf8'), sb, { filename: 'ui-i18n-en.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'router.js'), 'utf8'), sb, { filename: 'router.js' });

const R = vm.runInContext('Router', sb);
// stub UI screens: home (main), inbox (push, no parent), client (push), mail (push, parent inbox)
const store = { mails: { m1: true } };   // m1 exists until "resolved"
R.register('home', { isMain: true, title: 'Home', render(e) { e.innerHTML = 'home'; } });
R.register('inbox', { isMain: false, title: 'Inbox', render(e) { e.innerHTML = 'inbox'; } });
R.register('client', { isMain: false, title: 'Client', parent: 'inbox', render(e) { e.innerHTML = 'client'; } });
R.register('mail', {
    isMain: false, title: 'Mail', parent: 'inbox',
    render(e, params) {
        if (!store.mails[params[0]]) { R.back('inbox'); return; }   // the dead-mail redirect (item 9)
        e.innerHTML = 'mail:' + params[0];
    }
});

let failed = false; const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x ? '  ' + x : '')); if (!c) failed = true; };

R.start();                       // boots on #home
check('boot: on home', R.current === 'home');

R.go('inbox'); check('nav: on inbox', R.current === 'inbox' && R.navStack.join() === 'home', 'stack=' + R.navStack.join());
R.go('mail/m1'); check('nav: on mail', R.current === 'mail' && R.navStack.join() === 'home,inbox', 'stack=' + R.navStack.join());

// resolve the mail and jump to the client page (the "do a deal" flow: Nego.goPlayer)
delete store.mails.m1;
R.replace('client/p1');
check('deal: landed on client after resolving', R.current === 'client', 'cur=' + R.current);
check('deal: dead mail NOT left on the stack', !R.navStack.includes('mail/m1'), 'stack=' + R.navStack.join());

// THE BUG: press back from the client page. Must escape, never loop on the dead mail / inbox.
let guard = 0; const origRoute = R.route.bind(R);
R.route = function (isNav) { if (++guard > 50) throw new Error('ROUTE LOOP (>50 calls) — the trap is back'); return origRoute(isNav); };
R.back();
check('back from client escapes to a live screen (not the dead mail)', R.current !== 'mail', 'cur=' + R.current);

// From inbox, back must reach home rather than bouncing on a dead mail.
guard = 0; R.go('inbox');
guard = 0; R.back();
check('back from inbox reaches home (no trap)', R.current === 'home', 'cur=' + R.current);

// Direct trap repro: sit on inbox with a dead mail on the stack, hammer back a few times.
guard = 0; R.navStack.length = 0; R.go('inbox'); R.navStack.push('mail/m1');   // stale dead-mail breadcrumb
guard = 0;
for (let i = 0; i < 5 && R.current !== 'home'; i++) R.back();
check('stale dead-mail breadcrumb: back still reaches home within a few presses', R.current === 'home', 'cur=' + R.current);

console.log(failed ? '\n*** FAIL ***' : '\nRouter trap fixed — all checks passed.');
process.exit(failed ? 1 : 0);
