import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { isDiagnosticUtc, validateDiagnosticMessage, type TamperEvent } from '../data/diagnosticsV2';

type EventRecord = { id: number; eventId: string; receivedAtUtc: string; message: TamperEvent; provenance: string; delivery: string; acceptedRetryCount: number; lastRetryAtUtc: string | null };
export function RealEventHistory({ deviceId, acceptedCount }: { deviceId: string; acceptedCount: number }) {
  const auth = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    auth.request('/api/diagnostics/events', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error('Event history unavailable.');
      const data = await response.json();
      if (data.mode !== 'device' || !Array.isArray(data.events) || data.events.length > 100) throw Error('Invalid real event history.');
      for (const r of data.events) {
        const checked = validateDiagnosticMessage(r.message, deviceId);
        if (!checked.valid || checked.message.messageType !== 'tamper_event' || checked.message.source !== 'device' || !isDiagnosticUtc(r.receivedAtUtc) || !['REAL DEVICE', 'TEST FIXTURE'].includes(r.provenance) || r.eventId !== `${deviceId}:${checked.message.sessionId}:${checked.message.sequence}` || !Number.isSafeInteger(r.acceptedRetryCount) || r.acceptedRetryCount < 0 || (r.lastRetryAtUtc !== null && !isDiagnosticUtc(r.lastRetryAtUtc))) throw Error('Invalid real event history.');
      }
      if (!controller.signal.aborted) { setEvents(data.events); setError(''); }
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Event history unavailable.'); });
    return () => controller.abort();
  }, [deviceId, acceptedCount, revision]);
  async function download() {
    try {
      const response = await auth.request('/api/diagnostics/export.csv');
      if (!response.ok) throw Error('Real export unavailable. Check your session and storage.');
      const url = URL.createObjectURL(await response.blob()), link = document.createElement('a');
      link.href = url; link.download = 'solair-real-device-v2.csv'; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Real export unavailable.'); }
  }
  return <section className="space-y-3 text-sm">
    <h3 style={{ color: '#ffffff' }}>Persisted REAL event history (latest 100)</h3>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => setRevision(n => n + 1)} className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#FFB300', color: '#121212' }}>Refresh delivery details</button>
      <button type="button" onClick={() => void download()} className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#FFB300', color: '#121212' }}>Export REAL records (v2 CSV)</button>
    </div>
    <p className="text-xs">CSV includes the first 1,000 stored real-v2 records. API supports limit (max 10,000), afterId and eventsOnly for subsequent chunks. Unavailable fields are blank. Fixtures retain TEST FIXTURE provenance. Retries count accepted identical deliveries only; failed device attempts are unknown.</p>
    {error && <p role="alert" style={{ color: '#FFB300' }}>{error} Retained history may be outdated.</p>}
    {!events.length && <p>No real tamper events received.</p>}
    {events.map(r => <article key={r.eventId} className="break-words p-3 rounded-xl" style={{ backgroundColor: '#121212' }}>
      <strong style={{ color: '#FFB300' }}>{r.provenance} · {r.message.eventType}</strong><br />Event ID: {r.eventId}<br />Device: {r.message.deviceId} · Session: {r.message.sessionId}<br />Sequence: {r.message.sequence} · Security: {r.message.securityState ?? 'Unavailable'}<br />Sender UTC: {r.message.sampledAtUtc ?? 'Unavailable'} · Uptime: {r.message.uptimeMs} ms<br />Server receipt UTC: {r.receivedAtUtc}<br />Delivery: {r.delivery} · Accepted exact retries: {r.acceptedRetryCount}<br />Last retry UTC: {r.lastRetryAtUtc ?? 'None recorded'}
    </article>)}
  </section>;
}
