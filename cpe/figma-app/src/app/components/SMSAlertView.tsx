import { ArrowLeft, Phone, Plus, Mic } from 'lucide-react';
import { useNavigate } from 'react-router';

export function SMSAlertView() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Native OS Messaging Header */}
      <header
        className="px-4 py-3 flex items-center justify-between border-b flex-shrink-0"
        style={{
          backgroundColor: '#1C1C1E',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          minHeight: '56px'
        }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 active:opacity-60"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ArrowLeft size={20} style={{ color: '#007AFF' }} />
          <span className="text-base" style={{ color: '#007AFF' }}>Back</span>
        </button>

        <h1 className="text-base" style={{ color: '#ffffff', fontWeight: 600 }}>
          SolAir Security Node
        </h1>

        <button className="p-2 active:opacity-60" style={{ minHeight: '44px', minWidth: '44px' }}>
          <Phone size={20} style={{ color: '#007AFF' }} />
        </button>
      </header>

      {/* Chat Body Area */}
      <main
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="flex justify-start mb-6">
          <div className="max-w-[85%]">
            {/* Timestamp */}
            <div className="text-center mb-3">
              <span className="text-xs" style={{ color: '#8E8E93' }}>
                Just Now
              </span>
            </div>

            {/* Message Bubble */}
            <div
              className="rounded-3xl px-5 py-4"
              style={{
                backgroundColor: '#1C1C1E',
                borderRadius: '20px'
              }}
            >
              <div className="space-y-3">
                {/* Critical Alert Header */}
                <p
                  className="text-base leading-relaxed"
                  style={{
                    color: '#D50000',
                    fontWeight: 700,
                    letterSpacing: '0.3px'
                  }}
                >
                  [CRITICAL ALERT]
                  <br />
                  Unauthorized Intrusion Detected!
                </p>

                {/* Alert Details */}
                <div className="space-y-2 text-sm" style={{ color: '#ffffff' }}>
                  <p>
                    <span style={{ color: '#8E8E93' }}>Vehicle:</span> ET-01 (TODA Malabon)
                  </p>
                  <p>
                    <span style={{ color: '#8E8E93' }}>Time:</span> Just Now
                  </p>
                  <p>
                    <span style={{ color: '#8E8E93' }}>Location:</span> 14.6549° N, 120.9668° E
                  </p>
                  <p>
                    <span style={{ color: '#8E8E93' }}>Status:</span> 120dB Alarm Active. FSM State 10.
                  </p>
                </div>

                {/* Action Required */}
                <p className="text-sm leading-relaxed pt-2" style={{ color: '#ffffff' }}>
                  <span style={{ color: '#8E8E93' }}>Action Required:</span> Tap link below to view Live Dashboard and GPS Tracking.
                </p>

                {/* Link */}
                <a
                  href="https://solair.app/et-01/alert"
                  className="block text-sm pt-2 active:opacity-70 break-all"
                  style={{ color: '#007AFF', textDecoration: 'underline' }}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/dashboard');
                  }}
                >
                  https://solair.app/et-01/alert
                </a>
              </div>
            </div>

            {/* Message Tail */}
            <div
              className="w-0 h-0 ml-5 -mt-1"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid #1C1C1E',
                borderBottom: '8px solid transparent'
              }}
            />
          </div>
        </div>
      </main>

      {/* Native Text Input Bar */}
      <div
        className="px-4 py-2 border-t flex-shrink-0"
        style={{
          backgroundColor: '#1C1C1E',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Plus Button */}
          <button className="p-2 active:opacity-60" style={{ minHeight: '44px', minWidth: '44px' }}>
            <Plus size={24} style={{ color: '#007AFF' }} />
          </button>

          {/* Text Input */}
          <div
            className="flex-1 rounded-full px-5 py-2.5 flex items-center"
            style={{
              backgroundColor: '#2C2C2E',
              minHeight: '36px'
            }}
          >
            <span className="text-base" style={{ color: '#8E8E93' }}>
              Text Message
            </span>
          </div>

          {/* Microphone Button */}
          <button className="p-2 active:opacity-60" style={{ minHeight: '44px', minWidth: '44px' }}>
            <Mic size={24} style={{ color: '#8E8E93' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
