import { useAuth } from '../auth';
import { useEffect, useState } from 'react';
import type { TelemetryMessage } from '../data/telemetryContract';
type Page = { records: { id: number; receivedAtUtc: string; message: TelemetryMessage }[]; snapshot: number; nextBefore: number | null };
const button = { backgroundColor: '#FFB300', color: '#121212', minHeight: 44, padding: '8px 12px', borderRadius: 12 };

export function TelemetryHistory() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [query, setQuery] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError(null);
    auth.request('/api/telemetry/history?limit=10' + query, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => setPage(data))
      .catch(() => { if (!controller.signal.aborted) { setPage(null); setError('Stored telemetry could not be loaded. Retry when the backend is available.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, query, revision]);
  const download = async () => {
    try {
      const response = await auth.request('/api/telemetry/export.csv');
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'SolAir_SIMULATED.csv';
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('CSV export failed. Check your session and backend, then retry.'); }
  };
  const refresh = () => { setQuery(''); setRevision(n => n + 1); };
  return <section className="mb-5 p-4 rounded-2xl space-y-3" style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }} aria-label="Telemetry history">
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} style={button}>Telemetry history {open ? '−' : '+'}</button>
    <p className="text-xs" style={{ color: '#FFB300' }}>SIMULATED local telemetry logs · Not tamper events or experimental evidence.</p>
    {open && <>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={refresh} disabled={loading} style={button}>Refresh recent records</button>
        <button type="button" onClick={() => void download()} style={button}>Export simulated telemetry CSV</button>
      </div>
      <p className="text-xs" style={{ color: '#9E9E9E' }}>CSV includes all stored simulated records at download start, across all pages.</p>
      {loading ? <p role="status">Loading stored telemetry…</p> : error ? <p role="alert" style={{ color: '#FFB300' }}>{error}</p> : page && <>
        {page.records.length === 0 ? <p>No stored telemetry yet.</p> : <div className="space-y-3">{page.records.map(record => <article key={record.id} className="text-xs p-3 rounded-xl space-y-1" style={{ backgroundColor: '#121212', overflowWrap: 'anywhere' }}>
          <p style={{ color: '#00E5FF' }}>#{record.id} · {record.message.source === 'simulated' ? 'SIMULATED' : 'DEVICE metadata (unauthenticated)'} · {record.message.deviceId} · Sequence {record.message.sequence}</p>
          <p>Receipt UTC: {record.receivedAtUtc}</p><p>Sender UTC: {record.message.sampledAtUtc ?? 'Unavailable'}</p>
          <p>Battery: {record.message.batteryVoltageV ?? 'Unavailable'} V · SOC: {record.message.batterySocPercent ?? 'Unavailable'} %</p>
          <p>Solar: {record.message.solarPowerW ?? 'Unavailable'} W · Wind: {record.message.windPowerW ?? 'Unavailable'} W · Speed: {record.message.speedKmh ?? 'Unavailable'} km/h</p>
        </article>)}</div>}
        {page.nextBefore !== null && <button type="button" style={button} onClick={() => setQuery(`&snapshot=${page.snapshot}&before=${page.nextBefore}`)}>Older records</button>}
      </>}
    </>}
  </section>;
}
