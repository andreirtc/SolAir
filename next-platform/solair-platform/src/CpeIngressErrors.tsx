import {useEffect,useState} from 'react';
import {api,stamp} from './api';
export default function CpeIngressErrors({vehicleId}:{vehicleId:string}){
 const [errors,setErrors]=useState<{action:string;created_at:string}[]>([]),[failure,setFailure]=useState('');
 useEffect(()=>{let active=true;setErrors([]);const load=()=>api(`/cpe-diagnostics/${vehicleId}`).then(r=>{if(active){setErrors(r);setFailure('');}}).catch(e=>{if(active)setFailure(e.message);});void load();const timer=setInterval(load,10000);return()=>{active=false;clearInterval(timer);};},[vehicleId]);
 return <div><h4>Authenticated device validation errors</h4>{failure?<p role="alert">{failure}</p>:errors.length?errors.map((e,i)=><p key={i}>{stamp(e.created_at)} · {e.action}</p>):<p className="subtle">No authenticated device schema rejections recorded. Connection failures and rejected credentials require the device serial log; they do not establish device identity.</p>}</div>;
}
