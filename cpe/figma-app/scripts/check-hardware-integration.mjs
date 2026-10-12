import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDeviceReceiver } from '../backend/device-receiver.mjs';
import { createDiagnosticSimulator } from '../backend/diagnostics.mjs';
import { createBackend } from '../backend/server.mjs';
import { parseDiagnosticSnapshot } from '../src/app/data/diagnosticsV2.ts';
import { createTestOperator, testLogin } from './auth-test-client.mjs';

// Software fixtures only. No physical ESP32, production databases or login bypass.
const directory = mkdtempSync(join(tmpdir(), 'solair-hardware-'));
const token = randomBytes(32).toString('hex');
let clock = Date.now(), receiver, backend, ingress, server, injection;
const listen = async app => { const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); return server; };
const closeServer = async server => { if (server) { server.closeAllConnections(); await new Promise(r => server.close(r)); } };
try {
  const devicePath = join(directory, 'device.sqlite'), authPath = join(directory, 'auth.sqlite');
  const credentials = await createTestOperator(authPath);
  const foreign = await createTestOperator(authPath, 'foreign', 'OTHER');
  const options = { databasePath: devicePath, deviceId: 'ET-01', token, now: () => clock, provenance: 'TEST FIXTURE' };
  receiver = createDeviceReceiver(options); ingress = await listen(receiver.app);
  const ingressUrl = `http://127.0.0.1:${ingress.address().port}/ingest`;
  const publish = (message, credential = token, extra = {}) => fetch(ingressUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credential}`, ...extra }, body: JSON.stringify(message) });
  const sim = createDiagnosticSimulator({ deviceId: 'ET-01', now: () => clock, schedule: () => 1, cancel: () => {} });
  sim.action('start'); sim.action('lid-closed'); sim.action('mount-attached');
  const boot = { ...sim.snapshot().state.heartbeat.message, source: 'device', firmwareVersion: 'SOFTWARE-TEST-NOT-PHYSICAL' };
  assert.equal((await publish(boot, 'wrong')).status, 403);
  assert.equal((await publish(boot, token, { Origin: 'http://evil.example' })).status, 403);
  assert.equal((await publish({ ...boot, source: 'simulated' })).status, 409);
  assert.equal((await publish(boot)).status, 202);
  const receipt = receiver.snapshot().state.heartbeat.receivedAtUtc;
  clock += 3000;
  assert.equal((await publish(boot)).status, 202); // lost-ack retry
  assert.equal(receiver.snapshot().state.acceptedCount, 1);
  assert.equal(receiver.snapshot().state.heartbeat.receivedAtUtc, receipt);
  const heartbeat = { ...boot, sequence: 1, uptimeMs: 3000 };
  assert.equal((await publish(heartbeat)).status, 202);
  const fixture = { ...sim.snapshot().state.heartbeat.message };
  const sensor = { ...fixture, source: 'device', firmwareVersion: boot.firmwareVersion, messageType: 'sensor_telemetry', uptimeMs: 3000, readStartUptimeMs: 2999, readEndUptimeMs: 3000,
    accelerationMps2: { x: 0, y: 0, z: 9.80665 }, angularVelocityRadPerSec: { x: 0, y: 0, z: 0 }, imuStatus: 'VALID', imuFaultCode: null, axisFrame: 'MPU6050_CHIP', calibrationRef: null,
    lidState: 'CLOSED', mountState: 'ATTACHED', switchStatus: 'VALID', switchFaultCode: null, securityState: 'ARMED', batteryVoltageV: null, batterySocPercent: null, timeToEmptySeconds: null, solarPowerW: null, windPowerW: null, latitudeDeg: null, longitudeDeg: null, gpsFixValid: null, speedKmh: null, electromagneticBrakeActive: null };
  assert.equal((await publish(sensor)).status, 202);
  let before = receiver.snapshot();
  assert.equal(before.state.sensor.message.accelerationMps2.x, 0);
  assert.equal(before.state.sensor.message.batteryVoltageV, null);
  assert.equal((await publish({ ...sensor, sequence: 1, extra: 1 })).status, 409);
  assert.deepEqual(receiver.snapshot(), before);
  const event = { ...boot, messageType: 'tamper_event', sequence: 0, uptimeMs: 3500, eventType: 'LID_OPEN_DETECTED', detectorVersion: 'SOFTWARE-TEST', securityState: 'TRIGGERED', evidenceTelemetrySequence: null };
  assert.equal((await publish(event)).status, 202);
  assert.equal(receiver.history().length, 1);
  before = receiver.snapshot();
  // Force a transaction failure after record INSERT: both record and state roll back.
  injection = new DatabaseSync(devicePath);
  injection.exec("CREATE TRIGGER fail_state BEFORE UPDATE ON device_state BEGIN SELECT RAISE(ABORT,'fixture write failure'); END;");
  assert.equal((await publish({ ...sensor, sequence: 1, uptimeMs: 6000, readEndUptimeMs: 6000 })).status, 503);
  assert.deepEqual(receiver.snapshot(), before);
  assert.equal(injection.prepare('SELECT COUNT(*) AS n FROM device_messages').get().n, 4);
  injection.exec('DROP TRIGGER fail_state'); injection.close(); injection = undefined;
  const hosts = [];
  backend = createBackend({ deviceReceiver: receiver, databasePath: join(directory, 'telemetry.sqlite'), authDatabasePath: authPath, allowedHosts: hosts, startPaused: true, localDevelopment: true });
  server = await listen(backend.app); hosts.push(`127.0.0.1:${server.address().port}`);
  const base = `http://${hosts[0]}`;
  assert.equal((await fetch(base + '/api/diagnostics/events')).status, 401);
  const denied = await testLogin(base, foreign);
  assert.equal((await fetch(base + '/api/diagnostics/events', { headers: denied })).status, 403);
  const headers = await testLogin(base, credentials);
  const latest = await (await fetch(base + '/api/diagnostics/latest', { headers })).json();
  parseDiagnosticSnapshot(latest, 'ET-01'); assert.equal(latest.mode, 'device');
  const stream = await fetch(base + '/api/diagnostics/stream', { headers });
  const reader = stream.body.getReader(); const frame = await reader.read();
  assert.match(new TextDecoder().decode(frame.value), /"mode":"device"/);
  const records = await (await fetch(base + '/api/diagnostics/events', { headers })).json(); assert.equal(records.events.length, 1);
  assert.equal((await fetch(base + '/api/diagnostics/simulator/start', { method: 'POST', headers: { ...headers, Origin: 'http://127.0.0.1:5173' } })).status, 409);
  await reader.cancel(); backend.close(); backend = undefined; await closeServer(server); server = undefined;
  await closeServer(ingress); ingress = undefined; receiver.close();
  receiver = createDeviceReceiver(options);
  assert.deepEqual(receiver.snapshot(), before); // original receipts and ordering survive restart
  assert.equal(receiver.history().length, 1);
  const nextBoot = { ...boot, sessionId: randomUUID(), uptimeMs: 1 };
  assert.equal(receiver.accept(nextBoot).status, 202);
  assert.equal(receiver.snapshot().state.lastValidImu, null);
  assert.equal(receiver.accept({ ...sensor, sequence: 2 }).status, 409); // old boot
  sim.close();
} finally {
  injection?.close(); backend?.close(); await closeServer(server); await closeServer(ingress); receiver?.close();
  rmSync(directory, { recursive: true, force: true });
}
console.log('PASS hardware integration SOFTWARE FIXTURES: token/origin rejection, validation, null/zero, atomic rollback, idempotent delivery, real operator login/device ACL, SSE, durable events/restart/order. Hardware tests NOT performed.');
