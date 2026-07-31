// ============================================================
//  Scout system
//  Hire a scout for a weekly salary, then ASSIGN him to a region
//  (one-off fee; better regions cost more). Only assigned scouts
//  produce reports. Better scouts find better, more talents.
// ============================================================
const FIRST_NAMES_SCOUT = ['Sem', 'Teun', 'Esmee', 'Lieke', 'Emma', 'Stijn', 'Patrick', 'Hans', 'Piet', 'Wim', 'Cor', 'Jan', 'Ruud', 'Theo', 'Frank', 'Gerard', 'Sjaak', 'Henk', 'Bas', 'Marcel', 'Ronald'];
const LAST_NAMES_SCOUT = ['Visser', 'Bakker', 'de Wit', 'Janssen', 'Smit', 'Vermeer', 'Kuiper', 'Blom', 'Dekker', 'Hofman', 'Mulder', 'Kok'];
const SCOUT_NAMES = {
    Netherlands: { first: FIRST_NAMES_SCOUT, last: LAST_NAMES_SCOUT },
    England: {
        first: ['James', 'Jack', 'Harry', 'George', 'Oliver', 'Thomas', 'William', 'Charlie', 'Daniel', 'Joseph', 'Samuel', 'Lewis', 'Ryan', 'Liam', 'Nathan', 'Scott', 'Wayne', 'Gary', 'Paul', 'Steve', 'Mark', 'Lee', 'Ian', 'Phil', 'Dean', 'Craig', 'Darren', 'Neil', 'Alan', 'Terry', 'Gemma', 'Anne', 'Patros', 'Hannah', 'Patty', 'Mo'],
        last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green', 'Hall', 'Wood', 'Harris', 'Clarke', 'Jackson', 'Turner', 'Hill', 'Cooper', 'Ward', 'Morris', 'Moore', 'King', 'Baker', 'Morgan']
    },
    Germany: {
        first: ['Maria', 'Emma', 'Sophia', 'Martina', 'Lukas', 'Kristof', 'Mahmoud','Michael', 'Thomas', 'Andreas', 'Stefan', 'Klaus', 'Jürgen', 'Wolfgang', 'Dieter', 'Uwe', 'Matthias', 'Frank', 'Markus', 'Christian', 'Sebastian', 'Lukas', 'Felix', 'Jonas', 'Tobias', 'Sven', 'Dirk', 'Bernd', 'Rainer', 'Horst', 'Günter', 'Helmut', 'Manfred', 'Rolf', 'Jörg', 'Kai', 'Oliver'],
        last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'Kaiser']
    },
    Spain: {
        first: ['Alexia', 'Salma', 'Maricarla', 'Antonio', 'Manuel', 'José', 'Francisco', 'David', 'Juan', 'Javier', 'Daniel', 'Carlos', 'Miguel', 'Alejandro', 'Rafael', 'Pablo', 'Sergio', 'Fernando', 'Jorge', 'Alberto', 'Luis', 'Álvaro', 'Adrián', 'Diego', 'Rubén', 'Óscar', 'Raúl', 'Iván', 'Pedro', 'Andrés', 'Ángel', 'Marcos', 'Gonzalo'],
        last: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Molina', 'Blanco', 'Castro', 'Ortega']
    },
    Switzerland: {
        first: ['Julia', 'Joelle', 'Andrea', 'Betty','Lukas', 'Simon', 'Fabian', 'Marco', 'Jonas', 'Sandro', 'Manuel', 'Adrian', 'Reto', 'Beat', 'Urs', 'Christian', 'Thomas', 'Daniel', 'Stefan', 'Martin', 'Jean', 'Pierre', 'Luc', 'Mathieu', 'Guillaume', 'Bastien', 'Alessandro', 'Diego', 'Francesco', 'Pietro', 'Andreas', 'Florian', 'Patrick', 'Hans'],
        last: ['Müller', 'Meier', 'Schmid', 'Keller', 'Weber', 'Huber', 'Steiner', 'Fischer', 'Gerber', 'Brunner', 'Baumann', 'Moser', 'Zimmermann', 'Frei', 'Widmer', 'Graf', 'Favre', 'Dubois', 'Girard', 'Richard', 'Bernasconi', 'Bianchi', 'Fontana', 'Ferrari', 'Rossi', 'Sutter', 'Studer', 'Wyss', 'Egli', 'Vogel']
    },
    Italy: {
        first: ['Maria', 'Giulia', 'Patricia','Alessandro', 'Andrea', 'Marco', 'Francesco', 'Giuseppe', 'Antonio', 'Giovanni', 'Roberto', 'Stefano', 'Paolo', 'Fabio', 'Luca', 'Matteo', 'Lorenzo', 'Davide', 'Simone', 'Riccardo', 'Massimo', 'Claudio', 'Sergio', 'Maurizio', 'Gianluca', 'Vincenzo', 'Salvatore', 'Domenico', 'Michele', 'Bruno', 'Franco', 'Carlo', 'Enrico'],
        last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone']
    },
    France: {
        first: ['Juliette', 'Marie', 'René', 'Jean', 'Pierre', 'Michel', 'Philippe', 'Alain', 'Nicolas', 'Christophe', 'Laurent', 'Olivier', 'Thierry', 'David', 'Julien', 'Sébastien', 'Stéphane', 'Pascal', 'Frédéric', 'Antoine', 'Guillaume', 'Maxime', 'Alexandre', 'Romain', 'Vincent', 'Bernard', 'Patrick', 'Gérard', 'Didier', 'Franck', 'Bruno', 'Yannick', 'Florian'],
        last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefèvre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Rousseau', 'Blanc']
    },
    Portugal: {
        first: ['Maria', 'Ana', 'Isabel', 'João', 'Francisco', 'Miguel', 'Gonçalo', 'Tomás', 'Rodrigo', 'Pedro', 'Tiago', 'Diogo', 'Rafael', 'André', 'Daniel', 'Bruno', 'Nuno', 'Hugo', 'Rui', 'Ricardo', 'Fábio', 'Sérgio', 'Vítor', 'Luís', 'Paulo', 'Carlos', 'José', 'António', 'Manuel', 'Jorge', 'Filipe', 'Nélson', 'Márcio'],
        last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha', 'Neves']
    },
    Belgium: {
        first: ['Emma', 'Anna', 'Sophie', 'Lucas', 'Louis', 'Nathan', 'Thomas', 'Wout', 'Arthur', 'Jules', 'Victor', 'Jan', 'Kevin', 'Thibaut', 'Maxime', 'Simon', 'Robbe', 'Seppe', 'Dries', 'Bram', 'Sander', 'Ruben', 'Bart', 'Koen', 'Tom', 'Nicolas', 'Antoine', 'Guillaume', 'Florian', 'Mathieu', 'Julien', 'Cédric', 'Michel'],
        last: ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Willems', 'Mertens', 'Claes', 'Goossens', 'Wouters', 'De Smet', 'Dubois', 'Lambert', 'Dupont', 'Martin', 'Simon', 'Van Damme', 'De Clercq', 'Vermeulen', 'Segers', 'Hermans', 'Michiels', 'Aerts', 'Verstraeten', 'Van Hecke', 'Leroy', 'Renard', 'Lejeune', 'Thys', 'Coppens', 'De Backer']
    }
};

const Scouts = {
    scoutName() {
        const hc = (typeof GameState !== 'undefined' && GameState.homeCountry) || 'Netherlands';
        const set = SCOUT_NAMES[hc] || SCOUT_NAMES.Netherlands;
        return set.first[Math.floor(Rng.next() * set.first.length)] + ' ' +
            set.last[Math.floor(Rng.next() * set.last.length)];
    },
    _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },

    // weekly salary grows steeply with quality (~€3.3k at 70, €6.2k at 80, €10.7k at 90, €16.6k at 99)
    salaryFor(q) { return Math.round(17400 * Math.pow(Math.max(0, q) / 100, 4.63) / 10) * 10; },
    _q(mean, sd) { return Math.max(3, Math.min(99, Math.round(PlayerGen.gauss(mean, sd)))); },

    // What you can attract depends on agency reputation. Three suggestions, scaled to your standing,
    // never below quality 15, with the occasional stand-out available — a genuine 99 is rare but possible.
    _clampQ(q) { return Math.max(15, Math.min(99, Math.round(q))); },
    titleFor(q) { return q >= 70 ? 'Chief scout' : q >= 52 ? 'Senior scout' : q >= 34 ? 'Lead scout' : q >= 22 ? 'Regional scout' : 'Local talent spotter'; },
    catalogue() {
        const rep = GameState.agency.reputation;
        const base = Math.max(18, rep);
        // Three suggestions scaled to your standing. Recalibrated (B4) so you DON'T max out at quality 99
        // long before the reputation cap: at ~85 rep the best on offer is mid-80s, and genuine 95–99
        // scouts stay rare and only turn up as you approach the top of the reputation ladder.
        const q1 = this._clampQ(PlayerGen.gauss(base * 0.70, 4));
        const q2 = this._clampQ(PlayerGen.gauss(base * 0.86, 4));
        const q3 = Rng.next() < 0.22 ? this._clampQ(PlayerGen.gauss(base * 1.0, 5))   // occasional stand-out
            : this._clampQ(PlayerGen.gauss(base * 0.92, 4));
        return [q1, q2, q3].map(q => this.makeOffer(this.titleFor(q), q));
    },
    makeOffer(title, quality) {
        const weeklyCost = Math.round(this.salaryFor(quality) * (0.85 + Rng.next() * 0.30) / 10) * 10;
        return {
            id: 's_' + Rng.next().toString(36).slice(2, 8),
            name: this.scoutName(), title,
            quality, weeklyCost, region: null, maxTalentAge: 22
        };
    },
    setMaxAge(scoutId, age) {
        const s = GameState.agency.scouts.find(x => x.id === scoutId);
        if (s) s.maxTalentAge = Math.max(15, Math.min(22, Math.round(age)));
        return s ? s.maxTalentAge : null;
    },

    // fixed per-report cost per region (from clubs_by_region.xlsx, row 13). Scout discount still applies.
    REGION_REPORT_COST: {
        // Netherlands
        'noord': 1240, 'oost': 2070, 'noord-holland': 3560, 'middelland': 600, 'zuid': 3830, 'zuid-holland': 1960,
        // England
        'greater-london': 4000, 'north-west': 2910, 'south-east': 970, 'west-midlands': 2320, 'north-east': 2100, 'yorkshire': 1180, 'east-midlands': 1030, 'south-west': 1150, 'east-england': 600,
        // Germany
        'bayern': 2690, 'nordosten': 700, 'ostdeutschland': 2900, 'nrw': 3170, 'sudwesten': 3040, 'hessen-niedersachsen': 2220, 'norddeutschland': 1020,
        // Spain
        'sur de españa': 600, 'españa central': 2790, 'noreste de españa': 4000, 'noroeste de españa': 1140, 'nor de españa': 1130, 'islas': 1530,
        // Switzerland
        'westschweiz': 500, 'vaud': 2320, 'genève': 2780, 'nordwestschweiz': 3050, 'nordostschweiz': 2190, 'ostschweiz': 2780, 'innerschweiz': 600, 'bern': 3750, 'ticinovalais': 1910,
        // Italy
        'nordovest italia': 4000, 'nordest italia': 2310, 'italia centrale': 1450, 'sud italia': 600, 'isole': 1120,
        // France
        'N-O France': 2620, 'N-E France': 2370, 'centre France': 2960, 'S-O France': 1340, 'S-E France': 1910, 'Îles': 600,
        // Portugal
        'Noroeste': 3550, 'Norte': 2330, 'Centro': 850, 'Lisbon': 3750, 'Sul': 600, 'Ilhas': 1770,
        // Belgium
        'N-W Belgium': 2400, 'Noord België': 1850, 'N-E Belgium': 2120, 'brussels': 3850, 'S-O Belgique': 610, 'S-E Belgique': 1370
    },
    // cost charged PER report for a region (fixed price, then scout discount applied)
    regionReportCost(regionId) {
        const base = this.REGION_REPORT_COST[regionId] != null ? this.REGION_REPORT_COST[regionId] : 600;
        const disc = (typeof Upgrades !== 'undefined') ? Upgrades.scoutDiscount() : 0;
        return Math.round((base * (1 - disc)) / 10) * 10;
    },
    // the dearest home region sets the baseline for international travel costs
    homeRegionMaxCost() {
        const hc = (typeof GameState !== 'undefined' && GameState.homeCountry) || 'Netherlands';
        return Math.max(...regionsForCountry(hc).map(r => this.regionReportCost(r.id)));
    },
    // fixed per-report cost of scouting each foreign league (from clubs_by_region.xlsx, "Clubs by
    // Division" sheet, row 13). Absolute figures — international scouting no longer scales off the
    // player's home country. Scout discount still applies (see intlLeagueCost).
    INTL_LEAGUE_COST: {
        // Netherlands
        ERE: 7880, EED: 4830, TWD: 3100, DRD: 1320,
        // England
        PREM: 20000, CHAMP: 9220, LEAGUE1: 4900, LEAGUE2: 2250, Natleague: 1840,
        // Germany
        BUNDES: 18550, '2BUNDES': 9620, '3LIGA': 4840, REGIONAL1: 2090, REGIONAL2: 1770, REGIONAL3: 1110,
        // Spain
        LaLiga: 18470, LaLiga2: 9070, PrimeraSup: 4610, PrimeraInf: 2020, Segunda: 1680,
        // Switzerland
        SuperLeagueCH: 6000, ChallengeLeague: 3000, PromotionLeague: 1500, '1.LigaCH': 750, '2.LigaCH': 600,
        // Italy
        SerieA: 16830, SerieB: 8730, SerieC: 4640, SerieD: 1940,
        // Portugal
        LigaPortugal: 7880, LigaPortugal2: 3760, Liga3: 2250, Liga4: 920,
        // France
        Ligue1: 17340, Ligue2: 8400, Ligue3: 4560, Ligue4: 2000, Ligue5: 1640,
        // Belgium
        JupilerProLeague: 7340, ChallengerProLeague: 3530, BelgianDivision1: 2240, BelgianDivision2: 1020
    },
    // per-report cost of scouting a foreign league, as a multiple of the dearest home region — kept
    // only as a fallback for any division not listed in INTL_LEAGUE_COST above
    intlLeagueMult(div) {
        const m = { Natleague: 1.5, LEAGUE2: 2.5, LEAGUE1: 2.5, CHAMP: 3, PREM: 5, DRD: 1.5, TWD: 2.5, EED: 3, ERE: 5, REGIONAL3: 1.2, REGIONAL2: 1.5, REGIONAL1: 2, '3LIGA': 2.5, '2BUNDES': 3, BUNDES: 4.5, Segunda: 1.5, PrimeraInf: 2, PrimeraSup: 2.5, LaLiga2: 3, LaLiga: 4.8, '2.LigaCH': 1.1, '1.LigaCH': 1.4, PromotionLeague: 2.3, ChallengeLeague: 2.8, SuperLeagueCH: 4.8 };
        return m[div] || 2.5;
    },
    intlLeagueCost(div) {
        const disc = (typeof Upgrades !== 'undefined') ? Upgrades.scoutDiscount() : 0;
        const base = this.INTL_LEAGUE_COST[div] != null ? this.INTL_LEAGUE_COST[div]
            : Math.round(this.homeRegionMaxCost() * this.intlLeagueMult(div));   // fallback for any unlisted division
        return Math.round((base * (1 - disc)) / 10) * 10;
    },
    // a stronger league (higher average reputation/Elo) lets the SAME scout unearth better talents more often
    leagueQualityBonus(div) {
        const cs = Clubs.getClubsByDivision(div); if (!cs.length) return 0;
        const avg = cs.reduce((s, c) => s + c.reputation, 0) / cs.length;
        return Math.max(0, Math.round((avg - 40) * 0.45));
    },
    // a scout must be good enough to work a given foreign league: by tier 65/60/50/40/30
    minScoutQualityFor(division) {
        const tier = ((Clubs.getClubsByDivision(division)[0] || {}).tier) || 3;
        return ({ 1: 65, 2: 60, 3: 50, 4: 40, 5: 30, 6: 25 })[tier] || 50;
    },
    // foreign countries you may scout in (everything except your home country)
    intlCountries() {
        const hc = (typeof GameState !== 'undefined' && GameState.homeCountry) || 'Netherlands';
        return Object.keys(REGIONS_BY_COUNTRY).filter(c => c !== hc);
    },

    // the hiring market refreshes only every 2 weeks (not on every visit); a hired scout's
    // slot stays empty until the next refresh
    market() {
        const ag = GameState.agency;
        const now = GameState.absWeek();
        if (!ag.scoutMarket || ag.scoutMarketWeek == null || (now - ag.scoutMarketWeek) >= 2) {
            ag.scoutMarket = this.catalogue();
            ag.scoutMarketWeek = now;
        }
        return ag.scoutMarket;
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
        // remove him from the market; the freed slot refills at the next 2-week refresh
        if (ag.scoutMarket) ag.scoutMarket = ag.scoutMarket.filter(o => o.id !== offer.id);
        GameState.addLog(`Hired ${offer.name} (${offer.title}, quality ${offer.quality}) for €${offer.weeklyCost}/wk.`, 'scout');
        return { ok: true, message: `${offer.name} hired. Assign him to a region so he can start scouting.` };
    },

    assignRegion(scoutId, regionId) {
        const ag = GameState.agency;
        const s = ag.scouts.find(x => x.id === scoutId);
        if (!s) return { ok: false, message: 'Unknown scout.' };
        if (s.region === regionId && !s.league) return { ok: false, message: `${s.name} already covers ${regionName(regionId)}.` };
        s.region = regionId; s.league = null; s.country = null;
        s.weeksUntilFind = this.nextFindDelay(s.quality);
        GameState.addLog(`${s.name} assigned to ${regionName(regionId)} (€${this.regionReportCost(regionId)}/report).`, 'scout');
        return { ok: true, message: `${s.name} now scouts ${regionName(regionId)} (€${this.regionReportCost(regionId)} per report). First report in ~${s.weeksUntilFind} weeks.` };
    },
    assignLeague(scoutId, country, division) {
        const ag = GameState.agency;
        const s = ag.scouts.find(x => x.id === scoutId);
        if (!s) return { ok: false, message: 'Unknown scout.' };
        if (typeof Agency !== 'undefined' && Agency.intlSuspended && Agency.intlSuspended()) return { ok: false, message: `International scouting is suspended for ${Agency.intlSuspendWeeksLeft()} more week(s) after an unpaid licence.` };
        if (typeof Agency !== 'undefined' && !Agency.hasIntlLicence()) return { ok: false, message: 'You need a valid International Scouting Licence (buy it in the Agency tab).' };
        if (!this.intlCountries().includes(country)) return { ok: false, message: 'You can only scout abroad.' };
        if (!(COUNTRY_DIVS[country] || []).includes(division)) return { ok: false, message: 'That league is not in the chosen country.' };
        const minQ = this.minScoutQualityFor(division);
        if (s.quality < minQ) {
            const nm0 = (COMPETITIONS[division] || {}).name || division;
            return { ok: false, message: `${s.name} (quality ${s.quality}) isn't good enough to scout ${nm0} — that league needs a scout of at least ${minQ}.` };
        }
        s.league = division; s.country = country; s.region = null;
        s.weeksUntilFind = this.nextFindDelay(s.quality);
        const nm = (COMPETITIONS[division] || {}).name || division;
        GameState.addLog(`${s.name} sent abroad to scout ${nm} (${country}) — €${this.intlLeagueCost(division)}/report.`, 'scout');
        return { ok: true, message: `${s.name} now scouts ${nm} in ${country} (€${this.intlLeagueCost(division)} per report). First report in ~${s.weeksUntilFind} weeks.` };
    },

    release(scoutId) {
        const ag = GameState.agency;
        const idx = ag.scouts.findIndex(s => s.id === scoutId);
        if (idx >= 0) { const s = ag.scouts[idx]; ag.scouts.splice(idx, 1); GameState.addLog(`Released scout ${s.name}.`, 'scout'); }
    },
    // pull a scout off his region/league without releasing him — still on the payroll,
    // still worth the occasional stray domestic find (see tick()'s idle branch), just
    // not burning report fees until reassigned
    setIdle(scoutId) {
        const ag = GameState.agency;
        const s = ag.scouts.find(x => x.id === scoutId);
        if (!s) return { ok: false, message: 'Unknown scout.' };
        if (!s.region && !s.league) return { ok: false, message: `${s.name} is already idle.` };
        s.region = null; s.league = null; s.country = null;
        GameState.addLog(`${s.name} set to idle.`, 'scout');
        return { ok: true, message: `${s.name} is idle — no more report fees until you reassign him, though he'll still turn up the occasional find on his own.` };
    },

    // reports arrive every 6-7 weeks
    nextFindDelay(quality = 50) { return 6 + Math.floor(Rng.next() * 2) + (quality < 30 ? 3 : quality < 50 ? 1 : 0); },

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
        const [loA, hiA, , cap] = this.tierRanges(q);   // band + ceiling; centre/spread computed continuously below
        // Potential scales continuously with scout quality — no more flat tiers where a 91 and a 99 scout
        // find identical talent. Centre climbs from ~38 (raw q15) to 90 for the very best (q99), and the
        // spread tightens from 8.5 down to 3.494 at the top, so an elite scout reliably centres on 90 and
        // only rarely (~0.5%) tops out at 99. Every step of quality means better AND more consistent finds.
        const qc = this._clamp(q, 15, 99);
        const centre = 38 + (qc - 15) * 0.619;   // 38 @ q15  →  90 @ q99
        const sd = 8.5 - (qc - 15) * 0.0596;     // 8.5 @ q15 →  3.494 @ q99
        let potential = Math.round(PlayerGen.gauss(centre, sd));
        potential = Math.max(Math.max(20, loA), Math.min(cap, potential));
        // spread current ability ACROSS the tier band [loA..hiA], driven by age + potential + genuine noise
        const ageN = Math.max(0, Math.min(1, (age - 15) / 7));                 // 15y→0 .. 22y→1
        const potN = Math.max(0, Math.min(1, (potential - loA) / Math.max(1, cap - loA)));
        let frac = 0.22 + ageN * 0.42 + potN * 0.22 + (Rng.next() - 0.5) * 0.42;
        frac = Math.max(0, Math.min(1, frac));
        let ability = Math.round(loA + frac * (hiA - loA));
        ability = Math.min(ability, potential);                                // never above his ceiling
        // very rare precocious teenager (only the best scouts ever see these, <0.5%)
        if (q >= 95 && age <= 18 && Rng.next() < 0.004) ability = Math.min(potential, hiA, ability + 8 + Math.floor(Rng.next() * 6));
        potential = Math.max(potential, ability);
        return { ability, potential };
    },

    // ---- scouting brief: a target ability tier, plus optional position (B4) ----
    // A tier sets the POTENTIAL band to aim for; the scout's quality sets how reliably he turns up a fit
    // and how high within the band it lands. So a top scout can be pointed at a lower tier to farm
    // low-ability/high-potential gems, and even he only occasionally unearths a superstar.
    TIERS: {
        any: { label: 'Any level' },
        dev: { pot: [38, 58], label: '4th-tier prospect' },
        pro: { pot: [55, 72], label: '3rd-tier / lower-league' },
        top: { pot: [70, 85], label: 'top-league talent' },
        elite: { pot: [85, 99], label: 'international superstar' },
    },
    // localized tier label ('tier.<key>'), falling back to the raw English label
    tierLabel(key) {
        const raw = (this.TIERS[key] && this.TIERS[key].label) || key;
        if (typeof I18n === 'undefined') return raw;
        const s = I18n.t('tier.' + key);
        return s === 'tier.' + key ? raw : s;
    },
    _tierReliability(q, tierKey) {
        const need = { dev: 15, pro: 35, top: 60, elite: 82 }[tierKey] || 15;
        const cap = { dev: 0.95, pro: 0.9, top: 0.8, elite: 0.6 }[tierKey] || 0.9;   // ceiling even for a 99
        if (q >= need) return Math.min(cap, 0.5 + (q - need) / 100);
        return Math.max(0.04, cap * Math.pow(q / need, 2.5));                        // below the floor: rare
    },
    setPos(scoutId, pos) { const s = GameState.agency.scouts.find(x => x.id === scoutId); if (s) s.targetPos = pos || null; },
    setTier(scoutId, tier) { const s = GameState.agency.scouts.find(x => x.id === scoutId); if (s) s.targetTier = tier && tier !== 'any' ? tier : null; },

    // roll a talent honouring the scout's brief. Returns { ability:null } when nothing fits the chosen
    // tier this report (which is how a mismatched brief simply yields fewer finds).
    rolledTalentFiltered(q, age, s) {
        let { ability, potential } = this.rolledTalent(q, age);
        const tier = s && s.targetTier && this.TIERS[s.targetTier] && this.TIERS[s.targetTier].pot ? this.TIERS[s.targetTier] : null;
        if (tier) {
            if (Rng.next() > this._tierReliability(q, s.targetTier)) return { ability: null, potential: null };
            const [lo, hi] = tier.pot;
            const qFrac = Math.max(0, Math.min(1, (q - 20) / 79));                   // better scouts land higher in the band
            potential = Math.round(lo + (hi - lo) * (0.30 + qFrac * 0.55) + PlayerGen.gauss(0, 4));
            potential = Math.max(lo, Math.min(hi, potential));
            const ageN = Math.max(0, Math.min(1, (age - 15) / 7));                   // younger => further below his ceiling
            ability = Math.max(5, Math.min(potential, Math.round(potential * (0.35 + ageN * 0.4) + PlayerGen.gauss(0, 4))));
        }
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

    _prospectAge(maxAge) { const m = Math.max(15, Math.min(22, maxAge || 22)); return 15 + Math.floor(Math.pow(Rng.next(), 1.6) * (m - 15 + 1)); },

    // called once per week from the simulation
    tick() {
        const ag = GameState.agency;
        const found = [];
        ag.scouts.forEach(s => {
            if (!s.region && !s.league) {
                // an idle scout on the payroll still keeps his ear to the ground: 1-2 finds a season, anywhere in the home country
                if (Rng.next() < 0.03) {
                    const hc = GameState.homeCountry || 'Netherlands';
                    const homeClubs = Clubs.allClubs.filter(c => c.country === hc);
                    const club = homeClubs[Math.floor(Rng.next() * homeClubs.length)] || Clubs.allClubs[Math.floor(Rng.next() * Clubs.allClubs.length)];
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

            // domestic = region pool at scout quality; international = league pool, with a quality boost for stronger leagues
            const intl = !!s.league;
            const pool = intl ? Clubs.getClubsByDivision(s.league) : Clubs.getClubsByRegion(s.region);
            if (!pool.length) return;
            const effQ = intl ? Math.min(99, s.quality + this.leagueQualityBonus(s.league)) : s.quality;
            const span = Math.max(0, Math.min(7, (s.maxTalentAge || 22) - 15));   // wider age window -> more to find
            const spanF = span / 7;                                              // 0 (only 15yo) .. 1 (15-22)
            let n = s.quality < 30 ? Math.floor(Rng.next() * 2)               // 0-1 (sometimes empty-handed)
                : s.quality < 50 ? 1 + Math.floor(Rng.next() * 2)            // 1-2
                    : 2 + (Rng.next() < 0.5 ? 1 : 0);                        // 2-3
            if (n === 0 && Rng.next() < 0.25 + spanF * 0.5) n = 1;            // a broad search still tends to turn something up
            if (Rng.next() < spanF * 0.25) n += 1;                            // and occasionally one extra
            const batch = [];
            for (let i = 0; i < n; i++) {
                const age = this._prospectAge(s.maxTalentAge);
                // narrowing the brief (a specific position) turns up fewer players overall (B4)
                if (s.targetPos && Rng.next() < 0.35) continue;
                const { ability, potential } = this.rolledTalentFiltered(effQ, age, s);
                if (ability == null) continue;   // no player fitting the chosen tier turned up this time
                const club = this.pickRegionalClub(pool, ability);
                if (!club) continue;
                const prospect = PlayerGen.makeProspect(club, { ability, potential, age, position: s.targetPos || undefined });
                prospect.knownToAgent = true;
                prospect.discoveredVia = 'scout:' + s.name;
                prospect.discoveredWeek = GameState.absWeek();
                prospect.scoutQuality = s.quality;
                Scouting.generateReport(prospect, s.quality);
                GameState.players.push(prospect);
                batch.push(prospect);
            }
            if (batch.length) {
                const cost = intl ? this.intlLeagueCost(s.league) : this.regionReportCost(s.region);
                GameState.agency.balance -= cost; GameState.addFinance('Scout reports', -cost);
                found.push({ scout: s.name, region: s.region || null, league: s.league || null, country: s.country || null, players: batch, cost });
            } else {
                found.push({ scout: s.name, region: s.region || null, league: s.league || null, country: s.country || null, players: [], cost: 0, none: true });   // report a blank trip
            }
        });
        return found;
    }
};
