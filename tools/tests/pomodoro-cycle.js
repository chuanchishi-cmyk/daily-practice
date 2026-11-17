const {chromium,devices}=require('playwright');const fs=require('fs');const SP=require('os').tmpdir()+'/';const SRC=require('path').join(__dirname,'../../src/studydesk.html');
(async()=>{const b=await chromium.launch();const errs=[];
fs.writeFileSync(SP+'t77.html','<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(SRC,'utf8'));
const c=await b.newContext(devices['iPhone 13']);
await c.addInitScript(()=>{sessionStorage.setItem('sd-splash-seen','1');localStorage.setItem('sd-welcome','true');window.__off=0;const D=Date;class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+window.__off)}static now(){return D.now()+window.__off}};window.Date=FD;
 window.__st=[];const o=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(t){window.__st.push({f:Math.round(this.frequency.value),dt:Math.round(((t||0)-this.context.currentTime)*10)/10});return o.apply(this,arguments)}});
const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
const rings=()=>pg.evaluate(()=>{const s=window.__st.filter(x=>x.f===880||x.f===660);window.__st=[];return s.length/6});
const mode=()=>pg.evaluate(()=>document.querySelector('.modes [aria-pressed=true],.modes .on')?.textContent.trim()+' '+document.getElementById('pomoTime').textContent);
await pg.goto('file://'+SP+'t77.html#today');await pg.waitForTimeout(600);
const every=+(await pg.textContent('.cycles span')).match(/\d+/)[0];console.log('every',every);
const close=async()=>{if(await pg.evaluate(()=>!!document.getElementById('modal').innerHTML)){await pg.keyboard.press('Escape');await pg.waitForTimeout(200)}};
const run=async(label,min)=>{await pg.evaluate(()=>document.getElementById('pToggle').click());await pg.waitForTimeout(400);const sch=await rings();await pg.evaluate(m=>window.__off+=m*60000+2000,min);await pg.waitForTimeout(900);const fired=await rings();await close();console.log(label.padEnd(18),'scheduled rings',sch,'| at end',fired,'| now:',await mode())};
// reset then start
await pg.evaluate(()=>document.getElementById('pToggle').click());await pg.waitForTimeout(300);await pg.click('[data-act=preset]');await pg.waitForTimeout(300);await rings();
for(let k=1;k<=every;k++){await run('work '+k,25);const bm=(await mode()).startsWith('長')?'long':'short';await run('break('+bm+')',bm==='long'?20:5)}
await run('exam-free work',25);
console.log('errors',errs);await b.close()})();
