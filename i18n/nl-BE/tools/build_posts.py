import json
import re
from pathlib import Path
from collections import Counter
from inventory import ROOT, digest, scan
from segments import Segments, replace

def build(kind='posts'):
    sources = json.loads((ROOT/f'inventory/{kind}.json').read_text(encoding='utf-8'))
    translations = json.loads((ROOT/f'translations/{kind}.review.json').read_text(encoding='utf-8'))
    rows = []
    results = []
    for source in sources:
        if str(source['id']) not in translations:
            continue
        translated = translations[str(source['id'])]
        original = source['content']['raw']
        keys = list(dict.fromkeys(span[2] for span in Segments(original).spans))
        assert len(keys) == len(translated['segments']), (source['id'], len(keys), len(translated['segments']))
        dictionary = dict(zip(keys, translated['segments']))
        content, missing = replace(original, dictionary)
        assert not missing, (source['id'], missing)
        before, after = scan(original), scan(content)
        assert before.links == after.links, ('links', source['id'])
        assert before.media == after.media, ('media', source['id'])
        # Tag names, layout attributes, code, block comments and entities must
        # survive. Only the reviewed localizable attribute spans may change.
        def skeleton(value):
            for start,end,key,attr in reversed(Segments(value).spans):
                value = value[:start]+'__TEXT__'+value[end:]
            return value
        assert skeleton(original) == skeleton(content), ('structure', source['id'])
        assert Counter(re.findall(r'\d+', original)) == Counter(re.findall(r'\d+', content)), ('numbers', source['id'])
        quotes = re.findall('«[^»]*»', original)
        # Preserve source quotations verbatim, including quoted titles of
        # external publications. Dutch prose surrounds these quotations.
        for quote in quotes:
            assert content.count(quote) >= original.count(quote), ('quotation', source['id'], quote)
        rows.append({
            'source_system':'wordpress', 'source_type':source['type'], 'source_id':source['id'],
            'locale':'nl-BE', 'source_revision':source['modified_gmt'], 'source_hash':digest(source),
            'translated_title':translated['title'], 'translated_excerpt':translated['excerpt'],
            'translated_content':content, 'status':'review',
        })
        results.append({'source_id':source['id'], 'segments':len(keys), 'links_preserved':True,
                        'media_preserved':True, 'html_preserved':True, 'numbers_preserved':True, 'quotations_preserved':True})
    (ROOT/'build').mkdir(exist_ok=True)
    (ROOT/f'build/{kind}.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
    (ROOT/'evidence').mkdir(exist_ok=True)
    (ROOT/f'evidence/{kind}-integrity.json').write_text(json.dumps(results, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'kind':kind, 'translated':len(rows), 'remaining_in_source':len(sources)-len(rows), 'segments':sum(r['segments'] for r in results), 'integrity':'passed'}))

if __name__ == '__main__':
    import sys
    build(sys.argv[1] if len(sys.argv)>1 else 'posts')
