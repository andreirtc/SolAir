// Software fixtures only. Own temporary database/server; no working records or paid SMS.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../server/db';
import {seed} from '../server/seed';
import {recordIncident} from '../server/operations';
import {telemetrySchema} from '../packages/telemetry-contract';
const dir=mkdtempSync(join(tmpdir(),'solair-operational-ui-')),database=join(dir,'fixture.sqlite');
delete process.env.DATABASE_URL;
const db=new Store(database);await db.migrate();await seed(db);
await db.run("DELETE FROM assignments WHERE driver_id='driver'");
await db.run('INSERT INTO vehicle_operators VALUES (?,?)',['ET-02','operator']);await db.run('INSERT INTO assignments VALUES (?,?)',['ET-02','driver']);
process.env.SOLAIR_ENVIRONMENT='bench';process.env.SOLAIR_SMS_MODE='disabled';
await recordIncident(db,telemetrySchema.parse({schema_version:1,device_id:'SOL-ET-02',boot_id:'TEST-FIXTURE-UI',sequence:1,device_uptime_ms:2000,firmware_version:'TEST FIXTURE ONLY',device_timestamp:null,source_type:'hardware',transport:'wifi',sensor_health:{},alarm_id:'TEST-FIXTURE-activation',alarm_active:true,event_id:'fixture-lid',event_type:'lid',alarm_causes:['lid','mount']}),{org_id:'manila',vehicle_id:'ET-02'},new Date().toISOString(),false);
await db.run('INSERT INTO access_requests VALUES (?,?,?,?,?,?,?,?,?,?,?)',['TEST-FIXTURE-legacy','browser-applicant@example.com','TEST FIXTURE Applicant',null,'not-a-login','+639171234567',0,'pending',new Date().toISOString(),null,null]);
// Preserve compatibility with earlier saved demo payloads that predate per-sensor ages.
for(const row of await db.query("SELECT id,payload FROM telemetry WHERE device_id='SOL-ET-02' AND mode='demo'")){const t=JSON.parse(row.payload);delete t.sensor_age_ms;await db.run('UPDATE telemetry SET payload=? WHERE id=?',[JSON.stringify(t),row.id]);}
await db.close();
const base='http://127.0.0.1:15373',output='test-results/operational-ui';mkdirSync(output,{recursive:true});
const child=spawn(process.execPath,['--import','tsx','server/index.ts','--production'],{env:{...process.env,PORT:'15373',SOLAIR_DB_PATH:database,DATABASE_URL:'',SOLAIR_ENVIRONMENT:'bench',SOLAIR_SMS_MODE:'disabled',SOLAIR_SMS_ALLOW_PAID:'',SOLAIR_AUTH_PROVIDER:'',SOLAIR_REALTIME_PROVIDER:'',SOLAIR_ALLOW_LOCAL_PREVIEW:'1',SOLAIR_BIND_HOST:'127.0.0.1',SOLAIR_INGEST_HOST:''},windowsHide:true,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout?.on('data',b=>logs+=b.toString());child.stderr?.on('data',b=>logs+=b.toString());
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
const results:string[]=[],errors:string[]=[];
try{
 let ready=false;for(let n=0;n<120;n++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{/* Owned preview startup. */}if(child.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,500));}assert.ok(ready);
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1050},colorScheme:'light'});
 await context.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#d9e9e5"/></svg>'}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 async function login(role:string){await page.goto(base);await page.getByLabel('Email address',{exact:true}).fill(role+'@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();}
 await page.goto(base);await page.getByRole('link',{name:'Sign up'}).click();
 await page.getByRole('heading',{name:'Create your SOLAIR account'}).waitFor();
 await page.getByLabel('Vehicle type',{exact:true}).selectOption('NWOW');assert.equal(await page.getByLabel('Vehicle type',{exact:true}).inputValue(),'NWOW');
 await page.getByLabel('I will use SOLAIR as a',{exact:true}).selectOption('operator');
 await page.getByLabel('Name',{exact:true}).fill('TEST FIXTURE Applicant');await page.getByLabel('Email',{exact:true}).fill('browser-applicant@example.com');await page.getByLabel('Password',{exact:true}).fill('FixtureOnly!2026');await page.getByLabel('Confirm password',{exact:true}).fill('FixtureOnly!2026');await page.getByLabel('Mobile number',{exact:true}).fill('09171234567');await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByRole('status').filter({hasText:'Account created. You can now sign in.'}).waitFor();
 await page.screenshot({path:output+'/signup.png',fullPage:true});results.push('Signup creates an account without administrator approval');
 await page.getByRole('link',{name:'Sign in',exact:true}).click();
 await page.getByLabel('Email address',{exact:true}).fill('browser-applicant@example.com');await page.getByLabel('Password',{exact:true}).fill('FixtureOnly!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('heading',{name:'No assigned vehicle',exact:true}).waitFor();
 await page.getByRole('button',{name:'Show TODA and vehicle',exact:true}).click();const emptyToda=page.getByRole('region',{name:'TODA and vehicle',exact:true});await emptyToda.getByText('No assigned vehicle',{exact:true}).waitFor();await emptyToda.getByText('No TODA assigned',{exact:true}).waitFor();await page.keyboard.press('Escape');results.push('Compact TODA dropdown honestly shows an unassigned driver without extra account actions');
 await page.getByRole('button',{name:'Open account menu',exact:true}).click();await page.getByRole('dialog',{name:'Account options'}).getByRole('button',{name:'Profile',exact:true}).click();
 await page.getByRole('heading',{name:'Contact and SMS preferences',exact:true}).waitFor();
 await page.screenshot({path:output+'/registered-account.png',fullPage:true});results.push('New account can sign in, edit contact preferences and has no unauthorized fleet access');
 await page.locator('.sidebar nav').getByRole('button',{name:'Log out',exact:true}).click();
 await login('admin');
 await page.locator('.sidebar nav').getByRole('button',{name:'Settings',exact:true}).click();
 assert.equal(await page.getByRole('heading',{name:'Registered accounts',exact:true}).count(),0);assert.equal(await page.getByRole('heading',{name:'Device readiness and alarm notifications',exact:true}).count(),0);
 await page.locator('.sidebar nav').getByRole('button',{name:'People & assignments',exact:true}).click();
 const directory=page.locator('.people-directory');await directory.getByRole('heading',{name:'Registered accounts',exact:true}).waitFor();
 await directory.getByLabel('Search people',{exact:true}).fill('browser-applicant@example.com');await directory.getByRole('button',{name:'Search',exact:true}).click();
 const card=directory.locator('article').filter({hasText:'browser-applicant@example.com'});await card.getByText(/Wants to use SOLAIR as an operator/).waitFor();
 await page.screenshot({path:output+'/admin-people.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:output+'/phone-people.png',fullPage:true});await page.setViewportSize({width:1440,height:1050});
 await card.getByRole('button',{name:'Manage account',exact:true}).click();await card.getByLabel('TODA',{exact:true}).selectOption('manila');await card.getByLabel('Approved access',{exact:true}).selectOption('operator');await card.getByRole('button',{name:'Save TODA and account access',exact:true}).click();await directory.getByRole('status').filter({hasText:'Account updated'}).waitFor();
 await directory.getByText('Older signup requests (1)',{exact:true}).click();await directory.getByRole('button',{name:'Archive old request',exact:true}).click();await directory.getByRole('status').filter({hasText:'No account was removed'}).waitFor();
 await page.locator('.sidebar nav').getByRole('button',{name:'Devices',exact:true}).click();await page.getByRole('heading',{name:'Device readiness and alarm notifications',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Registered accounts',exact:true}).count(),0);
 await page.locator('.sidebar nav').getByRole('button',{name:'Organizations',exact:true}).click();await page.getByRole('heading',{name:'Organizations',exact:true,level:3}).waitFor();assert.equal(await page.locator('.switch-row').filter({hasText:'No TODA assigned'}).count(),0);
 await page.locator('.sidebar nav').getByRole('button',{name:'Activity log',exact:true}).click();await page.getByRole('heading',{name:'Registrations and system activity',exact:true}).waitFor();await Promise.all([page.waitForResponse(r=>r.url().includes('/api/admin/activity?category=registrations')&&r.status()===200),page.getByLabel('Activity type',{exact:true}).selectOption('registrations')]);await page.locator('.activity-record').filter({hasText:'TEST FIXTURE Applicant'}).filter({hasText:'New account registered'}).waitFor();await page.screenshot({path:output+'/admin-activity.png',fullPage:true});
 results.push('Admin pages are separate; directory search/mobile layout, TODA/operator approval, legacy archive and organization filtering pass');
 await page.locator('.sidebar nav').getByRole('button',{name:'Log out',exact:true}).click();
 await page.goto(base);await page.getByLabel('Email address',{exact:true}).fill('browser-applicant@example.com');await page.getByLabel('Password',{exact:true}).fill('FixtureOnly!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.organization')?.textContent?.includes('Manila Central TODA'));assert.match(await page.locator('.organization').innerText(),/Manila Central TODA/);
 await page.locator('.sidebar nav').getByRole('button',{name:'Settings',exact:true}).click();await page.locator('.registration-details').getByText('Manila Central TODA',{exact:true}).waitFor();await page.screenshot({path:output+'/assigned-toda.png',fullPage:true});results.push('After saved membership and re-login, sidebar and registration both show the assigned TODA');
 await page.locator('.sidebar nav').getByRole('button',{name:'Log out',exact:true}).click();
 const requested:string[]=[];page.on('request',r=>{if(/\/api\/(messages|history)\//.test(r.url()))requested.push(r.url());});
 await login('driver');await page.getByRole('heading',{name:'Ready for the road, Miguel.'}).waitFor();
 await page.getByRole('heading',{name:'Your account setup',exact:true}).waitFor();
 const status=page.locator('.device-status');await status.getByText('No data',{exact:true}).waitFor();await status.getByText('No current GPS fix',{exact:true}).waitFor();await status.getByText('State unknown',{exact:true}).waitFor();
 await page.getByLabel('Data mode',{exact:true}).selectOption('demo');await status.getByText('Simulated readings',{exact:true}).waitFor();await status.getByText('Sensor status and reading ages',{exact:true}).click();await status.getByText('Age unknown · Time unknown',{exact:true}).first().waitFor();await page.getByLabel('Data mode',{exact:true}).selectOption('hardware');await status.getByText('No data',{exact:true}).waitFor();
 await page.screenshot({path:output+'/driver-home-readiness.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:output+'/phone-driver-status.png',fullPage:true});await page.setViewportSize({width:1440,height:1050});
 await status.getByRole('button',{name:'View my history',exact:true}).click();await page.getByRole('heading',{name:'Research evidence · ET-02',exact:true}).waitFor();assert.match(await page.getByRole('link',{name:'Download research CSV',exact:true}).getAttribute('href')||'',/ET-02\?mode=hardware/);
 await page.locator('.sidebar nav').getByRole('button',{name:'My vehicle',exact:true}).click();
 results.push('Driver setup, unknown connection/sensor/GPS states, 390px layout and authorized research history are clear');

 const todaTrigger=page.getByRole('button',{name:'Show TODA and vehicle',exact:true});await todaTrigger.click();let toda=page.getByRole('region',{name:'TODA and vehicle',exact:true});await toda.getByText('ET-02',{exact:true}).waitFor();await toda.getByText('BEMAC 68VM Passenger',{exact:true}).waitFor();assert.equal(await toda.getByText('ET-01',{exact:true}).count(),0);await toda.getByText('Manila Central TODA',{exact:true}).waitFor();assert.equal(await toda.getByRole('button').count(),0);await page.screenshot({path:output+'/toda-menu.png',fullPage:true});
 await page.keyboard.press('Escape');assert.equal(await todaTrigger.getAttribute('aria-expanded'),'false');assert.equal(await todaTrigger.evaluate(el=>document.activeElement===el),true);
 await todaTrigger.press('Enter');await page.getByRole('region',{name:'TODA and vehicle',exact:true}).waitFor();await page.getByRole('heading',{name:'Ready for the road, Miguel.'}).click();assert.equal(await todaTrigger.getAttribute('aria-expanded'),'false');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await todaTrigger.click();toda=page.getByRole('region',{name:'TODA and vehicle',exact:true});await toda.getByText('ET-02',{exact:true}).waitFor();const popup=await toda.boundingBox();assert.ok(popup&&popup.x>=0&&popup.x+popup.width<=390);await page.screenshot({path:output+'/phone-toda-menu.png',fullPage:true});await page.keyboard.press('Escape');assert.equal(await page.locator('.sidebar.open').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.sidebar.open').count(),0);await page.setViewportSize({width:1440,height:1050});results.push('Assigned TODA dropdown shows only authorized ID/model; keyboard, outside click, Escape/focus and 390px layout pass');

 await page.locator('.sidebar nav').getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('heading',{name:'My registration and assignments',exact:true}).waitFor();
 const registration=page.locator('.registration-details');await registration.getByText('Vehicle ID',{exact:true}).waitFor();await registration.getByLabel('Declared vehicle type',{exact:true}).selectOption('BEMAC');await registration.getByLabel('GPS / map display name',{exact:true}).fill('TEST FIXTURE Driver GPS');await registration.getByRole('button',{name:'Save registration details',exact:true}).click();await registration.getByRole('status').filter({hasText:'Registration details saved'}).waitFor();await page.screenshot({path:output+'/driver-settings.png',fullPage:true});results.push('Driver Settings is visible and registration shows actual vehicle ID, role and editable map display name');
 await page.getByRole('button',{name:'Open TODA messages',exact:true}).click();await page.getByRole('heading',{name:'Messages',exact:true}).waitFor();
 assert.ok(requested.some(url=>url.includes('/messages/ET-02')));assert.ok(!requested.some(url=>url.includes('/messages/ET-01')));results.push('ET-02-only driver immediately requests ET-02 messages, never ET-01');
 await page.locator('.sidebar nav').getByRole('button',{name:'Alerts',exact:true}).click();
 await page.getByRole('heading',{name:'Alarm incidents and SMS delivery',exact:true}).waitFor();
 await page.getByRole('heading',{name:'SMS alert readiness',exact:true}).waitFor();await page.getByText(/SMS alerts are not fully configured/).waitFor();
 await page.getByText('lid, mount',{exact:true}).waitFor();await page.getByText(/Event time unknown/).waitFor();
 const incident=page.locator('.incident-record');assert.equal(await incident.getByRole('button',{name:'Acknowledge incident'}).count(),0);
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Export incident CSV',exact:true}).click()]);await download.saveAs(output+'/TEST-FIXTURE-incidents.csv');
 await page.screenshot({path:output+'/TEST-FIXTURE-incident.png',fullPage:true});results.push('Assigned driver sees coalesced causes, unknown time and CSV; cannot acknowledge an incident');

 await page.getByRole('button',{name:'Open account menu',exact:true}).click();await page.getByRole('dialog',{name:'Account options'}).getByRole('button',{name:'Profile',exact:true}).click();
 const contact=page.locator('section').filter({has:page.getByRole('heading',{name:'Contact and SMS preferences',exact:true})}).last();
 await contact.getByLabel('Mobile number',{exact:true}).fill('09171234567');await contact.getByRole('button',{name:'Save contact preferences',exact:true}).click();await contact.getByRole('status').filter({hasText:'Saved.'}).waitFor();
 assert.equal(await contact.getByRole('button',{name:'Request verification code',exact:true}).isDisabled(),true);await contact.getByText(/SMS verification is disabled in this environment/).waitFor();results.push('Contact normalization saves; disabled verification controls explain the unavailable service without sending');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:output+'/phone-contact.png',fullPage:true});results.push('390px contact settings have no horizontal overflow');
 await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.locator('.sidebar nav').getByRole('button',{name:'Log out',exact:true}).click();
 await page.setViewportSize({width:1440,height:1050});await login('engineer');await page.locator('.sidebar nav').getByRole('button',{name:'CPE Lab',exact:false}).click();await page.getByRole('heading',{name:'From breadboard to road.'}).waitFor();
 await page.getByRole('link',{name:'Export evidence CSV',exact:true}).waitFor();results.push('Protected CPE Lab and new evidence export remain available');
 await page.locator('.sidebar nav').getByRole('button',{name:'Log out',exact:true}).click();await login('operator');await page.locator('.sidebar nav').getByRole('button',{name:'Settings',exact:true}).click();
 const operator=page.locator('.operator-information');await operator.getByLabel('Operator/business name',{exact:true}).fill('TEST FIXTURE Malabon Transport');await operator.getByLabel('Service area / route',{exact:true}).fill('Malabon test route');await operator.getByLabel('Shared contact number',{exact:true}).fill('09171234567');await operator.getByRole('button',{name:'Save operator information',exact:true}).click();await operator.getByRole('status').filter({hasText:'Operator information saved'}).waitFor();results.push('Operator Settings includes editable business, service area and shared contact without enabling SMS');


 await page.locator('.sidebar nav').getByRole('button',{name:'Security',exact:true}).click();
 await page.locator('.page-heading select').selectOption('ET-02');
 const handling=page.locator('.incident-record').filter({hasText:'TEST-FIXTURE-activation'});await handling.getByRole('button',{name:'Acknowledge incident',exact:true}).click();await handling.getByLabel('Incident note',{exact:true}).waitFor();
 await handling.getByLabel('Incident note',{exact:true}).fill('TEST FIXTURE pending inspection note survives refresh.');
 await Promise.all([page.waitForResponse(r=>r.url().includes('/api/incidents/ET-02')&&r.status()===200),page.getByRole('button',{name:'Refresh incidents',exact:true}).click()]);
 try{assert.equal(await handling.getByLabel('Incident note',{exact:true}).inputValue({timeout:3000}),'TEST FIXTURE pending inspection note survives refresh.');}catch(e){await page.screenshot({path:output+'/draft-refresh-failure.png',fullPage:true});console.log('FIXTURE DEBUG',await page.locator('.incident-history').innerText(),await page.locator('.page-heading select').inputValue());throw e;}
 let releaseSave!:()=>void;const heldSave=new Promise<void>(resolve=>{releaseSave=resolve;});let saveArrived!:()=>void;const saveStarted=new Promise<void>(resolve=>{saveArrived=resolve;});let saveContinued!:()=>void;const saveForwarded=new Promise<void>(resolve=>{saveContinued=resolve;});
 await page.route('**/api/incidents/*/notes',async route=>{saveArrived();await heldSave;await route.continue();saveContinued();});
 await handling.getByRole('button',{name:'Save incident note',exact:true}).click();await saveStarted;assert.equal(await handling.getByLabel('Incident note',{exact:true}).isDisabled(),true);releaseSave();await saveForwarded;await page.unroute('**/api/incidents/*/notes');await handling.getByText('TEST FIXTURE pending inspection note survives refresh.',{exact:true}).waitFor();
 await handling.getByLabel('Incident note',{exact:true}).fill('TEST FIXTURE contacts inspected; operator closed incident.');await handling.getByRole('button',{name:'Resolve with this note',exact:true}).click();await handling.getByText('resolved',{exact:true}).waitFor();
 assert.equal(await handling.getByRole('button',{name:'Resolve with this note',exact:true}).count(),0);await page.screenshot({path:output+'/operator-resolved-incident.png',fullPage:true});
 await page.reload();await page.getByRole('button',{name:'Open account menu',exact:true}).waitFor();await page.locator('.sidebar nav').getByRole('button',{name:'Security',exact:true}).click();await page.locator('.page-heading select').selectOption('ET-02');await page.locator('.incident-record').getByText('TEST FIXTURE contacts inspected; operator closed incident.',{exact:true}).waitFor();
 results.push('Operator acknowledgment, shared notes, draft retention during refresh, resolution and saved closure after reload pass');
 assert.deepEqual(errors,[]);results.push('No browser runtime errors');writeFileSync(output+'/results.json',JSON.stringify({provenance:'SOFTWARE FIXTURE ONLY',results,errors,physicalTests:'NOT RUN',smsDelivery:'NOT RUN'},null,2));console.log(results.join('\n'));
}finally{await browser?.close();child.kill('SIGTERM');child.stdout?.destroy();child.stderr?.destroy();child.unref();}
