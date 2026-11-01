import { SerialBench } from './Serial';
import type { Telemetry } from '../packages/telemetry-contract';

// Offline presentation of the existing USB contract. No ingestion, firmware
// configuration, calibration writes, or automatic device commands. Explicit bench arm/disarm is supported.
const usb = new SerialBench();
const el = (id: string) => document.getElementById(id)!;
const button = (id: string) => el(id) as HTMLButtonElement;
const number = (v: number | null | undefined, unit = '', places = 2) =>
  v == null ? 'not available' : `${v.toFixed(places)}${unit ? ` ${unit}` : ''}`;
const yes = (v: boolean | null | undefined) => v == null ? 'not reported' : v ? 'yes' : 'no';
let latest: Telemetry | null = null;
let receivedAt = 0;
let opening = false;
let accepted = 0;
let ignored = 0;
const messages: string[] = [];
const observations: unknown[] = [];

function log(message: string) {
  messages.push(`${new Date().toLocaleTimeString()}  ${message.slice(0, 500)}`);
  if (messages.length > 60) messages.shift();
  el('log').textContent = messages.join('\n');
}
function row(id: string, status: string, reading: string) {
  el(`${id}-status`).textContent = status;
  el(`${id}-reading`).textContent = reading;
}
function resetRows(status: string) {
  for (const id of ['esp', 'lid', 'mount', 'imu', 'ads', 'acs', 'pzem', 'gps', 'lte', 'alarm']) row(id, status, '—');
}
function isFresh() { return usb.active && latest !== null && Date.now() - receivedAt < 10000; }
function canArm() {
  return isFresh() && latest!.device_uptime_ms >= 10000 &&
    latest!.lid_state === 'secure' &&
    (latest!.firmware_version.includes('/lid-only') || latest!.mount_state === 'secure') && latest!.armed !== true;
}
function refreshConnection() {
  const fresh = isFresh();
  button('connect').disabled = opening || usb.active;
  button('disconnect').disabled = !usb.active;
  button('led').disabled = !fresh;
  button('arm').disabled = !canArm();
  button('standalone').disabled = !canArm() || !latest?.firmware_version.startsWith('solair-cpe-2.0.20');
  button('lte-stop').disabled = !fresh;
  button('disarm').disabled = !usb.active;
  button('save').disabled = observations.length === 0;
  const age = receivedAt ? Math.floor((Date.now() - receivedAt) / 1000) : null;
  el('connection').textContent = !usb.active
    ? (opening ? 'Opening USB…' : 'Disconnected — readings are not live')
    : !latest ? 'USB open · waiting for a complete hardware report'
    : fresh ? `LIVE USB · report #${latest.sequence} · received ${age}s ago`
    : `STALE · no accepted live report for ${age}s · readings cleared`;
  el('connection').className = fresh ? 'live' : 'notice';
  if (!fresh) resetRows(usb.active && latest ? 'stale' : 'not live');
}
function render(t: Telemetry) {
  const c = t.cpe!;
  row('esp', 'report received', `${t.device_id} · ${t.firmware_version} · uptime ${number(t.device_uptime_ms / 1000, 's', 0)}`);
  row('lid', t.lid_state ?? 'not reported', `GPIO25 · raw ${t.lid_raw ?? '—'} · security ${t.security_state ?? (t.armed ? 'ARMED' : 'DISARMED')}`);
  row('mount', t.firmware_version.includes('/lid-only') ? 'disabled' : t.mount_state ?? 'not reported', `GPIO26 · raw ${t.mount_raw ?? '—'}`);
  const imuHealth = t.firmware_version.includes('imu6500-compatible')
    ? t.sensor_health.mpu6500_compatible : t.sensor_health.mpu6050;
  row('imu', imuHealth ?? 'see diagnostic',
    `${c.imu_diagnostic ?? 'diagnostic not reported'} · acceleration ${t.accelerometer?.map(v => v.toFixed(2)).join(', ') ?? '—'} m/s² · gyro ${t.gyroscope?.map(v => v.toFixed(3)).join(', ') ?? '—'} °/s · motion detection ${c.motion?.enabled ? 'enabled' : 'disabled/not reported'}`);
  row('ads', c.acs.adc_diagnostic ?? 'not reported',
    `ACS input: ${c.acs.adc_source ?? 'not reported'} · A1 ${number(c.acs.adc_mv, 'mV', 3)} · sample age ${number(c.acs.adc_age_ms, 'ms', 0)}`);
  row('acs', c.acs.quality === 'ok' ? 'firmware reports calibrated' : c.acs.quality,
    c.acs.quality === 'ok'
      ? `Current ${number(c.acs.current_a, 'A', 3)} · independent reference checks still required for acceptance`
      : `Current not validated · sensor output ${number(t.acs_output_v, 'V', 3)} · zero/reference calibration required`);
  row('pzem', c.pzem.quality === 'ok' ? 'readings received' : c.pzem.quality, c.pzem.quality === 'ok'
    ? `${number(c.pzem.voltage_v, 'V')} · ${number(c.pzem.current_a, 'A')} · ${number(c.pzem.power_w, 'W')} · ${number(c.pzem.energy_wh, 'Wh')} · source ${c.meter_source}`
    : `${c.pzem_diagnostic ?? 'no valid readings'} · check its separate power and RS485 connection`);
  row('gps', t.gps_fix ? 'fix reported' : (c.gps.sentences_passed ?? 0) > 0 ? 'receiving · no fix' : c.gps.quality,
    `Fix ${yes(t.gps_fix)} · satellites ${t.satellites ?? '—'} · received characters ${c.gps.chars_processed ?? '—'} · valid sentences ${c.gps.sentences_passed ?? '—'} · last byte ${number(c.gps.last_byte_age_ms, 'ms', 0)} · fix age ${number(t.gps_fix_age_ms, 'ms', 0)}`);
  row('lte', c.lte_http_status === 200 ? 'HTTP 200 reported · verify server' : 'upload not confirmed',
    `AT detected ${yes(c.lte.at_detected)} · registered ${yes(c.lte.registered)} · attached ${yes(c.lte.attached)} · HTTP ${c.lte_http_status ?? '—'} · ${c.lte_diagnostic ?? 'diagnostic not reported'}${c.lte_tls_error ? ` · ${c.lte_tls_error}` : ''} · Server delivery is not verified by this reader.`);
  row('alarm', c.alarm.commanded ? 'commanded ON' : 'commanded OFF',
    `GPIO${t.firmware_version.includes('/alarm26') ? 26 : 27} level ${c.alarm.output_level ?? 'not reported'} · reason ${c.alarm.reason ?? 'none'} · physical sound/output is not instrumented`);
}
function receive(t: Telemetry) {
  if (t.source_type !== 'hardware' || t.transport !== 'usb' || !t.cpe || t.cpe.historical) {
    ignored++; log('Ignored historical, non-hardware, non-USB or non-CPE report.'); return;
  }
  // Replayed/out-of-order rows must not keep the live indicator alive.
  if (latest && latest.boot_id === t.boot_id && t.sequence <= latest.sequence) {
    ignored++; log('Ignored duplicate/out-of-order report.'); return;
  }
  latest = t; receivedAt = Date.now(); accepted++;
  refreshConnection(); render(t);
  // Retain only diagnostic fields; exclude endpoint addresses and credentials.
  const diagnostics = { ...t.cpe };
  delete diagnostics.lte_endpoint;
  observations.push({ received_at: new Date(receivedAt).toISOString(), device_id: t.device_id,
    firmware_version: t.firmware_version, boot_id: t.boot_id, sequence: t.sequence,
    device_uptime_ms: t.device_uptime_ms, sensor_health: t.sensor_health,
    lid_state: t.lid_state, mount_state: t.mount_state, lid_raw: t.lid_raw, mount_raw: t.mount_raw,
    accelerometer: t.accelerometer, gyroscope: t.gyroscope, acs_output_v: t.acs_output_v,
    gps_fix: t.gps_fix, satellites: t.satellites, gps_fix_age_ms: t.gps_fix_age_ms, cpe: diagnostics });
  if (observations.length > 120) observations.shift();
  button('save').disabled = false;
}
button('connect').onclick = async () => {
  opening = true; latest = null; receivedAt = 0; refreshConnection();
  try {
    await usb.connect(115200, receive, log, () => { refreshConnection(); log('USB closed.'); });
    log('USB opened at 115200 baud. No automatic commands sent.');
  } catch (error) { log((error as Error).message); }
  finally { opening = false; refreshConnection(); }
};
button('disconnect').onclick = async () => {
  try { await usb.disconnect(); } catch (error) { log((error as Error).message); }
  refreshConnection();
};
for (const [id, command] of [['led', 'led_test'], ['arm', 'arm'], ['standalone', 'standalone_arm'], ['lte-stop', 'lte_stop'], ['disarm', 'disarm']]) {
  button(id).onclick = async () => {
    if (command === 'disarm' ? !usb.active : command === 'standalone_arm' ? !canArm() || !latest?.firmware_version.startsWith('solair-cpe-2.0.20') : command === 'arm' ? !canArm() : !isFresh()) return;
    try { await usb.command(command); log(`${command} sent — observe the hardware / next report; sending is not proof of execution.`); }
    catch (error) { log((error as Error).message); }
  };
}
button('save').onclick = () => {
  const report = { tool: 'SOLAIR offline assembly USB reader', generated_at: new Date().toISOString(),
    evidence_type: 'USB reports only — not a physical acceptance certificate', live_at_export: isFresh(),
    accepted_reports: accepted, ignored_reports: ignored, retained_reports: observations.length,
    limitations: ['Supply rails require a meter.', 'ACS zero and independent current reference remain required.',
      'PZEM readings require an independent reference.', 'LTE delivery requires fresh server receipts with USB forwarding off.',
      'Motion, LED and siren require physical observation.'], observations };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'SOLAIR-assembly-USB-report.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
if (!window.isSecureContext || !('serial' in navigator)) {
  el('support').textContent = 'USB access is unavailable in this browser/context. Open this file in desktop Chrome or Edge. If local files are blocked, use the same file through the existing localhost app.';
  button('connect').disabled = true;
} else {
  setInterval(refreshConnection, 1000);
  refreshConnection();
}
