// One-off scaffold: writes injuries.xlsx from the seed list below, so there's an Excel workbook to
// hand-edit. After this, the WORKBOOK is the source of truth — edit it, then run
// `node scripts/parse-injuries-xlsx.mjs` to regenerate js/injuries-data.js. Re-running this generator
// would overwrite your edits, so only use it to recreate the file from scratch.
//
// No dependencies: builds a minimal (uncompressed / "stored") .xlsx zip by hand, the mirror of the
// reader in parse-injuries-xlsx.mjs. Two sheets: a "Read me" and the "Injuries" table.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- the seed data: name, relative weight (likelihood), and weeks-out range [min,max], by category.
// Common knocks are frequent and short; the season-enders are rare and long. Edit freely in Excel.
const HEADER = ['id', 'name', 'weight', 'minWeeks', 'maxWeeks', 'category'];
const INJURIES = [
    ['knock', 'Dead leg', 18, 1, 2, 'Bruise'],
    ['bruise', 'Deep bruise', 15, 1, 1, 'Bruise'],
    ['ankle', 'Ankle sprain', 12, 2, 5, 'Ligament'],
    ['ham', 'Hamstring strain', 11, 3, 6, 'Muscle'],
    ['groin', 'Groin strain', 9, 2, 5, 'Muscle'],
    ['calf', 'Calf strain', 8, 2, 4, 'Muscle'],
    ['hip', 'Hip flexor strain', 6, 2, 4, 'Muscle'],
    ['illness', 'Illness', 6, 1, 2, 'Illness'],
    ['back', 'Back spasm', 5, 1, 3, 'Muscle'],
    ['toe', 'Bruised foot', 5, 1, 3, 'Bone'],
    ['thigh', 'Thigh strain', 5, 2, 4, 'Muscle'],
    ['concussion', 'Concussion', 4, 1, 3, 'Head'],
    ['shoulder', 'Shoulder sprain', 4, 3, 6, 'Joint'],
    ['knee-mcl', 'Knee ligament (MCL)', 4, 5, 9, 'Ligament'],
    ['wrist', 'Wrist sprain', 3, 2, 4, 'Joint'],
    ['meniscus', 'Knee cartilage (meniscus)', 3, 8, 14, 'Cartilage'],
    ['face', 'Facial fracture', 2, 1, 3, 'Bone'],
    ['metatarsal', 'Broken metatarsal', 2, 8, 14, 'Bone'],
    ['dislocation', 'Dislocated shoulder', 1, 6, 12, 'Joint'],
    ['fracture', 'Fractured leg', 1, 16, 28, 'Bone'],
    ['achilles', 'Achilles rupture', 1, 22, 36, 'Tendon'],
    ['acl', 'Cruciate ligament (ACL)', 1, 24, 40, 'Ligament'],
];

// ----------------------------------------------------------------------------- xlsx (stored zip)
const enc = s => Buffer.from(String(s), 'utf8');
const xesc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colLetter = i => String.fromCharCode(65 + i);

function sheetXml(rows) {
    let body = '';
    rows.forEach((row, r) => {
        const rn = r + 1;
        let cells = '';
        row.forEach((val, c) => {
            const ref = colLetter(c) + rn;
            if (typeof val === 'number') cells += `<c r="${ref}"><v>${val}</v></c>`;
            else if (val !== '' && val != null) cells += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(val)}</t></is></c>`;
        });
        body += `<row r="${rn}">${cells}</row>`;
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

const readme = [
    ['Read me'],
    ['This workbook is the source of truth for the injuries a player can suffer.'],
    ['Edit the "Injuries" sheet, then run:  node scripts/parse-injuries-xlsx.mjs'],
    ['Columns: id (unique), name (shown in-game), weight (relative likelihood), minWeeks/maxWeeks (weeks out), category (free label).'],
    ['Higher weight = more common. A player picks up one injury at the game-wide rate; THIS table only decides which one and for how long.'],
];
const injuriesRows = [HEADER, ...INJURIES];

// CRC-32
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

const parts = [
    ['[Content_Types].xml', enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)],
    ['_rels/.rels', enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)],
    ['xl/workbook.xml', enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Read me" sheetId="1" r:id="rId1"/><sheet name="Injuries" sheetId="2" r:id="rId2"/></sheets></workbook>`)],
    ['xl/_rels/workbook.xml.rels', enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`)],
    ['xl/worksheets/sheet1.xml', enc(sheetXml(readme))],
    ['xl/worksheets/sheet2.xml', enc(sheetXml(injuriesRows))],
];

// ---- assemble the stored (method 0) zip
const chunks = [], central = [];
let offset = 0;
const u16 = n => { const b = Buffer.alloc(2); b.writeUInt16LE(n >>> 0); return b; };
const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
for (const [name, data] of parts) {
    const nameB = enc(name), crc = crc32(data);
    const local = Buffer.concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameB.length), u16(0), nameB, data]);
    chunks.push(local);
    central.push(Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameB]));
    offset += local.length;
}
const cd = Buffer.concat(central);
const eocd = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(parts.length), u16(parts.length), u32(cd.length), u32(offset), u16(0)]);
writeFileSync(join(ROOT, 'injuries.xlsx'), Buffer.concat([...chunks, cd, eocd]));
console.log(`injuries.xlsx written: ${INJURIES.length} injury types`);
