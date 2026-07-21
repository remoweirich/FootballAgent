// Build-time only. Parses dialogue_lines.xlsx -> js/dialogue-data.js.
// Zero runtime dependencies, same pattern as parse-live-sim-xlsx.mjs: the .xlsx (a zip of XML)
// is read with node:zlib, so a bare `node scripts/parse-dialogue-xlsx.mjs` rebuilds the data.
// Re-run this whenever the workbook is edited. The workbook is the source of truth for every
// dialogue line; see its "Read me" sheet for the column meanings.
//
// Unlike the live-sim parser this one maps sheet NAMES to files via xl/workbook.xml, because the
// user edits this workbook by hand and Excel/LibreOffice may renumber or reorder sheets on save.

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
    // non-greedy attrs so self-closing empty cells (<c r="D4" s="10"/>) don't swallow following cells
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

// sheet NAME -> worksheet xml path, via workbook.xml (r:id) + its rels
function sheetPaths(zip) {
    const wbXml = zip['xl/workbook.xml'].toString('utf8');
    const relsXml = zip['xl/_rels/workbook.xml.rels'].toString('utf8');
    // attribute order varies by writer (Excel, LibreOffice, openpyxl), so read attrs independently
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

const zip = readZip(readFileSync(join(ROOT, 'dialogue_lines.xlsx')));
const shared = readSharedStrings(zip['xl/sharedStrings.xml'] ? zip['xl/sharedStrings.xml'].toString('utf8') : '');
const paths = sheetPaths(zip);
const sheetByName = name => {
    if (!paths[name]) throw new Error(`workbook has no sheet named "${name}" (found: ${Object.keys(paths).join(', ')})`);
    return readSheet(zip[paths[name]].toString('utf8'), shared);
};
const at = (cells, col, row) => cells.get(col + row) || '';

// read a header-driven table: row 1 is headers, rows follow until `idCol` runs empty for 5 rows
function readTable(cells, cols) {
    const rows = [];
    let gaps = 0;
    for (let r = 2; r < 2000 && gaps < 5; r++) {
        const id = at(cells, 'A', r);
        if (!id) { gaps++; continue; }
        gaps = 0;
        const row = {};
        cols.forEach((key, i) => { row[key] = at(cells, String.fromCharCode(65 + i), r); });
        rows.push(row);
    }
    return rows;
}

const PERSONALITIES = ['any', 'hothead', 'professional', 'showman', 'humble', 'homebody', 'adventurer', 'loyal', 'mercenary'];
const problems = [];
const seenIds = new Set();
const checkId = (id, where) => {
    if (seenIds.has(id)) problems.push(`duplicate id ${id} (${where})`);
    seenIds.add(id);
};

// ---- Complaint
const comp = readTable(sheetByName('Complaint'), ['id', 'beat', 'dim', 'stage', 'choice', 'outcome', 'personality', 'text']);
comp.forEach(r => {
    checkId(r.id, 'Complaint');
    if (!['open', 'reply'].includes(r.beat)) problems.push(`${r.id}: bad beat "${r.beat}"`);
    if (r.beat === 'open' && !['time', 'club', 'wage', 'agent', 'any'].includes(r.dim)) problems.push(`${r.id}: bad dim "${r.dim}"`);
    if (r.beat === 'open' && !['1', '2', 'any'].includes(String(r.stage))) problems.push(`${r.id}: bad stage "${r.stage}"`);
    if (r.beat === 'reply' && !['listen', 'promise', 'pushback', 'deflect'].includes(r.choice)) problems.push(`${r.id}: bad choice "${r.choice}"`);
    if (r.beat === 'reply' && !['good', 'bad', 'any'].includes(r.outcome)) problems.push(`${r.id}: bad outcome "${r.outcome}"`);
    if (!PERSONALITIES.includes(r.personality)) problems.push(`${r.id}: bad personality "${r.personality}"`);
    if (!r.text) problems.push(`${r.id}: empty text`);
});
// every (dim x stage) needs at least one 'any' opening; every (choice x outcome) at least one 'any' reply
for (const dim of ['time', 'club', 'wage', 'agent'])
    for (const stage of ['1', '2'])
        if (!comp.some(r => r.beat === 'open' && (r.dim === dim || r.dim === 'any') && (String(r.stage) === stage || r.stage === 'any') && r.personality === 'any'))
            problems.push(`no 'any' opening line for dim=${dim} stage=${stage}`);
for (const [choice, outcome] of [['listen', 'good'], ['promise', 'good'], ['pushback', 'good'], ['pushback', 'bad'], ['deflect', 'bad']])
    if (!comp.some(r => r.beat === 'reply' && r.choice === choice && (r.outcome === outcome || r.outcome === 'any') && r.personality === 'any'))
        problems.push(`no 'any' reply line for choice=${choice} outcome=${outcome}`);

// ---- Gifts
const gifts = readTable(sheetByName('Gifts'), ['id', 'beat', 'tier', 'mood', 'choice', 'personality', 'text']);
gifts.forEach(r => {
    checkId(r.id, 'Gifts');
    if (!['react', 'close'].includes(r.beat)) problems.push(`${r.id}: bad beat "${r.beat}"`);
    if (r.beat === 'react' && !['small', 'medium', 'large', 'any'].includes(r.tier)) problems.push(`${r.id}: bad tier "${r.tier}"`);
    if (r.beat === 'react' && !['fresh', 'diminished', 'any'].includes(r.mood)) problems.push(`${r.id}: bad mood "${r.mood}"`);
    if (r.beat === 'close' && !['praise', 'modest'].includes(r.choice)) problems.push(`${r.id}: bad choice "${r.choice}"`);
    if (!PERSONALITIES.includes(r.personality)) problems.push(`${r.id}: bad personality "${r.personality}"`);
    if (!r.text) problems.push(`${r.id}: empty text`);
});
for (const tier of ['small', 'medium', 'large'])
    if (!gifts.some(r => r.beat === 'react' && (r.tier === tier || r.tier === 'any') && (r.mood === 'fresh' || r.mood === 'any') && r.personality === 'any'))
        problems.push(`no 'any' fresh react line for tier=${tier}`);
if (!gifts.some(r => r.beat === 'react' && (r.mood === 'diminished' || r.mood === 'any') && r.personality === 'any'))
    problems.push(`no 'any' diminished react line`);
for (const choice of ['praise', 'modest'])
    if (!gifts.some(r => r.beat === 'close' && r.choice === choice && r.personality === 'any'))
        problems.push(`no 'any' close line for choice=${choice}`);

// ---- Final (Phase 2: pre-match word, post-win party, post-loss consolation)
const FINAL_BEATS = ['pre-open', 'pre-reply', 'win-open', 'win-reply', 'loss-open', 'loss-reply'];
const FINAL_CHOICE = { 'pre-reply': ['calm', 'fireup', 'bonus'], 'win-reply': ['toast', 'quiet', 'tab'], 'loss-reply': ['sit', 'space', 'speech'] };
const finals = readTable(sheetByName('Final'), ['id', 'beat', 'choice', 'outcome', 'personality', 'text']);
finals.forEach(r => {
    checkId(r.id, 'Final');
    if (!FINAL_BEATS.includes(r.beat)) problems.push(`${r.id}: bad beat "${r.beat}"`);
    if (FINAL_CHOICE[r.beat] && !FINAL_CHOICE[r.beat].includes(r.choice)) problems.push(`${r.id}: bad choice "${r.choice}" for ${r.beat}`);
    if (r.beat.endsWith('-reply') && !['good', 'bad', 'any'].includes(r.outcome)) problems.push(`${r.id}: bad outcome "${r.outcome}"`);
    if (!PERSONALITIES.includes(r.personality)) problems.push(`${r.id}: bad personality "${r.personality}"`);
    if (!r.text) problems.push(`${r.id}: empty text`);
});
for (const beat of ['pre-open', 'win-open', 'loss-open'])
    if (!finals.some(r => r.beat === beat && r.personality === 'any'))
        problems.push(`no 'any' line for Final beat=${beat}`);
for (const [beat, keys] of Object.entries(FINAL_CHOICE))
    for (const choice of keys)
        for (const outcome of (choice === 'bonus' || choice === 'tab' ? ['good'] : ['good', 'bad']))
            if (!finals.some(r => r.beat === beat && r.choice === choice && (r.outcome === outcome || r.outcome === 'any') && r.personality === 'any'))
                problems.push(`no 'any' reply for Final ${beat} ${choice}/${outcome}`);

// ---- Farewell (Phase 2: retirement scene, opener keyed by bond tier)
const TIERS = ['business', 'trusted', 'confidant', 'family', 'any'];
const farewell = readTable(sheetByName('Farewell'), ['id', 'beat', 'tier', 'choice', 'personality', 'text']);
farewell.forEach(r => {
    checkId(r.id, 'Farewell');
    if (!['open', 'reply'].includes(r.beat)) problems.push(`${r.id}: bad beat "${r.beat}"`);
    if (!TIERS.includes(r.tier)) problems.push(`${r.id}: bad tier "${r.tier}"`);
    if (r.beat === 'reply' && !['career', 'personal'].includes(r.choice)) problems.push(`${r.id}: bad choice "${r.choice}"`);
    if (!PERSONALITIES.includes(r.personality)) problems.push(`${r.id}: bad personality "${r.personality}"`);
    if (!r.text) problems.push(`${r.id}: empty text`);
});
for (const tier of ['business', 'trusted', 'confidant', 'family'])
    if (!farewell.some(r => r.beat === 'open' && (r.tier === tier || r.tier === 'any') && r.personality === 'any'))
        problems.push(`no 'any' Farewell opener for tier=${tier}`);
for (const choice of ['career', 'personal'])
    if (!farewell.some(r => r.beat === 'reply' && r.choice === choice && r.personality === 'any'))
        problems.push(`no 'any' Farewell reply for choice=${choice}`);

// ---- Checkin (Phase 3: small talk that discovers facts)
const CK_QS = ['q-life', 'q-club', 'q-ambition', 'q-room', 'q-none'];
const CK_VARIANTS = ['single', 'partner', 'kids', 'hobby', 'nothing', 'any'];
const checkin = readTable(sheetByName('Checkin'), ['id', 'beat', 'choice', 'variant', 'personality', 'text']);
checkin.forEach(r => {
    checkId(r.id, 'Checkin');
    if (!['open', 'reply'].includes(r.beat)) problems.push(`${r.id}: bad beat "${r.beat}"`);
    if (r.beat === 'reply' && !CK_QS.includes(r.choice)) problems.push(`${r.id}: bad choice "${r.choice}"`);
    if (r.beat === 'reply' && !CK_VARIANTS.includes(r.variant || 'any')) problems.push(`${r.id}: bad variant "${r.variant}"`);
    if (!PERSONALITIES.includes(r.personality)) problems.push(`${r.id}: bad personality "${r.personality}"`);
    if (!r.text) problems.push(`${r.id}: empty text`);
});
if (!checkin.some(r => r.beat === 'open' && r.personality === 'any')) problems.push(`no 'any' Checkin opener`);
for (const q of CK_QS)
    if (!checkin.some(r => r.beat === 'reply' && r.choice === q && r.personality === 'any'))
        problems.push(`no 'any' Checkin reply for ${q}`);
for (const v of ['single', 'partner', 'kids', 'hobby', 'nothing'])
    if (!checkin.some(r => r.beat === 'reply' && r.choice === 'q-life' && (r.variant === v || r.variant === 'any') && r.personality === 'any'))
        problems.push(`no 'any' q-life reply for variant=${v}`);

// ---- Moments (Phase 3: career-moment scenes)
const MOMENT_KINDS = ['debut', 'firstgoal', 'hattrick', 'milestone', 'procontract', 'transfer', 'dreammove', 'ambition', 'injury', 'thanks', 'invite', 'referral', 'any'];
const moments = readTable(sheetByName('Moments'), ['id', 'kind', 'beat', 'choice', 'personality', 'text']);
moments.forEach(r => {
    checkId(r.id, 'Moments');
    if (!MOMENT_KINDS.includes(r.kind)) problems.push(`${r.id}: bad kind "${r.kind}"`);
    if (!['open', 'reply'].includes(r.beat)) problems.push(`${r.id}: bad beat "${r.beat}"`);
    if (r.beat === 'reply' && !['praise', 'modest', 'there', 'flowers', 'cherish', 'banter', 'attend', 'gift', 'decline'].includes(r.choice)) problems.push(`${r.id}: bad choice "${r.choice}"`);
    if (!PERSONALITIES.includes(r.personality)) problems.push(`${r.id}: bad personality "${r.personality}"`);
    if (!r.text) problems.push(`${r.id}: empty text`);
});
for (const kind of MOMENT_KINDS.filter(k => k !== 'any'))
    if (!moments.some(r => r.kind === kind && r.beat === 'open' && r.personality === 'any'))
        problems.push(`no 'any' Moments opener for kind=${kind}`);
for (const choice of ['praise', 'modest'])
    if (!moments.some(r => r.beat === 'reply' && r.choice === choice && (r.kind === 'any') && r.personality === 'any'))
        problems.push(`no shared 'any' Moments reply for ${choice}`);
for (const choice of ['there', 'flowers'])
    if (!moments.some(r => r.kind === 'injury' && r.beat === 'reply' && r.choice === choice && r.personality === 'any'))
        problems.push(`no 'any' injury reply for ${choice}`);
for (const choice of ['cherish', 'banter'])
    if (!moments.some(r => r.kind === 'thanks' && r.beat === 'reply' && r.choice === choice && r.personality === 'any'))
        problems.push(`no 'any' thanks reply for ${choice}`);
for (const choice of ['attend', 'gift', 'decline'])
    if (!moments.some(r => r.kind === 'invite' && r.beat === 'reply' && r.choice === choice && r.personality === 'any'))
        problems.push(`no 'any' invite reply for ${choice}`);

// ---- Choices
const choices = readTable(sheetByName('Choices'), ['id', 'scene', 'choice', 'label', 'hint']);
choices.forEach(r => {
    checkId(r.id, 'Choices');
    if (!r.label) problems.push(`${r.id}: empty label`);
});
for (const [scene, choice] of [
    ['complaint', 'listen'], ['complaint', 'promise'], ['complaint', 'pushback'], ['complaint', 'deflect'],
    ['gift', 'praise'], ['gift', 'modest'],
    ['prematch', 'calm'], ['prematch', 'fireup'], ['prematch', 'bonus'],
    ['postwin', 'toast'], ['postwin', 'quiet'], ['postwin', 'tab'],
    ['postloss', 'sit'], ['postloss', 'space'], ['postloss', 'speech'],
    ['farewell', 'career'], ['farewell', 'personal'],
    ['checkin', 'q-life'], ['checkin', 'q-club'], ['checkin', 'q-ambition'], ['checkin', 'q-room'], ['checkin', 'q-none'],
    ['moment', 'praise'], ['moment', 'modest'], ['injury', 'there'], ['injury', 'flowers'],
    ['thanks', 'cherish'], ['thanks', 'banter'], ['invite', 'attend'], ['invite', 'gift'], ['invite', 'decline']])
    if (!choices.some(r => r.scene === scene && r.choice === choice))
        problems.push(`missing Choices row for ${scene}/${choice}`);

if (problems.length) {
    console.error('dialogue workbook problems:');
    problems.forEach(p => console.error('  - ' + p));
    process.exit(1);
}

const data = {
    complaint: comp.map(r => ({ id: r.id, beat: r.beat, dim: r.dim, stage: String(r.stage), choice: r.choice, outcome: r.outcome, personality: r.personality, text: r.text })),
    gifts: gifts.map(r => ({ id: r.id, beat: r.beat, tier: r.tier, mood: r.mood, choice: r.choice, personality: r.personality, text: r.text })),
    final: finals.map(r => ({ id: r.id, beat: r.beat, choice: r.choice, outcome: r.outcome, personality: r.personality, text: r.text })),
    farewell: farewell.map(r => ({ id: r.id, beat: r.beat, tier: r.tier, choice: r.choice, personality: r.personality, text: r.text })),
    checkin: checkin.map(r => ({ id: r.id, beat: r.beat, choice: r.choice, variant: r.variant || 'any', personality: r.personality, text: r.text })),
    moments: moments.map(r => ({ id: r.id, kind: r.kind, beat: r.beat, choice: r.choice, personality: r.personality, text: r.text })),
    choices: choices.map(r => ({ scene: r.scene, choice: r.choice, label: r.label, hint: r.hint || '' })),
};

const out = `// GENERATED by scripts/parse-dialogue-xlsx.mjs from dialogue_lines.xlsx. Do not edit by hand:
// edit the workbook, then re-run the parser. See the workbook's "Read me" sheet for the format.
const DIALOGUE_DATA = ${JSON.stringify(data, null, 1)};
if (typeof module !== 'undefined' && module.exports) module.exports = { DIALOGUE_DATA };
`;
writeFileSync(join(ROOT, 'js', 'dialogue-data.js'), out);
console.log(`js/dialogue-data.js written: ${data.complaint.length} complaint, ${data.gifts.length} gift, ${data.final.length} final, ${data.farewell.length} farewell, ${data.checkin.length} checkin, ${data.moments.length} moment lines, ${data.choices.length} choices`);
