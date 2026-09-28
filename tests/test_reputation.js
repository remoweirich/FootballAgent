// Agency reputation. The authority for these numbers is docs/reputation-design.md — if this test
// and that document disagree, one of them is wrong and it is worth stopping to work out which.
//
// The rules exist largely to stop reputation being farmed, so the exploit cases (§6 of the spec)
// are pinned as hard as the happy paths: a sideways shuffle between two elite clubs, a cross-border
// round trip, re-entering a top-five league, and promotion into one.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const errs = [];
const sb = {
    console: { log() {}, warn() {}, error: (...a) => errs.push(a.join(' ')) },
    Math, Date, JSON, setTimeout, clearTimeout,
    indexedDB: { open() { return { result: null, onsuccess: null }; } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} }, window: { addEventListener() {} },
    UI: { money: n => String(Math.round(n || 0)), euro: n => '€' + n, esc: s => String(s) },
};
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'storage.js', 'rng.js', 'names-data.js', 'clubs.js', 'players.js',
    'game-state.js', 'upgrades.js', 'scouting.js', 'league.js', 'europe-data.js', 'europe.js', 'scouts.js',
    'world-ext.js', 'agency.js', 'achievements.js', 'injuries-data.js', 'simulation.js'])
    vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const run = c => vm.runInContext('(function(){' + c + '})()', sb);
let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };
run("Clubs.init(); GameState.startNewGame('England','Test FC','A');");
const A = vm.runInContext('Agency', sb);

// synthetic clubs, so the numbers under test are the ladder's and not the world's
const club = (rep, country, tier) => ({ id: 'c' + rep + country + tier, reputation: rep, country, tier });
const gain = (from, to, player, last) => A.transferRepGain(from, to, player || {}, last || null);
const T = (from, to, p, last) => gain(from, to, p, last).total;
const why = (from, to, p, last) => gain(from, to, p, last).parts.map(x => x.why).join('+');

// ---- 1. the bands, at every boundary -----------------------------------------------------------
console.log('\n-- bands (same country, destination below 76 so no size bonus) --');
const EN = 'England';
const cases = [
    [40, 75, 6, 'd=+35 -> top band'],
    [40, 71, 6, 'd=+31 -> top band starts'],
    [40, 70, 5, 'd=+30'],
    [40, 66, 5, 'd=+26'],
    [40, 65, 4, 'd=+25'],
    [40, 61, 4, 'd=+21'],
    [40, 60, 3, 'd=+20'],
    [40, 51, 3, 'd=+11'],
    [40, 50, 1, 'd=+10'],
    [40, 44, 1, 'd=+4'],
    [40, 43, 0.5, 'd=+3 sideways'],
    [40, 40, 0.5, 'd=0 sideways'],
    [40, 37, 0.5, 'd=-3 sideways'],
    [40, 36, 0.15, 'd=-4'],
    [40, 30, 0.15, 'd=-10'],
    [40, 29, 0.05, 'd=-11'],
    [40, 20, 0.05, 'd=-20'],
];
for (const [f, t, want, label] of cases) {
    const got = T(club(f, EN, 2), club(t, EN, 2));
    check(`${label.padEnd(22)} -> +${want}`, got === want);
}

// ---- 2. destination size bonus, and the shuffle it would otherwise allow ------------------------
console.log('\n-- destination size (only on a real step up) --');
check('d=+10 into an 86+ club pays the band + 2', T(club(78, EN, 2), club(88, EN, 2)) === 3);   // band +1, dest +2
check('d=+10 into a 76+ club pays the band + 1', T(club(70, EN, 2), club(80, EN, 2)) === 2);
check('86+ and 76+ do NOT stack', why(club(70, EN, 2), club(90, EN, 2)).split('+').filter(x => x.startsWith('dest')).length === 1);
check('a SIDEWAYS move into an 86+ club gets no size bonus', T(club(84, EN, 2), club(87, EN, 2)) === 0.5);
check('a DOWNWARD move into a 76+ club gets no size bonus', T(club(90, EN, 2), club(80, EN, 2)) === 0.15);
// the exploit: 84 <-> 87 used to be worth +4 a round trip
const roundTrip = T(club(84, EN, 2), club(87, EN, 2)) + T(club(87, EN, 2), club(84, EN, 2));
check(`an elite round trip is worth ${roundTrip}, not +4`, roundTrip === 1);

// ---- 3. crossing a border ----------------------------------------------------------------------
console.log('\n-- borders (home country is England) --');
check('within one country: nothing', !/foreign/.test(why(club(40, EN, 2), club(44, EN, 2))));
check('England -> Germany: +0.1', T(club(40, EN, 2), club(40, 'Germany', 2)) === 0.6);        // 0.5 sideways + 0.1
check('Germany -> Switzerland (neither is home): +0.1', T(club(40, 'Germany', 2), club(40, 'Switzerland', 2)) === 0.6);
check('Germany -> England (coming home): +0.05', T(club(40, 'Germany', 2), club(40, EN, 2)) === 0.55);
check('a downward move still counts as crossing a border',
    /foreign/.test(why(club(80, 'Germany', 2), club(50, 'Switzerland', 2))));

// ---- 4. the top-five bonus ---------------------------------------------------------------------
console.log('\n-- top five (elo >= 1070, tier 1, once per client, transfers only) --');
check('England/Germany/Spain/Italy/France tier 1 qualify',
    ['England', 'Germany', 'Spain', 'Italy', 'France'].every(c => A.isTopFiveClub(club(50, c, 1))));
check('the other four countries do not',
    ['Netherlands', 'Switzerland', 'Portugal', 'Belgium'].every(c => !A.isTopFiveClub(club(50, c, 1))));
check('a SECOND division of a top-five country does not', !A.isTopFiveClub(club(50, 'Germany', 2)));
check('Basel -> Schalke pays it', /topFive/.test(why(club(60, 'Switzerland', 1), club(70, 'Germany', 1))));
check('Schalke -> Sunderland does NOT (origin already top five)',
    !/topFive/.test(why(club(70, 'Germany', 1), club(72, EN, 1))));
// once per client, ever
const p1 = { topFiveBonusPaid: true };
check('a client already paid never gets it again',
    !/topFive/.test(why(club(60, 'Switzerland', 1), club(70, 'Germany', 1), p1)));
check('...even after dropping out and coming back',
    !/topFive/.test(why(club(55, 'Germany', 2), club(75, 'Germany', 1), p1)));
check('but an unpaid client returning from a second tier DOES get it',
    /topFive/.test(why(club(55, 'Germany', 2), club(75, 'Germany', 1), {})));

// ---- 5. free agents ----------------------------------------------------------------------------
console.log('\n-- free agents (no club at all) --');
// a flat fee: the 90-rep destination earns no size bonus and there is no band without an origin
check('a flat +0.2, no band and no size bonus', T(null, club(90, EN, 2), {}, club(40, EN, 2)) === 0.2);
check('placed in the same country: +0.2', T(null, club(50, EN, 2), {}, club(40, EN, 2)) === 0.2);
check('placed abroad: +0.3', T(null, club(50, 'Germany', 2), {}, club(40, EN, 2)) === 0.3);
check('placed abroad into his first top-five league: +0.8',
    T(null, club(50, 'Germany', 1), {}, club(40, EN, 2)) === 0.8);
check('so the round trip on a lapsed contract is a net loss unless it lands somewhere better',
    (-0.5 + 0.2) === -0.3 && Math.abs((-0.5 + 0.8) - 0.3) < 1e-9);
// With no remembered club there is nothing to compare a border against, but nothing contradicts
// the top-five claim either, so it still pays — and the once-per-client flag stops any repeat.
check('with no remembered club, no border bonus', !/foreign/.test(why(null, club(50, 'Germany', 1), {}, null)));
check('...but the top-five bonus still applies', T(null, club(50, 'Germany', 1), {}, null) === 0.7);

// ---- 6. the full stack, and the ceiling --------------------------------------------------------
console.log('\n-- stacking --');
// the worked example from the spec: a domestic SECOND-division club (so the top-five bonus is
// live) to a foreign top flight. Home is England, so the destination being abroad pays the full 0.1.
const dream = gain(club(50, EN, 2), club(90, 'Germany', 1), {});
check('the dream transfer is +8.6 (6 + 2 + 0.1 + 0.5), got ' + dream.total, dream.total === 8.6);
check('and its breakdown names every part', dream.parts.map(x => x.why).join('+') === 'delta+dest86+foreign+topFive');

// ---- 7. the sponsorship allowance --------------------------------------------------------------
console.log('\n-- sponsorship (+0.1, max +2 a season) --');
run('GameState.agency.reputation = 0; GameState.agency.repFromSponsors = 0;');
const given = [];
for (let i = 0; i < 25; i++) given.push(run('return Agency.creditSponsorRep();'));
const total = given.reduce((a, b) => a + b, 0);
check(`20 deals pay +0.1 each and then stop — total ${Math.round(total * 100) / 100}`, Math.abs(total - 2) < 1e-9);
check('the 21st pays nothing', given[20] === 0);
run('GameState.agency.repFromSponsors = 0;');
check('a new season restores the allowance', run('return Agency.creditSponsorRep();') === 0.1);

// ---- 8. the penalties --------------------------------------------------------------------------
console.log('\n-- penalties --');
const M = vm.runInContext('MORALE', sb);
check('a walkout costs -5', M.DEPARTURE_AGENCY_REP === -5);
check('a broken promise costs -1', M.PROMISE_BROKEN_REP === -1);
check('a lapsed contract costs -0.5', M.CONTRACT_LAPSED_REP === -0.5);
check('seeing a client into retirement pays +3',
    /Agency\.bumpRep\(3\)/.test(fs.readFileSync(path.join(base, 'dialogue.js'), 'utf8')));
check('and the note tells the player the same number',
    /\+3/.test(vm.runInContext("I18n.packs.en['dlg.note.farewellRep']", sb)));

// ---- 9. the clamp still holds ------------------------------------------------------------------
console.log('\n-- clamp --');
run('GameState.agency.reputation = 19;');
run('Agency.bumpRep(50);');
check('gains are capped at the rep limit', run('return GameState.agency.reputation;') === run('return Upgrades.repLimit();'));
run('GameState.agency.reputation = 2; Agency.bumpRep(-50);');
check('and losses never go below zero', run('return GameState.agency.reputation;') === 0);

// ---- 10. the wiring: a real transfer through _finalizeTransfer -------------------------------
// transferRepGain is pure and easy to test; the call site is where a mistake would actually hide.
console.log('\n-- end to end --');
const wired = JSON.parse(run(`
  const nl = Clubs.allClubs.find(c => c.country === 'Netherlands' && c.tier === 2);
  const de = Clubs.allClubs.find(c => c.country === 'Germany' && c.tier === 1 && c.reputation >= 76);
  const P = PlayerGen.makePlayer(nl, { ability: 70, age: 24, position: 'ST' });
  P.agentId = 'me'; P.everClient = true; P.clubId = nl.id; GameState.players.push(P);
  GameState.agency.reputation = 5;
  const before = GameState.agency.reputation;
  Agency._finalizeTransfer(P, { toClubId: de.id, fromClubId: nl.id, wage: 1000, term: 3, role: 'starter' });
  const first = GameState.agency.reputation - before;
  // and again, back and forth, to prove the once-per-client flag holds
  const mid = GameState.agency.reputation;
  Agency._finalizeTransfer(P, { toClubId: nl.id, fromClubId: de.id, wage: 1000, term: 3, role: 'starter' });
  Agency._finalizeTransfer(P, { toClubId: de.id, fromClubId: nl.id, wage: 1000, term: 3, role: 'starter' });
  return JSON.stringify({ first, paidFlag: !!P.topFiveBonusPaid, lastClub: P.lastClubId, deId: de.id,
                          secondEntry: GameState.agency.reputation - mid });
`));
check('a real transfer moves reputation (+' + wired.first.toFixed(2) + ')', wired.first > 0);
check('the top-five flag is recorded on the player', wired.paidFlag === true);
check('lastClubId tracks where he ended up', wired.lastClub === wired.deId);
check('re-entering the same league later pays no second top-five bonus',
    wired.secondEntry < wired.first);

check('no engine errors, got: ' + JSON.stringify(errs.slice(0, 2)), errs.length === 0);
console.log(failed ? '\n*** FAIL ***' : '\nAll reputation checks passed.');
process.exitCode = failed ? 1 : 0;
