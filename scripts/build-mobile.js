// Assembles dist/mobile/ — the offline, mobile-UI-only bundle used to build the
// Android APK. Pulls in only what the mobile UI actually loads (see the <script>
// list in ui/index.html): the shared engine files, the mobile screens/router/shim,
// the three CSS files, and the self-hosted font/icon vendor assets. The old
// desktop UI has been severed into legacy-desktop/ (see its README) and has no
// path into this bundle.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'mobile');

const ENGINE_FILES = [
    'rng.js',
    'names-data.js', 'clubs.js', 'players.js', 'storage.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js', 'injuries-data.js', 'simulation.js',
    'live-sim-data.js', 'live-sim.js', 'attend.js', 'dialogue-data.js', 'dialogue.js'
];
const UI_JS_FILES = [
    'shim.js', 'ui-helpers.js', 'router.js',
    'screen-start.js', 'screen-settings.js',
    'screen-setup.js', 'screen-home.js', 'screen-clients.js', 'screen-club.js',
    'screen-client-detail.js', 'screen-negotiations.js', 'screen-agency.js', 'screen-bestxi.js',
    'screen-finance.js', 'screen-leagues.js', 'screen-scouting.js', 'screen-livesim.js', 'screen-dialogue.js', 'main.js'
];
const CSS_FILES = ['files/design-tokens.css', 'files/components.css', 'app.css'];
const VENDOR_DIRS = ['inter', 'tabler-icons', 'flag-icons'];

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function copy(src, dest) { mkdirp(path.dirname(dest)); fs.copyFileSync(src, dest); }
function copyDir(src, dest) {
    mkdirp(dest);
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else copy(s, d);
    }
}

function build() {
    rmrf(OUT);
    mkdirp(OUT);

    for (const f of ENGINE_FILES) copy(path.join(ROOT, 'js', f), path.join(OUT, 'engine', f));
    for (const f of UI_JS_FILES) copy(path.join(ROOT, 'ui', 'js', f), path.join(OUT, 'js', f));
    for (const f of CSS_FILES) copy(path.join(ROOT, 'ui', f), path.join(OUT, f));
    for (const d of VENDOR_DIRS) copyDir(path.join(ROOT, 'ui', 'vendor', d), path.join(OUT, 'vendor', d));

    let html = fs.readFileSync(path.join(ROOT, 'ui', 'index.html'), 'utf8');
    // ui/index.html loads the engine via "../js/x.js" (relative to ui/, i.e. the
    // repo root's js/ dir); in the bundle the engine lives at "engine/x.js" instead.
    for (const f of ENGINE_FILES) html = html.split(`../js/${f}`).join(`engine/${f}`);
    fs.writeFileSync(path.join(OUT, 'index.html'), html);

    console.log('dist/mobile/ built:', fs.readdirSync(OUT).join(', '));
}

build();
