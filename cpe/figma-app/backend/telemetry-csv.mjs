import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const csvColumns = [
  ['record_id', r => r.id], ['schema_version', r => r.message.schemaVersion],
  ['source', r => r.message.source], ['device_id', r => r.message.deviceId],
  ['session_id', r => r.message.sessionId], ['sequence', r => r.message.sequence],
  ['sender_time_utc', r => r.message.sampledAtUtc], ['server_receipt_time_utc', r => r.receivedAtUtc],
  ...['batteryVoltageV', 'batterySocPercent', 'timeToEmptySeconds', 'solarPowerW', 'windPowerW', 'latitudeDeg', 'longitudeDeg', 'gpsFixValid', 'securityState', 'speedKmh', 'electromagneticBrakeActive'].map((field, i) => [
    ['battery_voltage_V', 'battery_soc_percent', 'time_to_empty_seconds', 'solar_power_W', 'wind_power_W', 'latitude_deg', 'longitude_deg', 'gps_fix_valid', 'security_state', 'speed_km_h', 'electromagnetic_brake_active'][i], r => r.message[field],
  ]),
];
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export async function streamSimulatedCsv(storage, res, deviceId, authorized = () => true) {
  const { snapshot, count } = storage.exportSnapshot(deviceId);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="SolAir_SIMULATED_${new Date().toISOString().replaceAll(':', '-')}.csv"`, 'X-Telemetry-Record-Count': String(count) });
  async function* rows() {
    yield csvColumns.map(([name]) => csvCell(name)).join(',') + '\r\n';
    let after = 0, exported = 0;
    while (true) {
      if (!authorized()) throw new Error('Export authorization expired.');
      const batch = storage.exportBatch(snapshot, after, 250, deviceId);
      if (!batch.length) break;
      for (const record of batch) { yield csvColumns.map(([, get]) => csvCell(get(record))).join(',') + '\r\n'; exported++; after = record.id; }
    }
    if (exported !== count) throw new Error('Export snapshot row count mismatch.');
  }
  await pipeline(Readable.from(rows()), res);
}
