// TEST FIXTURE ONLY: intercepted API and Web Serial; no working database writes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { telemetrySchema } from '../packages/telemetry-contract';

const browser = await chromium.launch({ headless: true, ...(process.env.SOLAIR_TEST_CHROMIUM ? { executablePath: process.env.SOLAIR_TEST_CHROMIUM } : {}) });
try {
  const page = await browser.newPage();
  const posted: number[] = [];
  let destinationAvailable = true;
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
    if (path === '/api/me') body = { id: 'fixture', org_id: 'fixture', role: 'engineer', name: 'TEST FIXTURE' };
    if (path === '/api/health') body = { environment: 'local development', server_time: new Date(Date.now() + 7200000).toISOString() };
    if (path === '/api/organization') body = { name: 'TEST FIXTURE' };
    if (path === '/api/fleet') body = [{ id: 'ET-01', device_id: 'SOL-ET-01', name: 'TEST FIXTURE', image_url: '/bemac-white.png', telemetry: null, gps: null }];
    if (path === '/api/cpe-uplink/ET-01') {
      await route.fulfill({ status: destinationAvailable ? 200 : 503, json: destinationAvailable ? { url: 'https://fixture.example/api/ingest', reachable: true, temporary: true } : { error: 'TEST FIXTURE destination offline' } }); return;
    }
    if (path === '/api/ingest') { posted.push(route.request().postDataJSON().sequence); body = { accepted: true }; }
    await route.fulfill({ json: body });
  });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3000');
  await page.getByLabel('Data mode').selectOption('hardware');
  await page.getByRole('button', { name: 'CPE Lab', exact: false }).click();
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
  await page.getByRole('button', { name: 'Disconnect USB', exact: true }).click();
  assert.ok(await once.count() === 0 || await once.isDisabled());
  console.log('PASS: TEST FIXTURE LTE controls require supported/configured firmware and USB; monitor-only mode keeps serial readings/commands without forwarding, forwarding can resume, controls disable after disconnect; no modem or database write');
} finally { await browser.close(); }
