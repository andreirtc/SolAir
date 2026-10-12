import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBackend } from '../backend/server.mjs';
import { createDiagnosticSimulator } from '../backend/diagnostics.mjs';
import { validateDiagnosticMessage, receiveDiagnostic, emptyDiagnostics, diagnosticFreshness, parseDiagnosticSnapshot, EVENT_LIMIT } from '../src/app/data/diagnosticsV2.ts';
import { createTestOperator, testLogin } from './auth-test-client.mjs';

// Fake clocks and intervals; HTTP/SSE tests still use real operator login.
let clock = 0, id = 0;
const timers = new Map();
const schedule = (fn, delay) => { timers.set(++id, { fn, delay, next: clock + delay }); return id; };
const cancel = key => timers.delete(key);
const advance = ms => {
  const end = clock + ms;
  for (;;) {
    const due = [...timers.values()].filter(t => t.next <= end).sort((a, b) => a.next - b.next)[0];
    if (!due) break;
    clock = due.next; due.next += due.delay; due.fn();
  }
  clock = end;
};
const sim = createDiagnosticSimulator({ deviceId: 'ET-01', now: () => clock, schedule, cancel });
assert.equal(sim.snapshot().running, false); assert.equal(timers.size, 0);
sim.action('start'); assert.equal(timers.size, 2);
const initial = sim.snapshot().state;
assert.equal(initial.heartbeat.message.sequence, 0); assert.equal(initial.sensor, null);
sim.action('start'); assert.equal(timers.size, 2);
advance(2999); assert.equal(sim.snapshot().state.sensor, null);
advance(1);
const sensor = sim.snapshot().state.sensor.message, hb = initial.heartbeat.message;
assert.equal(sensor.accelerationMps2.x, 0); assert.equal(sensor.angularVelocityRadPerSec.y, 0);
assert.equal(sensor.batteryVoltageV, null); assert.equal(sensor.gpsFixValid, null); assert.equal(sensor.securityState, null);
assert.equal(sensor.lidState, 'UNKNOWN'); assert.equal(sensor.mountState, 'UNKNOWN');
const valid = input => assert.equal(validateDiagnosticMessage(input, 'ET-01').valid, true);
const invalid = input => assert.equal(validateDiagnosticMessage(input, 'ET-01').valid, false);
valid(sensor); valid(hb);
for (const change of [
  { schemaVersion: 1 }, { deviceId: 'OTHER' }, { source: 'REAL' }, { firmwareVersion: '' }, { sessionId: 'uptime' },
  { sequence: -1 }, { sequence: 1.5 }, { sequence: Number.MAX_SAFE_INTEGER + 1 }, { uptimeMs: NaN },
  { extra: 1 }, { sampledAtUtc: '2026-02-30T00:00:00Z', clockSynchronized: true },
  { sampledAtUtc: '2026-01-01T00:00:00+00:00', clockSynchronized: true }, { sampledAtUtc: null, clockSynchronized: true },
  { sampledAtUtc: '2026-01-01T00:00:00Z' }, { accelerationMps2: { x: NaN, y: 0, z: 0 } },
  { accelerationMps2: { x: 0, y: 0 } }, { accelerationMps2: { x: 0, y: 0, z: 0, unit: 'g' } },
  { accelerationMps2: null }, { imuFaultCode: 'SENSOR_BURST_READ_FAILED' }, { imuStatus: 'READ_ERROR' },
  { readStartUptimeMs: sensor.uptimeMs + 1 }, { readEndUptimeMs: sensor.uptimeMs + 1 },
  { lidState: 'LOW' }, { switchStatus: 'VALID' }, { securityState: 'UNKNOWN' }, { timeToEmptySeconds: 100 },
  { gpsFixValid: true }, { latitudeDeg: 0 }, { electromagneticBrakeActive: 0 }, { solarPowerW: -1 }, { batterySocPercent: 101 },
]) invalid({ ...sensor, ...change });
invalid(Object.create(sensor)); invalid([]); invalid(null);
const missing = { ...sensor }; delete missing.imuFaultCode; invalid(missing);
const inheritedVector = Object.create({ x: 0, y: 0, z: 0 }); invalid({ ...sensor, accelerationMps2: inheritedVector });
valid({ ...sensor, accelerationMps2: { x: 0, y: -1, z: 0 }, batteryVoltageV: 0, electromagneticBrakeActive: false });
valid({ ...sensor, imuStatus: 'BLOCKED', imuFaultCode: 'UNCONFIRMED_WIRING', accelerationMps2: null, angularVelocityRadPerSec: null });
let state = receiveDiagnostic(emptyDiagnostics('ET-01'), hb, 0);
assert.equal(receiveDiagnostic(emptyDiagnostics('ET-01'), sensor, 3000).acceptedCount, 0);
state = receiveDiagnostic(state, sensor, 3000);
const accepted = state;
for (const bad of [{}, sensor, { ...sensor, sequence: 1, accelerationMps2: null }, { ...sensor, sequence: 1, uptimeMs: 1000, readStartUptimeMs: 1000, readEndUptimeMs: 1000 }, { ...sensor, sequence: 1, source: 'device' }]) {
  const rejected = receiveDiagnostic(accepted, bad, 4000);
  for (const k of ['sensor', 'heartbeat', 'lastValidImu', 'order', 'acceptedCount', 'activeSessionId', 'events']) assert.equal(rejected[k], accepted[k], k);
  assert.ok(Object.keys(rejected.errors).length);
}
assert.ok(receiveDiagnostic(accepted, { ...hb, sequence: 1, clockSynchronized: true, sampledAtUtc: '1970-01-01T00:00:00Z' }, 6000).errors.device_heartbeat);
assert.doesNotThrow(() => receiveDiagnostic(accepted, { ...hb, sequence: 1 }, Infinity));
const changedInput = { ...sensor, sequence: 1, accelerationMps2: { x: 1, y: 2, z: 3 } };
const cloned = receiveDiagnostic(accepted, changedInput, 4000); changedInput.accelerationMps2.x = 100;
assert.equal(cloned.sensor.message.accelerationMps2.x, 1);
const bootB = '22222222-2222-4222-8222-222222222222';
const reboot = receiveDiagnostic(accepted, { ...hb, sessionId: bootB }, 5000);
assert.equal(reboot.sensor, null); assert.equal(reboot.activeSessionId, bootB);
assert.equal(receiveDiagnostic(reboot, { ...hb, sequence: 10 }, 6000).activeSessionId, bootB);
sim.action('pause-sensor'); const sensorReceipt = sim.snapshot().state.sensor.receivedAtUtc;
advance(10000);
assert.equal(sim.snapshot().state.sensor.receivedAtUtc, sensorReceipt);
assert.equal(diagnosticFreshness(sensorReceipt, clock).status, 'STALE');
assert.equal(diagnosticFreshness(sim.snapshot().state.heartbeat.receivedAtUtc, clock, 15000).status, 'UPDATING');
advance(20000); assert.equal(diagnosticFreshness(sensorReceipt, clock).status, 'DISCONNECTED');
sim.action('pause-heartbeat'); const heartReceipt = sim.snapshot().state.heartbeat.receivedAtUtc;
sim.action('resume-sensor'); advance(3000);
assert.equal(sim.snapshot().state.heartbeat.receivedAtUtc, heartReceipt);
assert.equal(diagnosticFreshness(sim.snapshot().state.sensor.receivedAtUtc, clock).status, 'UPDATING');
advance(12000); assert.equal(diagnosticFreshness(heartReceipt, clock, 15000).status, 'STALE');
const lastGood = sim.snapshot().state.lastValidImu;
sim.action('imu-fault'); advance(3000);
assert.equal(sim.snapshot().state.sensor.message.imuFaultCode, 'SENSOR_BURST_READ_FAILED');
assert.equal(sim.snapshot().state.sensor.message.accelerationMps2, null); assert.equal(sim.snapshot().state.lastValidImu, lastGood);
sim.action('imu-unavailable'); advance(3000); assert.equal(sim.snapshot().state.sensor.message.imuStatus, 'UNKNOWN');
sim.action('lid-open'); advance(3000); assert.equal(sim.snapshot().state.sensor.message.lidState, 'OPEN'); assert.equal(sim.snapshot().state.sensor.message.mountState, 'UNKNOWN');
sim.action('mount-released'); advance(3000); assert.equal(sim.snapshot().state.sensor.message.mountState, 'DETACHED');
sim.action('lid-closed'); sim.action('mount-attached'); sim.action('imu-valid'); advance(3000);
assert.equal(sim.snapshot().state.sensor.message.switchStatus, 'VALID'); assert.equal(sim.snapshot().state.sensor.message.lidState, 'CLOSED');
const beforeEvents = sim.snapshot().state.sensor;
for (let n = 0; n < EVENT_LIMIT + 5; n++) sim.action('inject-event');
assert.equal(sim.snapshot().state.events.length, EVENT_LIMIT);
assert.equal(sim.snapshot().state.events[0].message.sequence, EVENT_LIMIT + 4);
assert.equal(sim.snapshot().state.sensor, beforeEvents); assert.equal(beforeEvents.message.securityState, null);
valid(sim.snapshot().state.events[0].message);
invalid({ ...sim.snapshot().state.events[0].message, eventType: 'RAW_GPIO_CHANGE' });
assert.deepEqual(parseDiagnosticSnapshot(sim.snapshot(), 'ET-01'), sim.snapshot());
assert.throws(() => parseDiagnosticSnapshot(sim.snapshot(), 'OTHER'));
assert.throws(() => parseDiagnosticSnapshot({ ...sim.snapshot(), state: { ...sim.snapshot().state, events: Array(21).fill(sim.snapshot().state.events[0]) } }, 'ET-01'));
assert.throws(() => parseDiagnosticSnapshot({ ...sim.snapshot(), state: { ...sim.snapshot().state, events: [null] } }, 'ET-01'));
sim.action('stop'); assert.equal(timers.size, 0);
const stopped = sim.snapshot().state; advance(60000); assert.equal(sim.snapshot().state, stopped);
assert.throws(() => sim.action('inject-event'));
sim.action('start'); advance(3000); assert.ok(sim.snapshot().state.acceptedCount > stopped.acceptedCount);
sim.close(); assert.equal(timers.size, 0);
assert.equal(diagnosticFreshness(null, clock).status, 'WAITING');
assert.equal(diagnosticFreshness(new Date(clock).toISOString(), clock + 9999).status, 'UPDATING');
assert.equal(diagnosticFreshness(new Date(clock).toISOString(), clock + 10000).status, 'STALE');
assert.equal(diagnosticFreshness(new Date(clock).toISOString(), clock + 30000).status, 'DISCONNECTED');

const directory = mkdtempSync(join(tmpdir(), 'solair-diagnostics-'));
const authDatabasePath = join(directory, 'auth.sqlite'), databasePath = join(directory, 'telemetry.sqlite');
const origin = 'http://127.0.0.1:5173', hosts = [];
let authClock = Date.now(), backend, server;
async function closed(reader) {
  let timeout;
  try { return await Promise.race([(async () => { let text = ''; for (;;) { const r = await reader.read(); if (r.done) return text; text += new TextDecoder().decode(r.value); } })(), new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Diagnostic stream did not close')), 3500); })]); }
  finally { clearTimeout(timeout); }
}
try {
  const credentials = await createTestOperator(authDatabasePath);
  const other = await createTestOperator(authDatabasePath, 'other', 'OTHER-02');
  backend = createBackend({ databasePath, authDatabasePath, allowedHosts: hosts, localDevelopment: true, startPaused: true, now: () => clock, authNow: () => authClock, authLifetime: 60000, schedule, cancel });
  server = backend.app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`; hosts.push(`127.0.0.1:${server.address().port}`);
  const headers = { ...await testLogin(base, credentials), Origin: origin };
  const otherHeaders = { ...await testLogin(base, other), Origin: origin };
  const call = (path, method = 'GET', h = headers) => fetch(base + path, { method, headers: h });
  const actions = ['start', 'stop', 'pause-heartbeat', 'resume-heartbeat', 'pause-sensor', 'resume-sensor', 'imu-valid', 'imu-unavailable', 'imu-fault', 'lid-open', 'lid-closed', 'mount-attached', 'mount-released', 'inject-event'];
  const routes = [['GET', '/api/diagnostics/latest'], ['GET', '/api/diagnostics/stream'], ['GET', '/api/diagnostics/events'], ...actions.map(a => ['POST', '/api/diagnostics/simulator/' + a])];
  for (const [method, path] of routes) {
    assert.equal((await call(path, method, {})).status, 401, path);
    assert.equal((await call(path, method, otherHeaders)).status, 403, path);
    if (method === 'POST') {
      assert.equal((await call(path, method, { Cookie: headers.Cookie, Origin: origin })).status, 403, path);
      assert.equal((await call(path, method, { ...headers, Origin: 'https://foreign.example' })).status, 403, path);
    }
  }
  assert.equal((await call('/api/diagnostics/stream', 'GET', { ...headers, Origin: 'https://foreign.example' })).status, 403);
  assert.equal((await call('/api/diagnostics/simulator/not-an-action', 'POST')).status, 404);
  assert.equal((await call('/api/diagnostics/simulator/imu-fault', 'POST')).status, 409);
  const boot = await call('/api/diagnostics/latest?deviceId=OTHER-02');
  assert.equal(boot.headers.get('cache-control'), 'no-store');
  const idle = await boot.json(); assert.equal(idle.deviceId, 'ET-01'); assert.equal(idle.running, false);
  const v1Before = backend.snapshot();
  const streams = await Promise.all(['/api/diagnostics/stream', '/api/telemetry/stream'].map(path => call(path)));
  const readers = streams.map(s => s.body.getReader());
  for (const reader of readers) assert.match(new TextDecoder().decode((await reader.read()).value), /event: state/);
  const ctrl = async action => { const r = await call('/api/diagnostics/simulator/' + action, 'POST'); assert.equal(r.status, 200, action); return r.json(); };
  await ctrl('start'); advance(3000);
  assert.equal((await (await call('/api/diagnostics/latest')).json()).state.sensor.message.deviceId, 'ET-01');
  await ctrl('pause-heartbeat'); await ctrl('pause-sensor');
  const pausedCount = backend.diagnostics.simulator.snapshot().state.acceptedCount;
  advance(30000); assert.equal(backend.diagnostics.simulator.snapshot().state.acceptedCount, pausedCount);
  await ctrl('resume-heartbeat'); advance(5000);
  assert.equal(diagnosticFreshness(backend.diagnostics.simulator.snapshot().state.sensor.receivedAtUtc, clock).status, 'DISCONNECTED');
  await ctrl('resume-sensor'); await ctrl('imu-fault'); advance(3000);
  assert.equal(backend.diagnostics.simulator.snapshot().state.sensor.message.imuStatus, 'READ_ERROR');
  for (const action of ['lid-open', 'mount-released', 'inject-event', 'imu-unavailable', 'lid-closed', 'mount-attached', 'imu-valid']) await ctrl(action);
  advance(3000);
  const latest = await (await call('/api/diagnostics/latest')).json(); parseDiagnosticSnapshot(latest, 'ET-01');
  assert.equal(latest.state.sensor.message.securityState, null); assert.equal(latest.state.events.length, 1);
  const streamText = new TextDecoder().decode((await readers[0].read()).value);
  assert.match(streamText, /SIMULATOR-V2-REVIEW-1/);
  assert.deepEqual(backend.snapshot(), v1Before);
  assert.equal((await (await call('/api/telemetry/history')).json()).records.length, 0);
  const csv = await call('/api/telemetry/export.csv'); assert.equal(csv.headers.get('x-telemetry-record-count'), '0'); assert.doesNotMatch(await csv.text(), /MOTION_TAMPER|SIMULATOR-V2/);
  await ctrl('stop'); assert.equal(timers.size, 1); // Only the existing SSE keepalive remains.
  assert.equal((await call('/api/auth/logout', 'POST')).status, 200);
  for (const reader of readers) assert.match(await closed(reader), /auth-required/);
  assert.equal(backend.diagnostics.clientCount(), 0); assert.equal(backend.clientCount(), 0);
  assert.equal((await call('/api/diagnostics/latest')).status, 401);
  const fresh = { ...await testLogin(base, credentials), Origin: origin };
  const expiring = await call('/api/diagnostics/stream', 'GET', fresh), expiryReader = expiring.body.getReader(); await expiryReader.read();
  authClock += 60001;
  assert.equal((await call('/api/diagnostics/latest', 'GET', fresh)).status, 401);
  assert.match(await closed(expiryReader), /auth-required/); assert.equal(backend.diagnostics.clientCount(), 0);
  const resetHeaders = { ...await testLogin(base, credentials), Origin: origin };
  const abort = new AbortController();
  const abortStream = await fetch(base + '/api/diagnostics/stream', { headers: resetHeaders, signal: abort.signal }); const abortReader = abortStream.body.getReader(); await abortReader.read();
  abort.abort(); await abortReader.cancel().catch(() => {});
  for (let n = 0; n < 20 && backend.diagnostics.clientCount(); n++) await new Promise(r => setTimeout(r, 10));
  assert.equal(backend.diagnostics.clientCount(), 0);
  backend.close(); assert.equal(timers.size, 0);
  backend = createBackend({ databasePath, authDatabasePath, localDevelopment: true, startPaused: true, now: () => clock, schedule, cancel });
  assert.equal(backend.diagnostics.simulator.snapshot().running, false); assert.equal(backend.diagnostics.simulator.snapshot().state.events.length, 0);
  assert.equal(backend.diagnostics.simulator.snapshot().state.sensor, null); backend.close(); assert.equal(timers.size, 0);
  console.log('PASS diagnostics: v2 validation/rejection retention, boot/per-type order, null/zero/faults, independent ages, bounded events, start/stop/pause/resume/cleanup, real-login 401/403/CSRF, authenticated SSE, logout/expiry/disconnect closure, restart reset, v1/history/CSV isolation (temporary databases, deterministic timers). Browser interactions not tested.');
} finally {
  sim.close(); backend?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  rmSync(directory, { recursive: true, force: true });
}
