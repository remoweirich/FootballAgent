# -*- coding: utf-8 -*-
# Build js/nations.js from national_team_reputations.xlsx (sheet "National Teams").
#   python scripts/import-nations-xlsx.py
# Edit the workbook (std reputations, var modifiers), then re-run this. Ids of nations that already
# existed are kept (saves store them); new nations get a slug id. Non-FIFA members and display
# spellings that differ from the workbook are set below.
import io, os, re, sys, unicodedata
import openpyxl

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
XLSX = os.path.join(ROOT, 'national_team_reputations.xlsx')
OUT = os.path.join(ROOT, 'js', 'nations.js')

# ids already in saves (js/nations.js before this importer), by display name
KEEP_IDS = {
    'France': 'fra', 'Spain': 'esp', 'England': 'eng', 'Portugal': 'por', 'Germany': 'ger', 'Netherlands': 'ned', 'Italy': 'ita',
    'Belgium': 'bel', 'Croatia': 'cro', 'Switzerland': 'sui', 'Denmark': 'den', 'Austria': 'aut', 'Norway': 'nor', 'Türkiye': 'tur',
    'Ukraine': 'ukr', 'Serbia': 'srb', 'Poland': 'pol', 'Sweden': 'swe', 'Scotland': 'sco', 'Czechia': 'cze', 'Hungary': 'hun',
    'Slovakia': 'svk', 'Greece': 'gre', 'Romania': 'rou', 'Georgia': 'geo', 'Slovenia': 'svn', 'Wales': 'wal', 'Republic of Ireland': 'irl',
    'Albania': 'alb', 'Israel': 'isr', 'Bosnia and Herzegovina': 'bih', 'Iceland': 'isl', 'Finland': 'fin', 'Northern Ireland': 'nir',
    'North Macedonia': 'mkd', 'Kosovo': 'kos', 'Montenegro': 'mne', 'Bulgaria': 'bul', 'Belarus': 'blr', 'Kazakhstan': 'kaz',
    'Luxembourg': 'lux', 'Armenia': 'arm', 'Azerbaijan': 'aze', 'Cyprus': 'cyp', 'Faroe Islands': 'fro', 'Estonia': 'est', 'Latvia': 'lva',
    'Lithuania': 'ltu', 'Moldova': 'mda', 'Malta': 'mlt', 'Andorra': 'and', 'Liechtenstein': 'lie', 'Gibraltar': 'gib', 'San Marino': 'smr',
    'Argentina': 'arg', 'Brazil': 'bra', 'Uruguay': 'uru', 'Colombia': 'col', 'Ecuador': 'ecu', 'Paraguay': 'par', 'Peru': 'per',
    'Chile': 'chi', 'Venezuela': 'ven', 'Bolivia': 'bol', 'Japan': 'jpn', 'South Korea': 'kor', 'Iran': 'irn', 'Australia': 'aus',
    'Saudi Arabia': 'ksa', 'Uzbekistan': 'uzb', 'Qatar': 'qat', 'Iraq': 'irq', 'Jordan': 'jor', 'United Arab Emirates': 'uae',
    'Oman': 'oma', 'China': 'chn', 'Bahrain': 'bhr', 'Syria': 'syr', 'Palestine': 'ple', 'Indonesia': 'idn', 'Morocco': 'mar',
    'Senegal': 'sen', "Côte d'Ivoire": 'civ', 'Egypt': 'egy', 'Nigeria': 'nga', 'Algeria': 'alg', 'Cameroon': 'cmr', 'Tunisia': 'tun',
    'Mali': 'mli', 'Ghana': 'gha', 'DR Congo': 'cod', 'South Africa': 'rsa', 'Burkina Faso': 'bfa', 'Cape Verde': 'cpv', 'Guinea': 'gui',
    'Gabon': 'gab', 'Angola': 'ang', 'Zambia': 'zam', 'Equatorial Guinea': 'eqg', 'Uganda': 'uga', 'USA': 'usa', 'Mexico': 'mex',
    'Canada': 'can', 'Panama': 'pan', 'Costa Rica': 'crc', 'Jamaica': 'jam', 'Honduras': 'hon', 'Curaçao': 'cuw', 'Haiti': 'hai',
    'El Salvador': 'slv', 'New Zealand': 'nzl', 'New Caledonia': 'ncl', 'Fiji': 'fij', 'Tahiti': 'tah',
}
# the game's own spelling (player nationalities) where the workbook differs
DISPLAY = {'United States': 'USA', 'Ivory Coast': "Côte d'Ivoire"}
# confederation members that are not FIFA members: their confederation's competitions only
NON_FIFA = [  # name, confederation, std, var, population (m)
    ('Martinique', 'CONCACAF', 57, 5, 0.35), ('Guadeloupe', 'CONCACAF', 54, 5, 0.38), ('French Guiana', 'CONCACAF', 51, 5, 0.30),
    ('Bonaire', 'CONCACAF', 38, 5, 0.025), ('Sint Maarten', 'CONCACAF', 37, 5, 0.044), ('Saint Martin', 'CONCACAF', 34, 5, 0.032),
    ('Northern Mariana Islands', 'AFC', 25, 5, 0.05),
]
SUSPENDED = {'Russia'}
# std reputations set by hand over the workbook's (edit here, or fix the workbook and drop the entry)
REP_OVERRIDES = {
    "Algeria": 76,
    "Argentina": 85,
    "Australia": 73,
    "Belgium": 81,
    "Brazil": 85,
    "Burkina Faso": 72,
    "Cameroon": 74,
    "Colombia": 81,
    "Croatia": 79,
    "Czechia": 72,
    "Côte d'Ivoire": 77,
    "England": 85,
    "Finland": 66,
    "France": 86,
    "Georgia": 68,
    "Germany": 85,
    "Ghana": 76,
    "Greece": 74,
    "Hungary": 72,
    "Italy": 84,
    "Japan": 80,
    "Mali": 74,
    "Netherlands": 84,
    "New Zealand": 66,
    "Nigeria": 77,
    "Norway": 80,
    "Portugal": 84,
    "Republic of Ireland": 69,
    "Romania": 70,
    "Senegal": 79,
    "Slovakia": 70,
    "Slovenia": 70,
    "South Africa": 73,
    "South Korea": 78,
    "Spain": 86,
    "Switzerland": 80,
    "Tahiti": 35,
    "Uruguay": 81,
    "Vanuatu": 31,
    "Wales": 69,
}
# African Nations League zones (CAF has not published them; assignment by regional union)
CAF_ZONES = {
    'NORTH': ['Morocco', 'Algeria', 'Tunisia', 'Egypt', 'Libya', 'Mauritania'],
    'WEST': ['Senegal', 'Gambia', 'Guinea', 'Guinea-Bissau', 'Sierra Leone', 'Liberia', 'Mali', 'Cape Verde', "Côte d'Ivoire", 'Ghana',
             'Burkina Faso', 'Togo', 'Benin', 'Niger', 'Nigeria', 'Chad'],
    'EAST': ['Sudan', 'South Sudan', 'Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania',
             'Comoros', 'Madagascar', 'Mauritius', 'Seychelles', 'Malawi'],
    'CS': ['Cameroon', 'Central African Republic', 'Congo', 'DR Congo', 'Equatorial Guinea', 'Gabon', 'São Tomé and Príncipe', 'Angola',
           'Botswana', 'Eswatini', 'Lesotho', 'Mozambique', 'Namibia', 'South Africa', 'Zambia', 'Zimbabwe'],
}
ZONE_OF = {n: z for z, l in CAF_ZONES.items() for n in l}   # FIFA member, suspended from UEFA and FIFA competitions

def slug(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def nationalities():
    src = io.open(os.path.join(ROOT, 'js', 'names-data.js'), encoding='utf-8').read()
    start = src.index('const NAMES_DATABASE')
    return set(re.findall(r'^\s{1,4}"([^"]+)":\s*\{', src[start:start + 400000], re.M))

def main():
    ws = openpyxl.load_workbook(XLSX, data_only=True)['National Teams']
    head = [c.value for c in ws[1]]
    col = {h: i for i, h in enumerate(head)}
    nat = nationalities()
    out, seen_ids = [], set()
    rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if r[col['Nation']]]
    for rank, r in enumerate(rows, 1):
        raw = r[col['Nation']]
        name = DISPLAY.get(raw, raw)
        var = int(r[col['Reputation (var)']])
        out.append(dict(id=KEEP_IDS.get(name) or slug(name), name=name, conf=r[col['Confederation']], rep=REP_OVERRIDES.get(name, int(r[col['Reputation (std)']])),
                        var=var, pop=r[col['Population (m)']], rank=rank, fifa=True, suspended=name in SUSPENDED,
                        nat=name if name in nat else None))
    for name, conf, std, var, pop in NON_FIFA:
        out.append(dict(id=slug(name), name=name, conf=conf, rep=std, var=var, pop=pop, rank=len(out) + 1, fifa=False,
                        suspended=False, nat=name if name in nat else None))
    for n in out:
        assert n['id'] not in seen_ids, n['id']; seen_ids.add(n['id'])
    caf = [n['name'] for n in out if n['conf'] == 'CAF']
    assert sorted(caf) == sorted(ZONE_OF), 'CAF zones: %s / %s' % (set(caf) ^ set(ZONE_OF), len(caf))
    by = {}
    for n in out: by[n['conf']] = by.get(n['conf'], 0) + 1
    assert by.get('AFC') == 47 and by.get('OFC') == 11, 'AFC / OFC members: %s' % by
    missing = [k for k in KEEP_IDS if k not in {n['name'] for n in out}]
    assert not missing, 'existing nations missing from the workbook: %s' % missing

    def js(s): return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"
    lines = []
    for c in ('UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC'):
        lines.append('    // ---- %s ----' % c)
        for n in [x for x in out if x['conf'] == c]:
            extra = ('' if n['fifa'] else ', fifaMember: false') + (', suspended: true' if n['suspended'] else '') + (", zone: '%s'" % ZONE_OF[n['name']] if n['name'] in ZONE_OF else '')
            lines.append("    { id: %s, name: %s, nationality: %s, confederation: '%s', reputation: %d, var: %d, population: %s, rank: %d%s }," % (
                js(n['id']), js(n['name']), js(n['nat']) if n['nat'] else 'null', c, n['rep'], n['var'], repr(n['pop']), n['rank'], extra))
    body = '\n'.join(lines)
    text = HEADER + 'const NATIONS_RAW = [\n' + body + '\n];\n' + FOOTER
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(text)
    by = {}
    for n in out: by[n['conf']] = by.get(n['conf'], 0) + 1
    print('wrote', OUT, len(out), 'nations', by)

HEADER = """// ============================================================
//  National teams (docs/international.md). GENERATED by scripts/import-nations-xlsx.py from
//  national_team_reputations.xlsx: edit the workbook and re-run, don't edit the list by hand.
//
//  id            stable key, never shown (saves and fixtures store it)
//  name          display name (official spelling; USA / Côte d'Ivoire as the game spells them)
//  nationality   the player-nationality string this team picks from (NAMES_DATABASE), or null
//  confederation UEFA | CONMEBOL | CONCACAF | AFC | CAF | OFC
//  reputation    the workbook's std reputation (best teams 86; clubs top out at 90)
//  var           how far the team may drift from its std over ~20 years (1-5; workbook)
//  population    millions (sets the base var)
//  rank          workbook order: breaks reputation ties (e.g. the seeding ranking)
//  fifaMember    false for members outside FIFA (CONCACAF, AFC): no World Cup or its qualifiers
//  suspended     true for Russia: in the data, but in no competition
//  zone          CAF only: African Nations League zone (NORTH 6, WEST 16, EAST 16, CS = Central & Southern 16)
//  weight        (added below) relative chance of being drawn as a host (when no host pot is set)
// ============================================================
"""
FOOTER = """
const NATION_WEIGHT_SPREAD = 5;   // bigger = flatter curve, more upsets
const NATIONS = NATIONS_RAW.map(n => Object.assign({ fifaMember: true, suspended: false }, n,
    n.confederation === 'UEFA' ? {} : { weight: Math.round(Math.exp((n.reputation - 60) / NATION_WEIGHT_SPREAD) * 100) / 100 }));
// UEFA nations that play UEFA competitions (54: Russia is suspended)
const NATIONS_UEFA = NATIONS.filter(n => n.confederation === 'UEFA' && !n.suspended);
const NATIONS_BY_ID = Object.fromEntries(NATIONS.map(n => [n.id, n]));

if (typeof window !== 'undefined') { window.NATIONS = NATIONS; window.NATIONS_BY_ID = NATIONS_BY_ID; }
"""

if __name__ == '__main__':
    main()
