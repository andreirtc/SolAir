import Brand from './Brand';
import {VehicleVisualization} from './VehicleVisualization';
import {ChevronsRight} from 'lucide-react';

export default function MobileIntro({onStart}:{onStart:()=>void}){
  return <main className="mobile-intro welcome-screen" aria-labelledby="welcome-heading">
    <Brand/>
    <div className="welcome-art"><VehicleVisualization/></div>
    <div className="intro-message"><span className="eyebrow">ENERGY. SECURITY. CONNECTION.</span><h1 id="welcome-heading">A smarter<br/><mark>journey</mark><br/>starts with you.</h1><p>Your vehicle, location and alerts.<br/>Together in one simple app.</p></div>
    <div className="welcome-actions">
      <button type="button" className="welcome-start" onClick={onStart}>Get started</button>
      <button type="button" className="welcome-next" aria-label="Continue to sign in" onClick={onStart}><ChevronsRight size={22} aria-hidden="true"/></button>
    </div>
  </main>;
}
