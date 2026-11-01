import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { Store } from '../server/db';
import { PostgresTestStore } from './postgres-store';
import { seed } from '../server/seed';
import { createApp } from '../server/app';
import { lteDestinationFromEnvironment } from '../server/lte-destination';
import { telemetrySchema } from '../packages/telemetry-contract';

test('TEST FIXTURE: token-authenticated LTE moves the authorized live fleet through SSE and survives fix loss/retry/restart', {timeout: 30000}, async () => {
  const db = process.env.SOLAIR_TEST_POSTGRES === '1' ? new PostgresTestStore() : new Store(':memory:');
  let base = '';
  const destination = lteDestinationFromEnvironment(true, {SOLAIR_PUBLIC_URL: 'https://solair.example'},
    (async (url, init) => {
      assert.equal(url, 'https://solair.example/api/ingest');
      return fetch(base + '/api/ingest', init);
    }) as typeof fetch);
  const app = createApp(db, false, null, {lteDestination: destination});
  const server = createServer(app);
  const subscriptions: AbortController[] = [];
  try {
    await db.migrate(); await seed(db);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    base = `http://127.0.0.1:${address.port}`;
    const cookies: Record<string, string> = {};
    for (const role of ['engineer', 'driver', 'operator', 'outsider']) {
      const response = await fetch(base + '/api/login', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: `${role}@solair.local`, password: 'SolairDemo!2026'})});
      assert.equal(response.status, 200);
      cookies[role] = response.headers.get('set-cookie')!.split(';')[0];
    }
    const uplink = await fetch(base + '/api/cpe-uplink/ET-01', {headers: {Cookie: cookies.engineer}});
    assert.equal(uplink.status, 200);
    assert.equal((await uplink.json()).temporary, false, 'Actual application accepts credential-free reachability probes');
    const provisioned = await fetch(base + '/api/devices/provision', {method: 'POST',
      headers: {Cookie: cookies.engineer, 'Content-Type': 'application/json'}, body: JSON.stringify({vehicle_id: 'ET-01'})});
    assert.equal(provisioned.status, 200);
    const {device_token: token} = await provisioned.json();
    assert.ok(token);
    const stream = async (role: string) => {
      const controller = new AbortController(); subscriptions.push(controller);
      const response = await fetch(base + '/api/events', {headers: {Cookie: cookies[role]}, signal: controller.signal});
      assert.equal(response.status, 200);
      let text = '';
      const reader = response.body!.getReader(); const decoder = new TextDecoder();
      const drain = (async () => {try {
        for (;;) {const chunk = await reader.read(); if (chunk.done) break; text += decoder.decode(chunk.value, {stream: true});}
      } catch (error) {if (!controller.signal.aborted) throw error;}})();
      // Attach rejection handling immediately; failures remain visible to waits.
      let failure: unknown; void drain.catch(error => {failure = error;});
      const wait = async (pattern: RegExp) => {
        const until = Date.now() + 3000;
        while (!pattern.test(text) && !failure && Date.now() < until) await delay(10);
        if (failure) throw failure;
        assert.match(text, pattern);
      };
      await wait(/event: ready/);
      return {wait, text: () => text, close: async () => {controller.abort(); await drain;}};
    };
    const operator = await stream('operator'), outsider = await stream('outsider');
    const epoch = Date.now();
    const frame = (sequence: number) => telemetrySchema.parse({
      schema_version: 2, device_id: 'SOL-ET-01', firmware_version: 'TEST FIXTURE/2.0.18',
      boot_id: 'TEST-FIXTURE-LTE-live', sequence, device_uptime_ms: sequence * 2000,
      device_timestamp: new Date(epoch + sequence).toISOString(), source_type: 'hardware', transport: 'lte',
      sensor_health: {gps: 'ok', acs758: 'uncalibrated'},
      gps_fix: true, latitude: Number((14.61 + sequence / 10000).toFixed(6)), longitude: 121,
      gps_fix_age_ms: 250, satellites: 8,
      cpe: {
        historical: false, meter_source: 'unknown', load_mode: 'unknown', mpu_raw: null, queue_dropped: 0,
        pzem: {quality: 'unavailable', voltage_v: null, current_a: null, power_w: null, energy_wh: null, alarm_high: null, alarm_low: null},
        acs: {quality: 'uncalibrated', current_a: null, adc_mv: 1164.125, zero_v: null, sensitivity_v_per_a: null},
        lte: {quality: 'ok', at_detected: true, registered: true, attached: true, rssi: 20, uplink_commissioned: true},
        gps: {quality: 'ok', hdop: 1.1, checksum_failures: 0, software_uart_overflows: 0, last_byte_age_ms: 100},
        alarm: {commanded: false, output_level: null, feedback: null, reason: null, duration_ms: 5000},
      },
    });
    const post = (body: unknown, bearer = token) => fetch(base + '/api/ingest', {method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${bearer}`}, body: JSON.stringify(body)});
    const fleet = async (role = 'driver') => {
      const response = await fetch(base + '/api/fleet', {headers: {Cookie: cookies[role]}});
      assert.equal(response.status, 200);
      return (await response.json()).find((v: {id: string}) => v.id === 'ET-01');
    };
    assert.equal((await post(frame(1), 'TEST-FIXTURE-wrong-token')).status, 401);
    assert.equal((await post(frame(1))).status, 201);
    await operator.wait(/event: update/);
    assert.ok(!outsider.text().includes('event: update'), 'No other-organization invalidation');
    assert.ok(!operator.text().includes('14.61'), 'SSE carries invalidations, not private location payloads');
    assert.equal((await fleet()).telemetry.transport, 'lte');
    assert.equal((await fleet()).telemetry.cpe.acs.current_a, null, 'Uncalibrated current does not block independent GPS');
    const moved = frame(2);
    assert.equal((await post(moved)).status, 201);
    assert.equal((await fleet()).gps.latitude, moved.latitude);
    assert.equal((await fleet('operator')).gps.latitude, moved.latitude);
    assert.equal(await fleet('outsider'), undefined);
    assert.equal((await post(moved)).status, 200, 'Lost acknowledgement retries are idempotent');
    assert.equal((await db.query('SELECT id FROM telemetry WHERE boot_id=?', [moved.boot_id])).length, 2);
    const noFix = {...frame(3), gps_fix: false, latitude: null, longitude: null, satellites: 0};
    assert.equal((await post(noFix)).status, 201);
    assert.equal((await fleet()).telemetry.gps_fix, false);
    assert.equal((await fleet()).gps.latitude, moved.latitude, 'Loss of fix retains last known position');
    const historical = {...frame(0), event_id: 'TEST-FIXTURE-recovered-event', event_type: 'lid',
      cpe: {...frame(0).cpe!, historical: true}};
    assert.equal((await post(historical)).status, 201);
    assert.equal((await fleet()).telemetry.sequence, 3, 'Delayed event cannot refresh live tracking');
    assert.equal((await fleet()).gps.latitude, moved.latitude);
    const recovered = {...frame(1), boot_id: 'TEST-FIXTURE-LTE-after-reset',
      latitude: 14.62, device_timestamp: new Date(epoch + 10).toISOString()};
    assert.equal((await post(recovered)).status, 201, 'New boot accepts reset sequence');
    assert.equal((await fleet()).gps.latitude, recovered.latitude);
    assert.equal((await fetch(base + '/api/fleet')).status, 401);
    await operator.close(); await outsider.close();
  } finally {
    for (const controller of subscriptions) controller.abort();
    server.closeAllConnections();
    if (server.listening) await new Promise<void>(resolve => server.close(() => resolve()));
    await db.close();
  }
});
