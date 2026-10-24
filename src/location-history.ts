export type LocationSample={at:number;latitude:number|null;longitude:number|null};
export type RecordedStay={id:string;latitude:number;longitude:number;start:number;end:number;samples:number};
export type GPSPoint=LocationSample&{latitude:number;longitude:number};
export type LocationLeg={from:RecordedStay;to:RecordedStay;distanceMeters:number|null;points:GPSPoint[]};
export const LOCATION_HISTORY_LIMIT=500;
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
export function parseLocationHistory(rows:{payload:string}[],mode:string,now=Date.now()):LocationSample[]{
 const samples:LocationSample[]=[],seen=new Set<string>();
 for(const row of rows){try{
  const t=JSON.parse(row.payload),reported=Date.parse(t.device_timestamp);
  if(t.source_type!==mode||t.cpe?.historical||t.event_id||!Number.isFinite(reported)||reported>now)continue;
  const identity=`${t.device_id}:${t.boot_id}:${t.sequence}`;if(seen.has(identity))continue;seen.add(identity);
  const valid=t.gps_fix===true&&finite(t.gps_fix_age_ms)&&t.gps_fix_age_ms>=0&&t.gps_fix_age_ms<=30000&&finite(t.latitude)&&Math.abs(t.latitude)<=90&&finite(t.longitude)&&Math.abs(t.longitude)<=180;
  samples.push({at:valid?reported-t.gps_fix_age_ms:reported,latitude:valid?t.latitude:null,longitude:valid?t.longitude:null});
 }catch{/* Malformed records cannot establish a stay. */}}
 return samples.sort((a,b)=>a.at-b.at);
}
export function distanceMeters(a:LocationSample,b:LocationSample){
 const radians=Math.PI/180,lat=(b.latitude!-a.latitude!)*radians,lon=(b.longitude!-a.longitude!)*radians;
 const arc=Math.sin(lat/2)**2+Math.cos(a.latitude!*radians)*Math.cos(b.latitude!*radians)*Math.sin(lon/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(arc),Math.sqrt(Math.max(0,1-arc)));
}
export function inferRecordedStays(samples:LocationSample[],minimumStopMs=120000):RecordedStay[]{
 const stays:RecordedStay[]=[];let group:LocationSample[]=[];
 const finish=()=>{
  if(group.length>=3&&group.at(-1)!.at-group[0].at>=minimumStopMs)stays.push({id:String(group[0].at),latitude:group.reduce((sum,p)=>sum+p.latitude!,0)/group.length,longitude:group.reduce((sum,p)=>sum+p.longitude!,0)/group.length,start:group[0].at,end:group.at(-1)!.at,samples:group.length});
  group=[];
 };
 for(const sample of samples){
  if(sample.latitude===null||sample.longitude===null){finish();continue;}
  if(group.length){const previous=group.at(-1)!;if(sample.at===previous.at)continue;if(sample.at-previous.at>300000||distanceMeters(group[0],sample)>60)finish();}
  group.push(sample);
 }
 finish();return stays.slice(-6).reverse();
}
export function mergeLocationSamples(previous:LocationSample[],next:LocationSample[]):LocationSample[]{
 const seen=new Map<string,LocationSample>();for(const point of [...previous,...next])seen.set(`${point.at}:${point.latitude}:${point.longitude}`,point);
 return [...seen.values()].sort((a,b)=>a.at-b.at).slice(-LOCATION_HISTORY_LIMIT);
}
export function locationTrack(samples:LocationSample[]):GPSPoint[][]{
 const segments:GPSPoint[][]=[];let current:GPSPoint[]=[];
 const finish=()=>{if(current.length)segments.push(current);current=[];};
 for(const point of samples){
  if(point.latitude===null||point.longitude===null){finish();continue;}
  if(current.length){const previous=current.at(-1)!,gap=point.at-previous.at;if(gap===0)continue;if(gap<0||gap>300000||distanceMeters(previous,point)/(gap/1000)>120/3.6)finish();}
  current.push(point as GPSPoint);
 }
 finish();return segments;
}
export function trackDistance(segments:GPSPoint[][]):number{
 return segments.reduce((total,segment)=>total+segment.slice(1).reduce((distance,point,index)=>distance+distanceMeters(segment[index],point),0),0);
}
export function stopLegs(samples:LocationSample[],stays:RecordedStay[]):LocationLeg[]{
 const ordered=[...stays].sort((a,b)=>a.start-b.start);
 return ordered.slice(1).map((to,index)=>{
  const from=ordered[index],window=samples.filter(point=>point.at>=from.end&&point.at<=to.start),segments=locationTrack(window);
  const complete=segments.length===1&&segments[0].length>=2&&window.every(point=>point.latitude!==null&&point.longitude!==null)&&segments[0][0].at===from.end&&segments[0].at(-1)!.at===to.start;
  return {from,to,distanceMeters:complete?trackDistance(segments):null,points:complete?segments[0]:[]};
 });
}
export const formatDistance=(meters:number)=>meters>=1000?`${(meters/1000).toFixed(2)} km`:`${Math.round(meters)} m`;
export const locationTime=(at:number)=>new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date(at));
