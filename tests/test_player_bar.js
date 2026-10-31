// The top bar on the player card (route 'client', seasonBar): back · season ("37/38") · settings ·
// balance · rep · inbox. The name is NOT repeated there (it is right below and was always cut off),
// and the week's ± is left out. Every other screen keeps the week's ± and shows no season.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const app = { innerHTML: '' }, body = { innerHTML: '' };
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { hash: '' },
    document: { getElementById: id => id === 'app' ? app : id === 'screenBody' ? body : null, querySelector: () => null, addEventListener() {} },
    addEventListener() {}, scrollTo() {},
    I18n: { t: k => k },
    UI: { cur: () => '€', abbr: n => String(n), eabbr: n => '€' + n },
    GameState: { agency: { balance: 252000, reputation: 92 }, seasonStartYear: 2037, seasonLabel: () => '37/38', unreadCount: () => 10 },
};
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'ui/js/router.js', 'utf8'), sb, { filename: 'router.js' });
let failed = false;
const check = (l, c, x) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l + (x && !c ? '   ' + x : '')); if (!c) failed = true; };

const R = vm.runInContext('Router', sb);
R.lastWeekNet = 5000;
const card = { isMain: false, seasonBar: true, title: () => 'Piet van Niekerk', render() {} };
const other = { isMain: false, title: () => 'Client History', render() {} };
R.renderShell('client', card, ['p1']); const cardBar = app.innerHTML;
R.renderShell('clienthist', other, []); const otherBar = app.innerHTML;
const order = ['push-bar__back', '37/38', 'SettingsScreen.show', 'ti-wallet', 'ti-award', 'ti-inbox'].map(s => cardBar.indexOf(s));

check('player card: no name in the bar', cardBar.indexOf('Piet van Niekerk') < 0);
check('player card: back · season · settings · balance · rep · inbox, got ' + JSON.stringify(order), order.every((v, i) => v >= 0 && (!i || v > order[i - 1])));
check('player card: shows "37/38" only, not "Season 37/38"', cardBar.indexOf('>37/38<') >= 0 && !/season 37/i.test(cardBar));
check('player card: no week ±', cardBar.indexOf('ti-trending') < 0);
check('other screens: keep the week ± and their title', otherBar.indexOf('ti-trending-up') >= 0 && otherBar.indexOf('Client History') >= 0);
check('other screens: no season', otherBar.indexOf('37/38') < 0);
check('the player card route asks for this bar', /Router\.register\('client', \{[^}]*seasonBar: true/.test(fs.readFileSync(root + 'ui/js/screen-client-detail.js', 'utf8')));
if (failed) process.exit(1);
console.log('All player-bar checks passed.');
