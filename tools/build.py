# 由 src/studydesk.html（Artifact 版原始碼）產生 GitHub Pages 用的 index.html
# 用法：在 repo 根目錄執行  python3 tools/build.py
import io,os,shutil
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src','studydesk.html')
s=io.open(SRC,encoding='utf8').read()
body=s.replace("const STANDALONE=false;","const STANDALONE=true;")
head='''<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<script>(function(){var L="zh";try{L=JSON.parse(localStorage.getItem("sd-lang"))||"zh"}catch(e){}window.APPLANG=L==="en"?"en":"zh";if(window.APPLANG==="en"){document.documentElement.lang="en";document.write('<script src="i18n-en.js?v=2"><\\/script>')}})();</script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="日課：番茄鐘、月曆、統計、論文地圖、覺察日記與靜心，每天一點，日積月累。資料只存在你的瀏覽器。">
<meta name="theme-color" content="#f6f3ee" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1a17" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="日課 Daily Practice">
<meta property="og:description" content="番茄鐘、論文地圖、覺察日記與靜心。免下載、免註冊，加到手機主畫面就是 App。">
<meta property="og:image" content="https://chuanchishi-cmyk.github.io/daily-practice/icon-512.png">
<meta property="og:url" content="https://chuanchishi-cmyk.github.io/daily-practice/">
<meta property="og:type" content="website">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="日課">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<script>if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)){var hadSW=!!navigator.serviceWorker.controller;addEventListener('load',function(){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){document.addEventListener('visibilitychange',function(){if(!document.hidden)r.update().catch(function(){})});setInterval(function(){r.update().catch(function(){})},36e5)}).catch(function(){})});navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadSW){try{sessionStorage.setItem('sd-updated','1')}catch(e){}var a=document.activeElement;if(!a||!/INPUT|TEXTAREA|SELECT/.test(a.tagName))location.reload()}})}</script>
<style>:root{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
'''
te=body.index('</title>')+len('</title>')
out=head+body[:te]+'\n</head>\n<body>\n'+body[te:]+'\n</body>\n</html>\n'
io.open(os.path.join(ROOT,'index.html'),'w',encoding='utf8').write(out)
# guide.html：版本與「最近更新」跟著 CHANGELOG 自動更新
import re,html as H
ver=re.search(r"const APP_VER='([^']*)'",s).group(1)
cl=s[s.index('const CHANGELOG=['):]
items=re.findall(r"\{d:'(\d{4}-\d\d-\d\d)',lv:'(major|minor)',t:'([^']*)'\}",cl[:cl.index('];')])[:8]
GP=os.path.join(ROOT,'guide.html');g=io.open(GP,encoding='utf8').read()
li=''.join('\n    <li><span class="muted">%s</span>　%s</li>'%(d[5:].replace('-','/'),H.escape(t)) for d,lv,t in items)+'\n  '
g=re.sub(r'<!--AUTO-NEWS-->.*?<!--/AUTO-NEWS-->','<!--AUTO-NEWS-->'+li+'<!--/AUTO-NEWS-->',g,flags=re.S)
g=re.sub(r'<!--AUTO-VER-->.*?<!--/AUTO-VER-->','<!--AUTO-VER-->版本 '+ver+'<!--/AUTO-VER-->',g,flags=re.S)
io.open(GP,'w',encoding='utf8').write(g)
print('built')
