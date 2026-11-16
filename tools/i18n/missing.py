#!/usr/bin/env python3
"""Usage: python3 tools/i18n/missing.py index.html [out.txt]
Lists Chinese UI text in the app that the English dictionary (en*.tsv) does not fully cover yet.
Run this on every release; translate what it prints into a new line "=<chinese>\t<english>" in an en*.tsv file,
then run build-i18n.py to regenerate i18n-en.js."""
import json, glob, re, sys, os
W = os.path.dirname(os.path.abspath(__file__)) + '/'
pieces = json.load(open(W + 'pieces.json', encoding='utf-8'))
D = {}
for fn in sorted(glob.glob(W + 'en*.tsv')):
    for line in open(fn, encoding='utf-8').read().split('\n'):
        if '\t' not in line:
            continue
        k, v = line.split('\t', 1)
        zh = k[1:].strip() if k.startswith('=') else pieces[int(k)]
        if v.strip() and '\\n' not in zh:
            D[zh.strip()] = '' if v.strip() == '∅' else v.strip()
keys = sorted([k for k in D if len(k) > 1], key=len, reverse=True)
RE = re.compile('|'.join(re.escape(k) for k in keys))
CJK = re.compile(r'[㐀-鿿豈-﫿]')
DATE = [r'\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日', r'\d{1,2}\s*月\s*\d{1,2}\s*日', r'（?週[日一二三四五六]）?']
PUNCT = '，。、：；！？（）「」『』…～／＋・—'

def covered(t):
    t = RE.sub('', t)
    for d in DATE:
        t = re.sub(d, '', t)
    for ch in list(D):
        if len(ch) == 1:
            t = t.replace(ch, '')
    return not CJK.search(t)

src = open(sys.argv[1], encoding='utf-8').read()
# drop base64 blobs and the dictionary-free regions that never render
src = re.sub(r'data:[a-z/+]+;base64,[A-Za-z0-9+/=]+', '', src)
src = re.sub(r'//[^\n]*', lambda m: '' if CJK.search(m.group(0)) and ('http' not in m.group(0)) else m.group(0), src)
src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
cands = set()
for m in re.finditer(r'[^<>`\'"{}\n=]*[㐀-鿿][^<>`\'"{}\n]*', src):
    t = m.group(0)
    t = re.sub(r'\$\{[^}]*$', '', t)
    for part in re.split(r'\$\{|\}', t):
        part = part.strip(' +,;:()[]|?')
        if CJK.search(part) and len(part) > 1:
            cands.add(part.strip())
miss = sorted(c for c in cands if not covered(c))
out = '\n'.join(miss)
if len(sys.argv) > 2:
    open(sys.argv[2], 'w', encoding='utf-8').write(out)
print('dictionary entries', len(D), '| untranslated pieces', len(miss))
print(out[:6000])
