// All browser APIs/telemetry/control requests are fixtures. No device or stored data is touched.
import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.SOLAIR_TEST_CHROMIUM});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors:string[]=[],commands:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{Object.defineProperty(navigator,'serial',{value:undefined});(window as any).EventSource=class extends EventTarget{close(){}};});
 const at=new Date().toISOString(),cpe:any={historical:false,mpu_raw:null,meter_source:'bench_supply',load_mode:'unknown',queue_dropped:0,
 remote_control:{enabled:true,last_id:null,last_result:null,last_command:null},pzem:{quality:'ok',voltage_v:53.93,current_a:0,power_w:0,energy_wh:7,alarm_high:false,alarm_low:false},acs:{quality:'unavailable',current_a:null,adc_mv:null,zero_v:null,sensitivity_v_per_a:null},lte:{quality:'ok',at_detected:true,registered:true,attached:true,rssi:20,uplink_commissioned:true},gps:{quality:'ok',hdop:1,checksum_failures:0,software_uart_overflows:0},alarm:{commanded:false,output_level:0,feedback:null,reason:null,duration_ms:5000}};
 const t:any={schema_version:2,device_id:'SOL-ET-01',firmware_version:'solair-cpe-2.0.20/imu6500-compatible/lid-only/remote',boot_id:'FIXTURE-ONLY',sequence:1,device_uptime_ms:20000,source_type:'hardware',transport:'lte',received_at:at,device_timestamp:at,measured_at:at,calibration_status:'unverified',battery_voltage_v:null,battery_current_a:null,sensor_health:{},accelerometer:[0,0,9.81],lid_state:'secure',mount_state:null,cpe};
 const v={id:'ET-01',device_id:'SOL-ET-01',name:'TEST FIXTURE',model:'BEMAC',image_url:'/bemac-white.png',status:'Online',telemetry:t,gps:null,nominal_voltage:48,nominal_capacity:10,solar_wh:null,wind_wh:null};let latest:any=null;
 await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let body:any=[];
  if(path==='/api/me')body={id:'fixture',org_id:'fixture-org',role:'engineer',name:'TEST FIXTURE',email:'fixture@example.com',notifications:0,organization_name:'FIXTURE'};
  if(path==='/api/health')body={server_time:new Date().toISOString(),environment:'local development'};
  if(path==='/api/fleet')body=[v];if(path==='/api/organization')body={name:'FIXTURE'};
  if(path.startsWith('/api/research/'))body={records:[]};if(path.startsWith('/api/battery/'))body={quality:'unavailable',soc_pct:null,tte_minutes:null};
  if(path==='/api/cpe-control/ET-01'){
   if(route.request().method()==='POST'){const b=route.request().postDataJSON();commands.push(b.command);latest={id:b.request_id,command:b.command,status:'accepted',created_at:new Date().toISOString(),expires_at:new Date(Date.now()+60000).toISOString()};body={id:b.request_id,status:'pending'};}
   else body={capable:true,fresh:true,command:latest};
  }
  await route.fulfill({json:body});});
 await page.route('https://tile.openstreetmap.org/**',r=>r.abort());await page.goto('http://127.0.0.1:3000');await page.getByLabel('Data mode').selectOption('hardware');
 const nav=(name:string)=>page.locator('.sidebar nav').getByRole('button',{name,exact:name!=='CPE Lab'}).click();await nav('CPE Lab');
 await page.getByRole('button',{name:'Arm via LTE',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Connect ESP32',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Arm via LTE',exact:true}).click();await page.getByText('Device accepted',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Disarm via LTE',exact:true}).click();await page.getByRole('button',{name:'Test siren via LTE (5s)',exact:true}).click();assert.deepEqual(commands,['arm','disarm','siren_test']);
 await nav('Energy');await page.getByRole('region',{name:'Reported PZEM voltage'}).waitFor();assert.match(await page.getByRole('region',{name:'Reported PZEM voltage'}).innerText(),/53.93 V/);assert.match(await page.locator('#energy-battery').innerText(),/Battery-voltage validation pending/);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log('PASS: phone USB unavailable; authenticated remote ARM/DISARM/siren requests; Energy shows reported PZEM voltage while calibrated battery field stays pending; mobile containment. Fixtures only.');
}finally{await browser.close()}
