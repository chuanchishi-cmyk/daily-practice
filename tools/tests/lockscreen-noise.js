// 鎖定畫面播放／暫停控制計時器；白噪音：休息預設潮汐、專注預設不播（舊設定沿用）；用途最多 3 個；更新紀錄
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const srv=require('http').createServer((q,r)=>{try{const f=SP+decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'');const d=fs.readFileSync(f);r.writeHead(200,{'Content-Type':f.endsWith('.mp3')?'audio/mpeg':'text/html; charset=utf-8'});r.end(d)}catch{r.writeHead(404);r.end()}}).listen(0);const BASE='http://127.0.0.1:'+srv.address().port+'/';const b=await chromium.launch();const errs=[];let fail=0;
fs.copyFileSync(require('path').join(__dirname,'../../ocean.mp3'),SP+'ocean.mp3');fs.writeFileSync(SP+'tls.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const mk=async(pre)=>{const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
  await c.addInitScript(p=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');Object.entries(p||{}).forEach(([k,v])=>localStorage.setItem(k,v));
    window.__off=0;const D=Date;class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
    // capture lock-screen handlers and what the page reports to the OS
    window.__ms={};if(navigator.mediaSession){const o=navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);navigator.mediaSession.setActionHandler=(a,f)=>{window.__ms[a]=f;try{o(a,f)}catch{}}}
    // which white-noise buffers start (stereo, looping) = noise playing
    window.__nz=[];const st=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(){if(this.loop&&this.buffer&&this.buffer.numberOfChannels===2)window.__nz.push(this.buffer.length);return st.apply(this,arguments)}},pre);
  const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));await pg.goto(BASE+'tls.html#today');await pg.waitForTimeout(700);return [c,pg]};
let [c,pg]=await mk();
// --- lock screen ---
ok(await pg.evaluate(()=>typeof window.__ms.play==='function'&&typeof window.__ms.pause==='function'),'註冊了鎖定畫面的播放、暫停');
await pg.click('#pToggle');await pg.waitForTimeout(400);
let st=await pg.evaluate(()=>({run:JSON.parse(localStorage.getItem('sd-pomo')).running,ps:navigator.mediaSession.playbackState,t:navigator.mediaSession.metadata&&navigator.mediaSession.metadata.title,a:navigator.mediaSession.metadata&&navigator.mediaSession.metadata.artist}));
ok(st.run&&st.ps==='playing'&&/專注中/.test(st.t)&&/剩 25 分/.test(st.a),'開始後：鎖定畫面顯示「'+st.t+'／'+st.a+'」');
await pg.evaluate(()=>window.__ms.pause());await pg.waitForTimeout(400);
st=await pg.evaluate(()=>({run:JSON.parse(localStorage.getItem('sd-pomo')).running,ps:navigator.mediaSession.playbackState,t:navigator.mediaSession.metadata&&navigator.mediaSession.metadata.title,btn:document.getElementById('pToggle').textContent}));
ok(!st.run&&st.ps==='paused'&&/已暫停/.test(st.t)&&/開始|繼續/.test(st.btn),'鎖定畫面按暫停：計時器暫停，畫面按鈕同步（'+st.btn.trim()+'）');
const left1=await pg.evaluate(()=>JSON.parse(localStorage.getItem('sd-pomo')).left);
await pg.evaluate(()=>window.__off+=60000);await pg.waitForTimeout(400);
await pg.evaluate(()=>window.__ms.play());await pg.waitForTimeout(400);
st=await pg.evaluate(()=>{const p=JSON.parse(localStorage.getItem('sd-pomo'));return {p,ps:navigator.mediaSession.playbackState,rem:(p.endAt-Date.now())/1000}});
ok(st.p.running&&st.ps==='playing'&&Math.abs(st.rem-left1)<3,'鎖定畫面按播放：從暫停處繼續（暫停期間不扣時間）');
// --- white noise: focus default off, break default ocean ---
ok((await pg.evaluate(()=>window.__nz.length))===0,'專注時預設不播白噪音');
await pg.evaluate(()=>window.__off+=25*60000+2000);await pg.waitForTimeout(900);
if(await pg.$('#modal [data-act=recCancel]')){await pg.click('#modal [data-act=recCancel]');await pg.waitForTimeout(300)}
console.log('     now:',await pg.evaluate(()=>{const p=JSON.parse(localStorage.getItem('sd-pomo'));return p.mode+' running='+p.running}));
await pg.click('#pToggle');await pg.waitForTimeout(6000);
ok((await pg.evaluate(()=>window.__nz.length))>0,'短休開始：預設播放潮汐');
await c.close();
// old user who had white noise on during focus keeps it
[c,pg]=await mk({'sd-noise-on':'true','sd-noise-k':'"insects"'});
await pg.click('#pToggle');await pg.waitForTimeout(6000);
ok((await pg.evaluate(()=>window.__nz.length))>0,'舊設定「專注時播蟲鳴」沿用');
await pg.evaluate(()=>{location.hash='prefs'});await pg.waitForTimeout(500);
const sum=await pg.evaluate(()=>[...document.querySelectorAll('details[data-fold=sound] .fsum')].map(e=>e.textContent).join(''));
ok(/專注夜晚蟲鳴、休息潮汐/.test(sum),'設定摘要：'+sum);
const log=await pg.evaluate(()=>!!document.querySelector('details[data-fold=changelog]'));ok(log,'設定裡有「更新紀錄」');
await c.close();
// --- purposes: max 3, no "all" ---
[c,pg]=await mk();
await pg.evaluate(()=>{location.hash='prefs'});await pg.waitForTimeout(400);
await pg.$eval('[data-act=purOpen]',e=>e.click());await pg.waitForTimeout(200);
const opts=await pg.$$eval('.purp-o',e=>e.map(x=>x.dataset.k));ok(!opts.includes('all'),'沒有「全部都看看」（'+opts.join(',')+'）');
for(const k of opts)await pg.click(`.purp-o[data-k=${k}]`);
const n=await pg.$$eval('.purp-o[aria-pressed=true]',e=>e.length);ok(n===3,'最多只能選 3 個（選了 '+n+' 個）');
await c.close();
console.log('errors',errs);await b.close();srv.close();process.exit(fail||errs.length?1:0)})();
