"""Fail closed: partial translations cannot be released as a complete edition."""
import json
from datetime import datetime, timezone
from inventory import ROOT

def main():
    manifest=json.loads((ROOT/'inventory/manifest.json').read_text(encoding='utf-8'))
    translated=[]
    for kind in ('pages','posts'):
        path=ROOT/f'build/{kind}.json'
        if path.exists():
            translated.extend(json.loads(path.read_text(encoding='utf-8')))
    have={(r['source_type'],r['source_id']):r for r in translated}
    included=[r for r in manifest if r['scope']=='included']
    missing=[{'type':r['source_type'],'id':r['source_id'],'title':r['title']} for r in included
             if (r['source_type'],r['source_id']) not in have]
    stale=[r['source_id'] for r in included if (r['source_type'],r['source_id']) in have
           and r['source_hash']!=have[r['source_type'],r['source_id']]['source_hash']]
    required=['metadata','forum','agenda','dynamic-feeds','responsive','media-links','french-regression','french-residuals']
    incomplete=[]
    for name in required:
        path=ROOT/f'evidence/{name}.json'
        if not path.exists() or json.loads(path.read_text(encoding='utf-8')).get('complete') is not True:
            incomplete.append(name)
    result={'checked_at':datetime.now(timezone.utc).isoformat(),'ready':False,'wordpress_included':len(included),
            'wordpress_translated':len(included)-len(missing)-len(stale),
            'wordpress_coverage':round(100*(len(included)-len(missing)-len(stale))/len(included),2),
            'missing':missing,'stale':stale,'incomplete_checks':incomplete}
    result['ready']=not (missing or stale or incomplete)
    (ROOT/'evidence/readiness.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('missing',)},ensure_ascii=False))
    return 0 if result['ready'] else 1

if __name__=='__main__':
    raise SystemExit(main())
