import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth';
import { RealEventHistory } from './RealEventHistory';
import { DeviceOverview } from './DeviceOverview';
import { deviceConnectionState, diagnosticFreshness, parseDiagnosticSnapshot, type DiagnosticSnapshot, type Vector } from '../data/diagnosticsV2';

const timestamp = (value: string | null | undefined) => value ?? 'Unavailable';
const axes = (v: Vector | null | undefined) => v ? `X ${v.x} · Y ${v.y} · Z ${v.z}` : 'Unavailable';
export function DeviceDiagnostics({ onSnapshot }: { onSnapshot?: (value: DiagnosticSnapshot | null) => void }) {
  const auth = useAuth();
  const deviceId = auth.session?.authenticated ? auth.session.deviceId : undefined;
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);
  const [connection, setConnection] = useState('CONNECTING');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(Date.now);
  const active = useRef(0);
  useEffect(() => { onSnapshot?.(snapshot); }, [snapshot, onSnapshot]);
  useEffect(() => {
    const generation = ++active.current;
    setSnapshot(null); setError(''); setPending(false);
    if (!deviceId) return;
    const stream = new EventSource('/api/diagnostics/stream');
    stream.onopen = () => setConnection('CONNECTED');
    stream.onerror = () => { setConnection('DISCONNECTED / RECONNECTING'); void auth.check().catch(() => {}); };
    stream.addEventListener('auth-required', () => { stream.close(); setSnapshot(null); auth.signedOut(); });
    stream.addEventListener('state', event => {
      if (active.current !== generation) return;
      try { setSnapshot(parseDiagnosticSnapshot(JSON.parse((event as MessageEvent).data), deviceId)); setError(''); }
      catch { setError('Invalid diagnostic snapshot. Last accepted readings retained.'); }
    });
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => { active.current++; stream.close(); window.clearInterval(timer); };
  }, [deviceId]);
  async function action(name: string) {
    const generation = active.current;
    setPending(true); setError('');
    try {
      const response = await auth.request(`/api/diagnostics/simulator/${name}`, { method: 'POST', signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw Error(`Diagnostic control failed (${response.status}).`);
      const value = parseDiagnosticSnapshot(await response.json(), deviceId!);
      if (generation === active.current) setSnapshot(value);
    } catch (e) { if (generation === active.current) setError(e instanceof Error ? e.message : 'Diagnostic control failed.'); }
    finally { if (generation === active.current) setPending(false); }
  }
  if (!deviceId) return null;
  const real = snapshot?.mode === 'device';
  const state = snapshot?.state, sensor = state?.sensor?.message;
  const live = deviceConnectionState(state, now, snapshot?.heartbeatIntervalMs);
  const current = [state?.heartbeat, state?.sensor].filter(Boolean).sort((a, b) => a!.receivedAtUtc.localeCompare(b!.receivedAtUtc)).at(-1)?.message;
  const securityRecords = [state?.sensor, ...(state?.events ?? []).filter(e => e.message.sessionId === state?.activeSessionId)].filter(Boolean);
  const latestSecurity = securityRecords.sort((a, b) => a!.message.uptimeMs - b!.message.uptimeMs).at(-1)?.message.securityState;
  const heartbeat = diagnosticFreshness(state?.heartbeat?.receivedAtUtc, now, 15000);
  const report = diagnosticFreshness(state?.sensor?.receivedAtUtc, now);
  const measurement = diagnosticFreshness(state?.lastValidImu?.receivedAtUtc, now);
  const retained = sensor?.imuStatus !== 'VALID' || !state?.sensor;
  const imu = retained ? state?.lastValidImu?.message : sensor;
  const outdated = retained || measurement.status === 'STALE' || measurement.status === 'DISCONNECTED';
  const button = (name: string, label: string, requiresRunning = true) => <button key={name} type="button" disabled={pending || !snapshot || (requiresRunning && !snapshot.running)} onClick={() => void action(name)} className="px-4 py-2 rounded-xl text-sm disabled:opacity-50" style={{ backgroundColor: '#FFB300', color: '#121212', minHeight: 44 }}>{label}</button>;
  const age = (value: ReturnType<typeof diagnosticFreshness>) => `${value.status} · ${value.ageSeconds === null ? 'No receipt yet' : `${value.ageSeconds} s`}`;
  return <>
    <DeviceOverview deviceId={deviceId} snapshot={snapshot} now={now} connection={connection} />
    <details className="solair-device-monitor mb-5 p-4 rounded-2xl space-y-3" style={{ backgroundColor: '#1E1E1E', color: '#9E9E9E' }}>
    <summary className="cursor-pointer py-2" style={{ color: '#FFB300', fontWeight: 600 }}>{deviceId} · Device monitoring</summary>
    <p style={{ color: '#00E5FF', fontWeight: 600 }}>{snapshot ? real ? `${snapshot.provenance ?? 'REAL DEVICE'} · Wi-Fi HTTP` : 'SIMULATED DIAGNOSTICS' : 'Awaiting backend diagnostics'}</p>
    <p className="text-sm">{real ? 'Token-bound HTTP → validation → SQLite → authenticated SSE. Physical verification pending. Dashboard controls remain demos.' : 'Synthetic diagnostics; proposed v2 agreement awaiting team approval.'}</p>
    <p className="text-sm">Device ID: {deviceId} · Reported firmwareVersion: {state?.heartbeat?.message.firmwareVersion ?? 'Unavailable'}</p>
    <p className="text-sm">DEVICE · Boot/session: {state?.activeSessionId ?? 'Unavailable'}<br />Latest live sequence: {current?.sequence ?? 'Unavailable'} ({current?.messageType ?? 'No report'})<br />CONNECTION · {live.status}<br />Last accepted live receipt: {timestamp(live.receivedAtUtc)} · Age: {live.ageSeconds === null ? 'No device data received' : `${live.ageSeconds} s`}<br />FIRMWARE · Uptime: {current?.uptimeMs ?? 'Unavailable'} ms · Clock: {current ? current.clockSynchronized ? 'Synchronized' : 'Unsynchronized' : 'Unavailable'}<br />Sender UTC: {timestamp(current?.sampledAtUtc)}</p>
    <p className="text-sm">Browser SSE: {connection} · {real ? 'Device receiver enabled; simulation disabled' : snapshot?.running ? 'Simulator running' : 'Simulator stopped (opt-in)'}</p>
    {error && <p role="alert" style={{ color: '#FFB300' }}>ERROR: {error}</p>}
    {Object.entries(state?.errors ?? {}).map(([type, message]) => <p key={type} role="alert" style={{ color: '#FFB300' }}>ERROR — {type}: {message}. Accepted readings retained.</p>)}
    {!real && <div className="flex flex-wrap gap-2">
      {button(snapshot?.running ? 'stop' : 'start', snapshot?.running ? 'Stop diagnostics' : 'Start simulated diagnostics', false)}
      {button(snapshot?.heartbeatPaused ? 'resume-heartbeat' : 'pause-heartbeat', snapshot?.heartbeatPaused ? 'Resume heartbeat' : 'Pause heartbeat')}
      {button(snapshot?.sensorPaused ? 'resume-sensor' : 'pause-sensor', snapshot?.sensorPaused ? 'Resume sensor' : 'Pause sensor')}
    </div>}
    <div className="text-sm space-y-2" aria-live="off">
      <p>Latest heartbeat receipt (UTC): {timestamp(state?.heartbeat?.receivedAtUtc)}<br />Heartbeat age: {age(heartbeat)}</p>
      <p>Diagnostic sensor sample receipt (UTC): {timestamp(state?.sensor?.receivedAtUtc)}<br />Sensor report age: {age(report)}</p>
      <p>Last valid IMU receipt (UTC): {timestamp(state?.lastValidImu?.receivedAtUtc)}<br />Valid IMU measurement age: {age(measurement)}</p>
      <p>Sensor sampledAtUtc: {timestamp(sensor?.sampledAtUtc)} · {sensor?.clockSynchronized ? 'Sender UTC synchronized' : 'Sender clock unsynchronized; transit age unknown'}.</p>
      <p style={{ color: outdated ? '#FFB300' : '#ffffff' }}>MPU6050 {imu ? outdated ? 'OUTDATED readings retained' : real ? snapshot?.provenance === 'TEST FIXTURE' ? 'TEST FIXTURE values; not physical measurements' : 'device-reported values (uncalibrated; physical verification pending)' : 'synthetic readings' : 'WAITING / unavailable'}<br />accelerationMps2 (m/s²): {axes(imu?.accelerationMps2)}<br />angularVelocityRadPerSec (rad/s): {axes(imu?.angularVelocityRadPerSec)}</p>
      <p>imuStatus: {sensor?.imuStatus ?? 'UNKNOWN'} · imuFaultCode: {sensor?.imuFaultCode ?? 'None'}{sensor && sensor.imuStatus !== 'VALID' ? ' · Current IMU unavailable' : ''}<br />axisFrame: MPU6050_CHIP · calibrationRef: {sensor?.calibrationRef ?? 'Unavailable'}</p>
      <p>lidState: {sensor?.lidState ?? 'UNKNOWN'} · mountState: {sensor?.mountState ?? 'UNKNOWN'}<br />switchStatus: {sensor?.switchStatus ?? 'UNKNOWN'} · switchFaultCode: {sensor?.switchFaultCode ?? 'None'}<br />Reported securityState: {sensor?.securityState ?? 'Unavailable'}</p>
    </div>
    <p className="text-xs">Device ONLINE uses accepted live heartbeat/sensor receipts. STALE at 3 heartbeat intervals; OFFLINE at 6 ({snapshot?.heartbeatIntervalMs ?? 5000} ms per interval). Historical events never refresh device liveness. Browser SSE is separate. Sensor freshness keeps independent 10/30-second thresholds. Timings remain provisional.</p>
    <p className="text-sm">SECURITY · {latestSecurity ?? 'Unavailable'}<br />Latest received tamper event: {state?.events[0]?.message.eventType ?? 'No events received'}<br />PROVENANCE · {snapshot ? real ? snapshot.provenance ?? 'REAL DEVICE' : 'SIMULATED' : 'Unavailable'}</p>
    {real && <RealEventHistory deviceId={deviceId} acceptedCount={state?.acceptedCount ?? 0} />}
    {!real && <p className="text-sm">Synthetic test actions select the next sensor fixture; paused sensors send nothing. Switches and motion do not classify tampering or change demo security.</p>}
    {!real && <div className="flex flex-wrap gap-2">{[
      ['imu-valid', 'MPU6050 valid fixture'], ['imu-unavailable', 'MPU6050 unavailable'], ['imu-fault', 'MPU6050 fault'],
      ['lid-open', 'Lid open'], ['lid-closed', 'Lid closed'], ['mount-attached', 'Mount attached'], ['mount-released', 'Mount released (DETACHED)'], ['inject-event', 'Inject synthetic tamper event'],
    ].map(([name, label]) => button(name, label))}</div>}
    <h3 style={{ color: '#ffffff' }}>Recent diagnostic events ({state?.events.length ?? 0}/20)</h3>
    <p className="text-xs">{real ? 'Persisted in data/device-telemetry.sqlite before display. Latest 20 shown; authenticated /api/diagnostics/events returns latest 100. Sender uptime and server receipt are separate; offline delivery time is not detection time.' : 'In-memory synthetic events; reset on backend restart. Excluded from telemetry CSV.'}</p>
    {!state?.events.length && <p className="text-sm">No diagnostic events yet.</p>}
    <ul className="space-y-3 text-sm">{state?.events.map(({ message, receivedAtUtc }) => <li key={`${message.sessionId}:${message.sequence}`} className="break-words">
      <strong style={{ color: '#FFB300' }}>{message.source === 'device' ? snapshot?.provenance ?? 'REAL DEVICE' : 'SIMULATED'} — {message.eventType}</strong><br />Event ID: {message.deviceId}:{message.sessionId}:{message.sequence}<br />Device: {message.deviceId} · Session: {message.sessionId} · Sequence: {message.sequence}<br />Security: {message.securityState ?? 'Unavailable'}<br />sampledAtUtc: {timestamp(message.sampledAtUtc)} · uptimeMs: {message.uptimeMs}<br />Receipt (UTC): {receivedAtUtc}<br />detectorVersion: {message.detectorVersion}<br />Delivery: {real ? 'Durably accepted; retry details in authenticated history/export' : 'Synthetic in-memory fixture'}
    </li>)}</ul>
  </details></>;
}

