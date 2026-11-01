import {useEffect,useState} from 'react';
import {api,value,stamp} from './api';
import type {BatteryEstimate} from '../packages/research';

export default function BatterySummary({vehicleId,mode,configure=false}:{vehicleId:string;mode:string;configure?:boolean}){
 const [data,setData]=useState<BatteryEstimate|null>(null),[error,setError]=useState(''),[status,setStatus]=useState(''),[reload,setReload]=useState(0);
 const [profile,setProfile]=useState('prototype_48v_10ah'),[capacity,setCapacity]=useState('10');
 useEffect(()=>{let active=true,seq=0;setData(null);setError('');const load=async()=>{const n=++seq;try{const d=await api(`/battery/${vehicleId}?mode=${mode}`);if(active&&n===seq){setData(d);setError('');}}catch(e){if(active&&n===seq){setData(null);setError((e as Error).message);}}};void load();const timer=setInterval(load,5000);return()=>{active=false;clearInterval(timer);};},[vehicleId,mode,reload]);
 const save=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);setStatus('Saving reference…');
  try{await api(`/battery/${vehicleId}/reference?mode=${mode}`,'POST',{profile,capacity_ah:Number(capacity),capacity_basis:f.get('capacity_basis'),initial_soc_pct:Number(f.get('initial_soc_pct')),reference_basis:f.get('reference_basis'),reference_at:new Date(String(f.get('reference_at'))).toISOString(),reserve_pct:Number(f.get('reserve_pct')),charge_efficiency:Number(f.get('charge_efficiency')),evidence:f.get('evidence')});setStatus('Reference saved. This does not calibrate the sensor or validate the estimate.');setReload(n=>n+1);}catch(e){setStatus((e as Error).message);}
 };
 const localNow=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,19);
 return <section className="panel" aria-label="Battery percentage and time to empty">
  <div className="panel-heading"><h3>Battery percentage &amp; time to empty</h3><span className="badge">{mode==='demo'?'DEMO / SIMULATED':data?.quality==='estimated'?'ESTIMATED':'NOT AVAILABLE'}</span></div>
  {error&&<p role="alert">{error}</p>}
  <div className="metrics"><div className="metric"><span>Estimated battery percentage</span><strong>{value(data?.soc_pct)} %</strong></div><div className="metric"><span>Estimated TTE to selected reserve</span><strong>{value(data?.tte_minutes)} min</strong></div></div>
  <p>{data?.reason||'Loading battery estimate…'}</p><p>{data?.tte_reason}</p>
  {data?.reference&&<p className="subtle">{data.reference.profile==='prototype_48v_10ah'?'48 V / 10 Ah prototype':'55.2 V / 80 Ah BEMAC reference'} · {data.reference.capacity_ah} Ah ({data.reference.capacity_basis}) · reserve {data.reference.reserve_pct}% · starting SOC {data.reference.initial_soc_pct}% ({data.reference.reference_basis.replaceAll('_',' ')}) · sample {stamp(data.as_of)}</p>}
  <p className="subtle">Current integration from a recorded SOC reference. TTE assumes the recent mean net discharge continues. Charging, stale readings, invalid current or missing history cannot produce a reliable countdown. Forecast accuracy remains unvalidated.</p>
  {configure&&<details><summary>Record battery reference · engineering</summary><form onSubmit={save}>
   <label>Battery profile<select value={profile} onChange={e=>{setProfile(e.target.value);setCapacity(e.target.value==='prototype_48v_10ah'?'10':'80');}}><option value="prototype_48v_10ah">48 V / 10 Ah prototype</option><option value="bemac_55v_80ah">55.2 V / 80 Ah BEMAC reference</option></select></label>
   <label>Usable capacity (Ah)<input type="number" min="0.001" max="1000" step="any" value={capacity} onChange={e=>setCapacity(e.target.value)} required/></label>
   <label>Capacity basis<select name="capacity_basis"><option value="nameplate">Nameplate assumption</option><option value="measured">Measured capacity</option></select></label>
   <label>Starting SOC (%)<input name="initial_soc_pct" type="number" min="0" max="100" step="any" required/></label>
   <label>SOC reference basis<select name="reference_basis"><option value="assumed_reference">Explicit assumption</option><option value="verified_reference">Verified independent reference</option></select></label>
   <label>Actual reference time<input name="reference_at" type="datetime-local" step="1" defaultValue={localNow} required/></label>
   <label>TTE target reserve (%) · selected operating assumption<input name="reserve_pct" type="number" min="0" max="99" step="any" required/></label>
   <label>Charge-counting efficiency (0–1) · document assumption<input name="charge_efficiency" type="number" min="0.001" max="1" step="any" required/></label>
   <label>Reference evidence and assumptions<textarea name="evidence" maxLength={2000} required/></label><button type="submit">Save battery reference</button>
  </form><p role="status">{status}</p></details>}
 </section>;
}
