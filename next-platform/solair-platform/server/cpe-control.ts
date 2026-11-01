import {randomUUID} from 'node:crypto';
import type {Store} from './db';
import type {Telemetry} from '../packages/telemetry-contract';
export type RemoteAction='arm'|'disarm'|'siren_test';
export class CpeControlError extends Error {constructor(public status:number,message:string){super(message);}}
export class CpeControls {
 constructor(private db:Store){}
 async status(device:string){
  const [row]=await this.db.query("SELECT payload,received_at FROM telemetry WHERE device_id=? AND mode='hardware' AND id NOT IN (SELECT telemetry_id FROM archived_frames) ORDER BY received_at DESC LIMIT 1",[device]);
  const t:Telemetry|null=row?JSON.parse(row.payload):null;
  const capable=t?.cpe?.remote_control?.enabled===true&&t.transport==='lte';
  const age=row?Date.now()-Date.parse(row.received_at):Infinity;
  const fresh=age>=0&&age<30000&&t?.cpe?.historical===false;
  await this.db.run("UPDATE cpe_commands SET status='expired',completed_at=? WHERE device_id=? AND status='pending' AND expires_at<=?",[new Date().toISOString(),device,new Date().toISOString()]);
  const [command]=await this.db.query('SELECT id,command,status,created_at,expires_at,completed_at FROM cpe_commands WHERE device_id=? ORDER BY created_at DESC LIMIT 1',[device]);
  return {capable,fresh,boot_id:t?.boot_id??null,command:command??null};
 }
 async enqueue(device:string,actor:string,action:RemoteAction,id:string=randomUUID()){
  return this.db.transaction(async tx=>{
   const service=new CpeControls(tx),s=await service.status(device);
   const [old]=await tx.query('SELECT * FROM cpe_commands WHERE id=?',[id]);
   if(old){if(old.device_id!==device||old.command!==action||old.requested_by!==actor)throw new CpeControlError(409,'Command identity conflict');return {id,status:old.status};}
   if(!s.capable)throw new CpeControlError(409,'Upload the remote-control firmware, then wait for its LTE report');
   if(!s.fresh)throw new CpeControlError(409,'Wait for fresh LTE telemetry before sending a command');
   const created=new Date().toISOString(),expires=new Date(Date.now()+60000).toISOString();
   await tx.run("UPDATE cpe_commands SET status='superseded',completed_at=? WHERE device_id=? AND status='pending'",[created,device]);
   await tx.run('INSERT INTO cpe_commands VALUES (?,?,?,?,?,?,?,?,?)',[id,device,s.boot_id,action,actor,created,expires,'pending',null]);
   return {id,status:'pending'};
  });
 }
 async exchange(t:Telemetry){
  if(t.source_type!=='hardware'||t.transport!=='lte'||!t.cpe?.remote_control?.enabled||t.cpe.historical)return null;
  const now=new Date().toISOString(),r=t.cpe.remote_control;
  if(r.last_id&&r.last_result&&r.last_command)await this.db.run("UPDATE cpe_commands SET status=?,completed_at=? WHERE id=? AND device_id=? AND boot_id=? AND command=? AND status='pending' AND expires_at>?",[r.last_result,now,r.last_id,t.device_id,t.boot_id,r.last_command,now]);
  await this.db.run("UPDATE cpe_commands SET status='expired',completed_at=? WHERE device_id=? AND status='pending' AND (expires_at<=? OR boot_id<>?)",[now,t.device_id,now,t.boot_id]);
  const [c]=await this.db.query("SELECT * FROM cpe_commands WHERE device_id=? AND boot_id=? AND status='pending' AND expires_at>? ORDER BY created_at DESC LIMIT 1",[t.device_id,t.boot_id,now]);
  return c?{id:c.id,command:c.command,device_id:t.device_id,boot_id:t.boot_id,expires_at:Math.floor(Date.parse(c.expires_at)/1000)}:null;
 }
}
