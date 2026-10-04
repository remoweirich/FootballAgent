// The countable side of a watched match: shots, saves, tackles, and the keeper.
//
// Three complaints from play, all the same shape — the live view narrated a client four times and
// then told you he had done nothing:
//   * a client could finish a match he clearly featured in on "no stats yet"
//   * a goal conceded while you watched your own GOALKEEPER said only "GOAL — Team", as though he
//     were not on the pitch
//   * the team's shot count is invented from the scoreline, so it could come out BELOW the sum of
//     its own clients' shots
//
// Goals, assists and cards still belong to the engine and may never be invented here; that is what
// the ledger in buildTimeline enforces and test_livesim.js pins. Shots, saves and tackles are not
// stored by the engine at all, so the live view is free to award them — this suite is about doing
// that without ever contradicting the feed or the scoreline.
const vm = require('vm'), fs = require('fs'), path = require('path');
const base = path.join(__dirname, '..', 'js') + '/';
const sb = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, setTimeout, clearTimeout,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener() {} }, window: { addEventListener() {} },
};
vm.createContext(sb);
for (const f of ['i18n.js', 'i18n-en.js', 'rng.js', 'live-sim-data.js', 'live-sim.js'])
    vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), sb, { filename: f });
const LiveSim = vm.runInContext('LiveSim', sb);
const LIVE_SIM = vm.runInContext('LIVE_SIM', sb);
const Rng = vm.runInContext('Rng', sb);

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

let nid = 0;
const player = (position, name) => ({ id: 'p' + (++nid), name: name || position + nid, position, styleRole: null });
const client = (position, side, extra = {}) => Object.assign(
    { player: player(position), side, goals: 0, assists: 0, yellow: 0, red: 0 }, extra);
const spec = (clients, hg, ag) => ({
    homeName: 'Home FC', awayName: 'Away FC', hg, ag, minutes: 90, regulation: 90, clients,
});
// a deterministic stream, so a failure is reproducible
const seeded = s => { let x = s >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };

// ---- 1. nobody who played finishes with a blank line -----------------------------------------
console.log('\n-- every client who played has something to show --');
{
    let blank = 0, runs = 300, lines = 0;
    for (let i = 0; i < runs; i++) {
        const cs = [client('ST', 'home'), client('CB', 'home'), client('CM', 'away')];
        const tl = LiveSim.buildTimeline(Object.assign(spec(cs, 1, 1), { rnd: seeded(1000 + i) }));
        for (const c of cs) {
            const s = tl.clientStats[c.player.id];
            if (!s) { blank++; continue; }
            const any = (s.shots || 0) + (s.saves || 0) + (s.tackles || 0) + (c.goals || 0) + (c.assists || 0);
            if (any === 0) blank++; else lines++;
        }
    }
    check(`${lines} of ${lines + blank} client lines carry a stat`, blank === 0);
}
{
    // a client who scored is obviously fine; the case that used to fail is the one who did not
    const cs = [client('CM', 'home')];
    const tl = LiveSim.buildTimeline(Object.assign(spec(cs, 0, 0), { rnd: seeded(7) }));
    const s = tl.clientStats[cs[0].player.id];
    check('a goalless 0-0 still gives the midfielder a line', (s.shots + s.tackles + s.saves) > 0);
}
{
    const cs = [client('ST', 'home')];
    const tl = LiveSim.buildTimeline(Object.assign(spec(cs, 0, 2), { rnd: seeded(11) }));
    check('a forward always has at least one shot',
        tl.clientStats[cs[0].player.id].shots >= LIVE_SIM.MIN_SHOTS_ATT);
}

// ---- 2. the goalkeeper ------------------------------------------------------------------------
console.log('\n-- a watched goalkeeper is part of his own match --');
{
    const gk = client('GK', 'home');
    const tl = LiveSim.buildTimeline(Object.assign(spec([gk], 0, 3), { rnd: seeded(21) }));
    const goals = tl.events.filter(e => (e.events || []).some(ev => ev.tag === 'GOAL'));
    check(`the away side's 3 goals are all narrated (${goals.length})`, goals.length === 3);
    check('every goal past him names him', goals.every(e => e.beatenKeeper === gk.player
        || (e.lines || []).some(l => l.includes(gk.player.name))));
    check('...and he is credited with saves', tl.clientStats[gk.player.id].saves > 0);
}
{
    // busier goal = busier keeper
    const quiet = [], busy = [];
    for (let i = 0; i < 60; i++) {
        const a = client('GK', 'home'), b = client('GK', 'home');
        quiet.push(LiveSim.buildTimeline(Object.assign(spec([a], 2, 0), { rnd: seeded(300 + i) })).clientStats[a.player.id].saves);
        busy.push(LiveSim.buildTimeline(Object.assign(spec([b], 0, 4), { rnd: seeded(300 + i) })).clientStats[b.player.id].saves);
    }
    const avg = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
    check(`conceding four means more saves than conceding none (${avg(busy).toFixed(1)} vs ${avg(quiet).toFixed(1)})`,
        avg(busy) > avg(quiet));
}
{
    // with no client keeper, the plain line is still used — no stray name, no broken placeholder
    const cs = [client('ST', 'home')];
    const tl = LiveSim.buildTimeline(Object.assign(spec(cs, 0, 2), { rnd: seeded(31) }));
    const goals = tl.events.filter(e => (e.events || []).some(ev => ev.tag === 'GOAL'));
    check('no attending keeper -> the plain goal line, with no leftover placeholder',
        goals.length === 2 && goals.every(e => !e.beatenKeeper && !/\{keeper\}/.test((e.lines || []).join(' '))));
}

// ---- 3. the feed and the stat line never disagree ---------------------------------------------
console.log('\n-- credits ride on events that actually happened --');
{
    let bad = 0;
    for (let i = 0; i < 200; i++) {
        const cs = [client('ST', 'home'), client('GK', 'away'), client('LB', 'home')];
        const tl = LiveSim.buildTimeline(Object.assign(spec(cs, 2, 1), { rnd: seeded(500 + i) }));
        const ids = new Set(cs.map(c => c.player.id));
        for (const e of tl.events) {
            if (!e.statCredit) continue;
            if (!ids.has(e.statCredit.id)) { bad++; continue; }
            // the credit must belong to the client the beat was ABOUT
            if (!e.client || e.client.id !== e.statCredit.id) bad++;
        }
    }
    check('every stat credit belongs to the client that beat featured', bad === 0);
}
{
    // the engine's own numbers are untouched by any of this
    let drift = 0;
    for (let i = 0; i < 200; i++) {
        const st = client('ST', 'home', { goals: 2 });
        const cs = [st, client('GK', 'away')];
        const tl = LiveSim.buildTimeline(Object.assign(spec(cs, 3, 0), { rnd: seeded(900 + i) }));
        const scored = tl.events.reduce((n, e) => n + (e.events || []).filter(ev => ev.tag === 'GOAL').length, 0);
        if (scored !== 3) drift++;
        const his = tl.events.reduce((n, e) => n + (e.events || []).filter(ev => ev.tag === 'GOAL' && ev.player === st.player).length, 0);
        if (his !== 2) drift++;
    }
    check('goals in the feed still match the scoreline and the scorer exactly', drift === 0);
}

// ---- 4. the team can never have taken fewer shots than its clients ----------------------------
// buildStats invents the team total from the scoreline; the client totals come from the timeline.
// The floor is applied in ui/js/screen-livesim.js — checked here against the real source so the
// two cannot drift apart.
console.log('\n-- team shots are floored at the sum of the clients\' --');
{
    const ui = fs.readFileSync(path.join(__dirname, '..', 'ui', 'js', 'screen-livesim.js'), 'utf8');
    check('buildStats reads the timeline\'s client stats', /timeline\.clientStats/.test(ui));
    check('...and floors each side', /shots\.home = Math\.max\(shots\.home, byClient\.home\)/.test(ui)
        && /shots\.away = Math\.max\(shots\.away, byClient\.away\)/.test(ui));
    check('shots on target can never exceed total shots', /sot[\s\S]{0,200}Math\.min\(shots\.home/.test(ui));
    check('the full-time pass settles the line against the authoritative totals',
        /clientStats[\s\S]{0,400}t\.saves = Math\.max\(t\.saves/.test(ui));
    check('the view ticks a credit as its event is narrated', /e\.statCredit[\s\S]{0,120}\[e\.statCredit\.stat\]\+\+/.test(ui));
}

// ---- 5. the strings exist in every language ---------------------------------------------------
console.log('\n-- translated everywhere --');
for (const loc of ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl']) {
    const eng = fs.readFileSync(path.join(base, `i18n-${loc}.js`), 'utf8');
    const ui = fs.readFileSync(path.join(__dirname, '..', 'ui', 'js', `i18n-${loc}.js`), 'utf8');
    const miss = [];
    if (!eng.includes("'ls.goalAnonVsKeeper':")) miss.push('ls.goalAnonVsKeeper');
    if (!ui.includes("'livesim.savesShort':")) miss.push('livesim.savesShort');
    if (!ui.includes("'livesim.tacklesShort':")) miss.push('livesim.tacklesShort');
    check(`  ${loc}${miss.length ? ' — missing ' + miss.join(', ') : ''}`, miss.length === 0);
}

// ---- 6. every goal is explained, and the keeper is never bypassed -----------------------------
console.log('\n-- no goal arrives out of nowhere --');
{
    let bare = 0, goals = 0;
    for (let i = 0; i < 300; i++) {
        const tl = LiveSim.buildTimeline(Object.assign(spec([client('ST', 'home')], 2, 2), { rnd: seeded(4000 + i) }));
        for (const e of tl.events) {
            if (!(e.events || []).some(ev => ev.tag === 'GOAL')) continue;
            goals++;
            if (e.kind === 'goal' && (e.lines || []).length < 2) bare++;
        }
    }
    check(`every unattributed goal opens with how it came about (${goals} goals, ${bare} bare)`, goals > 0 && bare === 0);
}
{
    // the explicit request: a goal past a client KEEPER always involves him, no exceptions
    let miss = 0, goals = 0;
    for (let i = 0; i < 300; i++) {
        const gk = client('GK', 'home');
        const tl = LiveSim.buildTimeline(Object.assign(spec([gk], 0, 3), { rnd: seeded(5000 + i) }));
        for (const e of tl.events) {
            if (!(e.events || []).some(ev => ev.tag === 'GOAL')) continue;
            goals++;
            if (!(e.lines || []).join(' ').includes(gk.player.name)) miss++;
        }
    }
    check(`every goal conceded names the client keeper (${goals} goals, ${miss} without him)`, goals > 0 && miss === 0);
}

// ---- 7. penalties ------------------------------------------------------------------------------
console.log('\n-- a penalty is always taken, and by your man when it is his side --');
{
    let kicks = 0, onHisSide = 0, byHim = 0;
    for (let i = 0; i < 1200; i++) {
        const st = client('ST', 'home');
        const tl = LiveSim.buildTimeline(Object.assign(spec([st], 1, 1), { rnd: seeded(6000 + i) }));
        for (const e of tl.events) {
            if (e.kind !== 'penalty') continue;
            kicks++;
            if (e.side === 'home') { onHisSide++; if (e.client === st.player) byHim++; }
        }
    }
    check(`penalties are occurring in the sample (${kicks})`, kicks > 50);
    check(`every penalty to his side is taken by him (${byHim}/${onHisSide})`, onHisSide > 0 && byHim === onHisSide);
}
{
    // a penalty is never awarded and then quietly dropped
    let awards = 0, kicks = 0;
    for (let i = 0; i < 1200; i++) {
        const tl = LiveSim.buildTimeline(Object.assign(spec([client('CB', 'home')], 1, 1), { rnd: seeded(6500 + i) }));
        for (const e of tl.events) {
            if (e.kind === 'penalty-award') awards++;
            else if ((e.events || []).some(ev => ev.tag === 'PENWON' || ev.tag === 'PENCONC')) awards++;
            if (e.kind === 'penalty') kicks++;
        }
    }
    check(`a penalty awarded is always taken (${awards} awarded, ${kicks} taken)`, awards > 0 && kicks >= awards);
}
{
    // Every penalty at his end names him — scored, saved OR missed. The miss matters most: you
    // watched your keeper give one away, and being told only that it "was missed" with no mention
    // of him is the moment the feed stops being about your player. He is off the hook, and the
    // line says so.
    let faced = 0, named = 0, missed = 0;
    for (let i = 0; i < 1200; i++) {
        const gk = client('GK', 'home');
        const tl = LiveSim.buildTimeline(Object.assign(spec([gk], 1, 1), { rnd: seeded(7000 + i) }));
        for (const e of tl.events) {
            if (e.kind !== 'penalty' || e.side !== 'away') continue;
            faced++;
            if ((e.events || []).some(x => x.tag === 'PENMISS')) missed++;
            if ((e.lines || []).join(' ').includes(gk.player.name)) named++;
        }
    }
    check(`every penalty at his end names him (${named}/${faced}, of which ${missed} missed the target)`,
        faced > 0 && missed > 0 && named === faced);
}

// ---- 8. the corner counter ----------------------------------------------------------------------
// Silent corners never enter the feed, so counting by scanning it undercounted them against the
// timeline. They are counted as each one LANDS instead, which is also what "+1 in that moment" means.
console.log('\n-- the corner count ticks as it happens, silent ones included --');
{
    const ui = fs.readFileSync(path.join(__dirname, '..', 'ui', 'js', 'screen-livesim.js'), 'utf8');
    check('counted in _land', /_land\(e\)\s*\{[\s\S]{0,500}e\.corner[\s\S]{0,80}this\.corners/.test(ui));
    check('...and that is what the stats tab reads', /const cor = this\.corners;/.test(ui));
    check('the counter resets per match', /this\.corners = \{ home: 0, away: 0 \}/.test(ui));
}

console.log(failed ? '\n*** FAIL ***' : '\nAll live-sim stat checks passed.');
process.exitCode = failed ? 1 : 0;
