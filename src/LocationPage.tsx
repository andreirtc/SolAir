import {lazy,Suspense,useEffect,useMemo,useState} from 'react';
import {ArrowRight,CarFront,Clock3,MapPin,Navigation,RefreshCw,Route} from 'lucide-react';
import {api,stamp} from './api';
import type {Vehicle} from './types';
import {hasMapPosition,vehicleMapReference} from './map-reference';
import {LOCATION_HISTORY_LIMIT,formatDistance,inferRecordedStays,locationTime,locationTrack,mergeLocationSamples,parseLocationHistory,stopLegs,trackDistance,type RecordedStay,type LocationSample} from './location-history';
const FleetMap=lazy(()=>import('./FleetMap'));
const emptySamples:LocationSample[]=[];

export default function LocationPage({vehicle,vehicles,select,mode,onOpenVehicle}:{vehicle:Vehicle;vehicles:Vehicle[];select:(id:string)=>void;mode:string;onOpenVehicle:()=>void}){
 const key=`${vehicle.id}:${mode}`;
 const [history,setHistory]=useState<{key:string;samples:LocationSample[];loading:boolean;error:string}>({key:'',samples:emptySamples,loading:true,error:''});
 const [attempt,setAttempt]=useState(0),[focused,setFocused]=useState<{key:string;stay:RecordedStay}|null>(null),[minimumMinutes,setMinimumMinutes]=useState(2);
 useEffect(()=>{
  let active=true,pending=false,initial=true;
  setHistory(previous=>({key,samples:previous.key===key?previous.samples:emptySamples,loading:true,error:''}));
  const load=async()=>{
   if(pending)return;pending=true;
   try{
    const rows:{payload:string}[]=[];
    for(let offset=0;offset<(initial?LOCATION_HISTORY_LIMIT:100);offset+=100){
     const batch=await api(`/history/${encodeURIComponent(vehicle.id)}?mode=${encodeURIComponent(mode)}&offset=${offset}`);
     if(!active)return;if(!Array.isArray(batch))throw Error('Location history is unavailable.');rows.push(...batch);if(batch.length<100)break;
    }
    const samples=parseLocationHistory(rows,mode),replace=initial;initial=false;
    if(active)setHistory(previous=>({key,samples:replace?samples.slice(-LOCATION_HISTORY_LIMIT):mergeLocationSamples(previous.key===key?previous.samples:emptySamples,samples),loading:false,error:''}));
   }catch(error){if(active)setHistory(previous=>({...previous,key,loading:false,error:(error as Error).message}));}finally{pending=false;}
  };
  void load();const timer=window.setInterval(load,30000);return()=>{active=false;window.clearInterval(timer);};
 },[key,vehicle.id,mode,attempt]);
 const current=history.key===key?history:{key,samples:emptySamples,loading:true,error:''},reference=vehicleMapReference(vehicle),hasFix=hasMapPosition(vehicle);
 const stays=useMemo(()=>inferRecordedStays(current.samples,minimumMinutes*60000),[current.samples,minimumMinutes]);
 const segments=useMemo(()=>locationTrack(current.samples),[current.samples]);
 const legs=useMemo(()=>stopLegs(current.samples,stays),[current.samples,stays]);
 const recordedRoute=useMemo(()=>({segments,stops:[...stays].reverse(),legs}),[segments,stays,legs]);
 const activeStay=focused?.key===key?stays.find(stay=>stay.id===focused.stay.id):undefined;
 const focus=useMemo(()=>activeStay?{...activeStay,label:`${mode==='demo'?'SIMULATED · ':''}Detected stop · ${locationTime(activeStay.start)} to ${locationTime(activeStay.end)} · ${Math.floor((activeStay.end-activeStay.start)/60000)} min observed`}:undefined,[activeStay,mode]);
 const distance=trackDistance(segments);
 return <section className="location-explorer" aria-label="Vehicle location and location history">
  <div id="location-recorded-map" className="location-map-stage full-map">
   <div className="location-map-heading"><span className="eyebrow">YOUR VEHICLE ON THE MAP</span><h3>{mode==='demo'?'Simulated fleet locations':'Reported GPS locations'}</h3><span className="badge">{vehicles.filter(hasMapPosition).length} valid positions</span></div>
   <Suspense fallback={<p className="location-loading">Loading map…</p>}><FleetMap vehicles={vehicles} select={select} mode={mode} selectedId={vehicle.id} focus={focus} recordedRoute={recordedRoute}/></Suspense>
  </div>
  <div className="location-vehicle-card"><span className="location-vehicle-icon"><CarFront size={24} aria-hidden="true"/></span><div><span className="eyebrow">{mode==='demo'?'SIMULATED VEHICLE':'SELECTED VEHICLE'}</span><h2>{vehicle.id} <span>· {vehicle.model}</span></h2><p>{vehicle.driver_display_name||vehicle.driver_name||'Driver not linked'}</p></div><button aria-label="Open selected vehicle" onClick={onOpenVehicle}><ArrowRight size={20}/></button></div>
  <div className="location-track-summary" aria-label="Recorded track summary"><div className="location-track-primary"><Route size={18} aria-hidden="true"/><span>Recorded track<strong>{segments.some(segment=>segment.length>1)?`≈ ${formatDistance(distance)}`:'Not available'}</strong><small>GPS estimate · recorded sections</small></span></div><div><MapPin size={18} aria-hidden="true"/><span>Detected stops<strong>{stays.length}</strong><small>{minimumMinutes}+ min stop filter</small></span></div></div>
  <div className="location-information">
   <section className="location-glass location-stays" aria-labelledby="location-history-heading">
    <header><div><span className="eyebrow">RECORDED JOURNEY</span><h3 id="location-history-heading">Location History</h3></div><button className="location-history-refresh" aria-label="Refresh location history" disabled={current.loading} onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={17}/></button></header>
    <p className="location-section-caption">{mode==='demo'?'Simulated track and detected stops':'Recorded GPS track and detected stops'}</p>
    <label className="location-stop-filter">Show stops of at least<select aria-label="Minimum stop duration" value={minimumMinutes} onChange={event=>setMinimumMinutes(Number(event.target.value))}>{[1,2,5,10].map(minutes=><option key={minutes} value={minutes}>{minutes} min</option>)}</select></label>
    <p className="location-timezone">All times: Asia/Manila (UTC+8)</p>
    {current.error&&<div role="alert" className="location-history-error"><p>{current.error}</p><span>{current.samples.length?'Showing previously loaded records.':'History could not be loaded.'}</span><button onClick={()=>setAttempt(n=>n+1)}>Retry history</button></div>}
    {current.loading?<p role="status">Loading location history…</p>:stays.length?<ol className="location-timeline">{stays.map((stay,index)=>{
     const leg=legs.find(item=>item.to.id===stay.id),number=stays.length-index;
     return <li key={stay.id}><button aria-pressed={activeStay?.id===stay.id} onClick={()=>{setFocused({key,stay});document.getElementById("location-recorded-map")?.scrollIntoView({block:"start",behavior:"auto"});}}><span className="location-timeline-pin"><MapPin size={17} aria-hidden="true"/></span><span><strong>Stop {number}</strong><span className="location-address-unavailable">Address unavailable</span><span className="location-coordinate">{stay.latitude.toFixed(5)}, {stay.longitude.toFixed(5)}</span><small>First recorded: <time dateTime={new Date(stay.start).toISOString()}>{locationTime(stay.start)}</time></small><small>Last recorded: <time dateTime={new Date(stay.end).toISOString()}>{locationTime(stay.end)}</time></small><small><Clock3 size={12} aria-hidden="true"/> {Math.floor((stay.end-stay.start)/60000)} min observed · {stay.samples} GPS reports</small></span><ArrowRight size={15} aria-hidden="true"/></button>{leg&&<div className="location-leg"><Route size={15} aria-hidden="true"/><span>From Stop {number-1}: <strong>{leg.distanceMeters===null?'Distance unavailable':`≈ ${formatDistance(leg.distanceMeters)}`}</strong><small>{leg.distanceMeters===null?'Missing or unreliable GPS reports between stops.':'GPS distance along recorded points · estimate'}</small></span></div>}</li>;
    })}</ol>:!current.error&&<div className="location-history-empty"><MapPin size={26} aria-hidden="true"/><strong>No stops recorded in this window</strong><p>A stop appears when at least three valid GPS reports remain near one place for {minimumMinutes} minutes. Available movement still appears on the track.</p></div>}
    {activeStay&&<button className="location-return" onClick={()=>setFocused(null)}>Return to vehicle location <Navigation size={15}/></button>}
    <details className="location-history-method"><summary>How stops and distances are estimated</summary><p>Up to {LOCATION_HISTORY_LIMIT} recent reports · up to 6 detected stops. Points within 60 m of the first report suggest a stop. Missing fixes or gaps over 5 minutes break the track. Implausible jumps are excluded. Distances sum the recorded point-to-point GPS segments; they are not exact road distances. First and last times are GPS observations, not confirmed arrival or departure. Street addresses are unavailable until address lookup is connected.</p></details>
   </section>
   <section className="location-glass location-last-report" aria-labelledby="last-location-heading"><span className="location-detail-icon"><Navigation size={21} aria-hidden="true"/></span><span className="eyebrow">LAST REPORTED POSITION</span><h3 id="last-location-heading">{hasFix?'Last known location':'Waiting for a GPS fix'}</h3>{hasFix?<><p>Address unavailable</p><p>{vehicle.gps!.latitude.toFixed(5)}, {vehicle.gps!.longitude.toFixed(5)}</p></>:<p>{reference.city} reference · not the vehicle’s location</p>}<div className="location-report-date"><Clock3 size={16} aria-hidden="true"/><span>{hasFix?`${stamp(vehicle.gps!.measured_at)} · Asia/Manila`:'No valid GPS fix recorded'}</span></div><p className="location-history-footnote">A last known position may be old. It does not confirm where the vehicle is now.{mode==='demo'?' All locations in this mode are simulated.':''}</p><button onClick={onOpenVehicle}>Open selected vehicle <ArrowRight size={16}/></button></section>
  </div>
 </section>;
}
