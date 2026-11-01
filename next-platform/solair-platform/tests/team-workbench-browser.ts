// Static guide/browser fixtures only. No connected equipment or database access.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const base=process.env.TEST_URL||'http://127.0.0.1:8093';
const browser=await chromium.launch({headless:true,...(process.env.SOLAIR_TEST_CHROMIUM?{executablePath:process.env.SOLAIR_TEST_CHROMIUM}:{})});
const output='tmp/team-workbench-qa';await mkdir(output,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/team-workbench.html');
 assert.equal(await page.locator('[role=tab]').count(),12);assert.equal(await page.locator('main > section.active').count(),1);
 assert.equal(await page.locator('.nav-tabs .active').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(59, 130, 246)');
 const ids=await page.locator('[id]').evaluateAll(ns=>ns.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
 const sections=await page.locator('main > section').evaluateAll(ns=>ns.map(n=>({id:n.id,content:n.innerHTML})));
 const continuous=await context.newPage();await continuous.goto(base+'/team-handoff.html');
 const original=await continuous.locator('main > section').evaluateAll(ns=>ns.map(n=>({id:n.id,content:n.innerHTML})));
 assert.deepEqual(sections,original,'Both layouts share every current section and worksheet');
 await continuous.close();await page.screenshot({path:output+'/desktop.png'});
 await page.locator('#tab-placement').click();await page.locator('#placement').waitFor({state:'visible'});await page.locator('#placement svg').screenshot({path:output+'/placement.png'});
 await page.locator('#lid-secure').uncheck();await page.locator('#tab-fsm').click();await page.locator('#fsm-arm').click();assert.equal(await page.locator('#fsm-state').textContent(),'DISARMED');
 await page.locator('#fsm-lid').click();await page.locator('#fsm-arm').click();await page.locator('#fsm-mount').click();assert.equal(await page.locator('#fsm-state').textContent(),'TRIGGERED');await page.locator('#fsm-disarm').click();
 await page.locator('#tab-start').click();const task=page.locator('[data-task=upload]');await task.locator('.owner').fill('TEST FIXTURE');await task.locator('.evidence').fill('Illustration only, no physical result');await task.locator('.evidence').blur();await task.locator('input[type=checkbox]').check();
 await page.goto(base+'/team-handoff.html');assert.equal(await page.locator('[data-task=upload] input[type=checkbox]').isChecked(),true,'Evidence is retained across the two views on the same browser');
 await page.getByRole('link',{name:'Open HTML-style card guide'}).click();await page.waitForURL('**/team-workbench.html');
 await page.locator('#tab-acs').click();await page.locator('#acs details').first().locator('summary').click();await page.locator('#load-volts').fill('12');await page.locator('#load-ohms').fill('100');await page.locator('#calc-reference').click();assert.match(await page.locator('#reference-result').textContent()||'',/0.120/);
 await page.goto(base+'/team-workbench.html#power');assert.equal(await page.locator('section.active').getAttribute('id'),'power');await page.screenshot({path:output+'/power.png'});
 await page.locator('#tab-power').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.nav-tabs .active').getAttribute('id'),'tab-lte');
 await page.setViewportSize({width:390,height:844});
 for(const id of sections.map(s=>s.id)){await page.locator('#tab-'+id).click();await page.locator('#'+id).waitFor({state:'visible'});assert.equal(await page.locator('section.active').getAttribute('id'),id);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' has no phone document overflow');}
 await page.locator('#tab-placement').click();await page.screenshot({path:output+'/phone-placement.png'});
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('main > section:visible').count(),12,'Print includes all cards');await page.emulateMedia({media:'screen'});
 const download=base+'/downloads/SOLAIR_CPE_TEAM_WORKBENCH_2026-10-23.html';const response=await page.request.get(download);assert.equal(response.status(),200);const html=await response.text();assert.ok(!/\b(?:src|href)="team-(?:handoff|workbench)\.(?:js|css)"/.test(html));
 const offline=await context.newPage();const offlineErrors:string[]=[];offline.on('pageerror',e=>offlineErrors.push(e.message));const requests:string[]=[];offline.on('request',r=>{if(!r.url().startsWith('file:'))requests.push(r.url());});
 await offline.goto(pathToFileURL(process.cwd()+'/../../.tools/team-workbench-source/dist/downloads/SOLAIR_CPE_TEAM_WORKBENCH_2026-10-23.html').href);await offline.locator('#tab-fsm').click();await offline.locator('#fsm-arm').click();assert.equal(await offline.locator('#fsm-state').textContent(),'ARMED');assert.deepEqual(requests,[]);assert.deepEqual(offlineErrors,[]);
 assert.deepEqual(errors,[]);
 console.log('PASS: matching original HTML palette,12 tabs, exact shared guide content, FSM controls, cross-view local evidence, reference calculator, deep links, keyboard navigation,390px layout, all-card print, standalone offline HTML and no JS errors. Software/browser fixtures only.');
}finally{await browser.close();}
