import { AlertTriangle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';

interface IntrusionModalProps {
  onClose: () => void;
  onDisarm: () => void;
}

export function IntrusionModal({ onClose, onDisarm }: IntrusionModalProps) {
  const navigate = useNavigate();

  const handleDisarm = () => {
    onDisarm();
    onClose();
  };

  const handleOpenMessages = () => {
    navigate('/sms-alert');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Blurred Background Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(12px)'
        }}
        onClick={onClose}
      />

      {/* Center Modal */}
      <div
        className="relative w-full max-w-md rounded-3xl p-8 animate-pulse-slow"
        style={{
          backgroundColor: '#1E1E1E',
          border: '4px solid #D50000',
          boxShadow: '0 0 40px rgba(213, 0, 0, 0.5), 0 0 80px rgba(213, 0, 0, 0.3)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      >
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="p-5 rounded-full"
            style={{
              backgroundColor: 'rgba(213, 0, 0, 0.15)',
              border: '3px solid #D50000'
            }}
          >
            <AlertTriangle size={56} style={{ color: '#D50000' }} strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center text-2xl mb-3"
          style={{
            color: '#ffffff',
            fontWeight: 700,
            letterSpacing: '0.5px',
            lineHeight: '1.3'
          }}
        >
          CRITICAL ALERT:
          <br />
          INTRUSION DETECTED
        </h1>

        {/* Sub-text */}
        <p
          className="text-center text-base mb-6"
          style={{
            color: '#9E9E9E',
            lineHeight: '1.5'
          }}
        >
          Simulated intrusion trigger. No hardware alarm or security command is sent.
        </p>

        {/* Status Box */}
        <div
          className="rounded-2xl p-5 mb-6 space-y-3"
          style={{
            backgroundColor: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm" style={{ color: '#9E9E9E', minWidth: '80px' }}>
              Location:
            </span>
            <span className="text-sm" style={{ color: '#ffffff', fontWeight: 600 }}>
              Malabon City Terminal
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm" style={{ color: '#9E9E9E', minWidth: '80px' }}>
              Action:
            </span>
            <span className="text-sm" style={{ color: '#ffffff', fontWeight: 600 }}>
              Example SMS alert only. No message has been sent.
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Primary Button */}
          <button
            onClick={handleDisarm}
            className="w-full py-4 rounded-2xl text-lg transition-all active:scale-98"
            style={{
              backgroundColor: '#D50000',
              color: '#ffffff',
              fontWeight: 700,
              minHeight: '56px',
              boxShadow: '0 4px 16px rgba(213, 0, 0, 0.4)'
            }}
          >
            Acknowledge & Disarm
          </button>

          {/* Secondary Button */}
          <button
            onClick={handleOpenMessages}
            className="w-full py-4 rounded-2xl text-base transition-all active:scale-98 flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontWeight: 600,
              minHeight: '56px',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <MessageSquare size={20} style={{ color: '#9E9E9E' }} />
            <span>View Example SMS</span>
            <span style={{ color: '#9E9E9E' }}>→</span>
          </button>
        </div>

        {/* Timestamp */}
        <p
          className="text-center text-xs mt-5"
          style={{ color: '#9E9E9E' }}
        >
          Demo triggered at {new Date().toLocaleTimeString()}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 40px rgba(213, 0, 0, 0.5), 0 0 80px rgba(213, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 50px rgba(213, 0, 0, 0.7), 0 0 100px rgba(213, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
