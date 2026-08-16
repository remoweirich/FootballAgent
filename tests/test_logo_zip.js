// Unit test for CustomizeScreen._expandZip — the dependency-free ZIP reader used by "Import logos"
// when the user feeds a .zip of a logos folder. Builds a real zip (one STORED entry, one DEFLATED
// entry, plus a directory + a __MACOSX junk entry) and confirms the reader pulls out exactly the two
// images, by basename, with their bytes intact.
const vm = require('vm'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..') + '/';

// sandbox shares Node's realm objects so there are no cross-realm ArrayBuffer surprises
const sb = {
    Math, Date, JSON, setTimeout, console: { log() {}, warn() {}, error() {} },
    Uint8Array, DataView, ArrayBuffer, TextDecoder, Blob, Response, DecompressionStream,
};
vm.createContext(sb);
const CX = vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-customize.js'), 'utf8') + ';CustomizeScreen', sb, { filename: 'screen-customize.js' });

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---- build a minimal zip by hand ----
const enc = new TextEncoder();
const u16 = n => [n & 255, (n >> 8) & 255];
const u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
function makeZip(entries) {
    const parts = [], central = []; let offset = 0;
    for (const e of entries) {
        const nameB = enc.encode(e.name);
        const raw = Buffer.from(e.data);
        const comp = e.method === 8 ? new Uint8Array(zlib.deflateRawSync(raw)) : new Uint8Array(e.data);
        const local = Uint8Array.from([].concat(
            u32(0x04034b50), u16(20), u16(0), u16(e.method), u16(0), u16(0),
            u32(0), u32(comp.length), u32(e.data.length), u16(nameB.length), u16(0)));
        const localOffset = offset;
        parts.push(local, nameB, comp);
        offset += local.length + nameB.length + comp.length;
        central.push(Uint8Array.from([].concat(
            u32(0x02014b50), u16(20), u16(20), u16(0), u16(e.method), u16(0), u16(0),
            u32(0), u32(comp.length), u32(e.data.length), u16(nameB.length),
            u16(0), u16(0), u16(0), u16(0), u32(0), u32(localOffset))), nameB);
    }
    const cdStart = offset;
    let cdSize = 0; central.forEach(c => cdSize += c.length);
    const eocd = Uint8Array.from([].concat(
        u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
        u32(cdSize), u32(cdStart), u16(0)));
    const all = [...parts, ...central, eocd];
    const total = all.reduce((s, a) => s + a.length, 0);
    const buf = new Uint8Array(total); let p = 0;
    for (const a of all) { buf.set(a, p); p += a.length; }
    return buf;
}

const storedBytes = new Uint8Array([1, 2, 3, 4, 5]);
const deflatedBytes = new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
const zip = makeZip([
    { name: 'logos/', data: new Uint8Array(0), method: 0 },              // directory entry -> ignored
    { name: 'Basel.png', data: storedBytes, method: 0 },                 // stored
    { name: 'logos/YB.png', data: deflatedBytes, method: 8 },            // deflated, nested
    { name: '__MACOSX/._Basel.png', data: new Uint8Array([0]), method: 0 }, // junk -> ignored
    { name: 'readme.txt', data: enc.encode('hi'), method: 0 },           // non-image -> ignored
]);
const file = { name: 'logos.zip', type: 'application/zip', arrayBuffer: async () => zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) };

(async () => {
    const out = await CX._expandZip(file);
    const names = out.map(e => e.name).sort();
    check('zip yields exactly the two images, by basename', names.join(',') === 'Basel.png,YB.png');
    const read = async n => new Uint8Array(await new Response(out.find(e => e.name === n).blob).arrayBuffer());
    const b0 = await read('Basel.png');
    check('stored entry bytes are preserved', b0.length === 5 && b0[0] === 1 && b0[4] === 5);
    const b1 = await read('YB.png');
    check('deflated entry is inflated back to the original bytes', b1.length === 10 && b1[0] === 9 && b1[9] === 0);

    console.log(failed ? '\n*** FAIL ***' : '\nAll logo-zip checks passed.');
    process.exitCode = failed ? 1 : 0;
})();
