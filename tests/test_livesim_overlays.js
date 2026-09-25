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
const ENGINE = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'i18n-es.js', 'rng.js',
    'live-sim-data.js', 'live-sim-data-de.js', 'live-sim-data-es.js', 'live-sim.js'];
for (const f of ENGINE) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

const locales = run('return JSON.stringify(LiveSim.OVERLAY_LOCALES);');
check('OVERLAY_LOCALES lists de and es (' + locales + ')', locales === '["de","es"]');

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

    check(loc + ': the engine-built lines are translated, not English', run(`
      I18n.locale='${loc}';
      const plain=LiveSim._plainLine('GOAL',{name:'García'},'Sevilla');
      const goal=I18n.t('ls.goalAnon',{team:'Sevilla'});
      const corner=I18n.t('ls.cornerAnon',{team:'Sevilla'});
      I18n.locale='en';
      const enPlain=LiveSim._plainLine('GOAL',{name:'García'},'Sevilla');
      return plain!==enPlain && goal!=='GOAL — Sevilla' && corner!=='Corner — Sevilla';
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
