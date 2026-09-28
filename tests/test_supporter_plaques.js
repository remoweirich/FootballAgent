// Supporter plaques. The store description promises a badge, so buying a supporter pack has to
// actually show one on the start screen — cheapest tier first, one row each, and "4x" in front when
// the same pack was bought more than once.
//
// The counts are the new part: supporter packs are CONSUMABLE and repeatable, but only the highest
// tier was ever stored, so there was no way to know someone had bought Grateful Gamer four times.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

function load(seedPrefs) {
    const store = Object.assign({}, seedPrefs || {});
    const sb = {
        console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, setTimeout: () => 0,
        localStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; },
        },
        document: {
            documentElement: { setAttribute() {} }, getElementById: () => null,
            querySelector: () => null, createElement: () => ({ style: {} }), head: { appendChild() {} },
            addEventListener() {},
        },
        window: { matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }) },
    };
    sb.UI = { esc: s => (s == null ? '' : String(s)), money: n => String(n) };
    sb.I18n = { locale: 'en', t: k => k };
    vm.createContext(sb);
    for (const f of ['prefs.js', 'monetization.js'])
        vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', f), 'utf8'), sb, { filename: f });
    // screen-start.js needs a few globals it would get from the real page
    vm.runInContext('var GameState = { autosaveMeta: async () => null };', sb);
    vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-start.js'), 'utf8'), sb, { filename: 'screen-start.js' });
    return { sb, M: vm.runInContext('Monetization', sb), S: vm.runInContext('StartScreen', sb), store };
}

// ---- 1. a non-supporter sees nothing at all ----
let { M, S } = load();
M.DEV_UNLOCK_ALL = false; M._reset();
check('no supporter packs -> no plaques', M.supporterPlaques().length === 0);
let out = S._plaquesHTML();
check('and the start screen renders no plaque block', out.n === 0 && out.html === '' && out.height === 0);

// ---- 2. buying one pack shows exactly one plaque ----
M.addSupporterPack(1, 1);
check('buying the cheapest pack records a count of 1', M.supporterCountOf(1) === 1);
check('one plaque is shown', M.supporterPlaques().length === 1);
check('it is the right artwork', M.supporterPlaques()[0].slug === 'grateful');
out = S._plaquesHTML();
check('the markup points at the plaque image', /plaques\/grateful\.webp/.test(out.html));
// the gutter span is always emitted so the plaques stay aligned; it just carries no text
check('a single purchase shows no visible count', /<span class="ss-plaque__x"><\/span>/.test(out.html));

// ---- 3. buying the same pack again shows "2x", not a second plaque ----
M.addSupporterPack(1, 1);
check('a repeat purchase counts up', M.supporterCountOf(1) === 2);
check('still only ONE plaque row', M.supporterPlaques().length === 1);
out = S._plaquesHTML();
check('now prefixed "2x"', /<span class="ss-plaque__x">2x<\/span>/.test(out.html));
M.addSupporterPack(1, 1); M.addSupporterPack(1, 1);
out = S._plaquesHTML();
check('four purchases read "4x"', /<span class="ss-plaque__x">4x<\/span>/.test(out.html));

// ---- 4. the example from the brief: 4x Grateful, 1x Ecstatic, 2x Super ----
M.addSupporterPack(2, 1);
M.addSupporterPack(3, 1); M.addSupporterPack(3, 1);
const list = M.supporterPlaques();
check('three plaque rows', list.length === 3);
check('ordered cheapest tier first', list.map(p => p.slug).join(',') === 'grateful,ecstatic,super');
check('counts are 4 / 1 / 2', list.map(p => p.count).join(',') === '4,1,2');
out = S._plaquesHTML();
const xs = (out.html.match(/ss-plaque__x">(\d+)x</g) || []).map(m => m.match(/>(\d+)x/)[1]);
check('only the repeated tiers carry a prefix, and they read 4x then 2x', xs.join(',') === '4,2');
check('the highest tier owned is still reported', M.supporterTier() === 3);

// ---- 5. the layout contract: the logo only moves for the full set ----
//     .ss-brand has margin-top:8vh, which is the only slack above the logo. The block height is
//     subtracted from it and floored at 0, so one or two plaques are absorbed and three are not.
const h1 = S.PLAQUE_H, gap = S.PLAQUE_GAP;
const heightFor = n => n * h1 + (n - 1) * gap;
check('the reported block height matches the rows drawn', out.height === heightFor(3));
const cssSrc = fs.readFileSync(path.join(root, 'ui', 'js', 'screen-start.js'), 'utf8');
// The block is lifted out of the flow so the logo keeps a non-supporter's position; the lift is
// trimmed after render only if the screen is too short to hold it (see _fitPlaques).
check('the plaque block is lifted by its own height, not the brand',
    /\.ss-plaques\{[^}]*margin-top:calc\(-1 \* var\(--ss-plaquepull, 0px\)\)/.test(cssSrc));
check('the lift asked for equals the block height plus its gap',
    S._plaquesPull(heightFor(2)) === heightFor(2) + 10);
check('a short screen gives the lift back rather than clipping (the fitter exists)',
    typeof S._fitPlaques === 'function' && /getBoundingClientRect/.test(cssSrc + S._fitPlaques.toString()));
check('the start screen can scroll if a full set ever overflows a small phone',
    /\.ss-wrap\{[^}]*overflow-y:auto/.test(cssSrc));
// The count must stay white and about as tall as the lettering printed on the plaque art, so it
// reads as part of it. Checked as a RATIO of the plaque height rather than a fixed px, so resizing
// the plaques (PLAQUE_H) does not silently leave the count out of proportion.
const xSize = (/\.ss-plaque__x\{[^}]*font-size:(\d+)px/.exec(cssSrc) || [])[1];
check(`the count is white and roughly the plaque lettering height (${xSize}px on ${h1}px)`,
    /\.ss-plaque__x\{[^}]*color:#fff/.test(cssSrc) && xSize >= h1 * 0.38 && xSize <= h1 * 0.55);
// The PLAQUE is what gets centred; the count is pulled out of the flow and hung to its left. A
// fixed-width gutter inside the row was tried first and kept the plaques aligned WITH EACH OTHER
// while centring the [count + plaque] pair, so every plaque sat right of centre.
check('the plaque itself is centred',
    /\.ss-plaque\{[^}]*justify-content:center/.test(cssSrc));
check('the count is out of the flow, hung to the plaque\'s left, so it cannot shift it',
    /\.ss-plaque__x\{[^}]*position:absolute/.test(cssSrc) && /\.ss-plaque__x\{[^}]*right:100%/.test(cssSrc));
// The device bug this pins: _fitPlaques read a --sat custom property that nothing ever defined, so
// the floor was 0 and the top plaque sat behind the status bar. The wrap's COMPUTED padding-top
// already resolves env(safe-area-inset-top); a custom property holding env() would not.
// Comments are stripped first: this function's own comment NAMES the --sat mistake it explains,
// which would otherwise fail the check that the code no longer reads it.
const fitSrc = S._fitPlaques.toString().replace(/\/\/[^\n]*/g, '');
check('the safe-area floor comes from the wrap\'s computed padding, not an undefined variable',
    /getComputedStyle/.test(fitSrc) && /paddingTop/.test(fitSrc) && !/--sat/.test(fitSrc));

// ---- 6. restore must never reduce a count the device already knows ----
({ M, S } = load());
M.DEV_UNLOCK_ALL = false; M._reset();
M.addSupporterPack(2, 3);
M.setSupporterCountAtLeast(2, 1);     // the store reports fewer (a consumed purchase dropped off)
check('restore never lowers a known count', M.supporterCountOf(2) === 3);
M.setSupporterCountAtLeast(2, 5);     // the store knows more than the device
check('restore does raise a count', M.supporterCountOf(2) === 5);

// ---- 7. someone who supported BEFORE counts existed still gets their plaque ----
({ M, S } = load({ fa_prefs: JSON.stringify({ supporterTier: 2 }) }));   // Prefs.KEY
M.DEV_UNLOCK_ALL = false;
const migrated = M.supporterPlaques();
check('a legacy supporter (tier only, no counts) still sees a plaque',
    migrated.length === 1 && migrated[0].tier === 2 && migrated[0].count === 1);

// ---- 8. the artwork the code asks for actually exists ----
for (const p of M.PLAQUES) {
    check('artwork on disk: ' + p.slug + '.webp',
        fs.existsSync(path.join(root, 'ui', 'assets', 'img', 'plaques', p.slug + '.webp')));
}
check('every supporter product maps to a plaque tier', Object.values(M.PRODUCTS)
    .filter(p => p.tier).every(p => M.PLAQUES.some(x => x.tier === p.tier)));

console.log(failed ? '\n*** FAIL ***' : '\nAll supporter-plaque checks passed.');
process.exitCode = failed ? 1 : 0;
