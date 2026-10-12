import { useAuth } from '../auth';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Lock, Mail } from 'lucide-react';

export function LoginScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true); setError('');
    try { await auth.login(email, password); setPassword(''); navigate('/dashboard', { replace: true }); }
    catch (error) { setError(error instanceof Error ? error.message : 'Sign-in failed. Check the backend.'); setPassword(''); }
    finally { setPending(false); }
  };

  if (auth.session?.authenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="h-screen w-screen flex items-center justify-center px-8 overflow-hidden" style={{ backgroundColor: '#121212' }}>
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl" style={{ color: '#FFB300', fontWeight: 600 }}>Welcome Back</h1>
          <p className="text-base" style={{ color: '#9E9E9E' }}>Sign in to access your SolAir dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9E9E9E' }} size={22} />
              <input
                type="text"
                autoComplete="username"
                maxLength={64}
                aria-label="Operator username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Operator username"
                required
                className="w-full pl-14 pr-5 py-5 text-base rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#1E1E1E',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  minHeight: '56px'
                }}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9E9E9E' }} size={22} />
              <input
                type="password"
                autoComplete="current-password"
                maxLength={256}
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-14 pr-5 py-5 text-base rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#1E1E1E',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  minHeight: '56px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-5 text-lg rounded-full transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: '#FFB300',
              color: '#121212',
              fontWeight: 600,
              minHeight: '56px'
            }}
          >
            {pending ? 'Signing in…' : 'Login'}
          </button>

          {(error || auth.notice) && <p role="alert" style={{ color: '#FFB300' }}>{error || auth.notice}</p>}
          <p className="text-center text-base" style={{ color: '#9E9E9E' }}>Operators are created privately in the local terminal. Public sign-up and mock pairing are disabled.</p>
        </form>
      </div>
    </div>
  );
}
