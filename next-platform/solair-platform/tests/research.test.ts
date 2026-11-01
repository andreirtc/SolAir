import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Store} from '../server/db';
import {PostgresTestStore} from './postgres-store';
import {createApp} from '../server/app';
import {seed} from '../server/seed';
import {telemetrySchema} from '../packages/telemetry-contract';
import {estimateBattery,researchMetrics,type BatteryReference,type BatterySample,type StudyRecord} from '../packages/research';

const end=Date.parse('2026-10-28T12:00:00Z');
const reference=(extra:Partial<BatteryReference>={}):BatteryReference=>({profile:'prototype_48v_10ah',capacity_ah:10,capacity_basis:'nameplate',initial_soc_pct:100,reference_basis:'assumed_reference',reference_at:new Date(end-3600000).toISOString(),reserve_pct:10,charge_efficiency:1,evidence:'TEST FIXTURE ONLY',...extra});
const samples=(amps=-2):BatterySample[]=>Array.from({length:361},(_,i)=>({id:String(i),at:new Date(end-3600000+i*10000).toISOString(),received_at:new Date(end-3600000+i*10000).toISOString(),boot_id:'fixture',sequence:i,current_a:amps,voltage_v:48,current_valid:true,voltage_valid:true,historical:false}));
test('SOC/TTE: 2 Ah removed from 10 Ah gives 80%; runtime to 10% reserve is 210 min',()=>{
  const r=estimateBattery(reference(),samples(),end);assert.equal(r.quality,'estimated');assert.ok(Math.abs(r.soc_pct!-80)<1e-9);assert.ok(Math.abs(r.tte_minutes!-210)<1e-8);assert.equal(r.model_validated,false);
});
test('SOC/TTE: charging efficiency is explicit; charging is not a finite TTE',()=>{
  const r=estimateBattery(reference({initial_soc_pct:50,charge_efficiency:.85}),samples(2),end);assert.ok(Math.abs(r.soc_pct!-67)<1e-8);assert.equal(r.tte_minutes,null);assert.match(r.tte_reason,/Charging/);
});
test('SOC/TTE refuse guessed voltage SOC, uncalibrated current, history gaps/restart/staleness',()=>{
  assert.equal(estimateBattery(null,samples(),end).soc_pct,null);
  for(const mutate of [(a:BatterySample[])=>{a[180].current_valid=false;},(a:BatterySample[])=>{a.splice(180,2);},(a:BatterySample[])=>{a[180].boot_id='restart';}]){const a=samples();mutate(a);assert.equal(estimateBattery(reference(),a,end).soc_pct,null);}
  assert.equal(estimateBattery(reference(),samples(),end+31000).soc_pct,null);
  assert.equal(estimateBattery(reference({initial_soc_pct:10}),samples(),end).soc_pct,null,'Out-of-bounds charge cannot be silently clamped');
});
test('SOP metrics preserve empty denominators, classify every outcome and exclude invalid latency claims',()=>{
  const records:StudyRecord[]=[];const add=(kind:string,payload:any)=>records.push({id:String(records.length),kind,payload,created_at:'2026-10-28T10:00:00Z',evidence:'TEST FIXTURE'});
  assert.equal(researchMetrics(records).tamper.accuracy,null);
  for(const [truth,detected] of [['tamper',true],['tamper',false],['normal',true],['normal',false]] as const)add('tamper_trial',{truth,detected});
  for(const ms of [10,20,40,100])add('latency',{boundary:'transmission',clocks_synchronized:true,transport:'lte',sent_at:'2026-10-28T10:00:00Z',received_at:new Date(Date.parse('2026-10-28T10:00:00Z')+ms).toISOString()});
  add('latency',{boundary:'transmission',clocks_synchronized:false,transport:'lte',sent_at:'2026-10-28T10:00:00Z',received_at:'2026-10-28T10:00:20Z'});
  add('energy_trial',{scope:'bench',solar_wh:100,wind_wh:null,auxiliary_wh:10,extra_propulsion_wh:null});
  const r=researchMetrics(records);assert.equal(r.tamper.accuracy,.5);assert.equal(r.tamper.f1,.5);assert.equal(r.resilience.latency.n,4);assert.equal(r.resilience.latency.median_ms,30);assert.equal(r.resilience.latency.p95_ms,100);assert.equal(r.energy.trials[0].solar_only_net_wh,90);assert.equal(r.energy.trials[0].hybrid_net_wh,null);assert.equal(r.weatherproofing.certified,false);
});
test('SOP4 API isolates organizations, vehicle assignments, modes and write roles; persists evidence and SOC reference',async()=>{
 const db=process.env.SOLAIR_TEST_POSTGRES==='1'?new PostgresTestStore():new Store(':memory:');await db.migrate();await seed(db);
 const server=createServer(createApp(db));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`;
 const cookies:Record<string,string>={};
 async function request(path:string,who='engineer',method='GET',body?:unknown){const res=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(cookies[who]?{Cookie:cookies[who]}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,data:await res.json()};}
 try{
  for(const role of ['engineer','driver','operator','outsider']){const res=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:role+'@solair.local',password:'SolairDemo!2026'})});cookies[role]=res.headers.get('set-cookie')!.split(';')[0];}
  assert.equal((await request('/research/ET-01','none')).status,401);
  assert.equal((await request('/research/ET-01','outsider')).status,403);
  assert.equal((await request('/research/ET-02','driver')).status,403);
  assert.equal((await request('/battery/ET-01')).data.soc_pct,null);
  const at=Date.now()-60000,ref=reference({reference_at:new Date(at).toISOString(),initial_soc_pct:80});
  assert.equal((await request('/battery/ET-01/reference','driver','POST',ref)).status,403);
  assert.equal((await request('/battery/ET-01/reference','engineer','POST',ref)).status,201);
  for(let i=0;i<=30;i++){
   const time=new Date(at+i*2000).toISOString(),id='SOC-FIXTURE-'+i;
   const t=telemetrySchema.parse({schema_version:1,device_id:'SOL-ET-01',firmware_version:'TEST FIXTURE ONLY',boot_id:'soc-test',sequence:i,device_uptime_ms:i*2000,source_type:'hardware',transport:'wifi',sensor_health:{acs758:'ok'},calibration_status:'calibrated',battery_voltage_v:48,battery_current_a:-1});
   await db.run('INSERT INTO telemetry VALUES (?,?,?,?,?,?,?,?)',[id,t.device_id,'hardware',t.boot_id,i,time,time,JSON.stringify(t)]);
  }
  // An accepted legacy recovered event is persisted evidence, never a live
  // battery sample, even when it carries a different boot/current value.
  const recovered=telemetrySchema.parse({schema_version:1,device_id:'SOL-ET-01',firmware_version:'TEST FIXTURE ONLY',boot_id:'old-recovered-boot',sequence:1,device_uptime_ms:1000,source_type:'hardware',transport:'wifi',sensor_health:{},calibration_status:'calibrated',battery_voltage_v:48,battery_current_a:50,event_id:'recovered',event_type:'lid'});
  const recoveredAt=new Date(at+11000).toISOString();
  await db.run('INSERT INTO telemetry VALUES (?,?,?,?,?,?,?,?)',['SOC-ARCHIVED',recovered.device_id,'hardware',recovered.boot_id,1,recoveredAt,recoveredAt,JSON.stringify(recovered)]);
  await db.run('INSERT INTO archived_frames VALUES (?,?)',['SOC-ARCHIVED','TEST FIXTURE recovered event']);
  const b=await request('/battery/ET-01','driver');assert.equal(b.status,200);assert.equal(b.data.quality,'estimated');assert.ok(b.data.soc_pct<80);assert.ok(b.data.tte_minutes>0);assert.equal((await request('/battery/ET-01?mode=demo')).data.soc_pct,null);
  const trial={kind:'tamper_trial',scenario:'lid',truth:'tamper',detected:true,trial_at:new Date().toISOString(),evidence:'TEST FIXTURE ONLY'};
  assert.equal((await request('/research/ET-01/records','operator','POST',trial)).status,403);
  assert.equal((await request('/research/ET-01/records','engineer','POST',trial)).status,201);
  const report=(await request('/research/ET-01')).data;assert.equal(report.recorded_energy.sample_count,31,'Archived events are excluded from automatic measurement windows');assert.equal(report.metrics.tamper.n,1);assert.equal(report.metrics.tamper.accuracy,1);assert.equal(report.metrics.forecasting.mae_minutes,null);assert.equal(report.implementation.wireless_remote_security_commands,false);
  assert.equal((await request('/research/ET-01?mode=demo')).data.metrics.tamper.n,0);
  const prediction=await request('/research/ET-01/predictions','engineer','POST',{evidence:'TEST FIXTURE ONLY'});assert.equal(prediction.status,201);
  const outcome={kind:'forecast_outcome',prediction_id:prediction.data.id,endpoint_at:new Date(Date.now()+3600000).toISOString(),endpoint_definition:'Test reserve',evidence:'TEST FIXTURE ONLY'};
  assert.equal((await request('/research/ET-01/records','engineer','POST',outcome)).status,400,'Future outcomes cannot be claimed');
  outcome.endpoint_at=new Date().toISOString();assert.equal((await request('/research/ET-01/records','engineer','POST',outcome)).status,201);
  assert.equal((await request('/research/ET-01/records','engineer','POST',outcome)).status,409);
  assert.equal((await request('/research/ET-01')).data.metrics.forecasting.n,1);
  assert.equal((await request('/research/ET-01')).data.records.filter((r:any)=>r.kind==='forecast_prediction').length,1);
  const second=await request('/research/ET-01/predictions','engineer','POST',{evidence:'TEST FIXTURE concurrent outcome'});
  const concurrent={...outcome,prediction_id:second.data.id,endpoint_at:new Date().toISOString()};
  const results=await Promise.all([request('/research/ET-01/records','engineer','POST',concurrent),request('/research/ET-01/records','engineer','POST',concurrent)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409],'Concurrent submissions cannot duplicate a prediction outcome');
 }finally{await new Promise<void>(r=>server.close(()=>r()));await db.close();}
});
test('SQLite serializes concurrent transactions and releases the queue after rollback',async()=>{
 const db=new Store(':memory:');try{await db.run('CREATE TABLE counter(value INTEGER NOT NULL)');await db.run('INSERT INTO counter VALUES (0)');
 await Promise.all(Array.from({length:20},()=>db.transaction(async tx=>{const [row]=await tx.query('SELECT value FROM counter');await new Promise(r=>setTimeout(r,1));await tx.run('UPDATE counter SET value=?',[row.value+1]);})));
 assert.equal((await db.query('SELECT value FROM counter'))[0].value,20);
 await assert.rejects(db.transaction(async tx=>{await tx.run('UPDATE counter SET value=99');throw new Error('fixture rollback');}));
 await db.transaction(async tx=>{await tx.run('UPDATE counter SET value=value+1');});assert.equal((await db.query('SELECT value FROM counter'))[0].value,21);
 }finally{await db.close();}
});
