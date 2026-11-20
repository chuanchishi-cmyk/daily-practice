// 節氣卡只在節氣開始的前 3 天出現；第 7 天回顧卡；每月回顧卡；第一次使用的介紹卡
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];let fail=0;
fs.writeFileSync(SP+'tjq.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
// at: 'YYYY-MM-DD' 10:00 Taipei; seed: days of sessions before that date
const open=async(at,o={})=>{const c=await b.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'Asia/Taipei'}));
  await c.addInitScript(([at,o])=>{sessionStorage.setItem('sd-splash-seen','1');if(!localStorage.getItem('sd-tips'))localStorage.setItem('sd-tips',JSON.stringify({done:{'n-qn':'yes'},last:'',cur:null}));if(!o.welcome)localStorage.setItem('sd-welcome','true');
    const D=Date,t=new D(at+'T10:00:00+08:00').getTime(),off=t-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD;
    if(o.days){const ymd=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');const S={meta:{},days:{},mocks:{},mistakes:{},projects:{},reviews:{},quiz:{},quotes:{},pnotes:{},pages:{}};
      for(let i=1;i<=o.days;i++){const d=new D(t-i*864e5);const k=ymd(d);S.days[k]={date:k,j:{top3:[{t:'事'+i,done:i%2===0}]},sessions:[{t:new D(k+'T09:30:00+08:00').toISOString(),min:25,sub:'R'},{t:new D(k+'T10:10:00+08:00').toISOString(),min:25,sub:'R'}]}}
      localStorage.setItem('studydesk-v1',JSON.stringify(S));localStorage.setItem('sd-first',JSON.stringify(ymd(new D(t-o.days*864e5))))}},[at,o]);
  const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));await pg.goto('file://'+SP+'tjq.html#today');await pg.waitForTimeout(900);return [c,pg]};
const txt=async(pg,sel)=>pg.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '),sel);
// --- 節氣 ---
for(const [d,want] of [['2026-11-19','再過 3 天是小雪'],['2026-11-18',''],['2026-11-22','今天小雪'],['2026-11-24','小雪'],['2026-11-25',''],['2026-12-22','今天冬至'],['2027-02-04','今天立春'],['2026-09-24','明天是中秋'],['2026-09-25','中秋'],['2026-06-19','端午']]){
  const [c,pg]=await open(d);const t=await txt(pg,'.jq');ok(want?t.includes(want):!t,`${d}：${want?'顯示「'+t+'」':'不顯示節氣卡'}`);await c.close()}
{const [c,pg]=await open('2026-12-31');const t=await txt(pg,'.todaynotes');ok(/今天進入二九/.test(t)&&/(\d+／81 瓣|畫一瓣)/.test(t),'冬至數九（12/31 進入二九）：'+t.slice(0,70));await c.close()}
// --- 第 7 天 ---
{const [c,pg]=await open('2026-11-19',{days:8});const t=await txt(pg,'.tipcard');ok(/日課開始認識你了/.test(t)&&/上午/.test(t),'第 8 天：回顧卡「'+t.slice(0,70)+'…」');await c.close()}
// --- 每月回顧（12/2，11 月用了 25 天）---
{const [c,pg]=await open('2026-12-02',{days:25});const t=await txt(pg,'.tipcard');ok(/11 月回顧/.test(t)&&/三件事完成/.test(t),'12/2：月回顧「'+t.slice(0,80)+'…」');await c.close()}
// --- 第一次使用的介紹卡 ---
{const [c,pg]=await open('2026-11-19',{welcome:true});await pg.waitForSelector('#wT',{timeout:8000});const hs=[];for(let i=0;i<8;i++){const h=await txt(pg,'#wT');if(!h)break;hs.push(h);const nx=await pg.$('.welcome .pri');if(!nx)break;if(h.includes('用日課做什麼'))await pg.click('.purp-o[data-k=focus]');await nx.click();await pg.waitForTimeout(250)}
 ok(hs.length>=5&&hs.some(h=>h.includes('節奏'))&&hs.some(h=>h.includes('覺察')),'介紹卡：'+hs.join(' → '));await c.close()}
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
