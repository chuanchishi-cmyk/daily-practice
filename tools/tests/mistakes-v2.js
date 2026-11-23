// 錯題本 v2（第一批）：舊卡照常顯示與複習；錯因自訂、可複選、每科目自己的清單；連續新增（Enter 加入，科目錯因出處保留）；出處、規則；編輯不改進度；複習模式先重做再翻面、模糊不改輪次
const {chromium}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tmk2.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Taipei'});
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date;window.__off=new D(sessionStorage.getItem('__t')||'2026-11-23T10:00:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
  if(localStorage.getItem('studydesk-v1'))return;
  localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes','n-work':'yes'},last:'',cur:null}));
  localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{hidden:[],optIn:{},mkSubjects:[{id:'mkA',n:'數學',c:1},{id:'mkB',n:'英文',c:3}],todayWidgets:['due','sessions']}},days:{},mocks:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{},
    mistakes:{old1:{sub:'mkA',q:'舊卡：二次函數頂點',a:'配方',causes:['觀念'],created:'2026-11-20',stage:1,due:'2026-11-23',hist:[{d:'2026-11-21',ok:true}]},old2:{sub:'mkB',q:'舊卡：假設語氣',causes:['單字'],created:'2026-11-22',stage:0,due:'2026-11-23',hist:[]}}}))});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
const DB=()=>pg.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')));
await pg.goto('file://'+SP+'tmk2.html#exam');await pg.waitForTimeout(700);
const list=await pg.textContent('#mistakes');
ok(/舊卡：二次函數頂點/.test(list)&&/已複習 1\/5 次・下次 11\/23/.test(list),'舊卡照常顯示；「已複習 1/5 次・下次 11/23」');
ok(!/第 \d\/6 輪/.test(list),'不再出現「第 x/6 輪」');
ok(!(await pg.$('#mistakes [data-act=msRev]')),'列表上沒有「記得／忘了」');
ok(!(await pg.$('#msQ'))&&await pg.isVisible('[data-act=mkFormT]'),'表單收成「＋ 記一題」');
ok(/開始複習（2）/.test(await pg.textContent('#mistakes')),'有「開始複習（2）」');
// custom causes for 數學
await pg.click('[data-act=mkFormT]');await pg.waitForTimeout(200);
await pg.selectOption('#msS','mkA');await pg.waitForTimeout(200);
ok(await pg.$('[data-act=mkCauseT][data-v=單字]')!==null,'沿用舊卡用過的錯因（單字）');
await pg.click('[data-act=mkCauseEditT]');await pg.waitForTimeout(200);
await pg.check('[data-ch=mkCauseOwn]');await pg.waitForTimeout(200);
await pg.fill('#mkCauseNew','計算錯');await pg.press('#mkCauseNew','Enter');await pg.waitForTimeout(200);
await pg.click('.mkcedit [data-act=mkCauseDel][data-v=單字]');await pg.waitForTimeout(200);
await pg.click('[data-act=mkCauseEditT]');await pg.waitForTimeout(200);
let cfg=(await DB()).meta.main.mkCauses;ok(cfg&&cfg.mkA&&cfg.mkA.includes('計算錯')&&!cfg.mkA.includes('單字'),'數學有自己的錯因清單（加了計算錯、刪了單字）');
await pg.selectOption('#msS','mkB');await pg.waitForTimeout(200);ok(await pg.$('[data-act=mkCauseT][data-v=計算錯]')===null&&await pg.$('[data-act=mkCauseT][data-v=單字]')!==null,'英文仍用共用清單');
await pg.selectOption('#msS','mkA');await pg.waitForTimeout(200);
// continuous add with multi causes
await pg.click('[data-act=mkCauseT][data-v=計算錯]');await pg.click('[data-act=mkCauseT][data-v=粗心]');
await pg.fill('#msSrc','第 3 回模考・第 12 題');
for(let i=1;i<=15;i++){await pg.fill('#msQ','模考錯題 '+i);if(i===1){await pg.fill('#msR','先畫圖再算。符號要檢查兩次。')}await pg.press('#msQ','Enter');await pg.waitForTimeout(120)}
let db=await DB();const added=Object.values(db.mistakes).filter(m=>/模考錯題/.test(m.q));
ok(added.length===15&&added.every(m=>m.sub==='mkA'&&m.causes.join()==='計算錯,粗心'&&m.src==='第 3 回模考・第 12 題'),'連續新增 15 題：不用重選科目，錯因（複選）、出處都保留');
ok(await pg.$eval('#msQ',e=>e.value==='' && document.activeElement===e),'加入後題目清空，游標回到題目欄');
ok(added.find(m=>m.q==='模考錯題 1').rule==='先畫圖再算。符號要檢查兩次。','規則存下來');
await pg.fill('#msQ','第一行');await pg.press('#msQ','Shift+Enter');await pg.type('#msQ','第二行');ok(/第一行\n第二行/.test(await pg.inputValue('#msQ')),'Shift+Enter 換行，不會加入');
await pg.fill('#msQ','');await pg.click('[data-act=mkFormT] >> text=收起');await pg.waitForTimeout(200);
// source autofill after reload
await pg.reload();await pg.waitForTimeout(600);await pg.click('[data-act=mkFormT]');await pg.waitForTimeout(200);ok(await pg.inputValue('#msSrc')==='第 3 回模考・第 12 題','出處自動帶入上一次');
await pg.click('[data-act=mkFormT] >> text=收起');await pg.waitForTimeout(200);
// list shows rule first sentence
await pg.click('[data-act=msF][data-m=all]');await pg.waitForTimeout(200);
const card=pg.locator('.mkcard',{hasText:'模考錯題 1'}).first();ok(/先畫圖再算。/.test(await card.locator('.mkrule').textContent())&&!/符號要檢查/.test(await card.locator('.mkrule').textContent()),'卡片顯示規則的第一句');
// edit keeps progress
const before=(await DB()).mistakes.old1;await pg.locator('.mkcard',{hasText:'舊卡：二次函數頂點'}).locator('[data-act=msEdit]').click();await pg.waitForTimeout(200);
await pg.fill('#mkE_q','舊卡：二次函數頂點（改）');await pg.fill('#mkE_r','頂點用 -b/2a');await pg.click('.mkcard.editing [data-act=mkCauseT][data-v=粗心]');await pg.click('[data-act=msSave]');await pg.waitForTimeout(200);
const after=(await DB()).mistakes.old1;ok(after.q.endsWith('（改）')&&after.rule==='頂點用 -b/2a'&&after.causes.join()==='觀念,粗心'&&after.stage===before.stage&&after.due===before.due&&after.hist.length===before.hist.length,'編輯所有欄位，複習進度不變');
// review mode from today page
await pg.goto('file://'+SP+'tmk2.html#today');await pg.waitForTimeout(600);
const rb=await pg.$('[data-act=goReview]');await rb.click();await pg.waitForTimeout(300);
ok(await pg.isVisible('.revbox')&&/複習 1 \/ 2/.test(await pg.textContent('.revbox')),'今日頁「開始複習」直接進複習模式');
ok(/重做一次/.test(await pg.textContent('.revbox'))&&!(await pg.$('.revback'))&&!(await pg.$('[data-act=revAns]')),'先只顯示題目與提示，沒有答案也不能選');
await pg.click('[data-act=revFlip]');await pg.waitForTimeout(200);
ok(await pg.isVisible('.revback')&&/頂點用 -b\/2a/.test(await pg.textContent('.revback')),'翻面：顯示正解與規則');
await pg.click('[data-act=revAns][data-v=f]');await pg.waitForTimeout(200);
await pg.keyboard.press('Space');await pg.waitForTimeout(150);await pg.keyboard.press('1');await pg.waitForTimeout(200);
ok(/複習完了/.test(await pg.textContent('.revbox'))&&/模糊 1/.test(await pg.textContent('.revbox'))&&/忘了 1/.test(await pg.textContent('.revbox')),'鍵盤：空白鍵翻面、1 忘了；結算頁');
db=await DB();const o1=db.mistakes.old1,o2=db.mistakes.old2;
ok(o1.stage===1&&o1.due==='2026-11-24'&&o1.hist.slice(-1)[0].ok==='fuzzy','模糊：輪次不變、明天再看');
ok(o2.stage===0&&o2.due==='2026-11-24'&&o2.hist.slice(-1)[0].ok===false,'忘了：回到第一輪、明天再來');
await pg.click('.revbox .pri');await pg.waitForTimeout(200);ok(!(await pg.$('.revbox')),'完成：關閉');
// remember advances
await pg.evaluate(()=>sessionStorage.setItem('__t','2026-11-24T10:00:00+08:00'));await pg.goto('file://'+SP+'tmk2.html#exam');await pg.reload();await pg.waitForTimeout(600);
await pg.waitForSelector('[data-act=revOpen]',{timeout:5000}).catch(async()=>console.log('no btn',await pg.evaluate(()=>[new Date().toString(),location.hash,(document.querySelector('#mistakes')||{}).textContent])));await pg.click('[data-act=revOpen]');await pg.waitForTimeout(200);let n=await pg.locator('#revT').textContent();const tot=+n.split('/')[1];
for(let i=0;i<tot;i++){await pg.click('[data-act=revFlip]');await pg.click('[data-act=revAns][data-v="1"]');await pg.waitForTimeout(80)}
await pg.click('.revbox .pri');await pg.waitForTimeout(200);db=await DB();ok(db.mistakes.old1.stage===2&&db.mistakes.old1.due==='2026-12-01'&&!(await pg.$('[data-act=revOpen]')),'記得：往下一輪（7 天後）；複習完，「開始複習」按鈕消失');
await pg.screenshot({path:SP+'mistakes-v2.png'});
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
