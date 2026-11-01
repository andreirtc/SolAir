import {ArrowUpRight,Battery,Sun,Wind,Zap} from 'lucide-react';
import type {Vehicle} from './types';
import {deviceHealth} from '../packages/device-health';
import RecordedLineChart from './RecordedLineChart';
import {useHomeEnergyHistory} from './HomeEnergyHistory';
import {energySeries} from './energy-visual-data';
import {sourcePower} from '../packages/telemetry-contract';

const finite=(n:number|null|undefined):n is number=>typeof n==='number'&&Number.isFinite(n);
const reading=(n:number|null|undefined,digits=1)=>finite(n)?n.toFixed(digits):'—';

export default function DriverEnergySummary({vehicle,mode,go}:{vehicle:Vehicle;mode:string;go:(page:string)=>void}){
 const history=useHomeEnergyHistory();
 const t=vehicle.telemetry,health=deviceHealth(t);
 const calibrated=!!t&&(t.source_type!=='hardware'||t.calibration_status==='calibrated');
 const electrical=(n:number|null|undefined)=>calibrated&&finite(n)?n:null;
 const voltage=electrical(t?.battery_voltage_v),current=electrical(t?.battery_current_a);
 const solarPower=calibrated&&t?sourcePower(t,'solar'):null;
 const state=!t?'No reading':!calibrated?'Calibration needed':health.capture_age_ms===null?'Time unknown':health.capture_age_ms>30000?'Old reading':'Last reported';
 return <section className="driver-energy-summary" aria-label="Energy at a glance">
  <div className="energy-summary-heading"><div><h3>Energy at a glance</h3><p>{mode==='demo'?'Simulated readings':'Reported hardware'}</p></div><button onClick={()=>go('Energy')} aria-label="View energy details"><ArrowUpRight size={20} aria-hidden="true"/></button></div>
  {history.error&&<div className="home-energy-history-error" role="status"><span>{history.error} {history.samples.length?"Showing previously loaded samples.":"Graphs are unavailable."}</span><button onClick={history.retry}>Retry graph history</button></div>}
  <div className="energy-glass-grid">
   <button className="energy-glass-card" onClick={()=>go('Energy')}><Battery size={18} aria-hidden="true"/><span>Battery</span><strong>{reading(voltage)} <em>V</em></strong><span className="energy-secondary-value">{reading(current)} <em>A</em></span><RecordedLineChart points={energySeries(history.samples,'battery_voltage_v')} label="Battery voltage" unit="V" simulated={mode==='demo'}/><small>{voltage===null&&current===null&&calibrated?'Not available':state}</small></button>
   <button className="energy-glass-card" onClick={()=>go('Energy')}><Sun size={18} aria-hidden="true"/><span>Solar harvested</span><strong>{reading(vehicle.solar_wh,2)} <em>Wh</em></strong><RecordedLineChart points={energySeries(history.samples,'solar_window_wh')} label="Solar energy · sample window" unit="Wh" simulated={mode==='demo'}/><small>{finite(vehicle.solar_wh)?'Recorded total':'Not available'}</small></button>
   <button className="energy-glass-card" onClick={()=>go('Energy')}><Wind size={18} aria-hidden="true"/><span>Wind harvested</span><strong>{reading(vehicle.wind_wh,2)} <em>Wh</em></strong><RecordedLineChart points={energySeries(history.samples,'wind_window_wh')} label="Wind energy · sample window" unit="Wh" simulated={mode==='demo'}/><small>{finite(vehicle.wind_wh)?'Recorded total':mode==='demo'?'No simulated reading':'Not commissioned'}</small></button>
   <button className="energy-glass-card" onClick={()=>go('Energy')}><Zap size={18} aria-hidden="true"/><span>Solar power</span><strong>{reading(solarPower)} <em>W</em></strong><RecordedLineChart points={energySeries(history.samples,'solar_power_w')} label="Solar power" unit="W" simulated={mode==='demo'}/><small>{solarPower===null&&calibrated?'Not available':state}</small></button>
  </div>
  <p className="energy-summary-note">Energy totals cover recorded samples; gaps are excluded. Graphs show up to 24 timestamped samples; Wh graphs cover this sample window only. Battery current: + charging, − discharging.</p>
 </section>;
}
