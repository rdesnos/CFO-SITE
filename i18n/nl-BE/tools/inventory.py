"""Build a reviewable source inventory without rewriting French WordPress data."""
import hashlib
import json
import re
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def digest(row):
    # This exact JSON tuple is also used by the WordPress reader.
    value = [row['title']['raw'], row['excerpt']['raw'], row['content']['raw']]
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

class Scan(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.text = []
        self.links = []
        self.media = []
        self.labels = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag not in {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'base', 'embed', 'param', 'track', 'col'}:
            self.stack.append(tag)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        for key in ('src', 'poster', 'srcset'):
            if attrs.get(key):
                self.media.append(attrs[key])
        for key in ('alt', 'title', 'aria-label', 'placeholder'):
            if attrs.get(key):
                self.labels.append(attrs[key])

    def handle_endtag(self, tag):
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]

    def handle_data(self, value):
        if any(t in self.stack for t in ('script', 'style', 'code', 'pre')):
            if 'script' in self.stack:
                self.scripts.append(value)
            return
        if value.strip():
            self.text.append(value.strip())

def scan(value):
    parser = Scan()
    parser.feed(value)
    return parser

def main():
    pages = json.loads((ROOT/'inventory/pages.json').read_text(encoding='utf-8'))
    posts = json.loads((ROOT/'inventory/posts.json').read_text(encoding='utf-8'))
    # Only explicit test pages are excluded automatically. A legacy/preview slug
    # is not proof of exclusion: public navigation currently uses some of them.
    exclusions = {930: 'Test Cockpit exact', 924: 'Test Cockpit restauré',
                  446: 'Test MGP', 819: 'À ses côtés — page de test explicite'}
    manifest = []
    for row in pages + posts:
        parser = scan(row['content']['raw'])
        item = {
            'source_system': 'wordpress', 'source_type': row['type'],
            'source_id': row['id'], 'url': row['link'], 'title': row['title']['raw'],
            'source_revision': row['modified_gmt'], 'source_hash': digest(row),
            'scope': 'excluded' if row['id'] in exclusions else 'included',
            'reason': exclusions.get(row['id'], 'Publié ; conservé par défaut, y compris les anciennes URLs accessibles.'),
            'text_characters': sum(map(len, parser.text)),
            'attribute_labels': parser.labels, 'links': parser.links, 'media': parser.media,
            'shortcodes': re.findall(r'\[(?!\[)([a-zA-Z_][\w-]*)\b', row['content']['raw']),
            'inline_scripts': len(parser.scripts),
        }
        manifest.append(item)
    (ROOT/'inventory/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'total': len(manifest), 'included': sum(r['scope']=='included' for r in manifest),
                      'excluded': sum(r['scope']=='excluded' for r in manifest),
                      'text_characters': sum(r['text_characters'] for r in manifest if r['scope']=='included')}, ensure_ascii=False))

if __name__ == '__main__':
    main()
