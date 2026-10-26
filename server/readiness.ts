import type {Store} from './db';

// Share an outstanding probe so an unreachable database cannot accumulate a new query per health request.
const pending = new WeakMap<Pick<Store, 'query'>, Promise<boolean>>();
export async function databaseReady(db: Pick<Store, 'query'>, timeoutMs = 2000): Promise<boolean> {
 let probe = pending.get(db);
 if (!probe) {
  probe = Promise.resolve().then(() => db.query('SELECT 1 AS ready')).then(() => true, () => false);
  pending.set(db, probe);
  void probe.then(() => { if (pending.get(db) === probe) pending.delete(db); });
 }
 let timer: ReturnType<typeof setTimeout> | undefined;
 try {
  return await Promise.race([probe, new Promise<false>(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); })]);
 } finally { if (timer) clearTimeout(timer); }
}
