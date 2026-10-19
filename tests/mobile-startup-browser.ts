// Disposable visual check. Never use the working database.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
const port=15376,probe=createServer();
await new Promise<void>((resolve,reject)=>{probe.on('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(()=>resolve()));});
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-layout-')),'fixture.sqlite');
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const output='test-results/mobile-startup';mkdirSync(output,{recursive:true});
const base=`http://127.0.0.1:${port}`,child=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
child.stdout?.on('data',x=>logs+=x.toString());child.stderr?.on('data',x=>logs+=x.toString());
try{
 let ready=false;for(let i=0;i<120;i++){if(child.exitCode!==null)throw new Error(logs);try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned preview startup. */}await new Promise(r=>setTimeout(r,500));}assert.ok(ready);
 browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
 const errors:string[]=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const state={introAt:0,introEndedAt:0,sawAuth:false};(window as any).introEvidence=state;
  new MutationObserver(()=>{
   if(document.querySelector('.mobile-intro')&&!state.introAt)state.introAt=performance.now();
   if(state.introAt&&!document.querySelector('.mobile-intro')&&!state.introEndedAt)state.introEndedAt=performance.now();
   if(document.querySelector('.login-entry'))state.sawAuth=true;
  }).observe(document,{childList:true,subtree:true});
 });
 await page.goto(base,{waitUntil:'domcontentloaded'});const intro=page.getByRole('status',{name:'Starting SOLAIR',exact:true});await intro.waitFor();
 assert.equal(await page.getByLabel('Email address',{exact:true}).count(),0);
 const screen=await intro.boundingBox();assert.ok(screen);assert.equal(screen.width,390);assert.equal(screen.height,844);
 await page.screenshot({path:output+'/intro.png'});
 await page.getByLabel('Email address',{exact:true}).waitFor();
 const duration=await page.evaluate(()=>{const s=(window as any).introEvidence;return s.introEndedAt-s.introAt;});assert.ok(duration>=400&&duration<2500,`Intro duration ${duration}ms`);
 assert.equal(await page.locator('.login-entry>.login-art').isVisible(),false);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  const a=await page.getByRole('button',{name:'Sign in',exact:true}).boundingBox(),b=await page.getByRole('link',{name:'Sign up',exact:true}).boundingBox();assert.ok(a&&b);assert.ok(Math.abs(a.width-b.width)<1);assert.ok(Math.abs(a.height-b.height)<1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:output+'/sign-in.png',fullPage:true});
 await page.getByRole('link',{name:'Sign up',exact:true}).click();await page.getByRole('heading',{name:'Create your SOLAIR account',exact:true}).waitFor();
 assert.equal(await page.locator('.login-entry>.login-art').isVisible(),false);
 const create=await page.getByRole('button',{name:'Create account',exact:true}).boundingBox(),back=await page.getByRole('link',{name:'Back to sign in',exact:true}).boundingBox();assert.ok(create&&back);assert.ok(Math.abs(create.width-back.width)<1);assert.ok(Math.abs(create.height-back.height)<1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:output+'/sign-up.png',fullPage:true});
 await page.getByRole('link',{name:'Back to sign in',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Ready for the road, Miguel.',exact:true}).waitFor();
 await page.reload();await intro.waitFor();assert.equal(await page.getByLabel('Email address',{exact:true}).count(),0);await page.getByRole('heading',{name:'Ready for the road, Miguel.',exact:true}).waitFor();assert.equal(await page.evaluate(()=>(window as any).introEvidence.sawAuth),false);
 console.log('PASS: mobile intro fills the viewport for approximately 0.5 seconds; returning sessions reach the dashboard without an auth-screen flash');
 // A slow session check must not reveal the sign-in form before the existing session resolves.
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});let forwarded!:()=>void;const done=new Promise<void>(resolve=>{forwarded=resolve;});
 await page.route('**/api/me',async route=>{await held;await route.continue();forwarded();},{times:1});
 await page.reload();await intro.waitFor();await page.waitForTimeout(1700);assert.equal(await intro.isVisible(),true);assert.equal(await page.getByLabel('Email address',{exact:true}).count(),0);release();await done;await page.unroute('**/api/me');await page.getByRole('heading',{name:'Ready for the road, Miguel.',exact:true}).waitFor();assert.equal(await page.evaluate(()=>(window as any).introEvidence.sawAuth),false);
 console.log('PASS: a slow saved-session check keeps the branded screen visible rather than showing a false signed-out form');
 await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.locator('.sidebar nav').getByRole('button',{name:'Log out',exact:true}).click();await page.getByLabel('Email address',{exact:true}).waitFor();assert.equal(await intro.count(),0);
 const desktop=await browser.newPage({viewport:{width:1440,height:1000}});desktop.on('pageerror',e=>errors.push(e.message));await desktop.goto(base);await desktop.getByLabel('Email address',{exact:true}).waitFor();assert.equal(await desktop.locator('.mobile-intro').count(),0);assert.equal(await desktop.locator('.login-art').isVisible(),true);
 assert.deepEqual(errors,[]);console.log('PASS: equal-size auth actions at 320/390px, clean mobile signup, logout without a repeated intro, and unchanged desktop branding; no browser errors');
}finally{await browser?.close();child.kill('SIGTERM');child.stdout?.destroy();child.stderr?.destroy();child.unref();}
