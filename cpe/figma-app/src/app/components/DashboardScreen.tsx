import { useState } from 'react';
import { TelemetryHistory } from './TelemetryHistory';
import { DeviceDiagnostics } from './DeviceDiagnostics';
import { useAuth } from '../auth';
import { useSimulatedTelemetry } from '../hooks/useSimulatedTelemetry';
import { useNavigate } from 'react-router';
import { Battery, Gauge, MapPin, Zap, Shield, Bell, Sun, Wind, AlertTriangle, Info, ShieldCheck, ShieldAlert, Shield as ShieldIcon, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import mapImage from '../../imports/6383990d-0308-4d3d-85d1-96f1f5145c7b.jpg';
import logoImage from '../../imports/SolAir.png';
import { IntrusionModal } from './IntrusionModal';
import type { DiagnosticSnapshot } from '../data/diagnosticsV2';
import { dashboardReadings } from '../data/dashboardReadings';

import {
  demoTelemetry,
  demoEnergyHistory,
  demoAlerts,
  formatReading,
  formatCoordinates,
} from '../data/demoTelemetry';
import type { SecurityState } from '../data/demoTelemetry';

const getPageTitle = (view: string) => {
  switch (view) {
    case 'map': return 'Map Preview';
    case 'energy': return 'Energy Harvest';
    case 'security': return 'Security Status';
    case 'alerts': return 'Alert Log';
    default: return '';
  }
};

export function DashboardScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const simulation = useSimulatedTelemetry();
  const [diagnostics, setDiagnostics] = useState<DiagnosticSnapshot | null>(null);
  const real = diagnostics?.mode === 'device';
  const telemetry = dashboardReadings(simulation.telemetry, diagnostics);
  const harvestedEnergyKwh = demoEnergyHistory.reduce((sum, interval) => sum + interval.energy, 0) / 1000;
  const [activeView, setActiveView] = useState<'map' | 'energy' | 'security' | 'alerts'>('map');
  const [securityState, setSecurityState] = useState<SecurityState>(demoTelemetry.initialSecurityState);
  const [showIntrusionModal, setShowIntrusionModal] = useState(false);

  const getStateConfig = (currentState: SecurityState) => {
    switch (currentState) {
      case 'DISARMED':
        return {
          color: '#9E9E9E',
          bgColor: 'rgba(158, 158, 158, 0.2)',
          icon: ShieldIcon,
          label: 'DISARMED',
          description: 'Security system is currently inactive'
        };
      case 'ARMED':
        return {
          color: '#00C853',
          bgColor: 'rgba(0, 197, 83, 0.2)',
          icon: ShieldCheck,
          label: 'ARMED',
          description: 'Security system is actively monitoring'
        };
      case 'TRIGGERED':
        return {
          color: '#D50000',
          bgColor: 'rgba(213, 0, 0, 0.2)',
          icon: ShieldAlert,
          label: 'TRIGGERED',
          description: 'Intrusion detected! Alarm is active'
        };
    }
  };

  return (
    <>
      <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#121212' }}>
        {/* Top Header */}
      <header className="px-5 py-3 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}>
        <img src={logoImage} alt="SolAir" className="h-10" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9E9E9E' }} />
            <span className="text-xs" style={{ color: '#9E9E9E' }}>HTTP / SSE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: telemetry.gpsConnected ? '#00C853' : '#9E9E9E' }} />
            <span className="text-xs" style={{ color: '#9E9E9E' }}>{real ? 'GPS unavailable' : 'GPS simulated'}</span>
          </div>
          <button type="button" onClick={() => void auth.logout()} aria-label="Log out" title="Log out" className="rounded-full flex items-center justify-center gap-1 px-2" style={{ backgroundColor: '#1E1E1E', color: '#9E9E9E', minHeight: 44 }}>
            <User size={18} style={{ color: '#9E9E9E' }} />
            <span className="text-xs">Log out</span>
          </button>
        </div>
      </header>

      {/* Page Title */}
      <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}>
        <h1 className="text-2xl" style={{ color: '#ffffff', fontWeight: 700 }}>{getPageTitle(activeView)}</h1>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5" style={{ paddingBottom: '90px' }}>
        {auth.notice && <p role="alert" style={{ color: '#FFB300' }}>{auth.notice}</p>}
        {auth.networkError && <p role="status" style={{ color: '#FFB300' }}>Local backend unavailable. This is a connection failure; your session has not been confirmed expired.</p>}
        <DeviceDiagnostics onSnapshot={setDiagnostics} />
        <details className="mb-5" aria-label="Separate simulated telemetry examples">
        <summary className="cursor-pointer py-3 text-sm" style={{ color: '#9E9E9E' }}>SIMULATED v1 · Example controls and stored history</summary>
        <section className="mb-5 p-4 rounded-2xl space-y-2" aria-label="Local backend telemetry simulator" style={{ backgroundColor: '#1E1E1E', color: '#9E9E9E' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" style={{ color: simulation.outdated ? '#FFB300' : '#00E5FF', fontWeight: 600 }} role="status">
              SIMULATED SAMPLES Â· {simulation.status}
            </p>
            <button type="button" onClick={simulation.togglePaused} disabled={simulation.controlPending} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: '#FFB300', color: '#121212', fontWeight: 600, minHeight: '44px' }}>
              {simulation.paused ? 'Resume simulator' : 'Pause simulator'}
            </button>
          </div>
          <p className="text-xs" role="status">Backend SSE: {simulation.connection}</p><p className="text-xs" role="alert">{simulation.controlError}</p>
          <p className="text-xs">Sender sample time (UTC): {simulation.message === null ? 'None yet' : simulation.message.sampledAtUtc ?? 'Unavailable'}</p>
          <p className="text-xs">Last accepted server receipt: {simulation.receivedAt === null ? 'None yet' : new Date(simulation.receivedAt).toLocaleString()}</p>
          {simulation.validationError && <p className="text-xs" role="alert" style={{ color: '#FFB300' }}>Sample rejected: {simulation.validationError}</p>}
          {simulation.storageError && <p className="text-xs" role="alert" style={{ color: '#FFB300' }}>{simulation.storageError}</p>}
          <p className="text-xs">Sample age: {simulation.ageSeconds === null ? 'No sample yet' : `${simulation.ageSeconds} seconds`} Â· Lifetime stored samples: {simulation.count} Â· {simulation.paused ? 'Samples paused' : 'Samples every 3 seconds'}</p>
          <p className="text-xs" style={{ color: simulation.outdated ? '#FFB300' : '#9E9E9E' }}>
            {simulation.outdated ? 'Stored simulated readings are outdated.' : simulation.status === 'WAITING' ? 'Waiting for the first simulated sample.' : 'Stored v1 readings are simulated UI examples.'}
          </p>
          <p className="text-xs">Map imagery, chart history and alert history are fixed examples. Security controls are simulated.</p>
          <p className="text-xs">Lifetime stored samples: {simulation.storedCount ?? simulation.count} Â· Accepted since backend startup: {simulation.sessionCount ?? 0}. Restart restores stored readings with their original receipt time. Simulator controls affect all local viewers; they send no device commands. Timings remain provisional. Contract v1 is PROPOSED, awaiting firmware-team agreement.</p>
        </section>
        <TelemetryHistory />
        </details>
        <p className="text-xs mb-3" style={{ color: '#00E5FF' }}>{!diagnostics ? 'Awaiting backend data source confirmation. Measurements unavailable.' : real ? 'REAL receiver mode: battery, SOC, energy, GPS, speed, brake and time-to-empty unavailable; not implemented. Device reports appear above. Charts, map, alerts and local controls remain examples.' : 'SIMULATED mode: cards below are software examples.'}</p>
        {activeView === 'map' && (
          <div className="space-y-5">
            <button
              onClick={() => navigate('/map')}
              className="w-full relative rounded-2xl overflow-hidden active:opacity-90 transition-opacity"
              style={{ height: '320px' }}
            >
              <img src={mapImage} alt="Malabon City Map" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)' }}>
                <p className="text-sm" style={{ color: '#00E5FF', fontWeight: 600 }}>Sample Map Image</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 179, 0, 0.9)' }}>
                  <p className="text-sm" style={{ color: '#121212', fontWeight: 600 }}>Tap to Expand</p>
                </div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Battery style={{ color: '#FFB300' }} size={22} />
                  <span className="text-sm" style={{ color: '#9E9E9E' }}>Battery</span>
                </div>
                <p className="text-3xl mb-1" style={{ color: '#ffffff', fontWeight: 600 }}>{formatReading(telemetry.batteryVoltageV, 1)}{telemetry.batteryVoltageV !== null && Number.isFinite(telemetry.batteryVoltageV) ? " V" : ""}</p>
                <p className="text-base" style={{ color: '#00C853', fontWeight: 600 }}>{formatReading(telemetry.batterySocPercent)}{telemetry.batterySocPercent !== null && Number.isFinite(telemetry.batterySocPercent) ? "%" : ""}</p>
              </div>

              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Gauge style={{ color: '#00E5FF' }} size={22} />
                  <span className="text-sm" style={{ color: '#9E9E9E' }}>Speed</span>
                </div>
                <p className="text-3xl mb-1" style={{ color: '#ffffff', fontWeight: 600 }}>{formatReading(telemetry.speedKmh)}</p>
                <p className="text-base" style={{ color: '#9E9E9E' }}>km/h</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin style={{ color: '#00E5FF' }} size={22} />
                <span className="text-sm" style={{ color: '#9E9E9E' }}>Sample Location</span>
              </div>
              <p className="text-base mb-1" style={{ color: '#ffffff', fontWeight: 600 }}>{formatCoordinates(telemetry.latitudeDeg, telemetry.longitudeDeg)}</p>
              <p className="text-sm" style={{ color: '#9E9E9E' }}>{telemetry.locationLabel}</p>
            </div>
          </div>
        )}

        {activeView === 'energy' && (
          <div className="space-y-5">
            <p className="text-xs" style={{ color: '#9E9E9E' }}>Time-to-Empty: Unavailable · Not implemented</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sun style={{ color: '#FFB300' }} size={22} />
                  <span className="text-xs" style={{ color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOLAR PV</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl" style={{ color: '#ffffff', fontWeight: 700 }}>{formatReading(telemetry.solarPowerW)}</p>
                  <p className="text-xl" style={{ color: '#FFB300', fontWeight: 600 }}>W</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Wind style={{ color: '#00E5FF' }} size={22} />
                  <span className="text-xs" style={{ color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>WIND VAWT</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl" style={{ color: '#ffffff', fontWeight: 700 }}>{formatReading(telemetry.windPowerW)}</p>
                  <p className="text-xl" style={{ color: '#00E5FF', fontWeight: 600 }}>W</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
              <div className="mb-4">
                <h3 className="text-xs mb-3" style={{ color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SAMPLE HARVESTED ENERGY</h3>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl" style={{ color: '#ffffff', fontWeight: 700 }}>{formatReading(harvestedEnergyKwh, 2)}</p>
                  <p className="text-xl" style={{ color: '#FFB300', fontWeight: 600 }}>kWh</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={demoEnergyHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis
                    key="x-axis"
                    dataKey="time"
                    stroke="#9E9E9E"
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                  />
                  <YAxis
                    key="y-axis"
                    stroke="#9E9E9E"
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      backgroundColor: '#1E1E1E',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                  <Bar key="energy-bar" dataKey="energy" name="Sample energy (Wh)" fill="#FFB300" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-2xl flex items-center gap-4" style={{ backgroundColor: '#1E1E1E' }}>
              <Zap style={{ color: '#FFB300' }} size={28} />
              <div className="flex-1">
                <p className="text-base mb-1" style={{ color: '#ffffff', fontWeight: 600 }}>OVP Electromagnetic Braking</p>
              </div>
              <div className="px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(158, 158, 158, 0.2)' }}>
                <span className="text-sm" style={{ color: '#9E9E9E', fontWeight: 600 }}>{telemetry.electromagneticBrakeActive === null ? "Unavailable" : telemetry.electromagneticBrakeActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        )}

        {activeView === 'security' && (
          <div className="space-y-6">
            <p className="text-xs" style={{ color: '#9E9E9E' }}>Reported sample security: {simulation.message?.securityState ?? 'No accepted sample yet'}. Controls below change only local demo state.</p>
            <div
              className="p-10 rounded-2xl border-4"
              style={{
                backgroundColor: getStateConfig(securityState).bgColor,
                borderColor: getStateConfig(securityState).color
              }}
            >
              <div className="flex flex-col items-center text-center space-y-5">
                <div
                  className="p-7 rounded-full"
                  style={{ backgroundColor: getStateConfig(securityState).color }}
                >
                  {(() => {
                    const Icon = getStateConfig(securityState).icon;
                    return <Icon style={{ color: '#121212' }} size={64} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-5xl mb-3" style={{ color: getStateConfig(securityState).color, fontWeight: 700 }}>
                    {getStateConfig(securityState).label}
                  </h2>
                  <p className="text-base" style={{ color: '#9E9E9E' }}>{getStateConfig(securityState).description}</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: '#1E1E1E' }}>
              <h3 className="text-base" style={{ color: '#ffffff', fontWeight: 600 }}>Finite State Machine</h3>
              <div className="flex items-center justify-center gap-3">
                {(['DISARMED', 'ARMED', 'TRIGGERED'] as SecurityState[]).map((s) => (
                  <div
                    key={s}
                    className="flex-1 p-4 rounded-xl text-center transition-all"
                    style={{
                      backgroundColor: securityState === s ? getStateConfig(s).bgColor : 'rgba(255, 255, 255, 0.05)',
                      border: securityState === s ? `3px solid ${getStateConfig(s).color}` : '3px solid transparent'
                    }}
                  >
                    <p
                      className="text-xs"
                      style={{
                        color: securityState === s ? getStateConfig(s).color : '#9E9E9E',
                        fontWeight: securityState === s ? 600 : 400
                      }}
                    >
                      {s}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base" style={{ color: '#ffffff', fontWeight: 600 }}>Manual Controls</h3>

              <button
                onClick={() => setSecurityState('ARMED')}
                disabled={securityState === 'ARMED'}
                className="w-full py-5 text-lg rounded-2xl transition-all disabled:opacity-50 active:scale-98"
                style={{
                  backgroundColor: securityState === 'ARMED' ? 'rgba(0, 197, 83, 0.3)' : '#00C853',
                  color: '#121212',
                  fontWeight: 600,
                  minHeight: '56px'
                }}
              >
                Arm Security System
              </button>

              <button
                onClick={() => setSecurityState('DISARMED')}
                disabled={securityState === 'DISARMED'}
                className="w-full py-5 text-lg rounded-2xl transition-all disabled:opacity-50 active:scale-98"
                style={{
                  backgroundColor: securityState === 'DISARMED' ? 'rgba(158, 158, 158, 0.3)' : '#9E9E9E',
                  color: '#121212',
                  fontWeight: 600,
                  minHeight: '56px'
                }}
              >
                Disarm Security System
              </button>

              {securityState === 'TRIGGERED' && (
                <button
                  onClick={() => setSecurityState('DISARMED')}
                  className="w-full py-5 text-lg rounded-2xl animate-pulse"
                  style={{
                    backgroundColor: '#D50000',
                    color: '#ffffff',
                    fontWeight: 600,
                    minHeight: '56px'
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Bell size={24} />
                    <span>Acknowledge & Reset 120dB Alarm</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setSecurityState('TRIGGERED');
                  setShowIntrusionModal(true);
                }}
                className="w-full py-3 text-sm rounded-2xl active:opacity-70"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#9E9E9E',
                  minHeight: '48px'
                }}
              >
                Test Trigger (Demo Only)
              </button>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
              <h4 className="mb-4 text-base" style={{ color: '#ffffff', fontWeight: 600 }}>Security Features</h4>
              <div className="space-y-3 text-base">
                <div className="flex items-center justify-between">
                  <span style={{ color: '#9E9E9E' }}>Motion Detection</span>
                  <span style={{ color: '#00C853', fontWeight: 600 }}>Simulated</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#9E9E9E' }}>Vibration Sensor</span>
                  <span style={{ color: '#00C853', fontWeight: 600 }}>Simulated</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#9E9E9E' }}>120dB Alarm</span>
                  <span style={{ color: securityState === 'TRIGGERED' ? '#D50000' : '#9E9E9E', fontWeight: 600 }}>
                    {securityState === 'TRIGGERED' ? 'Demo triggered' : 'Demo standby'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#9E9E9E' }}>GPS Tracking</span>
                  <span style={{ color: '#00C853', fontWeight: 600 }}>Simulated</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'alerts' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-base" style={{ color: '#9E9E9E' }}>
                {demoAlerts.filter(a => a.type === 'critical').length} critical alerts
              </p>
              <div className="flex gap-2">
                <button className="px-5 py-2 rounded-xl text-sm active:opacity-70" style={{ backgroundColor: '#1E1E1E', color: '#ffffff', fontWeight: 600, minHeight: '40px' }}>
                  All
                </button>
                <button className="px-5 py-2 rounded-xl text-sm active:opacity-70" style={{ backgroundColor: 'transparent', color: '#9E9E9E', minHeight: '40px' }}>
                  Critical
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {demoAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 rounded-2xl border-2"
                  style={{
                    backgroundColor: alert.type === 'critical'
                      ? 'rgba(213, 0, 0, 0.15)'
                      : '#1E1E1E',
                    borderColor: alert.type === 'critical'
                      ? '#D50000'
                      : 'rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {alert.type === 'critical' ? (
                        <AlertTriangle style={{ color: '#D50000' }} size={24} />
                      ) : (
                        <Info style={{ color: '#9E9E9E' }} size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-base mb-2"
                        style={{
                          color: alert.type === 'critical' ? '#D50000' : '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        {alert.title}
                      </h4>
                      <p className="text-sm mb-3" style={{ color: '#9E9E9E' }}>
                        {alert.description}
                      </p>
                      <div className="flex flex-col gap-2 text-xs" style={{ color: '#9E9E9E' }}>
                        <span>{alert.time}</span>
                        {alert.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            <span>{alert.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t flex-shrink-0" style={{ backgroundColor: '#121212', borderColor: 'rgba(255, 255, 255, 0.12)' }}>
        {[
          { id: 'map', label: 'Map', icon: MapPin },
          { id: 'energy', label: 'Energy', icon: Zap },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'alerts', label: 'Alerts', icon: Bell }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as any)}
            className="flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors active:opacity-70"
            style={{
              color: activeView === id ? '#FFB300' : '#9E9E9E',
              minHeight: '72px'
            }}
          >
            <Icon size={24} strokeWidth={activeView === id ? 2.5 : 2} />
            <span className="text-xs" style={{ fontWeight: activeView === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>

    {/* Intrusion Modal Overlay */}
    {showIntrusionModal && (
      <IntrusionModal
        onClose={() => setShowIntrusionModal(false)}
        onDisarm={() => setSecurityState('DISARMED')}
      />
    )}
  </>
  );
}


