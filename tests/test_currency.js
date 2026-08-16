// Currency picker: EUR is the baseline; GBP/CHF are derived by a fixed rate and rounded to the nearest
// 10. UI.money/UI.abbr convert the number, UI.cur()/euro/eabbr carry the symbol, and I18n.t swaps the
// literal '€' in translated strings.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..') + '/';
let store = {};
const sb = {
    console: { log() { }, warn() { }, error() { } }, Math, Date, JSON,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { documentElement: { setAttribute() { } }, addEventListener() { } },
    window: { addEventListener() { } },   // no matchMedia -> Theme falls back to dark, no listeners
};
vm.createContext(sb);
for (const f of [['js', 'i18n.js'], ['js', 'i18n-en.js'], ['ui/js', 'prefs.js'], ['ui/js', 'shim.js']])
    vm.runInContext(fs.readFileSync(path.join(root, f[0], f[1]), 'utf8'), sb, { filename: f[1] });
vm.runInContext('I18n.init();', sb);
const runv = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

check('defaults to EUR', runv(`return Currency.get()==='EUR'`));
check('EUR passes the euro amount through', runv(`Currency.set('EUR'); return Currency.conv(1234)===1234 && UI.money(1234)==='1,234'`));
check('EUR symbol is €', runv(`Currency.set('EUR'); return UI.cur()==='€' && UI.euro(1000)==='€1,000'`));

check('GBP converts + rounds to nearest 10', runv(`Currency.set('GBP'); return Currency.conv(1000)===860 && Currency.conv(15000)===12900`));
check('GBP rounds a messy amount to the nearest 10', runv(`Currency.set('GBP'); return Currency.conv(1234)===1060`));   // 1234*0.86=1061.24 -> 1060
check('GBP symbol + formatting', runv(`Currency.set('GBP'); return UI.cur()==='£' && UI.money(1000)==='860' && UI.euro(1000)==='£860'`));
check('GBP abbreviates converted millions', runv(`Currency.set('GBP'); return UI.eabbr(10000000)==='£8.6M'`));   // 10M*0.86=8.6M

check('CHF converts + rounds to nearest 10', runv(`Currency.set('CHF'); return Currency.conv(1000)===950 && UI.cur()==='CHF '`));

check('negative amounts convert symmetrically', runv(`Currency.set('GBP'); return Currency.conv(-1000)===-860`));

// I18n.t swaps the literal € for the active symbol (amount already converted via UI.money)
check('I18n.t swaps € for £ (GBP)', runv(`
    Currency.set('GBP');
    var s = I18n.t('ag.physio.cost', { cost: UI.money(1000) });
    return s.indexOf('£860')>=0 && s.indexOf('€')<0;
`));
check('I18n.t leaves € untouched for EUR', runv(`
    Currency.set('EUR');
    var s = I18n.t('ag.physio.cost', { cost: UI.money(1000) });
    return s.indexOf('€1,000')>=0;
`));

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll currency checks passed.');
process.exitCode = failed ? 1 : 0;
