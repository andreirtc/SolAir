import Brand from './Brand';
import {VehicleVisualization} from './VehicleVisualization';

export default function MobileIntro(){
  return <main className="mobile-intro" role="status" aria-label="Starting SOLAIR">
    <Brand/>
    <div className="intro-message"><span className="eyebrow">ENERGY. SECURITY. CONNECTION.</span><h1>A smarter<br/>journey<br/>starts here.</h1></div>
    <VehicleVisualization/>
    <small>White BEMAC 68VM · Reference-based visualization</small>
  </main>;
}
