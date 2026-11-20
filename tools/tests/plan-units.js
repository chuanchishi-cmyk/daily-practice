// 計畫地圖：階段可同時進行（最小一步從其他階段遞補、換一個）＋ 跟課學習的單元循環
const {chromium}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tpu.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true')});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+SP+'tpu.html#plan');await pg.waitForTimeout(700);
// 1. project: finish stage 1 steps -> next step comes from another stage
await pg.fill('#npName','測試論文');await pg.click('[data-act=npMode][data-v=full]');await pg.click('[data-act=projNew]');await pg.waitForTimeout(400);
const DB=()=>pg.evaluate(()=>{const S=JSON.parse(localStorage.getItem('studydesk-v1'));return Object.values(S.projects)});
const first=(await DB())[0].stages[0].steps.length;
for(let i=0;i<first;i++){await pg.$eval('.pwfold [data-act=stepDone]',e=>e.click());await pg.waitForTimeout(150);await pg.$eval('.pwfold [data-act=winMore]',e=>e.click());await pg.waitForTimeout(150)}
await pg.waitForTimeout(200);
const sub=await pg.textContent('.pwfold .bigstep');ok(/從其他階段遞補|文獻回顧/.test(sub),'第一階段做完：最小一步從下一個階段遞補（'+sub.trim().slice(0,30)+'）');
const b1=await pg.textContent('.pwfold .bigstep');await pg.$eval('[data-act=nsSwap]',e=>e.click());await pg.waitForTimeout(200);const b2=await pg.textContent('.pwfold .bigstep');ok(b1!==b2,'換一個：換成另一步');
// jump: open stage 4 and check a step there -> current stays there
await pg.locator('.tseg').nth(3).click();await pg.waitForTimeout(200);
await pg.click('.stagecard .step input[type=checkbox]');await pg.waitForTimeout(200);
ok(/階段 4 \//.test(await pg.textContent('.stagecard .eyebrow')),'跳到第 4 階段勾一步：目前停在第 4 階段');
// 2. course
await pg.click('.pchip.add');await pg.waitForTimeout(300);
await pg.click('[data-act=npKind][data-v=units]');ok(await pg.isVisible('#nuName')&&!(await pg.isVisible('#npName')),'選「跟著一套課程」：顯示課程欄位');
await pg.fill('#nuName','Python 入門');await pg.fill('#nuN','12');await pg.click('[data-act=courseNew]');await pg.waitForTimeout(400);
ok(await pg.locator('.useg').count()===12,'建立 12 集：進度格 12 個');
ok(/第 1 集・看/.test(await pg.textContent('.pwfold .bigstep')),'最小一步：第 1 集・看');
// jump around: check 第 3 集 做
await pg.locator('.urow').nth(2).locator('.upill input').nth(1).click();await pg.waitForTimeout(200);
ok(/第 3 集・看/.test(await pg.textContent('.pwfold .bigstep')),'在第 3 集勾了「做」：最小一步跟到第 3 集（'+(await pg.textContent('.pwfold .bigstep')).trim()+'）');
for(const i of [0,2]){await pg.locator('.urow').nth(2).locator('.upill input').nth(i).click();await pg.waitForTimeout(150)}await pg.waitForTimeout(200);
ok(/第 1 集・看/.test(await pg.textContent('.pwfold .bigstep')),'第 3 集完成：回到第一個還沒完成的（第 1 集）');
ok(/完成 1 \/ 12/.test(await pg.textContent('header .chips')),'標頭：完成 1 / 12 集');
await pg.fill('#newUnit','');await pg.click('[data-act=unitAdd]');await pg.waitForTimeout(200);ok(await pg.locator('.useg').count()===13,'加入：自動編號第 13 集');
await pg.fill('#pjLoop','看、跟著打、改錯');await pg.dispatchEvent('#pjLoop','change');await pg.waitForTimeout(300);
const cp=(await DB()).find(x=>x.mode==='units'),lp=[cp.stages[0].steps.map(x=>x.t).join(''),cp.stages[2].steps.map(x=>x.t).join('')];ok(lp[0]==='看跟著打改錯'&&lp[1]==='看做檢查','改循環：只套用到還沒開始的單元');
await pg.$eval('.pwfold [data-act=stepPomo]',e=>e.click());await pg.waitForTimeout(400);ok(await pg.evaluate(()=>JSON.parse(localStorage.getItem('sd-pomo')||'{}').task)==='第 1 集・看','用番茄鐘開始：任務帶入「第 1 集・看」');
await pg.goto('file://'+SP+'tpu.html#plan');await pg.waitForTimeout(500);
await pg.screenshot({path:SP+'plan-units.png',fullPage:false});
ok(!(await pg.$('[data-act=planTab][data-t=meet]')),'課程沒有「會談」分頁');
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
