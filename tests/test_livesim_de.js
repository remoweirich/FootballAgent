// Live-sim German overlay: coverage, placeholder safety, and the engine-built feed lines.
// The English path is covered by test_livesim.js (which loads no i18n, so deOn() is false).
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';
const errs = [];
const sb = { console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) }, Math, Date, JSON };
sb.window = sb;
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'rng.js', 'live-sim-data.js', 'live-sim-data-de.js', 'live-sim.js'])
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false; const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---------------- overlay presence + coverage ----------------
check('overlay: LIVE_SIM_DE is loaded', run(`return typeof LIVE_SIM_DE === 'object' && !!LIVE_SIM_DE;`));
check('overlay: every shipped piece has a German translation (no gaps)', run(`
  LiveSim.init();
  const missing=[];
  for(const g of ['start','middle','end']) LiveSim._idx[g].forEach((p,i)=>{ if(!p.de) missing.push(g+'['+i+']'); });
  if(missing.length) console.error('missing German: '+missing.slice(0,8).join(', '));
  return missing.length===0;
`));

// ---------------- locale switch ----------------
check('locale: deOn() is true for de, false for en', run(`
  I18n.locale='de'; const a=LiveSim._deOn();
  I18n.locale='en'; const b=LiveSim._deOn();
  I18n.locale='de'; return a===true && b===false;
`));
check('render: German is used under de and English under en, for the same piece', run(`
  LiveSim.init(); const p=LiveSim._idx.start[0]; const pl={name:'Müller'}; const ctx={teamName:'Basel',oppName:'Zürich'};
  I18n.locale='de'; const de=LiveSim.renderPiece(p,pl,ctx);
  I18n.locale='en'; const en=LiveSim.renderPiece(p,pl,ctx);
  I18n.locale='de'; return de===p.de.split('XY').join('Müller') && en!==de && /Müller/.test(de);
`));

// ---------------- placeholder safety (the critical invariant) ----------------
check('placeholders: NO piece leaks XY / xy(...) / yx(...) when rendered in German', run(`
  I18n.locale='de'; LiveSim.init();
  const pl={name:'Müller'}, ctx={teamName:'Basel',oppName:'Zürich'};
  for(const g of ['start','middle','end']) for(const p of LiveSim._idx[g]){
    const out=LiveSim.renderPiece(p,pl,ctx);
    if(/\\bXY\\b/.test(out) || /xy\\s*\\(|yx\\s*\\(/.test(out)) { console.error('leak: '+out.slice(0,80)); return false; }
  }
  return true;
`));
check('placeholders: team + opponent tokens substitute in German (start[2] is a corner-for line)', run(`
  I18n.locale='de'; LiveSim.init();
  const out=LiveSim.renderPiece(LiveSim._idx.start[2],{name:'Müller'},{teamName:'FC Basel',oppName:'FC Zürich'});
  return out.includes('FC Basel') && !/xy\\s*\\(/.test(out);
`));

// ---------------- engine-built feed lines (not data pieces) ----------------
check('engine: _plainLine is German under de, English under en', run(`
  const p={name:'Müller'};
  I18n.locale='de'; const de=LiveSim._plainLine('GOAL',p,'Basel');
  I18n.locale='en'; const en=LiveSim._plainLine('GOAL',p,'Basel');
  I18n.locale='de'; return de==='Tor: Müller (Basel)' && en==='GOAL — Müller (Basel)';
`));
check('engine: a red card fallback label translates', run(`
  I18n.locale='de'; return LiveSim._plainLine('RC',{name:'Müller'},'Basel')==='Rote Karte: Müller (Basel)';
`));
check('engine: corner-follow lines come from the German pool under de', run(`
  I18n.locale='de';
  let n=0; for(let i=0;i<60;i++){ const f=LiveSim._cornerFollow('home',Math.random); if(LiveSim.CORNER_FOLLOW_LINES_DE.includes(f.lines[0])) n++; }
  return n===60;
`));
check('engine: anonymous goal + corner ticks read German under de, English under en', run(`
  const mk=(id,name,pos,role)=>({id,name,position:pos,styleRole:role});
  const C=mk('c','Frei','CB','aerial_dominator');
  const spec=o=>Object.assign({homeName:'FC Basel',awayName:'FC Zürich',hg:0,ag:0,minutes:90,clients:[]},o);
  const scan=(loc)=>{ I18n.locale=loc; let deTick=false,enTick=false;
    for(let i=0;i<120;i++){ const t=LiveSim.buildTimeline(spec({hg:3,ag:2,clients:[{player:C,side:'home',goals:0,assists:0}]}));
      for(const e of t.events) for(const l of e.lines||[]){
        if(/^Tor für |^Ecke für /.test(l)) deTick=true;
        if(/^GOAL — |^Corner — /.test(l)) enTick=true;
      } }
    return {deTick,enTick}; };
  const de=scan('de'), en=scan('en'); I18n.locale='de';
  return de.deTick && !de.enTick && en.enTick && !en.deTick;
`));
check('engine: a full German timeline never leaks a raw placeholder in any line', run(`
  const mk=(id,name,pos,role)=>({id,name,position:pos,styleRole:role});
  const B=mk('b','Riva','ST','poacher'), A=mk('a','Meier','LW','winger');
  const spec=o=>Object.assign({homeName:'FC Basel',awayName:'FC Zürich',hg:0,ag:0,minutes:90,clients:[]},o);
  I18n.locale='de';
  for(let i=0;i<200;i++){
    const t=LiveSim.buildTimeline(spec({hg:2,ag:1,clients:[{player:B,side:'home',goals:1,assists:0},{player:A,side:'away',goals:1,assists:0,yellow:1}]}));
    for(const e of t.events) for(const l of e.lines||[])
      if(/\\bXY\\b/.test(l) || /xy\\s*\\(|yx\\s*\\(/.test(l)) { console.error('timeline leak: '+l.slice(0,80)); return false; }
  }
  return true;
`));

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll live-sim German checks passed.');
process.exitCode = failed ? 1 : 0;
