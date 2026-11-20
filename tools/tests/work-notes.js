// 工作隨手記與今日隨手記分開；長的內容收起；通話計時；來電一鍵放進三件事；提醒加到手機行事曆（.ics）；工作頁用語
const {chromium}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'twn.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Taipei',acceptDownloads:true});
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date;if(window.__off===undefined)window.__off=new D('2026-11-23T10:00:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
  if(localStorage.getItem('studydesk-v1'))return;
  localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes','n-work':'yes'},last:'',cur:null}));
  localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{hidden:[],optIn:{work:true}}},days:{},mocks:{},mistakes:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}}))});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
const DB=()=>pg.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')).days['2026-11-23'].j.park);
await pg.goto('file://'+SP+'twn.html#today');await pg.waitForTimeout(700);
const long='週末要買的東西：牙膏、洗衣精、貓砂、咖啡豆，還有順路去郵局寄包裹給阿姨，再到書店拿預訂的那本書，回家前記得買菜';
await pg.fill('#parkIn',long);await pg.click('[data-act=parkAdd]');await pg.waitForTimeout(300);
ok(await pg.$('.park .nt.clamp')!==null&&/展開/.test(await pg.textContent('.park .ntmore')),'長的內容：先收成兩行，有「展開」');
await pg.click('.park .ntmore');await pg.waitForTimeout(200);ok(await pg.$('.park .nt.clamp')===null&&/收起/.test(await pg.textContent('.park .ntmore')),'按展開：全文，按鈕變「收起」');
await pg.goto('file://'+SP+'twn.html#work');await pg.waitForTimeout(600);
ok(/工作隨手記/.test(await pg.textContent('.park b'))&&!/牙膏/.test(await pg.textContent('.park')),'工作頁：「工作隨手記」，看不到生活的那則');
ok(/客戶|同事/.test(await pg.getAttribute('#parkIn','placeholder')),'工作隨手記的提示用客戶、同事的說法');
const ph=await pg.$eval('main',e=>e.innerHTML);ok(/準備週會簡報/.test(ph),'番茄任務提示：準備週會簡報、回覆客戶的信');ok(!/讀完第三章/.test(ph),'工作頁不再出現「讀完第三章」');
ok(/換成上班用的/.test(await pg.textContent('main')),'工作頁提議把紀錄標籤換成上班用的');
await pg.click('[data-act=wkTags]');await pg.waitForTimeout(300);ok(await pg.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')).meta.main.subjects.map(x=>x.name).join(','))==='專案,會議,信件與聯絡,學習成長,運動','標籤換成：專案、會議、信件與聯絡、學習成長');
await pg.fill('#parkIn','提醒同事寄會議紀錄');await pg.click('[data-act=parkAdd]');await pg.waitForTimeout(300);
ok((await DB()).find(x=>/同事/.test(x.text)).ctx==='work','工作頁記下的標成工作');
// call timer
await pg.click('[data-act=wkCall]');await pg.waitForTimeout(400);
ok(await pg.isVisible('.qnbox .callbar')&&/通話中/.test(await pg.textContent('.qnbox .callbar')),'接電話：開始計算通話時間');
ok(await pg.$eval('[data-act=qnCtx][data-v=work]',e=>e.getAttribute('aria-pressed'))==='true','隨手記在「工作」分類');
ok(!/牙膏/.test(await pg.textContent('.qnbox'))&&/同事/.test(await pg.textContent('.qnbox')),'工作分類只列工作的');
await pg.evaluate(()=>window.__off+=4*60000+20000);await pg.waitForTimeout(400);
ok(/0?4:2/.test(await pg.textContent('#callT')),'通話計時在走（'+(await pg.textContent('#callT'))+'）');
await pg.fill('#qnIn','林小姐來電：下週二的提案改到週三');await pg.click('[data-act=qnAdd]');await pg.waitForTimeout(300);
let call=(await DB()).find(x=>/林小姐/.test(x.text));ok(call.kind==='來電'&&call.callMin===4&&call.ctx==='work'&&call.remind,'記下來電：存了通話 4 分鐘、工作、提醒');
ok(!(await pg.$('.callbar')),'記下後通話結束');
await pg.click('.qnbox [data-act=close]');await pg.waitForTimeout(300);
ok(/通話 1 通・4 分/.test(await pg.textContent('header .chips')),'工作頁標頭：今天通話 1 通・4 分');
// calendar
await pg.evaluate(()=>{window.__opened=[];window.open=u=>{window.__opened.push(u);return null}});
await pg.locator('.park .parkit',{hasText:'林小姐'}).locator('[data-act=remCal]').click();await pg.waitForTimeout(200);
const u=(await pg.evaluate(()=>window.__opened))[0]||'';ok(/calendar\.google\.com.*action=TEMPLATE/.test(u)&&/%E6%9E%97/.test(u)&&/dates=20261123T/.test(u),'加到行事曆（claude.ai 版）：打開 Google 日曆新增活動');
// one tap to top3
const row=pg.locator('.park .parkit',{hasText:'林小姐'});await row.locator('[data-act=qnTop]').click();await pg.waitForTimeout(300);
const tp=await pg.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')).days['2026-11-23'].j.top3);ok((tp||[]).some(x=>x&&/林小姐/.test(x.t)),'來電一鍵放進三件事');
// call end via button
await pg.click('[data-act=wkCall]');await pg.waitForTimeout(300);await pg.click('.qnbox [data-act=close]');await pg.waitForTimeout(300);
ok(await pg.isVisible('main .callbar'),'工作頁也顯示通話中');await pg.click('main [data-act=callEnd]');await pg.waitForTimeout(300);ok(!(await pg.$('main .callbar')),'結束通話');
// today: no work items
await pg.goto('file://'+SP+'twn.html#today');await pg.waitForTimeout(600);ok(!/同事|林小姐/.test(await pg.textContent('.park')),'今日的隨手記不混工作的');
await pg.screenshot({path:SP+'work-notes.png'});
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
