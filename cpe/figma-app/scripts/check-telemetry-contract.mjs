import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

async function loadTs(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { code } = await transformWithEsbuild(source, path, { loader: 'ts', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const { demoTelemetry, formatReading } = await loadTs('../src/app/data/demoTelemetry.ts');
const { createSimulatedMessage, getSampleStatus, startSampleTimer } = await loadTs('../src/app/data/telemetrySimulation.ts');
const { validateTelemetryMessage: validate, createTelemetryReception, receiveTelemetry: receive } = await loadTs('../src/app/data/telemetryContract.ts');
const message = createSimulatedMessage(demoTelemetry, 1, 'boot-a', 3000);
const valid = input => assert.equal(validate(input, 'ET-01').valid, true);
const invalid = input => assert.equal(validate(input, 'ET-01').valid, false);
valid(message);
valid({ ...message, source: 'device', sampledAtUtc: null });
valid({ ...message, sampledAtUtc: '2026-10-02T00:00:00Z' });
assert.equal(message.source, 'simulated');
assert.equal(message.timeToEmptySeconds, null);
assert.equal(message.electromagneticBrakeActive, null);
for (const key of ['batteryVoltageV', 'batterySocPercent', 'solarPowerW', 'windPowerW', 'speedKmh']) {
  valid(createSimulatedMessage({ ...demoTelemetry, [key]: null }, 1, 'null-fixture', 3000));
  assert.equal(createSimulatedMessage({ ...demoTelemetry, [key]: 0 }, 1, 'zero-fixture', 3000)[key], 0);
}
valid(createSimulatedMessage({ ...demoTelemetry, latitudeDeg: null, longitudeDeg: null }, 1, 'no-gps', 3000));
for (const state of ['DISARMED', 'ARMED', 'TRIGGERED']) valid({ ...message, securityState: state });
for (const value of [null, [], 'message', 42]) invalid(value);
// All contract fields are required, including explicitly nullable readings.
for (const key of Object.keys(message)) {
  const missing = { ...message };
  delete missing[key];
  invalid(missing);
  // Prototype properties are not fields supplied by a JSON message.
  invalid(Object.assign(Object.create({ [key]: message[key] }), missing));
}
const numeric = ['batteryVoltageV', 'batterySocPercent', 'timeToEmptySeconds', 'solarPowerW', 'windPowerW', 'speedKmh'];
for (const key of numeric) {
  valid({ ...message, [key]: null });
  valid({ ...message, [key]: 0 });
  assert.equal(formatReading(0), '0');
  assert.equal(formatReading(null), 'Unavailable');
  for (const value of ['0', false, {}, NaN, Infinity, -Infinity, -1]) invalid({ ...message, [key]: value });
}
valid({ ...message, batterySocPercent: 100 });
invalid({ ...message, batterySocPercent: 100.1 });
valid({ ...message, latitudeDeg: 0, longitudeDeg: 0 });
valid({ ...message, latitudeDeg: -90, longitudeDeg: 180 });
valid({ ...message, latitudeDeg: null, longitudeDeg: null, gpsFixValid: false });
for (const patch of [
  { latitudeDeg: 91 }, { longitudeDeg: -181 }, { latitudeDeg: '14' },
  { latitudeDeg: NaN }, { longitudeDeg: Infinity }, { latitudeDeg: null },
  { longitudeDeg: null }, { gpsFixValid: false }, { gpsFixValid: 'true' },
  { latitudeDeg: null, longitudeDeg: null, gpsFixValid: true },
  { securityState: 'UNKNOWN' }, { securityState: null }, { schemaVersion: 2 },
  { source: 'demo' }, { deviceId: 'wrong' }, { sessionId: ' ' },
  { sequence: -1 }, { sequence: 1.5 }, { sequence: Number.MAX_SAFE_INTEGER + 1 },
  { sampledAtUtc: '2026-02-30T00:00:00Z' }, { sampledAtUtc: '2026-10-02' },
  { sampledAtUtc: '2026-10-02T08:00:00+08:00' }, { sampledAtUtc: 3000 },
  { electromagneticBrakeActive: 'false' },
]) invalid({ ...message, ...patch });
assert.equal(validate({ ...message, receivedAt: 999 }, 'ET-01').message.receivedAt, undefined);

let reception = createTelemetryReception();
const initialReject = receive(reception, {}, 'ET-01', 100);
assert.equal(initialReject.count, 0);
assert.equal(initialReject.receivedAt, null);
assert.equal(getSampleStatus(initialReject.receivedAt, 40000), 'WAITING');
reception = receive(reception, message, 'ET-01', 5000);
assert.equal(reception.count, 1);
assert.equal(reception.receivedAt, 5000); // Not sender time 3000.
for (const input of [message, { ...message, sequence: 0 }, { ...message, sequence: 2, solarPowerW: -1 }]) {
  const rejected = receive(reception, input, 'ET-01', 35000);
  assert.ok(rejected.validationError);
  assert.equal(rejected.message, reception.message);
  assert.equal(rejected.receivedAt, reception.receivedAt);
  assert.equal(rejected.count, reception.count);
  assert.equal(rejected.sequences, reception.sequences);
  assert.equal(getSampleStatus(rejected.receivedAt, 15000), 'STALE');
  assert.equal(getSampleStatus(rejected.receivedAt, 35000), 'DISCONNECTED');
  reception = rejected;
}
reception = receive(reception, { ...message, sequence: 2 }, 'ET-01', 36000);
assert.equal(reception.validationError, null);
assert.equal(reception.count, 2);
reception = receive(reception, { ...message, sessionId: 'boot-b', sequence: 0 }, 'ET-01', 37000);
assert.equal(reception.count, 3);
assert.equal(receive(reception, message, 'ET-01', 38000).count, 3); // Old boot's sequence remembered.
assert.equal(receive(createTelemetryReception(), message, 'ET-01', 39000).count, 1); // Dashboard reset.
assert.equal(receive(reception, { ...message, sequence: 10 }, 'ET-01', 40000).count, 4); // Gaps allowed.
// Session IDs are opaque strings, including names inherited by ordinary objects.
let specialSession = receive(createTelemetryReception(), { ...message, sessionId: '__proto__', sequence: 0 }, 'ET-01', 40000);
assert.equal(specialSession.count, 1);
assert.equal(receive(specialSession, { ...message, sessionId: '__proto__', sequence: 0 }, 'ET-01', 41000).count, 1);
specialSession = receive(specialSession, { ...message, sessionId: '__proto__', sequence: 1 }, 'ET-01', 42000);
assert.equal(specialSession.count, 2);
// Run the actual emitter -> validator -> reception path through an injected timer.
let callback;
let cancelled = false;
let sequence = 0;
let clock = 0;
reception = createTelemetryReception();
const stop = startSampleTimer(() => {
  reception = receive(reception, createSimulatedMessage(demoTelemetry, ++sequence, 'timer-session', clock), 'ET-01', clock);
}, (fn, delay) => { callback = fn; assert.equal(delay, 3000); return 1; }, id => { assert.equal(id, 1); cancelled = true; });
assert.equal(reception.count, 0);
for (clock = 3000; clock <= 36000; clock += 3000) callback();
assert.equal(reception.count, 12);
assert.equal(reception.validationError, null);
stop();
assert.equal(cancelled, true);
console.log('Passed: required fields, valid/null/zero, types/ranges/GPS/states/timestamps, device ID, ordering/session reset, rejection retention/error recovery, simulator acceptance.');
