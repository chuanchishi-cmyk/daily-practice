// 我的節奏：每兩個月用近 60 天紀錄比對作息類型與高峰時段，先問「要更新報告嗎？」，更新後報告標示「依紀錄更新」
const {chromium}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const path=require('path');const SRC=path.join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'trr.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const QF=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/quiz-v3.json'),'utf8'));QF.date='2026-09-01';QF.at='2026-09-01T10:00:00.000Z';
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,timezoneId:'Asia/Taipei'});
await c.addInitScript(QF=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  const D=Date,off=new D('2026-11-26T10:00:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD;
  if(localStorage.getItem('studydesk-v1'))return;localStorage.setItem('sd-first','"2026-09-01"');localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes','n-work':'yes'},last:'',cur:null}));
  const ad=n=>{const d=new D('2026-11-26T12:00:00+08:00');d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};const S={meta:{main:{rhAdj:{sleep:120,wake:600,at:'2026-11-01'}}},days:{},mocks:{},mistakes:{},projects:{},reviews:{},quiz:{q1:QF},quotes:{},pnotes:{},pages:{}};
  for(let i=0;i<60;i++){const k=ad(i);S.days[k]={date:k,j:{},counts:{},slp:{bed:'02:00',wake:'10:00',q:3},sessions:[{t:new D(k+'T21:10:00+08:00').getTime(),min:50,sub:'T'}]}}
  localStorage.setItem('studydesk-v1',JSON.stringify(S))},QF);
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+SP+'trr.html#today');await pg.waitForTimeout(900);
const tc=await pg.$eval('.tipcard',e=>e.textContent).catch(()=>'');ok(/兩個月下來/.test(tc)&&/作息類型/.test(tc)&&/高峰時段/.test(tc),'兩個月的回顧卡：「'+tc.replace(/\s+/g,' ').slice(0,80)+'…」');
ok(/先不要/.test(tc),'可以選「先不要」');
await pg.click('.tipcard [data-act=tipGo]');await pg.waitForTimeout(400);
await pg.goto('file://'+SP+'trr.html#quiz');await pg.waitForTimeout(900);const m=await pg.textContent('main');
ok(/作息類型\s*依紀錄更新/.test(m)&&/明顯夜型|偏夜型/.test(m),'更新後：報告的作息類型改用紀錄，並標示「依紀錄更新」');
ok(/高峰時段\s*依紀錄更新/.test(m)&&/晚上/.test(m.match(/高峰時段[\s\S]{0,40}/)[0]),'高峰時段也更新為晚上');
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
