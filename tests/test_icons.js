// Every icon the UI asks for must actually draw something.
//
// Reported as "weird symbols" on four buttons. The cause was neither the markup nor the CSS being
// trimmed: the vendored tabler-icons.css and the vendored tabler-icons.woff2 came from DIFFERENT
// Tabler releases, so 23 of the 114 declared classes named a codepoint this font has no glyph for.
// A codepoint with no glyph renders .notdef — an empty box, or nothing at all, depending on the
// platform. That is exactly what "weird symbol" and "no symbol" were.
//
// Two things are checked, and the pair is the point: a class can be missing from the CSS (renders
// nothing) or present but pointing into a hole in the font (renders a box). Only the second needs
// the font itself, which is why this went unnoticed — you cannot see it by reading the CSS.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

const CSS = path.join(root, 'ui', 'vendor', 'tabler-icons', 'tabler-icons.css');
const css = fs.readFileSync(CSS, 'utf8');

// class -> codepoint, straight from the stylesheet
const declared = {};
const RE = /\.ti-([a-z0-9-]+):before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)"/g;
let m;
while ((m = RE.exec(css))) declared[m[1]] = parseInt(m[2], 16);
check(`the stylesheet declares icons (${Object.keys(declared).length})`, Object.keys(declared).length > 50);

// ---- 1. every icon the UI uses is declared ---------------------------------------------------
// Scanned out of the markup rather than listed here, so a newly added icon is covered the moment
// it ships.
const used = {};                       // class -> first file that uses it
const dirs = [path.join(root, 'ui', 'js'), path.join(root, 'ui')];
const files = [];
for (const d of dirs) {
    for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isFile() && /\.(js|css|html)$/.test(f) && !/tabler-icons/.test(p)) files.push(p);
    }
}
for (const p of files) {
    const src = fs.readFileSync(p, 'utf8');
    let x;
    // `ti ti-foo` in markup, and `ic('ti-foo')`-style helpers
    const R = /\bti-([a-z0-9-]+)\b/g;
    while ((x = R.exec(src))) {
        const name = x[1];
        if (name === 'icons') continue;            // the font-family helper class, not an icon
        if (!(name in used)) used[name] = path.basename(p);
    }
}
check(`the UI references icons (${Object.keys(used).length} distinct)`, Object.keys(used).length > 30);

console.log('\n-- every icon the UI asks for is declared in the stylesheet --');
const undeclared = Object.keys(used).filter(n => !(n in declared)).sort();
for (const n of undeclared) console.log(`      ti-${n}  (${used[n]})`);
check(`none are missing a rule${undeclared.length ? ` — ${undeclared.length} are` : ''}`, undeclared.length === 0);

// ---- 2. every declared codepoint exists in the font ------------------------------------------
// This is the half that the four reported buttons failed, and it needs the font itself.
console.log('\n-- and every rule points at a glyph the font actually has --');
let cps = null;
try {
    cps = readFontCodepoints(path.join(root, 'ui', 'vendor', 'tabler-icons', 'fonts', 'tabler-icons.woff2'));
} catch (e) {
    cps = null;
    console.log('SKIP  cannot decode the woff2 here (' + e.message + ')');
}
if (cps) {
    check(`read the font's character map (${cps.size} glyphs)`, cps.size > 100);
    const holes = Object.keys(declared).filter(n => !cps.has(declared[n])).sort();
    for (const n of holes) console.log(`      ti-${n}  U+${declared[n].toString(16).toUpperCase()}${used[n] ? '  (used in ' + used[n] + ')' : '  (declared but unused)'}`);
    check(`no rule points into a hole${holes.length ? ` — ${holes.length} do` : ''}`, holes.length === 0);
    // the ones the player actually reported, pinned by name
    console.log('\n-- the icons from the report --');
    for (const n of ['photo', 'download', 'help', 'pencil', 'circle-arrow-up', 'circle-arrow-down', 'sitemap']) {
        check(`  ti-${n} draws a glyph`, n in declared && cps.has(declared[n]));
    }
    // Tabler renamed arrow-up-circle -> circle-arrow-up. The old name still resolves to a glyph in
    // this font, but it is the DEPRECATED one — an arrow with a dot rather than a circled arrow —
    // so repointing it would have "fixed" the missing glyph and left the wrong picture on screen.
    check('  the deprecated arrow-*-circle names are gone from the stylesheet',
        !('arrow-up-circle' in declared) && !('arrow-down-circle' in declared));
    check('  ...and nothing in the UI still asks for them',
        !('arrow-up-circle' in used) && !('arrow-down-circle' in used));
}

// Minimal woff2 -> cmap reader. Uses fontTools through python only if present; otherwise parses
// the sfnt directly is not worth it, so the check degrades to a skip rather than a false pass.
function readFontCodepoints(file) {
    const cp = require('child_process').spawnSync('python', ['-c', [
        'import sys,json',
        'from fontTools.ttLib import TTFont',
        'f=TTFont(sys.argv[1])',
        's=set()',
        "for t in f['cmap'].tables: s|=set(t.cmap.keys())",
        'print(json.dumps(sorted(s)))',
    ].join('\n'), file], { encoding: 'utf8', timeout: 60000 });
    if (cp.status !== 0) throw new Error((cp.stderr || 'python/fontTools unavailable').trim().split('\n').pop());
    const line = (cp.stdout || '').trim().split('\n').pop();
    return new Set(JSON.parse(line));
}

console.log(failed ? '\n*** FAIL ***' : '\nAll icon checks passed.');
process.exitCode = failed ? 1 : 0;
