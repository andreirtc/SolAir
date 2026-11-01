import {chartSegments,type EnergyPoint} from './energy-visual-data';

const number=(value:number)=>value.toLocaleString('en-PH',{maximumFractionDigits:2});
export default function RecordedLineChart({points,label,unit,simulated=false}:{points:EnergyPoint[];label:string;unit:string;simulated?:boolean}){
 const valid=points.filter((point):point is EnergyPoint&{value:number}=>point.value!==null&&Number.isFinite(point.value));
 if(!valid.length)return null;
 const minimum=Math.min(...valid.map(p=>p.value)),maximum=Math.max(...valid.map(p=>p.value));
 const start=points[0].at,end=points.at(-1)!.at;
 const x=(at:number)=>8+(end===start?112:(at-start)/(end-start)*224);
 const y=(value:number)=>maximum===minimum?43:72-(value-minimum)/(maximum-minimum)*58;
 const segments=chartSegments(points),source=simulated?'SIMULATED':'Recorded';
 return <span className="recorded-line-chart">
  <span className="recorded-line-chart-label">{source} · {label}</span>
  <svg viewBox="0 0 240 88" role="img" aria-label={`${source} ${label}: ${valid.length} samples, ${number(minimum)} to ${number(maximum)} ${unit}`}>
   <path className="recorded-line-chart-axis" d="M8 14H232M8 43H232M8 72H232"/>
   {segments.map((segment,index)=><g key={index}>
    {segment.length>1&&<path className="recorded-line-chart-trend" d={segment.map((point,i)=>`${i?'L':'M'}${x(point.at).toFixed(2)} ${y(point.value!).toFixed(2)}`).join(' ')}/>}
    {segment.length===1&&<circle cx={x(segment[0].at)} cy={y(segment[0].value!)} r="2.8" fill="currentColor"/>}
   </g>)}
   <circle cx={x(valid.at(-1)!.at)} cy={y(valid.at(-1)!.value)} r="3" fill="currentColor"/>
  </svg>
  <span className="recorded-line-chart-caption">{valid.length===1?'One sample · no trend':`${number(minimum)}–${number(maximum)} ${unit} · ${valid.length} samples`}</span>
 </span>;
}
