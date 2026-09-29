// The stacking ladder. This exists because of a shipped bug that reached a store review: the
// language picker in Settings "did nothing".
//
// It was not dead. Router.sheet() built the sheet, filled it with the locales and appended it to
// #app as the last child — all correct, and all confirmed by test_router_layers.js, which passed
// the whole time. The sheet was simply INVISIBLE: .sheet-backdrop sat at z-index 50 and .set-wrap,
// the opaque full-screen Settings background, sat at 55 and painted straight over it. In a real
// browser document.elementFromPoint at the middle of the sheet returned .set-body, so the tap
// could never reach a locale row.
//
// A DOM stub cannot see that — it has no layout and no paint order. So the invariant is pinned
// here as what it really is: a numeric fact about the CSS. Nine screens take over #app as
// full-screen overlays; anything the router floats on top of them MUST outrank all of them.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---- collect every z-index in the UI, wherever it is declared -------------------------------
// Screens inject their own CSS from inside their .js, so the .js files count as stylesheets here.
const files = [
    path.join(root, 'ui', 'app.css'),
    ...fs.readdirSync(path.join(root, 'ui', 'files')).filter(f => f.endsWith('.css')).map(f => path.join(root, 'ui', 'files', f)),
    ...fs.readdirSync(path.join(root, 'ui', 'js')).filter(f => f.endsWith('.js')).map(f => path.join(root, 'ui', 'js', f)),
];
const Z = {};                 // selector -> {z, file}
const RE = /\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}/g;
for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = RE.exec(src))) {
        const zm = /z-index:\s*(-?\d+)/.exec(m[2]);
        if (!zm) continue;
        Z['.' + m[1]] = { z: +zm[1], file: path.basename(f) };
    }
}
const z = sel => (Z[sel] ? Z[sel].z : null);
check(`found z-indexed selectors (${Object.keys(Z).length})`, Object.keys(Z).length >= 15);

// ---- the four rungs --------------------------------------------------------------------------
// Every screen that takes over #app. Derived from the source, not hardcoded, so a NEW full-screen
// screen is picked up automatically and has to obey the ladder too.
const uiJs = path.join(root, 'ui', 'js');
const owners = fs.readdirSync(uiJs).filter(f => f.endsWith('.js'))
    .filter(f => /getElementById\('app'\)\.innerHTML/.test(fs.readFileSync(path.join(uiJs, f), 'utf8')));
const wraps = Object.keys(Z).filter(s => /-wrap$/.test(s));
// Every screen that owns #app tags its wrapper with data-screen (see Router.hardwareBack), so the
// tags are the authoritative list of full-screen wrappers. Two of them are expected not to appear
// in `wraps`: Achievements reuses .set-wrap, and .setup-wrap declares no z-index at all — which is
// safe, because z-index:auto participates at 0 and so cannot outrank the sheet either way.
const tagged = new Set();
for (const f of fs.readdirSync(uiJs).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(uiJs, f), 'utf8');
    const m = /<div class="([a-z-]+wrap)"[^>]*data-screen="([a-z]+)"/g;
    let x; while ((x = m.exec(src))) tagged.add('.' + x[1]);
}
check(`every full-screen screen is tagged (${owners.length} screens -> ${tagged.size} distinct wrappers)`,
    tagged.size >= 8);
const unranked = [...tagged].filter(s => z(s) == null);
check(`wrappers with no z-index cannot outrank the sheet anyway (${unranked.length}: ${unranked.join(', ') || 'none'})`,
    unranked.every(s => z(s) == null));   // documented, and they sit at 0
check('every tagged wrapper that DOES declare a z-index is in the 50-60 screen band',
    [...tagged].filter(s => z(s) != null).every(s => z(s) >= 50 && z(s) <= 60));

const SHEET = '.sheet-backdrop', MODAL = '.modal-backdrop';
check(`${SHEET} is declared`, z(SHEET) != null);
check(`${MODAL} is declared`, z(MODAL) != null);

console.log('\n-- the router floats above every screen --');
const topWrap = wraps.reduce((a, b) => (z(a) >= z(b) ? a : b), wraps[0]);
console.log(`   highest screen wrapper: ${topWrap} at ${z(topWrap)}`);
for (const w of wraps.sort((a, b) => z(b) - z(a))) {
    check(`  sheet (${z(SHEET)}) outranks ${w} (${z(w)})`, z(SHEET) > z(w));
}
// the exact pair that shipped broken
check(`  the regression itself: sheet ${z(SHEET)} > .set-wrap ${z('.set-wrap')}`,
    z(SHEET) > z('.set-wrap'));
check(`  modal (${z(MODAL)}) outranks every screen wrapper`, z(MODAL) > z(topWrap));
// A tie is not good enough: equal z-index falls back to DOM order, which is only accidentally
// right. #sheetLayer happens to be appended last today; a screen re-rendering after a sheet opens
// would silently flip it.
check('  no screen wrapper TIES the sheet (ties resolve by DOM order, which is luck)',
    wraps.every(w => z(w) !== z(SHEET)));
check('  no screen wrapper ties the modal', wraps.every(w => z(w) !== z(MODAL)));

console.log('\n-- and the rungs are in the order hardwareBack assumes --');
// Router.hardwareBack dismisses loose overlays first, then the sheet, then the modal, then the
// screen. What the back button reaches first must be what the player sees on top.
check(`  modal (${z(MODAL)}) sits above sheet (${z(SHEET)})`, z(MODAL) > z(SHEET));
const routerSrc = fs.readFileSync(path.join(uiJs, 'router.js'), 'utf8');
const loose = (/TOP_OVERLAYS:\s*\[([^\]]*)\]/.exec(routerSrc) || [])[1];
check('  Router.TOP_OVERLAYS is still the list of loose overlays', !!loose);
// map each id the back button knows about to the class that styles it
const LOOSE = {
    artLightbox: '.veh-lightbox', ssOverlay: '.ss-overlay', helpOverlay: '.help-overlay',
    setOverlay: '.set-overlay', cxOverlay: '.cx-overlay',
};
for (const id of Object.keys(LOOSE)) {
    check(`  ${id} is in TOP_OVERLAYS`, loose.indexOf(id) >= 0);
    const sel = LOOSE[id];
    check(`  ${id} (${sel} at ${z(sel)}) sits above the modal (${z(MODAL)})`, z(sel) > z(MODAL));
}
// .sbx-overlay is styled like the others but opened only from Sandbox, which has no back entry
check(`  .sbx-overlay (${z('.sbx-overlay')}) is above the modal too`, z('.sbx-overlay') > z(MODAL));

console.log('\n-- toasts are above everything, so a confirmation is never hidden --');
const toasts = Object.keys(Z).filter(s => /-toast$/.test(s));
const ceiling = Math.max(z(MODAL), ...Object.keys(LOOSE).map(k => z(LOOSE[k])), z('.sbx-overlay'));
check(`  found the toasts (${toasts.join(', ')})`, toasts.length >= 3);
for (const t of toasts) check(`  ${t} (${z(t)}) is above everything else (${ceiling})`, z(t) >= ceiling);

// ---- a printout, because the numbers are easier to review than to reason about ---------------
console.log('\n-- the ladder as it stands --');
Object.keys(Z).sort((a, b) => z(a) - z(b) || a.localeCompare(b))
    .filter(s => z(s) >= 20)
    .forEach(s => console.log(`   ${String(z(s)).padStart(4)}  ${s.padEnd(18)} ${Z[s].file}`));

console.log(failed ? '\n*** FAIL ***' : '\nAll stacking-order checks passed.');
process.exitCode = failed ? 1 : 0;
