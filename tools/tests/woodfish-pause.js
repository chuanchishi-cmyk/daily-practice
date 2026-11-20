// 靜心開始的三聲木魚：響到一半按暫停 → 還沒響的取消；繼續 → 接著響剩下的；重設後開始 → 重新三聲
const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];let fail=0;
fs.writeFileSync(SP+'twf.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const ok=(cond,msg)=>{console.log((cond?'ok   ':'FAIL ')+msg);if(!cond)fail++};
const c=await b.newContext(devices['iPhone 13']);
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');
  // each woodfish strike starts several oscillators at the same time; strikes are counted by distinct start times (< 20 s ahead)
  window.__st=[];const o=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(t){window.__st.push(Math.round(((t||0)-this.context.currentTime)*10)/10);return o.apply(this,arguments)};
  const dc=AudioNode.prototype.disconnect;AudioNode.prototype.disconnect=function(){if(this instanceof GainNode)window.__cut=(window.__cut||0)+1;return dc.apply(this,arguments)}});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+SP+'twf.html#mind');await pg.waitForTimeout(700);
const strikes=()=>pg.evaluate(()=>{const s=new Set(window.__st.filter(x=>x<20).map(x=>Math.round(x)));window.__st=[];return s.size});
const toggle=async()=>{await pg.click('main [data-act=mToggle]');await pg.waitForTimeout(300)};
await toggle();ok(await strikes()===3,'開始：排了三聲木魚');
await pg.waitForTimeout(3000);
await pg.evaluate(()=>window.__cut=0);await toggle();
const cut=await pg.evaluate(()=>window.__cut);ok(cut>=2,'第一聲後暫停：取消還沒響的木魚（切斷 '+cut+' 個輸出，含其他聲音通道）');
await strikes();await toggle();ok(await strikes()===2,'繼續：接著響剩下的兩聲');
await pg.click('main [data-act=mReset]');await pg.waitForTimeout(300);
await strikes();await toggle();ok(await strikes()===3,'重設後開始：重新三聲');
await pg.waitForTimeout(13000);await toggle();await strikes();await toggle();ok(await strikes()===0,'三聲都響完後暫停再繼續：不再補響');
console.log('errors',errs);await b.close();process.exit(fail||errs.length?1:0)})();
