// Software fixtures only. No actual USB device, server, or database is touched.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const browser = await chromium.launch({ headless: true,
  ...(process.env.SOLAIR_TEST_CHROMIUM ? { executablePath: process.env.SOLAIR_TEST_CHROMIUM } : {}) });
const evidence = process.env.SOLAIR_TEST_EVIDENCE || 'docs/cpe-evidence/2026-10-25-assembly-reader';
try {
  await mkdir(evidence, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors: string[] = [];
  const network: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await page.clock.install();
  await page.addInitScript(`{
    const w = window;
    w.fixtureWrites = []; w.fixtureClosed = 0;
    Object.defineProperty(navigator, 'serial', { value: { requestPort: async () => ({
      open: async (options) => { w.fixtureBaud = options.baudRate; },
      close: async () => { w.fixtureClosed++; }, setSignals: async () => {},
      readable: new ReadableStream({ start(controller) { w.fixtureController = controller; } }),
      writable: new WritableStream({ write(bytes) { w.fixtureWrites.push(new TextDecoder().decode(bytes)); } }),
    }) } });
  }`);
  await page.goto(pathToFileURL(path.resolve('public/SOLAIR_ASSEMBLY_MONITOR.html')).href);
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => window.isSecureContext), true);
  await page.getByRole('button', { name: 'Connect ESP32' }).click();
  await page.getByText('USB open · waiting for a complete hardware report', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => (window as any).fixtureBaud), 115200);
  assert.deepEqual(await page.evaluate(() => (window as any).fixtureWrites), []);
  const base = {
    schema_version: 2, device_id: 'SOL-ET-01', boot_id: 'TEST-FIXTURE-ASSEMBLY', sequence: 1,
    firmware_version: 'solair-cpe-2.0.19/imu6500-compatible', device_uptime_ms: 2000,
    source_type: 'hardware', transport: 'usb', sensor_health: { acs758: 'uncalibrated', mpu6050: 'absent', mpu6500_compatible: 'ok' },
    lid_state: 'secure', mount_state: 'secure', lid_raw: 0, mount_raw: 0,
    accelerometer: [0, 0, 9.81], gyroscope: [0, 0, 0], acs_output_v: 1.9,
    cpe: { historical: false, imu_diagnostic: 'imu6500_compatible', mpu_raw: null,
      meter_source: 'bench_supply', load_mode: 'bench_resistor',
      pzem: { quality: 'ok', voltage_v: 12.22, current_a: 0.12, power_w: 1.4, energy_wh: 3, alarm_high: false, alarm_low: false },
      acs: { quality: 'uncalibrated', current_a: null, adc_mv: 950, zero_v: 2.34, sensitivity_v_per_a: 0.04,
        adc_source: 'ads1115_a1', adc_diagnostic: 'ok_A1_config_0xD383_verified', adc_raw: 7600, adc_age_ms: 20 },
      lte: { quality: 'fault', at_detected: true, registered: true, attached: true, rssi: 20, uplink_commissioned: false },
      lte_diagnostic: 'PPP_TLS_verification_or_handshake_failed', lte_http_status: -1,
      lte_endpoint: 'https://redact.example.com/api/ingest',
      gps: { quality: 'unavailable', hdop: null, checksum_failures: 0, software_uart_overflows: 0,
        chars_processed: 100, sentences_passed: 3, last_byte_age_ms: 200 },
      alarm: { commanded: false, output_level: 0, feedback: null, reason: null, duration_ms: 5000 }, queue_dropped: 0 },
  };
  const push = (frame: unknown, fragmented = false) => page.evaluate(({ frame, fragmented }) => {
    const bytes = new TextEncoder().encode(JSON.stringify(frame) + '\n');
    if (fragmented) {
      (window as any).fixtureController.enqueue(bytes.slice(0, 37));
      (window as any).fixtureController.enqueue(bytes.slice(37));
    } else (window as any).fixtureController.enqueue(bytes);
  }, { frame, fragmented });
  await push(base, true);
  await page.getByText('LIVE USB · report #1', { exact: false }).waitFor();
  assert.match(await page.locator('#acs-reading').innerText(), /Current not validated/);
  assert.match(await page.locator('#ads-reading').innerText(), /950.000 mV/);
  assert.match(await page.locator('#pzem-reading').innerText(), /12.22 V · 0.12 A/);
  assert.match(await page.locator('#lte-reading').innerText(), /Server delivery is not verified/);
  assert.equal(await page.getByText('-11.00 A', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', {name:'Arm bench',exact:true}).isDisabled(), true);
  assert.equal(await page.getByRole('button', {name:'Enable standalone arming · 2.0.20',exact:true}).isDisabled(), true);
  await push({ ...base, sequence: 2, lid_state: 'tampered', lid_raw: 1 });
  await page.getByText('LIVE USB · report #2', { exact: false }).waitFor();
  assert.equal(await page.locator('#lid-status').innerText(), 'tampered');
  assert.equal(await page.locator('#mount-status').innerText(), 'secure');
  await push({ ...base, sequence: 3, event_id: 'fixture-event', event_type: 'lid', cpe: { ...base.cpe, historical: true } });
  await page.getByText('Ignored historical', { exact: false }).waitFor({ state: 'attached' });
  assert.match(await page.locator('#connection').innerText(), /report #2/);
  await push({ ...base, sequence: 3, cpe: { ...base.cpe,
    acs: { ...base.cpe.acs, adc_diagnostic: 'ok_A1_config_0xC383_verified' } } });
  await page.getByText('Invalid telemetry line rejected', { exact: false }).waitFor({ state: 'attached' });
  assert.match(await page.locator('#connection').innerText(), /report #2/);
  await page.getByRole('button', { name: 'Test LED only' }).click();
  await page.getByRole('button', { name: 'Disarm / output OFF' }).click();
  assert.deepEqual(await page.evaluate(() => (window as any).fixtureWrites.map((s: string) => JSON.parse(s))),
    [{ command: 'led_test' }, { command: 'disarm' }]);
  await push({ ...base, sequence: 4, cpe: { ...base.cpe,
    acs: { ...base.cpe.acs, quality: 'fault', adc_mv: null, adc_raw: null, adc_age_ms: null, adc_diagnostic: 'ADS1115_unavailable' },
    pzem: { quality: 'fault', voltage_v: null, current_a: null, power_w: null, energy_wh: null,
      alarm_high: null, alarm_low: null } } });
  await page.getByText('LIVE USB · report #4', { exact: false }).waitFor();
  assert.doesNotMatch(await page.locator('#pzem-reading').innerText(), /12.22/);
  assert.doesNotMatch(await page.locator('#ads-reading').innerText(), /950.000/);
  await push({ ...base, sequence: 5, device_uptime_ms: 12000, firmware_version:'solair-cpe-2.0.20/imu6500-compatible' });
  await page.getByText('LIVE USB · report #5', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', {name:'Arm bench',exact:true}).isDisabled(), false);
  await page.getByRole('button', {name:'Arm bench',exact:true}).click();
  await page.getByRole('button', {name:'Disarm / output OFF',exact:true}).click();
  assert.deepEqual(await page.evaluate(() => (window as any).fixtureWrites.slice(-2).map((s: string)=>JSON.parse(s))), [{command:'arm'},{command:'disarm'}]);
  await page.getByRole('button', {name:'Enable standalone arming · 2.0.20',exact:true}).click();
  await page.getByRole('button', {name:'Pause LTE for ACS test',exact:true}).click();
  assert.deepEqual(await page.evaluate(() => (window as any).fixtureWrites.slice(-2).map((s: string)=>JSON.parse(s))), [{command:'standalone_arm'},{command:'lte_stop'}]);
  await push({ ...base, sequence: 6, device_uptime_ms: 12000,
    firmware_version: 'solair-cpe-2.0.20/imu6500-compatible/lid-only', mount_state: null, mount_raw: null });
  await page.getByText('LIVE USB · report #6', { exact: false }).waitFor();
  assert.equal(await page.locator('#mount-status').innerText(), 'disabled');
  assert.equal(await page.getByRole('button', {name:'Arm bench',exact:true}).isDisabled(), false);
  assert.equal(await page.getByRole('button', {name:'Enable standalone arming · 2.0.20',exact:true}).isDisabled(), false);
  await push({ ...base, sequence: 7, device_uptime_ms: 12000,
    firmware_version: 'solair-cpe-2.0.20/imu6500-compatible/lid-only', mount_state: null, mount_raw: null,
    lid_state: 'tampered', lid_raw: 1 });
  await page.getByText('LIVE USB · report #7', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', {name:'Arm bench',exact:true}).isDisabled(), true);
  await page.screenshot({ path: `${evidence}/desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: `${evidence}/mobile.png`, fullPage: true });
  await page.clock.fastForward(11000);
  assert.match(await page.locator('#connection').innerText(), /STALE/);
  assert.equal(await page.locator('#pzem-reading').innerText(), '—');
  assert.equal(await page.getByRole('button', { name: 'Test LED only' }).isDisabled(), true);
  assert.equal(await page.getByRole('button', {name:'Arm bench',exact:true}).isDisabled(), true);
  assert.equal(await page.getByRole('button', {name:'Disarm / output OFF',exact:true}).isDisabled(), false);
  await page.getByRole('button', {name:'Disarm / output OFF',exact:true}).click();
  assert.equal(await page.evaluate(() => JSON.parse((window as any).fixtureWrites.at(-1)).command),'disarm');
  // Duplicate frames do not refresh liveness.
  await push({ ...base, sequence: 5, device_uptime_ms: 12000, firmware_version:'solair-cpe-2.0.20/imu6500-compatible' });
  await page.getByText('Ignored duplicate/out-of-order', { exact: false }).waitFor({ state: 'attached' });
  assert.match(await page.locator('#connection').innerText(), /STALE/);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save USB report' }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const saved = Buffer.concat(chunks).toString();
  const report = JSON.parse(saved);
  assert.equal(report.live_at_export, false);
  assert.match(report.evidence_type, /not a physical acceptance/);
  assert.doesNotMatch(saved, /redact.example.com|lte_endpoint/);
  assert.equal(report.accepted_reports, 6);
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await page.getByText('Disconnected — readings are not live', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => (window as any).fixtureClosed), 1);
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  await writeFile(`${evidence}/verification.json`, JSON.stringify({ software_fixtures_only: true,
    result: 'passed', physical_acceptance: 'not tested', offline_file_secure_context: true,
    checks: ['fragmented 2.0.19 USB frame', 'no automatic commands', 'switch change', 'uncalibrated ACS invalid',
      'lid-only mount-null arm allowed and open lid arm rejected', 'bad ADS config rejected', 'historical and duplicate frames ignored', 'fault/stale readings cleared',
      'explicit LED/guarded ARM/disarm; disarm retained on stale reports', 'download redaction', 'port closure', 'mobile containment', 'zero network requests'],
    browser_errors: errors }, null, 2));
  console.log('PASS: offline assembly reader browser fixtures; no physical acceptance claimed.');
} finally { await browser.close(); }
