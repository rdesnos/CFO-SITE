import json, hashlib, urllib.request, sys
from pathlib import Path

release = Path('source/releases/2026-10-11-home-editorial')
credentials_file = Path(sys.argv[1])
credentials = json.loads(credentials_file.read_text(encoding='utf-8'))
headers = {'X-Auth': credentials['auth_key'], 'X-Auth-Rest': credentials['rest_auth_key'], 'Tus-Resumable': '1.0.0'}
files = ['assets/cfo-home-trends.css', 'functions.php', 'front-page.php']
results = []
try:
    for name in files:
        data = (release / 'theme' / name).read_bytes()
        url = credentials['url'].rstrip('/') + '/wp-content/themes/cfo/' + name + '?override=true'
        request = urllib.request.Request(url, data=b'', method='POST', headers={**headers, 'Upload-Length':str(len(data)), 'Upload-Offset':'0'})
        with urllib.request.urlopen(request, timeout=45) as response:
            assert response.status == 201, response.status
        request = urllib.request.Request(url, data=data, method='PATCH', headers={**headers, 'Content-Type':'application/offset+octet-stream', 'Upload-Offset':'0'})
        with urllib.request.urlopen(request, timeout=45) as response:
            assert response.status == 204, response.status
            assert int(response.headers['Upload-Offset']) == len(data)
        results.append({'path':'wp-content/themes/cfo/'+name, 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest(), 'uploaded':True})
    (release / 'deployment.json').write_text(json.dumps({'files':results, 'method':'Hostinger targeted TUS upload', 'reference_commit':'8546534', 'home_post_content_modified':False}, indent=2), encoding='utf-8')
    print(json.dumps({'uploaded':len(results), 'files':[r['path'] for r in results]}))
finally:
    credentials_file.unlink(missing_ok=True)
