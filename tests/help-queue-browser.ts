// Disposable fault-injection fixture; no real user records, hardware, or provider calls.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
import {helpQueueReadError, helpQueueWriteError} from '../src/help-queue';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-queue-quality-')),'fixture.sqlite'),base='http://127.0.0.1:15414';
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15414',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;server.stdout?.on('data',x=>logs+=x);server.stderr?.on('data',x=>logs+=x);
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Disposable server is starting. */}if(server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,500));}assert(ready,logs);
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await context.addInitScript(()=>localStorage.setItem('solair-unsent-driver','{TEST FIXTURE corrupt'));
 await page.goto(base);await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('heading',{name:'Ready for the road, Miguel.',exact:true}).waitFor();await page.getByText(helpQueueReadError,{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('solair-unsent-driver')),'{TEST FIXTURE corrupt');assert.deepEqual(errors,[]);
 await page.evaluate(()=>{
  localStorage.setItem('solair-unsent-driver','[]');
  const original=Storage.prototype.setItem;(window as any).queueFixtureSetItem=original;
  Storage.prototype.setItem=function(key,value){if(key.startsWith('solair-unsent-'))throw new DOMException('TEST FIXTURE quota','QuotaExceededError');return original.call(this,key,value);};
 });
 await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.locator('.sidebar nav').getByRole('button',{name:'Help',exact:true}).click();
 const form=page.locator('#assistance-request form');await form.locator('textarea[name=notes]').fill('TEST FIXTURE queue cannot be saved');
 await page.route('**/api/help*',route=>route.request().method()==='POST'?route.abort('failed'):route.continue());
 await form.getByRole('button',{name:'Send help request',exact:true}).click();await page.getByText(helpQueueWriteError,{exact:true}).waitFor();assert.equal(await form.getByRole('button',{name:'Send help request',exact:true}).isEnabled(),true);
 assert.equal(await form.locator('textarea[name=notes]').inputValue(),'TEST FIXTURE queue cannot be saved');assert.equal(await page.evaluate(()=>localStorage.getItem('solair-unsent-driver')),'[]');
 await page.unroute('**/api/help*');await page.evaluate(()=>{Storage.prototype.setItem=(window as any).queueFixtureSetItem;delete (window as any).queueFixtureSetItem;});
 await form.getByRole('button',{name:'Send help request',exact:true}).click();await page.getByText('Server received your request. Awaiting operator acknowledgment.',{exact:true}).waitFor();
 const verify=new Store(database);try{const rows=await verify.query('SELECT id FROM help_requests WHERE notes=?',['TEST FIXTURE queue cannot be saved']);assert.equal(rows.length,1);}finally{await verify.close();}
 await form.locator('textarea[name=notes]').fill('TEST FIXTURE queued reconnect');
 await page.route('**/api/help*',route=>route.request().method()==='POST'?route.abort('failed'):route.continue());
 await form.getByRole('button',{name:'Send help request',exact:true}).click();await page.getByText('Request QUEUED / UNSENT. No server acknowledgment received.',{exact:true}).waitFor();
 const queued=await page.evaluate(()=>JSON.parse(localStorage.getItem('solair-unsent-driver')||'[]'));assert.equal(queued.length,1);
 await page.unroute('**/api/help*');await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await page.waitForFunction(()=>localStorage.getItem('solair-unsent-driver')==='[]');
 // Simulate a lost receipt: replay the same saved identity, not a new request.
 await page.evaluate(queued=>{localStorage.setItem('solair-unsent-driver',JSON.stringify(queued));window.dispatchEvent(new Event('online'));},queued);
 await page.waitForFunction(()=>localStorage.getItem('solair-unsent-driver')==='[]');
 const replayDb=new Store(database);try{assert.equal((await replayDb.query('SELECT id FROM help_requests WHERE notes=?',['TEST FIXTURE queued reconnect'])).length,1);}finally{await replayDb.close();}
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:45000});
 const worker=context.serviceWorkers().find(worker=>worker.url().endsWith('/sw.js'));assert(worker);
 const cached=await worker.evaluate(async()=>{const keys=await caches.keys();const paths:string[]=[];for(const key of keys){for(const request of await (await caches.open(key)).keys())paths.push(new URL(request.url).pathname);}return paths;});
 assert(cached.includes('/'));assert(!cached.some(path=>path.startsWith('/api/')),'Private API responses must never enter the offline shell cache');
 await context.setOffline(true);await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('img[alt="SolAir"]:visible').first().waitFor();
 await page.waitForFunction(()=>[...document.images].some(image=>image.alt==='SolAir'&&image.offsetWidth>0&&image.complete&&image.naturalWidth>0));
 const offlineAssets=await page.evaluate(async()=>{
  const manual=await fetch('/downloads/SOLAIR-user-manual.pdf'),solar=await fetch('/_next/image?url=%2Fenergy-solar-panels.webp&w=640&q=75');
  return {manualOk:manual.ok,manualHeader:new TextDecoder().decode((await manual.arrayBuffer()).slice(0,4)),solarOk:solar.ok,solarType:solar.headers.get('content-type'),solarBytes:(await solar.arrayBuffer()).byteLength};
 });
 assert(offlineAssets.manualOk&&offlineAssets.manualHeader==='%PDF');assert(offlineAssets.solarOk&&offlineAssets.solarType?.startsWith('image/')&&offlineAssets.solarBytes>0);
 await context.setOffline(false);
 assert.deepEqual(errors,[]);console.log('PASS: corrupt/quota-failed queues preserve data and form details; reconnect and lost-receipt replay save one request; offline shell loads without caching private APIs.');
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
