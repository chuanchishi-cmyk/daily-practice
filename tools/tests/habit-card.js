// 每日打卡升級（原子習慣）：執行意圖、兩分鐘版本、休一天不算中斷、身分投票、環境安排；今日頁「習慣打卡」小卡；環境設計提示
const {chromium}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'thb.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Taipei'});
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date;window.__off=new D((new URLSearchParams(location.search).get('t'))||'2026-11-27T10:00:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
  if(localStorage.getItem('studydesk-v1'))return;localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes','n-work':'yes'},last:'',cur:null}));
  localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{}},days:{},mocks:{},mistakes:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}}))});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
const DB=()=>pg.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')));
await pg.goto('file://'+SP+'thb.html#today');await pg.waitForTimeout(600);
await pg.evaluate(()=>{const b=[...document.querySelectorAll('[data-act]')].find(x=>/新增頁面/.test(x.textContent));b&&b.click()});await pg.waitForTimeout(300);
await pg.click('[data-act=pgNew][data-t=habit]');await pg.waitForTimeout(500);
let db=await DB();const pid=Object.keys(db.pages)[0],hb=db.pages[pid].blocks.find(x=>x.type==='habit');
ok(!!hb&&db.meta.main.todayWidgets.includes('habits'),'用「習慣養成」建頁：今日自動加上「習慣打卡」小卡');
ok(/寫下什麼時候、在哪裡做/.test(await pg.textContent('.blk')),'還沒設定時，提示寫一句執行意圖');
await pg.click('.blk [data-act=hbSetT]');await pg.waitForTimeout(200);
const f=async(k,v)=>{await pg.fill(`.hbset [data-f=${k}]`,v);await pg.dispatchEvent(`.hbset [data-f=${k}]`,'change');await pg.waitForTimeout(120)};
await f('after','倒完咖啡');await f('mini','穿上跑鞋走五分鐘');await f('who','照顧身體的人');await f('env','跑鞋放在門口');
await pg.click('.hbset [data-act=hbSetT]');await pg.waitForTimeout(200);
const t=await pg.textContent('.blk');ok(/倒完咖啡之後，我會每天運動。/.test(t)&&/我是照顧身體的人/.test(t)&&/累的時候，只要：穿上跑鞋走五分鐘/.test(t)&&/環境：跑鞋放在門口/.test(t),'顯示：接在之後的一句、身分、兩分鐘版本、環境');
await pg.click('.blk [data-act=hbMini]');await pg.waitForTimeout(200);db=await DB();ok(db.pages[pid].blocks.find(x=>x.type==='habit').days['2026-11-27']==='mini','做了最小版：記成「最小版」');
ok(await pg.$('.blk .hcell.mini')!==null,'格子顯示半格');
// never miss twice: 11/24 done, 11/25 missed, 11/26 done, 11/27 mini → chain 4
await pg.evaluate(pid=>{const S=JSON.parse(localStorage.getItem('studydesk-v1'));const b=S.pages[pid].blocks.find(x=>x.type==='habit');Object.assign(b.days,{'2026-11-24':true,'2026-11-26':true,'2026-11-21':true});localStorage.setItem('studydesk-v1',JSON.stringify(S))},pid);
await pg.reload();await pg.waitForTimeout(500);ok(/連續 3 天/.test(await pg.textContent('.blk')),'休一天不算中斷：11/24、26、27 算連續 3 天（11/25 休一天；11/22–23 連續兩天沒做才斷，11/21 不算）');
// tomorrow: missed one day
await pg.goto('file://'+SP+'thb.html?t=2026-11-29T10:00:00%2B08:00'+(await pg.evaluate(()=>location.hash)));await pg.waitForTimeout(500);
ok(/(休一天不算中斷|別連續錯過兩天)/.test(await pg.textContent('.blk .blkcoach')),'昨天沒做：溫和地說「休一天不算中斷」');
await pg.goto('file://'+SP+'thb.html?t=2026-12-01T10:00:00%2B08:00'+(await pg.evaluate(()=>location.hash)));await pg.waitForTimeout(500);
const co=await pg.textContent('.blk .blkcoach');ok(/(最小|兩分鐘)/.test(co)&&/穿上跑鞋/.test(co),'好幾天沒做：建議做兩分鐘版本（'+co+'）');
// vote toast + today widget
await pg.goto('file://'+SP+'thb.html?t=2026-12-01T10:00:00%2B08:00#today');await pg.waitForTimeout(500);
ok(/習慣打卡/.test(await pg.textContent('main'))&&/倒完咖啡之後/.test(await pg.textContent('main')),'今日頁「習慣打卡」小卡顯示這句話');
await pg.click('.hbli [data-act=blkHabit]');await pg.waitForTimeout(150);ok(/又為「照顧身體的人」投了一票/.test(await pg.evaluate(()=>document.body.innerText)),'打卡：「又為照顧身體的人投了一票」');
db=await DB();ok(db.pages[pid].blocks.find(x=>x.type==='habit').days['2026-12-01']===true,'在今日小卡打卡，存進那個區塊');

// 全 App：休一天提醒接回來、隔好幾天從兩分鐘開始；統計與靜心的連續天數休一天不算斷
{const c2=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Taipei'});
 await c2.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');const D=Date;window.__off=new D((new URLSearchParams(location.search).get('t'))||'2026-11-27T10:00:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
  if(localStorage.getItem('studydesk-v1'))return;localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes','n-work':'yes'},last:'',cur:null}));
  const ss=k=>({date:k,sessions:[{t:k+'T09:00:00+08:00',min:25,sub:'R'}],j:{practice:[{id:'m'+k,t:k+'T07:00:00+08:00',min:10}]}});
  const days={};['2026-11-22','2026-11-23','2026-11-25'].forEach(k=>days[k]=ss(k));
  localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{hidden:[]}},days,mocks:{},mistakes:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}}))});
 const p2=await c2.newPage();p2.on('pageerror',e=>errs.push(e.message));
 await p2.evaluate(()=>0).catch(()=>{});await p2.goto('file://'+SP+'thb.html#today');await p2.goto('file://'+SP+'thb.html?t=2026-11-27T10:00:00%2B08:00'+(await p2.evaluate(()=>location.hash)));await p2.waitForTimeout(600);
 let t=await p2.evaluate(()=>document.querySelector('.todaynotes')?document.querySelector('.todaynotes').innerText:'');ok(/接回來/.test(t)&&/(休一天不算中斷|別連續錯過兩天|休息過了)/.test(t),'今日：昨天沒專注，提醒接回來（'+t.replace(/\s+/g,' ').slice(0,40)+'）');
 await p2.goto('file://'+SP+'thb.html?t=2026-11-29T10:00:00%2B08:00'+(await p2.evaluate(()=>location.hash)));await p2.waitForTimeout(600);
 t=await p2.evaluate(()=>document.querySelector('.todaynotes')?document.querySelector('.todaynotes').innerText:'');ok(/兩分鐘/.test(t),'隔了好幾天：從兩分鐘開始');
 await p2.goto('file://'+SP+'thb.html?t=2026-11-25T20:00:00%2B08:00#stats');await p2.waitForTimeout(600);await p2.locator('main .seg button',{hasText:/^日$/}).first().click();await p2.waitForTimeout(300);
 const stt=await p2.evaluate(()=>document.querySelector('main').innerText);ok(/連續專注\s*3/.test(stt),'統計：11/22、23、25 算連續 3 天（11/24 休一天不算斷）');
 await p2.goto('file://'+SP+'thb.html?t=2026-11-25T20:00:00%2B08:00#mind');await p2.waitForTimeout(500);const mt=await p2.evaluate(()=>document.querySelector('main').innerText);ok(/連續\s*3\s*天/.test(mt),'靜心：同樣休一天不算斷');
 await c2.close()}
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
