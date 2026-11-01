// Isolated new-account onboarding checks; never uses the working application database.
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-notification-intro-')),'fixture.sqlite');
const base='http://127.0.0.1:15402',password='SolairDemo!2026';
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const env={...process.env,PORT:'15402',SOLAIR_DB_PATH:database,SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:'',DATABASE_URL:'',SOLAIR_AUTH_PROVIDER:'',SOLAIR_REALTIME_PROVIDER:''};
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='';server.stdout?.on('data',v=>output+=v);server.stderr?.on('data',v=>output+=v);
// The disposable HTTP-only loopback fixture relaxes its test cookie; application cookie security is unchanged.
const browser=await chromium.launch();
const errors:string[]=[];
try{
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned fixture starts here. */}if(server.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,400));}
 assert(ready,output);
 const existing=await browser.newContext();
 assert.equal((await existing.request.post(base+'/api/login',{data:{email:'driver@solair.local',password}})).status(),200);
 await existing.addCookies((await existing.cookies()).map(cookie=>({...cookie,secure:false})));
 assert.equal((await existing.request.get(base+'/api/me').then(r=>r.json())).notification_intro_pending,false);
 await existing.close();
 const anonymous=await browser.newContext();
 assert.equal((await anonymous.request.post(base+'/api/notifications/onboarding',{data:{enable:true}})).status(),401);
 await anonymous.close();
 for(const enable of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const email=`intro-${enable}@example.test`;
  const created=await context.request.post(base+'/api/signup',{data:{name:'TEST FIXTURE New Driver',email,password,confirmation:password,phone:'+639171234567',sms_consent:false,requested_role:'driver',vehicle_brand:'BEMAC'}});
  assert.equal(created.status(),201,await created.text());
  const fixture=new Store(database);await fixture.run('UPDATE profiles SET notifications=0 WHERE email=?',[email]);await fixture.close();
  assert.equal((await context.request.post(base+'/api/login',{data:{email,password}})).status(),200);
  await context.addCookies((await context.cookies()).map(cookie=>({...cookie,secure:false})));
  let profile=await context.request.get(base+'/api/me').then(r=>r.json());assert.equal(profile.notification_intro_pending,true);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  await page.getByRole('heading',{name:'Get notified about important updates'}).waitFor();
  await page.reload();await page.getByRole('heading',{name:'Get notified about important updates'}).waitFor();
  for(const theme of ['light','dark'] as const){await page.emulateMedia({colorScheme:theme});for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}}
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'light'});
  await page.evaluate(()=>scrollTo(0,0));
  const actions=await page.locator('.notification-intro-actions>div').boundingBox(),navigation=await page.locator('.bottom-nav').boundingBox();
  assert(actions&&navigation&&actions.y+actions.height<=navigation.y,'Onboarding choices must be visible above mobile navigation');
  if(enable){
   await page.route('**/api/notifications/onboarding',r=>r.fulfill({status:503,json:{error:'TEST FIXTURE unavailable'}}));
   await page.getByRole('button',{name:'Get notified',exact:true}).click();await page.getByRole('alert').filter({hasText:'Your choice could not be saved'}).waitFor();
   await page.unroute('**/api/notifications/onboarding');
  }
  mkdirSync('test-results/notification-onboarding',{recursive:true});
  await page.screenshot({path:`test-results/notification-onboarding/TEST-FIXTURE-${enable?'enable':'later'}.png`,fullPage:true});
  await page.getByRole('button',{name:enable?'Get notified':'Later',exact:true}).click();
  await page.getByRole('heading',{name:'Your inbox',exact:true}).waitFor();
  profile=await context.request.get(base+'/api/me').then(r=>r.json());assert.equal(profile.notification_intro_pending,false);assert.equal(profile.notifications,enable?1:0);
  await page.reload();await page.getByRole('heading',{name:'Your inbox',exact:true}).waitFor();assert.equal(await page.locator('.notification-onboarding').count(),0);
  await context.request.post(base+'/api/notifications/onboarding',{data:{enable:!enable}});
  assert.equal((await context.request.get(base+'/api/me').then(r=>r.json())).notifications,enable?1:0,'A completed introduction cannot change preferences on replay');
  await context.close();
  const second=await browser.newContext();await second.request.post(base+'/api/login',{data:{email,password}});await second.addCookies((await second.cookies()).map(cookie=>({...cookie,secure:false})));assert.equal((await second.request.get(base+'/api/me').then(r=>r.json())).notification_intro_pending,false);await second.close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: new signups only, automatic first-sign-in introduction, refresh persistence, Later/enable preferences, save failure/retry, completion across browser sessions, replay safety, authenticated access, responsive themes; disposable database only.');
}finally{await browser.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
