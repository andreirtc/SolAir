import { z } from 'zod';

export const batteryReferenceSchema=z.object({
  profile:z.enum(['prototype_48v_10ah','bemac_55v_80ah']),
  capacity_ah:z.number().finite().positive().max(1000),
  capacity_basis:z.enum(['nameplate','measured']),
  initial_soc_pct:z.number().finite().min(0).max(100),
  reference_basis:z.enum(['verified_reference','assumed_reference']),
  reference_at:z.iso.datetime(), reserve_pct:z.number().finite().min(0).max(99),
  charge_efficiency:z.number().finite().positive().max(1),
  evidence:z.string().trim().min(1).max(2000),
}).strict().superRefine((b,c)=>{
  if(b.initial_soc_pct<b.reserve_pct)c.addIssue({code:'custom',message:'Initial SOC is below the selected reserve'});
});
export type BatteryReference=z.infer<typeof batteryReferenceSchema>;
export type BatterySample={id:string;at:string;received_at:string;boot_id:string;sequence:number;
  current_a:number|null;voltage_v:number|null;current_valid:boolean;voltage_valid:boolean;historical:boolean};
export type BatteryEstimate=ReturnType<typeof estimateBattery>;
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
export function estimateBattery(reference:BatteryReference|null,samples:BatterySample[],nowMs=Date.now()) {
  const base={method:'coulomb-counting-v1',quality:'unavailable',model_validated:false,
    soc_pct:null as number|null,tte_minutes:null as number|null,remaining_ah:null as number|null,
    mean_net_current_a:null as number|null,as_of:null as string|null,reference,
    reason:'Set a documented SOC reference and capacity; voltage alone is not SOC.',tte_reason:'SOC unavailable',
    covered_seconds:0,warning:'Engineering estimate, not validated depletion forecasting. Capacity, reference SOC and efficiency are stated inputs.'};
  if(!reference)return base;
  const anchor=Date.parse(reference.reference_at);
  if(!Number.isFinite(anchor)||anchor>nowMs)return {...base,reason:'SOC reference time is invalid or in the future'};
  const ordered=samples.filter(s=>!s.historical).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  const last=ordered.at(-1);
  if(!last||Date.parse(last.at)<anchor)return {...base,reason:'No battery-current samples cover the SOC reference'};
  if(nowMs-Date.parse(last.at)>30000||nowMs-Date.parse(last.received_at)>30000||Date.parse(last.at)>nowMs+1000)
    return {...base,reason:'Battery samples are stale or have inconsistent clocks'};
  const valid=(s:BatterySample)=>s.current_valid&&finite(s.current_a)&&Number.isFinite(Date.parse(s.at));
  if(!valid(last))return {...base,reason:'Validated net battery current is required; uncalibrated ACS is excluded'};
  let ah=reference.capacity_ah*reference.initial_soc_pct/100,covered=0,cursor=anchor;
  const recent:{seconds:number;amps:number}[]=[];
  const end=Date.parse(last.at);
  for(let i=1;i<ordered.length;i++){
    const p=ordered[i-1],q=ordered[i],a=Date.parse(p.at),b=Date.parse(q.at);
    if(b<=anchor)continue;
    if(a>end)break;
    if(!valid(p)||!valid(q)||p.boot_id!==q.boot_id||q.sequence<=p.sequence||b-a<=0||b-a>10000||a>cursor)
      return {...base,reason:'Missing, invalid, restarted or non-monotonic current history; establish a new SOC reference'};
    const start=Math.max(a,anchor),dt=(b-start)/1000;
    const ia=p.current_a!+(q.current_a!-p.current_a!)*(start-a)/(b-a),ib=q.current_a!;
    // Integrate positive and negative portions separately if the sign changes.
    const parts=ia*ib<0?(()=>{const fraction=Math.abs(ia)/(Math.abs(ia)+Math.abs(ib));return [[ia,0,dt*fraction],[0,ib,dt*(1-fraction)]];})():[[ia,ib,dt]];
    for(const [x,y,seconds] of parts){const mean=(x+y)/2;ah+=mean*seconds/3600*(mean>0?reference.charge_efficiency:1);}
    const recentStart=Math.max(start,end-60000);
    if(b>recentStart){const ra=p.current_a!+(q.current_a!-p.current_a!)*(recentStart-a)/(b-a);recent.push({seconds:(b-recentStart)/1000,amps:(ra+ib)/2});}
    covered+=dt;cursor=b;
  }
  if(cursor!==end)return {...base,reason:'No continuous current history from the SOC reference'};
  if(ah<0||ah>reference.capacity_ah)return {...base,reason:'Integrated charge is outside the declared capacity; review the reference/capacity and re-anchor'};
  const seconds=recent.reduce((n,r)=>n+r.seconds,0);
  const mean=seconds?recent.reduce((n,r)=>n+r.amps*r.seconds,0)/seconds:null;
  const soc=100*ah/reference.capacity_ah;
  const remaining=Math.max(0,ah-reference.capacity_ah*reference.reserve_pct/100);
  const tte=seconds>=10&&mean!==null&&mean<0?remaining/(-mean)*60:null;
  return {...base,quality:'estimated',soc_pct:soc,remaining_ah:ah,mean_net_current_a:mean,
    tte_minutes:tte,as_of:last.at,covered_seconds:covered,
    reason:reference.reference_basis==='assumed_reference'?'Estimate uses an explicitly assumed initial SOC':'Estimate uses the recorded SOC reference',
    tte_reason:tte!==null?'At the recent mean net discharge current, to the configured SOC reserve':seconds<10?'Need at least 10 seconds of recent validated current':'Charging or no net discharge; TTE is not defined'};
}

const text=z.string().trim().min(1).max(2000),date=z.iso.datetime(),nonnegative=z.number().finite().nonnegative();
export const researchRecordSchema=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('weatherproofing'),protocol:text,result:z.enum(['PASS','FAIL','BLOCKED','NOT TESTED']),observations:text,evidence:text}).strict(),
  z.object({kind:z.literal('tamper_trial'),scenario:z.enum(['lid','mount','motion','other']),truth:z.enum(['tamper','normal']),detected:z.boolean(),trial_at:date,evidence:text}).strict(),
  z.object({kind:z.literal('energy_trial'),scope:z.enum(['bench','on_vehicle']),start_at:date,end_at:date,solar_wh:nonnegative.nullable(),wind_wh:nonnegative.nullable(),auxiliary_wh:nonnegative.nullable(),extra_propulsion_wh:nonnegative.nullable(),conditions:text,evidence:text}).strict(),
  z.object({kind:z.literal('latency'),boundary:z.enum(['transmission','end_to_end_age']),sent_at:date,received_at:date,clocks_synchronized:z.boolean(),clock_resolution_ms:z.number().finite().positive(),transport:z.enum(['lte','wifi','usb']),evidence:text}).strict(),
  z.object({kind:z.literal('autonomy'),start_at:date,end_at:date,power_source:z.enum(['battery_only','solar_assisted','external']),endpoint:z.enum(['stopped','depleted','interrupted']),continuous:z.boolean(),evidence:text}).strict(),
  z.object({kind:z.literal('forecast_outcome'),prediction_id:z.uuid(),endpoint_at:date,endpoint_definition:text,evidence:text}).strict(),
]);
export type StudyRecord={id:string;kind:string;created_at:string;payload:any;evidence:string};
const ratio=(a:number,b:number)=>b?a/b:null;
export function researchMetrics(records:StudyRecord[]){
  const trials=records.filter(r=>r.kind==='tamper_trial');let tp=0,tn=0,fp=0,fn=0;
  for(const {payload:p} of trials){if(p.truth==='tamper'){if(p.detected)tp++;else fn++;}else if(p.detected)fp++;else tn++;}
  const weather=records.filter(r=>r.kind==='weatherproofing'),completed=weather.filter(r=>['PASS','FAIL'].includes(r.payload.result));
  const latency=records.filter(r=>r.kind==='latency'&&r.payload.boundary==='transmission'&&r.payload.clocks_synchronized&&r.payload.transport!=='usb')
    .map(r=>Date.parse(r.payload.received_at)-Date.parse(r.payload.sent_at)).filter(x=>finite(x)&&x>=0).sort((a,b)=>a-b);
  const predictions=new Map(records.filter(r=>r.kind==='forecast_prediction').map(r=>[r.id,r]));
  const errors:number[]=[];
  for(const r of records.filter(r=>r.kind==='forecast_outcome')){const p=predictions.get(r.payload.prediction_id);if(!p)continue;
    const actual=(Date.parse(r.payload.endpoint_at)-Date.parse(p.created_at))/60000;
    if(actual>=0&&finite(p.payload.tte_minutes))errors.push(p.payload.tte_minutes-actual);
  }
  const energy=records.filter(r=>r.kind==='energy_trial').map(r=>{const p=r.payload,solarOnly=p.solar_wh===null||p.auxiliary_wh===null?null:p.solar_wh-p.auxiliary_wh;
    const hybrid=p.solar_wh===null||p.wind_wh===null||p.auxiliary_wh===null?null:p.solar_wh+p.wind_wh-p.auxiliary_wh;
    return {id:r.id,scope:p.scope,source:'entered_trial_evidence',solar_only_net_wh:solarOnly,hybrid_net_wh:hybrid,
      vehicle_net_benefit_wh:p.scope==='on_vehicle'&&hybrid!==null&&p.extra_propulsion_wh!==null?hybrid-p.extra_propulsion_wh:null};});
  const autonomy=records.filter(r=>r.kind==='autonomy').map(r=>({id:r.id,duration_minutes:(Date.parse(r.payload.end_at)-Date.parse(r.payload.start_at))/60000,
    qualifies_battery_only:r.payload.power_source==='battery_only'&&r.payload.continuous,
    interpretation:r.payload.power_source!=='battery_only'?'Not battery-only autonomy':!r.payload.continuous?'Interrupted interval':r.payload.endpoint==='depleted'?'Observed defined endpoint':'Observed duration only; not maximum runtime'}));
  return {
    weatherproofing:{sop:'4.1',recorded:weather.length,completed:completed.length,pass_fraction:ratio(completed.filter(r=>r.payload.result==='PASS').length,completed.length),certified:false},
    energy:{sop:'4.2',trials:energy,warning:'Manual trial evidence; bench and on-vehicle boundaries remain separate. Unmeasured wind is not zero.'},
    tamper:{sop:'4.3',n:trials.length,tp,tn,fp,fn,accuracy:ratio(tp+tn,trials.length),precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),specificity:ratio(tn,tn+fp),f1:ratio(2*tp,2*tp+fp+fn)},
    forecasting:{sop:'4.4',n:errors.length,mae_minutes:errors.length?errors.reduce((a,b)=>a+Math.abs(b),0)/errors.length:null,rmse_minutes:errors.length?Math.sqrt(errors.reduce((a,b)=>a+b*b,0)/errors.length):null,model_validated:false},
    resilience:{sop:'4.5',latency:{n:latency.length,mean_ms:latency.length?latency.reduce((a,b)=>a+b,0)/latency.length:null,median_ms:latency.length?(latency[Math.floor((latency.length-1)/2)]+latency[Math.ceil((latency.length-1)/2)])/2:null,p95_ms:latency.length?latency[Math.ceil(.95*latency.length)-1]:null,max_ms:latency.at(-1)??null,source:'entered_clock-qualified_wireless_pairs'},autonomy},
  };
}
