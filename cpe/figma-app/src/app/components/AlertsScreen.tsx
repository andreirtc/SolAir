import { useNavigate } from 'react-router';
import { ArrowLeft, AlertTriangle, Info, MapPin } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'filtered';
  title: string;
  description: string;
  time: string;
  location?: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Unauthorized Intrusion Detected',
    description: 'High-severity tampering event triggered alarm system',
    time: '2026-05-27 14:32:15',
    location: '14.6549° N, 120.9668° E'
  },
  {
    id: '2',
    type: 'filtered',
    title: 'Road Vibration (Filtered)',
    description: 'Normal road vibration detected and filtered by algorithm',
    time: '2026-05-27 13:15:42',
    location: '14.6512° N, 120.9701° E'
  },
  {
    id: '3',
    type: 'filtered',
    title: 'Road Vibration (Filtered)',
    description: 'Minor vibration within acceptable threshold',
    time: '2026-05-27 12:08:23',
    location: '14.6488° N, 120.9635° E'
  },
  {
    id: '4',
    type: 'critical',
    title: 'Battery Disconnect Alert',
    description: 'Sudden battery voltage drop detected',
    time: '2026-05-26 18:45:11',
    location: '14.6531° N, 120.9682° E'
  },
  {
    id: '5',
    type: 'filtered',
    title: 'Road Vibration (Filtered)',
    description: 'Vehicle in motion - normal operational vibration',
    time: '2026-05-26 15:22:34',
    location: '14.6502° N, 120.9719° E'
  }
];

export function AlertsScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#121212' }}>
      <header className="px-5 py-4 flex items-center gap-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.12)', minHeight: '64px' }}>
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg active:bg-white/10" style={{ minHeight: '44px', minWidth: '44px' }}>
          <ArrowLeft style={{ color: '#ffffff' }} size={26} />
        </button>
        <h1 className="text-2xl" style={{ color: '#FFB300', fontWeight: 600 }}>Alert Log</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-5 space-y-5 pb-6">
        <div className="flex items-center justify-between">
          <p className="text-base" style={{ color: '#9E9E9E' }}>
            {mockAlerts.filter(a => a.type === 'critical').length} critical alerts
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
          {mockAlerts.map((alert) => (
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
      </main>
    </div>
  );
}
