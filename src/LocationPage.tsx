import {lazy,Suspense,useEffect,useState} from 'react';
import {ArrowRight,CarFront,Clock3,MapPin,Navigation,RefreshCw} from 'lucide-react';
import {api,stamp} from './api';
import type {Vehicle} from './types';
import {hasMapPosition,vehicleMapReference} from './map-reference';
import {inferRecordedStays,parseLocationHistory,type RecordedStay,type LocationSample} from './location-history';
const FleetMap=lazy(()=>import('./FleetMap'));

export default function LocationPage({vehicle,vehicles,select,mode,onOpenVehicle}:{vehicle:Vehicle;vehicles:Vehicle[];select:(id:string)=>void;mode:string;onOpenVehicle:()=>void}){
 const key=`${vehicle.id}:${mode}`;
 const [history,setHistory]=useState<{key:string;samples:LocationSample[];loading:boolean;error:string}>({key:'',samples:[],loading:true,error:''});
 const [attempt,setAttempt]=useState(0),[focused,setFocused]=useState<{key:string;stay:RecordedStay}|null>(null);
 useEffect(()=>{
  let active=true,pending=false;setHistory({key,samples:[],loading:true,error:''});
  const load=async()=>{if(pending)return;pending=true;try{const rows=await api(`/history/${encodeURIComponent(vehicle.id)}?mode=${encodeURIComponent(mode)}`);if(!Array.isArray(rows))throw Error('Location history is unavailable.');if(active)setHistory({key,samples:parseLocationHistory(rows,mode),loading:false,error:''});}catch(error){if(active)setHistory(previous=>({...previous,key,loading:false,error:(error as Error).message}));}finally{pending=false;}};
  void load();const timer=window.setInterval(load,30000);return()=>{active=false;window.clearInterval(timer);};
 },[key,vehicle.id,mode,attempt]);
 const current=history.key===key?history:{key,samples:[],loading:true,error:''},stays=inferRecordedStays(current.samples),reference=vehicleMapReference(vehicle),hasFix=hasMapPosition(vehicle);
 const activeStay=focused?.key===key?stays.find(stay=>stay.id===focused.stay.id):undefined;
 return <section className="location-explorer" aria-label="Vehicle location and recent stays">
  <div className="location-map-stage full-map">
   <div className="location-map-heading"><span className="eyebrow">YOUR VEHICLE ON THE MAP</span><h3>{mode==='demo'?'Simulated fleet locations':'Reported GPS locations'}</h3><span className="badge">{vehicles.filter(hasMapPosition).length} valid positions</span></div>
   <Suspense fallback={<p className="location-loading">Loading map…</p>}><FleetMap vehicles={vehicles} select={select} mode={mode} selectedId={vehicle.id} focus={activeStay?{...activeStay,label:`${mode==='demo'?'SIMULATED · ':''}Possible stay · ${stamp(new Date(activeStay.start).toISOString())}–${stamp(new Date(activeStay.end).toISOString())}`}:undefined}/></Suspense>
  </div>
  <div className="location-vehicle-card"><span className="location-vehicle-icon"><CarFront size={24} aria-hidden="true"/></span><div><span className="eyebrow">{mode==='demo'?'SIMULATED VEHICLE':'SELECTED VEHICLE'}</span><h2>{vehicle.id} <span>· {vehicle.model}</span></h2><p>{vehicle.driver_display_name||vehicle.driver_name||'Driver not linked'}</p></div><button aria-label="Open selected vehicle" onClick={onOpenVehicle}><ArrowRight size={20}/></button></div>
  <div className="location-information">
   <section className="location-glass location-stays" aria-labelledby="recent-stays-heading">
    <header><div><span className="eyebrow">RECORDED JOURNEY</span><h3 id="recent-stays-heading">Recent stays</h3></div><button className="location-history-refresh" aria-label="Refresh location history" disabled={current.loading} onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={17}/></button></header>
    <p className="location-section-caption">{mode==='demo'?'Simulated possible stays':'Possible stays from GPS history'}</p>
    {current.error&&<div role="alert" className="location-history-error"><p>{current.error}</p><span>{current.samples.length?'Showing previously loaded records.':'History could not be loaded.'}</span><button onClick={()=>setAttempt(n=>n+1)}>Retry history</button></div>}
    {current.loading?<p role="status">Loading recorded places…</p>:stays.length?<ol className="location-timeline">{stays.map((stay,index)=><li key={stay.id}><button aria-pressed={activeStay?.id===stay.id} onClick={()=>setFocused({key,stay})}><span className="location-timeline-pin"><MapPin size={17} aria-hidden="true"/></span><span><strong>Possible stay {stays.length-index}</strong><span>{stay.latitude.toFixed(5)}, {stay.longitude.toFixed(5)}</span><small>{stamp(new Date(stay.start).toISOString())} → {stamp(new Date(stay.end).toISOString())}</small><small><Clock3 size={12} aria-hidden="true"/> {Math.floor((stay.end-stay.start)/60000)} min observed · {stay.samples} reports</small></span><ArrowRight size={15} aria-hidden="true"/></button></li>)}</ol>:!current.error&&<div className="location-history-empty"><MapPin size={26} aria-hidden="true"/><strong>No stays recorded in this window</strong><p>A stay appears when several valid GPS reports remain near one place for at least 2 minutes.</p></div>}
    {activeStay&&<button className="location-return" onClick={()=>setFocused(null)}>Return to vehicle location <Navigation size={15}/></button>}
    <p className="location-history-footnote">Up to 100 recent reports · up to 6 possible stays. Points within 60 m of the first report for at least 2 minutes suggest a stay; missing fixes or gaps over 5 minutes break it. GPS reports do not confirm a visit or street address.</p>
   </section>
   <section className="location-glass location-last-report" aria-labelledby="last-location-heading"><span className="location-detail-icon"><Navigation size={21} aria-hidden="true"/></span><span className="eyebrow">LAST REPORTED POSITION</span><h3 id="last-location-heading">{hasFix?'Last known location':'Waiting for a GPS fix'}</h3><p>{hasFix?`${vehicle.gps!.latitude.toFixed(5)}, ${vehicle.gps!.longitude.toFixed(5)}`:`${reference.city} reference · not the vehicle’s location`}</p><div className="location-report-date"><Clock3 size={16} aria-hidden="true"/><span>{hasFix?stamp(vehicle.gps!.measured_at):'No valid GPS fix recorded'}</span></div><p className="location-history-footnote">A last known position may be old. It does not confirm where the vehicle is now.{mode==='demo'?' All locations in this mode are simulated.':''}</p><button onClick={onOpenVehicle}>Open selected vehicle <ArrowRight size={16}/></button></section>
  </div>
 </section>;
}
