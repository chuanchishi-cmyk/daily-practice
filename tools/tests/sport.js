// 運動頁：預設隱藏、用途可打開、第一次選項目、瑜珈序列（左右換邊）與感受紀錄、健身組數與組間休息、上次成績、慢跑配速、步數
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tsp.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');window.__off=+(localStorage.getItem('__off')||0);const D=Date;class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+SP+'tsp.html#today');await pg.waitForTimeout(700);
const nav=()=>pg.evaluate(()=>[...document.querySelectorAll('nav.rail a')].map(a=>a.getAttribute('href')).join(' '));
ok(!(await nav()).includes('#sport'),'運動頁預設不顯示');
await pg.evaluate(()=>{location.hash='prefs'});await pg.waitForTimeout(400);
await pg.$eval('[data-act=purOpen]',e=>e.click());await pg.waitForTimeout(200);
ok(await pg.$('.purp-o[data-k=sport]')!==null,'用途選擇有「運動與身體」');
await pg.click('.purp-o[data-k=sport]');await pg.click('.purp-o[data-k=focus]');await pg.click('[data-act=purApply]');await pg.waitForTimeout(400);
ok((await nav()).includes('#sport'),'選了運動與身體後，選單出現運動頁');
await pg.evaluate(()=>{location.hash='sport'});await pg.waitForTimeout(400);
ok(/你想記錄哪些運動/.test(await pg.textContent('h1')),'第一次進入：選擇運動項目');
await pg.click('[data-act=spChoose][data-v=run]');await pg.click('[data-act=spChoose][data-v=steps]');await pg.click('[data-act=spPickDone]');await pg.waitForTimeout(300);
const tabs=await pg.$$eval('[data-act=spTab]',e=>e.map(x=>x.textContent));ok(tabs.join()==='瑜珈,健身,慢跑,日行萬步','項目分頁：'+tabs.join('、'));
// yoga: run the bedtime sequence by jumping time
await pg.click('[data-act=spSeq][data-id=night]');await pg.waitForTimeout(200);
await pg.click('[data-act=spYogaGo]');await pg.waitForTimeout(300);
const steps=[];for(let i=0;i<20;i++){const t=await pg.evaluate(()=>{const p=document.querySelector('.ypose');return p?p.textContent.trim():''});if(!t)break;steps.push(t);await pg.evaluate(()=>window.__off+=181000);await pg.waitForTimeout(450)}
ok(steps.length===9&&steps.some(s=>/仰臥扭轉\s*左側/.test(s))&&steps.some(s=>/仰臥扭轉\s*右側/.test(s)),'睡前伸展：9 個步驟，左右自動換邊（'+steps.slice(0,4).join('→')+'…）');
ok(/完成「睡前伸展」/.test(await pg.textContent('main')),'序列結束：出現感受紀錄');
await pg.click('[data-act=spFeel][data-f=flex][data-n="4"]');await pg.fill('#spNote','左髖較緊');await pg.click('[data-act=spYogaSave]');await pg.waitForTimeout(300);
const rec=await pg.evaluate(()=>[...document.querySelectorAll('section.card')].find(x=>/最近的紀錄/.test(x.querySelector('h2')?.textContent||''))?.querySelector('.li .grow')?.textContent||'');ok(/睡前伸展・\d+ 分・柔軟 4/.test(rec),'瑜珈紀錄：'+rec);
// gym
await pg.click('[data-act=spTab][data-v=gym]');await pg.waitForTimeout(200);
await pg.fill('#gExN','深蹲');await pg.click('[data-act=gymExAdd]');await pg.waitForTimeout(200);
await pg.fill('#gR0','8');await pg.fill('#gW0','40');await pg.click('[data-act=gymSet][data-i="0"]');await pg.waitForTimeout(300);
ok(/組間休息/.test(await pg.textContent('main'))&&/01:30|01:29/.test(await pg.textContent('#spTime')),'完成一組：自動開始 90 秒組間休息');
await pg.evaluate(()=>window.__off+=91000);await pg.waitForTimeout(500);
ok(!(await pg.$('#spTime')),'休息結束');
await pg.click('[data-act=gymSet][data-i="0"]');await pg.waitForTimeout(300);await pg.click('[data-act=spStop]');await pg.waitForTimeout(200);
await pg.click('[data-act=gymSave]');await pg.waitForTimeout(300);
const g=await pg.evaluate(()=>[...document.querySelectorAll('section.card')].find(x=>/最近的紀錄/.test(x.querySelector('h2')?.textContent||''))?.querySelector('.li .grow')?.textContent||'');ok(/深蹲 2 組/.test(g),'健身紀錄：'+g);
// next day: last time shown + same-part warning
await pg.evaluate(()=>{localStorage.setItem('__off',String(window.__off+864e5))});await pg.reload();await pg.waitForTimeout(700);
await pg.evaluate(()=>{location.hash='sport'});await pg.waitForTimeout(300);await pg.click('[data-act=spTab][data-v=gym]');await pg.waitForTimeout(200);
await pg.fill('#gExN','深蹲');await pg.click('[data-act=gymExAdd]');await pg.waitForTimeout(300);
const gm=(await pg.textContent('main')).replace(/\s+/g,' ');ok(/上次（.*）：8×40kg、8×40kg/.test(gm),'隔天：顯示上次成績');ok(/昨天練過腿/.test(gm),'隔天：提醒同部位休息 48 小時');
// run
await pg.click('[data-act=spTab][data-v=run]');await pg.waitForTimeout(200);
await pg.fill('#cdD','5');await pg.fill('#cdM','30');await pg.waitForTimeout(100);
ok(/配速 6'00"/.test(await pg.textContent('#cdPace')),'慢跑：自動算配速 '+await pg.textContent('#cdPace'));
await pg.click('[data-act=cdSave]');await pg.waitForTimeout(300);
// steps
await pg.click('[data-act=spTab][data-v=steps]');await pg.waitForTimeout(200);await pg.fill('#stpN','9200');await pg.click('[data-act=stpSave]');await pg.waitForTimeout(300);
ok(/9,200 步/.test(await pg.textContent('main')),'步數紀錄');
const day=await pg.evaluate(()=>{const S=JSON.parse(localStorage.getItem('studydesk-v1'));const d=new Date(),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return S.days[k]||{}});
ok(!(day.sessions||[]).length,'不算進番茄');
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
