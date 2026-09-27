# -*- coding: utf-8 -*-
# Build-time only. Re-encodes ui/assets/img/**/*.png as WebP and deletes the PNG originals.
#
# The agency artwork is photographic (AI-generated property and vehicle art), and PNG is the wrong
# container for that: 25 files came to 4.01 MB, the largest a single 376 KB thumbnail. WebP at q80
# holds the same 469x469 pixels for 0.50 MB, an 88% saving on the biggest single line item in the
# APK. They display at 36px in the tier rows and 250px in the tap-to-enlarge lightbox, so the
# dimensions are already generous at 3x density.
#
#   python scripts/convert-art-webp.py            # convert, keep the PNGs (dry run leaves both)
#   python scripts/convert-art-webp.py --replace  # convert and delete the PNGs
#
# Re-runnable: a PNG whose .webp already exists and is newer is skipped.
import argparse, io, os, sys, glob

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow is required:  python -m pip install Pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'ui', 'assets', 'img')
QUALITY = 80          # q80 is visually indistinguishable at these display sizes
QUALITY_ALPHA = 85    # the logo carries alpha and sits larger on the start screen


def convert(path, replace):
    out = os.path.splitext(path)[0] + '.webp'
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(path):
        # Already converted. Still honour --replace, so a second run with the flag finishes the job
        # instead of silently skipping the PNG it was asked to remove.
        if replace:
            os.remove(path)
            return 'removed'
        return None
    im = Image.open(path)
    has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    if has_alpha:
        im = im.convert('RGBA')
        q = QUALITY_ALPHA
    else:
        im = im.convert('RGB')
        q = QUALITY
    im.save(out, 'WEBP', quality=q, method=6)
    before, after = os.path.getsize(path), os.path.getsize(out)
    if replace:
        os.remove(path)
    return before, after, has_alpha, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--replace', action='store_true', help='delete each PNG once its WebP is written')
    args = ap.parse_args()

    pngs = sorted(glob.glob(os.path.join(SRC, '**', '*.png'), recursive=True))
    if not pngs:
        print('  no PNGs under ' + SRC + ' — already converted, nothing to do.')
        return

    tot_before = tot_after = 0
    done = skipped = removed = 0
    for p in pngs:
        r = convert(p, args.replace)
        if r is None:
            skipped += 1
            continue
        if r == 'removed':
            removed += 1
            continue
        before, after, alpha, out = r
        tot_before += before
        tot_after += after
        done += 1
        print('  %7.0f KB -> %6.0f KB  %-4s %s' % (
            before / 1024, after / 1024, 'RGBA' if alpha else 'RGB',
            os.path.relpath(out, SRC).replace(os.sep, '/')))

    print('\n  %d converted, %d already up to date' % (done, skipped))
    if done:
        print('  %.2f MB -> %.2f MB  (%.0f%% smaller)' % (
            tot_before / 1048576, tot_after / 1048576,
            100 - 100.0 * tot_after / tot_before))
    if not args.replace and done:
        print('\n  PNGs kept. Re-run with --replace once the WebPs look right.')


if __name__ == '__main__':
    main()
