import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Store} from '../server/db';
import {PostgresTestStore} from './postgres-store';
import {seed} from '../server/seed';
import {createApp} from '../server/app';

// Disposable software fixture only. No device or physical energy evidence is created.
test('TEST FIXTURE: accepted energy intervals stop at reboot and resume within the new boot without duplicate increments',async()=>{
 const db=process.env.SOLAIR_TEST_POSTGRES==='1'?new PostgresTestStore():new Store(':memory:');
 await db.migrate();await seed(db);
 const server=createServer(createApp(db));
 try{
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert(address&&typeof address!=='string');
  const base=`http://127.0.0.1:${address.port}/api`;
  const login=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'engineer@solair.local',password:'SolairDemo!2026'})});
  assert.equal(login.status,200);const cookie=login.headers.get('set-cookie')!.split(';')[0];await login.text();
  const started=Date.now()-6000;
  const frame=(boot:string,sequence:number,elapsed:number)=>({
   schema_version:1,device_id:'SOL-ET-01',firmware_version:'TEST FIXTURE energy reboot',
   boot_id:boot,sequence,device_uptime_ms:sequence*2000,
   device_timestamp:new Date(started+elapsed).toISOString(),source_type:'hardware',transport:'usb',
   sensor_health:{},calibration_status:'calibrated',solar_voltage_v:10,solar_current_a:2,
  });
  const frames=[frame('TEST-FIXTURE-BOOT-A',1,0),frame('TEST-FIXTURE-BOOT-A',2,2000),frame('TEST-FIXTURE-BOOT-B',1,4000),frame('TEST-FIXTURE-BOOT-B',2,6000)];
  const send=(body:unknown)=>fetch(base+'/ingest',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,'X-Bench-Transport':'usb'},body:JSON.stringify(body)});
  const ids:string[]=[];
  for(const f of frames){
   const response=await send(f);assert.equal(response.status,201);const body=await response.json();
   assert.deepEqual(body.ack,{persisted:true,device_id:f.device_id,boot_id:f.boot_id,sequence:f.sequence});ids.push(body.id);
  }
  const interval=20*2/3600,tolerance=1e-7; // PostgreSQL REAL stores single-precision values.
  for(const [i,id] of ids.entries()){
   const [saved]=await db.query("SELECT power_w,increment_wh FROM energy_measurements WHERE telemetry_id=? AND source='solar'",[id]);
   assert.equal(saved.power_w,20);
   assert.ok(Math.abs(saved.increment_wh-(i%2===0?0:interval))<tolerance,`Unexpected integration for acquisition ${i}`);
  }
  const repeated=await send(frames[3]);assert.equal(repeated.status,200);assert.equal((await repeated.json()).duplicate,true);
  const rows=await db.query("SELECT increment_wh FROM energy_measurements WHERE device_id='SOL-ET-01' AND mode='hardware' AND source='solar'");
  assert.equal(rows.length,4);assert.ok(Math.abs(rows.reduce((total,row)=>total+Number(row.increment_wh),0)-2*interval)<tolerance);
  const fleetResponse=await fetch(base+'/fleet?mode=hardware',{headers:{Cookie:cookie}});assert.equal(fleetResponse.status,200);
  const vehicle=(await fleetResponse.json()).find((v:any)=>v.id==='ET-01');
  assert.ok(Math.abs(vehicle.solar_wh-2*interval)<tolerance);
  assert.equal(vehicle.telemetry.boot_id,'TEST-FIXTURE-BOOT-B');assert.equal(vehicle.telemetry.sequence,2);
 }finally{
  server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await db.close();
 }
});
