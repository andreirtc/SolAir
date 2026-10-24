import type {Telemetry} from '../packages/telemetry-contract';
import {integrateWh,power} from '../packages/telemetry-contract';

export type EnergyField='solar_voltage_v'|'solar_current_a'|'solar_output_voltage_v'|'solar_output_current_a'|'wind_voltage_v'|'wind_current_a';
export type EnergySeries=EnergyField|'solar_power_w'|'wind_power_w'|'wind_window_wh';
export type EnergySample={at:number;t:Telemetry};
export type EnergyPoint={at:number;value:number|null};
export function electricalValue(t:Telemetry|null,field:EnergyField):number|null{
 if(!t||(t.source_type==='hardware'&&t.calibration_status!=='calibrated'))return null;
 const n=t[field];return typeof n==='number'&&Number.isFinite(n)?n:null;
}
export function sourcePower(t:Telemetry|null,source:'solar'|'wind'){
 const n=power(electricalValue(t,`${source}_voltage_v`),electricalValue(t,`${source}_current_a`));
 return n!==null&&Number.isFinite(n)?n:null;
}
export function parseEnergyHistory(rows:{payload:string}[],mode:string):EnergySample[]{
 const samples:EnergySample[]=[],seen=new Set<string>();
 for(const row of rows){try{
  const t=JSON.parse(row.payload) as Telemetry,at=Date.parse(t.device_timestamp||'');
  if(t.source_type!==mode||t.cpe?.historical||t.event_id||!Number.isFinite(at)||at>Date.now())continue;
  const key=`${t.device_id}:${t.boot_id}:${t.sequence}`;if(seen.has(key))continue;seen.add(key);samples.push({at,t});
 }catch{/* Invalid history entries are not charted. */}}
 return samples.sort((a,b)=>a.at-b.at).slice(-24);
}
export function energySeries(samples:EnergySample[],kind:EnergySeries):EnergyPoint[]{
 if(kind!=='wind_window_wh')return samples.map(({at,t})=>({at,value:kind==='solar_power_w'?sourcePower(t,'solar'):kind==='wind_power_w'?sourcePower(t,'wind'):electricalValue(t,kind)}));
 let total=0,previous:{at:string;power:number}|null=null;
 return samples.map(({at,t})=>{
  const watts=sourcePower(t,'wind');
  if(watts===null){previous=null;return {at,value:null};}
  const next={at:new Date(at).toISOString(),power:watts},gap=previous?at-Date.parse(previous.at):null;
  const valid=gap!==null&&gap>0&&gap<=30000;
  if(valid)total+=integrateWh(previous,next);
  previous=next;return {at,value:valid?total:null};
 });
}
export function chartSegments(points:EnergyPoint[]):EnergyPoint[][]{
 const segments:EnergyPoint[][]=[];let current:EnergyPoint[]=[];
 for(const point of points){
  if(point.value===null){if(current.length)segments.push(current);current=[];continue;}
  if(current.length&&point.at-current.at(-1)!.at>30000){segments.push(current);current=[];}
  current.push(point);
 }
 if(current.length)segments.push(current);return segments;
}
