import { gpsUsableForMap } from '../packages/telemetry-contract/gps';
import type { Store } from './db';

type GpsRow = { id: string; telemetry_id: string; device_id: string; mode: string; latitude: number; longitude: number; measured_at: string; payload: string };
type Position = Omit<GpsRow, 'payload'>;

// Read both old and new records without rewriting research history or adding a
// migration. Cache a per-device/mode watermark so a run of rejected positions
// does not repeatedly rescan the entire history. All queries stay scoped.
export class GpsTracking {
  private cache = new Map<string, { newest: string; reliable: Position | null }>();
  constructor(private db: Pick<Store, 'query'>) {}

  async latest(device: string, mode: string, before?: string): Promise<Position | null> {
    const select = 'SELECT g.*,t.payload FROM gps_records g JOIN telemetry t ON t.id=g.telemetry_id WHERE g.device_id=? AND g.mode=? AND g.telemetry_id NOT IN (SELECT telemetry_id FROM archived_frames)' + (before?' AND g.measured_at<=?':'');
    const args=before?[device,mode,before]:[device,mode];
    const order = ' ORDER BY g.measured_at DESC,g.id DESC';
    const [newest] = await this.db.query(select + order + ' LIMIT 1', args) as GpsRow[];
    const key = JSON.stringify([device, mode, before]);
    if (!newest) { this.cache.delete(key); return null; }
    const prior = this.cache.get(key);
    if (prior?.newest === newest.id) return prior.reliable;
    let page = [newest], reliable: Position | null = null;
    scan: for (;;) {
      for (const row of page) {
        if (row.id === prior?.newest) { reliable = prior.reliable; break scan; }
        if (gpsUsableForMap(JSON.parse(row.payload))) {
          reliable = { id: row.id, telemetry_id: row.telemetry_id, device_id: row.device_id,
            mode: row.mode, latitude: row.latitude, longitude: row.longitude, measured_at: row.measured_at };
          break scan;
        }
      }
      const cursor = page[page.length - 1];
      page = await this.db.query(select + ' AND (g.measured_at<? OR (g.measured_at=? AND g.id<?))' + order + ' LIMIT 32',
        [...args, cursor.measured_at, cursor.measured_at, cursor.id]) as GpsRow[];
      if (!page.length) break;
    }
    this.cache.set(key, { newest: newest.id, reliable });
    return reliable;
  }
}
