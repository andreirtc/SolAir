import type {Express,RequestHandler} from 'express';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {Store} from './db';
import type {User} from './auth';
import type {IdentityProvider} from './identity';

export class AccountActionError extends Error{constructor(public status:number,message:string){super(message);}}
const queues=new WeakMap<Store,Promise<void>>();
export async function withAccountAdministration<T>(db:Store,fn:(tx:Store)=>Promise<T>):Promise<T>{
 const previous=queues.get(db)||Promise.resolve();let release!:()=>void;
 const next=new Promise<void>(resolve=>release=resolve);queues.set(db,next);await previous;
 try{return await db.transaction(async tx=>{await tx.run('UPDATE account_admin_guard SET revision=revision+1 WHERE id=1');return fn(tx);});}
 finally{release();if(queues.get(db)===next)queues.delete(db);}
}
export async function requireActiveAccount(db:Store,id:string){
 const [person]=await db.query('SELECT p.*,COALESCE(s.active,1) AS account_active,COALESCE(s.deletion_pending,0) AS deletion_pending FROM profiles p LEFT JOIN account_states s ON s.user_id=p.id WHERE p.id=?',[id]);
 if(!person||!Number(person.account_active)||Number(person.deletion_pending))throw new AccountActionError(409,'This account is inactive or pending deletion. Refresh the account directory.');
 return person;
}
async function record(tx:Store,u:User,person:any,action:string,reason:string){
 const id=randomUUID();await tx.run('INSERT INTO audit_logs VALUES (?,?,?,?,?,?)',[id,person.org_id,u.id,action,person.id,new Date().toISOString()]);
 await tx.run('INSERT INTO activity_details VALUES (?,?)',[id,`${person.name} (${person.email}): ${reason}`]);
}
async function checkedTarget(tx:Store,u:User,id:string,email:string){
 const actor=await requireActiveAccount(tx,u.id);if(actor.role!=='admin')throw new AccountActionError(403,'Administrator access required');
 const [person]=await tx.query('SELECT p.*,COALESCE(s.active,1) AS account_active,COALESCE(s.deletion_pending,0) AS deletion_pending FROM profiles p LEFT JOIN account_states s ON s.user_id=p.id WHERE p.id=?',[id]);
 if(!person)throw new AccountActionError(404,'Account not found. Refresh the directory.');
 if(person.id===u.id)throw new AccountActionError(403,'You cannot deactivate or delete your own administrator account.');
 if(person.email.toLowerCase()!==email.toLowerCase())throw new AccountActionError(409,'Confirmation email does not match this account. Refresh and check the selected person.');
 if(person.role==='admin'){
  const [others]=await tx.query("SELECT COUNT(*) AS total FROM profiles p LEFT JOIN account_states s ON s.user_id=p.id WHERE p.role='admin' AND p.id<>? AND COALESCE(s.active,1)=1 AND COALESCE(s.deletion_pending,0)=0",[person.id]);
  if(Number(others.total)<1)throw new AccountActionError(409,'The last active administrator cannot be removed.');
 }
 return person;
}
async function historyExists(tx:Store,id:string){
 for(const [table,column] of [['security_events','ack_by'],['help_requests','driver_id'],['messages','sender_id'],['bench_sessions','engineer_id'],['calibrations','engineer_id'],['vehicle_images','uploaded_by'],['alarm_incidents','ack_by'],['sms_jobs','user_id'],['incident_updates','actor_id']]){
  if((await tx.query(`SELECT 1 FROM ${table} WHERE ${column}=? LIMIT 1`,[id])).length)return true;
 }
 return false;
}
export function accountLifecycleRoutes(app:Express,db:Store,auth:RequestHandler,identity:IdentityProvider|null,notify:(org:string)=>void,revoke:(id:string)=>void){
 const admin:RequestHandler=(req:any,res,next)=>req.user.role==='admin'?next():void res.status(403).json({error:'Administrator access required'});
 const confirmation=z.object({confirmation_email:z.email(),reason:z.string().trim().min(5).max(500)});
 app.post('/api/admin/people/:id/status',auth,admin,async(req:any,res)=>{
  const b=confirmation.extend({active:z.boolean()}).strict().parse(req.body),u=req.user as User;
  const person=await withAccountAdministration(db,async tx=>{
   const p=await checkedTarget(tx,u,req.params.id,b.confirmation_email);
   if(Number(p.deletion_pending))throw new AccountActionError(409,'Deletion has already started. Complete or retry the deletion; this account cannot be reactivated.');
   await tx.run('INSERT INTO account_states(user_id,active,deletion_pending,reason,updated_at) VALUES(?,?,0,?,?) ON CONFLICT(user_id) DO UPDATE SET active=excluded.active,reason=excluded.reason,updated_at=excluded.updated_at',[p.id,b.active?1:0,b.reason,new Date().toISOString()]);
   await tx.run('DELETE FROM sessions WHERE user_id=?',[p.id]);
   if(!b.active){
    await tx.run('DELETE FROM assignments WHERE driver_id=?',[p.id]);
    await tx.run('DELETE FROM vehicle_operators WHERE operator_id=?',[p.id]);
    await tx.run('UPDATE device_operation SET commissioned=0,operator_id=NULL WHERE operator_id=?',[p.id]);
    await tx.run("UPDATE sms_jobs SET status='suppressed',reason='Account deactivated',updated_at=? WHERE user_id=? AND status='queued'",[new Date().toISOString(),p.id]);
   }
   await record(tx,u,p,b.active?'account_reactivated':'account_deactivated',b.reason);return p;
  });
  revoke(person.id);notify(person.org_id);res.json({ok:true,message:b.active?'Account reactivated. Vehicle and operator assignments must be reviewed separately.':'Account deactivated. Sessions ended and active assignments removed. Saved history is preserved.'});
 });
 app.delete('/api/admin/people/:id',auth,admin,async(req:any,res)=>{
  const b=confirmation.strict().parse(req.body),u=req.user as User;
  const person=await withAccountAdministration(db,async tx=>{
   const p=await checkedTarget(tx,u,req.params.id,b.confirmation_email);
   if(Number(p.account_active))throw new AccountActionError(409,'Deactivate this account before permanently deleting it.');
   if(await historyExists(tx,p.id))throw new AccountActionError(409,'This account has saved operational history and cannot be permanently deleted. Keep it deactivated to preserve those records.');
   if(identity&&!identity.removeUser)throw new AccountActionError(409,'The identity provider does not support account deletion. Keep the account deactivated.');
   await tx.run('UPDATE account_states SET deletion_pending=1,reason=?,updated_at=? WHERE user_id=?',[b.reason,new Date().toISOString(),p.id]);
   await tx.run('DELETE FROM sessions WHERE user_id=?',[p.id]);
   await record(tx,u,p,'account_deletion_requested',b.reason);return p;
  });
  revoke(person.id);notify(person.org_id);
  try{if(identity)await identity.removeUser!(person.id);}
  catch{throw new AccountActionError(502,'Identity deletion could not be confirmed. The account remains inactive and pending deletion. Retry the deletion after the service is available.');}
  await withAccountAdministration(db,async tx=>{
   const p=await checkedTarget(tx,u,person.id,b.confirmation_email);
   if(Number(p.account_active)||!Number(p.deletion_pending)||await historyExists(tx,p.id))throw new AccountActionError(409,'Account changed during deletion. It remains inactive; refresh and review its history.');
   // Preserve administrative evidence even when the authentication profile is removed.
   const former=`Former account: ${p.name}`;
   await tx.run('INSERT INTO activity_details(audit_id,description) SELECT id,? FROM audit_logs WHERE user_id=? ON CONFLICT(audit_id) DO UPDATE SET description=activity_details.description || ?',[former,p.id,' · '+former]);
   await tx.run('UPDATE audit_logs SET user_id=NULL WHERE user_id=?',[p.id]);
   await tx.run('DELETE FROM contact_preferences WHERE user_id=?',[p.id]);
   await tx.run('DELETE FROM invitations WHERE email=?',[p.email]);
   await record(tx,u,p,'account_deleted',b.reason);
   await tx.run('DELETE FROM profiles WHERE id=?',[p.id]);
  });
  notify(person.org_id);res.json({ok:true,message:'Account permanently deleted. Administrative activity records were retained.'});
 });
}
