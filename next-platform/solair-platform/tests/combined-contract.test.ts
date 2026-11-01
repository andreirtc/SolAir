import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NDJSONParser,securityState,sourcePower,telemetrySchema,type Telemetry} from '../packages/telemetry-contract';

// Software fixtures only. These values are neither accepted hardware records nor calibration evidence.
function combinedFrame() {
 return {
  schema_version:2,device_id:'TEST-FIXTURE-COMBINED',firmware_version:'TEST FIXTURE 2.0.19',
  boot_id:'TEST-FIXTURE-BOOT',sequence:15,device_uptime_ms:30000,
  device_timestamp:'2026-10-29T00:00:00.000Z',source_type:'hardware',transport:'lte',
  sensor_health:{acs758:'uncalibrated',ads1115:'ok',gps:'ok'},sensor_age_ms:{acs758:20,imu:30},
  armed:true,security_state:'TRIGGERED',alarm_active:false,
  gps_fix:true,latitude:14.6,longitude:120.98,gps_fix_age_ms:1000,satellites:8,
  alarm_id:'TEST-FIXTURE-ACTIVATION',alarm_causes:['lid','mount'],
  event_id:'TEST-FIXTURE-EVENT',event_type:'lid',event_timestamp:null,event_uptime_ms:28000,
  cpe:{
   historical:false,meter_source:'bench_supply',load_mode:'bench_resistor',mpu_raw:null,
   imu_diagnostic:'TEST FIXTURE compatible IMU',
   lte_engine:'esp32_ppp_tls',lte_http_status:201,lte_diagnostic:'TEST FIXTURE upload',
   lte_endpoint:'https://fixture.example/api/ingest',lte_endpoint_saved:true,
   measurements:{battery_voltage_validated:false,battery_current_validated:false,solar_output_validated:false},
   motion:{enabled:false,calibrated:false,delta_threshold_mps2:2,gyro_threshold_rad_s:1,hold_ms:200,
    window_samples:10,longest_above_threshold_ms:0,peak_delta_mps2:0.1,peak_gyro_rad_s:0.1},
   pzem:{quality:'ok',voltage_v:12,current_a:0.1,power_w:1.2,energy_wh:3,alarm_high:false,alarm_low:false},
   acs:{quality:'uncalibrated',current_a:null,adc_mv:1200,zero_v:2.5,sensitivity_v_per_a:0.04,
    current_diagnostic:'not_calibrated',validated_min_a:null,validated_max_a:null,
    adc_source:'ads1115_a1',adc_diagnostic:'ok_A1_config_0xD383_verified',adc_raw:9600,adc_age_ms:20},
   lte:{quality:'ok',at_detected:true,registered:true,attached:true,rssi:20,uplink_commissioned:true},
   gps:{quality:'ok',hdop:1,checksum_failures:0,software_uart_overflows:0,
    chars_processed:1234,sentences_passed:12,last_byte_age_ms:50},
   alarm:{commanded:false,output_level:0,feedback:null,reason:'lid',duration_ms:5000},queue_dropped:0,
  },
 };
}

test('combined contract retains current CPE diagnostics and additive incident metadata without inventing current or sound feedback',()=>{
 const t=telemetrySchema.parse(combinedFrame());
 assert.deepEqual([t.source_type,t.transport,t.device_timestamp,t.boot_id,t.sequence],
  ['hardware','lte','2026-10-29T00:00:00.000Z','TEST-FIXTURE-BOOT',15]);
 assert.equal(t.cpe!.acs.adc_diagnostic,'ok_A1_config_0xD383_verified');
 assert.equal(t.cpe!.lte_endpoint,'https://fixture.example/api/ingest');
 assert.equal(t.cpe!.motion!.longest_above_threshold_ms,0);
 assert.deepEqual(t.sensor_age_ms,{acs758:20,imu:30});
 assert.deepEqual(t.alarm_causes,['lid','mount']);
 assert.equal(t.event_timestamp,null);
 assert.equal(t.event_uptime_ms,28000);
 assert.equal(securityState(t),'TRIGGERED');
 assert.equal(t.alarm_active,false);
 assert.equal(t.cpe!.alarm.feedback,null);
 assert.equal(t.cpe!.acs.current_a,null);
 assert.equal(t.battery_current_a,null);
});

test('additive incident metadata does not weaken current ADS, ACS, channel or explicit FSM gates',()=>{
 const invalid:Array<(f:any)=>void>=[
  f=>{f.cpe.acs.current_a=0;},
  f=>{f.cpe.acs.adc_age_ms=501;},
  f=>{f.cpe.acs.adc_diagnostic='ok_A1_config_0xC383_verified';},
  f=>{f.cpe.acs.quality='ok';f.cpe.acs.current_diagnostic='ok';f.cpe.acs.current_a=-2;
   f.cpe.acs.validated_min_a=-1;f.cpe.acs.validated_max_a=1;},
  f=>{f.calibration_status='calibrated';f.battery_current_a=0;},
  f=>{f.security_state='ARMED';},
 ];
 for(const change of invalid){const f=combinedFrame();change(f);assert.equal(telemetrySchema.safeParse(f).success,false);}
});

test('older frames remain compatible and operational metadata stays bounded and strict',()=>{
 const older:any=combinedFrame();
 for(const key of ['sensor_age_ms','alarm_id','alarm_causes','event_timestamp','event_uptime_ms'])delete older[key];
 const t=telemetrySchema.parse(older);
 assert.deepEqual(t.sensor_age_ms,{});assert.equal(t.alarm_id,null);assert.deepEqual(t.alarm_causes,[]);
 for(const changes of [
  {sensor_age_ms:{imu:-1}}, {sensor_age_ms:{imu:Infinity}}, {alarm_id:''},
  {alarm_causes:['lid','mount','motion','sensor_fault','lid']}, {alarm_causes:['test']},
  {event_timestamp:'not UTC'}, {event_uptime_ms:1.5}, {pretend_server_accepted:true},
 ])assert.equal(telemetrySchema.safeParse({...combinedFrame(),...changes}).success,false);
});

test('combined contract keeps independently validated MPPT-output power separate from ACS battery current',()=>{
 const f:any=combinedFrame();
 f.cpe.meter_source='mppt_output';f.cpe.measurements.battery_voltage_validated=true;
 f.cpe.measurements.solar_output_validated=true;f.calibration_status='calibrated';
 f.battery_voltage_v=48;f.solar_output_voltage_v=48;f.solar_output_current_a=0.25;
 const t=telemetrySchema.parse(f);
 assert.equal(sourcePower(t,'solar'),12);
 assert.equal(t.solar_voltage_v,null);assert.equal(t.battery_current_a,null);
 assert.equal(t.cpe!.acs.quality,'uncalibrated');
});

test('fragmented combined event frames retain strict parser recovery after an interrupted line',()=>{
 const accepted:Telemetry[]=[],errors:string[]=[];
 const parser=new NDJSONParser(t=>accepted.push(t),e=>errors.push(e));
 const line=JSON.stringify(combinedFrame());
 parser.feed(line.slice(0,50));parser.discardInterruptedLine();parser.feed(line.slice(50)+'\n');
 for(let at=0;at<line.length;at+=37)parser.feed(line.slice(at,at+37));
 parser.feed('\r\n');
 assert.equal(accepted.length,1);assert.equal(securityState(accepted[0]),'TRIGGERED');
 assert.deepEqual(accepted[0].alarm_causes,['lid','mount']);assert.deepEqual(errors,[]);
});
