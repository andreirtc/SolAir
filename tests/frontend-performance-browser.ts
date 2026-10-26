// Reproducible local lab measurements, not real-phone/cloud acceptance.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-performance-')),'fixture.sqlite');
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const base='http://127.0.0.1:15386';
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15386',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='';server.stdout?.on('data',b=>logs+=b);server.stderr?.on('data',b=>logs+=b);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Isolated startup. */}if(server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready,logs);
 browser=await chromium.launch();const measurements=[];mkdirSync('test-results/frontend-performance',{recursive:true});
 for(const slow of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Performance.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  if(slow){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  const start=Date.now();await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByLabel('Email address',{exact:true}).waitFor();const signInReadyMs=Date.now()-start;
  await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');const loginStart=Date.now();await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();await page.getByRole('button',{name:'Find my vehicle',exact:true}).waitFor();const loginMs=Date.now()-loginStart;
  await page.getByRole('region',{name:'Your assigned vehicle',exact:true}).getByText('No data',{exact:true}).waitFor();await page.screenshot({path:`test-results/frontend-performance/driver-${slow?'slower':'local'}.png`,fullPage:true});
  const navigationStart=Date.now();await page.locator('.bottom-nav').getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();const settingsNavigationMs=Date.now()-navigationStart;
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(entry=>{const r=entry as PerformanceResourceTiming;return {path:new URL(r.name).pathname,transferBytes:r.transferSize,durationMs:Math.round(r.duration)};}));
  const rawMetrics=await cdp.send('Performance.getMetrics');const browserResourceSample=Object.fromEntries(rawMetrics.metrics.filter(metric=>['TaskDuration','JSHeapUsedSize','JSHeapTotalSize','Documents','Nodes'].includes(metric.name)).map(metric=>[metric.name,metric.value]));
  measurements.push({browserResourceSample,scenario:slow?'Simulated 1.6Mbps download, 150ms latency, 4x CPU slowdown':'Unthrottled localhost',signInReadyMs,loginMs,settingsNavigationMs,resources});await context.close();
 }
 mkdirSync('test-results/frontend-performance',{recursive:true});writeFileSync('test-results/frontend-performance/results.json',JSON.stringify({scope:'Single cold-cache run per condition, isolated local backend, Chromium phone emulation. Service workers blocked for cold loads. No agreed performance threshold; not an LTE, real-phone or cloud result. Browser resource samples: heap sizes in bytes, TaskDuration in seconds, DOM counts dimensionless; one sample is not a peak or sustained-capacity measurement.',measurements},null,2));console.log(JSON.stringify(measurements.map(({resources,...summary})=>({...summary,resourceTransferBytes:resources.reduce((sum,r)=>sum+r.transferBytes,0)})),null,2));
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
