// Software fixture only: isolated database and HTTP server, never a physical device.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {Store} from '../server/db';
import {seed} from '../server/seed';
import {createApp} from '../server/app';
import {hash} from '../server/auth';
import {CpeControls} from '../server/cpe-control';
import {PostgresTestStore} from './postgres-store';
test('authenticated LTE commands enforce scope, capability, fresh boot, expiry, idempotency and device acknowledgements',async()=>{
 const db=process.env.SOLAIR_TEST_POSTGRES==='1'?new PostgresTestStore():new Store(':memory:');await db.migrate();await seed(db);
 const token='TEST-FIXTURE-REMOTE-TOKEN-ONLY';await db.run('UPDATE devices SET token_hash=? WHERE id=?',[hash(token),'SOL-ET-01']);
 const server=createServer(createApp(db));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 const cookies:Record<string,string>={};
 const request=async(path:string,role='',method='GET',body?:unknown,headers:Record<string,string>={})=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(role?{Cookie:cookies[role]}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 try{
  for(const role of ['engineer','driver','outsider']){const r=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:role+'@solair.local',password:'SolairDemo!2026'})});cookies[role]=r.headers.get('set-cookie')!.split(';')[0];}
  const action=()=>({command:'arm',request_id:randomUUID()});
  assert.equal((await request('/cpe-control/ET-01','','POST',action())).status,401);
  assert.equal((await request('/cpe-control/ET-01','driver','POST',action())).status,403);
  assert.equal((await request('/cpe-control/OTHER-01','engineer','POST',action())).status,403);
  assert.equal((await request('/cpe-control/ET-01?mode=demo','engineer','POST',action())).status,400);
  assert.equal((await request('/cpe-control/ET-01','engineer','POST',action(),{Origin:'https://foreign.example'})).status,403);
  assert.equal((await request('/cpe-control/ET-01','engineer','POST',{command:'raw_gpio',request_id:randomUUID()})).status,400);
  assert.equal((await request('/cpe-control/ET-01','engineer','POST',action())).status,409);
  const frame:any={schema_version:2,device_id:'SOL-ET-01',firmware_version:'TEST-FIXTURE/remote',boot_id:'fixture-boot',sequence:1,device_uptime_ms:20000,source_type:'hardware',transport:'lte',sensor_health:{},lid_state:'secure',mount_state:null,
   cpe:{historical:false,mpu_raw:null,meter_source:'bench_supply',load_mode:'unknown',queue_dropped:0,remote_control:{enabled:true,last_id:null,last_command:null,last_result:null},pzem:{quality:'ok',voltage_v:53.93,current_a:0,power_w:0,energy_wh:7,alarm_high:false,alarm_low:false},acs:{quality:'unavailable',current_a:null,adc_mv:null,zero_v:null,sensitivity_v_per_a:null},lte:{quality:'ok',at_detected:true,registered:true,attached:true,rssi:20,uplink_commissioned:true},gps:{quality:'unavailable',hdop:null,checksum_failures:0,software_uart_overflows:0},alarm:{commanded:false,output_level:0,feedback:null,reason:null,duration_ms:5000}}};
  const ingest=()=>request('/ingest','','POST',frame,{Authorization:'Bearer '+token});
  assert.equal((await ingest()).status,201);
  const queued=action(),q=await request('/cpe-control/ET-01','engineer','POST',queued);assert.equal(q.status,202);assert.equal(q.body.status,'pending');
  assert.equal((await request('/cpe-control/ET-01','engineer','POST',queued)).body.id,q.body.id);
  assert.equal((await request('/cpe-control/ET-01','engineer','POST',{...queued,command:'disarm'})).status,409);
  frame.sequence++;let r=await ingest();assert.equal(r.body.remote_command.id,q.body.id);assert.equal(r.body.remote_command.boot_id,frame.boot_id);
  frame.cpe.remote_control={enabled:true,last_id:q.body.id,last_command:'arm',last_result:'accepted'};frame.sequence++;r=await ingest();assert.equal(r.body.remote_command,null);
  assert.equal((await request('/cpe-control/ET-01','engineer')).body.command.status,'accepted');
  const first=await request('/cpe-control/ET-01','engineer','POST',action());const second=await request('/cpe-control/ET-01','engineer','POST',{command:'disarm',request_id:randomUUID()});
  assert.equal((await db.query('SELECT status FROM cpe_commands WHERE id=?',[first.body.id]))[0].status,'superseded');
  frame.boot_id='new-fixture-boot';frame.sequence=1;await ingest();
  assert.equal((await db.query('SELECT status FROM cpe_commands WHERE id=?',[second.body.id]))[0].status,'expired');
  const exp=await request('/cpe-control/ET-01','engineer','POST',action());assert.equal(exp.status,202);await db.run('UPDATE cpe_commands SET expires_at=? WHERE id=?',[new Date(Date.now()-1000).toISOString(),exp.body.id]);
  frame.sequence++;assert.equal((await ingest()).body.remote_command,null);assert.equal((await db.query('SELECT status FROM cpe_commands WHERE id=?',[exp.body.id]))[0].status,'expired');
  await db.run("UPDATE telemetry SET received_at=? WHERE device_id=?",[new Date(Date.now()-40000).toISOString(),'SOL-ET-01']);
  assert.equal((await request('/cpe-control/ET-01','engineer','POST',action())).status,409);
  assert.ok((await db.query("SELECT * FROM audit_logs WHERE action='remote_arm'")).length>0);
  assert.equal(JSON.parse((await db.query("SELECT payload FROM telemetry WHERE device_id=? AND mode=? AND boot_id=? ORDER BY sequence DESC LIMIT 1",["SOL-ET-01","hardware","new-fixture-boot"]))[0].payload).battery_voltage_v,null);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await db.close();}
});
