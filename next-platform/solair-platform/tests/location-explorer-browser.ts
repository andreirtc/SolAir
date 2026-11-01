// Disposable database and browser-only GPS fixtures; no operational location records are written.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-location-')),'fixture.sqlite'),base='http://127.0.0.1:15392',output='test-results/location-explorer';
const db=new Store(database);await db.migrate();await seed(db);await db.close();mkdirSync(output,{recursive:true});
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15392',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;server.stdout?.on('data',x=>logs+=x);server.stderr?.on('data',x=>logs+=x);
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Fixture startup. */}if(server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,500));}assert.ok(ready,logs);
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light'}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 // Synthetic map tiles avoid depending on an external map server in these layout checks.
 await context.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e0e8dc"/><path d="M0 64H256M96 0V256M0 194H256" stroke="#ffffff" stroke-width="18"/></svg>'}));
 await page.goto(base);await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.bottom-nav').getByRole('button',{name:'Location',exact:true}).click();
 await page.getByRole('heading',{name:'Location History',exact:true}).waitFor();await page.getByText('No stops recorded in this window',{exact:true}).waitFor();assert.ok(await page.getByText('Waiting for a GPS fix',{exact:true}).isVisible());
 await page.reload();await page.getByRole('heading',{name:'Location History',exact:true}).waitFor();
 await page.locator('.bottom-nav').getByRole('button',{name:'Energy',exact:true}).click();await page.getByRole('heading',{name:'Solar energy',exact:true}).waitFor();
 await page.locator('.bottom-nav').getByRole('button',{name:'Location',exact:true}).click();await page.getByRole('heading',{name:'Location History',exact:true}).waitFor();
 let fails=false;const start=Date.now()-600000;
 const points=[[14.6,120.98],[14.6,120.98],[14.6,120.98],[14.601,120.9805],[14.605,120.984],[14.605,120.988],[14.61,120.99],[14.61,120.99],[14.61,120.99]];const rows=points.map(([latitude,longitude],i)=>({payload:JSON.stringify({device_id:'TEST-FIXTURE',boot_id:'fixture',sequence:i,device_timestamp:new Date(start+i*60000).toISOString(),source_type:'hardware',gps_fix:true,gps_fix_age_ms:0,latitude,longitude})}));
 await page.route('**/api/history/*',route=>route.fulfill(fails?{status:503,json:{error:'TEST FIXTURE history unavailable'}}:{json:rows}));
 await page.getByRole('button',{name:'Refresh location history',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.location-timeline li').length===2);
 assert.equal(await page.locator('.location-track-line').count(),1);assert.equal(await page.locator('.location-stop-marker').count(),2);assert.equal(await page.locator('.location-distance-tooltip').count(),1);
 assert.equal(await page.getByText('Address unavailable',{exact:true}).count(),2);assert.equal(await page.locator('.location-timeline time').count(),4);assert.ok((await page.locator('.location-leg').innerText()).includes('GPS distance along recorded points'));
 await page.getByRole('button',{name:'Fit track',exact:true}).click();
 await page.getByRole('checkbox',{name:'Show recorded track',exact:true}).uncheck();assert.equal(await page.locator('.location-track-line').count(),0);
 await page.getByRole('checkbox',{name:'Show recorded track',exact:true}).check();assert.equal(await page.locator('.location-track-line').count(),1);
 await page.getByLabel('Minimum stop duration',{exact:true}).selectOption('5');await page.getByText('No stops recorded in this window',{exact:true}).waitFor();assert.equal(await page.locator('.location-track-line').count(),1);assert.equal(await page.locator('.location-stop-marker').count(),0);
 await page.getByLabel('Minimum stop duration',{exact:true}).selectOption('2');await page.waitForFunction(()=>document.querySelectorAll('.location-timeline li').length===2);
 await page.locator('.location-timeline button').first().click();await page.locator('.leaflet-popup').getByText(/Detected stop/).waitFor();assert.equal(await page.locator('.location-timeline button[aria-pressed=true]').count(),1);
 await page.getByRole('button',{name:'Return to vehicle location'}).click();assert.equal(await page.locator('.location-timeline button[aria-pressed=true]').count(),0);
 await page.getByRole('button',{name:'Fit track',exact:true}).click();
 for(const colorScheme of ['light','dark'] as const){await page.emulateMedia({colorScheme});await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,colorScheme);for(const width of [320,360,390,1440]){await page.setViewportSize({width,height:width===1440?1000:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px ${colorScheme}`);await page.locator('.location-explorer').screenshot({path:`${output}/TEST-FIXTURE-${colorScheme}-${width}.png`});}}
 fails=true;await page.getByRole('button',{name:'Refresh location history',exact:true}).click();await page.locator('.location-history-error').waitFor();fails=false;await page.getByRole('button',{name:'Retry history',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.location-timeline li').length===2);
 await page.setViewportSize({width:390,height:844});await page.getByLabel('Data mode',{exact:true}).selectOption('demo');await page.getByRole('heading',{name:'Simulated fleet locations',exact:true}).waitFor();await page.getByText('No stops recorded in this window',{exact:true}).waitFor();assert.equal(await page.locator('.location-timeline li').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: empty hardware state; GPS track and distance labels; stop-duration filtering; recorded times; deferred addresses; track fit/toggle; historical marker/return; refresh navigation; responsive themes; error/retry; mode isolation; no browser errors.');
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
