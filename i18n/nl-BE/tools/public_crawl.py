"""Read-only public crawl with sequential requests and bounded 429 backoff."""
import json
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit, urljoin
from datetime import datetime, timezone
from inventory import ROOT, scan

ORIGIN = 'https://chroniques-fille-ordinaire.com'
RETRY_DELAYS = (60, 120, 240)

def request(url):
    attempts = []
    for attempt in range(len(RETRY_DELAYS)+1):
        try:
            with urlopen(Request(url, headers={'User-Agent':'CFO-localization-audit/1.0'}), timeout=40) as response:
                return response.status, response.geturl(), response.read().decode('utf-8', errors='replace'), attempts
        except HTTPError as error:
            attempts.append({'status':error.code, 'attempt':attempt+1})
            if error.code != 429 or attempt == len(RETRY_DELAYS):
                return error.code, url, '', attempts
            try:
                delay = max(RETRY_DELAYS[attempt], int(error.headers.get('Retry-After', '0')))
            except ValueError:
                delay = RETRY_DELAYS[attempt]
            print(json.dumps({'retry':url,'seconds':delay}),flush=True)
            time.sleep(delay)
        except (URLError, TimeoutError) as error:
            return 0, url, '', attempts+[{'error':str(error)}]

def normalize(href, source):
    value = urlsplit(urljoin(source, href))
    if value.hostname != urlsplit(ORIGIN).hostname:
        return None
    if any(part in value.path for part in ('/wp-admin','/wp-json','/wp-content','/wp-includes','/feed/')):
        return None
    if value.query or '.' in value.path.rsplit('/',1)[-1]:
        return None
    return urlunsplit((value.scheme,value.netloc,value.path or '/', '', ''))

def main():
    directory = ROOT/'inventory/crawl'
    directory.mkdir(parents=True,exist_ok=True)
    pending = [ORIGIN+'/']
    seen = set()
    rows = []
    while pending and len(seen) < 160:
        url = pending.pop(0)
        if url in seen:
            continue
        seen.add(url)
        code, final, html, attempts = request(url)
        parser = scan(html)
        links = sorted({v for href in parser.links if (v:=normalize(href,final))})
        rows.append({'url':url,'final_url':final,'status':code,'links':links,'media':parser.media,
                     'labels':parser.labels,'text':parser.text,'attempts':attempts})
        (directory/f'{len(rows):03d}.html').write_text(html,encoding='utf-8')
        pending.extend(link for link in links if link not in seen and link not in pending)
        print(json.dumps({'page':len(rows),'status':code,'url':url}),flush=True)
        time.sleep(2)
    result = {'checked_at':datetime.now(timezone.utc).isoformat(),'complete':not pending,'remaining':pending,'pages':rows}
    (ROOT/'inventory/public-crawl.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__ == '__main__':
    main()
