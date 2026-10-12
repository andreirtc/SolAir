import { useAuth } from '../auth';
﻿import { useEffect, useState } from 'react';
import { demoTelemetry } from '../data/demoTelemetry';
import { getSampleStatus } from '../data/telemetrySimulation';
import { applyBackendState, emptyBackendState } from '../data/backendTelemetry';

export function useSimulatedTelemetry() {
  const auth = useAuth();
  const [session, setSession] = useState(emptyBackendState);
  const [connection, setConnection] = useState('CONNECTING');
  const [controlError, setControlError] = useState<string | null>(null);
  const [controlPending, setControlPending] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const stream = new EventSource('/api/telemetry/stream');
    stream.onopen = () => setConnection('CONNECTED');
    stream.onerror = () => { setConnection('RECONNECTING'); void auth.check().catch(() => {}); };
    stream.addEventListener('auth-required', () => { stream.close(); setSession(emptyBackendState()); auth.signedOut(); });
    stream.addEventListener('state', event => {
      try { const input = JSON.parse((event as MessageEvent).data); setSession(previous => applyBackendState(previous, input)); }
      catch { setSession(previous => ({ ...previous, validationError: 'Invalid backend stream data.' })); }
    });
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => { stream.close(); window.clearInterval(timer); };
  }, []);
  const togglePaused = async () => {
    setControlPending(true); setControlError(null);
    try {
      const response = await auth.request(`/api/simulator/${session.paused ? 'resume' : 'pause'}`, { method: 'POST' });
      if (!response.ok) throw new Error('Simulator control unavailable.');
      const input = await response.json();
      setSession(previous => applyBackendState(previous, input));
    } catch { setControlError('Simulator control failed; backend state was not changed in this browser.'); }
    finally { setControlPending(false); }
  };
  const status = getSampleStatus(session.receivedAt, now);
  const telemetry = session.message ? {
    ...demoTelemetry,
    batteryVoltageV: session.message.batteryVoltageV,
    batterySocPercent: session.message.batterySocPercent,
    solarPowerW: session.message.solarPowerW,
    windPowerW: session.message.windPowerW,
    speedKmh: session.message.speedKmh,
    latitudeDeg: session.message.latitudeDeg,
    longitudeDeg: session.message.longitudeDeg,
    electromagneticBrakeActive: session.message.electromagneticBrakeActive,
  } : demoTelemetry;
  return { ...session, telemetry, connection, controlError, controlPending, togglePaused, status,
    outdated: status === 'STALE' || status === 'DISCONNECTED',
    ageSeconds: session.receivedAt === null ? null : Math.floor(Math.max(0, now - session.receivedAt) / 1000) };
}
