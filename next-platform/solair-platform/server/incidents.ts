import type {Express,RequestHandler} from 'express';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {Store} from './db';
import type {User} from './auth';
import {csvRows} from '../packages/operations';
import {elapsed} from '../packages/device-health';

export function incidentRoutes(app:Express,db:Store,auth:RequestHandler,notify:(org:string)=>void,access:(u:User,id:string)=>Promise<any>) {
  app.get('/api/incidents/:vehicle',auth,async(req:any,res)=>{
    const u=req.user as User;
    if(!await access(u,String(req.params.vehicle)))return res.status(403).json({error:'Vehicle access denied'});
    const mode=z.enum(['hardware','demo']).default('hardware').parse(req.query.mode);
    const records=await db.query('SELECT * FROM alarm_incidents WHERE vehicle_id=? AND org_id=? AND mode=? ORDER BY received_at DESC,id DESC LIMIT 200',[req.params.vehicle,u.org_id,mode]);
    const [count]=await db.query('SELECT COUNT(*) AS total FROM alarm_incidents WHERE vehicle_id=? AND org_id=? AND mode=?',[req.params.vehicle,u.org_id,mode]);
    for(const record of records){
      record.deliveries=await db.query('SELECT id,status,reason,attempts,created_at,updated_at FROM sms_jobs WHERE incident_id=?',[record.id]);
      for(const job of record.deliveries)job.history=await db.query('SELECT status,detail,created_at FROM sms_attempts WHERE job_id=? ORDER BY created_at,id',[job.id]);
      record.updates=await db.query('SELECT h.id,h.action,h.note,h.created_at,p.name AS actor FROM incident_updates h JOIN profiles p ON p.id=h.actor_id WHERE h.incident_id=? ORDER BY h.created_at,h.id',[record.id]);
      const resolved=record.updates.find((h:any)=>h.action==='resolved');
      record.resolved_at=resolved?.created_at||null;
      record.acknowledgment_delay_ms=elapsed(record.received_at,Date.parse(record.ack_at));
      record.resolution_delay_ms=elapsed(record.received_at,Date.parse(record.resolved_at));
      record.reporting_delay_ms=elapsed(record.occurred_at,Date.parse(record.received_at));
    }
    res.set('X-SOLAIR-Export-Limit','200').set('X-SOLAIR-Export-Truncated',Number(count.total)>200?'true':'false');
    if(req.query.format==='csv')return res.type('text/csv').attachment(`solair-incidents-${mode}.csv`).send(csvRows(records.map(({deliveries,updates,...r})=>({...r,exported_at:new Date().toISOString(),delivery_states:JSON.stringify(deliveries),handling_history:JSON.stringify(updates)}))));
    res.json(records);
  });

  for(const action of ['ack','notes','resolve'] as const)app.post('/api/incidents/:id/'+action,auth,async(req:any,res)=>{
    const u=req.user as User;
    if(!['operator','engineer','admin'].includes(u.role))return res.status(403).json({error:'Only authorized fleet staff can handle incidents'});
    const b=(action==='ack'?z.object({note:z.string().trim().max(2000).default('')}):z.object({note:z.string().trim().min(10).max(2000)})).strict().parse(req.body);
    const [incident]=await db.query("SELECT * FROM alarm_incidents WHERE id=? AND org_id=? AND mode='hardware'",[req.params.id,u.org_id]);
    if(!incident||!await access(u,incident.vehicle_id))return res.status(403).json({error:'Incident access denied'});
    const expected=action==='ack'?'open':'acknowledged',next=action==='resolve'?'resolved':'acknowledged',at=new Date().toISOString();
    const updated=await db.transaction(async tx=>{
      const [changed]=await tx.query(action==='ack'?"UPDATE alarm_incidents SET status=?,ack_by=?,ack_at=? WHERE id=? AND status=? RETURNING id":"UPDATE alarm_incidents SET status=? WHERE id=? AND status=? RETURNING id",action==='ack'?[next,u.id,at,incident.id,expected]:[next,incident.id,expected]);
      if(!changed)return false;
      const verb=action==='ack'?'acknowledged':action==='resolve'?'resolved':'note';
      await tx.run('INSERT INTO incident_updates VALUES (?,?,?,?,?,?)',[randomUUID(),incident.id,u.id,verb,b.note,at]);
      const auditId=randomUUID();
      await tx.run('INSERT INTO audit_logs VALUES (?,?,?,?,?,?)',[auditId,u.org_id,u.id,'incident_'+verb,incident.id,at]);
      await tx.run('INSERT INTO activity_details VALUES (?,?)',[auditId,`${incident.vehicle_id}: incident ${verb}. Physical siren sound remains unconfirmed.`]);
      return true;
    });
    if(!updated)return res.status(409).json({error:action==='ack'?'Incident was already handled. Refresh its history.':'Acknowledge the incident before adding notes or resolving it. Resolved incidents cannot be changed.'});
    notify(incident.org_id);res.json({ok:true,status:next});
  });
}
