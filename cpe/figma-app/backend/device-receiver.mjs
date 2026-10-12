import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { emptyDiagnostics, receiveDiagnostic, validateDiagnosticMessage } from '../src/app/data/diagnosticsV2.ts';

const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item);

// Separate append-only v2 database. Never migrate or open the working v1 database.
export function createDeviceReceiver({ deviceId = 'ET-01', databasePath, token, now = Date.now, provenance = 'REAL DEVICE', heartbeatIntervalMs = 5000 }) {
  if (!['REAL DEVICE', 'TEST FIXTURE'].includes(provenance) || !Number.isSafeInteger(heartbeatIntervalMs) || heartbeatIntervalMs < 1000) throw Error('Invalid receiver configuration.');
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw Error('A privately provisioned 32-byte device token is required.');
  const path = resolve(databasePath);
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 2000 });
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS device_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, receipt TEXT NOT NULL, message TEXT NOT NULL,
      boot TEXT NOT NULL, kind TEXT NOT NULL, sequence INTEGER NOT NULL,
      UNIQUE(boot,kind,sequence));
    CREATE TABLE IF NOT EXISTS device_state (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);`);
  const columns = db.prepare('PRAGMA table_info(device_messages)').all().map(c => c.name);
  for (const [name, definition] of [['provenance', "TEXT NOT NULL DEFAULT 'REAL DEVICE'"], ['retry_count', 'INTEGER NOT NULL DEFAULT 0'], ['last_retry', 'TEXT']]) {
    if (!columns.includes(name)) db.exec(`ALTER TABLE device_messages ADD COLUMN ${name} ${definition}`);
  }
  const saved = db.prepare('SELECT value FROM device_state WHERE id=1').get();
  let state = saved ? JSON.parse(saved.value) : emptyDiagnostics(deviceId);
  if (state.deviceId !== deviceId) { db.close(); throw Error('Device database assignment mismatch.'); }
  const listeners = new Set();
  const snapshot = () => ({ deviceId, mode: 'device', provenance, heartbeatIntervalMs, running: false, heartbeatPaused: false, sensorPaused: false, state });
  const notify = () => { for (const listener of listeners) { try { listener(snapshot()); } catch { listeners.delete(listener); } } };
  const accept = input => {
    const receipt = now();
    const result = validateDiagnosticMessage(input, deviceId);
    if (!result.valid || result.message.source !== 'device') return { status: 409, error: result.valid ? 'Unexpected source.' : result.error };
    if (!Number.isFinite(receipt) || Math.abs(receipt) > 8640000000000000) return { status: 503, error: 'Receipt clock unavailable.' };
    const message = result.message, receiptUtc = new Date(receipt).toISOString();
    let next;
    try {
      db.exec('BEGIN IMMEDIATE');
      // Check identity before live ordering/time rules: lost acknowledgements and
      // old-boot persisted events must remain retryable after either side restarts.
      const prior = db.prepare('SELECT message FROM device_messages WHERE boot=? AND kind=? AND sequence=?').get(message.sessionId, message.messageType, message.sequence);
      if (prior) {
        if (canonical(JSON.parse(prior.message)) !== canonical(message)) { db.exec('ROLLBACK'); return { status: 409, error: 'Conflicting message identity.' }; }
        db.prepare('UPDATE device_messages SET retry_count=retry_count+1,last_retry=? WHERE boot=? AND kind=? AND sequence=?').run(receiptUtc, message.sessionId, message.messageType, message.sequence);
        db.exec('COMMIT'); return { status: 202, duplicate: true };
      }
      if (message.messageType === 'tamper_event') {
        // Historical delivery never changes live boot/order/heartbeat/sensor ages.
        if (message.sampledAtUtc && Date.parse(message.sampledAtUtc) > receipt + 5000) { db.exec('ROLLBACK'); return { status: 409, error: 'Event sender time is in the future.' }; }
        next = { ...state, acceptedCount: state.acceptedCount + 1, events: [{ message, receivedAtUtc: receiptUtc }, ...state.events].slice(0, 20) };
      } else {
        next = receiveDiagnostic(state, message, receipt, 'device');
        if (next.acceptedCount === state.acceptedCount) { db.exec('ROLLBACK'); return { status: 409, error: Object.values(next.errors).at(-1) ?? 'Rejected message.' }; }
      }
      db.prepare('INSERT INTO device_messages(receipt,message,boot,kind,sequence,provenance) VALUES (?,?,?,?,?,?)').run(receiptUtc, JSON.stringify(message), message.sessionId, message.messageType, message.sequence, provenance);
      db.prepare('INSERT INTO device_state VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(JSON.stringify(next));
      db.exec('COMMIT');
    } catch {
      try { db.exec('ROLLBACK'); } catch {}
      return { status: 503, error: 'Storage unavailable; accepted state retained.' };
    }
    state = next; notify(); return { status: 202, duplicate: false };
  };
  const app = express(); app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const provided = req.headers.authorization;
    const expected = `Bearer ${token}`;
    if (req.headers.origin || typeof provided !== 'string' || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return res.status(403).json({ error: 'Device access denied.' });
    next();
  });
  app.use(express.json({ limit: '4kb', strict: true }));
  app.post('/ingest', (req, res) => { const result = accept(req.body); res.status(result.status).json(result.error ? { error: result.error } : { accepted: true, durable: true, duplicate: result.duplicate }); });
  app.use((_req, res) => res.sendStatus(404));
  app.use((error, _req, res, _next) => res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: 'Invalid device request.' }));
  return { app, snapshot, accept, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    records({ limit = 1000, afterId = 0, eventsOnly = false } = {}) {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10000 || !Number.isSafeInteger(afterId) || afterId < 0) throw Error('Invalid record bounds.');
      return db.prepare(`SELECT * FROM device_messages WHERE id>? ${eventsOnly ? "AND kind='tamper_event'" : ''} ORDER BY id ASC LIMIT ?`).all(afterId, limit).map(record);
    },
    history(limit = 100) { return db.prepare('SELECT * FROM device_messages WHERE kind=? ORDER BY id DESC LIMIT ?').all('tamper_event', Math.max(1, Math.min(100, limit))).map(record); },
    close() { listeners.clear(); db.close(); } };
}

function record(row) {
  const message = JSON.parse(row.message);
  return { id: row.id, eventId: message.messageType === 'tamper_event' ? `${message.deviceId}:${message.sessionId}:${message.sequence}` : null,
    receivedAtUtc: row.receipt, message, provenance: row.provenance, delivery: 'DURABLY ACCEPTED', acceptedRetryCount: row.retry_count, lastRetryAtUtc: row.last_retry };
}
