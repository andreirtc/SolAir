import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,type Server} from 'node:http';
import {Store} from '../server/db';
import {PostgresTestStore} from './postgres-store';
import {seed} from '../server/seed';
import {createApp} from '../server/app';
import {telemetrySchema,securityState,sourcePower,NDJSONParser,type Telemetry} from '../packages/telemetry-contract';
import { gpsUsableForMap } from '../packages/telemetry-contract/gps';
import { GpsTracking } from '../server/gps-tracking';
let db:Store,server:Server,base:string,cookie:string;
let destinationFailure=false;
const cpe=()=>({historical:false,mpu_raw:null,meter_source:'bench_supply',load_mode:'bench_resistor',pzem:{quality:'ok',voltage_v:12.1,current_a:0.2,power_w:2.4,energy_wh:7,alarm_high:false,alarm_low:false},acs:{quality:'uncalibrated',current_a:null,adc_mv:1250,zero_v:2.5,sensitivity_v_per_a:0.04},lte:{quality:'unavailable',at_detected:false,registered:false,attached:false,rssi:null,uplink_commissioned:false},gps:{quality:'unavailable',hdop:null,checksum_failures:0,software_uart_overflows:0},alarm:{commanded:false,output_level:null,feedback:null,reason:null,duration_ms:5000},queue_dropped:0});
const frame=(sequence=1)=>({schema_version:2,device_id:'SOL-ET-01',firmware_version:'TEST FIXTURE cpe',boot_id:'cpe-fixture',sequence,device_uptime_ms:sequence*2000,device_timestamp:null,source_type:'hardware',transport:'usb',sensor_health:{pzem017:'ok'},cpe:cpe()});
before(async()=>{db=process.env.SOLAIR_TEST_POSTGRES==='1'?new PostgresTestStore():new Store(':memory:');await db.migrate();await seed(db);server=createServer(createApp(db,false,null,{lteDestination:async()=>{if(destinationFailure)throw new Error("TEST-FIXTURE-private-error");return {url:"https://fixture.example/api/ingest",reachable:true,temporary:true,checked_at:new Date().toISOString()};}}));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${(server.address() as any).port}/api`;const login=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'engineer@solair.local',password:'SolairDemo!2026'})});cookie=login.headers.get('set-cookie')!.split(';')[0];});
after(async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await db.close();});
const send=(data:unknown)=>fetch(base+'/ingest',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,'X-Bench-Transport':'usb'},body:JSON.stringify(data)});
test('v2 enforces measurements, quality and calibrated current; v1 remains compatible',()=>{
 assert.equal(telemetrySchema.safeParse(frame()).success,true);
 const f=frame();f.cpe.pzem.quality='fault';assert.equal(telemetrySchema.safeParse(f).success,false);
 const a=frame();a.cpe.acs.current_a=1 as any;assert.equal(telemetrySchema.safeParse(a).success,false);
 const v=frame();v.schema_version=1;assert.equal(telemetrySchema.safeParse(v).success,false);
 const l=frame();l.transport='lte';assert.equal(telemetrySchema.safeParse(l).success,false);
});
test('ADS1115 ACS source requires fresh samples and keeps uncalibrated current invalid',()=>{
 const base=frame();
 const f={...base,cpe:{...base.cpe,acs:{...base.cpe.acs,adc_source:'ads1115_a1',adc_diagnostic:'ok',adc_raw:9601,adc_age_ms:20,adc_mv:1200.125}}};
 assert.equal(telemetrySchema.safeParse(f).success,true);
 const older=frame();assert.equal(telemetrySchema.safeParse(older).success,true);
 for(const age of [501,4294967296])assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,acs:{...f.cpe.acs,adc_age_ms:age}}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,acs:{...f.cpe.acs,adc_diagnostic:'ADS1115_unavailable'}}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,acs:{...f.cpe.acs,adc_raw:null}}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,acs:{...f.cpe.acs,current_a:0.12}}}).success,false);
 const missing={...f,cpe:{...f.cpe,acs:{...f.cpe.acs,quality:'fault',adc_mv:null,adc_raw:null,adc_age_ms:null,adc_diagnostic:'ADS1115_unavailable'}}};
 assert.equal(telemetrySchema.safeParse(missing).success,true);
 const calibrated={...f,cpe:{...f.cpe,acs:{...f.cpe.acs,quality:'ok',current_a:0.12}}};
 assert.equal(telemetrySchema.safeParse(calibrated).success,true);
 assert.equal(telemetrySchema.safeParse({...calibrated,cpe:{...calibrated.cpe,acs:{...calibrated.cpe.acs,adc_mv:null}}}).success,false);
});
test('firmware 2.0.17 verified A1 diagnostic survives fragmented USB framing without weakening validity gates',()=>{
 const f={...frame(),firmware_version:'solair-cpe-2.0.17/imu6500-compatible',cpe:{...cpe(),acs:{...cpe().acs,adc_source:'ads1115_a1',adc_diagnostic:'ok_A1_config_0xD383_verified',adc_raw:4665,adc_age_ms:85,adc_mv:583.125}}};
 const accepted:Telemetry[]=[],errors:string[]=[];
 const parser=new NDJSONParser(t=>accepted.push(t),e=>errors.push(e));
 const text=JSON.stringify(f)+'\r\n';
 for(let i=0;i<text.length;i+=37)parser.feed(text.slice(i,i+37));
 assert.deepEqual(errors,[]);assert.equal(accepted.length,1);
 assert.equal(accepted[0].cpe?.acs.adc_diagnostic,f.cpe.acs.adc_diagnostic);
 assert.equal(accepted[0].cpe?.acs.current_a,null);
 for(const diagnostic of ['ok_A1_config_0xC383_verified','ok_A1_config_0xD583_verified','ok_A1_config_0x5383_verified','ok_unverified','ADS1115_config_mismatch']){
  assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,acs:{...f.cpe.acs,adc_diagnostic:diagnostic}}}).success,false,diagnostic);
 }
 for(const changes of [{adc_age_ms:501},{adc_raw:null},{current_a:0.12}]){
  assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,acs:{...f.cpe.acs,...changes}}}).success,false);
 }
});
test('LTE upload diagnostics are optional for old firmware and bounded for new firmware',()=>{
 assert.equal(telemetrySchema.safeParse(frame()).success,true);
 const newer={...frame(),cpe:{...cpe(),lte_diagnostic:'modem_clock_invalid_for_TLS'}};
 assert.equal(telemetrySchema.safeParse(newer).success,true);
 newer.cpe.lte_diagnostic='x'.repeat(121);
 assert.equal(telemetrySchema.safeParse(newer).success,false);
});
test('saved LTE destination requires a valid address while unconfigured firmware remains compatible',()=>{
 const saved={...frame(),cpe:{...cpe(),lte_endpoint_saved:true,lte_endpoint:'https://fixture.example/api/ingest'}};
 assert.equal(telemetrySchema.safeParse(saved).success,true);
 saved.cpe.lte_endpoint='';assert.equal(telemetrySchema.safeParse(saved).success,false);
 saved.cpe.lte_endpoint_saved=false;assert.equal(telemetrySchema.safeParse(saved).success,true);
 saved.cpe.lte_endpoint='https://user@fixture.example/api/ingest';assert.equal(telemetrySchema.safeParse(saved).success,false);
});
test('authenticated CPE measurements persist atomically with load and source; duplicate conflict cannot mutate',async()=>{
 const captured=frame();captured.cpe={...captured.cpe,lte_at_diagnostic:'step=AT result=timeout rx=120'} as typeof captured.cpe;
 assert.equal((await send(captured)).status,201);
 const [raw]=await db.query('SELECT payload FROM telemetry WHERE device_id=? AND boot_id=? AND sequence=?',[captured.device_id,captured.boot_id,captured.sequence]);
 assert.equal(JSON.parse(raw.payload).cpe.lte_at_diagnostic,'step=AT result=timeout rx=120');
 const [row]=await db.query('SELECT * FROM cpe_samples');assert.equal(row.load_mode,'bench_resistor');assert.equal(row.pzem_energy_wh,7);assert.equal(row.acs_current_a,null);
 const dup=await send(captured);assert.equal((await dup.json()).duplicate,true);
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



test('TEST FIXTURE: TRIGGERED stays visible after siren cutoff until DISARM',()=>{
 const f=telemetrySchema.parse({...frame(100),armed:false,alarm_active:false});
 assert.equal(securityState(f),'DISARMED');
 f.armed=true;assert.equal(securityState(f),'ARMED');
 f.alarm_active=true;f.cpe!.alarm.reason='lid';assert.equal(securityState(f),'TRIGGERED');
 f.alarm_active=false;assert.equal(securityState(f),'TRIGGERED');
 f.armed=false;f.cpe!.alarm.reason=null;assert.equal(securityState(f),'DISARMED');
 assert.equal(securityState(null),null);
});
test('TEST FIXTURE: GPS stream counters are optional for old firmware and validated for new firmware',()=>{
 const old=frame(101);assert.equal(telemetrySchema.safeParse(old).success,true);
 const current={...old,cpe:{...old.cpe,gps:{...old.cpe.gps,chars_processed:1234,sentences_passed:12,last_byte_age_ms:100}}};
 assert.equal(telemetrySchema.safeParse(current).success,true);
 current.cpe.gps.chars_processed=-1;assert.equal(telemetrySchema.safeParse(current).success,false);
});
test('TEST FIXTURE: a manual siren test cannot label a disarmed security system as TRIGGERED',()=>{
 const t=telemetrySchema.parse({...frame(102),armed:false,alarm_active:true});
 t.cpe!.alarm.reason='test';assert.equal(securityState(t),'DISARMED');
 t.alarm_active=false;assert.equal(securityState(t),'DISARMED');
});

test('LTE modem clock/revision/status are bounded optional diagnostics',()=>{
 const f={...frame(1),cpe:{...cpe(),lte_http_status:715,lte_clock:'26/10/21,11:40:00+00',lte_revision:'TEST FIXTURE revision'}};
 assert.equal(telemetrySchema.safeParse(f).success,true);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,lte_http_status:1000}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,lte_clock:'x'.repeat(41)}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,lte_revision:'x'.repeat(101)}}).success,false);
});

test('authenticated LTE can recover an event acquired before cellular commissioning without rewriting its snapshot',async()=>{
 const r=await fetch(base+'/devices/provision',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({vehicle_id:'ET-01'})});
 const credential=await r.json();
 const f={...frame(1),boot_id:'TEST-FIXTURE-pre-LTE-event',transport:'lte',event_id:'old-event',event_type:'lid',cpe:{...cpe(),historical:true}};
 assert.equal(f.cpe.lte.uplink_commissioned,false);
 assert.equal(telemetrySchema.safeParse(f).success,true);
 const post=(bearer:string)=>fetch(base+'/ingest',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+bearer},body:JSON.stringify(f)});
 assert.equal((await post('TEST-FIXTURE-wrong-token')).status,401);
 assert.equal((await post(credential.device_token)).status,201);
 const rows=await db.query("SELECT payload FROM telemetry WHERE boot_id=?",[f.boot_id]);
 assert.equal(JSON.parse(rows[0].payload).cpe.lte.uplink_commissioned,false);
 assert.equal((await post(credential.device_token)).status,200);
});

test('PPP delivery metadata preserves strict quality while retaining native HTTPS failures',()=>{
 const f={...frame(1),cpe:{...cpe(),lte_engine:'esp32_ppp_tls',lte_http_status:-11,lte_tls_error:'TEST FIXTURE handshake timeout',lte_at_diagnostic:'step=AT result=timeout rx=120 nul=1 binary=2 ppp_flags=1 boot=0 powerdown=0 numeric=0'}};
 assert.equal(telemetrySchema.safeParse(f).success,true);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,lte_engine:'unverified'}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,lte_tls_error:'x'.repeat(161)}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,lte_at_diagnostic:'x'.repeat(161)}}).success,false);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,lte_http_status:-1001}}).success,false);
});

test('GPS map quality rejects retained, zero-satellite and high-HDOP positions without changing raw validity',()=>{
 const good=telemetrySchema.parse({...frame(),gps_fix:true,latitude:14.61,longitude:121,gps_fix_age_ms:500,satellites:8,cpe:{...cpe(),gps:{...cpe().gps,quality:'ok',hdop:1.2}}});
 assert.equal(gpsUsableForMap(good),true);
 assert.equal(gpsUsableForMap({...good,gps_fix_age_ms:25000,satellites:0}),false);
 assert.equal(gpsUsableForMap({...good,cpe:{...good.cpe!,gps:{...good.cpe!.gps,hdop:99.99}}}),false);
 assert.equal(gpsUsableForMap({...good,satellites:3}),false);
 assert.equal(gpsUsableForMap({...good,satellites:null}),false);
 assert.equal(gpsUsableForMap({...good,gps_fix:false}),false);
 assert.equal(gpsUsableForMap({...good,cpe:null,satellites:null}),true,'Legacy frames without quality metadata remain compatible');
 assert.equal(good.gps_fix,true,'Map policy must not rewrite the raw receiver report');
});

test('fleet retains last reliable GPS through bad fixes, supports cold history scan and resumes on a good fix',async()=>{
 const gpsFrame=(sequence:number,hdop:number,age=500,satellites=8)=>({...frame(sequence),boot_id:'TEST-FIXTURE-gps-quality',gps_fix:true,latitude:14.61+sequence/10000,longitude:121,gps_fix_age_ms:age,satellites,cpe:{...cpe(),gps:{...cpe().gps,quality:'ok',hdop}}});
 const first=gpsFrame(1,1.1);
 assert.equal((await send(first)).status,201);
 const fleet=async()=>{const r=await fetch(base+'/fleet',{headers:{Cookie:cookie}});assert.equal(r.status,200);return (await r.json()).find((v:any)=>v.id==='ET-01');};
 assert.equal((await fleet()).gps.latitude,first.latitude);
 // More than one page of bad GPS records, all preserved in raw research data.
 for(let i=2;i<=36;i++)assert.equal((await send(gpsFrame(i,i%2?99.99:8,i%2?25000:500,i%2?0:8))).status,201);
 const degraded=await fleet();
 assert.equal(degraded.gps.latitude,first.latitude);
 assert.equal(degraded.telemetry.sequence,36,'Latest raw telemetry stays available');
 const cold=await new GpsTracking(db).latest('SOL-ET-01','hardware');
 assert.equal(cold!.latitude,first.latitude,'Cold start must find a reliable fix beyond the first history page');
 const raw=await db.query('SELECT g.* FROM gps_records g JOIN telemetry t ON t.id=g.telemetry_id WHERE t.boot_id=?',[first.boot_id]);
 assert.equal(raw.length,36,'Never delete poor fixes from recorded evidence');
 const recovered=gpsFrame(37,0.9);
 assert.equal((await send(recovered)).status,201);
 assert.equal((await fleet()).gps.latitude,recovered.latitude);
 assert.equal(await new GpsTracking(db).latest('unknown-device','hardware'),null);
 assert.equal((await fetch(base+'/fleet')).status,401);
});


test('LTE address discovery requires engineer role and vehicle scope; errors expose no private details',async()=>{
 const url=base+'/cpe-uplink/ET-01';
 assert.equal((await fetch(url)).status,401);
 const login=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'driver@solair.local',password:'SolairDemo!2026'})});
 const driver=login.headers.get('set-cookie')!.split(';')[0];
 assert.equal((await fetch(url,{headers:{Cookie:driver}})).status,403);
 assert.equal((await fetch(base+'/cpe-uplink/OTHER-01',{headers:{Cookie:cookie}})).status,403);
 const response=await fetch(url,{headers:{Cookie:cookie}});assert.equal(response.status,200);
 assert.equal((await response.json()).url,'https://fixture.example/api/ingest');
 destinationFailure=true;
 try {const failed=await fetch(url,{headers:{Cookie:cookie}});assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('private-error'));}
 finally {destinationFailure=false;}
 const unconfigured=createServer(createApp(db));
 await new Promise<void>(r=>unconfigured.listen(0,'127.0.0.1',r));
 try {assert.equal((await fetch(`http://127.0.0.1:${(unconfigured.address() as any).port}/api/cpe-uplink/ET-01`,{headers:{Cookie:cookie}})).status,503);}
 finally {unconfigured.closeAllConnections();await new Promise<void>(r=>unconfigured.close(()=>r()));}
});

test('timestamp rejection and stale sequence are distinct and never mutate stored readings',async()=>{
 const health=await (await fetch(base+'/health')).json();assert.ok(Math.abs(Date.parse(health.server_time)-Date.now())<5000);
 const future={...frame(1),boot_id:'TEST-FIXTURE-clock',device_timestamp:new Date(Date.now()+3600000).toISOString()};
 const rejected=await send(future);assert.equal(rejected.status,400);assert.equal((await rejected.json()).code,'future_timestamp');
 assert.equal((await db.query('SELECT id FROM telemetry WHERE boot_id=?',[future.boot_id])).length,0);
 const newer={...frame(3),boot_id:future.boot_id};assert.equal((await send(newer)).status,201);
 const stale=await send({...frame(2),boot_id:future.boot_id});assert.equal(stale.status,409);assert.equal((await stale.json()).code,'stale_sequence');
 const conflict=await send({...newer,device_uptime_ms:99});assert.equal(conflict.status,409);assert.equal((await conflict.json()).code,'payload_identity_conflict');
 assert.equal((await db.query('SELECT id FROM telemetry WHERE boot_id=?',[future.boot_id])).length,1);
});

test('ADS source metadata persists unchanged through actual ingestion in the disposable store',async()=>{
 for(const [version,diagnostic] of [['2.0.16','ok'],['2.0.17','ok_A1_config_0xD383_verified']]){
 const f={...frame(1),firmware_version:`solair-cpe-${version}/imu6500-compatible`,boot_id:`TEST-FIXTURE-ACS-ADS-source-${version}`,cpe:{...cpe(),acs:{...cpe().acs,adc_source:'ads1115_a1',adc_diagnostic:diagnostic,adc_raw:9601,adc_age_ms:20,adc_mv:1200.125}}};
 assert.equal((await send(f)).status,201);
 const rows=await db.query('SELECT payload FROM telemetry WHERE device_id=? AND boot_id=?',['SOL-ET-01',f.boot_id]);
 assert.equal(rows.length,1);const saved=JSON.parse(rows[0].payload).cpe.acs;
 assert.equal(saved.adc_source,'ads1115_a1');assert.equal(saved.adc_raw,9601);assert.equal(saved.adc_mv,1200.125);assert.equal(saved.current_a,null);
 assert.equal(saved.adc_diagnostic,diagnostic);
 assert.equal((await send(f)).status,200);
 }
});

test('explicit three-state FSM is compatible with legacy frames and rejects contradictory state',()=>{
 const make=(armed:boolean,alarm:boolean,reason:'lid'|'mount'|'motion'|'test'|null,state:string)=>({...frame(),armed,alarm_active:alarm,security_state:state,cpe:{...cpe(),alarm:{...cpe().alarm,reason}}});
 for(const f of [make(false,false,null,'DISARMED'),make(true,false,null,'ARMED'),make(true,true,'lid','TRIGGERED'),make(true,false,'lid','TRIGGERED'),make(false,true,'test','DISARMED')]){
  const parsed=telemetrySchema.parse(f);assert.equal(securityState(parsed),f.security_state);
 }
 for(const f of [make(false,false,null,'ARMED'),make(true,false,'lid','ARMED'),make(true,false,null,'TRIGGERED'),make(false,true,'test','TRIGGERED')])assert.equal(telemetrySchema.safeParse(f).success,false);
});

const sharedBatteryFrame=(sequence=1)=>({...frame(sequence),boot_id:'TEST-FIXTURE-shared-battery',calibration_status:'calibrated',battery_voltage_v:48,battery_current_a:-0.5,solar_output_voltage_v:48,solar_output_current_a:1,cpe:{...cpe(),meter_source:'mppt_output',load_mode:'none',measurements:{battery_voltage_validated:true,battery_current_validated:true,solar_output_validated:true},acs:{...cpe().acs,quality:'ok',current_a:-0.5},pzem:{...cpe().pzem,voltage_v:48,current_a:1,power_w:48}}});
test('battery/solar publication carries independent roles and rejects bench relabeling or invalid amperes',()=>{
 const valid=sharedBatteryFrame();assert.equal(telemetrySchema.safeParse(valid).success,true);
 assert.equal(sourcePower(telemetrySchema.parse(valid),'solar'),48);
 const change=(c:object)=>({...valid,cpe:{...valid.cpe,...c}});
 assert.equal(telemetrySchema.safeParse(change({meter_source:'bench_supply'})).success,false);
 assert.equal(telemetrySchema.safeParse(change({acs:{...valid.cpe.acs,quality:'uncalibrated',current_a:null}})).success,false);
 assert.equal(telemetrySchema.safeParse({...valid,battery_current_a:1}).success,false);
 assert.equal(telemetrySchema.safeParse({...valid,battery_voltage_v:null}).success,false);
 assert.equal(telemetrySchema.safeParse(change({measurements:{...valid.cpe.measurements,solar_output_validated:false}})).success,false);
 assert.equal(telemetrySchema.safeParse({...valid,solar_output_current_a:null}).success,false);
});
test('motion window diagnostics retain concurrent peaks without asserting validated detection',()=>{
 const motion={enabled:false,calibrated:false,delta_threshold_mps2:4,gyro_threshold_rad_s:1.5,hold_ms:200,window_samples:40,peak_delta_mps2:0.4,peak_gyro_rad_s:0.05};
 const f={...frame(),cpe:{...cpe(),motion}};
 assert.equal(telemetrySchema.safeParse(f).success,true);
 assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,motion:{...motion,peak_delta_mps2:-1}}}).success,false);
});
test('validated shared-battery channels reach fleet/history and MPPT power integrates separately from bench input',async()=>{
 const stamp=Date.now()-10000;
 const first={...sharedBatteryFrame(),device_timestamp:new Date(stamp).toISOString()};
 assert.equal((await send(first)).status,201);
 const second={...sharedBatteryFrame(2),device_timestamp:new Date(stamp+5000).toISOString(),solar_output_current_a:2};
 assert.equal((await send(second)).status,201);
 const fleet=await (await fetch(base+'/fleet',{headers:{Cookie:cookie}})).json();
 const t=fleet.find((v:any)=>v.id==='ET-01').telemetry;
 assert.equal(t.battery_voltage_v,48);assert.equal(t.battery_current_a,-0.5);assert.equal(t.solar_output_current_a,2);
 assert.equal(t.solar_voltage_v,null,'No invented PV-input measurement');assert.equal(t.wind_voltage_v,null);
 const rows=await db.query("SELECT e.power_w,e.increment_wh FROM energy_measurements e JOIN telemetry t ON t.id=e.telemetry_id WHERE t.boot_id=? AND e.source='solar' ORDER BY t.sequence",[first.boot_id]);
 assert.deepEqual(rows.map(r=>r.power_w),[48,96]);assert.ok(Math.abs(rows[1].increment_wh-0.1)<1e-8);
});

test('ACS validated range rejects extrapolated current while old frames remain compatible',()=>{
 const f={...frame(),cpe:{...cpe(),acs:{...cpe().acs,quality:'ok',current_a:0.5,current_diagnostic:'ok',validated_min_a:-1,validated_max_a:1}}};
 assert.equal(telemetrySchema.safeParse(f).success,true);
 for(const change of [{current_a:1.01},{current_a:-1.01},{validated_min_a:1},{validated_min_a:null,validated_max_a:null},{current_diagnostic:'not_calibrated'}]){
  assert.equal(telemetrySchema.safeParse({...f,cpe:{...f.cpe,acs:{...f.cpe.acs,...change}}}).success,false);
 }
 const outside={...f,cpe:{...f.cpe,acs:{...f.cpe.acs,quality:'fault',current_a:null,current_diagnostic:'invalid_sample_or_outside_validated_range'}}};
 assert.equal(telemetrySchema.safeParse(outside).success,true);
 const pending={...frame(),cpe:{...cpe(),acs:{...cpe().acs,current_diagnostic:'not_calibrated',validated_min_a:null,validated_max_a:null}}};
 assert.equal(telemetrySchema.safeParse(pending).success,true);
});
