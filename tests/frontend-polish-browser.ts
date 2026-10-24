// Disposable UI fixtures: no working accounts, real messages, SMS or hardware.
import {chromium,type Page} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-polish-')),'fixture.sqlite');
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const base='http://127.0.0.1:15380';
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{env:{...process.env,PORT:'15380',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'',SOLAIR_REALTIME_PROVIDER:'',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''},windowsHide:true,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout?.on('data',b=>logs+=b.toString());server.stderr?.on('data',b=>logs+=b.toString());
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
async function doubleSubmit(page:Page,selector:string){await page.locator(selector).evaluate(form=>{(form as HTMLFormElement).requestSubmit();(form as HTMLFormElement).requestSubmit();});}
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned fixture startup. */}if(server.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready,logs);
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 mkdirSync('test-results/frontend-polish',{recursive:true});await page.goto(base);if(page.viewportSize()!.width<=650&&!await page.getByLabel('Email address',{exact:true}).count())await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');
 await page.getByRole('button',{name:'Show password',exact:true}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'text');await page.getByRole('button',{name:'Hide password',exact:true}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'password');
 await page.route('**/api/login',route=>route.abort('failed'));await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('alert').filter({hasText:'SOLAIR could not be reached.'}).waitFor();assert.equal(await page.getByRole('button',{name:'Sign in',exact:true}).isEnabled(),true);await page.unroute('**/api/login');
 await page.route('**/api/login',route=>route.fulfill({status:503,contentType:'text/html',body:'Unavailable'}));await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('alert').filter({hasText:'temporarily unavailable'}).waitFor();await page.unroute('**/api/login');
 let releaseLogin!:()=>void,loginCount=0;const loginGate=new Promise<void>(resolve=>releaseLogin=resolve);
 await page.route('**/api/login',async route=>{loginCount++;await loginGate;await route.continue();});await doubleSubmit(page,'.login-form form');await page.getByRole('button',{name:'Signing in…',exact:true}).waitFor();assert.equal(loginCount,1);assert.equal(await page.getByRole('button',{name:'Signing in…',exact:true}).isDisabled(),true);releaseLogin();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();await page.unroute('**/api/login');
 await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.locator('.sidebar nav').getByRole('button',{name:'Help',exact:true}).click();await page.getByLabel('Tell your operator what happened').fill('TEST UI FIXTURE: flat tire at the TODA terminal.');
 let releaseHelp!:()=>void,helpCount=0;const helpGate=new Promise<void>(resolve=>releaseHelp=resolve);
 await page.route(/\/api\/help\?/,async route=>{if(route.request().method()==='POST'){helpCount++;await helpGate;}await route.continue();});
 const helpForm=page.getByRole('button',{name:'Send help request',exact:true}).locator('..');await helpForm.evaluate(form=>{(form as HTMLFormElement).requestSubmit();(form as HTMLFormElement).requestSubmit();});
 await page.getByRole('button',{name:'Sending request…',exact:true}).waitFor();assert.equal(helpCount,1);releaseHelp();await page.getByRole('status').filter({hasText:'Server received your request.'}).waitFor();await page.unroute(/\/api\/help\?/);
 await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.locator('.sidebar nav').getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Open TODA messages',exact:false}).click();
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('TEST UI FIXTURE: checking the message send state.');
 let releaseMessage!:()=>void,messageCount=0;const messageGate=new Promise<void>(resolve=>releaseMessage=resolve);
 await page.route(/\/api\/messages\/[^/?]+\?/,async route=>{if(route.request().method()==='POST'){messageCount++;await messageGate;}await route.continue();});await doubleSubmit(page,'.message-composer');await page.getByRole('button',{name:'Sending…',exact:true}).waitFor();assert.equal(messageCount,1);releaseMessage();await page.getByRole('status').filter({hasText:'Message received by server'}).waitFor();await page.unroute(/\/api\/messages\/[^/?]+\?/);
 for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const box=await page.getByRole('button',{name:'Send',exact:true}).boundingBox();assert.ok(box&&box.height>=44&&box.width>=44);await page.screenshot({path:`test-results/frontend-polish/messages-${width}.png`,fullPage:true});}
 assert.deepEqual(errors,[]);console.log('PASS: password visibility; clear network/503 recovery; single sign-in/help/message submission during delays; mobile message composer at 320/390px; no browser errors.');
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
