// Disposable fixture database and browser-intercepted readings only.
import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdtempSync,mkdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
import {Store} from '../server/db';import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-home-energy-')),'fixture.sqlite'),base='http://127.0.0.1:15406';
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15406',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let output='';server.stdout?.on('data',v=>output+=v);server.stderr?.on('data',v=>output+=v);
const browser=await chromium.launch(),errors:string[]=[];
try{
let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned fixture startup. */}if(server.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,400));}assert(ready,output);
const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));
await p.goto(base);await p.getByRole('button',{name:'Get started',exact:true}).click();await p.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await p.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.getByRole('region',{name:'Your assigned vehicle',exact:true}).waitFor();
assert.equal(await p.locator('.recorded-line-chart svg').count(),0,'Empty hardware has no invented chart');
const fleet=await p.evaluate(async()=>({hardware:await fetch('/api/fleet?mode=hardware').then(r=>r.json()),demo:await fetch('/api/fleet?mode=demo').then(r=>r.json())}));
const vehicle=fleet.hardware[0],demo=fleet.demo[0],start=Date.now()-60000;
let verified=true,failed=false;
const rows=Array.from({length:8},(_,i)=>{const at=new Date(start+i*5000).toISOString();return {payload:JSON.stringify({...demo.telemetry,device_id:vehicle.device_id,boot_id:'TEST-HOME-ENERGY',sequence:2000+i,source_type:'hardware',device_timestamp:at,calibration_status:'calibrated',event_id:null,cpe:undefined,battery_voltage_v:i===4?null:70+i*.2,battery_current_a:-2,solar_voltage_v:38+i,solar_current_a:i===4?null:2,solar_output_voltage_v:54+i*.1,solar_output_current_a:.8,wind_voltage_v:10+i*.1,wind_current_a:.5+i*.02}),received_at:at};});
const current=JSON.parse(rows.at(-1)!.payload);
await p.route('**/api/fleet?mode=hardware',r=>r.fulfill({json:[{...vehicle,telemetry:{...current,calibration_status:verified?'calibrated':'unverified',received_at:rows.at(-1)!.received_at},solar_wh:12.5,wind_wh:1.25}]}));
await p.route('**/api/history/*',r=>r.fulfill(failed?{status:503,json:{error:'TEST FIXTURE unavailable'}}:{json:rows.map(row=>({...row,payload:JSON.stringify({...JSON.parse(row.payload),calibration_status:verified?'calibrated':'unverified'})}))}));
await p.reload();await p.waitForFunction(()=>document.querySelectorAll('.recorded-line-chart svg').length===5);
assert.equal(await p.locator('.energy-glass-grid .recorded-line-chart').count(),4);
assert.equal(await p.locator('.status-grid article:nth-child(2) .recorded-line-chart').count(),1);
assert.equal(await p.locator('.status-grid article:not(:nth-child(2)) .recorded-line-chart').count(),0);
assert.equal(await p.locator('.energy-glass-card').first().locator('.recorded-line-chart-trend').count(),2,'Missing battery fix breaks the line');
for(const theme of ['light','dark'] as const){await p.emulateMedia({colorScheme:theme});for(const width of [320,390,1440]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}}
mkdirSync('test-results/home-energy-graphs',{recursive:true});await p.setViewportSize({width:1440,height:1000});await p.emulateMedia({colorScheme:'light'});await p.locator('.driver-overview').screenshot({path:'test-results/home-energy-graphs/TEST-FIXTURE-home.png'});
await p.setViewportSize({width:390,height:844});await p.locator('.bottom-nav').getByRole('button',{name:'Energy',exact:true}).click();await p.waitForFunction(()=>document.querySelectorAll('.harvest-chart svg[role=img]').length===9);
assert.equal(await p.locator('.harvest-chart svg line').count(),0,'Energy readings use lines rather than bar charts');
await p.getByLabel('Data mode',{exact:true}).selectOption('demo');await p.locator('.bottom-nav').getByRole('button',{name:'Home',exact:true}).click();await p.getByRole('region',{name:'Your assigned vehicle',exact:true}).waitFor();assert.equal(await p.locator('.recorded-line-chart svg').count(),0,'Hardware history never leaks into demo mode');
await p.getByLabel('Data mode',{exact:true}).selectOption('hardware');await p.waitForFunction(()=>document.querySelectorAll('.recorded-line-chart svg').length===5);
verified=false;await p.reload();await p.getByText('Calibration needed',{exact:true}).first().waitFor();assert.equal(await p.locator('.recorded-line-chart svg').count(),0);
verified=true;failed=true;await p.reload();await p.getByText(/Recorded graph history could not be refreshed/).waitFor();failed=false;await p.getByRole('button',{name:'Retry graph history',exact:true}).click();await p.waitForFunction(()=>document.querySelectorAll('.recorded-line-chart svg').length===5);
assert.deepEqual(errors,[]);console.log('PASS: no fake empty-state graphs, four Home energy trends plus battery status trend, missing-point gaps, nine Energy line plots, responsive themes, mode isolation, calibration masking, retry, no browser errors; disposable fixtures only.');
}finally{await browser.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
