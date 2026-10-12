import { useNavigate } from 'react-router';
import logoImage from '../../imports/SolAir.png';

export function OnboardingScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center px-8 overflow-hidden" style={{ backgroundColor: '#121212' }}>
      <div className="w-full max-w-sm text-center space-y-12">
        <div className="space-y-8">
          <img
            src={logoImage}
            alt="SolAir Logo"
            className="w-72 h-auto mx-auto"
          />
          <p className="text-base leading-relaxed px-4" style={{ color: '#9E9E9E', letterSpacing: '0.02em' }}>
            Hybrid Energy Telemetry & Anti-Tamper Security Node
          </p>
        </div>

        <div className="pt-8 px-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-5 rounded-full text-lg transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: '#FFB300',
              color: '#121212',
              fontWeight: 600,
              minHeight: '56px'
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
