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
                    { id: "jong-utrecht", name: "Jong Utrecht", city: "Utrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "graafschap", name: "De Graafschap", city: "Doetinchem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "venlo", name: "Venlo", city: "Venlo", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 56 },
                    { id: "rkc", name: "RKC Waalwijk", city: "Waalwijk", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 61 },
                    { id: "mvv", name: "MVV", city: "Maastricht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "den-bosch", name: "Den Bosch", city: "'s-Hertogenbosch", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "dordrecht", name: "Dordrecht", city: "Dordrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "volendam", name: "Volendam", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 66 },
                    { id: "helmond", name: "Helmond Sport", city: "Helmond", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 52 },                    
                    { id: "oss", name: "TOP Oss", city: "Oss", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "eindhoven", name: "Eindhoven", city: "Eindhoven", colors: { primary: "#0066CC", secondary: "#C8102E" }, reputation: 57 },
                    { id: "emmen", name: "Emmen", city: "Emmen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "vitesse", name: "Vitesse", city: "Arnhem", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 60 },
                    { id: "almere", name: "Almere City", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 63 }
                ]
            },
	    {
                id: "TWD",
                name: "Tweede Divisie",
                tier: 3,
                clubs: [
                    { id: "acv", name: "ACV", city: "Assen", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "afc", name: "Amsterdamsche FC", city: "Amsterdam", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "barendrecht", name: "Barendrecht", city: "Barendrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "excelsior-m", name: "Excelsior Maassluis", city: "Maassluis", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 42 },
                    { id: "gvvv", name: "GVVV", city: "Veenendaal", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 41 },
                    { id: "hardenberg", name: "Hardenberg", city: "Hardenberg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "hoek", name: "Hoek", city: "Hoek", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 54 },
                    { id: "ijsselmeervogels", name: "IJsselmeervogels", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 41 },
                    { id: "jong-almere", name: "Jong Almere", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 44 },
                    { id: "jong-sparta", name: "Jong Sparta", city: "Rotterdam", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "hfc", name: "Koninklijke HFC", city: "Haarlem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "katwijk", name: "Katwijk", city: "Katwijk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "kozakken", name: "Kozakken Boys", city: "Werkendam", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "quick-boys", name: "Quick Boys", city: "Katwijk", colors: { primary: "#000000", secondary: "#C8102E" }, reputation: 55 },
                    { id: "rijnsburg", name: "Rijnburgse Boys", city: "Rijnsburg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "spakenburg", name: "Spakenburg", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "treffers", name: "De Treffers", city: "Groesbeek", colors: { primary: "#008000", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "rkav", name: "RKAV Volendam", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 40 }
                ]
            },
            {
                id: "DRD",
                name: "Derde Divisie",
                tier: 4,
                clubs: [
                    { id: "Kloetinge", name: "Kloetinge", city: "Kloetinge", colors: { primary: "#2d9120", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "dovo", name: "DOVO", city: "Veenendaal", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "eemdijk", name: "Eemdijk", city: "Bunschoten", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "rksv", name: "RKSV Groene Ster", city: "Heerlerheide", colors: { primary: "#035f00", secondary: "#035f00" }, reputation: 35 },
                    { id: "harkemase", name: "Harkemase Boys", city: "Harkema", colors: { primary: "#FFDD00", secondary: "#0066CC" }, reputation: 32 },
                    { id: "hercules-d", name: "USV Hercules", city: "Utrecht", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 29 },
                    { id: "hoogeveen", name: "Hoogeveen", city: "Hoogeveen", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 35 },
                    { id: "zwaluwen", name: "Zwaluwen", city: "Vlaardingen", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "huizen", name: "Huizen", city: "Huizen", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 32 },
                    { id: "rohda", name: "Rohda Raalte", city: "Raalte", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 38 },
                    { id: "scherpenzeel", name: "Scherpenzeel", city: "Scherpenzeel", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "sparta-n", name: "Sparta Nijkerk", city: "Nijkerk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "sportlust", name: "Sportlust '46", city: "Woerden", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "staphorst", name: "Staphorst", city: "Staphorst", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 40 },
                    { id: "tec", name: "TEC", city: "Tiel", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "urk", name: "Urk", city: "Urk", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "scheveningen", name: "SVV Scheveningen", city: "Scheveningen", colors: { primary: "#065a14", secondary: "#000000" }, reputation: 24 },
                    { id: "stedoco", name: "VV SteDoCo", city: "Hoornaar", colors: { primary: "#a52525", secondary: "#000000" }, reputation: 28 }
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
                    { id: "Stockport", name: "Stockport County", city: "Stockport", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Leicester", name: "Leicester City", city: "Leicester", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Oxford", name: "Oxford United", city: "Oxford", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 61 },
                    { id: "Sheffield Wednesday", name: "Sheffield Wednesday", city: "Sheffield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Bradford", name: "Bradford City", city: "Bradford", colors: { primary: "#7B003A", secondary: "#FFC72C" }, reputation: 59 },
                    { id: "Stevenage", name: "Stevenage", city: "Stevenage", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Luton", name: "Luton Town", city: "Luton", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 58 },
                    { id: "Plymouth", name: "Plymouth Argyle", city: "Plymouth", colors: { primary: "#007B5F", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Huddersfield", name: "Huddersfield Town", city: "Huddersfield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Mansfield", name: "Mansfield Town", city: "Mansfield", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 57 },
                    { id: "Wycombe", name: "Wycombe Wanderers", city: "High Wycombe", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Reading", name: "FC Reading", city: "Reading", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 57 },
                    { id: "Blackpool", name: "Blackpool", city: "Blackpool", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 56 },
                    { id: "Doncaster", name: "Doncaster Rovers", city: "Doncaster", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Barnsley", name: "Barnsley", city: "Barnsley", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Wigan", name: "Wigan Athletic", city: "Wigan", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Burton", name: "Burton Albion", city: "Burton upon Trent", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 54 },
                    { id: "Peterborough", name: "Peterborough United", city: "Peterborough", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Wimbledon", name: "AFC Wimbledon", city: "London", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Leyton Orient", name: "Leyton Orient", city: "London", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Bromley", name: "Bromley", city: "Bromley", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 52 },
                    { id: "MK Dons", name: "Milton Keynes Dons", city: "Milton Keynes", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 52 },
                    { id: "Cambridge", name: "Cambridge United", city: "Cambridge", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 51 },
                    { id: "Notts County", name: "Notts County", city: "Nottingham", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 50 }
                ]
            },
            {
                id: "LEAGUE2",
                name: "League Two",
                tier: 4,
                clubs: [
                    { id: "Exeter", name: "Exeter City", city: "Exeter", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 52 },
                    { id: "Port Vale", name: "Port Vale", city: "Stoke-on-Trent", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 52 },
                    { id: "Rotherham", name: "Rotherham United", city: "Rotherham", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Northampton", name: "Northampton Town", city: "Northampton", colors: { primary: "#6C1D45", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Salford", name: "Salford City", city: "Salford", colors: { primary: "#DA291C", secondary: "#F5A623" }, reputation: 50 },
                    { id: "Chesterfield", name: "Chesterfield", city: "Chesterfield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Grimsby", name: "Grimsby Town", city: "Grimsby", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Barnet", name: "Barnet", city: "London", colors: { primary: "#F7A800", secondary: "#000000" }, reputation: 48 },
                    { id: "Swindon", name: "Swindon Town", city: "Swindon", colors: { primary: "#DA291C", secondary: "#FFD200" }, reputation: 48 },
                    { id: "Oldham", name: "Oldham Athletic", city: "Oldham", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 47 },
                    { id: "Crewe", name: "Crewe Alexandra", city: "Crewe", colors: { primary: "#DA020E", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Colchester", name: "Colchester United", city: "Colchester", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 46 },
                    { id: "Walsall", name: "Walsall", city: "Walsall", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 46 },
                    { id: "Bristol Rovers", name: "Bristol Rovers", city: "Bristol", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 46 },
                    { id: "Fleetwood", name: "Fleetwood Town", city: "Fleetwood", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 45 },
                    { id: "Accrington", name: "Accrington Stanley", city: "Accrington", colors: { primary: "#DA291C", secondary: "#000066" }, reputation: 45 },
                    { id: "Gillingham", name: "Gillingham", city: "Gillingham", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Cheltenham", name: "Cheltenham Town", city: "Cheltenham", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Shrewsbury", name: "Shrewsbury Town", city: "Shrewsbury", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 44 },
                    { id: "Newport", name: "Newport County", city: "Newport", colors: { primary: "#FFB81C", secondary: "#000000" }, reputation: 43 },
                    { id: "Tranmere", name: "Tranmere Rovers", city: "Birkenhead", colors: { primary: "#009640", secondary: "#000000" }, reputation: 43 },
                    { id: "Crawley", name: "Crawley Town", city: "Crawley", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 42 },
                    { id: "York", name: "York City", city: "York", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 41 },
                    { id: "Rochdale", name: "AFC Rochdale", city: "Rochdale", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 40 }
                ]
            },
            {
                id: "Natleague",
                name: "National League",
                tier: 5,
                clubs: [
                    { id: "Harrogate", name: "Harrogate Town", city: "Harrogate", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Barrow", name: "Barrow", city: "Barrow-in-Furness", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Carlisle", name: "Carlisle United", city: "Carlisle", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 40 },
                    { id: "Boreham Wood", name: "Boreham Wood", city: "Borehamwood", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 39 },
                    { id: "Scunthorpe", name: "Scunthorpe United", city: "Scunthorpe", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 39 },
                    { id: "Southend", name: "Southend United", city: "Southend-on-Sea", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 38 },
                    { id: "Forest Green", name: "Forest Green Rovers", city: "Forest Green", colors: { primary: "#00593C", secondary: "#000000" }, reputation: 41 },
                    { id: "Halifax", name: "Halifax Town", city: "Halifax", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 38 },
                    { id: "Hartlepool", name: "Hartlepool United", city: "Hartlepool", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 38 },
                    { id: "Woking", name: "Woking", city: "Woking", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "Tamworth", name: "Tamworth", city: "Tamworth", colors: { primary: "#E20E17", secondary: "#000000" }, reputation: 35 },
                    { id: "Boston United", name: "Boston United", city: "Boston", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 34 },
                    { id: "Altrincham", name: "Altrincham", city: "Altrincham", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Solihull Moors", name: "Solihull Moors", city: "Solihull", colors: { primary: "#005BAC", secondary: "#FFD200" }, reputation: 32 },
                    { id: "Wealdstone", name: "Wealdstone", city: "Wealdstone", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Yeovil", name: "Yeovil Town", city: "Yeovil", colors: { primary: "#007A3B", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Eastleigh", name: "Eastleigh", city: "Eastleigh", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 31 },
                    { id: "Gateshead", name: "Gateshead", city: "Gateshead", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Sutton United", name: "Sutton United", city: "Sutton", colors: { primary: "#FFCC00", secondary: "#5B3A29" }, reputation: 29 },
                    { id: "Aldershot", name: "Aldershot Town", city: "Aldershot", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Brackley", name: "Brackley Town", city: "Brackley", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Morecambe", name: "Morecambe", city: "Morecambe", colors: { primary: "#B4141E", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Braintree", name: "Braintree Town", city: "Braintree", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 26 },
                    { id: "Worthing", name: "Worthing", city: "Worthing", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 26 }
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
                    { id: "Hannover", name: "Hannover 96", city: "Hanover", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Kaiserslautern", name: "1. FC Kaiserslautern", city: "Kaiserslautern", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "Hertha", name: "Hertha BSC", city: "Berlin", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Nürnberg", name: "1. FC Nürnberg", city: "Nuremberg", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Bochum", name: "VfL Bochum", city: "Bochum", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Karlsruhe", name: "Karlsruher SC", city: "Karlsruhe", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 64 },
                    { id: "Dresden", name: "Dynamo Dresden", city: "Dresden", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 64 },
                    { id: "Kiel", name: "Holstein Kiel", city: "Kiel", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Bielefeld", name: "Arminia Bielefeld", city: "Bielefeld", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Magdeburg", name: "1. FC Magdeburg", city: "Magdeburg", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Braunschweig", name: "Eintracht Braunschweig", city: "Braunschweig", colors: { primary: "#F6E500", secondary: "#003D7C" }, reputation: 62 },
                    { id: "Fürth", name: "SpVgg Greuther Fürth", city: "Fürth", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Osnabrück", name: "VfL Osnabrück", city: "Osnabrück", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Cottbus", name: "Energie Cottbus", city: "Cottbus", colors: { primary: "#DA291C", secondary: "#FF6600" }, reputation: 58 }
                ]
            },
            {
                id: "3LIGA",
                name: "3. Liga",
                tier: 3,
                clubs: [
                    { id: "Düsseldorf", name: "Fortuna Düsseldorf", city: "Düsseldorf", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Münster", name: "Preußen Münster", city: "Münster", colors: { primary: "#00723F", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Essen", name: "Rot-Weiss Essen", city: "Essen", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Duisburg", name: "MSV Duisburg", city: "Duisburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Rostock", name: "Hansa Rostock", city: "Rostock", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Verl", name: "SC Verl", city: "Verl", colors: { primary: "#009640", secondary: "#000000" }, reputation: 57 },
                    { id: "Aachen", name: "Alemannia Aachen", city: "Aachen", colors: { primary: "#000000", secondary: "#FFD200" }, reputation: 57 },
                    { id: "Wiesbaden", name: "SV Wehen Wiesbaden", city: "Wiesbaden", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 56 },
                    { id: "Mannheim", name: "SV Waldhof Mannheim", city: "Mannheim", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 56 },
                    { id: "Viktoria Köln", name: "Viktoria Köln", city: "Cologne", colors: { primary: "#ac2200", secondary: "#000000" }, reputation: 55 },
                    { id: "Ingolstadt", name: "FC Ingolstadt 04", city: "Ingolstadt", colors: { primary: "#D40028", secondary: "#000000" }, reputation: 54 },
                    { id: "Regensburg", name: "SSV Jahn Regensburg", city: "Regensburg", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Stuttgart II", name: "VfB Stuttgart II", city: "Stuttgart", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Saarbrücken", name: "1. FC Saarbrücken", city: "Saarbrücken", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Hoffenheim II", name: "TSG Hoffenheim II", city: "Hoffenheim", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Havelse", name: "TSV Havelse", city: "Garbsen", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Meppen", name: "SV Meppen", city: "Meppen", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Fortuna Köln", name: "Fortuna Köln", city: "Cologne", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Großaspach", name: "SG Sonnenhof Großaspach", city: "Aspach", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 48 },
                    { id: "Würzburger", name: "Würzburger Kickers", city: "Würzburg", colors: { primary: "#000000", secondary: "#F58220" }, reputation: 48 }
                ]
            },
            {
                id: "REGIONAL1",
                name: "1. Regionalliga",
                tier: 4,
                clubs: [
                    { id: "1860", name: "TSV 1860 München", city: "Munich", colors: { primary: "#0A9BD6", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Unterhaching", name: "SpVgg Unterhaching", city: "Unterhaching", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Illertissen", name: "FV Illertissen", city: "Illertissen", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 45 },
                    { id: "Vilzing", name: "DJK Vilzing", city: "Vilzing", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 39 },
                    { id: "Bayern II", name: "Bayern Munich II", city: "Munich", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 42 },
                    { id: "Oberhausen", name: "Rot-Weiß Oberhausen", city: "Oberhausen", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 48 },
                    { id: "Schalke II", name: "FC Schalke 04 II", city: "Gelsenkirchen", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Dortmund II", name: "Borussia Dortmund II", city: "Dortmund", colors: { primary: "#FDE100", secondary: "#000000" }, reputation: 44 },
                    { id: "Gütersloh", name: "FC Gütersloh", city: "Gütersloh", colors: { primary: "#00963F", secondary: "#000000" }, reputation: 45 },
                    { id: "Siegen", name: "Sportfreunde Siegen", city: "Siegen", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 40 },
                    { id: "Freiberg", name: "SGV Freiberg", city: "Freiberg", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 45 },
                    { id: "FSV Frankfurt", name: "FSV Frankfurt", city: "Frankfurt", colors: { primary: "#009640", secondary: "#000000" }, reputation: 43 },
                    { id: "Homburg", name: "FC 08 Homburg", city: "Homburg", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Aue", name: "FC Erzgebirge Aue", city: "Aue", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Ulm", name: "SSV Ulm 1846", city: "Ulm", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Schweinfurt", name: "1. FC Schweinfurt 05", city: "Schweinfurt", colors: { primary: "#00843D", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Stuttgarter Kickers", name: "Stuttgarter Kickers", city: "Stuttgart", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 39 },
                    { id: "Lok Leipzig", name: "Lokomotive Leipzig", city: "Leipzig", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 47 },
                    { id: "Jena", name: "Carl Zeiss Jena", city: "Jena", colors: { primary: "#00A19A", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Zwickau", name: "FSV Zwickau", city: "Zwickau", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 44 },
                    { id: "Halle", name: "Hallescher FC", city: "Halle", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 42 },
                    { id: "Erfurt", name: "FC Rot-Weiß Erfurt", city: "Erfurt", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Drochtersen", name: "SV Drochtersen/Assel", city: "Drochtersen", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 43 },
                    { id: "Oldenburg", name: "VfB Oldenburg", city: "Oldenburg", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 41 }
                ]
            },
            {
                id: "REGIONAL2",
                name: "2. Regionalliga",
                tier: 5,
                clubs: [
                    { id: "Jeddeloh", name: "SSV Jeddeloh II", city: "Jeddeloh", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Lübeck", name: "Phönix Lübeck", city: "Lübeck", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 36 },
                    { id: "Bremer SV", name: "Bremer SV", city: "Bremen", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Altglienicke", name: "VSG Altglienicke", city: "Berlin", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 38 },
                    { id: "Chemnitz", name: "Chemnitzer FC", city: "Chemnitz", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Preussen", name: "BFC Preussen", city: "Berlin", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 32 },
                    { id: "Chemie Leipzig", name: "Chemie Leipzig", city: "Leipzig", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 33 },
                    { id: "Steinbach", name: "TSV Steinbach", city: "Steinbach", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 37 },
                    { id: "Kassel", name: "Hessen Kassel", city: "Kassel", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 34 },
                    { id: "Sandhausen", name: "SV Sandhausen", city: "Sandhausen", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 34 },
                    { id: "Bonner SC", name: "Bonner SC", city: "Bonn", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 39 },
                    { id: "Köln II", name: "1. FC Köln II", city: "Cologne", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Lotte", name: "Sportfreunde Lotte", city: "Lotte", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 36 },
                    { id: "Bocholt", name: "VfL Bocholt", city: "Bocholt", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Aubstadt", name: "TSV Aubstadt", city: "Aubstadt", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Eichstätt", name: "VfB Eichstätt", city: "Eichstätt", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 34 },
                    { id: "Burghausen", name: "Wacker Burghausen", city: "Burghausen", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Buchbach", name: "TSV Buchbach", city: "Buchbach", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Memmingen", name: "FC Memmingen", city: "Memmingen", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Emden", name: "Kickers Emden", city: "Emden", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Hamburg II", name: "Hamburger SV II", city: "Hamburg", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Babelsberg", name: "SV Babelsberg 03", city: "Potsdam", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 33 },
                    { id: "Greifswald", name: "Greifswalder FC", city: "Greifswald", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 31 },
                    { id: "Offenbach", name: "Kickers Offenbach", city: "Offenbach", colors: { primary: "#0F1B5F", secondary: "#FFD200" }, reputation: 34 }
                ]
            },
            {
                id: "REGIONAL3",
                name: "3. Regionalliga",
                tier: 6,
                clubs: [
                    { id: "Bayreuth", name: "SpVgg Bayreuth", city: "Bayreuth", colors: { primary: "#FFD200", secondary: "#000000" }, reputation: 29 },
                    { id: "Augsburg II", name: "FC Augsburg II", city: "Augsburg", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Schwaben Augsburg", name: "FC Schwaben Augsburg", city: "Augsburg", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Landsberg", name: "TSV Landsberg", city: "Landsberg", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 27 },
                    { id: "Eltersdorf", name: "SC Eltersdorf", city: "Eltersdorf", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 27 },
                    { id: "Paderborn II", name: "SC Paderborn 07 II", city: "Paderborn", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 27 },
                    { id: "Rödinghausen", name: "SV Rödinghausen", city: "Rödinghausen", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Wiedenbrück", name: "SC Wiedenbrück", city: "Wiedenbrück", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 28 },
                    { id: "Bergisch Gladbach", name: "SV Bergisch Gladbach 09", city: "Bergisch Gladbach", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Wattenscheid", name: "Wattenscheid 09", city: "Bochum", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Barockstadt", name: "SG Barockstadt", city: "Fulda", colors: { primary: "#0F1B5F", secondary: "#000000" }, reputation: 29 },
                    { id: "Walldorf", name: "Astoria Walldorf", city: "Walldorf", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Trier", name: "Eintracht Trier", city: "Trier", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 27 },
                    { id: "Aalen", name: "VfR Aalen", city: "Aalen", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 27 },
                    { id: "Tasmania", name: "Tasmania Berlin", city: "Berlin", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 25 },
                    { id: "Hertha II", name: "Hertha BSC II", city: "Berlin", colors: { primary: "#009640", secondary: "#000000" }, reputation: 27 },
                    { id: "Dynamo Berlin", name: "BFC Dynamo", city: "Berlin", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 28 },
                    { id: "RSV Eintracht", name: "RSV Eintracht 1949", city: "Berlin", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 28 },
                    { id: "Weiche", name: "SC Weiche 08", city: "Flensburg", colors: { primary: "#00A19A", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "VfB Lübeck", name: "VfB Lübeck", city: "Lübeck", colors: { primary: "#00A94F", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "HSC Hannover", name: "HSC Hannover", city: "Hannover", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 28 },
                    { id: "Schöningen", name: "FSV Schöningen", city: "Schöningen", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 27 },
                    { id: "Norderstedt", name: "FC Eintracht Norderstedt", city: "Norderstedt", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Todesfelde", name: "SV Todesfelde", city: "Todesfelde", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 27 }
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
                    { id: "Mallorca", name: "RCD Mallorca", city: "Palma de Mallorca", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 74 },
                    { id: "Girona", name: "Girona FC", city: "Girona", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Oviedo", name: "Real Oviedo", city: "Oviedo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Almeria", name: "UD Almería", city: "Almería", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 71 },
                    { id: "Las Palmas", name: "UD Las Palmas", city: "Las Palmas", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Castellón", name: "CD Castellón", city: "Castellón de la Plana", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Burgos", name: "Burgos CF", city: "Burgos", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 69 },
                    { id: "Eibar", name: "SD Eibar", city: "Eibar", colors: { primary: "#9F1E3C", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Gijón", name: "Sporting Gijón", city: "Gijón", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Cordoba", name: "Córdoba CF", city: "Córdoba", colors: { primary: "#007A33", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Ceuta", name: "AD Ceuta", city: "Ceuta", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 66 },
                    { id: "Albacete", name: "Albacete Balompié", city: "Albacete", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 67 },
                    { id: "Andorra", name: "FC Andorra", city: "Andorra la Vella", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 66 },
                    { id: "Granada", name: "Granada CF", city: "Granada", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Real Sociedad B", name: "Real Sociedad B", city: "San Sebastián", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "Leganés", name: "CD Leganés", city: "Leganés", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Valladolid", name: "Real Valladolid", city: "Valladolid", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Cádiz", name: "Cádiz CF", city: "Cádiz", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 65 },
                    { id: "Tenerife", name: "CD Tenerife", city: "Santa Cruz de Tenerife", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Eldense", name: "CD Eldense", city: "Elda", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 63 },
                    { id: "Sabadell", name: "CE Sabadell", city: "Sabadell", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 62 },
                    { id: "Celta Vigo B", name: "Celta Vigo B", city: "Vigo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                ]
            },
            {
                id: "PrimeraSup",
                name: "Primera Superior",
                tier: 3,
                clubs: [
                    { id: "Zaragoza", name: "Real Zaragoza", city: "Zaragoza", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Huesca", name: "SD Huesca", city: "Huesca", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 61 },
                    { id: "Leonesa", name: "Cultural Leonesa", city: "León", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Mirandés", name: "CD Mirandés", city: "Miranda de Ebro", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 60 },
                    { id: "Zamora", name: "Zamora CF", city: "Zamora", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Ponferradina", name: "SD Ponferradina", city: "Ponferrada", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 58 },
                    { id: "Pontevedra", name: "Pontevedra CF", city: "Pontevedra", colors: { primary: "#6B2737", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Barakaldo", name: "Barakaldo CF", city: "Barakaldo", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Unionistas", name: "Uniónistas CF", city: "Salamanca", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Lugo", name: "CD Lugo", city: "Lugo", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Mérida", name: "Mérida AD", city: "Mérida", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Arenas", name: "Arenas Club", city: "Getxo", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 54 },
                    { id: "Ferrol", name: "Racing de Ferrol", city: "Ferrol", colors: { primary: "#009B48", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Atletico Madrid B", name: "Atlético Madrileño", city: "Madrid", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 57 },
                    { id: "Villareal B", name: "Villarreal B", city: "Villarreal", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 56 },
                    { id: "Real Madrid B", name: "Real Madrid Castilla", city: "Madrid", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Europa", name: "CE Europa", city: "Barcelona", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Cartagena", name: "FC Cartagena", city: "Cartagena", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Antequera", name: "Antequera CF", city: "Antequera", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 52 },
                    { id: "Algeciras", name: "Algeciras CF", city: "Algeciras", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 51 },
                    { id: "Hércules", name: "Hércules CF", city: "Alicante", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Real Murcia", name: "Real Murcia CF", city: "Murcia", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 }
                ]
            },
            {
                id: "PrimeraInf",
                name: "Primera Inferior",
                tier: 4,
                clubs: [
                    { id: "Alcorcón", name: "AD Alcorcón", city: "Alcorcón", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 49 },
                    { id: "Ibiza", name: "UD Ibiza", city: "Ibiza", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 48 },
                    { id: "Teruel", name: "CD Teruel", city: "Teruel", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Gimnástica", name: "Gimnástica de Torrelavega", city: "Torrelavega", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 46 },
                    { id: "Torremolinos", name: "UD Torremolinos", city: "Torremolinos", colors: { primary: "#009640", secondary: "#000000" }, reputation: 45 },
                    { id: "Majadaonda", name: "Rayo Majadahonda", city: "Majadahonda", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 43 },
                    { id: "Sant Andreu", name: "UE Sant Andreu", city: "Barcelona", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 41 },
                    { id: "Águilas", name: "Águilas FC", city: "Águilas", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Real Jaén", name: "Real Jaén CF", city: "Jaén", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Athletic Bilbao B", name: "Bilbao Athletic", city: "Bilbao", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 43 },
                    { id: "Avilés", name: "Real Avilés CF", city: "Avilés", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 49 },
                    { id: "Cacereño", name: "CP Cacereño", city: "Cáceres", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 47 },
                    { id: "Extremadura", name: "CD Extremadura", city: "Almendralejo", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 46 },
                    { id: "Real Union", name: "Real Unión", city: "Irun", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 45 },
                    { id: "Fabril", name: "Deportivo Fabril", city: "La Coruña", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 44 },
                    { id: "Ourense", name: "CD Ourense", city: "Ourense", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 42 },
                    { id: "Coria", name: "CD Coria", city: "Coria", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Logroñés", name: "UD Logroñés", city: "Logroño", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Barcelona B", name: "FC Barcelona B", city: "Barcelona", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 48 },
                    { id: "Terrassa", name: "Terrassa FC", city: "Terrassa", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 38 },
                    { id: "Rayo Cantabria", name: "Rayo Cantabria", city: "Santander", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Basconia", name: "CD Basconia", city: "Bilbao", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 37 }
                ]
            },
            {
                id: "Segunda",
                name: "Segunda Federación",
                tier: 5,
                clubs: [
                    { id: "Real Oviedo B", name: "Real Oviedo Vetusta", city: "Oviedo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Bergantiños", name: "Bergantiños FC", city: "Carballo", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 38},
                    { id: "Alavés B", name: "Deportivo Alavés B", city: "Vitoria-Gasteiz", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Sestao River", name: "Sestao River", city: "Sestao", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Arosa", name: "Arosa SC", city: "Vilagarcía de Arousa", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 31 },
                    { id: "Peña Sport", name: "Peña Sport FC", city: "Tafalla", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Sevilla Atlético", name: "FC Sevilla Atlético", city: "Sevilla", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 36 },
                    { id: "R. Huelva", name: "Recreativo Huelva", city: "Huelva", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 34 },
                    { id: "Xerez", name: "Deportivo Xerez", city: "Jerez de la Frontera", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 33 },
                    { id: "Marbella", name: "Marbella FC", city: "Marbella", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 31 },
                    { id: "Don Benito", name: "CD Don Benito", city: "Don Benito", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Lucena", name: "Ciudad Lucena", city: "Lucena", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 29 },
                    { id: "Tamaraceite", name: "UD Tamaraceite", city: "Las Palmas de Gran Canaria", colors: { primary: "#009640", secondary: "#000000" }, reputation: 31 },
                    { id: "Sanluqueño", name: "Atlético Sanluqueño", city: "Sanlúcar de Barrameda", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 29 },
                    { id: "UCAM Murcia", name: "UCAM Murcia", city: "Murcia", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 35 },
                    { id: "Valencia B", name: "Valencia Mestalla", city: "Valencia", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Intercity", name: "CF Intercity", city: "Alicante", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 29 },
                    { id: "CD Guadalajara", name: "CD Guadalajara", city: "Guadalajara", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Salamanca", name: "Salamanca CF UDS", city: "Villares de la Reina (Salamanca)", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Atlético Albacete", name: "Atlético Albacete", city: "Albacete", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 33 }
                ]
            }
        ]
    },
        "Switzerland": {
        country: "Switzerland",
        tiers: [
            { 
                id: "SuperLeagueCH", 
                name: "Super League", 
                tier: 1,
                clubs: [
                    { id: "Basel", name: "FC Basel", city: "Basel", colors: { primary: "#E2001A", secondary: "#1C3F94" }, reputation: 80 },
                    { id: "YB", name: "Young Boys", city: "Bern", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 79 },
                    { id: "FCZ", name: "FC Zürich", city: "Zürich", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 75},
                    { id: "FC Lugano", name: "FC Lugano", city: "Lugano", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "FCSG", name: "FC St. Gallen", city: "St. Gallen", colors: { primary: "#00934A", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "Servette", name: "Servette", city: "Genève", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "Lausanne-Sport", name: "Lausanne-Sport", city: "Lausanne", colors: { primary: "#0057A8", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Sion", name: "FC Sion", city: "Sion", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Luzern", name: "FC Luzern", city: "Luzern", colors: { primary: "#00479D", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Thun", name: "FC Thun", city: "Thun", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 66 },
                    { id: "GCZ", name: "Grasshoppers", city: "Zürich", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "Vaduz", name: "FC Vaduz", city: "Vaduz", colors: { primary: "#003DA5", secondary: "#000000" }, reputation: 62 }
                ]
            },
            {
                id: "ChallengeLeague",
                name: "Challenge League",
                tier: 2,
                clubs: [
                    { id: "Winterthur", name: "FC Winterthur", city: "Winterthur", colors: { primary: "#FFD500", secondary: "#000000" }, reputation: 63 },
                    { id: "Aarau", name: "FC Aarau", city: "Aarau", colors: { primary: "#0F1B5F", secondary: "#000000" }, reputation: 60 },
                    { id: "Yverdon", name: "FC Yverdon", city: "Yverden-les-Bains", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 58},
                    { id: "Stade Lausanne", name: "Stade Lausanne-Ouchy", city: "Lausanne", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 54 },
                    { id: "Xamax", name: "Xamax", city: "Neuchâtel", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 55 },
                    { id: "FCRJ", name: "FC Rapperswil-Jona", city: "Rapperswil-Jona", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 52 },
                    { id: "Etoile Carouge", name: "Etoile Carouge", city: "Carouge", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Wil", name: "FC Wil", city: "Wil", colors: { primary: "#000000", secondary: "#E2001A" }, reputation: 49 },
                    { id: "Nyonnais", name: "Stade Nyonnais", city: "Nyon", colors: { primary: "#009640", secondary: "#000000" }, reputation: 48 },
                    { id: "Kriens", name: "FC Kriens", city: "Kriens", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 47 }
                ]
            },
            {
                id: "PromotionLeague",
                name: "Promotion League",
                tier: 3,
                clubs: [
                    { id: "Bellinzona", name: "FC Bellinzona", city: "Bellinzona", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 47 },
                    { id: "Biel-Bienne", name: "FC Biel-Bienne", city: "Biel-Bienne", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Brühl", name: "SC Brühl SG", city: "St. Gallen", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 45},
                    { id: "Basel U21", name: "FC Basel U21", city: "Basel", colors: { primary: "#E2001A", secondary: "#1C3F94" }, reputation: 41 },
                    { id: "Bavois", name: "FC Bavois", city: "Bavois", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 42 },
                    { id: "YB U21", name: "Young Boys U21", city: "Bern", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 40 },
                    { id: "Schaffhausen", name: "FC Schaffhausen", city: "Schaffhausen", colors: { primary: "#000000", secondary: "#5BA4D8" }, reputation: 40 },
                    { id: "FC Bulle", name: "FC Bulle", city: "Bulle", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "SC Cham", name: "SC Cham", city: "Cham", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 38 },
                    { id: "Grand-Saconnex", name: "FC Grand-Saconnex", city: "Le Grand-Saconnex", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "FC Zürich U21", name: "FC Zürich U21", city: "Zürich", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "FC Breitenrain", name: "FC Breitenrain", city: "Bern", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 36 },
                    { id: "FC Luzern U21", name: "FC Luzern U21", city: "Luzern", colors: { primary: "#00479D", secondary: "#FFFFFF" }, reputation: 34},
                    { id: "FC Kreuzlingen", name: "FC Kreuzlingen", city: "Kreuzlingen", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 35 },
                    { id: "Collina d'Oro", name: "FC Collina d'Oro", city: "Collina d'Oro", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 32 },
                    { id: "FC Paradiso", name: "FC Paradiso", city: "Paradiso", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Amical Saint-Prex", name: "FC Amical Saint-Prex", city: "Saint-Prex", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 31 },
                    { id: "YF Juventus", name: "YF Juventus", city: "Zürich", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 33 }
                ]
            },
            {
                id: "1.LigaCH",
                name: "1. Liga",
                tier: 4,
                clubs: [
                    { id: "Vevey-Sports", name: "Vevey-Sports", city: "Vevey", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Lausanne-Sport U21", name: "Lausanne-Sport U21", city: "Lausanne", colors: { primary: "#0057A8", secondary: "#FFFFFF" }, reputation: 25 },
                    { id: "CS Chênois", name: "CS Chênois", city: "Thônex", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 30},
                    { id: "FC Coffrane", name: "FC Coffrane", city: "Coffrane", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 22 },
                    { id: "FC Prishtina BE", name: "FC Prishtina BE", city: "Bern", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "FC Naters", name: "FC Naters", city: "Naters", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "La Chaux-de-Fonds", name: "La Chaux-de-Fonds", city: "La Chaux-de-Fonds", colors: { primary: "#FCD200", secondary: "#0033A0" }, reputation: 26 },
                    { id: "Lancy FC", name: "Lancy FC", city: "Lancy", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "FC Tuggen", name: "FC Tuggen", city: "Tuggen", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 30 },
                    { id: "FC Wettswil-Bonstetten", name: "FC Wettswil-Bonstetten", city: "Wettswil-Bonstetten", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "FC Baden 1897", name: "FC Baden 1897", city: "Baden", colors: { primary: "#000000", secondary: "#E2001A" }, reputation: 26 },
                    { id: "FC Mendrisio", name: "FC Mendrisio", city: "Mendrisio", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 24 },
                    { id: "FC Kosova", name: "FC Kosova ZH", city: "Zürich", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 25},
                    { id: "FC Winterthur U21", name: "FC Winterthur U21", city: "Winterthur", colors: { primary: "#FFD500", secondary: "#000000" }, reputation: 23 },
                    { id: "FC Lugano U21", name: "FC Lugano 2", city: "Lugano", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Eschen/Mauren", name: "USV Eschen/Mauren", city: "Eschen/Mauren", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 24 },
                    { id: "Grasshoppers U21", name: "Grasshoppers U21", city: "Zürich", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "FC Langenthal", name: "FC Langenthal", city: "Langenthal", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 33 },
                    { id: "SV Muttenz", name: "SV Muttenz", city: "Muttenz", colors: { primary: "#0033A0", secondary: "#FCD200" }, reputation: 29},
                    { id: "Concordia BS", name: "FC Concordia BS", city: "Basel", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "FC Solothurn", name: "FC Solothurn", city: "Solothurn", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 25 },
                    { id: "FC Wohlen", name: "FC Wohlen", city: "Wohlen", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 23 },
                    { id: "Zug 94", name: "Zug 94", city: "Zug", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 24 },
                    { id: "FC Black Stars", name: "FC Black Stars", city: "Basel", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 23 }
                ]
            },
            {
                id: "2.LigaCH",
                name: "2. Liga",
                tier: 5,
                clubs: [
                    { id: "FC Courtételle", name: "FC Courtételle", city: "Courtételle", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 23 },
                    { id: "FC Schötz", name: "FC Schötz", city: "Schötz", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "FC Münsingen", name: "FC Münsingen", city: "Münsingen", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 22},
                    { id: "FC Bassecourt", name: "FC Bassecourt", city: "Bassecourt", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 22 },
                    { id: "SC Buochs", name: "SC Buochs", city: "Buochs", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "SR Delémont", name: "SR Delémont", city: "Delémont", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "FC Muri-Gümligen", name: "FC Muri-Gümligen", city: "Gümligen", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 18 },
                    { id: "FC Monthey", name: "FC Monthey", city: "Monthey", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 23 },
                    { id: "FC Portalban", name: "FC Portalban", city: "Delley-Portalban", colors: { primary: "#DA291C", secondary: "#0033A0" }, reputation: 22 },
                    { id: "FC Echallens", name: "FC Echallens", city: "Echallens", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 21 },
                    { id: "Stade-Payerne", name: "Stade-Payerne", city: "Payerne", colors: { primary: "#00A19A", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "Meyrin FC", name: "Meyrin FC", city: "Meyrin", colors: { primary: "#FCD200", secondary: "#0033A0" }, reputation: 20 },
                    { id: "USI Azzurri", name: "USI Azzurri", city: "Châtelaine", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 19},
                    { id: "Servette U21", name: "Servette U21", city: "Genève", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "FC Gossau", name: "FC Gossau", city: "Gossau SG", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 23 },
                    { id: "FC Locarno", name: "FC Locarno", city: "Locarno", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 21 },
                    { id: "FC Thalwil", name: "FC Thalwil", city: "Thalwil", colors: { primary: "#003DA5", secondary: "#FCD200" }, reputation: 20 },
                    { id: "FC Freienbach", name: "FC Freienbach", city: "Freienbach", colors: { primary: "#009640", secondary: "#000000" }, reputation: 19 },
                    { id: "FC Dietikon", name: "FC Dietikon", city: "Dietikon", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 20},
                    { id: "AC Taverne", name: "AC Taverne", city: "Taverne", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "FC Widnau", name: "FC Widnau", city: "Widnau", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 22 },
                    { id: "FCSG U21", name: "FC St. Gallen U21", city: "St. Gallen", colors: { primary: "#00934A", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "FC Sion U21", name: "FC Sion U21", city: "Sion", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "FC Ellikon Marthalen", name: "FC Ellikon Marthalen", city: "Marthalen", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 18 }
                ]
            }
        ]
    },
    "Italy": {
        country: "Italy",
        tiers: [
            { 
                id: "SerieA", 
                name: "Serie A", 
                tier: 1,
                clubs: [
                    { id: "Inter Milan", name: "Inter", city: "Milan", colors: { primary: "#0B1560", secondary: "#000000" }, reputation: 88 },
                    { id: "Napoli", name: "SSC Napoli", city: "Napoli", colors: { primary: "#0E7DC2", secondary: "#FFFFFF" }, reputation: 86 },
                    { id: "Juventus", name: "Juventus", city: "Torino", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 85 },
                    { id: "AC Milan", name: "AC Milan", city: "Milan", colors: { primary: "#FB090B", secondary: "#000000" }, reputation: 85 },
                    { id: "AS Roma", name: "AS Roma", city: "Rome", colors: { primary: "#8E1F2F", secondary: "#F0BC42" }, reputation: 81 },
                    { id: "Atalanta", name: "Atalanta", city: "Bergamo", colors: { primary: "#1961AE", secondary: "#000000" }, reputation: 79 },
                    { id: "Lazio", name: "Lazio", city: "Rome", colors: { primary: "#6CACE4", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "FC Bologna", name: "FC Bologna", city: "Bologna", colors: { primary: "#A5122A", secondary: "#1C2B7F" }, reputation: 78 },
                    { id: "Fiorentina", name: "AC Fiorentina", city: "Florence", colors: { primary: "#592C82", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "Como", name: "Como 1907", city: "Como", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Udinese", name: "Udinese", city: "Udine", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "US Sassuolo", name: "US Sassuolo", city: "Sassuolo", colors: { primary: "#00A752", secondary: "#000000" }, reputation: 75 },
                    { id: "FC Torino", name: "FC Torino", city: "Torino", colors: { primary: "#7A1E28", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "Parma Calcio", name: "Parma Calcio", city: "Parma", colors: { primary: "#FFD100", secondary: "#1C4E9D" }, reputation: 74 },
                    { id: "Cagliari", name: "Cagliari", city: "Cagliari", colors: { primary: "#A3122E", secondary: "#1B3A6B" }, reputation: 74 },
                    { id: "Genua CFC", name: "Genua CFC", city: "Genua", colors: { primary: "#A5122A", secondary: "#1C2B7F" }, reputation: 73 },
                    { id: "Lecce", name: "US Lecce", city: "Lecce", colors: { primary: "#FCD200", secondary: "#E30613" }, reputation: 73 },
                    { id: "Venezia FC", name: "Venezia FC", city: "Venice", colors: { primary: "#000000", secondary: "#FF7A00" }, reputation: 73 },
                    { id: "Frosinone", name: "Frosinone", city: "Frosinone", colors: { primary: "#F4C40E", secondary: "#12326E" }, reputation: 72 },
                    { id: "Monza", name: "AC Monza", city: "Monza", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 72 }
                ]
            },
            {
                id: "SerieB", 
                name: "Serie B",
                tier: 2,
                clubs: [
                    { id: "Pisa SC", name: "Pisa SC", city: "Pisa", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 72 },
                    { id: "Hellas Verona", name: "Hellas Verona", city: "Verona", colors: { primary: "#143A85", secondary: "#FCD200" }, reputation: 73 },
                    { id: "Cremonese", name: "US Cremonese", city: "Cremona", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Palermo", name: "Palermo", city: "Palermo", colors: { primary: "#F6A9C7", secondary: "#000000" }, reputation: 71 },
                    { id: "Catanzaro", name: "Catanzaro", city: "Catanzaro", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 69 },
                    { id: "Modena FC", name: "Modena FC", city: "Modena", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Avellino", name: "US Avellino", city: "Avellino", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 68 },
                    { id: "Calcio Padova", name: "Calcio Padova", city: "Padova", colors: { primary: "#9F1E3C", secondary: "#005BAC" }, reputation: 69 },
                    { id: "Cesena", name: "Cesena", city: "Cesena", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "Mantova", name: "Mantova 1911", city: "Mantova", colors: { primary: "#007A33", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Carrarese", name: "Carrarese", city: "Carrara", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 66 },
                    { id: "Sampdoria", name: "Sampdoria", city: "Genua", colors: { primary: "#1B398E", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Virtus Entella", name: "Virtus Entella", city: "Chiavari", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 65 },
                    { id: "FC Empoli", name: "FC Empoli", city: "Empoli", colors: { primary: "#0066B3", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Südtirol", name: "FC Südtirol", city: "Bozen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Benevento", name: "Benevento", city: "Benevento", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "LR Vicenza", name: "LR Vicenza", city: "Vicenza", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Arezzo", name: "Arezzo", city: "Arezzo", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 62 },
                    { id: "Ascoli", name: "Ascoli", city: "Ascoli", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Juve Stabia", name: "Juve Stabia", city: "Castellammare di Stabia", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 61 }
                ]
            },
            {
                id: "SerieC",
                name: "Serie C",
                tier: 3,
                clubs: [
                    { id: "Reggiana", name: "Reggiana", city: "Reggiana", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Spezia Calcio", name: "Spezia Calcio", city: "La Spezia", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 61 },
                    { id: "Ravenna", name: "Ravenna", city: "Ravenna", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Campobasso", name: "Campobasso", city: "Campobasso", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 56 },
                    { id: "Pianese", name: "Pianese", city: "Piancastagnaio", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Pineto", name: "Pineto", city: "Pineto", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 53 },
                    { id: "AS Gubbio", name: "AS Gubbio", city: "Gubbio", colors: { primary: "#6B2737", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Vis Pesaro", name: "Vis Pesaro", city: "Pesaro", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "SSC Bari", name: "SSC Bari", city: "Bari", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Catania", name: "Catania", city: "Catania", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "US Salernitana", name: "US Salernitana", city: "Salerno", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Cosenza", name: "Cosenza", city: "Cosenza", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 58 },
                    { id: "Casertana", name: "Casertana", city: "Caserta", colors: { primary: "#009B48", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "FC Crotone", name: "FC Crotone", city: "Crotone", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 58 },
                    { id: "Casarano", name: "Casarano", city: "Casarano", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 52 },
                    { id: "Monopoli", name: "Monopoli", city: "Monopoli", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Union Brescia", name: "Union Brescia", city: "Brescia", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Renate", name: "AC Renate", city: "Renate", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Lecco", name: "Lecco", city: "Lecco", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 56 },
                    { id: "AC Trento", name: "AC Trento", city: "Trento", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 55 },
                    { id: "AS Cittadella", name: "AS Cittadella", city: "Cittadella", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Lumezzane", name: "Lumezzane", city: "Lumezzane", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Alcione", name: "Alcione", city: "Milan", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Arzignano", name: "Arzignano", city: "Arzignano", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 }
                ]
            },
            {
                id: "SerieD",
                name: "Serie D",
                tier: 4,
                clubs: [
                    { id: "Team Altamura", name: "Team Altamura", city: "Altamura", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Giana Erminio", name: "Giana Erminio", city: "Gorgonzola", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "AlbinoLeffe", name: "AlbinoLeffe", city: "Bergamo", colors: { primary: "#6AADE4", secondary: "#0F1B5F" }, reputation: 47 },
                    { id: "Dolomiti Bellunesi", name: "Dolomiti Bellunesi", city: "Feltre", colors: { primary: "#E5007E", secondary: "#009640" }, reputation: 44 },
                    { id: "Novara FC", name: "Novara FC", city: "Novara", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Pro Vercelli", name: "Pro Vercelli", city: "Vercelli", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 43 },
                    { id: "Ospitaletto", name: "Ospitaletto", city: "Ospitaletto", colors: { primary: "#E30613", secondary: "#0F1B5F" }, reputation: 41 },
                    { id: "Livorno", name: "Livorno", city: "Livorno", colors: { primary: "#7A1E3C", secondary: "#FCD200" }, reputation: 47 },
                    { id: "Forli", name: "Forlì FC", city: "Forli", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Carpi", name: "Carpi", city: "Carpi", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "AC Perugia", name: "AC Perugia", city: "Perugia", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Guidonia", name: "Guidonia", city: "Guidonia Montecelio", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 43 },
                    { id: "US Sambenedettese", name: "US Sambenedettese", city: "San Benedetto del Tronto", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 41 },
                    { id: "SEF Torres 1903", name: "SEF Torres 1903", city: "Sassari", colors: { primary: "#E30613", secondary: "#0F1B5F" }, reputation: 40 },
                    { id: "Barletta", name: "Barletta", city: "Barletta", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 39 },
                    { id: "Cavese", name: "Cavese", city: "Cava dei Tirreni", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Giugliano", name: "Giugliano", city: "Giugliano in Campania", colors: { primary: "#0F1B5F", secondary: "#FCD200" }, reputation: 39 },
                    { id: "Picerno", name: "Picerno", city: "Picerno", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 38 },
                    { id: "Potenza", name: "Potenza", city: "Potenza", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 38 },
                    { id: "US Savoia", name: "US Savoia", city: "Torre Annunziata", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 38 }
                ]
            }
        ]
    },
    "France": {
        country: "France",
        tiers: [
            { 
                id: "Ligue1", 
                name: "Ligue 1", 
                tier: 1,
                clubs: [
                    { id: "PSG", name: "PSG", city: "Paris", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 90 },
                    { id: "Olympique Lyon", name: "Olympique Lyon", city: "Lyon", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 81 },
                    { id: "Lens", name: "RC Lens", city: "Lens", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 79 },
                    { id: "LOSC Lille", name: "LOSC Lille", city: "Lille", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 79 },
                    { id: "Marseille", name: "Marseille", city: "Marseille", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Stade Rennes", name: "Stade Rennes", city: "Rennes", colors: { primary: "#000000", secondary: "#E30613" }, reputation: 77 },
                    { id: "AS Monaco", name: "AS Monaco", city: "Monaco", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 80 },
                    { id: "RC Strasbourg", name: "RC Strasbourg", city: "Strasbourg", colors: { primary: "#6AADE4", secondary: "#E30613" }, reputation: 76 },
                    { id: "FC Lorient", name: "FC Lorient", city: "Lorient", colors: { primary: "#E30613", secondary: "#F58220" }, reputation: 73 },
                    { id: "FC Toulouse", name: "FC Toulouse", city: "Toulouse", colors: { primary: "#6A1B9A", secondary: "#E30613" }, reputation: 74 },
                    { id: "Paris FC", name: "Paris FC", city: "Paris", colors: { primary: "#0F1B5F", secondary: "#005BAC" }, reputation: 75 },
                    { id: "Stade Brest", name: "Stade Brest", city: "Brest", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Angers SCO", name: "Angers SCO", city: "Angers", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Le Havre AC", name: "Le Havre AC", city: "Le Havre", colors: { primary: "#6AADE4", secondary: "#0F1B5F" }, reputation: 73 },
                    { id: "AJ Auxerre", name: "AJ Auxerre", city: "Auxerre", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "OGC Nice", name: "OGC Nice", city: "Nice", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 76 },
                    { id: "Troyes", name: "ESTAC Troyes", city: "Troyes", colors: { primary: "#005BAC", secondary: "#005BAC" }, reputation: 71 },
                    { id: "Le Mans FC", name: "Le Mans FC", city: "Le Mans", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 70 }
                ]
            },
            {
                id: "Ligue2", 
                name: "Ligue 2",
                tier: 2,
                clubs: [
                    { id: "FC Nantes", name: "FC Nantes", city: "Nantes", colors: { primary: "#D4AF37", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "Saint-Étienne", name: "Saint-Étienne", city: "Saint-Étienne", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Stade Reims", name: "Stade Reims", city: "Reims", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "FC Metz", name: "FC Metz", city: "Metz", colors: { primary: "#8E1F2F", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Montpellier HSC", name: "Montpellier HSC", city: "Montpellier", colors: { primary: "#F58220", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Rodez AF", name: "Rodez AF", city: "Rodez", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 67 },
                    { id: "Pau FC", name: "Pau FC", city: "Pau", colors: { primary: "#0F1B5F", secondary: "#FCD200" }, reputation: 68 },
                    { id: "Clermont Foot 63", name: "Clermont Foot 63", city: "Clermont", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 69 },
                    { id: "Red Star FC", name: "Red Star FC", city: "Paris", colors: { primary: "#00593C", secondary: "#E30613" }, reputation: 66 },
                    { id: "Grenoble Foot 38", name: "Grenoble Foot 38", city: "Grenoble", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "USL Dunkerque", name: "USL Dunkerque", city: "Dunkerque", colors: { primary: "#0F1B5F", secondary: "#D4AF37" }, reputation: 65 },
                    { id: "AS Nancy", name: "AS Nancy", city: "Nancy", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Stade Lavallois", name: "Stade Lavallois", city: "Laval", colors: { primary: "#000000", secondary: "#F58220" }, reputation: 64 },
                    { id: "EA Guingamp", name: "EA Guingamp", city: "Guingamp", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 66 },
                    { id: "FC Annecy", name: "FC Annecy", city: "Annecy", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "US Boulogne", name: "US Boulogne", city: "Boulogne", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 63 },
                    { id: "FC Sochaux-Montbéliard", name: "Sochaux-Montbéliard", city: "Sochaux-Montbéliard", colors: { primary: "#005BAC", secondary: "#FCD200" }, reputation: 62 },
                    { id: "Dijon FCO", name: "Dijon FCO", city: "Dijon", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 61 }
                ]
            },
            {
                id: "Ligue3",
                name: "Ligue 3",
                tier: 3,
                clubs: [
                    { id: "Amiens SC", name: "Amiens SC", city: "Amiens", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "SC Bastia", name: "SC Bastia", city: "Bastia", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "US Orléans", name: "US Orléans", city: "Orléans", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 60 },
                    { id: "FC Versailles 78", name: "FC Versailles 78", city: "Versailles", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "SM Caen", name: "SM Caen", city: "Caen", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 59 },
                    { id: "FC Valenciennes", name: "FC Valenciennes", city: "Valenciennes", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "US Concarneau", name: "US Concarneau", city: "Concarneau", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 55 },
                    { id: "FC Villefranche-Beaujolais", name: "Villefranche-Beaujolais", city: "Villefranche-sur-Saône", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "FC Fleury 91", name: "FC Fleury 91", city: "Bondoufle", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 55 },
                    { id: "Paris 13 Atletico", name: "Paris 13 Atletico", city: "Paris", colors: { primary: "#39FF14", secondary: "#000000" }, reputation: 55 },
                    { id: "SC Aubagne Air Bel", name: "SC Aubagne Air Bel", city: "Aubagne", colors: { primary: "#000000", secondary: "#D9CBB2" }, reputation: 54 },
                    { id: "Le Puy-en-Velay FC", name: "Le Puy-en-Velay FC", city: "Espaly-Saint-Marcel", colors: { primary: "#0F1B5F", secondary: "#6AADE4" }, reputation: 53 },
                    { id: "FC Rouen", name: "FC Rouen", city: "Rouen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Quevilly-Rouen Métropole", name: "Quevilly-Rouen Métropole", city: "Le Petit-Quevilly", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 51 },
                    { id: "Football Bourg-en-Bresse Péronnas", name: "Football Bourg-en-Bresse Péronnas", city: "Bourg-en-Bresse", colors: { primary: "#0F1B5F", secondary: "#6AADE4" }, reputation: 50 },
                    { id: "AS Cannes", name: "AS Cannes", city: "Cannes", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "US Thionville Lusitanos", name: " US Thionville Lusitanos ", city: "Thionville", colors: { primary: "#FFFFFF", secondary: "#D4AF37" }, reputation: 49 },
                    { id: "VFC La Roche", name: "VFC La Roche", city: "La Roche-sur-Yon", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 49 }
                ]
            },
            {
                id: "Ligue4",
                name: "Ligue 4",
                tier: 4,
                clubs: [
                    { id: "Girondins Bordeaux", name: "Girondins Bordeaux", city: "Bordeaux", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Aviron Bayonnais", name: "Aviron Bayonnais", city: "Bayonne", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "US Saint-Malo", name: "US Saint-Malo", city: "Saint-Malo", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 44 },
                    { id: "Les Herbiers", name: "Les Herbiers", city: "Les Herbiers", colors: { primary: "#000000", secondary: "#E30613" }, reputation: 42 },
                    { id: "Angoulême CFC", name: "Angoulême CFC", city: "Angoulême", colors: { primary: "#0F1B5F", secondary: "#6AADE4" }, reputation: 43 },
                    { id: "Dinan Léhon", name: "Dinan Léhon", city: "Dinan", colors: { primary: "#0F1B5F", secondary: "#FFF3B0" }, reputation: 41 },
                    { id: "Bourges FC", name: "Bourges FC", city: "Bourges", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 47 },
                    { id: "FR Haguenau", name: "FR Haguenau", city: "Haguenau", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 45 },
                    { id: "Entente Feignies Aulnoye", name: "Entente Feignies Aulnoye", city: "Feignies", colors: { primary: "#005BAC", secondary: "#009640" }, reputation: 44 },
                    { id: "AS Furiani-Agliani", name: "AS Furiani-Agliani", city: "Bastia", colors: { primary: "#FFFFFF", secondary: "#FCD200" }, reputation: 43 },
                    { id: "Saint-Pryvé Saint-Hilaire", name: "Saint-Pryvé Saint-Hilaire", city: "Saint-Pryvé-Saint-Mesmin", colors: { primary: "#FFFFFF", secondary: "#005BAC" }, reputation: 42 },
                    { id: "FC Dieppe", name: "FC Dieppe", city: "Saint-Aubin-sur-Scie", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "FC Borgo", name: "FC Borgo", city: "Borgo", colors: { primary: "#000000", secondary: "#E30613" }, reputation: 38 },
                    { id: "Nîmes Olympique", name: "Nîmes Olympique", city: "Nîmes", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "US Lusitanos", name: "US Lusitanos", city: "Saint-Maur", colors: { primary: "#009640", secondary: "#E30613" }, reputation: 46 },
                    { id: "GFA Rumilly Vallières", name: "GFA Rumilly Vallières", city: "Rumilly", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Hyères 83 FC", name: "Hyères 83 FC", city: "Hyères", colors: { primary: "#D4AF37", secondary: "#241033" }, reputation: 43 },
                    { id: "Andrézieux-Bouthéon FC", name: "Andrézieux-Bouthéon FC", city: "Andrézieux-Bouthéon", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 41 },
                    { id: "Istres FC", name: "Istres FC", city: "Fos-sur-Mer", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "US Créteil", name: "US Créteil Foot", city: "Créteil", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "US Avranches", name: "US Avranches", city: "Avranches", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "FC Chauray", name: "FC Chauray", city: "Chauray", colors: { primary: "#6A1B9A", secondary: "#005BAC" }, reputation: 38 }
                ]
            },
            {
                id: "Ligue5",
                name: "Ligue 5",
                tier: 5,
                clubs: [
                    { id: "St. Colomban Locminé", name: "St. Colomban Locminé", city: "Locminé", colors: { primary: "#E30613", secondary: "#009640" }, reputation: 38 },
                    { id: "FC Montlouis", name: "FC Montlouis", city: "Montlouis", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 37},
                    { id: "Voltigeurs de Châteaubriant", name: "Châteaubriant", city: "Châteaubriant", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "US Granville", name: "US Granville", city: "Granville", colors: { primary: "#6AADE4", secondary: "#0F1B5F" }, reputation: 35 },
                    { id: "Olympique Saumur", name: "Olympique Saumur", city: "Saumur", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 35 },
                    { id: "Stade Poitevin FC", name: "Stade Poitevin", city: "Poitevin", colors: { primary: "#000000", secondary: "#F2ECDE" }, reputation: 34 },
                    { id: "SAS Épinal", name: "SAS Épinal", city: "Épinal", colors: { primary: "#005BAC", secondary: "#D4AF37" }, reputation: 31 },
                    { id: "ASC Biesheim", name: "ASC Biesheim", city: "Biesheim", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "SR Colmar", name: "SR Colmar", city: "Colmar", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "AS Beauvais", name: "AS Beauvais", city: "Beauvais", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Wasquehal FC", name: "Wasquehal FC", city: "Lille", colors: { primary: "#C9A227", secondary: "#000000" }, reputation: 31 },
                    { id: "FC Chambly", name: "FC Chambly", city: "Chambly", colors: { primary: "#000000", secondary: "#005BAC" }, reputation: 30 },
                    { id: "US Chantilly", name: "US Chantilly", city: "Chantilly", colors: { primary: "#00593C", secondary: "#8E1F2F" }, reputation: 29 },
                    { id: "Blois Foot", name: "Blois Foot 41", city: "Blois", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 28 },
                    { id: "GOAL FC", name: "GOAL FC", city: "Lyon", colors: { primary: "#D4AF37", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "RC Grasse", name: "RC Grasse", city: "Grasse", colors: { primary: "#0F1B5F", secondary: "#E30613" }, reputation: 33 },
                    { id: "Fréjus-St-Raphaël", name: "Fréjus-St-Raphaël", city: "Saint-Raphaël", colors: { primary: "#6AADE4", secondary: "#E30613" }, reputation: 32 },
                    { id: "FC Limonest", name: "FC Limonest", city: "Limonest", colors: { primary: "#FFFFFF", secondary: "#0F1B5F" }, reputation: 31 },
                    { id: "FC 92 Bobigny", name: "FC 92 Bobigny", city: "Bobigny", colors: { primary: "#000000", secondary: "#D4AF37" }, reputation: 30 },
                    { id: "SC Toulon", name: "SC Toulon", city: "Toulon", colors: { primary: "#005BAC", secondary: "#FCD200" }, reputation: 29 },
                    { id: "AS Saint-Priest", name: "AS Saint-Priest", city: "Saint-Priest", colors: { primary: "#FCD200", secondary: "#E30613" }, reputation: 28 },
                    { id: "FC Rousset SVO", name: "FC Rousset SVO", city: "Rousset", colors: { primary: "#FCD200", secondary: "#8E1F2F" }, reputation: 27 },
                    { id: "FC Mulhouse", name: "FC Mulhouse", city: "Mulhouse", colors: { primary: "#6AADE4", secondary: "#E30613" }, reputation: 26 },
                    { id: "Thonon Évian", name: "Thonon Évian", city: "Évian-les-Bains", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 25 }
                ]
            }
        ]
    },
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
    { id: 'nordosten', name: 'Nordosten', blurb: 'Mecklenburg-Vorpommern, Berlin, and Brandenburg' },
    { id: 'ostdeutschland', name: 'Ostdeutschland', blurb: 'Sachsen, Thüringen, and Sachsen-Anhalt' },
    { id: 'nrw', name: 'NRW', blurb: 'North Rhine-Westphalia' },
    { id: 'sudwesten', name: 'Südwesten', blurb: 'Baden-Württemberg, Rheinland-Pfalz, and Saarland' },
    { id: 'hessen-niedersachsen', name: 'Hessen & Niedersachsen', blurb: 'Hessen and Niedersachsen' },
    { id: 'norddeutschland', name: 'Norddeutschland', blurb: 'Bremen, Hamburg, and Schleswig-Holstein' }
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
// ---- Regions (Switzerland) ----
const REGIONS_CH = [
    { id: 'westschweiz', name: 'Suisse romande', blurb: 'Jura, Neuchâtel, and Fribourg' },
    { id: 'vaud', name: 'Vaud', blurb: 'Canton de Vaud' },
    { id: 'genève', name: 'Genève', blurb: 'Canton de Genève' },
    { id: 'nordwestschweiz', name: 'Nordwestschweiz', blurb: 'Basel, Solothurn, and Aargau' },
    { id: 'nordostschweiz', name: 'Nordostschweiz', blurb: 'Zürich, Schaffhausen, and Thurgau' },
    { id: 'ostschweiz', name: 'Ostschweiz', blurb: 'St. Gallen, Appenzell, Glarus, and Graubünden' },
    { id: 'innerschweiz', name: 'Innerschweiz', blurb: 'Luzern, Zug, Schwyz, Ob-/Nidwalden, and Uri' },
    { id: 'bern', name: 'Bern', blurb: 'Bern' },
    { id: 'ticinovalais', name: 'Ticino and Valais', blurb: 'Southern Switzerland' },
];
// ---- Regions (Italy) ----
const REGIONS_IT = [
    { id: 'nordovest italia', name: "Nord-ovest dell'Italia", blurb: "Valle d'Aosta, Piemonte, Lombardia, and Liguria" },
    { id: 'nordest italia', name: "Nord-est dell'Italia", blurb: 'Trentino-Südtirol, Friuli-Venezia Giulia, Veneto, and Emilio Romagna' },
    { id: 'italia centrale', name: 'Italia centrale', blurb: 'Toscana, Marche, Umbria, Lazio, and Abruzzo' },
    { id: 'sud italia', name: 'Sud Italia', blurb: 'Campania, Molise, Puglia, Basilicata, and Calabria' },
    { id: 'isole', name: 'Isole', blurb: 'Sicilia and Sardegna' }
];
// ---- Regions (France) ----
const REGIONS_FR = [
    { id: 'N-O France', name: "Nord-Ouest de la France", blurb: "Bretagne, Normandie, and Pays de la Loire" },
    { id: 'N-E France', name: "Nord-Est de la France", blurb: 'Grand Est, Hauts-de-France, and Bourgogne-Franche-Compté' },
    { id: 'centre France', name: 'Centre de la France', blurb: 'Île-de-France and Centre-Val de Loire' },
    { id: 'S-O France', name: 'Sud-Ouest de la France', blurb: "Auvergne-Rhône-Alpes and Provence-Alpes-Côte d'Azur" },
    { id: 'S-E France', name: 'Sud-Est de la France', blurb: 'Nouvelle-Aquitaine and Occitanie' },
    { id: 'Îles', name: 'Îles', blurb: 'Corse and other islands' }
];
const REGIONS_BY_COUNTRY = { Netherlands: REGIONS, England: REGIONS_EN, Germany: REGIONS_DE, Spain: REGIONS_ES, Switzerland: REGIONS_CH, Italy: REGIONS_IT, France: REGIONS_FR };
const CITY_REGION = {
    "Groningen":"noord","Leeuwarden":"noord","Heerenveen":"noord","Harkema":"noord","Emmen":"noord","Assen":"noord","Hoogeveen":"noord",
    "Almelo":"oost","Enschede":"oost","Zwolle":"oost","Genemuiden":"oost","Hardenberg":"oost","Haaksbergen":"oost","Raalte":"oost","Rijssen":"oost","Staphorst":"oost","Arnhem":"oost","Nijmegen":"oost","Doetinchem":"oost","Groesbeek":"oost","Ermelo":"oost","Nijkerk":"oost","Tiel":"oost","Scherpenzeel":"oost","Deventer":"oost",
    "Amsterdam":"noord-holland","Alkmaar":"noord-holland","Haarlem":"noord-holland","Volendam":"noord-holland","Velsen":"noord-holland","Heemskerk":"noord-holland","Huizen":"noord-holland",
    "Utrecht":"middelland","Veenendaal":"middelland","Woerden":"middelland","Bunschoten":"middelland","Almere":"middelland","Urk":"middelland",
    "'s-Hertogenbosch":"zuid","Eindhoven":"zuid","Helmond":"zuid","Oss":"zuid","Werkendam":"zuid","Hoek":"zuid","Maastricht":"zuid","Venlo":"zuid","Sittard":"zuid","Kerkrade":"zuid","Breda":"zuid","Tilburg":"zuid","Waalwijk":"zuid","Heerlerheide":"zuid","Kloetinge":"zuid",
    "Den Haag":"zuid-holland","Rotterdam":"zuid-holland","Dordrecht":"zuid-holland","Katwijk":"zuid-holland","Barendrecht":"zuid-holland","Maassluis":"zuid-holland","Rijnsburg":"zuid-holland","Scheveningen":"zuid-holland","Vlaardingen":"zuid-holland","Hoornaar":"zuid-holland",
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
    // bayern (Bavaria)
    "Munich":"bayern","Augsburg":"bayern","Nuremberg":"bayern","Fürth":"bayern","Regensburg":"bayern","Ingolstadt":"bayern","Unterhaching":"bayern","Illertissen":"bayern","Vilzing":"bayern","Würzburg":"bayern","Schweinfurt":"bayern","Bayreuth":"bayern","Landsberg":"bayern","Eltersdorf":"bayern","Aubstadt":"bayern","Eichstätt":"bayern","Burghausen":"bayern","Buchbach":"bayern","Memmingen":"bayern",
    // nordosten (Mecklenburg-Vorpommern, Berlin, Brandenburg)
    "Berlin":"nordosten","Cottbus":"nordosten","Potsdam":"nordosten","Greifswald":"nordosten","Rostock":"nordosten",
    // ostdeutschland (Sachsen, Thüringen, Sachsen-Anhalt)
    "Leipzig":"ostdeutschland","Dresden":"ostdeutschland","Chemnitz":"ostdeutschland","Zwickau":"ostdeutschland","Aue":"ostdeutschland","Jena":"ostdeutschland","Erfurt":"ostdeutschland","Magdeburg":"ostdeutschland","Halle":"ostdeutschland",
    // nrw (North Rhine-Westphalia)
    "Dortmund":"nrw","Gelsenkirchen":"nrw","Cologne":"nrw","Leverkusen":"nrw","Mönchengladbach":"nrw","Düsseldorf":"nrw","Essen":"nrw","Duisburg":"nrw","Bochum":"nrw","Bielefeld":"nrw","Münster":"nrw","Paderborn":"nrw","Aachen":"nrw","Verl":"nrw","Oberhausen":"nrw","Gütersloh":"nrw","Siegen":"nrw","Bergisch Gladbach":"nrw","Wiedenbrück":"nrw","Rödinghausen":"nrw","Bocholt":"nrw","Lotte":"nrw","Bonn":"nrw",
    // sudwesten (Baden-Württemberg, Rheinland-Pfalz, Saarland)
    "Stuttgart":"sudwesten","Freiburg":"sudwesten","Hoffenheim":"sudwesten","Mainz":"sudwesten","Kaiserslautern":"sudwesten","Karlsruhe":"sudwesten","Heidenheim":"sudwesten","Mannheim":"sudwesten","Saarbrücken":"sudwesten","Elversberg":"sudwesten","Homburg":"sudwesten","Trier":"sudwesten","Walldorf":"sudwesten","Sandhausen":"sudwesten","Aalen":"sudwesten","Ulm":"sudwesten","Freiberg":"sudwesten","Aspach":"sudwesten",
    // hessen-niedersachsen (Hessen + Niedersachsen)
    "Darmstadt":"hessen-niedersachsen","Frankfurt":"hessen-niedersachsen","Kassel":"hessen-niedersachsen","Wiesbaden":"hessen-niedersachsen","Offenbach":"hessen-niedersachsen","Fulda":"hessen-niedersachsen","Steinbach":"hessen-niedersachsen","Hanover":"hessen-niedersachsen","Hannover":"hessen-niedersachsen","Wolfsburg":"hessen-niedersachsen","Braunschweig":"hessen-niedersachsen","Osnabrück":"hessen-niedersachsen","Oldenburg":"hessen-niedersachsen","Meppen":"hessen-niedersachsen","Emden":"hessen-niedersachsen","Drochtersen":"hessen-niedersachsen","Jeddeloh":"hessen-niedersachsen","Garbsen":"hessen-niedersachsen","Schöningen":"hessen-niedersachsen",
    // norddeutschland (Bremen, Hamburg, Schleswig-Holstein)
    "Hamburg":"norddeutschland","Bremen":"norddeutschland","Kiel":"norddeutschland","Norderstedt":"norddeutschland","Flensburg":"norddeutschland","Lübeck":"norddeutschland","Todesfelde":"norddeutschland",
    // ---- Spain ----
    "Seville":"sur de españa","Sevilla":"sur de españa","Málaga":"sur de españa","Córdoba":"sur de españa","Granada":"sur de españa","Cádiz":"sur de españa","Almería":"sur de españa","Huelva":"sur de españa","Jerez de la Frontera":"sur de españa","Marbella":"sur de españa","Lucena":"sur de españa","Sanlúcar de Barrameda":"sur de españa","Murcia":"sur de españa","Cartagena":"sur de españa","Antequera":"sur de españa","Algeciras":"sur de españa","Águilas":"sur de españa","Jaén":"sur de españa","Ceuta":"sur de españa","Torremolinos":"sur de españa",
    "Madrid":"españa central","Getafe":"españa central","Leganés":"españa central","Alcorcón":"españa central","Majadahonda":"españa central","Guadalajara":"españa central","Mérida":"españa central","Cáceres":"españa central","Almendralejo":"españa central","Don Benito":"españa central","Coria":"españa central","Albacete":"españa central",
    "Barcelona":"noreste de españa","Valencia":"noreste de españa","Villarreal":"noreste de españa","Zaragoza":"noreste de españa","Huesca":"noreste de españa","Elche":"noreste de españa","Castellón de la Plana":"noreste de españa","Girona":"noreste de españa","Sabadell":"noreste de españa","Terrassa":"noreste de españa","Alicante":"noreste de españa","Elda":"noreste de españa","Teruel":"noreste de españa","Andorra la Vella":"noreste de españa",
    "Vigo":"noroeste de españa","La Coruña":"noroeste de españa","Oviedo":"noroeste de españa","Gijón":"noroeste de españa","León":"noroeste de españa","Ponferrada":"noroeste de españa","Pontevedra":"noroeste de españa","Zamora":"noroeste de españa","Lugo":"noroeste de españa","Ferrol":"noroeste de españa","Salamanca":"noroeste de españa","Valladolid":"noroeste de españa","Burgos":"noroeste de españa","Ourense":"noroeste de españa","Villares de la Reina (Salamanca)":"noroeste de españa","Vilagarcía de Arousa":"noroeste de españa","Avilés":"noroeste de españa","Miranda de Ebro":"noroeste de españa","Carballo":"noroeste de españa",
    "Bilbao":"nor de españa","San Sebastián":"nor de españa","Vitoria-Gasteiz":"nor de españa","Pamplona":"nor de españa","Santander":"nor de españa","Eibar":"nor de españa","Barakaldo":"nor de españa","Getxo":"nor de españa","Sestao":"nor de españa","Irun":"nor de españa","Logroño":"nor de españa","Tafalla":"nor de españa","Torrelavega":"nor de españa",
    "Palma de Mallorca":"islas","Las Palmas":"islas","Santa Cruz de Tenerife":"islas","Ibiza":"islas","Las Palmas de Gran Canaria":"islas",
    // ---- Switzerland ----
    // Suisse romande (Jura, Neuchâtel, Fribourg)
    "Neuchâtel":"westschweiz","Saint-Prex":"westschweiz","Coffrane":"westschweiz","La Chaux-de-Fonds":"westschweiz","Courtételle":"westschweiz","Bassecourt":"westschweiz","Delémont":"westschweiz","Delley-Portalban":"westschweiz","Bulle":"westschweiz",
    // Vaud
    "Lausanne":"vaud","Yverden-les-Bains":"vaud","Bavois":"vaud","Nyon":"vaud","Vevey":"vaud","Echallens":"vaud","Payerne":"vaud",
    // Genève
    "Genève":"genève","Carouge":"genève","Le Grand-Saconnex":"genève","Thônex":"genève","Lancy":"genève","Meyrin":"genève","Châtelaine":"genève",
    // Monthey is in Valais → Ticino/Valais region
    "Monthey":"ticinovalais",
    "Basel":"nordwestschweiz","Aarau":"nordwestschweiz","Baden":"nordwestschweiz","Solothurn":"nordwestschweiz","Muttenz":"nordwestschweiz","Wohlen":"nordwestschweiz",
    "Zürich":"nordostschweiz","Winterthur":"nordostschweiz","Schaffhausen":"nordostschweiz","Dietikon":"nordostschweiz","Thalwil":"nordostschweiz","Kreuzlingen":"nordostschweiz","Marthalen":"nordostschweiz","Wettswil-Bonstetten":"nordostschweiz",
    "St. Gallen":"ostschweiz","Rapperswil-Jona":"ostschweiz","Wil":"ostschweiz","Gossau SG":"ostschweiz","Widnau":"ostschweiz","Vaduz":"ostschweiz","Eschen/Mauren":"ostschweiz",
    "Luzern":"innerschweiz","Kriens":"innerschweiz","Zug":"innerschweiz","Buochs":"innerschweiz","Freienbach":"innerschweiz","Tuggen":"innerschweiz","Schötz":"innerschweiz","Cham":"innerschweiz",
    "Bern":"bern","Thun":"bern","Biel-Bienne":"bern","Langenthal":"bern","Gümligen":"bern","Münsingen":"bern",
    "Lugano":"ticinovalais","Bellinzona":"ticinovalais","Naters":"ticinovalais","Mendrisio":"ticinovalais","Collina d'Oro":"ticinovalais","Paradiso":"ticinovalais","Locarno":"ticinovalais","Sion":"ticinovalais","Taverne":"ticinovalais",
    // ---- Italy ----
    // nordovest = Valle d'Aosta, Piemonte, Lombardia, Liguria
    "Milan":"nordovest italia","Torino":"nordovest italia","Bergamo":"nordovest italia","Como":"nordovest italia","Monza":"nordovest italia","Cremona":"nordovest italia","Mantova":"nordovest italia","Genua":"nordovest italia","Chiavari":"nordovest italia","La Spezia":"nordovest italia","Brescia":"nordovest italia","Renate":"nordovest italia","Lecco":"nordovest italia","Lumezzane":"nordovest italia","Gorgonzola":"nordovest italia","Novara":"nordovest italia","Vercelli":"nordovest italia","Ospitaletto":"nordovest italia",
    // nordest = Trentino-Südtirol, Friuli-Venezia Giulia, Veneto, Emilia Romagna
    "Bologna":"nordest italia","Udine":"nordest italia","Sassuolo":"nordest italia","Parma":"nordest italia","Venice":"nordest italia","Verona":"nordest italia","Modena":"nordest italia","Padova":"nordest italia","Cesena":"nordest italia","Bozen":"nordest italia","Vicenza":"nordest italia","Reggiana":"nordest italia","Ravenna":"nordest italia","Trento":"nordest italia","Cittadella":"nordest italia","Arzignano":"nordest italia","Feltre":"nordest italia","Forli":"nordest italia","Carpi":"nordest italia",
    // italia centrale = Toscana, Marche, Umbria, Lazio, Abruzzo
    "Rome":"italia centrale","Florence":"italia centrale","Frosinone":"italia centrale","Pisa":"italia centrale","Carrara":"italia centrale","Empoli":"italia centrale","Arezzo":"italia centrale","Ascoli":"italia centrale","Piancastagnaio":"italia centrale","Pineto":"italia centrale","Gubbio":"italia centrale","Pesaro":"italia centrale","Livorno":"italia centrale","Perugia":"italia centrale","Guidonia Montecelio":"italia centrale","San Benedetto del Tronto":"italia centrale",
    // sud = Campania, Molise, Puglia, Basilicata, Calabria
    "Napoli":"sud italia","Lecce":"sud italia","Catanzaro":"sud italia","Avellino":"sud italia","Benevento":"sud italia","Castellammare di Stabia":"sud italia","Campobasso":"sud italia","Bari":"sud italia","Salerno":"sud italia","Cosenza":"sud italia","Caserta":"sud italia","Crotone":"sud italia","Casarano":"sud italia","Monopoli":"sud italia","Altamura":"sud italia","Barletta":"sud italia","Cava dei Tirreni":"sud italia","Giugliano in Campania":"sud italia","Picerno":"sud italia","Potenza":"sud italia","Torre Annunziata":"sud italia",
    // isole = Sicilia, Sardegna
    "Cagliari":"isole","Palermo":"isole","Catania":"isole","Sassari":"isole",
    // ---- France ----
    "Paris":"centre France","Versailles":"centre France","Bondoufle":"centre France","Saint-Maur":"centre France","Créteil":"centre France","Bobigny":"centre France","Orléans":"centre France","Bourges":"centre France","Saint-Pryvé-Saint-Mesmin":"centre France","Blois":"centre France","Montlouis":"centre France",
    "Rennes":"N-O France","Lorient":"N-O France","Brest":"N-O France","Guingamp":"N-O France","Concarneau":"N-O France","Saint-Malo":"N-O France","Dinan":"N-O France","Locminé":"N-O France","Angers":"N-O France","Le Mans":"N-O France","Nantes":"N-O France","Laval":"N-O France","Les Herbiers":"N-O France","La Roche-sur-Yon":"N-O France","Châteaubriant":"N-O France","Saumur":"N-O France","Le Havre":"N-O France","Rouen":"N-O France","Le Petit-Quevilly":"N-O France","Caen":"N-O France","Saint-Aubin-sur-Scie":"N-O France","Granville":"N-O France","Avranches":"N-O France",
    "Strasbourg":"N-E France","Reims":"N-E France","Metz":"N-E France","Nancy":"N-E France","Troyes":"N-E France","Haguenau":"N-E France","Épinal":"N-E France","Biesheim":"N-E France","Colmar":"N-E France","Mulhouse":"N-E France","Thionville":"N-E France","Lens":"N-E France","Lille":"N-E France","Dunkerque":"N-E France","Boulogne":"N-E France","Amiens":"N-E France","Valenciennes":"N-E France","Feignies":"N-E France","Beauvais":"N-E France","Chambly":"N-E France","Chantilly":"N-E France","Auxerre":"N-E France","Dijon":"N-E France","Sochaux-Montbéliard":"N-E France",
    "Lyon":"S-O France","Saint-Étienne":"S-O France","Clermont":"S-O France","Grenoble":"S-O France","Annecy":"S-O France","Villefranche-sur-Saône":"S-O France","Espaly-Saint-Marcel":"S-O France","Bourg-en-Bresse":"S-O France","Rumilly":"S-O France","Andrézieux-Bouthéon":"S-O France","Limonest":"S-O France","Saint-Priest":"S-O France","Évian-les-Bains":"S-O France","Marseille":"S-O France","Nice":"S-O France","Monaco":"S-O France","Aubagne":"S-O France","Cannes":"S-O France","Hyères":"S-O France","Fos-sur-Mer":"S-O France","Grasse":"S-O France","Saint-Raphaël":"S-O France","Toulon":"S-O France","Rousset":"S-O France",
    "Toulouse":"S-E France","Montpellier":"S-E France","Rodez":"S-E France","Nîmes":"S-E France","Pau":"S-E France","Bordeaux":"S-E France","Bayonne":"S-E France","Angoulême":"S-E France","Chauray":"S-E France","Poitevin":"S-E France",
    "Bastia":"Îles","Borgo":"Îles"
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
    // Swiss reserve/U21 sides are always tagged with "U21" in the id, but not always in the name
    if (c.country === 'Switzerland') return /U21/i.test(c.id);
    let base = null;
    if (/^Jong\s/i.test(c.name)) base = c.name.replace(/^Jong\s+/i, '');
    else if (/\sU21$/.test(c.name)) base = c.name.replace(/\sU21$/, '');
    else if (/\sII$/.test(c.name)) base = c.name.replace(/\sII$/, '');
    else return false;
    // only a reserve if a distinct senior club with the base name actually exists
    return Clubs.allClubs.some(o => o.id !== c.id && o.name === base);
}
// reserve<->parent lookups via the registry built in Clubs.init() - covers every naming
// convention (Jong X, X U21, X II, Spanish B teams), not just the Dutch "Jong" prefix
function reserveClubFor(seniorId){ const rid = Clubs.parentReserveId ? Clubs.parentReserveId[seniorId] : null; return rid ? Clubs.getClubById(rid) : null; }
function parentClubForReserve(reserveId){ const pid = Clubs.reserveParentId ? Clubs.reserveParentId[reserveId] : null; return pid ? Clubs.getClubById(pid) : null; }

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
                        // Reputation model: baseRep is the immutable day-one value; anchorRep moves
                        // only on promotion/relegation (capped at baseRep±10 so divisions can't
                        // drift arbitrarily far apart). The runtime `reputation` every consumer
                        // reads (wages, fees, roles, morale) tracks anchor + the boost from the
                        // agent's clients currently there — rising promptly, but only ever fading
                        // slowly (-1..-5/season) once they leave (League.normalizeReputations).
                        baseRep: clubData.reputation,
                        anchorRep: clubData.reputation,
                        // seasonal form: rolled once per rollover from performance-vs-expectation
                        // streaks; match strength = reputation + seasonDelta (+ live client bonus)
                        // — see League.clubStrength / League.rollSeasonDeltas
                        seasonDelta: 0,
                        streakDir: null,   // 'under' | 'over' | null
                        streakLen: 0
                    });
                });
            });
        }
        
        console.log(`✅ ${this.allClubs.length} clubs created`);
        // reserve/second teams wear their parent club's colours (for consistent emblems)
        const ES_RESERVE_PARENT = { 'Real Sociedad B': 'Real Sociedad', 'Celta Vigo B': 'Celta Vigo', 'Atletico Madrid B': 'Atletico', 'Villareal B': 'Villarreal', 'Real Madrid B': 'Real Madrid', 'Athletic Bilbao B': 'Athletic Bilbao', 'Barcelona B': 'Barcelona', 'Real Oviedo B': 'Oviedo', 'Alavés B': 'Alaves', 'Valencia B': 'Valencia' };
        const CH_RESERVE_PARENT = { 'FC Lugano U21': 'FC Lugano' };   // name doesn't follow the "X U21" pattern ("FC Lugano 2")
        // this resolution doubles as the canonical reserve<->parent registry (used by
        // reserveClubFor / parentClubForReserve), so "FC Basel U21", "Bayern Munich II",
        // "Valencia Mestalla" etc. are recognised exactly like the Dutch "Jong X" sides
        this.reserveParentId = {}; this.parentReserveId = {};
        this.allClubs.forEach(c => {
            if (!isReserveClub(c.id)) return;
            let parent = null;
            if (c.country === 'Spain' && ES_RESERVE_PARENT[c.id]) parent = this.getClubById(ES_RESERVE_PARENT[c.id]);
            else if (c.country === 'Switzerland' && CH_RESERVE_PARENT[c.id]) parent = this.getClubById(CH_RESERVE_PARENT[c.id]);
            else { const base = c.name.replace(/^Jong\s+/i, '').replace(/\sU21$/, '').replace(/\sII$/, ''); parent = this.allClubs.find(o => o.id !== c.id && o.name === base); }
            if (parent) {
                c.colors = { primary: parent.colors.primary, secondary: parent.colors.secondary };
                this.reserveParentId[c.id] = parent.id;
                this.parentReserveId[parent.id] = c.id;
            }
        });
        return this.allClubs;
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

    DIV_NAMES: { ERE: 'Eredivisie', EED: 'Eerste Divisie', TWD: 'Tweede Divisie', DRD: 'Derde Divisie', PREM: 'Premier League', CHAMP: 'Championship', LEAGUE1: 'League One', LEAGUE2: 'League Two', Natleague: 'National League', BUNDES: 'Bundesliga', '2BUNDES': '2. Bundesliga', '3LIGA': '3. Liga', REGIONAL1: '1. Regionalliga', REGIONAL2: '2. Regionalliga', REGIONAL3: '3. Regionalliga', LaLiga: 'La Liga', LaLiga2: 'La Liga 2', PrimeraSup: 'Primera Superior', PrimeraInf: 'Primera Inferior', Segunda: 'Segunda Federación', SuperLeagueCH: 'Super League', ChallengeLeague: 'Challenge League', PromotionLeague: 'Promotion League', '1.LigaCH': '1. Liga', '2.LigaCH': '2. Liga', SerieA: 'Serie A', SerieB: 'Serie B', SerieC: 'Serie C', SerieD: 'Serie D', Ligue1: 'Ligue 1', Ligue2: 'Ligue 2', Ligue3: 'Ligue 3', Ligue4: 'Ligue 4', Ligue5: 'Ligue 5' },
    DIV_TIERS: { ERE: 1, EED: 2, TWD: 3, DRD: 4, PREM: 1, CHAMP: 2, LEAGUE1: 3, LEAGUE2: 4, Natleague: 5, BUNDES: 1, '2BUNDES': 2, '3LIGA': 3, REGIONAL1: 4, REGIONAL2: 5, REGIONAL3: 6, LaLiga: 1, LaLiga2: 2, PrimeraSup: 3, PrimeraInf: 4, Segunda: 5, SuperLeagueCH: 1, ChallengeLeague: 2, PromotionLeague: 3, '1.LigaCH': 4, '2.LigaCH': 5, SerieA: 1, SerieB: 2, SerieC: 3, SerieD: 4, Ligue1: 1, Ligue2: 2, Ligue3: 3, Ligue4: 4, Ligue5: 5 },
    setDivision(clubId, divId) {
        const c = this.getClubById(clubId); if (!c) return;
        c.division = divId; c.tier = this.DIV_TIERS[divId]; c.divisionName = this.DIV_NAMES[divId];
    },
    // day-one club count for a division straight from LEAGUES_DATA, ignoring whatever
    // promotion/relegation has since done to allClubs - used by Sim's post-rollover
    // guardrail to catch a division drifting the wrong size
    staticDivSize(divId) {
        for (const league of Object.values(LEAGUES_DATA)) {
            const tier = league.tiers.find(t => t.id === divId);
            if (tier) return tier.clubs.length;
        }
        return null;
    },

    getClubsByCountry(country) {
        return this.allClubs.filter(c => c.country === country);
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
