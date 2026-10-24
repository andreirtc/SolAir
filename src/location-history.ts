export type LocationSample={at:number;latitude:number|null;longitude:number|null};
export type RecordedStay={id:string;latitude:number;longitude:number;start:number;end:number;samples:number};
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
function meters(a:LocationSample,b:LocationSample){
 const radians=Math.PI/180,lat=(b.latitude!-a.latitude!)*radians,lon=(b.longitude!-a.longitude!)*radians;
 const arc=Math.sin(lat/2)**2+Math.cos(a.latitude!*radians)*Math.cos(b.latitude!*radians)*Math.sin(lon/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(arc),Math.sqrt(Math.max(0,1-arc)));
}
export function inferRecordedStays(samples:LocationSample[]):RecordedStay[]{
 const stays:RecordedStay[]=[];let group:LocationSample[]=[];
 const finish=()=>{
  if(group.length>=3&&group.at(-1)!.at-group[0].at>=120000)stays.push({id:String(group[0].at),latitude:group.reduce((sum,p)=>sum+p.latitude!,0)/group.length,longitude:group.reduce((sum,p)=>sum+p.longitude!,0)/group.length,start:group[0].at,end:group.at(-1)!.at,samples:group.length});
  group=[];
 };
 for(const sample of samples){
  if(sample.latitude===null||sample.longitude===null){finish();continue;}
  if(group.length){const previous=group.at(-1)!;if(sample.at===previous.at)continue;if(sample.at-previous.at>300000||meters(group[0],sample)>60)finish();}
  group.push(sample);
 }
 finish();return stays.slice(-6).reverse();
}
