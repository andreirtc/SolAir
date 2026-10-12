import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Wifi } from 'lucide-react';

export function PairingScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/dashboard'), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center px-8 overflow-hidden" style={{ backgroundColor: '#121212' }}>
      <div className="w-full max-w-sm text-center space-y-12">
        <div className="space-y-8">
          <div className="relative mx-auto w-32 h-32">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: '#00E5FF', opacity: 0.3 }}
            />
            <div
              className="relative flex items-center justify-center w-full h-full rounded-full"
              style={{ backgroundColor: '#00E5FF' }}
            >
              <Wifi size={48} style={{ color: '#121212' }} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl" style={{ color: '#ffffff', fontWeight: 600 }}>Connecting to Device</h2>
            <p className="text-base" style={{ color: '#9E9E9E' }}>
              Connecting to SolAir Node ET-01...
            </p>
          </div>

          <div className="w-full rounded-full h-3" style={{ backgroundColor: '#1E1E1E' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                backgroundColor: '#00E5FF',
                width: `${progress}%`
              }}
            />
          </div>

          <p className="text-2xl" style={{ color: '#00E5FF', fontWeight: 600 }}>{progress}%</p>
        </div>
      </div>
    </div>
  );
}
