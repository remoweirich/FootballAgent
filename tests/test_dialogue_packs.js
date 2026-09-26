// Every locale that ships a dialogue pack (js/dialogue-data-<loc>.js) must cover the whole
// workbook and keep every {placeholder} the English line has — a dropped one loses information,
// an invented one renders literal braces in the chat. Generic over locales, so adding a language
// is gated without writing a new test.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
// Locales and the engine file list are both derived from I18n.LANGS plus what is on disk, so the
// next language is gated without touching this file.
const errors = [];
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.map(String).join(' ')) },
    setTimeout: fn => { fn(); return 0; }, clearTimeout() {},
    Math, Date, JSON,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
};
sb.window = sb;
vm.createContext(sb);
const load = f => vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
load('i18n.js');
const LANGS = JSON.parse(vm.runInContext('JSON.stringify(I18n.LANGS.map(function(l){return l.code;}))', sb));
for (const c of LANGS) load('i18n-' + c + '.js');
for (const f of ['storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js',
    'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js', 'agency.js',
    'simulation.js', 'live-sim-data.js', 'live-sim.js', 'attend.js', 'dialogue-data.js']) load(f);
// Locales shipping a dialogue pack: the file's presence on disk is the source of truth.
const LOCALES = LANGS.filter(c => c !== 'en' && fs.existsSync(path.join(root, 'js', 'dialogue-data-' + c + '.js')));
for (const c of LOCALES) load('dialogue-data-' + c + '.js');
load('dialogue.js');
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// English oracles: the workbook itself, plus the two tables that live in dialogue.js.
const EN_LINES = JSON.parse(run(`
  const out={};
  for(const s of ['complaint','gifts','final','farewell','checkin','moments'])
    for(const r of DIALOGUE_DATA[s]) out[r.id]=r.text;
  return JSON.stringify(out);
`));
const EN_CHOICES = JSON.parse(run(`return JSON.stringify((DIALOGUE_DATA.choices||[]).map(c=>c.scene+'|'+c.choice));`));
const EN_SAY = JSON.parse(run(`return JSON.stringify(Object.keys(Dialogue.SAY));`));
const ids = Object.keys(EN_LINES);
const ph = s => [...new Set(String(s).match(/\{[a-zA-Z0-9_]+\}/g) || [])].sort().join(',');

check(`workbook has lines to translate (${ids.length} ids, ${EN_CHOICES.length} choices, ${EN_SAY.length} say)`,
    ids.length > 200 && EN_CHOICES.length > 20 && EN_SAY.length > 20);

for (const loc of LOCALES) {
    const pack = JSON.parse(run(`
      I18n.locale='${loc}'; const p=Dialogue._pack(); I18n.locale='en';
      return JSON.stringify(p || null);
    `));
    check(`${loc}: _pack() resolves the pack for this locale`, !!pack);
    if (!pack) continue;

    const missing = ids.filter(i => !(pack.lines || {})[i]);
    check(`${loc}: covers all ${ids.length} workbook lines` + (missing.length ? ` — missing ${missing.length}: ${missing.slice(0, 6).join(' ')}` : ''), missing.length === 0);

    const extra = Object.keys(pack.lines || {}).filter(i => !(i in EN_LINES));
    check(`${loc}: no line ids that are not in the workbook` + (extra.length ? ` — ${extra.slice(0, 6).join(' ')}` : ''), extra.length === 0);

    const phBad = ids.filter(i => (pack.lines || {})[i] && ph(EN_LINES[i]) !== ph(pack.lines[i]));
    check(`${loc}: every line keeps the English {placeholders}` + (phBad.length ? ` — ${phBad.slice(0, 6).join(' ')}` : ''), phBad.length === 0);

    const cMiss = EN_CHOICES.filter(k => !(pack.choices || {})[k]);
    check(`${loc}: every choice button is translated` + (cMiss.length ? ` — missing ${cMiss.slice(0, 4).join(' | ')}` : ''), cMiss.length === 0);
    const cNoLabel = Object.keys(pack.choices || {}).filter(k => !pack.choices[k].label);
    check(`${loc}: no choice entry is missing its label`, cNoLabel.length === 0);

    const sMiss = EN_SAY.filter(k => !(pack.say || {})[k]);
    check(`${loc}: every agent spoken line is translated` + (sMiss.length ? ` — missing ${sMiss.slice(0, 4).join(' | ')}` : ''), sMiss.length === 0);

    // The promise and bonus sub-choices are assembled in the UI, which used to read Dialogue.SAY
    // directly and so spoke English in every locale. sayFor() is the one localised accessor.
    check(`${loc}: sayFor() reaches the pack for the UI-built promise and bonus lines`, run(`
      I18n.locale='${loc}';
      const keys=['promise:move','promise:newContract','promise:playingTime','promise:renegotiateRep',
                  'bonus:small','bonus:medium','bonus:large'];
      const bad=keys.filter(k=>Dialogue.sayFor(k)!==Dialogue._packFor('${loc}').say[k]);
      I18n.locale='en';
      const en=keys.filter(k=>Dialogue.sayFor(k)!==Dialogue.SAY[k]);
      return bad.length===0 && en.length===0;
    `));

    check(`${loc}: ambitions, milestones and the cash gift are all present`,
        !!(pack.amb && pack.amb.types && Object.keys(pack.amb.types).length >= 9
            && pack.amb.dflt && pack.amb.favFallback && pack.amb.leagueFallback && pack.amb.clubFallback
            && pack.mile && pack.mile.apps && pack.mile.goals && pack.envelope));

    // behaviour, not just data: the engine must actually pick the pack up, and drop back to English.
    check(`${loc}: _locTxt returns the translation, and English under 'en'`, run(`
      const row={id:'C001',text:DIALOGUE_DATA.complaint.find(r=>r.id==='C001').text};
      I18n.locale='${loc}'; const a=Dialogue._locTxt(row);
      I18n.locale='en';    const b=Dialogue._locTxt(row);
      return a!==b && b===row.text && a===Dialogue._packFor('${loc}').lines.C001;
    `));

    check(`${loc}: an unknown line id still falls back to the English workbook text`, run(`
      I18n.locale='${loc}'; const out=Dialogue._locTxt({id:'ZZZ999',text:'fallback text'}); I18n.locale='en';
      return out==='fallback text';
    `));

    check(`${loc}: milestone labels interpolate {n}`, run(`
      I18n.locale='${loc}'; const a=Dialogue._mileText('apps',250), b=Dialogue._mileText('goals',100); I18n.locale='en';
      return /250/.test(a) && /100/.test(b) && !/\\{n\\}/.test(a) && !/\\{n\\}/.test(b);
    `));

    // ambitionText builds from amb.types and must not leave a token behind on screen.
    check(`${loc}: every ambition type renders with no {token} left`, run(`
      I18n.locale='${loc}';
      const pk=Dialogue._packFor('${loc}'), bad=[];
      for(const t of Object.keys(pk.amb.types)){
        const p={name:'Test',age:24,position:'ST',facts:{home:'England',
          favClub:{clubId:null,discovered:true},family:{status:'single',discovered:true},
          hobby:{name:'golf',discovered:true},ambition:{type:t,target:100,discovered:true}}};
        const out=Dialogue.ambitionText(p);
        if(!out || /\\{\\w+\\}/.test(out)) bad.push(t+' -> '+out);
      }
      I18n.locale='en';
      if(bad.length) console.error('${loc} ambition: '+bad.join('; '));
      return bad.length===0;
    `));

    check(`${loc}: the client's form of address is translated`, run(`
      I18n.locale='${loc}';
      const mr=I18n.t('dlg.addr.mr',{surname:'Mercer'}), dear=I18n.t('dlg.addr.dear',{name:'Alex Mercer'});
      I18n.locale='en';
      return mr!=='Mr Mercer' && dear!=='Dear Alex Mercer' && /Mercer/.test(mr) && !/\\{/.test(mr+dear);
    `));

    // Discovered vocabulary is stored in English and localised at fill() time. Every entry must
    // render as the pack spells it, and at least one must actually differ from its English key —
    // proving the swap fires. Requiring a SPECIFIC word to differ would fail a correct pack:
    // Dutch 'golf' is "golf".
    check(`${loc}: discovered vocabulary is localised when a line is filled`, run(`
      const p={name:'Test',age:24,position:'ST',clubId:null,facts:{home:'England',
        favClub:{clubId:null,discovered:true},family:{status:'single',discovered:true},
        hobby:{name:'golf',discovered:true},ambition:{type:'title',discovered:true}}};
      const vocab=Dialogue._packFor('${loc}').vocab;
      let swapped=0;
      for(const en of Object.keys(vocab)){
        I18n.locale='${loc}'; const out=Dialogue.fill('... {v} ...',p,{v:en});
        I18n.locale='en';    const enOut=Dialogue.fill('... {v} ...',p,{v:en});
        if(out.indexOf(vocab[en])<0 || enOut.indexOf(en)<0){ I18n.locale='en'; return false; }
        if(out!==enOut) swapped++;
      }
      I18n.locale='en';
      return swapped>0;
    `));
}

check('no engine errors, got: ' + JSON.stringify(errors.slice(0, 2)), errors.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll dialogue pack checks passed.');
process.exitCode = failed ? 1 : 0;
