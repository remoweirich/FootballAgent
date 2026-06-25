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
                    { id: "Manchester City", name: "Manchester City", city: "Manchester", colors: { primary: "#6CABDD", secondary: "#FFFFFF" }, reputation: 89 },
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
                id: "C'Ship'",
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
                    { id: "Bradford", name: "Bradford City", city: "Bradford", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 59 },
                    { id: "Stevenage", name: "Stevenage", city: "Stevenage", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Luton", name: "Luton Town", city: "Luton", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 58 },
                    { id: "Plymouth", name: "Plymouth Argyle", city: "Plymouth", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 58 },
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
                    { id: "Northampton", name: "Northampton Town", city: "Northampton", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Salford", name: "Salford City", city: "Salford", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Chesterfield", name: "Chesterfield", city: "Chesterfield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Grimsby", name: "Grimsby Town", city: "Grimsby", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Barnet", name: "Barnet", city: "London", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Swindon", name: "Swindon Town", city: "Swindon", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Oldham", name: "Oldham Athletic", city: "Oldham", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Crewe", name: "Crewe Alexandra", city: "Crewe", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Colchester", name: "Colchester United", city: "Colchester", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Walsall", name: "Walsall", city: "Walsall", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Bristol Rovers", name: "Bristol Rovers", city: "Bristol", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "Fleetwood", name: "Fleetwood Town", city: "Fleetwood", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Accrington", name: "Accrington Stanley", city: "Accrington", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Gillingham", name: "Gillingham", city: "Gillingham", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Cheltenham", name: "Cheltenham Town", city: "Cheltenham", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Shrewsbury", name: "Shrewsbury Town", city: "Shrewsbury", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Newport", name: "Newport County", city: "Newport", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 43 },
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
                    { id: "Forest Green", name: "Forest Green Rovers", city: "Forest Green", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Halifax", name: "Halifax Town", city: "Halifax", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Hartlepool", name: "Hartlepool United", city: "Hartlepool", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Woking", name: "Woking", city: "Woking", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "Tamworth", name: "Tamworth", city: "Tamworth", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Boston United", name: "Boston United", city: "Boston", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Altrincham", name: "Altrincham", city: "Altrincham", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Solihull Moors", name: "Solihull Moors", city: "Solihull", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Wealdstone", name: "Wealdstone", city: "Wealdstone", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Yeovil", name: "Yeovil Town", city: "Yeovil", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Eastleigh", name: "Eastleigh", city: "Eastleigh", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Gateshead", name: "Gateshead", city: "Gateshead", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Sutton United", name: "Sutton United", city: "Sutton", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Aldershot", name: "Aldershot Town", city: "Aldershot", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Brackley", name: "Brackley Town", city: "Brackley", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Morecambe", name: "Morecambe", city: "Morecambe", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Braintree", name: "Braintree Town", city: "Braintree", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 26 },
                    { id: "Worthing", name: "Worthing", city: "Worthing", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 26 }
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
