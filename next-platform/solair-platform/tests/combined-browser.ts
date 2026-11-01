import {chromium,type Page} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';

// Run against the isolated migrated database copy, never against the working database.
const base=process.env.TEST_URL||'http://127.0.0.1:3200';
assert.equal(new URL(base).port,'3200','This check is restricted to the isolated integration preview');
const output='test-results/integration';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.SOLAIR_TEST_CHROMIUM?{executablePath:process.env.SOLAIR_TEST_CHROMIUM}:{})});
const errors:string[]=[],checks:Record<string,unknown>[]=[];
async function fit(page:Page,label:string){
 const size=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth}));
 if(size.document>size.width){
  const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,100),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(e=>e.right>innerWidth+1).slice(0,20));
  writeFileSync(output+'/overflow.json',JSON.stringify({label,size,overflow},null,2)+'\n');
  await page.screenshot({path:output+'/overflow.png',fullPage:true});
 }
 assert.ok(size.document<=size.width,`${label}: page overflow ${JSON.stringify(size)}`);
 checks.push({check:label,...size});
 console.log('PASS: '+label);
}
async function go(page:Page,label:string){
 const nav=page.locator('.bottom-nav');
 if(await nav.isVisible())await nav.getByRole('button',{name:label,exact:true}).click();
 else {
  await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
  await page.locator('.sidebar nav').getByRole('button',{name:label,exact:true}).click();
 }
}
try{
 for(const role of ['driver','operator','engineer','admin']){
  const context=await browser.newContext({viewport:{width:role==='admin'?1440:390,height:844}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(`${role}: ${e.message}`));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('input[type=email]')||document.querySelector('.welcome-start'));
  if(await page.getByRole('button',{name:'Get started',exact:true}).isVisible())await page.getByRole('button',{name:'Get started',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill(`${role}@solair.local`);
  await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).waitFor({state:'hidden'});
  await page.locator('main h1').waitFor();
  const me=await page.request.get(base+'/api/me');assert.equal(me.status(),200);assert.equal((await me.json()).role,role);
  checks.push({check:'normal role login',role});
  if(await page.getByLabel('Data mode').count())await page.getByLabel('Data mode').selectOption('hardware');
  await fit(page,role+' home');
  const battery=await page.request.get(base+'/api/battery/ET-01?mode=hardware');assert.equal(battery.status(),200);
  const estimate=await battery.json();assert.equal(estimate.model_validated,false);
  checks.push({check:'battery API',role,quality:estimate.quality,soc_null:estimate.soc_pct===null,tte_null:estimate.tte_minutes===null});
  if(role==='driver'||role==='operator'){
   const denial=await page.request.post(base+'/api/battery/ET-01/reference?mode=hardware',{data:{}});assert.equal(denial.status(),403);
   assert.equal((await page.request.get(base+'/api/research/OTHER-01')).status(),403);
  }
  if(role==='driver'){
   await page.getByRole('region',{name:'Battery percentage and time to empty',exact:true}).waitFor();
   await go(page,'Energy');
   await page.getByRole('region',{name:'Battery percentage and time to empty',exact:true}).waitFor();
   assert.equal(await page.getByText('Battery forecasting awaits validated data',{exact:true}).count(),0);
   await page.getByText('Estimated TTE to selected reserve',{exact:true}).waitFor();
   await fit(page,'driver energy and SOC/TTE');
   await page.screenshot({path:output+'/combined-mobile-energy.png',fullPage:true});
   await go(page,'Alerts');await page.getByText('Security state',{exact:true}).waitFor();await fit(page,'driver security');
   await go(page,'Location');await page.locator('.leaflet-container').first().waitFor();await fit(page,'driver map/history');
   await go(page,'Notifications');await page.locator('main h1').waitFor();await fit(page,'driver notifications');
   await go(page,'Settings');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();await fit(page,'driver settings');
   await go(page,'Home');await page.getByRole('region',{name:'Battery percentage and time to empty',exact:true}).waitFor();
   await page.screenshot({path:output+'/combined-mobile-home.png',fullPage:true});
  }
  if(role==='engineer'){
   await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
   await page.locator('.sidebar nav').getByRole('button',{name:'CPE Lab',exact:false}).click();
   await page.getByRole('region',{name:'Battery percentage and time to empty',exact:true}).waitFor();
   await page.getByRole('region',{name:'SOP 4 evaluation evidence',exact:true}).waitFor();
   await page.getByText('Record battery reference · engineering',{exact:true}).click();
   await page.getByLabel('Usable capacity (Ah)',{exact:true}).waitFor();
   await fit(page,'engineer CPE research and reference forms');
   await page.screenshot({path:output+'/combined-mobile-cpe.png',fullPage:true});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);
 writeFileSync(output+'/combined-browser.json',JSON.stringify({checked_at:new Date().toISOString(),base,checks,page_errors:errors,physical_acceptance:false,scope:'Normal role login and actual combined UI/API with private migrated copy. No physical evidence/reference entries submitted.'},null,2)+'\n');
 console.log('PASS: '+checks.length+' combined role, SOC/TTE, mobile/navigation and authorization observations; no page errors');
}finally{await browser.close();}
