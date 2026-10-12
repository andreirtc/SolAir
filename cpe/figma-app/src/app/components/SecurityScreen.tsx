import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Shield, ShieldAlert, ShieldCheck, Bell } from 'lucide-react';

type SecurityState = 'DISARMED' | 'ARMED' | 'TRIGGERED';

export function SecurityScreen() {
  const navigate = useNavigate();
  const [state, setState] = useState<SecurityState>('ARMED');

  const getStateConfig = (currentState: SecurityState) => {
    switch (currentState) {
      case 'DISARMED':
        return {
          color: '#9E9E9E',
          bgColor: 'rgba(158, 158, 158, 0.2)',
          icon: Shield,
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

  const config = getStateConfig(state);
  const Icon = config.icon;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#121212' }}>
      <header className="px-5 py-4 flex items-center gap-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.12)', minHeight: '64px' }}>
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg active:bg-white/10" style={{ minHeight: '44px', minWidth: '44px' }}>
          <ArrowLeft style={{ color: '#ffffff' }} size={26} />
        </button>
        <h1 className="text-2xl" style={{ color: '#FFB300', fontWeight: 600 }}>Security Control</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-5 space-y-6 pb-6">
        <div
          className="p-10 rounded-2xl border-4"
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.color
          }}
        >
          <div className="flex flex-col items-center text-center space-y-5">
            <div
              className="p-7 rounded-full"
              style={{ backgroundColor: config.color }}
            >
              <Icon style={{ color: '#121212' }} size={64} />
            </div>
            <div>
              <h2 className="text-5xl mb-3" style={{ color: config.color, fontWeight: 700 }}>
                {config.label}
              </h2>
              <p className="text-base" style={{ color: '#9E9E9E' }}>{config.description}</p>
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
                  backgroundColor: state === s ? getStateConfig(s).bgColor : 'rgba(255, 255, 255, 0.05)',
                  border: state === s ? `3px solid ${getStateConfig(s).color}` : '3px solid transparent'
                }}
              >
                <p
                  className="text-xs"
                  style={{
                    color: state === s ? getStateConfig(s).color : '#9E9E9E',
                    fontWeight: state === s ? 600 : 400
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
            onClick={() => setState('ARMED')}
            disabled={state === 'ARMED'}
            className="w-full py-5 text-lg rounded-2xl transition-all disabled:opacity-50 active:scale-98"
            style={{
              backgroundColor: state === 'ARMED' ? 'rgba(0, 197, 83, 0.3)' : '#00C853',
              color: '#121212',
              fontWeight: 600,
              minHeight: '56px'
            }}
          >
            Arm Security System
          </button>

          <button
            onClick={() => setState('DISARMED')}
            disabled={state === 'DISARMED'}
            className="w-full py-5 text-lg rounded-2xl transition-all disabled:opacity-50 active:scale-98"
            style={{
              backgroundColor: state === 'DISARMED' ? 'rgba(158, 158, 158, 0.3)' : '#9E9E9E',
              color: '#121212',
              fontWeight: 600,
              minHeight: '56px'
            }}
          >
            Disarm Security System
          </button>

          {state === 'TRIGGERED' && (
            <button
              onClick={() => setState('DISARMED')}
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
            onClick={() => setState('TRIGGERED')}
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
              <span style={{ color: '#00C853', fontWeight: 600 }}>Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#9E9E9E' }}>Vibration Sensor</span>
              <span style={{ color: '#00C853', fontWeight: 600 }}>Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#9E9E9E' }}>120dB Alarm</span>
              <span style={{ color: state === 'TRIGGERED' ? '#D50000' : '#9E9E9E', fontWeight: 600 }}>
                {state === 'TRIGGERED' ? 'Sounding' : 'Standby'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#9E9E9E' }}>GPS Tracking</span>
              <span style={{ color: '#00C853', fontWeight: 600 }}>Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
