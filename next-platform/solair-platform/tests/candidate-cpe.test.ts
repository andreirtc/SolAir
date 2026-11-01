import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,type Server} from 'node:http';
import {Store} from '../server/db';
import {PostgresTestStore} from './postgres-store';
import {seed} from '../server/seed';
import {createApp} from '../server/app';
import {telemetrySchema} from '../packages/telemetry-contract';
let db:Store,server:Server,base:string,cookie:string;
const cpe=()=>({historical:false,mpu_raw:null,meter_source:'bench_supply',load_mode:'bench_resistor',pzem:{quality:'ok',voltage_v:12.1,current_a:0.2,power_w:2.4,energy_wh:7,alarm_high:false,alarm_low:false},acs:{quality:'uncalibrated',current_a:null,adc_mv:1250,zero_v:2.5,sensitivity_v_per_a:0.04},lte:{quality:'unavailable',at_detected:false,registered:false,attached:false,rssi:null,uplink_commissioned:false},gps:{quality:'unavailable',hdop:null,checksum_failures:0,software_uart_overflows:0},alarm:{commanded:false,output_level:null,feedback:null,reason:null,duration_ms:5000},queue_dropped:0});
const frame=(sequence=1)=>({schema_version:2,device_id:'SOL-ET-01',firmware_version:'TEST FIXTURE cpe',boot_id:'cpe-fixture',sequence,device_uptime_ms:sequence*2000,device_timestamp:null,source_type:'hardware',transport:'usb',sensor_health:{pzem017:'ok'},cpe:cpe()});
before(async()=>{db=process.env.SOLAIR_TEST_POSTGRES==='1'?new PostgresTestStore():new Store(':memory:');await db.migrate();await seed(db);server=createServer(createApp(db));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${(server.address() as any).port}/api`;const login=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'engineer@solair.local',password:'SolairDemo!2026'})});cookie=login.headers.get('set-cookie')!.split(';')[0];});
after(async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await db.close();});
const send=(data:unknown)=>fetch(base+'/ingest',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,'X-Bench-Transport':'usb'},body:JSON.stringify(data)});
test('v2 enforces measurements, quality and calibrated current; v1 remains compatible',()=>{
 assert.equal(telemetrySchema.safeParse(frame()).success,true);
 const f=frame();f.cpe.pzem.quality='fault';assert.equal(telemetrySchema.safeParse(f).success,false);
 const a=frame();a.cpe.acs.current_a=1 as any;assert.equal(telemetrySchema.safeParse(a).success,false);
 const v=frame();v.schema_version=1;assert.equal(telemetrySchema.safeParse(v).success,false);
 const l=frame();l.transport='lte';assert.equal(telemetrySchema.safeParse(l).success,false);
});
test('authenticated CPE measurements persist atomically with load and source; duplicate conflict cannot mutate',async()=>{
 assert.equal((await send(frame())).status,201);
 const [row]=await db.query('SELECT * FROM cpe_samples');assert.equal(row.load_mode,'bench_resistor');assert.equal(row.pzem_energy_wh,7);assert.equal(row.acs_current_a,null);
 const dup=await send(frame());assert.equal((await dup.json()).duplicate,true);
 const conflict=frame();conflict.cpe.pzem.energy_wh=99;assert.equal((await send(conflict)).status,409);
 assert.equal((await db.query('SELECT * FROM cpe_samples')).length,1);
 const csv=await fetch(base+'/cpe-export/ET-01',{headers:{Cookie:cookie}});assert.equal(csv.status,200);assert.match(await csv.text(),/bench_resistor/);
 assert.equal((await fetch(base+'/cpe-export/OTHER-01',{headers:{Cookie:cookie}})).status,403);
 assert.equal((await fetch(base+'/cpe-export/ET-01')).status,401);
});
test('recovered security events persist without refreshing live readings or GPS',async()=>{
 assert.equal((await send(frame(4))).status,201);
 const f={...frame(2),event_id:'offline-event',event_type:'lid'};f.cpe.historical=true;
 assert.equal((await send(f)).status,201);
 const fleet=await fetch(base+'/fleet',{headers:{Cookie:cookie}});const vehicles=await fleet.json();assert.equal(vehicles.find((v:any)=>v.id==='ET-01').telemetry.sequence,4);
 const events=await db.query("SELECT * FROM security_events WHERE type='lid'");assert.equal(events.length,1);
 assert.equal((await send(f)).status,200);assert.equal((await db.query("SELECT * FROM security_events WHERE type='lid'")).length,1);
});
test('authenticated schema errors are traceable to the device without accepting data or spoofed errors',async()=>{
 const p=await fetch(base+'/devices/provision',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({vehicle_id:'ET-01'})});const credential=await p.json();
 const bad={...frame(10),transport:'wifi',cpe:null};
 const reject=await fetch(base+'/ingest',{method:'POST',headers:{Authorization:'Bearer '+credential.device_token,'Content-Type':'application/json'},body:JSON.stringify(bad)});assert.equal(reject.status,400);
 const errors=await fetch(base+'/cpe-diagnostics/ET-01',{headers:{Cookie:cookie}});assert.equal((await errors.json()).filter((r:any)=>r.action==='device_ingest_rejected: invalid telemetry schema').length,1);
 await fetch(base+'/ingest',{method:'POST',headers:{Authorization:'Bearer invalid-fixture','Content-Type':'application/json'},body:JSON.stringify(bad)});
 assert.equal((await db.query("SELECT * FROM audit_logs WHERE action='device_ingest_rejected: invalid telemetry schema'")).length,1);
 assert.equal((await fetch(base+'/cpe-diagnostics/OTHER-01',{headers:{Cookie:cookie}})).status,403);
});
test('TEST FIXTURE: compatible IMU identity and vectors survive real-mode backend round trip',async()=>{
 const f={...frame(11),firmware_version:'TEST FIXTURE/imu6500-compatible',sensor_health:{mpu6050:'absent',mpu6500_compatible:'ok'},accelerometer:[0,0,9.80665],gyroscope:[0,0,1]};
 assert.equal((await send(f)).status,201);
 const response=await fetch(base+'/fleet',{headers:{Cookie:cookie}});
 const vehicles=await response.json();const t=vehicles.find((v:any)=>v.id==='ET-01').telemetry;
 assert.equal(t.sensor_health.mpu6050,'absent');assert.equal(t.sensor_health.mpu6500_compatible,'ok');
 assert.equal(t.firmware_version,f.firmware_version);assert.deepEqual(t.accelerometer,f.accelerometer);assert.deepEqual(t.gyroscope,f.gyroscope);
});
