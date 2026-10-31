import json
import re
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from inventory import ROOT

# Only the already-public publishable key is used. No secret is retrieved.
source = (ROOT/'theme/cfo-translations.php').read_text(encoding='utf-8')
key = re.search(r"sb_publishable_[A-Za-z0-9_-]+",source)[0]
base = 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_content_translations'
results = []
for suffix in ('?select=source_id,status&locale=eq.nl-BE', '?select=source_id,status&status=eq.review', '?select=source_id,status&status=eq.draft'):
    with urlopen(Request(base+suffix,headers={'apikey':key,'Accept':'application/json'}),timeout=30) as response:
        rows=json.loads(response.read())
        assert rows==[], 'Unpublished translations leaked to the anonymous client'
        results.append({'query':suffix,'http':response.status,'rows':len(rows),'passed':True})
with urlopen(Request(base.replace('cfo_content_translations','cfo_interface_translations')+'?select=source_key,status',headers={'apikey':key,'Accept':'application/json'}),timeout=30) as response:
    rows=json.loads(response.read())
    assert rows==[], 'Unpublished interface labels leaked'
    results.append({'table':'cfo_interface_translations','http':response.status,'rows':len(rows),'passed':True})
(ROOT/'evidence/anonymous-rls.json').write_text(json.dumps({'checked_at':datetime.now(timezone.utc).isoformat(),'checks':results},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'anonymous_checks':len(results),'unpublished_rows_exposed':0}))
