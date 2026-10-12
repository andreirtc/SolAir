import { AuthProvider, Protected } from './auth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ExpandedMapView } from './components/ExpandedMapView';
import { SMSAlertView } from './components/SMSAlertView';
import '../styles/demo-mode.css';

export default function App() {
  return (
    <div className="dark solair-demo-shell">
      <aside
        className="solair-demo-banner"
        aria-label="Application data sources"
      >
        <strong>SOLAIR · LOCAL MONITORING</strong>
        <span>
          Device source and freshness shown on dashboard · Maps and controls are examples
        </span>
      </aside>

      <BrowserRouter>
        <AuthProvider><Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/pairing" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Protected><DashboardScreen /></Protected>} />
          <Route path="/map" element={<Protected><ExpandedMapView /></Protected>} />
          <Route path="/sms-alert" element={<Protected><SMSAlertView /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></AuthProvider>
      </BrowserRouter>
    </div>
  );
}
