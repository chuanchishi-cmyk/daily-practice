// 春節卡：小年夜、除夕、初一到初五；今日小語最多三句；驅動力題庫每個價值抽兩句、重新測驗換題；作息比對顯示下一次時間
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tfd.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const open=async(at,seed,hash)=>{const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Taipei'});
  await c.addInitScript(([at,seed])=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes','n-work':'yes'},last:'',cur:null}));
    const D=Date,off=new D(at).getTime()-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD;
    if(seed&&!localStorage.getItem('studydesk-v1'))localStorage.setItem('studydesk-v1',JSON.stringify(seed))},[at,seed]);
  const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));await pg.goto('file://'+SP+'tfd.html'+(hash||'#today'));await pg.waitForTimeout(700);return [c,pg]};
const card=pg=>pg.evaluate(()=>{const e=document.querySelector('.jq');return e?e.innerText.replace(/\s+/g,' '):''});
// 2027 春節 2/6
for(const [d,want] of [['2027-02-03',''],['2027-02-04','小年夜'],['2027-02-05','除夕'],['2027-02-06','春節'],['2027-02-08','春節・初三'],['2027-02-10','春節・初五'],['2027-02-11','']]){
  const [c,pg]=await open(d+'T10:00:00+08:00');const t=await card(pg);ok(want?t.startsWith(want)&&!/明天是|後天是/.test(t):!/春節|除夕|小年夜/.test(t),`${d}：${want||'不顯示春節卡'}（${t.slice(0,16)}）`);await c.close()}
// 今日小語 ≤ 3 句
{const S={meta:{main:{rhAdj:null}},days:{},mocks:{},mistakes:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}};
 // reuse a finished quiz result from fixture if available
 const fx=JSON.parse(fs.readFileSync(require('path').join(__dirname,'fixtures/quiz-v3.json'),'utf8'));S.quiz={q1:fx};
 for(const h of ['09','11','14','16','19','23']){const [c,pg]=await open('2026-11-27T'+h+':10:00+08:00',S);const t=await pg.evaluate(()=>{const e=[...document.querySelectorAll('.todaynotes .tn')].find(x=>/今日小語/.test(x.textContent));return e?e.querySelector('.tnt').textContent:''});
   const n=(t.match(/[。！？!?]/g)||[]).length;ok(n<=3&&n>=1,`${h}:10 今日小語 ${n} 句：${t}`);await c.close()}}
// 驅動力：每個價值兩句、重新測驗換題
{const [c,pg]=await open('2026-11-27T10:00:00+08:00',null,'#quiz');
 const get=async()=>{await pg.evaluate(()=>{const q=JSON.parse(localStorage.getItem('sd-quiz')||'null')||{};q.v=3;q.step=3;q.a=Object.assign({reg:'n'},q.a);localStorage.setItem('sd-quiz',JSON.stringify(q))});await pg.reload();await pg.waitForTimeout(500);
   return pg.evaluate(()=>[...document.querySelectorAll('.qq .qt')].map(e=>e.textContent.replace(/^\s*\d+\s*/,'').trim()).filter(t=>t.length>8))};
 const key=await pg.evaluate(()=>Object.keys(localStorage).filter(k=>/quiz|qz/i.test(k)));
 const a1=await get();const it1=await pg.evaluate(()=>JSON.parse(localStorage.getItem('sd-qzit')||'null'));
 ok(it1&&Object.keys(it1).length===12&&Object.values(it1).every(v=>v.length===2&&v[0]!==v[1]),'12 個價值各抽 2 句（'+key.join(',')+'）');
 await pg.evaluate(()=>{localStorage.removeItem('sd-quiz')});
 const a2=await get();const it2=await pg.evaluate(()=>JSON.parse(localStorage.getItem('sd-qzit')||'null'));
 const same=Object.keys(it1).filter(k=>it1[k].some(i=>it2[k].includes(i))).length;ok(same===0,'重新測驗：每個價值都換成沒用過的句子');
 await c.close()}
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
