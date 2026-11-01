// Guide and planning tests only. No hardware, battery or working database touched.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const out='docs/cpe-evidence/2026-10-26-today-guide';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8092/#today-oct26');
  assert.equal(await p.locator('#start').evaluate(e=>e.classList.contains('active')),true);
  assert.equal(await p.locator('.card-number').count(),39);
  assert.equal(await p.locator('#today-oct26 .today-step').count(),7);
  assert.equal(await p.locator('[data-today-check]').count(),7);
  const day=await p.locator('#today-oct26').innerText();
  for(const phrase of ['26 October','One electrical system','ACS and PZEM are with the solderer','SB50 is deferred','4 end + 2 mid clamps','No mandatory 10-bolt/10-spacer kit'])assert.ok(day.includes(phrase),phrase);
  assert.equal(await p.locator('#today-buy tbody tr').count(),5);
  await p.screenshot({path:out+'/desktop-start.png'});
  for(const id of ['today-safe','today-panels','today-boxes','today-fuse','today-harness','today-mpt','today-software']){
   await p.goto('http://127.0.0.1:8092/#'+id);
   assert.equal(await p.locator('#'+id).evaluate(e=>e.parentElement.open),true,id);
  }
  assert.match(await p.locator('#today-boxes').locator('..').innerText(),/stationary dry DP1 prototype/);
  assert.match(await p.locator('#today-boxes').locator('..').innerText(),/check for movement\/peeling before any power/);
  assert.match(await p.locator('#today-harness').locator('..').innerText(),/main 15A fuse output → 12 AWG → W1\/1/);
  assert.match(await p.locator('#today-harness').locator('..').innerText(),/Do not add a W5→W2/);
  assert.match(await p.locator('#today-mpt').locator('..').innerText(),/approximately 0A/);
  assert.match(await p.locator('#today-software').locator('..').innerText(),/backend.*do not need a connected CPE/i);
  await p.goto('http://127.0.0.1:8092/#today-boxes');await p.locator('#today-support').screenshot({path:out+'/support.png'});
  await p.goto('http://127.0.0.1:8092/#today-panels');await p.locator('#today-clamp-plan').screenshot({path:out+'/clamps.png'});
  await p.goto('http://127.0.0.1:8092/#today-handback');
  await p.locator('[data-today-check="panels"]').check();await p.reload();
  assert.equal(await p.locator('[data-today-check="panels"]').isChecked(),true);
  const event=p.waitForEvent('download');await p.locator('#today-export').click();const dl=await event,stream=await dl.createReadStream(),chunks=[];
  for await(const chunk of stream)chunks.push(chunk);const record=JSON.parse(Buffer.concat(chunks).toString());
  assert.equal(record.physical_acceptance,false);assert.equal(record.checks.panels,true);
  await p.goto('http://127.0.0.1:8092/#hybrid-bemac-plan');
  assert.equal(await p.locator('#electrical').evaluate(e=>e.classList.contains('active')),true);
  assert.equal(await p.locator('#hybrid-bemac-plan').evaluate(e=>e.parentElement.open),true);
  const plan=await p.locator('#hybrid-bemac-plan').locator('..').innerText();
  for(const phrase of ['before the contactor/main fuse','technician said you could connect','unlabelled','12/24V','charge protection','not through that solar shunt'])assert.ok(plan.includes(phrase),phrase);
  const view=p.locator('[data-wired-viewer]').filter({has:p.locator('#wired-HYBRID_BEMAC_PLAN')});
  await view.locator('[data-wired-select]').selectOption('HYBRID_BMS_STOP');assert.match(await view.locator('[data-wired-readout]').innerText(),/BMS charge-stop/);
  assert.ok(await view.locator('.wired-drawing').evaluate(e=>e.scrollTop)>0);
  await view.screenshot({path:out+'/hybrid-stop-trace.png'});
  const collisions=await p.locator('#wired-HYBRID_BEMAC_PLAN text').evaluateAll(es=>{
   const a=es.map(e=>({s:e.textContent,b:e.getBBox()})),out=[];
   for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(Math.min(a[i].b.x+a[i].b.width,a[j].b.x+a[j].b.width)-Math.max(a[i].b.x,a[j].b.x)>2&&Math.min(a[i].b.y+a[i].b.height,a[j].b.y+a[j].b.height)-Math.max(a[i].b.y,a[j].b.y)>2)out.push([a[i].s,a[j].s]);return out;
  });assert.deepEqual(collisions,[]);
  for(const suffix of ['svg','png'])assert.equal((await p.request.get('http://127.0.0.1:8092/downloads/HYBRID_BEMAC_PLAN.'+suffix)).status(),200);
  const ids=await p.locator('[id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(ids.length,new Set(ids).size);
  await p.setViewportSize({width:390,height:844});
  for(const id of ['today-oct26','today-buy','today-panels','today-boxes','today-harness','today-mpt','hybrid-bemac-plan']){
   await p.goto('http://127.0.0.1:8092/#'+id);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,id+' overflow');
  }
  await p.goto('http://127.0.0.1:8092/#today-oct26');await p.screenshot({path:out+'/mobile-start.png'});
  await p.goto('file://'+process.cwd()+'/docs/visual-workbench/dp1-hub/SOLAIR_DP1_ALL_IN_ONE.html#today-panels');assert.equal(await p.locator('#today-panels').evaluate(e=>e.parentElement.open),true);
  assert.equal(await p.locator('#wired-HYBRID_BEMAC_PLAN').count(),1);assert.ok(await p.locator('#reference-frame').getAttribute('srcdoc'));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({documentationOnly:true,hardwarePass:false,preservedCards:39,todaySteps:8,expandableSteps:7,hybridRoutes:9,checks:['reported inventory','no mandatory mounting kit','direct harness without SB50','BMS/fuse/absent-module holds','two-rail clamp example','reuse-first PCB/DIN mount','MPT isolated checks not charging','software before CPE return','local checklist persistence/export not acceptance','identified pre-contactor bus and technician narrative','wind charger/BMS stop pending','solar-only shunt retained','trace auto-scroll','no text collisions','downloads','deep links','mobile/offline','no JS errors']},null,2));
  console.log('PASS: Oct26 reuse-first execution guide, direct DP1 harness, planned solar/wind bus, browser/offline/checklist checks; no hardware PASS.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
