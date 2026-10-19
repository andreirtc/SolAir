import type {Telemetry} from '../telemetry-contract';

export type ReadingState = 'fresh'|'stale'|'unknown'|'fault'|'absent'|'uncalibrated';
export function elapsed(at: string|null|undefined, now: number): number|null {
  if (!at) return null;
  const age = now - Date.parse(at);
  return Number.isFinite(age) && age >= 0 ? age : null;
}
export function deviceHealth(t: (Telemetry & {received_at:string})|null, now=Date.now()) {
  const contactAge = elapsed(t?.received_at, now);
  const captureAge = t?.cpe?.historical ? null : elapsed(t?.device_timestamp, now);
  const sensors = Object.entries(t?.sensor_health||{}).filter(([key])=>!['event_buffer','wind'].includes(key)).map(([key,quality])=>{
    const sensorAge = t?.sensor_age_ms?.[key==='mpu6050'||key==='mpu6500_compatible'?'imu':key];
    const age = captureAge===null||sensorAge===undefined ? null : captureAge+sensorAge;
    const state:ReadingState = quality!=='ok' ? quality : age===null ? 'unknown' : age>30000 ? 'stale' : 'fresh';
    return {key,quality,age_ms:age,state};
  });
  const gpsAge = captureAge===null||t?.gps_fix_age_ms==null ? null : captureAge+t.gps_fix_age_ms;
  const gps:ReadingState = !t?.gps_fix ? 'absent' : gpsAge===null ? 'unknown' : gpsAge>30000 ? 'stale' : 'fresh';
  const security:ReadingState = !t||captureAge===null||typeof t.armed!=='boolean' ? 'unknown' : captureAge>30000 ? 'stale' : 'fresh';
  return {contact_age_ms:contactAge,connection:contactAge===null?'No data':contactAge<30000?'Recent contact':contactAge<90000?'Contact delayed':'Offline',capture_age_ms:captureAge,sensors,gps,gps_age_ms:gpsAge,security,
    dropped_events:t?.cpe?.queue_dropped??null,
    battery:t?.battery_voltage_v==null?'unavailable':t.source_type==='hardware'&&t.calibration_status!=='calibrated'?'uncalibrated':captureAge===null?'unknown':captureAge>30000?'stale':'fresh'};
}
