// ============================================================
//  Scout system
//  Hire a scout for a weekly salary, then ASSIGN him to a region
//  (one-off fee; better regions cost more). Only assigned scouts
//  produce reports. Better scouts find better, more talents.
// ============================================================
const FIRST_NAMES_SCOUT = ['Hans', 'Piet', 'Wim', 'Cor', 'Jan', 'Ruud', 'Theo', 'Frank', 'Gerard', 'Sjaak', 'Henk', 'Bas', 'Marcel', 'Ronald'];
const LAST_NAMES_SCOUT = ['Visser', 'Bakker', 'de Wit', 'Janssen', 'Smit', 'Vermeer', 'Kuiper', 'Blom', 'Dekker', 'Hofman', 'Mulder', 'Kok'];

const Scouts = {
    scoutName() {
        return FIRST_NAMES_SCOUT[Math.floor(Math.random() * FIRST_NAMES_SCOUT.length)] + ' ' +
            LAST_NAMES_SCOUT[Math.floor(Math.random() * LAST_NAMES_SCOUT.length)];
    },
    _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },

    // weekly salary grows steeply with quality
    salaryFor(q) { return Math.round(8 + q * q * 0.30); },
    _q(mean, sd) { return Math.max(3, Math.min(95, Math.round(PlayerGen.gauss(mean, sd)))); },

    // What you can attract depends on agency reputation. Three suggestions, scaled to your standing,
    // never below quality 15, with the occasional stand-out available.
    _clampQ(q) { return Math.max(15, Math.min(95, Math.round(q))); },
    titleFor(q) { return q >= 70 ? 'Chief scout' : q >= 52 ? 'Senior scout' : q >= 34 ? 'Lead scout' : q >= 22 ? 'Regional scout' : 'Local talent spotter'; },
    catalogue() {
        const rep = GameState.agency.reputation;
        const base = Math.max(18, rep);
        const q1 = this._clampQ(PlayerGen.gauss(base * 0.72, 4));
        const q2 = this._clampQ(PlayerGen.gauss(base * 1.0, 4));
        const q3 = Math.random() < 0.28 ? this._clampQ(PlayerGen.gauss(base + 18, 6))   // occasional stand-out
            : this._clampQ(PlayerGen.gauss(base * 1.28, 5));
        return [q1, q2, q3].map(q => this.makeOffer(this.titleFor(q), q));
    },
    makeOffer(title, quality) {
        return {
            id: 's_' + Math.random().toString(36).slice(2, 8),
            name: this.scoutName(), title,
            quality, weeklyCost: this.salaryFor(quality), region: null, maxTalentAge: 22
        };
    },
    setMaxAge(scoutId, age) {
        const s = GameState.agency.scouts.find(x => x.id === scoutId);
        if (s) s.maxTalentAge = Math.max(15, Math.min(22, Math.round(age)));
        return s ? s.maxTalentAge : null;
    },

    // cost charged PER report, scaled by region prestige: cheapest €600, dearest €2600
    regionReportCost(regionId) {
        const avg = id => { const cs = Clubs.getClubsByRegion(id); return cs.length ? cs.reduce((s, c) => s + c.reputation, 0) / cs.length : 40; };
        const vals = REGIONS.map(r => avg(r.id));
        const lo = Math.min(...vals), hi = Math.max(...vals);
        const me = avg(regionId);
        const t = hi > lo ? (me - lo) / (hi - lo) : 0;
        const base = 600 + t * (2600 - 600);
        const disc = (typeof Upgrades !== 'undefined') ? Upgrades.scoutDiscount() : 0;
        return Math.round((base * (1 - disc)) / 50) * 50;
    },

    hire(offer) {
        const ag = GameState.agency;
        if (ag.scouts.find(s => s.id === offer.id)) return { ok: false, message: 'That scout is already on your books.' };
        const max = Upgrades.maxScouts();
        if (ag.scouts.length >= max) return { ok: false, message: `Your ${Upgrades.office().name} only has room for ${max} scout(s). Upgrade your office to hire more.` };
        ag.scouts.push({
            id: offer.id, name: offer.name, title: offer.title,
            quality: offer.quality, weeklyCost: offer.weeklyCost,
            region: null, weeksUntilFind: this.nextFindDelay(offer.quality)
        });
        GameState.addLog(`Hired ${offer.name} (${offer.title}, quality ${offer.quality}) for €${offer.weeklyCost}/wk.`, 'scout');
        return { ok: true, message: `${offer.name} hired. Assign him to a region so he can start scouting.` };
    },

    assignRegion(scoutId, regionId) {
        const ag = GameState.agency;
        const s = ag.scouts.find(x => x.id === scoutId);
        if (!s) return { ok: false, message: 'Unknown scout.' };
        if (s.region === regionId) return { ok: false, message: `${s.name} already covers ${regionName(regionId)}.` };
        s.region = regionId;
        s.weeksUntilFind = this.nextFindDelay(s.quality);
        GameState.addLog(`${s.name} assigned to ${regionName(regionId)} (€${this.regionReportCost(regionId)}/report).`, 'scout');
        return { ok: true, message: `${s.name} now scouts ${regionName(regionId)} (€${this.regionReportCost(regionId)} per report). First report in ~${s.weeksUntilFind} weeks.` };
    },

    release(scoutId) {
        const ag = GameState.agency;
        const idx = ag.scouts.findIndex(s => s.id === scoutId);
        if (idx >= 0) { const s = ag.scouts[idx]; ag.scouts.splice(idx, 1); GameState.addLog(`Released scout ${s.name}.`, 'scout'); }
    },

    // reports arrive every 6-7 weeks
    nextFindDelay(quality = 50) { return 6 + Math.floor(Math.random() * 2) + (quality < 30 ? 3 : quality < 50 ? 1 : 0); },

    // scout quality -> the calibre of talent he can unearth: [minAbility, maxAbility, centrePotential, potentialCap]
    tierRanges(q) {
        if (q < 20) return [5, 20, 38, 60];
        if (q < 30) return [10, 25, 44, 65];
        if (q < 40) return [15, 30, 52, 70];
        if (q < 50) return [20, 35, 58, 75];
        if (q < 60) return [25, 45, 65, 85];
        if (q < 70) return [30, 55, 72, 95];
        if (q < 80) return [40, 65, 80, 99];
        if (q < 90) return [45, 70, 83, 99];
        return [50, 80, 85, 99];
    },
    // roll a talent's TRUE current ability + potential for a scout of quality q, given the prospect's age.
    rolledTalent(q, age) {
        const [loA, hiA, centre, cap] = this.tierRanges(q);
        let potential = Math.round(PlayerGen.gauss(centre, 8.5));
        potential = Math.max(Math.max(20, loA), Math.min(cap, potential));
        // spread current ability ACROSS the tier band [loA..hiA], driven by age + potential + genuine noise
        const ageN = Math.max(0, Math.min(1, (age - 15) / 7));                 // 15y→0 .. 22y→1
        const potN = Math.max(0, Math.min(1, (potential - loA) / Math.max(1, cap - loA)));
        let frac = 0.22 + ageN * 0.42 + potN * 0.22 + (Math.random() - 0.5) * 0.42;
        frac = Math.max(0, Math.min(1, frac));
        let ability = Math.round(loA + frac * (hiA - loA));
        ability = Math.min(ability, potential);                                // never above his ceiling
        // very rare precocious teenager (only the best scouts ever see these, <0.5%)
        if (q >= 95 && age <= 18 && Math.random() < 0.004) ability = Math.min(potential, hiA, ability + 8 + Math.floor(Math.random() * 6));
        potential = Math.max(potential, ability);
        return { ability, potential };
    },

    // place a found talent at a club IN the scout's region:
    // stronger talents lean to higher-reputation regional clubs, with exceptions
    pickRegionalClub(regionClubs, ability) {
        const sorted = [...regionClubs].sort((a, b) => b.reputation - a.reputation);
        const span = sorted.length;
        if (!span) return null;
        let idx = Math.round((1 - this._clamp(ability, 3, 75) / 75) * (span - 1));
        idx += Math.round(PlayerGen.gauss(0, span * 0.18));     // exceptions
        return sorted[this._clamp(idx, 0, span - 1)];
    },

    _prospectAge(maxAge) { const m = Math.max(15, Math.min(22, maxAge || 22)); return 15 + Math.floor(Math.pow(Math.random(), 1.6) * (m - 15 + 1)); },

    // called once per week from the simulation
    tick() {
        const ag = GameState.agency;
        const found = [];
        ag.scouts.forEach(s => {
            if (!s.region) {
                // an idle scout on the payroll still keeps his ear to the ground: 1-2 finds a season, anywhere in the country
                if (Math.random() < 0.03) {
                    const club = Clubs.allClubs[Math.floor(Math.random() * Clubs.allClubs.length)];
                    const age = this._prospectAge(s.maxTalentAge);
                    const { ability, potential } = this.rolledTalent(s.quality, age);
                    const pr = PlayerGen.makeProspect(club, { ability, potential, age });
                    pr.knownToAgent = true; pr.discoveredVia = 'scout:' + s.name; pr.discoveredWeek = GameState.absWeek(); pr.scoutQuality = s.quality;
                    Scouting.generateReport(pr, s.quality);
                    GameState.players.push(pr);
                    found.push({ scout: s.name, region: null, players: [pr], cost: 0, idle: true });
                }
                return;
            }
            s.weeksUntilFind -= 1;
            if (s.weeksUntilFind > 0) return;
            s.weeksUntilFind = this.nextFindDelay(s.quality);

            const regionClubs = Clubs.getClubsByRegion(s.region);
            if (!regionClubs.length) return;
            const span = Math.max(0, Math.min(7, (s.maxTalentAge || 22) - 15));   // wider age window -> more to find
            const spanF = span / 7;                                              // 0 (only 15yo) .. 1 (15-22)
            let n = s.quality < 30 ? Math.floor(Math.random() * 2)               // 0-1 (sometimes empty-handed)
                : s.quality < 50 ? 1 + Math.floor(Math.random() * 2)            // 1-2
                    : 2 + (Math.random() < 0.5 ? 1 : 0);                        // 2-3
            if (n === 0 && Math.random() < 0.25 + spanF * 0.5) n = 1;            // a broad search still tends to turn something up
            if (Math.random() < spanF * 0.25) n += 1;                            // and occasionally one extra
            const batch = [];
            for (let i = 0; i < n; i++) {
                const age = this._prospectAge(s.maxTalentAge);
                const { ability, potential } = this.rolledTalent(s.quality, age);
                const club = this.pickRegionalClub(regionClubs, ability);
                if (!club) continue;
                const prospect = PlayerGen.makeProspect(club, { ability, potential, age });
                prospect.knownToAgent = true;
                prospect.discoveredVia = 'scout:' + s.name;
                prospect.discoveredWeek = GameState.absWeek();
                prospect.scoutQuality = s.quality;
                Scouting.generateReport(prospect, s.quality);
                GameState.players.push(prospect);
                batch.push(prospect);
            }
            if (batch.length) {
                const cost = this.regionReportCost(s.region);
                GameState.agency.balance -= cost; GameState.addFinance('Scout reports', -cost);
                found.push({ scout: s.name, region: s.region, players: batch, cost });
            } else {
                found.push({ scout: s.name, region: s.region, players: [], cost: 0, none: true });   // report a blank trip
            }
        });
        return found;
    }
};
