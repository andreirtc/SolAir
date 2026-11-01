import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-navigation-')),'fixture.sqlite');
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const base='http://127.0.0.1:15384';
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15384',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='';server.stdout?.on('data',b=>logs+=b);server.stderr?.on('data',b=>logs+=b);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Fixture startup. */}if(server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready,logs);
 browser=await chromium.launch();
 for(const [role,width] of [['admin',1440],['operator',1440],['driver',390]] as const){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  async function signIn(){await page.getByLabel('Email address',{exact:true}).fill(role+'@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();}
  async function current(name:string){await page.locator('.sidebar nav [aria-current="page"]').filter({hasText:role==='driver'&&name==='Overview'?'My vehicle':name}).waitFor({state:'attached'});}
  await page.goto(base);if(page.viewportSize()!.width<=650&&!await page.getByLabel('Email address',{exact:true}).count())await page.getByRole('button',{name:'Get started',exact:true}).click();await signIn();await current('Overview');
  for(const destination of role==='admin'?['People & assignments','Activity log','Settings']:['Energy','Settings']){
   if(width===390)await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
   await page.locator('.sidebar nav').getByRole('button',{name:destination,exact:true}).click();await current(destination);await page.reload();await current(destination);
  }
  // Persisted values must never open pages outside the current role.
  if(role!=='admin'){
   await page.evaluate(()=>{for(const key of Object.keys(sessionStorage))if(key.startsWith('solair-page:'))sessionStorage.setItem(key,'People & assignments');});await page.reload();await current('Overview');
  }
  await page.getByRole('button',{name:'Open account menu',exact:true}).click();await page.getByRole('button',{name:'Help and support',exact:true}).click();await page.reload();await page.getByRole('heading',{name:'Help and support',exact:true}).waitFor();
  await page.getByRole('button',{name:'Open account menu',exact:true}).click();await page.getByRole('dialog',{name:'Account options'}).getByRole('button',{name:'Log out',exact:true}).click();await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();await signIn();await current('Overview');
  if(role==='driver'){
   await page.locator('#workspace-content').evaluate(el=>{
    const animate=el.animate.bind(el);(window as any).pageSlides=[];
    el.animate=((frames:Keyframe[]|PropertyIndexedKeyframes|null,options?:number|KeyframeAnimationOptions)=>{
     (window as any).pageSlides.push(frames);return animate(frames,options);
    }) as typeof el.animate;
   });
   await page.emulateMedia({reducedMotion:'no-preference'});
   const tabs=page.locator('.bottom-nav');
   await tabs.getByRole('button',{name:'Location',exact:true}).click();await current('Location');
   assert.equal(await page.evaluate(()=>(window as any).pageSlides.length),0);
   await page.waitForFunction(()=>{
    const marker=document.querySelector('.bottom-nav-indicator')!.getBoundingClientRect();
    const icon=document.querySelector('.bottom-nav [aria-current="page"] svg')!.getBoundingClientRect();
    return Math.abs(marker.x+marker.width/2-icon.x-icon.width/2)<1;
   });
   assert.notEqual(await tabs.locator('.bottom-nav-indicator').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
   await tabs.getByRole('button',{name:'Home',exact:true}).click();await current('Overview');
   assert.equal(await page.evaluate(()=>(window as any).pageSlides.length),0);
   await tabs.getByRole('button',{name:'Energy',exact:true}).click();await tabs.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByRole('region',{name:'Notifications',exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>(window as any).pageSlides.length),0);
   assert.equal(await page.locator('#workspace-content').evaluate(el=>getComputedStyle(el).transform),'none');
   await tabs.getByRole('button',{name:'Energy',exact:true}).click();await tabs.getByRole('button',{name:'Settings',exact:true}).click();await current('Settings');
   await page.waitForFunction(()=>{
    const marker=document.querySelector('.bottom-nav-indicator')!.getBoundingClientRect();
    const icon=document.querySelector('.bottom-nav [aria-current="page"] svg')!.getBoundingClientRect();
    return Math.abs(marker.x+marker.width/2-icon.x-icon.width/2)<1;
   });
   await page.emulateMedia({reducedMotion:'reduce'});const before=await page.evaluate(()=>(window as any).pageSlides.length);
   await tabs.getByRole('button',{name:'Home',exact:true}).click();await current('Overview');
   assert.equal(await page.evaluate(()=>(window as any).pageSlides.length),before);
   assert.equal(await tabs.locator('.bottom-nav-indicator').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
   for(const width of [320,360,390]){
    await page.setViewportSize({width,height:844});
    await tabs.getByRole('button',{name:'Location',exact:true}).click();
    const marker=await tabs.locator('.bottom-nav-indicator').boundingBox(),icon=await tabs.locator('[aria-current="page"] svg').boundingBox();
    assert.ok(marker&&icon&&Math.abs(marker.x+marker.width/2-icon.x-icon.width/2)<1,`Marker alignment at ${width}px`);
    await tabs.getByRole('button',{name:'Home',exact:true}).click();
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   console.log('PASS mobile motion: only the yellow tab marker slides; pages stay still, including Energy to Notifications; rapid selection and reduced-motion fallback passed');
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${role} ${width}px: refresh retains page, role validation and logout reset`);
 }
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
