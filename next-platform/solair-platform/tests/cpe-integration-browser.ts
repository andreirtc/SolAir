// TEST FIXTURE ONLY: intercepted API and Web Serial; no working database writes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { telemetrySchema } from '../packages/telemetry-contract';
import {mkdirSync,writeFileSync} from 'node:fs';

const baseUrl=process.env.TEST_URL||'http://127.0.0.1:3200';
assert.equal(new URL(baseUrl).port,'3200','This intercepted check is restricted to the isolated integration preview');
const browser = await chromium.launch({ headless: true, ...(process.env.SOLAIR_TEST_CHROMIUM ? { executablePath: process.env.SOLAIR_TEST_CHROMIUM } : {}) });
try {
  const page = await browser.newPage();
  const posted: number[] = [];
  let destinationAvailable = true;
  let releaseQueued!:()=>void, queuedStarted!:()=>void;
  const queuedHold=new Promise<void>(resolve=>{releaseQueued=resolve;});
  const queuedSeen=new Promise<void>(resolve=>{queuedStarted=resolve;});
  const pageErrors:string[]=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.addInitScript(`
    window.fixture = { commands: [], opens: 0, closes: 0 };
    Object.defineProperty(navigator, 'serial', { value: { requestPort: async () => ({
      open: async () => { window.fixture.opens++; }, close: async () => { window.fixture.closes++; },
      get readable() { return new ReadableStream({ start(c) { window.fixture.controller = c; } }); },
      writable: new WritableStream({ write(bytes) { window.fixture.commands.push(JSON.parse(new TextDecoder().decode(bytes))); } }),
    }) } });
    window.EventSource = class extends EventTarget { close() {} };
  `);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === '/api/me') body = { id: 'fixture', org_id: 'fixture', role: 'engineer', name: 'TEST FIXTURE',email:'fixture@test.invalid',notifications:0,notification_intro_pending:false };
    if (path === '/api/health') body = { environment: 'local development', server_time: new Date(Date.now() + 7200000).toISOString() };
    if (path === '/api/organization') body = { name: 'TEST FIXTURE' };
    if (path === '/api/fleet') body = [{ id: 'ET-01', device_id: 'SOL-ET-01', name: 'TEST FIXTURE',model:'BEMAC 68VM Passenger',nominal_voltage:48,nominal_capacity:10,solar_wh:null,wind_wh:null,driver_name:null,driver_id:null,image_url: '/bemac-white.png', telemetry: null, gps: null }];
    if (path === '/api/cpe-uplink/ET-01') {
      await route.fulfill({ status: destinationAvailable ? 200 : 503, json: destinationAvailable ? { url: 'https://fixture.example/api/ingest', reachable: true, temporary: true } : { error: 'TEST FIXTURE destination offline' } }); return;
    }
    if(path==='/api/battery/ET-01')body={quality:'unavailable',soc_pct:null,tte_minutes:null,reason:'TEST FIXTURE no verified current',tte_reason:'SOC unavailable',reference:null};
    if(path==='/api/research/ET-01')body={records:[],metrics:{weatherproofing:{completed:0},energy:{trials:[]},tamper:{n:0,tp:0,fp:0,fn:0,tn:0,accuracy:null,f1:null},forecasting:{n:0,mae_minutes:null,rmse_minutes:null},resilience:{latency:{n:0,median_ms:null,p95_ms:null},autonomy:[]}},recorded_energy:{channels:{solar:{wh:null},wind:{wh:null},battery:{wh:null}}}};
    if(path==='/api/setup-readiness')body={assignment_complete:true,tasks:[],sms_opted_in:false};
    if (path === '/api/ingest') {
      const frame=route.request().postDataJSON(),sequence=frame.sequence;posted.push(sequence);
      const ack={persisted:true,device_id:frame.device_id,boot_id:frame.boot_id,sequence};
      body={accepted:true,ack,backend_received_at:new Date().toISOString()};
      if(sequence===8){queuedStarted();await queuedHold;body={accepted:true,queued:true};}
      if(sequence===9)body={accepted:true,ack:{...ack,sequence:sequence+100}};
      if(sequence===10)body={accepted:true,ack:{...ack,persisted:false}};
      if(sequence===14){await route.fulfill({status:409,json:{error:'TEST FIXTURE conflicting acquisition'}});return;}
      if(sequence===15){await route.abort('failed');return;}
    }
    await route.fulfill({ json: body });
  });
  await page.goto(baseUrl);
  await page.getByLabel('Data mode').selectOption('hardware');
  await page.locator('.sidebar nav').getByRole('button', { name: 'CPE Lab', exact: false }).click();
  await page.getByRole('button', { name: 'Connect ESP32', exact: true }).click();
  await page.getByText('USB open · waiting for telemetry', { exact: false }).waitFor();
  const base = { schema_version: 1, device_id: 'SOL-ET-01', boot_id: 'TEST-FIXTURE-LTE-controls', sequence: 1, firmware_version: 'solair-cpe-2.0.3', device_uptime_ms: 100, source_type: 'hardware', transport: 'usb', sensor_health: {} };
  const push = async (frame: unknown) => page.evaluate(frame => { (window as any).fixture.controller.enqueue(new TextEncoder().encode(JSON.stringify(frame) + '\n')); }, telemetrySchema.parse(frame));
  await push(base);
  await page.getByText('Report #1', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Test LTE upload once', exact: true }).count(), 0);
  await push({ ...base, sequence: 2, firmware_version: 'solair-cpe-2.0.5/imu6500-compatible' });
  const once = page.getByRole('button', { name: 'Test LTE upload once', exact: true });
  await once.waitFor();
  assert.equal(await once.isDisabled(), true, 'An unconfigured firmware cannot start LTE');
  const cpe = {
    historical: false, load_mode: 'none', meter_source: 'unknown', mpu_raw: null,
    pzem: { quality: 'unavailable', voltage_v: null, current_a: null, power_w: null, energy_wh: null, alarm_high: null, alarm_low: null },
    acs: { quality: 'uncalibrated', current_a: null, adc_mv: null, zero_v: null, sensitivity_v_per_a: null },
    lte: { quality: 'ok', at_detected: true, registered: true, attached: true, rssi: 20, uplink_commissioned: true },
    gps: { quality: 'fault', hdop: null, checksum_failures: 0, software_uart_overflows: 0 },
    alarm: { commanded: false, output_level: null, feedback: null, reason: null, duration_ms: 5000 },
    queue_dropped: 0, lte_diagnostic: 'paused_use_LTE_ONCE_or_LTE_ON',
  };
  const responseDiagnostic = 'step=AT result=timeout rx=120 nul=1 binary=2 ppp_flags=1 boot=0 powerdown=0 numeric=0';
  await push({ ...base, schema_version: 2, sequence: 3, firmware_version: 'solair-cpe-2.0.13/imu6500-compatible', cpe: { ...cpe, lte_engine: 'esp32_ppp_tls', lte_at_diagnostic: responseDiagnostic } });
  await page.getByText('Report #3', { exact: false }).waitFor();
  await page.getByText('Modem command response: ' + responseDiagnostic, { exact: true }).waitFor();
  assert.equal(await once.isEnabled(), true);
  await page.getByLabel('Forward USB readings to server', { exact: true }).uncheck();
  await push({ ...base, schema_version: 2, sequence: 4, firmware_version: 'solair-cpe-2.0.8/imu6500-compatible', cpe });
  await page.getByText('Report #4', { exact: false }).waitFor();
  await page.getByText('USB monitor only · server forwarding off', { exact: true }).waitFor();
  assert.equal(posted.includes(4), false, 'Monitor-only USB frames must not be posted or relabeled as LTE');
  assert.deepEqual(await page.evaluate(() => [(window as any).fixture.opens, (window as any).fixture.closes]), [1, 0], 'Monitor-only mode keeps the same physical serial session');
  await once.click();
  await page.getByRole('button', { name: 'Start LTE streaming', exact: true }).click();
  await page.getByRole('button', { name: 'Stop LTE streaming', exact: true }).click();
  const commands = await page.evaluate(() => (window as any).fixture.commands);
  assert.deepEqual(commands.map((v: any) => v.command), ['lte_once', 'lte_start', 'lte_stop']);
  for (const c of commands.slice(0, 2)) assert.ok(Math.abs(c.utc_seconds - (Date.now() + 7200000) / 1000) < 10, 'Use backend UTC, even when it differs from the browser clock');
  assert.equal(commands[2].utc_seconds, undefined);
  await page.getByLabel('Forward USB readings to server', { exact: true }).check();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/ingest') && response.request().postDataJSON().sequence === 5);
  await push({ ...base, schema_version: 2, sequence: 5, firmware_version: 'solair-cpe-2.0.8/imu6500-compatible', cpe });
  assert.equal((await resumed).status(), 200);
  assert.equal(posted.includes(5), true, 'Explicitly re-enabling forwarding resumes USB ingestion');
  assert.equal(await page.getByRole('button', { name: 'Update LTE address', exact: true }).count(), 0, 'Old firmware has no destination command');
  await push({ ...base, schema_version: 2, sequence: 6, firmware_version: 'solair-cpe-2.0.14/imu6500-compatible', cpe: { ...cpe, lte_endpoint: 'https://expired.example/api/ingest', lte_endpoint_saved: false } });
  const sync = page.getByRole('button', { name: 'Update LTE address', exact: true });
  await sync.click();
  await page.getByRole('button', { name: 'Waiting for saved LTE address…', exact: true }).waitFor();
  assert.equal(await once.isDisabled(), true, 'A USB write alone is not a device save acknowledgement');
  const destinationCommands = await page.evaluate(() => (window as any).fixture.commands.filter((v: any) => v.command === 'lte_set_endpoint'));
  assert.deepEqual(destinationCommands, [{ command: 'lte_set_endpoint', url: 'https://fixture.example/api/ingest' }]);
  await push({ ...base, schema_version: 2, sequence: 7, firmware_version: 'solair-cpe-2.0.14/imu6500-compatible', cpe: { ...cpe, lte_endpoint: 'https://fixture.example/api/ingest', lte_endpoint_saved: true } });
  await sync.waitFor();
  assert.equal(await once.isEnabled(), true);
  destinationAvailable = false;
  await sync.click();
  await page.getByText('TEST FIXTURE destination offline', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => (window as any).fixture.commands.filter((v: any) => v.command === 'lte_set_endpoint').length), 1, 'An unavailable backend must not change the device destination');
  // A local frame remains distinct from pending, queued or incorrectly matched storage responses.
  const stateFrame=(sequence:number,state:'DISARMED'|'ARMED'|'TRIGGERED',active=false)=>({...base,schema_version:2,sequence,firmware_version:'solair-cpe-2.0.19/imu6500-compatible',device_timestamp:new Date().toISOString(),armed:state!=='DISARMED',security_state:state,alarm_active:active,cpe:{...cpe,alarm:{...cpe.alarm,commanded:active,output_level:active?1:0,reason:state==='TRIGGERED'?'lid':null}}});
  const storage=page.getByTestId('usb-storage-status');
  await push(stateFrame(8,'DISARMED'));await queuedSeen;
  await page.getByText('Report #8',{exact:false}).waitFor();
  assert.match(await storage.innerText(),/no matching storage acknowledgement yet/);
  assert.doesNotMatch(await storage.innerText(),/Last acknowledged USB report #8/);
  releaseQueued();
  await page.getByRole('alert').filter({hasText:'Server has not acknowledged this USB frame as accepted storage'}).waitFor();
  await push(stateFrame(9,'ARMED'));await page.getByText('Report #9',{exact:false}).waitFor();
  await page.getByRole('alert').filter({hasText:'Server has not acknowledged this USB frame as accepted storage'}).waitFor();
  assert.doesNotMatch(await storage.innerText(),/Last acknowledged USB report #9/);
  await push(stateFrame(10,'ARMED'));await page.getByText('Report #10',{exact:false}).waitFor();
  await page.getByRole('alert').filter({hasText:'Server has not acknowledged this USB frame as accepted storage'}).waitFor();
  assert.doesNotMatch(await storage.innerText(),/Last acknowledged USB report #10/);
  await push(stateFrame(11,'TRIGGERED',true));
  await storage.filter({hasText:'Last acknowledged USB report #11'}).waitFor();
  await page.locator('p').filter({hasText:/^Security: TRIGGERED/}).waitFor();
  await push(stateFrame(12,'TRIGGERED',false));
  await storage.filter({hasText:'Last acknowledged USB report #12'}).waitFor();
  await page.locator('p').filter({hasText:/^Security: TRIGGERED/}).waitFor();
  await page.getByText(/Alarm command false.*physical feedback not instrumented/).waitFor();
  await page.getByRole('button',{name:'Disarm bench',exact:true}).click();
  await page.waitForFunction(()=> (window as any).fixture.commands.some((v:any)=>v.command==='disarm'));
  assert.equal(await page.locator('p').filter({hasText:/^Security: TRIGGERED/}).count(),1,'A USB command write is not device acknowledgement');
  await page.getByLabel('Forward USB readings to server',{exact:true}).uncheck();
  await push(stateFrame(13,'DISARMED'));await page.getByText('Report #13',{exact:false}).waitFor();
  await page.locator('p').filter({hasText:/^Security: DISARMED/}).waitFor();
  assert.equal(posted.includes(13),false);
  assert.match(await storage.innerText(),/Last acknowledged USB report #12/);
  assert.match(await storage.innerText(),/displayed USB report has no matching storage acknowledgement/);
  assert.match(await storage.innerText(),/USB forwarding is OFF/);
  await page.getByLabel('Forward USB readings to server',{exact:true}).check();
  await push(stateFrame(14,'DISARMED'));await page.getByText('Report #14',{exact:false}).waitFor();
  await page.getByRole('alert').filter({hasText:'TEST FIXTURE conflicting acquisition'}).waitFor();
  assert.match(await storage.innerText(),/Last acknowledged USB report #12/);
  assert.doesNotMatch(await storage.innerText(),/Last acknowledged USB report #14/);
  await push(stateFrame(15,'DISARMED'));await page.getByText('Report #15',{exact:false}).waitFor();
  await page.getByRole('alert').filter({hasText:'SOLAIR could not be reached'}).waitFor();
  assert.match(await storage.innerText(),/Last acknowledged USB report #12/);
  assert.doesNotMatch(await storage.innerText(),/Last acknowledged USB report #15/);
  await page.getByLabel('Forward USB readings to server',{exact:true}).uncheck();
  const gpsFrame=(sequence:number,device_timestamp:string|null,hdop=1)=>({...stateFrame(sequence,'DISARMED'),device_timestamp,gps_fix:true,gps_fix_age_ms:100,satellites:8,latitude:14.6,longitude:121,cpe:{...cpe,gps:{...cpe.gps,quality:'ok',hdop,last_byte_age_ms:50}}});
  await push(gpsFrame(16,new Date().toISOString()));
  await page.getByText('GPS reception: Fresh position reported.',{exact:true}).waitFor();
  await push(gpsFrame(17,new Date(Date.now()-15000).toISOString()));
  await page.getByText('GPS reception: Position is stale or has low quality; map retains the last reliable position.',{exact:true}).waitFor();
  await push(gpsFrame(18,null));
  await page.getByText('GPS reception: Position time is unknown or invalid; map retains the last reliable position.',{exact:true}).waitFor();
  await push(gpsFrame(19,new Date().toISOString(),9));
  await page.getByText('GPS reception: Position is stale or has low quality; map retains the last reliable position.',{exact:true}).waitFor();
  assert.equal(posted.some(sequence=>sequence>=16),false,'GPS diagnostic observations stay monitor-only');
  assert.match(await page.getByLabel('CPE sensor report').innerText(),/ACS calibrated current\s+— A/);
  assert.equal(await page.getByRole('heading',{name:'Battery forecasting awaits validated data'}).count(),0);
  assert.equal(await page.getByLabel('Battery percentage and time to empty').count(),1);
  assert.deepEqual(pageErrors,[]);
  mkdirSync('test-results/integration',{recursive:true});
  await page.screenshot({path:'test-results/integration/cpe-fixture.png',fullPage:true});
  writeFileSync('test-results/integration/cpe-browser.json',JSON.stringify({checked_at:new Date().toISOString(),url:baseUrl,fixture_only:true,real_database_writes:false,physical_acceptance:false,results:['USB forwarding OFF prevents ingest','LTE controls use backend time and await saved-device endpoint','local RX and queued/mismatched/unpersisted/rejected/failed responses do not become accepted storage','TRIGGERED stays latched after siren-command cutoff','requested DISARM is separate from next device report','canonical ACS current stays unavailable','fresh GPS is separate from stale/unknown-time/poor-quality fixes','SOC/TTE component replaces old placeholder'],page_errors:pageErrors},null,2)+'\n');
  await page.getByRole('button', { name: 'Disconnect USB', exact: true }).click();
  assert.ok(await once.count() === 0 || await once.isDisabled());
  console.log('PASS: combined CPE fixture: USB monitor-only, acknowledged storage tuples, LTE endpoint save/UTC, latched FSM and separate physical feedback; no real database or hardware writes');
} finally { await browser.close(); }
