// ============================================================
//  Player model, generation, development curve & stat helpers
// ============================================================
const ROLE_PLAYTIME = { youth: 0.12, fringe: 0.30, rotation: 0.45, starter: 1.0, key: 1.0 };
const ROLE_LABEL = { youth: 'Youth', fringe: 'Hot Prospect', rotation: 'Rotation', starter: 'Starter', key: 'Star Player' };
// "Hot Prospect" only applies to players under 23; the same tier reads "Fringe" for older players
function roleLabel(role, age) {
    if (role === 'fringe') return (age != null && age >= 23) ? 'Fringe' : 'Hot Prospect';
    return ROLE_LABEL[role] || role;
}
const ROLE_ORDER = ['youth', 'fringe', 'rotation', 'starter', 'key'];
const POS_LIST = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const ATTACK_POS = ['CAM', 'LW', 'RW', 'ST'];
const MID_POS = ['CDM', 'CM', 'CAM'];
// English football pays more than Dutch (applied to every player's wage)
const COUNTRY_WAGE_MULT = { Netherlands: 1.0, England: 1.25, Germany: 1.12 };
// development pacing: deliberately slow — a top young regular gains roughly a handful of points a
// season on his own, and agency development upgrades give a meaningful, noticeable boost on top
const DEV_BASE = 0.08;

const PlayerGen = {
    _id() { return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); },
    squadSizeByTier(t) { return ({ 1: 20, 2: 18, 3: 16, 4: 14 })[t] || 16; },
    randPos() { return POS_LIST[Math.floor(Math.random() * POS_LIST.length)]; },
    gauss(mean, sd) { const r = (Math.random() + Math.random() + Math.random()) / 3; return mean + (r - 0.5) * 2 * sd; },
    randSquadAge() { const r = (Math.random() + Math.random()) / 2; return Math.round(16 + r * 18); },

    peakAgeFor(pos) {
        if (pos === 'GK') return 30 + Math.floor(Math.random() * 5);
        if (pos === 'CB' || pos === 'CDM' || pos === 'CM') return 28 + Math.floor(Math.random() * 4);
        return 26 + Math.floor(Math.random() * 4);
    },

    wageFor(ability, tier) {
        let w = 0.5 * Math.pow(ability, 2);
        if (tier === 1) w *= 1.6; else if (tier === 2) w *= 1.1;
        return Math.max(30, Math.round(w / 10) * 10);
    },
    sponsorBaseFor(ability) { return ability < 60 ? 0 : Math.round(Math.pow(ability - 55, 2) * 5 / 10) * 10; },

    youthPotential(age, ability, cap = 92) {
        const gain = Math.floor(Math.random() * 23) + 8;
        const ageBonus = age <= 17 ? 6 : age <= 19 ? 3 : age <= 21 ? 1 : 0;
        return Math.min(cap, ability + gain + ageBonus);
    },
    freshMorale() { return { club: 70, time: 70, wage: 70, agent: 70 }; },

    makePlayer(club, { ability, age, position }) {
        const nat = getRegionForClub(club);
        age = age != null ? age : this.randSquadAge();
        position = position || this.randPos();
        ability = Math.max(1, Math.min(99, Math.round(ability)));
        const isYouth = age <= 22;
        const peakAge = this.peakAgeFor(position);
        const potential = isYouth ? this.youthPotential(age, ability) : Math.max(ability, ability + (age < peakAge ? 3 : 0));
        const wage = Math.round(this.wageFor(ability, club.tier) * (COUNTRY_WAGE_MULT[club.country] || 1) / 10) * 10;
        return {
            id: this._id(),
            name: generateName(nat), nationality: nat, nationalityFlag: getNationalityFlag(nat),
            age, position, ability, potential, peakAge,
            clubId: club.id, clubTierAtJoin: club.tier,
            wage, sponsorIncome: this.sponsorBaseFor(ability),
            contractUntilSeason: GameState ? GameState.seasonStartYear + 1 + Math.floor(Math.random() * 3) : 2027,
            squadRole: 'rotation',
            // representation
            agentId: null, wageCommission: 0, sponsorCommission: 0, repUntilSeason: null, repExpired: false,
            // status
            onLoanAt: null, loanUntilSeason: null, loanRole: null,
            transferListed: false, loanListed: false,
            injury: null, injuryHistory: [],
            birthWeek: 1 + Math.floor(Math.random() * 52),
            retireAge: Math.max(34, Math.min(41, Math.round(PlayerGen.gauss(37, 1.553)))),
            retireDelays: 0, retiringThisSeason: false, archived: false, everClient: false,
            styleRole: (typeof Scouting !== 'undefined') ? Scouting.assignRole({ position }) : null,
            report: null, scoutQuality: null,
            morale: this.freshMorale(),
            // records  ── stats: { year: { stintKey: {clubId,loan,youth,comps:{compId:{apps,goals,assists,yellow,red,ratingSum}}} } }
            stats: {},
            trophies: [],                            // { year, compId, clubId }
            history: { ability: [], wage: [], fees: [] },  // populated for clients
            _dev: 0, _weekApps: 0
        };
    },

    assignRoles(squad) {
        squad.sort((a, b) => b.ability - a.ability);
        const n = squad.length;
        squad.forEach((p, i) => {
            const frac = i / n;
            let role = frac < 0.30 ? 'key' : frac < 0.55 ? 'starter' : frac < 0.78 ? 'rotation' : 'fringe';
            if (p.age <= 19 && p.ability < (squad[Math.floor(n * 0.6)]?.ability ?? 0)) role = 'youth';
            p.squadRole = role;
        });
    },

    generatePool() {
        const players = [];
        Clubs.allClubs.forEach(club => {
            const size = this.squadSizeByTier(club.tier);
            const squad = [];
            for (let i = 0; i < size; i++) {
                const age = this.randSquadAge();
                let ability = this.gauss(club.reputation, 7);
                if (age < 24) ability -= (24 - age) * 1.1;
                const position = i < 2 ? 'GK' : this.randPos();
                squad.push(this.makePlayer(club, { ability, age, position }));
            }
            this.assignRoles(squad);
            players.push(...squad);
        });
        return players;
    },

    // turn a retired NPC back into a fresh youngster at the same club (keeps the world populated)
    rejuvenate(p) {
        const club = Clubs.getClubById(p.clubId) || { reputation: 45, country: 'Netherlands' };
        const fresh = this.makeProspect(club, { position: p.position });
        ['name', 'nationality', 'nationalityFlag', 'age', 'ability', 'potential', 'birthWeek', 'retireAge',
            'styleRole', 'report', 'scoutQuality'].forEach(k => { p[k] = fresh[k]; });
        p.stats = {}; p.injury = null; p.injuryHistory = []; p.history = { ability: [], wage: [], fees: [] };
        p.retireDelays = 0; p.retiringThisSeason = false; p.squadRole = 'rotation'; p.morale = fresh.morale;
        p.wage = fresh.wage; p.sponsorIncome = 0; p.contractUntilSeason = GameState.seasonStartYear + 2 + Math.floor(Math.random() * 3);
    },
    // how far a talent has typically progressed toward his ceiling at a given age
    ageFracFor(age) {
        const t = { 15: 0.72, 16: 0.76, 17: 0.81, 18: 0.86, 19: 0.90, 20: 0.93, 21: 0.96, 22: 0.98 };
        return t[age] != null ? t[age] : (age < 15 ? 0.68 : 0.99);
    },
    makeProspect(club, opts = {}) {
        const age = opts.age != null ? opts.age : 15 + Math.floor(Math.random() * 4);
        const ability = opts.ability != null ? opts.ability : 3 + Math.floor(Math.random() * 14);
        const p = this.makePlayer(club, { ability, age, position: opts.position });
        let pot;
        if (opts.potential != null) pot = opts.potential;
        else pot = ability + 3 + Math.floor(Math.abs(this.gauss(0, 13)));
        p.potential = Math.max(ability, Math.min(99, pot));   // potential never below current ability
        p.squadRole = 'youth';
        p.sponsorIncome = 0;
        if (opts.name) p.name = opts.name;
        return p;
    },

    lowerClubs() { const hc = (typeof GameState !== 'undefined' && GameState.homeCountry) || 'Netherlands'; const ls = Clubs.allClubs.filter(c => c.tier >= 3 && c.country === hc); return ls.length ? ls : Clubs.allClubs.filter(c => c.tier >= 3); },

    seedKnownProspects() {
        const hc = (typeof GameState !== 'undefined' && GameState.homeCountry) || 'Netherlands';
        const lower = this.lowerClubs();
        const pick = () => lower[Math.floor(Math.random() * lower.length)];
        const tec = (hc === 'Netherlands' && Clubs.getClubById('tec')) || pick();
        const kees = this.makeProspect(tec, { name: hc === 'Netherlands' ? 'Kees Peters' : undefined, age: 16, ability: 7, potential: 50, position: 'CAM' });
        kees.knownToAgent = true; kees.discoveredVia = 'contact';
        GameState.players.push(kees);
        for (let i = 0; i < 5; i++) {
            const pr = this.makeProspect(pick(), {});
            pr.knownToAgent = true; pr.discoveredVia = 'contact';
            GameState.players.push(pr);
        }
    }
};

// ============================================================
//  Development — playing time × challenge, age vs peak
// ============================================================
const PlayerDev = {
    youthBoost(age) { return age < 18 ? 1.85 : age < 21 ? 1.5 : age < 24 ? 1.25 : age < 26 ? 1.1 : 1.0; },

    // level of the environment the player currently competes in
    envLevelFor(p) {
        if (isU21Loan(p)) return 34;                          // academy / youth level
        const c = Clubs.getClubById(effectiveClubId(p));
        return c ? c.reputation : 45;
    },
    // challenged (env >= ability) -> faster; dominating a weak level -> slower
    challengeFactor(p) {
        const env = this.envLevelFor(p);
        return Math.max(0.45, Math.min(1.45, 0.75 + (env - p.ability) / 45));
    },

    // appsThisWeek: number of matches played this week (0..~2)
    weeklyTick(p, appsThisWeek) {
        if (p.injury) return 0;
        const year = GameState.seasonStartYear;
        if (p._devSeason !== year) { p._devSeason = year; p._devGained = 0; }
        const gap = p.potential - p.ability;
        let delta = 0;
        if (p.age < p.peakAge && gap > 0) {
            if ((p._devGained || 0) >= 11) return 0;            // season cap: at most ~11 points in a single season
            // playing time is the dominant driver; sitting out yields only light training gains
            const games = Math.min(appsThisWeek || 0, 2);
            const play = games > 0 ? games : 0.18;
            // room to grow: a big gap develops faster, tapering gently so the ceiling stays reachable
            const gapF = Math.max(0.15, Math.min(1.25, gap / 15));
            // each point gets harder near the top of the scale
            const highEnd = Math.max(0.30, 1 - Math.pow(Math.max(0, p.ability - 50) / 50, 1.4));
            // form: a strong recent rating accelerates development, a poor run slows it
            let form = 1;
            const st = (typeof seasonTotals === 'function') ? seasonTotals(p, year) : null;
            if (st && st.apps >= 4) form = Math.max(0.7, Math.min(1.6, 1 + (st.avg - 6.9) * 0.45));
            // organic week-to-week randomness
            const rnd = 0.7 + Math.random() * 0.6;
            const up = (typeof Upgrades !== 'undefined') ? Upgrades.devSpeedMult() : 1;
            let pts = DEV_BASE * play * this.youthBoost(p.age) * gapF * highEnd * form * rnd * up;
            pts = Math.min(pts, 0.40);                          // weekly ceiling: no single week causes a visible jump
            p._dev = (p._dev || 0) + pts;
            while (p._dev >= 1 && p.ability < p.potential && (p._devGained || 0) < 11) {
                p.ability += 1; p._dev -= 1; p._devGained = (p._devGained || 0) + 1; delta += 1;
            }
        } else if (p.age > p.peakAge) {
            const perYear = p.position === 'GK' ? 0.7 : (MID_POS.includes(p.position) || p.position === 'CB' ? 1.4 : 1.8);
            const accel = 1 + (p.age - p.peakAge) * 0.12;
            p._dev = (p._dev || 0) - (perYear / 45) * accel;
            while (p._dev <= -1 && p.ability > 20) { p.ability -= 1; p._dev += 1; delta -= 1; }
        }
        if (delta !== 0 && p.agentId === 'me') recordAbilityPoint(p);
        return delta;
    }
};

// ---- helpers ----
function clubTierOf(p) { const c = Clubs.getClubById(p.clubId); return c ? c.tier : 4; }
function getRegionForClub(club) { return getRegionBasedNationality(club.country || 'Netherlands'); }
function effectiveClubId(p) { return p.onLoanAt || p.clubId; }
function isU21Loan(p) { return typeof p.onLoanAt === 'string' && p.onLoanAt.indexOf('u21') === 0; }
function u21ParentId(idOrPlayer) { const v = typeof idOrPlayer === 'string' ? idOrPlayer : idOrPlayer.onLoanAt; return (v && v.indexOf('u21') === 0) ? (v.split(':')[1] || null) : null; }

// career timeline x value (age, fractional within season)
function careerAge(p) { return Math.round((p.age + (GameState.week) / 52) * 100) / 100; }
function recordAbilityPoint(p) {
    if (!p.history) p.history = { ability: [], wage: [], fees: [] };
    const t = GameState.absWeek(), arr = p.history.ability;
    if (arr.length && arr[arr.length - 1].t === t) arr[arr.length - 1].value = p.ability;
    else arr.push({ t, age: careerAge(p), value: p.ability });
    if (arr.length > 600) arr.shift();
}
function recordWagePoint(p) {
    if (!p.history) p.history = { ability: [], wage: [], fees: [] };
    const t = GameState.absWeek(), arr = p.history.wage;
    if (arr.length && arr[arr.length - 1].t === t) arr[arr.length - 1].value = p.wage;
    else arr.push({ t, age: careerAge(p), value: p.wage });
    if (arr.length > 200) arr.shift();
}

// ---- stat structure helpers ----
function isYouthComp(compId) { return (COMPETITIONS[compId] && COMPETITIONS[compId].youth) || compId === 'U21'; }
function stintKey(clubId, loan) { return clubId + (loan ? '#L' : ''); }

// blank competition record
function blankComp() { return { apps: 0, goals: 0, assists: 0, cs: 0, yellow: 0, red: 0, ratingSum: 0 }; }

// returns the comp bucket for (player, season, club, flags, comp), creating as needed
function statBucket(p, year, clubId, loan, youth, compId) {
    if (!p.stats[year]) p.stats[year] = {};
    const key = stintKey(clubId, loan);
    if (!p.stats[year][key]) p.stats[year][key] = { clubId, loan: !!loan, youth: !!youth, order: (GameState.seasonStartYear * 100 + GameState.week), comps: {} };
    const st = p.stats[year][key];
    if (!st.comps[compId]) st.comps[compId] = blankComp();
    return st.comps[compId];
}

function addComp(a, b) { a.apps += b.apps; a.goals += b.goals; a.assists += b.assists; a.cs += (b.cs||0); a.yellow += b.yellow; a.red += b.red; a.ratingSum += b.ratingSum; return a; }

// season stints (array of {clubId, loan, youth, comps, totals})
function seasonStints(p, year) {
    const s = (p.stats && p.stats[year]) || {};
    return Object.values(s).map(st => {
        const totals = blankComp();
        Object.values(st.comps).forEach(c => addComp(totals, c));
        totals.avg = totals.apps ? totals.ratingSum / totals.apps : 0;
        return { clubId: st.clubId, loan: st.loan, youth: st.youth, order: st.order || 0, comps: st.comps, totals };
    }).sort((a, b) => a.order - b.order);
}

// season totals (senior only by default; youth stints excluded)
function seasonTotals(p, year, includeYouth = false) {
    const t = blankComp();
    seasonStints(p, year).forEach(st => { if (includeYouth || !st.youth) addComp(t, st.totals); });
    t.avg = t.apps ? t.ratingSum / t.apps : 0;
    return t;
}

// career aggregation grouped by club or by competition
function careerByClub(p) {
    const map = {};
    Object.keys(p.stats || {}).forEach(y => seasonStints(p, +y).forEach(st => {
        const k = st.clubId;
        if (!map[k]) map[k] = { clubId: st.clubId, loanEver: false, youth: st.youth, agg: blankComp() };
        if (st.loan) map[k].loanEver = true;
        addComp(map[k].agg, st.totals);
    }));
    Object.values(map).forEach(m => m.agg.avg = m.agg.apps ? m.agg.ratingSum / m.agg.apps : 0);
    return Object.values(map);
}
function careerByComp(p) {
    const map = {};
    Object.keys(p.stats || {}).forEach(y => seasonStints(p, +y).forEach(st => {
        Object.entries(st.comps).forEach(([cid, c]) => {
            if (!map[cid]) map[cid] = { compId: cid, youth: isYouthComp(cid), agg: blankComp() };
            addComp(map[cid].agg, c);
        });
    }));
    Object.values(map).forEach(m => m.agg.avg = m.agg.apps ? m.agg.ratingSum / m.agg.apps : 0);
    return Object.values(map);
}
// senior LEAGUE-only aggregation (excludes cups and youth) — used for Client History
function _isLeagueComp(cid) { return typeof COMPETITIONS !== 'undefined' && (COMPETITIONS[cid] || COMPETITIONS[(cid + '').toUpperCase()]) && (COMPETITIONS[cid] || COMPETITIONS[(cid + '').toUpperCase()]).type === 'league'; }
function careerLeagueTotal(p) {
    const t = blankComp();
    Object.keys(p.stats || {}).forEach(y => {
        seasonStints(p, +y).forEach(st => {
            if (st.youth) return;
            Object.entries(st.comps).forEach(([cid, c]) => { if (_isLeagueComp(cid)) addComp(t, c); });
        });
    });
    t.avg = t.apps ? t.ratingSum / t.apps : 0;
    return t;
}
function seasonsActiveLeague(p) {
    let n = 0;
    Object.keys(p.stats || {}).forEach(y => {
        let has = false;
        seasonStints(p, +y).forEach(st => { if (st.youth) return; Object.entries(st.comps).forEach(([cid, c]) => { if (_isLeagueComp(cid) && (c.apps || 0) > 0) has = true; }); });
        if (has) n++;
    });
    return n;
}
function careerTotal(p, includeYouth = false) {
    const t = blankComp();
    Object.keys(p.stats || {}).forEach(y => { const s = seasonTotals(p, +y, includeYouth); addComp(t, s); });
    t.avg = t.apps ? t.ratingSum / t.apps : 0;
    return t;
}
