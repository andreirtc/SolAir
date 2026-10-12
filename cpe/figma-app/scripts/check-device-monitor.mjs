import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { deviceMonitorView } from '../src/app/data/deviceMonitorView.ts';
import { createDiagnosticSimulator } from '../backend/diagnostics.mjs';

// Synthetic presentation fixtures only; no working storage or physical device.
const now = Date.parse('2026-10-10T00:00:00Z');
const timers = new Map();
const simulator = createDiagnosticSimulator({ deviceId: 'ET-01', now: () => now,
  schedule: (callback, interval) => { timers.set(interval, callback); return interval; }, cancel: interval => timers.delete(interval) });
try {
  assert.equal(deviceMonitorView(null, now).source, 'AWAITING SOURCE');
  assert.equal(deviceMonitorView(null, now).security, 'Unavailable');
  simulator.action('start');
  timers.get(3000)();
  const snapshot = structuredClone(simulator.snapshot());
  assert.equal(deviceMonitorView(snapshot, now).source, 'SIMULATED');
  snapshot.mode = 'device'; snapshot.provenance = 'TEST FIXTURE';
  const sensor = snapshot.state.sensor;
  assert.ok(sensor);
  sensor.message.securityState = 'DISARMED';
  sensor.message.lidState = 'CLOSED'; sensor.message.mountState = 'ATTACHED'; sensor.message.switchStatus = 'VALID';
  assert.equal(deviceMonitorView(snapshot, now).source, 'TEST FIXTURE');
  assert.equal(deviceMonitorView(snapshot, now).lid, 'CLOSED');
  assert.equal(deviceMonitorView(snapshot, now).security, 'DISARMED');
  for (const [age, status] of [[14999, 'ONLINE'], [15000, 'STALE'], [30000, 'OFFLINE']]) {
    assert.equal(deviceMonitorView(snapshot, now + age).live.status, status);
  }
  const oldReceipt = snapshot.state.heartbeat.receivedAtUtc;
  snapshot.state.events = [{ receivedAtUtc: new Date(now + 60000).toISOString(), message: {
    ...snapshot.state.heartbeat.message, sessionId: randomUUID(), messageType: 'tamper_event',
    securityState: 'TRIGGERED', eventType: 'LID_OPEN_DETECTED', detectorVersion: 'TEST FIXTURE', evidenceTelemetrySequence: null,
  } }];
  let view = deviceMonitorView(snapshot, now + 60000);
  assert.equal(view.live.status, 'OFFLINE');
  assert.equal(view.live.receivedAtUtc, oldReceipt);
  assert.equal(view.security, 'DISARMED'); // old boot event is history, not active security
  assert.equal(view.sensorFreshness.status, 'DISCONNECTED');
  snapshot.state.events[0].message.sessionId = snapshot.state.activeSessionId;
  snapshot.state.events[0].message.uptimeMs = sensor.message.uptimeMs + 1;
  view = deviceMonitorView(snapshot, now + 60000);
  assert.equal(view.security, 'TRIGGERED');
  assert.equal(view.live.status, 'OFFLINE'); // security receipt never refreshes device status
  snapshot.state.activeSessionId = randomUUID();
  assert.equal(deviceMonitorView(snapshot, now + 60000).lid, 'UNKNOWN');
  assert.equal(deviceMonitorView(snapshot, now + 60000).security, 'Unavailable');
  console.log('PASS device monitor: unknown/simulated/fixture provenance, active-boot switch/security scope, liveness boundaries, retained stale reports, delayed events never renew connection. No physical/browser tests.');
} finally { simulator.close(); }
