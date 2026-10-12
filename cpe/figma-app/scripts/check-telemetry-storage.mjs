import { createTestOperator, testLogin } from './auth-test-client.mjs';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openTelemetryStorage } from '../backend/telemetry-storage.mjs';
import { csvCell, csvColumns } from '../backend/telemetry-csv.mjs';
import { createBackend } from '../backend/server.mjs';
import { demoTelemetry } from '../src/app/data/demoTelemetry.ts';
import { createSimulatedMessage, getSampleStatus } from '../src/app/data/telemetrySimulation.ts';
import { applyBackendState, emptyBackendState } from '../src/app/data/backendTelemetry.ts';

const directory = mkdtempSync(join(tmpdir(), 'solair-storage-'));
const databasePath = join(directory, 'test.sqlite');
let clock = 10000;
const authDatabasePath = join(directory, 'auth.sqlite');
const credentials = await createTestOperator(authDatabasePath);
const options = { localDevelopment: true, authDatabasePath, databasePath, startPaused: true, now: () => clock, schedule: () => 1, cancel: () => {} };
let backend, server, inspection;
try {
  backend = createBackend(options);
  const original = { ...createSimulatedMessage(demoTelemetry, 7, '=session,"\nexample', 3000), batteryVoltageV: 0, solarPowerW: 0, windPowerW: null, speedKmh: 0, electromagneticBrakeActive: false, latitudeDeg: 0, longitudeDeg: 0 };
  const first = backend.accept(original);
  assert.equal(first.count, 1); assert.equal(first.sessionCount, 1);
  backend.close(); clock = 60000; backend = createBackend(options);
  const restored = backend.snapshot();
  assert.deepEqual(restored.message, original); assert.equal(restored.receivedAt, 10000);
  assert.equal(restored.count, 1); assert.equal(restored.sessionCount, 0); assert.equal(restored.paused, true);
  assert.notEqual(restored.backendId, first.backendId);
  assert.equal(getSampleStatus(restored.receivedAt, clock), 'DISCONNECTED');
  assert.equal(applyBackendState(emptyBackendState(), restored).receivedAt, 10000);
  for (const input of [original, { ...original, sequence: 6 }, { ...original, sequence: 8, solarPowerW: -1 }]) {
    const rejected = backend.accept(input);
    assert.ok(rejected.validationError); assert.equal(rejected.count, 1); assert.equal(rejected.receivedAt, 10000); assert.deepEqual(rejected.message, original);
  }
  const fresh = createSimulatedMessage(demoTelemetry, 1, restored.backendId, clock);
  assert.equal(backend.accept(fresh).count, 2); assert.equal(backend.snapshot().validationError, null);
  inspection = new DatabaseSync(databasePath);
  inspection.exec("CREATE TRIGGER fail_write BEFORE INSERT ON telemetry_samples BEGIN SELECT RAISE(ABORT, 'injected disk failure'); END");
  const beforeFailure = backend.snapshot();
  const failed = backend.accept({ ...fresh, sequence: 2 });
  assert.ok(failed.storageError); assert.equal(failed.count, beforeFailure.count); assert.equal(failed.sessionCount, beforeFailure.sessionCount); assert.equal(failed.receivedAt, beforeFailure.receivedAt); assert.deepEqual(failed.message, beforeFailure.message);
  assert.ok(applyBackendState(applyBackendState(emptyBackendState(), beforeFailure), failed).storageError);
  inspection.exec('DROP TRIGGER fail_write');
  assert.equal(backend.accept({ ...fresh, sequence: 2 }).count, 3); assert.equal(backend.snapshot().storageError, null);
  assert.equal(backend.accept({ ...fresh, source: 'device', sequence: 1 }).count, 4);
  assert.throws(() => inspection.exec('INSERT INTO telemetry_samples(schema_version,source,device_id,session_id,sequence,sender_at_utc,received_at_utc,message_json) SELECT schema_version,source,device_id,session_id,sequence,sender_at_utc,received_at_utc,message_json FROM telemetry_samples WHERE id=1'), /UNIQUE/);
  inspection.close(); inspection = null;
  const storage = openTelemetryStorage(databasePath);
  try {
    const page = storage.history({ limit: 2 }); backend.accept({ ...fresh, sequence: 3 });
    const older = storage.history({ limit: 2, snapshot: page.snapshot, before: page.nextBefore });
    assert.deepEqual([...page.records, ...older.records].map(r => r.id), [4, 3, 2, 1]); assert.equal(older.nextBefore, null);
    const exportState = storage.exportSnapshot(); backend.accept({ ...fresh, sequence: 4 });
    let rows = [], after = 0;
    while (true) { const batch = storage.exportBatch(exportState.snapshot, after, 2); if (!batch.length) break; rows.push(...batch); after = batch.at(-1).id; }
    assert.equal(rows.length, exportState.count); assert.deepEqual(rows.map(r => r.id), [1, 2, 3, 5]); assert.ok(rows.every(r => r.message.source === 'simulated'));
    assert.equal(rows[0].message.windPowerW, null); assert.equal(rows[0].message.batteryVoltageV, 0); assert.equal(rows[0].message.electromagneticBrakeActive, false);
    assert.equal(csvCell(null), ''); assert.equal(csvCell(0), '"0"'); assert.equal(csvCell(false), '"false"');
    assert.equal(csvCell('=1+1'), '"\'=1+1"'); assert.equal(csvCell(' \t@SUM(1)'), '"\' \t@SUM(1)"'); assert.equal(csvCell('a,"b\n'), '"a,""b\n"');
  } finally { storage.close(); }
  const hosts = []; backend.close(); backend = createBackend({ ...options, allowedHosts: hosts });
  server = backend.app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`; hosts.push(`127.0.0.1:${server.address().port}`);
  const headers = await testLogin(base, credentials);
  assert.equal((await fetch(base + '/api/telemetry/history?limit=101', { headers })).status, 400);
  const history = await (await fetch(base + '/api/telemetry/history?limit=100', { headers })).json();
  const response = await fetch(base + '/api/telemetry/export.csv', { headers });
  assert.equal(response.status, 200); assert.match(response.headers.get('content-disposition'), /SIMULATED/);
  const selected = history.records.filter(r => r.message.source === 'simulated').reverse();
  const expected = [csvColumns.map(([name]) => csvCell(name)).join(','), ...selected.map(r => csvColumns.map(([, get]) => csvCell(get(r))).join(','))].join('\r\n') + '\r\n';
  assert.equal(await response.text(), expected); assert.equal(Number(response.headers.get('x-telemetry-record-count')), selected.length);
  for (let sequence = 5; sequence <= 260; sequence++) backend.accept({ ...fresh, sequence });
  const large = await fetch(base + '/api/telemetry/export.csv', { headers });
  assert.equal(Number(large.headers.get('x-telemetry-record-count')), 261);
  assert.equal((await large.text()).split('\r\n').filter(Boolean).length, 262);
  console.log('Passed storage: restart receipt/order/count, new session/source identity, UNIQUE constraint, null/zero/false, failed-write rollback, stable history/export snapshots, CSV escaping/formula protection, simulated-only HTTP CSV and multi-batch export (temporary database).');
} finally {
  inspection?.close(); backend?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  rmSync(directory, { recursive: true });
}
