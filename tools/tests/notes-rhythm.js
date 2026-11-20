// 隨手記收件匣＋作息觀測第二期（兩週校正、趨勢）＋第三期（驅動力對照，使用者開啟）
const {chromium}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tnr.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Taipei'});
const QF=JSON.parse(fs.readFileSync(require('path').join(__dirname,'fixtures/quiz-v3.json'),'utf8'));
await c.addInitScript(QF=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date,off=new D('2026-11-20T10:30:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD;
  if(localStorage.getItem('studydesk-v1'))return;
  const ad=(k,n)=>{const d=new D(k+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const S={meta:{main:{}},days:{},mocks:{},mistakes:{},projects:{},reviews:{},quiz:{q1:QF},quotes:{},pnotes:{},pages:{}};
  for(let i=0;i<14;i++){const k=ad('2026-11-20',-i);S.days[k]={date:k,j:{},sessions:[{t:new D(k+'T15:10:00+08:00').getTime(),min:50,sub:'T'}],slp:{bed:'01:00',wake:'08:45',q:3}}}
  S.days['2026-11-19'].j={free:'今天完成了第二章的進度，終於達成目標。',wins:['把成績單整理好','完成報告初稿'],park:[{id:'pk1',t:'09:00',text:'回老師的信',done:false}]};
  S.days['2026-11-18'].j={good:'進度比預期好，效率很高',wins:['完成三題']};
  S.days['2026-11-17'].j={adjust:'明天要先完成最難的部分',moments:[{t:'14:00',w:'擔心來不及完成',e:''}]};
  S.pnotes={n1:{proj:'p1',kind:'想法',text:'第三章可以加入訪談資料',d:'2026-11-19',done:false}};
  S.projects={p1:{name:'論文',type:'thesis',flex:true,created:'2026-10-01',stages:[{id:'s1',name:'文獻回顧',start:'',end:'',status:'',note:'',steps:[{id:'x1',t:'讀一篇',done:false}]}],meetings:[],wins:[],prep:[],next:null}};
  localStorage.setItem('studydesk-v1',JSON.stringify(S));localStorage.setItem('sd-first','"2026-10-01"')},QF);
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+SP+'tnr.html#today');await pg.waitForTimeout(900);
// ---- 隨手記
ok(await pg.isVisible('.qnfab'),'每頁都有隨手記按鈕');
await pg.click('.qnfab');await pg.waitForTimeout(300);
const rows=await pg.locator('.qnrow').count();ok(rows===3,'收件匣集中三處：停車場、計畫筆記、覺察片段（'+rows+' 則）');
await pg.fill('#qnIn','查那篇文章的出處');await pg.click('[data-act=qnKind][data-k=問題]');await pg.click('[data-act=qnAdd]');await pg.waitForTimeout(300);
ok(/查那篇文章的出處[\s\S]*問題/.test(await pg.textContent('.qnlist')),'記下一則（標成「問題」）');
await pg.locator('.qnrow',{hasText:'回老師的信'}).locator('[data-act=qnTop]').click();await pg.waitForTimeout(300);
let db=await pg.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')));
ok((db.days['2026-11-20'].j.top3||[]).some(x=>x&&x.t==='回老師的信'),'放進三件事：今天的三件事多一項');
ok(db.days['2026-11-19'].j.park[0].done===true,'放進三件事後：原本的那則標成處理完');
await pg.locator('.qnrow',{hasText:'第三章可以加入訪談資料'}).locator('[data-act=qnStep]').click();await pg.waitForTimeout(300);
db=await pg.evaluate(()=>JSON.parse(localStorage.getItem('studydesk-v1')));
ok(db.projects.p1.stages[0].steps.some(x=>x.t==='第三章可以加入訪談資料'),'計畫筆記轉成步驟：加到論文目前的階段');
await pg.screenshot({path:SP+'qn.png'});
await pg.click('.qnbox [data-act=close]');await pg.waitForTimeout(200);
{
  await pg.goto('file://'+SP+'tnr.html#quiz');await pg.waitForTimeout(900);
  const tr=await pg.textContent('main');ok(/作息的變化/.test(tr)&&/01:00/.test(tr),'我的節奏頁：每兩週的作息變化表');
  ok(await pg.isVisible('[data-act=rhApply]'),'跟測驗差很多：出現「照實際作息更新」');
  await pg.click('[data-act=rhApply]');await pg.waitForTimeout(400);
  ok(/已在 .* 依實際紀錄校正（入睡 01:00、起床 08:45/.test(await pg.textContent('main')),'更新後：我的節奏改用實際作息');
  await pg.click('[data-act=drvOn]');await pg.waitForTimeout(400);
  const dv=await pg.textContent('main');ok(/最近的紀錄裡(最)?常出現「成就」/.test(dv),'驅動力對照：找出常出現的「成就」');
  await pg.screenshot({path:SP+'rh.png',fullPage:true});
}
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
