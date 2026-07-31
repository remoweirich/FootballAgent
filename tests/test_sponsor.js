const vm=require('vm'),fs=require('fs'),path=require('path');
const base=require('path').join(__dirname, '..', 'js') + '/';
const files=['i18n.js','i18n-en.js','i18n-de.js','storage.js','rng.js','names-data.js','clubs.js','players.js','game-state.js','upgrades.js','scouting.js','league.js','scouts.js','agency.js','simulation.js'];
function idb(){return{open(){const r={result:null,onsuccess:null};setTimeout(()=>{r.result={objectStoreNames:{contains:()=>true},createObjectStore(){return{}},transaction(){return{objectStore:()=>({get(){return{}},put(){return{}},delete(){return{}}})}}};if(r.onsuccess)r.onsuccess()},0);return r}}}
const sb={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,Math,Date,JSON,indexedDB:idb(),localStorage:{getItem:()=>null,setItem(){},removeItem(){}},document:{addEventListener(){}},window:{addEventListener(){}},UI:{money:n=>String(Math.round(n||0))}};
vm.createContext(sb);
for(const f of files)vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),sb,{filename:f});
const run=c=>vm.runInContext(c,sb), runv=c=>vm.runInContext('(function(){'+c+'})()',sb);
let failed=false; const check=(l,c)=>{console.log((c?'PASS':'FAIL')+'  '+l); if(!c)failed=true;};
run("Clubs.init();");

const COUNTRIES={Netherlands:'NL',England:'EN',Germany:'DE',Spain:'ES',Switzerland:'CH',Italy:'IT',France:'FR'};

// ---- B: country routing of pickSponsor (national + worldwide have no tokens -> exact membership) ----
for(const [country,key] of Object.entries(COUNTRIES)){
  run(`GameState.startNewGame('${country}','T'); GameState.agency.upgrades.officeIndex=OFFICES.length-1;`);
  const natOk=runv(`const pool=SPONSOR_COMPANIES['${key}'].national; for(let i=0;i<40;i++){ if(!pool.includes(Upgrades.pickSponsor('national','${country}'))) return false;} return true;`);
  const wwOk=runv(`for(let i=0;i<20;i++){ if(!SPONSOR_WORLD.includes(Upgrades.pickSponsor('worldwide','${country}'))) return false;} return true;`);
  check(country+': national picks from its own roster', natOk);
  check(country+': worldwide picks from shared global brands', wwOk);
}

// ---- C: {place}/{region} fill from the RIGHT country ----
run("GameState.startNewGame('England','T');");
const engCities=new Set(runv("return Clubs.getClubsByCountry('England').map(c=>c.city)"));
const engFill=runv("return Upgrades._fill('Poundstretch {place}','England')").replace('Poundstretch ','');
check('England {place} filled with an English city: '+engFill, engCities.has(engFill));
// NB: backslashes must be doubled here so the regex survives into the vm string intact — the old
// single-backslash version silently became /s*(.*)$/, which blanked every region name to ''.
const frRegions=new Set(runv("return REGIONS_BY_COUNTRY['France'].map(r=>r.name.replace(/\\s*\\(.*\\)$/,''))"));
const frFill=runv("return Upgrades._fill('Radio {region}','France')").replace('Radio ','');
check('France {region} filled with a French region: '+frFill, frRegions.has(frFill));

// ---- A: tier-based level mapping works per country (office at top so nothing is capped) ----
run("Sim._seasonLeagueApps=function(){return 30;};");   // pretend a full season of games
function levelFor(country,divCode,ability,potential,age){
  return runv(`GameState.startNewGame('${country}','T'); GameState.agency.upgrades.officeIndex=OFFICES.length-1; Sim._seasonLeagueApps=function(){return 30;};
    const club=Clubs.getClubsByDivision('${divCode}')[0];
    return Sim._sponsorLevelFor({clubId:club.id, ability:${ability}, potential:${potential}, age:${age}});`);
}
check('EN PREM ability85 -> international', levelFor('England','PREM',85,60,27)==='international');
check('EN PREM ability70 -> national', levelFor('England','PREM',70,60,27)==='national');
check('EN CHAMP apps30 -> national', levelFor('England','CHAMP',70,60,27)==='national');
check('EN LEAGUE1 apps30 -> regional', levelFor('England','LEAGUE1',65,60,27)==='regional');
check('EN Natleague apps30 -> local', levelFor('England','Natleague',60,55,27)==='local');
check('DE 3.Liga apps30 -> regional', levelFor('Germany','3LIGA',65,60,27)==='regional');
check('DE Regionalliga3(t6) apps30 -> local', levelFor('Germany','REGIONAL3',60,55,27)==='local');
check('FR Ligue1 star90 -> worldwide', levelFor('France','Ligue1',90,60,27)==='worldwide');
check('IT SerieC youth(pot80,age20) -> national (talent)', levelFor('Italy','SerieC',62,80,20)==='national');

// ---- D: office cap actually clips the level (fresh Home Office -> local only) ----
const capped=runv(`GameState.startNewGame('England','T'); Sim._seasonLeagueApps=function(){return 30;};
  const club=Clubs.getClubsByDivision('PREM')[0];
  return Sim._sponsorLevelFor({clubId:club.id, ability:85, potential:60, age:27});`);
check('fresh Home Office caps a PREM star down to local: '+capped, capped==='local');

console.log(failed?'\n*** FAIL ***':'\nAll sponsor checks passed.');
process.exitCode=failed?1:0;
