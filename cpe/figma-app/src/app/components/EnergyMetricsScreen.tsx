import { useNavigate } from 'react-router';
import { ArrowLeft, Sun, Wind, Zap, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { day: 'Mon', solar: 245, wind: 156 },
  { day: 'Tue', solar: 312, wind: 189 },
  { day: 'Wed', solar: 278, wind: 167 },
  { day: 'Thu', solar: 298, wind: 198 },
  { day: 'Fri', solar: 334, wind: 212 },
  { day: 'Sat', solar: 289, wind: 178 },
  { day: 'Sun', solar: 301, wind: 195 }
];

export function EnergyMetricsScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#121212' }}>
      <header className="px-5 py-4 flex items-center gap-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.12)', minHeight: '64px' }}>
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg active:bg-white/10" style={{ minHeight: '44px', minWidth: '44px' }}>
          <ArrowLeft style={{ color: '#ffffff' }} size={26} />
        </button>
        <h1 className="text-2xl" style={{ color: '#FFB300', fontWeight: 600 }}>Energy Metrics</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-5 space-y-5 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border-2" style={{ backgroundColor: '#1E1E1E', borderColor: '#FFB300' }}>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-full self-start" style={{ backgroundColor: 'rgba(255, 179, 0, 0.2)' }}>
                <Sun style={{ color: '#FFB300' }} size={32} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9E9E9E' }}>Solar Input</p>
                <p className="text-2xl mb-2" style={{ color: '#FFB300', fontWeight: 700 }}>42.8W</p>
                <p className="text-xs" style={{ color: '#9E9E9E' }}>Today: 334 Wh</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border-2" style={{ backgroundColor: '#1E1E1E', borderColor: '#00E5FF' }}>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-full self-start" style={{ backgroundColor: 'rgba(0, 229, 255, 0.2)' }}>
                <Wind style={{ color: '#00E5FF' }} size={32} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9E9E9E' }}>Wind VAWT</p>
                <p className="text-2xl mb-2" style={{ color: '#00E5FF', fontWeight: 700 }}>28.3W</p>
                <p className="text-xs" style={{ color: '#9E9E9E' }}>Today: 212 Wh</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ backgroundColor: '#1E1E1E' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-base mb-1" style={{ color: '#ffffff', fontWeight: 600 }}>Net Energy Offset</h3>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>Daily Tracker (Watt-hours)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl" style={{ color: '#00C853', fontWeight: 700 }}>546 Wh</p>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>Today's Total</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="day" stroke="#9E9E9E" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9E9E9E" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1E1E',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
              <Bar dataKey="solar" fill="#FFB300" radius={[6, 6, 0, 0]} />
              <Bar dataKey="wind" fill="#00E5FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5 rounded-2xl flex items-center gap-4" style={{ backgroundColor: '#1E1E1E' }}>
          <Zap style={{ color: '#FFB300' }} size={28} />
          <div className="flex-1">
            <p className="text-base mb-1" style={{ color: '#ffffff', fontWeight: 600 }}>OVP Electromagnetic Braking</p>
            <p className="text-xs" style={{ color: '#9E9E9E' }}>Dump Load Status</p>
          </div>
          <div className="px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(158, 158, 158, 0.2)' }}>
            <span className="text-sm" style={{ color: '#9E9E9E', fontWeight: 600 }}>Inactive</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border-2" style={{ backgroundColor: 'rgba(0, 197, 83, 0.1)', borderColor: '#00C853' }}>
          <div className="flex items-start gap-3">
            <AlertCircle style={{ color: '#00C853' }} size={24} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-base mb-2" style={{ color: '#00C853', fontWeight: 600 }}>System Operating Normally</p>
              <p className="text-sm" style={{ color: '#9E9E9E' }}>
                All energy harvesting systems are functioning within optimal parameters
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
