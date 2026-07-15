// Build-time only. Parses uefa_access_list.xlsx -> js/europe-data.js.
// Zero runtime dependencies: reads the .xlsx (a zip of XML) with node:zlib, so it runs with a
// bare `node scripts/parse-uefa-xlsx.mjs`. Re-run this whenever you edit the spreadsheet.
//
// What is DATA (read from the sheet, changes when you edit it):
//   - association ranks + names (cols A/B)
//   - club pools for ranks 10-55: name, reputation, likelihood-of-winning-the-league (col D)
//   - per-competition entry-slot rules for the pooled countries (col C on each sheet)
// What is STRUCTURE (fixed competition rules, defined below as constants, not in machine-readable
// cells): the 9 implemented countries' berth layout, the qualifying round ladder + drop-downs, and
// the match calendar. These come from the spec (docs/europe-spec.md); editing club pools never
// changes them, so re-typing them here (with the spreadsheet's own H-M columns as the reference)
// is safer than scraping free text.

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ----------------------------------------------------------------------------- zip + xlsx reader
function readZip(buf) {
  // locate End Of Central Directory
  let i = buf.length - 22;
  while (i >= 0 && buf.readUInt32LE(i) !== 0x06054b50) i--;
  if (i < 0) throw new Error('not a zip (no EOCD)');
  const count = buf.readUInt16LE(i + 10);
  let off = buf.readUInt32LE(i + 16);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtraLen = buf.readUInt16LE(lho + 28);
    const dataStart = lho + 30 + lNameLen + lExtraLen;
    const comp = buf.subarray(dataStart, dataStart + compSize);
    files[name] = method === 0 ? comp : inflateRawSync(comp);
    off += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const xmlUnescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');

function sharedStrings(xml) {
  const out = [];
  const reSi = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = reSi.exec(xml))) {
    // concatenate every <t> inside the string item (handles rich-text runs)
    let text = '';
    const reT = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let t;
    while ((t = reT.exec(m[1]))) text += t[1];
    out.push(xmlUnescape(text));
  }
  return out;
}

function colToNum(ref) { // "AB" -> number, from a cell ref like "AB12"
  const c = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function cellRowCol(ref) {
  return { row: +ref.match(/\d+/)[0], col: colToNum(ref) };
}

function sheetGrid(xml, shared) {
  // grid[row][col] = string value
  const grid = {};
  const reC = /<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
  let m;
  while ((m = reC.exec(xml))) {
    const { row, col } = cellRowCol(m[1]);
    const attrs = m[2], inner = m[3];
    const type = (attrs.match(/t="([^"]+)"/) || [])[1];
    let val = '';
    if (type === 's') {
      const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      val = v != null ? shared[+v] : '';
    } else if (type === 'inlineStr') {
      const t = (inner.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1] || '';
      val = xmlUnescape(t);
    } else {
      const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      val = v != null ? xmlUnescape(v) : '';
    }
    (grid[row] || (grid[row] = {}))[col] = val;
  }
  return grid;
}

// ----------------------------------------------------------------------------- pool parsing
// One club entry, tolerating every quirk in the sheet:
//   "Galatasaray (Rep: 81 (50%))"  "Jablonec 73 (15%))"  "Randers FC (Rep: 70 3%))"
//   "Connah's Quay Nomads (Rep: 50(24%))"  "FC Feronikeli 74 (Rep: 62 (10%))"  "AIK (Rep 72 (7%))"
function parseClubEntry(entry) {
  const pct = entry.match(/(\d{1,3})\s*%/);
  if (!pct) return null;
  const likelihood = +pct[1];
  const prefix = entry.slice(0, pct.index);
  // reputation = the LAST 2-3 digit number in [40..99] before the percentage; any earlier number is
  // part of the club name (Bohemians 1905, Manchester 62, KF Trepça '89 ...). If none, fall back to
  // the last number that appears right before the % block (covers the "Jablonec 73 (15%)" no-"Rep:" form).
  const nums = [...prefix.matchAll(/\d{2,3}/g)];
  let rep = null, repIdx = prefix.length;
  for (const nm of nums) { const v = +nm[0]; if (v >= 40 && v <= 99) { rep = v; repIdx = nm.index; } }
  if (rep == null && nums.length) { const nm = nums[nums.length - 1]; rep = +nm[0]; repIdx = nm.index; }
  let name = prefix.slice(0, repIdx).replace(/\s*\(?\s*(?:Rep:?)?\s*$/i, '').replace(/[,.\s]+$/, '').trim();
  if (!name) return null;
  return { name, rep: rep != null ? rep : 55, likelihood };
}
function parsePool(text) {
  if (!text || /no national competition/i.test(text)) return [];
  return text.split(',').map(s => s.trim()).map(parseClubEntry).filter(Boolean);
}

// One col-C string -> list of entry rules. "1st place seeded in round 5, 2nd in round 3" etc.
function parseEntryRule(text) {
  if (!text) return [];
  const out = [];
  for (const frag of text.split(',')) {
    const round = (frag.match(/round\s*(\d+)/i) || [])[1];
    if (round == null || +round === 0) continue;
    let source = null;
    if (/cup\s*winner/i.test(frag)) source = 'cup';
    else { const p = frag.match(/(\d+)\s*(?:st|nd|rd|th)/i); if (p) source = 'league:' + p[1]; }
    if (!source) continue;
    // Seeding normalisation: a fresh entrant at any round >= 2 is a SEED (drawn against a winner of
    // the previous round); round 1 is all-unseeded, paired among themselves. The col-C free text is
    // inconsistent here (e.g. UCL "2nd in round 3" omits "seeded"), but the sheet's own round tables
    // (cols H-M) mark every fresh round-2+ entrant as seeded, and the bracket only balances 9v9 /
    // 11v11 / 16v16 that way. Drop-down losers (added by the engine) are likewise seeded.
    out.push({ source, round: +round, seeded: +round >= 2 });
  }
  return out;
}

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ----------------------------------------------------------------------------- STRUCTURE (fixed)
// The nine implemented associations. `slots` is the ordered berth ladder (highest priority first);
// the cup winner is the single 'UELcup' entry. Tags:
//   U    = UCL league phase (direct)          UCLq = UCL qualifying, round 5, seeded
//   UEL  = UEL league phase (direct)          UELq = UEL qualifying, round 5, seeded
//   UELcup = UEL league phase via the domestic cup winner (the slot the overflow cascade pivots on)
//   UECL = UECL league phase (direct)
// `cupKey` is the GameState.league key holding that season's cup winner.
const IMPLEMENTED = {
  England:     { div: 'PREM',            cupKey: 'facup',        slots: ['U', 'U', 'U', 'U', 'U', 'UEL', 'UELcup', 'UECL'] },
  Spain:       { div: 'LaLiga',          cupKey: 'cdr',          slots: ['U', 'U', 'U', 'U', 'U', 'UEL', 'UELcup', 'UECL'] },
  Italy:       { div: 'SerieA',          cupKey: 'coppaitalia',  slots: ['U', 'U', 'U', 'U', 'UEL', 'UELcup', 'UECL'] },
  Germany:     { div: 'BUNDES',          cupKey: 'dfb',          slots: ['U', 'U', 'U', 'U', 'UEL', 'UELcup', 'UECL'] },
  France:      { div: 'Ligue1',          cupKey: 'coupefrance',  slots: ['U', 'U', 'U', 'UEL', 'UELcup', 'UECL'] },
  Netherlands: { div: 'ERE',             cupKey: 'beker',        slots: ['U', 'U', 'UCLq', 'UEL', 'UELcup', 'UELq', 'UECL'] },
  Portugal:    { div: 'LigaPortugal',    cupKey: 'tacaportugal', slots: ['U', 'U', 'UCLq', 'UEL', 'UELcup', 'UELq', 'UECL'] },
  Belgium:     { div: 'JupilerProLeague', cupKey: 'belgiancup',  slots: ['U', 'UCLq', 'UELcup', 'UELq', 'UECL'] },
  Switzerland: { div: 'SuperLeagueCH',   cupKey: 'schwcup',      slots: ['U', 'UCLq', 'UELcup', 'UELq', 'UECL'] },
};

// Qualifying ladder. Each round is played in `week`; winners advance (unseeded) to the next round or
// to the league phase; losers either drop into another competition's round (as seeds) or are out.
// Derived from the spreadsheet's H-M columns.
const QUALIFYING = {
  UCL: {
    rounds: [
      { round: 1, week: 1 },
      { round: 2, week: 2 },
      { round: 3, week: 3, losersTo: { comp: 'UECL', round: 2 } },  // R3 losers -> UECL Q R2 (seeded)
      { round: 4, week: 4, losersTo: { comp: 'UEL', round: 4 } },   // R4 losers -> UEL  Q R4 (seeded)
      { round: 5, week: 5, losersTo: { comp: 'UEL', phase: 'league' } }, // R5 losers -> UEL league phase
    ],
    winnersTo: 'league',
  },
  UEL: {
    rounds: [
      { round: 1, week: 2 },
      { round: 2, week: 3 },
      { round: 3, week: 4, losersTo: { comp: 'UECL', round: 3 } },  // R3 losers -> UECL Q R3 (seeded)
      { round: 4, week: 5, losersTo: { comp: 'UECL', round: 4 } },  // R4 losers -> UECL Q R4 (seeded)
      { round: 5, week: 6, losersTo: { comp: 'UECL', phase: 'league' } }, // R5 losers -> UECL league phase
    ],
    winnersTo: 'league',
  },
  UECL: {
    rounds: [
      { round: 1, week: 3 },
      { round: 2, week: 4 },
      { round: 3, week: 5 },
      { round: 4, week: 6 },
    ],
    winnersTo: 'league',
  },
};

const CALENDAR = {
  // qualifying weeks live in QUALIFYING above; both legs of a round resolve in that one week.
  // The two-legged knockout ties each resolve in the first of their two listed weeks (the game
  // resolves two-legged ties in one call, like the domestic play-offs).
  // Note: the game's competitive season runs weeks 1-47 (it is crowned at the 47->48 boundary,
  // weeks 48-52 are a dead off-season), so the final sits at week 47 rather than the spec's 48 —
  // otherwise it would be played after the season is already snapshotted.
  leaguePhase: [11, 16, 17, 19, 22, 24, 29, 31], // MD1..MD8
  knockoutPO: [34, 35],   // play-off round, two legs
  R16: [37, 38],
  QF: [41, 42],
  SF: [44, 45],
  final: 47,              // single match, neutral venue
};

const LEAGUE_PHASE = {
  size: 36, pots: 4, potSize: 9, matchesPerTeam: 8,
  maxPerAssocPerPot: 3,      // <=3 clubs from one association in any pot
  maxSameAssocOpponents: 2,  // a club faces at most 2 from any one other association
  directToR16: 8,            // 1st-8th
  playoffFrom: 9, playoffTo: 24, // 9th-24th -> knockout play-off (9-16 seeded)
};

// Liechtenstein has no club pool in the sheet but contributes a UEL cup winner. Its clubs are NOT
// virtual: FC Vaduz and USV Eschen/Mauren are real clubs in the game (they play in the Swiss league
// system) — reference them by their real ids and flag them `real` so the engine resolves them as the
// same club everywhere (name, strength, honours, click-through), not a separate European placeholder.
const MANUAL_POOLS = {
  Liechtenstein: [
    { id: 'Vaduz', name: 'FC Vaduz', rep: 62, likelihood: 82, real: true },
    { id: 'Eschen/Mauren', name: 'USV Eschen/Mauren', rep: 24, likelihood: 18, real: true },
  ],
};

// ----------------------------------------------------------------------------- main
function main() {
  const buf = readFileSync(join(ROOT, 'uefa_access_list.xlsx'));
  const files = readZip(buf);
  const shared = sharedStrings(files['xl/sharedStrings.xml'].toString('utf8'));
  // sheet order in xl/workbook.xml matches the tab order UCL, UEL, UECL
  const grids = {
    UCL: sheetGrid(files['xl/worksheets/sheet1.xml'].toString('utf8'), shared),
    UEL: sheetGrid(files['xl/worksheets/sheet2.xml'].toString('utf8'), shared),
    UECL: sheetGrid(files['xl/worksheets/sheet3.xml'].toString('utf8'), shared),
  };
  // sanity: titles in A1
  const titles = { UCL: 'Champions', UEL: 'Europa', UECL: 'Conference' };
  for (const [k, want] of Object.entries(titles)) {
    const a1 = (grids[k][1] || {})[1] || '';
    if (!a1.includes(want)) throw new Error(`sheet ${k} A1 unexpected: "${a1}"`);
  }

  // --- associations (ranks 1-55) + pools from the UCL sheet; join col-C rules across all 3 sheets.
  // Build a name->rank map and rank->rowByCompetition mapping. Rows: UCL/UEL pooled ranks 10-55 in
  // rows 22-67; UECL has an extra header row so pooled ranks 10-55 sit in rows 23-68.
  const G = grids.UCL;
  const associations = [];
  for (let rank = 1; rank <= 9; rank++) {
    const row = G[rank + 4]; // ranks 1-9 in rows 5-13
    associations.push({ rank, name: (row[2] || '').trim(), implemented: true });
  }
  const pools = {};
  for (let rank = 10; rank <= 55; rank++) {
    const uclRow = rank + 12;               // UCL/UEL: rank -> row
    const ueclRow = rank + 13;              // UECL: shifted by one
    const name = (G[uclRow][2] || '').trim();
    associations.push({ rank, name, implemented: false });
    let clubs = parsePool(G[uclRow][4] || '');
    if (!clubs.length && MANUAL_POOLS[name]) clubs = MANUAL_POOLS[name].map(c => ({ ...c }));
    const entries = {
      UCL: parseEntryRule((grids.UCL[uclRow] || {})[3] || ''),
      UEL: parseEntryRule((grids.UEL[uclRow] || {})[3] || ''),
      UECL: parseEntryRule((grids.UECL[ueclRow] || {})[3] || ''),
    };
    pools[name] = {
      rank,
      clubs: clubs.map(c => ({ id: c.id || `eu:${slug(name)}:${slug(c.name)}`, name: c.name, rep: c.rep, likelihood: c.likelihood, ...(c.real ? { real: true } : {}) })),
      entries,
    };
  }

  const data = {
    generatedFrom: 'uefa_access_list.xlsx',
    generatedAt: new Date().toISOString().slice(0, 10),
    associations,
    implemented: IMPLEMENTED,
    pools,
    qualifying: QUALIFYING,
    calendar: CALENDAR,
    leaguePhase: LEAGUE_PHASE,
  };

  const header = `// AUTO-GENERATED by scripts/parse-uefa-xlsx.mjs from uefa_access_list.xlsx on ${data.generatedAt}.
// Do not edit by hand — edit the spreadsheet (or the structural constants in the script) and re-run
//   node scripts/parse-uefa-xlsx.mjs
// See docs/europe.md for the model.
`;
  const body = `const EUROPE_DATA = ${JSON.stringify(data, null, 2)};\n` +
    `if (typeof module !== 'undefined' && module.exports) module.exports = EUROPE_DATA;\n`;
  writeFileSync(join(ROOT, 'js', 'europe-data.js'), header + body);

  // --- report ---
  const poolNames = Object.keys(pools);
  let totalClubs = 0; poolNames.forEach(n => totalClubs += pools[n].clubs.length);
  console.log(`Parsed ${associations.length} associations (9 implemented, ${poolNames.length} pooled), ${totalClubs} pooled clubs.`);
  // likelihood sanity per pool
  const bad = [];
  for (const n of poolNames) {
    const sum = pools[n].clubs.reduce((a, c) => a + c.likelihood, 0);
    if (pools[n].clubs.length && (sum < 90 || sum > 110)) bad.push(`${n}: likelihoods sum ${sum}%`);
    for (const c of pools[n].clubs) if (!c.real && (c.rep < 40 || c.rep > 99)) bad.push(`${n}: ${c.name} rep ${c.rep}`);
  }
  console.log(bad.length ? 'CHECK: ' + bad.join(' | ') : 'Likelihoods ~100% and reps in [40,99] for every pool. OK.');
  console.log('Wrote js/europe-data.js');
}
main();
