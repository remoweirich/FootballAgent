// Build-time only. Parses injuries.xlsx -> js/injuries-data.js. Zero runtime dependencies (the .xlsx
// is a zip of XML, read with node:zlib). Re-run whenever the workbook is edited:
//   node scripts/parse-injuries-xlsx.mjs
// See the workbook's "Read me" sheet for the column meanings.
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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
const decode = s => s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTITIES[e]);

function readSharedStrings(xml) {
    if (!xml) return [];
    const out = [];
    for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
        let s = '';
        for (const t of si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) s += t[1];
        out.push(decode(s));
    }
    return out;
}
function readSheet(xml, shared) {
    const cells = new Map();
    for (const m of xml.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = m[2] || '', inner = m[3] || '';
        const type = (attrs.match(/\bt="([^"]+)"/) || [])[1];
        let val = '';
        if (type === 'inlineStr') {
            const is = inner.match(/<is>([\s\S]*?)<\/is>/);
            if (is) for (const t of is[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) val += t[1];
            val = decode(val);
        } else if (type === 's') {
            const v = inner.match(/<v>([\s\S]*?)<\/v>/);
            if (v) val = shared[+v[1]] || '';
        } else {
            const v = inner.match(/<v>([\s\S]*?)<\/v>/);
            if (v) val = decode(v[1]);
        }
        val = val.trim();
        if (val !== '') cells.set(m[1], val);
    }
    return cells;
}
function sheetPaths(zip) {
    const wbXml = zip['xl/workbook.xml'].toString('utf8');
    const relsXml = zip['xl/_rels/workbook.xml.rels'].toString('utf8');
    const rels = {};
    for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
        const id = (m[1].match(/\bId="([^"]+)"/) || [])[1];
        const target = (m[1].match(/\bTarget="([^"]+)"/) || [])[1];
        if (id && target) rels[id] = target.replace(/^\/?(xl\/)?/, 'xl/');
    }
    const paths = {};
    for (const m of wbXml.matchAll(/<sheet\b([^>]*)\/>/g)) {
        const name = (m[1].match(/\bname="([^"]+)"/) || [])[1];
        const rid = (m[1].match(/\br:id="([^"]+)"/) || [])[1];
        if (name && rid && rels[rid]) paths[decode(name)] = rels[rid];
    }
    return paths;
}

const zip = readZip(readFileSync(join(ROOT, 'injuries.xlsx')));
const shared = readSharedStrings(zip['xl/sharedStrings.xml'] ? zip['xl/sharedStrings.xml'].toString('utf8') : '');
const paths = sheetPaths(zip);
if (!paths['Injuries']) throw new Error(`workbook has no "Injuries" sheet (found: ${Object.keys(paths).join(', ')})`);
const cells = readSheet(zip[paths['Injuries']].toString('utf8'), shared);
const at = (col, row) => cells.get(col + row) || '';

const COLS = ['id', 'name', 'weight', 'minWeeks', 'maxWeeks', 'category'];
const problems = [];
const list = [];
const seen = new Set();
for (let r = 2, gaps = 0; r < 500 && gaps < 5; r++) {
    if (!at('A', r)) { gaps++; continue; }
    gaps = 0;
    const row = {};
    COLS.forEach((k, i) => { row[k] = at(String.fromCharCode(65 + i), r); });
    if (seen.has(row.id)) problems.push(`duplicate id "${row.id}"`);
    seen.add(row.id);
    const w = Number(row.weight), mn = Number(row.minWeeks), mx = Number(row.maxWeeks);
    if (!row.name) problems.push(`${row.id}: empty name`);
    if (!(w > 0)) problems.push(`${row.id}: weight must be > 0 (got "${row.weight}")`);
    if (!(mn >= 1)) problems.push(`${row.id}: minWeeks must be >= 1 (got "${row.minWeeks}")`);
    if (!(mx >= mn)) problems.push(`${row.id}: maxWeeks must be >= minWeeks (got "${row.maxWeeks}")`);
    list.push({ id: row.id, name: row.name, weight: w, minWeeks: mn, maxWeeks: mx, category: row.category || '' });
}
if (!list.length) problems.push('no injury rows found');
if (problems.length) {
    console.error('injuries workbook problems:');
    problems.forEach(p => console.error('  - ' + p));
    process.exit(1);
}

const out = `// GENERATED by scripts/parse-injuries-xlsx.mjs from injuries.xlsx. Do not edit by hand:
// edit the workbook, then re-run the parser. Each entry: { id, name, weight (likelihood), minWeeks, maxWeeks, category }.
const INJURIES = ${JSON.stringify(list, null, 1)};
if (typeof module !== 'undefined' && module.exports) module.exports = { INJURIES };
`;
writeFileSync(join(ROOT, 'js', 'injuries-data.js'), out);
console.log(`js/injuries-data.js written: ${list.length} injury types (total weight ${list.reduce((s, x) => s + x.weight, 0)})`);
