// 雁書：寄信 → 起床前看不到回信 → 起床後收到（網站版用主題模板）；提到自傷立刻給求助資訊。作息觀測：早上記睡眠、週報告
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tlt.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date;if(!localStorage.getItem('__base')){localStorage.setItem('__base',String(new D('2026-11-23T22:10:00+08:00')-D.now()))}
  window.__off=+localStorage.getItem('__base')+(+localStorage.getItem('__adv')||0);class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
const go=async(h)=>{await pg.evaluate(h=>{location.hash=h},h);await pg.waitForTimeout(500)};
const adv=async(min)=>{await pg.evaluate(m=>localStorage.setItem('__adv',String((+localStorage.getItem('__adv')||0)+m*60000)),min);await pg.reload();await pg.waitForTimeout(800)};
await pg.goto('file://'+SP+'tlt.html#today');await pg.waitForTimeout(700);
// turn on the letter page via purposes (身心照顧)
await go('prefs');await pg.$eval('[data-act=purOpen]',e=>e.click());await pg.waitForTimeout(200);await pg.click('.purp-o[data-k=mind]');await pg.click('[data-act=purApply]');await pg.waitForTimeout(300);
ok(await pg.evaluate(()=>!!document.querySelector('nav.rail a[href="#letter"]')),'選「身心照顧」後，選單出現雁書');
await go('letter');
await pg.fill('#ltText','最近工作很多，晚上一直睡不著，腦袋停不下來，擔心明天的報告做不完。');await pg.click('[data-act=ltSend]');await pg.waitForTimeout(400);
ok(/1 封信在路上/.test(await pg.textContent('main')),'寄出：信在路上');
await adv(8*60);await go('today');ok(!(await pg.$('.ltcard')),'隔天 06:10（起床前）：還沒有回信');
await adv(90);await go('today');await pg.waitForTimeout(600);await go('today');
ok(!!(await pg.$('.ltcard')),'隔天 07:40（起床後）：今日頁出現「你有一封回信」');
await go('letter');await pg.click('[data-act=ltOpen]');await pg.waitForTimeout(400);
const rep=(await pg.textContent('.letter.reply .ltbody')).trim();
ok(rep.length>=150&&/睡不著|工作很多|腦袋/.test(rep),'回信引用了信中的話（'+rep.length+' 字）：'+rep.slice(0,60)+'…');
ok(/參考《/.test(await pg.textContent('.letter.reply .ltsrc')),'回信標示參考書名：'+(await pg.textContent('.letter.reply .ltsrc')).trim());
await pg.click('[data-act=ltBack]');await pg.waitForTimeout(200);
await pg.fill('#ltText','我覺得好累，有時候真的不想活了。');await pg.click('[data-act=ltSend]');await pg.waitForTimeout(400);
ok(/1925/.test(await pg.textContent('main')),'提到自傷：立刻顯示求助專線');
// sleep log in the morning
await go('today');ok(!!(await pg.$('.slpcard')),'早上：今日頁出現「昨晚睡得好嗎？」');
await pg.fill('#slpB','23:30');await pg.fill('#slpW','07:00');await pg.click('[data-act=slpQ][data-n="4"]');await pg.waitForTimeout(400);
ok(!(await pg.$('.slpcard')),'記下後卡片消失');
// seed a week of sleep logs, then go to Monday
await pg.evaluate(()=>{const S=JSON.parse(localStorage.getItem('studydesk-v1'));const base=new Date(Date.now()+6*864e5);for(let i=1;i<=7;i++){const d=new Date(base.getTime()-i*864e5),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');S.days[k]=S.days[k]||{date:k,j:{}};S.days[k].slp={bed:i%3?'23:40':'01:20',wake:'07:20',q:3}}localStorage.setItem('studydesk-v1',JSON.stringify(S))});
await adv(6*1440);await go('today');
const tc=await pg.evaluate(()=>document.querySelector('.tipcard')?.textContent.replace(/\s+/g,' ')||'');ok(/上週的作息報告/.test(tc),'週一：作息報告「'+tc.slice(0,90)+'…」');
await pg.click('.tipcard [data-act=tipGo]');await pg.waitForTimeout(600);ok(/作息觀測/.test(await pg.textContent('main')),'我的節奏頁：近 14 晚的睡眠');
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
