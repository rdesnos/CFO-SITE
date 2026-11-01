"""Public render checks for the regional edition (stdlib only).

python tests/international-smoke.py --preview-token TOKEN
Omit the token only after the edition is published.
"""
import argparse
import json
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import urlopen


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lang = None
        self.robots = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang")
        if tag == "meta" and attrs.get("name") == "robots":
            self.robots.append(attrs.get("content", ""))
        if tag == "a":
            self.links.append(attrs)


parser = argparse.ArgumentParser()
parser.add_argument("--base", default="https://chroniques-fille-ordinaire.com")
parser.add_argument("--preview-token")
args = parser.parse_args()
for path, requested, expected in [
    ("/", "fr-FR", "fr-FR"),
    ("/gemme-entre-les-lignes/", "fr-CA", "fr-CA"),
    ("/", "it-CH", "fr-FR"),
]:
    query = {"cfo_lang": requested}
    if args.preview_token:
        query["wpvibe_preview"] = args.preview_token
    url = args.base.rstrip("/") + path + "?" + urlencode(query)
    with urlopen(url, timeout=35) as response:
        source = response.read().decode("utf-8")
        assert response.status == 200, response.status
    page = Page()
    page.feed(source)
    assert "Fatal error" not in source
    assert page.lang == expected, (page.lang, expected)
    editions = {a["hreflang"] for a in page.links if a.get("hreflang")}
    assert editions == {"fr-FR", "fr-CA"}, editions
    if expected == "fr-CA":
        assert any("noindex" in robots for robots in page.robots)
        dossier_links = [
            a for a in page.links
            if urlsplit(a.get("href", "")).path == "/entre-les-lignes/"
        ]
        assert dossier_links
        assert all(
            parse_qs(urlsplit(a["href"]).query).get("cfo_lang") == ["fr-CA"]
            for a in dossier_links
        )
    print(json.dumps({"path": path, "requested": requested, "rendered": page.lang,
                      "available_editions": sorted(editions), "passed": True}))
