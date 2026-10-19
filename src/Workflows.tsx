import {useEffect,useState} from 'react';
import {api,stamp,value} from './api';
import type {Profile,Vehicle} from './types';
import {deviceHealth} from '../packages/device-health';

export function SetupChecklist({user,revision,go}:{user:Profile;revision:number;go:(page:string)=>void}) {
  const [data,setData]=useState<any>(null),[error,setError]=useState('');
  useEffect(()=>{let active=true;setData(null);setError('');void api('/setup-readiness').then(v=>{if(active)setData(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[user.id,user.org_id,revision]);
  return <section className="panel setup-checklist" aria-label="Account setup"><div className="panel-heading"><h3>{data?.assignment_complete?'Your account setup':'Finish your account setup'}</h3><button onClick={()=>go('Settings')}>Open settings</button></div>
    {error&&<p role="alert">Could not check setup: {error}. Refresh the page to try again.</p>}{!error&&!data&&<p>Checking your saved assignments…</p>}
    {data&&<><p>{data.assignment_complete?'Your TODA, vehicle and operator are linked.':'Complete the steps below with your TODA. Creating an account does not assign a vehicle.'}</p><details open={!data.assignment_complete}><summary>{data.tasks.filter((t:any)=>t.required&&!t.complete).length} required setup step(s) remaining · View checklist</summary><ul className="setup-tasks">{data.tasks.map((task:any)=><li key={task.id} className={task.complete?'complete':'pending'}><strong>{task.complete?'✓':'○'} {task.label}{!task.required?' · Optional alerts':''}</strong><span>{task.complete&&['account','mobile','email','phone'].includes(task.id)?'Complete':task.action}</span></li>)}</ul></details><small>{data.sms_opted_in?'SMS also needs a commissioned device and configured service.':'SMS alerts are optional. You can enable them in Settings after contact verification.'} Device testing is separate.</small></>}
  </section>;
}

const sensorNames:Record<string,string>={mpu6050:'Motion sensor',mpu6500_compatible:'Compatible motion sensor',ads1115:'Voltage inputs',acs758:'Current sensor',pzem017:'Bench energy meter',switches:'Lid and mount switches',gps:'GPS receiver',lte:'Cellular modem'};
const states:Record<string,string>={fresh:'Recent',stale:'Old reading',unknown:'Age unknown',absent:'Not available',fault:'Needs inspection',uncalibrated:'Calibration needed'};
const age=(ms:number|null)=>ms===null?'Time unknown':ms<1000?'Less than 1 second':`${Math.floor(ms/1000)} seconds`;
export function NotificationReadiness({vehicleId,revision,mode,go}:{vehicleId:string;revision:number;mode:string;go:(page:string)=>void}) {
  const [data,setData]=useState<any>(null),[error,setError]=useState('');
  useEffect(()=>{let active=true;setData(null);setError('');if(mode==='hardware')void api('/notification-readiness/'+encodeURIComponent(vehicleId)).then(v=>{if(active)setData(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[vehicleId,revision,mode]);
  if(mode==='demo')return null;
  return <section className="panel notification-readiness"><div className="panel-heading"><h3>SMS alert readiness</h3><button onClick={()=>go('Settings')}>Manage my alert contact</button></div>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>Checking alert configuration…</p>}{data&&<><p>{data.configured_for_future_alerts?'Configuration checks complete; actual delivery is still unverified.':'SMS alerts are not fully configured for this vehicle.'} Sending mode: {data.mode}.</p><details><summary>View notification requirements</summary><ul>{data.checks.map((c:any)=><li key={c.label}>{c.complete?'✓':'○'} {c.label}</li>)}</ul></details><small>{data.message}</small></>}</section>;
}
export function DeviceStatus({vehicle,mode,go}:{vehicle:Vehicle;mode:string;go:(page:string)=>void}) {
  const t=vehicle.telemetry,h=deviceHealth(t),gps=vehicle.gps;
  return <section className="panel device-status" aria-label="Vehicle status"><div className="panel-heading"><h3>Your vehicle status · {vehicle.id}</h3><span className="badge">{mode==='demo'?'Simulated readings':'Reported hardware'}</span></div>
    <div className="status-grid">
      <article><h4>Device connection</h4><strong>{h.connection}</strong><p>{t?'Last contact: '+stamp(t.received_at):'Waiting for the device.'}</p></article>
      <article><h4>Battery</h4><strong>{h.battery==='fresh'?`${value(t?.battery_voltage_v)} V`:h.battery==='unavailable'?'Not available':h.battery==='uncalibrated'?'Calibration needed':h.battery==='stale'?'Old reading':'Time unknown'}</strong><p>{h.battery==='fresh'?'Measured voltage, not remaining range.':'No recent, verified battery reading.'}</p><button onClick={()=>go('Energy')}>View energy</button></article>
      <article><h4>Location</h4><strong>{h.gps==='fresh'?'Recent GPS fix':h.gps==='stale'?'GPS fix is old':h.gps==='unknown'?'GPS time unknown':'No current GPS fix'}</strong><p>Fix age: {age(h.gps_age_ms)}{gps?`. Last saved position: ${stamp(gps.measured_at)}.`:'. No saved position.'}</p><button onClick={()=>go('Live Fleet Map')}>View location</button></article>
      <article><h4>Security</h4><strong>{h.security!=='fresh'?'State unknown':t?.alarm_active?'Alarm activation reported':t?.armed?'Reported armed':'Reported disarmed'}</strong><p>{h.security!=='fresh'?'Waiting for a recent device report.':'Reported state; siren sound unconfirmed.'}</p><button onClick={()=>go('Security')}>View alerts</button></article>
    </div>
    <details><summary>Sensor status and reading ages</summary><p>A recent device contact does not make every sensor current. Ages use device capture time plus reported sensor age; missing or invalid UTC stays unknown.</p>{!h.sensors.length&&<p>No sensor health has been reported.</p>}<ul className="sensor-status-list">{h.sensors.map(s=><li key={s.key}><strong>{sensorNames[s.key]||s.key}</strong><span>{states[s.state]} · {age(s.age_ms)}</span></li>)}</ul></details>
    {(h.dropped_events||t?.sensor_health?.event_buffer==='fault')&&<p role="alert">The device reports lost or unbuffered events. Saved history may be incomplete. Ask the hardware team to inspect the queue.</p>}
    <div className="button-row"><button onClick={()=>go('SOS & Assistance')}>Get help from my TODA</button><button onClick={()=>go('History & Reports')}>View my history</button></div>
  </section>;
}

export function EvidenceDownloads({vehicle,mode,user}:{vehicle:Vehicle;mode:string;user:Profile}) {
  const v=encodeURIComponent(vehicle.id),d=encodeURIComponent(vehicle.device_id||'');
  return <section className="panel evidence-downloads"><h3>Research evidence · {vehicle.id}</h3><p>{mode==='demo'?'SIMULATED — presentation records only.':'REPORTED HARDWARE — physical acceptance must be recorded separately.'} Exports include only this authorized vehicle and the selected source.</p><div className="button-row"><a className="button" href={`/api/research-export/${v}?mode=${mode}`}>Download research CSV</a><a className="button" href={`/api/cpe-export/${v}?mode=${mode}`}>Download CPE readings CSV</a>{mode==='hardware'&&<a className="button" href={`/api/incidents/${v}?mode=hardware&format=csv`}>Download incident evidence CSV</a>}{vehicle.device_id&&['engineer','admin'].includes(user.role)&&<a className="button" href={`/api/bench-export/${d}?mode=${mode}`}>Download recorded bench results</a>}</div><p className="subtle">Telemetry and CPE exports: newest 5,000 rows. Incidents: newest 200, with handling history and delivery attempts. Unknown times stay blank; server response times and device reporting delays are separate. Downloading evidence does not mark a physical test as passed.</p></section>;
}
