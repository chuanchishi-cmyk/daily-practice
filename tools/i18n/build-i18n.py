#!/usr/bin/env python3
"""Usage: python3 tools/i18n/build-i18n.py i18n-en.js  (then bump ?v= in index.html/guide.html/sw.js and CACHE)
Build i18n-en.js from pieces.json + en*.tsv + engine.js.
Lines in en*.tsv:  "<id>\t<english>"  or  "=<chinese>\t<english>".  "∅" means translate to empty."""
import json, glob, re, sys
import os
W = os.path.dirname(os.path.abspath(__file__)) + '/'
pieces = json.load(open(W + 'pieces.json', encoding='utf-8'))
D = {}
bad = []
for fn in sorted(glob.glob(W + 'en*.tsv')):
    for ln, line in enumerate(open(fn, encoding='utf-8').read().split('\n'), 1):
        if not line.strip():
            continue
        if '\t' not in line:
            bad.append((fn, ln, line)); continue
        k, v = line.split('\t', 1)
        if k.startswith('='):
            zh = k[1:].strip()
        else:
            i = int(k)
            zh = pieces[i]
        v = v.strip()
        if v == '∅':
            v = ''
        elif not v:
            continue
        if '\\n' in zh:
            continue
        D[zh.strip()] = v
if bad:
    print('BAD', bad); sys.exit(1)
# sanity: no CJK in values
for k, v in D.items():
    if re.search(r'[一-鿿]', v):
        print('CJK in value', k, v)
eng = open(W + 'engine.js', encoding='utf-8').read()
out = 'window.__I18N_DICT=' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n' + eng
open(sys.argv[1], 'w', encoding='utf-8').write(out)
missing = [p for p in pieces if p.strip() not in D and '\\n' not in p]
print('entries', len(D), 'missing', len(missing))
print('\n'.join(missing[:80]))
