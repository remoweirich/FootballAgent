// ============================================================
//  Player model, generation, development curve & stat helpers
// ============================================================
const ROLE_PLAYTIME = { youth: 0.12, fringe: 0.30, rotation: 0.45, starter: 1.0, key: 1.0 };
const ROLE_LABEL = { youth: 'Youth', fringe: 'Hot Prospect', rotation: 'Rotation', starter: 'Starter', key: 'Star Player' };
// Goalkeepers use their own tier names (D4): only one plays, so it's a strict depth chart.
const GK_ROLE_LABEL = { youth: 'Youth', fringe: 'Hot Prospect', rotation: 'Back Up', starter: 'First Choice', key: 'Star Player' };
// each squad role maps to an i18n key; GK rotation/starter get their own depth-chart names
const ROLE_I18N = { youth: 'youth', fringe: 'hotProspect', rotation: 'rotation', starter: 'starter', key: 'star' };
const GK_ROLE_I18N = { youth: 'youth', fringe: 'hotProspect', rotation: 'backUp', starter: 'firstChoice', key: 'star' };
// look up 'role.<key>' via I18n, falling back to the raw English label if I18n is absent or the key is unregistered
function tRole(key, raw) {
    if (typeof I18n === 'undefined') return raw;
    const s = I18n.t('role.' + key);
    return s === 'role.' + key ? raw : s;
}
// "Hot Prospect" only applies to players under 23; the same tier reads "Fringe" for older players
function roleLabel(role, age, pos, cupKeeper) {
    const fringe = () => (age != null && age >= 23) ? tRole('fringe', 'Fringe') : tRole('hotProspect', 'Hot Prospect');
    if (pos === 'GK') {
        if (cupKeeper) return tRole('cupKeeper', 'Cup Goalkeeper');
        if (role === 'fringe') return fringe();
        return tRole(GK_ROLE_I18N[role] || role, GK_ROLE_LABEL[role] || role);
    }
    if (role === 'fringe') return fringe();
    return tRole(ROLE_I18N[role] || role, ROLE_LABEL[role] || role);
}
// role label from a full player object (handles the GK depth chart + the Cup Goalkeeper flag)
function roleName(p) { return roleLabel(p.squadRole, p.age, p.position, p.cupKeeper); }
const ROLE_ORDER = ['youth', 'fringe', 'rotation', 'starter', 'key'];
const POS_LIST = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const ATTACK_POS = ['CAM', 'LW', 'RW', 'ST'];
const MID_POS = ['CDM', 'CM', 'CAM'];
// Country pay tendency — a deliberately wide spread so a cross-border move reads as a real pay
// event (a Premier League club coming for a Super League player should be a payrise hard to turn
// down, and the Prem clearly outpays the Primeira Liga / La Liga for the same man). Applied to every
// player's wage at generation AND to every renewal/transfer offer (see Agency.offeredWage), with a
// per-offer jitter there so it's a tendency, not a fixed law. England leads; Portugal/Belgium trail.
// League wage tendency, England (Premier League) as the 1.00 reference. Everything else pays a share:
// Spain/Italy 85%, Germany 80%, France 75%, and the Eredivisie/Liga Portugal/Jupiler/Super League tier 65%.
const COUNTRY_WAGE_MULT = { England: 1.00, Spain: 0.85, Italy: 0.85, Germany: 0.80, France: 0.75, Netherlands: 0.65, Portugal: 0.65, Belgium: 0.65, Switzerland: 0.65 };
// Super clubs pay at top-Premier-League level regardless of their league's tendency.
const SUPER_CLUBS = new Set(['Bayern Munich', 'PSG', 'Real Madrid', 'Barcelona', 'Inter Milan', 'Juventus', 'Napoli', 'AC Milan']);
function clubWageMult(club) { return club && SUPER_CLUBS.has(club.id) ? 1.00 : ((club && COUNTRY_WAGE_MULT[club.country]) || 0.6); }
// development pacing: deliberately slow — a top young regular gains roughly a handful of points a
// season on his own, and agency development upgrades give a meaningful, noticeable boost on top
const DEV_BASE = 0.08;

const PlayerGen = {
    _id() { return 'p_' + Date.now().toString(36) + '_' + Rng.next().toString(36).slice(2, 8); },
    squadSizeByTier(t) { return ({ 1: 20, 2: 18, 3: 16, 4: 14 })[t] || 16; },
    randPos() { return POS_LIST[Math.floor(Rng.next() * POS_LIST.length)]; },
    gauss(mean, sd) { const r = (Rng.next() + Rng.next() + Rng.next()) / 3; return mean + (r - 0.5) * 2 * sd; },
    // A TRUE normal (Box–Muller) — unlike gauss() above, which is a bounded triangular (mean ± sd) and
    // so can never reach its own tails. Used where the rare tail actually matters (scouted potential:
    // a centre-90 / SD-3.494 roll must still occasionally reach 99, and only very rarely).
    gaussN(mean, sd) {
        let u = 0, v = 0;
        while (u === 0) u = Rng.next();
        while (v === 0) v = Rng.next();
        return mean + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
    },
    randSquadAge() { const r = (Rng.next() + Rng.next()) / 2; return Math.round(16 + r * 18); },

    peakAgeFor(pos) {
        if (pos === 'GK') return 30 + Math.floor(Rng.next() * 5);
        if (pos === 'CB' || pos === 'CDM' || pos === 'CM') return 28 + Math.floor(Rng.next() * 4);
        return 26 + Math.floor(Rng.next() * 4);
    },

    // Peaking and declining are two different ages: a winger who tops out at 26 doesn't start
    // losing ability at 27 — he holds that level for years first. A peak lasts 1-6 years, so an
    // outfielder might be at his best from 26 to 32 and a keeper from 30 to 36. Nobody declines
    // before 29, and when it starts is individual, not a fixed birthday.
    declineAgeFor(peakAge) {
        const peakYears = 2 + Math.floor(Rng.next() * 6);
        return Math.max(29, Math.min(37, (peakAge || 28) + peakYears - 1));
    },

    // pay scales with the club's actual reputation, not its tier label — a Dutch Derde Divisie side
    // (amateur, reputation ~30) pays far less than a similarly-tiered but professional foreign club.
    // Above ability 50 pay accelerates (a great player isn't just "a bit more" than a good one — the gap
    // to genuine elite quality is where the big money is), while lower abilities are untouched.
    wageFor(ability, reputation) {
        const rep = reputation != null ? reputation : 45;
        // A gentle curve below 76 (mediocre players don't get rich), then a steep elite premium above,
        // scaled by club reputation. Calibrated so a top-flight 85-rated earns ~150k at the ceiling and
        // lower-league wages sit ~35-40k. LEAGUE tendency + super-club overrides apply on top via
        // COUNTRY_WAGE_MULT / Agency.countryWageMult. High potential lifts sub-76 players via the
        // separate wagePotentialFactor, so the flatter base doesn't punish genuine prospects.
        let w = 1.4 * Math.pow(ability, 2) * Math.pow(1.024, Math.max(0, ability - 50));
        if (ability > 76) w *= Math.pow(1.12, ability - 76);
        w *= Math.max(0.4, Math.min(3.0, Math.pow(rep / 58, 1.1)));
        return Math.max(30, Math.round(w / 10) * 10);
    },
    sponsorBaseFor(ability) { return ability < 60 ? 0 : Math.round(Math.pow(ability - 55, 2) * 5 / 10) * 10; },

    // Teenagers shouldn't command exorbitant wages just because they carry big potential — a 60-rated
    // 15-year-old getting 18k/wk was a wonderkid-premium artefact. Hard weekly caps by age, EXCEPT at
    // the very biggest clubs (rep 82+), who really do throw money at prospects, and for the rare
    // generational talent (potential above 90), where the caps lift. Non-teenagers are untouched.
    YOUTH_WAGE_CAP: { 15: 7500, 16: 15000, 17: 30000 },
    capYouthWage(wage, age, reputation, potential) {
        const cap = this.YOUTH_WAGE_CAP[age];
        if (cap == null) return wage;
        if ((reputation || 45) >= 82) return wage;
        if ((potential || 0) > 90) return wage;
        return Math.min(wage, cap);
    },

    youthPotential(age, ability, cap = 92) {
        const gain = Math.floor(Rng.next() * 23) + 8;
        const ageBonus = age <= 17 ? 6 : age <= 19 ? 3 : age <= 21 ? 1 : 0;
        return Math.min(cap, ability + gain + ageBonus);
    },
    freshMorale() { return { club: 70, time: 70, wage: 70, agent: 70 }; },

    // Temperament: roughly one player in thirty is a reliable performer wherever he goes, and
    // barely has a bad season. Everyone else carries a small permanent lean either way.
    formTraitRoll() { return Rng.next() < 1 / 30 ? this.gauss(0.34, 0.06) : this.gauss(0, 0.09); },

    makePlayer(club, { ability, age, position }) {
        const nat = getRegionForClub(club);
        age = age != null ? age : this.randSquadAge();
        position = position || this.randPos();
        ability = Math.max(1, Math.min(99, Math.round(ability)));
        const isYouth = age <= 22;
        const peakAge = this.peakAgeFor(position);
        const potential = isYouth ? this.youthPotential(age, ability) : Math.max(ability, ability + (age < peakAge ? 3 : 0));
        let wage = Math.round(this.wageFor(ability, club.reputation) * clubWageMult(club) / 10) * 10;
        wage = this.capYouthWage(wage, age, club.reputation, potential);
        return {
            id: this._id(),
            name: generateName(nat), nationality: nat, nationalityFlag: getNationalityFlag(nat),
            age, position, ability, potential, peakAge, declineAge: this.declineAgeFor(peakAge),
            peakAbility: ability,   // highest ability ever reached (tracked in weeklyTick; used by Best XI)
            formTrait: this.formTraitRoll(),
            clubId: club.id, clubTierAtJoin: club.tier,
            wage, sponsorIncome: this.sponsorBaseFor(ability),
            contractUntilSeason: GameState ? GameState.seasonStartYear + 1 + Math.floor(Rng.next() * 3) : 2027,
            squadRole: 'rotation',
            // representation
            agentId: null, wageCommission: 0, sponsorCommission: 0, repUntilSeason: null, repExpired: false,
            // status
            onLoanAt: null, loanUntilSeason: null, loanRole: null,
            transferListed: false, loanListed: false,
            injury: null, injuryHistory: [],
            birthWeek: 1 + Math.floor(Rng.next() * 52),
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
        this._assignGkDepthChart(squad);   // goalkeepers use a strict depth chart, not the outfield fractions (D4)
    },
    // Only one keeper plays, so a club's GKs form a proper pecking order: the No.1 (Star Player if he's
    // clearly the club's level, else First Choice), a Back Up, and reserves. A Back Up close to the
    // required standard sometimes becomes the Cup Goalkeeper — he plays the domestic/European cup games.
    _assignGkDepthChart(squad) {
        const gks = squad.filter(p => p.position === 'GK').sort((a, b) => b.ability - a.ability);
        if (!gks.length) return;
        const club = (typeof Clubs !== 'undefined') ? Clubs.getClubById(gks[0].clubId || gks[0].onLoanAt) : null;
        const req = club ? club.reputation : (gks[0].ability - 2);   // ability a first-choice keeper needs here
        gks.forEach((p, i) => {
            p.cupKeeper = false;
            if (i === 0) p.squadRole = p.ability >= req + 2 ? 'key' : 'starter';                 // Star / First Choice
            else if (i === 1) {
                p.squadRole = 'rotation';                                                        // Back Up
                if (p.ability >= req - 4 && Rng.next() < 0.33) p.cupKeeper = true;                // ...or the Cup Goalkeeper
            } else p.squadRole = p.age <= 21 ? 'youth' : 'fringe';
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

    // how far a talent has typically progressed toward his ceiling at a given age
    ageFracFor(age) {
        const t = { 15: 0.72, 16: 0.76, 17: 0.81, 18: 0.86, 19: 0.90, 20: 0.93, 21: 0.96, 22: 0.98 };
        return t[age] != null ? t[age] : (age < 15 ? 0.68 : 0.99);
    },
    makeProspect(club, opts = {}) {
        const age = opts.age != null ? opts.age : 15 + Math.floor(Rng.next() * 4);
        const ability = opts.ability != null ? opts.ability : 3 + Math.floor(Rng.next() * 14);
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
        const pick = () => lower[Math.floor(Rng.next() * lower.length)];
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

    // level of the environment the player currently competes in (the club he is ACTUALLY at — a loan
    // club counts, since that's where he trains and plays)
    envLevelFor(p) {
        if (isU21Loan(p)) return 34;                          // academy / youth level
        const c = Clubs.getClubById(effectiveClubId(p));
        return c ? c.reputation : 45;
    },
    // Challenge: being BELOW your club's level — better team-mates, tougher training and opponents —
    // accelerates growth; being clearly ABOVE it (dominating a weak side) slows it. Centred at 1.0 when
    // the club's reputation matches your ability. Clamped so this alone can never let sitting out beat
    // getting minutes (see envFactor / weeklyTick).
    challengeFactor(p) {
        const env = this.envLevelFor(p);
        return Math.max(0.65, Math.min(1.45, 1 + (env - p.ability) / 45));
    },
    // Facilities: a higher-reputation club simply develops players faster (better training setup),
    // regardless of the ability gap. Applies whether he plays or sits. ~1.0 around a solid pro club
    // (reputation ~60), down to 0.9 at the amateur end, up to 1.3 at the elite end.
    facilitiesFactor(p) {
        const env = this.envLevelFor(p);
        return Math.max(0.9, Math.min(1.3, 0.9 + Math.max(0, env - 45) / 150));
    },
    // The combined training-environment multiplier. Its range is deliberately bounded: the most a
    // benched week can reach (0.18 × envMax ≈ 0.34) stays below the least a playing week can reach
    // (1.0 × envMin ≈ 0.59), so PLAYING — even at a lower level — always develops a player more than
    // sitting, while a bench week at a big club still beats one at a small club.
    envFactor(p) {
        return this.challengeFactor(p) * this.facilitiesFactor(p);
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
            // each point gets harder near the top of the scale — EXCEPT for the ~20% of players who,
            // by luck of the draw, keep a flat curve and climb from 85→86 as readily as 65→66 (B3).
            if (p._fastDev == null) p._fastDev = Rng.next() < 0.20;
            const highEnd = p._fastDev ? 1 : Math.max(0.30, 1 - Math.pow(Math.max(0, p.ability - 50) / 50, 1.4));
            // form: a strong recent rating accelerates development, a poor run slows it
            let form = 1;
            const st = (typeof seasonTotals === 'function') ? seasonTotals(p, year) : null;
            if (st && st.apps >= 4) form = Math.max(0.7, Math.min(1.6, 1 + (st.avg - 6.9) * 0.45));
            // organic week-to-week randomness
            const rnd = 0.7 + Rng.next() * 0.6;
            const up = (typeof Upgrades !== 'undefined') ? Upgrades.devSpeedMult() : 1;
            const moraleMult = (typeof moraleDevMult === 'function') ? moraleDevMult(moraleAvg(p)) : 1;
            // training environment: being stretched by a stronger level and better facilities develops
            // a player faster; dominating a weak side at a small club develops him slower (see envFactor)
            const envF = this.envFactor(p);
            let pts = DEV_BASE * play * this.youthBoost(p.age) * gapF * highEnd * form * rnd * up * moraleMult * envF;
            pts = Math.min(pts, 0.40);                          // weekly ceiling: no single week causes a visible jump
            p._dev = (p._dev || 0) + pts;
            while (p._dev >= 1 && p.ability < p.potential && (p._devGained || 0) < 11) {
                p.ability += 1; p._dev -= 1; p._devGained = (p._devGained || 0) + 1; delta += 1;
            }
        } else if (p.age > declineAgeOf(p)) {
            const perYear = p.position === 'GK' ? 0.7 : (MID_POS.includes(p.position) || p.position === 'CB' ? 1.4 : 1.8);
            const accel = 1 + (p.age - declineAgeOf(p)) * 0.12;
            p._dev = (p._dev || 0) - (perYear / 45) * accel;
            while (p._dev <= -1 && p.ability > 20) { p.ability -= 1; p._dev += 1; delta -= 1; }
        }
        if (p.ability > (p.peakAbility || 0)) p.peakAbility = p.ability;   // remember his career-high ability
        if (delta !== 0 && p.agentId === 'me') recordAbilityPoint(p);
        return delta;
    }
};

// ---- helpers ----
// Assigned lazily so players from saves made before decline and peak were separated get one too.
function declineAgeOf(p) {
    if (p.declineAge == null) p.declineAge = PlayerGen.declineAgeFor(p.peakAge);
    return p.declineAge;
}
// How well a player performs relative to his ability: a permanent temperament plus a fresh draw
// every season, so the same player has good and bad campaigns instead of a flat career average.
// The reliable ones (see formTraitRoll) get a much narrower season draw — that's what makes them
// reliable. Both are stored, so a season's form doesn't re-roll mid-season.
//
// Note the spread: PlayerGen.gauss averages three uniforms, so its real standard deviation is a
// THIRD of the argument and it can never exceed it. 0.9 here means a typical season lands within
// ~0.3 of par and the ~5% tails are the genuinely great and genuinely wretched campaigns — which
// is what lets a player at his own club's level occasionally average 7.5 without it being routine.
function formBiasOf(p) {
    if (p.formTrait == null) p.formTrait = PlayerGen.formTraitRoll();
    const year = GameState.seasonStartYear;
    if (p._formSeason !== year) {
        p._formSeason = year;
        p._formVal = PlayerGen.gauss(0, p.formTrait > 0.2 ? 0.30 : 0.9);
    }
    return p.formTrait + p._formVal;
}
// How far above (or below) the standard around him a player is, converted into rating. Being
// clearly better than your club is what earns big averages, and it bites quickly: five points
// of ability above your team-mates is already a real edge. Beyond about twelve the returns
// flatten — you can only dominate a league so hard — and being below the level costs you more
// gently than being above it pays, since the side is built to carry you.
function levelGapRating(gap) {
    if (gap <= 0) return gap * 0.045;
    return gap <= 12 ? gap * 0.0625 : 0.75 + (gap - 12) * 0.022;
}
function clubTierOf(p) { const c = Clubs.getClubById(p.clubId); return c ? c.tier : 4; }
function getRegionForClub(club) { return getRegionBasedNationality(club.country || 'Netherlands'); }
function effectiveClubId(p) { return p.onLoanAt || p.clubId; }
// World model: only players the user can ever see or interact with are simulated individually
// (aging, development, injuries, match stats). Everyone else is a frozen background extra —
// club results come from the club's own reputation/seasonDelta, not from squad averages.
function isSimRelevant(p) { return !p.archived && (p.agentId === 'me' || p.everClient === true || p.knownToAgent === true); }
// Which players are worth SAVING. Only the ones the user can ever see: current/ex clients, scouted
// prospects, and archived retirees (Client History). The anonymous background squads (~14k players,
// ~95% of the old save) are NOT saved — they're frozen and regenerable from each club's reputation,
// so they're rebuilt on load (League.regenerateBackgroundSquads), exactly as a fresh game or the V2
// migration already does. This is undetectable in play and shrinks the save from ~13 MB to <1 MB.
function isPersistedPlayer(p) { return p.agentId === 'me' || p.everClient === true || p.knownToAgent === true || p.archived === true; }
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
