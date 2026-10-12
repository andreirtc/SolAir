import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTelemetryMessage } from '../src/app/data/telemetryContract.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
export const defaultDatabasePath = resolve(root, 'data/telemetry.sqlite');
const decode = row => row ? { id: row.id, receivedAtUtc: row.received_at_utc, message: JSON.parse(row.message_json) } : null;

// Append-only records are also the durable ordering state: MAX(sequence) per identity.
// Keep SQLite details here so the server does not depend on a particular driver.
export function openTelemetryStorage(path = process.env.SOLAIR_DB_PATH || defaultDatabasePath) {
  path = path === ':memory:' ? path : resolve(root, path);
  if (path !== ':memory:') {
    const fromRoot = relative(root, path);
    const inProject = !fromRoot.startsWith('..') && !isAbsolute(fromRoot);
    const fromData = relative(resolve(root, 'data'), path);
    if (inProject && (fromData.startsWith('..') || isAbsolute(fromData) || !fromData)) throw new Error('Project-local databases must be under data/, outside frontend assets. External paths are also supported.');
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path, { timeout: 2000 });
  try {
    const version = db.prepare('PRAGMA user_version').get().user_version;
    if (version > 1) throw new Error('Unsupported telemetry database schema; no data was changed.');
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS telemetry_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schema_version INTEGER NOT NULL,
        source TEXT NOT NULL,
        device_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        sender_at_utc TEXT,
        received_at_utc TEXT NOT NULL,
        message_json TEXT NOT NULL,
        UNIQUE(source, device_id, session_id, sequence)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS telemetry_source_id ON telemetry_samples(source, id);
      PRAGMA user_version=1; COMMIT;`);
  } catch (error) { db.close(); throw error; }
  const total = (deviceId) => deviceId === undefined ? db.prepare('SELECT COUNT(*) AS count FROM telemetry_samples').get().count : db.prepare('SELECT COUNT(*) AS count FROM telemetry_samples WHERE device_id=?').get(deviceId).count;
  const maximumId = (deviceId) => db.prepare('SELECT COALESCE(MAX(id), 0) AS id FROM telemetry_samples WHERE (? IS NULL OR device_id=?)').get(deviceId ?? null, deviceId ?? null).id;
  return {
    path,
    restore(deviceId) { return { latest: decode(deviceId === undefined ? db.prepare('SELECT * FROM telemetry_samples ORDER BY id DESC LIMIT 1').get() : db.prepare('SELECT * FROM telemetry_samples WHERE device_id=? ORDER BY id DESC LIMIT 1').get(deviceId)), storedCount: total(deviceId) }; },
    save(input, expectedDeviceId, receivedAt) {
      const validated = validateTelemetryMessage(input, expectedDeviceId);
      if (!validated.valid) return { error: validated.error };
      const message = validated.message;
      db.exec('BEGIN IMMEDIATE');
      try {
        const prior = db.prepare('SELECT MAX(sequence) AS sequence FROM telemetry_samples WHERE source=? AND device_id=? AND session_id=?').get(message.source, message.deviceId, message.sessionId);
        if (prior.sequence !== null && message.sequence <= prior.sequence) {
          db.exec('ROLLBACK'); return { error: 'Duplicate or out-of-order sequence.' };
        }
        const receipt = new Date(receivedAt).toISOString();
        const result = db.prepare(`INSERT INTO telemetry_samples(schema_version,source,device_id,session_id,sequence,sender_at_utc,received_at_utc,message_json) VALUES(?,?,?,?,?,?,?,?)`).run(message.schemaVersion, message.source, message.deviceId, message.sessionId, message.sequence, message.sampledAtUtc, receipt, JSON.stringify(message));
        const storedCount = total(expectedDeviceId);
        db.exec('COMMIT');
        return { record: { id: Number(result.lastInsertRowid), receivedAtUtc: receipt, message }, storedCount };
      } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
    },
    history({ limit = 10, deviceId, snapshot = maximumId(deviceId), before = snapshot + 1 } = {}) {
      if (![limit, snapshot, before].every(Number.isSafeInteger) || limit < 1 || limit > 100 || snapshot < 0 || before < 1) throw new Error('Invalid history pagination.');
      const rows = deviceId === undefined ? db.prepare('SELECT * FROM telemetry_samples WHERE id<=? AND id<? ORDER BY id DESC LIMIT ?').all(snapshot, before, limit + 1) : db.prepare('SELECT * FROM telemetry_samples WHERE device_id=? AND id<=? AND id<? ORDER BY id DESC LIMIT ?').all(deviceId, snapshot, before, limit + 1);
      const records = rows.slice(0, limit).map(decode);
      return { records, snapshot, nextBefore: rows.length > limit ? records.at(-1).id : null };
    },
    // Immutable append-only rows below this watermark form a consistent snapshot.
    exportSnapshot(deviceId) {
      const snapshot = maximumId(deviceId);
      const count = db.prepare("SELECT COUNT(*) AS count FROM telemetry_samples WHERE source='simulated' AND id<=? AND (? IS NULL OR device_id=?)").get(snapshot, deviceId ?? null, deviceId ?? null).count;
      return { snapshot, count };
    },
    exportBatch(snapshot, after, limit = 250, deviceId) {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 250) throw new Error('Invalid export batch size.');
      return db.prepare("SELECT * FROM telemetry_samples WHERE source='simulated' AND id<=? AND id>? AND (? IS NULL OR device_id=?) ORDER BY id LIMIT ?").all(snapshot, after, deviceId ?? null, deviceId ?? null, limit).map(decode);
    },
    close() { if (db.isOpen) db.close(); },
  };
}
