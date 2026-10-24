// Native dialogs and actual lifecycle endpoints on disposable accounts only.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
import {passwordHash} from '../server/auth';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-account-ui-')),'fixture.sqlite'),db=new Store(database);
await db.migrate();await seed(db);
for(const width of [1440,390])await db.run('INSERT INTO profiles(id,org_id,email,name,role,password_hash) VALUES(?,?,?,?,?,?)',['remove-'+width,'manila',`remove-${width}@example.com`,'TEST FIXTURE Remove '+width,'driver',passwordHash('FixtureOnly!2026')]);
await db.run('INSERT INTO messages VALUES(?,?,?,?,?,?,?,?)',['protected-history','manila','ET-01','driver','hardware','TEST FIXTURE preserved message',new Date().toISOString(),null]);await db.close();
const base='http://127.0.0.1:15382';
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{env:{...process.env,PORT:'15382',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'',SOLAIR_REALTIME_PROVIDER:'',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''},windowsHide:true,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout?.on('data',b=>logs+=b.toString());server.stderr?.on('data',b=>logs+=b.toString());let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned server. */}if(server.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready,logs);
 browser=await chromium.launch();mkdirSync('test-results/account-lifecycle',{recursive:true});
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.getByLabel('Email address',{exact:true}).fill('admin@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();
  if(width===390){await page.evaluate(()=>{localStorage.setItem('solair-appearance','dark');window.dispatchEvent(new StorageEvent('storage',{key:'solair-appearance',newValue:'dark'}));});await page.getByRole('button',{name:'Toggle menu',exact:true}).click();}
  await page.locator('.sidebar nav').getByRole('button',{name:'People & assignments',exact:true}).click();
  const directory=page.locator('.people-directory');
  async function search(email:string){await directory.getByPlaceholder('Name or email').fill(email);const response=page.waitForResponse(r=>r.url().includes('/api/people?')&&new URL(r.url()).searchParams.get('q')===email);await directory.getByRole('button',{name:'Search',exact:true}).click();await response;await directory.getByText('1 account(s) · Page 1 of 1',{exact:true}).waitFor();await directory.locator('.person-card').filter({hasText:email}).waitFor();}
  await search('admin@solair.local');assert.equal(await directory.getByRole('button',{name:'Manage account',exact:true}).count(),0);
  const email=`remove-${width}@example.com`;await search(email);await directory.getByRole('button',{name:'Manage account',exact:true}).click();await directory.getByRole('button',{name:'Deactivate account',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Type the account email to confirm').fill('wrong@example.com');await dialog.getByLabel('Reason',{exact:true}).fill('TEST FIXTURE review');assert.equal(await dialog.getByRole('button',{name:'Deactivate account',exact:true}).isDisabled(),true);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await directory.getByRole('button',{name:'Deactivate account',exact:true}).evaluate(el=>el===document.activeElement),true);
  async function confirm(action:string){await dialog.getByLabel('Type the account email to confirm').fill(email);await dialog.getByLabel('Reason',{exact:true}).fill('TEST FIXTURE account lifecycle review');await dialog.getByRole('button',{name:action,exact:true}).click();await dialog.waitFor({state:'hidden'});}
  await directory.getByRole('button',{name:'Deactivate account',exact:true}).click();assert.equal(await dialog.getByLabel('Type the account email to confirm').inputValue(),'');await confirm('Deactivate account');await directory.getByText('Deactivated',{exact:true}).waitFor();
  await directory.getByRole('button',{name:'Manage account',exact:true}).click();await directory.getByRole('button',{name:'Reactivate account',exact:true}).click();await confirm('Reactivate account');await directory.getByText('Active',{exact:true}).waitFor();
  await directory.getByRole('button',{name:'Manage account',exact:true}).click();await directory.getByRole('button',{name:'Deactivate account',exact:true}).click();await confirm('Deactivate account');await directory.getByText('Deactivated',{exact:true}).waitFor();
  await directory.getByRole('button',{name:'Manage account',exact:true}).click();await directory.getByRole('button',{name:'Permanently delete account',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const box=await dialog.boundingBox();assert.ok(box&&box.width<=width&&box.x>=0);await page.screenshot({path:`test-results/account-lifecycle/confirm-${width}.png`});
  if(width===390){
   // Browser-side provider outage fixture; the separate server test exercises
   // the real provider-failure state transition with a fake identity adapter.
   await page.route('**/api/admin/people/remove-390',async route=>{const fixture=new Store(database);try{await fixture.run("UPDATE account_states SET deletion_pending=1 WHERE user_id='remove-390'");}finally{await fixture.close();}await route.fulfill({status:502,json:{error:'TEST FIXTURE: Identity deletion could not be confirmed. Account remains pending deletion.'}});});
   await confirm('Permanently delete account');await page.unroute('**/api/admin/people/remove-390');await directory.getByText('Deletion pending',{exact:true}).waitFor();
   await directory.getByRole('button',{name:'Manage account',exact:true}).click();assert.equal(await directory.getByRole('button',{name:'Reactivate account',exact:true}).count(),0);await directory.getByRole('button',{name:'Retry permanent deletion',exact:true}).click();
  }
  await confirm('Permanently delete account');await directory.getByText('No accounts match this search.',{exact:true}).waitFor();
  if(width===390){
   await search('driver@solair.local');await directory.getByRole('button',{name:'Manage account',exact:true}).click();await directory.getByRole('button',{name:'Deactivate account',exact:true}).click();
   await dialog.getByLabel('Type the account email to confirm').fill('driver@solair.local');await dialog.getByLabel('Reason',{exact:true}).fill('TEST FIXTURE preserve history');await dialog.getByRole('button',{name:'Deactivate account',exact:true}).click();await dialog.waitFor({state:'hidden'});await directory.getByText('Deactivated',{exact:true}).waitFor();
   await directory.getByRole('button',{name:'Manage account',exact:true}).click();await directory.getByRole('button',{name:'Permanently delete account',exact:true}).click();await dialog.getByLabel('Type the account email to confirm').fill('driver@solair.local');await dialog.getByLabel('Reason',{exact:true}).fill('TEST FIXTURE history guard');await dialog.getByRole('button',{name:'Permanently delete account',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'saved operational history'}).waitFor();await page.screenshot({path:'test-results/account-lifecycle/history-protected.png'});
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${width}px: protected self, typed confirmation, Escape/focus, deactivation/reactivation, permanent deletion and responsive dialog`);
 }
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
