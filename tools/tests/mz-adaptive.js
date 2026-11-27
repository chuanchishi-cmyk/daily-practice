// 靜心回饋：貼近寫下的內容優先於老師輪流；另一本書說到同一點時「也可以這樣看」；同樣的困難反覆出現時換角度並溫和追問；智者大師可指定
const {chromium}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tmza.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const k=new Date(Date.now()+8*3600e3).toISOString().slice(0,10),ago=n=>new Date(Date.now()+8*3600e3-n*864e5).toISOString().slice(0,10);
const run=async(seed,fn)=>{const c=await b.newContext({viewport:{width:390,height:844}});
  await c.addInitScript(([seed])=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');if(localStorage.getItem('studydesk-v1'))return;
    localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{}},days:seed,mocks:{},mistakes:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}}))},[seed]);
  const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));await pg.goto('file://'+SP+'tmza.html#mind');await pg.waitForTimeout(700);await fn(pg);await c.close()};
const P=(id,note,dist,extra)=>Object.assign({id,t:new Date().toISOString(),min:10,method:'呼吸覺察',note,q:2,dist},extra||{});
const fb=async(pg,id)=>{await pg.$$eval('.prcard',els=>els.forEach(e=>e.closest('details')&&(e.closest('details').open=true)));await pg.$eval(`[data-act=prFb][data-id=${id}]`,e=>e.click());await pg.waitForTimeout(250);
  return pg.evaluate(id=>{const S=JSON.parse(localStorage.getItem('studydesk-v1'));for(const d of Object.values(S.days))for(const p of ((d.j||{}).practice||[]))if(p.id===id)return p.fb;return null},id)};
// 1. relevance beats rotation: 跪姿 / 飯後 → pick the matching explanation every time
await run({[k]:{date:k,j:{practice:[P('a1','吃完飯後坐，一直打瞌睡、頭往下垂',['昏沈'])]}}},async pg=>{
  const seen=[];for(let i=0;i<3;i++){const f=await fb(pg,'a1');seen.push(f.s)}
  ok(seen.every(s=>/智者大師|聖嚴法師《禪的體驗/.test(s)),'寫「飯後、打瞌睡、頭往下垂」：連續三次都挑談飲食與垂頭的說明（'+seen.map(s=>s.slice(0,6)).join('／')+'）');
  const f=await fb(pg,'a1');ok(!!f.m2&&f.s2!==f.s,'另一位老師也談到時，附上「也可以這樣看」（'+String(f.s2).slice(0,10)+'）');
  await pg.$$eval('.prcard',els=>els.forEach(e=>e.closest('details')&&(e.closest('details').open=true)));await pg.$eval('.mzmore',d=>d.open=true);ok(await pg.isVisible('.mzalso'),'畫面上看得到「也可以這樣看」')});
// 2. same note twice with equal relevance → different explanation (new angle)
await run({[k]:{date:k,j:{practice:[P('b1','心很亂',['掉舉'])]}}},async pg=>{const a=await fb(pg,'b1'),c=await fb(pg,'b1');ok(a.m!==c.m,'同樣的內容再按一次：換一則說明（不同角度）')});
// 3. repeated difficulty → gentle follow-up
const hist={};for(const [i,d] of [[1,3],[2,6]].entries()){const kk=ago(d[1]);hist[kk]={date:kk,j:{practice:[P('h'+i,'又想睡了',['昏沈'],{fb:{k:'dull'}})]}}}
hist[k]={date:k,j:{practice:[P('c1','還是很想睡',['昏沈'])]}};
await run(hist,async pg=>{const f=await fb(pg,'c1');ok(/昏沉/.test(f.fu||'')&&/[？?]/.test(f.fu||''),'三週內第三次昏沉：溫和地多問一句（'+String(f.fu).slice(0,30)+'…）');
  await pg.$$eval('.prcard',els=>els.forEach(e=>e.closest('details')&&(e.closest('details').open=true)));ok(await pg.isVisible('.mzfu'),'追問顯示在回饋裡')});
await run({[k]:{date:k,j:{practice:[P('d1','第一次坐，很想睡',['昏沈'])]}}},async pg=>{const f=await fb(pg,'d1');ok(!f.fu,'第一次出現：不追問')});
// 4. Zhiyi selectable
await run({[k]:{date:k,j:{practice:[P('e1','念頭一直跑出來',['念頭'])]}}},async pg=>{await fb(pg,'e1');await pg.$$eval('.prcard',els=>els.forEach(e=>e.closest('details')&&(e.closest('details').open=true)));
  await pg.$eval('.mzmore',d=>d.open=true);await pg.$eval('.mzt',d=>d.open=true);ok(await pg.isVisible('.mzt [data-v="智者大師"]'),'可以指定智者大師');
  await pg.$eval('.mzt [data-v="智者大師"]',e=>e.click());await pg.waitForTimeout(300);const f=await fb(pg,'e1');ok(/智者大師《修習止觀坐禪法要》/.test(f.s),'指定後由智者大師回應（'+f.s+'）')});

// 5. 依修行方式：行走、慈心、開放覺察先給對應方法的教學
await run({[k]:{date:k,j:{practice:[P('w1','走一走心還是很亂',['掉舉'],{method:'行走靜心'}),P('m1','想到那個人就生氣',['情緒'],{method:'慈心'}),P('o1','念頭很多',['念頭'],{method:'開放覺察'}),P('g1','',[],{method:'行走靜心',q:3})]}}},async pg=>{
  let f=await fb(pg,'w1');ok(/腳/.test(f.b)&&/牛的印跡/.test(f.s),'行走靜心＋心亂：給經行的做法（'+f.b.slice(0,20)+'…）');
  f=await fb(pg,'m1');ok(/慈心/.test(f.b)&&/智者大師/.test(f.s),'慈心＋生氣：給慈心的做法（'+f.b.slice(0,20)+'…）');
  f=await fb(pg,'o1');ok(/開放覺察|默照/.test(f.b+f.m),'開放覺察＋念頭：給默照的說明');
  f=await fb(pg,'g1');ok(f.k==='method'&&/腳|走/.test(f.b),'只寫了方法、沒寫狀況：仍給行走的提醒')});
// 6. 語氣：內斂的書寫者，開頭語沒有情感濃的句子
await run({[k]:{date:k,j:{practice:[P('t1','身體不舒服，腿很痛',['身體不適'])]}}},async pg=>{const L=[];for(let i=0;i<6;i++){const f=await fb(pg,'t1');L.push(f.a)}
  ok(!L.some(a=>/辛苦了|很不容易|真替你高興|很珍貴|謝謝你願意坐下來/.test(a)),'內斂的書寫者：承接語都是內斂的（'+[...new Set(L)].join('／')+'）')});
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
