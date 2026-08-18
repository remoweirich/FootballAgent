// Clubs and Leagues Data
const LEAGUES_DATA = {
    "Netherlands": {
        country: "Netherlands",
        tiers: [
            {
                id: "ERE",
                name: "Dutch First Division",
                tier: 1,
                clubs: [
                    { id: "ajax", name: "Amsterdam White", city: "Amsterdam", colors: { primary: "#FFFFFF", secondary: "#D2122E" }, reputation: 82 },
                    { id: "psv", name: "Eindhoven Red", city: "Eindhoven", colors: { primary: "#EE2E24", secondary: "#FFFFFF" }, reputation: 81 },
                    { id: "feyenoord", name: "Rotterdam Red", city: "Rotterdam", colors: { primary: "#E30613", secondary: "#030303" }, reputation: 80 },
                    { id: "az", name: "Alkmaar", city: "Alkmaar", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 76 },
                    { id: "twente", name: "Twente", city: "Enschede", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "utrecht", name: "Utrecht Red", city: "Utrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "heerenveen", name: "Heerenveen", city: "Heerenveen", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "groningen", name: "Groningen", city: "Groningen", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "willem-ii", name: "Tilburg", city: "Tilburg", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "nec", name: "NEC", city: "Nijmegen", colors: { primary: "#C8102E", secondary: "#008000" }, reputation: 75 },
                    { id: "sparta", name: "Rotterdam White", city: "Rotterdam", colors: { primary: "#FFFFFF", secondary: "#C8102E" }, reputation: 70 },
                    { id: "cambuur", name: "Cambuur", city: "Leeuwarden", colors: { primary: "#FFDD00", secondary: "#0066CC" }, reputation: 66 },
                    { id: "zwolle", name: "Zwolle", city: "Zwolle", colors: { primary: "#0066CC", secondary: "#db4e4e" }, reputation: 68 },
                    { id: "fortuna", name: "Fortuna", city: "Sittard", colors: { primary: "#FFDD00", secondary: "#008000" }, reputation: 70 },
                    { id: "go-ahead", name: "Deventer", city: "Deventer", colors: { primary: "#FFDD00", secondary: "#ad1010" }, reputation: 68 },
                    { id: "den-haag", name: "Den Haag", city: "Den Haag", colors: { primary: "#008000", secondary: "#FFDD00" }, reputation: 67 },
                    { id: "excelsior", name: "Rotterdam Black", city: "Rotterdam", colors: { primary: "#000000", secondary: "#E30613" }, reputation: 69 },
                    { id: "telstar", name: "Telstar", city: "Velsen", colors: { primary: "#0066CC", secondary: "#cc1f00" }, reputation: 66 }
                ]
            },
            {
                id: "EED",
                name: "Dutch Second Division",
                tier: 2,
                clubs: [
                    { id: "jong-ajax", name: "Amsterdam White II", city: "Amsterdam", colors: { primary: "#D2122E", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "jong-psv", name: "Eindhoven Red II", city: "Eindhoven", colors: { primary: "#ED1C24", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "nac", name: "Breda", city: "Breda", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 65 },
                    { id: "jong-az", name: "Alkmaar II", city: "Alkmaar", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "roda", name: "Kerkrade", city: "Kerkrade", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 60 },
                    { id: "heracles", name: "Heracles", city: "Almelo", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "jong-utrecht", name: "Utrecht Red II", city: "Utrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "graafschap", name: "Doetinchem", city: "Doetinchem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "venlo", name: "Venlo", city: "Venlo", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 56 },
                    { id: "rkc", name: "Waalwijk", city: "Waalwijk", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 61 },
                    { id: "mvv", name: "MVV", city: "Maastricht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "den-bosch", name: "'s-Hertogenbosch", city: "'s-Hertogenbosch", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "dordrecht", name: "Dordrecht", city: "Dordrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "volendam", name: "Volendam Orange", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 66 },
                    { id: "helmond", name: "Helmond", city: "Helmond", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 52 },                    
                    { id: "oss", name: "Oss", city: "Oss", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "eindhoven", name: "Eindhoven Blue", city: "Eindhoven", colors: { primary: "#0066CC", secondary: "#C8102E" }, reputation: 57 },
                    { id: "emmen", name: "Emmen", city: "Emmen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "vitesse", name: "Vitesse", city: "Arnhem", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 60 },
                    { id: "almere", name: "Almere Black", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 63 }
                ]
            },
	    {
                id: "TWD",
                name: "Dutch Third Division",
                tier: 3,
                clubs: [
                    { id: "acv", name: "ACV", city: "Assen", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "afc", name: "Amsterdam Black", city: "Amsterdam", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 46 },
                    { id: "barendrecht", name: "Barendrecht", city: "Barendrecht", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "excelsior-m", name: "Maassluis", city: "Maassluis", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 42 },
                    { id: "gvvv", name: "Veenendaal Yellow", city: "Veenendaal", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 41 },
                    { id: "hardenberg", name: "Hardenberg", city: "Hardenberg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "hoek", name: "Hoek", city: "Hoek", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 54 },
                    { id: "ijsselmeervogels", name: "Bunschoten Blue", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 41 },
                    { id: "jong-almere", name: "Almere Black & Yellow", city: "Almere", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 44 },
                    { id: "jong-sparta", name: "Rotterdam White II", city: "Rotterdam", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "hfc", name: "Haarlem", city: "Haarlem", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "katwijk", name: "Katwijk Red", city: "Katwijk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "kozakken", name: "Werkendam", city: "Werkendam", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "quick-boys", name: "Katwijk Black", city: "Katwijk", colors: { primary: "#000000", secondary: "#C8102E" }, reputation: 55 },
                    { id: "rijnsburg", name: "Rijnsburg", city: "Rijnsburg", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "spakenburg", name: "Bunschoten Blue & White", city: "Bunschoten", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "treffers", name: "Groesbeek", city: "Groesbeek", colors: { primary: "#008000", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "rkav", name: "Volendam Orange & Black", city: "Volendam", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 40 }
                ]
            },
            {
                id: "DRD",
                name: "Dutch Fourth Division",
                tier: 4,
                clubs: [
                    { id: "Kloetinge", name: "Kloetinge", city: "Kloetinge", colors: { primary: "#2d9120", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "dovo", name: "Veenendaal Red", city: "Veenendaal", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "eemdijk", name: "Bunschoten Teal", city: "Bunschoten", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "rksv", name: "Heerlerheide", city: "Heerlerheide", colors: { primary: "#035f00", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "harkemase", name: "Harkema", city: "Harkema", colors: { primary: "#FFDD00", secondary: "#0066CC" }, reputation: 32 },
                    { id: "hercules-d", name: "Utrecht White", city: "Utrecht", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 29 },
                    { id: "hoogeveen", name: "Hoogeveen", city: "Hoogeveen", colors: { primary: "#FFDD00", secondary: "#000000" }, reputation: 35 },
                    { id: "zwaluwen", name: "Zwaluwen", city: "Vlaardingen", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "huizen", name: "Huizen", city: "Huizen", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 32 },
                    { id: "rohda", name: "Raalte", city: "Raalte", colors: { primary: "#000000", secondary: "#FFDD00" }, reputation: 38 },
                    { id: "scherpenzeel", name: "Scherpenzeel", city: "Scherpenzeel", colors: { primary: "#009966", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "sparta-n", name: "Nijkerk", city: "Nijkerk", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "sportlust", name: "Woerden", city: "Woerden", colors: { primary: "#0066CC", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "staphorst", name: "Staphorst", city: "Staphorst", colors: { primary: "#0066CC", secondary: "#FFDD00" }, reputation: 40 },
                    { id: "tec", name: "TEC", city: "Tiel", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "urk", name: "Urk", city: "Urk", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "scheveningen", name: "Scheveningen", city: "Scheveningen", colors: { primary: "#065a14", secondary: "#000000" }, reputation: 24 },
                    { id: "stedoco", name: "SteDoCo", city: "Hoornaar", colors: { primary: "#a52525", secondary: "#000000" }, reputation: 28 }
                ]
            }
        ]
    },
    "England": {
        country: "England",
        tiers: [
            {
                id: "PREM",
                name: "English First Division",
                tier: 1,
                clubs: [
                    { id: "Arsenal", name: "London Red", city: "London", colors: { primary: "#EF0107", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Chelsea", name: "London Blue", city: "London", colors: { primary: "#034694", secondary: "#FFFFFF" }, reputation: 88 },
                    { id: "Liverpool", name: "Liverpool Red", city: "Liverpool", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Manchester United", name: "Manchester Red", city: "Manchester", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 89 },
                    { id: "Manchester City", name: "Manchester Sky", city: "Manchester", colors: { primary: "#6CABDD", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Tottenham", name: "London Navy", city: "London", colors: { primary: "#132257", secondary: "#FFFFFF" }, reputation: 88 },
                    { id: "Everton", name: "Liverpool Blue", city: "Liverpool", colors: { primary: "#003399", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "Aston Villa", name: "Birmingham Claret", city: "Birmingham", colors: { primary: "#670E36", secondary: "#95BFE5" }, reputation: 83 },
                    { id: "Leeds", name: "Leeds", city: "Leeds", colors: { primary: "#FFFFFF", secondary: "#1D428A" }, reputation: 75 },
                    { id: "Newcastle", name: "Newcastle upon Tyne", city: "Newcastle upon Tyne", colors: { primary: "#241F20", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Brighton", name: "Brighton", city: "Brighton", colors: { primary: "#0057B8", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Crystal Palace", name: "London Blue & Red", city: "London", colors: { primary: "#1B458F", secondary: "#E30613" }, reputation: 77 },
                    { id: "Brentford", name: "London Red & Black", city: "London", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 77 },
                    { id: "Fulham", name: "London White", city: "London", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 76 },
                    { id: "Ipswich", name: "Ipswich", city: "Ipswich", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Hull", name: "Hull", city: "Hull", colors: { primary: "#FDB913", secondary: "#000000" }, reputation: 70 },
                    { id: "Nottingham Forest", name: "Nottingham Red", city: "Nottingham", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Bournemouth", name: "Bournemouth", city: "Bournemouth", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 76 },
                    { id: "Sunderland", name: "Sunderland", city: "Sunderland", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Coventry", name: "Coventry", city: "Coventry", colors: { primary: "#00BFFF", secondary: "#FFFFFF" }, reputation: 71 }
                ]
            },
            {
                id: "CHAMP",
                name: "English Second Division",
                tier: 2,
                clubs: [
                    { id: "Wolves", name: "Wolves", city: "Wolverhampton", colors: { primary: "#FDB913", secondary: "#000000" }, reputation: 74 },
                    { id: "Burnley", name: "Burnley", city: "Burnley", colors: { primary: "#6C1D45", secondary: "#5BA4D8" }, reputation: 72 },
                    { id: "West Ham", name: "London Claret", city: "London", colors: { primary: "#7A263A", secondary: "#1BB1E7" }, reputation: 75 },
                    { id: "Millwall", name: "London Navy & White", city: "London", colors: { primary: "#002A5C", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Southampton", name: "Southampton", city: "Southampton", colors: { primary: "#D71920", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Middlesbrough", name: "Middlesbrough", city: "Middlesbrough", colors: { primary: "#D71920", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Wrexham", name: "Wrexham", city: "Wrexham", colors: { primary: "#D71920", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Derby", name: "Derby", city: "Derby", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 70 },
                    { id: "Norwich", name: "Norwich", city: "Norwich", colors: { primary: "#008000", secondary: "#FFD200" }, reputation: 69 },
                    { id: "Birmingham", name: "Birmingham Blue", city: "Birmingham", colors: { primary: "#003399", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Swansea", name: "Swansea", city: "Swansea", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 69 },
                    { id: "Bristol City", name: "Bristol Red", city: "Bristol", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 68 },
                    { id: "Sheffield United", name: "Sheffield Red", city: "Sheffield", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "Preston", name: "Preston", city: "Preston", colors: { primary: "#002A5C", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "QPR", name: "London Blue & White", city: "London", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Watford", name: "Watford", city: "Watford", colors: { primary: "#FFD200", secondary: "#000000" }, reputation: 65 },
                    { id: "Stoke", name: "Stoke-on-Trent Red", city: "Stoke-on-Trent", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "Portsmouth", name: "Portsmouth", city: "Portsmouth", colors: { primary: "#002A5C", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Charlton", name: "London Red & White", city: "London", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Blackburn", name: "Blackburn", city: "Blackburn", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "West Bromwich", name: "West Bromwich", city: "West Bromwich", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Bolton", name: "Bolton", city: "Bolton", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Cardiff", name: "Cardiff", city: "Cardiff", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Lincoln", name: "Lincoln", city: "Lincoln", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 61 }
                ]
            },
            {
                id: "LEAGUE1",
                name: "English Third Division",
                tier: 3,
                clubs: [
                    { id: "Stockport", name: "Stockport", city: "Stockport", colors: { primary: "#1c4fda", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Leicester", name: "Leicester", city: "Leicester", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Oxford", name: "Oxford", city: "Oxford", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 61 },
                    { id: "Sheffield Wednesday", name: "Sheffield Blue", city: "Sheffield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Bradford", name: "Bradford", city: "Bradford", colors: { primary: "#7B003A", secondary: "#FFC72C" }, reputation: 59 },
                    { id: "Stevenage", name: "Stevenage", city: "Stevenage", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Luton", name: "Luton", city: "Luton", colors: { primary: "#FFCD00", secondary: "#080168" }, reputation: 58 },
                    { id: "Plymouth", name: "Plymouth", city: "Plymouth", colors: { primary: "#007b5ea9", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Huddersfield", name: "Huddersfield", city: "Huddersfield", colors: { primary: "#FFFFFF", secondary: "#005BAC" }, reputation: 57 },
                    { id: "Mansfield", name: "Mansfield", city: "Mansfield", colors: { primary: "#FFCD00", secondary: "#204885" }, reputation: 57 },
                    { id: "Wycombe", name: "High Wycombe", city: "High Wycombe", colors: { primary: "#003DA5", secondary: "#13c3e2" }, reputation: 57 },
                    { id: "Reading", name: "Reading", city: "Reading", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 57 },
                    { id: "Blackpool", name: "Blackpool", city: "Blackpool", colors: { primary: "#FF6600", secondary: "#000000" }, reputation: 56 },
                    { id: "Doncaster", name: "Doncaster", city: "Doncaster", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Barnsley", name: "Barnsley", city: "Barnsley", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Wigan", name: "Wigan", city: "Wigan", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Burton", name: "Burton upon Trent", city: "Burton upon Trent", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 54 },
                    { id: "Peterborough", name: "Peterborough", city: "Peterborough", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Wimbledon", name: "London Claret & White", city: "London", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Leyton Orient", name: "London Red (2)", city: "London", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Bromley", name: "Bromley", city: "Bromley", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 52 },
                    { id: "MK Dons", name: "Milton Keynes", city: "Milton Keynes", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 52 },
                    { id: "Cambridge", name: "Cambridge", city: "Cambridge", colors: { primary: "#FFCD00", secondary: "#000000" }, reputation: 51 },
                    { id: "Notts County", name: "Nottingham Black", city: "Nottingham", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 50 }
                ]
            },
            {
                id: "LEAGUE2",
                name: "English Fourth Division",
                tier: 4,
                clubs: [
                    { id: "Exeter", name: "Exeter", city: "Exeter", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 52 },
                    { id: "Port Vale", name: "Stoke-on-Trent White", city: "Stoke-on-Trent", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 52 },
                    { id: "Rotherham", name: "Rotherham", city: "Rotherham", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Northampton", name: "Northampton", city: "Northampton", colors: { primary: "#6C1D45", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Salford", name: "Salford", city: "Salford", colors: { primary: "#DA291C", secondary: "#F5A623" }, reputation: 50 },
                    { id: "Chesterfield", name: "Chesterfield", city: "Chesterfield", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Grimsby", name: "Grimsby", city: "Grimsby", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Barnet", name: "London Gold", city: "London", colors: { primary: "#F7A800", secondary: "#000000" }, reputation: 48 },
                    { id: "Swindon", name: "Swindon", city: "Swindon", colors: { primary: "#DA291C", secondary: "#FFD200" }, reputation: 48 },
                    { id: "Oldham", name: "Oldham", city: "Oldham", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 47 },
                    { id: "Crewe", name: "Crewe", city: "Crewe", colors: { primary: "#DA020E", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Colchester", name: "Colchester", city: "Colchester", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 46 },
                    { id: "Walsall", name: "Walsall", city: "Walsall", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 46 },
                    { id: "Bristol Rovers", name: "Bristol Red & Black", city: "Bristol", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 46 },
                    { id: "Fleetwood", name: "Fleetwood", city: "Fleetwood", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 45 },
                    { id: "Accrington", name: "Accrington", city: "Accrington", colors: { primary: "#DA291C", secondary: "#000066" }, reputation: 45 },
                    { id: "Gillingham", name: "Gillingham", city: "Gillingham", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Cheltenham", name: "Cheltenham", city: "Cheltenham", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Shrewsbury", name: "Shrewsbury", city: "Shrewsbury", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 44 },
                    { id: "Newport", name: "Newport", city: "Newport", colors: { primary: "#FFB81C", secondary: "#000000" }, reputation: 43 },
                    { id: "Tranmere", name: "Birkenhead", city: "Birkenhead", colors: { primary: "#009640", secondary: "#000000" }, reputation: 43 },
                    { id: "Crawley", name: "Crawley", city: "Crawley", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 42 },
                    { id: "York", name: "York", city: "York", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 41 },
                    { id: "Rochdale", name: "Rochdale", city: "Rochdale", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 40 }
                ]
            },
            {
                id: "Natleague",
                name: "English Fifth Division",
                tier: 5,
                clubs: [
                    { id: "Harrogate", name: "Harrogate", city: "Harrogate", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Barrow", name: "Barrow", city: "Barrow-in-Furness", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "Carlisle", name: "Carlisle", city: "Carlisle", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 40 },
                    { id: "Boreham Wood", name: "Borehamwood", city: "Borehamwood", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 39 },
                    { id: "Scunthorpe", name: "Scunthorpe", city: "Scunthorpe", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 39 },
                    { id: "Southend", name: "Southend-on-Sea", city: "Southend-on-Sea", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 38 },
                    { id: "Forest Green", name: "Forest Green", city: "Forest Green", colors: { primary: "#00593C", secondary: "#000000" }, reputation: 41 },
                    { id: "Halifax", name: "Halifax", city: "Halifax", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 38 },
                    { id: "Hartlepool", name: "Hartlepool", city: "Hartlepool", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 38 },
                    { id: "Woking", name: "Woking", city: "Woking", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "Tamworth", name: "Tamworth", city: "Tamworth", colors: { primary: "#E20E17", secondary: "#000000" }, reputation: 35 },
                    { id: "Boston United", name: "Boston", city: "Boston", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 34 },
                    { id: "Altrincham", name: "Altrincham", city: "Altrincham", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Solihull Moors", name: "Solihull", city: "Solihull", colors: { primary: "#005BAC", secondary: "#FFD200" }, reputation: 32 },
                    { id: "Wealdstone", name: "Wealdstone", city: "Wealdstone", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Yeovil", name: "Yeovil", city: "Yeovil", colors: { primary: "#007A3B", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Eastleigh", name: "Eastleigh", city: "Eastleigh", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 31 },
                    { id: "Gateshead", name: "Gateshead", city: "Gateshead", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Sutton United", name: "Sutton", city: "Sutton", colors: { primary: "#FFCC00", secondary: "#5B3A29" }, reputation: 29 },
                    { id: "Aldershot", name: "Aldershot", city: "Aldershot", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Brackley", name: "Brackley", city: "Brackley", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Morecambe", name: "Morecambe", city: "Morecambe", colors: { primary: "#B4141E", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Braintree", name: "Braintree", city: "Braintree", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 26 },
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
                name: "German First Division",
                tier: 1,
                clubs: [
                    { id: "Bayern Munich", name: "München Red", city: "München", colors: { primary: "#DC052D", secondary: "#FFFFFF" }, reputation: 90 },
                    { id: "Dortmund", name: "Dortmund", city: "Dortmund", colors: { primary: "#FDE100", secondary: "#000000" }, reputation: 85 },
                    { id: "Leipzig", name: "Leipzig White", city: "Leipzig", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 85 },
                    { id: "Leverkusen", name: "Leverkusen", city: "Leverkusen", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 84 },
                    { id: "Mönchengladbach", name: "Mönchengladbach", city: "Mönchengladbach", colors: { primary: "#FFFFFF", secondary: "#00A94F" }, reputation: 77 },
                    { id: "Frankfurt", name: "Frankfurt Red", city: "Frankfurt", colors: { primary: "#E1000F", secondary: "#000000" }, reputation: 81 },
                    { id: "Köln", name: "Cologne Red", city: "Cologne", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Freiburg", name: "Freiburg", city: "Freiburg", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 78 },
                    { id: "Hoffenheim", name: "Hoffenheim", city: "Hoffenheim", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "Stuttgart", name: "Stuttgart Red", city: "Stuttgart", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 81 },
                    { id: "Mainz 05", name: "Mainz", city: "Mainz", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "Augsburg", name: "Augsburg Red", city: "Augsburg", colors: { primary: "#BA3733", secondary: "#46714D" }, reputation: 74 },
                    { id: "Bremen", name: "Bremen Green", city: "Bremen", colors: { primary: "#009639", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Schalke", name: "Schalke", city: "Gelsenkirchen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "Elversberg", name: "Elversberg", city: "Elversberg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Paderborn", name: "Paderborn", city: "Paderborn", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Hamburg", name: "Hamburg Blue", city: "Hamburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Union", name: "Berlin Red", city: "Berlin", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 75 }
                ]
            },
            {
                id: "2BUNDES",
                name: "German Second Division",
                tier: 2,
                clubs: [
                    { id: "Wolfsburg", name: "Wolfsburg", city: "Wolfsburg", colors: { primary: "#009639", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "St. Pauli", name: "Hamburg Black", city: "Hamburg", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Heidenheim", name: "Heidenheim", city: "Heidenheim", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Darmstadt", name: "Darmstadt", city: "Darmstadt", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Hannover", name: "Hannover Green", city: "Hanover", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Kaiserslautern", name: "Kaiserslautern", city: "Kaiserslautern", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "Hertha", name: "Berlin Blue", city: "Berlin", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Nürnberg", name: "Nürnberg", city: "Nuremberg", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Bochum", name: "Bochum Blue", city: "Bochum", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Karlsruhe", name: "Karlsruhe", city: "Karlsruhe", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 64 },
                    { id: "Dresden", name: "Dresden", city: "Dresden", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 64 },
                    { id: "Kiel", name: "Kiel", city: "Kiel", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Bielefeld", name: "Bielefeld", city: "Bielefeld", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Magdeburg", name: "Magdeburg", city: "Magdeburg", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Braunschweig", name: "Braunschweig", city: "Braunschweig", colors: { primary: "#F6E500", secondary: "#003D7C" }, reputation: 62 },
                    { id: "Fürth", name: "Fürth", city: "Fürth", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Osnabrück", name: "Osnabrück", city: "Osnabrück", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Cottbus", name: "Cottbus", city: "Cottbus", colors: { primary: "#DA291C", secondary: "#FF6600" }, reputation: 58 }
                ]
            },
            {
                id: "3LIGA",
                name: "German Third Division",
                tier: 3,
                clubs: [
                    { id: "Düsseldorf", name: "Düsseldorf", city: "Düsseldorf", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Münster", name: "Münster", city: "Münster", colors: { primary: "#00723F", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Essen", name: "Essen", city: "Essen", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Duisburg", name: "Duisburg", city: "Duisburg", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Rostock", name: "Rostock", city: "Rostock", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Verl", name: "Verl", city: "Verl", colors: { primary: "#009640", secondary: "#000000" }, reputation: 57 },
                    { id: "Aachen", name: "Aachen", city: "Aachen", colors: { primary: "#000000", secondary: "#FFD200" }, reputation: 57 },
                    { id: "Wiesbaden", name: "Wiesbaden", city: "Wiesbaden", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 56 },
                    { id: "Mannheim", name: "Mannheim", city: "Mannheim", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 56 },
                    { id: "Viktoria Köln", name: "Cologne Red & Black", city: "Cologne", colors: { primary: "#ac2200", secondary: "#000000" }, reputation: 55 },
                    { id: "Ingolstadt", name: "Ingolstadt", city: "Ingolstadt", colors: { primary: "#D40028", secondary: "#000000" }, reputation: 54 },
                    { id: "Regensburg", name: "Regensburg", city: "Regensburg", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Stuttgart II", name: "Stuttgart Red II", city: "Stuttgart", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Saarbrücken", name: "Saarbrücken", city: "Saarbrücken", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Hoffenheim II", name: "Hoffenheim II", city: "Hoffenheim", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Havelse", name: "Havelse", city: "Garbsen", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Meppen", name: "Meppen", city: "Meppen", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Fortuna Köln", name: "Cologne Claret", city: "Cologne", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Großaspach", name: "Aspach", city: "Aspach", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 48 },
                    { id: "Würzburger", name: "Würzburg", city: "Würzburg", colors: { primary: "#000000", secondary: "#F58220" }, reputation: 48 }
                ]
            },
            {
                id: "REGIONAL1",
                name: "German Fourth Division",
                tier: 4,
                clubs: [
                    { id: "1860", name: "München Teal", city: "Munich", colors: { primary: "#0A9BD6", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Unterhaching", name: "Unterhaching", city: "Unterhaching", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Illertissen", name: "Illertissen", city: "Illertissen", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 45 },
                    { id: "Vilzing", name: "Vilzing", city: "Vilzing", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 39 },
                    { id: "Bayern II", name: "München Red II", city: "Munich", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 42 },
                    { id: "Oberhausen", name: "Oberhausen", city: "Oberhausen", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 48 },
                    { id: "Schalke II", name: "Schalke II", city: "Gelsenkirchen", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Dortmund II", name: "Dortmund II", city: "Dortmund", colors: { primary: "#FDE100", secondary: "#000000" }, reputation: 44 },
                    { id: "Gütersloh", name: "Gütersloh", city: "Gütersloh", colors: { primary: "#00963F", secondary: "#000000" }, reputation: 45 },
                    { id: "Siegen", name: "Siegen", city: "Siegen", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 40 },
                    { id: "Freiberg", name: "Freiberg", city: "Freiberg", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 45 },
                    { id: "FSV Frankfurt", name: "Frankfurt Green", city: "Frankfurt", colors: { primary: "#009640", secondary: "#000000" }, reputation: 43 },
                    { id: "Homburg", name: "Homburg", city: "Homburg", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Aue", name: "Aue", city: "Aue", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Ulm", name: "Ulm", city: "Ulm", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Schweinfurt", name: "Schweinfurt", city: "Schweinfurt", colors: { primary: "#00843D", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "Stuttgarter Kickers", name: "Stuttgart Sky", city: "Stuttgart", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 39 },
                    { id: "Lok Leipzig", name: "Leipzig White & Blue", city: "Leipzig", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 47 },
                    { id: "Jena", name: "Jena", city: "Jena", colors: { primary: "#00A19A", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Zwickau", name: "Zwickau", city: "Zwickau", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 44 },
                    { id: "Halle", name: "Halle", city: "Halle", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 42 },
                    { id: "Erfurt", name: "Erfurt", city: "Erfurt", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Drochtersen", name: "Drochtersen", city: "Drochtersen", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 43 },
                    { id: "Oldenburg", name: "Oldenburg", city: "Oldenburg", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 41 }
                ]
            },
            {
                id: "REGIONAL2",
                name: "German Fifth Division",
                tier: 5,
                clubs: [
                    { id: "Jeddeloh", name: "Jeddeloh", city: "Jeddeloh", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Lübeck", name: "Lübeck Green", city: "Lübeck", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 36 },
                    { id: "Bremer SV", name: "Bremen Black", city: "Bremen", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Altglienicke", name: "Berlin Purple", city: "Berlin", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 38 },
                    { id: "Chemnitz", name: "Chemnitz", city: "Chemnitz", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Preussen", name: "Berlin Yellow", city: "Berlin", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 32 },
                    { id: "Chemie Leipzig", name: "Leipzig Sky", city: "Leipzig", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 33 },
                    { id: "Steinbach", name: "Steinbach", city: "Steinbach", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 37 },
                    { id: "Kassel", name: "Kassel", city: "Kassel", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 34 },
                    { id: "Sandhausen", name: "Sandhausen", city: "Sandhausen", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 34 },
                    { id: "Bonner SC", name: "Bonn", city: "Bonn", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 39 },
                    { id: "Köln II", name: "Cologne Red II", city: "Cologne", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Lotte", name: "Lotte", city: "Lotte", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 36 },
                    { id: "Bocholt", name: "Bocholt Red", city: "Bocholt", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Aubstadt", name: "Aubstadt", city: "Aubstadt", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Eichstätt", name: "Eichstätt", city: "Eichstätt", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 34 },
                    { id: "Burghausen", name: "Burghausen", city: "Burghausen", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Buchbach", name: "Buchbach", city: "Buchbach", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "Memmingen", name: "Memmingen", city: "Memmingen", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Emden", name: "Emden", city: "Emden", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Hamburg II", name: "Hamburg Blue II", city: "Hamburg", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "Babelsberg", name: "Babelsberg", city: "Potsdam", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 33 },
                    { id: "Greifswald", name: "Greifswald", city: "Greifswald", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 31 },
                    { id: "Offenbach", name: "Offenbach", city: "Offenbach", colors: { primary: "#0F1B5F", secondary: "#FFD200" }, reputation: 34 }
                ]
            },
            {
                id: "REGIONAL3",
                name: "German Sixth Division",
                tier: 6,
                clubs: [
                    { id: "Bayreuth", name: "Bayreuth", city: "Bayreuth", colors: { primary: "#FFD200", secondary: "#000000" }, reputation: 29 },
                    { id: "Augsburg II", name: "Augsburg Red II", city: "Augsburg", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Schwaben Augsburg", name: "Augsburg Green", city: "Augsburg", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Landsberg", name: "Landsberg", city: "Landsberg", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 27 },
                    { id: "Berliner AK", name: "Berlin White", city: "Berlin", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 25 },
                    { id: "Paderborn II", name: "Paderborn II", city: "Paderborn", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 27 },
                    { id: "Rödinghausen", name: "Rödinghausen", city: "Rödinghausen", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Wiedenbrück", name: "Wiedenbrück", city: "Wiedenbrück", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 28 },
                    { id: "Bergisch Gladbach", name: "Bergisch Gladbach", city: "Bergisch Gladbach", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Wattenscheid", name: "Bochum Black", city: "Bochum", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Barockstadt", name: "Barockstadt", city: "Fulda", colors: { primary: "#0F1B5F", secondary: "#000000" }, reputation: 29 },
                    { id: "Walldorf", name: "Walldorf", city: "Walldorf", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Trier", name: "Trier", city: "Trier", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 27 },
                    { id: "Aalen", name: "Aalen", city: "Aalen", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 27 },
                    { id: "Tasmania", name: "Berlin Red & Black", city: "Berlin", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 25 },
                    { id: "Hertha II", name: "Berlin Blue II", city: "Berlin", colors: { primary: "#009640", secondary: "#000000" }, reputation: 27 },
                    { id: "Dynamo Berlin", name: "Berlin Orange", city: "Berlin", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 28 },
                    { id: "RSV Eintracht", name: "Berlin White & Blue", city: "Berlin", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 28 },
                    { id: "Weiche", name: "Weiche", city: "Flensburg", colors: { primary: "#00A19A", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "VfB Lübeck", name: "Lübeck Green & White", city: "Lübeck", colors: { primary: "#00A94F", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "HSC Hannover", name: "Hannover Purple", city: "Hannover", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 28 },
                    { id: "Schöningen", name: "Schöningen", city: "Schöningen", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 27 },
                    { id: "Norderstedt", name: "Norderstedt", city: "Norderstedt", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "Todesfelde", name: "Todesfelde", city: "Todesfelde", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 27 }
                ]
            }
        ]
    },
    "Spain": {
        country: "Spain",
        tiers: [
            { 
                id: "LaLiga", 
                name: "Spanish First Division",
                tier: 1,
                clubs: [
                    { id: "Real Madrid", name: "Madrid White", city: "Madrid", colors: { primary: "#FFFFFF", secondary: "#FEBE10" }, reputation: 90 },
                    { id: "Barcelona", name: "Barcelona Claret", city: "Barcelona", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 90 },
                    { id: "Atletico", name: "Madrid Red", city: "Madrid", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 86 },
                    { id: "Villarreal", name: "Villarreal", city: "Villarreal", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 82 },
                    { id: "Sevilla", name: "Seville Red", city: "Seville", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 80 },
                    { id: "Betis", name: "Seville Green", city: "Seville", colors: { primary: "#009540", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Valencia", name: "Valencia White", city: "Valencia", colors: { primary: "#FFFFFF", secondary: "#EE7203" }, reputation: 78 },
                    { id: "Real Sociedad", name: "San Sebastián", city: "San Sebastián", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "Athletic Bilbao", name: "Bilbao Red", city: "Bilbao", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "Espanyol", name: "Barcelona Blue", city: "Barcelona", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Celta Vigo", name: "Vigo", city: "Vigo", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Vallecano", name: "Madrid Red & White", city: "Madrid", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "Alaves", name: "Vitoria-Gasteiz", city: "Vitoria-Gasteiz", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Getafe", name: "Getafe", city: "Getafe", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Elche", name: "Elche", city: "Elche", colors: { primary: "#00915A", secondary: "#FFFFFF" }, reputation: 73 },
                    { id: "Levante", name: "Valencia Red", city: "Valencia", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 74 },
                    { id: "Osasuna", name: "Osasuna", city: "Pamplona", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 74 },
                    { id: "Racing Santander", name: "Santander Green", city: "Santander", colors: { primary: "#00A94F", secondary: "#FFFFFF" }, reputation: 73 },
                    { id: "Deportivo", name: "La Coruña Blue", city: "La Coruña", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "Malaga", name: "Málaga", city: "Málaga", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 72 }
                ]
            },
            {
                id: "LaLiga2", 
                name: "Spanish Second Division",
                tier: 2,
                clubs: [
                    { id: "Mallorca", name: "Mallorca", city: "Palma de Mallorca", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 74 },
                    { id: "Girona", name: "Girona", city: "Girona", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Oviedo", name: "Oviedo", city: "Oviedo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Almeria", name: "Almería", city: "Almería", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 71 },
                    { id: "Las Palmas", name: "Las Palmas", city: "Las Palmas", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Castellón", name: "Castellón", city: "Castellón de la Plana", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Burgos", name: "Burgos", city: "Burgos", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 69 },
                    { id: "Eibar", name: "Eibar", city: "Eibar", colors: { primary: "#9F1E3C", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Gijón", name: "Gijón", city: "Gijón", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Cordoba", name: "Córdoba", city: "Córdoba", colors: { primary: "#007A33", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Ceuta", name: "Ceuta", city: "Ceuta", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 66 },
                    { id: "Albacete", name: "Albacete White", city: "Albacete", colors: { primary: "#FFFFFF", secondary: "#000000" }, reputation: 67 },
                    { id: "Andorra", name: "Andorra", city: "Andorra la Vella", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 66 },
                    { id: "Granada", name: "Granada", city: "Granada", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Real Sociedad B", name: "San Sebastián II", city: "San Sebastián", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "Leganés", name: "Leganés", city: "Leganés", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Valladolid", name: "Valladolid", city: "Valladolid", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Cádiz", name: "Cádiz", city: "Cádiz", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 65 },
                    { id: "Tenerife", name: "Tenerife", city: "Santa Cruz de Tenerife", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "Eldense", name: "Eldense", city: "Elda", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 63 },
                    { id: "Sabadell", name: "Sabadell", city: "Sabadell", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 62 },
                    { id: "Celta Vigo B", name: "Vigo II", city: "Vigo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                ]
            },
            {
                id: "PrimeraSup",
                name: "Spanish Third Division",
                tier: 3,
                clubs: [
                    { id: "Zaragoza", name: "Zaragoza", city: "Zaragoza", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Huesca", name: "Huesca", city: "Huesca", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 61 },
                    { id: "Leonesa", name: "León", city: "León", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Mirandés", name: "Mirandés", city: "Miranda de Ebro", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 60 },
                    { id: "Zamora", name: "Zamora", city: "Zamora", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "Ponferradina", name: "Ponferradina", city: "Ponferrada", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 58 },
                    { id: "Pontevedra", name: "Pontevedra", city: "Pontevedra", colors: { primary: "#6B2737", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Barakaldo", name: "Barakaldo", city: "Barakaldo", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Unionistas", name: "Salamanca", city: "Salamanca", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Lugo", name: "Lugo", city: "Lugo", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Mérida", name: "Mérida", city: "Mérida", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Arenas", name: "Getxo", city: "Getxo", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 54 },
                    { id: "Ferrol", name: "Ferrol", city: "Ferrol", colors: { primary: "#009B48", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Atletico Madrid B", name: "Madrid Red II", city: "Madrid", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 57 },
                    { id: "Villareal B", name: "Villarreal II", city: "Villarreal", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 56 },
                    { id: "Real Madrid B", name: "Madrid White II", city: "Madrid", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "Europa", name: "Barcelona Purple", city: "Barcelona", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Cartagena", name: "Cartagena", city: "Cartagena", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Antequera", name: "Antequera", city: "Antequera", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 52 },
                    { id: "Algeciras", name: "Algeciras", city: "Algeciras", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 51 },
                    { id: "Hércules", name: "Alicante Blue", city: "Alicante", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Real Murcia", name: "Murcia Claret", city: "Murcia", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 }
                ]
            },
            {
                id: "PrimeraInf",
                name: "Spanish Fourth Division",
                tier: 4,
                clubs: [
                    { id: "Alcorcón", name: "Alcorcón", city: "Alcorcón", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 49 },
                    { id: "Ibiza", name: "Ibiza", city: "Ibiza", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 48 },
                    { id: "Teruel", name: "Teruel", city: "Teruel", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "Gimnástica", name: "Torrelavega", city: "Torrelavega", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 46 },
                    { id: "Torremolinos", name: "Torremolinos", city: "Torremolinos", colors: { primary: "#009640", secondary: "#000000" }, reputation: 45 },
                    { id: "Majadaonda", name: "Majadahonda", city: "Majadahonda", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 43 },
                    { id: "Sant Andreu", name: "Barcelona Claret & Yellow", city: "Barcelona", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 41 },
                    { id: "Águilas", name: "Águilas", city: "Águilas", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Real Jaén", name: "Jaén", city: "Jaén", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "Athletic Bilbao B", name: "Bilbao Red II", city: "Bilbao", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 43 },
                    { id: "Avilés", name: "Avilés", city: "Avilés", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 49 },
                    { id: "Cacereño", name: "Cacereño", city: "Cáceres", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 47 },
                    { id: "Extremadura", name: "Extremadura", city: "Almendralejo", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 46 },
                    { id: "Real Union", name: "Irun", city: "Irun", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 45 },
                    { id: "Fabril", name: "La Coruña Claret", city: "La Coruña", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 44 },
                    { id: "Ourense", name: "Ourense", city: "Ourense", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 42 },
                    { id: "Coria", name: "Coria", city: "Coria", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Logroñés", name: "Logroñés", city: "Logroño", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "Barcelona B", name: "Barcelona Claret II", city: "Barcelona", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 48 },
                    { id: "Terrassa", name: "Terrassa", city: "Terrassa", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 38 },
                    { id: "Rayo Cantabria", name: "Santander Green & White", city: "Santander", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Basconia", name: "Bilbao Red & Blue", city: "Bilbao", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 37 }
                ]
            },
            {
                id: "Segunda",
                name: "Spanish Fifth Division",
                tier: 5,
                clubs: [
                    { id: "Real Oviedo B", name: "Oviedo II", city: "Oviedo", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Bergantiños", name: "Carballo", city: "Carballo", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 38},
                    { id: "Alavés B", name: "Vitoria-Gasteiz II", city: "Vitoria-Gasteiz", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Sestao River", name: "Sestao", city: "Sestao", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "Arosa", name: "Vilagarcía de Arousa", city: "Vilagarcía de Arousa", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 31 },
                    { id: "Peña Sport", name: "Tafalla", city: "Tafalla", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Sevilla Atlético", name: "Sevilla", city: "Sevilla", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 36 },
                    { id: "R. Huelva", name: "Huelva", city: "Huelva", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 34 },
                    { id: "Xerez", name: "Jerez de la Frontera", city: "Jerez de la Frontera", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 33 },
                    { id: "Marbella", name: "Marbella", city: "Marbella", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 31 },
                    { id: "Don Benito", name: "Don Benito", city: "Don Benito", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Lucena", name: "Lucena", city: "Lucena", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 29 },
                    { id: "Tamaraceite", name: "Tamaraceite", city: "Las Palmas de Gran Canaria", colors: { primary: "#009640", secondary: "#000000" }, reputation: 31 },
                    { id: "Sanluqueño", name: "Sanlúcar de Barrameda", city: "Sanlúcar de Barrameda", colors: { primary: "#FFFFFF", secondary: "#0033A0" }, reputation: 29 },
                    { id: "UCAM Murcia", name: "Murcia Claret & Yellow", city: "Murcia", colors: { primary: "#8C1D40", secondary: "#FCD200" }, reputation: 35 },
                    { id: "Valencia B", name: "Valencia White II", city: "Valencia", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Intercity", name: "Alicante Claret", city: "Alicante", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 29 },
                    { id: "CD Guadalajara", name: "Guadalajara", city: "Guadalajara", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Salamanca", name: "Villares de la Reina (Salamanca)", city: "Villares de la Reina (Salamanca)", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "Atlético Albacete", name: "Albacete Red", city: "Albacete", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 33 }
                ]
            }
        ]
    },
        "Switzerland": {
        country: "Switzerland",
        tiers: [
            { 
                id: "SuperLeagueCH", 
                name: "Swiss First Division",
                tier: 1,
                clubs: [
                    { id: "Basel", name: "Basel Red", city: "Basel", colors: { primary: "#E2001A", secondary: "#1C3F94" }, reputation: 80 },
                    { id: "YB", name: "Bern Yellow", city: "Bern", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 79 },
                    { id: "FCZ", name: "Zürich Blue", city: "Zürich", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 75},
                    { id: "FC Lugano", name: "Lugano", city: "Lugano", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "FCSG", name: "St. Gallen Green", city: "St. Gallen", colors: { primary: "#00934A", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "Servette", name: "Servette", city: "Genève", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "Lausanne-Sport", name: "Lausanne Blue", city: "Lausanne", colors: { primary: "#0057A8", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "Sion", name: "Sion", city: "Sion", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Luzern", name: "Luzern", city: "Luzern", colors: { primary: "#00479D", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Thun", name: "Thun", city: "Thun", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 66 },
                    { id: "GCZ", name: "Zürich Sky", city: "Zürich", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "Vaduz", name: "Vaduz", city: "Vaduz", colors: { primary: "#003DA5", secondary: "#000000" }, reputation: 62 }
                ]
            },
            {
                id: "ChallengeLeague",
                name: "Swiss Second Division",
                tier: 2,
                clubs: [
                    { id: "Winterthur", name: "Winterthur", city: "Winterthur", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Aarau", name: "Aarau", city: "Aarau", colors: { primary: "#0F1B5F", secondary: "#000000" }, reputation: 60 },
                    { id: "Yverdon", name: "Yverdon", city: "Yverden-les-Bains", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 58},
                    { id: "Stade Lausanne", name: "Lausanne Teal", city: "Lausanne", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 54 },
                    { id: "Xamax", name: "Xamax", city: "Neuchâtel", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 55 },
                    { id: "FCRJ", name: "Rapperswil-Jona", city: "Rapperswil-Jona", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 52 },
                    { id: "Etoile Carouge", name: "Carouge", city: "Carouge", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Wil", name: "Wil", city: "Wil", colors: { primary: "#000000", secondary: "#E2001A" }, reputation: 49 },
                    { id: "Nyonnais", name: "Nyon", city: "Nyon", colors: { primary: "#009640", secondary: "#000000" }, reputation: 48 },
                    { id: "Kriens", name: "Kriens", city: "Kriens", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 47 }
                ]
            },
            {
                id: "PromotionLeague",
                name: "Swiss Third Division",
                tier: 3,
                clubs: [
                    { id: "Bellinzona", name: "Bellinzona", city: "Bellinzona", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 47 },
                    { id: "Biel-Bienne", name: "Biel-Bienne", city: "Biel-Bienne", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Brühl", name: "St. Gallen Green & White", city: "St. Gallen", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 45},
                    { id: "Basel U21", name: "Basel Red II", city: "Basel", colors: { primary: "#E2001A", secondary: "#1C3F94" }, reputation: 41 },
                    { id: "Bavois", name: "Bavois", city: "Bavois", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 42 },
                    { id: "YB U21", name: "Bern Yellow II", city: "Bern", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 40 },
                    { id: "Schaffhausen", name: "Schaffhausen", city: "Schaffhausen", colors: { primary: "#000000", secondary: "#5BA4D8" }, reputation: 40 },
                    { id: "FC Bulle", name: "Bulle", city: "Bulle", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "SC Cham", name: "Cham", city: "Cham", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 38 },
                    { id: "Grand-Saconnex", name: "Grand-Saconnex", city: "Le Grand-Saconnex", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "FC Zürich U21", name: "Zürich Blue II", city: "Zürich", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "FC Breitenrain", name: "Bern Teal", city: "Bern", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 36 },
                    { id: "FC Luzern U21", name: "Luzern II", city: "Luzern", colors: { primary: "#00479D", secondary: "#FFFFFF" }, reputation: 34},
                    { id: "FC Kreuzlingen", name: "Kreuzlingen", city: "Kreuzlingen", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 35 },
                    { id: "Collina d'Oro", name: "Collina d'Oro", city: "Collina d'Oro", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 32 },
                    { id: "FC Paradiso", name: "Paradiso", city: "Paradiso", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "Amical Saint-Prex", name: "Saint-Prex", city: "Saint-Prex", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 31 },
                    { id: "YF Juventus", name: "Zürich Black", city: "Zürich", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 33 }
                ]
            },
            {
                id: "1.LigaCH",
                name: "Swiss Fourth Division",
                tier: 4,
                clubs: [
                    { id: "Vevey-Sports", name: "Vevey", city: "Vevey", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "Lausanne-Sport U21", name: "Lausanne Blue II", city: "Lausanne", colors: { primary: "#0057A8", secondary: "#FFFFFF" }, reputation: 25 },
                    { id: "CS Chênois", name: "Chênois", city: "Thônex", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 30},
                    { id: "FC Coffrane", name: "Coffrane", city: "Coffrane", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 22 },
                    { id: "FC Prishtina BE", name: "Bern Blue", city: "Bern", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "FC Naters", name: "Naters", city: "Naters", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "La Chaux-de-Fonds", name: "La Chaux-de-Fonds", city: "La Chaux-de-Fonds", colors: { primary: "#FCD200", secondary: "#0033A0" }, reputation: 26 },
                    { id: "Lancy FC", name: "Lancy", city: "Lancy", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "FC Tuggen", name: "Tuggen", city: "Tuggen", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 30 },
                    { id: "FC Wettswil-Bonstetten", name: "Wettswil-Bonstetten", city: "Wettswil-Bonstetten", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 28 },
                    { id: "FC Baden 1897", name: "Baden", city: "Baden", colors: { primary: "#000000", secondary: "#E2001A" }, reputation: 26 },
                    { id: "FC Mendrisio", name: "Mendrisio", city: "Mendrisio", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 24 },
                    { id: "FC Kosova", name: "Zürich Red", city: "Zürich", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 25},
                    { id: "FC Winterthur U21", name: "Winterthur II", city: "Winterthur", colors: { primary: "#FFD500", secondary: "#000000" }, reputation: 23 },
                    { id: "FC Lugano U21", name: "Lugano II", city: "Lugano", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "Eschen/Mauren", name: "Eschen/Mauren", city: "Eschen/Mauren", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 24 },
                    { id: "Grasshoppers U21", name: "Zürich Sky II", city: "Zürich", colors: { primary: "#5BA4D8", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "FC Langenthal", name: "Langenthal", city: "Langenthal", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 33 },
                    { id: "SV Muttenz", name: "Muttenz", city: "Muttenz", colors: { primary: "#0033A0", secondary: "#FCD200" }, reputation: 29},
                    { id: "Concordia BS", name: "Basel Black", city: "Basel", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "FC Solothurn", name: "Solothurn", city: "Solothurn", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 25 },
                    { id: "FC Wohlen", name: "Wohlen", city: "Wohlen", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 23 },
                    { id: "Zug 94", name: "Zug", city: "Zug", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 24 },
                    { id: "FC Black Stars", name: "Basel Black & Yellow", city: "Basel", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 23 }
                ]
            },
            {
                id: "2.LigaCH",
                name: "Swiss Fifth Division",
                tier: 5,
                clubs: [
                    { id: "FC Courtételle", name: "Courtételle", city: "Courtételle", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 23 },
                    { id: "FC Schötz", name: "Schötz", city: "Schötz", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "FC Münsingen", name: "Münsingen", city: "Münsingen", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 22},
                    { id: "FC Bassecourt", name: "Bassecourt", city: "Bassecourt", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 22 },
                    { id: "SC Buochs", name: "Buochs", city: "Buochs", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "SR Delémont", name: "Delémont", city: "Delémont", colors: { primary: "#F58220", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "FC Muri-Gümligen", name: "Gümligen", city: "Gümligen", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 18 },
                    { id: "FC Monthey", name: "Monthey", city: "Monthey", colors: { primary: "#000000", secondary: "#DA291C" }, reputation: 23 },
                    { id: "FC Portalban", name: "Portalban", city: "Delley-Portalban", colors: { primary: "#DA291C", secondary: "#0033A0" }, reputation: 22 },
                    { id: "FC Echallens", name: "Echallens", city: "Echallens", colors: { primary: "#5BA4D8", secondary: "#000000" }, reputation: 21 },
                    { id: "Stade-Payerne", name: "Payerne", city: "Payerne", colors: { primary: "#00A19A", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "Meyrin FC", name: "Meyrin", city: "Meyrin", colors: { primary: "#FCD200", secondary: "#0033A0" }, reputation: 20 },
                    { id: "USI Azzurri", name: "Azzurri", city: "Châtelaine", colors: { primary: "#0033A0", secondary: "#FFFFFF" }, reputation: 19},
                    { id: "Servette U21", name: "Servette II", city: "Genève", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "FC Gossau", name: "Gossau", city: "Gossau SG", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 23 },
                    { id: "FC Locarno", name: "Locarno", city: "Locarno", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 21 },
                    { id: "FC Thalwil", name: "Thalwil", city: "Thalwil", colors: { primary: "#003DA5", secondary: "#FCD200" }, reputation: 20 },
                    { id: "FC Freienbach", name: "Freienbach", city: "Freienbach", colors: { primary: "#009640", secondary: "#000000" }, reputation: 19 },
                    { id: "FC Dietikon", name: "Dietikon", city: "Dietikon", colors: { primary: "#7A1E3C", secondary: "#000000" }, reputation: 20},
                    { id: "AC Taverne", name: "Taverne", city: "Taverne", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 20 },
                    { id: "FC Widnau", name: "Widnau", city: "Widnau", colors: { primary: "#E2001A", secondary: "#000000" }, reputation: 22 },
                    { id: "FCSG U21", name: "St. Gallen Green II", city: "St. Gallen", colors: { primary: "#00934A", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "FC Sion U21", name: "Sion II", city: "Sion", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 21 },
                    { id: "FC Ellikon Marthalen", name: "Marthalen", city: "Marthalen", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 18 }
                ]
            }
        ]
    },
    "Italy": {
        country: "Italy",
        tiers: [
            { 
                id: "SerieA", 
                name: "Italian First Division",
                tier: 1,
                clubs: [
                    { id: "Inter Milan", name: "Milan Navy", city: "Milan", colors: { primary: "#0B1560", secondary: "#000000" }, reputation: 88 },
                    { id: "Napoli", name: "Napoli", city: "Napoli", colors: { primary: "#0E7DC2", secondary: "#FFFFFF" }, reputation: 86 },
                    { id: "Juventus", name: "Torino Black", city: "Torino", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 85 },
                    { id: "AC Milan", name: "Milan Red", city: "Milan", colors: { primary: "#FB090B", secondary: "#000000" }, reputation: 85 },
                    { id: "AS Roma", name: "Rome Claret", city: "Rome", colors: { primary: "#8E1F2F", secondary: "#F0BC42" }, reputation: 81 },
                    { id: "Atalanta", name: "Bergamo Blue", city: "Bergamo", colors: { primary: "#1961AE", secondary: "#000000" }, reputation: 79 },
                    { id: "Lazio", name: "Rome Sky", city: "Rome", colors: { primary: "#6CACE4", secondary: "#FFFFFF" }, reputation: 78 },
                    { id: "FC Bologna", name: "Bologna", city: "Bologna", colors: { primary: "#A5122A", secondary: "#1C2B7F" }, reputation: 78 },
                    { id: "Fiorentina", name: "Fiorentina", city: "Florence", colors: { primary: "#592C82", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "Como", name: "Como", city: "Como", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Udinese", name: "Udine", city: "Udine", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "US Sassuolo", name: "Sassuolo", city: "Sassuolo", colors: { primary: "#00A752", secondary: "#000000" }, reputation: 75 },
                    { id: "FC Torino", name: "Torino Claret", city: "Torino", colors: { primary: "#7A1E28", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "Parma Calcio", name: "Parma", city: "Parma", colors: { primary: "#FFD100", secondary: "#1C4E9D" }, reputation: 74 },
                    { id: "Cagliari", name: "Cagliari", city: "Cagliari", colors: { primary: "#A3122E", secondary: "#1B3A6B" }, reputation: 74 },
                    { id: "Genua CFC", name: "Genua Claret", city: "Genua", colors: { primary: "#A5122A", secondary: "#1C2B7F" }, reputation: 73 },
                    { id: "Lecce", name: "Lecce", city: "Lecce", colors: { primary: "#FCD200", secondary: "#E30613" }, reputation: 73 },
                    { id: "Venezia FC", name: "Venice", city: "Venice", colors: { primary: "#000000", secondary: "#FF7A00" }, reputation: 73 },
                    { id: "Frosinone", name: "Frosinone", city: "Frosinone", colors: { primary: "#F4C40E", secondary: "#12326E" }, reputation: 72 },
                    { id: "Monza", name: "Monza", city: "Monza", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 72 }
                ]
            },
            {
                id: "SerieB", 
                name: "Italian Second Division",
                tier: 2,
                clubs: [
                    { id: "Pisa SC", name: "Pisa", city: "Pisa", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 72 },
                    { id: "Hellas Verona", name: "Verona", city: "Verona", colors: { primary: "#143A85", secondary: "#FCD200" }, reputation: 73 },
                    { id: "Cremonese", name: "Cremonese", city: "Cremona", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Palermo", name: "Palermo", city: "Palermo", colors: { primary: "#F6A9C7", secondary: "#000000" }, reputation: 71 },
                    { id: "Catanzaro", name: "Catanzaro", city: "Catanzaro", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 69 },
                    { id: "Modena FC", name: "Modena", city: "Modena", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Avellino", name: "Avellino", city: "Avellino", colors: { primary: "#00934A", secondary: "#FCD200" }, reputation: 68 },
                    { id: "Calcio Padova", name: "Padova", city: "Padova", colors: { primary: "#9F1E3C", secondary: "#005BAC" }, reputation: 69 },
                    { id: "Cesena", name: "Cesena", city: "Cesena", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 67 },
                    { id: "Mantova", name: "Mantova", city: "Mantova", colors: { primary: "#007A33", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Carrarese", name: "Carrarese", city: "Carrara", colors: { primary: "#6A1B9A", secondary: "#000000" }, reputation: 66 },
                    { id: "Sampdoria", name: "Genua Blue", city: "Genua", colors: { primary: "#1B398E", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "Virtus Entella", name: "Chiavari", city: "Chiavari", colors: { primary: "#FFD500", secondary: "#003DA5" }, reputation: 65 },
                    { id: "FC Empoli", name: "Empoli", city: "Empoli", colors: { primary: "#0066B3", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Südtirol", name: "Südtirol", city: "Bozen", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Benevento", name: "Benevento", city: "Benevento", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 65 },
                    { id: "LR Vicenza", name: "Vicenza", city: "Vicenza", colors: { primary: "#5C2D91", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "Arezzo", name: "Arezzo", city: "Arezzo", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 62 },
                    { id: "Ascoli", name: "Ascoli", city: "Ascoli", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 62 },
                    { id: "Juve Stabia", name: "Castellammare di Stabia", city: "Castellammare di Stabia", colors: { primary: "#C8102E", secondary: "#000000" }, reputation: 61 }
                ]
            },
            {
                id: "SerieC",
                name: "Italian Third Division",
                tier: 3,
                clubs: [
                    { id: "Reggiana", name: "Reggiana", city: "Reggiana", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Spezia Calcio", name: "La Spezia", city: "La Spezia", colors: { primary: "#0057A8", secondary: "#FCD200" }, reputation: 61 },
                    { id: "Ravenna", name: "Ravenna", city: "Ravenna", colors: { primary: "#DA291C", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Campobasso", name: "Campobasso", city: "Campobasso", colors: { primary: "#DA291C", secondary: "#000000" }, reputation: 56 },
                    { id: "Pianese", name: "Pianese", city: "Piancastagnaio", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Pineto", name: "Pineto", city: "Pineto", colors: { primary: "#FCD200", secondary: "#000000" }, reputation: 53 },
                    { id: "AS Gubbio", name: "Gubbio", city: "Gubbio", colors: { primary: "#6B2737", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Vis Pesaro", name: "Pesaro", city: "Pesaro", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "SSC Bari", name: "Bari", city: "Bari", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Catania", name: "Catania", city: "Catania", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "US Salernitana", name: "Salernitana", city: "Salerno", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "Cosenza", name: "Cosenza", city: "Cosenza", colors: { primary: "#F58220", secondary: "#000000" }, reputation: 58 },
                    { id: "Casertana", name: "Caserta", city: "Caserta", colors: { primary: "#009B48", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "FC Crotone", name: "Crotone", city: "Crotone", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 58 },
                    { id: "Casarano", name: "Casarano", city: "Casarano", colors: { primary: "#FFD200", secondary: "#005BAC" }, reputation: 52 },
                    { id: "Monopoli", name: "Monopoli", city: "Monopoli", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "Union Brescia", name: "Brescia", city: "Brescia", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "Renate", name: "Renate", city: "Renate", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "Lecco", name: "Lecco", city: "Lecco", colors: { primary: "#00A19A", secondary: "#000000" }, reputation: 56 },
                    { id: "AC Trento", name: "Trento", city: "Trento", colors: { primary: "#1C3F94", secondary: "#FCD200" }, reputation: 55 },
                    { id: "AS Cittadella", name: "Cittadella", city: "Cittadella", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "Lumezzane", name: "Lumezzane", city: "Lumezzane", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Alcione", name: "Milan Blue", city: "Milan", colors: { primary: "#003DA5", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "Arzignano", name: "Arzignano", city: "Arzignano", colors: { primary: "#7A1E3C", secondary: "#FFFFFF" }, reputation: 49 }
                ]
            },
            {
                id: "SerieD",
                name: "Italian Fourth Division",
                tier: 4,
                clubs: [
                    { id: "Team Altamura", name: "Altamura", city: "Altamura", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Giana Erminio", name: "Gorgonzola", city: "Gorgonzola", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "AlbinoLeffe", name: "Bergamo Sky", city: "Bergamo", colors: { primary: "#6AADE4", secondary: "#0F1B5F" }, reputation: 47 },
                    { id: "Dolomiti Bellunesi", name: "Feltre", city: "Feltre", colors: { primary: "#E5007E", secondary: "#009640" }, reputation: 44 },
                    { id: "Novara FC", name: "Novara", city: "Novara", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "Pro Vercelli", name: "Vercelli", city: "Vercelli", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 43 },
                    { id: "Ospitaletto", name: "Ospitaletto", city: "Ospitaletto", colors: { primary: "#E30613", secondary: "#0F1B5F" }, reputation: 41 },
                    { id: "Livorno", name: "Livorno", city: "Livorno", colors: { primary: "#7A1E3C", secondary: "#FCD200" }, reputation: 47 },
                    { id: "Forli", name: "Forli", city: "Forli", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "Carpi", name: "Carpi", city: "Carpi", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "AC Perugia", name: "Perugia", city: "Perugia", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Guidonia", name: "Guidonia", city: "Guidonia Montecelio", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 43 },
                    { id: "US Sambenedettese", name: "Sambenedettese", city: "San Benedetto del Tronto", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 41 },
                    { id: "SEF Torres 1903", name: "Torres", city: "Sassari", colors: { primary: "#E30613", secondary: "#0F1B5F" }, reputation: 40 },
                    { id: "Barletta", name: "Barletta", city: "Barletta", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 39 },
                    { id: "Cavese", name: "Cavese", city: "Cava dei Tirreni", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "Giugliano", name: "Giugliano", city: "Giugliano in Campania", colors: { primary: "#0F1B5F", secondary: "#FCD200" }, reputation: 39 },
                    { id: "Picerno", name: "Picerno", city: "Picerno", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 38 },
                    { id: "Potenza", name: "Potenza", city: "Potenza", colors: { primary: "#A50044", secondary: "#005BAC" }, reputation: 38 },
                    { id: "US Savoia", name: "Savoia", city: "Torre Annunziata", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 38 }
                ]
            }
        ]
    },
    "France": {
        country: "France",
        tiers: [
            { 
                id: "Ligue1", 
                name: "French First Division",
                tier: 1,
                clubs: [
                    { id: "PSG", name: "Paris Blue", city: "Paris", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 90 },
                    { id: "Olympique Lyon", name: "Lyon Blue", city: "Lyon", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 81 },
                    { id: "Lens", name: "Lens", city: "Lens", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 79 },
                    { id: "LOSC Lille", name: "Lille Red", city: "Lille", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 79 },
                    { id: "Marseille", name: "Marseille", city: "Marseille", colors: { primary: "#FFFFFF", secondary: "#2FAEE0" }, reputation: 79 },
                    { id: "Stade Rennes", name: "Rennes", city: "Rennes", colors: { primary: "#000000", secondary: "#E30613" }, reputation: 77 },
                    { id: "AS Monaco", name: "Monaco", city: "Monaco", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 80 },
                    { id: "RC Strasbourg", name: "Strasbourg", city: "Strasbourg", colors: { primary: "#6AADE4", secondary: "#E30613" }, reputation: 76 },
                    { id: "FC Lorient", name: "Lorient", city: "Lorient", colors: { primary: "#E30613", secondary: "#F58220" }, reputation: 73 },
                    { id: "FC Toulouse", name: "Toulouse", city: "Toulouse", colors: { primary: "#6A1B9A", secondary: "#E30613" }, reputation: 74 },
                    { id: "Paris FC", name: "Paris Navy", city: "Paris", colors: { primary: "#0F1B5F", secondary: "#005BAC" }, reputation: 75 },
                    { id: "Stade Brest", name: "Brest", city: "Brest", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "Angers SCO", name: "Angers", city: "Angers", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 74 },
                    { id: "Le Havre AC", name: "Le Havre", city: "Le Havre", colors: { primary: "#6AADE4", secondary: "#0F1B5F" }, reputation: 73 },
                    { id: "AJ Auxerre", name: "Auxerre", city: "Auxerre", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 72 },
                    { id: "OGC Nice", name: "Nice", city: "Nice", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 76 },
                    { id: "Troyes", name: "Troyes", city: "Troyes", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Le Mans FC", name: "Le Mans", city: "Le Mans", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 70 }
                ]
            },
            {
                id: "Ligue2", 
                name: "French Second Division",
                tier: 2,
                clubs: [
                    { id: "FC Nantes", name: "Nantes", city: "Nantes", colors: { primary: "#FCD200", secondary: "#009640" }, reputation: 72 },
                    { id: "Saint-Étienne", name: "Saint-Étienne", city: "Saint-Étienne", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 71 },
                    { id: "Stade Reims", name: "Reims", city: "Reims", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "FC Metz", name: "Metz", city: "Metz", colors: { primary: "#8E1F2F", secondary: "#FFFFFF" }, reputation: 69 },
                    { id: "Montpellier HSC", name: "Montpellier", city: "Montpellier", colors: { primary: "#F58220", secondary: "#005BAC" }, reputation: 70 },
                    { id: "Rodez AF", name: "Rodez", city: "Rodez", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 67 },
                    { id: "Pau FC", name: "Pau", city: "Pau", colors: { primary: "#0F1B5F", secondary: "#FCD200" }, reputation: 68 },
                    { id: "Clermont Foot 63", name: "Clermont", city: "Clermont", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 69 },
                    { id: "Red Star FC", name: "Paris Navy & Red", city: "Paris", colors: { primary: "#00593C", secondary: "#E30613" }, reputation: 66 },
                    { id: "Grenoble Foot 38", name: "Grenoble", city: "Grenoble", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "USL Dunkerque", name: "Dunkerque", city: "Dunkerque", colors: { primary: "#0F1B5F", secondary: "#D4AF37" }, reputation: 65 },
                    { id: "AS Nancy", name: "Nancy", city: "Nancy", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 66 },
                    { id: "Stade Lavallois", name: "Laval", city: "Laval", colors: { primary: "#000000", secondary: "#F58220" }, reputation: 64 },
                    { id: "EA Guingamp", name: "Guingamp", city: "Guingamp", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 66 },
                    { id: "FC Annecy", name: "Annecy", city: "Annecy", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "US Boulogne", name: "Boulogne", city: "Boulogne", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 63 },
                    { id: "FC Sochaux-Montbéliard", name: "Sochaux-Montbéliard", city: "Sochaux-Montbéliard", colors: { primary: "#005BAC", secondary: "#FCD200" }, reputation: 62 },
                    { id: "Dijon FCO", name: "Dijon", city: "Dijon", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 61 }
                ]
            },
            {
                id: "Ligue3",
                name: "French Third Division",
                tier: 3,
                clubs: [
                    { id: "Amiens SC", name: "Amiens", city: "Amiens", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "SC Bastia", name: "Bastia Blue", city: "Bastia", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 61 },
                    { id: "US Orléans", name: "Orléans", city: "Orléans", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 60 },
                    { id: "FC Versailles 78", name: "Versailles", city: "Versailles", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "SM Caen", name: "Caen", city: "Caen", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 59 },
                    { id: "FC Valenciennes", name: "Valenciennes", city: "Valenciennes", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 58 },
                    { id: "US Concarneau", name: "Concarneau", city: "Concarneau", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 55 },
                    { id: "FC Villefranche-Beaujolais", name: "Villefranche-Beaujolais", city: "Villefranche-sur-Saône", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "FC Fleury 91", name: "Fleury", city: "Bondoufle", colors: { primary: "#E30613", secondary: "#000000" }, reputation: 55 },
                    { id: "Paris 13 Atletico", name: "Paris Green", city: "Paris", colors: { primary: "#39FF14", secondary: "#000000" }, reputation: 55 },
                    { id: "SC Aubagne Air Bel", name: "Aubagne", city: "Aubagne", colors: { primary: "#000000", secondary: "#D9CBB2" }, reputation: 54 },
                    { id: "Le Puy-en-Velay FC", name: "Espaly-Saint-Marcel", city: "Espaly-Saint-Marcel", colors: { primary: "#0F1B5F", secondary: "#6AADE4" }, reputation: 53 },
                    { id: "FC Rouen", name: "Rouen", city: "Rouen", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Quevilly-Rouen Métropole", name: "Le Petit-Quevilly", city: "Le Petit-Quevilly", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 51 },
                    { id: "Football Bourg-en-Bresse Péronnas", name: "Bourg-en-Bresse", city: "Bourg-en-Bresse", colors: { primary: "#0F1B5F", secondary: "#6AADE4" }, reputation: 50 },
                    { id: "AS Cannes", name: "Cannes", city: "Cannes", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "US Thionville Lusitanos", name: "Thionville", city: "Thionville", colors: { primary: "#FFFFFF", secondary: "#D4AF37" }, reputation: 49 },
                    { id: "VFC La Roche", name: "La Roche-sur-Yon", city: "La Roche-sur-Yon", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 49 }
                ]
            },
            {
                id: "Ligue4",
                name: "French Fourth Division",
                tier: 4,
                clubs: [
                    { id: "Girondins Bordeaux", name: "Bordeaux", city: "Bordeaux", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "Aviron Bayonnais", name: "Bayonne", city: "Bayonne", colors: { primary: "#6AADE4", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "US Saint-Malo", name: "Saint-Malo", city: "Saint-Malo", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 44 },
                    { id: "Les Herbiers", name: "Les Herbiers", city: "Les Herbiers", colors: { primary: "#000000", secondary: "#E30613" }, reputation: 42 },
                    { id: "Angoulême CFC", name: "Angoulême", city: "Angoulême", colors: { primary: "#0F1B5F", secondary: "#6AADE4" }, reputation: 43 },
                    { id: "Dinan Léhon", name: "Dinan", city: "Dinan", colors: { primary: "#0F1B5F", secondary: "#FFF3B0" }, reputation: 41 },
                    { id: "Bourges FC", name: "Bourges", city: "Bourges", colors: { primary: "#FFFFFF", secondary: "#E30613" }, reputation: 47 },
                    { id: "FR Haguenau", name: "Haguenau", city: "Haguenau", colors: { primary: "#005BAC", secondary: "#E30613" }, reputation: 45 },
                    { id: "Entente Feignies Aulnoye", name: "Feignies", city: "Feignies", colors: { primary: "#005BAC", secondary: "#009640" }, reputation: 44 },
                    { id: "AS Furiani-Agliani", name: "Bastia White", city: "Bastia", colors: { primary: "#FFFFFF", secondary: "#FCD200" }, reputation: 43 },
                    { id: "Saint-Pryvé Saint-Hilaire", name: "Saint-Pryvé-Saint-Mesmin", city: "Saint-Pryvé-Saint-Mesmin", colors: { primary: "#FFFFFF", secondary: "#005BAC" }, reputation: 42 },
                    { id: "FC Dieppe", name: "Dieppe", city: "Saint-Aubin-sur-Scie", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "FC Borgo", name: "Borgo", city: "Borgo", colors: { primary: "#000000", secondary: "#E30613" }, reputation: 38 },
                    { id: "Nîmes Olympique", name: "Nîmes", city: "Nîmes", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "US Lusitanos", name: "Lusitanos", city: "Saint-Maur", colors: { primary: "#009640", secondary: "#E30613" }, reputation: 46 },
                    { id: "GFA Rumilly Vallières", name: "Rumilly", city: "Rumilly", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Hyères 83 FC", name: "Hyères", city: "Hyères", colors: { primary: "#D4AF37", secondary: "#241033" }, reputation: 43 },
                    { id: "Andrézieux-Bouthéon FC", name: "Andrézieux-Bouthéon", city: "Andrézieux-Bouthéon", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 41 },
                    { id: "Istres FC", name: "Fos-sur-Mer", city: "Fos-sur-Mer", colors: { primary: "#6A1B9A", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "US Créteil", name: "Créteil", city: "Créteil", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 39 },
                    { id: "US Avranches", name: "Avranches", city: "Avranches", colors: { primary: "#005BAC", secondary: "#FFFFFF" }, reputation: 38 },
                    { id: "FC Chauray", name: "Chauray", city: "Chauray", colors: { primary: "#6A1B9A", secondary: "#005BAC" }, reputation: 38 }
                ]
            },
            {
                id: "Ligue5",
                name: "French Fifth Division",
                tier: 5,
                clubs: [
                    { id: "St. Colomban Locminé", name: "Locminé", city: "Locminé", colors: { primary: "#E30613", secondary: "#009640" }, reputation: 38 },
                    { id: "FC Montlouis", name: "Montlouis", city: "Montlouis", colors: { primary: "#000000", secondary: "#FCD200" }, reputation: 37},
                    { id: "Voltigeurs de Châteaubriant", name: "Châteaubriant", city: "Châteaubriant", colors: { primary: "#000000", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "US Granville", name: "Granville", city: "Granville", colors: { primary: "#6AADE4", secondary: "#0F1B5F" }, reputation: 35 },
                    { id: "Olympique Saumur", name: "Saumur", city: "Saumur", colors: { primary: "#E30613", secondary: "#005BAC" }, reputation: 35 },
                    { id: "Stade Poitevin FC", name: "Poitevin", city: "Poitevin", colors: { primary: "#000000", secondary: "#F2ECDE" }, reputation: 34 },
                    { id: "SAS Épinal", name: "Épinal", city: "Épinal", colors: { primary: "#005BAC", secondary: "#D4AF37" }, reputation: 31 },
                    { id: "ASC Biesheim", name: "Biesheim", city: "Biesheim", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "SR Colmar", name: "Colmar", city: "Colmar", colors: { primary: "#009640", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "AS Beauvais", name: "Beauvais", city: "Beauvais", colors: { primary: "#E30613", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "Wasquehal FC", name: "Lille Gold", city: "Lille", colors: { primary: "#C9A227", secondary: "#000000" }, reputation: 31 },
                    { id: "FC Chambly", name: "Chambly", city: "Chambly", colors: { primary: "#000000", secondary: "#005BAC" }, reputation: 30 },
                    { id: "US Chantilly", name: "Chantilly", city: "Chantilly", colors: { primary: "#00593C", secondary: "#8E1F2F" }, reputation: 29 },
                    { id: "Blois Foot", name: "Blois", city: "Blois", colors: { primary: "#E30613", secondary: "#FCD200" }, reputation: 28 },
                    { id: "GOAL FC", name: "Lyon Gold", city: "Lyon", colors: { primary: "#D4AF37", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "RC Grasse", name: "Grasse", city: "Grasse", colors: { primary: "#0F1B5F", secondary: "#E30613" }, reputation: 33 },
                    { id: "Fréjus-St-Raphaël", name: "Fréjus-St-Raphaël", city: "Saint-Raphaël", colors: { primary: "#6AADE4", secondary: "#E30613" }, reputation: 32 },
                    { id: "FC Limonest", name: "Limonest", city: "Limonest", colors: { primary: "#FFFFFF", secondary: "#0F1B5F" }, reputation: 31 },
                    { id: "FC 92 Bobigny", name: "Bobigny", city: "Bobigny", colors: { primary: "#000000", secondary: "#D4AF37" }, reputation: 30 },
                    { id: "SC Toulon", name: "Toulon", city: "Toulon", colors: { primary: "#005BAC", secondary: "#FCD200" }, reputation: 29 },
                    { id: "AS Saint-Priest", name: "Saint-Priest", city: "Saint-Priest", colors: { primary: "#FCD200", secondary: "#E30613" }, reputation: 28 },
                    { id: "FC Rousset SVO", name: "Rousset", city: "Rousset", colors: { primary: "#FCD200", secondary: "#8E1F2F" }, reputation: 27 },
                    { id: "FC Mulhouse", name: "Mulhouse", city: "Mulhouse", colors: { primary: "#6AADE4", secondary: "#E30613" }, reputation: 26 },
                    { id: "Thonon Évian", name: "Évian-les-Bains", city: "Évian-les-Bains", colors: { primary: "#0F1B5F", secondary: "#FFFFFF" }, reputation: 25 }
                ]
            }
        ]
    },
    "Portugal": {
        country: "Portugal",
        tiers: [
            {
                id: "LigaPortugal",
                name: "Portuguese First Division",
                tier: 1,
                clubs: [
                    { id: "porto", name: "Porto", city: "Porto", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 80 },
                    { id: "sporting", name: "Lisbon Green", city: "Lisbon", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 82 },
                    { id: "benfica", name: "Lisbon Red", city: "Lisbon", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 82 },
                    { id: "sc braga", name: "Braga", city: "Braga", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "famalicão", name: "Famalicão", city: "Vila Nova de Famalicão", colors: { primary: "#D4AF37", secondary: "#12245C" }, reputation: 74 },
                    { id: "gil vicente", name: "Barcelos", city: "Barcelos", colors: { primary: "#1E4FCB", secondary: "#F1636B" }, reputation: 74 },
                    { id: "moreirense FC", name: "Moreira de Cónegos", city: "Moreira de Cónegos", colors: { primary: "#1E9E4A", secondary: "#D4AF37" }, reputation: 72 },
                    { id: "fc arouca", name: "Arouca", city: "Arouca", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 71 },
                    { id: "V. Guimarães", name: "Guimarães", city: "Guimarães", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 73 },
                    { id: "Estoril", name: "Estoril", city: "Estoril", colors: { primary: "#1E4FCB", secondary: "#F5D310" }, reputation: 71 },
                    { id: "fc alverca", name: "Alverca", city: "Alverca do Ribatejo", colors: { primary: "#1E4FCB", secondary: "#D01317" }, reputation: 70 },
                    { id: "rio ave", name: "Vila do Conde", city: "Vila do Conde", colors: { primary: "#F07A17", secondary: "#111111" }, reputation: 70 },
                    { id: "cd santa clara", name: "Ponta Delgada", city: "Ponta Delgada", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 68 },
                    { id: "cd nacional", name: "Funchal Orange", city: "Funchal", colors: { primary: "#F07A17", secondary: "#7A3CA6" }, reputation: 68 },
                    { id: "estrela amadora", name: "Amadora", city: "Amadora", colors: { primary: "#D01317", secondary: "#1E9E4A" }, reputation: 65 },
                    { id: "casa pia", name: "Lisbon Black", city: "Lisbon", colors: { primary: "#111111", secondary: "#D01317" }, reputation: 64 },
                    { id: "cs marítimo", name: "Funchal Green", city: "Funchal", colors: { primary: "#1E9E4A", secondary: "#D01317" }, reputation: 64 },
                    { id: "viseu", name: "Viseu", city: "Viseu", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 63 }
                ]
            },
            {
                id: "LigaPortugal2",
                name: "Portuguese Second Division",
                tier: 2,
                clubs: [
                    { id: "cd tondela", name: "Tondela", city: "Tondela", colors: { primary: "#1E9E4A", secondary: "#F5D310" }, reputation: 63 },
                    { id: "afs", name: "AFS", city: "Vila das Aves", colors: { primary: "#6E1327", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "torreense", name: "Torreense", city: "Torres Vedras", colors: { primary: "#8E1414", secondary: "#12245C" }, reputation: 61 },
                    { id: "vizela", name: "Vizela", city: "Vizela", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "Porto U21", name: "Porto II", city: "Porto", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 57 },
                    { id: "leiria", name: "Leiria", city: "Leiria", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 59 },
                    { id: "leixões", name: "Leixões", city: "Matosinhos", colors: { primary: "#6B4423", secondary: "#D01317" }, reputation: 55 },
                    { id: "feirense", name: "Santa Maria da Feira White", city: "Santa Maria da Feira", colors: { primary: "#FFFFFF", secondary: "#2038A8" }, reputation: 59 },
                    { id: "chaves", name: "Chaves", city: "Chaves", colors: { primary: "#1E4FCB", secondary: "#1E9E4A" }, reputation: 58 },
                    { id: "Benfica U21", name: "Lisbon Red II", city: "Lisbon", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 56 },
                    { id: "felgueiras", name: "Felgueiras", city: "Felgueiras", colors: { primary: "#1E4FCB", secondary: "#D01317" }, reputation: 53 },
                    { id: "lusitânia lourosa", name: "Lourosa", city: "Lourosa", colors: { primary: "#111111", secondary: "#F5D310" }, reputation: 55 },
                    { id: "Sporting U21", name: "Lisbon Green II", city: "Lisbon", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "penafiel", name: "Penafiel", city: "Penafiel", colors: { primary: "#E4181C", secondary: "#B8860B" }, reputation: 54 },                    
                    { id: "portimonense", name: "Portimonense", city: "Portimão", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "farense", name: "Farense", city: "Faro", colors: { primary: "#FFFFFF", secondary: "#111111" }, reputation: 54 },
                    { id: "amarante", name: "Amarante", city: "Amarante", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "académica coimbra", name: "Coimbra", city: "Coimbra", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 50 }
                ]
            },
	    {
                id: "Liga3",
                name: "Portuguese Third Division",
                tier: 3,
                clubs: [
                    { id: "ad fafe", name: "Fafe", city: "Fafe", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 41 },
                    { id: "Paços de Ferreira", name: "Paços de Ferreira", city: "Paços de Ferreira", colors: { primary: "#1E9E4A", secondary: "#D01317" }, reputation: 50 },
                    { id: "oliveirense", name: "Oliveirense", city: "Oliveira de Azeméis", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "os belenenses", name: "Lisbon White", city: "Lisbon", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 50 },
                    { id: "vitória guimarães U21", name: "Guimarães II", city: "Guimarães", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "mafra", name: "Mafra Green", city: "Mafra", colors: { primary: "#1E9E4A", secondary: "#F5D310" }, reputation: 46 },
                    { id: "varzim", name: "Varzim", city: "Póvoa de Varzim", colors: { primary: "#D01317", secondary: "#F5D310" }, reputation: 46 },
                    { id: "ud Santarém", name: "Santarém", city: "Santarém", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "trofense", name: "Trofense", city: "Trofa", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "São João de Ver", name: "Santa Maria da Feira White & Red", city: "Santa Maria da Feira", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 43 },
                    { id: "Atlético CP", name: "Lisbon Yellow", city: "Lisbon", colors: { primary: "#F5D310", secondary: "#D01317" }, reputation: 44 },
                    { id: "Lusitano Évora", name: "Évora Red", city: "Évora", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 42 },
                    { id: "Paredes", name: "Paredes White", city: "Paredes", colors: { primary: "#FFFFFF", secondary: "#1E4FCB" }, reputation: 42 },
                    { id: "caldas", name: "Caldas da Rainha Red", city: "Caldas da Rainha", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "marco 09", name: "Caldas da Rainha White", city: "Caldas da Rainha", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 39 },
                    { id: "sc covilhã", name: "Covilhã", city: "Covilhã", colors: { primary: "#1E9E4A", secondary: "#F5D310" }, reputation: 38 },
                    { id: "leça fc", name: "Leça da Palmeira", city: "Leça da Palmeira", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "vianense", name: "Vianense", city: "Viana do Castelo", colors: { primary: "#8E1414", secondary: "#F5D310" }, reputation: 37 },
                    { id: "louletano", name: "Loulé", city: "Loulé", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 37 },
                    { id: "vitória sernache", name: "Cernache do Bonjardim", city: "Cernache do Bonjardim", colors: { primary: "#F5D310", secondary: "#D01317" }, reputation: 36 }
                ]
            },
            {
                id: "Liga4",
                name: "Portuguese Fourth Division",
                tier: 4,
                clubs: [
                    { id: "CF Marialvas", name: "Marialvas", city: "Cantanhede", colors: { primary: "#D01317", secondary: "#F5D310" }, reputation: 22 },
                    { id: "gd bragança", name: "Bragança", city: "Bragança", colors: { primary: "#C9A400", secondary: "#1E4FCB" }, reputation: 36 },
                    { id: "Rebordosa", name: "Paredes Purple", city: "Paredes", colors: { primary: "#7A3CA6", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "AD Sanjoanense", name: "Sanjoanense", city: "São João da Madeira", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "1º Dezembro", name: "Sintra White", city: "Sintra", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 33 },
                    { id: "amora fc", name: "Amora", city: "Amora", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 33 },
                    { id: "oliveira do hospital", name: "Oliveira do Hospital", city: "Oliveira do Hospital", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 32 },
                    { id: "ac malveira", name: "Mafra Blue", city: "Mafra", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "brito sc", name: "Brito", city: "Brito", colors: { primary: "#FFFFFF", secondary: "#8A8F98" }, reputation: 31 },
                    { id: "ad limianos", name: "Limianos", city: "Ponte de Lima", colors: { primary: "#F5D310", secondary: "#7A3CA6" }, reputation: 30 },
                    { id: "tirsense", name: "Tirsense", city: "Santo Tirso", colors: { primary: "#D4AF37", secondary: "#111111" }, reputation: 29 },
                    { id: "ad camacha", name: "Camacha", city: "Santa Cruz", colors: { primary: "#5FA8E0", secondary: "#FFFFFF" }, reputation: 29 },
                    { id: "ad machico", name: "Machico", city: "Machico", colors: { primary: "#FFFFFF", secondary: "#57B5E8" }, reputation: 28 },
                    { id: "cinfães", name: "Cinfães", city: "Cinfães", colors: { primary: "#6A2C91", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "sc Beira-Mar", name: "Beira-Mar", city: "Aveiro", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 27 },
                    { id: "fc Alpendorada", name: "Alpendorada", city: "Alpendorada", colors: { primary: "#6A2C91", secondary: "#FFFFFF" }, reputation: 27 },
                    { id: "Naval 1893", name: "Naval", city: "Figueira da Foz", colors: { primary: "#FFFFFF", secondary: "#1E9E4A" }, reputation: 26 },
                    { id: "ud Serra", name: "Serra", city: "Santa Catarina da Serra", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 25 },
                    { id: "Mortágua fc", name: "Mortágua", city: "Mortágua", colors: { primary: "#1E4FCB", secondary: "#F5D310" }, reputation: 24 },
                    { id: "Juventude sc", name: "Évora Blue", city: "Évora", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 24 },
                    { id: "gd Alcochetense", name: "Alcochete", city: "Alcochete", colors: { primary: "#14532D", secondary: "#FFFFFF" }, reputation: 23 },
                    { id: "su Sintrense", name: "Sintra Yellow", city: "Sintra", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 22 },
                    { id: "O Elvas", name: "Elvas", city: "Elvas", colors: { primary: "#1E4FCB", secondary: "#F5D310" }, reputation: 22 },
                    { id: "cd Fátima", name: "Fátima", city: "Fátima", colors: { primary: "#7A1F3D", secondary: "#FFFFFF" }, reputation: 21 }
                ]
            }
        ]
    },
    "Belgium": {
        country: "Belgium",
        tiers: [
            {
                id: "JupilerProLeague",
                name: "Belgian First Division",
                tier: 1,
                clubs: [
                    { id: "club brugge", name: "Bruges Blue", city: "Bruges", colors: { primary: "#1E4FCB", secondary: "#111111" }, reputation: 81 },
                    { id: "union sg", name: "Brussels Yellow", city: "Brussels", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 80 },
                    { id: "anderlecht", name: "Brussels Purple", city: "Brussels", colors: { primary: "#6A2C91", secondary: "#FFFFFF" }, reputation: 79 },
                    { id: "genk", name: "Genk Blue", city: "Genk", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 77 },
                    { id: "gent", name: "Gent", city: "Ghent", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "antwerp", name: "Antwerp Red", city: "Antwerp", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 76 },
                    { id: "standard", name: "Liège Red", city: "Liège", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 75 },
                    { id: "sint-truiden", name: "Sint-Truiden", city: "Sint-Truiden", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 74 },
                    { id: "mechelen", name: "Mechelen", city: "Mechelen", colors: { primary: "#D01317", secondary: "#F5D310" }, reputation: 72 },
                    { id: "cercle brugge", name: "Bruges Green", city: "Bruges", colors: { primary: "#1E9E4A", secondary: "#111111" }, reputation: 71 },
                    { id: "charleroi", name: "Charleroi", city: "Charleroi", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 70 },
                    { id: "westerlo", name: "Westerlo", city: "Westerlo", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 69 },
                    { id: "oh leuven", name: "Leuven", city: "Leuven", colors: { primary: "#FFFFFF", secondary: "#1E4FCB" }, reputation: 68 },
                    { id: "zulte waregem", name: "Waregem", city: "Waregem", colors: { primary: "#D01317", secondary: "#1E9E4A" }, reputation: 67 },
                    { id: "beveren", name: "Beveren", city: "Beveren", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 66 },
                    { id: "la louvière", name: "La Louvière", city: "La Louvière", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 65 },
                    { id: "kortrijk", name: "Kortrijk", city: "Kortrijk", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 64 },
                    { id: "lommel", name: "Lommel", city: "Lommel", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 63 }
                ]
            },
            {
                id: "ChallengerProLeague",
                name: "Belgian Second Division",
                tier: 2,
                clubs: [
                    { id: "beerschot", name: "Antwerp Purple", city: "Antwerp", colors: { primary: "#6A2C91", secondary: "#FFFFFF" }, reputation: 63 },
                    { id: "dender", name: "Denderleeuw", city: "Denderleeuw", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 62 },
                    { id: "rfc liège", name: "Liège Red & Blue", city: "Liège", colors: { primary: "#D01317", secondary: "#1E4FCB" }, reputation: 61 },
                    { id: "eupen", name: "Eupen", city: "Eupen", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 60 },
                    { id: "patro eisden", name: "Maasmechelen", city: "Maasmechelen", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 59 },
                    { id: "lokeren", name: "Lokeren", city: "Lokeren", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 58 },
                    { id: "seraing", name: "Seraing", city: "Seraing", colors: { primary: "#D01317", secondary: "#111111" }, reputation: 57 },
                    { id: "lierse", name: "Lier", city: "Lier", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 56 },
                    { id: "virton", name: "Virton", city: "Virton", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 54 },
                    { id: "francs borains", name: "Boussu", city: "Boussu", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 55 },
                    { id: "roeselare", name: "Roeselare", city: "Roeselare", colors: { primary: "#FFFFFF", secondary: "#D01317" }, reputation: 51 },
                    { id: "Gent U21", name: "Gent II", city: "Ghent", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 54 },
                    { id: "Anderlecht U21", name: "Brussels Purple II", city: "Brussels", colors: { primary: "#6A2C91", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "Genk U21", name: "Genk Blue II", city: "Genk", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 53 },
                    { id: "hasselt", name: "Hasselt", city: "Hasselt", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 52 },
                    { id: "Club Brugge U21", name: "Bruges Blue II", city: "Bruges", colors: { primary: "#1E4FCB", secondary: "#111111" }, reputation: 53 },
                    { id: "mons", name: "Mons Red", city: "Mons", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 51 },
                    { id: "knokke", name: "Knokke-Heist", city: "Knokke-Heist", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 50 }
                ]
            },
            {
                id: "BelgianDivision1",
                name: "Belgian Third Division",
                tier: 3,
                clubs: [
                    { id: "tubize-braine", name: "Tubize", city: "Tubize", colors: { primary: "#D01317", secondary: "#D4AF37" }, reputation: 50 },
                    { id: "belisia", name: "Bilzen", city: "Bilzen", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 50 },
                    { id: "hoogstraten", name: "Hoogstraten", city: "Hoogstraten", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 49 },
                    { id: "thes sport", name: "Tessenderlo", city: "Tessenderlo", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 47 },
                    { id: "meux", name: "Meux", city: "La Bruyère", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 48 },
                    { id: "lyra-lierse", name: "Berlaar", city: "Berlaar", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 46 },
                    { id: "habay-la-neuve", name: "Habay", city: "Habay-la-Neuve", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 45 },
                    { id: "dessel", name: "Dessel", city: "Dessel", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 44 },
                    { id: "Charleroi U21", name: "Charleroi II", city: "Charleroi", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 41 },
                    { id: "rochefort", name: "Rochefort", city: "Rochefort", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 43 },
                    { id: "tienen", name: "Tienen", city: "Tienen", colors: { primary: "#F5D310", secondary: "#111111" }, reputation: 40 },
                    { id: "Union SG U21", name: "Brussels Yellow II", city: "Brussels", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 42 },
                    { id: "Cercle Brugge U21", name: "Bruges Green II", city: "Bruges", colors: { primary: "#1E9E4A", secondary: "#111111" }, reputation: 41 },
                    { id: "Standard U21", name: "Liège Red II", city: "Liège", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "merelbeke", name: "Merelbeke", city: "Merelbeke", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 40 },
                    { id: "zelzate", name: "Zelzate", city: "Zelzate", colors: { primary: "#1E4FCB", secondary: "#F5D310" }, reputation: 39 },
                    { id: "OH Leuven U21", name: "Leuven II", city: "Leuven", colors: { primary: "#FFFFFF", secondary: "#1E4FCB" }, reputation: 37 },
                    { id: "harelbeke", name: "Harelbeke", city: "Harelbeke", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 35 },
                    { id: "heist", name: "Heist", city: "Heist-op-den-Berg", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "mandel united", name: "Izegem", city: "Izegem", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 36 },
                ]
            },
            {
                id: "BelgianDivision2",
                name: "Belgian Fourth Division",
                tier: 4,
                clubs: [
		            { id: "stockay", name: "Saint-Georges-sur-Meuse", city: "Saint-Georges-sur-Meuse", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 36 },
		            { id: "union namur", name: "Namur", city: "Namur", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 35 },
		            { id: "crossing schaerbeek", name: "Schaerbeek", city: "Schaerbeek", colors: { primary: "#111111", secondary: "#1E9E4A" }, reputation: 36 },
                    { id: "onhaye", name: "Onhaye", city: "Onhaye", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 37 },
                    { id: "houtvenne", name: "Houtvenne", city: "Hulshout", colors: { primary: "#1E9E4A", secondary: "#8E1414" }, reputation: 36 },
                    { id: "diksmuide-oostende", name: "Diksmuide", city: "Diksmuide", colors: { primary: "#F5D310", secondary: "#D01317" }, reputation: 34 },
                    { id: "diegem", name: "Machelen", city: "Machelen", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 34 },
                    { id: "flénu", name: "Mons Blue", city: "Mons", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 36 },
                    { id: "londerzeel", name: "Londerzeel", city: "Londerzeel", colors: { primary: "#D01317", secondary: "#1E4FCB" }, reputation: 32 },
                    { id: "ninove", name: "Ninove", city: "Ninove", colors: { primary: "#D01317", secondary: "#111111" }, reputation: 32 },
                    { id: "Antwerp U21", name: "Antwerp Red II", city: "Antwerp", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "cappellen", name: "Kapellen", city: "Kapellen", colors: { primary: "#D01317", secondary: "#F5D310" }, reputation: 22 },
                    { id: "verviers", name: "Verviers", city: "Verviers", colors: { primary: "#111111", secondary: "#FFFFFF" }, reputation: 30 },
                    { id: "termien", name: "Genk Blue & Yellow", city: "Genk", colors: { primary: "#1E4FCB", secondary: "#F5D310" }, reputation: 30 },
                    { id: "rupel boom", name: "Boom", city: "Boom", colors: { primary: "#1E4FCB", secondary: "#FFFFFF" }, reputation: 31 },
                    { id: "braine", name: "Brainois", city: "Braine-le-Comte", colors: { primary: "#1E4FCB", secondary: "#F5D310" }, reputation: 29 },
                    { id: "lebbeke", name: "Lebbeke", city: "Lebbeke", colors: { primary: "#F5D310", secondary: "#1E4FCB" }, reputation: 25 },
                    { id: "union hutoise", name: "Huy", city: "Huy", colors: { primary: "#F5D310", secondary: "#D01317" }, reputation: 27 },
                    { id: "wetteren", name: "Wetteren", city: "Wetteren", colors: { primary: "#1E9E4A", secondary: "#D01317" }, reputation: 26 },
                    { id: "petegem", name: "Petegem", city: "Petegem-aan-de-Leie", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 25 },
                    { id: "bocholt", name: "Bocholt White", city: "Bocholt", colors: { primary: "#FFFFFF", secondary: "#111111" }, reputation: 23 },
                    { id: "oostkamp", name: "Oostkamp", city: "Oostkamp", colors: { primary: "#D01317", secondary: "#FFFFFF" }, reputation: 22 },
                    { id: "ostiches-ath", name: "Ath", city: "Ath", colors: { primary: "#1E9E4A", secondary: "#D01317" }, reputation: 21 },
                    { id: "torhout", name: "Torhout", city: "Torhout", colors: { primary: "#1E9E4A", secondary: "#FFFFFF" }, reputation: 21 }
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
// ---- Regions (Portugal) ----
const REGIONS_PT = [
    { id: 'Noroeste', name: "Noroeste", blurb: "Viana do Castelo & Braga" },
    { id: 'Norte', name: "Norte", blurb: "Porto, Vila Real & Bragança" },
    { id: 'Centro', name: "Centro", blurb: 'Central Portugal' },
    { id: 'Lisbon', name: 'Lisbon', blurb: "Lisbon region" },
    { id: 'Sul', name: 'Sul', blurb: 'Alentejo and Algarve' },
    { id: 'Ilhas', name: 'Ilhas', blurb: 'Madeira and Açores' }
];
// ---- Regions (France) ----
const REGIONS_BE = [
    { id: 'N-W Belgium', name: "Noordwest-België", blurb: "West and East Flanders" },
    { id: 'Noord België', name: "Noord-België", blurb: 'Antwerp province' },
    { id: 'N-E Belgium', name: "Noordoost-België", blurb: 'Flemish Brabant and Limburg' },
    { id: 'brussels', name: 'Bruxelles', blurb: 'Brussels' },
    { id: 'S-O Belgique', name: 'Sud-Ouest de la Belgique', blurb: "Hainaut and Walloon Brabant" },
    { id: 'S-E Belgique', name: 'Sud-Est de la Belgique', blurb: 'Namur, Liège and Luxembourg' }
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
const REGIONS_BY_COUNTRY = { Netherlands: REGIONS, England: REGIONS_EN, Germany: REGIONS_DE, Spain: REGIONS_ES, Switzerland: REGIONS_CH, Italy: REGIONS_IT, Portugal: REGIONS_PT, France: REGIONS_FR, Belgium: REGIONS_BE };
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
    "Bastia":"Îles","Borgo":"Îles",
    // ---- Portugal ----
    // Noroeste: Viana do Castelo & Braga districts (Minho)
    "Braga":"Noroeste","Vila Nova de Famalicão":"Noroeste","Barcelos":"Noroeste","Moreira de Cónegos":"Noroeste","Guimarães":"Noroeste","Vizela":"Noroeste","Fafe":"Noroeste","Brito":"Noroeste","Viana do Castelo":"Noroeste","Ponte de Lima":"Noroeste",
    // Norte: Porto, Vila Real & Bragança districts (Grande Porto, Douro Litoral, Trás-os-Montes, Entre Douro e Vouga)
    "Porto":"Norte","Arouca":"Norte","Vila do Conde":"Norte","Vila das Aves":"Norte","Matosinhos":"Norte","Santa Maria da Feira":"Norte","Chaves":"Norte","Felgueiras":"Norte","Lourosa":"Norte","Penafiel":"Norte","Amarante":"Norte","Paços de Ferreira":"Norte","Oliveira de Azeméis":"Norte","Póvoa de Varzim":"Norte","Trofa":"Norte","Paredes":"Norte","Leça da Palmeira":"Norte","Bragança":"Norte","São João da Madeira":"Norte","Santo Tirso":"Norte","Cinfães":"Norte","Alpendorada":"Norte",
    // Centro: Beira Litoral, Beira Alta/Baixa and Leiria
    "Viseu":"Centro","Tondela":"Centro","Leiria":"Centro","Coimbra":"Centro","Caldas da Rainha":"Centro","Covilhã":"Centro","Cernache do Bonjardim":"Centro","Cantanhede":"Centro","Oliveira do Hospital":"Centro","Aveiro":"Centro","Figueira da Foz":"Centro","Santa Catarina da Serra":"Centro","Mortágua":"Centro","Fátima":"Centro",
    // Lisbon: Grande Lisboa and Vale do Tejo
    "Lisbon":"Lisbon","Estoril":"Lisbon","Alverca do Ribatejo":"Lisbon","Amadora":"Lisbon","Torres Vedras":"Lisbon","Mafra":"Lisbon","Santarém":"Lisbon","Sintra":"Lisbon",
    // Sul: Alentejo (incl. Setúbal peninsula) & Algarve
    "Évora":"Sul","Amora":"Sul","Alcochete":"Sul","Elvas":"Sul","Portimão":"Sul","Faro":"Sul","Loulé":"Sul",
    // Ilhas: Madeira and Açores
    "Ponta Delgada":"Ilhas","Funchal":"Ilhas","Santa Cruz":"Ilhas","Machico":"Ilhas",
    // ---- Belgium ----
    // N-W Belgium: West and East Flanders
    "Bruges":"N-W Belgium","Ghent":"N-W Belgium","Waregem":"N-W Belgium","Beveren":"N-W Belgium","Kortrijk":"N-W Belgium","Denderleeuw":"N-W Belgium","Lokeren":"N-W Belgium","Roeselare":"N-W Belgium","Knokke-Heist":"N-W Belgium","Merelbeke":"N-W Belgium","Zelzate":"N-W Belgium","Harelbeke":"N-W Belgium","Izegem":"N-W Belgium","Diksmuide":"N-W Belgium","Ninove":"N-W Belgium","Lebbeke":"N-W Belgium","Wetteren":"N-W Belgium","Petegem-aan-de-Leie":"N-W Belgium","Oostkamp":"N-W Belgium","Torhout":"N-W Belgium",
    // Noord-België: Antwerp province
    "Antwerp":"Noord België","Mechelen":"Noord België","Westerlo":"Noord België","Lier":"Noord België","Hoogstraten":"Noord België","Berlaar":"Noord België","Dessel":"Noord België","Heist-op-den-Berg":"Noord België","Hulshout":"Noord België","Kapellen":"Noord België","Boom":"Noord België",
    // N-E Belgium: Limburg and Flemish Brabant
    "Genk":"N-E Belgium","Sint-Truiden":"N-E Belgium","Leuven":"N-E Belgium","Lommel":"N-E Belgium","Maasmechelen":"N-E Belgium","Hasselt":"N-E Belgium","Bilzen":"N-E Belgium","Tessenderlo":"N-E Belgium","Tienen":"N-E Belgium","Machelen":"N-E Belgium","Londerzeel":"N-E Belgium","Bocholt":"N-E Belgium",
    // Brussels
    "Brussels":"brussels","Schaerbeek":"brussels",
    // S-O Belgique: Hainaut and Walloon Brabant
    "Charleroi":"S-O Belgique","La Louvière":"S-O Belgique","Mons":"S-O Belgique","Boussu":"S-O Belgique","Tubize":"S-O Belgique","Braine-le-Comte":"S-O Belgique","Ath":"S-O Belgique",
    // S-E Belgique: Namur, Liège & Luxembourg provinces
    "Liège":"S-E Belgique","Eupen":"S-E Belgique","Seraing":"S-E Belgique","La Bruyère":"S-E Belgique","Rochefort":"S-E Belgique","Saint-Georges-sur-Meuse":"S-E Belgique","Namur":"S-E Belgique","Onhaye":"S-E Belgique","Verviers":"S-E Belgique","Huy":"S-E Belgique","Virton":"S-E Belgique","Habay-la-Neuve":"S-E Belgique"
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
// Origin-time reserve test: id-based for ES/CH/PT/BE (their ids carry "B"/"U21", which the customizer
// never edits), name-based for NL/DE ("Jong X", "X II") plus a generic fallback. Used ONLY to FREEZE
// the reserve set by id in Clubs.init(), before any customization overlay can rename a club.
function _isReserveByOrigin(c){
    if (!c) return false;
    if (c.country === 'Spain' && / B$/.test(c.id)) return true;
    // Swiss reserve/U21 sides are always tagged with "U21" in the id, but not always in the name
    if (c.country === 'Switzerland') return /U21/i.test(c.id);
    // Portuguese B sides carry "U21" in the id (their name is "X B")
    if (c.country === 'Portugal') return /U21/i.test(c.id);
    // Belgian B sides carry "U21" in the id (their names vary: "RSCA Futures", "Jong Genk", "Club NXT"…)
    if (c.country === 'Belgium') return /U21/i.test(c.id);
    let base = null;
    if (/^Jong\s/i.test(c.name)) base = c.name.replace(/^Jong\s+/i, '');
    else if (/\sU21$/.test(c.name)) base = c.name.replace(/\sU21$/, '');
    else if (/\sII$/.test(c.name)) base = c.name.replace(/\sII$/, '');
    else return false;
    // only a reserve if a distinct senior club with the base name actually exists
    return Clubs.allClubs.some(o => o.id !== c.id && o.name === base);
}
// Public reserve/B-team test. Reads the frozen day-one set built in Clubs.init() so a customization
// rename (e.g. "Jong Ajax" -> anything) can never silently flip a club's B-team status — which the
// reserve caps in promotion/relegation depend on. Falls back to the origin test only when the frozen
// set is unavailable (a headless caller before init()).
function isReserveClub(idOrClub){
    const c = (typeof idOrClub === 'string') ? Clubs.getClubById(idOrClub) : idOrClub;
    if (!c) return false;
    if (Clubs._reserveIds) return Clubs._reserveIds.has(c.id);
    return _isReserveByOrigin(c);
}
// reserve<->parent lookups via the registry built in Clubs.init() - covers every naming
// convention (Jong X, X U21, X II, Spanish B teams), not just the Dutch "Jong" prefix
function reserveClubFor(seniorId){ const rid = Clubs.parentReserveId ? Clubs.parentReserveId[seniorId] : null; return rid ? Clubs.getClubById(rid) : null; }
function parentClubForReserve(reserveId){ const pid = Clubs.reserveParentId ? Clubs.reserveParentId[reserveId] : null; return pid ? Clubs.getClubById(pid) : null; }

const Clubs = {
    allClubs: [],
    
    init() {
        this.allClubs = [];
        // COMPETITIONS is a shared global mutated by name overlays; reset it to the shipped generic names
        // so a previous save's real-name import never bleeds into this game (mirrors the clean club rebuild)
        if (typeof resetCompetitionNames === 'function') resetCompetitionNames();
        // drop any created-country injections from a previous game this session, so we rebuild a clean
        // stock world before the current database's overlay (incl. its created countries) is applied
        if (typeof WorldExt !== 'undefined' && WorldExt.reset) WorldExt.reset();

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
        
        // id -> club index: getClubById is called tens of thousands of times per simulated week,
        // and a linear Array.find over ~850 clubs measured ~150x slower than a Map lookup. allClubs
        // is fixed after init (promotion/relegation only mutates a club's division, never its id, and
        // background players live in GameState.players, not here), so this index never needs rebuilding.
        this._byId = new Map(this.allClubs.map(c => [c.id, c]));

        // Freeze the day-one reserve/B-team set by id, computed from the ORIGINAL names/ids before any
        // customization overlay renames a club. isReserveClub() reads this set, so a renamed reserve
        // side keeps its B-team status (and the reserve caps that hinge on it) intact.
        this._reserveIds = new Set(this.allClubs.filter(_isReserveByOrigin).map(c => c.id));

        console.log(`✅ ${this.allClubs.length} clubs created`);
        // reserve/second teams wear their parent club's colours (for consistent emblems)
        const ES_RESERVE_PARENT = { 'Real Sociedad B': 'Real Sociedad', 'Celta Vigo B': 'Celta Vigo', 'Atletico Madrid B': 'Atletico', 'Villareal B': 'Villarreal', 'Real Madrid B': 'Real Madrid', 'Athletic Bilbao B': 'Athletic Bilbao', 'Barcelona B': 'Barcelona', 'Real Oviedo B': 'Oviedo', 'Alavés B': 'Alaves', 'Valencia B': 'Valencia' };
        const CH_RESERVE_PARENT = { 'FC Lugano U21': 'FC Lugano' };   // name doesn't follow the "X U21" pattern ("FC Lugano 2")
        // Portuguese B sides ("X B", id "... U21") -> parent club id
        const PT_RESERVE_PARENT = { 'Porto U21': 'porto', 'Benfica U21': 'benfica', 'Sporting U21': 'sporting', 'vitória guimarães U21': 'V. Guimarães' };
        // Belgian B sides ("Jong X" / "X Futures" / "Club NXT"…, id "... U21") -> parent club id
        const BE_RESERVE_PARENT = { 'Gent U21': 'gent', 'Anderlecht U21': 'anderlecht', 'Genk U21': 'genk', 'Club Brugge U21': 'club brugge', 'Charleroi U21': 'charleroi', 'Union SG U21': 'union sg', 'Cercle Brugge U21': 'cercle brugge', 'Standard U21': 'standard', 'OH Leuven U21': 'oh leuven', 'Antwerp U21': 'antwerp' };
        // this resolution doubles as the canonical reserve<->parent registry (used by
        // reserveClubFor / parentClubForReserve), so "FC Basel U21", "Bayern Munich II",
        // "Valencia Mestalla" etc. are recognised exactly like the Dutch "Jong X" sides
        this.reserveParentId = {}; this.parentReserveId = {};
        this.allClubs.forEach(c => {
            if (!isReserveClub(c.id)) return;
            let parent = null;
            if (c.country === 'Spain' && ES_RESERVE_PARENT[c.id]) parent = this.getClubById(ES_RESERVE_PARENT[c.id]);
            else if (c.country === 'Switzerland' && CH_RESERVE_PARENT[c.id]) parent = this.getClubById(CH_RESERVE_PARENT[c.id]);
            else if (c.country === 'Portugal' && PT_RESERVE_PARENT[c.id]) parent = this.getClubById(PT_RESERVE_PARENT[c.id]);
            else if (c.country === 'Belgium' && BE_RESERVE_PARENT[c.id]) parent = this.getClubById(BE_RESERVE_PARENT[c.id]);
            else { const base = c.name.replace(/^Jong\s+/i, '').replace(/\sU21$/, '').replace(/\sII$/, ''); parent = this.allClubs.find(o => o.id !== c.id && o.name === base); }
            if (parent) {
                c.colors = { primary: parent.colors.primary, secondary: parent.colors.secondary };
                this.reserveParentId[c.id] = parent.id;
                this.parentReserveId[parent.id] = c.id;
            }
        });
        this.refreshDivisionNames();   // sync cached divisionName to the (generic) competition names
        return this.allClubs;
    },

    getClubById(id) {
        return this._byId ? this._byId.get(id) : this.allClubs.find(c => c.id === id);
    },
    
    getClubsByDivision(division) {
        return this.allClubs.filter(c => c.division === division);
    },

    getClubsByRegion(regionId) {
        return this.allClubs.filter(c => c.region === regionId);
    },

    // Generic (copyright-safe) division names — the display source is compName()/COMPETITIONS; this map is
    // the fallback + the initial c.divisionName. refreshDivisionNames() re-syncs c.divisionName to compName
    // after any name overlay (database or the real-names import), so a restored real name shows everywhere.
    DIV_NAMES: { ERE: 'Dutch First Division', EED: 'Dutch Second Division', TWD: 'Dutch Third Division', DRD: 'Dutch Fourth Division', PREM: 'English First Division', CHAMP: 'English Second Division', LEAGUE1: 'English Third Division', LEAGUE2: 'English Fourth Division', Natleague: 'English Fifth Division', BUNDES: 'German First Division', '2BUNDES': 'German Second Division', '3LIGA': 'German Third Division', REGIONAL1: 'German Fourth Division', REGIONAL2: 'German Fifth Division', REGIONAL3: 'German Sixth Division', LaLiga: 'Spanish First Division', LaLiga2: 'Spanish Second Division', PrimeraSup: 'Spanish Third Division', PrimeraInf: 'Spanish Fourth Division', Segunda: 'Spanish Fifth Division', SuperLeagueCH: 'Swiss First Division', ChallengeLeague: 'Swiss Second Division', PromotionLeague: 'Swiss Third Division', '1.LigaCH': 'Swiss Fourth Division', '2.LigaCH': 'Swiss Fifth Division', SerieA: 'Italian First Division', SerieB: 'Italian Second Division', SerieC: 'Italian Third Division', SerieD: 'Italian Fourth Division', Ligue1: 'French First Division', Ligue2: 'French Second Division', Ligue3: 'French Third Division', Ligue4: 'French Fourth Division', Ligue5: 'French Fifth Division', LigaPortugal: 'Portuguese First Division', LigaPortugal2: 'Portuguese Second Division', Liga3: 'Portuguese Third Division', Liga4: 'Portuguese Fourth Division', JupilerProLeague: 'Belgian First Division', ChallengerProLeague: 'Belgian Second Division', BelgianDivision1: 'Belgian Third Division', BelgianDivision2: 'Belgian Fourth Division' },
    // Sync every club's cached divisionName to the current competition name (generic default, or the real
    // name once the real-names pack is imported). Called after Clubs.init, applyDatabase and compName import.
    refreshDivisionNames() { if (typeof compName !== 'function') return; (this.allClubs || []).forEach(c => { if (c.division) c.divisionName = compName(c.division); }); },
    DIV_TIERS: { ERE: 1, EED: 2, TWD: 3, DRD: 4, PREM: 1, CHAMP: 2, LEAGUE1: 3, LEAGUE2: 4, Natleague: 5, BUNDES: 1, '2BUNDES': 2, '3LIGA': 3, REGIONAL1: 4, REGIONAL2: 5, REGIONAL3: 6, LaLiga: 1, LaLiga2: 2, PrimeraSup: 3, PrimeraInf: 4, Segunda: 5, SuperLeagueCH: 1, ChallengeLeague: 2, PromotionLeague: 3, '1.LigaCH': 4, '2.LigaCH': 5, SerieA: 1, SerieB: 2, SerieC: 3, SerieD: 4, Ligue1: 1, Ligue2: 2, Ligue3: 3, Ligue4: 4, Ligue5: 5, LigaPortugal: 1, LigaPortugal2: 2, Liga3: 3, Liga4: 4, JupilerProLeague: 1, ChallengerProLeague: 2, BelgianDivision1: 3, BelgianDivision2: 4 },
    setDivision(clubId, divId) {
        const c = this.getClubById(clubId); if (!c) return;
        c.division = divId; c.tier = this.DIV_TIERS[divId]; c.divisionName = this.DIV_NAMES[divId];
    },
    // Apply a customization-database overlay (built in the Customize screen) on top of the freshly
    // init()'d day-one pyramid. Overlays are id-keyed and sparse — only changed fields are present.
    // Must run AFTER init() (so the frozen reserve set + parent registry already exist) and, on load,
    // BEFORE GameState._restoreClubState (so a save's drifted division/reputation still wins over the
    // db's day-one values). Every field is set to an absolute value, so re-applying the same db is a
    // no-op. `division` moves are swaps validated in the editor; sizes are re-checked at rollover.
    applyDatabase(db) {
        if (!db) return;
        // created countries (Customize Part 2): inject their leagues/clubs/regions/names into the world
        if (db.countries && typeof WorldExt !== 'undefined') Object.values(db.countries).forEach(cc => WorldExt.registerCountry(cc));
        // competition-name overrides (rename a league or cup — featured or created)
        if (db.competitions && typeof COMPETITIONS !== 'undefined') Object.entries(db.competitions).forEach(([cid, ov]) => {
            const c = COMPETITIONS[cid]; if (!c || !ov) return;
            if (ov.name) c.name = ov.name;
            if (ov.short) c.short = ov.short;
        });
        if (!db.overrides) return;
        Object.entries(db.overrides).forEach(([id, ov]) => {
            const c = this.getClubById(id); if (!c || !ov) return;
            if (ov.name) c.name = ov.name;
            if (ov.colors && ov.colors.primary) c.colors = { primary: ov.colors.primary, secondary: ov.colors.secondary || ov.colors.primary };
            if (ov.logo !== undefined) c.logo = ov.logo || null;
            if (ov.reputation != null) { const r = ov.reputation; c.reputation = r; c.baseRep = r; c.anchorRep = r; }
            if (ov.division && ov.division !== c.division) this.setDivision(id, ov.division);
        });
        // a B-team automatically shows its parent's logo (unless the db explicitly gave it its own)
        Object.entries(this.parentReserveId || {}).forEach(([parentId, reserveId]) => {
            const parent = this.getClubById(parentId), reserve = this.getClubById(reserveId);
            const rov = db.overrides[reserveId];
            if (parent && parent.logo && reserve && !(rov && rov.logo)) reserve.logo = parent.logo;
        });
        this.refreshDivisionNames();   // db competition-name overrides -> refresh cached club divisionName
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
