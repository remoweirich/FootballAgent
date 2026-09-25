// Every shipped locale must match English key-for-key, in BOTH the engine pack (js/i18n-*.js)
// and the UI pack (ui/js/i18n-*.js). A missing key silently falls back to English, so the only
// way to notice a gap is to assert it here. Also guards the things a translator can break
// without the game crashing: {placeholders}, inline HTML, and newline counts.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// Load a pack file in isolation and return what it registered.
function load(rel) {
  const sb = { console: { log() {}, warn() {}, error() {} }, Math, Date, JSON };
  sb.window = sb;
  const out = {};
  sb.I18n = { register(loc, obj) { Object.assign(out, obj); }, LANGS: [], locale: 'en', t: k => k };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), sb, { filename: rel });
  return out;
}

// Which locales ship? Read LANGS rather than hardcoding, so a new language is gated automatically.
const langSb = { console: { log() {} }, Math, Date, JSON }; langSb.window = langSb;
vm.createContext(langSb);
vm.runInContext(fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8'), langSb, { filename: 'i18n.js' });
const codes = JSON.parse(vm.runInContext('JSON.stringify(I18n.LANGS.map(function(l){return l.code;}))', langSb));
check('LANGS lists en, de and es', ['en', 'de', 'es'].every(c => codes.includes(c)));

// Repeated placeholders are equivalent to one, so compare SETS.
const ph = s => [...new Set(String(s).match(/\{[a-zA-Z0-9_]+\}/g) || [])].sort().join(',');
// Keys where a locale may legitimately differ from English on placeholders:
//  - ach.league       : achievements.js supplies BOTH {ord} and {n}, so each language picks what reads well.
//  - setup.genderHint : called with NO vars — the braces are illustrative text shown to the player,
//                       so each language spells them in its own words ({surname} / {Nachname} / {apellido}).
//  - nego.loanRole.final : German drops the player's name; the sentence still reads correctly.
const PH_EXEMPT = new Set(['ach.league', 'setup.genderHint', 'nego.loanRole.final']);
// Keys that deliberately stay English-only, served by the fallback. 'settings.version' is a
// product name plus a version number: nothing to translate, and duplicating it across packs
// just means a version bump can go stale in two languages.
const EN_ONLY = new Set(['settings.version']);
const tags = s => (String(s).match(/<\/?[a-zA-Z][a-zA-Z0-9]*/g) || []).map(t => t.toLowerCase()).sort().join(',');
const nl = s => (String(s).match(/\n/g) || []).length;

for (const dir of ['js', 'ui/js']) {
  const EN = load(dir + '/i18n-en.js');
  const enK = Object.keys(EN);
  check(`${dir}: English pack is non-empty (${enK.length} keys)`, enK.length > 100);

  for (const code of codes.filter(c => c !== 'en')) {
    const rel = dir + '/i18n-' + code + '.js';
    if (!fs.existsSync(path.join(root, rel))) { check(`${rel} exists`, false); continue; }
    const L = load(rel);

    const missing = enK.filter(k => !(k in L) && !EN_ONLY.has(k));
    const extra = Object.keys(L).filter(k => !(k in EN));
    check(`${rel}: covers all ${enK.length} English keys` +
      (missing.length ? ` — missing ${missing.length}: ${missing.slice(0, 6).join(', ')}` : ''), missing.length === 0);
    check(`${rel}: no keys that do not exist in English (typos)` +
      (extra.length ? ` — ${extra.slice(0, 6).join(', ')}` : ''), extra.length === 0);

    const phBad = [], tagBad = [], nlBad = [];
    for (const k of enK) {
      const e = EN[k], s = L[k];
      if (typeof e !== 'string' || typeof s !== 'string') continue;
      if (ph(e) !== ph(s) && !PH_EXEMPT.has(k)) phBad.push(k);
      if (tags(e) !== tags(s)) tagBad.push(k);
      if (nl(e) !== nl(s)) nlBad.push(k);
    }
    check(`${rel}: same {placeholders} as English` + (phBad.length ? ` — ${phBad.slice(0, 6).join(', ')}` : ''), phBad.length === 0);
    check(`${rel}: same inline HTML as English` + (tagBad.length ? ` — ${tagBad.slice(0, 6).join(', ')}` : ''), tagBad.length === 0);
    check(`${rel}: same newline count as English` + (nlBad.length ? ` — ${nlBad.slice(0, 6).join(', ')}` : ''), nlBad.length === 0);
  }
}

if (failed) { console.error('i18n pack checks FAILED'); process.exit(1); }
console.log('All i18n pack checks passed.');
