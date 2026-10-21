// Frontend acceptance using disposable software fixtures. No working accounts or hardware.
import {chromium,type Page} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
const output='test-results/frontend-design',base='http://127.0.0.1:15378';mkdirSync(output,{recursive:true});
delete process.env.DATABASE_URL;
const database=join(mkdtempSync(join(tmpdir(),'solair-design-')),'fixture.sqlite');
const db=new Store(database);await db.migrate();await seed(db);await db.close();
const child=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{env:{...process.env,PORT:'15378',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'0',SOLAIR_AUTH_PROVIDER:'',SOLAIR_REALTIME_PROVIDER:'',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''},windowsHide:true,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout?.on('data',b=>logs+=b.toString());child.stderr?.on('data',b=>logs+=b.toString());
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
const errors:string[]=[],results:string[]=[],navigationMs:number[]=[];
function contrast(a:string,b:string){
 const lum=(value:string)=>{const rgb=value.startsWith('#')?value.slice(1).match(/.{2}/g)!.map(x=>parseInt(x,16)):value.match(/[\d.]+/g)!.slice(0,3).map(Number);const c=rgb.map(x=>{const v=x/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
async function fits(page:Page){
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,JSON.stringify(await page.locator('main *').evaluateAll(elements=>elements.filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right})))));
}
async function navigate(page:Page,label:string){
 const start=Date.now();if(page.viewportSize()!.width<=900)await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
 await page.locator('.sidebar nav').getByRole('button',{name:label,exact:label!=='CPE Lab'}).click();await page.locator('main h1').waitFor();
 if(label==='CPE Lab')await page.getByRole('heading',{name:'From breadboard to road.'}).waitFor();
 navigationMs.push(Date.now()-start);
 await fits(page);
}
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned fixture server startup. */}if(child.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready,logs);
 browser=await chromium.launch();
 for(const role of ['driver','operator','admin','engineer']){
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'});
  await context.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#EAF0FB"/></svg>'}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(role+': '+e.message));
  await page.goto(base);await page.getByLabel('Email address',{exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>{const image=document.querySelector<HTMLImageElement>('.login-art .vehicle-visual img');return !!image?.complete&&image.naturalWidth>0;});
  assert.equal(await page.locator('.login-art .brand svg').count(),1);
  if(role==='driver'){
   await page.screenshot({path:output+'/sign-in-desktop.png',fullPage:true});
   await page.setViewportSize({width:390,height:844});await fits(page);await page.screenshot({path:output+'/sign-in-mobile.png',fullPage:true});
   await page.getByRole('link',{name:'Sign up',exact:true}).click();await page.getByRole('heading',{name:'Create your SOLAIR account'}).waitFor();await fits(page);await page.screenshot({path:output+'/sign-up-mobile.png',fullPage:true});await page.goto(base);await page.setViewportSize({width:1440,height:1000});
  }
  await page.getByLabel('Email address',{exact:true}).fill(role+'@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.match(await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily),/Work Sans/);
  for(const theme of ['light','dark']){
   await page.evaluate(pref=>{localStorage.setItem('solair-appearance',pref);window.dispatchEvent(new StorageEvent('storage',{key:'solair-appearance',newValue:pref}));},theme);
   await page.waitForFunction(expected=>document.documentElement.dataset.theme===expected,theme);
   const colors=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['--page','--surface','--text','--muted','--blue'].map(key=>[key,s.getPropertyValue(key).trim()]));});
   assert.equal(colors['--page'].toLowerCase(),theme==='light'?'#fffdf8':'#12161d');
   for(const background of ['--page','--surface'])for(const foreground of ['--text','--muted','--blue'])assert.ok(contrast(colors[foreground],colors[background])>=4.5,JSON.stringify({theme,foreground,background,ratio:contrast(colors[foreground],colors[background])}));
   for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});await fits(page);await page.screenshot({path:`${output}/${role}-${theme}-${width}.png`,fullPage:true});}
  }
  if(role==='driver'){
   for(const width of [320,360,390]){await page.setViewportSize({width,height:844});await fits(page);for(const button of await page.locator('.bottom-nav button').all()){const box=await button.boundingBox();assert.ok(box&&box.width>=44&&box.height>=44,JSON.stringify(box));}}
   await page.setViewportSize({width:390,height:844});
   const quick=page.getByRole('button',{name:'Find my vehicle',exact:true});await quick.focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Fleet location',exact:true}).waitFor();
   await navigate(page,'My vehicle');await page.locator('.skip-link').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('.skip-link').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');await page.keyboard.press('Enter');assert.equal(await page.locator('#workspace-content').evaluate(el=>el===document.activeElement),true);
   for(const label of ['Location','Energy','Alerts','Help','Settings'])await navigate(page,label);
   const appearance=page.getByRole('radio',{name:'System',exact:true});await appearance.check();await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
   results.push('Driver: 320/360/390px, 44px bottom targets, keyboard shortcuts/skip link, all mobile pages and System appearance');
  }else{
   const pages=role==='admin'?['People & assignments','Organizations','Devices','Activity log','Live Fleet Map','Vehicles','Energy','Security','SOS & Assistance','Messages','History & Reports','Settings','CPE Lab']:role==='engineer'?['Live Fleet Map','Vehicles','Energy','Security','SOS & Assistance','History & Reports','Settings','Devices','CPE Lab']:['Live Fleet Map','Vehicles','Energy','Security','SOS & Assistance','Messages','History & Reports','Settings'];
   for(const label of pages)await navigate(page,label);
   if(role==='operator'){assert.equal(await page.locator('.sidebar nav').getByRole('button',{name:'People & assignments',exact:true}).count(),0);assert.equal(await page.evaluate(async()=>(await fetch('/api/admin/overview')).status),403);}
  }
  results.push(`${role}: SVG branding, fonts, exact light/dark backgrounds, text contrast, desktop/mobile home and authorized navigation`);
  await context.close();
 }
 assert.ok(statSync('public/fonts/outfit-latin.woff2').size+statSync('public/fonts/work-sans-latin.woff2').size<90000);
 assert.deepEqual(errors,[]);results.push('No browser runtime errors; font payload below 90kB; SMS and physical hardware not activated');
 writeFileSync(output+'/results.json',JSON.stringify({provenance:'ISOLATED SOFTWARE FIXTURES; MAP TILES MOCKED',results,errors,navigationMs,physicalAcceptance:'NOT RUN',ISOAcceptability:'REQUIRES IT/TODA EVALUATION'},null,2));console.log(results.join('\n'));
}finally{await browser?.close();child.kill('SIGTERM');child.stdout?.destroy();child.stderr?.destroy();child.unref();}
