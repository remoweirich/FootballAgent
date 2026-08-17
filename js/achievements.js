// ============================================================
//  Achievements — milestones the agent unlocks through play.
//  Unlocking is automatic: every week the whole set is re-evaluated
//  against the live game state (so it stays correct even for things
//  that can only be derived, like club games or Best-XI ratings).
//  The euro reward is COLLECTED manually in the Achievements tab,
//  which banks it — mirroring the design brief. Definitions are flat
//  but carry a `group` so the UI can cluster them.
// ============================================================
const PRIMARY_CUPS = new Set(['DFB', 'CDR', 'SCHWCUP', 'COPPA', 'COUPEFR', 'TACAPT', 'BELCUP', 'BEKER', 'FACUP']);
// division tier (1 = top flight) from the country ladder order
function _achDivTier(div) {
    const c = (typeof divCountry === 'function') ? divCountry(div) : null;
    const ds = (typeof COUNTRY_DIVS !== 'undefined' && c) ? COUNTRY_DIVS[c] : null;
    const i = ds ? ds.indexOf(div) : -1;
    return i >= 0 ? i + 1 : 0;
}
function _achOrd(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

const Achievements = {
    REWARD_CAT: 'Achievement reward',
    state() {
        if (!GameState.achievements) GameState.achievements = { unlocked: {}, collected: {}, releases: 0 };
        const s = GameState.achievements;
        if (!s.unlocked) s.unlocked = {};
        if (!s.collected) s.collected = {};
        if (s.releases == null) s.releases = 0;
        return s;
    },
    // a release doesn't leave a durable mark on the player, so keep a simple lifetime counter
    noteRelease() { this.state().releases++; this.refresh(); },

    // ---- metric snapshot from the current game state ----
    ctx() {
        const A = GameState.agency || {}, players = GameState.players || [];
        const clients = players.filter(p => p.everClient);
        const led = A.ledgerAll || {};
        const earnings = Object.entries(led).reduce((s, [k, v]) => s + (k === this.REWARD_CAT ? 0 : Math.max(0, v || 0)), 0);
        const up = A.upgrades || {}, fac = A.facilities || {};
        const g = {
            signings: clients.length,
            releases: this.state().releases,
            earnings,
            officeIndex: up.officeIndex || 0,
            vehicleIndex: up.vehicleIndex != null ? up.vehicleIndex : -1,
            propertyIndex: up.propertyIndex != null ? up.propertyIndex : -1,
            physios: fac.physios || 0,
            trainers: fac.trainers || 0,
            reputation: A.reputation || 0,
            facilitiesFull: this._facilitiesFull(),
            leagueTiers: new Set(), cupPrimary: false, cupSecondary: false, euro: new Set(),
            maxApps: 0, maxTitles: 0, maxFee: 0, anyRetired: false,
        };
        clients.forEach(p => {
            let apps = 0;
            if (typeof careerByClub === 'function') careerByClub(p).forEach(c => { if (!c.youth) apps += (c.agg && c.agg.apps) || 0; });
            g.maxApps = Math.max(g.maxApps, apps);
            const trophies = p.trophies || [];
            g.maxTitles = Math.max(g.maxTitles, trophies.length);
            if (p.retired) g.anyRetired = true;
            ((p.history && p.history.fees) || []).forEach(f => { if (f && f.value) g.maxFee = Math.max(g.maxFee, f.value); });
            trophies.forEach(t => {
                const comp = (typeof COMPETITIONS !== 'undefined') ? COMPETITIONS[t.compId] : null;
                if (!comp) return;
                if (comp.type === 'cont') g.euro.add(t.compId);
                else if (comp.type === 'cup') { if (PRIMARY_CUPS.has(t.compId)) g.cupPrimary = true; else g.cupSecondary = true; }
                else { const tier = _achDivTier(t.compId); if (tier) g.leagueTiers.add(tier); }
            });
        });
        const xi = this._xi();
        g.xiComplete = xi.complete; g.xiAvg = xi.avg;
        return g;
    },
    _facilitiesFull() {
        if (typeof Upgrades === 'undefined' || !Upgrades.ownsEquip) return false;
        try { return ['gym', 'pool', 'training_ground', 'medical_center'].every(id => Upgrades.ownsEquip(id)); } catch (e) { return false; }
    },
    // the STARTING eleven only (formation slots, never the bench): avg of peak abilities, complete = all filled
    _xi() {
        const bx = GameState.bestXI;
        if (!bx || !bx.formation || typeof BestXI === 'undefined') return { complete: false, avg: 0 };
        const f = BestXI.FORMATIONS[bx.formation]; if (!f) return { complete: false, avg: 0 };
        const picks = bx.picks || {};
        let sum = 0, n = 0;
        f.slots.forEach(s => { const p = picks[s.id] && GameState.getPlayer(picks[s.id]); if (p) { sum += (p.peakAbility || p.ability || 0); n++; } });
        return { complete: n === f.slots.length, avg: n ? sum / n : 0 };
    },

    // ---- definitions (flat; `group` clusters them for display, order preserved) ----
    DEFS: null,
    GROUP_ORDER: ['signings', 'release', 'office', 'earnings', 'leagueTitles', 'cups', 'euroCups', 'transfers', 'games', 'clientTitles', 'physios', 'trainers', 'vehicles', 'properties', 'facilities', 'career', 'xi', 'reputation'],
    _buildDefs() {
        if (this.DEFS) return this.DEFS;
        const D = [];
        const money = n => (typeof UI !== 'undefined' && UI.money) ? UI.money(n) : String(n);
        const add = (id, group, reward, key, vars, done) => D.push({ id, group, reward, key, vars: vars || {}, done });
        [[1, 1000], [5, 10000], [20, 150000], [50, 1500000]].forEach(([n, r]) => add('sign' + n, 'signings', r, 'ach.sign', { n }, g => g.signings >= n));
        add('release1', 'release', 5000, 'ach.release', {}, g => g.releases >= 1);
        [['cowork', 3, 5000], ['trad', 6, 25000], ['modern', 9, 150000], ['iconic', 12, 1000000]].forEach(([k, idx, r]) => add('office_' + k, 'office', r, 'ach.office.' + k, {}, g => g.officeIndex >= idx));
        [[1000000, 50000], [10000000, 350000], [100000000, 2000000]].forEach(([n, r]) => add('earn' + n, 'earnings', r, 'ach.earn', { v: money(n) }, g => g.earnings >= n));
        [[6, 10000], [5, 10000], [4, 25000], [3, 50000], [2, 100000], [1, 250000]].forEach(([tier, r]) => add('league' + tier, 'leagueTitles', r, 'ach.league', { ord: _achOrd(tier), n: tier }, g => g.leagueTiers.has(tier)));
        add('cupSecondary', 'cups', 50000, 'ach.cup.secondary', {}, g => g.cupSecondary);
        add('cupPrimary', 'cups', 250000, 'ach.cup.primary', {}, g => g.cupPrimary);
        add('euroUECL', 'euroCups', 500000, 'ach.euro.UECL', {}, g => g.euro.has('UECL'));
        add('euroUEL', 'euroCups', 800000, 'ach.euro.UEL', {}, g => g.euro.has('UEL'));
        add('euroUCL', 'euroCups', 2500000, 'ach.euro.UCL', {}, g => g.euro.has('UCL'));
        [[1000000, 10000], [10000000, 50000], [100000000, 1000000]].forEach(([n, r]) => add('transfer' + n, 'transfers', r, 'ach.transfer', { v: money(n) }, g => g.maxFee >= n));
        [[250, 25000], [500, 100000], [750, 500000], [1000, 2000000]].forEach(([n, r]) => add('games' + n, 'games', r, 'ach.games', { n }, g => g.maxApps >= n));
        [[5, 150000], [10, 500000], [15, 2000000]].forEach(([n, r]) => add('ctitles' + n, 'clientTitles', r, 'ach.ctitles', { n }, g => g.maxTitles >= n));
        [[1, 25000], [5, 250000]].forEach(([n, r]) => add('physio' + n, 'physios', r, 'ach.physios', { n }, g => g.physios >= n));
        [[1, 30000], [5, 300000]].forEach(([n, r]) => add('trainer' + n, 'trainers', r, 'ach.trainers', { n }, g => g.trainers >= n));
        add('vehicle1', 'vehicles', 1000, 'ach.vehicle.one', {}, g => g.vehicleIndex >= 0);
        add('vehicleAll', 'vehicles', 200000, 'ach.vehicle.all', {}, g => g.vehicleIndex >= (typeof VEHICLES !== 'undefined' ? VEHICLES.length - 1 : 5));
        add('property1', 'properties', 1000, 'ach.property.one', {}, g => g.propertyIndex >= 0);
        add('propertyAll', 'properties', 250000, 'ach.property.all', {}, g => g.propertyIndex >= (typeof PROPERTIES !== 'undefined' ? PROPERTIES.length - 1 : 5));
        add('facilitiesFull', 'facilities', 3000000, 'ach.facilities', {}, g => g.facilitiesFull);
        add('retire1', 'career', 25000, 'ach.career', {}, g => g.anyRetired);
        add('xiComplete', 'xi', 50000, 'ach.xi.complete', {}, g => g.xiComplete);
        [[40, 100000], [60, 350000], [75, 1000000], [85, 2500000], [90, 3500000], [95, 10000000]].forEach(([n, r]) => add('xi' + n, 'xi', r, 'ach.xi.r' + n, { n }, g => g.xiComplete && g.xiAvg >= n));
        [[20, 5000], [30, 10000], [40, 20000], [50, 50000], [60, 100000], [70, 200000], [80, 400000], [90, 1000000], [100, 2000000]].forEach(([n, r]) => add('rep' + n, 'reputation', r, 'ach.reputation', { n }, g => g.reputation >= n));
        this.DEFS = D;
        return D;
    },

    // ---- lifecycle ----
    // re-evaluate everything; newly-unlocked defs are returned (for a heads-up mail)
    refresh() {
        const s = this.state(), g = this.ctx(), defs = this._buildDefs(), newly = [];
        defs.forEach(d => {
            if (!s.unlocked[d.id] && d.done(g)) {
                s.unlocked[d.id] = { year: GameState.seasonStartYear, week: GameState.week };
                newly.push(d);
            }
        });
        return newly;
    },
    isUnlocked(id) { return !!this.state().unlocked[id]; },
    isCollected(id) { return !!this.state().collected[id]; },
    claimable() { const s = this.state(); return this._buildDefs().filter(d => s.unlocked[d.id] && !s.collected[d.id]); },
    counts() {
        const s = this.state(), defs = this._buildDefs();
        return { total: defs.length, unlocked: defs.filter(d => s.unlocked[d.id]).length, claimable: this.claimable().length };
    },
    collect(id) {
        const s = this.state(), d = this._buildDefs().find(x => x.id === id);
        if (!d || !s.unlocked[id] || s.collected[id]) return { ok: false, reward: 0 };
        s.collected[id] = true;
        GameState.agency.balance += d.reward;
        GameState.addFinance(this.REWARD_CAT, d.reward);
        return { ok: true, reward: d.reward };
    },
    collectAll() {
        const s = this.state(); let total = 0, n = 0;
        this._buildDefs().forEach(d => {
            if (s.unlocked[d.id] && !s.collected[d.id]) { s.collected[d.id] = true; GameState.agency.balance += d.reward; total += d.reward; n++; }
        });
        if (total) GameState.addFinance(this.REWARD_CAT, total);
        return { total, n };
    },

    // ---- tallies (Achievements tab): trophies won + promotions/relegations experienced by clients ----
    // Derived (retroactive): trophies from each client's honours; promotions/relegations by comparing
    // his club's division tier across the seasons he actually played there (via clubHistory).
    tallies() {
        const clients = (GameState.players || []).filter(p => p.everClient);
        const CH = GameState.clubHistory || {};
        // Count each real-world event ONCE, not once per client who shared in it: several clients at the
        // same club winning the same trophy (or going up/down together) is a single achievement. Keyed by
        // the event itself — the trophy (year·comp·club) and the club's season move (club·year).
        const trophySet = new Set(), promoSet = new Set(), relegSet = new Set();
        clients.forEach(p => {
            (p.trophies || []).forEach(t => trophySet.add(t.year + '|' + t.compId + '|' + (t.clubId || '')));
            Object.keys(p.stats || {}).forEach(yKey => {
                const Y = +yKey; if (isNaN(Y)) return;
                const clubs = new Set(Object.values(p.stats[Y] || {}).filter(st => st && !st.youth && st.clubId).map(st => st.clubId));
                clubs.forEach(cid => {
                    const hist = CH[cid]; if (!hist) return;
                    const eY = hist.find(h => h.year === Y), eN = hist.find(h => h.year === Y + 1);
                    if (!eY || !eN) return;
                    const tY = _achDivTier(eY.division), tN = _achDivTier(eN.division);
                    if (!tY || !tN) return;
                    if (tN < tY) promoSet.add(cid + '|' + Y);
                    else if (tN > tY) relegSet.add(cid + '|' + Y);
                });
            });
        });
        return { trophies: trophySet.size, promotions: promoSet.size, relegations: relegSet.size };
    },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Achievements };
