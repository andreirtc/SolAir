// Disposable database; test icons stand in for uploaded photos and are not driver photos.
import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdtempSync,mkdirSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
import {Store} from '../server/db';import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-profile-photo-')),'fixture.sqlite'),base='http://127.0.0.1:15410';
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15410',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let output='';server.stdout?.on('data',v=>output+=v);server.stderr?.on('data',v=>output+=v);
const browser=await chromium.launch(),errors:string[]=[];
try{
let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned fixture starts here. */}if(server.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,400));}assert(ready,output);
const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));
await p.goto(base);await p.getByRole('button',{name:'Get started',exact:true}).click();await p.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await p.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.locator('.bottom-nav').getByRole('button',{name:'Settings',exact:true}).click();await p.getByRole('button',{name:'Edit profile',exact:true}).click();
const choose=p.getByLabel('Choose profile photo',{exact:true});
assert.equal(await p.getByRole('button',{name:'Save photo',exact:true}).isDisabled(),true);
assert.equal(await choose.getAttribute('accept'),'.img,.png');
await choose.setInputFiles({name:'wrong-extension.jpg',mimeType:'image/png',buffer:readFileSync('public/icon-192.png')});await p.getByRole('alert').filter({hasText:'Choose a PNG or IMG'}).waitFor();
await choose.setInputFiles({name:'not-photo.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await p.getByRole('alert').filter({hasText:'Choose a PNG or IMG'}).waitFor();
await choose.setInputFiles({name:'too-large.png',mimeType:'image/png',buffer:Buffer.alloc(3000001)});await p.getByRole('alert').filter({hasText:'Choose a PNG or IMG'}).waitFor();
await choose.setInputFiles('public/icon-192.png');await p.locator('.profile-photo-preview img').waitFor();assert.equal(await p.getByRole('button',{name:'Save photo',exact:true}).isEnabled(),true);
for(const width of [320,390,1440]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
await p.setViewportSize({width:390,height:844});
await p.route('**/api/profile-photo',route=>route.request().method()==='POST'?route.fulfill({status:503,json:{error:'TEST FIXTURE unavailable'}}):route.continue());
await p.getByRole('button',{name:'Save photo',exact:true}).click();await p.getByRole('alert').filter({hasText:'Your photo could not be saved'}).waitFor();await p.unroute('**/api/profile-photo');
await p.getByRole('button',{name:'Save photo',exact:true}).click();await p.getByText('Profile photo saved.',{exact:true}).waitFor();await p.locator('.account-trigger .profile-avatar img').waitFor();
await p.getByRole('button',{name:'Back to settings',exact:true}).click();await p.locator('.settings-profile-avatar img').waitFor();await p.reload();await p.locator('.settings-profile-avatar img').waitFor();assert(await p.locator('.settings-profile-avatar img').evaluate(el=>(el as HTMLImageElement).complete&&(el as HTMLImageElement).naturalWidth>0));
await p.setViewportSize({width:1440,height:900});await p.locator('.sidebar .account .profile-avatar img').waitFor();await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'Edit profile',exact:true}).click();
await p.getByLabel('Choose profile photo',{exact:true}).setInputFiles({name:'driver.img',mimeType:'application/octet-stream',buffer:readFileSync('public/icon-512.png')});await p.getByRole('button',{name:'Save photo',exact:true}).click();await p.getByText('Profile photo saved.',{exact:true}).waitFor();
mkdirSync('test-results/profile-photos',{recursive:true});await p.screenshot({path:'test-results/profile-photos/TEST-FIXTURE-upload-controls.png',fullPage:true});
await p.getByRole('button',{name:'Remove photo',exact:true}).click();await p.getByText('Profile photo removed.',{exact:true}).waitFor();assert.equal(await p.locator('.account-trigger .profile-avatar img').count(),0);assert.equal(await p.locator('.profile-photo-preview img').count(),0);
await p.getByRole('button',{name:'Back to settings',exact:true}).click();assert.equal(await p.locator('.settings-profile-avatar img').count(),0);
assert.deepEqual(errors,[]);console.log('PASS: file validation, preview, upload failure/retry, saved photo in Settings/top bar/sidebar, refresh persistence, replacement, removal, initial-avatar fallback, responsive widths; isolated database and icon test fixtures only.');
}finally{await browser.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
