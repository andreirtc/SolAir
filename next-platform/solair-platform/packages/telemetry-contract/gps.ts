import type { Telemetry } from './index';

// Display policy, not a claim of metre-level receiver accuracy. Keep raw fixes
// in telemetry/history even when they cannot move the live tracking marker.
export const GPS_MAP_MAX_FIX_AGE_MS = 5000;
export const GPS_MAP_MAX_HDOP = 3;
export const GPS_MAP_LIVE_WINDOW_MS = 10000;

export function gpsUsableForMap(t: Partial<Pick<Telemetry, 'gps_fix' | 'gps_fix_age_ms' | 'satellites' | 'cpe'>> | null | undefined) {
  if (!t?.gps_fix || t.gps_fix_age_ms == null || !Number.isFinite(t.gps_fix_age_ms) || t.gps_fix_age_ms < 0 || t.gps_fix_age_ms > GPS_MAP_MAX_FIX_AGE_MS) return false;
  if (t.cpe) {
    const g = t.cpe.gps;
    return g.quality === 'ok' && t.satellites != null && t.satellites >= 4 &&
      g.hdop != null && g.hdop > 0 && g.hdop <= GPS_MAP_MAX_HDOP &&
      (g.last_byte_age_ms == null || g.last_byte_age_ms < 5000);
  }
  // Legacy v1 devices do not report HDOP. Retain compatibility without
  // pretending those observations contain an accuracy measurement.
  return t.satellites == null || t.satellites >= 4;
}
