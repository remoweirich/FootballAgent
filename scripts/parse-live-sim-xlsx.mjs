// Build-time only. Parses live_sim_events_v3.xlsx -> js/live-sim-data.js.
// Zero runtime dependencies: reads the .xlsx (a zip of XML) with node:zlib, so it runs with a
// bare `node scripts/parse-live-sim-xlsx.mjs`. Re-run this whenever you edit the spreadsheet.
//
// The output is a JS file assigning one global, NOT a .json fetched at runtime: the game ships as
// a Capacitor WebView loading from file://, where fetch() of a local asset is unreliable, and
// every other data blob (js/europe-data.js) already follows this pattern. The requirement it
// actually serves — parse the workbook once at build time, never at runtime — is met either way.
//
// See docs/live-sim-events.md for what the workbook contains and why it is shaped this way.

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ----------------------------------------------------------------------------- zip + xlsx reader
function readZip(buf) {
    let i = buf.length - 22;
    while (i >= 0 && buf.readUInt32LE(i) !== 0x06054b50) i--;
    if (i < 0) throw new Error('not a zip (no EOCD)');
    const count = buf.readUInt16LE(i + 10);
    let off = buf.readUInt32LE(i + 16);
    const files = {};
    for (let n = 0; n < count; n++) {
        if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('bad central directory entry');
        const method = buf.readUInt16LE(off + 10);
        const csize = buf.readUInt32LE(off + 20);
        const nameLen = buf.readUInt16LE(off + 28), extraLen = buf.readUInt16LE(off + 30), cmtLen = buf.readUInt16LE(off + 32);
        const lho = buf.readUInt32LE(off + 42);
        const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
        const lNameLen = buf.readUInt16LE(lho + 26), lExtraLen = buf.readUInt16LE(lho + 28);
        const start = lho + 30 + lNameLen + lExtraLen;
        const raw = buf.subarray(start, start + csize);
        files[name] = method === 0 ? raw : inflateRawSync(raw);
        off += 46 + nameLen + extraLen + cmtLen;
    }
    return files;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
// The workbook is full of curly quotes / ellipses stored as numeric entities. Decode at build
// time so the runtime never has to.
const decode = s => s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTITIES[e]);

// This workbook has NO xl/sharedStrings.xml — every string is inline (<c t="inlineStr"><is><t>).
// parse-uefa-xlsx.mjs only handles the shared-string table, hence a separate reader here.
function readSheet(xml) {
    const cells = new Map();
    for (const m of xml.matchAll(/<c r="([A-Z]+\d+)"[^>]*(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const inner = m[2] || '';
        let val = '';
        const is = inner.match(/<is>([\s\S]*?)<\/is>/);
        if (is) for (const t of is[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) val += t[1];
        else { const v = inner.match(/<v>([\s\S]*?)<\/v>/); if (v) val = v[1]; }
        val = decode(val).trim();
        if (val !== '') cells.set(m[1], val);
    }
    return cells;
}

const zip = readZip(readFileSync(join(ROOT, 'live_sim_events_v3.xlsx')));
const sheetOf = f => readSheet(zip['xl/worksheets/' + f].toString('utf8'));
const S1 = sheetOf('sheet1.xml'), S2 = sheetOf('sheet2.xml');
const at = (cells, col, row) => cells.get(col + row) || '';

// ------------------------------------------------------------------ Sheet1: position/role -> code
// Column A carries the position only on the first row of each block, so it has to be carried down.
const roleCodes = {};
let pos = null;
for (let r = 4; r <= 200; r++) {
    const a = at(S1, 'A', r), role = at(S1, 'B', r), code = at(S1, 'C', r);
    if (a) pos = a;
    if (!pos || !role || !code) continue;
    (roleCodes[pos] = roleCodes[pos] || {})[role] = code;
}

// ------------------------------------------------------------------------- Sheet2: the pieces
// Three independent column blocks, data from row 4. Row 3 is the header ("END RESULT" etc).
const BLOCKS = {
    start: { key: 'A', text: 'B', codes: 'I', weight: 'AB', tags: null },
    middle: { key: 'J', text: 'K', codes: 'R', weight: 'AC', tags: null },
    end: { key: 'S', text: 'T', codes: 'AA', weight: 'AE', tags: 'AD' },
};
// ------------------------------------------------------------------------- workbook corrections
// The whole feature rests on one rule: XY always names the piece's OWN player (S in a start piece,
// M in a middle, E in an end). Exactly one cell in the workbook breaks it. This A1 end is written
// for the case where the finisher is NOT a client — the commentary credits the creator precisely
// because the scorer has no name — but it was tagged GOAL:E; ASSIST:M, which says the opposite
// (XY = the scorer, someone else assisted). Tagged GOAL:T; ASSIST:E it means what it reads as: an
// unnamed team-mate scores, the client gets the assist. `GOAL:T; ASSIST:E` is a form the workbook
// already uses elsewhere, so this introduces nothing new.
//
// Fix the cell in the sheet and this entry can be deleted; it throws if the piece stops matching,
// so it cannot silently rot.
const TAG_FIXES = [
    { match: /cleverly created by XY/, was: 'GOAL:E; ASSIST:M', now: 'GOAL:T; ASSIST:E' },
];

const pieces = {};
for (const [name, b] of Object.entries(BLOCKS)) {
    const out = [];
    for (let r = 4; r <= 400; r++) {
        const key = at(S2, b.key, r), text = at(S2, b.text, r);
        if (!key && !text) continue;
        if (!key || !text) throw new Error(`${name} row ${r}: has ${key ? 'a key but no text' : 'text but no key'}`);
        const codes = at(S2, b.codes, r).split(',').map(s => s.trim()).filter(Boolean);
        const weight = Number(at(S2, b.weight, r));
        if (!codes.length) throw new Error(`${name} row ${r} (${key}): no role codes`);
        if (!Number.isFinite(weight) || weight <= 0) throw new Error(`${name} row ${r} (${key}): bad weight`);
        const p = { k: key, t: text, c: codes, w: weight };
        let tags = b.tags ? at(S2, b.tags, r) : '';
        for (const f of TAG_FIXES) {
            if (!f.match.test(text)) continue;
            if (tags !== f.was) throw new Error(`${name} row ${r} (${key}): tag fix expected "${f.was}" but found "${tags}" — the sheet changed, re-check TAG_FIXES`);
            tags = f.now; f.applied = true;
        }
        if (tags) p.r = tags;
        out.push(p);
    }
    pieces[name] = out;
}

// ------------------------------------------------------------------------------- validation
const unapplied = TAG_FIXES.filter(f => !f.applied);
if (unapplied.length) throw new Error('TAG_FIXES no longer match any piece (sheet fixed? delete them): ' + unapplied.map(f => f.match).join(', '));

// Fail the build rather than ship a workbook edit that silently starves a role of events.
const allCodes = new Set(Object.values(roleCodes).flatMap(m => Object.values(m)));
const bad = [];
for (const [block, list] of Object.entries(pieces))
    for (const p of list) for (const c of p.c) if (!allCodes.has(c)) bad.push(`${block} ${p.k}: unknown role code "${c}"`);
if (bad.length) throw new Error('Sheet2 references role codes absent from Sheet1:\n  ' + bad.join('\n  '));

// key grammar: "A" (base, fits any branch), "A3" (branch 3), "A1/A3" (either)
const parseKey = k => k.split('/').map(s => s.trim()).map(s => {
    const m = s.match(/^([A-Z]+)(\d*)$/);
    if (!m) throw new Error(`unparseable key "${k}"`);
    return { fam: m[1], br: m[2] ? +m[2] : null };
});
const linkable = (a, b) => parseKey(a).some(x => parseKey(b).some(y => x.fam === y.fam && (x.br === null || y.br === null || x.br === y.br)));

// every role must be able to assemble at least one chain in which EVERY piece lists it
const starved = [];
for (const code of allCodes) {
    const ok = pieces.start.some(s => s.c.includes(code) &&
        pieces.middle.some(m => m.c.includes(code) && linkable(s.k, m.k) &&
            pieces.end.some(e => e.c.includes(code) && linkable(m.k, e.k))));
    if (!ok) starved.push(code);
}
if (starved.length) throw new Error('roles with no fully-eligible chain: ' + starved.join(', '));

const counts = Object.entries(pieces).map(([k, v]) => `${k}=${v.length}`).join(' ');
const banner = `// GENERATED by scripts/parse-live-sim-xlsx.mjs from live_sim_events_v3.xlsx — do not edit by hand.
// Re-run the script after editing the workbook. See docs/live-sim-events.md.
// Pieces: ${counts}. Roles: ${allCodes.size}.
// Shape: pieces.{start,middle,end}[] of { k: key, t: text, c: [roleCode], w: weight, r?: "TAG:REF; ..." }`;

writeFileSync(join(ROOT, 'js', 'live-sim-data.js'),
    `${banner}\nconst LIVE_SIM_DATA = ${JSON.stringify({ roleCodes, pieces })};\n`);

console.log(`js/live-sim-data.js written — ${counts}, ${allCodes.size} roles`);
