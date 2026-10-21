// Isolated browser navigation fixtures; does not edit working accounts or send SMS.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-checklist-')),'fixture.sqlite');
const db=new Store(database);await db.migrate();await seed(db);
await db.run("DELETE FROM assignments WHERE driver_id='driver'");await db.close();
const base='http://127.0.0.1:15379';
const child=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{env:{...process.env,PORT:'15379',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'',SOLAIR_REALTIME_PROVIDER:'',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''},windowsHide:true,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout?.on('data',b=>logs+=b.toString());child.stderr?.on('data',b=>logs+=b.toString());
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Wait for owned fixture. */}if(child.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready,logs);
 browser=await chromium.launch();mkdirSync('test-results/setup-checklist',{recursive:true});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  const checklist=page.getByRole('region',{name:'Account setup'});
  await checklist.getByRole('button',{name:/Assigned vehicle/}).waitFor();
  async function home(){if(width<=900)await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.locator('.sidebar nav').getByRole('button',{name:'My vehicle',exact:true}).click();await checklist.getByRole('button',{name:/Assigned vehicle/}).waitFor();}
  async function target(id:string){await page.waitForFunction(id=>document.activeElement?.id===id,id);assert.equal(await page.locator('#'+id).isVisible(),true);const box=await page.locator('#'+id).boundingBox();assert.ok(box&&box.y>=0&&box.y<900,JSON.stringify(box));}
  await checklist.getByRole('button',{name:/Account created/}).focus();await page.keyboard.press('Enter');await target('profile-settings');await home();
  await checklist.getByRole('button',{name:/TODA membership/}).click();await target('registration-details');await home();
  for(const label of ['Assigned vehicle','Responsible operator']){
   await checklist.getByRole('button',{name:new RegExp(label)}).click();await target('assignment-help');await page.getByText('These changes require an administrator.',{exact:false}).waitFor();
   await page.getByRole('button',{name:'View my registration and assignments',exact:true}).click();await target('registration-details');await home();
  }
  await checklist.getByRole('button',{name:/Alert contact saved/}).click();await target('alert-contact');await page.getByLabel('Mobile number',{exact:true}).waitFor();await home();
  // Cover optional verification, pending membership/access and completed assignment branches.
  const cases=[['toda','TODA membership',false,'assignment-help'],['operator-access','Operator access',false,'assignment-help'],['vehicle','Assigned vehicle',true,'registration-details'],['operator','Responsible operator',true,'registration-details'],['email','Email ownership verified',false,'email-verification'],['phone','Mobile ownership verified',false,'verify-mobile']] as const;
  for(const [id,label,complete,destination] of cases){
   await page.route('**/api/setup-readiness',route=>route.fulfill({json:{assignment_complete:false,sms_opted_in:true,tasks:[{id,label,complete,required:true,action:'Isolated navigation fixture'}]}}));
   await page.reload();await checklist.getByRole('button',{name:new RegExp(label)}).click();await target(destination);await page.unroute('**/api/setup-readiness');
  }
  await page.reload();await checklist.getByRole('button',{name:/Assigned vehicle/}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`test-results/setup-checklist/${width}.png`,fullPage:true});assert.deepEqual(errors,[]);await context.close();
  console.log(`${width}px: real pending setup, keyboard activation, precise settings focus, administrator guidance, optional verification and completed assignment links passed`);
 }
}finally{await browser?.close();child.kill('SIGTERM');child.stdout?.destroy();child.stderr?.destroy();child.unref();}
