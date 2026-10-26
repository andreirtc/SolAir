export type QueuedHelpItem = {body: {id: string; vehicle_id: string; type: string; notes: string}; mode: 'hardware' | 'demo'};
export const helpQueueReadError = 'Unable to read saved requests on this device. Nothing was sent from the queue.';
export const helpQueueWriteError = 'Could not save the request offline. Keep your details and try again when connected.';
type QueueStorage = Pick<Storage, 'getItem' | 'setItem'>;
function isQueuedHelp(value: unknown): value is QueuedHelpItem {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
 const item = value as Record<string, unknown>;
 if ((item.mode !== 'hardware' && item.mode !== 'demo') || !item.body || typeof item.body !== 'object' || Array.isArray(item.body)) return false;
 const body = item.body as Record<string, unknown>;
 return ['id', 'vehicle_id', 'type', 'notes'].every(key => typeof body[key] === 'string');
}
export function readHelpQueue(storage: QueueStorage, key: string): QueuedHelpItem[] {
 try {
  const value: unknown = JSON.parse(storage.getItem(key) || '[]');
  if (!Array.isArray(value) || !value.every(isQueuedHelp)) throw new Error();
  return value;
 } catch { throw new Error(helpQueueReadError); }
}
export function saveHelpQueue(storage: QueueStorage, key: string, items: QueuedHelpItem[]): void {
 try { storage.setItem(key, JSON.stringify(items)); }
 catch { throw new Error(helpQueueWriteError); }
}
