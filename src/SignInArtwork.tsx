import Brand from './Brand';
import {VehicleVisualization} from './VehicleVisualization';

export default function SignInArtwork(){
 return <section className="login-art signin-art" aria-label="SolAir connected mobility">
  <Brand/>
  <span className="eyebrow">ENERGY. SECURITY. CONNECTION.</span>
  <h1>A smarter journey<br/>starts here.</h1>
  <p>One platform for your e-trike,<br/>your people and the road ahead.</p>
  <VehicleVisualization/>
  <small>White BEMAC 68VM · Reference-based visualization</small>
 </section>;
}
