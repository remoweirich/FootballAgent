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
            region: null, weeksUntilFind: this.nextFindDelay()
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
        s.weeksUntilFind = this.nextFindDelay();
        GameState.addLog(`${s.name} assigned to ${regionName(regionId)} (€${this.regionReportCost(regionId)}/report).`, 'scout');
        return { ok: true, message: `${s.name} now scouts ${regionName(regionId)} (€${this.regionReportCost(regionId)} per report). First report in ~${s.weeksUntilFind} weeks.` };
    },

    release(scoutId) {
        const ag = GameState.agency;
        const idx = ag.scouts.findIndex(s => s.id === scoutId);
        if (idx >= 0) { const s = ag.scouts[idx]; ag.scouts.splice(idx, 1); GameState.addLog(`Released scout ${s.name}.`, 'scout'); }
    },

    // reports arrive every 6-7 weeks
    nextFindDelay() { return 6 + Math.floor(Math.random() * 2); },

    // found ability tracks scout quality, with the odd dud and the odd gem
    rolledAbility(quality) {
        let a = PlayerGen.gauss(quality, 7);
        if (Math.random() < 0.18) a -= 8 + Math.random() * 8;   // occasional weaker find
        return this._clamp(Math.round(a), 3, 80);
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
                    const ability = this.rolledAbility(s.quality);
                    const opts = { ability, age: this._prospectAge(s.maxTalentAge) };
                    if (Math.random() < 0.02 + s.quality / 3000) opts.potential = Math.min(88, ability + 40 + Math.floor(Math.random() * 16));
                    const pr = PlayerGen.makeProspect(club, opts);
                    pr.knownToAgent = true; pr.discoveredVia = 'scout:' + s.name; pr.scoutQuality = s.quality;
                    Scouting.generateReport(pr, s.quality);
                    GameState.players.push(pr);
                    found.push({ scout: s.name, region: null, players: [pr], cost: 0, idle: true });
                }
                return;
            }
            s.weeksUntilFind -= 1;
            if (s.weeksUntilFind > 0) return;
            s.weeksUntilFind = this.nextFindDelay();

            const regionClubs = Clubs.getClubsByRegion(s.region);
            if (!regionClubs.length) return;
            const n = 2 + (Math.random() < 0.5 ? 1 : 0);   // 2-3 talents
            const batch = [];
            for (let i = 0; i < n; i++) {
                const ability = this.rolledAbility(s.quality);
                const club = this.pickRegionalClub(regionClubs, ability);
                if (!club) continue;
                const opts = { ability, age: this._prospectAge(s.maxTalentAge) };
                if (Math.random() < 0.02 + s.quality / 3000) opts.potential = Math.min(88, ability + 40 + Math.floor(Math.random() * 16));
                const prospect = PlayerGen.makeProspect(club, opts);
                prospect.knownToAgent = true;
                prospect.discoveredVia = 'scout:' + s.name;
                prospect.scoutQuality = s.quality;
                Scouting.generateReport(prospect, s.quality);
                GameState.players.push(prospect);
                batch.push(prospect);
            }
            if (batch.length) {
                const cost = this.regionReportCost(s.region);
                GameState.agency.balance -= cost;
                found.push({ scout: s.name, region: s.region, players: batch, cost });
            }
        });
        return found;
    }
};
