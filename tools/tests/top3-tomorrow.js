// 今天的三件事 → 晚上出現「明天的三件事」→ 順延 → 隔天早上看到昨晚排好的；昨天沒做完的可以放下
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'t3t.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
// 從「下一個整點日的 10:00（台北）」開始
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date;if(!localStorage.getItem('__base')){const n=new D();const t=new D(n.getFullYear(),n.getMonth(),n.getDate()+1,10,0,0);localStorage.setItem('__base',String(t.getTime()-D.now()))}
  window.__off=+localStorage.getItem('__base')+(+localStorage.getItem('__adv')||0);
  class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const at=async(dayOff,h,m=0)=>{await pg.evaluate(([d,h,m])=>{const n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate(),h,m,0);t.setDate(t.getDate()+d);if(document.activeElement)document.activeElement.blur();window.__off+=t.getTime()-Date.now()},[dayOff,h,m]);await pg.waitForTimeout(900)};
const k0=async()=>pg.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')});
const txt=sel=>pg.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent).join(' | '),sel);
const val=id=>pg.evaluate(i=>{const e=document.getElementById(i);return e?e.value:null},id);
await pg.goto('file://'+SP+'t3t.html#today');await pg.waitForTimeout(800);
const d1=await k0();
ok(!(await txt('.card h2')).includes('明天最重要的三件事'),'10:00 沒有「明天的三件事」');
await pg.fill('#t3t'+d1+'0','寫論文第二節');await pg.fill('#t3t'+d1+'1','回信給老師');await pg.fill('#t3t'+d1+'2','運動');
await pg.check('#t3c'+d1+'1');await pg.waitForTimeout(700);
// 20:00（沒有做「我的節奏」：一般作息 23:30 睡 → 19:30 出現）
await at(0,20,0);
ok((await txt('.card h2')).includes('明天最重要的三件事'),'20:00 出現「明天的三件事」');
ok((await txt('.carry p')).includes('今天還有 2 件沒完成'),'列出今天沒做完的 2 件');
await pg.click('.carry [data-act=t3mv][data-m=next]');await pg.waitForTimeout(500);
const d2=await pg.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')});
ok(await val('t3t'+d2+'0')==='寫論文第二節','移到明天：出現在明天第一格');
await pg.click('.carry [data-act=t3mv][data-m=drop]');await pg.waitForTimeout(500);
ok(!(await pg.$('.carry')),'兩件都處理後，順延清單消失');
await pg.fill('#t3t'+d2+'1','整理參考書目');await pg.waitForTimeout(700);
// 22:30：快到睡覺時間，小建議卡隱藏
await at(0,22,30);ok(!(await pg.$('.tipcard')),'22:30 不顯示小建議卡');
// 覺察日記：晚上夜晚回顧排第一、裡面有明天的三件事
await pg.evaluate(()=>{location.hash='journal'});await pg.waitForTimeout(700);
const first=await pg.evaluate(()=>{const s=[...document.querySelectorAll('.gridA>.stack>*')];return s[1]?s[1].textContent.slice(0,12):''});
ok(first.includes('夜晚'),'晚上的日記：夜晚・回顧排在早晨意向之後的第一個（'+first+'）');
ok(await val('t3t'+d2+'1')==='整理參考書目','日記裡的明天三件事與今日頁同步');
// 隔天 08:00
await pg.evaluate(()=>{location.hash='today'});await pg.waitForTimeout(400);
await at(1,8,0);
ok((await txt('.card h2')).includes('昨晚排好的'),'隔天早上：標示「昨晚排好的」');
ok(await val('t3t'+d2+'0')==='寫論文第二節','隔天早上：順延的事出現在今天');
ok((await txt('.t3c')).includes('↻1'),'標示順延 1 次');
ok(!(await pg.$('.carry')),'前一晚已處理，早上不再問');
ok(!(await txt('.card h2')).includes('明天最重要的三件事'),'早上沒有「明天的三件事」');
// 第二天沒有在晚上處理 → 第三天早上詢問
await at(1,9,0);
ok((await txt('.carry p')).includes('昨天還有 2 件沒完成'),'第三天早上：詢問昨天沒做完的 2 件');
await pg.click('.carry [data-act=t3mv][data-m=next]');await pg.waitForTimeout(400);
ok((await txt('.t3c')).includes('↻2'),'再順延一次：↻2');
await pg.click('.carry [data-act=t3mv][data-m=drop]');await pg.waitForTimeout(400);
ok(!(await pg.$('.carry')),'放下後清單消失');
// 回顧：順延次數
await pg.evaluate(()=>{location.hash='journal'});await pg.waitForTimeout(400);await pg.click('[data-act=jTab][data-v=review]');await pg.waitForTimeout(500);
ok((await txt('.kpi')).includes('順延'),'回顧：三件事完成率旁顯示順延次數');
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
