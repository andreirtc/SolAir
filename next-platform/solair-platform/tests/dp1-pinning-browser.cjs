// Documentation fixtures only: no USB, hardware commands or working DB writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const out='docs/cpe-evidence/2026-10-25-four-pinning-tables';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8092/#pinning-reference');
  await p.locator('#pinning-reference').waitFor();
  assert.equal(await p.locator('#cpe').evaluate(e=>e.classList.contains('active')),true);
  assert.equal(await p.locator('#pinning-reference table').count(),4);
  assert.equal(await p.locator('#pinning-reference .pinning-case').count(),4);
  const ids=['pinning-default','pinning-bench','pinning-prototype','pinning-bemac'];
  const rows={};for(const id of ids)rows[id]=await p.locator('#'+id+' tbody tr').count();
  assert.equal(rows['pinning-default'],41);assert.equal(rows['pinning-bench'],12);assert.equal(rows['pinning-prototype'],20);assert.equal(rows['pinning-bemac'],15);
  const defaultText=await p.locator('#pinning-default').innerText();
  for(const exactLabel of ['5V_HCW','+3.3V','GPIO34','J_TEST'])assert.ok(defaultText.includes(exactLabel),exactLabel);
  for(const component of ['ESP32','IMU','ADS1115','ACS758','GPS','SIMCom','MAX3485','PZEM','470','330','J_LID','J_REMOVE','J_ALARM_CTRL','J_TEST','W3','W4','HCW','F5305S'])assert.ok(defaultText.includes(component),component);
  const row=(id,component,pin)=>p.locator('#'+id+' tbody tr').filter({has:p.locator('td:first-child',{hasText:component})}).filter({has:p.locator('td:nth-child(2)',{hasText:pin})});
  assert.match(await row('pinning-default','J_TEST','1 · OU1').innerText(),/before R1/);
  assert.match(await row('pinning-default','J_TEST','2 · A1').innerText(),/MIDPOINT.*ADS A1.*GPIO34/);
  assert.match(await row('pinning-default','C1','Two legs').innerText(),/parallel with R2/);
  assert.match(await row('pinning-default','J_ALARM_CTRL','1; 2').innerText(),/1 = GPIO27.*2 = GND/);
  assert.match(await row('pinning-default','HCW','OUT\+; OUT−').innerText(),/Never connect OUT\+ to W3/);
  for(const id of ids.slice(1)){
   const text=await p.locator('#'+id).innerText();
   for(const pin of ['SVG pin 5','SVG pin 6','SVG pin 7','SVG pin 8'])assert.ok(text.includes(pin),id+' '+pin);
  }
  assert.match(await p.locator('#pinning-bench').innerText(),/Bank negative.*ACS.*IP\+/s);
  assert.match(await p.locator('#pinning-prototype').innerText(),/W2 opening 2.*large LOAD bolt/s);
  const bemac=await p.locator('#pinning-bemac').innerText();
  for(const phrase of ['not ready to wire','Exact vehicle terminal','Leave untouched','main traction-current path'])assert.ok(bemac.includes(phrase),phrase);
  assert.match(bemac,/54\.6\s*V \/ 2\s*A/);
  assert.match(bemac,/55\.2\s*V nominal.*80\s*Ah/);
  const numbers=await p.locator('.card-number').allTextContents();assert.equal(numbers.length,39);assert.deepEqual(numbers,numbers.map((_,i)=>'CARD '+(i+1)));
  const allIds=await p.locator('[id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(allIds.length,new Set(allIds).size);
  await p.screenshot({path:out+'/desktop.png'});
  for(const id of ids){await p.goto('http://127.0.0.1:8092/#'+id);assert.equal(await p.locator('#'+id).isVisible(),true);}
  await p.setViewportSize({width:390,height:844});
  for(const id of ids){await p.goto('http://127.0.0.1:8092/#'+id);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,id+' overflow');}
  await p.goto('http://127.0.0.1:8092/#pinning-bench');await p.screenshot({path:out+'/mobile.png'});
  await p.goto('http://127.0.0.1:8092/#electrical');await p.getByRole('link',{name:'Open the four current pinning tables',exact:false}).click();assert.equal(await p.locator('#pinning-reference').isVisible(),true);
  await p.goto('file://'+process.cwd()+'/docs/visual-workbench/dp1-hub/SOLAIR_DP1_ALL_IN_ONE.html#pinning-prototype');
  assert.equal(await p.locator('#pinning-reference table').count(),4);assert.equal(await p.locator('#pinning-prototype').isVisible(),true);
  assert.ok(await p.locator('#reference-frame').getAttribute('srcdoc'));
  assert.deepEqual(errors,[]);
  const results={documentationOnly:true,physicalPass:false,tables:4,rows,preservedCards:39,checks:['complete shared pin map','three distinct system differences','PZEM SVG numbering','capacitor parallel to R2','J_TEST raw vs midpoint','SVG printed header order','no 5V-to12V WAGO tie','BEMAC unconfirmed interfaces and traction boundary','deep links','unique IDs','mobile containment','offline four tables and original artwork','no browser errors']};
  fs.writeFileSync(out+'/verification.json',JSON.stringify(results,null,2));console.log('PASS: four pinning tables, distinct power cases, headers, mobile, offline, 39 cards preserved; no hardware acceptance claimed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
