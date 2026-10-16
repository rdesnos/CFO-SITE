"""Remove the obsolete numeric snapshot from the presentation template."""
import re
from pathlib import Path

path = Path(__file__).resolve().parents[2] / "wordpress/theme/assets/cfo-observatoire-synthese.html"
html = path.read_text(encoding="utf-8")
html = re.sub(r'(<(?:strong|span) class="(?:value|delta)">)[^<]*(</(?:strong|span)>)', r'\1—\2', html)
html = re.sub(r'(<div class="meta">)[^<]*(</div>)', r'\1Chargement des relevés…\2', html)
html = re.sub(r'(<div class="pair">.*?<b>)[^<]*(</b></div>)', r'\1—\2', html)
html = re.sub(r'(<span class="pill">)[^<]*(</span>)', r'\1Relevés en cours de chargement\2', html)
html = re.sub(r'(<strong class="signal">)[^<]*(</strong>)', r'\1Chargement du signal…\2', html)
html = re.sub(r'(<li><span>[^<]*</span><b>)[^<]*(</b></li>)', r'\1—\2', html)
html = re.sub(r'points="[^"]*"', 'points=""', html)
html = re.sub(r'<circle class="cfo-spark-point"[^>]*/>', '', html)
html = re.sub(r'(<div class="(?:cfo-spark-hit|mini-bars|motor-bars)[^"]*">).*?(</div>)', r'\1\2', html, flags=re.S)
def table_row(match):
    parts = list(re.finditer(r'(<td[^>]*>)(.*?)(</td>)', match[0], re.S))
    row = match[0]
    for i in range(len(parts)-1, -1, -1):
        if i in (2,3,4,5,6,7):
            part = parts[i]
            row = row[:part.start()] + part[1] + "—" + part[3] + row[part.end():]
    return row
html = re.sub(r'<tr>.*?</tr>', table_row, html, flags=re.S)
html = re.sub(r'<p>Réseaux sociaux.*?</p>', '<p>Chargement de l’analyse sourcée…</p>', html)
html = re.sub(r'<p>Le catalogue qualifié.*?</p>', '<p>Chargement de l’analyse sourcée…</p>', html)
path.write_text(html, encoding="utf-8")
