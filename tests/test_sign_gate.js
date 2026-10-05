// The tutorial's representation-offer gate: Propose terms stays disabled until the sliders match
// exactly what the step asked for, and is inert outside the tour.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

let sheetHTML = '';
const byId = {};
const mk = () => ({
    style: {}, classList: { add() {}, remove() {}, toggle() {} }, innerHTML: '', textContent: '',
    addEventListener() {}, appendChild() {}, remove() {},
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = v; }, removeAttribute(k) { delete this._attrs[k]; },
    hasAttribute(k) { return k in this._attrs; },
});
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON,
    setTimeout: () => 0, clearTimeout() {}, indexedDB: undefined,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: {
        getElementById: id => byId[id] || null,
        querySelector: () => null, querySelectorAll: () => [],
        createElement: mk, head: { appendChild() {} }, body: { appendChild() {} },
        documentElement: { setAttribute() {} }, addEventListener() {},
    },
    addEventListener() {}, removeEventListener() {}, location: { hash: '' },
    UI: {
        money: String, esc: s => (s == null ? '' : String(s)), euro: n => '€' + n,
        crest: () => '', flag: () => '', clubName: id => String(id), abilityBadge: q => String(q),
        currentClubInfo: () => null, ratingText: v => String(v), ratingVar: () => '--text',
        kindIcon: () => '', kindColor: () => '', eabbr: n => String(n), niceAxis: () => ({ min: 0, max: 1, step: 1 }),
        xyChart: () => '<svg></svg>',
    },
    Router: {
        sheet(h) { sheetHTML = String(h); }, closeSheet() {}, modal() {}, closeModal() {},
        link: (a, b) => '#' + a + '/' + b, refresh() {}, go() {}, register() {}, result() {},
        isFreshNav: false,
    },
};
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root + 'js/i18n.js', 'utf8'), sb, { filename: 'i18n.js' });
vm.runInContext(fs.readFileSync(root + 'js/i18n-en.js', 'utf8'), sb, { filename: 'i18n-en.js' });
vm.runInContext(fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8'), sb, { filename: 'ui/i18n-en.js' });
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(root + 'js/' + f, 'utf8'), sb, { filename: f });
vm.runInContext(fs.readFileSync(root + 'ui/js/screen-client-detail.js', 'utf8'), sb, { filename: 'screen-client-detail.js' });

const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

vm.runInContext("Clubs.init(); GameState.startNewGame('England','T','A');", sb);
// a prospect to negotiate over, and a stand-in for the tour
vm.runInContext(`
    var __gate = false;
    Walkthrough = {
        SIGN_TERMS: { 1: { wage: 14, sponsor: 12, term: 4 }, 2: { wage: 11, sponsor: 9, term: 5 } },
        gating: function (n) { return __gate && n === 'signTerms'; },
        signTerms: function (r) { return this.gating('signTerms') ? (this.SIGN_TERMS[r] || null) : null; },
    };
    var __p = PlayerGen.makeProspect(Clubs.allClubs[40], { ability: 56, potential: 83, age: 17 });
    __p.id = 'wt_wayne'; __p.knownToAgent = true;
    GameState.players.push(__p);
`, sb);

const blocked = () => run("return ClientDetail.signBlocked('wt_wayne');");
const set = (w, s, t) => run(`var c = ClientDetail.ctx('wt_wayne').sign; c.wage=${w}; c.sponsor=${s}; c.term=${t};`);

console.log('-- off the tour --');
run("ClientDetail.openSign('wt_wayne');");
check('nothing is gated when the tutorial is not running', blocked() === false);
check('the sheet renders Propose enabled', /id="signProposeBtn"/.test(sheetHTML) && !/id="signProposeBtn"[^>]*disabled/.test(sheetHTML));

console.log('\n-- round 1 asks for 14 / 12 / 4 --');
run("__gate = true; ClientDetail.openSign('wt_wayne');");
check('the default 10 / 10 / 3 is blocked', blocked() === true);
check('...and the sheet says why', /Set exactly the terms/.test(sheetHTML));
check('...and renders Propose disabled', /id="signProposeBtn"[^>]*disabled/.test(sheetHTML));
set(14, 12, 4);
check('the asked-for terms unblock it', blocked() === false);
// each field on its own must still block, or the step teaches nothing
set(13, 12, 4); check('...a wrong wage blocks', blocked() === true);
set(14, 11, 4); check('...a wrong sponsor cut blocks', blocked() === true);
set(14, 12, 5); check('...a wrong term blocks', blocked() === true);

console.log('\n-- round 2 asks for 11 / 9 / 5 --');
run("ClientDetail.ctx('wt_wayne').sign.round = 2;");
set(14, 12, 4);
check('round 1’s answer no longer passes', blocked() === true);
set(11, 9, 5);
check('round 2’s answer passes', blocked() === false);

console.log('\n-- the numbers match the narration --');
const en = fs.readFileSync(root + 'ui/js/i18n-en.js', 'utf8').split('\n');
const line = k => en.find(x => x.indexOf("'" + k + "'") >= 0) || '';
// substring checks, not regexes: a stray escape once wrote a control byte into one of these
const quotes = (k, pcts, seasons) => {
    const l = line(k);
    return pcts.every(pc => l.indexOf(pc + '%') >= 0) && l.indexOf(seasons + ' seasons') >= 0;
};
check('step one quotes 14 / 12 / 4', quotes('wt.wayne.neg1', [14, 12], 4));
check('step two quotes 11 / 9 / 5', quotes('wt.wayne.neg2', [11, 9], 5));

console.log('\n-- dragging a slider updates the button without re-rendering --');
// renderSign is deliberately not re-run mid-drag (it would recreate the <input> and the drag jumps)
check('signSlide syncs the gated button by hand', (() => {
    byId['signProposeBtn'] = mk();
    byId['signWageVal'] = mk(); byId['signSponsorVal'] = mk(); byId['signTermVal'] = mk();
    run("ClientDetail.ctx('wt_wayne').sign.round = 1;");
    set(14, 12, 4);
    run("ClientDetail.signSlide('wt_wayne','wage',9);");
    const off = byId['signProposeBtn'].hasAttribute('disabled');
    run("ClientDetail.signSlide('wt_wayne','wage',14);");
    const on = !byId['signProposeBtn'].hasAttribute('disabled');
    delete byId['signProposeBtn'];
    return off && on;
})());

console.log(failed ? '\n*** FAIL ***' : '\nAll sign-gate checks passed.');
process.exit(failed ? 1 : 0);
