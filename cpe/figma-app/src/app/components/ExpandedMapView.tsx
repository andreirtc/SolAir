import { ArrowLeft, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router';
import mapImage from '../../imports/6383990d-0308-4d3d-85d1-96f1f5145c7b.jpg';

export function ExpandedMapView() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen relative overflow-hidden" style={{ backgroundColor: '#121212' }}>
      {/* Full-Screen Map Background */}
      <div className="absolute inset-0">
        <img src={mapImage} alt="Fixed example map with simulated route" className="w-full h-full object-cover" />

        {/* Route Line Overlay - Simulated with SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00E5FF', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#00E5FF', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Curved route path */}
          <path
            d="M 80 520 Q 120 400, 180 320 T 280 180"
            stroke="url(#routeGradient)"
            strokeWidth="6"
            strokeDasharray="12 8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Vehicle Pin at top of route */}
        <div
          className="absolute"
          style={{
            top: '180px',
            left: '280px',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        >
          <div
            className="relative w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: '#1E1E1E',
              border: '4px solid #FFB300',
              boxShadow: '0 4px 16px rgba(255, 179, 0, 0.4)'
            }}
          >
            <Navigation
              size={32}
              style={{
                color: '#FFB300',
                transform: 'rotate(45deg)'
              }}
              fill="#FFB300"
            />
          </div>
        </div>
      </div>

      {/* Top-Left Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.85)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 10
        }}
      >
        <ArrowLeft size={24} style={{ color: '#ffffff' }} />
      </button>

      {/* Bottom Floating Telemetry Card */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-md rounded-3xl p-6"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 10
        }}
      >
        <p className="text-xs mb-3" style={{ color: '#00E5FF' }}>Fixed map and readings example · GPS simulated</p>
        <div className="flex items-center">
          {/* Left Column - Battery */}
          <div className="flex-1">
            <p
              className="text-xs mb-2"
              style={{
                color: '#9E9E9E',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600
              }}
            >
              Main Battery
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl" style={{ color: '#ffffff', fontWeight: 700 }}>
                78%
              </p>
              <p className="text-lg" style={{ color: '#00E5FF', fontWeight: 600 }}>
                55.2V
              </p>
            </div>
          </div>

          {/* Vertical Divider */}
          <div
            className="w-px h-16 mx-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          />

          {/* Right Column - Speed */}
          <div className="flex-1">
            <p
              className="text-xs mb-2"
              style={{
                color: '#9E9E9E',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600
              }}
            >
              Current Speed
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl" style={{ color: '#ffffff', fontWeight: 700 }}>
                24
              </p>
              <p className="text-lg" style={{ color: '#9E9E9E', fontWeight: 500 }}>
                km/h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
