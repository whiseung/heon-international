"""Subset the web fonts to the characters used in dist/.

The bundled woff2 files only contain the glyphs the site uses. After changing
copy, rebuild, run this script against the full source fonts, then rebuild:

    npm run build
    python3 scripts/subset-fonts.py /path/to/fonts
    npm run build

The source directory must contain:
  PretendardVariable.woff2    github.com/orioncactus/pretendard (packages/pretendard)
  PretendardJPVariable.woff2  github.com/orioncactus/pretendard (packages/pretendard-jp)
  Archivo.woff2               @fontsource-variable/archivo, archivo-latin-wdth-normal.woff2

Requires fontTools and brotli (pip install fonttools brotli).
"""

import sys
from html.parser import HTMLParser
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
ASSETS = ROOT / 'src' / 'assets'
BASE = set(chr(c) for c in range(0x20, 0x7F)) | set('–—‘’“”·…©×')


class TextCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.chars = set()
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
        for name, value in attrs:
            if name in ('alt', 'aria-label', 'title') and value:
                self.chars.update(value)

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.chars.update(data)


def is_hangul(c):
    o = ord(c)
    return 0x1100 <= o <= 0x11FF or 0x3130 <= o <= 0x318F or 0xAC00 <= o <= 0xD7A3


def is_japanese(c):
    o = ord(c)
    return 0x3000 <= o <= 0x30FF or 0x4E00 <= o <= 0x9FFF or 0xFF00 <= o <= 0xFFEF


def write_subset(source, target, chars):
    font = TTFont(source)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=sorted(ord(c) for c in chars))
    subsetter.subset(font)
    font.save(target)
    print(f'{target.name}: {len(chars)} characters, {target.stat().st_size // 1024} KB')


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    collector = TextCollector()
    for page in DIST.rglob('*.html'):
        collector.feed(page.read_text(encoding='utf-8'))
    chars = {c for c in collector.chars if c.isprintable()} | BASE
    write_subset(source / 'PretendardVariable.woff2', ASSETS / 'pretendard.woff2',
                 {c for c in chars if not is_japanese(c)})
    write_subset(source / 'PretendardJPVariable.woff2', ASSETS / 'pretendard-jp.woff2',
                 {c for c in chars if not is_hangul(c)})
    write_subset(source / 'Archivo.woff2', ASSETS / 'archivo.woff2',
                 {c for c in chars if ord(c) < 0x2100})


if __name__ == '__main__':
    main()
