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

// ---------- 第二批：每日上限與排序、篩選搜尋、最近常錯、附加到舊卡、從計時與隨手記加 ----------
{const c2=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Taipei'});
await c2.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date;window.__off=new D(sessionStorage.getItem('__t')||'2026-11-23T10:00:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
  if(localStorage.getItem('studydesk-v1'))return;
  localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes','n-work':'yes'},last:'',cur:null}));
  const M={};for(let i=1;i<=26;i++){M['c'+i]={sub:i%2?'mkA':'mkB',q:'卡 '+i+(i===5?'：分數的通分':''),causes:[i<=3?'粗心':'觀念'],src:i===7?'第 2 回模考・第 7 題':'',rule:i===9?'先畫數線':'',created:i<=3?'2026-11-21':'2026-10-01',stage:1,due:i<=10?'2026-11-20':'2026-11-23',hist:[]}}
  M.c3.due='2026-11-23';M.c3.created='2026-11-22';
  localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{hidden:[],optIn:{},mkSubjects:[{id:'mkA',n:'數學',c:1},{id:'mkB',n:'英文',c:3}],todayWidgets:['due'],timers:[{id:'t1',name:'數學限時',segs:[{n:'作答',s:60}]}]}},days:{'2026-11-23':{j:{park:[{id:'p1',t:'09:00',text:'三角函數的正負號又搞錯',done:false}]}}},mocks:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{},mistakes:M}))});
const p2=await c2.newPage();p2.on('pageerror',e=>errs.push(e.message));
const DB2=()=>p2.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')));
await p2.goto('file://'+SP+'tmk2.html#exam');await p2.waitForTimeout(700);
ok(/待複習 20/.test(await p2.textContent('#mistakes'))&&/另有 6 題明天再來/.test(await p2.textContent('#mistakes')),'每日上限 20：待複習 20 題，另有 6 題明天再來');
const dueBefore=(await DB2()).mistakes;ok(Object.values(dueBefore).filter(m=>m.due<='2026-11-23').length===26,'上限不改 due（26 張仍到期）');
const firstIds=await p2.$$eval('#mkList .mkcard .mkq',e=>e.map(x=>x.textContent));
ok(/^卡 1$/.test(firstIds[0])&&firstIds.slice(0,10).every(t=>+t.match(/\d+/)[0]<=10),'放最久的先（11/20 到期的 10 張排前面）');
const i3=firstIds.findIndex(t=>/^卡 3$/.test(t)),i11=firstIds.findIndex(t=>/^卡 11$/.test(t));ok(i3===9&&i3<i11,'同一天到期：近 7 天常錯的錯因（粗心）優先');
await p2.selectOption('[data-ch=mkCap]','30');await p2.waitForTimeout(200);ok(/待複習 26/.test(await p2.textContent('#mistakes'))&&(await DB2()).meta.main.mkDailyCap===30,'調成每天 30 題');
await p2.selectOption('[data-ch=mkCap]','20');await p2.waitForTimeout(200);
await p2.click('[data-act=msF][data-m=all]');await p2.waitForTimeout(150);
await p2.selectOption('[data-ch=mkFSub]','mkA');await p2.waitForTimeout(150);await p2.selectOption('[data-ch=mkFCause]','粗心');await p2.waitForTimeout(150);
let qs=await p2.$$eval('#mkList .mkq',e=>e.map(x=>x.textContent));ok(qs.length===2&&qs.every(t=>/卡 (1|3)$/.test(t)),'科目＋錯因篩選可疊加（數學・粗心 2 張）');
await p2.click('[data-act=mkFClear]').catch(()=>{});await p2.selectOption('[data-ch=mkFSub]','');await p2.selectOption('[data-ch=mkFCause]','');await p2.waitForTimeout(150);
await p2.fill('#mkQ','模考');await p2.waitForTimeout(150);qs=await p2.$$eval('#mkList .mkq',e=>e.map(x=>x.textContent));ok(qs.length===1&&qs[0]==='卡 7','搜尋出處');
await p2.fill('#mkQ','數線');await p2.waitForTimeout(150);qs=await p2.$$eval('#mkList .mkq',e=>e.map(x=>x.textContent));ok(qs.length===1&&qs[0]==='卡 9','搜尋規則');
ok(await p2.$eval('#mkQ',e=>document.activeElement===e),'打字搜尋時游標不會跑掉');
await p2.fill('#mkQ','');await p2.waitForTimeout(150);
const top=await p2.textContent('.mktop');ok(/數學・粗心\s*2/.test(top.replace(/\s+/g,' '))&&/英文・粗心\s*1/.test(top.replace(/\s+/g,' ')),'近 7 天前三名：數學・粗心 2、英文・粗心 1（'+top.replace(/\s+/g,' ').trim()+'）');
await p2.click('[data-act=mkRange][data-v=all]');await p2.waitForTimeout(150);ok(/觀念/.test(await p2.textContent('.mktop')),'切到「全部」：觀念排進前三');
await p2.click('[data-act=mkRange][data-v="7"]');await p2.waitForTimeout(150);
await p2.locator('.mktopb').first().click();await p2.waitForTimeout(200);qs=await p2.$$eval('#mkList .mkq',e=>e.map(x=>x.textContent));ok(qs.length===2,'點前三名：篩出那些卡');
await p2.click('[data-act=mkFClear]');await p2.waitForTimeout(150);
// similar -> attach
await p2.click('[data-act=mkFormT]');await p2.waitForTimeout(150);await p2.selectOption('#msS','mkA');await p2.waitForTimeout(150);
ok(!(await p2.$('.mksim')),'還沒選錯因時不提示');
await p2.click('[data-act=mkCauseT][data-v=粗心]');await p2.waitForTimeout(150);
ok(/已經有 2 張/.test(await p2.textContent('.mksim')),'同科目同錯因：提示「已經有 2 張」');
await p2.fill('#msQ','又把分母加起來');await p2.selectOption('#mkSimSel','c1');await p2.click('[data-act=msAttach]');await p2.waitForTimeout(250);
let m1=(await DB2()).mistakes.c1;ok(m1.stage===0&&m1.due==='2026-11-24'&&m1.again===1&&m1.agains[0].q==='又把分母加起來','附加到舊卡：回到第一輪、明天複習、又錯 +1');
ok(Object.keys((await DB2()).mistakes).length===26,'附加不會多一張卡');
await p2.click('[data-act=msF][data-m=all]');await p2.waitForTimeout(150);ok(/又錯 1 次/.test(await p2.locator('.mkcard').filter({has:p2.locator('.mkq',{hasText:/^卡 1$/})}).first().textContent()),'卡片顯示「又錯 1 次」');
await p2.click('[data-act=mkFormT] >> text=收起');await p2.waitForTimeout(150);
// from timer post
await p2.evaluate(()=>{localStorage.setItem('sd-tpost',JSON.stringify({id:'x',k:'2026-11-23',min:10}))});await p2.reload();await p2.waitForTimeout(600);
await p2.click('[data-act=tMk]');await p2.waitForTimeout(300);ok(await p2.$eval('#msS',e=>e.value)==='mkA'&&await p2.$eval('#msQ',e=>document.activeElement===e),'計時完成「記到錯題本」：打開表單、帶入科目（數學）');
await p2.click('[data-act=mkFormT] >> text=收起');await p2.waitForTimeout(150);
// from quick notes
await p2.click('[data-act=qnOpen]');await p2.waitForTimeout(300);await p2.locator('.qnrow',{hasText:'三角函數'}).locator('[data-act=qnMk]').click();await p2.waitForTimeout(400);
ok(await p2.inputValue('#msQ')==='三角函數的正負號又搞錯','隨手記「轉到錯題本」：題目帶入');
await p2.selectOption('#msS','mkA');await p2.press('#msQ','Enter');await p2.waitForTimeout(250);
const db2=await DB2();ok(Object.values(db2.mistakes).some(m=>m.q==='三角函數的正負號又搞錯'&&m.created==='2026-11-23')&&db2.days['2026-11-23'].j.park[0].done===true,'加入後：新增錯題（今天日期），隨手記標成處理完');
// today card cap
await p2.goto('file://'+SP+'tmk2.html#today');await p2.reload();await p2.waitForTimeout(500);ok(/另有 \d+ 題明天再來/.test(await p2.textContent('main')),'今日頁也顯示「另有 N 題明天再來」');
await p2.click('[data-act=goReview]');await p2.waitForTimeout(200);ok(/\/ 20/.test(await p2.textContent('#revT')),'複習模式一次最多 20 張');
await c2.close()}
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
