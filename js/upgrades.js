// ===================== Agency upgrades & sponsors =====================
// All upgrade catalogues live here so they're easy to extend.

// ---- Vehicles (bought in order, each adds to your totals) ----
const VEHICLES = [
    { id: 'company_car', name: 'Company Car', price: 25000, repLimit: 4, players: 3, scoutDiscount: 0.05 },
    { id: 'sports_car', name: 'Sports Car', price: 75000, repLimit: 4, players: 3, scoutDiscount: 0.05 },
    { id: 'limousine', name: 'Limousine', price: 275000, repLimit: 4, players: 4, scoutDiscount: 0.05 },
    { id: 'helicopter', name: 'Helicopter', price: 650000, repLimit: 4, players: 4, scoutDiscount: 0.05 },
    { id: 'yacht', name: 'Yacht', price: 2500000, repLimit: 4, players: 4, scoutDiscount: 0.10 },
    { id: 'private_jet', name: 'Private Jet', price: 15000000, repLimit: 5, players: 5, scoutDiscount: 0.10 },
];

// ---- Properties (bought in order) ----
const PROPERTIES = [
    { id: 'caravan', name: 'Wohnwagen', price: 18000, repLimit: 4, players: 2 },
    { id: 'apartment', name: 'Appartment', price: 350000, repLimit: 4, players: 3 },
    { id: 'house', name: 'House', price: 1000000, repLimit: 4, players: 3 },
    { id: 'penthouse', name: 'Luxury Penthouse', price: 3000000, repLimit: 4, players: 4 },
    { id: 'mansion', name: 'Mansion', price: 8000000, repLimit: 4, players: 5 },
    { id: 'skyscraper', name: 'Skyscraper', price: 25000000, repLimit: 5, players: 6 },
];

// ---- Offices (sequential levels; repLimit is the TOTAL base limit this office grants) ----
const SPONSOR_LEVELS = ['local', 'regional', 'national', 'international', 'worldwide'];
const SPONSOR_LABEL = { local: 'Local', regional: 'Regional', national: 'National', international: 'International', worldwide: 'World Wide' };
const OFFICES = [
    { id: 'home1', name: 'Home Office I', repLimit: 20, weekly: 15, maxScouts: 1, sponsor: 'local' },
    { id: 'home2', name: 'Home Office II', repLimit: 21, weekly: 25, maxScouts: 1, sponsor: 'local' },
    { id: 'home3', name: 'Home Office III', repLimit: 22, weekly: 50, maxScouts: 2, sponsor: 'local' },
    { id: 'cowork1', name: 'Co-working Space I', repLimit: 23, weekly: 85, maxScouts: 3, sponsor: 'regional' },
    { id: 'cowork2', name: 'Co-working Space II', repLimit: 24, weekly: 150, maxScouts: 3, sponsor: 'regional' },
    { id: 'cowork3', name: 'Co-working Space III', repLimit: 25, weekly: 250, maxScouts: 4, sponsor: 'regional' },
    { id: 'trad1', name: 'Traditional Office I', repLimit: 26, weekly: 500, maxScouts: 5, sponsor: 'national' },
    { id: 'trad2', name: 'Traditional Office II', repLimit: 27, weekly: 1000, maxScouts: 5, sponsor: 'national' },
    { id: 'trad3', name: 'Traditional Office III', repLimit: 28, weekly: 2000, maxScouts: 6, sponsor: 'national' },
    { id: 'modern1', name: 'Modern Office I', repLimit: 29, weekly: 5000, maxScouts: 7, sponsor: 'international' },
    { id: 'modern2', name: 'Modern Office II', repLimit: 30, weekly: 10000, maxScouts: 8, sponsor: 'international' },
    { id: 'modern3', name: 'Modern Office III', repLimit: 31, weekly: 15000, maxScouts: 9, sponsor: 'international' },
    { id: 'iconic1', name: 'Iconic Office I', repLimit: 32, weekly: 45000, maxScouts: 10, sponsor: 'worldwide' },
    { id: 'iconic2', name: 'Iconic Office II', repLimit: 33, weekly: 90000, maxScouts: 11, sponsor: 'worldwide' },
    { id: 'iconic3', name: 'Iconic Office III', repLimit: 34, weekly: 195000, maxScouts: 12, sponsor: 'worldwide' },
];

// ---- Sponsor companies, by country then level. Easy to extend: add a country key, or push names. ----
// Tokens {place} and {region} get filled with a local town / region name at offer time.
const SPONSOR_COMPANIES = {
    NL: {
        local: ['Bakker Boris', 'Pizzeria La Neapolitana', 'Tante Emma Winkel', 'Adrian Hijn {place}', 'Doktor Hermans',
            'Doktor Lieverts', 'Doc. Johannitus', 'Tandartsen Oudewijk', 'Mentalcoachings.nl', 'Slagerij {place}', 'Café De Hoek'],
        regional: ['De Nieuwe {region}er', 'TV {region}', 'Humbo Hansen {region}', 'Winkelcentrum Nieuwewijk', '24-7-fit',
            'Autobedrijf Joep', 'Friesdranken Fiona', 'Mediacenter.nl', 'Advocaten De Jong', 'Advocaten Huisema'],
        national: ['Phillippus', 'Post.nl', 'RoboBank', 'Hijnecken', 'Radio Nederland', 'Tele-Holland', 'Het Goede Leven',
            'Prime Insurance', 'Zeker-is-zeker.nl', 'Cryptoleeuw.nl', 'wedden-winnen.nl'],
        international: ['Purello Tires', 'Carwindow', 'WMB', 'Skybus', 'Monolever', 'SkyFranz', 'Alliance', 'Mercury-Bans'],
        worldwide: ['Naik', 'Adadis', 'Popsi', 'Cola Cola', 'Macrohard', 'Pear', 'Stripeify', 'Qatair', 'Soily Arabica',
            'Jones & Jones', 'ApprenticeCard', 'Nile', 'Interflix', 'Kansasinstruments', 'Amyrates', 'Cheep Automobiles',
            'Eddyhat', 'Q-Smartphone', 'OIO'],
    },
};

const Upgrades = {
    // ---- ownership-derived totals ----
    state() {
        const a = GameState.agency;
        if (!a.upgrades) a.upgrades = { officeIndex: 0, vehicleIndex: -1, propertyIndex: -1 };
        return a.upgrades;
    },
    office() { return OFFICES[Math.max(0, Math.min(OFFICES.length - 1, this.state().officeIndex))]; },
    ownedVehicles() { const i = this.state().vehicleIndex; return i < 0 ? [] : VEHICLES.slice(0, i + 1); },
    ownedProperties() { const i = this.state().propertyIndex; return i < 0 ? [] : PROPERTIES.slice(0, i + 1); },
    nextVehicle() { const i = this.state().vehicleIndex + 1; return i < VEHICLES.length ? VEHICLES[i] : null; },
    nextProperty() { const i = this.state().propertyIndex + 1; return i < PROPERTIES.length ? PROPERTIES[i] : null; },
    nextOffice() { const i = this.state().officeIndex + 1; return i < OFFICES.length ? OFFICES[i] : null; },

    repLimit() {
        let r = this.office().repLimit;
        this.ownedVehicles().forEach(v => r += v.repLimit);
        this.ownedProperties().forEach(p => r += p.repLimit);
        r += this.facRepBonus();
        return r;
    },
    playerBonus() {
        let n = this.state().officeIndex;                       // each office upgrade above base = +1
        this.ownedVehicles().forEach(v => n += v.players);
        this.ownedProperties().forEach(p => n += p.players);
        return n;
    },
    scoutDiscount() {
        let d = 0; this.ownedVehicles().forEach(v => d += v.scoutDiscount);
        return Math.min(0.6, d);
    },
    maxScouts() { return this.office().maxScouts; },
    sponsorLevel() { return this.office().sponsor; },
    weeklyOfficeCost() { return this.office().weekly; },

    // ---- purchases ----
    buyVehicle() {
        const v = this.nextVehicle(); if (!v) return { ok: false, message: 'You already own the Private Jet — top of the range.' };
        if (GameState.agency.balance < v.price) return { ok: false, message: `Not enough cash for the ${v.name} (€${UI.money(v.price)}).` };
        GameState.agency.balance -= v.price; this.state().vehicleIndex++;
        GameState.addLog(`Bought a ${v.name} (€${UI.money(v.price)}).`, 'money');
        return { ok: true, message: `${v.name} acquired. Rep limit +${v.repLimit}, client limit +${v.players}, scouting −${Math.round(v.scoutDiscount * 100)}%.` };
    },
    buyProperty() {
        const p = this.nextProperty(); if (!p) return { ok: false, message: 'You already own the Skyscraper — nothing bigger to buy.' };
        if (GameState.agency.balance < p.price) return { ok: false, message: `Not enough cash for the ${p.name} (€${UI.money(p.price)}).` };
        GameState.agency.balance -= p.price; this.state().propertyIndex++;
        GameState.addLog(`Bought a ${p.name} (€${UI.money(p.price)}).`, 'money');
        return { ok: true, message: `${p.name} acquired. Rep limit +${p.repLimit}, client limit +${p.players}.` };
    },
    upgradeOffice() {
        const o = this.nextOffice(); if (!o) return { ok: false, message: 'You already run an Iconic Office III — the very top.' };
        // a fit-out costs four weeks of the new running cost up front
        const fitOut = o.weekly * 4;
        if (GameState.agency.balance < fitOut) return { ok: false, message: `Moving in costs €${UI.money(fitOut)} (4 weeks' rent up front) — you can't cover it yet.` };
        GameState.agency.balance -= fitOut; this.state().officeIndex++;
        GameState.addLog(`Moved to ${o.name} (fit-out €${UI.money(fitOut)}, €${UI.money(o.weekly)}/wk).`, 'money');
        return { ok: true, message: `Welcome to your ${o.name}. Rep limit ${this.repLimit()}, up to ${o.maxScouts} scout(s), ${SPONSOR_LABEL[o.sponsor]} sponsors, +1 client limit. Running cost €${UI.money(o.weekly)}/wk.` };
    },

    // ---- sponsor company picker ----
    _fill(name) {
        if (name.includes('{place}')) {
            const places = Object.keys(typeof CITY_REGION !== 'undefined' ? CITY_REGION : {});
            name = name.replace('{place}', places.length ? places[Math.floor(Math.random() * places.length)] : 'Almelo');
        }
        if (name.includes('{region}')) {
            const regs = (typeof REGIONS !== 'undefined' ? REGIONS : []).map(r => r.name.replace(/\s*\(.*\)$/, ''));
            name = name.replace('{region}', regs.length ? regs[Math.floor(Math.random() * regs.length)] : 'Gelderland');
        }
        return name;
    },
    sponsorPool(level, country = 'NL') {
        const byCountry = SPONSOR_COMPANIES[country] || SPONSOR_COMPANIES.NL;
        return byCountry[level] || byCountry.local;
    },
    pickSponsor(level, country = 'NL') {
        const pool = this.sponsorPool(level, country);
        return this._fill(pool[Math.floor(Math.random() * pool.length)]);
    },

    // ---- SVG art (compact, recognisable) ----
    art(kind, id) {
        const A = UPGRADE_ART[id];
        return `<svg viewBox="0 0 120 80" class="upg-art" xmlns="http://www.w3.org/2000/svg">${A || UPGRADE_ART._fallback}</svg>`;
    }
};

// Compact SVG bodies keyed by upgrade id (drawn on a 120×80 canvas).
const UPGRADE_ART = {
    _fallback: '<rect x="20" y="20" width="80" height="40" rx="4" fill="var(--accent,#60a5fa)" opacity=".3"/>',
    // vehicles
    company_car: '<rect x="18" y="40" width="84" height="18" rx="6" fill="#4b8"/><path d="M32 40 L44 28 H76 L88 40 Z" fill="#6cb"/><circle cx="36" cy="60" r="7" fill="#222"/><circle cx="84" cy="60" r="7" fill="#222"/>',
    sports_car: '<path d="M14 52 Q40 34 70 34 L96 40 Q108 42 106 52 Z" fill="#e0484d"/><path d="M44 38 L66 36 L82 41 L52 41 Z" fill="#b9d7ff" opacity=".8"/><circle cx="36" cy="55" r="8" fill="#222"/><circle cx="88" cy="55" r="8" fill="#222"/>',
    limousine: '<rect x="8" y="42" width="104" height="14" rx="6" fill="#1f2937"/><path d="M26 42 L36 32 H92 L96 42 Z" fill="#374151"/><circle cx="30" cy="58" r="6" fill="#111"/><circle cx="94" cy="58" r="6" fill="#111"/>',
    helicopter: '<rect x="14" y="20" width="86" height="4" rx="2" fill="#555"/><ellipse cx="52" cy="48" rx="34" ry="14" fill="#3b82f6"/><rect x="80" y="44" width="32" height="6" rx="3" fill="#3b82f6"/><rect x="48" y="24" width="4" height="14" fill="#555"/><path d="M30 60 H78" stroke="#333" stroke-width="3"/>',
    yacht: '<path d="M16 56 H104 L94 66 H26 Z" fill="#e5e7eb"/><rect x="34" y="40" width="52" height="16" fill="#fff"/><rect x="40" y="30" width="36" height="10" fill="#cbd5e1"/><path d="M60 6 L60 30" stroke="#888" stroke-width="2"/><path d="M62 8 L82 28 H62 Z" fill="#60a5fa"/>',
    private_jet: '<path d="M10 46 L96 40 L112 44 L96 48 L10 50 Z" fill="#f1f5f9"/><path d="M44 44 L70 22 L78 24 L58 46 Z" fill="#cbd5e1"/><path d="M44 46 L70 64 L78 62 L58 48 Z" fill="#cbd5e1"/><path d="M96 40 L108 30 L110 42 Z" fill="#94a3b8"/>',
    // properties
    caravan: '<rect x="20" y="34" width="64" height="26" rx="6" fill="#fbbf24"/><rect x="60" y="38" width="28" height="14" fill="#fef3c7"/><rect x="26" y="40" width="12" height="10" fill="#fff"/><circle cx="40" cy="62" r="6" fill="#222"/><rect x="84" y="50" width="18" height="4" fill="#555"/>',
    apartment: '<rect x="40" y="20" width="40" height="44" fill="#94a3b8"/><g fill="#1e293b">' + [24, 34, 44, 54].map(y => [46, 58, 70].map(x => `<rect x="${x}" y="${y}" width="6" height="6"/>`).join('')).join('') + '</g>',
    house: '<rect x="34" y="40" width="52" height="24" fill="#e7c8a0"/><path d="M28 40 L60 18 L92 40 Z" fill="#b45309"/><rect x="54" y="48" width="12" height="16" fill="#7c4a1e"/><rect x="38" y="46" width="10" height="10" fill="#bfe3ff"/>',
    penthouse: '<rect x="30" y="22" width="60" height="42" fill="#0f172a"/><rect x="36" y="16" width="48" height="8" fill="#1e293b"/><g fill="#7dd3fc" opacity=".8"><rect x="36" y="28" width="48" height="6"/><rect x="36" y="40" width="48" height="6"/><rect x="36" y="52" width="48" height="6"/></g>',
    mansion: '<rect x="24" y="38" width="72" height="26" fill="#f5f0e6"/><path d="M20 38 L60 16 L100 38 Z" fill="#6b7280"/><rect x="40" y="44" width="10" height="20" fill="#7c4a1e"/><rect x="56" y="44" width="10" height="20" fill="#7c4a1e"/><rect x="30" y="44" width="8" height="8" fill="#bfe3ff"/><rect x="82" y="44" width="8" height="8" fill="#bfe3ff"/>',
    skyscraper: '<rect x="44" y="8" width="32" height="56" fill="#334155"/><path d="M60 2 L60 8" stroke="#888" stroke-width="2"/><g fill="#7dd3fc" opacity=".85">' + [12, 22, 32, 42, 52].map(y => `<rect x="49" y="${y}" width="6" height="6"/><rect x="65" y="${y}" width="6" height="6"/>`).join('') + '</g>',
};
// Office art (15 levels)
Object.assign(UPGRADE_ART, {
    home1: '<rect x="20" y="50" width="80" height="8" fill="#8a5a2b"/><rect x="24" y="42" width="20" height="10" fill="#f8fafc" stroke="#94a3b8"/><path d="M28 47 H40 M28 50 H40" stroke="#94a3b8"/><rect x="50" y="40" width="3" height="12" fill="#1e293b"/><ellipse cx="80" cy="46" rx="8" ry="6" fill="#fff" stroke="#94a3b8"/><rect x="72" y="44" width="3" height="4" fill="#8a5a2b"/>',
    home2: '<rect x="20" y="50" width="80" height="8" fill="#8a5a2b"/><rect x="40" y="36" width="26" height="16" rx="2" fill="#1e293b"/><rect x="43" y="39" width="20" height="11" fill="#60a5fa"/><rect x="38" y="52" width="30" height="3" fill="#334155"/><ellipse cx="84" cy="48" rx="7" ry="5" fill="#fff" stroke="#94a3b8"/>',
    home3: '<rect x="16" y="52" width="88" height="8" fill="#8a5a2b"/><rect x="34" y="32" width="22" height="14" rx="2" fill="#1e293b"/><rect x="36" y="34" width="18" height="10" fill="#60a5fa"/><rect x="60" y="32" width="22" height="14" rx="2" fill="#1e293b"/><rect x="62" y="34" width="18" height="10" fill="#60a5fa"/><rect x="42" y="46" width="32" height="6" fill="#334155"/>',
    cowork1: '<rect x="20" y="24" width="80" height="40" fill="#e5e7eb"/><rect x="36" y="34" width="2" height="30" fill="#94a3b8"/><rect x="72" y="24" width="2" height="40" fill="#94a3b8"/><rect x="44" y="44" width="22" height="10" fill="#60a5fa" opacity=".7"/><circle cx="55" cy="40" r="4" fill="#334155"/>',
    cowork2: '<rect x="18" y="22" width="84" height="42" fill="#eef2f7"/><rect x="40" y="30" width="2" height="34" fill="#94a3b8"/><rect x="46" y="42" width="26" height="12" fill="#60a5fa" opacity=".7"/><circle cx="59" cy="36" r="5" fill="#334155"/><rect x="52" y="40" width="14" height="3" fill="#475569"/>',
    cowork3: '<rect x="18" y="22" width="84" height="42" fill="#eef2f7"/><rect x="44" y="40" width="28" height="14" fill="#60a5fa" opacity=".7"/><circle cx="58" cy="34" r="5" fill="#334155"/><ellipse cx="30" cy="50" rx="6" ry="10" fill="#16a34a"/><rect x="86" y="40" width="8" height="14" fill="#9ca3af"/><circle cx="90" cy="40" r="4" fill="#d1d5db"/>',
    trad1: '<rect x="36" y="28" width="48" height="36" fill="#cbd5e1"/><g fill="#475569">' + [34, 46].map(y => [42, 54, 66].map(x => `<rect x="${x}" y="${y}" width="7" height="7"/>`).join('')).join('') + '</g><rect x="56" y="54" width="10" height="10" fill="#334155"/>',
    trad2: '<rect x="30" y="30" width="54" height="34" fill="#cbd5e1"/><g fill="#475569">' + [36, 48].map(y => [36, 48, 60].map(x => `<rect x="${x}" y="${y}" width="7" height="7"/>`).join('')).join('') + '</g><rect x="86" y="56" width="20" height="8" fill="#64748b"/><circle cx="92" cy="60" r="2" fill="#fff"/><circle cx="100" cy="60" r="2" fill="#fff"/>',
    trad3: '<rect x="34" y="28" width="50" height="36" fill="#cbd5e1"/><g fill="#475569">' + [34, 46].map(y => [40, 52, 64].map(x => `<rect x="${x}" y="${y}" width="7" height="7"/>`).join('')).join('') + '</g><ellipse cx="20" cy="58" rx="8" ry="6" fill="#16a34a"/><ellipse cx="100" cy="58" rx="8" ry="6" fill="#16a34a"/><rect x="56" y="56" width="8" height="8" fill="#334155"/>',
    modern1: '<rect x="38" y="14" width="44" height="50" fill="#475569"/><g fill="#7dd3fc" opacity=".85">' + [20, 32, 44].map(y => `<rect x="44" y="${y}" width="30" height="8"/>`).join('') + '</g>',
    modern2: '<rect x="36" y="8" width="48" height="56" fill="#475569"/><g fill="#7dd3fc" opacity=".85">' + [14, 26, 38, 50].map(y => `<rect x="42" y="${y}" width="36" height="8"/>`).join('') + '</g>',
    modern3: '<rect x="36" y="8" width="48" height="56" fill="#334155"/><g fill="#7dd3fc" opacity=".85">' + [16, 28, 40, 52].map(y => `<rect x="42" y="${y}" width="36" height="8"/>`).join('') + '</g><rect x="40" y="4" width="40" height="4" fill="#16a34a"/>',
    iconic1: '<path d="M40 64 Q44 20 60 12 Q76 20 80 64 Z" fill="#0ea5e9" opacity=".85"/><path d="M52 30 Q60 26 68 30" stroke="#fff" stroke-width="2" fill="none"/><path d="M50 44 Q60 40 70 44" stroke="#fff" stroke-width="2" fill="none"/>',
    iconic2: '<path d="M40 64 Q44 20 60 12 Q76 20 80 64 Z" fill="#0ea5e9" opacity=".85"/><ellipse cx="26" cy="56" rx="8" ry="10" fill="#16a34a"/><ellipse cx="94" cy="56" rx="8" ry="10" fill="#16a34a"/><path d="M52 36 Q60 32 68 36" stroke="#fff" stroke-width="2" fill="none"/>',
    iconic3: '<path d="M40 64 Q44 22 60 14 Q76 22 80 64 Z" fill="#0284c7" opacity=".9"/><circle cx="60" cy="22" r="9" fill="none" stroke="#fbbf24" stroke-width="2"/><path d="M55 22 H65 M60 17 V27" stroke="#fbbf24" stroke-width="2"/>',
});

if (typeof window !== 'undefined') { window.Upgrades = Upgrades; }
// ===================== Equipment, facilities & staff (non-sequential) =====================
const EQUIPMENT = [
    { id: 'resistance_bands', name: 'Resistance Bands', price: 250, dev: 0.5, injury: -0.25, rep: 0, expires: 1 },
    { id: 'dumbbells', name: 'Dumbbells', price: 1000, dev: 0.5, injury: -0.25, rep: 0 },
    { id: 'treadmills', name: 'Treadmills', price: 2500, dev: 0.5, injury: -0.25, rep: 1 },
    { id: 'strength_machine', name: 'Multifunctional Strength Machine', price: 10000, dev: 0.5, injury: -0.25, rep: 1 },
    { id: 'first_aid', name: 'First-Aid Kit', price: 250, dev: 0, injury: -1, rep: 0, expires: 1 },
    { id: 'gym', name: 'Gym', price: 2000000, weekly: 10000, dev: 2, injury: -1, rep: 2, facility: true },
    { id: 'pool', name: 'Swimming Pool', price: 4000000, weekly: 20000, dev: 2, injury: -1, rep: 2, facility: true },
    { id: 'training_ground', name: 'Training Ground', price: 10000000, weekly: 40000, dev: 5, injury: 1, rep: 3, facility: true },
    { id: 'medical_center', name: 'Medical Center', price: 10000000, weekly: 60000, dev: 0, injury: -10, rep: 3, facility: true },
];
const STAFF = [
    { id: 'physio', name: 'Physio', weekly: 1500, dev: 0, injury: -1, rep: 0, max: 5, yearly: 'first_aid', yearlyName: 'First-Aid Kit' },
    { id: 'trainer', name: 'Personal Trainer', weekly: 5000, dev: 1, injury: 0, rep: 1, max: 5, yearly: 'resistance_bands', yearlyName: 'Resistance Bands' },
];

Object.assign(Upgrades, {
    facState() { const a = GameState.agency; if (!a.facilities) a.facilities = { items: [], physios: 0, trainers: 0 }; return a.facilities; },
    equipById(id) { return EQUIPMENT.find(e => e.id === id); },
    staffById(id) { return STAFF.find(s => s.id === id); },
    ownsEquip(id) { return this.facState().items.some(it => it.id === id); },
    ownedEquipment() { return this.facState().items.map(it => this.equipById(it.id)).filter(Boolean); },

    buyEquip(id) {
        const e = this.equipById(id); if (!e) return { ok: false, message: 'Unknown item.' };
        if (this.ownsEquip(id)) return { ok: false, message: `You already have ${e.name}.` };
        if (GameState.agency.balance < e.price) return { ok: false, message: `Not enough cash for ${e.name} (€${UI.money(e.price)}).` };
        GameState.agency.balance -= e.price;
        this.facState().items.push({ id, expiresSeason: e.expires ? GameState.seasonStartYear + e.expires : null });
        GameState.addLog(`Bought ${e.name} (€${UI.money(e.price)}).`, 'money');
        const eff = [e.dev ? `+${e.dev}% development` : '', e.injury ? `${e.injury > 0 ? '+' : ''}${e.injury}% injury risk` : '', e.rep ? `+${e.rep} rep limit` : '', e.expires ? `expires in ${e.expires} year` : ''].filter(Boolean).join(', ');
        return { ok: true, message: `${e.name} added. ${eff}.` };
    },
    sellNoteEquip() {},

    hireStaff(id) {
        const s = this.staffById(id); if (!s) return { ok: false, message: 'Unknown role.' };
        const st = this.facState(); const key = id === 'physio' ? 'physios' : 'trainers';
        if (st[key] >= s.max) return { ok: false, message: `You already employ the maximum of ${s.max} ${s.name}s.` };
        st[key] += 1;
        // a freshly hired member brings their yearly consumable straight away
        if (s.yearly && !this.ownsEquip(s.yearly)) st.items.push({ id: s.yearly, expiresSeason: GameState.seasonStartYear + 1 });
        GameState.addLog(`Hired a ${s.name} (€${UI.money(s.weekly)}/wk).`, 'money');
        return { ok: true, message: `${s.name} hired — €${UI.money(s.weekly)}/wk. They restock ${s.yearlyName} every year${s.dev ? `, +${s.dev}% development` : ''}${s.injury ? `, ${s.injury}% injury risk` : ''}${s.rep ? `, +${s.rep} rep limit` : ''}.` };
    },
    releaseStaff(id) {
        const st = this.facState(); const key = id === 'physio' ? 'physios' : 'trainers';
        if (st[key] <= 0) return { ok: false, message: 'None employed.' };
        st[key] -= 1;
        GameState.addLog(`Released a ${this.staffById(id).name}.`, 'info');
        return { ok: true, message: `${this.staffById(id).name} released.` };
    },
    staffCount(id) { const st = this.facState(); return id === 'physio' ? st.physios : st.trainers; },

    facDevBonus() { let d = 0; this.ownedEquipment().forEach(e => d += (e.dev || 0)); d += this.facState().trainers * 1; return d; },
    facInjuryBonus() { let i = 0; this.ownedEquipment().forEach(e => i += (e.injury || 0)); i += this.facState().physios * (-1); return i; },
    facRepBonus() { let r = 0; this.ownedEquipment().forEach(e => r += (e.rep || 0)); r += this.facState().trainers * 1; return r; },
    weeklyFacCost() { let c = 0; this.ownedEquipment().forEach(e => { if (e.facility) c += (e.weekly || 0); }); const st = this.facState(); c += st.physios * 1500 + st.trainers * 5000; return c; },
    devSpeedMult() { return 1 + this.facDevBonus() / 100; },
    injuryRiskMult() { return Math.max(0.1, Math.min(2, 1 + this.facInjuryBonus() / 100)); },

    // yearly upkeep: expire lapsed consumables, then let staff restock theirs
    facRollover() {
        const st = this.facState();
        st.items = st.items.filter(it => it.expiresSeason == null || it.expiresSeason >= GameState.seasonStartYear);
        const refresh = (cid) => { const ex = st.items.find(it => it.id === cid); if (ex) ex.expiresSeason = GameState.seasonStartYear + 1; else st.items.push({ id: cid, expiresSeason: GameState.seasonStartYear + 1 }); };
        if (st.physios > 0) refresh('first_aid');
        if (st.trainers > 0) refresh('resistance_bands');
    },
});

if (typeof window !== 'undefined') { window.Upgrades = Upgrades; }
