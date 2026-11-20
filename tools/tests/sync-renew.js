// 雲端同步：通行證存在 localStorage（關掉再開一小時內不必重連）；過期後點一下同步標籤就續上，帶上記住的帳號（login_hint），不用再選
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const HTML=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const c=await b.newContext({viewport:{width:390,height:844}});
await c.route('https://rike.test/**',r=>{const u=r.request().url();if(/\.html|\/$/.test(u))return r.fulfill({contentType:'text/html',body:HTML});r.fulfill({status:404,body:''})});
await c.route('https://accounts.google.com/gsi/client',r=>r.fulfill({contentType:'text/javascript',body:`window.__req=[];window.google={accounts:{oauth2:{initTokenClient:cfg=>({requestAccessToken:o=>{window.__req.push(Object.assign({scope:cfg.scope},o));setTimeout(()=>cfg.callback({access_token:'tok'+window.__req.length,expires_in:3600}),10)}}),revoke:()=>{}}}};`}));
await c.route('https://www.googleapis.com/**',r=>{const u=r.request().url();
  if(/\/about/.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({user:{emailAddress:'me@example.com'}})});
  if(/files\?spaces/.test(u))return r.fulfill({contentType:'application/json',body:JSON.stringify({files:[]})});
  r.fulfill({contentType:'application/json',body:'{"id":"f1"}'})});
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true')});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('https://rike.test/index.html#prefs');await pg.waitForTimeout(800);
const on=await pg.$('[data-act=gdOn]');ok(!!on,'設定頁有「連上 Google 雲端硬碟」');
await on.click();await pg.waitForTimeout(800);
let st=await pg.evaluate(()=>({req:window.__req,tok:JSON.parse(localStorage.getItem('sd-gd-tok')||'null'),hint:JSON.parse(localStorage.getItem('sd-g-hint')||'""')}));
ok(st.req.length===1&&st.req[0].prompt==='consent','第一次連線：請你同意');
ok(st.tok&&st.tok.tok==='tok1','通行證存在 localStorage');ok(st.hint==='me@example.com','記住是哪個 Google 帳號');
// reopen within the hour
const p2=await c.newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.goto('https://rike.test/index.html#today');await p2.waitForTimeout(1500);
ok(!/續上/.test(await p2.textContent('#syncChip')),'關掉再打開（一小時內）：不必重連（'+(await p2.textContent('#syncChip'))+'）');
await p2.close();
// expired
await pg.evaluate(()=>{const t=JSON.parse(localStorage.getItem('sd-gd-tok'));t.exp=Date.now()-1000;localStorage.setItem('sd-gd-tok',JSON.stringify(t))});
await pg.goto('https://rike.test/index.html#today');await pg.reload();await pg.waitForTimeout(1500);
ok(/點一下續上同步/.test(await pg.textContent('#syncChip')),'過期：同步標籤顯示「點一下續上同步」');
ok(await pg.evaluate(()=>!!(window.google&&google.accounts)),'Google 登入元件已先在背景載好');
await pg.click('#syncChip');
const sync=await pg.evaluate(()=>window.__req.length);ok(sync===1,'點下去當下就開登入（不等載入，Safari 不會擋）');
await pg.waitForTimeout(600);st=await pg.evaluate(()=>({req:window.__req,tok:JSON.parse(localStorage.getItem('sd-gd-tok')||'null')}));
ok(st.req[0].prompt===''&&st.req[0].login_hint==='me@example.com','續上：不再要求同意，直接帶上記住的帳號');
ok(st.tok.tok==='tok1'&&st.tok.exp>Date.now()+3000000,'拿到新的一小時');
ok(/已同步|等待同步/.test(await pg.textContent('#syncChip')),'同步標籤恢復（'+(await pg.textContent('#syncChip'))+'）');
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
