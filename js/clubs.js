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
                    { id: "ajax", name: "Ajax", city: "Amsterdam", colors: { primary: "#D2122E", secondary: "#FFFFFF" }, reputation: 82 },
                    { id: "psv", name: "PSV", city: "Eindhoven", colors: { primary: "#ED1C24", secondary: "#FFFFFF" }, reputation: 81 },
                    { id: "feyenoord", name: "Feyenoord", city: "Rotterdam", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 80 },
                    { id: "az", name: "AZ", city: "Alkmaar", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "twente", name: "Twente", city: "Enschede", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "utrecht", name: "Utrecht", city: "Utrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "heerenveen", name: "Heerenveen", city: "Heerenveen", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "groningen", name: "Groningen", city: "Groningen", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "willem-ii", name: "Willem II", city: "Tilburg", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "nec", name: "NEC", city: "Nijmegen", colors: { primary: "#C8102E", secondary: "#008000" }, reputation: 75 },
                    { id: "sparta", name: "Sparta", city: "Rotterdam", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "cambuur", name: "Cambuur", city: "Leeuwarden", colors: { primary: "#FFDD00", secondary: "#0066CC" }, reputation: 66 },
                    { id: "zwolle", name: "Zwolle", city: "Zwolle", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "fortuna", name: "Fortuna", city: "Sittard", colors: { primary: "#FFDD00", secondary: "#008000" }, reputation: 70 },
                    { id: "go-ahead", name: "Go Ahead Eagles", city: "Deventer", colors: { primary: "#FFDD00", secondary: "#ad1010" }, reputation: 56 },
                    { id: "den-haag", name: "Ado Den Haag", city: "Den Haag", colors: { primary: "#FFDD00", secondary: "#008000" }, reputation: 67 },
                    { id: "excelsior", name: "Excelsior", city: "Rotterdam", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 69 },
                    { id: "telstar", name: "Telstar", city: "Velsen", colors: { primary: "#FFFFFF", secondary: "#0066CC" }, reputation: 66 }
                ]
            },
            {
                id: "EED",
                name: "Eerste Divisie",
                tier: 2,
                clubs: [
                    { id: "jong-ajax", name: "Jong Ajax", city: "Amsterdam", colors: { primary: "#D2122E", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "jong-psv", name: "Jong PSV", city: "Eindhoven", colors: { primary: "#ED1C24", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "nac", name: "NAC Breda", city: "Breda", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 65 },
                    { id: "jong-az", name: "Jong AZ", city: "Alkmaar", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "roda", name: "Roda JC", city: "Kerkrade", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 60 },
                    { id: "heracles", name: "Heracles", city: "Almelo", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "jong-utrecht", name: "Jong Utrecht", city: "Utrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "graafschap", name: "De Graafschap", city: "Doetinchem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "venlo", name: "Venlo", city: "Venlo", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 56 },
                    { id: "rkc", name: "RKC Waalwijk", city: "Waalwijk", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 61 },
                    { id: "mvv", name: "MVV", city: "Maastricht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "den-bosch", name: "Den Bosch", city: "'s-Hertogenbosch", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "dordrecht", name: "Dordrecht", city: "Dordrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "volendam", name: "Volendam", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 66 },
                    { id: "helmond", name: "Helmond Sport", city: "Helmond", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 54 },                    
                    { id: "oss", name: "TOP Oss", city: "Oss", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "eindhoven", name: "Eindhoven", city: "Eindhoven", colors: { primary: "#0066CC", secondary: "#C8102E" }, reputation: 57 },
                    { id: "emmen", name: "Emmen", city: "Emmen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "vitesse", name: "Vitesse", city: "Arnhem", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 60 },
                    { id: "almere", name: "Almere City", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 63 }
                ]
            },
	    {
                id: "TWD",
                name: "Tweede Divisie",
                tier: 3,
                clubs: [
                    { id: "acv", name: "ACV", city: "Assen", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "afc", name: "Amsterdamsche FC", city: "Amsterdam", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "barendrecht", name: "Barendrecht", city: "Barendrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "excelsior-m", name: "Excelsior Maassluis", city: "Maassluis", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 42 },
                    { id: "gvvv", name: "GVVV", city: "Veenendaal", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 43 },
                    { id: "hardenberg", name: "Hardenberg", city: "Hardenberg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "hoek", name: "Hoek", city: "Hoek", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 54 },
                    { id: "ijsselmeervogels", name: "IJsselmeervogels", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 42 },
                    { id: "jong-almere", name: "Jong Almere", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 46 },
                    { id: "jong-sparta", name: "Jong Sparta", city: "Rotterdam", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "hfc", name: "Koninklijke HFC", city: "Haarlem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "katwijk", name: "Katwijk", city: "Katwijk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "kozakken", name: "Kozakken Boys", city: "Werkendam", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "quick-boys", name: "Quick Boys", city: "Katwijk", colors: { primary: "#000000", secondary: "#C8102E" }, reputation: 55 },
                    { id: "rijnsburg", name: "Rijnburgse Boys", city: "Rijnsburg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "spakenburg", name: "Spakenburg", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "treffers", name: "De Treffers", city: "Groesbeek", colors: { primary: "#008000", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "rkav", name: "RKAV Volendam", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 43 }
                ]
            },
            {
                id: "DRD",
                name: "Derde Divisie",
                tier: 4,
                clubs: [
                    { id: "Kloetinge", name: "Kloetinge", city: "Kloetinge", colors: { primary: "#2d9120", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "dovo", name: "DOVO", city: "Veenendaal", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "eemdijk", name: "Eemdijk", city: "Bunschoten", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "rksv", name: "RKSV Groene Ster", city: "Heerlerheide", colors: { primary: "#035f00", secondary: "#035f00" }, reputation: 38 },
                    { id: "harkemase", name: "Harkemase Boys", city: "Harkema", colors: { primary: "#FFDD00", secondary: "#0066CC" }, reputation: 36 },
                    { id: "hercules-d", name: "USV Hercules", city: "Utrecht", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 33 },
                    { id: "hoogeveen", name: "Hoogeveen", city: "Hoogeveen", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 35 },
                    { id: "zwaluwen", name: "Zwaluwen", city: "Vlaardingen", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "huizen", name: "Huizen", city: "Huizen", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 32 },
                    { id: "rohda", name: "Rohda Raalte", city: "Raalte", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 41 },
                    { id: "scherpenzeel", name: "Scherpenzeel", city: "Scherpenzeel", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "sparta-n", name: "Sparta Nijkerk", city: "Nijkerk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "sportlust", name: "Sportlust '46", city: "Woerden", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "staphorst", name: "Staphorst", city: "Staphorst", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 40 },
                    { id: "tec", name: "TEC", city: "Tiel", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "urk", name: "Urk", city: "Urk", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "scheveningen", name: "SVV Scheveningen", city: "Scheveningen", colors: { primary: "#065a14", secondary: "#000000" }, reputation: 29 },
                    { id: "stedoco", name: "VV SteDoCo", city: "Hoornaar", colors: { primary: "#a52525", secondary: "#000000" }, reputation: 30 }
                ]
            }
        ]
    },
    "England": {
        country: "England",
        tiers: [
            {
                id: "PREM",
                name: "Premier League",
                tier: 1,
                clubs: [
                    { id: "Arsenal", name: "Arsenal", city: "London", colors: { primary: "#EF0107", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Chelsea", name: "Chelsea", city: "London", colors: { primary: "#034694", secondary: "#FFFFFF" }, reputation: 88 },
                    { id: "Liverpool", name: "Liverpool", city: "Liverpool", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Manchester United", name: "Manchester United", city: "Manchester", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 89 },
                    { id: "Manchester City", name: "Manchester City", city: "Manchester", colors: { primary: "#6CABDD", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Tottenham", name: "Tottenham Hotspur", city: "London", colors: { primary: "#132257", secondary: "#FFFFFF" }, reputation: 88 },
                    { id: "Everton", name: "Everton", city: "Liverpool", colors: { primary: "#003399", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "Aston Villa", name: "Aston Villa", city: "Birmingham", colors: { primary: "#95BFE5", secondary: "#670E36" }, reputation: 83 },
                    { id: "Leeds", name: "Leeds United", city: "Leeds", colors: { primary: "#FFCD00", secondary: "#0052B1" }, reputation: 75 },
                    { id: "Newcastle", name: "Newcastle United", city: "Newcastle upon Tyne", colors: { primary: "#241F20", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Brighton", name: "Brighton & Hove Albion", city: "Brighton", colors: { primary: "#0057B8", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Crystal Palace", name: "Crystal Palace", city: "London", colors: { primary: "#1B458F", secondary: "#E30613" }, reputation: 77 },
                    { id: "Brentford", name: "Brentford", city: "London", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 77 },
                    { id: "Fulham", name: "Fulham", city: "London", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Ipswich", name: "Ipswich Town", city: "Ipswich", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Hull", name: "Hull City", city: "Hull", colors: { primary: "#FDB913", secondary: "#000000" }, reputation: 70 },
                    { id: "Nottingham Forest", name: "Nottingham Forest", city: "Nottingham", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Bournemouth", name: "AFC Bournemouth", city: "Bournemouth", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 76 },
                    { id: "Sunderland", name: "AFC Sunderland", city: "Sunderland", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Coventry", name: "Coventry City", city: "Coventry", colors: { primary: "#00BFFF", secondary: "#FFFFFF" }, reputation: 71 }
                ]
            },
            {
                id: "CHAMP",
                name: "Championship",
                tier: 2,
                clubs: [
                    { id: "Wolves", name: "Wolves", city: "Wolverhampton", colors: { primary: "#FDB913", secondary: "#000000" }, reputation: 74 },
                    { id: "Burnley", name: "FC Burnley", city: "Burnley", colors: { primary: "#6C1D45", secondary: "#FDB913" }, reputation: 72 },
                    { id: "West Ham", name: "West Ham United", city: "London", colors: { primary: "#7A263A", secondary: "#1BB1E7" }, reputation: 75 },
                    { id: "Millwall", name: "Millwall", city: "London", colors: { primary: "#002A5C", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Southampton", name: "FC Southampton", city: "Southampton", colors: { primary: "#D71920", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Middlesbrough", name: "Middlesbrough", city: "Middlesbrough", colors: { primary: "#D71920", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Wrexham", name: "Wrexham", city: "Wrexham", colors: { primary: "#D71920", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Derby", name: "Derby County", city: "Derby", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Norwich", name: "Norwich City", city: "Norwich", colors: { primary: "#FFD200", secondary: "#008000" }, reputation: 69 },
                    { id: "Birmingham", name: "Birmingham City", city: "Birmingham", colors: { primary: "#003399", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Swansea", name: "Swansea City", city: "Swansea", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Bristol City", name: "Bristol City", city: "Bristol", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 68 },
                    { id: "Sheffield United", name: "Sheffield United", city: "Sheffield", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "Preston", name: "Preston North End", city: "Preston", colors: { primary: "#002A5C", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "QPR", name: "Queens Park Rangers", city: "London", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Watford", name: "Watford", city: "Watford", colors: { primary: "#FFD200", secondary: "#000000" }, reputation: 65 },
                    { id: "Stoke", name: "Stoke City", city: "Stoke-on-Trent", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "Portsmouth", name: "Portsmouth", city: "Portsmouth", colors: { primary: "#002A5C", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Charlton", name: "Charlton Athletic", city: "London", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Blackburn", name: "Blackburn Rovers", city: "Blackburn", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "West Bromwich", name: "West Bromwich Albion", city: "West Bromwich", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Bolton", name: "Bolton Wanderers", city: "Bolton", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Cardiff", name: "Cardiff City", city: "Cardiff", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Lincoln", name: "Lincoln City", city: "Lincoln", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 61 }
                ]
            },
            {
                id: "LEAGUE1",
                name: "League One",
                tier: 3,
                clubs: [
                    { id: "Stockport", name: "Stockport County", city: "Stockport", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Leicester", name: "Leicester City", city: "Leicester", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Oxford", name: "Oxford United", city: "Oxford", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 61 },
                    { id: "Sheffield Wednesday", name: "Sheffield Wednesday", city: "Sheffield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Bradford", name: "Bradford City", city: "Bradford", colors: { primary: "#7B003A", secondary: "#FFC72C" }, reputation: 59 },
                    { id: "Stevenage", name: "Stevenage", city: "Stevenage", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Luton", name: "Luton Town", city: "Luton", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 58 },
                    { id: "Plymouth", name: "Plymouth Argyle", city: "Plymouth", colors: { primary: "#007B5F", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Huddersfield", name: "Huddersfield Town", city: "Huddersfield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Mansfield", name: "Mansfield Town", city: "Mansfield", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 57 },
                    { id: "Wycombe", name: "Wycombe Wanderers", city: "High Wycombe", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Reading", name: "FC Reading", city: "Reading", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Blackpool", name: "Blackpool", city: "Blackpool", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 56 },
                    { id: "Doncaster", name: "Doncaster Rovers", city: "Doncaster", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Barnsley", name: "Barnsley", city: "Barnsley", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Wigan", name: "Wigan Athletic", city: "Wigan", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Burton", name: "Burton Albion", city: "Burton upon Trent", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 54 },
                    { id: "Peterborough", name: "Peterborough United", city: "Peterborough", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Wimbledon", name: "AFC Wimbledon", city: "London", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Leyton Orient", name: "Leyton Orient", city: "London", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Bromley", name: "Bromley", city: "Bromley", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "MK Dons", name: "Milton Keynes Dons", city: "Milton Keynes", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Cambridge", name: "Cambridge United", city: "Cambridge", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 51 },
                    { id: "Notts County", name: "Notts County", city: "Nottingham", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 50 }
                ]
            },
            {
                id: "LEAGUE2",
                name: "League Two",
                tier: 4,
                clubs: [
                    { id: "Exeter", name: "Exeter City", city: "Exeter", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Port Vale", name: "Port Vale", city: "Stoke-on-Trent", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Rotherham", name: "Rotherham United", city: "Rotherham", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Northampton", name: "Northampton Town", city: "Northampton", colors: { primary: "#6C1D45", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Salford", name: "Salford City", city: "Salford", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Chesterfield", name: "Chesterfield", city: "Chesterfield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Grimsby", name: "Grimsby Town", city: "Grimsby", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Barnet", name: "Barnet", city: "London", colors: { primary: "#F7A800", secondary: "#000000" }, reputation: 48 },
                    { id: "Swindon", name: "Swindon Town", city: "Swindon", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Oldham", name: "Oldham Athletic", city: "Oldham", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Crewe", name: "Crewe Alexandra", city: "Crewe", colors: { primary: "#DA020E", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Colchester", name: "Colchester United", city: "Colchester", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Walsall", name: "Walsall", city: "Walsall", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Bristol Rovers", name: "Bristol Rovers", city: "Bristol", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Fleetwood", name: "Fleetwood Town", city: "Fleetwood", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Accrington", name: "Accrington Stanley", city: "Accrington", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Gillingham", name: "Gillingham", city: "Gillingham", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Cheltenham", name: "Cheltenham Town", city: "Cheltenham", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Shrewsbury", name: "Shrewsbury Town", city: "Shrewsbury", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Newport", name: "Newport County", city: "Newport", colors: { primary: "#FFB81C", secondary: "#000000" }, reputation: 43 },
                    { id: "Tranmere", name: "Tranmere Rovers", city: "Birkenhead", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Crawley", name: "Crawley Town", city: "Crawley", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "York", name: "York City", city: "York", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Rochdale", name: "AFC Rochdale", city: "Rochdale", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 40 }
                ]
            },
            {
                id: "Natleague",
                name: "National League",
                tier: 5,
                clubs: [
                    { id: "Harrogate", name: "Harrogate Town", city: "Harrogate", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Barrow", name: "Barrow", city: "Barrow-in-Furness", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Carlisle", name: "Carlisle United", city: "Carlisle", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Boreham Wood", name: "Boreham Wood", city: "Borehamwood", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Scunthorpe", name: "Scunthorpe United", city: "Scunthorpe", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Southend", name: "Southend United", city: "Southend-on-Sea", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Forest Green", name: "Forest Green Rovers", city: "Forest Green", colors: { primary: "#00593C", secondary: "#000000" }, reputation: 41 },
                    { id: "Halifax", name: "Halifax Town", city: "Halifax", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Hartlepool", name: "Hartlepool United", city: "Hartlepool", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Woking", name: "Woking", city: "Woking", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "Tamworth", name: "Tamworth", city: "Tamworth", colors: { primary: "#E20E17", secondary: "#000000" }, reputation: 35 },
                    { id: "Boston United", name: "Boston United", city: "Boston", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Altrincham", name: "Altrincham", city: "Altrincham", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Solihull Moors", name: "Solihull Moors", city: "Solihull", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Wealdstone", name: "Wealdstone", city: "Wealdstone", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Yeovil", name: "Yeovil Town", city: "Yeovil", colors: { primary: "#007A3B", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Eastleigh", name: "Eastleigh", city: "Eastleigh", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Gateshead", name: "Gateshead", city: "Gateshead", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Sutton United", name: "Sutton United", city: "Sutton", colors: { primary: "#FFCC00", secondary: "#5B3A29" }, reputation: 29 },
                    { id: "Aldershot", name: "Aldershot Town", city: "Aldershot", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Brackley", name: "Brackley Town", city: "Brackley", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Morecambe", name: "Morecambe", city: "Morecambe", colors: { primary: "#B4141E", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Braintree", name: "Braintree Town", city: "Braintree", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 26 },
                    { id: "Worthing", name: "Worthing", city: "Worthing", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 26 }
                ]
            }
        ]
    },
    "Germany": {
        country: "Germany",
        tiers: [
            {
                id: "BUNDES",
                name: "Bundesliga",
                tier: 1,
                clubs: [
                    { id: "Bayern Munich", name: "Bayern Munich", city: "Munich", colors: { primary: "#DC052D", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Dortmund", name: "Borussia Dortmund", city: "Dortmund", colors: { primary: "#FDE100", secondary: "#000000" }, reputation: 85 },
                    { id: "Leipzig", name: "RB Leipzig", city: "Leipzig", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 85 },
                    { id: "Leverkusen", name: "Bayer Leverkusen", city: "Leverkusen", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 84 },
                    { id: "Mönchengladbach", name: "Borussia Mönchengladbach", city: "Mönchengladbach", colors: { primary: "#FFFFFF", secondary: "#00A94F" }, reputation: 77 },
                    { id: "Frankfurt", name: "Eintracht Frankfurt", city: "Frankfurt", colors: { primary: "#E1000F", secondary: "#000000" }, reputation: 81 },
                    { id: "Köln", name: "1. FC Köln", city: "Cologne", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Freiburg", name: "SC Freiburg", city: "Freiburg", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 78 },
                    { id: "Hoffenheim", name: "TSG Hoffenheim", city: "Hoffenheim", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "Stuttgart", name: "VfB Stuttgart", city: "Stuttgart", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 81 },
                    { id: "Mainz 05", name: "1. FSV Mainz 05", city: "Mainz", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "Augsburg", name: "FC Augsburg", city: "Augsburg", colors: { primary: "#BA3733", secondary: "#46714D" }, reputation: 74 },
                    { id: "Bremen", name: "Werder Bremen", city: "Bremen", colors: { primary: "#009639", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Schalke", name: "FC Schalke 04", city: "Gelsenkirchen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "Elversberg", name: "SV Elversberg", city: "Elversberg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Paderborn", name: "SC Paderborn 07", city: "Paderborn", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Hamburg", name: "Hamburger SV", city: "Hamburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Union", name: "FC Union Berlin", city: "Berlin", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 75 }
                ]
            },
            {
                id: "2BUNDES",
                name: "2. Bundesliga",
                tier: 2,
                clubs: [
                    { id: "Wolfsburg", name: "VfL Wolfsburg", city: "Wolfsburg", colors: { primary: "#009639", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "St. Pauli", name: "FC St. Pauli", city: "Hamburg", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Heidenheim", name: "1. FC Heidenheim", city: "Heidenheim", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Darmstadt", name: "SV Darmstadt 98", city: "Darmstadt", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Hannover", name: "Hannover 96", city: "Hanover", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Kaiserslautern", name: "1. FC Kaiserslautern", city: "Kaiserslautern", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "Hertha", name: "Hertha BSC", city: "Berlin", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Nürnberg", name: "1. FC Nürnberg", city: "Nuremberg", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Bochum", name: "VfL Bochum", city: "Bochum", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Karlsruhe", name: "Karlsruher SC", city: "Karlsruhe", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Dresden", name: "Dynamo Dresden", city: "Dresden", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Kiel", name: "Holstein Kiel", city: "Kiel", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Bielefeld", name: "Arminia Bielefeld", city: "Bielefeld", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Magdeburg", name: "1. FC Magdeburg", city: "Magdeburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Braunschweig", name: "Eintracht Braunschweig", city: "Braunschweig", colors: { primary: "#F6E500", secondary: "#003D7C" }, reputation: 62 },
                    { id: "Fürth", name: "SpVgg Greuther Fürth", city: "Fürth", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Osnabrück", name: "VfL Osnabrück", city: "Osnabrück", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Cottbus", name: "Energie Cottbus", city: "Cottbus", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 58 }
                ]
            },
            {
                id: "3LIGA",
                name: "3. Liga",
                tier: 3,
                clubs: [
                    { id: "Düsseldorf", name: "Fortuna Düsseldorf", city: "Düsseldorf", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Münster", name: "Preußen Münster", city: "Münster", colors: { primary: "#00723F", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Essen", name: "Rot-Weiss Essen", city: "Essen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Duisburg", name: "MSV Duisburg", city: "Duisburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Rostock", name: "Hansa Rostock", city: "Rostock", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Verl", name: "SC Verl", city: "Verl", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Aachen", name: "Alemannia Aachen", city: "Aachen", colors: { primary: "#000000", secondary: "#FFD200" }, reputation: 57 },
                    { id: "Wiesbaden", name: "SV Wehen Wiesbaden", city: "Wiesbaden", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 56 },
                    { id: "Mannheim", name: "SV Waldhof Mannheim", city: "Mannheim", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Viktoria Köln", name: "Viktoria Köln", city: "Cologne", colors: { primary: "#ac2200", secondary: "#000000" }, reputation: 55 },
                    { id: "Ingolstadt", name: "FC Ingolstadt 04", city: "Ingolstadt", colors: { primary: "#D40028", secondary: "#000000" }, reputation: 54 },
                    { id: "Regensburg", name: "SSV Jahn Regensburg", city: "Regensburg", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Stuttgart II", name: "VfB Stuttgart II", city: "Stuttgart", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Saarbrücken", name: "1. FC Saarbrücken", city: "Saarbrücken", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Hoffenheim II", name: "TSG Hoffenheim II", city: "Hoffenheim", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Havelse", name: "TSV Havelse", city: "Garbsen", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Meppen", name: "SV Meppen", city: "Meppen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Fortuna Köln", name: "Fortuna Köln", city: "Cologne", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Großaspach", name: "SG Sonnenhof Großaspach", city: "Aspach", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Würzburger", name: "Würzburger Kickers", city: "Würzburg", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 }
                ]
            },
            {
                id: "REGIONAL1",
                name: "1. Regionalliga",
                tier: 4,
                clubs: [
                    { id: "1860", name: "TSV 1860 München", city: "Munich", colors: { primary: "#0A9BD6", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Unterhaching", name: "SpVgg Unterhaching", city: "Unterhaching", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Illertissen", name: "FV Illertissen", city: "Illertissen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Vilzing", name: "DJK Vilzing", city: "Vilzing", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Bayern II", name: "Bayern Munich II", city: "Munich", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Oberhausen", name: "Rot-Weiß Oberhausen", city: "Oberhausen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Schalke II", name: "FC Schalke 04 II", city: "Gelsenkirchen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Dortmund II", name: "Borussia Dortmund II", city: "Dortmund", colors: { primary: "#FDE100", secondary: "#000000" }, reputation: 44 },
                    { id: "Gütersloh", name: "FC Gütersloh", city: "Gütersloh", colors: { primary: "#00963F", secondary: "#000000" }, reputation: 45 },
                    { id: "Siegen", name: "Sportfreunde Siegen", city: "Siegen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Freiberg", name: "SGV Freiberg", city: "Freiberg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "FSV Frankfurt", name: "FSV Frankfurt", city: "Frankfurt", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Homburg", name: "FC 08 Homburg", city: "Homburg", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Aue", name: "FC Erzgebirge Aue", city: "Aue", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Ulm", name: "SSV Ulm 1846", city: "Ulm", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Schweinfurt", name: "1. FC Schweinfurt 05", city: "Schweinfurt", colors: { primary: "#00843D", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Stuttgarter Kickers", name: "Stuttgarter Kickers", city: "Stuttgart", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Lok Leipzig", name: "Lokomotive Leipzig", city: "Leipzig", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Jena", name: "Carl Zeiss Jena", city: "Jena", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Zwickau", name: "FSV Zwickau", city: "Zwickau", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Halle", name: "Hallescher FC", city: "Halle", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Erfurt", name: "FC Rot-Weiß Erfurt", city: "Erfurt", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Drochtersen", name: "SV Drochtersen/Assel", city: "Drochtersen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Oldenburg", name: "VfB Oldenburg", city: "Oldenburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 41 }
                ]
            },
            {
                id: "REGIONAL2",
                name: "2. Regionalliga",
                tier: 5,
                clubs: [
                    { id: "Jeddeloh", name: "SSV Jeddeloh II", city: "Jeddeloh", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Lübeck", name: "Phönix Lübeck", city: "Lübeck", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "Bremer SV", name: "Bremer SV", city: "Bremen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Altglienicke", name: "VSG Altglienicke", city: "Berlin", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Chemnitz", name: "Chemnitzer FC", city: "Chemnitz", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Preussen", name: "BFC Preussen", city: "Berlin", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Chemie Leipzig", name: "Chemie Leipzig", city: "Leipzig", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Steinbach", name: "TSV Steinbach", city: "Steinbach", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Kassel", name: "Hessen Kassel", city: "Kassel", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Sandhausen", name: "SV Sandhausen", city: "Sandhausen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Bonner SC", name: "Bonner SC", city: "Bonn", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Köln II", name: "1. FC Köln II", city: "Cologne", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Lotte", name: "Sportfreunde Lotte", city: "Lotte", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "Bocholt", name: "VfL Bocholt", city: "Bocholt", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Aubstadt", name: "TSV Aubstadt", city: "Aubstadt", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Eichstätt", name: "VfB Eichstätt", city: "Eichstätt", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Burghausen", name: "Wacker Burghausen", city: "Burghausen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Buchbach", name: "TSV Buchbach", city: "Buchbach", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Memmingen", name: "FC Memmingen", city: "Memmingen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Emden", name: "Kickers Emden", city: "Emden", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Hamburg II", name: "Hamburger SV II", city: "Hamburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Babelsberg", name: "SV Babelsberg 03", city: "Potsdam", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Greifswald", name: "Greifswalder FC", city: "Greifswald", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Offenbach", name: "Kickers Offenbach", city: "Offenbach", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 }
                ]
            },
            {
                id: "REGIONAL3",
                name: "3. Regionalliga",
                tier: 6,
                clubs: [
                    { id: "Bayreuth", name: "SpVgg Bayreuth", city: "Bayreuth", colors: { primary: "#FFD200", secondary: "#000000" }, reputation: 29 },
                    { id: "Augsburg II", name: "FC Augsburg II", city: "Augsburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Schwaben Augsburg", name: "FC Schwaben Augsburg", city: "Augsburg", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Landsberg", name: "TSV Landsberg", city: "Landsberg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Eltersdorf", name: "SC Eltersdorf", city: "Eltersdorf", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Paderborn II", name: "SC Paderborn 07 II", city: "Paderborn", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Rödinghausen", name: "SV Rödinghausen", city: "Rödinghausen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Wiedenbrück", name: "SC Wiedenbrück", city: "Wiedenbrück", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Bergisch Gladbach", name: "SV Bergisch Gladbach 09", city: "Bergisch Gladbach", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Wattenscheid", name: "Wattenscheid 09", city: "Bochum", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Barockstadt", name: "SG Barockstadt", city: "Fulda", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Walldorf", name: "Astoria Walldorf", city: "Walldorf", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Trier", name: "Eintracht Trier", city: "Trier", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Aalen", name: "VfR Aalen", city: "Aalen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Tasmania", name: "Tasmania Berlin", city: "Berlin", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 25 },
                    { id: "Hertha II", name: "Hertha BSC II", city: "Berlin", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Dynamo Berlin", name: "BFC Dynamo", city: "Berlin", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "RSV Eintracht", name: "RSV Eintracht 1949", city: "Berlin", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Weiche", name: "SC Weiche 08", city: "Flensburg", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "VfB Lübeck", name: "VfB Lübeck", city: "Lübeck", colors: { primary: "#00A94F", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "HSC Hannover", name: "HSC Hannover", city: "Hannover", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Schöningen", name: "FSV Schöningen", city: "Schöningen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Norderstedt", name: "FC Eintracht Norderstedt", city: "Norderstedt", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Todesfelde", name: "SV Todesfelde", city: "Todesfelde", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 27 }
                ]
            }
        ]
    },
    "Spain": {
        country: "Spain",
        tiers: [
            { 
                id: "LaLiga", 
                name: "La Liga", 
                tier: 1,
                clubs: [
                    { id: "Real Madrid", name: "Real Madrid", city: "Madrid", colors: { primary: "#FFFFFF", secondary: "#FEBE10" }, reputation: 90 },
                    { id: "Barcelona", name: "FC Barcelona", city: "Barcelona", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 90 },
                    { id: "Atletico", name: "Atletico Madrid", city: "Madrid", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 86 },
                    { id: "Villarreal", name: "Villarreal CF", city: "Villarreal", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 82 },
                    { id: "Sevilla", name: "Sevilla FC", city: "Seville", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 80 },
                    { id: "Betis", name: "Real Betis", city: "Seville", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Valencia", name: "Valencia CF", city: "Valencia", colors: { primary: "#FFFFFF", secondary: "#EE7203" }, reputation: 78 },
                    { id: "Real Sociedad", name: "Real Sociedad", city: "San Sebastián", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Athletic Bilbao", name: "Athletic Club", city: "Bilbao", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "Espanyol", name: "RCD Espanyol", city: "Barcelona", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Celta Vigo", name: "RC Celta de Vigo", city: "Vigo", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Vallecano", name: "Rayo Vallecano", city: "Madrid", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "Alaves", name: "Deportivo Alavés", city: "Vitoria-Gasteiz", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Getafe", name: "Getafe CF", city: "Getafe", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Elche", name: "Elche CF", city: "Elche", colors: { primary: "#00915A", secondary: "#FFFFFF" }, reputation: 73 },
                    { id: "Levante", name: "Levante UD", city: "Valencia", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 74 },
                    { id: "Osasuna", name: "CA Osasuna", city: "Pamplona", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 74 },
                    { id: "Racing Santander", name: "Racing Santander", city: "Santander", colors: { primary: "#00A94F", secondary: "#FFFFFF" }, reputation: 73 },
                    { id: "Deportivo", name: "Deportivo La Coruña", city: "La Coruña", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "Malaga", name: "Málaga CF", city: "Málaga", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 72 }
                ]
            },
            {
                id: "LaLiga2", 
                name: "La Liga 2",
                tier: 2,
                clubs: [
                    { id: "Mallorca", name: "RCD Mallorca", city: "Palma de Mallorca", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 74 },
                    { id: "Girona", name: "Girona FC", city: "Girona", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 74 },
                    { id: "Oviedo", name: "Real Oviedo", city: "Oviedo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Almeria", name: "UD Almería", city: "Almería", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 71 },
                    { id: "Las Palmas", name: "UD Las Palmas", city: "Las Palmas", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Castellón", name: "CD Castellón", city: "Castellón de la Plana", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Burgos", name: "Burgos CF", city: "Burgos", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Eibar", name: "SD Eibar", city: "Eibar", colors: { primary: "#9F1E3C", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Gijón", name: "Sporting Gijón", city: "Gijón", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Cordoba", name: "Córdoba CF", city: "Córdoba", colors: { primary: "#007A33", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Ceuta", name: "AD Ceuta", city: "Ceuta", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Albacete", name: "Albacete Balompié", city: "Albacete", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 67 },
                    { id: "Andorra", name: "FC Andorra", city: "Andorra la Vella", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Granada", name: "Granada CF", city: "Granada", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Real Sociedad B", name: "Real Sociedad B", city: "San Sebastián", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "Leganés", name: "CD Leganés", city: "Leganés", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Valladolid", name: "Real Valladolid", city: "Valladolid", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 66 },
                    { id: "Cádiz", name: "Cádiz CF", city: "Cádiz", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 65 },
                    { id: "Tenerife", name: "CD Tenerife", city: "Santa Cruz de Tenerife", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Eldense", name: "CD Eldense", city: "Elda", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Sabadell", name: "CE Sabadell", city: "Sabadell", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Celta Vigo B", name: "Celta Vigo B", city: "Vigo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                ]
            },
            {
                id: "PrimeraSup",
                name: "Primera Superior",
                tier: 3,
                clubs: [
                    { id: "Zaragoza", name: "Real Zaragoza", city: "Zaragoza", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 59 },
                    { id: "Huesca", name: "SD Huesca", city: "Huesca", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Leonesa", name: "Cultural Leonesa", city: "León", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Mirandés", name: "CD Mirandés", city: "Miranda de Ebro", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 60 },
                    { id: "Zamora", name: "Zamora CF", city: "Zamora", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Ponferradina", name: "SD Ponferradina", city: "Ponferrada", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Pontevedra", name: "Pontevedra CF", city: "Pontevedra", colors: { primary: "#6B2737", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Barakaldo", name: "Barakaldo CF", city: "Barakaldo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Unionistas", name: "Uniónistas CF", city: "Salamanca", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 56 },
                    { id: "Lugo", name: "CD Lugo", city: "Lugo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Mérida", name: "Mérida AD", city: "Mérida", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Arenas", name: "Arenas Club", city: "Getxo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Ferrol", name: "Racing de Ferrol", city: "Ferrol", colors: { primary: "#009B48", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Atletico Madrid B", name: "Atlético Madrileño", city: "Madrid", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 57 },
                    { id: "Villareal B", name: "Villarreal B", city: "Villarreal", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 56 },
                    { id: "Real Madrid B", name: "Real Madrid Castilla", city: "Madrid", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Europa", name: "CE Europa", city: "Barcelona", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Cartagena", name: "FC Cartagena", city: "Cartagena", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Antequera", name: "Antequera CF", city: "Antequera", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Algeciras", name: "Algeciras CF", city: "Algeciras", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Hércules", name: "Hércules CF", city: "Alicante", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 50 },
                    { id: "Real Murcia", name: "Real Murcia CF", city: "Murcia", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 49 }
                ]
            },
            {
                id: "PrimeraInf",
                name: "Primera Inferior",
                tier: 4,
                clubs: [
                    { id: "Alcorcón", name: "AD Alcorcón", city: "Alcorcón", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 49 },
                    { id: "Ibiza", name: "UD Ibiza", city: "Ibiza", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Teruel", name: "CD Teruel", city: "Teruel", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Gimnástica", name: "Gimnástica de Torrelavega", city: "Torrelavega", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Torremolinos", name: "UD Torremolinos", city: "Torremolinos", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Majadaonda", name: "Rayo Majadahonda", city: "Majadahonda", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Sant Andreu", name: "UE Sant Andreu", city: "Barcelona", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Águilas", name: "Águilas FC", city: "Águilas", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Real Jaén", name: "Real Jaén CF", city: "Jaén", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Athletic Bilbao B", name: "Bilbao Athletic", city: "Bilbao", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 43 },
                    { id: "Avilés", name: "Real Avilés CF", city: "Avilés", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Cacereño", name: "CP Cacereño", city: "Cáceres", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Extremadura", name: "CD Extremadura", city: "Almendralejo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Real Union", name: "Real Unión", city: "Irun", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Fabril", name: "Deportivo Fabril", city: "La Coruña", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Ourense", name: "CD Ourense", city: "Ourense", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Coria", name: "CD Coria", city: "Coria", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Logroñés", name: "UD Logroñés", city: "Logroño", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Barcelona B", name: "FC Barcelona B", city: "Barcelona", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 48 },
                    { id: "Terrassa", name: "Terrassa FC", city: "Terrassa", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Rayo Cantabria", name: "Rayo Cantabria", city: "Santander", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Basconia", name: "CD Basconia", city: "Bilbao", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 37 }
                ]
            },
            {
                id: "Segunda",
                name: "Segunda Federación",
                tier: 5,
                clubs: [
                    { id: "Real Oviedo B", name: "Real Oviedo Vetusta", city: "Oviedo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Bergantiños", name: "Bergantiños FC", city: "Carballo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38},
                    { id: "Alavés B", name: "Deportivo Alavés B", city: "Vitoria-Gasteiz", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Sestao River", name: "Sestao River", city: "Sestao", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Arosa", name: "Arosa SC", city: "Vilagarcía de Arousa", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Peña Sport", name: "Peña Sport FC", city: "Tafalla", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Sevilla Atlético", name: "FC Sevilla Atlético", city: "Sevilla", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "R. Huelva", name: "Recreativo Huelva", city: "Huelva", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 34 },
                    { id: "Xerez", name: "Deportivo Xerez", city: "Jerez de la Frontera ", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Marbella", name: "Marbella FC", city: "Marbella", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Don Benito", name: "CD Don Benito", city: "Don Benito", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Lucena", name: "Ciudad Lucena", city: "Lucena", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Tamaraceite", name: "UD Tamaraceite", city: "Las Palmas de Gran Canaria", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Sanluqueño", name: "Atlético Sanluqueño", city: "Sanlúcar de Barrameda", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "UCAM Murcia", name: "UCAM Murcia", city: "Murcia", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Valencia B", name: "Valencia Mestalla", city: "Valencia", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Intercity", name: "CF Intercity", city: "Alicante", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 29 },
                    { id: "CD Guadalajara", name: "CD Guadalajara", city: "Guadalajara", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Salamanca", name: "Salamanca CF UDS", city: "Villares de la Reina (Salamanca)", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Atlético Albacete", name: "Atlético Albacete", city: "Albacete", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 33 }
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
// ---- Regions (England) ----
const REGIONS_EN = [
    { id: 'greater-london', name: 'Greater London', blurb: 'the capital' },
    { id: 'north-west', name: 'North West England', blurb: 'Manchester, Liverpool & the North West' },
    { id: 'south-east', name: 'South East England', blurb: 'the South East' },
    { id: 'west-midlands', name: 'West Midlands', blurb: 'Birmingham & the West Midlands' },
    { id: 'north-east', name: 'North East England', blurb: 'the North East' },
    { id: 'yorkshire', name: 'Yorkshire and the Humber', blurb: 'Yorkshire & the Humber' },
    { id: 'east-midlands', name: 'East Midlands', blurb: 'the East Midlands' },
    { id: 'south-west', name: 'South West England', blurb: 'the South West' },
    { id: 'east-england', name: 'East of England', blurb: 'the East' }
];
// ---- Regions (Germany) ----
const REGIONS_DE = [
    { id: 'bayern', name: 'Bayern', blurb: 'Bavaria' },
    { id: 'nordoster', name: 'Nordosten', blurb: 'Northeast Germany' },
    { id: 'westen', name: 'Westen', blurb: 'Western Germany' },
    { id: 'sudwesten', name: 'Südwesten', blurb: 'Southwest Germany' },
    { id: 'nord', name: 'Norden', blurb: 'Northern Germany' }
];
// ---- Regions (Spain) ----
const REGIONS_ES = [
    { id: 'sur de españa', name: 'Sur de España', blurb: 'Andalusia and Murcia' },
    { id: 'españa central', name: 'España central', blurb: 'Madrid, Extremadura and Castilla la Mancha' },
    { id: 'noreste de españa', name: 'Noreste de España', blurb: 'Aragon, Catalonia and Valencia' },
    { id: 'noroeste de españa', name: 'Noroeste de España', blurb: 'Galicia, Asturias, Castilla and León' },
    { id: 'nor de españa', name: 'Nor de España', blurb: 'Cantabria, Basque Country, Navarra and La Rioja' },
    { id: 'islas', name: 'Islas', blurb: 'Balearic Islands and Canary Islands' }
];
const REGIONS_BY_COUNTRY = { Netherlands: REGIONS, England: REGIONS_EN, Germany: REGIONS_DE, Spain: REGIONS_ES };
const CITY_REGION = {
    "Groningen":"noord","Leeuwarden":"noord","Heerenveen":"noord","Harkema":"noord","Emmen":"noord","Assen":"noord","Hoogeveen":"noord",
    "Almelo":"oost","Enschede":"oost","Zwolle":"oost","Genemuiden":"oost","Hardenberg":"oost","Haaksbergen":"oost","Raalte":"oost","Rijssen":"oost","Staphorst":"oost","Arnhem":"oost","Nijmegen":"oost","Doetinchem":"oost","Groesbeek":"oost","Ermelo":"oost","Nijkerk":"oost","Tiel":"oost","Scherpenzeel":"oost",
    "Amsterdam":"noord-holland","Alkmaar":"noord-holland","Haarlem":"noord-holland","Volendam":"noord-holland","Velsen":"noord-holland","Heemskerk":"noord-holland","Huizen":"noord-holland",
    "Utrecht":"middelland","Veenendaal":"middelland","Woerden":"middelland","Bunschoten":"middelland","Almere":"middelland","Urk":"middelland",
    "'s-Hertogenbosch":"zuid","Eindhoven":"zuid","Helmond":"zuid","Oss":"zuid","Werkendam":"zuid","Hoek":"zuid","Maastricht":"zuid","Venlo":"zuid","Sittard":"zuid","Kerkrade":"zuid",
    "Den Haag":"zuid-holland","Rotterdam":"zuid-holland","Dordrecht":"zuid-holland","Katwijk":"zuid-holland","Barendrecht":"zuid-holland","Maassluis":"zuid-holland","Rijnsburg":"zuid-holland",
    // ---- England ----
    "London":"greater-london","Bromley":"greater-london","Sutton":"greater-london","Wealdstone":"greater-london",
    "Liverpool":"north-west","Manchester":"north-west","Birkenhead":"north-west","Stockport":"north-west","Wigan":"north-west","Oldham":"north-west","Salford":"north-west","Rochdale":"north-west","Accrington":"north-west","Blackpool":"north-west","Blackburn":"north-west","Burnley":"north-west","Preston":"north-west","Bolton":"north-west","Fleetwood":"north-west","Crewe":"north-west","Altrincham":"north-west","Barrow-in-Furness":"north-west","Carlisle":"north-west","Morecambe":"north-west","Wrexham":"north-west",
    "Brighton":"south-east","Southampton":"south-east","Portsmouth":"south-east","Reading":"south-east","Oxford":"south-east","High Wycombe":"south-east","Milton Keynes":"south-east","Gillingham":"south-east","Crawley":"south-east","Worthing":"south-east","Woking":"south-east","Aldershot":"south-east","Eastleigh":"south-east",
    "Birmingham":"west-midlands","Wolverhampton":"west-midlands","West Bromwich":"west-midlands","Walsall":"west-midlands","Coventry":"west-midlands","Stoke-on-Trent":"west-midlands","Burton upon Trent":"west-midlands","Shrewsbury":"west-midlands","Tamworth":"west-midlands","Solihull":"west-midlands",
    "Newcastle upon Tyne":"north-east","Sunderland":"north-east","Middlesbrough":"north-east","Hartlepool":"north-east","Gateshead":"north-east",
    "Leeds":"yorkshire","Hull":"yorkshire","Sheffield":"yorkshire","Bradford":"yorkshire","Barnsley":"yorkshire","Doncaster":"yorkshire","Rotherham":"yorkshire","Huddersfield":"yorkshire","Harrogate":"yorkshire","Halifax":"yorkshire","York":"yorkshire","Grimsby":"yorkshire","Scunthorpe":"yorkshire",
    "Nottingham":"east-midlands","Derby":"east-midlands","Leicester":"east-midlands","Lincoln":"east-midlands","Mansfield":"east-midlands","Chesterfield":"east-midlands","Northampton":"east-midlands","Boston":"east-midlands","Brackley":"east-midlands",
    "Bristol":"south-west","Exeter":"south-west","Plymouth":"south-west","Swindon":"south-west","Cheltenham":"south-west","Forest Green":"south-west","Yeovil":"south-west","Bournemouth":"south-west","Cardiff":"south-west","Swansea":"south-west","Newport":"south-west",
    "Ipswich":"east-england","Norwich":"east-england","Peterborough":"east-england","Cambridge":"east-england","Colchester":"east-england","Southend-on-Sea":"east-england","Braintree":"east-england","Stevenage":"east-england","Watford":"east-england","Luton":"east-england","Borehamwood":"east-england",
    // ---- Germany ----
    "Munich":"bayern","Augsburg":"bayern","Nuremberg":"bayern","Fürth":"bayern","Regensburg":"bayern","Ingolstadt":"bayern","Unterhaching":"bayern","Illertissen":"bayern","Vilzing":"bayern","Würzburg":"bayern","Schweinfurt":"bayern","Bayreuth":"bayern","Landsberg":"bayern","Eltersdorf":"bayern","Aubstadt":"bayern","Eichstätt":"bayern","Burghausen":"bayern","Buchbach":"bayern","Memmingen":"bayern",
    "Berlin":"nordoster","Leipzig":"nordoster","Dresden":"nordoster","Magdeburg":"nordoster","Cottbus":"nordoster","Chemnitz":"nordoster","Potsdam":"nordoster","Jena":"nordoster","Zwickau":"nordoster","Halle":"nordoster","Erfurt":"nordoster","Greifswald":"nordoster","Aue":"nordoster",
    "Dortmund":"westen","Gelsenkirchen":"westen","Cologne":"westen","Leverkusen":"westen","Mönchengladbach":"westen","Düsseldorf":"westen","Essen":"westen","Duisburg":"westen","Bochum":"westen","Bielefeld":"westen","Münster":"westen","Paderborn":"westen","Aachen":"westen","Verl":"westen","Oberhausen":"westen","Gütersloh":"westen","Siegen":"westen","Bergisch Gladbach":"westen","Wiedenbrück":"westen","Rödinghausen":"westen","Bocholt":"westen","Lotte":"westen","Bonn":"westen",
    "Stuttgart":"sudwesten","Freiburg":"sudwesten","Hoffenheim":"sudwesten","Mainz":"sudwesten","Kaiserslautern":"sudwesten","Karlsruhe":"sudwesten","Heidenheim":"sudwesten","Darmstadt":"sudwesten","Frankfurt":"sudwesten","Mannheim":"sudwesten","Saarbrücken":"sudwesten","Elversberg":"sudwesten","Homburg":"sudwesten","Trier":"sudwesten","Walldorf":"sudwesten","Sandhausen":"sudwesten","Aalen":"sudwesten","Ulm":"sudwesten","Freiberg":"sudwesten","Kassel":"sudwesten","Wiesbaden":"sudwesten","Offenbach":"sudwesten","Fulda":"sudwesten","Steinbach":"sudwesten","Aspach":"sudwesten",
    "Hamburg":"nord","Bremen":"nord","Hanover":"nord","Hannover":"nord","Kiel":"nord","Wolfsburg":"nord","Braunschweig":"nord","Osnabrück":"nord","Oldenburg":"nord","Meppen":"nord","Emden":"nord","Norderstedt":"nord","Flensburg":"nord","Lübeck":"nord","Todesfelde":"nord","Drochtersen":"nord","Jeddeloh":"nord","Garbsen":"nord","Schöningen":"nord","Rostock":"nord",
    // ---- Spain ----
    "Seville":"sur de españa","Sevilla":"sur de españa","Málaga":"sur de españa","Córdoba":"sur de españa","Granada":"sur de españa","Cádiz":"sur de españa","Almería":"sur de españa","Huelva":"sur de españa","Jerez de la Frontera ":"sur de españa","Marbella":"sur de españa","Lucena":"sur de españa","Sanlúcar de Barrameda":"sur de españa","Murcia":"sur de españa","Cartagena":"sur de españa","Antequera":"sur de españa","Algeciras":"sur de españa","Águilas":"sur de españa","Jaén":"sur de españa","Ceuta":"sur de españa","Torremolinos":"sur de españa",
    "Madrid":"españa central","Getafe":"españa central","Leganés":"españa central","Alcorcón":"españa central","Majadahonda":"españa central","Guadalajara":"españa central","Mérida":"españa central","Cáceres":"españa central","Almendralejo":"españa central","Don Benito":"españa central","Coria":"españa central","Albacete":"españa central",
    "Barcelona":"noreste de españa","Valencia":"noreste de españa","Villarreal":"noreste de españa","Zaragoza":"noreste de españa","Huesca":"noreste de españa","Elche":"noreste de españa","Castellón de la Plana":"noreste de españa","Girona":"noreste de españa","Sabadell":"noreste de españa","Terrassa":"noreste de españa","Alicante":"noreste de españa","Elda":"noreste de españa","Teruel":"noreste de españa","Andorra la Vella":"noreste de españa",
    "Vigo":"noroeste de españa","La Coruña":"noroeste de españa","Oviedo":"noroeste de españa","Gijón":"noroeste de españa","León":"noroeste de españa","Ponferrada":"noroeste de españa","Pontevedra":"noroeste de españa","Zamora":"noroeste de españa","Lugo":"noroeste de españa","Ferrol":"noroeste de españa","Salamanca":"noroeste de españa","Valladolid":"noroeste de españa","Burgos":"noroeste de españa","Ourense":"noroeste de españa","Villares de la Reina (Salamanca)":"noroeste de españa","Vilagarcía de Arousa":"noroeste de españa","Avilés":"noroeste de españa","Miranda de Ebro":"noroeste de españa","Carballo":"noroeste de españa",
    "Bilbao":"nor de españa","San Sebastián":"nor de españa","Vitoria-Gasteiz":"nor de españa","Pamplona":"nor de españa","Santander":"nor de españa","Eibar":"nor de españa","Barakaldo":"nor de españa","Getxo":"nor de españa","Sestao":"nor de españa","Irun":"nor de españa","Logroño":"nor de españa","Tafalla":"nor de españa","Torrelavega":"nor de españa",
    "Palma de Mallorca":"islas","Las Palmas":"islas","Santa Cruz de Tenerife":"islas","Ibiza":"islas","Las Palmas de Gran Canaria":"islas"

};
function regionOfCity(city){ return CITY_REGION[city] || 'middelland'; }
function regionsForCountry(country){ return REGIONS_BY_COUNTRY[country] || REGIONS; }
function regionName(id){
    for (const arr of Object.values(REGIONS_BY_COUNTRY)) { const r = arr.find(x => x.id === id); if (r) return r.name; }
    return id;
}

// ---- reserve ("Jong X") clubs ----
// virtual youth-side name: Dutch clubs field a "Jong X" side, others field an "X U21"
function youthTeamName(parentOrId){
    const c = (typeof parentOrId === 'string') ? Clubs.getClubById(parentOrId) : parentOrId;
    if (!c) return 'U21';
    if (c.country === 'Netherlands') return 'Jong ' + c.name;
    if (c.country === 'Germany') return c.name + ' II';
    if (c.country === 'Spain') return c.name + ' B';
    return c.name + ' U21';
}
function isReserveClub(idOrClub){
    const c = (typeof idOrClub === 'string') ? Clubs.getClubById(idOrClub) : idOrClub;
    if (!c) return false;
    if (c.country === 'Spain' && / B$/.test(c.id)) return true;
    let base = null;
    if (/^Jong\s/i.test(c.name)) base = c.name.replace(/^Jong\s+/i, '');
    else if (/\sU21$/.test(c.name)) base = c.name.replace(/\sU21$/, '');
    else if (/\sII$/.test(c.name)) base = c.name.replace(/\sII$/, '');
    else return false;
    // only a reserve if a distinct senior club with the base name actually exists
    return Clubs.allClubs.some(o => o.id !== c.id && o.name === base);
}
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
        // reserve/second teams wear their parent club's colours (for consistent emblems)
        const ES_RESERVE_PARENT = { 'Real Sociedad B': 'Real Sociedad', 'Celta Vigo B': 'Celta Vigo', 'Atletico Madrid B': 'Atletico', 'Villareal B': 'Villarreal', 'Real Madrid B': 'Real Madrid', 'Athletic Bilbao B': 'Athletic Bilbao', 'Barcelona B': 'Barcelona', 'Real Oviedo B': 'Oviedo', 'Alavés B': 'Alaves', 'Valencia B': 'Valencia' };
        this.allClubs.forEach(c => {
            if (!isReserveClub(c.id)) return;
            let parent = null;
            if (c.country === 'Spain' && ES_RESERVE_PARENT[c.id]) parent = this.getClubById(ES_RESERVE_PARENT[c.id]);
            else { const base = c.name.replace(/^Jong\s+/i, '').replace(/\sU21$/, '').replace(/\sII$/, ''); parent = this.allClubs.find(o => o.id !== c.id && o.name === base); }
            if (parent) c.colors = { primary: parent.colors.primary, secondary: parent.colors.secondary };
        });
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

    DIV_NAMES: { ERE: 'Eredivisie', EED: 'Eerste Divisie', TWD: 'Tweede Divisie', DRD: 'Derde Divisie', PREM: 'Premier League', CHAMP: 'Championship', LEAGUE1: 'League One', LEAGUE2: 'League Two', Natleague: 'National League', BUNDES: 'Bundesliga', '2BUNDES': '2. Bundesliga', '3LIGA': '3. Liga', REGIONAL1: '1. Regionalliga', REGIONAL2: '2. Regionalliga', REGIONAL3: '3. Regionalliga', LaLiga: 'La Liga', LaLiga2: 'La Liga 2', PrimeraSup: 'Primera Superior', PrimeraInf: 'Primera Inferior', Segunda: 'Segunda Federación' },
    DIV_TIERS: { ERE: 1, EED: 2, TWD: 3, DRD: 4, PREM: 1, CHAMP: 2, LEAGUE1: 3, LEAGUE2: 4, Natleague: 5, BUNDES: 1, '2BUNDES': 2, '3LIGA': 3, REGIONAL1: 4, REGIONAL2: 5, REGIONAL3: 6, LaLiga: 1, LaLiga2: 2, PrimeraSup: 3, PrimeraInf: 4, Segunda: 5 },
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
