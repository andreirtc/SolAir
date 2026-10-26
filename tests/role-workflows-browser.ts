// Disposable operator/admin fixture; no real users, providers or hardware.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-role-quality-')),'fixture.sqlite'),base='http://127.0.0.1:15416';
const db=new Store(database);await db.migrate();await seed(db);
const [assignment]=await db.query('SELECT a.vehicle_id,p.org_id FROM assignments a JOIN profiles p ON p.id=a.driver_id WHERE a.driver_id=?',['driver']);
const requestId=randomUUID(),notes='TEST FIXTURE operator follow-up',at=new Date().toISOString();
await db.run('INSERT INTO help_requests VALUES (?,?,?,?,?,?,?,?,?,?)',[requestId,assignment.org_id,assignment.vehicle_id,'driver','hardware','Mechanical assistance',notes,'pending',at,at]);await db.close();
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15416',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;server.stdout?.on('data',x=>logs+=x);server.stderr?.on('data',x=>logs+=x);
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned fixture startup. */}if(server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,500));}assert(ready,logs);
 browser=await chromium.launch();const errors:string[]=[];
 for(const role of ['operator','admin']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  await page.getByLabel('Email address',{exact:true}).fill(role+'@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();
  if(role==='operator'){
   await page.locator('.sidebar nav').getByRole('button',{name:/^SOS & Assistance/}).click();
   const request=page.locator('.request').filter({hasText:notes});await request.getByRole('button',{name:'Acknowledge',exact:true}).click();await request.getByText('acknowledged',{exact:true}).waitFor();
   await request.getByRole('button',{name:'Mark resolved',exact:true}).click();await request.getByText('resolved',{exact:true}).waitFor();
   assert.equal(await page.evaluate(async()=> (await fetch('/api/organizations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'TEST FIXTURE forbidden organization'})})).status),403);
   assert.equal(await page.locator('.sidebar nav').getByRole('button',{name:'People & assignments',exact:true}).count(),0);
  }else{await page.locator('.sidebar nav').getByRole('button',{name:'People & assignments',exact:true}).click();await page.locator('.people-directory').waitFor();assert(await page.locator('.people-directory').getByPlaceholder('Name or email').isVisible());}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.close();
 }
 const check=new Store(database);try{assert.equal((await check.query('SELECT status FROM help_requests WHERE id=?',[requestId]))[0].status,'resolved');}finally{await check.close();}
 assert.deepEqual(errors,[]);console.log('PASS: operator acknowledges/resolves fixture requests and cannot administer organizations/People; admin can open People; no browser errors or overflow.');
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
