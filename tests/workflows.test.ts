// Isolated software fixtures. No device, working database or paid provider is contacted.
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,type Server} from 'node:http';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '../server/db';
import {PostgresTestStore} from './postgres-store';
import {seed} from '../server/seed';
import {createApp} from '../server/app';
import {recordIncident,redactOperationalHistory} from '../server/operations';
import {deviceHealth} from '../packages/device-health';
import {telemetrySchema} from '../packages/telemetry-contract';
let db:Store,server:Server,base:string;
const cookies:Record<string,string>={},original={...process.env};
const at='2026-10-19T01:00:00.000Z';
const fixture=(extra:any={})=>telemetrySchema.parse({schema_version:1,device_id:'SOL-ET-01',boot_id:'TEST-FIXTURE-workflows',sequence:1,device_uptime_ms:1000,firmware_version:'TEST FIXTURE ONLY',device_timestamp:at,source_type:'hardware',transport:'wifi',sensor_health:{},...extra});
async function request(path:string,role='',body?:any,method?:string){const r=await fetch(base+'/api'+path,{method:method||(body===undefined?'GET':'POST'),headers:{Cookie:cookies[role]||'','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:r.headers.get('content-type')?.includes('json')?await r.json():await r.text(),headers:r.headers};}
before(async()=>{
  delete process.env.DATABASE_URL;process.env.SOLAIR_ENVIRONMENT='bench';process.env.SOLAIR_SMS_MODE='disabled';delete process.env.SOLAIR_SMS_ALLOW_PAID;
  db=process.env.SOLAIR_TEST_POSTGRES==='1'?new PostgresTestStore():new Store(':memory:');await db.migrate();await seed(db);
  server=createServer(createApp(db));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${(server.address() as any).port}`;
  for(const role of ['driver','operator','engineer','admin','outsider']){const r=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:role+'@solair.local',password:'SolairDemo!2026'})});cookies[role]=r.headers.get('set-cookie')!.split(';')[0];}
});
after(async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await db.close();for(const key of Object.keys(process.env)){if(!(key in original))delete process.env[key];}Object.assign(process.env,original);});

test('Contact, individual sensor age, GPS age and security age stay independent',()=>{
  const now=Date.parse(at)+5000;
  const t={...fixture({armed:true,sensor_health:{mpu6050:'ok',ads1115:'fault',acs758:'uncalibrated',switches:'ok'},sensor_age_ms:{imu:50000},gps_fix:true,gps_fix_age_ms:29000,latitude:14.66,longitude:120.96}),received_at:new Date(now).toISOString()};
  const h=deviceHealth(t,now);
  assert.equal(h.connection,'Recent contact');assert.equal(h.sensors.find(s=>s.key==='mpu6050')?.state,'stale');assert.equal(h.sensors.find(s=>s.key==='ads1115')?.state,'fault');assert.equal(h.sensors.find(s=>s.key==='switches')?.state,'unknown');assert.equal(h.sensors.find(s=>s.key==='acs758')?.state,'uncalibrated');assert.equal(h.gps,'stale');assert.equal(h.security,'fresh');
  const unknown=deviceHealth({...t,device_timestamp:null},now);assert.equal(unknown.gps,'unknown');assert.equal(unknown.security,'unknown');assert.equal(unknown.sensors[0].state,'unknown');
  assert.equal(deviceHealth({...t,device_timestamp:new Date(now+60000).toISOString()},now).capture_age_ms,null);
  assert.equal(deviceHealth(t,now+100000).connection,'Offline');assert.equal(deviceHealth(t,now+100000).security,'stale');assert.equal(deviceHealth(null,now).battery,'unavailable');
  const legacy:any={...t};delete legacy.sensor_age_ms;delete legacy.armed;delete legacy.battery_voltage_v;
  const old=deviceHealth(legacy,now);assert.equal(old.sensors[0].state,'unknown');assert.equal(old.security,'unknown');assert.equal(old.battery,'unavailable');
});

test('Setup reports saved membership, every assigned vehicle and operator without granting access',async()=>{
  assert.equal((await request('/setup-readiness')).status,401);
  let data=(await request('/setup-readiness','driver')).body;
  assert.equal(data.tasks.find((t:any)=>t.id==='vehicle').complete,true);assert.equal(data.tasks.find((t:any)=>t.id==='operator').complete,false);assert.equal(data.assignment_complete,false);
  assert.equal((await request('/assign','admin',{vehicle_id:'ET-01',driver_id:'driver',operator_id:'operator'})).status,200);
  data=(await request('/setup-readiness','driver')).body;assert.equal(data.assignment_complete,true);assert.equal(data.verification.available,false);
  const body={name:'TEST FIXTURE Setup',email:'setup-fixture@example.com',password:'FixtureOnly!2026',confirmation:'FixtureOnly!2026',phone:'09171234567',sms_consent:true,vehicle_brand:'BEMAC'};
  assert.equal((await request('/signup','',body)).status,201);
  const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:body.email,password:body.password})});cookies.new=login.headers.get('set-cookie')!.split(';')[0];
  data=(await request('/setup-readiness','new')).body;
  assert.equal(data.assignment_complete,false);assert.equal(data.tasks.find((t:any)=>t.id==='toda').complete,false);assert.equal(data.tasks.find((t:any)=>t.id==='vehicle').complete,false);assert.equal(data.tasks.find((t:any)=>t.id==='phone').complete,false);
  assert.equal((await request('/fleet?mode=hardware','new')).body.length,0);assert.equal((await db.query('SELECT id FROM sms_jobs')).length,0);
});

test('People needing assignments are filterable and operator results stay within their TODA',async()=>{
  const missing=(await request('/people?status=needs_assignment','admin')).body;assert.ok(missing.items.some((p:any)=>p.email==='setup-fixture@example.com'));assert.ok(!missing.items.some((p:any)=>p.id==='driver'));
  const scoped=(await request('/people?status=needs_assignment','operator')).body;assert.equal(scoped.total,0);
  const person=(await request('/people?q=Miguel','operator')).body.items[0];assert.equal(person.vehicles[0].operator_name,'Andrea Reyes');assert.equal(person.contact_ready,false);assert.equal('phone_e164' in person,false);
  assert.equal((await request('/people?status=needs_assignment','driver')).status,403);
});

test('SMS readiness is scoped, read-only and never claims delivery from saved configuration',async()=>{
  assert.equal((await request('/notification-readiness/ET-01')).status,401);assert.equal((await request('/notification-readiness/ET-02','driver')).status,403);assert.equal((await request('/notification-readiness/ET-01','outsider')).status,403);
  const data=(await request('/notification-readiness/ET-01','driver')).body;assert.equal(data.configured_for_future_alerts,false);assert.equal(data.mode,'disabled');assert.equal(data.checks[0].complete,false);assert.match(data.message,/not proof/);assert.equal(JSON.stringify(data).includes('phone_e164'),false);
  assert.equal((await request('/contact-preferences','driver')).body.verification.available,false);
  assert.equal((await request('/contact-preferences/verify','driver',{})).status,503);assert.equal((await db.query('SELECT id FROM sms_jobs')).length,0);
});

test('Verification mock keeps provider acceptance separate from approval and rejects stale-number approval',async()=>{
  const keys=['SOLAIR_ENVIRONMENT','SOLAIR_SMS_MODE','SOLAIR_SMS_ALLOW_PAID','SOLAIR_SMS_TEST_RECIPIENTS','TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_VERIFY_SERVICE_SID'];
  const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]])),originalFetch=globalThis.fetch;
  let calls=0,changeNumber=false;
  try{
    process.env.SOLAIR_ENVIRONMENT='operational';process.env.SOLAIR_SMS_MODE='live';process.env.SOLAIR_SMS_ALLOW_PAID='1';process.env.SOLAIR_SMS_TEST_RECIPIENTS='+639171234567';
    for(const key of ['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_VERIFY_SERVICE_SID'])process.env[key]='TEST-FIXTURE-ONLY-NOT-A-CREDENTIAL';
    await request('/contact-preferences','driver',{phone:'09171234567',sms_consent:true},'PATCH');
    globalThis.fetch=async(input,init)=>{
      if(String(input).startsWith(base))return originalFetch(input,init);
      assert.match(String(input),/^https:\/\/verify\.twilio\.com\//);calls++;
      if(changeNumber)await db.run("UPDATE contact_preferences SET phone_e164='+639171234568',phone_verified_at=NULL WHERE user_id='driver'");
      return new Response(JSON.stringify({status:String(input).includes('VerificationCheck')?'approved':'pending'}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    const pending=await request('/contact-preferences/verify','driver',{});assert.equal(pending.body.verified,false);assert.equal((await request('/contact-preferences','driver')).body.phone_verified_at,null);
    const approved=await request('/contact-preferences/verify','driver',{code:'123456'});assert.equal(approved.body.verified,true);assert.ok((await request('/contact-preferences','driver')).body.phone_verified_at);
    await db.run("UPDATE contact_preferences SET phone_verified_at=NULL WHERE user_id='driver'");changeNumber=true;
    assert.equal((await request('/contact-preferences/verify','driver',{code:'123456'})).body.verified,false);assert.equal((await request('/contact-preferences','driver')).body.phone_verified_at,null);assert.equal(calls,3);
    assert.equal((await db.query('SELECT id FROM sms_jobs')).length,0);
  }finally{
    globalThis.fetch=originalFetch;for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
  }
});

test('Incident transitions are scoped, ordered, durable and cannot overwrite the first acknowledgment',async()=>{
  await recordIncident(db,fixture({event_id:'TEST-FIXTURE-lid',event_type:'lid',alarm_id:'TEST-FIXTURE-incident',alarm_active:true,alarm_causes:['lid','mount']}),{org_id:'manila',vehicle_id:'ET-01'},at,true);
  const [incident]=await db.query("SELECT * FROM alarm_incidents WHERE alarm_id='TEST-FIXTURE-incident'");const path='/incidents/'+encodeURIComponent(incident.id);
  assert.equal((await request(path+'/ack','',{})).status,401);assert.equal((await request(path+'/ack','driver',{})).status,403);assert.equal((await request(path+'/ack','outsider',{})).status,403);
  assert.equal((await request(path+'/resolve','operator',{note:'TEST FIXTURE checked contacts.'})).status,409);
  assert.equal((await request(path+'/ack','operator',{})).status,200);
  const [first]=await db.query('SELECT ack_by,ack_at FROM alarm_incidents WHERE id=?',[incident.id]);
  assert.equal((await request(path+'/ack','admin',{})).status,409);
  const [again]=await db.query('SELECT ack_by,ack_at FROM alarm_incidents WHERE id=?',[incident.id]);assert.deepEqual(again,first);
  assert.equal((await request(path+'/notes','operator',{note:'short'})).status,400);
  assert.equal((await request(path+'/notes','operator',{note:'TEST FIXTURE inspected the enclosure.'})).status,200);
  assert.equal((await request(path+'/resolve','operator',{note:'TEST FIXTURE secured contacts; operator reviewed.'})).status,200);
  assert.equal((await request(path+'/notes','operator',{note:'TEST FIXTURE must not change closure.'})).status,409);
  assert.equal((await request(path+'/resolve','operator',{note:'TEST FIXTURE repeated resolution.'})).status,409);
  await db.migrate();const record=(await request('/incidents/ET-01','driver')).body.find((r:any)=>r.id===incident.id);
  assert.equal(record.status,'resolved');assert.equal(record.updates.length,3);assert.equal(record.updates[1].note,'TEST FIXTURE inspected the enclosure.');assert.equal(record.siren_confirmed,0);assert.ok(record.resolved_at);assert.ok(record.acknowledgment_delay_ms>=0);
  assert.equal((await request('/incidents/ET-02','driver')).status,403);assert.deepEqual((await request('/incidents/ET-01?mode=demo','driver')).body,[]);
  const csv=await request('/incidents/ET-01?format=csv','driver');assert.match(csv.body,/handling_history/);assert.match(csv.body,/secured contacts/);assert.match(csv.body,/reporting_delay_ms/);assert.equal(csv.headers.get('X-SOLAIR-Export-Limit'),'200');
  assert.ok((await request('/admin/activity?category=security','admin')).body.items.some((r:any)=>r.action==='incident_resolved'));
});

test('Research CSV binds source, event identity, uncertain times and historical flags to the selected vehicle',async()=>{
  const t=fixture({event_id:'TEST-FIXTURE-delayed',event_type:'lid',event_timestamp:null,alarm_active:true,alarm_id:'TEST-FIXTURE-delay'});
  await db.run('INSERT INTO telemetry VALUES (?,?,?,?,?,?,?,?)',['TEST-FIXTURE-CSV','SOL-ET-01','hardware',t.boot_id,1,at,at,JSON.stringify(t)]);
  await db.run('INSERT INTO archived_frames VALUES (?,?)',['TEST-FIXTURE-CSV','Delayed TEST FIXTURE']);
  const real=await request('/research-export/ET-01?mode=hardware','driver');assert.equal(real.status,200);assert.match(real.body,/event_to_receipt_ms/);assert.match(real.body,/TEST-FIXTURE-delayed/);assert.match(real.body,/TEST-FIXTURE-CSV/);assert.match(real.body,/historical/);
  const demo=await request('/research-export/ET-01?mode=demo','driver');assert.equal(demo.body.includes('TEST-FIXTURE-CSV'),false);
  assert.equal((await request('/research-export/ET-02?mode=hardware','driver')).status,403);assert.equal((await request('/research-export/ET-01','outsider')).status,403);
});

test('Competing incident acknowledgments save only one first handler',async()=>{
  await recordIncident(db,fixture({sequence:2,event_id:'TEST-FIXTURE-race',event_type:'lid',alarm_id:'TEST-FIXTURE-race',alarm_active:true}),{org_id:'manila',vehicle_id:'ET-01'},at,true);
  const [incident]=await db.query("SELECT id FROM alarm_incidents WHERE alarm_id='TEST-FIXTURE-race'");
  const path='/incidents/'+encodeURIComponent(incident.id)+'/ack';
  const results=await Promise.all([request(path,'operator',{}),request(path,'admin',{})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal((await db.query('SELECT id FROM incident_updates WHERE incident_id=?',[incident.id])).length,1);
});

test('Incident handling survives closing and reopening an isolated SQLite database',async()=>{
  const file=join(mkdtempSync(join(tmpdir(),'solair-workflow-persistence-')),'fixture.sqlite');
  let disk=new Store(file);
  try{
    await disk.migrate();await seed(disk);
    await recordIncident(disk,fixture({event_id:'TEST-FIXTURE-restart',event_type:'lid',alarm_id:'TEST-FIXTURE-restart',alarm_active:true}),{org_id:'manila',vehicle_id:'ET-01'},at,true);
    const [incident]=await disk.query("SELECT id FROM alarm_incidents WHERE alarm_id='TEST-FIXTURE-restart'");
    await disk.transaction(async tx=>{await tx.run("UPDATE alarm_incidents SET status='resolved',ack_by='operator',ack_at=? WHERE id=?",[at,incident.id]);await tx.run('INSERT INTO incident_updates VALUES (?,?,?,?,?,?)',['TEST-FIXTURE-durable',incident.id,'operator','resolved','TEST FIXTURE durable closure',at]);});
    await disk.close();disk=new Store(file);await disk.migrate();
    assert.equal((await disk.query('SELECT status FROM alarm_incidents WHERE id=?',[incident.id]))[0].status,'resolved');
    assert.equal((await disk.query('SELECT note FROM incident_updates WHERE incident_id=?',[incident.id]))[0].note,'TEST FIXTURE durable closure');
  }finally{await disk.close();}
});

test('Retention redacts shared incident notes without removing event or handling identity',async()=>{
  const [before]=await db.query('SELECT COUNT(*) AS total FROM incident_updates');
  await redactOperationalHistory(db,'2100-01-01T00:00:00.000Z');
  const notes=await db.query('SELECT * FROM incident_updates');assert.equal(notes.length,Number(before.total));assert.ok(notes.every(n=>n.note==='Redacted under retention policy'));
});
