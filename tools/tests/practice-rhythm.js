// 練習與番茄共用 25／5 節奏：短題組 3 分＋訂正 14 分 → 再一組 3 分＋訂正 8 分 → 累計 28 分提醒休息 → 今日番茄鐘切到短休
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tpr.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');window.__off=0;const D=Date;class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
 if(!localStorage.getItem('studydesk-v1'))localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{tv:2,timers:[{id:'q3',name:'短題組',segs:[{n:'作答',s:180}]},{id:'mock',name:'模擬考',segs:[{n:'整場',s:3000}]}]}},days:{},mocks:{},mistakes:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}}))});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.goto('file://'+SP+'tpr.html#exam');await pg.waitForTimeout(700);
const adv=async m=>{await pg.evaluate(m=>window.__off+=m*60000,m);await pg.waitForTimeout(700)};
const post=async()=>(await pg.evaluate(()=>document.querySelector('.tpost')?.textContent.replace(/\s+/g,' ').trim()||''));
await pg.click('[data-act=tPick][data-id=q3]');await pg.waitForTimeout(200);
await pg.click('[data-act=tToggle]');await pg.waitForTimeout(300);await adv(3.05);
let t=await post();ok(/完成一組（3 分）.*累計 3 分/.test(t),'第一組結束：'+t.slice(0,60));
await pg.click('[data-act=fixGo]');await pg.waitForTimeout(300);await adv(14);
ok(/訂正中/.test(await post()),'訂正計時中');await pg.click('[data-act=fixStop]');await pg.waitForTimeout(400);
t=await post();ok(/累計 17 分/.test(t),'訂正 14 分後：累計 17 分，還不到 25 分（'+t.slice(0,50)+'）');
await pg.click('[data-act=tToggle]');await pg.waitForTimeout(300);await adv(3.05);
await pg.click('[data-act=fixGo]');await pg.waitForTimeout(300);await adv(8);await pg.click('[data-act=fixStop]');await pg.waitForTimeout(400);
t=await post();ok(/已經專注 28 分鐘，休息一下吧/.test(t),'第二組＋訂正後：'+t.slice(0,40));
const d=await pg.evaluate(()=>{const S=JSON.parse(localStorage.getItem('studydesk-v1'));const x=new Date(),k=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');return S.days[k]||{}});
ok((d.tests||[]).length===2&&d.tests[0].fix===14&&d.tests[1].fix===8,'訂正時間記進各組練習（14、8 分）');
ok(!(d.sessions||[]).length,'番茄數不折算');
await pg.click('[data-act=tRest]');await pg.waitForTimeout(400);
const P=await pg.evaluate(()=>JSON.parse(localStorage.getItem('sd-pomo')));ok(P.running&&P.mode==='short'&&P.cycles===1,'按休息：今日番茄鐘切到短休並開始，循環點 +1');
ok(!(await pg.$('.tpost')),'休息後提示消失');
await pg.evaluate(()=>{location.hash='today'});await pg.waitForTimeout(500);
const chip=await pg.evaluate(()=>[...document.querySelectorAll('.ph .chip')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '));ok(/今天專注 28 分/.test(chip),'今天專注含練習與訂正：'+chip);
// long practice: suggests a long break
await pg.evaluate(()=>window.__off+=6*60000);await pg.waitForTimeout(600);
await pg.evaluate(()=>{location.hash='exam'});await pg.waitForTimeout(400);
if(await pg.$('#modal [data-act=recCancel]'))await pg.click('#modal [data-act=recCancel]');
await pg.click('[data-act=tPick][data-id=mock]');await pg.waitForTimeout(200);await pg.click('[data-act=tToggle]');await pg.waitForTimeout(300);await adv(50.1);
t=await post();ok(/長時間練習/.test(t)&&/休息 15 分鐘/.test(t),'50 分鐘模擬考後：建議長休 15 分（'+t.slice(0,40)+'）');
// starting practice while the pomodoro is focusing asks to pause it
await pg.click('[data-act=tPostNo]');await pg.evaluate(()=>{location.hash='today'});await pg.waitForTimeout(400);
await pg.evaluate(()=>{const p=JSON.parse(localStorage.getItem('sd-pomo'));return p.mode});
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
