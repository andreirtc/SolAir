import type { Express, Request, RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Store } from './db';
import type { User } from './auth';
import { telemetrySchema,sourcePower } from '../packages/telemetry-contract';
import { batteryReferenceSchema,estimateBattery,researchRecordSchema,researchMetrics,type BatterySample,type StudyRecord } from '../packages/research';

type Context={auth:RequestHandler;write:RequestHandler;vehicle:(u:User,id:string)=>Promise<any>;notify:(org:string)=>void;audit:(u:User,action:string,target:string)=>Promise<unknown>};
const user=(r:Request)=>(r as Request&{user:User}).user;
const mode=(r:Request)=>r.query.mode==='demo'?'demo':'hardware';
const now=()=>new Date().toISOString();
function sample(row:any):BatterySample {
  let t;try{t=telemetrySchema.parse(JSON.parse(row.payload));}catch{return {id:row.id,at:row.measured_at,received_at:row.received_at,boot_id:row.boot_id,sequence:row.sequence,current_a:null,voltage_v:null,current_valid:false,voltage_valid:false,historical:false};}
  const qualified=t.source_type==='demo'||t.calibration_status==='calibrated';
  return {id:row.id,at:row.measured_at,received_at:row.received_at,boot_id:t.boot_id,sequence:t.sequence,
    current_a:t.battery_current_a,voltage_v:t.battery_voltage_v,
    current_valid:qualified&&t.battery_current_a!==null&&(!t.cpe||t.cpe.measurements?.battery_current_validated===true),
    voltage_valid:qualified&&t.battery_voltage_v!==null&&(!t.cpe||t.cpe.measurements?.battery_voltage_validated===true),historical:t.cpe?.historical===true};
}
export function registerResearch(app:Express,db:Store,c:Context){
  const resolve=async(req:Request)=>c.vehicle(user(req),String(req.params.id));
  const battery=async(v:any,selectedMode:string)=>{
    const [row]=await db.query('SELECT * FROM battery_references WHERE device_id=? AND mode=? ORDER BY created_at DESC,id DESC LIMIT 1',[v.device_id,selectedMode]);
    const ref=row?batteryReferenceSchema.parse(JSON.parse(row.profile_json)):null;
    if(!ref)return {...estimateBattery(null,[]),reference_id:null,source_type:selectedMode};
    const rows=await db.query('SELECT * FROM telemetry WHERE device_id=? AND mode=? AND id NOT IN (SELECT telemetry_id FROM archived_frames) AND measured_at>=? ORDER BY measured_at ASC,sequence ASC LIMIT 20001',
      [v.device_id,selectedMode,new Date(Date.parse(ref.reference_at)-10000).toISOString()]);
    if(rows.length>20000)return {...estimateBattery(null,[]),reason:'Reference history exceeds the bounded sample window; establish a new reference',reference_id:row.id,source_type:selectedMode};
    return {...estimateBattery(ref,rows.map(sample)),reference_id:row.id,source_type:selectedMode};
  };
  const records=async(v:any,m:string):Promise<StudyRecord[]> => (await db.query('SELECT * FROM research_records WHERE device_id=? AND mode=? ORDER BY created_at ASC,id ASC LIMIT 5001',[v.device_id,m]))
    .map(r=>({...r,payload:JSON.parse(r.payload)}));
  const put=async(v:any,req:Request,kind:string,payload:unknown,evidence:string,predictionId?:string)=>{
    const id=randomUUID(),created_at=now();
    await db.transaction(async tx=>{
      await tx.run('INSERT INTO research_records VALUES (?,?,?,?,?,?,?,?)',[id,v.device_id,mode(req),user(req).id,kind,JSON.stringify(payload),evidence,created_at]);
      if(predictionId)await tx.run('INSERT INTO research_forecast_outcomes VALUES (?,?)',[predictionId,id]);
      await tx.run('INSERT INTO audit_logs VALUES (?,?,?,?,?,?)',[randomUUID(),user(req).org_id,user(req).id,'research_recorded:'+kind,id,created_at]);
    });c.notify(user(req).org_id);return {id,created_at};
  };
  app.get('/api/battery/:id',c.auth,async(req,res)=>{
    const v=await resolve(req);if(!v)return res.status(403).json({error:'Vehicle access denied'});
    res.json(await battery(v,mode(req)));
  });
  app.post('/api/battery/:id/reference',c.auth,c.write,async(req,res)=>{
    const v=await resolve(req);if(!v)return res.status(403).json({error:'Vehicle access denied'});
    const b=batteryReferenceSchema.parse(req.body),at=Date.parse(b.reference_at);
    if(at>Date.now()||Date.now()-at>48*3600000)return res.status(400).json({error:'Reference must be in the past 48 hours; record its actual time'});
    const id=randomUUID(),created=now();
    await db.transaction(async tx=>{
      await tx.run('INSERT INTO battery_references VALUES (?,?,?,?,?,?,?,?)',[id,v.device_id,mode(req),user(req).id,b.reference_at,JSON.stringify(b),b.evidence,created]);
      await tx.run('INSERT INTO audit_logs VALUES (?,?,?,?,?,?)',[randomUUID(),user(req).org_id,user(req).id,'battery_reference_recorded',id,created]);
    });c.notify(user(req).org_id);res.status(201).json({id,quality:'reference_recorded',warning:'Reference does not validate ACS or the SOC/TTE model'});
  });
  app.get('/api/research/:id',c.auth,async(req,res)=>{
    const v=await resolve(req);if(!v)return res.status(403).json({error:'Vehicle access denied'});
    const all=await records(v,mode(req));if(all.length>5000)return res.status(409).json({error:'Study record limit reached; export before starting another study'});
    const measured=await db.query('SELECT * FROM telemetry WHERE device_id=? AND mode=? AND id NOT IN (SELECT telemetry_id FROM archived_frames) ORDER BY measured_at DESC LIMIT 5001',[v.device_id,mode(req)]);
    const rows=measured.slice(0,5000).reverse(),energy:Record<string,any>={};
    for(const channel of ['solar','wind','battery'] as const){let wh=0,seconds=0,excluded=0,previous:{time:number;power:number;boot:string}|null=null;
      for(const r of rows){const s=sample(r);let p:number|null=null;
        if(channel==='battery')p=s.current_valid&&s.voltage_valid?s.current_a!*s.voltage_v!:null;
        else {try{const t=telemetrySchema.parse(JSON.parse(r.payload));if(t.source_type==='demo'||t.calibration_status==='calibrated')p=sourcePower(t,channel);}catch{/* Invalid stored payloads cannot contribute measured energy. */}}
        const time=Date.parse(s.at);
        if(s.historical||p===null||!Number.isFinite(p)||!Number.isFinite(time)){previous=null;continue;}
        if(previous){const dt=time-previous.time;if(dt>0&&dt<=30000&&previous.boot===s.boot_id){wh+=(previous.power+p)/2*dt/3600000;seconds+=dt/1000;}else if(dt>0)excluded+=dt/1000;}
        previous={time,power:p,boot:s.boot_id};
      }
      const window=rows.length>1?(Date.parse(rows.at(-1).measured_at)-Date.parse(rows[0].measured_at))/1000:0;
      energy[channel]={wh:seconds?wh:null,covered_seconds:seconds,excluded_gap_seconds:excluded,excluded_total_seconds:Math.max(0,window-seconds)};
    }
    res.json({source_type:mode(req),generated_at:now(),battery:await battery(v,mode(req)),metrics:researchMetrics(all),records:all,
      recorded_energy:{channels:energy,sample_count:rows.length,truncated:measured.length>5000,boundary:'Latest accepted sample window; solar uses validated MPPT output when commissioned. Battery is signed net terminal energy.',warning:'Wind missing is not zero; coverage differs by channel. No automatic on-vehicle net-benefit or IP65 certification.'},
      implementation:{fsm_states:['DISARMED','ARMED','TRIGGERED'],wireless_remote_security_commands:false,physical_acceptance:false}});
  });
  app.post('/api/research/:id/records',c.auth,c.write,async(req,res)=>{
    const v=await resolve(req);if(!v)return res.status(403).json({error:'Vehicle access denied'});
    const b=researchRecordSchema.parse(req.body),future=Date.now()+1000;
    if('end_at'in b&&(Date.parse(b.end_at)<=Date.parse(b.start_at)||Date.parse(b.end_at)>future))return res.status(400).json({error:'Record an actual completed interval with end after start'});
    if(b.kind==='tamper_trial'&&Date.parse(b.trial_at)>future)return res.status(400).json({error:'Trial time is in the future'});
    if(b.kind==='latency'&&(Date.parse(b.received_at)<Date.parse(b.sent_at)||Date.parse(b.received_at)>future))return res.status(400).json({error:'Invalid send/receipt timing'});
    if(b.kind==='forecast_outcome'){
      const [p]=await db.query("SELECT * FROM research_records WHERE id=? AND device_id=? AND mode=? AND kind='forecast_prediction'",[b.prediction_id,v.device_id,mode(req)]);
      if(!p)return res.status(400).json({error:'Prediction must have been saved by this vehicle/mode before its outcome'});
      if(Date.parse(b.endpoint_at)<Date.parse(p.created_at)||Date.parse(b.endpoint_at)>future)return res.status(400).json({error:'Endpoint must follow the stored prediction and not be in the future'});
      const previous=await db.query("SELECT payload FROM research_records WHERE device_id=? AND mode=? AND kind='forecast_outcome'",[v.device_id,mode(req)]);
      if(previous.some(r=>JSON.parse(r.payload).prediction_id===b.prediction_id))return res.status(409).json({error:'This prediction already has an outcome'});
    }
    try{res.status(201).json(await put(v,req,b.kind,b,b.evidence,b.kind==='forecast_outcome'?b.prediction_id:undefined));}
    catch(e){if(b.kind==='forecast_outcome'&&/unique|duplicate/i.test(String((e as Error).message)))return res.status(409).json({error:'This prediction already has an outcome'});throw e;}
  });
  app.post('/api/research/:id/predictions',c.auth,c.write,async(req,res)=>{
    const v=await resolve(req);if(!v)return res.status(403).json({error:'Vehicle access denied'});
    const {evidence}=z.object({evidence:z.string().trim().min(1).max(2000)}).strict().parse(req.body);
    const estimate=await battery(v,mode(req));
    if(estimate.tte_minutes===null||!estimate.as_of)return res.status(409).json({error:estimate.tte_reason,reason:estimate.reason});
    const minutes=Math.max(0,estimate.tte_minutes-(Date.now()-Date.parse(estimate.as_of))/60000);
    res.status(201).json(await put(v,req,'forecast_prediction',{...estimate,tte_minutes:minutes,issued_at:now()},evidence));
  });
}
