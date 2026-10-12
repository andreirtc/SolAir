import express from 'express';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { demoTelemetry } from '../src/app/data/demoTelemetry.ts';
import { createSimulatedMessage, startSampleTimer } from '../src/app/data/telemetrySimulation.ts';
import { openTelemetryStorage } from './telemetry-storage.mjs';
import { streamSimulatedCsv } from './telemetry-csv.mjs';
import { openAuthStorage, installAuth, authStoragePath } from './auth.mjs';
import { installDiagnostics } from './diagnostics.mjs';

// Local simulated telemetry; commits precede all accepted SSE state changes.
export function writeSseFrame(res, frame, disconnect) {
  if (res.destroyed || !res.write(frame)) disconnect(res);
}
export function createBackend({ deviceReceiver, origin = 'http://127.0.0.1:5173', allowedHosts = ['127.0.0.1:3001', '127.0.0.1:5173'], now = Date.now, schedule = setInterval, cancel = clearInterval, databasePath, storage = openTelemetryStorage(databasePath), authDatabasePath, authNow = Date.now, authLifetime, localDevelopment = process.env.SOLAIR_LOCAL_HTTP === '1', startPaused = process.env.SOLAIR_SIMULATOR_PAUSED === '1' } = {}) {
  const app = express();
  let auth;
  try { if (authStoragePath(authDatabasePath) === storage.path && storage.path !== ':memory:') throw new Error('Authentication and telemetry databases must be separate.'); auth = openAuthStorage(authDatabasePath, authNow); }
  catch (error) { auth?.close(); storage.close(); throw error; }
  const backendId = randomUUID();
  let restored;
  try { restored = storage.restore(demoTelemetry.deviceId); } catch (error) { auth.close(); storage.close(); throw error; }
  let reception = { message: restored.latest?.message ?? null, receivedAt: restored.latest ? Date.parse(restored.latest.receivedAtUtc) : null, count: restored.storedCount, validationError: null };
  let sessionCount = 0;
  let storageError = null;
  let paused = startPaused;
  let sequence = 0;
  let stopSamples;
  const clients = new Set();
  const snapshot = () => ({ backendId, message: reception.message, receivedAt: reception.receivedAt, count: reception.count, storedCount: reception.count, sessionCount, storageError, validationError: reception.validationError, paused });
  const disconnect = res => { clients.delete(res); res.destroy(); };
  // Never queue subsequent writes after backpressure: disconnect and let SSE reconnect.
  const send = (res, frame) => {
    if (!access.canStream(res.sessionId, res.deviceId)) { if (!res.destroyed) res.end('event: auth-required\ndata: {}\n\n'); clients.delete(res); return; }
    writeSseFrame(res, frame, disconnect);
  };
  const broadcast = () => { const frame = `event: state\ndata: ${JSON.stringify(snapshot())}\n\n`; for (const res of clients) send(res, frame); };
  const accept = input => {
    try {
      const result = storage.save(input, demoTelemetry.deviceId, now());
      if (result.error) reception = { ...reception, validationError: result.error };
      else {
        reception = { message: result.record.message, receivedAt: Date.parse(result.record.receivedAtUtc), count: result.storedCount, validationError: null };
        sessionCount++; storageError = null;
      }
    } catch {
      storageError = 'Telemetry storage write failed. Sample was not saved; accepted readings and receipt time retained. Check database access and available disk space.';
      console.error(storageError);
    }
    broadcast();
    return snapshot();
  };
  const resume = () => { if (stopSamples) return; paused = false; stopSamples = startSampleTimer(() => accept(createSimulatedMessage(demoTelemetry, ++sequence, backendId, now())), schedule, cancel); };
  const pause = () => { stopSamples?.(); stopSamples = undefined; paused = true; };
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!allowedHosts.includes(req.headers.host)) return res.status(403).json({ error: 'Unexpected local host.' });
    next();
  });
  app.use(express.json({ limit: '2kb' }));
  let access;
  try { access = installAuth(app, { auth, origin, localDevelopment, now: authNow, lifetime: authLifetime }); }
  catch (error) { auth.close(); storage.close(); throw error; }
  app.get('/api/health', (_req, res) => res.status(storageError ? 503 : 200).json({ ok: !storageError }));
  app.use(['/api/telemetry', '/api/simulator'], access.requireDevice(demoTelemetry.deviceId));
  app.get('/api/telemetry/latest', (_req, res) => res.json(snapshot()));
  app.get('/api/telemetry/history', (req, res) => {
    const parse = (key, fallback) => req.query[key] === undefined ? fallback : typeof req.query[key] === 'string' && /^\d+$/.test(req.query[key]) ? Number(req.query[key]) : NaN;
    const limit = parse('limit', 10), snapshot = parse('snapshot', undefined), before = parse('before', undefined);
    if ((snapshot !== undefined && (!Number.isSafeInteger(snapshot) || snapshot < 0)) || (before !== undefined && (!Number.isSafeInteger(before) || before < 1)) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: 'Invalid history pagination; limit must be 1–100.' });
    try { res.json(storage.history({ limit, snapshot, before, deviceId: req.deviceId })); }
    catch { res.status(503).json({ error: 'Telemetry history could not be read from storage.' }); }
  });
  let exporting = false;
  app.get('/api/telemetry/export.csv', async (req, res) => {
    if (exporting) return res.status(503).json({ error: 'An export is already running; retry shortly.' });
    exporting = true;
    try { await streamSimulatedCsv(storage, res, req.deviceId, () => access.canStream(req.sessionID, req.deviceId)); }
    catch { console.error('Telemetry CSV export failed or download disconnected.'); if (!res.headersSent && !res.destroyed) res.status(503).json({ error: 'Telemetry CSV export failed.' }); else res.destroy(); }
    finally { exporting = false; }
  });
  app.get('/api/telemetry/stream', (req, res) => {
    if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: 'Unexpected origin.' });
    if (clients.size >= 32) return res.status(503).json({ error: 'Stream capacity reached.' });
    res.set({ 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.sessionId = req.sessionID; res.deviceId = req.deviceId;
    res.flushHeaders(); clients.add(res);
    res.on('close', () => clients.delete(res));
    send(res, `retry: 2000\nevent: state\ndata: ${JSON.stringify(snapshot())}\n\n`);
  });
  app.post('/api/simulator/:action', access.csrf, (req, res) => {
    if (req.headers.origin !== origin) return res.status(403).json({ error: 'Expected local frontend origin required.' });
    if (req.params.action === 'pause') pause();
    else if (req.params.action === 'resume') resume();
    else return res.status(404).json({ error: 'Unknown simulator action.' });
    broadcast(); res.json(snapshot());
  });
  const diagnostics = installDiagnostics(app, { access, deviceId: demoTelemetry.deviceId, origin, now, schedule, cancel, writeSseFrame, deviceReceiver });
  const heartbeat = schedule(() => { for (const res of clients) send(res, ': heartbeat\n\n'); diagnostics.tick(); }, 5000);
  const authClock = setInterval(() => { for (const res of clients) if (!access.canStream(res.sessionId, res.deviceId)) send(res, ''); diagnostics.checkAuth(); }, 1000);
  authClock.unref();
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  app.use((error, _req, res, _next) => { if (res.headersSent) return res.destroy(); res.status(error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 503).json({ error: 'Request could not be processed.' }); });
  if (!startPaused) resume();
  return { app, accept, snapshot, diagnostics, clientCount: () => clients.size, close() { pause(); diagnostics.close(); cancel(heartbeat); clearInterval(authClock); for (const res of clients) disconnect(res); storage.close(); auth.close(); } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const backend = createBackend();
  const server = backend.app.listen(3001, '127.0.0.1', () => console.log('SolAir simulated backend: http://127.0.0.1:3001 (local SQLite)'));
  server.on('error', error => { backend.close(); console.error(`Backend startup failed: ${error.code}. Port 3001 must be free; no processes were stopped.`); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { backend.close(); server.close(); server.closeAllConnections(); });
}
