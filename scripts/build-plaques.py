# -*- coding: utf-8 -*-
# Build-time only. Turns the supporter plaque artwork in resources/ into the WebP files the start
# screen shows.
#
# The sources are 825x225 (3.67:1) with transparency around the rounded plaque, so alpha is kept.
# They render at roughly 200 CSS px wide, i.e. 600 device px on a 3x phone, so 660 wide leaves a
# little headroom without carrying four times the pixels anyone can see.
#
#   python scripts/build-plaques.py
import io, os, sys

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow is required:  python -m pip install Pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'resources')
OUT = os.path.join(ROOT, 'ui', 'assets', 'img', 'plaques')

# source file -> the tier it belongs to (1 = cheapest). The names come from the artwork itself.
PLAQUES = [
    ('Grateful.png', 'grateful', 1, 'Grateful Gamer'),
    ('Ecstatic.png', 'ecstatic', 2, 'Ecstatic Enjoyer'),
    ('Super.png', 'super', 3, 'Super Supporter'),
]
WIDTH = 660
QUALITY = 92        # these carry text and a metallic gradient, so keep them cleaner than the scenery art

os.makedirs(OUT, exist_ok=True)
tot_in = tot_out = 0
for fname, slug, tier, label in PLAQUES:
    p = os.path.join(SRC, fname)
    if not os.path.exists(p):
        sys.exit('missing source: ' + p)
    im = Image.open(p).convert('RGBA')
    h = round(WIDTH * im.size[1] / im.size[0])
    im = im.resize((WIDTH, h), Image.LANCZOS)
    dest = os.path.join(OUT, slug + '.webp')
    im.save(dest, 'WEBP', quality=QUALITY, method=6)
    a, b = os.path.getsize(p), os.path.getsize(dest)
    tot_in += a
    tot_out += b
    print('  tier %d  %-16s %sx%s  %5.0f KB -> %4.1f KB  %s' % (tier, fname, WIDTH, h, a / 1024, b / 1024, label))
print('\n  %.0f KB -> %.0f KB' % (tot_in / 1024, tot_out / 1024))
print('  written to ui/assets/img/plaques/')
