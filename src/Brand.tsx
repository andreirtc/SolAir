import {solarWordPath,airWordPath} from './brand-paths';
export default function Brand(){
  return <div className="brand"><svg className="solair-wordmark" viewBox="0 0 310 114" role="img" aria-label="SolAir — connected mobility">
    <g className="logo-solar" fill="currentColor"><circle cx="35" cy="38" r="22" opacity=".1"/><path d="M35 9C39 30 43 34 64 38C43 42 39 46 35 67C31 46 27 42 6 38C27 34 31 30 35 9Z"/><path d="M35 33C66 0 119 3 151 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></g>
    <path className="logo-solar" d={solarWordPath}/><path className="logo-air" d={airWordPath}/>
    <g className="logo-wind" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M179 92C212 77 246 105 294 82" strokeWidth="4"/><path d="M196 102C223 93 247 111 274 101" strokeWidth="2.5"/></g>
  </svg><span className="brand-caption">ENERGY · SECURITY · MOBILITY</span></div>;
}
