// Isolated software fixtures only; chart values below are not physical measurements.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-energy-art-')),'fixture.sqlite'),base='http://127.0.0.1:15390',output='test-results/energy-redesign';
const db=new Store(database);await db.migrate();await seed(db);await db.close();mkdirSync(output,{recursive:true});
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15390',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;server.stdout?.on('data',x=>logs+=x);server.stderr?.on('data',x=>logs+=x);
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Fixture startup. */}if(server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,500));}assert.ok(ready,logs);
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',colorScheme:'light'}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();
 await page.locator('.bottom-nav').getByRole('button',{name:'Energy',exact:true}).click();await page.getByRole('heading',{name:'Solar energy',exact:true}).waitFor();
 await page.locator('.empty-chart').getByText('No recorded samples',{exact:true}).first().waitFor();
 for(const source of ['solar','wind'])assert.equal(await page.locator(`#energy-${source} .harvest-reading-card`).count(),4);
 assert.ok((await page.locator('#energy-solar .harvest-reading-card').allTextContents()).every(text=>text.includes('—')));
 await page.locator('#energy-wind .harvest-artwork').scrollIntoViewIfNeeded();await page.waitForFunction(()=>Array.from(document.querySelectorAll<HTMLImageElement>('.harvest-artwork img')).every(img=>img.complete&&img.naturalWidth>0));
 await page.locator('#energy-solar').screenshot({path:output+'/hardware-empty-solar.png'});await page.locator('#energy-wind').screenshot({path:output+'/hardware-empty-wind.png'});
 console.log('PASS: both illustrations load; four solar/four wind cards retain no-data states and wind commissioning label');
 const fleet=await page.evaluate(async()=>({hardware:await fetch('/api/fleet?mode=hardware').then(r=>r.json()),demo:await fetch('/api/fleet?mode=demo').then(r=>r.json())}));
 assert.ok(Array.isArray(fleet.hardware)&&Array.isArray(fleet.demo),'Browser-origin fleet requests must return fixture arrays');
 const [vehicle]=fleet.hardware,[demo]=fleet.demo;
 const captured=Date.now()-120000;
 const rows=Array.from({length:24},(_,i)=>{const at=new Date(captured+i*5000).toISOString();const t={...demo.telemetry,device_id:vehicle.device_id,source_type:'hardware',transport:'usb',firmware_version:'TEST-FIXTURE',calibration_status:'calibrated',device_timestamp:at,sequence:1000+i,event_id:null,solar_voltage_v:38+i*.2,solar_current_a:2+i*.05,solar_output_voltage_v:54+i*.1,solar_output_current_a:.8+i*.01,wind_voltage_v:10+i*.1,wind_current_a:.2+i*.01};return {id:`fixture-${i}`,received_at:at,payload:JSON.stringify(t)};});
 const latest={...JSON.parse(rows.at(-1)!.payload),received_at:rows.at(-1)!.received_at,measured_at:rows.at(-1)!.received_at};let historyFails=false;
 await page.route('**/api/fleet?mode=hardware',route=>route.fulfill({json:[{...vehicle,telemetry:latest,solar_wh:120.25,wind_wh:7.2}]}));
 await page.route('**/api/history/*',route=>route.fulfill(historyFails?{status:503,json:{error:'TEST FIXTURE history unavailable'}}:{json:rows}));
 await page.reload();await page.getByRole('heading',{name:'Solar energy',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelectorAll('.harvest-chart svg[role="img"]').length===9);
 assert.ok((await page.locator('#energy-solar .harvest-reading-value').first().innerText()).includes('42.6'));
 assert.ok((await page.locator('#energy-solar .harvest-reading-value').nth(2).innerText()).includes('134.2'));
 assert.ok((await page.locator('#energy-wind .harvest-reading-value').last().innerText()).includes('7.20'));
 assert.ok((await page.locator('#energy-wind .harvest-reading-card').last().innerText()).includes('Displayed sample window'));
 for(const colorScheme of ['light','dark'] as const){
  await page.emulateMedia({colorScheme});await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,colorScheme);
  for(const width of [320,360,390,1440]){
   await page.setViewportSize({width,height:width===1440?1000:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px ${colorScheme} overflow`);
   await page.locator('#energy-wind .harvest-artwork').scrollIntoViewIfNeeded();
   await page.locator('#energy-solar').screenshot({path:`${output}/TEST-FIXTURE-solar-${colorScheme}-${width}.png`});
   await page.locator('#energy-wind').screenshot({path:`${output}/TEST-FIXTURE-wind-${colorScheme}-${width}.png`});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('.energy-source-navigation').getByRole('link',{name:'Wind',exact:true}).click();assert.equal(await page.locator('#energy-wind').isVisible(),true);
 await page.getByRole('link',{name:'Battery & technical readings',exact:true}).click();await page.getByRole('heading',{name:'MPPT output & CPE channels',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'CPE measurement history',exact:true}).count(),1);
 console.log('PASS: recorded voltage/current/power and window-energy plots; correct values; transparent responsive cards at 320/360/390/1440px in both themes; battery and CPE retained');
 historyFails=true;await page.reload();await page.locator('.energy-history-error').waitFor();assert.ok((await page.locator('.energy-history-error').innerText()).includes('Graphs are unavailable'));
 historyFails=false;await page.getByRole('button',{name:'Retry history',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.harvest-chart svg[role="img"]').length===9);assert.equal(await page.locator('.energy-history-error').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: history failure/retry recovers without changing displayed telemetry; no browser errors');
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
