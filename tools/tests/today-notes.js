// 今日小卡：會談、目標倒數、照你調整等提醒合成一張；預設顯示兩則，其餘收在「還有 N 則」，展開狀態會記住
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'ttn.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');const D=Date,off=new D('2026-11-25T10:00:00+08:00')-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD;
 if(!localStorage.getItem('studydesk-v1'))localStorage.setItem('studydesk-v1',JSON.stringify({meta:{main:{exams:[{id:'e1',name:'期末考',date:'2026-12-02'}]}},days:{},mocks:{},mistakes:{},projects:{p1:{name:'論文',stages:[],next:{who:'王老師',date:'2026-11-25',time:'08:00'}},p2:{name:'專題',stages:[],next:{who:'李主管',date:'2026-11-25',time:'09:00'}}},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}}))});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));await pg.goto('file://'+SP+'ttn.html#today');await pg.waitForTimeout(900);
const cards=await pg.$$('.todaynotes');ok(cards.length===1,'提醒合成一張小卡');
const vis=await pg.$$eval('.todaynotes > .tn',e=>e.map(x=>x.querySelector('.tnk').textContent));const all=await pg.$$eval('.todaynotes .tn',e=>e.length);
ok(vis.length===Math.min(2,all),'預設顯示 '+vis.length+' 則（'+vis.join('、')+'），共 '+all+' 則');
ok(!(await pg.$('.extoday'))&&!(await pg.$('p.coach'))&&!(await pg.$('.mdue')),'舊的分開區塊不再出現');
if(all>2){await pg.click('[data-act=tnTog]');await pg.waitForTimeout(300);ok(await pg.$eval('.tnmore',e=>!e.hidden),'按「還有 N 則」展開');
  await pg.reload();await pg.waitForTimeout(800);ok(await pg.$eval('.tnmore',e=>!e.hidden),'重新開啟後仍是展開（記住狀態）');}
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
