import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {api} from './api';
import {parseEnergyHistory,type EnergySample} from './energy-visual-data';
import type {Vehicle} from './types';

type History={samples:EnergySample[];loading:boolean;error:string;retry:()=>void};
const Context=createContext<History>({samples:[],loading:true,error:'',retry:()=>{}});
export function useHomeEnergyHistory(){return useContext(Context);}
export function HomeEnergyHistoryProvider({vehicle,mode,children}:{vehicle:Vehicle;mode:string;children:ReactNode}){
 const key=`${vehicle.id}:${vehicle.device_id}:${mode}`;
 const [attempt,setAttempt]=useState(0),[history,setHistory]=useState<{key:string;samples:EnergySample[];loading:boolean;error:string}>({key:'',samples:[],loading:true,error:''});
 useEffect(()=>{
  let active=true,pending=false;
  setHistory(old=>({key,samples:old.key===key?old.samples:[],loading:true,error:''}));
  const load=async()=>{
   if(pending)return;pending=true;
   try{const rows=await api(`/history/${encodeURIComponent(vehicle.id)}?mode=${encodeURIComponent(mode)}`);if(active)setHistory({key,samples:parseEnergyHistory(Array.isArray(rows)?rows:[],mode),loading:false,error:''});}
   catch{if(active)setHistory(old=>({key,samples:old.key===key?old.samples:[],loading:false,error:'Recorded graph history could not be refreshed.'}));}
   finally{pending=false;}
  };
  void load();const timer=window.setInterval(load,15000);
  return()=>{active=false;window.clearInterval(timer);};
 },[key,vehicle.id,mode,attempt]);
 const current=history.key===key?history:{samples:[],loading:true,error:''};
 return <Context.Provider value={{...current,retry:()=>setAttempt(n=>n+1)}}>{children}</Context.Provider>;
}
