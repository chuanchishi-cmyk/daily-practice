// 目標衝刺的練習計時：跑完一組記進當天，顯示在目標衝刺頁、今日、統計；中途重設（練 5 分鐘以上）記為未完成；不算進番茄
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'ttl.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');window.__off=0;const D=Date;class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+SP+'ttl.html#exam');await pg.waitForTimeout(800);
const day=()=>pg.evaluate(()=>{const S=JSON.parse(localStorage.getItem('studydesk-v1')||'{}');const d=new Date();const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return (S.days||{})[k]||{}});
const segs=await pg.$$eval('.segs span',e=>e.length);
// run one full set, jumping past each segment's end
await pg.click('[data-act=tToggle]');await pg.waitForTimeout(300);
for(let i=0;i<segs;i++){await pg.evaluate(()=>{const T=JSON.parse(localStorage.getItem('sd-xtimer'));window.__off+=Math.max(0,T.endAt-Date.now())+1500});await pg.waitForTimeout(700)}
let d=await day();const t=(d.tests||[])[0]||{};
ok((d.tests||[]).length===1&&t.full&&t.segs===segs&&t.min>0,`跑完一組（${segs} 段）：記下 ${t.name}・${t.min} 分・完成`);
ok(!(d.sessions||[]).length,'不算進番茄（今日專注紀錄沒有新增）');
await pg.evaluate(()=>{location.hash='stats'});await pg.waitForTimeout(200);await pg.evaluate(()=>{location.hash='exam'});await pg.waitForTimeout(500);
let x=await pg.textContent('.xcount');ok(/今天 1 組/.test(x.replace(/\s+/g,' ')),'目標衝刺頁：'+x.replace(/\s+/g,' ').trim());
// partial: 6 minutes then reset
await pg.click('[data-act=tToggle]');await pg.waitForTimeout(300);await pg.evaluate(()=>window.__off+=6*60000);await pg.waitForTimeout(500);
await pg.click('[data-act=tToggle]');await pg.waitForTimeout(300);await pg.click('[data-act=tReset]');await pg.waitForTimeout(400);
d=await day();ok((d.tests||[]).length===2&&!d.tests[1].full&&d.tests[1].min===6,'練 6 分鐘後重設：記為未完成 6 分');
// short partial (2 min) is not recorded
await pg.click('[data-act=tToggle]');await pg.waitForTimeout(300);await pg.evaluate(()=>window.__off+=2*60000);await pg.waitForTimeout(400);await pg.click('[data-act=tReset]');await pg.waitForTimeout(400);
d=await day();ok((d.tests||[]).length===2,'只練 2 分鐘就重設：不記錄');
x=await pg.textContent('.xcount');ok(/1 次未完成/.test(x),'目標衝刺頁顯示未完成次數');
await pg.evaluate(()=>{location.hash='today'});await pg.waitForTimeout(500);
const chip=await pg.evaluate(()=>[...document.querySelectorAll('.ph .chip')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '));ok(/計時 1 組/.test(chip),'今日頁：'+chip);
await pg.evaluate(()=>{location.hash='stats'});await pg.waitForTimeout(500);
const st=await pg.evaluate(()=>[...document.querySelectorAll('section.card h2')].find(h=>/計時/.test(h.textContent))?.closest('section').textContent.replace(/\s+/g,' ').trim()||'');ok(/完成 1 組/.test(st),'統計頁（日）：'+st.slice(0,80));
await pg.click('[data-act=stMode][data-m=week]');await pg.waitForTimeout(400);
const sw=await pg.evaluate(()=>[...document.querySelectorAll('section.card h2')].find(h=>/計時/.test(h.textContent))?.closest('section').textContent.replace(/\s+/g,' ').trim()||'');ok(/完成 1 組/.test(sw),'統計頁（週）：'+sw.slice(0,80));
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
