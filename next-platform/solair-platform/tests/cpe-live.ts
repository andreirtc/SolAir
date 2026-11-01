// Software fixture only. All API requests and USB input are intercepted in this browser.
// Never ingests fixture readings into the working bench database.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({headless:true,...(process.env.SOLAIR_TEST_CHROMIUM?{executablePath:process.env.SOLAIR_TEST_CHROMIUM}:{})});
const results:string[]=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors:string[]=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
 let report:any=null, rejectIngest=false;
 const frame=(sequence:number, accelerometer:number[]|null=[12,-9,9.81])=>({schema_version:1,device_id:'SOL-ET-01',firmware_version:'TEST FIXTURE live stream',boot_id:'TEST-FIXTURE-live',sequence,device_uptime_ms:sequence*2000,source_type:'hardware',transport:'usb',sensor_health:{mpu6500_compatible:'ok'},accelerometer,gyroscope:[1,2,3]});
 await page.addInitScript(`
   const fixture={};window.serialFixture=fixture;
   Object.defineProperty(navigator,'serial',{value:{requestPort:async()=>({
     open:async(options)=>{fixture.opens=(fixture.opens||0)+1;fixture.options=options;},
     get readable(){return new ReadableStream({start(c){fixture.controller=c;}});},
     close:async()=>{fixture.closes=(fixture.closes||0)+1;},
     writable:new WritableStream({write(bytes){(fixture.commands ||= []).push(new TextDecoder().decode(bytes));}}),
   })}});
 `);
 await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   let body:any=[];
   if(path==='/api/me')body={id:'TEST-FIXTURE-engineer',org_id:'TEST-FIXTURE-org',name:'Test Engineer',email:'fixture@solair.local',role:'engineer'};
   if(path==='/api/organization')body={name:'TEST FIXTURE ONLY'};
   if(path==='/api/health')body={environment:'local development'};
   if(path==='/api/fleet')body=[{id:'ET-01',name:'TEST FIXTURE',model:'BEMAC',image_url:'/bemac-white.png',device_id:'SOL-ET-01',nominal_voltage:55.2,nominal_capacity:100,telemetry:report,gps:null}];
   if(path==='/api/events'){await route.fulfill({contentType:'text/event-stream',body:'event: ready\ndata: {}\n\n'});return;}
   if(path==='/api/ingest'){await route.fulfill({status:rejectIngest?500:201,json:rejectIngest?{error:'TEST FIXTURE storage failure'}:{accepted:true}});return;}
   await route.fulfill({json:body});
 });
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:3000');
 await page.getByLabel('Data mode').selectOption('hardware');
 await page.getByRole('button',{name:'CPE Lab',exact:false}).click();
 await page.getByRole('heading',{name:'From breadboard to road.'}).waitFor();
 const graph=page.getByRole('img',{name:'MPU acceleration history, X axis'});
 const paths=graph.locator('path[data-axis]');
 const push=async (data:unknown)=>{await page.evaluate(data=>{(window as any).serialFixture.controller.enqueue(new TextEncoder().encode(typeof data==='string'?data:JSON.stringify(data)+'\n'));},data);};
 await page.getByRole('button',{name:'Connect ESP32',exact:true}).click();
 await page.getByText('USB open · waiting for telemetry',{exact:false}).waitFor();
 assert.deepEqual(await page.evaluate(()=>(window as any).serialFixture.options),{baudRate:115200,dataBits:8,stopBits:1,parity:'none',flowControl:'none',bufferSize:65536});
 await push('x'.repeat(70000));
 await page.getByRole('alert').filter({hasText:'Serial line exceeded 64 KiB'}).waitFor();
 await page.getByText('USB open · waiting for telemetry',{exact:false}).waitFor();
 await page.getByText('USB receive diagnostics · 70000 bytes · CR 0 / LF 0',{exact:false}).click();
 await page.getByText('No line endings received.',{exact:false}).waitFor();
 await push('\r'+JSON.stringify(frame(1))+'\r');await page.getByText('USB streaming',{exact:false}).waitFor();
 assert.equal(await page.getByRole('alert').filter({hasText:'Serial line exceeded 64 KiB'}).count(),0);
 results.push('Screenshot failure reproduced with 70,000 unterminated bytes: reports framing diagnostics, then resumes on the next valid CR-delimited frame without reconnect');
 await page.getByText('12.000',{exact:false}).first().waitFor();
 await page.getByText('1/40 samples',{exact:false}).waitFor();
 const first=await paths.first().getAttribute('d');
 await push(frame(2,[-13,11,10]));await page.getByText('2/40 samples',{exact:false}).waitFor();
 assert.notEqual(await paths.first().getAttribute('d'),first);
 for(const d of await paths.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')||''))){const nums=d.match(/-?\d+(\.\d+)?/g)!.map(Number);assert.ok(nums.every((n,i)=>i%2===0?n>=0&&n<=400:n>=0&&n<=85));}
 results.push('Real UI accepts continuous fixture USB frames; the default single X acceleration path changes and remains in bounds at +/-13 m/s²');
 await push(frame(3,null));await page.getByText('Report #3',{exact:false}).waitFor();await page.getByText('2/40 samples',{exact:false}).waitFor();
 await push(frame(3,null));await page.getByText('2/40 samples',{exact:false}).waitFor();
 await page.getByRole('status').filter({hasText:'not live MPU readings'}).waitFor();
 results.push('Null MPU frames and repeated frames retain the graph with an explicit unavailable/retained-data message');
 await push({...frame(4),accelerometer:['bad',0,0]});await page.getByRole('alert').filter({hasText:'accelerometer.0'}).waitFor();
 await push('# TEST FIXTURE comment\n');await page.getByText('2/40 samples',{exact:false}).waitFor();
 results.push('Malformed telemetry shows its exact field; diagnostic comments preserve graph history');
 rejectIngest=true;await push(frame(5));await page.getByRole('alert').filter({hasText:'TEST FIXTURE storage failure'}).waitFor();await page.getByText('Report #5',{exact:false}).waitFor();
 results.push('Backend storage failure remains visible while real-time USB display continues');
 await page.waitForTimeout(11000);await page.getByText('USB open · waiting for telemetry',{exact:false}).waitFor();
 results.push('Open USB port with stalled frames loses streaming status and shows recovery guidance');
 rejectIngest=false;await push(frame(6));await page.getByText('USB streaming',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Disconnect USB',exact:true}).click();await page.getByRole('button',{name:'Connect ESP32',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>(window as any).serialFixture.closes),1);
 report={...frame(7,[2,3,9.81]),received_at:new Date().toISOString(),measured_at:new Date().toISOString()};
 await page.getByText('Report #7',{exact:false}).waitFor({timeout:12000});
 await page.getByText('5/40 samples',{exact:false}).waitFor();
 results.push('Network reports append MPU samples automatically after USB disconnect even when the event stream closes');
 await page.getByRole('button',{name:'Connect ESP32',exact:true}).click();await push(frame(8));await page.getByText('Report #8',{exact:false}).waitFor();
 report={...frame(9,[1,2,9.81]),received_at:new Date(Date.now()+1).toISOString(),measured_at:new Date().toISOString()};
 await page.getByRole('button',{name:'Refresh network telemetry',exact:true}).click();await page.getByText('Report #9',{exact:false}).waitFor();
 results.push('A newer network report replaces an older retained USB report');
 await page.evaluate(()=>(window as any).serialFixture.controller.close());await page.getByRole('button',{name:'Connect ESP32',exact:true}).waitFor();
 await page.getByRole('button',{name:'Connect ESP32',exact:true}).click();await push(frame(10));await page.getByText('Report #10',{exact:false}).waitFor();
 results.push('End-of-stream closes the old port; reconnect starts a new working read loop');
 const cpe:any={historical:false,imu_diagnostic:'identity_read_failed_check_MPU_power_SDA21_SCL22',pzem_diagnostic:'no_reply_check_UART_and_meter_power',pzem_rx_bytes:0,pzem_shunt50_verified:false,mpu_raw:null,meter_source:'bench_supply',load_mode:'none',pzem:{quality:'fault',voltage_v:null,current_a:null,power_w:null,energy_wh:null,alarm_high:null,alarm_low:null},acs:{quality:'uncalibrated',current_a:null,adc_mv:1170,zero_v:2.34,sensitivity_v_per_a:0.04},lte:{quality:'unavailable',at_detected:false,registered:false,attached:false,rssi:null,uplink_commissioned:false},gps:{quality:'fault',hdop:null,checksum_failures:0,software_uart_overflows:0,chars_processed:1000,sentences_passed:10,last_byte_age_ms:10},alarm:{commanded:false,output_level:0,feedback:null,reason:'test',duration_ms:5000},queue_dropped:0};
 const securityFrame=(sequence:number,armed:boolean,lid:number,reason:string|null,active=false)=>({...frame(sequence,null),schema_version:2,armed,alarm_active:active,lid_raw:lid,mount_raw:0,lid_state:lid?'tampered':'secure',mount_state:'secure',cpe:{...cpe,alarm:{...cpe.alarm,reason,commanded:active,output_level:active?1:0}}});
 const security=page.locator('p').filter({hasText:/^Security:/});
 await push(securityFrame(11,false,0,'test'));await page.getByRole('button',{name:'Clear test latch',exact:true}).waitFor();
 assert.match(await security.innerText(),/DISARMED/);
 await page.getByRole('button',{name:'Clear test latch',exact:true}).click();
 assert.equal(JSON.parse(await page.evaluate(()=>(window as any).serialFixture.commands.at(-1))).command,'disarm');
 await push(securityFrame(12,false,0,null));await page.getByRole('button',{name:'Arm bench',exact:true}).waitFor();
 await page.locator('.switch-row').filter({hasText:'Lid · GPIO25'}).getByText('secure · raw 0',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Arm bench',exact:true}).click();
 assert.equal(JSON.parse(await page.evaluate(()=>(window as any).serialFixture.commands.at(-1))).command,'arm');
 await push(securityFrame(13,true,0,null));await security.getByText('ARMED',{exact:true}).waitFor();
 await push(securityFrame(14,true,1,'lid',true));await page.locator('.switch-row').filter({hasText:'Lid · GPIO25'}).getByText('tampered · raw 1',{exact:true}).waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('p')].some(p=>p.textContent?.startsWith('Security: TRIGGERED')));
 await push(securityFrame(15,true,1,'lid'));await page.getByText('Report #15',{exact:false}).waitFor();assert.match(await security.innerText(),/TRIGGERED/);
 await push(securityFrame(16,false,0,null));await page.getByText('Report #16',{exact:false}).waitFor();assert.match(await security.innerText(),/DISARMED/);
 await page.getByText('Receiving serial data; no valid position fix',{exact:false}).waitFor();
 await page.locator('p').filter({hasText:'Device diagnostics:'}).filter({hasText:'no_reply_check_UART_and_meter_power'}).waitFor();
 results.push('Manual siren test remains DISARMED; clear/ARM commands and secure/tampered values render; true security trips stay TRIGGERED after cutoff until DISARM');
 results.push('Current device diagnostic errors and receiving-GPS-without-fix states display independently of the live USB stream');

 mkdirSync('docs/cpe-evidence',{recursive:true});
 await page.screenshot({path:'docs/cpe-evidence/TEST-FIXTURE-live-desktop-2026-10-19.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:'docs/cpe-evidence/TEST-FIXTURE-live-mobile-2026-10-19.png',fullPage:true});
 results.push('Desktop and 390px mobile views render without page overflow');
 assert.deepEqual(errors,[]);
 writeFileSync('docs/cpe-evidence/live-stream-software-results-2026-10-19.json',JSON.stringify({provenance:'TEST FIXTURE ONLY — intercepted API and browser Web Serial',physicalTests:'NOT RUN',results},null,2));
 console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
