import {useEffect,useId,useState} from 'react';
import Image from 'next/image';
import {Activity,ArrowDown,ArrowRight,ChartNoAxesCombined,Sun,Wind} from 'lucide-react';
import {api} from './api';
import type {Vehicle} from './types';
import type {EnergyPoint,EnergySample,EnergySeries} from './energy-visual-data';
import {chartSegments,electricalValue,energySeries,parseEnergyHistory,sourcePower} from './energy-visual-data';
import {elapsed} from '../packages/device-health';

const display=(n:number|null|undefined,digits=1)=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(digits):'—';
type Plot={kind:EnergySeries;unit:string;style?:'line'|'bars'|'area';caption?:string};

function MiniChart({points,unit,style='line',caption,loading}:{points:EnergyPoint[];unit:string;style?:Plot['style'];caption?:string;loading:boolean}){
 const id=useId(),valid=points.filter((p):p is EnergyPoint&{value:number}=>p.value!==null);
 if(!valid.length)return <figure className="harvest-chart empty-chart"><div><ChartNoAxesCombined size={22} aria-hidden="true"/><span>{loading?'Loading history…':'No recorded samples'}</span></div><figcaption>{caption||`Recorded ${unit} readings`}</figcaption></figure>;
 const values=valid.map(p=>p.value),minimum=Math.min(...values),maximum=Math.max(...values);
 const low=style==='line'?minimum:Math.min(0,minimum),high=style==='line'?maximum:Math.max(0,maximum),range=high-low;
 const start=points[0].at,end=points.at(-1)!.at,x=(at:number)=>8+(end===start?76:(at-start)/(end-start)*152),y=(n:number)=>range===0?32:56-(n-low)/range*48;
 const paths=chartSegments(points).map(segment=>segment.map((p,i)=>`${i?'L':'M'}${x(p.at).toFixed(2)} ${y(p.value!).toFixed(2)}`).join(' '));
 return <figure className="harvest-chart"><svg viewBox="0 0 168 64" role="img" aria-label={`${caption||'Recorded readings'}: ${valid.length} samples, ${display(minimum)} to ${display(maximum)} ${unit}`}>
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".3"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
  <path d="M8 56H160" className="harvest-chart-axis"/>
  {style==='bars'?valid.map((p,i)=><line key={i} x1={x(p.at)} x2={x(p.at)} y1={y(0)} y2={y(p.value)} stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>):chartSegments(points).map((segment,i)=><g key={i}>
   {style==='area'&&segment.length>1&&<path d={`${paths[i]} L${x(segment.at(-1)!.at)} ${y(0)} L${x(segment[0].at)} ${y(0)} Z`} fill={`url(#${id})`}/>}
   <path d={paths[i]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </g>)}
  {valid.length===1||minimum===maximum?valid.map((p,i)=><circle key={i} cx={x(p.at)} cy={y(p.value)} r="2.4" fill="currentColor"/>):<circle cx={x(valid.at(-1)!.at)} cy={y(valid.at(-1)!.value)} r="3" fill="currentColor"/>}
 </svg><figcaption>{caption&&<span>{caption}</span>}{valid.length===1?'One sample · no trend':`${display(minimum)}–${display(maximum)} ${unit} · ${valid.length} samples`}</figcaption></figure>;
}

function ReadingCard({title,value,unit,second,plots,samples,loading,status}:{title:string;value:number|null;unit:string;second?:number|null;plots:Plot[];samples:EnergySample[];loading:boolean;status:string}){
 return <article className="harvest-reading-card"><div className="harvest-reading-label"><h3>{title}</h3><Activity size={15} aria-hidden="true"/></div>
  <strong className="harvest-reading-value">{display(value,unit==='Wh'?2:1)} <em>{unit}</em>{second!==undefined&&<><span className="controller-divider"> / </span>{display(second)} <em>A</em></>}</strong>
  <span className="harvest-reading-status">{value===null&&second==null&&status==='Last reported'?'Not available':status}</span>
  <div className={plots.length>1?'harvest-plots paired-plots':'harvest-plots'}>{plots.map(plot=><MiniChart key={plot.kind} points={energySeries(samples,plot.kind)} unit={plot.unit} style={plot.style} caption={plot.caption} loading={loading}/>)}</div>
 </article>;
}

export default function EnergyHarvestSections({vehicle,mode}:{vehicle:Vehicle;mode:string}){
 const key=`${vehicle.id}:${mode}`,[attempt,setAttempt]=useState(0);
 const [history,setHistory]=useState<{key:string;samples:EnergySample[];loading:boolean;error:string}>({key:'',samples:[],loading:true,error:''});
 useEffect(()=>{
  let active=true,pending=false;
  setHistory(previous=>({key,samples:previous.key===key?previous.samples:[],loading:true,error:''}));
  const load=async()=>{
   if(pending)return;pending=true;
   try{const rows=await api(`/history/${encodeURIComponent(vehicle.id)}?mode=${encodeURIComponent(mode)}`);if(active)setHistory({key,samples:parseEnergyHistory(Array.isArray(rows)?rows:[],mode),loading:false,error:''});}
   catch(error){if(active)setHistory(previous=>({...previous,key,loading:false,error:(error as Error).message}));}
   finally{pending=false;}
  };
  void load();const timer=window.setInterval(load,15000);return()=>{active=false;window.clearInterval(timer);};
 },[key,vehicle.id,mode,attempt]);
 const current=history.key===key?history:{key,samples:[],loading:true,error:''},t=vehicle.telemetry;
 const age=elapsed(t?.device_timestamp,Date.now());
 const status=!t?'No reading':t.source_type==='hardware'&&t.calibration_status!=='calibrated'?'Calibration needed':age===null?'Time unknown':age>30000?'Old reading':'Last reported';
 const field=(name:Parameters<typeof electricalValue>[1])=>electricalValue(t,name);
 const common={samples:current.samples,loading:current.loading};
 return <section className="energy-harvest-workspace" aria-label="Renewable energy readings">
  <div className="energy-source-navigation"><a href="#energy-solar"><Sun size={17} aria-hidden="true"/>Solar<ArrowDown size={14} aria-hidden="true"/></a><a href="#energy-wind"><Wind size={17} aria-hidden="true"/>Wind<ArrowDown size={14} aria-hidden="true"/></a><span>{mode==='demo'?'Simulated data':'Reported hardware'}</span></div>
  {current.error&&<div className="energy-history-error" role="alert"><span>{current.error} {current.samples.length?'Showing previously loaded history.':'Graphs are unavailable.'}</span><button onClick={()=>setAttempt(value=>value+1)}>Retry history</button></div>}
  <div className="harvest-sources">
   <section className="harvest-source solar-source" id="energy-solar" aria-labelledby="solar-energy-heading" tabIndex={-1}>
    <header className="harvest-source-heading"><div><span className="eyebrow"><Sun size={15} aria-hidden="true"/>POWER FROM THE SUN</span><h2 id="solar-energy-heading">Solar energy</h2></div><span className="badge amber">400 W nominal array</span></header>
    <div className="harvest-total"><span>Recorded solar harvest</span><strong>{display(vehicle.solar_wh,2)} <em>Wh</em></strong><small>Recorded samples · gaps excluded</small></div>
    <figure className="harvest-artwork"><Image src="/energy-solar-panels.webp" width={1000} height={667} sizes="(max-width:650px) 95vw, (max-width:1100px) 85vw, 600px" loading="eager" alt="Illustration of two tilted blue photovoltaic solar panels"/></figure>
    <div className="harvest-reading-grid">
     <ReadingCard title="PV input voltage" value={field('solar_voltage_v')} unit="V" status={status} plots={[{kind:'solar_voltage_v',unit:'V'}]} {...common}/>
     <ReadingCard title="PV input current" value={field('solar_current_a')} unit="A" status={status} plots={[{kind:'solar_current_a',unit:'A',style:'bars'}]} {...common}/>
     <ReadingCard title="PV power" value={sourcePower(t,'solar')} unit="W" status={status} plots={[{kind:'solar_power_w',unit:'W',style:'area'}]} {...common}/>
     <ReadingCard title="Controller output" value={field('solar_output_voltage_v')} second={field('solar_output_current_a')} unit="V" status={status} plots={[{kind:'solar_output_voltage_v',unit:'V',caption:'Voltage · V'},{kind:'solar_output_current_a',unit:'A',caption:'Current · A',style:'bars'}]} {...common}/>
    </div>
    <p className="harvest-source-note">PV input and controller output are separate measurements. MPT-7210A validation remains pending.</p>
   </section>
   <section className="harvest-source wind-source" id="energy-wind" aria-labelledby="wind-energy-heading" tabIndex={-1}>
    <header className="harvest-source-heading"><div><span className="eyebrow"><Wind size={15} aria-hidden="true"/>POWER FROM THE WIND</span><h2 id="wind-energy-heading">Wind energy</h2></div><span className="badge">Not commissioned</span></header>
    <div className="harvest-total"><span>Recorded wind yield</span><strong>{display(vehicle.wind_wh,2)} <em>Wh</em></strong><small>Vertical-axis wind turbine · VAWT</small></div>
    <figure className="harvest-artwork wind-artwork"><Image src="/energy-vawt-cutout.webp" width={900} height={900} sizes="(max-width:650px) 80vw, 400px" loading="lazy" alt="White curved-blade vertical-axis wind turbine with a silver generator and white mounting pole"/></figure>
    <div className="harvest-reading-grid">
     <ReadingCard title="Output voltage" value={field('wind_voltage_v')} unit="V" status={status} plots={[{kind:'wind_voltage_v',unit:'V'}]} {...common}/>
     <ReadingCard title="Output current" value={field('wind_current_a')} unit="A" status={status} plots={[{kind:'wind_current_a',unit:'A',style:'bars'}]} {...common}/>
     <ReadingCard title="Power" value={sourcePower(t,'wind')} unit="W" status={status} plots={[{kind:'wind_power_w',unit:'W',style:'area'}]} {...common}/>
     <ReadingCard title="Energy yield" value={vehicle.wind_wh} unit="Wh" status={vehicle.wind_wh==null?'Not available':'Recorded total'} plots={[{kind:'wind_window_wh',unit:'Wh',style:'area',caption:'Displayed sample window · Wh'}]} {...common}/>
    </div>
    <p className="harvest-source-note">Wind harvesting remains uncommissioned. The illustration does not confirm installed hardware or operational yield.</p>
   </section>
  </div>
  <p className="harvest-history-note"><ChartNoAxesCombined size={17} aria-hidden="true"/><span>Graphs show up to 24 timestamped samples in this mode. Hardware readings require calibration. Missing readings and gaps over 30 seconds are not filled. The wind energy graph covers only the displayed samples; its card shows the recorded total.</span></p>
  <a className="energy-history-link" href="#energy-battery">Battery &amp; technical readings <ArrowRight size={16} aria-hidden="true"/></a>
 </section>;
}
