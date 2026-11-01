// TEST FIXTURE ONLY: static instructions, synthetic worksheet data, no device/database access.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:8093';
const browser=await chromium.launch({headless:true,...(process.env.SOLAIR_TEST_CHROMIUM?{executablePath:process.env.SOLAIR_TEST_CHROMIUM}:{})});
const output='tmp/team-guide-qa';await mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForURL('**/team-handoff.html');
 assert.equal(await page.locator('main section.card').count(),12);
 assert.equal(await page.locator('svg').count(),4);
 const clipped=await page.locator('svg').evaluateAll(svgs=>svgs.flatMap(s=>[...s.querySelectorAll('text')].filter(t=>{const b=t.getBBox(),v=(s as SVGSVGElement).viewBox.baseVal;return b.x<0||b.x+b.width>v.width||b.y<0||b.y+b.height>v.height;}).map(t=>t.textContent)));assert.deepEqual(clipped,[],'All diagram text stays inside its viewBox');
 const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
 await page.screenshot({path:output+'/desktop-start.png'});
 await page.locator('#placement').screenshot({path:output+'/placement.png'});
 await page.locator('#fsm').screenshot({path:output+'/fsm.png'});
 await page.locator('#power').screenshot({path:output+'/power.png'});
 await page.locator('#lid-secure').uncheck();await page.locator('#fsm-arm').click();assert.equal(await page.locator('#fsm-state').textContent(),'DISARMED');
 await page.locator('#lid-secure').check();await page.locator('#fsm-arm').click();assert.equal(await page.locator('#fsm-state').textContent(),'ARMED');
 await page.locator('#lid-secure').uncheck();assert.equal(await page.locator('#fsm-state').textContent(),'TRIGGERED');
 assert.match(await page.locator('#siren-state').textContent()||'',/^ON/);
 await page.waitForFunction(()=>document.getElementById('siren-state')!.textContent!.startsWith('OFF'),{},{timeout:6500});
 assert.equal(await page.locator('#fsm-state').textContent(),'TRIGGERED');
 await page.locator('#fsm-arm').click();assert.equal(await page.locator('#fsm-state').textContent(),'TRIGGERED');
 await page.locator('#fsm-disarm').click();assert.equal(await page.locator('#fsm-state').textContent(),'DISARMED');
 await page.locator('#mount-secure').uncheck();assert.equal(await page.locator('#fsm-state').textContent(),'DISARMED');
 await page.locator('#lid-secure').check();await page.locator('#mount-secure').check();await page.locator('#fsm-arm').click();await page.locator('#fsm-motion').click();assert.equal(await page.locator('#fsm-state').textContent(),'ARMED');
 await page.locator('#motion-validated').check();await page.locator('#fsm-motion').click();assert.equal(await page.locator('#fsm-state').textContent(),'TRIGGERED');await page.locator('#fsm-disarm').click();
 await page.locator('#fsm-lid').click();await page.locator('#fsm-arm').click();assert.equal(await page.locator('#fsm-state').textContent(),'DISARMED');await page.locator('#fsm-lid').click();await page.locator('#fsm-arm').click();await page.locator('#fsm-mount').click();assert.equal(await page.locator('#fsm-state').textContent(),'TRIGGERED');await page.locator('#fsm-disarm').click();
 const task=page.locator('[data-task="upload"]');await task.locator('input[type=checkbox]').click();assert.equal(await task.locator('input[type=checkbox]').isChecked(),false);
 await task.locator('.owner').fill('TEST FIXTURE');await task.locator('.owner').blur();await task.locator('.evidence').fill('TEST FIXTURE only, no hardware');await task.locator('.evidence').blur();await task.locator('input[type=checkbox]').check();assert.equal(await task.locator('input[type=checkbox]').isChecked(),true);
 const acsDetails=page.locator('#acs details').last();await acsDetails.locator('summary').click();
 const samples=(v:number)=>Array.from({length:12},(_,i)=>v+(i%2?0.01:-0.01)).join(',');
 await page.locator('#zero-one').fill(samples(1200));await page.locator('#load-one').fill(samples(1220));await page.locator('#zero-two').fill(samples(1200));
 await page.locator('#acs-load-v').fill('12');await page.locator('#acs-load-r').fill('12');await page.locator('#calc-acs').click();
 assert.match(await page.locator('#acs-result').textContent()||'',/full calibration still pending/);
 const report=await page.evaluate(()=>JSON.parse(localStorage.getItem('solair-team-handoff-2026-10-23-v1')||'{}').acs);assert.equal(report.calibration_approved,false);assert.ok(Math.abs(report.provisional_sensitivity_v_per_a-0.04)<1e-8);
 await page.locator('#load-one').fill(samples(1200.01));await page.locator('#calc-acs').click();assert.match(await page.locator('#acs-result').textContent()||'',/STOP ACS/);
 const header='received_at,quality_json\n';let csv=header;
 for(let window=0;window<3;window++)for(let i=0;i<12;i++){
  const q=JSON.stringify({historical:false,acs:{adc_source:'ads1115_a1',adc_diagnostic:'ok_A1_config_0xD383_verified',adc_age_ms:20,adc_mv:1200+window*10+i/100}});
  csv+=new Date(Date.UTC(2026,9,23,10,window,i*2)).toISOString()+',"'+q.replaceAll('"','""')+'"\n';
 }
 await page.locator('#acs-csv').setInputFiles({name:'TEST-FIXTURE-cpe.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 for(const [index,prefix] of ['z1','l1','z2'].entries()){
  await page.locator('#'+prefix+'-start').fill(new Date(Date.UTC(2026,9,23,10,index,0)).toISOString());
  await page.locator('#'+prefix+'-end').fill(new Date(Date.UTC(2026,9,23,10,index,30)).toISOString());
 }
 await page.locator('#extract-windows').click();assert.match(await page.locator('#csv-status').textContent()||'',/Three real ADC windows extracted/);assert.equal((await page.locator('#zero-one').inputValue()).split('\n').length,12);
 assert.equal((await page.request.get(base+'/downloads/solair_cpe_source_2.0.19.zip')).status(),200);
 assert.equal((await page.request.get(base+'/downloads/commissioning-checklist.csv')).status(),200);
 assert.equal((await page.request.get(base+'/downloads/SOLAIR_CPE_2.0.19_INTEGRATION_CONTRACT.md')).status(),200);
 await page.goto(base+'/index.html#card0');assert.ok((await page.locator('#card0').getAttribute('class'))?.includes('active'),'Old reference routes remain usable');
 await page.goto(base+'/team-handoff.html');await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'No phone document overflow');
 await page.screenshot({path:output+'/phone-start.png'});await page.locator('#placement').screenshot({path:output+'/phone-placement.png'});
 for(const id of ['upload','fsm','motion','acs','meter','power','lte','finish']){await page.locator('#'+id).scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),id+' has no document overflow');}
 assert.deepEqual(errors,[]);
 console.log('PASS: TEST FIXTURE guide12sections/4SVGs, contact/FSM model including five-second latch, local evidence gates, provisional-only ACS math and real-CSV parser, source downloads, preserved reference links, mobile overflow and no JSerrors; no physical result or database write.');
}finally{await browser.close();}
