// Intercepted Web Serial/API fixtures; no device access or production writes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless:true, ...(process.env.SOLAIR_TEST_CHROMIUM?{executablePath:process.env.SOLAIR_TEST_CHROMIUM}:{}) });
try {
 const page=await browser.newPage();const errors:string[]=[];const posted:number[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(`
  window.fixture={opens:0,closes:0};
  Object.defineProperty(navigator,'serial',{value:{requestPort:async()=>({
   open:async()=>{window.fixture.opens++;window.fixture.stream=new ReadableStream({start(c){window.fixture.controller=c;}});},
   get readable(){return window.fixture.stream;},
   setSignals:async s=>{if(s.dataTerminalReady||s.requestToSend)throw Error('TEST FIXTURE: reset asserted');},
   writable:new WritableStream(),close:async()=>{window.fixture.closes++;}
  })}});
  window.EventSource=class extends EventTarget{close(){}};
 `);
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;let body:unknown=[];
  if(path==='/api/me')body={id:'fixture',org_id:'fixture',role:'engineer',name:'TEST FIXTURE'};
  if(path==='/api/health')body={environment:'local development',server_time:new Date().toISOString()};
  if(path==='/api/organization')body={name:'TEST FIXTURE'};
  if(path==='/api/fleet')body=[{id:'ET-01',device_id:'SOL-ET-01',name:'TEST FIXTURE',image_url:'/bemac-white.png',telemetry:null,gps:null}];
  if(path==='/api/ingest'){posted.push(route.request().postDataJSON().sequence);body={accepted:true};}
  await route.fulfill({json:body});
 });
 await page.goto('http://127.0.0.1:3000');
 await page.getByLabel('Data mode').selectOption('hardware');
 await page.getByRole('button',{name:'CPE Lab',exact:false}).click();
 await page.getByRole('button',{name:'Connect ESP32',exact:true}).click();
 await page.getByRole('button',{name:'Disconnect USB',exact:true}).waitFor();
 await page.waitForTimeout(2100); // Exercise the actual startup-noise timer.
 await page.evaluate(()=>(window as any).fixture.controller.enqueue(new Uint8Array(6000).fill(128)));
 await page.waitForFunction(()=>(window as any).fixture.opens===2);
 await page.getByText('# USB port reopened;', {exact:false}).waitFor({state:'attached'});
 assert.deepEqual(await page.evaluate(()=>[(window as any).fixture.opens,(window as any).fixture.closes]),[2,1]);
 assert.equal(posted.length,0,'No garbled input may reach ingestion');
 const frame={schema_version:1,device_id:'SOL-ET-01',firmware_version:'TEST FIXTURE USB recovery',boot_id:'fixture-noise',sequence:1,device_uptime_ms:1,source_type:'hardware',transport:'usb',sensor_health:{}};
 await page.evaluate(frame=>(window as any).fixture.controller.enqueue(new TextEncoder().encode('\n'+JSON.stringify(frame)+'\n')),frame);
 await page.getByText('Report #1',{exact:false}).waitFor();
 assert.equal(await page.locator('.serial-receive').count(),0,'Valid telemetry clears the warning without refresh');
 await page.waitForFunction(()=>true);
 assert.deepEqual(posted,[1]);
 await page.getByRole('button',{name:'Disconnect USB',exact:true}).click();
 await page.getByRole('button',{name:'Connect ESP32',exact:true}).waitFor();
 assert.deepEqual(await page.evaluate(()=>[(window as any).fixture.opens,(window as any).fixture.closes]),[2,2]);
 assert.deepEqual(errors,[]);
 console.log('PASS: Chromium binary-noise fixture reopens the same port once, rejects corrupted input, resumes telemetry without page refresh and disconnects cleanly; not physical acceptance');
} finally {await browser.close();}
