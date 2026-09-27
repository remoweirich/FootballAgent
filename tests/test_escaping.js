// Names reach innerHTML through template literals, and club, competition and player names can all
// come from an imported community names pack — _parseNamesText (ui/js/screen-customize.js) does no
// sanitising, by design, because escaping belongs at the render site. So no UI screen may drop a
// bare ${x.name} into its HTML.
//
// The realistic failure is mundane: a club called "Inter & Milan" renders as "Inter &amp;..." or
// breaks the tag around it. The worst case is a pack with markup in a name field running script in
// a WebView that has Capacitor Filesystem and Share available.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..') + '/';
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---- 1. no bare ${...name} in any UI screen ----
const BARE = /\$\{([A-Za-z_][\w.]*\.name)\}/g;
const offenders = [];
for (const f of fs.readdirSync(path.join(root, 'ui/js')).filter(f => f.endsWith('.js') && !f.startsWith('i18n-'))) {
    const src = fs.readFileSync(path.join(root, 'ui/js', f), 'utf8');
    src.split('\n').forEach((line, i) => {
        let m;
        BARE.lastIndex = 0;
        while ((m = BARE.exec(line))) offenders.push(`${f}:${i + 1} \${${m[1]}}`);
    });
}
check(`no unescaped \${x.name} in the UI${offenders.length ? ' — ' + offenders.slice(0, 5).join(', ') : ''}`,
    offenders.length === 0);

// ---- 2. UI.esc really neutralises markup ----
const sb = { window: {}, document: { addEventListener() {} }, console, Math, JSON, Date, localStorage: { getItem: () => null, setItem() {} } };
sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root, 'ui/js/shim.js'), 'utf8'), sb, { filename: 'shim.js' });
const esc = vm.runInContext('UI.esc', sb);
const evil = `<img src=x onerror='alert(1)'>Ajax`;
const out = esc(evil);
check('UI.esc removes every angle bracket and quote', !/[<>"']/.test(out) && out.includes('&lt;img'));
check('UI.esc escapes & too (so "Inter & Milan" survives a round trip)', esc('Inter & Milan') === 'Inter &amp; Milan');
check('UI.esc is null-safe', esc(null) === '' && esc(undefined) === '');

// ---- 3. the import parser still accepts an ordinary name unchanged (escaping must not be
//         pushed into the parser, or exported/re-imported names would drift) ----
const cust = fs.readFileSync(path.join(root, 'ui/js/screen-customize.js'), 'utf8');
const body = cust.slice(cust.indexOf('_parseNamesText(text) {'));
const fnSrc = 'function parseNames(text) {' + body.slice(body.indexOf('{') + 1, body.indexOf('\n    },')) + '}';
const parseNames = new Function(fnSrc + '; return parseNames;')();
const parsed = parseNames('id,name\najax,"Inter & Milan"\n');
check('the names parser leaves & alone (escaping happens at render, not on import)',
    parsed.ajax === 'Inter & Milan');

// ---- 4. and the round trip is safe: a hostile name, parsed then rendered, is inert ----
const hostile = parseNames('id,name\najax,"<img src=x onerror=alert(1)>Ajax"\n').ajax;
check('a hostile imported name is inert once escaped', !/<img/.test(esc(hostile)));

console.log(failed ? '\n*** FAIL ***' : '\nAll escaping checks passed.');
process.exitCode = failed ? 1 : 0;
