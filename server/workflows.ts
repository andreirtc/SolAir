import type {Express,RequestHandler} from 'express';
import type {Store} from './db';
import type {User} from './auth';
import {paidEnabled,operational,smsMode} from './operations';

export function verificationAvailability() {
  const configured=!!(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_VERIFY_SERVICE_SID);
  return {available:paidEnabled()&&configured,reason:!paidEnabled()?'SMS verification is disabled in this environment. Your preferences can still be saved.':!configured?'The verification service needs administrator configuration.':'Verification is available for approved recipients. Provider charges apply.'};
}

export function workflowRoutes(app:Express,db:Store,auth:RequestHandler) {
  app.get('/api/notification-readiness/:vehicle',auth,async(req:any,res)=>{
    const u=req.user as User;
    const [v]=await db.query('SELECT v.id,a.driver_id,vo.operator_id AS assigned_operator,d.id AS device_id,o.commissioned,o.operator_id FROM vehicles v LEFT JOIN assignments a ON a.vehicle_id=v.id LEFT JOIN vehicle_operators vo ON vo.vehicle_id=v.id LEFT JOIN devices d ON d.vehicle_id=v.id LEFT JOIN device_operation o ON o.device_id=d.id WHERE v.id=? AND v.org_id=?',[req.params.vehicle,u.org_id]);
    if(!v||(u.role==='driver'&&v.driver_id!==u.id))return res.status(403).json({error:'Vehicle access denied'});
    const configured=!!(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_MESSAGING_SERVICE_SID);
    const checks=[{label:'Operational service enabled',complete:operational()&&smsMode()==='live'&&paidEnabled()&&configured},{label:'Device approval recorded',complete:!!v.commissioned}];
    checks.push({label:'Responsible operator matches vehicle assignment',complete:!!(v.assigned_operator&&v.assigned_operator===v.operator_id)});
    const allowed=(process.env.SOLAIR_SMS_TEST_RECIPIENTS||'').split(',').map(s=>s.trim());
    for(const [label,id,roles] of [['Assigned driver',v.driver_id,['driver']],['Responsible operator',v.operator_id,['operator','admin']]] as const){
      const [person]=await db.query('SELECT p.role,c.phone_e164,c.phone_verified_at,c.email_verified_at,c.sms_consent FROM profiles p LEFT JOIN contact_preferences c ON c.user_id=p.id WHERE p.id=? AND p.org_id=?',[id||'',u.org_id]);
      const complete=!!(person&&(roles as readonly string[]).includes(person.role)&&person.phone_e164&&person.phone_verified_at&&person.email_verified_at&&person.sms_consent);
      checks.push({label:label+' contact verified and opted in',complete});
      checks.push({label:label+' approved for commissioning messages',complete:complete&&(process.env.SOLAIR_SMS_COMMISSIONING==='complete'||allowed.includes(person?.phone_e164))});
    }
    res.json({checks,configured_for_future_alerts:checks.every(c=>c.complete),mode:smsMode(),message:'These are saved configuration checks, not proof of handset delivery. Delayed events may notify only the responsible operator. No message is sent by this check.'});
  });
  app.get('/api/setup-readiness',auth,async(req:any,res)=>{
    const u=req.user as User;
    const [profile]=await db.query('SELECT p.name,p.role,p.org_id,o.name AS organization,r.requested_role FROM profiles p JOIN organizations o ON o.id=p.org_id LEFT JOIN registration_preferences r ON r.user_id=p.id WHERE p.id=?',[u.id]);
    const [contact]=await db.query('SELECT phone_e164,phone_verified_at,email_verified_at,sms_consent FROM contact_preferences WHERE user_id=?',[u.id]);
    const vehicles=await db.query("SELECT v.id,v.model,p.name AS operator_name FROM vehicles v JOIN assignments a ON a.vehicle_id=v.id LEFT JOIN vehicle_operators vo ON vo.vehicle_id=v.id LEFT JOIN profiles p ON p.id=vo.operator_id AND p.org_id=v.org_id AND p.role IN ('operator','admin') WHERE v.org_id=? AND a.driver_id=? ORDER BY v.id",[u.org_id,u.id]);
    const tasks=[
      {id:'account',label:'Account created',complete:true,action:'Your sign-in account is available.',page:'Settings',required:true},
      {id:'toda',label:'TODA membership',complete:!u.org_id.startsWith('unassigned-'),action:u.org_id.startsWith('unassigned-')?'Ask your administrator to link your account to the correct TODA.':profile.organization,page:'Settings',required:true},
    ];
    if(profile.requested_role==='operator'&&u.role!=='operator'&&u.role!=='admin')tasks.push({id:'operator-access',label:'Operator access',complete:false,action:'An administrator must confirm operator access. Signup cannot grant fleet permissions.',page:'Settings',required:true});
    if(u.role==='driver'){
      tasks.push({id:'vehicle',label:'Assigned vehicle',complete:vehicles.length>0,action:vehicles.length?vehicles.map(v=>`${v.id} · ${v.model}`).join(', '):'Your administrator or TODA operator must assign your vehicle.',page:'Settings',required:true});
      tasks.push({id:'operator',label:'Responsible operator',complete:vehicles.length>0&&vehicles.every(v=>!!v.operator_name),action:vehicles.length&&vehicles.every(v=>!!v.operator_name)?'An operator is assigned to each of your vehicles.':'Your TODA must assign an operator to your vehicle.',page:'Settings',required:true});
    }
    tasks.push({id:'mobile',label:'Alert contact saved',complete:!!contact?.phone_e164,action:'Manage your mobile number in Contact and SMS preferences.',page:'Settings',required:false});
    if(contact?.sms_consent) {
      tasks.push({id:'email',label:'Email ownership verified',complete:!!contact.email_verified_at,action:'Confirm your email through the configured sign-in service before operational SMS.',page:'Settings',required:false});
      tasks.push({id:'phone',label:'Mobile ownership verified',complete:!!contact.phone_verified_at,action:verificationAvailability().available?'Request and enter the verification code in Settings.':verificationAvailability().reason,page:'Settings',required:false});
    }
    res.json({tasks,assignment_complete:tasks.filter(t=>t.required).every(t=>t.complete),sms_opted_in:!!contact?.sms_consent,verification:verificationAvailability()});
  });
}
