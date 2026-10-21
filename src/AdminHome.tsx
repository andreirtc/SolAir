import {useEffect,useState} from 'react';
import {api} from './api';
import {ActivityLog} from './Registration';
import {ArrowUpRight,Users,UserRound,Truck,Building2,Shield,ClipboardCheck} from 'lucide-react';

export default function AdminHome({revision,go}:{revision:number;go:(page:string)=>void}){
 const [data,setData]=useState<Record<string,number>|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;void api('/admin/overview').then(value=>{if(active){setData(value);setError('');}}).catch(e=>{if(active){setData(null);setError(e.message);}});return()=>{active=false;};},[revision]);
 const cards=[
  {label:'Registered accounts',key:'accounts',page:'People & assignments',Icon:Users,detail:'People using SolAir'},
  {label:'Accounts without a TODA',key:'unassigned',page:'People & assignments',Icon:UserRound,detail:'Review their membership'},
  {label:'Operator access to review',key:'operator_requests',page:'People & assignments',Icon:Shield,detail:'Confirm the right access'},
  {label:'Drivers needing assignments',key:'needs_assignment',page:'People & assignments',Icon:Truck,detail:'Link a vehicle and operator'},
  {label:'TODA organizations',key:'organizations',page:'Organizations',Icon:Building2,detail:'Open a fleet workspace'},
  {label:'Devices awaiting recorded approval',key:'readiness_pending',page:'Devices',Icon:ClipboardCheck,detail:'Review the recorded test evidence'},
 ];
 return <div className="admin-home">
  <section className="admin-intro"><div><span className="eyebrow">PEOPLE FIRST. A BETTER CONNECTED FLEET.</span><h2>A clear view.<br/>The right next step.</h2><p>Manage SOLAIR across TODAs. Keep access, assignments and device readiness in one place.</p></div><div className="admin-intro-symbol" aria-hidden="true"><Shield size={82} strokeWidth={1}/><span><Users size={25}/></span></div></section>
  <section aria-label="Administration summary"><div className="section-title"><h2>What needs your attention</h2><span>All TODA organizations</span></div>{error&&<p className="error" role="alert">{error}</p>}<div className="admin-summary-grid">{cards.map(({label,key,page,Icon,detail})=><button className="admin-summary-card" key={key} onClick={()=>go(page)}><span className="summary-label"><span className="summary-icon"><Icon size={21}/></span>{label}<ArrowUpRight size={17}/></span><strong>{data?data[key]:'—'}</strong><small>{detail}</small></button>)}</div><p className="subtle">Device approvals describe saved records, not proof of physical operation or SMS delivery.</p></section>
  <section className="panel"><div className="section-title"><h3>Manage your workspace</h3><span>Choose a TODA before editing its fleet</span></div><div className="button-row"><button onClick={()=>go('People & assignments')}>Manage people and assignments</button><button onClick={()=>go('Organizations')}>Choose a TODA workspace</button><button onClick={()=>go('Devices')}>Review selected device</button><button onClick={()=>go('Vehicles')}>View workspace fleet</button><button onClick={()=>go('Security')}>Handle fleet alerts</button><button onClick={()=>go('SOS & Assistance')}>Review assistance</button><button onClick={()=>go('Messages')}>Open conversations</button></div></section>
  <ActivityLog/>
 </div>;
}
