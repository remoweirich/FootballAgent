// Router.sheet()/modal() must work on the screens that OWN #app.
//
// Settings, Store, Live-sim, Customize, Sandbox, Setup, Start, Achievements and Dialogue all do
// `document.getElementById('app').innerHTML = ...`, which deletes the #sheetLayer / #modalLayer that
// renderShell created. sheet() used to look the layer up and return silently when it was gone, so
// the language picker in Settings opened nothing — a dead button with no error anywhere.
//
// This drives the REAL Router against a DOM stub that actually models children, so the failure is
// reproducible: test_settings_lang.js stubs Router.sheet wholesale and therefore cannot see it.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

// --- a DOM stub with real parent/child behaviour, so innerHTML= wipes descendants like a browser
function mkEl(id) {
    return {
        id: id || '', innerHTML: '', className: '', style: {}, dataset: {}, children: [],
        appendChild(c) { c.parent = this; this.children.push(c); return c; },
        set innerHTMLSetter(v) { },
        querySelectorAll: () => [], querySelector: () => null,
        classList: { add() {}, remove() {}, toggle() {} },
    };
}
// innerHTML is a real setter: assigning to it detaches every child, as a browser does
function withInnerHTML(el, onSet) {
    let v = '';
    Object.defineProperty(el, 'innerHTML', {
        get: () => v,
        set(next) { v = String(next); el.children.length = 0; if (onSet) onSet(el); },
    });
    return el;
}

const app = withInnerHTML(mkEl('app'));
const registry = { app };
const sb = {
    console: { log() {}, warn() {}, error() {} },
    Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { hash: '' },
    document: {
        getElementById: id => registry[id] || null,
        createElement: () => {
            const el = withInnerHTML(mkEl());
            // a created element registers itself once it is given an id AND attached
            Object.defineProperty(el, 'id', {
                get() { return this._id || ''; },
                set(v) { this._id = v; registry[v] = this; },
            });
            return el;
        },
        querySelector: () => null, querySelectorAll: () => [],
        addEventListener() {}, head: { appendChild() {} }, body: withInnerHTML(mkEl('body')),
        documentElement: { setAttribute() {} },
    },
    window: { addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false }) },
};
sb.UI = { esc: s => (s == null ? '' : String(s)) };
sb.I18n = { locale: 'en', t: k => k, available: () => [{ code: 'en', name: 'English' }], LANGS: [{ code: 'en', name: 'English' }] };
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root, 'ui/js/router.js'), 'utf8'), sb, { filename: 'router.js' });
const Router = vm.runInContext('Router', sb);

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// 1. the layer is missing entirely (a screen has just taken over #app)
delete registry.sheetLayer; delete registry.modalLayer;
Router.sheet('<div class="sheet__title">Language</div>');
const sheetLayer = registry.sheetLayer;
check('sheet() creates #sheetLayer when a screen has wiped it', !!sheetLayer);
check('sheet() actually renders its content', !!sheetLayer && /sheet__title/.test(sheetLayer.innerHTML));
check('the layer is attached under #app', !!sheetLayer && sheetLayer.parent === app);

Router.modal('<div class="modal-card">hi</div>');
check('modal() creates #modalLayer the same way', !!registry.modalLayer && /modal-card/.test(registry.modalLayer.innerHTML));

// 2. the real sequence that was broken: a screen takes over #app, THEN a sheet is opened
app.innerHTML = '<div class="set-wrap">settings</div>';   // detaches both layers, as the browser does
delete registry.sheetLayer;                                // ...and they are gone from the document
Router.sheet('<div class="sheet__title">Language</div>');
check('after a screen replaces #app, a sheet still opens',
    !!registry.sheetLayer && /sheet__title/.test(registry.sheetLayer.innerHTML));

// 3. an existing layer is reused, not duplicated
const before = registry.sheetLayer;
Router.sheet('<div>second</div>');
check('an existing layer is reused rather than replaced', registry.sheetLayer === before);
check('reopening swaps the content', /second/.test(registry.sheetLayer.innerHTML));

// 4. closing is still safe with no layer at all
delete registry.sheetLayer; delete registry.modalLayer;
let threw = false;
try { Router.closeSheet(); Router.closeModal(); } catch (e) { threw = true; }
check('closeSheet/closeModal never throw when the layer is gone', threw === false);

// 5. every screen that owns #app is covered by the fix, so this list is worth pinning: if a new
//    screen starts taking over #app, it inherits working sheets automatically.
const owners = fs.readdirSync(path.join(root, 'ui/js'))
    .filter(f => f.endsWith('.js'))
    .filter(f => /getElementById\('app'\)\.innerHTML/.test(fs.readFileSync(path.join(root, 'ui/js', f), 'utf8')));
check(`screens owning #app are known (${owners.length}): ${owners.map(f => f.replace(/^screen-|\.js$/g, '')).join(', ')}`, owners.length >= 8);

console.log(failed ? '\n*** FAIL ***' : '\nAll router-layer checks passed.');
process.exitCode = failed ? 1 : 0;
