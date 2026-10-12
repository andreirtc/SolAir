import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';

type Session = { authenticated: boolean; username?: string; deviceId?: string; csrfToken: string; expiresAt: number | null };
type Auth = { session: Session | null; notice: string; networkError: boolean; checking: boolean; check: () => Promise<Session>; request: (url: string, options?: RequestInit) => Promise<Response>; login: (username: string, password: string) => Promise<void>; logout: () => Promise<void>; signedOut: () => void };
const Context = createContext<Auth | null>(null);
export const useAuth = () => { const auth = useContext(Context); if (!auth) throw new Error('Auth provider required.'); return auth; };
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [checking, setChecking] = useState(true);
  const current = useRef<Session | null>(null);
  const generation = useRef(0);
  const checkingRequest = useRef<Promise<Session> | null>(null);
  const update = (value: Session | null) => { generation.current++; current.current = value; setSession(value); };
  const signedOut = () => { update(null); setNetworkError(false); setNotice('Your session ended. Please sign in again.'); };
  const check = (): Promise<Session> => {
    if (checkingRequest.current) return checkingRequest.current;
    const started = generation.current;
    const pending = (async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error();
      const value = await response.json();
      if (started === generation.current) {
        if (current.current?.authenticated && !value.authenticated) setNotice('Your session ended. Please sign in again.');
        update(value); setNetworkError(false);
      }
      return value;
    } catch { if (started === generation.current) setNetworkError(true); throw new Error('Cannot reach the local backend. Check that SolAir is running.'); }
    finally { setChecking(false); checkingRequest.current = null; }
    })();
    checkingRequest.current = pending; return pending;
  };
  useEffect(() => {
    void check().catch(() => {});
    const timer = window.setInterval(() => {
      if (current.current?.authenticated && current.current.expiresAt! <= Date.now()) signedOut();
      void check().catch(() => {});
    }, 1000);
    const channel = new BroadcastChannel('solair-auth');
    channel.onmessage = () => { signedOut(); void check().catch(() => {}); };
    return () => { window.clearInterval(timer); channel.close(); };
  }, []);
  const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, { ...options, cache: 'no-store', credentials: 'same-origin', headers: { ...(options.method === 'POST' ? { 'X-CSRF-Token': current.current?.csrfToken ?? '' } : {}), ...options.headers } });
    if (response.status === 401) signedOut();
    return response;
  };
  const login = async (username: string, password: string) => {
    const before = await check();
    let response;
    try { response = await fetch('/api/auth/login', { method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': before.csrfToken }, body: JSON.stringify({ username, password }), signal: AbortSignal.timeout(15000) }); }
    catch { throw new Error('Sign-in could not be confirmed. Check the local backend and retry.'); }
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || 'Sign-in failed.');
    update(value); setNotice('');
  };
  const logout = async () => {
    try {
    const response = await request('/api/auth/logout', { method: 'POST' });
    if (!response.ok) { setNotice('Logout could not be confirmed. Check the backend and retry.'); return; }
    signedOut();
    const channel = new BroadcastChannel('solair-auth'); channel.postMessage('logout'); channel.close();
    void check().catch(() => {});
    } catch { setNotice('Logout could not be confirmed. Check the local backend and retry.'); }
  };
  return <Context.Provider value={{ session, notice, networkError, checking, check, request, login, logout, signedOut }}>{children}</Context.Provider>;
}
export function Protected({ children }: { children: ReactNode }) {
  const { session, networkError, checking, check } = useAuth();
  if (checking) return <div role="status" style={{ color: '#FFB300', padding: 32 }}>Checking operator session…</div>;
  if (!session) return networkError ? <div role="alert" style={{ color: '#FFB300', padding: 32 }}>Local backend unavailable. <button onClick={() => void check().catch(() => {})}>Retry</button></div> : <Navigate to="/login" replace />;
  if (!session.authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
