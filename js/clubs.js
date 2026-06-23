// Clubs and Leagues Data
const LEAGUES_DATA = {
    "Netherlands": {
        country: "Netherlands",
        tiers: [
            {
                id: "ERE",
                name: "Eredivisie",
                tier: 1,
                clubs: [
                    { id: "ajax", name: "Ajax", city: "Amsterdam", colors: { primary: "#D2122E", secondary: "#FFFFFF" }, reputation: 92 },
                    { id: "psv", name: "PSV", city: "Eindhoven", colors: { primary: "#ED1C24", secondary: "#FFFFFF" }, reputation: 92 },
                    { id: "feyenoord", name: "Feyenoord", city: "Rotterdam", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "az", name: "AZ", city: "Alkmaar", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 82 },
                    { id: "twente", name: "Twente", city: "Enschede", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "utrecht", name: "Utrecht", city: "Utrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "heerenveen", name: "Heerenveen", city: "Heerenveen", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "groningen", name: "Groningen", city: "Groningen", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "vitesse", name: "Vitesse", city: "Arnhem", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 74 },
                    { id: "nec", name: "NEC", city: "Nijmegen", colors: { primary: "#C8102E", secondary: "#008000" }, reputation: 74 },
                    { id: "sparta", name: "Sparta", city: "Rotterdam", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "cambuur", name: "Cambuur", city: "Leeuwarden", colors: { primary: "#FFDD00", secondary: "#0066CC" }, reputation: 64 },
                    { id: "zwolle", name: "Zwolle", city: "Zwolle", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "fortuna", name: "Fortuna", city: "Sittard", colors: { primary: "#FFDD00", secondary: "#008000" }, reputation: 63 },
                    { id: "emmen", name: "Emmen", city: "Emmen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "almere", name: "Almere City", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 58 },
                    { id: "excelsior", name: "Excelsior", city: "Rotterdam", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 62 },
                    { id: "volendam", name: "Volendam", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 59 }
                ]
            },
            {
                id: "EED",
                name: "Eerste Divisie",
                tier: 2,
                clubs: [
                    { id: "jong-ajax", name: "Jong Ajax", city: "Amsterdam", colors: { primary: "#D2122E", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "jong-psv", name: "Jong PSV", city: "Eindhoven", colors: { primary: "#ED1C24", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "den-haag", name: "Den Haag", city: "Den Haag", colors: { primary: "#FFDD00", secondary: "#008000" }, reputation: 59 },
                    { id: "jong-az", name: "Jong AZ", city: "Alkmaar", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "roda", name: "Roda JC", city: "Kerkrade", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 58 },
                    { id: "heracles", name: "Heracles", city: "Almelo", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "jong-utrecht", name: "Jong Utrecht", city: "Utrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "graafschap", name: "De Graafschap", city: "Doetinchem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "venlo", name: "Venlo", city: "Venlo", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 56 },
                    { id: "jong-twente", name: "Jong Twente", city: "Enschede", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "mvv", name: "MVV", city: "Maastricht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "den-bosch", name: "Den Bosch", city: "'s-Hertogenbosch", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "dordrecht", name: "Dordrecht", city: "Dordrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "telstar", name: "Telstar", city: "Velsen", colors: { primary: "#FFFFFF", secondary: "#0066CC" }, reputation: 52 },
                    { id: "helmond", name: "Helmond Sport", city: "Helmond", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 51 },
                    { id: "maastricht", name: "Maastricht", city: "Maastricht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "oss", name: "TOP Oss", city: "Oss", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "eindhoven", name: "Eindhoven", city: "Eindhoven", colors: { primary: "#0066CC", secondary: "#C8102E" }, reputation: 48 },
                    { id: "jong-groningen", name: "Jong Groningen", city: "Groningen", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "ado", name: "ADO", city: "Den Haag", colors: { primary: "#FFDD00", secondary: "#008000" }, reputation: 56 }
                ]
            },
	    {
                id: "TWD",
                name: "Tweede Divisie",
                tier: 3,
                clubs: [
                    { id: "acv", name: "ACV", city: "Assen", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "afc", name: "Amsterdamsche FC", city: "Amsterdam", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "barendrecht", name: "Barendrecht", city: "Barendrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "excelsior-m", name: "Excelsior Maassluis", city: "Maassluis", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 44 },
                    { id: "gvvv", name: "GVVV", city: "Veenendaal", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 46 },
                    { id: "hardenberg", name: "Hardenberg", city: "Hardenberg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "hoek", name: "Hoek", city: "Hoek", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 45 },
                    { id: "ijsselmeervogels", name: "IJsselmeervogels", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 47 },
                    { id: "jong-almere", name: "Jong Almere", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 42 },
                    { id: "jong-sparta", name: "Jong Sparta", city: "Rotterdam", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "hfc", name: "Koninklijke HFC", city: "Haarlem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "katwijk", name: "Katwijk", city: "Katwijk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "kozakken", name: "Kozakken Boys", city: "Werkendam", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "quick-boys", name: "Quick Boys", city: "Katwijk", colors: { primary: "#000000", secondary: "#C8102E" }, reputation: 44 },
                    { id: "rijnsburg", name: "Rijnburgse Boys", city: "Rijnsburg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "spakenburg", name: "Spakenburg", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "treffers", name: "De Treffers", city: "Groesbeek", colors: { primary: "#008000", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "rkav", name: "RKAV Volendam", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 42 }
                ]
            },
            {
                id: "DRD",
                name: "Derde Divisie",
                tier: 4,
                clubs: [
                    { id: "ado20", name: "ADO '20", city: "Heemskerk", colors: { primary: "#FFDD00", secondary: "#008000" }, reputation: 41 },
                    { id: "dovo", name: "DOVO", city: "Veenendaal", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "ermelo", name: "'33 Ermelo", city: "Ermelo", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "eemdijk", name: "Eemdijk", city: "Bunschoten", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "excelsior31", name: "Excelsior '31", city: "Rijssen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "genemuiden", name: "Genemuiden", city: "Genemuiden", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "harkemase", name: "Harkemase Boys", city: "Harkema", colors: { primary: "#FFDD00", secondary: "#0066CC" }, reputation: 38 },
                    { id: "hercules-d", name: "USV Hercules", city: "Utrecht", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 41 },
                    { id: "hoogeveen", name: "Hoogeveen", city: "Hoogeveen", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 39 },
                    { id: "hsc21", name: "HSC '21", city: "Haaksbergen", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "huizen", name: "Huizen", city: "Huizen", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 40 },
                    { id: "rohda", name: "Rohda Raalte", city: "Raalte", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 38 },
                    { id: "scherpenzeel", name: "Scherpenzeel", city: "Scherpenzeel", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "sparta-n", name: "Sparta Nijkerk", city: "Nijkerk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "sportlust", name: "Sportlust '46", city: "Woerden", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "staphorst", name: "Staphorst", city: "Staphorst", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 40 },
                    { id: "tec", name: "TEC", city: "Tiel", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "urk", name: "Urk", city: "Urk", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 39 }
                ]
            }
        ]
    }
};

// Club management

// ---- Regions (Netherlands) ----
const REGIONS = [
    { id: 'noord', name: 'Noord', blurb: 'Groningen, Friesland & Drenthe' },
    { id: 'oost', name: 'Oost', blurb: 'Overijssel & Gelderland' },
    { id: 'noord-holland', name: 'Noord-Holland', blurb: 'incl. Amsterdam' },
    { id: 'middelland', name: 'Middelland', blurb: 'Utrecht & Flevoland' },
    { id: 'zuid', name: 'Zuid', blurb: 'Zeeland, Noord-Brabant & Limburg' },
    { id: 'zuid-holland', name: 'Zuid-Holland', blurb: 'incl. Rotterdam & Den Haag' }
];
const CITY_REGION = {
    "Groningen":"noord","Leeuwarden":"noord","Heerenveen":"noord","Harkema":"noord","Emmen":"noord","Assen":"noord","Hoogeveen":"noord",
    "Almelo":"oost","Enschede":"oost","Zwolle":"oost","Genemuiden":"oost","Hardenberg":"oost","Haaksbergen":"oost","Raalte":"oost","Rijssen":"oost","Staphorst":"oost","Arnhem":"oost","Nijmegen":"oost","Doetinchem":"oost","Groesbeek":"oost","Ermelo":"oost","Nijkerk":"oost","Tiel":"oost","Scherpenzeel":"oost",
    "Amsterdam":"noord-holland","Alkmaar":"noord-holland","Haarlem":"noord-holland","Volendam":"noord-holland","Velsen":"noord-holland","Heemskerk":"noord-holland","Huizen":"noord-holland",
    "Utrecht":"middelland","Veenendaal":"middelland","Woerden":"middelland","Bunschoten":"middelland","Almere":"middelland","Urk":"middelland",
    "'s-Hertogenbosch":"zuid","Eindhoven":"zuid","Helmond":"zuid","Oss":"zuid","Werkendam":"zuid","Hoek":"zuid","Maastricht":"zuid","Venlo":"zuid","Sittard":"zuid","Kerkrade":"zuid",
    "Den Haag":"zuid-holland","Rotterdam":"zuid-holland","Dordrecht":"zuid-holland","Katwijk":"zuid-holland","Barendrecht":"zuid-holland","Maassluis":"zuid-holland","Rijnsburg":"zuid-holland"
};
function regionOfCity(city){ return CITY_REGION[city] || 'middelland'; }
function regionName(id){ const r=REGIONS.find(x=>x.id===id); return r?r.name:id; }

// ---- reserve ("Jong X") clubs ----
function isReserveClub(idOrClub){ const c = (typeof idOrClub === 'string') ? Clubs.getClubById(idOrClub) : idOrClub; return !!(c && /^Jong\s/i.test(c.name)); }
function reserveClubFor(seniorId){ const s = Clubs.getClubById(seniorId); if (!s) return null; return Clubs.allClubs.find(c => c.name === 'Jong ' + s.name) || null; }
function parentClubForReserve(reserveId){
    const r = Clubs.getClubById(reserveId); if (!r || !/^Jong\s/i.test(r.name)) return null;
    const base = r.name.replace(/^Jong\s+/i, '');
    return Clubs.allClubs.find(c => c.name === base) || Clubs.allClubs.find(c => c.tier < r.tier && c.name.indexOf(base) === 0) || null;
}

const Clubs = {
    allClubs: [],
    
    init() {
        this.allClubs = [];
        
        // Generate all clubs from league data
        for (const [country, leagueSystem] of Object.entries(LEAGUES_DATA)) {
            leagueSystem.tiers.forEach(tier => {
                tier.clubs.forEach(clubData => {
                    this.allClubs.push({
                        ...clubData,
                        country: country,
                        division: tier.id,
                        tier: tier.tier,
                        divisionName: tier.name,
                        region: regionOfCity(clubData.city),
                        squad: [],
                        finances: this.calculateFinances(clubData.reputation)
                    });
                });
            });
        }
        
        console.log(`✅ ${this.allClubs.length} clubs created`);
        return this.allClubs;
    },
    
    calculateFinances(reputation) {
        // Higher reputation = more money
        return Math.floor(reputation * 100000);
    },
    
    getClubById(id) {
        return this.allClubs.find(c => c.id === id);
    },
    
    getClubsByDivision(division) {
        return this.allClubs.filter(c => c.division === division);
    },

    getClubsByRegion(regionId) {
        return this.allClubs.filter(c => c.region === regionId);
    },

    DIV_NAMES: { ERE: 'Eredivisie', EED: 'Eerste Divisie', TWD: 'Tweede Divisie', DRD: 'Derde Divisie' },
    DIV_TIERS: { ERE: 1, EED: 2, TWD: 3, DRD: 4 },
    setDivision(clubId, divId) {
        const c = this.getClubById(clubId); if (!c) return;
        c.division = divId; c.tier = this.DIV_TIERS[divId]; c.divisionName = this.DIV_NAMES[divId];
    },
    
    getClubsByCountry(country) {
        return this.allClubs.filter(c => c.country === country);
    },
    
    // Distribute players to clubs based on ability and club reputation
    distributePlayersToClubs(players) {
        console.log('📊 Distributing players to clubs...');
        
        // Sort clubs by reputation (best first)
        const sortedClubs = [...this.allClubs].sort((a, b) => b.reputation - a.reputation);
        
        // Sort players by ability (best first)
        const sortedPlayers = [...players].sort((a, b) => b.ability - a.ability);
        
        // Clear existing squads
        this.allClubs.forEach(club => club.squad = []);
        
        // Distribute players round-robin (best players to best clubs)
        let clubIndex = 0;
        sortedPlayers.forEach(player => {
            const club = sortedClubs[clubIndex % sortedClubs.length];
            
            // Assign player to club
            player.currentClub = club.id;
            player.clubName = club.name;
            club.squad.push(player.id);
            
            clubIndex++;
        });
        
        console.log('✅ Players distributed to clubs');
        
        // Log top 3 clubs
        const topClubs = sortedClubs.slice(0, 3);
        topClubs.forEach(club => {
            const clubPlayers = sortedPlayers.filter(p => p.currentClub === club.id);
            const avgAbility = clubPlayers.reduce((sum, p) => sum + p.ability, 0) / clubPlayers.length;
            console.log(`   ${club.name}: ${clubPlayers.length} players, avg ability ${avgAbility.toFixed(1)}`);
        });
    }
};

// Generate SVG logo for a club
function generateClubLogo(club) {
    const { primary, secondary } = club.colors;
    
    // Simple shield/crest SVG
    return `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" class="club-logo">
            <!-- Shield background -->
            <path d="M 50 10 L 90 30 L 90 70 Q 90 110 50 110 Q 10 110 10 70 L 10 30 Z" 
                  fill="${primary}" 
                  stroke="${secondary}" 
                  stroke-width="2"/>
            
            <!-- Secondary accent -->
            <path d="M 50 20 L 80 35 L 80 65 Q 80 95 50 100 Q 20 95 20 65 L 20 35 Z" 
                  fill="${secondary}" 
                  opacity="0.2"/>
            
            <!-- Club initial -->
            <text x="50" y="70" 
                  font-family="Arial, sans-serif" 
                  font-size="40" 
                  font-weight="bold" 
                  fill="${secondary}" 
                  text-anchor="middle">
                ${club.name.charAt(0)}
            </text>
        </svg>
    `;
}
