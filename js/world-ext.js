// ============================================================
//  World extensions — "Add a new country" (Customize Part 2).
//
//  A created country lives in a customization database as a plain
//  data object (see CreatedCountry in the plan). WorldExt.registerCountry()
//  injects it into every runtime global the engine reads — COMPETITIONS,
//  COUNTRY_DIVS, ALL_LEAGUE_DIVS, LEAGUES_DATA, Clubs.*, REGIONS_BY_COUNTRY,
//  Scouts.REGION_REPORT_COST, NAMES_DATABASE — so a custom league behaves
//  exactly like a stock one. The generic prom/rel, cups and play-offs that
//  drive it live in js/league.js (applyPromotionRelegationCustom etc.).
//
//  Loaded after clubs/league/scouts/names so all those globals exist.
// ============================================================

// Countries with a large built-in name pool (js/names-data.js).
const NAME_TIER_EXTENDED = ['Brazil', 'Argentina', 'Croatia', 'Austria'];
// Countries with a small built-in name pool.
const NAME_TIER_SMALL = ['USA', 'Nigeria', 'Ghana', 'South Africa', 'Poland', 'Slovenia', 'Serbia', 'Greece', 'Türkiye', 'Scotland', 'Ireland', 'Denmark', 'Sweden', 'Norway', 'Iceland', 'Colombia', 'Chile', 'Uruguay', 'Czech Republic', 'Finland', 'Egypt', 'Morocco', 'Wales', 'Northern Ireland', 'Canada', 'Mexico', 'Ecuador', 'Peru', 'Australia', 'New Zealand', 'India', 'China', 'Indonesia', 'Japan', 'DRC', 'Cameroon', 'Kenya', 'Algeria', 'Tunisia', 'Madagascar', 'Luxembourg', 'Albania', 'Kosovo', 'North Macedonia', 'Ukraine', 'Romania', 'Bulgaria', 'Hungary', 'Slovakia', 'Bosnia and Herzegovina', 'South Korea', 'Iraq', 'Kazakhstan', "Côte d'Ivoire", 'Senegal', 'Mali', 'Gambia', 'Gabon', 'Uganda', 'Rwanda', 'Armenia', 'Georgia', 'Cyprus'];
// Cannot be created — their clubs play in another country's league system (or have none).
const COUNTRY_BLOCKED = ['Liechtenstein', 'Monaco', 'Vatican City'];

// Some names differ between the user-facing label, the name database (js/names-data.js) and the UEFA
// list (js/europe-data.js). Map a creatable country to its NAMES_DATABASE key.
const COUNTRY_NAME_KEY = {
    'Türkiye': 'Turkey', 'Czech Republic': 'Czech Republic', 'Bosnia and Herzegovina': 'Bosnia',
    'DRC': 'DRC', "Côte d'Ivoire": "Côte d'Ivoire", 'South Korea': 'South Korea'
};
// Map a creatable country to its EUROPE_DATA.associations key (for berths), where it differs.
const COUNTRY_EURO_KEY = { 'Czech Republic': 'Czechia' };

// Master list of creatable nations: name -> { iso2 (flag), eu (UEFA/European) }. UEFA members are
// european:true. Anything not listed is still creatable (treated non-european, no built-in flag).
const WORLD_COUNTRIES = {
    // ---- UEFA (european) ----
    'Albania': { iso2: 'al', eu: 1 }, 'Andorra': { iso2: 'ad', eu: 1 }, 'Armenia': { iso2: 'am', eu: 1 }, 'Austria': { iso2: 'at', eu: 1 }, 'Azerbaijan': { iso2: 'az', eu: 1 }, 'Belarus': { iso2: 'by', eu: 1 }, 'Bosnia and Herzegovina': { iso2: 'ba', eu: 1 }, 'Bulgaria': { iso2: 'bg', eu: 1 }, 'Croatia': { iso2: 'hr', eu: 1 }, 'Cyprus': { iso2: 'cy', eu: 1 }, 'Czech Republic': { iso2: 'cz', eu: 1 }, 'Denmark': { iso2: 'dk', eu: 1 }, 'Estonia': { iso2: 'ee', eu: 1 }, 'Faroe Islands': { iso2: 'fo', eu: 1 }, 'Finland': { iso2: 'fi', eu: 1 }, 'Georgia': { iso2: 'ge', eu: 1 }, 'Gibraltar': { iso2: 'gi', eu: 1 }, 'Greece': { iso2: 'gr', eu: 1 }, 'Hungary': { iso2: 'hu', eu: 1 }, 'Iceland': { iso2: 'is', eu: 1 }, 'Ireland': { iso2: 'ie', eu: 1 }, 'Israel': { iso2: 'il', eu: 1 }, 'Kazakhstan': { iso2: 'kz', eu: 1 }, 'Kosovo': { iso2: 'xk', eu: 1 }, 'Latvia': { iso2: 'lv', eu: 1 }, 'Lithuania': { iso2: 'lt', eu: 1 }, 'Luxembourg': { iso2: 'lu', eu: 1 }, 'Malta': { iso2: 'mt', eu: 1 }, 'Moldova': { iso2: 'md', eu: 1 }, 'Montenegro': { iso2: 'me', eu: 1 }, 'North Macedonia': { iso2: 'mk', eu: 1 }, 'Northern Ireland': { iso2: 'gb-nir', eu: 1 }, 'Norway': { iso2: 'no', eu: 1 }, 'Poland': { iso2: 'pl', eu: 1 }, 'Romania': { iso2: 'ro', eu: 1 }, 'Scotland': { iso2: 'gb-sct', eu: 1 }, 'Serbia': { iso2: 'rs', eu: 1 }, 'Slovakia': { iso2: 'sk', eu: 1 }, 'Slovenia': { iso2: 'si', eu: 1 }, 'Sweden': { iso2: 'se', eu: 1 }, 'Türkiye': { iso2: 'tr', eu: 1 }, 'Ukraine': { iso2: 'ua', eu: 1 }, 'Wales': { iso2: 'gb-wls', eu: 1 }, 'San Marino': { iso2: 'sm', eu: 1 },
    // ---- rest of the world (non-european) ----
    'Algeria': { iso2: 'dz' }, 'Angola': { iso2: 'ao' }, 'Argentina': { iso2: 'ar' }, 'Australia': { iso2: 'au' }, 'Bolivia': { iso2: 'bo' }, 'Brazil': { iso2: 'br' }, 'Burkina Faso': { iso2: 'bf' }, 'Cameroon': { iso2: 'cm' }, 'Canada': { iso2: 'ca' }, 'Cape Verde': { iso2: 'cv' }, 'Chile': { iso2: 'cl' }, 'China': { iso2: 'cn' }, 'Colombia': { iso2: 'co' }, 'Costa Rica': { iso2: 'cr' }, "Côte d'Ivoire": { iso2: 'ci' }, 'DRC': { iso2: 'cd' }, 'Ecuador': { iso2: 'ec' }, 'Egypt': { iso2: 'eg' }, 'El Salvador': { iso2: 'sv' }, 'Gabon': { iso2: 'ga' }, 'Gambia': { iso2: 'gm' }, 'Ghana': { iso2: 'gh' }, 'Guinea': { iso2: 'gn' }, 'Honduras': { iso2: 'hn' }, 'India': { iso2: 'in' }, 'Indonesia': { iso2: 'id' }, 'Iran': { iso2: 'ir' }, 'Iraq': { iso2: 'iq' }, 'Jamaica': { iso2: 'jm' }, 'Japan': { iso2: 'jp' }, 'Jordan': { iso2: 'jo' }, 'Kenya': { iso2: 'ke' }, 'Kuwait': { iso2: 'kw' }, 'Madagascar': { iso2: 'mg' }, 'Mali': { iso2: 'ml' }, 'Mexico': { iso2: 'mx' }, 'Morocco': { iso2: 'ma' }, 'Mozambique': { iso2: 'mz' }, 'New Zealand': { iso2: 'nz' }, 'Nigeria': { iso2: 'ng' }, 'Palestine': { iso2: 'ps' }, 'Panama': { iso2: 'pa' }, 'Paraguay': { iso2: 'py' }, 'Peru': { iso2: 'pe' }, 'Qatar': { iso2: 'qa' }, 'Rwanda': { iso2: 'rw' }, 'Saudi Arabia': { iso2: 'sa' }, 'Senegal': { iso2: 'sn' }, 'South Africa': { iso2: 'za' }, 'South Korea': { iso2: 'kr' }, 'Tunisia': { iso2: 'tn' }, 'Uganda': { iso2: 'ug' }, 'United Arab Emirates': { iso2: 'ae' }, 'Uruguay': { iso2: 'uy' }, 'USA': { iso2: 'us' }, 'Uzbekistan': { iso2: 'uz' }, 'Venezuela': { iso2: 've' }, 'Zambia': { iso2: 'zm' }, 'Zimbabwe': { iso2: 'zw' }
};

// Per-division: [team count, reputation cap, reserve cap]. Matches the plan's Italian-style skeleton.
const CUSTOM_DIV_SPEC = [
    { size: 20, repCap: 82, resCap: 0 },
    { size: 20, repCap: 65, resCap: 2 },
    { size: 24, repCap: 50, resCap: 4 },
    { size: 20, repCap: 35, resCap: 4 }
];

const WorldExt = {
    created: {},            // country name -> CreatedCountry currently registered
    _registered: {},        // country name -> true (idempotency guard for a session)

    // Remove every created-country injection from the runtime globals (called by Clubs.init before a
    // fresh world is built, so a mid-session database switch can't leak a country's divisions/clubs).
    reset() {
        Object.values(this.created).forEach(cc => {
            (cc.divIds || []).forEach(id => {
                if (typeof COMPETITIONS !== 'undefined') delete COMPETITIONS[id];
                if (typeof Clubs !== 'undefined') { delete Clubs.DIV_TIERS[id]; delete Clubs.DIV_NAMES[id]; }
                if (typeof Scouts !== 'undefined') delete Scouts.INTL_LEAGUE_COST[id];
                if (typeof ALL_LEAGUE_DIVS !== 'undefined') { const i = ALL_LEAGUE_DIVS.indexOf(id); if (i >= 0) ALL_LEAGUE_DIVS.splice(i, 1); }
            });
            if (typeof COMPETITIONS !== 'undefined' && cc.cups) { delete COMPETITIONS[cc.cups.higher.id]; delete COMPETITIONS[cc.cups.lower.id]; }
            if (typeof COUNTRY_DIVS !== 'undefined') delete COUNTRY_DIVS[cc.name];
            if (typeof LEAGUES_DATA !== 'undefined') delete LEAGUES_DATA[cc.name];
            if (typeof REGIONS_BY_COUNTRY !== 'undefined') delete REGIONS_BY_COUNTRY[cc.name];
            if (typeof NAMES_DATABASE !== 'undefined') delete NAMES_DATABASE[cc.name];
        });
        this.created = {}; this._registered = {};
    },

    // ---- classification (drives the Create dropdowns) ----
    nameTier(country) {
        if (NAME_TIER_EXTENDED.includes(country)) return 'extended';
        if (NAME_TIER_SMALL.includes(country)) return 'small';
        return 'none';
    },
    isEuropean(country) { const w = WORLD_COUNTRIES[country]; return !!(w && w.eu); },
    flagIso(country) { const w = WORLD_COUNTRIES[country]; return w ? w.iso2 : null; },
    // countries selectable for {european, tier}, excluding blocked ones and any already in the world
    creatableCountries(european, tier) {
        const existing = new Set(Object.keys((typeof COUNTRY_DIVS !== 'undefined') ? COUNTRY_DIVS : {}));
        return Object.keys(WORLD_COUNTRIES).filter(c =>
            !COUNTRY_BLOCKED.includes(c) && !existing.has(c) &&
            (!!WORLD_COUNTRIES[c].eu === !!european) && this.nameTier(c) === tier
        ).sort();
    },

    // ---- skeleton (default league for a freshly created country) ----
    divId(country, i) { return 'CUS:' + country + ':' + (i + 1); },
    cupId(country, which) { return 'CUS:' + country + ':' + which; },
    // seed the name lists from the built-in database for this country (capped at 150 each)
    seedNames(country) {
        const key = COUNTRY_NAME_KEY[country] || country;
        const db = (typeof NAMES_DATABASE !== 'undefined' && NAMES_DATABASE[key]) || (typeof FALLBACK_NAMES !== 'undefined' ? { firstNames: FALLBACK_NAMES.firstNames, lastNames: FALLBACK_NAMES.lastNames } : { firstNames: [], lastNames: [] });
        return { first: (db.firstNames || []).slice(0, 150), last: (db.lastNames || []).slice(0, 150) };
    },
    makeSkeleton(country, european) {
        const divIds = [0, 1, 2, 3].map(i => this.divId(country, i));
        const divNames = ['1st Division', '2nd Division', '3rd Division', '4th Division'];
        const clubs = [];
        let n = 0;
        CUSTOM_DIV_SPEC.forEach((spec, di) => {
            for (let k = 0; k < spec.size; k++) {
                n++;
                // default reputations spread from just under the cap down towards the next floor
                const lo = di < 3 ? CUSTOM_DIV_SPEC[di + 1].repCap : 20;
                const rep = Math.round(spec.repCap - (spec.repCap - lo) * (k / Math.max(1, spec.size - 1)));
                clubs.push({
                    id: 'CUS:' + country + ':c' + n, name: country + ' Club ' + n,
                    colors: { primary: '#3A6FB0', secondary: '#FFFFFF' },
                    reputation: Math.max(15, rep), logo: null, division: divIds[di], reserve: false, parentId: null
                });
            }
        });
        return {
            name: country, european: !!european, nameDb: this.nameTier(country),
            names: this.seedNames(country),
            divIds, divNames,
            cups: { higher: { id: this.cupId(country, 'higher'), name: 'Higher Cup' }, lower: { id: this.cupId(country, 'lower'), name: 'Lower Cup' } },
            clubs, regions: []
        };
    },
    divSpec() { return CUSTOM_DIV_SPEC; },
    repCapFor(cc, divId) { const i = cc.divIds.indexOf(divId); return i >= 0 ? CUSTOM_DIV_SPEC[i].repCap : 99; },
    reserveCapFor(cc, divId) { const i = cc.divIds.indexOf(divId); return i >= 0 ? CUSTOM_DIV_SPEC[i].resCap : Infinity; },

    // ---- scouting region cost (the user's formula) ----
    // Returns { regionId: reportCost } for a country whose regions are populated.
    regionCosts(cc) {
        const stats = (cc.regions || []).map(r => {
            const reps = (r.clubIds || []).map(id => {
                const c = (cc.clubs || []).find(x => x.id === id);
                return c ? c.reputation : 0;
            });
            const avg = reps.length ? reps.reduce((a, b) => a + b, 0) / reps.length : 0;
            const high = reps.length ? Math.max(...reps) : 0;
            return { id: r.id, avg, high };
        });
        if (!stats.length) return {};
        const avgs = stats.map(s => s.avg), highs = stats.map(s => s.high);
        const maxAvg = Math.max(...avgs), minAvg = Math.min(...avgs);
        const maxHigh = Math.max(...highs), minHigh = Math.min(...highs);
        const out = {};
        // min-max normalize each region to [0,1] (lowest region -> 0 -> 600; highest -> 1 -> 4000).
        // if every region ties on a measure (division by zero), that term is 2000 for all.
        stats.forEach(s => {
            const avgTerm = (maxAvg === minAvg) ? 2000 : ((s.avg - minAvg) / (maxAvg - minAvg)) * 3400 + 600;
            const highTerm = (maxHigh === minHigh) ? 2000 : ((s.high - minHigh) / (maxHigh - minHigh)) * 3400 + 600;
            let cost = Math.ceil(((avgTerm + highTerm) / 2) / 10) * 10;
            cost = cost < 600 ? 500 : Math.min(cost, 4000);
            out[s.id] = cost;
        });
        return out;
    },

    // ---- registration: inject a created country into every runtime global ----
    registerCountry(cc) {
        if (!cc || !cc.name || !cc.divIds) return;
        this.created[cc.name] = cc;
        this._registered[cc.name] = true;

        // competitions (4 leagues + 2 cups)
        cc.divIds.forEach((id, i) => { COMPETITIONS[id] = { name: cc.divNames[i], short: cc.divNames[i], type: 'league', custom: true, country: cc.name }; });
        COMPETITIONS[cc.cups.higher.id] = { name: cc.cups.higher.name, short: cc.cups.higher.name, type: 'cup', custom: true, country: cc.name };
        COMPETITIONS[cc.cups.lower.id] = { name: cc.cups.lower.name, short: cc.cups.lower.name, type: 'cup', custom: true, country: cc.name };

        // league ladder
        COUNTRY_DIVS[cc.name] = cc.divIds.slice();
        cc.divIds.forEach(id => { if (!ALL_LEAGUE_DIVS.includes(id)) ALL_LEAGUE_DIVS.push(id); });
        cc.divIds.forEach((id, i) => { Clubs.DIV_TIERS[id] = i + 1; Clubs.DIV_NAMES[id] = cc.divNames[i]; });
        // fixed international-scouting cost per division (like the stock leagues' INTL_LEAGUE_COST)
        if (typeof Scouts !== 'undefined') { const intl = [7500, 3300, 2100, 1020]; cc.divIds.forEach((id, i) => { Scouts.INTL_LEAGUE_COST[id] = intl[i]; }); }

        // LEAGUES_DATA entry so staticDivSize / _assertDivisionSizes see the created leagues
        LEAGUES_DATA[cc.name] = {
            country: cc.name,
            tiers: cc.divIds.map((id, i) => ({
                id, name: cc.divNames[i], tier: i + 1,
                clubs: cc.clubs.filter(c => c.division === id).map(c => ({ id: c.id, name: c.name, city: '', colors: c.colors, reputation: c.reputation }))
            }))
        };

        // inject the clubs themselves into the live registry
        cc.clubs.forEach(c => {
            if (Clubs.getClubById(c.id)) return;   // idempotent
            const club = {
                id: c.id, name: c.name, city: '', colors: { primary: c.colors.primary, secondary: c.colors.secondary },
                reputation: c.reputation, country: cc.name, division: c.division, tier: Clubs.DIV_TIERS[c.division],
                divisionName: COMPETITIONS[c.division].name, region: null,
                baseRep: c.reputation, anchorRep: c.reputation, seasonDelta: 0, streakDir: null, streakLen: 0,
                logo: c.logo || null
            };
            Clubs.allClubs.push(club);
            if (Clubs._byId) Clubs._byId.set(club.id, club);
            if (c.reserve && Clubs._reserveIds) Clubs._reserveIds.add(c.id);
        });
        // reserve <-> parent links (B-teams wear parent colours, accept youth loans, players return)
        cc.clubs.forEach(c => {
            if (!c.reserve || !c.parentId) return;
            const parent = Clubs.getClubById(c.parentId), res = Clubs.getClubById(c.id);
            if (parent && res) {
                Clubs.reserveParentId[c.id] = parent.id;
                Clubs.parentReserveId[parent.id] = c.id;
                res.colors = { primary: parent.colors.primary, secondary: parent.colors.secondary };
            }
        });

        // scouting regions + per-region cost
        if (cc.regions && cc.regions.length) {
            REGIONS_BY_COUNTRY[cc.name] = cc.regions.map(r => ({ id: r.id, name: r.name, blurb: '' }));
            cc.regions.forEach(r => (r.clubIds || []).forEach(cid => { const c = Clubs.getClubById(cid); if (c) c.region = r.id; }));
            if (typeof Scouts !== 'undefined') Object.assign(Scouts.REGION_REPORT_COST, this.regionCosts(cc));
        }

        // name pool + nationality weight (so squads at this country's clubs are named locally)
        if (typeof NAMES_DATABASE !== 'undefined') NAMES_DATABASE[cc.name] = { firstNames: cc.names.first.slice(), lastNames: cc.names.last.slice() };
        if (typeof NATIONALITY_DISTRIBUTION !== 'undefined' && NATIONALITY_DISTRIBUTION[cc.name] == null) NATIONALITY_DISTRIBUTION[cc.name] = 1;
    }
};
