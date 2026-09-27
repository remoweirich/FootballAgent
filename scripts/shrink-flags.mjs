// Build-time only. Rasterises the handful of flag SVGs whose detailed coats of arms make them
// enormous, and rewrites their CSS rules to point at the raster instead.
//
// Flags render as a CSS background at 1.333em x 1em — roughly 19x14 CSS px, so about 57x42 device px
// on a 3x phone. Four flags were carrying full vector heraldry for that: rs.svg 177 KB, bo.svg
// 100 KB, mx.svg 83 KB, es.svg 79 KB — 440 KB of the 664 KB bundle, for detail no one can resolve.
// 96x72 WebP covers 3x with room to spare.
//
//   node scripts/shrink-flags.mjs            # report what it would do
//   node scripts/shrink-flags.mjs --write    # write the WebPs and patch the CSS
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'ui', 'vendor', 'flag-icons');
const CSS = join(DIR, 'flag-icons.css');
const WRITE = process.argv.includes('--write');

const WIDTH = 96, HEIGHT = 72;      // 4:3, comfortable for 3x at the rendered 19x14 CSS px
const THRESHOLD = 25 * 1024;        // only bother with SVGs above this

const css = readFileSync(CSS, 'utf8');
const rules = [...css.matchAll(/\.fi-([a-z]{2}(?:-[a-z]+)?)\{background-image:url\(flags\/4x3\/([^)]+)\.svg\)\}/g)];

const big = [];
for (const [, code, file] of rules) {
    const p = join(DIR, 'flags', '4x3', file + '.svg');
    if (existsSync(p) && statSync(p).size > THRESHOLD) big.push({ code, file, p, size: statSync(p).size });
}
big.sort((a, b) => b.size - a.size);

if (!big.length) { console.log('  nothing above ' + (THRESHOLD / 1024) + ' KB — already shrunk.'); process.exit(0); }

let before = 0, after = 0, newCss = css;
for (const f of big) {
    const out = join(DIR, 'flags', '4x3', f.file + '.webp');
    const buf = await sharp(f.p, { density: 300 })
        .resize(WIDTH, HEIGHT, { fit: 'fill' })
        .webp({ quality: 94, effort: 6 })
        .toBuffer();
    before += f.size;
    after += buf.length;
    console.log(`  ${(f.size / 1024).toFixed(0).padStart(4)} KB -> ${(buf.length / 1024).toFixed(1).padStart(5)} KB  ${f.file}.svg`);
    if (WRITE) {
        writeFileSync(out, buf);
        const from = `.fi-${f.code}{background-image:url(flags/4x3/${f.file}.svg)}`;
        const to = `.fi-${f.code}{background-image:url(flags/4x3/${f.file}.webp)}`;
        if (!newCss.includes(from)) throw new Error('CSS rule not found for ' + f.code);
        newCss = newCss.replace(from, to);
        unlinkSync(f.p);
    }
}
console.log(`\n  ${big.length} flags: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB  (${(100 - 100 * after / before).toFixed(0)}% smaller)`);
if (WRITE) {
    writeFileSync(CSS, newCss);
    console.log('  flag-icons.css rewritten, the SVG originals removed.');
} else {
    console.log('  dry run — pass --write to apply.');
}
