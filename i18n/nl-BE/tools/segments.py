"""Replace only reviewed text/attribute spans; preserve HTML, URLs and code byte for byte."""
from html import escape, unescape
from html.parser import HTMLParser
import re

class Segments(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.lines = [0]
        self.lines.extend(m.end() for m in re.finditer('\n', source))
        self.stack = []
        self.spans = []
        self.feed(source)

    def cursor(self):
        line, col = self.getpos()
        return self.lines[line-1]+col

    def add(self, start, end, attribute=False):
        raw = self.source[start:end]
        leading = len(raw)-len(raw.lstrip())
        trailing = len(raw.rstrip())
        key = unescape(raw.strip())
        if re.search(r'[^\W\d_]', key, re.UNICODE) and not re.fullmatch(r'\s*\[[^\]]+\]\s*', key):
            self.spans.append((start+leading, start+trailing, key, attribute))

    def handle_starttag(self, tag, attrs):
        if tag not in {'img','br','hr','input','meta','link','source','wbr','area','base','embed','param','track','col'}:
            self.stack.append(tag)
        raw = self.get_starttag_text()
        for match in re.finditer(r'\b(alt|title|aria-label|placeholder)\s*=\s*([\"\x27])(.*?)\2', raw, re.S | re.I):
            if match.group(3).strip():
                self.add(self.cursor()+match.start(3), self.cursor()+match.end(3), True)

    def handle_endtag(self, tag):
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]

    def handle_data(self, value):
        if not any(t in self.stack for t in ('script','style','code','pre')):
            self.add(self.cursor(), self.cursor()+len(value))

def replace(source, dictionary):
    parser = Segments(source)
    # HTMLParser emits entity references separately with convert_charrefs=False.
    # Dictionary keys correspond to exact spans; no structural normalization.
    missing = []
    for start,end,key,attr in reversed(parser.spans):
        if key not in dictionary:
            missing.append(key)
            continue
        source = source[:start]+escape(dictionary[key], quote=attr)+source[end:]
    return source, list(reversed(missing))
