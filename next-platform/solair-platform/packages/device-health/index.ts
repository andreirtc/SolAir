import type {Telemetry} from '../telemetry-contract';
import {securityState} from '../telemetry-contract';
import {gpsUsableForMap,GPS_MAP_MAX_FIX_AGE_MS,GPS_MAP_LIVE_WINDOW_MS} from '../telemetry-contract/gps';

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
  const gps:ReadingState = !t?.gps_fix ? 'absent' : t.gps_fix_age_ms==null ? 'unknown' : t.gps_fix_age_ms>GPS_MAP_MAX_FIX_AGE_MS||(gpsAge!==null&&gpsAge>GPS_MAP_LIVE_WINDOW_MS) ? 'stale' : !gpsUsableForMap(t) ? 'fault' : gpsAge===null ? 'unknown' : 'fresh';
  const security:ReadingState = !t||captureAge===null||typeof t.armed!=='boolean' ? 'unknown' : captureAge>30000 ? 'stale' : 'fresh';
  return {contact_age_ms:contactAge,connection:contactAge===null?'No data':contactAge<30000?'Recent contact':contactAge<90000?'Contact delayed':'Offline',capture_age_ms:captureAge,sensors,gps,gps_age_ms:gpsAge,security,security_state:securityState(t),
    dropped_events:t?.cpe?.queue_dropped??null,
    battery:t?.battery_voltage_v==null?'unavailable':t.source_type==='hardware'&&t.calibration_status!=='calibrated'?'uncalibrated':captureAge===null?'unknown':captureAge>30000?'stale':'fresh'};
}
