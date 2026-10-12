import { randomUUID } from 'node:crypto';
import { emptyDiagnostics, receiveDiagnostic } from '../src/app/data/diagnosticsV2.ts';
import { deviceCsv } from './device-csv.mjs';

// Entirely in-memory, backend-owned synthetic diagnostics. No storage or device transport.
export function createDiagnosticSimulator({ deviceId, now = Date.now, schedule = setInterval, cancel = clearInterval, onChange = () => {} }) {
  let state = emptyDiagnostics(deviceId), running = false, heartbeatPaused = false, sensorPaused = false;
  let heartbeatTimer, sensorTimer, bootAt, sessionId;
  const sequence = { device_heartbeat: 0, sensor_telemetry: 0, tamper_event: 0 };
  let imuMode = 'valid', lidState = 'UNKNOWN', mountState = 'UNKNOWN';
  const snapshot = () => ({ deviceId, running, heartbeatPaused, sensorPaused, state });
  const accept = input => { state = receiveDiagnostic(state, input, now()); onChange(snapshot()); return snapshot(); };
  const envelope = messageType => ({ schemaVersion: 2, messageType, source: 'simulated', deviceId, firmwareVersion: 'SIMULATOR-V2-REVIEW-1', sessionId, sequence: sequence[messageType]++, sampledAtUtc: null, clockSynchronized: false, uptimeMs: Math.max(0, Math.floor(now() - bootAt)) });
  const heartbeat = () => accept(envelope('device_heartbeat'));
  const sensor = () => {
    const e = envelope('sensor_telemetry'), phase = e.sequence % 4;
    return accept({ ...e, readStartUptimeMs: e.uptimeMs, readEndUptimeMs: e.uptimeMs,
      accelerationMps2: imuMode === 'valid' ? { x: [0, 0.12, -0.12, 0][phase], y: 0, z: 9.80665 } : null,
      angularVelocityRadPerSec: imuMode === 'valid' ? { x: 0, y: [0, 0.02, -0.02, 0][phase], z: 0 } : null,
      imuStatus: imuMode === 'valid' ? 'VALID' : imuMode === 'unavailable' ? 'UNKNOWN' : 'READ_ERROR', imuFaultCode: imuMode === 'fault' ? 'SENSOR_BURST_READ_FAILED' : null,
      axisFrame: 'MPU6050_CHIP', calibrationRef: null, lidState, mountState,
      switchStatus: lidState === 'UNKNOWN' && mountState === 'UNKNOWN' ? 'UNKNOWN' : lidState === 'UNKNOWN' || mountState === 'UNKNOWN' ? 'FAULT' : 'VALID',
      switchFaultCode: lidState === 'UNKNOWN' && mountState === 'UNKNOWN' ? null : lidState === 'UNKNOWN' ? 'LID_INPUT_UNAVAILABLE' : mountState === 'UNKNOWN' ? 'MOUNT_INPUT_UNAVAILABLE' : null,
      securityState: null, batteryVoltageV: null, batterySocPercent: null, timeToEmptySeconds: null, solarPowerW: null, windPowerW: null, latitudeDeg: null, longitudeDeg: null, gpsFixValid: null, speedKmh: null, electromagneticBrakeActive: null });
  };
  const clearHeartbeat = () => { if (heartbeatTimer !== undefined) cancel(heartbeatTimer); heartbeatTimer = undefined; };
  const clearSensor = () => { if (sensorTimer !== undefined) cancel(sensorTimer); sensorTimer = undefined; };
  const startHeartbeat = () => { if (heartbeatTimer === undefined) heartbeatTimer = schedule(heartbeat, 5000); };
  const startSensor = () => { if (sensorTimer === undefined) sensorTimer = schedule(sensor, 3000); };
  const action = name => {
    if (name === 'start') {
      if (!running) {
        running = true; heartbeatPaused = false; sensorPaused = false;
        if (!sessionId) { sessionId = randomUUID(); bootAt = now(); heartbeat(); }
        startHeartbeat(); startSensor();
      }
    } else if (name === 'stop') { running = false; clearHeartbeat(); clearSensor(); }
    else {
      if (!running) throw Error('Start simulated diagnostics first.');
      if (name === 'pause-heartbeat') { heartbeatPaused = true; clearHeartbeat(); }
      else if (name === 'resume-heartbeat') { heartbeatPaused = false; startHeartbeat(); }
      else if (name === 'pause-sensor') { sensorPaused = true; clearSensor(); }
      else if (name === 'resume-sensor') { sensorPaused = false; startSensor(); }
      else if (name === 'inject-event') accept({ ...envelope('tamper_event'), eventType: 'MOTION_TAMPER_DETECTED', detectorVersion: 'INJECTED-SYNTHETIC-NO-CLASSIFIER', securityState: null, evidenceTelemetrySequence: null });
      else {
        const modes = { 'imu-valid': 'valid', 'imu-unavailable': 'unavailable', 'imu-fault': 'fault' };
        if (modes[name]) imuMode = modes[name];
        else if (name === 'lid-open') lidState = 'OPEN';
        else if (name === 'lid-closed') lidState = 'CLOSED';
        else if (name === 'mount-attached') mountState = 'ATTACHED';
        else if (name === 'mount-released') mountState = 'DETACHED';
        else throw Error('Unknown diagnostic action.');
        // Controls select the next fixture; a paused sensor produces no report.
      }
    }
    onChange(snapshot()); return snapshot();
  };
  return { snapshot, accept, action, close() { running = false; clearHeartbeat(); clearSensor(); } };
}

export function installDiagnostics(app, { access, deviceId, origin, now, schedule, cancel, writeSseFrame, deviceReceiver }) {
  const clients = new Set();
  const disconnect = res => { clients.delete(res); res.destroy(); };
  const send = (res, frame) => {
    if (!access.canStream(res.sessionId, res.deviceId)) { if (!res.destroyed) res.end('event: auth-required\ndata: {}\n\n'); clients.delete(res); return; }
    writeSseFrame(res, frame, disconnect);
  };
  const broadcast = snapshot => {
    for (const res of clients) send(res, `event: state\ndata: ${JSON.stringify(snapshot)}\n\n`);
  };
  const simulator = deviceReceiver ?? createDiagnosticSimulator({ deviceId, now, schedule, cancel, onChange: broadcast });
  const unsubscribe = deviceReceiver?.subscribe(broadcast);
  app.use('/api/diagnostics', access.requireDevice(deviceId));
  app.get('/api/diagnostics/latest', (_req, res) => res.json(simulator.snapshot()));
  app.get('/api/diagnostics/events', (_req, res) => deviceReceiver ? res.json({ mode: 'device', events: deviceReceiver.history() }) : res.json({ mode: 'simulated', events: simulator.snapshot().state.events }));
  app.get('/api/diagnostics/export.csv', (req, res) => {
    if (!deviceReceiver) return res.status(409).json({ error: 'Real device receiver is not enabled. Use the separate simulated export.' });
    const limit = req.query.limit === undefined ? 1000 : Number(req.query.limit);
    const afterId = req.query.afterId === undefined ? 0 : Number(req.query.afterId);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10000 || !Number.isSafeInteger(afterId) || afterId < 0 || (req.query.eventsOnly !== undefined && !['true', 'false'].includes(req.query.eventsOnly))) return res.status(400).json({ error: 'Invalid export bounds.' });
    try {
      const records = deviceReceiver.records({ limit, afterId, eventsOnly: req.query.eventsOnly === 'true' });
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="solair-real-device-v2.csv"', 'X-Telemetry-Record-Count': String(records.length), 'X-Next-After-Id': String(records.at(-1)?.id ?? afterId) }).send(deviceCsv(records));
    } catch { res.status(503).json({ error: 'Device storage unavailable.' }); }
  });
  app.get('/api/diagnostics/stream', (req, res) => {
    // Same origin/session/device enforcement as v1; no protected state in URLs.
    if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: 'Unexpected origin.' });
    if (clients.size >= 32) return res.status(503).json({ error: 'Diagnostic stream capacity reached.' });
    res.set({ 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.sessionId = req.sessionID; res.deviceId = req.deviceId;
    res.flushHeaders(); clients.add(res); res.on('close', () => clients.delete(res));
    send(res, `retry: 2000\nevent: state\ndata: ${JSON.stringify(simulator.snapshot())}\n\n`);
  });
  const actions = ['start', 'stop', 'pause-heartbeat', 'resume-heartbeat', 'pause-sensor', 'resume-sensor', 'imu-valid', 'imu-unavailable', 'imu-fault', 'lid-open', 'lid-closed', 'mount-attached', 'mount-released', 'inject-event'];
  app.post('/api/diagnostics/simulator/:action', access.csrf, (req, res) => {
    if (deviceReceiver) return res.status(409).json({ error: 'Real device mode: synthetic diagnostics disabled.' });
    if (!actions.includes(req.params.action)) return res.status(404).json({ error: 'Unknown diagnostic action.' });
    try { res.json(simulator.action(req.params.action)); }
    catch { res.status(409).json({ error: 'Start simulated diagnostics first.' }); }
  });
  return { simulator, clientCount: () => clients.size,
    tick() { for (const res of clients) send(res, ': diagnostic stream keepalive\n\n'); },
    checkAuth() { for (const res of clients) if (!access.canStream(res.sessionId, res.deviceId)) send(res, ''); },
    close() { unsubscribe?.(); if (!deviceReceiver) simulator.close(); for (const res of clients) disconnect(res); } };
}
