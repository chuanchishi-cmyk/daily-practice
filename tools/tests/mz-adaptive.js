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
// 7. 新的方法選單：日常說法、只列有教學的方法；新方法有對應教學；只寫方法時每次換一則
await run({[k]:{date:k,j:{practice:[P('n1','',[],{method:'看著自己的心',q:3}),P('n2','聽到外面很吵',['聲音'],{method:'默念標記'}),P('n3','',[],{method:'數呼吸',q:3})]}}},async pg=>{
  const opts=await pg.$$eval('select[data-ch=mMethod] option',o=>o.map(x=>x.textContent));
  ok(['感受呼吸','數呼吸','身體放鬆掃描','慈心祝福','走路靜心','默念標記','看著自己的心','靜靜坐著（開放覺察）'].every(x=>opts.includes(x))&&!opts.includes('呼吸覺察'),'方法選單是日常說法（'+opts.slice(0,8).join('、')+'）');
  let f=await fb(pg,'n1');ok(f.k==='method'&&/Heart of Meditation/.test(f.s),'看著自己的心：給達賴喇嘛看心的做法');
  f=await fb(pg,'n2');ok(/聽到/.test(f.b)&&/馬哈希/.test(f.s),'默念標記＋聲音：給標記「聽到」的做法');
  const a=await fb(pg,'n3'),c=await fb(pg,'n3');ok(a.k==='method'&&a.b!==c.b,'只寫方法：再按一次換一則做法');
  await pg.$$eval('.prcard',els=>els.forEach(e=>e.closest('details')&&(e.closest('details').open=true)));await pg.$$eval('.mzmore',ds=>ds.forEach(d=>d.open=true));await pg.$$eval('.mzt',ds=>ds.forEach(d=>d.open=true));
  const T=await pg.$$eval('.mzt [data-act=mzTeach]',bs=>[...new Set(bs.map(x=>x.dataset.v).filter(Boolean))]);ok(T.includes('達賴喇嘛')&&T.includes('帕奧禪師'),'達賴喇嘛、帕奧禪師可以指定（'+T.join('、')+'）')});
// 8. 舊方法名稱仍對應（計時器記住舊名會換成新名）
await run({[k]:{date:k,j:{practice:[]}}},async pg=>{await pg.evaluate(()=>{localStorage.setItem('sd-mtimer',JSON.stringify({min:10,method:'行走靜心',running:false,endAt:0,left:null}))});await pg.reload();await pg.waitForTimeout(600);
  const v=await pg.$eval('select[data-ch=mMethod]',e=>e.value);ok(v==='走路靜心','舊的「行走靜心」自動換成「走路靜心」')});
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
