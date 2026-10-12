import { deviceMonitorView } from '../data/deviceMonitorView';
import type { DiagnosticSnapshot } from '../data/diagnosticsV2';

export function DeviceOverview({ deviceId, snapshot, now, connection }: {
  deviceId: string; snapshot: DiagnosticSnapshot | null; now: number; connection: string;
}) {
  const view = deviceMonitorView(snapshot, now);
  const age = (seconds: number | null) => seconds === null ? 'No accepted receipt' : `${seconds} seconds ago`;
  const reportOld = view.sensorFreshness.status !== 'UPDATING';
  return <section className="solair-overview" aria-label={`${deviceId} monitoring overview`}>
    <div className="solair-overview-heading">
      <div><p className="solair-eyebrow">Assigned vehicle · Local operator</p><h2>{deviceId} monitoring</h2></div>
      <span className="solair-source-badge">{view.source}</span>
    </div>
    <div className="solair-monitor-grid">
      <article><h3>Device connection</h3><strong>{snapshot ? view.live.status : 'WAITING'}</strong><p>{age(view.live.ageSeconds)}</p><p>Browser stream: {connection}</p></article>
      <article><h3>Reported security</h3><strong>{view.security}</strong><p>{view.securityFreshness.status} · {age(view.securityFreshness.ageSeconds)}</p><p>Siren output is not measured by this firmware.</p></article>
      <article><h3>Enclosure & mount</h3><strong>{view.lid} / {view.mount}</strong><p>Switch status: {view.switchStatus}</p><p>{reportOld ? 'No current switch reading; last report may be outdated.' : 'Latest accepted sensor report.'}</p></article>
      <article><h3>MPU6050 report</h3><strong>{view.imuStatus}</strong><p>{view.sensorFreshness.status} · {age(view.sensorFreshness.ageSeconds)}</p><p>Chip axes · Calibration not established</p></article>
    </div>
    <dl className="solair-monitor-metadata">
      <div><dt>Last live receipt · UTC</dt><dd>{view.live.receivedAtUtc ?? 'Unavailable'}</dd></div>
      <div><dt>Active boot/session</dt><dd>{view.sessionId ?? 'Unavailable'}</dd></div>
      <div><dt>Accepted v2 messages</dt><dd>{view.acceptedCount}</dd></div>
      <div><dt>Latest received event</dt><dd>{view.latestEvent?.message.eventType ?? 'No event received'}</dd></div>
    </dl>
    {view.latestEvent && <p className="solair-monitor-note">Event ID: {view.latestEvent.message.deviceId}:{view.latestEvent.message.sessionId}:{view.latestEvent.message.sequence} · Receipt UTC: {view.latestEvent.receivedAtUtc}. A delayed event does not mark the device online.</p>}
    <p className="solair-monitor-note">Bench convention: pressed switch = secure; final enclosure placement pending. TRIGGERED is a reported latch, not proof that a siren is sounding. GPS, battery, energy and LTE are not operational.</p>
  </section>;
}
