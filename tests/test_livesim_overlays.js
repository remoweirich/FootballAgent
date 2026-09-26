// Every locale that ships a live-sim commentary overlay (LiveSim.OVERLAY_LOCALES) must cover the
// whole workbook and must never leak a raw placeholder on screen. test_livesim_de.js additionally
// pins the exact German wording; this file is the generic gate, so adding a language is covered
// without writing a new test.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const errs = [];
const sb = { console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) }, Math, Date, JSON };
sb.window = sb;
vm.createContext(sb);
// Derived from I18n.LANGS rather than hardcoded, so a new language is picked up without a test edit.
const load = f => vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
load('i18n.js');
const LANGS = JSON.parse(vm.runInContext('JSON.stringify(I18n.LANGS.map(function(l){return l.code;}))', sb));
for (const c of LANGS) load('i18n-' + c + '.js');
load('rng.js');
load('live-sim-data.js');
// Locales shipping a commentary overlay: the file's presence on disk is the source of truth.
const SHIPPED = LANGS.filter(c => c !== 'en' && fs.existsSync(path.join(root, 'js', 'live-sim-data-' + c + '.js')));
for (const c of SHIPPED) load('live-sim-data-' + c + '.js');
load('live-sim.js');
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

const locales = run('return JSON.stringify(LiveSim.OVERLAY_LOCALES);');
check('OVERLAY_LOCALES lists every locale with an overlay file on disk (' + locales + ')',
    locales === JSON.stringify(SHIPPED));

for (const loc of JSON.parse(locales)) {
    check(loc + ': the overlay file is loaded and non-empty', run(`
      const o = LiveSim._overlayFor('${loc}');
      return !!o && Object.keys(o).length > 100;
    `));

    check(loc + ': every shipped piece has a translation (no gaps)', run(`
      LiveSim.init();
      const missing=[];
      for(const g of ['start','middle','end']) LiveSim._idx[g].forEach((p,i)=>{
        if(!(p.tr && p.tr['${loc}'])) missing.push(g+'['+i+']');
      });
      if(missing.length) console.error('${loc} missing: '+missing.slice(0,8).join(', '));
      return missing.length===0;
    `));

    // The invariant that actually shows on screen: the engine substitutes names and teams off the
    // ENGLISH text, so a translation that drops (or invents) a token renders a literal "XY".
    check(loc + ': no piece leaks XY / xy(...) / yx(...) once rendered', run(`
      I18n.locale='${loc}'; LiveSim.init();
      const pl={name:'García'}, ctx={teamName:'Sevilla',oppName:'Betis'};
      for(const g of ['start','middle','end']) for(const p of LiveSim._idx[g]){
        const out=LiveSim.renderPiece(p,pl,ctx);
        if(/\\bXY\\b/.test(out) || /xy\\s*\\(|yx\\s*\\(/.test(out)){ console.error('${loc} leak: '+out.slice(0,90)); I18n.locale='en'; return false; }
      }
      I18n.locale='en'; return true;
    `));

    check(loc + ': a piece naming the client renders that name, not the English text', run(`
      I18n.locale='${loc}'; LiveSim.init();
      const p=LiveSim._idx.start[0];
      const out=LiveSim.renderPiece(p,{name:'García'},{teamName:'Sevilla',oppName:'Betis'});
      const en=LiveSim.renderPiece({text:p.text,tr:null,names:p.names},{name:'García'},{teamName:'Sevilla',oppName:'Betis'});
      I18n.locale='en';
      return /García/.test(out) && out!==en;
    `));

    // Compare against what the ENGLISH pack actually returns, not a hardcoded literal, and only
    // require the lines whose wording cannot legitimately coincide with English. 'ls.cornerAnon' is
    // excluded on purpose: French says "corner" too, so an identical string there is correct.
    // Only the card labels are compared against English: 'GOAL', 'Corner' and 'Assist' are the real
    // Dutch words and 'Corner' the real French one, so requiring those to differ fails a correct pack.
    // What matters is that _plainLine renders the LOCALE's label, which the RC/YC pair proves.
    check(loc + ': the engine-built lines are translated, not English', run(`
      I18n.locale='${loc}';
      const rc=I18n.t('ls.what.RC'), yc=I18n.t('ls.what.YC');
      const plain=LiveSim._plainLine('RC',{name:'García'},'Sevilla');
      I18n.locale='en';
      const enRc=I18n.t('ls.what.RC'), enYc=I18n.t('ls.what.YC');
      return rc!==enRc && yc!==enYc && plain.indexOf(rc)===0 && plain.indexOf(enRc)!==0;
    `));

    // A full timeline exercises the chain builder, the corner/penalty paths and the fallbacks.
    check(loc + ': a full timeline never leaks a raw placeholder in any line', run(`
      I18n.locale='${loc}';
      const C={id:'c',name:'García',position:'ST',styleRole:'poacher'};
      const spec=o=>Object.assign({homeName:'Sevilla',awayName:'Betis',hg:0,ag:0,minutes:90,clients:[]},o);
      for(let i=0;i<40;i++){
        const t=LiveSim.buildTimeline(spec({hg:3,ag:2,clients:[{player:C,side:'home',goals:1,assists:1}]}));
        for(const e of t.events) for(const l of e.lines||[])
          if(/\\bXY\\b/.test(l) || /xy\\s*\\(|yx\\s*\\(/.test(l)){ console.error('${loc} timeline leak: '+l.slice(0,90)); I18n.locale='en'; return false; }
      }
      I18n.locale='en'; return true;
    `));
}

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll live-sim overlay checks passed.');
process.exitCode = failed ? 1 : 0;
