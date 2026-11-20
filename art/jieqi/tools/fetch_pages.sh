#!/bin/bash
# thumbs.sh <outdir> <width> [vid:page ...]   (reads vols.json next to script)
OUT=$1; W=$2; shift 2; UA="JieqiArtBot/1.0 (educational use; one-off fetch)"
mkdir -p $OUT
python3 -I -c "
import json,sys,re
for v in json.load(open(sys.argv[1])):
  vid=re.search(r'NDL(\d+)',v['title']).group(1); u=v['url'].split('?')[0]; path=u.split('/wikipedia/commons/')[1]; name=path.split('/')[-1]
  for p in range(1,v['pages']+1): print(vid,p,'https://upload.wikimedia.org/wikipedia/commons/thumb/%s/page%d-%spx-%s.jpg'%(path,p,sys.argv[2],name))
" "${VJ:-$(dirname $0)/baien_vols.json}" $W | while read vid p url; do
  if [ $# -gt 0 ]; then case " $* " in *" $vid:$p "*) ;; *) continue;; esac; fi
  dst=$OUT/${vid}_p$(printf %03d $p).jpg; [ -s $dst ] && continue
  for i in 1 2 3 4 5; do
    code=$(curl -sS -A "$UA" -o $dst -w "%{http_code}" "$url")
    [ "$code" = "200" ] && break
    rm -f $dst; echo "429? $code $vid $p; wait $((i*90))"; sleep $((i*90))
  done
  sleep ${DELAY:-2.5}
done
echo "THUMBS FINISHED $(ls $OUT | wc -l)"
