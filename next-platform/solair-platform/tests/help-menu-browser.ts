import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-help-menu-')),'fixture.sqlite');
const db=new Store(database);await db.migrate();await seed(db);await db.run("DELETE FROM assignments WHERE driver_id='driver'");await db.close();
const base='http://127.0.0.1:15388';
const server=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'15388',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'local',SOLAIR_REALTIME_PROVIDER:'local',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''}});
let logs='';server.stdout?.on('data',b=>logs+=b);server.stderr?.on('data',b=>logs+=b);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Fixture startup. */}if(server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready,logs);
 browser=await chromium.launch();mkdirSync('test-results/help-menu',{recursive:true});
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  if(width===390)await page.route(/\/api\/notifications\?/,route=>route.fulfill({json:[{id:'bottom-navigation-fixture',revision:'bottom-navigation-fixture-v1',category:'security',title:'TEST FIXTURE Recorded alert',body:'Isolated navigation fixture',created_at:new Date().toISOString(),source:'hardware',page:'Security',vehicle_id:null}]}));
  await page.goto(base);if(page.viewportSize()!.width<=650&&!await page.getByLabel('Email address',{exact:true}).count())await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('driver@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:/Open notifications/}).isVisible(),width>650);
  if(width===390){
   const bottom=page.locator('.bottom-nav'),notificationButton=bottom.getByRole('button',{name:'Notifications',exact:true}),feed=page.getByRole('region',{name:'Notifications',exact:true});
   assert.equal(await bottom.getByRole('button',{name:'Help',exact:true}).count(),0);
   for(const phoneWidth of [320,360,390]){await page.setViewportSize({width:phoneWidth,height:900});const box=await notificationButton.boundingBox();assert.ok(box&&box.width>=44&&box.height>=44);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
   await notificationButton.click();await feed.waitFor();await page.getByRole('heading',{name:'Notifications',exact:true,level:1}).waitFor();await feed.getByText('TEST FIXTURE Recorded alert',{exact:true}).waitFor();assert.equal(await page.getByRole('dialog',{name:'Notifications',exact:true}).count(),0);assert.equal(await feed.getByRole('button',{name:'Close notifications',exact:true}).count(),0);assert.equal(await page.getByRole('heading',{name:'No assigned vehicle',exact:true}).count(),0);
   await feed.getByLabel('Notification category',{exact:true}).selectOption('security');await feed.getByRole('button',{name:'Mark all read',exact:true}).click();
   await page.reload();await feed.getByText('TEST FIXTURE Recorded alert',{exact:true}).waitFor();assert.equal(await notificationButton.getAttribute('aria-current'),'page');assert.equal(await feed.getByRole('button',{name:'Mark all read',exact:true}).isDisabled(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await feed.evaluate(el=>getComputedStyle(el).position),'static');await page.screenshot({path:'test-results/help-menu/mobile-bottom-notifications.png'});
   await bottom.getByRole('button',{name:'Home',exact:true}).click();await feed.waitFor({state:'hidden'});await notificationButton.click();await feed.getByRole('button').filter({hasText:'TEST FIXTURE Recorded alert'}).click();await page.getByRole('heading',{name:'Security',exact:true,level:1}).waitFor();await feed.waitFor({state:'hidden'});
  }
  async function help(){if(width===390)await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.locator('.sidebar nav').getByRole('button',{name:'Help',exact:true}).click();await page.getByRole('region',{name:'Help and information',exact:true}).waitFor();}
  await help();const menu=page.getByRole('region',{name:'Help and information',exact:true});
  await menu.getByRole('button',{name:'Help center',exact:true}).waitFor();
  for(const theme of ['light','dark']){
   await page.evaluate(value=>{localStorage.setItem('solair-appearance',value);window.dispatchEvent(new StorageEvent('storage',{key:'solair-appearance',newValue:value}));},theme);
   const release=menu.locator('summary').filter({hasText:'Release notes'});await release.focus();await page.keyboard.press('Enter');await menu.getByText('Latest interface updates',{exact:true}).waitFor();await release.click();
   const shortcuts=menu.locator('summary').filter({hasText:'Keyboard shortcuts'});
   if(width>650){await shortcuts.click();await menu.getByText('Move between controls.',{exact:true}).waitFor();}else assert.equal(await shortcuts.isVisible(),false);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`test-results/help-menu/${width}-${theme}.png`,fullPage:true});if(width>650)await shortcuts.click();
  }
  for(const title of ['Terms of Service','Privacy Policy']){
   await menu.getByRole('button',{name:new RegExp(title)}).click();
   const draft=page.getByRole('article',{name:title+' draft',exact:true});await draft.getByText('Draft for review',{exact:true}).waitFor();
   assert.equal(await draft.getByRole('heading',{name:title,exact:true}).evaluate(el=>document.activeElement===el),true);
   assert.equal(await page.getByRole('heading',{name:'No assigned vehicle',exact:true}).count(),0);
   await page.reload();await draft.waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:`test-results/help-menu/${width}-${title.replaceAll(' ','-')}.png`,fullPage:true});
   await draft.getByRole('button',{name:'Back to Help',exact:true}).click();await menu.waitFor();
  }
  await menu.getByRole('button',{name:/Privacy center/}).click();await page.waitForFunction(()=>document.activeElement?.id==='alert-contact');
  await help();await menu.getByRole('button',{name:'Report a bug',exact:true}).click();await page.getByRole('heading',{name:'Report a problem',exact:true,level:2}).waitFor();
  await help();await menu.getByRole('button',{name:'Help center',exact:true}).click();await page.getByRole('heading',{name:'How can we help?',exact:true}).waitFor();
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${width}px: Help list, inline keyboard/release information, themes, privacy focus and bug/help navigation`);
 }
}finally{await browser?.close();server.kill('SIGTERM');server.stdout?.destroy();server.stderr?.destroy();server.unref();}
