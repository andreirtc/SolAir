// TEST FIXTURE ONLY: all API calls and Web Serial intercepted; no working DB writes.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.SOLAIR_TEST_CHROMIUM?{executablePath:process.env.SOLAIR_TEST_CHROMIUM}:{})});
try{
 const page=await browser.newPage({viewport:{width:1450,height:1050}});const errors:string[]=[];const uploads:any[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(`Object.defineProperty(navigator,'serial',{value:{requestPort:async()=>({open:async()=>{},close:async()=>{},get readable(){return new ReadableStream({start(c){window.fixtureController=c}})},writable:new WritableStream({write(){}})})}});window.EventSource=class extends EventTarget{close(){}};`);
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;let body:unknown=[];
  if(path==='/api/me')body={id:'fixture',org_id:'fixture',role:'engineer',name:'TEST FIXTURE'};
  if(path==='/api/health')body={environment:'local development',server_time:new Date().toISOString()};
  if(path==='/api/organization')body={name:'TEST FIXTURE'};
  if(path==='/api/fleet')body=[{id:'ET-01',device_id:'SOL-ET-01',name:'TEST FIXTURE',image_url:'/bemac-white.png',telemetry:null,gps:null}];
  if(path==='/api/ingest'){uploads.push(route.request().postDataJSON());body={accepted:true};}
  await route.fulfill({json:body});
 });
 await page.goto('http://127.0.0.1:3000');await page.getByLabel('Data mode').selectOption('hardware');await page.getByRole('button',{name:'CPE Lab',exact:false}).click();await page.getByRole('button',{name:'Connect ESP32',exact:true}).click();
 await page.getByText('USB open · waiting for telemetry',{exact:false}).waitFor();
 const base={schema_version:2,device_id:'SOL-ET-01',boot_id:'TEST-FIXTURE-ACS-source',sequence:1,firmware_version:'solair-cpe-2.0.16',device_uptime_ms:2000,source_type:'hardware',transport:'usb',sensor_health:{acs758:'uncalibrated'},acs_output_v:2.40025,cpe:{historical:false,mpu_raw:null,meter_source:'bench_supply',load_mode:'bench_resistor',pzem:{quality:'ok',voltage_v:12.22,current_a:0.12,power_w:1.4,energy_wh:3,alarm_high:false,alarm_low:false},acs:{quality:'uncalibrated',current_a:null,adc_mv:1200.125,zero_v:2.34,sensitivity_v_per_a:0.04,adc_source:'ads1115_a1',adc_diagnostic:'ok',adc_raw:9601,adc_age_ms:20},lte:{quality:'unavailable',at_detected:false,registered:false,attached:false,rssi:null,uplink_commissioned:false},gps:{quality:'unavailable',hdop:null,checksum_failures:0,software_uart_overflows:0},alarm:{commanded:false,output_level:null,feedback:null,reason:null,duration_ms:5000},queue_dropped:0}};
 // Feed actual unnormalized firmware bytes through the browser parser; do not
 // pre-parse using the Node contract and accidentally bypass the client gate.
 const push=async(f:unknown)=>page.evaluate(frame=>(window as any).fixtureController.enqueue(new TextEncoder().encode(JSON.stringify(frame)+'\n')),f);
 await push(base);await page.getByText('Report #1',{exact:false}).waitFor();await page.getByText('ACS ADS1115 A1',{exact:true}).waitFor();await page.getByText('1200.125 mV',{exact:true}).waitFor();
 assert.equal(await page.getByText('ACS ESP32 ADC1',{exact:true}).count(),0);
 const current=page.locator('.electrical-grid > div').filter({has:page.locator('span',{hasText:'ACS calibrated current'})});assert.ok((await current.innerText()).includes('— A'));
 const verified={...base,firmware_version:'solair-cpe-2.0.17/imu6500-compatible',sequence:2,cpe:{...base.cpe,acs:{...base.cpe.acs,adc_diagnostic:'ok_A1_config_0xD383_verified'}}};
 const uploaded=page.waitForRequest(r=>new URL(r.url()).pathname==='/api/ingest'&&r.postDataJSON()?.sequence===2);
 await push(verified);await page.getByText('Report #2',{exact:false}).waitFor();await uploaded;
 await page.getByText('ACS input: ADS1115 A1 · ok_A1_config_0xD383_verified',{exact:false}).waitFor();
 assert.equal(uploads.find(t=>t.sequence===2)?.cpe.acs.adc_diagnostic,'ok_A1_config_0xD383_verified');
 await page.getByTestId('acs-uncalibrated').getByText('1.51 A',{exact:true}).waitFor();assert.equal(uploads.find(t=>t.sequence===2)?.cpe.acs.current_a,null);assert.equal(uploads.find(t=>t.sequence===2)?.battery_current_a,null);
 await page.getByText('configured conversion coefficients, not validated calibration',{exact:false}).waitFor();
 await push({...verified,sequence:3,cpe:{...verified.cpe,acs:{...verified.cpe.acs,adc_diagnostic:'ok_A1_config_0xC383_verified'}}});
 await page.getByText('Invalid telemetry line rejected: cpe: ADS1115 ACS voltage requires a fresh valid channel sample',{exact:false}).first().waitFor();
 assert.equal(uploads.some(t=>t.sequence===3),false);
 await push({...base,sequence:4,cpe:{...base.cpe,acs:{...base.cpe.acs,quality:'fault',adc_mv:null,adc_raw:null,adc_age_ms:null,adc_diagnostic:'ADS1115_unavailable'}}});
 await page.getByText('Report #4',{exact:false}).waitFor();await page.getByText('ACS input: ADS1115 A1 · ADS1115_unavailable',{exact:false}).waitFor();assert.equal(await page.getByText('1200.125 mV',{exact:true}).count(),0);assert.equal(await page.getByTestId('acs-uncalibrated').count(),0);
 await push({...base,sequence:5,cpe:{...base.cpe,acs:{quality:'uncalibrated',current_a:null,adc_mv:1195,zero_v:2.34,sensitivity_v_per_a:0.04}}});await page.getByText('Report #5',{exact:false}).waitFor();await page.getByText('ACS ESP32 ADC1',{exact:true}).waitFor();
 const negative={...verified,sequence:6,acs_output_v:2.2745,cpe:{...verified.cpe,acs:{...verified.cpe.acs,adc_mv:1137.25,adc_raw:9098}}};
 await push(negative);await page.getByText('Report #6',{exact:false}).waitFor();
 await page.getByTestId('acs-uncalibrated').getByText('ACS signed estimate — UNCALIBRATED',{exact:true}).waitFor();
 await page.getByTestId('acs-uncalibrated').getByText('-1.64 A',{exact:true}).waitFor();
 assert.match(await page.getByTestId('acs-signed-status').innerText(),/65\.50 mV below the configured zero/);
 assert.match(await page.getByTestId('acs-signed-status').innerText(),/direction is unverified/);
 assert.equal(await page.getByText('Accuracy validation is deferred to DP2.',{exact:false}).count(),0);
 const uploadedNegative=uploads.find(t=>t.sequence===6);assert.equal(uploadedNegative?.battery_current_a,null);assert.equal(uploadedNegative?.cpe.acs.current_a,null);
 await push({...verified,sequence:7,cpe:{...verified.cpe,acs:{...verified.cpe.acs,quality:'fault',adc_mv:null,adc_raw:null,adc_age_ms:null,adc_diagnostic:'ADS1115_unavailable'}}});await page.getByText('Report #7',{exact:false}).waitFor();
 assert.equal(await page.getByTestId('acs-signed-status').count(),0);assert.equal(await page.getByTestId('acs-uncalibrated').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: intercepted browser fixtures: raw frames display/forward, wrong config rejected, selected ADC source, signed uncalibrated estimate explains zero difference without changing current, faults clear voltage/estimate, legacy compatibility; no hardware PASS');
}finally{await browser.close();}
