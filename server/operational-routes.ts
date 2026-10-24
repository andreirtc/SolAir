import express, {type Express, type RequestHandler} from 'express';
import rateLimit from 'express-rate-limit';
import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {Store} from './db';
import {passwordHash,type User} from './auth';
import type {IdentityProvider} from './identity';
import {normalizePhilippineMobile,csvRows} from '../packages/operations';
import {operational,paidEnabled,smsMode} from './operations';
import {administrationRoutes} from './administration';
import {workflowRoutes,verificationAvailability} from './workflows';
import {incidentRoutes} from './incidents';
import {withAccountAdministration,requireActiveAccount} from './account-lifecycle';
import {elapsed} from '../packages/device-health';
const user=(req:any)=>req.user as User;
const timestamp=()=>new Date().toISOString();
const phone=z.string().transform((value,ctx)=>{try{return normalizePhilippineMobile(value);}catch{ctx.addIssue({code:'custom',message:'Use 09XX XXX XXXX or +63 9XX XXX XXXX'});return z.NEVER;}});
export function operationalRoutes(app:Express,db:Store,auth:RequestHandler,identity:IdentityProvider|null,notify:(org:string)=>void,revoke:(id:string)=>void=()=>{}) {
  administrationRoutes(app,db,auth,notify,identity,revoke);
  workflowRoutes(app,db,auth);
  const roles=(...allowed:string[]):RequestHandler=>(req,res,next)=>allowed.includes(user(req).role)?next():void res.status(403).json({error:'This role is not permitted'});
  const restricted=rateLimit({windowMs:3600000,limit:5});
  const access=async(u:User,id:string)=>{
    const [v]=await db.query('SELECT v.*,a.driver_id FROM vehicles v LEFT JOIN assignments a ON a.vehicle_id=v.id WHERE v.id=? AND v.org_id=?',[id,u.org_id]);
    return v&&(u.role!=='driver'||v.driver_id===u.id)?v:null;
  };
  incidentRoutes(app,db,auth,notify,access);
  app.get('/api/operation-status',(_req,res)=>res.json({environment:operational()?'operational':process.env.SOLAIR_ENVIRONMENT||'demo',sms_mode:smsMode(),paid_enabled:paidEnabled(),registration_available:!operational()||!!identity?.registerApplicant}));
  app.post('/api/signup',rateLimit({windowMs:3600000,limit:5}),async(req,res)=>{
    const b=z.object({name:z.string().trim().min(1).max(80),email:z.email().transform(s=>s.toLowerCase()),password:z.string().min(12).max(200),confirmation:z.string(),phone:phone,sms_consent:z.boolean(),requested_role:z.enum(['driver','operator']).default('driver'),vehicle_brand:z.enum(['BEMAC','NWOW']).nullable().default(null)}).strict().refine(v=>v.password===v.confirmation,{message:'Passwords must match'}).parse(req.body);
    if((await db.query('SELECT id FROM profiles WHERE email=?',[b.email])).length)return res.status(409).json({error:'An account already exists. Sign in or recover your password.'});
    if(operational()&&!identity?.registerApplicant)return res.status(503).json({error:'Account creation needs configured email authentication'});
    const providerId=identity?.registerApplicant?await identity.registerApplicant(b.email,b.password):null;
    const id=providerId||randomUUID(),org='unassigned-'+id,now=timestamp();
    const verified=!!(providerId&&identity?.emailVerified&&await identity.emailVerified(providerId));
    await db.transaction(async tx=>{
      // A private empty workspace satisfies the existing organization boundary.
      // Public registration never joins a TODA or assigns an existing vehicle.
      await tx.run('INSERT INTO organizations(id,name) VALUES (?,?)',[org,'No TODA assigned']);
      await tx.run('INSERT INTO profiles(id,org_id,email,name,role,password_hash) VALUES (?,?,?,?,?,?)',[id,org,b.email,b.name,'driver',providerId?'supabase-managed':passwordHash(b.password)]);
      await tx.run('INSERT INTO contact_preferences VALUES (?,?,?,?,?,?,?)',[id,b.phone,null,verified?now:null,b.sms_consent?1:0,b.sms_consent?now:null,now]);
      await tx.run('INSERT INTO registration_preferences VALUES (?,?,?)',[id,b.requested_role,now]);
      await tx.run('INSERT INTO profile_registration VALUES (?,?,?)',[id,b.vehicle_brand,b.name]);
      await tx.run('INSERT INTO audit_logs VALUES (?,?,?,?,?,?)',[randomUUID(),org,id,'account_registered',id,now]);
    });
    res.status(201).json({message:providerId?'Account created. Check your email to confirm your address, then sign in.':'Account created. You can now sign in.',email_confirmation_required:!!providerId});
  });
  app.post('/api/access-requests',rateLimit({windowMs:3600000,limit:5}),async(req,res)=>{
    const b=z.object({name:z.string().trim().min(1).max(80),email:z.email().transform(s=>s.toLowerCase()),password:z.string().min(12).max(200),confirmation:z.string(),phone:phone,sms_consent:z.boolean()}).strict().refine(v=>v.password===v.confirmation,{message:'Passwords must match'}).parse(req.body);
    const [existing]=await db.query('SELECT id FROM access_requests WHERE email=?',[b.email]);
    if(!existing){
      if(operational()&&!identity?.registerApplicant)return res.status(503).json({error:'Verified registration needs configured email authentication'});
      const id=identity?.registerApplicant?await identity.registerApplicant(b.email,b.password):null;
      await db.run('INSERT INTO access_requests VALUES (?,?,?,?,?,?,?,?,?,?,?)',[randomUUID(),b.email,b.name,id,id?'supabase-managed':passwordHash(b.password),b.phone,b.sms_consent?1:0,'pending',timestamp(),null,null]);
    }
    res.status(202).json({message:'If eligible, your request awaits email verification and administrator approval. No fleet access has been granted.'});
  });
  app.get('/api/access-requests',auth,roles('admin'),async(_req,res)=>res.json(await db.query('SELECT id,email,name,status,created_at FROM access_requests ORDER BY created_at DESC LIMIT 100')));
  app.post('/api/access-requests/:id/review',auth,roles('admin'),async(req,res)=>{
    const b=z.object({decision:z.enum(['approved','rejected']),role:z.enum(['driver','operator','engineer','admin']),org_id:z.string()}).strict().parse(req.body);
    const u=user(req),[request]=await db.query("SELECT * FROM access_requests WHERE id=? AND status='pending'",[req.params.id]);
    if(!request)return res.status(409).json({error:'Request is unavailable or already reviewed'});
    if(b.decision==='approved'&&(await db.query('SELECT id FROM profiles WHERE email=?',[request.email])).length)return res.status(409).json({error:'This person already registered an account. Do not create a second account from this legacy request.'});
    const verified=!!(request.identity_id&&identity?.emailVerified&&await identity.emailVerified(request.identity_id));
    if(b.decision==='approved'&&operational()&&!verified)return res.status(409).json({error:'Email ownership must be verified before approval'});
    if(!(await db.query('SELECT id FROM organizations WHERE id=?',[b.org_id])).length)return res.status(400).json({error:'Unknown organization'});
    await db.transaction(async tx=>{
      const [claimed]=await tx.query("UPDATE access_requests SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status='pending' RETURNING id",[b.decision,u.id,timestamp(),request.id]);
      if(!claimed)throw new Error('Request changed during review');
      if(b.decision==='approved'){
        const id=request.identity_id||randomUUID();
        await tx.run('INSERT INTO profiles(id,org_id,email,name,role,password_hash) VALUES (?,?,?,?,?,?)',[id,b.org_id,request.email,request.name,b.role,request.password_hash]);
        await tx.run('INSERT INTO contact_preferences VALUES (?,?,?,?,?,?,?)',[id,request.phone_e164,null,verified?timestamp():null,request.sms_consent,request.sms_consent?timestamp():null,timestamp()]);
      }
      await tx.run('INSERT INTO audit_logs VALUES (?,?,?,?,?,?)',[randomUUID(),u.org_id,u.id,'access_request_'+b.decision,request.id,timestamp()]);
    });notify(u.org_id);res.json({ok:true});
  });
  app.get('/api/contact-preferences',auth,async(req,res)=>{
    const u=user(req);
    if(identity?.emailVerified&&await identity.emailVerified(u.id))await db.run('INSERT INTO contact_preferences(user_id,email_verified_at,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET email_verified_at=excluded.email_verified_at',[u.id,timestamp(),timestamp()]);
    const [value]=await db.query('SELECT phone_e164,phone_verified_at,email_verified_at,sms_consent FROM contact_preferences WHERE user_id=?',[u.id]);
    res.json({...value||{phone_e164:'',phone_verified_at:null,email_verified_at:null,sms_consent:0},verification:verificationAvailability()});
  });
  app.patch('/api/contact-preferences',auth,async(req,res)=>{
    const b=z.object({phone:phone,sms_consent:z.boolean()}).strict().parse(req.body),u=user(req);
    await db.run('INSERT INTO contact_preferences(user_id,phone_e164,sms_consent,consent_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET phone_verified_at=CASE WHEN contact_preferences.phone_e164=excluded.phone_e164 THEN contact_preferences.phone_verified_at ELSE NULL END,phone_e164=excluded.phone_e164,sms_consent=excluded.sms_consent,consent_at=excluded.consent_at,updated_at=excluded.updated_at',[u.id,b.phone,b.sms_consent?1:0,b.sms_consent?timestamp():null,timestamp()]);
    res.json({ok:true,message:'Saved. SMS requires both verified contact ownership and consent.'});
  });
  app.post('/api/contact-preferences/email',auth,restricted,async(req,res)=>{
    const b=z.object({email:z.email(),password:z.string().min(1).max(200)}).strict().parse(req.body),u=user(req);
    if(!identity?.requestEmailChange)return res.status(503).json({error:'Email changes require configured verified email delivery'});
    await identity.requestEmailChange(u.email,b.password,b.email.toLowerCase());
    res.json({message:'Email change requested. Follow the provider confirmation emails; your address changes only after verification.'});
  });
  app.post('/api/contact-preferences/verify',auth,restricted,async(req,res)=>{
    const b=z.object({code:z.string().regex(/^\d{4,10}$/).optional()}).strict().parse(req.body);
    if(!paidEnabled())return res.status(503).json({error:'Paid verification is disabled. Contact settings are saved but unverified.'});
    const u=user(req),[contact]=await db.query('SELECT * FROM contact_preferences WHERE user_id=?',[u.id]);
    if(!contact?.phone_e164)return res.status(400).json({error:'Save a mobile number first'});
    const service=process.env.TWILIO_VERIFY_SERVICE_SID,account=process.env.TWILIO_ACCOUNT_SID,secret=process.env.TWILIO_AUTH_TOKEN;
    if(!service||!account||!secret)return res.status(503).json({error:'Verification provider is not configured'});
    const allowed=(process.env.SOLAIR_SMS_TEST_RECIPIENTS||'').split(',').map(s=>s.trim());
    if(process.env.SOLAIR_SMS_COMMISSIONING!=='complete'&&!allowed.includes(contact.phone_e164))return res.status(403).json({error:'This number is not an approved commissioning recipient'});
    const response=await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(service)}/${b.code?'VerificationCheck':'Verifications'}`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(account+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(b.code?{To:contact.phone_e164,Code:b.code}:{To:contact.phone_e164,Channel:'sms'}),signal:AbortSignal.timeout(12000)});
    const data=await response.json();
    if(!response.ok)return res.status(400).json({error:'Verification was not accepted; check the code or try later'});
    let verified=!!(b.code&&data.status==='approved');
    if(verified){const [updated]=await db.query('UPDATE contact_preferences SET phone_verified_at=? WHERE user_id=? AND phone_e164=? RETURNING user_id',[timestamp(),u.id,contact.phone_e164]);verified=!!updated;}
    res.json({verified,message:verified?'Mobile ownership verified':b.code?'Code not approved for the current saved number. Check the code and contact setting.':'Verification requested; delivery is not yet confirmed'});
  });
  app.post('/api/device-operation/:id',auth,roles('engineer','admin'),async(req,res)=>{
    const u=user(req),b=z.object({commissioned:z.boolean(),operator_id:z.string().nullable(),evidence:z.string().trim().min(10).max(2000)}).strict().parse(req.body);
    if(b.commissioned&&u.role!=='admin')return res.status(403).json({error:'Administrator approval is required for operational SMS commissioning'});
    const [device]=await db.query('SELECT * FROM devices WHERE id=?',[req.params.id]);
    if(!device||!(await access(u,device.vehicle_id)))return res.status(403).json({error:'Device access denied'});
    if(b.operator_id&&!(await db.query("SELECT id FROM profiles WHERE id=? AND org_id=? AND role IN ('operator','admin')",[b.operator_id,u.org_id])).length)return res.status(400).json({error:'Choose a responsible operator in this TODA'});
    if(b.commissioned&&!b.operator_id)return res.status(400).json({error:'A responsible operator is required'});
    const [assignedOperator]=await db.query('SELECT operator_id FROM vehicle_operators WHERE vehicle_id=?',[device.vehicle_id]);
    if(b.commissioned&&assignedOperator&&assignedOperator.operator_id!==b.operator_id)return res.status(400).json({error:'Choose the operator assigned to this vehicle in People & assignments'});
    await withAccountAdministration(db,async tx=>{await requireActiveAccount(tx,u.id);if(b.operator_id)await requireActiveAccount(tx,b.operator_id);await tx.run('INSERT INTO device_operation VALUES (?,?,?,?,?) ON CONFLICT(device_id) DO UPDATE SET commissioned=excluded.commissioned,operator_id=excluded.operator_id,evidence=excluded.evidence,updated_at=excluded.updated_at',[device.id,b.commissioned?1:0,b.operator_id,b.evidence,timestamp()]);});
    await db.run('INSERT INTO audit_logs VALUES (?,?,?,?,?,?)',[randomUUID(),u.org_id,u.id,'device_commissioning_changed',device.id,timestamp()]);res.json({ok:true});
  });
  app.get('/api/device-operation/:id',auth,roles('engineer','admin'),async(req,res)=>{
    const [device]=await db.query('SELECT vehicle_id FROM devices WHERE id=?',[req.params.id]);
    if(!device||!await access(user(req),device.vehicle_id))return res.status(403).json({error:'Device access denied'});
    const [value]=await db.query('SELECT * FROM device_operation WHERE device_id=?',[req.params.id]);res.json(value||{commissioned:0,operator_id:null,evidence:''});
  });
  app.get('/api/bench-export/:device',auth,roles('engineer','admin'),async(req,res)=>{
    const [device]=await db.query('SELECT vehicle_id FROM devices WHERE id=?',[req.params.device]);
    if(!device||!await access(user(req),device.vehicle_id))return res.status(403).json({error:'Device access denied'});
    const mode=req.query.mode==='demo'?'demo':'hardware';
    const rows=await db.query('SELECT r.*,s.device_id,s.mode,s.engineer_id FROM bench_results r JOIN bench_sessions s ON s.id=r.session_id WHERE s.device_id=? AND s.mode=? ORDER BY r.created_at DESC LIMIT 5000',[req.params.device,mode]);
    res.set('X-SOLAIR-Export-Limit','5000').type('text/csv').attachment('solair-bench-evidence.csv').send(csvRows(rows));
  });
  app.get('/api/research-export/:vehicle',auth,async(req,res)=>{
    const v=await access(user(req),String(req.params.vehicle));if(!v)return res.status(403).json({error:'Vehicle access denied'});
    const mode=req.query.mode==='demo'?'demo':'hardware';
    const [device]=await db.query('SELECT id FROM devices WHERE vehicle_id=?',[v.id]);
    const records=await db.query('SELECT t.id,t.device_id,t.mode,t.boot_id,t.sequence,t.received_at,t.measured_at,t.payload,c.historical,a.reason AS archived_reason FROM telemetry t LEFT JOIN cpe_samples c ON c.telemetry_id=t.id LEFT JOIN archived_frames a ON a.telemetry_id=t.id WHERE t.device_id=? AND t.mode=? ORDER BY t.received_at DESC,t.id DESC LIMIT 5000',[device?.id||'',mode]);
    const exported=new Date().toISOString();
    const rows=records.map(r=>{
      const t=JSON.parse(r.payload),eventTime=t.event_id?(t.event_timestamp===undefined?t.device_timestamp:t.event_timestamp):null;
      return {vehicle_id:v.id,telemetry_id:r.id,device_id:r.device_id,source:r.mode,mode:r.mode,boot_id:r.boot_id,sequence:r.sequence,exported_at:exported,
        received_at:r.received_at,measured_at:r.measured_at,device_capture_at:t.device_timestamp,device_event_at:eventTime,time_quality:t.device_timestamp?'device_utc':'receipt_only',event_time_quality:eventTime?'device_utc':'unknown',
        capture_to_receipt_ms:elapsed(t.device_timestamp,Date.parse(r.received_at)),event_to_receipt_ms:elapsed(eventTime,Date.parse(r.received_at)),
        historical:r.historical||!!r.archived_reason?1:0,event_id:t.event_id,alarm_id:t.alarm_id,causes:JSON.stringify(t.alarm_causes),alarm_reported:t.alarm_active,siren_feedback:t.cpe?.alarm.feedback??null,
        gps_fix:t.gps_fix,gps_fix_age_at_capture_ms:t.gps_fix_age_ms,latitude:t.latitude,longitude:t.longitude,sensor_health:JSON.stringify(t.sensor_health),sensor_age_at_capture_ms:JSON.stringify(t.sensor_age_ms),
        battery_voltage_v:t.battery_voltage_v,battery_current_a:t.battery_current_a,calibration_status:t.calibration_status,solar_voltage_v:t.solar_voltage_v,solar_current_a:t.solar_current_a,
        meter_source:t.cpe?.meter_source,load_mode:t.cpe?.load_mode,queue_dropped:t.cpe?.queue_dropped,payload:r.payload};
    });
    res.set('X-SOLAIR-Export-Limit','5000').type('text/csv').attachment(`solair-telemetry-${mode}.csv`).send(csvRows(rows));
  });
  app.post('/api/sms/status',express.urlencoded({extended:false}),async(req,res)=>{
    const secret=process.env.TWILIO_AUTH_TOKEN,url=process.env.SOLAIR_PUBLIC_URL;
    if(!paidEnabled()||!secret||!url)return res.sendStatus(403);
    if(req.body.AccountSid!==process.env.TWILIO_ACCOUNT_SID)return res.sendStatus(403);
    const canonical=url+'/api/sms/status'+(req.url.includes('?')?'?'+req.url.split('?')[1]:'');
    const text=canonical+Object.keys(req.body).sort().map(key=>key+req.body[key]).join('');
    const expected=createHmac('sha1',secret).update(text).digest('base64'),supplied=String(req.headers['x-twilio-signature']||'');
    if(expected.length!==supplied.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return res.sendStatus(403);
    const state=String(req.body.MessageStatus),id=String(req.body.MessageSid||'');
    const status=state==='delivered'?'delivered':['failed','undelivered'].includes(state)?'failed':['accepted','queued','sending','sent'].includes(state)?'accepted':null;
    if(status){
      const [job]=await db.query('SELECT * FROM sms_jobs WHERE id=? AND (provider_id=? OR provider_id IS NULL)',[String(req.query.job||''),id]);
      if(job&&job.status!=='delivered'&&!(job.status==='failed'&&status==='accepted')){
        await db.run('UPDATE sms_jobs SET status=?,provider_id=?,reason=?,updated_at=? WHERE id=?',[status,id,'Verified provider status: '+state,timestamp(),job.id]);
        await db.run('INSERT INTO sms_attempts VALUES (?,?,?,?,?)',[randomUUID(),job.id,status,'Verified callback: '+state,timestamp()]);
      }
    }res.sendStatus(204);
  });
}
