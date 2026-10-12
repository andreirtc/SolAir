import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

async function loadTs(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { code } = await transformWithEsbuild(source, path, { loader: 'ts', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const { demoTelemetry, formatReading } = await loadTs('../src/app/data/demoTelemetry.ts');
const { createSimulatedReading, getSampleStatus, startSampleTimer } = await loadTs('../src/app/data/telemetrySimulation.ts');
assert.equal(getSampleStatus(null, 0), 'WAITING');
assert.equal(getSampleStatus(0, 0), 'UPDATING');
assert.equal(getSampleStatus(0, 9999), 'UPDATING');
assert.equal(getSampleStatus(0, 10000), 'STALE');
assert.equal(getSampleStatus(0, 29999), 'STALE');
assert.equal(getSampleStatus(0, 30000), 'DISCONNECTED');
for (let sequence = 1; sequence <= 12; sequence++) {
  const sample = createSimulatedReading(demoTelemetry, sequence);
  assert.equal(sample.source, 'demo');
  assert.equal(sample.mqttConnected, false);
  assert.equal(sample.gpsConnected, false);
  assert.equal(sample.electromagneticBrakeActive, null);
  assert.equal(sample.latitudeDeg, demoTelemetry.latitudeDeg);
  for (const key of ['batteryVoltageV', 'solarPowerW', 'windPowerW']) {
    assert.equal(createSimulatedReading({ ...demoTelemetry, [key]: null }, sequence)[key], null);
    assert.equal(createSimulatedReading({ ...demoTelemetry, [key]: 0 }, sequence)[key], 0);
  }
}
for (const key of ['batteryVoltageV', 'solarPowerW', 'windPowerW']) {
  assert.notEqual(createSimulatedReading(demoTelemetry, 1)[key], createSimulatedReading(demoTelemetry, 2)[key]);
}
assert.equal(formatReading(0), '0');
assert.equal(formatReading(null), 'Unavailable');
assert.equal(formatReading(0, 1), '0.0');
assert.equal(demoTelemetry.batteryVoltageV, 52.8);

// Fake clock exercises the actual sample timer's pause/unmount cancellation and resume delay.
let clock = 0;
let nextId = 0;
const timers = new Map();
const schedule = (callback, delay) => {
  const id = ++nextId;
  timers.set(id, { callback, delay, next: clock + delay });
  return id;
};
const cancel = id => timers.delete(id);
const advance = duration => {
  const end = clock + duration;
  while (true) {
    const due = [...timers.values()].filter(timer => timer.next <= end).sort((a, b) => a.next - b.next)[0];
    if (!due) break;
    clock = due.next;
    due.next += due.delay;
    due.callback();
  }
  clock = end;
};
let count = 0;
let last = null;
let reading = demoTelemetry;
const sample = () => { last = clock; reading = createSimulatedReading(demoTelemetry, ++count); };
let stop = startSampleTimer(sample, schedule, cancel);
advance(2999);
assert.equal(count, 0);
advance(1);
assert.equal(count, 1);
advance(3000);
assert.equal(count, 2);
stop();
assert.equal(timers.size, 0);
const retained = reading;
advance(10000);
assert.equal(getSampleStatus(last, clock), 'STALE');
advance(20000);
assert.equal(getSampleStatus(last, clock), 'DISCONNECTED');
assert.equal(reading, retained);
assert.equal(count, 2);
stop = startSampleTimer(sample, schedule, cancel);
advance(2999);
assert.equal(count, 2);
advance(1);
assert.equal(count, 3);
assert.equal(getSampleStatus(last, clock), 'UPDATING');
stop();
advance(6000);
assert.equal(count, 3);
assert.equal(timers.size, 0);
console.log('Passed: freshness boundaries, variation, null/zero, offline GPS/MQTT, timer cadence, cancellation, retention and resume.');
