// Achievements engine: unlock evaluation, collect/banking, trophy-tier classification, tallies.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\Jens\\Documents\\fussball-agent-app\\FootballAgent\\js\\';
const files = ['i18n.js', 'i18n-en.js', 'i18n-de.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js', 'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'scouts.js', 'agency.js', 'achievements.js', 'simulation.js'];
function makeFakeIDB() { return { open() { const req = { result: null, onsuccess: null }; setTimeout(() => { req.result = { objectStoreNames: { contains: () => true }, createObjectStore() { return {}; }, transaction() { return { objectStore: () => ({ get() { return {}; }, put() { return {}; }, delete() { return {}; } }) }; } }; if (req.onsuccess) req.onsuccess(); }, 0); return req; } }; }
const sb = { console: { log: () => { }, warn: () => { }, error: () => { } }, setTimeout, clearTimeout, Math, Date, JSON, indexedDB: makeFakeIDB(), localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, window: { addEventListener() { } }, UI: { money: n => String(n) } };
vm.createContext(sb);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
vm.runInContext('{ Storage.saveGame = () => {}; Storage.flush = async () => {}; }', sb);
const runv = code => vm.runInContext('(function(){' + code + '})()', sb);
let failed = false;
const check = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); if (!cond) failed = true; };

runv(`Clubs.init(); GameState.startNewGame('Netherlands', 'Ach');`);

// ================= 1. signings unlock + collect banks the reward =================
const t1 = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = PlayerGen.makePlayer(club, { ability: 70, age: 24, position: 'CM' });
    p.agentId = 'me'; p.everClient = true; p.clubId = club.id;
    GameState.players.push(p);
    const newly = Achievements.refresh();
    const unlockedSign1 = Achievements.isUnlocked('sign1');
    const balBefore = GameState.agency.balance;
    const r = Achievements.collect('sign1');
    return JSON.stringify({ unlockedSign1, collected: r.ok, reward: r.reward, gained: GameState.agency.balance - balBefore, doubleCollect: Achievements.collect('sign1').ok });
`));
check('signing a player unlocks "Sign 1 player"', t1.unlockedSign1 === true);
check('collecting banks the reward (€1000)', t1.collected && t1.reward === 1000 && t1.gained === 1000);
check('a reward can only be collected once', t1.doubleCollect === false);

// ================= 2. reputation threshold =================
const t2 = JSON.parse(runv(`
    GameState.agency.reputation = 25;
    Achievements.refresh();
    const r20 = Achievements.isUnlocked('rep20'), r30 = Achievements.isUnlocked('rep30');
    return JSON.stringify({ r20, r30 });
`));
check('reputation 25 unlocks the rep-20 milestone but not rep-30', t2.r20 === true && t2.r30 === false);

// ================= 3. league-title tier classification =================
const t3 = JSON.parse(runv(`
    const club = Clubs.getClubById('ajax');
    const p = GameState.players.find(x => x.agentId === 'me');
    const yr = GameState.seasonStartYear;
    p.trophies = [{ year: yr, compId: 'ERE', clubId: club.id }];   // Eredivisie = NL top flight (tier 1)
    Achievements.refresh();
    const league1 = Achievements.isUnlocked('league1'), league4 = Achievements.isUnlocked('league4');
    // now add a 4th-tier title (Derde Divisie)
    p.trophies.push({ year: yr, compId: 'DRD', clubId: club.id });
    Achievements.refresh();
    return JSON.stringify({ league1, league4Before: league4, league4After: Achievements.isUnlocked('league4') });
`));
check('a top-flight (Eredivisie) title unlocks the tier-1 league achievement', t3.league1 === true);
check('the tier-4 achievement only unlocks once a 4th-tier title is won', t3.league4Before === false && t3.league4After === true);

// ================= 4. cup + European classification =================
const t4 = JSON.parse(runv(`
    const p = GameState.players.find(x => x.agentId === 'me');
    p.trophies.push({ year: GameState.seasonStartYear, compId: 'BEKER', clubId: p.clubId });   // primary NL cup
    p.trophies.push({ year: GameState.seasonStartYear, compId: 'UCL', clubId: p.clubId });      // Champions League
    Achievements.refresh();
    return JSON.stringify({ cupPrimary: Achievements.isUnlocked('cupPrimary'), cupSecondary: Achievements.isUnlocked('cupSecondary'), ucl: Achievements.isUnlocked('euroUCL') });
`));
check('a primary domestic cup unlocks the primary-cup achievement (not the secondary)', t4.cupPrimary === true && t4.cupSecondary === false);
check('a Champions League title unlocks Champions of Europe', t4.ucl === true);

// ================= 5. release counter =================
const t5 = JSON.parse(runv(`
    const before = Achievements.isUnlocked('release1');
    Achievements.noteRelease();
    return JSON.stringify({ before, after: Achievements.isUnlocked('release1'), releases: GameState.achievements.releases });
`));
check('releasing a player unlocks the release achievement', t5.before === false && t5.after === true && t5.releases === 1);

// ================= 6. tallies (trophies) =================
const t6 = JSON.parse(runv(`
    const tal = Achievements.tallies();
    return JSON.stringify({ trophies: tal.trophies });
`));
check('client trophy tally counts every honour (4 so far), got ' + t6.trophies, t6.trophies === 4);

// ================= 7. counts reflect unlocked/claimable =================
const t7 = JSON.parse(runv(`
    const c = Achievements.counts();
    // collect everything, then claimable should be 0
    const all = Achievements.collectAll();
    const c2 = Achievements.counts();
    return JSON.stringify({ total: c.total, unlocked: c.unlocked, claimableBefore: c.claimable, collectedN: all.n, claimableAfter: c2.claimable });
`));
check('counts: total is the full set and some are unlocked', t7.total > 40 && t7.unlocked >= 6);
check('collectAll banks every claimable reward, leaving none', t7.claimableBefore > 0 && t7.collectedN === t7.claimableBefore && t7.claimableAfter === 0);

console.log(failed ? '\n*** SOME CHECKS FAILED ***' : '\nAll achievements checks passed.');
process.exitCode = failed ? 1 : 0;
